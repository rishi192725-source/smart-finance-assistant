from fastapi import FastAPI, Depends, HTTPException, Header
from pydantic import BaseModel
from typing import List, Optional
import pandas as pd
import numpy as np
from sklearn.ensemble import GradientBoostingRegressor
from sklearn.metrics import mean_absolute_error
import os

app = FastAPI()

INTERNAL_API_SECRET = os.getenv("INTERNAL_API_SECRET", "default_secret_for_development")

def verify_token(authorization: Optional[str] = Header(None)):
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Unauthorized")
    token = authorization.split("Bearer ")[1]
    if token != INTERNAL_API_SECRET:
        raise HTTPException(status_code=401, detail="Unauthorized")

class PredictRequest(BaseModel):
    historical_monthly_totals: List[float]

def create_features(data: List[float]):
    df = pd.DataFrame({"y": data})
    df["lag_1"] = df["y"].shift(1)
    df["lag_2"] = df["y"].shift(2)
    df["lag_3"] = df["y"].shift(3)
    df["rolling_mean_3"] = df["lag_1"].rolling(window=3).mean()
    df = df.dropna().reset_index(drop=True)
    return df

@app.post("/api/ml/predict", dependencies=[Depends(verify_token)])
async def predict_spending(req: PredictRequest):
    data = req.historical_monthly_totals
    
    # Validation
    if not data or len(data) < 5:
        # Not enough data for lag-3 + rolling mean + train/test split
        raise HTTPException(status_code=400, detail="Insufficient data for ML model. Minimum 5 months required.")

    # Create features
    df = create_features(data)
    
    if len(df) < 2:
        raise HTTPException(status_code=400, detail="Insufficient data after feature engineering.")

    # We use Gradient Boosting because it handles non-linear patterns well,
    # but we limit depth to prevent overfitting on small datasets.
    # Time-series chronological split for validation
    
    # Train on all except the last row for validation
    train_df = df.iloc[:-1]
    test_df = df.iloc[-1:]

    features = ["lag_1", "lag_2", "lag_3", "rolling_mean_3"]
    
    X_train = train_df[features]
    y_train = train_df["y"]
    
    X_test = test_df[features]
    y_test = test_df["y"]
    
    model = GradientBoostingRegressor(n_estimators=50, max_depth=3, random_state=42)
    model.fit(X_train, y_train)
    
    # Evaluate MAE on chronological test set
    val_pred = model.predict(X_test)
    mae = mean_absolute_error(y_test, val_pred)
    
    # Now retrain on ALL available data to predict the NEXT (unknown) month
    X_full = df[features]
    y_full = df["y"]
    model.fit(X_full, y_full)
    
    # Create feature row for the next month
    last_y = data[-1]
    last_2_y = data[-2]
    last_3_y = data[-3]
    last_3_mean = np.mean([last_y, last_2_y, last_3_y])
    
    next_X = pd.DataFrame([{
        "lag_1": last_y,
        "lag_2": last_2_y,
        "lag_3": last_3_y,
        "rolling_mean_3": last_3_mean
    }])
    
    prediction = model.predict(next_X)[0]
    
    # Prevent negative predictions
    prediction = max(0.0, float(prediction))
    
    return {
        "status": "success",
        "data": {
            "prediction": round(prediction, 2),
            "method": "gradient_boosting",
            "fallbackUsed": False,
            "evaluation_metric": f"MAE: {round(mae, 2)}",
            "num_observations": len(data)
        }
    }

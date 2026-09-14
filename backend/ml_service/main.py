from fastapi import FastAPI, Depends, UploadFile, File, Form
from pydantic import BaseModel
from typing import List

from core.security import get_api_key
from services.ocr import extract_receipt_data
from models.categorization import categorizer
from models.anomaly import detect_anomaly
from models.prediction import predict_spending
from models.intent import parse_intent

app = FastAPI(title="Smart Finance ML Service")

# 1. OCR Endpoint
@app.post("/api/ml/ocr", dependencies=[Depends(get_api_key)])
async def ocr_endpoint(file: UploadFile = File(...)):
    contents = await file.read()
    data = extract_receipt_data(contents)
    return {"status": "success", "data": data}

# 2. Categorization Endpoint
class CategorizeRequest(BaseModel):
    description: str
    amount: float

@app.post("/api/ml/categorize", dependencies=[Depends(get_api_key)])
async def categorize_endpoint(req: CategorizeRequest):
    cat, conf = categorizer.predict(req.description)
    if conf < 0.6:
        cat = None
    return {"status": "success", "category": cat, "confidence": conf}

# 3. Anomaly Detection Endpoint
class AnomalyRequest(BaseModel):
    amount: float
    historical_amounts: List[float]

@app.post("/api/ml/anomaly", dependencies=[Depends(get_api_key)])
async def anomaly_endpoint(req: AnomalyRequest):
    result = detect_anomaly(req.amount, req.historical_amounts)
    return {"status": "success", "data": result}

# 4. Spending Prediction Endpoint
class PredictionRequest(BaseModel):
    historical_monthly_totals: List[float]

@app.post("/api/ml/predict", dependencies=[Depends(get_api_key)])
async def predict_endpoint(req: PredictionRequest):
    result = predict_spending(req.historical_monthly_totals)
    return {"status": "success", "data": result}

# 5. Intent Parser Endpoint
class IntentRequest(BaseModel):
    query: str

@app.post("/api/ml/parse-intent", dependencies=[Depends(get_api_key)])
async def parse_intent_endpoint(req: IntentRequest):
    result = parse_intent(req.query)
    return {"status": "success", "data": result}

@app.get("/health")
def health_check():
    return {"status": "ok"}

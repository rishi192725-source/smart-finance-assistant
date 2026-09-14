import numpy as np

def predict_spending(historical_monthly_totals: list[float]) -> dict:
    if len(historical_monthly_totals) < 2:
        return {
            "prediction": None,
            "reason": "INSUFFICIENT_HISTORY"
        }
        
    # 1. 3-Month Weighted Moving Average (WMA)
    # Give higher weights to recent months, e.g., [1, 2, 3]
    recent_totals = historical_monthly_totals[-3:]
    weights = [i + 1 for i in range(len(recent_totals))]
    total_weight = sum(weights)
    
    wma = sum(val * weight for val, weight in zip(recent_totals, weights)) / total_weight
    
    # 2. Linear Trendline
    # Calculate slope over the entire provided history to capture momentum
    x = np.arange(len(historical_monthly_totals))
    y = np.array(historical_monthly_totals)
    slope, _ = np.polyfit(x, y, 1)
    
    # 3. Combine and constrain
    final_prediction = wma + slope
    final_prediction = max(0.0, round(float(final_prediction), 2))
    
    return {
        "prediction": final_prediction,
        "reason": "SUCCESS",
        "trend_slope": round(float(slope), 2)
    }

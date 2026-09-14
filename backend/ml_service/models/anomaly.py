import numpy as np

def detect_anomaly(amount: float, historical_amounts: list[float]) -> dict:
    if len(historical_amounts) < 5:
        # Not enough history to detect statistical anomaly safely
        return {"is_anomaly": False, "score": 0.0, "reason": "INSUFFICIENT_HISTORY"}
        
    mean = np.mean(historical_amounts)
    std = np.std(historical_amounts)
    
    if std == 0:
        if amount > mean * 2:
            return {"is_anomaly": True, "score": 1.0, "reason": "High variance from constant history"}
        return {"is_anomaly": False, "score": 0.0}
        
    z_score = (amount - mean) / std
    
    # We consider z-score > 2.5 (99% percentile) as anomaly for high spending
    # For a finance app, we mostly care if they spent WAY more than usual
    if z_score > 2.5:
        return {"is_anomaly": True, "score": float(z_score), "reason": f"Amount is significantly higher than usual (Z-Score: {z_score:.2f})"}
        
    return {"is_anomaly": False, "score": float(z_score)}

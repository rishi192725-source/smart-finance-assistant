import numpy as np

historical_monthly_totals = [310, 420, 510]

recent_totals = historical_monthly_totals[-3:]
weights = [i + 1 for i in range(len(recent_totals))]
total_weight = sum(weights)

wma = sum(val * weight for val, weight in zip(recent_totals, weights)) / total_weight

x = np.arange(len(historical_monthly_totals))
y = np.array(historical_monthly_totals)
slope, _ = np.polyfit(x, y, 1)

final_prediction = wma + slope
final_prediction = max(0.0, round(float(final_prediction), 2))

print(f"WMA: {wma}, Slope: {slope}, Prediction: {final_prediction}")

fetch('http://localhost:8000/api/ml/predict', {
  method: 'POST',
  headers: {
    'Authorization': 'Bearer default_secret_for_development',
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({ historical_monthly_totals: [100.0, 150.0, 200.0] })
})
.then(res => res.json())
.then(console.log)
.catch(console.error);

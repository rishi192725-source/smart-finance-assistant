const express = require('express');
const app = express();

app.use(express.json());

// Verify Auth Middleware
app.use((req, res, next) => {
  const auth = req.headers.authorization;
  if (!auth || auth !== 'Bearer default_secret_for_development') {
    return res.status(401).json({ detail: 'Could not validate credentials' });
  }
  next();
});

// Mock OCR (multipart/form-data)
app.post('/api/ml/ocr', (req, res) => {
  // It normally takes a file, but we just mock the return
  setTimeout(() => {
    res.json({
      status: 'success',
      data: { text: 'dummy', amount: 16.50, merchant: 'SHOP NAME', date: '' }
    });
  }, 1000);
});

// Mock Categorize
app.post('/api/ml/categorize', (req, res) => {
  const { description } = req.body;
  if (description === 'McDonalds') {
    res.json({ status: 'success', category: 'Food', confidence: 0.95 });
  } else {
    res.json({ status: 'success', category: null, confidence: 0.2 });
  }
});

// Mock Anomaly
app.post('/api/ml/anomaly', (req, res) => {
  const { amount, historical_amounts } = req.body;
  if (amount > 1000) {
    res.json({ status: 'success', data: { is_anomaly: true, score: 3.5, reason: 'Amount is significantly higher than usual' } });
  } else {
    res.json({ status: 'success', data: { is_anomaly: false, score: 0.1 } });
  }
});

// Mock Predict
app.post('/api/ml/predict', (req, res) => {
  const { historical_monthly_totals } = req.body;
  if (!historical_monthly_totals || historical_monthly_totals.length < 2) {
    res.json({ status: 'success', data: { prediction: null, reason: 'INSUFFICIENT_HISTORY' } });
  } else {
    res.json({ status: 'success', data: { prediction: 500, reason: 'SUCCESS' } });
  }
});

// Mock Intent Parser
app.post('/api/ml/parse-intent', (req, res) => {
  const { query } = req.body;
  const q = query.toLowerCase();
  
  if (q.includes('spend on food')) {
    res.json({ status: 'success', data: { intent: 'category_spending', category: 'Food' } });
  } else {
    res.json({ status: 'success', data: { intent: 'unsupported', reason: "I don't understand that query yet." } });
  }
});

app.listen(8000, () => {
  console.log('Mock ML Service listening on port 8000');
});

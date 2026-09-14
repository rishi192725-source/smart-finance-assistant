const token = process.argv[2];

fetch('http://localhost:5000/api/v1/ml/predict', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({ categoryId: 'non-existent-id' })
})
.then(res => res.json())
.then(console.log)
.catch(console.error);

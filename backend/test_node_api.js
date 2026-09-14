const token = "YOUR_TOKEN"; // I'll get a real token

fetch('http://localhost:3000/api/v1/ml/predict', {
  method: 'POST',
  headers: {
    'Authorization': 'Bearer ' + process.env.TOKEN,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({})
})
.then(res => res.json())
.then(console.log)
.catch(console.error);

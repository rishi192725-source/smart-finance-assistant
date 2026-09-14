const token = process.argv[2];

fetch('http://localhost:5000/api/v1/accounts', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    name: 'Savings',
    type: 'SAVINGS',
    balance: 1000
  })
})
.then(res => res.json())
.then(console.log)
.catch(console.error);

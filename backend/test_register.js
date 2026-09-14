fetch('http://localhost:5000/api/v1/auth/register', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({ name: 'Test User', email: 'test_register@test.com', password: 'password123' })
})
.then(res => res.text())
.then(console.log)
.catch(console.error);

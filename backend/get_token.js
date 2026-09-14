fetch('http://localhost:5000/api/v1/auth/login', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ email: 'test_register@test.com', password: 'password123' })
})
.then(res => res.json())
.then(data => console.log(JSON.stringify(data)))
.catch(console.error);

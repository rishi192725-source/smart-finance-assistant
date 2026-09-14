const token = process.argv[2];

fetch('http://localhost:5000/api/v1/accounts', {
  headers: { 'Authorization': `Bearer ${token}` }
})
.then(res => res.json())
.then(data => {
  console.log(JSON.stringify(data, null, 2));
})
.catch(console.error);

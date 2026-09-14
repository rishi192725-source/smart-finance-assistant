const token = process.argv[2];

fetch('http://localhost:5000/api/v1/accounts', {
  headers: { 'Authorization': `Bearer ${token}` }
})
.then(res => res.json())
.then(async data => {
  const accounts = data.data.accounts;
  console.log('Accounts:', accounts);
  
  if (accounts.length >= 2) {
    const payload = {
      type: 'TRANSFER',
      amount: 10,
      description: 'Test transfer',
      accountId: accounts[0].id,
      toAccountId: accounts[1].id,
      transactionDate: new Date().toISOString()
    };
    
    console.log('Sending payload:', payload);
    
    const res = await fetch('http://localhost:5000/api/v1/transactions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    });
    const result = await res.json();
    console.log('Transaction response:', result);
  } else {
    console.log('Not enough accounts to test transfer.');
  }
})
.catch(console.error);

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const API_URL = 'http://localhost:5000/api/v1';

async function runTests() {
  console.log('--- Phase 3 Transaction & Dashboard Tests ---');

  // 1. Setup user and get token
  let token = '';
  let userId = '';
  let accountId1 = '';
  let accountId2 = '';
  let categoryId = '';

  try {
    const testEmail = `test_${Date.now()}@example.com`;
    console.log('User not found, registering...');
    const regRes = await fetch(`${API_URL}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: testEmail, password: 'password123', firstName: 'Test3' })
    });
    const data = await regRes.json();
    token = data.data.accessToken;
    userId = data.data.user.id;

    console.log('✅ Auth successful');

    // 2. Create Accounts
    const acc1Res = await fetch(`${API_URL}/accounts`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ name: 'Checking A', type: 'CHECKING', balance: 1000 })
    });
    accountId1 = (await acc1Res.json()).data.account.id;

    const acc2Res = await fetch(`${API_URL}/accounts`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ name: 'Savings B', type: 'SAVINGS', balance: 500 })
    });
    accountId2 = (await acc2Res.json()).data.account.id;

    console.log('✅ Accounts created');

    // 3. Create Category
    const catRes = await fetch(`${API_URL}/categories`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ name: 'Groceries', type: 'EXPENSE' })
    });
    categoryId = (await catRes.json()).data.category.id;

    console.log('✅ Category created');

    // 4. Test Transaction Creation (Expense)
    const tx1Res = await fetch(`${API_URL}/transactions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({
        accountId: accountId1,
        categoryId,
        type: 'EXPENSE',
        amount: 100,
        transactionDate: new Date().toISOString()
      })
    });
    
    if (!tx1Res.ok) {
        console.error('Tx1 creation failed:', await tx1Res.text());
        return;
    }

    const tx1 = (await tx1Res.json()).data.transaction;
    
    // Check balance
    const check1 = await prisma.account.findUnique({ where: { id: accountId1 } });
    if (Number(check1.balance) === 900) console.log('✅ Expense balance updated atomically');
    else console.error('❌ Expense balance mismatch:', check1.balance);

    // 5. Test Transaction Creation (Transfer)
    const tx2Res = await fetch(`${API_URL}/transactions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({
        accountId: accountId1,
        toAccountId: accountId2,
        type: 'TRANSFER',
        amount: 200,
        transactionDate: new Date().toISOString()
      })
    });
    
    if (!tx2Res.ok) {
        console.error('Tx2 creation failed:', await tx2Res.text());
        return;
    }
    
    const tx2 = (await tx2Res.json()).data.transaction;

    // Check balances
    const check1_after = await prisma.account.findUnique({ where: { id: accountId1 } });
    const check2_after = await prisma.account.findUnique({ where: { id: accountId2 } });
    
    if (Number(check1_after.balance) === 700 && Number(check2_after.balance) === 700) {
      console.log('✅ Transfer balances updated atomically');
    } else {
      console.error('❌ Transfer balance mismatch:', check1_after.balance, check2_after.balance);
    }

    // 6. Test Dashboard Summary
    const summaryRes = await fetch(`${API_URL}/dashboard/summary`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    const summary = (await summaryRes.json()).data;
    if (summary.totalBalance === 1400 && summary.totalExpense === 100) {
      console.log('✅ Dashboard summary correct');
    } else {
      console.error('❌ Dashboard summary mismatch:', summary);
    }

    // 7. Test invalid transfer (same account)
    const txInvalidRes = await fetch(`${API_URL}/transactions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({
        accountId: accountId1,
        toAccountId: accountId1,
        type: 'TRANSFER',
        amount: 10,
        transactionDate: new Date().toISOString()
      })
    });
    if (txInvalidRes.status === 400) {
       console.log('✅ Same-account transfer properly rejected');
    } else {
       console.error('❌ Same-account transfer incorrectly processed', txInvalidRes.status);
    }

    console.log('--- Tests completed ---');
  } catch (error) {
    console.error('Test script failed:', error);
  } finally {
    await prisma.$disconnect();
  }
}

runTests();

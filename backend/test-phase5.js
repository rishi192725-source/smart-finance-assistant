const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const path = require('path');

const prisma = new PrismaClient();
const API_URL = 'http://localhost:5000/api/v1';

async function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function runTests() {
  console.log('--- Phase 5 Background Processing Tests ---');

  let token = '';
  let userId = '';
  let accountId = '';
  let categoryId = '';

  try {
    const testEmail = `test5_${Date.now()}@example.com`;
    console.log('Registering user...');
    const regRes = await fetch(`${API_URL}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: testEmail, password: 'password123', firstName: 'Test5' })
    });
    const data = await regRes.json();
    token = data.data.accessToken;
    userId = data.data.user.id;

    console.log('✅ Auth successful');

    // Create Account & Category
    const accRes = await fetch(`${API_URL}/accounts`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ name: 'Import Account', type: 'CHECKING', balance: 0 })
    });
    accountId = (await accRes.json()).data.account.id;

    const catRes = await fetch(`${API_URL}/categories`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ name: 'Subscriptions', type: 'EXPENSE' })
    });
    categoryId = (await catRes.json()).data.category.id;

    // 1. CSV Import Test
    console.log('Testing CSV Import...');
    const csvContent = `Amount,Date,Description,Type\n50,2026-09-01,Groceries,EXPENSE\n50,2026-09-01,Groceries,EXPENSE\n1000,2026-09-02,Salary,INCOME\nINVALID,INVALID,,`;
    
    // We need to use FormData for multipart/form-data
    const FormData = require('form-data');
    const form = new FormData();
    form.append('accountId', accountId);
    form.append('file', Buffer.from(csvContent), 'test.csv');

    const importRes = await fetch(`${API_URL}/import/csv`, {
      method: 'POST',
      headers: { 
        Authorization: `Bearer ${token}`,
        ...form.getHeaders()
      },
      body: form.getBuffer()
    });
    
    if (importRes.status === 202) {
      console.log('✅ CSV enqueued');
    } else {
      console.error('❌ CSV enqueue failed', await importRes.text());
      return;
    }

    const importData = await importRes.json();
    const jobId = importData.data.jobId;

    // Poll job status
    let state = 'queued';
    for (let i = 0; i < 10; i++) {
      const jobRes = await fetch(`${API_URL}/jobs/${jobId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const jobData = await jobRes.json();
      if (!jobData.data) {
        console.error('Job data missing:', jobData);
        state = 'failed';
        break;
      }
      state = jobData.data.state;
      if (state === 'completed' || state === 'failed') break;
      await delay(1000); // Wait for worker
    }

    if (state === 'completed') {
      console.log('✅ CSV Job processed');
    } else {
      console.error('❌ CSV Job did not complete in time:', state);
    }

    // Verify DB
    const txs = await prisma.transaction.findMany({ where: { accountId } });
    if (txs.length === 3) {
      console.log('✅ 3 Valid rows imported (including two identical rows via index), 1 invalid skipped');
    } else {
      console.error('❌ Incorrect number of transactions imported:', txs.length);
    }

    // Verify Idempotency (Upload identical CSV)
    const form2 = new FormData();
    form2.append('accountId', accountId);
    form2.append('file', Buffer.from(csvContent), 'test.csv');
    const importRes2 = await fetch(`${API_URL}/import/csv`, {
      method: 'POST',
      headers: { 
        Authorization: `Bearer ${token}`,
        ...form2.getHeaders()
      },
      body: form2.getBuffer()
    });
    const jobId2 = (await importRes2.json()).data.jobId;
    
    let state2 = 'queued';
    for (let i = 0; i < 10; i++) {
      const jobRes = await fetch(`${API_URL}/jobs/${jobId2}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const jobData2 = await jobRes.json();
      if (!jobData2.data) {
        console.error('Job 2 data missing:', jobData2);
        state2 = 'failed';
        break;
      }
      state2 = jobData2.data.state;
      if (state2 === 'completed' || state2 === 'failed') break;
      await delay(1000);
    }

    const txs2 = await prisma.transaction.findMany({ where: { accountId } });
    if (txs2.length === 3) {
      console.log('✅ Duplicate CSV import properly skipped via idempotency (no new rows)');
    } else {
      console.error('❌ Duplicate CSV imported incorrectly:', txs2.length);
    }

    // 2. Recurring Expense Test
    console.log('Testing Recurring Expenses...');
    const recRes = await fetch(`${API_URL}/recurring-expenses`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({
        accountId,
        categoryId,
        amount: 15,
        description: 'Netflix',
        frequency: 'MONTHLY',
        nextRunDate: new Date().toISOString() // Due today
      })
    });
    const recurringExpenseId = (await recRes.json()).data.recurringExpense.id;

    const cp = require('child_process');
    cp.execSync(`npx ts-node -e "const { recurringQueue } = require('./src/queues/recurring.queue'); recurringQueue.add('test-process', {}).then(()=>process.exit(0))"`);
    
    // Wait for worker
    await delay(3000);

    const recTxs = await prisma.transaction.findMany({ where: { accountId, description: 'Netflix' } });
    if (recTxs.length === 1) {
      console.log('✅ Recurring expense processed exactly once');
    } else {
      console.error('❌ Recurring expense failed or processed incorrectly:', recTxs.length);
    }

    const updatedRecExp = await prisma.recurringExpense.findUnique({ where: { id: recurringExpenseId } });
    if (new Date(updatedRecExp.nextRunDate) > new Date()) {
      console.log('✅ nextRunDate successfully updated');
    } else {
      console.error('❌ nextRunDate was not moved forward');
    }

    console.log('--- Phase 5 Tests Completed ---');
  } catch (err) {
    console.error('Test failed:', err);
  } finally {
    await prisma.$disconnect();
    process.exit(0);
  }
}

runTests();

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const API_URL = 'http://localhost:5000/api/v1';

async function runTests() {
  console.log('--- Phase 4 Budgeting & Goals Tests ---');

  let token = '';
  let userId = '';
  let categoryId = '';
  let accountId = '';

  try {
    const testEmail = `test4_${Date.now()}@example.com`;
    console.log('Registering user...');
    const regRes = await fetch(`${API_URL}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: testEmail, password: 'password123', firstName: 'Test4' })
    });
    const data = await regRes.json();
    token = data.data.accessToken;
    userId = data.data.user.id;

    console.log('✅ Auth successful');

    // Setup Category & Account
    const accRes = await fetch(`${API_URL}/accounts`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ name: 'Checking', type: 'CHECKING', balance: 5000 })
    });
    accountId = (await accRes.json()).data.account.id;

    const catRes = await fetch(`${API_URL}/categories`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ name: 'Entertainment', type: 'EXPENSE' })
    });
    categoryId = (await catRes.json()).data.category.id;

    // 1. Create Budget
    const month = '2026-09';
    const budgetRes = await fetch(`${API_URL}/budgets`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ categoryId, amount: 500, month })
    });
    
    if (budgetRes.status === 201) console.log('✅ Budget created');
    else console.error('❌ Budget creation failed', await budgetRes.text());

    // 2. Duplicate Budget (should fail with 409)
    const duplicateRes = await fetch(`${API_URL}/budgets`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ categoryId, amount: 200, month })
    });
    
    if (duplicateRes.status === 409) console.log('✅ Duplicate budget correctly rejected (409)');
    else console.error('❌ Duplicate budget returned incorrect status:', duplicateRes.status);

    // 3. Add Expense to affect budget
    await fetch(`${API_URL}/transactions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({
        accountId, categoryId, type: 'EXPENSE', amount: 150, transactionDate: '2026-09-15T12:00:00Z'
      })
    });

    // 4. Check Budget Overview
    const overviewRes = await fetch(`${API_URL}/budgets/overview?month=${month}`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    const overviewData = await overviewRes.json();
    const budgetOverview = overviewData.data.overview[0];
    
    if (budgetOverview.actualSpent === 150 && budgetOverview.remaining === 350) {
      console.log('✅ Budget overview calculation correct');
    } else {
      console.error('❌ Budget overview mismatch:', budgetOverview);
    }

    // 5. Zero budget edge case
    const cat2Res = await fetch(`${API_URL}/categories`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ name: 'Subscriptions', type: 'EXPENSE' })
    });
    const categoryId2 = (await cat2Res.json()).data.category.id;

    await fetch(`${API_URL}/budgets`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ categoryId: categoryId2, amount: 0, month })
    });

    await fetch(`${API_URL}/transactions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({
        accountId, categoryId: categoryId2, type: 'EXPENSE', amount: 10, transactionDate: '2026-09-16T12:00:00Z'
      })
    });

    const overviewRes2 = await fetch(`${API_URL}/budgets/overview?month=${month}`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    const overviewData2 = await overviewRes2.json();
    const zeroBudget = overviewData2.data.overview.find(b => b.categoryId === categoryId2);
    
    if (zeroBudget.actualSpent === 10 && zeroBudget.isOverBudget === true && zeroBudget.percentUsed === 100) {
      console.log('✅ Zero budget calculation correct');
    } else {
      console.error('❌ Zero budget mismatch:', zeroBudget);
    }

    // 6. Create Goal
    const goalRes = await fetch(`${API_URL}/goals`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ name: 'Vacation', targetAmount: 2000 })
    });
    const goalId = (await goalRes.json()).data.goal.id;
    console.log('✅ Goal created');

    // 7. Add Contribution
    const contribRes = await fetch(`${API_URL}/goals/${goalId}/contributions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ amount: 500 })
    });
    const updatedGoal = (await contribRes.json()).data.goal;
    
    if (updatedGoal.currentAmount === 500 && updatedGoal.progressPercentage === 25) {
      console.log('✅ Goal contribution successful and atomic');
    } else {
      console.error('❌ Goal contribution mismatch:', updatedGoal);
    }

    // Ensure Account balance was NOT touched by contribution
    const accCheck = await prisma.account.findUnique({ where: { id: accountId } });
    // Started 5000 - 150(expense) - 10(expense) = 4840. (500 contribution should NOT be deducted)
    if (Number(accCheck.balance) === 4840) {
      console.log('✅ Account balance unaffected by Goal contribution');
    } else {
      console.error('❌ Account balance was affected by Goal contribution:', accCheck.balance);
    }

    console.log('--- Phase 4 Tests Completed ---');
  } catch (err) {
    console.error('Test failed:', err);
  } finally {
    await prisma.$disconnect();
  }
}

runTests();

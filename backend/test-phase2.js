const BASE_URL = 'http://localhost:5000/api/v1';

async function req(path, method, body, cookieHeader, authHeader) {
  const headers = { 'Content-Type': 'application/json' };
  if (cookieHeader) headers['Cookie'] = cookieHeader;
  if (authHeader) headers['Authorization'] = authHeader;
  
  const options = { method, headers };
  if (body) options.body = JSON.stringify(body);
  
  const res = await fetch(BASE_URL + path, options);
  const data = await res.json().catch(() => null);
  return { status: res.status, data };
}

async function runTests() {
  console.log('Registering User A...');
  let resA = await req('/auth/register', 'POST', { email: 'usera@example.com', password: 'password123', firstName: 'User A' });
  const tokenA = resA.data?.data?.accessToken;
  const authA = `Bearer ${tokenA}`;

  console.log('Registering User B...');
  let resB = await req('/auth/register', 'POST', { email: 'userb@example.com', password: 'password123', firstName: 'User B' });
  const tokenB = resB.data?.data?.accessToken;
  const authB = `Bearer ${tokenB}`;

  console.log('\n--- Categories ---');
  let catRes = await req('/categories', 'GET', null, null, authA);
  const categoriesA = catRes.data?.data?.categories;
  console.log('User A Default Categories Count:', categoriesA?.length);
  const foodCategoryA = categoriesA.find(c => c.name === 'Food');
  
  let newCatRes = await req('/categories', 'POST', { name: 'Custom', type: 'EXPENSE' }, null, authA);
  const customCatAId = newCatRes.data?.data?.category?.id;
  console.log('User A creates custom category:', newCatRes.status);
  
  let crossCatRes = await req(`/categories/${customCatAId}`, 'PATCH', { name: 'Hacked' }, null, authB);
  console.log('User B attempts to patch User A category (should fail):', crossCatRes.status);

  console.log('\n--- Accounts ---');
  let accRes = await req('/accounts', 'POST', { name: 'Bank of A', type: 'CHECKING', balance: 1000 }, null, authA);
  const accAId = accRes.data?.data?.account?.id;
  console.log('User A creates account:', accRes.status);

  let crossAccRes = await req(`/accounts/${accAId}`, 'GET', null, null, authB);
  console.log('User B attempts to get User A account (should fail):', crossAccRes.status);

  console.log('\n--- Transactions ---');
  let txnRes = await req('/transactions', 'POST', { 
    accountId: accAId, 
    categoryId: foodCategoryA.id, 
    type: 'EXPENSE', 
    amount: 10.50, 
    description: 'Lunch', 
    transactionDate: new Date().toISOString() 
  }, null, authA);
  console.log('User A creates transaction:', txnRes.status);

  let crossTxnRes = await req('/transactions', 'POST', {
    accountId: accAId, // User A's account!
    categoryId: foodCategoryA.id,
    type: 'EXPENSE',
    amount: 50,
    transactionDate: new Date().toISOString()
  }, null, authB);
  console.log('User B attempts to create transaction in User A account (should fail):', crossTxnRes.status);

  console.log('\n--- Budgets ---');
  let budRes = await req('/budgets', 'POST', { categoryId: foodCategoryA.id, amount: 200, month: '2023-10' }, null, authA);
  console.log('User A creates budget:', budRes.status);

  console.log('\n--- Goals ---');
  let goalRes = await req('/goals', 'POST', { name: 'Vacation', targetAmount: 5000 }, null, authA);
  console.log('User A creates goal:', goalRes.status);
  
  let patchGoalRes = await req(`/goals/${goalRes.data.data.goal.id}`, 'PATCH', { currentAmount: 1000 }, null, authA);
  console.log('User A updates goal:', patchGoalRes.status);

  console.log('\n--- Recurring Expenses ---');
  let recRes = await req('/recurring-expenses', 'POST', {
    accountId: accAId,
    categoryId: foodCategoryA.id,
    amount: 50,
    frequency: 'MONTHLY',
    nextRunDate: new Date().toISOString()
  }, null, authA);
  console.log('User A creates recurring expense:', recRes.status);
}

runTests().catch(console.error);

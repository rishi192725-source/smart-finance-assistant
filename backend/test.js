const BASE_URL = 'http://localhost:5000/api/v1';

async function req(path, method, body, cookieHeader, authHeader) {
  const headers = { 'Content-Type': 'application/json' };
  if (cookieHeader) headers['Cookie'] = cookieHeader;
  if (authHeader) headers['Authorization'] = authHeader;
  
  const options = { method, headers };
  if (body) options.body = JSON.stringify(body);
  
  const res = await fetch(BASE_URL + path, options);
  const data = await res.json().catch(() => null);
  let cookies = '';
  if (res.headers.get('set-cookie')) {
    cookies = res.headers.get('set-cookie').split(';')[0];
  }
  return { status: res.status, data, cookies, headers: res.headers };
}

async function runTests() {
  let accessToken = '';
  let cookieHeader = '';

  console.log('--- Testing Registration ---');
  let res = await req('/auth/register', 'POST', { email: 'test@example.com', password: 'password123', firstName: 'Tester' });
  console.log('Register (valid):', res.status);
  
  res = await req('/auth/register', 'POST', { email: 'test@example.com', password: 'password123', firstName: 'Tester' });
  console.log('Register (duplicate):', res.status);

  res = await req('/auth/register', 'POST', { email: 'invalid', password: '123', firstName: 'T' });
  console.log('Register (invalid data):', res.status);

  console.log('\n--- Testing Login ---');
  res = await req('/auth/login', 'POST', { email: 'test@example.com', password: 'wrongpassword' });
  console.log('Login (incorrect password):', res.status);

  res = await req('/auth/login', 'POST', { email: 'test@example.com', password: 'password123' });
  console.log('Login (successful):', res.status);
  
  if (res.data && res.data.data) accessToken = res.data.data.accessToken;
  if (res.cookies) cookieHeader = res.cookies;

  console.log('\n--- Testing /auth/me ---');
  res = await req('/auth/me', 'GET', null, null, `Bearer ${accessToken}`);
  console.log('/me (valid token):', res.status);

  res = await req('/auth/me', 'GET', null, null, `Bearer invalidtoken`);
  console.log('/me (invalid token):', res.status);

  res = await req('/auth/me', 'GET');
  console.log('/me (no token):', res.status);

  console.log('\n--- Testing Refresh ---');
  res = await req('/auth/refresh', 'POST', null, cookieHeader);
  console.log('Refresh (valid cookie):', res.status);
  if (res.status === 200) {
    if (res.data && res.data.data) accessToken = res.data.data.accessToken;
    if (res.cookies) cookieHeader = res.cookies;
  }

  res = await req('/auth/refresh', 'POST', null, 'refreshToken=invalid');
  console.log('Refresh (invalid cookie):', res.status);

  console.log('\n--- Testing Logout ---');
  res = await req('/auth/logout', 'POST', null, cookieHeader);
  console.log('Logout:', res.status);

  res = await req('/auth/refresh', 'POST', null, cookieHeader);
  console.log('Refresh (after logout):', res.status);
}

runTests().catch(console.error);

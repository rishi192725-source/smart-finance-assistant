const FormData = require('form-data');
const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const path = require('path');

const prisma = new PrismaClient();
const BASE_URL = 'http://localhost:5000/api/v1';

let authToken = '';
let testUserId = '';
let catId = '';

const delay = ms => new Promise(resolve => setTimeout(resolve, ms));

async function runTests() {
  console.log('--- Phase 6 ML Service & OCR Tests ---');

  // 1. Setup Data
  const timestamp = Date.now();
  const email = `test-ml-${timestamp}@example.com`;
  
  console.log('Registering user...');
  const regRes = await fetch(`${BASE_URL}/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password: 'password123' })
  });
  const regData = await regRes.json();
  authToken = regData.data.accessToken;
  testUserId = regData.data.user.id;

  // Create account & category
  await fetch(`${BASE_URL}/accounts`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${authToken}` },
    body: JSON.stringify({ name: 'Checking', type: 'CHECKING', balance: 5000 })
  });
  
  const catRes = await fetch(`${BASE_URL}/categories`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${authToken}` },
    body: JSON.stringify({ name: 'Food', type: 'EXPENSE' })
  });
  const catDataResp = await catRes.json();
  if (!catDataResp.data || !catDataResp.data.category) {
    throw new Error(`Failed to create category: ${JSON.stringify(catDataResp)}`);
  }
  catId = catDataResp.data.category.id;

  // 2. Test ML Categorization (Sync)
  console.log('\nTesting ML Categorization...');
  const catResp = await fetch(`${BASE_URL}/ml/categorize`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${authToken}` },
    body: JSON.stringify({ description: 'McDonalds', amount: 15 })
  });
  const catData = await catResp.json();
  if (catData?.category === 'Food') {
    console.log('✅ Categorization mapped McDonalds to Food successfully');
  } else {
    console.error('❌ Categorization failed', catData);
  }

  // 3. Test NLP Intent Parser (Sync)
  console.log('\nTesting NLP Intent Parser...');
  
  const nlp1 = await (await fetch(`${BASE_URL}/ml/ask`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${authToken}` },
    body: JSON.stringify({ query: 'How much did I spend on Food?' })
  })).json();
  
  if (nlp1.data.intent.intent === 'category_spending' && nlp1.data.answer.includes('You have spent $0 on Food')) {
    console.log('✅ NLP Intent parsing correctly handled "spend on Food" (0 spent so far)');
  } else {
    console.error('❌ NLP Category Spending failed', nlp1);
  }

  const nlpUnsupported = await (await fetch(`${BASE_URL}/ml/ask`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${authToken}` },
    body: JSON.stringify({ query: 'Can you give me investment advice?' })
  })).json();
  
  if (nlpUnsupported.data.answer === "I don't understand that query yet.") {
    console.log('✅ NLP Unsupported Intent failed safely as required');
  } else {
    console.error('❌ NLP Unsupported failed', nlpUnsupported);
  }

  // 4. Test Spending Prediction (Insufficient History)
  console.log('\nTesting Spending Prediction (Insufficient History fallback)...');
  const predResp = await fetch(`${BASE_URL}/ml/predict`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${authToken}` },
    body: JSON.stringify({ categoryId: catId })
  });
  const predData = await predResp.json();
  if (predData.data.reason === 'INSUFFICIENT_HISTORY') {
    console.log('✅ Prediction gracefully handled insufficient history');
  } else {
    console.error('❌ Prediction fallback failed', predData);
  }

  // 5. Test Anomaly Detection Insight Generation (Async)
  console.log('\nTesting Anomaly Detection Insight...');
  
  // Need to seed some history first to trigger standard deviation logic (needs >=5 transactions)
  console.log('Seeding transaction history...');
  const accountId = (await prisma.account.findFirst({ where: { userId: testUserId }})).id;
  
  for (let i = 0; i < 5; i++) {
    await prisma.transaction.create({
      data: {
        userId: testUserId,
        accountId: accountId,
        categoryId: catId,
        type: 'EXPENSE',
        amount: 20,
        description: 'Normal lunch',
        transactionDate: new Date()
      }
    });
  }
  
  // Now create a huge transaction via the API to trigger the anomaly queue
  await fetch(`${BASE_URL}/transactions`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${authToken}` },
    body: JSON.stringify({
      accountId: accountId,
      categoryId: catId,
      type: 'EXPENSE',
      amount: 1500, // Very anomalous compared to 20
      description: 'Extravagant Dinner',
      transactionDate: new Date()
    })
  });

  // Wait for worker
  await delay(3000);
  
  const insights = await prisma.insight.findMany({ where: { userId: testUserId } });
  if (insights.length > 0 && insights[0].type === 'ANOMALY') {
    console.log('✅ Node worker correctly generated Anomaly Insight in database via FastAPI inference');
  } else {
    console.error('❌ Anomaly Insight not generated', insights);
  }

  // 6. Test OCR Job (Async)
  // For the OCR test to work reliably without a real image or waiting for Tesseract,
  // we will just upload a dummy text file to ensure the BullMQ flow and polling works.
  // Wait, pytesseract requires a valid image. We can create a tiny blank 1x1 image in memory.
  console.log('\nTesting OCR BullMQ Flow...');
  
  // 1x1 blank PNG base64
  const blankPng = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=', 'base64');
  
  const form = new FormData();
  form.append('file', blankPng, { filename: 'receipt.png', contentType: 'image/png' });
  
  const ocrRes = await fetch(`${BASE_URL}/ml/ocr`, {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${authToken}`, ...form.getHeaders() },
    body: form.getBuffer()
  });
  
  const ocrData = await ocrRes.json();
  const jobId = ocrData.data.jobId;
  
  if (jobId) {
    console.log('✅ OCR Job enqueued successfully');
  }
  
  // Poll
  let ocrCompleted = false;
  for (let i = 0; i < 5; i++) {
    await delay(2000);
    const pollRes = await fetch(`${BASE_URL}/ml/ocr/${jobId}`, {
      headers: { 'Authorization': `Bearer ${authToken}` }
    });
    const pollData = await pollRes.json();
    if (pollData.data.state === 'completed') {
       ocrCompleted = true;
       console.log('✅ OCR Worker successfully processed image via FastAPI');
       break;
    }
  }
  
  if (!ocrCompleted) {
    console.error('❌ OCR job did not complete in time');
  }

  console.log('\n--- Phase 6 Tests Completed ---');
}

runTests().catch(console.error).finally(async () => {
  await prisma.$disconnect();
});

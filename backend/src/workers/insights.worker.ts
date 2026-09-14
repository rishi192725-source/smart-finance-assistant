import { Worker, Job } from 'bullmq';
import { connection } from '../config/redis';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export const insightsWorker = new Worker(
  'insights-processing',
  async (job: Job) => {
    const { transactionId, userId, amount, categoryId } = job.data;
    
    const ML_SERVICE_URL = process.env.ML_SERVICE_URL || 'http://localhost:8000';
    const INTERNAL_API_SECRET = process.env.INTERNAL_API_SECRET || 'default_secret_for_development';
    
    // 1. Get historical amounts for this category for this user
    const historicalTxs = await prisma.transaction.findMany({
      where: {
        userId,
        categoryId,
        id: { not: transactionId } // exclude the current one
      },
      select: { amount: true },
      take: 50,
      orderBy: { transactionDate: 'desc' }
    });
    
    const historical_amounts = historicalTxs.map(t => Number(t.amount));
    
    // 2. Call ML Service
    const response = await fetch(`${ML_SERVICE_URL}/api/ml/anomaly`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${INTERNAL_API_SECRET}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        amount: Number(amount),
        historical_amounts
      })
    });
    
    if (!response.ok) {
      console.error(`ML Service anomaly check failed: ${response.statusText}`);
      return;
    }
    
    const result = await response.json();
    
    // 3. Create Insight if anomalous
    if (result.data.is_anomaly) {
      await prisma.insight.create({
        data: {
          userId,
          title: 'Unusual Spending Detected',
          message: result.data.reason,
          type: 'ANOMALY'
        }
      });
    }
    
    return result.data;
  },
  { connection }
);

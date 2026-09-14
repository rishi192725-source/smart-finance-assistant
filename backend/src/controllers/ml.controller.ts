import { Request, Response, NextFunction } from 'express';
import { ocrQueue } from '../queues/ocr.queue';
import { storageService } from '../services/storage.service';
import { AppError } from '../middlewares/errorHandler';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
const ML_SERVICE_URL = process.env.ML_SERVICE_URL || 'http://localhost:8000';
const INTERNAL_API_SECRET = process.env.INTERNAL_API_SECRET || 'default_secret_for_development';

export const uploadReceipt = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user!.userId;
    if (!req.file) {
      return next(new AppError('No receipt image uploaded', 400));
    }
    const filePath = await storageService.saveTempFile(req.file.buffer, req.file.originalname);
    const job = await ocrQueue.add('process-ocr', { filePath, userId });
    res.status(202).json({ status: 'success', data: { jobId: job.id, message: 'OCR started' } });
  } catch (error) {
    next(error);
  }
};

export const getOcrJobStatus = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = req.params.id as string;
    const job = await ocrQueue.getJob(id);
    if (!job) return next(new AppError('Job not found', 404));
    const state = await job.getState();
    const result = job.returnvalue;
    const failedReason = job.failedReason;
    res.status(200).json({ status: 'success', data: { id: job.id, state, result, failedReason } });
  } catch (error) {
    next(error);
  }
};

export const categorizeTransaction = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { description, amount } = req.body;
    if (!description) return next(new AppError('Description is required', 400));

    const response = await fetch(`${ML_SERVICE_URL}/api/ml/categorize`, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${INTERNAL_API_SECRET}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ description, amount: Number(amount) || 0 })
    });

    if (!response.ok) return next(new AppError('ML service error', 500));
    const data = await response.json();
    res.status(200).json(data);
  } catch (error) {
    next(error);
  }
};

export const predictSpending = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user!.userId;
    const categoryId = req.body.categoryId || undefined;
    
    const whereClause: any = { userId, type: 'EXPENSE' };
    if (categoryId) {
      whereClause.categoryId = categoryId;
    }
    
    // Aggregate by month
    const txs = await prisma.transaction.findMany({
      where: whereClause,
      select: { amount: true, transactionDate: true },
      orderBy: { transactionDate: 'asc' }
    });

    const historical_monthly_totals: number[] = [];
    if (txs.length > 0) {
      const monthlyTotals: { [key: string]: number } = {};
      let minMonth = '';
      let maxMonth = '';
      for (const t of txs) {
        const month = t.transactionDate.toISOString().substring(0, 7);
        if (!minMonth) minMonth = month;
        maxMonth = month;
        monthlyTotals[month] = (monthlyTotals[month] || 0) + Number(t.amount);
      }
      
      const start = new Date(`${minMonth}-01T00:00:00Z`);
      const end = new Date(`${maxMonth}-01T00:00:00Z`);
      let current = new Date(start);
      while (current <= end) {
        const month = current.toISOString().substring(0, 7);
        historical_monthly_totals.push(monthlyTotals[month] || 0);
        current.setUTCMonth(current.getUTCMonth() + 1);
      }
    }

    console.log(`[ML Prediction] Sending historical data to Python:`, historical_monthly_totals);

    let predictionData;
    try {
      const response = await fetch(`${ML_SERVICE_URL}/api/ml/predict`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${INTERNAL_API_SECRET}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ historical_monthly_totals })
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error(`[ML Prediction] Service returned ${response.status}:`, errorText);
        throw new Error('ML Service returned an error');
      }

      const responseJson = await response.json();
      predictionData = responseJson.data;
    } catch (error) {
      console.warn('[ML Prediction] Falling back to local calculation due to service failure:', error);
      
      if (historical_monthly_totals.length < 2) {
        predictionData = { prediction: null, reason: 'INSUFFICIENT_HISTORY' };
      } else {
        // Fallback: 3-Month WMA
        const recent_totals = historical_monthly_totals.slice(-3);
        const weights = recent_totals.map((_, i) => i + 1);
        const total_weight = weights.reduce((a, b) => a + b, 0);
        const wma = recent_totals.reduce((sum, val, i) => sum + val * weights[i], 0) / total_weight;

        // Fallback: Linear Trendline
        const n = historical_monthly_totals.length;
        let sumX = 0, sumY = 0, sumXY = 0, sumX2 = 0;
        for (let i = 0; i < n; i++) {
          sumX += i;
          sumY += historical_monthly_totals[i];
          sumXY += i * historical_monthly_totals[i];
          sumX2 += i * i;
        }
        
        let slope = 0;
        const denominator = (n * sumX2 - sumX * sumX);
        if (denominator !== 0) {
          slope = (n * sumXY - sumX * sumY) / denominator;
        }
        
        let final_prediction = wma + slope;
        final_prediction = Math.max(0.0, Math.round(final_prediction * 100) / 100);
        
        predictionData = {
          prediction: final_prediction,
          reason: 'SUCCESS',
          trend_slope: Math.round(slope * 100) / 100
        };
      }
    }

    res.status(200).json({ status: 'success', data: predictionData });
  } catch (error) {
    next(error);
  }
};

export const parseIntent = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user!.userId;
    const { query } = req.body;
    if (!query) return next(new AppError('Query is required', 400));

    const response = await fetch(`${ML_SERVICE_URL}/api/ml/parse-intent`, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${INTERNAL_API_SECRET}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ query })
    });

    if (!response.ok) return next(new AppError('ML service error', 500));
    const intentData = (await response.json()).data;
    
    if (intentData.intent === 'unsupported') {
      return res.status(200).json({ status: 'success', data: { answer: intentData.reason } });
    }

    let answer = '';
    // Safely execute Prisma query based on structured intent
    if (intentData.intent === 'total_spending') {
      const agg = await prisma.transaction.aggregate({
        where: { userId, type: 'EXPENSE' },
        _sum: { amount: true }
      });
      answer = `Your total spending is $${agg._sum.amount || 0}.`;
    } 
    else if (intentData.intent === 'biggest_expense') {
      const maxTx = await prisma.transaction.findFirst({
        where: { userId, type: 'EXPENSE' },
        orderBy: { amount: 'desc' }
      });
      answer = maxTx ? `Your biggest expense was $${maxTx.amount} for ${maxTx.description}.` : 'No expenses found.';
    }
    else if (intentData.intent === 'category_spending') {
      // Find category ID
      const cat = await prisma.category.findFirst({ where: { userId, name: { equals: intentData.category, mode: 'insensitive' } } });
      if (!cat) {
        answer = `You don't have a category called ${intentData.category}.`;
      } else {
        const agg = await prisma.transaction.aggregate({
          where: { userId, categoryId: cat.id, type: 'EXPENSE' },
          _sum: { amount: true }
        });
        answer = `You have spent $${agg._sum.amount || 0} on ${cat.name}.`;
      }
    }
    else if (intentData.intent === 'monthly_savings') {
       // sum income - sum expense
       const inc = await prisma.transaction.aggregate({ where: { userId, type: 'INCOME' }, _sum: { amount: true } });
       const exp = await prisma.transaction.aggregate({ where: { userId, type: 'EXPENSE' }, _sum: { amount: true } });
       const saved = Number(inc._sum.amount || 0) - Number(exp._sum.amount || 0);
       answer = `You have saved $${saved} overall.`;
    }

    res.status(200).json({ status: 'success', data: { answer, intent: intentData } });
  } catch (error) {
    next(error);
  }
};

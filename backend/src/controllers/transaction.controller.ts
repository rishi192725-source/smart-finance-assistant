import { Request, Response, NextFunction } from 'express';
import { transactionService } from '../services/transaction.service';
import { TransactionType } from '@prisma/client';

export const createTransaction = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user!.userId;
    const { accountId, toAccountId, categoryId, type, amount, description, transactionDate } = req.body;
    
    const transaction = await transactionService.createTransaction(
      userId,
      {
        accountId,
        toAccountId,
        categoryId,
        type: type as TransactionType,
        amount,
        description,
        transactionDate: new Date(transactionDate)
      }
    );
    
    // Asynchronously trigger anomaly detection for expenses
    if (transaction.type === 'EXPENSE' && transaction.categoryId) {
      const { insightsQueue } = await import('../queues/insights.queue');
      insightsQueue.add('check-anomaly', {
        transactionId: transaction.id,
        userId: transaction.userId,
        amount: Number(transaction.amount),
        categoryId: transaction.categoryId
      }).catch(console.error); // Do not block response
    }
    
    res.status(201).json({ status: 'success', data: { transaction } });
  } catch (error) {
    next(error);
  }
};

export const getTransactions = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user!.userId;
    const { 
      page, limit, startDate, endDate, accountId, categoryId, type, search, sortBy, sortOrder 
    } = req.query;

    const result = await transactionService.getTransactions(userId, {
      page: page ? parseInt(page as string) : undefined,
      limit: limit ? parseInt(limit as string) : undefined,
      startDate: startDate as string,
      endDate: endDate as string,
      accountId: accountId as string,
      categoryId: categoryId as string,
      type: type as TransactionType,
      search: search as string,
      sortBy: sortBy as string,
      sortOrder: sortOrder as 'asc' | 'desc',
    });
    
    res.status(200).json({ status: 'success', data: result });
  } catch (error) {
    next(error);
  }
};

export const getTransactionById = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user!.userId;
    const id = req.params.id as string;
    const transaction = await transactionService.getTransactionById(userId, id);
    res.status(200).json({ status: 'success', data: { transaction } });
  } catch (error) {
    next(error);
  }
};

export const updateTransaction = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user!.userId;
    const id = req.params.id as string;
    const { accountId, toAccountId, categoryId, type, amount, description, transactionDate } = req.body;
    
    let parsedDate;
    if (transactionDate) {
      parsedDate = new Date(transactionDate);
    }

    const transaction = await transactionService.updateTransaction(userId, id, {
      accountId,
      toAccountId,
      categoryId,
      type: type as TransactionType,
      amount,
      description,
      transactionDate: parsedDate,
    });
    res.status(200).json({ status: 'success', data: { transaction } });
  } catch (error) {
    next(error);
  }
};

export const deleteTransaction = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user!.userId;
    const id = req.params.id as string;
    await transactionService.deleteTransaction(userId, id);
    res.status(200).json({ status: 'success', data: null });
  } catch (error) {
    next(error);
  }
};

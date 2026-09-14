import { Request, Response, NextFunction } from 'express';
import { recurringExpenseService } from '../services/recurringExpense.service';
import { RecurringFrequency } from '@prisma/client';

export const createRecurringExpense = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user!.userId;
    const { accountId, categoryId, amount, description, frequency, nextRunDate } = req.body;
    
    const parsedDate = new Date(nextRunDate);

    const recurringExpense = await recurringExpenseService.createRecurringExpense(
      userId,
      accountId,
      categoryId,
      amount,
      description,
      frequency as RecurringFrequency,
      parsedDate
    );
    res.status(201).json({ status: 'success', data: { recurringExpense } });
  } catch (error) {
    next(error);
  }
};

export const getRecurringExpenses = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user!.userId;
    const recurringExpenses = await recurringExpenseService.getRecurringExpenses(userId);
    res.status(200).json({ status: 'success', data: { recurringExpenses } });
  } catch (error) {
    next(error);
  }
};

export const getRecurringExpenseById = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user!.userId;
    const id = req.params.id as string;
    const recurringExpense = await recurringExpenseService.getRecurringExpenseById(userId, id);
    res.status(200).json({ status: 'success', data: { recurringExpense } });
  } catch (error) {
    next(error);
  }
};

export const updateRecurringExpense = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user!.userId;
    const id = req.params.id as string;
    const { accountId, categoryId, amount, description, frequency, nextRunDate, active } = req.body;
    
    let parsedDate;
    if (nextRunDate) {
      parsedDate = new Date(nextRunDate);
    }

    const recurringExpense = await recurringExpenseService.updateRecurringExpense(userId, id, {
      accountId,
      categoryId,
      amount,
      description,
      frequency,
      nextRunDate: parsedDate,
      active,
    });
    res.status(200).json({ status: 'success', data: { recurringExpense } });
  } catch (error) {
    next(error);
  }
};

export const deleteRecurringExpense = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user!.userId;
    const id = req.params.id as string;
    await recurringExpenseService.deleteRecurringExpense(userId, id);
    res.status(200).json({ status: 'success', data: null });
  } catch (error) {
    next(error);
  }
};

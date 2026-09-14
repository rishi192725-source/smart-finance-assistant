import { Request, Response, NextFunction } from 'express';
import { budgetService } from '../services/budget.service';
import { AppError } from '../middlewares/errorHandler';

export const createBudget = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user!.userId;
    const { categoryId, amount, month } = req.body;
    const budget = await budgetService.createBudget(userId, categoryId, amount, month);
    res.status(201).json({ status: 'success', data: { budget } });
  } catch (error) {
    next(error);
  }
};

export const getBudgets = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user!.userId;
    const { month } = req.query;
    const budgets = await budgetService.getBudgets(userId, { month: month as string });
    res.status(200).json({ status: 'success', data: { budgets } });
  } catch (error) {
    next(error);
  }
};

export const getOverview = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user!.userId;
    const { month } = req.query;
    if (!month || typeof month !== 'string' || !/^\d{4}-(0[1-9]|1[0-2])$/.test(month)) {
      return next(new AppError('Valid month in YYYY-MM format is required', 400));
    }
    const overview = await budgetService.getOverview(userId, month);
    res.status(200).json({ status: 'success', data: { overview } });
  } catch (error) {
    next(error);
  }
};

export const getBudgetById = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user!.userId;
    const id = req.params.id as string;
    const budget = await budgetService.getBudgetById(userId, id);
    res.status(200).json({ status: 'success', data: { budget } });
  } catch (error) {
    next(error);
  }
};

export const updateBudget = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user!.userId;
    const id = req.params.id as string;
    const { categoryId, amount, month } = req.body;
    const budget = await budgetService.updateBudget(userId, id, { categoryId, amount, month });
    res.status(200).json({ status: 'success', data: { budget } });
  } catch (error) {
    next(error);
  }
};

export const deleteBudget = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user!.userId;
    const id = req.params.id as string;
    await budgetService.deleteBudget(userId, id);
    res.status(200).json({ status: 'success', data: null });
  } catch (error) {
    next(error);
  }
};

import { Request, Response, NextFunction } from 'express';
import { dashboardService } from '../services/dashboard.service';

export const getSummary = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user!.userId;
    const { startDate, endDate } = req.query;
    const summary = await dashboardService.getSummary(userId, startDate as string, endDate as string);
    res.status(200).json({ status: 'success', data: summary });
  } catch (error) {
    next(error);
  }
};

export const getExpensesByCategory = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user!.userId;
    const { startDate, endDate } = req.query;
    const expenses = await dashboardService.getExpensesByCategory(userId, startDate as string, endDate as string);
    res.status(200).json({ status: 'success', data: { expenses } });
  } catch (error) {
    next(error);
  }
};

export const getTrends = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user!.userId;
    const { startDate, endDate } = req.query;
    const trends = await dashboardService.getTrends(userId, startDate as string, endDate as string);
    res.status(200).json({ status: 'success', data: { trends } });
  } catch (error) {
    next(error);
  }
};

export const getRecentTransactions = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user!.userId;
    const transactions = await dashboardService.getRecentTransactions(userId);
    res.status(200).json({ status: 'success', data: { transactions } });
  } catch (error) {
    next(error);
  }
};

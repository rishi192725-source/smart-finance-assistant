import { Request, Response, NextFunction } from 'express';
import { goalService } from '../services/goal.service';

export const createGoal = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user!.userId;
    const { name, targetAmount, currentAmount, deadline } = req.body;
    
    let parsedDate;
    if (deadline) {
      parsedDate = new Date(deadline);
    }

    const goal = await goalService.createGoal(userId, name, targetAmount, currentAmount || 0, parsedDate);
    res.status(201).json({ status: 'success', data: { goal } });
  } catch (error) {
    next(error);
  }
};

export const getGoals = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user!.userId;
    const goals = await goalService.getGoals(userId);
    res.status(200).json({ status: 'success', data: { goals } });
  } catch (error) {
    next(error);
  }
};

export const getGoalById = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user!.userId;
    const id = req.params.id as string;
    const goal = await goalService.getGoalById(userId, id);
    res.status(200).json({ status: 'success', data: { goal } });
  } catch (error) {
    next(error);
  }
};

export const updateGoal = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user!.userId;
    const id = req.params.id as string;
    const { name, targetAmount, currentAmount, deadline } = req.body;
    
    let parsedDate;
    if (deadline) {
      parsedDate = new Date(deadline);
    }

    const goal = await goalService.updateGoal(userId, id, { name, targetAmount, currentAmount, deadline: parsedDate });
    res.status(200).json({ status: 'success', data: { goal } });
  } catch (error) {
    next(error);
  }
};

export const deleteGoal = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user!.userId;
    const id = req.params.id as string;
    await goalService.deleteGoal(userId, id);
    res.status(200).json({ status: 'success', data: null });
  } catch (error) {
    next(error);
  }
};

export const addContribution = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user!.userId;
    const id = req.params.id as string;
    const { amount } = req.body;
    
    const goal = await goalService.addContribution(userId, id, amount);
    res.status(200).json({ status: 'success', data: { goal } });
  } catch (error) {
    next(error);
  }
};

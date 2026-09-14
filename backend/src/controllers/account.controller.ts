import { Request, Response, NextFunction } from 'express';
import { accountService } from '../services/account.service';
import { AccountType } from '@prisma/client';

export const createAccount = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user!.userId;
    const { name, type, balance, currency } = req.body;
    const account = await accountService.createAccount(userId, name, type as AccountType, balance, currency || 'INR');
    res.status(201).json({ status: 'success', data: { account } });
  } catch (error) {
    next(error);
  }
};

export const getAccounts = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user!.userId;
    const accounts = await accountService.getAccounts(userId);
    res.status(200).json({ status: 'success', data: { accounts } });
  } catch (error) {
    next(error);
  }
};

export const getAccountById = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user!.userId;
    const id = req.params.id as string;
    const account = await accountService.getAccountById(userId, id);
    res.status(200).json({ status: 'success', data: { account } });
  } catch (error) {
    next(error);
  }
};

export const updateAccount = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user!.userId;
    const id = req.params.id as string;
    const { name, type, balance, currency } = req.body;
    const account = await accountService.updateAccount(userId, id, { name, type, balance, currency });
    res.status(200).json({ status: 'success', data: { account } });
  } catch (error) {
    next(error);
  }
};

export const deleteAccount = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user!.userId;
    const id = req.params.id as string;
    await accountService.deleteAccount(userId, id);
    res.status(200).json({ status: 'success', data: null });
  } catch (error) {
    next(error);
  }
};

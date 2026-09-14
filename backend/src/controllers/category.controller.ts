import { Request, Response, NextFunction } from 'express';
import { categoryService } from '../services/category.service';
import { CategoryType } from '@prisma/client';

export const createCategory = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user!.userId;
    const { name, type } = req.body;
    const category = await categoryService.createCategory(userId, name, type as CategoryType);
    res.status(201).json({ status: 'success', data: { category } });
  } catch (error) {
    next(error);
  }
};

export const getCategories = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user!.userId;
    const categories = await categoryService.getCategories(userId);
    res.status(200).json({ status: 'success', data: { categories } });
  } catch (error) {
    next(error);
  }
};

export const getCategoryById = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user!.userId;
    const id = req.params.id as string;
    const category = await categoryService.getCategoryById(userId, id);
    res.status(200).json({ status: 'success', data: { category } });
  } catch (error) {
    next(error);
  }
};

export const updateCategory = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user!.userId;
    const id = req.params.id as string;
    const { name, type } = req.body;
    const category = await categoryService.updateCategory(userId, id, { name, type });
    res.status(200).json({ status: 'success', data: { category } });
  } catch (error) {
    next(error);
  }
};

export const deleteCategory = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user!.userId;
    const id = req.params.id as string;
    await categoryService.deleteCategory(userId, id);
    res.status(200).json({ status: 'success', data: null });
  } catch (error) {
    next(error);
  }
};

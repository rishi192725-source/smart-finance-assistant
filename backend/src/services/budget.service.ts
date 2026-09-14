import { PrismaClient, Prisma } from '@prisma/client';
import { AppError } from '../middlewares/errorHandler';
import { categoryService } from './category.service';

const prisma = new PrismaClient();

export const budgetService = {
  async createBudget(userId: string, categoryId: string, amount: number, month: string) {
    await categoryService.getCategoryById(userId, categoryId);

    // Prevent duplicate budgets for the same category and month
    const existing = await prisma.budget.findFirst({
      where: { userId, categoryId, month },
    });
    if (existing) {
      throw new AppError('Budget already exists for this category and month', 409); // 409 Conflict
    }

    return prisma.budget.create({
      data: { userId, categoryId, amount, month },
    });
  },

  async getBudgets(userId: string, filters: { month?: string }) {
    const where: Prisma.BudgetWhereInput = { userId };
    if (filters.month) {
      where.month = filters.month;
    }

    return prisma.budget.findMany({
      where,
      orderBy: { month: 'desc' },
      include: {
        category: { select: { id: true, name: true } },
      },
    });
  },

  async getOverview(userId: string, month: string) {
    // 1. Get all budgets for the month
    const budgets = await prisma.budget.findMany({
      where: { userId, month },
      include: {
        category: { select: { id: true, name: true } },
      },
    });

    if (budgets.length === 0) return [];

    // 2. Parse start and end dates for the month
    // month format is YYYY-MM
    const [yearStr, monthStr] = month.split('-');
    const year = parseInt(yearStr, 10);
    const monthIndex = parseInt(monthStr, 10) - 1; // 0-based

    const startDate = new Date(year, monthIndex, 1);
    const endDate = new Date(year, monthIndex + 1, 0, 23, 59, 59, 999);

    const categoryIds = budgets.map(b => b.categoryId);

    // 3. Aggregate actual spending for these categories
    const expenses = await prisma.transaction.groupBy({
      by: ['categoryId'],
      where: {
        userId,
        type: 'EXPENSE',
        categoryId: { in: categoryIds },
        transactionDate: { gte: startDate, lte: endDate },
      },
      _sum: { amount: true },
    });

    const expenseMap = new Map(expenses.map(e => [e.categoryId, Number(e._sum.amount || 0)]));

    // 4. Calculate progress
    return budgets.map(budget => {
      const budgetAmount = Number(budget.amount);
      const actualSpent = expenseMap.get(budget.categoryId) || 0;
      
      let percentUsed = 0;
      let isOverBudget = false;

      if (budgetAmount === 0) {
        if (actualSpent > 0) {
          // Rule: budget = 0 AND actualSpent > 0 -> over-budget, safe percent
          percentUsed = 100; // Cap at 100 or indicate over via boolean
          isOverBudget = true;
        } else {
          percentUsed = 0;
          isOverBudget = false;
        }
      } else {
        percentUsed = (actualSpent / budgetAmount) * 100;
        isOverBudget = actualSpent > budgetAmount;
      }

      return {
        id: budget.id,
        categoryId: budget.categoryId,
        categoryName: budget.category.name,
        month: budget.month,
        amount: budgetAmount,
        actualSpent,
        remaining: Math.max(0, budgetAmount - actualSpent),
        percentUsed: Math.min(100, percentUsed), // Cap at 100 for UI purposes if desired, but often we want to see >100%
        rawPercentUsed: percentUsed,
        isOverBudget,
      };
    }).sort((a, b) => b.rawPercentUsed - a.rawPercentUsed);
  },

  async getBudgetById(userId: string, budgetId: string) {
    const budget = await prisma.budget.findFirst({
      where: { id: budgetId, userId },
      include: {
        category: { select: { id: true, name: true } },
      },
    });
    if (!budget) {
      throw new AppError('Budget not found', 404);
    }
    return budget;
  },

  async updateBudget(userId: string, budgetId: string, data: { categoryId?: string; amount?: number; month?: string }) {
    await this.getBudgetById(userId, budgetId);

    if (data.categoryId) {
      await categoryService.getCategoryById(userId, data.categoryId);
    }

    if (data.categoryId || data.month) {
      // Check duplicate
      const budget = await prisma.budget.findFirst({ where: { id: budgetId } });
      const newCategoryId = data.categoryId || budget!.categoryId;
      const newMonth = data.month || budget!.month;

      const existing = await prisma.budget.findFirst({
        where: { userId, categoryId: newCategoryId, month: newMonth, id: { not: budgetId } },
      });
      if (existing) {
        throw new AppError('Budget already exists for this category and month', 409);
      }
    }

    return prisma.budget.update({
      where: { id: budgetId },
      data,
    });
  },

  async deleteBudget(userId: string, budgetId: string) {
    await this.getBudgetById(userId, budgetId);

    await prisma.budget.delete({
      where: { id: budgetId },
    });
    return { success: true };
  },
};

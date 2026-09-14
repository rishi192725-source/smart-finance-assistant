import { PrismaClient, RecurringFrequency } from '@prisma/client';
import { AppError } from '../middlewares/errorHandler';
import { accountService } from './account.service';
import { categoryService } from './category.service';

const prisma = new PrismaClient();

export const recurringExpenseService = {
  async createRecurringExpense(
    userId: string,
    accountId: string,
    categoryId: string,
    amount: number,
    description: string | undefined,
    frequency: RecurringFrequency,
    nextRunDate: Date
  ) {
    await accountService.getAccountById(userId, accountId);
    await categoryService.getCategoryById(userId, categoryId);

    return prisma.recurringExpense.create({
      data: {
        userId,
        accountId,
        categoryId,
        amount,
        description,
        frequency,
        nextRunDate,
      },
    });
  },

  async getRecurringExpenses(userId: string) {
    return prisma.recurringExpense.findMany({
      where: { userId },
      orderBy: { nextRunDate: 'asc' },
      include: {
        account: { select: { id: true, name: true } },
        category: { select: { id: true, name: true } },
      },
    });
  },

  async getRecurringExpenseById(userId: string, expenseId: string) {
    const expense = await prisma.recurringExpense.findFirst({
      where: { id: expenseId, userId },
      include: {
        account: { select: { id: true, name: true } },
        category: { select: { id: true, name: true } },
      },
    });
    if (!expense) {
      throw new AppError('Recurring expense not found', 404);
    }
    return expense;
  },

  async updateRecurringExpense(
    userId: string,
    expenseId: string,
    data: {
      accountId?: string;
      categoryId?: string;
      amount?: number;
      description?: string;
      frequency?: RecurringFrequency;
      nextRunDate?: Date;
      active?: boolean;
    }
  ) {
    await this.getRecurringExpenseById(userId, expenseId);

    if (data.accountId) {
      await accountService.getAccountById(userId, data.accountId);
    }
    if (data.categoryId) {
      await categoryService.getCategoryById(userId, data.categoryId);
    }

    return prisma.recurringExpense.update({
      where: { id: expenseId },
      data,
    });
  },

  async deleteRecurringExpense(userId: string, expenseId: string) {
    await this.getRecurringExpenseById(userId, expenseId);

    await prisma.recurringExpense.delete({
      where: { id: expenseId },
    });
    return { success: true };
  },
};

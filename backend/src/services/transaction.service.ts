import { PrismaClient, TransactionType, Prisma } from '@prisma/client';
import { AppError } from '../middlewares/errorHandler';

const prisma = new PrismaClient();

export const transactionService = {
  async createTransaction(
    userId: string,
    data: {
      accountId: string;
      toAccountId?: string;
      categoryId?: string;
      type: TransactionType;
      amount: number;
      description?: string;
      transactionDate: Date;
      referenceId?: string;
    }
  ) {
    return await prisma.$transaction(async (tx) => {
      const sourceAccount = await tx.account.findFirst({
        where: { id: data.accountId, userId },
      });
      if (!sourceAccount) {
        throw new AppError('Source account not found or access denied', 404);
      }

      if (data.type === 'TRANSFER') {
        if (!data.toAccountId) {
          throw new AppError('toAccountId is required for TRANSFER transactions', 400);
        }
        if (data.accountId === data.toAccountId) {
          throw new AppError('Cannot transfer to the same account', 400);
        }
        const destAccount = await tx.account.findFirst({
          where: { id: data.toAccountId, userId },
        });
        if (!destAccount) {
          throw new AppError('Destination account not found or access denied', 404);
        }
      }

      if (data.categoryId && data.type !== 'TRANSFER') {
        const category = await tx.category.findFirst({
          where: { id: data.categoryId, userId },
        });
        if (!category) {
          throw new AppError('Category not found or access denied', 404);
        }
      }

      const transaction = await tx.transaction.create({
        data: {
          userId,
          accountId: data.accountId,
          toAccountId: data.type === 'TRANSFER' ? data.toAccountId : null,
          categoryId: data.type === 'TRANSFER' ? null : data.categoryId,
          type: data.type,
          amount: data.amount,
          description: data.description,
          transactionDate: data.transactionDate,
          referenceId: data.referenceId,
        },
      });

      if (data.type === 'INCOME') {
        await tx.account.update({
          where: { id: data.accountId },
          data: { balance: { increment: data.amount } },
        });
      } else if (data.type === 'EXPENSE') {
        await tx.account.update({
          where: { id: data.accountId },
          data: { balance: { decrement: data.amount } },
        });
      } else if (data.type === 'TRANSFER') {
        await tx.account.update({
          where: { id: data.accountId },
          data: { balance: { decrement: data.amount } },
        });
        await tx.account.update({
          where: { id: data.toAccountId! },
          data: { balance: { increment: data.amount } },
        });
      }

      return transaction;
    });
  },

  async getTransactions(
    userId: string,
    filters: {
      page?: number;
      limit?: number;
      startDate?: string;
      endDate?: string;
      accountId?: string;
      categoryId?: string;
      type?: TransactionType;
      search?: string;
      sortBy?: string;
      sortOrder?: 'asc' | 'desc';
    }
  ) {
    const page = filters.page || 1;
    const limit = filters.limit || 50;
    const skip = (page - 1) * limit;

    const where: Prisma.TransactionWhereInput = { userId };

    if (filters.startDate || filters.endDate) {
      where.transactionDate = {};
      if (filters.startDate) where.transactionDate.gte = new Date(filters.startDate);
      if (filters.endDate) where.transactionDate.lte = new Date(filters.endDate);
    }

    if (filters.accountId) {
      // Find transactions where the account is either the source or destination
      where.OR = [
        { accountId: filters.accountId },
        { toAccountId: filters.accountId },
      ];
    }
    if (filters.categoryId) {
      where.categoryId = filters.categoryId;
    }
    if (filters.type) {
      where.type = filters.type;
    }
    if (filters.search) {
      where.description = {
        contains: filters.search,
        mode: 'insensitive',
      };
    }

    let orderBy: Prisma.TransactionOrderByWithRelationInput = { transactionDate: 'desc' };
    if (filters.sortBy) {
      orderBy = { [filters.sortBy]: filters.sortOrder || 'desc' };
    }

    const [transactions, total] = await Promise.all([
      prisma.transaction.findMany({
        where,
        skip,
        take: limit,
        orderBy,
        include: {
          account: { select: { id: true, name: true } },
          toAccount: { select: { id: true, name: true } },
          category: { select: { id: true, name: true } },
        },
      }),
      prisma.transaction.count({ where }),
    ]);

    return {
      data: transactions,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  },

  async getTransactionById(userId: string, transactionId: string) {
    const transaction = await prisma.transaction.findFirst({
      where: { id: transactionId, userId },
      include: {
        account: { select: { id: true, name: true } },
        toAccount: { select: { id: true, name: true } },
        category: { select: { id: true, name: true } },
      },
    });
    if (!transaction) {
      throw new AppError('Transaction not found', 404);
    }
    return transaction;
  },

  async updateTransaction(
    userId: string,
    transactionId: string,
    data: {
      accountId?: string;
      toAccountId?: string;
      categoryId?: string | null;
      type?: TransactionType;
      amount?: number;
      description?: string;
      transactionDate?: Date;
    }
  ) {
    return await prisma.$transaction(async (tx) => {
      const oldTx = await tx.transaction.findFirst({
        where: { id: transactionId, userId },
      });
      if (!oldTx) {
        throw new AppError('Transaction not found', 404);
      }

      // Reverse old balance
      if (oldTx.type === 'INCOME') {
        await tx.account.update({
          where: { id: oldTx.accountId },
          data: { balance: { decrement: oldTx.amount } },
        });
      } else if (oldTx.type === 'EXPENSE') {
        await tx.account.update({
          where: { id: oldTx.accountId },
          data: { balance: { increment: oldTx.amount } },
        });
      } else if (oldTx.type === 'TRANSFER') {
        await tx.account.update({
          where: { id: oldTx.accountId },
          data: { balance: { increment: oldTx.amount } },
        });
        await tx.account.update({
          where: { id: oldTx.toAccountId! },
          data: { balance: { decrement: oldTx.amount } },
        });
      }

      // Calculate new values
      const newType = data.type ?? oldTx.type;
      const newAmount = data.amount ?? Number(oldTx.amount);
      const newAccountId = data.accountId ?? oldTx.accountId;
      const newToAccountId = newType === 'TRANSFER' ? (data.toAccountId ?? oldTx.toAccountId) : null;
      const newCategoryId = newType === 'TRANSFER' ? null : (data.categoryId !== undefined ? data.categoryId : oldTx.categoryId);

      // Verify accounts for new state
      const sourceAccount = await tx.account.findFirst({
        where: { id: newAccountId, userId },
      });
      if (!sourceAccount) {
        throw new AppError('Source account not found or access denied', 404);
      }

      if (newType === 'TRANSFER') {
        if (!newToAccountId) {
          throw new AppError('toAccountId is required for TRANSFER transactions', 400);
        }
        if (newAccountId === newToAccountId) {
          throw new AppError('Cannot transfer to the same account', 400);
        }
        const destAccount = await tx.account.findFirst({
          where: { id: newToAccountId, userId },
        });
        if (!destAccount) {
          throw new AppError('Destination account not found or access denied', 404);
        }
      }

      if (newCategoryId && newType !== 'TRANSFER') {
        const category = await tx.category.findFirst({
          where: { id: newCategoryId, userId },
        });
        if (!category) {
          throw new AppError('Category not found or access denied', 404);
        }
      }

      // Apply new balance effect
      if (newType === 'INCOME') {
        await tx.account.update({
          where: { id: newAccountId },
          data: { balance: { increment: newAmount } },
        });
      } else if (newType === 'EXPENSE') {
        await tx.account.update({
          where: { id: newAccountId },
          data: { balance: { decrement: newAmount } },
        });
      } else if (newType === 'TRANSFER') {
        await tx.account.update({
          where: { id: newAccountId },
          data: { balance: { decrement: newAmount } },
        });
        await tx.account.update({
          where: { id: newToAccountId! },
          data: { balance: { increment: newAmount } },
        });
      }

      // Update Transaction
      return await tx.transaction.update({
        where: { id: transactionId },
        data: {
          accountId: newAccountId,
          toAccountId: newToAccountId,
          categoryId: newCategoryId,
          type: newType,
          amount: newAmount,
          description: data.description !== undefined ? data.description : oldTx.description,
          transactionDate: data.transactionDate ?? oldTx.transactionDate,
        },
      });
    });
  },

  async deleteTransaction(userId: string, transactionId: string) {
    return await prisma.$transaction(async (tx) => {
      const transaction = await tx.transaction.findFirst({
        where: { id: transactionId, userId },
      });
      if (!transaction) {
        throw new AppError('Transaction not found', 404);
      }

      // Reverse balance
      if (transaction.type === 'INCOME') {
        await tx.account.update({
          where: { id: transaction.accountId },
          data: { balance: { decrement: transaction.amount } },
        });
      } else if (transaction.type === 'EXPENSE') {
        await tx.account.update({
          where: { id: transaction.accountId },
          data: { balance: { increment: transaction.amount } },
        });
      } else if (transaction.type === 'TRANSFER') {
        await tx.account.update({
          where: { id: transaction.accountId },
          data: { balance: { increment: transaction.amount } },
        });
        await tx.account.update({
          where: { id: transaction.toAccountId! },
          data: { balance: { decrement: transaction.amount } },
        });
      }

      await tx.transaction.delete({
        where: { id: transactionId },
      });
      return { success: true };
    });
  },
};

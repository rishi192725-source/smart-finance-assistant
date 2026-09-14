import { PrismaClient, AccountType } from '@prisma/client';
import { AppError } from '../middlewares/errorHandler';

const prisma = new PrismaClient();

export const accountService = {
  async createAccount(userId: string, name: string, type: AccountType, balance: number, currency: string) {
    return prisma.account.create({
      data: { userId, name, type, balance, currency },
    });
  },

  async getAccounts(userId: string) {
    return prisma.account.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });
  },

  async getAccountById(userId: string, accountId: string) {
    const account = await prisma.account.findFirst({
      where: { id: accountId, userId },
    });
    if (!account) {
      throw new AppError('Account not found', 404);
    }
    return account;
  },

  async updateAccount(userId: string, accountId: string, data: { name?: string; type?: AccountType; balance?: number; currency?: string }) {
    await this.getAccountById(userId, accountId);

    return prisma.account.update({
      where: { id: accountId },
      data,
    });
  },

  async deleteAccount(userId: string, accountId: string) {
    await this.getAccountById(userId, accountId);

    await prisma.account.delete({
      where: { id: accountId },
    });
    return { success: true };
  },
};

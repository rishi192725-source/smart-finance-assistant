import { PrismaClient } from '@prisma/client';
import { startOfMonth, endOfMonth } from 'date-fns';

const prisma = new PrismaClient();

export const dashboardService = {
  async getSummary(userId: string, startDate?: string, endDate?: string) {
    const start = startDate ? new Date(startDate) : startOfMonth(new Date());
    const end = endDate ? new Date(endDate) : endOfMonth(new Date());

    const accounts = await prisma.account.findMany({ where: { userId } });
    const totalBalance = accounts.reduce((acc, account) => acc + Number(account.balance), 0);

    const transactions = await prisma.transaction.groupBy({
      by: ['type'],
      where: {
        userId,
        transactionDate: { gte: start, lte: end },
        type: { in: ['INCOME', 'EXPENSE'] }
      },
      _sum: { amount: true }
    });

    let totalIncome = 0;
    let totalExpense = 0;

    transactions.forEach(t => {
      if (t.type === 'INCOME') totalIncome = Number(t._sum.amount || 0);
      if (t.type === 'EXPENSE') totalExpense = Number(t._sum.amount || 0);
    });

    const netSavings = totalIncome - totalExpense;

    return { totalBalance, totalIncome, totalExpense, netSavings };
  },

  async getExpensesByCategory(userId: string, startDate?: string, endDate?: string) {
    const start = startDate ? new Date(startDate) : startOfMonth(new Date());
    const end = endDate ? new Date(endDate) : endOfMonth(new Date());

    const expenses = await prisma.transaction.groupBy({
      by: ['categoryId'],
      where: {
        userId,
        type: 'EXPENSE',
        transactionDate: { gte: start, lte: end }
      },
      _sum: { amount: true }
    });

    const categoryIds = expenses.map(e => e.categoryId).filter(id => id !== null) as string[];
    const categories = await prisma.category.findMany({
      where: { id: { in: categoryIds } }
    });
    const categoryMap = new Map(categories.map(c => [c.id, c.name]));

    return expenses.map(e => ({
      categoryId: e.categoryId,
      categoryName: e.categoryId ? categoryMap.get(e.categoryId) : 'Uncategorized',
      totalAmount: Number(e._sum.amount || 0)
    })).sort((a, b) => b.totalAmount - a.totalAmount);
  },

  async getTrends(userId: string, startDate?: string, endDate?: string) {
    const start = startDate ? new Date(startDate) : startOfMonth(new Date());
    const end = endDate ? new Date(endDate) : endOfMonth(new Date());

    const trends = await prisma.$queryRaw<any[]>`
      SELECT DATE("transactionDate") as date, SUM(amount) as "totalAmount"
      FROM "Transaction"
      WHERE "userId" = ${userId} AND type = 'EXPENSE' AND "transactionDate" >= ${start} AND "transactionDate" <= ${end}
      GROUP BY DATE("transactionDate")
      ORDER BY date ASC
    `;

    return trends.map(t => {
      // Handle the fact that pg DATE() returns a string or date object
      const d = t.date instanceof Date ? t.date : new Date(t.date);
      return {
        date: d.toISOString().split('T')[0],
        totalAmount: Number(t.totalAmount)
      };
    });
  },

  async getRecentTransactions(userId: string, limit = 5) {
    return prisma.transaction.findMany({
      where: { userId },
      orderBy: { transactionDate: 'desc' },
      take: limit,
      include: {
        account: { select: { id: true, name: true } },
        toAccount: { select: { id: true, name: true } },
        category: { select: { id: true, name: true } }
      }
    });
  }
};

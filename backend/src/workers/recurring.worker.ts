import { Worker, Job } from 'bullmq';
import { connection } from '../config/redis';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

function getNextDate(date: Date, freq: string): Date {
  const d = new Date(date);
  switch (freq) {
    case 'DAILY': d.setDate(d.getDate() + 1); break;
    case 'WEEKLY': d.setDate(d.getDate() + 7); break;
    case 'MONTHLY': d.setMonth(d.getMonth() + 1); break;
    case 'YEARLY': d.setFullYear(d.getFullYear() + 1); break;
  }
  return d;
}

export const recurringWorker = new Worker(
  'recurring-expense',
  async (job: Job) => {
    // 1. Find all active expenses due
    const now = new Date();
    
    // We get a batch
    const dueExpenses = await prisma.recurringExpense.findMany({
      where: {
        active: true,
        nextRunDate: { lte: now }
      },
      take: 100 // Process in batches to avoid locking the DB too long
    });
    
    let processed = 0;
    let failed = 0;
    
    for (const exp of dueExpenses) {
      try {
        const expectedDateStr = exp.nextRunDate.toISOString().split('T')[0];
        const referenceId = `recur-${exp.id}-${expectedDateStr}`;
        const newNextRun = getNextDate(exp.nextRunDate, exp.frequency);
        
        // 2. Process in atomic transaction
        await prisma.$transaction(async (tx) => {
          // Create Transaction
          await tx.transaction.create({
            data: {
              userId: exp.userId,
              accountId: exp.accountId,
              categoryId: exp.categoryId,
              type: 'EXPENSE',
              amount: exp.amount,
              description: exp.description || 'Recurring Expense',
              transactionDate: exp.nextRunDate,
              referenceId: referenceId
            }
          });
          
          // Update Account Balance
          await tx.account.update({
            where: { id: exp.accountId },
            data: {
              balance: { decrement: exp.amount }
            }
          });
          
          // Update Next Run Date
          await tx.recurringExpense.update({
            where: { id: exp.id },
            data: {
              nextRunDate: newNextRun
            }
          });
        });
        
        processed++;
      } catch (err: any) {
        if (err.code === 'P2002') {
          // Duplicate referenceId means another worker successfully processed this or a retry occurred.
          // Because of the atomic transaction, if the transaction exists, nextRunDate is already correctly updated.
          console.warn(`Duplicate recurring transaction caught and gracefully skipped for ${exp.id}`);
        } else {
          console.error(`Recurring expense ${exp.id} failed:`, err);
          failed++;
        }
      }
    }
    
    return { processed, failed, totalFound: dueExpenses.length };
  },
  { connection }
);

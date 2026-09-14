import { Worker, Job } from 'bullmq';
import { connection } from '../config/redis';
import { storageService } from '../services/storage.service';
import csvParser from 'csv-parser';
import { PrismaClient } from '@prisma/client';
import crypto from 'crypto';
import { transactionService } from '../services/transaction.service';
import fs from 'fs';

const prisma = new PrismaClient();

export const csvWorker = new Worker(
  'csv-import',
  async (job: Job) => {
    const { filePath, userId, accountId } = job.data;
    
    // 1. Verify account belongs to user
    const account = await prisma.account.findFirst({ where: { id: accountId, userId } });
    if (!account) {
      throw new Error(`Account ${accountId} not found or unauthorized`);
    }

    // Read entire file to compute fileHash
    const fileBuffer = await fs.promises.readFile(filePath);
    const fileHash = crypto.createHash('sha256').update(fileBuffer).digest('hex');

    const stream = storageService.getReadStream(filePath);
    let rowsProcessed = 0;
    let rowsSkipped = 0;
    let rowsFailed = 0;
    
    const results: any[] = [];
    
    await new Promise((resolve, reject) => {
      stream
        .pipe(csvParser())
        .on('data', (data) => results.push(data))
        .on('end', resolve)
        .on('error', reject);
    });

    for (let i = 0; i < results.length; i++) {
      const row = results[i];
      try {
        // Basic validation: amount, date, description
        // Assuming CSV has headers: Amount, Date, Description, Type
        const rawAmount = parseFloat(row.Amount || row.amount);
        const rawDate = row.Date || row.date;
        const rawDesc = row.Description || row.description || '';
        let rawType = (row.Type || row.type || '').toUpperCase();

        if (isNaN(rawAmount) || !rawDate) {
          rowsSkipped++;
          continue;
        }
        
        if (rawType !== 'INCOME' && rawType !== 'EXPENSE') {
           rawType = rawAmount < 0 ? 'EXPENSE' : 'INCOME';
        }

        const amount = Math.abs(rawAmount);
        const transactionDate = new Date(rawDate);
        if (isNaN(transactionDate.getTime())) {
          rowsSkipped++;
          continue;
        }

        // Idempotency: fileHash + rowIndex
        const referenceId = `csv-${fileHash}-${i}`;

        // We use transactionService to safely increment/decrement account balance
        await transactionService.createTransaction(userId, {
          accountId,
          type: rawType as any,
          amount,
          transactionDate,
          description: rawDesc,
          referenceId
        });
        
        rowsProcessed++;
        
      } catch (err: any) {
        // P2002 is duplicate unique key (referenceId)
        if (err.code === 'P2002') {
          rowsSkipped++; // We skip duplicates silently
        } else {
          rowsFailed++;
          console.error(`Row ${i} failed:`, err.message);
        }
      }
      
      // Update job progress
      await job.updateProgress(Math.round(((i + 1) / results.length) * 100));
    }

    // Clean up file
    await storageService.deleteFile(filePath).catch(console.error);

    return { rowsProcessed, rowsSkipped, rowsFailed };
  },
  { connection }
);

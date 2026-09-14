import { Router } from 'express';
import { z } from 'zod';
import { validate } from '../middlewares/validate.middleware';
import { protect } from '../middlewares/auth.middleware';
import * as transactionController from '../controllers/transaction.controller';

const router = Router();

const createTransactionSchema = z.object({
  body: z.object({
    accountId: z.string().uuid('Invalid account ID'),
    toAccountId: z.string().uuid('Invalid destination account ID').optional(),
    categoryId: z.string().uuid('Invalid category ID').optional().nullable(),
    type: z.enum(['INCOME', 'EXPENSE', 'TRANSFER']),
    amount: z.number().positive('Amount must be positive'),
    description: z.string().optional(),
    transactionDate: z.string().datetime(),
  }).strict(),
});

const updateTransactionSchema = z.object({
  body: z.object({
    accountId: z.string().uuid().optional(),
    toAccountId: z.string().uuid().optional(),
    categoryId: z.string().uuid().optional().nullable(),
    type: z.enum(['INCOME', 'EXPENSE', 'TRANSFER']).optional(),
    amount: z.number().positive().optional(),
    description: z.string().optional(),
    transactionDate: z.string().datetime().optional(),
  }).strict(),
  params: z.object({
    id: z.string().uuid('Invalid transaction ID'),
  }),
});

router.use(protect);

router.post('/', validate(createTransactionSchema), transactionController.createTransaction);
router.get('/', transactionController.getTransactions);
router.get('/:id', transactionController.getTransactionById);
router.patch('/:id', validate(updateTransactionSchema), transactionController.updateTransaction);
router.delete('/:id', transactionController.deleteTransaction);

export default router;

import { Router } from 'express';
import { z } from 'zod';
import { validate } from '../middlewares/validate.middleware';
import { protect } from '../middlewares/auth.middleware';
import * as recurringExpenseController from '../controllers/recurringExpense.controller';

const router = Router();

const createRecurringExpenseSchema = z.object({
  body: z.object({
    accountId: z.string().uuid('Invalid account ID'),
    categoryId: z.string().uuid('Invalid category ID'),
    amount: z.number().positive('Amount must be positive'),
    description: z.string().optional(),
    frequency: z.enum(['DAILY', 'WEEKLY', 'MONTHLY', 'YEARLY']),
    nextRunDate: z.string().datetime(),
  }).strict(),
});

const updateRecurringExpenseSchema = z.object({
  body: z.object({
    accountId: z.string().uuid().optional(),
    categoryId: z.string().uuid().optional(),
    amount: z.number().positive().optional(),
    description: z.string().optional(),
    frequency: z.enum(['DAILY', 'WEEKLY', 'MONTHLY', 'YEARLY']).optional(),
    nextRunDate: z.string().datetime().optional(),
    active: z.boolean().optional(),
  }).strict(),
  params: z.object({
    id: z.string().uuid('Invalid expense ID'),
  }),
});

router.use(protect);

router.post('/', validate(createRecurringExpenseSchema), recurringExpenseController.createRecurringExpense);
router.get('/', recurringExpenseController.getRecurringExpenses);
router.get('/:id', recurringExpenseController.getRecurringExpenseById);
router.patch('/:id', validate(updateRecurringExpenseSchema), recurringExpenseController.updateRecurringExpense);
router.delete('/:id', recurringExpenseController.deleteRecurringExpense);

export default router;

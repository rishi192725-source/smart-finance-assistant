import { Router } from 'express';
import { z } from 'zod';
import { validate } from '../middlewares/validate.middleware';
import { protect } from '../middlewares/auth.middleware';
import * as budgetController from '../controllers/budget.controller';

const router = Router();

const createBudgetSchema = z.object({
  body: z.object({
    categoryId: z.string().uuid('Invalid category ID'),
    amount: z.number().nonnegative('Amount must be non-negative'),
    month: z.string().regex(/^\d{4}-(0[1-9]|1[0-2])$/, 'Month must be in YYYY-MM format'),
  }).strict(),
});

const updateBudgetSchema = z.object({
  body: z.object({
    categoryId: z.string().uuid().optional(),
    amount: z.number().nonnegative().optional(),
    month: z.string().regex(/^\d{4}-(0[1-9]|1[0-2])$/).optional(),
  }).strict(),
  params: z.object({
    id: z.string().uuid('Invalid budget ID'),
  }),
});

router.use(protect);

router.post('/', validate(createBudgetSchema), budgetController.createBudget);
router.get('/overview', budgetController.getOverview);
router.get('/', budgetController.getBudgets);
router.get('/:id', budgetController.getBudgetById);
router.patch('/:id', validate(updateBudgetSchema), budgetController.updateBudget);
router.delete('/:id', budgetController.deleteBudget);

export default router;

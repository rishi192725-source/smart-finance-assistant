import { Router } from 'express';
import { z } from 'zod';
import { validate } from '../middlewares/validate.middleware';
import { protect } from '../middlewares/auth.middleware';
import * as goalController from '../controllers/goal.controller';

const router = Router();

const createGoalSchema = z.object({
  body: z.object({
    name: z.string().min(1, 'Name is required'),
    targetAmount: z.number().positive('Target amount must be positive'),
    currentAmount: z.number().min(0).optional(),
    deadline: z.string().datetime().optional(),
  }).strict(),
});

const updateGoalSchema = z.object({
  body: z.object({
    name: z.string().min(1).optional(),
    targetAmount: z.number().positive().optional(),
    currentAmount: z.number().min(0).optional(),
    deadline: z.string().datetime().optional(),
  }).strict(),
  params: z.object({
    id: z.string().uuid('Invalid goal ID'),
  }),
});

const contributeSchema = z.object({
  body: z.object({
    amount: z.number().positive('Contribution amount must be positive'),
  }).strict(),
  params: z.object({
    id: z.string().uuid('Invalid goal ID'),
  }),
});

router.use(protect);

router.post('/', validate(createGoalSchema), goalController.createGoal);
router.get('/', goalController.getGoals);
router.get('/:id', goalController.getGoalById);
router.patch('/:id', validate(updateGoalSchema), goalController.updateGoal);
router.delete('/:id', goalController.deleteGoal);
router.post('/:id/contributions', validate(contributeSchema), goalController.addContribution);

export default router;

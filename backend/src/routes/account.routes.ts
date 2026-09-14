import { Router } from 'express';
import { z } from 'zod';
import { validate } from '../middlewares/validate.middleware';
import { protect } from '../middlewares/auth.middleware';
import * as accountController from '../controllers/account.controller';

const router = Router();

const createAccountSchema = z.object({
  body: z.object({
    name: z.string().min(1, 'Name is required'),
    type: z.enum(['CHECKING', 'SAVINGS', 'CREDIT_CARD', 'CASH', 'INVESTMENT', 'LOAN']),
    balance: z.number(),
    currency: z.string().min(3).optional(),
  }).strict(),
});

const updateAccountSchema = z.object({
  body: z.object({
    name: z.string().min(1).optional(),
    type: z.enum(['CHECKING', 'SAVINGS', 'CREDIT_CARD', 'CASH', 'INVESTMENT', 'LOAN']).optional(),
    balance: z.number().optional(),
    currency: z.string().min(3).optional(),
  }).strict(),
  params: z.object({
    id: z.string().uuid('Invalid account ID'),
  }),
});

router.use(protect);

router.post('/', validate(createAccountSchema), accountController.createAccount);
router.get('/', accountController.getAccounts);
router.get('/:id', accountController.getAccountById);
router.patch('/:id', validate(updateAccountSchema), accountController.updateAccount);
router.delete('/:id', accountController.deleteAccount);

export default router;

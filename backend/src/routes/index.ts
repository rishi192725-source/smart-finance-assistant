import { Router } from 'express';
import authRoutes from './auth.routes';
import accountRoutes from './account.routes';
import categoryRoutes from './category.routes';
import transactionRoutes from './transaction.routes';
import budgetRoutes from './budget.routes';
import dashboardRoutes from './dashboard.routes';
import goalRoutes from './goal.routes';
import importRoutes from './import.routes';
import jobRoutes from './job.routes';
import recurringRoutes from './recurringExpense.routes';
import mlRoutes from './ml.routes';

const router = Router();

router.use('/auth', authRoutes);
router.use('/accounts', accountRoutes);
router.use('/categories', categoryRoutes);
router.use('/transactions', transactionRoutes);
router.use('/budgets', budgetRoutes);
router.use('/dashboard', dashboardRoutes);
router.use('/goals', goalRoutes);
router.use('/import', importRoutes);
router.use('/jobs', jobRoutes);
router.use('/recurring-expenses', recurringRoutes);
router.use('/ml', mlRoutes);

export default router;

import { Router } from 'express';
import { protect } from '../middlewares/auth.middleware';
import {
  getSummary,
  getExpensesByCategory,
  getTrends,
  getRecentTransactions,
} from '../controllers/dashboard.controller';

const router = Router();

router.use(protect); // All dashboard routes are protected

router.get('/summary', getSummary);
router.get('/expenses-by-category', getExpensesByCategory);
router.get('/trends', getTrends);
router.get('/recent-transactions', getRecentTransactions);

export default router;

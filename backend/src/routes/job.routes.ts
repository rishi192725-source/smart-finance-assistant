import { Router } from 'express';
import { protect } from '../middlewares/auth.middleware';
import * as jobController from '../controllers/job.controller';

const router = Router();

router.use(protect);
router.get('/:id', jobController.getJobStatus);

export default router;

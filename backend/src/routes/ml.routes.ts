import { Router } from 'express';
import { categorizeTransaction, predictSpending, parseIntent, uploadReceipt, getOcrJobStatus } from '../controllers/ml.controller';
import { protect } from '../middlewares/auth.middleware';
import multer from 'multer';

const router = Router();
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 5 * 1024 * 1024 } }); // 5MB limit

router.use(protect);

router.post('/categorize', categorizeTransaction);
router.post('/predict', predictSpending);
router.post('/ask', parseIntent);

router.post('/ocr', upload.single('file'), uploadReceipt);
router.get('/ocr/:id', getOcrJobStatus);

export default router;

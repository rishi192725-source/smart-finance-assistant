import { Router } from 'express';
import { protect } from '../middlewares/auth.middleware';
import * as importController from '../controllers/import.controller';
import multer from 'multer';

const upload = multer({ storage: multer.memoryStorage() });
const router = Router();

router.use(protect);
router.post('/csv', upload.single('file'), importController.importCSV);

export default router;

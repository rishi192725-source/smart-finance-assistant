import { Request, Response, NextFunction } from 'express';
import { csvQueue } from '../queues/csv.queue';
import { storageService } from '../services/storage.service';
import { AppError } from '../middlewares/errorHandler';

export const importCSV = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user!.userId;
    const { accountId } = req.body;
    
    if (!accountId) {
      return next(new AppError('accountId is required', 400));
    }

    if (!req.file) {
      return next(new AppError('No CSV file uploaded', 400));
    }

    // Pass the file buffer to storage service and get a reference
    const filePath = await storageService.saveTempFile(req.file.buffer, req.file.originalname);

    // Enqueue the job
    const job = await csvQueue.add('process-csv', {
      filePath,
      userId,
      accountId
    });

    res.status(202).json({
      status: 'success',
      data: {
        jobId: job.id,
        message: 'CSV import started'
      }
    });
  } catch (error) {
    next(error);
  }
};

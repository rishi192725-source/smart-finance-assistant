import { Request, Response, NextFunction } from 'express';
import { csvQueue } from '../queues/csv.queue';
import { AppError } from '../middlewares/errorHandler';

export const getJobStatus = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = req.params.id as string;
    const job = await csvQueue.getJob(id);
    
    if (!job) {
      return next(new AppError('Job not found', 404));
    }
    
    const state = await job.getState();
    const progress = job.progress;
    const result = job.returnvalue;
    const failedReason = job.failedReason;

    res.status(200).json({
      status: 'success',
      data: {
        id: job.id,
        state,
        progress,
        result,
        failedReason
      }
    });
  } catch (error) {
    next(error);
  }
};

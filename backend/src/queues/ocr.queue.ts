import { Queue } from 'bullmq';
import { connection } from '../config/redis';

export const ocrQueue = new Queue('ocr-processing', {
  connection,
  defaultJobOptions: {
    attempts: 2,
    backoff: {
      type: 'exponential',
      delay: 2000,
    },
    removeOnComplete: { age: 3600, count: 100 },
  },
});

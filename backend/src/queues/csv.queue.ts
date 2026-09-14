import { Queue } from 'bullmq';
import { connection } from '../config/redis';

export const csvQueue = new Queue('csv-import', {
  connection,
  defaultJobOptions: {
    attempts: 3,
    backoff: {
      type: 'exponential',
      delay: 1000,
    },
    removeOnComplete: { age: 3600, count: 100 },
  },
});

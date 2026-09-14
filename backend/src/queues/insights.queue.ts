import { Queue } from 'bullmq';
import { connection } from '../config/redis';

export const insightsQueue = new Queue('insights-processing', {
  connection,
  defaultJobOptions: {
    attempts: 1, // No need to heavily retry background insights
    removeOnComplete: { age: 3600, count: 100 },
  },
});

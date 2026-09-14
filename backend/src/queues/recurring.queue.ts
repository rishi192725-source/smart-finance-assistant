import { Queue } from 'bullmq';
import { connection } from '../config/redis';

export const recurringQueue = new Queue('recurring-expense', {
  connection,
  defaultJobOptions: {
    attempts: 3,
    backoff: {
      type: 'exponential',
      delay: 5000,
    },
    removeOnComplete: true,
  },
});

export const setupRecurringJobs = async () => {
  // Add a repeatable job that runs every hour at minute 0
  await recurringQueue.upsertJobScheduler(
    'hourly-recurring-processor',
    { pattern: '0 * * * *' },
    {
      name: 'process-recurring',
      data: {}
    }
  );
  console.log('Recurring jobs scheduled');
};

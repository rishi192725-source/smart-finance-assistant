import { csvWorker } from './workers/csv.worker';
import { recurringWorker } from './workers/recurring.worker';
import { ocrWorker } from './workers/ocr.worker';
import { insightsWorker } from './workers/insights.worker';
import { setupRecurringJobs } from './queues/recurring.queue';
import { connection } from './config/redis';

// Startup file for the worker process

async function bootstrap() {
  console.log('Worker process starting...');

  // Start workers
  csvWorker.on('completed', job => console.log(`CSV Job ${job.id} completed!`));
  recurringWorker.on('completed', job => console.log(`Recurring Job ${job.id} completed!`));
  ocrWorker.on('completed', job => console.log(`OCR Job ${job.id} completed!`));
  insightsWorker.on('completed', job => console.log(`Insights Job ${job.id} completed!`));
  
  // Wait for Redis to be ready
  if (connection.status !== 'ready') {
    await new Promise((resolve) => {
      connection.once('ready', resolve);
    });
  }
  
  console.log('Redis connected for workers.');
  
  // Setup cron jobs
  await setupRecurringJobs();
  
  console.log('Workers are listening for jobs...');
}

bootstrap().catch(console.error);

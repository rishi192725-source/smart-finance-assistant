import { Worker, Job } from 'bullmq';
import { connection } from '../config/redis';
import { storageService } from '../services/storage.service';
import fs from 'fs';
import FormData from 'form-data';

export const ocrWorker = new Worker(
  'ocr-processing',
  async (job: Job) => {
    const { filePath, userId } = job.data;
    
    // Read file buffer
    const fileBuffer = await fs.promises.readFile(filePath);
    
    // Call Python ML service
    const ML_SERVICE_URL = process.env.ML_SERVICE_URL || 'http://localhost:8000';
    const INTERNAL_API_SECRET = process.env.INTERNAL_API_SECRET || 'default_secret_for_development';
    
    const form = new FormData();
    form.append('file', fileBuffer, 'receipt.jpg');
    
    // Use native fetch but since we have Node 18, we can just use the form headers
    const response = await fetch(`${ML_SERVICE_URL}/api/ml/ocr`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${INTERNAL_API_SECRET}`,
        ...form.getHeaders()
      },
      body: form.getBuffer() as any
    });
    
    if (!response.ok) {
      throw new Error(`ML Service OCR failed: ${response.statusText}`);
    }
    
    const result = await response.json();
    
    // Clean up file
    await storageService.deleteFile(filePath).catch(console.error);

    return result.data;
  },
  { connection }
);

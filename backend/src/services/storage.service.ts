import fs from 'fs';
import path from 'path';

/**
 * StorageService abstracts file operations.
 * Currently uses local filesystem for development.
 * Designed to be swappable with S3/GCS when workers are distributed.
 */
export const storageService = {
  async saveTempFile(buffer: Buffer, originalName: string): Promise<string> {
    const tempDir = path.join(__dirname, '../../tmp');
    if (!fs.existsSync(tempDir)) {
      fs.mkdirSync(tempDir, { recursive: true });
    }
    const fileName = `${Date.now()}-${originalName}`;
    const filePath = path.join(tempDir, fileName);
    
    await fs.promises.writeFile(filePath, buffer);
    return filePath;
  },

  async deleteFile(filePath: string): Promise<void> {
    if (fs.existsSync(filePath)) {
      await fs.promises.unlink(filePath);
    }
  },

  getReadStream(filePath: string) {
    if (!fs.existsSync(filePath)) {
      throw new Error('File not found in storage');
    }
    return fs.createReadStream(filePath);
  }
};

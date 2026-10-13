import type { Express } from 'express';

export interface ImageStorageService {
  upload(file: Express.Multer.File): Promise<string>;
  delete(fileUrl: string): Promise<void>;
}
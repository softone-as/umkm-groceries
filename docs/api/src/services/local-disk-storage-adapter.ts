import { randomUUID } from 'node:crypto';
import { mkdir, rm, writeFile } from 'node:fs/promises';
import { basename, join, relative, resolve } from 'node:path';
import type { Express, RequestHandler } from 'express';
import multer from 'multer';
import { ImageStorageService } from './image-storage-service.js';

export const MAX_IMAGE_SIZE_BYTES = 5 * 1024 * 1024;
export const ALLOWED_IMAGE_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp'] as const;
const PUBLIC_IMAGE_PATH = '/uploads/images/';

export class InvalidImageError extends Error {}

export interface LocalDiskImageStorageOptions {
  directory?: string;
}

export class LocalDiskImageStorageAdapter implements ImageStorageService {
  readonly directory: string;

  constructor(options: LocalDiskImageStorageOptions = {}) {
    this.directory = resolve(options.directory ?? join(process.cwd(), 'uploads', 'images'));
  }

  async ensureDirectory(): Promise<void> {
    await mkdir(this.directory, { recursive: true });
  }

  async upload(file: Express.Multer.File): Promise<string> {
    if (!ALLOWED_IMAGE_MIME_TYPES.includes(file.mimetype as (typeof ALLOWED_IMAGE_MIME_TYPES)[number])) {
      throw new InvalidImageError('Jenis file gambar tidak didukung.');
    }
    if (file.size > MAX_IMAGE_SIZE_BYTES || file.buffer.length > MAX_IMAGE_SIZE_BYTES) {
      throw new InvalidImageError('Ukuran gambar maksimal 5 MB.');
    }

    const normalizedName = file.originalname.replaceAll('\\', '/');
    const baseName = basename(normalizedName).replace(/[^a-zA-Z0-9._-]/g, '_').replace(/^\.+/, '');
    const safeName = baseName || 'image';
    const filename = `${randomUUID()}-${safeName}`;
    await this.ensureDirectory();
    await writeFile(join(this.directory, filename), file.buffer, { flag: 'wx' });
    return `${PUBLIC_IMAGE_PATH}${filename}`;
  }

  async delete(fileUrl: string): Promise<void> {
    if (!fileUrl.startsWith(PUBLIC_IMAGE_PATH)) throw new InvalidImageError('URL gambar tidak valid.');
    const filename = fileUrl.slice(PUBLIC_IMAGE_PATH.length);
    if (!filename || basename(filename) !== filename || filename.includes('..')) {
      throw new InvalidImageError('URL gambar tidak valid.');
    }

    const filePath = resolve(this.directory, filename);
    const pathFromRoot = relative(this.directory, filePath);
    if (!pathFromRoot || pathFromRoot.startsWith('..')) throw new InvalidImageError('URL gambar tidak valid.');
    await rm(filePath, { force: true });
  }
}

/** Creates a Multer middleware that accepts a single validated image in memory. */
export function createImageUploadMiddleware(): RequestHandler {
  return multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: MAX_IMAGE_SIZE_BYTES },
    fileFilter: (_request, file, callback) => {
      if (ALLOWED_IMAGE_MIME_TYPES.includes(file.mimetype as (typeof ALLOWED_IMAGE_MIME_TYPES)[number])) {
        callback(null, true);
      } else {
        callback(new InvalidImageError('Jenis file gambar tidak didukung.'));
      }
    },
  }).single('image');
}
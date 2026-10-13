import { mkdtemp, readFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { Readable } from 'node:stream';
import express from 'express';
import type { Express } from 'express';
import { afterEach, describe, expect, it } from 'vitest';
import request from 'supertest';
import { createApp } from '../src/app.js';
import {
  createImageUploadMiddleware,
  LocalDiskImageStorageAdapter,
} from '../src/services/local-disk-storage-adapter.js';
import { errorHandler } from '../src/middlewares/error-handler.js';
import { responseHelpers } from '../src/middlewares/response-helpers.js';

let temporaryDirectory: string | undefined;

afterEach(async () => {
  if (temporaryDirectory) await rm(temporaryDirectory, { recursive: true, force: true });
  temporaryDirectory = undefined;
});

function createImageFile(overrides: Partial<Express.Multer.File> = {}): Express.Multer.File {
  const buffer = Buffer.from('image bytes');
  return {
    fieldname: 'image',
    originalname: '../../catalog photo.webp',
    encoding: '7bit',
    mimetype: 'image/webp',
    size: buffer.length,
    destination: '',
    filename: '',
    path: '',
    buffer,
    stream: Readable.from(buffer),
    ...overrides,
  };
}

describe('LocalDiskImageStorageAdapter', () => {
  it('stores an allowed image under a generated safe name and serves it with cache headers', async () => {
    temporaryDirectory = await mkdtemp(join(tmpdir(), 'santo-images-'));
    const storage = new LocalDiskImageStorageAdapter({ directory: temporaryDirectory });

    const fileUrl = await storage.upload(createImageFile());

    expect(fileUrl).toMatch(/^\/uploads\/images\/[0-9a-f-]+-catalog_photo\.webp$/i);
    const filename = fileUrl.slice('/uploads/images/'.length);
    expect(await readFile(join(temporaryDirectory, filename))).toEqual(Buffer.from('image bytes'));

    const response = await request(createApp({ imageDirectory: temporaryDirectory })).get(fileUrl);
    expect(response.status).toBe(200);
    expect(response.headers['content-type']).toContain('image/webp');
    expect(response.headers['cache-control']).toContain('immutable');
    expect(response.headers['x-content-type-options']).toBe('nosniff');
  });

  it('rejects unsupported media, files over 5 MB, and paths outside the image directory', async () => {
    temporaryDirectory = await mkdtemp(join(tmpdir(), 'santo-images-'));
    const storage = new LocalDiskImageStorageAdapter({ directory: temporaryDirectory });

    await expect(storage.upload(createImageFile({ mimetype: 'image/gif' }))).rejects.toThrow();
    await expect(storage.upload(createImageFile({ size: 5 * 1024 * 1024 + 1 }))).rejects.toThrow();
    await expect(storage.delete('/uploads/images/../../outside.txt')).rejects.toThrow();
  });

  it('rejects unsupported MIME types and files larger than 5 MB at the upload boundary', async () => {
    const app = express();
    app.use(responseHelpers);
    app.post('/image', createImageUploadMiddleware(), (request, response) => {
      response.sendSuccess({ received: request.file !== undefined });
    });
    app.use(errorHandler);

    const rejectedMime = await request(app)
      .post('/image')
      .attach('image', Buffer.from('not a gif'), { filename: 'image.gif', contentType: 'image/gif' });
    expect(rejectedMime.status).toBe(422);

    const oversizedImage = await request(app)
      .post('/image')
      .attach('image', Buffer.alloc(5 * 1024 * 1024 + 1), {
        filename: 'large.webp',
        contentType: 'image/webp',
      });
    expect(oversizedImage.status).toBe(413);
  });
});
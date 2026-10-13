import express from 'express';
import request from 'supertest';
import { describe, expect, it } from 'vitest';
import { z } from 'zod';
import { errorHandler } from '../src/middlewares/error-handler.js';
import { responseHelpers } from '../src/middlewares/response-helpers.js';

describe('API error responses', () => {
  it('returns localized field details for Zod validation errors', async () => {
    const app = express();
    app.use(responseHelpers);
    app.get('/validation', (_request, _response, next) => {
      try {
        z.string().parse(42);
      } catch (error) {
        next(error);
      }
    });
    app.use(errorHandler);

    const response = await request(app).get('/validation');

    expect(response.status).toBe(422);
    expect(response.body).toEqual({
      success: false,
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Data yang dikirim tidak valid.',
        details: [{ field: '', message: 'Format data yang dikirim tidak valid.' }],
      },
    });
  });

  it('returns a generic safe response for unexpected failures', async () => {
    const app = express();
    app.use(responseHelpers);
    app.get('/unexpected', () => {
      throw new Error('database password leaked');
    });
    app.use(errorHandler);

    const response = await request(app).get('/unexpected');

    expect(response.status).toBe(500);
    expect(response.body).toEqual({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Terjadi kesalahan pada sistem.',
      },
    });
    expect(JSON.stringify(response.body)).not.toContain('database password leaked');
  });
});
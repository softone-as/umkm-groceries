import express from 'express';
import request from 'supertest';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { requestLogger } from '../src/middlewares/request-logger.js';

describe('request logging privacy', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('assigns a request id and masks phone numbers and sensitive values', async () => {
    const log = vi.spyOn(console, 'info').mockImplementation(() => undefined);
    const app = express();
    app.use(express.json());
    app.use(requestLogger);
    app.post('/capture', (_request, response) => response.json({ ok: true }));

    const response = await request(app)
      .post('/capture?whatsapp_number=081234567890&guest_access_token=secret-query')
      .send({ phone_number: '081234567890', password: 'secret-password', note: 'Call 081234567890' });

    expect(response.headers['x-request-id']).toMatch(/^[0-9a-f-]{36}$/i);
    const output = log.mock.calls.map(([message]) => String(message)).join('\n');
    expect(output).toContain('+62812****7890');
    expect(output).not.toContain('081234567890');
    expect(output).not.toContain('secret-query');
    expect(output).not.toContain('secret-password');
    expect(output).toContain('[REDACTED]');
  });
});
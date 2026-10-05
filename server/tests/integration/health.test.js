import { describe, it, expect } from 'vitest';
import request from 'supertest';

import createApp from '../../src/app.js';
import testEnv from '../fixtures/testEnv.js';

const app = createApp();

describe('GET /api/health', () => {
  it('returns 200 with the success envelope', async () => {
    const res = await request(app).get('/api/health');

    expect(res.status).toBe(200);
    expect(res.headers['content-type']).toMatch(/application\/json/);
    expect(res.body).toEqual({ success: true, data: { status: 'ok' } });
  });
});

describe('unknown routes', () => {
  it('returns 404 with the NOT_FOUND error envelope', async () => {
    const res = await request(app).get('/api/nope');

    expect(res.status).toBe(404);
    expect(res.body).toEqual({
      success: false,
      error: {
        message: expect.any(String),
        code: 'NOT_FOUND',
      },
    });
  });

  it('returns 404 for routes outside /api as well', async () => {
    const res = await request(app).get('/definitely-not-a-route');

    expect(res.status).toBe(404);
    expect(res.body.success).toBe(false);
    expect(res.body.error.code).toBe('NOT_FOUND');
  });

  it('returns 404 for an unmatched method on an existing path', async () => {
    const res = await request(app).post('/api/health');

    expect(res.status).toBe(404);
    expect(res.body.error.code).toBe('NOT_FOUND');
  });
});

describe('CORS', () => {
  it('allows the configured CLIENT_URL origin', async () => {
    const res = await request(app).get('/api/health').set('Origin', testEnv.CLIENT_URL);

    expect(res.headers['access-control-allow-origin']).toBe(testEnv.CLIENT_URL);
  });

  it('does not allow any other origin', async () => {
    const res = await request(app).get('/api/health').set('Origin', 'https://evil.example');

    expect(res.headers['access-control-allow-origin']).toBeUndefined();
  });
});

describe('JSON body parsing', () => {
  it('rejects a malformed JSON payload with a 400 validation envelope', async () => {
    const res = await request(app)
      .post('/api/health')
      .set('Content-Type', 'application/json')
      .send('{"name": ');

    expect(res.status).toBe(400);
    expect(res.body).toEqual({
      success: false,
      error: { message: 'Invalid JSON payload', code: 'VALIDATION_ERROR' },
    });
  });
});

describe('error responses', () => {
  it('never includes a stack trace in the response body', async () => {
    const res = await request(app).get('/api/nope');
    const serialized = JSON.stringify(res.body);

    expect(Object.keys(res.body)).toEqual(['success', 'error']);
    expect(Object.keys(res.body.error)).toEqual(['message', 'code']);
    expect(serialized).not.toMatch(/\bat\s+\S+\s+\(/);
  });
});

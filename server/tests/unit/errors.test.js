import { describe, it, expect, vi, afterEach } from 'vitest';

import {
  AppError,
  ValidationError,
  NotFoundError,
  UnauthorizedError,
} from '../../src/utils/errors.js';
import errorHandler from '../../src/middleware/errorHandler.js';

/** Minimal response stub — the handler's I/O surface is `status()` + `json()`. */
function createRes() {
  return {
    statusCode: undefined,
    body: undefined,
    headersSent: false,
    status(code) {
      this.statusCode = code;
      return this;
    },
    json(payload) {
      this.body = payload;
      return this;
    },
  };
}

const req = { method: 'GET', originalUrl: '/api/test' };
const next = () => {
  throw new Error('next() must not be called for handled errors');
};

afterEach(() => {
  vi.restoreAllMocks();
});

describe('error classes', () => {
  it('AppError carries the given status and code', () => {
    const error = new AppError('Teapot', 418, 'TEAPOT');

    expect(error).toBeInstanceOf(Error);
    expect(error.status).toBe(418);
    expect(error.code).toBe('TEAPOT');
    expect(error.message).toBe('Teapot');
    expect(error.name).toBe('AppError');
  });

  it('defaults AppError to 500 INTERNAL_ERROR', () => {
    const error = new AppError('boom');

    expect(error.status).toBe(500);
    expect(error.code).toBe('INTERNAL_ERROR');
  });

  it('ValidationError is a 400 VALIDATION_ERROR AppError', () => {
    const error = new ValidationError('Name is required');

    expect(error).toBeInstanceOf(AppError);
    expect(error.status).toBe(400);
    expect(error.code).toBe('VALIDATION_ERROR');
    expect(error.name).toBe('ValidationError');
  });

  it('NotFoundError is a 404 NOT_FOUND AppError', () => {
    const error = new NotFoundError();

    expect(error).toBeInstanceOf(AppError);
    expect(error.status).toBe(404);
    expect(error.code).toBe('NOT_FOUND');
  });

  it('UnauthorizedError is a 401 AppError that accepts a contract code', () => {
    const error = new UnauthorizedError('Token expired', 'TOKEN_EXPIRED');

    expect(error).toBeInstanceOf(AppError);
    expect(error.status).toBe(401);
    expect(error.code).toBe('TOKEN_EXPIRED');
  });
});

describe('errorHandler', () => {
  it('renders an AppError with its own status and code', () => {
    const res = createRes();

    errorHandler(new AppError('Teapot', 418, 'TEAPOT'), req, res, next);

    expect(res.statusCode).toBe(418);
    expect(res.body).toEqual({
      success: false,
      error: { message: 'Teapot', code: 'TEAPOT' },
    });
  });

  it('renders a ValidationError as 400 VALIDATION_ERROR', () => {
    const res = createRes();

    errorHandler(
      new ValidationError('Email already registered', 'DUPLICATE_EMAIL'),
      req,
      res,
      next,
    );

    expect(res.statusCode).toBe(400);
    expect(res.body.error.code).toBe('DUPLICATE_EMAIL');
  });

  it('maps an unknown error to 500 INTERNAL_ERROR with a generic message', () => {
    vi.spyOn(console, 'error').mockImplementation(() => {});
    const res = createRes();
    const error = new Error('database password is hunter2');

    errorHandler(error, req, res, next);

    expect(res.statusCode).toBe(500);
    expect(res.body).toEqual({
      success: false,
      error: { message: 'Internal server error', code: 'INTERNAL_ERROR' },
    });
    expect(JSON.stringify(res.body)).not.toContain('hunter2');
  });

  it('does not leak a stack trace for unknown errors', () => {
    vi.spyOn(console, 'error').mockImplementation(() => {});
    const res = createRes();

    errorHandler(new Error('boom'), req, res, next);

    const serialized = JSON.stringify(res.body);
    expect(serialized).not.toMatch(/\bat\s+\S+\s+\(/);
    expect(res.body.error).not.toHaveProperty('stack');
  });

  it('logs unexpected errors server-side', () => {
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {});
    const error = new Error('boom');

    errorHandler(error, req, createRes(), next);

    expect(spy).toHaveBeenCalledTimes(1);
    expect(spy.mock.calls[0][1]).toBe(error);
  });

  it('maps malformed JSON payloads to 400 VALIDATION_ERROR', () => {
    const res = createRes();
    const parseError = Object.assign(new SyntaxError('Unexpected end of JSON input'), {
      type: 'entity.parse.failed',
      status: 400,
    });

    errorHandler(parseError, req, res, next);

    expect(res.statusCode).toBe(400);
    expect(res.body.error.code).toBe('VALIDATION_ERROR');
  });

  it('delegates to next() when the response was already sent', () => {
    const res = createRes();
    res.headersSent = true;
    const error = new Error('late failure');
    const captured = [];

    errorHandler(error, req, res, (err) => captured.push(err));

    expect(captured).toEqual([error]);
    expect(res.body).toBeUndefined();
  });
});

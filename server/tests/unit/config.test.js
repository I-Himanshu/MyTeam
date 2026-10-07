import { describe, it, expect } from 'vitest';
import { execFile } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { MongoMemoryServer } from 'mongodb-memory-server';

import { loadConfig, REQUIRED_ENV_VARS } from '../../src/config/index.js';
import testEnv from '../fixtures/testEnv.js';

const here = path.dirname(fileURLToPath(import.meta.url));
const serverDir = path.resolve(here, '../..');
const fixturesDir = path.resolve(here, '../fixtures');

function run(serverArgs, env) {
  return new Promise((resolve) => {
    execFile(process.execPath, serverArgs, { cwd: fixturesDir, env }, (error, stdout, stderr) => {
      resolve({ code: error?.code ?? 0, stdout, stderr });
    });
  });
}

describe('loadConfig', () => {
  it('builds a frozen config with PORT defaulting to 5000', () => {
    const { port, ...rest } = loadConfig({ ...testEnv, PORT: undefined });

    expect(port).toBe(5000);
    expect(rest).toEqual({
      mongoUri: testEnv.MONGO_URI,
      jwtSecret: testEnv.JWT_SECRET,
      jwtExpiresIn: testEnv.JWT_EXPIRES_IN,
      clientUrl: testEnv.CLIENT_URL,
      smtpHost: '',
      smtpPort: 587,
      smtpUser: '',
      smtpPass: '',
      smtpFrom: '',
    });
    expect(Object.isFrozen(loadConfig(testEnv))).toBe(true);
  });

  it.each(REQUIRED_ENV_VARS)('fails fast when %s is missing', (variable) => {
    const env = { ...testEnv };
    delete env[variable];

    expect(() => loadConfig(env)).toThrow(/Missing required environment variable/);
    try {
      loadConfig(env);
    } catch (error) {
      expect(error.message).toContain(variable);
    }
  });

  it('reports every missing variable at once', () => {
    expect(() => loadConfig({ PORT: '5000' })).toThrow(
      /MONGO_URI, JWT_SECRET, JWT_EXPIRES_IN, CLIENT_URL/,
    );
  });

  it('never echoes secret values in the error message', () => {
    const env = { ...testEnv };
    delete env.JWT_SECRET;

    let message = '';
    try {
      loadConfig(env);
    } catch (error) {
      message = error.message;
    }

    expect(message).toContain('JWT_SECRET');
    expect(message).not.toContain(testEnv.JWT_SECRET);
    expect(message).not.toContain(testEnv.MONGO_URI);
    expect(message).not.toContain(testEnv.CLIENT_URL);
  });

  it('rejects a non-numeric PORT', () => {
    expect(() => loadConfig({ ...testEnv, PORT: 'not-a-port' })).toThrow(/Invalid PORT/);
  });

  it('rejects an out-of-range PORT', () => {
    expect(() => loadConfig({ ...testEnv, PORT: '70000' })).toThrow(/Invalid PORT/);
  });

  it('treats an empty string as a missing required variable', () => {
    expect(() => loadConfig({ ...testEnv, JWT_SECRET: '   ' })).toThrow(/JWT_SECRET/);
  });
});

describe('server startup', () => {
  it('refuses to start when a required variable is missing', async () => {
    // cwd has no `.env`, and only PATH is inherited: nothing can satisfy config.
    const { code, stderr } = await run([path.join(serverDir, 'src/server.js')], {
      PATH: process.env.PATH,
    });

    expect(code).not.toBe(0);
    expect(stderr).toContain('Missing required environment variable');
    expect(stderr).toContain('MONGO_URI');
  });

  it('starts and answers GET /api/health on the configured port', async () => {
    const port = 5099;
    // The server connects to MongoDB before listening (fail fast), so the
    // startup probe needs a real connection string — an in-memory server.
    const mongoServer = await MongoMemoryServer.create();
    const child = execFile(
      process.execPath,
      [path.join(serverDir, 'src/server.js')],
      {
        cwd: fixturesDir,
        env: { ...testEnv, PORT: `${port}`, MONGO_URI: mongoServer.getUri() },
      },
      () => {},
    );

    try {
      const response = await waitForHealth(port);
      expect(response.status).toBe(200);
      expect(response.body).toEqual({ success: true, data: { status: 'ok' } });
    } finally {
      child.kill('SIGTERM');
      await mongoServer.stop();
    }
  }, 120000);
});

async function waitForHealth(port, timeoutMs = 5000) {
  const deadline = Date.now() + timeoutMs;
  let lastError;

  while (Date.now() < deadline) {
    try {
      const res = await fetch(`http://127.0.0.1:${port}/api/health`);
      return { status: res.status, body: await res.json() };
    } catch (error) {
      lastError = error;
      await new Promise((resolve) => setTimeout(resolve, 100));
    }
  }

  throw new Error(`Server did not become ready: ${lastError?.message}`);
}

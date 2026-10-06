import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import { execFile } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';

import User from '../../src/models/User.js';
import { connectDB } from '../../src/config/db.js';
import { buildUser } from '../fixtures/users.js';
import testEnv from '../fixtures/testEnv.js';

const here = path.dirname(fileURLToPath(import.meta.url));
const serverDir = path.resolve(here, '../..');
const fixturesDir = path.resolve(here, '../fixtures');
const dbModuleUrl = pathToFileURL(path.join(serverDir, 'src/config/db.js')).href;
const serverEntry = path.join(serverDir, 'src/server.js');

// Bcrypt hashes are versioned `$2a$`/`$2b$` strings: `$2b$<cost>$<53 chars>`.
const BCRYPT_HASH_PATTERN = /^\$2[aby]\$\d{2}\$[./A-Za-z0-9]{53}$/;

let mongoServer;
let testUri;

function runNode(serverArgs, env) {
  return new Promise((resolve) => {
    execFile(process.execPath, serverArgs, { cwd: fixturesDir, env }, (error, stdout, stderr) => {
      resolve({ code: error?.code ?? 0, stdout, stderr });
    });
  });
}

beforeAll(async () => {
  // Tests never depend on an external database: an in-memory server is used
  // unless MONGO_TEST_URI points at a real one (e.g. CI with a service).
  if (process.env.MONGO_TEST_URI) {
    testUri = process.env.MONGO_TEST_URI;
  } else {
    mongoServer = await MongoMemoryServer.create();
    testUri = mongoServer.getUri();
  }
  await mongoose.connect(testUri);
}, 180000);

afterAll(async () => {
  await mongoose.disconnect();
  if (mongoServer) {
    await mongoServer.stop();
  }
});

beforeEach(async () => {
  await User.deleteMany({});
});

describe('password hashing', () => {
  it('stores a bcrypt hash, never the plaintext password', async () => {
    const payload = buildUser();

    await User.create(payload);
    const stored = await User.findOne({ email: payload.email }).select('+password');

    expect(stored.password).not.toBe(payload.password);
    expect(stored.password).toMatch(BCRYPT_HASH_PATTERN);
  });

  it('verifies the correct password and rejects a wrong one', async () => {
    const payload = buildUser();

    await User.create(payload);
    const user = await User.findOne({ email: payload.email }).select('+password');

    await expect(user.matchPassword(payload.password)).resolves.toBe(true);
    await expect(user.matchPassword('wrongPassword123')).resolves.toBe(false);
  });

  it('does not re-hash the password when only other fields change', async () => {
    const payload = buildUser();

    await User.create(payload);
    const before = (await User.findOne({ email: payload.email }).select('+password')).password;

    const user = await User.findOne({ email: payload.email });
    user.name = 'Augusta King';
    await user.save();

    const after = (await User.findOne({ email: payload.email }).select('+password')).password;
    expect(after).toBe(before);

    const reloaded = await User.findOne({ email: payload.email }).select('+password');
    await expect(reloaded.matchPassword(payload.password)).resolves.toBe(true);
  });
});

describe('unique email index', () => {
  it('rejects a second user with the same email (E11000)', async () => {
    await User.create(buildUser());

    const duplicate = User.create(buildUser({ name: 'Someone Else' }));
    await expect(duplicate).rejects.toMatchObject({ code: 11000 });
  });

  it('declares email as a unique index on the schema', async () => {
    const indexes = await User.collection.indexes();
    const emailIndex = indexes.find((index) => index.key.email === 1);

    expect(emailIndex).toBeDefined();
    expect(emailIndex.unique).toBe(true);
  });
});

describe('password visibility', () => {
  it('excludes password from query results by default', async () => {
    const payload = buildUser();

    await User.create(payload);
    const user = await User.findOne({ email: payload.email });

    expect(user.password).toBeUndefined();
    expect(user.toObject().password).toBeUndefined();
  });

  it('includes password only when explicitly selected', async () => {
    const payload = buildUser();

    await User.create(payload);
    const user = await User.findOne({ email: payload.email }).select('+password');

    expect(user.password).toMatch(BCRYPT_HASH_PATTERN);
  });

  it('strips password and __v from toJSON output', async () => {
    const payload = buildUser();

    await User.create(payload);
    const user = await User.findOne({ email: payload.email }).select('+password');
    const json = user.toJSON();

    expect(json.password).toBeUndefined();
    expect(json.__v).toBeUndefined();
    expect(json.name).toBe(payload.name);
    expect(json.email).toBe(payload.email);
  });
});

describe('timestamps', () => {
  it('maintains createdAt and updatedAt automatically', async () => {
    const user = await User.create(buildUser());

    expect(user.createdAt).toBeInstanceOf(Date);
    expect(user.updatedAt).toBeInstanceOf(Date);
  });

  it('bumps updatedAt when the document is modified', async () => {
    const user = await User.create(buildUser());
    const createdAt = user.createdAt.getTime();

    await new Promise((resolve) => setTimeout(resolve, 20));
    user.name = 'Augusta King';
    await user.save();

    expect(user.updatedAt.getTime()).toBeGreaterThan(createdAt);
  });
});

describe('email normalization', () => {
  it('persists email in lowercase', async () => {
    const user = await User.create(buildUser({ email: 'Ada.Lovelace@Example.COM' }));

    expect(user.email).toBe('ada.lovelace@example.com');
    expect((await User.findOne({ email: 'ada.lovelace@example.com' })).email).toBe(
      'ada.lovelace@example.com',
    );
  });
});

describe('validation', () => {
  it.each([
    ['name shorter than 2 chars', { name: 'A' }],
    ['name longer than 50 chars', { name: 'A'.repeat(51) }],
    ['missing name', { name: undefined }],
    ['missing email', { email: undefined }],
    ['missing password', { password: undefined }],
    ['malformed email without @', { email: 'not-an-email' }],
    ['malformed email without domain', { email: 'ada@' }],
    ['password shorter than 8 chars', { password: 'short1' }],
  ])('rejects %s', async (_label, overrides) => {
    await expect(User.create(buildUser(overrides))).rejects.toThrow(/validation failed/i);
  });
});

describe('connectDB', () => {
  it('resolves with the connection when MongoDB is reachable', async () => {
    const conn = await connectDB(testUri);

    expect(mongoose.connection.readyState).toBe(1);
    expect(conn.connection.host).toEqual(expect.any(String));
  });

  it('exits non-zero with a clear error when the URI is unreachable', async () => {
    const { code, stderr } = await runNode(
      [
        '--input-type=module',
        '-e',
        `const { connectDB } = await import(${JSON.stringify(dbModuleUrl)}); await connectDB('not-a-valid-mongo-uri');`,
      ],
      { ...testEnv },
    );

    expect(code).not.toBe(0);
    expect(stderr).toMatch(/MongoDB connection failed/);
  });

  it('refuses to listen when MONGO_URI is unreachable (fail fast)', async () => {
    const { code, stderr } = await runNode([serverEntry], {
      ...testEnv,
      MONGO_URI: 'not-a-valid-mongo-uri',
    });

    expect(code).not.toBe(0);
    expect(stderr).toMatch(/MongoDB connection failed/);
  });
});

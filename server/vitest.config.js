import { defineConfig } from 'vitest/config';

import testEnv from './tests/fixtures/testEnv.js';

export default defineConfig({
  test: {
    environment: 'node',
    include: ['tests/**/*.test.js'],
    // Tests never read a real `.env`; fixtures provide deterministic values.
    env: testEnv,
  },
});

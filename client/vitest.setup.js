import '@testing-library/jest-dom/vitest';
import { cleanup } from '@testing-library/react';
import { afterEach } from 'vitest';

// Vitest does not expose globals here, so register Testing Library
// cleanup explicitly to unmount each render after every test.
afterEach(() => {
  cleanup();
});

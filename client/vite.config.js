import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// Frontend scaffolding (TASK-009): Vite is used instead of CRA because
// Create React App is deprecated. Dev server port 3000 per ARCHITECTURE §1.
export default defineConfig({
  plugins: [react()],
  server: {
    port: 3000,
  },
  test: {
    environment: 'jsdom',
    setupFiles: ['./vitest.setup.js'],
    // TASK-010: service/util tests are plain `.test.js`; component tests stay `.test.jsx`.
    include: ['src/**/*.test.{js,jsx}'],
  },
});

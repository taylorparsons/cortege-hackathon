import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './e2e',
  timeout: 30000,
  retries: 0,
  // Serialize tests to avoid shared-backend state conflicts between parallel workers
  workers: 1,
  use: {
    baseURL: 'http://localhost:5173',
    headless: true,
  },
  webServer: [
    {
      command: 'node server/index.js',
      port: 3001,
      reuseExistingServer: true,
      timeout: 10000,
    },
    {
      command: 'npx vite --port 5173',
      port: 5173,
      reuseExistingServer: true,
      timeout: 10000,
    },
  ],
});

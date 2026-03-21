import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './e2e',
  testMatch: 'demo-recording.spec.js',
  timeout: 300000, // 5 min — demo is ~3 min with pauses
  retries: 0,
  workers: 1,
  use: {
    baseURL: 'http://localhost:5173',
    headless: true,
    viewport: { width: 1280, height: 720 },
    video: {
      mode: 'on',
      size: { width: 1280, height: 720 },
    },
    launchOptions: {
      slowMo: 100, // slight slowdown for smoother mouse movements
    },
  },
  outputDir: 'demo/playwright-results',
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

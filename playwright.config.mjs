import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './tests/browser',
  fullyParallel: true,
  reporter: 'list',
  outputDir: '.local/playwright-results',
  use: {
    channel: 'chrome',
    headless: true,
    viewport: { width: 1280, height: 900 },
    screenshot: 'only-on-failure',
  },
});

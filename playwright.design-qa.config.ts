import { defineConfig } from '@playwright/test';
import config from './playwright.config';

export default defineConfig({
  ...config,
  workers: 2,
  use: { ...config.use, baseURL: 'http://127.0.0.1:3200', contextOptions: { reducedMotion: 'reduce' } },
  webServer: {
    command: 'npm run design:qa:serve',
    url: 'http://127.0.0.1:3200/admin/login',
    reuseExistingServer: true,
    timeout: 120_000
  }
});

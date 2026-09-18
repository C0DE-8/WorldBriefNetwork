import { defineConfig } from '@playwright/test'

export default defineConfig({
  testDir: './tests',
  timeout: 90_000,
  use: {
    baseURL: 'http://localhost:5173',
    headless: true,
    browserName: 'chromium',
    launchOptions: { executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome' },
  },
})

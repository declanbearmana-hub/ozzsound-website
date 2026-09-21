const { defineConfig, devices } = require('@playwright/test');

module.exports = defineConfig({
  testDir: './tests',
  timeout: 30000,
  expect: { timeout: 5000 },
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? [['list'], ['html', { outputFolder: 'playwright-report', open: 'never' }]] : 'list',
  use: {
    baseURL: 'http://127.0.0.1:4173',
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure'
  },
  projects: [
    { name: 'desktop-chromium', use: { ...devices['Desktop Chrome'] } },
    { name: 'desktop-webkit', use: { ...devices['Desktop Safari'] } },

    // Apple / Mobile Safari coverage: small, current-size and large iPhones plus iPad.
    { name: 'iphone-se-webkit', use: { ...devices['iPhone SE'] } },
    { name: 'iphone-13-webkit', use: { ...devices['iPhone 13'] } },
    { name: 'iphone-13-pro-max-webkit', use: { ...devices['iPhone 13 Pro Max'] } },
    { name: 'ipad-mini-webkit', use: { ...devices['iPad Mini'] } },
    { name: 'ipad-pro-11-webkit', use: { ...devices['iPad Pro 11'] } },

    // Android / Mobile Chrome coverage: compact and large phone/tablet layouts.
    { name: 'pixel-5-chromium', use: { ...devices['Pixel 5'] } },
    { name: 'pixel-7-chromium', use: { ...devices['Pixel 7'] } },
    { name: 'galaxy-s9-chromium', use: { ...devices['Galaxy S9+'] } },
    { name: 'galaxy-tab-chromium', use: { ...devices['Galaxy Tab S4'] } }
  ],
  webServer: {
    command: 'python3 -m http.server 4173 --bind 127.0.0.1',
    url: 'http://127.0.0.1:4173',
    reuseExistingServer: !process.env.CI,
    timeout: 15000
  }
});

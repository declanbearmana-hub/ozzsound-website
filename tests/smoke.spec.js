const { test, expect } = require('@playwright/test');

const publicPages = [
  ['home', '/index.html'],
  ['gear hire', '/gear-hire.html']
];

for (const [name, path] of publicPages) {
  test(`${name} loads without a fatal browser error`, async ({ page }) => {
    const errors = [];
    page.on('pageerror', error => errors.push(error.message));
    const response = await page.goto(path, { waitUntil: 'domcontentloaded' });
    expect(response, `${path} should return a response`).not.toBeNull();
    expect(response.status(), `${path} should load successfully`).toBeLessThan(400);
    await expect(page.locator('body')).toBeVisible();
    expect(errors, `Browser errors on ${path}`).toEqual([]);
  });
}

test('admin login screen loads and core controls exist', async ({ page }) => {
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  const response = await page.goto('/admin/index.html', { waitUntil: 'domcontentloaded' });
  expect(response.status()).toBeLessThan(400);
  await expect(page.locator('#loginPage')).toBeAttached();
  await expect(page.locator('#adminArea')).toBeAttached();
  await expect(page.locator('#newEnquiryBanner')).toBeAttached();
  expect(errors).toEqual([]);
});

test('gear hire has the enquiry/cart application hooks', async ({ page }) => {
  await page.goto('/gear-hire.html', { waitUntil: 'domcontentloaded' });
  const html = await page.locator('body').innerHTML();
  expect(html.length).toBeGreaterThan(500);
  await expect(page.locator('script[src*="js/main.js"]')).toHaveCount(1);
});

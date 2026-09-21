const { test, expect } = require('@playwright/test');

const publicPages = [
  ['home','/index.html'],['wedding','/wedding.html'],['parties','/party.html'],
  ['schools','/school-functions.html'],['seasonal','/seasonal.html'],['karaoke','/karaoke.html'],
  ['gear hire','/gear-hire.html'],['corporate','/corporate.html'],['sporting','/sporting-events.html'],
  ['virtual setup','/virtual-setup.html'],['why OzzSound','/why-ozzsound.html'],
  ['event enquiry','/event-enquiry.html'],['gear enquiry','/enquiry.html'],
  ['karaoke enquiry','/karaoke-enquiry.html'],['my event','/my-event.html'],
  ['privacy','/privacy.html'],['terms','/terms.html'],['security','/security.html'],
  ['cookies','/cookies.html'],['copyright','/copyright.html'],['404','/404.html']
];

for (const [name, path] of publicPages) {
  test(`${name} loads cleanly`, async ({ page }) => {
    const errors = [];
    page.on('pageerror', e => errors.push(e.message));
    const response = await page.goto(path, { waitUntil: 'domcontentloaded' });
    expect(response, `${path} should return a response`).not.toBeNull();
    expect(response.status(), `${path} should load successfully`).toBeLessThan(400);
    await expect(page.locator('body')).toBeVisible();
    expect(errors, `Browser errors on ${path}`).toEqual([]);
  });
}

test('all internal links on public pages resolve', async ({ page, request }) => {
  const checked = new Set();
  for (const [, path] of publicPages.filter(([,p]) => p !== '/404.html')) {
    await page.goto(path, { waitUntil: 'domcontentloaded' });
    const hrefs = await page.locator('a[href]').evaluateAll(as => as.map(a => a.getAttribute('href')));
    for (const href of hrefs) {
      if (!href || href.startsWith('#') || /^(mailto:|tel:|https?:|javascript:)/i.test(href)) continue;
      const url = new URL(href, 'http://127.0.0.1:4173' + path);
      const key = url.pathname;
      if (checked.has(key)) continue;
      checked.add(key);
      const response = await request.get(url.pathname);
      expect(response.status(), `Broken internal link: ${href} found on ${path}`).toBeLessThan(400);
    }
  }
});

test('mobile pages do not overflow horizontally', async ({ page }, testInfo) => {
  test.skip(!testInfo.project.name.includes('mobile'));
  for (const [, path] of publicPages.filter(([,p]) => !['/404.html'].includes(p))) {
    await page.goto(path, { waitUntil: 'domcontentloaded' });
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth + 2);
    expect(overflow, `Horizontal overflow on ${path}`).toBeFalsy();
  }
});

test('development pages clearly show their holding notice', async ({ page }) => {
  for (const path of ['/corporate.html','/sporting-events.html','/virtual-setup.html']) {
    await page.goto(path);
    await expect(page.locator('.developmentGate')).toBeVisible();
    await expect(page.locator('.developmentGate')).toContainText('still being developed');
  }
});

test('core customer journeys keep their enquiry routes', async ({ page }) => {
  await page.goto('/index.html');
  await expect(page.locator('a[href="wedding.html"]').first()).toBeVisible();
  await expect(page.locator('a[href="party.html"]').first()).toBeVisible();
  await expect(page.locator('a[href="school-functions.html"]').first()).toBeVisible();
  await expect(page.locator('a[href="corporate.html"]').first()).toBeVisible();
  await expect(page.locator('a[href="sporting-events.html"]').first()).toBeVisible();

  await page.goto('/gear-hire.html');
  await expect(page.locator('#gearEnquire')).toHaveAttribute('href', /event-enquiry\.html/);
});

test('admin login screen and core controls exist', async ({ page }) => {
  const errors = [];
  page.on('pageerror', e => errors.push(e.message));
  const response = await page.goto('/admin/index.html', { waitUntil: 'domcontentloaded' });
  expect(response.status()).toBeLessThan(400);
  await expect(page.locator('#loginPage')).toBeAttached();
  await expect(page.locator('#adminArea')).toBeAttached();
  await expect(page.locator('#newEnquiryBanner')).toBeAttached();
  expect(errors).toEqual([]);
});

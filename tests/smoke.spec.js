const { test, expect } = require('@playwright/test');

const ignoredConsolePatterns = [
  /Tracking Prevention blocked access to storage/i,
  /Failed to load resource.*404/i
];

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
  test.skip(testInfo.project.name.startsWith('desktop-'));
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


test('no literal escaped newline text is rendered on site pages', async ({ page }) => {
  for (const [, path] of publicPages) {
    await page.goto(path, { waitUntil: 'domcontentloaded' });
    const visibleText = await page.locator('body').innerText();
    expect(visibleText, `Literal escaped newline rendered on ${path}`).not.toMatch(/(^|\n)\\n($|\n)/);
  }
});

test('event builders route into the unified final enquiry', async ({ page }) => {
  const routes = [
    ['/wedding.html', '#wedNext'],
    ['/party.html', null],
    ['/school-functions.html', '[data-school-handoff]'],
    ['/seasonal.html', null],
    ['/karaoke.html', null],
    ['/gear-hire.html', '#gearEnquire'],
    ['/corporate.html', null],
    ['/sporting-events.html', null]
  ];
  for (const [path] of routes) {
    await page.goto(path, { waitUntil: 'domcontentloaded' });
    const oldSubmit = page.locator('form[action="enquiry.html"], form[action="karaoke-enquiry.html"]');
    await expect(oldSubmit, `Legacy enquiry form found on ${path}`).toHaveCount(0);
  }
});

test('removed DJ Dazz dress-up choice does not return', async ({ page }) => {
  for (const path of ['/school-functions.html','/party.html']) {
    await page.goto(path, { waitUntil: 'domcontentloaded' });
    const body = await page.locator('body').innerText();
    expect(body).not.toMatch(/dress[- ]?up\s+(?:dj\s+)?dazz/i);
  }
});

test('public pages have no duplicate element ids', async ({ page }) => {
  for (const [, path] of publicPages.filter(([,p]) => p !== '/404.html')) {
    await page.goto(path, { waitUntil: 'domcontentloaded' });
    const duplicates = await page.evaluate(() => {
      const ids = [...document.querySelectorAll('[id]')].map(el => el.id).filter(Boolean);
      return [...new Set(ids.filter((id, i) => ids.indexOf(id) !== i))];
    });
    expect(duplicates, `Duplicate IDs on ${path}`).toEqual([]);
  }
});

const { test, expect } = require('@playwright/test');

const ignoredConsolePatterns = [
  /Tracking Prevention blocked access to storage/i,
  /Failed to load resource.*404/i
];

const publicPages = [
  ['home','/index.html'],['wedding','/wedding.html'],['parties','/party.html'],
  ['schools','/school-functions.html'],['seasonal','/seasonal.html'],['karaoke','/karaoke.html'],
  ['gear hire','/gear-hire.html'],['corporate','/corporate.html'],['sporting','/sporting-events.html'],
  ['virtual setup','/virtual-setup.html'],['why OzzSound','/why-ozzsound.html'],['Meet Dazz','/meet-dazz.html'],
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
    ['/wedding.html', '#wedNext'], ['/party.html', null], ['/school-functions.html', '[data-school-handoff]'],
    ['/seasonal.html', null], ['/karaoke.html', null], ['/gear-hire.html', '#gearEnquire'],
    ['/corporate.html', null], ['/sporting-events.html', null]
  ];
  for (const [path] of routes) {
    await page.goto(path, { waitUntil: 'domcontentloaded' });
    await expect(page.locator('form[action="enquiry.html"], form[action="karaoke-enquiry.html"]'), `Legacy enquiry form found on ${path}`).toHaveCount(0);
  }
});

test('removed DJ Dazz dress-up choice does not return', async ({ page }) => {
  for (const path of ['/school-functions.html','/party.html']) {
    await page.goto(path, { waitUntil: 'domcontentloaded' });
    expect(await page.locator('body').innerText()).not.toMatch(/dress[- ]?up\s+(?:dj\s+)?dazz/i);
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

test('temporary website notice is below navigation and can be dismissed', async ({ page }) => {
  await page.goto('/index.html', { waitUntil: 'domcontentloaded' });
  const nav = page.locator('body > nav.nav, body > .nav').first();
  const banner = page.locator('.ozz-work-banner');
  await expect(nav).toBeVisible();
  await expect(banner).toBeVisible();
  const order = await page.evaluate(() => {
    const nav = document.querySelector('body > nav.nav, body > .nav');
    const banner = document.querySelector('.ozz-work-banner');
    return !!(nav && banner && (nav.compareDocumentPosition(banner) & Node.DOCUMENT_POSITION_FOLLOWING));
  });
  expect(order, 'Website update notice should render after the navigation').toBeTruthy();
  const [navBox, bannerBox] = await Promise.all([nav.boundingBox(), banner.boundingBox()]);
  expect(bannerBox.y).toBeGreaterThanOrEqual(navBox.y + navBox.height - 1);
  const logoBox = await page.locator('nav .logo').boundingBox();
  expect(bannerBox.y).toBeGreaterThanOrEqual(logoBox.y + logoBox.height - 1);
  await banner.locator('.ozz-work-banner-close').click();
  await expect(banner).toHaveCount(0);
});

test('request-a-call controls are accessible and open the callback form', async ({ page }) => {
  await page.goto('/index.html', { waitUntil: 'domcontentloaded' });
  await expect(page.getByRole('button', { name: /request a call/i }).first()).toBeVisible();
  await page.getByRole('button', { name: /request a call/i }).first().click();
  const dialog = page.getByRole('dialog', { name: /request a call from ozzsound/i });
  await expect(dialog).toBeVisible();
  await expect(dialog.locator('input[name="name"]')).toHaveAttribute('required', '');
  await expect(dialog.locator('input[name="phone"]')).toHaveAttribute('required', '');
});

test('mobile home keeps primary hero actions clear of temporary notice', async ({ page }, testInfo) => {
  test.skip(testInfo.project.name.startsWith('desktop-'));
  await page.goto('/index.html', { waitUntil: 'domcontentloaded' });
  const banner = page.locator('.ozz-work-banner');
  const hero = page.locator('.hero').first();
  await expect(banner).toBeVisible();
  await expect(hero).toBeVisible();
  const boxes = await Promise.all([banner.boundingBox(), hero.boundingBox()]);
  expect(boxes[0] && boxes[1] && boxes[0].y + boxes[0].height <= boxes[1].y + 5, 'Temporary notice should not overlap the hero').toBeTruthy();
});

test('school quick choices can be selected and unselected', async ({ page }) => {
  await page.goto('/school-functions.html', { waitUntil: 'domcontentloaded' });
  const choice = page.locator('#schoolVibeChoices .schoolChoice').first();
  await choice.click();
  await expect(choice).toHaveClass(/selected/);
  await choice.click();
  await expect(choice).not.toHaveClass(/selected/);
});

test('party builder carries customer choices into final enquiry', async ({ page }) => {
  await page.goto('/party.html', { waitUntil: 'domcontentloaded' });
  await page.evaluate(() => localStorage.setItem('ozzsoundPartyBuilder', JSON.stringify({
    type:'21st Birthday', vibe:'Dance party', crowd:'Mixed ages', music:['90s','Current Hits'],
    musicControl:'Let Dazz read the room', moments:['Speeches / microphone'], fun:[],
    extras:['Karaoke','Bubble machine'], strobe:'No', strobeApproval:'Not applicable',
    date:'2027-02-20', venue:'Test Venue, Hobart', guests:'80', setting:'Indoor', notes:'Test carry-over note'
  })));
  await page.goto('/event-enquiry.html?event=Birthday%20%26%20Party&from=party', { waitUntil: 'domcontentloaded' });
  await expect(page.locator('#eventType')).toHaveValue('Birthday & Party');
  await expect(page.locator('#eventDate')).toHaveValue('2027-02-20');
  await expect(page.locator('[name="venue"]')).toHaveValue('Test Venue, Hobart');
  await expect(page.locator('[name="guests"]')).toHaveValue('80');
  await expect(page.locator('#extraKaraoke')).toBeChecked();
  await expect(page.locator('#extraBubble')).toBeChecked();
  await expect(page.locator('textarea[name="message"]')).toHaveValue(/21st Birthday/);
  await expect(page.locator('textarea[name="message"]')).toHaveValue(/Test carry-over note/);
});

test('wedding builder carries planning details and activates wedding agreement', async ({ page }) => {
  await page.goto('/wedding.html', { waitUntil: 'domcontentloaded' });
  await page.evaluate(() => localStorage.setItem('ozzsoundWeddingBuilder', JSON.stringify({
    coverage:['Reception'], setting:'Indoor', style:'Modern party', ceremonyNeeds:['Wireless microphone'],
    receptionNeeds:['MC service'], extras:['Smoke machine','Karaoke'], date:'2027-03-13',
    venue:'Wedding Test Venue, Hobart', guests:'120', mustPlay:'Test first dance',
    wouldLove:'90s dance', doNotPlay:'Test banned song', timeline:[{time:'7:30 PM',event:'First dance'}]
  })));
  await page.goto('/event-enquiry.html?event=Wedding&from=wedding', { waitUntil: 'domcontentloaded' });
  await expect(page.locator('#eventType')).toHaveValue('Wedding');
  await expect(page.locator('#eventDate')).toHaveValue('2027-03-13');
  await expect(page.locator('[name="venue"]')).toHaveValue('Wedding Test Venue, Hobart');
  await expect(page.locator('[name="guests"]')).toHaveValue('120');
  await expect(page.locator('#extraKaraoke')).toBeChecked();
  await expect(page.locator('#extraSmoke')).toBeChecked();
  await expect(page.locator('textarea[name="message"]')).toHaveValue(/Test first dance/);
  await expect(page.locator('textarea[name="message"]')).toHaveValue(/First dance/);
  await expect(page.locator('#weddingContract')).toBeVisible();
  await expect(page.locator('[name="weddingSignature"]')).toHaveAttribute('required', '');
  await expect(page.locator('#weddingEffectsCheck')).toBeVisible();
});

test('school builder carries choices into the unified final enquiry', async ({ page }) => {
  await page.goto('/school-functions.html', { waitUntil: 'domcontentloaded' });
  await page.evaluate(() => localStorage.setItem('ozzsoundSchoolPlan', JSON.stringify({
    vibe:'A bit of both', extras:['Karaoke','Bubble machine','Air guitar competition'],
    strobe:'No', strobeApproval:'Not applicable'
  })));
  await page.goto('/event-enquiry.html?event=School%20Function&from=school', { waitUntil: 'domcontentloaded' });
  await expect(page.locator('#eventType')).toHaveValue('School Function');
  await expect(page.locator('#extraKaraoke')).toBeChecked();
  await expect(page.locator('#extraBubble')).toBeChecked();
  await expect(page.locator('textarea[name="message"]')).toHaveValue(/A bit of both/);
  await expect(page.locator('textarea[name="message"]')).toHaveValue(/Air guitar competition/);
  await expect(page.locator('textarea[name="message"]')).toHaveValue(/Strobe lighting: No/);
});

test('seasonal builder carries event details into the unified final enquiry', async ({ page }) => {
  await page.goto('/seasonal.html', { waitUntil: 'domcontentloaded' });
  await page.evaluate(() => localStorage.setItem('ozzsoundSeasonalBuilder', JSON.stringify({
    season:'Halloween', vibe:'Big party', music:['80s','Current Hits'], musicControl:'Let Dazz read the room',
    extras:['Karaoke','Bubble machine','Costume competition'], moments:['Prize presentation'],
    strobe:'No', strobeApproval:'Not applicable', date:'2027-10-30', venue:'Seasonal Test Venue, Hobart',
    guests:'150', crowd:'Mixed ages', notes:'Seasonal test carry-over note'
  })));
  await page.goto('/event-enquiry.html?event=Seasonal%20Event&from=seasonal', { waitUntil: 'domcontentloaded' });
  await expect(page.locator('#eventType')).toHaveValue('Seasonal Event');
  await expect(page.locator('#eventDate')).toHaveValue('2027-10-30');
  await expect(page.locator('[name="venue"]')).toHaveValue('Seasonal Test Venue, Hobart');
  await expect(page.locator('[name="guests"]')).toHaveValue('150');
  await expect(page.locator('#extraKaraoke')).toBeChecked();
  await expect(page.locator('#extraBubble')).toBeChecked();
  await expect(page.locator('textarea[name="message"]')).toHaveValue(/Halloween/);
  await expect(page.locator('textarea[name="message"]')).toHaveValue(/Costume competition/);
  await expect(page.locator('textarea[name="message"]')).toHaveValue(/Prize presentation/);
  await expect(page.locator('textarea[name="message"]')).toHaveValue(/Seasonal test carry-over note/);
});

test('karaoke builder carries music preferences into the unified final enquiry', async ({ page }) => {
  await page.goto('/karaoke.html', { waitUntil: 'domcontentloaded' });
  await page.evaluate(() => localStorage.setItem('ozzsoundKaraoke', JSON.stringify({
    eras:['80s','90s'], genres:['Rock','Pop'], event:'Birthday party', requests:'Bon Jovi and Queen'
  })));
  await page.goto('/event-enquiry.html?event=Karaoke&from=karaoke', { waitUntil: 'domcontentloaded' });
  await expect(page.locator('#eventType')).toHaveValue('Karaoke');
  await expect(page.locator('textarea[name="message"]')).toHaveValue(/80s, 90s/);
  await expect(page.locator('textarea[name="message"]')).toHaveValue(/Rock, Pop/);
  await expect(page.locator('textarea[name="message"]')).toHaveValue(/Birthday party/);
  await expect(page.locator('textarea[name="message"]')).toHaveValue(/Bon Jovi and Queen/);
});

test('Meet Dazz shows the supplied image and keeps the booking route', async ({ page }) => {
  await page.goto('/meet-dazz.html');
  await expect(page.getByRole('heading', { level: 1 })).toContainText('Meet Dazz');
  const portrait = page.locator('.dazzHero .dazzPortrait img');
  await expect(portrait).toBeVisible();
  await expect.poll(() => portrait.evaluate(img => img.complete && img.naturalWidth > 0)).toBe(true);
  await expect(page.locator('.dazzTimeline li')).toHaveCount(3);
  await expect(page.locator('.dazzHero a.btn.primary')).toHaveAttribute('href', 'event-enquiry.html');
  await expect(page.locator('.decwebCredit')).toContainText('© 2026 DECWEB Digital Design');
});

test('Meet Dazz navigation works on desktop and mobile', async ({ page }, testInfo) => {
  await page.goto('/index.html');
  if (!(await page.locator('#menuToggle').isVisible())) {
    await page.locator('.aboutDrop .navDropButton').click();
    await page.locator('.aboutDrop a[href="meet-dazz.html"]').click();
  } else {
    await page.locator('#menuToggle').click();
    await page.locator('#mobileMenu a[href="meet-dazz.html"]').click();
  }
  await expect(page).toHaveURL(/meet-dazz\.html$/);
  await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
});

test('Meet Dazz respects reduced motion', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/meet-dazz.html');
  const animation = await page.locator('.dazzHero .dazzPortrait img').evaluate(img => getComputedStyle(img).animationName);
  expect(animation).toBe('none');
  await expect(page.locator('.dazzIntro')).toBeVisible();
});

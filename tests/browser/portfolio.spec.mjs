import { test, expect } from '@playwright/test';

const previewUrl = new URL('../../.local/portfolio-preview.html', import.meta.url).href;

test.beforeEach(async ({ page }) => {
  await page.goto(previewUrl);
});

test('loads core content and the interactive module without browser errors', async ({ page }) => {
  const errors = [];
  page.on('pageerror', (error) => errors.push(error.message));
  await page.reload();
  await expect(page.getByRole('heading', { level: 1 })).toContainText('Gitesh Pareek');
  await expect(page.getByRole('heading', { name: 'Prism', exact: true })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Planet Sustech', exact: true })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Bit 7, value 128', exact: true })).toBeEnabled();
  await expect(page.locator('#local-time')).toHaveText(/^\d{2}:\d{2}$/);
  expect(errors).toEqual([]);
});

test('bit controls update all representations and support keyboard input', async ({ page }) => {
  await expect(page.locator('#byte-decimal')).toHaveText('71');
  const bit = page.getByRole('button', { name: 'Bit 7, value 128', exact: true });
  await bit.click();
  await expect(bit).toHaveAttribute('aria-pressed', 'true');
  await expect(page.locator('#byte-decimal')).toHaveText('199');
  await expect(page.locator('#byte-hex')).toHaveText('0xC7');
  await expect(page.locator('#byte-ascii')).toHaveText('Non-ASCII');
  await expect(page.locator('#byte-binary')).toHaveText('0b11000111');
  await bit.focus();
  await page.keyboard.press('Space');
  await expect(page.locator('#byte-ascii')).toHaveText('G');
  await expect(bit).toHaveAttribute('aria-pressed', 'false');
});

test('presets, inversion, and reset produce correct values', async ({ page }) => {
  await page.getByRole('button', { name: 'Set byte to ASCII P', exact: true }).click();
  await expect(page.locator('#byte-decimal')).toHaveText('80');
  await expect(page.locator('#byte-ascii')).toHaveText('P');
  await page.getByRole('button', { name: 'invert', exact: true }).click();
  await expect(page.locator('#byte-decimal')).toHaveText('175');
  await page.getByRole('button', { name: 'reset', exact: true }).click();
  await expect(page.locator('#byte-decimal')).toHaveText('71');
  await expect(page.locator('#byte-binary')).toHaveText('0b01000111');
});

test('live byte counter advances, pauses, resumes, and wraps independently of the playground', async ({ page }) => {
  await page.clock.install();
  await page.reload();
  await page.clock.pauseAt(new Date(Date.now() + 100));
  await page.clock.runFor(3000);
  await expect(page.locator('#live-counter-decimal')).toHaveText('003');
  await expect(page.locator('#live-counter-binary')).toHaveText('00000011');
  await page.getByRole('button', { name: 'Pause live counter', exact: true }).click();
  await page.clock.runFor(3000);
  await expect(page.locator('#live-counter-decimal')).toHaveText('003');
  await page.getByRole('button', { name: 'Resume live counter', exact: true }).click();
  await page.clock.runFor(253000);
  await expect(page.locator('#live-counter-decimal')).toHaveText('000');
  await expect(page.locator('#live-counter-binary')).toHaveText('00000000');
  await expect(page.locator('#byte-decimal')).toHaveText('71');
});

test('live counter starts paused for reduced-motion visitors', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.clock.install();
  await page.reload();
  await page.clock.pauseAt(new Date(Date.now() + 100));
  await page.clock.runFor(3000);
  await expect(page.getByRole('button', { name: 'Resume live counter', exact: true })).toBeVisible();
  await expect(page.locator('#live-counter-decimal')).toHaveText('000');
  await page.getByRole('button', { name: 'Resume live counter', exact: true }).click();
  await page.clock.runFor(1000);
  await expect(page.locator('#live-counter-decimal')).toHaveText('001');
});

test('technical details and section links work', async ({ page }) => {
  const project = page.locator('article').filter({ has: page.getByRole('heading', { name: 'Prism', exact: true }) });
  await project.locator('summary').click();
  await expect(project.locator('details')).toHaveAttribute('open', '');
  await expect(project.locator('.details-content')).toBeVisible();
  await page.getByRole('navigation').getByRole('link', { name: 'playground' }).click();
  await expect(page).toHaveURL(/#playground$/);
});

test('contact stays usable when clipboard access fails', async ({ page }) => {
  await page.addInitScript(() => {
    Object.defineProperty(navigator, 'clipboard', {
      configurable: true,
      value: { writeText: async () => { throw new Error('Clipboard unavailable'); } },
    });
  });
  await page.reload();
  await page.getByRole('button', { name: 'Copy email address', exact: true }).click();
  await expect(page.locator('#copy-status')).toContainText('Select the address or use the email link');
  await expect(page.locator('.email-row a')).toHaveAttribute('href', 'mailto:pareekgitesh89@gmail.com');
});

for (const width of [320, 390, 768, 1280]) {
  test(`fits a ${width}px viewport with readable bit values`, async ({ page }) => {
    await page.setViewportSize({ width, height: 900 });
    await page.getByRole('button', { name: 'Bit 7, value 128', exact: true }).click();
    const geometry = await page.evaluate(() => {
      const ascii = document.querySelector('#byte-ascii');
      return {
        pageWidth: document.documentElement.scrollWidth,
        viewport: innerWidth,
        asciiWidth: ascii.scrollWidth,
        asciiBoxWidth: ascii.clientWidth,
      };
    });
    expect(geometry.pageWidth).toBeLessThanOrEqual(geometry.viewport);
    expect(geometry.asciiWidth).toBeLessThanOrEqual(geometry.asciiBoxWidth);
    await page.screenshot({ path: `.local/portfolio-${width}.png`, fullPage: true });
  });
}

test('professional content and contact are available without JavaScript', async ({ browser }) => {
  const context = await browser.newContext({ javaScriptEnabled: false });
  const page = await context.newPage();
  await page.goto(previewUrl);
  await expect(page.getByRole('heading', { name: 'Document Intelligence', exact: true })).toBeVisible();
  await expect(page.getByRole('link', { name: 'Get in touch', exact: true })).toHaveAttribute('href', 'mailto:pareekgitesh89@gmail.com');
  await expect(page.getByRole('button', { name: 'Bit 7, value 128', exact: true })).toBeDisabled();
  await context.close();
});

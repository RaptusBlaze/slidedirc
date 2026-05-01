import { test, expect } from '@playwright/test';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const fixturesA = path.resolve(__dirname, '../fixtures/a');
const fixturesB = path.resolve(__dirname, '../fixtures/b');

test('empty drop-zone state', async ({ page }) => {
  await page.goto('/');
  await page.waitForLoadState('networkidle');
  await expect(page).toHaveScreenshot('empty-dropzone.png', { maxDiffPixelRatio: 0.02 });
});

test('compare view with pair-1', async ({ page }) => {
  await page.goto('/');
  const inputs = page.locator('input[type=file]');
  await inputs.nth(0).setInputFiles(fixturesA);
  await inputs.nth(1).setInputFiles(fixturesB);
  await page.waitForSelector('[data-testid="rcs-main-container"], .react-compare-slider, [class*="CompareSlider"]', { timeout: 10000 }).catch(() => {});
  await page.waitForTimeout(1000);
  await expect(page).toHaveScreenshot('compare-view-pair1.png', { maxDiffPixelRatio: 0.02 });
});

test('help overlay open', async ({ page }) => {
  await page.goto('/');
  await page.keyboard.press('?');
  await page.waitForTimeout(300);
  await expect(page).toHaveScreenshot('help-overlay.png', { maxDiffPixelRatio: 0.02 });
});

test('axis mode 1 after R press', async ({ page }) => {
  await page.goto('/');
  const inputs = page.locator('input[type=file]');
  await inputs.nth(0).setInputFiles(fixturesA);
  await inputs.nth(1).setInputFiles(fixturesB);
  await page.waitForTimeout(1000);
  await page.keyboard.press('r');
  await page.waitForTimeout(300);
  await expect(page).toHaveScreenshot('axis-mode-1.png', { maxDiffPixelRatio: 0.02 });
});

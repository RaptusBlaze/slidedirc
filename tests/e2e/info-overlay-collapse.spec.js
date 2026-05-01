import { test, expect } from '@playwright/test';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const fixturesA = path.resolve(__dirname, '../fixtures/a');
const fixturesB = path.resolve(__dirname, '../fixtures/b');

test('info overlay expands and collapses metadata', async ({ page }) => {
  await page.goto('/');
  const inputs = page.locator('input[type=file]');
  await inputs.nth(0).setInputFiles(fixturesA);
  await inputs.nth(1).setInputFiles(fixturesB);
  await page.waitForTimeout(1000);

  const infoToggle = page.getByRole('button', { name: 'Toggle info panel' });
  const counter = page.getByText('3 matched');

  await expect(infoToggle).toBeVisible();
  await expect(infoToggle).toHaveAttribute('aria-expanded', 'true');
  await expect(page.locator('body')).toContainText('pair-1');
  await expect(counter).toBeVisible();

  await infoToggle.click();
  await expect(infoToggle).toHaveAttribute('aria-expanded', 'false');
  await expect(counter).not.toBeVisible();
  await expect(page.locator('body')).not.toContainText('pair-1');

  await infoToggle.click();
  await expect(infoToggle).toHaveAttribute('aria-expanded', 'true');
  await expect(page.locator('body')).toContainText('pair-1');
  await expect(counter).toBeVisible();

  await page.keyboard.press('i');
  await expect(infoToggle).toHaveAttribute('aria-expanded', 'false');
  await expect(counter).not.toBeVisible();

  await page.keyboard.press('I');
  await expect(infoToggle).toHaveAttribute('aria-expanded', 'true');
  await expect(counter).toBeVisible();
});

test('compare labels avoid the floating overlays', async ({ page }) => {
  await page.goto('/');
  const inputs = page.locator('input[type=file]');
  await inputs.nth(0).setInputFiles(fixturesA);
  await inputs.nth(1).setInputFiles(fixturesB);
  await page.waitForTimeout(1000);

  const infoToggle = page.getByRole('button', { name: 'Toggle info panel' });
  const originalLabel = page.locator('div.pointer-events-none.select-none', { hasText: 'Original' }).first();
  const editedLabel = page.locator('div.pointer-events-none.select-none', { hasText: 'Edited' }).first();
  const actionBar = page.getByTestId('action-bar');

  const infoBox = await infoToggle.boundingBox();
  const originalBox = await originalLabel.boundingBox();
  const editedBox = await editedLabel.boundingBox();
  const actionBarBox = await actionBar.boundingBox();

  expect(infoBox).not.toBeNull();
  expect(originalBox).not.toBeNull();
  expect(editedBox).not.toBeNull();
  expect(actionBarBox).not.toBeNull();

  expect(originalBox.x).toBeGreaterThan(infoBox.x + infoBox.width);
  expect(editedBox.x + editedBox.width).toBeLessThan(actionBarBox.x);
  const leftGap = originalBox.x - (infoBox.x + infoBox.width);
  const rightGap = actionBarBox.x - (editedBox.x + editedBox.width);
  expect(Math.abs(rightGap - leftGap)).toBeLessThan(4);
  expect(Math.abs(editedBox.y - (actionBarBox.y + 10))).toBeLessThan(4);
  expect(Math.abs(originalBox.y - infoBox.y)).toBeLessThan(2);
  expect(Math.abs(originalBox.height - infoBox.height)).toBeLessThan(2);
});

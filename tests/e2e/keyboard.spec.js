import { test, expect } from '@playwright/test'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const fixturesA = path.resolve(__dirname, '../fixtures/a')
const fixturesB = path.resolve(__dirname, '../fixtures/b')

test('keyboard navigation and shortcuts', async ({ page }) => {
  await page.goto('/')
  const inputs = page.locator('input[type=file]')
  await inputs.nth(0).setInputFiles(fixturesA)
  await inputs.nth(1).setInputFiles(fixturesB)
  await page.waitForTimeout(1000)

  await expect(page.locator('body')).toContainText('pair-1')

  await page.keyboard.press('ArrowRight')
  await page.waitForTimeout(300)
  await expect(page.locator('body')).toContainText('pair-2')

  await page.keyboard.press('ArrowRight')
  await page.waitForTimeout(300)
  await expect(page.locator('body')).toContainText('pair-3')

  await page.keyboard.press('ArrowLeft')
  await page.waitForTimeout(300)
  await expect(page.locator('body')).toContainText('pair-2')

  await page.keyboard.press('r')
  await page.keyboard.press('r')
  await page.keyboard.press('r')
  await page.keyboard.press('r')
  await page.waitForTimeout(300)

  await page.keyboard.press('?')
  await page.waitForTimeout(300)
  await expect(page.locator('h2', { hasText: /keyboard shortcuts/i })).toBeVisible()

  await page.keyboard.press('?')
  await page.waitForTimeout(300)
  await expect(page.locator('h2', { hasText: /keyboard shortcuts/i })).not.toBeVisible()
})

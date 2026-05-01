import { test, expect } from '@playwright/test'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const fixturesA = path.resolve(__dirname, '../fixtures/a')
const fixturesB = path.resolve(__dirname, '../fixtures/b')

test('drop two folders and see compare view', async ({ page }) => {
  await page.goto('/')
  const inputs = page.locator('input[type=file]')
  await inputs.nth(0).setInputFiles(fixturesA)
  await inputs.nth(1).setInputFiles(fixturesB)
  await page.waitForTimeout(1000)
  await expect(page.locator('body')).toContainText('pair-1')
  await page.screenshot({ path: '.sisyphus/evidence/task-5-drop-match.png' })
})

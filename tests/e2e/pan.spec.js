import { test, expect } from '@playwright/test'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const fixturesA = path.resolve(__dirname, '../fixtures/a')
const fixturesB = path.resolve(__dirname, '../fixtures/b')

test('spacebar tap-toggle and hold pan modes', async ({ page }) => {
  await page.goto('/')
  const inputs = page.locator('input[type=file]')
  await inputs.nth(0).setInputFiles(fixturesA)
  await inputs.nth(1).setInputFiles(fixturesB)
  await page.waitForTimeout(1000)

  const container = page.locator('div.relative.w-full.h-full.overflow-hidden').first()
  const box = await container.boundingBox()
  const cx = box.x + box.width / 2
  const cy = box.y + box.height / 2
  await page.mouse.move(cx, cy)

  await page.keyboard.down('Control')
  await page.mouse.wheel(0, -300)
  await page.keyboard.up('Control')
  await page.waitForTimeout(300)

  expect(await container.evaluate(el => el.style.cursor)).toBe('default')

  await page.keyboard.press('Space', { delay: 100 })
  await page.waitForTimeout(100)
  expect(await container.evaluate(el => el.style.cursor)).toBe('grab')

  await page.keyboard.press('Space', { delay: 100 })
  await page.waitForTimeout(100)
  expect(await container.evaluate(el => el.style.cursor)).toBe('default')

  await page.keyboard.down('Space')
  await page.waitForTimeout(500)
  expect(await container.evaluate(el => el.style.cursor)).toBe('grab')
  await page.keyboard.up('Space')
  await page.waitForTimeout(100)
  expect(await container.evaluate(el => el.style.cursor)).toBe('default')
})

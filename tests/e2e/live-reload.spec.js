import { test, expect } from '@playwright/test'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const fixturesA = path.resolve(__dirname, '../fixtures/a')
const fixturesB = path.resolve(__dirname, '../fixtures/b')

test('live-reload polling works without StrictMode leaks', async ({ page }) => {
  await page.addInitScript(() => {
    window.__liveReloadStub = { aFiles: [], bFiles: [], pickCount: 0 }
    const makeHandle = (which) => ({
      kind: 'directory',
      name: `stub-${which}`,
      async *values() {
        const list = which === 'a' ? window.__liveReloadStub.aFiles : window.__liveReloadStub.bFiles
        for (const entry of list) yield entry
      },
    })
    window.showDirectoryPicker = async () => {
      const which = window.__liveReloadStub.pickCount++ === 0 ? 'a' : 'b'
      return makeHandle(which)
    }
  })

  const errors = []
  page.on('console', msg => { if (msg.type() === 'error') errors.push(msg.text()) })

  await page.goto('/')
  const inputs = page.locator('input[type=file]')
  await inputs.nth(0).setInputFiles(fixturesA)
  await inputs.nth(1).setInputFiles(fixturesB)
  await page.waitForTimeout(1000)

  const liveBtn = page.locator('button', { hasText: /live/i })
  if (await liveBtn.count() > 0) {
    await liveBtn.click()
    await page.waitForTimeout(7000)
    const strictModeErrors = errors.filter(e =>
      /interval|Maximum update depth|duplicate|memory/i.test(e)
    )
    expect(strictModeErrors).toHaveLength(0)
    await liveBtn.click()
    await page.waitForTimeout(4000)
    const afterDisableErrors = errors.filter(e =>
      /interval|Maximum update depth/i.test(e)
    )
    expect(afterDisableErrors).toHaveLength(0)
  } else {
    test.skip()
  }
})

import { chromium } from '@playwright/test'
import { mkdir } from 'node:fs/promises'

await mkdir('docs/screenshots', { recursive: true })
const browser = await chromium.launch({ channel: 'chrome' })
try {
  for (const [width, height] of [[1440, 900], [390, 900]]) {
    const page = await browser.newPage({ viewport: { width, height }, isMobile: width === 390 })
    await page.goto('https://troetochie.com/scenarios/', { waitUntil: 'domcontentloaded' })
    await page.locator('[data-card]').first().waitFor()
    await page.screenshot({ path: 'docs/screenshots/original-' + width + '.png', animations: 'disabled' })
    if (width === 1440) {
      await page.locator('[data-card="revision"]').click()
      await page.getByRole('button', { name: 'Скопировать ответ' }).waitFor()
      await page.screenshot({ path: 'docs/screenshots/original-detail.png', animations: 'disabled' })
    }
    await page.close()
  }
} finally {
  await browser.close()
}

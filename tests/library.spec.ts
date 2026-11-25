import { expect, test } from '@playwright/test'
import { readFileSync } from 'node:fs'

const catalog = JSON.parse(readFileSync(new URL('../public/scenarios.json', import.meta.url), 'utf8'))

test('search, categories, combinations and empty reset', async ({ page }) => {
  await page.goto('/')
  await expect(page.locator('.scenario-card')).toHaveCount(22)
  await page.getByRole('button', { name: 'Клиент просит скидку', exact: true }).click()
  await expect(page.locator('.scenario-card')).toHaveCount(1)
  await expect(page.locator('.scenario-card')).toContainText('А почему так дорого?')
  await page.getByRole('button', { name: 'Продажи' }).click()
  await expect(page.locator('.scenario-card')).toHaveCount(1)
  await page.getByRole('button', { name: 'С коллегами' }).click()
  await expect(page.getByText('Сценарии не найдены')).toBeVisible()
  await page.getByRole('button', { name: 'Сбросить фильтры' }).click()
  await expect(page.locator('.scenario-card')).toHaveCount(22)
  const search = page.getByRole('searchbox')
  await search.fill('Нужно отказать')
  await expect(page.locator('.scenario-card')).toHaveCount(1)
  await search.fill('Хочу перенести срок')
  await expect(page.locator('.scenario-card')).toHaveCount(1)
})

test('clipboard, keyboard, original and direct links', async ({ page, context }) => {
  await context.grantPermissions(['clipboard-read', 'clipboard-write'])
  await page.goto('/')
  await expect(page.locator('.scenario-card')).toHaveCount(22)
  await page.keyboard.press('/')
  await expect(page.getByRole('searchbox')).toBeFocused()
  const card = page.locator('#card-revision')
  await card.focus()
  await page.keyboard.press('Enter')
  await expect(page.locator('#scenario-title')).toBeFocused()
  await page.getByRole('button', { name: 'Копировать ответ' }).click()
  await expect(page.getByText('Ответ скопирован', { exact: true })).toBeVisible()
  expect(await page.evaluate(() => navigator.clipboard.readText())).toBe(catalog[0].reply)
  await page.getByRole('button', { name: 'Скопировать ссылку на сценарий' }).click()
  const url = await page.evaluate(() => navigator.clipboard.readText())
  expect(url).toContain('?scenario=revision')
  await page.keyboard.press('Escape')
  await expect(card).toBeFocused()
  await page.goto(url)
  await expect(page.locator('#scenario-title')).toHaveText(catalog[0].title)
  await expect(page.getByRole('link', { name: 'Добавить в Троеточие' })).toHaveAttribute('href', 'https://troetochie.com/scenarios/revision/')
  await page.goto('/?scenario=missing')
  await expect(page.getByText('Сценарий не найден', { exact: true })).toBeVisible()
  await page.getByRole('button', { name: 'Вернуться в каталог' }).click()
  await expect(page).toHaveURL(/\/$/)
})

test('loading, HTTP error and retry', async ({ page }) => {
  let release!: () => void
  const delayed = new Promise<void>(resolve => { release = resolve })
  await page.route('**/scenarios.json', async route => {
    await delayed
    await route.fulfill({ status: 503, body: 'temporarily unavailable' })
  })
  await page.goto('/')
  await expect(page.getByText('Загружаем сценарии…')).toBeVisible()
  release()
  await expect(page.getByRole('alert')).toContainText('Не удалось')
  await page.unroute('**/scenarios.json')
  await page.getByRole('button', { name: 'Повторить' }).click()
  await expect(page.locator('.scenario-card')).toHaveCount(22)
})

test('rejects malformed data and handles an empty response', async ({ page }) => {
  await page.route('**/scenarios.json', route => route.fulfill({ json: [{}] }))
  await page.goto('/')
  await expect(page.getByRole('alert')).toBeVisible()
  await page.unroute('**/scenarios.json')
  await page.route('**/scenarios.json', route => route.fulfill({ json: [] }))
  await page.getByRole('button', { name: 'Повторить' }).click()
  await expect(page.getByText('Сценарии не найдены')).toBeVisible()
})

for (const width of [360, 390, 768, 1024, 1440]) {
  test('catalog and long messages at ' + width + ' px', async ({ page }) => {
    await page.setViewportSize({ width, height: 900 })
    await page.goto('/')
    await expect(page.locator('.scenario-card')).toHaveCount(22)
    if (width === 1440 || width === 390) await page.screenshot({ path: 'docs/screenshots/redesign-' + width + '.png' })
    await page.locator('#card-feynman').click()
    await expect(page.locator('#scenario-title')).toHaveText('Объяснить как Фейнман')
    await expect(page.locator('.incoming')).toContainText('Собеседник')
    await expect(page.locator('.outgoing')).toContainText('Предлагаемый ответ')
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBe(width)
    expect(await page.locator('.outgoing').evaluate(node => node.scrollWidth <= node.clientWidth)).toBe(true)
    await page.goBack()
    await expect(page.locator('#card-feynman')).toBeFocused()
    if (width === 390) {
      await page.goto('/?scenario=revision')
      await expect(page.locator('#scenario-title')).toBeVisible()
      await page.screenshot({ path: 'docs/screenshots/redesign-mobile-detail.png', fullPage: true })
    }
  })
}

test('mobile return preserves filters, focus and scroll', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 490 })
  await page.goto('/?category=' + encodeURIComponent('С заказчиком') + '&q=срок')
  const card = page.locator('#card-postpone')
  await card.scrollIntoViewIfNeeded()
  const before = await page.evaluate(() => window.scrollY)
  expect(before).toBeGreaterThan(0)
  await card.click()
  await expect(page.locator('#scenario-title')).toHaveText('Перенести срок')
  await page.getByRole('button', { name: 'Каталог', exact: true }).click()
  await expect(card).toBeFocused()
  await expect(page.getByRole('searchbox')).toHaveValue('срок')
  await expect(page.getByRole('button', { name: 'С заказчиком' })).toHaveAttribute('aria-pressed', 'true')
  expect(await page.evaluate(() => window.scrollY)).toBe(before)
})

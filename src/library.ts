import { useEffect, useState } from 'react'

export const categories = ['С заказчиком', 'Продажи', 'С коллегами', 'Личное', 'С HR', 'Для поддержки', 'С поддержкой', 'Аниме', 'Южный парк', 'Кино', 'Известные личности', 'Блогеры'] as const
export type Category = typeof categories[number]
export interface Scenario {
  id: string
  category: Category
  title: string
  description: string
  incoming: string
  reply: string
  audience: string
  effect: string
  keywords: string
  voice: 'formal' | 'casual'
}

type Catalog = { status: 'loading' | 'error' } | { status: 'ready'; items: Scenario[] }

function isScenario(value: unknown): value is Scenario {
  if (!value || typeof value !== 'object') return false
  const item = value as Record<string, unknown>
  return ['id', 'title', 'description', 'incoming', 'reply', 'audience', 'effect', 'keywords'].every(
    key => typeof item[key] === 'string' && item[key].trim().length > 0,
  ) && typeof item.id === 'string' && /^[a-z]+(?:-[a-z]+)*$/.test(item.id)
    && categories.includes(item.category as Category) && (item.voice === 'formal' || item.voice === 'casual')
}

export function useCatalog(attempt: number) {
  const [catalog, setCatalog] = useState<Catalog>({ status: 'loading' })
  useEffect(() => {
    const controller = new AbortController()
    setCatalog({ status: 'loading' })
    async function load() {
      try {
        const response = await fetch(import.meta.env.BASE_URL + 'scenarios.json', { signal: controller.signal })
        if (!response.ok) throw new Error('Catalog request failed')
        const items: unknown = await response.json()
        if (!Array.isArray(items) || !items.every(isScenario) || new Set(items.map(item => item.id)).size !== items.length) {
          throw new Error('Invalid catalog')
        }
        if (!controller.signal.aborted) setCatalog({ status: 'ready', items })
      } catch {
        if (!controller.signal.aborted) setCatalog({ status: 'error' })
      }
    }
    void load()
    return () => controller.abort()
  }, [attempt])
  return catalog
}

const ignored = new Set(['мне', 'надо', 'нужно', 'хочу', 'как', 'что', 'если', 'когда', 'бы', 'в', 'на', 'за', 'о', 'и', 'с'])
const words = (value: string) => value.toLowerCase().replaceAll('ё', 'е').match(/[\p{L}\p{N}]+/gu) ?? []

export function matches(item: Scenario, query: string) {
  const tokens = words(query).filter(token => !ignored.has(token))
  const source = words([item.title, item.category, item.description, item.incoming, item.keywords].join(' '))
  return tokens.every(token => source.some(word => {
    if (word.startsWith(token)) return true
    return token.length >= 5 && word.startsWith(token.slice(0, -1))
  }))
}

export function route() {
  const params = new URLSearchParams(location.search)
  const category = params.get('category') as Category | null
  return { id: params.get('scenario'), query: params.get('q') ?? '', category: category && categories.includes(category) ? category : null }
}

export function scenarioUrl(id: string) {
  const url = new URL(location.pathname, location.origin)
  url.searchParams.set('scenario', id)
  return url.href
}

export function countLabel(count: number) {
  const last = count % 10
  const teens = count % 100 >= 11 && count % 100 <= 14
  return count + ' ' + (teens ? 'сценариев' : last === 1 ? 'сценарий' : last >= 2 && last <= 4 ? 'сценария' : 'сценариев')
}

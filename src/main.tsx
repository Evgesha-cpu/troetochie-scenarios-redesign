import { StrictMode, useEffect, useLayoutEffect, useRef, useState, type MouseEvent } from 'react'
import { createRoot } from 'react-dom/client'
import { ArrowRight, ArrowUpRight, Briefcase, ChevronDown, Clapperboard, Gamepad2, Headphones, Heart, Layers3, MessageSquare, Search, Sparkles, UserRound, Users, X, type LucideIcon } from 'lucide-react'
import { categories, countLabel, matches, route, useCatalog, type Category, type Scenario } from './library'
import { Mark, ScenarioDetail } from './ScenarioDetail'
import './styles.css'

const categoryIcons: Record<Category, LucideIcon> = {
  'С заказчиком': Briefcase, 'Продажи': Sparkles, 'С коллегами': Users, 'Личное': Heart,
  'С HR': UserRound, 'Для поддержки': Headphones, 'С поддержкой': MessageSquare,
  'Аниме': Sparkles, 'Южный парк': Gamepad2, 'Кино': Clapperboard,
  'Известные личности': UserRound, 'Блогеры': MessageSquare,
}

function ScenarioCard({ item, active, onOpen }: { item: Scenario; active: boolean; onOpen: (id: string) => void }) {
  const Icon = categoryIcons[item.category]
  const href = new URL(location.href)
  href.searchParams.set('scenario', item.id)
  function open(event: MouseEvent<HTMLAnchorElement>) {
    if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return
    event.preventDefault()
    onOpen(item.id)
  }
  return <a className="scenario-card" href={href.href} id={'card-' + item.id} aria-current={active ? 'true' : undefined} onClick={open}>
    <span className="card-icon"><Icon size={18}/></span>
    <span className="card-content">
      <span className="card-category">{item.category}</span>
      <strong>{item.title}</strong>
      <span className="card-description">{item.description}</span>
      <span className="card-example">«{item.incoming}»</span>
    </span>
    <ArrowRight className="card-arrow" aria-label="Открыть сценарий" size={18}/>
  </a>
}

function App() {
  const [locationState, setLocationState] = useState(route)
  const [attempt, setAttempt] = useState(0)
  const [showCategories, setShowCategories] = useState(false)
  const catalog = useCatalog(attempt)
  const search = useRef<HTMLInputElement>(null)
  const preview = useRef<HTMLElement>(null)
  const heading = useRef<HTMLHeadingElement>(null)
  const pendingFocus = useRef(false)
  const filtering = useRef(false)
  const previousId = useRef<string | null>(locationState.id)
  const items = catalog.status === 'ready' ? catalog.items : []
  const visible = items.filter(item => (!locationState.category || item.category === locationState.category) && matches(item, locationState.query))
  const selected = locationState.id ? items.find(item => item.id === locationState.id) : visible[0]

  useLayoutEffect(() => {
    if (preview.current) preview.current.scrollTop = 0
  }, [selected?.id])

  useEffect(() => {
    const onPop = () => setLocationState(route())
    const onKey = (event: KeyboardEvent) => {
      const target = event.target
      if (event.key !== '/' || event.metaKey || event.ctrlKey || event.altKey || !(target instanceof HTMLElement)
        || target.closest('input, textarea, select, [contenteditable]')) return
      if (search.current?.getClientRects().length) {
        event.preventDefault()
        search.current.focus()
      }
    }
    window.addEventListener('popstate', onPop)
    document.addEventListener('keydown', onKey)
    return () => {
      window.removeEventListener('popstate', onPop)
      document.removeEventListener('keydown', onKey)
    }
  }, [])

  useLayoutEffect(() => {
    const oldId = previousId.current
    previousId.current = locationState.id
    if (locationState.id && heading.current && (pendingFocus.current || oldId !== locationState.id)) {
      pendingFocus.current = false
      heading.current.focus({ preventScroll: true })
      if (matchMedia('(max-width: 900px)').matches) window.scrollTo(0, 0)
    }
    if (oldId && !locationState.id && !filtering.current) {
      const card = document.getElementById('card-' + oldId)
      ;(card ?? search.current)?.focus({ preventScroll: true })
      if (matchMedia('(max-width: 900px)').matches) window.scrollTo(0, history.state?.catalogTop ?? 0)
    }
    filtering.current = false
  }, [locationState.id, selected?.id])

  function update(next: ReturnType<typeof route>, push = false) {
    const url = new URL(location.pathname, location.origin)
    if (next.query) url.searchParams.set('q', next.query)
    if (next.category) url.searchParams.set('category', next.category)
    if (next.id) url.searchParams.set('scenario', next.id)
    if (push) {
      history.replaceState({ catalogTop: window.scrollY }, '', location.href)
      history.pushState({ fromCatalog: true }, '', url)
    } else history.replaceState(next.id ? history.state : {}, '', url)
    setLocationState(next)
  }

  function filter(query: string, category = locationState.category) {
    filtering.current = Boolean(locationState.id)
    update({ query, category, id: null })
  }

  function close() {
    if (history.state?.fromCatalog) history.back()
    else update({ ...locationState, id: null })
  }

  useEffect(() => {
    if (!locationState.id) return
    const escape = (event: KeyboardEvent) => {
      if (event.key !== 'Escape') return
      if (history.state?.fromCatalog) history.back()
      else {
        const url = new URL(location.href)
        url.searchParams.delete('scenario')
        history.replaceState({}, '', url)
        setLocationState(route())
      }
    }
    document.addEventListener('keydown', escape)
    return () => document.removeEventListener('keydown', escape)
  }, [locationState.id])

  const active = selected?.id
  return <>
    <a className="skip" href="#main">К содержимому</a>
    <header className="header">
      <div className="shell header-inner">
        <a className="brand" href={location.pathname}><Mark/> Троеточие<span>Библиотека</span></a>
        <a className="original" href="https://troetochie.com/scenarios/" target="_blank" rel="noreferrer">Оригинальная библиотека <ArrowUpRight size={16}/></a>
      </div>
    </header>
    <main id="main" className={'shell main' + (locationState.id ? ' has-open' : '')}>
      <section className="intro">
        <div className="eyebrow"><Layers3 size={15}/> Троеточие / Сценарии</div>
        <h1>Библиотека сценариев<span>.</span></h1>
        <p>Найдите ситуацию из своей переписки и посмотрите, как на неё ответить.</p>
        <div className="search">
          <Search size={21}/>
          <input ref={search} type="search" aria-label="Поиск сценариев" placeholder="Например, клиент просит скидку" value={locationState.query} onChange={event => filter(event.target.value)}/>
          {locationState.query ? <button className="icon-button" aria-label="Очистить поиск" onClick={() => { filter(''); search.current?.focus() }}><X size={18}/></button> : <kbd>/</kbd>}
        </div>
        <div className="quick"><span>Частые ситуации</span>{['Клиент просит скидку', 'Нужно отказать', 'Перенести срок'].map(query => <button key={query} onClick={() => filter(query, null)}>{query}</button>)}</div>
      </section>
      {catalog.status === 'loading' && <p className="state" role="status">Загружаем сценарии…</p>}
      {catalog.status === 'error' && <div className="state"><p role="alert">Не удалось загрузить сценарии.</p><button className="primary" onClick={() => setAttempt(value => value + 1)}>Повторить</button></div>}
      {catalog.status === 'ready' && <div className="workspace">
        <aside className="categories" aria-label="Категории">
          <h2>Категории</h2>
          {([null, ...categories] as const).map((category, index) => {
            const Icon = category ? categoryIcons[category] : Layers3
            const count = category ? items.filter(item => item.category === category).length : items.length
            return <button className={index > 5 && !showCategories && locationState.category !== category ? 'extra-category' : undefined} aria-pressed={locationState.category === category} key={category ?? 'all'} onClick={() => filter(locationState.query, category)}>
              <Icon size={16}/><span>{category ?? 'Все сценарии'}</span><small>{count}</small>
            </button>
          })}
          <button className="more-categories" aria-expanded={showCategories} onClick={() => setShowCategories(value => !value)}>{showCategories ? 'Свернуть' : 'Ещё категории'} <ChevronDown size={14}/></button>
        </aside>
        <section className="catalog" aria-labelledby="catalog-title">
          <div className="catalog-heading"><h2 id="catalog-title">{locationState.category ?? 'Все сценарии'}</h2><span role="status">{countLabel(visible.length)}</span></div>
          <div className="cards">
            {visible.map(item => <ScenarioCard key={item.id} item={item} active={active === item.id} onOpen={id => {
              if (id === locationState.id) { heading.current?.focus(); return }
              pendingFocus.current = true
              update({ ...locationState, id }, !locationState.id)
            }}/>)}
          </div>
          {!visible.length && <div className="state empty"><Search size={24}/><h3>Сценарии не найдены</h3><p>Попробуйте другое слово или сбросьте фильтры.</p><button className="text-button" onClick={() => filter('', null)}>Сбросить фильтры</button></div>}
        </section>
        <section ref={preview} className="preview" aria-label="Просмотр сценария">
          {selected ? <ScenarioDetail key={selected.id} item={selected} heading={heading} onClose={locationState.id ? close : undefined}/>
            : locationState.id ? <div className="state"><h2>Сценарий не найден</h2><button className="text-button" onClick={close}>Вернуться в каталог</button></div>
              : <div className="state"><MessageSquare size={24}/><p>Здесь появится пример переписки.</p></div>}
        </section>
      </div>}
    </main>
    <footer className="shell footer"><span>Независимый концепт интерфейса</span><a href="https://troetochie.com/scenarios/" target="_blank" rel="noreferrer">Источник сценариев <ArrowUpRight size={14}/></a></footer>
  </>
}
createRoot(document.getElementById('root')!).render(<StrictMode><App/></StrictMode>)

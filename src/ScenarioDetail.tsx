import { useState, type RefObject } from 'react'
import { ArrowLeft, ArrowUpRight, Check, Copy, Link2, MessageCircle, Plus, Sparkles } from 'lucide-react'
import { scenarioUrl, type Scenario } from './library'

export function Mark() {
  return <span className="mark" aria-hidden="true"><i/><i/><i/></span>
}

export function ScenarioDetail({ item, onClose, heading }: { item: Scenario; onClose?: () => void; heading: RefObject<HTMLHeadingElement> }) {
  const [feedback, setFeedback] = useState('')
  const [manual, setManual] = useState('')
  const officialUrl = 'https://troetochie.com/scenarios/' + item.id + '/'

  async function copy(value: string, message: string) {
    try {
      await navigator.clipboard.writeText(value)
      setFeedback(message)
      setManual('')
    } catch {
      setManual(value)
      setFeedback('Выделите и скопируйте текст вручную.')
    }
  }

  return <article className="detail" aria-labelledby="scenario-title">
    <div className="detail-top">
      {onClose ? <button className="text-button back" onClick={onClose}><ArrowLeft size={17}/> Каталог</button> : <span className="detail-label"><Sparkles size={15}/> Сценарий</span>}
      <button className="icon-button" aria-label="Скопировать ссылку на сценарий" title="Скопировать ссылку" onClick={() => void copy(scenarioUrl(item.id), 'Ссылка скопирована')}><Link2 size={19}/></button>
    </div>
    <span className="tag">{item.category}</span>
    <h2 id="scenario-title" tabIndex={-1} ref={heading}>{item.title}</h2>
    <p className="detail-description">{item.description}</p>
    <div className="conversation">
      <div className="conversation-title"><MessageCircle size={18}/><h3>Пример переписки</h3><span>Демо</span></div>
      <div className="message incoming"><div className="role">Собеседник</div><p>{item.incoming}</p></div>
      <div className="message outgoing"><div className="role"><Mark/> Предлагаемый ответ</div><p>{item.reply}</p></div>
      <div className="conversation-footer"><button className="text-button" onClick={() => void copy(item.reply, 'Ответ скопирован')}>{feedback === 'Ответ скопирован' ? <Check size={16}/> : <Copy size={16}/>} Копировать ответ</button></div>
    </div>
    <div className="effect"><Sparkles size={18}/><div><h3>Что меняется в ответе</h3><p>{item.effect}</p></div></div>
    <div className="audience"><h3>Кому подойдёт</h3><p>{item.audience}</p><p className="voice">Тон в приложении · {item.voice === 'formal' ? 'Формальный' : 'Неформальный'}</p></div>
    <div className="install">
      <a className="primary" href={officialUrl} target="_blank" rel="noreferrer"><Plus size={19}/> Добавить в Троеточие <ArrowUpRight size={16}/></a>
      <p>Откроется страница сценария с установкой для Mac и файлом настроек. Для других платформ доступны инструкции по переносу.</p>
      <a className="text-button" href={officialUrl} target="_blank" rel="noreferrer">Оригинальный сценарий <ArrowUpRight size={15}/></a>
    </div>
    <span className={feedback && !manual ? 'toast' : 'visually-hidden'} role="status">{feedback}</span>
    {manual && <textarea className="manual" aria-label="Текст для ручного копирования" readOnly value={manual} onFocus={event => event.currentTarget.select()}/>}
  </article>
}

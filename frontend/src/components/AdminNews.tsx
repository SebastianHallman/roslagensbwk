import { useRef, useState } from 'react'
import { clubNews, formatClubDate } from '../data/clubUpdates'
import NewsEditor, { type EditableNews } from './NewsEditor'
import NewsPreview from './NewsPreview'

const actionClass = 'min-h-11 cursor-pointer rounded border border-black/30 px-3 py-2 text-sm hover:bg-black/10 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-black'

function AdminNews() {
  const [items, setItems] = useState<EditableNews[]>(() => clubNews.map((news, index) => ({ ...news, status: index === 0 ? 'published' : 'draft' })))
  const [filter, setFilter] = useState('all')
  const [editor, setEditor] = useState<EditableNews | 'new' | null>(null)
  const [preview, setPreview] = useState<EditableNews | null>(null)
  const [notice, setNotice] = useState('')
  const addButton = useRef<HTMLButtonElement>(null)
  const editTrigger = useRef<HTMLButtonElement | null>(null)
  const visibleItems = items.filter((news) => filter === 'all' || news.status === filter).sort((a, b) => b.date.localeCompare(a.date))

  function closeEditor() {
    setEditor(null)
    requestAnimationFrame(() => {
      if (editTrigger.current?.isConnected) editTrigger.current.focus()
      else addButton.current?.focus()
    })
  }

  function save(news: EditableNews) {
    setItems((current) => [...current.filter((item) => item.id !== news.id), news])
    setFilter('all')
    setNotice(`${news.title} har sparats lokalt. Ändringen försvinner när du lämnar vyn eller laddar om sidan.`)
    closeEditor()
  }

  return (
    <>
      <div className="mt-6 flex flex-wrap items-center justify-between gap-4">
        <p className="text-sm">{items.length} nyheter · {items.filter((news) => news.status === 'draft').length} utkast</p>
        <button ref={addButton} className="admin-button mt-0! w-auto!" disabled={editor !== null} onClick={() => { editTrigger.current = null; setEditor('new'); setNotice('') }}>+ Ny nyhet</button>
      </div>
      {notice && <p role="status" className="admin-notice mt-5">{notice}</p>}
      {editor !== null && <NewsEditor key={editor === 'new' ? 'new' : editor.id} news={editor === 'new' ? null : editor} onSave={save} onCancel={closeEditor} />}
      <div className="mt-8 flex flex-wrap gap-2" role="group" aria-label="Filtrera nyheter">
        {[{ value: 'all', label: 'Alla' }, { value: 'published', label: 'Visas lokalt' }, { value: 'draft', label: 'Utkast' }].map((option) => (
          <button key={option.value} type="button" className={`${actionClass} ${filter === option.value ? 'bg-black text-white' : ''}`} aria-pressed={filter === option.value} disabled={editor !== null} onClick={() => setFilter(option.value)}>{option.label}</button>
        ))}
      </div>
      <ul className="mt-5 grid list-none gap-4 p-0" aria-label="Nyheter">
        {visibleItems.map((news) => (
          <li key={news.id} className="rounded-lg border border-black/20 bg-[#fff] p-5 wrap-break-word">
            <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
              <time dateTime={news.date} className="text-sm text-black/70">{formatClubDate(news.date, { day: 'numeric', month: 'long', year: 'numeric' })}</time>
              <span className={`rounded px-3 py-1 text-xs ${news.status === 'draft' ? 'border border-black/25' : 'bg-black text-white'}`}>{news.status === 'draft' ? 'Utkast' : 'Visas lokalt'}</span>
            </div>
            <h3 className="font-heading text-2xl leading-tight">{news.title}</h3>
            <p className="mt-3 text-sm text-black/70">{news.summary}</p>
            <div className="mt-4 flex flex-wrap gap-2">
              <button className={actionClass} disabled={editor !== null} onClick={(click) => { editTrigger.current = click.currentTarget; setEditor(news); setNotice('') }}>Redigera<span className="sr-only"> {news.title}</span></button>
              <button className={actionClass} aria-haspopup="dialog" onClick={() => setPreview(news)}>Förhandsvisa<span className="sr-only"> {news.title}</span></button>
            </div>
          </li>
        ))}
      </ul>
      {visibleItems.length === 0 && <p className="mt-6 text-sm">Inga nyheter med den här statusen.</p>}
      <NewsPreview news={preview} onClose={() => setPreview(null)} />
    </>
  )
}

export default AdminNews

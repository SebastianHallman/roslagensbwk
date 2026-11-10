import { useRef, useState } from 'react'
import { formatClubDate, getTournamentRounds, tournaments } from '../data/clubUpdates'
import TournamentEditor, { type EditableTournament } from './TournamentEditor'
import TournamentDetails from './TournamentDetails'

const actionClass = 'min-h-11 cursor-pointer rounded border border-black/30 px-3 py-2 text-sm hover:bg-black/10 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-black'

function AdminTournaments() {
  const [events, setEvents] = useState<EditableTournament[]>(() => tournaments.map((event, index) => ({ ...event, href: '/#kontakt', status: index === 2 ? 'draft' : 'published' })))
  const [filter, setFilter] = useState('all')
  const [editor, setEditor] = useState<EditableTournament | 'new' | null>(null)
  const [preview, setPreview] = useState<EditableTournament | null>(null)
  const [notice, setNotice] = useState('')
  const addButton = useRef<HTMLButtonElement>(null)
  const editTrigger = useRef<HTMLButtonElement | null>(null)
  const visibleEvents = events.filter((event) => filter === 'all' || event.status === filter).sort((a, b) => a.date.localeCompare(b.date) || a.time.localeCompare(b.time))

  function closeEditor() {
    setEditor(null)
    requestAnimationFrame(() => {
      if (editTrigger.current?.isConnected) editTrigger.current.focus()
      else addButton.current?.focus()
    })
  }

  function save(event: EditableTournament) {
    setEvents((current) => [...current.filter((item) => item.id !== event.id), event])
    setFilter('all')
    setNotice(`${event.title} har sparats lokalt. Ändringen försvinner när du lämnar vyn eller laddar om sidan.`)
    closeEditor()
  }

  return (
    <>
      <p className="admin-muted">Planera klubbens tävlingar och förbered informationen till kalendern.</p>
      <div className="mt-6 flex flex-wrap items-center justify-between gap-4">
        <p className="text-sm">{events.length} tävlingar · {events.filter((event) => event.status === 'draft').length} utkast</p>
        <button ref={addButton} className="admin-button mt-0! w-auto!" disabled={editor !== null} onClick={() => { editTrigger.current = null; setEditor('new'); setNotice('') }}>+ Ny tävling</button>
      </div>
      {notice && <p role="status" className="admin-notice mt-5">{notice}</p>}
      {editor !== null && <TournamentEditor key={editor === 'new' ? 'new' : editor.id} event={editor === 'new' ? null : editor} onSave={save} onCancel={closeEditor} />}
      <div className="mt-8 flex flex-wrap gap-2" role="group" aria-label="Filtrera tävlingar">
        {[{ value: 'all', label: 'Alla' }, { value: 'published', label: 'Visas lokalt' }, { value: 'draft', label: 'Utkast' }].map((option) => (
          <button key={option.value} type="button" className={`${actionClass} ${filter === option.value ? 'bg-black text-white' : ''}`} aria-pressed={filter === option.value} disabled={editor !== null} onClick={() => setFilter(option.value)}>{option.label}</button>
        ))}
      </div>
      <ul className="mt-5 grid list-none gap-4 p-0" aria-label="Tävlingar">
        {visibleEvents.map((event) => {
          const rounds = getTournamentRounds(event)
          return (
          <li key={event.id} className="rounded-lg border border-black/20 bg-[#fff] p-5">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div className="min-w-0">
                <h3 className="font-heading text-2xl leading-tight wrap-break-word">{event.title}</h3>
                <p className="mt-2 text-sm"><time dateTime={event.date}>{formatClubDate(event.date, { day: 'numeric', month: 'long', year: 'numeric' })}</time> · {event.time}</p>
                <p className="mt-1 text-sm text-black/70">{event.venue}</p>
                {rounds.length > 1 && <p className="mt-2 text-sm">{rounds.length} ronder · sista ronden {formatClubDate(rounds[rounds.length - 1].date, { day: 'numeric', month: 'long', year: 'numeric' })}</p>}
                {event.resultsUrl && <p className="mt-1 text-xs text-black/70">Resultatlänk finns</p>}
              </div>
              <span className={`rounded px-3 py-1 text-xs ${event.status === 'draft' ? 'border border-black/25' : 'bg-black text-white'}`}>{event.status === 'draft' ? 'Utkast' : 'Visas lokalt'}</span>
            </div>
            <div className="mt-4 flex flex-wrap gap-2">
              <button className={actionClass} disabled={editor !== null} onClick={(click) => { editTrigger.current = click.currentTarget; setEditor(event); setNotice('') }}>Redigera<span className="sr-only"> {event.title}</span></button>
              <button className={actionClass} aria-haspopup="dialog" onClick={() => setPreview(event)}>Förhandsvisa<span className="sr-only"> {event.title}</span></button>
            </div>
          </li>
          )
        })}
      </ul>
      {visibleEvents.length === 0 && <p className="mt-6 text-sm">Inga tävlingar med den här statusen.</p>}
      <TournamentDetails event={preview} onClose={() => setPreview(null)} />
    </>
  )
}

export default AdminTournaments

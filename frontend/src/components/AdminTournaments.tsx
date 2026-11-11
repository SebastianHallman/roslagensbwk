import { useEffect, useRef, useState } from 'react'
import { createTournament, fetchAdminTournaments, updateTournament } from '../api/api.js'
import { formatClubDate } from '../utils/date'
import { fromApiTournament, toTournamentPayload } from '../api/tournaments'
import type { ApiTournament, EditableTournament } from '../types/tournament'
import TournamentEditor from './TournamentEditor'
import TournamentDetails from './TournamentDetails'

type Props = { onSessionExpired: () => void }
type StatusFilter = 'all' | EditableTournament['status']

const statusFilters: { value: StatusFilter; label: string }[] = [
  { value: 'all', label: 'Alla' },
  { value: 'published', label: 'Publicerade' },
  { value: 'draft', label: 'Utkast' },
]

const actionClass = 'min-h-11 cursor-pointer rounded border border-black/30 px-3 py-2 text-sm hover:bg-black/10 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-black'

function AdminTournaments({ onSessionExpired }: Props) {
  const [events, setEvents] = useState<EditableTournament[]>([])
  const [loadState, setLoadState] = useState<'loading' | 'ready' | 'error'>('loading')
  const [reload, setReload] = useState(0)
  const [filter, setFilter] = useState<StatusFilter>('all')
  const [isEditing, setIsEditing] = useState(false)
  const [editedEvent, setEditedEvent] = useState<EditableTournament | null>(null)
  const [preview, setPreview] = useState<EditableTournament | null>(null)
  const [notice, setNotice] = useState('')
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)
  const savingRef = useRef(false)
  const addButton = useRef<HTMLButtonElement>(null)
  const isLoading = loadState === 'loading'
  const draftCount = events.filter((event) => event.status === 'draft').length
  const visibleEvents = events
    .filter((event) => filter === 'all' || event.status === filter)
    .sort((a, b) => (a.date || '9999-12-31').localeCompare(b.date || '9999-12-31') || a.time.localeCompare(b.time))

  useEffect(() => {
    const controller = new AbortController()
    fetchAdminTournaments(controller.signal).then((data: ApiTournament[]) => {
      if (controller.signal.aborted) return
      setEvents(data.map(fromApiTournament))
      setLoadState('ready')
    }).catch((failure: unknown) => {
      if (controller.signal.aborted) return
      const status = failure instanceof Error && 'status' in failure ? failure.status : undefined
      if (status === 401 || status === 403) {
        onSessionExpired()
        return
      }
      setError('Could not load tournaments. Please try again.')
      setLoadState('error')
    })
    return () => controller.abort()
  }, [reload, onSessionExpired])

  function clearFeedback() {
    setError('')
    setNotice('')
  }

  function openNewEditor() {
    setEditedEvent(null)
    setIsEditing(true)
    clearFeedback()
  }

  function refresh() {
    setLoadState('loading')
    setPreview(null)
    clearFeedback()
    setReload((current) => current + 1)
  }

  function closeEditor() {
    setIsEditing(false)
    requestAnimationFrame(() => addButton.current?.focus())
  }

  async function save(event: EditableTournament) {
    if (savingRef.current || !isEditing) return
    clearFeedback()

    savingRef.current = true
    setSaving(true)
    try {
      const payload = toTournamentPayload(event, editedEvent)
      if (editedEvent) {
        await updateTournament(editedEvent.id, payload)
      } else {
        await createTournament(payload)
      }
      setFilter('all')
      setNotice(`${event.title} har sparats i databasen.`)
      closeEditor()
      setLoadState('loading')
      setPreview(null)
      setReload((current) => current + 1)
    } catch (failure) {
      const status = failure instanceof Error && 'status' in failure ? failure.status : undefined
      if (status === 401 || status === 403) {
        onSessionExpired()
        return
      }
      const message = status === 404
        ? 'Tournament not found. Close the editor and refresh the list.'
        : status === 400 && failure instanceof Error
        ? failure.message
        : 'Saving could not be confirmed. Close the editor and refresh the list to check whether your changes were saved before trying again.'
      setError(message)
    } finally {
      savingRef.current = false
      setSaving(false)
    }
  }

  return (
    <>
      <div className="mt-6 flex flex-wrap items-center justify-between gap-4">
        <p className="text-sm">{loadState === 'ready' ? `${events.length} tävlingar · ${draftCount} utkast` : 'Tävlingar'}</p>
        <button className={actionClass} disabled={isEditing || isLoading} onClick={refresh}>
          {loadState === 'error' ? 'Försök igen' : 'Uppdatera'}
        </button>
        <button
          ref={addButton}
          className="admin-button mt-0! w-auto!"
          disabled={isEditing || loadState !== 'ready'}
          onClick={openNewEditor}
        >
          + Ny tävling
        </button>
      </div>
      {notice && <p role="status" className="admin-notice mt-5">{notice}</p>}
      {error && <p role="alert" className="admin-error mt-5">{error}</p>}
      {isLoading && <p role="status" className="mt-5">Hämtar tävlingar…</p>}
      {isEditing && (
        <TournamentEditor
          event={editedEvent}
          saving={saving}
          onSave={save}
          onCancel={closeEditor}
        />
      )}
      <div className="mt-8 flex flex-wrap gap-2" role="group" aria-label="Filtrera tävlingar">
        {statusFilters.map((option) => (
          <button
            key={option.value}
            type="button"
            className={`${actionClass} ${filter === option.value ? 'bg-black text-white' : ''}`}
            aria-pressed={filter === option.value}
            disabled={isEditing || loadState !== 'ready'}
            onClick={() => setFilter(option.value)}
          >
            {option.label}
          </button>
        ))}
      </div>
      {loadState === 'ready' && <ul className="mt-5 grid list-none gap-4 p-0" aria-label="Tävlingar">
        {visibleEvents.map((event) => {
          const rounds = event.rounds ?? []
          const statusLabel = event.status === 'draft' ? 'Utkast' : 'Publicerad'

          return (
            <li key={event.id} className="rounded-lg border border-black/20 bg-[#fff] p-5">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0">
                  <h3 className="font-heading text-2xl leading-tight wrap-break-word">{event.title}</h3>
                  {rounds.length > 0 ? <p className="mt-2 text-sm">
                    <time dateTime={event.date}>
                      {formatClubDate(event.date, { day: 'numeric', month: 'long', year: 'numeric' })}
                    </time>
                    {' · '}{event.time}
                  </p> : <p className="mt-2 text-sm text-black/70">Inga ronder planerade ännu.</p>}
                  {event.venue && <p className="mt-1 text-sm text-black/70">{event.venue}</p>}
                  {rounds.length > 1 && (
                    <p className="mt-2 text-sm">
                      {rounds.length} ronder · sista ronden{' '}
                      {formatClubDate(rounds[rounds.length - 1].date, { day: 'numeric', month: 'long', year: 'numeric' })}
                    </p>
                  )}
                  {rounds.some((round) => round.resultsUrl) && <p className="mt-1 text-xs text-black/70">Resultatlänk finns</p>}
                </div>
                <span className={`rounded px-3 py-1 text-xs ${event.status === 'draft' ? 'border border-black/25' : 'bg-black text-white'}`}>
                  {statusLabel}
                </span>
              </div>
              <div className="mt-4 flex flex-wrap gap-2">
                <button
                  className={actionClass}
                  disabled={isEditing || saving}
                  onClick={() => { setEditedEvent(event); setIsEditing(true); clearFeedback() }}
                >
                  Redigera<span className="sr-only"> {event.title}</span>
                </button>
                <button
                  className={actionClass}
                  disabled={saving || rounds.length === 0}
                  aria-haspopup="dialog"
                  onClick={() => setPreview(event)}
                >
                  Förhandsvisa<span className="sr-only"> {event.title}</span>
                </button>
              </div>
            </li>
          )
        })}
      </ul>}
      {loadState === 'ready' && visibleEvents.length === 0 && (
        <p className="mt-6 text-sm">{events.length === 0 ? 'Inga tävlingar skapade ännu.' : 'Inga tävlingar med den här statusen.'}</p>
      )}
      <TournamentDetails event={preview} onClose={() => setPreview(null)} />
    </>
  )
}

export default AdminTournaments

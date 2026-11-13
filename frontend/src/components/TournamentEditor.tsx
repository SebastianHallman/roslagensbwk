import { useEffect, useRef, useState, type FormEvent } from 'react'
import { getTournamentResultsUrl, getTournamentRounds } from '../utils/tournaments'
import type { EditableTournament, TournamentRound } from '../types/tournament'
import TournamentRoundsEditor from './TournamentRoundsEditor'

type Props = { event: EditableTournament | null; saving?: boolean; onSave: (event: EditableTournament) => void | Promise<void>; onCancel: () => void }
const fieldClass = 'mb-5 min-h-12 min-w-0 w-full rounded border border-black/45 bg-[#fff] px-3 py-2 text-base focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-black'

function TournamentEditor({ event, saving = false, onSave, onCancel }: Props) {
  const nameInput = useRef<HTMLInputElement>(null)
  const formRef = useRef<HTMLFormElement>(null)
  const [rounds, setRounds] = useState<TournamentRound[]>(() => {
    const existing = event ? getTournamentRounds(event) : []
    return existing.length ? existing : [{ id: crypto.randomUUID(), date: '', time: '09.00', venue: 'Roslagsbowling' }]
  })
  const [multiRound, setMultiRound] = useState(() => event?.multiRound ?? (event ? getTournamentRounds(event).length > 1 : false))
  useEffect(() => { nameInput.current?.focus() }, [])

  function clearErrors() {
    formRef.current?.querySelectorAll<HTMLInputElement | HTMLTextAreaElement>('input, textarea').forEach((field) => field.setCustomValidity(''))
  }

  function submit(submission: FormEvent<HTMLFormElement>) {
    submission.preventDefault()
    if (saving) return
    const fields = new FormData(submission.currentTarget)
    const value = (key: string) => String(fields.get(key) ?? '').trim()
    for (const name of ['title', 'description']) {
      if (!value(name)) {
        const field = submission.currentTarget.elements.namedItem(name) as HTMLInputElement | HTMLTextAreaElement
        field.setCustomValidity('Enter text, not only whitespace.')
        field.reportValidity()
        return
      }
    }
    const activeRounds = multiRound ? rounds : rounds.slice(0, 1)
    const seen = new Set<string>()
    for (const round of activeRounds) {
      const key = `${round.date} ${round.time} ${round.venue?.trim().toLocaleLowerCase('sv-SE')}`
      if (seen.has(key)) {
        const field = submission.currentTarget.elements.namedItem(`round-time-${round.id}`) as HTMLInputElement
        field.setCustomValidity('Two rounds cannot have the same date, start time and venue.')
        field.reportValidity()
        return
      }
      seen.add(key)
      if (round.resultsUrl?.trim() && !getTournamentResultsUrl(round)) {
        const field = submission.currentTarget.elements.namedItem(`round-results-${round.id}`) as HTMLInputElement
        field.setCustomValidity('Enter a complete URL starting with https:// or http://.')
        field.reportValidity()
        return
      }
    }
    const sortedRounds = activeRounds.map((round) => ({ ...round, venue: round.venue!.trim(), resultsUrl: getTournamentResultsUrl(round) })).sort((a, b) => a.date.localeCompare(b.date) || a.time.localeCompare(b.time))
    void onSave({
      id: event?.id ?? crypto.randomUUID(), title: value('title'), date: sortedRounds[0].date,
      time: sortedRounds[0].time, venue: sortedRounds[0].venue, description: value('description'),
      href: '/#kontakt',
      resultsUrl: multiRound ? undefined : sortedRounds[0].resultsUrl,
      rounds: sortedRounds,
      multiRound,
      status: value('status') === 'published' ? 'published' : 'draft',
    })
  }

  return (
    <section className="mt-8 rounded-lg border border-black/20 border-t-4 border-t-red bg-warm-white p-5 min-[40rem]:p-7" aria-labelledby="tournament-editor-heading">
      <h3 id="tournament-editor-heading" className="font-heading text-2xl">{event ? 'Redigera tävling' : 'Ny tävling'}</h3>
      <form ref={formRef} className="mt-6" onSubmit={submit} onInput={clearErrors} aria-labelledby="tournament-editor-heading" aria-busy={saving}>
        <fieldset disabled={saving} className="min-w-0 border-0 p-0">
        <label className="mb-2 block text-sm" htmlFor="event-title">Tävlingsnamn</label>
        <input ref={nameInput} className={fieldClass} id="event-title" name="title" defaultValue={event?.title} maxLength={120} pattern=".*\S.*" required />
        <label className="mb-5 flex min-h-11 cursor-pointer items-center gap-3 text-sm" htmlFor="event-multiple">
          <input id="event-multiple" type="checkbox" checked={multiRound} onChange={(change) => { clearErrors(); setMultiRound(change.target.checked) }} className="size-5 accent-red" />
          Tävlingen spelas i flera ronder
        </label>
        {!multiRound && rounds.length > 1 && <p className="mb-4 text-sm">Om du sparar nu behålls bara det första speltillfället. Kryssa i flera ronder igen för att behålla alla.</p>}
        <TournamentRoundsEditor rounds={multiRound ? rounds : rounds.slice(0, 1)} multiRound={multiRound} onChange={(nextRounds) => { clearErrors(); setRounds(multiRound ? nextRounds : [nextRounds[0], ...rounds.slice(1)]) }} />
        <label className="mb-2 block text-sm" htmlFor="event-description">Beskrivning</label>
        <textarea className={`${fieldClass} resize-y`} id="event-description" name="description" rows={3} maxLength={3000} defaultValue={event?.description} required />
        <label className="mb-2 block text-sm" htmlFor="event-status">Status</label>
        <select className={fieldClass} id="event-status" name="status" defaultValue={event?.status ?? 'published'}>
          <option value="draft">Utkast</option>
          <option value="published">Publicerad</option>
        </select>
        <div className="mt-4 flex flex-wrap gap-3">
          <button className="admin-button mt-0! w-auto!" type="submit">{saving ? 'Sparar…' : event ? 'Spara ändringar' : 'Skapa tävling'}</button>
          <button className="min-h-12 cursor-pointer rounded border border-black/40 px-5 py-2 font-heading hover:bg-black/10 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-black" type="button" onClick={onCancel}>Avbryt</button>
        </div>
        </fieldset>
      </form>
    </section>
  )
}

export default TournamentEditor

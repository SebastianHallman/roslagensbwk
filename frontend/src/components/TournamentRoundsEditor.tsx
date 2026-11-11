import { useRef } from 'react'
import type { TournamentRound } from '../types/tournament'

type Props = { rounds: TournamentRound[]; multiRound: boolean; onChange: (rounds: TournamentRound[]) => void }
const fieldClass = 'min-h-12 min-w-0 w-full rounded border border-black/45 bg-[#fff] px-3 py-2 text-base focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-black'

function TournamentRoundsEditor({ rounds, multiRound, onChange }: Props) {
  const dateInputs = useRef(new Map<string, HTMLInputElement>())

  function addRound() {
    const round = { id: crypto.randomUUID(), date: '', time: rounds.at(-1)?.time ?? '09.00', venue: rounds.at(-1)?.venue ?? 'Roslagsbowling', resultsUrl: '' }
    onChange([...rounds, round])
    requestAnimationFrame(() => dateInputs.current.get(round.id)?.focus())
  }

  function removeRound(id: string) {
    if (rounds.length <= 1) return
    const index = rounds.findIndex((round) => round.id === id)
    const remaining = rounds.filter((round) => round.id !== id)
    onChange(remaining)
    requestAnimationFrame(() => dateInputs.current.get(remaining[Math.min(index, remaining.length - 1)].id)?.focus())
  }

  return (
    <fieldset className="mb-6 min-w-0">
      <legend className="font-heading text-2xl">{multiRound ? 'Ronder' : 'Speltillfälle'}</legend>
      <p className="mt-2 mb-4 text-sm text-black/70">{multiRound ? 'Varje rond har eget datum, starttid, spellokal och frivillig resultatlänk. Ronderna sorteras i datumordning när du sparar.' : 'Ange när och var tävlingen spelas. Resultatlänken är frivillig.'}</p>
      <div className="grid gap-4">
        {rounds.map((round, index) => (
          <div key={round.id} className="min-w-0 rounded border border-black/25 p-3 min-[40rem]:p-4">
            {multiRound && <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
              <h4 className="font-heading text-xl">Rond {index + 1}</h4>
              <button type="button" disabled={rounds.length <= 1} onClick={() => removeRound(round.id)} aria-label={`Ta bort rond ${index + 1}`} className="min-h-11 cursor-pointer rounded px-3 text-sm underline underline-offset-4 hover:enabled:bg-black/10 disabled:cursor-default disabled:opacity-40 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-black">Ta bort</button>
            </div>}
            <div className="grid gap-4 min-[35rem]:grid-cols-2">
              <div className="min-w-0">
                <label className="mb-2 block text-sm" htmlFor={`round-${round.id}-date`}>Datum{multiRound && <span className="sr-only"> för rond {index + 1}</span>}</label>
                <input ref={(input) => { if (input) dateInputs.current.set(round.id, input); else dateInputs.current.delete(round.id) }} className={fieldClass} id={`round-${round.id}-date`} name={`round-date-${round.id}`} type="date" min="2000-01-01" max="2100-12-31" value={round.date} required onChange={(change) => onChange(rounds.map((item) => item.id === round.id ? { ...item, date: change.target.value } : item))} />
              </div>
              <div className="min-w-0">
                <label className="mb-2 block text-sm" htmlFor={`round-${round.id}-time`}>Starttid{multiRound && <span className="sr-only"> för rond {index + 1}</span>}</label>
                <input className={fieldClass} id={`round-${round.id}-time`} name={`round-time-${round.id}`} type="time" value={round.time.replace('.', ':')} required onChange={(change) => onChange(rounds.map((item) => item.id === round.id ? { ...item, time: change.target.value.replace(':', '.') } : item))} />
              </div>
            </div>
            <label className="mt-4 mb-2 block text-sm" htmlFor={`round-${round.id}-venue`}>Spellokal{multiRound && <span className="sr-only"> för rond {index + 1}</span>}</label>
            <input className={fieldClass} id={`round-${round.id}-venue`} name={`round-venue-${round.id}`} value={round.venue ?? ''} maxLength={150} pattern=".*\S.*" required onChange={(change) => onChange(rounds.map((item) => item.id === round.id ? { ...item, venue: change.target.value } : item))} />
            <label className="mt-4 mb-2 block text-sm" htmlFor={`round-${round.id}-results`}>Resultatlänk (frivillig){multiRound && <span className="sr-only"> för rond {index + 1}</span>}</label>
            <input className={fieldClass} id={`round-${round.id}-results`} name={`round-results-${round.id}`} type="url" inputMode="url" maxLength={2000} placeholder="https://…" value={round.resultsUrl ?? ''} onChange={(change) => onChange(rounds.map((item) => item.id === round.id ? { ...item, resultsUrl: change.target.value } : item))} />
          </div>
        ))}
      </div>
      {multiRound && <button type="button" onClick={addRound} className="mt-4 min-h-11 cursor-pointer rounded border border-dashed border-black/50 px-4 py-2 font-heading hover:bg-black/10 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-black">+ Lägg till rond</button>}
    </fieldset>
  )
}

export default TournamentRoundsEditor

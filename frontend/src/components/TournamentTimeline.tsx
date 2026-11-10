import { useState } from 'react'
import { formatClubDate, getTournamentOccurrences, type Tournament } from '../data/clubUpdates'
import TournamentDetails from './TournamentDetails'

function TournamentTimeline({ events, date }: { events: Tournament[]; date?: string }) {
  const [selectedEvent, setSelectedEvent] = useState<Tournament | null>(null)
  const occurrences = getTournamentOccurrences(events).filter(({ round }) => !date || round.date === date)

  if (occurrences.length === 0) return <p>Inga tävlingar att visa just nu.</p>

  return (
    <>
      <ol className="grid list-none gap-5 p-0">
        {occurrences.map(({ event, round, number, total }) => (
          <li key={`${event.id}-${round.id}`} className="grid grid-cols-[3rem_minmax(0,1fr)] items-start gap-4 rounded-lg bg-white p-5 min-[40rem]:gap-5 min-[40rem]:p-6">
            <time dateTime={round.date} className="text-center leading-none">
              <span className="block font-heading text-4xl">{formatClubDate(round.date, { day: '2-digit' })}</span>
              <span className="mt-2 block text-xs uppercase">{formatClubDate(round.date, { month: 'short' })}</span>
              <span className="mt-2 block text-xs text-black/65">{formatClubDate(round.date, { year: 'numeric' })}</span>
            </time>
            <div className="min-w-0">
              <h3 className="font-heading text-2xl leading-tight wrap-break-word">{event.title}</h3>
              {total > 1 && <p className="mt-1 font-heading text-lg">Rond {number} av {total}</p>}
              <p className="mt-2 text-sm">{round.time} · {round.venue}</p>
              <button type="button" aria-haspopup="dialog" onClick={() => setSelectedEvent(event)} className="mt-3 inline-flex min-h-11 cursor-pointer items-center text-left text-sm underline underline-offset-4 hover:decoration-2 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-black">
                Visa tävlingen<span className="sr-only"> {event.title}{total > 1 ? `, rond ${number}` : ''}</span><span aria-hidden="true" className="ml-2">→</span>
              </button>
            </div>
          </li>
        ))}
      </ol>
      <TournamentDetails event={selectedEvent} onClose={() => setSelectedEvent(null)} />
    </>
  )
}

export default TournamentTimeline

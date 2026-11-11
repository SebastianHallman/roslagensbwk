import { useEffect, useId, useRef } from 'react'
import { formatClubDate } from '../utils/date'
import { getTournamentResultsUrl, getTournamentRounds } from '../utils/tournaments'
import type { Tournament } from '../types/tournament'

type TournamentDetailsProps = {
  event: Tournament | null
  onClose: () => void
}

function TournamentDetails({ event, onClose }: TournamentDetailsProps) {
  const dialogRef = useRef<HTMLDialogElement>(null)
  const titleId = useId()
  const rounds = event ? getTournamentRounds(event) : []

  useEffect(() => {
    const dialog = dialogRef.current
    if (event && !dialog?.open) dialog?.showModal()
    if (!event && dialog?.open) dialog.close()
  }, [event])

  function close() {
    dialogRef.current?.close()
  }

  return (
    <dialog
      ref={dialogRef}
      aria-labelledby={titleId}
      onClose={onClose}
      className="fixed inset-0 m-auto max-h-[calc(100svh_-_2rem)] w-[calc(100%_-_2rem)] max-w-xl overflow-y-auto overscroll-contain rounded-lg border-0 border-t-4 border-red bg-warm-white p-5 text-black shadow-xl [color-scheme:light] backdrop:bg-black/75 min-[40rem]:p-8"
    >
      {event && (
        <>
          <div className="mb-6 flex items-start justify-between gap-4">
            <div className="min-w-0">
              <h2 id={titleId} className="text-3xl leading-tight wrap-break-word">{event.title}</h2>
            </div>
            <button type="button" onClick={close} className="min-h-11 shrink-0 cursor-pointer rounded border border-black/30 px-3 text-sm hover:bg-black/10 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-black">Stäng</button>
          </div>
          <div className="mb-6 rounded-lg bg-white p-4 text-sm">
            <h3 className="mb-3 font-heading text-xl">{rounds.length > 1 ? 'Ronder' : 'Speldatum'}</h3>
            <ol className="grid list-none gap-3 p-0">
              {rounds.map((round, index) => {
                const resultsUrl = getTournamentResultsUrl(round)
                return (
                <li key={round.id} className="border-b border-black/10 pb-3 last:border-0 last:pb-0">
                  {rounds.length > 1 && <p className="font-heading text-lg">Rond {index + 1}</p>}
                  <p><time dateTime={round.date}>{formatClubDate(round.date, { day: 'numeric', month: 'long', year: 'numeric' })}</time> · {round.time}</p>
                  <p className="mt-1">{round.venue}</p>
                  {resultsUrl && <a href={resultsUrl} target="_blank" rel="noopener noreferrer" className="mt-2 inline-flex min-h-11 items-center underline underline-offset-4 focus-visible:outline-black!">Visa resultat{rounds.length > 1 ? ` för rond ${index + 1}` : ''}<span aria-hidden="true" className="ml-2">↗</span><span className="sr-only"> (öppnas i ny flik)</span></a>}
                </li>
                )
              })}
            </ol>
          </div>
          <p className="text-sm">{event.description}</p>
        </>
      )}
    </dialog>
  )
}

export default TournamentDetails

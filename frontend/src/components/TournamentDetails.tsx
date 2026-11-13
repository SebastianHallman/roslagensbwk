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
      className="fixed inset-0 m-auto max-h-[calc(100svh_-_2rem)] w-[calc(100%_-_2rem)] max-w-xl overflow-y-auto overscroll-contain border-0 bg-black p-0 text-white wrap-anywhere [color-scheme:light] backdrop:bg-black/90"
    >
      {event && (
        <>
          <button type="button" onClick={close} className="mt-4 mb-8 ml-4 inline-flex min-h-11 cursor-pointer items-center gap-2 rounded border border-white/30 px-4 py-2 text-sm hover:bg-white/10 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"><span aria-hidden="true">←</span> Stäng</button>
          <article className="min-w-0 max-w-full bg-[#fff] px-6 py-8 text-black sm:p-10">
            <h2 id={titleId} className="mb-8 text-4xl leading-tight md:text-5xl">{event.title}</h2>
            <p className="mb-8 max-w-prose whitespace-pre-wrap leading-relaxed text-black/85">{event.description}</p>
            <h3 className="mb-4 font-heading text-2xl">{rounds.length > 1 ? 'Ronder' : 'Speldatum'}</h3>
            <ol className="grid list-none gap-5 p-0 text-sm">
              {rounds.map((round, index) => {
                const resultsUrl = getTournamentResultsUrl(round)
                return (
                <li key={round.id} className="border-b border-black/15 pb-5 last:border-0 last:pb-0">
                  {rounds.length > 1 && <h4 className="mb-2 font-heading text-xl">Rond {index + 1}</h4>}
                  <p><time dateTime={round.date}>{formatClubDate(round.date, { day: 'numeric', month: 'long', year: 'numeric' })}</time> · {round.time}</p>
                  <p className="mt-1">{round.venue}</p>
                  {resultsUrl && <a href={resultsUrl} target="_blank" rel="noopener noreferrer" className="mt-2 inline-flex min-h-11 items-center underline underline-offset-4 focus-visible:outline-black!">Visa resultat{rounds.length > 1 ? ` för rond ${index + 1}` : ''}<span aria-hidden="true" className="ml-2">↗</span><span className="sr-only"> (öppnas i ny flik)</span></a>}
                </li>
                )
              })}
            </ol>
          </article>
        </>
      )}
    </dialog>
  )
}

export default TournamentDetails

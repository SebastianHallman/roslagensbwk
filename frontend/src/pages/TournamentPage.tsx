import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router'
import { fetchTournaments } from '../api/api.js'
import { fromApiTournament } from '../api/tournaments'
import clubLogo from '../assets/logo.png'
import type { ApiTournament, Tournament } from '../types/tournament'
import { formatClubDate } from '../utils/date'
import { getTournamentResultsUrl, getTournamentRounds } from '../utils/tournaments'

function TournamentArticle({ id }: { id: string }) {
  const validId = /^[1-9]\d*$/.test(id) && Number(id) <= 4294967295
  const [event, setEvent] = useState<Tournament | null>(null)
  const [loadState, setLoadState] = useState<'loading' | 'ready' | 'missing' | 'error'>(validId ? 'loading' : 'missing')
  const [reload, setReload] = useState(0)
  const rounds = event ? getTournamentRounds(event) : []

  useEffect(() => {
    if (!validId) return
    const controller = new AbortController()
    fetchTournaments(controller.signal).then((items: ApiTournament[]) => {
      if (controller.signal.aborted) return
      const item = items.find((item) => String(item.id) === id && item.status === 'published')
      setEvent(item ? fromApiTournament(item) : null)
      setLoadState(item ? 'ready' : 'missing')
    }).catch(() => {
      if (!controller.signal.aborted) setLoadState('error')
    })
    return () => controller.abort()
  }, [id, validId, reload])

  useEffect(() => {
    const previousTitle = document.title
    document.title = `${event?.title ?? 'Tävling'} | Roslagens Bowlingklubb`
    return () => { document.title = previousTitle }
  }, [event?.title])

  return (
    <div className="flex min-h-svh min-w-0 flex-col bg-black px-4 text-white [color-scheme:light] min-[40rem]:px-6">
      <header className="mx-auto w-full max-w-xl pt-20 pb-6">
        <Link to="/" aria-label="Roslagens Bowlingklubb – startsidan" className="inline-flex items-center gap-3 rounded focus-visible:outline-2 focus-visible:outline-offset-4">
          <img src={clubLogo} alt="" width="64" height="64" className="size-16 shrink-0" />
          <span className="font-heading text-xl leading-tight">Roslagens<br />Bowlingklubb</span>
        </Link>
      </header>
      <main id="tournament-content" tabIndex={-1} className="mx-auto w-full max-w-xl pb-12 wrap-anywhere outline-none">
        <Link to="/#kalender" className="mb-5 inline-flex min-h-11 items-center gap-2 rounded border border-white/30 px-4 py-2 text-sm transition-colors hover:bg-white/10 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-white">
          <span aria-hidden="true">←</span> Tillbaka
        </Link>
        <div className="bg-[#fff] px-6 py-8 text-black sm:p-10">
          {loadState === 'loading' && <p role="status">Hämtar tävling…</p>}
          {loadState === 'error' && (
            <div>
              <h1 className="mb-4 text-3xl">Tävlingen kunde inte hämtas</h1>
              <p role="alert">Försök igen om en stund.</p>
              <button type="button" className="mt-4 min-h-11 cursor-pointer underline underline-offset-4 focus-visible:outline-2 focus-visible:outline-offset-4" onClick={() => { setLoadState('loading'); setReload((current) => current + 1) }}>Försök igen</button>
            </div>
          )}
          {loadState === 'missing' && <h1 className="text-3xl">Tävlingen finns inte</h1>}
          {loadState === 'ready' && event && (
            <article className="min-w-0 max-w-full">
              <h1 className="mb-8 text-4xl leading-tight md:text-5xl">{event.title}</h1>
              <p className="mb-8 max-w-prose whitespace-pre-wrap leading-relaxed text-black/85">{event.description}</p>
              <h2 className="mb-4 text-2xl">{rounds.length > 1 ? 'Ronder' : 'Speldatum'}</h2>
              <ol className="grid list-none gap-5 p-0 text-sm">
                {rounds.map((round, index) => {
                  const resultsUrl = getTournamentResultsUrl(round)
                  return (
                    <li key={round.id} className="border-b border-black/15 pb-5 last:border-0 last:pb-0">
                      {rounds.length > 1 && <h3 className="mb-2 font-heading text-xl">Rond {index + 1}</h3>}
                      <p><time dateTime={round.date}>{formatClubDate(round.date, { day: 'numeric', month: 'long', year: 'numeric' })}</time> · {round.time}</p>
                      <p className="mt-1">{round.venue}</p>
                      {resultsUrl && <a href={resultsUrl} target="_blank" rel="noopener noreferrer" className="mt-2 inline-flex min-h-11 items-center underline underline-offset-4 focus-visible:outline-black!">Visa resultat{rounds.length > 1 ? ` för rond ${index + 1}` : ''}<span aria-hidden="true" className="ml-2">↗</span><span className="sr-only"> (öppnas i ny flik)</span></a>}
                    </li>
                  )
                })}
              </ol>
            </article>
          )}
        </div>
      </main>
    </div>
  )
}

function TournamentPage() {
  const { id = '' } = useParams()
  return <TournamentArticle key={id} id={id} />
}

export default TournamentPage

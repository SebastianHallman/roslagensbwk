import { fetchTournaments } from '../api/api'
import { fromApiTournament } from '../api/tournaments'
import type { ApiTournament, Tournament } from '../types/tournament'
import TournamentCalendar from './TournamentCalendar'
import { useState, useEffect } from 'react'

function ClubUpdates() {

  const [tournaments, setTournaments] = useState<Tournament[]>([])
  const [error, setError] = useState('')

  useEffect(() => {
    let active = true
    fetchTournaments(undefined).then((tournamentData: ApiTournament[]) => {
      if (active) setTournaments(tournamentData.map(fromApiTournament))
    }).catch(() => {
      if (active) setError('Det gick inte att hämta tävlingarna. Försök igen senare.')
    })
    return () => { active = false }
  }, [])

  return (
    <div className="bg-black md:bg-[linear-gradient(to_right,var(--color-warm-white)_50%,var(--color-black)_50%)]">
      <div className="mx-auto grid md:w-[calc(100%_-_3rem)] md:max-w-[76rem] md:grid-cols-2">
        <section id="kalender" aria-labelledby="calendar-heading" className="min-w-0 bg-warm-white px-4 py-14 text-black [color-scheme:light] min-[40rem]:px-6 md:py-20 md:pr-8 md:pl-0">
          <div className="mx-auto max-w-[32rem] md:mx-0 md:max-w-none">
            <h2 id="calendar-heading" className="mb-3 text-center text-3xl leading-tight lg:text-4xl">Tävlingskalender</h2>
            {error ? <p role="alert">{error}</p> : <TournamentCalendar events={tournaments} />}
          </div>
        </section>

      </div>
    </div>
  )
}

export default ClubUpdates

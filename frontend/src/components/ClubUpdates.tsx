import { clubNews, tournaments } from '../data/clubUpdates'
import ClubNewsSection from './ClubNewsSection'
import TournamentCalendar from './TournamentCalendar'

function ClubUpdates() {
  return (
    <div className="bg-black md:bg-[linear-gradient(to_right,var(--color-warm-white)_50%,var(--color-black)_50%)]">
      <div className="mx-auto grid md:w-[calc(100%_-_3rem)] md:max-w-[76rem] md:grid-cols-2">
        <section id="kalender" aria-labelledby="calendar-heading" className="min-w-0 bg-warm-white px-4 py-14 text-black [color-scheme:light] min-[40rem]:px-6 md:py-20 md:pr-8 md:pl-0">
          <div className="mx-auto max-w-[32rem] md:mx-0 md:max-w-none">
            <h2 id="calendar-heading" className="mb-3 text-center text-3xl leading-tight lg:text-4xl">Tävlingskalender</h2>
            <p className="mb-8 text-center text-xs text-black/70">Exempeltävlingar · datum är inte fastställda</p>
            <TournamentCalendar events={tournaments} />
          </div>
        </section>
        <ClubNewsSection items={clubNews} />
      </div>
    </div>
  )
}

export default ClubUpdates

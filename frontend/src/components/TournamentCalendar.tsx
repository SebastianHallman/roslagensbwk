import { useState } from 'react'
import type { Tournament } from '../types/tournament'
import MonthCalendar from './MonthCalendar'
import TournamentTimeline from './TournamentTimeline'

function TournamentCalendar({ events }: { events: Tournament[] }) {
  const [view, setView] = useState<'month' | 'timeline'>('month')
  const [selectedDate, setSelectedDate] = useState(() => {
    const today = new Date()
    return `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`
  })
  const [month, setMonth] = useState(() => new Date(new Date().getFullYear(), new Date().getMonth(), 1, 12))

  return (
    <>
      <div role="group" aria-label="Kalendervy" className="mb-6 flex justify-center gap-2">
        {([{ value: 'month', label: 'Månad' }, { value: 'timeline', label: 'Tidslinje' }] as const).map((option) => (
          <button
            key={option.value}
            type="button"
            aria-pressed={view === option.value}
            aria-controls="calendar-view"
            onClick={() => setView(option.value)}
            className={`min-h-11 cursor-pointer rounded px-5 py-2 font-heading text-lg focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-black ${view === option.value ? 'bg-red text-white' : 'bg-white text-black hover:bg-black/10'}`}
          >
            {option.label}
          </button>
        ))}
      </div>
      <div id="calendar-view">
        {view === 'month' ? (
          <MonthCalendar events={events} month={month} selectedDate={selectedDate} onMonthChange={setMonth} onDateSelect={setSelectedDate} />
        ) : (
          <TournamentTimeline events={events} />
        )}
      </div>
    </>
  )
}

export default TournamentCalendar

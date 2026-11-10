import { formatClubDate, getTournamentOccurrences, type Tournament } from '../data/clubUpdates'
import TournamentTimeline from './TournamentTimeline'

type MonthCalendarProps = {
  events: Tournament[]
  month: Date
  selectedDate: string
  onMonthChange: (month: Date) => void
  onDateSelect: (date: string) => void
}

const weekdays = ['Måndag', 'Tisdag', 'Onsdag', 'Torsdag', 'Fredag', 'Lördag', 'Söndag']
const navigationClass = 'min-h-11 min-w-11 cursor-pointer rounded border border-black/20 text-xl hover:bg-black/10 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-black'

function MonthCalendar({ events, month, selectedDate, onMonthChange, onDateSelect }: MonthCalendarProps) {
  const year = month.getFullYear()
  const monthIndex = month.getMonth()
  const monthPrefix = `${year}-${String(monthIndex + 1).padStart(2, '0')}`
  const leadingDays = (new Date(year, monthIndex, 1).getDay() + 6) % 7
  const daysInMonth = new Date(year, monthIndex + 1, 0).getDate()
  const weekCount = Math.ceil((leadingDays + daysInMonth) / 7)
  const occurrences = getTournamentOccurrences(events)
  const eventDates = new Set(occurrences.map(({ round }) => round.date))
  const hasSelectedEvents = eventDates.has(selectedDate)

  function changeMonth(offset: number) {
    const nextMonth = new Date(year, monthIndex + offset, 1, 12)
    const prefix = `${nextMonth.getFullYear()}-${String(nextMonth.getMonth() + 1).padStart(2, '0')}`
    const firstRound = occurrences.find(({ round }) => round.date.startsWith(prefix))?.round
    onMonthChange(nextMonth)
    onDateSelect(firstRound?.date ?? `${prefix}-01`)
  }

  return (
    <>
      <div className="rounded-lg bg-white p-3 min-[40rem]:p-6">
        <div className="mb-4 flex items-center justify-between gap-2">
          <h3 id="calendar-month" aria-live="polite" className="font-heading text-xl capitalize min-[40rem]:text-2xl">
            {month.toLocaleDateString('sv-SE', { month: 'long', year: 'numeric' })}
          </h3>
          <div className="flex gap-2">
            <button type="button" aria-label="Föregående månad" onClick={() => changeMonth(-1)} className={navigationClass}>←</button>
            <button type="button" aria-label="Nästa månad" onClick={() => changeMonth(1)} className={navigationClass}>→</button>
          </div>
        </div>
        <table aria-labelledby="calendar-month" className="w-full table-fixed border-collapse text-center text-sm">
          <thead>
            <tr>
              {weekdays.map((day) => (
                <th key={day} scope="col" className="border-b border-black/10 pb-3 text-xs font-normal text-black/70">
                  <abbr title={day} className="no-underline">{day.slice(0, 3)}</abbr>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {Array.from({ length: weekCount }, (_, week) => (
              <tr key={week}>
                {weekdays.map((weekday, column) => {
                  const day = week * 7 + column - leadingDays + 1
                  if (day < 1 || day > daysInMonth) return <td key={weekday} />
                  const date = `${monthPrefix}-${String(day).padStart(2, '0')}`
                  const hasEvents = eventDates.has(date)
                  const isSelected = selectedDate === date
                  return (
                    <td key={weekday} className="py-0.5">
                      <button
                        type="button"
                        aria-label={`${formatClubDate(date, { day: 'numeric', month: 'long', year: 'numeric' })}${hasEvents ? ', tävling' : ''}`}
                        aria-pressed={isSelected}
                        aria-controls="selected-day-events"
                        onClick={() => onDateSelect(date)}
                        className={`relative min-h-11 w-full cursor-pointer rounded focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-black ${isSelected ? 'bg-red font-bold text-white' : 'hover:bg-black/10'}`}
                      >
                        {day}
                        {hasEvents && <span aria-hidden="true" className={`absolute bottom-1 left-1/2 size-1 -translate-x-1/2 rounded-full ${isSelected ? 'bg-white' : 'bg-red'}`} />}
                      </button>
                    </td>
                  )
                })}
              </tr>
            ))}
          </tbody>
        </table>
        <p className="mt-4 flex items-center gap-2 text-xs text-black/70"><span aria-hidden="true" className="size-1.5 rounded-full bg-red" />Tävlingsdag</p>
      </div>
      <div id="selected-day-events" className="mt-6">
        <h3 aria-live="polite" className="mb-4 font-heading text-xl">
          {formatClubDate(selectedDate, { day: 'numeric', month: 'long', year: 'numeric' })}
        </h3>
        {hasSelectedEvents ? <TournamentTimeline events={events} date={selectedDate} /> : <p className="text-sm">Ingen tävling planerad den här dagen.</p>}
      </div>
    </>
  )
}

export default MonthCalendar

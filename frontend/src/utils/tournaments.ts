import type { Tournament, TournamentRound } from '../types/tournament'

export function getTournamentRounds(event: Tournament): (TournamentRound & { venue: string })[] {
  // Stöd även äldre exempeldata där en endagstävling bara har date/time.
  const rounds = event.rounds?.length ? event.rounds : [{ id: `${event.id}-1`, date: event.date, time: event.time, venue: event.venue, resultsUrl: event.resultsUrl }]
  return rounds.map((round) => ({ ...round, venue: round.venue ?? event.venue })).sort((a, b) => a.date.localeCompare(b.date) || a.time.localeCompare(b.time))
}

export function getTournamentOccurrences(events: Tournament[]) {
  return events.flatMap((event) => {
    const rounds = getTournamentRounds(event)
    return rounds.map((round, index) => ({ event, round, number: index + 1, total: rounds.length }))
  }).sort((a, b) => a.round.date.localeCompare(b.round.date) || a.round.time.localeCompare(b.round.time))
}

export function getTournamentResultsUrl(event: Pick<Tournament, 'resultsUrl'>) {
  if (!event.resultsUrl?.trim()) return undefined
  try {
    const url = new URL(event.resultsUrl)
    return url.protocol === 'https:' || url.protocol === 'http:' ? url.href : undefined
  } catch {
    return undefined
  }
}

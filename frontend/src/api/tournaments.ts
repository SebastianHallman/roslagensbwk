import type { ApiTournament, EditableTournament } from '../types/tournament'
import { getTournamentRounds } from '../utils/tournaments'

export function toTournamentPayload(event: EditableTournament, original?: EditableTournament | null) {
  const originalIds = new Set(original?.rounds?.map((round) => round.id) ?? [])
  const rounds = getTournamentRounds(event)
  const retainedIds = new Set(rounds.map((round) => round.id))
  return {
    title: event.title,
    description: event.description,
    status: event.status,
    rounds: rounds.map((round) => ({
      ...(originalIds.has(round.id) ? { id: Number(round.id) } : {}),
      starts_at: `${round.date} ${round.time.replace('.', ':')}:00`,
      venue: round.venue,
      results_url: round.resultsUrl?.trim() || null,
    })),
    ...(original ? { removed_round_ids: [...originalIds].filter((id) => !retainedIds.has(id)).map(Number) } : {}),
  }
}

export function fromApiTournament(event: ApiTournament): EditableTournament {
  const rounds = event.rounds.map((round) => {
    const [date, time] = round.starts_at.split(' ')
    return {
      id: String(round.id),
      date,
      time: time.slice(0, 5).replace(':', '.'),
      venue: round.venue,
      resultsUrl: round.results_url ?? undefined,
    }
  }).sort((a, b) => a.date.localeCompare(b.date) || a.time.localeCompare(b.time))
  const firstRound = rounds[0]

  return {
    id: String(event.id),
    title: event.title,
    description: event.description,
    status: event.status,
    href: '/#kontakt',
    rounds,
    multiRound: rounds.length > 1,
    date: firstRound?.date ?? '',
    time: firstRound?.time ?? '',
    venue: firstRound?.venue ?? '',
    resultsUrl: rounds.length === 1 ? firstRound.resultsUrl : undefined,
  }
}

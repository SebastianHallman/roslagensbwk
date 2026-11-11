export type TournamentStatus = 'draft' | 'published'

export type TournamentRound = {
  id: string
  date: string
  time: string
  venue?: string
  resultsUrl?: string
}

export type Tournament = {
  id: string
  date: string
  title: string
  time: string
  venue: string
  href: string
  description: string
  rounds?: TournamentRound[]
  multiRound?: boolean
  resultsUrl?: string
}

export type EditableTournament = Tournament & { status: TournamentStatus }

export type ApiTournamentRound = {
  id: number
  starts_at: string
  venue: string
  results_url: string | null
}

export type ApiTournament = {
  id: number
  title: string
  description: string
  status: TournamentStatus
  rounds: ApiTournamentRound[]
}

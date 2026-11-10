export type ClubNews = {
  id: string
  date: string
  title: string
  summary: string
  body: string
}

export type TournamentRound = { id: string; date: string; time: string; venue?: string; resultsUrl?: string }

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

// Exempel för frontendskissen, inte publicerade klubbnyheter eller tävlingar.
export const clubNews: ClubNews[] = [
  {
    id: 'ny-sasong',
    date: '2026-11-08',
    title: 'En ny säsong tillsammans',
    summary: 'Träning, tävling och gemenskap. Vi ser fram emot fler fina stunder på Roslagsbowling.',
    body: 'Vi samlas på banorna för att utvecklas och ha roligt tillsammans. Vill du veta mer om klubben och våra träningar? Hör gärna av dig via kontaktsektionen nedan.',
  },
  {
    id: 'prova-bowling',
    date: '2026-11-05',
    title: 'Välkommen att prova bowling',
    summary: 'Ny i sporten eller sugen på att börja igen? Kom och träffa oss på banan.',
    body: 'Du behöver inte ha spelat i ett lag för att vara nyfiken på bowling. Kontakta oss så berättar vi mer om hur du kan komma igång.',
  },
]

export const tournaments: Tournament[] = [
  {
    id: 'hostcupen', date: '2026-11-14', title: 'Höstcupen', time: '09.00', venue: 'Roslagsbowling', href: '#kontakt',
    description: 'En hösttävling med plats för både tävlingsglädje och gemenskap på banorna. Spelform och övriga detaljer presenteras när tävlingen är fastställd.',
    rounds: [
      { id: 'hostcupen-1', date: '2026-11-14', time: '09.00', venue: 'Roslagsbowling', resultsUrl: 'https://example.com/' },
      { id: 'hostcupen-2', date: '2026-11-28', time: '09.00', venue: 'Bowlinghall B (exempel)' },
      { id: 'hostcupen-3', date: '2026-12-05', time: '10.00', venue: 'Roslagsbowling' },
    ],
    multiRound: true,
  },
  {
    id: 'klubbmasterskap', date: '2026-11-22', title: 'Klubbmästerskap', time: '10.00', venue: 'Roslagsbowling', href: '#kontakt',
    description: 'Klubbens medlemmar möts på banorna för en dag tillsammans. Tävlingsklasser och spelupplägg presenteras när planeringen är klar.',
  },
  {
    id: 'adventsdubbeln', date: '2026-12-06', title: 'Adventsdubbeln', time: '11.00', venue: 'Roslagsbowling', href: '#kontakt',
    description: 'En dubbeltävling med adventsstämning på Roslagsbowling. Information om lag, spelform och antal serier presenteras längre fram.',
  },
]

export function formatClubDate(date: string, options: Intl.DateTimeFormatOptions) {
  return new Date(`${date}T12:00:00`).toLocaleDateString('sv-SE', options)
}

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

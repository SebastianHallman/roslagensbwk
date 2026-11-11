function formatTournamentJSON(tournamentRows) {
    const tournaments = new Map();

    for (const row of tournamentRows) {
        if (!tournaments.has(row.tournament_id)) {
            tournaments.set(row.tournament_id, {
                id: row.tournament_id,
                title: row.title,
                description: row.description,
                status: row.status,
                rounds: [],
            });
        }

        const tournament = tournaments.get(row.tournament_id);
        if (row.round_id !== null) {
            tournament.rounds.push({
                id: row.round_id,
                venue: row.venue,
                starts_at: row.starts_at,
                results_url: row.results_url,
            });
        }
    }
    return [...tournaments.values()];
}

module.exports = { formatTournamentJSON };

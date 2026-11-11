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

function validMember(name, role, sortOrder) {
    return typeof name === 'string' && name.trim().length > 0 && name.trim().length <= 150 &&
        typeof role === 'string' && role.trim().length > 0 && role.trim().length <= 100 &&
        Number.isInteger(sortOrder) && sortOrder >= 0 && sortOrder <= 4294967295;
}

function validId(id) {
    return /^[1-9]\d*$/.test(id) && Number(id) <= 4294967295;
}

module.exports = { formatTournamentJSON, validMember, validId };

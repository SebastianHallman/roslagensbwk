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


function invalid(message) {
    const error = new Error(message);
    error.status = 400;
    error.code = 'INVALID_TOURNAMENT';
    throw error;
}

function requiredText(value, maxLength, label) {
    if (typeof value !== 'string' || !value.trim() || [...value.trim()].length > maxLength) {
        invalid(`${label} must contain between 1 and ${maxLength} characters.`);
    }
    return value.trim();
}

function validStart(value) {
    if (typeof value !== 'string') return false;
    const match = /^(\d{4})-(\d{2})-(\d{2}) (\d{2}):(\d{2}):(\d{2})$/.exec(value);
    if (!match) return false;
    const [, year, month, day, hour, minute, second] = match.map(Number);
    if (year < 1000 || month < 1 || month > 12 || day < 1 || hour > 23 || minute > 59 || second > 59) return false;
    return day <= new Date(Date.UTC(year, month, 0)).getUTCDate();
}

function resultLink(value, label) {
    if (value === undefined || value === null || value === '') return null;
    if (typeof value !== 'string') invalid(`${label} must be a URL or left empty.`);
    const url = value.trim();
    if (!url) return null;
    if ([...url].length > 2048) invalid(`${label} must not exceed 2048 characters.`);
    try {
        const parsed = new URL(url);
        if (/^https?:\/\//i.test(url) && (parsed.protocol === 'https:' || parsed.protocol === 'http:')) return url;
    } catch {
        // Ogiltiga adresser får samma valideringsfel som andra protokoll.
    }
    invalid(`${label} must be a complete HTTP or HTTPS URL.`);
}

function validateTournament(input, { requirePublishedRound = true } = {}) {
    if (!input || typeof input !== 'object' || Array.isArray(input)) invalid('Tournament must be an object.');
    const title = requiredText(input.title, 255, 'Title');
    const description = requiredText(input.description, 3000, 'Description');
    const status = input.status === undefined ? 'draft' : input.status;
    if (status !== 'draft' && status !== 'published') invalid('Status must be draft or published.');
    if (!Array.isArray(input.rounds)) invalid('Rounds must be an array.');
    if (requirePublishedRound && status === 'published' && input.rounds.length === 0) invalid('A published tournament must have at least one round.');

    const rounds = [];
    for (const [index, round] of input.rounds.entries()) {
        const label = `Round ${index + 1}`;
        if (!round || typeof round !== 'object' || Array.isArray(round)) invalid(`${label} must be an object.`);
        if (!validStart(round.starts_at)) invalid(`${label} must have a valid start date in YYYY-MM-DD HH:mm:ss format.`);
        rounds.push({
            starts_at: round.starts_at,
            venue: requiredText(round.venue, 255, `${label} venue`),
            results_url: resultLink(round.results_url, `${label} results URL`),
        });
    }
    return { title, description, status, rounds };
}

function validateTournamentUpdate(input) {
    // Utelämnade befintliga ronder lämnas kvar; slutantalet kontrolleras i transaktionen.
    const validated = validateTournament(input, { requirePublishedRound: false });
    const updatedIds = new Set();
    const rounds = validated.rounds.map((round, index) => {
        const id = input.rounds[index].id;
        if (id === undefined) return round;
        if (!Number.isInteger(id) || id <= 0 || id > 2147483647 || updatedIds.has(id)) {
            invalid('Each existing round must have a unique positive integer ID within the INT range.');
        }
        updatedIds.add(id);
        return { ...round, id };
    });
    const removedIds = input.removed_round_ids === undefined ? [] : input.removed_round_ids;
    if (!Array.isArray(removedIds)) invalid('removed_round_ids must be an array.');
    const seen = new Set();
    for (const id of removedIds) {
        if (!Number.isInteger(id) || id <= 0 || id > 2147483647 || seen.has(id) || updatedIds.has(id)) {
            invalid('Removed rounds must have unique valid IDs and must not also be updated.');
        }
        seen.add(id);
    }
    return { ...validated, rounds, removed_round_ids: [...removedIds] };
}

function validateNews(news) {
    const input = news && typeof news === 'object' && !Array.isArray(news) ? news : {};
    const title = typeof input.title === 'string' ? input.title.trim() : '';
    const body = typeof input.body === 'string' ? input.body.trim() : '';
    const status = input.status === undefined ? 'draft' : input.status;
    let message;
    if (!title || [...title].length > 150) {
        message = 'Title must contain between 1 and 150 characters.';
    } else if (!body || [...body].length > 10000) {
        message = 'Body must contain between 1 and 10000 characters.';
    } else if (status !== 'draft' && status !== 'published') {
        message = 'Status must be draft or published.';
    }
    if (message) {
        const error = new Error(message);
        error.status = 400;
        error.code = 'INVALID_NEWS';
        throw error;
    }
    return { title, body, status };
}

module.exports = { formatTournamentJSON, validMember, validId, validateTournament, validateTournamentUpdate, validateNews };

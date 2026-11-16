import { requestJson } from './requestJson.js';
const API_URL = import.meta.env.VITE_API_URL;

if (!API_URL) {
  throw new Error('VITE_API_URL must be configured');
}


async function fetchBoardMembers() {
    try {
        return await requestJson(`${API_URL}/board`);
    } catch (error) {
        console.error('Error fetching board members:', error);
        throw error;
    }
}

async function signIn(email, password) {
    try {
        return await requestJson(`${API_URL}/auth/signin`, {
            method: 'POST',
            data: { email, password },
            credentials: 'include'
        });
    } catch (error) {
        console.error('Error signing in:', error);
        throw error;
    }
}

async function signOut() {
    try {
        return await requestJson(`${API_URL}/auth/signout`, {
            method: 'POST',
            credentials: 'include'
        });
    } catch (error) {
        console.error('Error signing out:', error);
        throw error;
    }
}

async function getCurrentUser() {
    try {
        const data = await requestJson(`${API_URL}/auth/me`, {
            method: 'GET',
            credentials: 'include'
        });
        return data.user;
    } catch (error) {
        if (error.status === 401) return null;
        console.error('Error getting user:', error);
        throw error;
    }
}
async function createAdminInvitation(email) {
    return requestJson(`${API_URL}/auth/invite`, {
        method: 'POST',
        credentials: 'include',
        data: { email }
    });
}

async function requestPasswordReset(email) {
    return requestJson(`${API_URL}/auth/forgot-password`, {
        method: 'POST',
        data: { email }
    });
}

async function redeemInvitation(token, password) {
    return requestJson(`${API_URL}/auth/verify-invite`, {
        method: 'POST',
        credentials: 'include',
        data: { token, password }
    });
}

async function resetPassword(token, password) {
    return requestJson(`${API_URL}/auth/reset-password`, {
        method: 'POST',
        data: { token, password }
    });
}

async function boardRequest(path, method = 'GET', data, signal) {
    return requestJson(`${API_URL}/board${path}`, {
        method,
        credentials: 'include',
        signal,
        data
    });
}

async function fetchAdminTournaments(signal) {
    return requestJson(`${API_URL}/tournaments`, {
        method: 'GET',
        credentials: 'include',
        signal
    });
}

async function fetchTournaments(signal) {
    try {
        return await requestJson(`${API_URL}/tournaments/published`, { signal });
    } catch (error) {
        console.error('Error fetching tournaments:', error);
        throw error;
    }
}

async function fetchNews(signal) {
    return requestJson(`${API_URL}/news/published`, { signal });
}

async function fetchAdminNews(signal) {
    return requestJson(`${API_URL}/news`, {
        method: 'GET',
        credentials: 'include',
        signal
    });
}

async function createNews(news) {
    return requestJson(`${API_URL}/news/create`, {
        method: 'POST',
        credentials: 'include',
        data: { news },
        validationCode: 'INVALID_NEWS'
    });
}

async function updateNews(id, news) {
    return requestJson(`${API_URL}/news/${encodeURIComponent(id)}`, {
        method: 'PUT',
        credentials: 'include',
        data: { news },
        validationCode: 'INVALID_NEWS'
    });
}

async function deleteNews(id) {
    return requestJson(`${API_URL}/news/delete/${encodeURIComponent(id)}`, {
        method: 'DELETE',
        credentials: 'include',
        validationCode: 'INVALID_NEWS'
    });
}

async function createTournament(tournament) {
    return requestJson(`${API_URL}/tournaments/create`, {
        method: 'POST',
        credentials: 'include',
        data: { tournament },
        validationCode: 'INVALID_TOURNAMENT'
    });
}

async function updateTournament(id, tournament) {
    return requestJson(`${API_URL}/tournaments/${encodeURIComponent(id)}`, {
        method: 'PUT',
        credentials: 'include',
        data: { tournament },
        validationCode: 'INVALID_TOURNAMENT'
    });
}

async function deleteTournament(id) {
    return requestJson(`${API_URL}/tournaments/delete/${encodeURIComponent(id)}`, {
        method: 'DELETE',
        credentials: 'include',
        validationCode: 'INVALID_TOURNAMENT'
    });
}

const fetchAdminBoardMembers = (signal) => boardRequest('/admin', 'GET', undefined, signal);
const addBoardMember = (member) => boardRequest('/add', 'POST', member);
const updateBoardMember = (id, member) => boardRequest(`/${id}`, 'PUT', member);
const deleteBoardMember = (id) => boardRequest(`/delete/${id}`, 'DELETE');
const reorderBoardMembers = (ids) => boardRequest('/reorder', 'PUT', { ids });

export { fetchBoardMembers, signIn, signOut, getCurrentUser, createAdminInvitation, redeemInvitation, requestPasswordReset, resetPassword,
    fetchAdminBoardMembers, addBoardMember, updateBoardMember, deleteBoardMember, reorderBoardMembers,
    createTournament, updateTournament, fetchAdminTournaments, fetchTournaments, deleteTournament, fetchNews, fetchAdminNews, createNews, updateNews, deleteNews };


const API_URL = import.meta.env.VITE_API_URL;

if (!API_URL) {
  throw new Error('VITE_API_URL must be configured');
}


async function fetchBoardMembers() {
    try {
        const response = await fetch(`${API_URL}/board`);
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();
        return data;
    } catch (error) {
        console.error('Error fetching board members:', error);
        throw error;
    }
}

async function signIn(email, password) {
    try {
        const response = await fetch(`${API_URL}/auth/signin`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ email, password }),
            credentials: 'include'
        });
        if (!response.ok) {
            const error = new Error(`HTTP error! status: ${response.status}`);
            error.status = response.status;
            throw error;
        }
        const data = await response.json();
        return data;
    } catch (error) {
        console.error('Error signing in:', error);
        throw error;
    }
}

async function signOut() {
    try {
        const response = await fetch(`${API_URL}/auth/signout`, {
            method: 'POST',
            credentials: 'include'
        });
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();
        return data;
    } catch (error) {
        console.error('Error signing out:', error);
        throw error;
    }
}

async function getCurrentUser() {
    try {
        const response = await fetch(`${API_URL}/auth/me`, {
            method: 'GET',
            credentials: 'include'
        });
        if (response.status === 401) return null;
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();
        return data.user;
    } catch (error) {
        console.error('Error getting user:', error);
        throw error;
    }
}
async function createAdminInvitation(email) {
    const response = await fetch(`${API_URL}/auth/invite`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email })
    });
    if (!response.ok) {
        const details = await response.json().catch(() => null);
        const error = new Error(`HTTP error! status: ${response.status}`);
        error.status = response.status;
        error.code = details?.code;
        throw error;
    }
    return response.json();
}

async function redeemInvitation(token, email, password) {
    const response = await fetch(`${API_URL}/auth/verify-invite`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, email, password })
    });
    if (!response.ok) {
        const error = new Error(`HTTP error! status: ${response.status}`);
        error.status = response.status;
        throw error;
    }
    return response.json();
}

async function boardRequest(path, method = 'GET', data, signal) {
    const response = await fetch(`${API_URL}/board${path}`, {
        method,
        credentials: 'include',
        signal,
        ...(data === undefined ? {} : {
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        })
    });
    if (!response.ok) {
        const error = new Error(`HTTP error! status: ${response.status}`);
        error.status = response.status;
        throw error;
    }
    return response.json();
}

const fetchAdminBoardMembers = (signal) => boardRequest('/admin', 'GET', undefined, signal);
const addBoardMember = (member) => boardRequest('/add', 'POST', member);
const updateBoardMember = (id, member) => boardRequest(`/${id}`, 'PUT', member);
const deleteBoardMember = (id) => boardRequest(`/delete/${id}`, 'DELETE');
const reorderBoardMembers = (ids) => boardRequest('/reorder', 'PUT', { ids });

export { fetchBoardMembers, signIn, signOut, getCurrentUser, createAdminInvitation, redeemInvitation,
    fetchAdminBoardMembers, addBoardMember, updateBoardMember, deleteBoardMember, reorderBoardMembers };

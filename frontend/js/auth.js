const STORAGE_KEYS = {
    ACCESS_TOKEN: 'er_access_token',
    REFRESH_TOKEN: 'er_refresh_token',
    TOKEN_EXP: 'er_token_exp',
};

const MAX_REFRESH_FAILURES = 3;

let refreshTimer = null;
let refreshFailures = 0;
const listeners = [];

export function getAccessToken() {
    return localStorage.getItem(STORAGE_KEYS.ACCESS_TOKEN) || '';
}

function getRefreshToken() {
    return localStorage.getItem(STORAGE_KEYS.REFRESH_TOKEN) || '';
}

function storeTokens(accessToken, refreshToken, expiresIn) {
    localStorage.setItem(STORAGE_KEYS.ACCESS_TOKEN, accessToken);
    localStorage.setItem(STORAGE_KEYS.REFRESH_TOKEN, refreshToken);
    localStorage.setItem(STORAGE_KEYS.TOKEN_EXP, String(Math.floor(Date.now() / 1000) + expiresIn));
}

function clearTokens() {
    localStorage.removeItem(STORAGE_KEYS.ACCESS_TOKEN);
    localStorage.removeItem(STORAGE_KEYS.REFRESH_TOKEN);
    localStorage.removeItem(STORAGE_KEYS.TOKEN_EXP);
}

function errorMessage(result, fallback) {
    return result?.error?.message || result?.detail?.message || result?.detail || fallback;
}

export function isAuthenticated() {
    const token = getAccessToken();
    if (!token) return false;
    const exp = parseInt(localStorage.getItem(STORAGE_KEYS.TOKEN_EXP) || '0', 10);
    return Date.now() / 1000 < exp;
}

export function onAuthStateChange(callback) {
    listeners.push(callback);
}

function notifyAuthChange(authenticated) {
    listeners.forEach(callback => callback(authenticated));
}

export async function login(username, password) {
    const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
    });

    const result = await response.json().catch(() => ({}));
    if (!response.ok || result.error) {
        throw new Error(errorMessage(result, 'Echec de connexion'));
    }

    const { access_token, refresh_token, expires_in } = result.data;
    storeTokens(access_token, refresh_token, expires_in);
    refreshFailures = 0;
    scheduleTokenRefresh();
    notifyAuthChange(true);
    return result.data;
}

export async function logout() {
    const refreshToken = getRefreshToken();
    try {
        await fetch('/api/auth/logout', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ refresh_token: refreshToken }),
        });
    } catch {
        // Best effort.
    }
    clearTokens();
    clearTimeout(refreshTimer);
    refreshTimer = null;
    notifyAuthChange(false);
}

export async function refreshAccessToken() {
    const refreshToken = getRefreshToken();
    if (!refreshToken) throw new Error('Session expiree');

    const response = await fetch('/api/auth/token/refresh', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refresh_token: refreshToken }),
    });

    const result = await response.json().catch(() => ({}));
    if (!response.ok || result.error) {
        throw new Error(errorMessage(result, 'Refresh echoue'));
    }

    const { access_token, refresh_token, expires_in } = result.data;
    storeTokens(access_token, refresh_token, expires_in);
    return result.data;
}

export function scheduleTokenRefresh() {
    const token = getAccessToken();
    if (!token) return;

    try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        const expiresIn = (payload.exp * 1000) - Date.now();
        const refreshIn = Math.max(expiresIn - 60000, 10000);

        clearTimeout(refreshTimer);
        refreshTimer = setTimeout(async () => {
            try {
                await refreshAccessToken();
                refreshFailures = 0;
                scheduleTokenRefresh();
            } catch {
                refreshFailures += 1;
                if (refreshFailures >= MAX_REFRESH_FAILURES) {
                    forceLogout('Session expiree, reconnectez-vous.');
                } else {
                    refreshTimer = setTimeout(() => scheduleTokenRefresh(), 10000);
                }
            }
        }, refreshIn);
    } catch {
        forceLogout('Session invalide, reconnectez-vous.');
    }
}

export function authenticatedUrl(url) {
    const token = getAccessToken();
    if (!url || !token) return url;
    const separator = url.includes('?') ? '&' : '?';
    return `${url}${separator}token=${encodeURIComponent(token)}`;
}

export function forceLogout(message) {
    clearTokens();
    clearTimeout(refreshTimer);
    refreshTimer = null;
    notifyAuthChange(false);
    if (message) {
        window.dispatchEvent(new CustomEvent('er-force-logout', { detail: { message } }));
    }
}

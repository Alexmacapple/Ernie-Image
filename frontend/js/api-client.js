import { forceLogout, getAccessToken, refreshAccessToken } from './auth.js?v=20260427-auth';

function _headers(extra = {}) {
    return {
        'Authorization': `Bearer ${getAccessToken()}`,
        ...extra,
    };
}

function _message(body, status) {
    const detail = body?.detail;
    if (typeof detail === 'string') return detail;
    if (detail?.message) return detail.message;
    if (body?.error?.message) return body.error.message;
    return `Erreur ${status}`;
}

async function _request(url, options = {}, retryAuth = true) {
    const res = await fetch(url, {
        ...options,
        headers: {
            ..._headers(),
            ...options.headers,
        },
    });

    if (res.status === 401 && retryAuth) {
        try {
            await refreshAccessToken();
            return _request(url, options, false);
        } catch {
            forceLogout('Session expiree, reconnectez-vous.');
        }
    }

    if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw Object.assign(new Error(_message(body, res.status)), { status: res.status });
    }
    return res;
}

export async function apiGet(url) {
    const res = await _request(url);
    return res.json();
}

export async function apiPost(url, body) {
    const res = await _request(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
    });
    return res.json();
}

export async function apiDelete(url) {
    const res = await _request(url, { method: 'DELETE' });
    return res.json();
}

/**
 * SSE via fetch (compatible POST).
 * @param {string} url
 * @param {object} body
 * @param {{ onEvent: function, onDone: function, onError: function }} callbacks
 * @returns {{ abort: function }}
 */
export function fetchSSE(url, body, { onEvent, onDone, onError } = {}) {
    const controller = new AbortController();

    async function connect(retryAuth = true) {
        let res;
        try {
            res = await fetch(url, {
                method: 'POST',
                headers: _headers({ 'Content-Type': 'application/json' }),
                body: JSON.stringify(body),
                signal: controller.signal,
            });
        } catch (err) {
            if (err.name !== 'AbortError') onError?.(err);
            return;
        }

        if (res.status === 401 && retryAuth) {
            try {
                await refreshAccessToken();
                return connect(false);
            } catch {
                forceLogout('Session expiree, reconnectez-vous.');
            }
        }

        if (!res.ok) {
            const b = await res.json().catch(() => ({}));
            onError?.(Object.assign(new Error(_message(b, res.status)), { status: res.status }));
            return;
        }

        const reader = res.body.getReader();
        const decoder = new TextDecoder();
        let buffer = '';
        let terminalEventReceived = false;

        try {
            while (true) {
                const { done, value } = await reader.read();
                if (done) break;
                buffer += decoder.decode(value, { stream: true });
                const lines = buffer.split('\n');
                buffer = lines.pop() ?? '';
                for (const line of lines) {
                    if (!line.startsWith('data: ')) continue;
                    const raw = line.slice(6).trim();
                    if (!raw) continue;
                    let event;
                    try { event = JSON.parse(raw); } catch { continue; }
                    onEvent?.(event);
                    if (event.type === 'done' || event.type === 'error') {
                        terminalEventReceived = true;
                        onDone?.(event);
                        return;
                    }
                }
            }
            if (!terminalEventReceived) {
                onError?.(new Error('Connexion interrompue avant la fin du flux.'));
            }
        } catch (err) {
            if (err.name !== 'AbortError') onError?.(err);
        }
    }

    connect();

    return { abort: () => controller.abort() };
}

import { apiGet } from './api-client.js?v=20260427-lightbox-nav';

const badge   = document.getElementById('footer-status-badge');
const label   = document.getElementById('footer-status-label');
const hmLoaded     = document.getElementById('hm-loaded');
const hmElapsed    = document.getElementById('hm-elapsed');
const hmGenerating = document.getElementById('hm-generating');
const hmError      = document.getElementById('hm-error');

const STATES = {
    loading: { badge: 'fr-badge--info',    text: 'Chargement' },
    ready:   { badge: 'fr-badge--success', text: 'Prêt' },
    busy:    { badge: 'fr-badge--warning', text: 'Génération' },
    error:   { badge: 'fr-badge--error',   text: 'Erreur' },
};

function _applyState(key, detail = '') {
    const s = STATES[key];
    badge.className = `fr-badge fr-badge--sm ${s.badge}`;
    badge.textContent = s.text;
    label.textContent = detail;
}

export function updateFooter(status) {
    if (status.load_error) {
        _applyState('error', status.load_error.slice(0, 80));
    } else if (!status.loaded) {
        const t = status.loading_elapsed_s ? `${status.loading_elapsed_s}s écoulées` : '';
        _applyState('loading', `Pipeline en chargement… ${t}`);
    } else if (status.generating) {
        _applyState('busy', 'Génération en cours…');
    } else {
        _applyState('ready', 'Pipeline prêt');
    }

    // Données modale
    hmLoaded.textContent     = status.loaded ? '✓ Chargé' : '⏳ En cours';
    hmElapsed.textContent    = status.loading_elapsed_s ? `${status.loading_elapsed_s}s` : '-';
    hmGenerating.textContent = status.generating ? 'Oui' : 'Non';

    if (status.load_error) {
        hmError.textContent = status.load_error;
        hmError.hidden = false;
    } else {
        hmError.hidden = true;
    }
}

// Rafraîchit la modale à chaque ouverture
document.getElementById('health-modal')?.addEventListener('dsfr.open', async () => {
    try {
        const s = await apiGet('/api/status');
        updateFooter(s);
    } catch (e) {
        hmError.textContent = e.message;
        hmError.hidden = false;
    }
});

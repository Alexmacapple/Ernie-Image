/**
 * Module propriétaire de l'état seed - évite le couplage circulaire
 * entre gallery.js et generator.js.
 *
 * Usage :
 *   initSeedWorkflow()   - appel unique au démarrage
 *   lockSeed(42)         - passe en mode Raffinement
 *   unlockSeed()         - repasse en mode Exploration
 *   getSeedForSubmit()   - renvoie la valeur à soumettre (int | undefined)
 */

let _seedEl   = null;
let _badgeEl  = null;
let _unlockEl = null;
let _mode     = 'exploration'; // 'exploration' | 'raffinement'
const MAX_SEED = 2 ** 31 - 1;

export function initSeedWorkflow() {
    _seedEl   = document.getElementById('seed');
    _badgeEl  = document.getElementById('seed-mode-badge');
    _unlockEl = document.getElementById('seed-unlock-btn');

    if (!_seedEl || !_badgeEl || !_unlockEl) return;

    _unlockEl.addEventListener('click', unlockSeed);
    _seedEl.addEventListener('input', _syncManualSeedMode);
    _seedEl.addEventListener('change', _syncManualSeedMode);
    _syncManualSeedMode();
    _syncUI();
}

export function lockSeed(seed) {
    if (!_seedEl) return;
    _seedEl.value = String(seed);
    _seedEl.dispatchEvent(new Event('input',  { bubbles: true }));
    _seedEl.dispatchEvent(new Event('change', { bubbles: true }));
    _mode = 'raffinement';
    _syncUI();
}

export function unlockSeed() {
    if (!_seedEl) return;
    _seedEl.value = '';
    _seedEl.dispatchEvent(new Event('input',  { bubbles: true }));
    _seedEl.dispatchEvent(new Event('change', { bubbles: true }));
    _mode = 'exploration';
    _syncUI();
}

export function getSeedForSubmit() {
    if (!_seedEl) return undefined;
    const v = _seedEl.value.trim();
    if (v === '') return undefined;
    const n = Number(v);
    return Number.isInteger(n) && n >= 0 && n <= MAX_SEED ? n : undefined;
}

function _syncUI() {
    if (!_badgeEl || !_unlockEl) return;
    if (_mode === 'raffinement') {
        const seed = _seedEl?.value ?? '';
        _badgeEl.textContent  = `Seed fixée : ${seed}`;
        _badgeEl.className    = 'fr-badge fr-badge--sm fr-badge--warning seed-mode-badge';
        _unlockEl.hidden      = false;
    } else {
        _badgeEl.textContent  = 'Seed aléatoire';
        _badgeEl.className    = 'fr-badge fr-badge--sm fr-badge--info seed-mode-badge';
        _unlockEl.hidden      = true;
    }
}

function _syncManualSeedMode() {
    if (!_seedEl) return;
    _mode = _seedEl.value.trim() === '' ? 'exploration' : 'raffinement';
    _syncUI();
}

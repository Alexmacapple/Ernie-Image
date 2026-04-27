import { apiGet, fetchSSE } from './api-client.js?v=20260427-prd112-113';
import { authenticatedUrl } from './auth.js?v=20260427-auth';
import { openImageLightbox, refresh as refreshGallery } from './gallery.js?v=20260427-prd112-113';
import { getSeedForSubmit } from './seed-workflow.js?v=20260427-prd112-113';

const form        = document.getElementById('generate-form');
const promptEl    = document.getElementById('prompt');
const promptGroup = document.getElementById('prompt-group');
const ratioEl     = document.getElementById('ratio');
const stepsEl     = document.getElementById('steps');
const seedEl      = document.getElementById('seed');
const btn         = document.getElementById('generate-btn');

const progressSection = document.getElementById('progress-section');
const progressLabel   = document.getElementById('progress-label');
const progressFill    = document.getElementById('progress-fill');
const progressTrack   = document.getElementById('progress-track');
const progressDetail  = document.getElementById('progress-detail');

const resultSection   = document.getElementById('result-section');
const resultOpen      = document.getElementById('result-open');
const resultImage     = document.getElementById('result-image');
const resultMetaText  = document.getElementById('result-meta-text');
const resultDownload  = document.getElementById('result-download');
const generateHint    = document.getElementById('generate-hint');

const PROMPT_MAX_LENGTH = 8000;
const PROMPT_THRESHOLDS = { short: 100, ok: 200 };

let _sseHandle = null;
let _lastStarted = null;
let _lastResult = null;

export function updatePromptCounter() {
    const counter = document.getElementById('prompt-counter');
    if (!counter || !promptEl) return;
    const len = promptEl.value.length;
    let label, cls;
    if (len < PROMPT_THRESHOLDS.short) {
        label = `${len} car. sur ${PROMPT_MAX_LENGTH} - court`;
        cls   = 'prompt-counter--short';
    } else if (len < PROMPT_THRESHOLDS.ok) {
        label = `${len} car. sur ${PROMPT_MAX_LENGTH} - acceptable`;
        cls   = 'prompt-counter--ok';
    } else {
        label = `${len} car. sur ${PROMPT_MAX_LENGTH} - structuré`;
        cls   = 'prompt-counter--structured';
    }
    counter.textContent  = label;
    counter.className    = `prompt-counter ${cls}`;
}

export async function loadPresets() {
    try {
        const presets = await apiGet('/api/presets');
        ratioEl.innerHTML = presets.map(p =>
            `<option value="${p.name}"${p.name === 'square' ? ' selected' : ''}>` +
            `${_presetLabel(p.name)} - ${p.width}×${p.height}` +
            `</option>`
        ).join('');
        ratioEl.disabled = false;
    } catch {
        ratioEl.innerHTML = '<option value="square">square - 1024×1024</option>';
        ratioEl.disabled = false;
    }
}

function _presetLabel(name) {
    const labels = {
        'square':         'Carré 1:1',
        'landscape':      'Paysage 3:2',
        'portrait':       'Portrait 2:3',
        'landscape-soft': 'Paysage 4:3',
        'portrait-soft':  'Portrait 3:4',
        'cinema':         'Cinéma 16:9',
        'vertical':       'Vertical 9:16',
    };
    return labels[name] ?? name;
}

export function enableForm() {
    btn.disabled = false;
    btn.classList.remove('fr-btn--icon-left', 'fr-icon-image-fill', 'fr-icon-loader-fill');
    btn.textContent = 'Générer une image';
    generateHint.textContent = "Durée estimée : ~40s selon le nombre d'étapes";
}

export function disableForm() {
    btn.disabled = true;
    btn.classList.remove('fr-btn--icon-left', 'fr-icon-image-fill', 'fr-icon-loader-fill');
    btn.textContent = 'Générer une image';
    generateHint.textContent = 'Modèle en chargement…';
}

function _setProgress(percent, label, detail = '') {
    progressFill.style.width = `${percent}%`;
    progressTrack.setAttribute('aria-valuenow', percent);
    if (label) progressLabel.textContent = label;
    if (detail) progressDetail.textContent = detail;
}

function _showProgress(visible) {
    progressSection.hidden = !visible;
    form.classList.toggle('form-disabled', visible);
    btn.disabled = visible;
    btn.classList.remove('fr-btn--icon-left', 'fr-icon-image-fill', 'fr-icon-loader-fill');
    btn.textContent = 'Générer une image';
    generateHint.textContent = visible
        ? 'Génération en cours…'
        : "Durée estimée : ~40s selon le nombre d'étapes";
}

function _showResult(event) {
    const output   = event.outputs?.[0];
    const filename = output?.filename ?? event.filename;
    const url      = output?.url ?? `/api/outputs/${filename}`;
    const imageUrl = authenticatedUrl(url);
    _lastResult = {
        filename,
        url,
        prompt: event.prompt,
        seed: event.seed,
        steps: _lastStarted?.steps ?? parseInt(stepsEl.value, 10),
        width: _lastStarted?.width,
        height: _lastStarted?.height,
    };

    resultImage.src = imageUrl;
    resultImage.alt = event.prompt ?? `Image générée - seed ${event.seed}`;
    resultOpen.title = `Afficher ${filename}`;
    resultOpen.setAttribute('aria-label', `Afficher ${filename}`);
    resultDownload.href = imageUrl;
    resultDownload.download = filename;
    const meta = [event.prompt ? `« ${event.prompt} »` : null, `${event.elapsed_s}s`, `seed ${event.seed}`]
        .filter(Boolean).join(' · ');
    resultMetaText.textContent = meta;
    resultSection.hidden = false;
    resultSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

function _showPromptError() {
    promptGroup.classList.add('fr-input-group--error');
    promptEl.classList.add('fr-input--error');
    promptEl.setAttribute('aria-invalid', 'true');
}

function _clearPromptError() {
    promptGroup.classList.remove('fr-input-group--error');
    promptEl.classList.remove('fr-input--error');
    promptEl.removeAttribute('aria-invalid');
}

function _resetPromptField() {
    promptEl.value = '';
    promptEl.dispatchEvent(new Event('input',  { bubbles: true }));
    promptEl.dispatchEvent(new Event('change', { bubbles: true }));
    _clearPromptError();
}

promptEl.addEventListener('input', () => {
    _clearPromptError();
    updatePromptCounter();
});

_clearPromptError();
updatePromptCounter();

form.addEventListener('submit', (e) => {
    e.preventDefault();

    const prompt = promptEl.value.trim();
    if (!prompt) {
        _showPromptError();
        promptEl.focus();
        return;
    }
    _clearPromptError();

    const body = {
        prompt,
        ratio: ratioEl.value || undefined,
        steps: parseInt(stepsEl.value, 10),
        seed: getSeedForSubmit(),
    };

    _setProgress(0, 'Démarrage…', '');
    _showProgress(true);
    _lastStarted = null;

    _sseHandle = fetchSSE('/api/generate', body, {
        onEvent(event) {
            if (event.type === 'started') {
                _lastStarted = {
                    steps: event.steps,
                    width: event.width,
                    height: event.height,
                    seed: event.seed,
                };
                const est = event.estimated_s ?? (event.steps * 6);
                progressDetail.textContent = `Seed ${event.seed} · durée estimée : ~${est}s · ${event.width}×${event.height}`;
                _setProgress(2, 'Génération en cours…');
            } else if (event.type === 'progress') {
                _setProgress(
                    event.percent,
                    `Génération en cours… ${event.percent}%`,
                    `${event.elapsed_s}s écoulées`,
                );
            }
        },
        onDone(event) {
            _showProgress(false);
            if (event.type === 'done') {
                _setProgress(100, 'Terminé');
                _showResult(event);
                _resetPromptField();
                refreshGallery(1);
            } else if (event.type === 'error') {
                _onError(new Error(event.detail ?? 'Erreur inconnue'));
            }
        },
        onError(err) {
            _onError(err);
        },
    });
});

function _onError(err) {
    _showProgress(false);
    enableForm();

    const existing = document.getElementById('generate-error');
    if (existing) existing.remove();

    const alert = document.createElement('div');
    alert.id = 'generate-error';
    alert.className = 'fr-alert fr-alert--error fr-mb-3w';
    alert.innerHTML = `<p class="fr-alert__title">Erreur de génération</p><p>${_escHtml(err.message)}</p>`;
    form.insertAdjacentElement('afterend', alert);
}

resultOpen.addEventListener('click', () => {
    if (_lastResult) openImageLightbox(_lastResult);
});

function _escHtml(s) {
    return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

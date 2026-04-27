const MAX_PROMPT_LENGTH = 8000;
const VISUAL_ANCHOR_PREFIX = 'Visual anchor:';

export const VISUAL_ANCHOR_PRESETS = [
    {
        id: 'portrait-mediterranean',
        label: 'Portrait méditerranéen contemporain',
        text: 'contemporary Mediterranean European portrait, warm olive skin tones, natural facial features, modern Spanish or French clothing, soft editorial daylight, realistic photography',
    },
    {
        id: 'portrait-western-european',
        label: 'Portrait européen occidental éditorial',
        text: 'Western European editorial portrait, fair to light skin tones when relevant, natural facial structure, contemporary European clothing, neutral studio background, realistic photography',
    },
    {
        id: 'portrait-afro-caribbean',
        label: 'Portrait afro-caribéen éditorial',
        text: 'Afro-Caribbean editorial portrait, deep warm skin tones, natural coiled hair texture, contemporary clothing, soft studio light, realistic photography',
    },
    {
        id: 'portrait-latin-american',
        label: 'Portrait latino-américain contemporain',
        text: 'contemporary Latin American portrait, warm skin tones, dark hair, expressive natural face, modern urban clothing, editorial daylight, realistic photography',
    },
    {
        id: 'setting-european-urban',
        label: 'Décor urbain européen',
        text: 'contemporary European urban street, Latin alphabet signage, stone facades, compact storefronts, modern European clothing, natural city light',
    },
    {
        id: 'setting-iberian-mediterranean',
        label: 'Décor méditerranéen ibérique',
        text: 'Iberian Mediterranean setting, Madrid or Valencia architecture, ceramic tiles, saturated red, turquoise and saffron palette, Latin alphabet signs, warm daylight',
    },
    {
        id: 'setting-french-public',
        label: 'Institution publique française',
        text: 'French public institution interior, Latin alphabet French signage, sober administrative furniture, modern European public service setting, neutral daylight',
    },
    {
        id: 'setting-french-poster',
        label: 'Affiche française en alphabet latin',
        text: 'French poster design, exact French text in Latin alphabet, European cinema typography, clean readable lettering, balanced composition, controlled graphic palette',
    },
];

let _promptEl = null;
let _customEl = null;
let _applyBtn = null;
let _statusEl = null;
let _warningEl = null;
let _selectedPresetId = null;
let _presetButtons = [];

export function initRepresentationControls() {
    _promptEl = document.getElementById('prompt');
    _customEl = document.getElementById('visual-anchor-custom');
    _applyBtn = document.getElementById('visual-anchor-apply');
    _statusEl = document.getElementById('visual-anchor-status');
    _warningEl = document.getElementById('visual-anchor-warning');
    _presetButtons = Array.from(document.querySelectorAll('[data-visual-anchor-preset]'));

    if (!_promptEl || !_customEl || !_applyBtn || !_statusEl) return;

    _presetButtons.forEach((button) => {
        button.addEventListener('click', () => _selectPreset(button.dataset.visualAnchorPreset));
    });

    _customEl.addEventListener('input', () => _setStatus(''));
    _applyBtn.addEventListener('click', _applyVisualAnchor);
    _promptEl.addEventListener('input', _syncPromptSpecificityHint);
    _syncPromptSpecificityHint();
}

export function buildVisualIdentityBlock() {
    const parts = [];
    const preset = VISUAL_ANCHOR_PRESETS.find(item => item.id === _selectedPresetId);
    const custom = _customEl?.value.trim() ?? '';

    if (preset) parts.push(preset.text);
    if (custom) parts.push(custom);
    if (!parts.length) return '';

    return `${VISUAL_ANCHOR_PREFIX} ${parts.join(', ')}.`;
}

function _selectPreset(presetId) {
    if (_selectedPresetId === presetId) {
        _selectedPresetId = null;
    } else {
        _selectedPresetId = presetId;
    }

    _presetButtons.forEach((button) => {
        const isSelected = button.dataset.visualAnchorPreset === _selectedPresetId;
        button.setAttribute('aria-pressed', String(isSelected));
        button.classList.toggle('visual-anchor-preset--selected', isSelected);
    });
    _setStatus('');
}

function _applyVisualAnchor() {
    const block = buildVisualIdentityBlock();
    if (!block) {
        _setStatus('Choisissez un preset ou saisissez un ancrage personnalisé.');
        _applyBtn.focus();
        return;
    }

    const currentPrompt = _promptEl.value;
    const nextPrompt = _replaceVisualAnchorBlock(currentPrompt, block);
    if (nextPrompt.length > MAX_PROMPT_LENGTH) {
        _setStatus("L'ancrage dépasse la limite de 8000 caractères. Raccourcissez le prompt ou l'ancrage personnalisé.");
        _applyBtn.focus();
        return;
    }

    _promptEl.value = nextPrompt;
    _promptEl.dispatchEvent(new Event('input', { bubbles: true }));
    _promptEl.dispatchEvent(new Event('change', { bubbles: true }));
    _setStatus('Ancrage visuel ajouté au prompt.');
    _promptEl.focus({ preventScroll: true });
}

function _replaceVisualAnchorBlock(prompt, block) {
    const keptLines = prompt
        .split('\n')
        .filter(line => !line.trim().startsWith(VISUAL_ANCHOR_PREFIX));
    const base = keptLines.join('\n').trimEnd();
    return base ? `${base}\n\n${block}` : block;
}

function _syncPromptSpecificityHint() {
    if (!_warningEl || !_promptEl) return;

    const prompt = _promptEl.value.trim();
    const message = _specificityMessage(prompt);
    _warningEl.textContent = message;
    _warningEl.hidden = !message;
}

function _specificityMessage(prompt) {
    if (!prompt) return '';

    const lower = prompt.toLowerCase();
    const visualTokens = _countMatches(lower, [
        'skin', 'eyes', 'hair', 'face', 'clothing', 'architecture',
        'signage', 'latin alphabet', 'street', 'light', 'palette',
        'background', 'city', 'studio', 'european', 'mediterranean',
        'french', 'spanish', 'text',
    ]);

    if (_containsAny(lower, ['portrait', 'person', 'woman', 'man', 'face', 'headshot', 'editorial portrait'])
        && visualTokens < 4) {
        return 'Prompt portrait peu spécifique : ajoutez des traits visibles pour contrôler la représentation.';
    }

    if (_containsAny(lower, ['city street', 'landscape', 'poster', 'cinematic scene', 'urban', 'architecture', 'restaurant', 'station', 'hospital'])
        && visualTokens < 4) {
        return 'Décor peu spécifique : ajoutez une géographie visuelle, une architecture, des vêtements et une typographie cohérents.';
    }

    return '';
}

function _containsAny(value, tokens) {
    return tokens.some(token => value.includes(token));
}

function _countMatches(value, tokens) {
    return tokens.reduce((count, token) => value.includes(token) ? count + 1 : count, 0);
}

function _setStatus(message) {
    if (_statusEl) _statusEl.textContent = message;
}

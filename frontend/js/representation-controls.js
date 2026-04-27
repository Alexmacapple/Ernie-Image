const MAX_PROMPT_LENGTH = 8000;
const VISUAL_ANCHOR_PREFIX = 'Visual anchor:';
const DEFAULT_VISUAL_ANCHOR_TEXT = 'coherent visible traits when characters are present, clearly described clothing and setting, Latin alphabet signage and exact text as written, consistent architecture, lighting and color palette';

export const VISUAL_ANCHOR_PRESETS = [
    {
        id: 'portrait-mediterranean',
        label: 'Portrait méditerranéen ibérique contemporain',
        text: 'contemporary Iberian Mediterranean portrait, Spanish or southern French adult, olive to warm light skin tone, dark brown wavy hair, hazel or brown eyes, oval face, straight or softly arched nose, natural Iberian facial proportions, modern Madrid or Valencia clothing, warm window daylight, realistic editorial photography',
    },
    {
        id: 'portrait-western-european',
        label: 'Portrait européen occidental naturel',
        text: 'contemporary Western European portrait, fair to light skin tone, light brown or dark blond hair, blue, green or hazel eyes, oval or square face, defined brow, straight nose, natural Western European facial proportions, understated modern European clothing, neutral studio background, realistic photography',
    },
    {
        id: 'portrait-afro-caribbean',
        label: 'Portrait afro-caribéen éditorial',
        text: 'Afro-Caribbean editorial portrait, deep warm brown skin tone, natural coiled or curly hair texture, dark brown eyes, defined cheekbones, full lips, natural facial proportions, contemporary elegant clothing, soft studio light, realistic editorial photography',
    },
    {
        id: 'portrait-latin-american',
        label: 'Portrait latino-méditerranéen contemporain',
        text: 'contemporary Latin Mediterranean portrait, warm tan skin tone, dark brown hair, brown or hazel eyes, expressive natural face, soft cheekbones, straight or gently curved nose, modern urban clothing, European or Latin city background, soft daylight, realistic photography',
    },
    {
        id: 'setting-european-urban',
        label: 'Rue européenne en alphabet latin',
        text: 'contemporary European street scene, Latin alphabet street signs and storefronts, stone or plaster facades, compact sidewalks, European cars and street furniture, modern European clothing, natural city daylight, realistic architecture',
    },
    {
        id: 'setting-iberian-mediterranean',
        label: 'Décor ibérique Madrid-Valence',
        text: 'Iberian Mediterranean setting, Madrid or Valencia architecture, ceramic tiles, wrought iron balconies, painted plaster walls, saturated red, turquoise and saffron palette, Spanish Latin alphabet signs, warm late afternoon daylight',
    },
    {
        id: 'setting-french-public',
        label: 'Institution publique française contemporaine',
        text: 'contemporary French public institution interior, French Latin alphabet signage, Marianne-inspired civic colors, sober administrative furniture, glass partitions, waiting area chairs, modern European public service setting, neutral daylight',
    },
    {
        id: 'setting-french-poster',
        label: 'Affiche française typographie latine',
        text: 'French poster design, exact French text in Latin alphabet, European cinema typography, clean readable lettering, accents preserved, balanced composition, controlled graphic palette, print poster layout',
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
    if (!parts.length) parts.push(DEFAULT_VISUAL_ANCHOR_TEXT);

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

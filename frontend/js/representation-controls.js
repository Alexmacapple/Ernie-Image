const MAX_PROMPT_LENGTH = 8000;
const VISUAL_ANCHOR_PREFIX = 'Visual anchor:';
const DEFAULT_VISUAL_ANCHOR_TEXT = 'coherent visible traits when characters are present, clearly described clothing and setting, Latin alphabet signage and exact text as written, consistent architecture, lighting and color palette';

export const VISUAL_ANCHOR_PRESETS = [
    {
        id: 'portrait-mediterranean',
        label: 'Méditerranéen ibérique',
        text: 'contemporary Iberian Mediterranean editorial portrait, Spanish or southern French adult, olive to warm light skin tone, dark brown wavy hair, hazel or brown eyes, oval face, softly arched brows, straight or softly arched nose, subtle cheekbones, contemporary Madrid or Valencia clothing, plaster wall or tiled interior, Latin alphabet signage, warm window daylight, realistic photography',
    },
    {
        id: 'portrait-western-european',
        label: 'Europe occidentale',
        text: 'contemporary Western European editorial portrait, French, Belgian or Dutch adult, fair to light skin tone, light brown or dark blond hair, blue, green or hazel eyes, oval or square face, defined brow, straight nose, natural skin texture, understated wool or cotton clothing, neutral studio or European apartment background, cool soft daylight, realistic photography',
    },
    {
        id: 'portrait-afro-caribbean',
        label: 'Afro-caribéen',
        text: 'Afro-Caribbean editorial portrait, French Caribbean or Caribbean adult, deep warm brown skin tone, natural coiled or curly hair texture, dark brown eyes, defined cheekbones, full lips, natural skin texture, contemporary elegant clothing, matte studio backdrop or tropical-modern interior, soft key light, realistic editorial photography',
    },
    {
        id: 'portrait-latin-american',
        label: 'Latino-méditerranéen',
        text: 'contemporary Latin Mediterranean editorial portrait, Latin American or southern European adult, warm tan to olive skin tone, dark brown hair, brown or hazel eyes, expressive natural face, soft cheekbones, straight or gently curved nose, contemporary urban clothing, Madrid, Marseille or Latin city background with Latin alphabet signage, soft daylight, realistic photography',
    },
    {
        id: 'setting-european-urban',
        label: 'Rue européenne',
        text: 'contemporary Western European street scene, Latin alphabet storefronts and street signs, stone or plaster facades, compact sidewalks, compact European cars, EU-style license plates, bus stop signage, cafe awnings, restrained street furniture, neutral daylight, realistic architecture, controlled natural color palette',
    },
    {
        id: 'setting-iberian-mediterranean',
        label: 'Ville ibérique',
        text: 'Iberian Mediterranean city setting, Madrid or Valencia street, ceramic azulejo tiles, wrought iron balconies, painted plaster walls, compact stone pavement, orange trees or potted plants, Spanish Latin alphabet street signs and shopfront lettering, cafe tables, saturated red, turquoise and saffron palette, warm shop-window or late afternoon light',
    },
    {
        id: 'setting-french-public',
        label: 'Institution française',
        text: 'contemporary French public service interior, French Latin alphabet signage, Marianne-inspired civic colors, reception counter, glass partitions, queue ticket display, paper forms, waiting chairs, blue-white-red civic notice board, sober administrative furniture, neutral daylight, clean realistic composition',
    },
    {
        id: 'setting-french-poster',
        label: 'Affiche en français',
        text: 'French poster design, exact French text in Latin alphabet, accents preserved, clean readable lettering, European cinema typography, printed paper grain, balanced title area, controlled red, blue, cream and black palette, clear hierarchy, poster layout',
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

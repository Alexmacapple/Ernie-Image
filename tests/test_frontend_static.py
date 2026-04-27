"""Tests statiques des contrats frontend."""

from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]


def _read(relative_path: str) -> str:
    return (ROOT / relative_path).read_text(encoding="utf-8")


def test_gallery_module_uses_one_cache_buster():
    app = _read("frontend/js/app.js")
    generator = _read("frontend/js/generator.js")
    gallery = _read("frontend/js/gallery.js")
    index = _read("frontend/index.html")
    status_footer = _read("frontend/js/status-footer.js")

    assert "gallery.js?v=20260427-gallery-pagination" not in generator
    assert "app.js?v=20260427-gallery-pagination" not in index
    assert "20260427-gallery-pagination" not in status_footer
    assert "seed-workflow.js?v=20260427-lightbox-nav" in app
    assert "seed-workflow.js?v=20260427-lightbox-nav" in generator
    assert "seed-workflow.js?v=20260427-lightbox-nav" in gallery
    assert "openImageLightbox, refresh as refreshGallery" in generator
    assert "gallery.js?v=20260427-lightbox-nav" in generator
    assert 'src="./js/app.js?v=20260427-prd114-v1b"' in index
    assert "representation-controls.js?v=20260427-prd114-v1b" in app


def test_frontend_uses_keycloak_auth_gate():
    app = _read("frontend/js/app.js")
    api_client = _read("frontend/js/api-client.js")
    auth = _read("frontend/js/auth.js")
    gallery = _read("frontend/js/gallery.js")
    generator = _read("frontend/js/generator.js")
    index = _read("frontend/index.html")

    assert "login-screen" in index
    assert "app-screen" in index
    assert "login-form" in index
    assert "logout-btn" in index
    assert "Se connecter" in index
    assert "Se déconnecter" in index
    assert "fr-header__tools" in index
    assert "fr-header__tools-links" in index
    assert "fr-header__menu-links" not in index
    assert "header-actions" not in index
    assert "isAuthenticated" in app
    assert "login(usernameInput.value.trim(), passwordInput.value)" in app
    assert "'Authorization': `Bearer ${getAccessToken()}`" in api_client
    assert "refreshAccessToken" in api_client
    assert "forceLogout" in api_client
    assert "er_access_token" in auth
    assert "/api/auth/login" in auth
    assert "authenticatedUrl(img.url)" in gallery
    assert "authenticatedUrl(url)" in generator


def test_gallery_page_size_is_three_rows():
    gallery = _read("frontend/js/gallery.js")
    outputs = _read("routers/outputs.py")

    assert "const PAGE_SIZE = 18;" in gallery
    assert "page_size = page_size or 18" in outputs


def test_manual_seed_input_updates_badge_state():
    seed_workflow = _read("frontend/js/seed-workflow.js")

    assert "const MAX_SEED = 2 ** 31 - 1;" in seed_workflow
    assert "_seedEl.addEventListener('input', _syncManualSeedMode)" in seed_workflow
    assert "_seedEl.addEventListener('change', _syncManualSeedMode)" in seed_workflow
    assert "_mode = _seedEl.value.trim() === '' ? 'exploration' : 'raffinement';" in seed_workflow
    assert "Number.isInteger(n) && n >= 0 && n <= MAX_SEED" in seed_workflow


def test_prompt_error_is_only_linked_when_invalid():
    index = _read("frontend/index.html")
    generator = _read("frontend/js/generator.js")

    assert 'placeholder="[Type] ... [Sujet] ... [Composition] ... [Lumière] ... [Texture] ... [Texte] ..."' in index
    assert 'aria-describedby="prompt-counter"' in index
    assert 'aria-describedby="prompt-error' not in index
    assert "Le prompt ne peut pas être vide" not in index
    assert "prompt-error" not in index
    assert "prompt-error" not in generator
    assert "function _resetPromptField()" in generator
    assert "promptEl.value = ''" in generator
    assert "_resetPromptField();" in generator
    assert "_clearPromptError();" in generator


def test_hidden_elements_are_really_hidden():
    css = _read("frontend/css/app.css")

    assert "[hidden]" in css
    assert "display: none !important;" in css


def test_main_headings_are_semantic():
    index = _read("frontend/index.html")
    css = _read("frontend/css/app.css")
    app = _read("frontend/js/app.js")
    prompt_accordion = _read("frontend/js/prompt-accordion.js")

    assert '<h1 class="fr-h2 fr-mb-4w">Générer une image</h1>' in index
    assert "Générer une image avec ERNIE-Image Turbo" not in index
    assert 'class="fr-accordions-group fr-mb-3w" data-fr-group="false"' in index
    assert '<section class="fr-accordion">' in index
    assert '<h2 class="fr-accordion__title">' in index
    assert 'id="prompt-structure-button"' in index
    assert 'aria-expanded="false" aria-controls="prompt-structure-panel"' in index
    assert 'data-ernie-accordion-fallback' in index
    assert 'id="prompt-structure-panel" role="region"' in index
    assert 'aria-labelledby="prompt-structure-button"' in index
    assert "Aide à la structure du prompt" in index
    assert '<h3 class="fr-h4 fr-mb-3w" id="gallery-title">Historique</h3>' in index
    assert 'href="./css/app.css?v=20260427-prd114-v1b"' in index
    assert "Structure recommandée pour décrire l’image" in index
    assert "illustration éditoriale ..." in index
    assert "ambiance, contraste ..." in index
    assert "style typographique" in index
    assert "illustration éditoriale…" not in index
    assert "backlight…" not in index
    assert "style typo</li>" not in index
    assert "initPromptAccordionFallback" in app
    assert "querySelectorAll('[data-ernie-accordion-fallback]')" in prompt_accordion
    assert "fr-collapse--expanded" in prompt_accordion
    assert "aria-expanded" in prompt_accordion
    assert "function syncPanelHeight()" in prompt_accordion
    assert "panel.style.maxHeight = `${panel.scrollHeight}px`;" in prompt_accordion
    assert "new MutationObserver(() => syncPanelHeight())" in prompt_accordion
    assert "attributeFilter: ['aria-expanded']" in prompt_accordion
    assert "attributeFilter: ['class', 'style']" in prompt_accordion
    assert "window.addEventListener('resize'" in prompt_accordion
    assert "#prompt-structure-panel.fr-collapse--expanded" not in css
    assert "max-height: none;" not in css


def test_prd114_visual_representation_controls_are_compact_and_positive():
    app = _read("frontend/js/app.js")
    index = _read("frontend/index.html")
    css = _read("frontend/css/app.css")
    prompt_accordion = _read("frontend/js/prompt-accordion.js")
    representation = _read("frontend/js/representation-controls.js")

    assert "initRepresentationControls" in app
    assert 'src="./js/app.js?v=20260427-prd114-v1b"' in index
    assert "representation-controls.js?v=20260427-prd114-v1b" in app
    assert "Représentation visuelle" in index
    assert 'id="visual-representation-button"' in index
    assert 'aria-expanded="false" aria-controls="visual-representation-panel"' in index
    assert 'id="visual-representation-panel" role="region"' in index
    assert 'aria-labelledby="visual-representation-button"' in index
    assert 'id="visual-anchor-warning"' in index
    assert 'aria-live="polite"' in index
    assert 'id="visual-anchor-help"' in index
    assert 'id="visual-anchor-custom"' in index
    assert 'id="visual-anchor-apply"' in index
    assert 'aria-describedby="visual-anchor-help visual-anchor-status"' in index
    assert "Le bouton ajoute un ancrage générique si aucun preset n'est sélectionné." in index
    assert "Ajouter un ancrage visuel en anglais" in index
    assert index.count("data-visual-anchor-preset") == 8
    assert "Portraits" in index
    assert "Décors et texte" in index
    assert "Prompt Enhancer" not in index
    assert "negative_prompt" not in index
    assert "use_pe" not in index

    assert "export const VISUAL_ANCHOR_PRESETS = [" in representation
    assert representation.count("id: '") == 8
    assert "MAX_PROMPT_LENGTH = 8000" in representation
    assert "DEFAULT_VISUAL_ANCHOR_TEXT" in representation
    assert "if (!parts.length) parts.push(DEFAULT_VISUAL_ANCHOR_TEXT);" in representation
    assert "Visual anchor:" in representation
    assert "buildVisualIdentityBlock" in representation
    assert "function _replaceVisualAnchorBlock(prompt, block)" in representation
    assert "startsWith(VISUAL_ANCHOR_PREFIX)" in representation
    assert "dispatchEvent(new Event('input', { bubbles: true }))" in representation
    assert "dispatchEvent(new Event('change', { bubbles: true }))" in representation
    assert "Choisissez un preset ou saisissez" not in representation
    assert "innerHTML" not in representation
    assert "not Asian" not in representation
    assert "no Asian" not in representation
    assert "avoid Asian" not in representation
    assert "Chinese characters" not in representation

    assert ".visual-representation-content" in css
    assert ".visual-anchor-groups" in css
    assert ".visual-anchor-preset[aria-pressed=\"true\"]" in css
    assert ".visual-anchor-preset--selected" in css
    assert "querySelectorAll('[data-ernie-accordion-fallback]')" in prompt_accordion


def test_footer_uses_dsfr_component_structure_with_existing_links_only():
    index = _read("frontend/index.html")
    css = _read("frontend/css/app.css")

    assert '<footer role="contentinfo" class="fr-footer fr-mt-4w status-footer">' in index
    assert "fr-footer--slim" not in index
    assert "fr-footer__body" in index
    assert "fr-footer__brand fr-enlarge-link" in index
    assert "fr-footer__content" in index
    assert "fr-footer__content-desc" in index
    assert "fr-footer__bottom" in index
    assert "fr-footer__bottom-list" in index
    assert "footer-health-btn" in index
    assert index.count("fr-footer__bottom-item") == 3
    assert index.count("fr-footer__bottom-link") == 3
    assert "/api/health" in index
    assert "/api/status" in index
    assert "info.gouv.fr" not in index
    assert "service-public.gouv.fr" not in index
    assert "legifrance.gouv.fr" not in index
    assert "data.gouv.fr" not in index
    assert "status-footer-row" not in index
    assert ".status-footer-row" not in css
    assert ".status-footer-links" not in css


def test_prompt_templates_are_not_exposed_in_frontend():
    app = _read("frontend/js/app.js")
    index = _read("frontend/index.html")
    css = _read("frontend/css/app.css")

    assert "templates.js" not in app
    assert "initTemplates" not in app
    assert "templates-btn" not in index
    assert "templates-panel" not in index
    assert "templates-list" not in index
    assert "Templates de prompts" not in index
    assert "templates-panel" not in css
    assert "template-item-btn" not in css
    assert not (ROOT / "frontend/js/templates.js").exists()


def test_generation_progress_shows_resolved_seed():
    generator = _read("frontend/js/generator.js")

    assert "seed: event.seed" in generator
    assert "Seed ${event.seed}" in generator


def test_interrupted_generation_stream_is_recovered_from_history():
    generator = _read("frontend/js/generator.js")
    api_client = _read("frontend/js/api-client.js")
    outputs = _read("routers/outputs.py")

    assert "client_request_id: _newClientRequestId()" in generator
    assert "_recoverFromInterruptedStream(err)" in generator
    assert "_pollRecoveredOutput(token)" in generator
    assert "item.client_request_id === _activeRequest.clientRequestId" in generator
    assert "item.client_request_id) return false" in generator
    assert "item.created_at >= _activeRequest.startedAt - 5" in generator
    assert "startedAt: Math.floor(Date.now() / 1000)" in generator
    assert "/api/outputs?page=1&page_size=100" in generator
    assert "console.warn('[ernie] recovery polling failed', err)" in generator
    assert "Connexion interrompue" in generator
    assert "fr-alert--${type}" in generator
    assert "'warning'" in generator
    assert "'success'" in generator
    assert "terminalEventReceived" in api_client
    assert "Connexion interrompue avant la fin du flux." in api_client
    assert '"client_request_id": meta.get("client_request_id")' in outputs


def test_prompt_counter_uses_dsfr_text_tokens():
    css = _read("frontend/css/app.css")

    assert "--error-main-525" not in css
    assert "--warning-main-525" not in css
    assert "--success-main-525" not in css
    assert "var(--text-default-error)" in css
    assert "var(--text-default-warning)" in css
    assert "var(--text-default-success)" in css


def test_lightbox_locks_page_scroll_and_scrolls_overlay():
    index = _read("frontend/index.html")
    css = _read("frontend/css/app.css")
    gallery = _read("frontend/js/gallery.js")

    assert 'role="dialog"' in index
    assert 'aria-modal="true"' in index
    assert 'tabindex="-1"' in index
    assert 'id="lightbox-prompt-copy"' in index
    assert 'id="lightbox-prev"' in index
    assert 'id="lightbox-next"' in index
    assert 'id="lightbox-position" class="lightbox-position" aria-live="polite" aria-atomic="true"' in index
    assert 'aria-keyshortcuts="ArrowLeft"' in index
    assert 'aria-keyshortcuts="ArrowRight"' in index
    assert 'aria-controls="lightbox-image"' in index
    assert "Image précédente" in index
    assert "Image suivante" in index
    assert "Copier le prompt" in index
    assert "background: rgba(0, 0, 0, 0.96);" in css
    assert "background: rgba(0, 0, 0, 0.72);" in css
    assert ".lightbox-stage" in css
    assert ".lightbox-nav" in css
    assert ".lightbox-nav:hover" in css
    assert ".lightbox-nav:focus-visible" in css
    assert ".lightbox-nav:active" in css
    assert ".lightbox-nav:disabled" in css
    assert '.lightbox-nav[aria-disabled="true"]' in css
    assert "background: rgba(255, 255, 255, 0.18) !important;" in css
    assert "color: rgba(255, 255, 255, 0.86) !important;" in css
    assert "opacity: 1;" in css
    assert ".lightbox-position" in css
    assert ".lightbox-prompt-copy" in css
    assert "overflow-y: auto;" in css
    assert "overscroll-behavior: contain;" in css
    assert "body.lightbox-scroll-locked" in css
    assert "position: fixed;" in css
    assert "max-height: 65dvh;" in css
    assert "function _lockPageScroll()" in gallery
    assert "function _unlockPageScroll()" in gallery
    assert "document.body.classList.add('lightbox-scroll-locked')" in gallery
    assert "document.body.classList.remove('lightbox-scroll-locked')" in gallery
    assert "lightbox.scrollTop = 0;" in gallery
    assert "let previousFocus = null;" in gallery
    assert "function _trapLightboxFocus(e)" in gallery
    assert "e.key !== 'Tab'" in gallery
    assert "previousFocus.focus({ preventScroll: true })" in gallery
    assert "window.addEventListener('pagehide'" in gallery
    assert "window.addEventListener('popstate'" in gallery
    assert "const lbPromptCopy = document.getElementById('lightbox-prompt-copy')" in gallery
    assert "const lbPrev     = document.getElementById('lightbox-prev')" in gallery
    assert "const lbNext     = document.getElementById('lightbox-next')" in gallery
    assert "let currentImages = [];" in gallery
    assert "function _syncLightboxNavigation()" in gallery
    assert "Image ${position.absolute} sur ${currentTotal} dans l’historique" in gallery
    assert "aria-disabled" in gallery
    assert "e.key === 'ArrowLeft'" in gallery
    assert "e.key === 'ArrowRight'" in gallery
    assert "async function _navigateLightbox(direction)" in gallery
    assert "await refresh(targetPage)" in gallery
    assert "function _copyPrompt()" in gallery
    assert "await _writeClipboardText(currentImage.prompt)" in gallery
    assert "Prompt copié" in gallery


def test_owned_text_files_do_not_use_em_or_en_dashes():
    excluded_parts = {
        ".git",
        ".pytest_cache",
        ".venv",
        "frontend/dsfr",
        "models",
        "outputs",
        "vendor",
    }
    suffixes = {".css", ".html", ".js", ".md", ".MD", ".py", ".sh"}
    offenders = []

    for path in ROOT.rglob("*"):
        relative = path.relative_to(ROOT).as_posix()
        if any(part in relative for part in excluded_parts):
            continue
        if not path.is_file() or path.suffix not in suffixes:
            continue
        text = path.read_text(encoding="utf-8")
        if "\u2014" in text or "\u2013" in text:
            offenders.append(relative)

    assert offenders == []

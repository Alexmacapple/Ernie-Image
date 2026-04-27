export function initPromptAccordionFallback() {
    const buttons = document.querySelectorAll('[data-ernie-accordion-fallback]');
    buttons.forEach(_initAccordionButton);
}

function _initAccordionButton(button) {
    if (button.dataset.ernieAccordionReady === 'true') return;
    button.dataset.ernieAccordionReady = 'true';

    const panelId = button.getAttribute('aria-controls');
    const panel = panelId ? document.getElementById(panelId) : null;
    if (!panel) return;

    let isSyncing = false;

    function syncPanelHeight() {
        if (isSyncing) return;
        isSyncing = true;
        window.requestAnimationFrame(() => {
            const isExpanded = button.getAttribute('aria-expanded') === 'true';
            panel.classList.toggle('fr-collapse--expanded', isExpanded);
            if (isExpanded) {
                panel.style.maxHeight = `${panel.scrollHeight}px`;
                panel.style.overflow = 'hidden';
            } else {
                panel.style.maxHeight = '';
                panel.style.overflow = '';
            }
            isSyncing = false;
        });
    }

    button.addEventListener('click', () => {
        const wasExpanded = button.getAttribute('aria-expanded') === 'true';

        window.setTimeout(() => {
            const isExpanded = button.getAttribute('aria-expanded') === 'true';
            if (isExpanded === wasExpanded) {
                button.setAttribute('aria-expanded', String(!wasExpanded));
            }
            syncPanelHeight();
        }, 0);
    });

    const observer = new MutationObserver(() => syncPanelHeight());
    observer.observe(button, { attributes: true, attributeFilter: ['aria-expanded'] });
    observer.observe(panel, { attributes: true, attributeFilter: ['class', 'style'] });

    window.addEventListener('resize', () => {
        if (button.getAttribute('aria-expanded') === 'true') syncPanelHeight();
    });
}

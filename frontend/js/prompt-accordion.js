export function initPromptAccordionFallback() {
    const button = document.querySelector('[data-ernie-accordion-fallback]');
    if (!button) return;

    const panelId = button.getAttribute('aria-controls');
    const panel = panelId ? document.getElementById(panelId) : null;
    if (!panel) return;

    button.addEventListener('click', () => {
        const wasExpanded = button.getAttribute('aria-expanded') === 'true';

        window.setTimeout(() => {
            const isExpanded = button.getAttribute('aria-expanded') === 'true';
            if (isExpanded !== wasExpanded) return;

            const next = !wasExpanded;
            button.setAttribute('aria-expanded', String(next));
            panel.classList.toggle('fr-collapse--expanded', next);
        }, 0);
    });
}

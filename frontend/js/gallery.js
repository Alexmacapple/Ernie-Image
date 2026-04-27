import { apiDelete, apiGet } from './api-client.js?v=20260427-lightbox-nav';
import { authenticatedUrl } from './auth.js?v=20260427-auth';
import { lockSeed } from './seed-workflow.js?v=20260427-lightbox-nav';

const grid       = document.getElementById('gallery-grid');
const loading    = document.getElementById('gallery-loading');
const empty      = document.getElementById('gallery-empty');
const summary    = document.getElementById('gallery-summary');
const errorBox   = document.getElementById('gallery-error');
const errorDetail = document.getElementById('gallery-error-detail');
const pagination = document.getElementById('gallery-pagination');
const paginationList = pagination.querySelector('.fr-pagination__list');
const lightbox   = document.getElementById('lightbox');
const lbImage    = document.getElementById('lightbox-image');
const lbCaption  = document.getElementById('lightbox-caption');
const lbPosition = document.getElementById('lightbox-position');
const lbPrompt   = document.getElementById('lightbox-prompt');
const lbSeed     = document.getElementById('lb-seed');
const lbSteps    = document.getElementById('lb-steps');
const lbDims     = document.getElementById('lb-dims');
const lbDownload = document.getElementById('lightbox-download');
const lbDelete   = document.getElementById('lightbox-delete');
const lbSeedPaste = document.getElementById('lightbox-seed-paste');
const lbPromptCopy = document.getElementById('lightbox-prompt-copy');
const lbPrev     = document.getElementById('lightbox-prev');
const lbNext     = document.getElementById('lightbox-next');
const lbClose    = document.getElementById('lightbox-close');
const seedInput   = document.getElementById('seed');

const resultSection  = document.getElementById('result-section');
const resultImage    = document.getElementById('result-image');
const resultDownload = document.getElementById('result-download');

const EMPTY_IMAGE_SRC = 'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///ywAAAAAAQABAAACAUwAOw==';
const PAGE_SIZE = 18;
const FOCUSABLE_SELECTOR = [
    'a[href]',
    'button:not([disabled])',
    'input:not([disabled])',
    'select:not([disabled])',
    'textarea:not([disabled])',
    '[tabindex]:not([tabindex="-1"])',
].join(',');

let currentImage = null;
let currentImages = [];
let currentPage = 1;
let currentTotalPages = 1;
let currentPageSize = PAGE_SIZE;
let currentTotal = 0;
let onLightboxKey = null;
let lightboxScrollY = 0;
let previousFocus = null;
let promptCopyResetTimer = null;
let lightboxNavLoading = false;

function _lockPageScroll() {
    if (document.body.classList.contains('lightbox-scroll-locked')) return;
    lightboxScrollY = window.scrollY;
    document.body.classList.add('lightbox-scroll-locked');
    document.body.style.top = `-${lightboxScrollY}px`;
}

function _unlockPageScroll() {
    if (!document.body.classList.contains('lightbox-scroll-locked')) return;
    document.body.classList.remove('lightbox-scroll-locked');
    document.body.style.top = '';
    window.scrollTo(0, lightboxScrollY);
}

function _lightboxFocusableElements() {
    return Array.from(lightbox.querySelectorAll(FOCUSABLE_SELECTOR))
        .filter(el => !el.closest('[hidden]') && el.getAttribute('aria-hidden') !== 'true');
}

function _trapLightboxFocus(e) {
    if (lightbox.hidden || e.key !== 'Tab') return;

    const focusable = _lightboxFocusableElements();
    if (!focusable.length) {
        e.preventDefault();
        lightbox.focus();
        return;
    }

    const first = focusable[0];
    const last = focusable[focusable.length - 1];
    const active = document.activeElement;

    if (e.shiftKey && (active === first || !lightbox.contains(active))) {
        e.preventDefault();
        last.focus();
    } else if (!e.shiftKey && active === last) {
        e.preventDefault();
        first.focus();
    }
}

function _setPromptCopyButton(label = 'Copier le prompt') {
    lbPromptCopy.textContent = label;
    if (currentImage?.prompt) {
        lbPromptCopy.disabled = false;
        lbPromptCopy.title = `Copier le prompt de ${currentImage.filename}`;
        lbPromptCopy.setAttribute('aria-label', `${label} - ${currentImage.filename}`);
    } else {
        lbPromptCopy.disabled = true;
        lbPromptCopy.title = 'Aucun prompt à copier';
        lbPromptCopy.setAttribute('aria-label', `${label} - aucun prompt disponible`);
    }
}

function _currentImageIndex() {
    if (!currentImage) return -1;
    return currentImages.findIndex(img => img.filename === currentImage.filename);
}

function _lightboxPosition() {
    const index = _currentImageIndex();
    if (index < 0 || currentTotal === 0) return null;
    return {
        index,
        absolute: ((currentPage - 1) * currentPageSize) + index + 1,
    };
}

function _setNavButton(button, label, enabled, filename) {
    button.disabled = !enabled || lightboxNavLoading;
    button.setAttribute('aria-disabled', String(button.disabled));
    button.title = enabled && filename ? `${label} - ${filename}` : `${label} indisponible`;
    button.setAttribute('aria-label', enabled && filename ? `${label} - ${filename}` : `${label} indisponible`);
}

function _syncLightboxNavigation() {
    const position = _lightboxPosition();
    const index = position?.index ?? -1;
    const hasPrevious = index >= 0 && (index > 0 || currentPage > 1);
    const hasNext = index >= 0 && (index < currentImages.length - 1 || currentPage < currentTotalPages);
    const previousLabel = index > 0
        ? currentImages[index - 1]?.filename
        : 'page précédente de l’historique';
    const nextLabel = index >= 0 && index < currentImages.length - 1
        ? currentImages[index + 1]?.filename
        : 'page suivante de l’historique';

    if (lightboxNavLoading) {
        lbPosition.textContent = 'Chargement de l’image dans l’historique';
    } else if (position) {
        lbPosition.textContent = `Image ${position.absolute} sur ${currentTotal} dans l’historique`;
    } else {
        lbPosition.textContent = 'Image ouverte hors pagination de l’historique';
    }

    _setNavButton(lbPrev, 'Image précédente', hasPrevious, previousLabel);
    _setNavButton(lbNext, 'Image suivante', hasNext, nextLabel);
}

function _focusLightboxNav(direction) {
    const preferred = direction < 0 ? lbPrev : lbNext;
    const fallback = direction < 0 ? lbNext : lbPrev;
    if (!preferred.disabled) {
        preferred.focus({ preventScroll: true });
    } else if (!fallback.disabled) {
        fallback.focus({ preventScroll: true });
    } else {
        lbClose.focus({ preventScroll: true });
    }
}

export function openImageLightbox(img, options = {}) {
    if (!options.preservePreviousFocus) {
        previousFocus = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    }
    currentImage = img;
    const imageUrl = authenticatedUrl(img.url);
    lbImage.src = imageUrl;
    lbImage.alt = img.prompt ?? img.filename;
    lbCaption.textContent = img.filename;
    lbPrompt.textContent  = img.prompt ? `« ${img.prompt} »` : '';
    lbPrompt.hidden       = !img.prompt;
    lbSeed.textContent    = img.seed  ?? '-';
    lbSteps.textContent   = img.steps ?? '-';
    lbDims.textContent    = img.width && img.height ? `${img.width}×${img.height}` : '-';
    lbDownload.href       = imageUrl;
    lbDownload.download   = img.filename;
    lbDelete.disabled     = false;
    lbSeedPaste.disabled  = _getSeed(img) == null;
    _setPromptCopyButton();
    _syncLightboxNavigation();
    lightbox.hidden = false;
    _lockPageScroll();
    lightbox.scrollTop = 0;
    if (options.focusNav) {
        _focusLightboxNav(options.focusNav);
    } else {
        lbClose.focus();
    }

    if (onLightboxKey) document.removeEventListener('keydown', onLightboxKey);
    onLightboxKey = (e) => {
        if (e.key === 'Escape') {
            _closeLightbox();
            return;
        }
        if (e.key === 'ArrowLeft') {
            e.preventDefault();
            _navigateLightbox(-1);
            return;
        }
        if (e.key === 'ArrowRight') {
            e.preventDefault();
            _navigateLightbox(1);
            return;
        }
        _trapLightboxFocus(e);
    };
    document.addEventListener('keydown', onLightboxKey);
}

function _closeLightbox({ restoreFocus = true } = {}) {
    if (lightbox.hidden) return;
    lightbox.hidden = true;
    lbImage.src = EMPTY_IMAGE_SRC;
    currentImage = null;
    lightboxNavLoading = false;
    lightbox.removeAttribute('aria-busy');
    _unlockPageScroll();
    if (onLightboxKey) {
        document.removeEventListener('keydown', onLightboxKey);
        onLightboxKey = null;
    }
    if (restoreFocus && previousFocus?.isConnected) {
        previousFocus.focus({ preventScroll: true });
    }
    if (promptCopyResetTimer) {
        window.clearTimeout(promptCopyResetTimer);
        promptCopyResetTimer = null;
    }
    _setPromptCopyButton();
    _syncLightboxNavigation();
    previousFocus = null;
}

function _clearGalleryItems() {
    grid.querySelectorAll('.gallery-item').forEach(item => item.remove());
}

function _syncEmptyState(total) {
    empty.hidden = total > 0;
}

function _setLoading(isLoading) {
    loading.hidden = !isLoading;
    if (isLoading) {
        grid.setAttribute('aria-busy', 'true');
        empty.hidden = true;
        errorBox.hidden = true;
        summary.textContent = 'Chargement de l’historique…';
    } else {
        grid.removeAttribute('aria-busy');
    }
}

function _showGalleryError(message) {
    _clearGalleryItems();
    _setLoading(false);
    empty.hidden = true;
    pagination.hidden = true;
    summary.textContent = '';
    errorDetail.textContent = message;
    errorBox.hidden = false;
}

async function _deleteImage(img) {
    if (!confirm(`Supprimer définitivement ${img.filename} ?`)) return;

    lbDelete.disabled = true;
    try {
        await apiDelete(img.url);
        if (resultDownload?.download === img.filename) {
            resultSection.hidden = true;
            resultImage.src = EMPTY_IMAGE_SRC;
            resultDownload.href = '#';
            resultDownload.removeAttribute('download');
        }
        _closeLightbox();
        await refresh(currentPage);
    } catch (err) {
        lbDelete.disabled = false;
        alert(err.message);
    }
}

function _makeIconAction(className, label) {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = `fr-btn fr-btn--sm fr-btn--tertiary-no-outline ${className} gallery-action`;
    button.title = label;
    button.setAttribute('aria-label', label);
    return button;
}

function _downloadImage(img) {
    const link = document.createElement('a');
    link.href = authenticatedUrl(img.url);
    link.download = img.filename;
    link.hidden = true;
    link.textContent = `Télécharger ${img.filename}`;
    document.body.appendChild(link);
    link.click();
    link.remove();
}

function _imageLabel(img) {
    return img.prompt
        ? (img.prompt.length > 48 ? img.prompt.slice(0, 45) + '…' : img.prompt)
        : img.filename.replace(/\.png$/, '');
}

function _getSeed(img) {
    if (img.seed != null) return img.seed;
    return img.filename.match(/_seed(\d+)\.png$/)?.[1] ?? null;
}

function _pasteSeed(img) {
    const seed = _getSeed(img);
    if (seed == null) return;
    lockSeed(seed);
    if (!lightbox.hidden) _closeLightbox();
    seedInput.scrollIntoView({ behavior: 'smooth', block: 'center' });
    seedInput.focus();
}

async function _writeClipboardText(text) {
    if (navigator.clipboard?.writeText) {
        try {
            await navigator.clipboard.writeText(text);
            return;
        } catch {
            // Fallback pour les contextes qui refusent l'API Clipboard.
        }
    }

    const textarea = document.createElement('textarea');
    textarea.value = text;
    textarea.setAttribute('readonly', '');
    textarea.style.position = 'fixed';
    textarea.style.top = '-1000px';
    document.body.appendChild(textarea);
    textarea.select();
    const copied = document.execCommand('copy');
    textarea.remove();
    if (!copied) throw new Error('Impossible de copier le prompt.');
}

async function _copyPrompt() {
    if (!currentImage?.prompt) return;

    try {
        lbPromptCopy.disabled = true;
        await _writeClipboardText(currentImage.prompt);
        _setPromptCopyButton('Prompt copié');
        lbPromptCopy.disabled = true;
        promptCopyResetTimer = window.setTimeout(() => {
            promptCopyResetTimer = null;
            if (!lightbox.hidden) _setPromptCopyButton();
        }, 1600);
    } catch (err) {
        lbPromptCopy.disabled = false;
        alert(err.message || 'Impossible de copier le prompt.');
    }
}

function _setLightboxNavLoading(isLoading) {
    lightboxNavLoading = isLoading;
    if (isLoading) {
        lightbox.setAttribute('aria-busy', 'true');
    } else {
        lightbox.removeAttribute('aria-busy');
    }
    _syncLightboxNavigation();
}

async function _navigateLightbox(direction) {
    if (lightboxNavLoading || !currentImage) return;

    const index = _currentImageIndex();
    if (index < 0) return;

    const targetInPage = currentImages[index + direction];
    if (targetInPage) {
        openImageLightbox(targetInPage, { preservePreviousFocus: true, focusNav: direction });
        return;
    }

    const targetPage = currentPage + direction;
    if (targetPage < 1 || targetPage > currentTotalPages) return;

    _setLightboxNavLoading(true);
    const refreshed = await refresh(targetPage);
    if (!refreshed) {
        _setLightboxNavLoading(false);
        _focusLightboxNav(direction);
        return;
    }
    const targetImage = direction < 0 ? currentImages[currentImages.length - 1] : currentImages[0];
    _setLightboxNavLoading(false);

    if (targetImage) {
        openImageLightbox(targetImage, { preservePreviousFocus: true, focusNav: direction });
    } else {
        _focusLightboxNav(direction);
    }
}

function _renderItem(img) {
    const item = document.createElement('article');
    item.className = 'gallery-item';
    item.dataset.filename = img.filename;

    const openButton = document.createElement('button');
    openButton.type = 'button';
    openButton.className = 'gallery-open';

    const thumb = document.createElement('img');
    thumb.src = authenticatedUrl(img.url);
    thumb.alt = '';
    thumb.setAttribute('aria-hidden', 'true');
    thumb.loading = 'lazy';

    const meta = document.createElement('span');
    meta.className = 'gallery-item-meta';
    const label = _imageLabel(img);
    meta.textContent = label;
    if (img.prompt) meta.title = img.prompt;
    openButton.setAttribute('aria-label', `${label} - afficher l'image`);

    openButton.append(thumb, meta);
    openButton.addEventListener('click', () => openImageLightbox(img));

    const actions = document.createElement('div');
    actions.className = 'gallery-actions';

    const viewButton = _makeIconAction('fr-icon-eye-line', `Afficher ${img.filename}`);
    viewButton.addEventListener('click', () => openImageLightbox(img));

    const downloadButton = _makeIconAction('fr-icon-download-line', `Télécharger ${img.filename}`);
    downloadButton.addEventListener('click', () => _downloadImage(img));

    const seedButton = _makeIconAction('fr-icon-clipboard-line', `Fixer la seed de ${img.filename}`);
    seedButton.disabled = _getSeed(img) == null;
    seedButton.addEventListener('click', () => _pasteSeed(img));

    const deleteButton = _makeIconAction('fr-icon-delete-bin-line', `Supprimer ${img.filename}`);
    deleteButton.addEventListener('click', () => _deleteImage(img));

    actions.append(viewButton, downloadButton, seedButton, deleteButton);
    item.append(openButton, actions);
    return item;
}

function _paginationRange(page, totalPages) {
    if (totalPages <= 7) {
        return Array.from({ length: totalPages }, (_, i) => i + 1);
    }

    const pages = new Set([1, totalPages, page - 1, page, page + 1]);
    const ordered = [...pages]
        .filter(n => n >= 1 && n <= totalPages)
        .sort((a, b) => a - b);

    const range = [];
    let previous = 0;
    for (const n of ordered) {
        if (previous && n - previous > 1) range.push('ellipsis');
        range.push(n);
        previous = n;
    }
    return range;
}

function _makePaginationItem(label, targetPage, className, options = {}) {
    const item = document.createElement('li');
    const link = document.createElement('a');
    link.className = `fr-pagination__link${className ? ` ${className}` : ''}`;
    link.textContent = label;
    link.title = options.title ?? label;

    if (options.current) {
        link.setAttribute('aria-current', 'page');
    } else if (options.disabled) {
        link.setAttribute('aria-disabled', 'true');
        link.setAttribute('role', 'link');
    } else {
        link.href = '#gallery-section';
        link.addEventListener('click', (event) => {
            event.preventDefault();
            refresh(targetPage);
        });
    }

    item.appendChild(link);
    return item;
}

function _makeEllipsisItem() {
    const item = document.createElement('li');
    const span = document.createElement('span');
    span.className = 'fr-pagination__link';
    span.textContent = '…';
    span.setAttribute('aria-hidden', 'true');
    item.appendChild(span);
    return item;
}

function _renderPagination(page, totalPages) {
    paginationList.replaceChildren();
    if (totalPages <= 1) {
        pagination.hidden = true;
        return;
    }

    pagination.hidden = false;
    paginationList.append(
        _makePaginationItem('Première page', 1, 'fr-pagination__link--first', {
            disabled: page === 1,
            title: 'Première page de l’historique',
        }),
        _makePaginationItem('Page précédente', page - 1, 'fr-pagination__link--prev fr-pagination__link--lg-label', {
            disabled: page === 1,
            title: 'Page précédente de l’historique',
        }),
    );

    for (const n of _paginationRange(page, totalPages)) {
        if (n === 'ellipsis') {
            paginationList.appendChild(_makeEllipsisItem());
            continue;
        }
        paginationList.appendChild(_makePaginationItem(String(n), n, '', {
            current: n === page,
            title: n === page ? `Page ${n} - page courante` : `Page ${n}`,
        }));
    }

    paginationList.append(
        _makePaginationItem('Page suivante', page + 1, 'fr-pagination__link--next fr-pagination__link--lg-label', {
            disabled: page === totalPages,
            title: 'Page suivante de l’historique',
        }),
        _makePaginationItem('Dernière page', totalPages, 'fr-pagination__link--last', {
            disabled: page === totalPages,
            title: 'Dernière page de l’historique',
        }),
    );
}

function _renderSummary(page, pageSize, total, count) {
    if (total === 0) {
        summary.textContent = '';
        return;
    }

    const start = (page - 1) * pageSize + 1;
    const end = start + count - 1;
    summary.textContent = `${start}-${end} sur ${total} images`;
}

lbClose.addEventListener('click', _closeLightbox);
lbDelete.addEventListener('click', () => {
    if (currentImage) _deleteImage(currentImage);
});
lbSeedPaste.addEventListener('click', () => {
    if (currentImage) _pasteSeed(currentImage);
});
lbPromptCopy.addEventListener('click', _copyPrompt);
lbPrev.addEventListener('click', () => _navigateLightbox(-1));
lbNext.addEventListener('click', () => _navigateLightbox(1));
lightbox.addEventListener('click', (e) => { if (e.target === lightbox) _closeLightbox(); });
window.addEventListener('pagehide', () => _closeLightbox({ restoreFocus: false }));
window.addEventListener('popstate', () => _closeLightbox({ restoreFocus: false }));

export async function refresh(page = currentPage) {
    _clearGalleryItems();
    _setLoading(true);

    let data;
    try {
        data = await apiGet(`/api/outputs?page=${page}&page_size=${PAGE_SIZE}`);
    } catch (err) {
        _showGalleryError(err.message || 'Impossible de charger les images générées.');
        return false;
    }

    const images = Array.isArray(data) ? data : data.items;
    const total = Array.isArray(data) ? data.length : data.total;
    const pageSize = Array.isArray(data) ? PAGE_SIZE : data.page_size;
    const totalPages = Array.isArray(data) ? Math.max(1, Math.ceil(total / PAGE_SIZE)) : data.total_pages;
    const responsePage = Array.isArray(data) ? page : data.page;

    if (total > 0 && responsePage > totalPages) {
        return refresh(totalPages);
    }

    currentPage = responsePage;
    currentTotalPages = totalPages;
    currentImages = images;
    currentPageSize = pageSize;
    currentTotal = total;
    _setLoading(false);
    errorBox.hidden = true;
    _syncEmptyState(total);
    images.forEach(img => {
        grid.appendChild(_renderItem(img));
    });
    _renderSummary(currentPage, pageSize, total, images.length);
    _renderPagination(currentPage, currentTotalPages);
    return true;
}

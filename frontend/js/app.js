import { apiGet } from './api-client.js?v=20260427-prd112-113';
import { isAuthenticated, login, logout, onAuthStateChange, scheduleTokenRefresh } from './auth.js?v=20260427-auth';
import { loadPresets, enableForm, disableForm } from './generator.js?v=20260427-prd112-113';
import { refresh as refreshGallery } from './gallery.js?v=20260427-prd112-113';
import { updateFooter } from './status-footer.js?v=20260427-prd112-113';
import { initSeedWorkflow } from './seed-workflow.js?v=20260427-prd112-113';
import { initPromptAccordionFallback } from './prompt-accordion.js?v=20260427-prd112-113';

const loginScreen = document.getElementById('login-screen');
const appScreen = document.getElementById('app-screen');
const loginForm = document.getElementById('login-form');
const loginError = document.getElementById('login-error');
const usernameInput = document.getElementById('username-input');
const passwordInput = document.getElementById('password-input');
const logoutBtn = document.getElementById('logout-btn');
const bannerLoading = document.getElementById('banner-loading');
const bannerLoadingDetail = document.getElementById('banner-loading-detail');
const bannerError = document.getElementById('banner-error');
const bannerErrorDetail = document.getElementById('banner-error-detail');

let _pollInterval = null;
let _pollStart = Date.now();
let _appInitialized = false;

async function _checkPipeline() {
    let data;
    try {
        data = await apiGet('/api/status');
    } catch {
        return;
    }

    updateFooter(data);

    if (data.load_error) {
        _stopPolling();
        bannerLoading.hidden = true;
        bannerErrorDetail.textContent = data.load_error;
        bannerError.hidden = false;
        disableForm();
        return;
    }

    if (!data.loaded) {
        const elapsed = data.loading_elapsed_s ?? Math.round((Date.now() - _pollStart) / 1000);
        bannerLoadingDetail.textContent = `Chargement du modèle ERNIE-Image Turbo… ${elapsed}s écoulées`;
        bannerLoading.hidden = false;
        return;
    }

    // Pipeline prêt
    _stopPolling();
    bannerLoading.hidden = true;
    enableForm();
}

function _stopPolling() {
    if (_pollInterval) { clearInterval(_pollInterval); _pollInterval = null; }
}

function _showLogin(message = '') {
    _stopPolling();
    loginScreen.hidden = false;
    appScreen.hidden = true;
    logoutBtn.hidden = true;
    disableForm();
    if (loginError) {
        loginError.textContent = message;
        loginError.hidden = !message;
    }
    usernameInput?.focus();
}

async function _showApp() {
    loginScreen.hidden = true;
    appScreen.hidden = false;
    logoutBtn.hidden = false;

    if (!_appInitialized) {
        _appInitialized = true;
        await _initApp();
    }
}

async function _initApp() {
    disableForm();
    initPromptAccordionFallback();
    initSeedWorkflow();
    await loadPresets();
    await refreshGallery();

    // Vérification initiale immédiate
    await _checkPipeline();

    // Si pas encore prêt, poll toutes les 2s
    const status = await apiGet('/api/status').catch(() => ({ loaded: false }));
    if (!status.loaded) {
        _pollInterval = setInterval(_checkPipeline, 2000);
    }
}

loginForm?.addEventListener('submit', async (event) => {
    event.preventDefault();
    loginError.hidden = true;
    loginError.textContent = '';

    try {
        await login(usernameInput.value.trim(), passwordInput.value);
        passwordInput.value = '';
        await _showApp();
    } catch (err) {
        loginError.textContent = err.message || 'Echec de connexion';
        loginError.hidden = false;
    }
});

logoutBtn?.addEventListener('click', async () => {
    await logout();
    _showLogin();
});

onAuthStateChange((authenticated) => {
    if (!authenticated) _showLogin();
});

window.addEventListener('er-force-logout', (event) => {
    _showLogin(event.detail?.message || 'Session expiree, reconnectez-vous.');
});

if (isAuthenticated()) {
    scheduleTokenRefresh();
    _showApp();
} else {
    _showLogin();
}

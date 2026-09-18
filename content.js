// ─── Extension context guard ─────────────────────────────────────────────────
function isCtxValid() {
    try { return !!chrome.runtime?.id; } catch (e) { return false; }
}

// ─── CSS Injector ────────────────────────────────────────────────────────────
function injectCSS(file) {
    const id = 'yt-premium-css-' + file.replace(/[^a-z0-9]/gi, '-');
    if (document.getElementById(id)) return;
    const link = document.createElement('link');
    link.id = id;
    link.href = chrome.runtime.getURL(file);
    link.type = 'text/css';
    link.rel = 'stylesheet';
    (document.head || document.documentElement).appendChild(link);
}

// ── Inject features.css ──
injectCSS('features.css');

// ─── Premium Logo ─────────────────────────────────────────────────────────────
let _premiumEnabled = false;

function applyPremiumLogo(enabled) {
    _premiumEnabled = enabled;
    if (enabled) {
        document.body.classList.add('yt-pro-premium');
    } else {
        document.body.classList.remove('yt-pro-premium');
    }
}

document.addEventListener('yt-navigate-finish', () => {
    if (_premiumEnabled) document.body.classList.add('yt-pro-premium');
});

// ─── Shorts Auto-Scroller ─────────────────────────────────────────────────────
let autoScrollInterval = null;
let _navigateListenerAdded = false;

function getShortsActiveVideo() {
    const activeRenderer = document.querySelector('ytd-reel-video-renderer[is-active]');
    if (activeRenderer) {
        const v = activeRenderer.querySelector('video');
        if (v && v.readyState > 2) return v;
    }
    return Array.from(document.querySelectorAll('video'))
        .find(v => !v.paused && v.readyState > 2) || null;
}

function forceDisableLoop(video) {
    if (!video || !video.loop) return;
    video.loop = false;
}

function initAutoScroll() {
    if (autoScrollInterval) clearInterval(autoScrollInterval);

    if (!_navigateListenerAdded) {
        _navigateListenerAdded = true;
        document.addEventListener('yt-navigate-finish', () => {
            if (!window.location.pathname.includes('/shorts/')) return;
            [0, 100, 300, 600, 1000].forEach(delay => {
                setTimeout(() => {
                    const v = getShortsActiveVideo() ||
                        document.querySelector('ytd-reel-video-renderer[is-active] video') ||
                        document.querySelector('ytd-shorts video');
                    if (v) forceDisableLoop(v);
                }, delay);
            });
        });
    }

    autoScrollInterval = setInterval(() => {
        if (!window.location.pathname.includes('/shorts/')) return;

        const activeVideo = getShortsActiveVideo();
        if (!activeVideo) return;

        forceDisableLoop(activeVideo);

        if (activeVideo.duration > 0 && (activeVideo.duration - activeVideo.currentTime) < 0.4) {
            const nextBtn =
                document.querySelector('ytd-reel-video-renderer[is-active] #navigation-button-down button') ||
                document.querySelector('#navigation-button-down ytd-button-renderer button') ||
                document.querySelector('#navigation-button-down button');

            if (nextBtn) {
                activeVideo.currentTime = 0;
                nextBtn.click();
            } else {
                window.scrollBy({ top: window.innerHeight, behavior: 'smooth' });
            }
        }
    }, 200);
}

// ─── Initialise on load ──────────────────────────────────────────────────────
if (isCtxValid()) chrome.storage.local.get(['masterEnabled', 'premium', 'autoscroll'], (result) => {
    if (result.masterEnabled === false) return;

    applyPremiumLogo(result.premium !== false);

    if (result.autoscroll !== false) initAutoScroll();
});

// ─── Message Listener ─────────────────────────────────────────────────────────
if (isCtxValid()) chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === 'masterToggleChanged') {
        if (!request.state) {
            applyPremiumLogo(false);
            if (autoScrollInterval) { clearInterval(autoScrollInterval); autoScrollInterval = null; }
        } else {
            location.reload();
        }
        return;
    }

    if (request.action === 'togglepremium') {
        applyPremiumLogo(request.state);
    } else if (request.action === 'toggleautoscroll') {
        if (request.state) {
            initAutoScroll();
        } else {
            if (autoScrollInterval) { clearInterval(autoScrollInterval); autoScrollInterval = null; }
        }
    }
});

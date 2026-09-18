document.addEventListener('DOMContentLoaded', () => {
    const vl = document.getElementById('ext-version-label');
    if (vl) { const m = chrome.runtime.getManifest(); vl.textContent = 'v' + m.version; }

    // ── Popup open/close video pause ────────────────────────────────────────
    let _ytTabId = null;

    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        if (tabs[0] && tabs[0].url && tabs[0].url.includes('youtube.com')) {
            _ytTabId = tabs[0].id;
            chrome.tabs.sendMessage(_ytTabId, { action: 'pauseForPopup' }).catch(() => {});
        }
    });

    window.addEventListener('pagehide', () => {
        if (_ytTabId !== null) {
            chrome.tabs.sendMessage(_ytTabId, { action: 'resumeAfterPopup' }).catch(() => {});
        }
    });

    // ── Features to manage ──────────────────────────────────────────────────
    // All 4 features default to ON (result[toggle] !== false).
    // A fresh install will have all toggles enabled automatically.
    const toggles = ['premium', 'autoscroll'];
    const masterToggleBtn = document.getElementById('master-toggle');

    // ── Load all settings ───────────────────────────────────────────────────
    chrome.storage.local.get(['masterEnabled', ...toggles], (result) => {
        const isMasterEnabled = result.masterEnabled !== false;
        updateMasterUI(isMasterEnabled);

        masterToggleBtn.addEventListener('click', () => {
            const willBeEnabled = !masterToggleBtn.classList.contains('active');
            chrome.storage.local.set({ masterEnabled: willBeEnabled }, () => {
                updateMasterUI(willBeEnabled);
                chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
                    if (tabs[0]) chrome.tabs.sendMessage(tabs[0].id, { action: 'masterToggleChanged', state: willBeEnabled }).catch(() => {});
                });
            });
        });

        // Set initial checkbox states — all 4 features default to ON
        toggles.forEach(toggle => {
            const el = document.getElementById(`toggle-${toggle}`);
            if (!el) return;
            el.checked = result[toggle] !== false;
        });
    });

    // ── Individual toggle listeners ─────────────────────────────────────────
    toggles.forEach(toggle => {
        const el = document.getElementById(`toggle-${toggle}`);
        if (!el) return;
        el.addEventListener('change', (e) => {
            const isChecked = e.target.checked;
            chrome.storage.local.set({ [toggle]: isChecked });

            // Send live toggle message to the active YouTube tab
            chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
                if (tabs[0]) {
                    chrome.tabs.sendMessage(tabs[0].id, { action: `toggle${toggle}`, state: isChecked }).catch(() => {});
                }
            });
        });
    });

    // ── Helpers ─────────────────────────────────────────────────────────────
    function updateMasterUI(isEnabled) {
        if (isEnabled) {
            masterToggleBtn.classList.add('active');
            document.body.classList.remove('disabled-mode');
        } else {
            masterToggleBtn.classList.remove('active');
            document.body.classList.add('disabled-mode');
        }
    }
});

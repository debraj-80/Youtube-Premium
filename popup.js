document.addEventListener('DOMContentLoaded', () => {
    const vl = document.getElementById('ext-version-label');
    if (vl) { const m = chrome.runtime.getManifest(); vl.textContent = 'v' + m.version; }

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

        toggles.forEach(toggle => {
            const el = document.getElementById('toggle-' + toggle);
            if (!el) return;
            el.checked = result[toggle] !== false;
        });
    });

    // ── Individual toggle listeners ─────────────────────────────────────────
    toggles.forEach(toggle => {
        const el = document.getElementById('toggle-' + toggle);
        if (!el) return;
        el.addEventListener('change', (e) => {
            const isChecked = e.target.checked;
            chrome.storage.local.set({ [toggle]: isChecked });

            chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
                if (tabs[0]) {
                    chrome.tabs.sendMessage(tabs[0].id, { action: 'toggle' + toggle, state: isChecked }).catch(() => {});
                }
            });
        });
    });

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

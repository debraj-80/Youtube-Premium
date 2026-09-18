
// ─── YouTube Pro + Background Service Worker ─────────────────────────────────
// Minimal background worker — only handles messages needed for
// the 4 core features: Premium Logo, Speed Booster,
// Shorts Autoscroll, and Built-in Download.

chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
    // No background-side logic needed for the 4 core features.
    // Message listener kept as a stub for future extensibility.
});

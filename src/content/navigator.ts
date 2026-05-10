// BrowserMind AI - Page Navigator (Playwright mode)
// Navigation is handled by the Playwright server.
// This content script only provides a ping responder for injection detection.

chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  if (message.type === "PING") {
    sendResponse({ pong: true });
    return true;
  }
});

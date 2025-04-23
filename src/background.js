chrome.runtime.onInstalled.addListener(() => {
  console.log('Forge-Toolkit background service worker installed');
});

chrome.tabs.onRemoved.addListener((tabId) => {
  chrome.storage.local.remove(`deepBass_${tabId}`);
});
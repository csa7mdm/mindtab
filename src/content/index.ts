// MindTab Content Script
// Minimal content script - primarily for future features like page context extraction

console.log('MindTab content script loaded')

// Listen for messages from background/popup
chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
    if (message.type === 'GET_PAGE_INFO') {
        sendResponse({
            title: document.title,
            url: window.location.href,
            description: document.querySelector('meta[name="description"]')?.getAttribute('content') || '',
        })
    }
    return true
})

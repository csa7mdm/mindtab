
// Listen for messages from popup/content scripts
chrome.runtime.onMessage.addListener((message, _sender, _sendResponse) => {
    if (message.type === 'FOCUS_TAB') {
        const { tabId, windowId } = message.payload
        handleFocusTab(tabId, windowId).catch(console.error)
        // Return false as we don't need to send an async response back to the closed popup
        return false
    }
})

async function handleFocusTab(tabId: number, windowId?: number) {
    try {
        // 1. Focus the window first if provided
        if (windowId) {
            await chrome.windows.update(windowId, { focused: true })
        }

        // 2. Activate the tab
        await chrome.tabs.update(tabId, { active: true })
    } catch (error) {
        console.error('Failed to focus tab/window:', error)
    }
}

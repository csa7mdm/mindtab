import { create } from 'zustand'
import type { ChatMessage, ChatResponse, Tab, TabGroupingResult } from '../services/llm/types'
import { llmService } from '../services/llm'
import { tabsService } from '../services/tabs'

interface ChatState {
    messages: ChatMessage[]
    isLoading: boolean
    error: string | null

    // Actions
    sendMessage: (content: string, tabs: Tab[]) => Promise<void>
    clearHistory: () => void
    executeAction: (action: ChatResponse['action'], tabs: Tab[]) => Promise<void>
}

export const useChatStore = create<ChatState>((set, get) => ({
    messages: [],
    isLoading: false,
    error: null,

    sendMessage: async (content: string, tabs: Tab[]) => {
        const { messages } = get()

        // Create user message
        const userMessage: ChatMessage = {
            id: `user-${Date.now()}`,
            role: 'user',
            content,
            timestamp: Date.now(),
            metadata: { tabsContext: tabs.length }
        }

        set({
            messages: [...messages, userMessage],
            isLoading: true,
            error: null
        })

        try {
            // Get active page content for context
            const activeTabContent = await tabsService.getActiveTabContent()
            const response = await llmService.chat(tabs, content, messages, activeTabContent)

            // Create assistant message
            const assistantMessage: ChatMessage = {
                id: `assistant-${Date.now()}`,
                role: 'assistant',
                content: response.message,
                timestamp: Date.now(),
                metadata: {
                    tabsContext: tabs.length,
                    action: response.action?.type
                }
            }

            set(state => ({
                messages: [...state.messages, assistantMessage],
                isLoading: false
            }))

            // Auto-execute action if present
            if (response.action && response.action.type !== 'none') {
                await get().executeAction(response.action, tabs)
            }
        } catch (error) {
            set({
                isLoading: false,
                error: error instanceof Error ? error.message : 'Chat failed'
            })
        }
    },

    clearHistory: () => {
        set({ messages: [], error: null })
    },

    executeAction: async (action, _tabs) => {
        if (!action || action.type === 'none') return

        try {
            switch (action.type) {
                case 'group':
                    if (action.payload && 'groups' in action.payload) {
                        await tabsService.applyGroups((action.payload as TabGroupingResult).groups)
                    }
                    break
                case 'close':
                    if (Array.isArray(action.payload)) {
                        for (const tabId of action.payload) {
                            await chrome.tabs.remove(tabId)
                        }
                    }
                    break
                case 'highlight':
                    if (Array.isArray(action.payload) && action.payload.length > 0) {
                        await chrome.tabs.update(action.payload[0], { active: true })
                    }
                    break
                case 'sort':
                    // Sorting is handled by grouping with specific order
                    console.log('Sort action:', action.payload)
                    break
            }
        } catch (error) {
            console.error('Failed to execute action:', error)
            set({ error: 'Failed to execute action' })
        }
    }
}))

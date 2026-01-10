// LLM Provider Types
export type LLMProvider = 'openai' | 'gemini' | 'deepseek' | 'openrouter' | 'chrome_ai'

export interface LLMConfig {
    provider: LLMProvider
    apiKey: string
    model: string
}

export interface Tab {
    id: number
    title: string
    url: string
    favIconUrl?: string
    groupId?: number
    windowId?: number
}

export interface TabGroup {
    id?: number
    name: string
    tabIds: number[]
    color?: string
}

export interface TabGroupingResult {
    groups: TabGroup[]
}

// Chat Types
export type ChatActionType = 'sort' | 'group' | 'close' | 'highlight' | 'none'

export interface ChatMessage {
    id: string
    role: 'user' | 'assistant' | 'system'
    content: string
    timestamp: number
    metadata?: {
        tabsContext?: number  // Number of tabs in context
        action?: ChatActionType
    }
}

export interface ChatContext {
    tabs: Tab[]
    selectedTabIds?: number[]
    activeTabContent?: string
    conversationHistory: ChatMessage[]
}

export interface ChatAction {
    type: ChatActionType
    payload?: TabGroupingResult | number[]  // Tab IDs for actions
}

export interface ChatResponse {
    message: string
    action?: ChatAction
}

export interface LLMAdapter {
    validateKey(apiKey: string): Promise<boolean>
    groupTabs(tabs: Tab[], prompt?: string): Promise<TabGroupingResult>
    chat(context: ChatContext, userMessage: string): Promise<ChatResponse>
}

// OpenRouter free models sorted by best fit for tab organization
// Prioritizing: JSON output capability, reasoning, context length
export const PROVIDER_MODELS: Record<LLMProvider, string[]> = {
    openrouter: [
        // Best for structured output (JSON)
        'google/gemini-2.0-flash-exp:free',
        'google/learnlm-1.5-pro-experimental:free',
        'google/gemma-2-9b-it:free',
        // Good reasoning - Llama
        'meta-llama/llama-3.3-70b-instruct:free',
        'meta-llama/llama-3.2-3b-instruct:free',
        'meta-llama/llama-3.1-8b-instruct:free',
        // Qwen3 - Current free models
        'qwen/qwen3-30b-a3b:free',
        'qwen/qwen3-235b-a22b:free',
        'qwen/qwen3-coder-480b-a35b-instruct:free',
        // DeepSeek - Current free models
        'deepseek/deepseek-chat-v3-0324:free',
        'deepseek/deepseek-r1:free',
        'deepseek/deepseek-r1-0528:free',
        'deepseek/deepseek-r1-distill-llama-70b:free',
        'deepseek/deepseek-r1-distill-qwen-32b:free',
        // Other capable free models
        'microsoft/phi-3-medium-128k-instruct:free',
        'mistralai/mistral-7b-instruct:free',
        'nousresearch/hermes-3-llama-3.1-405b:free',
    ],
    gemini: [
        'gemini-2.0-flash',
        'gemini-2.0-flash-thinking-exp',
        'gemini-1.5-flash',
        'gemini-1.5-pro',
    ],
    openai: [
        'gpt-4o-mini',
        'gpt-4o',
        'gpt-4-turbo',
        'gpt-3.5-turbo',
    ],
    deepseek: [
        'deepseek-chat',
        'deepseek-coder',
        'deepseek-reasoner',
    ],
    chrome_ai: [
        'gemini-nano',
    ],
}

export const DEFAULT_MODELS: Record<LLMProvider, string> = {
    openrouter: 'google/gemini-2.0-flash-exp:free',
    gemini: 'gemini-2.0-flash',
    openai: 'gpt-4o-mini',
    deepseek: 'deepseek-chat',
    chrome_ai: 'gemini-nano',
}

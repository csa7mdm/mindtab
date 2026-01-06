import type { LLMProvider, LLMAdapter, Tab, TabGroupingResult, LLMConfig, ChatMessage, ChatResponse } from './types'
import { GeminiAdapter } from './adapters/gemini'
import { OpenAIAdapter } from './adapters/openai'
import { DeepSeekAdapter } from './adapters/deepseek'
import { OpenRouterAdapter } from './adapters/openrouter'
import { ChromeAIAdapter } from './adapters/chromeai'
import { DEFAULT_MODELS } from './types'

export class LLMService {
    private adapter: LLMAdapter | null = null
    private config: LLMConfig | null = null

    configure(config: LLMConfig): void {
        this.config = config
        this.adapter = this.createAdapter(config)
    }

    private createAdapter(config: LLMConfig): LLMAdapter {
        switch (config.provider) {
            case 'gemini':
                return new GeminiAdapter(config.apiKey, config.model)
            case 'openai':
                return new OpenAIAdapter(config.apiKey, config.model)
            case 'deepseek':
                return new DeepSeekAdapter(config.apiKey, config.model)
            case 'openrouter':
                return new OpenRouterAdapter(config.apiKey, config.model)
            case 'chrome_ai':
                return new ChromeAIAdapter(config.apiKey, config.model)
            default:
                throw new Error(`Unknown provider: ${config.provider}`)
        }
    }

    async validateKey(provider: LLMProvider, apiKey: string): Promise<boolean> {
        const tempAdapter = this.createAdapter({
            provider,
            apiKey,
            model: DEFAULT_MODELS[provider],
        })
        return tempAdapter.validateKey(apiKey)
    }

    async groupTabs(tabs: Tab[], prompt?: string): Promise<TabGroupingResult> {
        if (!this.adapter) {
            throw new Error('LLM Service not configured. Please add an API key in settings.')
        }
        return this.adapter.groupTabs(tabs, prompt)
    }

    async chat(tabs: Tab[], userMessage: string, conversationHistory: ChatMessage[], activeTabContent?: string): Promise<ChatResponse> {
        if (!this.adapter) {
            throw new Error('LLM Service not configured. Please add an API key in settings.')
        }
        return this.adapter.chat({ tabs, conversationHistory, activeTabContent }, userMessage)
    }

    isConfigured(): boolean {
        return this.adapter !== null && this.config !== null
    }

    getConfig(): LLMConfig | null {
        return this.config
    }
}

export const llmService = new LLMService()

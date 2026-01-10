import { create } from 'zustand'
import type { LLMProvider } from '@/services/llm/types'
import { DEFAULT_MODELS, PROVIDER_MODELS } from '@/services/llm/types'
import { storageService } from '@/services/storage'
import { llmService } from '@/services/llm'
import { modelRegistry } from '@/services/llm/modelRegistry'

interface SettingsState {
    provider: LLMProvider
    model: string
    hasValidKey: boolean
    isValidating: boolean
    isLoading: boolean
    availableModels: string[]

    // Actions
    initialize: () => Promise<void>
    setProvider: (provider: LLMProvider) => Promise<void>
    setModel: (model: string) => Promise<void>
    validateAndSaveKey: (apiKey: string) => Promise<boolean>
    clearKey: () => Promise<void>
}

export const useSettingsStore = create<SettingsState>((set, get) => ({
    provider: 'gemini',
    model: DEFAULT_MODELS.gemini,
    hasValidKey: false,
    isValidating: false,
    isLoading: false, // Start as false - don't block UI
    availableModels: PROVIDER_MODELS.gemini,

    initialize: async () => {
        try {
            const provider = await storageService.getProvider()
            const savedModel = await storageService.getModel()
            const hasKey = await storageService.hasValidKey(provider)
            const model = savedModel || DEFAULT_MODELS[provider]

            // Configure LLM service if key exists
            if (hasKey) {
                const apiKey = await storageService.getApiKey(provider)
                if (apiKey || provider === 'chrome_ai') {
                    llmService.configure({ provider, apiKey: apiKey || '', model })
                }
            }

            // Fetch dynamic models for OpenRouter (with 2-day cache)
            let availableModels = PROVIDER_MODELS[provider]
            if (provider === 'openrouter') {
                const apiKey = await storageService.getApiKey(provider)
                availableModels = await modelRegistry.getOpenRouterModels(apiKey || undefined)
            }

            set({
                provider,
                model,
                hasValidKey: hasKey,
                availableModels,
            })
        } catch (error) {
            console.error('Failed to initialize settings:', error)
            // Keep default values on error
        }
    },

    setProvider: async (provider: LLMProvider) => {
        const model = DEFAULT_MODELS[provider]

        // Fetch dynamic models for OpenRouter (with 2-day cache)
        let availableModels = PROVIDER_MODELS[provider]
        if (provider === 'openrouter') {
            try {
                const apiKey = await storageService.getApiKey(provider)
                availableModels = await modelRegistry.getOpenRouterModels(apiKey || undefined)
            } catch (error) {
                console.warn('Failed to fetch OpenRouter models:', error)
            }
        }

        set({
            provider,
            model,
            availableModels,
        })

        try {
            await storageService.setProvider(provider)
            const hasKey = await storageService.hasValidKey(provider)

            if (hasKey) {
                const apiKey = await storageService.getApiKey(provider)
                if (apiKey || provider === 'chrome_ai') {
                    llmService.configure({ provider, apiKey: apiKey || '', model })
                }
            }

            set({ hasValidKey: hasKey })
        } catch (error) {
            console.error('Failed to set provider:', error)
        }
    },

    setModel: async (model: string) => {
        set({ model })

        try {
            await storageService.setModel(model)
            const { provider, hasValidKey } = get()

            if (hasValidKey) {
                const apiKey = await storageService.getApiKey(provider)
                if (apiKey || provider === 'chrome_ai') {
                    llmService.configure({ provider, apiKey: apiKey || '', model })
                }
            }
        } catch (error) {
            console.error('Failed to set model:', error)
        }
    },

    validateAndSaveKey: async (apiKey: string) => {
        const { provider, model } = get()
        set({ isValidating: true })

        try {
            const isValid = await llmService.validateKey(provider, apiKey)

            if (isValid) {
                await storageService.saveApiKey(provider, apiKey)
                llmService.configure({ provider, apiKey, model })
                set({ hasValidKey: true, isValidating: false })
                return true
            } else {
                set({ isValidating: false })
                return false
            }
        } catch (error) {
            console.error('Key validation failed:', error)
            set({ isValidating: false })
            return false
        }
    },

    clearKey: async () => {
        const { provider } = get()
        set({ hasValidKey: false })

        try {
            await storageService.clearApiKey(provider)
        } catch (error) {
            console.error('Failed to clear key:', error)
        }
    },
}))

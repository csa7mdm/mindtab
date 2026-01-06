import type { LLMProvider } from '../llm/types'

const STORAGE_KEYS = {
    API_KEY_PREFIX: 'mindtab_apikey_',
    PROVIDER: 'mindtab_provider',
    MODEL: 'mindtab_model',
    ONBOARDING_COMPLETE: 'mindtab_onboarding_complete',
    MAX_TABS_PER_WINDOW: 'mindtab_max_tabs_per_window',
} as const

const DEFAULT_MAX_TABS = 15

// Simple encoding for basic obfuscation (not true encryption)
function encode(str: string): string {
    return btoa(encodeURIComponent(str))
}

function decode(str: string): string {
    try {
        return decodeURIComponent(atob(str))
    } catch {
        return ''
    }
}

// Check if Chrome storage API is available
function isChromeStorageAvailable(): boolean {
    return typeof chrome !== 'undefined' &&
        typeof chrome.storage !== 'undefined' &&
        typeof chrome.storage.local !== 'undefined'
}

// Fallback to localStorage if Chrome storage is not available
const fallbackStorage = {
    get: (key: string): string | null => {
        try {
            return localStorage.getItem(key)
        } catch {
            return null
        }
    },
    set: (key: string, value: string): void => {
        try {
            localStorage.setItem(key, value)
        } catch {
            console.warn('Failed to save to localStorage')
        }
    },
    remove: (key: string): void => {
        try {
            localStorage.removeItem(key)
        } catch {
            console.warn('Failed to remove from localStorage')
        }
    }
}

export const storageService = {
    async saveApiKey(provider: LLMProvider, apiKey: string): Promise<void> {
        const key = `${STORAGE_KEYS.API_KEY_PREFIX}${provider}`
        const encoded = encode(apiKey)

        if (isChromeStorageAvailable()) {
            await chrome.storage.local.set({ [key]: encoded })
        } else {
            fallbackStorage.set(key, encoded)
        }
    },

    async getApiKey(provider: LLMProvider): Promise<string | null> {
        const key = `${STORAGE_KEYS.API_KEY_PREFIX}${provider}`

        if (isChromeStorageAvailable()) {
            const result = await chrome.storage.local.get(key)
            const encoded = result[key] as string | undefined
            return encoded ? decode(encoded) : null
        } else {
            const encoded = fallbackStorage.get(key)
            return encoded ? decode(encoded) : null
        }
    },

    async clearApiKey(provider: LLMProvider): Promise<void> {
        const key = `${STORAGE_KEYS.API_KEY_PREFIX}${provider}`

        if (isChromeStorageAvailable()) {
            await chrome.storage.local.remove(key)
        } else {
            fallbackStorage.remove(key)
        }
    },

    async getProvider(): Promise<LLMProvider> {
        if (isChromeStorageAvailable()) {
            const result = await chrome.storage.local.get(STORAGE_KEYS.PROVIDER)
            return (result[STORAGE_KEYS.PROVIDER] as LLMProvider) || 'gemini'
        } else {
            return (fallbackStorage.get(STORAGE_KEYS.PROVIDER) as LLMProvider) || 'gemini'
        }
    },

    async setProvider(provider: LLMProvider): Promise<void> {
        if (isChromeStorageAvailable()) {
            await chrome.storage.local.set({ [STORAGE_KEYS.PROVIDER]: provider })
        } else {
            fallbackStorage.set(STORAGE_KEYS.PROVIDER, provider)
        }
    },

    async getModel(): Promise<string | null> {
        if (isChromeStorageAvailable()) {
            const result = await chrome.storage.local.get(STORAGE_KEYS.MODEL)
            return (result[STORAGE_KEYS.MODEL] as string) || null
        } else {
            return fallbackStorage.get(STORAGE_KEYS.MODEL)
        }
    },

    async setModel(model: string): Promise<void> {
        if (isChromeStorageAvailable()) {
            await chrome.storage.local.set({ [STORAGE_KEYS.MODEL]: model })
        } else {
            fallbackStorage.set(STORAGE_KEYS.MODEL, model)
        }
    },

    async hasValidKey(provider: LLMProvider): Promise<boolean> {
        if (provider === 'chrome_ai') return true
        const key = await this.getApiKey(provider)
        return key !== null && key.length > 0
    },

    async clearAll(): Promise<void> {
        const providers: LLMProvider[] = ['openai', 'gemini', 'deepseek']
        await Promise.all(providers.map((p) => this.clearApiKey(p)))

        if (isChromeStorageAvailable()) {
            await chrome.storage.local.remove([STORAGE_KEYS.PROVIDER, STORAGE_KEYS.MODEL])
        } else {
            fallbackStorage.remove(STORAGE_KEYS.PROVIDER)
            fallbackStorage.remove(STORAGE_KEYS.MODEL)
        }
    },

    async isOnboardingComplete(): Promise<boolean> {
        if (isChromeStorageAvailable()) {
            const result = await chrome.storage.local.get(STORAGE_KEYS.ONBOARDING_COMPLETE)
            return result[STORAGE_KEYS.ONBOARDING_COMPLETE] === 'true'
        } else {
            return fallbackStorage.get(STORAGE_KEYS.ONBOARDING_COMPLETE) === 'true'
        }
    },

    async setOnboardingComplete(): Promise<void> {
        if (isChromeStorageAvailable()) {
            await chrome.storage.local.set({ [STORAGE_KEYS.ONBOARDING_COMPLETE]: 'true' })
        } else {
            fallbackStorage.set(STORAGE_KEYS.ONBOARDING_COMPLETE, 'true')
        }
    },

    async getMaxTabsPerWindow(): Promise<number> {
        if (isChromeStorageAvailable()) {
            const result = await chrome.storage.local.get(STORAGE_KEYS.MAX_TABS_PER_WINDOW)
            const value = result[STORAGE_KEYS.MAX_TABS_PER_WINDOW]
            return typeof value === 'number' ? value : DEFAULT_MAX_TABS
        } else {
            const value = fallbackStorage.get(STORAGE_KEYS.MAX_TABS_PER_WINDOW)
            return value ? parseInt(value, 10) : DEFAULT_MAX_TABS
        }
    },

    async setMaxTabsPerWindow(value: number): Promise<void> {
        const clamped = Math.max(5, Math.min(30, value))
        if (isChromeStorageAvailable()) {
            await chrome.storage.local.set({ [STORAGE_KEYS.MAX_TABS_PER_WINDOW]: clamped })
        } else {
            fallbackStorage.set(STORAGE_KEYS.MAX_TABS_PER_WINDOW, String(clamped))
        }
    },
}

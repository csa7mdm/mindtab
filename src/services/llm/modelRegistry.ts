/**
 * Model Registry Service
 * 
 * Dynamically fetches and caches available models from providers.
 * Auto-refreshes every 2 days to keep the list current.
 */

const CACHE_KEY = 'mindtab_model_cache'
const CACHE_DURATION_MS = 2 * 24 * 60 * 60 * 1000 // 2 days in milliseconds

interface CachedModels {
    openrouter: string[]
    lastUpdated: number
}

interface OpenRouterModel {
    id: string
    name: string
    pricing: {
        prompt: string
        completion: string
    }
}

// Fallback models in case API fails
const FALLBACK_OPENROUTER_MODELS = [
    'google/gemini-2.0-flash-exp:free',
    'google/gemma-2-9b-it:free',
    'meta-llama/llama-3.3-70b-instruct:free',
    'meta-llama/llama-3.1-8b-instruct:free',
    'qwen/qwen3-30b-a3b:free',
    'deepseek/deepseek-r1:free',
    'microsoft/phi-3-medium-128k-instruct:free',
    'mistralai/mistral-7b-instruct:free',
]

class ModelRegistry {
    private cache: CachedModels | null = null
    private isRefreshing = false

    /**
     * Get available OpenRouter models.
     * Automatically refreshes if cache is older than 2 days.
     */
    async getOpenRouterModels(apiKey?: string): Promise<string[]> {
        // Try to load from cache first
        await this.loadCache()

        // Check if refresh is needed
        if (this.shouldRefresh()) {
            // Don't await - refresh in background
            this.refreshModels(apiKey).catch(console.warn)
        }

        return this.cache?.openrouter ?? FALLBACK_OPENROUTER_MODELS
    }

    /**
     * Force an immediate refresh of the model list.
     */
    async forceRefresh(apiKey?: string): Promise<string[]> {
        await this.refreshModels(apiKey)
        return this.cache?.openrouter ?? FALLBACK_OPENROUTER_MODELS
    }

    /**
     * Check if refresh is needed (cache older than 2 days or missing).
     */
    private shouldRefresh(): boolean {
        if (!this.cache) return true
        const age = Date.now() - this.cache.lastUpdated
        return age > CACHE_DURATION_MS
    }

    /**
     * Load cache from chrome.storage.local.
     */
    private async loadCache(): Promise<void> {
        if (this.cache) return // Already loaded

        try {
            if (typeof chrome !== 'undefined' && chrome.storage?.local) {
                const result = await chrome.storage.local.get(CACHE_KEY)
                if (result[CACHE_KEY]) {
                    this.cache = result[CACHE_KEY] as CachedModels
                }
            }
        } catch (error) {
            console.warn('Failed to load model cache:', error)
        }
    }

    /**
     * Save cache to chrome.storage.local.
     */
    private async saveCache(): Promise<void> {
        try {
            if (typeof chrome !== 'undefined' && chrome.storage?.local && this.cache) {
                await chrome.storage.local.set({ [CACHE_KEY]: this.cache })
            }
        } catch (error) {
            console.warn('Failed to save model cache:', error)
        }
    }

    /**
     * Fetch available models from OpenRouter API.
     * Filters for free models only.
     */
    private async refreshModels(apiKey?: string): Promise<void> {
        if (this.isRefreshing) return
        this.isRefreshing = true

        try {
            console.log('[ModelRegistry] Refreshing model list from OpenRouter...')

            const headers: Record<string, string> = {
                'Content-Type': 'application/json',
            }

            if (apiKey) {
                headers['Authorization'] = `Bearer ${apiKey}`
            }

            const response = await fetch('https://openrouter.ai/api/v1/models', {
                method: 'GET',
                headers,
            })

            if (!response.ok) {
                throw new Error(`OpenRouter API returned ${response.status}`)
            }

            const data = await response.json()
            const models: OpenRouterModel[] = data.data || []

            // Filter for free models (pricing is "0" for both prompt and completion)
            const freeModels = models
                .filter(model => {
                    const promptPrice = parseFloat(model.pricing?.prompt || '1')
                    const completionPrice = parseFloat(model.pricing?.completion || '1')
                    return promptPrice === 0 && completionPrice === 0
                })
                .map(model => model.id)
                .sort((a, b) => {
                    // Prioritize popular providers
                    const priority = ['google/', 'meta-llama/', 'qwen/', 'deepseek/', 'microsoft/', 'mistralai/']
                    const aIndex = priority.findIndex(p => a.startsWith(p))
                    const bIndex = priority.findIndex(p => b.startsWith(p))
                    const aPriority = aIndex === -1 ? 999 : aIndex
                    const bPriority = bIndex === -1 ? 999 : bIndex
                    return aPriority - bPriority
                })

            if (freeModels.length > 0) {
                this.cache = {
                    openrouter: freeModels,
                    lastUpdated: Date.now(),
                }
                await this.saveCache()
                console.log(`[ModelRegistry] Found ${freeModels.length} free models`)
            } else {
                console.warn('[ModelRegistry] No free models found, keeping fallback list')
            }
        } catch (error) {
            console.warn('[ModelRegistry] Failed to refresh models:', error)
            // Keep existing cache or use fallback
            if (!this.cache) {
                this.cache = {
                    openrouter: FALLBACK_OPENROUTER_MODELS,
                    lastUpdated: Date.now(),
                }
            }
        } finally {
            this.isRefreshing = false
        }
    }

    /**
     * Get cache age in human-readable format.
     */
    getCacheAge(): string {
        if (!this.cache) return 'No cache'
        const ageMs = Date.now() - this.cache.lastUpdated
        const hours = Math.floor(ageMs / (1000 * 60 * 60))
        const days = Math.floor(hours / 24)
        if (days > 0) return `${days} day(s) ago`
        if (hours > 0) return `${hours} hour(s) ago`
        return 'Just now'
    }

    /**
     * Check if a specific model is in the current list.
     */
    async isModelAvailable(modelId: string): Promise<boolean> {
        const models = await this.getOpenRouterModels()
        return models.includes(modelId)
    }
}

// Singleton instance
export const modelRegistry = new ModelRegistry()

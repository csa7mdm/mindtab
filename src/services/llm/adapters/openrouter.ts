import { BaseLLMAdapter } from './base'
import type { Tab, TabGroupingResult, ChatContext, ChatResponse, ChatMessage } from '../types'

// Known reliable free models for fallback suggestions
const FALLBACK_MODELS = [
    'google/gemini-2.0-flash-exp:free',
    'meta-llama/llama-3.3-70b-instruct:free',
    'deepseek/deepseek-r1:free',
]

export class OpenRouterAdapter extends BaseLLMAdapter {
    private baseUrl = 'https://openrouter.ai/api/v1'
    private maxRetries = 2

    async validateKey(apiKey: string): Promise<boolean> {
        try {
            const response = await fetch(`${this.baseUrl}/models`, {
                method: 'GET',
                headers: { Authorization: `Bearer ${apiKey}` },
            })
            return response.ok
        } catch {
            return false
        }
    }

    /**
     * Parse OpenRouter error response into a user-friendly message
     */
    private parseErrorResponse(status: number, errorBody: unknown): string {
        const body = errorBody as Record<string, unknown>
        const error = body?.error as Record<string, unknown> | string | undefined

        // Extract the actual error message
        let message = ''
        if (typeof error === 'string') {
            message = error
        } else if (error?.message && typeof error.message === 'string') {
            message = error.message
        } else if (body?.message && typeof body.message === 'string') {
            message = body.message
        }

        // Add context based on status codes
        switch (status) {
            case 400:
                return `Bad request: ${message || 'Invalid request format'}`
            case 401:
                return 'Invalid API key. Please check your OpenRouter API key in Settings.'
            case 402:
                return 'Insufficient credits. Please add credits to your OpenRouter account.'
            case 403:
                return 'Access denied. Your API key may not have access to this model.'
            case 404:
                return `Model not found: "${this.model}". Try switching to a different model in Settings.`
            case 429:
                return 'Rate limited. Too many requests. Please wait a moment and try again.'
            case 500:
            case 502:
            case 503:
                return `Provider is temporarily unavailable. Try a different model like: ${FALLBACK_MODELS[0]}`
            case 504:
                return 'Request timed out. The model may be overloaded. Try again or switch models.'
            default:
                return message || `Unexpected error (${status})`
        }
    }

    /**
     * Make API request with retry logic for transient failures
     */
    private async makeRequest(
        endpoint: string,
        body: object,
        title: string
    ): Promise<{ data: Record<string, unknown>; text: string }> {
        let lastError: Error | null = null

        for (let attempt = 0; attempt <= this.maxRetries; attempt++) {
            try {
                const response = await fetch(`${this.baseUrl}${endpoint}`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${this.apiKey}`,
                        'HTTP-Referer': chrome.runtime?.getURL?.('') || 'chrome-extension://mindtab',
                        'X-Title': title,
                    },
                    body: JSON.stringify(body),
                })

                if (!response.ok) {
                    let errorMessage = response.statusText || `Status ${response.status}`
                    try {
                        const errorBody = await response.json()
                        errorMessage = this.parseErrorResponse(response.status, errorBody)
                    } catch {
                        errorMessage = this.parseErrorResponse(response.status, {})
                    }

                    // Don't retry client errors (4xx) except rate limits
                    if (response.status >= 400 && response.status < 500 && response.status !== 429) {
                        throw new Error(`OpenRouter: ${errorMessage}`)
                    }

                    // Retry server errors and rate limits
                    lastError = new Error(`OpenRouter: ${errorMessage}`)
                    if (attempt < this.maxRetries) {
                        const delay = Math.pow(2, attempt) * 1000 // Exponential backoff
                        console.warn(`[OpenRouter] Retrying in ${delay}ms... (attempt ${attempt + 1}/${this.maxRetries})`)
                        await new Promise(resolve => setTimeout(resolve, delay))
                        continue
                    }
                    throw lastError
                }

                const data = await response.json() as Record<string, unknown>

                // Check for error in successful response (some providers do this)
                if (data.error) {
                    const error = data.error as Record<string, unknown> | string
                    const errorMsg = typeof error === 'string' ? error : (error.message || 'Unknown error')
                    throw new Error(`OpenRouter: ${errorMsg}`)
                }

                const choices = data.choices as Array<{ message?: { content?: string } }> | undefined
                const text = choices?.[0]?.message?.content

                if (!text) {
                    console.error('[OpenRouter] Empty response:', data)
                    throw new Error('OpenRouter returned an empty response. The model may be overloaded.')
                }

                return { data, text }

            } catch (error) {
                if (error instanceof TypeError && error.message.includes('fetch')) {
                    lastError = new Error('Network error: Unable to reach OpenRouter. Check your internet connection.')
                } else if (error instanceof Error) {
                    lastError = error
                } else {
                    lastError = new Error('Unknown error occurred')
                }

                // Only retry on network errors
                if (error instanceof TypeError && attempt < this.maxRetries) {
                    const delay = Math.pow(2, attempt) * 1000
                    console.warn(`[OpenRouter] Network error, retrying in ${delay}ms...`)
                    await new Promise(resolve => setTimeout(resolve, delay))
                    continue
                }

                throw lastError
            }
        }

        throw lastError || new Error('Request failed after retries')
    }

    async groupTabs(tabs: Tab[], prompt?: string): Promise<TabGroupingResult> {
        const sanitizedTabs = this.sanitizeTabs(tabs)
        const groupingPrompt = this.buildGroupingPrompt(sanitizedTabs, prompt)
        const allTabIds = tabs.map(t => t.id)

        const { text } = await this.makeRequest(
            '/chat/completions',
            {
                model: this.model,
                messages: [
                    { role: 'system', content: 'You are a helpful tab organization assistant. Respond only with valid JSON.' },
                    { role: 'user', content: groupingPrompt },
                ],
                temperature: 0.2,
                max_tokens: 4096,
            },
            'MindTab Tab Organizer'
        )

        return this.parseGroupingResponse(text, allTabIds)
    }

    async chat(context: ChatContext, userMessage: string): Promise<ChatResponse> {
        const systemPrompt = this.buildChatSystemPrompt(context.tabs)

        // Build messages array with history
        const messages: Array<{ role: string; content: string }> = [
            { role: 'system', content: systemPrompt }
        ]

        // Add conversation history
        context.conversationHistory.forEach((msg: ChatMessage) => {
            messages.push({
                role: msg.role === 'assistant' ? 'assistant' : 'user',
                content: msg.content
            })
        })

        // Add current user message
        messages.push({ role: 'user', content: userMessage })

        const { text } = await this.makeRequest(
            '/chat/completions',
            {
                model: this.model,
                messages,
                temperature: 0.4,
                max_tokens: 2048,
            },
            'MindTab Chat'
        )

        return this.parseChatResponse(text)
    }
}

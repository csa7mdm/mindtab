import { BaseLLMAdapter } from './base'
import type { Tab, TabGroupingResult, ChatContext, ChatResponse, ChatMessage } from '../types'

export class OpenRouterAdapter extends BaseLLMAdapter {
    private baseUrl = 'https://openrouter.ai/api/v1'

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

    async groupTabs(tabs: Tab[], prompt?: string): Promise<TabGroupingResult> {
        const sanitizedTabs = this.sanitizeTabs(tabs)
        const groupingPrompt = this.buildGroupingPrompt(sanitizedTabs, prompt)
        const allTabIds = tabs.map(t => t.id)

        try {
            const response = await fetch(`${this.baseUrl}/chat/completions`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${this.apiKey}`,
                    'HTTP-Referer': chrome.runtime?.getURL?.('') || 'chrome-extension://mindtab',
                    'X-Title': 'MindTab Tab Organizer',
                },
                body: JSON.stringify({
                    model: this.model,
                    messages: [
                        { role: 'system', content: 'You are a helpful tab organization assistant. Respond only with valid JSON.' },
                        { role: 'user', content: groupingPrompt },
                    ],
                    temperature: 0.2,
                    max_tokens: 4096,
                }),
            })

            if (!response.ok) {
                let errorMessage = response.statusText || `Status ${response.status}`
                try {
                    const errorBody = await response.json()
                    if (errorBody.error?.message) {
                        errorMessage = errorBody.error.message
                    } else if (errorBody.message) {
                        errorMessage = errorBody.message
                    } else if (typeof errorBody.error === 'string') {
                        errorMessage = errorBody.error
                    }
                } catch {
                    // Couldn't parse error body
                }
                throw new Error(`OpenRouter: ${errorMessage}`)
            }

            const data = await response.json()

            if (data.error) {
                throw new Error(`OpenRouter: ${data.error.message || data.error}`)
            }

            const text = data.choices?.[0]?.message?.content

            if (!text) {
                console.error('OpenRouter response:', data)
                throw new Error('No content in OpenRouter response')
            }

            return this.parseGroupingResponse(text, allTabIds)
        } catch (error) {
            if (error instanceof TypeError && error.message.includes('fetch')) {
                throw new Error('Network error: Unable to reach OpenRouter API')
            }
            throw error
        }
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

        try {
            const response = await fetch(`${this.baseUrl}/chat/completions`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${this.apiKey}`,
                    'HTTP-Referer': chrome.runtime?.getURL?.('') || 'chrome-extension://mindtab',
                    'X-Title': 'MindTab Chat',
                },
                body: JSON.stringify({
                    model: this.model,
                    messages,
                    temperature: 0.4,
                    max_tokens: 2048,
                }),
            })

            if (!response.ok) {
                let errorMessage = response.statusText || `Status ${response.status}`
                try {
                    const errorBody = await response.json()
                    errorMessage = errorBody.error?.message || errorBody.message || errorMessage
                } catch {
                    // Couldn't parse error body
                }
                throw new Error(`OpenRouter: ${errorMessage}`)
            }

            const data = await response.json()

            if (data.error) {
                throw new Error(`OpenRouter: ${data.error.message || data.error}`)
            }

            const text = data.choices?.[0]?.message?.content

            if (!text) {
                throw new Error('No content in OpenRouter response')
            }

            return this.parseChatResponse(text)
        } catch (error) {
            if (error instanceof TypeError && error.message.includes('fetch')) {
                throw new Error('Network error: Unable to reach OpenRouter API')
            }
            throw error
        }
    }
}

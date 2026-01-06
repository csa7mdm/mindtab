import { BaseLLMAdapter } from './base'
import type { Tab, TabGroupingResult, ChatContext, ChatResponse, ChatMessage } from '../types'

export class GeminiAdapter extends BaseLLMAdapter {
    private baseUrl = 'https://generativelanguage.googleapis.com/v1beta'

    async validateKey(apiKey: string): Promise<boolean> {
        try {
            const response = await fetch(
                `${this.baseUrl}/models?key=${apiKey}`,
                { method: 'GET' }
            )
            return response.ok
        } catch {
            return false
        }
    }

    async groupTabs(tabs: Tab[], prompt?: string): Promise<TabGroupingResult> {
        const sanitizedTabs = this.sanitizeTabs(tabs)
        const groupingPrompt = this.buildGroupingPrompt(sanitizedTabs, prompt)
        const allTabIds = tabs.map(t => t.id)

        const response = await fetch(
            `${this.baseUrl}/models/${this.model}:generateContent?key=${this.apiKey}`,
            {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    contents: [{ parts: [{ text: groupingPrompt }] }],
                    generationConfig: {
                        temperature: 0.2,
                        maxOutputTokens: 4096,
                    },
                }),
            }
        )

        if (!response.ok) {
            throw new Error(`Gemini API error: ${response.statusText}`)
        }

        const data = await response.json()
        const text = data.candidates?.[0]?.content?.parts?.[0]?.text

        if (!text) {
            throw new Error('No response from Gemini')
        }

        return this.parseGroupingResponse(text, allTabIds)
    }

    async chat(context: ChatContext, userMessage: string): Promise<ChatResponse> {
        const systemPrompt = this.buildChatSystemPrompt(context.tabs)

        // Build contents array with history
        const contents: Array<{ role: string; parts: Array<{ text: string }> }> = []

        // Add system instruction as first user message with context
        contents.push({
            role: 'user',
            parts: [{ text: systemPrompt }]
        })
        contents.push({
            role: 'model',
            parts: [{ text: 'I understand. I\'m MindTab, ready to help you manage your browser tabs. How can I assist you?' }]
        })

        // Add conversation history
        context.conversationHistory.forEach((msg: ChatMessage) => {
            contents.push({
                role: msg.role === 'assistant' ? 'model' : 'user',
                parts: [{ text: msg.content }]
            })
        })

        // Add current user message
        contents.push({ role: 'user', parts: [{ text: userMessage }] })

        const response = await fetch(
            `${this.baseUrl}/models/${this.model}:generateContent?key=${this.apiKey}`,
            {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    contents,
                    generationConfig: {
                        temperature: 0.4,
                        maxOutputTokens: 2048,
                    },
                }),
            }
        )

        if (!response.ok) {
            throw new Error(`Gemini API error: ${response.statusText}`)
        }

        const data = await response.json()
        const text = data.candidates?.[0]?.content?.parts?.[0]?.text

        if (!text) {
            throw new Error('No response from Gemini')
        }

        return this.parseChatResponse(text)
    }
}

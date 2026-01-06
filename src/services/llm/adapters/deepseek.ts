import { BaseLLMAdapter } from './base'
import type { Tab, TabGroupingResult, ChatContext, ChatResponse, ChatMessage } from '../types'

export class DeepSeekAdapter extends BaseLLMAdapter {
    private baseUrl = 'https://api.deepseek.com/v1'

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

        const response = await fetch(`${this.baseUrl}/chat/completions`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${this.apiKey}`,
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
            throw new Error(`DeepSeek API error: ${response.statusText}`)
        }

        const data = await response.json()
        const text = data.choices?.[0]?.message?.content

        if (!text) {
            throw new Error('No response from DeepSeek')
        }

        return this.parseGroupingResponse(text, allTabIds)
    }

    async chat(context: ChatContext, userMessage: string): Promise<ChatResponse> {
        const systemPrompt = this.buildChatSystemPrompt(context.tabs)

        const messages: Array<{ role: string; content: string }> = [
            { role: 'system', content: systemPrompt }
        ]

        context.conversationHistory.forEach((msg: ChatMessage) => {
            messages.push({
                role: msg.role === 'assistant' ? 'assistant' : 'user',
                content: msg.content
            })
        })

        messages.push({ role: 'user', content: userMessage })

        const response = await fetch(`${this.baseUrl}/chat/completions`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${this.apiKey}`,
            },
            body: JSON.stringify({
                model: this.model,
                messages,
                temperature: 0.4,
                max_tokens: 2048,
            }),
        })

        if (!response.ok) {
            throw new Error(`DeepSeek API error: ${response.statusText}`)
        }

        const data = await response.json()
        const text = data.choices?.[0]?.message?.content

        if (!text) {
            throw new Error('No response from DeepSeek')
        }

        return this.parseChatResponse(text)
    }
}

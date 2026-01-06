import { BaseLLMAdapter } from './base'
import type { Tab, TabGroupingResult, ChatContext, ChatResponse } from '../types'

export class ChromeAIAdapter extends BaseLLMAdapter {

    async validateKey(_apiKey: string): Promise<boolean> {
        try {
            // Diagnostic logging for extension context
            console.log('[ChromeAI] Context check - self type:', typeof self);
            console.log('[ChromeAI] Origin:', typeof location !== 'undefined' ? location.origin : 'no location');
            console.log('[ChromeAI] self.LanguageModel exists:', 'LanguageModel' in self);

            // Check for LanguageModel on self/window
            if (!('LanguageModel' in self)) {
                console.warn('[ChromeAI] LanguageModel API not found in global scope');
                console.warn('[ChromeAI] This may be because the chrome-extension:// origin does not have access to the LanguageModel API.');
                console.warn('[ChromeAI] Consider using OpenRouter as a fallback.');
                return false;
            }

            const lm = (self as any).LanguageModel;
            // The official API use .availability() which returns a promise resolving to a string
            let status;
            if (typeof lm.availability === 'function') {
                status = await lm.availability();
            } else {
                // Fallback if implementation differs slightly in some builds
                status = await lm.availability;
            }

            console.log('Chrome AI Availability:', status);
            return status === 'readily' || status === 'available';
        } catch (e) {
            console.error('Chrome AI availability check failed:', e);
            return false;
        }
    }

    async groupTabs(tabs: Tab[], prompt?: string): Promise<TabGroupingResult> {
        const sanitizedTabs = this.sanitizeTabs(tabs)
        const groupingPrompt = this.buildGroupingPrompt(sanitizedTabs, prompt)
        const allTabIds = tabs.map(t => t.id)

        if (!('LanguageModel' in self)) {
            throw new Error('Chrome AI API is missing. Extensions requires Chrome 127+ and proper flags.')
        }

        const lm = (self as any).LanguageModel;
        let session;

        try {
            const status = await lm.availability();
            if (status !== 'readily' && status !== 'available') {
                if (status === 'after-download') {
                    throw new Error('Chrome AI model is downloading... check chrome://components (Optimization Guide On Device Model)')
                } else {
                    throw new Error(`Chrome AI not ready (Status: ${status})`)
                }
            }

            // Create a session
            try {
                session = await lm.create({
                    systemPrompt: "You are a helpful assistant. Output valid JSON only.",
                    expectedOutputLanguages: ['en']
                });
            } catch (createError) {
                console.warn('Session creation with systemPrompt failed, retrying without options', createError);
                session = await lm.create({ expectedOutputLanguages: ['en'] });
            }

            const response = await session.prompt(groupingPrompt)
            return this.parseGroupingResponse(response, allTabIds)

        } catch (error: any) {
            console.error('Chrome AI organization failed:', error)
            if (session) {
                session.destroy()
            }
            throw error
        } finally {
            if (session) {
                session.destroy()
            }
        }
    }

    async chat(context: ChatContext, userMessage: string): Promise<ChatResponse> {
        if (!('LanguageModel' in self)) {
            throw new Error('Chrome AI API is missing. Extensions requires Chrome 127+ and proper flags.')
        }

        const lm = (self as any).LanguageModel;
        let session;

        try {
            const status = await lm.availability();
            if (status !== 'readily' && status !== 'available') {
                if (status === 'after-download') {
                    throw new Error('Chrome AI model is downloading...')
                } else {
                    throw new Error(`Chrome AI not ready (Status: ${status})`)
                }
            }

            // Build system prompt with tab context
            const systemPrompt = this.buildChatSystemPrompt(context.tabs)

            // Create session with system prompt
            try {
                session = await lm.create({
                    systemPrompt,
                    expectedOutputLanguages: ['en']
                });
            } catch {
                session = await lm.create({
                    expectedOutputLanguages: ['en']
                });
            }

            // Build conversation context
            const recentHistory = context.conversationHistory.slice(-4).map(m =>
                `${m.role === 'user' ? 'User' : 'Assistant'}: ${m.content}`
            ).join('\n')

            let contentContext = ''
            if (context.activeTabContent && context.activeTabContent.length > 50) {
                contentContext = `\n\nActive Tab Content (reference this if the user asks about the current page):\n${context.activeTabContent.slice(0, 3000)}\n[Content Truncated]\n`
            } else {
                contentContext = `\n\nActive Tab Content: [Unavailable/Empty]. If the user asks about the text on the page, politely explain that you cannot read the current tab's content and ask them to copy-paste the relevant text or describe it.\n`
            }

            const fullPrompt = recentHistory
                ? `${contentContext}${recentHistory}\nUser: ${userMessage}`
                : `${contentContext}User: ${userMessage}`

            const response = await session.prompt(fullPrompt)
            return this.parseChatResponse(response)

        } catch (error: any) {
            console.error('Chrome AI chat failed:', error)
            throw error
        } finally {
            if (session) {
                session.destroy()
            }
        }
    }
}

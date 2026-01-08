import type { Tab, TabGroupingResult, LLMAdapter, ChatContext, ChatResponse, ChatAction } from '../types'

export abstract class BaseLLMAdapter implements LLMAdapter {
    protected apiKey: string
    protected model: string

    constructor(apiKey: string, model: string) {
        this.apiKey = apiKey
        this.model = model
    }

    abstract validateKey(apiKey: string): Promise<boolean>
    abstract groupTabs(tabs: Tab[], prompt?: string): Promise<TabGroupingResult>
    abstract chat(context: ChatContext, userMessage: string): Promise<ChatResponse>

    protected sanitizeTabs(tabs: Tab[]): Tab[] {
        return tabs.map((tab) => ({
            ...tab,
            title: tab.title.length > 50 ? tab.title.substring(0, 47) + '...' : tab.title,
            url: this.sanitizeUrl(tab.url),
        }))
    }

    private sanitizeUrl(url: string): string {
        try {
            const parsed = new URL(url)
            // Return only origin + pathname, truncated to 60 chars to save tokens
            const cleanUrl = `${parsed.origin}${parsed.pathname}`;
            return cleanUrl.length > 70 ? cleanUrl.substring(0, 67) + '...' : cleanUrl;
        } catch {
            return url.length > 50 ? url.substring(0, 47) + '...' : url
        }
    }

    protected buildGroupingPrompt(tabs: Tab[], customPrompt?: string): string {
        const tabList = tabs
            .map((t, i) => `${i + 1}. [ID:${t.id}] "${t.title}" - ${t.url}`)
            .join('\n')

        const totalTabs = tabs.length
        const tabIds = tabs.map(t => t.id).join(', ')

        const basePrompt = `You are an intelligent tab organizer. Your task is to organize ALL ${totalTabs} browser tabs into logical groups.

=== TABS (${totalTabs} total) ===
${tabList}

=== TAB IDs ===
${tabIds}

${customPrompt ? `=== USER INSTRUCTION ===\n${customPrompt}\n` : ''}
=== CRITICAL REQUIREMENTS ===
1. EVERY SINGLE TAB MUST BE ASSIGNED TO A GROUP - no exceptions!
2. You have exactly ${totalTabs} tabs with IDs: ${tabIds}
3. The sum of all tabIds across all groups MUST equal ${totalTabs}
4. Each tab ID can only appear in ONE group
5. Create 3-7 meaningful groups based on content/topic similarity

=== OUTPUT FORMAT ===
Respond with ONLY valid JSON (no markdown, no explanation):
{
  "groups": [
    { "name": "Short Group Name", "tabIds": [id1, id2, ...] }
  ]
}

Group name examples: "Email & Chat", "Development", "Research", "Entertainment", "Shopping", "News", "Social Media", "Work Tools"

IMPORTANT: Double-check that ALL ${totalTabs} tab IDs are included in your response!`

        return basePrompt
    }

    protected parseGroupingResponse(response: string, allTabIds?: number[]): TabGroupingResult {
        try {
            // Extract JSON from potential markdown code blocks
            const jsonMatch = response.match(/```(?:json)?\s*([\s\S]*?)```/) || [null, response]
            const jsonStr = jsonMatch[1]?.trim() || response.trim()

            // Try to find JSON object in the response
            const jsonStart = jsonStr.indexOf('{')
            const jsonEnd = jsonStr.lastIndexOf('}')
            const cleanJson = jsonStart >= 0 && jsonEnd > jsonStart
                ? jsonStr.slice(jsonStart, jsonEnd + 1)
                : jsonStr

            const parsed = JSON.parse(cleanJson)

            if (!parsed.groups || !Array.isArray(parsed.groups)) {
                throw new Error('Invalid response structure')
            }

            // Validate and add any missing tabs to an "Other" group
            if (allTabIds && allTabIds.length > 0) {
                const assignedIds = new Set<number>()
                parsed.groups.forEach((group: { tabIds: number[] }) => {
                    group.tabIds.forEach((id: number) => assignedIds.add(id))
                })

                const missingIds = allTabIds.filter(id => !assignedIds.has(id))
                if (missingIds.length > 0) {
                    console.warn(`AI missed ${missingIds.length} tabs, adding to "Other" group`)
                    parsed.groups.push({ name: 'Other', tabIds: missingIds })
                }
            }

            return parsed as TabGroupingResult
        } catch (error) {
            console.error('Failed to parse LLM response:', error, response)
            throw new Error('Failed to parse grouping response from AI')
        }
    }

    protected buildChatSystemPrompt(tabs: Tab[]): string {
        const tabList = tabs
            .map((t, i) => `${i + 1}. [ID:${t.id}] "${t.title}" - ${this.sanitizeUrl(t.url)}`)
            .join('\n')

        return `You are MindTab, an AI assistant for browser tab management.

Current Context:
- Total tabs: ${tabs.length}
- Tabs:
${tabList}

You can help users with:
1. Sorting tabs by various criteria (domain, topic, date, etc.)
2. Grouping tabs intelligently
3. Finding duplicate tabs
4. Answering questions about their tabs
5. Closing specific tabs
6. Summarizing what they're researching

When an action is needed, respond with JSON in this format:
{
  "message": "Human-readable response",
  "action": {
    "type": "sort|group|close|highlight|none",
    "payload": [tabIds] or {"groups": [...]}
  }
}

Use **Markdown** formatting for the "message" field:
- Use **## Headers** for structure.
- Use **- Bullet points** for lists.
- Use **bold** for emphasis.
- If explaining a workflow or hierarchy, you MUST use a **Mermaid diagram** enclosed in \`\`\`mermaid code blocks.

Example Mermaid:
\`\`\`mermaid
graph TD; A["Start (Context)"]-->B["End"];
\`\`\`

IMPORTANT: You MUST quote all node labels in Mermaid, especially if they contain parentheses or special characters.
Correct: A["Node (Info)"]
Incorrect: A[Node (Info)]

Always be helpful, concise, and accurate. Output valid JSON only.`
    }

    protected parseChatResponse(response: string): ChatResponse {
        try {
            // Extract JSON from potential markdown code blocks
            const jsonMatch = response.match(/```(?:json)?\s*([\s\S]*?)```/) || [null, response]
            const jsonStr = jsonMatch[1]?.trim() || response.trim()

            // Try to find JSON object in the response
            const jsonStart = jsonStr.indexOf('{')
            const jsonEnd = jsonStr.lastIndexOf('}')
            const cleanJson = jsonStart >= 0 && jsonEnd > jsonStart
                ? jsonStr.slice(jsonStart, jsonEnd + 1)
                : jsonStr

            const parsed = JSON.parse(cleanJson)

            // Validate structure
            if (!parsed.message) {
                // If no message, treat the whole response as a message
                return {
                    message: response.trim(),
                    action: { type: 'none' }
                }
            }

            // Normalize action
            const action: ChatAction = parsed.action || { type: 'none' }
            if (!action.type) {
                action.type = 'none'
            }

            return {
                message: parsed.message,
                action
            }
        } catch (error) {
            console.error('Failed to parse chat response:', error, response)
            // Fallback: return the raw response as message
            return {
                message: response.trim(),
                action: { type: 'none' }
            }
        }
    }
}

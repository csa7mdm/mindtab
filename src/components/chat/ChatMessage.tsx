import { User, Bot, Layers, X, MousePointerClick, ArrowRight } from 'lucide-react'
import type { ChatMessage as ChatMessageType } from '../../services/llm/types'

interface ChatMessageProps {
    message: ChatMessageType
}

export function ChatMessage({ message }: ChatMessageProps) {
    const isUser = message.role === 'user'

    const actionLabels: Record<string, { icon: typeof Layers; label: string; color: string }> = {
        group: { icon: Layers, label: 'Grouped tabs', color: 'var(--accent-primary)' },
        close: { icon: X, label: 'Closed tabs', color: 'rgb(239, 68, 68)' },
        highlight: { icon: MousePointerClick, label: 'Highlighted tab', color: 'var(--accent-secondary)' },
        sort: { icon: ArrowRight, label: 'Sorted tabs', color: 'var(--accent-primary)' },
    }

    const action = message.metadata?.action
    const actionInfo = action && action !== 'none' ? actionLabels[action] : null

    return (
        <div className={`flex gap-3 ${isUser ? 'flex-row-reverse' : ''}`}>
            {/* Avatar */}
            <div
                className="flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center"
                style={{
                    background: isUser ? 'var(--accent-primary)' : 'var(--bg-tertiary)',
                }}
            >
                {isUser ? (
                    <User size={16} style={{ color: 'white' }} />
                ) : (
                    <Bot size={16} style={{ color: 'var(--accent-primary)' }} />
                )}
            </div>

            {/* Message */}
            <div className={`flex-1 max-w-[80%] ${isUser ? 'text-right' : ''}`}>
                <div
                    className="inline-block px-3 py-2 rounded-lg text-sm"
                    style={{
                        background: isUser ? 'var(--accent-primary)' : 'var(--bg-secondary)',
                        color: isUser ? 'white' : 'var(--text-primary)',
                        borderRadius: isUser ? '12px 12px 4px 12px' : '12px 12px 12px 4px'
                    }}
                >
                    <p className="whitespace-pre-wrap">{message.content}</p>
                </div>

                {/* Action indicator */}
                {actionInfo && (
                    <div className="flex items-center gap-1 mt-1 text-xs" style={{ color: actionInfo.color }}>
                        <actionInfo.icon size={12} />
                        <span>{actionInfo.label}</span>
                    </div>
                )}

                {/* Timestamp */}
                <div className="mt-1 text-xs" style={{ color: 'var(--text-muted)' }}>
                    {new Date(message.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </div>
            </div>
        </div>
    )
}

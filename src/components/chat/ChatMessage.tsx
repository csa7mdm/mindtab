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
        <div className={`flex gap-3 ${isUser ? 'flex-row-reverse' : ''} animate-in fade-in slide-in-from-bottom-2 duration-300`}>
            {/* Avatar */}
            <div
                className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center shadow-lg ${isUser
                        ? 'bg-gradient-to-br from-violet-600 to-violet-500 text-white'
                        : 'glass border-violet-500/20 text-violet-400 shadow-[0_0_15px_rgba(139,92,246,0.15)]'
                    }`}
            >
                {isUser ? <User size={14} /> : <Bot size={16} />}
            </div>

            {/* Message */}
            <div className={`flex-1 max-w-[85%] ${isUser ? 'text-right' : ''}`}>
                <div
                    className={`
                        inline-block px-4 py-2.5 rounded-2xl text-sm leading-relaxed shadow-sm backdrop-blur-md
                        ${isUser
                            ? 'bg-violet-600 text-white rounded-br-none shadow-[0_4px_15px_rgba(124,58,237,0.3)]'
                            : 'glass-bubble text-text-primary rounded-bl-none border-l-2 border-violet-500'
                        }
                    `}
                >
                    <p className="whitespace-pre-wrap">{message.content}</p>
                </div>

                {/* Action indicator */}
                {actionInfo && (
                    <div className={`flex items-center gap-1.5 mt-1.5 text-xs font-medium ${isUser ? 'justify-end' : ''} text-violet-300/80`}>
                        <div className="p-0.5 rounded bg-violet-500/10">
                            <actionInfo.icon size={10} />
                        </div>
                        <span className="opacity-80">{actionInfo.label}</span>
                    </div>
                )}

                {/* Timestamp */}
                <div className={`mt-1 text-[10px] text-text-muted/50 ${isUser ? 'mr-1' : 'ml-1'}`}>
                    {new Date(message.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </div>
            </div>
        </div>
    )
}

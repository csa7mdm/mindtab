import { useEffect, useRef, useState, useId } from 'react'
import { User, Bot, Layers, X, MousePointerClick, ArrowRight } from 'lucide-react'
import type { ChatMessage as ChatMessageType } from '../../services/llm/types'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import mermaid from 'mermaid'

// Initialize Mermaid
mermaid.initialize({
    startOnLoad: false,
    theme: 'dark',
    securityLevel: 'loose',
    themeVariables: {
        primaryColor: '#8b5cf6', // violet-500
        primaryTextColor: '#fff',
        primaryBorderColor: '#7c3aed', // violet-600
        lineColor: '#a78bfa', // violet-400
        secondaryColor: '#1f2937', // gray-800
        tertiaryColor: '#111827', // gray-900
    }
})

const MermaidBlock = ({ code }: { code: string }) => {
    const ref = useRef<HTMLDivElement>(null)
    const [svg, setSvg] = useState('')
    const id = useId().replace(/:/g, '')

    useEffect(() => {
        if (code && ref.current) {
            mermaid.render(`mermaid-${id}`, code).then(({ svg }) => {
                setSvg(svg)
            }).catch((e) => {
                console.error('Mermaid render error:', e)
                setSvg('<div class="text-red-500 text-xs">Failed to render diagram</div>')
            })
        }
    }, [code, id])

    return <div className="mermaid-diagram my-4 overflow-x-auto bg-black/20 p-2 rounded-lg" ref={ref} dangerouslySetInnerHTML={{ __html: svg }} />
}

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
                            : 'glass-bubble text-text-primary rounded-bl-none border-l-2 border-violet-500 w-full'
                        }
                    `}
                >
                    {isUser ? (
                        <p className="whitespace-pre-wrap">{message.content}</p>
                    ) : (
                        <div className="markdown-content">
                            <ReactMarkdown
                                remarkPlugins={[remarkGfm]}
                                components={{
                                    code({ node, className, children, ...props }) {
                                        const match = /language-(\w+)/.exec(className || '')
                                        const isMermaid = match && match[1] === 'mermaid'

                                        if (isMermaid) {
                                            return <MermaidBlock code={String(children).trim()} />
                                        }
                                        return (
                                            <code className={`${className} bg-black/20 px-1 py-0.5 rounded text-xs font-mono text-violet-200`} {...props}>
                                                {children}
                                            </code>
                                        )
                                    },
                                    p: ({ children }) => <p className="mb-2 last:mb-0">{children}</p>,
                                    ul: ({ children }) => <ul className="list-disc pl-4 mb-2 space-y-1">{children}</ul>,
                                    ol: ({ children }) => <ol className="list-decimal pl-4 mb-2 space-y-1">{children}</ol>,
                                    li: ({ children }) => <li className="text-sm/relaxed">{children}</li>,
                                    h1: ({ children }) => <h1 className="text-lg font-bold mb-2 text-violet-300">{children}</h1>,
                                    h2: ({ children }) => <h2 className="text-base font-bold mb-2 text-violet-300">{children}</h2>,
                                    h3: ({ children }) => <h3 className="text-sm font-bold mb-1 text-violet-300">{children}</h3>,
                                    blockquote: ({ children }) => <blockquote className="border-l-2 border-violet-500/50 pl-3 italic my-2 bg-white/5 py-1 rounded-r">{children}</blockquote>,
                                    a: ({ href, children }) => <a href={href} target="_blank" rel="noopener noreferrer" className="text-violet-300 underline underline-offset-2 hover:text-violet-200">{children}</a>,
                                }}
                            >
                                {message.content}
                            </ReactMarkdown>
                        </div>
                    )}
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

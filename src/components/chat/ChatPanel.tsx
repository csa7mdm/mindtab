import { Send, Trash2, Sparkles, Layers, Search, X } from 'lucide-react'
import { useState, useRef, useEffect } from 'react'
import { useChatStore } from '../../stores/chatStore'
import { useTabsStore } from '../../stores/tabsStore'
import { ChatMessage } from './ChatMessage'
import type { ChatMessage as ChatMessageType } from '../../services/llm/types'

export function ChatPanel() {
    const [input, setInput] = useState('')
    const messagesEndRef = useRef<HTMLDivElement>(null)
    const inputRef = useRef<HTMLTextAreaElement>(null)

    const { messages, isLoading, error, sendMessage, clearHistory } = useChatStore()
    const { tabs } = useTabsStore()

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
    }, [messages])

    const handleSend = async () => {
        if (!input.trim() || isLoading) return
        const message = input.trim()
        setInput('')
        await sendMessage(message, tabs)
    }

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault()
            handleSend()
        }
    }

    const quickActions = [
        { icon: Layers, label: 'Group all', prompt: 'Group my tabs by topic' },
        { icon: Search, label: 'Find duplicates', prompt: 'Find duplicate tabs' },
        { icon: Sparkles, label: 'Summarize', prompt: 'What am I researching?' },
    ]

    return (
        <div className="flex flex-col h-full" style={{ maxHeight: 'calc(600px - 56px)', background: 'var(--bg-base)' }}>
            {/* Header */}
            <div className="flex-shrink-0 flex items-center justify-between px-5 py-3 border-b border-border-subtle" style={{ background: 'var(--bg-surface)' }}>
                <div className="flex items-center gap-2.5">
                    <div className="p-1.5 rounded-lg bg-violet-500/10 text-violet-400">
                        <Sparkles size={16} />
                    </div>
                    <span className="font-semibold text-text-primary text-sm">MindTab AI</span>
                </div>
                <div className="flex items-center gap-3">
                    <span className="text-[10px] font-medium px-2 py-0.5 rounded-full border border-border-subtle" style={{ background: 'var(--bg-elevated)', color: 'var(--text-secondary)' }}>
                        {tabs.length} tabs active
                    </span>
                    {messages.length > 0 && (
                        <button
                            onClick={clearHistory}
                            className="p-1.5 rounded-md hover:bg-white/5 text-text-muted transition-colors"
                            title="Clear conversation"
                        >
                            <Trash2 size={14} />
                        </button>
                    )}
                </div>
            </div>

            {/* Messages Area */}
            <div className="flex-1 overflow-y-auto p-4 space-y-6" style={{ minHeight: 0 }}>
                {messages.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-full px-8 text-center animate-in fade-in duration-500">
                        <div className="w-12 h-12 rounded-2xl flex items-center justify-center mb-4 shadow-sm" style={{ background: 'linear-gradient(135deg, var(--violet-600) 0%, var(--violet-500) 100%)' }}>
                            <Sparkles size={24} className="text-white" />
                        </div>
                        <h3 className="font-semibold text-text-primary mb-2">
                            How can I help organize your tabs?
                        </h3>
                        <p className="text-sm text-text-muted mb-6 leading-relaxed">
                            I can group related pages, find specific tabs, or summarize content for you.
                        </p>

                        <div className="grid grid-cols-1 gap-2 w-full max-w-[240px]">
                            {quickActions.map((action) => (
                                <button
                                    key={action.label}
                                    onClick={() => sendMessage(action.prompt, tabs)}
                                    disabled={isLoading}
                                    className="group flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-medium border border-border-subtle hover:border-violet-500/30 transition-all text-left"
                                    style={{ background: 'var(--bg-elevated)' }}
                                >
                                    <div className="p-1.5 rounded-lg group-hover:bg-violet-500/20 group-hover:text-violet-300 transition-colors" style={{ background: 'var(--bg-overlay)', color: 'var(--text-secondary)' }}>
                                        <action.icon size={14} />
                                    </div>
                                    <span style={{ color: 'var(--text-secondary)' }} className="group-hover:text-text-primary">
                                        {action.label}
                                    </span>
                                </button>
                            ))}
                        </div>
                    </div>
                ) : (
                    <>
                        <div className="space-y-6">
                            {messages.map((msg: ChatMessageType) => (
                                <ChatMessage key={msg.id} message={msg} />
                            ))}
                        </div>

                        {isLoading && (
                            <div className="flex justify-start animate-in fade-in slide-in-from-bottom-2 duration-300">
                                <div className="border border-border-subtle rounded-2xl rounded-tl-sm px-4 py-3 shadow-sm flex items-center gap-2" style={{ background: 'var(--bg-elevated)' }}>
                                    <div className="flex gap-1" role="status">
                                        <span className="w-1.5 h-1.5 rounded-full bg-violet-400 animate-bounce [animation-delay:-0.32s]" />
                                        <span className="w-1.5 h-1.5 rounded-full bg-violet-400 animate-bounce [animation-delay:-0.16s]" />
                                        <span className="w-1.5 h-1.5 rounded-full bg-violet-400 animate-bounce" />
                                    </div>
                                    <span className="text-xs font-medium text-text-muted">Thinking...</span>
                                </div>
                            </div>
                        )}
                        <div ref={messagesEndRef} className="h-4" />
                    </>
                )}
            </div>

            {/* Error Toast */}
            {error && (
                <div className="px-4 pb-2">
                    <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-200 text-xs flex items-center justify-between shadow-sm animate-in slide-in-from-bottom-2">
                        <span className="font-medium">{error}</span>
                        <button onClick={() => useChatStore.setState({ error: null })} className="p-1 hover:bg-white/10 rounded">
                            <X size={14} />
                        </button>
                    </div>
                </div>
            )}

            {/* Input Area */}
            <div className="p-4 border-t border-border-subtle" style={{ background: 'var(--bg-surface)' }}>
                <div
                    className="relative flex items-end gap-2 p-1.5 rounded-2xl border border-transparent transition-all duration-200 focus-within:border-violet-500/50"
                    style={{ background: 'var(--bg-elevated)' }}
                >
                    <textarea
                        ref={inputRef}
                        value={input}
                        onChange={(e) => {
                            setInput(e.target.value);
                            // Auto-grow
                            e.target.style.height = 'auto';
                            e.target.style.height = Math.min(e.target.scrollHeight, 120) + 'px';
                        }}
                        onKeyDown={handleKeyDown}
                        placeholder="Type a message..."
                        disabled={isLoading}
                        rows={1}
                        className="flex-1 w-full bg-transparent px-3 py-2.5 text-sm text-text-primary placeholder:text-text-muted/70 outline-none resize-none max-h-[120px]"
                        style={{ minHeight: '44px' }}
                    />
                    <button
                        onClick={handleSend}
                        disabled={!input.trim() || isLoading}
                        className="flex-shrink-0 p-2.5 mb-0.5 rounded-xl bg-violet-600 text-white shadow-md shadow-violet-900/20 hover:bg-violet-700 disabled:opacity-50 disabled:shadow-none disabled:cursor-not-allowed transition-all duration-200"
                    >
                        <Send size={16} strokeWidth={2.5} />
                    </button>
                </div>
                <div className="mt-2 text-[10px] text-center text-text-muted/60">
                    AI can make mistakes. Please verify important info.
                </div>
            </div>
        </div>
    )
}

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

    // Auto-scroll to bottom
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
    }, [messages])

    // Auto-resize textarea logic
    useEffect(() => {
        if (inputRef.current) {
            // Reset height to auto to get the correct scrollHeight
            inputRef.current.style.height = 'auto'
            // Set new height based on content, limiting to 120px
            const newHeight = Math.min(inputRef.current.scrollHeight, 120)
            inputRef.current.style.height = `${Math.max(44, newHeight)}px`
        }
    }, [input])

    const handleSend = async () => {
        if (!input.trim() || isLoading) return
        const message = input.trim()
        setInput('')
        // Height reset is handled by useEffect when input becomes empty
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
        <div className="flex flex-col h-full relative" style={{ maxHeight: 'calc(600px - 56px)', background: 'radial-gradient(circle at top right, var(--bg-surface), var(--bg-base))' }}>
            {/* Header - Glass & Sticky */}
            <div className="absolute top-0 left-0 right-0 z-10 glass-panel px-5 py-3 flex items-center justify-between border-b-0">
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

            {/* Messages Area - Adjusted for sticky header & floating input */}
            <div className="flex-1 overflow-y-auto p-4 pt-16 pb-24 space-y-6" style={{ minHeight: 0 }}>
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

            {/* Input Area - Floating Capsule */}
            <div className="absolute bottom-4 left-4 right-4 z-20">
                <div className="input-capsule p-1.5 pl-4 flex items-center gap-2 relative">
                    <textarea
                        ref={inputRef}
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        onKeyDown={handleKeyDown}
                        placeholder="Ask MindTab..."
                        className="flex-1 bg-transparent border-none text-text-primary placeholder:text-text-muted focus:ring-0 resize-none text-sm py-2.5 max-h-24 scrollbar-hide focus:outline-none"
                        rows={1}
                        style={{ minHeight: '44px' }}
                    />

                    <button
                        onClick={handleSend}
                        disabled={isLoading || !input.trim()}
                        className={`
                            p-2.5 rounded-full transition-all duration-200 flex-shrink-0
                            ${input.trim()
                                ? 'bg-violet-600 text-white shadow-[0_0_15px_rgba(124,58,237,0.5)] hover:bg-violet-500 transform hover:scale-105'
                                : 'bg-white/5 text-text-muted cursor-not-allowed'}
                        `}
                    >
                        <Send size={18} className={input.trim() ? 'ml-0.5' : ''} />
                    </button>
                </div>
                {error && (
                    <div className="absolute -top-12 left-0 right-0 text-center">
                        <span className="text-xs text-red-200 bg-red-500/10 px-3 py-1.5 rounded-full border border-red-500/20 backdrop-blur-md shadow-sm">
                            {error}
                        </span>
                    </div>
                )}
            </div>
        </div>
    )
}

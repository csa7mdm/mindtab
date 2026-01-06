import { useState, useRef, useEffect } from 'react'
import { Command, Sparkles, Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useTabsStore } from '@/stores/tabsStore'
import { useSettingsStore } from '@/stores/settingsStore'

export function CommandBar() {
    const [isOpen, setIsOpen] = useState(false)
    const [query, setQuery] = useState('')
    const inputRef = useRef<HTMLInputElement>(null)
    const { organizeWithAI, isOrganizing } = useTabsStore()
    const { hasValidKey } = useSettingsStore()

    // Keyboard shortcut: Cmd+K / Ctrl+K
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
                e.preventDefault()
                setIsOpen(true)
            }
            if (e.key === 'Escape') {
                setIsOpen(false)
                setQuery('')
            }
        }

        window.addEventListener('keydown', handleKeyDown)
        return () => window.removeEventListener('keydown', handleKeyDown)
    }, [])

    useEffect(() => {
        if (isOpen && inputRef.current) {
            inputRef.current.focus()
        }
    }, [isOpen])

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!query.trim() || !hasValidKey || isOrganizing) return

        await organizeWithAI(query)
        setQuery('')
        setIsOpen(false)
    }

    if (!isOpen) {
        return (
            <button
                onClick={() => setIsOpen(true)}
                className={cn(
                    'w-full px-3 py-2 rounded-lg border border-gray-700/50 bg-gray-800/30',
                    'flex items-center gap-2 text-gray-400 hover:bg-gray-800/50 hover:border-gray-600',
                    'transition-all text-sm'
                )}
            >
                <Sparkles className="w-3.5 h-3.5 text-blue-400" />
                <span className="flex-1 text-left text-xs">Ask AI to organize...</span>
                <kbd className="flex items-center gap-0.5 px-1.5 py-0.5 rounded bg-gray-700/50 text-[10px] text-gray-500">
                    <Command className="w-2.5 h-2.5" />K
                </kbd>
            </button>
        )
    }

    return (
        <form onSubmit={handleSubmit} className="space-y-2">
            <div className="relative">
                <Sparkles className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-blue-400" />
                <input
                    ref={inputRef}
                    type="text"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder="e.g., 'By project' or 'Work vs personal'"
                    className="w-full pl-9 pr-16 py-2 rounded-lg border-2 border-blue-500 bg-gray-800 text-sm text-white placeholder-gray-500 outline-none"
                    disabled={isOrganizing}
                />
                <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
                    {isOrganizing ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin text-blue-400" />
                    ) : (
                        <>
                            <button type="button" onClick={() => { setIsOpen(false); setQuery('') }} className="text-[10px] text-gray-500 px-1">ESC</button>
                            <button
                                type="submit"
                                disabled={!query.trim() || !hasValidKey}
                                className={cn(
                                    'px-2 py-1 rounded text-[10px] font-medium',
                                    query.trim() && hasValidKey ? 'btn-gradient text-white' : 'bg-gray-700/50 text-gray-500'
                                )}
                            >Go</button>
                        </>
                    )}
                </div>
            </div>
        </form>
    )
}

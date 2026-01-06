import { X, ExternalLink } from 'lucide-react'
import type { Tab } from '@/services/llm/types'

interface TabCardProps {
    tab: Tab
}

export function TabCard({ tab }: TabCardProps) {
    const getFaviconUrl = (url: string, favIconUrl?: string) => {
        if (favIconUrl) return favIconUrl
        try {
            const parsed = new URL(url)
            return `https://www.google.com/s2/favicons?domain=${parsed.hostname}&sz=32`
        } catch {
            return null
        }
    }

    const getDomain = (url: string) => {
        try {
            return new URL(url).hostname.replace('www.', '')
        } catch {
            return ''
        }
    }

    const faviconUrl = getFaviconUrl(tab.url, tab.favIconUrl)

    const handleClick = async () => {
        try {
            // Send message to background script to handle focus
            // This ensures the action completes even if the popup closes immediately
            chrome.runtime.sendMessage({
                type: 'FOCUS_TAB',
                payload: {
                    tabId: tab.id,
                    windowId: tab.windowId
                }
            })
        } catch (error) {
            console.error('Failed to request tab focus:', error)
        }
    }

    const handleClose = async (e: React.MouseEvent) => {
        e.preventDefault()
        e.stopPropagation()
        try {
            if (typeof chrome !== 'undefined' && chrome.tabs) {
                await chrome.tabs.remove(tab.id)
            }
        } catch (error) {
            console.error('Failed to close tab:', error)
        }
    }

    return (
        <div
            className="group flex items-center gap-3 p-3 cursor-pointer transition-all duration-300 rounded-xl mb-2 border border-transparent hover:border-violet-500/30 hover:bg-violet-500/5 hover:shadow-[0_0_15px_rgba(139,92,246,0.1)] relative overflow-hidden"
            onClick={handleClick}
            role="button"
            tabIndex={0}
        >
            <div className="absolute inset-0 bg-gradient-to-r from-violet-500/0 via-violet-500/0 to-violet-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
            {/* Favicon */}
            <div className="relative z-10 w-8 h-8 rounded-lg flex-shrink-0 flex items-center justify-center overflow-hidden glass shadow-sm group-hover:shadow-violet-500/20 transition-all">
                {faviconUrl ? (
                    <img
                        src={faviconUrl}
                        alt=""
                        className="w-4 h-4"
                        onError={(e) => { (e.target as HTMLImageElement).style.display = 'none' }}
                    />
                ) : (
                    <ExternalLink className="w-3 h-3 text-text-muted" />
                )}
            </div>

            {/* Title & Domain */}
            <div className="flex-1 min-w-0">
                <p className="text-sm truncate" style={{ color: 'var(--text-primary)' }}>{tab.title || 'Untitled'}</p>
                <p className="text-[10px] truncate" style={{ color: 'var(--text-muted)' }}>{getDomain(tab.url)}</p>
            </div>

            {/* Close Button */}
            <button
                onClick={handleClose}
                className="p-1 rounded opacity-0 group-hover:opacity-100 transition-opacity hover:bg-white/10"
                title="Close tab"
            >
                <X className="w-3 h-3" style={{ color: 'var(--text-muted)' }} />
            </button>
        </div>
    )
}

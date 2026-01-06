import { useState, useEffect } from 'react'
import { Sparkles, Settings, X, MessageCircle, Layers } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useTabsStore } from '@/stores/tabsStore'
import { useSettingsStore } from '@/stores/settingsStore'
import { SettingsScreen } from '@/components/settings/SettingsScreen'
import { TabOrganizer } from '@/components/tabs/TabOrganizer'
import { ChatPanel } from '@/components/chat/ChatPanel'
import { Onboarding } from '@/components/onboarding/Onboarding'
import { storageService } from '@/services/storage'

type View = 'organizer' | 'chat' | 'settings'

export default function App() {
    const [view, setView] = useState<View>('organizer')
    const [showOnboarding, setShowOnboarding] = useState<boolean | null>(null)
    const { fetchTabs } = useTabsStore()
    const { initialize, hasValidKey } = useSettingsStore()

    useEffect(() => {
        const init = async () => {
            const onboardingComplete = await storageService.isOnboardingComplete()
            setShowOnboarding(!onboardingComplete)
            await initialize()
            await fetchTabs()
        }
        init()
    }, [])

    const handleOnboardingComplete = async () => {
        await storageService.setOnboardingComplete()
        setShowOnboarding(false)
        setView('settings')
    }

    if (showOnboarding === null) {
        return (
            <div className="w-[380px] h-[480px] flex items-center justify-center" style={{ background: 'var(--bg-base)' }}>
                <Sparkles className="w-8 h-8 animate-pulse" style={{ color: 'var(--violet-500)' }} />
            </div>
        )
    }

    const tabs = [
        { id: 'organizer' as const, icon: Layers, label: 'Organize' },
        { id: 'chat' as const, icon: MessageCircle, label: 'Chat' },
    ]

    return (
        <div className="w-[380px] h-[600px] flex flex-col relative" style={{ background: 'radial-gradient(circle at top right, var(--bg-surface), var(--bg-base))' }}>
            {showOnboarding && <Onboarding onComplete={handleOnboardingComplete} />}

            {/* Header with Navigation */}
            <header className="flex items-center justify-between px-4 py-3 border-b border-transparent glass-panel z-10">
                <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-xl flex items-center justify-center shadow-lg shadow-violet-500/20" style={{ background: 'linear-gradient(135deg, var(--violet-600), var(--violet-500))' }}>
                        <Sparkles className="w-4 h-4 text-white" />
                    </div>

                    {/* Tab Navigation */}
                    <div className="flex gap-1 p-1 rounded-xl bg-black/20 border border-white/5">
                        {tabs.map((tab) => (
                            <button
                                key={tab.id}
                                onClick={() => setView(tab.id)}
                                className={cn(
                                    'flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-medium transition-all duration-300',
                                    view === tab.id
                                        ? 'bg-violet-600 text-white shadow-md'
                                        : 'hover:bg-white/5 text-text-muted hover:text-gray-200'
                                )}
                            >
                                <tab.icon size={12} />
                                {tab.label}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Settings Toggle */}
                <button
                    onClick={() => setView(view === 'settings' ? 'organizer' : 'settings')}
                    className={cn(
                        'p-2 rounded-xl transition-all relative border border-transparent',
                        view === 'settings'
                            ? 'bg-violet-500/10 text-violet-400 border-violet-500/20'
                            : 'hover:bg-white/5 text-text-muted hover:text-white'
                    )}
                >
                    {view === 'settings' ? <X className="w-4 h-4" /> : <Settings className="w-4 h-4" />}
                    {!hasValidKey && view !== 'settings' && (
                        <span className="absolute top-1 right-1 w-2 h-2 rounded-full shadow-[0_0_8px_rgba(251,191,36,0.5)]" style={{ background: 'var(--amber-400)' }} />
                    )}
                </button>
            </header>

            {/* Content */}
            <main className="flex-1 overflow-hidden" style={{ minHeight: 0 }}>
                {view === 'settings' && <SettingsScreen />}
                {view === 'organizer' && <TabOrganizer />}
                {view === 'chat' && <ChatPanel />}
            </main>
        </div>
    )
}

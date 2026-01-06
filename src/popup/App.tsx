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
        <div className="w-[380px] h-[600px] flex flex-col relative" style={{ background: 'var(--bg-base)' }}>
            {showOnboarding && <Onboarding onComplete={handleOnboardingComplete} />}

            {/* Header with Navigation */}
            <header className="flex items-center justify-between px-4 py-3 border-b" style={{ borderColor: 'var(--border-subtle)' }}>
                <div className="flex items-center gap-3">
                    <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: 'linear-gradient(135deg, var(--violet-600), var(--amber-500))' }}>
                        <Sparkles className="w-3.5 h-3.5 text-white" />
                    </div>

                    {/* Tab Navigation */}
                    <div className="flex gap-1 p-0.5 rounded-lg" style={{ background: 'var(--bg-secondary)' }}>
                        {tabs.map((tab) => (
                            <button
                                key={tab.id}
                                onClick={() => setView(tab.id)}
                                className={cn(
                                    'flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all',
                                    view === tab.id
                                        ? 'bg-white/10 shadow-sm'
                                        : 'hover:bg-white/5'
                                )}
                                style={{
                                    color: view === tab.id ? 'var(--text-primary)' : 'var(--text-muted)'
                                }}
                            >
                                <tab.icon size={14} />
                                {tab.label}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Settings Toggle */}
                <button
                    onClick={() => setView(view === 'settings' ? 'organizer' : 'settings')}
                    className={cn(
                        'p-2 rounded-lg transition-all relative',
                        view === 'settings' ? 'bg-violet-500/20' : 'hover:bg-white/5'
                    )}
                    style={{ color: view === 'settings' ? 'var(--violet-400)' : 'var(--text-muted)' }}
                >
                    {view === 'settings' ? <X className="w-4 h-4" /> : <Settings className="w-4 h-4" />}
                    {!hasValidKey && view !== 'settings' && (
                        <span className="absolute top-1 right-1 w-2 h-2 rounded-full" style={{ background: 'var(--amber-400)' }} />
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

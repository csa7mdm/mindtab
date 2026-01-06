import { useEffect } from 'react'
import { Sparkles } from 'lucide-react'
import { useTabsStore } from '@/stores/tabsStore'
import { useSettingsStore } from '@/stores/settingsStore'
import { TabOrganizer } from '@/components/tabs/TabOrganizer'

export default function App() {
    const { fetchTabs } = useTabsStore()
    const { initialize } = useSettingsStore()

    useEffect(() => {
        initialize()
        fetchTabs()
    }, [initialize, fetchTabs])

    return (
        <div className="min-h-screen relative" style={{ background: 'radial-gradient(circle at top right, var(--bg-surface), var(--bg-base))' }}>
            {/* Header */}
            <header className="glass-panel sticky top-0 z-10 px-6 py-4 border-b-0 backdrop-blur-xl">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-600 to-indigo-600 shadow-lg shadow-violet-500/20 flex items-center justify-center">
                        <Sparkles className="w-5 h-5 text-white" />
                    </div>
                    <div>
                        <h1 className="text-xl font-bold text-white tracking-tight">MindTab</h1>
                        <p className="text-xs text-violet-200/60 font-medium">AI-Powered Workspace</p>
                    </div>
                </div>
            </header>

            {/* Main Content */}
            <main className="max-w-2xl mx-auto p-6">
                <TabOrganizer />
            </main>
        </div>
    )
}

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
        <div className="min-h-screen bg-gradient-to-b from-gray-900 via-gray-900 to-gray-950">
            {/* Header */}
            <header className="glass sticky top-0 z-10 px-6 py-4 border-b border-gray-800/50">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
                        <Sparkles className="w-5 h-5 text-white" />
                    </div>
                    <div>
                        <h1 className="text-xl font-bold text-white">MindTab</h1>
                        <p className="text-xs text-gray-500">AI-Powered Tab Organizer</p>
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

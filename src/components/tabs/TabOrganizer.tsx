import { useState, useEffect, useMemo } from 'react'
import { Search, Wand2, RefreshCw, Loader2, AlertCircle, ChevronDown, ChevronRight, Layers, LayoutGrid } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useTabsStore } from '@/stores/tabsStore'
import { useSettingsStore } from '@/stores/settingsStore'
import { TabCard } from './TabCard'

export function TabOrganizer() {
    const {
        tabs, groups, chromeGroupInfo, isLoading, isOrganizing, error,
        fetchTabs, organizeWithAI, distributeWithAI, consolidateWindows, ungroupAll
    } = useTabsStore()
    const { hasValidKey } = useSettingsStore()
    const [searchQuery, setSearchQuery] = useState('')
    const [collapsedGroups, setCollapsedGroups] = useState<Set<string>>(new Set())

    useEffect(() => {
        fetchTabs()
    }, [fetchTabs])

    const toggleGroup = (groupKey: string) => {
        setCollapsedGroups(prev => {
            const next = new Set(prev)
            if (next.has(groupKey)) {
                next.delete(groupKey)
            } else {
                next.add(groupKey)
            }
            return next
        })
    }

    // Filter tabs based on search
    const filteredTabs = useMemo(() => {
        if (!searchQuery.trim()) return tabs
        const q = searchQuery.toLowerCase()
        return tabs.filter(tab =>
            tab.title.toLowerCase().includes(q) ||
            tab.url.toLowerCase().includes(q)
        )
    }, [tabs, searchQuery])

    // Group filtered tabs
    const groupedTabs = useMemo(() => {
        return filteredTabs.reduce((acc, tab) => {
            const key = tab.groupId && tab.groupId !== -1 ? `group-${tab.groupId}` : 'ungrouped'
            if (!acc[key]) acc[key] = []
            acc[key].push(tab)
            return acc
        }, {} as Record<string, typeof tabs>)
    }, [filteredTabs])

    // Get Chrome group name (synced with browser)
    const getGroupName = (groupKey: string, tabIds: number[]): string => {
        if (groupKey === 'ungrouped') return 'Ungrouped'

        // Try to get from Chrome's actual groups
        const groupId = parseInt(groupKey.replace('group-', ''))
        const chromeGroup = chromeGroupInfo.get(groupId)
        if (chromeGroup?.name) return chromeGroup.name

        // Fallback to AI groups
        for (const group of groups) {
            if (group.tabIds.some(id => tabIds.includes(id))) {
                return group.name
            }
        }
        return 'Group'
    }

    const hasGroups = Object.keys(groupedTabs).some(k => k !== 'ungrouped')
    const windowCount = new Set(tabs.map(t => t.windowId)).size

    return (
        <div className="flex flex-col h-full" style={{ maxHeight: 'calc(600px - 56px)' }}>
            {/* Search + Actions Bar */}
            <div className="flex-shrink-0 p-3 space-y-2 border-b" style={{ borderColor: 'var(--border-subtle)' }}>
                {/* Search Input */}
                <div className="relative group">
                    <div className="absolute inset-0 bg-violet-500/20 rounded-xl blur-md opacity-0 group-focus-within:opacity-100 transition-opacity duration-500" />
                    <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted group-focus-within:text-violet-400 transition-colors" />
                    <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="Search tabs..."
                        className="w-full pl-10 pr-4 py-2.5 rounded-xl text-sm bg-white/5 border border-white/10 text-text-primary placeholder:text-text-muted/50 focus:outline-none focus:bg-white/10 focus:border-violet-500/30 transition-all relative z-10"
                    />
                </div>

                {/* Primary Actions */}
                <div className="flex gap-2">
                    <button
                        onClick={() => organizeWithAI()}
                        disabled={isOrganizing || !hasValidKey || filteredTabs.length === 0}
                        className={cn(
                            'btn-primary flex-1 py-2 rounded-lg text-sm font-medium flex items-center justify-center gap-1.5',
                            (isOrganizing || !hasValidKey || filteredTabs.length === 0) && 'opacity-50'
                        )}
                    >
                        {isOrganizing ? (
                            <><Loader2 className="w-3.5 h-3.5 animate-spin" />Organizing...</>
                        ) : (
                            <><Wand2 className="w-3.5 h-3.5" />Organize</>
                        )}
                    </button>

                    <button
                        onClick={() => distributeWithAI()}
                        disabled={isOrganizing || !hasValidKey || filteredTabs.length === 0}
                        className={cn(
                            'btn-secondary px-3 py-2 rounded-lg text-xs flex items-center gap-1',
                            (isOrganizing || !hasValidKey) && 'opacity-50'
                        )}
                        title="Organize & distribute across windows"
                    >
                        <LayoutGrid className="w-3.5 h-3.5" />
                        Distribute
                    </button>

                    <button
                        onClick={() => fetchTabs()}
                        disabled={isLoading}
                        className="btn-secondary p-2 rounded-lg"
                        title="Refresh tabs"
                    >
                        <RefreshCw className={cn('w-4 h-4', isLoading && 'animate-spin')} style={{ color: 'var(--text-muted)' }} />
                    </button>
                </div>

                {/* Secondary Actions */}
                <div className="flex gap-2">
                    {windowCount > 1 && (
                        <button
                            onClick={consolidateWindows}
                            disabled={isOrganizing}
                            className="btn-secondary flex-1 py-1.5 rounded-lg text-xs flex items-center justify-center gap-1.5"
                        >
                            <Layers className="w-3 h-3" />
                            Consolidate {windowCount} Windows
                        </button>
                    )}

                    {hasGroups && (
                        <button
                            onClick={ungroupAll}
                            disabled={isOrganizing}
                            className="btn-secondary px-3 py-1.5 rounded-lg text-xs"
                        >
                            Ungroup All
                        </button>
                    )}
                </div>

                {/* Status Messages */}
                {!hasValidKey && (
                    <div className="flex items-center gap-2 text-xs py-1.5 px-2 rounded-lg" style={{ background: 'rgba(251, 191, 36, 0.1)', color: 'var(--amber-400)' }}>
                        <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />
                        Add an API key in Settings to enable AI
                    </div>
                )}

                {error && (
                    <div className="flex items-center gap-2 text-xs py-1.5 px-2 rounded-lg" style={{ background: 'rgba(248, 113, 113, 0.1)', color: 'var(--error)' }}>
                        <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />
                        <span>{error}</span>
                    </div>
                )}
            </div>

            {/* Tab Stats */}
            <div className="flex-shrink-0 px-3 py-2 text-[10px] flex items-center justify-between" style={{ color: 'var(--text-muted)', borderBottom: '1px solid var(--border-subtle)' }}>
                <span>
                    {filteredTabs.length} tab{filteredTabs.length !== 1 ? 's' : ''}
                    {windowCount > 1 && ` • ${windowCount} windows`}
                    {searchQuery && ` matching "${searchQuery}"`}
                </span>
                {groups.length > 0 && <span>{groups.length} groups</span>}
            </div>

            {/* Tab List - SCROLLABLE */}
            <div className="flex-1 overflow-y-auto" style={{ minHeight: 0 }}>
                {isOrganizing ? (
                    <div className="p-3 space-y-2">
                        {[1, 2, 3, 4].map((i) => (
                            <div key={i} className="skeleton h-14 rounded-lg" />
                        ))}
                    </div>
                ) : filteredTabs.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-32 text-center" style={{ color: 'var(--text-muted)' }}>
                        <Search className="w-8 h-8 mb-2 opacity-30" />
                        <p className="text-sm">{searchQuery ? 'No matching tabs' : 'No tabs open'}</p>
                    </div>
                ) : (
                    <div>
                        {Object.entries(groupedTabs).map(([groupKey, groupTabs]) => {
                            const isUngrouped = groupKey === 'ungrouped'
                            const groupName = getGroupName(groupKey, groupTabs.map(t => t.id))
                            const isCollapsed = collapsedGroups.has(groupKey)

                            return (
                                <div key={groupKey} className="border-b" style={{ borderColor: 'var(--border-subtle)' }}>
                                    {/* Group Header - Clickable to collapse/expand */}
                                    <button
                                        onClick={() => toggleGroup(groupKey)}
                                        className="w-full sticky top-0 px-3 py-2 text-xs font-medium flex items-center gap-2 z-10 hover:bg-white/5 transition-colors cursor-pointer"
                                        style={{
                                            background: isUngrouped ? 'var(--bg-surface)' : 'var(--bg-elevated)',
                                            color: isUngrouped ? 'var(--text-muted)' : 'var(--violet-400)'
                                        }}
                                    >
                                        {isCollapsed ? (
                                            <ChevronRight className="w-3.5 h-3.5" />
                                        ) : (
                                            <ChevronDown className="w-3.5 h-3.5" />
                                        )}
                                        {!isUngrouped && <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: 'var(--violet-500)' }} />}
                                        <span className="truncate flex-1 text-left">{groupName}</span>
                                        <span className="text-[10px] flex-shrink-0" style={{ color: 'var(--text-muted)' }}>{groupTabs.length}</span>
                                    </button>

                                    {/* Tabs - Only show if not collapsed */}
                                    {!isCollapsed && groupTabs.map((tab) => (
                                        <TabCard key={tab.id} tab={tab} />
                                    ))}
                                </div>
                            )
                        })}
                    </div>
                )}
            </div>
        </div>
    )
}

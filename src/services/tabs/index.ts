import type { Tab, TabGroup } from '../llm/types'

const TAB_GROUP_COLORS = [
    'blue', 'red', 'yellow', 'green', 'pink', 'purple', 'cyan', 'orange', 'grey'
] as const

function isChromeTabsAvailable(): boolean {
    return typeof chrome !== 'undefined' &&
        typeof chrome.tabs !== 'undefined' &&
        typeof chrome.tabs.query === 'function'
}

function isChromeWindowsAvailable(): boolean {
    return typeof chrome !== 'undefined' &&
        typeof chrome.windows !== 'undefined'
}

export const tabsService = {
    async getAllTabs(): Promise<Tab[]> {
        if (!isChromeTabsAvailable()) {
            console.warn('Chrome tabs API not available')
            return []
        }

        try {
            const tabs = await chrome.tabs.query({})
            return tabs.map((tab) => ({
                id: tab.id!,
                title: tab.title || 'Untitled',
                url: tab.url || '',
                favIconUrl: tab.favIconUrl,
                groupId: tab.groupId,
                windowId: tab.windowId,
            }))
        } catch (error) {
            console.error('Failed to get all tabs:', error)
            return []
        }
    },

    async getCurrentWindowTabs(): Promise<Tab[]> {
        if (!isChromeTabsAvailable()) {
            console.warn('Chrome tabs API not available')
            return []
        }

        try {
            const tabs = await chrome.tabs.query({ currentWindow: true })
            return tabs.map((tab) => ({
                id: tab.id!,
                title: tab.title || 'Untitled',
                url: tab.url || '',
                favIconUrl: tab.favIconUrl,
                groupId: tab.groupId,
                windowId: tab.windowId,
            }))
        } catch (error) {
            console.error('Failed to get current window tabs:', error)
            return []
        }
    },

    async getAllWindows(): Promise<chrome.windows.Window[]> {
        if (!isChromeWindowsAvailable()) return []
        try {
            return await chrome.windows.getAll({ populate: false })
        } catch {
            return []
        }
    },

    async createGroup(name: string, tabIds: number[], colorIndex?: number): Promise<number> {
        if (!isChromeTabsAvailable() || tabIds.length === 0) return -1

        try {
            const validTabIds = tabIds.filter(id => id > 0)
            if (validTabIds.length === 0) return -1

            const groupId = await chrome.tabs.group({ tabIds: validTabIds as [number, ...number[]] })
            const color = TAB_GROUP_COLORS[colorIndex ?? Math.floor(Math.random() * TAB_GROUP_COLORS.length)]

            if (chrome.tabGroups?.update) {
                await chrome.tabGroups.update(groupId, { title: name, color })
            }

            return groupId
        } catch (error) {
            console.error('Failed to create group:', error)
            return -1
        }
    },

    // Distribute groups across windows - Optimizing for performance
    async distributeGroups(groups: TabGroup[], maxTabsPerWindow: number): Promise<void> {
        if (!isChromeTabsAvailable() || !isChromeWindowsAvailable()) return

        try {
            const allTabs = await this.getAllTabs()
            const windows = await this.getAllWindows()

            // 1. Initial cleanup - identify empty windows we can reuse
            const reusableWindows = windows.filter(w => w.type === 'normal' && w.tabs && w.tabs.length === 0)
            const activeWindows = windows.filter(w => w.type === 'normal' && w.tabs && w.tabs.length > 0)

            // Sort groups by size (largest first) for better bin-packing
            const sortedGroups = [...groups].sort((a, b) => b.tabIds.length - a.tabIds.length)

            // Calculate assignments
            const windowAssignments: { windowId: number | null; groups: TabGroup[]; tabCount: number }[] = []

            // Use existing active windows first
            for (const win of activeWindows) {
                if (win.id) {
                    windowAssignments.push({ windowId: win.id, groups: [], tabCount: 0 })
                }
            }

            // Assign groups to windows
            for (const group of sortedGroups) {
                if (group.tabIds.length === 0) continue

                let assigned = false
                // Try to fit in existing assignment
                for (const assignment of windowAssignments) {
                    if (assignment.tabCount + group.tabIds.length <= maxTabsPerWindow) {
                        assignment.groups.push(group)
                        assignment.tabCount += group.tabIds.length
                        assigned = true
                        break
                    }
                }

                // If no space, need new window (will use reusable or create new)
                if (!assigned) {
                    windowAssignments.push({
                        windowId: null, // Placeholder for "new window"
                        groups: [group],
                        tabCount: group.tabIds.length
                    })
                }
            }

            // Ungroup everything first to prevent issues during moves
            const groupedTabIds = allTabs.filter(t => t.groupId && t.groupId !== -1).map(t => t.id)
            if (groupedTabIds.length > 0 && chrome.tabs.ungroup) {
                try {
                    const idsToUngroup = groupedTabIds as [number, ...number[]];
                    if (idsToUngroup.length > 0) {
                        await chrome.tabs.ungroup(idsToUngroup)
                    }
                } catch (e) {
                    console.warn('Failed to ungroup:', e)
                }
            }

            // Execute moves
            const groupNameCounts = new Map<string, number>()

            for (const assignment of windowAssignments) {
                let targetWindowId = assignment.windowId

                // If we need a new window
                if (!targetWindowId) {
                    if (reusableWindows.length > 0) {
                        targetWindowId = reusableWindows.pop()!.id!
                    } else {
                        // Create new window with the first tab of the first group
                        // This avoids the "empty tab" issue by initializing with content
                        const firstGroup = assignment.groups[0]
                        const firstTabId = firstGroup.tabIds[0]

                        const newWindow = await chrome.windows.create({
                            tabId: firstTabId,
                            focused: false
                        })

                        if (newWindow && newWindow.id) {
                            targetWindowId = newWindow.id
                        } else {
                            console.error('Failed to create new window')
                            continue;
                        }
                    }
                }

                // Now move tabs and create groups
                for (let i = 0; i < assignment.groups.length; i++) {
                    const group = assignment.groups[i]

                    // Batch move all tabs in this group
                    // Filter out tabs that are already in the target window (e.g. from create window above)
                    // We need fresh tab data to check windowId though, so we might try catch moves
                    const tabsToMove = group.tabIds.filter(id => {
                        const tab = allTabs.find(t => t.id === id)
                        // If we just created the window with this tab, t.windowId is old (from start of func),
                        // but Chrome ignores moves to same window so it's safe to include.
                        // We filter null checks just in case.
                        return !!tab;
                    })

                    if (tabsToMove.length > 0) {
                        try {
                            await chrome.tabs.move(tabsToMove as number[], { windowId: targetWindowId, index: -1 })
                        } catch (e) {
                            // Some tabs might fail, usually acceptable
                            console.warn('Batch move failed items', e)
                        }
                    }

                    // Generate generic group name if duplicate
                    let groupName = group.name
                    const count = groupNameCounts.get(groupName) || 0
                    if (count > 0) {
                        groupName = `${group.name} (${count + 1})`
                    }
                    groupNameCounts.set(group.name, count + 1)

                    // Create the group in the new location
                    await this.createGroup(groupName, group.tabIds, i)
                }
            }

            // Final cleanup of empty windows
            await this.closeEmptyWindows()

        } catch (error) {
            console.error('Failed to distribute groups:', error)
        }
    },

    async consolidateWindows(): Promise<void> {
        if (!isChromeTabsAvailable() || !isChromeWindowsAvailable()) return

        try {
            const allTabs = await this.getAllTabs()
            const windows = await this.getAllWindows()

            if (windows.length <= 1) return

            const targetWindow = windows.find(w => w.type === 'normal')
            if (!targetWindow?.id) return

            for (const tab of allTabs) {
                if (tab.windowId !== targetWindow.id) {
                    try {
                        await chrome.tabs.move(tab.id, { windowId: targetWindow.id, index: -1 })
                    } catch (e) {
                        console.warn('Failed to move tab during consolidation:', tab.id, e)
                    }
                }
            }

            for (const win of windows) {
                if (win.id !== targetWindow.id && win.type === 'normal') {
                    try {
                        await chrome.windows.remove(win.id!)
                    } catch (e) {
                        console.warn('Failed to close window:', win.id, e)
                    }
                }
            }
        } catch (error) {
            console.error('Failed to consolidate windows:', error)
        }
    },

    async closeEmptyWindows(): Promise<void> {
        if (!isChromeWindowsAvailable()) return

        try {
            const windows = await chrome.windows.getAll({ populate: true })
            for (const win of windows) {
                if (windows.length > 1 && win.tabs && win.tabs.length === 0 && win.id) {
                    await chrome.windows.remove(win.id)
                }
            }
        } catch (error) {
            console.error('Failed to close empty windows:', error)
        }
    },

    async applyGroups(groups: TabGroup[]): Promise<void> {
        if (!isChromeTabsAvailable()) return

        try {
            const allTabs = await this.getAllTabs()
            const groupedTabIds = allTabs.filter((t) => t.groupId && t.groupId !== -1).map((t) => t.id)

            if (groupedTabIds.length > 0 && chrome.tabs.ungroup) {
                try {
                    await chrome.tabs.ungroup(groupedTabIds as [number, ...number[]])
                } catch (e) {
                    console.warn('Failed to ungroup some tabs:', e)
                }
            }

            const groupNameCounts = new Map<string, number>()

            for (let i = 0; i < groups.length; i++) {
                const group = groups[i]
                if (group.tabIds.length > 0) {
                    const tabsByWindow = new Map<number, number[]>()
                    for (const tabId of group.tabIds) {
                        const tab = allTabs.find(t => t.id === tabId)
                        if (tab) {
                            const windowId = tab.windowId || 0
                            if (!tabsByWindow.has(windowId)) {
                                tabsByWindow.set(windowId, [])
                            }
                            tabsByWindow.get(windowId)!.push(tabId)
                        }
                    }

                    let windowIndex = 0
                    for (const [_, windowTabIds] of tabsByWindow) {
                        if (windowTabIds.length > 0) {
                            let groupName = group.name
                            const count = groupNameCounts.get(groupName) || 0
                            if (windowIndex > 0 || count > 0) {
                                groupName = `${group.name} (${count + windowIndex + 1})`
                            }

                            await this.createGroup(groupName, windowTabIds, i)
                            windowIndex++
                        }
                    }
                    groupNameCounts.set(group.name, (groupNameCounts.get(group.name) || 0) + windowIndex)
                }
            }
        } catch (error) {
            console.error('Failed to apply groups:', error)
        }
    },

    async ungroupAllTabs(): Promise<void> {
        if (!isChromeTabsAvailable()) return

        try {
            const tabs = await this.getAllTabs()
            const groupedTabIds = tabs.filter((t) => t.groupId && t.groupId !== -1).map((t) => t.id)
            if (groupedTabIds.length > 0 && chrome.tabs.ungroup) {
                await chrome.tabs.ungroup(groupedTabIds as [number, ...number[]])
            }
        } catch (error) {
            console.error('Failed to ungroup tabs:', error)
        }
    },

    async closeTab(tabId: number): Promise<void> {
        if (!isChromeTabsAvailable()) return

        try {
            await chrome.tabs.remove(tabId)
        } catch (error) {
            console.error('Failed to close tab:', error)
        }
    },

    async focusTab(tabId: number): Promise<void> {
        if (!isChromeTabsAvailable()) return

        try {
            const tab = await chrome.tabs.get(tabId)
            if (tab.windowId) {
                await chrome.windows.update(tab.windowId, { focused: true })
            }
            await chrome.tabs.update(tabId, { active: true })
        } catch (error) {
            console.error('Failed to focus tab:', error)
        }
    },

    async getChromeGroupInfo(): Promise<Map<number, { name: string; color: string }>> {
        const groupInfo = new Map<number, { name: string; color: string }>()

        if (!chrome.tabGroups?.query) return groupInfo

        try {
            const chromeGroups = await chrome.tabGroups.query({})
            for (const group of chromeGroups) {
                groupInfo.set(group.id, {
                    name: group.title || 'Group',
                    color: group.color
                })
            }
        } catch (error) {
            console.error('Failed to get Chrome groups:', error)
        }

        return groupInfo
    },

    async getActiveTabContent(): Promise<string> {
        if (typeof chrome === 'undefined' || !chrome.scripting) return ''

        try {
            // Try to find the active tab in the user's last focused window first
            let [tab] = await chrome.tabs.query({ active: true, lastFocusedWindow: true })

            // Fallback: check current window (might be necessary in some contexts)
            if (!tab?.id) {
                [tab] = await chrome.tabs.query({ active: true, currentWindow: true })
            }

            if (!tab?.id) return ''

            // Check if we can inject script (avoid restricted URLs)
            if (tab.url?.startsWith('chrome://') || tab.url?.startsWith('edge://') || tab.url?.startsWith('about:')) {
                return ''
            }

            const results = await chrome.scripting.executeScript({
                target: { tabId: tab.id },
                func: () => document.body.innerText
            })

            if (results && results[0] && results[0].result) {
                // Return truncated content (max 5000 chars for performance/token limits)
                return results[0].result.slice(0, 5000)
            }
            return ''
        } catch (error) {
            console.warn('Failed to get tab content:', error)
            return ''
        }
    }
}

import { create } from 'zustand'
import type { Tab, TabGroup } from '@/services/llm/types'
import { tabsService } from '@/services/tabs'
import { llmService } from '@/services/llm'
import { storageService } from '@/services/storage'

interface TabsState {
    tabs: Tab[]
    groups: TabGroup[]
    chromeGroupInfo: Map<number, { name: string; color: string }>
    isLoading: boolean
    isOrganizing: boolean
    error: string | null

    // Actions
    fetchTabs: () => Promise<void>
    organizeWithAI: (prompt?: string) => Promise<void>
    distributeWithAI: (prompt?: string) => Promise<void>
    consolidateWindows: () => Promise<void>
    applyGroups: (groups: TabGroup[]) => Promise<void>
    ungroupAll: () => Promise<void>
    closeTab: (tabId: number) => void
    focusTab: (tabId: number) => void
    refreshChromeGroups: () => Promise<void>
}

export const useTabsStore = create<TabsState>((set, get) => ({
    tabs: [],
    groups: [],
    chromeGroupInfo: new Map(),
    isLoading: false,
    isOrganizing: false,
    error: null,

    fetchTabs: async () => {
        set({ isLoading: true, error: null })
        try {
            const tabs = await tabsService.getAllTabs()
            const chromeGroupInfo = await tabsService.getChromeGroupInfo()
            set({ tabs, chromeGroupInfo, isLoading: false })
        } catch (error) {
            console.error('Failed to fetch tabs:', error)
            set({
                tabs: [],
                error: 'Failed to fetch tabs',
                isLoading: false
            })
        }
    },

    refreshChromeGroups: async () => {
        const chromeGroupInfo = await tabsService.getChromeGroupInfo()
        set({ chromeGroupInfo })
    },

    organizeWithAI: async (prompt?: string) => {
        const { tabs } = get()

        if (!llmService.isConfigured()) {
            set({ error: 'Please configure an API key in settings first' })
            return
        }

        if (tabs.length === 0) {
            set({ error: 'No tabs to organize' })
            return
        }

        set({ isOrganizing: true, error: null })

        try {
            const result = await llmService.groupTabs(tabs, prompt)
            set({ groups: result.groups })

            // Apply groups without redistribution
            await tabsService.applyGroups(result.groups)

            const updatedTabs = await tabsService.getAllTabs()
            const chromeGroupInfo = await tabsService.getChromeGroupInfo()
            set({ tabs: updatedTabs, chromeGroupInfo, isOrganizing: false })
        } catch (error) {
            console.error('AI organization failed:', error)
            set({
                error: error instanceof Error ? error.message : 'AI organization failed',
                isOrganizing: false
            })
        }
    },

    distributeWithAI: async (prompt?: string) => {
        const { tabs } = get()

        if (!llmService.isConfigured()) {
            set({ error: 'Please configure an API key in settings first' })
            return
        }

        if (tabs.length === 0) {
            set({ error: 'No tabs to organize' })
            return
        }

        set({ isOrganizing: true, error: null })

        try {
            const result = await llmService.groupTabs(tabs, prompt)
            set({ groups: result.groups })

            // Get max tabs setting and distribute
            const maxTabs = await storageService.getMaxTabsPerWindow()
            await tabsService.distributeGroups(result.groups, maxTabs)

            const updatedTabs = await tabsService.getAllTabs()
            const chromeGroupInfo = await tabsService.getChromeGroupInfo()
            set({ tabs: updatedTabs, chromeGroupInfo, isOrganizing: false })
        } catch (error) {
            console.error('AI distribution failed:', error)
            set({
                error: error instanceof Error ? error.message : 'AI distribution failed',
                isOrganizing: false
            })
        }
    },

    consolidateWindows: async () => {
        set({ isOrganizing: true, error: null })
        try {
            await tabsService.consolidateWindows()
            const updatedTabs = await tabsService.getAllTabs()
            const chromeGroupInfo = await tabsService.getChromeGroupInfo()
            set({ tabs: updatedTabs, chromeGroupInfo, isOrganizing: false })
        } catch (error) {
            console.error('Failed to consolidate windows:', error)
            set({
                error: 'Failed to consolidate windows',
                isOrganizing: false
            })
        }
    },

    applyGroups: async (groups: TabGroup[]) => {
        set({ isOrganizing: true })
        try {
            await tabsService.applyGroups(groups)
            const updatedTabs = await tabsService.getAllTabs()
            const chromeGroupInfo = await tabsService.getChromeGroupInfo()
            set({ tabs: updatedTabs, groups, chromeGroupInfo, isOrganizing: false })
        } catch (error) {
            console.error('Failed to apply groups:', error)
            set({
                error: 'Failed to apply groups',
                isOrganizing: false
            })
        }
    },

    ungroupAll: async () => {
        set({ isOrganizing: true })
        try {
            await tabsService.ungroupAllTabs()
            const updatedTabs = await tabsService.getAllTabs()
            set({ tabs: updatedTabs, groups: [], chromeGroupInfo: new Map(), isOrganizing: false })
        } catch (error) {
            console.error('Failed to ungroup tabs:', error)
            set({ isOrganizing: false })
        }
    },

    closeTab: async (tabId: number) => {
        set((state) => ({
            tabs: state.tabs.filter((t) => t.id !== tabId),
        }))
        await tabsService.closeTab(tabId)
    },

    focusTab: async (tabId: number) => {
        await tabsService.focusTab(tabId)
    },
}))

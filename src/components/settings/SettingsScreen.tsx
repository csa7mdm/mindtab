import { useState, useEffect } from 'react'
import { Eye, EyeOff, Check, Loader2, ChevronDown, Zap, Sliders } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useSettingsStore } from '@/stores/settingsStore'
import { storageService } from '@/services/storage'
import type { LLMProvider } from '@/services/llm/types'

const PROVIDERS: { id: LLMProvider; name: string; highlight?: string }[] = [
    { id: 'openrouter', name: 'OpenRouter', highlight: 'Free models' },
    { id: 'chrome_ai', name: 'Chrome AI', highlight: 'Built-in' }, // We will detect availabiltiy dynamically
    { id: 'gemini', name: 'Gemini' },
    { id: 'openai', name: 'OpenAI' },
    { id: 'deepseek', name: 'DeepSeek' },
]

export function SettingsScreen() {
    const {
        provider, model, hasValidKey, isValidating, availableModels,
        setProvider, setModel, validateAndSaveKey, clearKey,
    } = useSettingsStore()

    const [apiKey, setApiKey] = useState('')
    const [showKey, setShowKey] = useState(false)
    const [status, setStatus] = useState<'idle' | 'success' | 'error'>('idle')
    const [maxTabs, setMaxTabs] = useState(15)

    // Load max tabs setting
    useEffect(() => {
        storageService.getMaxTabsPerWindow().then(setMaxTabs)
    }, [])

    const handleMaxTabsChange = async (value: number) => {
        setMaxTabs(value)
        await storageService.setMaxTabsPerWindow(value)
    }

    const handleValidate = async () => {
        if (provider !== 'chrome_ai' && !apiKey.trim()) return
        setStatus('idle')
        const isValid = await validateAndSaveKey(apiKey)
        setStatus(isValid ? 'success' : 'error')
        if (isValid) setApiKey('')
    }

    const handleProviderChange = async (id: LLMProvider) => {
        setStatus('idle')
        setApiKey('')
        await setProvider(id)
    }

    return (
        <div className="p-4 space-y-5 h-full overflow-y-auto">
            {/* Section: Provider */}
            <section className="space-y-2">
                <label className="text-xs font-medium" style={{ color: 'var(--text-muted)' }}>Provider</label>
                <div className="grid grid-cols-2 gap-2">
                    {PROVIDERS.map((p) => {
                        const isChromeAI = p.id === 'chrome_ai';
                        // Assuming availability check logic if needed, but for now we rely on user selection + verification
                        // We will add a visual indicator if Chrome AI failed verification previously
                        const isUnavailable = isChromeAI && status === 'error' && provider === 'chrome_ai';

                        return (
                            <button
                                key={p.id}
                                onClick={() => handleProviderChange(p.id)}
                                className={cn(
                                    'px-3 py-2.5 rounded-lg text-left transition-all border',
                                    provider === p.id
                                        ? 'border-violet-500/50 bg-violet-500/10'
                                        : 'border-transparent bg-white/[0.03] hover:bg-white/[0.06]'
                                )}
                            >
                                <div className="text-sm font-medium flex justify-between items-center" style={{ color: provider === p.id ? 'var(--violet-400)' : 'var(--text-primary)' }}>
                                    {p.name}
                                    {isUnavailable && <span className="text-[9px] px-1 rounded bg-red-500/20 text-red-400">Error</span>}
                                </div>
                                {p.highlight && (
                                    <div className="text-[10px] flex items-center gap-1 mt-0.5" style={{ color: 'var(--amber-400)' }}>
                                        <Zap className="w-2.5 h-2.5" />{p.highlight}
                                    </div>
                                )}
                            </button>
                        )
                    })}
                </div>
            </section>

            {/* Section: API Key (Hidden for Chrome AI) */}
            {provider !== 'chrome_ai' ? (
                <section className="space-y-2">
                    <div className="flex items-center justify-between">
                        <label className="text-xs font-medium" style={{ color: 'var(--text-muted)' }}>API Key</label>
                        {hasValidKey && (
                            <span className="text-[10px] flex items-center gap-1" style={{ color: 'var(--success)' }}>
                                <Check className="w-2.5 h-2.5" />Connected
                            </span>
                        )}
                    </div>

                    <div className="relative">
                        <input
                            type={showKey ? 'text' : 'password'}
                            value={apiKey}
                            onChange={(e) => { setApiKey(e.target.value); setStatus('idle') }}
                            placeholder={hasValidKey ? '••••••••••••' : 'Paste your API key'}
                            className={cn(
                                'input w-full px-3 py-2.5 pr-10 rounded-lg text-sm',
                                status === 'success' && 'border-green-500',
                                status === 'error' && 'border-red-500'
                            )}
                        />
                        <button
                            onClick={() => setShowKey(!showKey)}
                            className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 rounded hover:bg-white/10"
                        >
                            {showKey ? <EyeOff className="w-3.5 h-3.5" style={{ color: 'var(--text-muted)' }} /> : <Eye className="w-3.5 h-3.5" style={{ color: 'var(--text-muted)' }} />}
                        </button>
                    </div>

                    {status === 'error' && <p className="text-[10px]" style={{ color: 'var(--error)' }}>Invalid API key</p>}
                    {status === 'success' && <p className="text-[10px]" style={{ color: 'var(--success)' }}>Key saved successfully!</p>}
                </section>
            ) : (
                <section className="space-y-2">
                    <div className="p-3 rounded-lg border border-violet-500/20 bg-violet-500/5 text-xs">
                        <p className="font-medium mb-1" style={{ color: 'var(--violet-400)' }}>Built-in AI</p>
                        <p style={{ color: 'var(--text-muted)' }}>Uses Chrome's local Gemini Nano model. No API key required. Privacy focused.</p>
                    </div>
                    {status === 'error' && (
                        <div className="mt-2 text-[10px] text-red-400 bg-red-500/10 p-2 rounded border border-red-500/20">
                            Chrome AI unavailable. <button onClick={() => handleProviderChange('openrouter')} className="underline font-bold">Switch to OpenRouter (Free Cloud)</button> for guaranteed access.
                        </div>
                    )}
                    {status === 'success' && <p className="text-[10px]" style={{ color: 'var(--success)' }}>Chrome AI is ready!</p>}
                </section>
            )}

            {/* Action Buttons */}
            <div className="flex gap-2">
                <button
                    onClick={() => provider === 'chrome_ai' ? handleValidate() : handleValidate()}
                    disabled={(provider !== 'chrome_ai' && !apiKey.trim()) || isValidating}
                    className={cn(
                        'btn-primary flex-1 py-2.5 rounded-lg text-sm font-medium flex items-center justify-center gap-2',
                        (provider !== 'chrome_ai' && !apiKey.trim() || isValidating) && 'opacity-50 cursor-not-allowed'
                    )}
                >
                    {isValidating ? <><Loader2 className="w-3.5 h-3.5 animate-spin" />{provider === 'chrome_ai' ? 'Checking...' : 'Validating'}</> : (provider === 'chrome_ai' ? 'Check Availability' : 'Save Key')}
                </button>

                {hasValidKey && (
                    <button onClick={clearKey} className="btn-secondary px-4 py-2.5 rounded-lg text-sm">
                        Clear
                    </button>
                )}
            </div>

            {/* Section: Model (only if key is valid) */}
            {hasValidKey && (
                <section className="space-y-2 pt-3 border-t" style={{ borderColor: 'var(--border-subtle)' }}>
                    <label className="text-xs font-medium" style={{ color: 'var(--text-muted)' }}>Model</label>
                    <div className="relative">
                        <select
                            value={model}
                            onChange={(e) => setModel(e.target.value)}
                            className="input w-full px-3 py-2.5 rounded-lg text-sm appearance-none cursor-pointer pr-8"
                        >
                            {availableModels.map((m) => (
                                <option key={m} value={m}>{m}</option>
                            ))}
                        </select>
                        <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 pointer-events-none" style={{ color: 'var(--text-muted)' }} />
                    </div>
                </section>
            )}

            {/* Section: Max Tabs Per Window */}
            <section className="space-y-2 pt-3 border-t" style={{ borderColor: 'var(--border-subtle)' }}>
                <div className="flex items-center justify-between">
                    <label className="text-xs font-medium flex items-center gap-1.5" style={{ color: 'var(--text-muted)' }}>
                        <Sliders className="w-3 h-3" />
                        Max Tabs Per Window
                    </label>
                    <span className="text-xs font-mono" style={{ color: 'var(--violet-400)' }}>{maxTabs}</span>
                </div>
                <input
                    type="range"
                    min="5"
                    max="30"
                    value={maxTabs}
                    onChange={(e) => handleMaxTabsChange(parseInt(e.target.value))}
                    className="w-full h-2 rounded-lg appearance-none cursor-pointer"
                    style={{
                        background: `linear-gradient(to right, var(--violet-500) 0%, var(--violet-500) ${((maxTabs - 5) / 25) * 100}%, var(--bg-elevated) ${((maxTabs - 5) / 25) * 100}%, var(--bg-elevated) 100%)`
                    }}
                />
                <p className="text-[10px]" style={{ color: 'var(--text-muted)' }}>
                    When distributing tabs, groups will be split across windows at this limit.
                </p>
            </section>

            {/* Footer */}
            <p className="text-[10px] pt-2" style={{ color: 'var(--text-muted)' }}>
                🔒 Your key is stored locally and never sent to our servers.
            </p>
        </div>
    )
}

import { useState } from 'react'
import { Sparkles, Wand2, Key, Settings, ChevronRight, Search, Zap, Sliders } from 'lucide-react'
import { cn } from '@/lib/utils'

interface OnboardingProps {
    onComplete: () => void
}

const STEPS = [
    {
        icon: Sparkles,
        title: 'Welcome to MindTab',
        description: 'Organize your browser tabs intelligently using AI. Let\'s get you set up in just a few steps.',
        color: 'var(--violet-500)',
    },
    {
        icon: Key,
        title: 'Connect Your AI',
        description: 'Choose a provider (OpenRouter has free models!) and add your API key. Your key stays local and secure.',
        color: 'var(--amber-400)',
    },
    {
        icon: Wand2,
        title: 'Organize & Distribute',
        description: '"Organize" groups tabs in current windows. "Distribute" spreads groups across multiple windows for better visibility.',
        color: 'var(--violet-400)',
    },
    {
        icon: Sliders,
        title: 'Max Tabs Per Window',
        description: 'In Settings, adjust how many tabs per window before distributing to a new one. The default is 15 tabs.',
        color: 'var(--success)',
    },
    {
        icon: Search,
        title: 'Search & Navigate',
        description: 'Use search to find tabs quickly. Click any tab to jump to it. Groups are collapsible!',
        color: 'var(--amber-500)',
    },
]

export function Onboarding({ onComplete }: OnboardingProps) {
    const [step, setStep] = useState(0)
    const currentStep = STEPS[step]
    const isLast = step === STEPS.length - 1
    const Icon = currentStep.icon

    const handleNext = () => {
        if (isLast) {
            onComplete()
        } else {
            setStep(step + 1)
        }
    }

    return (
        <div className="absolute inset-0 z-50 flex flex-col" style={{ background: 'var(--bg-base)' }}>
            {/* Progress Dots */}
            <div className="flex justify-center gap-1.5 pt-6 pb-4">
                {STEPS.map((_, i) => (
                    <div
                        key={i}
                        className={cn(
                            'w-1.5 h-1.5 rounded-full transition-all',
                            i === step ? 'w-6' : 'opacity-30'
                        )}
                        style={{ background: i === step ? currentStep.color : 'var(--text-muted)' }}
                    />
                ))}
            </div>

            {/* Content */}
            <div className="flex-1 flex flex-col items-center justify-center px-8 text-center">
                {/* Icon */}
                <div
                    className="w-16 h-16 rounded-2xl flex items-center justify-center mb-6"
                    style={{ background: `${currentStep.color}20` }}
                >
                    <Icon className="w-8 h-8" style={{ color: currentStep.color }} />
                </div>

                {/* Title */}
                <h2 className="text-xl font-semibold mb-3" style={{ color: 'var(--text-primary)' }}>
                    {currentStep.title}
                </h2>

                {/* Description */}
                <p className="text-sm leading-relaxed max-w-[280px]" style={{ color: 'var(--text-secondary)' }}>
                    {currentStep.description}
                </p>

                {/* Highlight for step 2 */}
                {step === 1 && (
                    <div className="mt-4 flex items-center gap-2 px-3 py-1.5 rounded-full text-xs" style={{ background: 'rgba(251, 191, 36, 0.1)', color: 'var(--amber-400)' }}>
                        <Zap className="w-3 h-3" />
                        OpenRouter offers free models!
                    </div>
                )}
            </div>

            {/* Footer Actions */}
            <div className="p-6 space-y-3">
                <button
                    onClick={handleNext}
                    className="btn-primary w-full py-3 rounded-xl text-sm font-medium flex items-center justify-center gap-2"
                >
                    {isLast ? (
                        <>
                            <Settings className="w-4 h-4" />
                            Set Up API Key
                        </>
                    ) : (
                        <>
                            Continue
                            <ChevronRight className="w-4 h-4" />
                        </>
                    )}
                </button>

                {!isLast && (
                    <button
                        onClick={onComplete}
                        className="w-full py-2 text-xs transition-colors"
                        style={{ color: 'var(--text-muted)' }}
                    >
                        Skip tutorial
                    </button>
                )}
            </div>
        </div>
    )
}

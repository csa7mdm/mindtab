# MindTab - AI Context

> This file provides context for AI agents working with this codebase.

## Project Overview

MindTab is a Chrome Extension (Manifest V3) for AI-powered tab organization. Users can organize their browser tabs using natural language commands with their own API keys (BYOK model).

## Tech Stack

- **Framework**: React 18 + TypeScript
- **Build**: Vite 7
- **Styling**: Tailwind CSS 4
- **State**: Zustand
- **Icons**: Lucide React
- **AI**: Vercel AI SDK (with custom LLM adapters)

## Architecture

```
src/
├── popup/           # Extension popup UI (400x500px)
├── sidepanel/       # Chrome side panel UI (expandable)
├── background/      # Service worker
├── content/         # Content script (page context)
├── components/      # React components
│   ├── settings/    # API key management
│   ├── tabs/        # Tab display & grouping
│   └── command/     # Cmd+K command bar
├── services/
│   ├── llm/         # LLM adapter pattern (Gemini, OpenAI, DeepSeek)
│   ├── tabs/        # Chrome tabs API wrapper
│   └── storage/     # Encrypted storage
└── stores/          # Zustand state management
```

## Key Patterns

### LLM Adapter Pattern
- `BaseLLMAdapter`: Abstract class with URL sanitization and prompt building
- Concrete adapters: `GeminiAdapter`, `OpenAIAdapter`, `DeepSeekAdapter`
- Factory pattern in `LLMService.configure()`

### URL Sanitization
Sensitive params (token, auth, key, session, jwt, etc.) are stripped before sending to LLM.

### Optimistic UI
Tab groups are displayed immediately in the UI before Chrome API confirmation.

## Build Commands

```bash
npm run build      # Production build → dist/
npm run dev        # Development server
npm run lint       # ESLint check
```

## Loading in Chrome

1. Run `npm run build`
2. Open `chrome://extensions/`
3. Enable "Developer mode"
4. Click "Load unpacked" → Select `dist/` folder

## State Stores

- `useSettingsStore`: Provider, model, API key validation
- `useTabsStore`: Tabs list, groups, AI organization
- `useChatStore`: Chat messages, conversation history, action execution

## Chat with Tabs Feature

Conversational AI interface for tab management with dual-mode support:

### Architecture
```
components/chat/
├── ChatPanel.tsx      # Main chat interface
├── ChatMessage.tsx    # Individual message display
└── index.ts

stores/chatStore.ts    # Zustand store for chat state
```

### Chat Types (in types.ts)
- `ChatMessage`: Message with role, content, timestamp, metadata
- `ChatContext`: Tabs + conversation history
- `ChatResponse`: AI response with optional action
- `ChatAction`: Executable actions (group, close, highlight, sort)

### LLM Adapter Chat Method
All adapters implement `chat(context, userMessage)` returning `ChatResponse` with structured JSON output for actionable responses.

## Adding New LLM Provider

1. Create adapter in `src/services/llm/adapters/`
2. Extend `BaseLLMAdapter`
3. Implement `validateKey()`, `groupTabs()`, and `chat()`
4. Add to `PROVIDER_MODELS` and `DEFAULT_MODELS` in `types.ts`
5. Register in `LLMService.createAdapter()`

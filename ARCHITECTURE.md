# 🏗️ MindTab Architecture

## System Overview
MindTab is a **privacy-first Chrome Extension** built on a modern React tech stack. It leverages the Chrome Extensions Manifest V3 API and the experimental `window.ai` (Gemini Nano) API for on-device intelligence.

---

## 🧩 Core Components

### 1. The Brain (Background Service Worker)
*   **Role**: The central coordinator. Always running (or waking up).
*   **Responsibilities**:
    *   Managing Tab & Window state via `chrome.tabs` and `chrome.windows`.
    *   Handling Global Commands (Keyboard shortcuts).
    *   Orchestrating Cross-Context communication.

### 2. The Interface (Side Panel & Popup)
*   **Tech Stack**: React 19, TailwindCSS, Zustand.
*   **Role**: User interaction layer.
*   **Key Features**:
    *   **ChatPanel**: Real-time chat UI with streaming responses.
    *   **TabList**: Visual representation of groups.

### 3. The Intelligence (LLM Service)
*   **Adapter Pattern**: Built to support multiple backends, but focused on Local AI.
*   **ChromeAIAdapter**:
    *   Interfaces with `window.ai` / `ai.languageModel`.
    *   Handles Prompt Engineering constraints (context windows, prompt tuning).
    *   **Privacy Boundary**: Ensures sensitive data (Titles/URLs) never leaves the `chrome.scripting` context to an external server.

---

## 📊 Data Flow Diagram

```mermaid
graph TD
    User[User Interaction] --> UI[React UI SidePanel]
    UI --> Store[Zustand State Store]
    
    subgraph "Chrome Extension Context"
        Store --> Service[Services Layer]
        Service --> TabsService[Tabs Service]
        Service --> LLMService[LLM Service]
        
        TabsService --> ChromeAPI[Chrome APIs]
        ChromeAPI --> Browser[Browser Tabs/Windows]
        
        LLMService --> Adapter[ChromeAI Adapter]
        Adapter --> LocalModel[Gemini Nano (Local)]
    end
    
    Browser -- "Reads Content" --> ContentScript[Content Script]
    ContentScript -- "Sanitized Text" --> Service
```

## 🔐 Security & Privacy Design
1.  **Local Execution**: The `ChromeAIAdapter` is the default. No network requests are made to OpenAI/Anthropic unless explicitly configured by the user (and currently disabled in this Beta).
2.  **Content Sanitization**:
    *   **URLs**: Query parameters (often containing tokens) are stripped before prompt injection.
    *   **Titles**: Truncated to prevent context overflow and reduce leakage.
3.  **Permissions**:
    *   `activeTab`: Only requested when user acts on a specific tab.
    *   `scripting`: Used strictly for DOM text extraction (read-only).

---

## 📂 Project Structure
```text
src/
├── background/      # Service Worker entry point
├── components/      # React UI Components (Chat, Common)
├── services/        # Business Logic
│   ├── llm/         # AI Adapters (ChromeAI, Base)
│   └── tabs/        # Tab Management Logic
├── stores/          # State Management (Zustand)
├── styles/          # Tailwind & Global Styles
└── types/           # TypeScript Definitions
```

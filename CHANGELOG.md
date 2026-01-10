# Changelog

All notable changes to MindTab will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

---

## [0.1.6] - 2026-01-10

### Added
- **Auto-Updating Model List**: Model registry now fetches available free models from OpenRouter every 2 days and caches them in `chrome.storage.local`.
- **Retry Logic**: OpenRouter requests now automatically retry up to 2 times with exponential backoff for server errors (5xx) and rate limits (429).
- **Fallback Suggestions**: Error messages now suggest reliable alternative models when the current model fails.

### Improved
- **Detailed Error Messages**: OpenRouter errors now display user-friendly messages based on HTTP status codes:
  - 401: Invalid API key guidance
  - 402: Insufficient credits notice
  - 403: Access denied explanation
  - 404: Model not found with switch suggestion
  - 429: Rate limit warning
  - 500-504: Provider unavailable with fallback model recommendation

### Fixed
- Removed deprecated Qwen 2.5 models that were causing "No endpoints found" errors
- Updated model list with current free models: Qwen3, DeepSeek R1 variants

---

## [0.1.5] - 2026-01-09

### Fixed
- **Mermaid Diagram Rendering**: Added sanitization for node labels containing parentheses
- **Chat Textarea Resizing**: Fixed issue where textarea wouldn't reset height after sending message
- **JSON Parsing Errors**: Improved graceful handling of non-JSON LLM responses

---

## [0.1.4] - 2026-01-08

### Improved
- System prompt now instructs LLM to output raw Markdown when JSON formatting isn't possible
- Changed console.error to console.warn for non-critical parsing issues

---

## [0.1.3] - 2026-01-07

### Fixed
- Mermaid diagram syntax errors from unquoted node labels
- Improved error display for Mermaid rendering failures

---

## [0.1.2] - 2026-01-06

### Added
- Chat history persistence across sessions
- Improved context window optimization

---

## [0.1.1] - 2026-01-05

### Added
- Chrome AI (Gemini Nano) integration for local, privacy-first AI
- OpenRouter support with free model selection
- Tab grouping with natural language commands
- Chat interface for browser assistance

---

## [0.1.0] - 2026-01-01

### Initial Release
- Core tab management functionality
- Basic AI-powered grouping
- Cyber-Focus UI theme

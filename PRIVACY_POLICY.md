# Privacy Policy for MindTab

**Last Updated: January 2026**

## Overview

MindTab is a browser extension that helps you organize your tabs using AI. We are committed to protecting your privacy and being transparent about our practices.

## Data Collection

### What We Collect

MindTab collects the following data **locally on your device only**:

| Data Type | Purpose | Storage |
|-----------|---------|---------|
| Tab URLs and titles | To analyze and organize tabs | Local browser storage only |
| User preferences | To remember your settings | Local browser storage only |
| AI conversation history | To provide context for tab organization | Local browser storage only |

### What We DO NOT Collect

- We do NOT collect personal identification information
- We do NOT track your browsing history beyond active tabs
- We do NOT send data to external servers (except when using AI APIs you configure)
- We do NOT use cookies for tracking
- We do NOT share or sell any data

## AI Processing

### Local AI (Gemini Nano)
When using local AI processing via Gemini Nano:
- All processing happens **on your device**
- No data leaves your browser
- No external API calls are made

### External AI Providers (Optional)
If you choose to use external AI providers (OpenAI, DeepSeek):
- Only tab titles/URLs are sent for processing
- Data is sent directly to the AI provider's API
- Subject to the AI provider's privacy policy
- **You provide your own API key**

## Data Storage

All data is stored locally using Chrome's `storage.local` API:
- Data remains on your device
- Data is deleted when you uninstall the extension
- You can clear data anytime via extension settings

## Permissions Explained

| Permission | Why We Need It |
|------------|----------------|
| `tabs` | To read and organize your open tabs |
| `tabGroups` | To create and manage tab groups |
| `storage` | To save your preferences locally |
| `activeTab` | To interact with the current tab |
| `scripting` | To extract page information for AI analysis |
| `sidePanel` | To show the organization interface |

## Third-Party Services

If you configure external AI providers:
- **OpenAI**: Subject to [OpenAI Privacy Policy](https://openai.com/privacy)
- **DeepSeek**: Subject to their privacy policy
- **Google Gemini Nano**: Processed locally, no data sent

## Your Rights

You have the right to:
- Access your stored data (via extension settings)
- Delete your data (via extension settings or uninstalling)
- Opt out of external AI (use local Gemini Nano only)

## Children's Privacy

MindTab is not intended for users under 13 years of age.

## Changes to This Policy

We will update this policy as needed. Changes will be noted with an updated date.

## Contact

For privacy questions, open an issue on our [GitHub repository](https://github.com/csa7mdm/mindtab).

---

**Summary**: MindTab processes your tabs locally. External AI is optional and uses your own API keys. We don't collect, store, or sell your personal data.

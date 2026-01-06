# 🚀 MindTab Onboarding: Enabling Next-Gen AI

> **Warning: Bleeding Edge Technology Ahead.**
> MindTab utilizes **Gemini Nano**, Google's most efficient AI model built directly into Chrome. To use this feature today, you must use **Chrome Canary**.

---

## 🛠️ Step 1: Install Chrome Canary
This is the developer version of Chrome that gets new features first.
*   [Download Chrome Canary](https://www.google.com/chrome/canary/)

## ⚙️ Step 2: Enable AI Flags
You need to "wake up" the AI in your browser.

1.  Open Chrome Canary and enter `chrome://flags` in the address bar.
2.  Search for and **enable** the following flags:
    *   `#prompt-api-for-gemini-nano`: Set to **Enabled**.
    *   `#optimization-guide-on-device-model`: Set to **Enabled BypassPrefRequirement**.
3.  **Relaunch Chrome**.

## 📥 Step 3: Download the Model & Component
1.  Go to `chrome://components`.
2.  Find **Optimization Guide On Device Model**.
3.  Click **Check for update** to force the download.
    *   *Note: If you don't see it, ensure you successfully relaunched after Step 2. It may take a few minutes to appear.*
    *   *Download size is approx 1.5GB - 3GB.*

## ✅ Step 4: Verify Installation
1.  Open the DevTools Console (`F12` or `Cmd+Option+J`).
2.  Type `window.ai`.
3.  If you see an object definition, **Congratulations!** Your browser is AI-ready.

---

## 🧩 Step 5: Install MindTab
1.  Go to `chrome://extensions`.
2.  Enable **Developer Mode** (top right).
3.  Click **Load Unpacked**.
4.  Select the `dist` folder from the MindTab project.

---

> [!NOTE]
> **Why all these steps?**
> You are accessing technology that hasn't been released to the general public yet. You are a pioneer. Welcome to the future.

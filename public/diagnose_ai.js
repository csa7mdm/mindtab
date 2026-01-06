document.addEventListener('DOMContentLoaded', () => {
    document.getElementById('ua').innerText = navigator.userAgent;

    // Attach event listeners (replacing inline onclick)
    document.getElementById('recheckBtn').addEventListener('click', checkAI);
    document.getElementById('copyBtn').addEventListener('click', copyReport);

    // Initial check
    checkAI();
});

function log(msg, type = 'info') {
    const logEl = document.getElementById('debug-log');
    logEl.style.display = 'block';
    logEl.innerText += `[${type.toUpperCase()}] ${msg}\n`;
    console.log(`[${type}] ${msg}`);
}

function logObject(obj, name) {
    try {
        log(`${name} [Type: ${typeof obj}]`);
        if (obj) {
            log(`${name} keys: ${JSON.stringify(Object.keys(obj))}`);
            try {
                log(`${name} prototype: ${Object.getPrototypeOf(obj)}`);
            } catch (e) { log(`${name} prototype access failed`); }
        }
    } catch (e) {
        log(`Error inspecting ${name}: ${e.message}`, 'error');
    }
}

async function checkAI() {
    const resultEl = document.getElementById('result');
    document.getElementById('debug-log').innerText = ''; // Clear log

    log(`User Agent: ${navigator.userAgent}`);
    log(`Language: ${navigator.language}`);

    // 1. Check chrome.aiOriginTrial (Likely needed for Extensions)
    let aiOriginTrial = null;
    if (typeof chrome !== 'undefined' && chrome.aiOriginTrial) {
        aiOriginTrial = chrome.aiOriginTrial;
        logObject(aiOriginTrial, 'chrome.aiOriginTrial');
    } else {
        log('chrome.aiOriginTrial: Not found');
    }

    // 2. Check standard window.ai
    const windowAi = window.ai;
    if (windowAi) {
        logObject(windowAi, 'window.ai');
    } else {
        log('window.ai: Not found');
    }

    // 3. Check window.model (Legacy)
    const windowModel = window.model;
    if (windowModel) {
        logObject(windowModel, 'window.model');
    }

    // 4. Check global LanguageModel (Constructor check)
    if ('LanguageModel' in window) {
        const lm = window.LanguageModel;
        log(`window.LanguageModel found. Type: ${typeof lm}`);
        log(`Is Constructor? ${Boolean(lm.prototype)}`);

        try {
            if ('availability' in lm) {
                log(`LanguageModel.availability found. Type: ${typeof lm.availability}`);
                try {
                    let avail;
                    if (typeof lm.availability === 'function') {
                        avail = await lm.availability();
                    } else {
                        avail = lm.availability;
                    }
                    log(`LanguageModel.availability() returned: ${JSON.stringify(avail)}`);
                } catch (e) { log(`Failed to read availability: ${e.message}`); }
            } else {
                log('LanguageModel.availability: Not found');
            }
        } catch (e) { log(`Error inspecting static keys: ${e.message}`); }
    } else {
        log('window.LanguageModel: Not found');
    }

    // Determine Interface
    let interfaceToUse = null;
    let sourceName = '';

    if (aiOriginTrial && aiOriginTrial.languageModel) {
        interfaceToUse = aiOriginTrial.languageModel;
        sourceName = 'chrome.aiOriginTrial.languageModel';
    } else if (windowAi && windowAi.languageModel) {
        interfaceToUse = windowAi.languageModel;
        sourceName = 'window.ai.languageModel';
    } else if (windowModel && windowModel.languageModel) {
        interfaceToUse = windowModel.languageModel;
        sourceName = 'window.model.languageModel';
    } else if ('LanguageModel' in window) {
        // Direct global usage
        interfaceToUse = window.LanguageModel;
        sourceName = 'window.LanguageModel';
    }

    if (!interfaceToUse) {
        resultEl.className = 'status error';
        resultEl.innerHTML = '❌ <strong>API Not Found</strong><br>Chrome is not exposing a valid `languageModel` interface.';
        log('Final Result: No valid interface found.', 'error');
        return;
    }

    try {
        log(`Selected Interface: ${sourceName}`);

        // Capabilities / Availability Check
        let isReady = false;
        let status = 'unknown';

        if (sourceName === 'window.LanguageModel') {
            // New API check
            try {
                if (typeof interfaceToUse.availability === 'function') {
                    status = await interfaceToUse.availability();
                } else {
                    status = interfaceToUse.availability;
                }
            } catch (e) {
                log(`Availability check failed: ${e.message}`);
            }
            log(`LanguageModel status: ${status}`);
            // Note: Verify if status is object or string. usually 'readily' or 'available'
            isReady = (status === 'readily' || status === 'available');
        } else {
            // Old API check
            log('Requesting capabilities...');
            const capabilities = await interfaceToUse.capabilities();
            log(`Capabilities: ${JSON.stringify(capabilities)}`);
            status = capabilities.available;
            isReady = (status === 'readily');
        }

        if (isReady) {
            resultEl.className = 'status success';
            resultEl.innerHTML = `✅ <strong>Chrome AI is Ready!</strong><br><small>Via ${sourceName}</small>`;

            log('Attempting test session...');
            const session = await interfaceToUse.create({
                systemPrompt: "Diagnostic test prompt",
                expectedOutputLanguages: ['en']
            });
            log('Session created.');
            const response = await session.prompt("Test");
            log(`Response: ${response}`);
            session.destroy();
        } else {
            resultEl.className = 'status warning';
            resultEl.innerHTML = `⚠️ <strong>Not Ready</strong><br>Status: ${JSON.stringify(status)}`;
        }

    } catch (error) {
        resultEl.className = 'status error';
        resultEl.innerHTML = `❌ <strong>Error</strong><br>${error.message}`;
        log(`Error during capabilities check: ${error.message}`, 'error');
        log(error.stack, 'error');
    }
}

function copyReport() {
    const mn = document.getElementById('debug-log').innerText;
    navigator.clipboard.writeText(mn).then(() => alert('Copied to clipboard!'));
}

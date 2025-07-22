// --- content.js - Version 3.4 - Complete Smart Translation System with Dual Gemini ---
console.log('[Translator] Content script loaded. Version 3.4 - Dual Gemini System');

// === CONSTANTS AND SELECTORS ===
const ROOT_SELECTOR = '.MessageList';
const MESSAGE_CONTAINER_SELECTOR = '.Message.message-list-item';
const MESSAGE_CONTENT_SELECTOR = '.message-content';
const TEXT_CONTENT_SELECTOR = '.text-content';

const TRANSLATION_ATTRIBUTE = 'data-translated';
const PROCESSING_ATTRIBUTE = 'data-processing';
const MESSAGE_ID_ATTRIBUTE = 'data-message-id';

// === GLOBAL VARIABLES ===
let messageCounter = 0;
let observerAttached = false;
let pendingTranslations = new Map();
let currentChatId = null;
let mainObserver = null;
let navigationObserver = null;

// === UTILITY FUNCTIONS ===

/**
 * Clean message text by removing unwanted elements and formatting
 */
function getCleanMessageText(element) {
    const clone = element.cloneNode(true);
    
    // Remove unwanted elements
    const junkSelectors = [
        '.Reactions', 
        '.custom-emoji', 
        '.text-entity-link', 
        '.message-views', 
        '.peer-title', 
        '.sender-name', 
        '.message-time',
        '.MessageMeta',
        '.message-action-buttons',
        '.CommentButton',
        '.quick-reaction'
    ];
    
    clone.querySelectorAll(junkSelectors.join(', ')).forEach(el => el.remove());
    
    // Convert <br> to newlines
    clone.querySelectorAll('br').forEach(br => br.parentNode.replaceChild(document.createTextNode('\n'), br));
    
    return clone.textContent.trim();
}

/**
 * Get unique identifier for current chat
 */
function getCurrentChatId() {
    const chatTitle = document.querySelector('.chat-title, .peer-title');
    const url = window.location.href;
    return chatTitle ? `${url}_${chatTitle.textContent}` : url;
}

// === CORE TRANSLATION FUNCTIONS ===

/**
 * Main function to handle translation requests - smart logic based on service
 */
function requestTranslation(messageBubble) {
    const messageContent = messageBubble.querySelector(MESSAGE_CONTENT_SELECTOR);
    if (!messageContent) return;

    const textElement = messageContent.querySelector(TEXT_CONTENT_SELECTOR);
    if (!textElement) return;

    const cleanText = getCleanMessageText(textElement);
    if (!cleanText || cleanText.length < 2) return;
    
    // Check which translation service is being used
    chrome.storage.sync.get(['translationService'], (result) => {
        const service = result.translationService || 'google_translate';
        
        if (service === 'google_translate') {
            // Auto-translate for Google Translate (free)
            performTranslation(messageBubble, cleanText);
        } else {
            // Show translate button for Mistral and Gemini services (API services)
            showTranslateButton(messageBubble, cleanText, service);
        }
    });
}

/**
 * Perform actual translation by sending request to background script
 */
function performTranslation(messageBubble, cleanText) {
    // Assign unique ID to the message bubble
    const messageId = `msg_bubble_${Date.now()}_${++messageCounter}`;
    messageBubble.setAttribute(MESSAGE_ID_ATTRIBUTE, messageId);
    messageBubble.setAttribute(PROCESSING_ATTRIBUTE, 'true');

    // Store the message bubble reference
    pendingTranslations.set(messageId, messageBubble);

    console.log(`[Translator] 📤 Requesting translation for: "${cleanText.substring(0, 50)}..." with ID: ${messageId}`);
    
    // Send the request with a callback to handle the response
    chrome.runtime.sendMessage(
        { type: 'TRANSLATE_REQUEST', text: cleanText, messageId: messageId },
        (response) => {
            if (response && (response.type === 'TRANSLATE_RESPONSE' || response.type === 'TRANSLATE_ERROR')) {
                handleTranslationResponse(response);
            }
        }
    );
}

/**
 * Show translate button for API services (Mistral/Gemini)
 */
function showTranslateButton(messageBubble, cleanText, service) {
    // Check if already processed
    if (messageBubble.hasAttribute(PROCESSING_ATTRIBUTE) || messageBubble.hasAttribute(TRANSLATION_ATTRIBUTE)) {
        return;
    }

    // Mark as processed
    messageBubble.setAttribute(PROCESSING_ATTRIBUTE, 'button-shown');

    // Find the correct insertion point
    const messageContent = messageBubble.querySelector(MESSAGE_CONTENT_SELECTOR);
    if (!messageContent) return;

    const contentInner = messageContent.querySelector('.content-inner');
    if (!contentInner) return;

    // Remove any existing translate button
    const existingButton = messageContent.querySelector('.translate-button');
    if (existingButton) {
        existingButton.remove();
    }

    // Create translate button
    const translateButton = document.createElement('div');
    translateButton.className = 'translate-button';
    translateButton.setAttribute('data-service', service);
    
    const serviceName = service === 'gemini_pro' ? 'Gemini 2.5 Pro' : 
                        service === 'gemini_flash' ? 'Gemini 2.0 Flash' : 
                        'Mistral AI';
    const serviceIcon = service === 'gemini_pro' ? '🧠' :
                       service === 'gemini_flash' ? '⚡' : 
                       '🚀';
    
    translateButton.innerHTML = `
        <button class="translate-btn">
            ${serviceIcon} Translate with ${serviceName}
        </button>
    `;
    
    // Style the translate button container
    translateButton.style.cssText = `
        margin: 8px 16px !important;
        display: block !important;
        opacity: 1 !important;
        visibility: visible !important;
    `;
    
    const button = translateButton.querySelector('.translate-btn');
    
    // Apply service-specific styling
    const serviceColors = {
        gemini_pro: 'linear-gradient(135deg, #4285f4 0%, #1565c0 100%)',
        gemini_flash: 'linear-gradient(135deg, #34a853 0%, #2e7d32 100%)',
        mistral: 'linear-gradient(135deg, #ff6b35 0%, #f7931e 100%)'
    };
    
    button.style.cssText = `
        width: 100% !important;
        padding: 10px 16px !important;
        background: ${serviceColors[service]} !important;
        color: white !important;
        border: none !important;
        border-radius: 8px !important;
        font-size: 13px !important;
        font-weight: 600 !important;
        cursor: pointer !important;
        transition: all 0.3s ease !important;
        display: flex !important;
        align-items: center !important;
        justify-content: center !important;
        gap: 6px !important;
        text-transform: none !important;
        font-family: inherit !important;
        letter-spacing: 0.3px !important;
        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15) !important;
    `;
    
    // Add hover effect
    button.addEventListener('mouseenter', () => {
        button.style.transform = 'translateY(-1px)';
        button.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.2)';
    });
    
    button.addEventListener('mouseleave', () => {
        button.style.transform = 'translateY(0)';
        button.style.boxShadow = '0 2px 8px rgba(0, 0, 0, 0.15)';
    });
    
    // Add click handler
    button.addEventListener('click', () => {
        // Update button to show loading state
        button.innerHTML = '🔄 Translating...';
        button.style.opacity = '0.7';
        button.style.cursor = 'not-allowed';
        button.disabled = true;
        
        // Remove the button processing state and perform translation
        messageBubble.removeAttribute(PROCESSING_ATTRIBUTE);
        
        // Hide the button with animation
        translateButton.style.opacity = '0';
        translateButton.style.transform = 'translateY(-10px) scale(0.95)';
        setTimeout(() => {
            translateButton.remove();
        }, 300);
        
        // Perform the actual translation
        performTranslation(messageBubble, cleanText);
    });
    
    // Insert the button after content-inner
    contentInner.insertAdjacentElement('afterend', translateButton);
    
    // Animate button appearance
    setTimeout(() => {
        translateButton.style.animation = 'slideInTranslation 0.4s ease-out';
    }, 50);
    
    console.log(`[Translator] 🔘 Added translate button for ${serviceName}`);
}

/**
 * Handle translation response from background script
 */
function handleTranslationResponse(response) {
    console.log(`[Translator] 🔄 Processing response for messageId: ${response.messageId}`, response);
    
    // Get the message bubble from our pending translations map
    const messageBubble = pendingTranslations.get(response.messageId);
    if (!messageBubble) {
        console.warn(`[Translator] ❌ Could not find message bubble with ID: ${response.messageId}`);
        return;
    }

    // Check if the message bubble is still in the DOM
    if (!document.contains(messageBubble)) {
        console.warn(`[Translator] ⚠️ Message bubble ${response.messageId} is no longer in DOM (user navigated away)`);
        pendingTranslations.delete(response.messageId);
        return;
    }

    // Clean up the pending translation
    pendingTranslations.delete(response.messageId);
    
    messageBubble.removeAttribute(PROCESSING_ATTRIBUTE);
    messageBubble.setAttribute(TRANSLATION_ATTRIBUTE, 'true');
    
    // Find the correct insertion point
    const messageContent = messageBubble.querySelector(MESSAGE_CONTENT_SELECTOR);
    if (!messageContent) {
        console.error(`[Translator] ❌ Could not find .message-content in message bubble`);
        return;
    }

    const contentInner = messageContent.querySelector('.content-inner');
    if (!contentInner) {
        console.error(`[Translator] ❌ Could not find .content-inner in message-content`);
        return;
    }

    console.log(`[Translator] ✅ Found correct insertion point for ${response.messageId}`);

    // Remove any existing translation
    const existingTranslation = messageContent.querySelector('.translation-block');
    if (existingTranslation) {
        console.log('[Translator] 🗑️ Removing existing translation');
        existingTranslation.remove();
    }

    // Create the translation element
    const isError = !response.success;
    const translationDiv = document.createElement('div');
    translationDiv.className = `translation-block ${isError ? 'error' : ''} visible`;
    translationDiv.textContent = `🌐 ${isError ? `Translation error: ${response.error}` : response.translatedText}`;
    
    // Apply strong inline styles to ensure visibility
    translationDiv.style.cssText = `
        margin: 12px 16px !important;
        padding: 12px 16px !important;
        background: ${isError ? 'rgba(239, 68, 68, 0.2)' : 'rgba(102, 126, 234, 0.2)'} !important;
        border-left: 4px solid ${isError ? '#ef4444' : '#667eea'} !important;
        border-radius: 8px !important;
        font-size: 14px !important;
        font-style: italic !important;
        color: #ffffff !important;
        line-height: 1.5 !important;
        white-space: pre-wrap !important;
        word-wrap: break-word !important;
        text-align: left !important;
        display: block !important;
        opacity: 1 !important;
        visibility: visible !important;
        position: relative !important;
        z-index: 1000 !important;
        max-width: 100% !important;
        box-sizing: border-box !important;
        min-height: 20px !important;
        text-shadow: 0 1px 2px rgba(0, 0, 0, 0.5) !important;
        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2) !important;
    `;
    
    // Insert the translation right after the content-inner div
    try {
        contentInner.insertAdjacentElement('afterend', translationDiv);
        console.log(`[Translator] ✅ Successfully inserted translation for ${response.messageId}: "${response.translatedText}"`);
        
        // Force a repaint to make sure it's visible
        translationDiv.offsetHeight; // Force reflow
        
        // Add entrance animation
        setTimeout(() => {
            translationDiv.style.animation = 'slideInTranslation 0.4s ease-out';
        }, 50);
        
    } catch (error) {
        console.error(`[Translator] ❌ Error inserting translation:`, error);
    }
}

// === MESSAGE PROCESSING ===

/**
 * Process new messages in the chat
 */
function processNewMessages() {
    const messageContainers = document.querySelectorAll(MESSAGE_CONTAINER_SELECTOR);
    
    let processedCount = 0;
    messageContainers.forEach(container => {
        // Check if already processed (either translated or button shown)
        if (!container.hasAttribute(PROCESSING_ATTRIBUTE) && !container.hasAttribute(TRANSLATION_ATTRIBUTE)) {
            const messageContent = container.querySelector(MESSAGE_CONTENT_SELECTOR);
            if (messageContent && messageContent.querySelector(TEXT_CONTENT_SELECTOR)) {
                requestTranslation(container);
                processedCount++;
            }
        }
    });
    
    console.log(`[Translator] 📋 Processed ${processedCount} new messages`);
}

// === NAVIGATION HANDLING ===

/**
 * Reset translator state for navigation
 */
function resetTranslator() {
    console.log(`[Translator] 🔄 Resetting translator for new chat/navigation`);
    
    // Clear pending translations
    pendingTranslations.clear();
    
    // Clean up any existing translate buttons
    document.querySelectorAll('.translate-button').forEach(button => {
        button.remove();
    });
    
    // Reset counter
    messageCounter = 0;
    
    // Reset observer flag
    observerAttached = false;
    
    // Disconnect existing observers
    if (mainObserver) {
        mainObserver.disconnect();
        mainObserver = null;
    }
    
    // Re-initialize
    setTimeout(() => {
        initializeTranslator();
    }, 500);
}

/**
 * Detect navigation changes
 */
function detectNavigation() {
    const newChatId = getCurrentChatId();
    if (currentChatId && currentChatId !== newChatId) {
        console.log(`[Translator] 🧭 Navigation detected: ${currentChatId} → ${newChatId}`);
        currentChatId = newChatId;
        resetTranslator();
    } else {
        currentChatId = newChatId;
    }
}

// === EVENT HANDLERS ===

/**
 * Message listener for background script responses
 */
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.type === 'TRANSLATE_RESPONSE' || request.type === 'TRANSLATE_ERROR') {
        handleTranslationResponse(request);
    }
    return true;
});

// === OBSERVER SETUP ===

/**
 * Debounced message processing
 */
let debounceTimer;
const debouncedProcess = () => {
    clearTimeout(debounceTimer);
    debounceTimer = setTimeout(() => {
        detectNavigation(); // Check for navigation changes
        processNewMessages();
    }, 400);
};

/**
 * Initialize the translator system
 */
function initializeTranslator() {
    if (observerAttached) return;
    
    const rootElement = document.querySelector(ROOT_SELECTOR);
    if (rootElement) {
        console.log('%c[Translator] ✅ Root element found! Attaching observer.', 'color: green; font-weight: bold;');
        observerAttached = true;
        
        // Create main observer for message changes
        mainObserver = new MutationObserver(debouncedProcess);
        mainObserver.observe(rootElement, { childList: true, subtree: true });
        
        // Create navigation observer for major DOM changes
        navigationObserver = new MutationObserver((mutations) => {
            let majorChange = false;
            mutations.forEach(mutation => {
                // Check if major structural changes occurred
                if (mutation.type === 'childList' && mutation.addedNodes.length > 10) {
                    majorChange = true;
                }
            });
            
            if (majorChange) {
                console.log('[Translator] 🔄 Major DOM change detected, checking navigation...');
                detectNavigation();
            }
        });
        
        // Observe the entire body for major changes
        navigationObserver.observe(document.body, { childList: true, subtree: false });
        
        // Set initial chat ID
        currentChatId = getCurrentChatId();
        
        // Process initial messages
        setTimeout(processNewMessages, 500);
        
        if (checkInterval) clearInterval(checkInterval);
    } else {
        console.log('[Translator] ⏳ Still looking for root element...');
    }
}

// === INITIALIZATION ===

/**
 * Start initialization check
 */
const checkInterval = setInterval(initializeTranslator, 1000);

/**
 * Clean up on page unload
 */
window.addEventListener('beforeunload', () => {
    if (mainObserver) mainObserver.disconnect();
    if (navigationObserver) navigationObserver.disconnect();
    clearInterval(checkInterval);
});

// === DEBUG FUNCTIONS ===

/**
 * Manual test function for debugging
 */
window.testTranslationInsertion = () => {
    console.log('[Translator] 🧪 Running manual insertion test...');
    const messages = document.querySelectorAll(MESSAGE_CONTAINER_SELECTOR);
    
    if (messages.length > 0) {
        const firstMessage = messages[0];
        const messageContent = firstMessage.querySelector(MESSAGE_CONTENT_SELECTOR);
        const contentInner = messageContent?.querySelector('.content-inner');
        
        if (contentInner) {
            // Test based on current service
            chrome.storage.sync.get(['translationService'], (result) => {
                const service = result.translationService || 'google_translate';
                
                if (service === 'google_translate') {
                    // Create a test translation
                    const testDiv = document.createElement('div');
                    testDiv.className = 'translation-block test visible';
                    testDiv.textContent = '🌐 TEST TRANSLATION - Auto-translation test successful!';
                    testDiv.style.cssText = `
                        margin: 12px 16px !important;
                        padding: 12px 16px !important;
                        background-color: rgba(255, 165, 0, 0.2) !important;
                        border-left: 4px solid orange !important;
                        border-radius: 8px !important;
                        font-size: 14px !important;
                        color: orange !important;
                        display: block !important;
                        border: 1px solid orange !important;
                    `;
                    
                    contentInner.insertAdjacentElement('afterend', testDiv);
                    console.log('✅ Test auto-translation inserted!');
                    
                    // Remove it after 5 seconds
                    setTimeout(() => {
                        testDiv.remove();
                        console.log('🗑️ Test translation removed');
                    }, 5000);
                } else {
                    // Create a test translate button
                    const serviceName = service === 'gemini_pro' ? 'Gemini 2.5 Pro' : 
                                       service === 'gemini_flash' ? 'Gemini 2.0 Flash' : 
                                       'Mistral AI';
                    const serviceIcon = service === 'gemini_pro' ? '🧠' :
                                       service === 'gemini_flash' ? '⚡' : 
                                       '🚀';
                    
                    const testButton = document.createElement('div');
                    testButton.className = 'translate-button test';
                    testButton.innerHTML = `
                        <button class="translate-btn">
                            ${serviceIcon} TEST BUTTON - ${serviceName}
                        </button>
                    `;
                    
                    testButton.style.cssText = `
                        margin: 8px 16px !important;
                        display: block !important;
                        opacity: 1 !important;
                        visibility: visible !important;
                    `;
                    
                    const button = testButton.querySelector('.translate-btn');
                    button.style.cssText = `
                        width: 100% !important;
                        padding: 10px 16px !important;
                        background: linear-gradient(135deg, orange 0%, darkorange 100%) !important;
                        color: white !important;
                        border: none !important;
                        border-radius: 8px !important;
                        font-size: 13px !important;
                        font-weight: 600 !important;
                        cursor: pointer !important;
                    `;
                    
                    contentInner.insertAdjacentElement('afterend', testButton);
                    console.log(`✅ Test translate button for ${serviceName} inserted!`);
                    
                    // Remove it after 5 seconds
                    setTimeout(() => {
                        testButton.remove();
                        console.log('🗑️ Test button removed');
                    }, 5000);
                }
            });
        } else {
            console.log('❌ Could not find content-inner');
        }
    }
};

/**
 * Debug information function
 */
window.debugTranslator = () => {
    console.log('[Translator] 🔍 Debug Info:');
    console.log('Current Chat ID:', currentChatId);
    console.log('Observer Attached:', observerAttached);
    console.log('Pending Translations:', pendingTranslations.size);
    console.log('Message Counter:', messageCounter);
    console.log('Main Observer:', !!mainObserver);
    console.log('Navigation Observer:', !!navigationObserver);
    
    // Check current service
    chrome.storage.sync.get(['translationService'], (result) => {
        console.log('Current Service:', result.translationService || 'google_translate');
    });
    
    // Count existing elements
    const messages = document.querySelectorAll(MESSAGE_CONTAINER_SELECTOR);
    const translations = document.querySelectorAll('.translation-block');
    const buttons = document.querySelectorAll('.translate-button');
    
    console.log('Messages found:', messages.length);
    console.log('Translations visible:', translations.length);
    console.log('Translate buttons visible:', buttons.length);
};

// === CONSOLE WELCOME MESSAGE ===
console.log('%c[Translator] 🌟 Smart Translation System Ready!', 'color: #667eea; font-weight: bold; font-size: 14px;');
console.log('%c[Translator] 🔤 Google Translate: Auto-translation', 'color: #34a853;');
console.log('%c[Translator] ⚡ Gemini 2.0 Flash: Smart buttons (speed)', 'color: #34a853;');
console.log('%c[Translator] 🧠 Gemini 2.5 Pro: Smart buttons (quality)', 'color: #4285f4;');
console.log('%c[Translator] 🚀 Mistral AI: Smart buttons (free)', 'color: #ff6b35;');
console.log('%c[Translator] 🛠️ Debug: testTranslationInsertion() | debugTranslator()', 'color: #666;');
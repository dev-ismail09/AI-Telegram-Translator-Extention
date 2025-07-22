// --- BACKGROUND.JS - THE RESILIENT WORKER (WITH QUAD AI SUPPORT) ---
console.log("Background service worker started.");

// --- Gemini API Sections (dual model support) ---

// --- Gemini 2.5 Pro Section ---
async function performGemini25ProTranslation(text, targetLanguage) {
    try {
        // Get API key from storage
        const result = await chrome.storage.sync.get(['geminiApiKey']);
        const apiKey = result.geminiApiKey;
        
        if (!apiKey) {
            throw new Error('Gemini API key not found. Please add your API key in the extension settings.');
        }
        
        // Use fetch to call Gemini API directly with the 2.5 Pro model
        const response = await fetch('https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-pro:generateContent?key=' + apiKey, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                contents: [{
                    parts: [{
                        text: `Translate this text to ${getLanguageName(targetLanguage)}. Preserve the original tone and context. Return only the translation without any explanations:\n\n${text}`
                    }]
                }],
                generationConfig: {
                    temperature: 0.1,
                    maxOutputTokens: 2000,
                    topP: 0.8,
                    topK: 40
                }
            })
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => null);
            if (response.status === 400) {
                throw new Error('Invalid Gemini API Key. Please check your API key in extension settings.');
            } else if (response.status === 429) {
                throw new Error('Gemini API quota exceeded. Please try again later.');
            } else if (response.status === 403) {
                throw new Error('Gemini API access denied. Please check your API key permissions.');
            }
            throw new Error(`Gemini API error: ${response.status} ${response.statusText}`);
        }

        const data = await response.json();
        
        if (data.candidates && data.candidates[0] && data.candidates[0].content && data.candidates[0].content.parts[0]) {
            return data.candidates[0].content.parts[0].text.trim();
        } else {
            console.error('Unexpected Gemini response format:', data);
            throw new Error('Unexpected response format from Gemini API');
        }
        
    } catch (error) {
        console.error('Gemini 2.5 Pro Translation API error:', error);
        throw error;
    }
}

// --- Gemini 2.0 Flash Section ---
async function performGemini20FlashTranslation(text, targetLanguage) {
    try {
        // Get API key from storage
        const result = await chrome.storage.sync.get(['geminiApiKey']);
        const apiKey = result.geminiApiKey;
        
        if (!apiKey) {
            throw new Error('Gemini API key not found. Please add your API key in the extension settings.');
        }
        
        // Use fetch to call Gemini API directly with the 2.0 Flash model
        const response = await fetch('https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=' + apiKey, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                contents: [{
                    parts: [{
                        text: `Translate this text to ${getLanguageName(targetLanguage)}. Preserve the original tone and context. Return only the translation without any explanations:\n\n${text}`
                    }]
                }],
                generationConfig: {
                    temperature: 0.1,
                    maxOutputTokens: 2000,
                    topP: 0.8,
                    topK: 40
                }
            })
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => null);
            if (response.status === 400) {
                throw new Error('Invalid Gemini API Key. Please check your API key in extension settings.');
            } else if (response.status === 429) {
                throw new Error('Gemini API quota exceeded. Please try again later.');
            } else if (response.status === 403) {
                throw new Error('Gemini API access denied. Please check your API key permissions.');
            }
            throw new Error(`Gemini API error: ${response.status} ${response.statusText}`);
        }

        const data = await response.json();
        
        if (data.candidates && data.candidates[0] && data.candidates[0].content && data.candidates[0].content.parts[0]) {
            return data.candidates[0].content.parts[0].text.trim();
        } else {
            console.error('Unexpected Gemini response format:', data);
            throw new Error('Unexpected response format from Gemini API');
        }
        
    } catch (error) {
        console.error('Gemini 2.0 Flash Translation API error:', error);
        throw error;
    }
}

// --- Mistral AI Section (via OpenRouter - Free) ---
async function performMistralTranslation(text, targetLanguage) {
    try {
        // Get API key from storage (optional for free tier)
        const result = await chrome.storage.sync.get(['openrouterApiKey']);
        const apiKey = result.openrouterApiKey || '';
        
        const headers = {
            'Content-Type': 'application/json',
            'HTTP-Referer': 'https://telegram-translator.extension',
            'X-Title': 'Telegram Translator'
        };
        
        // Add authorization header if API key is provided
        if (apiKey) {
            headers['Authorization'] = `Bearer ${apiKey}`;
        }
        
        const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
            method: 'POST',
            headers: headers,
            body: JSON.stringify({
                model: apiKey ? 'mistralai/mistral-7b-instruct' : 'mistralai/mistral-7b-instruct:free',
                messages: [{
                    role: 'user',
                    content: `Translate this text to ${getLanguageName(targetLanguage)}. Preserve the original tone and context. Return only the translation without any explanations:\n\n${text}`
                }],
                max_tokens: 2000,
                temperature: 0.1,
                top_p: 0.9
            })
        });

        if (!response.ok) {
            if (response.status === 400) {
                throw new Error('Invalid request format for Mistral API');
            } else if (response.status === 401) {
                throw new Error('Invalid OpenRouter API key. Check your key or use without one for free tier.');
            } else if (response.status === 429) {
                throw new Error('Mistral API rate limit exceeded. Please try again later.');
            } else if (response.status === 503) {
                throw new Error('Mistral service temporarily unavailable. Please try again.');
            }
            throw new Error(`Mistral API error: ${response.status} ${response.statusText}`);
        }

        const data = await response.json();
        
        if (data.choices && data.choices[0] && data.choices[0].message && data.choices[0].message.content) {
            return data.choices[0].message.content.trim();
        } else {
            console.error('Unexpected Mistral response format:', data);
            throw new Error('Unexpected response format from Mistral API');
        }
        
    } catch (error) {
        console.error('Mistral Translation API error:', error);
        throw error;
    }
}

// --- Google Translate (Public) Section ---
async function performGoogleTranslate(text, targetLanguage) {
    const url = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=auto&tl=${targetLanguage}&dt=t&q=${encodeURIComponent(text)}`;
    try {
        const response = await fetch(url);
        if (!response.ok) throw new Error(`Network response was not ok, status: ${response.status}`);
        const data = await response.json();
        
        if (data && data[0]) {
            // Join the translated parts into a single string
            return data[0].map(sentence => sentence[0]).join('');
        }
        throw new Error('Invalid response format from Google Translate API.');
    } catch (error) {
        console.error('Google Translate error:', error);
        throw new Error(`Google Translate failed: ${error.message}`);
    }
}

// --- Shared Logic ---
async function getSettings() {
  const defaults = { 
    targetLanguage: 'en', 
    translationService: 'google_translate',
    geminiApiKey: '',
    openrouterApiKey: ''
  };
  try {
    const result = await chrome.storage.sync.get(defaults);
    return result;
  } catch (error) {
    console.error('Error getting settings, using defaults:', error);
    return defaults;
  }
}

function getLanguageName(code) {
  const languages = {
    'af': 'Afrikaans', 'sq': 'Albanian', 'am': 'Amharic', 'ar': 'Arabic', 'hy': 'Armenian',
    'az': 'Azerbaijani', 'eu': 'Basque', 'be': 'Belarusian', 'bn': 'Bengali', 'bs': 'Bosnian',
    'bg': 'Bulgarian', 'ca': 'Catalan', 'ceb': 'Cebuano', 'ny': 'Chichewa', 'zh-CN': 'Chinese (Simplified)',
    'zh-TW': 'Chinese (Traditional)', 'co': 'Corsican', 'hr': 'Croatian', 'cs': 'Czech', 'da': 'Danish',
    'nl': 'Dutch', 'en': 'English', 'eo': 'Esperanto', 'et': 'Estonian', 'tl': 'Filipino',
    'fi': 'Finnish', 'fr': 'French', 'fy': 'Frisian', 'gl': 'Galician', 'ka': 'Georgian',
    'de': 'German', 'el': 'Greek', 'gu': 'Gujarati', 'ht': 'Haitian Creole', 'ha': 'Hausa',
    'haw': 'Hawaiian', 'iw': 'Hebrew', 'hi': 'Hindi', 'hmn': 'Hmong', 'hu': 'Hungarian',
    'is': 'Icelandic', 'ig': 'Igbo', 'id': 'Indonesian', 'ga': 'Irish', 'it': 'Italian',
    'ja': 'Japanese', 'jw': 'Javanese', 'kn': 'Kannada', 'kk': 'Kazakh', 'km': 'Khmer',
    'ko': 'Korean', 'ku': 'Kurdish', 'ky': 'Kyrgyz', 'lo': 'Lao', 'la': 'Latin',
    'lv': 'Latvian', 'lt': 'Lithuanian', 'lb': 'Luxembourgish', 'mk': 'Macedonian', 'mg': 'Malagasy',
    'ms': 'Malay', 'ml': 'Malayalam', 'mt': 'Maltese', 'mi': 'Maori', 'mr': 'Marathi',
    'mn': 'Mongolian', 'my': 'Myanmar', 'ne': 'Nepali', 'no': 'Norwegian', 'ps': 'Pashto',
    'fa': 'Persian', 'pl': 'Polish', 'pt': 'Portuguese', 'pa': 'Punjabi', 'ro': 'Romanian',
    'ru': 'Russian', 'sm': 'Samoan', 'gd': 'Scots Gaelic', 'sr': 'Serbian', 'st': 'Sesotho',
    'sn': 'Shona', 'sd': 'Sindhi', 'si': 'Sinhala', 'sk': 'Slovak', 'sl': 'Slovenian',
    'so': 'Somali', 'es': 'Spanish', 'su': 'Sundanese', 'sw': 'Swahili', 'sv': 'Swedish',
    'tg': 'Tajik', 'ta': 'Tamil', 'te': 'Telugu', 'th': 'Thai', 'tr': 'Turkish',
    'uk': 'Ukrainian', 'ur': 'Urdu', 'uz': 'Uzbek', 'vi': 'Vietnamese', 'cy': 'Welsh',
    'xh': 'Xhosa', 'yi': 'Yiddish', 'yo': 'Yoruba', 'zu': 'Zulu'
  };
  return languages[code] || code;
}

// Main message listener
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.type === 'TRANSLATE_REQUEST') {
    (async () => {
      // --- START: USAGE TRACKING LOGIC ---
      try {
        const { translationCount = 0 } = await chrome.storage.sync.get('translationCount');
        const newCount = translationCount + 1;
        await chrome.storage.sync.set({ translationCount: newCount });
        console.log(`[Usage Tracker] Translation count: ${newCount}`);
      } catch (e) {
        console.error("Error updating translation count", e);
      }
      let translationFunction;
      try {
        const { targetLanguage, translationService } = await getSettings();
        
        const serviceName = translationService === 'gemini_pro' ? 'Gemini 2.5 Pro' : 
                          translationService === 'gemini_flash' ? 'Gemini 2.0 Flash' :
                          translationService === 'mistral' ? 'Mistral AI (OpenRouter)' : 
                          'Google Translate';
        console.log(`Job received. Service: ${serviceName}, Lang: ${targetLanguage} (${getLanguageName(targetLanguage)})`);

        if (translationService === 'gemini_pro') {
            translationFunction = performGemini25ProTranslation;
        } else if (translationService === 'gemini_flash') {
            translationFunction = performGemini20FlashTranslation;
        } else if (translationService === 'mistral') {
            translationFunction = performMistralTranslation;
        } else {
            translationFunction = performGoogleTranslate;
        }
        
        const translatedText = await translationFunction(request.text, targetLanguage);

        console.log(`[Translator] Sending response for messageId ${request.messageId}: "${translatedText}"`);

        sendResponse({
          type: 'TRANSLATE_RESPONSE',
          messageId: request.messageId,
          translatedText: translatedText,
          success: true
        });

      } catch (error) {
        console.error("Translation failed:", error);
        sendResponse({
          type: 'TRANSLATE_ERROR',
          messageId: request.messageId,
          error: error.message,
          success: false
        });
      }
    })();
    return true; // Indicate async response
  }
});

console.log("Background service worker listener attached.");
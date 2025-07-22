document.addEventListener('DOMContentLoaded', async () => {
    // --- START: DONATION LOGIC CONSTANTS ---
    const DONATION_THRESHOLD = 50; // Show alert after 50 translations
    const DONATION_COOLDOWN_DAYS = 7; // Remind again after 7 days
    // --- END: DONATION LOGIC CONSTANTS ---

    // Get all UI elements
    const donationAlert = document.getElementById('donation-alert');
    const closeDonationAlert = document.getElementById('close-donation-alert');
    // Get all UI elements
    const serviceSelect = document.getElementById('service-select');
    const saveButton = document.getElementById('save-button');
    const status = document.getElementById('status');
    const languageSearch = document.getElementById('language-search');
    const languageList = document.getElementById('language-list');
    const apiKeySection = document.getElementById('api-key-section');
    const apiKeyInput = document.getElementById('api-key-input');
    const toggleApiKey = document.getElementById('toggle-api-key');
    const testApiKey = document.getElementById('test-api-key');
    const langChips = document.querySelectorAll('.lang-chip');
    
    let selectedLanguage = 'en';
    let allLanguageOptions = Array.from(document.querySelectorAll('.language-option'));
    
    // Initialize UI animations
    setTimeout(() => {
        document.body.style.opacity = '1';
    }, 100);
    
    // Toggle API key visibility
    toggleApiKey.addEventListener('click', () => {
        if (apiKeyInput.type === 'password') {
            apiKeyInput.type = 'text';
            toggleApiKey.textContent = '🙈';
            toggleApiKey.style.transform = 'translateY(-50%) scale(1.1)';
        } else {
            apiKeyInput.type = 'password';
            toggleApiKey.textContent = '👁️';
            toggleApiKey.style.transform = 'translateY(-50%) scale(1)';
        }
    });
    
    // Show/hide API key section with smooth animation
    const toggleApiKeySection = (service) => {
        if (service === 'gemini_flash') {
            apiKeySection.classList.remove('hidden');
            document.querySelector('.api-key-section .form-label').innerHTML = `
                🔑 Gemini API Key
                <span class="feature-badge">⚡ 2.0 Flash</span>
            `;
            document.querySelector('.api-info').innerHTML = `
                ℹ️ Get your free API key from 
                <a href="https://aistudio.google.com/app/apikey" target="_blank">Google AI Studio</a>
                <br>
                <span style="color: #059669; font-weight: 600;">⚡ Gemini 2.0 Flash: Fastest responses</span>
            `;
            apiKeyInput.placeholder = "Enter your Gemini API key...";
            setTimeout(() => {
                apiKeySection.style.maxHeight = '300px';
                apiKeySection.style.opacity = '1';
            }, 50);
        } else if (service === 'gemini_pro') {
            apiKeySection.classList.remove('hidden');
            document.querySelector('.api-key-section .form-label').innerHTML = `
                🔑 Gemini API Key
                <span class="feature-badge">🧠 2.5 Pro</span>
            `;
            document.querySelector('.api-info').innerHTML = `
                ℹ️ Get your free API key from 
                <a href="https://aistudio.google.com/app/apikey" target="_blank">Google AI Studio</a>
                <br>
                <span style="color: #059669; font-weight: 600;">🧠 Gemini 2.5 Pro: Best reasoning & quality</span>
            `;
            apiKeyInput.placeholder = "Enter your Gemini API key...";
            setTimeout(() => {
                apiKeySection.style.maxHeight = '300px';
                apiKeySection.style.opacity = '1';
            }, 50);
        } else if (service === 'mistral') {
            apiKeySection.classList.remove('hidden');
            document.querySelector('.api-key-section .form-label').innerHTML = `
                🔑 OpenRouter API Key (Optional)
                <span class="feature-badge">🚀 Free</span>
            `;
            document.querySelector('.api-info').innerHTML = `
                ℹ️ Get your free API key from 
                <a href="https://openrouter.ai/keys" target="_blank">OpenRouter</a>
                <br>
                <span style="color: #059669; font-weight: 600;">🆓 Completely free • High-quality Mistral AI</span>
            `;
            apiKeyInput.placeholder = "Enter OpenRouter API key (optional for free tier)...";
            setTimeout(() => {
                apiKeySection.style.maxHeight = '300px';
                apiKeySection.style.opacity = '1';
            }, 50);
        } else {
            apiKeySection.style.maxHeight = '0';
            apiKeySection.style.opacity = '0';
            setTimeout(() => {
                apiKeySection.classList.add('hidden');
            }, 300);
        }
    };
    
    // Load saved settings
    const loadSettings = async () => {
        try {
            const result = await chrome.storage.sync.get(['targetLanguage', 'translationService', 'geminiApiKey', 'openrouterApiKey']);
            
            if (result.targetLanguage) {
                selectedLanguage = result.targetLanguage;
                updateLanguageSelection(selectedLanguage);
            }
            
            if (result.translationService) {
                serviceSelect.value = result.translationService;
                toggleApiKeySection(result.translationService);
            }
            
            // Load appropriate API key based on service
            if ((result.translationService === 'gemini_flash' || result.translationService === 'gemini_pro') && result.geminiApiKey) {
                apiKeyInput.value = result.geminiApiKey;
                validateApiKeyFormat(result.geminiApiKey);
            } else if (result.translationService === 'mistral' && result.openrouterApiKey) {
                apiKeyInput.value = result.openrouterApiKey;
                validateApiKeyFormat(result.openrouterApiKey);
            }
        } catch (error) {
            console.error('Error loading settings:', error);
            showStatus('Error loading settings', 'error');
        }
    };
    
	// --- START: NEW FUNCTION TO HANDLE DONATION ALERT ---
    const checkAndShowDonationAlert = async () => {
        try {
            const { translationCount = 0, lastDonationAlertTimestamp = 0 } = await chrome.storage.sync.get(['translationCount', 'lastDonationAlertTimestamp']);

            const cooldownPeriod = DONATION_COOLDOWN_DAYS * 24 * 60 * 60 * 1000;
            const isCooldownOver = (Date.now() - lastDonationAlertTimestamp) > cooldownPeriod;

            console.log(`Translations: ${translationCount}, Cooldown Over: ${isCooldownOver}`);

            if (translationCount > DONATION_THRESHOLD && isCooldownOver) {
                donationAlert.classList.remove('hidden');
            }

        } catch (e) {
            console.error("Error checking donation status", e);
        }
    };

    closeDonationAlert.addEventListener('click', () => {
        donationAlert.classList.add('hidden');
        // Store the current time so we don't show the alert again for a while
        chrome.storage.sync.set({ lastDonationAlertTimestamp: Date.now() });
        console.log("Donation alert dismissed. Will remind later.");
    });
	
    // Save settings
    const saveSettings = async () => {
        try {
            const selectedService = serviceSelect.value;
            const apiKey = apiKeyInput.value.trim();
            
            const settings = { 
                targetLanguage: selectedLanguage,
                translationService: selectedService 
            };
            
            // Validate API keys if needed
            if (selectedService === 'gemini_flash' || selectedService === 'gemini_pro') {
                if (!apiKey) {
                    const modelName = selectedService === 'gemini_flash' ? 'Gemini 2.0 Flash' : 'Gemini 2.5 Pro';
                    showStatus(`Please enter your ${modelName} API key!`, 'error');
                    apiKeyInput.focus();
                    apiKeyInput.style.borderColor = '#ef4444';
                    return false;
                }
                settings.geminiApiKey = apiKey;
            } else if (selectedService === 'mistral') {
                // OpenRouter API key is optional for free tier
                if (apiKey) {
                    settings.openrouterApiKey = apiKey;
                }
            }
            
            await chrome.storage.sync.set(settings);
            return true;
        } catch (error) {
            console.error('Error saving settings:', error);
            return false;
        }
    };

    // Show status with beautiful animations
    const showStatus = (message, type = 'success') => {
        status.textContent = message;
        status.className = `status ${type} visible`;
        
        // Add appropriate icon
        const icon = type === 'success' ? '✅' : '❌';
        status.innerHTML = `${icon} ${message}`;
        
        // Auto-hide after 3 seconds
        setTimeout(() => {
            status.classList.remove('visible');
        }, 3000);
    };

    // Update language selection in UI
    const updateLanguageSelection = (langCode) => {
        selectedLanguage = langCode;
        
        // Update chips
        langChips.forEach(chip => {
            if (chip.dataset.lang === langCode) {
                chip.classList.add('active');
            } else {
                chip.classList.remove('active');
            }
        });
        
        // Update language list
        allLanguageOptions.forEach(option => {
            if (option.dataset.value === langCode) {
                option.classList.add('selected');
                // Scroll to selected option
                option.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
            } else {
                option.classList.remove('selected');
            }
        });
    };

    // Validate API key format
    const validateApiKeyFormat = (apiKey) => {
        const selectedService = serviceSelect.value;
        
        if (apiKey.length > 0) {
            if (selectedService === 'gemini_flash' || selectedService === 'gemini_pro') {
                // Gemini keys start with 'AIza'
                if (apiKey.startsWith('AIza') && apiKey.length > 35) {
                    apiKeyInput.style.borderColor = '#10b981';
                    return true;
                } else {
                    apiKeyInput.style.borderColor = '#f59e0b';
                    return false;
                }
            } else if (selectedService === 'mistral') {
                // OpenRouter keys start with 'sk-or-'
                if (apiKey.startsWith('sk-or-') && apiKey.length > 20) {
                    apiKeyInput.style.borderColor = '#10b981';
                    return true;
                } else {
                    apiKeyInput.style.borderColor = '#f59e0b';
                    return false;
                }
            }
        } else {
            apiKeyInput.style.borderColor = '#f59e0b';
            return false;
        }
    };

    // Filter languages based on search
    const filterLanguages = (searchTerm) => {
        const filtered = allLanguageOptions.filter(option => {
            const text = option.textContent.toLowerCase();
            const value = option.dataset.value.toLowerCase();
            return text.includes(searchTerm.toLowerCase()) || value.includes(searchTerm.toLowerCase());
        });
        
        // Hide all options first
        allLanguageOptions.forEach(option => {
            option.style.display = 'none';
        });
        
        // Show filtered options with animation
        filtered.forEach((option, index) => {
            option.style.display = 'block';
            option.style.animationDelay = `${index * 20}ms`;
            option.style.animation = 'slideUp 0.3s ease-out forwards';
        });
        
        // Show "no results" if empty
        if (filtered.length === 0) {
            languageList.innerHTML = '<div class="language-option" style="color: #9ca3af; font-style: italic;">No languages found</div>';
        } else if (searchTerm === '') {
            // Reset to original
            languageList.innerHTML = '';
            allLanguageOptions.forEach(option => {
                languageList.appendChild(option);
                option.style.display = 'block';
            });
        }
    };

    // Event Listeners
    
    // Service selection
    serviceSelect.addEventListener('change', async () => {
        const selectedService = serviceSelect.value;
        toggleApiKeySection(selectedService);
        
        // Load appropriate API key when switching services
        const result = await chrome.storage.sync.get(['geminiApiKey', 'openrouterApiKey']);
        
        if ((selectedService === 'gemini_flash' || selectedService === 'gemini_pro') && result.geminiApiKey) {
            apiKeyInput.value = result.geminiApiKey;
            validateApiKeyFormat(result.geminiApiKey);
        } else if (selectedService === 'mistral' && result.openrouterApiKey) {
            apiKeyInput.value = result.openrouterApiKey;
            validateApiKeyFormat(result.openrouterApiKey);
        } else {
            apiKeyInput.value = '';
            apiKeyInput.style.borderColor = '#f59e0b';
        }
        
        // Add visual feedback
        serviceSelect.style.transform = 'scale(1.02)';
        setTimeout(() => {
            serviceSelect.style.transform = 'scale(1)';
        }, 200);
        
        if (selectedService === 'google_translate') {
            if (await saveSettings()) {
                showStatus('Switched to Google Translate! 🚀');
            }
        } else if (selectedService === 'gemini_flash') {
            showStatus('Enter your Gemini API key for 2.0 Flash ⚡');
        } else if (selectedService === 'gemini_pro') {
            showStatus('Enter your Gemini API key for 2.5 Pro 🧠');
        } else if (selectedService === 'mistral') {
            showStatus('Mistral AI ready! API key optional for free tier 🆓');
        }
    });

    // Language search
    languageSearch.addEventListener('input', (e) => {
        const searchTerm = e.target.value.trim();
        filterLanguages(searchTerm);
    });

    // Language chips
    langChips.forEach(chip => {
        chip.addEventListener('click', async () => {
            const langCode = chip.dataset.lang;
            updateLanguageSelection(langCode);
            
            // Visual feedback
            chip.style.transform = 'scale(1.1)';
            setTimeout(() => {
                chip.style.transform = 'scale(1)';
            }, 200);
            
            if (await saveSettings()) {
                const langName = chip.textContent;
                showStatus(`Language set to ${langName}! 🌍`);
            }
        });
    });

    // Language list options
    languageList.addEventListener('click', async (e) => {
        if (e.target.classList.contains('language-option')) {
            const langCode = e.target.dataset.value;
            if (langCode) {
                updateLanguageSelection(langCode);
                
                // Visual feedback
                e.target.style.transform = 'scale(1.02)';
                setTimeout(() => {
                    e.target.style.transform = 'scale(1)';
                }, 200);
                
                if (await saveSettings()) {
                    const langName = e.target.textContent;
                    showStatus(`Language updated to ${langName}! 🎯`);
                }
            }
        }
    });

    // API key validation
    apiKeyInput.addEventListener('input', () => {
        const apiKey = apiKeyInput.value.trim();
        validateApiKeyFormat(apiKey);
    });

    // API key testing
    testApiKey.addEventListener('click', async () => {
        const apiKey = apiKeyInput.value.trim();
        const selectedService = serviceSelect.value;
        
        if (selectedService === 'mistral' && !apiKey) {
            showStatus('Mistral works without API key! 🆓', 'success');
            return;
        }
        
        if (!apiKey) {
            showStatus('Please enter an API key first! 🔑', 'error');
            apiKeyInput.focus();
            return;
        }

        // UI feedback
        testApiKey.disabled = true;
        testApiKey.innerHTML = '🔄 Testing API Key...';
        testApiKey.style.background = 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)';
        
        try {
            let response;
            
            if (selectedService === 'gemini_flash') {
                response = await fetch('https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=' + apiKey, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        contents: [{
                            parts: [{
                                text: 'Translate "Hello" to Spanish. Only return the translation.'
                            }]
                        }],
                        generationConfig: {
                            temperature: 0.1,
                            maxOutputTokens: 10,
                        }
                    })
                });
            } else if (selectedService === 'gemini_pro') {
                response = await fetch('https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-pro:generateContent?key=' + apiKey, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        contents: [{
                            parts: [{
                                text: 'Translate "Hello" to Spanish. Only return the translation.'
                            }]
                        }],
                        generationConfig: {
                            temperature: 0.1,
                            maxOutputTokens: 10,
                        }
                    })
                });
            } else if (selectedService === 'mistral') {
                response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${apiKey}`,
                        'Content-Type': 'application/json',
                        'HTTP-Referer': 'https://telegram-translator.extension',
                        'X-Title': 'Telegram Translator'
                    },
                    body: JSON.stringify({
                        model: 'mistralai/mistral-7b-instruct:free',
                        messages: [{
                            role: 'user',
                            content: 'Translate "Hello" to Spanish. Only return the translation.'
                        }],
                        max_tokens: 10,
                        temperature: 0.1
                    })
                });
            }

            if (response.ok) {
                const data = await response.json();
                let hasValidResponse = false;
                
                if (selectedService === 'gemini_flash' || selectedService === 'gemini_pro') {
                    hasValidResponse = data.candidates && data.candidates[0];
                } else if (selectedService === 'mistral') {
                    hasValidResponse = data.choices && data.choices[0];
                }
                
                if (hasValidResponse) {
                    showStatus('✅ API key is working perfectly! ✨');
                    apiKeyInput.style.borderColor = '#10b981';
                    testApiKey.style.background = 'linear-gradient(135deg, #10b981 0%, #059669 100%)';
                } else {
                    throw new Error('Unexpected response format');
                }
            } else if (response.status === 400) {
                showStatus('❌ Invalid API key format', 'error');
                apiKeyInput.style.borderColor = '#f44336';
            } else if (response.status === 403) {
                showStatus('❌ API key access denied', 'error');
                apiKeyInput.style.borderColor = '#f44336';
            } else if (response.status === 429) {
                showStatus('⚠️ API quota exceeded, but key is valid', false);
                apiKeyInput.style.borderColor = '#ff9800';
            } else {
                throw new Error(`HTTP ${response.status}`);
            }
        } catch (error) {
            console.error('API key test failed:', error);
            showStatus(`❌ API test failed: ${error.message}`, 'error');
            apiKeyInput.style.borderColor = '#ef4444';
        } finally {
            testApiKey.disabled = false;
            testApiKey.innerHTML = '🧪 Test API Key';
            testApiKey.style.background = 'linear-gradient(135deg, #10b981 0%, #059669 100%)';
        }
    });

    // Save button
    saveButton.addEventListener('click', async () => {
        // Visual feedback
        saveButton.style.transform = 'scale(0.98)';
        saveButton.innerHTML = '💾 Saving...';
        
        if (await saveSettings()) {
            showStatus('Settings saved successfully! 🎉');
            saveButton.innerHTML = '✅ Saved!';
            setTimeout(() => {
                saveButton.innerHTML = '💾 Save Settings';
            }, 1500);
        } else {
            showStatus('Failed to save settings 😞', 'error');
            saveButton.innerHTML = '❌ Error';
            setTimeout(() => {
                saveButton.innerHTML = '💾 Save Settings';
            }, 1500);
        }
        
        setTimeout(() => {
            saveButton.style.transform = 'scale(1)';
        }, 200);
    });

    // Keyboard shortcuts
    document.addEventListener('keydown', (e) => {
        // Ctrl/Cmd + S to save
        if ((e.ctrlKey || e.metaKey) && e.key === 's') {
            e.preventDefault();
            saveButton.click();
        }
        
        // Ctrl/Cmd + F to focus search
        if ((e.ctrlKey || e.metaKey) && e.key === 'f') {
            e.preventDefault();
            languageSearch.focus();
        }
        
        // Escape to clear search
        if (e.key === 'Escape') {
            languageSearch.value = '';
            filterLanguages('');
            languageSearch.blur();
        }
    });

    // Add hover effects for better interactivity
    const addHoverEffects = () => {
        // Cards hover effect
        document.querySelectorAll('.card').forEach(card => {
            card.addEventListener('mouseenter', () => {
                card.style.transform = 'translateY(-2px)';
            });
            card.addEventListener('mouseleave', () => {
                card.style.transform = 'translateY(0)';
            });
        });
        
        // Language options hover
        allLanguageOptions.forEach(option => {
            option.addEventListener('mouseenter', () => {
                if (!option.classList.contains('selected')) {
                    option.style.background = 'linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%)';
                }
            });
            option.addEventListener('mouseleave', () => {
                if (!option.classList.contains('selected')) {
                    option.style.background = '';
                }
            });
        });
    };

    // Initialize
    await loadSettings();
    await checkAndShowDonationAlert(); // Call the new function
    addHoverEffects();
    
    // Welcome animation
    setTimeout(() => {
        showStatus('Welcome to Telegram Translator! 🌟');
    }, 500);
});
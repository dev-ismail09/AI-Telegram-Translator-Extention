# 🤖 Telegram AI Translator - Chrome Extension

A powerful, feature-rich Chrome extension that provides instant, AI-powered translations directly within the Telegram Web interface. Supports multiple leading translation services including Google Translate, Gemini 2.0 Flash, Gemini 2.5 Pro, and Mistral AI.

---

### ✨ Live Demo



![Demo GIF showing the extension in action: popup settings, translate button appearing, and translation block showing up](link_to_your_demo.gif)

---

### 🚀 Key Features

*   **Multi-API Support:** Choose your preferred translation engine:
    *   🔤 **Google Translate:** Fast, free, and automatic translations.
    *   ⚡ **Gemini 2.0 Flash:** High-speed, quality translations with your own API key.
    *   🧠 **Gemini 2.5 Pro:** Superior reasoning and translation quality with your API key.
    *   🚀 **Mistral AI:** High-quality translations available for free via OpenRouter.
*   **Smart UI:**
    *   **Auto-translation** for free services.
    *   **Click-to-Translate** buttons for API-based services to save costs.
*   **Polished Interface:** A beautiful and intuitive popup for managing settings.
*   **Customizable:** Select from over 100 target languages.
*   **Secure:** API keys are stored securely using `chrome.storage.sync`.
*   **Error Handling:** Clear error messages for invalid API keys or network issues.

---

### 📥 How to Install

1.  **Download:** Download this repository as a ZIP file and extract it to a local folder.
2.  **Open Chrome Extensions:** Open Chrome and navigate to `chrome://extensions`.
3.  **Enable Developer Mode:** Turn on the "Developer mode" toggle in the top-right corner.
4.  **Load Unpacked:** Click on "Load unpacked" and select the folder where you extracted the files.
5.  **Done!** The Telegram Translator extension is now installed. Pin it to your toolbar for easy access.

---

### ⚙️ How to Use

1.  **Open Telegram Web:** Navigate to [web.telegram.org](https://web.telegram.org/).
2.  **Set Your Language:** Click the extension icon in your toolbar.
3.  **Choose a Service:** Select your desired translation service from the dropdown.
    *   If you choose Gemini or Mistral (with a key), enter your API key in the provided field.
4.  **Select Target Language:** Choose the language you want messages to be translated into.
5.  **Save Settings:** Click "Save Settings". The extension will now automatically translate messages or show a translate button, based on your selected service.

---

### ❤️ Support The Project

If you find this tool useful and want to support its development, please consider:

<a href="https://www.paypal.com/paypalme/itkcartoons" target="_blank">
<img src="https://img.shields.io/badge/Donate-PayPal-blue.svg?logo=paypal&style=for-the-badge" alt="Donate with PayPal">
</a>


---

### 🛠️ Tech Stack

*   **Core:** JavaScript (ES6+), HTML5, CSS3
*   **APIs:** Chrome Extension Manifest V3, `chrome.storage` API
*   **Translation Services:** Google Translate (via public API), Google Gemini API, OpenRouter API (for Mistral)
*   **Tools:** Git, Visual Studio Code

---

### 📄 License

This project is licensed under the **MIT License**. See the [LICENSE](LICENSE) file for details.

const SUPPORTED_LANGUAGES = {
  'en': 'English',
  'es': 'Spanish',
  'fr': 'French',
  'de': 'German',
  'it': 'Italian',
  'pt': 'Portuguese',
  'ru': 'Russian',
  'ja': 'Japanese',
  'ko': 'Korean',
  'zh': 'Chinese (Simplified)',
  'ar': 'Arabic',
  'hi': 'Hindi',
  'tr': 'Turkish',
  'pl': 'Polish',
  'nl': 'Dutch',
  'sv': 'Swedish',
  'da': 'Danish',
  'no': 'Norwegian',
  'fi': 'Finnish'
};

const DEFAULT_TARGET_LANGUAGE = 'en';
const API_KEY_BG = 'AIzaSyCUeWHJv0LogE5_fZl80kkiD67JnAb0xRE'; // Replace with your actual API key
const GEMINI_API_MODEL_TEXT_BG = 'gemini-2.0-flash-exp';

// Message selectors for Telegram Web
const TELEGRAM_MESSAGE_SELECTORS_CS = [
  '.message-content .text-content',
  '.text-content',
  '.message .text',
  '.message-text',
  '[data-message-text]',
  '.reply-markup .text',
  '.message .spoiler-content'
];

const TRANSLATION_ATTRIBUTE = 'data-translated';
const PROCESSING_ATTRIBUTE = 'data-processing';
const MESSAGE_ID_ATTRIBUTE = 'data-message-id';
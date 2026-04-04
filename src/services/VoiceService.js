import Voice from '@react-native-voice/voice';
import Tts from 'react-native-tts';
import { PermissionsAndroid, Platform } from 'react-native';
import { GoogleGenerativeAI } from '@google/generative-ai';

// ⚠️ For production, move this to a secure backend (Firebase Functions)
const GEMINI_API_KEY = 'AIzaSyAHTYCpZex8eX6pS17WV8GIx7ZMZ3R-L1g';
const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);

// SOS trigger keywords (English + Hindi)
const SOS_KEYWORDS = [
  'help', 'save me', 'danger', 'emergency', 'sos', 'help me',
  'i am in danger', "i'm in danger", 'attack', 'someone help',
  'bachao', 'madad karo', 'khatra', 'mujhe bachao', 'help karo',
];

// Fake call trigger keywords
const FAKE_CALL_KEYWORDS = [
  'bahut acha', 'jao yaha se','mujhe dar lag rha hai',
];

// Location safety check keywords
const SAFETY_KEYWORDS = [
  'is this place safe', 'is it safe here', 'safe here', 'safe place',
  'kya yeh jagah safe hai', 'yahan safe hai', 'safe hai yahan',
];

class VoiceService {
  constructor() {
    this.isListening = false;
    this.isSpeaking = false;
    this.currentLanguage = 'en-US';

    // Callbacks set by the screen
    this._onSpeechStart = null;
    this._onSpeechEnd = null;
    this._onSpeechResults = null;
    this._onSpeechPartialResults = null;
    this._onSpeechError = null;

    this._setupTts();
    this._setupVoiceListeners();
  }

  // ─────────────────────────────────────────────
  // TTS SETUP
  // ─────────────────────────────────────────────
  _setupTts() {
    Tts.getInitStatus()
      .then(() => {
        Tts.setDefaultLanguage('en-US');
        Tts.setDefaultRate(0.48);
        Tts.setDefaultPitch(1.05);
      })
      .catch(err => console.warn('TTS init error:', err));

    Tts.addEventListener('tts-start', () => {
      this.isSpeaking = true;
    });
    Tts.addEventListener('tts-finish', () => {
      this.isSpeaking = false;
    });
    Tts.addEventListener('tts-cancel', () => {
      this.isSpeaking = false;
    });
  }

  // ─────────────────────────────────────────────
  // VOICE LISTENERS SETUP
  // ─────────────────────────────────────────────
  _setupVoiceListeners() {
    Voice.onSpeechStart = e => {
      this.isListening = true;
      if (this._onSpeechStart) this._onSpeechStart(e);
    };

    Voice.onSpeechEnd = e => {
      this.isListening = false;
      if (this._onSpeechEnd) this._onSpeechEnd(e);
    };

    Voice.onSpeechResults = e => {
      if (e.value && e.value.length > 0) {
        if (this._onSpeechResults) this._onSpeechResults(e.value[0]);
      }
    };

    Voice.onSpeechPartialResults = e => {
      if (e.value && e.value.length > 0) {
        if (this._onSpeechPartialResults) this._onSpeechPartialResults(e.value[0]);
      }
    };

    Voice.onSpeechError = e => {
      this.isListening = false;
      if (this._onSpeechError) this._onSpeechError(e);
    };
  }

  // ─────────────────────────────────────────────
  // SET CALLBACKS FROM SCREEN
  // ─────────────────────────────────────────────
  setCallbacks({
    onSpeechStart,
    onSpeechEnd,
    onSpeechResults,
    onSpeechPartialResults,
    onSpeechError,
  }) {
    this._onSpeechStart = onSpeechStart || null;
    this._onSpeechEnd = onSpeechEnd || null;
    this._onSpeechResults = onSpeechResults || null;
    this._onSpeechPartialResults = onSpeechPartialResults || null;
    this._onSpeechError = onSpeechError || null;
  }

  // ─────────────────────────────────────────────
  // PERMISSIONS
  // ─────────────────────────────────────────────
  async checkMicPermission() {
    if (Platform.OS === 'android') {
      const result = await PermissionsAndroid.request(
        PermissionsAndroid.PERMISSIONS.RECORD_AUDIO,
        {
          title: 'Microphone Permission',
          message: 'Suraksha needs microphone access for the AI Voice Assistant.',
          buttonPositive: 'Allow',
          buttonNegative: 'Deny',
        }
      );
      return result === PermissionsAndroid.RESULTS.GRANTED;
    }
    return true;
  }

  // ─────────────────────────────────────────────
  // START LISTENING
  // ─────────────────────────────────────────────
  async startListening(language = 'en-US') {
    const hasPermission = await this.checkMicPermission();
    if (!hasPermission) {
      throw new Error('Microphone permission not granted.');
    }

    if (this.isListening) {
      try {
        await Voice.stop();
      } catch (_) {}
    }

    try {
      this.currentLanguage = language;
      await Voice.start(language);
    } catch (e) {
      this.isListening = false;
      console.error('Failed to start listening:', e);
      throw e;
    }
  }

  // ─────────────────────────────────────────────
  // STOP LISTENING
  // ─────────────────────────────────────────────
  async stopListening() {
    try {
      await Voice.stop();
      this.isListening = false;
    } catch (e) {
      console.error('Failed to stop listening:', e);
    }
  }

  // ─────────────────────────────────────────────
  // INTENT DETECTION
  // ─────────────────────────────────────────────
  detectIntent(text) {
    const lower = text.toLowerCase().trim();

    if (SOS_KEYWORDS.some(k => lower.includes(k))) {
      return 'SOS';
    }
    if (FAKE_CALL_KEYWORDS.some(k => lower.includes(k))) {
      return 'FAKE_CALL';
    }
    if (SAFETY_KEYWORDS.some(k => lower.includes(k))) {
      return 'SAFETY_CHECK';
    }
    return 'AI_QUERY';
  }

  // ─────────────────────────────────────────────
  // GEMINI AI QUERY
  // ─────────────────────────────────────────────
  async askGemini(text, location = null) {
    // Offline fallback keywords
    const lower = text.toLowerCase();
    const isEmergency = SOS_KEYWORDS.some(k => lower.includes(k));
    if (isEmergency) {
      return 'You seem to be in danger. I have detected emergency keywords. Please use the SOS button immediately!';
    }

    try {
      const model = genAI.getGenerativeModel({ model: 'gemini-pro' });

      const isHindi = /[\u0900-\u097F]/.test(text);
      const langLabel = isHindi ? 'Hindi' : 'English';
      const locationCtx = location
        ? `User location: Latitude ${location.latitude}, Longitude ${location.longitude}.`
        : 'Location is unavailable.';

      const prompt = `You are "Suraksha AI", a specialized women's safety assistant embedded in a mobile safety app called Suraksha.

Role:
- Provide calm, empathetic, and actionable safety advice.
- If the user seems to be in danger, respond urgently and tell them to press the SOS button.
- If asked about safety of a place, provide general safety awareness based on the location context.
- Keep responses to 2-3 sentences maximum — they will be spoken aloud via Text-to-Speech.
- Respond in ${langLabel}. Always match the user's language.

${locationCtx}

User said: "${text}"`;

      const result = await model.generateContent(prompt);
      const response = await result.response;
      return response.text();
    } catch (error) {
      console.error('Gemini Error:', error);
      const isHindi = /[\u0900-\u097F]/.test(text);
      return isHindi
        ? 'मुझे अभी कनेक्ट करने में दिक्कत हो रही है। अगर आप खतरे में हैं तो SOS बटन दबाएं।'
        : "I'm having trouble connecting right now. If you're in danger, please press the SOS button immediately.";
    }
  }

  // ─────────────────────────────────────────────
  // TTS SPEAK
  // ─────────────────────────────────────────────
  speak(text, language = 'en-US') {
    Tts.stop();
    const isHindi = language.startsWith('hi') || /[\u0900-\u097F]/.test(text);
    Tts.setDefaultLanguage(isHindi ? 'hi-IN' : 'en-US');
    Tts.speak(text);
  }

  stopSpeaking() {
    Tts.stop();
  }

  // ─────────────────────────────────────────────
  // CLEANUP
  // ─────────────────────────────────────────────
  destroy() {
    this._onSpeechStart = null;
    this._onSpeechEnd = null;
    this._onSpeechResults = null;
    this._onSpeechPartialResults = null;
    this._onSpeechError = null;
    Voice.destroy().then(Voice.removeAllListeners).catch(console.error);
    Tts.stop();
  }
}

export default new VoiceService();

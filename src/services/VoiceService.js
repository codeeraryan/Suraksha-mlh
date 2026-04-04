import Voice from '@react-native-voice/voice';
import Tts from 'react-native-tts';
import { PermissionsAndroid, Platform } from 'react-native';
import { GoogleGenerativeAI } from '@google/generative-ai';

// Get API key from environment variables
// Using GET_API from .env file
const GET_API = 'AIzaSyAHTYCpZex8eX6pS17WV8GIx7ZMZ3R-L1g';

if (!GET_API) {
  console.error('❌ GET_API not configured in .env. AI features will not work.');
}

const genAI = new GoogleGenerativeAI(GET_API);

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
        console.log('TTS initialized successfully');
      })
      .catch(err => console.warn('TTS init error:', err));

    Tts.addEventListener('tts-start', () => {
      this.isSpeaking = true;
      console.log('TTS: Speaking started');
    });
    Tts.addEventListener('tts-finish', () => {
      this.isSpeaking = false;
      console.log('TTS: Speaking finished');
    });
    Tts.addEventListener('tts-cancel', () => {
      this.isSpeaking = false;
      console.log('TTS: Speaking cancelled');
    });
    Tts.addEventListener('tts-error', (err) => {
      this.isSpeaking = false;
      console.error('TTS Error:', err);
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
    // Offline fallback for emergency keywords
    const lower = text.toLowerCase();
    const isEmergency = SOS_KEYWORDS.some(k => lower.includes(k));
    if (isEmergency) {
      console.log('🚨 Emergency keywords detected - immediate SOS response');
      return 'You seem to be in danger. I have detected emergency keywords. Please use the SOS button immediately!';
    }

    try {
      const model = genAI.getGenerativeModel({ model: 'gemini-pro' });

      const isHindi = /[\u0900-\u097F]/.test(text);
      const langLabel = isHindi ? 'Hindi' : 'English';
      const locationCtx = location
        ? `User location: Latitude ${location.latitude.toFixed(4)}, Longitude ${location.longitude.toFixed(4)}.`
        : 'Location data is unavailable.';

      const prompt = `You are "Suraksha AI", a specialized women's safety assistant embedded in a mobile safety app called Suraksha.

Role & Guidelines:
- Provide calm, empathetic, and actionable safety advice in 1-2 sentences maximum (will be spoken via TTS)
- If the user seems to be in potential danger, respond urgently and suggest they press the SOS button
- For location/area safety queries, provide general safety awareness tips
- Always respond in the user's language (${langLabel})
- Be concise and avoid technical jargon
- When uncertain, ask clarifying questions briefly

${locationCtx}

User's spoken message: "${text}"

Response:`;

      const result = await model.generateContent(prompt);
      const response = result.response;
      const responseText = response.text();
      
      console.log('✅ Gemini API response:', responseText);
      return responseText;
    } catch (error) {
      console.error('❌ Gemini Error:', error.message);
      
      // Better fallback responses
      const isHindi = /[\u0900-\u097F]/.test(text);
      if (isHindi) {
        return 'मुझे अभी जवाब देने में परेशानी हो रही है। अगर आपको तुरंत मदद चाहिए तो SOS बटन दबाएं।';
      }
      return "I'm having difficulty right now, but I'm here to help. If you need emergency help, please press the SOS button.";
    }
  }

  // ─────────────────────────────────────────────
  // TTS SPEAK
  // ─────────────────────────────────────────────
  speak(text, language = 'en-US') {
    if (!text || text.trim() === '') {
      console.warn('⚠️ Attempted to speak empty text');
      return;
    }

    try {
      Tts.stop();
      
      // Detect language from text if Hindi script is present
      const isHindi = /[\u0900-\u097F]/.test(text);
      const effectiveLanguage = isHindi ? 'hi-IN' : (language || 'en-US');
      
      Tts.setDefaultLanguage(effectiveLanguage);
      Tts.setDefaultRate(0.48);
      Tts.setDefaultPitch(1.05);
      
      console.log(`🔊 Speaking (${effectiveLanguage}): ${text.substring(0, 50)}...`);
      Tts.speak(text);
    } catch (error) {
      console.error('❌ TTS Error:', error);
    }
  }

  stopSpeaking() {
    try {
      Tts.stop();
      this.isSpeaking = false;
      console.log('🔇 Speaking stopped');
    } catch (error) {
      console.error('Error stopping speech:', error);
    }
  }

  // ─────────────────────────────────────────────
  // CLEANUP
  // ─────────────────────────────────────────────
  destroy() {
    try {
      console.log('🧹 Cleaning up VoiceService...');
      this._onSpeechStart = null;
      this._onSpeechEnd = null;
      this._onSpeechResults = null;
      this._onSpeechPartialResults = null;
      this._onSpeechError = null;
      
      Voice.destroy().then(() => {
        Voice.removeAllListeners();
        console.log('✅ Voice listeners removed');
      }).catch(err => console.warn('Voice cleanup error:', err));
      
      Tts.stop();
      console.log('✅ TTS stopped');
    } catch (error) {
      console.error('❌ Error during cleanup:', error);
    }
  }
}

export default new VoiceService();

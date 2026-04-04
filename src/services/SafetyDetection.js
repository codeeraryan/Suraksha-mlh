/**
 * SafetyDetection.js
 * Centralized safety keyword detection for the Suraksha AI Voice Assistant.
 * Used by VoiceService to classify user intent before sending to Gemini.
 */

// ─── SOS Keywords (English + Hindi) ─────────────────────────────────────────
export const SOS_KEYWORDS = [
  // English
  'help', 'help me', 'save me', 'danger', 'emergency', 'sos',
  'i am in danger', "i'm in danger", 'please help', 'someone help',
  'attack', 'being attacked', 'chasing me', 'following me',
  'scared', 'afraid', 'threatened', 'unsafe',
  // Hindi (transliterated)
  'bachao', 'madad', 'madad karo', 'mujhe bachao', 'khatra',
  'mujhe dar lag raha hai', 'koi mujhe maar raha hai',
  'emergency hai', 'help chahiye',
];

// ─── Fake Call Keywords (English + Hindi) ────────────────────────────────────
export const FAKE_CALL_KEYWORDS = [
  'fake call', 'fake call karo', 'pretend call', 'naqli call',
  'call trigger', 'emergency call', 'call me now',
  'incoming call', 'make a call', 'simulate call',
  'fake call lagao', 'call karo',
];

// ─── Safety Check Keywords ────────────────────────────────────────────────────
export const SAFETY_CHECK_KEYWORDS = [
  'is this place safe', 'is it safe here', 'safe here', 'safe place',
  'am i safe', 'how safe is this', 'this area safe',
  'kya yeh jagah safe hai', 'yahan safe hai', 'safe hai yahan',
  'yeh jagah kaisi hai', 'is jagah ka kya haal hai',
];

// ─── Intent Detector ─────────────────────────────────────────────────────────
/**
 * detectIntent
 * @param {string} text - Transcribed speech from user.
 * @returns {'SOS' | 'FAKE_CALL' | 'SAFETY_CHECK' | 'AI_QUERY'}
 */
export const detectIntent = (text) => {
  if (!text || typeof text !== 'string') return 'AI_QUERY';
  const lower = text.toLowerCase().trim();

  if (SOS_KEYWORDS.some(k => lower.includes(k))) return 'SOS';
  if (FAKE_CALL_KEYWORDS.some(k => lower.includes(k))) return 'FAKE_CALL';
  if (SAFETY_CHECK_KEYWORDS.some(k => lower.includes(k))) return 'SAFETY_CHECK';
  return 'AI_QUERY';
};

/**
 * isSOSText (quick boolean check for SOS keywords only)
 * @param {string} text
 * @returns {boolean}
 */
export const isSOSText = (text) => {
  if (!text) return false;
  const lower = text.toLowerCase().trim();
  return SOS_KEYWORDS.some(k => lower.includes(k));
};

/**
 * isFakeCallText (quick boolean check for fake call keywords only)
 * @param {string} text
 * @returns {boolean}
 */
export const isFakeCallText = (text) => {
  if (!text) return false;
  const lower = text.toLowerCase().trim();
  return FAKE_CALL_KEYWORDS.some(k => lower.includes(k));
};

const functions = require("firebase-functions");
const admin = require("firebase-admin");
const { GoogleGenerativeAI } = require("@google/generative-ai");

admin.initializeApp();

// Gemini API Key — move to Firebase Secrets for production
const GEMINI_API_KEY = "AIzaSyAHTYCpZex8eX6pS17WV8GIx7ZMZ3R-L1g";
const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);

/**
 * Cloud Function: askGemini
 * Processes user voice queries via Google Gemini and returns safety-aware responses.
 */
exports.askGemini = functions.https.onCall(async (data, context) => {
  const { text, location, language = "en-US" } = data;

  if (!text || text.trim() === "") {
    throw new functions.https.HttpsError(
      "invalid-argument",
      "The 'text' field must be a non-empty string."
    );
  }

  try {
    const model = genAI.getGenerativeModel({ model: "gemini-pro" });

    const langLabel = language.startsWith("hi") ? "Hindi" : "English";
    const locationContext = location
      ? `User's current coordinates: Lat ${location.latitude}, Lng ${location.longitude}.`
      : "Location is unavailable.";

    let prompt = `You are "Suraksha AI", a specialized women's safety assistant embedded in a mobile app called Suraksha.

Your role is to:
- Provide quick, calm, and actionable safety advice.
- Detect if the user is in danger and respond with empathy and urgency.
- If asked "is this place safe?", use the location context to give a useful answer.
- Keep all responses concise (under 3 sentences) since they will be read aloud via Text-to-Speech.
- Respond in ${langLabel}. If the user queries in Hindi, respond in Hindi.

${locationContext}

User said: "${text}"`;

    // Special handling for safety check queries
    const lowerText = text.toLowerCase();
    if (
      lowerText.includes("is this place safe") ||
      lowerText.includes("kya yeh jagah safe hai") ||
      lowerText.includes("safe here")
    ) {
      prompt += `\n\nSpecific Task: The user is asking about the safety of their current location. Provide a reassuring response with general safety tips for the area. Mention they can press SOS if they feel unsafe.`;
    }

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const aiText = response.text();

    return {
      success: true,
      reply: aiText,
    };
  } catch (error) {
    console.error("Gemini API Error:", error);
    return {
      success: false,
      reply: language.startsWith("hi")
        ? "मैं अभी जुड़ नहीं पा रही। खतरे में हों तो SOS बटन दबाएं।"
        : "I'm having trouble connecting. If you're in danger, please press the SOS button.",
    };
  }
});

const { GoogleGenAI } = require('@google/genai');

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

/**
 * Builds a plain-text conversation transcript from stored messages,
 * then sends it + the new message to Gemini.
 * We do this because Gemini has no memory between calls —
 * WE are responsible for feeding it the history each time.
 */
const getGeminiReply = async (previousMessages, newMessageText) => {
  let transcript = '';

  previousMessages.forEach((msg) => {
    const speaker = msg.role === 'user' ? 'User' : 'Assistant';
    transcript += `${speaker}: ${msg.text}\n`;
  });

  transcript += `User: ${newMessageText}\nAssistant:`;

  try {
    const interaction = await ai.interactions.create({
      model: 'gemini-3.5-flash',
      input: transcript,
    });

    return interaction.output_text;
  } catch (error) {
    console.error('Gemini API error:', error.message);
    throw new Error('Failed to get AI response');
  }
};

module.exports = { getGeminiReply };
const { GoogleGenerativeAI } = require('@google/generative-ai');

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// In‑memory cache for coaching insight (1 hour)
let lastInsight = null;
let lastInsightTime = 0;
const CACHE_DURATION = 60 * 60 * 1000; // 1 hour

const COACH_PROMPT = `You are a professional forex trading coach. You will receive a summary of a trader's recent performance (win rate, profit/loss, best/worst sessions, best/worst days, etc.).
Based ONLY on that data, give 3 specific, actionable pieces of advice.
Be direct and mention exact sessions or days where behaviour should change.
Keep your answer under 200 words.`;

const CHAT_PROMPT = `You are an AI trading assistant for AvDiary, a trading journal platform.
You have access to the trader's real performance data (provided as JSON in the context).
Answer questions based ONLY on that data.
If the user asks about a chart image, analyse it thoroughly (trend, support/resistance, patterns, potential trade setups).
Be friendly but professional. If you don't have enough data, say so. Never make up numbers.`;

// ---------- Generate coaching insight ----------
async function generateCoachingInsight(stats) {
  const now = Date.now();
  if (lastInsight && (now - lastInsightTime) < CACHE_DURATION) {
    console.log('[Gemini] Returning cached coaching insight');
    return lastInsight;
  }

  try {
    const model = genAI.getGenerativeModel({
      model: 'gemini-2.0-flash',          // ✅ correct free model
      systemInstruction: COACH_PROMPT,
    });

    const prompt = `Here is the trader's recent performance data:\n${JSON.stringify(stats, null, 2)}\n\nGive 3 actionable tips based on this data.`;
    const result = await model.generateContent(prompt);
    const text = result.response.text();

    lastInsight = text;
    lastInsightTime = now;
    return text;
  } catch (error) {
    console.error('Gemini coaching error:', error.message);
    if (lastInsight) return lastInsight;
    if (error.message.includes('429')) {
      return 'AI coach is temporarily busy. Please try again in a minute.';
    }
    return 'AI coach is temporarily unavailable.';
  }
}

// ---------- Chat with the AI ----------
async function chatWithTrader(userMessage, tradeContext, imageUrl = null) {
  try {
    const model = genAI.getGenerativeModel({
      model: 'gemini-2.0-flash',          // ✅ correct free model
      systemInstruction: CHAT_PROMPT,
    });

    let prompt = `Trader context:\n${JSON.stringify(tradeContext, null, 2)}\n\nUser message: ${userMessage}`;

    if (imageUrl) {
      const fetch = require('node-fetch');
      const imageResp = await fetch(imageUrl);
      if (!imageResp.ok) throw new Error('Failed to fetch image');
      const imageBuffer = await imageResp.buffer();
      const base64Image = imageBuffer.toString('base64');
      const mimeType = imageResp.headers.get('content-type') || 'image/png';

      const result = await model.generateContent([
        { text: prompt },
        { inlineData: { mimeType, data: base64Image } },
      ]);
      return result.response.text();
    }

    const result = await model.generateContent(prompt);
    return result.response.text();
  } catch (error) {
    console.error('Gemini chat error:', error.message);
    if (error.message.includes('429')) {
      return 'I’m temporarily busy. Please try again in a minute.';
    }
    return 'Sorry, I could not process your request right now.';
  }
}

// ---------- Analyse chart image ----------
async function analyzeChartImage(imageUrl) {
  try {
    const model = genAI.getGenerativeModel({
      model: 'gemini-2.0-flash',          // ✅ correct free model
      systemInstruction: 'Analyse this trading chart image. Describe the trend, key support/resistance levels, visible patterns, and potential trade setups.',
    });

    const fetch = require('node-fetch');
    const imageResp = await fetch(imageUrl);
    if (!imageResp.ok) throw new Error('Failed to fetch image');
    const imageBuffer = await imageResp.buffer();
    const base64Image = imageBuffer.toString('base64');
    const mimeType = imageResp.headers.get('content-type') || 'image/png';

    const result = await model.generateContent([
      { text: 'Analyse this chart.' },
      { inlineData: { mimeType, data: base64Image } },
    ]);
    return result.response.text();
  } catch (error) {
    console.error('Gemini chart analysis error:', error.message);
    return 'Unable to analyse this chart right now.';
  }
}

module.exports = { generateCoachingInsight, chatWithTrader, analyzeChartImage };
const Groq = require('groq-sdk');

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

const COACHING_SYSTEM_PROMPT = `You are a professional forex trading coach.
You will receive the trader's complete trade history in JSON format.
Each trade includes: pair, position, pnl, session, influence, emotion, notes, risk_reward, tp_type, sl_type, breakeven.

Analyse the data and give 3 actionable pieces of advice.
Rules:
- Only mention a mistake or pattern if it has occurred AT LEAST 3 TIMES. If something happened only once or twice, do NOT bring it up.
- Same rule for positive patterns: only praise a behaviour if it has been repeated at least 3 times.
- Consider all available fields in your analysis: session performance, R:R ratios, TP/SL placement (wick vs body), break-even outcomes, emotions, and influences.
- Be specific. For example: "You lost 70% of trades where your TP was set to body in the London session (5 out of 7). Try using wick-based TP instead."
- Keep your total response under 250 words.`;

const CHAT_SYSTEM_PROMPT = `You are an AI trading assistant for AvDiary, a trading journal platform.
You have access to the trader's real performance data (provided as JSON in the context below).
Answer questions based ONLY on that data. Be specific and mention exact sessions, pairs, or patterns.
If you don't have enough data, say so. Never make up numbers.
Keep your answers friendly, professional, and under 250 words.`;

async function getChatReply(userMessage, tradeContext) {
  const contextStr = JSON.stringify(tradeContext, null, 2);

  const completion = await groq.chat.completions.create({
    model: 'llama-3.3-70b-versatile',
    messages: [
      { role: 'system', content: CHAT_SYSTEM_PROMPT },
      { role: 'user', content: `Trader context:\n${contextStr}\n\nUser message: ${userMessage}` },
    ],
    max_tokens: 500,
    temperature: 0.7,
  });

  return completion.choices[0]?.message?.content || 'Sorry, I had no response.';
}

async function getCoachingInsight(tradesJson) {
  const completion = await groq.chat.completions.create({
    model: 'llama-3.3-70b-versatile',
    messages: [
      { role: 'system', content: COACHING_SYSTEM_PROMPT },
      { role: 'user', content: tradesJson },
    ],
    max_tokens: 600,
    temperature: 0.7,
  });

  return completion.choices[0]?.message?.content || 'No insight generated.';
}

module.exports = { getChatReply, getCoachingInsight };
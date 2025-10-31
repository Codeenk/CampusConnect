const express = require('express');
const router = express.Router();

// POST /api/ai/generate
// Body: { message: string, userProfile: object }
router.post('/generate', async (req, res) => {
  try {
    const { message, userProfile } = req.body || {};

    const apiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY;

    // If no API key is configured, return a friendly fallback instead of an error
    if (!apiKey) {
      console.warn('AI proxy: no GEMINI_API_KEY / GOOGLE_API_KEY configured, returning fallback');
      const fallback = "I\'m having trouble contacting the AI service right now. Meanwhile, here are quick tips: break your question into smaller parts, try again in a minute, or check Campus Connect help articles.";
      return res.json({ success: true, text: fallback, warning: 'no_api_key' });
    }

    // Construct the prompt that will be sent to the model
    const systemPrompt = `You are CC Bot, the official AI assistant for Campus Connect. Keep answers concise, helpful and campus-focused. User profile: ${JSON.stringify(userProfile || {})}. Now answer briefly to: "${message}"`;

    // Model selection (override with env if needed)
    // Use gemini-1.5-flash with v1 API (current standard that works with API keys)
    const model = process.env.GEN_AI_MODEL || process.env.GEMINI_MODEL || 'gemini-2.0-flash';
    const apiVersion = process.env.GEN_AI_VERSION || 'v1';

    // Endpoints - API key goes in query parameter, not Bearer header
    const contentEndpoint = `https://generativelanguage.googleapis.com/${apiVersion}/models/${model}:generateContent?key=${apiKey}`;

    // Request body for generateContent
    const contentBody = {
      contents: [{ parts: [{ text: systemPrompt }] }]
    };

    // Simple retry on 429 with exponential backoff
    let attempts = 0;
    const maxAttempts = 3;
    let lastErr = null;

    // Try the endpoint with retries
    while (attempts < maxAttempts) {
      attempts++;
      try {
        if (typeof fetch === 'undefined') {
          console.error('Global fetch is not available in this Node runtime');
          return res.status(500).json({ success: false, error: 'Server missing fetch implementation' });
        }

        const resp = await fetch(contentEndpoint, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(contentBody),
        });

        // Rate limited -> wait and retry
        if (resp.status === 429) {
          lastErr = new Error('Rate limited');
          const backoff = 500 * Math.pow(2, attempts - 1);
          await new Promise(r => setTimeout(r, backoff));
          continue;
        }

        // Not OK -> capture details for debugging
        if (!resp.ok) {
          const text = await resp.text();
          console.error('AI backend returned error', resp.status, text);
          lastErr = new Error(`API returned ${resp.status}`);
          const backoff = 500 * Math.pow(2, attempts - 1);
          await new Promise(r => setTimeout(r, backoff));
          continue;
        }

        // Parse result
        const data = await resp.json();

        // Flexible extractor to handle multiple response shapes
        const extractText = (d) => {
          if (!d) return null;
          const paths = [
            () => d?.candidates?.[0]?.content?.parts?.[0]?.text,
            () => d?.candidates?.[0]?.output,
            () => d?.text,
            () => d?.response?.text
          ];
          for (const p of paths) {
            try {
              const v = p();
              if (v && typeof v === 'string') return v;
            } catch (e) {}
          }
          return null;
        };

        const candidate = extractText(data);
        if (candidate) {
          return res.json({ success: true, text: candidate });
        }

        // If structure unexpected, log and retry
        console.error('Unexpected AI response shape', JSON.stringify(data).slice(0, 2000));
        lastErr = new Error('Invalid response structure');
        const backoff = 500 * Math.pow(2, attempts - 1);
        await new Promise(r => setTimeout(r, backoff));
        continue;
      } catch (err) {
        lastErr = err;
        console.error('AI request failed:', err.message);
        const backoff = 500 * Math.pow(2, attempts - 1);
        await new Promise(r => setTimeout(r, backoff));
      }
    }

    console.warn('AI proxy failed after retries', lastErr?.message);
    const fallback = "I\'m having trouble contacting the AI service right now (rate limit). Meanwhile, here are quick tips: break your question into smaller parts, try again in a minute, or check Campus Connect help articles.";
    return res.json({ success: true, text: fallback, warning: 'rate_limited' });
  } catch (error) {
    console.error('AI generate error:', error && error.stack ? error.stack : error);
    res.status(500).json({ success: false, error: 'Internal server error', details: String(error?.message || error) });
  }
});

module.exports = router;

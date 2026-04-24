// Netlify serverless function — proxies AI API calls with triple-layer fallback system
const { GoogleGenerativeAI } = require('@google/generative-ai')

const SYSTEM_PROMPT = `You are VibeScout AI, a professional Web Development Lead Generator.
Your goal is to analyze a business and produce a high-fidelity JSON intelligence report focused on finding website improvement opportunities for cold calling.

FORMATTING RULES (STRICT):
1. NO PARAGRAPHS. Use multi-level bullet points for all description fields.
2. Every field starting with a bullet (•) must contain 2-4 key insights.
3. Find their social media presence if possible.
4. Output ONLY valid JSON. Escape all newlines as \\n and use double quotes.

JSON SCHEMA:
{
  "businessName": "string",
  "businessType": "cafe|gym|salon|restaurant|retail|other",
  "location": "string",
  "googleRating": number,
  "totalReviews": number,
  "vibeScore": number (1-10),
  "primaryVibe": "string",
  "colorPalette": { "primary": "#hex", "secondary": "#hex", "accent": "#hex", "background": "#hex", "text": "#hex" },
  "typography": { "headingStyle": "string", "moodWords": ["word1", "word2"] },
  "vibeSummary": "• Point 1\n• Point 2",
  "socialHandles": {
    "instagram": "@handle or Not Found",
    "facebook": "url or Not Found",
    "website": "url or Not Found"
  },
  "coldCallAmmunition": {
    "strengths": "• What they do well currently\n• Point 2",
    "weaknesses": "• Missing website features\n• Poor mobile design\n• Outdated info",
    "pitchAngle": "• How to pitch a new website to them\n• Value proposition"
  },
  "websiteDevelopmentSuggestions": {
    "designDirection": "• Modern layout ideas\n• Vibe to capture",
    "featuresToAdd": "• Online booking\n• Menu integration"
  }
}`

// Helper for JSON extraction
const extractJSON = (text) => {
  if (!text) return null
  try {
    const clean = text.replace(/```json\s*/gi, '').replace(/```\s*/g, '').trim()
    const jsonMatch = clean.match(/\{[\s\S]*\}/)
    return jsonMatch ? JSON.parse(jsonMatch[0]) : null
  } catch { return null }
}

exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') return { statusCode: 405, body: 'Method not allowed' }

  try {
    const body = JSON.parse(event.body)
    const keys = {
      gemini: process.env.GEMINI_API_KEY || process.env.VITE_GEMINI_API_KEY,
      groq: process.env.GROQ_API_KEY || process.env.VITE_GROQ_API_KEY,
      openrouter: process.env.OPENROUTER_API_KEY || process.env.VITE_OPENROUTER_API_KEY
    }

    const errors = []

    // 1. Try Gemini (Using 2.5 Flash on v1 endpoint)
    if (keys.gemini) {
      try {
        const genAI = new GoogleGenerativeAI(keys.gemini)
        // Note: Using 2.5-flash which is the stable model in the v1 API for 2026
        const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' })
        
        const parts = []
        if (body.screenshotBase64) {
          parts.push({ inlineData: { mimeType: body.mimeType || 'image/png', data: body.screenshotBase64 } })
        }
        parts.push({ text: `Analyze business: ${body.businessName || body.url}. Return JSON report.` })
        
        const result = await model.generateContent(parts)
        const report = extractJSON(result.response.text())
        if (report) return { statusCode: 200, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(report) }
        errors.push('Gemini returned no valid JSON')
      } catch (e) {
        errors.push(`Gemini failed: ${e.message}`)
      }
    }

    // 2. Try Groq Fallback
    if (keys.groq && !body.screenshotBase64) {
      try {
        const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
          method: 'POST',
          headers: { 'Authorization': `Bearer ${keys.groq}`, 'Content-Type': 'application/json' },
          body: JSON.stringify({
            model: "llama-3.3-70b-versatile",
            messages: [
              { role: "system", content: SYSTEM_PROMPT },
              { role: "user", content: `Research and analyze: ${body.businessName || body.url}. Return JSON.` }
            ],
            response_format: { type: "json_object" }
          })
        })
        const data = await response.json()
        if (data.choices?.[0]?.message?.content) {
          const report = extractJSON(data.choices[0].message.content)
          if (report) return { statusCode: 200, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(report) }
        }
        errors.push(`Groq failed: ${data.error?.message || 'No response'}`)
      } catch (e) {
        errors.push(`Groq error: ${e.message}`)
      }
    }

    // 3. Try OpenRouter Fallback
    if (keys.openrouter) {
      try {
        const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
          method: 'POST',
          headers: { 'Authorization': `Bearer ${keys.openrouter}`, 'Content-Type': 'application/json' },
          body: JSON.stringify({
            model: "google/gemini-2.5-flash", // OpenRouter often keeps aliases longer
            messages: [{ role: "user", content: `Research business: ${body.businessName || body.url}. Return JSON.` }]
          })
        })
        const data = await response.json()
        if (data.choices?.[0]?.message?.content) {
          const report = extractJSON(data.choices[0].message.content)
          if (report) return { statusCode: 200, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(report) }
        }
        errors.push(`OpenRouter failed: ${data.error?.message || 'No response'}`)
      } catch (e) {
        errors.push(`OpenRouter error: ${e.message}`)
      }
    }

    return {
      statusCode: 500,
      body: JSON.stringify({ 
        error: 'All AI providers failed.',
        details: errors
      })
    }
  } catch (err) {
    return { statusCode: 500, body: JSON.stringify({ error: err.message }) }
  }
}

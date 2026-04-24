// Netlify serverless function — proxies AI API calls with fallback system
const { GoogleGenerativeAI } = require('@google/generative-ai')

const SYSTEM_PROMPT = `You are VibeScout AI, an expert business vibe analyst and web designer's research assistant.

Your job: Analyze a business's complete digital presence and produce a comprehensive VIBE REPORT.
Follow these rules:
1. Research Google Maps, Instagram, and social signals.
2. USE BULLET POINTS for ambiance, reviewHighlights, contentThemes, and recommendations.
3. Output ONLY valid JSON.`

// Helper for JSON extraction
const extractJSON = (text) => {
  try {
    const clean = text.replace(/```json\s*/gi, '').replace(/```\s*/g, '').trim()
    const jsonMatch = clean.match(/\{[\s\S]*\}/)
    return jsonMatch ? JSON.parse(jsonMatch[0]) : null
  } catch { return null }
}

// Provider 1: Gemini
const callGemini = async (body, apiKey) => {
  try {
    const genAI = new GoogleGenerativeAI(apiKey)
    const model = genAI.getGenerativeModel({
      model: 'gemini-1.5-flash',
      systemInstruction: SYSTEM_PROMPT,
      tools: [{ googleSearch: {} }]
    })

    if (body.action === 'generateCopy') {
      const prompt = `Based on this vibe report, generate website copy. Return ONLY JSON.\n\nVibe Report: ${JSON.stringify(body.vibeReport)}`
      const result = await model.generateContent(prompt)
      return extractJSON(result.response.text())
    }

    const parts = []
    if (body.screenshotBase64) {
      parts.push({ inlineData: { mimeType: 'image/jpeg', data: body.screenshotBase64 } })
    }
    
    const promptText = `Research this business: ${body.businessName || body.url}. Return complete vibe report JSON.`
    parts.push({ text: promptText })
    
    const result = await model.generateContent(parts)
    return extractJSON(result.response.text())
  } catch (e) {
    console.error('Gemini error:', e.message)
    return null
  }
}

// Provider 2: Groq
const callGroq = async (body, apiKey) => {
  if (body.action === 'generateCopy' || body.screenshotBase64) return null
  try {
    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
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
    return extractJSON(data.choices[0].message.content)
  } catch (e) {
    console.error('Groq error:', e.message)
    return null
  }
}

// Main Handler
exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') return { statusCode: 405, body: 'Method not allowed' }

  try {
    const body = JSON.parse(event.body)
    const keys = {
      gemini: process.env.GEMINI_API_KEY || process.env.VITE_GEMINI_API_KEY,
      groq: process.env.GROQ_API_KEY || process.env.VITE_GROQ_API_KEY,
      openrouter: process.env.OPENROUTER_API_KEY || process.env.VITE_OPENROUTER_API_KEY
    }

    console.log('Key Presence Check:', {
      gemini: !!keys.gemini,
      groq: !!keys.groq,
      openrouter: !!keys.openrouter
    })

    // 1. Try Gemini
    if (keys.gemini) {
      const report = await callGemini(body, keys.gemini)
      if (report) return { statusCode: 200, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(report) }
    }

    // 2. Try Groq Fallback
    if (keys.groq) {
      const report = await callGroq(body, keys.groq)
      if (report) return { statusCode: 200, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(report) }
    }

    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'All AI providers failed. Check quotas and API keys.' })
    }
  } catch (err) {
    return { statusCode: 500, body: JSON.stringify({ error: err.message }) }
  }
}

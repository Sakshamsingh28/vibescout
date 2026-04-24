// Netlify serverless function — proxies AI API calls with triple-layer fallback system
const { GoogleGenerativeAI } = require('@google/generative-ai')

const SYSTEM_PROMPT = `You are VibeScout AI, an expert business vibe analyst.
Analyze the digital presence and produce a JSON report.
Use bullet points for lists.`

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
          parts.push({ inlineData: { mimeType: 'image/jpeg', data: body.screenshotBase64 } })
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
            model: "google/gemini-flash-1.5", // OpenRouter often keeps aliases longer
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

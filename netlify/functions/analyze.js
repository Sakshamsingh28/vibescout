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
    // Using gemini-1.5-flash-latest to avoid 404 on v1beta
    const model = genAI.getGenerativeModel({
      model: 'gemini-1.5-flash-latest',
      systemInstruction: SYSTEM_PROMPT
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
    return { error: e.message }
  }
}

// Provider 2: Groq (Updated Vision Model)
const callGroq = async (body, apiKey) => {
  try {
    const isVision = !!body.screenshotBase64
    // llama-3.2-11b-vision-preview is decommissioned, using llama-3.2-90b-vision-preview
    const model = isVision ? "llama-3.2-90b-vision-preview" : "llama3-70b-8192"
    
    const messages = [
      { role: "system", content: SYSTEM_PROMPT },
      { 
        role: "user", 
        content: isVision ? [
          { type: "text", text: `Analyze this business: ${body.businessName || body.url}. Return JSON.` },
          { type: "image_url", image_url: { url: `data:image/jpeg;base64,${body.screenshotBase64}` } }
        ] : `Research and analyze: ${body.businessName || body.url}. Return JSON.`
      }
    ]

    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: model,
        messages: messages,
        response_format: { type: "json_object" }
      })
    })
    const data = await response.json()
    if (data.error) throw new Error(data.error.message)
    return extractJSON(data.choices[0].message.content)
  } catch (e) {
    console.error('Groq error:', e.message)
    return { error: e.message }
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

    const errors = []

    // 1. Try Gemini (v1 API)
    if (keys.gemini) {
      try {
        const genAI = new GoogleGenerativeAI(keys.gemini)
        const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' })
        
        const parts = []
        if (body.screenshotBase64) {
          parts.push({ inlineData: { mimeType: 'image/jpeg', data: body.screenshotBase64 } })
        }
        parts.push({ text: `Analyze this business: ${body.businessName || body.url}. Return VibeScout JSON report.` })
        
        const result = await model.generateContent(parts)
        const report = extractJSON(result.response.text())
        if (report) return { statusCode: 200, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(report) }
      } catch (e) {
        errors.push(`Gemini failed: ${e.message}`)
      }
    }

    // 2. Try Groq (Stable Text Model)
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
        const report = extractJSON(data.choices[0].message.content)
        if (report) return { statusCode: 200, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(report) }
      } catch (e) {
        errors.push(`Groq failed: ${e.message}`)
      }
    }

    // 3. Try OpenRouter (Final Fallback)
    if (keys.openrouter) {
      try {
        const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
          method: 'POST',
          headers: { 'Authorization': `Bearer ${keys.openrouter}`, 'Content-Type': 'application/json' },
          body: JSON.stringify({
            model: "google/gemini-flash-1.5",
            messages: [{ role: "user", content: `Research business: ${body.businessName || body.url}. Return JSON.` }]
          })
        })
        const data = await response.json()
        const report = extractJSON(data.choices[0].message.content)
        if (report) return { statusCode: 200, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(report) }
      } catch (e) {
        errors.push(`OpenRouter failed: ${e.message}`)
      }
    }

    return {
      statusCode: 500,
      body: JSON.stringify({ 
        error: 'All AI providers failed.',
        details: errors,
        debug: { hasGemini: !!keys.gemini, hasGroq: !!keys.groq, hasOpenRouter: !!keys.openrouter }
      })
    }
  } catch (err) {
    return { statusCode: 500, body: JSON.stringify({ error: err.message }) }
  }
}

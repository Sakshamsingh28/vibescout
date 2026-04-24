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
    return { error: e.message } // Return error object to handle in main loop
  }
}

// Provider 2: Groq (Now with Vision Fallback)
const callGroq = async (body, apiKey) => {
  try {
    const isVision = !!body.screenshotBase64
    const model = isVision ? "llama-3.2-11b-vision-preview" : "llama-3.3-70b-versatile"
    
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

    console.log('Key Presence Check:', {
      gemini: !!keys.gemini,
      groq: !!keys.groq,
      openrouter: !!keys.openrouter
    })

    const errors = []

    // 1. Try Gemini
    if (keys.gemini) {
      const report = await callGemini(body, keys.gemini)
      if (report && !report.error) return { statusCode: 200, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(report) }
      errors.push(`Gemini failed: ${report?.error || 'Unknown error'}`)
    } else {
      errors.push('Gemini key missing')
    }

    // 2. Try Groq Fallback (Now supports Vision)
    if (keys.groq) {
      const report = await callGroq(body, keys.groq)
      if (report && !report.error) return { statusCode: 200, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(report) }
      errors.push(`Groq failed: ${report?.error || 'Unknown error'}`)
    } else {
      errors.push('Groq key missing')
    }

    return {
      statusCode: 500,
      body: JSON.stringify({ 
        error: 'All AI providers failed.',
        details: errors,
        debug: {
          hasGemini: !!keys.gemini,
          hasGroq: !!keys.groq,
          isScreenshot: !!body.screenshotBase64
        }
      })
    }
  } catch (err) {
    return { statusCode: 500, body: JSON.stringify({ error: err.message }) }
  }
}

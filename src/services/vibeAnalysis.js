// VibeScout AI Analysis Service
// Uses Multi-API Fallback system (Gemini -> Groq -> OpenRouter)
// In development: uses VITE_GEMINI_API_KEY, VITE_GROQ_API_KEY, VITE_OPENROUTER_API_KEY from .env.local

import { GoogleGenerativeAI } from '@google/generative-ai'

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

// Helper: robust JSON extraction
const extractJSON = (text) => {
  const clean = text.replace(/```json\s*/gi, '').replace(/```\s*/g, '').trim()
  const jsonMatch = clean.match(/\{[\s\S]*\}/)
  if (jsonMatch) {
    try {
      return JSON.parse(jsonMatch[0])
    } catch (e) {
      console.error('JSON Parse Error:', e)
      return null
    }
  }
  return null
}

// Provider 1: Google Gemini (Primary)
const callGemini = async (input) => {
  const { url, screenshotBase64, businessName } = input
  const apiKey = import.meta.env.VITE_GEMINI_API_KEY
  if (!apiKey) return null

  try {
    const genAI = new GoogleGenerativeAI(apiKey)
    const model = genAI.getGenerativeModel({
      model: 'gemini-2.5-flash',
      systemInstruction: SYSTEM_PROMPT,
      tools: [{ googleSearch: {} }]
    })

    const parts = []
    if (screenshotBase64) {
      parts.push({
        inlineData: { mimeType: input.mimeType || 'image/png', data: screenshotBase64 }
      })
    }

    const promptText = screenshotBase64
      ? `Analyze this Google Maps/Search screenshot of the business${businessName ? ` "${businessName}"` : ''}${url ? ` (URL: ${url})` : ''}. Research additional info about this business using Google Search, then return the complete vibe report JSON.`
      : `Research this business and analyze their full digital presence:
      Business: ${businessName || url || 'Unknown'}
      URL/Info: ${url || 'N/A'}
      Return the complete vibe report JSON.`

    parts.push({ text: promptText })

    const result = await model.generateContent(parts)
    return extractJSON(result.response.text())
  } catch (e) {
    console.warn('Gemini Provider Failed:', e.message)
    return null
  }
}

// Provider 2: Groq (Fallback)
const callGroq = async (input) => {
  const apiKey = import.meta.env.VITE_GROQ_API_KEY
  if (!apiKey) return null

  const { url, businessName } = input
  try {
    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'llama-3.3-70b-versatile',
        messages: [
          { role: 'system', content: SYSTEM_PROMPT },
          { role: 'user', content: `Analyze this business: ${businessName || url}. (Note: Screenshot data not available for this fallback).` }
        ],
        temperature: 0.1,
        response_format: { type: 'json_object' }
      })
    })

    const data = await response.json()
    if (!data.choices || !data.choices[0]) throw new Error(data.error?.message || 'No response from Groq')
    return extractJSON(data.choices[0].message.content)
  } catch (e) {
    console.warn('Groq Provider Failed:', e.message)
    return null
  }
}

// Provider 3: OpenRouter (Last Resort)
const callOpenRouter = async (input) => {
  const apiKey = import.meta.env.VITE_OPENROUTER_API_KEY
  if (!apiKey) return null

  const { url, businessName } = input
  try {
    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          { role: 'system', content: SYSTEM_PROMPT },
          { role: 'user', content: `Analyze business: ${businessName || url}` }
        ]
      })
    })

    const data = await response.json()
    if (!data.choices || !data.choices[0]) throw new Error(data.error?.message || 'No response from OpenRouter')
    return extractJSON(data.choices[0].message.content)
  } catch (e) {
    console.warn('OpenRouter Provider Failed:', e.message)
    return null
  }
}

export const analyzeBusinessVibe = async (input) => {
  // Use Netlify function in production
  if (!import.meta.env.DEV) {
    return analyzeViaNetlify(input)
  }

  const errors = []

  // 1. Try Gemini
  try {
    const report = await callGemini(input)
    if (report) return report
    errors.push('Gemini returned no data')
  } catch (e) {
    errors.push(`Gemini failed: ${e.message}`)
  }

  console.info('Gemini failed or skipped, trying Groq fallback...')
  
  // 2. Try Groq
  try {
    const report = await callGroq(input)
    if (report) return report
    errors.push('Groq returned no data')
  } catch (e) {
    errors.push(`Groq failed: ${e.message}`)
  }

  console.info('Groq failed or skipped, trying OpenRouter fallback...')

  // 3. Try OpenRouter
  try {
    const report = await callOpenRouter(input)
    if (report) return report
    errors.push('OpenRouter returned no data')
  } catch (e) {
    errors.push(`OpenRouter failed: ${e.message}`)
  }

  throw new Error(`All AI providers failed: ${errors.join(' | ')}`)
}

export const generateWebsiteCopy = async (vibeReport) => {
  if (!import.meta.env.DEV) return generateCopyViaNetlify(vibeReport)

  const apiKey = import.meta.env.VITE_GEMINI_API_KEY
  if (!apiKey) return null

  try {
    const genAI = new GoogleGenerativeAI(apiKey)
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' })

    const prompt = `Based on this vibe report, generate website copy. Return ONLY JSON.
    Vibe Report: ${JSON.stringify(vibeReport)}
    {
      "heroHeadline": "string",
      "heroSubheadline": "string",
      "tagline": "string",
      "aboutSnippet": "string",
      "ctaButton": "string"
    }`

    const result = await model.generateContent(prompt)
    return extractJSON(result.response.text())
  } catch {
    return null
  }
}

// ─── Netlify function proxies (production only) ─────────────
const analyzeViaNetlify = async (input) => {
  const { url, screenshotBase64, businessName } = input
  const response = await fetch('/.netlify/functions/analyze', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ url, screenshotBase64, businessName })
  })
  if (!response.ok) {
    const err = await response.text()
    throw new Error(`API error ${response.status}: ${err}`)
  }
  return response.json()
}

const generateCopyViaNetlify = async (vibeReport) => {
  const response = await fetch('/.netlify/functions/analyze', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action: 'generateCopy', vibeReport })
  })
  if (!response.ok) return null
  return response.json()
}


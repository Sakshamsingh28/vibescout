// VibeScout AI Analysis Service
// Uses Multi-API Fallback system (Gemini -> Groq -> OpenRouter)
// In development: uses VITE_GEMINI_API_KEY, VITE_GROQ_API_KEY, VITE_OPENROUTER_API_KEY from .env.local

import { GoogleGenerativeAI } from '@google/generative-ai'

const SYSTEM_PROMPT = `You are VibeScout AI, an expert business vibe analyst and web designer's research assistant.

Your job: Analyze a business's complete digital presence and produce a comprehensive VIBE REPORT that helps a web designer understand the business's aesthetic, personality, and brand so they can build a perfect website.

Research and analyze everything you can about:
- Google Maps profile (reviews, rating, photos described, location)
- Instagram presence and aesthetic style
- Facebook page activity
- Any website or online menu
- Common customer keywords and sentiments

Output ONLY valid JSON (no markdown, no preamble) with this structure:
{
  "businessName": "string",
  "businessType": "cafe|gym|salon|restaurant|retail|other",
  "location": "City, State/Country or null",
  "phone": "string or null",
  "website": "string or null",
  "googleRating": number or null,
  "totalReviews": number or null,
  "vibeScore": number between 1-10,
  "primaryVibe": "one of: Cozy & Warm | Industrial Chic | Minimalist Modern | Boho Eclectic | Luxury Premium | Rustic Artisan | Energetic Bold | Calm Wellness | Playful Fun | Dark & Moody",
  "colorPalette": {
    "primary": "#hexcode",
    "secondary": "#hexcode",
    "accent": "#hexcode",
    "background": "#hexcode",
    "text": "#hexcode"
  },
  "typography": {
    "headingStyle": "serif|sans-serif|display|handwritten",
    "bodyStyle": "clean|editorial|minimal",
    "moodWords": ["word1","word2","word3"]
  },
  "brandPersonality": {
    "adjectives": ["adj1","adj2","adj3","adj4","adj5"],
    "targetAudience": "string",
    "pricePoint": "budget|mid-range|premium|luxury",
    "ambiance": "3-5 punchy bullet points describing the physical and digital ambiance"
  },
  "digitalPresence": {
    "googleMaps": {
      "hasProfile": true,
      "reviewHighlights": ["bullet point 1","bullet point 2","bullet point 3"],
      "commonKeywords": ["kw1","kw2","kw3"]
    },
    "instagram": {
      "likelyActive": true,
      "estimatedStyle": "2-3 bullet points describing their aesthetic",
      "contentThemes": ["theme1","theme2","theme3"]
    },
    "facebook": {
      "likelyActive": true,
      "contentStyle": "1-2 bullet points on their presence"
    }
  },
  "websiteRecommendations": {
    "layout": "2-3 bullet points on ideal layout approach",
    "mustHaveFeatures": ["feature1","feature2","feature3","feature4"],
    "avoidFeatures": ["avoid1","avoid2"],
    "heroSection": "2-3 bullet points on ideal hero section",
    "keyPages": ["Home","About","Menu/Services","Contact","Gallery"],
    "callToAction": "primary CTA text"
  },
  "inspirationKeywords": ["kw1","kw2","kw3","kw4","kw5"],
  "summary": "4-6 punchy bullet points providing an executive summary for the web designer"
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
      model: 'gemini-1.5-flash', // Corrected from 2.5
      systemInstruction: SYSTEM_PROMPT,
      tools: [{ googleSearch: {} }]
    })

    const parts = []
    if (screenshotBase64) {
      parts.push({
        inlineData: { mimeType: 'image/jpeg', data: screenshotBase64 }
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
        model: 'llama-3.1-70b-versatile',
        messages: [
          { role: 'system', content: SYSTEM_PROMPT },
          { role: 'user', content: `Analyze this business: ${businessName || url}. (Note: Screenshot data not available for this fallback).` }
        ],
        temperature: 0.1,
        response_format: { type: 'json_object' }
      })
    })

    const data = await response.json()
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
        model: 'mistralai/mistral-7b-instruct:free',
        messages: [
          { role: 'system', content: SYSTEM_PROMPT },
          { role: 'user', content: `Analyze business: ${businessName || url}` }
        ]
      })
    })

    const data = await response.json()
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

  // 1. Try Gemini
  let report = await callGemini(input)
  if (report) return report

  console.info('Gemini failed or skipped, trying Groq fallback...')
  
  // 2. Try Groq
  report = await callGroq(input)
  if (report) return report

  console.info('Groq failed or skipped, trying OpenRouter fallback...')

  // 3. Try OpenRouter
  report = await callOpenRouter(input)
  if (report) return report

  throw new Error('All AI providers failed or returned invalid data. Check your API keys and connectivity.')
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


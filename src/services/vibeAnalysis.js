// VibeScout AI Analysis Service
// Uses Google Gemini API for business vibe analysis
// In development: uses VITE_GEMINI_API_KEY from .env.local
// In production: routes through /.netlify/functions/analyze

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
    "ambiance": "2-3 sentence description of the physical and digital ambiance"
  },
  "digitalPresence": {
    "googleMaps": {
      "hasProfile": true,
      "reviewHighlights": ["highlight1","highlight2","highlight3"],
      "commonKeywords": ["kw1","kw2","kw3"]
    },
    "instagram": {
      "likelyActive": true,
      "estimatedStyle": "description of their likely Instagram aesthetic",
      "contentThemes": ["theme1","theme2","theme3"]
    },
    "facebook": {
      "likelyActive": true,
      "contentStyle": "description of their Facebook presence style"
    }
  },
  "websiteRecommendations": {
    "layout": "description of ideal layout approach",
    "mustHaveFeatures": ["feature1","feature2","feature3","feature4"],
    "avoidFeatures": ["avoid1","avoid2"],
    "heroSection": "description of ideal hero section",
    "keyPages": ["Home","About","Menu/Services","Contact","Gallery"],
    "callToAction": "primary CTA text"
  },
  "inspirationKeywords": ["kw1","kw2","kw3","kw4","kw5"],
  "summary": "3-4 sentence executive summary for the web designer explaining the vibe and design direction"
}`

const getGeminiModel = () => {
  const apiKey = import.meta.env.VITE_GEMINI_API_KEY
  if (!apiKey) {
    throw new Error('VITE_GEMINI_API_KEY is not set. Add it to your .env.local file.')
  }
  const genAI = new GoogleGenerativeAI(apiKey)
  return genAI.getGenerativeModel({
    model: 'gemini-2.5-flash',
    systemInstruction: SYSTEM_PROMPT,
    tools: [{ googleSearch: {} }]
  })
}

export const analyzeBusinessVibe = async (input) => {
  const { url, screenshotBase64, businessName } = input

  // Use Netlify function in production
  if (!import.meta.env.DEV) {
    return analyzeViaNetlify(input)
  }

  const model = getGeminiModel()
  const parts = []

  if (screenshotBase64) {
    parts.push({
      inlineData: {
        mimeType: 'image/jpeg',
        data: screenshotBase64
      }
    })
  }

  const promptText = screenshotBase64
    ? `Analyze this Google Maps/Search screenshot of the business${businessName ? ` "${businessName}"` : ''}${url ? ` (URL: ${url})` : ''}. Research additional info about this business using Google Search, then return the complete vibe report JSON.`
    : `Research this business and analyze their full digital presence:

Business: ${businessName || url || 'Unknown'}
URL/Info: ${url || 'N/A'}

CRITICAL INSTRUCTIONS: 
1. USE GOOGLE SEARCH to find the exact business associated with the URL or Name above. 
2. If a shortened link (like maps.app.goo.gl) is provided, SEARCH FOR IT to find where it redirects or what business it belongs to.
3. CAREFULLY determine the businessType (e.g. if it's a fitness center, it is a gym, NOT a cafe).
4. DO NOT GUESS OR HALLUCINATE a generic "Cafe" if you cannot find it. If absolutely unknown, output businessType "other" and name it "Unknown Business".
5. Return the complete vibe report JSON with real data found.`

  parts.push({ text: promptText })

  const result = await model.generateContent(parts)
  const response = result.response
  const rawText = response.text()

  // Strip markdown fences if present and ensure robust JSON parsing
  const clean = rawText.replace(/```json\s*/gi, '').replace(/```\s*/g, '').trim()
  const jsonMatch = clean.match(/\{[\s\S]*\}/)
  
  if (jsonMatch) {
    try { 
      return JSON.parse(jsonMatch[0]) 
    } catch (e) { 
      throw new Error('Could not parse AI response as JSON: ' + e.message) 
    }
  }

  throw new Error('No structured data found in AI response')
}

export const generateWebsiteCopy = async (vibeReport) => {
  // Use Netlify function in production
  if (!import.meta.env.DEV) {
    return generateCopyViaNetlify(vibeReport)
  }

  const model = getGeminiModel()

  const prompt = `Based on this vibe report, generate website copy. Return ONLY JSON, no markdown.

Vibe Report: ${JSON.stringify(vibeReport)}

Return:
{
  "heroHeadline": "punchy 5-7 word headline that captures the vibe",
  "heroSubheadline": "one sentence that expands on the headline",
  "tagline": "3-5 word brand tagline",
  "aboutSnippet": "2 sentences for the About section",
  "ctaButton": "2-4 word primary CTA"
}`

  const result = await model.generateContent(prompt)
  const rawText = result.response.text()
  const clean = rawText.replace(/```json\s*/gi, '').replace(/```\s*/g, '').trim()
  const jsonMatch = clean.match(/\{[\s\S]*\}/)
  if (jsonMatch) {
    try { return JSON.parse(jsonMatch[0]) } catch { return null }
  }
  return null
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

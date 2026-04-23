// Netlify serverless function — proxies Gemini API calls
// This keeps your Gemini API key secure on the server side

const { GoogleGenerativeAI } = require('@google/generative-ai')

const SYSTEM_PROMPT = `You are VibeScout AI, an expert business vibe analyst and web designer's research assistant.

Your job: Analyze a business's complete digital presence and produce a comprehensive VIBE REPORT that helps a web designer understand the business's aesthetic, personality, and brand so they can build a perfect website.

Research and analyze everything you can about:
- Google Maps profile (reviews, rating, photos described, location)
- Instagram presence and aesthetic style
- Facebook page activity
- Any website or online menu
- Common customer keywords and sentiments

Output ONLY valid JSON (no markdown, no preamble) with the VibeScout report structure.`

exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method not allowed' }
  }

  const GEMINI_API_KEY = process.env.GEMINI_API_KEY
  if (!GEMINI_API_KEY) {
    return { statusCode: 500, body: JSON.stringify({ error: 'GEMINI_API_KEY not configured' }) }
  }

  try {
    const body = JSON.parse(event.body)
    const genAI = new GoogleGenerativeAI(GEMINI_API_KEY)
    const model = genAI.getGenerativeModel({
      model: 'gemini-2.5-flash',
      systemInstruction: SYSTEM_PROMPT,
      tools: [{ googleSearch: {} }]
    })

    let result

    if (body.action === 'generateCopy') {
      // Generate website copy from vibe report
      const prompt = `Based on this vibe report, generate website copy. Return ONLY JSON, no markdown.\n\nVibe Report: ${JSON.stringify(body.vibeReport)}\n\nReturn:\n{\n  "heroHeadline": "punchy 5-7 word headline",\n  "heroSubheadline": "one sentence",\n  "tagline": "3-5 word brand tagline",\n  "aboutSnippet": "2 sentences for the About section",\n  "ctaButton": "2-4 word primary CTA"\n}`
      result = await model.generateContent(prompt)
    } else {
      // Analyze business vibe
      const parts = []
      if (body.screenshotBase64) {
        parts.push({
          inlineData: { mimeType: 'image/jpeg', data: body.screenshotBase64 }
        })
      }
      
      const promptText = body.screenshotBase64
        ? `Analyze this Google Maps/Search screenshot of the business${body.businessName ? ` "${body.businessName}"` : ''}${body.url ? ` (URL: ${body.url})` : ''}. Research additional info, then return the complete vibe report JSON.`
        : `Research this business and analyze their full digital presence:

Business: ${body.businessName || body.url || 'Unknown'}
URL/Info: ${body.url || 'N/A'}

CRITICAL INSTRUCTIONS: 
1. USE GOOGLE SEARCH to find the exact business associated with the URL or Name above. 
2. If a shortened link (like maps.app.goo.gl) is provided, SEARCH FOR IT to find where it redirects or what business it belongs to.
3. CAREFULLY determine the businessType (e.g. if it's a fitness center, it is a gym, NOT a cafe).
4. DO NOT GUESS OR HALLUCINATE a generic "Cafe" if you cannot find it. If absolutely unknown, output businessType "other" and name it "Unknown Business".
5. Return the complete vibe report JSON with real data found.`
        
      parts.push({ text: promptText })
      result = await model.generateContent(parts)
    }

    const rawText = result.response.text()
    const clean = rawText.replace(/```json\s*/gi, '').replace(/```\s*/g, '').trim()
    const jsonMatch = clean.match(/\{[\s\S]*\}/)

    if (jsonMatch) {
      return {
        statusCode: 200,
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
        body: jsonMatch[0]
      }
    }

    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'No structured data in AI response' })
    }
  } catch (err) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: err.message })
    }
  }
}

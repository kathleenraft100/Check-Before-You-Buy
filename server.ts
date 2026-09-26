import express from 'express';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { GoogleGenAI, Type } from '@google/genai';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
app.use(express.json({ limit: '25mb' }));

const GEMINI_API_KEY = process.env.GEMINI_API_KEY?.trim();

if (!GEMINI_API_KEY) {
  console.warn('GEMINI_API_KEY is not set. /api/analyze will return an error until it is configured.');
}

// Only create the client when a key exists; without one the SDK falls back to Google Cloud default credentials.
const ai = GEMINI_API_KEY
  ? new GoogleGenAI({
      apiKey: GEMINI_API_KEY,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    })
  : null;

const VALID_STATUSES = ['LOOKS_REASONABLE', 'PAUSE_AND_CHECK', 'DONT_PAY_YET'];
const VALID_CONFIDENCE = ['HIGH', 'MODERATE', 'LIMITED'];

function isValidAnalysis(result: any): boolean {
  if (!result || typeof result !== 'object') return false;
  if (result.unreadable_screenshot === true || result.insufficient_information === true) return true;
  return (
    VALID_STATUSES.includes(result.status) &&
    VALID_CONFIDENCE.includes(result.confidence) &&
    typeof result.summary === 'string' &&
    ['price_findings', 'seller_findings', 'terms_findings', 'red_flags', 'next_steps'].every(
      (key) => result[key] && typeof result[key] === 'object',
    ) &&
    Array.isArray(result.unverified_items) &&
    typeof result.seller_question === 'string'
  );
}

// System instruction enforcing the critical trust rules and consumer-advocate methodology
const SYSTEM_INSTRUCTION = `You are the core analytical engine for "Check Before You Buy", a 2026 consumer purchase verification tool.
Your mission is to evaluate an online offer, link, screenshot, or text snippet to help shoppers spot impulse traps, deceptive pricing, unclear return terms, and payment risks BEFORE they tap pay.

You MUST evaluate:
1. Seller (brand legitimacy signals, contact details, identity transparency)
2. Offer (clarity, feasibility, product claims)
3. Price signals (artificial markdowns, fake MSRP anchors, hidden fees)
4. Terms (return policy friction, customer-paid international shipping, restocking fees, warranty clauses)
5. Payment method (standard credit cards with chargeback rights vs. risky wire/peer-to-peer cash apps)
6. Suspicious content (countdown timers, fake social notifications, disabled comments, stolen imagery patterns)
7. Missing information (what was omitted or cannot be verified from the provided input)
8. Discovery source (contextual risk based on where the user found it: TikTok, Instagram, Marketplace, AI chat, etc.)

CRITICAL TRUST RULES:
- Never fabricate facts.
- Never invent reviews, prices, seller history, certifications, or external verification.
- Clearly distinguish user-provided information from model analysis.
- Explicitly state when information cannot be verified.
- Treat red flags as warning signals, not automatic proof of fraud.
- Do NOT make the purchase decision for the user. Provide objective verification steps so they decide deliberately.

OUTPUT FORMAT:
Return valid JSON adhering to the specified schema:
status must be one of: "LOOKS_REASONABLE", "PAUSE_AND_CHECK", "DONT_PAY_YET"
confidence must be one of: "HIGH", "MODERATE", "LIMITED"`;

// POST /api/analyze endpoint
app.post('/api/analyze', async (req, res) => {
  if (!ai) {
    return res.status(503).json({
      error: 'AI analysis is not configured on the server.',
      code: 'AI_NOT_CONFIGURED',
      message: 'The verification engine is unavailable. No fabricated analysis will be generated.',
    });
  }

  try {
    const { inputType, content, imageBase64, mimeType, sourceCategory } = req.body;

    if (!content && !imageBase64) {
      return res.status(400).json({ error: 'Please provide either text content or an image screenshot to analyze.' });
    }

    // Build the prompt parts
    const parts: any[] = [];

    // If an image screenshot is provided, pass it as inlineData
    if (imageBase64) {
      // Remove data URL prefix if present
      const cleanBase64 = imageBase64.replace(/^data:image\/[a-z]+;base64,/, '');
      parts.push({
        inlineData: {
          data: cleanBase64,
          mimeType: mimeType || 'image/png',
        },
      });
    }

    // Add user text context
    const userPrompt = `Evaluate this online offer for a consumer before they pay:
Discovery Source: ${sourceCategory || 'Not specified'}
Input Type: ${inputType || 'text'}
User Provided Input / URL / Text:
${content || '(Screenshot provided above)'}

Perform the complete 8-point evaluation:
1. Seller
2. Offer
3. Price signals
4. Terms
5. Payment method
6. Suspicious content
7. Missing information
8. Discovery source (${sourceCategory || 'Web'})

Adhere strictly to all trust rules. Never invent facts. State what could not be verified.`;

    parts.push({ text: userPrompt });

    // Call Gemini 3.8 Flash via @google/genai
    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: { parts },
      config: {
        systemInstruction: SYSTEM_INSTRUCTION,
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            insufficient_information: {
              type: Type.BOOLEAN,
              description: 'Set to true ONLY if the provided text or screenshot lacks enough pricing, product, or seller context to conduct a meaningful check.',
            },
            unreadable_screenshot: {
              type: Type.BOOLEAN,
              description: 'Set to true ONLY if an uploaded screenshot is too blurry, cropped away from the offer, or contains no legible offer details.',
            },
            status: {
              type: Type.STRING,
              description: 'One of: LOOKS_REASONABLE, PAUSE_AND_CHECK, DONT_PAY_YET',
            },
            confidence: {
              type: Type.STRING,
              description: 'One of: HIGH, MODERATE, LIMITED',
            },
            summary: {
              type: Type.STRING,
              description: 'Concise 2-3 sentence plain-English summary of the evaluation.',
            },
            price_findings: {
              type: Type.OBJECT,
              properties: {
                title: { type: Type.STRING },
                statusText: { type: Type.STRING },
                isPositive: { type: Type.BOOLEAN },
                notes: {
                  type: Type.ARRAY,
                  items: { type: Type.STRING },
                },
              },
              required: ['title', 'statusText', 'isPositive', 'notes'],
            },
            seller_findings: {
              type: Type.OBJECT,
              properties: {
                title: { type: Type.STRING },
                statusText: { type: Type.STRING },
                isPositive: { type: Type.BOOLEAN },
                notes: {
                  type: Type.ARRAY,
                  items: { type: Type.STRING },
                },
              },
              required: ['title', 'statusText', 'isPositive', 'notes'],
            },
            terms_findings: {
              type: Type.OBJECT,
              properties: {
                title: { type: Type.STRING },
                statusText: { type: Type.STRING },
                isPositive: { type: Type.BOOLEAN },
                notes: {
                  type: Type.ARRAY,
                  items: { type: Type.STRING },
                },
              },
              required: ['title', 'statusText', 'isPositive', 'notes'],
            },
            red_flags: {
              type: Type.OBJECT,
              properties: {
                title: { type: Type.STRING },
                statusText: { type: Type.STRING },
                isPositive: { type: Type.BOOLEAN },
                notes: {
                  type: Type.ARRAY,
                  items: { type: Type.STRING },
                },
              },
              required: ['title', 'statusText', 'isPositive', 'notes'],
            },
            unverified_items: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
              description: 'List of 2-4 critical details that could NOT be verified from the provided input.',
            },
            next_steps: {
              type: Type.OBJECT,
              properties: {
                action: { type: Type.STRING },
                detail: { type: Type.STRING },
                tag: { type: Type.STRING },
              },
              required: ['action', 'detail', 'tag'],
            },
            seller_question: {
              type: Type.STRING,
              description: 'A polite, neutral verification question to ask the seller before paying.',
            },
            simple_explanations: {
              type: Type.OBJECT,
              properties: {
                pricing: { type: Type.STRING },
                returns: { type: Type.STRING },
                warranties: { type: Type.STRING },
                subscriptions: { type: Type.STRING },
                renewal: { type: Type.STRING },
                payments: { type: Type.STRING },
                urgency: { type: Type.STRING },
              },
            },
          },
          required: [
            'status',
            'confidence',
            'summary',
            'price_findings',
            'seller_findings',
            'terms_findings',
            'red_flags',
            'unverified_items',
            'next_steps',
            'seller_question',
          ],
        },
      },
    });

    const responseText = response.text;
    if (!responseText) {
      throw new Error('Empty response received from Gemini.');
    }

    const structuredResult = JSON.parse(responseText.trim());
    if (!isValidAnalysis(structuredResult)) {
      throw new Error('Gemini response did not match the expected analysis format.');
    }
    return res.json(structuredResult);
  } catch (error: any) {
    console.error('Gemini Analysis Error:', error);

    // Prompt 14 rule: "Do not invent an analysis when the AI call fails."
    return res.status(503).json({
      error: 'AI analysis could not be completed right now.',
      code: 'AI_ANALYSIS_FAILED',
      message: 'The evaluation could not reach the verification engine. No fabricated analysis will be generated.',
    });
  }
});

// Dev / Prod Vite serving setup
async function startServer() {
  const PORT = Number(process.env.PORT) || 3000;

  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (_req, res) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server listening on port ${PORT}`);
  });
}

startServer();

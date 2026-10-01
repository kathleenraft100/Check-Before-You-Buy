import express from 'express';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { GoogleGenAI, Type } from '@google/genai';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
app.use(express.json({ limit: '25mb' }));

// Ensure public directory is always served
const publicDir = path.resolve(__dirname, 'public');
if (!fs.existsSync(publicDir)) {
  fs.mkdirSync(publicDir, { recursive: true });
}
app.use(express.static(publicDir));

// Endpoint to check if brand logo is already stored
app.get('/api/brand-logo', (req, res) => {
  const exactName = 'ai-creation-cmuoefa7204m00iu6p6skzg82-1790798010521.jpg';
  const filePath = path.resolve(publicDir, exactName);
  const fallbackPath = path.resolve(publicDir, 'check-logo.png');
  if (fs.existsSync(filePath)) {
    return res.json({ exists: true, path: `/${exactName}` });
  } else if (fs.existsSync(fallbackPath)) {
    return res.json({ exists: true, path: '/check-logo.png' });
  }
  return res.json({ exists: false });
});

// Endpoint to store and persist official brand logo directly into public directory
app.post('/api/upload-brand-logo', (req, res) => {
  try {
    const { imageBase64, filename } = req.body;
    if (!imageBase64) {
      return res.status(400).json({ error: 'Missing imageBase64 data' });
    }
    const cleanBase64 = imageBase64.replace(/^data:image\/\w+;base64,/, '');
    const buffer = Buffer.from(cleanBase64, 'base64');

    const exactName = 'ai-creation-cmuoefa7204m00iu6p6skzg82-1790798010521.jpg';
    fs.writeFileSync(path.resolve(publicDir, exactName), buffer);
    fs.writeFileSync(path.resolve(publicDir, 'check-logo.png'), buffer);
    if (filename && filename !== exactName) {
      fs.writeFileSync(path.resolve(publicDir, filename), buffer);
    }
    return res.json({ success: true, path: `/${exactName}` });
  } catch (err: any) {
    console.error('Error saving brand logo:', err);
    return res.status(500).json({ error: err.message });
  }
});

// Initialize GoogleGenAI SDK on the server with recommended User-Agent header
const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
  httpOptions: {
    headers: {
      'User-Agent': 'aistudio-build',
    },
  },
});

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

STRICT GROUNDING & TRUST RULES:
- Never fabricate facts or create fake external verification (never invent BBB ratings, laboratory tests, or fake customer reviews).
- If price information is unavailable or not visible in the provided input, DO NOT invent a price assessment. In price_findings state clearly: "Price information was not visible or provided in the submitted material. Could not evaluate price reasonableness." with isPositive: false, isWarning: true.
- If seller information is unavailable or not visible, DO NOT invent seller ratings. In seller_findings state clearly: "Seller identity and company details could not be sufficiently evaluated from the provided information." with isPositive: false, isWarning: true.
- If return, warranty, or refund terms are not visible, DO NOT invent terms. In terms_findings state clearly: "Return and refund terms were not provided or visible in the submitted material." with isPositive: false, isWarning: true.
- If the screenshot is blurry, unreadable, dark, or contains no legible offer details, set unreadable_screenshot: true.
- If the text/link/input contains essentially no offer details at all (e.g. random gibberish like 'asdfg', single punctuation marks, or generic greetings like 'hello'), set insufficient_information: true. However, if the user describes a product and/or a price (even as simple as 'Sony headphones $100' or 'MacBook on marketplace'), this IS valid purchase info! DO NOT reject it as insufficient_information. Instead, evaluate the offer based on what was provided: flag the missing seller/warranty/return specifics in seller_findings, terms_findings, and unverified_items, point out price reasonableness for that category, and advise the shopper on what questions to ask.
- Clearly distinguish user-provided information from model analysis.
- Explicitly state when information cannot be verified in unverified_items.
- Treat red flags as warning signals, not automatic proof of fraud.
- Do NOT make the purchase decision for the user. Provide objective verification steps so they decide deliberately.

OUTPUT FORMAT:
Return valid JSON adhering to the specified schema:
status must be one of: "LOOKS_REASONABLE", "PAUSE_AND_CHECK", "DONT_PAY_YET"
confidence must be one of: "HIGH", "MODERATE", "LIMITED"`;

const ANALYSIS_SCHEMA = {
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
      description: 'Concise 2-3 sentence plain-English summary grounded strictly in the evaluated material.',
    },
    price_findings: {
      type: Type.OBJECT,
      properties: {
        title: { type: Type.STRING },
        statusText: { type: Type.STRING },
        isPositive: { type: Type.BOOLEAN },
        isWarning: { type: Type.BOOLEAN },
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
        isWarning: { type: Type.BOOLEAN },
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
        isWarning: { type: Type.BOOLEAN },
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
        isWarning: { type: Type.BOOLEAN },
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
        action: { type: Type.STRING, description: 'Single highest-priority concrete verification action before paying based on the primary issue found.' },
        detail: { type: Type.STRING, description: 'Specific details on how and where to verify this point independently.' },
        tag: { type: Type.STRING, description: 'Category tag such as Seller Check, Return Policy, Payment Safety, or Verification Step.' },
      },
      required: ['action', 'detail', 'tag'],
    },
    verification_checklist: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          id: { type: Type.STRING },
          label: { type: Type.STRING },
          description: { type: Type.STRING },
          priority: { type: Type.STRING, description: 'urgent, recommended, or standard' },
        },
        required: ['id', 'label', 'description', 'priority'],
      },
      description: 'Analysis-specific verification checklist items prioritized based on the issues identified (seller identity, return terms, payment protections, missing information, product condition/authenticity). Do not create generic warnings when irrelevant.',
    },
    seller_question: {
      type: Type.STRING,
      description: 'A polite, context-specific, neutral inquiry addressing the most important unresolved issue (e.g. return policy, exact condition, domestic shipping transit, or proof of authenticity). Never accuse the seller of wrongdoing.',
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
        shipping: { type: Type.STRING },
        cancellation: { type: Type.STRING },
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
};

function cleanJsonResponse(text: string): string {
  let cleaned = text.trim();
  if (cleaned.startsWith('```json')) {
    cleaned = cleaned.slice(7);
  } else if (cleaned.startsWith('```')) {
    cleaned = cleaned.slice(3);
  }
  if (cleaned.endsWith('```')) {
    cleaned = cleaned.slice(0, -3);
  }
  return cleaned.trim();
}

async function executeGeminiAnalysis(parts: any[]): Promise<string> {
  // Ordered by response speed and availability to prevent stalls and high-demand 503 bottlenecks
  const modelsToTry = [
    'gemini-3.5-flash-lite',
    'gemini-3.1-flash-lite',
    'gemini-flash-lite-latest',
    'gemini-3.5-flash',
    'gemini-3.8-flash',
  ];
  let lastError: any = null;

  for (const model of modelsToTry) {
    try {
      const response = await ai.models.generateContent({
        model,
        contents: { parts },
        config: {
          systemInstruction: SYSTEM_INSTRUCTION,
          responseMimeType: 'application/json',
          responseSchema: ANALYSIS_SCHEMA,
        },
      });
      if (response.text) return response.text;
    } catch (err: any) {
      lastError = err;
      const is503 = err?.status === 503 || err?.message?.includes('503') || err?.message?.includes('high demand');
      console.warn(`Gemini (${model}) encountered issue (503=${is503}):`, err?.message?.slice(0, 120) || err);
      // If 503 (high demand spike), instantly failover to next model without wasting time retrying overloaded model
      if (!is503) {
        await new Promise((res) => setTimeout(res, 400));
      }
    }
  }
  throw lastError || new Error('Empty response received from Gemini.');
}

// POST /api/analyze endpoint
app.post('/api/analyze', async (req, res) => {
  try {
    const { inputType, content, imageBase64, mimeType, sourceCategory } = req.body;

    if (!content && !imageBase64) {
      return res.status(400).json({ error: 'Please provide either text content or an image screenshot to analyze.' });
    }

    // Build the prompt parts
    const parts: any[] = [];

    // If an image screenshot is provided, pass it as inlineData
    if (imageBase64) {
      // Clean base64 and detect mime type
      const cleanBase64 = imageBase64.replace(/^data:.*?;base64,/, '');
      const detectedMime = imageBase64.match(/^data:(.*?);base64,/)?.[1] || mimeType || 'image/png';
      parts.push({
        inlineData: {
          data: cleanBase64,
          mimeType: detectedMime,
        },
      });
    }

    // Add user text context
    const userPrompt = `Evaluate this online offer for a consumer before they pay:
Discovery Source: ${sourceCategory || 'Not specified'}
Input Type: ${inputType || 'text'}
User Provided Input / URL / Text:
${content || '(Screenshot provided above)'}

Perform the complete 8-point grounded evaluation:
1. Seller
2. Offer
3. Price signals
4. Terms
5. Payment method
6. Suspicious content
7. Missing information
8. Discovery source (${sourceCategory || 'Web'})

For simple_explanations, explain the ACTUAL language found in the submitted material in plain English for each topic:
- pricing (markdowns, fees, anchors)
- returns (windows, customer-paid postage, restocking)
- warranties (coverage length, exclusions)
- subscriptions (recurring auto-ship, billing schedule)
- renewal (post-trial pricing, cancellation rules)
- payments (payment options, fraud protection)
- shipping (delivery transit, handling fees, carrier)
- cancellation (pre-shipment cancellation rights)
- urgency (countdown timers, stock claims)
CRITICAL: If a topic was NOT mentioned or visible in the submitted material, state: "Not provided: The submitted offer does not disclose [topic] terms." Never invent missing terms.

For verification_checklist:
Generate 3 to 5 prioritised verification actions specifically targeted at the weaknesses identified:
- If seller identity is unclear, prioritize seller verification (e.g. check corporate registration, look for real contact phone/address).
- If return policy is unclear or absent, prioritize reviewing the return policy (e.g. verify domestic return address and whether buyer pays international return freight).
- If payment method provides limited protection (e.g. wire/Zelle/peer-to-peer or external link), prioritize checking safer payment methods with chargeback rights.
- If important information is missing (e.g. brand, model, condition, warranty), prioritize obtaining that information.
- Do NOT generate generic warnings when they are irrelevant.
- Do NOT tell the user whether they should buy; frame each item neutrally as what to verify before paying.

For seller_question:
Generate a polite, neutral verification question addressing the single most important unresolved issue (e.g. return policy, item condition, shipping transit, or authenticity proof). It must NOT accuse the seller of fraud or wrongdoing, and must not invent facts.`;

    parts.push({ text: userPrompt });

    // Call Gemini with resilience
    const responseText = await executeGeminiAnalysis(parts);
    const cleanedText = cleanJsonResponse(responseText);
    const structuredResult = JSON.parse(cleanedText);

    // Safeguard structured response collections
    if (!Array.isArray(structuredResult.unverified_items)) {
      structuredResult.unverified_items = [];
    }
    if (!Array.isArray(structuredResult.verification_checklist)) {
      structuredResult.verification_checklist = [];
    }

    return res.json(structuredResult);
  } catch (error: any) {
    console.error('Gemini Analysis Error:', error);

    // If an uploaded image could not be decoded by the vision pipeline, gracefully return unreadable_screenshot
    const errMsg = error?.message || String(error);
    if (errMsg.includes('Unable to process input image') || errMsg.includes('INVALID_ARGUMENT')) {
      return res.json({
        unreadable_screenshot: true,
        insufficient_information: false,
        status: 'DONT_PAY_YET',
        confidence: 'HIGH',
        summary: 'The submitted image could not be clearly read or processed. Please upload a clear screenshot showing the offer, price, and seller details.',
        price_findings: {
          title: 'Price Not Legible',
          statusText: 'Could not be read',
          isPositive: false,
          isWarning: true,
          notes: ['Price information was unreadable from the submitted image.'],
        },
        seller_findings: {
          title: 'Seller Details Missing',
          statusText: 'Could not be read',
          isPositive: false,
          isWarning: true,
          notes: ['Seller identity could not be verified from the image.'],
        },
        terms_findings: {
          title: 'Terms Unclear',
          statusText: 'Could not be read',
          isPositive: false,
          isWarning: true,
          notes: ['Return policy and warranty terms were not legible.'],
        },
        red_flags: {
          title: 'Unreadable Screenshot',
          statusText: 'High Risk',
          isPositive: false,
          isWarning: true,
          notes: ['The screenshot could not be parsed by the verification engine.'],
        },
        unverified_items: ['Product specifications', 'Actual price', 'Seller identity', 'Return window'],
        next_steps: {
          action: 'Upload a clear screenshot or paste text',
          detail: 'Take a clear screenshot of the listing or paste the product text directly.',
          tag: 'Verification Step',
        },
        seller_question: 'Could you please confirm the exact model, item condition, price, and return terms?',
        verification_checklist: [
          {
            id: 'clear_photo',
            label: 'Verify with clear listing details',
            description: 'Upload a legible screenshot or paste the listing link directly.',
            priority: 'urgent',
          },
        ],
      });
    }

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

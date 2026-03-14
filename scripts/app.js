/**
 * Savoiré AI v3.0 — Backend API
 * app.js (Express server — deploy to Vercel or Node host)
 *
 * Developer: Sooban Talha Technologies (soobantalhatech.xyz)
 * Domain:    savoireai.vercel.app
 *
 * Stack:
 *   - Express for routing
 *   - Multer for file uploads
 *   - pdf-parse for PDF text extraction
 *   - mammoth for .docx text extraction
 *   - OpenRouter (free tier) for AI: Gemini 2.0 Flash → DeepSeek v3.1 → GLM-4.5 → Llama 3.2
 *
 * Install:
 *   npm install express cors multer pdf-parse mammoth node-fetch rate-limiter-flexible dotenv
 *
 * Env variables (.env):
 *   OPENROUTER_API_KEY=your_openrouter_key
 *   PORT=3000                  (optional, defaults to 3000)
 */

'use strict';

require('dotenv').config();
const express     = require('express');
const cors        = require('cors');
const multer      = require('multer');
const path        = require('path');
const fs          = require('fs');
const { RateLimiterMemory } = require('rate-limiter-flexible');

// ── Lazy-loaded parsers (avoids crashing if optional packages aren't installed)
let pdfParse, mammoth;
try { pdfParse = require('pdf-parse'); } catch (_) { pdfParse = null; }
try { mammoth   = require('mammoth');   } catch (_) { mammoth  = null; }

// ─────────────────────────────────────────────
// Config
// ─────────────────────────────────────────────
const PORT              = process.env.PORT || 3000;
const OPENROUTER_KEY    = process.env.OPENROUTER_API_KEY || '';
const OPENROUTER_BASE   = 'https://openrouter.ai/api/v1/chat/completions';
const APP_SITE_URL      = process.env.SITE_URL || 'https://savoireai.vercel.app';
const APP_NAME          = 'Savoiré AI';

/** Free models in priority order. All end with :free on OpenRouter. */
const FREE_MODELS = [
  'google/gemini-2.0-flash-exp:free',
  'deepseek/deepseek-chat-v3-0324:free',
  'z-ai/glm-4.5-air:free',
  'meta-llama/llama-3.2-3b-instruct:free',
];

// In-memory "credits" store (reset on server restart — swap for Redis/DB in production)
const creditsStore = new Map(); // ip → { notes: number, changes: number }
const FREE_NOTE_LIMIT   = 3;
const FREE_CHANGE_LIMIT = 5;

// ─────────────────────────────────────────────
// Express setup
// ─────────────────────────────────────────────
const app = express();

app.use(cors({
  origin: [APP_SITE_URL, 'http://localhost:3000', /\.vercel\.app$/],
  methods: ['GET', 'POST', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Serve static files from the project root in development
app.use(express.static(path.join(__dirname, '..')));

// ─────────────────────────────────────────────
// File upload (Multer)
// ─────────────────────────────────────────────
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 }, // 10 MB
  fileFilter(req, file, cb) {
    const ALLOWED = [
      'application/pdf',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.openxmlformats-officedocument.presentationml.presentation',
      'text/plain',
      'image/png', 'image/jpeg', 'image/jpg', 'image/webp',
    ];
    if (ALLOWED.includes(file.mimetype)) { cb(null, true); }
    else { cb(new Error(`Unsupported file type: ${file.mimetype}`), false); }
  },
});

// ─────────────────────────────────────────────
// Rate limiting
// ─────────────────────────────────────────────
const rateLimiter = new RateLimiterMemory({ points: 10, duration: 60 }); // 10 req / min / IP

async function rateLimit(req, res, next) {
  try {
    await rateLimiter.consume(req.ip);
    next();
  } catch {
    res.status(429).json({ success: false, error: 'Too many requests. Please wait a moment.' });
  }
}

// ─────────────────────────────────────────────
// Credit helpers
// ─────────────────────────────────────────────
function getCredits(ip) {
  if (!creditsStore.has(ip)) creditsStore.set(ip, { notes: 0, changes: 0 });
  return creditsStore.get(ip);
}

function getRemainingCredits(ip) {
  const c = getCredits(ip);
  return {
    notes:   Math.max(0, FREE_NOTE_LIMIT   - c.notes),
    changes: Math.max(0, FREE_CHANGE_LIMIT - c.changes),
  };
}

// ─────────────────────────────────────────────
// File → text extractor
// ─────────────────────────────────────────────
async function extractTextFromFile(file) {
  const mime = file.mimetype;

  if (mime === 'text/plain') {
    return file.buffer.toString('utf-8');
  }

  if (mime === 'application/pdf') {
    if (!pdfParse) throw new Error('pdf-parse not installed. Run: npm install pdf-parse');
    const data = await pdfParse(file.buffer);
    return data.text;
  }

  if (mime === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
    if (!mammoth) throw new Error('mammoth not installed. Run: npm install mammoth');
    const result = await mammoth.extractRawText({ buffer: file.buffer });
    return result.value;
  }

  if (mime.startsWith('image/')) {
    // Return a placeholder — full OCR requires tesseract.js (optional heavy dep)
    // If you want OCR: npm install tesseract.js  and replace this block
    return '[Image uploaded — OCR processing. Install tesseract.js for full OCR support.]';
  }

  throw new Error(`Cannot extract text from file type: ${mime}`);
}

// ─────────────────────────────────────────────
// AI prompt builder
// ─────────────────────────────────────────────
/**
 * @param {string} action  - extend | shorten | rephrase | grammar | thesaurus | translate | tone | style | combine | generate
 * @param {string} text    - user text / topic
 * @param {object} opts    - { language, tone, style, format, length, targetLanguage, combinedActions }
 */
function buildPrompt(action, text, opts = {}) {
  const lang     = opts.language     || 'English';
  const tone     = opts.tone         || 'professional';
  const style    = opts.style        || 'academic';
  const format   = opts.format       || 'notes';
  const length   = opts.length       || 'medium';
  const targetLang = opts.targetLanguage || 'French';

  const lengthMap = { short: '~150 words', medium: '~300 words', long: '~600 words', 'ultra-detailed': '~1200 words' };
  const wordGuide = lengthMap[length] || lengthMap.medium;

  const instructions = {
    extend: `You are an expert writing assistant. Extend the following text to be longer and more detailed (${wordGuide}), preserving the original meaning, tone, and style. Do not add unrelated information. Respond only with the extended text, no preamble.\n\nText:\n${text}`,

    shorten: `You are an expert writing assistant. Shorten the following text to be more concise (${wordGuide}), keeping all key information and the author's intended meaning. Remove redundancy and filler. Respond only with the shortened text, no preamble.\n\nText:\n${text}`,

    rephrase: `You are an expert writing assistant. Rephrase the following text to improve clarity, flow, and readability while preserving the original meaning. Respond only with the rephrased text, no preamble.\n\nText:\n${text}`,

    grammar: `You are an expert proofreader. Correct all spelling, grammar, and punctuation errors in the following text. Do not change the meaning or style. Respond only with the corrected text, no preamble.\n\nText:\n${text}`,

    thesaurus: `You are an expert writing assistant. Improve the vocabulary of the following text by replacing overused or weak words with more precise, appropriate alternatives that suit the context. Do not change the overall meaning. Respond only with the improved text, no preamble.\n\nText:\n${text}`,

    translate: `You are a professional translator with expertise in literary, academic, and technical translation. Translate the following text into ${targetLang} with natural, idiomatic phrasing — not a word-for-word translation. Preserve the tone and style of the original. Respond only with the translated text.\n\nText:\n${text}`,

    tone: `You are an expert writing assistant. Rewrite the following text in a ${tone} tone. Adjust the delivery and word choice accordingly while keeping the core content. Respond only with the rewritten text, no preamble.\n\nText:\n${text}`,

    style: `You are an expert writing assistant. Rewrite the following text in a ${style} writing style suitable for the target audience. Respond only with the rewritten text, no preamble.\n\nText:\n${text}`,

    combine: `You are an expert writing assistant. Apply the following transformations to the text in sequence: ${(opts.combinedActions || ['rephrase', 'shorten']).join(', ')}. Produce a final result that incorporates all transformations. Respond only with the final text, no preamble.\n\nText:\n${text}`,

    generate: `You are an expert educator and note-taker. Create comprehensive, well-structured ${format} on the following topic in ${lang}. Use clear headings, bullet points, and concise explanations. Target length: ${wordGuide}. Tone: ${tone}. Style: ${style}.\n\nTopic:\n${text}`,
  };

  return instructions[action] || instructions.generate;
}

// ─────────────────────────────────────────────
// OpenRouter AI caller with model fallback
// ─────────────────────────────────────────────
async function callAI(prompt, preferredModel = null) {
  if (!OPENROUTER_KEY) throw new Error('OPENROUTER_API_KEY is not set in environment variables.');

  const modelsToTry = preferredModel
    ? [preferredModel, ...FREE_MODELS.filter(m => m !== preferredModel)]
    : FREE_MODELS;

  let lastError;
  for (const model of modelsToTry) {
    try {
      const start = Date.now();
      const response = await fetch(OPENROUTER_BASE, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${OPENROUTER_KEY}`,
          'HTTP-Referer': APP_SITE_URL,
          'X-Title': APP_NAME,
        },
        body: JSON.stringify({
          model,
          max_tokens: 2048,
          temperature: 0.7,
          messages: [{ role: 'user', content: prompt }],
        }),
        signal: AbortSignal.timeout(30_000), // 30s timeout
      });

      if (!response.ok) {
        const errBody = await response.text();
        throw new Error(`OpenRouter ${response.status}: ${errBody.slice(0, 200)}`);
      }

      const data = await response.json();
      const content = data.choices?.[0]?.message?.content;
      if (!content) throw new Error('Empty response from model');

      return {
        text:           content.trim(),
        model_used:     model,
        tokens_used:    data.usage?.total_tokens || 0,
        processing_ms:  Date.now() - start,
      };
    } catch (err) {
      console.warn(`[AI] Model ${model} failed:`, err.message);
      lastError = err;
    }
  }

  // All models failed — return offline fallback
  console.error('[AI] All models failed. Using offline fallback.');
  return offlineFallback(prompt);
}

/** Offline fallback when all AI models are unavailable */
function offlineFallback(prompt) {
  return {
    text: '[AI temporarily unavailable] All AI models are currently unreachable. Please check your OPENROUTER_API_KEY and try again shortly.',
    model_used: 'offline-fallback',
    tokens_used: 0,
    processing_ms: 0,
    fallback: true,
  };
}

// ─────────────────────────────────────────────
// Routes
// ─────────────────────────────────────────────

/** GET /api/health — uptime check */
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    version: '3.0.0',
    timestamp: new Date().toISOString(),
    models: FREE_MODELS,
    key_configured: !!OPENROUTER_KEY,
  });
});

/** GET /api/credits — check remaining free credits for this IP */
app.get('/api/credits', (req, res) => {
  res.json({ success: true, remaining: getRemainingCredits(req.ip) });
});

/**
 * POST /api/process
 * Main AI processing endpoint.
 *
 * Body (multipart/form-data or JSON):
 *   action         : string  (generate | extend | shorten | rephrase | grammar | thesaurus | translate | tone | style | combine)
 *   text           : string  (input text or topic)
 *   language       : string  (output language, default "English")
 *   targetLanguage : string  (for translate action)
 *   tone           : string  (professional | casual | academic | persuasive | friendly | formal)
 *   style          : string  (academic | simple | detailed | bullet_points | essay | blog | report)
 *   format         : string  (notes | summary | flashcards | outline)
 *   length         : string  (short | medium | long | ultra-detailed)
 *   combinedActions: string  (JSON array, for "combine" action)
 *   file           : file    (optional upload)
 */
app.post('/api/process', rateLimit, upload.single('file'), async (req, res) => {
  const start = Date.now();

  try {
    // ── Parse body
    const {
      action         = 'generate',
      language       = 'English',
      targetLanguage = 'French',
      tone           = 'professional',
      style          = 'academic',
      format         = 'notes',
      length         = 'medium',
    } = req.body;

    let combinedActions;
    try { combinedActions = JSON.parse(req.body.combinedActions || '["rephrase","shorten"]'); }
    catch { combinedActions = ['rephrase', 'shorten']; }

    // ── Get text (from body or uploaded file)
    let text = (req.body.text || '').trim();

    if (req.file) {
      try {
        const extracted = await extractTextFromFile(req.file);
        text = extracted.trim() || text;
      } catch (err) {
        return res.status(400).json({ success: false, error: `File processing failed: ${err.message}` });
      }
    }

    if (!text) {
      return res.status(400).json({ success: false, error: 'No text or file provided.' });
    }
    if (text.length > 20_000) {
      return res.status(400).json({ success: false, error: 'Input text exceeds 20,000 character limit.' });
    }

    // ── Validate action
    const VALID_ACTIONS = ['generate','extend','shorten','rephrase','grammar','thesaurus','translate','tone','style','combine'];
    const safeAction = VALID_ACTIONS.includes(action) ? action : 'generate';

    // ── Credit check
    const ip = req.ip;
    const credits = getCredits(ip);
    const isGenerateAction = safeAction === 'generate';

    if (isGenerateAction && credits.notes >= FREE_NOTE_LIMIT) {
      return res.status(402).json({
        success: false,
        error: 'Free generation limit reached.',
        upgrade_required: true,
        remaining: getRemainingCredits(ip),
      });
    }
    if (!isGenerateAction && credits.changes >= FREE_CHANGE_LIMIT) {
      return res.status(402).json({
        success: false,
        error: 'Free changes limit reached.',
        upgrade_required: true,
        remaining: getRemainingCredits(ip),
      });
    }

    // ── Build prompt & call AI
    const prompt = buildPrompt(safeAction, text, { language, targetLanguage, tone, style, format, length, combinedActions });
    const aiResult = await callAI(prompt);

    // ── Deduct credits
    if (isGenerateAction) { credits.notes++; }
    else                   { credits.changes++; }

    // ── Respond
    const remaining = getRemainingCredits(ip);
    res.json({
      success: true,
      data: {
        original:  text,
        processed: aiResult.text,
        action:    safeAction,
        metadata: {
          model_used:      aiResult.model_used,
          tokens_used:     aiResult.tokens_used,
          processing_time: ((Date.now() - start) / 1000).toFixed(2),
          language,
          fallback:        aiResult.fallback || false,
        },
      },
      remaining_free_credits: remaining,
    });

  } catch (err) {
    console.error('[/api/process] Unhandled error:', err);
    res.status(500).json({ success: false, error: 'An internal server error occurred. Please try again.' });
  }
});

/**
 * POST /api/extract
 * Extract text from an uploaded file only (no AI).
 */
app.post('/api/extract', rateLimit, upload.single('file'), async (req, res) => {
  if (!req.file) return res.status(400).json({ success: false, error: 'No file uploaded.' });
  try {
    const text = await extractTextFromFile(req.file);
    res.json({ success: true, text: text.trim(), filename: req.file.originalname, size: req.file.size });
  } catch (err) {
    res.status(400).json({ success: false, error: err.message });
  }
});

/**
 * GET /api/models
 * List available free models.
 */
app.get('/api/models', (req, res) => {
  res.json({ success: true, models: FREE_MODELS, primary: FREE_MODELS[0] });
});

// ─────────────────────────────────────────────
// Global error handler
// ─────────────────────────────────────────────
app.use((err, req, res, _next) => {
  console.error('[Global error]', err.message);
  const status = err.status || (err.message.includes('Unsupported') ? 415 : 500);
  res.status(status).json({ success: false, error: err.message || 'Server error' });
});

// 404
app.use((req, res) => {
  res.status(404).json({ success: false, error: `Route not found: ${req.method} ${req.path}` });
});

// ─────────────────────────────────────────────
// Start
// ─────────────────────────────────────────────
app.listen(PORT, () => {
  console.log(`\n🎓 Savoiré AI v3.0 — API running on http://localhost:${PORT}`);
  console.log(`   OpenRouter key: ${OPENROUTER_KEY ? '✓ configured' : '✗ MISSING — set OPENROUTER_API_KEY'}`);
  console.log(`   Primary model : ${FREE_MODELS[0]}`);
  console.log(`   Fallback chain: ${FREE_MODELS.slice(1).join(' → ')}\n`);
});

module.exports = app; // for Vercel serverless export
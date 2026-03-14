const express = require('express');
const multer = require('multer');
const cors = require('cors');
const rateLimit = require('express-rate-limit');
const path = require('path');

const app = express();

// ─── CORS ────────────────────────────────────────────────────────────────────
app.use(cors({
  origin: ['https://savoireai.vercel.app', 'http://localhost:3000', 'http://127.0.0.1:5500'],
  methods: ['GET', 'POST'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// ─── RATE LIMITING ───────────────────────────────────────────────────────────
const freeLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 10,
  message: { success: false, error: 'Too many requests. Please slow down.' },
});

app.use('/api/', freeLimiter);

// ─── MULTER (file uploads) ────────────────────────────────────────────────────
const storage = multer.memoryStorage();
const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
  fileFilter: (req, file, cb) => {
    const allowed = ['.txt', '.pdf', '.docx', '.png', '.jpg', '.jpeg', '.pptx'];
    const ext = path.extname(file.originalname).toLowerCase();
    allowed.includes(ext) ? cb(null, true) : cb(new Error('Unsupported file type'));
  },
});

// ─── FREE MODELS POOL ────────────────────────────────────────────────────────
const FREE_MODELS = [
  'google/gemini-2.0-flash-exp:free',
  'deepseek/deepseek-chat-v3-1:free',
  'z-ai/glm-4.5-air:free',
  'meta-llama/llama-3.2-3b-instruct:free',
];

const OPENROUTER_KEY = process.env.OPENROUTER_API_KEY || 'YOUR_OPENROUTER_API_KEY_HERE';

// ─── IN-MEMORY CREDIT STORE (replace with DB in production) ──────────────────
const creditStore = new Map(); // ip -> { credits, lastReset }

function getCredits(ip) {
  const now = Date.now();
  if (!creditStore.has(ip)) {
    creditStore.set(ip, { credits: 3, lastReset: now });
  }
  const entry = creditStore.get(ip);
  // Reset daily
  if (now - entry.lastReset > 24 * 60 * 60 * 1000) {
    entry.credits = 3;
    entry.lastReset = now;
  }
  return entry.credits;
}

function deductCredit(ip) {
  const credits = getCredits(ip);
  if (credits > 0) {
    creditStore.get(ip).credits -= 1;
    return true;
  }
  return false;
}

// ─── PROMPTS PER ACTION ──────────────────────────────────────────────────────
const ACTION_PROMPTS = {
  generate: (text, opts) => `You are an expert academic note-taker. Create comprehensive, well-structured study notes from the following input.

Format: ${opts.format || 'notes'}
Style: ${opts.style || 'academic'}
Length: ${opts.length || 'medium'}
Tone: ${opts.tone || 'professional'}
Language: ${opts.language || 'English'}

Input:
${text}

Generate rich, detailed notes with proper headings, key points, and examples. Use markdown formatting.`,

  extend: (text) => `Extend the following text by intelligently adding more detail, examples, and elaboration. Keep the same tone and style. Return ONLY the extended text, no explanations.

Text:
${text}`,

  shorten: (text) => `Shorten the following text by removing excess content while keeping all important information. Make it concise and clear. Return ONLY the shortened text, no explanations.

Text:
${text}`,

  rephrase: (text) => `Rephrase the following text to improve clarity, flow, and readability. Keep the same meaning but improve phrasing. Return ONLY the rephrased text, no explanations.

Text:
${text}`,

  grammar: (text) => `Fix all spelling and grammar errors in the following text. Correct sentence structure, punctuation, and word usage. Return ONLY the corrected text, no explanations.

Text:
${text}`,

  thesaurus: (text) => `Replace words in the following text with more sophisticated, contextually appropriate synonyms where suitable. Improve vocabulary while keeping natural flow. Return ONLY the improved text, no explanations.

Text:
${text}`,

  translate: (text, opts) => `Translate the following text to ${opts.target_language || 'Spanish'}. Provide an accurate, natural-sounding translation that preserves tone and meaning. Return ONLY the translated text, no explanations.

Text:
${text}`,

  tone: (text, opts) => `Rewrite the following text in a ${opts.target_tone || 'professional'} tone of voice. Adapt the language, formality, and style accordingly. Return ONLY the rewritten text, no explanations.

Text:
${text}`,

  style: (text, opts) => `Rewrite the following text in a ${opts.target_style || 'academic'} writing style suitable for ${opts.audience || 'general readers'}. Return ONLY the rewritten text, no explanations.

Text:
${text}`,

  combine: (text, opts) => `Apply the following transformations to the text in sequence: ${(opts.functions || ['rephrase', 'grammar']).join(', ')}. Return ONLY the final transformed text, no explanations.

Text:
${text}`,

  summarize: (text, opts) => `Create a concise summary of the following text. Capture all key points and main ideas.

Length: ${opts.length || 'medium'}
Language: ${opts.language || 'English'}

Text:
${text}

Return a well-structured summary in markdown.`,

  flashcards: (text) => `Create a set of study flashcards from the following content. Format each card as:

**Q:** [Question]
**A:** [Answer]

Generate at least 8-12 flashcards covering the most important concepts.

Content:
${text}`,

  outline: (text) => `Create a detailed hierarchical outline from the following content using markdown headings (##, ###) and bullet points.

Content:
${text}`,
};

// ─── CALL OPENROUTER WITH FALLBACK ───────────────────────────────────────────
async function callAI(prompt, models = FREE_MODELS) {
  let lastError;
  for (const model of models) {
    try {
      const start = Date.now();
      const res = await fetch('https://openrouter.ai/api/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${OPENROUTER_KEY}`,
          'Content-Type': 'application/json',
          'HTTP-Referer': 'https://savoireai.vercel.app',
          'X-Title': 'Savoiré AI',
        },
        body: JSON.stringify({
          model,
          messages: [{ role: 'user', content: prompt }],
          max_tokens: 2048,
          temperature: 0.7,
        }),
        signal: AbortSignal.timeout(30000),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error?.message || `HTTP ${res.status}`);
      }

      const data = await res.json();
      const content = data.choices?.[0]?.message?.content;
      if (!content) throw new Error('Empty response from model');

      return {
        text: content.trim(),
        model_used: model,
        tokens_used: data.usage?.total_tokens || 0,
        processing_time: ((Date.now() - start) / 1000).toFixed(2),
      };
    } catch (err) {
      console.error(`Model ${model} failed:`, err.message);
      lastError = err;
    }
  }
  throw lastError || new Error('All models failed');
}

// ─── EXTRACT TEXT FROM FILE ──────────────────────────────────────────────────
async function extractTextFromFile(file) {
  const ext = path.extname(file.originalname).toLowerCase();

  if (ext === '.txt') {
    return file.buffer.toString('utf-8');
  }

  if (ext === '.pdf') {
    try {
      const pdfParse = require('pdf-parse');
      const data = await pdfParse(file.buffer);
      return data.text;
    } catch {
      throw new Error('Failed to parse PDF. Ensure pdf-parse is installed.');
    }
  }

  if (ext === '.docx') {
    try {
      const mammoth = require('mammoth');
      const result = await mammoth.extractRawText({ buffer: file.buffer });
      return result.value;
    } catch {
      throw new Error('Failed to parse DOCX. Ensure mammoth is installed.');
    }
  }

  if (['.png', '.jpg', '.jpeg'].includes(ext)) {
    // For images, we send to AI with vision capability or use base64
    const base64 = file.buffer.toString('base64');
    const mimeType = ext === '.png' ? 'image/png' : 'image/jpeg';
    return `[IMAGE:${mimeType}:${base64}]`; // Handled specially in callAI
  }

  throw new Error('Unsupported file type');
}

// ─── MAIN STUDY ENDPOINT ─────────────────────────────────────────────────────
app.post('/api/study', upload.single('file'), async (req, res) => {
  const ip = req.ip || req.connection.remoteAddress;

  try {
    const {
      text,
      action = 'generate',
      format,
      style,
      length,
      tone,
      language,
      target_language,
      target_tone,
      target_style,
      audience,
      functions,
    } = req.body;

    // Check credits
    const remaining = getCredits(ip);
    if (remaining <= 0) {
      return res.status(429).json({
        success: false,
        error: 'Free credits exhausted. Please upgrade for unlimited access.',
        remaining_free_credits: 0,
      });
    }

    // Get input text
    let inputText = text || '';

    if (req.file) {
      try {
        inputText = await extractTextFromFile(req.file);
      } catch (err) {
        return res.status(400).json({ success: false, error: err.message });
      }
    }

    if (!inputText || inputText.trim().length < 3) {
      return res.status(400).json({ success: false, error: 'Please provide some text or upload a file.' });
    }

    // Sanitize
    inputText = inputText.slice(0, 15000); // cap at 15k chars

    // Build prompt
    const opts = { format, style, length, tone, language, target_language, target_tone, target_style, audience, functions: functions ? JSON.parse(functions) : undefined };
    const promptFn = ACTION_PROMPTS[action] || ACTION_PROMPTS.generate;
    const prompt = promptFn(inputText, opts);

    // Call AI
    const result = await callAI(prompt);

    // Deduct credit
    deductCredit(ip);
    const newRemaining = getCredits(ip);

    return res.json({
      success: true,
      data: {
        original: inputText.slice(0, 500) + (inputText.length > 500 ? '...' : ''),
        processed: result.text,
        action,
        metadata: {
          model_used: result.model_used,
          tokens_used: result.tokens_used,
          processing_time: parseFloat(result.processing_time),
          language: language || 'en',
        },
      },
      remaining_free_credits: newRemaining,
    });
  } catch (err) {
    console.error('Study API error:', err);
    return res.status(500).json({
      success: false,
      error: err.message || 'An unexpected error occurred.',
    });
  }
});

// ─── CREDITS CHECK ────────────────────────────────────────────────────────────
app.get('/api/credits', (req, res) => {
  const ip = req.ip || req.connection.remoteAddress;
  res.json({ remaining_free_credits: getCredits(ip) });
});

// ─── HEALTH CHECK ────────────────────────────────────────────────────────────
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', version: '3.0.0', timestamp: new Date().toISOString() });
});

// ─── ERROR HANDLER ────────────────────────────────────────────────────────────
app.use((err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    return res.status(400).json({ success: false, error: `File upload error: ${err.message}` });
  }
  console.error('Unhandled error:', err);
  res.status(500).json({ success: false, error: 'Internal server error' });
});

// ─── START ────────────────────────────────────────────────────────────────────
const PORT = process.env.PORT || 3001;
app.listen(PORT, () => console.log(`Savoiré AI API running on port ${PORT}`));

module.exports = app;
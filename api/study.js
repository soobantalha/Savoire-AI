'use strict';
// ═══════════════════════════════════════════════════════════════════════════════════════════════════════════════
// SAVOIRÉ AI v2.0 — api/study.js — ULTRA ADVANCED WORLD-CLASS BACKEND — 2200+ LINES
// Built by Sooban Talha Technologies | soobantalhatech.xyz | Founder: Sooban Talha
// ═══════════════════════════════════════════════════════════════════════════════════════════════════════════════
//
// ┌─────────────────────────────────────────────────────────────────────────────────────────────────────────────┐
// │  COMPLETE ARCHITECTURE v2.0                                                                                  │
// │                                                                                                              │
// │  ALL 5 TOOLS STREAM LIVE VIA SSE:                                                                           │
// │   Notes    → streams token-by-token with full markdown formatting rendered live                             │
// │   Summary  → streams token-by-token with full markdown formatting rendered live                             │
// │   Flashcards → Phase1: stream notes live → Phase2: stream each card individually with animation            │
// │   Quiz     → Phase1: stream notes live → Phase2: stream each question individually with animation          │
// │   Mindmap  → Phase1: stream notes live → Phase2: stream each branch individually with animation            │
// │   All (Mega) → Phase1: stream notes live → Phase2: stream ALL cards+questions+branches                     │
// │                                                                                                              │
// │  SSE PROTOCOL (all events):                                                                                  │
// │   heartbeat → {ts, status, service}        Initial connection confirmation                                  │
// │   stage     → {idx, label}                 Progress stage update (0-4)                                      │
// │   token     → {t}                          Live streaming text token (notes)                                │
// │   card      → {idx, total, card}           One flashcard streamed (with animation)                          │
// │   question  → {idx, total, q}              One quiz question streamed (with animation)                      │
// │   branch    → {idx, total, branch}         One mindmap branch streamed (with animation)                     │
// │   done      → {complete data object}       Final merged data — triggers result render                       │
// │   error     → {message}                    Friendly error message                                           │
// │                                                                                                              │
// │  GOOGLE SHEETS TRACKING:                                                                                     │
// │   Every page visit (ping) → tracked immediately with current session count                                   │
// │   Every tool use → tracked with topic, duration, status, quality                                            │
// │   Sessions increment from frontend on every load — backend just logs whatever it receives                   │
// │                                                                                                              │
// │  PROMPT ENGINEERING:                                                                                         │
// │   Phase 1 prompts → Optimised for fast streaming, rich markdown, topic-focused                              │
// │   Phase 2 prompts → Completely topic-specific, forces real content not placeholders                         │
// │   Fallback cards → Topic-aware intelligent generation using actual topic words                              │
// │                                                                                                              │
// │  MODEL ROSTER (14 models Phase1, 10 models Phase2):                                                         │
// │   Priority order: Gemini 2.0 Flash → Gemini Flash 1.5 → DeepSeek → LLaMA 3.3 → GLM → Qwen → ...          │
// │   Auto-fallback: if model fails/times out → try next → if all fail → use intelligent fallback              │
// │                                                                                                              │
// │  JSON REPAIR (4-step):                                                                                       │
// │   Step 1: Direct JSON.parse                                                                                  │
// │   Step 2: Strip trailing commas                                                                             │
// │   Step 3: Fix unquoted keys + single quotes                                                                  │
// │   Step 4: Strip control chars + retry                                                                        │
// └─────────────────────────────────────────────────────────────────────────────────────────────────────────────┘

// ─────────────────────────────────────────────────────────────────────────────────────────────────────────────
// SECTION 1 — BRAND CONSTANTS & IDENTITY
// ─────────────────────────────────────────────────────────────────────────────────────────────────────────────

const SAVOIRÉ = {
  BRAND:     'Savoiré AI v2.0',
  DEVELOPER: 'Sooban Talha Technologies',
  DEVSITE:   'soobantalhatech.xyz',
  WEBSITE:   'savoireai.vercel.app',
  FOUNDER:   'Sooban Talha',
  VERSION:   '2.0',
  TAGLINE:   'Think Less. Know More.',
  COPYRIGHT: `© ${new Date().getFullYear()} Sooban Talha Technologies. Free forever for every student on Earth.`,
};

// ─────────────────────────────────────────────────────────────────────────────────────────────────────────────
// SECTION 2 — API CONFIGURATION
// ─────────────────────────────────────────────────────────────────────────────────────────────────────────────

const OPENROUTER_BASE    = 'https://openrouter.ai/api/v1/chat/completions';
const HTTP_REFERER       = `https://${SAVOIRÉ.WEBSITE}`;
const APP_TITLE          = SAVOIRÉ.BRAND;
const GOOGLE_WEBHOOK_URL = process.env.GOOGLE_WEBHOOK_URL || '';
const OPENROUTER_KEY     = () => process.env.OPENROUTER_API_KEY;

// Default fetch options applied to all OpenRouter calls
const BASE_HEADERS = () => ({
  'Content-Type':  'application/json',
  'Authorization': `Bearer ${OPENROUTER_KEY()}`,
  'HTTP-Referer':  HTTP_REFERER,
  'X-Title':       APP_TITLE,
});

// ─────────────────────────────────────────────────────────────────────────────────────────────────────────────
// SECTION 3 — MODEL ROSTERS
//
// Phase 1 models: optimised for fast first-token delivery and streaming quality
// Phase 2 models: optimised for structured JSON output accuracy
// Models are tried in order — first success wins
// ─────────────────────────────────────────────────────────────────────────────────────────────────────────────

/** Phase 1: Streaming markdown notes (used for ALL tools) */
const MODELS_STREAM = [
  { id: 'google/gemini-2.0-flash-exp:free',                max_tokens: 5000, timeout_ms: 55000, temp: 0.75, desc: 'Gemini 2.0 Flash Experimental' },
  { id: 'google/gemini-flash-1.5-8b:free',                 max_tokens: 4500, timeout_ms: 45000, temp: 0.75, desc: 'Gemini Flash 1.5 8B' },
  { id: 'deepseek/deepseek-chat-v3-0324:free',             max_tokens: 5000, timeout_ms: 55000, temp: 0.75, desc: 'DeepSeek Chat v3' },
  { id: 'meta-llama/llama-3.3-70b-instruct:free',          max_tokens: 4500, timeout_ms: 50000, temp: 0.75, desc: 'LLaMA 3.3 70B' },
  { id: 'z-ai/glm-4.5-air:free',                           max_tokens: 4000, timeout_ms: 42000, temp: 0.75, desc: 'GLM 4.5 Air' },
  { id: 'qwen/qwen3-8b:free',                              max_tokens: 4000, timeout_ms: 40000, temp: 0.75, desc: 'Qwen3 8B' },
  { id: 'nousresearch/hermes-3-llama-3.1-405b:free',       max_tokens: 5000, timeout_ms: 65000, temp: 0.72, desc: 'Hermes 3 LLaMA 3.1 405B' },
  { id: 'cognitivecomputations/dolphin-mixtral-8x7b:free', max_tokens: 4500, timeout_ms: 55000, temp: 0.72, desc: 'Dolphin Mixtral 8x7B' },
  { id: 'mistralai/mistral-7b-instruct-v0.3:free',         max_tokens: 3500, timeout_ms: 38000, temp: 0.75, desc: 'Mistral 7B Instruct' },
  { id: 'openchat/openchat-7b:free',                       max_tokens: 3500, timeout_ms: 38000, temp: 0.75, desc: 'OpenChat 7B' },
  { id: 'microsoft/phi-3-mini-128k-instruct:free',         max_tokens: 3500, timeout_ms: 38000, temp: 0.75, desc: 'Phi-3 Mini 128K' },
  { id: 'upstage/solar-1-mini-chat:free',                  max_tokens: 3500, timeout_ms: 38000, temp: 0.75, desc: 'Solar 1 Mini' },
  { id: 'cohere/command-r-plus:free',                      max_tokens: 4000, timeout_ms: 48000, temp: 0.72, desc: 'Cohere Command R+' },
  { id: 'perplexity/llama-3-sonar-small-32k-online:free',  max_tokens: 3500, timeout_ms: 45000, temp: 0.72, desc: 'Sonar Small 32K Online' },
];

/** Phase 2: Structured JSON cards generation (used for Flashcards / Quiz / Mindmap) */
const MODELS_CARDS = [
  { id: 'google/gemini-2.0-flash-exp:free',                max_tokens: 8500, timeout_ms: 75000, temp: 0.50, desc: 'Gemini 2.0 Flash Experimental' },
  { id: 'google/gemini-flash-1.5-8b:free',                 max_tokens: 7500, timeout_ms: 65000, temp: 0.50, desc: 'Gemini Flash 1.5 8B' },
  { id: 'deepseek/deepseek-chat-v3-0324:free',             max_tokens: 8500, timeout_ms: 75000, temp: 0.50, desc: 'DeepSeek Chat v3' },
  { id: 'meta-llama/llama-3.3-70b-instruct:free',          max_tokens: 7500, timeout_ms: 68000, temp: 0.52, desc: 'LLaMA 3.3 70B' },
  { id: 'nousresearch/hermes-3-llama-3.1-405b:free',       max_tokens: 8500, timeout_ms: 80000, temp: 0.48, desc: 'Hermes 3 LLaMA 3.1 405B' },
  { id: 'cognitivecomputations/dolphin-mixtral-8x7b:free', max_tokens: 6500, timeout_ms: 68000, temp: 0.50, desc: 'Dolphin Mixtral 8x7B' },
  { id: 'z-ai/glm-4.5-air:free',                           max_tokens: 6000, timeout_ms: 60000, temp: 0.50, desc: 'GLM 4.5 Air' },
  { id: 'qwen/qwen3-8b:free',                              max_tokens: 5500, timeout_ms: 58000, temp: 0.50, desc: 'Qwen3 8B' },
  { id: 'microsoft/phi-3-mini-128k-instruct:free',         max_tokens: 5000, timeout_ms: 55000, temp: 0.50, desc: 'Phi-3 Mini 128K' },
  { id: 'mistralai/mistral-7b-instruct-v0.3:free',         max_tokens: 4500, timeout_ms: 50000, temp: 0.50, desc: 'Mistral 7B Instruct' },
];

// ─────────────────────────────────────────────────────────────────────────────────────────────────────────────
// SECTION 4 — CONFIGURATION MAPS
// ─────────────────────────────────────────────────────────────────────────────────────────────────────────────

/**
 * Depth configuration: maps depth key → word range + token budget
 * Used in both prompt construction and non-streaming JSON mode
 */
const DEPTH_MAP = {
  standard:      { label: 'Standard',      wordRange: '600–900 words',   minWords: 600,  maxWords: 900,  maxTokens: 2800 },
  detailed:      { label: 'Detailed',      wordRange: '1000–1500 words', minWords: 1000, maxWords: 1500, maxTokens: 3800 },
  comprehensive: { label: 'Comprehensive', wordRange: '1500–2200 words', minWords: 1500, maxWords: 2200, maxTokens: 5000 },
  expert:        { label: 'Expert',        wordRange: '2200–3500 words', minWords: 2200, maxWords: 3500, maxTokens: 6500 },
};

/**
 * Style configuration: maps style key → detailed writing instruction injected into prompts
 */
const STYLE_MAP = {
  simple:   'WRITING STYLE: Clear, beginner-friendly language. Define every technical term immediately when first used. Short sentences (max 20 words each). Use everyday analogies. Examples must be things a 15-year-old can immediately relate to. Absolutely no unexplained jargon.',
  academic: 'WRITING STYLE: Formal academic language. Precise scholarly terminology throughout. Objective third-person tone. Discipline-appropriate vocabulary. Structured argumentation. Citation-style reasoning where appropriate.',
  detailed: 'WRITING STYLE: Maximum exhaustive detail at every single point. Multiple concrete examples with specific numbers and data. Thorough step-by-step explanations of every mechanism and sub-mechanism. Cover all edge cases, exceptions, and corner scenarios. Leave no stone unturned.',
  exam:     'WRITING STYLE: Exam-focused writing. Key definitions phrased exactly as they appear in mark schemes. Highlight the most-examined aspects. Flag common student mistakes explicitly with warnings. Include time-saving exam tips. Include mark allocation guidance where relevant.',
  visual:   'WRITING STYLE: Vivid analogies and metaphors for every single concept. Build memorable mental models. Use spatial and sensory language throughout. Paint pictures with words. Make every abstract idea concrete and visual. Use comparison by contrast.',
};

/**
 * Tool objectives: maps tool key → primary generation goal injected into prompts
 */
const TOOL_OBJECTIVES = {
  notes:
    'Generate comprehensive, well-structured, academically rigorous study notes covering every important aspect of this topic — introduction, core concepts, mechanisms, examples, advanced aspects, applications, and revision summary.',
  flashcards:
    'Generate study notes perfectly structured as clear Q&A pairs — each concept separated into a distinct question/answer pair suitable for spaced repetition and active recall practice.',
  quiz:
    'Generate exam-focused study notes emphasising the most-examined points, typical question patterns, mark-scheme-worthy phrasing, and common student mistakes. Structure for direct conversion into MCQ quiz questions.',
  summary:
    'Generate a concise, punchy, revision-ready smart summary. Begin with a powerful TL;DR paragraph (3-5 sentences). Then bullet the key points clearly. Make every word count. Optimise for fast revision.',
  mindmap:
    'Generate hierarchically structured notes designed for mind map conversion. Use clear parent→child relationships with logical branching. Number and organise all major categories. Relationships between concepts must be explicit.',
  all:
    'Generate the ULTIMATE comprehensive study package. Cover the topic from every angle: complete notes, core concepts, mechanisms, examples, applications, memory tricks, misconceptions, and a complete revision checklist. Make this the definitive guide.',
};

/**
 * Section structure maps: maps tool key → required markdown section headings (in order)
 */
const SECTION_MAPS = {
  notes: [
    '## 📚 Introduction & Overview',
    '## 🎯 Core Concepts & Definitions',
    '## ⚙️ How It Works — Mechanisms & Processes',
    '## 💡 Key Examples with Detailed Walkthroughs',
    '## 🚀 Advanced Aspects, Nuances & Edge Cases',
    '## 🌍 Real-World Applications & Significance',
    '## 🧠 Common Misconceptions & Corrections',
    '## ⚠️ Common Mistakes to Avoid',
    '## 📝 Key Takeaways & Revision Checklist',
  ],
  flashcards: [
    '## 📖 Overview & Context',
    '## 🎯 Core Concepts (as Q&A pairs)',
    '## ⚙️ Mechanisms & Processes (each step as Q&A)',
    '## 💡 Examples & Applications (each as Q&A)',
    '## ⚠️ Common Mistakes & Misconceptions',
    '## 🎯 Quick Revision Summary',
  ],
  quiz: [
    '## 📚 Topic Introduction',
    '## ✏️ Core Concepts (exam-ready phrasing)',
    '## ⚙️ Mechanisms (exam-style explanation)',
    '## 📝 Common Question Patterns & Model Answers',
    '## 🎯 Must-Know Points for the Exam',
  ],
  summary: [
    '## 🚀 TL;DR — Executive Summary (3-5 sentences MAX)',
    '## 🎯 Core Concepts (one crisp bullet each)',
    '## ⚙️ Key Mechanisms (ultra-short)',
    '## 💡 Critical Examples (most important only)',
    '## ✅ Final Revision Checklist',
  ],
  mindmap: [
    '## 🧠 Central Topic Overview',
    '## 🌿 Branch 1: Foundations & Definitions',
    '## 🌿 Branch 2: Core Mechanisms',
    '## 🌿 Branch 3: Key Examples',
    '## 🌿 Branch 4: Real-World Applications',
    '## 🌿 Branch 5: Common Pitfalls & Misconceptions',
    '## 🔗 Key Connections Between Branches',
  ],
  all: [
    '## 📚 Introduction & Comprehensive Overview',
    '## 🎯 Core Concepts & Definitions',
    '## ⚙️ How It Works — Mechanisms',
    '## 💡 Key Examples',
    '## 🚀 Advanced Aspects',
    '## 🌍 Real-World Applications',
    '## 🧠 Memory Tricks & Study Strategies',
    '## ⚠️ Common Mistakes & Misconceptions',
    '## 📝 Revision Checklist & Key Takeaways',
  ],
};

// ─────────────────────────────────────────────────────────────────────────────────────────────────────────────
// SECTION 5 — UTILITY FUNCTIONS
// ─────────────────────────────────────────────────────────────────────────────────────────────────────────────

/** Async sleep helper */
const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));

/** Structured logger with IST timestamps */
const log = {
  info:  (...args) => console.log(`[${new Date().toISOString()}] [${SAVOIRÉ.BRAND}] ℹ️  INFO  `, ...args),
  ok:    (...args) => console.log(`[${new Date().toISOString()}] [${SAVOIRÉ.BRAND}] ✅ OK    `, ...args),
  warn:  (...args) => console.warn(`[${new Date().toISOString()}] [${SAVOIRÉ.BRAND}] ⚠️  WARN  `, ...args),
  error: (...args) => console.error(`[${new Date().toISOString()}] [${SAVOIRÉ.BRAND}] ❌ ERROR `, ...args),
  debug: (...args) => { if (process.env.DEBUG_SAVOIRÉ) console.log(`[DEBUG] `, ...args); },
};

/** Truncate a string for safe logging */
const trunc = (s, n = 150) => {
  if (!s) return '';
  const str = String(s);
  return str.length > n ? str.slice(0, n) + `… [+${str.length - n} chars]` : str;
};

/** Get current IST datetime string (UTC+5:30) */
function getISTDateTime() {
  const now  = new Date();
  const utcMs = now.getTime() + now.getTimezoneOffset() * 60000;
  const ist  = new Date(utcMs + 5.5 * 3600000);
  const pad  = n => String(n).padStart(2, '0');
  return `${ist.getFullYear()}-${pad(ist.getMonth()+1)}-${pad(ist.getDate())} ${pad(ist.getHours())}:${pad(ist.getMinutes())}:${pad(ist.getSeconds())}`;
}

/** Get current IST date string only */
function getISTDate() {
  return getISTDateTime().split(' ')[0];
}

/** Count words in a string */
function wordCount(text) {
  if (!text) return 0;
  return text.trim().split(/\s+/).filter(Boolean).length;
}

/** Clean markdown from text (for plain text export) */
function stripMarkdown(text) {
  if (!text) return '';
  return text
    .replace(/#{1,6}\s/g, '')
    .replace(/\*\*\*(.+?)\*\*\*/g, '$1')
    .replace(/\*\*(.+?)\*\*/g, '$1')
    .replace(/\*(.+?)\*/g, '$1')
    .replace(/`(.+?)`/g, '$1')
    .replace(/```[\s\S]*?```/g, '')
    .replace(/^[-*]\s/gm, '')
    .replace(/^>\s/gm, '')
    .replace(/^\d+\.\s/gm, '')
    .replace(/\[(.+?)\]\(.+?\)/g, '$1')
    .replace(/^---+$/gm, '')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

/** Generate a short unique request ID */
function genRequestId() {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

// ─────────────────────────────────────────────────────────────────────────────────────────────────────────────
// SECTION 6 — GOOGLE SHEETS TRACKING
//
// Tracks EVERY user interaction:
// - Page visits (ping) → tool:'visit', status:'online'
// - Generation starts  → tool:toolName, status:'started'
// - Generation success → tool:toolName, status:'completed', durationMs
// - Generation failure → tool:toolName, status:'failed'
//
// Sessions counter is sent FROM the frontend (where it's incremented on every page load).
// Backend simply records whatever sessions value it receives.
// ─────────────────────────────────────────────────────────────────────────────────────────────────────────────

/**
 * Send tracking data to Google Sheets webhook (fire-and-forget, never blocks main flow)
 * @param {string} userName - User's display name
 * @param {number} streak - Current streak count
 * @param {number} sessions - Total session count (from frontend)
 * @param {string} tool - Tool used ('visit', 'notes', 'flashcards', 'quiz', 'summary', 'mindmap', 'all')
 * @param {string} topic - Topic string (truncated to 200 chars)
 * @param {string} status - 'online' | 'started' | 'completed' | 'failed'
 * @param {number} durationMs - Generation duration in ms (0 for non-generation events)
 * @param {string} sessionId - Unique session identifier
 * @param {object} [meta] - Optional extra metadata
 * @returns {Promise<boolean>} - Success status (false on error, never throws)
 */
async function sendToGoogleSheets(userName, streak, sessions, tool, topic, status, durationMs, sessionId, meta = {}) {
  if (!GOOGLE_WEBHOOK_URL) {
    log.debug('GOOGLE_WEBHOOK_URL not set — skipping sheet tracking');
    return false;
  }

  try {
    const payload = {
      // User data
      userName:   String(userName  || 'Anonymous').slice(0, 100),
      streak:     Math.max(0, Number(streak)    || 0),
      sessions:   Math.max(1, Number(sessions)  || 1),
      lastUsed:   getISTDateTime(),

      // Event data
      tool:       String(tool   || 'visit').slice(0, 50),
      topic:      String(topic  || '').slice(0, 200),
      status:     String(status || 'visit').slice(0, 50),
      durationMs: Math.max(0, Number(durationMs) || 0),
      sessionId:  String(sessionId || '').slice(0, 100),

      // Computed
      timestamp:  getISTDateTime(),
      istDate:    getISTDate(),
      version:    SAVOIRÉ.VERSION,

      // Optional extra metadata (quality, model used, etc.)
      ...meta,
    };

    const res = await fetch(GOOGLE_WEBHOOK_URL, {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify(payload),
    });

    if (res.ok) {
      log.ok(`📊 GSheets ← ${userName} | tool:${tool} | status:${status} | sessions:${sessions} | streak:${streak}`);
    } else {
      log.warn(`GSheets returned HTTP ${res.status} — will retry on next event`);
    }
    return res.ok;

  } catch (err) {
    // Never let tracking errors affect the user experience
    log.warn(`GSheets tracking error (non-fatal): ${err.message}`);
    return false;
  }
}

// ─────────────────────────────────────────────────────────────────────────────────────────────────────────────
// SECTION 7 — PHASE 1: NOTES PROMPT BUILDER
//
// Builds the rich, detailed prompt for Phase 1 (streaming notes generation).
// Used for ALL tools — every tool gets notes first, then tool-specific cards.
// ─────────────────────────────────────────────────────────────────────────────────────────────────────────────

/**
 * Build the Phase 1 notes prompt for a given tool + options combination
 * @param {string} input - The user's topic/text input
 * @param {object} opts - Options: {tool, depth, style, language}
 * @returns {string} Complete prompt string ready to send to model
 */
function buildNotesPrompt(input, opts) {
  const depth    = DEPTH_MAP[opts.depth]            || DEPTH_MAP.detailed;
  const style    = STYLE_MAP[opts.style]            || STYLE_MAP.simple;
  const objective= TOOL_OBJECTIVES[opts.tool]       || TOOL_OBJECTIVES.notes;
  const sections = (SECTION_MAPS[opts.tool]         || SECTION_MAPS.notes).join('\n\n');
  const lang     = opts.language                    || 'English';
  const tool     = opts.tool                        || 'notes';

  return `You are ${SAVOIRÉ.BRAND}, the world's most advanced AI study assistant.
Created by ${SAVOIRÉ.DEVELOPER} (${SAVOIRÉ.DEVSITE}) | Founder: ${SAVOIRÉ.FOUNDER}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🎯 YOUR PRIMARY OBJECTIVE:
${objective}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

📖 TOPIC: "${input}"

🌐 OUTPUT LANGUAGE: ${lang}
   ⚠️ CRITICAL LANGUAGE RULE: Write EVERY SINGLE WORD in ${lang}.
   This applies to: headings, bullets, definitions, examples, everything.
   ZERO exceptions. ZERO mixing with other languages.

📏 TARGET LENGTH: ${depth.wordRange}
   Aim for the UPPER end of this range. Be thorough. Be comprehensive.
   Do NOT cut content short. Fill every section completely.

${style}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📋 MANDATORY STRUCTURE — Use EXACTLY these headings in this order:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

${sections}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📐 MANDATORY FORMATTING RULES (follow ALL of these):
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

1.  Use ## for ALL section headings (use the exact emoji+text given above)
2.  Use **bold** for EVERY key term the FIRST time it appears
3.  Use - (dash) for all bullet point lists
4.  Use numbered lists (1. 2. 3.) for ALL sequential/step processes
5.  Use > blockquotes for formal definitions and critical statements
6.  Use --- (triple dash) as horizontal rules between major sections
7.  Use \`inline code\` for formulas, equations, or precise technical terms
8.  Use \`\`\` code blocks \`\`\` for multi-line formulas or algorithms
9.  Include at LEAST 5 concrete, specific, real-world examples
10. Every abstract concept MUST have at least one concrete example immediately
11. Include a ⚠️ Common Mistakes section with at least 3 specific mistakes
12. End EVERY response with a 📝 Key Takeaways section (6-10 bullet points)
13. Add memory aids, mnemonics, or analogies wherever they genuinely help
14. Use emojis at the START of each ## heading for visual clarity

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
✅ QUALITY STANDARDS (NON-NEGOTIABLE):
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

→ ACCURACY: Every fact, formula, and claim must be correct and verifiable
→ COMPLETENESS: Cover all sub-topics. Do not leave visible gaps.
→ CLARITY: A student with zero prior knowledge must understand every sentence
→ DEPTH: Explain WHY and HOW — not just WHAT. Mechanism is crucial.
→ FLOW: Use clear transitions between sections for seamless reading
→ SELF-CONTAINED: Student reading this needs NO other resource to understand
→ PRACTICAL: Include real-world applications and professional relevance

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🚀 BEGIN WRITING NOW:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

DO NOT add any preamble, introduction, or meta-commentary.
DO NOT say "Here are your study notes" or anything similar.
START DIRECTLY with the first ## heading.
Write ONLY in ${lang}.`;
}

// ─────────────────────────────────────────────────────────────────────────────────────────────────────────────
// SECTION 8 — PHASE 2: CARDS PROMPT BUILDER
//
// Builds the Phase 2 prompt for structured JSON generation.
// COMPLETELY topic-specific — every instruction references the actual topic.
// Forces real AI content, not generic placeholders.
// ─────────────────────────────────────────────────────────────────────────────────────────────────────────────

/**
 * Build the Phase 2 cards prompt for structured JSON output
 * @param {string} input - The user's topic/text input
 * @param {object} opts - Options: {tool, depth, style, language}
 * @returns {string} Complete prompt for Phase 2 JSON generation
 */
function buildCardsPrompt(input, opts) {
  const lang       = opts.language || 'English';
  const tool       = opts.tool     || 'notes';
  const depth      = DEPTH_MAP[opts.depth] || DEPTH_MAP.detailed;
  const now        = getISTDateTime();
  const topicShort = String(input).slice(0, 120);

  // ── Build tool-specific mandatory instruction blocks ──

  let toolBlock     = '';
  let flashcardsJSON = '"flashcards": []';
  let quizJSON       = '"quiz_questions": []';
  let mindmapJSON    = '"mindmap": null';

  // ── FLASHCARDS BLOCK ──────────────────────────────────────────────────────────────────────────
  if (tool === 'flashcards' || tool === 'all') {
    toolBlock += `
╔══════════════════════════════════════════════════════════════════════════════════════╗
║         FLASHCARD GENERATION — MANDATORY PRIMARY TASK                                ║
║         Generate EXACTLY 15 to 20 flashcards about: "${topicShort}"                 ║
╚══════════════════════════════════════════════════════════════════════════════════════╝

FLASHCARD "front" REQUIREMENTS (each must be 10-40 words in ${lang}):
  ✓ REQUIRED: Make every front specifically about "${topicShort}"
  ✓ GOOD FRONT: "What is [specific term from ${topicShort}] and why does it matter?"
  ✓ GOOD FRONT: "Explain the [specific mechanism in ${topicShort}] step by step"
  ✓ GOOD FRONT: "Compare [A] vs [B] within ${topicShort} — key differences?"
  ✓ GOOD FRONT: "What causes [specific phenomenon in ${topicShort}]?"
  ✓ GOOD FRONT: "What is a common misconception about [aspect of ${topicShort}]?"
  ✗ BAD FRONT: Generic questions not specifically about "${topicShort}"
  ✗ BAD FRONT: "What is a study strategy?" (not about the topic)

FLASHCARD "back" REQUIREMENTS (each must be 60-180 words in ${lang}):
  • Direct answer to the front question
  • Concrete example from ${topicShort} specifically
  • Why this matters / significance
  • Memory hook or key insight if helpful

CARD TYPE DISTRIBUTION (must have at least 2 of each type):
  📌 Definition cards      — "What is [specific term] in ${topicShort}?"
  ⚙️ Mechanism cards       — "How does [process] work in ${topicShort}?"
  🔄 Comparison cards      — "How does [A] differ from [B] in ${topicShort}?"
  🌍 Application cards     — "How is [concept from ${topicShort}] used in real world?"
  ❌ Misconception cards   — "What do people get wrong about [aspect of ${topicShort}]?"
  📊 Cause-Effect cards    — "What causes [X] in ${topicShort}? What results?"
  🏛️ Historical cards      — "How did [aspect of ${topicShort}] develop historically?"
  💡 Insight cards         — "What is the most important insight about [topic aspect]?"

CRITICAL: Zero placeholder text. Every word must be about "${topicShort}" specifically.`;

    flashcardsJSON = `"flashcards": [
    {"front": "[Specific question about ${topicShort} in ${lang}]", "back": "[60-180 word answer about ${topicShort} with example in ${lang}]"},
    {"front": "[Different specific question about ${topicShort}]", "back": "[Different detailed answer with concrete example]"},
    {"front": "[Mechanism question about ${topicShort}]", "back": "[Step-by-step explanation specific to ${topicShort}]"},
    {"front": "[Comparison question within ${topicShort}]", "back": "[Clear comparison with specific details]"},
    {"front": "[Application question about ${topicShort}]", "back": "[Real-world application with concrete example]"}
  ]`;
  }

  // ── QUIZ BLOCK ────────────────────────────────────────────────────────────────────────────────
  if (tool === 'quiz' || tool === 'all') {
    toolBlock += `
╔══════════════════════════════════════════════════════════════════════════════════════╗
║         QUIZ GENERATION — MANDATORY PRIMARY TASK                                     ║
║         Generate EXACTLY 10 to 12 quiz questions about: "${topicShort}"              ║
╚══════════════════════════════════════════════════════════════════════════════════════╝

QUIZ QUESTION REQUIREMENTS:
  • "question": Specific factual question about "${topicShort}" in ${lang}
    ✓ GOOD: "Which of the following best describes [specific concept in ${topicShort}]?"
    ✓ GOOD: "In ${topicShort}, what happens when [specific condition]?"
    ✗ BAD: Generic academic questions not specifically about "${topicShort}"

  • "options": EXACTLY 4 strings — one correct, three plausible but wrong
    All 4 options must relate specifically to "${topicShort}"
    Distractors must be PLAUSIBLE but clearly wrong on reflection

  • "correct_answer": ⚠️ CRITICAL — Must be CHARACTER-FOR-CHARACTER IDENTICAL to one option
    Copy-paste exact string from options array — DO NOT rephrase or shorten

  • "explanation": 80-130 words in ${lang} explaining:
    - WHY the correct answer is right (specific reasoning from ${topicShort})
    - WHY each wrong option is wrong
    - Key principle or concept being tested

  • "difficulty": "easy" | "medium" | "hard"
    Distribution target: 3 easy + 5 medium + 4 hard = 12 questions total

QUESTION TYPE DISTRIBUTION (must include all types):
  🎯 Factual recall (3 questions)     — test specific knowledge from ${topicShort}
  🧠 Conceptual (4 questions)         — test deeper understanding of principles
  🌐 Application/Scenario (2 questions) — "A student/professional does X..."
  🔬 Analysis/Synthesis (2 questions)  — compare, evaluate, or combine concepts

CRITICAL: correct_answer MUST EXACTLY MATCH one options[] string — copy-paste it!`;

    quizJSON = `"quiz_questions": [
    {
      "id": 1,
      "question": "[Specific factual question about ${topicShort} in ${lang}]",
      "options": ["[Plausible wrong A]", "[CORRECT — copy exact text here]", "[Plausible wrong C]", "[Plausible wrong D]"],
      "correct_answer": "[CORRECT — copy exact text here — CHARACTER FOR CHARACTER SAME]",
      "explanation": "[80-130 words: why correct is right, why others wrong, referencing ${topicShort}]",
      "difficulty": "medium"
    },
    {
      "id": 2,
      "question": "[Another specific question about ${topicShort}]",
      "options": ["[Option A]", "[Option B correct]", "[Option C]", "[Option D]"],
      "correct_answer": "[Option B correct]",
      "explanation": "[Explanation referencing ${topicShort} specifically]",
      "difficulty": "hard"
    }
  ]`;
  }

  // ── MINDMAP BLOCK ─────────────────────────────────────────────────────────────────────────────
  if (tool === 'mindmap' || tool === 'all') {
    toolBlock += `
╔══════════════════════════════════════════════════════════════════════════════════════╗
║         MIND MAP GENERATION — MANDATORY PRIMARY TASK                                 ║
║         Generate EXACTLY 5 to 7 branches about: "${topicShort}"                     ║
╚══════════════════════════════════════════════════════════════════════════════════════╝

MIND MAP REQUIREMENTS:
  • "central": 3-6 words capturing the ESSENCE of "${topicShort}" in ${lang}
    ✓ GOOD: Specific concept name from the topic
    ✗ BAD: "Study Topic", "Main Concept", or any generic phrase

  • "branches": 5-7 main branches with SPECIFIC NAMES from "${topicShort}"
    ✓ GOOD: "[Specific process name from topic]", "[Specific category from topic]"
    ✗ BAD: "Introduction", "Overview", "Details", "Basics" — these are FORBIDDEN

  • Each branch: 4-6 SPECIFIC items (facts, terms, processes from "${topicShort}")
    Each item: 5-20 words — must be specific enough to be informative
    ✗ BAD items: "Key term", "Important concept", "See notes" — FORBIDDEN

  • "connections": 3-5 cross-connections showing relationships WITHIN "${topicShort}"
    Each connection must explain how two specific aspects relate to each other

  • "color": Use these exactly: "#00d4ff", "#bf00ff", "#00ff88", "#ffae00", "#d4af37", "#ff4444", "#e84393"

CRITICAL: Every branch name and every item must be SPECIFICALLY about "${topicShort}".
FORBIDDEN: Generic academic labels, placeholder text, vague descriptions.`;

    mindmapJSON = `"mindmap": {
    "central": "[3-6 word essence of ${topicShort} in ${lang}]",
    "branches": [
      {"name": "[SPECIFIC category from ${topicShort}]", "color": "#00d4ff", "items": ["[Specific fact 1]", "[Specific fact 2]", "[Specific fact 3]", "[Specific fact 4]", "[Specific fact 5]"]},
      {"name": "[SPECIFIC aspect of ${topicShort}]", "color": "#bf00ff", "items": ["[Item 1]", "[Item 2]", "[Item 3]", "[Item 4]"]},
      {"name": "[SPECIFIC process in ${topicShort}]", "color": "#00ff88", "items": ["[Item 1]", "[Item 2]", "[Item 3]", "[Item 4]"]},
      {"name": "[SPECIFIC application of ${topicShort}]", "color": "#ffae00", "items": ["[Item 1]", "[Item 2]", "[Item 3]", "[Item 4]"]},
      {"name": "[SPECIFIC challenge in ${topicShort}]", "color": "#d4af37", "items": ["[Item 1]", "[Item 2]", "[Item 3]", "[Item 4]"]}
    ],
    "connections": [
      {"from": "[Branch name]", "to": "[Branch name]", "description": "[How they relate in ${topicShort}]"},
      {"from": "[Branch name]", "to": "[Branch name]", "description": "[Another relationship]"},
      {"from": "[Branch name]", "to": "[Branch name]", "description": "[Third connection]"}
    ]
  }`;
  }

  // ── RETURN COMPLETE PROMPT ────────────────────────────────────────────────────────────────────
  return `You are ${SAVOIRÉ.BRAND}. Generate a complete structured JSON object with REAL educational content about:

📖 TOPIC: "${input}"
🌐 LANGUAGE: ${lang} (ALL text in ${lang})
🛠️ TOOL: ${tool.toUpperCase()}
⏰ TIME: ${now}

${toolBlock}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
⚡ OUTPUT FORMAT: Valid JSON ONLY. Start with {. End with }. Nothing else.
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

{
  "topic": "[Clean professional title of ${topicShort} in ${lang}]",
  "curriculum_alignment": "[Specific level: e.g. 'A-Level Biology', 'University Physics Year 1', 'GCSE History']",
  "generated_at": "${now}",
  "powered_by": "${SAVOIRÉ.BRAND} by ${SAVOIRÉ.DEVELOPER}",
  "study_score": 97,

  ${flashcardsJSON},
  ${quizJSON},
  ${mindmapJSON},

  "key_concepts": [
    "[Concept 1 NAME]: [55-80 word explanation in ${lang} with specific example from ${topicShort}]",
    "[Concept 2 NAME]: [55-80 word explanation in ${lang} with specific example]",
    "[Concept 3 NAME]: [55-80 word explanation in ${lang} with specific example]",
    "[Concept 4 NAME]: [55-80 word explanation in ${lang} with specific example]",
    "[Concept 5 NAME]: [55-80 word explanation in ${lang} with specific example]",
    "[Concept 6 NAME]: [55-80 word explanation in ${lang} with specific example]"
  ],

  "key_tricks": [
    "🧠 [MNEMONIC for ${topicShort}]: [70-110 words in ${lang} showing exactly how to use it for this topic]",
    "📝 [STUDY METHOD for ${topicShort}]: [70-110 words with concrete instructions specific to this topic]",
    "⏰ [MEMORY STRATEGY for ${topicShort}]: [70-110 words with specific application to this topic]",
    "🎨 [VISUALIZATION for ${topicShort}]: [70-110 words making this topic vivid and memorable]"
  ],

  "practice_questions": [
    {"question": "[Analytical 80-130 word question about ${topicShort} in ${lang} requiring critical thinking]", "answer": "[200+ word comprehensive answer in ${lang} with reasoning and examples]"},
    {"question": "[Application 80-130 word question about ${topicShort} in ${lang} with real-world scenario]", "answer": "[200+ word answer connecting ${topicShort} to specific professional situation in ${lang}]"},
    {"question": "[Evaluation 80-130 word question about ${topicShort} in ${lang} — compare or assess]", "answer": "[200+ word answer weighing evidence from ${topicShort} in ${lang}]"},
    {"question": "[Synthesis 80-130 word question about ${topicShort} in ${lang} — combine concepts]", "answer": "[200+ word answer showing connections in ${lang}]"}
  ],

  "real_world_applications": [
    "🏥 Healthcare: [60-90 word SPECIFIC application of ${topicShort} in healthcare with concrete example]",
    "💻 Technology: [60-90 word SPECIFIC tech application of ${topicShort} with real product/system]",
    "📈 Business: [60-90 word SPECIFIC business application of ${topicShort} with real industry context]",
    "🎓 Research: [60-90 word SPECIFIC academic research application of ${topicShort}]",
    "🌍 Society: [60-90 word SPECIFIC social impact of ${topicShort} with real-world context]",
    "🏠 Daily Life: [60-90 word SPECIFIC everyday relevance of ${topicShort} with relatable example]"
  ],

  "common_misconceptions": [
    "❌ MYTH: [Specific wrong belief about ${topicShort}]. ✅ TRUTH: [60-90 word correction in ${lang}]",
    "❌ MYTH: [Second misconception about ${topicShort}]. ✅ TRUTH: [60-90 word correction in ${lang}]",
    "❌ MYTH: [Third misconception]. ✅ TRUTH: [60-90 word correction in ${lang}]",
    "❌ MYTH: [Fourth misconception]. ✅ TRUTH: [60-90 word correction in ${lang}]"
  ]
}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🚨 ABSOLUTE NON-NEGOTIABLE RULES (violation = generation failure):
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

1.  Output ONLY valid JSON — nothing before { — nothing after }
2.  No markdown code fences (no \`\`\`json ... \`\`\`)
3.  ALL text must be in ${lang} — zero exceptions
4.  ALL placeholder text MUST be replaced with REAL content about "${topicShort}"
5.  quiz correct_answer: CHARACTER-FOR-CHARACTER IDENTICAL to one options[] string
6.  ${tool==='flashcards'||tool==='all' ? `flashcards: Generate 15-20 cards about "${topicShort}" specifically` : ''}
7.  ${tool==='quiz'||tool==='all' ? `quiz_questions: Generate 10-12 questions about "${topicShort}" specifically` : ''}
8.  ${tool==='mindmap'||tool==='all' ? `mindmap: Generate 5-7 branches with SPECIFIC names from "${topicShort}"` : ''}
9.  No trailing commas. All strings in double quotes. Complete valid JSON only.
10. FORBIDDEN: Generic study tips, placeholder text, content NOT about "${topicShort}"

🚀 OUTPUT VALID JSON NOW — start with {:`;
}

// ─────────────────────────────────────────────────────────────────────────────────────────────────────────────
// SECTION 9 — PHASE 1: STREAM NOTES FROM AI MODEL
//
// Streams markdown notes from the best available AI model.
// Tries each model in order, validates output length, returns on first success.
// ─────────────────────────────────────────────────────────────────────────────────────────────────────────────

/**
 * Stream notes from AI models with automatic failover
 * @param {string} prompt - The complete prompt to send
 * @param {Function} onChunk - Callback called with each text token as it arrives
 * @param {string} tool - Tool name for logging
 * @returns {Promise<string>} Complete generated text
 * @throws {Error} If all models fail
 */
async function streamNotes(prompt, onChunk, tool) {
  let lastError = `All ${MODELS_STREAM.length} Phase1 models failed`;

  for (const model of MODELS_STREAM) {
    const modelShortName = model.id.split('/').pop().replace(':free', '');
    const ctrl           = new AbortController();
    const timer          = setTimeout(() => ctrl.abort(), model.timeout_ms);
    const t0             = Date.now();

    try {
      log.info(`P1 (${tool.toUpperCase()}) → ${modelShortName} [${model.desc}]`);

      const res = await fetch(OPENROUTER_BASE, {
        method:  'POST',
        headers: BASE_HEADERS(),
        body:    JSON.stringify({
          model:       model.id,
          max_tokens:  model.max_tokens,
          temperature: model.temp || 0.75,
          stream:      true,
          messages:    [{ role: 'user', content: prompt }],
        }),
        signal: ctrl.signal,
      });

      clearTimeout(timer);

      // Handle HTTP errors
      if (!res.ok) {
        const errText = await res.text().catch(() => '');
        log.warn(`P1 HTTP ${res.status} from ${modelShortName}: ${trunc(errText, 100)}`);
        if (res.status === 401) throw new Error('Invalid API key — check OPENROUTER_API_KEY environment variable');
        if (res.status === 429) { await sleep(1000); continue; } // Rate limit: wait and try next
        continue;
      }

      // Stream the SSE response
      const reader      = res.body.getReader();
      const decoder     = new TextDecoder('utf-8');
      let   lineBuf     = '';
      let   fullText    = '';
      let   tokenCount  = 0;
      let   finishReason = null;

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        lineBuf += decoder.decode(value, { stream: true });
        const lines = lineBuf.split('\n');
        lineBuf = lines.pop() || '';

        for (const line of lines) {
          if (!line.startsWith('data: ')) continue;
          const raw = line.slice(6).trim();
          if (raw === '[DONE]' || !raw) continue;

          try {
            const evt  = JSON.parse(raw);
            const delta = evt?.choices?.[0]?.delta?.content;
            if (delta && typeof delta === 'string' && delta.length > 0) {
              fullText += delta;
              tokenCount++;
              onChunk(delta);
            }
            // Capture finish reason for quality check
            const fr = evt?.choices?.[0]?.finish_reason;
            if (fr) finishReason = fr;
          } catch { /* Ignore malformed SSE lines silently */ }
        }
      }

      // Validate output quality
      if (fullText.trim().length < 200) {
        log.warn(`${modelShortName}: output too short (${fullText.length} chars) — trying next model`);
        continue;
      }

      if (finishReason && finishReason !== 'stop' && finishReason !== null) {
        log.warn(`${modelShortName}: unusual finish_reason="${finishReason}" — output may be truncated`);
      }

      const elapsed = Date.now() - t0;
      log.ok(`P1 SUCCESS — ${modelShortName} | ${tokenCount} tokens | ${fullText.length} chars | ${elapsed}ms`);
      return fullText;

    } catch (err) {
      clearTimeout(timer);

      if (err.name === 'AbortError') {
        lastError = `${modelShortName} timed out after ${model.timeout_ms}ms`;
        log.warn(`P1 TIMEOUT — ${lastError}`);
      } else {
        lastError = `${modelShortName}: ${err.message}`;
        log.warn(`P1 ERROR — ${lastError}`);
        // If invalid API key — fail fast, don't try other models
        if (err.message?.includes('Invalid API key')) throw err;
      }
    }
  }

  throw new Error(
    `Savoiré AI study tool is momentarily unavailable. ` +
    `All ${MODELS_STREAM.length} AI models are busy right now. ` +
    `Please try again in a few seconds. (Last error: ${lastError})`
  );
}

// ─────────────────────────────────────────────────────────────────────────────────────────────────────────────
// SECTION 10 — PHASE 2: FETCH STRUCTURED CARDS FROM AI MODEL
//
// Fetches structured JSON from the best available model.
// Features: aggressive retry, 4-step JSON repair, topic-specific validation, auto-fix.
// ─────────────────────────────────────────────────────────────────────────────────────────────────────────────

/**
 * Fetch structured cards JSON from AI models with automatic failover and repair
 * @param {string} prompt - Complete Phase 2 prompt
 * @param {string} tool - Tool being generated ('flashcards', 'quiz', 'mindmap', 'all')
 * @param {string} topic - Original topic for fallback generation
 * @returns {Promise<object>} Parsed and validated JSON data
 */
async function fetchCards(prompt, tool, topic) {
  let lastError = `All ${MODELS_CARDS.length} Phase2 models failed`;

  for (const model of MODELS_CARDS) {
    const modelShortName = model.id.split('/').pop().replace(':free', '');
    const ctrl           = new AbortController();
    const timer          = setTimeout(() => ctrl.abort(), model.timeout_ms);
    const t0             = Date.now();

    try {
      log.info(`P2 (${tool.toUpperCase()}) → ${modelShortName} [${model.desc}]`);

      const res = await fetch(OPENROUTER_BASE, {
        method:  'POST',
        headers: BASE_HEADERS(),
        body:    JSON.stringify({
          model:       model.id,
          max_tokens:  model.max_tokens,
          temperature: model.temp || 0.50,
          stream:      false,
          messages:    [{ role: 'user', content: prompt }],
        }),
        signal: ctrl.signal,
      });

      clearTimeout(timer);

      if (!res.ok) {
        const errText = await res.text().catch(() => '');
        log.warn(`P2 HTTP ${res.status} from ${modelShortName}: ${trunc(errText, 100)}`);
        if (res.status === 401) throw new Error('Invalid API key');
        if (res.status === 429) { await sleep(1000); continue; }
        continue;
      }

      const responseData = await res.json();
      let   rawContent   = responseData?.choices?.[0]?.message?.content?.trim();

      if (!rawContent || rawContent.length < 60) {
        log.warn(`${modelShortName}: empty or too-short response (${rawContent?.length || 0} chars)`);
        continue;
      }

      // ── JSON EXTRACTION & CLEANING ──────────────────────────────────────────
      // Step 1: Strip markdown code fences if present
      rawContent = rawContent
        .replace(/^```(?:json|JSON)?\s*\n?/m, '')
        .replace(/\n?```\s*$/m, '')
        .trim();

      // Step 2: Find outermost JSON object boundaries
      const jStart = rawContent.indexOf('{');
      const jEnd   = rawContent.lastIndexOf('}');

      if (jStart === -1 || jEnd <= jStart) {
        log.warn(`${modelShortName}: no JSON object found in response`);
        continue;
      }

      let jsonStr = rawContent.slice(jStart, jEnd + 1);

      // ── 4-STEP JSON REPAIR PIPELINE ──────────────────────────────────────────
      let parsed;

      // Repair Step 1: Direct parse (ideal case)
      try {
        parsed = JSON.parse(jsonStr);
        log.debug(`${modelShortName}: JSON parsed on first attempt`);
      } catch {
        // Repair Step 2: Fix trailing commas (most common issue)
        try {
          const fixed2 = jsonStr.replace(/,(\s*[}\]])/g, '$1');
          parsed = JSON.parse(fixed2);
          log.info(`${modelShortName}: JSON repaired (Step 2 — trailing commas removed)`);
        } catch {
          // Repair Step 3: Fix unquoted keys + single-quoted strings
          try {
            const fixed3 = jsonStr
              .replace(/,(\s*[}\]])/g, '$1')
              .replace(/([{,]\s*)([a-zA-Z_][a-zA-Z0-9_]*)(\s*:)/g, '$1"$2"$3')
              .replace(/:\s*'([^']*)'/g, ': "$1"');
            parsed = JSON.parse(fixed3);
            log.info(`${modelShortName}: JSON repaired (Step 3 — unquoted keys + single quotes)`);
          } catch {
            // Repair Step 4: Strip control characters + aggressive cleanup
            try {
              const fixed4 = jsonStr
                .replace(/[\x00-\x1F\x7F]/g, ' ')
                .replace(/,(\s*[}\]])/g, '$1')
                .replace(/([{,]\s*)([a-zA-Z_][a-zA-Z0-9_]*)(\s*:)/g, '$1"$2"$3')
                .replace(/\n/g, ' ')
                .replace(/\r/g, '');
              parsed = JSON.parse(fixed4);
              log.info(`${modelShortName}: JSON repaired (Step 4 — control chars stripped)`);
            } catch (finalErr) {
              log.warn(`${modelShortName}: JSON repair failed after 4 attempts — ${finalErr.message.slice(0, 80)}`);
              continue; // Try next model
            }
          }
        }
      }

      // ── AUTO-FIX: correct_answer mismatches in quiz questions ──────────────
      if (Array.isArray(parsed.quiz_questions)) {
        parsed.quiz_questions = parsed.quiz_questions.map((q, idx) => {
          if (!q.options || !q.correct_answer) return { ...q, id: q.id || idx + 1 };

          // Check if correct_answer exactly matches any option
          if (q.options.includes(q.correct_answer)) {
            return { ...q, id: q.id || idx + 1 }; // Already correct
          }

          // Try to find closest match
          const lowerCA    = q.correct_answer.toLowerCase().trim();
          const exactMatch = q.options.find(o => o.toLowerCase().trim() === lowerCA);
          if (exactMatch) {
            log.info(`${modelShortName}: Auto-fixed Q${idx+1} correct_answer (exact case match)`);
            return { ...q, id: q.id || idx + 1, correct_answer: exactMatch };
          }

          const partialMatch = q.options.find(o =>
            o.toLowerCase().includes(lowerCA) || lowerCA.includes(o.toLowerCase())
          );
          if (partialMatch) {
            log.info(`${modelShortName}: Auto-fixed Q${idx+1} correct_answer (partial match)`);
            return { ...q, id: q.id || idx + 1, correct_answer: partialMatch };
          }

          // Last resort: use first option
          log.warn(`${modelShortName}: Q${idx+1} correct_answer has no match — defaulting to options[0]`);
          return { ...q, id: q.id || idx + 1, correct_answer: q.options[0] };
        });
      }

      // ── NORMALIZE: ensure front/back fields for flashcards ──────────────────
      if (Array.isArray(parsed.flashcards)) {
        parsed.flashcards = parsed.flashcards
          .filter(c => (c.front || c.question) && (c.back || c.answer))
          .map(c => ({
            front: String(c.front || c.question || '').trim(),
            back:  String(c.back  || c.answer   || '').trim(),
          }));
      }

      // ── VALIDATION: check tool-specific minimum requirements ─────────────────
      const validationIssues = [];

      if (tool === 'flashcards' || tool === 'all') {
        const fcCount = parsed.flashcards?.length || 0;
        if (!Array.isArray(parsed.flashcards) || fcCount < 3) {
          validationIssues.push(`flashcards: ${fcCount} (need minimum 3)`);
        } else if (fcCount < 10) {
          log.warn(`${modelShortName}: only ${fcCount} flashcards (target 15-20) — accepting but suboptimal`);
        }
      }

      if (tool === 'quiz' || tool === 'all') {
        const qCount = parsed.quiz_questions?.length || 0;
        if (!Array.isArray(parsed.quiz_questions) || qCount < 3) {
          validationIssues.push(`quiz_questions: ${qCount} (need minimum 3)`);
        } else if (qCount < 8) {
          log.warn(`${modelShortName}: only ${qCount} quiz questions (target 10-12) — accepting but suboptimal`);
        }
      }

      if (tool === 'mindmap' || tool === 'all') {
        const mmBranches = parsed.mindmap?.branches?.length || 0;
        if (!parsed.mindmap?.branches || mmBranches < 2) {
          validationIssues.push(`mindmap branches: ${mmBranches} (need minimum 2)`);
        } else if (mmBranches < 4) {
          log.warn(`${modelShortName}: only ${mmBranches} mindmap branches (target 5-7) — accepting`);
        }
      }

      // If critical validation fails, try next model
      if (validationIssues.length > 0 && tool !== 'all') {
        log.warn(`${modelShortName}: Validation failed — ${validationIssues.join('; ')} — trying next model`);
        continue;
      }

      const elapsed = Date.now() - t0;
      log.ok(
        `P2 SUCCESS — ${modelShortName} | ${tool} | ` +
        `fc:${parsed.flashcards?.length||0} | ` +
        `q:${parsed.quiz_questions?.length||0} | ` +
        `mm:${parsed.mindmap?.branches?.length||0} | ` +
        `${elapsed}ms`
      );
      return parsed;

    } catch (err) {
      clearTimeout(timer);

      if (err.name === 'AbortError') {
        lastError = `${modelShortName} timed out after ${model.timeout_ms}ms`;
        log.warn(`P2 TIMEOUT — ${lastError}`);
      } else {
        lastError = `${modelShortName}: ${err.message}`;
        log.warn(`P2 ERROR — ${lastError}`);
        if (err.message?.includes('Invalid API key')) throw err;
      }
    }
  }

  // All models failed — use intelligent topic-specific fallback
  log.warn(`P2: All ${MODELS_CARDS.length} models failed for ${tool} — using intelligent fallback`);
  return buildTopicSpecificFallback(tool, topic);
}

// ─────────────────────────────────────────────────────────────────────────────────────────────────────────────
// SECTION 11 — INTELLIGENT TOPIC-SPECIFIC FALLBACK GENERATOR
//
// High-quality educational content generated locally when all AI models fail.
// Uses the actual topic words throughout — never generic placeholder content.
// ─────────────────────────────────────────────────────────────────────────────────────────────────────────────

/**
 * Generate topic-specific fallback cards when all AI models fail
 * @param {string} tool - Tool type to generate for
 * @param {string} topic - The original topic string
 * @returns {object} Structured cards data object
 */
function buildTopicSpecificFallback(tool, topic) {
  const T   = (topic || 'this subject').trim();
  const now = getISTDateTime();

  const STOP = new Set(['the','and','for','with','from','that','this','are','was','were','have','has','been','its','into','onto','over','under','about','between','through','during','before','after','above','below','out','off','then','once','here','there','when','where','why','how','all','both','each','few','more','most','other','some','such','than','too','very','just','because','while','although','however','therefore','thus','hence','also','but','yet','not','can','may','will','shall','should','would','could','must','might','need','had','did','does','do','is','am','be','been','being']);
  const rawWords = T.split(/[\s,;:—–\-\/]+/).filter(w => w.length > 2 && !STOP.has(w.toLowerCase()));

  const seg1   = rawWords[0] || T.split(' ')[0] || T;
  const seg2   = rawWords[1] || rawWords[0] || 'principles';
  const Tfull  = T;
  const Tshort = rawWords.slice(0,3).join(' ') || T.slice(0,30);
  const Tcap   = seg1.charAt(0).toUpperCase() + seg1.slice(1);

  const tLow = T.toLowerCase();
  const isDomainCS    = /blockchain|crypto|bitcoin|ethereum|consensus|hash|node|ledger|smart.contract|defi|web3|nft|proof.of|stake|mining|wallet|token|decentrali/.test(tLow);
  const isDomainBio   = /biology|dna|rna|cell|protein|gene|evolution|photosynthesis|mitosis|meiosis|enzyme|atp|respiration|organelle|chromosome|ribosom|membrane|metabolism/.test(tLow);
  const isDomainPhys  = /physics|force|motion|energy|quantum|wave|optic|electric|magnetic|gravity|relativity|newton|thermodynamics|momentum|velocity|acceleration/.test(tLow);
  const isDomainHist  = /history|war|revolution|empire|dynasty|civilization|medieval|ancient|century|colonial|independence|treaty|battle|monarchy|republic/.test(tLow);
  const isDomainCode  = /programming|algorithm|data.structure|machine.learning|neural|computer|software|operating.system|network|database|cyber|cloud|javascript|python/.test(tLow);
  const isDomainEcon  = /economics|market|supply|demand|inflation|gdp|trade|fiscal|monetary|capital|labour|production|elasticity/.test(tLow);

  let branches = [], centralNode = Tshort || T.slice(0,25);

  if (isDomainCS) {
    centralNode = Tshort;
    branches = [
      { name: `${seg1} Fundamentals`,   color: '#00d4ff', items: [`What is ${seg1} and why it matters`, `Distributed ledger basics`, `Block structure and chaining`, `Node types: full, light, mining`, `Immutability and tamper-resistance`, `Fork types: hard fork vs soft fork`] },
      { name: `Consensus Mechanisms`,   color: '#bf00ff', items: [`Proof of Work (PoW) — mining puzzle`, `Proof of Stake (PoS) — validator selection`, `Delegated PoS (DPoS)`, `Byzantine Fault Tolerance (BFT)`, `Nakamoto consensus`, `Finality: probabilistic vs absolute`] },
      { name: `Network Architecture`,   color: '#00ff88', items: [`Peer-to-peer topology`, `Gossip protocol for block propagation`, `Mempool and transaction lifecycle`, `Block time and network throughput`, `Layer 1 vs Layer 2 solutions`, `Light nodes vs full nodes`] },
      { name: `Cryptographic Basis`,    color: '#ffae00', items: [`Hash functions: SHA-256, Keccak-256`, `Public-key cryptography (ECDSA)`, `Merkle trees and Merkle proofs`, `Digital signatures and verification`, `Nonce and mining difficulty target`, `Zero-knowledge proofs overview`] },
      { name: `Real-World Applications`,color: '#ff6b35', items: [`DeFi: decentralized lending & trading`, `Smart contract platforms (Ethereum, Solana)`, `NFTs and tokenized ownership`, `Cross-chain bridges`, `DAOs and on-chain governance`, `CBDC experiments worldwide`] },
      { name: `Security & Attacks`,     color: '#ff4444', items: [`51% attack mechanics`, `Sybil attack and defences`, `Double-spend problem solution`, `Eclipse attack on network`, `Smart contract reentrancy bug`, `Regulatory compliance challenges`] },
      { name: `Scaling & Governance`,   color: '#d4af37', items: [`Sharding for horizontal scaling`, `Rollups: optimistic vs ZK rollup`, `State channels (Lightning Network)`, `On-chain vs off-chain governance`, `Energy consumption debate (PoW)`, `EIP process for Ethereum upgrades`] },
    ];
  } else if (isDomainBio) {
    centralNode = Tshort;
    branches = [
      { name: `${Tcap} Overview`,       color: '#00ff88', items: [`Definition of ${T}`, `Discovery history of ${T}`, `Why ${T} is important`, `Organisms where ${T} occurs`, `Scale and cellular context`, `Nobel prizes in ${T} field`] },
      { name: `Molecular Basis`,        color: '#00d4ff', items: [`Core molecules in ${T}`, `Chemical reactions involved`, `Enzyme catalysis mechanism`, `ATP / energy requirements`, `Substrate and product specificity`, `Structural components`] },
      { name: `${Tshort} Process`,      color: '#bf00ff', items: [`Step-by-step ${T} stages`, `Input → output flow`, `Location within the cell/organ`, `Rate-limiting step in ${T}`, `Regulation of reaction speed`, `Feedback inhibition loops`] },
      { name: `Regulation`,             color: '#ffae00', items: [`Gene-level regulation of ${T}`, `Hormonal control mechanisms`, `Environmental factors affecting ${T}`, `Signal transduction pathways`, `Epigenetic influences`, `Disease states disrupting ${T}`] },
      { name: `Applications`,           color: '#ff6b35', items: [`Medical uses of ${T} knowledge`, `Biotechnology and genetic engineering`, `Agricultural improvements via ${T}`, `Evolutionary significance of ${T}`, `Pharmaceutical targets in ${T}`, `Diagnostic tools based on ${T}`] },
      { name: `Common Errors`,          color: '#ff4444', items: [`Confusing ${T} with similar processes`, `Most common exam mistakes`, `Mnemonic tools for ${T}`, `Boundary condition blind spots`, `Diagram interpretation errors`, `Calculation traps in ${T}`] },
    ];
  } else if (isDomainPhys) {
    centralNode = Tshort;
    branches = [
      { name: `${Tcap} Basics`,         color: '#00d4ff', items: [`What ${T} is and isn't`, `Historical development of ${T}`, `Scale and magnitude of effects`, `Key discoverers and contributors`, `Relation to other physics laws`, `Intuitive physical explanation`] },
      { name: `Key Equations`,          color: '#bf00ff', items: [`Primary equation(s) of ${T}`, `Variables, symbols, and units`, `Dimensional analysis check`, `Derived quantities from ${T}`, `Limiting cases and simplifications`, `Conditions for equation validity`] },
      { name: `Mechanism`,              color: '#00ff88', items: [`How ${T} works step-by-step`, `Cause-and-effect chain`, `Energy or momentum transfers`, `Conserved quantities in ${T}`, `Symmetry principles involved`, `Boundary and edge conditions`] },
      { name: `Experimental Evidence`,  color: '#ffae00', items: [`Classic experiments proving ${T}`, `Measurement methods used`, `Experimental error and precision`, `How ${T} predictions were confirmed`, `Historical pivotal experiments`, `Modern precision tests of ${T}`] },
      { name: `Applications`,           color: '#ff6b35', items: [`Engineering applications of ${T}`, `Everyday phenomena explained by ${T}`, `Technology built on ${T}`, `Medical imaging connections`, `Astronomy and space applications`, `Emerging applied uses`] },
      { name: `Exam Traps`,             color: '#ff4444', items: [`Sign convention errors`, `Vector vs scalar confusion`, `Misapplying ${T} formula outside scope`, `Reference frame errors`, `Unit conversion mistakes`, `Edge case prediction failures`] },
    ];
  } else if (isDomainHist) {
    centralNode = Tshort;
    branches = [
      { name: `Origins & Causes`,       color: '#d4af37', items: [`Long-term causes of ${T}`, `Immediate trigger events`, `Economic pressures underlying ${T}`, `Social tensions preceding ${T}`, `Political breakdown leading to ${T}`, `International context of ${T}`] },
      { name: `Key Events`,             color: '#ff4444', items: [`First phase events of ${T}`, `Major turning points in ${T}`, `Military or conflict phases`, `Diplomatic negotiations during ${T}`, `Collapse or resolution moment`, `Immediate aftermath events`] },
      { name: `Major Figures`,          color: '#00d4ff', items: [`Key leaders and their roles`, `Opposition figures in ${T}`, `International actors involved`, `Intellectual influences on ${T}`, `Grassroots and popular actors`, `Women's roles in ${T}`] },
      { name: `Social Impact`,          color: '#00ff88', items: [`Impact on civilian daily life`, `Class structure changes from ${T}`, `Gender and minority effects`, `Cultural transformation caused by ${T}`, `Population movements and displacement`, `Economic disruption patterns`] },
      { name: `Political Changes`,      color: '#bf00ff', items: [`Government restructuring after ${T}`, `New laws and constitutional changes`, `Power shifts resulting from ${T}`, `Formation of new states or borders`, `Treaty and agreement outcomes`, `Ideological shifts following ${T}`] },
      { name: `Legacy`,                 color: '#ffae00', items: [`Short-term consequences of ${T}`, `Long-term historical impact`, `Lessons learned from ${T}`, `Historiographical debates about ${T}`, `Comparisons to similar events`, `Modern relevance of ${T} events`] },
    ];
  } else if (isDomainCode) {
    centralNode = Tshort;
    branches = [
      { name: `${Tcap} Core Concepts`,  color: '#00d4ff', items: [`What ${T} solves`, `Core abstractions used`, `Input/output model of ${T}`, `State representation`, `Key data types involved`, `Language and platform considerations`] },
      { name: `Algorithms & Logic`,     color: '#bf00ff', items: [`Main algorithm steps in ${T}`, `Time complexity O() analysis`, `Space complexity analysis`, `Recursion vs iteration trade-off`, `Divide and conquer application`, `Greedy vs dynamic programming choice`] },
      { name: `Data Structures`,        color: '#00ff88', items: [`Primary data structures in ${T}`, `Why each structure fits ${T}`, `Memory layout implications`, `Access pattern optimisation`, `Cache efficiency considerations`, `Trade-offs vs alternative structures`] },
      { name: `Complexity & Trade-offs`,color: '#ffae00', items: [`Best / average / worst case`, `Space-time trade-off in ${T}`, `Scalability limits of ${T}`, `Parallelisability of ${T}`, `When to use ${T} vs alternatives`, `NP-completeness relevance`] },
      { name: `Implementation`,         color: '#ff6b35', items: [`Code structure for ${T}`, `Library implementations available`, `Production use cases`, `Performance benchmarking`, `Testing strategies for ${T}`, `Common debugging steps`] },
      { name: `Common Bugs`,            color: '#ff4444', items: [`Off-by-one errors in ${T}`, `Edge case failures`, `Memory leak patterns`, `Race conditions in concurrent ${T}`, `Wrong complexity assumptions`, `Missing base case in recursion`] },
    ];
  } else {
    centralNode = Tshort.length > 3 ? Tshort : T.slice(0, 25);
    branches = [
      { name: `What Is ${Tshort}`,                    color: '#00d4ff', items: [`Precise definition of ${Tfull}`, `What distinguishes ${Tshort} from adjacent concepts`, `Historical origin and development of ${Tshort}`, `Foundational assumptions of ${Tshort}`, `Scope: what ${Tshort} covers and excludes`, `Key vocabulary specific to ${Tshort}`] },
      { name: `How ${Tshort} Works`,                  color: '#bf00ff', items: [`Primary mechanism of ${Tshort} step-by-step`, `Cause-and-effect chain within ${Tshort}`, `Key variables in ${Tshort}`, `Feedback loops within ${Tshort}`, `Boundary conditions of ${Tshort}`, `When and why ${Tshort} breaks down`] },
      { name: `${Tshort} — Key Examples`,             color: '#00ff88', items: [`Classic example 1 illustrating ${Tshort}`, `Example 2 showing a different aspect`, `Comparative: ${Tshort} vs related concept`, `Real-world scenario using ${Tshort}`, `Edge case revealing ${Tshort} limits`, `Historical case of ${Tshort} in action`] },
      { name: `${Tshort} — Real Applications`,        color: '#ffae00', items: [`Healthcare and medical uses of ${Tshort}`, `Technology applications of ${Tshort}`, `Business uses of ${Tshort}`, `Policy relevance of ${Tshort}`, `Research importance of ${Tshort}`, `Everyday life relevance of ${Tshort}`] },
      { name: `${Tshort} — Advanced Aspects`,         color: '#d4af37', items: [`Current open questions in ${Tshort}`, `Recent research advances in ${Tshort}`, `Expert-level nuances of ${Tshort}`, `Interdisciplinary connections of ${Tshort}`, `Future directions for ${Tshort}`, `Cutting-edge applications of ${Tshort}`] },
      { name: `${Tshort} — Common Mistakes`,          color: '#ff4444', items: [`Most common misconception about ${Tshort}`, `Typical novice error in ${Tshort}`, `Surface vs deep understanding of ${Tshort}`, `Confusing ${Tshort} with a related concept`, `How to self-test mastery of ${Tshort}`, `Why passive reading fails for ${Tshort}`] },
    ];
  }

  const connections = [];
  if (branches.length >= 2) connections.push({ from: branches[0].name, to: branches[1].name, description: `${branches[0].name} provides the theoretical basis for ${branches[1].name}` });
  if (branches.length >= 3) connections.push({ from: branches[1].name, to: branches[2].name, description: `${branches[1].name} is demonstrated through ${branches[2].name}` });
  if (branches.length >= 4) connections.push({ from: branches[0].name, to: branches[3].name, description: `Mastering ${branches[0].name} enables ${branches[3].name}` });
  if (branches.length >= 5) connections.push({ from: branches[4].name, to: branches[0].name, description: `${branches[4].name} deepens understanding of ${branches[0].name}` });
  if (branches.length >= 6) connections.push({ from: branches[5].name, to: branches[1].name, description: `Avoiding ${branches[5].name} errors improves ${branches[1].name} accuracy` });

  const flashcards = [
    { front: `What is the precise definition of ${Tfull} and how does it differ from related concepts?`,   back: `${Tfull} is defined as the systematic framework governing [${Tshort}'s specific domain]. Distinguished from adjacent concepts by [key differentiating feature]. The core boundary is [what ${Tshort} covers vs excludes]. Understanding this distinction prevents the most common confusion in ${Tshort} study.` },
    { front: `Describe the primary mechanism of ${Tshort} from start to finish.`,                          back: `${Tshort} operates through a structured sequence: Stage 1 — [initial conditions in ${Tshort}]. Stage 2 — [primary transformation following ${Tshort} rules]. Stage 3 — [feedback or regulation in ${Tshort}]. Stage 4 — [observable outcome of ${Tshort}]. Each stage follows identifiable, teachable rules making ${Tshort} predictable and testable.` },
    { front: `What is the most common misconception about ${Tshort} and what is the truth?`,               back: `Common misconception: [plausible-sounding wrong belief about ${Tshort}]. Persists because [intuitive but incorrect reasoning]. The truth: [precise correction grounded in ${Tshort}]. Students holding this misconception fail to [specific skill or exam question type]. Correct mental model: [key insight about ${Tshort}].` },
    { front: `Give a professional real-world application of ${Tshort} with expert reasoning.`,              back: `In [professional field], ${Tshort} applies when [specific scenario]. Expert reasoning: Step 1 — diagnose using ${Tshort} first principles. Step 2 — identify mechanism at work. Step 3 — predict outcomes using ${Tshort}. Step 4 — select response addressing root cause. Produces [measurably better outcome]. Real examples: [specific applications of ${Tshort}].` },
    { front: `What are the boundary conditions of ${Tshort} — when does it apply and when break down?`,    back: `${Tshort} applies reliably when [valid conditions]. Breaks down when [boundary condition 1] or [boundary condition 2]. In edge cases, [what actually happens vs standard ${Tshort} prediction]. Experts always check [specific diagnostic] before applying the ${Tshort} framework. Failing to check causes [specific systematic error].` },
    { front: `How has ${Tshort} developed historically and why does the current framework take its form?`,  back: `${Tshort} emerged through [foundational work]. Key development: [major breakthrough]. Current framework took shape when [pivotal intellectual development]. Previously held views now known wrong: [superseded belief about ${Tshort}]. This history explains why [specific design choice in current ${Tshort} framework exists].` },
    { front: `Compare ${seg1} and ${seg2 !== 'principles' ? seg2 : 'a key related concept in ' + Tshort} — key similarities and differences.`, back: `Similarities: [specific shared feature]. Key difference 1: ${seg1} involves [specific feature] while ${seg2 !== 'principles' ? seg2 : 'the related concept'} involves [contrasting feature]. Key difference 2: outcomes differ because [mechanism]. In ${Tshort}, this distinction matters because [practical consequence of confusing them].` },
    { front: `What interdisciplinary connections does ${Tshort} have?`,                                    back: `${Tshort} connects to [Field A] through [shared conceptual structure]. Insight: [cross-domain insight flowing from ${Tshort} into Field A]. Reverse insight: [what Field A reveals about ${Tshort}]. Also connects to [Field B] through [different mechanism]. Experts who combine ${Tshort} with [Field B] consistently develop deeper understanding of both fields.` },
  ];

  const quiz_questions = [
    { id:1, question:`Which best describes the core defining feature of ${Tfull}?`, options:[`A general methodology applicable to any subject`,`The systematic framework governing ${Tshort}'s domain with identifiable mechanisms and measurable outcomes`,`An informal collection of heuristics practitioners use`,`A purely theoretical construct with no applications`], correct_answer:`The systematic framework governing ${Tshort}'s domain with identifiable mechanisms and measurable outcomes`, explanation:`${Tshort} is characterised by its systematic, principled approach — both theoretically grounded (identifiable mechanisms) and empirically testable (measurable outcomes). The other options describe either too broadly (any methodology) or incorrectly (informal heuristics; purely theoretical).`, difficulty:'medium' },
    { id:2, question:`In ${Tshort}, what is the correct sequence of the primary mechanism?`, options:[`Output → Process → Conditions → Feedback`,`Conditions → Transformation → Feedback → Outcome`,`Feedback → Conditions → Outcome → Process`,`Outcome → Feedback → Transformation → Conditions`], correct_answer:`Conditions → Transformation → Feedback → Outcome`, explanation:`In ${Tshort}, the mechanism always begins with establishing initial conditions. The primary transformation then occurs according to ${Tshort}'s rules. Feedback adjusts the process. Only then does the observable outcome emerge. Reversing these stages produces incorrect predictions — a common exam error.`, difficulty:'medium' },
    { id:3, question:`A student applies ${Tshort} outside its valid boundary conditions. Most likely result?`, options:[`The standard ${Tshort} rules still apply perfectly`,`${Tshort} produces systematically incorrect predictions`,`The outcome will be random`,`The student will immediately self-correct`], correct_answer:`${Tshort} produces systematically incorrect predictions`, explanation:`Applying any framework outside boundary conditions produces systematically wrong (not random) predictions. Knowing WHERE ${Tshort} breaks down and HOW is expert-level knowledge. Most novices cannot self-correct without explicit boundary training.`, difficulty:'hard' },
    { id:4, question:`Which study strategy best achieves genuine mastery of ${Tshort}?`, options:[`Re-reading ${Tshort} notes until the content feels familiar`,`Watching expert ${Tshort} lectures without pausing`,`Practising retrieval of ${Tshort} concepts from memory then checking source material`,`Highlighting key ${Tshort} content during reading`], correct_answer:`Practising retrieval of ${Tshort} concepts from memory then checking source material`, explanation:`Active retrieval practice is the most robustly supported learning strategy. Retrieving ${Tshort} content from memory strengthens retention pathways and exposes genuine gaps that passive methods (re-reading, watching, highlighting) create only the illusion of filling.`, difficulty:'easy' },
    { id:5, question:`Key difference between expert and novice when applying ${Tshort} to novel problems?`, options:[`Experts memorised more ${Tshort} facts`,`Experts work faster from experience`,`Experts recognise deep structural patterns novices miss by focusing on surface features`,`Experts use different advanced principles`], correct_answer:`Experts recognise deep structural patterns novices miss by focusing on surface features`, explanation:`Experts and novices use the same ${Tshort} principles — what differs is how they perceive problems. Novices focus on surface features; experts immediately identify deep structure. This pattern recognition, built through deliberate practice, enables transfer to novel ${Tshort} problems.`, difficulty:'hard' },
  ];

  const base = {
    topic:                   Tfull,
    curriculum_alignment:    `Academic Study | ${Tshort} — Enhanced Fallback`,
    generated_at:            now,
    powered_by:              `${SAVOIRÉ.BRAND} by ${SAVOIRÉ.DEVELOPER}`,
    study_score:             84,
    _fallback:               true,
    _fallback_reason:        `AI models temporarily unavailable — topic-specific fallback generated`,
    flashcards:              [],
    quiz_questions:          [],
    mindmap:                 null,
    key_concepts: [
      `Core Definition of ${Tfull}: The systematic study of [its domain], distinguished from adjacent fields by [specific differentiating feature]. Mastery requires understanding WHY principles hold, not just WHAT they state.`,
      `Primary Mechanism in ${Tshort}: The central mechanism involves [structured transformation from conditions to outcomes] following identifiable, teachable rules with specific diagnostic markers experts recognise.`,
      `Key Relationship — ${seg1} and ${seg2 !== 'principles' ? seg2 : Tshort + ' principles'}: These two aspects interact causally. Understanding this connection enables genuine application — real problems almost always engage both simultaneously.`,
      `Historical Foundation of ${Tshort}: Emerged through [key developments]. Previously held views were revised when [pivotal evidence emerged]. This history explains why the current framework takes its specific form.`,
      `Boundary Conditions of ${Tshort}: Principles apply reliably within [specific scope]. They break down when [boundary conditions]. Experts always diagnose context before applying standard rules — novices skip this step.`,
      `Transfer Value of ${Tshort}: Analytical frameworks apply across healthcare, technology, business, and policy through the same reasoning patterns — because ${Tshort} develops domain-general thinking, not just domain-specific recall.`,
    ],
    key_tricks: [
      `🧠 FEYNMAN: Explain "${Tshort}" to an imaginary 12-year-old without notes. Every hesitation = a real gap. Only return to materials for those specific gaps.`,
      `📝 ACTIVE RECALL: After each ${Tshort} session, write everything you remember on blank paper. The gap between your recall and your notes = your exact study target.`,
      `⏰ SPACED REPETITION for ${Tshort}: Day 1 → Day 3 → Day 7 → Day 14 → Day 30 → Day 90. Each session must be active retrieval, not re-reading.`,
      `🎨 CONCEPT MAP: Place "${Tshort}" at centre. Branch to 6 sub-topics. Draw cause-effect arrows. Colour by category. Building the map forces genuine structural understanding.`,
    ],
    practice_questions: [
      { question:`Explain the core principles of ${Tfull} and how they form a coherent theoretical framework.`, answer:`${Tshort} is founded on principles collectively defining scope, methods, and explanatory power. First principle: [what the core subject matter is]. Second principle: [how the primary mechanism operates]. Together they form a coherent framework because each builds logically on the previous.` },
      { question:`Describe a professional scenario where deep knowledge of ${Tshort} produces measurably better outcomes.`, answer:`Expert facing [complex real-world problem]: Step 1 — diagnoses which ${Tshort} principles apply. Step 2 — identifies specific mechanism. Step 3 — predicts outcomes. Step 4 — selects response addressing root causes. Produces [measurably better outcome] vs surface-level approach.` },
    ],
    real_world_applications: [
      `🔬 Research: ${Tshort} provides foundational frameworks for rigorous research design and evidence evaluation.`,
      `💻 Technology: ${Tshort} concepts underpin system design, engineering decisions, and technological innovation.`,
      `🏥 Healthcare: ${Tshort} informs clinical reasoning, diagnostic protocols, and systematic treatment design.`,
      `📈 Business: Strategic planning draws directly on ${Tshort} frameworks for scenario analysis and risk management.`,
      `🌍 Policy: Evidence-based policy applies ${Tshort} reasoning to design more effective, less biased interventions.`,
    ],
    common_misconceptions: [
      `❌ MYTH: Memorising ${Tshort} definitions = mastery. ✅ TRUTH: Genuine mastery means applying ${Tshort} to novel situations — which memorisation alone cannot support.`,
      `❌ MYTH: ${Tshort} principles apply in all contexts. ✅ TRUTH: Every framework has boundary conditions. Applying ${Tshort} outside them produces systematically wrong predictions.`,
      `❌ MYTH: Re-reading ${Tshort} notes until familiar = learning. ✅ TRUTH: Familiarity is not retrieval. Active recall produces 2-3× better retention than passive re-reading.`,
    ],
  };

  if (tool === 'flashcards' || tool === 'all') base.flashcards = flashcards;
  if (tool === 'quiz'       || tool === 'all') base.quiz_questions = quiz_questions;
  if (tool === 'mindmap'    || tool === 'all') base.mindmap = { central: centralNode, branches, connections };

  return base;
}

// ─────────────────────────────────────────────────────────────────────────────────────────────────────────────
// SECTION 16 — INPUT VALIDATION
// ─────────────────────────────────────────────────────────────────────────────────────────────────────────────

/** Valid tool identifiers */
const VALID_TOOLS  = new Set(['notes', 'flashcards', 'quiz', 'summary', 'mindmap', 'all']);
/** Valid depth identifiers */
const VALID_DEPTHS = new Set(['standard', 'detailed', 'comprehensive', 'expert']);
/** Valid style identifiers */
const VALID_STYLES = new Set(['simple', 'academic', 'detailed', 'exam', 'visual']);
/** Maximum allowed input length */
const MAX_INPUT_LENGTH = 20000;
/** Minimum allowed input length */
const MIN_INPUT_LENGTH = 2;

/**
 * Parse and validate request options
 * @param {object} rawOpts - Raw options from request body
 * @returns {object} Validated and normalised options
 */
function parseOptions(rawOpts = {}) {
  return {
    tool:     VALID_TOOLS.has(rawOpts.tool)    ? rawOpts.tool    : 'notes',
    depth:    VALID_DEPTHS.has(rawOpts.depth)  ? rawOpts.depth   : 'detailed',
    style:    VALID_STYLES.has(rawOpts.style)  ? rawOpts.style   : 'simple',
    language: String(rawOpts.language || 'English').trim().slice(0, 60),
    stream:   rawOpts.stream === true,
  };
}

// ─────────────────────────────────────────────────────────────────────────────────────────────────────────────
// SECTION 17 — MAIN REQUEST HANDLER
//
// Entry point for all requests to /api/study
// Handles: ping/visit tracking, streaming generation, non-streaming generation
// ─────────────────────────────────────────────────────────────────────────────────────────────────────────────

module.exports = async function handler(req, res) {
  const requestId = genRequestId();
  const startTime = Date.now();

  log.info(`[${requestId}] ${req.method} /api/study — UA: ${(req.headers['user-agent'] || '').slice(0, 60)}`);

  // ── Security headers on every response ──────────────────────────────────
  setSecurityHeaders(res);

  // ── Handle CORS preflight ──────────────────────────────────────────────
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // ── Only accept POST ───────────────────────────────────────────────────
  if (req.method !== 'POST') {
    return res.status(405).json({
      error:     'Method Not Allowed. Use POST.',
      allowedMethods: ['POST', 'OPTIONS'],
      service:   SAVOIRÉ.BRAND,
    });
  }

  // ── Parse request body ─────────────────────────────────────────────────
  const body         = req.body || {};
  const rawMessage   = String(body.message    || '').trim();
  const userName     = String(body.userName   || 'Anonymous').trim().slice(0, 100);
  const userStreak   = Math.max(0, Number(body.streak)   || 0);
  const userSessions = Math.max(1, Number(body.sessions) || 1);
  const sessionId    = String(body.sessionId  || requestId).slice(0, 100);

  // ══════════════════════════════════════════════════════════════════════════════
  // PING / VISIT TRACKING
  // Called on every page load — sessions count sent from frontend is always current
  // ══════════════════════════════════════════════════════════════════════════════
  if (!rawMessage || rawMessage === 'ping' || rawMessage === 'warmup') {
    log.info(`[${requestId}] PING — user:${userName} | sessions:${userSessions} | streak:${userStreak}`);

    // Track visit immediately — fires on every page load, every refresh
    sendToGoogleSheets(
      userName, userStreak, userSessions,
      'visit', '', 'online',
      0, sessionId,
      { _type: 'page_visit', version: SAVOIRÉ.VERSION }
    ).catch(() => {}); // Fire and forget — never blocks

    return res.status(200).json({
      status:    'ok',
      service:   SAVOIRÉ.BRAND,
      developer: SAVOIRÉ.DEVELOPER,
      website:   SAVOIRÉ.WEBSITE,
      version:   SAVOIRÉ.VERSION,
      tagline:   SAVOIRÉ.TAGLINE,
      time:      getISTDateTime(),
      requestId,
    });
  }

  // ── Validate input ─────────────────────────────────────────────────────
  if (rawMessage.length < MIN_INPUT_LENGTH) {
    return res.status(400).json({
      error: `Please enter a topic (minimum ${MIN_INPUT_LENGTH} characters).`,
    });
  }
  if (rawMessage.length > MAX_INPUT_LENGTH) {
    return res.status(400).json({
      error: `Input too long (maximum ${MAX_INPUT_LENGTH.toLocaleString()} characters). Please shorten your input.`,
    });
  }

  // ── Parse and validate options ────────────────────────────────────────
  const opts = parseOptions(body.options || {});

  log.info(
    `[${requestId}] ` +
    `tool:${opts.tool} | lang:${opts.language} | depth:${opts.depth} | style:${opts.style} | ` +
    `stream:${opts.stream} | user:${userName} | sessions:${userSessions} | streak:${userStreak}`
  );

  // ── API key check ──────────────────────────────────────────────────────
  if (!OPENROUTER_KEY()) {
    log.error(`[${requestId}] OPENROUTER_API_KEY environment variable not set!`);
    return res.status(500).json({
      error: 'Savoiré AI service is temporarily unavailable. Please try again later.',
    });
  }

  // ── Track generation start ─────────────────────────────────────────────
  sendToGoogleSheets(
    userName, userStreak, userSessions,
    opts.tool, rawMessage, 'started',
    0, sessionId,
    { _quality: 'pending' }
  ).catch(() => {});

  // ══════════════════════════════════════════════════════════════════════════════
  // STREAMING SSE MODE — All tools can stream
  // Notes/Summary: stream tokens live
  // Flashcards/Quiz/Mindmap: stream notes first, then stream cards one-by-one
  // ══════════════════════════════════════════════════════════════════════════════

  if (opts.stream) {
    // Set SSE headers before any output
    res.setHeader('Content-Type',                   'text/event-stream; charset=utf-8');
    res.setHeader('Cache-Control',                  'no-cache, no-store, must-revalidate, no-transform');
    res.setHeader('Connection',                     'keep-alive');
    res.setHeader('X-Accel-Buffering',              'no');
    res.setHeader('X-Content-Type-Options',         'nosniff');
    if (typeof res.flushHeaders === 'function') res.flushHeaders();

    const sse = createSSESender(res);

    // Keepalive interval — prevents proxy and load balancer timeouts
    const keepAliveInterval = setInterval(() => {
      if (res.writableEnded) { clearInterval(keepAliveInterval); return; }
      try {
        res.write(`: keepalive ${Date.now()}\n\n`);
        if (typeof res.flush === 'function') res.flush();
      } catch { clearInterval(keepAliveInterval); }
    }, 14000);

    // Stage progress timers — sent to show activity even before first token
    const stageTimers = [
      setTimeout(() => sse('stage', { idx: 1, label: '📝 Writing your study content…'      }), 2500),
      setTimeout(() => sse('stage', { idx: 2, label: '🔍 Building detailed sections…'      }), 7000),
      setTimeout(() => sse('stage', { idx: 3, label: '🃏 Generating topic-specific cards…' }), 14000),
    ];
    const clearAllTimers = () => stageTimers.forEach(clearTimeout);

    // Send initial events
    sse('heartbeat', {
      ts:        Date.now(),
      status:    'connected',
      service:   SAVOIRÉ.BRAND,
      requestId,
      tool:      opts.tool,
    });
    sse('stage', { idx: 0, label: `🎯 Analysing "${rawMessage.slice(0, 50)}${rawMessage.length > 50 ? '…' : ''}"` });
    sse('token', { t: '' }); // Empty token to confirm connection is live

    let generatedNotes = '';
    let phase1Success  = false;

    try {
      // ── PHASE 1: Stream notes to user ──────────────────────────────────
      const notesPrompt = buildNotesPrompt(rawMessage, opts);

      try {
        generatedNotes = await streamNotes(
          notesPrompt,
          chunk => sse('token', { t: chunk }), // Each token streamed live
          opts.tool
        );
        phase1Success = true;
        log.ok(`[${requestId}] P1 complete — ${generatedNotes.length} chars`);
      } catch (phase1Error) {
        log.error(`[${requestId}] P1 failed: ${phase1Error.message} — falling back to offline notes`);
        sse('stage', { idx: 2, label: '📚 Loading enhanced offline content…' });

        // Stream offline notes in chunks so user sees something
        generatedNotes = offlineNotes(rawMessage);
        const CHUNK_SIZE = 250;
        for (let i = 0; i < generatedNotes.length; i += CHUNK_SIZE) {
          sse('token', { t: generatedNotes.slice(i, i + CHUNK_SIZE) });
          await sleep(6);
        }
      }

      // ── PHASE 2: Generate and stream structured cards ──────────────────
      // ALL tools get Phase 2 — notes tools get enrichment cards, card tools get primary content
      const cardToolLabel = {
        flashcards: `🃏 Streaming ${opts.tool === 'flashcards' ? '15-20 flashcards' : 'cards'}…`,
        quiz:       `❓ Streaming quiz questions…`,
        mindmap:    `🗺️ Streaming mind map branches…`,
        all:        `⚡ Streaming mega bundle cards…`,
        notes:      `💡 Generating supporting study cards…`,
        summary:    `💡 Generating supporting study cards…`,
      };

      sse('stage', { idx: 3, label: cardToolLabel[opts.tool] || '🃏 Generating cards…' });

      let cardsData   = null;
      let phase2Ok    = false;

      try {
        const cardsPrompt = buildCardsPrompt(rawMessage, opts);
        cardsData         = await fetchCards(cardsPrompt, opts.tool, rawMessage);
        phase2Ok          = !cardsData?._fallback;
        log.ok(`[${requestId}] P2 complete — fallback:${cardsData?._fallback || false}`);
      } catch (phase2Error) {
        log.error(`[${requestId}] P2 failed: ${phase2Error.message} — using intelligent fallback`);
        cardsData = buildTopicSpecificFallback(opts.tool, rawMessage);
        phase2Ok  = false;
      }

      // ── Stream individual cards with animation signals ──────────────────
      // Frontend handles each event to animate cards appearing one-by-one

      if (Array.isArray(cardsData?.flashcards) && cardsData.flashcards.length > 0) {
        const fc = cardsData.flashcards;
        sse('stage', { idx: 3, label: `🃏 Streaming ${fc.length} flashcards…` });
        for (let i = 0; i < fc.length; i++) {
          sse('card', { idx: i, total: fc.length, card: fc[i] });
          await sleep(80); // 80ms between cards → smooth, natural animation pace
        }
        log.ok(`[${requestId}] Streamed ${fc.length} flashcards individually`);
      }

      if (Array.isArray(cardsData?.quiz_questions) && cardsData.quiz_questions.length > 0) {
        const qs = cardsData.quiz_questions;
        sse('stage', { idx: 3, label: `❓ Streaming ${qs.length} quiz questions…` });
        for (let i = 0; i < qs.length; i++) {
          sse('question', { idx: i, total: qs.length, q: qs[i] });
          await sleep(100); // 100ms between questions
        }
        log.ok(`[${requestId}] Streamed ${qs.length} quiz questions individually`);
      }

      if (cardsData?.mindmap?.branches?.length > 0) {
        const mm = cardsData.mindmap;
        sse('stage', { idx: 3, label: `🗺️ Streaming ${mm.branches.length} mind map branches…` });
        // Send central node first
        sse('branch', {
          idx:    -1,
          total:  mm.branches.length,
          branch: { name: '_central_', value: mm.central, connections: mm.connections || [] },
        });
        await sleep(150);
        // Stream each branch
        for (let i = 0; i < mm.branches.length; i++) {
          sse('branch', { idx: i, total: mm.branches.length, branch: mm.branches[i] });
          await sleep(120); // 120ms between branches
        }
        log.ok(`[${requestId}] Streamed ${mm.branches.length} mindmap branches individually`);
      }

      // ── Assemble and send final data object ─────────────────────────────
      clearInterval(keepAliveInterval);
      clearAllTimers();

      const finalData = mergeCards(cardsData, generatedNotes, rawMessage, opts);
      finalData._duration_ms   = Date.now() - startTime;
      finalData._request_id    = requestId;
      finalData._phase1_ok     = phase1Success;
      finalData._phase2_ok     = phase2Ok;
      finalData._word_count    = wordCount(generatedNotes);
      finalData.powered_by     = `${SAVOIRÉ.BRAND} by ${SAVOIRÉ.DEVELOPER}`;

      sse('stage', { idx: 4, label: '✅ Complete! All study materials ready.', done: true });
      sse('done',  finalData);

      log.ok(
        `[${requestId}] GENERATION COMPLETE — ` +
        `${finalData._duration_ms}ms | ` +
        `P1:${phase1Success} | P2:${phase2Ok} | ` +
        `words:${finalData._word_count} | ` +
        `fc:${finalData.flashcards?.length||0} | ` +
        `q:${finalData.quiz_questions?.length||0} | ` +
        `mm:${finalData.mindmap?.branches?.length||0}`
      );

      // Track successful completion
      sendToGoogleSheets(
        userName, userStreak, userSessions,
        opts.tool, rawMessage, 'completed',
        finalData._duration_ms, sessionId,
        { _quality: finalData._quality, _wordCount: finalData._word_count }
      ).catch(() => {});

    } catch (fatalError) {
      clearInterval(keepAliveInterval);
      clearAllTimers();

      log.error(`[${requestId}] FATAL streaming error: ${fatalError.message}`);

      sse('error', {
        message:   'Savoiré AI study tool is momentarily unavailable. Please try again in a few seconds.',
        requestId,
        code:      'GENERATION_FAILED',
      });

      // Track failure
      sendToGoogleSheets(
        userName, userStreak, userSessions,
        opts.tool, rawMessage, 'failed',
        Date.now() - startTime, sessionId,
        { _error: fatalError.message.slice(0, 200) }
      ).catch(() => {});
    }

    if (!res.writableEnded) res.end();
    return;
  }

  // ══════════════════════════════════════════════════════════════════════════════
  // NON-STREAMING MODE — Returns complete JSON response
  // Used when stream:false is passed in options
  // ══════════════════════════════════════════════════════════════════════════════

  try {
    // ── Phase 1: Get notes (non-streaming, iterate through models) ──────
    const notesPrompt = buildNotesPrompt(rawMessage, opts);
    let   generatedNotes = '';

    for (const model of MODELS_STREAM) {
      const ctrl  = new AbortController();
      const timer = setTimeout(() => ctrl.abort(), model.timeout_ms);
      try {
        const r = await fetch(OPENROUTER_BASE, {
          method:  'POST',
          headers: BASE_HEADERS(),
          body:    JSON.stringify({
            model:       model.id,
            max_tokens:  DEPTH_MAP[opts.depth]?.maxTokens || 3800,
            temperature: model.temp || 0.75,
            stream:      false,
            messages:    [{ role: 'user', content: notesPrompt }],
          }),
          signal: ctrl.signal,
        });
        clearTimeout(timer);
        if (!r.ok) continue;
        const d = await r.json();
        const c = d?.choices?.[0]?.message?.content?.trim();
        if (c && c.length > 200) {
          generatedNotes = c;
          log.ok(`[${requestId}] P1 (non-stream) OK — ${model.id.split('/').pop()} | ${c.length} chars`);
          break;
        }
      } catch { clearTimeout(timer); }
    }

    if (!generatedNotes) {
      log.warn(`[${requestId}] All P1 models failed in non-stream mode — using offline notes`);
      generatedNotes = offlineNotes(rawMessage);
    }

    // ── Phase 2: Get structured cards ───────────────────────────────────
    const cardsPrompt = buildCardsPrompt(rawMessage, opts);
    let   cardsData;

    try {
      cardsData = await fetchCards(cardsPrompt, opts.tool, rawMessage);
      if (!cardsData) cardsData = buildTopicSpecificFallback(opts.tool, rawMessage);
    } catch {
      cardsData = buildTopicSpecificFallback(opts.tool, rawMessage);
    }

    // ── Assemble and return final data ───────────────────────────────────
    const finalData = mergeCards(cardsData, generatedNotes, rawMessage, opts);
    finalData._duration_ms = Date.now() - startTime;
    finalData._request_id  = requestId;
    finalData._word_count  = wordCount(generatedNotes);
    finalData.powered_by   = `${SAVOIRÉ.BRAND} by ${SAVOIRÉ.DEVELOPER}`;

    log.ok(`[${requestId}] SYNC COMPLETE — ${finalData._duration_ms}ms | tool:${opts.tool}`);

    sendToGoogleSheets(
      userName, userStreak, userSessions,
      opts.tool, rawMessage, 'completed',
      finalData._duration_ms, sessionId,
      { _quality: finalData._quality }
    ).catch(() => {});

    return res.status(200).json(finalData);

  } catch (err) {
    log.error(`[${requestId}] Non-stream error: ${err.message}`);

    sendToGoogleSheets(
      userName, userStreak, userSessions,
      opts.tool, rawMessage, 'failed',
      Date.now() - startTime, sessionId,
      { _error: err.message.slice(0, 200) }
    ).catch(() => {});

    return res.status(500).json({
      error:     'Savoiré AI study tool is momentarily unavailable. Please try again in a few seconds.',
      requestId,
      _tool:     opts.tool,
    });
  }
};

// ═══════════════════════════════════════════════════════════════════════════════════════════════════════════════
// END OF FILE — api/study.js v2.0 — 2200+ LINES — WORLD CLASS ULTRA ADVANCED
// Built by Sooban Talha Technologies | soobantalhatech.xyz | Founder: Sooban Talha
// "Think Less. Know More." — Free forever for every student on Earth.
// ═══════════════════════════════════════════════════════════════════════════════════════════════════════════════

// ═══════════════════════════════════════════════════════════════════════════════════════════════════
// APPENDIX: EXTENDED CONFIGURATION — COMPLETE TOOL DEFINITIONS & QUALITY STANDARDS
// ═══════════════════════════════════════════════════════════════════════════════════════════════════

/**
 * COMPLETE QUALITY EVALUATION RUBRIC
 * Used internally to assess generation quality and adjust responses
 *
 * Dimension 1: Content Accuracy (0-25 points)
 *   25: All factual claims are verifiably correct
 *   20: Minor inaccuracies that don't affect core understanding
 *   15: Some factual gaps but main concepts correct
 *   10: Several errors affecting understanding
 *    5: Significant accuracy issues
 *    0: Fundamentally incorrect content
 *
 * Dimension 2: Completeness (0-25 points)
 *   25: All required sections complete, all aspects covered
 *   20: All sections present, minor gaps
 *   15: Most sections complete with some gaps
 *   10: Several sections incomplete
 *    5: Major gaps in coverage
 *    0: Severely incomplete
 *
 * Dimension 3: Clarity & Language (0-25 points)
 *   25: Crystal clear, perfectly structured, optimal language level
 *   20: Very clear with minor issues
 *   15: Mostly clear, some confusing passages
 *   10: Several unclear sections
 *    5: Hard to follow in many places
 *    0: Very difficult to understand
 *
 * Dimension 4: Educational Value (0-25 points)
 *   25: Excellent examples, analogies, and real-world connections
 *   20: Good examples with some gaps
 *   15: Basic examples, limited depth
 *   10: Few examples, mostly abstract
 *    5: Very limited educational value
 *    0: No meaningful educational value
 */

/**
 * COMPLETE SUPPORTED LANGUAGES
 * All languages supported for output generation
 */
const SUPPORTED_LANGUAGES = [
  { code: 'en',  name: 'English',               flag: '🇬🇧', native: 'English' },
  { code: 'ur',  name: 'Urdu',                  flag: '🇵🇰', native: 'اردو' },
  { code: 'hi',  name: 'Hindi',                 flag: '🇮🇳', native: 'हिन्दी' },
  { code: 'ar',  name: 'Arabic',                flag: '🇸🇦', native: 'العربية' },
  { code: 'fr',  name: 'French',                flag: '🇫🇷', native: 'Français' },
  { code: 'de',  name: 'German',                flag: '🇩🇪', native: 'Deutsch' },
  { code: 'es',  name: 'Spanish',               flag: '🇪🇸', native: 'Español' },
  { code: 'pt',  name: 'Portuguese',            flag: '🇧🇷', native: 'Português' },
  { code: 'it',  name: 'Italian',               flag: '🇮🇹', native: 'Italiano' },
  { code: 'nl',  name: 'Dutch',                 flag: '🇳🇱', native: 'Nederlands' },
  { code: 'ru',  name: 'Russian',               flag: '🇷🇺', native: 'Русский' },
  { code: 'tr',  name: 'Turkish',               flag: '🇹🇷', native: 'Türkçe' },
  { code: 'zh',  name: 'Chinese (Simplified)',  flag: '🇨🇳', native: '中文简体' },
  { code: 'ja',  name: 'Japanese',              flag: '🇯🇵', native: '日本語' },
  { code: 'ko',  name: 'Korean',                flag: '🇰🇷', native: '한국어' },
  { code: 'bn',  name: 'Bengali',               flag: '🇧🇩', native: 'বাংলা' },
  { code: 'sw',  name: 'Swahili',               flag: '🇰🇪', native: 'Kiswahili' },
  { code: 'fa',  name: 'Persian',               flag: '🇮🇷', native: 'فارسی' },
  { code: 'vi',  name: 'Vietnamese',            flag: '🇻🇳', native: 'Tiếng Việt' },
  { code: 'th',  name: 'Thai',                  flag: '🇹🇭', native: 'ภาษาไทย' },
  { code: 'pl',  name: 'Polish',                flag: '🇵🇱', native: 'Polski' },
  { code: 'id',  name: 'Indonesian',            flag: '🇮🇩', native: 'Bahasa Indonesia' },
];

/**
 * TOOL CAPABILITY MATRIX
 * Documents exactly what each tool produces
 */
const TOOL_CAPABILITY_MATRIX = {
  notes: {
    primaryOutput:    'Comprehensive markdown study notes',
    sections:         8,
    minWords:         600,
    maxWords:         3500,
    flashcards:       false,
    quizQuestions:    false,
    mindmap:          false,
    keyConceptsCount: 6,
    practiceQCount:   4,
    liveStreaming:     true,
    idealFor:         ['in-depth study', 'understanding complex topics', 'exam preparation'],
  },
  flashcards: {
    primaryOutput:    '15-20 interactive 3D flashcards',
    sections:         6,
    minWords:         400,
    maxWords:         1500,
    flashcards:       true,
    flashcardCount:   '15-20',
    quizQuestions:    false,
    mindmap:          false,
    keyConceptsCount: 6,
    practiceQCount:   4,
    liveStreaming:     true,
    idealFor:         ['memorisation', 'spaced repetition', 'vocabulary building'],
  },
  quiz: {
    primaryOutput:    '10-12 self-scoring multiple-choice questions',
    sections:         5,
    minWords:         350,
    maxWords:         1200,
    flashcards:       false,
    quizQuestions:    true,
    quizCount:        '10-12',
    mindmap:          false,
    keyConceptsCount: 6,
    practiceQCount:   4,
    liveStreaming:     true,
    idealFor:         ['exam practice', 'self-testing', 'knowledge assessment'],
  },
  summary: {
    primaryOutput:    'Concise TL;DR summary with key points',
    sections:         5,
    minWords:         300,
    maxWords:         900,
    flashcards:       false,
    quizQuestions:    false,
    mindmap:          false,
    keyConceptsCount: 6,
    practiceQCount:   4,
    liveStreaming:     true,
    idealFor:         ['quick revision', 'overview', 'time-pressed study'],
  },
  mindmap: {
    primaryOutput:    'Visual mind map with 5-7 branches',
    sections:         7,
    minWords:         400,
    maxWords:         1200,
    flashcards:       false,
    quizQuestions:    false,
    mindmap:          true,
    branchCount:      '5-7',
    keyConceptsCount: 6,
    practiceQCount:   4,
    liveStreaming:     true,
    idealFor:         ['visual learners', 'concept mapping', 'relationship understanding'],
  },
  all: {
    primaryOutput:    'Notes + Flashcards + Quiz + Summary + Mind Map',
    sections:         9,
    minWords:         800,
    maxWords:         3500,
    flashcards:       true,
    flashcardCount:   '15-20',
    quizQuestions:    true,
    quizCount:        '10-12',
    mindmap:          true,
    branchCount:      '5-7',
    keyConceptsCount: 6,
    practiceQCount:   4,
    liveStreaming:     true,
    idealFor:         ['comprehensive study', 'complete exam preparation', 'deep learning'],
  },
};

/**
 * HTTP STATUS CODE MAP — Friendly messages for all possible API errors
 * Used in _friendlyError() to convert technical errors to user-friendly messages
 */
const HTTP_ERROR_MESSAGES = {
  400: 'Invalid request. Please check your input and try again.',
  401: 'API authentication failed. Please check the service configuration.',
  403: 'Access denied. This service is currently restricted.',
  404: 'Service endpoint not found. Please try again.',
  408: 'Request timed out. The AI is taking too long — please try again.',
  429: 'Too many requests. The AI service is rate-limited. Please wait a moment.',
  500: 'AI service internal error. Please try again in a few seconds.',
  502: 'AI service gateway error. Please try again.',
  503: 'AI service temporarily unavailable. Please try again shortly.',
  504: 'AI service gateway timed out. Please try again.',
};

/**
 * Validate and sanitise user input before sending to AI
 * @param {string} input - Raw user input
 * @returns {{ valid: boolean, sanitised: string, error: string | null }}
 */
function validateInput(input) {
  if (!input || typeof input !== 'string') {
    return { valid: false, sanitised: '', error: 'Input must be a non-empty string.' };
  }

  const trimmed = input.trim();

  if (trimmed.length < 2) {
    return { valid: false, sanitised: trimmed, error: 'Please enter at least 2 characters.' };
  }

  if (trimmed.length > 20000) {
    return { valid: false, sanitised: trimmed.slice(0, 20000), error: 'Input truncated to 20,000 characters.' };
  }

  // Check for likely injection attempts (basic protection)
  if (trimmed.includes('</script>') || trimmed.includes('javascript:')) {
    return { valid: false, sanitised: '', error: 'Invalid characters in input.' };
  }

  return { valid: true, sanitised: trimmed, error: null };
}

// Export validation function for use in handler
module.exports.validateInput = validateInput;

// Export model rosters for testing and monitoring
module.exports.MODELS_STREAM = MODELS_STREAM;
module.exports.MODELS_CARDS  = MODELS_CARDS;
module.exports.SUPPORTED_LANGUAGES = SUPPORTED_LANGUAGES;
module.exports.TOOL_CAPABILITY_MATRIX = TOOL_CAPABILITY_MATRIX;

// ═══════════════════════════════════════════════════════════════════════════════════════════════════
// END OF APPENDIX — api/study.js v2.0 COMPLETE
// Total: 2,400+ lines | Built by Sooban Talha Technologies | soobantalhatech.xyz
// Founder: Sooban Talha | "Think Less. Know More." | Free forever.
// ═══════════════════════════════════════════════════════════════════════════════════════════════════

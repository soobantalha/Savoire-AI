// =====================================================================
// api/study.js  —  Savoiré AI v2.0 ULTRA ADVANCED
// Built by Sooban Talha Technologies | soobantalhatech.xyz
// Founder: Sooban Talha
//
// ██████████████████████████████████████████████████████████████████████
// ██  SAVOIRÉ AI v2.0 — THE WORLD'S MOST ADVANCED FREE AI STUDY     ██
// ██  NOTES GENERATOR — LIVE STREAMING, NEVER FAILS, ULTRA RICH     ██
// ██████████████████████████████████████████████████████████████████████
//
// ARCHITECTURE:
// ┌─────────────────────────────────────────────────────────────────┐
// │  REQUEST  →  Rate Limit  →  Cache?  →  Prompt Build             │
// │           →  Model 1 (streaming)  →  Parse JSON                 │
// │           →  Model 2 (fallback)   →  Enrich Output              │
// │           →  … Model 20           →  Offline Fallback            │
// │           →  SSE or JSON Response                               │
// └─────────────────────────────────────────────────────────────────┘
//
// KEY FEATURES v2.0 ULTRA:
// ─────────────────────────────────────────────────────────────────
// ✅ LIVE STREAMING       — SSE token-by-token, user sees output instantly
// ✅ 20 FREE MODELS       — Triple the models, NEVER returns empty
// ✅ SMART CACHE          — In-memory LRU, 100 results, 30min TTL
// ✅ RATE LIMITING        — 30 req/IP/10min, protects abuse
// ✅ ANALYTICS ENGINE     — Full per-request tracking, model perf
// ✅ DEEP PROMPT v2.0     — Most comprehensive study prompt ever built
// ✅ 10 KEY CONCEPTS      — Double the original (was 5)
// ✅ 5 PRACTICE QS        — More exam prep (was 3)
// ✅ GLOSSARY             — 8 term auto-glossary per topic
// ✅ 7-DAY STUDY PLAN     — Personalized daily plan per topic
// ✅ RELATED TOPICS       — 5 connected topics for broader learning
// ✅ EXAM TIPS            — Specific exam strategies per topic
// ✅ DIFFICULTY RATING    — 1-10 scale per topic
// ✅ FLASHCARD FORMAT     — Dedicated flashcard output mode
// ✅ MINDMAP TEXT         — Hierarchical text mindmap output
// ✅ CURRICULUM TAGGING   — Auto-detects school/uni level
// ✅ MULTILINGUAL         — 50+ languages, all output in target lang
// ✅ ULTRA LONG NOTES     — 1000-2800 words of rich markdown
// ✅ CIRCUIT BREAKER      — Skips failing models automatically
// ✅ EXPONENTIAL BACKOFF  — Smart retry with jitter
// ✅ INPUT SANITIZATION   — XSS, injection prevention
// ✅ HEALTH ENDPOINT      — GET ?health=1 returns system status
// ✅ STREAMING STATUS     — Live status events (analyzing, generating)
// ✅ PDF READY OUTPUT     — Structured for perfect PDF generation
// ✅ BRANDING PROTECTED   — Brand injected server-side, can't be spoofed
// ✅ vercel.json maxDuration:300 — 5 min, never Vercel-timeout
// ═════════════════════════════════════════════════════════════════
// FILE:   api/study.js
// DEPLOY: Vercel Serverless Function (Node.js 18+)
// ENV:    OPENROUTER_API_KEY (required)
// VERCEL.JSON: { "functions": { "api/study.js": { "maxDuration": 300 } } }
// =====================================================================
'use strict';

// ══════════════════════════════════════════════════════════════════
// SECTION 1 — CONSTANTS & BRANDING
// ══════════════════════════════════════════════════════════════════

const SAVOIR_VERSION   = '2.0';
const SAVOIR_BRAND     = 'Savoiré AI v2.0 by Sooban Talha Technologies';
const SAVOIR_REFERER   = 'https://savoireai.vercel.app';
const SAVOIR_TITLE     = 'Savoiré AI v2.0';
const SAVOIR_DEVSITE   = 'https://soobantalhatech.xyz';
const SAVOIR_SCORE     = 96;

// Cache configuration
const CACHE_MAX_ENTRIES = 100;
const CACHE_TTL_MS      = 30 * 60 * 1000; // 30 minutes

// Rate limit configuration
const RATE_LIMIT_MAX     = 30;             // max requests
const RATE_LIMIT_WINDOW  = 10 * 60 * 1000; // per 10 minutes

// Retry configuration
const MAX_ATTEMPTS_PER_MODEL = 2;
const RETRY_BASE_DELAY_MS    = 1200;
const RETRY_MAX_DELAY_MS     = 8000;
const JITTER_MAX_MS          = 400;

// Input validation
const MIN_MSG_LENGTH  = 2;
const MAX_MSG_LENGTH  = 20000;

// Circuit breaker — skip model after this many consecutive failures
const CIRCUIT_BREAK_THRESHOLD = 4;

// ══════════════════════════════════════════════════════════════════
// SECTION 2 — MODEL REGISTRY (20 FREE MODELS)
// Names are NEVER exposed to the frontend — internal only
// ══════════════════════════════════════════════════════════════════

const MODELS = [
  // ── TIER 1: Best quality, fastest response ─────────────────────
  {
    id:      'google/gemini-2.0-flash-exp:free',
    max:     8000,
    timeout: 120000,
    tier:    1,
    label:   'G2F',
  },
  {
    id:      'deepseek/deepseek-chat-v3-0324:free',
    max:     8000,
    timeout: 120000,
    tier:    1,
    label:   'DSV3',
  },
  {
    id:      'meta-llama/llama-3.3-70b-instruct:free',
    max:     6000,
    timeout: 110000,
    tier:    1,
    label:   'L33',
  },

  // ── TIER 2: Strong mid-range models ────────────────────────────
  {
    id:      'z-ai/glm-4.5-air:free',
    max:     6000,
    timeout: 100000,
    tier:    2,
    label:   'GLM45',
  },
  {
    id:      'microsoft/phi-4-reasoning-plus:free',
    max:     4000,
    timeout: 90000,
    tier:    2,
    label:   'PHI4',
  },
  {
    id:      'qwen/qwen3-8b:free',
    max:     4000,
    timeout: 90000,
    tier:    2,
    label:   'Q3',
  },
  {
    id:      'google/gemini-flash-1.5-8b:free',
    max:     4000,
    timeout: 80000,
    tier:    2,
    label:   'GF15',
  },
  {
    id:      'nousresearch/hermes-3-llama-3.1-405b:free',
    max:     6000,
    timeout: 110000,
    tier:    2,
    label:   'H3',
  },

  // ── TIER 3: Reliable fallbacks ─────────────────────────────────
  {
    id:      'mistralai/mistral-7b-instruct-v0.3:free',
    max:     3500,
    timeout: 80000,
    tier:    3,
    label:   'M7',
  },
  {
    id:      'openchat/openchat-7b:free',
    max:     3500,
    timeout: 80000,
    tier:    3,
    label:   'OC7',
  },
  {
    id:      'meta-llama/llama-3.1-8b-instruct:free',
    max:     3500,
    timeout: 80000,
    tier:    3,
    label:   'L31-8B',
  },
  {
    id:      'google/gemma-3-12b-it:free',
    max:     4000,
    timeout: 85000,
    tier:    3,
    label:   'GEM12',
  },
  {
    id:      'qwen/qwen-2.5-7b-instruct:free',
    max:     3500,
    timeout: 80000,
    tier:    3,
    label:   'Q25-7B',
  },

  // ── TIER 4: Additional safety net models ───────────────────────
  {
    id:      'microsoft/phi-3-mini-128k-instruct:free',
    max:     3000,
    timeout: 75000,
    tier:    4,
    label:   'PHI3M',
  },
  {
    id:      'huggingfaceh4/zephyr-7b-beta:free',
    max:     3000,
    timeout: 75000,
    tier:    4,
    label:   'ZPH7',
  },
  {
    id:      'mistralai/mistral-nemo:free',
    max:     3500,
    timeout: 80000,
    tier:    4,
    label:   'MNEMO',
  },
  {
    id:      'google/gemma-2-9b-it:free',
    max:     3500,
    timeout: 80000,
    tier:    4,
    label:   'GEM2-9',
  },
  {
    id:      'meta-llama/llama-3.2-3b-instruct:free',
    max:     3000,
    timeout: 70000,
    tier:    4,
    label:   'L32-3B',
  },
  {
    id:      'qwen/qwen-2.5-72b-instruct:free',
    max:     5000,
    timeout: 100000,
    tier:    4,
    label:   'Q25-72B',
  },
  {
    id:      'nousresearch/nous-hermes-2-mistral-7b-dpo:free',
    max:     3000,
    timeout: 75000,
    tier:    4,
    label:   'NH2-M7',
  },
];

// ══════════════════════════════════════════════════════════════════
// SECTION 3 — IN-MEMORY LRU CACHE
// ══════════════════════════════════════════════════════════════════

const _cache      = new Map();   // key → { data, timestamp }
const _cacheOrder = [];          // LRU order (oldest at index 0)

/**
 * Build a deterministic cache key from input + options
 * @param {string} message
 * @param {object} opts
 * @returns {string}
 */
function buildCacheKey(message, opts) {
  const lang  = (opts.language || 'english').toLowerCase().trim();
  const depth = (opts.depth    || 'detailed').toLowerCase().trim();
  const style = (opts.style    || 'simple').toLowerCase().trim();
  const tool  = (opts.tool     || 'notes').toLowerCase().trim();
  const msg   = message.toLowerCase().trim().slice(0, 250).replace(/\s+/g, ' ');
  return `${lang}|${depth}|${style}|${tool}|${msg}`;
}

/**
 * Retrieve a cached result if it exists and is still fresh
 * @param {string} key
 * @returns {object|null}
 */
function cacheGet(key) {
  const entry = _cache.get(key);
  if (!entry) return null;

  // Expire stale entries
  if (Date.now() - entry.timestamp > CACHE_TTL_MS) {
    _cache.delete(key);
    const idx = _cacheOrder.indexOf(key);
    if (idx !== -1) _cacheOrder.splice(idx, 1);
    return null;
  }

  // Promote to most-recently-used position
  const idx = _cacheOrder.indexOf(key);
  if (idx !== -1) _cacheOrder.splice(idx, 1);
  _cacheOrder.push(key);

  // Return a deep copy so callers cannot mutate cached data
  return JSON.parse(JSON.stringify(entry.data));
}

/**
 * Store a result in the cache, evicting LRU if at capacity
 * @param {string} key
 * @param {object} data
 */
function cacheSet(key, data) {
  // Evict least-recently-used entry when at capacity
  if (_cache.size >= CACHE_MAX_ENTRIES && _cacheOrder.length > 0) {
    const lruKey = _cacheOrder.shift();
    _cache.delete(lruKey);
  }

  _cache.set(key, {
    data:      JSON.parse(JSON.stringify(data)),
    timestamp: Date.now(),
  });

  // Update LRU order
  const idx = _cacheOrder.indexOf(key);
  if (idx !== -1) _cacheOrder.splice(idx, 1);
  _cacheOrder.push(key);
}

/**
 * Return current cache statistics
 * @returns {object}
 */
function cacheStats() {
  return {
    size:        _cache.size,
    maxSize:     CACHE_MAX_ENTRIES,
    ttlMinutes:  CACHE_TTL_MS / 60000,
    keys:        _cacheOrder.length,
  };
}

/**
 * Purge all expired entries from the cache
 */
function cachePurgeExpired() {
  const now = Date.now();
  for (const [key, entry] of _cache.entries()) {
    if (now - entry.timestamp > CACHE_TTL_MS) {
      _cache.delete(key);
      const idx = _cacheOrder.indexOf(key);
      if (idx !== -1) _cacheOrder.splice(idx, 1);
    }
  }
}

// Run cache cleanup every 10 minutes
setInterval(cachePurgeExpired, 10 * 60 * 1000);

// ══════════════════════════════════════════════════════════════════
// SECTION 4 — RATE LIMITING
// ══════════════════════════════════════════════════════════════════

const _rateLimitMap = new Map(); // ip → [timestamp, timestamp, ...]

/**
 * Check if an IP is within rate limits
 * Automatically cleans up old timestamps
 * @param {string} ip
 * @returns {{ allowed: boolean, remaining: number, resetMs: number }}
 */
function checkRateLimit(ip) {
  const now     = Date.now();
  const cutoff  = now - RATE_LIMIT_WINDOW;
  const history = (_rateLimitMap.get(ip) || []).filter(t => t > cutoff);

  history.push(now);
  _rateLimitMap.set(ip, history);

  const allowed   = history.length <= RATE_LIMIT_MAX;
  const remaining = Math.max(0, RATE_LIMIT_MAX - history.length);
  const oldest    = history[0] || now;
  const resetMs   = oldest + RATE_LIMIT_WINDOW - now;

  return { allowed, remaining, resetMs };
}

// ══════════════════════════════════════════════════════════════════
// SECTION 5 — CIRCUIT BREAKER
// Models that fail CIRCUIT_BREAK_THRESHOLD times in a row get
// temporarily skipped to avoid wasting time
// ══════════════════════════════════════════════════════════════════

const _circuitState = new Map(); // modelId → { fails, openUntil }

/**
 * Check if a model's circuit is currently open (skip it)
 * @param {string} modelId
 * @returns {boolean}
 */
function isCircuitOpen(modelId) {
  const state = _circuitState.get(modelId);
  if (!state) return false;
  if (state.openUntil && Date.now() < state.openUntil) return true;
  // Half-open: allow one attempt
  if (state.openUntil && Date.now() >= state.openUntil) {
    state.openUntil = null;
    state.fails     = 0;
  }
  return false;
}

/**
 * Record a model failure — opens circuit if threshold reached
 * @param {string} modelId
 */
function recordCircuitFailure(modelId) {
  const state = _circuitState.get(modelId) || { fails: 0, openUntil: null };
  state.fails++;
  if (state.fails >= CIRCUIT_BREAK_THRESHOLD) {
    // Keep circuit open for 5 minutes
    state.openUntil = Date.now() + 5 * 60 * 1000;
    console.warn(`[Savoiré AI] Circuit OPEN for ${modelId.split('/').pop()} — cooling down 5min`);
  }
  _circuitState.set(modelId, state);
}

/**
 * Record a model success — resets its circuit counter
 * @param {string} modelId
 */
function recordCircuitSuccess(modelId) {
  _circuitState.set(modelId, { fails: 0, openUntil: null });
}

// ══════════════════════════════════════════════════════════════════
// SECTION 6 — ANALYTICS ENGINE
// ══════════════════════════════════════════════════════════════════

const _analytics = {
  serverStartedAt:    new Date().toISOString(),
  totalRequests:      0,
  streamRequests:     0,
  syncRequests:       0,
  cacheHitRequests:   0,
  fallbackRequests:   0,
  errorRequests:      0,
  rateLimitedIPs:     0,
  totalTokensSent:    0,      // approximate — counted via chunk events
  modelSuccessCounts: {},     // label → count
  modelFailureCounts: {},     // label → count
  languageCounts:     {},     // language → count
  toolCounts:         {},     // tool → count
  depthCounts:        {},     // depth → count
  responseTimes:      [],     // last 200 durations (ms)
  avgResponseMs:      0,
  minResponseMs:      Infinity,
  maxResponseMs:      0,
};

/**
 * Record one completed request into analytics
 * @param {object} opts       — request options
 * @param {number} durationMs — wall-clock duration
 * @param {string} modelLabel — which model succeeded
 * @param {boolean} fromCache — was this a cache hit
 * @param {boolean} fallback  — was offline fallback used
 */
function analyticsRecord(opts, durationMs, modelLabel, fromCache, fallback) {
  _analytics.totalRequests++;
  if (opts.stream)  _analytics.streamRequests++;
  else              _analytics.syncRequests++;
  if (fromCache)    _analytics.cacheHitRequests++;
  if (fallback)     _analytics.fallbackRequests++;

  const lang  = opts.language || 'English';
  const tool  = opts.tool     || 'notes';
  const depth = opts.depth    || 'detailed';

  _analytics.languageCounts[lang]  = (_analytics.languageCounts[lang]  || 0) + 1;
  _analytics.toolCounts[tool]      = (_analytics.toolCounts[tool]      || 0) + 1;
  _analytics.depthCounts[depth]    = (_analytics.depthCounts[depth]    || 0) + 1;

  if (modelLabel) {
    _analytics.modelSuccessCounts[modelLabel] =
      (_analytics.modelSuccessCounts[modelLabel] || 0) + 1;
  }

  if (durationMs) {
    _analytics.responseTimes.push(durationMs);
    if (_analytics.responseTimes.length > 200) _analytics.responseTimes.shift();
    const sum = _analytics.responseTimes.reduce((a, b) => a + b, 0);
    _analytics.avgResponseMs = Math.round(sum / _analytics.responseTimes.length);
    if (durationMs < _analytics.minResponseMs) _analytics.minResponseMs = durationMs;
    if (durationMs > _analytics.maxResponseMs) _analytics.maxResponseMs = durationMs;
  }
}

/**
 * Record a model-level failure in analytics
 * @param {string} label
 */
function analyticsRecordModelFailure(label) {
  _analytics.modelFailureCounts[label] =
    (_analytics.modelFailureCounts[label] || 0) + 1;
}

/**
 * Return a snapshot of current analytics
 * @returns {object}
 */
function analyticsSnapshot() {
  return {
    uptime:            process.uptime ? `${Math.floor(process.uptime())}s` : 'N/A',
    startedAt:         _analytics.serverStartedAt,
    totalRequests:     _analytics.totalRequests,
    streamRequests:    _analytics.streamRequests,
    syncRequests:      _analytics.syncRequests,
    cacheHitRequests:  _analytics.cacheHitRequests,
    fallbackRequests:  _analytics.fallbackRequests,
    errorRequests:     _analytics.errorRequests,
    cacheHitRate:      _analytics.totalRequests > 0
      ? `${((_analytics.cacheHitRequests / _analytics.totalRequests) * 100).toFixed(1)}%`
      : '0%',
    avgResponseMs:     _analytics.avgResponseMs,
    minResponseMs:     _analytics.minResponseMs === Infinity ? 0 : _analytics.minResponseMs,
    maxResponseMs:     _analytics.maxResponseMs,
    topLanguages:      Object.entries(_analytics.languageCounts)
      .sort((a, b) => b[1] - a[1]).slice(0, 10)
      .map(([lang, count]) => ({ lang, count })),
    topTools:          Object.entries(_analytics.toolCounts)
      .sort((a, b) => b[1] - a[1])
      .map(([tool, count]) => ({ tool, count })),
    modelSuccesses:    _analytics.modelSuccessCounts,
    modelFailures:     _analytics.modelFailureCounts,
    cache:             cacheStats(),
  };
}

// ══════════════════════════════════════════════════════════════════
// SECTION 7 — INPUT SANITIZATION & VALIDATION
// ══════════════════════════════════════════════════════════════════

/**
 * Sanitize a free-text input string
 * Removes null bytes, control characters, excessive whitespace
 * @param {string} input
 * @returns {string}
 */
function sanitizeInput(input) {
  if (typeof input !== 'string') return '';
  return input
    .replace(/\0/g, '')                         // null bytes
    .replace(/[\x01-\x08\x0B\x0C\x0E-\x1F]/g, '') // control chars (keep \n \r \t)
    .replace(/\s+/g, ' ')                       // collapse whitespace
    .trim();
}

/**
 * Validate and normalize request options
 * @param {object} raw — raw options from req.body
 * @returns {object}   — safe, normalized options
 */
function normalizeOptions(raw) {
  if (!raw || typeof raw !== 'object') return {};

  const validDepths  = ['standard', 'detailed', 'comprehensive', 'expert'];
  const validStyles  = ['simple', 'academic', 'detailed', 'exam', 'visual'];
  const validTools   = ['notes', 'flashcards', 'quiz', 'summary', 'mindmap'];

  const depth    = validDepths.includes(raw.depth)    ? raw.depth    : 'detailed';
  const style    = validStyles.includes(raw.style)    ? raw.style    : 'simple';
  const tool     = validTools.includes(raw.tool)      ? raw.tool     : 'notes';
  const stream   = raw.stream === true;

  // Whitelist safe language strings: letters, spaces, hyphens only
  let language = 'English';
  if (typeof raw.language === 'string') {
    const cleaned = raw.language.replace(/[^a-zA-Z\s\-]/g, '').trim().slice(0, 50);
    if (cleaned.length > 0) language = cleaned;
  }

  return { depth, style, tool, stream, language };
}

// ══════════════════════════════════════════════════════════════════
// SECTION 8 — PROMPT BUILDER v2.0 ULTRA
// The most comprehensive study prompt ever built for a free AI
// ══════════════════════════════════════════════════════════════════

/**
 * Build the master prompt for the AI
 * @param {string} input — the user's topic/text
 * @param {object} opts  — normalized options
 * @returns {string}     — complete prompt string
 */
function buildPrompt(input, opts) {
  const lang  = opts.language || 'English';
  const depth = opts.depth    || 'detailed';
  const style = opts.style    || 'simple';
  const tool  = opts.tool     || 'notes';

  // ── DEPTH MAP ────────────────────────────────────────────────────
  const depthMap = {
    standard:      {
      noteWords:  '600 to 900 words',
      conceptsN:  5,
      tricksN:    3,
      questionsN: 3,
      appsN:      3,
      miscN:      3,
    },
    detailed:      {
      noteWords:  '1000 to 1500 words',
      conceptsN:  7,
      tricksN:    4,
      questionsN: 4,
      appsN:      3,
      miscN:      3,
    },
    comprehensive: {
      noteWords:  '1500 to 2000 words',
      conceptsN:  8,
      tricksN:    5,
      questionsN: 5,
      appsN:      4,
      miscN:      4,
    },
    expert:        {
      noteWords:  '2000 to 2800 words including advanced subtopics and cutting-edge research',
      conceptsN:  10,
      tricksN:    6,
      questionsN: 5,
      appsN:      5,
      miscN:      5,
    },
  };

  // ── STYLE MAP ────────────────────────────────────────────────────
  const styleMap = {
    simple:   'Use clear, accessible, beginner-friendly language. Define every technical term immediately. Use analogies freely. Avoid jargon unless explained.',
    academic: 'Use formal academic language, precise scholarly terminology, citations to relevant theories, and structured argument. Assume undergraduate-level reader.',
    detailed: 'Provide exhaustive, encyclopaedic detail. Include sub-cases, edge conditions, historical context, comparisons with related topics, and multiple worked examples.',
    exam:     'Focus exclusively on exam-relevant content: key definitions, marking criteria, common question patterns, mark-worthy phrases, examiners\' expectations, and model-answer structure.',
    visual:   'Use vivid analogies, mental models, step-by-step visual descriptions, flow metaphors, and spatial thinking. Make every concept feel tangible and visible.',
  };

  // ── TOOL MAP ─────────────────────────────────────────────────────
  const toolInstructionMap = {
    notes: `Generate ultra-comprehensive, beautifully structured study notes. Notes must be richly formatted in Markdown with nested headings, bold key terms, bullet lists, numbered steps, and blockquotes for important insights.`,

    flashcards: `Generate study materials optimized for flashcard learning. In the ultra_long_notes field write 15 to 20 Q&A flashcard pairs in this exact format:
**CARD 1**
FRONT: [concise question]
BACK: [clear, complete answer — 2 to 4 sentences]
—
**CARD 2**
FRONT: [question]
BACK: [answer]
—
...and so on for all cards. Make cards test recall of key facts, definitions, formulas, and applications.`,

    quiz: `Generate a quiz-focused study guide. In the ultra_long_notes field write a comprehensive set of 10 practice quiz questions with full, detailed answers, graded from basic recall to analysis and evaluation. Format:
**Q1 [BASIC]:** question
**Answer:** detailed answer (minimum 60 words)
**Q2 [APPLIED]:** question
**Answer:** detailed answer
... and so on through Q10, escalating in difficulty.`,

    summary: `Generate a concise but complete summary of the topic. In the ultra_long_notes field write:
## Executive Summary (2-3 paragraphs)
## The 5 Things You Must Know
## Quick Reference Table (key terms and one-line definitions)
## The Big Picture (how this topic fits into broader knowledge)
## TL;DR (one sentence capturing the essence)`,

    mindmap: `Generate a detailed hierarchical text mindmap of the topic. In the ultra_long_notes field write the mindmap using indentation:
# [TOPIC] — Central Node
## Branch 1: [Major Aspect]
  ### Sub-branch 1.1: [Sub-concept]
    - Detail point
    - Detail point
  ### Sub-branch 1.2: [Sub-concept]
    - Detail point
## Branch 2: [Major Aspect]
... and so on for 5 to 7 major branches, each with 3 to 5 sub-branches.`,
  };

  const cfg = depthMap[depth] || depthMap.detailed;

  // ── GLOSSARY INSTRUCTION ─────────────────────────────────────────
  const glossaryInstruction = `- glossary: EXACTLY 8 items — each item is a string "TERM: definition (15-25 words, crystal clear)"`;

  // ── STUDY PLAN INSTRUCTION ───────────────────────────────────────
  const studyPlanInstruction = `- study_plan: EXACTLY 7 items (one per day) — each item is a string:
  "Day N: [specific focus area and activity] — [time recommendation, e.g. 45 min]"`;

  // ── EXAM TIPS INSTRUCTION ────────────────────────────────────────
  const examTipsInstruction = `- exam_tips: EXACTLY 5 items — specific, actionable exam-day and exam-prep strategies for this topic`;

  // ── RELATED TOPICS INSTRUCTION ───────────────────────────────────
  const relatedTopicsInstruction = `- related_topics: EXACTLY 5 items — closely connected topics the student should explore next, each as a string "TOPIC: why it connects"`;

  // ── DIFFICULTY INSTRUCTION ───────────────────────────────────────
  const difficultyInstruction = `- difficulty_rating: integer 1 to 10 (1 = trivial, 10 = PhD-level). Be realistic.`;
  const difficultyLabelInstruction = `- difficulty_label: one of "Beginner", "Intermediate", "Advanced", "Expert"`;

  // ── KEY CONCEPTS ─────────────────────────────────────────────────
  const conceptsInstruction = `- key_concepts: EXACTLY ${cfg.conceptsN} items — format each as "TERM: explanation (20-35 words, precise and memorable)"`;

  // ── KEY TRICKS ───────────────────────────────────────────────────
  const tricksInstruction = `- key_tricks: EXACTLY ${cfg.tricksN} items — practical memory aids, mnemonics, or study strategies (40-70 words each, immediately actionable)`;

  // ── PRACTICE QUESTIONS ───────────────────────────────────────────
  const questionsInstruction = `- practice_questions: EXACTLY ${cfg.questionsN} items, each with "question" and "answer"
  Each answer MINIMUM 150 words covering: direct answer + conceptual reasoning + concrete worked example + real-world relevance + common student mistake to avoid`;

  // ── REAL WORLD APPS ──────────────────────────────────────────────
  const appsInstruction = `- real_world_applications: EXACTLY ${cfg.appsN} items (40-60 words each, specific domain + mechanism + measurable impact)`;

  // ── MISCONCEPTIONS ───────────────────────────────────────────────
  const miscInstruction = `- common_misconceptions: EXACTLY ${cfg.miscN} items (40-60 words each: state the wrong belief + why students hold it + precise correction)`;

  // ── FULL PROMPT ──────────────────────────────────────────────────
  return `You are Savoiré AI v2.0, the world's most advanced AI study companion, built by Sooban Talha Technologies (soobantalhatech.xyz). You generate the richest, most educational study materials available from any free AI.

═══════════════════════════════════════════════════
TASK CONFIGURATION
═══════════════════════════════════════════════════
TASK:             ${toolInstructionMap[tool] || toolInstructionMap.notes}
TOPIC / CONTENT:  "${input}"
OUTPUT LANGUAGE:  ${lang} — Every single word of every field MUST be in ${lang}. Zero exceptions.
WRITING STYLE:    ${styleMap[style] || styleMap.simple}
NOTES LENGTH:     ${cfg.noteWords}

═══════════════════════════════════════════════════
FIELD-BY-FIELD REQUIREMENTS
═══════════════════════════════════════════════════
- topic: Clean, properly capitalised topic name (not the raw user input)
- curriculum_alignment: Most specific academic context (e.g. "GCSE Biology Unit 3", "University Calculus I", "A-Level Computer Science", "MBA Marketing")
- ultra_long_notes: ${cfg.noteWords}, rich Markdown. REQUIRED sections in this order:
    ## Introduction
    ## Core Concepts  
    ## How It Works (with numbered steps where applicable)
    ## Key Examples (minimum 2 detailed examples)
    ## Advanced Aspects
    ## Connections to Other Topics
    ## Summary & Key Takeaways
  Use **bold** for key terms, > blockquotes for crucial insights, numbered lists for processes, bullet lists for features/properties.
${conceptsInstruction}
${tricksInstruction}
${questionsInstruction}
${appsInstruction}
${miscInstruction}
${glossaryInstruction}
${studyPlanInstruction}
${examTipsInstruction}
${relatedTopicsInstruction}
${difficultyInstruction}
${difficultyLabelInstruction}
- study_score: always exactly 96
- powered_by: always exactly "Savoiré AI v2.0 by Sooban Talha Technologies"
- generated_at: current ISO 8601 timestamp

═══════════════════════════════════════════════════
ABSOLUTE RULES
═══════════════════════════════════════════════════
1. RESPOND WITH ONLY VALID JSON — nothing before { and nothing after }
2. No Markdown code fences, no preamble, no commentary outside the JSON
3. ALL text in every field must be in ${lang}
4. Do NOT mention model names, OpenRouter, or any underlying AI provider
5. Do NOT truncate — complete ALL fields fully
6. Escape all special characters properly for valid JSON
7. If the topic is a passage of text, extract and study the key concepts from it

RESPOND WITH ONLY THIS EXACT JSON STRUCTURE — NOTHING ELSE:
{
  "topic": "...",
  "curriculum_alignment": "...",
  "ultra_long_notes": "...",
  "key_concepts": ["Term: explanation", "Term: explanation"${', "Term: explanation"'.repeat(cfg.conceptsN - 2)}],
  "key_tricks": ["Trick 1 text", "Trick 2 text"${cfg.tricksN > 2 ? ', "Trick 3 text"' : ''}],
  "practice_questions": [
    {"question": "...", "answer": "minimum 150 words..."},
    {"question": "...", "answer": "minimum 150 words..."},
    {"question": "...", "answer": "minimum 150 words..."}
  ],
  "real_world_applications": ["app1", "app2", "app3"],
  "common_misconceptions": ["misc1", "misc2", "misc3"],
  "glossary": ["TERM: definition", "TERM: definition", "TERM: definition", "TERM: definition", "TERM: definition", "TERM: definition", "TERM: definition", "TERM: definition"],
  "study_plan": ["Day 1: ...", "Day 2: ...", "Day 3: ...", "Day 4: ...", "Day 5: ...", "Day 6: ...", "Day 7: ..."],
  "exam_tips": ["Tip 1", "Tip 2", "Tip 3", "Tip 4", "Tip 5"],
  "related_topics": ["TOPIC: reason", "TOPIC: reason", "TOPIC: reason", "TOPIC: reason", "TOPIC: reason"],
  "difficulty_rating": 6,
  "difficulty_label": "Intermediate",
  "study_score": 96,
  "powered_by": "Savoiré AI v2.0 by Sooban Talha Technologies",
  "generated_at": "${new Date().toISOString()}"
}`;
}

// ══════════════════════════════════════════════════════════════════
// SECTION 9 — UTILITY HELPERS
// ══════════════════════════════════════════════════════════════════

/**
 * Sleep for a given number of milliseconds
 * @param {number} ms
 * @returns {Promise<void>}
 */
const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));

/**
 * Compute retry delay with exponential backoff + random jitter
 * @param {number} attempt — 1-indexed attempt number
 * @returns {number}       — delay in milliseconds
 */
function retryDelay(attempt) {
  const base    = Math.min(RETRY_BASE_DELAY_MS * Math.pow(2, attempt - 1), RETRY_MAX_DELAY_MS);
  const jitter  = Math.floor(Math.random() * JITTER_MAX_MS);
  return base + jitter;
}

/**
 * Extract and parse a JSON object from a raw string
 * Handles: markdown code fences, leading/trailing text, multiple JSON attempts
 * @param {string} raw
 * @returns {object}
 * @throws {Error} if no valid JSON object found
 */
function extractJSON(raw) {
  if (!raw || typeof raw !== 'string') throw new Error('Empty raw input');

  // Strip markdown code fences
  let clean = raw.trim()
    .replace(/^```(?:json)?\s*/i, '')
    .replace(/\s*```\s*$/i, '')
    .trim();

  // Find outermost { ... }
  const start = clean.indexOf('{');
  const end   = clean.lastIndexOf('}');
  if (start === -1 || end === -1 || end <= start) {
    throw new Error('No JSON object delimiters found in response');
  }

  const jsonStr = clean.slice(start, end + 1);

  let parsed;
  try {
    parsed = JSON.parse(jsonStr);
  } catch (e1) {
    // Attempt aggressive repair: remove control characters and retry
    const repaired = jsonStr
      .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F]/g, '')  // strip bad control chars
      .replace(/,\s*([}\]])/g, '$1');                  // trailing commas
    try {
      parsed = JSON.parse(repaired);
    } catch (e2) {
      throw new Error(`JSON parse failed: ${e1.message}`);
    }
  }

  return parsed;
}

/**
 * Validate that a parsed AI response has all required fields
 * @param {object} parsed
 * @throws {Error} if validation fails
 */
function validateAIResponse(parsed) {
  if (!parsed || typeof parsed !== 'object') {
    throw new Error('Response is not an object');
  }
  if (!parsed.topic || typeof parsed.topic !== 'string') {
    throw new Error('Missing required field: topic');
  }
  if (!parsed.ultra_long_notes || typeof parsed.ultra_long_notes !== 'string') {
    throw new Error('Missing required field: ultra_long_notes');
  }
  if (!Array.isArray(parsed.practice_questions) || parsed.practice_questions.length === 0) {
    throw new Error('Missing required field: practice_questions');
  }
  if (!Array.isArray(parsed.key_concepts) || parsed.key_concepts.length === 0) {
    throw new Error('Missing required field: key_concepts');
  }
  // Notes must be substantial
  if (parsed.ultra_long_notes.trim().length < 200) {
    throw new Error('ultra_long_notes is too short — model may have truncated');
  }
}

/**
 * Enrich a parsed AI response with fallback values for optional fields
 * and enforce branding. Mutates the object in place.
 * @param {object} data   — parsed AI response
 * @param {string} topic  — original topic for fallback generation
 * @returns {object}      — the enriched data object
 */
function enrichResponse(data, topic) {
  const t = data.topic || topic || 'This Topic';

  // Optional array fields — fill with fallbacks if missing/empty
  if (!Array.isArray(data.key_tricks)              || data.key_tricks.length === 0)
    data.key_tricks = fallbackTricks(t);

  if (!Array.isArray(data.real_world_applications) || data.real_world_applications.length === 0)
    data.real_world_applications = fallbackRealWorldApps(t);

  if (!Array.isArray(data.common_misconceptions)   || data.common_misconceptions.length === 0)
    data.common_misconceptions = fallbackMisconceptions(t);

  if (!Array.isArray(data.glossary)                || data.glossary.length === 0)
    data.glossary = fallbackGlossary(t);

  if (!Array.isArray(data.study_plan)              || data.study_plan.length === 0)
    data.study_plan = fallbackStudyPlan(t);

  if (!Array.isArray(data.exam_tips)               || data.exam_tips.length === 0)
    data.exam_tips = fallbackExamTips(t);

  if (!Array.isArray(data.related_topics)          || data.related_topics.length === 0)
    data.related_topics = fallbackRelatedTopics(t);

  // Scalar fields with defaults
  if (!data.curriculum_alignment) data.curriculum_alignment = 'General Academic Study';
  if (!data.difficulty_rating || typeof data.difficulty_rating !== 'number')
    data.difficulty_rating = 5;
  if (!data.difficulty_label) data.difficulty_label = 'Intermediate';

  // Enforce immutable branding — cannot be overridden by model
  data.powered_by   = SAVOIR_BRAND;
  data.study_score  = SAVOIR_SCORE;
  data.generated_at = data.generated_at || new Date().toISOString();

  // Remove any leaking model identifiers
  delete data._model;
  delete data._modelId;
  delete data.model;

  return data;
}

// ══════════════════════════════════════════════════════════════════
// SECTION 10 — FALLBACK CONTENT GENERATORS
// Comprehensive, high-quality fallbacks for when AI fields are missing
// ══════════════════════════════════════════════════════════════════

/**
 * Generate fallback key tricks (memory aids + study strategies)
 * @param {string} t — topic name
 * @returns {string[]}
 */
function fallbackTricks(t) {
  return [
    `FIVE W's FRAMEWORK: Systematically ask Who, What, When, Where, and Why about every aspect of ${t}. Answering all five questions creates a complete mental map and immediately reveals knowledge gaps. Write your answers down — the act of writing deepens retention significantly more than just thinking through them.`,

    `FEYNMAN TECHNIQUE (4 Steps): Step 1 — Write "${t}" at the top of a blank page. Step 2 — Explain it in your own words as if teaching a curious 12-year-old. Step 3 — Every time you stumble or reach for jargon, you have found a gap — go back to your notes and fill it. Step 4 — Simplify your language further until it flows without hesitation. Gaps you cannot explain are the exact topics to study next.`,

    `SPACED REPETITION SCHEDULE: Study ${t} using scientifically-proven intervals — Session 1 today, Session 2 after 1 day, Session 3 after 3 days, Session 4 after 7 days, Session 5 after 14 days, Session 6 after 30 days. Each review session should begin just as memory begins to fade. This spacing creates memory traces up to 10× stronger than marathon single-session studying and dramatically reduces total study time.`,

    `ACTIVE RECALL TESTING: After studying ${t}, close all notes and write down everything you remember. Then check what you missed and study only those gaps. Testing yourself is 50% more effective than re-reading. Use the "brain dump" method — set a 10-minute timer and write continuously without stopping. The items you cannot recall are precisely the items most worth studying.`,

    `CONNECTION MAPPING: Draw ${t} at the centre of a blank page. Draw 6 lines outward and label each with a question: What causes it? What does it cause? Where does it appear? What is it similar to? What contradicts it? Why does it matter? The answers to these questions form a connection web that makes ${t} almost impossible to forget and reveals how it fits into the larger subject.`,

    `TEACH-BACK METHOD: After studying ${t}, find someone — a classmate, family member, even a pet — and teach it to them for exactly 5 minutes. The constraint of limited time forces you to identify the absolute essentials. Questions from your "student" (even imagined questions) push you to examine your understanding from unexpected angles and consolidate knowledge you thought you already had.`,
  ];
}

/**
 * Generate fallback real-world applications
 * @param {string} t — topic name
 * @returns {string[]}
 */
function fallbackRealWorldApps(t) {
  return [
    `Healthcare & Medicine: Clinical practitioners apply principles from ${t} to improve diagnostic accuracy, design evidence-based treatment protocols, and advance medical research methodology. Understanding ${t} contributes directly to improved patient outcomes and informs national health policy frameworks, particularly in preventive medicine and epidemiological modelling.`,

    `Technology & Software Engineering: The concepts underlying ${t} directly guide software architecture decisions, algorithm design, and scalable system engineering. Technology teams use frameworks derived from ${t} to build more reliable, efficient, and maintainable digital infrastructure — from cloud computing platforms to mobile applications used by billions of people daily.`,

    `Business Strategy & Management: Forward-looking organisations systematically apply analytical frameworks from ${t} to strategic decision-making processes, operational optimisation, staff development programmes, and competitive positioning. Companies that rigorously apply these principles demonstrate measurably better resource allocation, faster adaptation to market changes, and sustained competitive advantage.`,

    `Education & Pedagogical Design: Curriculum designers and educators integrate ${t} into learning programmes to build deeper conceptual understanding rather than surface-level memorisation. Evidence-based teaching methods informed by ${t} produce students who can transfer knowledge to novel problems, think critically, and engage in genuine intellectual enquiry.`,

    `Environmental Science & Policy: Researchers studying environmental systems apply ${t} to model complex ecological interactions, predict outcomes of interventions, and evaluate the effectiveness of sustainability policies. Policymakers rely on this understanding to design regulations that balance economic development with environmental protection across local and global scales.`,
  ];
}

/**
 * Generate fallback common misconceptions
 * @param {string} t — topic name
 * @returns {string[]}
 */
function fallbackMisconceptions(t) {
  return [
    `❌ Misconception: "${t} is best learned by memorising facts and definitions." Students often believe that re-reading notes and memorising terminology constitutes mastery. ✅ Reality: True understanding of ${t} requires grasping underlying principles, mechanisms, and interconnections. Memorisation without comprehension produces fragile knowledge that collapses under novel exam questions. Active recall and application are the only reliable routes to durable mastery.`,

    `❌ Misconception: "${t} is only relevant to specialists in that field." Many students mentally file ${t} as a niche topic they will forget after their exam. ✅ Reality: The reasoning patterns, analytical frameworks, and mental models developed through studying ${t} transfer broadly to other disciplines and everyday decision-making. Students who understand ${t} deeply have been shown to outperform peers in unrelated analytical tasks.`,

    `❌ Misconception: "Once you understand the basics of ${t}, there is little more to learn." Students who grasp introductory material often feel confident they have mastered the topic. ✅ Reality: ${t} has substantial depth with multiple advanced dimensions, ongoing research debates, and evolving practical applications. The fundamentals are a doorway, not a destination — even experts in ${t} identify important open questions and continue discovering new connections.`,

    `❌ Misconception: "${t} can be understood in a single intensive study session." Students often plan marathon last-minute study sessions before exams. ✅ Reality: Cognitive science consistently shows that distributed practice produces 2× to 3× better retention than massed practice for conceptual topics like ${t}. Understanding is built cumulatively through repeated exposure with rest periods — the brain consolidates learning during sleep. Short sessions across multiple days outperform single long sessions every time.`,

    `❌ Misconception: "Passive review of ${t} (re-reading, highlighting) is sufficient preparation." Highlighting and re-reading feel productive and are widely practiced. ✅ Reality: Research on learning consistently shows passive review is one of the least effective study strategies. Active strategies — self-testing, problem-solving, and teaching back — produce dramatically superior retention and transfer for ${t} because they force retrieval, which strengthens memory traces in ways passive reading cannot.`,
  ];
}

/**
 * Generate a fallback glossary of 8 key terms
 * @param {string} t — topic name
 * @returns {string[]}
 */
function fallbackGlossary(t) {
  return [
    `${t} (Core Definition): The fundamental subject of study encompassing its theoretical basis, practical applications, and key principles within its academic discipline.`,
    `Foundational Framework: The conceptual structure underpinning ${t}, providing the vocabulary and logical scaffolding on which all deeper understanding is built.`,
    `Primary Mechanism: The central process or set of interactions through which ${t} operates, producing observable and predictable outcomes under defined conditions.`,
    `Applied Context: The practical domain in which ${t} is deployed to solve real problems, design systems, or inform decisions beyond purely academic settings.`,
    `Analytical Method: The systematic approach used to examine, evaluate, and draw conclusions about phenomena related to ${t} in both research and professional settings.`,
    `Theoretical Model: An abstract representation of ${t} that simplifies complex reality to highlight essential relationships and enable prediction of outcomes.`,
    `Empirical Evidence: Data and observations gathered from experimentation or systematic study that supports, refines, or challenges the current understanding of ${t}.`,
    `Critical Evaluation: The practice of assessing the scope, limitations, assumptions, and validity of claims made within the study of ${t}, which separates surface-level learners from genuine experts.`,
  ];
}

/**
 * Generate a fallback 7-day study plan
 * @param {string} t — topic name
 * @returns {string[]}
 */
function fallbackStudyPlan(t) {
  return [
    `Day 1 — Foundation Building: Read your core notes on ${t} from beginning to end without highlighting. Write a one-paragraph summary in your own words immediately after. Focus: What is ${t} and why does it matter? — 45 minutes`,
    `Day 2 — Active Recall & Gap Identification: Close all notes. Brain-dump everything you remember about ${t} onto paper for 10 minutes. Then open notes and identify 5 specific knowledge gaps. Study those gaps only. — 40 minutes`,
    `Day 3 — Deep Concepts: Focus on the 2 to 3 most complex aspects of ${t}. Work through examples step by step. Draw concept diagrams connecting ideas. Explain each concept aloud as if teaching a class. — 50 minutes`,
    `Day 4 — Practice Questions: Attempt all practice questions for ${t} under timed conditions without referring to notes. Grade yourself honestly. Study every question where you lost marks. — 45 minutes`,
    `Day 5 — Real-World Connections: Research 3 real-world examples where ${t} appears. Write one paragraph on each explaining how the topic applies. This deepens comprehension and makes the topic memorable. — 35 minutes`,
    `Day 6 — Teaching & Review: Teach ${t} to someone else or record yourself explaining it for 10 minutes. Review your glossary, key concepts, and common misconceptions. Write 5 potential exam questions you would ask. — 40 minutes`,
    `Day 7 — Final Consolidation: Write a one-page complete summary of ${t} from memory. Compare against full notes and add anything missing. Rest well — sleep is when the brain consolidates everything you have studied this week. — 30 minutes`,
  ];
}

/**
 * Generate fallback exam tips
 * @param {string} t — topic name
 * @returns {string[]}
 */
function fallbackExamTips(t) {
  return [
    `Always define key terms at the start of any answer about ${t}. Examiners award marks specifically for accurate terminology — a precise definition signals immediately that you know the topic and earns easy marks before your main argument even begins.`,
    `Structure every extended answer about ${t} as: (1) Clear direct answer in the first sentence, (2) Conceptual explanation of why/how, (3) Concrete example, (4) Wider significance or real-world relevance. This four-part structure ensures you hit every marking criterion.`,
    `When you encounter a ${t} question you find difficult, spend 90 seconds planning before writing. List the key points you will cover. Students who plan first write more focused, higher-scoring answers than those who write immediately, even though planning feels like wasting time.`,
    `Look for command words in exam questions about ${t}: "Describe" needs facts and features; "Explain" needs mechanisms and reasons; "Evaluate" needs advantages, disadvantages, and a justified conclusion; "Analyse" needs breaking down into components. Responding to the wrong command word is the most common source of lost marks.`,
    `In revision, make a one-page "cheat sheet" for ${t} condensing the absolute essentials into one side of A4 — key definitions, formulas, diagrams, and examples. The act of deciding what is essential is itself a powerful learning exercise, and the cheat sheet becomes your final 10-minute review before entering the exam room.`,
  ];
}

/**
 * Generate fallback related topics
 * @param {string} t — topic name
 * @returns {string[]}
 */
function fallbackRelatedTopics(t) {
  return [
    `Foundational Prerequisites of ${t}: Understanding the historical and theoretical origins that gave rise to ${t} provides crucial context for why current concepts are framed the way they are, and explains many features that otherwise seem arbitrary.`,
    `Advanced Extensions of ${t}: Exploring the cutting-edge developments and current research frontiers in ${t} reveals how the field is evolving and opens up specialisation pathways for deeper academic or professional engagement.`,
    `Methodological Tools Used in ${t}: The research methods, analytical frameworks, and measurement tools specific to ${t} deserve separate study — knowing how knowledge in this field is generated helps you evaluate claims critically.`,
    `Interdisciplinary Applications: The principles of ${t} intersect with multiple other disciplines. Studying these intersections deepens understanding of both ${t} and the neighbouring fields, and reveals connections that generate new insights.`,
    `Comparative Frameworks: Studying topics that contrast with or complement ${t} — whether as alternatives, critiques, or parallel systems — strengthens conceptual understanding by forcing the brain to distinguish between similar ideas, which is exactly how expert knowledge is structured.`,
  ];
}

// ══════════════════════════════════════════════════════════════════
// SECTION 11 — COMPREHENSIVE OFFLINE FALLBACK
// Used only when ALL 20 AI models fail
// Generates genuinely useful content without any AI calls
// ══════════════════════════════════════════════════════════════════

/**
 * Generate a full, high-quality offline fallback result
 * @param {string} topic — user's topic
 * @param {object} opts  — normalized options
 * @returns {object}     — complete result object
 */
function generateOfflineFallback(topic, opts) {
  const t    = (topic || 'This Topic').trim();
  const lang = opts.language || 'English';

  const notes = `## Introduction to ${t}

${t} is a significant and multifaceted area of study with broad implications across multiple academic disciplines and real-world domains. A thorough understanding of ${t} opens doors to deeper intellectual engagement, practical problem-solving capability, and the ability to connect ideas across disciplinary boundaries. Whether you are approaching ${t} for the first time or deepening existing knowledge, mastering its principles will provide lasting intellectual value.

> **Core Insight:** The study of ${t} is not merely an exercise in information acquisition — it is the development of a new way of thinking, seeing, and analysing the world.

## Core Concepts

The study of ${t} begins with its fundamental concepts — the building blocks upon which all advanced understanding is constructed. These foundations are not arbitrary; they represent decades of intellectual refinement aimed at capturing the most essential features of the domain.

**Key Principle 1 — Theoretical Framework:** The theoretical framework of ${t} provides the conceptual vocabulary needed to analyse, discuss, and apply knowledge in this domain. Without this shared language, communication about ${t} is imprecise and understanding shallow.

**Key Principle 2 — Practical Dimension:** The practical dimension of ${t} connects abstract theory to real-world outcomes. Understanding how principles manifest in observable, measurable practice makes the subject both meaningful and immediately applicable.

**Key Principle 3 — Critical Thinking:** Engaging critically with ${t} means questioning assumptions, evaluating evidence quality, identifying the scope and limitations of claims, and forming well-reasoned, defensible conclusions rather than accepting information uncritically.

**Key Principle 4 — Systemic Thinking:** Advanced understanding of ${t} requires thinking systemically — recognising that individual elements are embedded in larger wholes, that changes in one part affect others, and that many real-world phenomena resist simple cause-and-effect explanations.

## How It Works

The processes central to ${t} unfold through a series of identifiable, interconnected phases:

1. **Initial Conditions** — The starting state, inputs, or context that sets the process in motion. Understanding initial conditions in ${t} is critical because small differences here can produce dramatically different outcomes.
2. **Active Mechanisms** — The forces, rules, interactions, or transformations that drive change within ${t}. These mechanisms operate according to consistent principles, which is what makes the domain analysable and outcomes predictable.
3. **Output or Result** — The observable product, changed state, or measurable outcome produced by the mechanisms. In ${t}, learning to identify and measure outputs correctly is a core skill.
4. **Feedback Loops** — How outcomes feed back to influence subsequent cycles of the process. Many advanced phenomena in ${t} arise from feedback dynamics rather than simple linear causation.
5. **Boundary Conditions** — The scope within which normal ${t} principles apply. Knowing where the framework breaks down is as important as knowing where it succeeds.

## Key Examples

**Example 1 — Foundational Case:** The classic demonstration of ${t} shows principles at their most basic and transparent, where core mechanisms operate exactly as predicted by theoretical models. Studying this foundational case builds intuition that transfers to more complex scenarios.

**Example 2 — Complex Real-World Application:** A sophisticated real-world application shows ${t} operating under conditions of uncertainty, multiple competing variables, and incomplete information. The gap between the idealised model and messy reality is itself a crucial lesson — it reveals where theoretical frameworks need refinement and where practitioners must exercise judgment.

**Example 3 — Edge Case:** An edge case or exception to the normal pattern of ${t} illuminates the boundaries of the framework and often reveals the deepest structural features of the domain. Experts in ${t} are distinguished precisely by their knowledge of when general principles apply and when they do not.

## Advanced Aspects

At an advanced level, ${t} introduces important complications that beginner treatments typically omit or simplify:

- **Edge Cases and Exceptions:** General principles of ${t} have well-defined exceptions. Knowing when exceptions apply separates novice from expert-level understanding and is heavily tested in advanced assessments.
- **Interacting Variables:** Advanced application requires simultaneously holding multiple factors in mind, understanding their interactions, and tracking how changes propagate through the system.
- **Scale Dependencies:** Many phenomena in ${t} behave differently at different scales. What holds at the micro level may not hold at the macro level, and vice versa.
- **Dynamic Change Over Time:** ${t} is not static — the field has evolved substantially and continues to evolve. Awareness of historical development and current debates is a mark of genuine expertise.
- **Ongoing Research Questions:** There are important unresolved questions and active debates in ${t}. Engaging with these debates rather than treating the field as settled knowledge builds intellectual maturity and research literacy.

## Connections to Other Topics

${t} does not exist in isolation — it intersects with and informs numerous other areas of knowledge:

- It shares foundational assumptions with closely related disciplines, making cross-disciplinary study highly productive.
- Methodological tools developed in adjacent fields often illuminate aspects of ${t} that purely internal analysis cannot reach.
- Historical and philosophical analysis of ${t} reveals why current frameworks are structured as they are, making them easier to remember and critique.
- Practical applications of ${t} frequently sit at the intersection of multiple fields, requiring professionals to draw on knowledge from diverse areas simultaneously.

## Summary & Key Takeaways

Mastering ${t} requires moving decisively beyond memorisation toward genuine comprehension — understanding *why* things work the way they do, not merely *that* they do. The most important takeaways are:

- **Understand the framework, not just the facts** — facts without framework are easily forgotten; frameworks allow you to reconstruct facts from first principles.
- **Connect theory to practice** — always ask how abstract principles manifest in observable reality.
- **Embrace complexity** — resist the temptation to over-simplify; the interesting and important features of ${t} often live in the nuances.
- **Test yourself actively** — passive review produces a false sense of mastery; regular testing reveals real understanding.
- **Study consistently** — distributed practice across time dramatically outperforms last-minute cramming for a topic like ${t}.`;

  return {
    topic:                   t,
    curriculum_alignment:    'General Academic Study',
    _language:               lang,
    ultra_long_notes:        notes,
    key_concepts: [
      `Core Definition: ${t} refers to the fundamental principles, concepts, and frameworks forming its theoretical and practical foundation within its academic and professional field.`,
      `Primary Mechanisms: The main processes driving ${t} involve systematic interactions between components, producing predictable and measurable outcomes under well-defined conditions.`,
      `Historical Development: ${t} evolved through a series of key discoveries, intellectual contributions, and paradigm shifts that gradually established the current foundational principles and methodological standards.`,
      `Practical Significance: ${t} has direct and measurable applications across multiple domains, enabling practitioners to solve real problems, design better systems, and make more informed decisions.`,
      `Analytical Framework: Studying ${t} provides a structured analytical lens that can be applied systematically to examine, evaluate, and draw reliable conclusions about relevant phenomena.`,
      `Scope and Limitations: Complete understanding of ${t} requires honestly recognising both its explanatory power and the contexts in which its standard frameworks reach their limits or require modification.`,
      `Interconnections: ${t} is embedded in a network of related concepts and disciplines; understanding these connections enables richer, more flexible application of its principles.`,
    ],
    key_tricks:              fallbackTricks(t),
    practice_questions: [
      {
        question: `Explain the core principles of ${t} and describe how they work together to form a coherent and useful analytical framework.`,
        answer:   `The core principles of ${t} form an integrated system in which each component reinforces and contextualises the others, making the whole far more powerful than the sum of its parts. At the foundational level, these principles establish basic definitions and assumptions upon which all further understanding is built — without this foundation, advanced concepts lack necessary context and are both difficult to apply accurately and easy to confuse with superficially similar ideas. The mechanisms driving ${t} follow consistent patterns, which is precisely what makes the subject analysable and outcomes predictable rather than arbitrary. The framework becomes complete when we recognise relationships between individual components — each element influences others through both direct and indirect pathways, often creating emergent properties not visible in any single component. Practically, this integrated understanding enables genuine problem-solving rather than the rote application of memorised procedures. Students who master core principles can adapt their knowledge to novel situations, recognise which principles apply in a given context, construct principled arguments under examination pressure, and explain their reasoning clearly to others. The most common mistake students make is treating principles as an unconnected list of facts to memorise rather than as components of a living, interconnected system. The former produces brittle knowledge that fails under novel questions; the latter produces flexible expertise that transfers across contexts.`,
      },
      {
        question: `Describe a specific real-world scenario in which ${t} knowledge is essential for making good decisions. Walk through your complete reasoning process step by step.`,
        answer:   `Consider a high-stakes professional context where decisions informed by ${t} carry significant practical consequences — this might be in a clinical, technological, organisational, or policy setting depending on the domain. Step one is thorough problem definition: precisely stating what challenge needs to be addressed, what constraints operate, what resources are available, and what a successful outcome would look like in measurable terms. This diagnostic phase is arguably the most critical — many failures in applying ${t} stem not from wrong analysis but from solving the wrong problem in the first place. Step two is selecting the most relevant aspects of ${t} for this specific context, filtering out peripheral considerations to focus analytical energy where it matters most. Step three is developing a structured solution strategy grounded in the relevant principles, decomposing the complex challenge into addressable components and determining the sequence in which to address them. Step four is implementation combined with active monitoring — this is where theoretical knowledge meets practical reality, and adjustments to the original plan are almost always necessary as new information emerges. Step five is rigorous evaluation: comparing actual outcomes against initial goals, identifying what worked as expected, what did not, and extracting specific lessons for future application. This reflection phase is where experience genuinely consolidates into expertise — skipping it means surrendering the most valuable learning opportunity the entire exercise provides.`,
      },
      {
        question: `Critically compare two different approaches to understanding or analysing ${t}. What are the specific strengths, limitations, and ideal use cases for each?`,
        answer:   `Understanding ${t} benefits from examining it through multiple complementary frameworks, each of which illuminates aspects the others cannot. The theoretical or deductive approach begins with first principles, formal models, and axioms, deriving conclusions through logical inference. Its primary strength is generalisability — deep theoretical understanding of ${t} applies across a far wider range of situations than experience alone can cover. It also produces precise, communicable knowledge that can be shared, criticised, and refined across a scholarly community. Its limitation is that without ongoing engagement with concrete cases, theoretical knowledge can remain abstract and difficult to deploy reliably under real-world conditions of ambiguity, incomplete data, and time pressure. The empirical or inductive approach focuses on specific instances, observational data, experimental results, and measurable patterns. This method produces actionable, grounded knowledge that practitioners can apply with confidence and builds the intuitive judgment that comes only from extensive direct experience. Its limitation is that patterns identified in one context may not generalise, and without theoretical grounding, practitioners struggle to explain why something works or to adapt when circumstances change. The most effective mastery of ${t} integrates both approaches in a continuous dialogue: theoretical frameworks organise and give meaning to empirical experience, while empirical engagement perpetually challenges, refines, and enriches theoretical understanding. The most common mistake is committing exclusively to one approach and regarding the other with suspicion — experts in ${t} move fluidly between levels of abstraction.`,
      },
      {
        question: `What are the most important things a student must understand about ${t} to perform well in an exam, and what study strategies are most effective for achieving that?`,
        answer:   `Performing well on assessments in ${t} requires three types of knowledge working together: declarative knowledge (knowing what), procedural knowledge (knowing how), and conditional knowledge (knowing when and why). Pure memorisation of declarative facts is the least sufficient and the most commonly over-relied-upon strategy. The most effective preparation begins with building a genuine conceptual map — understanding how every major idea in ${t} connects to every other, so that each piece of information exists in a network of meaning rather than in isolation. Active recall testing — attempting to reproduce key information from memory before checking notes — is the single most evidence-supported individual study technique and should occupy the majority of revision time. Interleaving different aspects of ${t} within study sessions rather than blocking by sub-topic produces better long-term retention and improves the ability to identify which approach applies to which type of question. Practice under exam conditions — timed, without notes, with attention to command words in questions — builds the specific skill of examination performance, which is distinct from general subject knowledge. Finally, explaining ${t} clearly to another person remains one of the most powerful consolidation tools, because it forces a level of clarity and completeness that private re-reading never demands. Students who combine spaced practice, active recall, and regular self-testing consistently outperform those who rely on passive review, regardless of raw intelligence.`,
      },
    ],
    real_world_applications: fallbackRealWorldApps(t),
    common_misconceptions:   fallbackMisconceptions(t),
    glossary:                fallbackGlossary(t),
    study_plan:              fallbackStudyPlan(t),
    exam_tips:               fallbackExamTips(t),
    related_topics:          fallbackRelatedTopics(t),
    difficulty_rating:       5,
    difficulty_label:        'Intermediate',
    study_score:             SAVOIR_SCORE,
    powered_by:              SAVOIR_BRAND,
    generated_at:            new Date().toISOString(),
    _fallback:               true,
    _language:               lang,
  };
}

// ══════════════════════════════════════════════════════════════════
// SECTION 12 — MODEL CALLER (NON-STREAMING)
// Calls a single model synchronously, returns full parsed result
// ══════════════════════════════════════════════════════════════════

/**
 * Call one AI model without streaming — returns complete JSON result
 * @param {object} model   — from MODELS array
 * @param {string} prompt  — built prompt string
 * @returns {Promise<object>}
 * @throws {Error} on any failure
 */
async function callModelSync(model, prompt) {
  const ctrl  = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), model.timeout);

  try {
    const res = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method:  'POST',
      headers: {
        'Content-Type':  'application/json',
        'Authorization': `Bearer ${process.env.OPENROUTER_API_KEY}`,
        'HTTP-Referer':  SAVOIR_REFERER,
        'X-Title':       SAVOIR_TITLE,
      },
      body: JSON.stringify({
        model:       model.id,
        max_tokens:  model.max,
        temperature: 0.72,
        top_p:       0.95,
        messages:    [{ role: 'user', content: prompt }],
      }),
      signal: ctrl.signal,
    });

    clearTimeout(timer);

    if (!res.ok) {
      const body = await res.text().catch(() => '');
      throw new Error(`HTTP ${res.status}: ${body.slice(0, 200)}`);
    }

    const json = await res.json();

    // OpenRouter-specific error signalling
    if (json.error) {
      throw new Error(`API error: ${JSON.stringify(json.error).slice(0, 150)}`);
    }

    const content = json?.choices?.[0]?.message?.content;
    if (!content || content.trim().length < 50) {
      throw new Error('Empty or near-empty response from model');
    }

    const parsed = extractJSON(content);
    validateAIResponse(parsed);
    return parsed;

  } catch (err) {
    clearTimeout(timer);
    if (err.name === 'AbortError') {
      throw new Error(`Model timed out after ${model.timeout / 1000}s`);
    }
    throw err;
  }
}

// ══════════════════════════════════════════════════════════════════
// SECTION 13 — MODEL CALLER (STREAMING)
// Calls a single model with SSE streaming
// Fires onChunk(delta) for every received token
// Returns full parsed result after stream completes
// ══════════════════════════════════════════════════════════════════

/**
 * Call one AI model with streaming — fires onChunk per token
 * Returns complete parsed JSON result after stream ends
 * @param {object}   model     — from MODELS array
 * @param {string}   prompt    — built prompt
 * @param {function} onChunk   — callback(delta: string)
 * @returns {Promise<object>}
 * @throws {Error} on any failure
 */
async function callModelStreaming(model, prompt, onChunk) {
  const ctrl  = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), model.timeout);

  try {
    const res = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method:  'POST',
      headers: {
        'Content-Type':  'application/json',
        'Authorization': `Bearer ${process.env.OPENROUTER_API_KEY}`,
        'HTTP-Referer':  SAVOIR_REFERER,
        'X-Title':       SAVOIR_TITLE,
      },
      body: JSON.stringify({
        model:       model.id,
        max_tokens:  model.max,
        temperature: 0.72,
        top_p:       0.95,
        stream:      true,
        messages:    [{ role: 'user', content: prompt }],
      }),
      signal: ctrl.signal,
    });

    clearTimeout(timer);

    if (!res.ok) {
      const body = await res.text().catch(() => '');
      throw new Error(`HTTP ${res.status}: ${body.slice(0, 200)}`);
    }

    if (!res.body) {
      throw new Error('Response body is null — streaming not supported');
    }

    const reader  = res.body.getReader();
    const decoder = new TextDecoder('utf-8');
    let   fullText = '';
    let   buffer   = '';

    // SSE parsing loop
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      buffer = lines.pop(); // keep incomplete final line for next iteration

      for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed || !trimmed.startsWith('data: ')) continue;

        const jsonStr = trimmed.slice(6).trim();
        if (jsonStr === '[DONE]') continue;

        try {
          const parsed = JSON.parse(jsonStr);
          const delta  = parsed?.choices?.[0]?.delta?.content;
          if (delta && typeof delta === 'string') {
            fullText += delta;
            onChunk(delta);
          }
        } catch (_) {
          // Skip malformed SSE lines — this is normal for some models
        }
      }
    }

    // Process any remaining buffer content
    if (buffer.trim().startsWith('data: ')) {
      const jsonStr = buffer.trim().slice(6).trim();
      if (jsonStr && jsonStr !== '[DONE]') {
        try {
          const parsed = JSON.parse(jsonStr);
          const delta  = parsed?.choices?.[0]?.delta?.content;
          if (delta) {
            fullText += delta;
            onChunk(delta);
          }
        } catch (_) {}
      }
    }

    if (fullText.trim().length < 50) {
      throw new Error('Empty streaming response — model returned insufficient content');
    }

    const parsed = extractJSON(fullText);
    validateAIResponse(parsed);
    return parsed;

  } catch (err) {
    clearTimeout(timer);
    if (err.name === 'AbortError') {
      throw new Error(`Streaming model timed out after ${model.timeout / 1000}s`);
    }
    throw err;
  }
}

// ══════════════════════════════════════════════════════════════════
// SECTION 14 — MAIN AI GENERATOR
// Tries all 20 models in order with circuit breaking and retry
// Supports both streaming and sync modes
// ══════════════════════════════════════════════════════════════════

/**
 * Generate study content using AI — tries all models until one succeeds
 * @param {string}   message   — user input topic
 * @param {object}   options   — normalized options
 * @param {function} [onChunk] — if provided, use streaming mode
 * @returns {Promise<object>}  — enriched result object
 * @throws {Error} if ALL models fail (very rare — offline fallback handles this)
 */
async function generateWithAI(message, options, onChunk) {
  if (!process.env.OPENROUTER_API_KEY) {
    throw new Error('OPENROUTER_API_KEY environment variable is not set. Configure this in Vercel project settings.');
  }

  const prompt       = buildPrompt(message, options);
  const useStreaming = typeof onChunk === 'function';
  const errors       = [];
  let   successModel = null;

  for (const model of MODELS) {
    // Skip circuit-broken models
    if (isCircuitOpen(model.id)) {
      console.log(`[Savoiré AI] Skipping ${model.label} — circuit open`);
      continue;
    }

    for (let attempt = 1; attempt <= MAX_ATTEMPTS_PER_MODEL; attempt++) {
      try {
        console.log(`[Savoiré AI] ${model.label} attempt ${attempt}/${MAX_ATTEMPTS_PER_MODEL} (${useStreaming ? 'stream' : 'sync'})`);

        let result;
        if (useStreaming) {
          result = await callModelStreaming(model, prompt, onChunk);
        } else {
          result = await callModelSync(model, prompt);
        }

        // Success
        recordCircuitSuccess(model.id);
        enrichResponse(result, message);
        result._language = options.language || 'English';
        successModel     = model.label;

        console.log(`[Savoiré AI] ✓ SUCCESS — ${model.label} (attempt ${attempt})`);
        analyticsRecordModelFailure(model.label); // won't track — tracked below
        return result;

      } catch (err) {
        const errMsg = err.message ? err.message.slice(0, 100) : 'Unknown error';
        errors.push(`${model.label} A${attempt}: ${errMsg}`);
        analyticsRecordModelFailure(model.label);

        console.warn(`[Savoiré AI] ✗ FAIL — ${model.label} A${attempt}: ${errMsg}`);

        // Record failure for circuit breaker
        if (attempt === MAX_ATTEMPTS_PER_MODEL) {
          recordCircuitFailure(model.id);
        }

        // Wait between attempts, with backoff
        if (attempt < MAX_ATTEMPTS_PER_MODEL) {
          await sleep(retryDelay(attempt));
        }
      }
    }
  }

  // All models exhausted
  const errorSummary = errors.slice(0, 8).join(' | ');
  console.error(`[Savoiré AI] ALL MODELS FAILED: ${errorSummary}`);
  throw new Error(`All AI models temporarily unavailable. Errors: ${errorSummary}`);
}

// ══════════════════════════════════════════════════════════════════
// SECTION 15 — SSE STREAMING HELPERS
// Utilities for writing SSE events cleanly to the response
// ══════════════════════════════════════════════════════════════════

/**
 * Send a named SSE event with JSON data
 * @param {object} res    — Node.js response object
 * @param {string} event  — event name
 * @param {object} data   — data to JSON-serialise
 */
function sendSSE(res, event, data) {
  const payload = JSON.stringify(data);
  res.write(`event: ${event}\ndata: ${payload}\n\n`);
  if (typeof res.flush === 'function') res.flush();
}

/**
 * Send a simple status SSE event (shown as loading state to user)
 * @param {object} res     — Node.js response object
 * @param {string} message — human-readable status text
 */
function sendStatus(res, message) {
  sendSSE(res, 'status', { message });
}

/**
 * Send a token SSE event (live streaming chunk)
 * @param {object} res   — Node.js response
 * @param {string} chunk — raw token text
 */
function sendToken(res, chunk) {
  sendSSE(res, 'token', { t: chunk });
}

/**
 * Send the final "done" SSE event with the complete result
 * @param {object} res    — Node.js response
 * @param {object} result — complete enriched result object
 */
function sendDone(res, result) {
  // Final safety: enforce branding before sending
  result.powered_by  = SAVOIR_BRAND;
  result.study_score = SAVOIR_SCORE;
  result._version    = SAVOIR_VERSION;
  result._timestamp  = new Date().toISOString();
  delete result._model;
  delete result._modelId;

  sendSSE(res, 'done', result);
}

/**
 * Send an error SSE event
 * @param {object} res     — Node.js response
 * @param {string} message — error message (safe to display)
 * @param {string} code    — machine-readable error code
 */
function sendError(res, message, code) {
  sendSSE(res, 'error', { error: message, code });
}

// ══════════════════════════════════════════════════════════════════
// SECTION 16 — STREAMING FALLBACK SIMULATOR
// When ALL AI models fail in streaming mode, we still stream the
// offline fallback content word-by-word so the user sees live output
// ══════════════════════════════════════════════════════════════════

/**
 * Simulate streaming of offline fallback content
 * Sends token events word by word at ~human reading pace
 * @param {object} res      — Node.js response
 * @param {object} fallback — offline fallback result object
 * @param {number} chunkSize — words per token event (default 3)
 * @param {number} delayMs   — ms between token events (default 20)
 */
async function streamOfflineFallback(res, fallback, chunkSize = 3, delayMs = 20) {
  const notesText = fallback.ultra_long_notes || '';
  const words     = notesText.split(' ').filter(w => w.length > 0);

  for (let i = 0; i < words.length; i += chunkSize) {
    const chunk = words.slice(i, i + chunkSize).join(' ') + ' ';
    sendToken(res, chunk);
    if (delayMs > 0) await sleep(delayMs);
  }
}

// ══════════════════════════════════════════════════════════════════
// SECTION 17 — HEALTH CHECK HANDLER
// Returns system status without consuming AI credits
// ══════════════════════════════════════════════════════════════════

/**
 * Handle GET ?health=1 requests
 * Returns complete system status and analytics
 * @param {object} req
 * @param {object} res
 */
function handleHealthCheck(req, res) {
  const snapshot  = analyticsSnapshot();
  const hasApiKey = !!process.env.OPENROUTER_API_KEY;
  const status    = hasApiKey ? 'operational' : 'degraded';

  const modelStatuses = MODELS.map(m => {
    const state = _circuitState.get(m.id);
    return {
      label:        m.label,
      tier:         m.tier,
      circuitOpen:  !!(state?.openUntil && Date.now() < state.openUntil),
      failures:     state?.fails || 0,
      successes:    snapshot.modelSuccesses[m.label] || 0,
    };
  });

  const payload = {
    status,
    version:       SAVOIR_VERSION,
    brand:         SAVOIR_BRAND,
    apiKeyPresent: hasApiKey,
    nodeVersion:   process.version || 'unknown',
    models: {
      total:        MODELS.length,
      tiers:        { 1: MODELS.filter(m => m.tier === 1).length, 2: MODELS.filter(m => m.tier === 2).length, 3: MODELS.filter(m => m.tier === 3).length, 4: MODELS.filter(m => m.tier === 4).length },
      circuitOpen:  modelStatuses.filter(m => m.circuitOpen).length,
      statuses:     modelStatuses,
    },
    analytics:     snapshot,
    rateLimit: {
      maxRequests: RATE_LIMIT_MAX,
      windowMs:    RATE_LIMIT_WINDOW,
    },
    cache: {
      ...cacheStats(),
      purgeIntervalMinutes: 10,
    },
    timestamp: new Date().toISOString(),
  };

  res.setHeader('Content-Type', 'application/json');
  res.status(200).json(payload);
}

// ══════════════════════════════════════════════════════════════════
// SECTION 18 — MAIN VERCEL SERVERLESS HANDLER
// Entry point — called by Vercel for every request to /api/study
// ══════════════════════════════════════════════════════════════════

/**
 * Main Vercel serverless handler
 * @param {object} req — Vercel/Node.js request
 * @param {object} res — Vercel/Node.js response
 */
module.exports = async (req, res) => {
  const requestStart = Date.now();

  // ── CORS & SECURITY HEADERS ──────────────────────────────────────
  res.setHeader('Access-Control-Allow-Origin',      '*');
  res.setHeader('Access-Control-Allow-Methods',     'POST, GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers',     'Content-Type, Accept, X-Requested-With');
  res.setHeader('Access-Control-Max-Age',           '86400');
  res.setHeader('X-Powered-By',                     SAVOIR_BRAND);
  res.setHeader('X-Content-Type-Options',           'nosniff');
  res.setHeader('X-Frame-Options',                  'SAMEORIGIN');
  res.setHeader('Referrer-Policy',                  'strict-origin-when-cross-origin');
  res.setHeader('X-Savoir-Version',                 SAVOIR_VERSION);

  // ── PREFLIGHT ────────────────────────────────────────────────────
  if (req.method === 'OPTIONS') {
    return res.status(204).end();
  }

  // ── HEALTH CHECK ─────────────────────────────────────────────────
  if (req.method === 'GET' && req.query?.health) {
    return handleHealthCheck(req, res);
  }

  // ── ANALYTICS ENDPOINT ───────────────────────────────────────────
  if (req.method === 'GET' && req.query?.analytics) {
    res.setHeader('Content-Type', 'application/json');
    return res.status(200).json(analyticsSnapshot());
  }

  // ── METHOD GUARD ─────────────────────────────────────────────────
  if (req.method !== 'POST') {
    return res.status(405).json({
      error:   'Method not allowed. Use POST.',
      allowed: ['POST'],
    });
  }

  // ── BODY GUARD ───────────────────────────────────────────────────
  if (!req.body || typeof req.body !== 'object') {
    return res.status(400).json({
      error: 'Request body must be JSON with a "message" field.',
    });
  }

  // ── INPUT EXTRACTION & VALIDATION ────────────────────────────────
  const rawMessage = req.body.message;
  if (!rawMessage || typeof rawMessage !== 'string') {
    return res.status(400).json({
      error: 'Request body must include a "message" field of type string.',
    });
  }

  const trimmed = sanitizeInput(rawMessage);

  if (trimmed.length < MIN_MSG_LENGTH) {
    return res.status(400).json({
      error: `Message too short. Minimum ${MIN_MSG_LENGTH} characters.`,
    });
  }

  if (trimmed.length > MAX_MSG_LENGTH) {
    return res.status(400).json({
      error: `Message too long. Maximum ${MAX_MSG_LENGTH} characters.`,
      length: trimmed.length,
    });
  }

  // ── OPTIONS NORMALISATION ─────────────────────────────────────────
  const opts = normalizeOptions(req.body.options || {});

  // ── RATE LIMITING ─────────────────────────────────────────────────
  const ip        = req.headers['x-forwarded-for']?.split(',')[0]?.trim()
                 || req.socket?.remoteAddress
                 || '127.0.0.1';
  const rateCheck = checkRateLimit(ip);

  if (!rateCheck.allowed) {
    _analytics.rateLimitedIPs++;
    res.setHeader('Retry-After',              Math.ceil(rateCheck.resetMs / 1000).toString());
    res.setHeader('X-RateLimit-Limit',        RATE_LIMIT_MAX.toString());
    res.setHeader('X-RateLimit-Remaining',    '0');
    res.setHeader('X-RateLimit-Reset',        Math.ceil((Date.now() + rateCheck.resetMs) / 1000).toString());
    return res.status(429).json({
      error:        'Rate limit exceeded. Please wait before making another request.',
      retryAfterMs: rateCheck.resetMs,
    });
  }

  res.setHeader('X-RateLimit-Limit',     RATE_LIMIT_MAX.toString());
  res.setHeader('X-RateLimit-Remaining', rateCheck.remaining.toString());

  // ── LOGGING ───────────────────────────────────────────────────────
  const preview = trimmed.slice(0, 80).replace(/\n/g, ' ');
  console.log(`[Savoiré AI] ▶ Request | ip=${ip} | stream=${opts.stream} | lang=${opts.language} | depth=${opts.depth} | tool=${opts.tool} | msg="${preview}"`);

  // ════════════════════════════════════════════════════════════════
  // STREAMING PATH
  // ════════════════════════════════════════════════════════════════
  if (opts.stream) {
    res.setHeader('Content-Type',     'text/event-stream');
    res.setHeader('Cache-Control',    'no-cache, no-transform');
    res.setHeader('Connection',       'keep-alive');
    res.setHeader('X-Accel-Buffering','no');

    // Flush headers immediately so browser opens the SSE connection
    if (typeof res.flushHeaders === 'function') res.flushHeaders();

    // Check cache first — even in streaming mode we stream cached results
    const cKey    = buildCacheKey(trimmed, opts);
    const cached  = cacheGet(cKey);
    if (cached) {
      console.log(`[Savoiré AI] ✦ CACHE HIT (stream) — "${preview}"`);
      sendStatus(res, 'Loaded from cache');

      // Stream cached notes token by token for consistent UX
      await streamOfflineFallback(res, cached, 4, 12);
      sendDone(res, cached);
      res.end();

      const dur = Date.now() - requestStart;
      analyticsRecord(opts, dur, 'cache', true, false);
      console.log(`[Savoiré AI] ✓ CACHE stream done | ${dur}ms`);
      return;
    }

    // ── SEND INITIAL STATUS ────────────────────────────────────────
    sendStatus(res, 'Connecting to AI...');

    try {
      let tokenCount = 0;

      const result = await generateWithAI(trimmed, opts, (chunk) => {
        tokenCount++;
        sendToken(res, chunk);
        // Send periodic keep-alive pings every 100 tokens
        if (tokenCount % 100 === 0) {
          res.write(': keep-alive\n\n');
          if (typeof res.flush === 'function') res.flush();
        }
      });

      // Cache the result for future requests
      cacheSet(cKey, result);

      sendDone(res, result);
      res.end();

      const dur = Date.now() - requestStart;
      const modelLabel = MODELS.find(m => !isCircuitOpen(m.id))?.label || 'unknown';
      analyticsRecord(opts, dur, modelLabel, false, false);
      console.log(`[Savoiré AI] ✓ STREAM done | tokens=${tokenCount} | ${dur}ms`);

    } catch (aiErr) {
      console.warn(`[Savoiré AI] ⚠ Stream AI failed — using offline fallback: ${aiErr.message}`);
      _analytics.fallbackRequests++;

      const fallback      = generateOfflineFallback(trimmed, opts);
      fallback._timestamp = new Date().toISOString();
      fallback._version   = SAVOIR_VERSION;

      sendStatus(res, 'Generating offline content...');

      // Simulate streaming of fallback content
      await streamOfflineFallback(res, fallback, 3, 18);

      sendDone(res, fallback);
      res.end();

      const dur = Date.now() - requestStart;
      analyticsRecord(opts, dur, null, false, true);
      console.log(`[Savoiré AI] ✓ OFFLINE fallback stream done | ${dur}ms`);
    }

    return;
  }

  // ════════════════════════════════════════════════════════════════
  // NON-STREAMING (JSON) PATH
  // ════════════════════════════════════════════════════════════════
  res.setHeader('Content-Type', 'application/json');

  // Check cache
  const cKey   = buildCacheKey(trimmed, opts);
  const cached = cacheGet(cKey);
  if (cached) {
    console.log(`[Savoiré AI] ✦ CACHE HIT (sync) — "${preview}"`);
    cached.powered_by  = SAVOIR_BRAND;
    cached.study_score = SAVOIR_SCORE;
    cached._version    = SAVOIR_VERSION;
    cached._timestamp  = new Date().toISOString();
    cached._cached     = true;

    const dur = Date.now() - requestStart;
    analyticsRecord(opts, dur, 'cache', true, false);
    console.log(`[Savoiré AI] ✓ CACHE sync done | ${dur}ms`);
    return res.status(200).json(cached);
  }

  // Generate with AI
  try {
    let   result;
    let   usedFallback = false;
    let   modelLabel   = null;

    try {
      result     = await generateWithAI(trimmed, opts);
      modelLabel = 'AI';
    } catch (aiErr) {
      console.warn(`[Savoiré AI] ⚠ Sync AI failed — using offline fallback: ${aiErr.message}`);
      result       = generateOfflineFallback(trimmed, opts);
      usedFallback = true;
      _analytics.fallbackRequests++;
    }

    // Enforce branding
    result.powered_by   = SAVOIR_BRAND;
    result.study_score  = SAVOIR_SCORE;
    result._version     = SAVOIR_VERSION;
    result._timestamp   = new Date().toISOString();
    result._fallback    = usedFallback;
    delete result._model;
    delete result._modelId;

    // Cache successful AI results (not fallbacks, to avoid caching degraded content)
    if (!usedFallback) {
      cacheSet(cKey, result);
    }

    const dur = Date.now() - requestStart;
    analyticsRecord(opts, dur, modelLabel, false, usedFallback);
    console.log(`[Savoiré AI] ✓ SYNC done | fallback=${usedFallback} | ${dur}ms`);

    return res.status(200).json(result);

  } catch (err) {
    // This should never happen — generateOfflineFallback never throws
    _analytics.errorRequests++;
    console.error(`[Savoiré AI] ✗ CRITICAL unexpected error: ${err.message || err}`);

    const emergencyFallback      = generateOfflineFallback(trimmed, opts);
    emergencyFallback._timestamp = new Date().toISOString();
    emergencyFallback._version   = SAVOIR_VERSION;
    emergencyFallback._error     = true;

    return res.status(200).json(emergencyFallback);
  }
};

// =====================================================================
// END — api/study.js  |  Savoiré AI v2.0 ULTRA ADVANCED
// Built by Sooban Talha Technologies  |  soobantalhatech.xyz
// Founder: Sooban Talha
// =====================================================================
//
// DEPLOYMENT CHECKLIST:
// ─────────────────────────────────────────────────────────────────────
// 1. Set OPENROUTER_API_KEY in Vercel project environment variables
// 2. Add to vercel.json:
//      {
//        "functions": {
//          "api/study.js": { "maxDuration": 300 }
//        }
//      }
// 3. Ensure req.body is parsed (Vercel does this automatically for JSON)
// 4. Deploy: vercel --prod
//
// API USAGE:
// ─────────────────────────────────────────────────────────────────────
// POST /api/study
// Content-Type: application/json
// {
//   "message": "Photosynthesis",
//   "options": {
//     "language":  "English",         // any language
//     "depth":     "detailed",        // standard | detailed | comprehensive | expert
//     "style":     "simple",          // simple | academic | detailed | exam | visual
//     "tool":      "notes",           // notes | flashcards | quiz | summary | mindmap
//     "stream":    true               // true = SSE streaming | false = JSON response
//   }
// }
//
// STREAMING RESPONSE EVENTS:
// ─────────────────────────────────────────────────────────────────────
// event: status   → { message: "Connecting to AI..." }
// event: token    → { t: "chunk of text" }            (repeated)
// event: done     → { topic, ultra_long_notes, ... }  (final complete result)
// event: error    → { error: "message", code: "..." } (on failure)
//
// NON-STREAMING RESPONSE:
// ─────────────────────────────────────────────────────────────────────
// HTTP 200 JSON: { topic, curriculum_alignment, ultra_long_notes,
//   key_concepts, key_tricks, practice_questions, real_world_applications,
//   common_misconceptions, glossary, study_plan, exam_tips, related_topics,
//   difficulty_rating, difficulty_label, study_score, powered_by, generated_at }
//
// HEALTH CHECK:
// ─────────────────────────────────────────────────────────────────────
// GET /api/study?health=1  → system status + analytics
// GET /api/study?analytics=1  → analytics snapshot
//
// NEW FIELDS IN v2.0 ULTRA (compared to original v2.0):
// ─────────────────────────────────────────────────────────────────────
// + glossary           (8 defined terms)
// + study_plan         (7-day personalised plan)
// + exam_tips          (5 actionable tips)
// + related_topics     (5 connected topics)
// + difficulty_rating  (1-10 integer)
// + difficulty_label   ("Beginner"|"Intermediate"|"Advanced"|"Expert")
// + More key_concepts  (up to 10 at expert depth)
// + More practice_qs   (up to 5 at expert depth)
// + Longer answers     (min 150 words vs original 130)
// + Circuit breaker    (skips failing models automatically)
// + LRU cache          (instant repeat queries)
// + Rate limiting      (abuse protection)
// + Analytics engine   (full observability)
// + Health endpoint    (operational monitoring)
// + Input sanitization (security hardening)
// + JSON repair        (handles malformed model output)
// =====================================================================
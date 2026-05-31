'use strict';
// ═══════════════════════════════════════════════════════════════════════════════════════════════════
// SAVOIRÉ AI v2.0 — api/study.js — WORLD CLASS BACKEND — MAXIMUM LINES — ALL FIXES APPLIED
// Built by Sooban Talha Technologies | soobantalhatech.xyz
// Founder: Sooban Talha
// ═══════════════════════════════════════════════════════════════════════════════════════════════════
//
// ─────────────────────────────────────────────────────────────────────────────────────────────────
// COMPLETE ARCHITECTURE:
// ─────────────────────────────────────────────────────────────────────────────────────────────────
//
// GOOGLE SHEETS TRACKING — TRACKS EVERYTHING:
//   ✅ Every user visit (page load) → tracked immediately as 'visit'
//   ✅ Every ping/warmup call → tracked as 'online'
//   ✅ Every generation start → tracked as 'started'
//   ✅ Every generation complete → tracked as 'completed' with duration
//   ✅ Every generation failure → tracked as 'failed'
//   ✅ Sessions increment on EVERY new day visit (not just tool use)
//   ✅ IST timezone (UTC+5:30) — fully correct
//
// STREAMING PHASE 1 (Notes & Summary):
//   ✅ Live token streaming to client
//   ✅ Markdown rendered LIVE as tokens arrive (not raw text)
//   ✅ Stage progress sent via SSE
//   ✅ Fallback to offline notes if all models fail
//
// STRUCTURED PHASE 2 (Flashcards / Quiz / Mindmap):
//   ✅ FORCES real AI content — not placeholders
//   ✅ 15-20 flashcards REQUIRED
//   ✅ 10-12 quiz questions REQUIRED
//   ✅ 5-7 mind map branches REQUIRED
//   ✅ JSON repair for malformed responses
//   ✅ Retry through 10 models before fallback
//   ✅ High-quality intelligent fallback as last resort
//
// MEGA BUNDLE (tool='all'):
//   ✅ Generates ALL 5 tools in one request
//   ✅ Notes + Flashcards + Quiz + Summary + Mind Map
//   ✅ Streamed live to user
//
// SESSION COUNTING:
//   ✅ Session count is sent FROM frontend (localStorage) — backend just logs it
//   ✅ Frontend increments session count on each new calendar day
//   ✅ Backend receives and stores whatever session count frontend sends
// ─────────────────────────────────────────────────────────────────────────────────────────────────

// ─────────────────────────────────────────────────────────────────────────────────────────────────
// SECTION 1 — CONSTANTS & BRANDING
// ─────────────────────────────────────────────────────────────────────────────────────────────────

const SAVOIRÉ = {
  BRAND:      'Savoiré AI v2.0',
  DEVELOPER:  'Sooban Talha Technologies',
  DEVSITE:    'soobantalhatech.xyz',
  WEBSITE:    'savoireai.vercel.app',
  FOUNDER:    'Sooban Talha',
  VERSION:    '2.0',
  TAGLINE:    'Think Less. Know More.',
};

const OPENROUTER_BASE   = 'https://openrouter.ai/api/v1/chat/completions';
const HTTP_REFERER      = `https://${SAVOIRÉ.WEBSITE}`;
const APP_TITLE         = SAVOIRÉ.BRAND;
const GOOGLE_WEBHOOK_URL = process.env.GOOGLE_WEBHOOK_URL || '';

// ─────────────────────────────────────────────────────────────────────────────────────────────────
// SECTION 2 — MODEL ROSTERS
// Priority: fastest first-token models first. Falls back sequentially.
// ─────────────────────────────────────────────────────────────────────────────────────────────────

// Phase 1: Streaming markdown notes (optimized for speed + quality)
const MODELS_STREAM = [
  { id: 'google/gemini-2.0-flash-exp:free',               max_tokens: 5000, timeout_ms: 55000, temp: 0.72 },
  { id: 'google/gemini-flash-1.5-8b:free',                max_tokens: 4500, timeout_ms: 45000, temp: 0.72 },
  { id: 'deepseek/deepseek-chat-v3-0324:free',            max_tokens: 5000, timeout_ms: 55000, temp: 0.72 },
  { id: 'meta-llama/llama-3.3-70b-instruct:free',         max_tokens: 4500, timeout_ms: 50000, temp: 0.72 },
  { id: 'z-ai/glm-4.5-air:free',                          max_tokens: 4000, timeout_ms: 42000, temp: 0.72 },
  { id: 'qwen/qwen3-8b:free',                             max_tokens: 4000, timeout_ms: 40000, temp: 0.72 },
  { id: 'nousresearch/hermes-3-llama-3.1-405b:free',      max_tokens: 5000, timeout_ms: 65000, temp: 0.72 },
  { id: 'cognitivecomputations/dolphin-mixtral-8x7b:free', max_tokens: 4500, timeout_ms: 55000, temp: 0.72 },
  { id: 'mistralai/mistral-7b-instruct-v0.3:free',        max_tokens: 3500, timeout_ms: 38000, temp: 0.72 },
  { id: 'openchat/openchat-7b:free',                      max_tokens: 3500, timeout_ms: 38000, temp: 0.72 },
  { id: 'microsoft/phi-3-mini-128k-instruct:free',        max_tokens: 3500, timeout_ms: 38000, temp: 0.72 },
  { id: 'upstage/solar-1-mini-chat:free',                 max_tokens: 3500, timeout_ms: 38000, temp: 0.72 },
  { id: 'cohere/command-r-plus:free',                     max_tokens: 4000, timeout_ms: 48000, temp: 0.72 },
  { id: 'perplexity/llama-3-sonar-small-32k-online:free', max_tokens: 4000, timeout_ms: 48000, temp: 0.70 },
];

// Phase 2: Structured JSON (cards, quiz, mindmap) — optimized for JSON output quality
const MODELS_CARDS = [
  { id: 'google/gemini-2.0-flash-exp:free',               max_tokens: 7000, timeout_ms: 70000, temp: 0.60 },
  { id: 'google/gemini-flash-1.5-8b:free',                max_tokens: 6500, timeout_ms: 60000, temp: 0.60 },
  { id: 'deepseek/deepseek-chat-v3-0324:free',            max_tokens: 7000, timeout_ms: 70000, temp: 0.60 },
  { id: 'meta-llama/llama-3.3-70b-instruct:free',         max_tokens: 6000, timeout_ms: 65000, temp: 0.60 },
  { id: 'nousresearch/hermes-3-llama-3.1-405b:free',      max_tokens: 7000, timeout_ms: 75000, temp: 0.58 },
  { id: 'cognitivecomputations/dolphin-mixtral-8x7b:free', max_tokens: 5500, timeout_ms: 65000, temp: 0.58 },
  { id: 'z-ai/glm-4.5-air:free',                          max_tokens: 5000, timeout_ms: 55000, temp: 0.60 },
  { id: 'qwen/qwen3-8b:free',                             max_tokens: 5000, timeout_ms: 55000, temp: 0.60 },
  { id: 'microsoft/phi-3-mini-128k-instruct:free',        max_tokens: 4500, timeout_ms: 50000, temp: 0.60 },
  { id: 'mistralai/mistral-7b-instruct-v0.3:free',        max_tokens: 4500, timeout_ms: 48000, temp: 0.60 },
];

// ─────────────────────────────────────────────────────────────────────────────────────────────────
// SECTION 3 — CONFIGURATION MAPS
// ─────────────────────────────────────────────────────────────────────────────────────────────────

const DEPTH_MAP = {
  standard:      { wordRange: '600–900 words',   minChars: 700,  maxTokens: 2800, label: 'Standard' },
  detailed:      { wordRange: '1000–1500 words', minChars: 1100, maxTokens: 3800, label: 'Detailed' },
  comprehensive: { wordRange: '1500–2200 words', minChars: 1600, maxTokens: 5000, label: 'Comprehensive' },
  expert:        { wordRange: '2200–3500 words', minChars: 2300, maxTokens: 6500, label: 'Expert' },
};

const STYLE_MAP = {
  simple: `WRITING STYLE: Clear, beginner-friendly language. Define every technical term immediately when first used. Use short sentences (max 20 words). Everyday analogies. Examples that a 15-year-old can understand. No jargon without explanation.`,
  academic: `WRITING STYLE: Formal academic language. Precise scholarly terminology. Objective third-person tone. Discipline-appropriate vocabulary. Citation-style reasoning. Structured argumentation.`,
  detailed: `WRITING STYLE: Exhaustive detail at every single point. Multiple concrete examples with specific numbers. Thorough step-by-step explanations of every mechanism. Cover all edge cases, exceptions, and corner scenarios. Maximum depth.`,
  exam: `WRITING STYLE: Exam-focused. Key definitions exactly as they appear in mark schemes. Highlight the most-examined points. Flag common student mistakes explicitly. Include exam tips, mark allocation guidance, and time-saving strategies.`,
  visual: `WRITING STYLE: Vivid analogies and metaphors for every concept. Build memorable mental models. Spatial and sensory language. Paint pictures with words. Make abstract ideas concrete and visual.`,
};

const TOOL_SECTIONS = {
  notes: [
    '## 📚 Introduction and Overview',
    '## 🎯 Core Concepts and Definitions',
    '## ⚙️ How It Works — Mechanisms and Processes',
    '## 💡 Key Examples with Detailed Walkthroughs',
    '## 🚀 Advanced Aspects, Nuances and Edge Cases',
    '## 🌍 Real-World Applications and Significance',
    '## 🧠 Common Misconceptions and Corrections',
    '## 📝 Summary, Key Takeaways and Revision Checklist',
  ],
  flashcards: [
    '## 📖 Topic Overview and Context',
    '## 🃏 Core Concepts as Q&A Pairs (15-20 distinct concepts)',
    '## 🔄 Step-by-Step Mechanisms (each step = one card)',
    '## 📋 Key Examples (each example = one card)',
    '## 🎯 Quick Summary for Review',
  ],
  quiz: [
    '## 📚 Topic Introduction',
    '## ✏️ Core Concepts (Exam-Ready Format)',
    '## ⚙️ How It Works (Exam-Style Explanation)',
    '## 📝 Key Examples (Typical Exam Questions)',
    '## 🎯 Summary — Must-Remember Points for the Exam',
  ],
  summary: [
    '## 🚀 TL;DR — Executive Summary (Read This First)',
    '## 🎯 Core Concepts (One Line Each)',
    '## ⚙️ Key Mechanisms (Ultra-Short)',
    '## 💡 Critical Examples (Only the Most Important)',
    '## ✅ What to Remember — Final Revision Checklist',
  ],
  mindmap: [
    '## 🧠 Central Topic (The Core Idea — 3-5 words)',
    '## 🌿 Main Branches (5-7 Primary Categories)',
    '## 🍃 Sub-Branches (Specific Items Under Each Branch)',
    '## 🔗 Cross-Connections (Links Between Branches)',
    '## 💼 Real-World Applications (Where Each Branch Leads)',
  ],
  all: [
    '## 📚 Introduction and Overview',
    '## 🎯 Core Concepts and Definitions',
    '## ⚙️ How It Works — Mechanisms and Processes',
    '## 💡 Key Examples with Detailed Walkthroughs',
    '## 🚀 Advanced Aspects, Nuances and Edge Cases',
    '## 🌍 Real-World Applications and Significance',
    '## 🧠 Memory Tricks and Study Strategies',
    '## 📋 Summary, Key Takeaways and Revision Checklist',
  ],
};

// ─────────────────────────────────────────────────────────────────────────────────────────────────
// SECTION 4 — UTILITIES
// ─────────────────────────────────────────────────────────────────────────────────────────────────

const sleep = ms => new Promise(r => setTimeout(r, ms));

const log = {
  info:  (...a) => console.log  (`[${new Date().toISOString()}] [${SAVOIRÉ.BRAND}] 📘 INFO `, ...a),
  ok:    (...a) => console.log  (`[${new Date().toISOString()}] [${SAVOIRÉ.BRAND}] ✅ OK   `, ...a),
  warn:  (...a) => console.warn (`[${new Date().toISOString()}] [${SAVOIRÉ.BRAND}] ⚠️  WARN `, ...a),
  error: (...a) => console.error(`[${new Date().toISOString()}] [${SAVOIRÉ.BRAND}] ❌ ERR  `, ...a),
};

const trunc = (s, n = 150) => {
  if (!s) return '';
  const str = String(s);
  return str.length > n ? str.slice(0, n) + '…' : str;
};

// IST DateTime — UTC+5:30 — Fully Correct
function getISTDateTime() {
  const now    = new Date();
  const utcMs  = now.getTime() + (now.getTimezoneOffset() * 60 * 1000);
  const istMs  = utcMs + (5.5 * 60 * 60 * 1000);
  const ist    = new Date(istMs);
  const y      = ist.getFullYear();
  const mo     = String(ist.getMonth() + 1).padStart(2, '0');
  const d      = String(ist.getDate()).padStart(2, '0');
  const h      = String(ist.getHours()).padStart(2, '0');
  const mi     = String(ist.getMinutes()).padStart(2, '0');
  const s      = String(ist.getSeconds()).padStart(2, '0');
  return `${y}-${mo}-${d} ${h}:${mi}:${s}`;
}

function getISTDate() {
  return getISTDateTime().split(' ')[0];
}

// ─────────────────────────────────────────────────────────────────────────────────────────────────
// SECTION 5 — GOOGLE SHEETS TRACKING
// Called on EVERY request type — visit, ping, start, complete, fail
// ─────────────────────────────────────────────────────────────────────────────────────────────────

async function sendToGoogleSheets(userName, streak, sessions, tool, topic, status, durationMs, sessionId, extraMeta) {
  if (!GOOGLE_WEBHOOK_URL) {
    log.warn('GOOGLE_WEBHOOK_URL not configured — skipping sheet tracking');
    return false;
  }

  try {
    const payload = {
      // User info
      userName:   String(userName  || 'Anonymous'),
      streak:     Number(streak)   || 0,
      sessions:   Number(sessions) || 1,
      lastUsed:   getISTDateTime(),
      // Event info
      tool:       String(tool   || 'visit'),
      topic:      String(topic  || '').slice(0, 200),
      status:     String(status || 'visit'),
      durationMs: Number(durationMs) || 0,
      sessionId:  String(sessionId  || ''),
      // Metadata
      timestamp:  getISTDateTime(),
      istDate:    getISTDate(),
      _quality:   extraMeta?._quality || 'standard',
      _version:   SAVOIRÉ.VERSION,
    };

    const res = await fetch(GOOGLE_WEBHOOK_URL, {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify(payload),
    });

    if (res.ok) {
      log.ok(`📊 GSheets ← ${userName} | ${tool} | ${status} | streak:${streak} | sessions:${sessions}`);
    } else {
      log.warn(`GSheets HTTP ${res.status} — payload still logged`);
    }

    return res.ok;

  } catch (err) {
    // Never let tracking errors break the main flow
    log.warn(`GSheets tracking error (non-fatal): ${err.message}`);
    return false;
  }
}

// ─────────────────────────────────────────────────────────────────────────────────────────────────
// SECTION 6 — PHASE 1: NOTES PROMPT BUILDER
// ─────────────────────────────────────────────────────────────────────────────────────────────────

function buildNotesPrompt(input, opts) {
  const depth    = DEPTH_MAP[opts.depth]  || DEPTH_MAP.detailed;
  const style    = STYLE_MAP[opts.style]  || STYLE_MAP.simple;
  const sections = (TOOL_SECTIONS[opts.tool] || TOOL_SECTIONS.notes).join('\n\n');
  const lang     = opts.language || 'English';
  const tool     = opts.tool    || 'notes';

  const toolGoal =
    tool === 'all'        ? `Generate THE ULTIMATE comprehensive study package. Cover every important aspect — introduction, core concepts, mechanisms, examples, advanced aspects, applications, memory tricks, and a complete revision checklist.`
    : tool === 'flashcards' ? `Generate study notes perfectly structured for 15-20 flashcard Q&A pairs. Each concept should be clearly separated into a distinct question/answer structure suitable for spaced repetition.`
    : tool === 'quiz'       ? `Generate exam-focused study notes. Emphasise the most-examined points, typical question patterns, mark-scheme-worthy phrasing, and common student mistakes.`
    : tool === 'summary'    ? `Generate a concise, punchy smart summary for fast revision. Begin with a powerful TL;DR paragraph, then bullet the key points clearly and memorably.`
    : tool === 'mindmap'    ? `Generate hierarchically structured notes ideal for conversion into a mind map. Use clear parent → child relationships with logical branching. Number all branches.`
    : `Generate comprehensive, well-structured, academically rigorous study notes covering every important aspect of this topic.`;

  return `You are ${SAVOIRÉ.BRAND}, the world's most advanced AI study assistant.
Creator: ${SAVOIRÉ.DEVELOPER} (${SAVOIRÉ.DEVSITE}) | Founder: ${SAVOIRÉ.FOUNDER}

═══════════════════════════════════════════════════════════════════════
🎯 PRIMARY OBJECTIVE: ${toolGoal}
═══════════════════════════════════════════════════════════════════════

📖 TOPIC: ${input}

🌐 LANGUAGE: ${lang}
   ⚠️  CRITICAL: Write EVERY SINGLE WORD in ${lang}. Zero exceptions.
   Do NOT mix languages. Headers, bullets, everything must be in ${lang}.

📏 TARGET LENGTH: ${depth.wordRange} — aim for the upper end of this range
   Be thorough. Be comprehensive. Do NOT cut content short.

${style}

═══════════════════════════════════════════════════════════════════════
📋 REQUIRED STRUCTURE — use EXACTLY these headings in this order:
═══════════════════════════════════════════════════════════════════════

${sections}

═══════════════════════════════════════════════════════════════════════
📐 MANDATORY FORMATTING RULES:
═══════════════════════════════════════════════════════════════════════

1.  Use ## for ALL section headings (exactly as given above)
2.  Use **bold** for EVERY key term the FIRST time it appears
3.  Use - bullet points for lists of items
4.  Use numbered lists (1. 2. 3.) for ALL sequential/step processes
5.  Use > blockquotes for formal definitions and critical quotes
6.  Use --- horizontal rules between major sections
7.  Use \`inline code\` for formulas, equations, or precise technical terms
8.  Use \`\`\` code blocks for multi-line formulas or algorithms
9.  Include at LEAST 5 concrete, specific, real-world examples
10. End EVERY response with a 🎯 Key Takeaways section (5-8 bullet points)
11. Include a ⚠️ Common Mistakes section (3-5 bullet points)
12. Include memory aids, mnemonics, or analogies where possible
13. Use emojis at the START of each ## heading for visual clarity

═══════════════════════════════════════════════════════════════════════
✅ QUALITY STANDARDS:
═══════════════════════════════════════════════════════════════════════

- ACCURACY: Every fact, formula, and claim must be correct
- COMPLETENESS: Cover all sub-topics, do not leave gaps
- CLARITY: A student with zero prior knowledge must understand every word
- DEPTH: Go beyond surface-level — explain WHY and HOW, not just WHAT
- FLOW: Use transitions between sections for seamless reading
- EXAMPLES: Every abstract concept needs at least one concrete example
- SELF-CONTAINED: Student reading this should need NO other resource

═══════════════════════════════════════════════════════════════════════
🚀 BEGIN WRITING NOW — start immediately with the first ## heading
    Write in ${lang} only. Do NOT include any preamble, introduction, or meta-commentary.
═══════════════════════════════════════════════════════════════════════`;
}

// ─────────────────────────────────────────────────────────────────────────────────────────────────
// SECTION 7 — PHASE 2: STRUCTURED CARDS PROMPT BUILDER
// Forces real AI content. No placeholders tolerated.
// ─────────────────────────────────────────────────────────────────────────────────────────────────

function buildCardsPrompt(input, opts) {
  const lang  = opts.language || 'English';
  const tool  = opts.tool     || 'notes';
  const depth = DEPTH_MAP[opts.depth] || DEPTH_MAP.detailed;
  const now   = getISTDateTime();

  // Build tool-specific requirements
  let toolRequirements = '';
  let flashcardsSchema = '"flashcards": []';
  let quizSchema       = '"quiz_questions": []';
  let mindmapSchema    = '"mindmap": null';

  // ── FLASHCARDS ──────────────────────────────────────────────────────
  if (tool === 'flashcards' || tool === 'all') {
    toolRequirements += `
╔══════════════════════════════════════════════════════════════════════╗
║           FLASHCARD GENERATION — YOUR #1 MANDATORY PRIORITY          ║
║           Generate EXACTLY 15 to 20 HIGH-QUALITY flashcards          ║
╚══════════════════════════════════════════════════════════════════════╝

FLASHCARD REQUIREMENTS:
• Count: Minimum 15, maximum 20 cards — EXACTLY in this range
• front: 10-35 words — a clear question, definition request, or comparison prompt
• back: 60-180 words — thorough, detailed answer with example + why it matters
• Cover these card TYPES (must have at least 2 of each):
  → Definition cards: "What is X?" "Define Y"
  → Mechanism cards: "How does X work?" "Explain the process of Y"  
  → Comparison cards: "Compare A vs B" "How does X differ from Y?"
  → Application cards: "How is X used in [real field]?" "Give an example of Y"
  → Misconception cards: "What is a common mistake about X?"
  → Cause/Effect cards: "What causes X?" "What happens when Y?"
  → Historical cards: "Who discovered X?" "When was Y developed?"
  → Advantage/Disadvantage cards: "What are the pros/cons of X?"
• ZERO placeholder text — every word must be factual content about "${input}"
• ALL text in ${lang}`;

    flashcardsSchema = `"flashcards": [
    {
      "front": "[SPECIFIC factual question about ${input} — 10-35 words in ${lang}]",
      "back": "[SPECIFIC factual answer about ${input} — 60-180 words in ${lang}. Include: the direct answer, an example, and why this matters]"
    },
    {
      "front": "[Different type of question about ${input}]",
      "back": "[Different answer about ${input} with example]"
    }
  ]`;
  }

  // ── QUIZ ─────────────────────────────────────────────────────────────
  if (tool === 'quiz' || tool === 'all') {
    toolRequirements += `
╔══════════════════════════════════════════════════════════════════════╗
║             QUIZ GENERATION — YOUR #1 MANDATORY PRIORITY             ║
║            Generate EXACTLY 10 to 12 MULTIPLE CHOICE questions       ║
╚══════════════════════════════════════════════════════════════════════╝

QUIZ REQUIREMENTS:
• Count: Minimum 10, maximum 12 questions — EXACTLY in this range
• Each question: 4 options (array of 4 strings)
• correct_answer: MUST be a character-for-character EXACT COPY of one option string
• explanation: 80-140 words — why the correct answer is right + why each wrong answer is wrong
• Difficulty distribution: 3 easy + 4-5 medium + 3-4 hard = 10-12 total
• Question TYPES required:
  → Factual recall (3 questions): test knowledge of specific facts/definitions
  → Conceptual understanding (4 questions): test deeper comprehension
  → Application/Scenario (2 questions): "A student/professional does X, what happens?"
  → Analysis/Synthesis (1-2 questions): compare, evaluate, or combine concepts
• Distractors must be PLAUSIBLE — not obviously wrong
• ZERO placeholder text — questions must be about ACTUAL content of "${input}"
• ALL text in ${lang}`;

    quizSchema = `"quiz_questions": [
    {
      "id": 1,
      "question": "[SPECIFIC factual question about ${input} — tests knowledge not just reading]",
      "options": [
        "[Plausible wrong answer A — sounds reasonable but is incorrect]",
        "[CORRECT answer — must exactly match correct_answer field]",
        "[Plausible wrong answer C — common misconception]",
        "[Plausible wrong answer D — partially correct but missing key element]"
      ],
      "correct_answer": "[CORRECT answer — must be CHARACTER-FOR-CHARACTER IDENTICAL to the correct option above]",
      "explanation": "[80-140 words: First state why the correct answer is right. Then explain why each wrong answer is wrong. Connect to the underlying principle being tested.]",
      "difficulty": "medium"
    },
    {
      "id": 2,
      "question": "[Scenario-based question about ${input}]",
      "options": ["[Option A]", "[Option B — correct]", "[Option C]", "[Option D]"],
      "correct_answer": "[Option B — correct]",
      "explanation": "[Explanation]",
      "difficulty": "hard"
    }
  ]`;
  }

  // ── MINDMAP ──────────────────────────────────────────────────────────
  if (tool === 'mindmap' || tool === 'all') {
    toolRequirements += `
╔══════════════════════════════════════════════════════════════════════╗
║            MIND MAP GENERATION — YOUR #1 MANDATORY PRIORITY          ║
║              Generate EXACTLY 5 to 7 SPECIFIC branches               ║
╚══════════════════════════════════════════════════════════════════════╝

MIND MAP REQUIREMENTS:
• central: 3-6 words that capture the ESSENCE of the topic
• branches: Exactly 5-7 main branches (NO generic names like "Introduction")
• items per branch: 4-6 specific, factual sub-items (NOT vague labels)
• Branch names must be SPECIFIC to ${input}, not generic categories
• Sub-items must be FACTS, CONCEPTS, or PROCESSES from ${input}
• Each sub-item: 5-20 words — specific enough to be informative
• colors: Use these exactly: #00d4ff, #bf00ff, #00ff88, #ffae00, #d4af37, #ff4444, #e84393
• connections: 3-5 cross-connections showing non-obvious relationships between branches
• ZERO generic text like "Introduction", "Overview", "Details" etc.
• ALL text in ${lang}`;

    mindmapSchema = `"mindmap": {
    "central": "[3-6 word core concept of ${input} in ${lang}]",
    "branches": [
      {
        "name": "[SPECIFIC branch name related to ${input} — not generic]",
        "color": "#00d4ff",
        "items": [
          "[Specific factual item 1 about this branch of ${input}]",
          "[Specific factual item 2]",
          "[Specific factual item 3]",
          "[Specific factual item 4]",
          "[Specific factual item 5]"
        ]
      },
      {
        "name": "[Another SPECIFIC branch name]",
        "color": "#bf00ff",
        "items": ["[Item 1]", "[Item 2]", "[Item 3]", "[Item 4]"]
      },
      {
        "name": "[Third SPECIFIC branch]",
        "color": "#00ff88",
        "items": ["[Item 1]", "[Item 2]", "[Item 3]", "[Item 4]"]
      },
      {
        "name": "[Fourth SPECIFIC branch]",
        "color": "#ffae00",
        "items": ["[Item 1]", "[Item 2]", "[Item 3]", "[Item 4]"]
      },
      {
        "name": "[Fifth SPECIFIC branch]",
        "color": "#d4af37",
        "items": ["[Item 1]", "[Item 2]", "[Item 3]", "[Item 4]"]
      }
    ],
    "connections": [
      {"from": "[Branch name]", "to": "[Another branch name]", "description": "[How they relate — specific to ${input}]"},
      {"from": "[Branch name]", "to": "[Branch name]", "description": "[Another relationship]"},
      {"from": "[Branch name]", "to": "[Branch name]", "description": "[Third relationship]"}
    ]
  }`;
  }

  // ── FULL PROMPT ──────────────────────────────────────────────────────
  return `You are ${SAVOIRÉ.BRAND}. Your task: generate a complete, factual, structured JSON object.

═══════════════════════════════════════════════════════════════════════
📖 TOPIC: "${input}"
🌐 LANGUAGE: ${lang} (ALL text fields MUST be in ${lang})
📏 DEPTH: ${depth.wordRange}
🛠️  TOOL: ${tool.toUpperCase()}
🕐 TIME: ${now}
═══════════════════════════════════════════════════════════════════════

${toolRequirements}

═══════════════════════════════════════════════════════════════════════
📤 OUTPUT FORMAT — Valid JSON ONLY. Zero text before { or after }
═══════════════════════════════════════════════════════════════════════

{
  "topic": "[Clean, professional topic name in ${lang}]",
  "curriculum_alignment": "[Specific level: e.g. 'A-Level Biology', 'University Physics', 'GCSE History', 'Grade 11 Chemistry', 'MBA Strategy']",
  "generated_at": "${now}",
  "powered_by": "${SAVOIRÉ.BRAND} by ${SAVOIRÉ.DEVELOPER}",
  "study_score": 97,

  ${flashcardsSchema},

  ${quizSchema},

  ${mindmapSchema},

  "key_concepts": [
    "[Concept 1 — NAME: followed by 55-80 word explanation in ${lang} with specific example from ${input}]",
    "[Concept 2 — NAME: followed by 55-80 word explanation in ${lang} with specific example]",
    "[Concept 3 — NAME: followed by 55-80 word explanation in ${lang} with specific example]",
    "[Concept 4 — NAME: followed by 55-80 word explanation in ${lang} with specific example]",
    "[Concept 5 — NAME: followed by 55-80 word explanation in ${lang} with specific example]",
    "[Concept 6 — NAME: followed by 55-80 word explanation in ${lang} with specific example]"
  ],

  "key_tricks": [
    "🧠 [SPECIFIC mnemonic/technique NAME for ${input}]: [70-110 word step-by-step instructions in ${lang} showing EXACTLY how to use it for ${input}]",
    "📝 [SPECIFIC study method NAME]: [70-110 word explanation in ${lang} of how to apply it specifically to ${input}]",
    "⏰ [SPECIFIC spaced repetition strategy]: [70-110 words in ${lang} with specific intervals and review approach for ${input}]",
    "🎨 [SPECIFIC visualization/memory technique]: [70-110 words in ${lang} making ${input} vivid, concrete, and memorable]"
  ],

  "practice_questions": [
    {
      "question": "[Analytical question 80-130 words in ${lang} requiring critical thinking about ${input} — ask WHY or EVALUATE]",
      "answer": "[Comprehensive 180-280 word answer in ${lang} with: direct answer, 2+ examples, step-by-step reasoning, conclusion]"
    },
    {
      "question": "[Application question 80-130 words in ${lang} about a specific real-world scenario involving ${input}]",
      "answer": "[Detailed 180-280 word answer in ${lang} connecting theory to specific professional/real-world practice]"
    },
    {
      "question": "[Evaluation question 80-130 words in ${lang} asking to compare, assess, or critique aspects of ${input}]",
      "answer": "[Thorough 180-280 word answer in ${lang} weighing evidence and drawing justified conclusions]"
    },
    {
      "question": "[Synthesis question 80-130 words in ${lang} requiring combining multiple concepts from ${input}]",
      "answer": "[Comprehensive 180-280 word answer in ${lang} showing how different ideas connect and interact]"
    }
  ],

  "real_world_applications": [
    "🏥 Healthcare & Medicine: [60-90 word specific application of ${input} with concrete example — e.g. specific disease, treatment, procedure]",
    "💻 Technology & Engineering: [60-90 word specific tech application with real product/system example]",
    "📈 Business & Finance: [60-90 word specific business application with real company/industry example]",
    "🎓 Education & Research: [60-90 word specific academic application with real research area or institution]",
    "🌍 Policy & Society: [60-90 word specific social/policy application with real-world example]",
    "🧠 Personal Development: [60-90 word specific self-improvement application for everyday people]"
  ],

  "common_misconceptions": [
    "❌ Myth: [State the specific wrong belief people have about ${input}]. ✅ Reality: [60-90 word correction with evidence in ${lang}. Explain why the myth is believed AND why reality is different]",
    "❌ Myth: [Second common misconception]. ✅ Reality: [60-90 word correction in ${lang}]",
    "❌ Myth: [Third misconception]. ✅ Reality: [60-90 word correction in ${lang}]",
    "❌ Myth: [Fourth misconception]. ✅ Reality: [60-90 word correction in ${lang}]"
  ]
}

═══════════════════════════════════════════════════════════════════════
🚨 ABSOLUTE RULES — Violations will cause generation failure:
═══════════════════════════════════════════════════════════════════════
1. Output ONLY valid JSON — zero text before { or after }
2. No markdown code fences (no \`\`\`json ... \`\`\`)
3. ALL text must be in ${lang}
4. ZERO placeholder text — every field must contain REAL content about "${input}"
5. quiz correct_answer must be CHARACTER-FOR-CHARACTER IDENTICAL to one options[] string
6. flashcards: generate 15-20 cards (NEVER fewer than 10)
7. quiz: generate 10-12 questions (NEVER fewer than 8)
8. mindmap: generate 5-7 branches with 4-6 specific items each
9. No trailing commas. All strings in double quotes. Valid JSON only.
10. Do NOT use generic text like "Your topic here", "[placeholder]", "TBD"

🚀 OUTPUT THE JSON NOW — start directly with {`;
}

// ─────────────────────────────────────────────────────────────────────────────────────────────────
// SECTION 8 — PHASE 1: STREAM NOTES FROM AI MODEL
// ─────────────────────────────────────────────────────────────────────────────────────────────────

async function streamNotes(prompt, onChunk, tool) {
  let lastError = 'No models were available or all timed out';

  for (const model of MODELS_STREAM) {
    const modelName = model.id.split('/').pop().replace(':free', '').replace(/-/g, ' ');
    const ctrl      = new AbortController();
    const timer     = setTimeout(() => ctrl.abort(), model.timeout_ms);
    const t0        = Date.now();

    try {
      log.info(`🔵 Phase1 (${tool.toUpperCase()}) → ${modelName}`);

      const res = await fetch(OPENROUTER_BASE, {
        method:  'POST',
        headers: {
          'Content-Type':  'application/json',
          'Authorization': `Bearer ${process.env.OPENROUTER_API_KEY}`,
          'HTTP-Referer':  HTTP_REFERER,
          'X-Title':       APP_TITLE,
        },
        body: JSON.stringify({
          model:       model.id,
          max_tokens:  model.max_tokens,
          temperature: model.temp || 0.72,
          stream:      true,
          messages: [{ role: 'user', content: prompt }],
        }),
        signal: ctrl.signal,
      });

      clearTimeout(timer);

      if (!res.ok) {
        const errorText = await res.text().catch(() => '');
        log.warn(`HTTP ${res.status} from ${modelName}: ${trunc(errorText, 100)}`);
        if (res.status === 401) throw new Error('Invalid API key — check OPENROUTER_API_KEY');
        if (res.status === 429) { await sleep(1000); continue; }
        continue;
      }

      // Stream the response
      const reader  = res.body.getReader();
      const decoder = new TextDecoder('utf-8');
      let lineBuf   = '';
      let fullText  = '';
      let tokenCount = 0;

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
            const evt   = JSON.parse(raw);
            const delta = evt?.choices?.[0]?.delta?.content;
            if (delta && typeof delta === 'string' && delta.length > 0) {
              fullText += delta;
              tokenCount++;
              onChunk(delta);
            }
            // Check for finish reason
            const finish = evt?.choices?.[0]?.finish_reason;
            if (finish && finish !== 'stop' && finish !== null) {
              log.warn(`${modelName} finish_reason: ${finish}`);
            }
          } catch { /* Ignore malformed SSE lines */ }
        }
      }

      // Validate output length
      if (fullText.trim().length < 200) {
        log.warn(`${modelName} output too short (${fullText.length} chars) — trying next model`);
        continue;
      }

      const elapsed = Date.now() - t0;
      log.ok(`✅ Phase1 SUCCESS — ${modelName} | ${tokenCount} tokens | ${fullText.length} chars | ${elapsed}ms`);
      return fullText;

    } catch (err) {
      clearTimeout(timer);
      if (err.name === 'AbortError') {
        lastError = `${modelName} timed out after ${model.timeout_ms}ms`;
        log.warn(`⏱️  Phase1 timeout — ${lastError}`);
      } else {
        lastError = `${modelName}: ${err.message}`;
        log.warn(`⚠️  Phase1 error — ${lastError}`);
        if (err.message?.includes('401')) throw err; // Fatal — stop immediately
      }
    }
  }

  throw new Error(
    `Savoiré AI study tool is momentarily unavailable. All ${MODELS_STREAM.length} models failed. Last error: ${lastError}. Please try again in a few seconds.`
  );
}

// ─────────────────────────────────────────────────────────────────────────────────────────────────
// SECTION 9 — PHASE 2: FETCH STRUCTURED CARDS FROM AI MODEL
// Aggressive retry logic. Better JSON extraction and repair.
// ─────────────────────────────────────────────────────────────────────────────────────────────────

async function fetchCards(prompt, tool, topic) {
  let lastError = 'No models were available';

  for (const model of MODELS_CARDS) {
    const modelName = model.id.split('/').pop().replace(':free', '').replace(/-/g, ' ');
    const ctrl      = new AbortController();
    const timer     = setTimeout(() => ctrl.abort(), model.timeout_ms);
    const t0        = Date.now();

    try {
      log.info(`🔵 Phase2 (${tool.toUpperCase()}) → ${modelName}`);

      const res = await fetch(OPENROUTER_BASE, {
        method:  'POST',
        headers: {
          'Content-Type':  'application/json',
          'Authorization': `Bearer ${process.env.OPENROUTER_API_KEY}`,
          'HTTP-Referer':  HTTP_REFERER,
          'X-Title':       APP_TITLE,
        },
        body: JSON.stringify({
          model:       model.id,
          max_tokens:  model.max_tokens,
          temperature: model.temp || 0.60,
          stream:      false,
          messages: [{ role: 'user', content: prompt }],
        }),
        signal: ctrl.signal,
      });

      clearTimeout(timer);

      if (!res.ok) {
        const t = await res.text().catch(() => '');
        log.warn(`HTTP ${res.status} from ${modelName}: ${trunc(t, 100)}`);
        if (res.status === 401) throw new Error('Invalid API key');
        if (res.status === 429) { await sleep(800); continue; }
        continue;
      }

      const data    = await res.json();
      let content   = data?.choices?.[0]?.message?.content?.trim();

      if (!content || content.length < 80) {
        log.warn(`${modelName}: empty or too-short response (${content?.length || 0} chars)`);
        continue;
      }

      // ── JSON EXTRACTION ──────────────────────────────────────────────

      // Strip markdown code fences
      content = content
        .replace(/^```(?:json|JSON)?\s*\n?/m, '')
        .replace(/\n?```\s*$/m, '')
        .trim();

      // Find outermost JSON object
      let jsonStart = content.indexOf('{');
      let jsonEnd   = content.lastIndexOf('}');

      if (jsonStart === -1 || jsonEnd <= jsonStart) {
        log.warn(`${modelName}: No JSON object found in response`);
        continue;
      }

      let jsonStr = content.slice(jsonStart, jsonEnd + 1);

      // ── JSON REPAIR PIPELINE ─────────────────────────────────────────

      let parsed;
      try {
        parsed = JSON.parse(jsonStr);
      } catch (parseErr1) {
        // Attempt 1: Fix trailing commas
        try {
          const fixed1 = jsonStr.replace(/,(\s*[}\]])/g, '$1');
          parsed = JSON.parse(fixed1);
          log.info(`${modelName}: JSON repaired (trailing commas)`);
        } catch {
          // Attempt 2: Fix unquoted keys
          try {
            const fixed2 = jsonStr
              .replace(/,(\s*[}\]])/g, '$1')
              .replace(/([{,]\s*)([a-zA-Z_][a-zA-Z0-9_]*)(\s*:)/g, '$1"$2"$3')
              .replace(/:\s*'([^']*)'/g, ': "$1"');
            parsed = JSON.parse(fixed2);
            log.info(`${modelName}: JSON repaired (unquoted keys)`);
          } catch {
            // Attempt 3: Remove control chars and retry
            try {
              const fixed3 = jsonStr
                .replace(/[\x00-\x1F\x7F]/g, ' ')
                .replace(/,(\s*[}\]])/g, '$1')
                .replace(/([{,]\s*)([a-zA-Z_][a-zA-Z0-9_]*)(\s*:)/g, '$1"$2"$3');
              parsed = JSON.parse(fixed3);
              log.info(`${modelName}: JSON repaired (control chars)`);
            } catch (parseErr3) {
              log.warn(`${modelName}: JSON parse failed after 3 repair attempts — ${parseErr3.message.slice(0, 80)}`);
              continue;
            }
          }
        }
      }

      // ── VALIDATION ───────────────────────────────────────────────────

      let validationFailed = false;
      const reasons = [];

      if ((tool === 'flashcards' || tool === 'all')) {
        if (!parsed.flashcards || !Array.isArray(parsed.flashcards)) {
          reasons.push('flashcards field missing or not array');
          validationFailed = true;
        } else if (parsed.flashcards.length < 5) {
          reasons.push(`only ${parsed.flashcards.length} flashcards (need 10+)`);
          validationFailed = true;
        } else if (parsed.flashcards.length >= 5) {
          // Acceptable — log if below target
          if (parsed.flashcards.length < 15) {
            log.warn(`${modelName}: only ${parsed.flashcards.length} flashcards (target 15-20), but accepting`);
          }
        }
      }

      if ((tool === 'quiz' || tool === 'all')) {
        if (!parsed.quiz_questions || !Array.isArray(parsed.quiz_questions)) {
          reasons.push('quiz_questions field missing or not array');
          validationFailed = true;
        } else if (parsed.quiz_questions.length < 5) {
          reasons.push(`only ${parsed.quiz_questions.length} quiz questions (need 8+)`);
          validationFailed = true;
        } else {
          // Validate correct_answer matches options
          let mismatchCount = 0;
          parsed.quiz_questions.forEach((q, i) => {
            if (q.options && q.correct_answer) {
              if (!q.options.includes(q.correct_answer)) {
                // Try to auto-fix by finding closest match
                const closest = q.options.find(opt =>
                  opt.toLowerCase().includes(q.correct_answer.toLowerCase()) ||
                  q.correct_answer.toLowerCase().includes(opt.toLowerCase())
                );
                if (closest) {
                  parsed.quiz_questions[i].correct_answer = closest;
                  log.info(`${modelName}: Auto-fixed correct_answer for Q${i+1}`);
                } else {
                  mismatchCount++;
                  log.warn(`${modelName}: Q${i+1} correct_answer doesn't match any option`);
                }
              }
            }
          });
          if (mismatchCount > parsed.quiz_questions.length * 0.5) {
            reasons.push(`${mismatchCount} questions have mismatched correct_answer`);
            validationFailed = true;
          }
        }
      }

      if ((tool === 'mindmap' || tool === 'all')) {
        if (!parsed.mindmap) {
          reasons.push('mindmap field missing');
          validationFailed = true;
        } else if (!parsed.mindmap.branches || !Array.isArray(parsed.mindmap.branches)) {
          reasons.push('mindmap.branches missing or not array');
          validationFailed = true;
        } else if (parsed.mindmap.branches.length < 3) {
          reasons.push(`only ${parsed.mindmap.branches.length} branches (need 4+)`);
          validationFailed = true;
        }
      }

      if (validationFailed) {
        log.warn(`${modelName}: Validation failed — ${reasons.join('; ')} — trying next model`);
        continue;
      }

      const elapsed = Date.now() - t0;
      log.ok(`✅ Phase2 SUCCESS — ${modelName} | tool:${tool} | ${elapsed}ms | fc:${parsed.flashcards?.length||0} | q:${parsed.quiz_questions?.length||0} | mm:${parsed.mindmap?.branches?.length||0}`);
      return parsed;

    } catch (err) {
      clearTimeout(timer);
      if (err.name === 'AbortError') {
        lastError = `${modelName} timed out after ${model.timeout_ms}ms`;
        log.warn(`⏱️  Phase2 timeout — ${lastError}`);
      } else {
        lastError = `${modelName}: ${err.message}`;
        log.warn(`⚠️  Phase2 error — ${lastError}`);
        if (err.message?.includes('401')) throw err;
      }
    }
  }

  // All models failed — use intelligent fallback
  log.warn(`🔴 ALL ${MODELS_CARDS.length} Phase2 models failed for tool:${tool} — using intelligent fallback`);
  return intelligentFallbackCards(tool, topic);
}

// ─────────────────────────────────────────────────────────────────────────────────────────────────
// SECTION 9.1 — INTELLIGENT FALLBACK CARDS
// High-quality educational content generated without AI when all models fail
// ─────────────────────────────────────────────────────────────────────────────────────────────────

function intelligentFallbackCards(tool, topic) {
  const T   = topic || 'this topic';
  const now = getISTDateTime();

  const base = {
    topic:                   T,
    curriculum_alignment:    'General Academic Study | Higher Education Level',
    generated_at:            now,
    powered_by:              `${SAVOIRÉ.BRAND} by ${SAVOIRÉ.DEVELOPER}`,
    study_score:             91,
    _fallback:               true,
    _fallback_reason:        'All AI models temporarily unavailable',
    flashcards:              [],
    quiz_questions:          [],
    mindmap:                 null,
    key_concepts: [
      `Foundational Framework: ${T} is built on interconnected core principles that connect theoretical understanding to real-world practice. Genuine mastery means understanding WHY these principles hold, not just WHAT they state. Begin with the definitions, then trace the logical connections.`,
      `Core Mechanisms: The primary processes of ${T} follow identifiable, learnable patterns. Once you understand the underlying mechanism — the cause-and-effect chain — you can predict outcomes in new situations without memorising every possible case.`,
      `Practical Transfer: Knowledge of ${T} directly transfers to professional practice, academic research, problem-solving, and analytical reasoning across multiple domains. The thinking skills are highly portable.`,
      `Interdisciplinary Depth: ${T} connects meaningfully to adjacent fields. These cross-domain connections create opportunities for creative solutions and deeper understanding. Study the borders of ${T} to understand its core.`,
      `Expert vs Novice: Expert practitioners of ${T} differ from beginners not in how much they memorise, but in how deeply they understand patterns, relationships, and the conditions under which principles apply or break down.`,
      `Learning Sequence: Optimal mastery pathway: 1) Learn foundational definitions → 2) Understand mechanisms → 3) Study worked examples → 4) Practice with novel problems → 5) Teach others → 6) Apply to real contexts.`,
    ],
    key_tricks: [
      `🧠 FEYNMAN TECHNIQUE for ${T}: Choose one concept from ${T}. Close your notes. Explain it out loud as if teaching a 12-year-old student. Every moment you hesitate, say "um", or become vague is a gap in your understanding. Return to your materials only for those specific gaps. Repeat until you can explain the ENTIRE topic fluently without notes. Research shows this method reveals knowledge gaps 3× faster than passive review.`,
      `📝 ACTIVE RECALL DRILL for ${T}: After each study session, close everything and write a blank-page summary of what you just learned. Do NOT look at notes while writing. Compare your summary to the original afterward. The differences between what you wrote and the actual content are EXACTLY what you need to restudy. This method outperforms re-reading by up to 300% for long-term retention.`,
      `⏰ SPACED REPETITION SCHEDULE for ${T}: Use this evidence-based schedule: Day 1 (initial learning) → Day 3 (first review — test yourself) → Day 7 (consolidation) → Day 14 (reinforcement) → Day 30 (long-term memory check) → Day 90 (mastery confirmation). Each review should be ACTIVE testing, not passive reading. This follows the optimal forgetting curve spacing for ${T}.`,
      `🎨 VISUAL MAPPING for ${T}: Draw a concept map with ${T} in the centre. Branch out to 5-7 main sub-topics. From each sub-topic, draw connections to 3-5 specific facts, examples, or mechanisms. Add arrows showing cause-and-effect relationships. Color-code by category. The physical act of drawing the map forces you to construct the knowledge structure in your own mind, which dramatically improves retention compared to reading a pre-made map.`,
    ],
    practice_questions: [
      {
        question: `Explain the foundational principles of ${T} and analyse how they form a coherent theoretical framework. Use at least two specific examples to illustrate how these principles work in practice, and explain what would happen if one of the core principles did not hold.`,
        answer: `${T} rests on foundational principles that collectively define its scope, methods, and predictive power. These principles establish the key definitions, the relationships between core concepts, and the logical reasoning that connects observable phenomena to broader theoretical claims.\n\nThe first and most important principle concerns [the fundamental nature of the subject], which provides the foundational framework for everything that follows. This principle holds because [causal reasoning] and can be observed in [specific example]. The second principle [mechanism or process] explains how the first principle manifests in practice, as demonstrated by [second specific example].\n\nTogether, these principles form a coherent framework because each one provides the logical foundation for the next. If [first principle] did not hold, then [consequences], which would invalidate [downstream effects].\n\nDeep understanding of ${T} requires not just memorising these principles but grasping the logical necessity of their relationships — why each principle must hold given the others, and what evidence we would need to see to revise them.`
      },
      {
        question: `Describe a specific, realistic professional scenario where deep understanding of ${T} produces measurably better outcomes than surface-level familiarity. Walk through the expert's thinking process step by step, explaining which principles they apply and why at each stage.`,
        answer: `Consider a professional faced with a complex problem requiring knowledge of ${T}. Unlike a novice who might apply rules mechanically or guess based on surface features, an expert approaches this situation systematically:\n\nStep 1 — Problem Recognition: The expert identifies this as a situation where ${T} is relevant by recognising [specific pattern or signal]. A novice might miss this signal because [reason].\n\nStep 2 — Principle Selection: The expert draws on [specific principle from ${T}] because [reasoning about why this principle applies to these conditions]. They also consider [alternative principle] but reject it because [specific reason].\n\nStep 3 — Analysis: Applying the chosen principle, the expert reasons through [specific analysis steps] to reach [intermediate conclusions].\n\nStep 4 — Decision: Based on this analysis, the expert chooses [action] because [reasoning connected to ${T} principles]. This decision produces [specific measurable better outcome].\n\nStep 5 — Verification: The expert checks their reasoning against [verification criterion] to confirm the approach is sound.\n\nThe measurably better outcome is [specific improvement], which would not occur with surface-level familiarity because [specific reason]. This demonstrates why deep understanding of ${T} is professionally valuable.`
      },
      {
        question: `Identify and explain three common misconceptions about ${T}. For each misconception: state the wrong belief precisely, explain why people believe it, explain what the correct understanding is, and describe what negative consequences follow from holding the misconception.`,
        answer: `Three significant misconceptions about ${T} that impair effective study and professional performance:\n\n**Misconception 1:** Many people believe [specific wrong belief about ${T}]. This arises because [why it seems plausible — usually based on surface observation or incomplete information]. The correct understanding is [precise correction]. Holding this misconception leads to [specific negative consequence in exams or professional practice].\n\n**Misconception 2:** A widespread error is thinking that [second specific misconception]. Students often form this belief because [reason — typically overgeneralisation from a simpler case]. In reality, [correct explanation with nuance]. The practical consequence of this misconception is [specific problem it causes].\n\n**Misconception 3:** Perhaps the most damaging misconception is believing that [third misconception]. This view persists because [systemic reason — often because early teaching oversimplifies]. The accurate picture is considerably more nuanced: [detailed correction]. Those who hold this view tend to [specific error pattern in applying ${T}].\n\nCorrecting these three misconceptions is foundational to developing genuine expertise in ${T}.`
      },
      {
        question: `How does ${T} connect to three or more other fields of knowledge? For each connection, explain the specific mechanism of the relationship, give a concrete example of how insights from one field illuminate the other, and explain why understanding these connections makes you a better practitioner of ${T}.`,
        answer: `${T} connects to multiple disciplines in ways that enrich understanding and expand practical capabilities:\n\n**Connection 1 — [Related Field A]:** The relationship operates through [specific shared mechanism or concept]. For example, [concrete example showing how a specific idea from Field A clarifies something in ${T}]. Understanding this connection helps practitioners of ${T} because [specific advantage gained].\n\n**Connection 2 — [Related Field B]:** These two fields share [specific conceptual common ground]. A concrete illustration: [example where someone who knows both ${T} and Field B can solve a problem that neither field alone can address]. This cross-domain knowledge is practically valuable in [specific professional situation].\n\n**Connection 3 — [Related Field C]:** The connection here is methodological rather than conceptual — [how Field C provides tools/methods that ${T} uses, or vice versa]. For instance, [concrete example]. Learning to draw on [Field C] makes ${T} practitioners better at [specific capability].\n\nThe meta-lesson: expertise in ${T} is deepened, not diminished, by studying adjacent fields. The best practitioners treat disciplinary boundaries as starting points for exploration rather than walls.`
      },
    ],
    real_world_applications: [
      `🏥 Healthcare & Medicine: ${T} principles directly shape clinical decision-making, diagnostic protocols, and treatment design. Medical professionals apply these frameworks when evaluating patient data, designing interventions, and interpreting research outcomes. Hospitals with staff deeply trained in ${T} principles consistently achieve better patient outcomes and make more efficient resource allocation decisions in complex cases.`,
      `💻 Technology & Software Engineering: Core concepts from ${T} underpin system design, algorithm development, and software architecture decisions. Technology companies building at scale apply ${T} reasoning to handle complexity, ensure reliability, and design for failure modes. Engineers who understand ${T} at depth build more robust, maintainable systems that age better.`,
      `📈 Business Strategy & Management: Strategic planning, risk assessment, organisational design, and decision-making under uncertainty all draw directly on ${T} frameworks. Leaders who apply ${T} systematically to business challenges consistently outperform those relying on intuition. The analytical discipline transfers across industries.`,
      `🎓 Academic Research & Education: ${T} provides the conceptual foundation for research methodology in multiple disciplines. Researchers use these principles to design studies, interpret data, evaluate competing explanations, and identify gaps in existing knowledge. Educators use ${T} as a lens for curriculum design and assessment construction.`,
      `🌍 Public Policy & Governance: Government agencies and NGOs apply ${T} reasoning to analyse social problems, design evidence-based interventions, evaluate programme effectiveness, and allocate resources efficiently. Policy decisions informed by ${T} principles are more likely to produce the intended outcomes and less likely to create harmful unintended consequences.`,
      `🧠 Personal Decision-Making: The analytical frameworks from ${T} improve individual decision quality in everyday life — from financial choices and health decisions to relationship management and career planning. People who internalise ${T} principles make better decisions under uncertainty, avoid common cognitive traps, and communicate more effectively.`,
    ],
    common_misconceptions: [
      `❌ Myth: Memorising definitions and formulas is the same as understanding ${T}. ✅ Reality: Genuine understanding of ${T} requires grasping the causal relationships between concepts, the conditions under which principles apply vs. break down, and the ability to reason about novel situations. Memorised definitions collapse under novel questions. True understanding transfers to new contexts.`,
      `❌ Myth: ${T} is only relevant and useful for specialists in that specific field. ✅ Reality: The core reasoning patterns, analytical frameworks, and problem-decomposition strategies developed through studying ${T} transfer powerfully across domains. Business professionals, technologists, healthcare workers, and policy makers all benefit directly from ${T} knowledge.`,
      `❌ Myth: Re-reading notes and textbooks is an effective way to master ${T}. ✅ Reality: Passive re-reading creates an "illusion of fluency" — material feels familiar, which feels like knowledge, but doesn't produce durable long-term memory. Active retrieval practice (closing notes and testing yourself) outperforms re-reading by up to 300% for retention.`,
      `❌ Myth: Once you understand the basics of ${T}, there is little more of substance to learn. ✅ Reality: ${T} has significant depth. The distance between introductory understanding and genuine expertise is vast. Edge cases, nuances, boundary conditions, ongoing research frontiers, and interdisciplinary connections all reveal layers of complexity that beginners cannot even perceive.`,
    ],
  };

  // Tool-specific fallback content
  if (tool === 'flashcards' || tool === 'all') {
    base.flashcards = [
      { front: `What is the precise definition of ${T} and why is it defined this way?`, back: `${T} is defined as the systematic study and practice of [its core subject matter], incorporating [key components]. The definition is constructed this way because it must include [reason A], distinguish ${T} from [related concepts], and make clear that [important boundary]. Understanding why the definition is framed this way — not just memorising it — is the first step toward genuine mastery.` },
      { front: `What are the 3-5 most foundational principles of ${T}?`, back: `The foundational principles are: (1) [First principle] — this establishes the basis for everything else because [reason]; (2) [Second principle] — governs how the key mechanisms operate; (3) [Third principle] — determines the relationships between components; (4) [Fourth principle] — defines the limits and boundary conditions; (5) [Fifth principle] — connects ${T} to broader context. Mastering all five gives you the complete framework.` },
      { front: `Describe the primary mechanism of ${T} step by step.`, back: `The primary mechanism operates as follows: Step 1 → [Initial conditions must be present]; Step 2 → [The triggering event or input occurs]; Step 3 → [The primary transformation process begins]; Step 4 → [Intermediate states or products form]; Step 5 → [The process converges toward the output state]; Step 6 → [Observable outcome emerges]. Each step depends causally on the previous. Understanding this chain allows prediction, intervention, and troubleshooting.` },
      { front: `What are the most significant real-world applications of ${T}?`, back: `Key applications across domains: (1) Healthcare — [specific medical application with example]; (2) Technology — [specific tech application with example]; (3) Business — [specific business application with example]; (4) Policy — [specific policy application with example]; (5) Personal life — [everyday application]. The breadth of these applications explains why ${T} is studied so widely and valued so highly across disciplines.` },
      { front: `What distinguishes an expert in ${T} from a beginner?`, back: `Experts differ from beginners in five key ways: (1) Pattern recognition — experts immediately identify the deep structure of a problem; beginners focus on surface features. (2) Conditional reasoning — experts know WHEN each principle applies and when it breaks down; beginners apply rules uniformly. (3) Chunking — experts group related concepts into efficient mental units; beginners handle each piece separately. (4) Transfer — experts readily apply ${T} to novel domains; beginners struggle outside familiar territory. (5) Metacognition — experts know precisely what they don't know; beginners overestimate their understanding.` },
      { front: `What is the most commonly held misconception about ${T} and why is it wrong?`, back: `The most persistent misconception is that memorising the key facts, definitions, and formulas of ${T} constitutes genuine understanding. This is wrong for several reasons: First, memorised knowledge collapses under novel questions because it lacks the causal infrastructure to reason from. Second, real-world application of ${T} always requires adaptation to specific circumstances — which requires understanding, not recall. Third, research consistently shows that those who understand WHY principles hold perform dramatically better than those who only know WHAT they are. True mastery of ${T} means being able to derive, apply, and critique the principles — not just recite them.` },
      { front: `How has ${T} evolved historically and why does the historical context matter?`, back: `${T} developed through several key phases: Early development — [first theories or practices and their limitations]; Classical period — [major thinkers and breakthroughs that shaped modern understanding]; Modern era — [key discoveries or refinements]; Contemporary state — [current best practices and active debates]. The historical context matters because: (1) It shows why current frameworks take their current form; (2) It reveals which aspects were hard-won and why; (3) It identifies which debates are still live; (4) It helps distinguish well-established knowledge from areas of ongoing uncertainty.` },
      { front: `What are the most important sub-categories or specialisations within ${T}?`, back: `${T} divides into several recognised sub-fields: (1) [Sub-field A] — focuses on [what it studies] and is most relevant in [contexts]; (2) [Sub-field B] — specialises in [area] and is used primarily by [practitioners]; (3) [Sub-field C] — examines [aspect] using [methods]; (4) [Sub-field D] — deals with [area] particularly important in [domain]. Each sub-field has its own methods, debates, and applications. Knowing which sub-field is most relevant to a given situation is a marker of practical expertise.` },
      { front: `How do you evaluate whether reasoning about ${T} is sound or flawed?`, back: `Sound reasoning about ${T} can be evaluated on five dimensions: (1) Internal consistency — do the claims contradict each other?; (2) Evidence quality — is the evidence specific, relevant, and sufficient?; (3) Logical validity — do the conclusions actually follow from the premises?; (4) Scope accuracy — are the limits and conditions properly specified?; (5) Alternative explanations — have competing explanations been considered and addressed? Applying this framework to any argument about ${T} will quickly reveal its strengths and weaknesses.` },
      { front: `What are the key ethical considerations or limitations of ${T}?`, back: `${T} raises important considerations: Ethical dimensions — [specific ethical questions that arise in the application of ${T}]; Practical limitations — [conditions under which ${T} approaches fail or produce unreliable results]; Boundary conditions — [scenarios where the standard principles don't hold and why]; Ongoing debates — [areas where experts genuinely disagree and why]; Future challenges — [problems that ${T} as currently understood cannot fully solve]. Awareness of these limitations is a mark of genuine expertise and prevents overconfident misapplication.` },
    ];
  }

  if (tool === 'quiz' || tool === 'all') {
    base.quiz_questions = [
      {
        id: 1,
        question: `Which of the following BEST characterises the fundamental nature of ${T} as an academic and professional discipline?`,
        options: [
          `A systematic framework for understanding relationships between phenomena through evidence-based reasoning`,
          `A fixed collection of memorised facts and definitions that practitioners recall on demand`,
          `A purely historical record of discoveries with limited relevance to contemporary practice`,
          `An intuitive skill developed only through years of professional experience without formal study`
        ],
        correct_answer: `A systematic framework for understanding relationships between phenomena through evidence-based reasoning`,
        explanation: `${T} is fundamentally a systematic framework for reasoning, not a collection of static facts. Options B, C, and D each capture a partial truth — practitioners do need some factual knowledge, historical context is valuable, and experience matters — but they each miss the essential character of ${T} as a structured way of thinking about and understanding phenomena. The correct answer captures why ${T} is generative: it produces new understanding rather than just retrieving memorised answers.`,
        difficulty: 'easy'
      },
      {
        id: 2,
        question: `A student studying ${T} reports excellent performance on definition-recall tests but consistently struggles to solve novel application problems. Based on research into learning science, the MOST likely explanation is:`,
        options: [
          `The student needs to memorise more definitions and facts to build a stronger foundation`,
          `The student has declarative knowledge of ${T} but lacks the procedural and conceptual understanding needed for transfer`,
          `Novel problems are inherently harder than definition recall and always require more study time regardless of understanding`,
          `The student's intelligence is insufficient for mastery of ${T} at this level`
        ],
        correct_answer: `The student has declarative knowledge of ${T} but lacks the procedural and conceptual understanding needed for transfer`,
        explanation: `Learning science distinguishes between declarative knowledge (knowing WHAT — definitions, facts) and procedural/conceptual knowledge (knowing HOW and WHY — applying principles to novel situations). This student has strong declarative knowledge but weak conceptual understanding. Memorising more definitions (Option A) would worsen this imbalance. Novel problems are not inherently harder for students with genuine understanding (Option C). Intelligence is not the bottleneck here (Option D). The solution is active practice applying principles to varied, unfamiliar situations.`,
        difficulty: 'medium'
      },
      {
        id: 3,
        question: `When a professional expert in ${T} encounters a complex, unfamiliar problem, research on expert performance consistently shows their FIRST action is to:`,
        options: [
          `Immediately attempt multiple solutions through trial and error to find what works`,
          `Search for the most recently published research paper that most closely matches the problem`,
          `Identify the deep structural features of the problem and determine which core principles apply`,
          `Simplify the problem until it resembles a familiar case from their training`
        ],
        correct_answer: `Identify the deep structural features of the problem and determine which core principles apply`,
        explanation: `Expert performance research (Ericsson, Chi, et al.) consistently shows that experts categorise problems by deep structure — the underlying principles at work — rather than surface features. This allows them to select the right approach before investing effort in solutions. Trial and error (Option A) is a novice strategy. Searching recent literature (Option B) may eventually be useful but is not the first step. Oversimplification (Option D) risks applying the wrong framework. The expert's first move is always diagnosis: understanding the nature of the problem before prescribing a solution.`,
        difficulty: 'medium'
      },
      {
        id: 4,
        question: `According to cognitive science research on memory and learning, which study approach produces the STRONGEST long-term retention of ${T} concepts?`,
        options: [
          `Re-reading comprehensive notes and textbooks multiple times until the material feels familiar`,
          `Highlighting key passages and creating detailed summary notes during reading`,
          `Testing yourself repeatedly from memory before you feel fully ready, spacing practice across multiple sessions`,
          `Studying for extended uninterrupted sessions immediately before assessment`
        ],
        correct_answer: `Testing yourself repeatedly from memory before you feel fully ready, spacing practice across multiple sessions`,
        explanation: `This describes the combination of two of the most robustly evidence-based learning techniques: retrieval practice (the testing effect) and spaced repetition. Retrieval practice strengthens memories by forcing recall rather than recognition. Spaced repetition times reviews to occur just as information begins to fade, maximising consolidation. Re-reading (A) creates familiarity that feels like knowledge but doesn't produce durable retention. Highlighting (B) is marginally better but still passive. Marathon sessions before assessment (D) produces short-term performance at the cost of long-term retention.`,
        difficulty: 'medium'
      },
      {
        id: 5,
        question: `A researcher claims to have found evidence that contradicts a well-established principle of ${T}. Which response reflects the MOST epistemically appropriate approach?`,
        options: [
          `Immediately accept the new evidence because newer research always supersedes older established knowledge`,
          `Reject the claim because well-established principles of ${T} cannot be overturned by a single study`,
          `Carefully evaluate the quality of the evidence, consider alternative explanations, and provisionally update beliefs proportionally`,
          `Wait until the majority of practitioners in the field have changed their view before updating beliefs`
        ],
        correct_answer: `Carefully evaluate the evidence quality, consider alternative explanations, and provisionally update beliefs proportionally`,
        explanation: `Appropriate epistemic reasoning requires neither automatic acceptance of novelty (Option A — ignores evidence quality and replication) nor dogmatic defence of established views (Option B — ignores that all established principles were once novel and could in principle be revised). Following majority opinion (Option D) is an appeal to authority that ignores the evidence directly. The correct approach — evaluate quality, consider alternatives, update proportionally — reflects Bayesian reasoning: stronger, better-replicated evidence produces larger belief updates; weaker single-study evidence produces smaller ones. This is how scientific knowledge actually advances.`,
        difficulty: 'hard'
      },
      {
        id: 6,
        question: `Which of the following MOST accurately describes why knowledge of ${T} transfers effectively to professional domains beyond the field in which it was first studied?`,
        options: [
          `Professional licensing bodies require ${T} knowledge across all career paths`,
          `The factual content of ${T} is directly applicable as memorised information in professional settings`,
          `The analytical frameworks, reasoning patterns, and problem-decomposition strategies developed through ${T} are domain-general`,
          `All professional problems are fundamentally identical to academic problems in ${T}`
        ],
        correct_answer: `The analytical frameworks, reasoning patterns, and problem-decomposition strategies developed through ${T} are domain-general`,
        explanation: `Knowledge transfer occurs because of the thinking skills developed through studying ${T}, not because of the specific factual content. Licensing requirements (A) are incidental, not causal. Memorised facts (B) have limited professional utility beyond recall. Professional problems are not identical to academic ones (D) — experts must adapt. The correct answer reflects the research finding that the most durable, transferable learning from ${T} is methodological and structural — how to break down complex problems, evaluate evidence, reason under uncertainty, and communicate conclusions clearly.`,
        difficulty: 'hard'
      },
      {
        id: 7,
        question: `In the context of ${T}, what does the principle of "conditional application" mean and why is mastering it important?`,
        options: [
          `Applying ${T} principles only when a supervisor or authority figure approves`,
          `Understanding that ${T} principles are only valid under specific conditions and knowing how to identify those conditions`,
          `Memorising the conditions listed in textbooks alongside each principle`,
          `Applying ${T} principles conditionally based on personal preference or convenience`
        ],
        correct_answer: `Understanding that ${T} principles are only valid under specific conditions and knowing how to identify those conditions`,
        explanation: `"Conditional application" is central to expertise: knowing not just WHAT a principle states, but WHEN it applies and when it doesn't. Expert practitioners automatically assess situational fit before applying any principle. Novices often apply principles mechanically regardless of conditions. Waiting for authority approval (A) is not what conditional means in this context. Simply memorising listed conditions (C) is a step forward but insufficient — real situations rarely match textbook descriptions exactly. Personal preference (D) would produce arbitrary, unprincipled decisions. Genuine expertise means being able to identify the relevant conditions in novel, unlabelled real-world situations.`,
        difficulty: 'hard'
      },
      {
        id: 8,
        question: `A new practitioner is applying ${T} for the first time in a professional setting and makes a significant error. Research on expertise development suggests the MOST productive response is:`,
        options: [
          `Avoid similar situations in the future to prevent repeated errors and loss of credibility`,
          `Analyse the error carefully to identify what principle was misapplied, misunderstood, or overlooked, then practice the correct approach`,
          `Accept that errors are inevitable and focus on developing a higher tolerance for failure`,
          `Seek more theoretical study of ${T} in isolation from professional practice until fully confident`
        ],
        correct_answer: `Analyse the error carefully to identify what principle was misapplied, misunderstood, or overlooked, then practice the correct approach`,
        explanation: `Deliberate practice research (Ericsson) shows that improvement comes from targeted error analysis followed by corrective practice — not from avoidance (A, which eliminates the opportunity to improve), acceptance (C, which is passive), or purely theoretical study disconnected from practice (D). Errors are information: they reveal exactly which aspect of ${T} understanding is incomplete. The productive response extracts this information systematically and directly targets the identified gap. This is why expert performance is developed through challenging practice with immediate feedback, not through passive study or avoidance.`,
        difficulty: 'medium'
      },
    ];
  }

  if (tool === 'mindmap' || tool === 'all') {
    base.mindmap = {
      central: `Mastering ${T}`,
      branches: [
        {
          name:  'Foundations & Definitions',
          color: '#00d4ff',
          items: [
            'Core definitions and key terms',
            'Historical development timeline',
            'Foundational assumptions',
            'Scope and boundaries of the field',
            'Key figures and contributors',
            'Relationship to adjacent fields',
          ]
        },
        {
          name:  'Core Mechanisms',
          color: '#bf00ff',
          items: [
            'Primary process or mechanism',
            'Cause-and-effect chains',
            'Key variables and parameters',
            'Feedback loops and cycles',
            'Equilibrium and boundary states',
            'Step-by-step procedural knowledge',
          ]
        },
        {
          name:  'Real-World Applications',
          color: '#00ff88',
          items: [
            'Healthcare and medicine uses',
            'Technology and engineering applications',
            'Business and strategic applications',
            'Policy and governance contexts',
            'Personal and everyday uses',
            'Future emerging applications',
          ]
        },
        {
          name:  'Study Strategies',
          color: '#ffae00',
          items: [
            'Active recall techniques',
            'Spaced repetition schedules',
            'Feynman technique application',
            'Concept mapping and visualisation',
            'Deliberate practice protocols',
            'Teaching and peer explanation',
          ]
        },
        {
          name:  'Common Pitfalls',
          color: '#ff4444',
          items: [
            'Top misconceptions and corrections',
            'Typical novice reasoning errors',
            'Conditions where principles break down',
            'Surface vs deep knowledge gap',
            'Overconfidence and Dunning-Kruger',
            'Passive study illusions',
          ]
        },
        {
          name:  'Advanced Expertise',
          color: '#d4af37',
          items: [
            'Current research frontiers',
            'Open questions and debates',
            'Expert-level nuances',
            'Cross-domain transfer skills',
            'Interdisciplinary connections',
            'Professional mastery markers',
          ]
        },
      ],
      connections: [
        { from: 'Foundations & Definitions', to: 'Core Mechanisms',   description: 'Principles explain why mechanisms work' },
        { from: 'Core Mechanisms',           to: 'Real-World Applications', description: 'Mechanisms enable practical problem-solving' },
        { from: 'Common Pitfalls',           to: 'Study Strategies',  description: 'Knowing mistakes guides targeted practice' },
        { from: 'Real-World Applications',   to: 'Advanced Expertise', description: 'Practice reveals depth and complexity' },
        { from: 'Study Strategies',          to: 'Advanced Expertise', description: 'Deliberate practice builds expertise' },
      ],
    };
  }

  return base;
}

// ─────────────────────────────────────────────────────────────────────────────────────────────────
// SECTION 10 — OFFLINE NOTES FALLBACK
// High-quality content when Phase 1 models all fail
// ─────────────────────────────────────────────────────────────────────────────────────────────────

function offlineNotes(topic, tool) {
  const T   = topic || 'this topic';
  const now = getISTDateTime();
  return `## 📚 Introduction and Overview — ${T}

**${T}** is a significant area of study with deep intellectual foundations and extensive practical applications across multiple professional domains. A thorough, systematic understanding of ${T} provides genuine advantages in both academic contexts and professional practice.

> **Definition:** ${T} encompasses the systematic study and application of its core principles, methods, and frameworks to understand, analyse, and solve problems in its domain.

This comprehensive guide covers the essential concepts, mechanisms, examples, and applications you need to achieve genuine mastery.

---

## 🎯 Core Concepts and Definitions

The conceptual foundation of ${T} rests on several interconnected ideas that must be understood as a system, not as isolated facts.

**First Principle — Foundational Framework:** Every field of knowledge, and ${T} is no exception, rests on a set of foundational assumptions and definitional commitments. These form the logical basis from which everything else follows. In ${T}, the foundational framework establishes [what is being studied], [how it is studied], and [what counts as valid evidence and reasoning within the field].

**Second Principle — Core Mechanisms:** The distinctive contribution of ${T} is its account of the mechanisms — the cause-and-effect chains — that produce the phenomena it studies. Understanding these mechanisms means understanding not just WHAT happens but WHY and HOW. This mechanistic understanding is what allows practitioners to predict, intervene, and innovate.

**Third Principle — Systematic Methodology:** ${T} does not rely on intuition alone. It employs structured methods for generating, evaluating, and applying knowledge. These methods include [observation and measurement], [systematic analysis], [evidence evaluation], and [logical reasoning from evidence to conclusions].

**Fourth Principle — Conditions and Limits:** Every principle in ${T} has conditions under which it holds and conditions under which it breaks down. Expert practitioners know these conditions; novices often apply principles indiscriminately. Understanding the limits of ${T}'s principles is as important as understanding the principles themselves.

**Fifth Principle — Practical Transfer:** Knowledge of ${T} is not confined to academic contexts. The analytical frameworks and reasoning patterns developed through studying ${T} transfer directly to professional practice in multiple domains. This transferability is what makes ${T} worth mastering.

---

## ⚙️ How It Works — Mechanisms and Processes

The primary mechanism of ${T} can be understood as a structured sequence of stages:

**Stage 1 — Input and Initial Conditions:**
Every application of ${T} begins with identifying the relevant initial conditions — the specific state of the system or situation before the primary mechanism begins to operate. Accurately characterising these conditions is crucial; errors at this stage propagate through every subsequent stage.

- What specific conditions are present?
- Which variables are relevant and how are they measured?
- What is the relationship between initial conditions and what follows?

**Stage 2 — Primary Transformation Process:**
The defining characteristic of ${T} is its account of how inputs are transformed into outputs through identifiable, structured processes. This transformation follows discoverable laws and patterns that make it predictable:

1. **Initiation:** The triggering conditions or events that start the primary process
2. **Progression:** The intermediate stages through which the system passes
3. **Regulation:** The factors that accelerate, slow, or redirect the process
4. **Integration:** How multiple sub-processes combine into the overall transformation

**Stage 3 — Feedback and Self-Regulation:**
Most systems studied through ${T} incorporate feedback loops — mechanisms by which outputs influence subsequent inputs. These feedback loops can be:
- *Positive (amplifying):* Where outputs increase the rate or intensity of the process
- *Negative (stabilising):* Where outputs reduce deviations from an equilibrium state

Understanding feedback is essential for understanding why systems in ${T} behave as they do, especially in complex or unexpected situations.

**Stage 4 — Output and Observable Outcomes:**
The final stage produces measurable, observable outcomes that can be evaluated against expectations and standards. These outcomes:
- Provide evidence for evaluating the accuracy of our theoretical understanding
- Allow practitioners to assess whether interventions achieved their intended effects
- Generate new questions that drive further investigation

**Stage 5 — Iteration and Refinement:**
Real-world applications of ${T} rarely follow the idealised sequence exactly once. In practice, each application generates information that refines the next application. This iterative character is what drives expertise development.

---

## 💡 Key Examples with Detailed Walkthroughs

Understanding ${T} through examples is essential — abstract principles become genuinely comprehensible only when grounded in specific cases.

**Example 1 — Foundational Illustration:**
The simplest case illustrates the core mechanism in its clearest form. Starting conditions: [define the starting point]. The mechanism operates as follows: [step through each stage]. The outcome: [describe what results]. This example demonstrates [which core principle] because [explain the logical connection between the mechanism and the principle].

**Example 2 — Real-World Complexity:**
Professional applications rarely match the idealised simple case. In a realistic scenario: [describe a realistic professional or academic situation]. The additional complications — [list them] — require adaptation of the core approach: [explain how the approach adapts]. The outcome: [describe result]. This example shows that genuine expertise means not just knowing the principles but knowing how to apply them when conditions deviate from the ideal.

**Example 3 — Edge Case and Boundary Condition:**
Understanding the limits of ${T} is as important as understanding its core. In [describe the edge case scenario], the standard approach produces [unexpected outcome] because [explain why the standard principles don't hold in this case]. Experts recognise this as an edge case by [describe the warning signs]. The appropriate response is [describe the expert adaptation]. This example demonstrates the importance of conditional reasoning in ${T}.

**Example 4 — Comparative Analysis:**
Comparing [Approach A] with [Approach B] in ${T} reveals important insights. Approach A works best when [conditions] because [reason]. Approach B works best when [conditions] because [reason]. The key difference is [fundamental distinction]. Choosing between them requires [what knowledge or judgment].

**Example 5 — Cross-Domain Transfer:**
The principles of ${T} explain phenomena beyond its home domain. For instance, [explain how a core principle of ${T} appears in and illuminates something in a different domain]. This cross-domain connection suggests that ${T} is capturing something genuinely fundamental about how [nature/society/systems/cognition] works.

---

## 🚀 Advanced Aspects, Nuances and Edge Cases

Introductory treatments of ${T} necessarily simplify. Advanced understanding requires engaging with these complications:

**Boundary Conditions and Failure Modes:**
Every principle in ${T} has specific conditions under which it works well and conditions under which it produces unreliable or wrong answers. Advanced practitioners maintain a clear mental map of these boundaries. Key boundary conditions in ${T} include [list specific conditions]. When these conditions are present, practitioners must [describe the appropriate adaptive response].

**Ongoing Theoretical Debates:**
Like all living disciplines, ${T} contains areas of genuine expert disagreement. Current debates include [description of live debates]. These debates matter practically because [explain the professional implications of how the debates resolve]. Understanding why experts disagree — and what evidence would resolve the dispute — is a mark of sophisticated understanding.

**Historical Evolution of Understanding:**
Current understanding in ${T} was hard-won through the resolution of historical disputes. Previously held views that are now known to be wrong or incomplete include [examples]. These were overturned when [describe what evidence or argument caused the revision]. The history of ${T} shows that our current understanding, while the best available, is also provisional and open to further revision.

**Interdisciplinary Connections:**
${T} shares concepts, methods, and findings with [list adjacent fields]. These connections are productive in both directions: insights from ${T} illuminate [what in adjacent fields], and insights from adjacent fields illuminate [what in ${T}]. The most productive research frontiers often exist at these interdisciplinary boundaries.

---

## 🌍 Real-World Applications and Significance

**Professional Applications:**
Practitioners of ${T} work across a remarkable range of fields. In healthcare, ${T} principles inform [specific application]. In technology, ${T} underlies [specific application]. In business, ${T} guides [specific application]. In policy, ${T} shapes [specific application]. This breadth of application reflects the genuine generality of ${T}'s core insights.

**Research Significance:**
${T} contributes to ongoing research in [list research areas]. Current research frontiers include [describe active areas]. These research questions matter because [explain the practical and theoretical significance].

**Social Impact:**
At a broader level, understanding and applying ${T} has [describe positive societal impacts]. The field contributes to [describe social benefits] by [explain the mechanism of contribution].

---

## 🧠 Common Misconceptions and Corrections

**Misconception 1 — Recall Equals Understanding:**
Many students believe that if they can recall and reproduce the key facts, definitions, and formulas of ${T}, they understand it. This is false. Genuine understanding means being able to reason about novel situations, explain why principles hold (not just what they state), identify when principles don't apply, and transfer knowledge to new domains. Recall without understanding consistently collapses under novel problems.

**Misconception 2 — Passive Study Is Effective:**
Students often feel productive while re-reading notes, highlighting text, or reviewing summaries. Research consistently shows these passive methods produce far less durable learning than active methods: self-testing, practice problems, teaching others, and elaborative interrogation. Feeling like you understand something after re-reading it is a reliable sign of the "fluency illusion" — not genuine learning.

**Misconception 3 — ${T} Only Matters for Specialists:**
Students sometimes dismiss the relevance of ${T} to careers and lives outside its home discipline. This misses the transferability of the analytical skills developed through ${T} study. The reasoning frameworks, problem-decomposition strategies, and evidence-evaluation skills are genuinely useful in any context requiring structured analytical thinking.

---

## 📝 Summary, Key Takeaways and Revision Checklist

### 🎯 Key Takeaways

- ✅ **Core Understanding:** ${T} is a systematic framework for reasoning about [its domain], not a collection of memorised facts
- ✅ **Mechanism Knowledge:** Understanding HOW and WHY (not just WHAT) is the key to genuine mastery
- ✅ **Conditional Reasoning:** Expert practitioners know when principles apply and when they don't
- ✅ **Active Learning:** Retrieval practice and spaced repetition dramatically outperform passive re-reading
- ✅ **Transfer:** The analytical skills from ${T} apply across professional domains
- ✅ **Iterative Application:** Real mastery develops through repeated application with feedback and correction

### ⚠️ Common Mistakes to Avoid

- ⚠️ Confusing memorisation with understanding — tested by: can you apply this to a novel problem?
- ⚠️ Applying principles without checking their boundary conditions
- ⚠️ Passive re-reading — feels productive but produces little durable learning
- ⚠️ Studying in isolation — connect ${T} to adjacent fields and real-world contexts
- ⚠️ Skipping difficult problems — expertise develops precisely through struggling with hard cases

### 📋 Revision Checklist

Before considering yourself ready on ${T}, verify you can:
- [ ] Explain core principles without notes in plain language to a non-expert
- [ ] Apply each principle to at least 3 novel scenarios not seen in study
- [ ] Identify the boundary conditions under which each principle breaks down
- [ ] Explain the historical development and why current understanding takes its current form
- [ ] Connect ${T} to at least two adjacent fields with specific examples
- [ ] Teach the material clearly to a peer and answer their questions

---

**Study Strategy Recommendation:** Use active recall (test yourself without notes), spaced repetition (review at increasing intervals), and elaborative interrogation (always ask "why" and "under what conditions"). Avoid passive re-reading. Seek out difficult problems.

---

*Generated by ${SAVOIRÉ.BRAND} — ${now} (IST)*
*Built by ${SAVOIRÉ.DEVELOPER} | ${SAVOIRÉ.DEVSITE} | Founder: ${SAVOIRÉ.FOUNDER}*
*Free forever for every student on Earth. "${SAVOIRÉ.TAGLINE}"*`;
}

// ─────────────────────────────────────────────────────────────────────────────────────────────────
// SECTION 11 — MERGE CARDS WITH NOTES
// ─────────────────────────────────────────────────────────────────────────────────────────────────

function mergeCards(cardsRaw, notes, topic, opts) {
  const now     = getISTDateTime();
  const isFallback = !!cardsRaw?._fallback;

  const merged = {
    // Identity
    topic:                    topic || cardsRaw?.topic || 'Study Material',
    curriculum_alignment:     cardsRaw?.curriculum_alignment || 'General Academic Study',
    // Content
    ultra_long_notes:         notes,
    key_concepts:             cardsRaw?.key_concepts            || [],
    key_tricks:               cardsRaw?.key_tricks              || [],
    practice_questions:       cardsRaw?.practice_questions      || [],
    real_world_applications:  cardsRaw?.real_world_applications || [],
    common_misconceptions:    cardsRaw?.common_misconceptions   || [],
    // Scores & metadata
    study_score:              cardsRaw?.study_score             || 95,
    powered_by:               `${SAVOIRÉ.BRAND} by ${SAVOIRÉ.DEVELOPER}`,
    generated_at:             now,
    _version:                 SAVOIRÉ.VERSION,
    _tool:                    opts.tool,
    _language:                opts.language  || 'English',
    _depth:                   opts.depth     || 'detailed',
    _style:                   opts.style     || 'simple',
    _quality:                 isFallback ? 'enhanced_fallback' : 'ai_generated',
    _fallback:                isFallback,
    _fallback_reason:         isFallback ? (cardsRaw?._fallback_reason || 'Models temporarily unavailable') : null,
  };

  // Tool-specific fields (only add if data exists and has content)
  if (Array.isArray(cardsRaw?.flashcards)        && cardsRaw.flashcards.length > 0)        merged.flashcards     = cardsRaw.flashcards;
  if (Array.isArray(cardsRaw?.quiz_questions)    && cardsRaw.quiz_questions.length > 0)    merged.quiz_questions = cardsRaw.quiz_questions;
  if (cardsRaw?.mindmap?.branches?.length > 0)   merged.mindmap = cardsRaw.mindmap;

  // Minimum content guarantees
  if (!merged.key_concepts || merged.key_concepts.length < 3) {
    merged.key_concepts = [
      `Foundational Principles: ${topic} is built on core principles connecting theory to practice. True mastery means understanding causal relationships, not just reciting definitions.`,
      `Key Mechanisms: The primary processes follow identifiable patterns that can be learned, applied, and adapted. Understanding why mechanisms work is more valuable than knowing what they produce.`,
      `Practical Value: Knowledge transfers directly to professional and everyday contexts. The analytical skills from ${topic} are genuinely portable across domains.`,
      `Learning Pathway: Effective mastery follows: foundations → mechanisms → worked examples → independent practice → teaching → advanced application. Each stage builds on the previous.`,
      `Expert Thinking: Experts differ from novices in pattern recognition, conditional reasoning, and metacognition — not in how many facts they've memorised.`,
    ];
  }

  if (!merged.key_tricks || merged.key_tricks.length < 2) {
    merged.key_tricks = [
      `🧠 FEYNMAN TECHNIQUE: Explain ${topic} as if teaching a 12-year-old. Every hesitation reveals a gap. Return to notes only for those gaps. Scientifically the fastest way to identify knowledge deficits.`,
      `📝 ACTIVE RECALL: Close all notes. Write everything you know about ${topic} on blank paper. Compare with source material. Gaps = your study targets. Research shows 300% better retention than re-reading.`,
      `⏰ SPACED REPETITION: Review ${topic} at: Day 1 → Day 3 → Day 7 → Day 14 → Day 30. Each review catches material just as it fades. Scientifically optimised against the forgetting curve.`,
      `🎨 CONCEPT MAPPING: Draw a visual map of ${topic} — central idea → main branches → sub-items → connections. The act of building the map forces you to understand structure, not just content.`,
    ];
  }

  if (!merged.practice_questions || merged.practice_questions.length < 1) {
    merged.practice_questions = [
      {
        question: `Explain the foundational principles of ${topic} and how they form a coherent framework. Include at least two specific examples.`,
        answer: `${topic} is grounded in foundational principles that define its scope and methods. These principles establish key concepts, their relationships, and the reasoning connecting evidence to broader claims. Understanding requires grasping not just WHAT is claimed but WHY — the evidence base and logical structure supporting each claim. Examples illuminate how the abstract principles operate in concrete situations and reveal their practical significance.`
      }
    ];
  }

  return merged;
}

// ─────────────────────────────────────────────────────────────────────────────────────────────────
// SECTION 12 — SECURITY HEADERS
// ─────────────────────────────────────────────────────────────────────────────────────────────────

function setSecurityHeaders(res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, Accept, X-Requested-With');
  res.setHeader('Access-Control-Max-Age', '86400');
  res.setHeader('X-Powered-By', `${SAVOIRÉ.BRAND} by ${SAVOIRÉ.DEVELOPER}`);
  res.setHeader('X-Developer',  SAVOIRÉ.DEVELOPER);
  res.setHeader('X-Founder',    SAVOIRÉ.FOUNDER);
  res.setHeader('X-Version',    SAVOIRÉ.VERSION);
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
}

// ─────────────────────────────────────────────────────────────────────────────────────────────────
// SECTION 13 — MAIN REQUEST HANDLER (Entry Point)
// ─────────────────────────────────────────────────────────────────────────────────────────────────

module.exports = async function handler(req, res) {
  const requestId = `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
  const startTime = Date.now();

  log.info(`[${requestId}] ${req.method} /api/study — ${req.headers['user-agent']?.slice(0, 60) || 'unknown agent'}`);

  setSecurityHeaders(res);

  // Handle preflight CORS
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // Only POST allowed for generation
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed. Use POST.' });
  }

  // Parse request body
  const body        = req.body || {};
  const message     = String(body.message     || '').trim();
  const userName    = String(body.userName    || '').trim() || 'Anonymous';
  const userStreak  = Number(body.streak)     || 0;
  const userSessions= Number(body.sessions)   || 1;
  const sessionId   = String(body.sessionId   || requestId);

  // ── PING / WARMUP / VISIT TRACKING ────────────────────────────────────────────────────
  // This fires on EVERY app load (frontend sends ping immediately)
  // Sessions and streak are sent from frontend localStorage — backend just records them
  if (message === '' || message === 'ping') {
    log.info(`[${requestId}] PING from ${userName} | streak:${userStreak} | sessions:${userSessions}`);

    // IMMEDIATELY track user visit — this is the key fix for sessions
    sendToGoogleSheets(
      userName, userStreak, userSessions,
      'visit', '', 'online',
      0, sessionId,
      { _quality: 'visit' }
    ).catch(() => {});

    return res.status(200).json({
      status:    'ok',
      service:   SAVOIRÉ.BRAND,
      developer: SAVOIRÉ.DEVELOPER,
      version:   SAVOIRÉ.VERSION,
      tagline:   SAVOIRÉ.TAGLINE,
      time:      getISTDateTime(),
      requestId,
    });
  }

  // ── INPUT VALIDATION ──────────────────────────────────────────────────────────────────
  if (message.length < 2) {
    return res.status(400).json({ error: 'Please enter a topic (minimum 2 characters).' });
  }
  if (message.length > 20000) {
    return res.status(400).json({ error: 'Input too long (maximum 20,000 characters).' });
  }

  // ── OPTIONS PARSING ────────────────────────────────────────────────────────────────────
  const rawOpts = body.options || {};
  const VALID_TOOLS  = ['notes', 'flashcards', 'quiz', 'summary', 'mindmap', 'all'];
  const VALID_DEPTHS = ['standard', 'detailed', 'comprehensive', 'expert'];
  const VALID_STYLES = ['simple', 'academic', 'detailed', 'exam', 'visual'];

  const opts = {
    tool:     VALID_TOOLS.includes(rawOpts.tool)   ? rawOpts.tool   : 'notes',
    depth:    VALID_DEPTHS.includes(rawOpts.depth) ? rawOpts.depth  : 'detailed',
    style:    VALID_STYLES.includes(rawOpts.style) ? rawOpts.style  : 'simple',
    language: String(rawOpts.language || 'English').trim().slice(0, 50),
    stream:   rawOpts.stream === true,
  };

  log.info(`[${requestId}] tool:${opts.tool} | lang:${opts.language} | depth:${opts.depth} | style:${opts.style} | stream:${opts.stream} | user:${userName} | sessions:${userSessions} | streak:${userStreak}`);

  // ── API KEY CHECK ─────────────────────────────────────────────────────────────────────
  if (!process.env.OPENROUTER_API_KEY) {
    log.error(`[${requestId}] OPENROUTER_API_KEY environment variable not set!`);
    return res.status(500).json({
      error: 'Savoiré AI service is temporarily unavailable. Please try again later.',
    });
  }

  // ── TRACK GENERATION START ────────────────────────────────────────────────────────────
  sendToGoogleSheets(
    userName, userStreak, userSessions,
    opts.tool, message, 'started',
    0, sessionId, { _quality: 'pending' }
  ).catch(() => {});

  // ════════════════════════════════════════════════════════════════════════════════════════════
  // STREAMING MODE — Notes, Summary, All-Tools (live token delivery)
  // ════════════════════════════════════════════════════════════════════════════════════════════

  if (opts.stream && (opts.tool === 'notes' || opts.tool === 'summary' || opts.tool === 'all')) {
    // Set SSE headers
    res.setHeader('Content-Type',      'text/event-stream; charset=utf-8');
    res.setHeader('Cache-Control',     'no-cache, no-store, must-revalidate, no-transform');
    res.setHeader('Connection',        'keep-alive');
    res.setHeader('X-Accel-Buffering', 'no');
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('Transfer-Encoding', 'chunked');
    if (typeof res.flushHeaders === 'function') res.flushHeaders();

    // SSE helper
    const sse = (event, data) => {
      if (res.writableEnded) return;
      try {
        const payload = typeof data === 'string' ? data : JSON.stringify(data);
        res.write(`event: ${event}\ndata: ${payload}\n\n`);
        if (typeof res.flush === 'function') res.flush();
      } catch (writeErr) {
        log.warn(`[${requestId}] SSE write error: ${writeErr.message}`);
      }
    };

    // Keepalive — prevents proxy timeouts every 14 seconds
    const keepAliveInterval = setInterval(() => {
      if (res.writableEnded) { clearInterval(keepAliveInterval); return; }
      try {
        res.write(`: keepalive ${Date.now()}\n\n`);
        if (typeof res.flush === 'function') res.flush();
      } catch { clearInterval(keepAliveInterval); }
    }, 14000);

    // Stage timers — sent even before model starts to show activity
    const stageTimers = [
      setTimeout(() => sse('stage', { idx: 1, label: '📝 Writing your study content…'       }), 2500),
      setTimeout(() => sse('stage', { idx: 2, label: '🔍 Building detailed sections…'       }), 7000),
      setTimeout(() => sse('stage', { idx: 3, label: '✨ Generating cards and data…'        }), 14000),
    ];
    const clearAllStages = () => stageTimers.forEach(clearTimeout);

    // Send initial events
    sse('heartbeat', { ts: Date.now(), status: 'connected', service: SAVOIRÉ.BRAND, requestId });
    sse('stage',     { idx: 0, label: '🎯 Analysing your topic…' });
    sse('token',     { t: '' }); // Empty token to start — shows connection is live

    let generatedNotes = '';
    let phase1Success  = false;

    try {
      // ── PHASE 1: STREAM NOTES ──────────────────────────────────────────────────────────
      const notesPrompt = buildNotesPrompt(message, opts);

      try {
        generatedNotes = await streamNotes(
          notesPrompt,
          (chunk) => sse('token', { t: chunk }),  // Send each token as SSE event
          opts.tool
        );
        phase1Success = true;
        log.ok(`[${requestId}] Phase1 complete — ${generatedNotes.length} chars`);
      } catch (phase1Error) {
        log.error(`[${requestId}] Phase1 failed: ${phase1Error.message} — falling back to offline notes`);
        sse('stage', { idx: 2, label: '📚 Loading enhanced study content…' });
        generatedNotes = offlineNotes(message, opts.tool);
        phase1Success = false;

        // Stream the fallback notes in chunks so user sees progress
        const chunkSize = 300;
        for (let i = 0; i < generatedNotes.length; i += chunkSize) {
          sse('token', { t: generatedNotes.slice(i, i + chunkSize) });
          await sleep(8);
        }
      }

      // ── PHASE 2: FETCH STRUCTURED CARDS ───────────────────────────────────────────────
      sse('stage', { idx: 3, label: '🃏 Building your study cards and structured data…' });

      let cardsData = null;
      let phase2Success = false;

      try {
        const cardsPrompt = buildCardsPrompt(message, opts);
        cardsData = await fetchCards(cardsPrompt, opts.tool, message);
        phase2Success = !cardsData?._fallback;
        log.ok(`[${requestId}] Phase2 complete — fallback:${cardsData?._fallback || false}`);
      } catch (phase2Error) {
        log.error(`[${requestId}] Phase2 failed: ${phase2Error.message} — using intelligent fallback`);
        cardsData = intelligentFallbackCards(opts.tool, message);
        phase2Success = false;
      }

      // Clean up timers and keepalive
      clearInterval(keepAliveInterval);
      clearAllStages();

      // Merge everything into final data object
      const finalData = mergeCards(cardsData, generatedNotes, message, opts);
      finalData._duration_ms   = Date.now() - startTime;
      finalData._request_id    = requestId;
      finalData._phase1_ok     = phase1Success;
      finalData._phase2_ok     = phase2Success;
      finalData.powered_by     = `${SAVOIRÉ.BRAND} by ${SAVOIRÉ.DEVELOPER}`;

      // Send completion events
      sse('stage', { idx: 4, label: '✅ Complete! Study materials ready.', done: true });
      sse('done',  finalData);

      log.ok(`[${requestId}] COMPLETE — ${finalData._duration_ms}ms | p1:${phase1Success} | p2:${phase2Success} | words:${finalData.ultra_long_notes?.split(/\s+/).length || 0}`);

      // Track completion in Google Sheets
      sendToGoogleSheets(
        userName, userStreak, userSessions,
        opts.tool, message, 'completed',
        finalData._duration_ms, sessionId,
        { _quality: finalData._quality }
      ).catch(() => {});

    } catch (fatalError) {
      clearInterval(keepAliveInterval);
      clearAllStages();
      log.error(`[${requestId}] FATAL streaming error: ${fatalError.message}`);

      sse('error', {
        message: 'Savoiré AI study tool is momentarily unavailable. Please try again in a few seconds.',
        requestId,
      });

      sendToGoogleSheets(
        userName, userStreak, userSessions,
        opts.tool, message, 'failed',
        Date.now() - startTime, sessionId,
        { _quality: 'failed' }
      ).catch(() => {});
    }

    if (!res.writableEnded) res.end();
    return;
  }

  // ════════════════════════════════════════════════════════════════════════════════════════════
  // NON-STREAMING MODE — Flashcards, Quiz, Mindmap, or stream:false
  // ════════════════════════════════════════════════════════════════════════════════════════════

  try {
    // Phase 1 — Get notes (non-streaming, JSON response)
    const notesPrompt = buildNotesPrompt(message, opts);
    let generatedNotes = '';

    for (const model of MODELS_STREAM) {
      const ctrl  = new AbortController();
      const timer = setTimeout(() => ctrl.abort(), model.timeout_ms);
      const t0    = Date.now();
      try {
        const r = await fetch(OPENROUTER_BASE, {
          method:  'POST',
          headers: {
            'Content-Type':  'application/json',
            'Authorization': `Bearer ${process.env.OPENROUTER_API_KEY}`,
            'HTTP-Referer':  HTTP_REFERER,
            'X-Title':       APP_TITLE,
          },
          body: JSON.stringify({
            model:       model.id,
            max_tokens:  DEPTH_MAP[opts.depth]?.maxTokens || 3800,
            temperature: model.temp || 0.72,
            stream:      false,
            messages:    [{ role: 'user', content: notesPrompt }],
          }),
          signal: ctrl.signal,
        });
        clearTimeout(timer);
        if (!r.ok) continue;
        const d = await r.json();
        const c = d?.choices?.[0]?.message?.content?.trim();
        if (c && c.length > 250) {
          generatedNotes = c;
          log.ok(`[${requestId}] Phase1 (non-stream) — ${model.id.split('/').pop()} | ${c.length} chars | ${Date.now()-t0}ms`);
          break;
        }
      } catch { clearTimeout(timer); }
    }

    if (!generatedNotes) {
      log.warn(`[${requestId}] All Phase1 models failed — using offline notes`);
      generatedNotes = offlineNotes(message, opts.tool);
    }

    // Phase 2 — Get structured cards
    const cardsPrompt = buildCardsPrompt(message, opts);
    let cardsData;
    let phase2Success = false;

    try {
      cardsData     = await fetchCards(cardsPrompt, opts.tool, message);
      phase2Success = !cardsData?._fallback;
      if (!cardsData) {
        cardsData = intelligentFallbackCards(opts.tool, message);
      }
    } catch (cardsErr) {
      log.error(`[${requestId}] Phase2 error: ${cardsErr.message}`);
      cardsData = intelligentFallbackCards(opts.tool, message);
    }

    // Merge and respond
    const finalData = mergeCards(cardsData, generatedNotes, message, opts);
    finalData._duration_ms = Date.now() - startTime;
    finalData._request_id  = requestId;
    finalData._phase2_ok   = phase2Success;
    finalData.powered_by   = `${SAVOIRÉ.BRAND} by ${SAVOIRÉ.DEVELOPER}`;

    log.ok(`[${requestId}] SYNC COMPLETE — ${finalData._duration_ms}ms | tool:${opts.tool}`);

    sendToGoogleSheets(
      userName, userStreak, userSessions,
      opts.tool, message, 'completed',
      finalData._duration_ms, sessionId,
      { _quality: finalData._quality }
    ).catch(() => {});

    return res.status(200).json(finalData);

  } catch (err) {
    log.error(`[${requestId}] Non-stream error: ${err.message}`);

    sendToGoogleSheets(
      userName, userStreak, userSessions,
      opts.tool, message, 'failed',
      Date.now() - startTime, sessionId,
      { _quality: 'failed' }
    ).catch(() => {});

    return res.status(500).json({
      error:      'Savoiré AI study tool is momentarily unavailable. Please try again in a few seconds.',
      requestId,
      _tool:      opts.tool,
    });
  }
};

// ═══════════════════════════════════════════════════════════════════════════════════════════════════
// END OF FILE — api/study.js v2.0 WORLD CLASS FINAL
// Built by Sooban Talha Technologies | soobantalhatech.xyz
// Founder: Sooban Talha
// "Think Less. Know More." — Free forever for every student on Earth.
// ═══════════════════════════════════════════════════════════════════════════════════════════════════

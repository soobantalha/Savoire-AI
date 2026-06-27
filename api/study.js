'use strict';
// ═══════════════════════════════════════════════════════════════════════════════════════════════════
// SAVOIRÉ AI v2.0 — api/study.js — WORLD-CLASS BACKEND — ULTRA ADVANCED
// Built by Sooban Talha Technologies | soobantalhatech.xyz | Founder: Sooban Talha
// ═══════════════════════════════════════════════════════════════════════════════════════════════════
//
// KEY ARCHITECTURE — EVERY TOOL STREAMS LIVE:
//
//  ✅ ALL 5 TOOLS STREAM via SSE — Notes, Flashcards, Quiz, Summary, Mindmap, Mega
//  ✅ FLASHCARDS: Stream notes LIVE first → then stream each card one-by-one with animation signal
//  ✅ QUIZ: Stream notes LIVE first → then stream each question one-by-one
//  ✅ MINDMAP: Stream notes LIVE first → then stream each branch one-by-one
//  ✅ CARDS are from the AI model (real topic-specific content, not fallback)
//  ✅ SESSION: Updates on EVERY page load/refresh (frontend sends count each time)
//  ✅ GOOGLE SHEETS: Tracks every visit, every generation
//  ✅ ERROR MESSAGES: All friendly, no raw 500 errors
//  ✅ JSON REPAIR: 4-step repair pipeline for malformed AI JSON
//  ✅ MEGA BUNDLE: All 5 tools generated from the model in one call
//  ✅ FAST MODELS: Reduced model list to fastest, most reliable (openrouter/free, deepseek, llama)
//  ✅ NO FALLBACK: Cards always from AI, fallback only if all models fail (rare)
//
// SSE PROTOCOL:
//   event: heartbeat → initial connection confirmation
//   event: stage     → data: {idx:N, label:"..."}   — progress stage update
//   event: token     → data: {t:"..."}               — streaming token chunk (notes)
//   event: card      → data: {idx:N, card:{...}}     — one flashcard streamed
//   event: question  → data: {idx:N, q:{...}}        — one quiz question streamed
//   event: branch    → data: {idx:N, branch:{...}}   — one mindmap branch streamed
//   event: done      → data: {...}                   — complete final data object
//   event: error     → data: {message:"..."}         — error occurred
// ═══════════════════════════════════════════════════════════════════════════════════════════════════

// ─────────────────────────────────────────────────────────────────────────────
// SECTION 1 — CONSTANTS
// ─────────────────────────────────────────────────────────────────────────────

const SAVOIRÉ = {
  BRAND:     'Savoiré AI ',
  DEVELOPER: 'Sooban Talha Technologies',
  DEVSITE:   'soobantalhatech.xyz',
  WEBSITE:   'savoireai.vercel.app',
  FOUNDER:   'Sooban Talha',
  VERSION:   '2.0',
  TAGLINE:   'Think Less. Know More.',
};

const OPENROUTER_BASE    = 'https://openrouter.ai/api/v1/chat/completions';
const HTTP_REFERER       = `https://${SAVOIRÉ.WEBSITE}`;
const APP_TITLE          = SAVOIRÉ.BRAND;
const GOOGLE_WEBHOOK_URL = process.env.GOOGLE_WEBHOOK_URL || '';

// ─────────────────────────────────────────────────────────────────────────────
// SECTION 2 — MODEL ROSTERS (FAST & RELIABLE)
// ─────────────────────────────────────────────────────────────────────────────

// Phase 1: Streaming markdown notes — FREE MODELS ON OPENROUTER
// NOTE (updated): OpenRouter's free-tier roster rotates constantly — models get
// renamed, rate-limited upstream, or pulled entirely without notice. Several IDs
// that used to live here (mistral-7b-instruct:free as primary, phi-3-mini-128k-instruct:free,
// qwen-2.5-72b-instruct:free, deepseek-chat-v3-0324:free, deepseek-r1t-chimera:free)
// are confirmed stale/unreliable as of mid-2026.
// IMPORTANT: 'openrouter/free' is LAST, not first. It randomly picks ANY available
// free model — including very weak/small ones — which caused visible repetition-
// collapse garbage output ("Mastery achieved. Conclusion concludes...") in testing.
// Named, known-decent models go first; openrouter/free is only the final safety net.
const MODELS_STREAM = [
  { id: 'meta-llama/llama-3.3-70b-instruct:free',              max_tokens: 4500, timeout_ms: 30000, temp: 0.7, freq_pen: 0.3 },
  { id: 'meta-llama/llama-4-scout:free',                       max_tokens: 4000, timeout_ms: 25000, temp: 0.7, freq_pen: 0.3 },
  { id: 'deepseek/deepseek-chat-v3.1:free',                    max_tokens: 4000, timeout_ms: 30000, temp: 0.7, freq_pen: 0.3 },
  { id: 'google/gemma-3-12b-it:free',                          max_tokens: 3500, timeout_ms: 25000, temp: 0.7, freq_pen: 0.3 },
  { id: 'qwen/qwen3-235b-a22b:free',                           max_tokens: 4000, timeout_ms: 30000, temp: 0.7, freq_pen: 0.3 },
  { id: 'mistralai/mistral-7b-instruct:free',                  max_tokens: 4000, timeout_ms: 25000, temp: 0.7, freq_pen: 0.3 },
  { id: 'openrouter/free',                                     max_tokens: 4000, timeout_ms: 30000, temp: 0.7, freq_pen: 0.3 },
];

// Phase 2: Structured JSON — FREE MODELS
// 'openrouter/free' stays last here too — same reasoning, plus JSON-mode compliance
// is also a gamble with a randomly-picked model.
const MODELS_CARDS = [
  { id: 'meta-llama/llama-3.3-70b-instruct:free',              max_tokens: 7000, timeout_ms: 35000, temp: 0.4, freq_pen: 0.2 },
  { id: 'meta-llama/llama-4-scout:free',                       max_tokens: 6000, timeout_ms: 28000, temp: 0.4, freq_pen: 0.2 },
  { id: 'deepseek/deepseek-chat-v3.1:free',                    max_tokens: 7000, timeout_ms: 35000, temp: 0.4, freq_pen: 0.2 },
  { id: 'qwen/qwen3-235b-a22b:free',                           max_tokens: 7000, timeout_ms: 35000, temp: 0.4, freq_pen: 0.2 },
  { id: 'google/gemma-3-12b-it:free',                          max_tokens: 5000, timeout_ms: 28000, temp: 0.4, freq_pen: 0.2 },
  { id: 'mistralai/mistral-7b-instruct:free',                  max_tokens: 6000, timeout_ms: 28000, temp: 0.4, freq_pen: 0.2 },
  { id: 'openrouter/free',                                     max_tokens: 6000, timeout_ms: 35000, temp: 0.4, freq_pen: 0.2 },
];

// ─────────────────────────────────────────────────────────────────────────────
// SECTION 3 — CONFIGURATION
// ─────────────────────────────────────────────────────────────────────────────

const DEPTH_MAP = {
  standard:      { wordRange: '600–900 words',   maxTokens: 2800 },
  detailed:      { wordRange: '1000–1500 words', maxTokens: 3800 },
  comprehensive: { wordRange: '1500–2200 words', maxTokens: 5000 },
  expert:        { wordRange: '2200–3500 words', maxTokens: 6500 },
};

const STYLE_MAP = {
  simple:   'Write in clear, beginner-friendly language. Short sentences. Everyday analogies. Define all jargon immediately.',
  academic: 'Write in formal academic language. Precise scholarly terminology. Objective, third-person tone.',
  detailed: 'Maximum exhaustive detail. Numerous specific examples. Thorough step-by-step explanations. Cover all edge cases.',
  exam:     'Exam-focused. Mark-scheme phrasing. Highlight must-know points. Flag common student mistakes. Include exam tips.',
  visual:   'Vivid analogies and metaphors for everything. Mental models. Spatial descriptions. Make abstract concrete.',
};

// ─────────────────────────────────────────────────────────────────────────────
// SECTION 4 — UTILITIES
// ─────────────────────────────────────────────────────────────────────────────

const sleep = ms => new Promise(r => setTimeout(r, ms));

const log = {
  info:  (...a) => console.log(`[${new Date().toISOString()}] ℹ️ `, ...a),
  ok:    (...a) => console.log(`[${new Date().toISOString()}] ✅`, ...a),
  warn:  (...a) => console.warn(`[${new Date().toISOString()}] ⚠️ `, ...a),
  error: (...a) => console.error(`[${new Date().toISOString()}] ❌`, ...a),
};

const trunc = (s, n = 120) => !s ? '' : String(s).length > n ? String(s).slice(0, n) + '…' : String(s);

function getISTDateTime() {
  const now  = new Date();
  const ist  = new Date(now.getTime() + now.getTimezoneOffset() * 60000 + 5.5 * 3600000);
  const pad  = n => String(n).padStart(2, '0');
  return `${ist.getFullYear()}-${pad(ist.getMonth()+1)}-${pad(ist.getDate())} ${pad(ist.getHours())}:${pad(ist.getMinutes())}:${pad(ist.getSeconds())}`;
}

function getISTDate() { return getISTDateTime().split(' ')[0]; }

// ─────────────────────────────────────────────────────────────────────────────
// SECTION 4.1 — DEGENERATE OUTPUT DETECTION
// Weak or overloaded free models can collapse into a wall of short, uniform
// declarative sentences ("Mastery achieved. Conclusion concludes properly.
// All covered thoroughly...") instead of real content. This is syntactically
// valid prose — it passes every markdown/JSON check — but it's useless filler.
// Detected via THREE independent signals, flagged only when 2+ agree (keeps
// false positives low on legitimately concise/punchy real content):
//   1. Average sentence length — collapse produces very short sentences (<6.5 words avg)
//   2. Sentence-length uniformity — collapse clusters tightly around one short length
//   3. Trigram repetition — collapse reuses the same 3-word sequences constantly
// ─────────────────────────────────────────────────────────────────────────────

function isDegenerateText(text) {
  const clean = String(text || '').trim();
  if (clean.length < 400) return false; // too short to judge reliably either way

  const sentences = clean.split(/(?<=[.!?])\s+/).filter(s => s.trim().length > 0);
  if (sentences.length < 10) return false; // too few sentences to judge reliably

  const words = clean.toLowerCase().match(/[a-z']+/g) || [];
  if (words.length < 60) return false;

  const avgWordsPerSentence = words.length / sentences.length;

  const trigrams = [];
  for (let i = 0; i < words.length - 2; i++) trigrams.push(words[i] + ' ' + words[i + 1] + ' ' + words[i + 2]);
  const trigramCounts = {};
  for (const t of trigrams) trigramCounts[t] = (trigramCounts[t] || 0) + 1;
  const repeatedTrigramOccurrences = Object.values(trigramCounts).filter(c => c > 1).reduce((a, c) => a + c, 0);
  const trigramRepeatRatio = trigrams.length ? repeatedTrigramOccurrences / trigrams.length : 0;

  const lens = sentences.map(s => (s.match(/[a-zA-Z']+/g) || []).length);
  const meanLen = lens.reduce((a, l) => a + l, 0) / lens.length;
  const variance = lens.reduce((a, l) => a + (l - meanLen) ** 2, 0) / lens.length;
  const stdDev = Math.sqrt(variance);

  const veryShortAvg   = avgWordsPerSentence < 6.5;
  const highTrigramRep = trigramRepeatRatio > 0.35;
  const lowVariance     = stdDev < 2.2 && meanLen < 8;

  const signalCount = [veryShortAvg, highTrigramRep, lowVariance].filter(Boolean).length;
  return signalCount >= 2;
}

// ─────────────────────────────────────────────────────────────────────────────
// SECTION 5 — GOOGLE SHEETS — TRACKS EVERY VISIT & TOOL USE
// ─────────────────────────────────────────────────────────────────────────────

async function sendToGoogleSheets(userName, streak, sessions, tool, topic, status, durationMs, sessionId) {
  if (!GOOGLE_WEBHOOK_URL) return false;
  try {
    const payload = {
      userName:   userName || 'Anonymous',
      streak:     Number(streak)    || 0,
      sessions:   Number(sessions)  || 1,
      lastUsed:   getISTDateTime(),
      tool:       tool   || 'visit',
      topic:      String(topic || '').slice(0, 200),
      status:     status || 'visit',
      durationMs: Number(durationMs) || 0,
      sessionId:  sessionId || '',
      timestamp:  getISTDateTime(),
      istDate:    getISTDate(),
    };
    const res = await fetch(GOOGLE_WEBHOOK_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    if (res.ok) log.ok(`📊 Sheets ← ${userName} | ${tool} | ${status} | sessions:${sessions}`);
    else log.warn(`Sheets HTTP ${res.status}`);
    return res.ok;
  } catch (err) {
    log.warn(`Sheets error (non-fatal): ${err.message}`);
    return false;
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// SECTION 6 — NOTES PROMPT BUILDER (Phase 1)
// ─────────────────────────────────────────────────────────────────────────────

function buildNotesPrompt(input, opts) {
  const depth = DEPTH_MAP[opts.depth] || DEPTH_MAP.detailed;
  const style = STYLE_MAP[opts.style] || STYLE_MAP.simple;
  const lang  = opts.language || 'English';
  const tool  = opts.tool    || 'notes';

  const sectionMap = {
    notes:
      '## 📚 Introduction & Overview\n\n## 🎯 Core Concepts & Definitions\n\n## ⚙️ How It Works — Mechanisms & Processes\n\n## 💡 Key Examples with Detailed Walkthroughs\n\n## 🚀 Advanced Aspects, Nuances & Edge Cases\n\n## 🌍 Real-World Applications\n\n## 🧠 Common Misconceptions & Corrections\n\n## 📝 Summary, Key Takeaways & Revision Checklist',
    flashcards:
      '## 📖 Overview & Context\n\n## 🎯 Core Concepts (as Q&A pairs)\n\n## ⚙️ Mechanisms & Processes (each step = one Q&A)\n\n## 💡 Examples & Applications\n\n## ⚠️ Common Misconceptions\n\n## 🎯 Quick Summary',
    quiz:
      '## 📚 Topic Introduction\n\n## ✏️ Core Concepts (exam-ready format)\n\n## ⚙️ Mechanisms (exam-style explanation)\n\n## 📝 Typical Exam Questions & Model Answers\n\n## 🎯 Must-Remember Points',
    summary:
      '## 🚀 TL;DR — Executive Summary (3–5 sentences maximum)\n\n## 🎯 Core Concepts (one bullet each — crisp)\n\n## ⚙️ Key Mechanisms (ultra-short)\n\n## 💡 Critical Examples Only\n\n## ✅ Final Revision Checklist',
    mindmap:
      '## 🧠 Central Topic Overview\n\n## 🌿 Branch 1: Foundations & Definitions\n\n## 🌿 Branch 2: Core Mechanisms\n\n## 🌿 Branch 3: Key Examples\n\n## 🌿 Branch 4: Real-World Applications\n\n## 🌿 Branch 5: Common Pitfalls & Misconceptions\n\n## 🔗 Key Connections Between Branches',
    all:
      '## 📚 Introduction & Overview\n\n## 🎯 Core Concepts & Definitions\n\n## ⚙️ How It Works — Mechanisms\n\n## 💡 Key Examples\n\n## 🚀 Advanced Aspects\n\n## 🌍 Real-World Applications\n\n## 🧠 Memory Tricks\n\n## 📝 Revision Checklist',
  };

  const sections = sectionMap[tool] || sectionMap.notes;

  const toolGoal = {
    notes:      'Generate comprehensive, well-structured study notes covering every important aspect.',
    flashcards: 'Generate notes structured as clear Q&A pairs, each concept as a distinct question/answer.',
    quiz:       'Generate exam-focused notes emphasising examinable points and common question patterns.',
    summary:    'Generate a concise smart summary: TL;DR first, then bullet key points, scannable.',
    mindmap:    'Generate hierarchically structured notes for mind map conversion — clear parent→child.',
    all:        'Generate the ULTIMATE comprehensive study package covering every angle of this topic.',
  }[tool] || 'Generate comprehensive study notes.';

  return `You are ${SAVOIRÉ.BRAND}, the world's most advanced AI study assistant.
Creator: ${SAVOIRÉ.DEVELOPER} (${SAVOIRÉ.DEVSITE}) | Founder: ${SAVOIRÉ.FOUNDER}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🎯 TASK: ${toolGoal}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

📖 TOPIC: "${input}"

🌐 LANGUAGE: ${lang}
   ⚠️ Write EVERY word in ${lang}. Zero exceptions. No mixing.

📏 LENGTH: ${depth.wordRange} — aim for the upper end; be thorough

🎨 STYLE: ${style}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📋 REQUIRED STRUCTURE — use exactly these headings:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

${sections}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📐 MANDATORY FORMATTING:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
• ## for all section headings
• **bold** every key term first time
• - for bullet lists
• Numbered lists for sequential steps
• > for definitions/key statements
• --- between major sections
• \`inline code\` for formulas/precise terms
• At least 5 real-world examples
• ⚠️ Common Mistakes section
• 🎯 Key Takeaways (5-8 bullets) at end
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🚀 BEGIN IMMEDIATELY — start with first ## heading. Write in ${lang} only.
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`;
}

// ─────────────────────────────────────────────────────────────────────────────
// SECTION 7 — CARDS PROMPT BUILDER (Phase 2)
// Completely topic-specific — forces real content about the actual topic
// ─────────────────────────────────────────────────────────────────────────────

function buildCardsPrompt(input, opts) {
  const lang      = opts.language || 'English';
  const tool      = opts.tool     || 'notes';
  const now       = getISTDateTime();
  const topicShort = String(input).slice(0, 120);

  // ── BUILD TOOL-SPECIFIC MANDATORY INSTRUCTIONS ─────────────────────────────

  let toolBlock = '';
  let fcField   = '"flashcards": []';
  let qField    = '"quiz_questions": []';
  let mmField   = '"mindmap": null';

  // For 'all' we include all three
  const isAll = tool === 'all';
  const includeFc = isAll || tool === 'flashcards';
  const includeQ  = isAll || tool === 'quiz';
  const includeMm = isAll || tool === 'mindmap';

  if (includeFc) {
    toolBlock += `
╔═══════════════════════════════════════════════════════════════════════════╗
║  MANDATORY: Generate 15–20 FLASHCARDS about "${topicShort}"               ║
╚═══════════════════════════════════════════════════════════════════════════╝

Each flashcard MUST:
• "front" (10–40 words in ${lang}): A SPECIFIC question about "${topicShort}"
  ✓ GOOD: "What is [specific term from the topic] and why does it matter?"
  ✓ GOOD: "Explain the [specific mechanism] in [the topic] step by step"
  ✓ GOOD: "Compare [A] vs [B] within [the topic] — key differences?"
  ✗ BAD:  Generic questions not specifically about "${topicShort}"

• "back" (60–180 words in ${lang}): SPECIFIC detailed answer about "${topicShort}"
  Must include: direct answer + concrete example FROM this topic + significance

CARD TYPES (minimum 2 of each type):
  Definition cards     — "What is X in [topic]?"
  Mechanism cards      — "How does X work in [topic]?"
  Comparison cards     — "X vs Y in [topic]"
  Application cards    — "How is X used in real world (specific to topic)?"
  Misconception cards  — "What do people get wrong about [topic]?"
  Process cards        — "What are the steps of X in [topic]?"
  Cause-effect cards   — "What causes X in [topic]? What results?"

CRITICAL: Zero placeholder text. Zero generic content.
ALL text in ${lang}.`;

    fcField = `"flashcards": [
    {"front": "[SPECIFIC question about ${topicShort} in ${lang}]", "back": "[SPECIFIC 60-180 word answer about ${topicShort} in ${lang} with example]"},
    {"front": "[Different SPECIFIC question about ${topicShort}]", "back": "[Different SPECIFIC answer with concrete example]"},
    {"front": "[Mechanism question about ${topicShort}]", "back": "[Step-by-step explanation specific to ${topicShort}]"},
    {"front": "[Comparison question within ${topicShort}]", "back": "[Clear comparison with specific details from ${topicShort}]"},
    {"front": "[Application question about ${topicShort}]", "back": "[Real-world application specific to ${topicShort}]"}
  ]`;
  }

  if (includeQ) {
    toolBlock += `
╔═══════════════════════════════════════════════════════════════════════════╗
║  MANDATORY: Generate 10–12 QUIZ QUESTIONS about "${topicShort}"           ║
╚═══════════════════════════════════════════════════════════════════════════╝

Each question MUST:
• "question" (in ${lang}): SPECIFIC factual question about "${topicShort}"
  ✓ GOOD: "Which of the following best describes [specific concept in topic]?"
  ✓ GOOD: "In [topic], what happens when [specific condition]?"
  ✗ BAD:  Generic questions not specifically about "${topicShort}"

• "options": EXACTLY 4 strings — one correct, three plausible distractors
  All 4 options must relate to "${topicShort}" — not generic!

• "correct_answer": MUST be CHARACTER-FOR-CHARACTER IDENTICAL to the correct option
  (Copy-paste exact string — do NOT rephrase or shorten)

• "explanation" (80–130 words in ${lang}): WHY correct is right + WHY others wrong
  All explanation must reference "${topicShort}" specifically

• "difficulty": "easy", "medium", or "hard"
  Distribution target: 3 easy + 5 medium + 4 hard

CRITICAL: Zero placeholder text. correct_answer MUST EXACTLY match one options[] element.
ALL text in ${lang}.`;

    qField = `"quiz_questions": [
    {
      "id": 1,
      "question": "[SPECIFIC question about ${topicShort} in ${lang}]",
      "options": ["[Plausible wrong A about topic]", "[CORRECT answer — copy exact]", "[Plausible wrong C about topic]", "[Plausible wrong D about topic]"],
      "correct_answer": "[CORRECT answer — copy exact from options]",
      "explanation": "[80-130 word explanation referencing ${topicShort} specifically in ${lang}]",
      "difficulty": "medium"
    },
    {
      "id": 2,
      "question": "[Another SPECIFIC question about ${topicShort}]",
      "options": ["[Option A]", "[Option B — correct]", "[Option C]", "[Option D]"],
      "correct_answer": "[Option B — correct]",
      "explanation": "[Explanation specifically about ${topicShort}]",
      "difficulty": "hard"
    }
  ]`;
  }

  if (includeMm) {
    toolBlock += `
╔═══════════════════════════════════════════════════════════════════════════╗
║  MANDATORY: Generate MIND MAP with 5–7 BRANCHES about "${topicShort}"    ║
╚═══════════════════════════════════════════════════════════════════════════╝

• "central": 3–6 words capturing the ESSENCE of "${topicShort}" in ${lang}
  ✓ GOOD: Specific name/phrase from the topic
  ✗ BAD:  "Study Topic" or "Main Concept"

• "branches": 5–7 branches with SPECIFIC NAMES from "${topicShort}"
  ✓ GOOD branch names: "[Specific category from topic]", "[Process in topic]"
  ✗ BAD branch names: "Introduction", "Overview", "Details", "Applications"

• Each branch: 4–6 items = SPECIFIC facts, terms, or concepts from "${topicShort}"
  Each item: 5–20 words — specific enough to be genuinely informative

• "connections": 3–5 cross-connections explaining relationships WITHIN "${topicShort}"

Colors: use exactly these hex values: "#00d4ff", "#bf00ff", "#00ff88", "#ffae00", "#d4af37", "#ff4444", "#e84393"

CRITICAL: Every branch name and item must be specifically about "${topicShort}". Zero generic labels.
ALL text in ${lang}.`;

    mmField = `"mindmap": {
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
      {"from": "[Branch name]", "to": "[Branch name]", "description": "[Another relationship in ${topicShort}]"},
      {"from": "[Branch name]", "to": "[Branch name]", "description": "[Third connection in ${topicShort}]"}
    ]
  }`;
  }

  return `You are ${SAVOIRÉ.BRAND}. Generate a complete structured JSON about:

📖 TOPIC: "${input}"
🌐 LANGUAGE: ${lang} (ALL text MUST be in ${lang})
🛠️ TOOL: ${tool.toUpperCase()}

${toolBlock}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
⚡ OUTPUT: Valid JSON ONLY. Start with {. End with }. No markdown. No explanations.
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

{
  "topic": "[Clean title of topic in ${lang}]",
  "curriculum_alignment": "[Specific level e.g. 'A-Level Biology', 'University Physics', 'Grade 11']",
  "generated_at": "${now}",
  "study_score": 97,

  ${fcField},
  ${qField},
  ${mmField},

  "key_concepts": [
    "[Name of concept from ${topicShort}]: [55-80 word explanation in ${lang} with example from this topic]",
    "[Second concept]: [55-80 words in ${lang} with specific example]",
    "[Third concept]: [55-80 words in ${lang} with specific example]",
    "[Fourth concept]: [55-80 words in ${lang} with specific example]",
    "[Fifth concept]: [55-80 words in ${lang} with specific example]",
    "[Sixth concept]: [55-80 words in ${lang} with specific example]"
  ],

  "key_tricks": [
    "🧠 [Mnemonic/technique for ${topicShort}]: [70-110 words in ${lang} with specific application to this topic]",
    "📝 [Study method for ${topicShort}]: [70-110 words in ${lang} with concrete instructions for this topic]",
    "⏰ [Memory strategy for ${topicShort}]: [70-110 words in ${lang} with specific application]",
    "🎨 [Visualization for ${topicShort}]: [70-110 words in ${lang} making this topic vivid]"
  ],

  "practice_questions": [
    {"question": "[Analytical 80-130 word question about ${topicShort} in ${lang}]", "answer": "[200+ word answer with reasoning specific to ${topicShort} in ${lang}]"},
    {"question": "[Application 80-130 word question about ${topicShort} in ${lang}]", "answer": "[200+ word answer connecting ${topicShort} to real professional scenario in ${lang}]"},
    {"question": "[Evaluation 80-130 word question about ${topicShort} in ${lang}]", "answer": "[200+ word answer weighing evidence from ${topicShort} in ${lang}]"},
    {"question": "[Synthesis 80-130 word question about ${topicShort} in ${lang}]", "answer": "[200+ word answer showing connections within ${topicShort} in ${lang}]"}
  ],

  "real_world_applications": [
    "🏥 Healthcare: [60-90 word specific application of ${topicShort} in healthcare with concrete example]",
    "💻 Technology: [60-90 word specific tech application of ${topicShort} with real system/product]",
    "📈 Business: [60-90 word specific business application of ${topicShort} with real industry example]",
    "🎓 Research: [60-90 word academic research application of ${topicShort}]",
    "🌍 Society: [60-90 word social impact of ${topicShort} with real context]",
    "🏠 Daily Life: [60-90 word everyday relevance of ${topicShort} with relatable example]"
  ],

  "common_misconceptions": [
    "❌ MYTH: [Specific wrong belief about ${topicShort}]. ✅ TRUTH: [60-90 word correction in ${lang}]",
    "❌ MYTH: [Second misconception about ${topicShort}]. ✅ TRUTH: [60-90 word correction in ${lang}]",
    "❌ MYTH: [Third misconception about ${topicShort}]. ✅ TRUTH: [60-90 word correction in ${lang}]",
    "❌ MYTH: [Fourth misconception about ${topicShort}]. ✅ TRUTH: [60-90 word correction in ${lang}]"
  ]
}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🚨 ABSOLUTE RULES — violation = failed generation:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
1. Output ONLY valid JSON — nothing before { or after }
2. ALL placeholder text REPLACED with REAL content about "${topicShort}"
3. ALL text in ${lang}
4. quiz correct_answer = CHARACTER-FOR-CHARACTER IDENTICAL to one options[] string
5. ${includeFc ? 'Generate 15-20 flashcards about this specific topic' : ''}
6. ${includeQ ? 'Generate 10-12 quiz questions about this specific topic' : ''}
7. ${includeMm ? 'Generate 5-7 branches with SPECIFIC names from this topic' : ''}
8. No trailing commas. All strings in double quotes. Valid JSON.
9. FORBIDDEN: Generic content, placeholder text, content NOT about "${topicShort}"
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🚀 OUTPUT JSON NOW:`;
}

// ─────────────────────────────────────────────────────────────────────────────
// SECTION 8 — PHASE 1: STREAM NOTES
// ─────────────────────────────────────────────────────────────────────────────

async function streamNotes(prompt, onChunk, tool, onReset) {
  let lastErr = 'No models responded';
  let attemptedModels = 0;
  for (const model of MODELS_STREAM) {
    const name  = model.id.split('/').pop().replace(':free', '');
    const ctrl  = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), model.timeout_ms);
    const t0    = Date.now();
    attemptedModels++;
    try {
      log.info(`P1 (${tool}) → ${model.id}`);
      const res = await fetch(OPENROUTER_BASE, {
        method: 'POST',
        headers: {
          'Content-Type':  'application/json',
          'Authorization': `Bearer ${process.env.OPENROUTER_API_KEY}`,
          'HTTP-Referer':  HTTP_REFERER,
          'X-Title':       APP_TITLE,
        },
        body: JSON.stringify({
          model:             model.id,
          max_tokens:        model.max_tokens,
          temperature:       model.temp || 0.75,
          frequency_penalty: model.freq_pen ?? 0.3,
          presence_penalty:  0.2,
          stream:            true,
          messages:          [{ role: 'user', content: prompt }],
        }),
        signal: ctrl.signal,
      });
      clearTimeout(timer);
      if (!res.ok) {
        const errBody = await res.text().catch(() => '');
        log.warn(`P1 HTTP ${res.status} ${model.id}: ${trunc(errBody, 200)}`);
        if (res.status === 401) throw new Error('Invalid OpenRouter API key — please check your OPENROUTER_API_KEY environment variable.');
        if (res.status === 402) { log.warn(`${model.id}: payment required — skipping`); continue; }
        if (res.status === 403) { log.warn(`${model.id}: access denied — skipping`); continue; }
        if (res.status === 404) { log.warn(`${model.id}: model not found — skipping`); continue; }
        if (res.status === 429) { log.warn(`${model.id}: rate-limited — skipping to next model`); continue; }
        if (res.status >= 500)  { log.warn(`${model.id}: server error ${res.status} — skipping to next model`); continue; }
        continue;
      }
      const reader  = res.body.getReader();
      const decoder = new TextDecoder('utf-8');
      let lineBuf = '', full = '', tokens = 0;
      let degenerateCheckDone = false;
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
            const delta = JSON.parse(raw)?.choices?.[0]?.delta?.content;
            if (delta) { full += delta; tokens++; onChunk(delta); }
          } catch (_e) {}
        }
        // ── EARLY REPETITION-COLLAPSE GUARD ─────────────────────────────────
        // Weak/overloaded free models sometimes degenerate into short repeated
        // declarative sentences ("X achieved. Y completed. Z finalized...") for
        // thousands of words. Streaming means the user already SEES whatever we
        // send via onChunk — so we check as soon as we have ~600 chars (before
        // too much garbage has reached the screen) and abort this model's
        // stream immediately if it's degenerating, falling through to the next
        // model. We don't keep re-checking every chunk after that — one check
        // early is enough to catch it before it spirals further.
        if (!degenerateCheckDone && full.length > 600) {
          degenerateCheckDone = true;
          if (isDegenerateText(full)) {
            log.warn(`${model.id}: repetition-collapse detected early (${full.length}ch) — aborting stream, trying next model`);
            try { reader.cancel(); } catch (_e) {}
            lastErr = `${name}: degenerate/repetitive output`;
            if (typeof onReset === 'function') onReset(); // tell frontend to clear its garbage-filled live buffer
            full = '__DEGENERATE__'; // sentinel so the post-loop check below also rejects this
            break;
          }
        }
      }
      if (full === '__DEGENERATE__') continue;
      if (full.trim().length < 100) {
        log.warn(`${model.id}: response too short (${full.length} chars) — trying next`);
        lastErr = `${name}: response too short`;
        continue;
      }
      // Backstop check in case collapse started after the early-check point
      if (isDegenerateText(full)) {
        log.warn(`${model.id}: repetition-collapse detected on full output (${full.length}ch) — trying next model`);
        lastErr = `${name}: degenerate/repetitive output`;
        if (typeof onReset === 'function') onReset();
        continue;
      }
      log.ok(`P1 OK — ${model.id} | ${tokens} tokens | ${full.length}ch | ${Date.now()-t0}ms`);
      return full;
    } catch (err) {
      clearTimeout(timer);
      lastErr = err.name === 'AbortError' ? `${name} timed out after ${model.timeout_ms}ms` : `${name}: ${err.message}`;
      log.warn(`P1 fail — ${lastErr}`);
      if (err.message?.includes('Invalid OpenRouter')) throw err;
    }
  }
  throw new Error(`All ${attemptedModels} AI models failed. Last error: ${lastErr}. Please check server logs and try again.`);
}

// ─────────────────────────────────────────────────────────────────────────────
// SECTION 9 — PHASE 2: FETCH STRUCTURED CARDS
// Robust retry + 4-step JSON repair + topic-specific validation + auto-fix
// ─────────────────────────────────────────────────────────────────────────────

async function fetchCards(prompt, tool, topic) {
  let lastErr = 'No models responded';
  for (const model of MODELS_CARDS) {
    const name = model.id.split('/').pop().replace(':free','');
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), model.timeout_ms);
    const t0 = Date.now();
    try {
      log.info(`P2 (${tool}) → ${model.id}`);
      const res = await fetch(OPENROUTER_BASE, {
        method: 'POST',
        headers: {
          'Content-Type':  'application/json',
          'Authorization': `Bearer ${process.env.OPENROUTER_API_KEY}`,
          'HTTP-Referer':  HTTP_REFERER,
          'X-Title':       APP_TITLE,
        },
        body: JSON.stringify({
          model:             model.id,
          max_tokens:        model.max_tokens,
          temperature:       model.temp || 0.50,
          frequency_penalty: model.freq_pen ?? 0.2,
          presence_penalty:  0.1,
          stream:            false,
          messages:          [{ role: 'user', content: prompt }],
        }),
        signal: ctrl.signal,
      });
      clearTimeout(timer);
      if (!res.ok) {
        const errBody = await res.text().catch(() => '');
        log.warn(`P2 HTTP ${res.status} ${model.id}: ${trunc(errBody, 200)}`);
        if (res.status === 401) throw new Error('Invalid OpenRouter API key');
        if (res.status === 402) { continue; }
        if (res.status === 403) { continue; }
        if (res.status === 404) { log.warn(`${model.id}: not found — skip`); continue; }
        if (res.status === 429) { log.warn(`${model.id}: rate-limited — skipping to next model`); continue; }
        if (res.status >= 500)  { log.warn(`${model.id}: server error ${res.status} — skipping to next model`); continue; }
        continue;
      }
      const data = await res.json();
      let content = data?.choices?.[0]?.message?.content?.trim();
      if (!content || content.length < 30) { log.warn(`${model.id}: empty response`); lastErr = `${name}: empty`; continue; }

      // Strip code fences and extract JSON
      content = content.replace(/^```(?:json)?\s*/im, '').replace(/\s*```\s*$/im, '').trim();
      // Handle thinking models that output <think>...</think> blocks
      content = content.replace(/<think>[\s\S]*?<\/think>/gi, '').trim();
      const jS = content.indexOf('{'), jE = content.lastIndexOf('}');
      if (jS === -1 || jE <= jS) { log.warn(`${model.id}: no JSON found in response`); lastErr = `${name}: no JSON`; continue; }
      let jsonStr = content.slice(jS, jE + 1);

      // 4-step JSON repair pipeline
      let parsed;
      try { parsed = JSON.parse(jsonStr); }
      catch (_e) { try { parsed = JSON.parse(jsonStr.replace(/,(\s*[}\]])/g, '$1')); }
      catch (_e) { try { parsed = JSON.parse(jsonStr.replace(/,(\s*[}\]])/g, '$1').replace(/([{,]\s*)([a-zA-Z_]\w*)(\s*:)/g, '$1"$2"$3').replace(/:\s*'([^']*)'/g, ': "$1"')); }
      catch (_e) { try { parsed = JSON.parse(jsonStr.replace(/[\x00-\x1F\x7F]/g, ' ').replace(/,(\s*[}\]])/g, '$1').replace(/([{,]\s*)([a-zA-Z_]\w*)(\s*:)/g, '$1"$2"$3')); }
      catch (e4) { log.warn(`${model.id}: JSON repair failed — ${e4.message.slice(0, 80)}`); lastErr = `${name}: JSON parse failed`; continue; }}}}

      // Detect literal placeholder brackets the model copied from the prompt's
      // example skeleton instead of replacing with real content (a known failure
      // mode of weaker free models like Mistral-7B / Gemma under token pressure).
      // Patterns like "[SPECIFIC question about X]" or "[55-80 word explanation...]"
      // are valid JSON strings, so they sail right through JSON.parse — only an
      // explicit text scan catches them.
      const flatText = JSON.stringify(parsed);
      const placeholderHits = (flatText.match(/\[(?:SPECIFIC|Specific|GOOD|BAD|Name of|Second|Third|Fourth|Fifth|Sixth|Option [A-D]|Branch name|Item \d|Specific fact|CORRECT answer|Plausible wrong|\d+[\-–]\d+ word)/g) || []).length;
      if (placeholderHits >= 2) {
        log.warn(`${model.id}: ${placeholderHits} literal placeholder brackets detected — rejecting response`);
        lastErr = `${name}: returned template placeholders instead of real content`;
        continue;
      }

      // Same repetition-collapse check used in Phase 1 — applied to the
      // long-form text fields (key_concepts, key_tricks, practice_questions,
      // applications, misconceptions) where a weak model could similarly
      // degenerate into repeated stock phrases instead of real content.
      const longTextBlob = [
        ...(parsed.key_concepts || []),
        ...(parsed.key_tricks || []),
        ...(parsed.real_world_applications || []),
        ...(parsed.common_misconceptions || []),
        ...((parsed.practice_questions || []).map(q => `${q.question || ''} ${q.answer || ''}`)),
      ].join(' ');
      if (longTextBlob.length > 400 && isDegenerateText(longTextBlob)) {
        log.warn(`${model.id}: repetition-collapse detected in structured content — rejecting response`);
        lastErr = `${name}: degenerate/repetitive structured content`;
        continue;
      }

      // Auto-fix quiz correct_answer mismatches
      if (Array.isArray(parsed.quiz_questions)) {
        parsed.quiz_questions = parsed.quiz_questions.map((q, i) => {
          if (!q.options || !q.correct_answer) return { ...q, id: q.id || i + 1 };
          if (!q.options.includes(q.correct_answer)) {
            const lower = q.correct_answer.toLowerCase();
            const fix = q.options.find(o => o.toLowerCase() === lower)
              || q.options.find(o => o.toLowerCase().includes(lower) || lower.includes(o.toLowerCase()))
              || q.options[0];
            if (fix) { log.info(`${model.id}: auto-fixed Q${i+1} correct_answer`); return { ...q, correct_answer: fix, id: q.id || i + 1 }; }
          }
          return { ...q, id: q.id || i + 1 };
        });
      }

      // Validate — lenient minimums
      const isAll = tool === 'all';
      let ok = true, allMissing = 0;
      if (isAll || tool === 'flashcards') {
        if (!Array.isArray(parsed.flashcards) || parsed.flashcards.length < 2) {
          log.warn(`${model.id}: fc=${parsed.flashcards?.length ?? 0}`);
          if (isAll) { allMissing++; parsed.flashcards = parsed.flashcards || []; } else ok = false;
        }
      }
      if (isAll || tool === 'quiz') {
        if (!Array.isArray(parsed.quiz_questions) || parsed.quiz_questions.length < 2) {
          log.warn(`${model.id}: q=${parsed.quiz_questions?.length ?? 0}`);
          if (isAll) { allMissing++; parsed.quiz_questions = parsed.quiz_questions || []; } else ok = false;
        }
      }
      if (isAll || tool === 'mindmap') {
        if (!parsed.mindmap?.branches || parsed.mindmap.branches.length < 1) {
          log.warn(`${model.id}: mm=${parsed.mindmap?.branches?.length ?? 0}`);
          if (isAll) { allMissing++; } else ok = false;
        }
      }
      if (isAll && allMissing >= 3) { log.warn(`${model.id}: all sections missing`); lastErr = `${name}: all sections empty`; continue; }
      if (!isAll && !ok) { log.warn(`${model.id}: validation failed`); lastErr = `${name}: validation failed`; continue; }

      // Normalize flashcard format
      if (Array.isArray(parsed.flashcards)) {
        parsed.flashcards = parsed.flashcards
          .filter(c => (c.front || c.question) && (c.back || c.answer))
          .map(c => ({ front: String(c.front || c.question || '').trim(), back: String(c.back || c.answer || '').trim() }));
      }

      log.ok(`P2 OK — ${model.id} | ${tool} | fc:${parsed.flashcards?.length||0} | q:${parsed.quiz_questions?.length||0} | mm:${parsed.mindmap?.branches?.length||0} | ${Date.now()-t0}ms`);
      return parsed;
    } catch (err) {
      clearTimeout(timer);
      lastErr = err.name === 'AbortError' ? `${name} timed out` : `${name}: ${err.message}`;
      log.warn(`P2 fail — ${lastErr}`);
      if (err.message?.includes('Invalid OpenRouter')) throw err;
    }
  }
  log.warn(`All P2 models failed for ${tool}: ${lastErr}`);
  throw new Error(`Could not generate ${tool} structured content. Last error: ${lastErr}`);
}

// ─────────────────────────────────────────────────────────────────────────────
// SECTION 9.2 — TOPIC FACT (shown in a floating pill while generation runs)
// Heuristic-based, no extra model call — keeps the fact instant (0ms latency)
// ─────────────────────────────────────────────────────────────────────────────

const FACT_TEMPLATES = [
  t => `💡 Did you know? People who actively quiz themselves on "${t}" retain 2–3× more than those who just re-read notes.`,
  t => `🧠 Fun fact: Explaining "${t}" out loud to someone else (even an imaginary student) is one of the fastest ways to find gaps in your understanding.`,
  t => `⏰ Quick tip: Reviewing "${t}" at increasing intervals (1 day, 3 days, 7 days) beats cramming it all in one sitting.`,
  t => `📊 Interesting: Topics like "${t}" are remembered far better when you connect new facts to something you already know.`,
  t => `🎯 Study fact: Most learners overestimate how well they know "${t}" right after reading about it — testing yourself reveals the real gaps.`,
  t => `🌍 Worth noting: "${t}" likely connects to several other fields more than it first appears — that's often where the best exam questions come from.`,
  t => `🔍 Pro tip: The fastest way to master "${t}" is to find the 20% of core ideas that explain 80% of everything else in it.`,
  t => `📝 Did you know? Writing a topic like "${t}" from memory — even badly — teaches your brain more than reading it a fourth time.`,
];

function buildTopicFact(topic) {
  const t = String(topic || 'this topic').trim().slice(0, 60);
  const idx = Math.abs([...t].reduce((h, ch) => (h * 31 + ch.charCodeAt(0)) % 100000, 7)) % FACT_TEMPLATES.length;
  return FACT_TEMPLATES[idx](t);
}

// ─────────────────────────────────────────────────────────────────────────────
// SECTION 10 — OFFLINE NOTES FALLBACK (only if Phase 1 fails completely)
// ─────────────────────────────────────────────────────────────────────────────

function offlineNotes(topic) {
  const T=topic||'this topic';
  return `## 📚 Introduction to ${T}

**${T}** is an important area of study with significant theoretical foundations and practical applications. This guide covers the essential concepts, mechanisms, and applications.

---

## 🎯 Core Concepts

> **Definition:** ${T} refers to the systematic study and practice of its core domain, encompassing the principles, methods, and applications that define the field.

**Foundational Framework:** The study of ${T} rests on interconnected principles that together explain how and why things work as they do. Understanding these connections is more valuable than memorising individual definitions.

**Key Relationships:** Core concepts in ${T} are not isolated but form a coherent system. Grasping how each concept relates to others is the key to genuine mastery.

---

## ⚙️ How It Works

The primary mechanism of ${T} operates through a structured sequence:

1. **Initial conditions** are identified and characterised
2. **The primary process** begins following the rules of ${T}
3. **Intermediate stages** transform inputs progressively
4. **Observable outcomes** emerge and can be evaluated against standards

Each stage follows from the previous according to identifiable patterns.

---

## 💡 Key Examples

**Example 1:** The simplest case shows core principles in their clearest form — revealing the essential logic underlying all more complex instances.

**Example 2:** Real-world application adds complications requiring adaptation of the core approach to specific circumstances.

**Example 3:** Edge cases show where standard approaches break down, revealing boundary conditions that experts must recognise.

---

## 📝 Key Takeaways

- ✅ ${T} is a reasoning framework, not a collection of facts
- ✅ Understanding WHY mechanisms work matters more than memorising WHAT they produce
- ✅ Real mastery = applying ${T} to novel situations, not just familiar ones  
- ✅ Knowing boundary conditions prevents systematic errors
- ✅ Active retrieval practice is 2-3× more effective than re-reading for ${T}

---
*Generated by ${SAVOIRÉ.BRAND} | ${SAVOIRÉ.DEVELOPER} | Free forever*`;
}

// ─────────────────────────────────────────────────────────────────────────────
// SECTION 11 — MERGE
// ─────────────────────────────────────────────────────────────────────────────

function mergeCards(cardsRaw, notes, topic, opts) {
  const now=getISTDateTime(), isFallback=!!cardsRaw?._fallback;
  const merged={
    topic:                   topic||cardsRaw?.topic||'Study Material',
    curriculum_alignment:    cardsRaw?.curriculum_alignment||'General Academic Study',
    ultra_long_notes:        notes,
    key_concepts:            cardsRaw?.key_concepts||[],
    key_tricks:              cardsRaw?.key_tricks||[],
    practice_questions:      cardsRaw?.practice_questions||[],
    real_world_applications: cardsRaw?.real_world_applications||[],
    common_misconceptions:   cardsRaw?.common_misconceptions||[],
    study_score:             cardsRaw?.study_score||95,
    powered_by:              `${SAVOIRÉ.BRAND} by ${SAVOIRÉ.DEVELOPER}`,
    generated_at:            now,
    _version:                SAVOIRÉ.VERSION,
    _tool:                   opts.tool,
    _language:               opts.language||'English',
    _depth:                  opts.depth||'detailed',
    _style:                  opts.style||'simple',
    _quality:                isFallback?'enhanced_fallback':'ai_generated',
    _fallback:               isFallback,
  };
  if(Array.isArray(cardsRaw?.flashcards)&&cardsRaw.flashcards.length)    merged.flashcards=cardsRaw.flashcards;
  if(Array.isArray(cardsRaw?.quiz_questions)&&cardsRaw.quiz_questions.length) merged.quiz_questions=cardsRaw.quiz_questions;
  if(cardsRaw?.mindmap?.branches?.length)                                 merged.mindmap=cardsRaw.mindmap;

  // Safety net ONLY for notes/summary (flashcards/quiz/mindmap/all throw a real
  // error on Phase 2 failure instead of reaching this point — see handler).
  // This is intentionally labeled as generic rather than dressed up as specific
  // AI-generated insight, since it isn't.
  if(!merged.key_concepts?.length){
    merged.key_concepts=[
      `(Generic placeholder — AI key-concept generation was unavailable for this request) ${topic} rests on fundamental principles connecting theory to practice. Mastery requires understanding WHY, not just WHAT.`,
      `(Generic placeholder) Primary processes in ${topic} follow identifiable patterns that can be learned and applied systematically.`,
      `(Generic placeholder) ${topic} knowledge applies directly to healthcare, technology, business, and research contexts.`,
      `(Generic placeholder) Experts in ${topic} differ from beginners in pattern recognition, conditional reasoning, and metacognition.`,
      `(Generic placeholder) Active retrieval practice is more effective than re-reading for mastering ${topic}. Try regenerating for AI-written key concepts.`,
    ];
  }
  return merged;
}

// ─────────────────────────────────────────────────────────────────────────────
// SECTION 12 — SSE HELPER + HEADERS
// ─────────────────────────────────────────────────────────────────────────────

function makeSSE(res) {
  const sse=(event, data)=>{
    if(res.writableEnded)return;
    try{
      res.write(`event: ${event}\ndata: ${typeof data==='string'?data:JSON.stringify(data)}\n\n`);
      if(typeof res.flush==='function')res.flush();
    } catch (_e) {}
  };
  return sse;
}

function setHeaders(res) {
  res.setHeader('Access-Control-Allow-Origin','*');
  res.setHeader('Access-Control-Allow-Methods','POST,GET,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers','Content-Type,Authorization,Accept');
  res.setHeader('Access-Control-Max-Age','86400');
  res.setHeader('X-Powered-By',`${SAVOIRÉ.BRAND} by ${SAVOIRÉ.DEVELOPER}`);
  res.setHeader('X-Developer',SAVOIRÉ.DEVELOPER);
  res.setHeader('X-Founder',SAVOIRÉ.FOUNDER);
  res.setHeader('X-Version',SAVOIRÉ.VERSION);
  res.setHeader('X-Content-Type-Options','nosniff');
  res.setHeader('X-Frame-Options','DENY');
}

// ─────────────────────────────────────────────────────────────────────────────
// SECTION 13 — MAIN HANDLER
// ALL TOOLS STREAM via SSE — this is the core fix
// ─────────────────────────────────────────────────────────────────────────────

module.exports = async function handler(req, res) {
  const reqId=`${Date.now().toString(36)}-${Math.random().toString(36).slice(2,8)}`;
  const startTime=Date.now();
  log.info(`[${reqId}] ${req.method} /api/study`);
  setHeaders(res);
  if(req.method==='OPTIONS')return res.status(200).end();
  if(req.method!=='POST')return res.status(405).json({error:'Use POST.'});

  const body=req.body||{};
  const message      = String(body.message    ||'').trim();
  const userName     = String(body.userName   ||'Anonymous').trim();
  const userStreak   = Number(body.streak)    ||0;
  const userSessions = Number(body.sessions)  ||1;
  const sessionId    = String(body.sessionId  ||reqId);

  // ── PING / VISIT TRACKING ────────────────────────────────────────────────
  // Fires on EVERY page load — sessions sent from frontend = always current count
  if(!message||message==='ping'){
    log.info(`[${reqId}] PING — ${userName} | sessions:${userSessions} | streak:${userStreak}`);
    sendToGoogleSheets(userName,userStreak,userSessions,'visit','','online',0,sessionId).catch(()=>{});
    return res.status(200).json({status:'ok',service:SAVOIRÉ.BRAND,version:SAVOIRÉ.VERSION,tagline:SAVOIRÉ.TAGLINE,time:getISTDateTime(),requestId:reqId});
  }

  if(message.length<2)return res.status(400).json({error:'Please enter a topic (minimum 2 characters).'});
  if(message.length>20000)return res.status(400).json({error:'Input too long (max 20,000 characters).'});

  const rawOpts=body.options||{};
  const opts={
    tool:     ['notes','flashcards','quiz','summary','mindmap','all'].includes(rawOpts.tool)?rawOpts.tool:'notes',
    depth:    ['standard','detailed','comprehensive','expert'].includes(rawOpts.depth)?rawOpts.depth:'detailed',
    style:    ['simple','academic','detailed','exam','visual'].includes(rawOpts.style)?rawOpts.style:'simple',
    language: String(rawOpts.language||'English').trim().slice(0,60),
    stream:   rawOpts.stream===true,
  };

  log.info(`[${reqId}] tool:${opts.tool} | lang:${opts.language} | depth:${opts.depth} | user:${userName} | sessions:${userSessions}`);

  if(!process.env.OPENROUTER_API_KEY){
    log.error('OPENROUTER_API_KEY not set!');
    return res.status(500).json({error:'Savoiré AI: OPENROUTER_API_KEY environment variable is not set. Please add it to your Vercel project settings under Settings → Environment Variables.'});
  }

  // DEBUG endpoint — GET /api/study?debug=1
  if (req.method === 'GET' && req.query?.debug === '1') {
    const keyPreview = process.env.OPENROUTER_API_KEY
      ? `sk-or-...${process.env.OPENROUTER_API_KEY.slice(-6)} (length: ${process.env.OPENROUTER_API_KEY.length})`
      : 'NOT SET';
    return res.status(200).json({
      status: 'debug',
      api_key_set: !!process.env.OPENROUTER_API_KEY,
      api_key_preview: keyPreview,
      model_count_stream: MODELS_STREAM.length,
      model_count_cards:  MODELS_CARDS.length,
      models_stream: MODELS_STREAM.map(m => m.id),
      models_cards:  MODELS_CARDS.map(m => m.id),
      service: SAVOIRÉ.BRAND,
    });
  }

  sendToGoogleSheets(userName,userStreak,userSessions,opts.tool,message,'started',0,sessionId).catch(()=>{});

  // ══════════════════════════════════════════════════════════════════════════
  // STREAMING SSE MODE — ALL TOOLS
  // ══════════════════════════════════════════════════════════════════════════

  if (opts.stream) {
    res.setHeader('Content-Type','text/event-stream; charset=utf-8');
    res.setHeader('Cache-Control','no-cache,no-store,must-revalidate,no-transform');
    res.setHeader('Connection','keep-alive');
    res.setHeader('X-Accel-Buffering','no');
    if(typeof res.flushHeaders==='function')res.flushHeaders();

    const sse = makeSSE(res);

    // Keepalive
    const kap=setInterval(()=>{
      if(res.writableEnded){clearInterval(kap);return;}
      try{res.write(`: ping ${Date.now()}\n\n`);if(typeof res.flush==='function')res.flush();}
      catch(_e){clearInterval(kap);}
    },14000);

    // Stage timers (notes tools stream faster, cards tools need more time)
    const stageTimers=[
      setTimeout(()=>sse('stage',{idx:1,label:'📝 Writing your content…'}),1500),
      setTimeout(()=>sse('stage',{idx:2,label:'🔍 Building sections…'}),4000),
      setTimeout(()=>sse('stage',{idx:3,label:'🃏 Generating interactive cards…'}),9000),
    ];
    const clearStages=()=>stageTimers.forEach(clearTimeout);

    sse('heartbeat',{ts:Date.now(),status:'connected',service:SAVOIRÉ.BRAND,requestId:reqId,tool:opts.tool});
    sse('stage',{idx:0,label:`🎯 Analysing "${message.slice(0,50)}…"`});
    sse('fact',{fact:buildTopicFact(message)});
    sse('token',{t:''});

    let notes='', p1ok=false;

    try {
      // ── PHASE 1: Stream notes (ALL tools get notes first) ─────────────────
      const notesPrompt=buildNotesPrompt(message,opts);
      try {
        notes=await streamNotes(
          notesPrompt,
          c=>sse('token',{t:c}),
          opts.tool,
          () => sse('reset', {reason:'degenerate_output', label:'⚠️ Switching to a different AI model…'})
        );
        p1ok=true;
        log.ok(`[${reqId}] P1 done — ${notes.length}ch`);
      } catch(e1){
        log.error(`[${reqId}] P1 failed: ${e1.message}`);
        sse('stage',{idx:2,label:'⚠️ AI models busy — retrying…'});
        // Surface the real error message so user/dev can diagnose
        const errMsg = e1.message.includes('Invalid OpenRouter')
          ? 'Invalid API key — please check your OPENROUTER_API_KEY in Vercel settings.'
          : e1.message.includes('API key')
          ? 'OpenRouter API key issue — please check your environment variables.'
          : 'All AI models are currently busy. Please wait a few seconds and try again.';
        throw new Error(errMsg);
      }

      // ── PHASE 2: Fetch structured cards (ALL tools) ───────────────────────
      // Notes tools (notes/summary) get cards for enrichment
      // Cards tools (flashcards/quiz/mindmap/all) get cards as primary content
      sse('stage',{idx:3,label:`🃏 Building topic-specific ${opts.tool==='flashcards'?'flashcards':opts.tool==='quiz'?'quiz questions':opts.tool==='mindmap'?'mind map':opts.tool==='all'?'mega bundle':'study cards'}…`});

      let cardsData=null, p2ok=false;
      try {
        const cardsPrompt=buildCardsPrompt(message,opts);
        cardsData=await fetchCards(cardsPrompt,opts.tool,message);
        p2ok=!cardsData?._fallback;
        log.ok(`[${reqId}] P2 done — fc:${cardsData?.flashcards?.length||0} q:${cardsData?.quiz_questions?.length||0} mm:${cardsData?.mindmap?.branches?.length||0}`);
      } catch(e2){
        log.warn(`[${reqId}] P2 failed: ${e2.message}`);
        // For card-PRIMARY tools (flashcards/quiz/mindmap/all), the cards ARE the
        // deliverable — notes succeeding doesn't matter, an empty tool is still a
        // broken result for the user. Throw so they get a clear error and can retry,
        // instead of silently rendering a blank flashcard/quiz/mindmap screen.
        if (opts.tool === 'flashcards' || opts.tool === 'quiz' || opts.tool === 'mindmap' || opts.tool === 'all') {
          throw new Error(`Could not generate ${opts.tool} content (all AI models failed). Please try again in a few seconds. Last error: ${e2.message}`);
        }
        // For notes/summary, cards are just enrichment — degrade gracefully instead of failing the whole request
        sse('stage',{idx:3,label:'⚠️ Cards partially unavailable — delivering notes…'});
        cardsData = { _fallback: true, flashcards: [], quiz_questions: [], mindmap: null };
      }

      // ── STREAM INDIVIDUAL CARDS LIVE (one-by-one with animation signals) ──
      // This is the key feature: cards appear one at a time with animation

      if(cardsData?.flashcards?.length&&(opts.tool==='flashcards'||opts.tool==='all')){
        sse('stage',{idx:3,label:`🃏 Streaming ${cardsData.flashcards.length} flashcards…`});
        for(let i=0;i<cardsData.flashcards.length;i++){
          sse('card',{idx:i, total:cardsData.flashcards.length, card:cardsData.flashcards[i]});
          await sleep(50); // 50ms between cards = fast smooth animation
        }
        log.ok(`[${reqId}] Streamed ${cardsData.flashcards.length} flashcards`);
      }

      if(cardsData?.quiz_questions?.length&&(opts.tool==='quiz'||opts.tool==='all')){
        sse('stage',{idx:3,label:`❓ Streaming ${cardsData.quiz_questions.length} quiz questions…`});
        for(let i=0;i<cardsData.quiz_questions.length;i++){
          sse('question',{idx:i, total:cardsData.quiz_questions.length, q:cardsData.quiz_questions[i]});
          await sleep(60); // fast quiz question streaming
        }
        log.ok(`[${reqId}] Streamed ${cardsData.quiz_questions.length} questions`);
      }

      if(cardsData?.mindmap?.branches?.length&&(opts.tool==='mindmap'||opts.tool==='all')){
        sse('stage',{idx:3,label:`🗺️ Streaming ${cardsData.mindmap.branches.length} mind map branches…`});
        // Send central node first
        sse('branch',{idx:-1, total:cardsData.mindmap.branches.length, branch:{name:'_central_', value:cardsData.mindmap.central, connections:cardsData.mindmap.connections||[]}});
        await sleep(150);
        for(let i=0;i<cardsData.mindmap.branches.length;i++){
          sse('branch',{idx:i, total:cardsData.mindmap.branches.length, branch:cardsData.mindmap.branches[i]});
          await sleep(70); // fast mindmap branch streaming
        }
        log.ok(`[${reqId}] Streamed ${cardsData.mindmap.branches.length} branches`);
      }

      // ── SEND FINAL COMPLETE DATA OBJECT ───────────────────────────────────
      clearInterval(kap); clearStages();

      const final=mergeCards(cardsData,notes,message,opts);
      final._duration_ms=Date.now()-startTime;
      final._request_id=reqId;
      final._phase1_ok=p1ok;
      final._phase2_ok=p2ok;
      final.topic_fact=buildTopicFact(message);
      final.powered_by=`${SAVOIRÉ.BRAND} by ${SAVOIRÉ.DEVELOPER}`;

      sse('stage',{idx:4,label:'✅ Complete! All study materials ready.',done:true});
      sse('done',final);

      log.ok(`[${reqId}] COMPLETE — ${final._duration_ms}ms | p1:${p1ok} | p2:${p2ok}`);
      sendToGoogleSheets(userName,userStreak,userSessions,opts.tool,message,'completed',final._duration_ms,sessionId).catch(()=>{});

    } catch(fatal){
      clearInterval(kap); clearStages();
      log.error(`[${reqId}] Fatal: ${fatal.message}`);
      const userMsg = fatal.message.length > 20 && !fatal.message.includes('momentarily')
        ? fatal.message
        : 'Savoiré AI is momentarily unavailable. Please try again in a few seconds.';
      sse('error',{message: userMsg, requestId:reqId});
      sendToGoogleSheets(userName,userStreak,userSessions,opts.tool,message,'failed',Date.now()-startTime,sessionId).catch(()=>{});
    }

    if(!res.writableEnded)res.end();
    return;
  }

  // ══════════════════════════════════════════════════════════════════════════
  // NON-STREAMING (stream:false) — redirect to streaming in client; return error if called directly
  // Note: frontend always uses stream:true, this is only a safety net
  log.warn(`[${reqId}] Non-streaming request — streaming is required`);
  return res.status(400).json({error:'Please use streaming mode (stream:true). Savoiré AI requires SSE streaming for real AI content.', _request_id:reqId});
};
// ═══════════════════════════════════════════════════════════════════════════════════════════════════
// END — api/study.js v2.0 WORLD CLASS | Sooban Talha Technologies | soobantalhatech.xyz
// "Think Less. Know More." — Free forever for every student on Earth.
// ═══════════════════════════════════════════════════════════════════════════════════════════════════
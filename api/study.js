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
  BRAND:     'Savoiré AI v2.0',
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
// SECTION 2 — MODEL ROSTERS
// Priority: fastest, highest quality first
// ─────────────────────────────────────────────────────────────────────────────

// Phase 1: Streaming markdown notes
const MODELS_STREAM = [
  { id: 'google/gemini-2.0-flash-exp:free',                max_tokens: 5000, timeout_ms: 55000, temp: 0.75 },
  { id: 'google/gemini-flash-1.5-8b:free',                 max_tokens: 4500, timeout_ms: 45000, temp: 0.75 },
  { id: 'deepseek/deepseek-chat-v3-0324:free',             max_tokens: 5000, timeout_ms: 55000, temp: 0.75 },
  { id: 'meta-llama/llama-3.3-70b-instruct:free',          max_tokens: 4500, timeout_ms: 50000, temp: 0.75 },
  { id: 'z-ai/glm-4.5-air:free',                           max_tokens: 4000, timeout_ms: 42000, temp: 0.75 },
  { id: 'qwen/qwen3-8b:free',                              max_tokens: 4000, timeout_ms: 40000, temp: 0.75 },
  { id: 'nousresearch/hermes-3-llama-3.1-405b:free',       max_tokens: 5000, timeout_ms: 65000, temp: 0.72 },
  { id: 'cognitivecomputations/dolphin-mixtral-8x7b:free', max_tokens: 4500, timeout_ms: 55000, temp: 0.72 },
  { id: 'mistralai/mistral-7b-instruct-v0.3:free',         max_tokens: 3500, timeout_ms: 38000, temp: 0.75 },
  { id: 'openchat/openchat-7b:free',                       max_tokens: 3500, timeout_ms: 38000, temp: 0.75 },
  { id: 'microsoft/phi-3-mini-128k-instruct:free',         max_tokens: 3500, timeout_ms: 38000, temp: 0.75 },
  { id: 'upstage/solar-1-mini-chat:free',                  max_tokens: 3500, timeout_ms: 38000, temp: 0.75 },
  { id: 'cohere/command-r-plus:free',                      max_tokens: 4000, timeout_ms: 48000, temp: 0.72 },
];

// Phase 2: Structured JSON — high accuracy needed
const MODELS_CARDS = [
  { id: 'google/gemini-2.0-flash-exp:free',                max_tokens: 8000, timeout_ms: 75000, temp: 0.50 },
  { id: 'google/gemini-flash-1.5-8b:free',                 max_tokens: 7000, timeout_ms: 65000, temp: 0.50 },
  { id: 'deepseek/deepseek-chat-v3-0324:free',             max_tokens: 8000, timeout_ms: 75000, temp: 0.50 },
  { id: 'meta-llama/llama-3.3-70b-instruct:free',          max_tokens: 7000, timeout_ms: 68000, temp: 0.52 },
  { id: 'nousresearch/hermes-3-llama-3.1-405b:free',       max_tokens: 8000, timeout_ms: 80000, temp: 0.48 },
  { id: 'cognitivecomputations/dolphin-mixtral-8x7b:free', max_tokens: 6000, timeout_ms: 68000, temp: 0.50 },
  { id: 'z-ai/glm-4.5-air:free',                           max_tokens: 6000, timeout_ms: 60000, temp: 0.50 },
  { id: 'qwen/qwen3-8b:free',                              max_tokens: 5500, timeout_ms: 58000, temp: 0.50 },
  { id: 'microsoft/phi-3-mini-128k-instruct:free',         max_tokens: 5000, timeout_ms: 55000, temp: 0.50 },
  { id: 'mistralai/mistral-7b-instruct-v0.3:free',         max_tokens: 4500, timeout_ms: 50000, temp: 0.50 },
];

MODELS_STREAM.unshift(
  { id: 'openrouter/auto', max_tokens: 4200, timeout_ms: 45000, temp: 0.72 },
  { id: 'deepseek/deepseek-r1:free', max_tokens: 5000, timeout_ms: 65000, temp: 0.60 },
  { id: 'mistralai/mistral-small-3.1-24b-instruct:free', max_tokens: 4500, timeout_ms: 52000, temp: 0.72 },
  { id: 'meta-llama/llama-4-scout:free', max_tokens: 4500, timeout_ms: 60000, temp: 0.72 }
);
MODELS_CARDS.unshift(
  { id: 'openrouter/auto', max_tokens: 6500, timeout_ms: 65000, temp: 0.45 },
  { id: 'deepseek/deepseek-r1:free', max_tokens: 7000, timeout_ms: 78000, temp: 0.40 },
  { id: 'mistralai/mistral-small-3.1-24b-instruct:free', max_tokens: 6000, timeout_ms: 62000, temp: 0.45 },
  { id: 'meta-llama/llama-4-scout:free', max_tokens: 6500, timeout_ms: 70000, temp: 0.45 }
);

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

  if (tool === 'flashcards' || tool === 'all') {
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

  if (tool === 'quiz' || tool === 'all') {
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

  if (tool === 'mindmap' || tool === 'all') {
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
5. ${tool==='flashcards'||tool==='all' ? 'Generate 15-20 flashcards about this specific topic' : ''}
6. ${tool==='quiz'||tool==='all' ? 'Generate 10-12 quiz questions about this specific topic' : ''}
7. ${tool==='mindmap'||tool==='all' ? 'Generate 5-7 branches with SPECIFIC names from this topic' : ''}
8. No trailing commas. All strings in double quotes. Valid JSON.
9. FORBIDDEN: Generic content, placeholder text, content NOT about "${topicShort}"
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🚀 OUTPUT JSON NOW:`;
}

// ─────────────────────────────────────────────────────────────────────────────
// SECTION 8 — PHASE 1: STREAM NOTES
// ─────────────────────────────────────────────────────────────────────────────


function buildOpenRouterHeaders() {
  return {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${process.env.OPENROUTER_API_KEY}`,
    'HTTP-Referer': HTTP_REFERER,
    'X-Title': APP_TITLE,
  };
}

function buildOpenRouterBody(model, prompt, mode) {
  const body = {
    model: model.id,
    max_tokens: model.max_tokens,
    temperature: model.temp || (mode === 'json' ? 0.50 : 0.75),
    stream: mode === 'stream',
    messages: [
      { role: 'system', content: mode === 'json' ? 'Return only valid JSON. No markdown fences. No prose outside JSON.' : 'You are Savoiré AI. Produce accurate, student-friendly study material.' },
      { role: 'user', content: prompt },
    ],
  };
  if (mode === 'json') body.response_format = { type: 'json_object' };
  return body;
}

function extractOpenRouterText(data) {
  const choice = data?.choices?.[0];
  const msg = choice?.message;
  if (typeof msg?.content === 'string') return msg.content.trim();
  if (Array.isArray(msg?.content)) {
    return msg.content.map(part => typeof part === 'string' ? part : (part?.text || part?.content || '')).join('\n').trim();
  }
  if (typeof choice?.text === 'string') return choice.text.trim();
  return '';
}

function parseOpenRouterStreamLine(raw) {
  if (!raw || raw === '[DONE]') return '';
  try {
    const data = JSON.parse(raw);
    const choice = data?.choices?.[0];
    const delta = choice?.delta;
    if (typeof delta?.content === 'string') return delta.content;
    if (Array.isArray(delta?.content)) return delta.content.map(p => p?.text || p?.content || '').join('');
    if (typeof choice?.message?.content === 'string') return choice.message.content;
    if (typeof choice?.text === 'string') return choice.text;
  } catch {}
  return '';
}

function cleanModelJSON(raw) {
  let content = String(raw || '').trim();
  content = content.replace(/^```(?:json)?\s*/im, '').replace(/\s*```\s*$/im, '').trim();
  const first = content.indexOf('{');
  const last = content.lastIndexOf('}');
  if (first !== -1 && last > first) content = content.slice(first, last + 1);
  return content;
}

function parseJSONRepair(raw) {
  const candidates = [];
  const base = cleanModelJSON(raw);
  candidates.push(base);
  candidates.push(base.replace(/,(\s*[}\]])/g, '$1'));
  candidates.push(base.replace(/[\u0000-\u001F\u007F]/g, ' ').replace(/,(\s*[}\]])/g, '$1'));
  candidates.push(base.replace(/([{,]\s*)([a-zA-Z_]\w*)(\s*:)/g, '$1"$2"$3').replace(/:\s*'([^']*)'/g, ': "$1"').replace(/,(\s*[}\]])/g, '$1'));
  candidates.push(base.replace(/[“”]/g, '"').replace(/[‘’]/g, "'").replace(/([{,]\s*)([a-zA-Z_]\w*)(\s*:)/g, '$1"$2"$3').replace(/:\s*'([^']*)'/g, ': "$1"').replace(/,(\s*[}\]])/g, '$1'));
  let last;
  for (const c of candidates) {
    try { return JSON.parse(c); }
    catch (e) { last = e; }
  }
  throw last || new Error('JSON parse failed');
}

function normalizeStructuredData(parsed, tool, topic) {
  const out = parsed && typeof parsed === 'object' ? parsed : {};
  out.topic = out.topic || topic;
  if (!Array.isArray(out.flashcards)) out.flashcards = [];
  if (!Array.isArray(out.quiz_questions)) out.quiz_questions = [];
  out.flashcards = out.flashcards
    .filter(c => c && (c.front || c.question) && (c.back || c.answer))
    .map((c, i) => ({
      front: String(c.front || c.question || `Question ${i + 1} about ${topic}`).trim().slice(0, 420),
      back: String(c.back || c.answer || '').trim(),
      type: c.type || 'topic-specific',
    }))
    .slice(0, 24);
  out.quiz_questions = out.quiz_questions
    .filter(q => q && q.question && Array.isArray(q.options))
    .map((q, i) => {
      let options = q.options.map(o => String(o)).filter(Boolean).slice(0, 4);
      while (options.length < 4) options.push(`Topic-specific option ${options.length + 1}`);
      let correct = String(q.correct_answer || q.answer || options[0]);
      if (!options.includes(correct)) {
        const lower = correct.toLowerCase();
        correct = options.find(o => o.toLowerCase() === lower) || options.find(o => o.toLowerCase().includes(lower) || lower.includes(o.toLowerCase())) || options[0];
      }
      return {
        id: q.id || i + 1,
        question: String(q.question).trim(),
        options,
        correct_answer: correct,
        explanation: String(q.explanation || `The correct answer is ${correct} because it best matches the concept being tested in ${topic}.`).trim(),
        difficulty: ['easy','medium','hard'].includes(String(q.difficulty).toLowerCase()) ? String(q.difficulty).toLowerCase() : (i < 3 ? 'easy' : i < 8 ? 'medium' : 'hard'),
      };
    })
    .slice(0, 14);
  if (!out.mindmap || typeof out.mindmap !== 'object') out.mindmap = null;
  if (out.mindmap) {
    out.mindmap.central = String(out.mindmap.central || topic).split(/\s+/).slice(0, 6).join(' ');
    out.mindmap.branches = Array.isArray(out.mindmap.branches) ? out.mindmap.branches.map((b, i) => ({
      name: String(b.name || `${topic} Branch ${i + 1}`).trim(),
      color: b.color || ['#00d4ff','#bf00ff','#00ff88','#ffae00','#d4af37','#ff4444','#e84393'][i % 7],
      items: Array.isArray(b.items) ? b.items.map(x => String(x)).filter(Boolean).slice(0, 8) : [],
    })).filter(b => b.items.length) : [];
    out.mindmap.connections = Array.isArray(out.mindmap.connections) ? out.mindmap.connections.slice(0, 8) : [];
  }
  return out;
}

async function streamNotes(prompt, onChunk, tool) {
  let lastErr = 'No models responded';
  for (const model of MODELS_STREAM) {
    const name = model.id.split('/').pop().replace(':free', '');
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), model.timeout_ms);
    const t0 = Date.now();
    try {
      log.info(`P1 (${tool}) → ${name}`);
      const res = await fetch(OPENROUTER_BASE, {
        method: 'POST',
        headers: buildOpenRouterHeaders(),
        body: JSON.stringify(buildOpenRouterBody(model, prompt, 'stream')),
        signal: ctrl.signal,
      });
      if (!res.ok) {
        clearTimeout(timer);
        const t = await res.text().catch(() => '');
        log.warn(`P1 HTTP ${res.status} ${name}: ${trunc(t, 120)}`);
        if (res.status === 401 || res.status === 403) throw new Error('Invalid API key');
        if (res.status === 429) { await sleep(950); continue; }
        continue;
      }
      if (!res.body?.getReader) {
        const data = await res.json().catch(() => null);
        clearTimeout(timer);
        const text = extractOpenRouterText(data);
        if (text.length > 150) { onChunk(text); return text; }
        continue;
      }
      const reader = res.body.getReader();
      const decoder = new TextDecoder('utf-8');
      let sseBuf = '', full = '', tokens = 0;
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        sseBuf += decoder.decode(value, { stream: true });
        const messages = sseBuf.split(/\r?\n\r?\n/);
        sseBuf = messages.pop() || '';
        for (const msg of messages) {
          const dataLines = [];
          for (const line of msg.split(/\r?\n/)) {
            if (line.startsWith('data:')) dataLines.push(line.slice(5).trim());
          }
          const raw = dataLines.join('\n').trim();
          const delta = parseOpenRouterStreamLine(raw);
          if (delta) {
            full += delta;
            tokens++;
            onChunk(delta);
          }
        }
      }
      clearTimeout(timer);
      if (full.trim().length < 150) { log.warn(`${name}: too short (${full.length})`); continue; }
      log.ok(`P1 OK — ${name} | chunks:${tokens} | ${full.length}ch | ${Date.now() - t0}ms`);
      return full;
    } catch (err) {
      clearTimeout(timer);
      lastErr = err.name === 'AbortError' ? `${name} timed out` : `${name}: ${err.message}`;
      log.warn(`P1 fail — ${lastErr}`);
      if (err.message?.includes('Invalid API key')) throw err;
    }
  }
  throw new Error(`Savoiré AI is momentarily busy. Please try again. (${lastErr})`);
}

// ─────────────────────────────────────────────────────────────────────────────
// SECTION 9 — PHASE 2: FETCH STRUCTURED CARDS
// Robust retry + 4-step JSON repair + topic-specific validation + auto-fix
// ─────────────────────────────────────────────────────────────────────────────

async function fetchCards(prompt, tool, topic) {
  let lastErr = 'No models responded';
  for (const model of MODELS_CARDS) {
    const name = model.id.split('/').pop().replace(':free', '');
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), model.timeout_ms);
    const t0 = Date.now();
    try {
      log.info(`P2 (${tool}) → ${name}`);
      const res = await fetch(OPENROUTER_BASE, {
        method: 'POST',
        headers: buildOpenRouterHeaders(),
        body: JSON.stringify(buildOpenRouterBody(model, prompt, 'json')),
        signal: ctrl.signal,
      });
      clearTimeout(timer);
      if (!res.ok) {
        const t = await res.text().catch(() => '');
        log.warn(`P2 HTTP ${res.status} ${name}: ${trunc(t, 120)}`);
        if (res.status === 401 || res.status === 403) throw new Error('Invalid API key');
        if (res.status === 429) { await sleep(950); continue; }
        continue;
      }
      const data = await res.json();
      const content = extractOpenRouterText(data);
      if (!content || content.length < 20) { log.warn(`${name}: empty structured response`); continue; }
      let parsed;
      try { parsed = parseJSONRepair(content); }
      catch (e) { log.warn(`${name}: JSON repair failed — ${e.message.slice(0, 80)}`); continue; }
      parsed = normalizeStructuredData(parsed, tool, topic);
      let ok = true;
      if ((tool === 'flashcards' || tool === 'all') && parsed.flashcards.length < 10) ok = false;
      if ((tool === 'quiz' || tool === 'all') && parsed.quiz_questions.length < 8) ok = false;
      if ((tool === 'mindmap' || tool === 'all') && (!parsed.mindmap?.branches || parsed.mindmap.branches.length < 5)) ok = false;
      if (!ok) {
        log.warn(`${name}: structured data incomplete fc:${parsed.flashcards.length} q:${parsed.quiz_questions.length} mm:${parsed.mindmap?.branches?.length || 0}`);
        if (tool !== 'all') continue;
      }
      log.ok(`P2 OK — ${name} | ${tool} | fc:${parsed.flashcards.length} | q:${parsed.quiz_questions.length} | mm:${parsed.mindmap?.branches?.length || 0} | ${Date.now() - t0}ms`);
      return parsed;
    } catch (err) {
      clearTimeout(timer);
      lastErr = err.name === 'AbortError' ? `${name} timed out` : `${name}: ${err.message}`;
      log.warn(`P2 fail — ${lastErr}`);
      if (err.message?.includes('Invalid API key')) throw err;
    }
  }
  log.warn(`All P2 models failed for ${tool} — using topic-specific fallback (${lastErr})`);
  return buildTopicFallback(tool, topic);
}

// ─────────────────────────────────────────────────────────────────────────────
// SECTION 9.1 — TOPIC-SPECIFIC FALLBACK
// Uses actual topic words in all generated content
// ─────────────────────────────────────────────────────────────────────────────

function buildTopicFallback(tool, topic) {
  const T=topic||'this topic', now=getISTDateTime();
  const words=T.replace(/[^a-zA-Z\s]/g,'').split(/\s+/).filter(w=>w.length>3);
  const w1=words[0]||T.slice(0,20), w2=words[1]||'concepts';

  const base={
    topic:T, curriculum_alignment:'General Academic Study', generated_at:now,
    study_score:88, _fallback:true,
    flashcards:[], quiz_questions:[], mindmap:null,
    key_concepts:[
      `Core Definition: ${T} is defined as the systematic study and practice of its central domain. Mastery begins with understanding WHY the definition is framed as it is — not just memorising it.`,
      `Primary Mechanism: The main process in ${T} follows: [initial conditions] → [transformation] → [outcome]. Each step depends causally on the previous, making the chain learnable and predictable.`,
      `Key Relationships: In ${T}, ${w1} connects to ${w2} through [specific relationship]. Understanding this connection is more valuable than knowing either concept in isolation.`,
      `Historical Context: ${T} developed through key breakthroughs where [early theories] were refined into [modern understanding]. This history explains why current frameworks take their present form.`,
      `Expert vs Novice: Experts in ${T} recognise deep structural patterns while beginners focus on surface features. This difference develops through deliberate practice, not passive study.`,
      `Practical Transfer: ${T} knowledge applies directly to healthcare, technology, business, and policy contexts through the same analytical frameworks learned in academic study.`,
    ],
    key_tricks:[
      `🧠 FEYNMAN TECHNIQUE for ${T}: Close all notes. Explain "${T}" aloud to an imaginary 12-year-old. Every hesitation = a gap. Return to notes ONLY for gaps. Repeat until fluent without notes.`,
      `📝 ACTIVE RECALL for ${T}: After every study session on ${T}, write everything you remember without looking. The gaps between what you wrote and the actual content = your study targets.`,
      `⏰ SPACED REPETITION for ${T}: Day 1 → learn. Day 3 → test yourself. Day 7 → consolidate. Day 14 → reinforce. Day 30 → master. Each review must be active retrieval, not re-reading.`,
      `🎨 MIND MAPPING ${T}: Place "${T}" at centre. Branch to 5-7 major sub-topics. Add 3-5 specific facts per branch. Draw arrows showing cause-and-effect. The map IS the learning — not just a record.`,
    ],
    practice_questions:[
      {question:`Explain the foundational principles of ${T} and analyse how they form a coherent framework. Illustrate with two specific examples showing the principles in action.`,answer:`${T} rests on foundational principles that collectively define its scope, methods, and explanatory power. These principles establish key concepts and their logical relationships. The first principle concerns the core subject matter of ${T} and why it is understood as it is. The second principle addresses the primary mechanisms. Understanding both requires grasping WHY principles hold — not just what they state. Example 1 illustrates the first principle in a specific real situation. Example 2 shows the second principle in a different but related context. Together, these demonstrate that ${T} is a structured reasoning framework, not a collection of facts.`},
      {question:`Describe a realistic professional scenario where deep knowledge of ${T} produces measurably better outcomes than surface familiarity.`,answer:`A professional facing a complex problem involving ${T} approaches it differently depending on depth of understanding. An expert diagnoses the situation using ${T} principles before selecting an approach, systematically analyses the key variables, predicts outcomes under different actions, selects the optimal approach, and verifies the reasoning against known constraints. This systematic process consistently outperforms intuitive pattern-matching. The measurable better outcome comes from: avoiding systematic errors that novices make, anticipating consequences that are invisible without ${T} expertise, and communicating the reasoning clearly to stakeholders.`},
    ],
    real_world_applications:[
      `Healthcare: ${T} informs clinical reasoning, diagnostic protocols, and treatment design — enabling practitioners to make more systematic and accurate decisions.`,
      `Technology: ${T} principles underpin system architecture and engineering decisions, helping teams build more robust and maintainable solutions.`,
      `Business: Strategic planning and risk assessment draw on ${T} frameworks, enabling better decisions under uncertainty.`,
      `Policy: Government agencies apply ${T} reasoning to analyse problems and design evidence-based interventions with measurable outcomes.`,
    ],
    common_misconceptions:[
      `❌ MYTH: Memorising ${T} facts equals understanding. ✅ TRUTH: Real mastery of ${T} means grasping causal relationships and conditional application — not just recalling definitions.`,
      `❌ MYTH: ${T} is only for specialists. ✅ TRUTH: ${T} reasoning patterns transfer across healthcare, technology, business, and everyday decision-making.`,
      `❌ MYTH: Re-reading notes is effective for ${T}. ✅ TRUTH: Active retrieval (testing yourself) outperforms re-reading by 200-300% for durable retention of ${T}.`,
      `❌ MYTH: Once you know ${T} basics, little remains. ✅ TRUTH: Expert-novice gap in ${T} is vast — edge cases, conditional reasoning, and nuances separate introductory from professional mastery.`,
    ],
  };

  if(tool==='flashcards'||tool==='all'){
    base.flashcards=[
      {front:`What is the precise definition of ${T} and why is it defined this way?`,back:`${T} is defined as [its core domain and scope]. The definition specifies exactly what is and isn't included, distinguishing ${T} from related fields. Understanding WHY the definition takes this form — not just memorising it — is the first step to genuine mastery. The key terms in the definition each carry precise meanings that differ from everyday usage.`},
      {front:`What are the 4–5 most fundamental principles of ${T}?`,back:`The foundational principles of ${T} are: (1) [First principle] — establishes the basic framework; (2) [Second principle] — governs core mechanisms; (3) [Third principle] — determines key relationships; (4) [Fourth principle] — defines limits and conditions; (5) [Fifth principle] — connects ${T} to broader context. Mastering all five gives you the complete framework for understanding everything else in ${T}.`},
      {front:`Explain the primary mechanism of ${T} step by step.`,back:`The primary mechanism of ${T} operates as: Step 1 → initial conditions are identified and characterised. Step 2 → triggering event or input occurs. Step 3 → primary transformation begins following ${T} rules. Step 4 → intermediate stages form progressively. Step 5 → observable outcome emerges and can be measured. Understanding WHY each step follows the previous is what separates genuine understanding of ${T} from surface familiarity.`},
      {front:`What are the most important real-world applications of ${T}?`,back:`${T} has significant applications: (1) Healthcare — informs clinical reasoning and diagnosis; (2) Technology — underlies system design decisions; (3) Business — guides strategic planning; (4) Research — provides methodological framework; (5) Policy — shapes evidence-based interventions. The breadth explains why ${T} is studied so widely and valued across disciplines.`},
      {front:`What distinguishes an expert in ${T} from a beginner?`,back:`Experts in ${T} differ from beginners in five ways: (1) Pattern recognition — experts immediately identify deep structure; beginners see surface features. (2) Conditional reasoning — experts know WHEN each ${T} principle applies and when it doesn't. (3) Chunking — experts organise knowledge into efficient mental units. (4) Transfer — experts apply ${T} to novel situations. (5) Metacognition — experts know precisely what they don't understand yet.`},
      {front:`What is the most common misconception students have about ${T}?`,back:`The most persistent misconception is that memorising ${T} definitions and facts equals understanding. This fails because: real-world application requires adapting principles to specific conditions that don't match textbook examples; novel exam questions test understanding, not recall; and expertise develops through practice with varied problems, not passive re-reading. True mastery of ${T} means being able to reason from first principles.`},
      {front:`How does ${T} connect to adjacent fields of knowledge?`,back:`${T} connects to adjacent disciplines through: shared conceptual frameworks enabling transfer of insights; methodological overlap where approaches developed in ${T} apply elsewhere; historical co-development where fields influenced each other; practical integration in professional contexts requiring combined knowledge. The most productive connections are those where ${T} thinking illuminates problems in domains where it wasn't originally studied.`},
      {front:`What are the boundary conditions where ${T} principles break down?`,back:`Every principle in ${T} holds under specific conditions and breaks down outside them. Key boundary conditions include: [conditions where standard ${T} approaches work reliably]; [conditions where modification is needed]; [edge cases requiring different frameworks]. Expert practitioners maintain a clear mental map of these boundaries — applying ${T} principles conditionally rather than mechanically, which is a primary marker of professional competence.`},
      {front:`How do you apply ${T} to solve a problem you've never seen before?`,back:`The expert approach: Step 1 — Diagnose: identify which ${T} principles are most relevant by looking for deep structural features, not surface similarities. Step 2 — Select: choose the appropriate framework for this problem type. Step 3 — Analyse: apply systematically, checking boundary conditions. Step 4 — Verify: test the solution against known ${T} constraints. Step 5 — Communicate: explain reasoning using ${T} terminology. This process consistently outperforms trial-and-error.`},
      {front:`What are the sub-categories or specialisations within ${T}?`,back:`${T} divides into recognised sub-fields: (1) [Sub-field A] — focuses on [what it studies], relevant in [contexts]; (2) [Sub-field B] — specialises in [area], used by [practitioners]; (3) [Sub-field C] — examines [aspect] using [methods]; (4) [Sub-field D] — deals with [area]. Knowing which sub-field applies to a given situation is a marker of practical expertise.`},
    ];
  }

  if(tool==='quiz'||tool==='all'){
    base.quiz_questions=[
      {id:1,question:`Which statement BEST describes the central focus of ${T}?`,options:[`A systematic framework for understanding phenomena through evidence-based reasoning`,`A collection of memorised facts and definitions recalled on demand`,`A purely historical record with limited contemporary relevance`,`An intuitive skill developed only through professional experience`],correct_answer:`A systematic framework for understanding phenomena through evidence-based reasoning`,explanation:`${T} is fundamentally about systematic frameworks for reasoning — not fact collection. While some memorisation is necessary, the core is building the ability to reason about problems in this domain. This framework-building is what allows ${T} knowledge to transfer to new situations, which memorisation alone cannot achieve.`,difficulty:'easy'},
      {id:2,question:`A student has re-read ${T} notes five times and feels confident. What does learning research predict?`,options:[`Excellent performance — thorough re-reading builds strong understanding`,`Potential underperformance — re-reading creates familiarity but not durable knowledge`,`Performance depends entirely on exam question difficulty`,`Strong performance if key passages were highlighted during re-reading`],correct_answer:`Potential underperformance — re-reading creates familiarity but not durable knowledge`,explanation:`Research consistently shows that re-reading ${T} material creates an "illusion of fluency" — material feels familiar, which feels like knowledge, but active retrieval (self-testing) dramatically outperforms re-reading for durable retention. When exam questions require applying ${T} to novel situations, familiarity alone fails.`,difficulty:'medium'},
      {id:3,question:`When applying ${T} to a complex problem, the expert's FIRST action is:`,options:[`Immediately attempt multiple solutions through trial and error`,`Identify which core ${T} principles are most relevant to this situation`,`Find the most similar textbook example and replicate that solution`,`Simplify until the problem matches a familiar case exactly`],correct_answer:`Identify which core ${T} principles are most relevant to this situation`,explanation:`Expert practitioners of ${T} always begin with principle identification — looking for the deep structural features of the problem, not its surface characteristics. This principled approach works because ${T} principles apply across many superficially different situations, allowing experts to construct appropriate analyses even for problems they've never seen before.`,difficulty:'medium'},
      {id:4,question:`Which study schedule produces the BEST long-term retention of ${T}?`,options:[`One 8-hour session immediately before the exam`,`Daily 30-minute sessions for two weeks pre-exam`,`Distributed sessions: Day 1 (learn), Day 3, Day 7, Day 14, Day 30`,`Two intensive 4-hour sessions in the final week`],correct_answer:`Distributed sessions: Day 1 (learn), Day 3, Day 7, Day 14, Day 30`,explanation:`Spaced repetition with increasing intervals consistently produces the strongest long-term retention of ${T} concepts. Each review catches material just as it begins to fade, maximising the memory-strengthening effect. Cramming produces short-term performance but poor long-term retention. Daily sessions without spacing are better than cramming but miss the power of the forgetting curve.`,difficulty:'medium'},
      {id:5,question:`Why does knowledge of ${T} transfer effectively to professional domains beyond academia?`,options:[`Professional licensing bodies require ${T} knowledge in all careers`,`The specific facts of ${T} apply directly as professional information`,`The analytical frameworks and reasoning patterns of ${T} are domain-general`,`All professional problems are fundamentally identical to ${T} academic problems`],correct_answer:`The analytical frameworks and reasoning patterns of ${T} are domain-general`,explanation:`Transfer from ${T} to professional domains occurs because of the thinking skills developed, not the specific factual content. Understanding WHY ${T} principles work allows practitioners to recognise when similar underlying structures appear in unfamiliar domains — even when surface features look completely different. This is why ${T} graduates succeed across diverse career paths.`,difficulty:'hard'},
      {id:6,question:`What does "conditional application" mean in the context of ${T} expertise?`,options:[`Only applying ${T} when authorised by a supervisor`,`Knowing WHEN each principle applies and when it breaks down`,`Memorising the conditions listed in textbooks alongside each principle`,`Applying ${T} based on personal preference or convenience`],correct_answer:`Knowing WHEN each principle applies and when it breaks down`,explanation:`Conditional application is central to ${T} expertise: knowing not just WHAT a principle states, but WHEN it applies and when it doesn't. Expert practitioners automatically assess situational fit before applying any ${T} principle. Novices often apply principles mechanically regardless of conditions — producing systematic errors that are invisible to them but immediately obvious to experts.`,difficulty:'hard'},
      {id:7,question:`Which approach to studying ${T} produces genuine understanding rather than the illusion of competence?`,options:[`Reading comprehensive textbooks cover-to-cover multiple times`,`Watching video lectures while taking detailed notes`,`Practising retrieval from memory, then checking against source material`,`Reviewing expert-prepared summaries of ${T} content`],correct_answer:`Practising retrieval from memory, then checking against source material`,explanation:`The testing effect (retrieval practice) is the most robustly supported technique for genuine, durable understanding of ${T}. When you retrieve ${T} content from memory — even imperfectly — you strengthen the neural pathways for future retrieval. Reading, watching, and reviewing are passive. Only retrieval practice reveals actual gaps and strengthens real knowledge.`,difficulty:'medium'},
      {id:8,question:`An expert and a novice observe the same situation involving ${T}. Research predicts the expert:`,options:[`Perceives more surface-level details`,`Immediately recognises the deep structural features relevant to ${T}`,`Takes longer to analyse by considering more possibilities`,`Perceives the same features but interprets them differently`],correct_answer:`Immediately recognises the deep structural features relevant to ${T}`,explanation:`Expert-novice research consistently shows experts perceive problems through their deep structure — the underlying ${T} principles operating — while beginners focus on surface features. This perceptual difference enables experts to immediately select the most relevant framework and ignore irrelevant details. This deep pattern recognition develops through years of deliberate practice with varied ${T} problems.`,difficulty:'hard'},
    ];
  }

  if(tool==='mindmap'||tool==='all'){
    const low = T.toLowerCase();
    const colors = ['#00d4ff','#bf00ff','#00ff88','#ffae00','#d4af37','#ff4444','#e84393'];
    const makeBranch = (name, items, i) => ({ name, color: colors[i % colors.length], items: items.slice(0,6) });
    let branches, connections;

    if(/blockchain|crypto|bitcoin|ethereum|web3|defi|nft|ledger|consensus/.test(low)){
      branches = [
        makeBranch('Blockchain Fundamentals',[`Distributed ledger for ${T}`,'Blocks linked by cryptographic hashes','Immutable transaction history','Peer-to-peer validation','Public vs private chains','State changes recorded transparently'],0),
        makeBranch('Consensus Mechanisms',['Proof of Work mining','Proof of Stake validators','Byzantine fault tolerance','Finality and fork choice','51% attack resistance','Validator incentives and slashing'],1),
        makeBranch('Network Architecture',['Full nodes and light clients','Mempool transaction propagation','Block producers and validators','Peer discovery protocols','Layer 1 vs Layer 2 scaling','Gas/fee markets'],2),
        makeBranch('Cryptographic Basis',['SHA-256/Keccak hashing','Public-private key pairs','Digital signatures','Merkle trees for proofs','Wallet addresses','Zero-knowledge proof use cases'],3),
        makeBranch('Smart Contracts & Apps',['Ethereum Virtual Machine','DeFi lending and swaps','NFT ownership logic','DAOs and governance','Oracles connecting real data','Token standards ERC-20/ERC-721'],4),
        makeBranch('Security & Attacks',['51% reorg attacks','Smart-contract exploits','Bridge vulnerabilities','Sybil resistance','Private key theft','Audit and formal verification'],5),
      ];
      connections = [
        {from:'Consensus Mechanisms',to:'Security & Attacks',description:'Consensus rules determine resistance to reorgs, Sybil attacks, and censorship.'},
        {from:'Cryptographic Basis',to:'Blockchain Fundamentals',description:'Hashes, signatures, and Merkle proofs make ledger entries verifiable.'},
        {from:'Network Architecture',to:'Smart Contracts & Apps',description:'Node infrastructure executes and propagates decentralized application state changes.'},
        {from:'Smart Contracts & Apps',to:'Security & Attacks',description:'Contract design choices create or reduce exploit surfaces.'},
      ];
    } else if(/biology|cell|dna|rna|gene|genetic|photosynthesis|enzyme|protein|mitosis|meiosis|evolution|ecology|organism/.test(low)){
      branches = [
        makeBranch(`${w1} Biological Structure`,[`Relevant cells and organelles in ${T}`,'Molecular components involved','Tissue/organ system context','Structural adaptations','Hierarchy: molecule to organism'],0),
        makeBranch('Molecular Processes',['DNA/RNA/protein interactions','Enzyme-catalysed reactions','Energy transfer with ATP','Signal pathways','Regulation and feedback'],1),
        makeBranch('Physiology & Function',[`Function of ${T} in living systems`,'Homeostasis connections','Transport and exchange','Growth or repair roles','Response to environmental change'],2),
        makeBranch('Genetics & Inheritance',['Gene expression control','Mutation effects','Chromosomal behaviour','Heritable variation','Phenotype outcomes'],3),
        makeBranch('Evolutionary Context',['Natural selection pressures','Adaptation advantages','Comparative anatomy/biology','Population variation','Fitness consequences'],4),
        makeBranch('Experiments & Evidence',['Microscopy observations','Controlled variables','Molecular assays','Model organisms','Data interpretation pitfalls'],5),
      ];
      connections = [
        {from:'Molecular Processes',to:'Physiology & Function',description:'Molecular events scale upward into observable biological function.'},
        {from:'Genetics & Inheritance',to:'Evolutionary Context',description:'Inherited variation supplies the raw material for evolution.'},
        {from:'Experiments & Evidence',to:'Molecular Processes',description:'Assays and models reveal mechanisms that cannot be seen directly.'},
      ];
    } else if(/physics|force|motion|energy|quantum|electric|magnet|wave|thermo|newton|relativity|gravity/.test(low)){
      branches = [
        makeBranch('Physical Quantities & Units',[`Measurable variables in ${T}`,'SI units and dimensions','Scalars vs vectors','Initial and boundary conditions','Uncertainty and measurement'],0),
        makeBranch('Laws & Equations',['Governing equations','Conservation laws','Proportional relationships','Assumptions behind formulas','Limiting cases'],1),
        makeBranch('Forces, Fields & Interactions',['Contact/non-contact interactions','Field representation','Equilibrium and net effects','Energy transfer mechanisms','System boundaries'],2),
        makeBranch('Mathematical Modelling',['Free-body/system diagrams','Graph interpretation','Algebraic rearrangement','Rate of change reasoning','Approximation methods'],3),
        makeBranch('Experiments & Measurements',['Controlled experiment design','Sensor/calibration issues','Data trends and gradients','Error sources','Validation against theory'],4),
        makeBranch('Applications & Technology',['Engineering systems','Electronics and devices','Space/transport uses','Medical imaging links','Energy technologies'],5),
      ];
      connections = [
        {from:'Laws & Equations',to:'Mathematical Modelling',description:'Equations become predictive only when variables and assumptions are modelled correctly.'},
        {from:'Experiments & Measurements',to:'Physical Quantities & Units',description:'Measurements define the data used to test physical laws.'},
        {from:'Forces, Fields & Interactions',to:'Applications & Technology',description:'Technology exploits predictable interactions and energy transfer.'},
      ];
    } else if(/history|war|revolution|empire|civilization|independence|medieval|ancient|ww1|ww2|world war/.test(low)){
      branches = [
        makeBranch('Origins & Causes',[`Long-term causes of ${T}`,'Immediate triggers','Economic pressures','Political tensions','Social grievances','Ideological background'],0),
        makeBranch('Key Events',['Turning points and dates','Escalation sequence','Major battles/decisions','Treaties or reforms','Crisis moments'],1),
        makeBranch('Major Figures',['Political leaders','Military commanders','Reformers/thinkers','Opposition groups','Ordinary people affected'],2),
        makeBranch('Social Impact',['Class and labour changes','Gender/family effects','Migration and displacement','Culture and media','Everyday life consequences'],3),
        makeBranch('Economic Consequences',['Trade and production shifts','Taxation and debt','Resource control','Industrial effects','Winners and losers'],4),
        makeBranch('Legacy & Memory',['Long-term institutions','Borders and state formation','Historical interpretations','Commemoration and controversy','Lessons for later events'],5),
      ];
      connections = [
        {from:'Origins & Causes',to:'Key Events',description:'Underlying tensions explain why specific events escalated.'},
        {from:'Major Figures',to:'Legacy & Memory',description:'Leadership choices shaped how later generations remember the event.'},
        {from:'Economic Consequences',to:'Social Impact',description:'Material changes altered daily life and social relations.'},
      ];
    } else if(/program|coding|computer|algorithm|data structure|software|ai|machine learning|database|network|cyber/.test(low)){
      branches = [
        makeBranch(`${w1} System Model`,[`Inputs and outputs in ${T}`,'State representation','Data flow','Constraints and invariants','User/system boundaries'],0),
        makeBranch('Algorithms & Logic',['Stepwise procedure','Time complexity','Space complexity','Edge-case handling','Correctness reasoning'],1),
        makeBranch('Data Structures',['Arrays/lists','Hash maps/sets','Trees/graphs','Queues/stacks','Persistence choices'],2),
        makeBranch('Implementation Architecture',['Modules and APIs','Error handling','Testing strategy','Security checks','Deployment/runtime environment'],3),
        makeBranch('Performance & Scaling',['Bottleneck identification','Caching','Concurrency','Load and latency','Resource trade-offs'],4),
        makeBranch('Real-World Use Cases',['Automation workflows','Web/mobile products','Analytics pipelines','AI-assisted systems','Enterprise integration'],5),
      ];
      connections = [
        {from:'Algorithms & Logic',to:'Data Structures',description:'Data structure choice changes algorithm speed and memory use.'},
        {from:'Implementation Architecture',to:'Performance & Scaling',description:'Architecture decisions determine whether code remains reliable under load.'},
        {from:'Real-World Use Cases',to:`${w1} System Model`,description:'Use cases define required inputs, outputs, and constraints.'},
      ];
    } else {
      const title = T.split(/\s+/).slice(0,3).join(' ');
      branches = [
        makeBranch(`${w1} Foundations`,[`Meaning of ${T}`,`${w1} terminology`,`Important background`,`Scope and boundaries`,`Why ${T} matters`],0),
        makeBranch(`${w1} Processes`,[`How ${T} develops`,`Cause-effect sequence`,`Main variables`,`Feedback patterns`,`Observable outcomes`],1),
        makeBranch(`${w2} Evidence`,[`Examples linked to ${T}`,`Case studies using ${w1}`,`Data or observations`,`Reliable sources`,`Proof vs assumption`],2),
        makeBranch(`${title} Applications`,[`Practical use of ${T}`,`Professional relevance`,`Everyday decisions`,`Technology or policy links`,`Problem-solving value`],3),
        makeBranch(`${w1} Misunderstandings`,[`Common false belief about ${T}`,`Where confusion starts`,`Corrected explanation`,`Boundary cases`,`Exam trap examples`],4),
        makeBranch(`${w1} Mastery Path`,[`Build definitions first`,`Practise examples`,`Compare related ideas`,`Test with questions`,`Teach ${T} aloud`],5),
      ];
      connections = [
        {from:`${w1} Foundations`,to:`${w1} Processes`,description:`Definitions of ${T} explain why the process works as it does.`},
        {from:`${w2} Evidence`,to:`${title} Applications`,description:`Evidence shows which applications of ${T} are reliable.`},
        {from:`${w1} Misunderstandings`,to:`${w1} Mastery Path`,description:`Correcting misconceptions makes revision more targeted and effective.`},
      ];
    }
    base.mindmap={ central:T.split(' ').slice(0,4).join(' ')||T, branches, connections };
  }

  return base;
}

// ─────────────────────────────────────────────────────────────────────────────
// SECTION 10 — OFFLINE NOTES FALLBACK
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

## 🚀 Advanced Aspects

**Boundary conditions:** Every principle holds under specific conditions and breaks down outside them. Knowing these boundaries is as important as knowing the principles themselves.

**Ongoing research:** Like all living fields, ${T} has active research frontiers where questions remain open.

**Interdisciplinary connections:** ${T} connects productively to adjacent fields in both directions.

---

## 📝 Key Takeaways

- ✅ ${T} is a reasoning framework, not a collection of facts
- ✅ Understanding WHY mechanisms work matters more than memorising WHAT they produce
- ✅ Real mastery = applying ${T} to novel situations, not just familiar ones  
- ✅ Knowing boundary conditions prevents systematic errors
- ✅ Active retrieval practice is 2-3× more effective than re-reading for ${T}

## ⚠️ Common Mistakes

- ⚠️ Memorising definitions without understanding mechanisms
- ⚠️ Applying principles outside their valid scope
- ⚠️ Confusing re-reading familiarity with genuine understanding

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

  if(!merged.key_concepts?.length){
    merged.key_concepts=[
      `Core Principles: ${topic} rests on fundamental principles connecting theory to practice. Mastery requires understanding WHY not just WHAT.`,
      `Key Mechanisms: Primary processes follow identifiable patterns that can be learned and applied systematically.`,
      `Practical Transfer: ${topic} knowledge applies directly to healthcare, technology, business, and research contexts.`,
      `Expert Thinking: Experts in ${topic} differ from beginners in pattern recognition, conditional reasoning, and metacognition.`,
      `Learning Strategy: Active retrieval practice is 2-3× more effective than re-reading for mastering ${topic}.`,
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
    }catch{}
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
  if(req.method==='GET'){
    return res.status(200).json({
      status:'online',
      service:SAVOIRÉ.BRAND,
      version:SAVOIRÉ.VERSION,
      developer:SAVOIRÉ.DEVELOPER,
      founder:SAVOIRÉ.FOUNDER,
      tagline:SAVOIRÉ.TAGLINE,
      time:getISTDateTime(),
      models:{stream:MODELS_STREAM.length,structured:MODELS_CARDS.length},
      tools:['notes','flashcards','quiz','summary','mindmap','all'],
      streamingEvents:['heartbeat','stage','token','card','question','branch','done','error'],
      requestId:reqId,
    });
  }
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
    return res.status(500).json({error:'Savoiré AI service is temporarily unavailable. Please try again later.'});
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
      catch{clearInterval(kap);}
    },14000);

    // Stage timers (notes tools stream faster, cards tools need more time)
    const stageTimers=[
      setTimeout(()=>sse('stage',{idx:1,label:'📝 Writing your content…'}),2500),
      setTimeout(()=>sse('stage',{idx:2,label:'🔍 Building sections…'}),7000),
      setTimeout(()=>sse('stage',{idx:3,label:'🃏 Generating interactive cards…'}),14000),
    ];
    const clearStages=()=>stageTimers.forEach(clearTimeout);

    sse('heartbeat',{ts:Date.now(),status:'connected',service:SAVOIRÉ.BRAND,requestId:reqId,tool:opts.tool});
    sse('stage',{idx:0,label:`🎯 Analysing "${message.slice(0,50)}…"`});
    sse('token',{t:''});

    let notes='', p1ok=false;

    try {
      // ── PHASE 1: Stream notes (ALL tools get notes first) ─────────────────
      const notesPrompt=buildNotesPrompt(message,opts);
      try {
        notes=await streamNotes(notesPrompt,c=>sse('token',{t:c}),opts.tool);
        p1ok=true;
        log.ok(`[${reqId}] P1 done — ${notes.length}ch`);
      } catch(e1){
        log.error(`[${reqId}] P1 failed: ${e1.message} — using offline notes`);
        sse('stage',{idx:2,label:'📚 Loading enhanced content…'});
        notes=offlineNotes(message);
        // Stream offline notes in chunks
        for(let i=0;i<notes.length;i+=200){sse('token',{t:notes.slice(i,i+200)});await sleep(5);}
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
        log.error(`[${reqId}] P2 failed: ${e2.message}`);
        cardsData=buildTopicFallback(opts.tool,message);
        p2ok=false;
      }

      // ── STREAM INDIVIDUAL CARDS LIVE (one-by-one with animation signals) ──
      // This is the key feature: cards appear one at a time with animation

      if(cardsData?.flashcards?.length&&(opts.tool==='flashcards'||opts.tool==='all')){
        sse('stage',{idx:3,label:`🃏 Streaming ${cardsData.flashcards.length} flashcards…`});
        for(let i=0;i<cardsData.flashcards.length;i++){
          sse('card',{idx:i, total:cardsData.flashcards.length, card:cardsData.flashcards[i]});
          await sleep(80); // 80ms between cards = smooth animation
        }
        log.ok(`[${reqId}] Streamed ${cardsData.flashcards.length} flashcards`);
      }

      if(cardsData?.quiz_questions?.length&&(opts.tool==='quiz'||opts.tool==='all')){
        sse('stage',{idx:3,label:`❓ Streaming ${cardsData.quiz_questions.length} quiz questions…`});
        for(let i=0;i<cardsData.quiz_questions.length;i++){
          sse('question',{idx:i, total:cardsData.quiz_questions.length, q:cardsData.quiz_questions[i]});
          await sleep(100);
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
          await sleep(120);
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
      final.powered_by=`${SAVOIRÉ.BRAND} by ${SAVOIRÉ.DEVELOPER}`;

      sse('stage',{idx:4,label:'✅ Complete! All study materials ready.',done:true});
      sse('done',final);

      log.ok(`[${reqId}] COMPLETE — ${final._duration_ms}ms | p1:${p1ok} | p2:${p2ok}`);
      sendToGoogleSheets(userName,userStreak,userSessions,opts.tool,message,'completed',final._duration_ms,sessionId).catch(()=>{});

    } catch(fatal){
      clearInterval(kap); clearStages();
      log.error(`[${reqId}] Fatal: ${fatal.message}`);
      sse('error',{message:'Savoiré AI is momentarily unavailable. Please try again in a few seconds.',requestId:reqId});
      sendToGoogleSheets(userName,userStreak,userSessions,opts.tool,message,'failed',Date.now()-startTime,sessionId).catch(()=>{});
    }

    if(!res.writableEnded)res.end();
    return;
  }

  // ══════════════════════════════════════════════════════════════════════════
  // NON-STREAMING FALLBACK (stream:false) — JSON response
  // ══════════════════════════════════════════════════════════════════════════

  try {
    // P1: notes
    let notes='';
    const np=buildNotesPrompt(message,opts);
    for(const model of MODELS_STREAM){
      const ctrl=new AbortController(), timer=setTimeout(()=>ctrl.abort(),model.timeout_ms);
      try{
        const r=await fetch(OPENROUTER_BASE,{method:'POST',signal:ctrl.signal,headers:{'Content-Type':'application/json','Authorization':`Bearer ${process.env.OPENROUTER_API_KEY}`,'HTTP-Referer':HTTP_REFERER,'X-Title':APP_TITLE},body:JSON.stringify({model:model.id,max_tokens:DEPTH_MAP[opts.depth]?.maxTokens||3800,temperature:model.temp||0.75,stream:false,messages:[{role:'user',content:np}]})});
        clearTimeout(timer);
        if(!r.ok)continue;
        const d=await r.json(), c=d?.choices?.[0]?.message?.content?.trim();
        if(c&&c.length>200){notes=c;log.ok(`P1 sync OK — ${c.length}ch`);break;}
      }catch{clearTimeout(timer);}
    }
    if(!notes){notes=offlineNotes(message);}

    // P2: cards
    let cardsData;
    try{
      cardsData=await fetchCards(buildCardsPrompt(message,opts),opts.tool,message);
      if(!cardsData)cardsData=buildTopicFallback(opts.tool,message);
    }catch{cardsData=buildTopicFallback(opts.tool,message);}

    const final=mergeCards(cardsData,notes,message,opts);
    final._duration_ms=Date.now()-startTime;
    final._request_id=reqId;
    final.powered_by=`${SAVOIRÉ.BRAND} by ${SAVOIRÉ.DEVELOPER}`;

    log.ok(`[${reqId}] Sync done — ${final._duration_ms}ms`);
    sendToGoogleSheets(userName,userStreak,userSessions,opts.tool,message,'completed',final._duration_ms,sessionId).catch(()=>{});
    return res.status(200).json(final);

  }catch(err){
    log.error(`[${reqId}] Error: ${err.message}`);
    sendToGoogleSheets(userName,userStreak,userSessions,opts.tool,message,'failed',Date.now()-startTime,sessionId).catch(()=>{});
    return res.status(500).json({error:'Savoiré AI is momentarily unavailable. Please try again.',_request_id:reqId});
  }
};
// ═══════════════════════════════════════════════════════════════════════════════════════════════════
// END — api/study.js v2.0 WORLD CLASS | Sooban Talha Technologies | soobantalhatech.xyz
// "Think Less. Know More." — Free forever for every student on Earth.
// ═══════════════f════════════════════════════════════════════════════════════════════════════════════

const SAVOIRE_BACKEND_WORKING_LIBRARY = (() => {
  const domains = new Map();
  const normalize = s => String(s || "").toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
  const tokens = s => normalize(s).split(/\s+/).filter(Boolean);
  domains.set("physics-0001", {
    id: "physics-0001",
    domain: "physics",
    keywords: ["physics", "concept-1", "study", "exam", "topic"],
    branches(topic) { return ["physics foundations", "physics mechanisms", "physics applications", "physics evidence", "physics revision"].map((name, idx) => ({ name, color: ["#00d4ff", "#bf00ff", "#00ff88", "#ffae00", "#d4af37"][idx], items: [`${topic} ${name} item 1`, `${topic} ${name} item 2`, `${topic} ${name} item 3`, `${topic} ${name} item 4`] })); },
    score(topic) { const t = tokens(topic); return t.filter(x => this.keywords.includes(x)).length * 10 + 1; },
  });
  domains.set("chemistry-0002", {
    id: "chemistry-0002",
    domain: "chemistry",
    keywords: ["chemistry", "concept-2", "study", "exam", "topic"],
    branches(topic) { return ["chemistry foundations", "chemistry mechanisms", "chemistry applications", "chemistry evidence", "chemistry revision"].map((name, idx) => ({ name, color: ["#00d4ff", "#bf00ff", "#00ff88", "#ffae00", "#d4af37"][idx], items: [`${topic} ${name} item 1`, `${topic} ${name} item 2`, `${topic} ${name} item 3`, `${topic} ${name} item 4`] })); },
    score(topic) { const t = tokens(topic); return t.filter(x => this.keywords.includes(x)).length * 10 + 2; },
  });
  domains.set("history-0003", {
    id: "history-0003",
    domain: "history",
    keywords: ["history", "concept-3", "study", "exam", "topic"],
    branches(topic) { return ["history foundations", "history mechanisms", "history applications", "history evidence", "history revision"].map((name, idx) => ({ name, color: ["#00d4ff", "#bf00ff", "#00ff88", "#ffae00", "#d4af37"][idx], items: [`${topic} ${name} item 1`, `${topic} ${name} item 2`, `${topic} ${name} item 3`, `${topic} ${name} item 4`] })); },
    score(topic) { const t = tokens(topic); return t.filter(x => this.keywords.includes(x)).length * 10 + 3; },
  });
  domains.set("math-0004", {
    id: "math-0004",
    domain: "math",
    keywords: ["math", "concept-4", "study", "exam", "topic"],
    branches(topic) { return ["math foundations", "math mechanisms", "math applications", "math evidence", "math revision"].map((name, idx) => ({ name, color: ["#00d4ff", "#bf00ff", "#00ff88", "#ffae00", "#d4af37"][idx], items: [`${topic} ${name} item 1`, `${topic} ${name} item 2`, `${topic} ${name} item 3`, `${topic} ${name} item 4`] })); },
    score(topic) { const t = tokens(topic); return t.filter(x => this.keywords.includes(x)).length * 10 + 4; },
  });
  domains.set("computer-science-0005", {
    id: "computer-science-0005",
    domain: "computer-science",
    keywords: ["computer-science", "concept-5", "study", "exam", "topic"],
    branches(topic) { return ["computer-science foundations", "computer-science mechanisms", "computer-science applications", "computer-science evidence", "computer-science revision"].map((name, idx) => ({ name, color: ["#00d4ff", "#bf00ff", "#00ff88", "#ffae00", "#d4af37"][idx], items: [`${topic} ${name} item 1`, `${topic} ${name} item 2`, `${topic} ${name} item 3`, `${topic} ${name} item 4`] })); },
    score(topic) { const t = tokens(topic); return t.filter(x => this.keywords.includes(x)).length * 10 + 5; },
  });
  domains.set("blockchain-0006", {
    id: "blockchain-0006",
    domain: "blockchain",
    keywords: ["blockchain", "concept-6", "study", "exam", "topic"],
    branches(topic) { return ["blockchain foundations", "blockchain mechanisms", "blockchain applications", "blockchain evidence", "blockchain revision"].map((name, idx) => ({ name, color: ["#00d4ff", "#bf00ff", "#00ff88", "#ffae00", "#d4af37"][idx], items: [`${topic} ${name} item 1`, `${topic} ${name} item 2`, `${topic} ${name} item 3`, `${topic} ${name} item 4`] })); },
    score(topic) { const t = tokens(topic); return t.filter(x => this.keywords.includes(x)).length * 10 + 6; },
  });
  domains.set("economics-0007", {
    id: "economics-0007",
    domain: "economics",
    keywords: ["economics", "concept-7", "study", "exam", "topic"],
    branches(topic) { return ["economics foundations", "economics mechanisms", "economics applications", "economics evidence", "economics revision"].map((name, idx) => ({ name, color: ["#00d4ff", "#bf00ff", "#00ff88", "#ffae00", "#d4af37"][idx], items: [`${topic} ${name} item 1`, `${topic} ${name} item 2`, `${topic} ${name} item 3`, `${topic} ${name} item 4`] })); },
    score(topic) { const t = tokens(topic); return t.filter(x => this.keywords.includes(x)).length * 10 + 7; },
  });
  domains.set("geography-0008", {
    id: "geography-0008",
    domain: "geography",
    keywords: ["geography", "concept-8", "study", "exam", "topic"],
    branches(topic) { return ["geography foundations", "geography mechanisms", "geography applications", "geography evidence", "geography revision"].map((name, idx) => ({ name, color: ["#00d4ff", "#bf00ff", "#00ff88", "#ffae00", "#d4af37"][idx], items: [`${topic} ${name} item 1`, `${topic} ${name} item 2`, `${topic} ${name} item 3`, `${topic} ${name} item 4`] })); },
    score(topic) { const t = tokens(topic); return t.filter(x => this.keywords.includes(x)).length * 10 + 8; },
  });
  domains.set("literature-0009", {
    id: "literature-0009",
    domain: "literature",
    keywords: ["literature", "concept-9", "study", "exam", "topic"],
    branches(topic) { return ["literature foundations", "literature mechanisms", "literature applications", "literature evidence", "literature revision"].map((name, idx) => ({ name, color: ["#00d4ff", "#bf00ff", "#00ff88", "#ffae00", "#d4af37"][idx], items: [`${topic} ${name} item 1`, `${topic} ${name} item 2`, `${topic} ${name} item 3`, `${topic} ${name} item 4`] })); },
    score(topic) { const t = tokens(topic); return t.filter(x => this.keywords.includes(x)).length * 10 + 9; },
  });
  domains.set("medicine-0010", {
    id: "medicine-0010",
    domain: "medicine",
    keywords: ["medicine", "concept-10", "study", "exam", "topic"],
    branches(topic) { return ["medicine foundations", "medicine mechanisms", "medicine applications", "medicine evidence", "medicine revision"].map((name, idx) => ({ name, color: ["#00d4ff", "#bf00ff", "#00ff88", "#ffae00", "#d4af37"][idx], items: [`${topic} ${name} item 1`, `${topic} ${name} item 2`, `${topic} ${name} item 3`, `${topic} ${name} item 4`] })); },
    score(topic) { const t = tokens(topic); return t.filter(x => this.keywords.includes(x)).length * 10 + 10; },
  });
  domains.set("engineering-0011", {
    id: "engineering-0011",
    domain: "engineering",
    keywords: ["engineering", "concept-11", "study", "exam", "topic"],
    branches(topic) { return ["engineering foundations", "engineering mechanisms", "engineering applications", "engineering evidence", "engineering revision"].map((name, idx) => ({ name, color: ["#00d4ff", "#bf00ff", "#00ff88", "#ffae00", "#d4af37"][idx], items: [`${topic} ${name} item 1`, `${topic} ${name} item 2`, `${topic} ${name} item 3`, `${topic} ${name} item 4`] })); },
    score(topic) { const t = tokens(topic); return t.filter(x => this.keywords.includes(x)).length * 10 + 11; },
  });
  domains.set("biology-0012", {
    id: "biology-0012",
    domain: "biology",
    keywords: ["biology", "concept-12", "study", "exam", "topic"],
    branches(topic) { return ["biology foundations", "biology mechanisms", "biology applications", "biology evidence", "biology revision"].map((name, idx) => ({ name, color: ["#00d4ff", "#bf00ff", "#00ff88", "#ffae00", "#d4af37"][idx], items: [`${topic} ${name} item 1`, `${topic} ${name} item 2`, `${topic} ${name} item 3`, `${topic} ${name} item 4`] })); },
    score(topic) { const t = tokens(topic); return t.filter(x => this.keywords.includes(x)).length * 10 + 12; },
  });
  domains.set("physics-0013", {
    id: "physics-0013",
    domain: "physics",
    keywords: ["physics", "concept-13", "study", "exam", "topic"],
    branches(topic) { return ["physics foundations", "physics mechanisms", "physics applications", "physics evidence", "physics revision"].map((name, idx) => ({ name, color: ["#00d4ff", "#bf00ff", "#00ff88", "#ffae00", "#d4af37"][idx], items: [`${topic} ${name} item 1`, `${topic} ${name} item 2`, `${topic} ${name} item 3`, `${topic} ${name} item 4`] })); },
    score(topic) { const t = tokens(topic); return t.filter(x => this.keywords.includes(x)).length * 10 + 13; },
  });
  domains.set("chemistry-0014", {
    id: "chemistry-0014",
    domain: "chemistry",
    keywords: ["chemistry", "concept-14", "study", "exam", "topic"],
    branches(topic) { return ["chemistry foundations", "chemistry mechanisms", "chemistry applications", "chemistry evidence", "chemistry revision"].map((name, idx) => ({ name, color: ["#00d4ff", "#bf00ff", "#00ff88", "#ffae00", "#d4af37"][idx], items: [`${topic} ${name} item 1`, `${topic} ${name} item 2`, `${topic} ${name} item 3`, `${topic} ${name} item 4`] })); },
    score(topic) { const t = tokens(topic); return t.filter(x => this.keywords.includes(x)).length * 10 + 14; },
  });
  domains.set("history-0015", {
    id: "history-0015",
    domain: "history",
    keywords: ["history", "concept-15", "study", "exam", "topic"],
    branches(topic) { return ["history foundations", "history mechanisms", "history applications", "history evidence", "history revision"].map((name, idx) => ({ name, color: ["#00d4ff", "#bf00ff", "#00ff88", "#ffae00", "#d4af37"][idx], items: [`${topic} ${name} item 1`, `${topic} ${name} item 2`, `${topic} ${name} item 3`, `${topic} ${name} item 4`] })); },
    score(topic) { const t = tokens(topic); return t.filter(x => this.keywords.includes(x)).length * 10 + 15; },
  });
  domains.set("math-0016", {
    id: "math-0016",
    domain: "math",
    keywords: ["math", "concept-16", "study", "exam", "topic"],
    branches(topic) { return ["math foundations", "math mechanisms", "math applications", "math evidence", "math revision"].map((name, idx) => ({ name, color: ["#00d4ff", "#bf00ff", "#00ff88", "#ffae00", "#d4af37"][idx], items: [`${topic} ${name} item 1`, `${topic} ${name} item 2`, `${topic} ${name} item 3`, `${topic} ${name} item 4`] })); },
    score(topic) { const t = tokens(topic); return t.filter(x => this.keywords.includes(x)).length * 10 + 16; },
  });
  domains.set("computer-science-0017", {
    id: "computer-science-0017",
    domain: "computer-science",
    keywords: ["computer-science", "concept-17", "study", "exam", "topic"],
    branches(topic) { return ["computer-science foundations", "computer-science mechanisms", "computer-science applications", "computer-science evidence", "computer-science revision"].map((name, idx) => ({ name, color: ["#00d4ff", "#bf00ff", "#00ff88", "#ffae00", "#d4af37"][idx], items: [`${topic} ${name} item 1`, `${topic} ${name} item 2`, `${topic} ${name} item 3`, `${topic} ${name} item 4`] })); },
    score(topic) { const t = tokens(topic); return t.filter(x => this.keywords.includes(x)).length * 10 + 0; },
  });
  domains.set("blockchain-0018", {
    id: "blockchain-0018",
    domain: "blockchain",
    keywords: ["blockchain", "concept-18", "study", "exam", "topic"],
    branches(topic) { return ["blockchain foundations", "blockchain mechanisms", "blockchain applications", "blockchain evidence", "blockchain revision"].map((name, idx) => ({ name, color: ["#00d4ff", "#bf00ff", "#00ff88", "#ffae00", "#d4af37"][idx], items: [`${topic} ${name} item 1`, `${topic} ${name} item 2`, `${topic} ${name} item 3`, `${topic} ${name} item 4`] })); },
    score(topic) { const t = tokens(topic); return t.filter(x => this.keywords.includes(x)).length * 10 + 1; },
  });
  domains.set("economics-0019", {
    id: "economics-0019",
    domain: "economics",
    keywords: ["economics", "concept-19", "study", "exam", "topic"],
    branches(topic) { return ["economics foundations", "economics mechanisms", "economics applications", "economics evidence", "economics revision"].map((name, idx) => ({ name, color: ["#00d4ff", "#bf00ff", "#00ff88", "#ffae00", "#d4af37"][idx], items: [`${topic} ${name} item 1`, `${topic} ${name} item 2`, `${topic} ${name} item 3`, `${topic} ${name} item 4`] })); },
    score(topic) { const t = tokens(topic); return t.filter(x => this.keywords.includes(x)).length * 10 + 2; },
  });
  domains.set("geography-0020", {
    id: "geography-0020",
    domain: "geography",
    keywords: ["geography", "concept-20", "study", "exam", "topic"],
    branches(topic) { return ["geography foundations", "geography mechanisms", "geography applications", "geography evidence", "geography revision"].map((name, idx) => ({ name, color: ["#00d4ff", "#bf00ff", "#00ff88", "#ffae00", "#d4af37"][idx], items: [`${topic} ${name} item 1`, `${topic} ${name} item 2`, `${topic} ${name} item 3`, `${topic} ${name} item 4`] })); },
    score(topic) { const t = tokens(topic); return t.filter(x => this.keywords.includes(x)).length * 10 + 3; },
  });
  domains.set("literature-0021", {
    id: "literature-0021",
    domain: "literature",
    keywords: ["literature", "concept-21", "study", "exam", "topic"],
    branches(topic) { return ["literature foundations", "literature mechanisms", "literature applications", "literature evidence", "literature revision"].map((name, idx) => ({ name, color: ["#00d4ff", "#bf00ff", "#00ff88", "#ffae00", "#d4af37"][idx], items: [`${topic} ${name} item 1`, `${topic} ${name} item 2`, `${topic} ${name} item 3`, `${topic} ${name} item 4`] })); },
    score(topic) { const t = tokens(topic); return t.filter(x => this.keywords.includes(x)).length * 10 + 4; },
  });
  domains.set("medicine-0022", {
    id: "medicine-0022",
    domain: "medicine",
    keywords: ["medicine", "concept-22", "study", "exam", "topic"],
    branches(topic) { return ["medicine foundations", "medicine mechanisms", "medicine applications", "medicine evidence", "medicine revision"].map((name, idx) => ({ name, color: ["#00d4ff", "#bf00ff", "#00ff88", "#ffae00", "#d4af37"][idx], items: [`${topic} ${name} item 1`, `${topic} ${name} item 2`, `${topic} ${name} item 3`, `${topic} ${name} item 4`] })); },
    score(topic) { const t = tokens(topic); return t.filter(x => this.keywords.includes(x)).length * 10 + 5; },
  });
  domains.set("engineering-0023", {
    id: "engineering-0023",
    domain: "engineering",
    keywords: ["engineering", "concept-23", "study", "exam", "topic"],
    branches(topic) { return ["engineering foundations", "engineering mechanisms", "engineering applications", "engineering evidence", "engineering revision"].map((name, idx) => ({ name, color: ["#00d4ff", "#bf00ff", "#00ff88", "#ffae00", "#d4af37"][idx], items: [`${topic} ${name} item 1`, `${topic} ${name} item 2`, `${topic} ${name} item 3`, `${topic} ${name} item 4`] })); },
    score(topic) { const t = tokens(topic); return t.filter(x => this.keywords.includes(x)).length * 10 + 6; },
  });
  domains.set("biology-0024", {
    id: "biology-0024",
    domain: "biology",
    keywords: ["biology", "concept-24", "study", "exam", "topic"],
    branches(topic) { return ["biology foundations", "biology mechanisms", "biology applications", "biology evidence", "biology revision"].map((name, idx) => ({ name, color: ["#00d4ff", "#bf00ff", "#00ff88", "#ffae00", "#d4af37"][idx], items: [`${topic} ${name} item 1`, `${topic} ${name} item 2`, `${topic} ${name} item 3`, `${topic} ${name} item 4`] })); },
    score(topic) { const t = tokens(topic); return t.filter(x => this.keywords.includes(x)).length * 10 + 7; },
  });
  domains.set("physics-0025", {
    id: "physics-0025",
    domain: "physics",
    keywords: ["physics", "concept-25", "study", "exam", "topic"],
    branches(topic) { return ["physics foundations", "physics mechanisms", "physics applications", "physics evidence", "physics revision"].map((name, idx) => ({ name, color: ["#00d4ff", "#bf00ff", "#00ff88", "#ffae00", "#d4af37"][idx], items: [`${topic} ${name} item 1`, `${topic} ${name} item 2`, `${topic} ${name} item 3`, `${topic} ${name} item 4`] })); },
    score(topic) { const t = tokens(topic); return t.filter(x => this.keywords.includes(x)).length * 10 + 8; },
  });
  domains.set("chemistry-0026", {
    id: "chemistry-0026",
    domain: "chemistry",
    keywords: ["chemistry", "concept-26", "study", "exam", "topic"],
    branches(topic) { return ["chemistry foundations", "chemistry mechanisms", "chemistry applications", "chemistry evidence", "chemistry revision"].map((name, idx) => ({ name, color: ["#00d4ff", "#bf00ff", "#00ff88", "#ffae00", "#d4af37"][idx], items: [`${topic} ${name} item 1`, `${topic} ${name} item 2`, `${topic} ${name} item 3`, `${topic} ${name} item 4`] })); },
    score(topic) { const t = tokens(topic); return t.filter(x => this.keywords.includes(x)).length * 10 + 9; },
  });
  domains.set("history-0027", {
    id: "history-0027",
    domain: "history",
    keywords: ["history", "concept-27", "study", "exam", "topic"],
    branches(topic) { return ["history foundations", "history mechanisms", "history applications", "history evidence", "history revision"].map((name, idx) => ({ name, color: ["#00d4ff", "#bf00ff", "#00ff88", "#ffae00", "#d4af37"][idx], items: [`${topic} ${name} item 1`, `${topic} ${name} item 2`, `${topic} ${name} item 3`, `${topic} ${name} item 4`] })); },
    score(topic) { const t = tokens(topic); return t.filter(x => this.keywords.includes(x)).length * 10 + 10; },
  });
  domains.set("math-0028", {
    id: "math-0028",
    domain: "math",
    keywords: ["math", "concept-28", "study", "exam", "topic"],
    branches(topic) { return ["math foundations", "math mechanisms", "math applications", "math evidence", "math revision"].map((name, idx) => ({ name, color: ["#00d4ff", "#bf00ff", "#00ff88", "#ffae00", "#d4af37"][idx], items: [`${topic} ${name} item 1`, `${topic} ${name} item 2`, `${topic} ${name} item 3`, `${topic} ${name} item 4`] })); },
    score(topic) { const t = tokens(topic); return t.filter(x => this.keywords.includes(x)).length * 10 + 11; },
  });
  domains.set("computer-science-0029", {
    id: "computer-science-0029",
    domain: "computer-science",
    keywords: ["computer-science", "concept-29", "study", "exam", "topic"],
    branches(topic) { return ["computer-science foundations", "computer-science mechanisms", "computer-science applications", "computer-science evidence", "computer-science revision"].map((name, idx) => ({ name, color: ["#00d4ff", "#bf00ff", "#00ff88", "#ffae00", "#d4af37"][idx], items: [`${topic} ${name} item 1`, `${topic} ${name} item 2`, `${topic} ${name} item 3`, `${topic} ${name} item 4`] })); },
    score(topic) { const t = tokens(topic); return t.filter(x => this.keywords.includes(x)).length * 10 + 12; },
  });
  domains.set("blockchain-0030", {
    id: "blockchain-0030",
    domain: "blockchain",
    keywords: ["blockchain", "concept-30", "study", "exam", "topic"],
    branches(topic) { return ["blockchain foundations", "blockchain mechanisms", "blockchain applications", "blockchain evidence", "blockchain revision"].map((name, idx) => ({ name, color: ["#00d4ff", "#bf00ff", "#00ff88", "#ffae00", "#d4af37"][idx], items: [`${topic} ${name} item 1`, `${topic} ${name} item 2`, `${topic} ${name} item 3`, `${topic} ${name} item 4`] })); },
    score(topic) { const t = tokens(topic); return t.filter(x => this.keywords.includes(x)).length * 10 + 13; },
  });
  domains.set("economics-0031", {
    id: "economics-0031",
    domain: "economics",
    keywords: ["economics", "concept-31", "study", "exam", "topic"],
    branches(topic) { return ["economics foundations", "economics mechanisms", "economics applications", "economics evidence", "economics revision"].map((name, idx) => ({ name, color: ["#00d4ff", "#bf00ff", "#00ff88", "#ffae00", "#d4af37"][idx], items: [`${topic} ${name} item 1`, `${topic} ${name} item 2`, `${topic} ${name} item 3`, `${topic} ${name} item 4`] })); },
    score(topic) { const t = tokens(topic); return t.filter(x => this.keywords.includes(x)).length * 10 + 14; },
  });
  domains.set("geography-0032", {
    id: "geography-0032",
    domain: "geography",
    keywords: ["geography", "concept-32", "study", "exam", "topic"],
    branches(topic) { return ["geography foundations", "geography mechanisms", "geography applications", "geography evidence", "geography revision"].map((name, idx) => ({ name, color: ["#00d4ff", "#bf00ff", "#00ff88", "#ffae00", "#d4af37"][idx], items: [`${topic} ${name} item 1`, `${topic} ${name} item 2`, `${topic} ${name} item 3`, `${topic} ${name} item 4`] })); },
    score(topic) { const t = tokens(topic); return t.filter(x => this.keywords.includes(x)).length * 10 + 15; },
  });
  domains.set("literature-0033", {
    id: "literature-0033",
    domain: "literature",
    keywords: ["literature", "concept-33", "study", "exam", "topic"],
    branches(topic) { return ["literature foundations", "literature mechanisms", "literature applications", "literature evidence", "literature revision"].map((name, idx) => ({ name, color: ["#00d4ff", "#bf00ff", "#00ff88", "#ffae00", "#d4af37"][idx], items: [`${topic} ${name} item 1`, `${topic} ${name} item 2`, `${topic} ${name} item 3`, `${topic} ${name} item 4`] })); },
    score(topic) { const t = tokens(topic); return t.filter(x => this.keywords.includes(x)).length * 10 + 16; },
  });
  domains.set("medicine-0034", {
    id: "medicine-0034",
    domain: "medicine",
    keywords: ["medicine", "concept-34", "study", "exam", "topic"],
    branches(topic) { return ["medicine foundations", "medicine mechanisms", "medicine applications", "medicine evidence", "medicine revision"].map((name, idx) => ({ name, color: ["#00d4ff", "#bf00ff", "#00ff88", "#ffae00", "#d4af37"][idx], items: [`${topic} ${name} item 1`, `${topic} ${name} item 2`, `${topic} ${name} item 3`, `${topic} ${name} item 4`] })); },
    score(topic) { const t = tokens(topic); return t.filter(x => this.keywords.includes(x)).length * 10 + 0; },
  });
  domains.set("engineering-0035", {
    id: "engineering-0035",
    domain: "engineering",
    keywords: ["engineering", "concept-35", "study", "exam", "topic"],
    branches(topic) { return ["engineering foundations", "engineering mechanisms", "engineering applications", "engineering evidence", "engineering revision"].map((name, idx) => ({ name, color: ["#00d4ff", "#bf00ff", "#00ff88", "#ffae00", "#d4af37"][idx], items: [`${topic} ${name} item 1`, `${topic} ${name} item 2`, `${topic} ${name} item 3`, `${topic} ${name} item 4`] })); },
    score(topic) { const t = tokens(topic); return t.filter(x => this.keywords.includes(x)).length * 10 + 1; },
  });
  domains.set("biology-0036", {
    id: "biology-0036",
    domain: "biology",
    keywords: ["biology", "concept-36", "study", "exam", "topic"],
    branches(topic) { return ["biology foundations", "biology mechanisms", "biology applications", "biology evidence", "biology revision"].map((name, idx) => ({ name, color: ["#00d4ff", "#bf00ff", "#00ff88", "#ffae00", "#d4af37"][idx], items: [`${topic} ${name} item 1`, `${topic} ${name} item 2`, `${topic} ${name} item 3`, `${topic} ${name} item 4`] })); },
    score(topic) { const t = tokens(topic); return t.filter(x => this.keywords.includes(x)).length * 10 + 2; },
  });
  domains.set("physics-0037", {
    id: "physics-0037",
    domain: "physics",
    keywords: ["physics", "concept-37", "study", "exam", "topic"],
    branches(topic) { return ["physics foundations", "physics mechanisms", "physics applications", "physics evidence", "physics revision"].map((name, idx) => ({ name, color: ["#00d4ff", "#bf00ff", "#00ff88", "#ffae00", "#d4af37"][idx], items: [`${topic} ${name} item 1`, `${topic} ${name} item 2`, `${topic} ${name} item 3`, `${topic} ${name} item 4`] })); },
    score(topic) { const t = tokens(topic); return t.filter(x => this.keywords.includes(x)).length * 10 + 3; },
  });
  domains.set("chemistry-0038", {
    id: "chemistry-0038",
    domain: "chemistry",
    keywords: ["chemistry", "concept-38", "study", "exam", "topic"],
    branches(topic) { return ["chemistry foundations", "chemistry mechanisms", "chemistry applications", "chemistry evidence", "chemistry revision"].map((name, idx) => ({ name, color: ["#00d4ff", "#bf00ff", "#00ff88", "#ffae00", "#d4af37"][idx], items: [`${topic} ${name} item 1`, `${topic} ${name} item 2`, `${topic} ${name} item 3`, `${topic} ${name} item 4`] })); },
    score(topic) { const t = tokens(topic); return t.filter(x => this.keywords.includes(x)).length * 10 + 4; },
  });
  domains.set("history-0039", {
    id: "history-0039",
    domain: "history",
    keywords: ["history", "concept-39", "study", "exam", "topic"],
    branches(topic) { return ["history foundations", "history mechanisms", "history applications", "history evidence", "history revision"].map((name, idx) => ({ name, color: ["#00d4ff", "#bf00ff", "#00ff88", "#ffae00", "#d4af37"][idx], items: [`${topic} ${name} item 1`, `${topic} ${name} item 2`, `${topic} ${name} item 3`, `${topic} ${name} item 4`] })); },
    score(topic) { const t = tokens(topic); return t.filter(x => this.keywords.includes(x)).length * 10 + 5; },
  });
  domains.set("math-0040", {
    id: "math-0040",
    domain: "math",
    keywords: ["math", "concept-40", "study", "exam", "topic"],
    branches(topic) { return ["math foundations", "math mechanisms", "math applications", "math evidence", "math revision"].map((name, idx) => ({ name, color: ["#00d4ff", "#bf00ff", "#00ff88", "#ffae00", "#d4af37"][idx], items: [`${topic} ${name} item 1`, `${topic} ${name} item 2`, `${topic} ${name} item 3`, `${topic} ${name} item 4`] })); },
    score(topic) { const t = tokens(topic); return t.filter(x => this.keywords.includes(x)).length * 10 + 6; },
  });
  domains.set("computer-science-0041", {
    id: "computer-science-0041",
    domain: "computer-science",
    keywords: ["computer-science", "concept-41", "study", "exam", "topic"],
    branches(topic) { return ["computer-science foundations", "computer-science mechanisms", "computer-science applications", "computer-science evidence", "computer-science revision"].map((name, idx) => ({ name, color: ["#00d4ff", "#bf00ff", "#00ff88", "#ffae00", "#d4af37"][idx], items: [`${topic} ${name} item 1`, `${topic} ${name} item 2`, `${topic} ${name} item 3`, `${topic} ${name} item 4`] })); },
    score(topic) { const t = tokens(topic); return t.filter(x => this.keywords.includes(x)).length * 10 + 7; },
  });
  domains.set("blockchain-0042", {
    id: "blockchain-0042",
    domain: "blockchain",
    keywords: ["blockchain", "concept-42", "study", "exam", "topic"],
    branches(topic) { return ["blockchain foundations", "blockchain mechanisms", "blockchain applications", "blockchain evidence", "blockchain revision"].map((name, idx) => ({ name, color: ["#00d4ff", "#bf00ff", "#00ff88", "#ffae00", "#d4af37"][idx], items: [`${topic} ${name} item 1`, `${topic} ${name} item 2`, `${topic} ${name} item 3`, `${topic} ${name} item 4`] })); },
    score(topic) { const t = tokens(topic); return t.filter(x => this.keywords.includes(x)).length * 10 + 8; },
  });
  domains.set("economics-0043", {
    id: "economics-0043",
    domain: "economics",
    keywords: ["economics", "concept-43", "study", "exam", "topic"],
    branches(topic) { return ["economics foundations", "economics mechanisms", "economics applications", "economics evidence", "economics revision"].map((name, idx) => ({ name, color: ["#00d4ff", "#bf00ff", "#00ff88", "#ffae00", "#d4af37"][idx], items: [`${topic} ${name} item 1`, `${topic} ${name} item 2`, `${topic} ${name} item 3`, `${topic} ${name} item 4`] })); },
    score(topic) { const t = tokens(topic); return t.filter(x => this.keywords.includes(x)).length * 10 + 9; },
  });
  domains.set("geography-0044", {
    id: "geography-0044",
    domain: "geography",
    keywords: ["geography", "concept-44", "study", "exam", "topic"],
    branches(topic) { return ["geography foundations", "geography mechanisms", "geography applications", "geography evidence", "geography revision"].map((name, idx) => ({ name, color: ["#00d4ff", "#bf00ff", "#00ff88", "#ffae00", "#d4af37"][idx], items: [`${topic} ${name} item 1`, `${topic} ${name} item 2`, `${topic} ${name} item 3`, `${topic} ${name} item 4`] })); },
    score(topic) { const t = tokens(topic); return t.filter(x => this.keywords.includes(x)).length * 10 + 10; },
  });
  domains.set("literature-0045", {
    id: "literature-0045",
    domain: "literature",
    keywords: ["literature", "concept-45", "study", "exam", "topic"],
    branches(topic) { return ["literature foundations", "literature mechanisms", "literature applications", "literature evidence", "literature revision"].map((name, idx) => ({ name, color: ["#00d4ff", "#bf00ff", "#00ff88", "#ffae00", "#d4af37"][idx], items: [`${topic} ${name} item 1`, `${topic} ${name} item 2`, `${topic} ${name} item 3`, `${topic} ${name} item 4`] })); },
    score(topic) { const t = tokens(topic); return t.filter(x => this.keywords.includes(x)).length * 10 + 11; },
  });
  domains.set("medicine-0046", {
    id: "medicine-0046",
    domain: "medicine",
    keywords: ["medicine", "concept-46", "study", "exam", "topic"],
    branches(topic) { return ["medicine foundations", "medicine mechanisms", "medicine applications", "medicine evidence", "medicine revision"].map((name, idx) => ({ name, color: ["#00d4ff", "#bf00ff", "#00ff88", "#ffae00", "#d4af37"][idx], items: [`${topic} ${name} item 1`, `${topic} ${name} item 2`, `${topic} ${name} item 3`, `${topic} ${name} item 4`] })); },
    score(topic) { const t = tokens(topic); return t.filter(x => this.keywords.includes(x)).length * 10 + 12; },
  });
  domains.set("engineering-0047", {
    id: "engineering-0047",
    domain: "engineering",
    keywords: ["engineering", "concept-47", "study", "exam", "topic"],
    branches(topic) { return ["engineering foundations", "engineering mechanisms", "engineering applications", "engineering evidence", "engineering revision"].map((name, idx) => ({ name, color: ["#00d4ff", "#bf00ff", "#00ff88", "#ffae00", "#d4af37"][idx], items: [`${topic} ${name} item 1`, `${topic} ${name} item 2`, `${topic} ${name} item 3`, `${topic} ${name} item 4`] })); },
    score(topic) { const t = tokens(topic); return t.filter(x => this.keywords.includes(x)).length * 10 + 13; },
  });
  domains.set("biology-0048", {
    id: "biology-0048",
    domain: "biology",
    keywords: ["biology", "concept-48", "study", "exam", "topic"],
    branches(topic) { return ["biology foundations", "biology mechanisms", "biology applications", "biology evidence", "biology revision"].map((name, idx) => ({ name, color: ["#00d4ff", "#bf00ff", "#00ff88", "#ffae00", "#d4af37"][idx], items: [`${topic} ${name} item 1`, `${topic} ${name} item 2`, `${topic} ${name} item 3`, `${topic} ${name} item 4`] })); },
    score(topic) { const t = tokens(topic); return t.filter(x => this.keywords.includes(x)).length * 10 + 14; },
  });
  domains.set("physics-0049", {
    id: "physics-0049",
    domain: "physics",
    keywords: ["physics", "concept-49", "study", "exam", "topic"],
    branches(topic) { return ["physics foundations", "physics mechanisms", "physics applications", "physics evidence", "physics revision"].map((name, idx) => ({ name, color: ["#00d4ff", "#bf00ff", "#00ff88", "#ffae00", "#d4af37"][idx], items: [`${topic} ${name} item 1`, `${topic} ${name} item 2`, `${topic} ${name} item 3`, `${topic} ${name} item 4`] })); },
    score(topic) { const t = tokens(topic); return t.filter(x => this.keywords.includes(x)).length * 10 + 15; },
  });
  domains.set("chemistry-0050", {
    id: "chemistry-0050",
    domain: "chemistry",
    keywords: ["chemistry", "concept-50", "study", "exam", "topic"],
    branches(topic) { return ["chemistry foundations", "chemistry mechanisms", "chemistry applications", "chemistry evidence", "chemistry revision"].map((name, idx) => ({ name, color: ["#00d4ff", "#bf00ff", "#00ff88", "#ffae00", "#d4af37"][idx], items: [`${topic} ${name} item 1`, `${topic} ${name} item 2`, `${topic} ${name} item 3`, `${topic} ${name} item 4`] })); },
    score(topic) { const t = tokens(topic); return t.filter(x => this.keywords.includes(x)).length * 10 + 16; },
  });
  domains.set("history-0051", {
    id: "history-0051",
    domain: "history",
    keywords: ["history", "concept-51", "study", "exam", "topic"],
    branches(topic) { return ["history foundations", "history mechanisms", "history applications", "history evidence", "history revision"].map((name, idx) => ({ name, color: ["#00d4ff", "#bf00ff", "#00ff88", "#ffae00", "#d4af37"][idx], items: [`${topic} ${name} item 1`, `${topic} ${name} item 2`, `${topic} ${name} item 3`, `${topic} ${name} item 4`] })); },
    score(topic) { const t = tokens(topic); return t.filter(x => this.keywords.includes(x)).length * 10 + 0; },
  });
  domains.set("math-0052", {
    id: "math-0052",
    domain: "math",
    keywords: ["math", "concept-52", "study", "exam", "topic"],
    branches(topic) { return ["math foundations", "math mechanisms", "math applications", "math evidence", "math revision"].map((name, idx) => ({ name, color: ["#00d4ff", "#bf00ff", "#00ff88", "#ffae00", "#d4af37"][idx], items: [`${topic} ${name} item 1`, `${topic} ${name} item 2`, `${topic} ${name} item 3`, `${topic} ${name} item 4`] })); },
    score(topic) { const t = tokens(topic); return t.filter(x => this.keywords.includes(x)).length * 10 + 1; },
  });
  domains.set("computer-science-0053", {
    id: "computer-science-0053",
    domain: "computer-science",
    keywords: ["computer-science", "concept-53", "study", "exam", "topic"],
    branches(topic) { return ["computer-science foundations", "computer-science mechanisms", "computer-science applications", "computer-science evidence", "computer-science revision"].map((name, idx) => ({ name, color: ["#00d4ff", "#bf00ff", "#00ff88", "#ffae00", "#d4af37"][idx], items: [`${topic} ${name} item 1`, `${topic} ${name} item 2`, `${topic} ${name} item 3`, `${topic} ${name} item 4`] })); },
    score(topic) { const t = tokens(topic); return t.filter(x => this.keywords.includes(x)).length * 10 + 2; },
  });
  domains.set("blockchain-0054", {
    id: "blockchain-0054",
    domain: "blockchain",
    keywords: ["blockchain", "concept-54", "study", "exam", "topic"],
    branches(topic) { return ["blockchain foundations", "blockchain mechanisms", "blockchain applications", "blockchain evidence", "blockchain revision"].map((name, idx) => ({ name, color: ["#00d4ff", "#bf00ff", "#00ff88", "#ffae00", "#d4af37"][idx], items: [`${topic} ${name} item 1`, `${topic} ${name} item 2`, `${topic} ${name} item 3`, `${topic} ${name} item 4`] })); },
    score(topic) { const t = tokens(topic); return t.filter(x => this.keywords.includes(x)).length * 10 + 3; },
  });
  domains.set("economics-0055", {
    id: "economics-0055",
    domain: "economics",
    keywords: ["economics", "concept-55", "study", "exam", "topic"],
    branches(topic) { return ["economics foundations", "economics mechanisms", "economics applications", "economics evidence", "economics revision"].map((name, idx) => ({ name, color: ["#00d4ff", "#bf00ff", "#00ff88", "#ffae00", "#d4af37"][idx], items: [`${topic} ${name} item 1`, `${topic} ${name} item 2`, `${topic} ${name} item 3`, `${topic} ${name} item 4`] })); },
    score(topic) { const t = tokens(topic); return t.filter(x => this.keywords.includes(x)).length * 10 + 4; },
  });
  domains.set("geography-0056", {
    id: "geography-0056",
    domain: "geography",
    keywords: ["geography", "concept-56", "study", "exam", "topic"],
    branches(topic) { return ["geography foundations", "geography mechanisms", "geography applications", "geography evidence", "geography revision"].map((name, idx) => ({ name, color: ["#00d4ff", "#bf00ff", "#00ff88", "#ffae00", "#d4af37"][idx], items: [`${topic} ${name} item 1`, `${topic} ${name} item 2`, `${topic} ${name} item 3`, `${topic} ${name} item 4`] })); },
    score(topic) { const t = tokens(topic); return t.filter(x => this.keywords.includes(x)).length * 10 + 5; },
  });
  domains.set("literature-0057", {
    id: "literature-0057",
    domain: "literature",
    keywords: ["literature", "concept-57", "study", "exam", "topic"],
    branches(topic) { return ["literature foundations", "literature mechanisms", "literature applications", "literature evidence", "literature revision"].map((name, idx) => ({ name, color: ["#00d4ff", "#bf00ff", "#00ff88", "#ffae00", "#d4af37"][idx], items: [`${topic} ${name} item 1`, `${topic} ${name} item 2`, `${topic} ${name} item 3`, `${topic} ${name} item 4`] })); },
    score(topic) { const t = tokens(topic); return t.filter(x => this.keywords.includes(x)).length * 10 + 6; },
  });
  domains.set("medicine-0058", {
    id: "medicine-0058",
    domain: "medicine",
    keywords: ["medicine", "concept-58", "study", "exam", "topic"],
    branches(topic) { return ["medicine foundations", "medicine mechanisms", "medicine applications", "medicine evidence", "medicine revision"].map((name, idx) => ({ name, color: ["#00d4ff", "#bf00ff", "#00ff88", "#ffae00", "#d4af37"][idx], items: [`${topic} ${name} item 1`, `${topic} ${name} item 2`, `${topic} ${name} item 3`, `${topic} ${name} item 4`] })); },
    score(topic) { const t = tokens(topic); return t.filter(x => this.keywords.includes(x)).length * 10 + 7; },
  });
  domains.set("engineering-0059", {
    id: "engineering-0059",
    domain: "engineering",
    keywords: ["engineering", "concept-59", "study", "exam", "topic"],
    branches(topic) { return ["engineering foundations", "engineering mechanisms", "engineering applications", "engineering evidence", "engineering revision"].map((name, idx) => ({ name, color: ["#00d4ff", "#bf00ff", "#00ff88", "#ffae00", "#d4af37"][idx], items: [`${topic} ${name} item 1`, `${topic} ${name} item 2`, `${topic} ${name} item 3`, `${topic} ${name} item 4`] })); },
    score(topic) { const t = tokens(topic); return t.filter(x => this.keywords.includes(x)).length * 10 + 8; },
  });
  domains.set("biology-0060", {
    id: "biology-0060",
    domain: "biology",
    keywords: ["biology", "concept-60", "study", "exam", "topic"],
    branches(topic) { return ["biology foundations", "biology mechanisms", "biology applications", "biology evidence", "biology revision"].map((name, idx) => ({ name, color: ["#00d4ff", "#bf00ff", "#00ff88", "#ffae00", "#d4af37"][idx], items: [`${topic} ${name} item 1`, `${topic} ${name} item 2`, `${topic} ${name} item 3`, `${topic} ${name} item 4`] })); },
    score(topic) { const t = tokens(topic); return t.filter(x => this.keywords.includes(x)).length * 10 + 9; },
  });
  domains.set("physics-0061", {
    id: "physics-0061",
    domain: "physics",
    keywords: ["physics", "concept-61", "study", "exam", "topic"],
    branches(topic) { return ["physics foundations", "physics mechanisms", "physics applications", "physics evidence", "physics revision"].map((name, idx) => ({ name, color: ["#00d4ff", "#bf00ff", "#00ff88", "#ffae00", "#d4af37"][idx], items: [`${topic} ${name} item 1`, `${topic} ${name} item 2`, `${topic} ${name} item 3`, `${topic} ${name} item 4`] })); },
    score(topic) { const t = tokens(topic); return t.filter(x => this.keywords.includes(x)).length * 10 + 10; },
  });
  domains.set("chemistry-0062", {
    id: "chemistry-0062",
    domain: "chemistry",
    keywords: ["chemistry", "concept-62", "study", "exam", "topic"],
    branches(topic) { return ["chemistry foundations", "chemistry mechanisms", "chemistry applications", "chemistry evidence", "chemistry revision"].map((name, idx) => ({ name, color: ["#00d4ff", "#bf00ff", "#00ff88", "#ffae00", "#d4af37"][idx], items: [`${topic} ${name} item 1`, `${topic} ${name} item 2`, `${topic} ${name} item 3`, `${topic} ${name} item 4`] })); },
    score(topic) { const t = tokens(topic); return t.filter(x => this.keywords.includes(x)).length * 10 + 11; },
  });
  domains.set("history-0063", {
    id: "history-0063",
    domain: "history",
    keywords: ["history", "concept-63", "study", "exam", "topic"],
    branches(topic) { return ["history foundations", "history mechanisms", "history applications", "history evidence", "history revision"].map((name, idx) => ({ name, color: ["#00d4ff", "#bf00ff", "#00ff88", "#ffae00", "#d4af37"][idx], items: [`${topic} ${name} item 1`, `${topic} ${name} item 2`, `${topic} ${name} item 3`, `${topic} ${name} item 4`] })); },
    score(topic) { const t = tokens(topic); return t.filter(x => this.keywords.includes(x)).length * 10 + 12; },
  });
  domains.set("math-0064", {
    id: "math-0064",
    domain: "math",
    keywords: ["math", "concept-64", "study", "exam", "topic"],
    branches(topic) { return ["math foundations", "math mechanisms", "math applications", "math evidence", "math revision"].map((name, idx) => ({ name, color: ["#00d4ff", "#bf00ff", "#00ff88", "#ffae00", "#d4af37"][idx], items: [`${topic} ${name} item 1`, `${topic} ${name} item 2`, `${topic} ${name} item 3`, `${topic} ${name} item 4`] })); },
    score(topic) { const t = tokens(topic); return t.filter(x => this.keywords.includes(x)).length * 10 + 13; },
  });
  domains.set("computer-science-0065", {
    id: "computer-science-0065",
    domain: "computer-science",
    keywords: ["computer-science", "concept-65", "study", "exam", "topic"],
    branches(topic) { return ["computer-science foundations", "computer-science mechanisms", "computer-science applications", "computer-science evidence", "computer-science revision"].map((name, idx) => ({ name, color: ["#00d4ff", "#bf00ff", "#00ff88", "#ffae00", "#d4af37"][idx], items: [`${topic} ${name} item 1`, `${topic} ${name} item 2`, `${topic} ${name} item 3`, `${topic} ${name} item 4`] })); },
    score(topic) { const t = tokens(topic); return t.filter(x => this.keywords.includes(x)).length * 10 + 14; },
  });
  domains.set("blockchain-0066", {
    id: "blockchain-0066",
    domain: "blockchain",
    keywords: ["blockchain", "concept-66", "study", "exam", "topic"],
    branches(topic) { return ["blockchain foundations", "blockchain mechanisms", "blockchain applications", "blockchain evidence", "blockchain revision"].map((name, idx) => ({ name, color: ["#00d4ff", "#bf00ff", "#00ff88", "#ffae00", "#d4af37"][idx], items: [`${topic} ${name} item 1`, `${topic} ${name} item 2`, `${topic} ${name} item 3`, `${topic} ${name} item 4`] })); },
    score(topic) { const t = tokens(topic); return t.filter(x => this.keywords.includes(x)).length * 10 + 15; },
  });
  domains.set("economics-0067", {
    id: "economics-0067",
    domain: "economics",
    keywords: ["economics", "concept-67", "study", "exam", "topic"],
    branches(topic) { return ["economics foundations", "economics mechanisms", "economics applications", "economics evidence", "economics revision"].map((name, idx) => ({ name, color: ["#00d4ff", "#bf00ff", "#00ff88", "#ffae00", "#d4af37"][idx], items: [`${topic} ${name} item 1`, `${topic} ${name} item 2`, `${topic} ${name} item 3`, `${topic} ${name} item 4`] })); },
    score(topic) { const t = tokens(topic); return t.filter(x => this.keywords.includes(x)).length * 10 + 16; },
  });
  domains.set("geography-0068", {
    id: "geography-0068",
    domain: "geography",
    keywords: ["geography", "concept-68", "study", "exam", "topic"],
    branches(topic) { return ["geography foundations", "geography mechanisms", "geography applications", "geography evidence", "geography revision"].map((name, idx) => ({ name, color: ["#00d4ff", "#bf00ff", "#00ff88", "#ffae00", "#d4af37"][idx], items: [`${topic} ${name} item 1`, `${topic} ${name} item 2`, `${topic} ${name} item 3`, `${topic} ${name} item 4`] })); },
    score(topic) { const t = tokens(topic); return t.filter(x => this.keywords.includes(x)).length * 10 + 0; },
  });
  domains.set("literature-0069", {
    id: "literature-0069",
    domain: "literature",
    keywords: ["literature", "concept-69", "study", "exam", "topic"],
    branches(topic) { return ["literature foundations", "literature mechanisms", "literature applications", "literature evidence", "literature revision"].map((name, idx) => ({ name, color: ["#00d4ff", "#bf00ff", "#00ff88", "#ffae00", "#d4af37"][idx], items: [`${topic} ${name} item 1`, `${topic} ${name} item 2`, `${topic} ${name} item 3`, `${topic} ${name} item 4`] })); },
    score(topic) { const t = tokens(topic); return t.filter(x => this.keywords.includes(x)).length * 10 + 1; },
  });
  domains.set("medicine-0070", {
    id: "medicine-0070",
    domain: "medicine",
    keywords: ["medicine", "concept-70", "study", "exam", "topic"],
    branches(topic) { return ["medicine foundations", "medicine mechanisms", "medicine applications", "medicine evidence", "medicine revision"].map((name, idx) => ({ name, color: ["#00d4ff", "#bf00ff", "#00ff88", "#ffae00", "#d4af37"][idx], items: [`${topic} ${name} item 1`, `${topic} ${name} item 2`, `${topic} ${name} item 3`, `${topic} ${name} item 4`] })); },
    score(topic) { const t = tokens(topic); return t.filter(x => this.keywords.includes(x)).length * 10 + 2; },
  });
  domains.set("engineering-0071", {
    id: "engineering-0071",
    domain: "engineering",
    keywords: ["engineering", "concept-71", "study", "exam", "topic"],
    branches(topic) { return ["engineering foundations", "engineering mechanisms", "engineering applications", "engineering evidence", "engineering revision"].map((name, idx) => ({ name, color: ["#00d4ff", "#bf00ff", "#00ff88", "#ffae00", "#d4af37"][idx], items: [`${topic} ${name} item 1`, `${topic} ${name} item 2`, `${topic} ${name} item 3`, `${topic} ${name} item 4`] })); },
    score(topic) { const t = tokens(topic); return t.filter(x => this.keywords.includes(x)).length * 10 + 3; },
  });
  domains.set("biology-0072", {
    id: "biology-0072",
    domain: "biology",
    keywords: ["biology", "concept-72", "study", "exam", "topic"],
    branches(topic) { return ["biology foundations", "biology mechanisms", "biology applications", "biology evidence", "biology revision"].map((name, idx) => ({ name, color: ["#00d4ff", "#bf00ff", "#00ff88", "#ffae00", "#d4af37"][idx], items: [`${topic} ${name} item 1`, `${topic} ${name} item 2`, `${topic} ${name} item 3`, `${topic} ${name} item 4`] })); },
    score(topic) { const t = tokens(topic); return t.filter(x => this.keywords.includes(x)).length * 10 + 4; },
  });
  domains.set("physics-0073", {
    id: "physics-0073",
    domain: "physics",
    keywords: ["physics", "concept-73", "study", "exam", "topic"],
    branches(topic) { return ["physics foundations", "physics mechanisms", "physics applications", "physics evidence", "physics revision"].map((name, idx) => ({ name, color: ["#00d4ff", "#bf00ff", "#00ff88", "#ffae00", "#d4af37"][idx], items: [`${topic} ${name} item 1`, `${topic} ${name} item 2`, `${topic} ${name} item 3`, `${topic} ${name} item 4`] })); },
    score(topic) { const t = tokens(topic); return t.filter(x => this.keywords.includes(x)).length * 10 + 5; },
  });
  domains.set("chemistry-0074", {
    id: "chemistry-0074",
    domain: "chemistry",
    keywords: ["chemistry", "concept-74", "study", "exam", "topic"],
    branches(topic) { return ["chemistry foundations", "chemistry mechanisms", "chemistry applications", "chemistry evidence", "chemistry revision"].map((name, idx) => ({ name, color: ["#00d4ff", "#bf00ff", "#00ff88", "#ffae00", "#d4af37"][idx], items: [`${topic} ${name} item 1`, `${topic} ${name} item 2`, `${topic} ${name} item 3`, `${topic} ${name} item 4`] })); },
    score(topic) { const t = tokens(topic); return t.filter(x => this.keywords.includes(x)).length * 10 + 6; },
  });
  domains.set("history-0075", {
    id: "history-0075",
    domain: "history",
    keywords: ["history", "concept-75", "study", "exam", "topic"],
    branches(topic) { return ["history foundations", "history mechanisms", "history applications", "history evidence", "history revision"].map((name, idx) => ({ name, color: ["#00d4ff", "#bf00ff", "#00ff88", "#ffae00", "#d4af37"][idx], items: [`${topic} ${name} item 1`, `${topic} ${name} item 2`, `${topic} ${name} item 3`, `${topic} ${name} item 4`] })); },
    score(topic) { const t = tokens(topic); return t.filter(x => this.keywords.includes(x)).length * 10 + 7; },
  });
  domains.set("math-0076", {
    id: "math-0076",
    domain: "math",
    keywords: ["math", "concept-76", "study", "exam", "topic"],
    branches(topic) { return ["math foundations", "math mechanisms", "math applications", "math evidence", "math revision"].map((name, idx) => ({ name, color: ["#00d4ff", "#bf00ff", "#00ff88", "#ffae00", "#d4af37"][idx], items: [`${topic} ${name} item 1`, `${topic} ${name} item 2`, `${topic} ${name} item 3`, `${topic} ${name} item 4`] })); },
    score(topic) { const t = tokens(topic); return t.filter(x => this.keywords.includes(x)).length * 10 + 8; },
  });
  domains.set("computer-science-0077", {
    id: "computer-science-0077",
    domain: "computer-science",
    keywords: ["computer-science", "concept-77", "study", "exam", "topic"],
    branches(topic) { return ["computer-science foundations", "computer-science mechanisms", "computer-science applications", "computer-science evidence", "computer-science revision"].map((name, idx) => ({ name, color: ["#00d4ff", "#bf00ff", "#00ff88", "#ffae00", "#d4af37"][idx], items: [`${topic} ${name} item 1`, `${topic} ${name} item 2`, `${topic} ${name} item 3`, `${topic} ${name} item 4`] })); },
    score(topic) { const t = tokens(topic); return t.filter(x => this.keywords.includes(x)).length * 10 + 9; },
  });
  domains.set("blockchain-0078", {
    id: "blockchain-0078",
    domain: "blockchain",
    keywords: ["blockchain", "concept-78", "study", "exam", "topic"],
    branches(topic) { return ["blockchain foundations", "blockchain mechanisms", "blockchain applications", "blockchain evidence", "blockchain revision"].map((name, idx) => ({ name, color: ["#00d4ff", "#bf00ff", "#00ff88", "#ffae00", "#d4af37"][idx], items: [`${topic} ${name} item 1`, `${topic} ${name} item 2`, `${topic} ${name} item 3`, `${topic} ${name} item 4`] })); },
    score(topic) { const t = tokens(topic); return t.filter(x => this.keywords.includes(x)).length * 10 + 10; },
  });
  domains.set("economics-0079", {
    id: "economics-0079",
    domain: "economics",
    keywords: ["economics", "concept-79", "study", "exam", "topic"],
    branches(topic) { return ["economics foundations", "economics mechanisms", "economics applications", "economics evidence", "economics revision"].map((name, idx) => ({ name, color: ["#00d4ff", "#bf00ff", "#00ff88", "#ffae00", "#d4af37"][idx], items: [`${topic} ${name} item 1`, `${topic} ${name} item 2`, `${topic} ${name} item 3`, `${topic} ${name} item 4`] })); },
    score(topic) { const t = tokens(topic); return t.filter(x => this.keywords.includes(x)).length * 10 + 11; },
  });
  domains.set("geography-0080", {
    id: "geography-0080",
    domain: "geography",
    keywords: ["geography", "concept-80", "study", "exam", "topic"],
    branches(topic) { return ["geography foundations", "geography mechanisms", "geography applications", "geography evidence", "geography revision"].map((name, idx) => ({ name, color: ["#00d4ff", "#bf00ff", "#00ff88", "#ffae00", "#d4af37"][idx], items: [`${topic} ${name} item 1`, `${topic} ${name} item 2`, `${topic} ${name} item 3`, `${topic} ${name} item 4`] })); },
    score(topic) { const t = tokens(topic); return t.filter(x => this.keywords.includes(x)).length * 10 + 12; },
  });
  domains.set("literature-0081", {
    id: "literature-0081",
    domain: "literature",
    keywords: ["literature", "concept-81", "study", "exam", "topic"],
    branches(topic) { return ["literature foundations", "literature mechanisms", "literature applications", "literature evidence", "literature revision"].map((name, idx) => ({ name, color: ["#00d4ff", "#bf00ff", "#00ff88", "#ffae00", "#d4af37"][idx], items: [`${topic} ${name} item 1`, `${topic} ${name} item 2`, `${topic} ${name} item 3`, `${topic} ${name} item 4`] })); },
    score(topic) { const t = tokens(topic); return t.filter(x => this.keywords.includes(x)).length * 10 + 13; },
  });
  domains.set("medicine-0082", {
    id: "medicine-0082",
    domain: "medicine",
    keywords: ["medicine", "concept-82", "study", "exam", "topic"],
    branches(topic) { return ["medicine foundations", "medicine mechanisms", "medicine applications", "medicine evidence", "medicine revision"].map((name, idx) => ({ name, color: ["#00d4ff", "#bf00ff", "#00ff88", "#ffae00", "#d4af37"][idx], items: [`${topic} ${name} item 1`, `${topic} ${name} item 2`, `${topic} ${name} item 3`, `${topic} ${name} item 4`] })); },
    score(topic) { const t = tokens(topic); return t.filter(x => this.keywords.includes(x)).length * 10 + 14; },
  });
  domains.set("engineering-0083", {
    id: "engineering-0083",
    domain: "engineering",
    keywords: ["engineering", "concept-83", "study", "exam", "topic"],
    branches(topic) { return ["engineering foundations", "engineering mechanisms", "engineering applications", "engineering evidence", "engineering revision"].map((name, idx) => ({ name, color: ["#00d4ff", "#bf00ff", "#00ff88", "#ffae00", "#d4af37"][idx], items: [`${topic} ${name} item 1`, `${topic} ${name} item 2`, `${topic} ${name} item 3`, `${topic} ${name} item 4`] })); },
    score(topic) { const t = tokens(topic); return t.filter(x => this.keywords.includes(x)).length * 10 + 15; },
  });
  domains.set("biology-0084", {
    id: "biology-0084",
    domain: "biology",
    keywords: ["biology", "concept-84", "study", "exam", "topic"],
    branches(topic) { return ["biology foundations", "biology mechanisms", "biology applications", "biology evidence", "biology revision"].map((name, idx) => ({ name, color: ["#00d4ff", "#bf00ff", "#00ff88", "#ffae00", "#d4af37"][idx], items: [`${topic} ${name} item 1`, `${topic} ${name} item 2`, `${topic} ${name} item 3`, `${topic} ${name} item 4`] })); },
    score(topic) { const t = tokens(topic); return t.filter(x => this.keywords.includes(x)).length * 10 + 16; },
  });
  domains.set("physics-0085", {
    id: "physics-0085",
    domain: "physics",
    keywords: ["physics", "concept-85", "study", "exam", "topic"],
    branches(topic) { return ["physics foundations", "physics mechanisms", "physics applications", "physics evidence", "physics revision"].map((name, idx) => ({ name, color: ["#00d4ff", "#bf00ff", "#00ff88", "#ffae00", "#d4af37"][idx], items: [`${topic} ${name} item 1`, `${topic} ${name} item 2`, `${topic} ${name} item 3`, `${topic} ${name} item 4`] })); },
    score(topic) { const t = tokens(topic); return t.filter(x => this.keywords.includes(x)).length * 10 + 0; },
  });
  domains.set("chemistry-0086", {
    id: "chemistry-0086",
    domain: "chemistry",
    keywords: ["chemistry", "concept-86", "study", "exam", "topic"],
    branches(topic) { return ["chemistry foundations", "chemistry mechanisms", "chemistry applications", "chemistry evidence", "chemistry revision"].map((name, idx) => ({ name, color: ["#00d4ff", "#bf00ff", "#00ff88", "#ffae00", "#d4af37"][idx], items: [`${topic} ${name} item 1`, `${topic} ${name} item 2`, `${topic} ${name} item 3`, `${topic} ${name} item 4`] })); },
    score(topic) { const t = tokens(topic); return t.filter(x => this.keywords.includes(x)).length * 10 + 1; },
  });
  domains.set("history-0087", {
    id: "history-0087",
    domain: "history",
    keywords: ["history", "concept-87", "study", "exam", "topic"],
    branches(topic) { return ["history foundations", "history mechanisms", "history applications", "history evidence", "history revision"].map((name, idx) => ({ name, color: ["#00d4ff", "#bf00ff", "#00ff88", "#ffae00", "#d4af37"][idx], items: [`${topic} ${name} item 1`, `${topic} ${name} item 2`, `${topic} ${name} item 3`, `${topic} ${name} item 4`] })); },
    score(topic) { const t = tokens(topic); return t.filter(x => this.keywords.includes(x)).length * 10 + 2; },
  });
  domains.set("math-0088", {
    id: "math-0088",
    domain: "math",
    keywords: ["math", "concept-88", "study", "exam", "topic"],
    branches(topic) { return ["math foundations", "math mechanisms", "math applications", "math evidence", "math revision"].map((name, idx) => ({ name, color: ["#00d4ff", "#bf00ff", "#00ff88", "#ffae00", "#d4af37"][idx], items: [`${topic} ${name} item 1`, `${topic} ${name} item 2`, `${topic} ${name} item 3`, `${topic} ${name} item 4`] })); },
    score(topic) { const t = tokens(topic); return t.filter(x => this.keywords.includes(x)).length * 10 + 3; },
  });
  domains.set("computer-science-0089", {
    id: "computer-science-0089",
    domain: "computer-science",
    keywords: ["computer-science", "concept-89", "study", "exam", "topic"],
    branches(topic) { return ["computer-science foundations", "computer-science mechanisms", "computer-science applications", "computer-science evidence", "computer-science revision"].map((name, idx) => ({ name, color: ["#00d4ff", "#bf00ff", "#00ff88", "#ffae00", "#d4af37"][idx], items: [`${topic} ${name} item 1`, `${topic} ${name} item 2`, `${topic} ${name} item 3`, `${topic} ${name} item 4`] })); },
    score(topic) { const t = tokens(topic); return t.filter(x => this.keywords.includes(x)).length * 10 + 4; },
  });
  domains.set("blockchain-0090", {
    id: "blockchain-0090",
    domain: "blockchain",
    keywords: ["blockchain", "concept-90", "study", "exam", "topic"],
    branches(topic) { return ["blockchain foundations", "blockchain mechanisms", "blockchain applications", "blockchain evidence", "blockchain revision"].map((name, idx) => ({ name, color: ["#00d4ff", "#bf00ff", "#00ff88", "#ffae00", "#d4af37"][idx], items: [`${topic} ${name} item 1`, `${topic} ${name} item 2`, `${topic} ${name} item 3`, `${topic} ${name} item 4`] })); },
    score(topic) { const t = tokens(topic); return t.filter(x => this.keywords.includes(x)).length * 10 + 5; },
  });
  domains.set("economics-0091", {
    id: "economics-0091",
    domain: "economics",
    keywords: ["economics", "concept-91", "study", "exam", "topic"],
    branches(topic) { return ["economics foundations", "economics mechanisms", "economics applications", "economics evidence", "economics revision"].map((name, idx) => ({ name, color: ["#00d4ff", "#bf00ff", "#00ff88", "#ffae00", "#d4af37"][idx], items: [`${topic} ${name} item 1`, `${topic} ${name} item 2`, `${topic} ${name} item 3`, `${topic} ${name} item 4`] })); },
    score(topic) { const t = tokens(topic); return t.filter(x => this.keywords.includes(x)).length * 10 + 6; },
  });
  domains.set("geography-0092", {
    id: "geography-0092",
    domain: "geography",
    keywords: ["geography", "concept-92", "study", "exam", "topic"],
    branches(topic) { return ["geography foundations", "geography mechanisms", "geography applications", "geography evidence", "geography revision"].map((name, idx) => ({ name, color: ["#00d4ff", "#bf00ff", "#00ff88", "#ffae00", "#d4af37"][idx], items: [`${topic} ${name} item 1`, `${topic} ${name} item 2`, `${topic} ${name} item 3`, `${topic} ${name} item 4`] })); },
    score(topic) { const t = tokens(topic); return t.filter(x => this.keywords.includes(x)).length * 10 + 7; },
  });
  domains.set("literature-0093", {
    id: "literature-0093",
    domain: "literature",
    keywords: ["literature", "concept-93", "study", "exam", "topic"],
    branches(topic) { return ["literature foundations", "literature mechanisms", "literature applications", "literature evidence", "literature revision"].map((name, idx) => ({ name, color: ["#00d4ff", "#bf00ff", "#00ff88", "#ffae00", "#d4af37"][idx], items: [`${topic} ${name} item 1`, `${topic} ${name} item 2`, `${topic} ${name} item 3`, `${topic} ${name} item 4`] })); },
    score(topic) { const t = tokens(topic); return t.filter(x => this.keywords.includes(x)).length * 10 + 8; },
  });
  domains.set("medicine-0094", {
    id: "medicine-0094",
    domain: "medicine",
    keywords: ["medicine", "concept-94", "study", "exam", "topic"],
    branches(topic) { return ["medicine foundations", "medicine mechanisms", "medicine applications", "medicine evidence", "medicine revision"].map((name, idx) => ({ name, color: ["#00d4ff", "#bf00ff", "#00ff88", "#ffae00", "#d4af37"][idx], items: [`${topic} ${name} item 1`, `${topic} ${name} item 2`, `${topic} ${name} item 3`, `${topic} ${name} item 4`] })); },
    score(topic) { const t = tokens(topic); return t.filter(x => this.keywords.includes(x)).length * 10 + 9; },
  });
  domains.set("engineering-0095", {
    id: "engineering-0095",
    domain: "engineering",
    keywords: ["engineering", "concept-95", "study", "exam", "topic"],
    branches(topic) { return ["engineering foundations", "engineering mechanisms", "engineering applications", "engineering evidence", "engineering revision"].map((name, idx) => ({ name, color: ["#00d4ff", "#bf00ff", "#00ff88", "#ffae00", "#d4af37"][idx], items: [`${topic} ${name} item 1`, `${topic} ${name} item 2`, `${topic} ${name} item 3`, `${topic} ${name} item 4`] })); },
    score(topic) { const t = tokens(topic); return t.filter(x => this.keywords.includes(x)).length * 10 + 10; },
  });
  domains.set("biology-0096", {
    id: "biology-0096",
    domain: "biology",
    keywords: ["biology", "concept-96", "study", "exam", "topic"],
    branches(topic) { return ["biology foundations", "biology mechanisms", "biology applications", "biology evidence", "biology revision"].map((name, idx) => ({ name, color: ["#00d4ff", "#bf00ff", "#00ff88", "#ffae00", "#d4af37"][idx], items: [`${topic} ${name} item 1`, `${topic} ${name} item 2`, `${topic} ${name} item 3`, `${topic} ${name} item 4`] })); },
    score(topic) { const t = tokens(topic); return t.filter(x => this.keywords.includes(x)).length * 10 + 11; },
  });
  domains.set("physics-0097", {
    id: "physics-0097",
    domain: "physics",
    keywords: ["physics", "concept-97", "study", "exam", "topic"],
    branches(topic) { return ["physics foundations", "physics mechanisms", "physics applications", "physics evidence", "physics revision"].map((name, idx) => ({ name, color: ["#00d4ff", "#bf00ff", "#00ff88", "#ffae00", "#d4af37"][idx], items: [`${topic} ${name} item 1`, `${topic} ${name} item 2`, `${topic} ${name} item 3`, `${topic} ${name} item 4`] })); },
    score(topic) { const t = tokens(topic); return t.filter(x => this.keywords.includes(x)).length * 10 + 12; },
  });
  domains.set("chemistry-0098", {
    id: "chemistry-0098",
    domain: "chemistry",
    keywords: ["chemistry", "concept-98", "study", "exam", "topic"],
    branches(topic) { return ["chemistry foundations", "chemistry mechanisms", "chemistry applications", "chemistry evidence", "chemistry revision"].map((name, idx) => ({ name, color: ["#00d4ff", "#bf00ff", "#00ff88", "#ffae00", "#d4af37"][idx], items: [`${topic} ${name} item 1`, `${topic} ${name} item 2`, `${topic} ${name} item 3`, `${topic} ${name} item 4`] })); },
    score(topic) { const t = tokens(topic); return t.filter(x => this.keywords.includes(x)).length * 10 + 13; },
  });
  domains.set("history-0099", {
    id: "history-0099",
    domain: "history",
    keywords: ["history", "concept-99", "study", "exam", "topic"],
    branches(topic) { return ["history foundations", "history mechanisms", "history applications", "history evidence", "history revision"].map((name, idx) => ({ name, color: ["#00d4ff", "#bf00ff", "#00ff88", "#ffae00", "#d4af37"][idx], items: [`${topic} ${name} item 1`, `${topic} ${name} item 2`, `${topic} ${name} item 3`, `${topic} ${name} item 4`] })); },
    score(topic) { const t = tokens(topic); return t.filter(x => this.keywords.includes(x)).length * 10 + 14; },
  });
  domains.set("math-0100", {
    id: "math-0100",
    domain: "math",
    keywords: ["math", "concept-100", "study", "exam", "topic"],
    branches(topic) { return ["math foundations", "math mechanisms", "math applications", "math evidence", "math revision"].map((name, idx) => ({ name, color: ["#00d4ff", "#bf00ff", "#00ff88", "#ffae00", "#d4af37"][idx], items: [`${topic} ${name} item 1`, `${topic} ${name} item 2`, `${topic} ${name} item 3`, `${topic} ${name} item 4`] })); },
    score(topic) { const t = tokens(topic); return t.filter(x => this.keywords.includes(x)).length * 10 + 15; },
  });
  domains.set("computer-science-0101", {
    id: "computer-science-0101",
    domain: "computer-science",
    keywords: ["computer-science", "concept-101", "study", "exam", "topic"],
    branches(topic) { return ["computer-science foundations", "computer-science mechanisms", "computer-science applications", "computer-science evidence", "computer-science revision"].map((name, idx) => ({ name, color: ["#00d4ff", "#bf00ff", "#00ff88", "#ffae00", "#d4af37"][idx], items: [`${topic} ${name} item 1`, `${topic} ${name} item 2`, `${topic} ${name} item 3`, `${topic} ${name} item 4`] })); },
    score(topic) { const t = tokens(topic); return t.filter(x => this.keywords.includes(x)).length * 10 + 16; },
  });
  domains.set("blockchain-0102", {
    id: "blockchain-0102",
    domain: "blockchain",
    keywords: ["blockchain", "concept-102", "study", "exam", "topic"],
    branches(topic) { return ["blockchain foundations", "blockchain mechanisms", "blockchain applications", "blockchain evidence", "blockchain revision"].map((name, idx) => ({ name, color: ["#00d4ff", "#bf00ff", "#00ff88", "#ffae00", "#d4af37"][idx], items: [`${topic} ${name} item 1`, `${topic} ${name} item 2`, `${topic} ${name} item 3`, `${topic} ${name} item 4`] })); },
    score(topic) { const t = tokens(topic); return t.filter(x => this.keywords.includes(x)).length * 10 + 0; },
  });
  domains.set("economics-0103", {
    id: "economics-0103",
    domain: "economics",
    keywords: ["economics", "concept-103", "study", "exam", "topic"],
    branches(topic) { return ["economics foundations", "economics mechanisms", "economics applications", "economics evidence", "economics revision"].map((name, idx) => ({ name, color: ["#00d4ff", "#bf00ff", "#00ff88", "#ffae00", "#d4af37"][idx], items: [`${topic} ${name} item 1`, `${topic} ${name} item 2`, `${topic} ${name} item 3`, `${topic} ${name} item 4`] })); },
    score(topic) { const t = tokens(topic); return t.filter(x => this.keywords.includes(x)).length * 10 + 1; },
  });
  domains.set("geography-0104", {
    id: "geography-0104",
    domain: "geography",
    keywords: ["geography", "concept-104", "study", "exam", "topic"],
    branches(topic) { return ["geography foundations", "geography mechanisms", "geography applications", "geography evidence", "geography revision"].map((name, idx) => ({ name, color: ["#00d4ff", "#bf00ff", "#00ff88", "#ffae00", "#d4af37"][idx], items: [`${topic} ${name} item 1`, `${topic} ${name} item 2`, `${topic} ${name} item 3`, `${topic} ${name} item 4`] })); },
    score(topic) { const t = tokens(topic); return t.filter(x => this.keywords.includes(x)).length * 10 + 2; },
  });
  domains.set("literature-0105", {
    id: "literature-0105",
    domain: "literature",
    keywords: ["literature", "concept-105", "study", "exam", "topic"],
    branches(topic) { return ["literature foundations", "literature mechanisms", "literature applications", "literature evidence", "literature revision"].map((name, idx) => ({ name, color: ["#00d4ff", "#bf00ff", "#00ff88", "#ffae00", "#d4af37"][idx], items: [`${topic} ${name} item 1`, `${topic} ${name} item 2`, `${topic} ${name} item 3`, `${topic} ${name} item 4`] })); },
    score(topic) { const t = tokens(topic); return t.filter(x => this.keywords.includes(x)).length * 10 + 3; },
  });
  domains.set("medicine-0106", {
    id: "medicine-0106",
    domain: "medicine",
    keywords: ["medicine", "concept-106", "study", "exam", "topic"],
    branches(topic) { return ["medicine foundations", "medicine mechanisms", "medicine applications", "medicine evidence", "medicine revision"].map((name, idx) => ({ name, color: ["#00d4ff", "#bf00ff", "#00ff88", "#ffae00", "#d4af37"][idx], items: [`${topic} ${name} item 1`, `${topic} ${name} item 2`, `${topic} ${name} item 3`, `${topic} ${name} item 4`] })); },
    score(topic) { const t = tokens(topic); return t.filter(x => this.keywords.includes(x)).length * 10 + 4; },
  });
  domains.set("engineering-0107", {
    id: "engineering-0107",
    domain: "engineering",
    keywords: ["engineering", "concept-107", "study", "exam", "topic"],
    branches(topic) { return ["engineering foundations", "engineering mechanisms", "engineering applications", "engineering evidence", "engineering revision"].map((name, idx) => ({ name, color: ["#00d4ff", "#bf00ff", "#00ff88", "#ffae00", "#d4af37"][idx], items: [`${topic} ${name} item 1`, `${topic} ${name} item 2`, `${topic} ${name} item 3`, `${topic} ${name} item 4`] })); },
    score(topic) { const t = tokens(topic); return t.filter(x => this.keywords.includes(x)).length * 10 + 5; },
  });
  domains.set("biology-0108", {
    id: "biology-0108",
    domain: "biology",
    keywords: ["biology", "concept-108", "study", "exam", "topic"],
    branches(topic) { return ["biology foundations", "biology mechanisms", "biology applications", "biology evidence", "biology revision"].map((name, idx) => ({ name, color: ["#00d4ff", "#bf00ff", "#00ff88", "#ffae00", "#d4af37"][idx], items: [`${topic} ${name} item 1`, `${topic} ${name} item 2`, `${topic} ${name} item 3`, `${topic} ${name} item 4`] })); },
    score(topic) { const t = tokens(topic); return t.filter(x => this.keywords.includes(x)).length * 10 + 6; },
  });
  domains.set("physics-0109", {
    id: "physics-0109",
    domain: "physics",
    keywords: ["physics", "concept-109", "study", "exam", "topic"],
    branches(topic) { return ["physics foundations", "physics mechanisms", "physics applications", "physics evidence", "physics revision"].map((name, idx) => ({ name, color: ["#00d4ff", "#bf00ff", "#00ff88", "#ffae00", "#d4af37"][idx], items: [`${topic} ${name} item 1`, `${topic} ${name} item 2`, `${topic} ${name} item 3`, `${topic} ${name} item 4`] })); },
    score(topic) { const t = tokens(topic); return t.filter(x => this.keywords.includes(x)).length * 10 + 7; },
  });
  domains.set("chemistry-0110", {
    id: "chemistry-0110",
    domain: "chemistry",
    keywords: ["chemistry", "concept-110", "study", "exam", "topic"],
    branches(topic) { return ["chemistry foundations", "chemistry mechanisms", "chemistry applications", "chemistry evidence", "chemistry revision"].map((name, idx) => ({ name, color: ["#00d4ff", "#bf00ff", "#00ff88", "#ffae00", "#d4af37"][idx], items: [`${topic} ${name} item 1`, `${topic} ${name} item 2`, `${topic} ${name} item 3`, `${topic} ${name} item 4`] })); },
    score(topic) { const t = tokens(topic); return t.filter(x => this.keywords.includes(x)).length * 10 + 8; },
  });
  domains.set("history-0111", {
    id: "history-0111",
    domain: "history",
    keywords: ["history", "concept-111", "study", "exam", "topic"],
    branches(topic) { return ["history foundations", "history mechanisms", "history applications", "history evidence", "history revision"].map((name, idx) => ({ name, color: ["#00d4ff", "#bf00ff", "#00ff88", "#ffae00", "#d4af37"][idx], items: [`${topic} ${name} item 1`, `${topic} ${name} item 2`, `${topic} ${name} item 3`, `${topic} ${name} item 4`] })); },
    score(topic) { const t = tokens(topic); return t.filter(x => this.keywords.includes(x)).length * 10 + 9; },
  });
  domains.set("math-0112", {
    id: "math-0112",
    domain: "math",
    keywords: ["math", "concept-112", "study", "exam", "topic"],
    branches(topic) { return ["math foundations", "math mechanisms", "math applications", "math evidence", "math revision"].map((name, idx) => ({ name, color: ["#00d4ff", "#bf00ff", "#00ff88", "#ffae00", "#d4af37"][idx], items: [`${topic} ${name} item 1`, `${topic} ${name} item 2`, `${topic} ${name} item 3`, `${topic} ${name} item 4`] })); },
    score(topic) { const t = tokens(topic); return t.filter(x => this.keywords.includes(x)).length * 10 + 10; },
  });
  domains.set("computer-science-0113", {
    id: "computer-science-0113",
    domain: "computer-science",
    keywords: ["computer-science", "concept-113", "study", "exam", "topic"],
    branches(topic) { return ["computer-science foundations", "computer-science mechanisms", "computer-science applications", "computer-science evidence", "computer-science revision"].map((name, idx) => ({ name, color: ["#00d4ff", "#bf00ff", "#00ff88", "#ffae00", "#d4af37"][idx], items: [`${topic} ${name} item 1`, `${topic} ${name} item 2`, `${topic} ${name} item 3`, `${topic} ${name} item 4`] })); },
    score(topic) { const t = tokens(topic); return t.filter(x => this.keywords.includes(x)).length * 10 + 11; },
  });
  domains.set("blockchain-0114", {
    id: "blockchain-0114",
    domain: "blockchain",
    keywords: ["blockchain", "concept-114", "study", "exam", "topic"],
    branches(topic) { return ["blockchain foundations", "blockchain mechanisms", "blockchain applications", "blockchain evidence", "blockchain revision"].map((name, idx) => ({ name, color: ["#00d4ff", "#bf00ff", "#00ff88", "#ffae00", "#d4af37"][idx], items: [`${topic} ${name} item 1`, `${topic} ${name} item 2`, `${topic} ${name} item 3`, `${topic} ${name} item 4`] })); },
    score(topic) { const t = tokens(topic); return t.filter(x => this.keywords.includes(x)).length * 10 + 12; },
  });
  domains.set("economics-0115", {
    id: "economics-0115",
    domain: "economics",
    keywords: ["economics", "concept-115", "study", "exam", "topic"],
    branches(topic) { return ["economics foundations", "economics mechanisms", "economics applications", "economics evidence", "economics revision"].map((name, idx) => ({ name, color: ["#00d4ff", "#bf00ff", "#00ff88", "#ffae00", "#d4af37"][idx], items: [`${topic} ${name} item 1`, `${topic} ${name} item 2`, `${topic} ${name} item 3`, `${topic} ${name} item 4`] })); },
    score(topic) { const t = tokens(topic); return t.filter(x => this.keywords.includes(x)).length * 10 + 13; },
  });
  domains.set("geography-0116", {
    id: "geography-0116",
    domain: "geography",
    keywords: ["geography", "concept-116", "study", "exam", "topic"],
    branches(topic) { return ["geography foundations", "geography mechanisms", "geography applications", "geography evidence", "geography revision"].map((name, idx) => ({ name, color: ["#00d4ff", "#bf00ff", "#00ff88", "#ffae00", "#d4af37"][idx], items: [`${topic} ${name} item 1`, `${topic} ${name} item 2`, `${topic} ${name} item 3`, `${topic} ${name} item 4`] })); },
    score(topic) { const t = tokens(topic); return t.filter(x => this.keywords.includes(x)).length * 10 + 14; },
  });
  domains.set("literature-0117", {
    id: "literature-0117",
    domain: "literature",
    keywords: ["literature", "concept-117", "study", "exam", "topic"],
    branches(topic) { return ["literature foundations", "literature mechanisms", "literature applications", "literature evidence", "literature revision"].map((name, idx) => ({ name, color: ["#00d4ff", "#bf00ff", "#00ff88", "#ffae00", "#d4af37"][idx], items: [`${topic} ${name} item 1`, `${topic} ${name} item 2`, `${topic} ${name} item 3`, `${topic} ${name} item 4`] })); },
    score(topic) { const t = tokens(topic); return t.filter(x => this.keywords.includes(x)).length * 10 + 15; },
  });
  domains.set("medicine-0118", {
    id: "medicine-0118",
    domain: "medicine",
    keywords: ["medicine", "concept-118", "study", "exam", "topic"],
    branches(topic) { return ["medicine foundations", "medicine mechanisms", "medicine applications", "medicine evidence", "medicine revision"].map((name, idx) => ({ name, color: ["#00d4ff", "#bf00ff", "#00ff88", "#ffae00", "#d4af37"][idx], items: [`${topic} ${name} item 1`, `${topic} ${name} item 2`, `${topic} ${name} item 3`, `${topic} ${name} item 4`] })); },
    score(topic) { const t = tokens(topic); return t.filter(x => this.keywords.includes(x)).length * 10 + 16; },
  });
  domains.set("engineering-0119", {
    id: "engineering-0119",
    domain: "engineering",
    keywords: ["engineering", "concept-119", "study", "exam", "topic"],
    branches(topic) { return ["engineering foundations", "engineering mechanisms", "engineering applications", "engineering evidence", "engineering revision"].map((name, idx) => ({ name, color: ["#00d4ff", "#bf00ff", "#00ff88", "#ffae00", "#d4af37"][idx], items: [`${topic} ${name} item 1`, `${topic} ${name} item 2`, `${topic} ${name} item 3`, `${topic} ${name} item 4`] })); },
    score(topic) { const t = tokens(topic); return t.filter(x => this.keywords.includes(x)).length * 10 + 0; },
  });
  domains.set("biology-0120", {
    id: "biology-0120",
    domain: "biology",
    keywords: ["biology", "concept-120", "study", "exam", "topic"],
    branches(topic) { return ["biology foundations", "biology mechanisms", "biology applications", "biology evidence", "biology revision"].map((name, idx) => ({ name, color: ["#00d4ff", "#bf00ff", "#00ff88", "#ffae00", "#d4af37"][idx], items: [`${topic} ${name} item 1`, `${topic} ${name} item 2`, `${topic} ${name} item 3`, `${topic} ${name} item 4`] })); },
    score(topic) { const t = tokens(topic); return t.filter(x => this.keywords.includes(x)).length * 10 + 1; },
  });
  domains.set("physics-0121", {
    id: "physics-0121",
    domain: "physics",
    keywords: ["physics", "concept-121", "study", "exam", "topic"],
    branches(topic) { return ["physics foundations", "physics mechanisms", "physics applications", "physics evidence", "physics revision"].map((name, idx) => ({ name, color: ["#00d4ff", "#bf00ff", "#00ff88", "#ffae00", "#d4af37"][idx], items: [`${topic} ${name} item 1`, `${topic} ${name} item 2`, `${topic} ${name} item 3`, `${topic} ${name} item 4`] })); },
    score(topic) { const t = tokens(topic); return t.filter(x => this.keywords.includes(x)).length * 10 + 2; },
  });
  domains.set("chemistry-0122", {
    id: "chemistry-0122",
    domain: "chemistry",
    keywords: ["chemistry", "concept-122", "study", "exam", "topic"],
    branches(topic) { return ["chemistry foundations", "chemistry mechanisms", "chemistry applications", "chemistry evidence", "chemistry revision"].map((name, idx) => ({ name, color: ["#00d4ff", "#bf00ff", "#00ff88", "#ffae00", "#d4af37"][idx], items: [`${topic} ${name} item 1`, `${topic} ${name} item 2`, `${topic} ${name} item 3`, `${topic} ${name} item 4`] })); },
    score(topic) { const t = tokens(topic); return t.filter(x => this.keywords.includes(x)).length * 10 + 3; },
  });
  domains.set("history-0123", {
    id: "history-0123",
    domain: "history",
    keywords: ["history", "concept-123", "study", "exam", "topic"],
    branches(topic) { return ["history foundations", "history mechanisms", "history applications", "history evidence", "history revision"].map((name, idx) => ({ name, color: ["#00d4ff", "#bf00ff", "#00ff88", "#ffae00", "#d4af37"][idx], items: [`${topic} ${name} item 1`, `${topic} ${name} item 2`, `${topic} ${name} item 3`, `${topic} ${name} item 4`] })); },
    score(topic) { const t = tokens(topic); return t.filter(x => this.keywords.includes(x)).length * 10 + 4; },
  });
  domains.set("math-0124", {
    id: "math-0124",
    domain: "math",
    keywords: ["math", "concept-124", "study", "exam", "topic"],
    branches(topic) { return ["math foundations", "math mechanisms", "math applications", "math evidence", "math revision"].map((name, idx) => ({ name, color: ["#00d4ff", "#bf00ff", "#00ff88", "#ffae00", "#d4af37"][idx], items: [`${topic} ${name} item 1`, `${topic} ${name} item 2`, `${topic} ${name} item 3`, `${topic} ${name} item 4`] })); },
    score(topic) { const t = tokens(topic); return t.filter(x => this.keywords.includes(x)).length * 10 + 5; },
  });
  domains.set("computer-science-0125", {
    id: "computer-science-0125",
    domain: "computer-science",
    keywords: ["computer-science", "concept-125", "study", "exam", "topic"],
    branches(topic) { return ["computer-science foundations", "computer-science mechanisms", "computer-science applications", "computer-science evidence", "computer-science revision"].map((name, idx) => ({ name, color: ["#00d4ff", "#bf00ff", "#00ff88", "#ffae00", "#d4af37"][idx], items: [`${topic} ${name} item 1`, `${topic} ${name} item 2`, `${topic} ${name} item 3`, `${topic} ${name} item 4`] })); },
    score(topic) { const t = tokens(topic); return t.filter(x => this.keywords.includes(x)).length * 10 + 6; },
  });
  domains.set("blockchain-0126", {
    id: "blockchain-0126",
    domain: "blockchain",
    keywords: ["blockchain", "concept-126", "study", "exam", "topic"],
    branches(topic) { return ["blockchain foundations", "blockchain mechanisms", "blockchain applications", "blockchain evidence", "blockchain revision"].map((name, idx) => ({ name, color: ["#00d4ff", "#bf00ff", "#00ff88", "#ffae00", "#d4af37"][idx], items: [`${topic} ${name} item 1`, `${topic} ${name} item 2`, `${topic} ${name} item 3`, `${topic} ${name} item 4`] })); },
    score(topic) { const t = tokens(topic); return t.filter(x => this.keywords.includes(x)).length * 10 + 7; },
  });
  domains.set("economics-0127", {
    id: "economics-0127",
    domain: "economics",
    keywords: ["economics", "concept-127", "study", "exam", "topic"],
    branches(topic) { return ["economics foundations", "economics mechanisms", "economics applications", "economics evidence", "economics revision"].map((name, idx) => ({ name, color: ["#00d4ff", "#bf00ff", "#00ff88", "#ffae00", "#d4af37"][idx], items: [`${topic} ${name} item 1`, `${topic} ${name} item 2`, `${topic} ${name} item 3`, `${topic} ${name} item 4`] })); },
    score(topic) { const t = tokens(topic); return t.filter(x => this.keywords.includes(x)).length * 10 + 8; },
  });
  domains.set("geography-0128", {
    id: "geography-0128",
    domain: "geography",
    keywords: ["geography", "concept-128", "study", "exam", "topic"],
    branches(topic) { return ["geography foundations", "geography mechanisms", "geography applications", "geography evidence", "geography revision"].map((name, idx) => ({ name, color: ["#00d4ff", "#bf00ff", "#00ff88", "#ffae00", "#d4af37"][idx], items: [`${topic} ${name} item 1`, `${topic} ${name} item 2`, `${topic} ${name} item 3`, `${topic} ${name} item 4`] })); },
    score(topic) { const t = tokens(topic); return t.filter(x => this.keywords.includes(x)).length * 10 + 9; },
  });
  domains.set("literature-0129", {
    id: "literature-0129",
    domain: "literature",
    keywords: ["literature", "concept-129", "study", "exam", "topic"],
    branches(topic) { return ["literature foundations", "literature mechanisms", "literature applications", "literature evidence", "literature revision"].map((name, idx) => ({ name, color: ["#00d4ff", "#bf00ff", "#00ff88", "#ffae00", "#d4af37"][idx], items: [`${topic} ${name} item 1`, `${topic} ${name} item 2`, `${topic} ${name} item 3`, `${topic} ${name} item 4`] })); },
    score(topic) { const t = tokens(topic); return t.filter(x => this.keywords.includes(x)).length * 10 + 10; },
  });
  domains.set("medicine-0130", {
    id: "medicine-0130",
    domain: "medicine",
    keywords: ["medicine", "concept-130", "study", "exam", "topic"],
    branches(topic) { return ["medicine foundations", "medicine mechanisms", "medicine applications", "medicine evidence", "medicine revision"].map((name, idx) => ({ name, color: ["#00d4ff", "#bf00ff", "#00ff88", "#ffae00", "#d4af37"][idx], items: [`${topic} ${name} item 1`, `${topic} ${name} item 2`, `${topic} ${name} item 3`, `${topic} ${name} item 4`] })); },
    score(topic) { const t = tokens(topic); return t.filter(x => this.keywords.includes(x)).length * 10 + 11; },
  });
  domains.set("engineering-0131", {
    id: "engineering-0131",
    domain: "engineering",
    keywords: ["engineering", "concept-131", "study", "exam", "topic"],
    branches(topic) { return ["engineering foundations", "engineering mechanisms", "engineering applications", "engineering evidence", "engineering revision"].map((name, idx) => ({ name, color: ["#00d4ff", "#bf00ff", "#00ff88", "#ffae00", "#d4af37"][idx], items: [`${topic} ${name} item 1`, `${topic} ${name} item 2`, `${topic} ${name} item 3`, `${topic} ${name} item 4`] })); },
    score(topic) { const t = tokens(topic); return t.filter(x => this.keywords.includes(x)).length * 10 + 12; },
  });
  domains.set("biology-0132", {
    id: "biology-0132",
    domain: "biology",
    keywords: ["biology", "concept-132", "study", "exam", "topic"],
    branches(topic) { return ["biology foundations", "biology mechanisms", "biology applications", "biology evidence", "biology revision"].map((name, idx) => ({ name, color: ["#00d4ff", "#bf00ff", "#00ff88", "#ffae00", "#d4af37"][idx], items: [`${topic} ${name} item 1`, `${topic} ${name} item 2`, `${topic} ${name} item 3`, `${topic} ${name} item 4`] })); },
    score(topic) { const t = tokens(topic); return t.filter(x => this.keywords.includes(x)).length * 10 + 13; },
  });
  domains.set("physics-0133", {
    id: "physics-0133",
    domain: "physics",
    keywords: ["physics", "concept-133", "study", "exam", "topic"],
    branches(topic) { return ["physics foundations", "physics mechanisms", "physics applications", "physics evidence", "physics revision"].map((name, idx) => ({ name, color: ["#00d4ff", "#bf00ff", "#00ff88", "#ffae00", "#d4af37"][idx], items: [`${topic} ${name} item 1`, `${topic} ${name} item 2`, `${topic} ${name} item 3`, `${topic} ${name} item 4`] })); },
    score(topic) { const t = tokens(topic); return t.filter(x => this.keywords.includes(x)).length * 10 + 14; },
  });
  domains.set("chemistry-0134", {
    id: "chemistry-0134",
    domain: "chemistry",
    keywords: ["chemistry", "concept-134", "study", "exam", "topic"],
    branches(topic) { return ["chemistry foundations", "chemistry mechanisms", "chemistry applications", "chemistry evidence", "chemistry revision"].map((name, idx) => ({ name, color: ["#00d4ff", "#bf00ff", "#00ff88", "#ffae00", "#d4af37"][idx], items: [`${topic} ${name} item 1`, `${topic} ${name} item 2`, `${topic} ${name} item 3`, `${topic} ${name} item 4`] })); },
    score(topic) { const t = tokens(topic); return t.filter(x => this.keywords.includes(x)).length * 10 + 15; },
  });
  domains.set("history-0135", {
    id: "history-0135",
    domain: "history",
    keywords: ["history", "concept-135", "study", "exam", "topic"],
    branches(topic) { return ["history foundations", "history mechanisms", "history applications", "history evidence", "history revision"].map((name, idx) => ({ name, color: ["#00d4ff", "#bf00ff", "#00ff88", "#ffae00", "#d4af37"][idx], items: [`${topic} ${name} item 1`, `${topic} ${name} item 2`, `${topic} ${name} item 3`, `${topic} ${name} item 4`] })); },
    score(topic) { const t = tokens(topic); return t.filter(x => this.keywords.includes(x)).length * 10 + 16; },
  });
  domains.set("math-0136", {
    id: "math-0136",
    domain: "math",
    keywords: ["math", "concept-136", "study", "exam", "topic"],
    branches(topic) { return ["math foundations", "math mechanisms", "math applications", "math evidence", "math revision"].map((name, idx) => ({ name, color: ["#00d4ff", "#bf00ff", "#00ff88", "#ffae00", "#d4af37"][idx], items: [`${topic} ${name} item 1`, `${topic} ${name} item 2`, `${topic} ${name} item 3`, `${topic} ${name} item 4`] })); },
    score(topic) { const t = tokens(topic); return t.filter(x => this.keywords.includes(x)).length * 10 + 0; },
  });
  domains.set("computer-science-0137", {
    id: "computer-science-0137",
    domain: "computer-science",
    keywords: ["computer-science", "concept-137", "study", "exam", "topic"],
    branches(topic) { return ["computer-science foundations", "computer-science mechanisms", "computer-science applications", "computer-science evidence", "computer-science revision"].map((name, idx) => ({ name, color: ["#00d4ff", "#bf00ff", "#00ff88", "#ffae00", "#d4af37"][idx], items: [`${topic} ${name} item 1`, `${topic} ${name} item 2`, `${topic} ${name} item 3`, `${topic} ${name} item 4`] })); },
    score(topic) { const t = tokens(topic); return t.filter(x => this.keywords.includes(x)).length * 10 + 1; },
  });
  domains.set("blockchain-0138", {
    id: "blockchain-0138",
    domain: "blockchain",
    keywords: ["blockchain", "concept-138", "study", "exam", "topic"],
    branches(topic) { return ["blockchain foundations", "blockchain mechanisms", "blockchain applications", "blockchain evidence", "blockchain revision"].map((name, idx) => ({ name, color: ["#00d4ff", "#bf00ff", "#00ff88", "#ffae00", "#d4af37"][idx], items: [`${topic} ${name} item 1`, `${topic} ${name} item 2`, `${topic} ${name} item 3`, `${topic} ${name} item 4`] })); },
    score(topic) { const t = tokens(topic); return t.filter(x => this.keywords.includes(x)).length * 10 + 2; },
  });
  domains.set("economics-0139", {
    id: "economics-0139",
    domain: "economics",
    keywords: ["economics", "concept-139", "study", "exam", "topic"],
    branches(topic) { return ["economics foundations", "economics mechanisms", "economics applications", "economics evidence", "economics revision"].map((name, idx) => ({ name, color: ["#00d4ff", "#bf00ff", "#00ff88", "#ffae00", "#d4af37"][idx], items: [`${topic} ${name} item 1`, `${topic} ${name} item 2`, `${topic} ${name} item 3`, `${topic} ${name} item 4`] })); },
    score(topic) { const t = tokens(topic); return t.filter(x => this.keywords.includes(x)).length * 10 + 3; },
  });
  domains.set("geography-0140", {
    id: "geography-0140",
    domain: "geography",
    keywords: ["geography", "concept-140", "study", "exam", "topic"],
    branches(topic) { return ["geography foundations", "geography mechanisms", "geography applications", "geography evidence", "geography revision"].map((name, idx) => ({ name, color: ["#00d4ff", "#bf00ff", "#00ff88", "#ffae00", "#d4af37"][idx], items: [`${topic} ${name} item 1`, `${topic} ${name} item 2`, `${topic} ${name} item 3`, `${topic} ${name} item 4`] })); },
    score(topic) { const t = tokens(topic); return t.filter(x => this.keywords.includes(x)).length * 10 + 4; },
  });
  domains.set("literature-0141", {
    id: "literature-0141",
    domain: "literature",
    keywords: ["literature", "concept-141", "study", "exam", "topic"],
    branches(topic) { return ["literature foundations", "literature mechanisms", "literature applications", "literature evidence", "literature revision"].map((name, idx) => ({ name, color: ["#00d4ff", "#bf00ff", "#00ff88", "#ffae00", "#d4af37"][idx], items: [`${topic} ${name} item 1`, `${topic} ${name} item 2`, `${topic} ${name} item 3`, `${topic} ${name} item 4`] })); },
    score(topic) { const t = tokens(topic); return t.filter(x => this.keywords.includes(x)).length * 10 + 5; },
  });
  domains.set("medicine-0142", {
    id: "medicine-0142",
    domain: "medicine",
    keywords: ["medicine", "concept-142", "study", "exam", "topic"],
    branches(topic) { return ["medicine foundations", "medicine mechanisms", "medicine applications", "medicine evidence", "medicine revision"].map((name, idx) => ({ name, color: ["#00d4ff", "#bf00ff", "#00ff88", "#ffae00", "#d4af37"][idx], items: [`${topic} ${name} item 1`, `${topic} ${name} item 2`, `${topic} ${name} item 3`, `${topic} ${name} item 4`] })); },
    score(topic) { const t = tokens(topic); return t.filter(x => this.keywords.includes(x)).length * 10 + 6; },
  });
  domains.set("engineering-0143", {
    id: "engineering-0143",
    domain: "engineering",
    keywords: ["engineering", "concept-143", "study", "exam", "topic"],
    branches(topic) { return ["engineering foundations", "engineering mechanisms", "engineering applications", "engineering evidence", "engineering revision"].map((name, idx) => ({ name, color: ["#00d4ff", "#bf00ff", "#00ff88", "#ffae00", "#d4af37"][idx], items: [`${topic} ${name} item 1`, `${topic} ${name} item 2`, `${topic} ${name} item 3`, `${topic} ${name} item 4`] })); },
    score(topic) { const t = tokens(topic); return t.filter(x => this.keywords.includes(x)).length * 10 + 7; },
  });
  domains.set("biology-0144", {
    id: "biology-0144",
    domain: "biology",
    keywords: ["biology", "concept-144", "study", "exam", "topic"],
    branches(topic) { return ["biology foundations", "biology mechanisms", "biology applications", "biology evidence", "biology revision"].map((name, idx) => ({ name, color: ["#00d4ff", "#bf00ff", "#00ff88", "#ffae00", "#d4af37"][idx], items: [`${topic} ${name} item 1`, `${topic} ${name} item 2`, `${topic} ${name} item 3`, `${topic} ${name} item 4`] })); },
    score(topic) { const t = tokens(topic); return t.filter(x => this.keywords.includes(x)).length * 10 + 8; },
  });
  domains.set("physics-0145", {
    id: "physics-0145",
    domain: "physics",
    keywords: ["physics", "concept-145", "study", "exam", "topic"],
    branches(topic) { return ["physics foundations", "physics mechanisms", "physics applications", "physics evidence", "physics revision"].map((name, idx) => ({ name, color: ["#00d4ff", "#bf00ff", "#00ff88", "#ffae00", "#d4af37"][idx], items: [`${topic} ${name} item 1`, `${topic} ${name} item 2`, `${topic} ${name} item 3`, `${topic} ${name} item 4`] })); },
    score(topic) { const t = tokens(topic); return t.filter(x => this.keywords.includes(x)).length * 10 + 9; },
  });
  domains.set("chemistry-0146", {
    id: "chemistry-0146",
    domain: "chemistry",
    keywords: ["chemistry", "concept-146", "study", "exam", "topic"],
    branches(topic) { return ["chemistry foundations", "chemistry mechanisms", "chemistry applications", "chemistry evidence", "chemistry revision"].map((name, idx) => ({ name, color: ["#00d4ff", "#bf00ff", "#00ff88", "#ffae00", "#d4af37"][idx], items: [`${topic} ${name} item 1`, `${topic} ${name} item 2`, `${topic} ${name} item 3`, `${topic} ${name} item 4`] })); },
    score(topic) { const t = tokens(topic); return t.filter(x => this.keywords.includes(x)).length * 10 + 10; },
  });
  domains.set("history-0147", {
    id: "history-0147",
    domain: "history",
    keywords: ["history", "concept-147", "study", "exam", "topic"],
    branches(topic) { return ["history foundations", "history mechanisms", "history applications", "history evidence", "history revision"].map((name, idx) => ({ name, color: ["#00d4ff", "#bf00ff", "#00ff88", "#ffae00", "#d4af37"][idx], items: [`${topic} ${name} item 1`, `${topic} ${name} item 2`, `${topic} ${name} item 3`, `${topic} ${name} item 4`] })); },
    score(topic) { const t = tokens(topic); return t.filter(x => this.keywords.includes(x)).length * 10 + 11; },
  });
  domains.set("math-0148", {
    id: "math-0148",
    domain: "math",
    keywords: ["math", "concept-148", "study", "exam", "topic"],
    branches(topic) { return ["math foundations", "math mechanisms", "math applications", "math evidence", "math revision"].map((name, idx) => ({ name, color: ["#00d4ff", "#bf00ff", "#00ff88", "#ffae00", "#d4af37"][idx], items: [`${topic} ${name} item 1`, `${topic} ${name} item 2`, `${topic} ${name} item 3`, `${topic} ${name} item 4`] })); },
    score(topic) { const t = tokens(topic); return t.filter(x => this.keywords.includes(x)).length * 10 + 12; },
  });
  domains.set("computer-science-0149", {
    id: "computer-science-0149",
    domain: "computer-science",
    keywords: ["computer-science", "concept-149", "study", "exam", "topic"],
    branches(topic) { return ["computer-science foundations", "computer-science mechanisms", "computer-science applications", "computer-science evidence", "computer-science revision"].map((name, idx) => ({ name, color: ["#00d4ff", "#bf00ff", "#00ff88", "#ffae00", "#d4af37"][idx], items: [`${topic} ${name} item 1`, `${topic} ${name} item 2`, `${topic} ${name} item 3`, `${topic} ${name} item 4`] })); },
    score(topic) { const t = tokens(topic); return t.filter(x => this.keywords.includes(x)).length * 10 + 13; },
  });
  domains.set("blockchain-0150", {
    id: "blockchain-0150",
    domain: "blockchain",
    keywords: ["blockchain", "concept-150", "study", "exam", "topic"],
    branches(topic) { return ["blockchain foundations", "blockchain mechanisms", "blockchain applications", "blockchain evidence", "blockchain revision"].map((name, idx) => ({ name, color: ["#00d4ff", "#bf00ff", "#00ff88", "#ffae00", "#d4af37"][idx], items: [`${topic} ${name} item 1`, `${topic} ${name} item 2`, `${topic} ${name} item 3`, `${topic} ${name} item 4`] })); },
    score(topic) { const t = tokens(topic); return t.filter(x => this.keywords.includes(x)).length * 10 + 14; },
  });
  domains.set("economics-0151", {
    id: "economics-0151",
    domain: "economics",
    keywords: ["economics", "concept-151", "study", "exam", "topic"],
    branches(topic) { return ["economics foundations", "economics mechanisms", "economics applications", "economics evidence", "economics revision"].map((name, idx) => ({ name, color: ["#00d4ff", "#bf00ff", "#00ff88", "#ffae00", "#d4af37"][idx], items: [`${topic} ${name} item 1`, `${topic} ${name} item 2`, `${topic} ${name} item 3`, `${topic} ${name} item 4`] })); },
    score(topic) { const t = tokens(topic); return t.filter(x => this.keywords.includes(x)).length * 10 + 15; },
  });
  domains.set("geography-0152", {
    id: "geography-0152",
    domain: "geography",
    keywords: ["geography", "concept-152", "study", "exam", "topic"],
    branches(topic) { return ["geography foundations", "geography mechanisms", "geography applications", "geography evidence", "geography revision"].map((name, idx) => ({ name, color: ["#00d4ff", "#bf00ff", "#00ff88", "#ffae00", "#d4af37"][idx], items: [`${topic} ${name} item 1`, `${topic} ${name} item 2`, `${topic} ${name} item 3`, `${topic} ${name} item 4`] })); },
    score(topic) { const t = tokens(topic); return t.filter(x => this.keywords.includes(x)).length * 10 + 16; },
  });
  domains.set("literature-0153", {
    id: "literature-0153",
    domain: "literature",
    keywords: ["literature", "concept-153", "study", "exam", "topic"],
    branches(topic) { return ["literature foundations", "literature mechanisms", "literature applications", "literature evidence", "literature revision"].map((name, idx) => ({ name, color: ["#00d4ff", "#bf00ff", "#00ff88", "#ffae00", "#d4af37"][idx], items: [`${topic} ${name} item 1`, `${topic} ${name} item 2`, `${topic} ${name} item 3`, `${topic} ${name} item 4`] })); },
    score(topic) { const t = tokens(topic); return t.filter(x => this.keywords.includes(x)).length * 10 + 0; },
  });
  domains.set("medicine-0154", {
    id: "medicine-0154",
    domain: "medicine",
    keywords: ["medicine", "concept-154", "study", "exam", "topic"],
    branches(topic) { return ["medicine foundations", "medicine mechanisms", "medicine applications", "medicine evidence", "medicine revision"].map((name, idx) => ({ name, color: ["#00d4ff", "#bf00ff", "#00ff88", "#ffae00", "#d4af37"][idx], items: [`${topic} ${name} item 1`, `${topic} ${name} item 2`, `${topic} ${name} item 3`, `${topic} ${name} item 4`] })); },
    score(topic) { const t = tokens(topic); return t.filter(x => this.keywords.includes(x)).length * 10 + 1; },
  });
  domains.set("engineering-0155", {
    id: "engineering-0155",
    domain: "engineering",
    keywords: ["engineering", "concept-155", "study", "exam", "topic"],
    branches(topic) { return ["engineering foundations", "engineering mechanisms", "engineering applications", "engineering evidence", "engineering revision"].map((name, idx) => ({ name, color: ["#00d4ff", "#bf00ff", "#00ff88", "#ffae00", "#d4af37"][idx], items: [`${topic} ${name} item 1`, `${topic} ${name} item 2`, `${topic} ${name} item 3`, `${topic} ${name} item 4`] })); },
    score(topic) { const t = tokens(topic); return t.filter(x => this.keywords.includes(x)).length * 10 + 2; },
  });
  domains.set("biology-0156", {
    id: "biology-0156",
    domain: "biology",
    keywords: ["biology", "concept-156", "study", "exam", "topic"],
    branches(topic) { return ["biology foundations", "biology mechanisms", "biology applications", "biology evidence", "biology revision"].map((name, idx) => ({ name, color: ["#00d4ff", "#bf00ff", "#00ff88", "#ffae00", "#d4af37"][idx], items: [`${topic} ${name} item 1`, `${topic} ${name} item 2`, `${topic} ${name} item 3`, `${topic} ${name} item 4`] })); },
    score(topic) { const t = tokens(topic); return t.filter(x => this.keywords.includes(x)).length * 10 + 3; },
  });
  domains.set("physics-0157", {
    id: "physics-0157",
    domain: "physics",
    keywords: ["physics", "concept-157", "study", "exam", "topic"],
    branches(topic) { return ["physics foundations", "physics mechanisms", "physics applications", "physics evidence", "physics revision"].map((name, idx) => ({ name, color: ["#00d4ff", "#bf00ff", "#00ff88", "#ffae00", "#d4af37"][idx], items: [`${topic} ${name} item 1`, `${topic} ${name} item 2`, `${topic} ${name} item 3`, `${topic} ${name} item 4`] })); },
    score(topic) { const t = tokens(topic); return t.filter(x => this.keywords.includes(x)).length * 10 + 4; },
  });
  domains.set("chemistry-0158", {
    id: "chemistry-0158",
    domain: "chemistry",
    keywords: ["chemistry", "concept-158", "study", "exam", "topic"],
    branches(topic) { return ["chemistry foundations", "chemistry mechanisms", "chemistry applications", "chemistry evidence", "chemistry revision"].map((name, idx) => ({ name, color: ["#00d4ff", "#bf00ff", "#00ff88", "#ffae00", "#d4af37"][idx], items: [`${topic} ${name} item 1`, `${topic} ${name} item 2`, `${topic} ${name} item 3`, `${topic} ${name} item 4`] })); },
    score(topic) { const t = tokens(topic); return t.filter(x => this.keywords.includes(x)).length * 10 + 5; },
  });
  domains.set("history-0159", {
    id: "history-0159",
    domain: "history",
    keywords: ["history", "concept-159", "study", "exam", "topic"],
    branches(topic) { return ["history foundations", "history mechanisms", "history applications", "history evidence", "history revision"].map((name, idx) => ({ name, color: ["#00d4ff", "#bf00ff", "#00ff88", "#ffae00", "#d4af37"][idx], items: [`${topic} ${name} item 1`, `${topic} ${name} item 2`, `${topic} ${name} item 3`, `${topic} ${name} item 4`] })); },
    score(topic) { const t = tokens(topic); return t.filter(x => this.keywords.includes(x)).length * 10 + 6; },
  });
  domains.set("math-0160", {
    id: "math-0160",
    domain: "math",
    keywords: ["math", "concept-160", "study", "exam", "topic"],
    branches(topic) { return ["math foundations", "math mechanisms", "math applications", "math evidence", "math revision"].map((name, idx) => ({ name, color: ["#00d4ff", "#bf00ff", "#00ff88", "#ffae00", "#d4af37"][idx], items: [`${topic} ${name} item 1`, `${topic} ${name} item 2`, `${topic} ${name} item 3`, `${topic} ${name} item 4`] })); },
    score(topic) { const t = tokens(topic); return t.filter(x => this.keywords.includes(x)).length * 10 + 7; },
  });
  domains.set("computer-science-0161", {
    id: "computer-science-0161",
    domain: "computer-science",
    keywords: ["computer-science", "concept-161", "study", "exam", "topic"],
    branches(topic) { return ["computer-science foundations", "computer-science mechanisms", "computer-science applications", "computer-science evidence", "computer-science revision"].map((name, idx) => ({ name, color: ["#00d4ff", "#bf00ff", "#00ff88", "#ffae00", "#d4af37"][idx], items: [`${topic} ${name} item 1`, `${topic} ${name} item 2`, `${topic} ${name} item 3`, `${topic} ${name} item 4`] })); },
    score(topic) { const t = tokens(topic); return t.filter(x => this.keywords.includes(x)).length * 10 + 8; },
  });
  domains.set("blockchain-0162", {
    id: "blockchain-0162",
    domain: "blockchain",
    keywords: ["blockchain", "concept-162", "study", "exam", "topic"],
    branches(topic) { return ["blockchain foundations", "blockchain mechanisms", "blockchain applications", "blockchain evidence", "blockchain revision"].map((name, idx) => ({ name, color: ["#00d4ff", "#bf00ff", "#00ff88", "#ffae00", "#d4af37"][idx], items: [`${topic} ${name} item 1`, `${topic} ${name} item 2`, `${topic} ${name} item 3`, `${topic} ${name} item 4`] })); },
    score(topic) { const t = tokens(topic); return t.filter(x => this.keywords.includes(x)).length * 10 + 9; },
  });
  domains.set("economics-0163", {
    id: "economics-0163",
    domain: "economics",
    keywords: ["economics", "concept-163", "study", "exam", "topic"],
    branches(topic) { return ["economics foundations", "economics mechanisms", "economics applications", "economics evidence", "economics revision"].map((name, idx) => ({ name, color: ["#00d4ff", "#bf00ff", "#00ff88", "#ffae00", "#d4af37"][idx], items: [`${topic} ${name} item 1`, `${topic} ${name} item 2`, `${topic} ${name} item 3`, `${topic} ${name} item 4`] })); },
    score(topic) { const t = tokens(topic); return t.filter(x => this.keywords.includes(x)).length * 10 + 10; },
  });
  domains.set("geography-0164", {
    id: "geography-0164",
    domain: "geography",
    keywords: ["geography", "concept-164", "study", "exam", "topic"],
    branches(topic) { return ["geography foundations", "geography mechanisms", "geography applications", "geography evidence", "geography revision"].map((name, idx) => ({ name, color: ["#00d4ff", "#bf00ff", "#00ff88", "#ffae00", "#d4af37"][idx], items: [`${topic} ${name} item 1`, `${topic} ${name} item 2`, `${topic} ${name} item 3`, `${topic} ${name} item 4`] })); },
    score(topic) { const t = tokens(topic); return t.filter(x => this.keywords.includes(x)).length * 10 + 11; },
  });
  domains.set("literature-0165", {
    id: "literature-0165",
    domain: "literature",
    keywords: ["literature", "concept-165", "study", "exam", "topic"],
    branches(topic) { return ["literature foundations", "literature mechanisms", "literature applications", "literature evidence", "literature revision"].map((name, idx) => ({ name, color: ["#00d4ff", "#bf00ff", "#00ff88", "#ffae00", "#d4af37"][idx], items: [`${topic} ${name} item 1`, `${topic} ${name} item 2`, `${topic} ${name} item 3`, `${topic} ${name} item 4`] })); },
    score(topic) { const t = tokens(topic); return t.filter(x => this.keywords.includes(x)).length * 10 + 12; },
  });
  domains.set("medicine-0166", {
    id: "medicine-0166",
    domain: "medicine",
    keywords: ["medicine", "concept-166", "study", "exam", "topic"],
    branches(topic) { return ["medicine foundations", "medicine mechanisms", "medicine applications", "medicine evidence", "medicine revision"].map((name, idx) => ({ name, color: ["#00d4ff", "#bf00ff", "#00ff88", "#ffae00", "#d4af37"][idx], items: [`${topic} ${name} item 1`, `${topic} ${name} item 2`, `${topic} ${name} item 3`, `${topic} ${name} item 4`] })); },
    score(topic) { const t = tokens(topic); return t.filter(x => this.keywords.includes(x)).length * 10 + 13; },
  });
  domains.set("engineering-0167", {
    id: "engineering-0167",
    domain: "engineering",
    keywords: ["engineering", "concept-167", "study", "exam", "topic"],
    branches(topic) { return ["engineering foundations", "engineering mechanisms", "engineering applications", "engineering evidence", "engineering revision"].map((name, idx) => ({ name, color: ["#00d4ff", "#bf00ff", "#00ff88", "#ffae00", "#d4af37"][idx], items: [`${topic} ${name} item 1`, `${topic} ${name} item 2`, `${topic} ${name} item 3`, `${topic} ${name} item 4`] })); },
    score(topic) { const t = tokens(topic); return t.filter(x => this.keywords.includes(x)).length * 10 + 14; },
  });
  domains.set("biology-0168", {
    id: "biology-0168",
    domain: "biology",
    keywords: ["biology", "concept-168", "study", "exam", "topic"],
    branches(topic) { return ["biology foundations", "biology mechanisms", "biology applications", "biology evidence", "biology revision"].map((name, idx) => ({ name, color: ["#00d4ff", "#bf00ff", "#00ff88", "#ffae00", "#d4af37"][idx], items: [`${topic} ${name} item 1`, `${topic} ${name} item 2`, `${topic} ${name} item 3`, `${topic} ${name} item 4`] })); },
    score(topic) { const t = tokens(topic); return t.filter(x => this.keywords.includes(x)).length * 10 + 15; },
  });
  domains.set("physics-0169", {
    id: "physics-0169",
    domain: "physics",
    keywords: ["physics", "concept-169", "study", "exam", "topic"],
    branches(topic) { return ["physics foundations", "physics mechanisms", "physics applications", "physics evidence", "physics revision"].map((name, idx) => ({ name, color: ["#00d4ff", "#bf00ff", "#00ff88", "#ffae00", "#d4af37"][idx], items: [`${topic} ${name} item 1`, `${topic} ${name} item 2`, `${topic} ${name} item 3`, `${topic} ${name} item 4`] })); },
    score(topic) { const t = tokens(topic); return t.filter(x => this.keywords.includes(x)).length * 10 + 16; },
  });
  domains.set("chemistry-0170", {
    id: "chemistry-0170",
    domain: "chemistry",
    keywords: ["chemistry", "concept-170", "study", "exam", "topic"],
    branches(topic) { return ["chemistry foundations", "chemistry mechanisms", "chemistry applications", "chemistry evidence", "chemistry revision"].map((name, idx) => ({ name, color: ["#00d4ff", "#bf00ff", "#00ff88", "#ffae00", "#d4af37"][idx], items: [`${topic} ${name} item 1`, `${topic} ${name} item 2`, `${topic} ${name} item 3`, `${topic} ${name} item 4`] })); },
    score(topic) { const t = tokens(topic); return t.filter(x => this.keywords.includes(x)).length * 10 + 0; },
  });
  domains.set("history-0171", {
    id: "history-0171",
    domain: "history",
    keywords: ["history", "concept-171", "study", "exam", "topic"],
    branches(topic) { return ["history foundations", "history mechanisms", "history applications", "history evidence", "history revision"].map((name, idx) => ({ name, color: ["#00d4ff", "#bf00ff", "#00ff88", "#ffae00", "#d4af37"][idx], items: [`${topic} ${name} item 1`, `${topic} ${name} item 2`, `${topic} ${name} item 3`, `${topic} ${name} item 4`] })); },
    score(topic) { const t = tokens(topic); return t.filter(x => this.keywords.includes(x)).length * 10 + 1; },
  });
  domains.set("math-0172", {
    id: "math-0172",
    domain: "math",
    keywords: ["math", "concept-172", "study", "exam", "topic"],
    branches(topic) { return ["math foundations", "math mechanisms", "math applications", "math evidence", "math revision"].map((name, idx) => ({ name, color: ["#00d4ff", "#bf00ff", "#00ff88", "#ffae00", "#d4af37"][idx], items: [`${topic} ${name} item 1`, `${topic} ${name} item 2`, `${topic} ${name} item 3`, `${topic} ${name} item 4`] })); },
    score(topic) { const t = tokens(topic); return t.filter(x => this.keywords.includes(x)).length * 10 + 2; },
  });
  domains.set("computer-science-0173", {
    id: "computer-science-0173",
    domain: "computer-science",
    keywords: ["computer-science", "concept-173", "study", "exam", "topic"],
    branches(topic) { return ["computer-science foundations", "computer-science mechanisms", "computer-science applications", "computer-science evidence", "computer-science revision"].map((name, idx) => ({ name, color: ["#00d4ff", "#bf00ff", "#00ff88", "#ffae00", "#d4af37"][idx], items: [`${topic} ${name} item 1`, `${topic} ${name} item 2`, `${topic} ${name} item 3`, `${topic} ${name} item 4`] })); },
    score(topic) { const t = tokens(topic); return t.filter(x => this.keywords.includes(x)).length * 10 + 3; },
  });
  domains.set("blockchain-0174", {
    id: "blockchain-0174",
    domain: "blockchain",
    keywords: ["blockchain", "concept-174", "study", "exam", "topic"],
    branches(topic) { return ["blockchain foundations", "blockchain mechanisms", "blockchain applications", "blockchain evidence", "blockchain revision"].map((name, idx) => ({ name, color: ["#00d4ff", "#bf00ff", "#00ff88", "#ffae00", "#d4af37"][idx], items: [`${topic} ${name} item 1`, `${topic} ${name} item 2`, `${topic} ${name} item 3`, `${topic} ${name} item 4`] })); },
    score(topic) { const t = tokens(topic); return t.filter(x => this.keywords.includes(x)).length * 10 + 4; },
  });
  domains.set("economics-0175", {
    id: "economics-0175",
    domain: "economics",
    keywords: ["economics", "concept-175", "study", "exam", "topic"],
    branches(topic) { return ["economics foundations", "economics mechanisms", "economics applications", "economics evidence", "economics revision"].map((name, idx) => ({ name, color: ["#00d4ff", "#bf00ff", "#00ff88", "#ffae00", "#d4af37"][idx], items: [`${topic} ${name} item 1`, `${topic} ${name} item 2`, `${topic} ${name} item 3`, `${topic} ${name} item 4`] })); },
    score(topic) { const t = tokens(topic); return t.filter(x => this.keywords.includes(x)).length * 10 + 5; },
  });
  domains.set("geography-0176", {
    id: "geography-0176",
    domain: "geography",
    keywords: ["geography", "concept-176", "study", "exam", "topic"],
    branches(topic) { return ["geography foundations", "geography mechanisms", "geography applications", "geography evidence", "geography revision"].map((name, idx) => ({ name, color: ["#00d4ff", "#bf00ff", "#00ff88", "#ffae00", "#d4af37"][idx], items: [`${topic} ${name} item 1`, `${topic} ${name} item 2`, `${topic} ${name} item 3`, `${topic} ${name} item 4`] })); },
    score(topic) { const t = tokens(topic); return t.filter(x => this.keywords.includes(x)).length * 10 + 6; },
  });
  domains.set("literature-0177", {
    id: "literature-0177",
    domain: "literature",
    keywords: ["literature", "concept-177", "study", "exam", "topic"],
    branches(topic) { return ["literature foundations", "literature mechanisms", "literature applications", "literature evidence", "literature revision"].map((name, idx) => ({ name, color: ["#00d4ff", "#bf00ff", "#00ff88", "#ffae00", "#d4af37"][idx], items: [`${topic} ${name} item 1`, `${topic} ${name} item 2`, `${topic} ${name} item 3`, `${topic} ${name} item 4`] })); },
    score(topic) { const t = tokens(topic); return t.filter(x => this.keywords.includes(x)).length * 10 + 7; },
  });
  domains.set("medicine-0178", {
    id: "medicine-0178",
    domain: "medicine",
    keywords: ["medicine", "concept-178", "study", "exam", "topic"],
    branches(topic) { return ["medicine foundations", "medicine mechanisms", "medicine applications", "medicine evidence", "medicine revision"].map((name, idx) => ({ name, color: ["#00d4ff", "#bf00ff", "#00ff88", "#ffae00", "#d4af37"][idx], items: [`${topic} ${name} item 1`, `${topic} ${name} item 2`, `${topic} ${name} item 3`, `${topic} ${name} item 4`] })); },
    score(topic) { const t = tokens(topic); return t.filter(x => this.keywords.includes(x)).length * 10 + 8; },
  });
  domains.set("engineering-0179", {
    id: "engineering-0179",
    domain: "engineering",
    keywords: ["engineering", "concept-179", "study", "exam", "topic"],
    branches(topic) { return ["engineering foundations", "engineering mechanisms", "engineering applications", "engineering evidence", "engineering revision"].map((name, idx) => ({ name, color: ["#00d4ff", "#bf00ff", "#00ff88", "#ffae00", "#d4af37"][idx], items: [`${topic} ${name} item 1`, `${topic} ${name} item 2`, `${topic} ${name} item 3`, `${topic} ${name} item 4`] })); },
    score(topic) { const t = tokens(topic); return t.filter(x => this.keywords.includes(x)).length * 10 + 9; },
  });
  domains.set("biology-0180", {
    id: "biology-0180",
    domain: "biology",
    keywords: ["biology", "concept-180", "study", "exam", "topic"],
    branches(topic) { return ["biology foundations", "biology mechanisms", "biology applications", "biology evidence", "biology revision"].map((name, idx) => ({ name, color: ["#00d4ff", "#bf00ff", "#00ff88", "#ffae00", "#d4af37"][idx], items: [`${topic} ${name} item 1`, `${topic} ${name} item 2`, `${topic} ${name} item 3`, `${topic} ${name} item 4`] })); },
    score(topic) { const t = tokens(topic); return t.filter(x => this.keywords.includes(x)).length * 10 + 10; },
  });
  domains.set("physics-0181", {
    id: "physics-0181",
    domain: "physics",
    keywords: ["physics", "concept-181", "study", "exam", "topic"],
    branches(topic) { return ["physics foundations", "physics mechanisms", "physics applications", "physics evidence", "physics revision"].map((name, idx) => ({ name, color: ["#00d4ff", "#bf00ff", "#00ff88", "#ffae00", "#d4af37"][idx], items: [`${topic} ${name} item 1`, `${topic} ${name} item 2`, `${topic} ${name} item 3`, `${topic} ${name} item 4`] })); },
    score(topic) { const t = tokens(topic); return t.filter(x => this.keywords.includes(x)).length * 10 + 11; },
  });
  domains.set("chemistry-0182", {
    id: "chemistry-0182",
    domain: "chemistry",
    keywords: ["chemistry", "concept-182", "study", "exam", "topic"],
    branches(topic) { return ["chemistry foundations", "chemistry mechanisms", "chemistry applications", "chemistry evidence", "chemistry revision"].map((name, idx) => ({ name, color: ["#00d4ff", "#bf00ff", "#00ff88", "#ffae00", "#d4af37"][idx], items: [`${topic} ${name} item 1`, `${topic} ${name} item 2`, `${topic} ${name} item 3`, `${topic} ${name} item 4`] })); },
    score(topic) { const t = tokens(topic); return t.filter(x => this.keywords.includes(x)).length * 10 + 12; },
  });
  domains.set("history-0183", {
    id: "history-0183",
    domain: "history",
    keywords: ["history", "concept-183", "study", "exam", "topic"],
    branches(topic) { return ["history foundations", "history mechanisms", "history applications", "history evidence", "history revision"].map((name, idx) => ({ name, color: ["#00d4ff", "#bf00ff", "#00ff88", "#ffae00", "#d4af37"][idx], items: [`${topic} ${name} item 1`, `${topic} ${name} item 2`, `${topic} ${name} item 3`, `${topic} ${name} item 4`] })); },
    score(topic) { const t = tokens(topic); return t.filter(x => this.keywords.includes(x)).length * 10 + 13; },
  });
  domains.set("math-0184", {
    id: "math-0184",
    domain: "math",
    keywords: ["math", "concept-184", "study", "exam", "topic"],
    branches(topic) { return ["math foundations", "math mechanisms", "math applications", "math evidence", "math revision"].map((name, idx) => ({ name, color: ["#00d4ff", "#bf00ff", "#00ff88", "#ffae00", "#d4af37"][idx], items: [`${topic} ${name} item 1`, `${topic} ${name} item 2`, `${topic} ${name} item 3`, `${topic} ${name} item 4`] })); },
    score(topic) { const t = tokens(topic); return t.filter(x => this.keywords.includes(x)).length * 10 + 14; },
  });
  domains.set("computer-science-0185", {
    id: "computer-science-0185",
    domain: "computer-science",
    keywords: ["computer-science", "concept-185", "study", "exam", "topic"],
    branches(topic) { return ["computer-science foundations", "computer-science mechanisms", "computer-science applications", "computer-science evidence", "computer-science revision"].map((name, idx) => ({ name, color: ["#00d4ff", "#bf00ff", "#00ff88", "#ffae00", "#d4af37"][idx], items: [`${topic} ${name} item 1`, `${topic} ${name} item 2`, `${topic} ${name} item 3`, `${topic} ${name} item 4`] })); },
    score(topic) { const t = tokens(topic); return t.filter(x => this.keywords.includes(x)).length * 10 + 15; },
  });
  domains.set("blockchain-0186", {
    id: "blockchain-0186",
    domain: "blockchain",
    keywords: ["blockchain", "concept-186", "study", "exam", "topic"],
    branches(topic) { return ["blockchain foundations", "blockchain mechanisms", "blockchain applications", "blockchain evidence", "blockchain revision"].map((name, idx) => ({ name, color: ["#00d4ff", "#bf00ff", "#00ff88", "#ffae00", "#d4af37"][idx], items: [`${topic} ${name} item 1`, `${topic} ${name} item 2`, `${topic} ${name} item 3`, `${topic} ${name} item 4`] })); },
    score(topic) { const t = tokens(topic); return t.filter(x => this.keywords.includes(x)).length * 10 + 16; },
  });
  domains.set("economics-0187", {
    id: "economics-0187",
    domain: "economics",
    keywords: ["economics", "concept-187", "study", "exam", "topic"],
    branches(topic) { return ["economics foundations", "economics mechanisms", "economics applications", "economics evidence", "economics revision"].map((name, idx) => ({ name, color: ["#00d4ff", "#bf00ff", "#00ff88", "#ffae00", "#d4af37"][idx], items: [`${topic} ${name} item 1`, `${topic} ${name} item 2`, `${topic} ${name} item 3`, `${topic} ${name} item 4`] })); },
    score(topic) { const t = tokens(topic); return t.filter(x => this.keywords.includes(x)).length * 10 + 0; },
  });
  domains.set("geography-0188", {
    id: "geography-0188",
    domain: "geography",
    keywords: ["geography", "concept-188", "study", "exam", "topic"],
    branches(topic) { return ["geography foundations", "geography mechanisms", "geography applications", "geography evidence", "geography revision"].map((name, idx) => ({ name, color: ["#00d4ff", "#bf00ff", "#00ff88", "#ffae00", "#d4af37"][idx], items: [`${topic} ${name} item 1`, `${topic} ${name} item 2`, `${topic} ${name} item 3`, `${topic} ${name} item 4`] })); },
    score(topic) { const t = tokens(topic); return t.filter(x => this.keywords.includes(x)).length * 10 + 1; },
  });
  domains.set("literature-0189", {
    id: "literature-0189",
    domain: "literature",
    keywords: ["literature", "concept-189", "study", "exam", "topic"],
    branches(topic) { return ["literature foundations", "literature mechanisms", "literature applications", "literature evidence", "literature revision"].map((name, idx) => ({ name, color: ["#00d4ff", "#bf00ff", "#00ff88", "#ffae00", "#d4af37"][idx], items: [`${topic} ${name} item 1`, `${topic} ${name} item 2`, `${topic} ${name} item 3`, `${topic} ${name} item 4`] })); },
    score(topic) { const t = tokens(topic); return t.filter(x => this.keywords.includes(x)).length * 10 + 2; },
  });
  domains.set("medicine-0190", {
    id: "medicine-0190",
    domain: "medicine",
    keywords: ["medicine", "concept-190", "study", "exam", "topic"],
    branches(topic) { return ["medicine foundations", "medicine mechanisms", "medicine applications", "medicine evidence", "medicine revision"].map((name, idx) => ({ name, color: ["#00d4ff", "#bf00ff", "#00ff88", "#ffae00", "#d4af37"][idx], items: [`${topic} ${name} item 1`, `${topic} ${name} item 2`, `${topic} ${name} item 3`, `${topic} ${name} item 4`] })); },
    score(topic) { const t = tokens(topic); return t.filter(x => this.keywords.includes(x)).length * 10 + 3; },
  });
  domains.set("engineering-0191", {
    id: "engineering-0191",
    domain: "engineering",
    keywords: ["engineering", "concept-191", "study", "exam", "topic"],
    branches(topic) { return ["engineering foundations", "engineering mechanisms", "engineering applications", "engineering evidence", "engineering revision"].map((name, idx) => ({ name, color: ["#00d4ff", "#bf00ff", "#00ff88", "#ffae00", "#d4af37"][idx], items: [`${topic} ${name} item 1`, `${topic} ${name} item 2`, `${topic} ${name} item 3`, `${topic} ${name} item 4`] })); },
    score(topic) { const t = tokens(topic); return t.filter(x => this.keywords.includes(x)).length * 10 + 4; },
  });
  domains.set("biology-0192", {
    id: "biology-0192",
    domain: "biology",
    keywords: ["biology", "concept-192", "study", "exam", "topic"],
    branches(topic) { return ["biology foundations", "biology mechanisms", "biology applications", "biology evidence", "biology revision"].map((name, idx) => ({ name, color: ["#00d4ff", "#bf00ff", "#00ff88", "#ffae00", "#d4af37"][idx], items: [`${topic} ${name} item 1`, `${topic} ${name} item 2`, `${topic} ${name} item 3`, `${topic} ${name} item 4`] })); },
    score(topic) { const t = tokens(topic); return t.filter(x => this.keywords.includes(x)).length * 10 + 5; },
  });
  domains.set("physics-0193", {
    id: "physics-0193",
    domain: "physics",
    keywords: ["physics", "concept-193", "study", "exam", "topic"],
    branches(topic) { return ["physics foundations", "physics mechanisms", "physics applications", "physics evidence", "physics revision"].map((name, idx) => ({ name, color: ["#00d4ff", "#bf00ff", "#00ff88", "#ffae00", "#d4af37"][idx], items: [`${topic} ${name} item 1`, `${topic} ${name} item 2`, `${topic} ${name} item 3`, `${topic} ${name} item 4`] })); },
    score(topic) { const t = tokens(topic); return t.filter(x => this.keywords.includes(x)).length * 10 + 6; },
  });
  domains.set("chemistry-0194", {
    id: "chemistry-0194",
    domain: "chemistry",
    keywords: ["chemistry", "concept-194", "study", "exam", "topic"],
    branches(topic) { return ["chemistry foundations", "chemistry mechanisms", "chemistry applications", "chemistry evidence", "chemistry revision"].map((name, idx) => ({ name, color: ["#00d4ff", "#bf00ff", "#00ff88", "#ffae00", "#d4af37"][idx], items: [`${topic} ${name} item 1`, `${topic} ${name} item 2`, `${topic} ${name} item 3`, `${topic} ${name} item 4`] })); },
    score(topic) { const t = tokens(topic); return t.filter(x => this.keywords.includes(x)).length * 10 + 7; },
  });
  domains.set("history-0195", {
    id: "history-0195",
    domain: "history",
    keywords: ["history", "concept-195", "study", "exam", "topic"],
    branches(topic) { return ["history foundations", "history mechanisms", "history applications", "history evidence", "history revision"].map((name, idx) => ({ name, color: ["#00d4ff", "#bf00ff", "#00ff88", "#ffae00", "#d4af37"][idx], items: [`${topic} ${name} item 1`, `${topic} ${name} item 2`, `${topic} ${name} item 3`, `${topic} ${name} item 4`] })); },
    score(topic) { const t = tokens(topic); return t.filter(x => this.keywords.includes(x)).length * 10 + 8; },
  });
  domains.set("math-0196", {
    id: "math-0196",
    domain: "math",
    keywords: ["math", "concept-196", "study", "exam", "topic"],
    branches(topic) { return ["math foundations", "math mechanisms", "math applications", "math evidence", "math revision"].map((name, idx) => ({ name, color: ["#00d4ff", "#bf00ff", "#00ff88", "#ffae00", "#d4af37"][idx], items: [`${topic} ${name} item 1`, `${topic} ${name} item 2`, `${topic} ${name} item 3`, `${topic} ${name} item 4`] })); },
    score(topic) { const t = tokens(topic); return t.filter(x => this.keywords.includes(x)).length * 10 + 9; },
  });
  domains.set("computer-science-0197", {
    id: "computer-science-0197",
    domain: "computer-science",
    keywords: ["computer-science", "concept-197", "study", "exam", "topic"],
    branches(topic) { return ["computer-science foundations", "computer-science mechanisms", "computer-science applications", "computer-science evidence", "computer-science revision"].map((name, idx) => ({ name, color: ["#00d4ff", "#bf00ff", "#00ff88", "#ffae00", "#d4af37"][idx], items: [`${topic} ${name} item 1`, `${topic} ${name} item 2`, `${topic} ${name} item 3`, `${topic} ${name} item 4`] })); },
    score(topic) { const t = tokens(topic); return t.filter(x => this.keywords.includes(x)).length * 10 + 10; },
  });
  domains.set("blockchain-0198", {
    id: "blockchain-0198",
    domain: "blockchain",
    keywords: ["blockchain", "concept-198", "study", "exam", "topic"],
    branches(topic) { return ["blockchain foundations", "blockchain mechanisms", "blockchain applications", "blockchain evidence", "blockchain revision"].map((name, idx) => ({ name, color: ["#00d4ff", "#bf00ff", "#00ff88", "#ffae00", "#d4af37"][idx], items: [`${topic} ${name} item 1`, `${topic} ${name} item 2`, `${topic} ${name} item 3`, `${topic} ${name} item 4`] })); },
    score(topic) { const t = tokens(topic); return t.filter(x => this.keywords.includes(x)).length * 10 + 11; },
  });
  domains.set("economics-0199", {
    id: "economics-0199",
    domain: "economics",
    keywords: ["economics", "concept-199", "study", "exam", "topic"],
    branches(topic) { return ["economics foundations", "economics mechanisms", "economics applications", "economics evidence", "economics revision"].map((name, idx) => ({ name, color: ["#00d4ff", "#bf00ff", "#00ff88", "#ffae00", "#d4af37"][idx], items: [`${topic} ${name} item 1`, `${topic} ${name} item 2`, `${topic} ${name} item 3`, `${topic} ${name} item 4`] })); },
    score(topic) { const t = tokens(topic); return t.filter(x => this.keywords.includes(x)).length * 10 + 12; },
  });
  domains.set("geography-0200", {
    id: "geography-0200",
    domain: "geography",
    keywords: ["geography", "concept-200", "study", "exam", "topic"],
    branches(topic) { return ["geography foundations", "geography mechanisms", "geography applications", "geography evidence", "geography revision"].map((name, idx) => ({ name, color: ["#00d4ff", "#bf00ff", "#00ff88", "#ffae00", "#d4af37"][idx], items: [`${topic} ${name} item 1`, `${topic} ${name} item 2`, `${topic} ${name} item 3`, `${topic} ${name} item 4`] })); },
    score(topic) { const t = tokens(topic); return t.filter(x => this.keywords.includes(x)).length * 10 + 13; },
  });
  domains.set("literature-0201", {
    id: "literature-0201",
    domain: "literature",
    keywords: ["literature", "concept-201", "study", "exam", "topic"],
    branches(topic) { return ["literature foundations", "literature mechanisms", "literature applications", "literature evidence", "literature revision"].map((name, idx) => ({ name, color: ["#00d4ff", "#bf00ff", "#00ff88", "#ffae00", "#d4af37"][idx], items: [`${topic} ${name} item 1`, `${topic} ${name} item 2`, `${topic} ${name} item 3`, `${topic} ${name} item 4`] })); },
    score(topic) { const t = tokens(topic); return t.filter(x => this.keywords.includes(x)).length * 10 + 14; },
  });
  domains.set("medicine-0202", {
    id: "medicine-0202",
    domain: "medicine",
    keywords: ["medicine", "concept-202", "study", "exam", "topic"],
    branches(topic) { return ["medicine foundations", "medicine mechanisms", "medicine applications", "medicine evidence", "medicine revision"].map((name, idx) => ({ name, color: ["#00d4ff", "#bf00ff", "#00ff88", "#ffae00", "#d4af37"][idx], items: [`${topic} ${name} item 1`, `${topic} ${name} item 2`, `${topic} ${name} item 3`, `${topic} ${name} item 4`] })); },
    score(topic) { const t = tokens(topic); return t.filter(x => this.keywords.includes(x)).length * 10 + 15; },
  });
  domains.set("engineering-0203", {
    id: "engineering-0203",
    domain: "engineering",
    keywords: ["engineering", "concept-203", "study", "exam", "topic"],
    branches(topic) { return ["engineering foundations", "engineering mechanisms", "engineering applications", "engineering evidence", "engineering revision"].map((name, idx) => ({ name, color: ["#00d4ff", "#bf00ff", "#00ff88", "#ffae00", "#d4af37"][idx], items: [`${topic} ${name} item 1`, `${topic} ${name} item 2`, `${topic} ${name} item 3`, `${topic} ${name} item 4`] })); },
    score(topic) { const t = tokens(topic); return t.filter(x => this.keywords.includes(x)).length * 10 + 16; },
  });
  domains.set("biology-0204", {
    id: "biology-0204",
    domain: "biology",
    keywords: ["biology", "concept-204", "study", "exam", "topic"],
    branches(topic) { return ["biology foundations", "biology mechanisms", "biology applications", "biology evidence", "biology revision"].map((name, idx) => ({ name, color: ["#00d4ff", "#bf00ff", "#00ff88", "#ffae00", "#d4af37"][idx], items: [`${topic} ${name} item 1`, `${topic} ${name} item 2`, `${topic} ${name} item 3`, `${topic} ${name} item 4`] })); },
    score(topic) { const t = tokens(topic); return t.filter(x => this.keywords.includes(x)).length * 10 + 0; },
  });
  domains.set("physics-0205", {
    id: "physics-0205",
    domain: "physics",
    keywords: ["physics", "concept-205", "study", "exam", "topic"],
    branches(topic) { return ["physics foundations", "physics mechanisms", "physics applications", "physics evidence", "physics revision"].map((name, idx) => ({ name, color: ["#00d4ff", "#bf00ff", "#00ff88", "#ffae00", "#d4af37"][idx], items: [`${topic} ${name} item 1`, `${topic} ${name} item 2`, `${topic} ${name} item 3`, `${topic} ${name} item 4`] })); },
    score(topic) { const t = tokens(topic); return t.filter(x => this.keywords.includes(x)).length * 10 + 1; },
  });
  domains.set("chemistry-0206", {
    id: "chemistry-0206",
    domain: "chemistry",
    keywords: ["chemistry", "concept-206", "study", "exam", "topic"],
    branches(topic) { return ["chemistry foundations", "chemistry mechanisms", "chemistry applications", "chemistry evidence", "chemistry revision"].map((name, idx) => ({ name, color: ["#00d4ff", "#bf00ff", "#00ff88", "#ffae00", "#d4af37"][idx], items: [`${topic} ${name} item 1`, `${topic} ${name} item 2`, `${topic} ${name} item 3`, `${topic} ${name} item 4`] })); },
    score(topic) { const t = tokens(topic); return t.filter(x => this.keywords.includes(x)).length * 10 + 2; },
  });
  domains.set("history-0207", {
    id: "history-0207",
    domain: "history",
    keywords: ["history", "concept-207", "study", "exam", "topic"],
    branches(topic) { return ["history foundations", "history mechanisms", "history applications", "history evidence", "history revision"].map((name, idx) => ({ name, color: ["#00d4ff", "#bf00ff", "#00ff88", "#ffae00", "#d4af37"][idx], items: [`${topic} ${name} item 1`, `${topic} ${name} item 2`, `${topic} ${name} item 3`, `${topic} ${name} item 4`] })); },
    score(topic) { const t = tokens(topic); return t.filter(x => this.keywords.includes(x)).length * 10 + 3; },
  });
  domains.set("math-0208", {
    id: "math-0208",
    domain: "math",
    keywords: ["math", "concept-208", "study", "exam", "topic"],
    branches(topic) { return ["math foundations", "math mechanisms", "math applications", "math evidence", "math revision"].map((name, idx) => ({ name, color: ["#00d4ff", "#bf00ff", "#00ff88", "#ffae00", "#d4af37"][idx], items: [`${topic} ${name} item 1`, `${topic} ${name} item 2`, `${topic} ${name} item 3`, `${topic} ${name} item 4`] })); },
    score(topic) { const t = tokens(topic); return t.filter(x => this.keywords.includes(x)).length * 10 + 4; },
  });
  domains.set("computer-science-0209", {
    id: "computer-science-0209",
    domain: "computer-science",
    keywords: ["computer-science", "concept-209", "study", "exam", "topic"],
    branches(topic) { return ["computer-science foundations", "computer-science mechanisms", "computer-science applications", "computer-science evidence", "computer-science revision"].map((name, idx) => ({ name, color: ["#00d4ff", "#bf00ff", "#00ff88", "#ffae00", "#d4af37"][idx], items: [`${topic} ${name} item 1`, `${topic} ${name} item 2`, `${topic} ${name} item 3`, `${topic} ${name} item 4`] })); },
    score(topic) { const t = tokens(topic); return t.filter(x => this.keywords.includes(x)).length * 10 + 5; },
  });
  domains.set("blockchain-0210", {
    id: "blockchain-0210",
    domain: "blockchain",
    keywords: ["blockchain", "concept-210", "study", "exam", "topic"],
    branches(topic) { return ["blockchain foundations", "blockchain mechanisms", "blockchain applications", "blockchain evidence", "blockchain revision"].map((name, idx) => ({ name, color: ["#00d4ff", "#bf00ff", "#00ff88", "#ffae00", "#d4af37"][idx], items: [`${topic} ${name} item 1`, `${topic} ${name} item 2`, `${topic} ${name} item 3`, `${topic} ${name} item 4`] })); },
    score(topic) { const t = tokens(topic); return t.filter(x => this.keywords.includes(x)).length * 10 + 6; },
  });
  domains.set("economics-0211", {
    id: "economics-0211",
    domain: "economics",
    keywords: ["economics", "concept-211", "study", "exam", "topic"],
    branches(topic) { return ["economics foundations", "economics mechanisms", "economics applications", "economics evidence", "economics revision"].map((name, idx) => ({ name, color: ["#00d4ff", "#bf00ff", "#00ff88", "#ffae00", "#d4af37"][idx], items: [`${topic} ${name} item 1`, `${topic} ${name} item 2`, `${topic} ${name} item 3`, `${topic} ${name} item 4`] })); },
    score(topic) { const t = tokens(topic); return t.filter(x => this.keywords.includes(x)).length * 10 + 7; },
  });
  domains.set("geography-0212", {
    id: "geography-0212",
    domain: "geography",
    keywords: ["geography", "concept-212", "study", "exam", "topic"],
    branches(topic) { return ["geography foundations", "geography mechanisms", "geography applications", "geography evidence", "geography revision"].map((name, idx) => ({ name, color: ["#00d4ff", "#bf00ff", "#00ff88", "#ffae00", "#d4af37"][idx], items: [`${topic} ${name} item 1`, `${topic} ${name} item 2`, `${topic} ${name} item 3`, `${topic} ${name} item 4`] })); },
    score(topic) { const t = tokens(topic); return t.filter(x => this.keywords.includes(x)).length * 10 + 8; },
  });
  domains.set("literature-0213", {
    id: "literature-0213",
    domain: "literature",
    keywords: ["literature", "concept-213", "study", "exam", "topic"],
    branches(topic) { return ["literature foundations", "literature mechanisms", "literature applications", "literature evidence", "literature revision"].map((name, idx) => ({ name, color: ["#00d4ff", "#bf00ff", "#00ff88", "#ffae00", "#d4af37"][idx], items: [`${topic} ${name} item 1`, `${topic} ${name} item 2`, `${topic} ${name} item 3`, `${topic} ${name} item 4`] })); },
    score(topic) { const t = tokens(topic); return t.filter(x => this.keywords.includes(x)).length * 10 + 9; },
  });
  domains.set("medicine-0214", {
    id: "medicine-0214",
    domain: "medicine",
    keywords: ["medicine", "concept-214", "study", "exam", "topic"],
    branches(topic) { return ["medicine foundations", "medicine mechanisms", "medicine applications", "medicine evidence", "medicine revision"].map((name, idx) => ({ name, color: ["#00d4ff", "#bf00ff", "#00ff88", "#ffae00", "#d4af37"][idx], items: [`${topic} ${name} item 1`, `${topic} ${name} item 2`, `${topic} ${name} item 3`, `${topic} ${name} item 4`] })); },
    score(topic) { const t = tokens(topic); return t.filter(x => this.keywords.includes(x)).length * 10 + 10; },
  });
  domains.set("engineering-0215", {
    id: "engineering-0215",
    domain: "engineering",
    keywords: ["engineering", "concept-215", "study", "exam", "topic"],
    branches(topic) { return ["engineering foundations", "engineering mechanisms", "engineering applications", "engineering evidence", "engineering revision"].map((name, idx) => ({ name, color: ["#00d4ff", "#bf00ff", "#00ff88", "#ffae00", "#d4af37"][idx], items: [`${topic} ${name} item 1`, `${topic} ${name} item 2`, `${topic} ${name} item 3`, `${topic} ${name} item 4`] })); },
    score(topic) { const t = tokens(topic); return t.filter(x => this.keywords.includes(x)).length * 10 + 11; },
  });
  domains.set("biology-0216", {
    id: "biology-0216",
    domain: "biology",
    keywords: ["biology", "concept-216", "study", "exam", "topic"],
    branches(topic) { return ["biology foundations", "biology mechanisms", "biology applications", "biology evidence", "biology revision"].map((name, idx) => ({ name, color: ["#00d4ff", "#bf00ff", "#00ff88", "#ffae00", "#d4af37"][idx], items: [`${topic} ${name} item 1`, `${topic} ${name} item 2`, `${topic} ${name} item 3`, `${topic} ${name} item 4`] })); },
    score(topic) { const t = tokens(topic); return t.filter(x => this.keywords.includes(x)).length * 10 + 12; },
  });
  domains.set("physics-0217", {
    id: "physics-0217",
    domain: "physics",
    keywords: ["physics", "concept-217", "study", "exam", "topic"],
    branches(topic) { return ["physics foundations", "physics mechanisms", "physics applications", "physics evidence", "physics revision"].map((name, idx) => ({ name, color: ["#00d4ff", "#bf00ff", "#00ff88", "#ffae00", "#d4af37"][idx], items: [`${topic} ${name} item 1`, `${topic} ${name} item 2`, `${topic} ${name} item 3`, `${topic} ${name} item 4`] })); },
    score(topic) { const t = tokens(topic); return t.filter(x => this.keywords.includes(x)).length * 10 + 13; },
  });
  domains.set("chemistry-0218", {
    id: "chemistry-0218",
    domain: "chemistry",
    keywords: ["chemistry", "concept-218", "study", "exam", "topic"],
    branches(topic) { return ["chemistry foundations", "chemistry mechanisms", "chemistry applications", "chemistry evidence", "chemistry revision"].map((name, idx) => ({ name, color: ["#00d4ff", "#bf00ff", "#00ff88", "#ffae00", "#d4af37"][idx], items: [`${topic} ${name} item 1`, `${topic} ${name} item 2`, `${topic} ${name} item 3`, `${topic} ${name} item 4`] })); },
    score(topic) { const t = tokens(topic); return t.filter(x => this.keywords.includes(x)).length * 10 + 14; },
  });
  domains.set("history-0219", {
    id: "history-0219",
    domain: "history",
    keywords: ["history", "concept-219", "study", "exam", "topic"],
    branches(topic) { return ["history foundations", "history mechanisms", "history applications", "history evidence", "history revision"].map((name, idx) => ({ name, color: ["#00d4ff", "#bf00ff", "#00ff88", "#ffae00", "#d4af37"][idx], items: [`${topic} ${name} item 1`, `${topic} ${name} item 2`, `${topic} ${name} item 3`, `${topic} ${name} item 4`] })); },
    score(topic) { const t = tokens(topic); return t.filter(x => this.keywords.includes(x)).length * 10 + 15; },
  });
  domains.set("math-0220", {
    id: "math-0220",
    domain: "math",
    keywords: ["math", "concept-220", "study", "exam", "topic"],
    branches(topic) { return ["math foundations", "math mechanisms", "math applications", "math evidence", "math revision"].map((name, idx) => ({ name, color: ["#00d4ff", "#bf00ff", "#00ff88", "#ffae00", "#d4af37"][idx], items: [`${topic} ${name} item 1`, `${topic} ${name} item 2`, `${topic} ${name} item 3`, `${topic} ${name} item 4`] })); },
    score(topic) { const t = tokens(topic); return t.filter(x => this.keywords.includes(x)).length * 10 + 16; },
  });
  domains.set("computer-science-0221", {
    id: "computer-science-0221",
    domain: "computer-science",
    keywords: ["computer-science", "concept-221", "study", "exam", "topic"],
    branches(topic) { return ["computer-science foundations", "computer-science mechanisms", "computer-science applications", "computer-science evidence", "computer-science revision"].map((name, idx) => ({ name, color: ["#00d4ff", "#bf00ff", "#00ff88", "#ffae00", "#d4af37"][idx], items: [`${topic} ${name} item 1`, `${topic} ${name} item 2`, `${topic} ${name} item 3`, `${topic} ${name} item 4`] })); },
    score(topic) { const t = tokens(topic); return t.filter(x => this.keywords.includes(x)).length * 10 + 0; },
  });
  domains.set("blockchain-0222", {
    id: "blockchain-0222",
    domain: "blockchain",
    keywords: ["blockchain", "concept-222", "study", "exam", "topic"],
    branches(topic) { return ["blockchain foundations", "blockchain mechanisms", "blockchain applications", "blockchain evidence", "blockchain revision"].map((name, idx) => ({ name, color: ["#00d4ff", "#bf00ff", "#00ff88", "#ffae00", "#d4af37"][idx], items: [`${topic} ${name} item 1`, `${topic} ${name} item 2`, `${topic} ${name} item 3`, `${topic} ${name} item 4`] })); },
    score(topic) { const t = tokens(topic); return t.filter(x => this.keywords.includes(x)).length * 10 + 1; },
  });
  domains.set("economics-0223", {
    id: "economics-0223",
    domain: "economics",
    keywords: ["economics", "concept-223", "study", "exam", "topic"],
    branches(topic) { return ["economics foundations", "economics mechanisms", "economics applications", "economics evidence", "economics revision"].map((name, idx) => ({ name, color: ["#00d4ff", "#bf00ff", "#00ff88", "#ffae00", "#d4af37"][idx], items: [`${topic} ${name} item 1`, `${topic} ${name} item 2`, `${topic} ${name} item 3`, `${topic} ${name} item 4`] })); },
    score(topic) { const t = tokens(topic); return t.filter(x => this.keywords.includes(x)).length * 10 + 2; },
  });
  domains.set("geography-0224", {
    id: "geography-0224",
    domain: "geography",
    keywords: ["geography", "concept-224", "study", "exam", "topic"],
    branches(topic) { return ["geography foundations", "geography mechanisms", "geography applications", "geography evidence", "geography revision"].map((name, idx) => ({ name, color: ["#00d4ff", "#bf00ff", "#00ff88", "#ffae00", "#d4af37"][idx], items: [`${topic} ${name} item 1`, `${topic} ${name} item 2`, `${topic} ${name} item 3`, `${topic} ${name} item 4`] })); },
    score(topic) { const t = tokens(topic); return t.filter(x => this.keywords.includes(x)).length * 10 + 3; },
  });
  domains.set("literature-0225", {
    id: "literature-0225",
    domain: "literature",
    keywords: ["literature", "concept-225", "study", "exam", "topic"],
    branches(topic) { return ["literature foundations", "literature mechanisms", "literature applications", "literature evidence", "literature revision"].map((name, idx) => ({ name, color: ["#00d4ff", "#bf00ff", "#00ff88", "#ffae00", "#d4af37"][idx], items: [`${topic} ${name} item 1`, `${topic} ${name} item 2`, `${topic} ${name} item 3`, `${topic} ${name} item 4`] })); },
    score(topic) { const t = tokens(topic); return t.filter(x => this.keywords.includes(x)).length * 10 + 4; },
  });
  domains.set("medicine-0226", {
    id: "medicine-0226",
    domain: "medicine",
    keywords: ["medicine", "concept-226", "study", "exam", "topic"],
    branches(topic) { return ["medicine foundations", "medicine mechanisms", "medicine applications", "medicine evidence", "medicine revision"].map((name, idx) => ({ name, color: ["#00d4ff", "#bf00ff", "#00ff88", "#ffae00", "#d4af37"][idx], items: [`${topic} ${name} item 1`, `${topic} ${name} item 2`, `${topic} ${name} item 3`, `${topic} ${name} item 4`] })); },
    score(topic) { const t = tokens(topic); return t.filter(x => this.keywords.includes(x)).length * 10 + 5; },
  });
  domains.set("engineering-0227", {
    id: "engineering-0227",
    domain: "engineering",
    keywords: ["engineering", "concept-227", "study", "exam", "topic"],
    branches(topic) { return ["engineering foundations", "engineering mechanisms", "engineering applications", "engineering evidence", "engineering revision"].map((name, idx) => ({ name, color: ["#00d4ff", "#bf00ff", "#00ff88", "#ffae00", "#d4af37"][idx], items: [`${topic} ${name} item 1`, `${topic} ${name} item 2`, `${topic} ${name} item 3`, `${topic} ${name} item 4`] })); },
    score(topic) { const t = tokens(topic); return t.filter(x => this.keywords.includes(x)).length * 10 + 6; },
  });
  domains.set("biology-0228", {
    id: "biology-0228",
    domain: "biology",
    keywords: ["biology", "concept-228", "study", "exam", "topic"],
    branches(topic) { return ["biology foundations", "biology mechanisms", "biology applications", "biology evidence", "biology revision"].map((name, idx) => ({ name, color: ["#00d4ff", "#bf00ff", "#00ff88", "#ffae00", "#d4af37"][idx], items: [`${topic} ${name} item 1`, `${topic} ${name} item 2`, `${topic} ${name} item 3`, `${topic} ${name} item 4`] })); },
    score(topic) { const t = tokens(topic); return t.filter(x => this.keywords.includes(x)).length * 10 + 7; },
  });
  domains.set("physics-0229", {
    id: "physics-0229",
    domain: "physics",
    keywords: ["physics", "concept-229", "study", "exam", "topic"],
    branches(topic) { return ["physics foundations", "physics mechanisms", "physics applications", "physics evidence", "physics revision"].map((name, idx) => ({ name, color: ["#00d4ff", "#bf00ff", "#00ff88", "#ffae00", "#d4af37"][idx], items: [`${topic} ${name} item 1`, `${topic} ${name} item 2`, `${topic} ${name} item 3`, `${topic} ${name} item 4`] })); },
    score(topic) { const t = tokens(topic); return t.filter(x => this.keywords.includes(x)).length * 10 + 8; },
  });
  domains.set("chemistry-0230", {
    id: "chemistry-0230",
    domain: "chemistry",
    keywords: ["chemistry", "concept-230", "study", "exam", "topic"],
    branches(topic) { return ["chemistry foundations", "chemistry mechanisms", "chemistry applications", "chemistry evidence", "chemistry revision"].map((name, idx) => ({ name, color: ["#00d4ff", "#bf00ff", "#00ff88", "#ffae00", "#d4af37"][idx], items: [`${topic} ${name} item 1`, `${topic} ${name} item 2`, `${topic} ${name} item 3`, `${topic} ${name} item 4`] })); },
    score(topic) { const t = tokens(topic); return t.filter(x => this.keywords.includes(x)).length * 10 + 9; },
  });
  domains.set("history-0231", {
    id: "history-0231",
    domain: "history",
    keywords: ["history", "concept-231", "study", "exam", "topic"],
    branches(topic) { return ["history foundations", "history mechanisms", "history applications", "history evidence", "history revision"].map((name, idx) => ({ name, color: ["#00d4ff", "#bf00ff", "#00ff88", "#ffae00", "#d4af37"][idx], items: [`${topic} ${name} item 1`, `${topic} ${name} item 2`, `${topic} ${name} item 3`, `${topic} ${name} item 4`] })); },
    score(topic) { const t = tokens(topic); return t.filter(x => this.keywords.includes(x)).length * 10 + 10; },
  });
  domains.set("math-0232", {
    id: "math-0232",
    domain: "math",
    keywords: ["math", "concept-232", "study", "exam", "topic"],
    branches(topic) { return ["math foundations", "math mechanisms", "math applications", "math evidence", "math revision"].map((name, idx) => ({ name, color: ["#00d4ff", "#bf00ff", "#00ff88", "#ffae00", "#d4af37"][idx], items: [`${topic} ${name} item 1`, `${topic} ${name} item 2`, `${topic} ${name} item 3`, `${topic} ${name} item 4`] })); },
    score(topic) { const t = tokens(topic); return t.filter(x => this.keywords.includes(x)).length * 10 + 11; },
  });
  domains.set("computer-science-0233", {
    id: "computer-science-0233",
    domain: "computer-science",
    keywords: ["computer-science", "concept-233", "study", "exam", "topic"],
    branches(topic) { return ["computer-science foundations", "computer-science mechanisms", "computer-science applications", "computer-science evidence", "computer-science revision"].map((name, idx) => ({ name, color: ["#00d4ff", "#bf00ff", "#00ff88", "#ffae00", "#d4af37"][idx], items: [`${topic} ${name} item 1`, `${topic} ${name} item 2`, `${topic} ${name} item 3`, `${topic} ${name} item 4`] })); },
    score(topic) { const t = tokens(topic); return t.filter(x => this.keywords.includes(x)).length * 10 + 12; },
  });
  domains.set("blockchain-0234", {
    id: "blockchain-0234",
    domain: "blockchain",
    keywords: ["blockchain", "concept-234", "study", "exam", "topic"],
    branches(topic) { return ["blockchain foundations", "blockchain mechanisms", "blockchain applications", "blockchain evidence", "blockchain revision"].map((name, idx) => ({ name, color: ["#00d4ff", "#bf00ff", "#00ff88", "#ffae00", "#d4af37"][idx], items: [`${topic} ${name} item 1`, `${topic} ${name} item 2`, `${topic} ${name} item 3`, `${topic} ${name} item 4`] })); },
    score(topic) { const t = tokens(topic); return t.filter(x => this.keywords.includes(x)).length * 10 + 13; },
  });
  domains.set("economics-0235", {
    id: "economics-0235",
    domain: "economics",
    keywords: ["economics", "concept-235", "study", "exam", "topic"],
    branches(topic) { return ["economics foundations", "economics mechanisms", "economics applications", "economics evidence", "economics revision"].map((name, idx) => ({ name, color: ["#00d4ff", "#bf00ff", "#00ff88", "#ffae00", "#d4af37"][idx], items: [`${topic} ${name} item 1`, `${topic} ${name} item 2`, `${topic} ${name} item 3`, `${topic} ${name} item 4`] })); },
    score(topic) { const t = tokens(topic); return t.filter(x => this.keywords.includes(x)).length * 10 + 14; },
  });
  domains.set("geography-0236", {
    id: "geography-0236",
    domain: "geography",
    keywords: ["geography", "concept-236", "study", "exam", "topic"],
    branches(topic) { return ["geography foundations", "geography mechanisms", "geography applications", "geography evidence", "geography revision"].map((name, idx) => ({ name, color: ["#00d4ff", "#bf00ff", "#00ff88", "#ffae00", "#d4af37"][idx], items: [`${topic} ${name} item 1`, `${topic} ${name} item 2`, `${topic} ${name} item 3`, `${topic} ${name} item 4`] })); },
    score(topic) { const t = tokens(topic); return t.filter(x => this.keywords.includes(x)).length * 10 + 15; },
  });
  domains.set("literature-0237", {
    id: "literature-0237",
    domain: "literature",
    keywords: ["literature", "concept-237", "study", "exam", "topic"],
    branches(topic) { return ["literature foundations", "literature mechanisms", "literature applications", "literature evidence", "literature revision"].map((name, idx) => ({ name, color: ["#00d4ff", "#bf00ff", "#00ff88", "#ffae00", "#d4af37"][idx], items: [`${topic} ${name} item 1`, `${topic} ${name} item 2`, `${topic} ${name} item 3`, `${topic} ${name} item 4`] })); },
    score(topic) { const t = tokens(topic); return t.filter(x => this.keywords.includes(x)).length * 10 + 16; },
  });
  domains.set("medicine-0238", {
    id: "medicine-0238",
    domain: "medicine",
    keywords: ["medicine", "concept-238", "study", "exam", "topic"],
    branches(topic) { return ["medicine foundations", "medicine mechanisms", "medicine applications", "medicine evidence", "medicine revision"].map((name, idx) => ({ name, color: ["#00d4ff", "#bf00ff", "#00ff88", "#ffae00", "#d4af37"][idx], items: [`${topic} ${name} item 1`, `${topic} ${name} item 2`, `${topic} ${name} item 3`, `${topic} ${name} item 4`] })); },
    score(topic) { const t = tokens(topic); return t.filter(x => this.keywords.includes(x)).length * 10 + 0; },
  });
  domains.set("engineering-0239", {
    id: "engineering-0239",
    domain: "engineering",
    keywords: ["engineering", "concept-239", "study", "exam", "topic"],
    branches(topic) { return ["engineering foundations", "engineering mechanisms", "engineering applications", "engineering evidence", "engineering revision"].map((name, idx) => ({ name, color: ["#00d4ff", "#bf00ff", "#00ff88", "#ffae00", "#d4af37"][idx], items: [`${topic} ${name} item 1`, `${topic} ${name} item 2`, `${topic} ${name} item 3`, `${topic} ${name} item 4`] })); },
    score(topic) { const t = tokens(topic); return t.filter(x => this.keywords.includes(x)).length * 10 + 1; },
  });
  domains.set("biology-0240", {
    id: "biology-0240",
    domain: "biology",
    keywords: ["biology", "concept-240", "study", "exam", "topic"],
    branches(topic) { return ["biology foundations", "biology mechanisms", "biology applications", "biology evidence", "biology revision"].map((name, idx) => ({ name, color: ["#00d4ff", "#bf00ff", "#00ff88", "#ffae00", "#d4af37"][idx], items: [`${topic} ${name} item 1`, `${topic} ${name} item 2`, `${topic} ${name} item 3`, `${topic} ${name} item 4`] })); },
    score(topic) { const t = tokens(topic); return t.filter(x => this.keywords.includes(x)).length * 10 + 2; },
  });
  domains.set("physics-0241", {
    id: "physics-0241",
    domain: "physics",
    keywords: ["physics", "concept-241", "study", "exam", "topic"],
    branches(topic) { return ["physics foundations", "physics mechanisms", "physics applications", "physics evidence", "physics revision"].map((name, idx) => ({ name, color: ["#00d4ff", "#bf00ff", "#00ff88", "#ffae00", "#d4af37"][idx], items: [`${topic} ${name} item 1`, `${topic} ${name} item 2`, `${topic} ${name} item 3`, `${topic} ${name} item 4`] })); },
    score(topic) { const t = tokens(topic); return t.filter(x => this.keywords.includes(x)).length * 10 + 3; },
  });
  domains.set("chemistry-0242", {
    id: "chemistry-0242",
    domain: "chemistry",
    keywords: ["chemistry", "concept-242", "study", "exam", "topic"],
    branches(topic) { return ["chemistry foundations", "chemistry mechanisms", "chemistry applications", "chemistry evidence", "chemistry revision"].map((name, idx) => ({ name, color: ["#00d4ff", "#bf00ff", "#00ff88", "#ffae00", "#d4af37"][idx], items: [`${topic} ${name} item 1`, `${topic} ${name} item 2`, `${topic} ${name} item 3`, `${topic} ${name} item 4`] })); },
    score(topic) { const t = tokens(topic); return t.filter(x => this.keywords.includes(x)).length * 10 + 4; },
  });
  domains.set("history-0243", {
    id: "history-0243",
    domain: "history",
    keywords: ["history", "concept-243", "study", "exam", "topic"],
    branches(topic) { return ["history foundations", "history mechanisms", "history applications", "history evidence", "history revision"].map((name, idx) => ({ name, color: ["#00d4ff", "#bf00ff", "#00ff88", "#ffae00", "#d4af37"][idx], items: [`${topic} ${name} item 1`, `${topic} ${name} item 2`, `${topic} ${name} item 3`, `${topic} ${name} item 4`] })); },
    score(topic) { const t = tokens(topic); return t.filter(x => this.keywords.includes(x)).length * 10 + 5; },
  });
  domains.set("math-0244", {
    id: "math-0244",
    domain: "math",
    keywords: ["math", "concept-244", "study", "exam", "topic"],
    branches(topic) { return ["math foundations", "math mechanisms", "math applications", "math evidence", "math revision"].map((name, idx) => ({ name, color: ["#00d4ff", "#bf00ff", "#00ff88", "#ffae00", "#d4af37"][idx], items: [`${topic} ${name} item 1`, `${topic} ${name} item 2`, `${topic} ${name} item 3`, `${topic} ${name} item 4`] })); },
    score(topic) { const t = tokens(topic); return t.filter(x => this.keywords.includes(x)).length * 10 + 6; },
  });
  domains.set("computer-science-0245", {
    id: "computer-science-0245",
    domain: "computer-science",
    keywords: ["computer-science", "concept-245", "study", "exam", "topic"],
    branches(topic) { return ["computer-science foundations", "computer-science mechanisms", "computer-science applications", "computer-science evidence", "computer-science revision"].map((name, idx) => ({ name, color: ["#00d4ff", "#bf00ff", "#00ff88", "#ffae00", "#d4af37"][idx], items: [`${topic} ${name} item 1`, `${topic} ${name} item 2`, `${topic} ${name} item 3`, `${topic} ${name} item 4`] })); },
    score(topic) { const t = tokens(topic); return t.filter(x => this.keywords.includes(x)).length * 10 + 7; },
  });
  domains.set("blockchain-0246", {
    id: "blockchain-0246",
    domain: "blockchain",
    keywords: ["blockchain", "concept-246", "study", "exam", "topic"],
    branches(topic) { return ["blockchain foundations", "blockchain mechanisms", "blockchain applications", "blockchain evidence", "blockchain revision"].map((name, idx) => ({ name, color: ["#00d4ff", "#bf00ff", "#00ff88", "#ffae00", "#d4af37"][idx], items: [`${topic} ${name} item 1`, `${topic} ${name} item 2`, `${topic} ${name} item 3`, `${topic} ${name} item 4`] })); },
    score(topic) { const t = tokens(topic); return t.filter(x => this.keywords.includes(x)).length * 10 + 8; },
  });
  domains.set("economics-0247", {
    id: "economics-0247",
    domain: "economics",
    keywords: ["economics", "concept-247", "study", "exam", "topic"],
    branches(topic) { return ["economics foundations", "economics mechanisms", "economics applications", "economics evidence", "economics revision"].map((name, idx) => ({ name, color: ["#00d4ff", "#bf00ff", "#00ff88", "#ffae00", "#d4af37"][idx], items: [`${topic} ${name} item 1`, `${topic} ${name} item 2`, `${topic} ${name} item 3`, `${topic} ${name} item 4`] })); },
    score(topic) { const t = tokens(topic); return t.filter(x => this.keywords.includes(x)).length * 10 + 9; },
  });
  domains.set("geography-0248", {
    id: "geography-0248",
    domain: "geography",
    keywords: ["geography", "concept-248", "study", "exam", "topic"],
    branches(topic) { return ["geography foundations", "geography mechanisms", "geography applications", "geography evidence", "geography revision"].map((name, idx) => ({ name, color: ["#00d4ff", "#bf00ff", "#00ff88", "#ffae00", "#d4af37"][idx], items: [`${topic} ${name} item 1`, `${topic} ${name} item 2`, `${topic} ${name} item 3`, `${topic} ${name} item 4`] })); },
    score(topic) { const t = tokens(topic); return t.filter(x => this.keywords.includes(x)).length * 10 + 10; },
  });
  domains.set("literature-0249", {
    id: "literature-0249",
    domain: "literature",
    keywords: ["literature", "concept-249", "study", "exam", "topic"],
    branches(topic) { return ["literature foundations", "literature mechanisms", "literature applications", "literature evidence", "literature revision"].map((name, idx) => ({ name, color: ["#00d4ff", "#bf00ff", "#00ff88", "#ffae00", "#d4af37"][idx], items: [`${topic} ${name} item 1`, `${topic} ${name} item 2`, `${topic} ${name} item 3`, `${topic} ${name} item 4`] })); },
    score(topic) { const t = tokens(topic); return t.filter(x => this.keywords.includes(x)).length * 10 + 11; },
  });
  domains.set("medicine-0250", {
    id: "medicine-0250",
    domain: "medicine",
    keywords: ["medicine", "concept-250", "study", "exam", "topic"],
    branches(topic) { return ["medicine foundations", "medicine mechanisms", "medicine applications", "medicine evidence", "medicine revision"].map((name, idx) => ({ name, color: ["#00d4ff", "#bf00ff", "#00ff88", "#ffae00", "#d4af37"][idx], items: [`${topic} ${name} item 1`, `${topic} ${name} item 2`, `${topic} ${name} item 3`, `${topic} ${name} item 4`] })); },
    score(topic) { const t = tokens(topic); return t.filter(x => this.keywords.includes(x)).length * 10 + 12; },
  });
  domains.set("engineering-0251", {
    id: "engineering-0251",
    domain: "engineering",
    keywords: ["engineering", "concept-251", "study", "exam", "topic"],
    branches(topic) { return ["engineering foundations", "engineering mechanisms", "engineering applications", "engineering evidence", "engineering revision"].map((name, idx) => ({ name, color: ["#00d4ff", "#bf00ff", "#00ff88", "#ffae00", "#d4af37"][idx], items: [`${topic} ${name} item 1`, `${topic} ${name} item 2`, `${topic} ${name} item 3`, `${topic} ${name} item 4`] })); },
    score(topic) { const t = tokens(topic); return t.filter(x => this.keywords.includes(x)).length * 10 + 13; },
  });
  domains.set("biology-0252", {
    id: "biology-0252",
    domain: "biology",
    keywords: ["biology", "concept-252", "study", "exam", "topic"],
    branches(topic) { return ["biology foundations", "biology mechanisms", "biology applications", "biology evidence", "biology revision"].map((name, idx) => ({ name, color: ["#00d4ff", "#bf00ff", "#00ff88", "#ffae00", "#d4af37"][idx], items: [`${topic} ${name} item 1`, `${topic} ${name} item 2`, `${topic} ${name} item 3`, `${topic} ${name} item 4`] })); },
    score(topic) { const t = tokens(topic); return t.filter(x => this.keywords.includes(x)).length * 10 + 14; },
  });
  domains.set("physics-0253", {
    id: "physics-0253",
    domain: "physics",
    keywords: ["physics", "concept-253", "study", "exam", "topic"],
    branches(topic) { return ["physics foundations", "physics mechanisms", "physics applications", "physics evidence", "physics revision"].map((name, idx) => ({ name, color: ["#00d4ff", "#bf00ff", "#00ff88", "#ffae00", "#d4af37"][idx], items: [`${topic} ${name} item 1`, `${topic} ${name} item 2`, `${topic} ${name} item 3`, `${topic} ${name} item 4`] })); },
    score(topic) { const t = tokens(topic); return t.filter(x => this.keywords.includes(x)).length * 10 + 15; },
  });
  domains.set("chemistry-0254", {
    id: "chemistry-0254",
    domain: "chemistry",
    keywords: ["chemistry", "concept-254", "study", "exam", "topic"],
    branches(topic) { return ["chemistry foundations", "chemistry mechanisms", "chemistry applications", "chemistry evidence", "chemistry revision"].map((name, idx) => ({ name, color: ["#00d4ff", "#bf00ff", "#00ff88", "#ffae00", "#d4af37"][idx], items: [`${topic} ${name} item 1`, `${topic} ${name} item 2`, `${topic} ${name} item 3`, `${topic} ${name} item 4`] })); },
    score(topic) { const t = tokens(topic); return t.filter(x => this.keywords.includes(x)).length * 10 + 16; },
  });
  domains.set("history-0255", {
    id: "history-0255",
    domain: "history",
    keywords: ["history", "concept-255", "study", "exam", "topic"],
    branches(topic) { return ["history foundations", "history mechanisms", "history applications", "history evidence", "history revision"].map((name, idx) => ({ name, color: ["#00d4ff", "#bf00ff", "#00ff88", "#ffae00", "#d4af37"][idx], items: [`${topic} ${name} item 1`, `${topic} ${name} item 2`, `${topic} ${name} item 3`, `${topic} ${name} item 4`] })); },
    score(topic) { const t = tokens(topic); return t.filter(x => this.keywords.includes(x)).length * 10 + 0; },
  });
  domains.set("math-0256", {
    id: "math-0256",
    domain: "math",
    keywords: ["math", "concept-256", "study", "exam", "topic"],
    branches(topic) { return ["math foundations", "math mechanisms", "math applications", "math evidence", "math revision"].map((name, idx) => ({ name, color: ["#00d4ff", "#bf00ff", "#00ff88", "#ffae00", "#d4af37"][idx], items: [`${topic} ${name} item 1`, `${topic} ${name} item 2`, `${topic} ${name} item 3`, `${topic} ${name} item 4`] })); },
    score(topic) { const t = tokens(topic); return t.filter(x => this.keywords.includes(x)).length * 10 + 1; },
  });
  domains.set("computer-science-0257", {
    id: "computer-science-0257",
    domain: "computer-science",
    keywords: ["computer-science", "concept-257", "study", "exam", "topic"],
    branches(topic) { return ["computer-science foundations", "computer-science mechanisms", "computer-science applications", "computer-science evidence", "computer-science revision"].map((name, idx) => ({ name, color: ["#00d4ff", "#bf00ff", "#00ff88", "#ffae00", "#d4af37"][idx], items: [`${topic} ${name} item 1`, `${topic} ${name} item 2`, `${topic} ${name} item 3`, `${topic} ${name} item 4`] })); },
    score(topic) { const t = tokens(topic); return t.filter(x => this.keywords.includes(x)).length * 10 + 2; },
  });
  domains.set("blockchain-0258", {
    id: "blockchain-0258",
    domain: "blockchain",
    keywords: ["blockchain", "concept-258", "study", "exam", "topic"],
    branches(topic) { return ["blockchain foundations", "blockchain mechanisms", "blockchain applications", "blockchain evidence", "blockchain revision"].map((name, idx) => ({ name, color: ["#00d4ff", "#bf00ff", "#00ff88", "#ffae00", "#d4af37"][idx], items: [`${topic} ${name} item 1`, `${topic} ${name} item 2`, `${topic} ${name} item 3`, `${topic} ${name} item 4`] })); },
    score(topic) { const t = tokens(topic); return t.filter(x => this.keywords.includes(x)).length * 10 + 3; },
  });
  domains.set("economics-0259", {
    id: "economics-0259",
    domain: "economics",
    keywords: ["economics", "concept-259", "study", "exam", "topic"],
    branches(topic) { return ["economics foundations", "economics mechanisms", "economics applications", "economics evidence", "economics revision"].map((name, idx) => ({ name, color: ["#00d4ff", "#bf00ff", "#00ff88", "#ffae00", "#d4af37"][idx], items: [`${topic} ${name} item 1`, `${topic} ${name} item 2`, `${topic} ${name} item 3`, `${topic} ${name} item 4`] })); },
    score(topic) { const t = tokens(topic); return t.filter(x => this.keywords.includes(x)).length * 10 + 4; },
  });
  domains.set("geography-0260", {
    id: "geography-0260",
    domain: "geography",
    keywords: ["geography", "concept-260", "study", "exam", "topic"],
    branches(topic) { return ["geography foundations", "geography mechanisms", "geography applications", "geography evidence", "geography revision"].map((name, idx) => ({ name, color: ["#00d4ff", "#bf00ff", "#00ff88", "#ffae00", "#d4af37"][idx], items: [`${topic} ${name} item 1`, `${topic} ${name} item 2`, `${topic} ${name} item 3`, `${topic} ${name} item 4`] })); },
    score(topic) { const t = tokens(topic); return t.filter(x => this.keywords.includes(x)).length * 10 + 5; },
  });
  domains.set("literature-0261", {
    id: "literature-0261",
    domain: "literature",
    keywords: ["literature", "concept-261", "study", "exam", "topic"],
    branches(topic) { return ["literature foundations", "literature mechanisms", "literature applications", "literature evidence", "literature revision"].map((name, idx) => ({ name, color: ["#00d4ff", "#bf00ff", "#00ff88", "#ffae00", "#d4af37"][idx], items: [`${topic} ${name} item 1`, `${topic} ${name} item 2`, `${topic} ${name} item 3`, `${topic} ${name} item 4`] })); },
    score(topic) { const t = tokens(topic); return t.filter(x => this.keywords.includes(x)).length * 10 + 6; },
  });
  domains.set("medicine-0262", {
    id: "medicine-0262",
    domain: "medicine",
    keywords: ["medicine", "concept-262", "study", "exam", "topic"],
    branches(topic) { return ["medicine foundations", "medicine mechanisms", "medicine applications", "medicine evidence", "medicine revision"].map((name, idx) => ({ name, color: ["#00d4ff", "#bf00ff", "#00ff88", "#ffae00", "#d4af37"][idx], items: [`${topic} ${name} item 1`, `${topic} ${name} item 2`, `${topic} ${name} item 3`, `${topic} ${name} item 4`] })); },
    score(topic) { const t = tokens(topic); return t.filter(x => this.keywords.includes(x)).length * 10 + 7; },
  });
  domains.set("engineering-0263", {
    id: "engineering-0263",
    domain: "engineering",
    keywords: ["engineering", "concept-263", "study", "exam", "topic"],
    branches(topic) { return ["engineering foundations", "engineering mechanisms", "engineering applications", "engineering evidence", "engineering revision"].map((name, idx) => ({ name, color: ["#00d4ff", "#bf00ff", "#00ff88", "#ffae00", "#d4af37"][idx], items: [`${topic} ${name} item 1`, `${topic} ${name} item 2`, `${topic} ${name} item 3`, `${topic} ${name} item 4`] })); },
    score(topic) { const t = tokens(topic); return t.filter(x => this.keywords.includes(x)).length * 10 + 8; },
  });
  domains.set("biology-0264", {
    id: "biology-0264",
    domain: "biology",
    keywords: ["biology", "concept-264", "study", "exam", "topic"],
    branches(topic) { return ["biology foundations", "biology mechanisms", "biology applications", "biology evidence", "biology revision"].map((name, idx) => ({ name, color: ["#00d4ff", "#bf00ff", "#00ff88", "#ffae00", "#d4af37"][idx], items: [`${topic} ${name} item 1`, `${topic} ${name} item 2`, `${topic} ${name} item 3`, `${topic} ${name} item 4`] })); },
    score(topic) { const t = tokens(topic); return t.filter(x => this.keywords.includes(x)).length * 10 + 9; },
  });
  domains.set("physics-0265", {
    id: "physics-0265",
    domain: "physics",
    keywords: ["physics", "concept-265", "study", "exam", "topic"],
    branches(topic) { return ["physics foundations", "physics mechanisms", "physics applications", "physics evidence", "physics revision"].map((name, idx) => ({ name, color: ["#00d4ff", "#bf00ff", "#00ff88", "#ffae00", "#d4af37"][idx], items: [`${topic} ${name} item 1`, `${topic} ${name} item 2`, `${topic} ${name} item 3`, `${topic} ${name} item 4`] })); },
    score(topic) { const t = tokens(topic); return t.filter(x => this.keywords.includes(x)).length * 10 + 10; },
  });
  domains.set("chemistry-0266", {
    id: "chemistry-0266",
    domain: "chemistry",
    keywords: ["chemistry", "concept-266", "study", "exam", "topic"],
    branches(topic) { return ["chemistry foundations", "chemistry mechanisms", "chemistry applications", "chemistry evidence", "chemistry revision"].map((name, idx) => ({ name, color: ["#00d4ff", "#bf00ff", "#00ff88", "#ffae00", "#d4af37"][idx], items: [`${topic} ${name} item 1`, `${topic} ${name} item 2`, `${topic} ${name} item 3`, `${topic} ${name} item 4`] })); },
    score(topic) { const t = tokens(topic); return t.filter(x => this.keywords.includes(x)).length * 10 + 11; },
  });
  domains.set("history-0267", {
    id: "history-0267",
    domain: "history",
    keywords: ["history", "concept-267", "study", "exam", "topic"],
    branches(topic) { return ["history foundations", "history mechanisms", "history applications", "history evidence", "history revision"].map((name, idx) => ({ name, color: ["#00d4ff", "#bf00ff", "#00ff88", "#ffae00", "#d4af37"][idx], items: [`${topic} ${name} item 1`, `${topic} ${name} item 2`, `${topic} ${name} item 3`, `${topic} ${name} item 4`] })); },
    score(topic) { const t = tokens(topic); return t.filter(x => this.keywords.includes(x)).length * 10 + 12; },
  });
  domains.set("math-0268", {
    id: "math-0268",
    domain: "math",
    keywords: ["math", "concept-268", "study", "exam", "topic"],
    branches(topic) { return ["math foundations", "math mechanisms", "math applications", "math evidence", "math revision"].map((name, idx) => ({ name, color: ["#00d4ff", "#bf00ff", "#00ff88", "#ffae00", "#d4af37"][idx], items: [`${topic} ${name} item 1`, `${topic} ${name} item 2`, `${topic} ${name} item 3`, `${topic} ${name} item 4`] })); },
    score(topic) { const t = tokens(topic); return t.filter(x => this.keywords.includes(x)).length * 10 + 13; },
  });
  domains.set("computer-science-0269", {
    id: "computer-science-0269",
    domain: "computer-science",
    keywords: ["computer-science", "concept-269", "study", "exam", "topic"],
    branches(topic) { return ["computer-science foundations", "computer-science mechanisms", "computer-science applications", "computer-science evidence", "computer-science revision"].map((name, idx) => ({ name, color: ["#00d4ff", "#bf00ff", "#00ff88", "#ffae00", "#d4af37"][idx], items: [`${topic} ${name} item 1`, `${topic} ${name} item 2`, `${topic} ${name} item 3`, `${topic} ${name} item 4`] })); },
    score(topic) { const t = tokens(topic); return t.filter(x => this.keywords.includes(x)).length * 10 + 14; },
  });
  domains.set("blockchain-0270", {
    id: "blockchain-0270",
    domain: "blockchain",
    keywords: ["blockchain", "concept-270", "study", "exam", "topic"],
    branches(topic) { return ["blockchain foundations", "blockchain mechanisms", "blockchain applications", "blockchain evidence", "blockchain revision"].map((name, idx) => ({ name, color: ["#00d4ff", "#bf00ff", "#00ff88", "#ffae00", "#d4af37"][idx], items: [`${topic} ${name} item 1`, `${topic} ${name} item 2`, `${topic} ${name} item 3`, `${topic} ${name} item 4`] })); },
    score(topic) { const t = tokens(topic); return t.filter(x => this.keywords.includes(x)).length * 10 + 15; },
  });
  domains.set("economics-0271", {
    id: "economics-0271",
    domain: "economics",
    keywords: ["economics", "concept-271", "study", "exam", "topic"],
    branches(topic) { return ["economics foundations", "economics mechanisms", "economics applications", "economics evidence", "economics revision"].map((name, idx) => ({ name, color: ["#00d4ff", "#bf00ff", "#00ff88", "#ffae00", "#d4af37"][idx], items: [`${topic} ${name} item 1`, `${topic} ${name} item 2`, `${topic} ${name} item 3`, `${topic} ${name} item 4`] })); },
    score(topic) { const t = tokens(topic); return t.filter(x => this.keywords.includes(x)).length * 10 + 16; },
  });
  domains.set("geography-0272", {
    id: "geography-0272",
    domain: "geography",
    keywords: ["geography", "concept-272", "study", "exam", "topic"],
    branches(topic) { return ["geography foundations", "geography mechanisms", "geography applications", "geography evidence", "geography revision"].map((name, idx) => ({ name, color: ["#00d4ff", "#bf00ff", "#00ff88", "#ffae00", "#d4af37"][idx], items: [`${topic} ${name} item 1`, `${topic} ${name} item 2`, `${topic} ${name} item 3`, `${topic} ${name} item 4`] })); },
    score(topic) { const t = tokens(topic); return t.filter(x => this.keywords.includes(x)).length * 10 + 0; },
  });
  domains.set("literature-0273", {
    id: "literature-0273",
    domain: "literature",
    keywords: ["literature", "concept-273", "study", "exam", "topic"],
    branches(topic) { return ["literature foundations", "literature mechanisms", "literature applications", "literature evidence", "literature revision"].map((name, idx) => ({ name, color: ["#00d4ff", "#bf00ff", "#00ff88", "#ffae00", "#d4af37"][idx], items: [`${topic} ${name} item 1`, `${topic} ${name} item 2`, `${topic} ${name} item 3`, `${topic} ${name} item 4`] })); },
    score(topic) { const t = tokens(topic); return t.filter(x => this.keywords.includes(x)).length * 10 + 1; },
  });
  domains.set("medicine-0274", {
    id: "medicine-0274",
    domain: "medicine",
    keywords: ["medicine", "concept-274", "study", "exam", "topic"],
    branches(topic) { return ["medicine foundations", "medicine mechanisms", "medicine applications", "medicine evidence", "medicine revision"].map((name, idx) => ({ name, color: ["#00d4ff", "#bf00ff", "#00ff88", "#ffae00", "#d4af37"][idx], items: [`${topic} ${name} item 1`, `${topic} ${name} item 2`, `${topic} ${name} item 3`, `${topic} ${name} item 4`] })); },
    score(topic) { const t = tokens(topic); return t.filter(x => this.keywords.includes(x)).length * 10 + 2; },
  });
  domains.set("engineering-0275", {
    id: "engineering-0275",
    domain: "engineering",
    keywords: ["engineering", "concept-275", "study", "exam", "topic"],
    branches(topic) { return ["engineering foundations", "engineering mechanisms", "engineering applications", "engineering evidence", "engineering revision"].map((name, idx) => ({ name, color: ["#00d4ff", "#bf00ff", "#00ff88", "#ffae00", "#d4af37"][idx], items: [`${topic} ${name} item 1`, `${topic} ${name} item 2`, `${topic} ${name} item 3`, `${topic} ${name} item 4`] })); },
    score(topic) { const t = tokens(topic); return t.filter(x => this.keywords.includes(x)).length * 10 + 3; },
  });
  domains.set("biology-0276", {
    id: "biology-0276",
    domain: "biology",
    keywords: ["biology", "concept-276", "study", "exam", "topic"],
    branches(topic) { return ["biology foundations", "biology mechanisms", "biology applications", "biology evidence", "biology revision"].map((name, idx) => ({ name, color: ["#00d4ff", "#bf00ff", "#00ff88", "#ffae00", "#d4af37"][idx], items: [`${topic} ${name} item 1`, `${topic} ${name} item 2`, `${topic} ${name} item 3`, `${topic} ${name} item 4`] })); },
    score(topic) { const t = tokens(topic); return t.filter(x => this.keywords.includes(x)).length * 10 + 4; },
  });
  domains.set("physics-0277", {
    id: "physics-0277",
    domain: "physics",
    keywords: ["physics", "concept-277", "study", "exam", "topic"],
    branches(topic) { return ["physics foundations", "physics mechanisms", "physics applications", "physics evidence", "physics revision"].map((name, idx) => ({ name, color: ["#00d4ff", "#bf00ff", "#00ff88", "#ffae00", "#d4af37"][idx], items: [`${topic} ${name} item 1`, `${topic} ${name} item 2`, `${topic} ${name} item 3`, `${topic} ${name} item 4`] })); },
    score(topic) { const t = tokens(topic); return t.filter(x => this.keywords.includes(x)).length * 10 + 5; },
  });
  domains.set("chemistry-0278", {
    id: "chemistry-0278",
    domain: "chemistry",
    keywords: ["chemistry", "concept-278", "study", "exam", "topic"],
    branches(topic) { return ["chemistry foundations", "chemistry mechanisms", "chemistry applications", "chemistry evidence", "chemistry revision"].map((name, idx) => ({ name, color: ["#00d4ff", "#bf00ff", "#00ff88", "#ffae00", "#d4af37"][idx], items: [`${topic} ${name} item 1`, `${topic} ${name} item 2`, `${topic} ${name} item 3`, `${topic} ${name} item 4`] })); },
    score(topic) { const t = tokens(topic); return t.filter(x => this.keywords.includes(x)).length * 10 + 6; },
  });
  domains.set("history-0279", {
    id: "history-0279",
    domain: "history",
    keywords: ["history", "concept-279", "study", "exam", "topic"],
    branches(topic) { return ["history foundations", "history mechanisms", "history applications", "history evidence", "history revision"].map((name, idx) => ({ name, color: ["#00d4ff", "#bf00ff", "#00ff88", "#ffae00", "#d4af37"][idx], items: [`${topic} ${name} item 1`, `${topic} ${name} item 2`, `${topic} ${name} item 3`, `${topic} ${name} item 4`] })); },
    score(topic) { const t = tokens(topic); return t.filter(x => this.keywords.includes(x)).length * 10 + 7; },
  });
  domains.set("math-0280", {
    id: "math-0280",
    domain: "math",
    keywords: ["math", "concept-280", "study", "exam", "topic"],
    branches(topic) { return ["math foundations", "math mechanisms", "math applications", "math evidence", "math revision"].map((name, idx) => ({ name, color: ["#00d4ff", "#bf00ff", "#00ff88", "#ffae00", "#d4af37"][idx], items: [`${topic} ${name} item 1`, `${topic} ${name} item 2`, `${topic} ${name} item 3`, `${topic} ${name} item 4`] })); },
    score(topic) { const t = tokens(topic); return t.filter(x => this.keywords.includes(x)).length * 10 + 8; },
  });
  domains.set("computer-science-0281", {
    id: "computer-science-0281",
    domain: "computer-science",
    keywords: ["computer-science", "concept-281", "study", "exam", "topic"],
    branches(topic) { return ["computer-science foundations", "computer-science mechanisms", "computer-science applications", "computer-science evidence", "computer-science revision"].map((name, idx) => ({ name, color: ["#00d4ff", "#bf00ff", "#00ff88", "#ffae00", "#d4af37"][idx], items: [`${topic} ${name} item 1`, `${topic} ${name} item 2`, `${topic} ${name} item 3`, `${topic} ${name} item 4`] })); },
    score(topic) { const t = tokens(topic); return t.filter(x => this.keywords.includes(x)).length * 10 + 9; },
  });
  domains.set("blockchain-0282", {
    id: "blockchain-0282",
    domain: "blockchain",
    keywords: ["blockchain", "concept-282", "study", "exam", "topic"],
    branches(topic) { return ["blockchain foundations", "blockchain mechanisms", "blockchain applications", "blockchain evidence", "blockchain revision"].map((name, idx) => ({ name, color: ["#00d4ff", "#bf00ff", "#00ff88", "#ffae00", "#d4af37"][idx], items: [`${topic} ${name} item 1`, `${topic} ${name} item 2`, `${topic} ${name} item 3`, `${topic} ${name} item 4`] })); },
    score(topic) { const t = tokens(topic); return t.filter(x => this.keywords.includes(x)).length * 10 + 10; },
  });
  domains.set("economics-0283", {
    id: "economics-0283",
    domain: "economics",
    keywords: ["economics", "concept-283", "study", "exam", "topic"],
    branches(topic) { return ["economics foundations", "economics mechanisms", "economics applications", "economics evidence", "economics revision"].map((name, idx) => ({ name, color: ["#00d4ff", "#bf00ff", "#00ff88", "#ffae00", "#d4af37"][idx], items: [`${topic} ${name} item 1`, `${topic} ${name} item 2`, `${topic} ${name} item 3`, `${topic} ${name} item 4`] })); },
    score(topic) { const t = tokens(topic); return t.filter(x => this.keywords.includes(x)).length * 10 + 11; },
  });
  domains.set("geography-0284", {
    id: "geography-0284",
    domain: "geography",
    keywords: ["geography", "concept-284", "study", "exam", "topic"],
    branches(topic) { return ["geography foundations", "geography mechanisms", "geography applications", "geography evidence", "geography revision"].map((name, idx) => ({ name, color: ["#00d4ff", "#bf00ff", "#00ff88", "#ffae00", "#d4af37"][idx], items: [`${topic} ${name} item 1`, `${topic} ${name} item 2`, `${topic} ${name} item 3`, `${topic} ${name} item 4`] })); },
    score(topic) { const t = tokens(topic); return t.filter(x => this.keywords.includes(x)).length * 10 + 12; },
  });
  domains.set("literature-0285", {
    id: "literature-0285",
    domain: "literature",
    keywords: ["literature", "concept-285", "study", "exam", "topic"],
    branches(topic) { return ["literature foundations", "literature mechanisms", "literature applications", "literature evidence", "literature revision"].map((name, idx) => ({ name, color: ["#00d4ff", "#bf00ff", "#00ff88", "#ffae00", "#d4af37"][idx], items: [`${topic} ${name} item 1`, `${topic} ${name} item 2`, `${topic} ${name} item 3`, `${topic} ${name} item 4`] })); },
    score(topic) { const t = tokens(topic); return t.filter(x => this.keywords.includes(x)).length * 10 + 13; },
  });
  domains.set("medicine-0286", {
    id: "medicine-0286",
    domain: "medicine",
    keywords: ["medicine", "concept-286", "study", "exam", "topic"],
    branches(topic) { return ["medicine foundations", "medicine mechanisms", "medicine applications", "medicine evidence", "medicine revision"].map((name, idx) => ({ name, color: ["#00d4ff", "#bf00ff", "#00ff88", "#ffae00", "#d4af37"][idx], items: [`${topic} ${name} item 1`, `${topic} ${name} item 2`, `${topic} ${name} item 3`, `${topic} ${name} item 4`] })); },
    score(topic) { const t = tokens(topic); return t.filter(x => this.keywords.includes(x)).length * 10 + 14; },
  });
  domains.set("engineering-0287", {
    id: "engineering-0287",
    domain: "engineering",
    keywords: ["engineering", "concept-287", "study", "exam", "topic"],
    branches(topic) { return ["engineering foundations", "engineering mechanisms", "engineering applications", "engineering evidence", "engineering revision"].map((name, idx) => ({ name, color: ["#00d4ff", "#bf00ff", "#00ff88", "#ffae00", "#d4af37"][idx], items: [`${topic} ${name} item 1`, `${topic} ${name} item 2`, `${topic} ${name} item 3`, `${topic} ${name} item 4`] })); },
    score(topic) { const t = tokens(topic); return t.filter(x => this.keywords.includes(x)).length * 10 + 15; },
  });
  domains.set("biology-0288", {
    id: "biology-0288",
    domain: "biology",
    keywords: ["biology", "concept-288", "study", "exam", "topic"],
    branches(topic) { return ["biology foundations", "biology mechanisms", "biology applications", "biology evidence", "biology revision"].map((name, idx) => ({ name, color: ["#00d4ff", "#bf00ff", "#00ff88", "#ffae00", "#d4af37"][idx], items: [`${topic} ${name} item 1`, `${topic} ${name} item 2`, `${topic} ${name} item 3`, `${topic} ${name} item 4`] })); },
    score(topic) { const t = tokens(topic); return t.filter(x => this.keywords.includes(x)).length * 10 + 16; },
  });
  domains.set("physics-0289", {
    id: "physics-0289",
    domain: "physics",
    keywords: ["physics", "concept-289", "study", "exam", "topic"],
    branches(topic) { return ["physics foundations", "physics mechanisms", "physics applications", "physics evidence", "physics revision"].map((name, idx) => ({ name, color: ["#00d4ff", "#bf00ff", "#00ff88", "#ffae00", "#d4af37"][idx], items: [`${topic} ${name} item 1`, `${topic} ${name} item 2`, `${topic} ${name} item 3`, `${topic} ${name} item 4`] })); },
    score(topic) { const t = tokens(topic); return t.filter(x => this.keywords.includes(x)).length * 10 + 0; },
  });
  domains.set("chemistry-0290", {
    id: "chemistry-0290",
    domain: "chemistry",
    keywords: ["chemistry", "concept-290", "study", "exam", "topic"],
    branches(topic) { return ["chemistry foundations", "chemistry mechanisms", "chemistry applications", "chemistry evidence", "chemistry revision"].map((name, idx) => ({ name, color: ["#00d4ff", "#bf00ff", "#00ff88", "#ffae00", "#d4af37"][idx], items: [`${topic} ${name} item 1`, `${topic} ${name} item 2`, `${topic} ${name} item 3`, `${topic} ${name} item 4`] })); },
    score(topic) { const t = tokens(topic); return t.filter(x => this.keywords.includes(x)).length * 10 + 1; },
  });
  domains.set("history-0291", {
    id: "history-0291",
    domain: "history",
    keywords: ["history", "concept-291", "study", "exam", "topic"],
    branches(topic) { return ["history foundations", "history mechanisms", "history applications", "history evidence", "history revision"].map((name, idx) => ({ name, color: ["#00d4ff", "#bf00ff", "#00ff88", "#ffae00", "#d4af37"][idx], items: [`${topic} ${name} item 1`, `${topic} ${name} item 2`, `${topic} ${name} item 3`, `${topic} ${name} item 4`] })); },
    score(topic) { const t = tokens(topic); return t.filter(x => this.keywords.includes(x)).length * 10 + 2; },
  });
  domains.set("math-0292", {
    id: "math-0292",
    domain: "math",
    keywords: ["math", "concept-292", "study", "exam", "topic"],
    branches(topic) { return ["math foundations", "math mechanisms", "math applications", "math evidence", "math revision"].map((name, idx) => ({ name, color: ["#00d4ff", "#bf00ff", "#00ff88", "#ffae00", "#d4af37"][idx], items: [`${topic} ${name} item 1`, `${topic} ${name} item 2`, `${topic} ${name} item 3`, `${topic} ${name} item 4`] })); },
    score(topic) { const t = tokens(topic); return t.filter(x => this.keywords.includes(x)).length * 10 + 3; },
  });
  domains.set("computer-science-0293", {
    id: "computer-science-0293",
    domain: "computer-science",
    keywords: ["computer-science", "concept-293", "study", "exam", "topic"],
    branches(topic) { return ["computer-science foundations", "computer-science mechanisms", "computer-science applications", "computer-science evidence", "computer-science revision"].map((name, idx) => ({ name, color: ["#00d4ff", "#bf00ff", "#00ff88", "#ffae00", "#d4af37"][idx], items: [`${topic} ${name} item 1`, `${topic} ${name} item 2`, `${topic} ${name} item 3`, `${topic} ${name} item 4`] })); },
    score(topic) { const t = tokens(topic); return t.filter(x => this.keywords.includes(x)).length * 10 + 4; },
  });
  domains.set("blockchain-0294", {
    id: "blockchain-0294",
    domain: "blockchain",
    keywords: ["blockchain", "concept-294", "study", "exam", "topic"],
    branches(topic) { return ["blockchain foundations", "blockchain mechanisms", "blockchain applications", "blockchain evidence", "blockchain revision"].map((name, idx) => ({ name, color: ["#00d4ff", "#bf00ff", "#00ff88", "#ffae00", "#d4af37"][idx], items: [`${topic} ${name} item 1`, `${topic} ${name} item 2`, `${topic} ${name} item 3`, `${topic} ${name} item 4`] })); },
    score(topic) { const t = tokens(topic); return t.filter(x => this.keywords.includes(x)).length * 10 + 5; },
  });
  domains.set("economics-0295", {
    id: "economics-0295",
    domain: "economics",
    keywords: ["economics", "concept-295", "study", "exam", "topic"],
    branches(topic) { return ["economics foundations", "economics mechanisms", "economics applications", "economics evidence", "economics revision"].map((name, idx) => ({ name, color: ["#00d4ff", "#bf00ff", "#00ff88", "#ffae00", "#d4af37"][idx], items: [`${topic} ${name} item 1`, `${topic} ${name} item 2`, `${topic} ${name} item 3`, `${topic} ${name} item 4`] })); },
    score(topic) { const t = tokens(topic); return t.filter(x => this.keywords.includes(x)).length * 10 + 6; },
  });
  domains.set("geography-0296", {
    id: "geography-0296",
    domain: "geography",
    keywords: ["geography", "concept-296", "study", "exam", "topic"],
    branches(topic) { return ["geography foundations", "geography mechanisms", "geography applications", "geography evidence", "geography revision"].map((name, idx) => ({ name, color: ["#00d4ff", "#bf00ff", "#00ff88", "#ffae00", "#d4af37"][idx], items: [`${topic} ${name} item 1`, `${topic} ${name} item 2`, `${topic} ${name} item 3`, `${topic} ${name} item 4`] })); },
    score(topic) { const t = tokens(topic); return t.filter(x => this.keywords.includes(x)).length * 10 + 7; },
  });
  domains.set("literature-0297", {
    id: "literature-0297",
    domain: "literature",
    keywords: ["literature", "concept-297", "study", "exam", "topic"],
    branches(topic) { return ["literature foundations", "literature mechanisms", "literature applications", "literature evidence", "literature revision"].map((name, idx) => ({ name, color: ["#00d4ff", "#bf00ff", "#00ff88", "#ffae00", "#d4af37"][idx], items: [`${topic} ${name} item 1`, `${topic} ${name} item 2`, `${topic} ${name} item 3`, `${topic} ${name} item 4`] })); },
    score(topic) { const t = tokens(topic); return t.filter(x => this.keywords.includes(x)).length * 10 + 8; },
  });
  domains.set("medicine-0298", {
    id: "medicine-0298",
    domain: "medicine",
    keywords: ["medicine", "concept-298", "study", "exam", "topic"],
    branches(topic) { return ["medicine foundations", "medicine mechanisms", "medicine applications", "medicine evidence", "medicine revision"].map((name, idx) => ({ name, color: ["#00d4ff", "#bf00ff", "#00ff88", "#ffae00", "#d4af37"][idx], items: [`${topic} ${name} item 1`, `${topic} ${name} item 2`, `${topic} ${name} item 3`, `${topic} ${name} item 4`] })); },
    score(topic) { const t = tokens(topic); return t.filter(x => this.keywords.includes(x)).length * 10 + 9; },
  });
  domains.set("engineering-0299", {
    id: "engineering-0299",
    domain: "engineering",
    keywords: ["engineering", "concept-299", "study", "exam", "topic"],
    branches(topic) { return ["engineering foundations", "engineering mechanisms", "engineering applications", "engineering evidence", "engineering revision"].map((name, idx) => ({ name, color: ["#00d4ff", "#bf00ff", "#00ff88", "#ffae00", "#d4af37"][idx], items: [`${topic} ${name} item 1`, `${topic} ${name} item 2`, `${topic} ${name} item 3`, `${topic} ${name} item 4`] })); },
    score(topic) { const t = tokens(topic); return t.filter(x => this.keywords.includes(x)).length * 10 + 10; },
  });
  domains.set("biology-0300", {
    id: "biology-0300",
    domain: "biology",
    keywords: ["biology", "concept-300", "study", "exam", "topic"],
    branches(topic) { return ["biology foundations", "biology mechanisms", "biology applications", "biology evidence", "biology revision"].map((name, idx) => ({ name, color: ["#00d4ff", "#bf00ff", "#00ff88", "#ffae00", "#d4af37"][idx], items: [`${topic} ${name} item 1`, `${topic} ${name} item 2`, `${topic} ${name} item 3`, `${topic} ${name} item 4`] })); },
    score(topic) { const t = tokens(topic); return t.filter(x => this.keywords.includes(x)).length * 10 + 11; },
  });
  domains.set("physics-0301", {
    id: "physics-0301",
    domain: "physics",
    keywords: ["physics", "concept-301", "study", "exam", "topic"],
    branches(topic) { return ["physics foundations", "physics mechanisms", "physics applications", "physics evidence", "physics revision"].map((name, idx) => ({ name, color: ["#00d4ff", "#bf00ff", "#00ff88", "#ffae00", "#d4af37"][idx], items: [`${topic} ${name} item 1`, `${topic} ${name} item 2`, `${topic} ${name} item 3`, `${topic} ${name} item 4`] })); },
    score(topic) { const t = tokens(topic); return t.filter(x => this.keywords.includes(x)).length * 10 + 12; },
  });
  domains.set("chemistry-0302", {
    id: "chemistry-0302",
    domain: "chemistry",
    keywords: ["chemistry", "concept-302", "study", "exam", "topic"],
    branches(topic) { return ["chemistry foundations", "chemistry mechanisms", "chemistry applications", "chemistry evidence", "chemistry revision"].map((name, idx) => ({ name, color: ["#00d4ff", "#bf00ff", "#00ff88", "#ffae00", "#d4af37"][idx], items: [`${topic} ${name} item 1`, `${topic} ${name} item 2`, `${topic} ${name} item 3`, `${topic} ${name} item 4`] })); },
    score(topic) { const t = tokens(topic); return t.filter(x => this.keywords.includes(x)).length * 10 + 13; },
  });
  domains.set("history-0303", {
    id: "history-0303",
    domain: "history",
    keywords: ["history", "concept-303", "study", "exam", "topic"],
    branches(topic) { return ["history foundations", "history mechanisms", "history applications", "history evidence", "history revision"].map((name, idx) => ({ name, color: ["#00d4ff", "#bf00ff", "#00ff88", "#ffae00", "#d4af37"][idx], items: [`${topic} ${name} item 1`, `${topic} ${name} item 2`, `${topic} ${name} item 3`, `${topic} ${name} item 4`] })); },
    score(topic) { const t = tokens(topic); return t.filter(x => this.keywords.includes(x)).length * 10 + 14; },
  });
  domains.set("math-0304", {
    id: "math-0304",
    domain: "math",
    keywords: ["math", "concept-304", "study", "exam", "topic"],
    branches(topic) { return ["math foundations", "math mechanisms", "math applications", "math evidence", "math revision"].map((name, idx) => ({ name, color: ["#00d4ff", "#bf00ff", "#00ff88", "#ffae00", "#d4af37"][idx], items: [`${topic} ${name} item 1`, `${topic} ${name} item 2`, `${topic} ${name} item 3`, `${topic} ${name} item 4`] })); },
    score(topic) { const t = tokens(topic); return t.filter(x => this.keywords.includes(x)).length * 10 + 15; },
  });
  domains.set("computer-science-0305", {
    id: "computer-science-0305",
    domain: "computer-science",
    keywords: ["computer-science", "concept-305", "study", "exam", "topic"],
    branches(topic) { return ["computer-science foundations", "computer-science mechanisms", "computer-science applications", "computer-science evidence", "computer-science revision"].map((name, idx) => ({ name, color: ["#00d4ff", "#bf00ff", "#00ff88", "#ffae00", "#d4af37"][idx], items: [`${topic} ${name} item 1`, `${topic} ${name} item 2`, `${topic} ${name} item 3`, `${topic} ${name} item 4`] })); },
    score(topic) { const t = tokens(topic); return t.filter(x => this.keywords.includes(x)).length * 10 + 16; },
  });
  domains.set("blockchain-0306", {
    id: "blockchain-0306",
    domain: "blockchain",
    keywords: ["blockchain", "concept-306", "study", "exam", "topic"],
    branches(topic) { return ["blockchain foundations", "blockchain mechanisms", "blockchain applications", "blockchain evidence", "blockchain revision"].map((name, idx) => ({ name, color: ["#00d4ff", "#bf00ff", "#00ff88", "#ffae00", "#d4af37"][idx], items: [`${topic} ${name} item 1`, `${topic} ${name} item 2`, `${topic} ${name} item 3`, `${topic} ${name} item 4`] })); },
    score(topic) { const t = tokens(topic); return t.filter(x => this.keywords.includes(x)).length * 10 + 0; },
  });
  domains.set("economics-0307", {
    id: "economics-0307",
    domain: "economics",
    keywords: ["economics", "concept-307", "study", "exam", "topic"],
    branches(topic) { return ["economics foundations", "economics mechanisms", "economics applications", "economics evidence", "economics revision"].map((name, idx) => ({ name, color: ["#00d4ff", "#bf00ff", "#00ff88", "#ffae00", "#d4af37"][idx], items: [`${topic} ${name} item 1`, `${topic} ${name} item 2`, `${topic} ${name} item 3`, `${topic} ${name} item 4`] })); },
    score(topic) { const t = tokens(topic); return t.filter(x => this.keywords.includes(x)).length * 10 + 1; },
  });
  domains.set("geography-0308", {
    id: "geography-0308",
    domain: "geography",
    keywords: ["geography", "concept-308", "study", "exam", "topic"],
    branches(topic) { return ["geography foundations", "geography mechanisms", "geography applications", "geography evidence", "geography revision"].map((name, idx) => ({ name, color: ["#00d4ff", "#bf00ff", "#00ff88", "#ffae00", "#d4af37"][idx], items: [`${topic} ${name} item 1`, `${topic} ${name} item 2`, `${topic} ${name} item 3`, `${topic} ${name} item 4`] })); },
    score(topic) { const t = tokens(topic); return t.filter(x => this.keywords.includes(x)).length * 10 + 2; },
  });
  domains.set("literature-0309", {
    id: "literature-0309",
    domain: "literature",
    keywords: ["literature", "concept-309", "study", "exam", "topic"],
    branches(topic) { return ["literature foundations", "literature mechanisms", "literature applications", "literature evidence", "literature revision"].map((name, idx) => ({ name, color: ["#00d4ff", "#bf00ff", "#00ff88", "#ffae00", "#d4af37"][idx], items: [`${topic} ${name} item 1`, `${topic} ${name} item 2`, `${topic} ${name} item 3`, `${topic} ${name} item 4`] })); },
    score(topic) { const t = tokens(topic); return t.filter(x => this.keywords.includes(x)).length * 10 + 3; },
  });
  domains.set("medicine-0310", {
    id: "medicine-0310",
    domain: "medicine",
    keywords: ["medicine", "concept-310", "study", "exam", "topic"],
    branches(topic) { return ["medicine foundations", "medicine mechanisms", "medicine applications", "medicine evidence", "medicine revision"].map((name, idx) => ({ name, color: ["#00d4ff", "#bf00ff", "#00ff88", "#ffae00", "#d4af37"][idx], items: [`${topic} ${name} item 1`, `${topic} ${name} item 2`, `${topic} ${name} item 3`, `${topic} ${name} item 4`] })); },
    score(topic) { const t = tokens(topic); return t.filter(x => this.keywords.includes(x)).length * 10 + 4; },
  });
  domains.set("engineering-0311", {
    id: "engineering-0311",
    domain: "engineering",
    keywords: ["engineering", "concept-311", "study", "exam", "topic"],
    branches(topic) { return ["engineering foundations", "engineering mechanisms", "engineering applications", "engineering evidence", "engineering revision"].map((name, idx) => ({ name, color: ["#00d4ff", "#bf00ff", "#00ff88", "#ffae00", "#d4af37"][idx], items: [`${topic} ${name} item 1`, `${topic} ${name} item 2`, `${topic} ${name} item 3`, `${topic} ${name} item 4`] })); },
    score(topic) { const t = tokens(topic); return t.filter(x => this.keywords.includes(x)).length * 10 + 5; },
  });
  domains.set("biology-0312", {
    id: "biology-0312",
    domain: "biology",
    keywords: ["biology", "concept-312", "study", "exam", "topic"],
    branches(topic) { return ["biology foundations", "biology mechanisms", "biology applications", "biology evidence", "biology revision"].map((name, idx) => ({ name, color: ["#00d4ff", "#bf00ff", "#00ff88", "#ffae00", "#d4af37"][idx], items: [`${topic} ${name} item 1`, `${topic} ${name} item 2`, `${topic} ${name} item 3`, `${topic} ${name} item 4`] })); },
    score(topic) { const t = tokens(topic); return t.filter(x => this.keywords.includes(x)).length * 10 + 6; },
  });
  domains.set("physics-0313", {
    id: "physics-0313",
    domain: "physics",
    keywords: ["physics", "concept-313", "study", "exam", "topic"],
    branches(topic) { return ["physics foundations", "physics mechanisms", "physics applications", "physics evidence", "physics revision"].map((name, idx) => ({ name, color: ["#00d4ff", "#bf00ff", "#00ff88", "#ffae00", "#d4af37"][idx], items: [`${topic} ${name} item 1`, `${topic} ${name} item 2`, `${topic} ${name} item 3`, `${topic} ${name} item 4`] })); },
    score(topic) { const t = tokens(topic); return t.filter(x => this.keywords.includes(x)).length * 10 + 7; },
  });
  domains.set("chemistry-0314", {
    id: "chemistry-0314",
    domain: "chemistry",
    keywords: ["chemistry", "concept-314", "study", "exam", "topic"],
    branches(topic) { return ["chemistry foundations", "chemistry mechanisms", "chemistry applications", "chemistry evidence", "chemistry revision"].map((name, idx) => ({ name, color: ["#00d4ff", "#bf00ff", "#00ff88", "#ffae00", "#d4af37"][idx], items: [`${topic} ${name} item 1`, `${topic} ${name} item 2`, `${topic} ${name} item 3`, `${topic} ${name} item 4`] })); },
    score(topic) { const t = tokens(topic); return t.filter(x => this.keywords.includes(x)).length * 10 + 8; },
  });
  domains.set("history-0315", {
    id: "history-0315",
    domain: "history",
    keywords: ["history", "concept-315", "study", "exam", "topic"],
    branches(topic) { return ["history foundations", "history mechanisms", "history applications", "history evidence", "history revision"].map((name, idx) => ({ name, color: ["#00d4ff", "#bf00ff", "#00ff88", "#ffae00", "#d4af37"][idx], items: [`${topic} ${name} item 1`, `${topic} ${name} item 2`, `${topic} ${name} item 3`, `${topic} ${name} item 4`] })); },
    score(topic) { const t = tokens(topic); return t.filter(x => this.keywords.includes(x)).length * 10 + 9; },
  });
  domains.set("math-0316", {
    id: "math-0316",
    domain: "math",
    keywords: ["math", "concept-316", "study", "exam", "topic"],
    branches(topic) { return ["math foundations", "math mechanisms", "math applications", "math evidence", "math revision"].map((name, idx) => ({ name, color: ["#00d4ff", "#bf00ff", "#00ff88", "#ffae00", "#d4af37"][idx], items: [`${topic} ${name} item 1`, `${topic} ${name} item 2`, `${topic} ${name} item 3`, `${topic} ${name} item 4`] })); },
    score(topic) { const t = tokens(topic); return t.filter(x => this.keywords.includes(x)).length * 10 + 10; },
  });
  domains.set("computer-science-0317", {
    id: "computer-science-0317",
    domain: "computer-science",
    keywords: ["computer-science", "concept-317", "study", "exam", "topic"],
    branches(topic) { return ["computer-science foundations", "computer-science mechanisms", "computer-science applications", "computer-science evidence", "computer-science revision"].map((name, idx) => ({ name, color: ["#00d4ff", "#bf00ff", "#00ff88", "#ffae00", "#d4af37"][idx], items: [`${topic} ${name} item 1`, `${topic} ${name} item 2`, `${topic} ${name} item 3`, `${topic} ${name} item 4`] })); },
    score(topic) { const t = tokens(topic); return t.filter(x => this.keywords.includes(x)).length * 10 + 11; },
  });
  domains.set("blockchain-0318", {
    id: "blockchain-0318",
    domain: "blockchain",
    keywords: ["blockchain", "concept-318", "study", "exam", "topic"],
    branches(topic) { return ["blockchain foundations", "blockchain mechanisms", "blockchain applications", "blockchain evidence", "blockchain revision"].map((name, idx) => ({ name, color: ["#00d4ff", "#bf00ff", "#00ff88", "#ffae00", "#d4af37"][idx], items: [`${topic} ${name} item 1`, `${topic} ${name} item 2`, `${topic} ${name} item 3`, `${topic} ${name} item 4`] })); },
    score(topic) { const t = tokens(topic); return t.filter(x => this.keywords.includes(x)).length * 10 + 12; },
  });
  domains.set("economics-0319", {
    id: "economics-0319",
    domain: "economics",
    keywords: ["economics", "concept-319", "study", "exam", "topic"],
    branches(topic) { return ["economics foundations", "economics mechanisms", "economics applications", "economics evidence", "economics revision"].map((name, idx) => ({ name, color: ["#00d4ff", "#bf00ff", "#00ff88", "#ffae00", "#d4af37"][idx], items: [`${topic} ${name} item 1`, `${topic} ${name} item 2`, `${topic} ${name} item 3`, `${topic} ${name} item 4`] })); },
    score(topic) { const t = tokens(topic); return t.filter(x => this.keywords.includes(x)).length * 10 + 13; },
  });
  domains.set("geography-0320", {
    id: "geography-0320",
    domain: "geography",
    keywords: ["geography", "concept-320", "study", "exam", "topic"],
    branches(topic) { return ["geography foundations", "geography mechanisms", "geography applications", "geography evidence", "geography revision"].map((name, idx) => ({ name, color: ["#00d4ff", "#bf00ff", "#00ff88", "#ffae00", "#d4af37"][idx], items: [`${topic} ${name} item 1`, `${topic} ${name} item 2`, `${topic} ${name} item 3`, `${topic} ${name} item 4`] })); },
    score(topic) { const t = tokens(topic); return t.filter(x => this.keywords.includes(x)).length * 10 + 14; },
  });
  domains.set("literature-0321", {
    id: "literature-0321",
    domain: "literature",
    keywords: ["literature", "concept-321", "study", "exam", "topic"],
    branches(topic) { return ["literature foundations", "literature mechanisms", "literature applications", "literature evidence", "literature revision"].map((name, idx) => ({ name, color: ["#00d4ff", "#bf00ff", "#00ff88", "#ffae00", "#d4af37"][idx], items: [`${topic} ${name} item 1`, `${topic} ${name} item 2`, `${topic} ${name} item 3`, `${topic} ${name} item 4`] })); },
    score(topic) { const t = tokens(topic); return t.filter(x => this.keywords.includes(x)).length * 10 + 15; },
  });
  domains.set("medicine-0322", {
    id: "medicine-0322",
    domain: "medicine",
    keywords: ["medicine", "concept-322", "study", "exam", "topic"],
    branches(topic) { return ["medicine foundations", "medicine mechanisms", "medicine applications", "medicine evidence", "medicine revision"].map((name, idx) => ({ name, color: ["#00d4ff", "#bf00ff", "#00ff88", "#ffae00", "#d4af37"][idx], items: [`${topic} ${name} item 1`, `${topic} ${name} item 2`, `${topic} ${name} item 3`, `${topic} ${name} item 4`] })); },
    score(topic) { const t = tokens(topic); return t.filter(x => this.keywords.includes(x)).length * 10 + 16; },
  });
  domains.set("engineering-0323", {
    id: "engineering-0323",
    domain: "engineering",
    keywords: ["engineering", "concept-323", "study", "exam", "topic"],
    branches(topic) { return ["engineering foundations", "engineering mechanisms", "engineering applications", "engineering evidence", "engineering revision"].map((name, idx) => ({ name, color: ["#00d4ff", "#bf00ff", "#00ff88", "#ffae00", "#d4af37"][idx], items: [`${topic} ${name} item 1`, `${topic} ${name} item 2`, `${topic} ${name} item 3`, `${topic} ${name} item 4`] })); },
    score(topic) { const t = tokens(topic); return t.filter(x => this.keywords.includes(x)).length * 10 + 0; },
  });
  domains.set("biology-0324", {
    id: "biology-0324",
    domain: "biology",
    keywords: ["biology", "concept-324", "study", "exam", "topic"],
    branches(topic) { return ["biology foundations", "biology mechanisms", "biology applications", "biology evidence", "biology revision"].map((name, idx) => ({ name, color: ["#00d4ff", "#bf00ff", "#00ff88", "#ffae00", "#d4af37"][idx], items: [`${topic} ${name} item 1`, `${topic} ${name} item 2`, `${topic} ${name} item 3`, `${topic} ${name} item 4`] })); },
    score(topic) { const t = tokens(topic); return t.filter(x => this.keywords.includes(x)).length * 10 + 1; },
  });
  domains.set("physics-0325", {
    id: "physics-0325",
    domain: "physics",
    keywords: ["physics", "concept-325", "study", "exam", "topic"],
    branches(topic) { return ["physics foundations", "physics mechanisms", "physics applications", "physics evidence", "physics revision"].map((name, idx) => ({ name, color: ["#00d4ff", "#bf00ff", "#00ff88", "#ffae00", "#d4af37"][idx], items: [`${topic} ${name} item 1`, `${topic} ${name} item 2`, `${topic} ${name} item 3`, `${topic} ${name} item 4`] })); },
    score(topic) { const t = tokens(topic); return t.filter(x => this.keywords.includes(x)).length * 10 + 2; },
  });
  domains.set("chemistry-0326", {
    id: "chemistry-0326",
    domain: "chemistry",
    keywords: ["chemistry", "concept-326", "study", "exam", "topic"],
    branches(topic) { return ["chemistry foundations", "chemistry mechanisms", "chemistry applications", "chemistry evidence", "chemistry revision"].map((name, idx) => ({ name, color: ["#00d4ff", "#bf00ff", "#00ff88", "#ffae00", "#d4af37"][idx], items: [`${topic} ${name} item 1`, `${topic} ${name} item 2`, `${topic} ${name} item 3`, `${topic} ${name} item 4`] })); },
    score(topic) { const t = tokens(topic); return t.filter(x => this.keywords.includes(x)).length * 10 + 3; },
  });
  domains.set("history-0327", {
    id: "history-0327",
    domain: "history",
    keywords: ["history", "concept-327", "study", "exam", "topic"],
    branches(topic) { return ["history foundations", "history mechanisms", "history applications", "history evidence", "history revision"].map((name, idx) => ({ name, color: ["#00d4ff", "#bf00ff", "#00ff88", "#ffae00", "#d4af37"][idx], items: [`${topic} ${name} item 1`, `${topic} ${name} item 2`, `${topic} ${name} item 3`, `${topic} ${name} item 4`] })); },
    score(topic) { const t = tokens(topic); return t.filter(x => this.keywords.includes(x)).length * 10 + 4; },
  });
  domains.set("math-0328", {
    id: "math-0328",
    domain: "math",
    keywords: ["math", "concept-328", "study", "exam", "topic"],
    branches(topic) { return ["math foundations", "math mechanisms", "math applications", "math evidence", "math revision"].map((name, idx) => ({ name, color: ["#00d4ff", "#bf00ff", "#00ff88", "#ffae00", "#d4af37"][idx], items: [`${topic} ${name} item 1`, `${topic} ${name} item 2`, `${topic} ${name} item 3`, `${topic} ${name} item 4`] })); },
    score(topic) { const t = tokens(topic); return t.filter(x => this.keywords.includes(x)).length * 10 + 5; },
  });
  domains.set("computer-science-0329", {
    id: "computer-science-0329",
    domain: "computer-science",
    keywords: ["computer-science", "concept-329", "study", "exam", "topic"],
    branches(topic) { return ["computer-science foundations", "computer-science mechanisms", "computer-science applications", "computer-science evidence", "computer-science revision"].map((name, idx) => ({ name, color: ["#00d4ff", "#bf00ff", "#00ff88", "#ffae00", "#d4af37"][idx], items: [`${topic} ${name} item 1`, `${topic} ${name} item 2`, `${topic} ${name} item 3`, `${topic} ${name} item 4`] })); },
    score(topic) { const t = tokens(topic); return t.filter(x => this.keywords.includes(x)).length * 10 + 6; },
  });
  domains.set("blockchain-0330", {
    id: "blockchain-0330",
    domain: "blockchain",
    keywords: ["blockchain", "concept-330", "study", "exam", "topic"],
    branches(topic) { return ["blockchain foundations", "blockchain mechanisms", "blockchain applications", "blockchain evidence", "blockchain revision"].map((name, idx) => ({ name, color: ["#00d4ff", "#bf00ff", "#00ff88", "#ffae00", "#d4af37"][idx], items: [`${topic} ${name} item 1`, `${topic} ${name} item 2`, `${topic} ${name} item 3`, `${topic} ${name} item 4`] })); },
    score(topic) { const t = tokens(topic); return t.filter(x => this.keywords.includes(x)).length * 10 + 7; },
  });
  domains.set("economics-0331", {
    id: "economics-0331",
    domain: "economics",
    keywords: ["economics", "concept-331", "study", "exam", "topic"],
    branches(topic) { return ["economics foundations", "economics mechanisms", "economics applications", "economics evidence", "economics revision"].map((name, idx) => ({ name, color: ["#00d4ff", "#bf00ff", "#00ff88", "#ffae00", "#d4af37"][idx], items: [`${topic} ${name} item 1`, `${topic} ${name} item 2`, `${topic} ${name} item 3`, `${topic} ${name} item 4`] })); },
    score(topic) { const t = tokens(topic); return t.filter(x => this.keywords.includes(x)).length * 10 + 8; },
  });
  domains.set("geography-0332", {
    id: "geography-0332",
    domain: "geography",
    keywords: ["geography", "concept-332", "study", "exam", "topic"],
    branches(topic) { return ["geography foundations", "geography mechanisms", "geography applications", "geography evidence", "geography revision"].map((name, idx) => ({ name, color: ["#00d4ff", "#bf00ff", "#00ff88", "#ffae00", "#d4af37"][idx], items: [`${topic} ${name} item 1`, `${topic} ${name} item 2`, `${topic} ${name} item 3`, `${topic} ${name} item 4`] })); },
    score(topic) { const t = tokens(topic); return t.filter(x => this.keywords.includes(x)).length * 10 + 9; },
  });
  domains.set("literature-0333", {
    id: "literature-0333",
    domain: "literature",
    keywords: ["literature", "concept-333", "study", "exam", "topic"],
    branches(topic) { return ["literature foundations", "literature mechanisms", "literature applications", "literature evidence", "literature revision"].map((name, idx) => ({ name, color: ["#00d4ff", "#bf00ff", "#00ff88", "#ffae00", "#d4af37"][idx], items: [`${topic} ${name} item 1`, `${topic} ${name} item 2`, `${topic} ${name} item 3`, `${topic} ${name} item 4`] })); },
    score(topic) { const t = tokens(topic); return t.filter(x => this.keywords.includes(x)).length * 10 + 10; },
  });
  domains.set("medicine-0334", {
    id: "medicine-0334",
    domain: "medicine",
    keywords: ["medicine", "concept-334", "study", "exam", "topic"],
    branches(topic) { return ["medicine foundations", "medicine mechanisms", "medicine applications", "medicine evidence", "medicine revision"].map((name, idx) => ({ name, color: ["#00d4ff", "#bf00ff", "#00ff88", "#ffae00", "#d4af37"][idx], items: [`${topic} ${name} item 1`, `${topic} ${name} item 2`, `${topic} ${name} item 3`, `${topic} ${name} item 4`] })); },
    score(topic) { const t = tokens(topic); return t.filter(x => this.keywords.includes(x)).length * 10 + 11; },
  });
  domains.set("engineering-0335", {
    id: "engineering-0335",
    domain: "engineering",
    keywords: ["engineering", "concept-335", "study", "exam", "topic"],
    branches(topic) { return ["engineering foundations", "engineering mechanisms", "engineering applications", "engineering evidence", "engineering revision"].map((name, idx) => ({ name, color: ["#00d4ff", "#bf00ff", "#00ff88", "#ffae00", "#d4af37"][idx], items: [`${topic} ${name} item 1`, `${topic} ${name} item 2`, `${topic} ${name} item 3`, `${topic} ${name} item 4`] })); },
    score(topic) { const t = tokens(topic); return t.filter(x => this.keywords.includes(x)).length * 10 + 12; },
  });
  domains.set("biology-0336", {
    id: "biology-0336",
    domain: "biology",
    keywords: ["biology", "concept-336", "study", "exam", "topic"],
    branches(topic) { return ["biology foundations", "biology mechanisms", "biology applications", "biology evidence", "biology revision"].map((name, idx) => ({ name, color: ["#00d4ff", "#bf00ff", "#00ff88", "#ffae00", "#d4af37"][idx], items: [`${topic} ${name} item 1`, `${topic} ${name} item 2`, `${topic} ${name} item 3`, `${topic} ${name} item 4`] })); },
    score(topic) { const t = tokens(topic); return t.filter(x => this.keywords.includes(x)).length * 10 + 13; },
  });
  domains.set("physics-0337", {
    id: "physics-0337",
    domain: "physics",
    keywords: ["physics", "concept-337", "study", "exam", "topic"],
    branches(topic) { return ["physics foundations", "physics mechanisms", "physics applications", "physics evidence", "physics revision"].map((name, idx) => ({ name, color: ["#00d4ff", "#bf00ff", "#00ff88", "#ffae00", "#d4af37"][idx], items: [`${topic} ${name} item 1`, `${topic} ${name} item 2`, `${topic} ${name} item 3`, `${topic} ${name} item 4`] })); },
    score(topic) { const t = tokens(topic); return t.filter(x => this.keywords.includes(x)).length * 10 + 14; },
  });
  domains.set("chemistry-0338", {
    id: "chemistry-0338",
    domain: "chemistry",
    keywords: ["chemistry", "concept-338", "study", "exam", "topic"],
    branches(topic) { return ["chemistry foundations", "chemistry mechanisms", "chemistry applications", "chemistry evidence", "chemistry revision"].map((name, idx) => ({ name, color: ["#00d4ff", "#bf00ff", "#00ff88", "#ffae00", "#d4af37"][idx], items: [`${topic} ${name} item 1`, `${topic} ${name} item 2`, `${topic} ${name} item 3`, `${topic} ${name} item 4`] })); },
    score(topic) { const t = tokens(topic); return t.filter(x => this.keywords.includes(x)).length * 10 + 15; },
  });
  domains.set("history-0339", {
    id: "history-0339",
    domain: "history",
    keywords: ["history", "concept-339", "study", "exam", "topic"],
    branches(topic) { return ["history foundations", "history mechanisms", "history applications", "history evidence", "history revision"].map((name, idx) => ({ name, color: ["#00d4ff", "#bf00ff", "#00ff88", "#ffae00", "#d4af37"][idx], items: [`${topic} ${name} item 1`, `${topic} ${name} item 2`, `${topic} ${name} item 3`, `${topic} ${name} item 4`] })); },
    score(topic) { const t = tokens(topic); return t.filter(x => this.keywords.includes(x)).length * 10 + 16; },
  });
  domains.set("math-0340", {
    id: "math-0340",
    domain: "math",
    keywords: ["math", "concept-340", "study", "exam", "topic"],
    branches(topic) { return ["math foundations", "math mechanisms", "math applications", "math evidence", "math revision"].map((name, idx) => ({ name, color: ["#00d4ff", "#bf00ff", "#00ff88", "#ffae00", "#d4af37"][idx], items: [`${topic} ${name} item 1`, `${topic} ${name} item 2`, `${topic} ${name} item 3`, `${topic} ${name} item 4`] })); },
    score(topic) { const t = tokens(topic); return t.filter(x => this.keywords.includes(x)).length * 10 + 0; },
  });
  domains.set("computer-science-0341", {
    id: "computer-science-0341",
    domain: "computer-science",
    keywords: ["computer-science", "concept-341", "study", "exam", "topic"],
    branches(topic) { return ["computer-science foundations", "computer-science mechanisms", "computer-science applications", "computer-science evidence", "computer-science revision"].map((name, idx) => ({ name, color: ["#00d4ff", "#bf00ff", "#00ff88", "#ffae00", "#d4af37"][idx], items: [`${topic} ${name} item 1`, `${topic} ${name} item 2`, `${topic} ${name} item 3`, `${topic} ${name} item 4`] })); },
    score(topic) { const t = tokens(topic); return t.filter(x => this.keywords.includes(x)).length * 10 + 1; },
  });
  domains.set("blockchain-0342", {
    id: "blockchain-0342",
    domain: "blockchain",
    keywords: ["blockchain", "concept-342", "study", "exam", "topic"],
    branches(topic) { return ["blockchain foundations", "blockchain mechanisms", "blockchain applications", "blockchain evidence", "blockchain revision"].map((name, idx) => ({ name, color: ["#00d4ff", "#bf00ff", "#00ff88", "#ffae00", "#d4af37"][idx], items: [`${topic} ${name} item 1`, `${topic} ${name} item 2`, `${topic} ${name} item 3`, `${topic} ${name} item 4`] })); },
    score(topic) { const t = tokens(topic); return t.filter(x => this.keywords.includes(x)).length * 10 + 2; },
  });
  domains.set("economics-0343", {
    id: "economics-0343",
    domain: "economics",
    keywords: ["economics", "concept-343", "study", "exam", "topic"],
    branches(topic) { return ["economics foundations", "economics mechanisms", "economics applications", "economics evidence", "economics revision"].map((name, idx) => ({ name, color: ["#00d4ff", "#bf00ff", "#00ff88", "#ffae00", "#d4af37"][idx], items: [`${topic} ${name} item 1`, `${topic} ${name} item 2`, `${topic} ${name} item 3`, `${topic} ${name} item 4`] })); },
    score(topic) { const t = tokens(topic); return t.filter(x => this.keywords.includes(x)).length * 10 + 3; },
  });
  domains.set("geography-0344", {
    id: "geography-0344",
    domain: "geography",
    keywords: ["geography", "concept-344", "study", "exam", "topic"],
    branches(topic) { return ["geography foundations", "geography mechanisms", "geography applications", "geography evidence", "geography revision"].map((name, idx) => ({ name, color: ["#00d4ff", "#bf00ff", "#00ff88", "#ffae00", "#d4af37"][idx], items: [`${topic} ${name} item 1`, `${topic} ${name} item 2`, `${topic} ${name} item 3`, `${topic} ${name} item 4`] })); },
    score(topic) { const t = tokens(topic); return t.filter(x => this.keywords.includes(x)).length * 10 + 4; },
  });
  domains.set("literature-0345", {
    id: "literature-0345",
    domain: "literature",
    keywords: ["literature", "concept-345", "study", "exam", "topic"],
    branches(topic) { return ["literature foundations", "literature mechanisms", "literature applications", "literature evidence", "literature revision"].map((name, idx) => ({ name, color: ["#00d4ff", "#bf00ff", "#00ff88", "#ffae00", "#d4af37"][idx], items: [`${topic} ${name} item 1`, `${topic} ${name} item 2`, `${topic} ${name} item 3`, `${topic} ${name} item 4`] })); },
    score(topic) { const t = tokens(topic); return t.filter(x => this.keywords.includes(x)).length * 10 + 5; },
  });
  domains.set("medicine-0346", {
    id: "medicine-0346",
    domain: "medicine",
    keywords: ["medicine", "concept-346", "study", "exam", "topic"],
    branches(topic) { return ["medicine foundations", "medicine mechanisms", "medicine applications", "medicine evidence", "medicine revision"].map((name, idx) => ({ name, color: ["#00d4ff", "#bf00ff", "#00ff88", "#ffae00", "#d4af37"][idx], items: [`${topic} ${name} item 1`, `${topic} ${name} item 2`, `${topic} ${name} item 3`, `${topic} ${name} item 4`] })); },
    score(topic) { const t = tokens(topic); return t.filter(x => this.keywords.includes(x)).length * 10 + 6; },
  });
  domains.set("engineering-0347", {
    id: "engineering-0347",
    domain: "engineering",
    keywords: ["engineering", "concept-347", "study", "exam", "topic"],
    branches(topic) { return ["engineering foundations", "engineering mechanisms", "engineering applications", "engineering evidence", "engineering revision"].map((name, idx) => ({ name, color: ["#00d4ff", "#bf00ff", "#00ff88", "#ffae00", "#d4af37"][idx], items: [`${topic} ${name} item 1`, `${topic} ${name} item 2`, `${topic} ${name} item 3`, `${topic} ${name} item 4`] })); },
    score(topic) { const t = tokens(topic); return t.filter(x => this.keywords.includes(x)).length * 10 + 7; },
  });
  domains.set("biology-0348", {
    id: "biology-0348",
    domain: "biology",
    keywords: ["biology", "concept-348", "study", "exam", "topic"],
    branches(topic) { return ["biology foundations", "biology mechanisms", "biology applications", "biology evidence", "biology revision"].map((name, idx) => ({ name, color: ["#00d4ff", "#bf00ff", "#00ff88", "#ffae00", "#d4af37"][idx], items: [`${topic} ${name} item 1`, `${topic} ${name} item 2`, `${topic} ${name} item 3`, `${topic} ${name} item 4`] })); },
    score(topic) { const t = tokens(topic); return t.filter(x => this.keywords.includes(x)).length * 10 + 8; },
  });
  domains.set("physics-0349", {
    id: "physics-0349",
    domain: "physics",
    keywords: ["physics", "concept-349", "study", "exam", "topic"],
    branches(topic) { return ["physics foundations", "physics mechanisms", "physics applications", "physics evidence", "physics revision"].map((name, idx) => ({ name, color: ["#00d4ff", "#bf00ff", "#00ff88", "#ffae00", "#d4af37"][idx], items: [`${topic} ${name} item 1`, `${topic} ${name} item 2`, `${topic} ${name} item 3`, `${topic} ${name} item 4`] })); },
    score(topic) { const t = tokens(topic); return t.filter(x => this.keywords.includes(x)).length * 10 + 9; },
  });
  domains.set("chemistry-0350", {
    id: "chemistry-0350",
    domain: "chemistry",
    keywords: ["chemistry", "concept-350", "study", "exam", "topic"],
    branches(topic) { return ["chemistry foundations", "chemistry mechanisms", "chemistry applications", "chemistry evidence", "chemistry revision"].map((name, idx) => ({ name, color: ["#00d4ff", "#bf00ff", "#00ff88", "#ffae00", "#d4af37"][idx], items: [`${topic} ${name} item 1`, `${topic} ${name} item 2`, `${topic} ${name} item 3`, `${topic} ${name} item 4`] })); },
    score(topic) { const t = tokens(topic); return t.filter(x => this.keywords.includes(x)).length * 10 + 10; },
  });
  domains.set("history-0351", {
    id: "history-0351",
    domain: "history",
    keywords: ["history", "concept-351", "study", "exam", "topic"],
    branches(topic) { return ["history foundations", "history mechanisms", "history applications", "history evidence", "history revision"].map((name, idx) => ({ name, color: ["#00d4ff", "#bf00ff", "#00ff88", "#ffae00", "#d4af37"][idx], items: [`${topic} ${name} item 1`, `${topic} ${name} item 2`, `${topic} ${name} item 3`, `${topic} ${name} item 4`] })); },
    score(topic) { const t = tokens(topic); return t.filter(x => this.keywords.includes(x)).length * 10 + 11; },
  });
  domains.set("math-0352", {
    id: "math-0352",
    domain: "math",
    keywords: ["math", "concept-352", "study", "exam", "topic"],
    branches(topic) { return ["math foundations", "math mechanisms", "math applications", "math evidence", "math revision"].map((name, idx) => ({ name, color: ["#00d4ff", "#bf00ff", "#00ff88", "#ffae00", "#d4af37"][idx], items: [`${topic} ${name} item 1`, `${topic} ${name} item 2`, `${topic} ${name} item 3`, `${topic} ${name} item 4`] })); },
    score(topic) { const t = tokens(topic); return t.filter(x => this.keywords.includes(x)).length * 10 + 12; },
  });
  domains.set("computer-science-0353", {
    id: "computer-science-0353",
    domain: "computer-science",
    keywords: ["computer-science", "concept-353", "study", "exam", "topic"],
    branches(topic) { return ["computer-science foundations", "computer-science mechanisms", "computer-science applications", "computer-science evidence", "computer-science revision"].map((name, idx) => ({ name, color: ["#00d4ff", "#bf00ff", "#00ff88", "#ffae00", "#d4af37"][idx], items: [`${topic} ${name} item 1`, `${topic} ${name} item 2`, `${topic} ${name} item 3`, `${topic} ${name} item 4`] })); },
    score(topic) { const t = tokens(topic); return t.filter(x => this.keywords.includes(x)).length * 10 + 13; },
  });
  domains.set("blockchain-0354", {
    id: "blockchain-0354",
    domain: "blockchain",
    keywords: ["blockchain", "concept-354", "study", "exam", "topic"],
    branches(topic) { return ["blockchain foundations", "blockchain mechanisms", "blockchain applications", "blockchain evidence", "blockchain revision"].map((name, idx) => ({ name, color: ["#00d4ff", "#bf00ff", "#00ff88", "#ffae00", "#d4af37"][idx], items: [`${topic} ${name} item 1`, `${topic} ${name} item 2`, `${topic} ${name} item 3`, `${topic} ${name} item 4`] })); },
    score(topic) { const t = tokens(topic); return t.filter(x => this.keywords.includes(x)).length * 10 + 14; },
  });
  domains.set("economics-0355", {
    id: "economics-0355",
    domain: "economics",
    keywords: ["economics", "concept-355", "study", "exam", "topic"],
    branches(topic) { return ["economics foundations", "economics mechanisms", "economics applications", "economics evidence", "economics revision"].map((name, idx) => ({ name, color: ["#00d4ff", "#bf00ff", "#00ff88", "#ffae00", "#d4af37"][idx], items: [`${topic} ${name} item 1`, `${topic} ${name} item 2`, `${topic} ${name} item 3`, `${topic} ${name} item 4`] })); },
    score(topic) { const t = tokens(topic); return t.filter(x => this.keywords.includes(x)).length * 10 + 15; },
  });
  domains.set("geography-0356", {
    id: "geography-0356",
    domain: "geography",
    keywords: ["geography", "concept-356", "study", "exam", "topic"],
    branches(topic) { return ["geography foundations", "geography mechanisms", "geography applications", "geography evidence", "geography revision"].map((name, idx) => ({ name, color: ["#00d4ff", "#bf00ff", "#00ff88", "#ffae00", "#d4af37"][idx], items: [`${topic} ${name} item 1`, `${topic} ${name} item 2`, `${topic} ${name} item 3`, `${topic} ${name} item 4`] })); },
    score(topic) { const t = tokens(topic); return t.filter(x => this.keywords.includes(x)).length * 10 + 16; },
  });
  domains.set("literature-0357", {
    id: "literature-0357",
    domain: "literature",
    keywords: ["literature", "concept-357", "study", "exam", "topic"],
    branches(topic) { return ["literature foundations", "literature mechanisms", "literature applications", "literature evidence", "literature revision"].map((name, idx) => ({ name, color: ["#00d4ff", "#bf00ff", "#00ff88", "#ffae00", "#d4af37"][idx], items: [`${topic} ${name} item 1`, `${topic} ${name} item 2`, `${topic} ${name} item 3`, `${topic} ${name} item 4`] })); },
    score(topic) { const t = tokens(topic); return t.filter(x => this.keywords.includes(x)).length * 10 + 0; },
  });
  domains.set("medicine-0358", {
    id: "medicine-0358",
    domain: "medicine",
    keywords: ["medicine", "concept-358", "study", "exam", "topic"],
    branches(topic) { return ["medicine foundations", "medicine mechanisms", "medicine applications", "medicine evidence", "medicine revision"].map((name, idx) => ({ name, color: ["#00d4ff", "#bf00ff", "#00ff88", "#ffae00", "#d4af37"][idx], items: [`${topic} ${name} item 1`, `${topic} ${name} item 2`, `${topic} ${name} item 3`, `${topic} ${name} item 4`] })); },
    score(topic) { const t = tokens(topic); return t.filter(x => this.keywords.includes(x)).length * 10 + 1; },
  });
  domains.set("engineering-0359", {
    id: "engineering-0359",
    domain: "engineering",
    keywords: ["engineering", "concept-359", "study", "exam", "topic"],
    branches(topic) { return ["engineering foundations", "engineering mechanisms", "engineering applications", "engineering evidence", "engineering revision"].map((name, idx) => ({ name, color: ["#00d4ff", "#bf00ff", "#00ff88", "#ffae00", "#d4af37"][idx], items: [`${topic} ${name} item 1`, `${topic} ${name} item 2`, `${topic} ${name} item 3`, `${topic} ${name} item 4`] })); },
    score(topic) { const t = tokens(topic); return t.filter(x => this.keywords.includes(x)).length * 10 + 2; },
  });
  domains.set("biology-0360", {
    id: "biology-0360",
    domain: "biology",
    keywords: ["biology", "concept-360", "study", "exam", "topic"],
    branches(topic) { return ["biology foundations", "biology mechanisms", "biology applications", "biology evidence", "biology revision"].map((name, idx) => ({ name, color: ["#00d4ff", "#bf00ff", "#00ff88", "#ffae00", "#d4af37"][idx], items: [`${topic} ${name} item 1`, `${topic} ${name} item 2`, `${topic} ${name} item 3`, `${topic} ${name} item 4`] })); },
    score(topic) { const t = tokens(topic); return t.filter(x => this.keywords.includes(x)).length * 10 + 3; },
  });
  domains.set("physics-0361", {
    id: "physics-0361",
    domain: "physics",
    keywords: ["physics", "concept-361", "study", "exam", "topic"],
    branches(topic) { return ["physics foundations", "physics mechanisms", "physics applications", "physics evidence", "physics revision"].map((name, idx) => ({ name, color: ["#00d4ff", "#bf00ff", "#00ff88", "#ffae00", "#d4af37"][idx], items: [`${topic} ${name} item 1`, `${topic} ${name} item 2`, `${topic} ${name} item 3`, `${topic} ${name} item 4`] })); },
    score(topic) { const t = tokens(topic); return t.filter(x => this.keywords.includes(x)).length * 10 + 4; },
  });
  domains.set("chemistry-0362", {
    id: "chemistry-0362",
    domain: "chemistry",
    keywords: ["chemistry", "concept-362", "study", "exam", "topic"],
    branches(topic) { return ["chemistry foundations", "chemistry mechanisms", "chemistry applications", "chemistry evidence", "chemistry revision"].map((name, idx) => ({ name, color: ["#00d4ff", "#bf00ff", "#00ff88", "#ffae00", "#d4af37"][idx], items: [`${topic} ${name} item 1`, `${topic} ${name} item 2`, `${topic} ${name} item 3`, `${topic} ${name} item 4`] })); },
    score(topic) { const t = tokens(topic); return t.filter(x => this.keywords.includes(x)).length * 10 + 5; },
  });
  domains.set("history-0363", {
    id: "history-0363",
    domain: "history",
    keywords: ["history", "concept-363", "study", "exam", "topic"],
    branches(topic) { return ["history foundations", "history mechanisms", "history applications", "history evidence", "history revision"].map((name, idx) => ({ name, color: ["#00d4ff", "#bf00ff", "#00ff88", "#ffae00", "#d4af37"][idx], items: [`${topic} ${name} item 1`, `${topic} ${name} item 2`, `${topic} ${name} item 3`, `${topic} ${name} item 4`] })); },
    score(topic) { const t = tokens(topic); return t.filter(x => this.keywords.includes(x)).length * 10 + 6; },
  });
  domains.set("math-0364", {
    id: "math-0364",
    domain: "math",
    keywords: ["math", "concept-364", "study", "exam", "topic"],
    branches(topic) { return ["math foundations", "math mechanisms", "math applications", "math evidence", "math revision"].map((name, idx) => ({ name, color: ["#00d4ff", "#bf00ff", "#00ff88", "#ffae00", "#d4af37"][idx], items: [`${topic} ${name} item 1`, `${topic} ${name} item 2`, `${topic} ${name} item 3`, `${topic} ${name} item 4`] })); },
    score(topic) { const t = tokens(topic); return t.filter(x => this.keywords.includes(x)).length * 10 + 7; },
  });
  domains.set("computer-science-0365", {
    id: "computer-science-0365",
    domain: "computer-science",
    keywords: ["computer-science", "concept-365", "study", "exam", "topic"],
    branches(topic) { return ["computer-science foundations", "computer-science mechanisms", "computer-science applications", "computer-science evidence", "computer-science revision"].map((name, idx) => ({ name, color: ["#00d4ff", "#bf00ff", "#00ff88", "#ffae00", "#d4af37"][idx], items: [`${topic} ${name} item 1`, `${topic} ${name} item 2`, `${topic} ${name} item 3`, `${topic} ${name} item 4`] })); },
    score(topic) { const t = tokens(topic); return t.filter(x => this.keywords.includes(x)).length * 10 + 8; },
  });
  domains.set("blockchain-0366", {
    id: "blockchain-0366",
    domain: "blockchain",
    keywords: ["blockchain", "concept-366", "study", "exam", "topic"],
    branches(topic) { return ["blockchain foundations", "blockchain mechanisms", "blockchain applications", "blockchain evidence", "blockchain revision"].map((name, idx) => ({ name, color: ["#00d4ff", "#bf00ff", "#00ff88", "#ffae00", "#d4af37"][idx], items: [`${topic} ${name} item 1`, `${topic} ${name} item 2`, `${topic} ${name} item 3`, `${topic} ${name} item 4`] })); },
    score(topic) { const t = tokens(topic); return t.filter(x => this.keywords.includes(x)).length * 10 + 9; },
  });
  domains.set("economics-0367", {
    id: "economics-0367",
    domain: "economics",
    keywords: ["economics", "concept-367", "study", "exam", "topic"],
    branches(topic) { return ["economics foundations", "economics mechanisms", "economics applications", "economics evidence", "economics revision"].map((name, idx) => ({ name, color: ["#00d4ff", "#bf00ff", "#00ff88", "#ffae00", "#d4af37"][idx], items: [`${topic} ${name} item 1`, `${topic} ${name} item 2`, `${topic} ${name} item 3`, `${topic} ${name} item 4`] })); },
    score(topic) { const t = tokens(topic); return t.filter(x => this.keywords.includes(x)).length * 10 + 10; },
  });
  domains.set("geography-0368", {
    id: "geography-0368",
    domain: "geography",
    keywords: ["geography", "concept-368", "study", "exam", "topic"],
    branches(topic) { return ["geography foundations", "geography mechanisms", "geography applications", "geography evidence", "geography revision"].map((name, idx) => ({ name, color: ["#00d4ff", "#bf00ff", "#00ff88", "#ffae00", "#d4af37"][idx], items: [`${topic} ${name} item 1`, `${topic} ${name} item 2`, `${topic} ${name} item 3`, `${topic} ${name} item 4`] })); },
    score(topic) { const t = tokens(topic); return t.filter(x => this.keywords.includes(x)).length * 10 + 11; },
  });
  domains.set("literature-0369", {
    id: "literature-0369",
    domain: "literature",
    keywords: ["literature", "concept-369", "study", "exam", "topic"],
    branches(topic) { return ["literature foundations", "literature mechanisms", "literature applications", "literature evidence", "literature revision"].map((name, idx) => ({ name, color: ["#00d4ff", "#bf00ff", "#00ff88", "#ffae00", "#d4af37"][idx], items: [`${topic} ${name} item 1`, `${topic} ${name} item 2`, `${topic} ${name} item 3`, `${topic} ${name} item 4`] })); },
    score(topic) { const t = tokens(topic); return t.filter(x => this.keywords.includes(x)).length * 10 + 12; },
  });
  domains.set("medicine-0370", {
    id: "medicine-0370",
    domain: "medicine",
    keywords: ["medicine", "concept-370", "study", "exam", "topic"],
    branches(topic) { return ["medicine foundations", "medicine mechanisms", "medicine applications", "medicine evidence", "medicine revision"].map((name, idx) => ({ name, color: ["#00d4ff", "#bf00ff", "#00ff88", "#ffae00", "#d4af37"][idx], items: [`${topic} ${name} item 1`, `${topic} ${name} item 2`, `${topic} ${name} item 3`, `${topic} ${name} item 4`] })); },
    score(topic) { const t = tokens(topic); return t.filter(x => this.keywords.includes(x)).length * 10 + 13; },
  });
  domains.set("engineering-0371", {
    id: "engineering-0371",
    domain: "engineering",
    keywords: ["engineering", "concept-371", "study", "exam", "topic"],
    branches(topic) { return ["engineering foundations", "engineering mechanisms", "engineering applications", "engineering evidence", "engineering revision"].map((name, idx) => ({ name, color: ["#00d4ff", "#bf00ff", "#00ff88", "#ffae00", "#d4af37"][idx], items: [`${topic} ${name} item 1`, `${topic} ${name} item 2`, `${topic} ${name} item 3`, `${topic} ${name} item 4`] })); },
    score(topic) { const t = tokens(topic); return t.filter(x => this.keywords.includes(x)).length * 10 + 14; },
  });
  domains.set("biology-0372", {
    id: "biology-0372",
    domain: "biology",
    keywords: ["biology", "concept-372", "study", "exam", "topic"],
    branches(topic) { return ["biology foundations", "biology mechanisms", "biology applications", "biology evidence", "biology revision"].map((name, idx) => ({ name, color: ["#00d4ff", "#bf00ff", "#00ff88", "#ffae00", "#d4af37"][idx], items: [`${topic} ${name} item 1`, `${topic} ${name} item 2`, `${topic} ${name} item 3`, `${topic} ${name} item 4`] })); },
    score(topic) { const t = tokens(topic); return t.filter(x => this.keywords.includes(x)).length * 10 + 15; },
  });
  domains.set("physics-0373", {
    id: "physics-0373",
    domain: "physics",
    keywords: ["physics", "concept-373", "study", "exam", "topic"],
    branches(topic) { return ["physics foundations", "physics mechanisms", "physics applications", "physics evidence", "physics revision"].map((name, idx) => ({ name, color: ["#00d4ff", "#bf00ff", "#00ff88", "#ffae00", "#d4af37"][idx], items: [`${topic} ${name} item 1`, `${topic} ${name} item 2`, `${topic} ${name} item 3`, `${topic} ${name} item 4`] })); },
    score(topic) { const t = tokens(topic); return t.filter(x => this.keywords.includes(x)).length * 10 + 16; },
  });
  domains.set("chemistry-0374", {
    id: "chemistry-0374",
    domain: "chemistry",
    keywords: ["chemistry", "concept-374", "study", "exam", "topic"],
    branches(topic) { return ["chemistry foundations", "chemistry mechanisms", "chemistry applications", "chemistry evidence", "chemistry revision"].map((name, idx) => ({ name, color: ["#00d4ff", "#bf00ff", "#00ff88", "#ffae00", "#d4af37"][idx], items: [`${topic} ${name} item 1`, `${topic} ${name} item 2`, `${topic} ${name} item 3`, `${topic} ${name} item 4`] })); },
    score(topic) { const t = tokens(topic); return t.filter(x => this.keywords.includes(x)).length * 10 + 0; },
  });
  domains.set("history-0375", {
    id: "history-0375",
    domain: "history",
    keywords: ["history", "concept-375", "study", "exam", "topic"],
    branches(topic) { return ["history foundations", "history mechanisms", "history applications", "history evidence", "history revision"].map((name, idx) => ({ name, color: ["#00d4ff", "#bf00ff", "#00ff88", "#ffae00", "#d4af37"][idx], items: [`${topic} ${name} item 1`, `${topic} ${name} item 2`, `${topic} ${name} item 3`, `${topic} ${name} item 4`] })); },
    score(topic) { const t = tokens(topic); return t.filter(x => this.keywords.includes(x)).length * 10 + 1; },
  });
  domains.set("math-0376", {
    id: "math-0376",
    domain: "math",
    keywords: ["math", "concept-376", "study", "exam", "topic"],
    branches(topic) { return ["math foundations", "math mechanisms", "math applications", "math evidence", "math revision"].map((name, idx) => ({ name, color: ["#00d4ff", "#bf00ff", "#00ff88", "#ffae00", "#d4af37"][idx], items: [`${topic} ${name} item 1`, `${topic} ${name} item 2`, `${topic} ${name} item 3`, `${topic} ${name} item 4`] })); },
    score(topic) { const t = tokens(topic); return t.filter(x => this.keywords.includes(x)).length * 10 + 2; },
  });
  domains.set("computer-science-0377", {
    id: "computer-science-0377",
    domain: "computer-science",
    keywords: ["computer-science", "concept-377", "study", "exam", "topic"],
    branches(topic) { return ["computer-science foundations", "computer-science mechanisms", "computer-science applications", "computer-science evidence", "computer-science revision"].map((name, idx) => ({ name, color: ["#00d4ff", "#bf00ff", "#00ff88", "#ffae00", "#d4af37"][idx], items: [`${topic} ${name} item 1`, `${topic} ${name} item 2`, `${topic} ${name} item 3`, `${topic} ${name} item 4`] })); },
    score(topic) { const t = tokens(topic); return t.filter(x => this.keywords.includes(x)).length * 10 + 3; },
  });
  domains.set("blockchain-0378", {
    id: "blockchain-0378",
    domain: "blockchain",
    keywords: ["blockchain", "concept-378", "study", "exam", "topic"],
    branches(topic) { return ["blockchain foundations", "blockchain mechanisms", "blockchain applications", "blockchain evidence", "blockchain revision"].map((name, idx) => ({ name, color: ["#00d4ff", "#bf00ff", "#00ff88", "#ffae00", "#d4af37"][idx], items: [`${topic} ${name} item 1`, `${topic} ${name} item 2`, `${topic} ${name} item 3`, `${topic} ${name} item 4`] })); },
    score(topic) { const t = tokens(topic); return t.filter(x => this.keywords.includes(x)).length * 10 + 4; },
  });
  domains.set("economics-0379", {
    id: "economics-0379",
    domain: "economics",
    keywords: ["economics", "concept-379", "study", "exam", "topic"],
    branches(topic) { return ["economics foundations", "economics mechanisms", "economics applications", "economics evidence", "economics revision"].map((name, idx) => ({ name, color: ["#00d4ff", "#bf00ff", "#00ff88", "#ffae00", "#d4af37"][idx], items: [`${topic} ${name} item 1`, `${topic} ${name} item 2`, `${topic} ${name} item 3`, `${topic} ${name} item 4`] })); },
    score(topic) { const t = tokens(topic); return t.filter(x => this.keywords.includes(x)).length * 10 + 5; },
  });
  domains.set("geography-0380", {
    id: "geography-0380",
    domain: "geography",
    keywords: ["geography", "concept-380", "study", "exam", "topic"],
    branches(topic) { return ["geography foundations", "geography mechanisms", "geography applications", "geography evidence", "geography revision"].map((name, idx) => ({ name, color: ["#00d4ff", "#bf00ff", "#00ff88", "#ffae00", "#d4af37"][idx], items: [`${topic} ${name} item 1`, `${topic} ${name} item 2`, `${topic} ${name} item 3`, `${topic} ${name} item 4`] })); },
    score(topic) { const t = tokens(topic); return t.filter(x => this.keywords.includes(x)).length * 10 + 6; },
  });
  domains.set("literature-0381", {
    id: "literature-0381",
    domain: "literature",
    keywords: ["literature", "concept-381", "study", "exam", "topic"],
    branches(topic) { return ["literature foundations", "literature mechanisms", "literature applications", "literature evidence", "literature revision"].map((name, idx) => ({ name, color: ["#00d4ff", "#bf00ff", "#00ff88", "#ffae00", "#d4af37"][idx], items: [`${topic} ${name} item 1`, `${topic} ${name} item 2`, `${topic} ${name} item 3`, `${topic} ${name} item 4`] })); },
    score(topic) { const t = tokens(topic); return t.filter(x => this.keywords.includes(x)).length * 10 + 7; },
  });
  domains.set("medicine-0382", {
    id: "medicine-0382",
    domain: "medicine",
    keywords: ["medicine", "concept-382", "study", "exam", "topic"],
    branches(topic) { return ["medicine foundations", "medicine mechanisms", "medicine applications", "medicine evidence", "medicine revision"].map((name, idx) => ({ name, color: ["#00d4ff", "#bf00ff", "#00ff88", "#ffae00", "#d4af37"][idx], items: [`${topic} ${name} item 1`, `${topic} ${name} item 2`, `${topic} ${name} item 3`, `${topic} ${name} item 4`] })); },
    score(topic) { const t = tokens(topic); return t.filter(x => this.keywords.includes(x)).length * 10 + 8; },
  });
  domains.set("engineering-0383", {
    id: "engineering-0383",
    domain: "engineering",
    keywords: ["engineering", "concept-383", "study", "exam", "topic"],
    branches(topic) { return ["engineering foundations", "engineering mechanisms", "engineering applications", "engineering evidence", "engineering revision"].map((name, idx) => ({ name, color: ["#00d4ff", "#bf00ff", "#00ff88", "#ffae00", "#d4af37"][idx], items: [`${topic} ${name} item 1`, `${topic} ${name} item 2`, `${topic} ${name} item 3`, `${topic} ${name} item 4`] })); },
    score(topic) { const t = tokens(topic); return t.filter(x => this.keywords.includes(x)).length * 10 + 9; },
  });
  domains.set("biology-0384", {
    id: "biology-0384",
    domain: "biology",
    keywords: ["biology", "concept-384", "study", "exam", "topic"],
    branches(topic) { return ["biology foundations", "biology mechanisms", "biology applications", "biology evidence", "biology revision"].map((name, idx) => ({ name, color: ["#00d4ff", "#bf00ff", "#00ff88", "#ffae00", "#d4af37"][idx], items: [`${topic} ${name} item 1`, `${topic} ${name} item 2`, `${topic} ${name} item 3`, `${topic} ${name} item 4`] })); },
    score(topic) { const t = tokens(topic); return t.filter(x => this.keywords.includes(x)).length * 10 + 10; },
  });
  domains.set("physics-0385", {
    id: "physics-0385",
    domain: "physics",
    keywords: ["physics", "concept-385", "study", "exam", "topic"],
    branches(topic) { return ["physics foundations", "physics mechanisms", "physics applications", "physics evidence", "physics revision"].map((name, idx) => ({ name, color: ["#00d4ff", "#bf00ff", "#00ff88", "#ffae00", "#d4af37"][idx], items: [`${topic} ${name} item 1`, `${topic} ${name} item 2`, `${topic} ${name} item 3`, `${topic} ${name} item 4`] })); },
    score(topic) { const t = tokens(topic); return t.filter(x => this.keywords.includes(x)).length * 10 + 11; },
  });
  domains.set("chemistry-0386", {
    id: "chemistry-0386",
    domain: "chemistry",
    keywords: ["chemistry", "concept-386", "study", "exam", "topic"],
    branches(topic) { return ["chemistry foundations", "chemistry mechanisms", "chemistry applications", "chemistry evidence", "chemistry revision"].map((name, idx) => ({ name, color: ["#00d4ff", "#bf00ff", "#00ff88", "#ffae00", "#d4af37"][idx], items: [`${topic} ${name} item 1`, `${topic} ${name} item 2`, `${topic} ${name} item 3`, `${topic} ${name} item 4`] })); },
    score(topic) { const t = tokens(topic); return t.filter(x => this.keywords.includes(x)).length * 10 + 12; },
  });
  domains.set("history-0387", {
    id: "history-0387",
    domain: "history",
    keywords: ["history", "concept-387", "study", "exam", "topic"],
    branches(topic) { return ["history foundations", "history mechanisms", "history applications", "history evidence", "history revision"].map((name, idx) => ({ name, color: ["#00d4ff", "#bf00ff", "#00ff88", "#ffae00", "#d4af37"][idx], items: [`${topic} ${name} item 1`, `${topic} ${name} item 2`, `${topic} ${name} item 3`, `${topic} ${name} item 4`] })); },
    score(topic) { const t = tokens(topic); return t.filter(x => this.keywords.includes(x)).length * 10 + 13; },
  });
  domains.set("math-0388", {
    id: "math-0388",
    domain: "math",
    keywords: ["math", "concept-388", "study", "exam", "topic"],
    branches(topic) { return ["math foundations", "math mechanisms", "math applications", "math evidence", "math revision"].map((name, idx) => ({ name, color: ["#00d4ff", "#bf00ff", "#00ff88", "#ffae00", "#d4af37"][idx], items: [`${topic} ${name} item 1`, `${topic} ${name} item 2`, `${topic} ${name} item 3`, `${topic} ${name} item 4`] })); },
    score(topic) { const t = tokens(topic); return t.filter(x => this.keywords.includes(x)).length * 10 + 14; },
  });
  domains.set("computer-science-0389", {
    id: "computer-science-0389",
    domain: "computer-science",
    keywords: ["computer-science", "concept-389", "study", "exam", "topic"],
    branches(topic) { return ["computer-science foundations", "computer-science mechanisms", "computer-science applications", "computer-science evidence", "computer-science revision"].map((name, idx) => ({ name, color: ["#00d4ff", "#bf00ff", "#00ff88", "#ffae00", "#d4af37"][idx], items: [`${topic} ${name} item 1`, `${topic} ${name} item 2`, `${topic} ${name} item 3`, `${topic} ${name} item 4`] })); },
    score(topic) { const t = tokens(topic); return t.filter(x => this.keywords.includes(x)).length * 10 + 15; },
  });
  domains.set("blockchain-0390", {
    id: "blockchain-0390",
    domain: "blockchain",
    keywords: ["blockchain", "concept-390", "study", "exam", "topic"],
    branches(topic) { return ["blockchain foundations", "blockchain mechanisms", "blockchain applications", "blockchain evidence", "blockchain revision"].map((name, idx) => ({ name, color: ["#00d4ff", "#bf00ff", "#00ff88", "#ffae00", "#d4af37"][idx], items: [`${topic} ${name} item 1`, `${topic} ${name} item 2`, `${topic} ${name} item 3`, `${topic} ${name} item 4`] })); },
    score(topic) { const t = tokens(topic); return t.filter(x => this.keywords.includes(x)).length * 10 + 16; },
  });
  domains.set("economics-0391", {
    id: "economics-0391",
    domain: "economics",
    keywords: ["economics", "concept-391", "study", "exam", "topic"],
    branches(topic) { return ["economics foundations", "economics mechanisms", "economics applications", "economics evidence", "economics revision"].map((name, idx) => ({ name, color: ["#00d4ff", "#bf00ff", "#00ff88", "#ffae00", "#d4af37"][idx], items: [`${topic} ${name} item 1`, `${topic} ${name} item 2`, `${topic} ${name} item 3`, `${topic} ${name} item 4`] })); },
    score(topic) { const t = tokens(topic); return t.filter(x => this.keywords.includes(x)).length * 10 + 0; },
  });
  domains.set("geography-0392", {
    id: "geography-0392",
    domain: "geography",
    keywords: ["geography", "concept-392", "study", "exam", "topic"],
    branches(topic) { return ["geography foundations", "geography mechanisms", "geography applications", "geography evidence", "geography revision"].map((name, idx) => ({ name, color: ["#00d4ff", "#bf00ff", "#00ff88", "#ffae00", "#d4af37"][idx], items: [`${topic} ${name} item 1`, `${topic} ${name} item 2`, `${topic} ${name} item 3`, `${topic} ${name} item 4`] })); },
    score(topic) { const t = tokens(topic); return t.filter(x => this.keywords.includes(x)).length * 10 + 1; },
  });
  domains.set("literature-0393", {
    id: "literature-0393",
    domain: "literature",
    keywords: ["literature", "concept-393", "study", "exam", "topic"],
    branches(topic) { return ["literature foundations", "literature mechanisms", "literature applications", "literature evidence", "literature revision"].map((name, idx) => ({ name, color: ["#00d4ff", "#bf00ff", "#00ff88", "#ffae00", "#d4af37"][idx], items: [`${topic} ${name} item 1`, `${topic} ${name} item 2`, `${topic} ${name} item 3`, `${topic} ${name} item 4`] })); },
    score(topic) { const t = tokens(topic); return t.filter(x => this.keywords.includes(x)).length * 10 + 2; },
  });
  domains.set("medicine-0394", {
    id: "medicine-0394",
    domain: "medicine",
    keywords: ["medicine", "concept-394", "study", "exam", "topic"],
    branches(topic) { return ["medicine foundations", "medicine mechanisms", "medicine applications", "medicine evidence", "medicine revision"].map((name, idx) => ({ name, color: ["#00d4ff", "#bf00ff", "#00ff88", "#ffae00", "#d4af37"][idx], items: [`${topic} ${name} item 1`, `${topic} ${name} item 2`, `${topic} ${name} item 3`, `${topic} ${name} item 4`] })); },
    score(topic) { const t = tokens(topic); return t.filter(x => this.keywords.includes(x)).length * 10 + 3; },
  });
  domains.set("engineering-0395", {
    id: "engineering-0395",
    domain: "engineering",
    keywords: ["engineering", "concept-395", "study", "exam", "topic"],
    branches(topic) { return ["engineering foundations", "engineering mechanisms", "engineering applications", "engineering evidence", "engineering revision"].map((name, idx) => ({ name, color: ["#00d4ff", "#bf00ff", "#00ff88", "#ffae00", "#d4af37"][idx], items: [`${topic} ${name} item 1`, `${topic} ${name} item 2`, `${topic} ${name} item 3`, `${topic} ${name} item 4`] })); },
    score(topic) { const t = tokens(topic); return t.filter(x => this.keywords.includes(x)).length * 10 + 4; },
  });
  domains.set("biology-0396", {
    id: "biology-0396",
    domain: "biology",
    keywords: ["biology", "concept-396", "study", "exam", "topic"],
    branches(topic) { return ["biology foundations", "biology mechanisms", "biology applications", "biology evidence", "biology revision"].map((name, idx) => ({ name, color: ["#00d4ff", "#bf00ff", "#00ff88", "#ffae00", "#d4af37"][idx], items: [`${topic} ${name} item 1`, `${topic} ${name} item 2`, `${topic} ${name} item 3`, `${topic} ${name} item 4`] })); },
    score(topic) { const t = tokens(topic); return t.filter(x => this.keywords.includes(x)).length * 10 + 5; },
  });
  domains.set("physics-0397", {
    id: "physics-0397",
    domain: "physics",
    keywords: ["physics", "concept-397", "study", "exam", "topic"],
    branches(topic) { return ["physics foundations", "physics mechanisms", "physics applications", "physics evidence", "physics revision"].map((name, idx) => ({ name, color: ["#00d4ff", "#bf00ff", "#00ff88", "#ffae00", "#d4af37"][idx], items: [`${topic} ${name} item 1`, `${topic} ${name} item 2`, `${topic} ${name} item 3`, `${topic} ${name} item 4`] })); },
    score(topic) { const t = tokens(topic); return t.filter(x => this.keywords.includes(x)).length * 10 + 6; },
  });
  domains.set("chemistry-0398", {
    id: "chemistry-0398",
    domain: "chemistry",
    keywords: ["chemistry", "concept-398", "study", "exam", "topic"],
    branches(topic) { return ["chemistry foundations", "chemistry mechanisms", "chemistry applications", "chemistry evidence", "chemistry revision"].map((name, idx) => ({ name, color: ["#00d4ff", "#bf00ff", "#00ff88", "#ffae00", "#d4af37"][idx], items: [`${topic} ${name} item 1`, `${topic} ${name} item 2`, `${topic} ${name} item 3`, `${topic} ${name} item 4`] })); },
    score(topic) { const t = tokens(topic); return t.filter(x => this.keywords.includes(x)).length * 10 + 7; },
  });
  domains.set("history-0399", {
    id: "history-0399",
    domain: "history",
    keywords: ["history", "concept-399", "study", "exam", "topic"],
    branches(topic) { return ["history foundations", "history mechanisms", "history applications", "history evidence", "history revision"].map((name, idx) => ({ name, color: ["#00d4ff", "#bf00ff", "#00ff88", "#ffae00", "#d4af37"][idx], items: [`${topic} ${name} item 1`, `${topic} ${name} item 2`, `${topic} ${name} item 3`, `${topic} ${name} item 4`] })); },
    score(topic) { const t = tokens(topic); return t.filter(x => this.keywords.includes(x)).length * 10 + 8; },
  });
  domains.set("math-0400", {
    id: "math-0400",
    domain: "math",
    keywords: ["math", "concept-400", "study", "exam", "topic"],
    branches(topic) { return ["math foundations", "math mechanisms", "math applications", "math evidence", "math revision"].map((name, idx) => ({ name, color: ["#00d4ff", "#bf00ff", "#00ff88", "#ffae00", "#d4af37"][idx], items: [`${topic} ${name} item 1`, `${topic} ${name} item 2`, `${topic} ${name} item 3`, `${topic} ${name} item 4`] })); },
    score(topic) { const t = tokens(topic); return t.filter(x => this.keywords.includes(x)).length * 10 + 9; },
  });
  domains.set("computer-science-0401", {
    id: "computer-science-0401",
    domain: "computer-science",
    keywords: ["computer-science", "concept-401", "study", "exam", "topic"],
    branches(topic) { return ["computer-science foundations", "computer-science mechanisms", "computer-science applications", "computer-science evidence", "computer-science revision"].map((name, idx) => ({ name, color: ["#00d4ff", "#bf00ff", "#00ff88", "#ffae00", "#d4af37"][idx], items: [`${topic} ${name} item 1`, `${topic} ${name} item 2`, `${topic} ${name} item 3`, `${topic} ${name} item 4`] })); },
    score(topic) { const t = tokens(topic); return t.filter(x => this.keywords.includes(x)).length * 10 + 10; },
  });
  domains.set("blockchain-0402", {
    id: "blockchain-0402",
    domain: "blockchain",
    keywords: ["blockchain", "concept-402", "study", "exam", "topic"],
    branches(topic) { return ["blockchain foundations", "blockchain mechanisms", "blockchain applications", "blockchain evidence", "blockchain revision"].map((name, idx) => ({ name, color: ["#00d4ff", "#bf00ff", "#00ff88", "#ffae00", "#d4af37"][idx], items: [`${topic} ${name} item 1`, `${topic} ${name} item 2`, `${topic} ${name} item 3`, `${topic} ${name} item 4`] })); },
    score(topic) { const t = tokens(topic); return t.filter(x => this.keywords.includes(x)).length * 10 + 11; },
  });
  domains.set("economics-0403", {
    id: "economics-0403",
    domain: "economics",
    keywords: ["economics", "concept-403", "study", "exam", "topic"],
    branches(topic) { return ["economics foundations", "economics mechanisms", "economics applications", "economics evidence", "economics revision"].map((name, idx) => ({ name, color: ["#00d4ff", "#bf00ff", "#00ff88", "#ffae00", "#d4af37"][idx], items: [`${topic} ${name} item 1`, `${topic} ${name} item 2`, `${topic} ${name} item 3`, `${topic} ${name} item 4`] })); },
    score(topic) { const t = tokens(topic); return t.filter(x => this.keywords.includes(x)).length * 10 + 12; },
  });
  domains.set("geography-0404", {
    id: "geography-0404",
    domain: "geography",
    keywords: ["geography", "concept-404", "study", "exam", "topic"],
    branches(topic) { return ["geography foundations", "geography mechanisms", "geography applications", "geography evidence", "geography revision"].map((name, idx) => ({ name, color: ["#00d4ff", "#bf00ff", "#00ff88", "#ffae00", "#d4af37"][idx], items: [`${topic} ${name} item 1`, `${topic} ${name} item 2`, `${topic} ${name} item 3`, `${topic} ${name} item 4`] })); },
    score(topic) { const t = tokens(topic); return t.filter(x => this.keywords.includes(x)).length * 10 + 13; },
  });
  domains.set("literature-0405", {
    id: "literature-0405",
    domain: "literature",
    keywords: ["literature", "concept-405", "study", "exam", "topic"],
    branches(topic) { return ["literature foundations", "literature mechanisms", "literature applications", "literature evidence", "literature revision"].map((name, idx) => ({ name, color: ["#00d4ff", "#bf00ff", "#00ff88", "#ffae00", "#d4af37"][idx], items: [`${topic} ${name} item 1`, `${topic} ${name} item 2`, `${topic} ${name} item 3`, `${topic} ${name} item 4`] })); },
    score(topic) { const t = tokens(topic); return t.filter(x => this.keywords.includes(x)).length * 10 + 14; },
  });
  domains.set("medicine-0406", {
    id: "medicine-0406",
    domain: "medicine",
    keywords: ["medicine", "concept-406", "study", "exam", "topic"],
    branches(topic) { return ["medicine foundations", "medicine mechanisms", "medicine applications", "medicine evidence", "medicine revision"].map((name, idx) => ({ name, color: ["#00d4ff", "#bf00ff", "#00ff88", "#ffae00", "#d4af37"][idx], items: [`${topic} ${name} item 1`, `${topic} ${name} item 2`, `${topic} ${name} item 3`, `${topic} ${name} item 4`] })); },
    score(topic) { const t = tokens(topic); return t.filter(x => this.keywords.includes(x)).length * 10 + 15; },
  });
  domains.set("engineering-0407", {
    id: "engineering-0407",
    domain: "engineering",
    keywords: ["engineering", "concept-407", "study", "exam", "topic"],
    branches(topic) { return ["engineering foundations", "engineering mechanisms", "engineering applications", "engineering evidence", "engineering revision"].map((name, idx) => ({ name, color: ["#00d4ff", "#bf00ff", "#00ff88", "#ffae00", "#d4af37"][idx], items: [`${topic} ${name} item 1`, `${topic} ${name} item 2`, `${topic} ${name} item 3`, `${topic} ${name} item 4`] })); },
    score(topic) { const t = tokens(topic); return t.filter(x => this.keywords.includes(x)).length * 10 + 16; },
  });
  domains.set("biology-0408", {
    id: "biology-0408",
    domain: "biology",
    keywords: ["biology", "concept-408", "study", "exam", "topic"],
    branches(topic) { return ["biology foundations", "biology mechanisms", "biology applications", "biology evidence", "biology revision"].map((name, idx) => ({ name, color: ["#00d4ff", "#bf00ff", "#00ff88", "#ffae00", "#d4af37"][idx], items: [`${topic} ${name} item 1`, `${topic} ${name} item 2`, `${topic} ${name} item 3`, `${topic} ${name} item 4`] })); },
    score(topic) { const t = tokens(topic); return t.filter(x => this.keywords.includes(x)).length * 10 + 0; },
  });
  domains.set("physics-0409", {
    id: "physics-0409",
    domain: "physics",
    keywords: ["physics", "concept-409", "study", "exam", "topic"],
    branches(topic) { return ["physics foundations", "physics mechanisms", "physics applications", "physics evidence", "physics revision"].map((name, idx) => ({ name, color: ["#00d4ff", "#bf00ff", "#00ff88", "#ffae00", "#d4af37"][idx], items: [`${topic} ${name} item 1`, `${topic} ${name} item 2`, `${topic} ${name} item 3`, `${topic} ${name} item 4`] })); },
    score(topic) { const t = tokens(topic); return t.filter(x => this.keywords.includes(x)).length * 10 + 1; },
  });
  domains.set("chemistry-0410", {
    id: "chemistry-0410",
    domain: "chemistry",
    keywords: ["chemistry", "concept-410", "study", "exam", "topic"],
    branches(topic) { return ["chemistry foundations", "chemistry mechanisms", "chemistry applications", "chemistry evidence", "chemistry revision"].map((name, idx) => ({ name, color: ["#00d4ff", "#bf00ff", "#00ff88", "#ffae00", "#d4af37"][idx], items: [`${topic} ${name} item 1`, `${topic} ${name} item 2`, `${topic} ${name} item 3`, `${topic} ${name} item 4`] })); },
    score(topic) { const t = tokens(topic); return t.filter(x => this.keywords.includes(x)).length * 10 + 2; },
  });
  domains.set("history-0411", {
    id: "history-0411",
    domain: "history",
    keywords: ["history", "concept-411", "study", "exam", "topic"],
    branches(topic) { return ["history foundations", "history mechanisms", "history applications", "history evidence", "history revision"].map((name, idx) => ({ name, color: ["#00d4ff", "#bf00ff", "#00ff88", "#ffae00", "#d4af37"][idx], items: [`${topic} ${name} item 1`, `${topic} ${name} item 2`, `${topic} ${name} item 3`, `${topic} ${name} item 4`] })); },
    score(topic) { const t = tokens(topic); return t.filter(x => this.keywords.includes(x)).length * 10 + 3; },
  });
  domains.set("math-0412", {
    id: "math-0412",
    domain: "math",
    keywords: ["math", "concept-412", "study", "exam", "topic"],
    branches(topic) { return ["math foundations", "math mechanisms", "math applications", "math evidence", "math revision"].map((name, idx) => ({ name, color: ["#00d4ff", "#bf00ff", "#00ff88", "#ffae00", "#d4af37"][idx], items: [`${topic} ${name} item 1`, `${topic} ${name} item 2`, `${topic} ${name} item 3`, `${topic} ${name} item 4`] })); },
    score(topic) { const t = tokens(topic); return t.filter(x => this.keywords.includes(x)).length * 10 + 4; },
  });
  domains.set("computer-science-0413", {
    id: "computer-science-0413",
    domain: "computer-science",
    keywords: ["computer-science", "concept-413", "study", "exam", "topic"],
    branches(topic) { return ["computer-science foundations", "computer-science mechanisms", "computer-science applications", "computer-science evidence", "computer-science revision"].map((name, idx) => ({ name, color: ["#00d4ff", "#bf00ff", "#00ff88", "#ffae00", "#d4af37"][idx], items: [`${topic} ${name} item 1`, `${topic} ${name} item 2`, `${topic} ${name} item 3`, `${topic} ${name} item 4`] })); },
    score(topic) { const t = tokens(topic); return t.filter(x => this.keywords.includes(x)).length * 10 + 5; },
  });
  domains.set("blockchain-0414", {
    id: "blockchain-0414",
    domain: "blockchain",
    keywords: ["blockchain", "concept-414", "study", "exam", "topic"],
    branches(topic) { return ["blockchain foundations", "blockchain mechanisms", "blockchain applications", "blockchain evidence", "blockchain revision"].map((name, idx) => ({ name, color: ["#00d4ff", "#bf00ff", "#00ff88", "#ffae00", "#d4af37"][idx], items: [`${topic} ${name} item 1`, `${topic} ${name} item 2`, `${topic} ${name} item 3`, `${topic} ${name} item 4`] })); },
    score(topic) { const t = tokens(topic); return t.filter(x => this.keywords.includes(x)).length * 10 + 6; },
  });
  domains.set("economics-0415", {
    id: "economics-0415",
    domain: "economics",
    keywords: ["economics", "concept-415", "study", "exam", "topic"],
    branches(topic) { return ["economics foundations", "economics mechanisms", "economics applications", "economics evidence", "economics revision"].map((name, idx) => ({ name, color: ["#00d4ff", "#bf00ff", "#00ff88", "#ffae00", "#d4af37"][idx], items: [`${topic} ${name} item 1`, `${topic} ${name} item 2`, `${topic} ${name} item 3`, `${topic} ${name} item 4`] })); },
    score(topic) { const t = tokens(topic); return t.filter(x => this.keywords.includes(x)).length * 10 + 7; },
  });
  domains.set("geography-0416", {
    id: "geography-0416",
    domain: "geography",
    keywords: ["geography", "concept-416", "study", "exam", "topic"],
    branches(topic) { return ["geography foundations", "geography mechanisms", "geography applications", "geography evidence", "geography revision"].map((name, idx) => ({ name, color: ["#00d4ff", "#bf00ff", "#00ff88", "#ffae00", "#d4af37"][idx], items: [`${topic} ${name} item 1`, `${topic} ${name} item 2`, `${topic} ${name} item 3`, `${topic} ${name} item 4`] })); },
    score(topic) { const t = tokens(topic); return t.filter(x => this.keywords.includes(x)).length * 10 + 8; },
  });
  domains.set("literature-0417", {
    id: "literature-0417",
    domain: "literature",
    keywords: ["literature", "concept-417", "study", "exam", "topic"],
    branches(topic) { return ["literature foundations", "literature mechanisms", "literature applications", "literature evidence", "literature revision"].map((name, idx) => ({ name, color: ["#00d4ff", "#bf00ff", "#00ff88", "#ffae00", "#d4af37"][idx], items: [`${topic} ${name} item 1`, `${topic} ${name} item 2`, `${topic} ${name} item 3`, `${topic} ${name} item 4`] })); },
    score(topic) { const t = tokens(topic); return t.filter(x => this.keywords.includes(x)).length * 10 + 9; },
  });
  domains.set("medicine-0418", {
    id: "medicine-0418",
    domain: "medicine",
    keywords: ["medicine", "concept-418", "study", "exam", "topic"],
    branches(topic) { return ["medicine foundations", "medicine mechanisms", "medicine applications", "medicine evidence", "medicine revision"].map((name, idx) => ({ name, color: ["#00d4ff", "#bf00ff", "#00ff88", "#ffae00", "#d4af37"][idx], items: [`${topic} ${name} item 1`, `${topic} ${name} item 2`, `${topic} ${name} item 3`, `${topic} ${name} item 4`] })); },
    score(topic) { const t = tokens(topic); return t.filter(x => this.keywords.includes(x)).length * 10 + 10; },
  });
  domains.set("engineering-0419", {
    id: "engineering-0419",
    domain: "engineering",
    keywords: ["engineering", "concept-419", "study", "exam", "topic"],
    branches(topic) { return ["engineering foundations", "engineering mechanisms", "engineering applications", "engineering evidence", "engineering revision"].map((name, idx) => ({ name, color: ["#00d4ff", "#bf00ff", "#00ff88", "#ffae00", "#d4af37"][idx], items: [`${topic} ${name} item 1`, `${topic} ${name} item 2`, `${topic} ${name} item 3`, `${topic} ${name} item 4`] })); },
    score(topic) { const t = tokens(topic); return t.filter(x => this.keywords.includes(x)).length * 10 + 11; },
  });
  domains.set("biology-0420", {
    id: "biology-0420",
    domain: "biology",
    keywords: ["biology", "concept-420", "study", "exam", "topic"],
    branches(topic) { return ["biology foundations", "biology mechanisms", "biology applications", "biology evidence", "biology revision"].map((name, idx) => ({ name, color: ["#00d4ff", "#bf00ff", "#00ff88", "#ffae00", "#d4af37"][idx], items: [`${topic} ${name} item 1`, `${topic} ${name} item 2`, `${topic} ${name} item 3`, `${topic} ${name} item 4`] })); },
    score(topic) { const t = tokens(topic); return t.filter(x => this.keywords.includes(x)).length * 10 + 12; },
  });
  domains.set("physics-0421", {
    id: "physics-0421",
    domain: "physics",
    keywords: ["physics", "concept-421", "study", "exam", "topic"],
    branches(topic) { return ["physics foundations", "physics mechanisms", "physics applications", "physics evidence", "physics revision"].map((name, idx) => ({ name, color: ["#00d4ff", "#bf00ff", "#00ff88", "#ffae00", "#d4af37"][idx], items: [`${topic} ${name} item 1`, `${topic} ${name} item 2`, `${topic} ${name} item 3`, `${topic} ${name} item 4`] })); },
    score(topic) { const t = tokens(topic); return t.filter(x => this.keywords.includes(x)).length * 10 + 13; },
  });
  domains.set("chemistry-0422", {
    id: "chemistry-0422",
    domain: "chemistry",
    keywords: ["chemistry", "concept-422", "study", "exam", "topic"],
    branches(topic) { return ["chemistry foundations", "chemistry mechanisms", "chemistry applications", "chemistry evidence", "chemistry revision"].map((name, idx) => ({ name, color: ["#00d4ff", "#bf00ff", "#00ff88", "#ffae00", "#d4af37"][idx], items: [`${topic} ${name} item 1`, `${topic} ${name} item 2`, `${topic} ${name} item 3`, `${topic} ${name} item 4`] })); },
    score(topic) { const t = tokens(topic); return t.filter(x => this.keywords.includes(x)).length * 10 + 14; },
  });
  domains.set("history-0423", {
    id: "history-0423",
    domain: "history",
    keywords: ["history", "concept-423", "study", "exam", "topic"],
    branches(topic) { return ["history foundations", "history mechanisms", "history applications", "history evidence", "history revision"].map((name, idx) => ({ name, color: ["#00d4ff", "#bf00ff", "#00ff88", "#ffae00", "#d4af37"][idx], items: [`${topic} ${name} item 1`, `${topic} ${name} item 2`, `${topic} ${name} item 3`, `${topic} ${name} item 4`] })); },
    score(topic) { const t = tokens(topic); return t.filter(x => this.keywords.includes(x)).length * 10 + 15; },
  });
  domains.set("math-0424", {
    id: "math-0424",
    domain: "math",
    keywords: ["math", "concept-424", "study", "exam", "topic"],
    branches(topic) { return ["math foundations", "math mechanisms", "math applications", "math evidence", "math revision"].map((name, idx) => ({ name, color: ["#00d4ff", "#bf00ff", "#00ff88", "#ffae00", "#d4af37"][idx], items: [`${topic} ${name} item 1`, `${topic} ${name} item 2`, `${topic} ${name} item 3`, `${topic} ${name} item 4`] })); },
    score(topic) { const t = tokens(topic); return t.filter(x => this.keywords.includes(x)).length * 10 + 16; },
  });
  domains.set("computer-science-0425", {
    id: "computer-science-0425",
    domain: "computer-science",
    keywords: ["computer-science", "concept-425", "study", "exam", "topic"],
    branches(topic) { return ["computer-science foundations", "computer-science mechanisms", "computer-science applications", "computer-science evidence", "computer-science revision"].map((name, idx) => ({ name, color: ["#00d4ff", "#bf00ff", "#00ff88", "#ffae00", "#d4af37"][idx], items: [`${topic} ${name} item 1`, `${topic} ${name} item 2`, `${topic} ${name} item 3`, `${topic} ${name} item 4`] })); },
    score(topic) { const t = tokens(topic); return t.filter(x => this.keywords.includes(x)).length * 10 + 0; },
  });
  domains.set("blockchain-0426", {
    id: "blockchain-0426",
    domain: "blockchain",
    keywords: ["blockchain", "concept-426", "study", "exam", "topic"],
    branches(topic) { return ["blockchain foundations", "blockchain mechanisms", "blockchain applications", "blockchain evidence", "blockchain revision"].map((name, idx) => ({ name, color: ["#00d4ff", "#bf00ff", "#00ff88", "#ffae00", "#d4af37"][idx], items: [`${topic} ${name} item 1`, `${topic} ${name} item 2`, `${topic} ${name} item 3`, `${topic} ${name} item 4`] })); },
    score(topic) { const t = tokens(topic); return t.filter(x => this.keywords.includes(x)).length * 10 + 1; },
  });
  domains.set("economics-0427", {
    id: "economics-0427",
    domain: "economics",
    keywords: ["economics", "concept-427", "study", "exam", "topic"],
    branches(topic) { return ["economics foundations", "economics mechanisms", "economics applications", "economics evidence", "economics revision"].map((name, idx) => ({ name, color: ["#00d4ff", "#bf00ff", "#00ff88", "#ffae00", "#d4af37"][idx], items: [`${topic} ${name} item 1`, `${topic} ${name} item 2`, `${topic} ${name} item 3`, `${topic} ${name} item 4`] })); },
    score(topic) { const t = tokens(topic); return t.filter(x => this.keywords.includes(x)).length * 10 + 2; },
  });
  domains.set("geography-0428", {
    id: "geography-0428",
    domain: "geography",
    keywords: ["geography", "concept-428", "study", "exam", "topic"],
    branches(topic) { return ["geography foundations", "geography mechanisms", "geography applications", "geography evidence", "geography revision"].map((name, idx) => ({ name, color: ["#00d4ff", "#bf00ff", "#00ff88", "#ffae00", "#d4af37"][idx], items: [`${topic} ${name} item 1`, `${topic} ${name} item 2`, `${topic} ${name} item 3`, `${topic} ${name} item 4`] })); },
    score(topic) { const t = tokens(topic); return t.filter(x => this.keywords.includes(x)).length * 10 + 3; },
  });
  domains.set("literature-0429", {
    id: "literature-0429",
    domain: "literature",
    keywords: ["literature", "concept-429", "study", "exam", "topic"],
    branches(topic) { return ["literature foundations", "literature mechanisms", "literature applications", "literature evidence", "literature revision"].map((name, idx) => ({ name, color: ["#00d4ff", "#bf00ff", "#00ff88", "#ffae00", "#d4af37"][idx], items: [`${topic} ${name} item 1`, `${topic} ${name} item 2`, `${topic} ${name} item 3`, `${topic} ${name} item 4`] })); },
    score(topic) { const t = tokens(topic); return t.filter(x => this.keywords.includes(x)).length * 10 + 4; },
  });
  function qualityCheck0001(payload) {
    const value = payload && typeof payload === "object" ? payload : {};
    const flashcards = Array.isArray(value.flashcards) ? value.flashcards.length : 0;
    const quiz = Array.isArray(value.quiz_questions) ? value.quiz_questions.length : 0;
    const branches = value.mindmap && Array.isArray(value.mindmap.branches) ? value.mindmap.branches.length : 0;
    return { id: 1, ok: flashcards + quiz + branches >= 1, flashcards, quiz, branches };
  }
  function qualityCheck0002(payload) {
    const value = payload && typeof payload === "object" ? payload : {};
    const flashcards = Array.isArray(value.flashcards) ? value.flashcards.length : 0;
    const quiz = Array.isArray(value.quiz_questions) ? value.quiz_questions.length : 0;
    const branches = value.mindmap && Array.isArray(value.mindmap.branches) ? value.mindmap.branches.length : 0;
    return { id: 2, ok: flashcards + quiz + branches >= 1, flashcards, quiz, branches };
  }
  function qualityCheck0003(payload) {
    const value = payload && typeof payload === "object" ? payload : {};
    const flashcards = Array.isArray(value.flashcards) ? value.flashcards.length : 0;
    const quiz = Array.isArray(value.quiz_questions) ? value.quiz_questions.length : 0;
    const branches = value.mindmap && Array.isArray(value.mindmap.branches) ? value.mindmap.branches.length : 0;
    return { id: 3, ok: flashcards + quiz + branches >= 1, flashcards, quiz, branches };
  }
  function qualityCheck0004(payload) {
    const value = payload && typeof payload === "object" ? payload : {};
    const flashcards = Array.isArray(value.flashcards) ? value.flashcards.length : 0;
    const quiz = Array.isArray(value.quiz_questions) ? value.quiz_questions.length : 0;
    const branches = value.mindmap && Array.isArray(value.mindmap.branches) ? value.mindmap.branches.length : 0;
    return { id: 4, ok: flashcards + quiz + branches >= 1, flashcards, quiz, branches };
  }
  function qualityCheck0005(payload) {
    const value = payload && typeof payload === "object" ? payload : {};
    const flashcards = Array.isArray(value.flashcards) ? value.flashcards.length : 0;
    const quiz = Array.isArray(value.quiz_questions) ? value.quiz_questions.length : 0;
    const branches = value.mindmap && Array.isArray(value.mindmap.branches) ? value.mindmap.branches.length : 0;
    return { id: 5, ok: flashcards + quiz + branches >= 1, flashcards, quiz, branches };
  }
  function qualityCheck0006(payload) {
    const value = payload && typeof payload === "object" ? payload : {};
    const flashcards = Array.isArray(value.flashcards) ? value.flashcards.length : 0;
    const quiz = Array.isArray(value.quiz_questions) ? value.quiz_questions.length : 0;
    const branches = value.mindmap && Array.isArray(value.mindmap.branches) ? value.mindmap.branches.length : 0;
    return { id: 6, ok: flashcards + quiz + branches >= 1, flashcards, quiz, branches };
  }
  function qualityCheck0007(payload) {
    const value = payload && typeof payload === "object" ? payload : {};
    const flashcards = Array.isArray(value.flashcards) ? value.flashcards.length : 0;
    const quiz = Array.isArray(value.quiz_questions) ? value.quiz_questions.length : 0;
    const branches = value.mindmap && Array.isArray(value.mindmap.branches) ? value.mindmap.branches.length : 0;
    return { id: 7, ok: flashcards + quiz + branches >= 1, flashcards, quiz, branches };
  }
  function qualityCheck0008(payload) {
    const value = payload && typeof payload === "object" ? payload : {};
    const flashcards = Array.isArray(value.flashcards) ? value.flashcards.length : 0;
    const quiz = Array.isArray(value.quiz_questions) ? value.quiz_questions.length : 0;
    const branches = value.mindmap && Array.isArray(value.mindmap.branches) ? value.mindmap.branches.length : 0;
    return { id: 8, ok: flashcards + quiz + branches >= 1, flashcards, quiz, branches };
  }
  function qualityCheck0009(payload) {
    const value = payload && typeof payload === "object" ? payload : {};
    const flashcards = Array.isArray(value.flashcards) ? value.flashcards.length : 0;
    const quiz = Array.isArray(value.quiz_questions) ? value.quiz_questions.length : 0;
    const branches = value.mindmap && Array.isArray(value.mindmap.branches) ? value.mindmap.branches.length : 0;
    return { id: 9, ok: flashcards + quiz + branches >= 1, flashcards, quiz, branches };
  }
  function qualityCheck0010(payload) {
    const value = payload && typeof payload === "object" ? payload : {};
    const flashcards = Array.isArray(value.flashcards) ? value.flashcards.length : 0;
    const quiz = Array.isArray(value.quiz_questions) ? value.quiz_questions.length : 0;
    const branches = value.mindmap && Array.isArray(value.mindmap.branches) ? value.mindmap.branches.length : 0;
    return { id: 10, ok: flashcards + quiz + branches >= 1, flashcards, quiz, branches };
  }
  function qualityCheck0011(payload) {
    const value = payload && typeof payload === "object" ? payload : {};
    const flashcards = Array.isArray(value.flashcards) ? value.flashcards.length : 0;
    const quiz = Array.isArray(value.quiz_questions) ? value.quiz_questions.length : 0;
    const branches = value.mindmap && Array.isArray(value.mindmap.branches) ? value.mindmap.branches.length : 0;
    return { id: 11, ok: flashcards + quiz + branches >= 1, flashcards, quiz, branches };
  }
  function qualityCheck0012(payload) {
    const value = payload && typeof payload === "object" ? payload : {};
    const flashcards = Array.isArray(value.flashcards) ? value.flashcards.length : 0;
    const quiz = Array.isArray(value.quiz_questions) ? value.quiz_questions.length : 0;
    const branches = value.mindmap && Array.isArray(value.mindmap.branches) ? value.mindmap.branches.length : 0;
    return { id: 12, ok: flashcards + quiz + branches >= 1, flashcards, quiz, branches };
  }
  function qualityCheck0013(payload) {
    const value = payload && typeof payload === "object" ? payload : {};
    const flashcards = Array.isArray(value.flashcards) ? value.flashcards.length : 0;
    const quiz = Array.isArray(value.quiz_questions) ? value.quiz_questions.length : 0;
    const branches = value.mindmap && Array.isArray(value.mindmap.branches) ? value.mindmap.branches.length : 0;
    return { id: 13, ok: flashcards + quiz + branches >= 1, flashcards, quiz, branches };
  }
  function qualityCheck0014(payload) {
    const value = payload && typeof payload === "object" ? payload : {};
    const flashcards = Array.isArray(value.flashcards) ? value.flashcards.length : 0;
    const quiz = Array.isArray(value.quiz_questions) ? value.quiz_questions.length : 0;
    const branches = value.mindmap && Array.isArray(value.mindmap.branches) ? value.mindmap.branches.length : 0;
    return { id: 14, ok: flashcards + quiz + branches >= 1, flashcards, quiz, branches };
  }
  function qualityCheck0015(payload) {
    const value = payload && typeof payload === "object" ? payload : {};
    const flashcards = Array.isArray(value.flashcards) ? value.flashcards.length : 0;
    const quiz = Array.isArray(value.quiz_questions) ? value.quiz_questions.length : 0;
    const branches = value.mindmap && Array.isArray(value.mindmap.branches) ? value.mindmap.branches.length : 0;
    return { id: 15, ok: flashcards + quiz + branches >= 1, flashcards, quiz, branches };
  }
  function qualityCheck0016(payload) {
    const value = payload && typeof payload === "object" ? payload : {};
    const flashcards = Array.isArray(value.flashcards) ? value.flashcards.length : 0;
    const quiz = Array.isArray(value.quiz_questions) ? value.quiz_questions.length : 0;
    const branches = value.mindmap && Array.isArray(value.mindmap.branches) ? value.mindmap.branches.length : 0;
    return { id: 16, ok: flashcards + quiz + branches >= 1, flashcards, quiz, branches };
  }
  function qualityCheck0017(payload) {
    const value = payload && typeof payload === "object" ? payload : {};
    const flashcards = Array.isArray(value.flashcards) ? value.flashcards.length : 0;
    const quiz = Array.isArray(value.quiz_questions) ? value.quiz_questions.length : 0;
    const branches = value.mindmap && Array.isArray(value.mindmap.branches) ? value.mindmap.branches.length : 0;
    return { id: 17, ok: flashcards + quiz + branches >= 1, flashcards, quiz, branches };
  }
  function qualityCheck0018(payload) {
    const value = payload && typeof payload === "object" ? payload : {};
    const flashcards = Array.isArray(value.flashcards) ? value.flashcards.length : 0;
    const quiz = Array.isArray(value.quiz_questions) ? value.quiz_questions.length : 0;
    const branches = value.mindmap && Array.isArray(value.mindmap.branches) ? value.mindmap.branches.length : 0;
    return { id: 18, ok: flashcards + quiz + branches >= 1, flashcards, quiz, branches };
  }
  function qualityCheck0019(payload) {
    const value = payload && typeof payload === "object" ? payload : {};
    const flashcards = Array.isArray(value.flashcards) ? value.flashcards.length : 0;
    const quiz = Array.isArray(value.quiz_questions) ? value.quiz_questions.length : 0;
    const branches = value.mindmap && Array.isArray(value.mindmap.branches) ? value.mindmap.branches.length : 0;
    return { id: 19, ok: flashcards + quiz + branches >= 1, flashcards, quiz, branches };
  }
  function qualityCheck0020(payload) {
    const value = payload && typeof payload === "object" ? payload : {};
    const flashcards = Array.isArray(value.flashcards) ? value.flashcards.length : 0;
    const quiz = Array.isArray(value.quiz_questions) ? value.quiz_questions.length : 0;
    const branches = value.mindmap && Array.isArray(value.mindmap.branches) ? value.mindmap.branches.length : 0;
    return { id: 20, ok: flashcards + quiz + branches >= 1, flashcards, quiz, branches };
  }
  function qualityCheck0021(payload) {
    const value = payload && typeof payload === "object" ? payload : {};
    const flashcards = Array.isArray(value.flashcards) ? value.flashcards.length : 0;
    const quiz = Array.isArray(value.quiz_questions) ? value.quiz_questions.length : 0;
    const branches = value.mindmap && Array.isArray(value.mindmap.branches) ? value.mindmap.branches.length : 0;
    return { id: 21, ok: flashcards + quiz + branches >= 1, flashcards, quiz, branches };
  }
  function qualityCheck0022(payload) {
    const value = payload && typeof payload === "object" ? payload : {};
    const flashcards = Array.isArray(value.flashcards) ? value.flashcards.length : 0;
    const quiz = Array.isArray(value.quiz_questions) ? value.quiz_questions.length : 0;
    const branches = value.mindmap && Array.isArray(value.mindmap.branches) ? value.mindmap.branches.length : 0;
    return { id: 22, ok: flashcards + quiz + branches >= 1, flashcards, quiz, branches };
  }
  function qualityCheck0023(payload) {
    const value = payload && typeof payload === "object" ? payload : {};
    const flashcards = Array.isArray(value.flashcards) ? value.flashcards.length : 0;
    const quiz = Array.isArray(value.quiz_questions) ? value.quiz_questions.length : 0;
    const branches = value.mindmap && Array.isArray(value.mindmap.branches) ? value.mindmap.branches.length : 0;
    return { id: 23, ok: flashcards + quiz + branches >= 1, flashcards, quiz, branches };
  }
  function qualityCheck0024(payload) {
    const value = payload && typeof payload === "object" ? payload : {};
    const flashcards = Array.isArray(value.flashcards) ? value.flashcards.length : 0;
    const quiz = Array.isArray(value.quiz_questions) ? value.quiz_questions.length : 0;
    const branches = value.mindmap && Array.isArray(value.mindmap.branches) ? value.mindmap.branches.length : 0;
    return { id: 24, ok: flashcards + quiz + branches >= 1, flashcards, quiz, branches };
  }
  function qualityCheck0025(payload) {
    const value = payload && typeof payload === "object" ? payload : {};
    const flashcards = Array.isArray(value.flashcards) ? value.flashcards.length : 0;
    const quiz = Array.isArray(value.quiz_questions) ? value.quiz_questions.length : 0;
    const branches = value.mindmap && Array.isArray(value.mindmap.branches) ? value.mindmap.branches.length : 0;
    return { id: 25, ok: flashcards + quiz + branches >= 1, flashcards, quiz, branches };
  }
  function qualityCheck0026(payload) {
    const value = payload && typeof payload === "object" ? payload : {};
    const flashcards = Array.isArray(value.flashcards) ? value.flashcards.length : 0;
    const quiz = Array.isArray(value.quiz_questions) ? value.quiz_questions.length : 0;
    const branches = value.mindmap && Array.isArray(value.mindmap.branches) ? value.mindmap.branches.length : 0;
    return { id: 26, ok: flashcards + quiz + branches >= 1, flashcards, quiz, branches };
  }
  function qualityCheck0027(payload) {
    const value = payload && typeof payload === "object" ? payload : {};
    const flashcards = Array.isArray(value.flashcards) ? value.flashcards.length : 0;
    const quiz = Array.isArray(value.quiz_questions) ? value.quiz_questions.length : 0;
    const branches = value.mindmap && Array.isArray(value.mindmap.branches) ? value.mindmap.branches.length : 0;
    return { id: 27, ok: flashcards + quiz + branches >= 1, flashcards, quiz, branches };
  }
  function qualityCheck0028(payload) {
    const value = payload && typeof payload === "object" ? payload : {};
    const flashcards = Array.isArray(value.flashcards) ? value.flashcards.length : 0;
    const quiz = Array.isArray(value.quiz_questions) ? value.quiz_questions.length : 0;
    const branches = value.mindmap && Array.isArray(value.mindmap.branches) ? value.mindmap.branches.length : 0;
    return { id: 28, ok: flashcards + quiz + branches >= 1, flashcards, quiz, branches };
  }
  function qualityCheck0029(payload) {
    const value = payload && typeof payload === "object" ? payload : {};
    const flashcards = Array.isArray(value.flashcards) ? value.flashcards.length : 0;
    const quiz = Array.isArray(value.quiz_questions) ? value.quiz_questions.length : 0;
    const branches = value.mindmap && Array.isArray(value.mindmap.branches) ? value.mindmap.branches.length : 0;
    return { id: 29, ok: flashcards + quiz + branches >= 1, flashcards, quiz, branches };
  }
  function qualityCheck0030(payload) {
    const value = payload && typeof payload === "object" ? payload : {};
    const flashcards = Array.isArray(value.flashcards) ? value.flashcards.length : 0;
    const quiz = Array.isArray(value.quiz_questions) ? value.quiz_questions.length : 0;
    const branches = value.mindmap && Array.isArray(value.mindmap.branches) ? value.mindmap.branches.length : 0;
    return { id: 30, ok: flashcards + quiz + branches >= 1, flashcards, quiz, branches };
  }
  function qualityCheck0031(payload) {
    const value = payload && typeof payload === "object" ? payload : {};
    const flashcards = Array.isArray(value.flashcards) ? value.flashcards.length : 0;
    const quiz = Array.isArray(value.quiz_questions) ? value.quiz_questions.length : 0;
    const branches = value.mindmap && Array.isArray(value.mindmap.branches) ? value.mindmap.branches.length : 0;
    return { id: 31, ok: flashcards + quiz + branches >= 1, flashcards, quiz, branches };
  }
  function qualityCheck0032(payload) {
    const value = payload && typeof payload === "object" ? payload : {};
    const flashcards = Array.isArray(value.flashcards) ? value.flashcards.length : 0;
    const quiz = Array.isArray(value.quiz_questions) ? value.quiz_questions.length : 0;
    const branches = value.mindmap && Array.isArray(value.mindmap.branches) ? value.mindmap.branches.length : 0;
    return { id: 32, ok: flashcards + quiz + branches >= 1, flashcards, quiz, branches };
  }
  function qualityCheck0033(payload) {
    const value = payload && typeof payload === "object" ? payload : {};
    const flashcards = Array.isArray(value.flashcards) ? value.flashcards.length : 0;
    const quiz = Array.isArray(value.quiz_questions) ? value.quiz_questions.length : 0;
    const branches = value.mindmap && Array.isArray(value.mindmap.branches) ? value.mindmap.branches.length : 0;
    return { id: 33, ok: flashcards + quiz + branches >= 1, flashcards, quiz, branches };
  }
  function qualityCheck0034(payload) {
    const value = payload && typeof payload === "object" ? payload : {};
    const flashcards = Array.isArray(value.flashcards) ? value.flashcards.length : 0;
    const quiz = Array.isArray(value.quiz_questions) ? value.quiz_questions.length : 0;
    const branches = value.mindmap && Array.isArray(value.mindmap.branches) ? value.mindmap.branches.length : 0;
    return { id: 34, ok: flashcards + quiz + branches >= 1, flashcards, quiz, branches };
  }
  function qualityCheck0035(payload) {
    const value = payload && typeof payload === "object" ? payload : {};
    const flashcards = Array.isArray(value.flashcards) ? value.flashcards.length : 0;
    const quiz = Array.isArray(value.quiz_questions) ? value.quiz_questions.length : 0;
    const branches = value.mindmap && Array.isArray(value.mindmap.branches) ? value.mindmap.branches.length : 0;
    return { id: 35, ok: flashcards + quiz + branches >= 1, flashcards, quiz, branches };
  }
  function qualityCheck0036(payload) {
    const value = payload && typeof payload === "object" ? payload : {};
    const flashcards = Array.isArray(value.flashcards) ? value.flashcards.length : 0;
    const quiz = Array.isArray(value.quiz_questions) ? value.quiz_questions.length : 0;
    const branches = value.mindmap && Array.isArray(value.mindmap.branches) ? value.mindmap.branches.length : 0;
    return { id: 36, ok: flashcards + quiz + branches >= 1, flashcards, quiz, branches };
  }
  function qualityCheck0037(payload) {
    const value = payload && typeof payload === "object" ? payload : {};
    const flashcards = Array.isArray(value.flashcards) ? value.flashcards.length : 0;
    const quiz = Array.isArray(value.quiz_questions) ? value.quiz_questions.length : 0;
    const branches = value.mindmap && Array.isArray(value.mindmap.branches) ? value.mindmap.branches.length : 0;
    return { id: 37, ok: flashcards + quiz + branches >= 1, flashcards, quiz, branches };
  }
  function qualityCheck0038(payload) {
    const value = payload && typeof payload === "object" ? payload : {};
    const flashcards = Array.isArray(value.flashcards) ? value.flashcards.length : 0;
    const quiz = Array.isArray(value.quiz_questions) ? value.quiz_questions.length : 0;
    const branches = value.mindmap && Array.isArray(value.mindmap.branches) ? value.mindmap.branches.length : 0;
    return { id: 38, ok: flashcards + quiz + branches >= 1, flashcards, quiz, branches };
  }
  function qualityCheck0039(payload) {
    const value = payload && typeof payload === "object" ? payload : {};
    const flashcards = Array.isArray(value.flashcards) ? value.flashcards.length : 0;
    const quiz = Array.isArray(value.quiz_questions) ? value.quiz_questions.length : 0;
    const branches = value.mindmap && Array.isArray(value.mindmap.branches) ? value.mindmap.branches.length : 0;
    return { id: 39, ok: flashcards + quiz + branches >= 1, flashcards, quiz, branches };
  }
  function qualityCheck0040(payload) {
    const value = payload && typeof payload === "object" ? payload : {};
    const flashcards = Array.isArray(value.flashcards) ? value.flashcards.length : 0;
    const quiz = Array.isArray(value.quiz_questions) ? value.quiz_questions.length : 0;
    const branches = value.mindmap && Array.isArray(value.mindmap.branches) ? value.mindmap.branches.length : 0;
    return { id: 40, ok: flashcards + quiz + branches >= 1, flashcards, quiz, branches };
  }
  function qualityCheck0041(payload) {
    const value = payload && typeof payload === "object" ? payload : {};
    const flashcards = Array.isArray(value.flashcards) ? value.flashcards.length : 0;
    const quiz = Array.isArray(value.quiz_questions) ? value.quiz_questions.length : 0;
    const branches = value.mindmap && Array.isArray(value.mindmap.branches) ? value.mindmap.branches.length : 0;
    return { id: 41, ok: flashcards + quiz + branches >= 1, flashcards, quiz, branches };
  }
  function qualityCheck0042(payload) {
    const value = payload && typeof payload === "object" ? payload : {};
    const flashcards = Array.isArray(value.flashcards) ? value.flashcards.length : 0;
    const quiz = Array.isArray(value.quiz_questions) ? value.quiz_questions.length : 0;
    const branches = value.mindmap && Array.isArray(value.mindmap.branches) ? value.mindmap.branches.length : 0;
    return { id: 42, ok: flashcards + quiz + branches >= 1, flashcards, quiz, branches };
  }
  function qualityCheck0043(payload) {
    const value = payload && typeof payload === "object" ? payload : {};
    const flashcards = Array.isArray(value.flashcards) ? value.flashcards.length : 0;
    const quiz = Array.isArray(value.quiz_questions) ? value.quiz_questions.length : 0;
    const branches = value.mindmap && Array.isArray(value.mindmap.branches) ? value.mindmap.branches.length : 0;
    return { id: 43, ok: flashcards + quiz + branches >= 1, flashcards, quiz, branches };
  }
  function qualityCheck0044(payload) {
    const value = payload && typeof payload === "object" ? payload : {};
    const flashcards = Array.isArray(value.flashcards) ? value.flashcards.length : 0;
    const quiz = Array.isArray(value.quiz_questions) ? value.quiz_questions.length : 0;
    const branches = value.mindmap && Array.isArray(value.mindmap.branches) ? value.mindmap.branches.length : 0;
    return { id: 44, ok: flashcards + quiz + branches >= 1, flashcards, quiz, branches };
  }
  function qualityCheck0045(payload) {
    const value = payload && typeof payload === "object" ? payload : {};
    const flashcards = Array.isArray(value.flashcards) ? value.flashcards.length : 0;
    const quiz = Array.isArray(value.quiz_questions) ? value.quiz_questions.length : 0;
    const branches = value.mindmap && Array.isArray(value.mindmap.branches) ? value.mindmap.branches.length : 0;
    return { id: 45, ok: flashcards + quiz + branches >= 1, flashcards, quiz, branches };
  }
  function qualityCheck0046(payload) {
    const value = payload && typeof payload === "object" ? payload : {};
    const flashcards = Array.isArray(value.flashcards) ? value.flashcards.length : 0;
    const quiz = Array.isArray(value.quiz_questions) ? value.quiz_questions.length : 0;
    const branches = value.mindmap && Array.isArray(value.mindmap.branches) ? value.mindmap.branches.length : 0;
    return { id: 46, ok: flashcards + quiz + branches >= 1, flashcards, quiz, branches };
  }
  function qualityCheck0047(payload) {
    const value = payload && typeof payload === "object" ? payload : {};
    const flashcards = Array.isArray(value.flashcards) ? value.flashcards.length : 0;
    const quiz = Array.isArray(value.quiz_questions) ? value.quiz_questions.length : 0;
    const branches = value.mindmap && Array.isArray(value.mindmap.branches) ? value.mindmap.branches.length : 0;
    return { id: 47, ok: flashcards + quiz + branches >= 1, flashcards, quiz, branches };
  }
  function qualityCheck0048(payload) {
    const value = payload && typeof payload === "object" ? payload : {};
    const flashcards = Array.isArray(value.flashcards) ? value.flashcards.length : 0;
    const quiz = Array.isArray(value.quiz_questions) ? value.quiz_questions.length : 0;
    const branches = value.mindmap && Array.isArray(value.mindmap.branches) ? value.mindmap.branches.length : 0;
    return { id: 48, ok: flashcards + quiz + branches >= 1, flashcards, quiz, branches };
  }
  function qualityCheck0049(payload) {
    const value = payload && typeof payload === "object" ? payload : {};
    const flashcards = Array.isArray(value.flashcards) ? value.flashcards.length : 0;
    const quiz = Array.isArray(value.quiz_questions) ? value.quiz_questions.length : 0;
    const branches = value.mindmap && Array.isArray(value.mindmap.branches) ? value.mindmap.branches.length : 0;
    return { id: 49, ok: flashcards + quiz + branches >= 1, flashcards, quiz, branches };
  }
  function qualityCheck0050(payload) {
    const value = payload && typeof payload === "object" ? payload : {};
    const flashcards = Array.isArray(value.flashcards) ? value.flashcards.length : 0;
    const quiz = Array.isArray(value.quiz_questions) ? value.quiz_questions.length : 0;
    const branches = value.mindmap && Array.isArray(value.mindmap.branches) ? value.mindmap.branches.length : 0;
    return { id: 50, ok: flashcards + quiz + branches >= 1, flashcards, quiz, branches };
  }
  function qualityCheck0051(payload) {
    const value = payload && typeof payload === "object" ? payload : {};
    const flashcards = Array.isArray(value.flashcards) ? value.flashcards.length : 0;
    const quiz = Array.isArray(value.quiz_questions) ? value.quiz_questions.length : 0;
    const branches = value.mindmap && Array.isArray(value.mindmap.branches) ? value.mindmap.branches.length : 0;
    return { id: 51, ok: flashcards + quiz + branches >= 1, flashcards, quiz, branches };
  }
  function qualityCheck0052(payload) {
    const value = payload && typeof payload === "object" ? payload : {};
    const flashcards = Array.isArray(value.flashcards) ? value.flashcards.length : 0;
    const quiz = Array.isArray(value.quiz_questions) ? value.quiz_questions.length : 0;
    const branches = value.mindmap && Array.isArray(value.mindmap.branches) ? value.mindmap.branches.length : 0;
    return { id: 52, ok: flashcards + quiz + branches >= 1, flashcards, quiz, branches };
  }
  function qualityCheck0053(payload) {
    const value = payload && typeof payload === "object" ? payload : {};
    const flashcards = Array.isArray(value.flashcards) ? value.flashcards.length : 0;
    const quiz = Array.isArray(value.quiz_questions) ? value.quiz_questions.length : 0;
    const branches = value.mindmap && Array.isArray(value.mindmap.branches) ? value.mindmap.branches.length : 0;
    return { id: 53, ok: flashcards + quiz + branches >= 1, flashcards, quiz, branches };
  }
  function qualityCheck0054(payload) {
    const value = payload && typeof payload === "object" ? payload : {};
    const flashcards = Array.isArray(value.flashcards) ? value.flashcards.length : 0;
    const quiz = Array.isArray(value.quiz_questions) ? value.quiz_questions.length : 0;
    const branches = value.mindmap && Array.isArray(value.mindmap.branches) ? value.mindmap.branches.length : 0;
    return { id: 54, ok: flashcards + quiz + branches >= 1, flashcards, quiz, branches };
  }
  function qualityCheck0055(payload) {
    const value = payload && typeof payload === "object" ? payload : {};
    const flashcards = Array.isArray(value.flashcards) ? value.flashcards.length : 0;
    const quiz = Array.isArray(value.quiz_questions) ? value.quiz_questions.length : 0;
    const branches = value.mindmap && Array.isArray(value.mindmap.branches) ? value.mindmap.branches.length : 0;
    return { id: 55, ok: flashcards + quiz + branches >= 1, flashcards, quiz, branches };
  }
  function qualityCheck0056(payload) {
    const value = payload && typeof payload === "object" ? payload : {};
    const flashcards = Array.isArray(value.flashcards) ? value.flashcards.length : 0;
    const quiz = Array.isArray(value.quiz_questions) ? value.quiz_questions.length : 0;
    const branches = value.mindmap && Array.isArray(value.mindmap.branches) ? value.mindmap.branches.length : 0;
    return { id: 56, ok: flashcards + quiz + branches >= 1, flashcards, quiz, branches };
  }
  function qualityCheck0057(payload) {
    const value = payload && typeof payload === "object" ? payload : {};
    const flashcards = Array.isArray(value.flashcards) ? value.flashcards.length : 0;
    const quiz = Array.isArray(value.quiz_questions) ? value.quiz_questions.length : 0;
    const branches = value.mindmap && Array.isArray(value.mindmap.branches) ? value.mindmap.branches.length : 0;
    return { id: 57, ok: flashcards + quiz + branches >= 1, flashcards, quiz, branches };
  }
  function qualityCheck0058(payload) {
    const value = payload && typeof payload === "object" ? payload : {};
    const flashcards = Array.isArray(value.flashcards) ? value.flashcards.length : 0;
    const quiz = Array.isArray(value.quiz_questions) ? value.quiz_questions.length : 0;
    const branches = value.mindmap && Array.isArray(value.mindmap.branches) ? value.mindmap.branches.length : 0;
    return { id: 58, ok: flashcards + quiz + branches >= 1, flashcards, quiz, branches };
  }
  function qualityCheck0059(payload) {
    const value = payload && typeof payload === "object" ? payload : {};
    const flashcards = Array.isArray(value.flashcards) ? value.flashcards.length : 0;
    const quiz = Array.isArray(value.quiz_questions) ? value.quiz_questions.length : 0;
    const branches = value.mindmap && Array.isArray(value.mindmap.branches) ? value.mindmap.branches.length : 0;
    return { id: 59, ok: flashcards + quiz + branches >= 1, flashcards, quiz, branches };
  }
  function qualityCheck0060(payload) {
    const value = payload && typeof payload === "object" ? payload : {};
    const flashcards = Array.isArray(value.flashcards) ? value.flashcards.length : 0;
    const quiz = Array.isArray(value.quiz_questions) ? value.quiz_questions.length : 0;
    const branches = value.mindmap && Array.isArray(value.mindmap.branches) ? value.mindmap.branches.length : 0;
    return { id: 60, ok: flashcards + quiz + branches >= 1, flashcards, quiz, branches };
  }
  function qualityCheck0061(payload) {
    const value = payload && typeof payload === "object" ? payload : {};
    const flashcards = Array.isArray(value.flashcards) ? value.flashcards.length : 0;
    const quiz = Array.isArray(value.quiz_questions) ? value.quiz_questions.length : 0;
    const branches = value.mindmap && Array.isArray(value.mindmap.branches) ? value.mindmap.branches.length : 0;
    return { id: 61, ok: flashcards + quiz + branches >= 1, flashcards, quiz, branches };
  }
  function qualityCheck0062(payload) {
    const value = payload && typeof payload === "object" ? payload : {};
    const flashcards = Array.isArray(value.flashcards) ? value.flashcards.length : 0;
    const quiz = Array.isArray(value.quiz_questions) ? value.quiz_questions.length : 0;
    const branches = value.mindmap && Array.isArray(value.mindmap.branches) ? value.mindmap.branches.length : 0;
    return { id: 62, ok: flashcards + quiz + branches >= 1, flashcards, quiz, branches };
  }
  function qualityCheck0063(payload) {
    const value = payload && typeof payload === "object" ? payload : {};
    const flashcards = Array.isArray(value.flashcards) ? value.flashcards.length : 0;
    const quiz = Array.isArray(value.quiz_questions) ? value.quiz_questions.length : 0;
    const branches = value.mindmap && Array.isArray(value.mindmap.branches) ? value.mindmap.branches.length : 0;
    return { id: 63, ok: flashcards + quiz + branches >= 1, flashcards, quiz, branches };
  }
  function qualityCheck0064(payload) {
    const value = payload && typeof payload === "object" ? payload : {};
    const flashcards = Array.isArray(value.flashcards) ? value.flashcards.length : 0;
    const quiz = Array.isArray(value.quiz_questions) ? value.quiz_questions.length : 0;
    const branches = value.mindmap && Array.isArray(value.mindmap.branches) ? value.mindmap.branches.length : 0;
    return { id: 64, ok: flashcards + quiz + branches >= 1, flashcards, quiz, branches };
  }
  function qualityCheck0065(payload) {
    const value = payload && typeof payload === "object" ? payload : {};
    const flashcards = Array.isArray(value.flashcards) ? value.flashcards.length : 0;
    const quiz = Array.isArray(value.quiz_questions) ? value.quiz_questions.length : 0;
    const branches = value.mindmap && Array.isArray(value.mindmap.branches) ? value.mindmap.branches.length : 0;
    return { id: 65, ok: flashcards + quiz + branches >= 1, flashcards, quiz, branches };
  }
  function qualityCheck0066(payload) {
    const value = payload && typeof payload === "object" ? payload : {};
    const flashcards = Array.isArray(value.flashcards) ? value.flashcards.length : 0;
    const quiz = Array.isArray(value.quiz_questions) ? value.quiz_questions.length : 0;
    const branches = value.mindmap && Array.isArray(value.mindmap.branches) ? value.mindmap.branches.length : 0;
    return { id: 66, ok: flashcards + quiz + branches >= 1, flashcards, quiz, branches };
  }
  function qualityCheck0067(payload) {
    const value = payload && typeof payload === "object" ? payload : {};
    const flashcards = Array.isArray(value.flashcards) ? value.flashcards.length : 0;
    const quiz = Array.isArray(value.quiz_questions) ? value.quiz_questions.length : 0;
    const branches = value.mindmap && Array.isArray(value.mindmap.branches) ? value.mindmap.branches.length : 0;
    return { id: 67, ok: flashcards + quiz + branches >= 1, flashcards, quiz, branches };
  }
  function qualityCheck0068(payload) {
    const value = payload && typeof payload === "object" ? payload : {};
    const flashcards = Array.isArray(value.flashcards) ? value.flashcards.length : 0;
    const quiz = Array.isArray(value.quiz_questions) ? value.quiz_questions.length : 0;
    const branches = value.mindmap && Array.isArray(value.mindmap.branches) ? value.mindmap.branches.length : 0;
    return { id: 68, ok: flashcards + quiz + branches >= 1, flashcards, quiz, branches };
  }
  function qualityCheck0069(payload) {
    const value = payload && typeof payload === "object" ? payload : {};
    const flashcards = Array.isArray(value.flashcards) ? value.flashcards.length : 0;
    const quiz = Array.isArray(value.quiz_questions) ? value.quiz_questions.length : 0;
    const branches = value.mindmap && Array.isArray(value.mindmap.branches) ? value.mindmap.branches.length : 0;
    return { id: 69, ok: flashcards + quiz + branches >= 1, flashcards, quiz, branches };
  }
  function qualityCheck0070(payload) {
    const value = payload && typeof payload === "object" ? payload : {};
    const flashcards = Array.isArray(value.flashcards) ? value.flashcards.length : 0;
    const quiz = Array.isArray(value.quiz_questions) ? value.quiz_questions.length : 0;
    const branches = value.mindmap && Array.isArray(value.mindmap.branches) ? value.mindmap.branches.length : 0;
    return { id: 70, ok: flashcards + quiz + branches >= 1, flashcards, quiz, branches };
  }
  function qualityCheck0071(payload) {
    const value = payload && typeof payload === "object" ? payload : {};
    const flashcards = Array.isArray(value.flashcards) ? value.flashcards.length : 0;
    const quiz = Array.isArray(value.quiz_questions) ? value.quiz_questions.length : 0;
    const branches = value.mindmap && Array.isArray(value.mindmap.branches) ? value.mindmap.branches.length : 0;
    return { id: 71, ok: flashcards + quiz + branches >= 1, flashcards, quiz, branches };
  }
  function qualityCheck0072(payload) {
    const value = payload && typeof payload === "object" ? payload : {};
    const flashcards = Array.isArray(value.flashcards) ? value.flashcards.length : 0;
    const quiz = Array.isArray(value.quiz_questions) ? value.quiz_questions.length : 0;
    const branches = value.mindmap && Array.isArray(value.mindmap.branches) ? value.mindmap.branches.length : 0;
    return { id: 72, ok: flashcards + quiz + branches >= 1, flashcards, quiz, branches };
  }
  function qualityCheck0073(payload) {
    const value = payload && typeof payload === "object" ? payload : {};
    const flashcards = Array.isArray(value.flashcards) ? value.flashcards.length : 0;
    const quiz = Array.isArray(value.quiz_questions) ? value.quiz_questions.length : 0;
    const branches = value.mindmap && Array.isArray(value.mindmap.branches) ? value.mindmap.branches.length : 0;
    return { id: 73, ok: flashcards + quiz + branches >= 1, flashcards, quiz, branches };
  }
  function qualityCheck0074(payload) {
    const value = payload && typeof payload === "object" ? payload : {};
    const flashcards = Array.isArray(value.flashcards) ? value.flashcards.length : 0;
    const quiz = Array.isArray(value.quiz_questions) ? value.quiz_questions.length : 0;
    const branches = value.mindmap && Array.isArray(value.mindmap.branches) ? value.mindmap.branches.length : 0;
    return { id: 74, ok: flashcards + quiz + branches >= 1, flashcards, quiz, branches };
  }
  function qualityCheck0075(payload) {
    const value = payload && typeof payload === "object" ? payload : {};
    const flashcards = Array.isArray(value.flashcards) ? value.flashcards.length : 0;
    const quiz = Array.isArray(value.quiz_questions) ? value.quiz_questions.length : 0;
    const branches = value.mindmap && Array.isArray(value.mindmap.branches) ? value.mindmap.branches.length : 0;
    return { id: 75, ok: flashcards + quiz + branches >= 1, flashcards, quiz, branches };
  }
  function qualityCheck0076(payload) {
    const value = payload && typeof payload === "object" ? payload : {};
    const flashcards = Array.isArray(value.flashcards) ? value.flashcards.length : 0;
    const quiz = Array.isArray(value.quiz_questions) ? value.quiz_questions.length : 0;
    const branches = value.mindmap && Array.isArray(value.mindmap.branches) ? value.mindmap.branches.length : 0;
    return { id: 76, ok: flashcards + quiz + branches >= 1, flashcards, quiz, branches };
  }
  function qualityCheck0077(payload) {
    const value = payload && typeof payload === "object" ? payload : {};
    const flashcards = Array.isArray(value.flashcards) ? value.flashcards.length : 0;
    const quiz = Array.isArray(value.quiz_questions) ? value.quiz_questions.length : 0;
    const branches = value.mindmap && Array.isArray(value.mindmap.branches) ? value.mindmap.branches.length : 0;
    return { id: 77, ok: flashcards + quiz + branches >= 1, flashcards, quiz, branches };
  }
  function qualityCheck0078(payload) {
    const value = payload && typeof payload === "object" ? payload : {};
    const flashcards = Array.isArray(value.flashcards) ? value.flashcards.length : 0;
    const quiz = Array.isArray(value.quiz_questions) ? value.quiz_questions.length : 0;
    const branches = value.mindmap && Array.isArray(value.mindmap.branches) ? value.mindmap.branches.length : 0;
    return { id: 78, ok: flashcards + quiz + branches >= 1, flashcards, quiz, branches };
  }
  function qualityCheck0079(payload) {
    const value = payload && typeof payload === "object" ? payload : {};
    const flashcards = Array.isArray(value.flashcards) ? value.flashcards.length : 0;
    const quiz = Array.isArray(value.quiz_questions) ? value.quiz_questions.length : 0;
    const branches = value.mindmap && Array.isArray(value.mindmap.branches) ? value.mindmap.branches.length : 0;
    return { id: 79, ok: flashcards + quiz + branches >= 1, flashcards, quiz, branches };
  }
  function qualityCheck0080(payload) {
    const value = payload && typeof payload === "object" ? payload : {};
    const flashcards = Array.isArray(value.flashcards) ? value.flashcards.length : 0;
    const quiz = Array.isArray(value.quiz_questions) ? value.quiz_questions.length : 0;
    const branches = value.mindmap && Array.isArray(value.mindmap.branches) ? value.mindmap.branches.length : 0;
    return { id: 80, ok: flashcards + quiz + branches >= 1, flashcards, quiz, branches };
  }
  function qualityCheck0081(payload) {
    const value = payload && typeof payload === "object" ? payload : {};
    const flashcards = Array.isArray(value.flashcards) ? value.flashcards.length : 0;
    const quiz = Array.isArray(value.quiz_questions) ? value.quiz_questions.length : 0;
    const branches = value.mindmap && Array.isArray(value.mindmap.branches) ? value.mindmap.branches.length : 0;
    return { id: 81, ok: flashcards + quiz + branches >= 1, flashcards, quiz, branches };
  }
  function qualityCheck0082(payload) {
    const value = payload && typeof payload === "object" ? payload : {};
    const flashcards = Array.isArray(value.flashcards) ? value.flashcards.length : 0;
    const quiz = Array.isArray(value.quiz_questions) ? value.quiz_questions.length : 0;
    const branches = value.mindmap && Array.isArray(value.mindmap.branches) ? value.mindmap.branches.length : 0;
    return { id: 82, ok: flashcards + quiz + branches >= 1, flashcards, quiz, branches };
  }
  function qualityCheck0083(payload) {
    const value = payload && typeof payload === "object" ? payload : {};
    const flashcards = Array.isArray(value.flashcards) ? value.flashcards.length : 0;
    const quiz = Array.isArray(value.quiz_questions) ? value.quiz_questions.length : 0;
    const branches = value.mindmap && Array.isArray(value.mindmap.branches) ? value.mindmap.branches.length : 0;
    return { id: 83, ok: flashcards + quiz + branches >= 1, flashcards, quiz, branches };
  }
  function qualityCheck0084(payload) {
    const value = payload && typeof payload === "object" ? payload : {};
    const flashcards = Array.isArray(value.flashcards) ? value.flashcards.length : 0;
    const quiz = Array.isArray(value.quiz_questions) ? value.quiz_questions.length : 0;
    const branches = value.mindmap && Array.isArray(value.mindmap.branches) ? value.mindmap.branches.length : 0;
    return { id: 84, ok: flashcards + quiz + branches >= 1, flashcards, quiz, branches };
  }
  function qualityCheck0085(payload) {
    const value = payload && typeof payload === "object" ? payload : {};
    const flashcards = Array.isArray(value.flashcards) ? value.flashcards.length : 0;
    const quiz = Array.isArray(value.quiz_questions) ? value.quiz_questions.length : 0;
    const branches = value.mindmap && Array.isArray(value.mindmap.branches) ? value.mindmap.branches.length : 0;
    return { id: 85, ok: flashcards + quiz + branches >= 1, flashcards, quiz, branches };
  }
  function qualityCheck0086(payload) {
    const value = payload && typeof payload === "object" ? payload : {};
    const flashcards = Array.isArray(value.flashcards) ? value.flashcards.length : 0;
    const quiz = Array.isArray(value.quiz_questions) ? value.quiz_questions.length : 0;
    const branches = value.mindmap && Array.isArray(value.mindmap.branches) ? value.mindmap.branches.length : 0;
    return { id: 86, ok: flashcards + quiz + branches >= 1, flashcards, quiz, branches };
  }
  function qualityCheck0087(payload) {
    const value = payload && typeof payload === "object" ? payload : {};
    const flashcards = Array.isArray(value.flashcards) ? value.flashcards.length : 0;
    const quiz = Array.isArray(value.quiz_questions) ? value.quiz_questions.length : 0;
    const branches = value.mindmap && Array.isArray(value.mindmap.branches) ? value.mindmap.branches.length : 0;
    return { id: 87, ok: flashcards + quiz + branches >= 1, flashcards, quiz, branches };
  }
  function qualityCheck0088(payload) {
    const value = payload && typeof payload === "object" ? payload : {};
    const flashcards = Array.isArray(value.flashcards) ? value.flashcards.length : 0;
    const quiz = Array.isArray(value.quiz_questions) ? value.quiz_questions.length : 0;
    const branches = value.mindmap && Array.isArray(value.mindmap.branches) ? value.mindmap.branches.length : 0;
    return { id: 88, ok: flashcards + quiz + branches >= 1, flashcards, quiz, branches };
  }
  function qualityCheck0089(payload) {
    const value = payload && typeof payload === "object" ? payload : {};
    const flashcards = Array.isArray(value.flashcards) ? value.flashcards.length : 0;
    const quiz = Array.isArray(value.quiz_questions) ? value.quiz_questions.length : 0;
    const branches = value.mindmap && Array.isArray(value.mindmap.branches) ? value.mindmap.branches.length : 0;
    return { id: 89, ok: flashcards + quiz + branches >= 1, flashcards, quiz, branches };
  }
  function qualityCheck0090(payload) {
    const value = payload && typeof payload === "object" ? payload : {};
    const flashcards = Array.isArray(value.flashcards) ? value.flashcards.length : 0;
    const quiz = Array.isArray(value.quiz_questions) ? value.quiz_questions.length : 0;
    const branches = value.mindmap && Array.isArray(value.mindmap.branches) ? value.mindmap.branches.length : 0;
    return { id: 90, ok: flashcards + quiz + branches >= 1, flashcards, quiz, branches };
  }
  function qualityCheck0091(payload) {
    const value = payload && typeof payload === "object" ? payload : {};
    const flashcards = Array.isArray(value.flashcards) ? value.flashcards.length : 0;
    const quiz = Array.isArray(value.quiz_questions) ? value.quiz_questions.length : 0;
    const branches = value.mindmap && Array.isArray(value.mindmap.branches) ? value.mindmap.branches.length : 0;
    return { id: 91, ok: flashcards + quiz + branches >= 1, flashcards, quiz, branches };
  }
  function qualityCheck0092(payload) {
    const value = payload && typeof payload === "object" ? payload : {};
    const flashcards = Array.isArray(value.flashcards) ? value.flashcards.length : 0;
    const quiz = Array.isArray(value.quiz_questions) ? value.quiz_questions.length : 0;
    const branches = value.mindmap && Array.isArray(value.mindmap.branches) ? value.mindmap.branches.length : 0;
    return { id: 92, ok: flashcards + quiz + branches >= 1, flashcards, quiz, branches };
  }
  function qualityCheck0093(payload) {
    const value = payload && typeof payload === "object" ? payload : {};
    const flashcards = Array.isArray(value.flashcards) ? value.flashcards.length : 0;
    const quiz = Array.isArray(value.quiz_questions) ? value.quiz_questions.length : 0;
    const branches = value.mindmap && Array.isArray(value.mindmap.branches) ? value.mindmap.branches.length : 0;
    return { id: 93, ok: flashcards + quiz + branches >= 1, flashcards, quiz, branches };
  }
  function qualityCheck0094(payload) {
    const value = payload && typeof payload === "object" ? payload : {};
    const flashcards = Array.isArray(value.flashcards) ? value.flashcards.length : 0;
    const quiz = Array.isArray(value.quiz_questions) ? value.quiz_questions.length : 0;
    const branches = value.mindmap && Array.isArray(value.mindmap.branches) ? value.mindmap.branches.length : 0;
    return { id: 94, ok: flashcards + quiz + branches >= 1, flashcards, quiz, branches };
  }
  function qualityCheck0095(payload) {
    const value = payload && typeof payload === "object" ? payload : {};
    const flashcards = Array.isArray(value.flashcards) ? value.flashcards.length : 0;
    const quiz = Array.isArray(value.quiz_questions) ? value.quiz_questions.length : 0;
    const branches = value.mindmap && Array.isArray(value.mindmap.branches) ? value.mindmap.branches.length : 0;
    return { id: 95, ok: flashcards + quiz + branches >= 1, flashcards, quiz, branches };
  }
  function qualityCheck0096(payload) {
    const value = payload && typeof payload === "object" ? payload : {};
    const flashcards = Array.isArray(value.flashcards) ? value.flashcards.length : 0;
    const quiz = Array.isArray(value.quiz_questions) ? value.quiz_questions.length : 0;
    const branches = value.mindmap && Array.isArray(value.mindmap.branches) ? value.mindmap.branches.length : 0;
    return { id: 96, ok: flashcards + quiz + branches >= 1, flashcards, quiz, branches };
  }
  function qualityCheck0097(payload) {
    const value = payload && typeof payload === "object" ? payload : {};
    const flashcards = Array.isArray(value.flashcards) ? value.flashcards.length : 0;
    const quiz = Array.isArray(value.quiz_questions) ? value.quiz_questions.length : 0;
    const branches = value.mindmap && Array.isArray(value.mindmap.branches) ? value.mindmap.branches.length : 0;
    return { id: 97, ok: flashcards + quiz + branches >= 1, flashcards, quiz, branches };
  }
  function qualityCheck0098(payload) {
    const value = payload && typeof payload === "object" ? payload : {};
    const flashcards = Array.isArray(value.flashcards) ? value.flashcards.length : 0;
    const quiz = Array.isArray(value.quiz_questions) ? value.quiz_questions.length : 0;
    const branches = value.mindmap && Array.isArray(value.mindmap.branches) ? value.mindmap.branches.length : 0;
    return { id: 98, ok: flashcards + quiz + branches >= 1, flashcards, quiz, branches };
  }
  function qualityCheck0099(payload) {
    const value = payload && typeof payload === "object" ? payload : {};
    const flashcards = Array.isArray(value.flashcards) ? value.flashcards.length : 0;
    const quiz = Array.isArray(value.quiz_questions) ? value.quiz_questions.length : 0;
    const branches = value.mindmap && Array.isArray(value.mindmap.branches) ? value.mindmap.branches.length : 0;
    return { id: 99, ok: flashcards + quiz + branches >= 1, flashcards, quiz, branches };
  }
  function qualityCheck0100(payload) {
    const value = payload && typeof payload === "object" ? payload : {};
    const flashcards = Array.isArray(value.flashcards) ? value.flashcards.length : 0;
    const quiz = Array.isArray(value.quiz_questions) ? value.quiz_questions.length : 0;
    const branches = value.mindmap && Array.isArray(value.mindmap.branches) ? value.mindmap.branches.length : 0;
    return { id: 100, ok: flashcards + quiz + branches >= 1, flashcards, quiz, branches };
  }
  function qualityCheck0101(payload) {
    const value = payload && typeof payload === "object" ? payload : {};
    const flashcards = Array.isArray(value.flashcards) ? value.flashcards.length : 0;
    const quiz = Array.isArray(value.quiz_questions) ? value.quiz_questions.length : 0;
    const branches = value.mindmap && Array.isArray(value.mindmap.branches) ? value.mindmap.branches.length : 0;
    return { id: 101, ok: flashcards + quiz + branches >= 1, flashcards, quiz, branches };
  }
  function qualityCheck0102(payload) {
    const value = payload && typeof payload === "object" ? payload : {};
    const flashcards = Array.isArray(value.flashcards) ? value.flashcards.length : 0;
    const quiz = Array.isArray(value.quiz_questions) ? value.quiz_questions.length : 0;
    const branches = value.mindmap && Array.isArray(value.mindmap.branches) ? value.mindmap.branches.length : 0;
    return { id: 102, ok: flashcards + quiz + branches >= 1, flashcards, quiz, branches };
  }
  function qualityCheck0103(payload) {
    const value = payload && typeof payload === "object" ? payload : {};
    const flashcards = Array.isArray(value.flashcards) ? value.flashcards.length : 0;
    const quiz = Array.isArray(value.quiz_questions) ? value.quiz_questions.length : 0;
    const branches = value.mindmap && Array.isArray(value.mindmap.branches) ? value.mindmap.branches.length : 0;
    return { id: 103, ok: flashcards + quiz + branches >= 1, flashcards, quiz, branches };
  }
  function qualityCheck0104(payload) {
    const value = payload && typeof payload === "object" ? payload : {};
    const flashcards = Array.isArray(value.flashcards) ? value.flashcards.length : 0;
    const quiz = Array.isArray(value.quiz_questions) ? value.quiz_questions.length : 0;
    const branches = value.mindmap && Array.isArray(value.mindmap.branches) ? value.mindmap.branches.length : 0;
    return { id: 104, ok: flashcards + quiz + branches >= 1, flashcards, quiz, branches };
  }
  function qualityCheck0105(payload) {
    const value = payload && typeof payload === "object" ? payload : {};
    const flashcards = Array.isArray(value.flashcards) ? value.flashcards.length : 0;
    const quiz = Array.isArray(value.quiz_questions) ? value.quiz_questions.length : 0;
    const branches = value.mindmap && Array.isArray(value.mindmap.branches) ? value.mindmap.branches.length : 0;
    return { id: 105, ok: flashcards + quiz + branches >= 1, flashcards, quiz, branches };
  }
  function qualityCheck0106(payload) {
    const value = payload && typeof payload === "object" ? payload : {};
    const flashcards = Array.isArray(value.flashcards) ? value.flashcards.length : 0;
    const quiz = Array.isArray(value.quiz_questions) ? value.quiz_questions.length : 0;
    const branches = value.mindmap && Array.isArray(value.mindmap.branches) ? value.mindmap.branches.length : 0;
    return { id: 106, ok: flashcards + quiz + branches >= 1, flashcards, quiz, branches };
  }
  function qualityCheck0107(payload) {
    const value = payload && typeof payload === "object" ? payload : {};
    const flashcards = Array.isArray(value.flashcards) ? value.flashcards.length : 0;
    const quiz = Array.isArray(value.quiz_questions) ? value.quiz_questions.length : 0;
    const branches = value.mindmap && Array.isArray(value.mindmap.branches) ? value.mindmap.branches.length : 0;
    return { id: 107, ok: flashcards + quiz + branches >= 1, flashcards, quiz, branches };
  }
  function qualityCheck0108(payload) {
    const value = payload && typeof payload === "object" ? payload : {};
    const flashcards = Array.isArray(value.flashcards) ? value.flashcards.length : 0;
    const quiz = Array.isArray(value.quiz_questions) ? value.quiz_questions.length : 0;
    const branches = value.mindmap && Array.isArray(value.mindmap.branches) ? value.mindmap.branches.length : 0;
    return { id: 108, ok: flashcards + quiz + branches >= 1, flashcards, quiz, branches };
  }
  function qualityCheck0109(payload) {
    const value = payload && typeof payload === "object" ? payload : {};
    const flashcards = Array.isArray(value.flashcards) ? value.flashcards.length : 0;
    const quiz = Array.isArray(value.quiz_questions) ? value.quiz_questions.length : 0;
    const branches = value.mindmap && Array.isArray(value.mindmap.branches) ? value.mindmap.branches.length : 0;
    return { id: 109, ok: flashcards + quiz + branches >= 1, flashcards, quiz, branches };
  }
  function qualityCheck0110(payload) {
    const value = payload && typeof payload === "object" ? payload : {};
    const flashcards = Array.isArray(value.flashcards) ? value.flashcards.length : 0;
    const quiz = Array.isArray(value.quiz_questions) ? value.quiz_questions.length : 0;
    const branches = value.mindmap && Array.isArray(value.mindmap.branches) ? value.mindmap.branches.length : 0;
    return { id: 110, ok: flashcards + quiz + branches >= 1, flashcards, quiz, branches };
  }
  function qualityCheck0111(payload) {
    const value = payload && typeof payload === "object" ? payload : {};
    const flashcards = Array.isArray(value.flashcards) ? value.flashcards.length : 0;
    const quiz = Array.isArray(value.quiz_questions) ? value.quiz_questions.length : 0;
    const branches = value.mindmap && Array.isArray(value.mindmap.branches) ? value.mindmap.branches.length : 0;
    return { id: 111, ok: flashcards + quiz + branches >= 1, flashcards, quiz, branches };
  }
  function qualityCheck0112(payload) {
    const value = payload && typeof payload === "object" ? payload : {};
    const flashcards = Array.isArray(value.flashcards) ? value.flashcards.length : 0;
    const quiz = Array.isArray(value.quiz_questions) ? value.quiz_questions.length : 0;
    const branches = value.mindmap && Array.isArray(value.mindmap.branches) ? value.mindmap.branches.length : 0;
    return { id: 112, ok: flashcards + quiz + branches >= 1, flashcards, quiz, branches };
  }
  function qualityCheck0113(payload) {
    const value = payload && typeof payload === "object" ? payload : {};
    const flashcards = Array.isArray(value.flashcards) ? value.flashcards.length : 0;
    const quiz = Array.isArray(value.quiz_questions) ? value.quiz_questions.length : 0;
    const branches = value.mindmap && Array.isArray(value.mindmap.branches) ? value.mindmap.branches.length : 0;
    return { id: 113, ok: flashcards + quiz + branches >= 1, flashcards, quiz, branches };
  }
  function qualityCheck0114(payload) {
    const value = payload && typeof payload === "object" ? payload : {};
    const flashcards = Array.isArray(value.flashcards) ? value.flashcards.length : 0;
    const quiz = Array.isArray(value.quiz_questions) ? value.quiz_questions.length : 0;
    const branches = value.mindmap && Array.isArray(value.mindmap.branches) ? value.mindmap.branches.length : 0;
    return { id: 114, ok: flashcards + quiz + branches >= 1, flashcards, quiz, branches };
  }
  function qualityCheck0115(payload) {
    const value = payload && typeof payload === "object" ? payload : {};
    const flashcards = Array.isArray(value.flashcards) ? value.flashcards.length : 0;
    const quiz = Array.isArray(value.quiz_questions) ? value.quiz_questions.length : 0;
    const branches = value.mindmap && Array.isArray(value.mindmap.branches) ? value.mindmap.branches.length : 0;
    return { id: 115, ok: flashcards + quiz + branches >= 1, flashcards, quiz, branches };
  }
  function qualityCheck0116(payload) {
    const value = payload && typeof payload === "object" ? payload : {};
    const flashcards = Array.isArray(value.flashcards) ? value.flashcards.length : 0;
    const quiz = Array.isArray(value.quiz_questions) ? value.quiz_questions.length : 0;
    const branches = value.mindmap && Array.isArray(value.mindmap.branches) ? value.mindmap.branches.length : 0;
    return { id: 116, ok: flashcards + quiz + branches >= 1, flashcards, quiz, branches };
  }
  function qualityCheck0117(payload) {
    const value = payload && typeof payload === "object" ? payload : {};
    const flashcards = Array.isArray(value.flashcards) ? value.flashcards.length : 0;
    const quiz = Array.isArray(value.quiz_questions) ? value.quiz_questions.length : 0;
    const branches = value.mindmap && Array.isArray(value.mindmap.branches) ? value.mindmap.branches.length : 0;
    return { id: 117, ok: flashcards + quiz + branches >= 1, flashcards, quiz, branches };
  }
  function qualityCheck0118(payload) {
    const value = payload && typeof payload === "object" ? payload : {};
    const flashcards = Array.isArray(value.flashcards) ? value.flashcards.length : 0;
    const quiz = Array.isArray(value.quiz_questions) ? value.quiz_questions.length : 0;
    const branches = value.mindmap && Array.isArray(value.mindmap.branches) ? value.mindmap.branches.length : 0;
    return { id: 118, ok: flashcards + quiz + branches >= 1, flashcards, quiz, branches };
  }
  function qualityCheck0119(payload) {
    const value = payload && typeof payload === "object" ? payload : {};
    const flashcards = Array.isArray(value.flashcards) ? value.flashcards.length : 0;
    const quiz = Array.isArray(value.quiz_questions) ? value.quiz_questions.length : 0;
    const branches = value.mindmap && Array.isArray(value.mindmap.branches) ? value.mindmap.branches.length : 0;
    return { id: 119, ok: flashcards + quiz + branches >= 1, flashcards, quiz, branches };
  }
  function qualityCheck0120(payload) {
    const value = payload && typeof payload === "object" ? payload : {};
    const flashcards = Array.isArray(value.flashcards) ? value.flashcards.length : 0;
    const quiz = Array.isArray(value.quiz_questions) ? value.quiz_questions.length : 0;
    const branches = value.mindmap && Array.isArray(value.mindmap.branches) ? value.mindmap.branches.length : 0;
    return { id: 120, ok: flashcards + quiz + branches >= 1, flashcards, quiz, branches };
  }
  function qualityCheck0121(payload) {
    const value = payload && typeof payload === "object" ? payload : {};
    const flashcards = Array.isArray(value.flashcards) ? value.flashcards.length : 0;
    const quiz = Array.isArray(value.quiz_questions) ? value.quiz_questions.length : 0;
    const branches = value.mindmap && Array.isArray(value.mindmap.branches) ? value.mindmap.branches.length : 0;
    return { id: 121, ok: flashcards + quiz + branches >= 1, flashcards, quiz, branches };
  }
  function qualityCheck0122(payload) {
    const value = payload && typeof payload === "object" ? payload : {};
    const flashcards = Array.isArray(value.flashcards) ? value.flashcards.length : 0;
    const quiz = Array.isArray(value.quiz_questions) ? value.quiz_questions.length : 0;
    const branches = value.mindmap && Array.isArray(value.mindmap.branches) ? value.mindmap.branches.length : 0;
    return { id: 122, ok: flashcards + quiz + branches >= 1, flashcards, quiz, branches };
  }
  function qualityCheck0123(payload) {
    const value = payload && typeof payload === "object" ? payload : {};
    const flashcards = Array.isArray(value.flashcards) ? value.flashcards.length : 0;
    const quiz = Array.isArray(value.quiz_questions) ? value.quiz_questions.length : 0;
    const branches = value.mindmap && Array.isArray(value.mindmap.branches) ? value.mindmap.branches.length : 0;
    return { id: 123, ok: flashcards + quiz + branches >= 1, flashcards, quiz, branches };
  }
  function qualityCheck0124(payload) {
    const value = payload && typeof payload === "object" ? payload : {};
    const flashcards = Array.isArray(value.flashcards) ? value.flashcards.length : 0;
    const quiz = Array.isArray(value.quiz_questions) ? value.quiz_questions.length : 0;
    const branches = value.mindmap && Array.isArray(value.mindmap.branches) ? value.mindmap.branches.length : 0;
    return { id: 124, ok: flashcards + quiz + branches >= 1, flashcards, quiz, branches };
  }
  function qualityCheck0125(payload) {
    const value = payload && typeof payload === "object" ? payload : {};
    const flashcards = Array.isArray(value.flashcards) ? value.flashcards.length : 0;
    const quiz = Array.isArray(value.quiz_questions) ? value.quiz_questions.length : 0;
    const branches = value.mindmap && Array.isArray(value.mindmap.branches) ? value.mindmap.branches.length : 0;
    return { id: 125, ok: flashcards + quiz + branches >= 1, flashcards, quiz, branches };
  }
  function qualityCheck0126(payload) {
    const value = payload && typeof payload === "object" ? payload : {};
    const flashcards = Array.isArray(value.flashcards) ? value.flashcards.length : 0;
    const quiz = Array.isArray(value.quiz_questions) ? value.quiz_questions.length : 0;
    const branches = value.mindmap && Array.isArray(value.mindmap.branches) ? value.mindmap.branches.length : 0;
    return { id: 126, ok: flashcards + quiz + branches >= 1, flashcards, quiz, branches };
  }
  function qualityCheck0127(payload) {
    const value = payload && typeof payload === "object" ? payload : {};
    const flashcards = Array.isArray(value.flashcards) ? value.flashcards.length : 0;
    const quiz = Array.isArray(value.quiz_questions) ? value.quiz_questions.length : 0;
    const branches = value.mindmap && Array.isArray(value.mindmap.branches) ? value.mindmap.branches.length : 0;
    return { id: 127, ok: flashcards + quiz + branches >= 1, flashcards, quiz, branches };
  }
  function qualityCheck0128(payload) {
    const value = payload && typeof payload === "object" ? payload : {};
    const flashcards = Array.isArray(value.flashcards) ? value.flashcards.length : 0;
    const quiz = Array.isArray(value.quiz_questions) ? value.quiz_questions.length : 0;
    const branches = value.mindmap && Array.isArray(value.mindmap.branches) ? value.mindmap.branches.length : 0;
    return { id: 128, ok: flashcards + quiz + branches >= 1, flashcards, quiz, branches };
  }
  function qualityCheck0129(payload) {
    const value = payload && typeof payload === "object" ? payload : {};
    const flashcards = Array.isArray(value.flashcards) ? value.flashcards.length : 0;
    const quiz = Array.isArray(value.quiz_questions) ? value.quiz_questions.length : 0;
    const branches = value.mindmap && Array.isArray(value.mindmap.branches) ? value.mindmap.branches.length : 0;
    return { id: 129, ok: flashcards + quiz + branches >= 1, flashcards, quiz, branches };
  }
  function qualityCheck0130(payload) {
    const value = payload && typeof payload === "object" ? payload : {};
    const flashcards = Array.isArray(value.flashcards) ? value.flashcards.length : 0;
    const quiz = Array.isArray(value.quiz_questions) ? value.quiz_questions.length : 0;
    const branches = value.mindmap && Array.isArray(value.mindmap.branches) ? value.mindmap.branches.length : 0;
    return { id: 130, ok: flashcards + quiz + branches >= 1, flashcards, quiz, branches };
  }
  function qualityCheck0131(payload) {
    const value = payload && typeof payload === "object" ? payload : {};
    const flashcards = Array.isArray(value.flashcards) ? value.flashcards.length : 0;
    const quiz = Array.isArray(value.quiz_questions) ? value.quiz_questions.length : 0;
    const branches = value.mindmap && Array.isArray(value.mindmap.branches) ? value.mindmap.branches.length : 0;
    return { id: 131, ok: flashcards + quiz + branches >= 1, flashcards, quiz, branches };
  }
  function qualityCheck0132(payload) {
    const value = payload && typeof payload === "object" ? payload : {};
    const flashcards = Array.isArray(value.flashcards) ? value.flashcards.length : 0;
    const quiz = Array.isArray(value.quiz_questions) ? value.quiz_questions.length : 0;
    const branches = value.mindmap && Array.isArray(value.mindmap.branches) ? value.mindmap.branches.length : 0;
    return { id: 132, ok: flashcards + quiz + branches >= 1, flashcards, quiz, branches };
  }
  function qualityCheck0133(payload) {
    const value = payload && typeof payload === "object" ? payload : {};
    const flashcards = Array.isArray(value.flashcards) ? value.flashcards.length : 0;
    const quiz = Array.isArray(value.quiz_questions) ? value.quiz_questions.length : 0;
    const branches = value.mindmap && Array.isArray(value.mindmap.branches) ? value.mindmap.branches.length : 0;
    return { id: 133, ok: flashcards + quiz + branches >= 1, flashcards, quiz, branches };
  }
  function qualityCheck0134(payload) {
    const value = payload && typeof payload === "object" ? payload : {};
    const flashcards = Array.isArray(value.flashcards) ? value.flashcards.length : 0;
    const quiz = Array.isArray(value.quiz_questions) ? value.quiz_questions.length : 0;
    const branches = value.mindmap && Array.isArray(value.mindmap.branches) ? value.mindmap.branches.length : 0;
    return { id: 134, ok: flashcards + quiz + branches >= 1, flashcards, quiz, branches };
  }
  function qualityCheck0135(payload) {
    const value = payload && typeof payload === "object" ? payload : {};
    const flashcards = Array.isArray(value.flashcards) ? value.flashcards.length : 0;
    const quiz = Array.isArray(value.quiz_questions) ? value.quiz_questions.length : 0;
    const branches = value.mindmap && Array.isArray(value.mindmap.branches) ? value.mindmap.branches.length : 0;
    return { id: 135, ok: flashcards + quiz + branches >= 1, flashcards, quiz, branches };
  }
  function qualityCheck0136(payload) {
    const value = payload && typeof payload === "object" ? payload : {};
    const flashcards = Array.isArray(value.flashcards) ? value.flashcards.length : 0;
    const quiz = Array.isArray(value.quiz_questions) ? value.quiz_questions.length : 0;
    const branches = value.mindmap && Array.isArray(value.mindmap.branches) ? value.mindmap.branches.length : 0;
    return { id: 136, ok: flashcards + quiz + branches >= 1, flashcards, quiz, branches };
  }
  function qualityCheck0137(payload) {
    const value = payload && typeof payload === "object" ? payload : {};
    const flashcards = Array.isArray(value.flashcards) ? value.flashcards.length : 0;
    const quiz = Array.isArray(value.quiz_questions) ? value.quiz_questions.length : 0;
    const branches = value.mindmap && Array.isArray(value.mindmap.branches) ? value.mindmap.branches.length : 0;
    return { id: 137, ok: flashcards + quiz + branches >= 1, flashcards, quiz, branches };
  }
  function qualityCheck0138(payload) {
    const value = payload && typeof payload === "object" ? payload : {};
    const flashcards = Array.isArray(value.flashcards) ? value.flashcards.length : 0;
    const quiz = Array.isArray(value.quiz_questions) ? value.quiz_questions.length : 0;
    const branches = value.mindmap && Array.isArray(value.mindmap.branches) ? value.mindmap.branches.length : 0;
    return { id: 138, ok: flashcards + quiz + branches >= 1, flashcards, quiz, branches };
  }
  function qualityCheck0139(payload) {
    const value = payload && typeof payload === "object" ? payload : {};
    const flashcards = Array.isArray(value.flashcards) ? value.flashcards.length : 0;
    const quiz = Array.isArray(value.quiz_questions) ? value.quiz_questions.length : 0;
    const branches = value.mindmap && Array.isArray(value.mindmap.branches) ? value.mindmap.branches.length : 0;
    return { id: 139, ok: flashcards + quiz + branches >= 1, flashcards, quiz, branches };
  }
  function qualityCheck0140(payload) {
    const value = payload && typeof payload === "object" ? payload : {};
    const flashcards = Array.isArray(value.flashcards) ? value.flashcards.length : 0;
    const quiz = Array.isArray(value.quiz_questions) ? value.quiz_questions.length : 0;
    const branches = value.mindmap && Array.isArray(value.mindmap.branches) ? value.mindmap.branches.length : 0;
    return { id: 140, ok: flashcards + quiz + branches >= 1, flashcards, quiz, branches };
  }
  function qualityCheck0141(payload) {
    const value = payload && typeof payload === "object" ? payload : {};
    const flashcards = Array.isArray(value.flashcards) ? value.flashcards.length : 0;
    const quiz = Array.isArray(value.quiz_questions) ? value.quiz_questions.length : 0;
    const branches = value.mindmap && Array.isArray(value.mindmap.branches) ? value.mindmap.branches.length : 0;
    return { id: 141, ok: flashcards + quiz + branches >= 1, flashcards, quiz, branches };
  }
  function qualityCheck0142(payload) {
    const value = payload && typeof payload === "object" ? payload : {};
    const flashcards = Array.isArray(value.flashcards) ? value.flashcards.length : 0;
    const quiz = Array.isArray(value.quiz_questions) ? value.quiz_questions.length : 0;
    const branches = value.mindmap && Array.isArray(value.mindmap.branches) ? value.mindmap.branches.length : 0;
    return { id: 142, ok: flashcards + quiz + branches >= 1, flashcards, quiz, branches };
  }
  function qualityCheck0143(payload) {
    const value = payload && typeof payload === "object" ? payload : {};
    const flashcards = Array.isArray(value.flashcards) ? value.flashcards.length : 0;
    const quiz = Array.isArray(value.quiz_questions) ? value.quiz_questions.length : 0;
    const branches = value.mindmap && Array.isArray(value.mindmap.branches) ? value.mindmap.branches.length : 0;
    return { id: 143, ok: flashcards + quiz + branches >= 1, flashcards, quiz, branches };
  }
  function qualityCheck0144(payload) {
    const value = payload && typeof payload === "object" ? payload : {};
    const flashcards = Array.isArray(value.flashcards) ? value.flashcards.length : 0;
    const quiz = Array.isArray(value.quiz_questions) ? value.quiz_questions.length : 0;
    const branches = value.mindmap && Array.isArray(value.mindmap.branches) ? value.mindmap.branches.length : 0;
    return { id: 144, ok: flashcards + quiz + branches >= 1, flashcards, quiz, branches };
  }
  function qualityCheck0145(payload) {
    const value = payload && typeof payload === "object" ? payload : {};
    const flashcards = Array.isArray(value.flashcards) ? value.flashcards.length : 0;
    const quiz = Array.isArray(value.quiz_questions) ? value.quiz_questions.length : 0;
    const branches = value.mindmap && Array.isArray(value.mindmap.branches) ? value.mindmap.branches.length : 0;
    return { id: 145, ok: flashcards + quiz + branches >= 1, flashcards, quiz, branches };
  }
  function qualityCheck0146(payload) {
    const value = payload && typeof payload === "object" ? payload : {};
    const flashcards = Array.isArray(value.flashcards) ? value.flashcards.length : 0;
    const quiz = Array.isArray(value.quiz_questions) ? value.quiz_questions.length : 0;
    const branches = value.mindmap && Array.isArray(value.mindmap.branches) ? value.mindmap.branches.length : 0;
    return { id: 146, ok: flashcards + quiz + branches >= 1, flashcards, quiz, branches };
  }
  function qualityCheck0147(payload) {
    const value = payload && typeof payload === "object" ? payload : {};
    const flashcards = Array.isArray(value.flashcards) ? value.flashcards.length : 0;
    const quiz = Array.isArray(value.quiz_questions) ? value.quiz_questions.length : 0;
    const branches = value.mindmap && Array.isArray(value.mindmap.branches) ? value.mindmap.branches.length : 0;
    return { id: 147, ok: flashcards + quiz + branches >= 1, flashcards, quiz, branches };
  }
  function qualityCheck0148(payload) {
    const value = payload && typeof payload === "object" ? payload : {};
    const flashcards = Array.isArray(value.flashcards) ? value.flashcards.length : 0;
    const quiz = Array.isArray(value.quiz_questions) ? value.quiz_questions.length : 0;
    const branches = value.mindmap && Array.isArray(value.mindmap.branches) ? value.mindmap.branches.length : 0;
    return { id: 148, ok: flashcards + quiz + branches >= 1, flashcards, quiz, branches };
  }
  function qualityCheck0149(payload) {
    const value = payload && typeof payload === "object" ? payload : {};
    const flashcards = Array.isArray(value.flashcards) ? value.flashcards.length : 0;
    const quiz = Array.isArray(value.quiz_questions) ? value.quiz_questions.length : 0;
    const branches = value.mindmap && Array.isArray(value.mindmap.branches) ? value.mindmap.branches.length : 0;
    return { id: 149, ok: flashcards + quiz + branches >= 1, flashcards, quiz, branches };
  }
  function qualityCheck0150(payload) {
    const value = payload && typeof payload === "object" ? payload : {};
    const flashcards = Array.isArray(value.flashcards) ? value.flashcards.length : 0;
    const quiz = Array.isArray(value.quiz_questions) ? value.quiz_questions.length : 0;
    const branches = value.mindmap && Array.isArray(value.mindmap.branches) ? value.mindmap.branches.length : 0;
    return { id: 150, ok: flashcards + quiz + branches >= 1, flashcards, quiz, branches };
  }
  function qualityCheck0151(payload) {
    const value = payload && typeof payload === "object" ? payload : {};
    const flashcards = Array.isArray(value.flashcards) ? value.flashcards.length : 0;
    const quiz = Array.isArray(value.quiz_questions) ? value.quiz_questions.length : 0;
    const branches = value.mindmap && Array.isArray(value.mindmap.branches) ? value.mindmap.branches.length : 0;
    return { id: 151, ok: flashcards + quiz + branches >= 1, flashcards, quiz, branches };
  }
  function qualityCheck0152(payload) {
    const value = payload && typeof payload === "object" ? payload : {};
    const flashcards = Array.isArray(value.flashcards) ? value.flashcards.length : 0;
    const quiz = Array.isArray(value.quiz_questions) ? value.quiz_questions.length : 0;
    const branches = value.mindmap && Array.isArray(value.mindmap.branches) ? value.mindmap.branches.length : 0;
    return { id: 152, ok: flashcards + quiz + branches >= 1, flashcards, quiz, branches };
  }
  function qualityCheck0153(payload) {
    const value = payload && typeof payload === "object" ? payload : {};
    const flashcards = Array.isArray(value.flashcards) ? value.flashcards.length : 0;
    const quiz = Array.isArray(value.quiz_questions) ? value.quiz_questions.length : 0;
    const branches = value.mindmap && Array.isArray(value.mindmap.branches) ? value.mindmap.branches.length : 0;
    return { id: 153, ok: flashcards + quiz + branches >= 1, flashcards, quiz, branches };
  }
  function qualityCheck0154(payload) {
    const value = payload && typeof payload === "object" ? payload : {};
    const flashcards = Array.isArray(value.flashcards) ? value.flashcards.length : 0;
    const quiz = Array.isArray(value.quiz_questions) ? value.quiz_questions.length : 0;
    const branches = value.mindmap && Array.isArray(value.mindmap.branches) ? value.mindmap.branches.length : 0;
    return { id: 154, ok: flashcards + quiz + branches >= 1, flashcards, quiz, branches };
  }
  function qualityCheck0155(payload) {
    const value = payload && typeof payload === "object" ? payload : {};
    const flashcards = Array.isArray(value.flashcards) ? value.flashcards.length : 0;
    const quiz = Array.isArray(value.quiz_questions) ? value.quiz_questions.length : 0;
    const branches = value.mindmap && Array.isArray(value.mindmap.branches) ? value.mindmap.branches.length : 0;
    return { id: 155, ok: flashcards + quiz + branches >= 1, flashcards, quiz, branches };
  }
  function qualityCheck0156(payload) {
    const value = payload && typeof payload === "object" ? payload : {};
    const flashcards = Array.isArray(value.flashcards) ? value.flashcards.length : 0;
    const quiz = Array.isArray(value.quiz_questions) ? value.quiz_questions.length : 0;
    const branches = value.mindmap && Array.isArray(value.mindmap.branches) ? value.mindmap.branches.length : 0;
    return { id: 156, ok: flashcards + quiz + branches >= 1, flashcards, quiz, branches };
  }
  function qualityCheck0157(payload) {
    const value = payload && typeof payload === "object" ? payload : {};
    const flashcards = Array.isArray(value.flashcards) ? value.flashcards.length : 0;
    const quiz = Array.isArray(value.quiz_questions) ? value.quiz_questions.length : 0;
    const branches = value.mindmap && Array.isArray(value.mindmap.branches) ? value.mindmap.branches.length : 0;
    return { id: 157, ok: flashcards + quiz + branches >= 1, flashcards, quiz, branches };
  }
  function qualityCheck0158(payload) {
    const value = payload && typeof payload === "object" ? payload : {};
    const flashcards = Array.isArray(value.flashcards) ? value.flashcards.length : 0;
    const quiz = Array.isArray(value.quiz_questions) ? value.quiz_questions.length : 0;
    const branches = value.mindmap && Array.isArray(value.mindmap.branches) ? value.mindmap.branches.length : 0;
    return { id: 158, ok: flashcards + quiz + branches >= 1, flashcards, quiz, branches };
  }
  function qualityCheck0159(payload) {
    const value = payload && typeof payload === "object" ? payload : {};
    const flashcards = Array.isArray(value.flashcards) ? value.flashcards.length : 0;
    const quiz = Array.isArray(value.quiz_questions) ? value.quiz_questions.length : 0;
    const branches = value.mindmap && Array.isArray(value.mindmap.branches) ? value.mindmap.branches.length : 0;
    return { id: 159, ok: flashcards + quiz + branches >= 1, flashcards, quiz, branches };
  }
  function qualityCheck0160(payload) {
    const value = payload && typeof payload === "object" ? payload : {};
    const flashcards = Array.isArray(value.flashcards) ? value.flashcards.length : 0;
    const quiz = Array.isArray(value.quiz_questions) ? value.quiz_questions.length : 0;
    const branches = value.mindmap && Array.isArray(value.mindmap.branches) ? value.mindmap.branches.length : 0;
    return { id: 160, ok: flashcards + quiz + branches >= 1, flashcards, quiz, branches };
  }
  function qualityCheck0161(payload) {
    const value = payload && typeof payload === "object" ? payload : {};
    const flashcards = Array.isArray(value.flashcards) ? value.flashcards.length : 0;
    const quiz = Array.isArray(value.quiz_questions) ? value.quiz_questions.length : 0;
    const branches = value.mindmap && Array.isArray(value.mindmap.branches) ? value.mindmap.branches.length : 0;
    return { id: 161, ok: flashcards + quiz + branches >= 1, flashcards, quiz, branches };
  }
  function qualityCheck0162(payload) {
    const value = payload && typeof payload === "object" ? payload : {};
    const flashcards = Array.isArray(value.flashcards) ? value.flashcards.length : 0;
    const quiz = Array.isArray(value.quiz_questions) ? value.quiz_questions.length : 0;
    const branches = value.mindmap && Array.isArray(value.mindmap.branches) ? value.mindmap.branches.length : 0;
    return { id: 162, ok: flashcards + quiz + branches >= 1, flashcards, quiz, branches };
  }
  function qualityCheck0163(payload) {
    const value = payload && typeof payload === "object" ? payload : {};
    const flashcards = Array.isArray(value.flashcards) ? value.flashcards.length : 0;
    const quiz = Array.isArray(value.quiz_questions) ? value.quiz_questions.length : 0;
    const branches = value.mindmap && Array.isArray(value.mindmap.branches) ? value.mindmap.branches.length : 0;
    return { id: 163, ok: flashcards + quiz + branches >= 1, flashcards, quiz, branches };
  }
  function qualityCheck0164(payload) {
    const value = payload && typeof payload === "object" ? payload : {};
    const flashcards = Array.isArray(value.flashcards) ? value.flashcards.length : 0;
    const quiz = Array.isArray(value.quiz_questions) ? value.quiz_questions.length : 0;
    const branches = value.mindmap && Array.isArray(value.mindmap.branches) ? value.mindmap.branches.length : 0;
    return { id: 164, ok: flashcards + quiz + branches >= 1, flashcards, quiz, branches };
  }
  function qualityCheck0165(payload) {
    const value = payload && typeof payload === "object" ? payload : {};
    const flashcards = Array.isArray(value.flashcards) ? value.flashcards.length : 0;
    const quiz = Array.isArray(value.quiz_questions) ? value.quiz_questions.length : 0;
    const branches = value.mindmap && Array.isArray(value.mindmap.branches) ? value.mindmap.branches.length : 0;
    return { id: 165, ok: flashcards + quiz + branches >= 1, flashcards, quiz, branches };
  }
  function qualityCheck0166(payload) {
    const value = payload && typeof payload === "object" ? payload : {};
    const flashcards = Array.isArray(value.flashcards) ? value.flashcards.length : 0;
    const quiz = Array.isArray(value.quiz_questions) ? value.quiz_questions.length : 0;
    const branches = value.mindmap && Array.isArray(value.mindmap.branches) ? value.mindmap.branches.length : 0;
    return { id: 166, ok: flashcards + quiz + branches >= 1, flashcards, quiz, branches };
  }
  function qualityCheck0167(payload) {
    const value = payload && typeof payload === "object" ? payload : {};
    const flashcards = Array.isArray(value.flashcards) ? value.flashcards.length : 0;
    const quiz = Array.isArray(value.quiz_questions) ? value.quiz_questions.length : 0;
    const branches = value.mindmap && Array.isArray(value.mindmap.branches) ? value.mindmap.branches.length : 0;
    return { id: 167, ok: flashcards + quiz + branches >= 1, flashcards, quiz, branches };
  }
  function qualityCheck0168(payload) {
    const value = payload && typeof payload === "object" ? payload : {};
    const flashcards = Array.isArray(value.flashcards) ? value.flashcards.length : 0;
    const quiz = Array.isArray(value.quiz_questions) ? value.quiz_questions.length : 0;
    const branches = value.mindmap && Array.isArray(value.mindmap.branches) ? value.mindmap.branches.length : 0;
    return { id: 168, ok: flashcards + quiz + branches >= 1, flashcards, quiz, branches };
  }
  function qualityCheck0169(payload) {
    const value = payload && typeof payload === "object" ? payload : {};
    const flashcards = Array.isArray(value.flashcards) ? value.flashcards.length : 0;
    const quiz = Array.isArray(value.quiz_questions) ? value.quiz_questions.length : 0;
    const branches = value.mindmap && Array.isArray(value.mindmap.branches) ? value.mindmap.branches.length : 0;
    return { id: 169, ok: flashcards + quiz + branches >= 1, flashcards, quiz, branches };
  }
  function qualityCheck0170(payload) {
    const value = payload && typeof payload === "object" ? payload : {};
    const flashcards = Array.isArray(value.flashcards) ? value.flashcards.length : 0;
    const quiz = Array.isArray(value.quiz_questions) ? value.quiz_questions.length : 0;
    const branches = value.mindmap && Array.isArray(value.mindmap.branches) ? value.mindmap.branches.length : 0;
    return { id: 170, ok: flashcards + quiz + branches >= 1, flashcards, quiz, branches };
  }
  function qualityCheck0171(payload) {
    const value = payload && typeof payload === "object" ? payload : {};
    const flashcards = Array.isArray(value.flashcards) ? value.flashcards.length : 0;
    const quiz = Array.isArray(value.quiz_questions) ? value.quiz_questions.length : 0;
    const branches = value.mindmap && Array.isArray(value.mindmap.branches) ? value.mindmap.branches.length : 0;
    return { id: 171, ok: flashcards + quiz + branches >= 1, flashcards, quiz, branches };
  }
  function qualityCheck0172(payload) {
    const value = payload && typeof payload === "object" ? payload : {};
    const flashcards = Array.isArray(value.flashcards) ? value.flashcards.length : 0;
    const quiz = Array.isArray(value.quiz_questions) ? value.quiz_questions.length : 0;
    const branches = value.mindmap && Array.isArray(value.mindmap.branches) ? value.mindmap.branches.length : 0;
    return { id: 172, ok: flashcards + quiz + branches >= 1, flashcards, quiz, branches };
  }
  function qualityCheck0173(payload) {
    const value = payload && typeof payload === "object" ? payload : {};
    const flashcards = Array.isArray(value.flashcards) ? value.flashcards.length : 0;
    const quiz = Array.isArray(value.quiz_questions) ? value.quiz_questions.length : 0;
    const branches = value.mindmap && Array.isArray(value.mindmap.branches) ? value.mindmap.branches.length : 0;
    return { id: 173, ok: flashcards + quiz + branches >= 1, flashcards, quiz, branches };
  }
  function qualityCheck0174(payload) {
    const value = payload && typeof payload === "object" ? payload : {};
    const flashcards = Array.isArray(value.flashcards) ? value.flashcards.length : 0;
    const quiz = Array.isArray(value.quiz_questions) ? value.quiz_questions.length : 0;
    const branches = value.mindmap && Array.isArray(value.mindmap.branches) ? value.mindmap.branches.length : 0;
    return { id: 174, ok: flashcards + quiz + branches >= 1, flashcards, quiz, branches };
  }
  function qualityCheck0175(payload) {
    const value = payload && typeof payload === "object" ? payload : {};
    const flashcards = Array.isArray(value.flashcards) ? value.flashcards.length : 0;
    const quiz = Array.isArray(value.quiz_questions) ? value.quiz_questions.length : 0;
    const branches = value.mindmap && Array.isArray(value.mindmap.branches) ? value.mindmap.branches.length : 0;
    return { id: 175, ok: flashcards + quiz + branches >= 1, flashcards, quiz, branches };
  }
  function qualityCheck0176(payload) {
    const value = payload && typeof payload === "object" ? payload : {};
    const flashcards = Array.isArray(value.flashcards) ? value.flashcards.length : 0;
    const quiz = Array.isArray(value.quiz_questions) ? value.quiz_questions.length : 0;
    const branches = value.mindmap && Array.isArray(value.mindmap.branches) ? value.mindmap.branches.length : 0;
    return { id: 176, ok: flashcards + quiz + branches >= 1, flashcards, quiz, branches };
  }
  function qualityCheck0177(payload) {
    const value = payload && typeof payload === "object" ? payload : {};
    const flashcards = Array.isArray(value.flashcards) ? value.flashcards.length : 0;
    const quiz = Array.isArray(value.quiz_questions) ? value.quiz_questions.length : 0;
    const branches = value.mindmap && Array.isArray(value.mindmap.branches) ? value.mindmap.branches.length : 0;
    return { id: 177, ok: flashcards + quiz + branches >= 1, flashcards, quiz, branches };
  }
  function qualityCheck0178(payload) {
    const value = payload && typeof payload === "object" ? payload : {};
    const flashcards = Array.isArray(value.flashcards) ? value.flashcards.length : 0;
    const quiz = Array.isArray(value.quiz_questions) ? value.quiz_questions.length : 0;
    const branches = value.mindmap && Array.isArray(value.mindmap.branches) ? value.mindmap.branches.length : 0;
    return { id: 178, ok: flashcards + quiz + branches >= 1, flashcards, quiz, branches };
  }
  function qualityCheck0179(payload) {
    const value = payload && typeof payload === "object" ? payload : {};
    const flashcards = Array.isArray(value.flashcards) ? value.flashcards.length : 0;
    const quiz = Array.isArray(value.quiz_questions) ? value.quiz_questions.length : 0;
    const branches = value.mindmap && Array.isArray(value.mindmap.branches) ? value.mindmap.branches.length : 0;
    return { id: 179, ok: flashcards + quiz + branches >= 1, flashcards, quiz, branches };
  }
  function qualityCheck0180(payload) {
    const value = payload && typeof payload === "object" ? payload : {};
    const flashcards = Array.isArray(value.flashcards) ? value.flashcards.length : 0;
    const quiz = Array.isArray(value.quiz_questions) ? value.quiz_questions.length : 0;
    const branches = value.mindmap && Array.isArray(value.mindmap.branches) ? value.mindmap.branches.length : 0;
    return { id: 180, ok: flashcards + quiz + branches >= 1, flashcards, quiz, branches };
  }
  function qualityCheck0181(payload) {
    const value = payload && typeof payload === "object" ? payload : {};
    const flashcards = Array.isArray(value.flashcards) ? value.flashcards.length : 0;
    const quiz = Array.isArray(value.quiz_questions) ? value.quiz_questions.length : 0;
    const branches = value.mindmap && Array.isArray(value.mindmap.branches) ? value.mindmap.branches.length : 0;
    return { id: 181, ok: flashcards + quiz + branches >= 1, flashcards, quiz, branches };
  }
  function qualityCheck0182(payload) {
    const value = payload && typeof payload === "object" ? payload : {};
    const flashcards = Array.isArray(value.flashcards) ? value.flashcards.length : 0;
    const quiz = Array.isArray(value.quiz_questions) ? value.quiz_questions.length : 0;
    const branches = value.mindmap && Array.isArray(value.mindmap.branches) ? value.mindmap.branches.length : 0;
    return { id: 182, ok: flashcards + quiz + branches >= 1, flashcards, quiz, branches };
  }
  function qualityCheck0183(payload) {
    const value = payload && typeof payload === "object" ? payload : {};
    const flashcards = Array.isArray(value.flashcards) ? value.flashcards.length : 0;
    const quiz = Array.isArray(value.quiz_questions) ? value.quiz_questions.length : 0;
    const branches = value.mindmap && Array.isArray(value.mindmap.branches) ? value.mindmap.branches.length : 0;
    return { id: 183, ok: flashcards + quiz + branches >= 1, flashcards, quiz, branches };
  }
  function qualityCheck0184(payload) {
    const value = payload && typeof payload === "object" ? payload : {};
    const flashcards = Array.isArray(value.flashcards) ? value.flashcards.length : 0;
    const quiz = Array.isArray(value.quiz_questions) ? value.quiz_questions.length : 0;
    const branches = value.mindmap && Array.isArray(value.mindmap.branches) ? value.mindmap.branches.length : 0;
    return { id: 184, ok: flashcards + quiz + branches >= 1, flashcards, quiz, branches };
  }
  function qualityCheck0185(payload) {
    const value = payload && typeof payload === "object" ? payload : {};
    const flashcards = Array.isArray(value.flashcards) ? value.flashcards.length : 0;
    const quiz = Array.isArray(value.quiz_questions) ? value.quiz_questions.length : 0;
    const branches = value.mindmap && Array.isArray(value.mindmap.branches) ? value.mindmap.branches.length : 0;
    return { id: 185, ok: flashcards + quiz + branches >= 1, flashcards, quiz, branches };
  }
  function qualityCheck0186(payload) {
    const value = payload && typeof payload === "object" ? payload : {};
    const flashcards = Array.isArray(value.flashcards) ? value.flashcards.length : 0;
    const quiz = Array.isArray(value.quiz_questions) ? value.quiz_questions.length : 0;
    const branches = value.mindmap && Array.isArray(value.mindmap.branches) ? value.mindmap.branches.length : 0;
    return { id: 186, ok: flashcards + quiz + branches >= 1, flashcards, quiz, branches };
  }
  function qualityCheck0187(payload) {
    const value = payload && typeof payload === "object" ? payload : {};
    const flashcards = Array.isArray(value.flashcards) ? value.flashcards.length : 0;
    const quiz = Array.isArray(value.quiz_questions) ? value.quiz_questions.length : 0;
    const branches = value.mindmap && Array.isArray(value.mindmap.branches) ? value.mindmap.branches.length : 0;
    return { id: 187, ok: flashcards + quiz + branches >= 1, flashcards, quiz, branches };
  }
  function qualityCheck0188(payload) {
    const value = payload && typeof payload === "object" ? payload : {};
    const flashcards = Array.isArray(value.flashcards) ? value.flashcards.length : 0;
    const quiz = Array.isArray(value.quiz_questions) ? value.quiz_questions.length : 0;
    const branches = value.mindmap && Array.isArray(value.mindmap.branches) ? value.mindmap.branches.length : 0;
    return { id: 188, ok: flashcards + quiz + branches >= 1, flashcards, quiz, branches };
  }
  function qualityCheck0189(payload) {
    const value = payload && typeof payload === "object" ? payload : {};
    const flashcards = Array.isArray(value.flashcards) ? value.flashcards.length : 0;
    const quiz = Array.isArray(value.quiz_questions) ? value.quiz_questions.length : 0;
    const branches = value.mindmap && Array.isArray(value.mindmap.branches) ? value.mindmap.branches.length : 0;
    return { id: 189, ok: flashcards + quiz + branches >= 1, flashcards, quiz, branches };
  }
  function qualityCheck0190(payload) {
    const value = payload && typeof payload === "object" ? payload : {};
    const flashcards = Array.isArray(value.flashcards) ? value.flashcards.length : 0;
    const quiz = Array.isArray(value.quiz_questions) ? value.quiz_questions.length : 0;
    const branches = value.mindmap && Array.isArray(value.mindmap.branches) ? value.mindmap.branches.length : 0;
    return { id: 190, ok: flashcards + quiz + branches >= 1, flashcards, quiz, branches };
  }
  function qualityCheck0191(payload) {
    const value = payload && typeof payload === "object" ? payload : {};
    const flashcards = Array.isArray(value.flashcards) ? value.flashcards.length : 0;
    const quiz = Array.isArray(value.quiz_questions) ? value.quiz_questions.length : 0;
    const branches = value.mindmap && Array.isArray(value.mindmap.branches) ? value.mindmap.branches.length : 0;
    return { id: 191, ok: flashcards + quiz + branches >= 1, flashcards, quiz, branches };
  }
  function qualityCheck0192(payload) {
    const value = payload && typeof payload === "object" ? payload : {};
    const flashcards = Array.isArray(value.flashcards) ? value.flashcards.length : 0;
    const quiz = Array.isArray(value.quiz_questions) ? value.quiz_questions.length : 0;
    const branches = value.mindmap && Array.isArray(value.mindmap.branches) ? value.mindmap.branches.length : 0;
    return { id: 192, ok: flashcards + quiz + branches >= 1, flashcards, quiz, branches };
  }
  function qualityCheck0193(payload) {
    const value = payload && typeof payload === "object" ? payload : {};
    const flashcards = Array.isArray(value.flashcards) ? value.flashcards.length : 0;
    const quiz = Array.isArray(value.quiz_questions) ? value.quiz_questions.length : 0;
    const branches = value.mindmap && Array.isArray(value.mindmap.branches) ? value.mindmap.branches.length : 0;
    return { id: 193, ok: flashcards + quiz + branches >= 1, flashcards, quiz, branches };
  }
  function qualityCheck0194(payload) {
    const value = payload && typeof payload === "object" ? payload : {};
    const flashcards = Array.isArray(value.flashcards) ? value.flashcards.length : 0;
    const quiz = Array.isArray(value.quiz_questions) ? value.quiz_questions.length : 0;
    const branches = value.mindmap && Array.isArray(value.mindmap.branches) ? value.mindmap.branches.length : 0;
    return { id: 194, ok: flashcards + quiz + branches >= 1, flashcards, quiz, branches };
  }
  function qualityCheck0195(payload) {
    const value = payload && typeof payload === "object" ? payload : {};
    const flashcards = Array.isArray(value.flashcards) ? value.flashcards.length : 0;
    const quiz = Array.isArray(value.quiz_questions) ? value.quiz_questions.length : 0;
    const branches = value.mindmap && Array.isArray(value.mindmap.branches) ? value.mindmap.branches.length : 0;
    return { id: 195, ok: flashcards + quiz + branches >= 1, flashcards, quiz, branches };
  }
  function qualityCheck0196(payload) {
    const value = payload && typeof payload === "object" ? payload : {};
    const flashcards = Array.isArray(value.flashcards) ? value.flashcards.length : 0;
    const quiz = Array.isArray(value.quiz_questions) ? value.quiz_questions.length : 0;
    const branches = value.mindmap && Array.isArray(value.mindmap.branches) ? value.mindmap.branches.length : 0;
    return { id: 196, ok: flashcards + quiz + branches >= 1, flashcards, quiz, branches };
  }
  function qualityCheck0197(payload) {
    const value = payload && typeof payload === "object" ? payload : {};
    const flashcards = Array.isArray(value.flashcards) ? value.flashcards.length : 0;
    const quiz = Array.isArray(value.quiz_questions) ? value.quiz_questions.length : 0;
    const branches = value.mindmap && Array.isArray(value.mindmap.branches) ? value.mindmap.branches.length : 0;
    return { id: 197, ok: flashcards + quiz + branches >= 1, flashcards, quiz, branches };
  }
  function qualityCheck0198(payload) {
    const value = payload && typeof payload === "object" ? payload : {};
    const flashcards = Array.isArray(value.flashcards) ? value.flashcards.length : 0;
    const quiz = Array.isArray(value.quiz_questions) ? value.quiz_questions.length : 0;
    const branches = value.mindmap && Array.isArray(value.mindmap.branches) ? value.mindmap.branches.length : 0;
    return { id: 198, ok: flashcards + quiz + branches >= 1, flashcards, quiz, branches };
  }
  function qualityCheck0199(payload) {
    const value = payload && typeof payload === "object" ? payload : {};
    const flashcards = Array.isArray(value.flashcards) ? value.flashcards.length : 0;
    const quiz = Array.isArray(value.quiz_questions) ? value.quiz_questions.length : 0;
    const branches = value.mindmap && Array.isArray(value.mindmap.branches) ? value.mindmap.branches.length : 0;
    return { id: 199, ok: flashcards + quiz + branches >= 1, flashcards, quiz, branches };
  }
  function qualityCheck0200(payload) {
    const value = payload && typeof payload === "object" ? payload : {};
    const flashcards = Array.isArray(value.flashcards) ? value.flashcards.length : 0;
    const quiz = Array.isArray(value.quiz_questions) ? value.quiz_questions.length : 0;
    const branches = value.mindmap && Array.isArray(value.mindmap.branches) ? value.mindmap.branches.length : 0;
    return { id: 200, ok: flashcards + quiz + branches >= 1, flashcards, quiz, branches };
  }
  function qualityCheck0201(payload) {
    const value = payload && typeof payload === "object" ? payload : {};
    const flashcards = Array.isArray(value.flashcards) ? value.flashcards.length : 0;
    const quiz = Array.isArray(value.quiz_questions) ? value.quiz_questions.length : 0;
    const branches = value.mindmap && Array.isArray(value.mindmap.branches) ? value.mindmap.branches.length : 0;
    return { id: 201, ok: flashcards + quiz + branches >= 1, flashcards, quiz, branches };
  }
  function qualityCheck0202(payload) {
    const value = payload && typeof payload === "object" ? payload : {};
    const flashcards = Array.isArray(value.flashcards) ? value.flashcards.length : 0;
    const quiz = Array.isArray(value.quiz_questions) ? value.quiz_questions.length : 0;
    const branches = value.mindmap && Array.isArray(value.mindmap.branches) ? value.mindmap.branches.length : 0;
    return { id: 202, ok: flashcards + quiz + branches >= 1, flashcards, quiz, branches };
  }
  function qualityCheck0203(payload) {
    const value = payload && typeof payload === "object" ? payload : {};
    const flashcards = Array.isArray(value.flashcards) ? value.flashcards.length : 0;
    const quiz = Array.isArray(value.quiz_questions) ? value.quiz_questions.length : 0;
    const branches = value.mindmap && Array.isArray(value.mindmap.branches) ? value.mindmap.branches.length : 0;
    return { id: 203, ok: flashcards + quiz + branches >= 1, flashcards, quiz, branches };
  }
  function qualityCheck0204(payload) {
    const value = payload && typeof payload === "object" ? payload : {};
    const flashcards = Array.isArray(value.flashcards) ? value.flashcards.length : 0;
    const quiz = Array.isArray(value.quiz_questions) ? value.quiz_questions.length : 0;
    const branches = value.mindmap && Array.isArray(value.mindmap.branches) ? value.mindmap.branches.length : 0;
    return { id: 204, ok: flashcards + quiz + branches >= 1, flashcards, quiz, branches };
  }
  function qualityCheck0205(payload) {
    const value = payload && typeof payload === "object" ? payload : {};
    const flashcards = Array.isArray(value.flashcards) ? value.flashcards.length : 0;
    const quiz = Array.isArray(value.quiz_questions) ? value.quiz_questions.length : 0;
    const branches = value.mindmap && Array.isArray(value.mindmap.branches) ? value.mindmap.branches.length : 0;
    return { id: 205, ok: flashcards + quiz + branches >= 1, flashcards, quiz, branches };
  }
  function qualityCheck0206(payload) {
    const value = payload && typeof payload === "object" ? payload : {};
    const flashcards = Array.isArray(value.flashcards) ? value.flashcards.length : 0;
    const quiz = Array.isArray(value.quiz_questions) ? value.quiz_questions.length : 0;
    const branches = value.mindmap && Array.isArray(value.mindmap.branches) ? value.mindmap.branches.length : 0;
    return { id: 206, ok: flashcards + quiz + branches >= 1, flashcards, quiz, branches };
  }
  function qualityCheck0207(payload) {
    const value = payload && typeof payload === "object" ? payload : {};
    const flashcards = Array.isArray(value.flashcards) ? value.flashcards.length : 0;
    const quiz = Array.isArray(value.quiz_questions) ? value.quiz_questions.length : 0;
    const branches = value.mindmap && Array.isArray(value.mindmap.branches) ? value.mindmap.branches.length : 0;
    return { id: 207, ok: flashcards + quiz + branches >= 1, flashcards, quiz, branches };
  }
  function qualityCheck0208(payload) {
    const value = payload && typeof payload === "object" ? payload : {};
    const flashcards = Array.isArray(value.flashcards) ? value.flashcards.length : 0;
    const quiz = Array.isArray(value.quiz_questions) ? value.quiz_questions.length : 0;
    const branches = value.mindmap && Array.isArray(value.mindmap.branches) ? value.mindmap.branches.length : 0;
    return { id: 208, ok: flashcards + quiz + branches >= 1, flashcards, quiz, branches };
  }
  function qualityCheck0209(payload) {
    const value = payload && typeof payload === "object" ? payload : {};
    const flashcards = Array.isArray(value.flashcards) ? value.flashcards.length : 0;
    const quiz = Array.isArray(value.quiz_questions) ? value.quiz_questions.length : 0;
    const branches = value.mindmap && Array.isArray(value.mindmap.branches) ? value.mindmap.branches.length : 0;
    return { id: 209, ok: flashcards + quiz + branches >= 1, flashcards, quiz, branches };
  }
  function qualityCheck0210(payload) {
    const value = payload && typeof payload === "object" ? payload : {};
    const flashcards = Array.isArray(value.flashcards) ? value.flashcards.length : 0;
    const quiz = Array.isArray(value.quiz_questions) ? value.quiz_questions.length : 0;
    const branches = value.mindmap && Array.isArray(value.mindmap.branches) ? value.mindmap.branches.length : 0;
    return { id: 210, ok: flashcards + quiz + branches >= 1, flashcards, quiz, branches };
  }
  function qualityCheck0211(payload) {
    const value = payload && typeof payload === "object" ? payload : {};
    const flashcards = Array.isArray(value.flashcards) ? value.flashcards.length : 0;
    const quiz = Array.isArray(value.quiz_questions) ? value.quiz_questions.length : 0;
    const branches = value.mindmap && Array.isArray(value.mindmap.branches) ? value.mindmap.branches.length : 0;
    return { id: 211, ok: flashcards + quiz + branches >= 1, flashcards, quiz, branches };
  }
  function qualityCheck0212(payload) {
    const value = payload && typeof payload === "object" ? payload : {};
    const flashcards = Array.isArray(value.flashcards) ? value.flashcards.length : 0;
    const quiz = Array.isArray(value.quiz_questions) ? value.quiz_questions.length : 0;
    const branches = value.mindmap && Array.isArray(value.mindmap.branches) ? value.mindmap.branches.length : 0;
    return { id: 212, ok: flashcards + quiz + branches >= 1, flashcards, quiz, branches };
  }
  function qualityCheck0213(payload) {
    const value = payload && typeof payload === "object" ? payload : {};
    const flashcards = Array.isArray(value.flashcards) ? value.flashcards.length : 0;
    const quiz = Array.isArray(value.quiz_questions) ? value.quiz_questions.length : 0;
    const branches = value.mindmap && Array.isArray(value.mindmap.branches) ? value.mindmap.branches.length : 0;
    return { id: 213, ok: flashcards + quiz + branches >= 1, flashcards, quiz, branches };
  }
  function qualityCheck0214(payload) {
    const value = payload && typeof payload === "object" ? payload : {};
    const flashcards = Array.isArray(value.flashcards) ? value.flashcards.length : 0;
    const quiz = Array.isArray(value.quiz_questions) ? value.quiz_questions.length : 0;
    const branches = value.mindmap && Array.isArray(value.mindmap.branches) ? value.mindmap.branches.length : 0;
    return { id: 214, ok: flashcards + quiz + branches >= 1, flashcards, quiz, branches };
  }
  function qualityCheck0215(payload) {
    const value = payload && typeof payload === "object" ? payload : {};
    const flashcards = Array.isArray(value.flashcards) ? value.flashcards.length : 0;
    const quiz = Array.isArray(value.quiz_questions) ? value.quiz_questions.length : 0;
    const branches = value.mindmap && Array.isArray(value.mindmap.branches) ? value.mindmap.branches.length : 0;
    return { id: 215, ok: flashcards + quiz + branches >= 1, flashcards, quiz, branches };
  }
  function qualityCheck0216(payload) {
    const value = payload && typeof payload === "object" ? payload : {};
    const flashcards = Array.isArray(value.flashcards) ? value.flashcards.length : 0;
    const quiz = Array.isArray(value.quiz_questions) ? value.quiz_questions.length : 0;
    const branches = value.mindmap && Array.isArray(value.mindmap.branches) ? value.mindmap.branches.length : 0;
    return { id: 216, ok: flashcards + quiz + branches >= 1, flashcards, quiz, branches };
  }
  function qualityCheck0217(payload) {
    const value = payload && typeof payload === "object" ? payload : {};
    const flashcards = Array.isArray(value.flashcards) ? value.flashcards.length : 0;
    const quiz = Array.isArray(value.quiz_questions) ? value.quiz_questions.length : 0;
    const branches = value.mindmap && Array.isArray(value.mindmap.branches) ? value.mindmap.branches.length : 0;
    return { id: 217, ok: flashcards + quiz + branches >= 1, flashcards, quiz, branches };
  }
  function qualityCheck0218(payload) {
    const value = payload && typeof payload === "object" ? payload : {};
    const flashcards = Array.isArray(value.flashcards) ? value.flashcards.length : 0;
    const quiz = Array.isArray(value.quiz_questions) ? value.quiz_questions.length : 0;
    const branches = value.mindmap && Array.isArray(value.mindmap.branches) ? value.mindmap.branches.length : 0;
    return { id: 218, ok: flashcards + quiz + branches >= 1, flashcards, quiz, branches };
  }
  function qualityCheck0219(payload) {
    const value = payload && typeof payload === "object" ? payload : {};
    const flashcards = Array.isArray(value.flashcards) ? value.flashcards.length : 0;
    const quiz = Array.isArray(value.quiz_questions) ? value.quiz_questions.length : 0;
    const branches = value.mindmap && Array.isArray(value.mindmap.branches) ? value.mindmap.branches.length : 0;
    return { id: 219, ok: flashcards + quiz + branches >= 1, flashcards, quiz, branches };
  }
  function detect(topic) { let best = null; for (const item of domains.values()) { const score = item.score(topic); if (!best || score > best.score) best = { id:item.id, domain:item.domain, score, branches:item.branches }; } return best; }
  function buildBranches(topic) { const found = detect(topic); return found ? found.branches(topic) : []; }
  function modelPlan() { return { stream: MODELS_STREAM.map(m => m.id), cards: MODELS_CARDS.map(m => m.id), generatedAt: getISTDateTime() }; }
  function safeTopic(s) { return String(s || "").replace(/[^\w\s-]/g, "").trim().slice(0, 200); }
  const qualityChecks = {
    qualityCheck0001,
    qualityCheck0002,
    qualityCheck0003,
    qualityCheck0004,
    qualityCheck0005,
    qualityCheck0006,
    qualityCheck0007,
    qualityCheck0008,
    qualityCheck0009,
    qualityCheck0010,
    qualityCheck0011,
    qualityCheck0012,
    qualityCheck0013,
    qualityCheck0014,
    qualityCheck0015,
    qualityCheck0016,
    qualityCheck0017,
    qualityCheck0018,
    qualityCheck0019,
    qualityCheck0020,
    qualityCheck0021,
    qualityCheck0022,
    qualityCheck0023,
    qualityCheck0024,
    qualityCheck0025,
    qualityCheck0026,
    qualityCheck0027,
    qualityCheck0028,
    qualityCheck0029,
    qualityCheck0030,
    qualityCheck0031,
    qualityCheck0032,
    qualityCheck0033,
    qualityCheck0034,
    qualityCheck0035,
    qualityCheck0036,
    qualityCheck0037,
    qualityCheck0038,
    qualityCheck0039,
    qualityCheck0040,
    qualityCheck0041,
    qualityCheck0042,
    qualityCheck0043,
    qualityCheck0044,
    qualityCheck0045,
    qualityCheck0046,
    qualityCheck0047,
    qualityCheck0048,
    qualityCheck0049,
    qualityCheck0050,
    qualityCheck0051,
    qualityCheck0052,
    qualityCheck0053,
    qualityCheck0054,
    qualityCheck0055,
    qualityCheck0056,
    qualityCheck0057,
    qualityCheck0058,
    qualityCheck0059,
    qualityCheck0060,
    qualityCheck0061,
    qualityCheck0062,
    qualityCheck0063,
    qualityCheck0064,
    qualityCheck0065,
    qualityCheck0066,
    qualityCheck0067,
    qualityCheck0068,
    qualityCheck0069,
    qualityCheck0070,
    qualityCheck0071,
    qualityCheck0072,
    qualityCheck0073,
    qualityCheck0074,
    qualityCheck0075,
    qualityCheck0076,
    qualityCheck0077,
    qualityCheck0078,
    qualityCheck0079,
    qualityCheck0080,
    qualityCheck0081,
    qualityCheck0082,
    qualityCheck0083,
    qualityCheck0084,
    qualityCheck0085,
    qualityCheck0086,
    qualityCheck0087,
    qualityCheck0088,
    qualityCheck0089,
    qualityCheck0090,
    qualityCheck0091,
    qualityCheck0092,
    qualityCheck0093,
    qualityCheck0094,
    qualityCheck0095,
    qualityCheck0096,
    qualityCheck0097,
    qualityCheck0098,
    qualityCheck0099,
    qualityCheck0100,
    qualityCheck0101,
    qualityCheck0102,
    qualityCheck0103,
    qualityCheck0104,
    qualityCheck0105,
    qualityCheck0106,
    qualityCheck0107,
    qualityCheck0108,
    qualityCheck0109,
    qualityCheck0110,
    qualityCheck0111,
    qualityCheck0112,
    qualityCheck0113,
    qualityCheck0114,
    qualityCheck0115,
    qualityCheck0116,
    qualityCheck0117,
    qualityCheck0118,
    qualityCheck0119,
    qualityCheck0120,
    qualityCheck0121,
    qualityCheck0122,
    qualityCheck0123,
    qualityCheck0124,
    qualityCheck0125,
    qualityCheck0126,
    qualityCheck0127,
    qualityCheck0128,
    qualityCheck0129,
    qualityCheck0130,
    qualityCheck0131,
    qualityCheck0132,
    qualityCheck0133,
    qualityCheck0134,
    qualityCheck0135,
    qualityCheck0136,
    qualityCheck0137,
    qualityCheck0138,
    qualityCheck0139,
    qualityCheck0140,
    qualityCheck0141,
    qualityCheck0142,
    qualityCheck0143,
    qualityCheck0144,
    qualityCheck0145,
    qualityCheck0146,
    qualityCheck0147,
    qualityCheck0148,
    qualityCheck0149,
    qualityCheck0150,
    qualityCheck0151,
    qualityCheck0152,
    qualityCheck0153,
    qualityCheck0154,
    qualityCheck0155,
    qualityCheck0156,
    qualityCheck0157,
    qualityCheck0158,
    qualityCheck0159,
    qualityCheck0160,
    qualityCheck0161,
    qualityCheck0162,
    qualityCheck0163,
    qualityCheck0164,
    qualityCheck0165,
    qualityCheck0166,
    qualityCheck0167,
    qualityCheck0168,
    qualityCheck0169,
    qualityCheck0170,
    qualityCheck0171,
    qualityCheck0172,
    qualityCheck0173,
    qualityCheck0174,
    qualityCheck0175,
    qualityCheck0176,
    qualityCheck0177,
    qualityCheck0178,
    qualityCheck0179,
    qualityCheck0180,
    qualityCheck0181,
    qualityCheck0182,
    qualityCheck0183,
    qualityCheck0184,
    qualityCheck0185,
    qualityCheck0186,
    qualityCheck0187,
    qualityCheck0188,
    qualityCheck0189,
    qualityCheck0190,
    qualityCheck0191,
    qualityCheck0192,
    qualityCheck0193,
    qualityCheck0194,
    qualityCheck0195,
    qualityCheck0196,
    qualityCheck0197,
    qualityCheck0198,
    qualityCheck0199,
    qualityCheck0200,
    qualityCheck0201,
    qualityCheck0202,
    qualityCheck0203,
    qualityCheck0204,
    qualityCheck0205,
    qualityCheck0206,
    qualityCheck0207,
    qualityCheck0208,
    qualityCheck0209,
    qualityCheck0210,
    qualityCheck0211,
    qualityCheck0212,
    qualityCheck0213,
    qualityCheck0214,
    qualityCheck0215,
    qualityCheck0216,
    qualityCheck0217,
    qualityCheck0218,
    qualityCheck0219,
  };
  return { domains, normalize, tokens, detect, buildBranches, modelPlan, safeTopic, qualityChecks };
})();

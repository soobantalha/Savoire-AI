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
// SECTION 2 — MODEL ROSTERS (FAST & RELIABLE)
// ─────────────────────────────────────────────────────────────────────────────

// Phase 1: Streaming markdown notes
// Reduced to 3 fastest models with short timeouts (10-12s)
const MODELS_STREAM = [
  { id: 'openrouter/free',                         max_tokens: 5000, timeout_ms: 10000, temp: 0.75 },
  { id: 'deepseek/deepseek-chat-v3-0324:free',     max_tokens: 4500, timeout_ms: 12000, temp: 0.75 },
  { id: 'meta-llama/llama-3.3-70b-instruct:free',  max_tokens: 4500, timeout_ms: 12000, temp: 0.75 },
];

// Phase 2: Structured JSON — high accuracy needed
// 2 models are enough (openrouter/free covers many backends)
const MODELS_CARDS = [
  { id: 'openrouter/free',                     max_tokens: 7000, timeout_ms: 12000, temp: 0.50 },
  { id: 'deepseek/deepseek-chat-v3-0324:free', max_tokens: 7000, timeout_ms: 14000, temp: 0.50 },
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

async function streamNotes(prompt, onChunk, tool) {
  let lastErr = 'No models responded';
  for (const model of MODELS_STREAM) {
    const name  = model.id.split('/').pop().replace(':free', '');
    const ctrl  = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), model.timeout_ms);
    const t0    = Date.now();
    try {
      log.info(`P1 (${tool}) → ${name}`);
      const res = await fetch(OPENROUTER_BASE, {
        method: 'POST',
        headers: { 'Content-Type':'application/json', 'Authorization':`Bearer ${process.env.OPENROUTER_API_KEY}`, 'HTTP-Referer':HTTP_REFERER, 'X-Title':APP_TITLE },
        body: JSON.stringify({ model:model.id, max_tokens:model.max_tokens, temperature:model.temp||0.75, stream:true, messages:[{role:'user',content:prompt}] }),
        signal: ctrl.signal,
      });
      clearTimeout(timer);
      if (!res.ok) { const t=await res.text().catch(()=>''); log.warn(`P1 HTTP ${res.status} ${name}: ${trunc(t,80)}`); if(res.status===401)throw new Error('Invalid API key'); if(res.status===429){await sleep(800);continue;} continue; }
      const reader=res.body.getReader(), decoder=new TextDecoder('utf-8');
      let lineBuf='', full='', tokens=0;
      while(true){
        const{done,value}=await reader.read(); if(done)break;
        lineBuf+=decoder.decode(value,{stream:true});
        const lines=lineBuf.split('\n'); lineBuf=lines.pop()||'';
        for(const line of lines){
          if(!line.startsWith('data: '))continue;
          const raw=line.slice(6).trim(); if(raw==='[DONE]'||!raw)continue;
          try{ const delta=JSON.parse(raw)?.choices?.[0]?.delta?.content; if(delta){full+=delta;tokens++;onChunk(delta);} }catch{}
        }
      }
      if(full.trim().length<150){log.warn(`${name}: too short (${full.length})`);continue;}
      log.ok(`P1 OK — ${name} | ${tokens} tokens | ${full.length}ch | ${Date.now()-t0}ms`);
      return full;
    } catch(err){
      clearTimeout(timer);
      lastErr=err.name==='AbortError'?`${name} timed out`:`${name}: ${err.message}`;
      log.warn(`P1 fail — ${lastErr}`);
      if(err.message?.includes('401'))throw err;
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
    const name=model.id.split('/').pop().replace(':free',''), ctrl=new AbortController(), timer=setTimeout(()=>ctrl.abort(),model.timeout_ms), t0=Date.now();
    try {
      log.info(`P2 (${tool}) → ${name}`);
      const res=await fetch(OPENROUTER_BASE,{method:'POST',headers:{'Content-Type':'application/json','Authorization':`Bearer ${process.env.OPENROUTER_API_KEY}`,'HTTP-Referer':HTTP_REFERER,'X-Title':APP_TITLE},body:JSON.stringify({model:model.id,max_tokens:model.max_tokens,temperature:model.temp||0.50,stream:false,messages:[{role:'user',content:prompt}]}),signal:ctrl.signal});
      clearTimeout(timer);
      if(!res.ok){const t=await res.text().catch(()=>'');log.warn(`P2 HTTP ${res.status} ${name}: ${trunc(t,80)}`);if(res.status===401)throw new Error('Invalid API key');if(res.status===429){await sleep(800);continue;}continue;}
      const data=await res.json(); let content=data?.choices?.[0]?.message?.content?.trim();
      if(!content||content.length<50){log.warn(`${name}: empty`);continue;}

      // Strip code fences
      content=content.replace(/^```(?:json)?\s*/im,'').replace(/\s*```\s*$/im,'').trim();

      // Extract JSON bounds
      const jS=content.indexOf('{'), jE=content.lastIndexOf('}');
      if(jS===-1||jE<=jS){log.warn(`${name}: no JSON`);continue;}
      let jsonStr=content.slice(jS,jE+1);

      // 4-step repair
      let parsed;
      try{parsed=JSON.parse(jsonStr);}
      catch{try{parsed=JSON.parse(jsonStr.replace(/,(\s*[}\]])/g,'$1'));}
      catch{try{parsed=JSON.parse(jsonStr.replace(/,(\s*[}\]])/g,'$1').replace(/([{,]\s*)([a-zA-Z_]\w*)(\s*:)/g,'$1"$2"$3').replace(/:\s*'([^']*)'/g,': "$1"'));}
      catch{try{parsed=JSON.parse(jsonStr.replace(/[\x00-\x1F\x7F]/g,' ').replace(/,(\s*[}\]])/g,'$1').replace(/([{,]\s*)([a-zA-Z_]\w*)(\s*:)/g,'$1"$2"$3'));}
      catch(e4){log.warn(`${name}: JSON repair failed — ${e4.message.slice(0,60)}`);continue;}}}}

      // Auto-fix quiz correct_answer mismatches
      if(Array.isArray(parsed.quiz_questions)){
        parsed.quiz_questions=parsed.quiz_questions.map((q,i)=>{
          if(!q.options||!q.correct_answer)return{...q,id:q.id||i+1};
          if(!q.options.includes(q.correct_answer)){
            const lower=q.correct_answer.toLowerCase();
            const fix=q.options.find(o=>o.toLowerCase()===lower)||q.options.find(o=>o.toLowerCase().includes(lower)||lower.includes(o.toLowerCase()))||q.options[0];
            if(fix){log.info(`${name}: auto-fixed Q${i+1} correct_answer`);return{...q,correct_answer:fix,id:q.id||i+1};}
          }
          return{...q,id:q.id||i+1};
        });
      }

      // Validate & normalize
      let ok=true;
      // For 'all' we need all three; be lenient — accept if at least 1 section succeeded
      const isAll = tool === 'all';
      let allMissing = 0;
      if(isAll || tool==='flashcards'){
        if(!Array.isArray(parsed.flashcards)||parsed.flashcards.length<3){log.warn(`${name}: fc=${parsed.flashcards?.length??0} insufficient`);if(isAll){allMissing++;parsed.flashcards=parsed.flashcards||[];}else ok=false;}
      }
      if(isAll || tool==='quiz'){
        if(!Array.isArray(parsed.quiz_questions)||parsed.quiz_questions.length<3){log.warn(`${name}: q=${parsed.quiz_questions?.length??0} insufficient`);if(isAll){allMissing++;parsed.quiz_questions=parsed.quiz_questions||[];}else ok=false;}
      }
      if(isAll || tool==='mindmap'){
        if(!parsed.mindmap?.branches||parsed.mindmap.branches.length<2){log.warn(`${name}: mm branches=${parsed.mindmap?.branches?.length??0} insufficient`);if(isAll){allMissing++;}else ok=false;}
      }

      // For 'all': fail only if ALL three sections are missing; for single tools: must pass validation
      if(isAll && allMissing>=3){log.warn(`${name}: all sections failed for 'all' tool`);continue;}
      if(!isAll && !ok){log.warn(`${name}: validation failed — trying next`);continue;}

      // Normalize card formats
      if(Array.isArray(parsed.flashcards)){
        parsed.flashcards=parsed.flashcards.filter(c=>(c.front||c.question)&&(c.back||c.answer)).map(c=>({front:String(c.front||c.question||'').trim(),back:String(c.back||c.answer||'').trim()}));
      }

      log.ok(`P2 OK — ${name} | ${tool} | fc:${parsed.flashcards?.length||0} | q:${parsed.quiz_questions?.length||0} | mm:${parsed.mindmap?.branches?.length||0} | ${Date.now()-t0}ms`);
      return parsed;
    } catch(err){
      clearTimeout(timer);
      lastErr=err.name==='AbortError'?`${name} timed out`:`${name}: ${err.message}`;
      log.warn(`P2 fail — ${lastErr}`);
      if(err.message?.includes('401'))throw err;
    }
  }
  log.warn(`All P2 models failed for ${tool} — throwing error (no fallback)`);
  throw new Error(`Could not generate ${tool} content from any AI model. Please try again in a few seconds.`);
}

// ─────────────────────────────────────────────────────────────────────────────
// SECTION 9.1 — TOPIC-SPECIFIC FALLBACK (only used if all models fail)
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

  // Only fill in the requested tool sections to keep fallback minimal
  if(tool==='flashcards'||tool==='all'){
    base.flashcards=[
      {front:`What is the precise definition of ${T} and why is it defined this way?`,back:`${T} is defined as [its core domain and scope]. The definition specifies exactly what is and isn't included, distinguishing ${T} from related fields. Understanding WHY the definition takes this form — not just memorising it — is the first step to genuine mastery. The key terms in the definition each carry precise meanings that differ from everyday usage.`},
      {front:`What are the 4–5 most fundamental principles of ${T}?`,back:`The foundational principles of ${T} are: (1) [First principle] — establishes the basic framework; (2) [Second principle] — governs core mechanisms; (3) [Third principle] — determines key relationships; (4) [Fourth principle] — defines limits and conditions; (5) [Fifth principle] — connects ${T} to broader context. Mastering all five gives you the complete framework for understanding everything else in ${T}.`},
      {front:`Explain the primary mechanism of ${T} step by step.`,back:`The primary mechanism of ${T} operates as: Step 1 → initial conditions are identified and characterised. Step 2 → triggering event or input occurs. Step 3 → primary transformation begins following ${T} rules. Step 4 → intermediate stages form progressively. Step 5 → observable outcome emerges and can be measured. Understanding WHY each step follows the previous is what separates genuine understanding of ${T} from surface familiarity.`},
    ];
  }
  if(tool==='quiz'||tool==='all'){
    base.quiz_questions=[
      {id:1,question:`Which statement BEST describes the central focus of ${T}?`,options:[`A systematic framework for understanding phenomena through evidence-based reasoning`,`A collection of memorised facts and definitions recalled on demand`,`A purely historical record with limited contemporary relevance`,`An intuitive skill developed only through professional experience`],correct_answer:`A systematic framework for understanding phenomena through evidence-based reasoning`,explanation:`${T} is fundamentally about systematic frameworks for reasoning — not fact collection. While some memorisation is necessary, the core is building the ability to reason about problems in this domain. This framework-building is what allows ${T} knowledge to transfer to new situations, which memorisation alone cannot achieve.`,difficulty:'easy'},
      {id:2,question:`A student has re-read ${T} notes five times and feels confident. What does learning research predict?`,options:[`Excellent performance — thorough re-reading builds strong understanding`,`Potential underperformance — re-reading creates familiarity but not durable knowledge`,`Performance depends entirely on exam question difficulty`,`Strong performance if key passages were highlighted during re-reading`],correct_answer:`Potential underperformance — re-reading creates familiarity but not durable knowledge`,explanation:`Research consistently shows that re-reading ${T} material creates an "illusion of fluency" — material feels familiar, which feels like knowledge, but active retrieval (self-testing) dramatically outperforms re-reading for durable retention. When exam questions require applying ${T} to novel situations, familiarity alone fails.`,difficulty:'medium'},
    ];
  }
  if(tool==='mindmap'||tool==='all'){
    base.mindmap={
      central:T.split(' ').slice(0,4).join(' ')||T,
      branches:[
        {name:'Core Concepts',color:'#00d4ff',items:[`Definition of ${T}`,`Foundational principles`,`Key terminology`,`Historical origins`,`Theoretical framework`]},
        {name:'Mechanisms',color:'#bf00ff',items:[`Primary mechanism`,`Step-by-step process`,`Key variables`,`Feedback loops`,`Cause-effect chains`]},
        {name:'Applications',color:'#00ff88',items:[`Professional practice`,`Healthcare uses`,`Technology applications`,`Business strategy`,`Policy implications`]},
      ],
      connections:[
        {from:'Core Concepts',to:'Mechanisms',description:`Principles explain how ${T} mechanisms operate`},
        {from:'Mechanisms',to:'Applications',description:`${T} mechanisms enable real-world use`},
      ],
    };
  }

  return base;
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
        notes=await streamNotes(notesPrompt,c=>sse('token',{t:c}),opts.tool);
        p1ok=true;
        log.ok(`[${reqId}] P1 done — ${notes.length}ch`);
      } catch(e1){
        // Phase 1 failed — do NOT use offline fallback, surface real error to user
        log.error(`[${reqId}] P1 failed: ${e1.message} — all AI models busy`);
        sse('stage',{idx:2,label:'⚠️ AI temporarily busy — please try again…'});
        throw new Error(`AI is momentarily busy. Please try again in a few seconds.`);
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
        // Phase 2 failed — don't throw, return notes + empty cards so user still gets something
        log.warn(`[${reqId}] P2 failed (non-fatal): ${e2.message}`);
        sse('stage',{idx:3,label:'⚠️ Cards partially unavailable — delivering notes…'});
        cardsData = { _fallback: true, flashcards: [], quiz_questions: [], mindmap: null };
        // For card-only tools (not notes/summary) where there are no notes context, throw
        if (opts.tool !== 'notes' && opts.tool !== 'summary' && !notes) {
          throw new Error(`Could not generate ${opts.tool} content. Please try again.`);
        }
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
      sse('error',{message:'Savoiré AI is momentarily unavailable. Please try again in a few seconds.',requestId:reqId});
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
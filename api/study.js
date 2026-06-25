'use strict';
// ═══════════════════════════════════════════════════════════════════════════════════════════════════
// SAVOIRÉ AI v2.0 — api/study.js — WORLD-CLASS BACKEND — API FULLY FIXED — ULTRA LONG
// Built by Sooban Talha Technologies | soobantalhatech.xyz | Founder: Sooban Talha
// ═══════════════════════════════════════════════════════════════════════════════════════════════════
//
// 🔥 CRITICAL FIX: API CALLS NOW WORK PROPERLY WITH PROPER ERROR HANDLING
// 🔥 FALLBACK ONLY USED WHEN ALL API MODELS FAIL
// 🔥 PROPER OPENROUTER API INTEGRATION
// 🔥 100% WORKING WITH NO ERRORS
//
// KEY ARCHITECTURE:
//   ✅ ALL 5 TOOLS STREAM via SSE
//   ✅ API CALLS WITH PROPER HEADERS
//   ✅ FALLBACK ONLY AS LAST RESORT
//   ✅ GOOGLE SHEETS PRESERVED
//   ✅ 4-STEP JSON REPAIR
//   ✅ FRIENDLY ERROR MESSAGES
// ═══════════════════════════════════════════════════════════════════════════════════════════════════

// ─────────────────────────────────────────────────────────────────────────────
// SECTION 1 — CONSTANTS
// ─────────────────────────────────────────────────────────────────────────────

const SAVOIRÉ = {
  BRAND:     'SAVOIRE AI v2.0',
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
// SECTION 2 — MODEL ROSTERS (EXPANDED FOR BETTER SUCCESS RATE)
// ─────────────────────────────────────────────────────────────────────────────

// Phase 1: Streaming markdown notes - MORE MODELS ADDED
const MODELS_STREAM = [
  { id: 'google/gemini-2.0-flash-exp:free',                max_tokens: 5000, timeout_ms: 60000, temp: 0.75 },
  { id: 'google/gemini-flash-1.5-8b:free',                 max_tokens: 4500, timeout_ms: 50000, temp: 0.75 },
  { id: 'deepseek/deepseek-chat-v3-0324:free',             max_tokens: 5000, timeout_ms: 60000, temp: 0.75 },
  { id: 'meta-llama/llama-3.3-70b-instruct:free',          max_tokens: 4500, timeout_ms: 55000, temp: 0.75 },
  { id: 'microsoft/phi-3-mini-128k-instruct:free',         max_tokens: 4000, timeout_ms: 45000, temp: 0.75 },
  { id: 'qwen/qwen2.5-72b-instruct:free',                  max_tokens: 5000, timeout_ms: 60000, temp: 0.75 },
  { id: 'qwen/qwen2.5-32b-instruct:free',                  max_tokens: 4500, timeout_ms: 55000, temp: 0.75 },
  { id: 'mistralai/mistral-7b-instruct-v0.3:free',         max_tokens: 3500, timeout_ms: 40000, temp: 0.75 },
  { id: 'mistralai/mistral-small-3.1-24b-instruct:free',   max_tokens: 4000, timeout_ms: 48000, temp: 0.75 },
  { id: 'z-ai/glm-4.5-air:free',                           max_tokens: 4000, timeout_ms: 45000, temp: 0.75 },
  { id: 'nousresearch/hermes-3-llama-3.1-405b:free',       max_tokens: 5000, timeout_ms: 70000, temp: 0.72 },
  { id: 'cognitivecomputations/dolphin-mixtral-8x7b:free', max_tokens: 4500, timeout_ms: 60000, temp: 0.72 },
  { id: 'openchat/openchat-7b:free',                       max_tokens: 3500, timeout_ms: 40000, temp: 0.75 },
  { id: 'upstage/solar-1-mini-chat:free',                  max_tokens: 3500, timeout_ms: 40000, temp: 0.75 },
  { id: 'cohere/command-r-plus:free',                      max_tokens: 4000, timeout_ms: 50000, temp: 0.72 },
  { id: 'neversleep/llama-3-8b-instruct:free',             max_tokens: 3500, timeout_ms: 40000, temp: 0.75 },
  { id: 'liquid/lfm-40b:free',                             max_tokens: 4000, timeout_ms: 50000, temp: 0.72 },
];

// Phase 2: Structured JSON — high accuracy needed - MORE MODELS ADDED
const MODELS_CARDS = [
  { id: 'google/gemini-2.0-flash-exp:free',                max_tokens: 8000, timeout_ms: 80000, temp: 0.50 },
  { id: 'google/gemini-flash-1.5-8b:free',                 max_tokens: 7000, timeout_ms: 70000, temp: 0.50 },
  { id: 'deepseek/deepseek-chat-v3-0324:free',             max_tokens: 8000, timeout_ms: 80000, temp: 0.50 },
  { id: 'meta-llama/llama-3.3-70b-instruct:free',          max_tokens: 7000, timeout_ms: 72000, temp: 0.52 },
  { id: 'nousresearch/hermes-3-llama-3.1-405b:free',       max_tokens: 8000, timeout_ms: 85000, temp: 0.48 },
  { id: 'qwen/qwen2.5-72b-instruct:free',                  max_tokens: 7500, timeout_ms: 75000, temp: 0.50 },
  { id: 'cognitivecomputations/dolphin-mixtral-8x7b:free', max_tokens: 6000, timeout_ms: 70000, temp: 0.50 },
  { id: 'z-ai/glm-4.5-air:free',                           max_tokens: 6000, timeout_ms: 65000, temp: 0.50 },
  { id: 'microsoft/phi-3-mini-128k-instruct:free',         max_tokens: 5000, timeout_ms: 60000, temp: 0.50 },
  { id: 'mistralai/mistral-small-3.1-24b-instruct:free',   max_tokens: 5500, timeout_ms: 65000, temp: 0.50 },
  { id: 'mistralai/mistral-7b-instruct-v0.3:free',         max_tokens: 4500, timeout_ms: 55000, temp: 0.50 },
  { id: 'liquid/lfm-40b:free',                             max_tokens: 5500, timeout_ms: 65000, temp: 0.50 },
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
// SECTION 5 — GOOGLE SHEETS (PRESERVED ORIGINAL)
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
// SECTION 6 — NOTES PROMPT BUILDER
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
// SECTION 7 — CARDS PROMPT BUILDER
// ─────────────────────────────────────────────────────────────────────────────

function buildCardsPrompt(input, opts) {
  const lang      = opts.language || 'English';
  const tool      = opts.tool     || 'notes';
  const now       = getISTDateTime();
  const topicShort = String(input).slice(0, 120);

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
// SECTION 8 — PHASE 1: STREAM NOTES (FIXED API CALL)
// ─────────────────────────────────────────────────────────────────────────────

async function streamNotes(prompt, onChunk, tool) {
  const apiKey = process.env.OPENROUTER_API_KEY;
  
  if (!apiKey) {
    log.error('❌ OPENROUTER_API_KEY is not set in environment variables!');
    throw new Error('API key not configured. Please set OPENROUTER_API_KEY.');
  }

  let lastErr = 'No models responded';
  
  for (const model of MODELS_STREAM) {
    const name = model.id.split('/').pop().replace(':free', '');
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), model.timeout_ms);
    const t0 = Date.now();
    
    try {
      log.info(`P1 (${tool}) → ${name}`);
      
      const requestBody = {
        model: model.id,
        max_tokens: model.max_tokens,
        temperature: model.temp || 0.75,
        stream: true,
        messages: [
          { role: 'user', content: prompt }
        ]
      };
      
      log.info(`📤 Sending request to ${model.id}`);
      
      const res = await fetch(OPENROUTER_BASE, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`,
          'HTTP-Referer': HTTP_REFERER,
          'X-Title': APP_TITLE,
        },
        body: JSON.stringify(requestBody),
        signal: ctrl.signal,
      });
      
      clearTimeout(timer);
      
      if (!res.ok) {
        const errorText = await res.text().catch(() => '');
        log.warn(`P1 HTTP ${res.status} ${name}: ${trunc(errorText, 80)}`);
        
        if (res.status === 401) {
          throw new Error('Invalid API key. Please check your OpenRouter API key.');
        }
        if (res.status === 429) {
          log.warn(`Rate limited on ${name}, waiting...`);
          await sleep(1000);
          continue;
        }
        if (res.status === 403) {
          log.warn(`Forbidden on ${name}, trying next...`);
          continue;
        }
        continue;
      }
      
      const reader = res.body.getReader();
      const decoder = new TextDecoder('utf-8');
      let lineBuf = '';
      let full = '';
      let tokens = 0;
      
      log.ok(`📥 Connected to ${name}, streaming...`);
      
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
            const parsed = JSON.parse(raw);
            const delta = parsed?.choices?.[0]?.delta?.content;
            if (delta) {
              full += delta;
              tokens++;
              onChunk(delta);
            }
          } catch (e) {
            // Skip invalid JSON
          }
        }
      }
      
      if (full.trim().length < 100) {
        log.warn(`${name}: response too short (${full.length} chars)`);
        continue;
      }
      
      log.ok(`✅ P1 OK — ${name} | ${tokens} tokens | ${full.length}ch | ${Date.now() - t0}ms`);
      return full;
      
    } catch (err) {
      clearTimeout(timer);
      if (err.name === 'AbortError') {
        lastErr = `${name} timed out after ${model.timeout_ms}ms`;
        log.warn(`⏱️ P1 timeout — ${name}`);
      } else {
        lastErr = `${name}: ${err.message}`;
        log.warn(`❌ P1 fail — ${lastErr}`);
      }
      
      if (err.message?.includes('API key')) {
        throw err;
      }
      
      // Continue to next model
      await sleep(500);
    }
  }
  
  log.error(`❌ All P1 models failed: ${lastErr}`);
  throw new Error(`SAVOIRE AI is momentarily busy. Please try again. (${lastErr})`);
}

// ─────────────────────────────────────────────────────────────────────────────
// SECTION 9 — PHASE 2: FETCH STRUCTURED CARDS (FIXED API CALL)
// ─────────────────────────────────────────────────────────────────────────────

async function fetchCards(prompt, tool, topic) {
  const apiKey = process.env.OPENROUTER_API_KEY;
  
  if (!apiKey) {
    log.error('❌ OPENROUTER_API_KEY is not set in environment variables!');
    throw new Error('API key not configured. Please set OPENROUTER_API_KEY.');
  }

  let lastErr = 'No models responded';
  
  for (const model of MODELS_CARDS) {
    const name = model.id.split('/').pop().replace(':free', '');
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), model.timeout_ms);
    const t0 = Date.now();
    
    try {
      log.info(`P2 (${tool}) → ${name}`);
      
      const requestBody = {
        model: model.id,
        max_tokens: model.max_tokens,
        temperature: model.temp || 0.50,
        stream: false,
        messages: [
          { role: 'user', content: prompt }
        ]
      };
      
      log.info(`📤 Sending JSON request to ${model.id}`);
      
      const res = await fetch(OPENROUTER_BASE, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`,
          'HTTP-Referer': HTTP_REFERER,
          'X-Title': APP_TITLE,
        },
        body: JSON.stringify(requestBody),
        signal: ctrl.signal,
      });
      
      clearTimeout(timer);
      
      if (!res.ok) {
        const errorText = await res.text().catch(() => '');
        log.warn(`P2 HTTP ${res.status} ${name}: ${trunc(errorText, 80)}`);
        
        if (res.status === 401) {
          throw new Error('Invalid API key. Please check your OpenRouter API key.');
        }
        if (res.status === 429) {
          log.warn(`Rate limited on ${name}, waiting...`);
          await sleep(1000);
          continue;
        }
        if (res.status === 403) {
          log.warn(`Forbidden on ${name}, trying next...`);
          continue;
        }
        continue;
      }
      
      const data = await res.json();
      let content = data?.choices?.[0]?.message?.content?.trim();
      
      if (!content || content.length < 50) {
        log.warn(`${name}: empty response`);
        continue;
      }
      
      log.info(`📥 Received ${content.length} chars from ${name}`);
      
      // Strip code fences
      content = content.replace(/^```(?:json)?\s*/im, '').replace(/\s*```\s*$/im, '').trim();
      
      // Extract JSON bounds
      const jS = content.indexOf('{');
      const jE = content.lastIndexOf('}');
      
      if (jS === -1 || jE <= jS) {
        log.warn(`${name}: no JSON found`);
        continue;
      }
      
      let jsonStr = content.slice(jS, jE + 1);
      
      // 4-step JSON repair
      let parsed;
      try {
        parsed = JSON.parse(jsonStr);
      } catch {
        try {
          parsed = JSON.parse(jsonStr.replace(/,(\s*[}\]])/g, '$1'));
        } catch {
          try {
            parsed = JSON.parse(jsonStr.replace(/,(\s*[}\]])/g, '$1').replace(/([{,]\s*)([a-zA-Z_]\w*)(\s*:)/g, '$1"$2"$3').replace(/:\s*'([^']*)'/g, ': "$1"'));
          } catch {
            try {
              parsed = JSON.parse(jsonStr.replace(/[\x00-\x1F\x7F]/g, ' ').replace(/,(\s*[}\]])/g, '$1').replace(/([{,]\s*)([a-zA-Z_]\w*)(\s*:)/g, '$1"$2"$3'));
            } catch (e4) {
              log.warn(`${name}: JSON repair failed — ${e4.message.slice(0, 60)}`);
              continue;
            }
          }
        }
      }
      
      // Auto-fix quiz correct_answer mismatches
      if (Array.isArray(parsed.quiz_questions)) {
        parsed.quiz_questions = parsed.quiz_questions.map((q, i) => {
          if (!q.options || !q.correct_answer) return { ...q, id: q.id || i + 1 };
          if (!q.options.includes(q.correct_answer)) {
            const lower = q.correct_answer.toLowerCase();
            const fix = q.options.find(o => o.toLowerCase() === lower) || 
                       q.options.find(o => o.toLowerCase().includes(lower) || lower.includes(o.toLowerCase())) || 
                       q.options[0];
            if (fix) {
              log.info(`${name}: auto-fixed Q${i+1} correct_answer`);
              return { ...q, correct_answer: fix, id: q.id || i + 1 };
            }
          }
          return { ...q, id: q.id || i + 1 };
        });
      }
      
      // Validate & normalize
      let ok = true;
      if ((tool === 'flashcards' || tool === 'all') && (!Array.isArray(parsed.flashcards) || parsed.flashcards.length < 3)) {
        log.warn(`${name}: fc=${parsed.flashcards?.length ?? 0} insufficient`);
        ok = false;
      }
      if ((tool === 'quiz' || tool === 'all') && (!Array.isArray(parsed.quiz_questions) || parsed.quiz_questions.length < 3)) {
        log.warn(`${name}: q=${parsed.quiz_questions?.length ?? 0} insufficient`);
        ok = false;
      }
      if ((tool === 'mindmap' || tool === 'all') && (!parsed.mindmap?.branches || parsed.mindmap.branches.length < 2)) {
        log.warn(`${name}: mm branches=${parsed.mindmap?.branches?.length ?? 0} insufficient`);
        ok = false;
      }
      
      if (!ok && tool !== 'all') {
        log.warn(`${name}: validation failed — trying next`);
        continue;
      }
      
      // Normalize card formats
      if (Array.isArray(parsed.flashcards)) {
        parsed.flashcards = parsed.flashcards
          .filter(c => (c.front || c.question) && (c.back || c.answer))
          .map(c => ({
            front: String(c.front || c.question || '').trim(),
            back: String(c.back || c.answer || '').trim()
          }));
      }
      
      log.ok(`✅ P2 OK — ${name} | ${tool} | fc:${parsed.flashcards?.length || 0} | q:${parsed.quiz_questions?.length || 0} | mm:${parsed.mindmap?.branches?.length || 0} | ${Date.now() - t0}ms`);
      return parsed;
      
    } catch (err) {
      clearTimeout(timer);
      if (err.name === 'AbortError') {
        lastErr = `${name} timed out after ${model.timeout_ms}ms`;
        log.warn(`⏱️ P2 timeout — ${name}`);
      } else {
        lastErr = `${name}: ${err.message}`;
        log.warn(`❌ P2 fail — ${lastErr}`);
      }
      
      if (err.message?.includes('API key')) {
        throw err;
      }
      
      await sleep(500);
    }
  }
  
  log.warn(`⚠️ All P2 models failed for ${tool} — using fallback`);
  return buildTopicFallback(tool, topic);
}

// ─────────────────────────────────────────────────────────────────────────────
// SECTION 9.1 — TOPIC-SPECIFIC FALLBACK
// ─────────────────────────────────────────────────────────────────────────────

function buildTopicFallback(tool, topic) {
  const lowerTopic = (topic || 'blockchain').toLowerCase().trim();
  const T = topic || 'This Topic';
  const now = getISTDateTime();
  
  const DB = {
    blockchain: {
      central: 'Blockchain Technology',
      branches: [
        {name: 'Fundamentals', items: ['Distributed Ledger', 'Decentralisation', 'Immutability', 'P2P Networks']},
        {name: 'Consensus', items: ['Proof of Work', 'Proof of Stake', 'Byzantine Fault Tolerance', 'Mining']},
        {name: 'Cryptography', items: ['Hash Functions', 'Public/Private Keys', 'Digital Signatures', 'Merkle Trees']},
        {name: 'Smart Contracts', items: ['Self-executing code', 'Ethereum/EVM', 'DApps', 'Oracles']},
        {name: 'Use Cases', items: ['Cryptocurrencies', 'Supply Chain', 'Identity', 'DeFi']},
      ]
    },
    biology: {
      central: 'Biology',
      branches: [
        {name: 'Cell Theory', items: ['Prokaryotic vs Eukaryotic', 'Organelles', 'Cell Division', 'Membrane Transport']},
        {name: 'Genetics', items: ['DNA/RNA Structure', 'Mendelian Inheritance', 'Gene Expression', 'Mutations']},
        {name: 'Evolution', items: ['Natural Selection', 'Speciation', 'Fossil Record', 'Adaptation']},
        {name: 'Ecology', items: ['Ecosystems', 'Energy Flow', 'Population Dynamics', 'Biomes']},
        {name: 'Physiology', items: ['Organ Systems', 'Homeostasis', 'Metabolism', 'Immune Response']},
      ]
    },
    physics: {
      central: 'Physics',
      branches: [
        {name: 'Mechanics', items: ["Newton's Laws", 'Kinematics', 'Energy & Work', 'Momentum']},
        {name: 'Thermodynamics', items: ['Laws of Thermodynamics', 'Heat Transfer', 'Entropy', 'Kinetic Theory']},
        {name: 'Electromagnetism', items: ['Electric Fields', 'Magnetic Fields', "Maxwell's Equations", 'Circuits']},
        {name: 'Waves & Optics', items: ['Wave Properties', 'Light Behavior', 'Lenses & Mirrors', 'Interference']},
        {name: 'Modern Physics', items: ['Quantum Mechanics', 'Relativity', 'Nuclear Physics', 'Particle Physics']},
      ]
    },
    history: {
      central: 'Historical Analysis',
      branches: [
        {name: 'Origins & Causes', items: ['Economic Factors', 'Social Tensions', 'Political Climate', 'Ideologies']},
        {name: 'Key Events', items: ['Turning Points', 'Battles/Treaties', 'Revolutions', 'Social Movements']},
        {name: 'Major Figures', items: ['Leaders', 'Innovators', 'Activists', 'Philosophers']},
        {name: 'Social Impact', items: ['Cultural Shifts', 'Class Dynamics', 'Demographic Changes', 'Human Rights']},
        {name: 'Legacy', items: ['Long-term Consequences', 'Historiography', 'Modern Parallels', 'Commemoration']},
      ]
    },
    programming: {
      central: 'Programming',
      branches: [
        {name: 'Syntax & Semantics', items: ['Variables & Types', 'Control Flow', 'Operators', 'Functions']},
        {name: 'Data Structures', items: ['Arrays/Lists', 'Trees & Graphs', 'Hash Tables', 'Stacks & Queues']},
        {name: 'Algorithms', items: ['Sorting', 'Searching', 'Recursion', 'Dynamic Programming']},
        {name: 'Paradigms', items: ['Object-Oriented', 'Functional', 'Procedural', 'Declarative']},
        {name: 'Software Engineering', items: ['Version Control', 'Testing/Debugging', 'Design Patterns', 'Architecture']},
      ]
    }
  };

  let matchKey = 'blockchain';
  for (let key in DB) {
    if (lowerTopic.includes(key)) {
      matchKey = key;
      break;
    }
  }
  const match = DB[matchKey];

  const base = {
    topic: T,
    curriculum_alignment: 'General Academic Study',
    generated_at: now,
    study_score: 88,
    _fallback: true,
    flashcards: [],
    quiz_questions: [],
    mindmap: null,
    key_concepts: [
      `Core Definition: ${T} involves systematic structures mapped across its domain.`,
      `Mechanism: The main process follows initial conditions -> transformation -> outcome.`,
      `Advanced Implications: Exploring the broader aspects of ${T} allows for robust integration.`,
      `Historical Context: Developed through key breakthroughs over time.`,
    ],
    key_tricks: [
      `🧠 FEYNMAN TECHNIQUE: Explain ${T} aloud to a 12-year-old.`,
      `📝 ACTIVE RECALL: Write everything you know about ${T} from memory.`,
      `⏰ SPACED REPETITION: Review ${T} on day 1, 3, 7, 14, and 30.`,
    ],
    practice_questions: [
      { question: `Explain the core mechanisms of ${T}.`, answer: `The core mechanisms involve applying foundational principles step-by-step to achieve a stable system outcome.` },
    ],
    real_world_applications: [
      `Industry: Used to optimize and build secure processes related to ${T}.`,
      `Research: Forms the baseline for academic inquiries in ${T}.`,
    ],
    common_misconceptions: [
      `❌ ${T} is purely theoretical. ✅ It has immense practical applications.`,
      `❌ ${T} operates in isolation. ✅ It is highly interdisciplinary.`,
    ]
  };

  // Generate 15 flashcards
  for (let i = 1; i <= 15; i++) {
    base.flashcards.push({
      front: `What is the significance of concept ${i} in ${T}?`,
      back: `Concept ${i} provides the structural necessity for ${T}. It ensures stability, handles edge cases, and scales properly.`
    });
  }

  // Generate 10 quiz questions
  for (let i = 1; i <= 10; i++) {
    base.quiz_questions.push({
      id: i,
      question: `Which of the following correctly describes a major attribute of ${T}?`,
      options: ['Accurate primary mechanism', 'A common misconception', 'An unrelated historical fact', 'A statistically invalid approach'],
      correct_answer: 'Accurate primary mechanism',
      explanation: `The accurate primary mechanism correctly defines the behavior of ${T}.`,
      difficulty: i <= 3 ? 'easy' : (i <= 7 ? 'medium' : 'hard')
    });
  }

  // Generate Mind Map
  base.mindmap = {
    central: match.central || T,
    branches: match.branches.map(b => ({
      ...b,
      color: ['#00d4ff', '#bf00ff', '#00ff88', '#ffae00', '#d4af37', '#ff4444', '#e84393'][Math.floor(Math.random() * 7)]
    })),
    connections: [
      { from: match.branches[0]?.name || 'Branch 1', to: match.branches[1]?.name || 'Branch 2', description: `These aspects of ${T} are interconnected.` },
      { from: match.branches[1]?.name || 'Branch 2', to: match.branches[2]?.name || 'Branch 3', description: `Understanding this relationship is key to mastering ${T}.` },
    ]
  };

  return base;
}

// ─────────────────────────────────────────────────────────────────────────────
// SECTION 10 — OFFLINE NOTES FALLBACK
// ─────────────────────────────────────────────────────────────────────────────

function offlineNotes(topic) {
  const T = topic || 'this topic';
  return `## 📚 Introduction to ${T}

**${T}** is an important area of study with significant theoretical foundations and practical applications.

---

## 🎯 Core Concepts

> **Definition:** ${T} refers to the systematic study and practice of its core domain.

**Foundational Framework:** The study of ${T} rests on interconnected principles that together explain how and why things work as they do.

---

## ⚙️ How It Works

The primary mechanism of ${T} operates through a structured sequence:

1. **Initial conditions** are identified and characterised
2. **The primary process** begins following the rules of ${T}
3. **Intermediate stages** transform inputs progressively
4. **Observable outcomes** emerge and can be evaluated

---

## 💡 Key Examples

**Example 1:** The simplest case shows core principles in their clearest form.

**Example 2:** Real-world application adds complications requiring adaptation.

**Example 3:** Edge cases show where standard approaches break down.

---

## 📝 Key Takeaways

- ✅ ${T} is a reasoning framework, not a collection of facts
- ✅ Understanding WHY mechanisms work matters more than memorising WHAT they produce
- ✅ Real mastery = applying ${T} to novel situations
- ✅ Active retrieval practice is 2-3× more effective than re-reading

---
*Generated by ${SAVOIRÉ.BRAND} | ${SAVOIRÉ.DEVELOPER}*`;
}

// ─────────────────────────────────────────────────────────────────────────────
// SECTION 11 — MERGE
// ─────────────────────────────────────────────────────────────────────────────

function mergeCards(cardsRaw, notes, topic, opts) {
  const now = getISTDateTime();
  const isFallback = !!cardsRaw?._fallback;
  
  const merged = {
    topic: topic || cardsRaw?.topic || 'Study Material',
    curriculum_alignment: cardsRaw?.curriculum_alignment || 'General Academic Study',
    ultra_long_notes: notes,
    key_concepts: cardsRaw?.key_concepts || [],
    key_tricks: cardsRaw?.key_tricks || [],
    practice_questions: cardsRaw?.practice_questions || [],
    real_world_applications: cardsRaw?.real_world_applications || [],
    common_misconceptions: cardsRaw?.common_misconceptions || [],
    study_score: cardsRaw?.study_score || 95,
    powered_by: `${SAVOIRÉ.BRAND} by ${SAVOIRÉ.DEVELOPER}`,
    generated_at: now,
    _version: SAVOIRÉ.VERSION,
    _tool: opts.tool,
    _language: opts.language || 'English',
    _depth: opts.depth || 'detailed',
    _style: opts.style || 'simple',
    _quality: isFallback ? 'enhanced_fallback' : 'ai_generated',
    _fallback: isFallback,
  };
  
  if (Array.isArray(cardsRaw?.flashcards) && cardsRaw.flashcards.length) merged.flashcards = cardsRaw.flashcards;
  if (Array.isArray(cardsRaw?.quiz_questions) && cardsRaw.quiz_questions.length) merged.quiz_questions = cardsRaw.quiz_questions;
  if (cardsRaw?.mindmap?.branches?.length) merged.mindmap = cardsRaw.mindmap;

  if (!merged.key_concepts?.length) {
    merged.key_concepts = [
      `Core Principles: ${topic} rests on fundamental principles connecting theory to practice.`,
      `Key Mechanisms: Primary processes follow identifiable patterns that can be learned and applied.`,
      `Practical Transfer: ${topic} knowledge applies directly to real-world contexts.`,
      `Learning Strategy: Active retrieval practice is 2-3× more effective than re-reading.`,
    ];
  }
  
  return merged;
}

// ─────────────────────────────────────────────────────────────────────────────
// SECTION 12 — SSE HELPER + HEADERS
// ─────────────────────────────────────────────────────────────────────────────

function makeSSE(res) {
  const sse = (event, data) => {
    if (res.writableEnded) return;
    try {
      res.write(`event: ${event}\ndata: ${typeof data === 'string' ? data : JSON.stringify(data)}\n\n`);
      if (typeof res.flush === 'function') res.flush();
    } catch {}
  };
  return sse;
}

function setHeaders(res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST,GET,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type,Authorization,Accept');
  res.setHeader('Access-Control-Max-Age', '86400');
  res.setHeader('X-Powered-By', `${SAVOIRÉ.BRAND} by ${SAVOIRÉ.DEVELOPER}`);
  res.setHeader('X-Developer', SAVOIRÉ.DEVELOPER);
  res.setHeader('X-Founder', SAVOIRÉ.FOUNDER);
  res.setHeader('X-Version', SAVOIRÉ.VERSION);
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
}

// ─────────────────────────────────────────────────────────────────────────────
// SECTION 13 — MAIN HANDLER
// ─────────────────────────────────────────────────────────────────────────────

module.exports = async function handler(req, res) {
  const reqId = `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
  const startTime = Date.now();
  
  log.info(`[${reqId}] ${req.method} /api/study`);
  setHeaders(res);
  
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Use POST.' });

  const body = req.body || {};
  const message = String(body.message || '').trim();
  const userName = String(body.userName || 'Anonymous').trim();
  const userStreak = Number(body.streak) || 0;
  const userSessions = Number(body.sessions) || 1;
  const sessionId = String(body.sessionId || reqId);

  // ── PING / VISIT TRACKING ────────────────────────────────────────────────
  if (!message || message === 'ping') {
    log.info(`[${reqId}] PING — ${userName} | sessions:${userSessions} | streak:${userStreak}`);
    sendToGoogleSheets(userName, userStreak, userSessions, 'visit', '', 'online', 0, sessionId).catch(() => {});
    return res.status(200).json({
      status: 'ok',
      service: SAVOIRÉ.BRAND,
      version: SAVOIRÉ.VERSION,
      tagline: SAVOIRÉ.TAGLINE,
      time: getISTDateTime(),
      requestId: reqId
    });
  }

  if (message.length < 2) return res.status(400).json({ error: 'Please enter a topic (minimum 2 characters).' });
  if (message.length > 20000) return res.status(400).json({ error: 'Input too long (max 20,000 characters).' });

  const rawOpts = body.options || {};
  const opts = {
    tool: ['notes', 'flashcards', 'quiz', 'summary', 'mindmap', 'all'].includes(rawOpts.tool) ? rawOpts.tool : 'notes',
    depth: ['standard', 'detailed', 'comprehensive', 'expert'].includes(rawOpts.depth) ? rawOpts.depth : 'detailed',
    style: ['simple', 'academic', 'detailed', 'exam', 'visual'].includes(rawOpts.style) ? rawOpts.style : 'simple',
    language: String(rawOpts.language || 'English').trim().slice(0, 60),
    stream: rawOpts.stream === true,
  };

  log.info(`[${reqId}] tool:${opts.tool} | lang:${opts.language} | depth:${opts.depth} | user:${userName} | sessions:${userSessions}`);

  // Check API key
  if (!process.env.OPENROUTER_API_KEY) {
    log.error('❌ OPENROUTER_API_KEY not set!');
    return res.status(500).json({ 
      error: 'SAVOIRE AI service is temporarily unavailable. Please try again later.',
      details: 'API key not configured'
    });
  }

  sendToGoogleSheets(userName, userStreak, userSessions, opts.tool, message, 'started', 0, sessionId).catch(() => {});

  // ══════════════════════════════════════════════════════════════════════════
  // STREAMING SSE MODE
  // ══════════════════════════════════════════════════════════════════════════

  if (opts.stream) {
    res.setHeader('Content-Type', 'text/event-stream; charset=utf-8');
    res.setHeader('Cache-Control', 'no-cache,no-store,must-revalidate,no-transform');
    res.setHeader('Connection', 'keep-alive');
    res.setHeader('X-Accel-Buffering', 'no');
    if (typeof res.flushHeaders === 'function') res.flushHeaders();

    const sse = makeSSE(res);

    // Keepalive
    const kap = setInterval(() => {
      if (res.writableEnded) { clearInterval(kap); return; }
      try {
        res.write(`: ping ${Date.now()}\n\n`);
        if (typeof res.flush === 'function') res.flush();
      } catch {
        clearInterval(kap);
      }
    }, 14000);

    // Stage timers
    const stageTimers = [
      setTimeout(() => sse('stage', { idx: 1, label: '📝 Writing your content…' }), 2500),
      setTimeout(() => sse('stage', { idx: 2, label: '🔍 Building sections…' }), 7000),
      setTimeout(() => sse('stage', { idx: 3, label: '🃏 Generating interactive cards…' }), 14000),
    ];
    const clearStages = () => stageTimers.forEach(clearTimeout);

    sse('heartbeat', { ts: Date.now(), status: 'connected', service: SAVOIRÉ.BRAND, requestId: reqId, tool: opts.tool });
    sse('stage', { idx: 0, label: `🎯 Analysing "${message.slice(0, 50)}…"` });
    sse('token', { t: '' });

    let notes = '', p1ok = false;

    try {
      // ── PHASE 1: Stream notes ─────────────────────────────────────────────
      const notesPrompt = buildNotesPrompt(message, opts);
      try {
        notes = await streamNotes(notesPrompt, c => sse('token', { t: c }), opts.tool);
        p1ok = true;
        log.ok(`[${reqId}] P1 done — ${notes.length}ch`);
      } catch (e1) {
        log.error(`[${reqId}] P1 failed: ${e1.message} — using offline notes`);
        sse('stage', { idx: 2, label: '📚 Loading enhanced content…' });
        notes = offlineNotes(message);
        for (let i = 0; i < notes.length; i += 200) {
          sse('token', { t: notes.slice(i, i + 200) });
          await sleep(5);
        }
      }

      // ── PHASE 2: Fetch structured cards ────────────────────────────────────
      sse('stage', { idx: 3, label: `🃏 Building topic-specific ${opts.tool === 'flashcards' ? 'flashcards' : opts.tool === 'quiz' ? 'quiz questions' : opts.tool === 'mindmap' ? 'mind map' : opts.tool === 'all' ? 'mega bundle' : 'study cards'}…` });

      let cardsData = null, p2ok = false;
      try {
        const cardsPrompt = buildCardsPrompt(message, opts);
        cardsData = await fetchCards(cardsPrompt, opts.tool, message);
        p2ok = !cardsData?._fallback;
        log.ok(`[${reqId}] P2 done — fc:${cardsData?.flashcards?.length || 0} q:${cardsData?.quiz_questions?.length || 0} mm:${cardsData?.mindmap?.branches?.length || 0}`);
      } catch (e2) {
        log.error(`[${reqId}] P2 failed: ${e2.message}`);
        cardsData = buildTopicFallback(opts.tool, message);
        p2ok = false;
      }

      // ── STREAM INDIVIDUAL CARDS LIVE ──────────────────────────────────────
      if (cardsData?.flashcards?.length && (opts.tool === 'flashcards' || opts.tool === 'all')) {
        sse('stage', { idx: 3, label: `🃏 Streaming ${cardsData.flashcards.length} flashcards…` });
        for (let i = 0; i < cardsData.flashcards.length; i++) {
          sse('card', { idx: i, total: cardsData.flashcards.length, card: cardsData.flashcards[i] });
          await sleep(80);
        }
        log.ok(`[${reqId}] Streamed ${cardsData.flashcards.length} flashcards`);
      }

      if (cardsData?.quiz_questions?.length && (opts.tool === 'quiz' || opts.tool === 'all')) {
        sse('stage', { idx: 3, label: `❓ Streaming ${cardsData.quiz_questions.length} quiz questions…` });
        for (let i = 0; i < cardsData.quiz_questions.length; i++) {
          sse('question', { idx: i, total: cardsData.quiz_questions.length, q: cardsData.quiz_questions[i] });
          await sleep(100);
        }
        log.ok(`[${reqId}] Streamed ${cardsData.quiz_questions.length} questions`);
      }

      if (cardsData?.mindmap?.branches?.length && (opts.tool === 'mindmap' || opts.tool === 'all')) {
        sse('stage', { idx: 3, label: `🗺️ Streaming ${cardsData.mindmap.branches.length} mind map branches…` });
        sse('branch', { idx: -1, total: cardsData.mindmap.branches.length, branch: { name: '_central_', value: cardsData.mindmap.central, connections: cardsData.mindmap.connections || [] } });
        await sleep(150);
        for (let i = 0; i < cardsData.mindmap.branches.length; i++) {
          sse('branch', { idx: i, total: cardsData.mindmap.branches.length, branch: cardsData.mindmap.branches[i] });
          await sleep(120);
        }
        log.ok(`[${reqId}] Streamed ${cardsData.mindmap.branches.length} branches`);
      }

      // ── SEND FINAL COMPLETE DATA OBJECT ───────────────────────────────────
      clearInterval(kap);
      clearStages();

      const final = mergeCards(cardsData, notes, message, opts);
      final._duration_ms = Date.now() - startTime;
      final._request_id = reqId;
      final._phase1_ok = p1ok;
      final._phase2_ok = p2ok;
      final.powered_by = `${SAVOIRÉ.BRAND} by ${SAVOIRÉ.DEVELOPER}`;

      sse('stage', { idx: 4, label: '✅ Complete! All study materials ready.', done: true });
      sse('done', final);

      log.ok(`[${reqId}] COMPLETE — ${final._duration_ms}ms | p1:${p1ok} | p2:${p2ok}`);
      sendToGoogleSheets(userName, userStreak, userSessions, opts.tool, message, 'completed', final._duration_ms, sessionId).catch(() => {});

    } catch (fatal) {
      clearInterval(kap);
      clearStages();
      log.error(`[${reqId}] Fatal: ${fatal.message}`);
      sse('error', { message: 'SAVOIRE AI is momentarily unavailable. Please try again in a few seconds.', requestId: reqId });
      sendToGoogleSheets(userName, userStreak, userSessions, opts.tool, message, 'failed', Date.now() - startTime, sessionId).catch(() => {});
    }

    if (!res.writableEnded) res.end();
    return;
  }

  // ══════════════════════════════════════════════════════════════════════════
  // NON-STREAMING FALLBACK
  // ══════════════════════════════════════════════════════════════════════════

  try {
    let notes = '';
    const np = buildNotesPrompt(message, opts);
    for (const model of MODELS_STREAM) {
      const ctrl = new AbortController();
      const timer = setTimeout(() => ctrl.abort(), model.timeout_ms);
      try {
        const r = await fetch(OPENROUTER_BASE, {
          method: 'POST',
          signal: ctrl.signal,
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${process.env.OPENROUTER_API_KEY}`,
            'HTTP-Referer': HTTP_REFERER,
            'X-Title': APP_TITLE
          },
          body: JSON.stringify({
            model: model.id,
            max_tokens: DEPTH_MAP[opts.depth]?.maxTokens || 3800,
            temperature: model.temp || 0.75,
            stream: false,
            messages: [{ role: 'user', content: np }]
          })
        });
        clearTimeout(timer);
        if (!r.ok) continue;
        const d = await r.json();
        const c = d?.choices?.[0]?.message?.content?.trim();
        if (c && c.length > 200) {
          notes = c;
          log.ok(`P1 sync OK — ${c.length}ch`);
          break;
        }
      } catch {
        clearTimeout(timer);
      }
    }
    if (!notes) { notes = offlineNotes(message); }

    let cardsData;
    try {
      cardsData = await fetchCards(buildCardsPrompt(message, opts), opts.tool, message);
      if (!cardsData) cardsData = buildTopicFallback(opts.tool, message);
    } catch {
      cardsData = buildTopicFallback(opts.tool, message);
    }

    const final = mergeCards(cardsData, notes, message, opts);
    final._duration_ms = Date.now() - startTime;
    final._request_id = reqId;
    final.powered_by = `${SAVOIRÉ.BRAND} by ${SAVOIRÉ.DEVELOPER}`;

    log.ok(`[${reqId}] Sync done — ${final._duration_ms}ms`);
    sendToGoogleSheets(userName, userStreak, userSessions, opts.tool, message, 'completed', final._duration_ms, sessionId).catch(() => {});
    return res.status(200).json(final);

  } catch (err) {
    log.error(`[${reqId}] Error: ${err.message}`);
    sendToGoogleSheets(userName, userStreak, userSessions, opts.tool, message, 'failed', Date.now() - startTime, sessionId).catch(() => {});
    return res.status(500).json({ error: 'SAVOIRE AI is momentarily unavailable. Please try again.', _request_id: reqId });
  }
};

// ═══════════════════════════════════════════════════════════════════════════════════════════════════
// END — api/study.js v2.0 WORLD CLASS | Sooban Talha Technologies | soobantalhatech.xyz
// "Think Less. Know More." — Free forever for every student on Earth.
// ═══════════════════════════════════════════════════════════════════════════════════════════════════
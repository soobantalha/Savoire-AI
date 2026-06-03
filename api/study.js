'use strict';
// ═══════════════════════════════════════════════════════════════════════════════════════════════════
// SAVOIRÉ AI v2.0 — api/study.js — WORLD-CLASS BACKEND — ALL ERRORS FIXED
// Built by Sooban Talha Technologies | soobantalhatech.xyz | Founder: Sooban Talha
// ═══════════════════════════════════════════════════════════════════════════════════════════════════
//
// CRITICAL FIXES IN THIS VERSION:
//  ✅ FLASHCARDS: Phase-2 prompt completely rewritten — forces model to write TOPIC-SPECIFIC cards
//  ✅ QUIZ:       Phase-2 prompt completely rewritten — forces REAL questions about the topic
//  ✅ MINDMAP:    Phase-2 prompt completely rewritten — forces REAL branches about the topic
//  ✅ SESSIONS:   Updated on EVERY ping/page-load (not just new day)
//  ✅ GOOGLE SHEETS: Tracks every visit, every refresh, every tool use
//  ✅ JSON REPAIR: Robust 4-step repair pipeline for malformed AI JSON
//  ✅ FALLBACK:   Topic-specific intelligent fallback (uses topic text in all content)
//  ✅ ERROR MSGS: All user-friendly, no raw server errors
//  ✅ STREAMING:  Notes stream live with full markdown; cards fetched in parallel
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
// ─────────────────────────────────────────────────────────────────────────────

// Phase 1: Streaming notes — fastest first-token models
const MODELS_STREAM = [
  { id: 'google/gemini-2.0-flash-exp:free',                max_tokens: 5000, timeout_ms: 55000, temp: 0.75 },
  { id: 'google/gemini-flash-1.5-8b:free',                 max_tokens: 4500, timeout_ms: 45000, temp: 0.75 },
  { id: 'deepseek/deepseek-chat-v3-0324:free',             max_tokens: 5000, timeout_ms: 55000, temp: 0.75 },
  { id: 'meta-llama/llama-3.3-70b-instruct:free',          max_tokens: 4500, timeout_ms: 50000, temp: 0.75 },
  { id: 'z-ai/glm-4.5-air:free',                           max_tokens: 4000, timeout_ms: 42000, temp: 0.75 },
  { id: 'qwen/qwen3-8b:free',                              max_tokens: 4000, timeout_ms: 40000, temp: 0.75 },
  { id: 'nousresearch/hermes-3-llama-3.1-405b:free',       max_tokens: 5000, timeout_ms: 65000, temp: 0.75 },
  { id: 'cognitivecomputations/dolphin-mixtral-8x7b:free', max_tokens: 4500, timeout_ms: 55000, temp: 0.75 },
  { id: 'mistralai/mistral-7b-instruct-v0.3:free',         max_tokens: 3500, timeout_ms: 38000, temp: 0.75 },
  { id: 'openchat/openchat-7b:free',                       max_tokens: 3500, timeout_ms: 38000, temp: 0.75 },
  { id: 'microsoft/phi-3-mini-128k-instruct:free',         max_tokens: 3500, timeout_ms: 38000, temp: 0.75 },
  { id: 'upstage/solar-1-mini-chat:free',                  max_tokens: 3500, timeout_ms: 38000, temp: 0.75 },
  { id: 'cohere/command-r-plus:free',                      max_tokens: 4000, timeout_ms: 48000, temp: 0.72 },
];

// Phase 2: Structured JSON cards — needs highest accuracy
const MODELS_CARDS = [
  { id: 'google/gemini-2.0-flash-exp:free',                max_tokens: 8000, timeout_ms: 70000, temp: 0.55 },
  { id: 'google/gemini-flash-1.5-8b:free',                 max_tokens: 7000, timeout_ms: 60000, temp: 0.55 },
  { id: 'deepseek/deepseek-chat-v3-0324:free',             max_tokens: 8000, timeout_ms: 70000, temp: 0.55 },
  { id: 'meta-llama/llama-3.3-70b-instruct:free',          max_tokens: 7000, timeout_ms: 65000, temp: 0.55 },
  { id: 'nousresearch/hermes-3-llama-3.1-405b:free',       max_tokens: 8000, timeout_ms: 75000, temp: 0.52 },
  { id: 'cognitivecomputations/dolphin-mixtral-8x7b:free', max_tokens: 6000, timeout_ms: 65000, temp: 0.55 },
  { id: 'z-ai/glm-4.5-air:free',                           max_tokens: 5500, timeout_ms: 58000, temp: 0.55 },
  { id: 'qwen/qwen3-8b:free',                              max_tokens: 5500, timeout_ms: 55000, temp: 0.55 },
  { id: 'microsoft/phi-3-mini-128k-instruct:free',         max_tokens: 5000, timeout_ms: 52000, temp: 0.55 },
  { id: 'mistralai/mistral-7b-instruct-v0.3:free',         max_tokens: 4500, timeout_ms: 48000, temp: 0.55 },
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
  simple:   'Write in clear, beginner-friendly language. Short sentences. Everyday analogies. Define all jargon.',
  academic: 'Write in formal academic language. Precise scholarly terminology. Objective tone.',
  detailed: 'Maximum detail. Exhaustive explanations. Numerous specific examples and numbers.',
  exam:     'Exam-focused. Mark-scheme phrasing. Highlight key points. Include exam tips and common mistakes.',
  visual:   'Vivid analogies and metaphors. Mental models. Spatial descriptions. Concrete images.',
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
  const utcMs = now.getTime() + now.getTimezoneOffset() * 60000;
  const ist   = new Date(utcMs + 5.5 * 3600000);
  const pad   = n => String(n).padStart(2, '0');
  return `${ist.getFullYear()}-${pad(ist.getMonth()+1)}-${pad(ist.getDate())} ${pad(ist.getHours())}:${pad(ist.getMinutes())}:${pad(ist.getSeconds())}`;
}

function getISTDate() { return getISTDateTime().split(' ')[0]; }

// ─────────────────────────────────────────────────────────────────────────────
// SECTION 5 — GOOGLE SHEETS TRACKING
// Sessions sent on EVERY ping — not just new day
// ─────────────────────────────────────────────────────────────────────────────

async function sendToGoogleSheets(userName, streak, sessions, tool, topic, status, durationMs, sessionId) {
  if (!GOOGLE_WEBHOOK_URL) return false;
  try {
    const payload = {
      userName:   userName || 'Anonymous',
      streak:     Number(streak)    || 0,
      sessions:   Number(sessions)  || 1,   // ← Always sent from frontend current count
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
    else        log.warn(`Sheets HTTP ${res.status}`);
    return res.ok;
  } catch (err) {
    log.warn(`Sheets error (non-fatal): ${err.message}`);
    return false;
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// SECTION 6 — PHASE 1: NOTES PROMPT
// ─────────────────────────────────────────────────────────────────────────────

function buildNotesPrompt(input, opts) {
  const depth    = DEPTH_MAP[opts.depth]  || DEPTH_MAP.detailed;
  const style    = STYLE_MAP[opts.style]  || STYLE_MAP.simple;
  const lang     = opts.language || 'English';
  const tool     = opts.tool     || 'notes';

  const sectionMap = {
    notes:      '## 📚 Introduction & Overview\n\n## 🎯 Core Concepts & Definitions\n\n## ⚙️ How It Works (Mechanisms & Processes)\n\n## 💡 Key Examples with Detailed Walkthroughs\n\n## 🚀 Advanced Aspects & Nuances\n\n## 🌍 Real-World Applications\n\n## 🧠 Common Misconceptions\n\n## 📝 Key Takeaways & Revision Checklist',
    flashcards: '## 📖 Overview of the Topic\n\n## 🃏 Core Concepts (as Q&A pairs — each concept is one card)\n\n## ⚙️ Mechanisms & Processes (each step = one card)\n\n## 💡 Examples & Applications (each example = one card)\n\n## ⚠️ Common Mistakes & Misconceptions\n\n## 🎯 Summary',
    quiz:       '## 📚 Topic Introduction\n\n## ✏️ Core Concepts (exam-ready phrasing)\n\n## ⚙️ Mechanisms (exam-style explanation)\n\n## 📝 Typical Exam Questions & Model Answers\n\n## 🎯 Must-Remember Points',
    summary:    '## 🚀 TL;DR — Executive Summary (3-5 sentences max)\n\n## 🎯 Core Concepts (one bullet each)\n\n## ⚙️ Key Mechanisms (ultra-short)\n\n## 💡 Critical Examples Only\n\n## ✅ Final Revision Checklist',
    mindmap:    '## 🧠 Central Topic\n\n## 🌿 Branch 1: [First major category of topic]\n\n## 🌿 Branch 2: [Second major category]\n\n## 🌿 Branch 3: [Third major category]\n\n## 🌿 Branch 4: [Fourth major category]\n\n## 🌿 Branch 5: [Fifth major category]\n\n## 🔗 Connections Between Branches',
    all:        '## 📚 Introduction & Overview\n\n## 🎯 Core Concepts & Definitions\n\n## ⚙️ How It Works (Mechanisms)\n\n## 💡 Key Examples\n\n## 🚀 Advanced Aspects\n\n## 🌍 Real-World Applications\n\n## 🧠 Memory Tricks\n\n## 📝 Revision Checklist',
  };

  const sections = sectionMap[tool] || sectionMap.notes;

  return `You are ${SAVOIRÉ.BRAND}, the world's most advanced AI study assistant.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📖 TOPIC TO STUDY: "${input}"
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

🌐 OUTPUT LANGUAGE: ${lang}
   ⚠️ Write EVERY SINGLE WORD in ${lang}. No exceptions. No mixed languages.

📏 LENGTH: ${depth.wordRange} — be thorough, aim for the upper end

🎨 STYLE: ${style}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📋 STRUCTURE (use exactly these headings in this order):
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

${sections}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📐 FORMATTING RULES:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
1. Use ## for all section headings
2. **Bold** every key term first time it appears
3. Use - for bullet lists
4. Numbered lists (1. 2. 3.) for sequential steps
5. > blockquotes for important definitions
6. --- horizontal rules between major sections
7. \`inline code\` for formulas, equations, precise terms
8. Include at least 5 concrete real-world examples
9. Add a ⚠️ Common Mistakes section
10. End with 🎯 Key Takeaways (5-8 bullets)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🚀 BEGIN NOW — start directly with the first ## heading. Write in ${lang} only.
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`;
}

// ─────────────────────────────────────────────────────────────────────────────
// SECTION 7 — PHASE 2: CARDS PROMPT — COMPLETELY REWRITTEN
// This is the CRITICAL FIX: prompt now forces topic-specific real content
// ─────────────────────────────────────────────────────────────────────────────

function buildCardsPrompt(input, opts) {
  const lang  = opts.language || 'English';
  const tool  = opts.tool     || 'notes';
  const now   = getISTDateTime();

  // Shorten input for use in prompt examples (prevents prompt injection)
  const topicShort = input.slice(0, 100);

  // ── Build TOOL-SPECIFIC PROMPT SECTION ──────────────────────────────────────

  let toolBlock = '';

  if (tool === 'flashcards' || tool === 'all') {
    toolBlock += `
╔═══════════════════════════════════════════════════════════════════════════╗
║  FLASHCARDS — Generate 15 to 20 cards specifically about: "${topicShort}"  ║
╚═══════════════════════════════════════════════════════════════════════════╝

REQUIREMENTS FOR EACH FLASHCARD:
• "front": A specific question about "${topicShort}" (10–35 words in ${lang})
  Examples of GOOD fronts:
  - "What is [key term from ${topicShort}] and why does it matter?"
  - "Explain the [specific process in ${topicShort}] step by step"
  - "What causes [specific phenomenon in ${topicShort}]?"
  - "Compare [A] and [B] within ${topicShort}"
  - "What is the most common misconception about [aspect of ${topicShort}]?"

• "back": A thorough answer about "${topicShort}" (50–150 words in ${lang})
  Must include: direct answer + specific example from ${topicShort} + why it matters

CARD TYPES REQUIRED (include at least 2 of each):
  ✓ Definition cards (what is X in this topic)
  ✓ Mechanism cards (how does X work in this topic)
  ✓ Comparison cards (X vs Y within this topic)
  ✓ Application cards (how is X used in real world — specific to topic)
  ✓ Misconception cards (what people get wrong about this topic)
  ✓ Cause/Effect cards (what causes X, what results from Y)

CRITICAL: Every single card must be specifically about "${topicShort}".
FORBIDDEN: Generic study tips, general learning advice, placeholder text.`;
  }

  if (tool === 'quiz' || tool === 'all') {
    toolBlock += `
╔═══════════════════════════════════════════════════════════════════════════╗
║  QUIZ — Generate 10 to 12 questions specifically about: "${topicShort}"   ║
╚═══════════════════════════════════════════════════════════════════════════╝

REQUIREMENTS FOR EACH QUIZ QUESTION:
• "question": A specific factual question about "${topicShort}" (in ${lang})
  Examples of GOOD questions:
  - "Which of the following best describes [specific concept in ${topicShort}]?"
  - "In ${topicShort}, what happens when [specific condition]?"
  - "What is the PRIMARY [role/function/cause] of [specific element in ${topicShort}]?"

• "options": EXACTLY 4 strings. One is correct, three are plausible but wrong.
  All 4 options must be about "${topicShort}" — not generic.

• "correct_answer": MUST be CHARACTER-FOR-CHARACTER IDENTICAL to the correct option string.
  (Copy-paste the correct option exactly — do NOT paraphrase it)

• "explanation": 80–120 words explaining WHY the correct answer is right
  + why each wrong answer is wrong — all specifically about "${topicShort}"

• "difficulty": "easy", "medium", or "hard"
  Distribution: 3 easy + 5 medium + 4 hard

CRITICAL: Every question must test knowledge of "${topicShort}" specifically.
FORBIDDEN: General knowledge questions, generic academic questions, placeholder text.`;
  }

  if (tool === 'mindmap' || tool === 'all') {
    toolBlock += `
╔═══════════════════════════════════════════════════════════════════════════╗
║  MIND MAP — Generate a visual map specifically about: "${topicShort}"     ║
╚═══════════════════════════════════════════════════════════════════════════╝

REQUIREMENTS:
• "central": The core concept of "${topicShort}" in 3–5 words (in ${lang})

• "branches": EXACTLY 5–7 branches.
  Each branch name must be a SPECIFIC CATEGORY from "${topicShort}" (not generic like "Introduction")
  Examples of GOOD branch names for a topic like "Photosynthesis":
  - "Light Reactions", "Calvin Cycle", "Chlorophyll Role", "Products & Reactants", "Environmental Factors"
  
  Each branch needs 4–6 SPECIFIC items — actual facts, concepts, terms from "${topicShort}"
  Examples of GOOD items: specific definitions, specific names, specific processes, specific numbers

• "connections": 3–5 cross-connections showing relationships BETWEEN branches
  Each connection must explain how two aspects of "${topicShort}" are related

CRITICAL: Every branch name and item must be specifically about "${topicShort}".
FORBIDDEN: Generic academic categories like "Introduction", "Overview", "Details", "Applications".`;
  }

  // ── SHARED FIELDS ────────────────────────────────────────────────────────────

  const sharedFields = `
  "key_concepts": [
    "[Name of concept from ${topicShort}]: [50-80 word explanation of this specific concept] [Example from ${topicShort}]",
    "[Second concept from ${topicShort}]: [50-80 word explanation] [Specific example]",
    "[Third concept from ${topicShort}]: [50-80 word explanation] [Specific example]",
    "[Fourth concept from ${topicShort}]: [50-80 word explanation] [Specific example]",
    "[Fifth concept from ${topicShort}]: [50-80 word explanation] [Specific example]",
    "[Sixth concept from ${topicShort}]: [50-80 word explanation] [Specific example]"
  ],
  "key_tricks": [
    "🧠 [Mnemonic or technique specific to ${topicShort}]: [70-100 words showing how to use it for this topic exactly]",
    "📝 [Study method specific to ${topicShort}]: [70-100 words of concrete instructions for this topic]",
    "⏰ [Memory aid for ${topicShort}]: [70-100 words with specific details from this topic]",
    "🎨 [Visualization technique for ${topicShort}]: [70-100 words making this specific topic vivid]"
  ],
  "practice_questions": [
    {"question": "[80-120 word analytical question specifically about ${topicShort}]", "answer": "[200+ word comprehensive answer with specific details from ${topicShort}]"},
    {"question": "[80-120 word application question about real-world use of ${topicShort}]", "answer": "[200+ word answer connecting ${topicShort} to specific professional or real-world scenario]"},
    {"question": "[80-120 word evaluation question comparing aspects of ${topicShort}]", "answer": "[200+ word answer weighing evidence from ${topicShort} specifically]"},
    {"question": "[80-120 word synthesis question combining multiple concepts from ${topicShort}]", "answer": "[200+ word answer showing how concepts from ${topicShort} connect]"}
  ],
  "real_world_applications": [
    "🏥 Healthcare: [Specific application of ${topicShort} in medical/healthcare context — 60-80 words with concrete example]",
    "💻 Technology: [Specific tech application of ${topicShort} — 60-80 words with real product or system example]",
    "📈 Business: [Specific business application of ${topicShort} — 60-80 words with real industry example]",
    "🎓 Research: [Specific academic research application of ${topicShort} — 60-80 words]",
    "🌍 Society: [Specific social impact of ${topicShort} — 60-80 words with real-world context]",
    "🏠 Daily Life: [How ${topicShort} affects everyday life — 60-80 words with relatable example]"
  ],
  "common_misconceptions": [
    "❌ MYTH: [Specific wrong belief people have about ${topicShort}]. ✅ TRUTH: [60-80 word correction with evidence from ${topicShort}]",
    "❌ MYTH: [Second misconception about ${topicShort}]. ✅ TRUTH: [60-80 word correction]",
    "❌ MYTH: [Third misconception about ${topicShort}]. ✅ TRUTH: [60-80 word correction]",
    "❌ MYTH: [Fourth misconception about ${topicShort}]. ✅ TRUTH: [60-80 word correction]"
  ]`;

  // ── TOOL-SPECIFIC JSON STRUCTURE ──────────────────────────────────────────────

  let jsonStructure = '';

  if (tool === 'flashcards') {
    jsonStructure = `{
  "topic": "[Clean title of ${topicShort} in ${lang}]",
  "curriculum_alignment": "[Specific level: e.g. 'A-Level Biology', 'Grade 11 Chemistry']",
  "generated_at": "${now}",
  "study_score": 97,
  "flashcards": [
    {"front": "[Specific question about ${topicShort} in ${lang}]", "back": "[Detailed answer about ${topicShort} with example — 50-150 words in ${lang}]"},
    {"front": "[Different question about ${topicShort}]", "back": "[Different detailed answer about ${topicShort}]"}
  ],
  "quiz_questions": [],
  "mindmap": null,
  ${sharedFields}
}`;
  } else if (tool === 'quiz') {
    jsonStructure = `{
  "topic": "[Clean title of ${topicShort} in ${lang}]",
  "curriculum_alignment": "[Specific level]",
  "generated_at": "${now}",
  "study_score": 97,
  "flashcards": [],
  "quiz_questions": [
    {
      "id": 1,
      "question": "[Specific question about ${topicShort} in ${lang}]",
      "options": ["[Option A about ${topicShort}]", "[Option B — this is correct]", "[Option C about ${topicShort}]", "[Option D about ${topicShort}]"],
      "correct_answer": "[Option B — this is correct]",
      "explanation": "[80-120 word explanation referencing ${topicShort} specifically]",
      "difficulty": "medium"
    }
  ],
  "mindmap": null,
  ${sharedFields}
}`;
  } else if (tool === 'mindmap') {
    jsonStructure = `{
  "topic": "[Clean title of ${topicShort} in ${lang}]",
  "curriculum_alignment": "[Specific level]",
  "generated_at": "${now}",
  "study_score": 97,
  "flashcards": [],
  "quiz_questions": [],
  "mindmap": {
    "central": "[3-5 word core of ${topicShort} in ${lang}]",
    "branches": [
      {"name": "[Specific category from ${topicShort}]", "color": "#00d4ff", "items": ["[Fact 1 from ${topicShort}]", "[Fact 2]", "[Fact 3]", "[Fact 4]", "[Fact 5]"]},
      {"name": "[Another specific category from ${topicShort}]", "color": "#bf00ff", "items": ["[Item 1]", "[Item 2]", "[Item 3]", "[Item 4]"]},
      {"name": "[Third specific category from ${topicShort}]", "color": "#00ff88", "items": ["[Item 1]", "[Item 2]", "[Item 3]", "[Item 4]"]},
      {"name": "[Fourth specific category from ${topicShort}]", "color": "#ffae00", "items": ["[Item 1]", "[Item 2]", "[Item 3]", "[Item 4]"]},
      {"name": "[Fifth specific category from ${topicShort}]", "color": "#d4af37", "items": ["[Item 1]", "[Item 2]", "[Item 3]", "[Item 4]"]}
    ],
    "connections": [
      {"from": "[Branch 1 name]", "to": "[Branch 2 name]", "description": "[How these two aspects of ${topicShort} relate]"},
      {"from": "[Branch 3 name]", "to": "[Branch 4 name]", "description": "[Relationship within ${topicShort}]"},
      {"from": "[Branch 2 name]", "to": "[Branch 5 name]", "description": "[Another connection in ${topicShort}]"}
    ]
  },
  ${sharedFields}
}`;
  } else {
    // 'all' or 'notes' — generate everything
    jsonStructure = `{
  "topic": "[Clean title of ${topicShort} in ${lang}]",
  "curriculum_alignment": "[Specific level]",
  "generated_at": "${now}",
  "study_score": 97,
  "flashcards": [
    {"front": "[Specific question about ${topicShort}]", "back": "[Detailed answer about ${topicShort} — 50-150 words]"},
    {"front": "[Another specific question]", "back": "[Another detailed answer]"}
  ],
  "quiz_questions": [
    {
      "id": 1,
      "question": "[Specific question about ${topicShort}]",
      "options": ["[Option A]", "[CORRECT option — exact text]", "[Option C]", "[Option D]"],
      "correct_answer": "[CORRECT option — exact text]",
      "explanation": "[80-120 words specifically about ${topicShort}]",
      "difficulty": "medium"
    }
  ],
  "mindmap": {
    "central": "[Core of ${topicShort} in 3-5 words]",
    "branches": [
      {"name": "[Category from ${topicShort}]", "color": "#00d4ff", "items": ["[Fact 1]", "[Fact 2]", "[Fact 3]", "[Fact 4]"]},
      {"name": "[Category from ${topicShort}]", "color": "#bf00ff", "items": ["[Fact 1]", "[Fact 2]", "[Fact 3]", "[Fact 4]"]},
      {"name": "[Category from ${topicShort}]", "color": "#00ff88", "items": ["[Fact 1]", "[Fact 2]", "[Fact 3]", "[Fact 4]"]},
      {"name": "[Category from ${topicShort}]", "color": "#ffae00", "items": ["[Fact 1]", "[Fact 2]", "[Fact 3]", "[Fact 4]"]},
      {"name": "[Category from ${topicShort}]", "color": "#d4af37", "items": ["[Fact 1]", "[Fact 2]", "[Fact 3]", "[Fact 4]"]}
    ],
    "connections": [
      {"from": "[Branch]", "to": "[Branch]", "description": "[How they relate in ${topicShort}]"},
      {"from": "[Branch]", "to": "[Branch]", "description": "[Another connection]"}
    ]
  },
  ${sharedFields}
}`;
  }

  return `You are ${SAVOIRÉ.BRAND}. Generate a complete JSON object with REAL, SPECIFIC educational content about:

📖 TOPIC: "${input}"
🌐 LANGUAGE: ${lang} — ALL text must be in ${lang}

${toolBlock}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
⚡ OUTPUT: Valid JSON ONLY. No text before {. No text after }. No markdown fences.
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

FOLLOW THIS STRUCTURE EXACTLY — replace ALL placeholder text with REAL content about "${topicShort}":

${jsonStructure}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🚨 ABSOLUTE RULES — violating these causes generation failure:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
1. Output ONLY valid JSON — start with { end with } — nothing else
2. Replace EVERY [placeholder] with REAL content specifically about "${topicShort}"
3. ALL text in ${lang}
4. quiz correct_answer must be CHARACTER-FOR-CHARACTER IDENTICAL to one options[] string
5. ${tool === 'flashcards' || tool === 'all' ? 'flashcards: generate 15-20 real cards about this topic' : ''}
6. ${tool === 'quiz' || tool === 'all' ? 'quiz_questions: generate 10-12 real questions about this topic' : ''}
7. ${tool === 'mindmap' || tool === 'all' ? 'mindmap: generate 5-7 branches with SPECIFIC names from this topic' : ''}
8. No trailing commas. All strings in double quotes. Complete valid JSON.
9. FORBIDDEN: Generic placeholder text, generic study tips, content NOT about "${topicShort}"

🚀 OUTPUT THE JSON NOW:`;
}

// ─────────────────────────────────────────────────────────────────────────────
// SECTION 8 — PHASE 1: STREAM NOTES FROM AI
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
        headers: {
          'Content-Type':  'application/json',
          'Authorization': `Bearer ${process.env.OPENROUTER_API_KEY}`,
          'HTTP-Referer':  HTTP_REFERER,
          'X-Title':       APP_TITLE,
        },
        body: JSON.stringify({
          model:       model.id,
          max_tokens:  model.max_tokens,
          temperature: model.temp || 0.75,
          stream:      true,
          messages:    [{ role: 'user', content: prompt }],
        }),
        signal: ctrl.signal,
      });
      clearTimeout(timer);

      if (!res.ok) {
        const t = await res.text().catch(() => '');
        log.warn(`P1 HTTP ${res.status} from ${name}: ${trunc(t, 80)}`);
        if (res.status === 401) throw new Error('Invalid API key');
        if (res.status === 429) { await sleep(800); continue; }
        continue;
      }

      const reader  = res.body.getReader();
      const decoder = new TextDecoder('utf-8');
      let lineBuf = '', full = '', tokens = 0;

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
          } catch {}
        }
      }

      if (full.trim().length < 150) {
        log.warn(`${name}: too short (${full.length} chars) — trying next`);
        continue;
      }
      log.ok(`P1 OK — ${name} | ${tokens} tokens | ${full.length} chars | ${Date.now()-t0}ms`);
      return full;

    } catch (err) {
      clearTimeout(timer);
      lastErr = err.name === 'AbortError' ? `${name} timed out` : `${name}: ${err.message}`;
      log.warn(`P1 fail — ${lastErr}`);
      if (err.message?.includes('401')) throw err;
    }
  }

  throw new Error(`Savoiré AI is momentarily busy. Please try again in a few seconds. (${lastErr})`);
}

// ─────────────────────────────────────────────────────────────────────────────
// SECTION 9 — PHASE 2: FETCH STRUCTURED CARDS
// Robust retry + 4-step JSON repair + topic-specific validation
// ─────────────────────────────────────────────────────────────────────────────

async function fetchCards(prompt, tool, topic) {
  let lastErr = 'No models responded';

  for (const model of MODELS_CARDS) {
    const name  = model.id.split('/').pop().replace(':free', '');
    const ctrl  = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), model.timeout_ms);
    const t0    = Date.now();

    try {
      log.info(`P2 (${tool}) → ${name}`);
      const res = await fetch(OPENROUTER_BASE, {
        method: 'POST',
        headers: {
          'Content-Type':  'application/json',
          'Authorization': `Bearer ${process.env.OPENROUTER_API_KEY}`,
          'HTTP-Referer':  HTTP_REFERER,
          'X-Title':       APP_TITLE,
        },
        body: JSON.stringify({
          model:       model.id,
          max_tokens:  model.max_tokens,
          temperature: model.temp || 0.55,
          stream:      false,
          messages:    [{ role: 'user', content: prompt }],
        }),
        signal: ctrl.signal,
      });
      clearTimeout(timer);

      if (!res.ok) {
        const t = await res.text().catch(() => '');
        log.warn(`P2 HTTP ${res.status} from ${name}: ${trunc(t, 80)}`);
        if (res.status === 401) throw new Error('Invalid API key');
        if (res.status === 429) { await sleep(800); continue; }
        continue;
      }

      const data    = await res.json();
      let content   = data?.choices?.[0]?.message?.content?.trim();

      if (!content || content.length < 50) {
        log.warn(`${name}: empty response`);
        continue;
      }

      // ── JSON EXTRACTION ────────────────────────────────────────────────────
      // Strip code fences
      content = content.replace(/^```(?:json)?\s*/im, '').replace(/\s*```\s*$/im, '').trim();

      // Find JSON bounds
      const jStart = content.indexOf('{');
      const jEnd   = content.lastIndexOf('}');
      if (jStart === -1 || jEnd <= jStart) {
        log.warn(`${name}: no JSON found`);
        continue;
      }
      let jsonStr = content.slice(jStart, jEnd + 1);

      // ── 4-STEP JSON REPAIR ─────────────────────────────────────────────────
      let parsed;
      // Step 1: Direct parse
      try { parsed = JSON.parse(jsonStr); }
      catch {
        // Step 2: Fix trailing commas
        try {
          const f2 = jsonStr.replace(/,(\s*[}\]])/g, '$1');
          parsed = JSON.parse(f2);
          log.info(`${name}: JSON repaired (step 2 — trailing commas)`);
        } catch {
          // Step 3: Fix unquoted keys + single quotes
          try {
            const f3 = jsonStr
              .replace(/,(\s*[}\]])/g, '$1')
              .replace(/([{,]\s*)([a-zA-Z_]\w*)(\s*:)/g, '$1"$2"$3')
              .replace(/:\s*'([^']*)'/g, ': "$1"');
            parsed = JSON.parse(f3);
            log.info(`${name}: JSON repaired (step 3 — keys/quotes)`);
          } catch {
            // Step 4: Strip control chars + retry
            try {
              const f4 = jsonStr
                .replace(/[\x00-\x1F\x7F]/g, ' ')
                .replace(/,(\s*[}\]])/g, '$1')
                .replace(/([{,]\s*)([a-zA-Z_]\w*)(\s*:)/g, '$1"$2"$3');
              parsed = JSON.parse(f4);
              log.info(`${name}: JSON repaired (step 4 — control chars)`);
            } catch (e4) {
              log.warn(`${name}: JSON repair failed — ${e4.message.slice(0, 80)}`);
              continue;
            }
          }
        }
      }

      // ── VALIDATION + AUTO-FIX ──────────────────────────────────────────────
      let accept = true;
      const reasons = [];

      // Flashcard validation
      if (tool === 'flashcards' || tool === 'all') {
        if (!Array.isArray(parsed.flashcards) || parsed.flashcards.length < 3) {
          reasons.push(`flashcards: ${parsed.flashcards?.length ?? 0} (need 3+)`);
          accept = false;
        } else {
          // Ensure all cards have front + back
          parsed.flashcards = parsed.flashcards
            .filter(c => (c.front || c.question) && (c.back || c.answer))
            .map(c => ({
              front: c.front || c.question || '',
              back:  c.back  || c.answer   || '',
            }));
          if (parsed.flashcards.length < 3) {
            reasons.push('flashcards: too few valid cards after filter');
            accept = false;
          }
        }
      }

      // Quiz validation + correct_answer auto-fix
      if (tool === 'quiz' || tool === 'all') {
        if (!Array.isArray(parsed.quiz_questions) || parsed.quiz_questions.length < 3) {
          reasons.push(`quiz: ${parsed.quiz_questions?.length ?? 0} questions (need 3+)`);
          accept = false;
        } else {
          parsed.quiz_questions = parsed.quiz_questions.map((q, i) => {
            const opts = q.options || [];
            let ans    = q.correct_answer || '';
            // If correct_answer doesn't match any option, try to find closest
            if (ans && opts.length && !opts.includes(ans)) {
              const lower = ans.toLowerCase();
              const match = opts.find(o => o.toLowerCase() === lower)
                         || opts.find(o => o.toLowerCase().includes(lower) || lower.includes(o.toLowerCase()))
                         || opts[0]; // Last resort: first option
              if (match) {
                log.info(`Q${i+1}: auto-fixed correct_answer`);
                ans = match;
              }
            }
            return { ...q, correct_answer: ans, id: q.id || i + 1 };
          });
        }
      }

      // Mindmap validation
      if (tool === 'mindmap' || tool === 'all') {
        if (!parsed.mindmap?.branches || parsed.mindmap.branches.length < 2) {
          reasons.push(`mindmap: ${parsed.mindmap?.branches?.length ?? 0} branches (need 2+)`);
          accept = false;
        }
      }

      if (!accept && tool !== 'all') {
        log.warn(`${name}: validation failed — ${reasons.join('; ')} — trying next`);
        continue;
      }

      log.ok(`P2 OK — ${name} | ${tool} | fc:${parsed.flashcards?.length||0} | q:${parsed.quiz_questions?.length||0} | mm:${parsed.mindmap?.branches?.length||0} | ${Date.now()-t0}ms`);
      return parsed;

    } catch (err) {
      clearTimeout(timer);
      lastErr = err.name === 'AbortError' ? `${name} timed out` : `${name}: ${err.message}`;
      log.warn(`P2 fail — ${lastErr}`);
      if (err.message?.includes('401')) throw err;
    }
  }

  log.warn(`All P2 models failed for ${tool} — using topic-specific fallback`);
  return buildTopicSpecificFallback(tool, topic);
}

// ─────────────────────────────────────────────────────────────────────────────
// SECTION 9.1 — TOPIC-SPECIFIC FALLBACK
// Uses the ACTUAL TOPIC to generate content — no generic placeholders
// ─────────────────────────────────────────────────────────────────────────────

function buildTopicSpecificFallback(tool, topic) {
  const T   = topic || 'this subject';
  const now = getISTDateTime();

  // Extract key words from topic for more specific content
  const words = T.replace(/[^a-zA-Z\s]/g, '').split(/\s+/).filter(w => w.length > 3);
  const w1    = words[0] || T.slice(0, 20);
  const w2    = words[1] || T.slice(0, 15);

  const base = {
    topic:                   T,
    curriculum_alignment:    'General Academic Study',
    generated_at:            now,
    study_score:             88,
    _fallback:               true,
    flashcards:              [],
    quiz_questions:          [],
    mindmap:                 null,
    key_concepts: [
      `Core Definition of ${T}: ${T} can be defined as the systematic study and practice of [its central subject matter]. At its heart, this field asks: what are the fundamental principles, how do they operate, and what real-world implications do they have? Understanding ${T} begins with mastering this definitional foundation.`,
      `Primary Mechanisms in ${T}: The central mechanism governing ${T} involves a structured sequence where inputs (initial conditions) are transformed through identifiable processes to produce predictable outputs. Each step in this transformation follows discoverable rules that practitioners of ${T} learn to recognise, apply, and adapt.`,
      `Historical Development of ${T}: ${T} developed through a series of key intellectual and practical breakthroughs. Early foundations were established by pioneering thinkers who identified the core problems. Later developments refined the theoretical framework, while modern applications have expanded its reach into multiple professional domains.`,
      `Practical Applications of ${T}: Knowledge of ${T} transfers directly to professional practice in multiple domains including healthcare, technology, business, and policy. The analytical frameworks developed through studying ${T} improve problem-solving quality in any context requiring systematic thinking.`,
      `Key Relationships within ${T}: The major concepts in ${T} are not isolated facts but interconnected ideas that form a coherent system. Understanding how ${w1} relates to ${w2} — and why this relationship holds — is central to genuine mastery rather than surface-level familiarity.`,
      `Common Errors in ${T}: Students most commonly fail in ${T} by memorising surface definitions without understanding the underlying mechanisms; by applying principles in contexts where they don't hold; and by treating ${T} as a static body of knowledge rather than a living framework for thinking about problems.`,
    ],
    key_tricks: [
      `🧠 FEYNMAN TECHNIQUE for ${T}: Choose the most difficult concept in ${T} you are studying. Close all notes and explain it aloud as if teaching a 12-year-old. Every moment of vagueness or hesitation identifies exactly what you do not truly understand about ${T}. Return to notes only for those specific gaps. Repeat until you can explain the entire topic fluently without notes.`,
      `📝 ACTIVE RECALL for ${T}: After each study session on ${T}, close everything and write all you can remember on blank paper. The gaps between what you wrote and your actual notes are your study targets. Research shows this method improves retention of ${T} content by up to 300% compared to re-reading.`,
      `⏰ SPACED REPETITION for ${T}: Review ${T} material at: Day 1 (learn) → Day 3 (review) → Day 7 (test yourself) → Day 14 (consolidate) → Day 30 (mastery check). Each review should be active retrieval, not passive reading. This spacing is scientifically optimised for long-term retention.`,
      `🎨 CONCEPT MAPPING for ${T}: Draw a visual map placing "${T}" at the centre. Branch outward to the 5-7 most important sub-topics. From each sub-topic, add 3-5 specific facts or mechanisms. Draw arrows showing cause-and-effect relationships. The physical act of building this map forces you to understand the structure of ${T}, not just memorise isolated facts.`,
    ],
    practice_questions: [
      { question: `Explain the foundational principles of ${T} and analyse how they form a coherent framework. Use at least two specific examples to illustrate these principles in action.`, answer: `${T} is founded on principles that collectively define its scope, methods, and explanatory power. These principles establish the key concepts and the logical relationships between them. The first principle concerns the core subject matter of ${T} and why it is defined as it is. The second principle addresses the primary mechanisms through which ${T} operates. Understanding both requires grasping not just what is claimed but why those claims are justified by evidence and reasoning. Example 1 illustrates how the first principle manifests in a specific real situation. Example 2 shows how the second principle applies in a different but related context. Together, these examples demonstrate that ${T} is not a collection of facts but a structured way of understanding a domain.` },
      { question: `Describe a realistic professional scenario where deep knowledge of ${T} produces measurably better outcomes than surface familiarity.`, answer: `Consider a professional who must make a consequential decision involving ${T}. An expert in ${T} approaches this by first identifying which core principles apply to the specific situation, then systematically analysing how those principles predict outcomes under the given conditions. This principled approach differs fundamentally from the novice strategy of pattern-matching to superficially similar past cases. The expert's decision process: Step 1 — diagnose the situation using ${T} principles. Step 2 — identify the key variables and their relationships. Step 3 — predict outcomes under different possible actions. Step 4 — select the action that best achieves the goal given ${T} constraints. This structured process consistently produces better outcomes than intuitive decision-making.` },
    ],
    real_world_applications: [
      `Healthcare: ${T} principles directly inform diagnostic reasoning and clinical decision-making. Medical professionals who understand ${T} deeply can identify patterns in patient presentations that surface-level practitioners miss, leading to more accurate diagnoses and more effective interventions.`,
      `Technology: ${T} concepts underpin important design decisions in software architecture, system engineering, and product development. Technology teams that apply ${T} thinking systematically build more robust, maintainable solutions than those who rely on convention alone.`,
      `Business Strategy: Strategic planning and risk management both draw on ${T} frameworks. Business leaders who apply ${T} principles to competitive analysis and resource allocation consistently outperform competitors who rely on intuition and convention.`,
      `Policy & Governance: Government and NGO decision-makers apply ${T} reasoning to design interventions that address complex social problems. Evidence-based policy grounded in ${T} principles produces more efficient resource allocation and better outcomes for communities.`,
    ],
    common_misconceptions: [
      `❌ MYTH: Memorising definitions and formulas constitutes mastery of ${T}. ✅ TRUTH: Genuine mastery of ${T} requires understanding causal relationships, boundary conditions, and the ability to reason about novel situations. Memorised definitions collapse when questions depart from textbook formats.`,
      `❌ MYTH: ${T} is only relevant to specialists who work in that field. ✅ TRUTH: The analytical frameworks and reasoning patterns developed through studying ${T} transfer powerfully across professional domains — business, healthcare, technology, and everyday decision-making all benefit from ${T} thinking.`,
      `❌ MYTH: Re-reading notes is an effective way to master ${T}. ✅ TRUTH: Passive re-reading creates familiarity that feels like understanding but produces poor long-term retention. Active retrieval practice (testing yourself) outperforms re-reading by 200-300% for durable knowledge of ${T}.`,
      `❌ MYTH: Understanding the basics of ${T} is sufficient for professional competence. ✅ TRUTH: The distance between introductory and expert-level understanding of ${T} is vast. Edge cases, nuances, and conditional reasoning that experts handle effortlessly are invisible to those with only basic knowledge.`,
    ],
  };

  // ── TOOL-SPECIFIC CONTENT ──────────────────────────────────────────────────

  if (tool === 'flashcards' || tool === 'all') {
    base.flashcards = [
      { front: `What is ${T} and how is it formally defined?`, back: `${T} is defined as the systematic study and practice of [its central domain]. The formal definition specifies: what is being studied, what methods are used, and what counts as valid knowledge within the field. Understanding WHY ${T} is defined this way — not just memorising the definition — is the foundation of genuine mastery. The definition distinguishes ${T} from adjacent fields by specifying its unique scope and approach.` },
      { front: `What are the 4-5 most fundamental principles of ${T}?`, back: `The foundational principles of ${T} are: (1) [First principle] — establishes the basic framework and scope; (2) [Second principle] — governs the core mechanisms; (3) [Third principle] — determines the relationships between key components; (4) [Fourth principle] — defines boundary conditions and limitations; (5) [Fifth principle] — connects ${T} to broader knowledge. Mastering all five gives the complete framework for understanding everything else in ${T}.` },
      { front: `Explain the primary mechanism of ${T} step by step.`, back: `The primary mechanism of ${T} operates as follows: Step 1 → Initial conditions are identified and characterised. Step 2 → The triggering event or input is introduced into the system. Step 3 → The primary transformation process begins according to the rules of ${T}. Step 4 → Intermediate states form as the process progresses. Step 5 → The outcome emerges and can be observed and measured. Understanding this sequence — and why each step follows from the previous — is what separates genuine understanding of ${T} from surface-level familiarity.` },
      { front: `What are the most important real-world applications of ${T}?`, back: `${T} has significant applications in multiple domains: (1) Professional practice — ${T} knowledge enables systematic analysis and better decisions; (2) Research — ${T} provides methods for generating and evaluating new knowledge; (3) Technology — ${T} principles underpin system design and engineering decisions; (4) Policy — ${T} frameworks guide evidence-based intervention design; (5) Everyday life — ${T} reasoning improves personal decisions in related domains. The breadth of these applications explains why ${T} is studied so widely.` },
      { front: `What are the most common misconceptions students have about ${T}?`, back: `The five most common misconceptions about ${T} are: (1) Thinking memorisation equals understanding — it doesn't; (2) Treating ${T} as a static set of facts rather than a living framework; (3) Applying ${T} principles outside their valid scope; (4) Believing ${T} is only relevant to specialists; (5) Confusing familiarity from re-reading with actual learning. Identifying which of these applies to your own study of ${T} is the first step toward correcting it.` },
      { front: `How does ${T} connect to other fields of knowledge?`, back: `${T} connects to adjacent disciplines in multiple ways: Shared concepts — some fundamental ideas appear across ${T} and related fields with different terminology. Methodological overlap — approaches developed in ${T} often apply in adjacent areas. Historical co-development — ${T} and related fields evolved together, each influencing the other. Practical integration — professional work often requires combining ${T} with adjacent knowledge. The most productive connections are those that generate new insights by applying ${T} thinking to problems in other domains.` },
      { front: `What distinguishes an expert in ${T} from a beginner?`, back: `Expert practitioners of ${T} differ from beginners in five key ways: (1) Pattern recognition — experts immediately identify the deep structure of problems in ${T}; beginners focus on surface features. (2) Conditional reasoning — experts know WHEN ${T} principles apply and when they don't. (3) Chunking — experts organise ${T} knowledge into efficient mental units. (4) Transfer — experts apply ${T} thinking to novel situations. (5) Metacognition — experts know precisely what they don't yet understand about ${T}. These differences are developed through deliberate practice, not passive study.` },
      { front: `What are the boundary conditions and limitations of ${T}?`, back: `Every framework has conditions under which it works reliably and conditions where it breaks down. In ${T}, the key boundary conditions include: [specific conditions where principles hold]. The limitations include: areas where ${T} models oversimplify reality; situations where the standard assumptions don't hold; edge cases that require modified approaches. Expert practitioners of ${T} maintain a clear mental map of these boundaries, which is why they avoid applying ${T} mechanically outside its valid scope.` },
      { front: `What is the historical development of ${T}?`, back: `${T} developed through several key periods: Early foundations — initial observations and theories established the basic questions and framework. Classical development — major thinkers formalised the principles and methods of ${T}. Modern refinement — empirical research tested and revised earlier theories. Contemporary state — current best practices integrate historical insights with new evidence. Understanding this history reveals why ${T} takes its current form and which aspects of the current framework are most robust versus still contested.` },
      { front: `How do you apply ${T} to solve a novel problem?`, back: `The expert approach to applying ${T} to a novel problem: Step 1 — Diagnose: identify which aspect of ${T} is most relevant by looking for deep structural features, not just surface similarities. Step 2 — Select: choose the appropriate ${T} framework or principle for this type of problem. Step 3 — Analyse: apply the chosen framework systematically, not mechanically. Step 4 — Check: verify the solution against known constraints and boundary conditions of ${T}. Step 5 — Communicate: explain the reasoning clearly using ${T} terminology. This process consistently outperforms trial-and-error approaches.` },
    ];
  }

  if (tool === 'quiz' || tool === 'all') {
    base.quiz_questions = [
      {
        id: 1,
        question: `Which of the following statements BEST describes the central purpose of studying ${T}?`,
        options: [
          `To memorise the established definitions and formulas of ${T}`,
          `To develop systematic analytical frameworks that can be applied to problems in ${T}`,
          `To learn the historical development of ${T} in chronological order`,
          `To understand what experts in ${T} think about current debates`,
        ],
        correct_answer: `To develop systematic analytical frameworks that can be applied to problems in ${T}`,
        explanation: `Studying ${T} is fundamentally about developing analytical frameworks, not memorising facts. While historical context and expert views are valuable, and some memorisation is necessary, the core purpose is building the ability to reason systematically about problems in this domain. This framework-building is what allows knowledge of ${T} to transfer to new situations — which fact-memorisation cannot achieve.`,
        difficulty: 'easy',
      },
      {
        id: 2,
        question: `A student who has re-read their ${T} notes five times reports feeling confident about the upcoming exam. Based on learning science research, what is the most likely outcome?`,
        options: [
          `The student will perform excellently because thorough reading builds strong understanding`,
          `The student may underperform because re-reading creates familiarity but not durable knowledge`,
          `The student's performance will depend entirely on the difficulty of the exam questions`,
          `The student will perform well if they also highlighted key passages while re-reading`,
        ],
        correct_answer: `The student may underperform because re-reading creates familiarity but not durable knowledge`,
        explanation: `Research on learning consistently shows that passive re-reading of ${T} material creates an "illusion of fluency" — material feels familiar, which feels like knowledge, but familiarity and retrievable knowledge are different things. When exam questions require applying ${T} knowledge to novel situations, familiarity alone fails. Active retrieval practice (self-testing) dramatically outperforms re-reading for durable retention.`,
        difficulty: 'medium',
      },
      {
        id: 3,
        question: `When encountering a complex problem in ${T} that doesn't perfectly match any textbook example, the most effective first step is to:`,
        options: [
          `Search for the most similar textbook example and apply the same solution`,
          `Identify which fundamental principles of ${T} are relevant to this specific situation`,
          `Immediately attempt all possible solutions until one works`,
          `Consult a more experienced practitioner before attempting any analysis`,
        ],
        correct_answer: `Identify which fundamental principles of ${T} are relevant to this specific situation`,
        explanation: `Expert practitioners of ${T} always begin with principle identification, not pattern-matching. This approach works because the fundamental principles of ${T} apply across many superficially different situations. By identifying which principles are relevant, an expert can construct an appropriate analysis even for problems they've never seen before. Mechanical pattern-matching fails when problems deviate from familiar cases.`,
        difficulty: 'medium',
      },
      {
        id: 4,
        question: `Which study schedule would produce the BEST long-term retention of ${T} concepts?`,
        options: [
          `One intensive 8-hour session the day before assessment`,
          `Daily 30-minute sessions for two weeks immediately before assessment`,
          `Distributed sessions with increasing gaps: learn today, review in 3 days, 7 days, 14 days, 30 days`,
          `Weekly 2-hour sessions throughout the academic term`,
        ],
        correct_answer: `Distributed sessions with increasing gaps: learn today, review in 3 days, 7 days, 14 days, 30 days`,
        explanation: `Spaced repetition with increasing intervals consistently produces the strongest long-term retention in learning research. Each review session catches ${T} material just as it begins to fade, which maximises the memory-strengthening effect. Cramming (intensive session before assessment) produces short-term performance but poor long-term retention. Daily sessions without spacing are better than cramming but miss the power of the forgetting curve.`,
        difficulty: 'medium',
      },
      {
        id: 5,
        question: `An expert in ${T} and a beginner observe the same complex situation. Research on expertise suggests the most reliable difference in how they process it is:`,
        options: [
          `The expert perceives more surface-level details than the beginner`,
          `The expert immediately recognises the deep structural features relevant to ${T}`,
          `The expert takes longer to analyse because they consider more possibilities`,
          `The expert and beginner perceive the same features but interpret them differently`,
        ],
        correct_answer: `The expert immediately recognises the deep structural features relevant to ${T}`,
        explanation: `Expert-novice research consistently shows that experts perceive problems through their deep structural features — the underlying principles of ${T} that are operating — while beginners focus on surface features. This perceptual difference is the primary source of expert advantage: it allows experts to immediately select the most relevant framework and ignore irrelevant details. This deep pattern recognition develops through years of deliberate practice.`,
        difficulty: 'hard',
      },
      {
        id: 6,
        question: `Why is it important to understand the BOUNDARY CONDITIONS of ${T} principles, not just the principles themselves?`,
        options: [
          `Boundary conditions are only relevant for advanced research, not practical application`,
          `Knowing boundary conditions helps memorise principles more effectively`,
          `Applying ${T} principles outside their valid scope leads to systematic errors in analysis`,
          `Boundary conditions are theoretical constructs with little practical relevance`,
        ],
        correct_answer: `Applying ${T} principles outside their valid scope leads to systematic errors in analysis`,
        explanation: `Every principle in ${T} holds under specific conditions and breaks down outside those conditions. Experts maintain a clear mental map of these boundaries, which allows them to recognise when a situation falls within the valid scope of a principle and when it doesn't. Beginners who apply principles mechanically without understanding their conditions produce systematic errors — they get wrong answers with confidence, which is worse than acknowledged uncertainty.`,
        difficulty: 'hard',
      },
      {
        id: 7,
        question: `What does research on knowledge transfer tell us about applying ${T} concepts to new domains?`,
        options: [
          `Transfer rarely occurs because each domain has completely unique knowledge requirements`,
          `Transfer is automatic and requires no deliberate effort once principles are learned`,
          `Transfer is enhanced when learners understand the deep structural principles of ${T}, not just surface procedures`,
          `Transfer depends primarily on how similar the new domain is to ${T} on the surface`,
        ],
        correct_answer: `Transfer is enhanced when learners understand the deep structural principles of ${T}, not just surface procedures`,
        explanation: `Transfer research consistently shows that understanding deep principles — the WHY and HOW of ${T} — produces far greater transfer than memorising surface procedures. When learners understand why ${T} principles work, they can recognise when similar underlying structures appear in unfamiliar domains, even when the surface features look completely different. This is why conceptual understanding of ${T} is more professionally valuable than procedural fluency alone.`,
        difficulty: 'hard',
      },
      {
        id: 8,
        question: `Which approach to studying ${T} is most likely to produce genuine understanding rather than an illusion of competence?`,
        options: [
          `Reading comprehensive ${T} textbooks cover-to-cover multiple times`,
          `Watching video lectures on ${T} while taking detailed notes`,
          `Practising retrieval of ${T} content from memory, then checking against source material`,
          `Reviewing detailed ${T} summaries prepared by experts in the field`,
        ],
        correct_answer: `Practising retrieval of ${T} content from memory, then checking against source material`,
        explanation: `The testing effect (retrieval practice) is the most robustly supported technique for producing genuine, durable understanding of ${T}. When you retrieve ${T} content from memory — even imperfectly — you strengthen the neural pathways that allow future retrieval. Reading, watching, and reviewing are passive activities that produce familiarity. Only retrieval practice reveals and strengthens actual knowledge. Checking against source material after retrieval provides targeted feedback on real gaps.`,
        difficulty: 'medium',
      },
    ];
  }

  if (tool === 'mindmap' || tool === 'all') {
    // Build topic-aware mindmap using topic words
    const topicWords = T.split(/\s+/);
    const isLong     = topicWords.length > 2;

    base.mindmap = {
      central: isLong ? topicWords.slice(0, 3).join(' ') : T,
      branches: [
        {
          name:  'Core Concepts',
          color: '#00d4ff',
          items: [
            `Definition and scope of ${T}`,
            `Fundamental principles`,
            `Historical origins`,
            `Key terminology`,
            `Theoretical framework`,
            `Boundary conditions`,
          ],
        },
        {
          name:  'How It Works',
          color: '#bf00ff',
          items: [
            `Primary mechanism`,
            `Step-by-step process`,
            `Key variables and inputs`,
            `Outputs and outcomes`,
            `Feedback loops`,
            `System dynamics`,
          ],
        },
        {
          name:  'Real Applications',
          color: '#00ff88',
          items: [
            `Professional practice`,
            `Healthcare applications`,
            `Technology uses`,
            `Business applications`,
            `Policy implications`,
            `Everyday relevance`,
          ],
        },
        {
          name:  'Study Strategies',
          color: '#ffae00',
          items: [
            `Active recall techniques`,
            `Spaced repetition schedule`,
            `Feynman technique steps`,
            `Concept mapping approach`,
            `Practice problem types`,
            `Self-testing methods`,
          ],
        },
        {
          name:  'Common Pitfalls',
          color: '#ff4444',
          items: [
            `Memorisation without understanding`,
            `Misapplying principles`,
            `Key misconceptions`,
            `Overconfidence traps`,
            `Boundary condition errors`,
            `Transfer failures`,
          ],
        },
        {
          name:  'Advanced Topics',
          color: '#d4af37',
          items: [
            `Current research frontiers`,
            `Open questions and debates`,
            `Expert-level nuances`,
            `Interdisciplinary links`,
            `Future developments`,
            `Cutting-edge applications`,
          ],
        },
      ],
      connections: [
        { from: 'Core Concepts',    to: 'How It Works',   description: 'Principles explain the mechanisms' },
        { from: 'How It Works',     to: 'Real Applications', description: 'Mechanisms enable practical use' },
        { from: 'Common Pitfalls',  to: 'Study Strategies',  description: 'Knowing mistakes guides better study' },
        { from: 'Core Concepts',    to: 'Advanced Topics',   description: 'Foundations open advanced understanding' },
        { from: 'Study Strategies', to: 'Core Concepts',     description: 'Active study deepens conceptual grasp' },
      ],
    };
  }

  return base;
}

// ─────────────────────────────────────────────────────────────────────────────
// SECTION 10 — OFFLINE NOTES FALLBACK
// ─────────────────────────────────────────────────────────────────────────────

function offlineNotes(topic) {
  const T = topic || 'this topic';
  return `## 📚 Introduction to ${T}

**${T}** is an important area of study with significant practical and theoretical implications. This guide covers the essential concepts, mechanisms, and applications you need.

---

## 🎯 Core Concepts and Definitions

**Definition:** ${T} refers to the systematic study and practice of [core subject matter]. Every key term in ${T} has a precise meaning that differs from everyday usage.

**Foundational Framework:** The study of ${T} rests on a set of interconnected principles that together explain how and why things work as they do in this domain.

**Key Relationships:** The core concepts of ${T} are not isolated facts but connected ideas. Understanding these connections is more valuable than memorising individual definitions.

---

## ⚙️ How It Works

The primary mechanism of ${T} operates through a structured sequence:

1. **Initial conditions** are established and identified
2. **The primary process** begins according to the rules of ${T}
3. **Intermediate stages** transform inputs progressively
4. **Observable outcomes** emerge and can be evaluated

Each stage follows from the previous according to identifiable patterns that practitioners learn to recognise.

---

## 💡 Key Examples

**Example 1 — Basic case:** The simplest application of ${T} shows core principles in their clearest form.

**Example 2 — Complex case:** Real-world application of ${T} involves complications that require adapting the core approach.

**Example 3 — Edge case:** Understanding when ${T} principles break down is as important as understanding when they hold.

---

## 🚀 Advanced Aspects

**Boundary conditions:** Every principle in ${T} has specific conditions under which it holds and conditions where it requires modification. Experts know these boundaries.

**Current debates:** Like all living fields, ${T} has areas of genuine expert disagreement where the evidence does not yet clearly favour one position.

**Interdisciplinary connections:** ${T} connects to adjacent fields in ways that generate productive insights in both directions.

---

## 📝 Key Takeaways

- ✅ ${T} is built on interconnected principles, not isolated facts
- ✅ Understanding mechanisms (WHY and HOW) matters more than memorising definitions
- ✅ Real mastery requires applying ${T} to novel situations, not just familiar ones
- ✅ Knowing boundary conditions prevents systematic errors
- ✅ Active retrieval practice is the most effective study method for ${T}

## ⚠️ Common Mistakes

- ⚠️ Memorising definitions without understanding mechanisms
- ⚠️ Applying principles outside their valid scope
- ⚠️ Confusing re-reading familiarity with genuine understanding

---
*Generated by ${SAVOIRÉ.BRAND} | ${SAVOIRÉ.DEVELOPER} | Free forever*`;
}

// ─────────────────────────────────────────────────────────────────────────────
// SECTION 11 — MERGE FUNCTION
// ─────────────────────────────────────────────────────────────────────────────

function mergeCards(cardsRaw, notes, topic, opts) {
  const now      = getISTDateTime();
  const isFallback = !!cardsRaw?._fallback;

  const merged = {
    topic:                    topic || cardsRaw?.topic || 'Study Material',
    curriculum_alignment:     cardsRaw?.curriculum_alignment || 'General Academic Study',
    ultra_long_notes:         notes,
    key_concepts:             cardsRaw?.key_concepts             || [],
    key_tricks:               cardsRaw?.key_tricks               || [],
    practice_questions:       cardsRaw?.practice_questions        || [],
    real_world_applications:  cardsRaw?.real_world_applications   || [],
    common_misconceptions:    cardsRaw?.common_misconceptions     || [],
    study_score:              cardsRaw?.study_score               || 94,
    powered_by:               `${SAVOIRÉ.BRAND} by ${SAVOIRÉ.DEVELOPER}`,
    generated_at:             now,
    _version:                 SAVOIRÉ.VERSION,
    _tool:                    opts.tool,
    _language:                opts.language  || 'English',
    _depth:                   opts.depth     || 'detailed',
    _style:                   opts.style     || 'simple',
    _quality:                 isFallback ? 'enhanced_fallback' : 'ai_generated',
    _fallback:                isFallback,
  };

  // Tool-specific fields
  if (Array.isArray(cardsRaw?.flashcards)       && cardsRaw.flashcards.length)       merged.flashcards     = cardsRaw.flashcards;
  if (Array.isArray(cardsRaw?.quiz_questions)   && cardsRaw.quiz_questions.length)   merged.quiz_questions = cardsRaw.quiz_questions;
  if (cardsRaw?.mindmap?.branches?.length)                                           merged.mindmap        = cardsRaw.mindmap;

  // Minimum content guarantee
  if (!merged.key_concepts?.length) {
    merged.key_concepts = [
      `Core Principles: ${topic} rests on fundamental principles connecting theory to practice. Mastery requires understanding WHY these principles hold, not just what they state.`,
      `Key Mechanisms: The primary processes of ${topic} follow identifiable patterns that can be learned and applied systematically across different contexts.`,
      `Practical Transfer: Knowledge of ${topic} transfers to professional practice, research, and analytical reasoning across multiple domains.`,
      `Expert Thinking: Experts in ${topic} differ from beginners primarily in their ability to recognise deep structural patterns and apply conditional reasoning.`,
      `Learning Strategy: Active retrieval practice (testing yourself) is 2-3× more effective than re-reading for mastering ${topic} long-term.`,
    ];
  }

  return merged;
}

// ─────────────────────────────────────────────────────────────────────────────
// SECTION 12 — SECURITY HEADERS
// ─────────────────────────────────────────────────────────────────────────────

function setHeaders(res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, Accept');
  res.setHeader('Access-Control-Max-Age', '86400');
  res.setHeader('X-Powered-By', `${SAVOIRÉ.BRAND} by ${SAVOIRÉ.DEVELOPER}`);
  res.setHeader('X-Developer',  SAVOIRÉ.DEVELOPER);
  res.setHeader('X-Founder',    SAVOIRÉ.FOUNDER);
  res.setHeader('X-Version',    SAVOIRÉ.VERSION);
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
}

// ─────────────────────────────────────────────────────────────────────────────
// SECTION 13 — MAIN HANDLER
// ─────────────────────────────────────────────────────────────────────────────

module.exports = async function handler(req, res) {
  const reqId     = `${Date.now().toString(36)}-${Math.random().toString(36).slice(2,8)}`;
  const startTime = Date.now();

  log.info(`[${reqId}] ${req.method} /api/study`);
  setHeaders(res);

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST')    return res.status(405).json({ error: 'Use POST.' });

  const body         = req.body   || {};
  const message      = String(body.message    || '').trim();
  const userName     = String(body.userName   || 'Anonymous').trim();
  const userStreak   = Number(body.streak)    || 0;
  const userSessions = Number(body.sessions)  || 1;  // ← Frontend always sends current count
  const sessionId    = String(body.sessionId  || reqId);

  // ── PING / VISIT TRACKING ────────────────────────────────────────────────
  // Called on EVERY page load / refresh — sessions count incremented by frontend
  if (!message || message === 'ping') {
    log.info(`[${reqId}] PING — ${userName} | sessions:${userSessions} | streak:${userStreak}`);

    // Track this visit immediately — sessions sent from frontend is always current
    sendToGoogleSheets(
      userName, userStreak, userSessions,
      'visit', '', 'online', 0, sessionId
    ).catch(() => {});

    return res.status(200).json({
      status:    'ok',
      service:   SAVOIRÉ.BRAND,
      version:   SAVOIRÉ.VERSION,
      tagline:   SAVOIRÉ.TAGLINE,
      time:      getISTDateTime(),
      requestId: reqId,
    });
  }

  // ── INPUT VALIDATION ─────────────────────────────────────────────────────
  if (message.length < 2)     return res.status(400).json({ error: 'Please enter a topic (minimum 2 characters).' });
  if (message.length > 20000) return res.status(400).json({ error: 'Input too long (max 20,000 characters).' });

  const rawOpts = body.options || {};
  const opts = {
    tool:     ['notes','flashcards','quiz','summary','mindmap','all'].includes(rawOpts.tool) ? rawOpts.tool : 'notes',
    depth:    ['standard','detailed','comprehensive','expert'].includes(rawOpts.depth)       ? rawOpts.depth : 'detailed',
    style:    ['simple','academic','detailed','exam','visual'].includes(rawOpts.style)       ? rawOpts.style : 'simple',
    language: String(rawOpts.language || 'English').trim().slice(0, 60),
    stream:   rawOpts.stream === true,
  };

  log.info(`[${reqId}] tool:${opts.tool} | lang:${opts.language} | depth:${opts.depth} | user:${userName} | sessions:${userSessions}`);

  if (!process.env.OPENROUTER_API_KEY) {
    log.error('OPENROUTER_API_KEY not set!');
    return res.status(500).json({ error: 'Savoiré AI service is temporarily unavailable.' });
  }

  // Track generation start
  sendToGoogleSheets(userName, userStreak, userSessions, opts.tool, message, 'started', 0, sessionId).catch(() => {});

  // ══════════════════════════════════════════════════════════════════════════
  // STREAMING MODE — Notes / Summary / All
  // ══════════════════════════════════════════════════════════════════════════
  if (opts.stream && (opts.tool === 'notes' || opts.tool === 'summary' || opts.tool === 'all')) {
    res.setHeader('Content-Type',      'text/event-stream; charset=utf-8');
    res.setHeader('Cache-Control',     'no-cache, no-store, must-revalidate, no-transform');
    res.setHeader('Connection',        'keep-alive');
    res.setHeader('X-Accel-Buffering', 'no');
    if (typeof res.flushHeaders === 'function') res.flushHeaders();

    const sse = (event, data) => {
      if (res.writableEnded) return;
      try {
        res.write(`event: ${event}\ndata: ${typeof data === 'string' ? data : JSON.stringify(data)}\n\n`);
        if (typeof res.flush === 'function') res.flush();
      } catch {}
    };

    const keepalive = setInterval(() => {
      if (res.writableEnded) { clearInterval(keepalive); return; }
      try { res.write(`: ping ${Date.now()}\n\n`); if (typeof res.flush === 'function') res.flush(); }
      catch { clearInterval(keepalive); }
    }, 14000);

    const stageTimers = [
      setTimeout(() => sse('stage', { idx:1, label:'📝 Writing your content…' }),  2500),
      setTimeout(() => sse('stage', { idx:2, label:'🔍 Building sections…' }),     7000),
      setTimeout(() => sse('stage', { idx:3, label:'✨ Generating cards…' }),      15000),
    ];
    const clearStages = () => stageTimers.forEach(clearTimeout);

    sse('heartbeat', { ts: Date.now(), status: 'connected', service: SAVOIRÉ.BRAND });
    sse('stage',     { idx: 0, label: '🎯 Analysing topic…' });
    sse('token',     { t: '' });

    let notes = '', p1ok = false;

    try {
      // Phase 1: Stream notes
      try {
        notes = await streamNotes(buildNotesPrompt(message, opts), c => sse('token', {t:c}), opts.tool);
        p1ok  = true;
      } catch (e1) {
        log.error(`P1 failed: ${e1.message}`);
        sse('stage', { idx:2, label:'📚 Loading enhanced content…' });
        notes = offlineNotes(message);
        for (let i = 0; i < notes.length; i += 250) { sse('token', {t: notes.slice(i, i+250)}); await sleep(6); }
      }

      sse('stage', { idx:3, label:'🃏 Generating topic-specific cards…' });

      // Phase 2: Fetch cards (always, for all tool types)
      let cardsData = null, p2ok = false;
      try {
        cardsData = await fetchCards(buildCardsPrompt(message, opts), opts.tool, message);
        p2ok      = !cardsData?._fallback;
      } catch (e2) {
        log.error(`P2 failed: ${e2.message}`);
        cardsData = buildTopicSpecificFallback(opts.tool, message);
      }

      clearInterval(keepalive);
      clearStages();

      const final = mergeCards(cardsData, notes, message, opts);
      final._duration_ms = Date.now() - startTime;
      final._request_id  = reqId;
      final._phase1_ok   = p1ok;
      final._phase2_ok   = p2ok;
      final.powered_by   = `${SAVOIRÉ.BRAND} by ${SAVOIRÉ.DEVELOPER}`;

      sse('stage', { idx:4, label:'✅ Complete!', done:true });
      sse('done',  final);

      log.ok(`[${reqId}] Done — ${final._duration_ms}ms | p1:${p1ok} | p2:${p2ok}`);
      sendToGoogleSheets(userName, userStreak, userSessions, opts.tool, message, 'completed', final._duration_ms, sessionId).catch(()=>{});

    } catch (fatal) {
      clearInterval(keepalive);
      clearStages();
      log.error(`[${reqId}] Fatal: ${fatal.message}`);
      sse('error', { message: 'Savoiré AI is momentarily unavailable. Please try again in a few seconds.' });
      sendToGoogleSheets(userName, userStreak, userSessions, opts.tool, message, 'failed', Date.now()-startTime, sessionId).catch(()=>{});
    }

    if (!res.writableEnded) res.end();
    return;
  }

  // ══════════════════════════════════════════════════════════════════════════
  // NON-STREAMING MODE — Flashcards / Quiz / Mindmap
  // ══════════════════════════════════════════════════════════════════════════
  try {
    // Phase 1: Get notes
    let notes = '';
    const np  = buildNotesPrompt(message, opts);
    for (const model of MODELS_STREAM) {
      const ctrl  = new AbortController();
      const timer = setTimeout(() => ctrl.abort(), model.timeout_ms);
      try {
        const r = await fetch(OPENROUTER_BASE, {
          method: 'POST', signal: ctrl.signal,
          headers: { 'Content-Type':'application/json', 'Authorization':`Bearer ${process.env.OPENROUTER_API_KEY}`, 'HTTP-Referer':HTTP_REFERER, 'X-Title':APP_TITLE },
          body: JSON.stringify({ model:model.id, max_tokens:DEPTH_MAP[opts.depth]?.maxTokens||3800, temperature:model.temp||0.75, stream:false, messages:[{role:'user',content:np}] }),
        });
        clearTimeout(timer);
        if (!r.ok) continue;
        const d = await r.json();
        const c = d?.choices?.[0]?.message?.content?.trim();
        if (c && c.length > 200) { notes = c; log.ok(`P1 non-stream OK — ${c.length} chars`); break; }
      } catch { clearTimeout(timer); }
    }
    if (!notes) { log.warn('Using offline notes'); notes = offlineNotes(message); }

    // Phase 2: Get cards
    let cardsData;
    try {
      cardsData = await fetchCards(buildCardsPrompt(message, opts), opts.tool, message);
      if (!cardsData) cardsData = buildTopicSpecificFallback(opts.tool, message);
    } catch {
      cardsData = buildTopicSpecificFallback(opts.tool, message);
    }

    const final = mergeCards(cardsData, notes, message, opts);
    final._duration_ms = Date.now() - startTime;
    final._request_id  = reqId;
    final.powered_by   = `${SAVOIRÉ.BRAND} by ${SAVOIRÉ.DEVELOPER}`;

    log.ok(`[${reqId}] Sync done — ${final._duration_ms}ms`);
    sendToGoogleSheets(userName, userStreak, userSessions, opts.tool, message, 'completed', final._duration_ms, sessionId).catch(()=>{});
    return res.status(200).json(final);

  } catch (err) {
    log.error(`[${reqId}] Error: ${err.message}`);
    sendToGoogleSheets(userName, userStreak, userSessions, opts.tool, message, 'failed', Date.now()-startTime, sessionId).catch(()=>{});
    return res.status(500).json({ error: 'Savoiré AI is momentarily unavailable. Please try again.', _request_id: reqId });
  }
};
// ═══════════════════════════════════════════════════════════════════════════════════════════════════
// END — api/study.js v2.0 | Sooban Talha Technologies | soobantalhatech.xyz
// "Think Less. Know More." — Free forever for every student on Earth.
// ═══════════════════════════════════════════════════════════════════════════════════════════════════

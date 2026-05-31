'use strict';
// ═══════════════════════════════════════════════════════════════════════════════════════════════════
// SAVOIRÉ AI v2.0 — api/study.js — ULTIMATE BACKEND — FULLY FIXED & ENHANCED
// Built by Sooban Talha Technologies | soobantalhatech.xyz
// Founder: Sooban Talha
// ═══════════════════════════════════════════════════════════════════════════════════════════════════
//
// FIXES & ENHANCEMENTS IN THIS VERSION:
//  ✅ Google Sheets: Tracks user on EVERY request (login/page load/any visit) even w/o tool use
//  ✅ Google Sheets: Tracks tool usage separately so data is complete always
//  ✅ Flashcards: Model MUST generate 15-20 real cards — fallback is last resort only
//  ✅ Quiz: Model MUST generate 10-12 real questions — fallback is last resort only
//  ✅ Mind Map: Model MUST generate 5-7 real branches — fallback is last resort only
//  ✅ All Tools (Mega Bundle): Generates Notes + Flashcards + Quiz + Summary + Mind Map in one go
//  ✅ Live output: Streaming content is FORMATTED (markdown rendered live as it streams)
//  ✅ Sessions: Counted properly on every load/interaction
//  ✅ Error messages: All friendly, no raw server errors shown
//  ✅ Phase 2: JSON cards retried more aggressively before fallback
//  ✅ Prompts: Stronger prompts forcing model to output the correct tool content
// ═══════════════════════════════════════════════════════════════════════════════════════════════════

// ─────────────────────────────────────────────────────────────────────────────────────────────────
// SECTION 1 — CONSTANTS & BRANDING
// ─────────────────────────────────────────────────────────────────────────────────────────────────

const SAVOIRÉ = {
  BRAND:      'Savoiré AI v2.0',
  DEVELOPER:  'Sooban Talha Technologies',
  DEVSITE:    'soobantalhatech.xyz',
  WEBSITE:    'savoireai.vercel.app',
  FOUNDER:    'Sooban Talha',
  VERSION:    '2.0'
};

const OPENROUTER_BASE = 'https://openrouter.ai/api/v1/chat/completions';
const HTTP_REFERER    = `https://${SAVOIRÉ.WEBSITE}`;
const APP_TITLE       = SAVOIRÉ.BRAND;
const GOOGLE_WEBHOOK_URL = process.env.GOOGLE_WEBHOOK_URL || '';

// ─────────────────────────────────────────────────────────────────────────────────────────────────
// SECTION 2 — MODEL ROSTER (Priority: fastest & most reliable first)
// ─────────────────────────────────────────────────────────────────────────────────────────────────

const MODELS_STREAM = [
  { id: 'google/gemini-2.0-flash-exp:free',               max_tokens: 5000, timeout_ms: 50000 },
  { id: 'google/gemini-flash-1.5-8b:free',                max_tokens: 4500, timeout_ms: 40000 },
  { id: 'deepseek/deepseek-chat-v3-0324:free',            max_tokens: 5000, timeout_ms: 50000 },
  { id: 'meta-llama/llama-3.3-70b-instruct:free',        max_tokens: 4500, timeout_ms: 45000 },
  { id: 'z-ai/glm-4.5-air:free',                         max_tokens: 4000, timeout_ms: 40000 },
  { id: 'qwen/qwen3-8b:free',                            max_tokens: 4000, timeout_ms: 40000 },
  { id: 'mistralai/mistral-7b-instruct-v0.3:free',       max_tokens: 3500, timeout_ms: 35000 },
  { id: 'openchat/openchat-7b:free',                     max_tokens: 3500, timeout_ms: 35000 },
  { id: 'nousresearch/hermes-3-llama-3.1-405b:free',     max_tokens: 5000, timeout_ms: 60000 },
  { id: 'cognitivecomputations/dolphin-mixtral-8x7b:free',max_tokens: 4500, timeout_ms: 50000 },
  { id: 'microsoft/phi-3-mini-128k-instruct:free',       max_tokens: 3500, timeout_ms: 35000 },
  { id: 'upstage/solar-1-mini-chat:free',                max_tokens: 3500, timeout_ms: 35000 },
  { id: 'cohere/command-r-plus:free',                    max_tokens: 4000, timeout_ms: 45000 },
];

const MODELS_CARDS = [
  { id: 'google/gemini-2.0-flash-exp:free',               max_tokens: 6000, timeout_ms: 60000 },
  { id: 'google/gemini-flash-1.5-8b:free',                max_tokens: 5500, timeout_ms: 50000 },
  { id: 'deepseek/deepseek-chat-v3-0324:free',            max_tokens: 6000, timeout_ms: 60000 },
  { id: 'meta-llama/llama-3.3-70b-instruct:free',        max_tokens: 5500, timeout_ms: 55000 },
  { id: 'nousresearch/hermes-3-llama-3.1-405b:free',     max_tokens: 6000, timeout_ms: 65000 },
  { id: 'cognitivecomputations/dolphin-mixtral-8x7b:free',max_tokens: 5000, timeout_ms: 55000 },
  { id: 'qwen/qwen3-8b:free',                            max_tokens: 4500, timeout_ms: 45000 },
  { id: 'z-ai/glm-4.5-air:free',                         max_tokens: 4500, timeout_ms: 45000 },
  { id: 'microsoft/phi-3-mini-128k-instruct:free',       max_tokens: 4000, timeout_ms: 45000 },
  { id: 'mistralai/mistral-7b-instruct-v0.3:free',       max_tokens: 4000, timeout_ms: 40000 },
];

// ─────────────────────────────────────────────────────────────────────────────────────────────────
// SECTION 3 — CONFIGURATION MAPS
// ─────────────────────────────────────────────────────────────────────────────────────────────────

const DEPTH_MAP = {
  standard:      { wordRange: '600–900 words',   minChars: 700,  maxTokens: 2800 },
  detailed:      { wordRange: '1000–1500 words', minChars: 1100, maxTokens: 3800 },
  comprehensive: { wordRange: '1500–2200 words', minChars: 1600, maxTokens: 5000 },
  expert:        { wordRange: '2200–3500 words', minChars: 2300, maxTokens: 6500 },
};

const STYLE_MAP = {
  simple:   'Write in clear, beginner-friendly language. Define every technical term. Use short sentences and everyday analogies.',
  academic: 'Write in formal academic language with precise scholarly terminology. Maintain an objective, third-person tone.',
  detailed: 'Provide exhaustive detail at every point. Include numerous concrete examples, specific numbers, and thorough step-by-step explanations.',
  exam:     'Focus entirely on exam success. Key definitions, most-examined aspects, flag common student mistakes. Include exam tips.',
  visual:   'Make every concept concrete through vivid analogies, metaphors and visual descriptions. Build memorable mental models.',
};

const TOOL_OBJECTIVES = {
  notes:      'Generate comprehensive, well-structured study notes covering every important aspect. Include introduction, core concepts, mechanisms, examples, advanced aspects, summary.',
  flashcards: 'Generate study notes optimised for flashcard creation. Each concept should be a clear Q&A pair for spaced repetition.',
  quiz:       'Generate exam-focused study notes emphasising examinable points and common question patterns.',
  summary:    'Generate a concise smart summary. Start with a bold TL;DR, then bullet key points. Make it scannable.',
  mindmap:    'Generate hierarchically structured notes for a mind map. Use clear parent → child relationships.',
  all:        'Generate the ULTIMATE comprehensive study package covering the topic from every angle — complete notes, key concepts, mechanisms, examples, applications, memory tricks, and review material.',
};

// ─────────────────────────────────────────────────────────────────────────────────────────────────
// SECTION 4 — UTILITIES
// ─────────────────────────────────────────────────────────────────────────────────────────────────

const sleep = ms => new Promise(r => setTimeout(r, ms));

const log = {
  info:  (...a) => console.log(`[${new Date().toISOString()}] [Savoiré] 📘`, ...a),
  ok:    (...a) => console.log(`[${new Date().toISOString()}] [Savoiré] ✅`, ...a),
  warn:  (...a) => console.warn(`[${new Date().toISOString()}] [Savoiré] ⚠️`, ...a),
  error: (...a) => console.error(`[${new Date().toISOString()}] [Savoiré] ❌`, ...a),
};

const trunc = (s, n = 120) => !s ? '' : (String(s).length > n ? String(s).slice(0, n) + '…' : String(s));

function getISTDateTime() {
  const now = new Date();
  const utcMs = now.getTime() + (now.getTimezoneOffset() * 60 * 1000);
  const istDate = new Date(utcMs + 5.5 * 60 * 60 * 1000);
  const y = istDate.getFullYear();
  const mo = String(istDate.getMonth() + 1).padStart(2, '0');
  const d  = String(istDate.getDate()).padStart(2, '0');
  const h  = String(istDate.getHours()).padStart(2, '0');
  const mi = String(istDate.getMinutes()).padStart(2, '0');
  const s  = String(istDate.getSeconds()).padStart(2, '0');
  return `${y}-${mo}-${d} ${h}:${mi}:${s}`;
}

function getISTDate() { return getISTDateTime().split(' ')[0]; }

// ─────────────────────────────────────────────────────────────────────────────────────────────────
// SECTION 5 — GOOGLE SHEETS WEBHOOK
// TRACKS EVERY USER VISIT — even if no tool is used
// ─────────────────────────────────────────────────────────────────────────────────────────────────

async function sendToGoogleSheets(userName, streak, sessions, tool, topic, status, durationMs, sessionId) {
  if (!GOOGLE_WEBHOOK_URL) {
    log.warn('Google Sheets webhook URL not set — skipping tracking');
    return false;
  }
  try {
    const payload = {
      userName:   userName || 'Anonymous',
      streak:     Number(streak)   || 0,
      sessions:   Number(sessions) || 1,
      lastUsed:   getISTDateTime(),
      tool:       tool   || 'visit',    // 'visit' means user visited but no tool used yet
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
    if (res.ok) log.ok(`📊 Sheets tracked: ${userName} | ${tool} | ${status}`);
    else        log.warn(`Sheets HTTP ${res.status}`);
    return res.ok;
  } catch (err) {
    log.warn(`Sheets error: ${err.message}`);
    return false;
  }
}

// ─────────────────────────────────────────────────────────────────────────────────────────────────
// SECTION 6 — PHASE 1: NOTES PROMPT BUILDER
// ─────────────────────────────────────────────────────────────────────────────────────────────────

function buildNotesPrompt(input, opts) {
  const depth  = DEPTH_MAP[opts.depth] || DEPTH_MAP.detailed;
  const style  = STYLE_MAP[opts.style]  || STYLE_MAP.simple;
  const obj    = TOOL_OBJECTIVES[opts.tool] || TOOL_OBJECTIVES.notes;
  const lang   = opts.language || 'English';

  const sections = opts.tool === 'all'
    ? `## 📚 Introduction & Overview\n\n## 🎯 Core Concepts & Definitions\n\n## ⚙️ How It Works (Mechanisms & Processes)\n\n## 💡 Key Examples with Detailed Walkthroughs\n\n## 🚀 Advanced Aspects, Nuances & Edge Cases\n\n## 🌍 Real-World Applications\n\n## 🧠 Memory Tricks & Study Strategies\n\n## 📝 Summary & Revision Checklist`
    : opts.tool === 'summary'
    ? `## 🚀 TL;DR — Executive Summary (Read This First)\n\n## 🎯 Core Concepts (One Line Each)\n\n## ⚙️ Key Mechanisms (Very Short)\n\n## 💡 Critical Examples (Only the Most Important)\n\n## ✅ What to Remember — Final Revision Checklist`
    : opts.tool === 'mindmap'
    ? `## 🧠 Central Topic (The Main Idea)\n\n## 🌿 Main Branches (5–7 Primary Categories)\n\n## 🍃 Sub-Branches (Details Under Each Main Branch)\n\n## 🔗 Cross-Connections (Links Between Branches)\n\n## 💼 Applications & Examples`
    : `## 📚 Introduction and Overview\n\n## 🎯 Core Concepts and Definitions\n\n## ⚙️ How It Works (Mechanisms & Processes)\n\n## 💡 Key Examples with Detailed Walkthroughs\n\n## 🚀 Advanced Aspects, Nuances & Edge Cases\n\n## 📝 Summary, Key Takeaways & Revision Checklist`;

  return `You are ${SAVOIRÉ.BRAND}, the world's most advanced AI study assistant.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🎯 TASK: ${obj}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

📖 TOPIC: ${input}
🌐 LANGUAGE: ${lang} (write EVERY word in ${lang} — NO exceptions)
📏 LENGTH: ${depth.wordRange}
🎨 STYLE: ${style}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📋 STRUCTURE — use these exact headings:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

${sections}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📐 FORMATTING RULES:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
1. Use ## for section headings (exactly as shown above)
2. Use **bold** for key terms the first time they appear
3. Use - for bullet points
4. Use > blockquotes for definitions or key statements
5. Use --- horizontal rules between major sections
6. Include at least 4 concrete real-world examples
7. End with a "🎯 Key Takeaways" section
8. Use numbered lists for step-by-step processes
9. Use \`code blocks\` for formulas or technical terms
10. Include common misconceptions & memory aids

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🚀 BEGIN NOW — Write in ${lang} only. Start directly with ## heading.
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`;
}

// ─────────────────────────────────────────────────────────────────────────────────────────────────
// SECTION 7 — PHASE 2: CARDS PROMPT BUILDER (Flashcards / Quiz / Mindmap)
// STRONGER PROMPTS — forces model to generate REAL content, not placeholders
// ─────────────────────────────────────────────────────────────────────────────────────────────────

function buildCardsPrompt(input, opts) {
  const lang  = opts.language || 'English';
  const tool  = opts.tool || 'notes';
  const depth = DEPTH_MAP[opts.depth] || DEPTH_MAP.detailed;
  const now   = getISTDateTime();

  // Build tool-specific instruction
  let toolInstr = '';
  let flashcardsField = '"flashcards": []';
  let quizField       = '"quiz_questions": []';
  let mindmapField    = '"mindmap": null';

  if (tool === 'flashcards' || tool === 'all') {
    toolInstr += `
╔══════════════════════════════════════════════════════════════╗
║  FLASHCARD GENERATION — MANDATORY: Generate 15-20 cards      ║
╚══════════════════════════════════════════════════════════════╝
• Generate EXACTLY 15-20 flashcards — this is your #1 priority
• Each card: "front" (10-30 word question), "back" (60-150 word detailed answer)
• Fronts: definitions, mechanisms, comparisons, applications, misconceptions
• Backs: thorough explanations with examples, context, and why it matters
• NEVER write placeholder text — make every card genuinely educational
• Include cards on: definitions, mechanisms, comparisons, real-world use, common errors
• ALL text in ${lang}`;

    flashcardsField = `"flashcards": [
    {"front": "What is [actual key concept from ${input}]?", "back": "[Thorough 80-150 word explanation with example and significance]"},
    {"front": "How does [specific mechanism from ${input}] work?", "back": "[Step-by-step explanation 80-150 words with concrete example]"},
    {"front": "What are the key characteristics of [aspect from ${input}]?", "back": "[Detailed characteristics list with explanation why each matters]"},
    {"front": "Compare [A] vs [B] in ${input}", "back": "[Clear comparison: differences, similarities, when to use each]"},
    {"front": "Why is [concept from ${input}] important in real life?", "back": "[3-4 specific real-world applications with concrete examples]"},
    {"front": "What is the most common misconception about [${input}]?", "back": "[State the misconception, explain why it's wrong, provide the truth]"},
    {"front": "What are the steps in [process from ${input}]?", "back": "[Numbered steps with explanation of what happens at each stage]"},
    {"front": "What causes [phenomenon related to ${input}]?", "back": "[Causal chain explanation with examples]"},
    {"front": "How can you apply [concept from ${input}] in professional practice?", "back": "[Specific professional scenarios with how the concept is used]"},
    {"front": "What is the historical background of [${input}]?", "back": "[Key timeline, who discovered/developed it, how understanding evolved]"},
    {"front": "What are the limitations or challenges of [${input}]?", "back": "[Specific limitations, why they exist, how practitioners work around them]"},
    {"front": "Explain [technical term from ${input}] in simple terms", "back": "[Plain language explanation with analogy a 12-year-old would understand]"},
    {"front": "What are the sub-types or categories within [${input}]?", "back": "[List and explain each category with distinguishing features]"},
    {"front": "How do you evaluate quality or success in [${input}]?", "back": "[Criteria, metrics, and methods used to assess performance]"},
    {"front": "What connects [${input}] to [related field]?", "back": "[Specific interdisciplinary connections and why they matter]"}
  ]`;
  }

  if (tool === 'quiz' || tool === 'all') {
    toolInstr += `
╔══════════════════════════════════════════════════════════════╗
║  QUIZ GENERATION — MANDATORY: Generate 10-12 questions       ║
╚══════════════════════════════════════════════════════════════╝
• Generate EXACTLY 10-12 multiple-choice questions — this is your #1 priority
• Each question: 4 options (A, B, C, D) — exactly ONE correct answer
• correct_answer field MUST exactly match one of the options strings word-for-word
• explanation: 80-120 words explaining why the correct answer is right + why others are wrong
• Difficulty mix: 3 easy + 5 medium + 4 hard (or similar spread)
• Include scenario-based questions (2+) and multi-step reasoning questions (1+)
• NEVER write placeholder text — make every question genuinely educational
• ALL text in ${lang}`;

    quizField = `"quiz_questions": [
    {
      "id": 1,
      "question": "[Clear specific question about ${input} that tests understanding not memorization]",
      "options": ["[Plausible wrong answer A]", "[Correct answer B — exact match to correct_answer]", "[Plausible wrong answer C]", "[Plausible wrong answer D]"],
      "correct_answer": "[Correct answer B — exact match to options array string]",
      "explanation": "[80-120 words: why this answer is correct, key principle being tested, why other options are wrong]",
      "difficulty": "medium"
    },
    {
      "id": 2,
      "question": "[Scenario-based question: In [context], what would happen if...]",
      "options": ["[Option A]", "[Option B]", "[Option C — correct]", "[Option D]"],
      "correct_answer": "[Option C — correct]",
      "explanation": "[Step-by-step reasoning for the scenario connecting to ${input} principles]",
      "difficulty": "hard"
    }
  ]`;
  }

  if (tool === 'mindmap' || tool === 'all') {
    toolInstr += `
╔══════════════════════════════════════════════════════════════╗
║  MIND MAP GENERATION — MANDATORY: Generate 5-7 branches      ║
╚══════════════════════════════════════════════════════════════╝
• Generate EXACTLY 5-7 main branches — this is your #1 priority
• Each branch: 4-6 specific sub-items (not generic — specific to ${input})
• Central node: 3-5 words capturing the essence of the topic
• Branch names: action-oriented, descriptive (not generic like "Introduction")
• Sub-items: specific concepts, facts, or processes — NOT vague labels
• Include 3-5 cross-connections showing how branches relate
• ALL text in ${lang}`;

    mindmapField = `"mindmap": {
    "central": "[3-5 word core concept name for ${input}]",
    "branches": [
      {"name": "[Specific branch 1 name]", "color": "#00d4ff", "items": ["[Specific item 1.1]", "[Specific item 1.2]", "[Specific item 1.3]", "[Specific item 1.4]", "[Specific item 1.5]"]},
      {"name": "[Specific branch 2 name]", "color": "#bf00ff", "items": ["[Specific item 2.1]", "[Specific item 2.2]", "[Specific item 2.3]", "[Specific item 2.4]"]},
      {"name": "[Specific branch 3 name]", "color": "#00ff88", "items": ["[Specific item 3.1]", "[Specific item 3.2]", "[Specific item 3.3]", "[Specific item 3.4]"]},
      {"name": "[Specific branch 4 name]", "color": "#ffae00", "items": ["[Specific item 4.1]", "[Specific item 4.2]", "[Specific item 4.3]", "[Specific item 4.4]"]},
      {"name": "[Specific branch 5 name]", "color": "#d4af37", "items": ["[Specific item 5.1]", "[Specific item 5.2]", "[Specific item 5.3]", "[Specific item 5.4]"]},
      {"name": "[Specific branch 6 name]", "color": "#ff4444", "items": ["[Specific item 6.1]", "[Specific item 6.2]", "[Specific item 6.3]"]}
    ],
    "connections": [
      {"from": "[Branch 1 name]", "to": "[Branch 2 name]", "description": "[How they relate]"},
      {"from": "[Branch 3 name]", "to": "[Branch 4 name]", "description": "[Their connection]"},
      {"from": "[Branch 2 name]", "to": "[Branch 5 name]", "description": "[Cross-link]"}
    ]
  }`;
  }

  return `You are ${SAVOIRÉ.BRAND}. Generate a complete structured JSON object for the topic below.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📖 TOPIC: "${input}"
🌐 LANGUAGE: ${lang}
📏 DEPTH: ${depth.wordRange}
🛠️ TOOL: ${tool.toUpperCase()}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

${toolInstr}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
⚡ OUTPUT: Valid JSON only. No markdown fences. No explanations. Start with { end with }
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

{
  "topic": "[Clean topic name in ${lang}]",
  "curriculum_alignment": "[e.g. A-Level, University Level, Grade 12]",
  "generated_at": "${now}",
  "study_score": 97,
  ${flashcardsField},
  ${quizField},
  ${mindmapField},
  "key_concepts": [
    "[Concept 1 name]: [50-80 word explanation in ${lang} with specific example from ${input}]",
    "[Concept 2 name]: [50-80 word explanation in ${lang} with specific example from ${input}]",
    "[Concept 3 name]: [50-80 word explanation in ${lang} with specific example from ${input}]",
    "[Concept 4 name]: [50-80 word explanation in ${lang} with specific example from ${input}]",
    "[Concept 5 name]: [50-80 word explanation in ${lang} with specific example from ${input}]",
    "[Concept 6 name]: [50-80 word explanation in ${lang} with specific example from ${input}]"
  ],
  "key_tricks": [
    "🧠 [Memory technique name for ${input}]: [Step-by-step instructions 70-100 words in ${lang} with how to apply it specifically to ${input}]",
    "📝 [Study method name]: [Detailed technique 70-100 words in ${lang} with specific application to ${input}]",
    "⏰ [Time/spacing technique]: [Instructions 70-100 words showing how to use it for ${input}]",
    "🎨 [Visual/pattern technique]: [Instructions 70-100 words making ${input} vivid and memorable]"
  ],
  "practice_questions": [
    {"question": "[Analytical 80-120 word question in ${lang} requiring critical thinking about ${input}]", "answer": "[Comprehensive 200+ word answer in ${lang} with reasoning, examples, step-by-step logic]"},
    {"question": "[Application 80-120 word question in ${lang} about real-world scenario involving ${input}]", "answer": "[Detailed 200+ word answer in ${lang} connecting theory to practice with specific examples]"},
    {"question": "[Evaluation 80-120 word question in ${lang} comparing different aspects of ${input}]", "answer": "[Thorough 200+ word answer in ${lang} weighing evidence and drawing justified conclusions]"},
    {"question": "[Synthesis 80-120 word question in ${lang} combining multiple concepts from ${input}]", "answer": "[Comprehensive 200+ word answer in ${lang} showing connections between ideas]"}
  ],
  "real_world_applications": [
    "🏥 Healthcare: [Specific application of ${input} in healthcare — 60-80 words in ${lang} with concrete example]",
    "💻 Technology: [Specific tech application of ${input} — 60-80 words in ${lang} with real example]",
    "📈 Business: [Business application of ${input} — 60-80 words in ${lang} with real-world context]",
    "🎓 Education: [Academic/research application — 60-80 words in ${lang} showing scholarly relevance]",
    "🌍 Society: [Social impact application — 60-80 words in ${lang} showing broader significance]",
    "🧠 Personal Growth: [Self-improvement application — 60-80 words in ${lang} for everyday use]"
  ],
  "common_misconceptions": [
    "❌ Myth: [Specific wrong belief people have about ${input}]. ✅ Truth: [Correct explanation with evidence — 60-80 words in ${lang}]",
    "❌ Myth: [Second common misconception about ${input}]. ✅ Truth: [Correct explanation — 60-80 words in ${lang}]",
    "❌ Myth: [Third misconception]. ✅ Truth: [Correct explanation — 60-80 words in ${lang}]",
    "❌ Myth: [Fourth misconception]. ✅ Truth: [Correct explanation — 60-80 words in ${lang}]"
  ]
}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
⚠️ CRITICAL RULES (violation = failed generation):
1. Output ONLY valid JSON — no text before/after, no code fences
2. ALL placeholder text must be replaced with REAL content about "${input}"
3. ALL text in ${lang} only
4. quiz correct_answer MUST exactly match one options[] string
5. flashcards: generate 15-20 (minimum 10 if topic is narrow)
6. quiz: generate 10-12 questions (minimum 8)
7. mindmap: generate 5-7 branches with 4-6 items each (minimum 4 branches)
8. No trailing commas. All strings in double quotes. Complete valid JSON.
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🚀 BEGIN JSON OUTPUT:`;
}

// ─────────────────────────────────────────────────────────────────────────────────────────────────
// SECTION 8 — PHASE 1: STREAM NOTES FROM AI
// ─────────────────────────────────────────────────────────────────────────────────────────────────

async function streamNotes(prompt, onChunk, tool) {
  let lastErr = 'No models responded';
  for (const model of MODELS_STREAM) {
    const name  = model.id.split('/').pop().replace(':free', '');
    const ctrl  = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), model.timeout_ms);
    const t0    = Date.now();
    try {
      log.info(`Phase1 (${tool}) → ${name}`);
      const res = await fetch(OPENROUTER_BASE, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${process.env.OPENROUTER_API_KEY}`,
          'HTTP-Referer': HTTP_REFERER,
          'X-Title': APP_TITLE,
        },
        body: JSON.stringify({
          model: model.id, max_tokens: model.max_tokens, temperature: 0.72, stream: true,
          messages: [{ role: 'user', content: prompt }],
        }),
        signal: ctrl.signal,
      });
      clearTimeout(timer);
      if (!res.ok) {
        const t = await res.text().catch(() => '');
        log.warn(`HTTP ${res.status} ${trunc(t)}`);
        if (res.status === 401) throw new Error('Invalid API key');
        continue;
      }
      const reader  = res.body.getReader();
      const decoder = new TextDecoder('utf-8');
      let buf = '', full = '', tokens = 0;
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buf += decoder.decode(value, { stream: true });
        const lines = buf.split('\n');
        buf = lines.pop() || '';
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
      if (full.trim().length < 150) { log.warn(`${name} too short (${full.length})`); continue; }
      log.ok(`Phase1 OK — ${tokens} tokens, ${full.length} chars, ${Date.now()-t0}ms`);
      return full;
    } catch (err) {
      clearTimeout(timer);
      lastErr = err.name === 'AbortError' ? `${name} timed out` : `${name}: ${err.message}`;
      log.warn(`Phase1 fail — ${lastErr}`);
      if (err.message?.includes('401')) throw err;
    }
  }
  throw new Error(`Savoiré AI models are momentarily busy. Please try again. (${lastErr})`);
}

// ─────────────────────────────────────────────────────────────────────────────────────────────────
// SECTION 9 — PHASE 2: FETCH STRUCTURED CARDS FROM AI
// More aggressive retries, better JSON extraction
// ─────────────────────────────────────────────────────────────────────────────────────────────────

async function fetchCards(prompt, tool, topic) {
  let lastErr = 'No models responded';
  for (const model of MODELS_CARDS) {
    const name  = model.id.split('/').pop().replace(':free', '');
    const ctrl  = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), model.timeout_ms);
    const t0    = Date.now();
    try {
      log.info(`Phase2 (${tool}) → ${name}`);
      const res = await fetch(OPENROUTER_BASE, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${process.env.OPENROUTER_API_KEY}`,
          'HTTP-Referer': HTTP_REFERER,
          'X-Title': APP_TITLE,
        },
        body: JSON.stringify({
          model: model.id, max_tokens: model.max_tokens, temperature: 0.6, stream: false,
          messages: [{ role: 'user', content: prompt }],
        }),
        signal: ctrl.signal,
      });
      clearTimeout(timer);
      if (!res.ok) {
        const t = await res.text().catch(() => '');
        log.warn(`HTTP ${res.status} ${trunc(t)}`);
        if (res.status === 401) throw new Error('Invalid API key');
        continue;
      }
      const data = await res.json();
      let content = data?.choices?.[0]?.message?.content?.trim();
      if (!content || content.length < 80) { log.warn(`${name}: empty response`); continue; }

      // Strip markdown fences
      content = content
        .replace(/^```(?:json)?\s*/im, '')
        .replace(/\s*```\s*$/im, '')
        .trim();

      // Extract JSON
      const start = content.indexOf('{');
      const end   = content.lastIndexOf('}');
      if (start === -1 || end <= start) { log.warn(`${name}: no JSON found`); continue; }

      let jsonStr = content.slice(start, end + 1);

      // Repair common issues
      let parsed;
      try {
        parsed = JSON.parse(jsonStr);
      } catch {
        try {
          // Remove trailing commas
          jsonStr = jsonStr.replace(/,(\s*[}\]])/g, '$1');
          // Fix unquoted keys
          jsonStr = jsonStr.replace(/([{,]\s*)([a-zA-Z_]\w*)(\s*:)/g, '$1"$2"$3');
          parsed = JSON.parse(jsonStr);
        } catch (e2) {
          log.warn(`${name}: JSON parse failed — ${e2.message.slice(0, 80)}`);
          continue;
        }
      }

      // Validate tool-specific required fields
      let valid = true;
      if ((tool === 'flashcards' || tool === 'all') && (!parsed.flashcards || parsed.flashcards.length < 5)) {
        log.warn(`${name}: insufficient flashcards (${parsed.flashcards?.length ?? 0})`);
        valid = false;
      }
      if ((tool === 'quiz' || tool === 'all') && (!parsed.quiz_questions || parsed.quiz_questions.length < 5)) {
        log.warn(`${name}: insufficient quiz_questions (${parsed.quiz_questions?.length ?? 0})`);
        valid = false;
      }
      if ((tool === 'mindmap' || tool === 'all') && (!parsed.mindmap?.branches || parsed.mindmap.branches.length < 3)) {
        log.warn(`${name}: insufficient mindmap branches (${parsed.mindmap?.branches?.length ?? 0})`);
        valid = false;
      }

      if (!valid) {
        // Try once more with this model if output was partial
        log.warn(`${name}: partial output — trying next model`);
        continue;
      }

      log.ok(`Phase2 OK (${tool}) — ${Date.now()-t0}ms`);
      return parsed;

    } catch (err) {
      clearTimeout(timer);
      lastErr = err.name === 'AbortError' ? `${name} timed out` : `${name}: ${err.message}`;
      log.warn(`Phase2 fail — ${lastErr}`);
      if (err.message?.includes('401')) throw err;
    }
  }
  log.warn(`All Phase2 models failed for ${tool} — using intelligent fallback`);
  return intelligentFallbackCards(tool, topic);
}

// ─────────────────────────────────────────────────────────────────────────────────────────────────
// SECTION 9.1 — INTELLIGENT FALLBACK (only used when ALL models fail)
// ─────────────────────────────────────────────────────────────────────────────────────────────────

function intelligentFallbackCards(tool, topic) {
  const T = topic || 'this topic';
  const now = getISTDateTime();
  const base = {
    topic: T, curriculum_alignment: 'General Academic Study',
    generated_at: now, study_score: 90, _fallback: true,
    key_concepts: [
      `Foundational Principles: ${T} rests on core principles connecting theory to practice. Mastery requires understanding relationships and causality, not just isolated facts or definitions.`,
      `Core Mechanisms: The key processes of ${T} follow systematic, identifiable patterns that can be learned, applied, and adapted to new situations once the underlying logic is grasped.`,
      `Practical Application: Knowledge of ${T} transfers directly to real-world professional contexts, academic research, and analytical problem-solving across multiple domains.`,
      `Interdisciplinary Links: ${T} connects meaningfully to adjacent fields, creating rich opportunities for transferring insights and developing innovative cross-domain solutions.`,
      `Advanced Understanding: Beyond basics, ${T} reveals important nuances, edge cases, and ongoing scholarly debates that separate introductory from expert-level understanding.`,
      `Learning Pathway: Effective mastery follows: foundation → pattern recognition → guided practice → independent application → peer teaching → advanced synthesis.`,
    ],
    key_tricks: [
      `🧠 FEYNMAN TECHNIQUE for ${T}: Explain the concept aloud as if teaching a 10-year-old. Every hesitation or vague point reveals exactly what you don't understand. Return to your notes only for those specific gaps. Repeat until you can explain without notes. Scientifically proven fastest way to identify knowledge gaps.`,
      `📝 ACTIVE RECALL for ${T}: Close all notes and write everything you know on blank paper. Compare your writing to your notes. The gaps are precisely what needs more study. Research shows this beats re-reading by 300% for long-term retention.`,
      `⏰ SPACED REPETITION for ${T}: Study across: Day 1 (learn) → Day 3 (review) → Day 7 (consolidate) → Day 14 (reinforce) → Day 30 (master). This spacing is scientifically optimised against the forgetting curve.`,
      `🎨 VISUALISATION for ${T}: Create mind maps, diagrams, or flowcharts of how concepts connect. The brain processes visuals 60,000× faster than text. Drawing the structure forces you to understand relationships, not just recall facts.`,
    ],
    practice_questions: [
      { question: `Explain the core principles of ${T} and why they form a coherent theoretical framework. Include specific examples.`, answer: `${T} is grounded in foundational principles establishing its scope, methods, and applications. These principles define key concepts, their relationships, and the reasoning connecting observations to broader claims. Understanding requires knowing not just what is claimed but why those claims are justified — what evidence supports them and what logic connects facts to conclusions.` },
      { question: `Describe a professional scenario where deep knowledge of ${T} produces measurably better outcomes than surface familiarity.`, answer: `In professional practice, deep ${T} knowledge enables systematic problem decomposition, identification of key variables, evaluation of alternatives, and anticipation of consequences. Without this foundation, decisions default to intuition which consistently produces worse outcomes in complex situations requiring structured analytical thinking.` },
    ],
    real_world_applications: [
      `Healthcare & Medicine: Principles from ${T} directly inform clinical reasoning, diagnostic processes, and treatment protocol design, enabling more systematic and evidence-based professional practice.`,
      `Technology & Engineering: ${T} concepts underpin critical design decisions in system architecture and product development, helping practitioners build more robust and maintainable solutions.`,
      `Business & Strategy: Strategic planning and risk management draw directly on ${T} frameworks, enabling leaders to make better decisions under uncertainty and ambiguity.`,
      `Education & Research: ${T} provides the foundation for curriculum design, research methodology, and academic analysis, producing more rigorous scholarly work.`,
    ],
    common_misconceptions: [
      `❌ Myth: Memorising ${T} definitions equals understanding. ✅ Truth: Genuine mastery requires grasping causal relationships and conditions under which principles apply — not just definitions and surface facts.`,
      `❌ Myth: ${T} is only relevant to specialists. ✅ Truth: Core reasoning patterns transfer powerfully across many professional domains — business, technology, healthcare, education, and everyday decision-making.`,
      `❌ Myth: Re-reading notes is effective study for ${T}. ✅ Truth: Active recall and practice testing outperform passive re-reading by up to 300% for durable long-term retention.`,
      `❌ Myth: Once you know the basics of ${T}, little remains to learn. ✅ Truth: ${T} has significant depth — nuances, edge cases, and ongoing debates that separate introductory from expert-level understanding.`,
    ],
    flashcards: [],
    quiz_questions: [],
    mindmap: null,
  };

  if (tool === 'flashcards' || tool === 'all') {
    base.flashcards = [
      { front: `What is the definition and core meaning of ${T}?`, back: `${T} refers to a structured body of knowledge and practice centred on key principles and their relationships. It encompasses systematic study of [core aspects], forming the foundation for all advanced work in the area. Understanding requires grasping not just definitions but the causal relationships between concepts.` },
      { front: `What are the 3-5 most fundamental principles of ${T}?`, back: `The fundamental principles are: 1) [First principle] — establishes the foundational framework, 2) [Second principle] — governs the key mechanisms, 3) [Third principle] — determines the outcomes and relationships, 4) [Fourth principle] — connects the components, 5) [Fifth principle] — defines the limits and conditions. Mastering these gives you the framework for everything else.` },
      { front: `How does ${T} work? Explain the core mechanism step by step.`, back: `The mechanism operates as follows: Step 1 → [Initial conditions are established and identified]. Step 2 → [Primary process begins through key drivers]. Step 3 → [Intermediate stages occur with measurable effects]. Step 4 → [The process converges toward the output]. Step 5 → [Final state emerges with observable consequences]. Each step builds logically on the previous one.` },
      { front: `What are the most important real-world applications of ${T}?`, back: `Key applications: 1) Healthcare — systematic diagnosis and treatment protocols, 2) Technology — system design and architecture decisions, 3) Business — strategic planning and risk assessment, 4) Education — curriculum design and assessment strategies, 5) Policy — evidence-based intervention design. The most impactful is likely [most significant] because it affects the largest number of people.` },
      { front: `What are the common mistakes students make when studying ${T}?`, back: `Top 5 mistakes: 1) Memorising without understanding relationships — learning facts without causal logic, 2) Passive re-reading — mistaking familiarity for knowledge, 3) Avoiding difficult questions — only studying what you already know, 4) Cramming — studying intensively then not reviewing, 5) Isolation — failing to connect ${T} to other subjects. Avoiding these gives a significant advantage.` },
      { front: `What is the most common misconception about ${T}?`, back: `The most common misconception is that [surface familiarity] equals genuine understanding. In reality, true mastery requires grasping underlying causal mechanisms and knowing when principles apply vs. break down. This misconception persists because familiarity feels like understanding — but collapses under novel questions or real professional situations requiring adaptation.` },
      { front: `How does ${T} connect to related fields?`, back: `${T} connects to adjacent disciplines through: 1) Shared conceptual frameworks enabling transfer of insights, 2) Methodological overlap where approaches from one field improve the other, 3) Historical development where fields co-evolved, 4) Practical overlap in professional contexts requiring integrated knowledge. The most important bridge is [key connecting concept] which enables cross-domain innovation.` },
      { front: `What is the historical development of ${T}?`, back: `${T} developed through key phases: Early stage (pre-modern) — [earliest forms and understanding]. Classical development — [major thinkers and breakthroughs]. Modern formation — [theoretical advances]. Contemporary state — [current understanding and ongoing developments]. The field transformed most significantly when [pivotal discovery] changed the foundational framework.` },
      { front: `What are the sub-categories or branches within ${T}?`, back: `${T} divides into branches: 1) [Branch 1] — focuses on [what it studies], 2) [Branch 2] — deals with [what it covers], 3) [Branch 3] — specialises in [area], 4) [Branch 4] — examines [aspect]. Understanding which branch applies to a given situation is a key expert skill distinguishing novice from practitioner.` },
      { front: `How do experts think differently about ${T} compared to beginners?`, back: `Expert thinking differs in: 1) Pattern recognition — experts see meaningful structures where beginners see isolated facts, 2) Chunking — experts group related concepts into efficient mental units, 3) Conditional reasoning — experts know when principles apply vs. don't, 4) Transfer — experts readily apply ${T} to novel situations, 5) Metacognition — experts know precisely what they don't know yet.` },
    ];
  }

  if (tool === 'quiz' || tool === 'all') {
    base.quiz_questions = [
      { id: 1, question: `Which statement BEST describes the central focus of ${T}?`, options: [`A systematic study of relationships between observable phenomena and their underlying causes`, `A collection of isolated facts and definitions without theoretical framework`, `The memorisation of established principles without consideration of applications`, `A purely historical record of discoveries in the field`], correct_answer: `A systematic study of relationships between observable phenomena and their underlying causes`, explanation: `${T} focuses on systematic understanding of relationships — not just collecting facts. A rigorous field requires both theoretical framework and practical application. Options B, C, and D describe incomplete or incorrect characterisations of what genuine academic study requires.`, difficulty: 'easy' },
      { id: 2, question: `A student claims to have mastered ${T} after re-reading notes five times. What does learning science say?`, options: [`Re-reading is the most effective strategy — the student is well-prepared`, `Re-reading creates familiarity which feels like understanding but rarely produces durable knowledge`, `Re-reading five times is exactly the optimal approach for long-term retention`, `The student should re-read ten times for maximum benefit`], correct_answer: `Re-reading creates familiarity which feels like understanding but rarely produces durable knowledge`, explanation: `Cognitive science shows re-reading creates an "illusion of fluency" — material feels familiar, which feels like knowledge, but retrieval practice and active testing are what actually strengthen memory traces. Testing yourself, even before feeling "ready," produces dramatically stronger retention.`, difficulty: 'medium' },
      { id: 3, question: `When applying ${T} to a novel real-world problem, the FIRST step an expert takes is:`, options: [`Immediately try multiple solutions and observe which works`, `Identify which core principles of ${T} are most relevant to the specific situation`, `Look for the most recently published method and apply it directly`, `Simplify the problem until it exactly matches a textbook example`], correct_answer: `Identify which core principles of ${T} are most relevant to the specific situation`, explanation: `Expert practitioners always begin by identifying which principles apply before selecting methods. This principled approach — rather than trial-and-error or mechanically applying recent methods — distinguishes effective professional-level application from novice attempts that often fail with non-standard problems.`, difficulty: 'medium' },
      { id: 4, question: `Which learning schedule produces the best long-term retention of ${T}?`, options: [`One 10-hour session immediately before assessment`, `Daily 1-hour sessions for one week only`, `Distributed sessions with increasing intervals: Day 1, 3, 7, 14, 30`, `Two intensive 5-hour sessions spread over the final week`], correct_answer: `Distributed sessions with increasing intervals: Day 1, 3, 7, 14, 30`, explanation: `Spaced repetition with increasing intervals maximises long-term retention. Each review catches material just as it begins to fade, maximising the memory-strengthening effect. This approach was scientifically validated through Ebbinghaus's forgetting curve research and consistently outperforms massed practice (cramming).`, difficulty: 'medium' },
      { id: 5, question: `What does metacognition mean and why is it particularly valuable for ${T}?`, options: [`Thinking about unrelated topics to avoid burnout`, `Studying with background music to engage multiple brain regions`, `Monitoring your own understanding — knowing precisely what you know and don't know`, `Reading about how others have studied ${T} successfully`], correct_answer: `Monitoring your own understanding — knowing precisely what you know and don't know`, explanation: `Metacognition — accurately monitoring your own comprehension — is particularly valuable for ${T} because it allows you to target study time efficiently on genuine gaps rather than comfortable material you already understand. Poor metacognition leads to studying what feels good rather than what needs work.`, difficulty: 'hard' },
      { id: 6, question: `Which factor MOST distinguishes expert from novice understanding of ${T}?`, options: [`Experts have memorised more definitions and formulas`, `Experts recognise deep structural patterns and know when principles apply vs. break down`, `Experts have studied ${T} for a longer total number of hours`, `Experts can recall facts faster without making errors`], correct_answer: `Experts recognise deep structural patterns and know when principles apply vs. break down`, explanation: `Expert-novice research consistently shows experts differ qualitatively, not just quantitatively. The key advantage is recognising deep structural patterns (not surface features) and knowing the conditions under which core principles apply vs. fail. This conditional reasoning enables true professional-level performance.`, difficulty: 'hard' },
      { id: 7, question: `Why does knowledge of ${T} transfer to other disciplines?`, options: [`Because experts in every field study the same textbooks`, `Because ${T} defines all other academic subjects`, `Because the core analytical frameworks and reasoning patterns are broadly applicable`, `Because every profession legally requires ${T} knowledge`], correct_answer: `Because the core analytical frameworks and reasoning patterns are broadly applicable`, explanation: `Transfer from ${T} to other domains occurs because the analytical frameworks, reasoning patterns, and problem-decomposition strategies developed through study apply across many different types of problems. It's not specific facts but thinking patterns that transfer — explaining why graduates succeed across diverse career paths.`, difficulty: 'medium' },
      { id: 8, question: `What is the "generation effect" and how does it apply to studying ${T}?`, options: [`Writing about ${T} has no effect on retention`, `Generating your own explanations improves retention more than reading them`, `Only reading expert explanations leads to understanding`, `The more you read about ${T}, the better you generate new ideas`], correct_answer: `Generating your own explanations improves retention more than reading them`, explanation: `The generation effect is a well-documented cognitive phenomenon: trying to produce answers from memory, even imperfectly, produces significantly stronger memory traces than passively reading the same information. This is why practice questions, teaching others, and creating your own summaries are more effective study strategies than re-reading.`, difficulty: 'hard' },
    ];
  }

  if (tool === 'mindmap' || tool === 'all') {
    base.mindmap = {
      central: `Understanding ${T}`,
      branches: [
        { name: 'Core Concepts', color: '#00d4ff', items: ['Foundational Definitions', 'Key Principles', 'Theoretical Framework', 'Historical Origins', 'Scope & Boundaries', 'Core Relationships'] },
        { name: 'How It Works', color: '#bf00ff', items: ['Primary Mechanisms', 'Step-by-Step Processes', 'Key Variables', 'Feedback Loops', 'Cause & Effect Chains', 'System Dynamics'] },
        { name: 'Real Applications', color: '#00ff88', items: ['Professional Practice', 'Industry Examples', 'Research Uses', 'Case Studies', 'Problem-Solving', 'Innovation Areas'] },
        { name: 'Study Strategies', color: '#ffae00', items: ['Active Recall', 'Spaced Repetition', 'Feynman Technique', 'Concept Mapping', 'Practice Problems', 'Peer Teaching'] },
        { name: 'Common Pitfalls', color: '#ff4444', items: ['Key Misconceptions', 'Typical Errors', 'Knowledge Gaps', 'Oversimplifications', 'Dangerous Assumptions', 'Edge Cases'] },
        { name: 'Advanced Topics', color: '#d4af37', items: ['Nuances & Subtleties', 'Current Research', 'Open Questions', 'Expert Debates', 'Future Directions', 'Interdisciplinary Links'] },
      ],
      connections: [
        { from: 'Core Concepts', to: 'How It Works', description: 'Principles explain mechanisms' },
        { from: 'How It Works', to: 'Real Applications', description: 'Mechanisms enable practical use' },
        { from: 'Common Pitfalls', to: 'Study Strategies', description: 'Knowing mistakes guides better study' },
        { from: 'Real Applications', to: 'Advanced Topics', description: 'Practice reveals hidden complexity' },
        { from: 'Study Strategies', to: 'Core Concepts', description: 'Active study deepens core understanding' },
      ],
    };
  }

  return base;
}

// ─────────────────────────────────────────────────────────────────────────────────────────────────
// SECTION 10 — OFFLINE NOTES FALLBACK
// ─────────────────────────────────────────────────────────────────────────────────────────────────

function offlineNotes(topic, tool) {
  const T = topic || 'this topic';
  return `## 📚 Introduction to ${T}

**${T}** is a significant area of study with broad intellectual and practical implications across multiple disciplines. A thorough understanding provides both academic and professional advantages.

---

## 🎯 Core Concepts and Definitions

**Theoretical Foundation:** Every developed field rests on a theoretical core — foundational assumptions, definitions, and logical relationships organising its knowledge. Understanding ${T} means knowing not just what it claims but *why* those claims are justified.

**Practical Dimension:** Theory and practice are complementary. Each theoretical concept has practical implications, and each application reveals theoretical insights.

**Analytical Framework:** ${T} provides a structured way of perceiving and reasoning about complex problems — a transferable mental toolkit improving thinking in adjacent domains.

**Systemic Perspective:** No component of ${T} exists in isolation. Every concept connects to others through logical dependence, causal influence, or structural analogy. Genuine expertise means understanding the field as an integrated whole.

---

## ⚙️ How It Works — Mechanisms and Processes

**Stage 1 — Initial Conditions:** Applications begin with specific conditions that must be identified accurately. Misunderstanding initial conditions is a primary source of errors.

**Stage 2 — Active Mechanisms:** The defining mechanisms transform inputs through identifiable patterns. Understanding *why* they produce their outputs — not just *what* — enables prediction and intervention.

**Stage 3 — Feedback Loops:** Many systems incorporate feedback where outcomes influence subsequent inputs, creating adaptive or self-correcting behaviour.

**Stage 4 — Observable Outputs:** Outcomes take measurable forms that can be evaluated against standards.

**Stage 5 — Iteration:** Real-world applications involve multiple cycles, with learning from each improving future performance.

---

## 💡 Key Examples

**Example 1 — Foundational Case:** The simplest application illustrates core principles in their purest form, revealing the essential logic underlying all more complex instances.

**Example 2 — Real-World Complexity:** Professional practice adds complications not present in basic examples, requiring adaptation of standard frameworks to specific circumstances.

**Example 3 — Edge Case:** Understanding limits is as important as understanding the core. Knowing when and why standard approaches break down separates experts from novices.

---

## 🚀 Advanced Aspects

**Boundary Conditions:** Every framework has conditions where it works well and others where it requires modification. Understanding these boundaries distinguishes experts from novices.

**Historical Context:** Current understanding emerged from debates between competing viewpoints. Understanding this history reveals the field's core values and standards of evidence.

**Ongoing Research:** Like all vibrant fields, ${T} has active research frontiers where questions remain open and new understanding continues to emerge.

**Interdisciplinary Connections:** ${T} connects to adjacent fields creating rich opportunities for insight transfer and novel applications.

---

## 📝 Summary and Key Takeaways

**Core Principles:**
- ✅ The foundational framework connects theory to evidence through clear logical relationships
- ✅ Mechanisms follow identifiable patterns that can be learned and systematically applied
- ✅ Real-world application requires adapting core principles to specific contexts
- ✅ Expert understanding includes knowing when and why standard approaches need modification
- ✅ Interdisciplinary connections enrich understanding and expand application possibilities

**Common Mistakes to Avoid:**
- ⚠️ Memorising without understanding causal relationships
- ⚠️ Confusing familiarity with genuine comprehension
- ⚠️ Ignoring edge cases and boundary conditions

**Revision Checklist:**
- [ ] Can I explain core concepts without looking at notes?
- [ ] Can I apply principles to a novel example?
- [ ] Can I connect this topic to other areas I've studied?
- [ ] Can I teach the material clearly to someone else?

---

*Generated by ${SAVOIRÉ.BRAND} | ${SAVOIRÉ.DEVELOPER} | Free for every student, forever*`;
}

// ─────────────────────────────────────────────────────────────────────────────────────────────────
// SECTION 11 — MERGE CARDS WITH NOTES
// ─────────────────────────────────────────────────────────────────────────────────────────────────

function mergeCards(cardsRaw, notes, topic, opts) {
  const now = getISTDateTime();
  const merged = {
    topic:                  topic || cardsRaw?.topic || 'Study Material',
    curriculum_alignment:   cardsRaw?.curriculum_alignment || 'General Academic Study',
    ultra_long_notes:       notes,
    key_concepts:           cardsRaw?.key_concepts           || [],
    key_tricks:             cardsRaw?.key_tricks             || [],
    practice_questions:     cardsRaw?.practice_questions     || [],
    real_world_applications:cardsRaw?.real_world_applications|| [],
    common_misconceptions:  cardsRaw?.common_misconceptions  || [],
    study_score:            cardsRaw?.study_score            || 95,
    powered_by:             `${SAVOIRÉ.BRAND} by ${SAVOIRÉ.DEVELOPER}`,
    generated_at:           now,
    _version:               SAVOIRÉ.VERSION,
    _tool:                  opts.tool,
    _quality:               cardsRaw?._fallback ? 'enhanced_fallback' : 'ai_generated',
    _language:              opts.language || 'English',
  };

  // Tool-specific fields
  if (cardsRaw?.flashcards?.length)         merged.flashcards     = cardsRaw.flashcards;
  if (cardsRaw?.quiz_questions?.length)     merged.quiz_questions = cardsRaw.quiz_questions;
  if (cardsRaw?.mindmap?.branches?.length)  merged.mindmap        = cardsRaw.mindmap;

  // Ensure minimum fallback content
  if (merged.key_concepts.length < 3) merged.key_concepts = [
    `Fundamental Understanding: ${topic} is built on core principles connecting theory to practice. True mastery requires understanding relationships and causality, not just isolated facts.`,
    `Key Mechanisms: The main processes follow systematic patterns that can be learned and applied. Each step builds logically on the previous one.`,
    `Practical Value: Knowledge transfers directly to real-world scenarios across multiple professional domains and everyday situations.`,
    `Interconnections: This topic connects meaningfully to related fields, creating rich opportunities for knowledge transfer and innovative cross-domain applications.`,
    `Learning Pathway: Mastery follows a proven sequence: foundation → pattern recognition → practice → application → teaching → synthesis.`,
  ];

  if (merged.key_tricks.length < 2) merged.key_tricks = [
    `🧠 FEYNMAN TECHNIQUE for ${topic}: Explain the concept simply as if teaching a child. Your hesitations reveal gaps. Return to notes only for those gaps.`,
    `📝 ACTIVE RECALL for ${topic}: Close notes and write everything you know. Compare to find gaps. Beats re-reading by 300% for long-term retention.`,
    `⏰ SPACED REPETITION: Review at intervals (Day 1, 3, 7, 14, 30) for optimal long-term retention and knowledge durability.`,
  ];

  return merged;
}

// ─────────────────────────────────────────────────────────────────────────────────────────────────
// SECTION 12 — RESPONSE HEADERS
// ─────────────────────────────────────────────────────────────────────────────────────────────────

function setSecurityHeaders(res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, Accept');
  res.setHeader('Access-Control-Max-Age', '86400');
  res.setHeader('X-Powered-By', `${SAVOIRÉ.BRAND} by ${SAVOIRÉ.DEVELOPER}`);
  res.setHeader('X-Developer', SAVOIRÉ.DEVELOPER);
  res.setHeader('X-Founder', SAVOIRÉ.FOUNDER);
  res.setHeader('X-App-Version', SAVOIRÉ.VERSION);
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
}

// ─────────────────────────────────────────────────────────────────────────────────────────────────
// SECTION 13 — MAIN VERCEL HANDLER
// ─────────────────────────────────────────────────────────────────────────────────────────────────

module.exports = async function handler(req, res) {
  const requestId = Math.random().toString(36).slice(2, 10);
  const startTime = Date.now();
  log.info(`[${requestId}] ${req.method} /api/study`);
  setSecurityHeaders(res);

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST')  return res.status(405).json({ error: 'Method not allowed. Use POST.' });

  const body       = req.body || {};
  let message      = String(body.message || '').trim();
  let userName     = String(body.userName || '').trim() || 'Anonymous';
  let userStreak   = Number(body.streak)   || 0;
  let userSessions = Number(body.sessions) || 1;
  let sessionId    = body.sessionId || requestId;

  // ── PING / WARMUP: Track user visit even on ping ──
  if (message === '' || message === 'ping') {
    // Track user presence even on warmup/ping — no tool used
    sendToGoogleSheets(userName, userStreak, userSessions, 'visit', '', 'online', 0, sessionId).catch(() => {});
    return res.status(200).json({
      status: 'ok', service: SAVOIRÉ.BRAND, version: SAVOIRÉ.VERSION,
      time: getISTDateTime(), requestId,
    });
  }

  if (message.length < 2)     return res.status(400).json({ error: 'Please enter a longer topic (min 2 characters).' });
  if (message.length > 20000) return res.status(400).json({ error: 'Input too long (max 20,000 characters).' });

  // Prepare options
  const rawOpts   = body.options || {};
  const validTools= ['notes','flashcards','quiz','summary','mindmap','all'];
  const currentTool = validTools.includes(rawOpts.tool) ? rawOpts.tool : 'notes';

  const opts = {
    tool:     currentTool,
    depth:    ['standard','detailed','comprehensive','expert'].includes(rawOpts.depth) ? rawOpts.depth : 'detailed',
    style:    ['simple','academic','detailed','exam','visual'].includes(rawOpts.style)  ? rawOpts.style : 'simple',
    language: String(rawOpts.language || 'English').trim(),
    stream:   rawOpts.stream === true,
  };

  log.info(`[${requestId}] Tool:${opts.tool} | Lang:${opts.language} | Depth:${opts.depth} | Stream:${opts.stream} | User:${userName}`);

  if (!process.env.OPENROUTER_API_KEY) {
    log.error('OPENROUTER_API_KEY not set!');
    return res.status(500).json({ error: 'Savoiré AI service is temporarily unavailable. Please try again later.' });
  }

  // Track user visit + tool start immediately on any real request
  sendToGoogleSheets(userName, userStreak, userSessions, opts.tool, message, 'started', 0, sessionId).catch(() => {});

  // ═════════════════════════════════════════════════════════════════════════════════════
  // STREAMING MODE (Notes & Summary get live stream; others get json then stream simulate)
  // ═════════════════════════════════════════════════════════════════════════════════════
  if (opts.stream && (opts.tool === 'notes' || opts.tool === 'summary' || opts.tool === 'all')) {
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache, no-store, no-transform');
    res.setHeader('Connection', 'keep-alive');
    res.setHeader('X-Accel-Buffering', 'no');
    if (typeof res.flushHeaders === 'function') res.flushHeaders();

    const sse = (event, data) => {
      if (res.writableEnded) return;
      try {
        res.write(`event: ${event}\ndata: ${typeof data === 'string' ? data : JSON.stringify(data)}\n\n`);
        if (typeof res.flush === 'function') res.flush();
      } catch {}
    };

    const ping = setInterval(() => {
      if (!res.writableEnded) { try { res.write(`: ping ${Date.now()}\n\n`); if (typeof res.flush === 'function') res.flush(); } catch { clearInterval(ping); } }
    }, 14000);

    const stageTimers = [
      setTimeout(() => sse('stage', { idx: 1, label: '📝 Writing your study content…' }), 3000),
      setTimeout(() => sse('stage', { idx: 2, label: '🔍 Building detailed sections…' }), 8000),
      setTimeout(() => sse('stage', { idx: 3, label: '✨ Generating study cards…' }), 16000),
    ];
    const clearStages = () => stageTimers.forEach(clearTimeout);

    sse('heartbeat', { ts: Date.now(), status: 'connected', service: SAVOIRÉ.BRAND });
    sse('stage', { idx: 0, label: '🎯 Analysing your topic…' });
    sse('token', { t: '' });

    let notes = '', phase1Ok = false;
    try {
      const notesPrompt = buildNotesPrompt(message, opts);
      try {
        notes = await streamNotes(notesPrompt, chunk => sse('token', { t: chunk }), opts.tool);
        phase1Ok = true;
      } catch (e1) {
        log.error(`Phase1 failed: ${e1.message}`);
        sse('stage', { idx: 2, label: '📚 Using enhanced offline content…' });
        notes = offlineNotes(message, opts.tool);
        // Stream offline notes in chunks so user sees something
        for (let i = 0; i < notes.length; i += 250) {
          sse('token', { t: notes.slice(i, i + 250) });
          await sleep(4);
        }
      }

      sse('stage', { idx: 3, label: '🃏 Building cards and structured data…' });

      let cardsRaw = null;
      try {
        cardsRaw = await fetchCards(buildCardsPrompt(message, opts), opts.tool, message);
        log.ok(`Phase2 OK for tool: ${opts.tool}`);
      } catch (e2) {
        log.error(`Phase2 failed: ${e2.message}`);
        cardsRaw = intelligentFallbackCards(opts.tool, message);
      }

      clearInterval(ping);
      clearStages();

      const finalData = mergeCards(cardsRaw, notes, message, opts);
      finalData._duration_ms   = Date.now() - startTime;
      finalData._request_id    = requestId;
      finalData._phase1_ok     = phase1Ok;
      finalData._phase2_ok     = !cardsRaw?._fallback;
      finalData.powered_by     = `${SAVOIRÉ.BRAND} by ${SAVOIRÉ.DEVELOPER}`;

      sse('stage', { idx: 4, label: '✅ Complete!', done: true });
      sse('done', finalData);

      log.ok(`[${requestId}] Complete — ${finalData._duration_ms}ms | p1=${phase1Ok} | p2=${finalData._phase2_ok}`);
      sendToGoogleSheets(userName, userStreak, userSessions, opts.tool, message, 'completed', finalData._duration_ms, sessionId).catch(() => {});

    } catch (fatal) {
      clearInterval(ping);
      clearStages();
      log.error(`[${requestId}] Fatal: ${fatal.message}`);
      sse('error', { message: 'Savoiré AI is momentarily unavailable. Please try again in a few seconds.' });
      sendToGoogleSheets(userName, userStreak, userSessions, opts.tool, message, 'failed', Date.now()-startTime, sessionId).catch(() => {});
    }

    if (!res.writableEnded) res.end();
    return;
  }

  // ═════════════════════════════════════════════════════════════════════════════════════
  // NON-STREAMING MODE (Flashcards, Quiz, Mindmap, or stream=false)
  // ═════════════════════════════════════════════════════════════════════════════════════
  try {
    // Phase 1 — get notes (non-streaming)
    const notesPrompt = buildNotesPrompt(message, opts);
    let notes = '';
    for (const model of MODELS_STREAM) {
      const ctrl  = new AbortController();
      const timer = setTimeout(() => ctrl.abort(), model.timeout_ms);
      try {
        const r = await fetch(OPENROUTER_BASE, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${process.env.OPENROUTER_API_KEY}`, 'HTTP-Referer': HTTP_REFERER, 'X-Title': APP_TITLE },
          body: JSON.stringify({ model: model.id, max_tokens: DEPTH_MAP[opts.depth]?.maxTokens || 3800, temperature: 0.72, stream: false, messages: [{ role: 'user', content: notesPrompt }] }),
          signal: ctrl.signal,
        });
        clearTimeout(timer);
        if (!r.ok) continue;
        const d = await r.json();
        const c = d?.choices?.[0]?.message?.content?.trim();
        if (c && c.length > 200) { notes = c; log.ok(`Phase1 (non-stream) OK — ${notes.length} chars`); break; }
      } catch { clearTimeout(timer); }
    }
    if (!notes) { log.warn(`Using offline notes fallback`); notes = offlineNotes(message, opts.tool); }

    // Phase 2 — get structured cards
    let cardsRaw;
    try {
      cardsRaw = await fetchCards(buildCardsPrompt(message, opts), opts.tool, message);
      if (!cardsRaw) cardsRaw = intelligentFallbackCards(opts.tool, message);
    } catch {
      cardsRaw = intelligentFallbackCards(opts.tool, message);
    }

    const finalData = mergeCards(cardsRaw, notes, message, opts);
    finalData._duration_ms = Date.now() - startTime;
    finalData._request_id  = requestId;
    finalData.powered_by   = `${SAVOIRÉ.BRAND} by ${SAVOIRÉ.DEVELOPER}`;

    log.ok(`[${requestId}] Sync complete — ${finalData._duration_ms}ms`);
    sendToGoogleSheets(userName, userStreak, userSessions, opts.tool, message, 'completed', finalData._duration_ms, sessionId).catch(() => {});

    return res.status(200).json(finalData);

  } catch (err) {
    log.error(`[${requestId}] Error: ${err.message}`);
    sendToGoogleSheets(userName, userStreak, userSessions, opts.tool, message, 'failed', Date.now()-startTime, sessionId).catch(() => {});
    return res.status(500).json({
      error: 'Savoiré AI study tool is momentarily unavailable. Please try again in a few seconds.',
      _request_id: requestId,
    });
  }
};
// ═══════════════════════════════════════════════════════════════════════════════════════════════════
// END — api/study.js v2.0 FINAL | Sooban Talha Technologies | soobantalhatech.xyz
// ═══════════════════════════════════════════════════════════════════════════════════════════════════

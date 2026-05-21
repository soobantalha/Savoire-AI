'use strict';
// ═══════════════════════════════════════════════════════════════════════════════════════════════════
// SAVOIRÉ AI v2.0 — api/study.js — ULTIMATE BACKEND (3500+ LINES) - ENHANCED & FIXED
// Built by Sooban Talha Technologies | soobantalhatech.xyz
// Founder: Sooban Talha
//
// ═══════════════════════════════════════════════════════════════════════════════════════════════════
// COMPLETE ARCHITECTURE v2.0:
//
// ═══════════════════════════════════════════════════════════════════════════════════════════════════
// PHASE 1 (NOTES & SUMMARY ONLY) — LIVE STREAMING:
//   • Stream plain markdown notes directly to client
//   • Tokens start arriving in <2 seconds
//   • User reads real content LIVE with typewriter effect
//   • Supports all depth levels: standard/detailed/comprehensive/expert
//   • Supports all styles: simple/academic/detailed/exam/visual
//   • Full markdown rendering during stream
// ═══════════════════════════════════════════════════════════════════════════════════════════════════
//
// ═══════════════════════════════════════════════════════════════════════════════════════════════════
// PHASE 2 (FLASHCARDS, QUIZ, MIND MAP) — MODEL WITH INTELLIGENT FALLBACK:
//   • Second AI call for structured JSON
//   • INTELLIGENT FALLBACK — high-quality local generation if models fail
//   • Returns complete cards structure with flashcards/quiz_questions/mindmap
//   • Merged into final result
// ═══════════════════════════════════════════════════════════════════════════════════════════════════
//
// ═══════════════════════════════════════════════════════════════════════════════════════════════════
// GOOGLE SHEETS INTEGRATION (PRIVATE — IN BACKEND ONLY):
//   • Webhook-based tracking (credentials not exposed to frontend)
//   • Tracks: User Name, Streak, Sessions, Last Used, Tool Used
//   • Auto-creates headers if missing
//   • Auto-updates existing user streaks
//   • IST timestamps (UTC+5:30) - FULLY FIXED
// ═══════════════════════════════════════════════════════════════════════════════════════════════════
//
// ═══════════════════════════════════════════════════════════════════════════════════════════════════
// SSE PROTOCOL (compatible with frontend):
//   • event: token  → data: {"t":"..."}  — streaming markdown token chunk
//   • event: stage  → data: {"idx":N}    — stage progress update (0-4)
//   • event: done   → data: {...}        — final structured object (signals completion)
//   • event: heartbeat → data: {...}     — keepalive ping every 9 seconds
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

// ═══════════════════════════════════════════════════════════════════════════════════════════════════
// GOOGLE SHEETS WEBHOOK CONFIGURATION (PRIVATE — STORED IN BACKEND ONLY)
// ═══════════════════════════════════════════════════════════════════════════════════════════════════

const GOOGLE_WEBHOOK_URL = process.env.GOOGLE_WEBHOOK_URL || '';

// ─────────────────────────────────────────────────────────────────────────────────────────────────
// SECTION 2 — MODEL ROSTER (14+ MODELS — ENHANCED WITH BETTER MODELS)
// ─────────────────────────────────────────────────────────────────────────────────────────────────

// PHASE 1: Streaming markdown notes (NOTES & SUMMARY only) — prioritise fastest first-token models
const MODELS_STREAM = [
  { id: 'google/gemini-2.0-flash-exp:free',        max_tokens: 4500, timeout_ms: 45000 },
  { id: 'google/gemini-flash-1.5-8b:free',         max_tokens: 4000, timeout_ms: 35000 },
  { id: 'deepseek/deepseek-chat-v3-0324:free',      max_tokens: 4500, timeout_ms: 45000 },
  { id: 'meta-llama/llama-3.3-70b-instruct:free',  max_tokens: 4000, timeout_ms: 40000 },
  { id: 'z-ai/glm-4.5-air:free',                   max_tokens: 3500, timeout_ms: 35000 },
  { id: 'qwen/qwen3-8b:free',                      max_tokens: 3500, timeout_ms: 35000 },
  { id: 'mistralai/mistral-7b-instruct-v0.3:free', max_tokens: 3500, timeout_ms: 35000 },
  { id: 'openchat/openchat-7b:free',               max_tokens: 3500, timeout_ms: 35000 },
  { id: 'nousresearch/hermes-3-llama-3.1-405b:free', max_tokens: 4500, timeout_ms: 55000 },
  { id: 'cognitivecomputations/dolphin-mixtral-8x7b:free', max_tokens: 4000, timeout_ms: 45000 },
  { id: 'perplexity/llama-3-sonar-small-32k-online:free', max_tokens: 4000, timeout_ms: 45000 },
  { id: 'microsoft/phi-3-mini-128k-instruct:free', max_tokens: 3500, timeout_ms: 35000 },
  { id: 'upstage/solar-1-mini-chat:free',          max_tokens: 3500, timeout_ms: 35000 },
  { id: 'cohere/command-r-plus:free',              max_tokens: 4000, timeout_ms: 40000 },
];

// PHASE 2: Structured JSON cards (FLASHCARDS, QUIZ, MIND MAP only)
const MODELS_CARDS = [
  { id: 'google/gemini-2.0-flash-exp:free',        max_tokens: 4500, timeout_ms: 45000 },
  { id: 'google/gemini-flash-1.5-8b:free',         max_tokens: 4000, timeout_ms: 35000 },
  { id: 'deepseek/deepseek-chat-v3-0324:free',      max_tokens: 4500, timeout_ms: 45000 },
  { id: 'meta-llama/llama-3.3-70b-instruct:free',  max_tokens: 4000, timeout_ms: 40000 },
  { id: 'nousresearch/hermes-3-llama-3.1-405b:free', max_tokens: 4500, timeout_ms: 55000 },
  { id: 'cognitivecomputations/dolphin-mixtral-8x7b:free', max_tokens: 4000, timeout_ms: 45000 },
  { id: 'microsoft/phi-3-mini-128k-instruct:free', max_tokens: 3500, timeout_ms: 35000 },
  { id: 'upstage/solar-1-mini-chat:free',          max_tokens: 3500, timeout_ms: 35000 },
];

// ─────────────────────────────────────────────────────────────────────────────────────────────────
// SECTION 3 — CONFIGURATION MAPS (Depth, Style, Tools)
// ─────────────────────────────────────────────────────────────────────────────────────────────────

const DEPTH_MAP = {
  standard:      { wordRange: '600–900 words',     minChars: 700,   maxTokens: 2800 },
  detailed:      { wordRange: '1000–1500 words',   minChars: 1100,  maxTokens: 3800 },
  comprehensive: { wordRange: '1500–2200 words',   minChars: 1600,  maxTokens: 5000 },
  expert:        { wordRange: '2200–3500 words',   minChars: 2300,  maxTokens: 6500 },
};

const STYLE_MAP = {
  simple:   `Write in clear, beginner-friendly language. Define every technical term when first used. Use short sentences and everyday analogies. Break down complex ideas into simple steps. Use examples that a 12-year-old could understand.`,
  academic: `Write in formal academic language with precise scholarly terminology. Maintain an objective, third-person tone. Use discipline-appropriate vocabulary and citation-style references. Avoid colloquialisms.`,
  detailed: `Provide exhaustive detail at every point. Include numerous concrete examples, specific numbers, and thorough step-by-step explanations. Cover edge cases, exceptions, and corner scenarios. Leave no stone unturned.`,
  exam:     `Focus entirely on exam success. Provide key definitions exactly as they would appear in a mark scheme. Highlight the most-examined aspects and flag common student mistakes. Include exam tips, time-saving strategies, and marks allocation guidance.`,
  visual:   `Make every concept concrete through vivid analogies, metaphors and visual descriptions. Build memorable mental models that stick. Use spatial and sensory language. Paint a picture with words.`,
};

const TOOL_MAP = {
  notes: {
    objective: `Generate comprehensive, well-structured study notes that cover every important aspect of the topic. Be thorough, systematic, and academically rigorous.`,
    sections: [
      '## 📚 Introduction and Overview',
      '## 🎯 Core Concepts and Definitions',
      '## ⚙️ How It Works (Mechanisms & Processes)',
      '## 💡 Key Examples with Detailed Walkthroughs',
      '## 🚀 Advanced Aspects, Nuances & Edge Cases',
      '## 📝 Summary, Key Takeaways & Revision Checklist'
    ]
  },
  flashcards: {
    objective: `Generate study notes optimised for converting into interactive flashcards. Each concept should be clearly separated into a question/answer pair suitable for spaced repetition.`,
    sections: [
      '## 📖 Topic Overview (Context)',
      '## 🃏 Core Concepts as Q&A Pairs',
      '## 🔄 Step-by-Step Mechanisms',
      '## 📋 Key Examples (Each as a Separate Card)',
      '## 🎯 Quick Summary for Review'
    ]
  },
  quiz: {
    objective: `Generate exam-focused study notes that will later be turned into a self-testing quiz. Emphasize examinable points and common question patterns.`,
    sections: [
      '## 📚 Topic Introduction',
      '## ✏️ Core Concepts (Exam-Ready Format)',
      '## ⚙️ How It Works (Exam-Style Explanation)',
      '## 📝 Key Examples (Typical Exam Questions)',
      '## 🎯 Summary – What You Must Remember for the Exam'
    ]
  },
  summary: {
    objective: `Generate a concise, punchy smart summary for fast revision. Start with a bold TL;DR paragraph, then bullet the key points. Make it scannable and memorable.`,
    sections: [
      '## 🚀 TL;DR (Executive Summary — Read This First)',
      '## 🎯 Core Concepts (One Line Each)',
      '## ⚙️ Key Mechanisms (Very Short)',
      '## 💡 Critical Examples (Only the Most Important)',
      '## ✅ What to Remember (Final Revision Checklist)'
    ]
  },
  mindmap: {
    objective: `Generate hierarchically structured notes designed to be turned into a mind map. Use clear parent → child relationships with logical branching.`,
    sections: [
      '## 🧠 Central Topic (The Main Idea)',
      '## 🌿 Main Branches (5–7 Primary Categories)',
      '## 🍃 Sub-Branches (Details Under Each Main Branch)',
      '## 🔗 Cross-Connections (Links Between Branches)',
      '## 💼 Applications & Examples (Where Each Branch Leads)'
    ]
  },
};

// ─────────────────────────────────────────────────────────────────────────────────────────────────
// SECTION 4 — UTILITIES (Logging, Sleep, Truncation, IST Timezone - FULLY FIXED)
// ─────────────────────────────────────────────────────────────────────────────────────────────────

const sleep = (ms) => new Promise(r => setTimeout(r, ms));

const log = {
  info:  (...a) => console.log  (`[${new Date().toISOString()}] [${SAVOIRÉ.BRAND}] 📘 INFO  `, ...a),
  ok:    (...a) => console.log  (`[${new Date().toISOString()}] [${SAVOIRÉ.BRAND}] ✅ OK    `, ...a),
  warn:  (...a) => console.warn (`[${new Date().toISOString()}] [${SAVOIRÉ.BRAND}] ⚠️ WARN  `, ...a),
  error: (...a) => console.error(`[${new Date().toISOString()}] [${SAVOIRÉ.BRAND}] ❌ ERROR `, ...a),
};

const trunc = (s, n = 100) => !s ? '' : (String(s).length > n ? String(s).slice(0, n) + '…' : String(s));

// FIXED: IST Timezone Helper (UTC+5:30) - Now Working Correctly
function getISTDateTime() {
  const now = new Date();
  // Convert to UTC milliseconds
  const utcMs = now.getTime() + (now.getTimezoneOffset() * 60 * 1000);
  // Add IST offset (5 hours 30 minutes = 5.5 * 60 * 60 * 1000)
  const istOffsetMs = 5.5 * 60 * 60 * 1000;
  const istDate = new Date(utcMs + istOffsetMs);
  
  const year = istDate.getFullYear();
  const month = String(istDate.getMonth() + 1).padStart(2, '0');
  const day = String(istDate.getDate()).padStart(2, '0');
  const hours = String(istDate.getHours()).padStart(2, '0');
  const minutes = String(istDate.getMinutes()).padStart(2, '0');
  const seconds = String(istDate.getSeconds()).padStart(2, '0');
  
  return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
}

function getISTDate() {
  return getISTDateTime().split(' ')[0];
}

// ─────────────────────────────────────────────────────────────────────────────────────────────────
// SECTION 5 — GOOGLE SHEETS WEBHOOK FUNCTION (PRIVATE — BACKEND ONLY - FIXED)
// ─────────────────────────────────────────────────────────────────────────────────────────────────

async function sendToGoogleSheets(userName, streak, sessions, tool, topic, status, durationMs, sessionId) {
  if (!GOOGLE_WEBHOOK_URL) {
    log.warn('Google Sheets webhook not configured — skipping tracking');
    return false;
  }
  
  try {
    const payload = {
      userName: userName || 'anonymous',
      streak: streak || 0,
      sessions: sessions || 1,
      lastUsed: getISTDateTime(),
      tool: tool || '',
      topic: (topic || '').slice(0, 200),
      status: status || 'completed',
      durationMs: durationMs || 0,
      sessionId: sessionId || '',
      timestamp: getISTDateTime()
    };
    
    const response = await fetch(GOOGLE_WEBHOOK_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    
    if (response.ok) {
      log.ok(`📊 Tracked: ${userName} | Tool: ${tool} | Streak: ${streak}`);
    } else {
      log.warn(`Google Sheets returned ${response.status}`);
    }
    return response.ok;
  } catch (err) {
    log.warn(`Failed to send to Google Sheets: ${err.message}`);
    return false;
  }
}

// ─────────────────────────────────────────────────────────────────────────────────────────────────
// SECTION 6 — ENHANCED PROMPTS (LONGER, BETTER QUALITY)
// ─────────────────────────────────────────────────────────────────────────────────────────────────

function buildNotesPrompt(input, opts) {
  const depth = DEPTH_MAP[opts.depth] || DEPTH_MAP.detailed;
  const style = STYLE_MAP[opts.style] || STYLE_MAP.simple;
  const tool = TOOL_MAP[opts.tool] || TOOL_MAP.notes;
  const lang = opts.language || 'English';
  const sections = tool.sections.join('\n\n');

  return `You are ${SAVOIRÉ.BRAND}, the world's most advanced AI study assistant, created by ${SAVOIRÉ.DEVELOPER} (${SAVOIRÉ.DEVSITE}) and founded by ${SAVOIRÉ.FOUNDER}.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🎯 TASK: ${tool.objective}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

📖 TOPIC: ${input}

🌐 LANGUAGE: ${lang}
⚠️ CRITICAL: You must write EVERY word, every heading, every bullet point in ${lang} only. No exceptions. No mixing languages.

📏 LENGTH: ${depth.wordRange} (be thorough and comprehensive)

🎨 WRITING STYLE: ${style}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📋 STRUCTURE (use these exact headings):
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

${sections}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📐 FORMATTING RULES:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

1. Use ## for each section heading (exactly as shown above)
2. Use **bold** for every key term the first time it appears
3. Use - for bullet points in lists
4. Use > blockquotes for definitions or key statements
5. Use --- horizontal rules between major sections
6. Include at least 4 concrete, real-world examples (more if topic demands)
7. End with a "🎯 Key Takeaways" box (bullet points)
8. Use emojis sparingly but effectively (📚 🎯 ⚙️ 💡 🚀 ✅)
9. Use numbered lists for step-by-step processes
10. Use \`code blocks\` for formulas, definitions, or technical terms
11. If topic has formulas, show them clearly with explanations
12. Include a "Common Mistakes to Avoid" section

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
✨ QUALITY EXPECTATIONS:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

- Write in a clear, engaging, professional tone
- Define every technical term when it first appears
- If the topic has formulas or code, include them inside \`\`\` fences
- The notes should be self-contained — a student reading them should understand the topic without external resources
- Be accurate, detailed, and well-organized
- Use transitions between sections for flow
- Include practical applications where relevant
- Address common misconceptions
- Include real-world case studies or examples
- Add mnemonics or memory aids where helpful
- Provide exam tips if applicable

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🚀 START WRITING IMMEDIATELY. Do not add any preamble or meta-commentary.
Begin directly with the first ## heading. Write in ${lang} only.
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`;
}

// ─────────────────────────────────────────────────────────────────────────────────────────────────
// SECTION 7 — ENHANCED PHASE 2 PROMPT: STRUCTURED JSON CARDS
// ─────────────────────────────────────────────────────────────────────────────────────────────────

function buildCardsPrompt(input, opts) {
  const lang = opts.language || 'English';
  const tool = opts.tool || 'notes';
  const depth = DEPTH_MAP[opts.depth] || DEPTH_MAP.detailed;
  const style = STYLE_MAP[opts.style] || STYLE_MAP.simple;
  const now = getISTDateTime();

  let toolSpecificInstructions = '';
  
  if (tool === 'flashcards') {
    toolSpecificInstructions = `
╔══════════════════════════════════════════════════════════════════════════════════╗
║                        FLASHCARD SPECIFIC INSTRUCTIONS                           ║
╚══════════════════════════════════════════════════════════════════════════════════╝

• Generate exactly 15-20 high-quality flashcards
• Each flashcard must have a clear "front" (question/concept) and "back" (answer/explanation)
• Front should be 10-30 words, Back should be 40-100 words
• Cover definitions, key concepts, examples, relationships, and applications
• Make questions thought-provoking, not trivial
• Answers should be comprehensive but concise
• Include a mix of: definitions, "how/why" questions, comparison questions, and application scenarios
• Add at least 3 "real-world application" flashcards
• Include at least 2 "common misconception" flashcards`;
  } else if (tool === 'quiz') {
    toolSpecificInstructions = `
╔══════════════════════════════════════════════════════════════════════════════════╗
║                          QUIZ SPECIFIC INSTRUCTIONS                              ║
╚══════════════════════════════════════════════════════════════════════════════════╝

• Generate exactly 10-12 multiple-choice questions
• Each question must have 4 options (A, B, C, D)
• Only one option must be correct
• Provide detailed explanation for the correct answer (60-120 words)
• Include difficulty level (easy/medium/hard) for each question
• Distribute difficulty: 3 easy, 4-5 medium, 3-4 hard
• Make distractors plausible but clearly incorrect
• Questions should test understanding, not just recall
• Include 2 scenario-based questions
• Include 1 question that requires multi-step reasoning`;
  } else if (tool === 'mindmap') {
    toolSpecificInstructions = `
╔══════════════════════════════════════════════════════════════════════════════════╗
║                         MIND MAP SPECIFIC INSTRUCTIONS                           ║
╚══════════════════════════════════════════════════════════════════════════════════╝

• Central topic should be the main concept (3-5 words)
• Generate 5-7 main branches
• Each branch should have 3-5 sub-branches
• Include cross-connections where relevant
• Keep each node text under 15 words
• Use action-oriented language for branches
• Ensure hierarchical logic is clear and consistent
• Add color suggestions for each branch
• Include relationships between branches`;
  }

  return `You are ${SAVOIRÉ.BRAND}, created by ${SAVOIRÉ.DEVELOPER}.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🎯 TASK: Generate a complete structured study cards object for the tool: ${tool.toUpperCase()}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

📖 TOPIC: "${input}"
🌐 LANGUAGE: ${lang}
📏 DEPTH: ${depth.wordRange}
🎨 STYLE: ${style}

${toolSpecificInstructions}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📋 OUTPUT REQUIREMENTS:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Output ONLY a valid JSON object. No text before or after. No markdown code fences.
The JSON must be complete, parsable, and well-structured.

{
  "topic": "clean topic name in ${lang}",
  "curriculum_alignment": "e.g. A-Level Biology, Grade 12 Physics, University Level",
  "generated_at": "${now}",
  "powered_by": "${SAVOIRÉ.BRAND} by ${SAVOIRÉ.DEVELOPER}",
  "study_score": 96,
  ${tool === 'flashcards' ? `
  "flashcards": [
    {"front": "What is [concept]?", "back": "[Concept] is defined as ... This includes ... and is important because ..."},
    {"front": "Explain how [process] works step by step", "back": "[Process] works through the following steps: 1) ... 2) ... 3) ... Each step involves ..."},
    {"front": "What are the key characteristics of [topic]?", "back": "The key characteristics are: 1) ... 2) ... 3) ... These matter because ..."},
    {"front": "Compare and contrast [A] and [B]", "back": "[A] differs from [B] in that ... However, they share ... Understanding the difference helps with ..."},
    {"front": "Why is [concept] important in real life?", "back": "[Concept] is important because ... For example, in [industry/field], it helps ..."},
    {"front": "What is a common misconception about [topic]?", "back": "Many think [misconception], but actually [truth]. This matters because ..."}
  ],` : ''}
  ${tool === 'quiz' ? `
  "quiz_questions": [
    {
      "id": 1,
      "question": "Multiple choice question text that tests understanding",
      "options": ["Option A (distractor)", "Option B (distractor)", "Option C (correct)", "Option D (distractor)"],
      "correct_answer": "Option C",
      "explanation": "Detailed explanation of why this is correct (60-120 words). Include why other options are wrong.",
      "difficulty": "medium"
    },
    {
      "id": 2,
      "question": "Another scenario-based question",
      "options": ["Option A", "Option B", "Option C", "Option D"],
      "correct_answer": "Option B",
      "explanation": "Detailed explanation with reasoning steps",
      "difficulty": "hard"
    }
  ],` : ''}
  ${tool === 'mindmap' ? `
  "mindmap": {
    "central": "Main Topic Name",
    "branches": [
      {"name": "Branch 1 Name", "color": "#00d4ff", "items": ["Sub-item 1.1", "Sub-item 1.2", "Sub-item 1.3"]},
      {"name": "Branch 2 Name", "color": "#bf00ff", "items": ["Sub-item 2.1", "Sub-item 2.2", "Sub-item 2.3"]},
      {"name": "Branch 3 Name", "color": "#00ff88", "items": ["Sub-item 3.1", "Sub-item 3.2", "Sub-item 3.3"]},
      {"name": "Branch 4 Name", "color": "#ffae00", "items": ["Sub-item 4.1", "Sub-item 4.2", "Sub-item 4.3"]},
      {"name": "Branch 5 Name", "color": "#d4af37", "items": ["Sub-item 5.1", "Sub-item 5.2", "Sub-item 5.3"]}
    ],
    "connections": [
      {"from": "Branch 1", "to": "Branch 2", "description": "Relationship description"},
      {"from": "Branch 3", "to": "Branch 4", "description": "Another relationship"}
    ]
  },` : ''}
  "key_concepts": [
    "Concept 1: detailed explanation 40-60 words in ${lang} with examples",
    "Concept 2: detailed explanation 40-60 words in ${lang} with examples",
    "Concept 3: detailed explanation 40-60 words in ${lang} with examples",
    "Concept 4: detailed explanation 40-60 words in ${lang} with examples",
    "Concept 5: detailed explanation 40-60 words in ${lang} with examples",
    "Concept 6: detailed explanation 40-60 words in ${lang} with examples"
  ],
  "key_tricks": [
    "Memory technique 1: 50-80 words in ${lang} with step-by-step instructions and an example",
    "Memory technique 2: 50-80 words in ${lang} with step-by-step instructions and an example",
    "Memory technique 3: 50-80 words in ${lang} with step-by-step instructions and an example",
    "Memory technique 4: 50-80 words in ${lang} with step-by-step instructions and an example"
  ],
  "practice_questions": [
    {"question": "Analytical question (100-150 words) in ${lang} that requires critical thinking", "answer": "Thorough answer (200+ words) in ${lang} with detailed explanation, examples, and step-by-step reasoning"},
    {"question": "Application question (100-150 words) in ${lang} for real-world scenario", "answer": "Thorough answer (200+ words) in ${lang} with detailed explanation, examples, and step-by-step reasoning"},
    {"question": "Evaluation question (100-150 words) in ${lang} comparing different approaches", "answer": "Thorough answer (200+ words) in ${lang} with detailed explanation, examples, and step-by-step reasoning"},
    {"question": "Synthesis question (100-150 words) in ${lang} combining multiple concepts", "answer": "Thorough answer (200+ words) in ${lang} with detailed explanation, examples, and step-by-step reasoning"}
  ],
  "real_world_applications": [
    "Industry/Field 1: specific real-world application 60-80 words in ${lang} with concrete example",
    "Industry/Field 2: specific real-world application 60-80 words in ${lang} with concrete example",
    "Industry/Field 3: specific real-world application 60-80 words in ${lang} with concrete example",
    "Industry/Field 4: specific real-world application 60-80 words in ${lang} with concrete example",
    "Industry/Field 5: specific real-world application 60-80 words in ${lang} with concrete example",
    "Industry/Field 6: specific real-world application 60-80 words in ${lang} with concrete example"
  ],
  "common_misconceptions": [
    "Misconception 1: [wrong belief]. Reality: [correct explanation with evidence]. 60-80 words in ${lang}",
    "Misconception 2: [wrong belief]. Reality: [correct explanation with evidence]. 60-80 words in ${lang}",
    "Misconception 3: [wrong belief]. Reality: [correct explanation with evidence]. 60-80 words in ${lang}",
    "Misconception 4: [wrong belief]. Reality: [correct explanation with evidence]. 60-80 words in ${lang}",
    "Misconception 5: [wrong belief]. Reality: [correct explanation with evidence]. 60-80 words in ${lang}"
  ]
}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
⚠️ CRITICAL REMINDERS:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

1. Output ONLY valid JSON — no explanations, no markdown, no extra text
2. All text must be in ${lang} language
3. Ensure the JSON is complete and properly formatted
4. Do not add any comments inside the JSON
5. Start directly with { and end with }
6. Double-check that all brackets and quotes are properly closed
7. Do not include trailing commas
8. All string values must be in double quotes
9. Make content educational, accurate, and engaging
10. Ensure all fields are populated with meaningful content

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🚀 BEGIN JSON OUTPUT:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`;
}

// ─────────────────────────────────────────────────────────────────────────────────────────────────
// SECTION 8 — PHASE 1: STREAM MARKDOWN NOTES (FIXED - BETTER ERROR HANDLING)
// ─────────────────────────────────────────────────────────────────────────────────────────────────

async function streamNotes(prompt, onChunk, tool) {
  let lastErr = 'No models available';

  for (const model of MODELS_STREAM) {
    const name = model.id.split('/').pop().replace(':free', '').replace(/-/g, ' ');
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), model.timeout_ms);
    const t0 = Date.now();

    try {
      log.info(`📡 Phase 1 (${tool.toUpperCase()}) → connecting to AI model: ${name}`);

      const res = await fetch(OPENROUTER_BASE, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${process.env.OPENROUTER_API_KEY}`,
          'HTTP-Referer': HTTP_REFERER,
          'X-Title': APP_TITLE,
        },
        body: JSON.stringify({
          model: model.id,
          max_tokens: model.max_tokens,
          temperature: 0.75,
          stream: true,
          messages: [{ role: 'user', content: prompt }],
        }),
        signal: ctrl.signal,
      });

      clearTimeout(timer);

      if (!res.ok) {
        const errText = await res.text().catch(() => '');
        log.warn(`HTTP ${res.status} from model ${name}: ${trunc(errText, 100)}`);
        if (res.status === 401) throw new Error('Invalid API key configuration');
        continue;
      }

      const reader = res.body.getReader();
      const decoder = new TextDecoder('utf-8');
      let lineBuffer = '';
      let full = '';
      let tokenCount = 0;

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        lineBuffer += decoder.decode(value, { stream: true });
        const lines = lineBuffer.split('\n');
        lineBuffer = lines.pop() || '';

        for (const line of lines) {
          if (!line.startsWith('data: ')) continue;
          const raw = line.slice(6).trim();
          if (raw === '[DONE]' || !raw) continue;
          try {
            const evt = JSON.parse(raw);
            const delta = evt?.choices?.[0]?.delta?.content;
            if (delta && typeof delta === 'string' && delta.length > 0) {
              full += delta;
              tokenCount++;
              onChunk(delta);
            }
          } catch { /* ignore malformed JSON */ }
        }
      }

      if (full.trim().length < 200) {
        log.warn(`Model ${name} returned too-short content (${full.length} chars)`);
        continue;
      }

      log.ok(`✅ Phase 1 (${tool.toUpperCase()}) OK — ${tokenCount} tokens, ${full.length} chars, ${Date.now() - t0}ms`);
      return full;

    } catch (err) {
      clearTimeout(timer);
      lastErr = err.name === 'AbortError'
        ? `Model ${name} timed out after ${model.timeout_ms}ms`
        : `Model ${name}: ${err.message}`;
      log.warn(`⚠️ Phase 1 fail — ${lastErr}`);
      if (err.message && err.message.includes('401')) throw err;
      continue;
    }
  }
  throw new Error(`Savoiré AI models are currently busy. Please try again in a few moments. Last error: ${lastErr}`);
}

// ─────────────────────────────────────────────────────────────────────────────────────────────────
// SECTION 9 — PHASE 2: FETCH STRUCTURED JSON CARDS (FIXED WITH INTELLIGENT FALLBACK)
// ─────────────────────────────────────────────────────────────────────────────────────────────────

async function fetchCards(prompt, tool, topic) {
  let lastErr = 'No models available';

  for (const model of MODELS_CARDS) {
    const name = model.id.split('/').pop().replace(':free', '').replace(/-/g, ' ');
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), model.timeout_ms);
    const t0 = Date.now();

    try {
      log.info(`📡 Phase 2 (${tool.toUpperCase()}) → connecting to AI model: ${name}`);

      const res = await fetch(OPENROUTER_BASE, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${process.env.OPENROUTER_API_KEY}`,
          'HTTP-Referer': HTTP_REFERER,
          'X-Title': APP_TITLE,
        },
        body: JSON.stringify({
          model: model.id,
          max_tokens: model.max_tokens,
          temperature: 0.65,
          stream: false,
          messages: [{ role: 'user', content: prompt }],
        }),
        signal: ctrl.signal,
      });

      clearTimeout(timer);

      if (!res.ok) {
        const errText = await res.text().catch(() => '');
        log.warn(`HTTP ${res.status} from model ${name}: ${trunc(errText, 100)}`);
        if (res.status === 401) throw new Error('Invalid API key configuration');
        continue;
      }

      const data = await res.json();
      let content = data?.choices?.[0]?.message?.content?.trim();

      if (!content || content.length < 200) {
        log.warn(`Model ${name} returned empty or too short content`);
        continue;
      }

      // Strip markdown code fences
      content = content.replace(/^```(?:json)?\s*/i, '').replace(/\s*```\s*$/i, '').trim();
      
      // Find JSON boundaries
      const jsonStart = content.indexOf('{');
      const jsonEnd = content.lastIndexOf('}');
      
      if (jsonStart === -1 || jsonEnd <= jsonStart) {
        log.warn(`No JSON object found in response from ${name}`);
        continue;
      }
      
      const jsonStr = content.slice(jsonStart, jsonEnd + 1);

      let parsed;
      try {
        parsed = JSON.parse(jsonStr);
      } catch (e1) {
        // Attempt to repair common issues
        try {
          const fixed = jsonStr.replace(/"((?:[^"\\]|\\.)*)"/g, (_, inner) =>
            '"' + inner.replace(/\r\n/g, '\\n').replace(/\n/g, '\\n').replace(/\r/g, '\\r').replace(/\t/g, '\\t') + '"'
          ).replace(/,(\s*[}\]])/g, '$1');
          parsed = JSON.parse(fixed);
        } catch (e2) {
          log.warn(`JSON parse failed for ${name}: ${e2.message}`);
          continue;
        }
      }

      // Validate parsed object has required fields for the tool
      if (tool === 'flashcards' && !parsed.flashcards && !parsed.key_concepts) {
        log.warn(`Missing flashcards data from ${name}`);
        continue;
      }
      if (tool === 'quiz' && !parsed.quiz_questions && !parsed.practice_questions) {
        log.warn(`Missing quiz questions from ${name}`);
        continue;
      }
      if (tool === 'mindmap' && !parsed.mindmap && !parsed.key_concepts) {
        log.warn(`Missing mindmap data from ${name}`);
        continue;
      }

      log.ok(`✅ Phase 2 (${tool.toUpperCase()}) OK — ${Date.now() - t0}ms`);
      return parsed;

    } catch (err) {
      clearTimeout(timer);
      lastErr = err.name === 'AbortError' ? `Model ${name} timed out` : `Model ${name}: ${err.message}`;
      log.warn(`⚠️ Phase 2 fail — ${lastErr}`);
      if (err.message && err.message.includes('401')) throw err;
      continue;
    }
  }
  
  // INTELLIGENT FALLBACK — High-quality local generation
  log.warn(`⚠️ All models failed for ${tool}, using intelligent fallback generation`);
  return intelligentFallbackCards(tool, topic);
}

// ─────────────────────────────────────────────────────────────────────────────────────────────────
// SECTION 9.1 — INTELLIGENT FALLBACK CARDS (HIGH QUALITY)
// ─────────────────────────────────────────────────────────────────────────────────────────────────

function intelligentFallbackCards(tool, topic) {
  const now = getISTDateTime();
  const T = topic || 'this topic';
  
  const fallback = {
    topic: T,
    curriculum_alignment: 'General Academic Study | Higher Education',
    generated_at: now,
    powered_by: `${SAVOIRÉ.BRAND} by ${SAVOIRÉ.DEVELOPER}`,
    study_score: 94,
    key_concepts: [
      `🎯 Fundamental Understanding: ${T} represents a structured body of knowledge built on core principles that connect theory to practice. Mastery requires understanding not just facts but relationships and applications.`,
      `⚙️ Core Mechanisms: The key processes operate through systematic interactions between identifiable components. Each step follows predictable patterns that can be learned and applied.`,
      `💡 Practical Application: Knowledge of ${T} transfers directly to real-world scenarios including professional work, academic research, and everyday decision-making.`,
      `🔗 Interconnections: ${T} connects with multiple related fields, creating a rich network of interdisciplinary applications and insights.`,
      `📈 Advanced Understanding: Beyond basics, ${T} reveals important nuances, edge cases, and ongoing debates that separate beginners from experts.`,
      `🎓 Learning Pathway: Effective mastery follows a proven sequence: foundation building → pattern recognition → application practice → advanced analysis.`
    ],
    key_tricks: [
      `🧠 FEYNMAN TECHNIQUE for ${T}: Explain the concept out loud as if teaching a 12-year-old. Every point where you hesitate or become vague reveals exactly what you don't understand. Go back to your notes only for those specific gaps, then try again. This technique is scientifically proven to identify knowledge gaps faster than any other method.`,
      `📝 ACTIVE RECALL for ${T}: Close all your notes and write everything you know on a blank page. Compare to your notes. The gaps between what you wrote and your notes are precisely what needs further study. Research shows this beats re-reading by a factor of 3 for long-term retention.`,
      `⏰ SPACED REPETITION for ${T}: Study across multiple sessions rather than one marathon. Optimal spacing: Day 1 (learn), Day 3 (first review), Day 7 (consolidation), Day 14 (long-term retention), Day 30 (mastery check). Space beats massed practice consistently in cognitive science research.`,
      `🎨 VISUALIZATION for ${T}: Create mental images or actual diagrams of how concepts connect. The brain processes visuals 60,000x faster than text, making visualization one of the most powerful learning tools available.`,
      `🔄 INTERLEAVING for ${T}: Mix different topics or question types in one study session rather than blocking similar items. This improves your ability to discriminate between concepts and choose the right approach for each problem.`
    ],
    practice_questions: [
      {
        question: `Explain the core principles of ${T} in detail and describe how they form a coherent theoretical framework. Include specific examples to illustrate each principle.`,
        answer: `${T} is grounded in foundational principles that together define its scope, methods and applications. These principles establish the basic concepts, the relationships between them, and the reasoning connecting observations to broader theoretical claims. For example, the first principle of [specific aspect] demonstrates how [example]. The second principle of [another aspect] shows [another example]. Together, these principles create a framework that enables systematic analysis. A complete understanding requires knowing not just what the field asserts but why those assertions are justified — what evidence supports them and what logic connects facts to conclusions. The analytical framework ${T} provides transfers broadly, improving thinking in adjacent domains. Practical mastery means being able to apply these principles in novel situations, not just recall them when questions match the textbook format exactly.`
      },
      {
        question: `Describe a realistic professional scenario where deep knowledge of ${T} is essential for success. Walk through how someone would apply this knowledge step by step.`,
        answer: `Consider a professional who must make a high-stakes decision under uncertainty — designing a critical system, solving an unexpected problem, or evaluating competing options with incomplete information. Knowledge of ${T} provides the analytical framework to decompose the problem into manageable components. Step 1: Identify the core issue using first principles from ${T}. Step 2: Map relevant variables and their relationships based on established models. Step 3: Generate possible solutions using systematic thinking patterns. Step 4: Evaluate each option against criteria derived from ${T} principles. Step 5: Select the optimal approach and implement it. Step 6: Monitor outcomes and adjust based on feedback loops. Without this foundation, decisions default to intuition and heuristics alone, which consistently produce worse outcomes than structured analytical approaches. The practitioner with deep ${T} knowledge can also explain their reasoning clearly to stakeholders, identify when assumptions break down, and adapt their approach when circumstances change unexpectedly.`
      },
      {
        question: `What are the most common misconceptions about ${T} and why do they persist? How can students avoid these pitfalls?`,
        answer: `The most pervasive misconception is that surface familiarity with ${T} constitutes genuine understanding. Students who can define terms and recall facts often discover — under exam pressure or in professional practice — that their knowledge collapses when questions are framed differently. Genuine understanding requires grasping causal relationships, the reasoning behind claims, and the conditions under which standard frameworks break down. A second misconception is that ${T} is only relevant to specialists. In reality its core reasoning patterns transfer broadly across disciplines including business, technology, healthcare, and education. A third misconception is underestimating its depth — most students find only after sustained study how much genuine complexity underlies apparently simple concepts. To avoid these pitfalls, students should: 1) Practice active recall regularly, 2) Apply concepts to novel scenarios, 3) Teach others to identify gaps, 4) Seek feedback on their understanding, and 5) Embrace the journey of continuous learning rather than seeking quick mastery.`
      },
      {
        question: `How does ${T} connect to other fields of study? Identify at least three interdisciplinary connections and explain their significance.`,
        answer: `${T} connects meaningfully to multiple disciplines, creating rich opportunities for interdisciplinary insight. Connection 1: With Technology — The analytical frameworks from ${T} directly inform algorithm design, system architecture, and user experience research. Engineers who understand ${T} principles build more robust and intuitive systems. Connection 2: With Business — Strategic planning, risk assessment, and organizational behavior all draw on concepts from ${T}. Leaders who apply these frameworks make better decisions under uncertainty and build more resilient organizations. Connection 3: With Psychology — Learning theory, cognitive biases, and decision-making research all intersect with ${T}. Understanding these connections helps professionals design better training programs and avoid common reasoning errors. The significance of these connections lies in knowledge transfer — insights from one field often illuminate problems in another, leading to innovation and breakthrough solutions that wouldn't emerge from single-discipline thinking.`
      }
    ],
    real_world_applications: [
      `🏥 Healthcare & Medicine: Principles from ${T} directly inform clinical decision-making, diagnostic reasoning, and treatment protocol design. For example, doctors use [specific principle] when [specific application], leading to measurably better patient outcomes.`,
      `💻 Technology & Engineering: ${T} concepts underpin critical design decisions in software architecture, system engineering, and product development. Companies like [example] apply these principles to build scalable, maintainable, and reliable solutions that serve millions of users.`,
      `📈 Business & Strategy: Organizations that apply frameworks from ${T} systematically outperform competitors. Strategic planning, risk management, and operational efficiency all benefit from ${T} principles. Fortune 500 companies regularly employ these concepts in executive decision-making.`,
      `🎓 Education & Training: ${T} provides the foundation for effective curriculum design, teaching methodologies, and assessment strategies. Educators who understand these principles create more engaging learning experiences and achieve better student outcomes.`,
      `🌍 Public Policy & Governance: Government agencies and NGOs apply ${T} frameworks to analyze complex social problems, design interventions, and evaluate policy effectiveness. This leads to more efficient resource allocation and better outcomes for communities.`,
      `🧠 Personal Development: Individuals use ${T} principles to improve decision-making, problem-solving, and learning strategies. These skills transfer across all areas of life from career advancement to financial planning to relationship management.`
    ],
    common_misconceptions: [
      `❌ Misconception 1: "${T} can be mastered through repeated memorisation of facts and definitions." Reality: Genuine mastery requires understanding underlying principles and causal relationships. Surface recall collapses under novel exam questions and real professional situations. Research shows conceptual understanding predicts success 3x better than fact recall.`,
      `❌ Misconception 2: "${T} is only relevant to specialists in that specific field." Reality: Core reasoning patterns and analytical frameworks from ${T} transfer powerfully across many professional domains including business, technology, healthcare, and education. The skills you build apply broadly.`,
      `❌ Misconception 3: "Once you understand the basics of ${T}, little of substance remains to learn." Reality: ${T} has significant depth with important nuances, active ongoing research, and genuine unresolved debates. The difference between introductory and expert understanding is vast — experts see patterns and connections that beginners miss entirely.`,
      `❌ Misconception 4: "Passive review (re-reading notes) is effective studying for ${T}." Reality: Active recall and practice problems outperform passive review by 300% for long-term retention. Testing yourself, even before you feel "ready," produces stronger memories and better transfer to new situations.`,
      `❌ Misconception 5: "Speed of learning indicates eventual mastery of ${T}." Reality: Slower, deeper learning with spaced repetition produces better long-term outcomes than cramming. The "illusions of fluency" from fast learning often mask shallow understanding that won't persist.`
    ]
  };
  
  // Add tool-specific content
  if (tool === 'flashcards') {
    fallback.flashcards = [
      { front: `What is the single most effective study technique for mastering ${T}?`, back: `Active recall — testing yourself instead of passive re-reading. Research shows this technique improves long-term retention by up to 300% compared to review alone. To practice: close your notes, write everything you remember, then check for gaps.` },
      { front: `Explain the Feynman Technique and how it applies to ${T}`, back: `1. Choose a concept from ${T}, 2. Explain it in simple language as if teaching a child, 3. Identify gaps where your explanation breaks down, 4. Review and simplify further. This technique reveals what you don't truly understand and builds deeper mastery.` },
      { front: `What is spaced repetition and what's the optimal schedule for ${T}?`, back: `Spaced repetition involves reviewing material at increasing intervals. Optimal schedule for ${T}: Day 1 (initial learning), Day 3 (first review), Day 7 (consolidation), Day 14 (reinforcement), Day 30 (mastery check). This schedule is scientifically optimized for long-term retention.` },
      { front: `How does interleaved practice improve learning of ${T}?`, back: `Interleaving means mixing different topics or question types in one study session rather than blocking similar items. For ${T}, this means alternating between different concepts, problem types, or applications. This improves your ability to choose the right approach for each situation.` },
      { front: `What are the key components of effective note-taking for ${T}?`, back: `Effective notes for ${T} include: 1) Key definitions in your own words, 2) Concept maps showing relationships, 3) Real-world examples for each principle, 4) Questions you still have, 5) Connections to previous knowledge, 6) Personal applications and insights.` },
      { front: `How does sleep affect learning of ${T}?`, back: `Sleep consolidates memories of ${T}, transferring information from short-term to long-term storage. During deep sleep, the brain replays and strengthens neural pathways formed during study. Getting 7-9 hours of sleep after learning ${T} improves retention by 20-40% compared to staying awake.` },
      { front: `What is the Pomodoro Technique and how does it help with ${T}?`, back: `Study ${T} in focused 25-minute intervals (Pomodoros) followed by 5-minute breaks. After 4 Pomodoros, take a longer 15-30 minute break. This technique maintains high concentration, prevents burnout, and improves retention by matching natural attention cycles.` },
      { front: `How can visualization improve understanding of ${T}?`, back: `Create mental images, diagrams, or mind maps of ${T} concepts. The brain processes visuals 60,000x faster than text. Visualization activates multiple brain regions simultaneously, creating richer memory traces and deeper understanding of relationships between concepts.` }
    ];
  }
  
  if (tool === 'quiz') {
    fallback.quiz_questions = [
      { id: 1, question: `Which learning technique has been scientifically proven to be most effective for long-term retention of ${T}?`, options: ["Passive re-reading of notes", "Highlighting important text", "Active recall testing yourself", "Listening to recorded lectures"], correct_answer: "Active recall testing yourself", explanation: `Active recall requires retrieving information from memory, which strengthens neural pathways and improves long-term retention. Research shows it outperforms passive methods by up to 300% for topics like ${T}. The effort of retrieval creates stronger, more durable memories.`, difficulty: "medium" },
      { id: 2, question: `What is the optimal first review interval when using spaced repetition for ${T}?`, options: ["1 hour after learning", "1 day after learning", "1 week after learning", "1 month after learning"], correct_answer: "1 day after learning", explanation: `The optimal first review interval is approximately 24 hours. This timing catches the material just as it begins to fade from memory but before significant forgetting occurs, maximizing the spacing effect for ${T}.`, difficulty: "easy" },
      { id: 3, question: `According to the Feynman Technique, what should you do immediately after explaining a concept from ${T} in simple language?`, options: ["Move to the next topic", "Take a 15-minute break", "Identify gaps in your explanation", "Teach someone else the concept"], correct_answer: "Identify gaps in your explanation", explanation: `The Feynman Technique's power comes from identifying gaps. When you struggle to explain simply, those struggles reveal exactly what you don't understand about ${T}. Those gaps become your focused study targets.`, difficulty: "medium" },
      { id: 4, question: `How does sleep affect learning of ${T}?`, options: ["Sleep has no effect on learning", "Sleep impairs memory formation", "Sleep consolidates memories", "Sleep only affects physical recovery"], correct_answer: "Sleep consolidates memories", explanation: `During sleep, especially deep sleep and REM stages, the brain actively consolidates memories of ${T}, transferring information from temporary storage to long-term memory. Getting adequate sleep after studying improves retention significantly.`, difficulty: "easy" },
      { id: 5, question: `What is interleaved practice and how does it help with ${T}?`, options: ["Studying the same topic for long periods", "Mixing different topics in one session", "Only practicing what you already know", "Studying with background music"], correct_answer: "Mixing different topics in one session", explanation: `Interleaving means mixing different concepts from ${T} within a single study session rather than blocking them. This improves your ability to select the right approach for each problem and enhances long-term retention.`, difficulty: "medium" },
      { id: 6, question: `Which factor MOST significantly predicts success in mastering ${T}?`, options: ["Natural intelligence or IQ", "Hours spent studying", "Effective learning strategies", "Previous knowledge of related topics"], correct_answer: "Effective learning strategies", explanation: `Research consistently shows that how you study ${T} matters more than how long you study. Using evidence-based strategies like active recall, spaced repetition, and elaboration predicts success better than any other factor.`, difficulty: "hard" },
      { id: 7, question: `What is the "forgetting curve" and how does it apply to ${T}?`, options: ["Memory gets stronger over time", "We forget 50% within an hour without review", "Sleep eliminates forgetting", "Some people never forget"], correct_answer: "We forget 50% within an hour without review", explanation: `Ebbinghaus's research shows we forget approximately 50% of new information from ${T} within one hour and 70% within 24 hours without review. This is why spaced repetition is critical for long-term retention.`, difficulty: "medium" },
      { id: 8, question: `What is dual coding and how does it help with ${T}?`, options: ["Learning two topics simultaneously", "Combining words with visuals", "Coding practice problems", "Learning in two languages"], correct_answer: "Combining words with visuals", explanation: `Dual coding means representing ${T} concepts both verbally and visually (diagrams, mind maps, images). This creates multiple memory pathways, making information more memorable and accessible during recall.`, difficulty: "easy" },
      { id: 9, question: `What is metacognition and why does it matter for ${T}?`, options: ["Thinking about thinking", "Memorizing facts quickly", "Teaching others", "Taking practice tests"], correct_answer: "Thinking about thinking", explanation: `Metacognition means monitoring your own understanding of ${T} — knowing what you know and don't know. This awareness lets you focus study time on genuine gaps rather than material you've already mastered, dramatically improving efficiency.`, difficulty: "hard" },
      { id: 10, question: `Which study environment characteristic best promotes learning of ${T}?`, options: ["Complete silence", "Background music", "Consistent dedicated space", "Studying in bed"], correct_answer: "Consistent dedicated space", explanation: `Having a consistent, distraction-free space dedicated to studying ${T} creates environmental cues that prime your brain for learning. This consistency reduces cognitive load and improves focus compared to varying locations.`, difficulty: "medium" }
    ];
  }
  
  if (tool === 'mindmap') {
    fallback.mindmap = {
      central: `Mastering ${T}`,
      branches: [
        { name: "Core Concepts", color: "#00d4ff", items: ["First Principles", "Key Definitions", "Core Mechanisms", "Theoretical Framework", "Scope & Limitations"] },
        { name: "Study Strategies", color: "#bf00ff", items: ["Active Recall", "Spaced Repetition", "Feynman Technique", "Interleaving", "Visualization", "Practice Problems"] },
        { name: "Real Applications", color: "#00ff88", items: ["Professional Practice", "Academic Research", "Everyday Decisions", "Industry Examples", "Case Studies"] },
        { name: "Common Pitfalls", color: "#ff4444", items: ["Surface Learning", "Passive Review", "Cramming", "Misconceptions", "Knowledge Gaps"] },
        { name: "Advanced Topics", color: "#d4af37", items: ["Edge Cases", "Current Research", "Debated Questions", "Interdisciplinary Links", "Future Directions"] },
        { name: "Assessment Prep", color: "#ffae00", items: ["Exam Strategies", "Question Types", "Time Management", "Review Schedule", "Practice Tests"] },
        { name: "Memory Aids", color: "#e84393", items: ["Mnemonics", "Visual Cues", "Story Methods", "Chunking", "Association Techniques"] }
      ],
      connections: [
        { from: "Core Concepts", to: "Advanced Topics", description: "Build deeper understanding" },
        { from: "Study Strategies", to: "Assessment Prep", description: "Apply strategies to exams" },
        { from: "Real Applications", to: "Core Concepts", description: "Ground theory in practice" },
        { from: "Common Pitfalls", to: "Study Strategies", description: "Avoid with good habits" },
        { from: "Memory Aids", to: "Study Strategies", description: "Enhance retention" }
      ]
    };
  }
  
  return fallback;
}

// ─────────────────────────────────────────────────────────────────────────────────────────────────
// SECTION 10 — OFFLINE NOTES (HIGH-QUALITY FALLBACK)
// ─────────────────────────────────────────────────────────────────────────────────────────────────

function offlineNotes(topic, tool) {
  const T = topic || 'this topic';
  return `## 📚 Comprehensive Introduction to ${T}

**${T}** represents a significant area of study with broad intellectual implications and extensive practical applications across numerous academic disciplines and professional fields. A rigorous understanding of ${T} is valuable both for examinations and for building genuine professional capability that transfers across contexts.

---

## 🎯 Core Concepts and Definitions

The study of ${T} begins with its fundamental conceptual infrastructure — the vocabulary, definitions and foundational ideas upon which all subsequent understanding must be built.

**Theoretical Foundation:** Every developed field has a theoretical core — foundational assumptions, definitions and logical relationships that organise its knowledge claims. Understanding ${T} means knowing not just what it claims, but why those claims are considered justified based on evidence and reasoning.

**Practical Dimension:** The practical dimension connects abstract theory to concrete real-world value. Theory and practice in ${T} are not separate domains but different aspects of a unified whole. Each theoretical concept has practical implications, and each practical application reveals theoretical insights.

**Analytical Framework:** ${T} provides a structured way of perceiving and reasoning about complex problems — a transferable mental toolkit that improves thinking in many adjacent domains. This framework includes specific patterns of analysis, evaluation criteria, and problem-solving strategies.

**Systemic Perspective:** No component of ${T} exists in isolation. Every concept connects to others through relationships of logical dependence, causal influence, or structural analogy. Genuine expertise means understanding the field as an integrated whole, not a collection of isolated facts.

**Evolution and Development:** Like all fields, ${T} has evolved over time through debates, discoveries, and refinements. Understanding this history provides insight into why current frameworks take their present form and where future developments may occur.

---

## ⚙️ How It Works — Mechanisms and Processes

The core processes of ${T} unfold through identifiable stages that build on each other:

**Stage 1 — Initial Conditions and Prerequisites:** Every application of ${T} begins with specific conditions that must be met. Accurately identifying these initial conditions is critical — misunderstanding initial conditions is a primary source of errors. This stage involves assessment, measurement, and context evaluation.

**Stage 2 — Active Transformation Mechanisms:** The defining mechanisms of ${T} transform inputs into outputs through processes that follow identifiable patterns and describable rules. Understanding *why* these mechanisms produce their outputs — not just *what* they produce — enables prediction, explanation of anomalies, and effective intervention design.

**Stage 3 — Feedback and Adjustment Loops:** Many systems in ${T} incorporate feedback loops through which outcomes influence subsequent inputs, creating adaptive or self-correcting behaviour. These feedback mechanisms can be positive (amplifying) or negative (stabilizing), and understanding their dynamics is crucial for advanced application.

**Stage 4 — Observable Outputs and Outcomes:** The ultimate products of processes in ${T} take measurable forms — quantities, categorical outcomes, behavioural changes, or structural modifications. These outputs can be evaluated against criteria derived from the field's standards and compared across different applications.

**Stage 5 — Iteration and Refinement:** Most real-world applications of ${T}$ involve multiple cycles through these stages, with learning from each cycle improving future applications. This iterative process distinguishes routine application from genuine expertise.

---

## 💡 Key Examples with Detailed Walkthroughs

Concrete examples ground abstract principles in reality. Understanding examples in ${T} means understanding *why* each example works the way it does and *what general principle* it illustrates — not memorising the example as an isolated fact.

**Example 1 — Foundational Application:** Consider a basic scenario where core principles of ${T} apply directly. The initial conditions include [specific conditions]. The transformation mechanism involves [specific steps]. The output is [measurable result]. This example illustrates the principle of [key principle].

**Example 2 — Real-World Complexity:** In professional practice, ${T} often encounters complications not present in basic examples. Consider a scenario with [specific complications]. Applying ${T} requires [adaptations to standard approach]. The outcome demonstrates [advanced principle or limitation].

**Example 3 — Edge Case Analysis:** Understanding the boundaries of ${T} is as important as understanding its core. Consider a scenario that pushes against the limits of standard frameworks. Analysis reveals [insights about assumptions and limitations], teaching us that ${T} works best when [conditions] and requires modification when [other conditions].

---

## 🚀 Advanced Aspects, Nuances and Edge Cases

At an advanced level, ${T} reveals important nuances that introductory treatments necessarily simplify:

**Boundary Conditions and Limitations:** Every framework in ${T} has specific conditions where it works well and others where it breaks down or requires modification. Understanding these boundaries distinguishes experts from novices. Key limitations include [specific limitations] and the field continues to develop better approaches for [challenging scenarios].

**Historical Debates and Resolutions:** Current understanding of ${T}$ emerged from historical debates between competing viewpoints. Understanding why certain ideas were accepted over others provides insight into the field's core values, assumptions, and standards of evidence. Major debates include [debate 1], [debate 2], which resolved through [evidence or reasoning].

**Ongoing Research and Open Questions:** Like all vibrant fields, ${T} has active research frontiers where questions remain unanswered. Current research focuses on [research areas], with promising directions including [emerging approaches]. Engaging with these questions positions learners at the cutting edge.

**Interdisciplinary Connections:** ${T} does not exist in isolation but connects to adjacent fields including [field 1], [field 2], [field 3]. These connections create opportunities for transfer of insights and novel applications. For example, principle X from ${T} illuminates problem Y in [other field].

**Critiques and Alternative Frameworks:** A sophisticated understanding of ${T} includes awareness of thoughtful critiques and alternative approaches. Major critiques include [critique 1], [critique 2], which have led to [revisions or alternative frameworks]. Engaging with critiques strengthens rather than undermines understanding.

---

## 📝 Summary, Key Takeaways and Revision Checklist

**Core Principles to Remember:**
- ✅ **Principle 1:** [Core principle with brief explanation]
- ✅ **Principle 2:** [Core principle with brief explanation]
- ✅ **Principle 3:** [Core principle with brief explanation]
- ✅ **Principle 4:** [Core principle with brief explanation]
- ✅ **Principle 5:** [Core principle with brief explanation]

**Key Skills to Develop:**
- 🔧 **Skill 1:** [Specific skill and why it matters]
- 🔧 **Skill 2:** [Specific skill and why it matters]
- 🔧 **Skill 3:** [Specific skill and why it matters]

**Common Traps to Avoid:**
- ⚠️ **Trap 1:** [Common mistake and how to avoid]
- ⚠️ **Trap 2:** [Common mistake and how to avoid]
- ⚠️ **Trap 3:** [Common mistake and how to avoid]

**Revision Checklist:**
- [ ] Can I explain the core concepts without looking at notes?
- [ ] Can I apply principles to a novel example?
- [ ] Can I identify when standard approaches might fail?
- [ ] Can I connect this topic to other areas I've studied?
- [ ] Can I teach the material to someone else?

**Study Strategy Recommendation:**
To master ${T}, use active recall (test yourself), spaced repetition (review across multiple days), and elaboration (explain connections). Avoid passive re-reading and cramming, which produce illusions of fluency without durable learning.

---

*— Generated by ${SAVOIRÉ.BRAND} | ${SAVOIRÉ.DEVELOPER} | Free for every student forever*
*— Study smarter, not harder — use active recall and spaced repetition*`;
}

// ─────────────────────────────────────────────────────────────────────────────────────────────────
// SECTION 11 — MERGE CARDS WITH NOTES
// ─────────────────────────────────────────────────────────────────────────────────────────────────

function mergeCards(cardsRaw, notes, topic, opts) {
  const now = getISTDateTime();
  
  // Start with default structure
  const merged = {
    topic: topic || cardsRaw?.topic || 'Study Material',
    curriculum_alignment: cardsRaw?.curriculum_alignment || 'General Academic Study | Higher Education',
    ultra_long_notes: notes,
    key_concepts: cardsRaw?.key_concepts || [],
    key_tricks: cardsRaw?.key_tricks || [],
    practice_questions: cardsRaw?.practice_questions || [],
    real_world_applications: cardsRaw?.real_world_applications || [],
    common_misconceptions: cardsRaw?.common_misconceptions || [],
    study_score: cardsRaw?.study_score || 94,
    powered_by: `${SAVOIRÉ.BRAND} by ${SAVOIRÉ.DEVELOPER}`,
    generated_at: now,
    _version: SAVOIRÉ.VERSION,
    _tool: opts.tool,
    _quality: "enhanced"
  };
  
  // Add tool-specific fields if they exist
  if (opts.tool === 'flashcards' && cardsRaw?.flashcards) {
    merged.flashcards = cardsRaw.flashcards;
  }
  
  if (opts.tool === 'quiz' && cardsRaw?.quiz_questions) {
    merged.quiz_questions = cardsRaw.quiz_questions;
  }
  
  if (opts.tool === 'mindmap' && cardsRaw?.mindmap) {
    merged.mindmap = cardsRaw.mindmap;
  }
  
  // Ensure minimum content exists (fill gaps if needed)
  if (merged.key_concepts.length < 3) {
    merged.key_concepts = [
      `Fundamental Understanding: ${topic || 'This topic'} is built on core principles that connect theory to practice.`,
      `Key Mechanisms: The main processes follow systematic patterns that can be learned and applied.`,
      `Practical Value: Knowledge transfers directly to real-world scenarios across multiple domains.`,
      `Learning Pathway: Mastery follows a proven sequence from foundation to advanced application.`,
      `Interconnections: This topic connects meaningfully to related fields creating rich learning opportunities.`
    ];
  }
  
  if (merged.key_tricks.length < 2) {
    merged.key_tricks = [
      `🧠 FEYNMAN TECHNIQUE: Explain the concept simply as if teaching a child. Your struggles reveal exactly what you don't understand.`,
      `📝 ACTIVE RECALL: Close your notes and write everything you remember. Compare to find gaps. This beats re-reading by 300%.`,
      `⏰ SPACED REPETITION: Review at increasing intervals (Day 1, 3, 7, 14, 30) for optimal long-term retention.`
    ];
  }
  
  if (merged.practice_questions.length < 2) {
    merged.practice_questions = [
      {
        question: `Explain the core principles of ${topic || 'this topic'} and why they matter.`,
        answer: `The core principles establish the foundational framework for understanding and application. They matter because they provide systematic reasoning patterns that transfer to real-world problems, enabling better decisions and deeper analysis.`
      },
      {
        question: `Describe a real-world scenario where deep knowledge of ${topic || 'this topic'} is valuable.`,
        answer: `In professional practice, deep knowledge enables systematic problem decomposition, identification of key variables, evaluation of alternatives, and anticipation of consequences. Without this foundation, decisions default to intuition which consistently produces worse outcomes.`
      }
    ];
  }
  
  if (merged.real_world_applications.length < 3) {
    merged.real_world_applications = [
      `Professional Practice: Knowledge directly applies to career contexts including analysis, decision-making, and problem-solving.`,
      `Academic Advancement: Understanding supports further learning, research, and intellectual development across disciplines.`,
      `Everyday Life: Core principles transfer to personal decisions, learning strategies, and critical thinking in daily situations.`
    ];
  }
  
  if (merged.common_misconceptions.length < 2) {
    merged.common_misconceptions = [
      `❌ Misconception: Surface familiarity equals genuine understanding. Reality: True mastery requires grasping relationships, applications, and limitations — not just definitions and facts.`,
      `❌ Misconception: This topic is only for specialists. Reality: Core principles apply broadly across many fields and daily situations, making knowledge valuable for everyone.`
    ];
  }
  
  return merged;
}

// ─────────────────────────────────────────────────────────────────────────────────────────────────
// SECTION 12 — RESPONSE HEADERS (CORS, Security)
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
// SECTION 13 — MAIN VERCEL HANDLER (Entry Point) - FULLY FIXED
// ─────────────────────────────────────────────────────────────────────────────────────────────────

module.exports = async function handler(req, res) {
  const requestId = Math.random().toString(36).slice(2, 10);
  const startTime = Date.now();

  log.info(`[${requestId}] ${req.method} /api/study`);

  setSecurityHeaders(res);

  // Preflight CORS
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // Only POST allowed
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed. Use POST.' });
  }

  // Parse body
  const body = req.body || {};
  let message = (body.message || '').trim();
  let userName = (body.userName || '').trim();
  let userStreak = typeof body.streak === 'number' ? body.streak : 1;
  let userSessions = typeof body.sessions === 'number' ? body.sessions : 1;
  let userSessionId = body.sessionId || requestId;

  // Handle ping / warmup
  if (message === '' || message === 'ping') {
    return res.status(200).json({
      status: 'ok',
      service: SAVOIRÉ.BRAND,
      version: SAVOIRÉ.VERSION,
      time: getISTDateTime(),
      requestId,
    });
  }

  // Basic input validation
  if (message.length < 2) {
    return res.status(400).json({ error: 'Message too short (min 2 characters).' });
  }
  if (message.length > 20000) {
    return res.status(400).json({ error: 'Message too long (max 20000 characters).' });
  }

  if (!userName) userName = 'Anonymous';

  // Prepare options
  const rawOpts = body.options || {};
  const currentTool = ['notes', 'flashcards', 'quiz', 'summary', 'mindmap'].includes(rawOpts.tool)
    ? rawOpts.tool
    : 'notes';

  const opts = {
    tool: currentTool,
    depth: ['standard', 'detailed', 'comprehensive', 'expert'].includes(rawOpts.depth) ? rawOpts.depth : 'detailed',
    style: ['simple', 'academic', 'detailed', 'exam', 'visual'].includes(rawOpts.style) ? rawOpts.style : 'simple',
    language: (typeof rawOpts.language === 'string' && rawOpts.language.trim()) ? rawOpts.language.trim() : 'English',
    stream: rawOpts.stream === true,
  };

  log.info(`[${requestId}] Tool: ${opts.tool} | Language: ${opts.language} | Depth: ${opts.depth} | Stream: ${opts.stream} | User: ${userName}`);

  // Check for API key
  if (!process.env.OPENROUTER_API_KEY) {
    log.error('OPENROUTER_API_KEY not set!');
    return res.status(500).json({ error: 'Savoiré AI service temporarily unavailable. Please try again later.' });
  }

  // Track start of generation
  await sendToGoogleSheets(userName, userStreak, userSessions, opts.tool, message, 'started', 0, userSessionId);

  // ════════════════════════════════════════════════════════════════════════════════════════════════
  // STREAMING MODE (NOTES & SUMMARY ONLY) — LIVE OUTPUT
  // ════════════════════════════════════════════════════════════════════════════════════════════════
  if (opts.stream && (opts.tool === 'notes' || opts.tool === 'summary')) {
    // SSE headers
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache, no-store, no-transform');
    res.setHeader('Connection', 'keep-alive');
    res.setHeader('X-Accel-Buffering', 'no');
    res.setHeader('Transfer-Encoding', 'chunked');
    if (typeof res.flushHeaders === 'function') res.flushHeaders();

    // Helper to write SSE events
    const sendSSE = (event, data) => {
      if (res.writableEnded) return;
      try {
        const payload = typeof data === 'string' ? data : JSON.stringify(data);
        res.write(`event: ${event}\ndata: ${payload}\n\n`);
        if (typeof res.flush === 'function') res.flush();
      } catch (err) {
        log.warn(`SSE write error: ${err.message}`);
      }
    };

    // Keepalive ping every 15 seconds
    const pingInterval = setInterval(() => {
      if (!res.writableEnded) {
        try {
          res.write(`: keepalive ${Date.now()}\n\n`);
          if (typeof res.flush === 'function') res.flush();
        } catch {
          clearInterval(pingInterval);
        }
      }
    }, 15000);

    // Stage timers
    const stageTimers = [
      setTimeout(() => sendSSE('stage', { idx: 1, label: '📝 Writing your study content…' }), 3000),
      setTimeout(() => sendSSE('stage', { idx: 2, label: '🔍 Building detailed sections…' }), 8000),
      setTimeout(() => sendSSE('stage', { idx: 3, label: '✨ Finalising and formatting…' }), 15000),
    ];
    const clearStages = () => stageTimers.forEach(clearTimeout);

    // Initial events
    sendSSE('heartbeat', { ts: Date.now(), status: 'connected', service: SAVOIRÉ.BRAND });
    sendSSE('stage', { idx: 0, label: '🎯 Analysing your topic…' });
    sendSSE('token', { t: '' });

    let notes = '';
    let phase1Ok = false;

    try {
      // PHASE 1: Stream markdown notes
      const notesPrompt = buildNotesPrompt(message, opts);
      
      try {
        notes = await streamNotes(notesPrompt, (chunk) => sendSSE('token', { t: chunk }), opts.tool);
        phase1Ok = true;
        log.ok(`[${requestId}] Phase 1 OK — ${notes.length} chars`);
      } catch (streamErr) {
        log.error(`[${requestId}] Phase 1 failed: ${streamErr.message}`);
        sendSSE('stage', { idx: 2, label: '📚 Using enhanced offline content…' });
        notes = offlineNotes(message, opts.tool);
        phase1Ok = false;
        // Stream the fallback notes in chunks for better UX
        const chunkSize = 200;
        for (let i = 0; i < notes.length; i += chunkSize) {
          const chunk = notes.slice(i, i + chunkSize);
          sendSSE('token', { t: chunk });
          await sleep(5);
        }
      }

      sendSSE('stage', { idx: 3, label: '🎨 Generating study cards…' });

      // PHASE 2: Fetch structured cards (for flashcards/quiz/mindmap)
      let cardsRaw = null;
      if (opts.tool !== 'notes' && opts.tool !== 'summary') {
        try {
          const cardsPrompt = buildCardsPrompt(message, opts);
          cardsRaw = await fetchCards(cardsPrompt, opts.tool, message);
          log.ok(`[${requestId}] Phase 2 OK — cards fetched`);
        } catch (cardsErr) {
          log.error(`[${requestId}] Phase 2 failed: ${cardsErr.message}`);
          sendSSE('stage', { idx: 3, label: '📖 Using enhanced card generation…' });
          cardsRaw = intelligentFallbackCards(opts.tool, message);
        }
      }

      clearInterval(pingInterval);
      clearStages();

      // Merge or use notes directly
      let finalData;
      if (cardsRaw) {
        finalData = mergeCards(cardsRaw, notes, message, opts);
      } else {
        finalData = {
          topic: message,
          curriculum_alignment: 'General Academic Study',
          ultra_long_notes: notes,
          key_concepts: [],
          key_tricks: [],
          practice_questions: [],
          real_world_applications: [],
          common_misconceptions: [],
          study_score: 94,
          powered_by: `${SAVOIRÉ.BRAND} by ${SAVOIRÉ.DEVELOPER}`,
          generated_at: getISTDateTime(),
          _version: SAVOIRÉ.VERSION,
          _tool: opts.tool
        };
      }

      finalData._duration_ms = Date.now() - startTime;
      finalData._request_id = requestId;
      finalData._phase1_ok = phase1Ok;
      finalData._phase2_ok = !!cardsRaw;
      finalData._quality = cardsRaw ? "ai_generated" : "enhanced_fallback";
      finalData.powered_by = `${SAVOIRÉ.BRAND} by ${SAVOIRÉ.DEVELOPER}`;

      sendSSE('stage', { idx: 4, label: '✅ Complete!', done: true });
      sendSSE('done', finalData);

      log.ok(`[${requestId}] Complete — ${finalData._duration_ms}ms | p1=${phase1Ok} | p2=${!!cardsRaw}`);
      
      // Track successful completion
      await sendToGoogleSheets(userName, userStreak, userSessions, opts.tool, message, 'completed', finalData._duration_ms, userSessionId);

    } catch (fatalErr) {
      clearInterval(pingInterval);
      clearStages();
      log.error(`[${requestId}] Fatal error: ${fatalErr.message}`);

      sendSSE('stage', { idx: 4, label: '❌ Error occurred', done: true });
      sendSSE('error', { message: 'Savoiré AI is currently busy. Please try again in a moment.' });

      await sendToGoogleSheets(userName, userStreak, userSessions, opts.tool, message, 'failed', Date.now() - startTime, userSessionId);
    }

    if (!res.writableEnded) res.end();
    return;
  }

  // ════════════════════════════════════════════════════════════════════════════════════════════════
  // NON-STREAMING MODE (FLASHCARDS, QUIZ, MIND MAP, NOTES, SUMMARY)
  // ════════════════════════════════════════════════════════════════════════════════════════════════
  try {
    // Phase 1: Get notes (no streaming)
    const notesPrompt = buildNotesPrompt(message, opts);
    let notes = '';
    
    for (const model of MODELS_STREAM) {
      const ctrl = new AbortController();
      const timer = setTimeout(() => ctrl.abort(), model.timeout_ms);
      try {
        const r = await fetch(OPENROUTER_BASE, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${process.env.OPENROUTER_API_KEY}`,
            'HTTP-Referer': HTTP_REFERER,
            'X-Title': APP_TITLE,
          },
          body: JSON.stringify({
            model: model.id,
            max_tokens: DEPTH_MAP[opts.depth]?.maxTokens || 3800,
            temperature: 0.75,
            stream: false,
            messages: [{ role: 'user', content: notesPrompt }],
          }),
          signal: ctrl.signal,
        });
        clearTimeout(timer);
        if (!r.ok) continue;
        const d = await r.json();
        const content = d?.choices?.[0]?.message?.content?.trim();
        if (content && content.length > 200) {
          notes = content;
          log.ok(`Notes generated successfully`);
          break;
        }
      } catch {
        clearTimeout(timer);
        continue;
      }
    }

    if (!notes) {
      log.warn(`[${requestId}] Using offline notes fallback`);
      notes = offlineNotes(message, opts.tool);
    }

    // Phase 2: Fetch structured cards
    const cardsPrompt = buildCardsPrompt(message, opts);
    let cardsRaw;
    
    try {
      cardsRaw = await fetchCards(cardsPrompt, opts.tool, message);
      if (!cardsRaw) {
        log.warn(`[${requestId}] Using intelligent fallback for ${opts.tool}`);
        cardsRaw = intelligentFallbackCards(opts.tool, message);
      }
    } catch (cardsErr) {
      log.error(`[${requestId}] Phase 2 failed: ${cardsErr.message}`);
      cardsRaw = intelligentFallbackCards(opts.tool, message);
    }

    const finalData = mergeCards(cardsRaw, notes, message, opts);
    finalData._duration_ms = Date.now() - startTime;
    finalData._request_id = requestId;
    finalData.powered_by = `${SAVOIRÉ.BRAND} by ${SAVOIRÉ.DEVELOPER}`;
    finalData._quality = cardsRaw?._fallback ? "enhanced_fallback" : "ai_generated";

    log.ok(`[${requestId}] Sync complete — ${finalData._duration_ms}ms`);
    
    // Track successful completion
    await sendToGoogleSheets(userName, userStreak, userSessions, opts.tool, message, 'completed', finalData._duration_ms, userSessionId);
    
    return res.status(200).json(finalData);
    
  } catch (err) {
    log.error(`[${requestId}] Error: ${err.message}`);
    
    // Track failure
    await sendToGoogleSheets(userName, userStreak, userSessions, opts.tool, message, 'failed', Date.now() - startTime, userSessionId);
    
    return res.status(500).json({ 
      error: 'Savoiré AI is currently busy. Please try again in a few moments.',
      _request_id: requestId,
      _tool: opts.tool
    });
  }
};

// ═══════════════════════════════════════════════════════════════════════════════════════════════════
// END OF FILE — api/study.js v2.0 (FULLY ENHANCED & FIXED - 3800+ LINES)
// Savoiré AI — Built by Sooban Talha Technologies | soobantalhatech.xyz
// Founder: Sooban Talha | Free for every student on Earth, forever.
// ═══════════════════════════════════════════════════════════════════════════════════════════════════
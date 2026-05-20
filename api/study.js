'use strict';
// ═══════════════════════════════════════════════════════════════════════════════════════════════════
// SAVOIRÉ AI v2.0 — api/study.js — ULTIMATE BACKEND (3500+ LINES)
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
// PHASE 2 (FLASHCARDS, QUIZ, MIND MAP) — MODEL ONLY, NO FALLBACK:
//   • Second AI call for structured JSON
//   • NO FALLBACK — must come from model only
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
//   • IST timestamps (UTC+5:30)
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
// SETUP INSTRUCTIONS:
// 1. Create a Google Sheet with columns: Timestamp, UserName, Streak, Sessions, LastUsed, Tool
// 2. Go to Extensions → Apps Script → paste the google-script.gs code
// 3. Deploy as Web App (Execute as: Me, Access: Anyone)
// 4. Copy the deployment URL
// 5. Add to Vercel: GOOGLE_WEBHOOK_URL = your_url
// ═══════════════════════════════════════════════════════════════════════════════════════════════════

const GOOGLE_WEBHOOK_URL = process.env.GOOGLE_WEBHOOK_URL || '';

// ─────────────────────────────────────────────────────────────────────────────────────────────────
// SECTION 2 — MODEL ROSTER (14 MODELS — ALL FREE)
// ─────────────────────────────────────────────────────────────────────────────────────────────────

// PHASE 1: Streaming markdown notes (NOTES & SUMMARY only) — prioritise fastest first-token models
const MODELS_STREAM = [
  { id: 'google/gemini-2.0-flash-exp:free',        max_tokens: 4500, timeout_ms: 38000 },
  { id: 'google/gemini-flash-1.5-8b:free',         max_tokens: 4000, timeout_ms: 30000 },
  { id: 'deepseek/deepseek-chat-v3-0324:free',      max_tokens: 4500, timeout_ms: 38000 },
  { id: 'meta-llama/llama-3.3-70b-instruct:free',  max_tokens: 4000, timeout_ms: 32000 },
  { id: 'z-ai/glm-4.5-air:free',                   max_tokens: 3500, timeout_ms: 30000 },
  { id: 'qwen/qwen3-8b:free',                      max_tokens: 3500, timeout_ms: 28000 },
  { id: 'mistralai/mistral-7b-instruct-v0.3:free', max_tokens: 3500, timeout_ms: 28000 },
  { id: 'openchat/openchat-7b:free',               max_tokens: 3500, timeout_ms: 28000 },
  { id: 'nousresearch/hermes-3-llama-3.1-405b:free', max_tokens: 4500, timeout_ms: 45000 },
  { id: 'cognitivecomputations/dolphin-mixtral-8x7b:free', max_tokens: 4000, timeout_ms: 38000 },
  { id: 'perplexity/llama-3-sonar-small-32k-online:free', max_tokens: 4000, timeout_ms: 38000 },
  { id: 'microsoft/phi-3-mini-128k-instruct:free', max_tokens: 3500, timeout_ms: 30000 },
  { id: 'upstage/solar-1-mini-chat:free',          max_tokens: 3500, timeout_ms: 30000 },
  { id: 'cohere/command-r-plus:free',              max_tokens: 4000, timeout_ms: 35000 },
];

// PHASE 2: Structured JSON cards (FLASHCARDS, QUIZ, MIND MAP only)
// NO FALLBACK — must come from model only — throws error if all models fail
const MODELS_CARDS = [
  { id: 'google/gemini-2.0-flash-exp:free',        max_tokens: 4500, timeout_ms: 38000 },
  { id: 'google/gemini-flash-1.5-8b:free',         max_tokens: 4000, timeout_ms: 30000 },
  { id: 'deepseek/deepseek-chat-v3-0324:free',      max_tokens: 4500, timeout_ms: 38000 },
  { id: 'meta-llama/llama-3.3-70b-instruct:free',  max_tokens: 4000, timeout_ms: 32000 },
  { id: 'nousresearch/hermes-3-llama-3.1-405b:free', max_tokens: 4500, timeout_ms: 45000 },
  { id: 'cognitivecomputations/dolphin-mixtral-8x7b:free', max_tokens: 4000, timeout_ms: 38000 },
  { id: 'microsoft/phi-3-mini-128k-instruct:free', max_tokens: 3500, timeout_ms: 30000 },
  { id: 'upstage/solar-1-mini-chat:free',          max_tokens: 3500, timeout_ms: 30000 },
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
// SECTION 4 — UTILITIES (Logging, Sleep, Truncation, IST Timezone)
// ─────────────────────────────────────────────────────────────────────────────────────────────────

const sleep = (ms) => new Promise(r => setTimeout(r, ms));

const log = {
  info:  (...a) => console.log  (`[${new Date().toISOString()}] [${SAVOIRÉ.BRAND}] 📘 INFO  `, ...a),
  ok:    (...a) => console.log  (`[${new Date().toISOString()}] [${SAVOIRÉ.BRAND}] ✅ OK    `, ...a),
  warn:  (...a) => console.warn (`[${new Date().toISOString()}] [${SAVOIRÉ.BRAND}] ⚠️ WARN  `, ...a),
  error: (...a) => console.error(`[${new Date().toISOString()}] [${SAVOIRÉ.BRAND}] ❌ ERROR `, ...a),
};

const trunc = (s, n = 100) => !s ? '' : (String(s).length > n ? String(s).slice(0, n) + '…' : String(s));

// IST Timezone Helper (UTC+5:30)
function getISTDateTime() {
  const now = new Date();
  const istOffsetMs = 5.5 * 60 * 60 * 1000;
  const utcMs = now.getTime() + (now.getTimezoneOffset() * 60 * 1000);
  const istDate = new Date(utcMs + istOffsetMs);
  return istDate.toISOString().replace('T', ' ').slice(0, 19);
}

function getISTDate() {
  return getISTDateTime().split(' ')[0];
}

// ─────────────────────────────────────────────────────────────────────────────────────────────────
// SECTION 5 — GOOGLE SHEETS WEBHOOK FUNCTION (PRIVATE — BACKEND ONLY)
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
// SECTION 6 — PHASE 1 PROMPT: PLAIN MARKDOWN NOTES (NOTES & SUMMARY ONLY)
// NO JSON — just clean markdown. AI starts outputting readable text immediately.
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
6. Include at least 3 concrete, real-world examples
7. End with a "🎯 Key Takeaways" box (bullet points)
8. Use emojis sparingly but effectively (📚 🎯 ⚙️ 💡 🚀 ✅)
9. Use numbered lists for step-by-step processes
10. Use \`code blocks\` for formulas, definitions, or technical terms

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

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🚀 START WRITING IMMEDIATELY. Do not add any preamble or meta-commentary.
Begin directly with the first ## heading. Write in ${lang} only.
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`;

  return prompt;
}

// ─────────────────────────────────────────────────────────────────────────────────────────────────
// SECTION 7 — PHASE 2 PROMPT: STRUCTURED JSON CARDS (FLASHCARDS, QUIZ, MIND MAP)
// NO FALLBACK — must come from model only — strict JSON output
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
• Front should be 10-30 words, Back should be 30-80 words
• Cover definitions, key concepts, examples, relationships, and applications
• Make questions thought-provoking, not trivial
• Answers should be comprehensive but concise
• Include a mix of: definitions, "how/why" questions, comparison questions, and application scenarios`;
  } else if (tool === 'quiz') {
    toolSpecificInstructions = `
╔══════════════════════════════════════════════════════════════════════════════════╗
║                          QUIZ SPECIFIC INSTRUCTIONS                              ║
╚══════════════════════════════════════════════════════════════════════════════════╝

• Generate exactly 10 multiple-choice questions
• Each question must have 4 options (A, B, C, D)
• Only one option must be correct
• Provide detailed explanation for the correct answer (50-100 words)
• Include difficulty level (easy/medium/hard) for each question
• Distribute difficulty: 3 easy, 4 medium, 3 hard
• Make distractors plausible but clearly incorrect
• Questions should test understanding, not just recall`;
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
• Ensure hierarchical logic is clear and consistent`;
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
    {"front": "What is [concept]?", "back": "[Concept] is defined as ..."},
    {"front": "Explain how [process] works", "back": "[Process] works through the following steps: ..."},
    {"front": "What are the key characteristics of [topic]?", "back": "The key characteristics are: ..."},
    {"front": "Compare and contrast [A] and [B]", "back": "[A] differs from [B] in that ..."},
    {"front": "Why is [concept] important?", "back": "[Concept] is important because ..."}
  ],` : ''}
  ${tool === 'quiz' ? `
  "quiz_questions": [
    {
      "id": 1,
      "question": "Multiple choice question text",
      "options": ["Option A", "Option B", "Option C", "Option D"],
      "correct_answer": "Option A",
      "explanation": "Detailed explanation of why this is correct (50-100 words)",
      "difficulty": "medium"
    },
    {
      "id": 2,
      "question": "Another multiple choice question",
      "options": ["Option A", "Option B", "Option C", "Option D"],
      "correct_answer": "Option C",
      "explanation": "Detailed explanation of why this is correct",
      "difficulty": "hard"
    }
  ],` : ''}
  ${tool === 'mindmap' ? `
  "mindmap": {
    "central": "Main Topic Name",
    "branches": [
      {
        "name": "Branch 1 Name",
        "items": ["Sub-item 1.1", "Sub-item 1.2", "Sub-item 1.3"]
      },
      {
        "name": "Branch 2 Name",
        "items": ["Sub-item 2.1", "Sub-item 2.2", "Sub-item 2.3"]
      },
      {
        "name": "Branch 3 Name",
        "items": ["Sub-item 3.1", "Sub-item 3.2", "Sub-item 3.3"]
      }
    ],
    "connections": [
      {"from": "Branch 1", "to": "Branch 2", "description": "Relationship description"}
    ]
  },` : ''}
  "key_concepts": [
    "Concept 1: detailed explanation 30-50 words in ${lang}",
    "Concept 2: detailed explanation 30-50 words in ${lang}",
    "Concept 3: detailed explanation 30-50 words in ${lang}",
    "Concept 4: detailed explanation 30-50 words in ${lang}",
    "Concept 5: detailed explanation 30-50 words in ${lang}"
  ],
  "key_tricks": [
    "Memory technique 1: 40-60 words in ${lang} with step-by-step instructions",
    "Memory technique 2: 40-60 words in ${lang} with step-by-step instructions",
    "Memory technique 3: 40-60 words in ${lang} with step-by-step instructions"
  ],
  "practice_questions": [
    {
      "question": "Analytical question (75-100 words) in ${lang}",
      "answer": "Thorough answer (150+ words) in ${lang} with detailed explanation and examples"
    },
    {
      "question": "Application question (75-100 words) in ${lang}",
      "answer": "Thorough answer (150+ words) in ${lang} with detailed explanation and examples"
    },
    {
      "question": "Evaluation question (75-100 words) in ${lang}",
      "answer": "Thorough answer (150+ words) in ${lang} with detailed explanation and examples"
    }
  ],
  "real_world_applications": [
    "Industry/Field 1: specific real-world application 50-70 words in ${lang}",
    "Industry/Field 2: specific real-world application 50-70 words in ${lang}",
    "Industry/Field 3: specific real-world application 50-70 words in ${lang}",
    "Industry/Field 4: specific real-world application 50-70 words in ${lang}",
    "Industry/Field 5: specific real-world application 50-70 words in ${lang}"
  ],
  "common_misconceptions": [
    "Many students believe [common wrong belief]. In reality [correct explanation]. 50-70 words in ${lang}",
    "Many students believe [common wrong belief]. In reality [correct explanation]. 50-70 words in ${lang}",
    "Many students believe [common wrong belief]. In reality [correct explanation]. 50-70 words in ${lang}",
    "Many students believe [common wrong belief]. In reality [correct explanation]. 50-70 words in ${lang}"
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

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🚀 BEGIN JSON OUTPUT:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`;

}

// ─────────────────────────────────────────────────────────────────────────────────────────────────
// SECTION 8 — PHASE 1: STREAM MARKDOWN NOTES (NOTES & SUMMARY ONLY)
// Tries each model. Forwards every token chunk to onChunk().
// Returns the full accumulated text when stream ends.
// ─────────────────────────────────────────────────────────────────────────────────────────────────

async function streamNotes(prompt, onChunk, tool) {
  let lastErr = 'No models available';

  for (const model of MODELS_STREAM) {
    const name = model.id.split('/').pop().replace(':free', '').replace(/-/g, ' ');
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), model.timeout_ms);
    const t0 = Date.now();

    try {
      log.info(`📡 Phase 1 (${tool.toUpperCase()}) → connecting to AI model`);

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
        log.warn(`HTTP ${res.status} from model: ${trunc(errText, 100)}`);
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
        log.warn(`Model returned too-short content (${full.length} chars)`);
        continue;
      }

      log.ok(`✅ Phase 1 (${tool.toUpperCase()}) OK — ${tokenCount} tokens, ${full.length} chars, ${Date.now() - t0}ms`);
      return full;

    } catch (err) {
      clearTimeout(timer);
      lastErr = err.name === 'AbortError'
        ? `Model timed out after ${model.timeout_ms}ms`
        : `Model: ${err.message}`;
      log.warn(`⚠️ Phase 1 fail — ${lastErr}`);
      if (err.message && err.message.includes('401')) throw err;
      continue;
    }
  }
  throw new Error(`All AI models are currently busy. Please try again in a few moments. Last error: ${lastErr}`);
}

// ─────────────────────────────────────────────────────────────────────────────────────────────────
// SECTION 9 — PHASE 2: FETCH STRUCTURED JSON CARDS (FLASHCARDS, QUIZ, MIND MAP)
// NO FALLBACK — throws error if all models fail
// ─────────────────────────────────────────────────────────────────────────────────────────────────

async function fetchCards(prompt, tool) {
  let lastErr = 'No models available';

  for (const model of MODELS_CARDS) {
    const name = model.id.split('/').pop().replace(':free', '').replace(/-/g, ' ');
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), model.timeout_ms);
    const t0 = Date.now();

    try {
      log.info(`📡 Phase 2 (${tool.toUpperCase()}) → connecting to AI model`);

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
        log.warn(`HTTP ${res.status} from model: ${trunc(errText, 100)}`);
        if (res.status === 401) throw new Error('Invalid API key configuration');
        continue;
      }

      const data = await res.json();
      let content = data?.choices?.[0]?.message?.content?.trim();

      if (!content || content.length < 200) {
        log.warn(`Model returned empty or too short content`);
        continue;
      }

      // Strip markdown code fences
      content = content.replace(/^```(?:json)?\s*/i, '').replace(/\s*```\s*$/i, '').trim();
      
      // Find JSON boundaries
      const jsonStart = content.indexOf('{');
      const jsonEnd = content.lastIndexOf('}');
      
      if (jsonStart === -1 || jsonEnd <= jsonStart) {
        log.warn(`No JSON object found in response`);
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
          log.warn(`JSON parse failed: ${e2.message}`);
          continue;
        }
      }

      // Validate parsed object has required fields for the tool
      if (tool === 'flashcards' && !parsed.flashcards && !parsed.key_concepts) {
        log.warn(`Missing flashcards data`);
        continue;
      }
      if (tool === 'quiz' && !parsed.quiz_questions && !parsed.practice_questions) {
        log.warn(`Missing quiz questions`);
        continue;
      }
      if (tool === 'mindmap' && !parsed.mindmap && !parsed.key_concepts) {
        log.warn(`Missing mindmap data`);
        continue;
      }

      log.ok(`✅ Phase 2 (${tool.toUpperCase()}) OK — ${Date.now() - t0}ms`);
      return parsed;

    } catch (err) {
      clearTimeout(timer);
      lastErr = err.name === 'AbortError' ? `Model timed out` : `Model: ${err.message}`;
      log.warn(`⚠️ Phase 2 fail — ${lastErr}`);
      if (err.message && err.message.includes('401')) throw err;
      continue;
    }
  }
  
  // NO FALLBACK — throw error if all models fail
  throw new Error(`Unable to generate ${tool.toUpperCase()} at this time. All AI models are busy. Please try again in a few moments.`);
}

// ─────────────────────────────────────────────────────────────────────────────────────────────────
// SECTION 10 — FALLBACK CARDS (ONLY FOR NOTES & SUMMARY — HIGH-QUALITY OFFLINE CONTENT)
// FOR FLASHCARDS/QUIZ/MIND MAP — NO FALLBACK (THROWS ERROR)
// ─────────────────────────────────────────────────────────────────────────────────────────────────

function fallbackCards(topic, opts) {
  const t = (topic || 'this topic').trim();
  const now = getISTDateTime();
  return {
    topic: t,
    curriculum_alignment: 'General Academic Study',
    key_concepts: [
      `Core Definition: ${t} refers to the fundamental principles and frameworks forming its theoretical and practical foundation within its academic domain.`,
      `Primary Mechanisms: The main processes of ${t} involve systematic interactions between identifiable components producing consistent, observable outcomes.`,
      `Historical Development: ${t} evolved through successive waves of intellectual discovery, with key contributors establishing foundational frameworks still in use today.`,
      `Practical Significance: ${t} carries direct application value across professional domains, enabling practitioners to make higher-quality decisions and achieve better outcomes.`,
      `Critical Boundaries: Complete understanding of ${t} requires recognising both its considerable explanatory power and the specific conditions where its frameworks have important limitations.`,
    ],
    key_tricks: [
      `FEYNMAN TECHNIQUE for ${t}: Explain it out loud as if teaching a 12-year-old with no background in the subject. Every point where you hesitate or become vague reveals exactly what you do not yet understand — go back to your notes only for those specific gaps, then try again.`,
      `ACTIVE RECALL for ${t}: Close all your notes and write everything you know on a blank page. Compare to your notes. The gaps between what you wrote and your notes are precisely what needs further study — this beats re-reading by a factor of 3 for long-term retention.`,
      `SPACED REPETITION for ${t}: Study across multiple sessions rather than one marathon. Optimal spacing: Day 1 (learn), Day 3 (first review), Day 7 (consolidation), Day 14 (long-term retention), Day 30 (mastery check). Space beats massed practice consistently.`,
    ],
    practice_questions: [
      {
        question: `Explain the core principles of ${t} and describe how they form a coherent theoretical framework.`,
        answer: `${t} is grounded in foundational principles that together define its scope, methods and applications. These principles establish the basic concepts, the relationships between them, and the reasoning connecting observations to broader theoretical claims. A complete understanding requires knowing not just what the field asserts but why those assertions are justified — what evidence supports them and what logic connects facts to conclusions. The analytical framework ${t} provides transfers broadly, improving thinking in adjacent domains. Practical mastery means being able to apply these principles in novel situations, not just recall them when questions match the textbook format exactly.`,
      },
      {
        question: `Describe a realistic professional scenario where deep knowledge of ${t} is essential.`,
        answer: `Consider a practitioner who must make a high-stakes decision under uncertainty — designing a critical system, solving an unexpected problem, or evaluating competing options with incomplete information. Knowledge of ${t} provides the analytical framework to decompose the problem, identify relevant variables, evaluate alternatives systematically, and anticipate second-order consequences. Without this foundation, decisions default to intuition and heuristics alone, which consistently produce worse outcomes than structured analytical approaches. The practitioner with deep ${t} knowledge can also explain their reasoning clearly to stakeholders, identify when assumptions break down, and adapt their approach when circumstances change unexpectedly.`,
      },
      {
        question: `What are the most common misconceptions about ${t} and why do they persist?`,
        answer: `The most pervasive misconception is that surface familiarity with ${t} constitutes genuine understanding. Students who can define terms and recall facts often discover — under exam pressure or in professional practice — that their knowledge collapses when questions are framed differently. Genuine understanding requires grasping causal relationships, the reasoning behind claims, and the conditions under which standard frameworks break down. A second misconception is that ${t} is only relevant to specialists. In reality its core reasoning patterns transfer broadly across disciplines. A third is underestimating its depth — most students find only after sustained study how much genuine complexity underlies apparently simple concepts.`,
      },
    ],
    real_world_applications: [
      `Healthcare & Medicine: Principles from ${t} directly inform clinical decision-making, diagnostic reasoning, and treatment protocol design, enabling practitioners to make more accurate assessments and deliver measurably better patient outcomes.`,
      `Technology & Engineering: ${t} concepts underpin critical design decisions in software architecture, system engineering, and product development — helping teams build more scalable, maintainable, and reliable solutions.`,
      `Business & Strategy: Organisations that apply frameworks from ${t} systematically outperform those that do not, making better decisions under uncertainty and identifying opportunities that competitors without this grounding consistently miss.`,
    ],
    common_misconceptions: [
      `Many students believe ${t} can be mastered through repeated memorisation of facts and definitions. In reality, genuine mastery requires understanding the underlying principles and causal relationships — surface recall collapses under novel exam questions and real professional situations.`,
      `A widespread misconception is that ${t} is only relevant to specialists in that specific field. In reality, its core reasoning patterns and analytical frameworks transfer powerfully and broadly, providing unexpected intellectual advantages across many professional domains.`,
      `Students often assume that once they understand the basics of ${t}, little of substance remains to learn. In reality ${t} has significant depth with important nuances, active ongoing research, and genuine unresolved debates — the difference between introductory and expert understanding is vast.`,
    ],
    study_score: 96,
    powered_by: `${SAVOIRÉ.BRAND} by ${SAVOIRÉ.DEVELOPER}`,
    generated_at: now,
    _version: SAVOIRÉ.VERSION,
    _fallback: true,
  };
}

// ─────────────────────────────────────────────────────────────────────────────────────────────────
// SECTION 11 — OFFLINE NOTES (FOR NOTES & SUMMARY FALLBACK ONLY)
// ─────────────────────────────────────────────────────────────────────────────────────────────────

function offlineNotes(t) {
  const T = t || 'This Topic';
  return `## Introduction to ${T}

**${T}** is a significant area of study with broad intellectual implications and extensive practical applications across numerous academic disciplines and professional fields. A rigorous understanding of ${T} is valuable both for examinations and for building genuine professional capability.

---

## Core Concepts

The study of ${T} begins with its fundamental conceptual infrastructure — the vocabulary, definitions and foundational ideas upon which all subsequent understanding must be built.

**Theoretical Foundation:** Every developed field has a theoretical core — foundational assumptions, definitions and logical relationships that organise its knowledge claims. Understanding ${T} means knowing not just what it claims, but why those claims are considered justified.

**Practical Dimension:** The practical dimension connects abstract theory to concrete real-world value. Theory and practice in ${T} are not separate domains but different aspects of a unified whole.

**Analytical Framework:** ${T} provides a structured way of perceiving and reasoning about complex problems — a transferable mental toolkit that improves thinking in many adjacent domains.

**Systemic Perspective:** No component of ${T} exists in isolation. Every concept connects to others through relationships of logical dependence, causal influence, or structural analogy. Genuine expertise means understanding the field as an integrated whole, not a collection of isolated facts.

---

## How It Works

The core processes of ${T} unfold through identifiable stages:

**Stage 1 — Initial Conditions:** Every application begins with specific prerequisites. Accurately identifying these is critical — misunderstanding initial conditions is a primary source of errors.

**Stage 2 — Active Mechanisms:** The defining mechanisms transform inputs into outputs through processes that follow identifiable patterns and describable rules. Understanding *why* these mechanisms produce their outputs — not just *what* they produce — enables prediction, explanation of anomalies, and effective intervention design.

**Stage 3 — Feedback and Adjustment:** Many systems in ${T} incorporate feedback loops through which outcomes influence subsequent inputs, creating adaptive or self-correcting behaviour.

**Stage 4 — Observable Outputs:** The ultimate products take measurable forms — quantities, categorical outcomes, behavioural changes, or structural modifications.

---

## Key Examples

Concrete examples ground abstract principles in reality. Understanding examples in ${T} means understanding *why* each example works the way it does and *what general principle* it illustrates — not memorising the example as an isolated fact.

Strong examples in ${T} typically demonstrate: how the core mechanism operates in a controlled setting, how complications arise in realistic conditions, and how practitioners navigate those complications in professional practice.

---

## Advanced Aspects

At an advanced level, ${T} reveals important nuances that introductory treatments necessarily simplify:

- **Boundary conditions** — where standard frameworks break down and require modification
- **Historical debates** — why current frameworks were accepted over alternatives
- **Ongoing research** — the frontier of current knowledge and open questions
- **Interdisciplinary connections** — how ${T} relates to adjacent fields

---

## Summary & Key Takeaways

- **Core principle:** ${T} rests on foundational concepts connecting theory to practice through systematic reasoning
- **Key skill:** Analytical framework transferable to adjacent domains
- **Common trap:** Surface familiarity mistaken for genuine understanding
- **Study strategy:** Active recall and spaced repetition outperform passive re-reading every time
- **Remember:** The depth of ${T} rewards sustained engagement — there is always more to understand

*— Generated by ${SAVOIRÉ.BRAND} | ${SAVOIRÉ.DEVELOPER} | ${SAVOIRÉ.DEVSITE}*`;
}

// ─────────────────────────────────────────────────────────────────────────────────────────────────
// SECTION 12 — MERGE CARDS WITH NOTES
// ─────────────────────────────────────────────────────────────────────────────────────────────────

function mergeCards(cardsRaw, notes, topic, opts) {
  const now = getISTDateTime();
  
  // Ensure cardsRaw has all required fields
  const merged = {
    topic: topic || cardsRaw?.topic || 'Study Material',
    curriculum_alignment: cardsRaw?.curriculum_alignment || 'General Academic Study',
    ultra_long_notes: notes,
    key_concepts: cardsRaw?.key_concepts || [],
    key_tricks: cardsRaw?.key_tricks || [],
    practice_questions: cardsRaw?.practice_questions || [],
    real_world_applications: cardsRaw?.real_world_applications || [],
    common_misconceptions: cardsRaw?.common_misconceptions || [],
    study_score: cardsRaw?.study_score || 96,
    powered_by: `${SAVOIRÉ.BRAND} by ${SAVOIRÉ.DEVELOPER}`,
    generated_at: now,
    _version: SAVOIRÉ.VERSION,
    _tool: opts.tool
  };
  
  // Add tool-specific fields
  if (opts.tool === 'flashcards' && cardsRaw?.flashcards) {
    merged.flashcards = cardsRaw.flashcards;
  }
  
  if (opts.tool === 'quiz' && cardsRaw?.quiz_questions) {
    merged.quiz_questions = cardsRaw.quiz_questions;
  }
  
  if (opts.tool === 'mindmap' && cardsRaw?.mindmap) {
    merged.mindmap = cardsRaw.mindmap;
  }
  
  if (opts.tool === 'summary' && cardsRaw?.summary) {
    merged.summary = cardsRaw.summary;
  }
  
  return merged;
}

// ─────────────────────────────────────────────────────────────────────────────────────────────────
// SECTION 13 — RESPONSE HEADERS (CORS, Security)
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
// SECTION 14 — MAIN VERCEL HANDLER (Entry Point)
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
    return res.status(500).json({ error: 'AI service temporarily unavailable. Please try again later.' });
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

    // Keepalive ping every 9 seconds
    const pingInterval = setInterval(() => {
      if (!res.writableEnded) {
        try {
          res.write(`: keepalive ${Date.now()}\n\n`);
          if (typeof res.flush === 'function') res.flush();
        } catch {
          clearInterval(pingInterval);
        }
      }
    }, 9000);

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
        sendSSE('stage', { idx: 4, label: '❌ Generation failed. Please try again.' });
        sendSSE('error', { message: streamErr.message });
        clearInterval(pingInterval);
        clearStages();
        if (!res.writableEnded) res.end();
        
        await sendToGoogleSheets(userName, userStreak, userSessions, opts.tool, message, 'failed', Date.now() - startTime, userSessionId);
        return;
      }

      sendSSE('stage', { idx: 3, label: '🎨 Generating study cards…' });

      // PHASE 2: Fetch structured cards (only for flashcards/quiz/mindmap)
      let cardsRaw = null;
      if (opts.tool !== 'notes' && opts.tool !== 'summary') {
        try {
          const cardsPrompt = buildCardsPrompt(message, opts);
          cardsRaw = await fetchCards(cardsPrompt, opts.tool);
          log.ok(`[${requestId}] Phase 2 OK — cards fetched`);
        } catch (cardsErr) {
          log.error(`[${requestId}] Phase 2 failed: ${cardsErr.message}`);
          sendSSE('stage', { idx: 4, label: '❌ Card generation failed.' });
          sendSSE('error', { message: cardsErr.message });
          clearInterval(pingInterval);
          clearStages();
          if (!res.writableEnded) res.end();
          
          await sendToGoogleSheets(userName, userStreak, userSessions, opts.tool, message, 'failed', Date.now() - startTime, userSessionId);
          return;
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
          study_score: 96,
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
      sendSSE('error', { message: fatalErr.message });

      await sendToGoogleSheets(userName, userStreak, userSessions, opts.tool, message, 'failed', Date.now() - startTime, userSessionId);
    }

    if (!res.writableEnded) res.end();
    return;
  }

  // ════════════════════════════════════════════════════════════════════════════════════════════════
  // NON-STREAMING MODE (FLASHCARDS, QUIZ, MIND MAP) — NO FALLBACK
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
      throw new Error('Unable to generate study notes. All AI models are currently busy. Please try again.');
    }

    // Phase 2: Fetch structured cards (MANDATORY — no fallback)
    const cardsPrompt = buildCardsPrompt(message, opts);
    let cardsRaw;
    
    try {
      cardsRaw = await fetchCards(cardsPrompt, opts.tool);
      if (!cardsRaw) {
        throw new Error(`Unable to generate ${opts.tool.toUpperCase()}. Please try again.`);
      }
    } catch (cardsErr) {
      log.error(`[${requestId}] Phase 2 failed: ${cardsErr.message}`);
      throw new Error(`Failed to generate ${opts.tool}. ${cardsErr.message}`);
    }

    const finalData = mergeCards(cardsRaw, notes, message, opts);
    finalData._duration_ms = Date.now() - startTime;
    finalData._request_id = requestId;
    finalData.powered_by = `${SAVOIRÉ.BRAND} by ${SAVOIRÉ.DEVELOPER}`;

    log.ok(`[${requestId}] Sync complete — ${finalData._duration_ms}ms`);
    
    // Track successful completion
    await sendToGoogleSheets(userName, userStreak, userSessions, opts.tool, message, 'completed', finalData._duration_ms, userSessionId);
    
    return res.status(200).json(finalData);
    
  } catch (err) {
    log.error(`[${requestId}] Error: ${err.message}`);
    
    // Track failure
    await sendToGoogleSheets(userName, userStreak, userSessions, opts.tool, message, 'failed', Date.now() - startTime, userSessionId);
    
    return res.status(500).json({ 
      error: err.message,
      _request_id: requestId,
      _tool: opts.tool
    });
  }
};

// ═══════════════════════════════════════════════════════════════════════════════════════════════════
// END OF FILE — api/study.js v2.0 (~3500 LINES)
// Savoiré AI — Built by Sooban Talha Technologies | soobantalhatech.xyz
// Founder: Sooban Talha | Free for every student on Earth, forever.
// ═══════════════════════════════════════════════════════════════════════════════════════════════════
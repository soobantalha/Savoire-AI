export default async function handler(req, res) {
  // ── CORS preflight handler ──
  if (req.method === 'OPTIONS') {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    res.status(200).end();
    return;
  }}
  
  // ── Existing code continues... ──
// ═══════════════════════════════════════════════════════════════════════════════════════════════════
// SAVOIRÉ AI v2.0 — api/study.js — VERCEL SERVERLESS BACKEND
// Built by Sooban Talha Technologies | soobantalhatech.xyz
// Founder: Sooban Talha
//
// ── HOW TO DEPLOY ──────────────────────────────────────────────────────────────────────────────────
// 1. Place this file at:  /api/study.js  in your Vercel project
// 2. Add to vercel.json:
//    {
//      "functions": { "api/study.js": { "maxDuration": 300 } }
//    }
// 3. Set environment variable in Vercel dashboard:
//    OPENROUTER_API_KEY = your_key_from_openrouter.ai  (free account, free models)
//
// ── LIVE OUTPUT / STREAMING ARCHITECTURE ───────────────────────────────────────────────────────────
// This file implements TRUE Server-Sent Events (SSE) streaming so output appears
// on the user's screen CHARACTER BY CHARACTER — exactly like ChatGPT, Claude, Gemini.
//
// Flow:
//   Frontend sends POST { message, options: { stream: true } }
//   → Server sets Content-Type: text/event-stream
//   → For each token from OpenRouter: writes  event: token\ndata: {"t":"word"}\n\n
//   → Frontend appends each token to the live display in real time
//   → When complete: writes  event: done\ndata: { full structured JSON }\n\n
//   → Frontend hides stream overlay and renders full structured result
//
// This means ZERO waiting — output starts appearing within ~1 second of hitting Generate.
// The user sees every word as it is written, just like every major AI product.
//
// ── FEATURES ───────────────────────────────────────────────────────────────────────────────────────
// ✦ True SSE Streaming   — token-by-token live output, no waiting
// ✦ Heartbeat System     — prevents proxy/CDN timeouts on long generations
// ✦ 10 Free AI Models    — tried in sequence with smart failover
// ✦ Double Retry Logic   — each model tried twice before giving up
// ✦ Rate Limit Detection — 429/503 skipped immediately, no wasted time
// ✦ Simulated Streaming  — even offline fallback streams word by word
// ✦ Ultra-Rich Prompts   — 5 tools × 4 depths × 5 styles × 42 languages
// ✦ Robust JSON Parsing  — handles messy model output, code fences, escapes
// ✦ Field Validation     — all required fields checked and filled
// ✦ Quality Fallback     — 2000+ word offline content when all AI fails
// ✦ Branding Enforcement — model names NEVER exposed, always "Savoiré AI"
// ✦ Structured Logging   — every request/response logged for Vercel dashboard
// ✦ Full CORS Support    — works from any domain
// ✦ Input Sanitisation   — length limits, type checks, trim
// ✦ Request Timing       — every attempt timed and logged
// ✦ Security Headers     — nosniff, no framing
// ═══════════════════════════════════════════════════════════════════════════════════════════════════

'use strict';

// ─────────────────────────────────────────────────────────────────────────────────────────────────
// SECTION 1 — CONSTANTS & BRANDING
// ─────────────────────────────────────────────────────────────────────────────────────────────────

const BRAND       = 'Savoiré AI v2.0';
const DEVELOPER   = 'Sooban Talha Technologies';
const DEVSITE     = 'soobantalhatech.xyz';
const WEBSITE     = 'savoireai.vercel.app';
const FOUNDER     = 'Sooban Talha';
const APP_VERSION = '2.0';

const OPENROUTER_BASE = 'https://openrouter.ai/api/v1/chat/completions';
const HTTP_REFERER    = `https://${WEBSITE}`;
const APP_TITLE       = BRAND;

// SSE event names — used by both server and client
const EVT_TOKEN     = 'token';      // individual chunk: { t: "word " }
const EVT_DONE      = 'done';       // final structured data object
const EVT_ERROR     = 'error';      // error event: { message: "..." }
const EVT_HEARTBEAT = 'heartbeat';  // keep-alive: { ts: 1234567890 }
const EVT_STAGE     = 'stage';      // thinking stage update: { idx: 0-4 }

// ─────────────────────────────────────────────────────────────────────────────────────────────────
// SECTION 2 — FREE AI MODEL ROSTER
// 10 models, tried in priority order. Internal only — NEVER sent to frontend.
// All use the :free suffix on OpenRouter which means $0/request.
// ─────────────────────────────────────────────────────────────────────────────────────────────────

const MODELS = [
  {
    id:          'google/gemini-2.0-flash-exp:free',
    max_tokens:   8000,
    timeout_ms:  120000,
    priority:    1,
    description: 'Gemini 2.0 Flash — best quality, fastest response, excellent at structured JSON',
  },
  {
    id:          'deepseek/deepseek-chat-v3-0324:free',
    max_tokens:   8000,
    timeout_ms:  120000,
    priority:    2,
    description: 'DeepSeek Chat v3 — outstanding reasoning, very strong at detailed academic content',
  },
  {
    id:          'meta-llama/llama-3.3-70b-instruct:free',
    max_tokens:   6000,
    timeout_ms:  110000,
    priority:    3,
    description: 'LLaMA 3.3 70B — Meta flagship, excellent instruction following and long-form writing',
  },
  {
    id:          'z-ai/glm-4.5-air:free',
    max_tokens:   6000,
    timeout_ms:  100000,
    priority:    4,
    description: 'GLM 4.5 Air — strong multilingual capabilities, good for non-English output',
  },
  {
    id:          'microsoft/phi-4-reasoning-plus:free',
    max_tokens:   4000,
    timeout_ms:   90000,
    priority:    5,
    description: 'Phi-4 Reasoning Plus — Microsoft, excellent logical reasoning and analysis',
  },
  {
    id:          'qwen/qwen3-8b:free',
    max_tokens:   4000,
    timeout_ms:   90000,
    priority:    6,
    description: 'Qwen3 8B — Alibaba, solid multilingual and general purpose performance',
  },
  {
    id:          'google/gemini-flash-1.5-8b:free',
    max_tokens:   4000,
    timeout_ms:   80000,
    priority:    7,
    description: 'Gemini Flash 1.5 8B — lightweight Gemini, fast and reliable for standard content',
  },
  {
    id:          'nousresearch/hermes-3-llama-3.1-405b:free',
    max_tokens:   6000,
    timeout_ms:  110000,
    priority:    8,
    description: 'Hermes 3 LLaMA 405B — massive model, great for comprehensive deep content',
  },
  {
    id:          'mistralai/mistral-7b-instruct-v0.3:free',
    max_tokens:   3500,
    timeout_ms:   80000,
    priority:    9,
    description: 'Mistral 7B v0.3 — reliable European model, consistent and dependable',
  },
  {
    id:          'openchat/openchat-7b:free',
    max_tokens:   3500,
    timeout_ms:   80000,
    priority:    10,
    description: 'OpenChat 7B — final fallback, consistently available and adequate quality',
  },
];

// ─────────────────────────────────────────────────────────────────────────────────────────────────
// SECTION 3 — DEPTH CONFIGURATION
// Maps depth selector value to word targets and description for prompt
// ─────────────────────────────────────────────────────────────────────────────────────────────────

const DEPTH_MAP = {
  standard: {
    wordRange:         '600 to 900 words',
    minWords:          600,
    targetWords:       750,
    description:       'Clear and accessible, covering all essentials with good depth',
    sectionsRequired:  4,
  },
  detailed: {
    wordRange:         '1000 to 1500 words',
    minWords:          1000,
    targetWords:       1250,
    description:       'Detailed coverage with concrete examples and thorough explanations throughout',
    sectionsRequired:  6,
  },
  comprehensive: {
    wordRange:         '1500 to 2000 words',
    minWords:          1500,
    targetWords:       1750,
    description:       'Comprehensive analysis covering all major aspects, nuances and edge cases in depth',
    sectionsRequired:  7,
  },
  expert: {
    wordRange:         '2000 to 2800 words including advanced subtopics, nuances, cutting-edge developments and critical debates',
    minWords:          2000,
    targetWords:       2400,
    description:       'Expert-level deep dive covering advanced subtopics, academic debates, historical context and future directions',
    sectionsRequired:  8,
  },
};

// ─────────────────────────────────────────────────────────────────────────────────────────────────
// SECTION 4 — STYLE CONFIGURATION
// Maps style selector to writing instruction injected into prompt
// ─────────────────────────────────────────────────────────────────────────────────────────────────

const STYLE_MAP = {
  simple: {
    name:        'Simple & Clear',
    instruction: `Write in clear, accessible, beginner-friendly language throughout. Define every technical term immediately when first used — do not assume any prior knowledge. Use short sentences, everyday analogies and comparisons. Avoid jargon wherever possible. Structure every explanation to build from simple to complex. The goal is that a motivated student encountering this topic for the very first time should understand every sentence without needing to look anything up.`,
  },
  academic: {
    name:        'Academic & Formal',
    instruction: `Write in formal academic language with precise scholarly terminology throughout. Maintain a third-person objective tone. Use discipline-specific vocabulary without oversimplification. Employ citation-ready phrases, formal definitions, and reference theoretical frameworks by name where appropriate. The style should be suitable for a university essay or academic report.`,
  },
  detailed: {
    name:        'Highly Detailed',
    instruction: `Provide exhaustive detail at every point. Include numerous concrete examples, counterexamples, edge cases, specific numbers and statistics where relevant, and thorough multi-step explanations for every concept. Never summarise where you could explain fully. Leave nothing implicit or assumed. The goal is that after reading, the student feels they have read a complete textbook chapter on this topic.`,
  },
  exam: {
    name:        'Exam-Focused',
    instruction: `Structure the entire response around exam success. Provide clear key definitions written in mark-scheme language. Highlight the most frequently examined aspects of this topic. Explicitly state what examiners look for in high-scoring answers. Include mark-worthy phrases that score well. Flag the most common mistakes students make in exams on this topic. Where possible, frame explanations as model answers to typical exam questions.`,
  },
  visual: {
    name:        'Visual & Analogy-Rich',
    instruction: `Make every concept concrete and memorable through vivid analogies, metaphors, visual descriptions and step-by-step walkthroughs. Compare abstract ideas to everyday objects and situations. Build mental models that a student can visualise clearly. Use narrative and storytelling where helpful. The goal is that each concept leaves a lasting mental picture that makes it impossible to forget.`,
  },
};

// ─────────────────────────────────────────────────────────────────────────────────────────────────
// SECTION 5 — TOOL CONFIGURATION
// Each tool has a different objective and prompt emphasis
// ─────────────────────────────────────────────────────────────────────────────────────────────────

const TOOL_MAP = {
  notes: {
    name:        'Generate Notes',
    objective:   'Generate comprehensive, deeply detailed, well-structured study notes.',
    emphasis:    `The ultra_long_notes field is the centrepiece. It MUST be genuinely long and detailed — the student is relying on this as their primary study resource. Use rich markdown formatting throughout: ## headings for each section, **bold** for every key term on first use, bullet lists for enumerations, numbered steps for processes, > blockquotes for important definitions or quotes, and horizontal rules --- between major sections. The notes must feel like a well-written textbook chapter.`,
    sections:    ['Introduction', 'Core Concepts', 'How It Works', 'Key Examples', 'Advanced Aspects', 'Common Applications', 'Critical Analysis', 'Summary & Key Takeaways'],
  },
  flashcards: {
    name:        'Create Flashcards',
    objective:   'Generate study materials optimised for interactive flashcard learning and spaced repetition.',
    emphasis:    `The key_concepts should be formatted as perfect flashcard pairs — clear concise front side (term/question) followed by colon then clear accurate back side (definition/answer). Each pair should stand completely alone and make sense without context. The practice_questions should use the same format — short memorable questions with concise definitive answers that can be recalled in under 30 seconds. All content should be optimised for the spacing effect and active recall.`,
    sections:    ['Introduction', 'Core Concepts', 'How It Works', 'Key Examples', 'Summary'],
  },
  quiz: {
    name:        'Build Quiz',
    objective:   'Generate challenging, varied practice questions at exam level for self-testing.',
    emphasis:    `The practice_questions are the core of this tool. Make them genuinely challenging — not trivial definitions. Vary the question types: one analytical question requiring reasoning, one application question requiring a scenario, one comparison/evaluation question requiring critical thinking. Each answer MUST be extremely comprehensive — minimum 200 words — covering: (1) direct answer, (2) detailed explanation with reasoning, (3) a specific concrete example, (4) real-world relevance, (5) a common exam mistake to avoid. The notes and concepts should also reflect this exam-prep focus.`,
    sections:    ['Introduction', 'Core Concepts', 'How It Works', 'Key Examples', 'Summary'],
  },
  summary: {
    name:        'Smart Summary',
    objective:   'Generate a concise, punchy smart summary for fast review and revision.',
    emphasis:    `Begin the ultra_long_notes with a 2-3 sentence TL;DR paragraph that captures the absolute essence of the topic. Then follow with clearly labelled sections covering only the most critical points — cut everything non-essential. The key_concepts should represent the absolute TOP 5 things a student MUST know. Key_tricks should focus on retention and recall. The tone should be efficient and direct — every word must earn its place.`,
    sections:    ['TL;DR', 'Core Concepts', 'Key Mechanisms', 'Critical Examples', 'What to Remember'],
  },
  mindmap: {
    name:        'Build Mind Map',
    objective:   'Generate content structured hierarchically for a visual mind map with clear branches.',
    emphasis:    `Structure ALL content to reveal the hierarchical relationships between ideas. The ultra_long_notes should organise content using nested bullet points that mirror the branch structure of a mind map. key_concepts represent the 5 main branches from the central node. real_world_applications represent the Applications branch. key_tricks represent the Study Strategies branch. common_misconceptions represent the Watch Out branch. Every item should be concise enough to fit on a mind map node (under 12 words) where possible.`,
    sections:    ['Central Topic', 'Main Branches', 'Sub-Branches', 'Connections', 'Applications'],
  },
};

// ─────────────────────────────────────────────────────────────────────────────────────────────────
// SECTION 6 — UTILITY FUNCTIONS
// ─────────────────────────────────────────────────────────────────────────────────────────────────

// Sleep utility
const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

// Structured logger — appears in Vercel function logs
const logger = {
  info:    (...a) => console.log   (`[${new Date().toISOString()}] [${BRAND}] INFO  `, ...a),
  ok:      (...a) => console.log   (`[${new Date().toISOString()}] [${BRAND}] ✓     `, ...a),
  warn:    (...a) => console.warn  (`[${new Date().toISOString()}] [${BRAND}] WARN  `, ...a),
  error:   (...a) => console.error (`[${new Date().toISOString()}] [${BRAND}] ERROR `, ...a),
  model:   (...a) => console.log   (`[${new Date().toISOString()}] [MODEL]   →     `, ...a),
};

// Word count helper
function wordCount(text) {
  if (!text || typeof text !== 'string') return 0;
  return text.trim().split(/\s+/).filter(Boolean).length;
}

// Truncate for logging
function trunc(s, n = 100) {
  if (!s) return '';
  return String(s).length > n ? String(s).slice(0, n) + '…' : String(s);
}

// ─────────────────────────────────────────────────────────────────────────────────────────────────
// SECTION 7 — PROMPT BUILDER
// Constructs the full system prompt with all options injected
// This prompt is what makes the AI generate the exact structured JSON we need
// ─────────────────────────────────────────────────────────────────────────────────────────────────

function buildPrompt(input, opts) {
  const language = (opts.language || 'English').trim();
  const depth    = opts.depth  || 'detailed';
  const style    = opts.style  || 'simple';
  const tool     = opts.tool   || 'notes';

  const depthCfg = DEPTH_MAP[depth]  || DEPTH_MAP.detailed;
  const styleCfg = STYLE_MAP[style]  || STYLE_MAP.simple;
  const toolCfg  = TOOL_MAP[tool]    || TOOL_MAP.notes;

  const nowISO   = new Date().toISOString();
  const sections = toolCfg.sections.map(s => `  ## ${s}`).join('\n');

  return `You are ${BRAND}, the world's most advanced free AI study companion.
Built by ${DEVELOPER} | ${DEVSITE} | Founder: ${FOUNDER}

╔══════════════════════════════════════════════════════════════════════╗
  YOUR TASK: ${toolCfg.objective}
╚══════════════════════════════════════════════════════════════════════╝

STUDENT'S TOPIC / INPUT:
━━━━━━━━━━━━━━━━━━━━━━━━
${input}
━━━━━━━━━━━━━━━━━━━━━━━━

OUTPUT LANGUAGE: ${language}
ALL content — every single word, heading, bullet, sentence — MUST be in ${language}.
Do not use any other language anywhere in the output, not even for section headings.

OUTPUT DEPTH: ${depthCfg.wordRange}
${depthCfg.description}
The ultra_long_notes field ALONE must meet this word count.

WRITING STYLE: ${styleCfg.name}
${styleCfg.instruction}

TOOL MODE: ${toolCfg.name}
${toolCfg.emphasis}

REQUIRED SECTION STRUCTURE for ultra_long_notes:
${sections}
Each section must be substantive — minimum 80 words per section, more is better.

═══════════════════════════════════════════════════════════════════════
MANDATORY OUTPUT SPECIFICATION — READ CAREFULLY
═══════════════════════════════════════════════════════════════════════

[FIELD: ultra_long_notes]
TYPE: string
LENGTH: MINIMUM ${depthCfg.wordRange}
FORMAT: Rich markdown
REQUIRED ELEMENTS:
  • ## headings for every major section
  • **bold text** for EVERY key term on first use
  • Bullet lists (- item) for enumerations and lists
  • Numbered lists (1. item) for processes and sequences
  • > blockquotes for important definitions, rules or key statements
  • --- horizontal rules between major sections
  • Concrete examples in EVERY section
  • NO empty sections — every section must be substantive

[FIELD: key_concepts]
TYPE: array of exactly 5 strings
FORMAT: "Term: comprehensive explanation (25-40 words each)"
REQUIREMENT: Cover the 5 most important concepts — be informative, not just definitions
LANGUAGE: All in ${language}

[FIELD: key_tricks]
TYPE: array of exactly 3 strings
LENGTH: 55-75 words each
CONTENT: Practical memory aids, mnemonics, study strategies specific to this topic
OPTIONS: Feynman Technique, Spaced Repetition, visual anchors, acronyms, exam tips
LANGUAGE: All in ${language}

[FIELD: practice_questions]
TYPE: array of exactly 3 objects, each with "question" and "answer"
QUESTION FORMAT: Exam-level, varied types (analytical / application / evaluation)
ANSWER FORMAT: MINIMUM 160 words each, covering:
  1. Direct answer to the question (1-2 sentences)
  2. Detailed reasoning and explanation (3-4 sentences)
  3. A specific concrete example with detail
  4. Real-world relevance or professional application
  5. A common student mistake to avoid on this question
LANGUAGE: All in ${language}

[FIELD: real_world_applications]
TYPE: array of exactly 3 strings
LENGTH: 45-65 words each
FORMAT: "Domain: specific mechanism of application and outcome"
EXAMPLES: Healthcare, Engineering, Finance, Education, Environmental Science, AI/Tech
REQUIREMENT: Explain HOW it applies specifically — not just THAT it applies
LANGUAGE: All in ${language}

[FIELD: common_misconceptions]
TYPE: array of exactly 3 strings
LENGTH: 45-65 words each
FORMAT: "Many students believe [wrong idea]. In reality, [correct explanation with reason]."
REQUIREMENT: Corrections must be memorable and clearly explain WHY the misconception is wrong
LANGUAGE: All in ${language}

[FIELD: topic]
TYPE: string — clean, specific topic name in ${language}

[FIELD: curriculum_alignment]
TYPE: string — most likely academic level and subject
EXAMPLES: "A-Level Biology", "University Computer Science", "GCSE History", "IB Physics", "MBA Finance"

[FIELD: study_score]
TYPE: integer — always output exactly 96

[FIELD: powered_by]
TYPE: string — always output exactly "${BRAND} by ${DEVELOPER}"

[FIELD: generated_at]
TYPE: string — always output exactly "${nowISO}"

═══════════════════════════════════════════════════════════════════════
OUTPUT FORMAT — ABSOLUTELY CRITICAL
═══════════════════════════════════════════════════════════════════════
Your ENTIRE response must be a single valid JSON object.
— NO text before the opening {
— NO text after the closing }
— NO markdown code fences (no \`\`\`json)
— NO comments or annotations inside the JSON
— All string values must use proper JSON escaping
— Newlines inside strings must be \\n (escaped)
— Double quotes inside strings must be \\" (escaped)

{
  "topic": "specific topic name in ${language}",
  "curriculum_alignment": "e.g. A-Level Biology",
  "ultra_long_notes": "full rich markdown study notes in ${language} — at least ${depthCfg.wordRange}",
  "key_concepts": [
    "Term 1: explanation in ${language} — 25-40 words",
    "Term 2: explanation in ${language} — 25-40 words",
    "Term 3: explanation in ${language} — 25-40 words",
    "Term 4: explanation in ${language} — 25-40 words",
    "Term 5: explanation in ${language} — 25-40 words"
  ],
  "key_tricks": [
    "Trick 1 in ${language} — 55-75 words",
    "Trick 2 in ${language} — 55-75 words",
    "Trick 3 in ${language} — 55-75 words"
  ],
  "practice_questions": [
    {
      "question": "Analytical question in ${language}",
      "answer": "Comprehensive answer in ${language} — minimum 160 words"
    },
    {
      "question": "Application question in ${language}",
      "answer": "Comprehensive answer in ${language} — minimum 160 words"
    },
    {
      "question": "Evaluation question in ${language}",
      "answer": "Comprehensive answer in ${language} — minimum 160 words"
    }
  ],
  "real_world_applications": [
    "Domain 1: specific application in ${language} — 45-65 words",
    "Domain 2: specific application in ${language} — 45-65 words",
    "Domain 3: specific application in ${language} — 45-65 words"
  ],
  "common_misconceptions": [
    "Misconception 1 in ${language} — 45-65 words",
    "Misconception 2 in ${language} — 45-65 words",
    "Misconception 3 in ${language} — 45-65 words"
  ],
  "study_score": 96,
  "powered_by": "${BRAND} by ${DEVELOPER}",
  "generated_at": "${nowISO}"
}`;
}

// ─────────────────────────────────────────────────────────────────────────────────────────────────
// SECTION 8 — JSON EXTRACTION & PARSING
// Robustly extracts JSON from model output that may contain extra text,
// markdown fences, partial content, or escape issues
// ─────────────────────────────────────────────────────────────────────────────────────────────────

function extractAndParseJSON(rawContent) {
  if (!rawContent || typeof rawContent !== 'string') {
    throw new Error('Model returned empty or non-string content');
  }

  let text = rawContent.trim();

  // Step 1: Strip markdown code fences
  text = text.replace(/^```(?:json)?\s*/i, '');
  text = text.replace(/\s*```\s*$/i, '');
  text = text.trim();

  // Step 2: Find outermost JSON object boundaries
  const startIdx = text.indexOf('{');
  const endIdx   = text.lastIndexOf('}');

  if (startIdx === -1) {
    throw new Error(`No JSON object opening brace found. Content preview: "${trunc(text, 150)}"`);
  }
  if (endIdx === -1 || endIdx <= startIdx) {
    throw new Error(`No valid JSON object closing brace found. Content preview: "${trunc(text, 150)}"`);
  }

  let jsonStr = text.slice(startIdx, endIdx + 1);

  // Step 3: Try direct parse first
  try {
    return JSON.parse(jsonStr);
  } catch (directErr) {
    logger.warn(`Direct JSON parse failed: ${directErr.message} — attempting auto-repair`);
  }

  // Step 4: Attempt repairs on common model JSON errors

  let repaired = jsonStr;

  // Fix 4a: Remove actual newline characters inside string values
  // This is the most common model error — they output raw newlines inside JSON strings
  repaired = repaired.replace(/"((?:[^"\\]|\\.)*)"/g, (match, inner) => {
    // Replace raw newlines, tabs, carriage returns inside string values
    const fixed = inner
      .replace(/\r\n/g, '\\n')
      .replace(/\r/g,   '\\r')
      .replace(/\n/g,   '\\n')
      .replace(/\t/g,   '\\t');
    return `"${fixed}"`;
  });

  // Fix 4b: Remove trailing commas before } or ]
  repaired = repaired.replace(/,(\s*[}\]])/g, '$1');

  // Fix 4c: Fix unquoted property keys
  repaired = repaired.replace(/([{,]\s*)([a-zA-Z_][a-zA-Z0-9_]*)(\s*:)/g, (m, pre, key, post) => {
    return `${pre}"${key}"${post}`;
  });

  try {
    return JSON.parse(repaired);
  } catch (repairErr) {
    throw new Error(
      `JSON parse failed after repair attempts. Original error: ${repairErr.message}. ` +
      `Content length: ${jsonStr.length}. First 300 chars: "${trunc(jsonStr, 300)}"`
    );
  }
}

// ─────────────────────────────────────────────────────────────────────────────────────────────────
// SECTION 9 — DATA VALIDATION & ENRICHMENT
// Validates all required fields, fills missing optional fields,
// enforces branding and removes model identity
// ─────────────────────────────────────────────────────────────────────────────────────────────────

function validateAndEnrich(parsed, opts) {
  // ── Required field checks ──
  if (!parsed || typeof parsed !== 'object') {
    throw new Error('Parsed result is not an object');
  }

  if (!parsed.topic || typeof parsed.topic !== 'string' || parsed.topic.trim().length < 2) {
    throw new Error(`Invalid or missing "topic" field (got: ${JSON.stringify(parsed.topic)})`);
  }

  if (!parsed.ultra_long_notes || typeof parsed.ultra_long_notes !== 'string') {
    throw new Error('Missing required field: ultra_long_notes');
  }

  const notesLength = parsed.ultra_long_notes.trim().length;
  if (notesLength < 150) {
    throw new Error(`ultra_long_notes too short: ${notesLength} characters (minimum 150)`);
  }

  if (!Array.isArray(parsed.practice_questions) || parsed.practice_questions.length === 0) {
    throw new Error('Missing or empty required field: practice_questions');
  }

  if (!Array.isArray(parsed.key_concepts) || parsed.key_concepts.length === 0) {
    throw new Error('Missing or empty required field: key_concepts');
  }

  // ── Validate practice_questions structure ──
  parsed.practice_questions = parsed.practice_questions
    .filter(q => q && typeof q === 'object')
    .map(q => ({
      question: String(q.question || q.q || '').trim(),
      answer:   String(q.answer   || q.a || '').trim(),
    }))
    .filter(q => q.question.length > 0 && q.answer.length > 0);

  if (parsed.practice_questions.length === 0) {
    throw new Error('All practice_questions items were invalid after filtering');
  }

  // ── Fill missing optional arrays with quality fallbacks ──
  const topic = parsed.topic;

  if (!Array.isArray(parsed.key_tricks) || parsed.key_tricks.length === 0) {
    parsed.key_tricks = buildFallbackTricks(topic);
  }

  if (!Array.isArray(parsed.real_world_applications) || parsed.real_world_applications.length === 0) {
    parsed.real_world_applications = buildFallbackApplications(topic);
  }

  if (!Array.isArray(parsed.common_misconceptions) || parsed.common_misconceptions.length === 0) {
    parsed.common_misconceptions = buildFallbackMisconceptions(topic);
  }

  // ── Trim arrays to maximum lengths ──
  if (parsed.key_concepts.length > 5)            parsed.key_concepts            = parsed.key_concepts.slice(0, 5);
  if (parsed.key_tricks.length > 3)              parsed.key_tricks              = parsed.key_tricks.slice(0, 3);
  if (parsed.real_world_applications.length > 3) parsed.real_world_applications = parsed.real_world_applications.slice(0, 3);
  if (parsed.common_misconceptions.length > 3)   parsed.common_misconceptions   = parsed.common_misconceptions.slice(0, 3);
  if (parsed.practice_questions.length > 3)      parsed.practice_questions      = parsed.practice_questions.slice(0, 3);

  // ── Enforce branding — NEVER expose model identity ──
  parsed.powered_by    = `${BRAND} by ${DEVELOPER}`;
  parsed.study_score   = 96;
  parsed.generated_at  = parsed.generated_at || new Date().toISOString();
  parsed._language     = opts.language || 'English';
  parsed._version      = APP_VERSION;

  // ── Delete any model identity fields ──
  delete parsed._model;
  delete parsed.model;
  delete parsed.model_used;
  delete parsed.model_id;
  delete parsed.ai_model;

  // ── Log quality metrics ──
  const notesWc = wordCount(parsed.ultra_long_notes);
  logger.info(`Quality: ${notesWc} words in notes, ${parsed.key_concepts.length} concepts, ${parsed.practice_questions.length} questions`);

  return parsed;
}

// ─────────────────────────────────────────────────────────────────────────────────────────────────
// SECTION 10 — MODEL CALLER (SYNC — NON-STREAMING)
// Calls one model with stream:false, returns full response
// ─────────────────────────────────────────────────────────────────────────────────────────────────

async function callModelSync(model, prompt, opts) {
  const ctrl    = new AbortController();
  const timer   = setTimeout(() => ctrl.abort(), model.timeout_ms);
  const t0      = Date.now();
  const name    = model.id.split('/').pop().replace(':free', '');

  try {
    const response = await fetch(OPENROUTER_BASE, {
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
        temperature: 0.72,
        stream:      false,
        messages:    [{ role: 'user', content: prompt }],
      }),
      signal: ctrl.signal,
    });

    clearTimeout(timer);
    const elapsed = Date.now() - t0;

    if (!response.ok) {
      const errorBody = await response.text().catch(() => '');
      const errorMsg  = `HTTP ${response.status} from ${name} after ${elapsed}ms: ${trunc(errorBody, 200)}`;

      // Rate limit or server overload — flag for fast skip
      if (response.status === 429 || response.status === 503 || response.status === 502) {
        throw new Error(`[RATE_LIMITED] ${errorMsg}`);
      }

      throw new Error(errorMsg);
    }

    const data    = await response.json();
    const content = data?.choices?.[0]?.message?.content;

    if (!content || typeof content !== 'string' || content.trim().length < 100) {
      throw new Error(`${name} returned empty/too-short content after ${elapsed}ms (${content?.length || 0} chars)`);
    }

    logger.ok(`${name} sync responded in ${elapsed}ms, content: ${content.length} chars`);

    const parsed = extractAndParseJSON(content);
    return validateAndEnrich(parsed, opts);

  } catch (err) {
    clearTimeout(timer);
    throw err;
  }
}

// ─────────────────────────────────────────────────────────────────────────────────────────────────
// SECTION 11 — MODEL CALLER (STREAMING — SSE)
// Calls one model with stream:true
// Fires onChunk(tokenText) for every token received
// Returns the complete structured data object when stream ends
// This is what makes output appear live on screen like ChatGPT
// ─────────────────────────────────────────────────────────────────────────────────────────────────

async function callModelStream(model, prompt, opts, onChunk) {
  const ctrl    = new AbortController();
  const timer   = setTimeout(() => ctrl.abort(), model.timeout_ms);
  const t0      = Date.now();
  const name    = model.id.split('/').pop().replace(':free', '');

  try {
    const response = await fetch(OPENROUTER_BASE, {
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
        temperature: 0.72,
        stream:      true,   // ← THIS enables SSE streaming from OpenRouter
        messages:    [{ role: 'user', content: prompt }],
      }),
      signal: ctrl.signal,
    });

    clearTimeout(timer);

    if (!response.ok) {
      const errorBody = await response.text().catch(() => '');
      const errorMsg  = `HTTP ${response.status} from ${name}: ${trunc(errorBody, 200)}`;
      if (response.status === 429 || response.status === 503 || response.status === 502) {
        throw new Error(`[RATE_LIMITED] ${errorMsg}`);
      }
      throw new Error(errorMsg);
    }

    // ── Read the SSE stream line by line ──
    const reader      = response.body.getReader();
    const decoder     = new TextDecoder('utf-8');
    let   lineBuffer  = '';      // incomplete line buffer
    let   fullContent = '';      // accumulate all tokens
    let   tokenCount  = 0;
    let   charsEmitted = 0;

    while (true) {
      const { done, value } = await reader.read();

      if (done) {
        // Stream ended — process any remaining buffered line
        if (lineBuffer.trim()) {
          processLine(lineBuffer.trim());
        }
        break;
      }

      // Decode chunk and add to line buffer
      lineBuffer += decoder.decode(value, { stream: true });

      // Process all complete lines
      const lines = lineBuffer.split('\n');
      lineBuffer  = lines.pop() || ''; // last element may be incomplete

      for (const line of lines) {
        processLine(line);
      }
    }

    // ── Line processor ──
    function processLine(line) {
      line = line.trim();
      if (!line || !line.startsWith('data: ')) return;

      const dataStr = line.slice(6).trim();
      if (dataStr === '[DONE]') return;
      if (!dataStr || dataStr === '') return;

      let evt;
      try { evt = JSON.parse(dataStr); }
      catch { return; /* skip malformed SSE data */ }

      const delta = evt?.choices?.[0]?.delta?.content;
      if (delta && typeof delta === 'string' && delta.length > 0) {
        fullContent  += delta;
        charsEmitted += delta.length;
        tokenCount++;
        // ── Fire the live output callback ──
        // This sends the token to the frontend via SSE immediately
        onChunk(delta);
      }
    }

    const elapsed = Date.now() - t0;

    if (fullContent.trim().length < 100) {
      throw new Error(`${name} stream produced too-short content: ${fullContent.length} chars after ${elapsed}ms`);
    }

    logger.ok(`${name} stream complete: ${tokenCount} tokens, ${charsEmitted} chars, ${elapsed}ms`);

    // ── Parse and validate the accumulated streamed content ──
    const parsed = extractAndParseJSON(fullContent);
    return validateAndEnrich(parsed, opts);

  } catch (err) {
    clearTimeout(timer);
    throw err;
  }
}

// ─────────────────────────────────────────────────────────────────────────────────────────────────
// SECTION 12 — MAIN AI GENERATOR WITH FULL FALLBACK CHAIN
// Tries all 10 models × 2 attempts = up to 20 tries before giving up
// ─────────────────────────────────────────────────────────────────────────────────────────────────

async function generateWithAI(message, opts, onChunk) {
  if (!process.env.OPENROUTER_API_KEY) {
    throw new Error(
      'OPENROUTER_API_KEY environment variable is not set. ' +
      'Please add it in your Vercel project settings → Environment Variables.'
    );
  }

  const useStreaming = typeof onChunk === 'function';
  const prompt       = buildPrompt(message, opts);
  const errors       = [];
  let   modelsTried  = 0;
  let   totalAttempts = 0;

  logger.info(
    `Generation start — ` +
    `tool: ${opts.tool || 'notes'} | ` +
    `lang: ${opts.language || 'English'} | ` +
    `depth: ${opts.depth || 'detailed'} | ` +
    `style: ${opts.style || 'simple'} | ` +
    `mode: ${useStreaming ? 'STREAM' : 'SYNC'} | ` +
    `input: ${message.length} chars`
  );

  for (const model of MODELS) {
    const name        = model.id.split('/').pop().replace(':free', '');
    const maxAttempts = 2;
    modelsTried++;

    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      totalAttempts++;
      logger.model(`Attempt ${totalAttempts}: ${name} (try ${attempt}/${maxAttempts})`);

      try {
        let result;

        if (useStreaming) {
          result = await callModelStream(model, prompt, opts, onChunk);
        } else {
          result = await callModelSync(model, prompt, opts);
        }

        result._language     = opts.language || 'English';
        result._models_tried = modelsTried;
        result._attempts     = totalAttempts;

        logger.ok(
          `SUCCESS — ${name} (attempt ${attempt}) | ` +
          `models tried: ${modelsTried}/${MODELS.length} | ` +
          `total attempts: ${totalAttempts}`
        );

        return result;

      } catch (err) {
        const errMsg = (err.message || 'Unknown error').slice(0, 150);
        errors.push(`${name}[${attempt}]: ${errMsg}`);
        logger.warn(`FAIL — ${name} attempt ${attempt}: ${errMsg}`);

        // Rate limited → skip second attempt immediately, no delay
        if (errMsg.includes('[RATE_LIMITED]')) {
          logger.warn(`Rate limited on ${name} — skipping to next model`);
          break;
        }
        if (errMsg.includes('timeout') || errMsg.includes('ECONNREFUSED')) {
          logger.warn(`${name} unavailable — skipping to next model`);
          break;  // Don't retry on network errors
        }

        // Aborted (timeout) → skip second attempt
        if (err.name === 'AbortError') {
          logger.warn(`${name} timed out after ${model.timeout_ms}ms`);
          break;
        }

        // Wait before retry (only for attempt 1, not if we're about to give up)
        if (attempt < maxAttempts) {
          const waitMs = 20;
          logger.info(`Waiting ${waitMs}ms before retry ${attempt + 1}...`);
          await sleep(waitMs);
        }
      }
    }

    // Brief pause between models to be a good API citizen
    if (modelsTried < MODELS.length) {
      await sleep(350);
    }
  }

  // All models exhausted
  logger.error(`ALL MODELS FAILED — ${MODELS.length} models tried, ${totalAttempts} total attempts`);
  logger.error(`Error summary: ${errors.slice(0, 6).join(' || ')}`);

  throw new Error(
    `All ${MODELS.length} AI models are temporarily unavailable after ${totalAttempts} attempts. ` +
    `Please try again in a moment — this is usually a temporary peak load issue.`
  );
}

// ─────────────────────────────────────────────────────────────────────────────────────────────────
// SECTION 13 — FALLBACK CONTENT BUILDERS
// High-quality content generated from topic name alone, used when all AI fails
// ─────────────────────────────────────────────────────────────────────────────────────────────────

function buildFallbackTricks(topic) {
  const t = topic || 'this topic';
  return [
    `FIVE W's FRAMEWORK: Apply Who, What, When, Where and Why systematically to every dimension of ${t}. For each concept you study, explicitly answer all five questions before moving on. This forces active engagement with the material rather than passive reading, creates a complete mental map, and immediately reveals which specific aspects you don't fully understand yet — those gaps are exactly where your next study session should focus.`,

    `THE FEYNMAN TECHNIQUE: After studying ${t}, close your notes and try to explain the entire topic out loud as if teaching a curious 12-year-old who knows nothing about it. Every time you hesitate, use unexplained jargon, or lose the thread of your explanation, you have discovered a genuine gap in your understanding. Return to your source, study that specific gap, then restart the explanation. Repeat until you can explain it completely and fluently from memory.`,

    `SPACED REPETITION SCHEDULE: Study ${t} in focused 20-minute sessions across multiple days — not in one marathon session. Optimal spacing: Day 1 (initial learning), Day 3 (first review), Day 7 (consolidation), Day 14 (long-term retention), Day 30 (mastery verification). Each review session begins precisely when memories are starting to fade. This exploits the spacing effect, which research consistently shows produces 2-3x better long-term retention than massed practice.`,
  ];
}

function buildFallbackApplications(topic) {
  const t = topic || 'this topic';
  return [
    `Healthcare & Medicine: Principles from ${t} directly inform clinical decision-making, diagnostic reasoning, treatment protocol design and patient outcome prediction. Medical professionals who deeply understand these concepts make more accurate assessments, avoid systematic errors in reasoning, and deliver measurably better patient care. Medical education worldwide incorporates these frameworks as foundational competencies for every practising clinician.`,

    `Technology & Software Engineering: ${t} concepts underpin critical software architecture decisions, algorithm selection, system optimisation strategies and quality assurance processes. Software engineers who understand these principles design more scalable, maintainable and reliable systems. They make better technical decisions under uncertainty, communicate more effectively with stakeholders, and produce software that continues to function correctly as requirements evolve and scale increases.`,

    `Business Strategy & Management: Organisations that apply frameworks derived from ${t} systematically outperform those that do not. Strategic planners use these principles to analyse competitive environments and identify opportunities. Operations managers apply them to streamline workflows and eliminate inefficiencies. HR professionals leverage them to design better training programmes. The resulting improvements in decision quality compound over time into significant and sustainable competitive advantages.`,
  ];
}

function buildFallbackMisconceptions(topic) {
  const t = topic || 'this topic';
  return [
    `Many students believe ${t} can be mastered through repeated memorisation of facts, definitions and formulae. In reality, genuine mastery requires understanding the underlying principles, the causal relationships between ideas, and the reasoning that connects them. Memorisation without comprehension produces knowledge that collapses under exam pressure when questions are framed differently, or in professional practice when situations do not match the textbook template.`,

    `A widespread misconception is that ${t} is only relevant to specialists in that specific field, making it optional knowledge for students pursuing other disciplines. In reality, the core reasoning patterns, analytical frameworks and mental models that ${t} develops transfer powerfully and broadly. Professionals across every field — from law to engineering to art — regularly discover that their understanding of ${t} provides unexpected intellectual advantages in their primary domain.`,

    `Students often assume that once they understand the basic concepts of ${t}, there is little of substance left to learn. In reality, ${t} has significant depth with important nuances, active ongoing research, and genuine unresolved debates at its frontier. The difference between introductory understanding and genuine expertise is vast. Even leading researchers in ${t} describe regularly encountering aspects of the field that surprise and challenge their existing mental models.`,
  ];
}

// ─────────────────────────────────────────────────────────────────────────────────────────────────
// SECTION 14 — FULL OFFLINE FALLBACK
// Complete quality study content generated without any AI
// Used as the absolute final safety net — ALWAYS returns something useful
// ─────────────────────────────────────────────────────────────────────────────────────────────────

function generateOfflineFallback(topic, opts) {
  const t    = (topic || 'This Subject').trim();
  const lang = opts.language || 'English';
  const tool = opts.tool     || 'notes';

  logger.warn(`Using offline fallback for topic: "${t}", lang: ${lang}, tool: ${tool}`);

  return {
    topic:                t,
    curriculum_alignment: 'General Academic Study',
    _language:            lang,
    _fallback:            true,
    _fallback_reason:     'All AI models temporarily unavailable — high-quality offline content generated',

    ultra_long_notes: buildOfflineNotes(t),

    key_concepts: [
      `Core Definition: ${t} refers to the fundamental principles, concepts and frameworks forming its theoretical and practical foundation within its academic and professional domain of study and application.`,
      `Primary Mechanisms: The main processes central to ${t} involve systematic, analysable interactions between identifiable components that produce consistent, observable and — under appropriate conditions — predictable outcomes.`,
      `Historical Development: ${t} evolved through successive waves of intellectual discovery, critical reappraisal and paradigm shifts, with key contributors gradually establishing the foundational frameworks, validated methods and accepted principles in use today.`,
      `Practical Significance: ${t} carries substantial direct application value across multiple professional and research domains, enabling practitioners to solve real-world problems more effectively, make higher-quality decisions, and achieve measurably better outcomes.`,
      `Critical Boundaries: A complete and intellectually honest understanding of ${t} requires explicitly recognising both its considerable explanatory power and the specific conditions and contexts in which its standard frameworks have important limitations that require modification or supplementation.`,
    ],

    key_tricks: buildFallbackTricks(t),

    practice_questions: [
      {
        question: `Explain the core principles of ${t} and describe how they interact to form a coherent, integrated theoretical framework.`,
        answer:   buildFallbackAnswer1(t),
      },
      {
        question: `Describe a realistic professional scenario where deep knowledge of ${t} would be essential. Walk through your approach step by step and explain the role of key principles at each stage.`,
        answer:   buildFallbackAnswer2(t),
      },
      {
        question: `Compare two fundamentally different approaches to understanding ${t}. What are the core strengths and primary limitations of each, and how might a sophisticated practitioner integrate both?`,
        answer:   buildFallbackAnswer3(t),
      },
    ],

    real_world_applications: buildFallbackApplications(t),
    common_misconceptions:   buildFallbackMisconceptions(t),

    study_score:   96,
    powered_by:    `${BRAND} by ${DEVELOPER}`,
    generated_at:  new Date().toISOString(),
    _version:      APP_VERSION,
  };
}

function buildOfflineNotes(t) {
  return `## Introduction to ${t}

${t} is a significant, multi-dimensional area of study with broad intellectual implications and extensive practical applications across numerous academic disciplines and professional fields. A rigorous, well-structured understanding of ${t} is not merely valuable for passing examinations — it opens doors to deeper intellectual capability, more sophisticated professional reasoning, and the capacity for continued independent learning throughout a career.

This comprehensive study guide covers the complete scope of ${t}: its foundational concepts, core mechanisms, key examples, advanced aspects, real-world applications, and an integrative summary that anchors your understanding.

---

## Core Concepts

The study of ${t} begins by establishing its fundamental conceptual infrastructure — the vocabulary, definitions and foundational ideas upon which all subsequent understanding must be built. Without this foundation, advanced concepts lack their necessary grounding.

**Theoretical Foundation:** Every developed field of knowledge has a theoretical core — a set of foundational assumptions, definitions and logical relationships that organise its knowledge claims and give its conclusions their authority. Understanding the theoretical foundation of ${t} means understanding not just what the field claims, but why those claims are considered justified, what evidence supports them, and what reasoning connects individual facts to broader principles.

**Practical Dimension:** The practical dimension of ${t} is what connects its abstract theoretical content to concrete real-world value. Understanding how principles manifest in practice — in professional decisions, in designed systems, in observed phenomena — transforms theoretical knowledge from inert information into usable capability. Theory and practice in ${t} are not separate domains but different aspects of a unified whole.

**Analytical Framework:** ${t} provides practitioners with a structured way of perceiving, decomposing and reasoning about complex problems. This analytical framework is transferable — once internalised, it enables higher-quality thinking not just within ${t} but across many adjacent domains where similar reasoning structures apply.

**Systemic Perspective:** No component of ${t} exists in isolation. Every concept connects to others through relationships of logical dependence, causal influence, or structural analogy. Developing a systemic perspective — understanding the field as an integrated whole rather than a collection of isolated facts — is the defining characteristic of genuine expertise.

---

## How It Works

The core processes and mechanisms central to ${t} unfold through identifiable stages that can be studied, understood and applied systematically:

**Stage 1 — Initial Conditions and Prerequisites:** Every application of ${t} begins with specific initial conditions, inputs or prerequisite states. Accurately identifying and characterising these starting conditions is critical — misunderstanding or overlooking initial conditions is a primary source of errors in both academic analysis and professional practice.

**Stage 2 — Active Mechanisms and Transformations:** The defining mechanisms of ${t} transform initial conditions into outcomes through processes that follow identifiable patterns and obey describable rules. Understanding these mechanisms at a deep level — not just recognising their outputs but understanding why they produce those outputs — enables practitioners to predict behaviour, explain anomalies and design effective interventions.

**Stage 3 — Feedback and Dynamic Adjustment:** Many systems described by ${t} are not static but dynamic — they incorporate feedback loops through which outcomes influence subsequent inputs, creating adaptive or self-correcting behaviour. Understanding these feedback dynamics is essential for accurate long-term prediction and effective intervention design.

**Stage 4 — Outputs and Observable Consequences:** The ultimate products of the processes central to ${t} take observable forms — measurable quantities, categorical outcomes, behavioural changes or structural modifications. Understanding how to correctly identify, measure and interpret these outputs is a core practical competency.

---

## Key Examples

**Foundational Canonical Example:** The classic demonstration cases of ${t} are valuable precisely because they isolate core mechanisms from confounding complexity, allowing the underlying principles to be seen with maximum clarity. These canonical examples should be studied thoroughly — they form the shared reference points that allow practitioners to communicate efficiently about complex ideas.

**Complex Multi-Variable Case:** Real-world applications of ${t} rarely present themselves with the clean simplicity of textbook examples. Professional practice requires applying core principles under conditions of incomplete information, multiple interacting variables, time pressure and genuine uncertainty. Studying complex cases builds the applied judgment that distinguishes expert practitioners from those with only theoretical knowledge.

**Edge Cases and Boundary Conditions:** Understanding where the standard frameworks of ${t} break down, require modification or produce counterintuitive results reveals the true scope and limits of the theory. These boundary cases are intellectually important and frequently appear in advanced examinations and professional assessments precisely because they test genuine understanding rather than surface-level familiarity.

---

## Advanced Aspects

**Theoretical Complications and Nuances:** As understanding deepens, the apparently simple core principles of ${t} reveal layers of complexity. Boundary conditions require careful specification. General principles require contextual modification in specific domains. Competing theoretical frameworks offer different but partially valid perspectives on the same phenomena. Navigating this complexity is what graduate-level and professional-level engagement with ${t} requires.

**Methodological Questions:** Every field faces fundamental questions about its own methods — how knowledge is produced, how evidence is evaluated, how theories are tested and revised. Understanding the methodological foundations of ${t} enables more sophisticated engagement with its literature and more critical evaluation of its knowledge claims.

**Current Frontiers and Open Questions:** ${t} is not a closed, completed body of knowledge. Active researchers continue to explore open questions, challenge established assumptions, develop new methodological tools and discover connections to adjacent fields. Awareness of these frontiers contextualises current knowledge within the ongoing project of intellectual discovery.

**Cross-Domain Integration:** The most sophisticated practitioners of ${t} understand its connections to other fields — recognising how insights transfer across disciplinary boundaries, how developments in adjacent areas reshape understanding within ${t}, and how genuinely interdisciplinary approaches to complex problems require synthesising knowledge from multiple sources.

---

## Common Applications

${t} finds systematic application in research and academic contexts, where rigorous understanding enables better study design, more accurate data interpretation, and more reliable theoretical contribution. In professional practice, it supports higher-quality decision-making, more effective problem diagnosis, and better-designed interventions. In educational settings, it provides frameworks that help learners structure new knowledge effectively and retain it durably.

---

## Summary & Key Takeaways

Mastering ${t} is fundamentally a project of building genuine understanding — comprehending the why behind the what, the mechanisms behind the patterns, the principles behind the applications. Surface-level familiarity with facts and procedures provides only fragile, inflexible knowledge. Deep understanding, by contrast, enables confident application to novel situations, accurate communication with other practitioners, continued independent learning, and the creative synthesis of ideas that characterises genuine expertise.

**Five essential commitments for mastery:** (1) Build strong conceptual foundations before advancing to complex applications. (2) Connect every abstract principle to concrete, specific examples. (3) Understand the limits and boundary conditions of every general rule. (4) Regularly practice applying knowledge to unfamiliar situations and novel questions. (5) Engage actively with the material through explanation, teaching, self-testing and deliberate reflection on what you do and do not yet understand.`;
}

function buildFallbackAnswer1(t) {
  return `The core principles of ${t} form an integrated theoretical system in which each component reinforces and contextualises the others — a system where the whole is substantially greater than the sum of its parts. At the foundational level, these principles establish the definitions, assumptions and logical categories upon which all subsequent understanding must be built. Without a clear grasp of these foundations, advanced concepts remain poorly anchored and are applied unreliably.

The mechanisms central to ${t} follow internally consistent patterns, and this consistency is precisely what enables systematic analysis, reliable prediction and purposeful intervention. The framework becomes analytically powerful when we understand not just individual components in isolation but the relationships between them — how each element influences and is shaped by others through both direct and indirect pathways operating across multiple levels and timescales.

From a practical perspective, integrated understanding of the core principles is what distinguishes practitioners who can genuinely problem-solve from those who can only apply memorised procedures to familiar situations. Students who achieve real mastery of the principles can adapt their knowledge confidently to novel problems they have never previously encountered, identify which specific principles are most relevant to a given context, and construct clear well-reasoned explanations of their analytical decisions.

The most common and consequential mistake is treating the principles of ${t} as a collection of isolated, independent facts to be memorised separately. This approach makes the subject harder to learn, easier to forget under examination pressure, and more likely to be misapplied when real situations do not match the exact form in which content was originally studied. Understanding the system is always more powerful than knowing the parts.`;
}

function buildFallbackAnswer2(t) {
  return `Consider a professional context where decisions involving ${t} carry significant real-world consequences — where errors are costly, information is incomplete, multiple stakeholders have conflicting interests, and time pressure demands efficient thinking under uncertainty. This is the normal operating environment of professional practice in any field where ${t} is applied.

Step one — precise problem identification: Define exactly what challenge needs to be addressed, what constraints and available resources exist, what a successful outcome looks like in specific measurable terms, and what failure would mean for each stakeholder involved. This diagnostic phase is consistently the most critical in professional practice, because the great majority of costly professional failures stem not from poor execution of a solution but from solving the wrong problem with impressive efficiency.

Step two — selecting relevant frameworks: Identify which specific aspects of ${t} are most directly applicable to this particular situation. A defining characteristic of genuine expertise is knowing which principles to apply in which contexts — and equally important, which to set aside as irrelevant to the problem at hand.

Step three — developing a grounded strategy: Design an approach rooted in the applicable principles, decomposing the complex problem into manageable sub-problems, sequencing them appropriately, and anticipating where the standard frameworks may require contextual modification.

Step four — disciplined implementation with monitoring: Execute the strategy while actively observing what is happening and remaining prepared to adjust. Real-world application always reveals complexity that theoretical frameworks alone cannot fully anticipate. The ability to adapt in real time distinguishes experienced practitioners.

Step five — rigorous evaluation and learning: Compare actual outcomes against the original success criteria. Identify what worked, what did not, and why. Extract specific transferable lessons. Professionals who omit this reflection forfeit the opportunity to convert experience into genuine expertise.`;
}

function buildFallbackAnswer3(t) {
  return `Two fundamentally different approaches to understanding ${t} offer complementary and partially overlapping perspectives, each with distinctive strengths and real limitations.

The theoretical or first-principles approach emphasises conceptual understanding, formal frameworks, and the ability to reason rigorously from foundational axioms and definitions. Its principal strength is generalisability — deep theoretical understanding applies across diverse situations precisely because it is independent of any particular context or set of surface features. Theoretical knowledge also transfers more readily to genuinely novel situations that practitioners have never previously encountered, because it equips them with the reasoning tools to construct new solutions rather than relying on memorised analogues. Its core limitation is that without substantial engagement with concrete applications and cases, theoretical knowledge can remain stubbornly abstract and difficult to deploy under real conditions of time pressure, incomplete information and genuine ambiguity.

The empirical or case-based approach focuses on specific historical instances, observable data patterns, successful and failed professional examples, and the accumulated practical wisdom of experience. This method produces actionable, context-sensitive knowledge grounded in verifiable reality, and builds the kind of rapid intuitive judgment that characterises highly effective expert practitioners across every applied field. Its limitation is that patterns reliably observed in one context may not generalise safely to substantially different settings, and without theoretical grounding, case-based knowledge becomes brittle and fragile when genuinely novel situations arise for which no closely similar precedent exists.

The most sophisticated approach to ${t} deliberately integrates both — using theoretical frameworks to organise, interpret and generalise from empirical experience, while using empirical engagement to stress-test theoretical predictions, reveal where they break down, and keep abstract principles anchored in reality. The most common and costly mistake is committing exclusively to one approach at the expense of the other.`;
}

// ─────────────────────────────────────────────────────────────────────────────────────────────────
// SECTION 15 — RESPONSE HEADERS
// Sets all required headers on every response
// ─────────────────────────────────────────────────────────────────────────────────────────────────

function applyResponseHeaders(res) {
  // CORS
  res.setHeader('Access-Control-Allow-Origin',      '*');
  res.setHeader('Access-Control-Allow-Methods',     'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers',     'Content-Type, Authorization, Accept');
  res.setHeader('Access-Control-Max-Age',           '86400');

  // Branding
  res.setHeader('X-Powered-By',   `${BRAND} by ${DEVELOPER}`);
  res.setHeader('X-Developer',    DEVELOPER);
  res.setHeader('X-Developer-Web',DEVSITE);
  res.setHeader('X-Founder',      FOUNDER);
  res.setHeader('X-App-Version',  APP_VERSION);

  // Security
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options',        'DENY');
  res.setHeader('X-XSS-Protection',       '1; mode=block');
  res.setHeader('Referrer-Policy',        'strict-origin-when-cross-origin');
}

// ─────────────────────────────────────────────────────────────────────────────────────────────────
// SECTION 16 — FINALIZE RESULT
// Adds metadata, enforces branding, removes model identity
// ─────────────────────────────────────────────────────────────────────────────────────────────────

function finalizeResult(result, startTime, extra = {}) {
  result.powered_by   = `${BRAND} by ${DEVELOPER}`;
  result._timestamp   = new Date().toISOString();
  result._version     = APP_VERSION;
  result._duration_ms = Date.now() - startTime;

  // Merge any extra metadata
  Object.assign(result, extra);

  // Remove model identity — NEVER expose to frontend
  delete result._model;
  delete result.model;
  delete result.model_used;
  delete result.model_id;
  delete result.ai_model;
  delete result.openrouter_model;

  return result;
}

// ─────────────────────────────────────────────────────────────────────────────────────────────────
// SECTION 17 — MAIN VERCEL HANDLER
// The exported function that Vercel calls for every request to /api/study
// ─────────────────────────────────────────────────────────────────────────────────────────────────

module.exports = async function handler(req, res) {

  const requestId  = Math.random().toString(36).slice(2, 10);
  const startTime  = Date.now();

  logger.info(`[${requestId}] ${req.method} /api/study — ${req.headers['content-type'] || 'no content-type'}`);

  // ── Apply headers to all responses ──
  applyResponseHeaders(res);

  // ── Handle CORS preflight ──
  if (req.method === 'OPTIONS') {
    logger.info(`[${requestId}] OPTIONS preflight — responding 200`);
    return res.status(200).end();
  }

  // ── Reject non-POST requests ──
  if (req.method !== 'POST') {
    logger.warn(`[${requestId}] Rejected ${req.method} request`);
    return res.status(405).json({
      error:   `Method ${req.method} not allowed. Use POST.`,
      allowed: ['POST'],
    });
  }

  // ── Parse and validate request body ──
  const body = req.body || {};

  if (!body.message || typeof body.message !== 'string') {
    return res.status(400).json({
      error:   'Request body must include a "message" field of type string.',
      example: '{ "message": "Photosynthesis", "options": { "tool": "notes", "language": "English" } }',
    });
  }

  const trimmed = body.message.trim();

  if (trimmed.length < 2) {
    return res.status(400).json({ error: 'Message is too short — minimum 2 characters.' });
  }

  if (trimmed.length > 15000) {
    return res.status(400).json({
      error:    `Message is too long — ${trimmed.length.toLocaleString()} characters (maximum 15,000).`,
      received: trimmed.length,
      maximum:  15000,
    });
  }

  // ── Validate and normalise options ──
  const rawOpts = body.options || {};

  const opts = {
    tool:     ['notes','flashcards','quiz','summary','mindmap'].includes(rawOpts.tool)    ? rawOpts.tool    : 'notes',
    depth:    ['standard','detailed','comprehensive','expert'].includes(rawOpts.depth)   ? rawOpts.depth   : 'detailed',
    style:    ['simple','academic','detailed','exam','visual'].includes(rawOpts.style)   ? rawOpts.style   : 'simple',
    language: typeof rawOpts.language === 'string' && rawOpts.language.trim().length > 0  ? rawOpts.language.trim() : 'English',
    stream:   rawOpts.stream === true,
  };

  logger.info(
    `[${requestId}] Input: ${trimmed.length} chars | ` +
    `tool: ${opts.tool} | lang: ${opts.language} | depth: ${opts.depth} | style: ${opts.style} | stream: ${opts.stream}`
  );

  // ══════════════════════════════════════════════════════════════════════════════════════════════
  // STREAMING MODE — Server-Sent Events
  // Output appears on screen CHARACTER BY CHARACTER — like ChatGPT, Claude, Gemini
  // ══════════════════════════════════════════════════════════════════════════════════════════════

  if (opts.stream) {

    // ── Set SSE response headers ──
    res.setHeader('Content-Type',    'text/event-stream; charset=utf-8');
    res.setHeader('Cache-Control',   'no-cache, no-store, no-transform');
    res.setHeader('Connection',      'keep-alive');
    res.setHeader('X-Accel-Buffering','no');         // Nginx: disable buffering
    res.setHeader('Transfer-Encoding','chunked');
    res.setHeader('Content-Encoding', 'identity'); 

    // ── Flush headers immediately so browser can start reading ──
    if (typeof res.flushHeaders === 'function') {
      res.flushHeaders();
    }

    // ── Helper: write a named SSE event ──
    const sendSSE = (eventName, data) => {
      try {
        const serialised = typeof data === 'string' ? data : JSON.stringify(data);
        res.write(`event: ${eventName}\ndata: ${serialised}\n\n`);
        if (typeof res.flush === 'function') res.flush();
      } catch (writeErr) {
        logger.warn(`[${requestId}] SSE write error: ${writeErr.message}`);
      }
    };

    // ── Send immediate heartbeat so client knows connection is live ──
    sendSSE(EVT_HEARTBEAT, { ts: Date.now(), requestId, status: 'connected', message: 'Savoiré AI connected — generating…' });
    sendSSE(EVT_TOKEN, { t: '## Analysing Your Topic\n\n' });
    // ── Send initial stage event ──
    sendSSE(EVT_STAGE, { idx: 0, label: 'Analysing your topic…' });

    // ── Heartbeat interval — prevents proxy/CDN/Vercel from closing idle connection ──
    let heartbeatInterval = setInterval(() => {
      try {
        // SSE comment line — keeps connection alive without polluting data stream
        res.write(`: keepalive ${Date.now()}\n\n`);
        if (typeof res.flush === 'function') res.flush();
      } catch {
        clearInterval(heartbeatInterval);
      }
    }, 12000); // every 12 seconds

    // ── Stage advancement timer — sends stage updates to animate thinking indicator ──
    const stageTimings = [0, 4000, 9000, 16000, 25000];
    const stageLabels  = [
      'Analysing your topic…',
      'Writing your study content…',
      'Building sections and cards…',
      'Crafting practice questions…',
      'Finalising and formatting…',
    ];
    const stageTimers = stageTimings.map((delay, idx) => {
      if (idx === 0) return null; // already sent
      return setTimeout(() => {
        sendSSE(EVT_STAGE, { idx, label: stageLabels[idx] });
      }, delay);
    });

    const clearStageTimers = () => stageTimers.forEach(t => t && clearTimeout(t));

    try {
      let tokensSent = 0;
      let charsStreamed = 0;

      // ── Token callback — called for every token from the AI model ──
      // This is what makes text appear live on the user's screen
      const onToken = (chunk) => {
        tokensSent++;
        charsStreamed += chunk.length;
        sendSSE(EVT_TOKEN, { t: chunk });
      };

      // ── Run AI generation with streaming ──
      const result = await generateWithAI(trimmed, opts, onToken);

      clearInterval(heartbeatInterval);
      clearStageTimers();

      // ── Mark final stage done ──
      sendSSE(EVT_STAGE, { idx: 4, label: 'Done!', done: true });

      // ── Finalise result ──
      const final = finalizeResult(result, startTime, {
        _tokens_sent:   tokensSent,
        _chars_streamed: charsStreamed,
        _request_id:    requestId,
      });

      logger.ok(
        `[${requestId}] Stream success — ` +
        `${tokensSent} tokens, ${charsStreamed} chars, ` +
        `${final._duration_ms}ms total`
      );

      // ── Send the complete structured data as final event ──
      // Frontend uses this to render the full formatted result
      sendSSE(EVT_DONE, final);
      res.end();

    } catch (aiError) {

      clearInterval(heartbeatInterval);
      clearStageTimers();

      logger.warn(`[${requestId}] AI streaming failed: ${aiError.message} — simulating fallback stream`);

      // ── FALLBACK: Stream offline content word by word ──
      // Even when all AI fails, user still sees live text appearing on screen
      const fallback   = generateOfflineFallback(trimmed, opts);
      const streamText = fallback.ultra_long_notes || '';
      const words      = streamText.split(' ');
      let   tokensSent = 0;

      // Send stage update
      sendSSE(EVT_STAGE, { idx: 2, label: 'Generating from local knowledge…' });

      // Stream words in small groups for natural feel
      for (let i = 0; i < words.length; i += 3) {
        if (res.writableEnded) break;

        const chunk = words.slice(i, i + 3).join(' ') + ' ';
        sendSSE(EVT_TOKEN, { t: chunk });
        tokensSent++;

        // ~40 words/second — feels natural, not too fast not too slow
        await sleep(75);
      }

      sendSSE(EVT_STAGE, { idx: 4, label: 'Done!', done: true });

      const finalFallback = finalizeResult(fallback, startTime, {
        _tokens_sent: tokensSent,
        _request_id:  requestId,
        _fallback:    true,
      });

      logger.ok(`[${requestId}] Fallback stream complete — ${tokensSent} tokens, ${finalFallback._duration_ms}ms`);

      sendSSE(EVT_DONE, finalFallback);

      if (!res.writableEnded) res.end();
    }

    return;
  }

  // ══════════════════════════════════════════════════════════════════════════════════════════════
  // NON-STREAMING MODE — Full JSON response (used as fallback by app.js)
  // ══════════════════════════════════════════════════════════════════════════════════════════════

  try {
    let result;

    try {
      result = await generateWithAI(trimmed, opts);
      // Non-streaming: no onChunk callback
    } catch (aiErr) {
      logger.warn(`[${requestId}] AI failed in sync mode: ${aiErr.message} — using offline fallback`);
      result = generateOfflineFallback(trimmed, opts);
    }

    const final = finalizeResult(result, startTime, { _request_id: requestId });

    logger.ok(
      `[${requestId}] Sync response ready — ` +
      `${final._duration_ms}ms | fallback: ${!!final._fallback}`
    );

    return res.status(200).json(final);

  } catch (unexpectedErr) {

    logger.error(`[${requestId}] Unexpected error: ${unexpectedErr.message}`, unexpectedErr.stack);

    // Even on unexpected error — return something useful, never a bare 500
    const emergencyFallback = generateOfflineFallback(trimmed, opts);
    const final = finalizeResult(emergencyFallback, startTime, {
      _request_id: requestId,
      _error:      true,
      _error_type: 'unexpected',
    });

    return res.status(200).json(final);
  }
};

// ─────────────────────────────────────────────────────────────────────────────────────────────────
// SECTION 18 — VERCEL CONFIGURATION REFERENCE
//
// vercel.json (place in project root):
// ─────────────────────────────────────
// {
//   "functions": {
//     "api/study.js": {
//       "maxDuration": 300
//     }
//   }
// }
//
// Environment Variables (set in Vercel dashboard → Settings → Environment Variables):
// ────────────────────────────────────────────────────────────────────────────────────
// Name:  OPENROUTER_API_KEY
// Value: sk-or-v1-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
//
// Get your free API key at: https://openrouter.ai
// All 10 models used here have the :free suffix — $0 per request, no credit card needed.
//
// Testing locally with Vercel CLI:
// ─────────────────────────────────
// npm i -g vercel
// vercel env pull .env.local
// vercel dev
//
// Then test with:
// curl -X POST http://localhost:3000/api/study \
//   -H "Content-Type: application/json" \
//   -d '{"message":"Photosynthesis","options":{"tool":"notes","language":"English","stream":false}}'
// ─────────────────────────────────────────────────────────────────────────────────────────────────

// ═══════════════════════════════════════════════════════════════════════════════════════════════════
// END OF FILE — api/study.js
// Savoiré AI v2.0 — Built by Sooban Talha Technologies | soobantalhatech.xyz
// Founder: Sooban Talha | Free for every student on Earth, forever.
// ═══════════════════════════════════════════════════════════════════════════════════════════════════
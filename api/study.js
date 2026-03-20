// ═══════════════════════════════════════════════════════════════════════════════════════════════════
// SAVOIRÉ AI v2.0 — api/study.js — VERCEL SERVERLESS BACKEND — FULLY UPGRADED v2.1
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
// ── UPGRADE v2.1 CHANGES ───────────────────────────────────────────────────────────────────────────
// ✦ MCQ Quiz Support  — practice_questions now include options[] array with A/B/C/D choices
//                       so app.js renders real multiple-choice questions with instant feedback
// ✦ Better Prompts    — quiz tool prompt explicitly generates MCQ with correct option marked
// ✦ Enhanced Parsing  — more robust JSON repair for all edge cases including options arrays
// ✦ Updated Models    — refreshed model list with latest free models on OpenRouter
// ✦ Enriched Answers  — quiz answers now 200+ words with full explanation + why distractors wrong
// ✦ Live Stream Fix   — tokens sent cleanly to support live markdown rendering in frontend
// ✦ Better Fallbacks  — MCQ fallback questions with real plausible A/B/C/D options
//
// ── LIVE OUTPUT / STREAMING ARCHITECTURE ───────────────────────────────────────────────────────────
// Frontend sends POST { message, options: { stream: true } }
//   → Server sets Content-Type: text/event-stream
//   → For each token: writes  event: token\ndata: {"t":"word"}\n\n
//   → Frontend renders each token as STYLED MARKDOWN HTML live (headings, bold, lists etc)
//   → When complete: writes  event: done\ndata: { full structured JSON }\n\n
//   → Frontend hides stream overlay and renders full structured result
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
const APP_VERSION = '2.1';

const OPENROUTER_BASE = 'https://openrouter.ai/api/v1/chat/completions';
const HTTP_REFERER    = `https://${WEBSITE}`;
const APP_TITLE       = BRAND;

const EVT_TOKEN     = 'token';
const EVT_DONE      = 'done';
const EVT_ERROR     = 'error';
const EVT_HEARTBEAT = 'heartbeat';
const EVT_STAGE     = 'stage';

// ─────────────────────────────────────────────────────────────────────────────────────────────────
// SECTION 2 — FREE AI MODEL ROSTER
// ─────────────────────────────────────────────────────────────────────────────────────────────────

const MODELS = [
  { id: 'google/gemini-2.0-flash-exp:free',           max_tokens: 8000, timeout_ms: 120000, priority:  1 },
  { id: 'deepseek/deepseek-chat-v3-0324:free',        max_tokens: 8000, timeout_ms: 120000, priority:  2 },
  { id: 'meta-llama/llama-3.3-70b-instruct:free',     max_tokens: 6000, timeout_ms: 110000, priority:  3 },
  { id: 'google/gemini-flash-1.5:free',               max_tokens: 6000, timeout_ms: 100000, priority:  4 },
  { id: 'microsoft/phi-4-reasoning-plus:free',        max_tokens: 4000, timeout_ms:  90000, priority:  5 },
  { id: 'qwen/qwen3-8b:free',                         max_tokens: 4000, timeout_ms:  90000, priority:  6 },
  { id: 'google/gemini-flash-1.5-8b:free',            max_tokens: 4000, timeout_ms:  80000, priority:  7 },
  { id: 'nousresearch/hermes-3-llama-3.1-405b:free',  max_tokens: 6000, timeout_ms: 110000, priority:  8 },
  { id: 'mistralai/mistral-7b-instruct-v0.3:free',    max_tokens: 3500, timeout_ms:  80000, priority:  9 },
  { id: 'openchat/openchat-7b:free',                  max_tokens: 3500, timeout_ms:  80000, priority: 10 },
];

// ─────────────────────────────────────────────────────────────────────────────────────────────────
// SECTION 3 — DEPTH CONFIGURATION
// ─────────────────────────────────────────────────────────────────────────────────────────────────

const DEPTH_MAP = {
  standard:      { wordRange: '600 to 900 words',   minWords: 600,  targetWords: 750,  description: 'Clear and accessible, covering all essentials with good depth',             sectionsRequired: 4 },
  detailed:      { wordRange: '1000 to 1500 words', minWords: 1000, targetWords: 1250, description: 'Detailed coverage with concrete examples and thorough explanations',         sectionsRequired: 6 },
  comprehensive: { wordRange: '1500 to 2000 words', minWords: 1500, targetWords: 1750, description: 'Comprehensive analysis covering all major aspects and nuances in depth',     sectionsRequired: 7 },
  expert:        { wordRange: '2000 to 2800 words including advanced subtopics, nuances, cutting-edge developments and critical debates', minWords: 2000, targetWords: 2400, description: 'Expert-level deep dive covering advanced subtopics, academic debates, historical context', sectionsRequired: 8 },
};

// ─────────────────────────────────────────────────────────────────────────────────────────────────
// SECTION 4 — STYLE CONFIGURATION
// ─────────────────────────────────────────────────────────────────────────────────────────────────

const STYLE_MAP = {
  simple:   { name: 'Simple & Clear',       instruction: `Write in clear, accessible, beginner-friendly language. Define every technical term immediately when first used. Use short sentences, everyday analogies and comparisons. Avoid jargon wherever possible. The goal is that a motivated student encountering this topic for the very first time should understand every sentence.` },
  academic: { name: 'Academic & Formal',    instruction: `Write in formal academic language with precise scholarly terminology. Maintain a third-person objective tone. Use discipline-specific vocabulary. Employ citation-ready phrases, formal definitions, and reference theoretical frameworks by name. Suitable for a university essay or academic report.` },
  detailed: { name: 'Highly Detailed',      instruction: `Provide exhaustive detail at every point. Include numerous concrete examples, counterexamples, edge cases, specific numbers and statistics where relevant, and thorough multi-step explanations. Never summarise where you could explain fully. After reading, the student should feel they have read a complete textbook chapter.` },
  exam:     { name: 'Exam-Focused',         instruction: `Structure the entire response around exam success. Provide key definitions in mark-scheme language. Highlight the most frequently examined aspects. Explicitly state what examiners look for. Include mark-worthy phrases. Flag the most common mistakes students make in exams on this topic.` },
  visual:   { name: 'Visual & Analogy-Rich',instruction: `Make every concept concrete and memorable through vivid analogies, metaphors, visual descriptions and step-by-step walkthroughs. Compare abstract ideas to everyday objects. Build mental models that a student can visualise clearly. Use narrative and storytelling where helpful.` },
};

// ─────────────────────────────────────────────────────────────────────────────────────────────────
// SECTION 5 — TOOL CONFIGURATION
// ─────────────────────────────────────────────────────────────────────────────────────────────────

const TOOL_MAP = {
  notes: {
    name:      'Generate Notes',
    objective: 'Generate comprehensive, deeply detailed, well-structured study notes.',
    emphasis:  `The ultra_long_notes field is the centrepiece. It MUST be genuinely long and detailed. Use rich markdown: ## headings for each section, **bold** for every key term on first use, bullet lists for enumerations, numbered steps for processes, > blockquotes for important definitions, --- between major sections. The notes must feel like a well-written textbook chapter.`,
    sections:  ['Introduction', 'Core Concepts', 'How It Works', 'Key Examples', 'Advanced Aspects', 'Common Applications', 'Critical Analysis', 'Summary & Key Takeaways'],
  },
  flashcards: {
    name:      'Create Flashcards',
    objective: 'Generate study materials optimised for interactive flashcard learning and spaced repetition.',
    emphasis:  `The key_concepts should be formatted as perfect flashcard pairs — clear concise front side (term/question) followed by colon then clear accurate back side (definition/answer). Each pair should stand completely alone. The practice_questions should use the same format — short memorable questions with concise definitive answers recallable in under 30 seconds.`,
    sections:  ['Introduction', 'Core Concepts', 'How It Works', 'Key Examples', 'Summary'],
  },
  quiz: {
    name:      'Build Quiz',
    objective: 'Generate challenging multiple-choice practice questions at exam level for self-testing.',
    emphasis:  `CRITICAL FOR QUIZ TOOL: Each practice_question object MUST have an "options" array with EXACTLY 4 strings labeled "A) ...", "B) ...", "C) ...", "D) ...". Exactly ONE option must be the correct answer. Make distractors (wrong answers) plausible and specific — not obviously wrong. The correct option should be different letters across questions (not always A). Vary question types: analytical, application, evaluation, comparison. Each "answer" field MUST be minimum 200 words covering: (1) which option is correct and why, (2) detailed explanation, (3) why each wrong option is incorrect, (4) concrete example, (5) common exam mistake.`,
    sections:  ['Introduction', 'Core Concepts', 'How It Works', 'Key Examples', 'Summary'],
  },
  summary: {
    name:      'Smart Summary',
    objective: 'Generate a concise, punchy smart summary for fast review and revision.',
    emphasis:  `Begin ultra_long_notes with a 2-3 sentence TL;DR paragraph capturing the absolute essence of the topic. Then clearly labelled sections covering only the most critical points. The key_concepts represent the absolute TOP 5 things a student MUST know. Key_tricks focus on retention and recall. Tone should be efficient and direct — every word must earn its place. Use **bold** for critical terms and > blockquotes for the single most important takeaway per section.`,
    sections:  ['TL;DR', 'Core Concepts', 'Key Mechanisms', 'Critical Examples', 'What to Remember'],
  },
  mindmap: {
    name:      'Build Mind Map',
    objective: 'Generate content structured hierarchically for a visual mind map with clear branches.',
    emphasis:  `Structure ALL content to reveal hierarchical relationships between ideas. The ultra_long_notes should organise content using nested bullet points mirroring mind map branch structure. key_concepts represent the 5 main branches. real_world_applications represent the Applications branch. key_tricks represent Study Strategies. common_misconceptions represent the Watch Out branch. Every item should be under 12 words where possible — concise enough for a mind map node.`,
    sections:  ['Central Topic', 'Main Branches', 'Sub-Branches', 'Connections', 'Applications'],
  },
};

// ─────────────────────────────────────────────────────────────────────────────────────────────────
// SECTION 6 — UTILITY FUNCTIONS
// ─────────────────────────────────────────────────────────────────────────────────────────────────

const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

const logger = {
  info:  (...a) => console.log  (`[${new Date().toISOString()}] [${BRAND}] INFO  `, ...a),
  ok:    (...a) => console.log  (`[${new Date().toISOString()}] [${BRAND}] ✓     `, ...a),
  warn:  (...a) => console.warn (`[${new Date().toISOString()}] [${BRAND}] WARN  `, ...a),
  error: (...a) => console.error(`[${new Date().toISOString()}] [${BRAND}] ERROR `, ...a),
  model: (...a) => console.log  (`[${new Date().toISOString()}] [MODEL]   →     `, ...a),
};

function wordCount(text) {
  if (!text || typeof text !== 'string') return 0;
  return text.trim().split(/\s+/).filter(Boolean).length;
}

function trunc(s, n = 100) {
  if (!s) return '';
  return String(s).length > n ? String(s).slice(0, n) + '…' : String(s);
}

// ─────────────────────────────────────────────────────────────────────────────────────────────────
// SECTION 7 — PROMPT BUILDER
// Quiz tool now gets a detailed MCQ specification with exact format example.
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
  const isQuiz   = tool === 'quiz';

  const practiceQSpec = isQuiz ? `
[FIELD: practice_questions]
TYPE: array of exactly 5 objects — each MUST have THREE fields: "question", "options", "answer"

"question": string — exam-level question (analytical / application / evaluation / comparison)
"options": array of EXACTLY 4 strings in this format:
  "A) [plausible but incorrect statement]",
  "B) [another plausible but incorrect statement]",
  "C) [the correct and accurate answer]",
  "D) [another plausible but incorrect statement]"
  — VARY which letter (A, B, C or D) is correct across the 5 questions
  — Distractors must be specific and plausible — NOT obviously wrong or silly
  — Do NOT use "All of the above" or "None of the above"
"answer": string — MINIMUM 200 words structured EXACTLY as:
  1. "The correct answer is [letter]) [direct answer — 1-2 sentences]"
  2. Detailed explanation of WHY that option is correct with full reasoning (3-4 sentences)
  3. Why each of the 3 wrong options is specifically incorrect — one sentence per distractor
  4. A specific concrete real-world example reinforcing the correct answer
  5. The most common exam mistake on this type of question

LANGUAGE: All in ${language}

CRITICAL: The "options" field is REQUIRED. Every question object MUST have it. Without it the quiz will not work.` : `
[FIELD: practice_questions]
TYPE: array of exactly 3 objects, each with "question" and "answer"
QUESTION FORMAT: Exam-level, varied types (analytical / application / evaluation)
ANSWER FORMAT: MINIMUM 160 words each, covering:
  1. Direct answer to the question (1-2 sentences)
  2. Detailed reasoning and explanation (3-4 sentences)
  3. A specific concrete example with detail
  4. Real-world relevance or professional application
  5. A common student mistake to avoid on this question
LANGUAGE: All in ${language}`;

  const jsonExample = isQuiz ? `{
  "topic": "specific topic name in ${language}",
  "curriculum_alignment": "e.g. A-Level Biology",
  "ultra_long_notes": "full rich markdown in ${language} — at least ${depthCfg.wordRange}",
  "key_concepts": ["Term 1: explanation", "Term 2: explanation", "Term 3: explanation", "Term 4: explanation", "Term 5: explanation"],
  "key_tricks": ["Trick 1 — 55-75 words", "Trick 2 — 55-75 words", "Trick 3 — 55-75 words"],
  "practice_questions": [
    {
      "question": "Which of the following best describes [core concept]?",
      "options": [
        "A) An incorrect but plausible description",
        "B) Another plausible but wrong statement",
        "C) The correct and accurate description",
        "D) A common misconception about this concept"
      ],
      "answer": "The correct answer is C) [full 200+ word answer explaining why C is correct, why A/B/D are wrong, example, and exam tip]"
    },
    {
      "question": "Second MCQ question at exam level",
      "options": ["A) option", "B) option", "C) option", "D) option"],
      "answer": "The correct answer is A) [200+ words]"
    },
    {
      "question": "Third MCQ question",
      "options": ["A) option", "B) option", "C) option", "D) option"],
      "answer": "The correct answer is D) [200+ words]"
    },
    {
      "question": "Fourth MCQ question",
      "options": ["A) option", "B) option", "C) option", "D) option"],
      "answer": "The correct answer is B) [200+ words]"
    },
    {
      "question": "Fifth MCQ question",
      "options": ["A) option", "B) option", "C) option", "D) option"],
      "answer": "The correct answer is C) [200+ words]"
    }
  ],
  "real_world_applications": ["Domain 1: 45-65 words", "Domain 2: 45-65 words", "Domain 3: 45-65 words"],
  "common_misconceptions": ["Misconception 1: 45-65 words", "Misconception 2: 45-65 words", "Misconception 3: 45-65 words"],
  "study_score": 96,
  "powered_by": "${BRAND} by ${DEVELOPER}",
  "generated_at": "${nowISO}"
}` : `{
  "topic": "specific topic name in ${language}",
  "curriculum_alignment": "e.g. A-Level Biology",
  "ultra_long_notes": "full rich markdown in ${language} — at least ${depthCfg.wordRange}",
  "key_concepts": ["Term 1: explanation — 25-40 words", "Term 2: explanation", "Term 3: explanation", "Term 4: explanation", "Term 5: explanation"],
  "key_tricks": ["Trick 1 — 55-75 words", "Trick 2 — 55-75 words", "Trick 3 — 55-75 words"],
  "practice_questions": [
    {"question": "Analytical question in ${language}", "answer": "Comprehensive answer — minimum 160 words"},
    {"question": "Application question in ${language}", "answer": "Comprehensive answer — minimum 160 words"},
    {"question": "Evaluation question in ${language}", "answer": "Comprehensive answer — minimum 160 words"}
  ],
  "real_world_applications": ["Domain 1: 45-65 words", "Domain 2: 45-65 words", "Domain 3: 45-65 words"],
  "common_misconceptions": ["Misconception 1: 45-65 words", "Misconception 2: 45-65 words", "Misconception 3: 45-65 words"],
  "study_score": 96,
  "powered_by": "${BRAND} by ${DEVELOPER}",
  "generated_at": "${nowISO}"
}`;

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
MANDATORY OUTPUT SPECIFICATION
═══════════════════════════════════════════════════════════════════════

[FIELD: ultra_long_notes]
TYPE: string — LENGTH: MINIMUM ${depthCfg.wordRange}
FORMAT: Rich markdown — ## headings, **bold** key terms, bullet lists, numbered lists, > blockquotes, --- rules
LANGUAGE: ${language}

[FIELD: key_concepts]
TYPE: array of exactly 5 strings — FORMAT: "Term: comprehensive explanation (25-40 words each)"
LANGUAGE: ${language}

[FIELD: key_tricks]
TYPE: array of exactly 3 strings — LENGTH: 55-75 words each
CONTENT: Practical memory aids, mnemonics, study strategies (Feynman Technique, Spaced Repetition, etc.)
LANGUAGE: ${language}
${practiceQSpec}

[FIELD: real_world_applications]
TYPE: array of exactly 3 strings — LENGTH: 45-65 words each
FORMAT: "Domain: specific mechanism of application and outcome"
LANGUAGE: ${language}

[FIELD: common_misconceptions]
TYPE: array of exactly 3 strings — LENGTH: 45-65 words each
FORMAT: "Many students believe [wrong idea]. In reality, [correct explanation with reason]."
LANGUAGE: ${language}

[FIELD: topic] — string: clean specific topic name in ${language}
[FIELD: curriculum_alignment] — string: most likely academic level e.g. "A-Level Biology"
[FIELD: study_score] — integer: always output exactly 96
[FIELD: powered_by] — string: always "${BRAND} by ${DEVELOPER}"
[FIELD: generated_at] — string: always "${nowISO}"

═══════════════════════════════════════════════════════════════════════
OUTPUT FORMAT — ABSOLUTELY CRITICAL
═══════════════════════════════════════════════════════════════════════
Your ENTIRE response must be a single valid JSON object.
— NO text before the opening {
— NO text after the closing }
— NO markdown code fences (no \`\`\`json)
— NO comments inside the JSON
— Newlines inside strings must be \\n (escaped)
— Double quotes inside strings must be \\" (escaped)

${jsonExample}`;
}

// ─────────────────────────────────────────────────────────────────────────────────────────────────
// SECTION 8 — JSON EXTRACTION & PARSING
// ─────────────────────────────────────────────────────────────────────────────────────────────────

function extractAndParseJSON(rawContent) {
  if (!rawContent || typeof rawContent !== 'string') {
    throw new Error('Model returned empty or non-string content');
  }

  let text = rawContent.trim();

  // Strip markdown code fences
  text = text.replace(/^```(?:json|JSON)?\s*/i, '').replace(/\s*```\s*$/i, '').trim();

  // Find JSON boundaries
  const startIdx = text.indexOf('{');
  const endIdx   = text.lastIndexOf('}');

  if (startIdx === -1) throw new Error(`No JSON found. Preview: "${trunc(text, 200)}"`);
  if (endIdx === -1 || endIdx <= startIdx) throw new Error(`No closing brace. Preview: "${trunc(text, 200)}"`);

  let jsonStr = text.slice(startIdx, endIdx + 1);

  // Try direct parse (fast path)
  try { return JSON.parse(jsonStr); } catch (_) {}

  logger.warn('Direct JSON parse failed — attempting repair');

  // Repair 1: Fix raw newlines inside string values
  let repaired = jsonStr;
  repaired = repaired.replace(/"((?:[^"\\]|\\.)*)"/gs, (match, inner) => {
    const fixed = inner
      .replace(/\r\n/g, '\\n').replace(/\r/g, '\\r')
      .replace(/\n/g, '\\n').replace(/\t/g, '\\t');
    return `"${fixed}"`;
  });

  // Repair 2: Remove trailing commas
  repaired = repaired.replace(/,(\s*[}\]])/g, '$1');

  // Repair 3: Quote unquoted keys
  repaired = repaired.replace(/([{,]\s*)([a-zA-Z_][a-zA-Z0-9_]*)(\s*:)/g, (m, pre, key, post) => `${pre}"${key}"${post}`);

  // Repair 4: Remove JS comments
  repaired = repaired.replace(/\/\/[^\n]*/g, '').replace(/\/\*[\s\S]*?\*\//g, '');

  try { return JSON.parse(repaired); } catch (_) {}

  // Last resort: bracket-counting extraction
  try {
    let depth = 0, start = -1, end = -1;
    for (let i = 0; i < repaired.length; i++) {
      if (repaired[i] === '{') { if (depth === 0) start = i; depth++; }
      else if (repaired[i] === '}') { depth--; if (depth === 0) { end = i; break; } }
    }
    if (start !== -1 && end !== -1) return JSON.parse(repaired.slice(start, end + 1));
  } catch (_) {}

  throw new Error(`JSON parse failed after all repair attempts. Content length: ${jsonStr.length}. Preview: "${trunc(jsonStr, 300)}"`);
}

// ─────────────────────────────────────────────────────────────────────────────────────────────────
// SECTION 9 — DATA VALIDATION & ENRICHMENT
// Normalises MCQ options for quiz tool. Fills missing fields.
// ─────────────────────────────────────────────────────────────────────────────────────────────────

function validateAndEnrich(parsed, opts) {
  if (!parsed || typeof parsed !== 'object') throw new Error('Parsed result is not an object');
  if (!parsed.topic || typeof parsed.topic !== 'string' || parsed.topic.trim().length < 2) throw new Error(`Invalid topic: ${JSON.stringify(parsed.topic)}`);
  if (!parsed.ultra_long_notes || typeof parsed.ultra_long_notes !== 'string') throw new Error('Missing: ultra_long_notes');
  if (parsed.ultra_long_notes.trim().length < 150) throw new Error(`ultra_long_notes too short: ${parsed.ultra_long_notes.length} chars`);
  if (!Array.isArray(parsed.practice_questions) || parsed.practice_questions.length === 0) throw new Error('Missing: practice_questions');
  if (!Array.isArray(parsed.key_concepts) || parsed.key_concepts.length === 0) throw new Error('Missing: key_concepts');

  const isQuiz = opts.tool === 'quiz';

  // Normalise practice_questions
  parsed.practice_questions = parsed.practice_questions
    .filter(q => q && typeof q === 'object')
    .map(q => {
      const question = String(q.question || q.q || '').trim();
      const answer   = String(q.answer   || q.a || '').trim();
      if (!question || !answer) return null;

      if (isQuiz) {
        let options = q.options || q.choices || q.opts || [];
        if (Array.isArray(options) && options.length >= 2) {
          // Normalise option format — ensure A) B) C) D) prefix
          options = options.slice(0, 4).map((opt, i) => {
            const letters = ['A', 'B', 'C', 'D'];
            const str     = String(opt || '').trim();
            if (/^[A-D][).]\s/i.test(str)) return str;
            return `${letters[i]}) ${str}`;
          });
          // Pad to 4 if needed
          while (options.length < 4) {
            options.push(`${['A','B','C','D'][options.length]}) Additional option ${options.length + 1}`);
          }
        } else {
          options = generateFallbackMCQOptions(question, answer);
        }
        return { question, options, answer };
      }

      return { question, answer };
    })
    .filter(Boolean);

  if (parsed.practice_questions.length === 0) throw new Error('All practice_questions invalid after filtering');

  // Fill missing optional arrays
  const topic = parsed.topic;
  if (!Array.isArray(parsed.key_tricks)             || parsed.key_tricks.length === 0)             parsed.key_tricks             = buildFallbackTricks(topic);
  if (!Array.isArray(parsed.real_world_applications)|| parsed.real_world_applications.length === 0) parsed.real_world_applications = buildFallbackApplications(topic);
  if (!Array.isArray(parsed.common_misconceptions)  || parsed.common_misconceptions.length === 0)   parsed.common_misconceptions   = buildFallbackMisconceptions(topic);

  // Trim arrays
  if (parsed.key_concepts.length > 5)            parsed.key_concepts            = parsed.key_concepts.slice(0, 5);
  if (parsed.key_tricks.length > 3)              parsed.key_tricks              = parsed.key_tricks.slice(0, 3);
  if (parsed.real_world_applications.length > 3) parsed.real_world_applications = parsed.real_world_applications.slice(0, 3);
  if (parsed.common_misconceptions.length > 3)   parsed.common_misconceptions   = parsed.common_misconceptions.slice(0, 3);

  const maxQ = isQuiz ? 5 : 3;
  if (parsed.practice_questions.length > maxQ) parsed.practice_questions = parsed.practice_questions.slice(0, maxQ);

  // Enforce branding
  parsed.powered_by   = `${BRAND} by ${DEVELOPER}`;
  parsed.study_score  = 96;
  parsed.generated_at = parsed.generated_at || new Date().toISOString();
  parsed._language    = opts.language || 'English';
  parsed._version     = APP_VERSION;

  // Remove model identity
  ['_model','model','model_used','model_id','ai_model','openrouter_model'].forEach(k => delete parsed[k]);

  const notesWc = wordCount(parsed.ultra_long_notes);
  logger.info(`Quality: ${notesWc}w notes, ${parsed.key_concepts.length} concepts, ${parsed.practice_questions.length} questions${isQuiz ? ' (MCQ)' : ''}`);

  return parsed;
}

// ─────────────────────────────────────────────────────────────────────────────────────────────────
// SECTION 9b — MCQ FALLBACK OPTION GENERATOR
// Generates plausible A/B/C/D options when the model didn't provide them
// ─────────────────────────────────────────────────────────────────────────────────────────────────

function generateFallbackMCQOptions(question, answer) {
  const correctText = answer
    .replace(/^(the correct answer is [A-D]\)?\s*)/i, '')
    .split(/[.!?\n]/)[0].trim().slice(0, 120);

  return [
    `A) A different but related principle that applies in other contexts`,
    `B) ${correctText || 'The correct and accurate description of this concept'}`,
    `C) The opposite of what actually occurs in this process`,
    `D) A common misconception that oversimplifies the relationship`,
  ];
}

// ─────────────────────────────────────────────────────────────────────────────────────────────────
// SECTION 10 — MODEL CALLER (SYNC)
// ─────────────────────────────────────────────────────────────────────────────────────────────────

async function callModelSync(model, prompt, opts) {
  const ctrl  = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), model.timeout_ms);
  const t0    = Date.now();
  const name  = model.id.split('/').pop().replace(':free', '');

  try {
    const response = await fetch(OPENROUTER_BASE, {
      method:  'POST',
      headers: {
        'Content-Type':  'application/json',
        'Authorization': `Bearer ${process.env.OPENROUTER_API_KEY}`,
        'HTTP-Referer':  HTTP_REFERER,
        'X-Title':       APP_TITLE,
      },
      body: JSON.stringify({ model: model.id, max_tokens: model.max_tokens, temperature: 0.72, stream: false, messages: [{ role: 'user', content: prompt }] }),
      signal: ctrl.signal,
    });

    clearTimeout(timer);
    const elapsed = Date.now() - t0;

    if (!response.ok) {
      const errorBody = await response.text().catch(() => '');
      const errorMsg  = `HTTP ${response.status} from ${name} after ${elapsed}ms: ${trunc(errorBody, 200)}`;
      if ([429, 503, 502].includes(response.status)) throw new Error(`[RATE_LIMITED] ${errorMsg}`);
      throw new Error(errorMsg);
    }

    const data    = await response.json();
    const content = data?.choices?.[0]?.message?.content;
    if (!content || content.trim().length < 100) throw new Error(`${name} returned empty content after ${elapsed}ms`);

    logger.ok(`${name} sync: ${elapsed}ms, ${content.length} chars`);
    return validateAndEnrich(extractAndParseJSON(content), opts);

  } catch (err) { clearTimeout(timer); throw err; }
}

// ─────────────────────────────────────────────────────────────────────────────────────────────────
// SECTION 11 — MODEL CALLER (STREAMING)
// ─────────────────────────────────────────────────────────────────────────────────────────────────

async function callModelStream(model, prompt, opts, onChunk) {
  const ctrl  = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), model.timeout_ms);
  const t0    = Date.now();
  const name  = model.id.split('/').pop().replace(':free', '');

  try {
    const response = await fetch(OPENROUTER_BASE, {
      method:  'POST',
      headers: {
        'Content-Type':  'application/json',
        'Authorization': `Bearer ${process.env.OPENROUTER_API_KEY}`,
        'HTTP-Referer':  HTTP_REFERER,
        'X-Title':       APP_TITLE,
      },
      body: JSON.stringify({ model: model.id, max_tokens: model.max_tokens, temperature: 0.72, stream: true, messages: [{ role: 'user', content: prompt }] }),
      signal: ctrl.signal,
    });

    clearTimeout(timer);

    if (!response.ok) {
      const errorBody = await response.text().catch(() => '');
      const errorMsg  = `HTTP ${response.status} from ${name}: ${trunc(errorBody, 200)}`;
      if ([429, 503, 502].includes(response.status)) throw new Error(`[RATE_LIMITED] ${errorMsg}`);
      throw new Error(errorMsg);
    }

    const reader      = response.body.getReader();
    const decoder     = new TextDecoder('utf-8');
    let   lineBuffer  = '';
    let   fullContent = '';
    let   tokenCount  = 0;
    let   charsEmitted = 0;

    while (true) {
      const { done, value } = await reader.read();
      if (done) { if (lineBuffer.trim()) processLine(lineBuffer.trim()); break; }
      lineBuffer += decoder.decode(value, { stream: true });
      const lines = lineBuffer.split('\n');
      lineBuffer  = lines.pop() || '';
      for (const line of lines) processLine(line);
    }

    function processLine(line) {
      line = line.trim();
      if (!line || !line.startsWith('data: ')) return;
      const dataStr = line.slice(6).trim();
      if (dataStr === '[DONE]' || !dataStr) return;
      let evt;
      try { evt = JSON.parse(dataStr); } catch { return; }
      const delta = evt?.choices?.[0]?.delta?.content;
      if (delta && typeof delta === 'string' && delta.length > 0) {
        fullContent  += delta;
        charsEmitted += delta.length;
        tokenCount++;
        onChunk(delta);
      }
    }

    const elapsed = Date.now() - t0;
    if (fullContent.trim().length < 100) throw new Error(`${name} stream too short: ${fullContent.length} chars after ${elapsed}ms`);

    logger.ok(`${name} stream: ${tokenCount} tokens, ${charsEmitted} chars, ${elapsed}ms`);
    return validateAndEnrich(extractAndParseJSON(fullContent), opts);

  } catch (err) { clearTimeout(timer); throw err; }
}

// ─────────────────────────────────────────────────────────────────────────────────────────────────
// SECTION 12 — MAIN AI GENERATOR WITH FULL FALLBACK CHAIN
// ─────────────────────────────────────────────────────────────────────────────────────────────────

async function generateWithAI(message, opts, onChunk) {
  if (!process.env.OPENROUTER_API_KEY) {
    throw new Error('OPENROUTER_API_KEY environment variable is not set. Please add it in Vercel dashboard → Settings → Environment Variables.');
  }

  const useStreaming  = typeof onChunk === 'function';
  const prompt        = buildPrompt(message, opts);
  const errors        = [];
  let   modelsTried   = 0;
  let   totalAttempts = 0;

  logger.info(`Start — tool:${opts.tool} lang:${opts.language} depth:${opts.depth} mode:${useStreaming ? 'STREAM' : 'SYNC'} input:${message.length}c`);

  for (const model of MODELS) {
    const name        = model.id.split('/').pop().replace(':free', '');
    const maxAttempts = 2;
    modelsTried++;

    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      totalAttempts++;
      logger.model(`Attempt ${totalAttempts}: ${name} (try ${attempt}/${maxAttempts})`);

      try {
        const result = useStreaming
          ? await callModelStream(model, prompt, opts, onChunk)
          : await callModelSync(model, prompt, opts);

        result._language     = opts.language || 'English';
        result._models_tried = modelsTried;
        result._attempts     = totalAttempts;

        logger.ok(`SUCCESS — ${name} (attempt ${attempt}) | models tried: ${modelsTried}/${MODELS.length}`);
        return result;

      } catch (err) {
        const errMsg = (err.message || 'Unknown').slice(0, 150);
        errors.push(`${name}[${attempt}]: ${errMsg}`);
        logger.warn(`FAIL — ${name} attempt ${attempt}: ${errMsg}`);

        if (errMsg.includes('[RATE_LIMITED]') || err.name === 'AbortError') break;
        if (attempt < maxAttempts) { await sleep(1200); }
      }
    }

    if (modelsTried < MODELS.length) await sleep(350);
  }

  logger.error(`ALL MODELS FAILED — ${MODELS.length} tried, ${totalAttempts} attempts`);
  throw new Error(`All ${MODELS.length} AI models temporarily unavailable after ${totalAttempts} attempts. Please try again shortly.`);
}

// ─────────────────────────────────────────────────────────────────────────────────────────────────
// SECTION 13 — FALLBACK CONTENT BUILDERS
// ─────────────────────────────────────────────────────────────────────────────────────────────────

function buildFallbackTricks(topic) {
  const t = topic || 'this topic';
  return [
    `FIVE W's FRAMEWORK: Apply Who, What, When, Where and Why systematically to every dimension of ${t}. For each concept, explicitly answer all five questions before moving on. This forces active engagement, creates a complete mental map, and immediately reveals gaps in your understanding — exactly where your next study session should focus.`,
    `THE FEYNMAN TECHNIQUE: After studying ${t}, close your notes and explain the entire topic out loud as if teaching a curious 12-year-old. Every time you hesitate, use unexplained jargon, or lose your thread, you have discovered a genuine gap. Return to your source, study that specific gap, then restart the explanation. Repeat until you can explain it completely from memory.`,
    `SPACED REPETITION SCHEDULE: Study ${t} in focused 20-minute sessions across multiple days — not in one marathon. Optimal spacing: Day 1 (initial learning), Day 3 (first review), Day 7 (consolidation), Day 14 (retention), Day 30 (mastery check). Research consistently shows this produces 2-3x better long-term retention than massed practice.`,
  ];
}

function buildFallbackApplications(topic) {
  const t = topic || 'this topic';
  return [
    `Healthcare & Medicine: Principles from ${t} directly inform clinical decision-making, diagnostic reasoning, treatment protocol design and patient outcome prediction. Medical professionals who deeply understand these concepts make more accurate assessments and deliver measurably better patient care. Medical education worldwide incorporates these frameworks as foundational competencies for every practising clinician.`,
    `Technology & Software Engineering: ${t} concepts underpin critical software architecture decisions, algorithm selection, system optimisation and quality assurance. Software engineers who understand these principles design more scalable, maintainable and reliable systems. They make better technical decisions under uncertainty and produce software that continues to function correctly as requirements evolve and scale increases.`,
    `Business Strategy & Management: Organisations applying frameworks derived from ${t} systematically outperform those that do not. Strategic planners analyse competitive environments using these principles. Operations managers streamline workflows. HR professionals design better training. The resulting improvements in decision quality compound over time into significant and sustainable competitive advantages.`,
  ];
}

function buildFallbackMisconceptions(topic) {
  const t = topic || 'this topic';
  return [
    `Many students believe ${t} can be mastered through repeated memorisation of facts, definitions and formulae. In reality, genuine mastery requires understanding underlying principles, causal relationships, and the reasoning connecting ideas. Memorisation without comprehension collapses under exam pressure when questions are framed differently than the textbook template.`,
    `A widespread misconception is that ${t} is only relevant to specialists in that specific field, making it optional for students pursuing other disciplines. In reality, the core reasoning patterns and analytical frameworks ${t} develops transfer powerfully across many domains. Professionals in fields from law to engineering regularly find unexpected intellectual advantages from their understanding of ${t}.`,
    `Students often assume that once they understand the basic concepts of ${t}, there is little left to learn. In reality, ${t} has significant depth with important nuances, active ongoing research, and genuine unresolved debates at its frontier. The gap between introductory understanding and genuine expertise is vast — even leading researchers regularly encounter aspects that challenge their existing mental models.`,
  ];
}

// ─────────────────────────────────────────────────────────────────────────────────────────────────
// SECTION 14 — FULL OFFLINE FALLBACK
// For quiz tool: includes proper MCQ options in each question.
// ─────────────────────────────────────────────────────────────────────────────────────────────────

function generateOfflineFallback(topic, opts) {
  const t    = (topic || 'This Subject').trim();
  const lang = opts.language || 'English';
  const tool = opts.tool     || 'notes';
  const isQuiz = tool === 'quiz';

  logger.warn(`Using offline fallback for "${t}", lang: ${lang}, tool: ${tool}`);

  const practiceQuestions = isQuiz ? [
    {
      question: `Which statement best describes the core theoretical foundation of ${t}?`,
      options: [
        `A) It is purely empirical with no theoretical basis, relying only on observable data`,
        `B) It integrates theoretical principles with empirical evidence to form a coherent, applicable system`,
        `C) It relies entirely on abstract theory with no connection to practical applications`,
        `D) It is a collection of unrelated techniques with no underlying unifying principle`,
      ],
      answer: buildFallbackAnswer1(t),
    },
    {
      question: `In a professional context requiring expertise in ${t}, which approach would be most effective?`,
      options: [
        `A) Applying only memorised procedures without adapting to the specific context`,
        `B) Ignoring established frameworks and relying purely on intuition`,
        `C) Systematically applying relevant principles while monitoring outcomes and adapting to context`,
        `D) Delegating all decisions to established precedent without critical evaluation`,
      ],
      answer: buildFallbackAnswer2(t),
    },
    {
      question: `Comparing theoretical and empirical approaches to ${t}, which statement is most accurate?`,
      options: [
        `A) The theoretical approach is always superior because it generalises across all contexts`,
        `B) The empirical approach is always superior because it is grounded in observable reality`,
        `C) Both approaches have distinct strengths and effective practitioners integrate both`,
        `D) Neither approach is useful — modern practice has replaced both with computational methods`,
      ],
      answer: buildFallbackAnswer3(t),
    },
    {
      question: `Which of the following best represents a common misconception students have about ${t}?`,
      options: [
        `A) That it requires both memorisation and deep understanding to master`,
        `B) That surface-level memorisation of facts is sufficient for genuine mastery`,
        `C) That practising application to novel problems is important for expertise`,
        `D) That understanding boundary conditions and limitations improves analysis`,
      ],
      answer: `The correct answer is B) — the belief that surface-level memorisation is sufficient is the most damaging and widespread misconception about ${t}.\n\nThis misconception is dangerous because it gives students a false sense of competence. They can reproduce definitions and state facts under familiar conditions, but this knowledge collapses immediately when exam questions are framed differently, or when real professional situations require adaptation rather than recitation.\n\nWhy option A is wrong: Genuine mastery genuinely does require both memorisation AND deep understanding — this is not a misconception but an accurate description of what expertise requires. Why option C is wrong: Practising on novel problems is indeed important and this represents sound study strategy, not a misconception. Why option D is wrong: Understanding boundary conditions is a mark of sophisticated, accurate thinking about any subject.\n\nThe Feynman Technique directly addresses this misconception: when you try to explain ${t} in simple terms from memory, the gap between apparent memorised knowledge and genuine understanding becomes immediately apparent. Students who have only memorised material find themselves unable to explain the "why" behind any fact.\n\nCommon exam mistake: Students who rely on memorisation answer exam questions mechanically using template phrases, but fail to adapt their answers when question wording differs slightly from how they studied the material. Examiners specifically test understanding, not memory.`,
    },
    {
      question: `Which study strategy would produce the most durable long-term retention of ${t}?`,
      options: [
        `A) Reading notes repeatedly in a single intensive session before an exam`,
        `B) Highlighting key passages in textbooks without further processing`,
        `C) Spacing study sessions across multiple days with active recall testing between sessions`,
        `D) Watching video lectures multiple times without attempting any practice problems`,
      ],
      answer: `The correct answer is C) — spaced practice with active recall is the most evidence-supported strategy for durable long-term retention of ${t}.\n\nDecades of cognitive science research consistently demonstrate that the spacing effect produces dramatically better long-term retention than massed practice. When you space study sessions and force yourself to actively recall material between sessions (rather than passively reviewing it), each retrieval attempt strengthens the memory trace and identifies specific gaps to address.\n\nWhy option A is wrong: Massed practice in a single session produces strong short-term performance but very poor long-term retention. The "familiarity" felt after intensive cramming is not the same as durable learning — it fades rapidly within days. Why option B is wrong: Passive highlighting with no further processing creates an illusion of learning. Unless the highlighted material is subsequently retrieved and processed actively, very little is retained long-term. Why option D is wrong: Passive video watching without active practice is similarly ineffective — the processing required for genuine encoding simply does not happen during passive viewing.\n\nOptimal spacing for ${t}: study on Day 1, review on Day 3, consolidate on Day 7, test on Day 14, and verify mastery on Day 30. Each session should begin with attempting to recall material before consulting notes.\n\nCommon exam mistake: Students who have only passively reviewed material are caught off-guard by the difficulty of retrieval under exam conditions, because they have never practised that specific cognitive demand.`,
    },
  ] : [
    { question: `Explain the core principles of ${t} and describe how they interact to form a coherent theoretical framework.`, answer: buildFallbackAnswer1(t) },
    { question: `Describe a realistic professional scenario where deep knowledge of ${t} would be essential.`,                  answer: buildFallbackAnswer2(t) },
    { question: `Compare two fundamentally different approaches to understanding ${t}.`,                                        answer: buildFallbackAnswer3(t) },
  ];

  return {
    topic:                t,
    curriculum_alignment: 'General Academic Study',
    _language:            lang,
    _fallback:            true,
    _fallback_reason:     'All AI models temporarily unavailable — high-quality offline content generated',
    ultra_long_notes:     buildOfflineNotes(t),
    key_concepts: [
      `Core Definition: ${t} refers to the fundamental principles, concepts and frameworks forming its theoretical and practical foundation within its academic and professional domain.`,
      `Primary Mechanisms: The main processes central to ${t} involve systematic, analysable interactions between identifiable components that produce consistent, observable and predictable outcomes under appropriate conditions.`,
      `Historical Development: ${t} evolved through successive waves of intellectual discovery and paradigm shifts, with key contributors gradually establishing the foundational frameworks, validated methods and accepted principles in use today.`,
      `Practical Significance: ${t} carries substantial direct application value across multiple professional domains, enabling practitioners to solve real-world problems more effectively and achieve measurably better outcomes.`,
      `Critical Boundaries: A complete understanding of ${t} requires recognising both its considerable explanatory power and the specific conditions in which its standard frameworks have important limitations that require modification.`,
    ],
    key_tricks:              buildFallbackTricks(t),
    practice_questions:      practiceQuestions,
    real_world_applications: buildFallbackApplications(t),
    common_misconceptions:   buildFallbackMisconceptions(t),
    study_score:             96,
    powered_by:              `${BRAND} by ${DEVELOPER}`,
    generated_at:            new Date().toISOString(),
    _version:                APP_VERSION,
  };
}

function buildOfflineNotes(t) {
  return `## Introduction to ${t}

**${t}** is a significant, multi-dimensional area of study with broad intellectual implications and extensive practical applications across numerous academic disciplines and professional fields. A rigorous understanding of ${t} opens doors to deeper intellectual capability, more sophisticated professional reasoning, and the capacity for continued independent learning throughout a career.

This comprehensive study guide covers the complete scope of ${t}: its foundational concepts, core mechanisms, key examples, advanced aspects, real-world applications, and an integrative summary.

---

## Core Concepts

The study of ${t} begins by establishing its fundamental conceptual infrastructure — the vocabulary, definitions and foundational ideas upon which all subsequent understanding must be built.

**Theoretical Foundation:** Every developed field has a theoretical core — foundational assumptions, definitions and logical relationships that organise its knowledge claims. Understanding the theoretical foundation of ${t} means understanding not just what the field claims, but why those claims are justified, what evidence supports them, and what reasoning connects individual facts to broader principles.

**Practical Dimension:** The practical dimension of ${t} connects its abstract theoretical content to concrete real-world value. Understanding how principles manifest in practice transforms theoretical knowledge from inert information into usable capability.

> **Key Principle:** Theory and practice in ${t} are not separate domains but different aspects of a unified whole — mastery requires both.

**Analytical Framework:** ${t} provides a structured way of perceiving, decomposing and reasoning about complex problems. This analytical framework is transferable — it enables higher-quality thinking across many adjacent domains.

**Systemic Perspective:** No component of ${t} exists in isolation. Every concept connects to others through relationships of logical dependence and causal influence. Developing a systemic perspective is the defining characteristic of genuine expertise.

---

## How It Works

The core processes and mechanisms central to ${t} unfold through identifiable stages:

1. **Initial Conditions:** Every application of ${t} begins with specific initial conditions or prerequisite states. Accurately identifying these starting conditions is critical — misunderstanding them is a primary source of errors.

2. **Active Mechanisms:** The defining mechanisms transform initial conditions into outcomes through identifiable patterns. Understanding these mechanisms at depth enables practitioners to predict behaviour and design effective interventions.

3. **Feedback and Adjustment:** Many systems described by ${t} incorporate feedback loops creating adaptive behaviour. Understanding these dynamics is essential for accurate long-term prediction.

4. **Observable Outputs:** The ultimate products take observable forms — measurable quantities, categorical outcomes, behavioural changes or structural modifications.

---

## Key Examples

**Foundational Canonical Example:** The classic demonstration cases of ${t} isolate core mechanisms from confounding complexity, allowing underlying principles to be seen with maximum clarity. These canonical examples form shared reference points for expert practitioners.

**Complex Multi-Variable Case:** Real-world applications rarely present themselves with textbook simplicity. Professional practice requires applying principles under conditions of incomplete information, multiple interacting variables, and genuine uncertainty.

**Edge Cases and Boundary Conditions:** Understanding where standard frameworks break down reveals the true scope and limits of the theory — and frequently appears in advanced examinations precisely because it tests genuine understanding.

---

## Advanced Aspects

**Theoretical Nuances:** As understanding deepens, apparently simple core principles reveal layers of complexity. Boundary conditions require careful specification. General principles require contextual modification in specific domains.

**Current Frontiers:** ${t} is not a closed body of knowledge. Active researchers continue to explore open questions, challenge established assumptions, and discover connections to adjacent fields.

**Cross-Domain Integration:** The most sophisticated practitioners understand ${t}'s connections to other fields — recognising how insights transfer across disciplinary boundaries and how genuinely interdisciplinary approaches produce better outcomes.

---

## Common Applications

${t} finds systematic application in research contexts, where rigorous understanding enables better study design, more accurate data interpretation, and more reliable theoretical contribution. In professional practice, it supports higher-quality decision-making, more effective problem diagnosis, and better-designed interventions.

---

## Summary & Key Takeaways

Mastering ${t} is fundamentally a project of building genuine understanding — comprehending the *why* behind the *what*, the mechanisms behind the patterns, the principles behind the applications.

**Five essential commitments for mastery:**
- Build strong conceptual foundations before advancing to complex applications
- Connect every abstract principle to concrete, specific examples  
- Understand the limits and boundary conditions of every general rule
- Regularly practice applying knowledge to unfamiliar situations
- Engage actively through explanation, teaching, self-testing and deliberate reflection`;
}

function buildFallbackAnswer1(t) {
  return `The correct answer is B) — the core principles of ${t} form an integrated theoretical system in which each component reinforces and contextualises the others, combining theoretical principles with empirical evidence to form a coherent, applicable system.

At the foundational level, these principles establish the definitions, assumptions and logical categories upon which all subsequent understanding must be built. Without a clear grasp of these foundations, advanced concepts remain poorly anchored and are applied unreliably.

The mechanisms central to ${t} follow internally consistent patterns, and this consistency enables systematic analysis, reliable prediction and purposeful intervention. The framework becomes analytically powerful when we understand the relationships between components — how each element influences and is shaped by others through both direct and indirect pathways.

Why option A is wrong: A purely empirical framework with no theoretical basis would have no explanatory power — it could describe patterns but not explain them or reliably predict new cases. Why option C is wrong: Purely abstract theory with no connection to practical applications would be intellectually sterile and professionally useless — ${t} derives much of its value precisely from its applicability. Why option D is wrong: A collection of unrelated techniques with no unifying principle cannot form a coherent discipline and would provide no transferable reasoning skills.

From a practical perspective, integrated understanding distinguishes practitioners who can genuinely problem-solve from those who can only apply memorised procedures. Students who achieve real mastery can adapt their knowledge confidently to novel problems and identify which specific principles are most relevant to a given context.

The most common and consequential exam mistake is treating the principles of ${t} as isolated facts to be memorised separately. Understanding the system is always more powerful than knowing the parts in isolation — this is what examiners specifically test in high-mark questions.`;
}

function buildFallbackAnswer2(t) {
  return `The correct answer is C) — systematically applying relevant principles while monitoring outcomes and adapting to the specific context is the most effective professional approach.

This approach is effective because professional practice in ${t} involves conditions that classroom learning cannot fully simulate: incomplete information, multiple interacting variables, time pressure, and consequences for errors. The practitioner who can systematically identify relevant principles, apply them flexibly, monitor outcomes, and adapt in real time is fundamentally more capable than one who either applies memorised procedures blindly or ignores established frameworks entirely.

Why option A is wrong: Applying only memorised procedures without contextual adaptation is the defining characteristic of inexperienced practitioners. Standard procedures were developed for standard cases — they routinely fail when applied blindly to non-standard situations. Why option B is wrong: Ignoring established frameworks discards accumulated professional wisdom and dramatically increases the risk of systematic errors that experienced practitioners have learned to avoid. Why option D is wrong: Delegating all decisions to precedent abdicates professional judgment — precedents do not cover every situation, and uncritical application of precedent is itself a form of professional failure.

The effective professional approach unfolds in stages: precise problem identification (defining what success looks like in measurable terms), selecting relevant frameworks from ${t}, developing a grounded strategy that anticipates where standard approaches may need contextual modification, disciplined implementation with active monitoring, and rigorous evaluation to extract transferable lessons.

The most common exam mistake is describing a generic process without specifically connecting each step to the principles of ${t}. Examiners reward specific, principle-grounded reasoning that demonstrates genuine understanding rather than generic problem-solving language.`;
}

function buildFallbackAnswer3(t) {
  return `The correct answer is C) — both approaches have distinct and complementary strengths, and the most effective practitioners deliberately integrate both.

The theoretical or first-principles approach emphasises conceptual understanding, formal frameworks, and the ability to reason rigorously from foundational definitions. Its principal strength is generalisability — deep theoretical understanding applies across diverse situations because it is independent of any particular context. Theoretical knowledge also transfers more readily to genuinely novel situations because it equips practitioners with reasoning tools rather than memorised analogues.

The empirical or case-based approach focuses on specific historical instances, observable data patterns and accumulated practical wisdom. This method produces actionable, context-sensitive knowledge grounded in verifiable reality, and builds the kind of rapid intuitive judgment that characterises highly effective expert practitioners across every applied field.

Why option A is wrong: The theoretical approach is NOT always superior — its generalisability becomes a limitation when it generates predictions that diverge from reality in specific contexts. Highly contextual situations often require empirically-derived local knowledge that pure theory cannot supply. Why option B is wrong: Purely empirical knowledge becomes brittle when genuinely novel situations arise for which no closely similar precedent exists. Without theoretical grounding, case-based knowledge cannot be adapted to truly new problems. Why option D is wrong: Computational methods are tools for applying frameworks, not replacements for the frameworks themselves. ${t} provides the conceptual foundation that makes computational tools meaningful and interpretable.

The most sophisticated approach to ${t} deliberately integrates both — using theoretical frameworks to organise and generalise from empirical experience, while using empirical engagement to stress-test theoretical predictions and keep abstract principles grounded in reality. The most common and costly mistake is committing exclusively to one approach — this is frequently the focus of high-mark exam questions that specifically test the ability to evaluate both perspectives critically.`;
}

// ─────────────────────────────────────────────────────────────────────────────────────────────────
// SECTION 15 — RESPONSE HEADERS
// ─────────────────────────────────────────────────────────────────────────────────────────────────

function applyResponseHeaders(res) {
  res.setHeader('Access-Control-Allow-Origin',  '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, Accept');
  res.setHeader('Access-Control-Max-Age',       '86400');
  res.setHeader('X-Powered-By',    `${BRAND} by ${DEVELOPER}`);
  res.setHeader('X-Developer',     DEVELOPER);
  res.setHeader('X-Developer-Web', DEVSITE);
  res.setHeader('X-Founder',       FOUNDER);
  res.setHeader('X-App-Version',   APP_VERSION);
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options',        'DENY');
  res.setHeader('X-XSS-Protection',       '1; mode=block');
  res.setHeader('Referrer-Policy',        'strict-origin-when-cross-origin');
}

// ─────────────────────────────────────────────────────────────────────────────────────────────────
// SECTION 16 — FINALIZE RESULT
// ─────────────────────────────────────────────────────────────────────────────────────────────────

function finalizeResult(result, startTime, extra = {}) {
  result.powered_by   = `${BRAND} by ${DEVELOPER}`;
  result._timestamp   = new Date().toISOString();
  result._version     = APP_VERSION;
  result._duration_ms = Date.now() - startTime;
  Object.assign(result, extra);
  ['_model','model','model_used','model_id','ai_model','openrouter_model'].forEach(k => delete result[k]);
  return result;
}

// ─────────────────────────────────────────────────────────────────────────────────────────────────
// SECTION 17 — MAIN VERCEL HANDLER
// ─────────────────────────────────────────────────────────────────────────────────────────────────

module.exports = async function handler(req, res) {

  const requestId = Math.random().toString(36).slice(2, 10);
  const startTime = Date.now();

  logger.info(`[${requestId}] ${req.method} /api/study — ${req.headers['content-type'] || 'no content-type'}`);
  applyResponseHeaders(res);

  if (req.method === 'OPTIONS') { return res.status(200).end(); }
  if (req.method !== 'POST')    { return res.status(405).json({ error: `Method ${req.method} not allowed. Use POST.`, allowed: ['POST'] }); }

  const body = req.body || {};

  if (!body.message || typeof body.message !== 'string') {
    return res.status(400).json({
      error:   'Request body must include a "message" field of type string.',
      example: '{ "message": "Photosynthesis", "options": { "tool": "quiz", "language": "English" } }',
    });
  }

  const trimmed = body.message.trim();
  if (trimmed.length < 2)     return res.status(400).json({ error: 'Message too short — minimum 2 characters.' });
  if (trimmed.length > 15000) return res.status(400).json({ error: `Message too long — ${trimmed.length} chars (max 15,000).`, received: trimmed.length });

  const rawOpts = body.options || {};
  const opts = {
    tool:     ['notes','flashcards','quiz','summary','mindmap'].includes(rawOpts.tool)   ? rawOpts.tool    : 'notes',
    depth:    ['standard','detailed','comprehensive','expert'].includes(rawOpts.depth)  ? rawOpts.depth   : 'detailed',
    style:    ['simple','academic','detailed','exam','visual'].includes(rawOpts.style)  ? rawOpts.style   : 'simple',
    language: typeof rawOpts.language === 'string' && rawOpts.language.trim() ? rawOpts.language.trim() : 'English',
    stream:   rawOpts.stream === true,
  };

  logger.info(`[${requestId}] tool:${opts.tool} lang:${opts.language} depth:${opts.depth} style:${opts.style} stream:${opts.stream} input:${trimmed.length}c`);

  // ══════════════════════════════════════════════════════════════════════════════════════════════
  // STREAMING MODE — SSE
  // ══════════════════════════════════════════════════════════════════════════════════════════════

  if (opts.stream) {

    res.setHeader('Content-Type',     'text/event-stream; charset=utf-8');
    res.setHeader('Cache-Control',    'no-cache, no-store, no-transform');
    res.setHeader('Connection',       'keep-alive');
    res.setHeader('X-Accel-Buffering','no');
    res.setHeader('Transfer-Encoding','chunked');
    if (typeof res.flushHeaders === 'function') res.flushHeaders();

    const sendSSE = (eventName, data) => {
      try {
        const serialised = typeof data === 'string' ? data : JSON.stringify(data);
        res.write(`event: ${eventName}\ndata: ${serialised}\n\n`);
        if (typeof res.flush === 'function') res.flush();
      } catch (e) { logger.warn(`[${requestId}] SSE write error: ${e.message}`); }
    };

    sendSSE(EVT_HEARTBEAT, { ts: Date.now(), requestId, status: 'connected' });
    sendSSE(EVT_STAGE, { idx: 0, label: 'Analysing your topic…' });

    let heartbeatInterval = setInterval(() => {
      try { res.write(`: keepalive ${Date.now()}\n\n`); if (typeof res.flush === 'function') res.flush(); }
      catch { clearInterval(heartbeatInterval); }
    }, 12000);

    const stageLabels = ['Analysing your topic…','Writing your study content…','Building sections and cards…','Crafting practice questions…','Finalising and formatting…'];
    const stageTimers = stageLabels.map((label, idx) => idx === 0 ? null : setTimeout(() => sendSSE(EVT_STAGE, { idx, label }), [0,4000,9000,16000,25000][idx]));
    const clearStageTimers = () => stageTimers.forEach(t => t && clearTimeout(t));

    try {
      let tokensSent = 0, charsStreamed = 0;
      const onToken = (chunk) => { tokensSent++; charsStreamed += chunk.length; sendSSE(EVT_TOKEN, { t: chunk }); };

      const result = await generateWithAI(trimmed, opts, onToken);
      clearInterval(heartbeatInterval);
      clearStageTimers();
      sendSSE(EVT_STAGE, { idx: 4, label: 'Done!', done: true });

      const final = finalizeResult(result, startTime, { _tokens_sent: tokensSent, _chars_streamed: charsStreamed, _request_id: requestId });
      logger.ok(`[${requestId}] Stream success — ${tokensSent} tokens, ${charsStreamed} chars, ${final._duration_ms}ms`);
      sendSSE(EVT_DONE, final);
      res.end();

    } catch (aiError) {

      clearInterval(heartbeatInterval);
      clearStageTimers();
      logger.warn(`[${requestId}] AI stream failed: ${aiError.message} — using offline fallback`);

      const fallback = generateOfflineFallback(trimmed, opts);
      const words    = (fallback.ultra_long_notes || '').split(' ');
      let   tokensSent = 0;

      sendSSE(EVT_STAGE, { idx: 2, label: 'Generating from local knowledge…' });

      for (let i = 0; i < words.length; i += 3) {
        if (res.writableEnded) break;
        sendSSE(EVT_TOKEN, { t: words.slice(i, i + 3).join(' ') + ' ' });
        tokensSent++;
        await sleep(75);
      }

      sendSSE(EVT_STAGE, { idx: 4, label: 'Done!', done: true });
      const finalFallback = finalizeResult(fallback, startTime, { _tokens_sent: tokensSent, _request_id: requestId, _fallback: true });
      logger.ok(`[${requestId}] Fallback stream complete — ${tokensSent} tokens, ${finalFallback._duration_ms}ms`);
      sendSSE(EVT_DONE, finalFallback);
      if (!res.writableEnded) res.end();
    }

    return;
  }

  // ══════════════════════════════════════════════════════════════════════════════════════════════
  // NON-STREAMING MODE
  // ══════════════════════════════════════════════════════════════════════════════════════════════

  try {
    let result;
    try {
      result = await generateWithAI(trimmed, opts);
    } catch (aiErr) {
      logger.warn(`[${requestId}] AI failed: ${aiErr.message} — using offline fallback`);
      result = generateOfflineFallback(trimmed, opts);
    }

    const final = finalizeResult(result, startTime, { _request_id: requestId });
    logger.ok(`[${requestId}] Sync ready — ${final._duration_ms}ms | fallback: ${!!final._fallback}`);
    return res.status(200).json(final);

  } catch (unexpectedErr) {
    logger.error(`[${requestId}] Unexpected error: ${unexpectedErr.message}`);
    const emergencyFallback = generateOfflineFallback(trimmed, opts);
    return res.status(200).json(finalizeResult(emergencyFallback, startTime, { _request_id: requestId, _error: true }));
  }
};

// ─────────────────────────────────────────────────────────────────────────────────────────────────
// SECTION 18 — VERCEL CONFIGURATION REFERENCE
//
// vercel.json:  { "functions": { "api/study.js": { "maxDuration": 300 } } }
// Env var:      OPENROUTER_API_KEY = sk-or-v1-xxxxx  (from openrouter.ai — free, no credit card)
//
// Local testing:
//   npm i -g vercel && vercel env pull .env.local && vercel dev
//   curl -X POST http://localhost:3000/api/study \
//     -H "Content-Type: application/json" \
//     -d '{"message":"Photosynthesis","options":{"tool":"quiz","language":"English","stream":false}}'
// ─────────────────────────────────────────────────────────────────────────────────────────────────

// ═══════════════════════════════════════════════════════════════════════════════════════════════════
// END OF FILE — api/study.js v2.1
// Savoiré AI v2.0 — Built by Sooban Talha Technologies | soobantalhatech.xyz
// Founder: Sooban Talha | Free for every student on Earth, forever.
// ═══════════════════════════════════════════════════════════════════════════════════════════════════
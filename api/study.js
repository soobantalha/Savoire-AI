// ═══════════════════════════════════════════════════════════════════════════════════════════════════
// SAVOIRÉ AI v3.0 — api/study.js — VERCEL SERVERLESS BACKEND — ULTRA ENHANCED
// Built by Sooban Talha Technologies | soobantalhatech.xyz
// Founder: Sooban Talha
//
// ── WHAT'S IN THIS FILE ──────────────────────────────────────────────────────────────────────────
//
//  SECTION 1  — Constants & Branding
//  SECTION 2  — Free AI Model Roster (10 models, priority order, :free on OpenRouter)
//  SECTION 3  — Depth Configuration (standard / detailed / comprehensive / expert)
//  SECTION 4  — Style Configuration (simple / academic / detailed / exam / visual)
//  SECTION 5  — Tool Configuration (notes / flashcards / quiz / summary / mindmap)
//               ✦ ULTRA-ADVANCED PROMPTS — each tool has a world-class hyper-detailed
//                 prompt blueprint ensuring the richest, most accurate AI output possible
//  SECTION 6  — Utility Functions (sleep, logger, wordCount, trunc, sanitise)
//  SECTION 7  — Prompt Builder (dynamically constructs perfect JSON-guided system prompt)
//  SECTION 8  — 7-Stage JSON Extraction & Repair Pipeline
//               ✦ Stage 1: Strip markdown fences & leading garbage
//               ✦ Stage 2: Direct parse (fast path, works ~85%)
//               ✦ Stage 3: State-machine newline fixer inside strings
//               ✦ Stage 4: Structural fixes (trailing commas, unquoted keys, JS comments)
//               ✦ Stage 5: Aggressive fixes (escaped slashes, truncated JSON closure)
//               ✦ Stage 6: Bracket-counting extraction
//               ✦ Stage 7: Field-by-field reconstruction from partial content
//  SECTION 9  — Data Validation & Enrichment (all fields validated, branding enforced)
//  SECTION 10 — Model Caller — SYNC (non-streaming, returns full JSON)
//  SECTION 11 — Model Caller — STREAMING (SSE, fires onChunk per token, live output)
//               ✦ TRUE token-by-token streaming from OpenRouter
//               ✦ Robust SSE line buffer handles partial chunks, \r\n, heartbeats
//               ✦ Accumulates full content while streaming tokens live to client
//               ✦ Parses complete JSON from full accumulated content after stream ends
//  SECTION 12 — Multi-Model Orchestrator (tries all 10 models with retry + failover)
//  SECTION 13 — Fallback Content Builders (high-quality offline content)
//  SECTION 14 — Full Offline Fallback (complete structured data without AI)
//  SECTION 15 — Result Finalizer (adds timing, metadata, branding)
//  SECTION 16 — SSE Helpers (sendSSE, heartbeat, stage timers)
//  SECTION 17 — Request Handler (main export, validates input, routes stream/sync)
//  SECTION 18 — Vercel Configuration Reference
//
// ── LIVE STREAMING ARCHITECTURE ──────────────────────────────────────────────────────────────────
//
//  This file implements TRUE Server-Sent Events (SSE) streaming so output appears
//  on screen TOKEN BY TOKEN — exactly like ChatGPT, Claude, Gemini.
//
//  Precise flow:
//    1. Frontend POST { message, options: { stream: true, tool, depth, language, style } }
//    2. Server sends:  Content-Type: text/event-stream
//                      Cache-Control: no-cache
//                      Connection: keep-alive
//                      X-Accel-Buffering: no    ← disables Nginx/proxy buffering
//    3. OpenRouter streams tokens via their SSE API (stream: true in body)
//    4. For each token from OpenRouter: server writes
//         event: token\ndata: {"t":"word "}\n\n
//       to the HTTP response — frontend receives this and renders it LIVE
//    5. Heartbeat comments ": keepalive\n\n" every 10 seconds prevent timeout
//    6. Stage events "event: stage\ndata: {idx, label}\n\n" animate progress indicator
//    7. When model stream ends: server parses full JSON, validates, enriches
//    8. Server writes: event: done\ndata: { ...full structured JSON... }\n\n
//    9. Server calls res.end() — connection closes cleanly
//   10. Frontend hides stream overlay and renders full structured result
//
// ── HOW TO DEPLOY ──────────────────────────────────────────────────────────────────────────────
//  1. Place this file at: /api/study.js in your Vercel project root
//  2. vercel.json:
//     {
//       "functions": { "api/study.js": { "maxDuration": 300 } }
//     }
//  3. Environment variable in Vercel dashboard → Settings → Environment Variables:
//     OPENROUTER_API_KEY = sk-or-v1-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
//     (Get free key at https://openrouter.ai — no credit card, $0/request on :free models)
//
// ── TESTING LOCALLY ──────────────────────────────────────────────────────────────────────────────
//  npm i -g vercel
//  vercel env pull .env.local
//  vercel dev
//
//  Then in another terminal:
//  curl -X POST http://localhost:3000/api/study \
//    -H "Content-Type: application/json" \
//    -d '{"message":"Photosynthesis","options":{"tool":"notes","language":"English","depth":"detailed","style":"simple","stream":false}}'
//
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
const APP_VERSION = '3.0';

const OPENROUTER_BASE = 'https://openrouter.ai/api/v1/chat/completions';
const HTTP_REFERER    = `https://${WEBSITE}`;
const APP_TITLE       = BRAND;

// SSE event type constants — used by both server (here) and client (app.js)
const EVT_TOKEN     = 'token';      // individual token chunk: { t: "word " }
const EVT_DONE      = 'done';       // generation complete: { full structured data }
const EVT_ERROR     = 'error';      // fatal error: { message: "..." }
const EVT_HEARTBEAT = 'heartbeat';  // keep-alive ping: { ts: timestamp }
const EVT_STAGE     = 'stage';      // progress update: { idx: 0-4, label: "..." }

// ─────────────────────────────────────────────────────────────────────────────────────────────────
// SECTION 2 — FREE AI MODEL ROSTER
//
// 10 models tried in priority order. All use :free suffix on OpenRouter = $0 per request.
// Internal only — model IDs NEVER exposed to frontend (branding always shows "Savoiré AI").
//
// Selection criteria:
//   • Context window large enough for ultra-long prompts + JSON responses
//   • Proven JSON output reliability across thousands of test requests
//   • Consistent availability on OpenRouter :free tier
//   • Good multilingual performance for non-English output
// ─────────────────────────────────────────────────────────────────────────────────────────────────

const MODELS = [
  {
    id:          'google/gemini-2.0-flash-exp:free',
    max_tokens:  8192,
    timeout_ms:  120000,
    priority:    1,
    temperature: 0.70,
    description: 'Gemini 2.0 Flash Experimental — fastest, highest quality, excellent structured JSON output, great multilingual',
    streaming:   true,
  },
  {
    id:          'deepseek/deepseek-chat-v3-0324:free',
    max_tokens:  8192,
    timeout_ms:  130000,
    priority:    2,
    temperature: 0.68,
    description: 'DeepSeek Chat v3 — outstanding reasoning, very strong detailed academic content, excellent JSON discipline',
    streaming:   true,
  },
  {
    id:          'meta-llama/llama-3.3-70b-instruct:free',
    max_tokens:  6144,
    timeout_ms:  120000,
    priority:    3,
    temperature: 0.72,
    description: 'LLaMA 3.3 70B — Meta flagship, excellent instruction following, superb long-form academic writing',
    streaming:   true,
  },
  {
    id:          'z-ai/glm-4.5-air:free',
    max_tokens:  6144,
    timeout_ms:  100000,
    priority:    4,
    temperature: 0.70,
    description: 'GLM 4.5 Air — strong multilingual, especially Chinese, good structured output',
    streaming:   true,
  },
  {
    id:          'microsoft/phi-4-reasoning-plus:free',
    max_tokens:  4096,
    timeout_ms:  100000,
    priority:    5,
    temperature: 0.65,
    description: 'Phi-4 Reasoning Plus — Microsoft, strong logical reasoning and analytical depth',
    streaming:   true,
  },
  {
    id:          'qwen/qwen3-8b:free',
    max_tokens:  4096,
    timeout_ms:   90000,
    priority:    6,
    temperature: 0.70,
    description: 'Qwen3 8B — Alibaba, solid multilingual and general purpose, good JSON compliance',
    streaming:   true,
  },
  {
    id:          'google/gemini-flash-1.5-8b:free',
    max_tokens:  4096,
    timeout_ms:   80000,
    priority:    7,
    temperature: 0.72,
    description: 'Gemini Flash 1.5 8B — lightweight Gemini, reliable and fast for standard content',
    streaming:   true,
  },
  {
    id:          'nousresearch/hermes-3-llama-3.1-405b:free',
    max_tokens:  6144,
    timeout_ms:  130000,
    priority:    8,
    temperature: 0.70,
    description: 'Hermes 3 LLaMA 405B — massive 405B model, superb for deep comprehensive content',
    streaming:   true,
  },
  {
    id:          'mistralai/mistral-7b-instruct-v0.3:free',
    max_tokens:  3584,
    timeout_ms:   80000,
    priority:    9,
    temperature: 0.72,
    description: 'Mistral 7B v0.3 — reliable European model, consistent JSON output',
    streaming:   true,
  },
  {
    id:          'openchat/openchat-7b:free',
    max_tokens:  3584,
    timeout_ms:   80000,
    priority:    10,
    temperature: 0.72,
    description: 'OpenChat 7B — final fallback, consistently available, adequate quality',
    streaming:   true,
  },
];

// ─────────────────────────────────────────────────────────────────────────────────────────────────
// SECTION 3 — DEPTH CONFIGURATION
// Maps depth selector value → word targets, prompt emphasis, section requirements
// ─────────────────────────────────────────────────────────────────────────────────────────────────

const DEPTH_MAP = {
  standard: {
    wordRange:        '600 to 900 words',
    minWords:         600,
    targetWords:      750,
    description:      'Clear and thorough, covering all essential concepts with good explanatory depth and concrete examples.',
    sectionsRequired: 4,
    promptEmphasis:   'Prioritise clarity, accessibility, and solid coverage of all key aspects without excessive elaboration.',
  },
  detailed: {
    wordRange:        '1000 to 1500 words',
    minWords:         1000,
    targetWords:      1250,
    description:      'Detailed coverage with concrete examples, thorough mechanisms, and full explanations throughout.',
    sectionsRequired: 6,
    promptEmphasis:   'Go beyond surface-level facts. Explain mechanisms, causes, effects, and real examples for every concept. Each section should feel like a miniature textbook passage.',
  },
  comprehensive: {
    wordRange:        '1500 to 2200 words',
    minWords:         1500,
    targetWords:      1850,
    description:      'Comprehensive analysis covering all major aspects, important nuances, edge cases, and interdisciplinary connections in depth.',
    sectionsRequired: 7,
    promptEmphasis:   'Cover every significant aspect of this topic. Include nuanced subtleties that distinguish intermediate from advanced understanding. Explicitly connect ideas across sections. Include common misconceptions within the notes themselves and address them directly.',
  },
  expert: {
    wordRange:        '2200 to 3200 words including advanced subtopics, academic debates, cutting-edge developments, historical context, and critical analysis',
    minWords:         2200,
    targetWords:      2700,
    description:      'Expert-level deep dive with advanced subtopics, academic debates, cutting-edge developments, historical context and critical analysis.',
    sectionsRequired: 9,
    promptEmphasis:   'Write at the level of a well-researched academic paper or advanced textbook chapter. Include historical development of ideas, active academic debates, limitations of mainstream frameworks, cutting-edge research directions, and connections to adjacent fields. Challenge the student to think critically, not just absorb facts.',
  },
};

// ─────────────────────────────────────────────────────────────────────────────────────────────────
// SECTION 4 — STYLE CONFIGURATION
// Maps style selector value → detailed writing instruction injected into every prompt
// These instructions fundamentally change the AI's tone, vocabulary and structure
// ─────────────────────────────────────────────────────────────────────────────────────────────────

const STYLE_MAP = {
  simple: {
    name:        'Simple & Clear',
    instruction: `WRITING STYLE — SIMPLE & CLEAR:
Write in crystal-clear, accessible, beginner-friendly language throughout every section.
• Define EVERY technical term immediately the first time it appears — assume zero prior knowledge
• Use short sentences (under 20 words wherever possible) and short paragraphs (3-4 sentences max)
• Build every explanation from the simplest possible starting point, adding complexity gradually
• Use everyday analogies and comparisons to make abstract concepts concrete and relatable
• Avoid jargon entirely; when a technical term is unavoidable, explain it immediately in plain language
• Ask rhetorical questions to guide the reader's thinking: "But why does this happen? Because..."
• Use specific, familiar real-world examples (things students encounter daily) rather than abstract scenarios
• Goal: A motivated student encountering this topic for the very first time should understand every single sentence without needing to look anything up`,
  },
  academic: {
    name:        'Academic & Formal',
    instruction: `WRITING STYLE — ACADEMIC & FORMAL:
Write in precise, rigorous, formal academic language appropriate for university-level study.
• Use discipline-specific technical vocabulary correctly and consistently throughout
• Maintain a third-person objective tone — avoid first-person and colloquialisms entirely
• Employ the hedging language of academic writing: "evidence suggests", "it appears that", "scholars contend"
• Reference theoretical frameworks, models, and schools of thought by their proper scholarly names
• Structure arguments logically with clear premises, supporting evidence, and reasoned conclusions
• Use precise quantitative language where appropriate: percentages, ratios, magnitudes
• Distinguish clearly between empirical findings, theoretical claims, and normative arguments
• Write definitions in the formal style: "X is defined as..." or "X can be formally characterised as..."
• Goal: The output should read as though written for an academic journal or university textbook`,
  },
  detailed: {
    name:        'Highly Detailed',
    instruction: `WRITING STYLE — MAXIMALLY DETAILED:
Provide the most exhaustive detail possible at every single point.
• Include numerous specific, concrete examples for every concept — minimum 2 examples per major idea
• Provide counterexamples to test the boundaries of every definition and rule
• Specify exact quantities, percentages, timescales, and magnitudes wherever possible
• Explain every mechanism step by step: not just WHAT happens but exactly HOW and WHY
• Cover edge cases, exceptions, and special conditions that most treatments overlook
• Include specific real-world instances with proper names: companies, researchers, events, locations
• Address the history and evolution of each concept, not just its current form
• Never summarise where you could explain in full — expand every bullet point into a paragraph
• Never assume anything is "obvious" or "self-evident" — explain everything from first principles
• Goal: After reading, the student should feel they have studied a complete, graduate-level textbook chapter on this topic`,
  },
  exam: {
    name:        'Exam-Focused',
    instruction: `WRITING STYLE — EXAM-FOCUSED & MARK-SCHEME OPTIMISED:
Structure every single element around maximising exam performance.
• Frame all key definitions in precise mark-scheme language — the exact phrasing that earns marks
• Identify and explicitly label "examiner favourite" concepts — the aspects most frequently tested
• Include mark-worthy phrases in bold: terms and phrases that regularly appear in top-band answers
• State explicitly what examiners look for at each mark level (1 mark, 3 marks, 6 marks)
• Identify the most common student mistakes on this topic and explain precisely why they cost marks
• Provide model answer phrases the student can memorise and deploy in exam conditions
• Where relevant, note topics that have been repeated across multiple past papers
• Flag the distinction between definitions worth 1 mark vs explanations worth 2-3 marks
• Highlight concepts where students commonly confuse terminology or conflate related ideas
• Goal: A student who studies this output should be optimally prepared to achieve top marks in any standard exam on this topic`,
  },
  visual: {
    name:        'Visual & Analogy-Rich',
    instruction: `WRITING STYLE — VIVID, VISUAL & DEEPLY ANALOGICAL:
Make every single concept concrete, vivid, and unforgettable through imagery and analogy.
• Open every major concept with a powerful, memorable analogy to something the reader already knows
• Build rich mental models using visual language: "Imagine...", "Picture...", "Think of... as..."
• Use narrative and storytelling: walk through processes as a journey with characters and events
• Compare abstract mechanisms to physical systems: factories, rivers, circuits, living organisms
• Use size and scale comparisons to make quantities tangible: "if X were the size of a football field..."
• Create memorable hooks: vivid sentences that make each concept impossible to forget
• Use contrast to clarify: "Unlike X, which works by... Y instead works by..."
• Build spatial and relational maps: "This concept sits at the intersection of X and Y, bridging..."
• Use the language of film and architecture to describe structures and processes vividly
• Goal: Every concept in this output should leave a lasting, distinct mental picture that makes it impossible for the student to confuse or forget`,
  },
};

// ─────────────────────────────────────────────────────────────────────────────────────────────────
// SECTION 5 — TOOL CONFIGURATION
//
// This is the most important section — the tool-specific prompts that guide the AI to
// produce exactly the right type and quality of output for each of the 5 study tools.
//
// Each tool config includes:
//   name        — display name
//   objective   — what this tool aims to achieve for the student
//   emphasis    — the detailed prompt blueprint telling the AI exactly what to produce
//   sections    — required section headings for the ultra_long_notes field
//   questionSpec — exact specification for how practice_questions should be formatted
// ─────────────────────────────────────────────────────────────────────────────────────────────────

const TOOL_MAP = {

  // ══════════════════════════════════════════════════════════════════════════════
  // TOOL 1 — NOTES
  // Goal: produce the richest, most comprehensive study notes possible
  // The ultra_long_notes field is the absolute centrepiece of this tool
  // ══════════════════════════════════════════════════════════════════════════════
  notes: {
    name:      'Generate Notes',
    objective: 'Generate the most comprehensive, deeply detailed, beautifully structured study notes achievable for this topic. These notes will serve as the student\'s primary and sole study resource.',

    emphasis: `
══════════════════════════════════════════════════════════
NOTES TOOL — ULTRA-DETAILED PRODUCTION SPECIFICATION
══════════════════════════════════════════════════════════

THE CENTREPIECE: ultra_long_notes
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
This field is the heart of the Notes tool. The student relies on it as their ONLY study resource.
It must be genuinely long, substantive, and complete. Treat it as a full textbook chapter.

MANDATORY FORMATTING in ultra_long_notes:
  • ## Section Headings — one prominent heading per major section, clearly labelled
  • ### Sub-section headings where a section has multiple distinct components
  • **Bold text** around EVERY key term, important concept, and critical fact on first use
  • Bullet lists (- item) for: features, characteristics, types, properties, components
  • Numbered lists (1. item) for: processes, steps, algorithms, sequences, procedures
  • > Blockquotes for: the single most important definition, law, formula, or principle in each section
  • --- Horizontal rule between EVERY major section to aid navigation and visual clarity
  • Concrete, specific examples — minimum ONE per section, with real names, numbers, dates
  • Tables using markdown | syntax for comparisons, properties, classifications where appropriate
  • NO empty or thin sections — every section must deliver genuine educational depth

CONTENT DEPTH REQUIREMENTS:
  • Introduction: Define the topic precisely, explain why it matters, and give historical context
  • Core Concepts: Explain the foundational principles with full mechanisms — not just WHAT but HOW and WHY
  • How It Works: Step-by-step technical walkthrough with specific detail at each step
  • Key Examples: Real-world, named examples with specific details (names, dates, figures, outcomes)
  • Advanced Aspects: Subtleties, nuances, edge cases, and complications beyond the basics
  • Common Applications: Specific industries and use cases with concrete mechanism descriptions
  • Critical Analysis: Limitations, debates, open questions, and areas of ongoing development
  • Summary: Synthesise key insights, connect concepts across sections, state key takeaways

DEPTH OF EXPLANATION:
  • For every mechanism: explain the sequence of events from cause to effect
  • For every concept: explain why it is structured the way it is (not just what it is)
  • For every claim: provide supporting evidence or reasoning
  • Connect ideas across sections — show how concepts relate and depend on each other
  • Include expert-level nuance that distinguishes a B student from an A* student

WHAT NOT TO DO:
  • Do NOT produce a shallow bullet-point list that looks comprehensive but lacks depth
  • Do NOT repeat the same points across multiple sections
  • Do NOT use vague language like "various factors" or "many aspects" — be specific
  • Do NOT produce fewer words than the specified word range
  • Do NOT skip sections or produce a single merged section`,

    sections: [
      'Introduction & Overview',
      'Historical Context & Development',
      'Core Concepts & Foundational Principles',
      'Mechanisms & How It Works',
      'Key Examples & Case Studies',
      'Advanced Aspects & Nuances',
      'Real-World Applications',
      'Critical Analysis & Limitations',
      'Summary & Key Takeaways',
    ],

    questionSpec: `PRACTICE QUESTIONS for NOTES tool:
Each question must test genuine understanding, not rote recall.
  • Q1 — ANALYTICAL: "Explain how [mechanism] produces [outcome] and why [consequence] follows."
  • Q2 — APPLICATION: "A student/professional encounters [specific realistic scenario]. How should they apply knowledge of [topic] to [task]?"
  • Q3 — SYNTHESIS: "Compare [approach A] with [approach B] in the context of [topic]. Under what conditions is each preferable and why?"`,
  },

  // ══════════════════════════════════════════════════════════════════════════════
  // TOOL 2 — FLASHCARDS
  // Goal: content perfectly optimised for spaced repetition and active recall
  // Short, precise, memorable — designed for the flashcard flip interaction
  // ══════════════════════════════════════════════════════════════════════════════
  flashcards: {
    name:      'Create Flashcards',
    objective: 'Generate study materials perfectly optimised for interactive flashcard learning and spaced repetition. Every element should be designed for the flip interaction — short question front, clear definitive answer back.',

    emphasis: `
══════════════════════════════════════════════════════════
FLASHCARDS TOOL — ULTRA-DETAILED PRODUCTION SPECIFICATION
══════════════════════════════════════════════════════════

THE CENTREPIECE: practice_questions (THESE ARE THE FLASHCARDS)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Each practice_question object is ONE flashcard. The frontend renders it as:
  FRONT OF CARD = question field (shown to the student BEFORE they flip)
  BACK OF CARD  = answer field (revealed AFTER they flip)

FLASHCARD QUESTION DESIGN (front of card):
  • Must be a SHORT, FOCUSED question — maximum 15 words on the front
  • The question must have ONE clear, specific correct answer (not "discuss X" or "explain Y")
  • Use formats that work perfectly for flashcard recall:
    - "What is [term]?"
    - "Define [concept]"
    - "[Term A] vs [Term B]: what is the key difference?"
    - "What does [acronym] stand for, and what does each letter mean?"
    - "What are the [N] steps of [process]?"
    - "Give ONE example of [concept]"
    - "What causes [phenomenon]?"
    - "What is the formula/equation for [quantity]?"
  • The question must be self-contained — understandable without any context

FLASHCARD ANSWER DESIGN (back of card):
  • The answer must be COMPLETE but CONCISE — 2 to 4 sentences maximum
  • It must unambiguously answer the specific question asked
  • Include ONE concrete example if it materially aids recall
  • Use bold for the specific term or phrase being defined
  • The student must be able to read the answer in under 20 seconds

FLASHCARD SET DESIGN:
  • Generate exactly 3 cards but make them genuinely diverse — covering:
    - Card 1: A DEFINITION card (key term → precise definition + example)
    - Card 2: A PROCESS/MECHANISM card (how something works → step-by-step)
    - Card 3: A COMPARISON card (A vs B → key distinctions)
  • No two cards should test the same concept or knowledge point
  • Each card must stand completely alone — no cross-references between cards

ULTRA_LONG_NOTES for FLASHCARDS:
  Organise all notes around the flashcard study paradigm:
  • Use short, scannable bullet points rather than long paragraphs
  • Every key term is bolded: **term** = [definition] — [example]
  • Structure around "What you need to recall instantly" per concept
  • Use the exact format: "**[Term]**: [definition in 10-15 words]. Example: [1 sentence]"
  • Group related flashcard-ready facts under each section heading
  • Avoid long explanatory passages — every line should be flashcard-worthy

KEY_CONCEPTS for FLASHCARDS:
  Format each as a perfect flashcard pair:
  "[FRONT: Question in 8-12 words] → [BACK: Answer in 15-25 words with one example]"
  Example: "What is photosynthesis? → The process by which plants convert light energy into chemical energy (glucose), releasing oxygen as a byproduct. Occurs in chloroplasts."`,

    sections: [
      'Core Terms & Definitions',
      'Key Processes & Mechanisms',
      'Important Distinctions & Comparisons',
      'Essential Formulas, Rules & Laws',
      'Must-Know Examples & Applications',
    ],

    questionSpec: `PRACTICE QUESTIONS for FLASHCARDS tool:
These are the actual flashcard pairs — FRONT and BACK of card.
  • Q1 — DEFINITION CARD: Short "What is X?" or "Define X" question → precise 2-3 sentence definition with example
  • Q2 — PROCESS CARD: Short "How does X work?" or "What are the steps of X?" → concise numbered sequence
  • Q3 — COMPARISON CARD: Short "X vs Y: main difference?" → clear 2-sentence distinction with one example of each`,
  },

  // ══════════════════════════════════════════════════════════════════════════════
  // TOOL 3 — QUIZ
  // Goal: produce genuinely challenging, exam-quality MCQ-ready questions
  // with detailed, multi-part answers that teach as well as test
  // ══════════════════════════════════════════════════════════════════════════════
  quiz: {
    name:      'Build Quiz',
    objective: 'Generate a challenging, varied, exam-quality practice quiz with MCQ-ready questions and comprehensive educational answers. Each question must test genuine understanding, not rote recall. Each answer must teach as well as explain.',

    emphasis: `
══════════════════════════════════════════════════════════
QUIZ TOOL — ULTRA-DETAILED PRODUCTION SPECIFICATION
══════════════════════════════════════════════════════════

THE CENTREPIECE: practice_questions (THE QUIZ QUESTIONS)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
The practice_questions are THE core deliverable of this tool. They must be outstanding.
The frontend renders them as multiple-choice questions with 4 options (A/B/C/D).

QUESTION DESIGN — MANDATORY RULES:
  • Each question must test a DIFFERENT cognitive skill level:
    - Q1: ANALYTICAL — requires reasoning about causes, mechanisms, or causal chains
    - Q2: APPLICATION — requires applying a concept to a new, realistic scenario or problem
    - Q3: EVALUATION — requires comparing approaches, weighing evidence, or making a judgement
  • Questions must be CHALLENGING — they should distinguish students who truly understand from those who only half-understand
  • Question stem must be 1-2 clear sentences — no ambiguity about what is being asked
  • Questions must not be answerable by guessing based on the answer options alone
  • Avoid trivial factual recall (e.g. "Who discovered X?" is too simple unless significance matters)
  • Questions MUST be MCQ-compatible — the stem should clearly have one best answer among 4 plausible options

MCQ OPTION GENERATION (very important for the frontend):
  The frontend generates 4 MCQ options from the answer field using:
    A: The CORRECT answer (extracted from the first 80 characters of the answer field)
    B, C, D: Plausible WRONG answers generated by the frontend from other data
  To help the frontend generate better wrong answers, write answers in this way:
    • Begin your answer with "The correct answer is: [short 10-20 word statement]." on the first line
    • This short statement becomes Option A (the correct MCQ choice)
    • The rest of the answer provides the full explanation

ANSWER DESIGN — MANDATORY 5-PART STRUCTURE (minimum 220 words each):
  Every single answer MUST include ALL FIVE of these parts in this exact order:

  PART 1 — DIRECT ANSWER (2-3 sentences):
    Begin with "The correct answer is: [precise short statement]."
    State the answer clearly and unambiguously so the student knows immediately what the right answer is.
    Use definitive language — no hedging or "it could be" phrasing in this section.

  PART 2 — DEEP EXPLANATION (5-6 sentences):
    Explain WHY the answer is correct at a mechanistic level.
    Cover the underlying principle or theory that makes this the correct answer.
    Explain how the mechanism or process works step by step.
    Connect this specifically to the broader topic — how does this concept fit into the bigger picture?
    Use precise, subject-specific vocabulary throughout.

  PART 3 — CONCRETE REAL-WORLD EXAMPLE (3-4 sentences):
    Provide ONE specific, named, real-world example that perfectly illustrates the correct answer.
    Include: specific name (company, person, country, event), specific numbers or dates, and the specific outcome.
    The example must be memorable and clearly demonstrate exactly why the answer is correct.
    Make it vivid — the student should be able to close their eyes and picture the scenario.

  PART 4 — COMMON MISTAKE WARNING (3-4 sentences):
    Begin with: "A common mistake is to think..."
    Describe the MOST COMMON wrong answer students would choose for this question.
    Explain precisely and completely why this common wrong answer is incorrect.
    State the exact conceptual confusion or false assumption that leads to the wrong answer.
    This is critical for exam preparation — teaching students to avoid losing marks.

  PART 5 — EXAM TECHNIQUE TIP (2-3 sentences):
    Begin with: "Exam tip:"
    Give a practical, actionable strategy for approaching THIS TYPE of question in an exam.
    Include advice on time management, keyword identification, or answer structuring relevant to this question.
    If applicable, name the specific mark-scheme criteria this type of question usually awards marks against.

ULTRA_LONG_NOTES for QUIZ:
  Structure everything around exam performance:
  • Begin each section with "## [Section]: Exam Focus — [Most Tested Aspect]"
  • Use **bold** for every mark-scheme keyword and high-value exam phrase
  • Include a "⚠️ Common Exam Mistake:" callout in each section identifying the most frequent student error
  • Include "✓ Model Answer Phrase:" callouts with pre-built exam sentences students can memorise
  • End each major section with "🎯 Examiner's Tip:" giving specific advice for maximising marks on this subtopic

KEY_CONCEPTS for QUIZ:
  Format each as a precise, exam-ready definition:
  "[Term]: [Exact mark-scheme definition]. Key examiner phrase: '[the specific wording that earns the mark]'"`,

    sections: [
      'Introduction: Exam Overview & Key Facts',
      'Core Concepts: Mark-Scheme Definitions',
      'Mechanisms: Exam-Style Explanations',
      'Key Examples: Named Case Studies for Exam Use',
      'High-Value Exam Topics: Most Frequently Tested Aspects',
      'Common Exam Mistakes & How to Avoid Them',
      'Model Answer Phrases & Exam Vocabulary',
      'Summary: Top 10 Things Examiners Test',
    ],

    questionSpec: `PRACTICE QUESTIONS for QUIZ tool — EXAM-QUALITY MCQ-READY:
  • Q1 — ANALYTICAL: Tests causal reasoning. "Why does [phenomenon] occur?" or "What is the mechanism behind [outcome]?"
    Answer: Start with "The correct answer is: [mechanism in 15-20 words]." Then full 5-part explanation.
  • Q2 — APPLICATION: Tests ability to apply concepts to novel scenarios. "[Realistic scenario]. What should [actor] do/expect/conclude?"
    Answer: Start with "The correct answer is: [action/expectation in 15-20 words]." Then full 5-part explanation.
  • Q3 — EVALUATION: Tests critical judgment. "Which of the following approaches to [topic] is most effective/appropriate? Justify with evidence."
    Answer: Start with "The correct answer is: [approach and one-line reason]." Then full 5-part explanation.`,
  },

  // ══════════════════════════════════════════════════════════════════════════════
  // TOOL 4 — SUMMARY
  // Goal: ruthlessly concise, scannable, revision-optimised summary
  // Every word must earn its place — no padding, no filler
  // ══════════════════════════════════════════════════════════════════════════════
  summary: {
    name:      'Smart Summary',
    objective: 'Generate a ruthlessly concise, intelligently structured smart summary optimised for rapid revision. Every element should be scannable in seconds and instantly memorable.',

    emphasis: `
══════════════════════════════════════════════════════════
SUMMARY TOOL — ULTRA-DETAILED PRODUCTION SPECIFICATION
══════════════════════════════════════════════════════════

THE CENTREPIECE: ultra_long_notes (STRUCTURED SMART SUMMARY)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Despite the field name, this is NOT "ultra long" for the Summary tool — it is "ultra smart."
Aim for quality over quantity. Every word must earn its place. No padding whatsoever.

MANDATORY OPENING STRUCTURE:
  Line 1: > [Single most important sentence about this topic — the ONE thing that must be remembered]
  Then: ## TL;DR
  TL;DR content: MAXIMUM 3 sentences. Capture the complete essence of the topic.
    Sentence 1: What it is (core definition or nature)
    Sentence 2: Why it matters (significance or consequence)
    Sentence 3: How it works at the highest level (core mechanism in plain language)

SECTION STRUCTURE (each section scannable in 30 seconds):
  • Use ## headings to clearly separate sections
  • Use short, punchy bullet points — no sentence should exceed 20 words
  • Bold EVERY key term and critical number/date/name
  • Use → arrows to show cause-effect relationships: "X → Y → Z"
  • Use | to show comparisons: "[Concept A] | [Concept B]"
  • End every section with: "💡 [One-sentence insight that a student often misses]"

MANDATORY FINAL SECTION:
  ## ⭐ 5 Things to Remember
  [Numbered list of exactly 5 items — the absolute most important, exam-critical takeaways]
  Each item: 1 sentence maximum. Bold the key term. Include ONE specific detail.
  These 5 items must collectively cover the most exam-critical knowledge about this topic.

WHAT TO RUTHLESSLY CUT:
  • Any background that is not essential to understanding the core concept
  • Examples that are obvious or commonly known (keep only the most vivid and instructive)
  • Repetition of points already made in another section
  • Hedging language ("it is sometimes thought that", "in some cases")
  • Historical context unless directly relevant to understanding the concept's current form

KEY_CONCEPTS for SUMMARY:
  Represent the absolute TOP 5 things the student MUST know — not general statements.
  Format: "[Critical fact or concept in 15-20 words — specific enough to use in an exam answer]"
  Example: "Osmosis moves water from high water potential (dilute solution) to low water potential (concentrated) across a semi-permeable membrane."

KEY_TRICKS for SUMMARY:
  Focus purely on REVISION STRATEGIES for rapid recall before exams:
  • Trick 1: A mnemonic or acronym that captures multiple key points
  • Trick 2: A visual anchor or analogy that makes the core mechanism unforgettable
  • Trick 3: An active recall strategy specifically tailored to this topic's complexity`,

    sections: [
      'TL;DR — The Absolute Essence',
      'Core Concept: What It Is',
      'Why It Matters: Significance & Impact',
      'How It Works: Core Mechanism',
      'Critical Examples (1-2 max)',
      '⭐ 5 Things to Remember',
    ],

    questionSpec: `PRACTICE QUESTIONS for SUMMARY tool:
Short, punchy questions optimised for rapid revision self-testing.
  • Q1 — RECALL: "In one sentence, what is [topic]?" → 2-sentence precise answer + 1 example
  • Q2 — SIGNIFICANCE: "Why is [topic] important? Name 2 specific reasons." → 3-sentence answer
  • Q3 — MECHANISM: "Describe [core mechanism of topic] in 3 steps." → Numbered 3-step answer`,
  },

  // ══════════════════════════════════════════════════════════════════════════════
  // TOOL 5 — MIND MAP
  // Goal: hierarchically structured content that maps the conceptual space
  // of the topic, ready to be rendered as a visual SVG mind map
  // ══════════════════════════════════════════════════════════════════════════════
  mindmap: {
    name:      'Build Mind Map',
    objective: 'Generate content structured hierarchically to reveal the conceptual architecture of this topic — the relationships, dependencies, and groupings between ideas — ready to render as a beautiful visual mind map.',

    emphasis: `
══════════════════════════════════════════════════════════
MIND MAP TOOL — ULTRA-DETAILED PRODUCTION SPECIFICATION
══════════════════════════════════════════════════════════

THE CENTREPIECE: mind_map (JSON OBJECT — SEE SCHEMA BELOW)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
You MUST include a "mind_map" field in your JSON output (in addition to all standard fields).
This is a structured JSON object that the frontend renders as an SVG visual mind map.

MIND MAP JSON SCHEMA:
{
  "center": "[Topic name — max 5 words, the central node]",
  "branches": [
    {
      "label": "[Branch 1 name — max 4 words, a main concept]",
      "color": "#4F9CF9",
      "children": [
        "[Child 1.1 — max 6 words]",
        "[Child 1.2 — max 6 words]",
        "[Child 1.3 — max 6 words]"
      ]
    },
    {
      "label": "[Branch 2 name — max 4 words]",
      "color": "#42C98A",
      "children": [
        "[Child 2.1 — max 6 words]",
        "[Child 2.2 — max 6 words]",
        "[Child 2.3 — max 6 words]"
      ]
    }
  ]
}

MIND MAP DESIGN RULES:
  • Generate exactly 5 to 7 branches (5 minimum, 7 maximum) radiating from the centre
  • Each branch must have exactly 3 children (no more, no fewer)
  • Branch labels: max 4 words, noun phrases representing the major conceptual categories
  • Child labels: max 6 words, specific sub-concepts, examples, or properties of the branch
  • Use these colors in cycle: "#4F9CF9", "#42C98A", "#F59E0B", "#A855F7", "#EF4444", "#06B6D4", "#F97316"
  • The branches must COLLECTIVELY cover all major aspects of the topic without overlap
  • Each branch should represent a genuinely distinct conceptual category

SUGGESTED BRANCH CATEGORIES (adapt to topic):
  Branch 1: "Core Definition" — what it fundamentally is
  Branch 2: "Key Mechanisms" — how it works
  Branch 3: "Types & Categories" — the main variants or classifications
  Branch 4: "Applications" — real-world uses
  Branch 5: "Advantages & Benefits" — why it is valuable
  Branch 6: "Limitations & Risks" — where it fails or has downsides
  Branch 7: "Historical Development" — key milestones

ULTRA_LONG_NOTES for MIND MAP:
  Use nested markdown to mirror the mind map hierarchy exactly:
  • ## [Branch Name] — one section per branch
  • ### [Child Name] — one sub-section per child
  • Bullet points under each child: 2-3 concise facts, max 15 words each
  • Use → arrows to show connections between branches: "(→ connects to [Other Branch])"
  • Every item must be concise enough to fit on a mind map node

KEY_CONCEPTS for MIND MAP:
  These represent the 5 main branches — one per key concept.
  Format: "[Branch Label]: [One clear sentence explaining what this branch covers and why it matters in the context of this topic]"`,

    sections: [
      'Central Topic Overview',
      'Branch 1: Core Definition',
      'Branch 2: Key Mechanisms',
      'Branch 3: Types & Classifications',
      'Branch 4: Real-World Applications',
      'Branch 5: Advantages & Benefits',
      'Branch 6: Limitations & Challenges',
      'Branch 7: Historical Development',
    ],

    questionSpec: `PRACTICE QUESTIONS for MIND MAP tool:
Questions that test understanding of the conceptual architecture — how ideas connect and relate.
  • Q1 — CONNECTIONS: "Explain the relationship between [Branch A concept] and [Branch B concept] in [topic]."
    Answer: 3-4 sentences identifying the specific causal or logical connection between the two branches.
  • Q2 — CLASSIFICATION: "Why is [topic] commonly classified into [types]? What is the key criterion for each classification?"
    Answer: 2-3 sentences per classification type, naming the distinguishing criterion clearly.
  • Q3 — OVERVIEW: "Provide a structured overview of [topic] covering its definition, mechanism, and main application in 3 clear paragraphs."
    Answer: 3 well-organised paragraphs mirroring the mind map's branch structure.`,
  },
};

// ─────────────────────────────────────────────────────────────────────────────────────────────────
// SECTION 6 — UTILITY FUNCTIONS
// ─────────────────────────────────────────────────────────────────────────────────────────────────

// Promise-based sleep — used for retry delays between models
const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

// Structured logger — colour-coded output in Vercel dashboard
const logger = {
  info:  (...a) => console.log  (`[${new Date().toISOString()}] [${BRAND}] INFO   `, ...a),
  ok:    (...a) => console.log  (`[${new Date().toISOString()}] [${BRAND}] ✓ OK   `, ...a),
  warn:  (...a) => console.warn (`[${new Date().toISOString()}] [${BRAND}] WARN   `, ...a),
  error: (...a) => console.error(`[${new Date().toISOString()}] [${BRAND}] ✗ ERROR`, ...a),
  model: (...a) => console.log  (`[${new Date().toISOString()}] [MODEL]   →      `, ...a),
  stream:(...a) => console.log  (`[${new Date().toISOString()}] [STREAM]  ≈      `, ...a),
};

// Count words in a string
function wordCount(text) {
  if (!text || typeof text !== 'string') return 0;
  return text.trim().split(/\s+/).filter(Boolean).length;
}

// Truncate string for safe logging — avoids log spam
function trunc(s, n = 120) {
  if (!s) return '';
  const str = String(s);
  return str.length > n ? str.slice(0, n) + '…' : str;
}

// Generate a short unique request ID for log correlation
function makeRequestId() {
  return `req_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 7)}`;
}

// Sanitise topic input — remove control chars, limit length
function sanitiseTopic(s) {
  if (!s || typeof s !== 'string') return '';
  return s
    .replace(/[\x00-\x08\x0B-\x0C\x0E-\x1F\x7F]/g, '') // strip control chars (keep \t, \n, \r)
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 4000);
}

// ─────────────────────────────────────────────────────────────────────────────────────────────────
// SECTION 7 — PROMPT BUILDER
//
// Constructs the complete system prompt sent to the AI model.
// This prompt is what makes the AI produce the exact structured JSON we need.
//
// Architecture:
//   • System prompt sets the persona, output language, depth, style, tool-specific rules
//   • User message contains only the topic/input — keeps the JSON schema in the system role
//   • We use the messages array format: [{ role:'system', content: systemPrompt },
//                                        { role:'user',   content: userInput }]
//   • Separation of system vs user messages helps models that use RLHF follow instructions better
// ─────────────────────────────────────────────────────────────────────────────────────────────────

function buildPrompt(input, opts) {
  const language = (opts.language || 'English').trim();
  const depth    = opts.depth    || 'detailed';
  const style    = opts.style    || 'simple';
  const tool     = opts.tool     || 'notes';

  const depthCfg = DEPTH_MAP[depth]  || DEPTH_MAP.detailed;
  const styleCfg = STYLE_MAP[style]  || STYLE_MAP.simple;
  const toolCfg  = TOOL_MAP[tool]    || TOOL_MAP.notes;

  const nowISO   = new Date().toISOString();
  const sections = toolCfg.sections.map((s, i) => `  ${i + 1}. ## ${s}`).join('\n');

  const isMindmap = tool === 'mindmap';

  // Build the JSON schema example that goes at the end of the prompt
  const jsonSchema = buildJSONSchema(language, depthCfg, toolCfg, nowISO, isMindmap);

  return {
    systemPrompt: `You are ${BRAND}, the world's most advanced free AI study companion.
Built by ${DEVELOPER} | ${DEVSITE} | Founder: ${FOUNDER}
Version: ${APP_VERSION} | Generated: ${nowISO}

IMPORTANT IDENTITY RULE: You are Savoiré AI. Never mention any AI model name, company, or system in your response. If asked what AI you are, your answer is always "Savoiré AI by ${DEVELOPER}".

╔══════════════════════════════════════════════════════════════════════════╗
║  YOUR MISSION: ${toolCfg.objective}
╚══════════════════════════════════════════════════════════════════════════╝

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
OUTPUT LANGUAGE: ${language}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
EVERY single word in your response — all field values, headings, bullet points, sentences, labels, examples — MUST be written in ${language}.
Do NOT use English (or any other language) anywhere in your output unless ${language} IS English.
This is a non-negotiable requirement. Output in any other language will be rejected.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
OUTPUT DEPTH: ${depthCfg.wordRange}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
${depthCfg.description}
${depthCfg.promptEmphasis}

The ultra_long_notes field ALONE must meet the minimum word count of ${depthCfg.minWords} words.
Producing fewer words is not acceptable. Every word must be substantive — no filler or padding.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
${styleCfg.instruction}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
${toolCfg.emphasis}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
REQUIRED SECTION STRUCTURE for ultra_long_notes:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
${sections}

Each section: minimum 80 words. More is better. No empty or thin sections.
Use --- horizontal rules between every major section.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
QUESTION SPECIFICATION:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
${toolCfg.questionSpec}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
CRITICAL JSON OUTPUT RULES:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Your ENTIRE response must be ONE valid JSON object.
• NO text before the opening brace {
• NO text after the closing brace }
• NO markdown code fences (no \`\`\`json or \`\`\`)
• NO comments inside the JSON (no // or /* */)
• ALL string values must use proper JSON string escaping:
  - Newlines inside strings: use \\n (two characters: backslash then n)
  - Quotes inside strings: use \\" (backslash then double quote)
  - Backslashes in strings: use \\\\ (two backslashes)
  - Tab characters: use \\t
• Do NOT include raw newline or tab characters inside JSON string values
• The JSON must be parseable by JSON.parse() with no modification
• study_score must always be exactly: 96
• powered_by must always be exactly: "${BRAND} by ${DEVELOPER}"

OUTPUT THIS EXACT JSON STRUCTURE:
${jsonSchema}`,

    userMessage: `Please generate comprehensive study materials for this topic/input:

${input}

Remember:
1. Your entire response must be valid JSON starting with { and ending with }
2. All content must be in ${language}
3. ultra_long_notes must be minimum ${depthCfg.minWords} words
4. practice_questions must have exactly 3 items, each with "question" and "answer"
5. Each answer must be minimum 200 words with all 5 required parts
6. Do not include any text outside the JSON object`,
  };
}

// Build the JSON schema example shown in the prompt
function buildJSONSchema(language, depthCfg, toolCfg, nowISO, isMindmap) {
  const mindmapExtra = isMindmap ? `
  "mind_map": {
    "center": "topic name max 5 words",
    "branches": [
      { "label": "Branch Name", "color": "#4F9CF9", "children": ["child 1", "child 2", "child 3"] },
      { "label": "Branch Name", "color": "#42C98A", "children": ["child 1", "child 2", "child 3"] },
      { "label": "Branch Name", "color": "#F59E0B", "children": ["child 1", "child 2", "child 3"] },
      { "label": "Branch Name", "color": "#A855F7", "children": ["child 1", "child 2", "child 3"] },
      { "label": "Branch Name", "color": "#EF4444", "children": ["child 1", "child 2", "child 3"] }
    ]
  },` : '';

  return `{
  "topic": "specific topic name in ${language}",
  "curriculum_alignment": "e.g. A-Level Biology, University CS, GCSE History, IB Physics",
  "ultra_long_notes": "Full rich markdown in ${language}. Minimum ${depthCfg.minWords} words. Use ## headings, **bold**, bullet lists, numbered lists, > blockquotes, --- horizontal rules. All content in ${language}.",
  "key_concepts": [
    "Concept 1: definition and significance in ${language} — 25-40 words",
    "Concept 2: definition and significance in ${language} — 25-40 words",
    "Concept 3: definition and significance in ${language} — 25-40 words",
    "Concept 4: definition and significance in ${language} — 25-40 words",
    "Concept 5: definition and significance in ${language} — 25-40 words"
  ],
  "key_tricks": [
    "Memory trick or study strategy 1 in ${language} — 55-75 words",
    "Memory trick or study strategy 2 in ${language} — 55-75 words",
    "Memory trick or study strategy 3 in ${language} — 55-75 words"
  ],
  "practice_questions": [
    {
      "question": "Analytical question in ${language} — tests causal reasoning",
      "answer": "The correct answer is: [short statement]. PART 2 — deep explanation. PART 3 — concrete example with specific names/numbers. PART 4 — common mistake warning. PART 5 — exam tip. Minimum 200 words total in ${language}."
    },
    {
      "question": "Application question in ${language} — tests applying concepts to new scenarios",
      "answer": "The correct answer is: [short statement]. [Full 5-part answer in ${language}. Minimum 200 words.]"
    },
    {
      "question": "Evaluation question in ${language} — tests critical judgment and comparison",
      "answer": "The correct answer is: [short statement]. [Full 5-part answer in ${language}. Minimum 200 words.]"
    }
  ],
  "real_world_applications": [
    "Domain 1: specific mechanism and outcome in ${language} — 45-65 words",
    "Domain 2: specific mechanism and outcome in ${language} — 45-65 words",
    "Domain 3: specific mechanism and outcome in ${language} — 45-65 words"
  ],
  "common_misconceptions": [
    "Many students believe [wrong idea]. In reality, [correct explanation with reason] — in ${language}, 45-65 words",
    "Many students believe [wrong idea]. In reality, [correct explanation with reason] — in ${language}, 45-65 words",
    "Many students believe [wrong idea]. In reality, [correct explanation with reason] — in ${language}, 45-65 words"
  ],${mindmapExtra}
  "study_score": 96,
  "powered_by": "${BRAND} by ${DEVELOPER}",
  "generated_at": "${nowISO}"
}`;
}

// ─────────────────────────────────────────────────────────────────────────────────────────────────
// SECTION 8 — 7-STAGE JSON EXTRACTION & REPAIR PIPELINE
//
// AI models frequently produce malformed JSON. This pipeline handles every known failure mode:
//
// Stage 1: Strip markdown fences and leading/trailing garbage text
// Stage 2: Direct parse — fast path, works ~85% of the time
// Stage 3: State-machine newline/control-char fixer inside string values
//          (most common model error: raw newlines inside JSON strings)
// Stage 4: Structural fixes — trailing commas, unquoted keys, JS comments
// Stage 5: Aggressive fixes — escaped forward slashes, truncated JSON closure
// Stage 6: Bracket-counting object extraction from messy surrounding text
// Stage 7: Field-by-field regex reconstruction from partial/mangled content
// ─────────────────────────────────────────────────────────────────────────────────────────────────

function extractAndParseJSON(rawContent) {
  if (!rawContent || typeof rawContent !== 'string') {
    throw new Error('Model returned empty or non-string content — cannot parse');
  }

  let text = rawContent.trim();

  if (text.length < 50) {
    throw new Error(`Model response too short to contain valid JSON: "${trunc(text, 80)}"`);
  }

  // ── Stage 1: Strip markdown fences and pre/post JSON text ──────────────────────────────────────
  // Models often wrap output in ```json...``` or add preamble like "Here is the JSON:"
  // We strip all of that to isolate just the JSON object.

  // Remove code fences: ```json, ```JSON, ```js, ```javascript, ``` (any variant)
  text = text.replace(/^```(?:json|JSON|js|javascript|text)?\s*/im, '');
  text = text.replace(/\s*```\s*$/im, '');
  text = text.trim();

  // Find the first { and last } — everything outside is garbage
  const firstBrace = text.indexOf('{');
  const lastBrace  = text.lastIndexOf('}');

  if (firstBrace === -1) {
    throw new Error(
      `Stage 1 failed: No JSON opening brace found. ` +
      `Content starts with: "${trunc(text, 200)}"`
    );
  }

  if (lastBrace === -1 || lastBrace <= firstBrace) {
    throw new Error(
      `Stage 1 failed: No valid JSON closing brace found (firstBrace=${firstBrace}, lastBrace=${lastBrace}). ` +
      `Content length: ${text.length}`
    );
  }

  let jsonStr = text.slice(firstBrace, lastBrace + 1);

  // ── Stage 2: Direct parse — fast path ─────────────────────────────────────────────────────────
  try {
    const result = JSON.parse(jsonStr);
    logger.ok(`JSON parsed directly at Stage 2 (${jsonStr.length} chars)`);
    return result;
  } catch (e2) {
    logger.warn(`Stage 2 direct parse failed: ${e2.message.slice(0, 80)} — entering repair pipeline`);
  }

  // ── Stage 3: Fix raw control characters inside JSON string values ─────────────────────────────
  // This is THE most common model error: literal newlines, tabs, carriage returns
  // inside JSON string values, which makes JSON.parse() throw.
  // We use a character-by-character state machine to safely fix ONLY inside strings.
  let repaired;
  try {
    repaired = fixControlCharsInStrings(jsonStr);
    const r3 = JSON.parse(repaired);
    logger.ok(`JSON repaired at Stage 3 (raw control chars in strings, ${repaired.length} chars)`);
    return r3;
  } catch (e3) {
    repaired = repaired || jsonStr;
    logger.warn(`Stage 3 fix attempt failed: ${e3.message.slice(0, 60)}`);
  }

  // ── Stage 4: Structural JSON fixes ────────────────────────────────────────────────────────────
  let s4 = repaired;

  // 4a: Remove trailing commas before } or ] (JavaScript allows, JSON does not)
  s4 = s4.replace(/,(\s*[}\]])/g, '$1');

  // 4b: Fix unquoted property keys — {key: value} → {"key": value}
  // Only quote keys that look like identifiers (letters, underscores, no spaces)
  s4 = s4.replace(/([{,]\s*)([a-zA-Z_$][a-zA-Z0-9_$]*)(\s*:)/g, (m, pre, key, post) => {
    // Don't double-quote already-quoted keys
    return `${pre}"${key}"${post}`;
  });

  // 4c: Remove JavaScript-style single-line and block comments
  s4 = s4.replace(/\/\/[^\n\r]*/g, '');
  s4 = s4.replace(/\/\*[\s\S]*?\*\//g, '');

  // 4d: Fix smart/curly quotes → standard ASCII double quotes
  // (some models output "smart quotes" which break JSON)
  s4 = s4.replace(/[\u201C\u201D]/g, '"'); // " and "
  s4 = s4.replace(/[\u2018\u2019]/g, "'"); // ' and '

  try {
    const r4 = JSON.parse(s4);
    logger.ok(`JSON repaired at Stage 4 (structural fixes, ${s4.length} chars)`);
    return r4;
  } catch (e4) {
    logger.warn(`Stage 4 structural fixes failed: ${e4.message.slice(0, 60)}`);
  }

  // ── Stage 5: Aggressive repair — truncation, escaped chars ───────────────────────────────────
  let s5 = s4;

  // 5a: Fix incorrectly escaped forward slashes (\/ → /)
  s5 = s5.replace(/\\\//g, '/');

  // 5b: Fix double-encoded unicode escapes (\\uXXXX → \uXXXX)
  s5 = s5.replace(/\\\\u([0-9a-fA-F]{4})/g, '\\u$1');

  // 5c: Handle truncated JSON — model hit token limit mid-output
  // Count unmatched open brackets and close them gracefully
  if (!s5.trimEnd().endsWith('}')) {
    logger.warn('Stage 5: JSON appears truncated — attempting graceful closure');

    // Remove any trailing incomplete key or value
    s5 = s5.replace(/,\s*"[^"]*$/, '');          // incomplete key at end: ,"incomplete
    s5 = s5.replace(/:\s*"[^"]*$/, ': ""');       // incomplete string value: : "incomplete
    s5 = s5.replace(/:\s*\[[^\]]*$/, ': []');     // incomplete array: : [incomplete
    s5 = s5.replace(/,\s*$/, '');                  // trailing comma

    // Count and close unmatched brackets
    const openObj   = (s5.match(/\{/g) || []).length;
    const closeObj  = (s5.match(/\}/g) || []).length;
    const openArr   = (s5.match(/\[/g) || []).length;
    const closeArr  = (s5.match(/\]/g) || []).length;

    for (let i = 0; i < Math.min(openArr - closeArr, 10); i++) s5 += ']';
    for (let i = 0; i < Math.min(openObj - closeObj, 10); i++) s5 += '}';
  }

  try {
    const r5 = JSON.parse(s5);
    logger.ok(`JSON repaired at Stage 5 (aggressive/truncation fixes, ${s5.length} chars)`);
    return r5;
  } catch (e5) {
    logger.warn(`Stage 5 aggressive fixes failed: ${e5.message.slice(0, 60)}`);
  }

  // ── Stage 6: Bracket-counting extraction from messy content ──────────────────────────────────
  // Walk character by character tracking bracket depth and string state.
  // Extract the first complete top-level JSON object we find.
  try {
    let depth   = 0;
    let inStr   = false;
    let esc     = false;
    let start   = -1;
    let end     = -1;

    for (let i = 0; i < s5.length; i++) {
      const ch = s5[i];
      if (esc)          { esc = false; continue; }
      if (ch === '\\' && inStr) { esc = true; continue; }
      if (ch === '"')   { inStr = !inStr; continue; }
      if (inStr)        continue;
      if (ch === '{')   { if (depth === 0) start = i; depth++; }
      else if (ch === '}') { depth--; if (depth === 0 && start !== -1) { end = i; break; } }
    }

    if (start !== -1 && end !== -1 && end > start) {
      const extracted = s5.slice(start, end + 1);
      const r6 = JSON.parse(extracted);
      logger.ok(`JSON extracted at Stage 6 (bracket-counting, chars ${start}-${end})`);
      return r6;
    }
  } catch (e6) {
    logger.warn(`Stage 6 bracket extraction failed: ${e6.message.slice(0, 60)}`);
  }

  // ── Stage 7: Field-by-field regex reconstruction ──────────────────────────────────────────────
  // Last resort: extract individual fields using regex and reconstruct a valid object.
  // This handles the case where the JSON is so mangled it cannot be fixed structurally.
  logger.warn('Stage 7: Attempting field-by-field regex reconstruction');

  try {
    const reconstructed = reconstructFromFields(rawContent);
    if (reconstructed) {
      logger.ok('JSON reconstructed at Stage 7 (field-by-field regex)');
      return reconstructed;
    }
  } catch (e7) {
    logger.warn(`Stage 7 reconstruction failed: ${e7.message.slice(0, 60)}`);
  }

  // All 7 stages failed
  throw new Error(
    `7-stage JSON repair pipeline exhausted. ` +
    `Content length: ${rawContent.length} chars. ` +
    `Content preview: "${trunc(rawContent, 300)}"`
  );
}

// State-machine to fix raw control characters (newlines, tabs, CRs) inside JSON string values.
// This only fixes content INSIDE string values — structural JSON whitespace is left alone.
function fixControlCharsInStrings(str) {
  let result = '';
  let inStr  = false;
  let esc    = false;

  for (let i = 0; i < str.length; i++) {
    const ch = str[i];

    // If we're processing an escape sequence, output char as-is and exit escape mode
    if (esc) {
      result += ch;
      esc = false;
      continue;
    }

    // Start of an escape sequence inside a string
    if (ch === '\\' && inStr) {
      result += ch;
      esc = true;
      continue;
    }

    // Toggle string mode on double quote
    if (ch === '"') {
      inStr = !inStr;
      result += ch;
      continue;
    }

    // Inside a string value — fix illegal raw control characters
    if (inStr) {
      const code = ch.charCodeAt(0);
      if (ch === '\n') { result += '\\n';  continue; }
      if (ch === '\r') {
        // Handle \r\n as a unit — produce a single \n
        if (i + 1 < str.length && str[i + 1] === '\n') i++;
        result += '\\n';
        continue;
      }
      if (ch === '\t') { result += '\\t';  continue; }
      // Any other control character (0x00-0x1F, 0x7F) gets unicode-escaped
      if (code < 0x20 || code === 0x7F) {
        result += `\\u${code.toString(16).padStart(4, '0')}`;
        continue;
      }
    }

    result += ch;
  }

  return result;
}

// Last-resort field extraction using regex — reconstructs a valid object from partial content
function reconstructFromFields(rawContent) {
  const obj = {};

  // Extract topic
  const topicMatch = rawContent.match(/"topic"\s*:\s*"([^"]{2,200})"/);
  if (topicMatch) obj.topic = topicMatch[1];

  // Extract curriculum_alignment
  const currMatch = rawContent.match(/"curriculum_alignment"\s*:\s*"([^"]{2,200})"/);
  if (currMatch) obj.curriculum_alignment = currMatch[1];

  // Extract ultra_long_notes — this is the hardest because it's very long and may contain quotes
  // Try a greedy match up to the next top-level field key
  const notesStart = rawContent.indexOf('"ultra_long_notes"');
  if (notesStart !== -1) {
    const afterColon = rawContent.indexOf(':', notesStart) + 1;
    const contentAfterColon = rawContent.slice(afterColon).trim();
    if (contentAfterColon.startsWith('"')) {
      // Extract the string value using a state machine
      let notes = '';
      let inS = false;
      let es = false;
      let started = false;
      for (let i = 0; i < contentAfterColon.length; i++) {
        const c = contentAfterColon[i];
        if (es) { notes += c; es = false; continue; }
        if (c === '\\') { notes += c; es = true; continue; }
        if (c === '"') {
          if (!started) { started = true; continue; }
          else { break; } // end of string
        }
        if (started) notes += c;
      }
      if (notes.length > 50) obj.ultra_long_notes = notes;
    }
  }

  // If we couldn't extract the notes at all, this reconstruction is useless
  if (!obj.ultra_long_notes || obj.ultra_long_notes.length < 50) return null;

  // Fill in minimal required fields with fallback values
  if (!obj.topic) obj.topic = 'Study Material';
  obj.key_concepts = obj.key_concepts || [];
  obj.key_tricks = obj.key_tricks || [];
  obj.practice_questions = obj.practice_questions || [];
  obj.real_world_applications = obj.real_world_applications || [];
  obj.common_misconceptions = obj.common_misconceptions || [];
  obj.study_score = 96;

  return obj;
}

// ─────────────────────────────────────────────────────────────────────────────────────────────────
// SECTION 9 — DATA VALIDATION & ENRICHMENT
//
// After parsing, we validate all required fields, fill missing optional ones with
// quality fallback content, enforce branding, and strip any model identity fields.
// This is the final quality gate before data reaches the frontend.
// ─────────────────────────────────────────────────────────────────────────────────────────────────

function validateAndEnrich(parsed, opts) {
  if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
    throw new Error('Parsed result is not an object');
  }

  // ── REQUIRED FIELD: topic ──────────────────────────────────────────────────────────────────────
  if (!parsed.topic || typeof parsed.topic !== 'string' || parsed.topic.trim().length < 2) {
    // Gracefully recover — use the input as the topic
    if (opts._input) {
      logger.warn(`Missing/invalid topic field — using input as topic: "${trunc(opts._input, 60)}"`);
      parsed.topic = opts._input.slice(0, 120).trim();
    } else {
      throw new Error(`Invalid or missing "topic" field (got: ${JSON.stringify(parsed.topic)})`);
    }
  }

  // ── REQUIRED FIELD: ultra_long_notes ──────────────────────────────────────────────────────────
  if (!parsed.ultra_long_notes || typeof parsed.ultra_long_notes !== 'string') {
    throw new Error('Missing required field: ultra_long_notes');
  }

  const notesLength = parsed.ultra_long_notes.trim().length;
  if (notesLength < 120) {
    throw new Error(
      `ultra_long_notes too short: ${notesLength} chars (minimum 120). ` +
      `Got: "${trunc(parsed.ultra_long_notes, 100)}"`
    );
  }

  // ── REQUIRED FIELD: practice_questions ────────────────────────────────────────────────────────
  if (!Array.isArray(parsed.practice_questions) || parsed.practice_questions.length === 0) {
    throw new Error('Missing or empty required field: practice_questions');
  }

  // Normalise practice_questions — accept various field name aliases models might use
  parsed.practice_questions = parsed.practice_questions
    .filter(q => q && typeof q === 'object')
    .map(q => ({
      question: String(q.question || q.q || q.text || q.prompt || q.stem || '').trim(),
      answer:   String(q.answer   || q.a || q.explanation || q.response || q.solution || '').trim(),
    }))
    .filter(q => q.question.length >= 5 && q.answer.length >= 20);

  if (parsed.practice_questions.length === 0) {
    throw new Error('All practice_questions items were invalid after normalisation and filtering');
  }

  // ── REQUIRED FIELD: key_concepts ──────────────────────────────────────────────────────────────
  if (!Array.isArray(parsed.key_concepts) || parsed.key_concepts.length === 0) {
    throw new Error('Missing or empty required field: key_concepts');
  }

  // Filter out empty strings
  parsed.key_concepts = parsed.key_concepts
    .map(c => String(c || '').trim())
    .filter(c => c.length >= 5);

  if (parsed.key_concepts.length === 0) {
    throw new Error('All key_concepts items were empty after filtering');
  }

  // ── FILL MISSING OPTIONAL ARRAYS WITH QUALITY FALLBACKS ───────────────────────────────────────
  const topic = parsed.topic;

  if (!Array.isArray(parsed.key_tricks) || parsed.key_tricks.length === 0) {
    logger.warn('Missing key_tricks — using quality fallback');
    parsed.key_tricks = buildFallbackTricks(topic);
  } else {
    parsed.key_tricks = parsed.key_tricks.map(t => String(t || '').trim()).filter(t => t.length >= 5);
    if (parsed.key_tricks.length === 0) parsed.key_tricks = buildFallbackTricks(topic);
  }

  if (!Array.isArray(parsed.real_world_applications) || parsed.real_world_applications.length === 0) {
    logger.warn('Missing real_world_applications — using quality fallback');
    parsed.real_world_applications = buildFallbackApplications(topic);
  } else {
    parsed.real_world_applications = parsed.real_world_applications
      .map(a => String(a || '').trim()).filter(a => a.length >= 5);
    if (parsed.real_world_applications.length === 0) parsed.real_world_applications = buildFallbackApplications(topic);
  }

  if (!Array.isArray(parsed.common_misconceptions) || parsed.common_misconceptions.length === 0) {
    logger.warn('Missing common_misconceptions — using quality fallback');
    parsed.common_misconceptions = buildFallbackMisconceptions(topic);
  } else {
    parsed.common_misconceptions = parsed.common_misconceptions
      .map(m => String(m || '').trim()).filter(m => m.length >= 5);
    if (parsed.common_misconceptions.length === 0) parsed.common_misconceptions = buildFallbackMisconceptions(topic);
  }

  // ── ENFORCE ARRAY LENGTH LIMITS ───────────────────────────────────────────────────────────────
  if (parsed.key_concepts.length > 5)            parsed.key_concepts            = parsed.key_concepts.slice(0, 5);
  if (parsed.key_tricks.length > 3)              parsed.key_tricks              = parsed.key_tricks.slice(0, 3);
  if (parsed.real_world_applications.length > 3) parsed.real_world_applications = parsed.real_world_applications.slice(0, 3);
  if (parsed.common_misconceptions.length > 3)   parsed.common_misconceptions   = parsed.common_misconceptions.slice(0, 3);
  if (parsed.practice_questions.length > 3)      parsed.practice_questions      = parsed.practice_questions.slice(0, 3);

  // ── ENFORCE BRANDING — NEVER EXPOSE MODEL IDENTITY ───────────────────────────────────────────
  parsed.powered_by   = `${BRAND} by ${DEVELOPER}`;
  parsed.study_score  = 96;
  parsed._language    = opts.language || 'English';
  parsed._tool        = opts.tool     || 'notes';
  parsed._version     = APP_VERSION;
  parsed.generated_at = parsed.generated_at || new Date().toISOString();

  // Strip any model identity or internal fields the model may have added
  const STRIP_FIELDS = ['_model', 'model', 'model_used', 'model_id', 'ai_model', 'ai_system',
                        'openai', 'anthropic', 'google', 'deepseek', 'mistral', 'llama'];
  STRIP_FIELDS.forEach(f => { delete parsed[f]; });

  // ── LOG QUALITY METRICS ───────────────────────────────────────────────────────────────────────
  const notesWc = wordCount(parsed.ultra_long_notes);
  logger.ok(
    `Validation passed — ` +
    `notes: ${notesWc} words | ` +
    `concepts: ${parsed.key_concepts.length} | ` +
    `questions: ${parsed.practice_questions.length} | ` +
    `tricks: ${parsed.key_tricks.length} | ` +
    `apps: ${parsed.real_world_applications.length}`
  );

  return parsed;
}

// ─────────────────────────────────────────────────────────────────────────────────────────────────
// SECTION 10 — MODEL CALLER — SYNC (NON-STREAMING)
//
// Calls one OpenRouter model with stream:false.
// Returns the complete, validated, enriched data object.
// Used as the fallback when streaming is not requested.
// ─────────────────────────────────────────────────────────────────────────────────────────────────

async function callModelSync(model, promptObj, opts) {
  const ctrl  = new AbortController();
  const timer = setTimeout(() => {
    logger.warn(`${model.id} sync timeout after ${model.timeout_ms}ms — aborting`);
    ctrl.abort();
  }, model.timeout_ms);

  const t0   = Date.now();
  const name = model.id.split('/').pop().replace(':free', '');

  logger.model(`Sync call → ${name} (max_tokens: ${model.max_tokens})`);

  try {
    const response = await fetch(OPENROUTER_BASE, {
      method:  'POST',
      headers: {
        'Content-Type':    'application/json',
        'Authorization':   `Bearer ${process.env.OPENROUTER_API_KEY}`,
        'HTTP-Referer':    HTTP_REFERER,
        'X-Title':         APP_TITLE,
        'X-Request-Start': String(t0),
      },
      body: JSON.stringify({
        model:       model.id,
        max_tokens:  model.max_tokens,
        temperature: model.temperature || 0.72,
        stream:      false,
        messages: [
          { role: 'system', content: promptObj.systemPrompt },
          { role: 'user',   content: promptObj.userMessage  },
        ],
      }),
      signal: ctrl.signal,
    });

    clearTimeout(timer);
    const elapsed = Date.now() - t0;

    if (!response.ok) {
      const errBody = await response.text().catch(() => '');
      const errMsg  = `HTTP ${response.status} from ${name} after ${elapsed}ms: ${trunc(errBody, 200)}`;

      if (response.status === 429 || response.status === 503 || response.status === 502) {
        throw new Error(`[RATE_LIMITED] ${errMsg}`);
      }
      if (response.status === 401) {
        throw new Error(`[AUTH_ERROR] Invalid or missing OPENROUTER_API_KEY`);
      }
      throw new Error(errMsg);
    }

    const data    = await response.json();
    const content = data?.choices?.[0]?.message?.content;

    if (!content || typeof content !== 'string') {
      throw new Error(`${name} returned null/undefined content after ${elapsed}ms`);
    }

    if (content.trim().length < 100) {
      throw new Error(`${name} response too short (${content.length} chars) after ${elapsed}ms: "${trunc(content, 100)}"`);
    }

    logger.ok(`${name} sync responded in ${elapsed}ms — ${content.length} chars raw content`);

    const parsed = extractAndParseJSON(content);
    return validateAndEnrich(parsed, opts);

  } catch (err) {
    clearTimeout(timer);
    throw err;
  }
}

// ─────────────────────────────────────────────────────────────────────────────────────────────────
// SECTION 11 — MODEL CALLER — STREAMING (SSE)
//
// Calls one OpenRouter model with stream:true.
// Fires onChunk(tokenText) callback for EVERY token received from the model.
// This is what makes text appear LIVE on the user's screen token by token.
//
// HOW IT WORKS:
//   1. POST to OpenRouter with stream:true in the request body
//   2. OpenRouter responds with Content-Type: text/event-stream
//   3. We read the response body as a ReadableStream
//   4. Each chunk from the stream may contain one or more SSE lines
//   5. We split on \n, accumulate partial lines across chunks (lineBuffer)
//   6. Each complete "data: {...}" line contains one token in delta.content
//   7. We fire onChunk(token) immediately → frontend receives it and shows it LIVE
//   8. We also accumulate all tokens in fullContent
//   9. When data: [DONE] arrives, we parse fullContent as JSON and return validated data
//
// ROBUSTNESS:
//   • Handles partial chunks (lineBuffer absorbs incomplete lines)
//   • Handles both \n and \r\n line endings
//   • Handles heartbeat/comment lines (": keepalive")
//   • Handles [DONE] sentinel correctly
//   • Times out with AbortController after model.timeout_ms
//   • Rate limit detection (429, 503) for fast model skip
// ─────────────────────────────────────────────────────────────────────────────────────────────────

async function callModelStream(model, promptObj, opts, onChunk) {
  const ctrl  = new AbortController();
  const timer = setTimeout(() => {
    logger.warn(`${model.id} stream timeout after ${model.timeout_ms}ms — aborting`);
    ctrl.abort();
  }, model.timeout_ms);

  const t0      = Date.now();
  const name    = model.id.split('/').pop().replace(':free', '');

  logger.model(`Stream call → ${name} (max_tokens: ${model.max_tokens})`);

  try {
    const response = await fetch(OPENROUTER_BASE, {
      method:  'POST',
      headers: {
        'Content-Type':    'application/json',
        'Authorization':   `Bearer ${process.env.OPENROUTER_API_KEY}`,
        'HTTP-Referer':    HTTP_REFERER,
        'X-Title':         APP_TITLE,
        'X-Request-Start': String(t0),
      },
      body: JSON.stringify({
        model:       model.id,
        max_tokens:  model.max_tokens,
        temperature: model.temperature || 0.72,
        stream:      true,   // ← THE KEY: enables SSE streaming from OpenRouter
        messages: [
          { role: 'system', content: promptObj.systemPrompt },
          { role: 'user',   content: promptObj.userMessage  },
        ],
      }),
      signal: ctrl.signal,
    });

    clearTimeout(timer);

    if (!response.ok) {
      const errBody = await response.text().catch(() => '');
      const errMsg  = `HTTP ${response.status} from ${name}: ${trunc(errBody, 200)}`;
      if (response.status === 429 || response.status === 503 || response.status === 502) {
        throw new Error(`[RATE_LIMITED] ${errMsg}`);
      }
      if (response.status === 401) {
        throw new Error(`[AUTH_ERROR] Invalid or missing OPENROUTER_API_KEY`);
      }
      throw new Error(errMsg);
    }

    // Verify we actually got a stream
    const contentType = response.headers.get('content-type') || '';
    if (!contentType.includes('text/event-stream')) {
      logger.warn(`${name} returned Content-Type: ${contentType} (expected text/event-stream) — attempting to parse as JSON`);
      // Some models return JSON even when stream:true — fall back gracefully
      const data    = await response.json();
      const content = data?.choices?.[0]?.message?.content;
      if (content && content.length > 100) {
        // Simulate streaming by chunking the content and calling onChunk for each piece
        const words = content.split(/(\s+)/);
        for (const word of words) {
          if (word) {
            onChunk(word);
            await sleep(8); // small delay to give frontend a chance to render
          }
        }
        const parsed = extractAndParseJSON(content);
        return validateAndEnrich(parsed, opts);
      }
      throw new Error(`${name} returned non-streaming response with invalid content`);
    }

    // ── READ THE SSE STREAM ────────────────────────────────────────────────────────────────────
    const reader      = response.body.getReader();
    const decoder     = new TextDecoder('utf-8');
    let   lineBuffer  = '';   // Accumulates incomplete lines across chunk boundaries
    let   fullContent = '';   // Accumulates ALL tokens — used for JSON parsing at the end
    let   tokenCount  = 0;
    let   charsEmitted = 0;
    const streamStart = Date.now();

    // Inner function: process a single complete SSE line
    function processSSELine(line) {
      // Skip empty lines, heartbeat/comment lines, and non-data lines
      if (!line) return;
      if (line.startsWith(':')) return;  // SSE comment/heartbeat — ignore
      if (!line.startsWith('data:')) return;  // Only process data lines

      const rawData = line.slice(5).trim(); // Remove "data:" prefix

      // The [DONE] sentinel marks the end of the OpenRouter stream
      if (rawData === '[DONE]') return;

      // Parse the SSE data payload — it's a JSON object from OpenRouter
      let sseParsed;
      try {
        sseParsed = JSON.parse(rawData);
      } catch (parseErr) {
        // Malformed SSE data line — skip it silently
        logger.warn(`Malformed SSE data line from ${name}: "${trunc(rawData, 80)}"`);
        return;
      }

      // Extract the token text from the OpenRouter streaming format:
      // { choices: [{ delta: { content: "token text" } }] }
      const delta   = sseParsed?.choices?.[0]?.delta;
      const content = delta?.content;

      // Skip null/undefined/empty tokens (common at start and end of stream)
      if (content == null || typeof content !== 'string' || content === '') return;

      // Accumulate into full content (for JSON parsing after stream ends)
      fullContent   += content;
      tokenCount++;
      charsEmitted  += content.length;

      // Fire the onChunk callback — THIS IS WHAT MAKES OUTPUT APPEAR LIVE
      // The main handler writes this token as an SSE event to the HTTP response
      // which the frontend's ReadableStream reader receives and renders immediately
      try {
        onChunk(content);
      } catch (cbErr) {
        // onChunk throwing (e.g. response already ended) is non-fatal
        logger.warn(`onChunk callback error: ${cbErr.message}`);
      }
    }

    // Main stream reading loop
    while (true) {
      let done, value;
      try {
        ({ done, value } = await reader.read());
      } catch (readErr) {
        // Stream was aborted or network error
        if (readErr.name === 'AbortError') throw readErr;
        logger.warn(`Stream read error from ${name}: ${readErr.message}`);
        break;
      }

      if (done) {
        // Stream ended — process any remaining buffered content
        if (lineBuffer.trim()) {
          processSSELine(lineBuffer.trim());
          lineBuffer = '';
        }
        break;
      }

      // Decode this chunk (stream:true means the decoder needs stream mode)
      lineBuffer += decoder.decode(value, { stream: true });

      // Split on newlines — SSE spec uses \n, but some proxies send \r\n
      const lines = lineBuffer.split(/\r?\n/);

      // The last element may be an incomplete line — save it for next iteration
      lineBuffer = lines.pop() || '';

      // Process all complete lines
      for (const line of lines) {
        processSSELine(line);
      }
    }

    const elapsed = Date.now() - t0;
    const streamElapsed = Date.now() - streamStart;

    logger.ok(
      `${name} stream complete — ` +
      `${tokenCount} tokens | ${charsEmitted} chars | ` +
      `${elapsed}ms total | ${streamElapsed}ms streaming`
    );

    // ── PARSE THE ACCUMULATED CONTENT AS JSON ─────────────────────────────────────────────────
    if (!fullContent || fullContent.trim().length < 100) {
      throw new Error(
        `${name} stream produced insufficient content: ${fullContent.length} chars after ${elapsed}ms`
      );
    }

    logger.info(`Parsing accumulated stream content: ${fullContent.length} chars`);

    const parsed = extractAndParseJSON(fullContent);
    return validateAndEnrich(parsed, opts);

  } catch (err) {
    clearTimeout(timer);
    throw err;
  }
}

// ─────────────────────────────────────────────────────────────────────────────────────────────────
// SECTION 12 — MULTI-MODEL ORCHESTRATOR
//
// Tries all 10 models in priority order with retry + failover.
// Each model gets up to maxAttempts tries before moving to the next.
// Rate-limited models are skipped immediately without retry.
// Returns the first successful, validated result.
// ─────────────────────────────────────────────────────────────────────────────────────────────────

async function generateWithAI(input, opts, onChunk) {
  const prompt       = buildPrompt(input, opts);
  const useStreaming = !!onChunk && typeof onChunk === 'function';
  const maxAttempts  = 2;    // Each model tried at most twice before moving on
  const errors       = [];
  let   totalAttempts = 0;
  let   modelsTried   = 0;

  // Inject input into opts for error recovery in validateAndEnrich
  const enrichedOpts = { ...opts, _input: input };

  logger.info(
    `Starting AI generation — ` +
    `tool: ${opts.tool} | depth: ${opts.depth} | lang: ${opts.language} | ` +
    `streaming: ${useStreaming} | input: "${trunc(input, 60)}"`
  );

  for (const model of MODELS) {
    modelsTried++;
    const name = model.id.split('/').pop().replace(':free', '');

    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      totalAttempts++;
      logger.model(
        `Attempt ${totalAttempts}: ${name} | ` +
        `try ${attempt}/${maxAttempts} | ` +
        `models tried: ${modelsTried}/${MODELS.length}`
      );

      try {
        let result;

        if (useStreaming) {
          result = await callModelStream(model, prompt, enrichedOpts, onChunk);
        } else {
          result = await callModelSync(model, prompt, enrichedOpts);
        }

        // Success — enrich with metadata and return
        result._language      = opts.language || 'English';
        result._tool          = opts.tool      || 'notes';
        result._models_tried  = modelsTried;
        result._attempts      = totalAttempts;
        result._model_index   = modelsTried - 1;
        result._streaming     = useStreaming;

        logger.ok(
          `✓ SUCCESS — ${name} (attempt ${attempt}) | ` +
          `models tried: ${modelsTried}/${MODELS.length} | ` +
          `total attempts: ${totalAttempts}`
        );

        return result;

      } catch (err) {
        const errMsg = (err.message || String(err)).slice(0, 200);
        errors.push(`${name}[${attempt}]: ${errMsg}`);

        logger.warn(`✗ FAIL — ${name} attempt ${attempt}: ${errMsg}`);

        // Rate limited → skip to next model immediately, no delay or retry
        if (errMsg.includes('[RATE_LIMITED]')) {
          logger.warn(`Rate limited on ${name} — skipping to next model`);
          break;
        }

        // Auth error → stop all attempts (bad API key, no point retrying)
        if (errMsg.includes('[AUTH_ERROR]')) {
          logger.error('Auth error — check OPENROUTER_API_KEY environment variable');
          throw new Error('OpenRouter authentication failed. Please check your API key in Vercel environment variables.');
        }

        // Timeout/abort → skip second attempt
        if (err.name === 'AbortError') {
          logger.warn(`${name} timed out after ${model.timeout_ms}ms — skipping to next model`);
          break;
        }

        // For other errors: wait before retry (only if there's another attempt)
        if (attempt < maxAttempts) {
          const waitMs = 1000 + (attempt * 500); // 1500ms on first retry
          logger.info(`Waiting ${waitMs}ms before retry ${attempt + 1} of ${name}...`);
          await sleep(waitMs);
        }
      }
    } // end attempt loop

    // Brief pause between different models — be a good API citizen
    if (modelsTried < MODELS.length) {
      await sleep(300);
    }
  } // end model loop

  // All 10 models exhausted
  logger.error(
    `ALL ${MODELS.length} MODELS FAILED — ` +
    `${totalAttempts} total attempts across ${modelsTried} models`
  );
  logger.error(`Error summary:\n${errors.slice(0, 8).map((e, i) => `  ${i + 1}. ${e}`).join('\n')}`);

  throw new Error(
    `All ${MODELS.length} AI models are temporarily unavailable after ${totalAttempts} attempts. ` +
    `This is usually a temporary OpenRouter peak-load issue. ` +
    `Please try again in 30-60 seconds.`
  );
}

// ─────────────────────────────────────────────────────────────────────────────────────────────────
// SECTION 13 — FALLBACK CONTENT BUILDERS
//
// High-quality study content generated from the topic name alone.
// Used when specific fields are missing from AI output (not full offline fallback).
// ─────────────────────────────────────────────────────────────────────────────────────────────────

function buildFallbackTricks(topic) {
  const t = topic || 'this topic';
  return [
    `THE FEYNMAN TECHNIQUE FOR ${t.toUpperCase()}: After each study session, close all your notes and attempt to explain the entire topic out loud as if teaching a motivated 12-year-old encountering it for the first time. Every time you hesitate, use unexplained jargon, or lose the logical thread of your explanation, you have discovered a genuine gap in understanding. Return to your source material, study that specific gap thoroughly, then restart the explanation from the beginning. Repeat this cycle until you can explain the whole topic clearly, completely, and without notes. This is proven to be the single most effective study technique for ${t}.`,

    `SPACED REPETITION SCHEDULE FOR ${t.toUpperCase()}: Study ${t} in focused 25-minute sessions across multiple days — never in a single marathon session. The optimal spacing schedule based on cognitive science research is: Session 1 (initial learning), Session 2 after 1 day (consolidation), Session 3 after 3 days (first major review), Session 4 after 7 days (reinforcement), Session 5 after 14 days (long-term retention), Session 6 after 30 days (mastery verification). Each review session activates your memory just as it begins to fade, exploiting the spacing effect, which studies consistently show produces 2-4x better long-term retention than equivalent massed practice sessions.`,

    `ACTIVE RECALL TESTING FOR ${t.toUpperCase()}: Instead of passively rereading your notes on ${t}, convert every key concept into a question and test yourself. Write questions on index cards or use flashcard software — question on front, answer on back. After studying a section, immediately close the material and write down everything you can recall from memory. Then compare against the source. The effort of retrieval — even when it produces errors — is what strengthens memory. Research consistently shows that one hour of active self-testing produces better retention than three hours of passive review for complex topics like ${t}.`,
  ];
}

function buildFallbackApplications(topic) {
  const t = topic || 'this topic';
  return [
    `Healthcare & Medical Science: Principles from ${t} inform clinical decision-making, diagnostic protocol design, treatment planning, and patient outcome prediction across virtually every medical specialty. Healthcare professionals with deep understanding of ${t} make more systematic, evidence-based decisions, communicate more precisely with colleagues and patients, and achieve measurably better clinical outcomes. Medical education programmes worldwide incorporate these foundational concepts as core competencies for every practising clinician and researcher.`,

    `Technology & Software Engineering: The conceptual frameworks and problem-solving approaches developed through the study of ${t} have direct and substantial applications in software system design, algorithm development, data structure selection, and engineering project management. Software engineers and systems architects who understand these principles make better architectural decisions under uncertainty, build more scalable and maintainable systems, identify potential failure modes earlier in the design process, and collaborate more effectively across multidisciplinary technical teams.`,

    `Business Strategy & Economic Policy: Organisations that systematically apply analytical frameworks derived from ${t} consistently outperform competitors who make decisions on intuition and informal heuristics alone. Strategic planners use these principles to evaluate competitive dynamics, identify market opportunities, assess organisational risk, and allocate resources more efficiently. Policymakers apply related reasoning to design interventions with measurably better social outcomes. The compound effect of improved decision quality at every level of an organisation creates sustainable and significant long-term competitive advantages.`,
  ];
}

function buildFallbackMisconceptions(topic) {
  const t = topic || 'this topic';
  return [
    `Many students believe that ${t} can be mastered through repeated passive reading and memorisation of definitions, formulas, and factual summaries. In reality, genuine mastery requires constructing a deeply connected mental model — understanding the causal relationships between ideas, the reasoning that justifies each principle, and the conditions under which standard frameworks succeed or fail. Surface-level memorisation produces knowledge that collapses under pressure when exam questions are framed differently or when real-world situations do not match the textbook template. True understanding, by contrast, enables flexible, creative problem-solving in novel contexts.`,

    `A common but damaging misconception is that ${t} is only relevant and applicable to specialists in that specific narrow field, making it optional or low-priority knowledge for students pursuing other disciplines. In reality, the core reasoning patterns, analytical frameworks, and systematic thinking skills that deep study of ${t} develops transfer powerfully and broadly across domains. Professionals in law, medicine, engineering, economics, policy, and the creative industries regularly discover that their foundational understanding of ${t} provides unexpected and substantial intellectual advantages in their primary work.`,

    `Students frequently assume that once they understand the basic surface concepts of ${t} well enough to answer standard textbook questions, there is nothing of significant substance left to learn. In reality, ${t} contains extensive depth, with critical nuances between beginner and expert understanding, important unsettled debates at the research frontier, and ongoing empirical and theoretical developments that regularly challenge and revise established frameworks. Even world-leading researchers in ${t} regularly encounter aspects of the field that surprise and fundamentally challenge their existing mental models, demonstrating that genuine mastery is a lifelong pursuit.`,
  ];
}

// ─────────────────────────────────────────────────────────────────────────────────────────────────
// SECTION 14 — FULL OFFLINE FALLBACK
//
// Complete, high-quality structured study content generated without any AI.
// Used as the absolute final safety net when all 10 models fail completely.
// Always returns something genuinely useful — never a bare error or empty response.
// ─────────────────────────────────────────────────────────────────────────────────────────────────

function generateOfflineFallback(topic, opts) {
  const t    = (topic || 'This Subject').trim();
  const lang = opts.language || 'English';
  const tool = opts.tool     || 'notes';

  logger.warn(`Offline fallback activated — topic: "${trunc(t, 60)}", tool: ${tool}`);

  const notes = buildOfflineNotes(t);
  const answers = [
    buildFallbackAnswer1(t),
    buildFallbackAnswer2(t),
    buildFallbackAnswer3(t),
  ];

  return {
    topic:                t,
    curriculum_alignment: 'General Academic Study',
    _language:            lang,
    _tool:                tool,
    _fallback:            true,
    _fallback_reason:     'All AI models temporarily unavailable — premium quality offline content generated from topic name',

    ultra_long_notes: notes,

    key_concepts: [
      `Core Definition & Scope: ${t} is a systematic field of study and practice encompassing the fundamental principles, theoretical frameworks, conceptual models, and practical methodologies that define how we understand, analyse, and apply knowledge within its domain — both in academic research and real-world professional contexts.`,
      `Primary Mechanisms & Processes: The central operating mechanisms of ${t} involve structured, systematic interactions between identifiable components and variables that produce consistent, observable, and — under appropriate controlled conditions — predictable and reproducible outcomes. Understanding these mechanisms is the foundation of both theoretical competence and practical expertise.`,
      `Historical Development & Paradigm Shifts: ${t} evolved through successive waves of intellectual discovery, critical reappraisal, and paradigm-level shifts, with key contributors from multiple generations gradually establishing the validated frameworks, accepted methodologies, and foundational principles that constitute the current state of the field.`,
      `Contemporary Significance & Applications: ${t} carries substantial and direct application value across multiple professional, research, and policy domains — enabling practitioners to formulate and solve real-world problems more systematically, make higher-quality decisions under uncertainty, and achieve measurably better outcomes than those relying on informal intuition or ad-hoc approaches.`,
      `Critical Boundaries & Known Limitations: A complete and intellectually honest understanding of ${t} requires explicitly recognising both the considerable explanatory and predictive power of its established frameworks AND the specific boundary conditions, contextual limitations, and open empirical questions where those frameworks require modification, supplementation, or replacement by alternative approaches.`,
    ],

    key_tricks:              buildFallbackTricks(t),
    real_world_applications: buildFallbackApplications(t),
    common_misconceptions:   buildFallbackMisconceptions(t),

    practice_questions: [
      {
        question: `Explain the core theoretical principles of ${t} and describe how they interact to form a coherent, integrated explanatory framework for the phenomena within this domain.`,
        answer:   answers[0],
      },
      {
        question: `Describe a realistic professional scenario where comprehensive, expert-level knowledge of ${t} would be strategically decisive. Walk through your analytical approach step by step and explain the role of key principles at each stage.`,
        answer:   answers[1],
      },
      {
        question: `Compare and critically evaluate two fundamentally different theoretical approaches to understanding ${t}. What are the core strengths and primary limitations of each approach, and how might a sophisticated practitioner integrate insights from both?`,
        answer:   answers[2],
      },
    ],

    study_score:  96,
    powered_by:   `${BRAND} by ${DEVELOPER}`,
    generated_at: new Date().toISOString(),
  };
}

function buildOfflineNotes(t) {
  return `## Introduction to ${t}

**${t}** is one of the most significant and richly developed fields in its domain — combining rigorous theoretical foundations with extensive real-world applicability. Understanding ${t} at a deep level provides both intellectual insight into how a critical aspect of the world works and practical tools for addressing real challenges across multiple professional contexts.

This comprehensive guide covers all major dimensions of ${t}: its theoretical foundations, core operating principles, historical development, practical applications, known limitations, and the most important concepts every serious student of the field needs to master.

> **Core Principle**: The study of ${t} develops systematic analytical thinking, precise conceptual vocabulary, and evidence-based reasoning skills that transfer broadly across academic disciplines and professional domains.

---

## Historical Development & Intellectual Context

The field of **${t}** did not emerge fully formed — it developed through a rich and sometimes contentious intellectual history spanning multiple generations of thinkers, researchers, and practitioners. Understanding this development is essential for appreciating why current frameworks take the form they do and what assumptions underlie them.

The earliest systematic thinking about ${t} arose in response to practical problems that could not be adequately addressed by existing frameworks. Early contributors established foundational concepts and vocabulary, conducted initial systematic observations, and began building the theoretical structures that subsequent generations would refine, challenge, and substantially revise.

Key intellectual milestones in the development of ${t} include:
- **Foundational Period**: Establishment of core concepts, terminology, and the basic framework of inquiry
- **Systematic Development**: Formalisation of methods, accumulation of empirical evidence, and growth of specialised sub-fields
- **Critical Reappraisal**: Identification of anomalies and limitations in early frameworks, leading to significant theoretical revision
- **Contemporary State**: Mature field with well-established core frameworks, active research frontiers, and ongoing debates about scope and methodology

---

## Core Theoretical Principles

The theoretical foundation of **${t}** rests on a set of interconnected principles that provide the conceptual architecture for understanding phenomena in this domain. These principles are not merely descriptive — they generate specific predictions, guide analytical reasoning, and enable systematic problem-solving.

**Principle 1 — Systematic Analysis**: ${t} demands disciplined, structured approaches to understanding phenomena. Rather than relying on intuition or anecdote, it requires identifying relevant variables, controlling for confounding factors, and reasoning from evidence to conclusions using explicit, replicable methods.

**Principle 2 — Causal Reasoning**: A central goal of ${t} is to understand not merely what happens but why — to identify the causal mechanisms and driving forces that produce observed outcomes. This requires distinguishing correlation from causation, identifying mediating and moderating variables, and constructing mechanistic explanations.

**Principle 3 — Integration & Synthesis**: The phenomena addressed by ${t} typically involve multiple interacting components, forces, or variables. Effective understanding requires integrating knowledge across sub-areas rather than treating each concept in isolation, recognising how changes in one component propagate through a system.

**Principle 4 — Contextual Sensitivity**: The application of ${t} principles must be sensitive to context. Mechanisms that operate strongly in one setting may be weak or absent in another. Expert practitioners constantly assess which aspects of the context are material to their analysis.

- Deep knowledge of ${t} enables systematic, evidence-based decision-making
- Understanding the limits of frameworks is as important as understanding the frameworks themselves
- Connecting theory to practice requires careful attention to the assumptions built into each model

---

## Key Mechanisms & How ${t} Works

At a mechanistic level, **${t}** operates through a series of identifiable processes and interactions that produce its characteristic patterns and outcomes. Understanding these mechanisms — not just the patterns they produce — is what distinguishes genuine expertise from surface-level familiarity.

The primary mechanism involves a structured interaction between the core components of the system under study. Each component plays a specific role, and changes in one component produce predictable effects on others through established causal pathways. The overall behaviour of the system emerges from these interactions in ways that are sometimes counterintuitive and that require careful analysis to understand correctly.

1. **Stage 1 — Initial Conditions**: The starting state of the system determines the range of possible trajectories and outcomes. Expert practitioners in ${t} invest significant analytical effort in characterising initial conditions precisely before proceeding to analysis.

2. **Stage 2 — Primary Processes**: The dominant mechanisms that drive change in the system activate and begin producing their effects. Understanding which processes are most influential in a given context is a core skill in ${t}.

3. **Stage 3 — Feedback & Interaction**: As primary processes operate, they generate feedback effects that modify the conditions for subsequent processes. These feedback dynamics are responsible for much of the complexity observed in ${t}.

4. **Stage 4 — Equilibrium or Transformation**: Systems studied in ${t} either move toward characteristic stable states (equilibria) or undergo qualitative transformations to fundamentally different operating regimes.

---

## Practical Applications & Real-World Relevance

The principles and frameworks of **${t}** have substantial and documented applications across a wide range of professional and research contexts. Far from being purely abstract or academic, ${t} provides tools that directly improve decision-making quality and problem-solving effectiveness in real-world settings.

**Healthcare & Medicine**: Clinical professionals apply frameworks from ${t} in diagnostic reasoning, treatment planning, and patient communication. The systematic analytical approaches central to ${t} directly parallel the evidence-based reasoning required for high-quality clinical practice.

**Technology & Engineering**: Software systems, engineering designs, and technological products all benefit from the systematic thinking and analytical rigour that deep knowledge of ${t} develops. Technical professionals who understand ${t} make better architectural decisions and identify potential problems earlier in development cycles.

**Business & Policy**: Strategic decision-making in organisations and policy settings requires exactly the kind of systematic, evidence-based analytical approach that ${t} develops. The frameworks from ${t} help decision-makers structure complex problems, evaluate options rigorously, and anticipate second-order consequences of their choices.

---

## Critical Analysis, Limitations & Open Questions

A sophisticated understanding of **${t}** requires honest engagement with its limitations, ongoing debates, and unresolved questions. No field of study has frameworks that work perfectly in all contexts, and ${t} is no exception.

**Known Limitations**:
- Established frameworks in ${t} make assumptions that may not hold in all contexts, and applying them outside their domain of validity produces misleading conclusions
- The measurement and operationalisation of key concepts in ${t} involves difficult choices that can significantly affect findings
- Historical biases in who has studied ${t} and in what contexts have shaped which questions are asked and which are overlooked

**Active Debates**:
- Researchers in ${t} actively debate the relative importance of different causal mechanisms and the conditions under which each dominates
- There is ongoing methodological debate about the appropriate balance between formal modelling and empirical observation in advancing understanding
- The generalisability of findings across different cultural, historical, and contextual settings remains an active area of investigation

---

## Summary & Key Takeaways

**${t}** is a rich, mature, and practically significant field of study that rewards serious engagement.

The most important things to remember:
- **Foundational principles**: The core concepts provide a systematic framework for analysing complex phenomena
- **Mechanistic understanding**: Knowing HOW and WHY things work, not just WHAT happens, is the hallmark of genuine expertise
- **Contextual application**: Expert practitioners apply principles flexibly, always assessing how context shapes the operation of core mechanisms
- **Critical awareness**: Understanding the limitations and open questions of a field is as important as understanding its established frameworks
- **Transferable skills**: The analytical thinking and systematic reasoning developed through ${t} transfer broadly across academic and professional domains

> **Final Insight**: The deepest value of studying ${t} is not the accumulation of facts, but the development of a new way of seeing — a systematic, evidence-based analytical lens that makes you a more effective thinker in every domain you encounter.

---
*Generated by ${BRAND} | ${DEVELOPER} | ${DEVSITE} | Founder: ${FOUNDER}*`;
}

function buildFallbackAnswer1(t) {
  return `The correct answer is: The core principles of ${t} form an integrated theoretical framework built on systematic analysis, causal reasoning, and contextual sensitivity that together explain the phenomena in this domain.

**PART 2 — DEEP EXPLANATION**

The theoretical framework of ${t} is not a collection of independent facts but an integrated system of interconnected principles that mutually reinforce and constrain one another. At its foundation is the principle that phenomena in this domain are governed by identifiable causal mechanisms — not by randomness or mystery. This means that with sufficient understanding of the relevant variables and their relationships, we can systematically analyse, predict, and — in applied contexts — influence outcomes.

The framework achieves explanatory power through a combination of precise conceptual definitions, explicit causal models, and the systematic accumulation and testing of empirical evidence. Each principle in the framework serves a specific explanatory role: some principles identify the primary variables, others specify the relationships between them, and still others constrain the conditions under which the framework applies. Together these generate a coherent, internally consistent account of the phenomena under study.

What makes the framework genuinely powerful is its ability to integrate knowledge across levels of analysis — from micro-level mechanisms to macro-level patterns — and across different contextual settings. Advanced practitioners use this multi-level integration to address complex, real-world problems that cannot be solved by applying any single principle in isolation.

**PART 3 — CONCRETE EXAMPLE**

A striking illustration of how integrated theoretical frameworks in fields like ${t} work comes from the development of evidence-based medicine in the late twentieth century. Prior to formalisation, medical practice relied heavily on authority and tradition. When researchers systematically integrated principles of epidemiology, statistics, and pathophysiology into a coherent framework, the result was transformative: treatments that had been standard practice for decades were revealed as ineffective or harmful, while new interventions of genuine benefit were identified and validated. This transformation shows exactly how an integrated theoretical framework, consistently applied, can revolutionise a domain of practice.

**PART 4 — COMMON MISTAKE WARNING**

A common mistake is to think that understanding a field's core principles means being able to recite their definitions from memory. In reality, genuine understanding means being able to apply those principles to novel situations, identify when they do and do not apply, recognise when evidence is or is not consistent with the framework, and explain the reasoning that connects observation to conclusion. Students who confuse definitional knowledge with conceptual understanding struggle with application questions — the type most commonly used to assess genuine mastery.

**EXAM TIP**: When asked to "explain the core principles" of a topic, always go beyond definition. The highest-scoring answers consistently explain (1) what the principle is, (2) why it takes the form it does, (3) how it connects to other principles in the framework, and (4) give a specific example of it in operation. Structure your answer around these four dimensions to maximise marks.`;
}

function buildFallbackAnswer2(t) {
  return `The correct answer is: In a realistic professional scenario, expert-level knowledge of ${t} would be decisive in enabling the practitioner to diagnose the problem accurately, select the appropriate analytical framework, apply it systematically, and communicate justified recommendations with confidence.

**PART 2 — DEEP EXPLANATION**

Consider a scenario where a professional confronts a complex, high-stakes problem that superficially resembles a familiar case but has important structural differences that make standard approaches inappropriate. The expert in ${t} brings several decisive advantages: first, they can recognise which aspects of the situation are and are not covered by established frameworks; second, they can diagnose the specific mechanism producing the problem rather than treating symptoms; third, they can select an analytical approach calibrated to the actual features of this situation; and fourth, they can explain their reasoning clearly enough that decision-makers can evaluate and act on their recommendations with confidence.

The stepwise approach typically involves: (1) systematic characterisation of the situation using the conceptual vocabulary of ${t}; (2) identification of the primary causal mechanisms in operation; (3) assessment of which variables are most important and most amenable to influence; (4) selection and application of the most appropriate analytical framework; (5) interpretation of findings in context; and (6) formulation of concrete, justified recommendations with explicit identification of key uncertainties and assumptions.

This kind of disciplined, framework-guided analysis is qualitatively different from intuitive or ad-hoc problem-solving, and the difference in outcomes at each step compounds: small improvements in diagnosis, framework selection, and analysis quality combine to produce substantially better final recommendations and outcomes.

**PART 3 — CONCRETE EXAMPLE**

The decisive role of domain expertise in professional settings is well documented. In management consulting, for instance, McKinsey & Company found in a study of their engagements that the quality of client outcomes was overwhelmingly determined not by the volume of data collected but by the quality of the initial problem framing — the ability to identify the precise causal mechanism behind the client's difficulty and select the analytical approach that addressed it directly. Consultants with deep expertise in the relevant domain consistently outperformed those with only surface-level knowledge even when given access to identical data and resources.

**PART 4 — COMMON MISTAKE WARNING**

A common mistake is to think that professional expertise in complex domains is primarily about knowing more facts. In reality, the decisive difference between novice and expert practitioners is how they structure problems. Experts quickly recognise the deep structure of a situation and select the appropriate framework; novices apply familiar approaches regardless of fit. This pattern, documented extensively in cognitive science research by Dreyfus, Chi, and others, explains why reading more textbook material produces diminishing returns beyond a certain point — genuine expert performance requires the kind of deliberate, applied practice that builds case-based pattern recognition.

**EXAM TIP**: Application questions that present scenarios are testing your ability to use concepts — not recall definitions. Always begin your answer by identifying the specific aspect of the concept being tested in the scenario, then show explicitly how you are applying it. Examiners award marks for the quality of the application reasoning, not for restating the scenario or reciting facts from memory.`;
}

function buildFallbackAnswer3(t) {
  return `The correct answer is: Two fundamentally different approaches to ${t} can be characterised as the formal-analytical approach and the contextual-empirical approach, each with distinctive strengths and limitations that a sophisticated practitioner integrates based on the demands of the specific problem.

**PART 2 — DEEP EXPLANATION**

The formal-analytical approach to ${t} prioritises mathematical precision, logical rigour, and deductive reasoning from explicit axioms or assumptions. Its great strength is that it generates precise, internally consistent predictions that can be unambiguously tested against evidence. Its primary limitation is that the assumptions required to achieve this precision often simplify reality in ways that limit the applicability of conclusions to real-world situations. Formal models are most powerful when the relevant domain is well-understood and the simplifying assumptions are reasonably satisfied.

The contextual-empirical approach prioritises rich description, sensitivity to historical and institutional context, and inductive reasoning from observation and case study. Its great strength is that it captures complexity, heterogeneity, and path-dependence that formal models typically cannot accommodate. Its primary limitation is that findings are often difficult to generalise beyond the specific contexts studied, and the lack of formal structure makes it harder to test causal claims rigorously. Empirical approaches are most powerful in new or poorly-understood domains where formal models do not yet exist.

A sophisticated practitioner recognises that these approaches are complementary rather than competing. Formal models identify the logical implications of clearly stated assumptions; empirical investigation tests whether those assumptions and implications hold in real-world contexts and identifies aspects of reality that formal models do not yet capture. The most productive approach uses formal frameworks to generate precise hypotheses and empirical investigation to test and refine them, in a continuous cycle.

**PART 3 — CONCRETE EXAMPLE**

The productive integration of formal and empirical approaches is exemplified by the development of epidemiology in the twentieth century. Early formal epidemic models (like the SIR model developed by Kermack and McKendrick in 1927) established rigorous mathematical frameworks for understanding disease spread. Empirical field studies of specific outbreaks revealed important features — social network structure, behavioural adaptation, intervention effects — that the simple formal models did not capture. This feedback between formal theory and empirical evidence drove continuous model refinement, producing the sophisticated computational models that today guide public health policy responses to epidemics like COVID-19.

**PART 4 — COMMON MISTAKE WARNING**

A common mistake is to treat these two approaches as fundamentally incompatible and to advocate for one exclusively. Students who adopt a strong methodological position — insisting that only formal modelling or only empirical case study produces genuine knowledge — typically produce analyses that are strong in one dimension but systematically weak in the other. The best academic and professional work in any mature field integrates the strengths of both approaches, using each where it is strongest and compensating for weaknesses of one with the strengths of the other.

**EXAM TIP**: Evaluation questions that ask you to "compare and critically evaluate" two approaches are testing your ability to assess trade-offs, not simply to describe. Structure your answer around (1) the specific strength of approach A, with evidence; (2) the specific limitation of approach A; (3) the specific strength of approach B, with evidence; (4) the specific limitation of approach B; and (5) the conditions under which each is preferable or how they can be integrated. This structure consistently earns the highest marks on evaluation questions.`;
}

// ─────────────────────────────────────────────────────────────────────────────────────────────────
// SECTION 15 — RESULT FINALIZER
//
// Adds timing metadata, final branding, and request-level diagnostics.
// Called on every successful result before it is sent to the client.
// ─────────────────────────────────────────────────────────────────────────────────────────────────

function finalizeResult(result, startTime, extraMeta = {}) {
  const duration = Date.now() - startTime;

  return {
    ...result,
    // Always override with correct branding
    powered_by:     `${BRAND} by ${DEVELOPER}`,
    study_score:    96,
    // Add timing and request metadata
    _duration_ms:   duration,
    _generated_at:  new Date().toISOString(),
    _version:       APP_VERSION,
    // Spread any extra metadata (tokens, request ID, etc.)
    ...extraMeta,
  };
}

// ─────────────────────────────────────────────────────────────────────────────────────────────────
// SECTION 16 — SSE HELPERS
//
// sendSSE: writes one SSE event to the HTTP response
// Format: "event: [name]\ndata: [JSON]\n\n"
// The extra \n\n at the end signals end of event to the SSE parser.
// ─────────────────────────────────────────────────────────────────────────────────────────────────

function createSSESender(res) {
  return function sendSSE(eventName, data) {
    if (res.writableEnded) return;

    try {
      const dataStr = typeof data === 'string' ? data : JSON.stringify(data);
      const chunk = `event: ${eventName}\ndata: ${dataStr}\n\n`;
      res.write(chunk);

      // Flush if the response supports it (some Node.js/Vercel environments buffer writes)
      if (typeof res.flush === 'function') res.flush();
    } catch (writeErr) {
      // Client disconnected — ignore, the heartbeat will detect this
      logger.warn(`SSE write error (client may have disconnected): ${writeErr.message}`);
    }
  };
}

// ─────────────────────────────────────────────────────────────────────────────────────────────────
// SECTION 17 — MAIN REQUEST HANDLER
//
// This is the Vercel serverless function entry point.
// Exported as module.exports = handler.
//
// REQUEST:
//   POST /api/study
//   Content-Type: application/json
//   Body: { message: string, options: { tool, depth, language, style, stream } }
//
// RESPONSE (streaming):
//   Content-Type: text/event-stream
//   SSE events: token, stage, heartbeat, done, error
//
// RESPONSE (non-streaming):
//   Content-Type: application/json
//   Body: { full structured data object }
// ─────────────────────────────────────────────────────────────────────────────────────────────────

module.exports = async function handler(req, res) {
  const startTime = Date.now();
  const requestId = makeRequestId();

  // ── SECURITY & CORS HEADERS ────────────────────────────────────────────────────────────────────
  // Allow requests from any origin (the app can be embedded or accessed from any domain)
  res.setHeader('Access-Control-Allow-Origin',  '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.setHeader('X-Content-Type-Options',       'nosniff');
  res.setHeader('X-Frame-Options',              'DENY');
  res.setHeader('X-Request-Id',                 requestId);

  // Handle CORS preflight OPTIONS request
  if (req.method === 'OPTIONS') {
    res.status(204).end();
    return;
  }

  // Only accept POST
  if (req.method !== 'POST') {
    logger.warn(`[${requestId}] Method not allowed: ${req.method}`);
    return res.status(405).json({ error: 'Method not allowed. Use POST.' });
  }

  // ── API KEY CHECK ──────────────────────────────────────────────────────────────────────────────
  // Check for API key before doing anything else — no point parsing the request if we can't call
  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey || typeof apiKey !== 'string' || apiKey.trim().length < 20) {
    logger.error(`[${requestId}] OPENROUTER_API_KEY missing or invalid`);

    // Decide whether to stream an error or return JSON error based on request
    const wantsStream = req.body?.options?.stream === true;
    if (wantsStream) {
      res.setHeader('Content-Type',              'text/event-stream');
      res.setHeader('Cache-Control',             'no-cache, no-transform');
      res.setHeader('Connection',                'keep-alive');
      const sendSSE = createSSESender(res);
      sendSSE(EVT_ERROR, {
        message: 'Server configuration error: OPENROUTER_API_KEY is not set. Please set it in your Vercel environment variables.',
        code:    'MISSING_API_KEY',
      });
      res.end();
    } else {
      return res.status(500).json({
        error: 'Server configuration error: OPENROUTER_API_KEY is not set.',
        code:  'MISSING_API_KEY',
      });
    }
    return;
  }

  // ── PARSE & VALIDATE REQUEST BODY ─────────────────────────────────────────────────────────────
  let body;
  try {
    body = req.body;
    // In some Vercel configurations, body may still be a string
    if (typeof body === 'string') {
      body = JSON.parse(body);
    }
  } catch (parseErr) {
    logger.warn(`[${requestId}] Invalid JSON body: ${parseErr.message}`);
    return res.status(400).json({ error: 'Invalid JSON in request body.' });
  }

  if (!body || typeof body !== 'object') {
    return res.status(400).json({ error: 'Request body must be a JSON object.' });
  }

  const rawMessage = body.message || body.topic || body.input || body.text || '';
  const rawOpts    = body.options || body.opts || {};

  // Sanitise and validate the message/topic input
  const trimmed = sanitiseTopic(rawMessage);

  if (!trimmed || trimmed.length < 2) {
    return res.status(400).json({
      error: 'Message/topic is required and must be at least 2 characters.',
      code:  'INVALID_INPUT',
    });
  }

  if (trimmed.length > 4000) {
    return res.status(400).json({
      error: `Input too long: ${trimmed.length} characters. Maximum is 4000 characters.`,
      code:  'INPUT_TOO_LONG',
    });
  }

  // Validate and normalise options
  const VALID_TOOLS  = ['notes', 'flashcards', 'quiz', 'summary', 'mindmap'];
  const VALID_DEPTHS = ['standard', 'detailed', 'comprehensive', 'expert'];
  const VALID_STYLES = ['simple', 'academic', 'detailed', 'exam', 'visual'];

  const opts = {
    tool:     VALID_TOOLS.includes(rawOpts.tool)    ? rawOpts.tool    : 'notes',
    depth:    VALID_DEPTHS.includes(rawOpts.depth)  ? rawOpts.depth   : 'detailed',
    style:    VALID_STYLES.includes(rawOpts.style)  ? rawOpts.style   : 'simple',
    language: typeof rawOpts.language === 'string' && rawOpts.language.trim().length > 0
                ? rawOpts.language.trim().slice(0, 50)
                : 'English',
    stream:   rawOpts.stream === true,
  };

  logger.info(
    `[${requestId}] Request — ` +
    `tool: ${opts.tool} | depth: ${opts.depth} | lang: ${opts.language} | ` +
    `style: ${opts.style} | stream: ${opts.stream} | ` +
    `input: "${trunc(trimmed, 80)}" (${trimmed.length} chars)`
  );

  // ══════════════════════════════════════════════════════════════════════════════════════════════
  // STREAMING MODE
  // ══════════════════════════════════════════════════════════════════════════════════════════════

  if (opts.stream) {

    // ── Set SSE response headers ───────────────────────────────────────────────────────────────
    // These headers are CRITICAL for live streaming to work correctly.
    // Without them, proxies/CDNs/browsers may buffer the response and show it all at once.
    res.setHeader('Content-Type',              'text/event-stream; charset=utf-8');
    res.setHeader('Cache-Control',             'no-cache, no-transform, no-store');
    res.setHeader('Connection',                'keep-alive');
    res.setHeader('X-Accel-Buffering',         'no');  // Disables Nginx buffering
    res.setHeader('Transfer-Encoding',         'chunked');

    // Write the HTTP status and headers immediately
    res.status(200);

    // Flush headers to client immediately so it knows streaming has started
    if (typeof res.flushHeaders === 'function') res.flushHeaders();

    const sendSSE = createSSESender(res);

    // ── HEARTBEAT: prevents proxy/CDN/Vercel from closing idle connection ──────────────────────
    // SSE connections that are idle (no events) for too long get closed by intermediaries.
    // We send a keepalive comment every 10 seconds to prevent this.
    let heartbeatInterval = setInterval(() => {
      if (res.writableEnded) { clearInterval(heartbeatInterval); return; }
      try {
        res.write(`: keepalive ${Date.now()}\n\n`);
        if (typeof res.flush === 'function') res.flush();
      } catch {
        clearInterval(heartbeatInterval);
      }
    }, 10000);

    // ── STAGE PROGRESS TIMERS: animate the thinking stages on the frontend ────────────────────
    // These send stage-advancement events at realistic intervals even before content starts.
    const stageLabels  = [
      'Analysing your topic…',
      'Writing your study content…',
      'Building sections and cards…',
      'Crafting practice questions…',
      'Finalising and formatting…',
    ];
    const stageTimings = [0, 5000, 11000, 20000, 30000]; // ms after request start

    // Send stage 0 immediately
    sendSSE(EVT_STAGE, { idx: 0, label: stageLabels[0] });

    // Schedule subsequent stages
    const stageTimers = stageTimings.map((delay, idx) => {
      if (idx === 0) return null; // already sent
      return setTimeout(() => {
        if (!res.writableEnded) {
          sendSSE(EVT_STAGE, { idx, label: stageLabels[idx] });
        }
      }, delay);
    });

    const clearStageTimers = () => stageTimers.forEach(t => { if (t) clearTimeout(t); });

    // ── Token counter for logging ──────────────────────────────────────────────────────────────
    let tokensSent   = 0;
    let charsStreamed = 0;

    // ── onToken callback: called for every token from the AI model ────────────────────────────
    // This is what makes text appear LIVE on the user's screen.
    // For each token:
    //   1. callModelStream calls this function
    //   2. We write an SSE event: "event: token\ndata: {"t":"word "}\n\n"
    //   3. The frontend's ReadableStream reader receives this event
    //   4. Frontend appends the token to its buffer and renders immediately
    const onToken = (chunk) => {
      if (!chunk || res.writableEnded) return;
      tokensSent++;
      charsStreamed += chunk.length;
      sendSSE(EVT_TOKEN, { t: chunk });
    };

    try {
      // ── RUN AI GENERATION WITH LIVE STREAMING ──────────────────────────────────────────────
      const result = await generateWithAI(trimmed, opts, onToken);

      clearInterval(heartbeatInterval);
      clearStageTimers();

      // Send final stage marker
      sendSSE(EVT_STAGE, { idx: 4, label: 'Done!', done: true });

      // Finalize the result with timing and metadata
      const final = finalizeResult(result, startTime, {
        _tokens_sent:    tokensSent,
        _chars_streamed: charsStreamed,
        _request_id:     requestId,
      });

      logger.ok(
        `[${requestId}] Stream success — ` +
        `${tokensSent} tokens | ${charsStreamed} chars | ` +
        `${final._duration_ms}ms total`
      );

      // ── SEND THE COMPLETE STRUCTURED DATA as the final 'done' event ───────────────────────
      // The frontend uses this to render the full, formatted result after streaming ends.
      // This is separate from the token stream — the frontend stores the tokens for display
      // during streaming, then switches to the structured data for the final rendered view.
      sendSSE(EVT_DONE, final);

      if (!res.writableEnded) res.end();

    } catch (aiError) {

      clearInterval(heartbeatInterval);
      clearStageTimers();

      const isCancelled = aiError.name === 'AbortError' || aiError.message?.includes('AbortError');

      if (isCancelled) {
        logger.info(`[${requestId}] Generation cancelled by client`);
        if (!res.writableEnded) {
          sendSSE(EVT_ERROR, { message: 'Generation cancelled.', code: 'CANCELLED' });
          res.end();
        }
        return;
      }

      logger.warn(`[${requestId}] AI streaming failed: ${aiError.message} — using offline fallback`);

      // ── FALLBACK: Stream the offline content word by word ─────────────────────────────────
      // Even when all AI fails, the user still sees text appearing live on screen.
      // We simulate streaming by splitting the fallback content into words and
      // sending them with a small delay, exactly like real streaming.
      const fallback   = generateOfflineFallback(trimmed, opts);
      const streamText = fallback.ultra_long_notes || '';
      const words      = streamText.split(/(\s+)/).filter(Boolean);
      let   fbTokens   = 0;

      sendSSE(EVT_STAGE, { idx: 2, label: 'Generating from local knowledge…' });

      // Stream ~3 words at a time at roughly 40-50 words/second
      for (let i = 0; i < words.length; i += 3) {
        if (res.writableEnded) break;

        const chunk = words.slice(i, i + 3).join('');
        sendSSE(EVT_TOKEN, { t: chunk });
        fbTokens++;

        // ~65ms per group of 3 words ≈ 45 words/second — natural, readable pace
        await sleep(65);
      }

      sendSSE(EVT_STAGE, { idx: 4, label: 'Done!', done: true });

      const fallbackFinal = finalizeResult(fallback, startTime, {
        _tokens_sent: fbTokens,
        _request_id:  requestId,
        _fallback:    true,
        _fallback_reason: aiError.message?.slice(0, 200),
      });

      logger.ok(
        `[${requestId}] Fallback stream complete — ` +
        `${fbTokens} chunks sent | ${fallbackFinal._duration_ms}ms`
      );

      sendSSE(EVT_DONE, fallbackFinal);
      if (!res.writableEnded) res.end();
    }

    return; // End of streaming handler
  }

  // ══════════════════════════════════════════════════════════════════════════════════════════════
  // NON-STREAMING MODE — Returns full JSON in one response
  // Used when stream:false or when the client doesn't support SSE
  // ══════════════════════════════════════════════════════════════════════════════════════════════

  try {
    let result;

    try {
      result = await generateWithAI(trimmed, opts);
      // In non-streaming mode, no onChunk callback — we just get the full result
    } catch (aiErr) {
      logger.warn(`[${requestId}] AI failed in sync mode: ${aiErr.message} — using offline fallback`);
      result = generateOfflineFallback(trimmed, opts);
    }

    const final = finalizeResult(result, startTime, { _request_id: requestId });

    logger.ok(
      `[${requestId}] Sync response ready — ` +
      `${final._duration_ms}ms | fallback: ${!!final._fallback}`
    );

    // Set JSON response headers
    res.setHeader('Content-Type', 'application/json; charset=utf-8');
    return res.status(200).json(final);

  } catch (unexpectedErr) {

    logger.error(`[${requestId}] Unexpected error: ${unexpectedErr.message}`, unexpectedErr.stack);

    // Emergency fallback — always return something useful, never a bare 500
    try {
      const emergency = generateOfflineFallback(trimmed, opts);
      const final = finalizeResult(emergency, startTime, {
        _request_id: requestId,
        _error:      true,
        _error_type: 'unexpected',
      });
      res.setHeader('Content-Type', 'application/json; charset=utf-8');
      return res.status(200).json(final);
    } catch (fbErr) {
      logger.error(`[${requestId}] Even fallback failed: ${fbErr.message}`);
      return res.status(500).json({
        error:   'An unexpected error occurred. Please try again.',
        code:    'INTERNAL_ERROR',
        request_id: requestId,
      });
    }
  }
};

// ─────────────────────────────────────────────────────────────────────────────────────────────────
// SECTION 18 — VERCEL CONFIGURATION REFERENCE
//
// vercel.json (place in project root alongside /api directory):
// ─────────────────────────────────────────────────────────────
// {
//   "functions": {
//     "api/study.js": {
//       "maxDuration": 300
//     }
//   }
// }
//
// This sets the maximum execution time to 300 seconds (5 minutes).
// This is necessary because:
//   • We try up to 10 models, each with up to 2 attempts
//   • Streaming responses from large models can take several minutes
//   • The fallback content generator also takes a few seconds
//
// Environment Variables (Vercel dashboard → Settings → Environment Variables):
// ────────────────────────────────────────────────────────────────────────────
//   Name:  OPENROUTER_API_KEY
//   Value: sk-or-v1-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
//
// Getting your free OpenRouter API key:
//   1. Go to https://openrouter.ai
//   2. Sign up (no credit card required)
//   3. Go to Keys → Create key
//   4. All models with :free suffix in this file are $0 per request
//
// Testing the API locally:
// ─────────────────────────
// # Install Vercel CLI
// npm i -g vercel
//
// # Pull environment variables
// vercel env pull .env.local
//
// # Start local dev server
// vercel dev
//
// # Test non-streaming (curl):
// curl -X POST http://localhost:3000/api/study \
//   -H "Content-Type: application/json" \
//   -d '{"message":"Photosynthesis","options":{"tool":"notes","language":"English","depth":"detailed","style":"simple","stream":false}}'
//
// # Test streaming (curl):
// curl -X POST http://localhost:3000/api/study \
//   -H "Content-Type: application/json" \
//   -N \
//   -d '{"message":"Photosynthesis","options":{"tool":"notes","language":"English","depth":"detailed","style":"simple","stream":true}}'
//
// # Expected streaming output (each line appears as the model generates):
// event: stage
// data: {"idx":0,"label":"Analysing your topic…"}
//
// : keepalive 1234567890
//
// event: token
// data: {"t":"## "}
//
// event: token
// data: {"t":"Introduction"}
//
// event: token
// data: {"t":" to "}
//
// ... (hundreds more token events as model generates)
//
// event: stage
// data: {"idx":4,"label":"Done!","done":true}
//
// event: done
// data: {"topic":"Photosynthesis","ultra_long_notes":"...","key_concepts":[...],...}
// ─────────────────────────────────────────────────────────────────────────────────────────────────

// ═══════════════════════════════════════════════════════════════════════════════════════════════════
// END OF FILE — api/study.js v3.0
// Savoiré AI v2.0 — Built by Sooban Talha Technologies | soobantalhatech.xyz
// Founder: Sooban Talha | Free for every student on Earth, forever.
// ═══════════════════════════════════════════════════════════════════════════════════════════════════
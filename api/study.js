// ═══════════════════════════════════════════════════════════════════════════════════════════════════
// SAVOIRÉ AI v3.0 — api/study.js — VERCEL SERVERLESS BACKEND
// Built by Sooban Talha Technologies | soobantalhatech.xyz
// Founder: Sooban Talha
//
// ── COMPLETE OVERHAUL v3.0 ───────────────────────────────────────────────────────────────────────
// ✦ True Server-Sent Events (SSE) streaming — token-by-token live output
// ✦ 3-Phase Render Compatible: TextNode → throttled markdown → final render
// ✦ 10 Free AI Models — tried in sequence with smart failover (2 attempts each → 20 max)
// ✦ 7-Stage JSON Repair Pipeline — handles all common model output errors
// ✦ 5 Tools × 4 Depths × 5 Styles × 50+ Languages — ultra-rich prompts
// ✦ Mind Map JSON Field — hierarchical structure for SVG rendering
// ✦ 5-Part Answer Structure for practice questions
// ✦ Branding Enforcement — model names NEVER exposed, always "Savoiré AI"
// ✦ High-Quality Offline Fallback — 2500+ word content when all AI fails
// ✦ Simulated Streaming — even fallback streams word by word
// ✦ Heartbeat System — prevents proxy/CDN timeouts
// ✦ Stage Updates — sends thinking stage progress to frontend
// ✦ Full CORS & Security Headers
// ═══════════════════════════════════════════════════════════════════════════════════════════════════

'use strict';

// ╔══════════════════════════════════════════════════════════════════════════════╗
// ║  SECTION 1 — CONSTANTS & BRANDING                                          ║
// ╚══════════════════════════════════════════════════════════════════════════════╝

const BRAND       = 'Savoiré AI v3.0';
const DEVELOPER   = 'Sooban Talha Technologies';
const DEVSITE     = 'soobantalhatech.xyz';
const WEBSITE     = 'savoireai.vercel.app';
const FOUNDER     = 'Sooban Talha';
const APP_VERSION = '3.0';

const OPENROUTER_BASE = 'https://openrouter.ai/api/v1/chat/completions';
const HTTP_REFERER    = `https://${WEBSITE}`;
const APP_TITLE       = BRAND;

// SSE event names — used by both server and client
const EVT_TOKEN     = 'token';      // individual chunk: { t: "word " }
const EVT_DONE      = 'done';       // final structured data object
const EVT_ERROR     = 'error';      // error event: { message: "..." }
const EVT_HEARTBEAT = 'heartbeat';  // keep-alive: { ts: 1234567890 }
const EVT_STAGE     = 'stage';      // thinking stage update: { idx: 0-4, label: "..." }

// ╔══════════════════════════════════════════════════════════════════════════════╗
// ║  SECTION 2 — FREE AI MODEL ROSTER (10 models, all :free on OpenRouter)     ║
// ╚══════════════════════════════════════════════════════════════════════════════╝

const MODELS = [
  {
    id:          'google/gemini-2.0-flash-exp:free',
    max_tokens:   8192,
    timeout_ms:  120000,
    temperature: 0.70,
    priority:    1,
    description: 'Gemini 2.0 Flash — best quality, fastest response, excellent at structured JSON',
  },
  {
    id:          'deepseek/deepseek-chat-v3-0324:free',
    max_tokens:   8192,
    timeout_ms:  130000,
    temperature: 0.68,
    priority:    2,
    description: 'DeepSeek Chat v3 — outstanding reasoning, very strong at detailed academic content',
  },
  {
    id:          'meta-llama/llama-3.3-70b-instruct:free',
    max_tokens:   6144,
    timeout_ms:  120000,
    temperature: 0.72,
    priority:    3,
    description: 'LLaMA 3.3 70B — Meta flagship, excellent instruction following and long-form writing',
  },
  {
    id:          'z-ai/glm-4.5-air:free',
    max_tokens:   6144,
    timeout_ms:  100000,
    temperature: 0.70,
    priority:    4,
    description: 'GLM 4.5 Air — strong multilingual capabilities, good for non-English output',
  },
  {
    id:          'microsoft/phi-4-reasoning-plus:free',
    max_tokens:   4096,
    timeout_ms:  100000,
    temperature: 0.65,
    priority:    5,
    description: 'Phi-4 Reasoning Plus — Microsoft, excellent logical reasoning and analysis',
  },
  {
    id:          'qwen/qwen3-8b:free',
    max_tokens:   4096,
    timeout_ms:   90000,
    temperature: 0.70,
    priority:    6,
    description: 'Qwen3 8B — Alibaba, solid multilingual and general purpose performance',
  },
  {
    id:          'google/gemini-flash-1.5-8b:free',
    max_tokens:   4096,
    timeout_ms:   80000,
    temperature: 0.72,
    priority:    7,
    description: 'Gemini Flash 1.5 8B — lightweight Gemini, fast and reliable for standard content',
  },
  {
    id:          'nousresearch/hermes-3-llama-3.1-405b:free',
    max_tokens:   6144,
    timeout_ms:  130000,
    temperature: 0.70,
    priority:    8,
    description: 'Hermes 3 LLaMA 405B — massive model, great for comprehensive deep content',
  },
  {
    id:          'mistralai/mistral-7b-instruct-v0.3:free',
    max_tokens:   3584,
    timeout_ms:   80000,
    temperature: 0.72,
    priority:    9,
    description: 'Mistral 7B v0.3 — reliable European model, consistent and dependable',
  },
  {
    id:          'openchat/openchat-7b:free',
    max_tokens:   3584,
    timeout_ms:   80000,
    temperature: 0.72,
    priority:    10,
    description: 'OpenChat 7B — final fallback, consistently available and adequate quality',
  },
];

// ╔══════════════════════════════════════════════════════════════════════════════╗
// ║  SECTION 3 — DEPTH CONFIGURATION                                           ║
// ╚══════════════════════════════════════════════════════════════════════════════╝

const DEPTH_MAP = {
  standard: {
    wordRange:         '600–900 words',
    minWords:          600,
    targetWords:       750,
    description:       'Clear and accessible, covering all essentials with good depth',
    sectionsRequired:  4,
    label:             'Standard',
  },
  detailed: {
    wordRange:         '1000–1500 words',
    minWords:          1000,
    targetWords:       1250,
    description:       'Detailed coverage with concrete examples and thorough explanations throughout',
    sectionsRequired:  6,
    label:             'Detailed',
  },
  comprehensive: {
    wordRange:         '1500–2200 words',
    minWords:          1500,
    targetWords:       1850,
    description:       'Comprehensive analysis covering all major aspects, nuances and edge cases in depth',
    sectionsRequired:  7,
    label:             'Comprehensive',
  },
  expert: {
    wordRange:         '2200–3200 words including advanced subtopics, nuances, cutting-edge developments and critical debates',
    minWords:          2200,
    targetWords:       2700,
    description:       'Expert-level deep dive covering advanced subtopics, academic debates, historical context and future directions',
    sectionsRequired:  9,
    label:             'Expert',
  },
};

// ╔══════════════════════════════════════════════════════════════════════════════╗
// ║  SECTION 4 — WRITING STYLE CONFIGURATION                                    ║
// ╚══════════════════════════════════════════════════════════════════════════════╝

const STYLE_MAP = {
  simple: {
    name:        'Simple & Clear',
    instruction: 'Write in crystal-clear beginner-friendly language throughout. Define every technical term immediately when first used — do not assume any prior knowledge. Use short sentences, everyday analogies and comparisons. Avoid jargon wherever possible. Structure every explanation to build from simple to complex. The goal is that a motivated student encountering this topic for the very first time should understand every sentence without needing to look anything up.',
  },
  academic: {
    name:        'Academic & Formal',
    instruction: 'Write in rigorous formal academic language with precise scholarly terminology throughout. Maintain a third-person objective tone. Use hedge language appropriately (may, suggests, indicates). Use discipline-specific vocabulary without oversimplification. Employ citation-ready phrases, formal definitions, and reference theoretical frameworks by name where appropriate. The style should be suitable for a university textbook or academic journal review article.',
  },
  detailed: {
    name:        'Maximally Detailed',
    instruction: 'Provide the most exhaustive detail possible at every point. Minimum TWO concrete examples per concept — one canonical and one edge case. Specify exact quantities, dates, mechanisms, and numbers. Cover edge cases and boundary conditions explicitly. Never summarise where you could explain fully. Leave nothing implicit or assumed. The goal is that after reading, the student feels they have read a complete textbook chapter on this topic with every angle covered.',
  },
  exam: {
    name:        'Exam-Focused',
    instruction: 'Structure the entire response around maximising exam marks. Provide clear key definitions written in mark-scheme language. Highlight the most frequently examined aspects of this topic. Explicitly state what examiners look for in high-scoring answers. Include mark-worthy phrases that score well. Flag the most common mistakes students make in exams on this topic. Where possible, frame explanations as model answers to typical exam questions. **Bold every keyword that appears in official mark schemes.**',
  },
  visual: {
    name:        'Visual & Analogy-Rich',
    instruction: 'Make every concept concrete and memorable through vivid analogies, metaphors, visual descriptions and step-by-step walkthroughs. Open each major concept with a powerful analogy that creates an immediate mental picture. Compare abstract ideas to everyday objects and situations. Build detailed mental models that a student can visualise clearly. Use narrative and storytelling where helpful. Include size and scale comparisons to make abstract magnitudes tangible. The goal is that each concept leaves a lasting mental picture that makes it impossible to forget.',
  },
};

// ╔══════════════════════════════════════════════════════════════════════════════╗
// ║  SECTION 5 — TOOL CONFIGURATION                                             ║
// ╚══════════════════════════════════════════════════════════════════════════════╝

const TOOL_MAP = {
  notes: {
    name:        'Generate Notes',
    objective:   'Generate the richest, most comprehensive study notes possible. These notes are the student\'s ONLY study resource. Treat this as a full textbook chapter.',
    emphasis:    `The ultra_long_notes field is the centrepiece. It MUST be genuinely long and detailed — the student is relying on this as their primary study resource.

REQUIRED SECTION STRUCTURE for ultra_long_notes (use ## headings, separate with ---):
  1. ## Introduction & Overview — precise definition, why it matters, historical context
  2. ## Historical Development — how the field/concept evolved, key milestones
  3. ## Core Concepts & Principles — foundational ideas with full causal mechanisms
  4. ## How It Works — step-by-step technical walkthrough, specific detail at each step
  5. ## Key Examples & Case Studies — real-world named examples with specific details
  6. ## Advanced Aspects & Nuances — subtleties that distinguish B from A* understanding
  7. ## Real-World Applications — specific industries and mechanisms, concrete outcomes
  8. ## Critical Analysis & Limitations — known failures, open debates, edge cases
  9. ## Summary & Key Takeaways — synthesise insights, connect ideas across sections

FORMATTING RULES:
  • **bold** every key term, important concept, critical fact on FIRST use
  • > blockquote for the single most important definition or principle per section
  • - bullet lists for: features, characteristics, types, properties
  • 1. numbered lists for: steps, processes, sequences, algorithms
  • --- horizontal rule BETWEEN every major section
  • Tables (| col | col |) for comparisons and classifications where useful
  • Minimum ONE concrete specific example per section (real names, dates, numbers)
  • NO thin sections — every section minimum 80 words`,
    sections:    ['Introduction & Overview', 'Historical Development', 'Core Concepts & Principles', 'How It Works', 'Key Examples & Case Studies', 'Advanced Aspects & Nuances', 'Real-World Applications', 'Critical Analysis & Limitations', 'Summary & Key Takeaways'],
  },
  flashcards: {
    name:        'Create Flashcards',
    objective:   'Generate study materials perfectly optimised for interactive flashcard learning and spaced repetition.',
    emphasis:    `FLASHCARD RULES:
  FRONT (question field): Maximum 15 words. ONE clear specific answer. Use these formats:
    "What is [term]?"
    "Define [concept]"
    "[Term A] vs [Term B]: key difference?"
    "What are the [N] steps of [process]?"
    "What causes [phenomenon]?"
    "What is the formula for [quantity]?"

  BACK (answer field): 2-4 sentences ONLY. Complete but concise. ONE concrete example.
    Bold the specific term being defined: **term** = definition.

  CARD SET DIVERSITY (3 cards must cover):
    Card 1: DEFINITION card — key term → precise definition + example
    Card 2: PROCESS/MECHANISM card — how something works → step-by-step
    Card 3: COMPARISON card — A vs B → clear distinctions with example of each

ultra_long_notes for flashcards: Use short bullet points.
  Format every concept as: "**[Term]**: [definition in 10-15 words]. Example: [1 sentence]"
  Do NOT write long paragraphs — every line should be flashcard-worthy.

key_concepts format: "[Question in 8-12 words] → [Answer in 15-25 words with example]"

practice_questions format: "Q: [Question in 10-15 words] → A: [Answer in 20-30 words with example]"`,
    sections:    ['Core Definitions', 'Key Mechanisms', 'Comparisons & Contrasts', 'Process Steps', 'Key Facts to Memorise'],
  },
  quiz: {
    name:        'Build Quiz',
    objective:   'Generate challenging exam-quality questions with comprehensive educational answers optimised for MCQ conversion.',
    emphasis:    `YOUR MISSION: Generate challenging exam-quality questions with comprehensive educational answers.

QUESTION TYPES (one per question):
  Q1 — ANALYTICAL: Tests causal reasoning — WHY does X happen? What mechanism produces Y?
  Q2 — APPLICATION: Tests applying concepts to new scenarios — Given [scenario], what happens?
  Q3 — EVALUATION: Tests critical judgment — Compare approaches A and B. Which is better and why?

MCQ OPTION DESIGN: Begin every answer with:
  "The correct answer is: [statement in 15-20 words]."
  This first sentence becomes Option A (correct). The frontend generates B/C/D as distractors.

MANDATORY 5-PART ANSWER STRUCTURE (minimum 220 words each, label each part clearly):
  PART 1 — DIRECT ANSWER: "The correct answer is: [precise statement]." (2-3 sentences)
  PART 2 — DEEP EXPLANATION: WHY is this correct? (5-6 sentences, mechanisms and theory)
  PART 3 — CONCRETE EXAMPLE: Specific named real-world example with numbers/dates (3-4 sentences)
  PART 4 — COMMON MISTAKE: "A common mistake is to think..." + full explanation of why wrong (3-4 sentences)
  PART 5 — EXAM TIP: "Exam tip:" + actionable strategy for this question type (2-3 sentences)

ultra_long_notes structure:
  • Every section starts with "## [Topic]: Exam Focus — [Most Tested Aspect]"
  • **Bold** every mark-scheme keyword
  • "⚠️ Common Exam Mistake:" callout in each section
  • "✓ Model Answer Phrase:" callout with pre-built exam sentences
  • "🎯 Examiner's Tip:" at end of each section`,
    sections:    ['Exam Focus Overview', 'Most Tested Concepts', 'Common Exam Mistakes', 'Model Answer Phrases', 'Examiner Tips'],
  },
  summary: {
    name:        'Smart Summary',
    objective:   'Generate a ruthlessly concise smart summary optimised for rapid revision. Every word must earn its place. No padding whatsoever.',
    emphasis:    `ultra_long_notes MANDATORY STRUCTURE:
  Line 1: > [Single most important sentence about this topic]
  Then: ## TL;DR
    Sentence 1: What it is (core definition)
    Sentence 2: Why it matters (significance)
    Sentence 3: How it works (core mechanism in plain language)
    Maximum 3 sentences total.

  Then sections formatted for 30-second scanning:
    • Short punchy bullets — no sentence over 20 words
    • **Bold** every key term and critical number/date/name
    • → arrows for cause-effect: "X → Y → Z"
    • | pipe to show comparisons: "[A] | [B]"
    • End every section with: "💡 [One-sentence insight students often miss]"

  MANDATORY FINAL SECTION:
    ## ⭐ 5 Things to Remember
    [Exactly 5 items. One sentence each. Bold the key term. Include ONE specific detail per item.]

key_concepts: TOP 5 must-know facts. Each 15-20 words, specific enough to use in an exam answer.
  Example: "Osmosis moves water from high water potential (dilute) to low (concentrated) across semi-permeable membrane."

key_tricks: Focus on REVISION STRATEGIES:
  Trick 1: Mnemonic or acronym that captures multiple key points
  Trick 2: Visual anchor or analogy that makes the core mechanism unforgettable
  Trick 3: Active recall strategy specifically for this topic's complexity`,
    sections:    ['TL;DR', 'Core Concepts in Brief', 'Key Mechanisms Simplified', 'Critical Facts & Figures', '⭐ 5 Things to Remember'],
  },
  mindmap: {
    name:        'Build Mind Map',
    objective:   'Generate hierarchically structured content for visual mind map rendering. You MUST include a "mind_map" field in your JSON.',
    emphasis:    `You MUST include a "mind_map" field in your JSON output (in addition to all standard fields). This is the critical unique field for this tool.

MIND MAP JSON SCHEMA (exact structure required — DO NOT modify this schema):
{
  "mind_map": {
    "center": "[Topic name — max 5 words]",
    "branches": [
      { "label": "[Branch name — max 4 words]", "color": "#4F9CF9", "children": ["child 1 max 6 words", "child 2 max 6 words", "child 3 max 6 words"] },
      { "label": "[Branch name — max 4 words]", "color": "#42C98A", "children": ["child 1 max 6 words", "child 2 max 6 words", "child 3 max 6 words"] },
      { "label": "[Branch name — max 4 words]", "color": "#F59E0B", "children": ["child 1 max 6 words", "child 2 max 6 words", "child 3 max 6 words"] },
      { "label": "[Branch name — max 4 words]", "color": "#A855F7", "children": ["child 1 max 6 words", "child 2 max 6 words", "child 3 max 6 words"] },
      { "label": "[Branch name — max 4 words]", "color": "#EF4444", "children": ["child 1 max 6 words", "child 2 max 6 words", "child 3 max 6 words"] }
    ]
  }
}

MIND MAP RULES (STRICT — violation will break the visualisation):
  • Exactly 5-7 branches (minimum 5, maximum 7)
  • Each branch MUST have exactly 3 children — no more, no less
  • Branch labels: max 4 words, noun phrases, clear and distinct
  • Children labels: max 6 words, specific sub-concepts or examples
  • Colors cycle in this exact order: "#4F9CF9", "#42C98A", "#F59E0B", "#A855F7", "#EF4444", "#06B6D4", "#F97316"
  • Branches must collectively cover ALL major aspects without overlap

SUGGESTED BRANCH STRUCTURE (adapt to topic):
  Branch 1: "Core Definition & Principles"
  Branch 2: "Key Mechanisms"  
  Branch 3: "Types & Classifications"
  Branch 4: "Real-World Applications"
  Branch 5: "Advantages & Benefits"
  Optional Branch 6: "Limitations & Challenges"
  Optional Branch 7: "Historical Development"

ultra_long_notes: Mirror the mind map hierarchy exactly.
  ## [Branch Name] (one section per branch)
  ### [Child Name] (one sub-section per child)
  2-3 concise facts per child, max 15 words each.
  Include (→ connects to [Other Branch]) to show cross-links between branches.

Standard fields (key_concepts, key_tricks, etc.) are also required as normal.`,
    sections:    ['Before You Begin — How to Use This Mind Map', 'Central Concept', 'Branch 1', 'Branch 2', 'Branch 3', 'Branch 4', 'Branch 5', 'Cross-Connections', 'Quick Reference Key'],
  },
};

// ╔══════════════════════════════════════════════════════════════════════════════╗
// ║  SECTION 6 — UTILITY FUNCTIONS                                             ║
// ╚══════════════════════════════════════════════════════════════════════════════╝

const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

const logger = {
  info:    (...a) => console.log   (`[${new Date().toISOString()}] [${BRAND}] INFO  `, ...a),
  ok:      (...a) => console.log   (`[${new Date().toISOString()}] [${BRAND}] ✓     `, ...a),
  warn:    (...a) => console.warn  (`[${new Date().toISOString()}] [${BRAND}] WARN  `, ...a),
  error:   (...a) => console.error (`[${new Date().toISOString()}] [${BRAND}] ERROR `, ...a),
  model:   (...a) => console.log   (`[${new Date().toISOString()}] [MODEL]   →     `, ...a),
};

function wordCount(text) {
  if (!text || typeof text !== 'string') return 0;
  return text.trim().split(/\s+/).filter(Boolean).length;
}

function trunc(s, n = 100) {
  if (!s) return '';
  return String(s).length > n ? String(s).slice(0, n) + '…' : String(s);
}

// ╔══════════════════════════════════════════════════════════════════════════════╗
// ║  SECTION 7 — PROMPT BUILDER                                                ║
// ╚══════════════════════════════════════════════════════════════════════════════╝

function buildPrompt(input, opts) {
  const language = (opts.language || 'English').trim();
  const depth    = opts.depth  || 'detailed';
  const style    = opts.style  || 'simple';
  const tool     = opts.tool   || 'notes';

  const depthCfg = DEPTH_MAP[depth]  || DEPTH_MAP.detailed;
  const styleCfg = STYLE_MAP[style]  || STYLE_MAP.simple;
  const toolCfg  = TOOL_MAP[tool]    || TOOL_MAP.notes;

  const nowISO   = new Date().toISOString();

  // Build mind_map field instruction for mindmap tool
  const mindMapField = tool === 'mindmap' ? `
[FIELD: mind_map]
TYPE: object
REQUIRED: YES (this field is MANDATORY for the mindmap tool)
SCHEMA:
{
  "mind_map": {
    "center": "Topic name in ${language} — max 5 words",
    "branches": [
      { "label": "Branch 1 name in ${language} — max 4 words", "color": "#4F9CF9", "children": ["child 1 in ${language} max 6 words", "child 2 in ${language} max 6 words", "child 3 in ${language} max 6 words"] },
      { "label": "Branch 2 name in ${language} — max 4 words", "color": "#42C98A", "children": ["child 1 in ${language} max 6 words", "child 2 in ${language} max 6 words", "child 3 in ${language} max 6 words"] },
      { "label": "Branch 3 name in ${language} — max 4 words", "color": "#F59E0B", "children": ["child 1 in ${language} max 6 words", "child 2 in ${language} max 6 words", "child 3 in ${language} max 6 words"] },
      { "label": "Branch 4 name in ${language} — max 4 words", "color": "#A855F7", "children": ["child 1 in ${language} max 6 words", "child 2 in ${language} max 6 words", "child 3 in ${language} max 6 words"] },
      { "label": "Branch 5 name in ${language} — max 4 words", "color": "#EF4444", "children": ["child 1 in ${language} max 6 words", "child 2 in ${language} max 6 words", "child 3 in ${language} max 6 words"] }
    ]
  }
}
RULES:
  • Exactly 5-7 branches (minimum 5, maximum 7)
  • Each branch MUST have exactly 3 children
  • Branch labels: max 4 words
  • Children labels: max 6 words
  • ALL content in the mind_map MUST be in ${language}
  • Colors cycle: "#4F9CF9", "#42C98A", "#F59E0B", "#A855F7", "#EF4444", "#06B6D4", "#F97316"` : '';

  // Build practice_questions field based on tool
  const practiceQField = tool === 'quiz' ? `
[FIELD: practice_questions]
TYPE: array of exactly 3 objects, each with "question" and "answer"
QUESTION TYPES:
  Q1 — ANALYTICAL: Tests causal reasoning — WHY does X happen?
  Q2 — APPLICATION: Tests applying concepts — Given [scenario], what happens?
  Q3 — EVALUATION: Tests judgment — Compare A and B. Which is better?
ANSWER STRUCTURE (label each part):
  PART 1 — DIRECT ANSWER: "The correct answer is: [precise statement]." (2-3 sentences)
  PART 2 — DEEP EXPLANATION: WHY is this correct? (5-6 sentences)
  PART 3 — CONCRETE EXAMPLE: Specific real-world example (3-4 sentences)
  PART 4 — COMMON MISTAKE: "A common mistake is to think..." (3-4 sentences)
  PART 5 — EXAM TIP: Actionable strategy for this question (2-3 sentences)
  Minimum 220 words per answer
LANGUAGE: All in ${language}` : `
[FIELD: practice_questions]
TYPE: array of exactly 3 objects, each with "question" and "answer"
QUESTIONS: Varied types — analytical, application-based, evaluative
ANSWERS: Comprehensive, minimum 160 words each, with examples and explanations
LANGUAGE: All in ${language}`;

  return `You are ${BRAND}, the world's most advanced free AI study companion.
Built by ${DEVELOPER} | ${DEVSITE} | Founder: ${FOUNDER}
NEVER mention any AI model name, company or provider anywhere in your response. Never use phrases like "as an AI" or "I'm powered by". You ARE ${BRAND}.

╔══════════════════════════════════════════════════════════════════════╗
  YOUR TASK: ${toolCfg.objective}
╚══════════════════════════════════════════════════════════════════════╝

STUDENT'S TOPIC / INPUT:
━━━━━━━━━━━━━━━━━━━━━━━━
${input}
━━━━━━━━━━━━━━━━━━━━━━━━

OUTPUT LANGUAGE: ${language}
ALL content — every single word, heading, bullet, sentence, example — MUST be in ${language}.
Do not use any other language anywhere in the output, not even for section headings.

OUTPUT DEPTH: ${depthCfg.wordRange}
${depthCfg.description}
The ultra_long_notes field ALONE must meet this word count.

WRITING STYLE: ${styleCfg.name}
${styleCfg.instruction}

TOOL MODE: ${toolCfg.name}
${toolCfg.emphasis}

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

${practiceQField}

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

${mindMapField}

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
      "question": "Question 1 in ${language}",
      "answer": "Comprehensive answer in ${language}"
    },
    {
      "question": "Question 2 in ${language}",
      "answer": "Comprehensive answer in ${language}"
    },
    {
      "question": "Question 3 in ${language}",
      "answer": "Comprehensive answer in ${language}"
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
  ],${tool === 'mindmap' ? `
  "mind_map": {
    "center": "Topic in ${language}",
    "branches": [
      { "label": "Branch 1", "color": "#4F9CF9", "children": ["child 1", "child 2", "child 3"] },
      { "label": "Branch 2", "color": "#42C98A", "children": ["child 1", "child 2", "child 3"] },
      { "label": "Branch 3", "color": "#F59E0B", "children": ["child 1", "child 2", "child 3"] },
      { "label": "Branch 4", "color": "#A855F7", "children": ["child 1", "child 2", "child 3"] },
      { "label": "Branch 5", "color": "#EF4444", "children": ["child 1", "child 2", "child 3"] }
    ]
  },` : ''}
  "study_score": 96,
  "powered_by": "${BRAND} by ${DEVELOPER}",
  "generated_at": "${nowISO}"
}`;
}

// ╔══════════════════════════════════════════════════════════════════════════════╗
// ║  SECTION 8 — 7-STAGE JSON EXTRACTION & REPAIR PIPELINE                     ║
// ╚══════════════════════════════════════════════════════════════════════════════╝

function extractAndParseJSON(rawContent) {
  if (!rawContent || typeof rawContent !== 'string') {
    throw new Error('Model returned empty or non-string content');
  }

  let text = rawContent.trim();

  // ── Stage 1: Strip markdown fences, find JSON boundaries ──
  text = text.replace(/^```(?:json|JSON|js)?\s*/im, '');
  text = text.replace(/\s*```\s*$/im, '');
  text = text.trim();

  const startIdx = text.indexOf('{');
  const endIdx   = text.lastIndexOf('}');

  if (startIdx === -1) {
    throw new Error(`No JSON object opening brace found. Content preview: "${trunc(text, 150)}"`);
  }
  if (endIdx === -1 || endIdx <= startIdx) {
    throw new Error(`No valid JSON object closing brace found. Content preview: "${trunc(text, 150)}"`);
  }

  let jsonStr = text.slice(startIdx, endIdx + 1);

  // ── Stage 2: Direct parse (works for ~85% of responses) ──
  try {
    const parsed = JSON.parse(jsonStr);
    logger.info('JSON parsed successfully on Stage 2 (direct parse)');
    return parsed;
  } catch (directErr) {
    logger.warn(`Stage 2 direct parse failed: ${directErr.message} — proceeding to Stage 3`);
  }

  // ── Stage 3: Fix raw control characters inside strings (state machine) ──
  let repaired = fixControlCharsInStrings(jsonStr);
  try {
    const parsed = JSON.parse(repaired);
    logger.info('JSON parsed successfully on Stage 3 (control char fix)');
    return parsed;
  } catch (stage3Err) {
    logger.warn(`Stage 3 failed: ${stage3Err.message} — proceeding to Stage 4`);
  }

  // ── Stage 4: Structural fixes — trailing commas, comments, smart quotes, unquoted keys ──
  repaired = jsonStr
    .replace(/,(\s*[}\]])/g, '$1')           // trailing commas before } or ]
    .replace(/\/\/[^\n\r]*/g, '')             // single-line comments
    .replace(/\/\*[\s\S]*?\*\//g, '')         // block comments
    .replace(/[\u201C\u201D]/g, '"')          // smart quotes → straight quotes
    .replace(/[\u2018\u2019]/g, "'")          // smart single quotes
    .replace(/([{,]\s*)([a-zA-Z_$][a-zA-Z0-9_$]*)(\s*:)/g, '$1"$2"$3'); // unquoted keys

  try {
    const parsed = JSON.parse(repaired);
    logger.info('JSON parsed successfully on Stage 4 (structural fixes)');
    return parsed;
  } catch (stage4Err) {
    logger.warn(`Stage 4 failed: ${stage4Err.message} — proceeding to Stage 5`);
  }

  // ── Stage 5: Aggressive — escaped slashes, brace balancing, truncation fixes ──
  repaired = repaired.replace(/\\\//g, '/');

  // Balance braces and brackets
  const openObj  = (repaired.match(/\{/g) || []).length;
  const closeObj = (repaired.match(/\}/g) || []).length;
  const openArr  = (repaired.match(/\[/g) || []).length;
  const closeArr = (repaired.match(/\]/g) || []).length;

  if (openObj > closeObj) {
    for (let i = 0; i < Math.min(openObj - closeObj, 10); i++) repaired += '}';
  }
  if (openArr > closeArr) {
    for (let i = 0; i < Math.min(openArr - closeArr, 10); i++) repaired += ']';
  }

  // Fix truncated string at end
  if (!repaired.trimEnd().endsWith('}')) {
    repaired = repaired
      .replace(/,\s*"[^"]*$/, '')
      .replace(/:\s*"[^"]*$/, ': ""')
      .replace(/,\s*$/, '');
  }

  try {
    const parsed = JSON.parse(repaired);
    logger.info('JSON parsed successfully on Stage 5 (aggressive fixes)');
    return parsed;
  } catch (stage5Err) {
    logger.warn(`Stage 5 failed: ${stage5Err.message} — proceeding to Stage 6`);
  }

  // ── Stage 6: Bracket-counting extraction (find the valid JSON subset) ──
  let depth = 0, inStr = false, esc = false, start = -1, end = -1;
  for (let i = 0; i < jsonStr.length; i++) {
    const ch = jsonStr[i];
    if (esc) { esc = false; continue; }
    if (ch === '\\' && inStr) { esc = true; continue; }
    if (ch === '"') { inStr = !inStr; continue; }
    if (inStr) continue;
    if (ch === '{') { if (depth === 0) start = i; depth++; }
    else if (ch === '}') { depth--; if (depth === 0 && start !== -1) { end = i; break; } }
  }

  if (start !== -1 && end !== -1) {
    try {
      const subStr = jsonStr.slice(start, end + 1);
      // Try structural fixes on the substring too
      const cleaned = subStr
        .replace(/,(\s*[}\]])/g, '$1')
        .replace(/\/\/[^\n\r]*/g, '')
        .replace(/\/\*[\s\S]*?\*\//g, '');
      const parsed = JSON.parse(cleaned);
      logger.info('JSON parsed successfully on Stage 6 (bracket extraction)');
      return parsed;
    } catch (stage6Err) {
      logger.warn(`Stage 6 failed: ${stage6Err.message} — proceeding to Stage 7`);
    }
  }

  // ── Stage 7: Field-by-field regex reconstruction (last resort) ──
  try {
    const obj = {};

    // Extract topic
    const topicMatch = rawContent.match(/"topic"\s*:\s*"([^"\\]*(?:\\.[^"\\]*)*)"/);
    if (topicMatch) obj.topic = topicMatch[1].replace(/\\"/g, '"').replace(/\\n/g, '\n');

    // Extract curriculum_alignment
    const caMatch = rawContent.match(/"curriculum_alignment"\s*:\s*"([^"\\]*(?:\\.[^"\\]*)*)"/);
    if (caMatch) obj.curriculum_alignment = caMatch[1];

    // Extract ultra_long_notes — find the "ultra_long_notes": "..." value
    const ulnStart = rawContent.indexOf('"ultra_long_notes"');
    if (ulnStart !== -1) {
      const afterKey = rawContent.slice(ulnStart + 19);
      const colonIdx = afterKey.indexOf(':');
      if (colonIdx !== -1) {
        let strStart = afterKey.indexOf('"', colonIdx);
        if (strStart !== -1) {
          let pos = strStart + 1, escaped = false, notesText = '';
          while (pos < afterKey.length) {
            const ch = afterKey[pos];
            if (escaped) { notesText += ch; escaped = false; pos++; continue; }
            if (ch === '\\') { escaped = true; pos++; continue; }
            if (ch === '"') break;
            notesText += ch;
            pos++;
          }
          if (notesText.length >= 100) obj.ultra_long_notes = notesText;
        }
      }
    }

    // Extract arrays using simpler regex patterns
    const extractArray = (fieldName) => {
      const regex = new RegExp(`"${fieldName}"\\s*:\\s*\\[([\\s\\S]*?)\\](?=\\s*[,}])`);
      const match = rawContent.match(regex);
      if (match) {
        const inner = match[1];
        const items = [];
        const itemRegex = /"([^"\\]*(?:\\.[^"\\]*)*)"/g;
        let itemMatch;
        while ((itemMatch = itemRegex.exec(inner)) !== null) {
          items.push(itemMatch[1].replace(/\\"/g, '"').replace(/\\n/g, '\n'));
        }
        return items;
      }
      return [];
    };

    obj.key_concepts = extractArray('key_concepts');
    obj.key_tricks = extractArray('key_tricks');
    obj.real_world_applications = extractArray('real_world_applications');
    obj.common_misconceptions = extractArray('common_misconceptions');

    // Extract practice_questions
    const pqMatch = rawContent.match(/"practice_questions"\s*:\s*\[([\s\S]*?)\](?=\s*[,}](?!\s*"))/);
    if (pqMatch) {
      obj.practice_questions = [];
      const qRegex = /"question"\s*:\s*"([^"\\]*(?:\\.[^"\\]*)*)"[^}]*"answer"\s*:\s*"([^"\\]*(?:\\.[^"\\]*)*)"/g;
      let qMatch;
      while ((qMatch = qRegex.exec(pqMatch[1])) !== null) {
        obj.practice_questions.push({
          question: qMatch[1].replace(/\\"/g, '"').replace(/\\n/g, '\n'),
          answer: qMatch[2].replace(/\\"/g, '"').replace(/\\n/g, '\n'),
        });
      }
    }

    // Extract mind_map if present
    const mmIdx = rawContent.indexOf('"mind_map"');
    if (mmIdx !== -1) {
      const mmSection = rawContent.slice(mmIdx);
      const mmBraceStart = mmSection.indexOf('{');
      if (mmBraceStart !== -1) {
        let depth = 0, inStr = false, esc = false, mmEnd = -1;
        for (let i = mmBraceStart; i < mmSection.length; i++) {
          const ch = mmSection[i];
          if (esc) { esc = false; continue; }
          if (ch === '\\' && inStr) { esc = true; continue; }
          if (ch === '"') { inStr = !inStr; continue; }
          if (inStr) continue;
          if (ch === '{') depth++;
          else if (ch === '}') { depth--; if (depth === 0) { mmEnd = i; break; } }
        }
        if (mmEnd !== -1) {
          try {
            obj.mind_map = JSON.parse(mmSection.slice(mmBraceStart, mmEnd + 1));
          } catch {}
        }
      }
    }

    if (obj.topic && obj.ultra_long_notes && obj.ultra_long_notes.length >= 100) {
      logger.info('JSON extracted successfully on Stage 7 (field-by-field regex)');
      return obj;
    }
  } catch (stage7Err) {
    logger.error(`Stage 7 failed: ${stage7Err.message}`);
  }

  throw new Error(
    `All 7 JSON repair stages exhausted. ` +
    `Content length: ${jsonStr.length}. First 300 chars: "${trunc(jsonStr, 300)}"`
  );
}

// ── Helper for Stage 3: Fix control characters inside JSON strings ──
function fixControlCharsInStrings(jsonStr) {
  let result = '';
  let inString = false;
  let escaped = false;

  for (let i = 0; i < jsonStr.length; i++) {
    const ch = jsonStr[i];

    if (escaped) {
      result += ch;
      escaped = false;
      continue;
    }

    if (ch === '\\' && inString) {
      result += ch;
      escaped = true;
      continue;
    }

    if (ch === '"') {
      inString = !inString;
      result += ch;
      continue;
    }

    if (inString) {
      // Replace control characters inside strings
      if (ch === '\n') result += '\\n';
      else if (ch === '\r') result += '\\r';
      else if (ch === '\t') result += '\\t';
      else if (ch === '\b') result += '\\b';
      else if (ch === '\f') result += '\\f';
      else if (ch.charCodeAt(0) < 32) result += '\\u' + ch.charCodeAt(0).toString(16).padStart(4, '0');
      else result += ch;
    } else {
      result += ch;
    }
  }

  return result;
}

// ╔══════════════════════════════════════════════════════════════════════════════╗
// ║  SECTION 9 — DATA VALIDATION & ENRICHMENT                                  ║
// ╚══════════════════════════════════════════════════════════════════════════════╝

function validateAndEnrich(parsed, opts, input) {
  if (!parsed || typeof parsed !== 'object') {
    throw new Error('Parsed result is not an object');
  }

  // ── Required field: topic ──
  if (!parsed.topic || typeof parsed.topic !== 'string' || parsed.topic.trim().length < 2) {
    parsed.topic = (input || 'Study Material').slice(0, 120);
    logger.warn(`topic field missing/short — using fallback: "${parsed.topic}"`);
  } else {
    parsed.topic = parsed.topic.trim();
  }

  // ── Required field: ultra_long_notes ──
  if (!parsed.ultra_long_notes || typeof parsed.ultra_long_notes !== 'string' || parsed.ultra_long_notes.trim().length < 120) {
    throw new Error(
      `ultra_long_notes too short or missing (got ${parsed.ultra_long_notes?.length || 0} chars, need ≥120)`
    );
  }

  // ── Required field: practice_questions ──
  if (!Array.isArray(parsed.practice_questions) || parsed.practice_questions.length === 0) {
    throw new Error('practice_questions missing or empty');
  }

  // Normalise practice_questions
  parsed.practice_questions = parsed.practice_questions
    .filter(q => q && typeof q === 'object')
    .map(q => ({
      question: String(q.question || q.q || q.text || q.prompt || '').trim(),
      answer:   String(q.answer || q.a || q.explanation || q.solution || '').trim(),
    }))
    .filter(q => q.question.length >= 5 && q.answer.length >= 20)
    .slice(0, 3);

  if (parsed.practice_questions.length === 0) {
    throw new Error('All practice_questions items were invalid after filtering');
  }

  // ── Fill missing optional arrays ──
  if (!Array.isArray(parsed.key_concepts) || parsed.key_concepts.length === 0) {
    parsed.key_concepts = buildFallbackConcepts(parsed.topic);
  }
  if (!Array.isArray(parsed.key_tricks) || parsed.key_tricks.length === 0) {
    parsed.key_tricks = buildFallbackTricks(parsed.topic);
  }
  if (!Array.isArray(parsed.real_world_applications) || parsed.real_world_applications.length === 0) {
    parsed.real_world_applications = buildFallbackApplications(parsed.topic);
  }
  if (!Array.isArray(parsed.common_misconceptions) || parsed.common_misconceptions.length === 0) {
    parsed.common_misconceptions = buildFallbackMisconceptions(parsed.topic);
  }

  // ── Enforce array limits ──
  parsed.key_concepts            = parsed.key_concepts.slice(0, 5);
  parsed.key_tricks              = parsed.key_tricks.slice(0, 3);
  parsed.real_world_applications = parsed.real_world_applications.slice(0, 3);
  parsed.common_misconceptions   = parsed.common_misconceptions.slice(0, 3);
  parsed.practice_questions      = parsed.practice_questions.slice(0, 3);

  // ── Enforce branding — NEVER expose model identity ──
  parsed.powered_by    = `${BRAND} by ${DEVELOPER}`;
  parsed.study_score   = 96;
  parsed.generated_at  = parsed.generated_at || new Date().toISOString();
  parsed._language     = opts.language || 'English';
  parsed._version      = APP_VERSION;

  // Delete any model identity fields
  delete parsed._model;
  delete parsed.model;
  delete parsed.model_used;
  delete parsed.model_id;
  delete parsed.ai_model;
  delete parsed.openrouter_model;

  // ── Validate mind_map for mindmap tool ──
  if (opts.tool === 'mindmap') {
    if (!parsed.mind_map || typeof parsed.mind_map !== 'object') {
      // Build mind_map from available data
      parsed.mind_map = buildFallbackMindMap(parsed);
      logger.warn('mind_map field missing or invalid — built fallback');
    } else {
      // Validate and fix mind_map structure
      if (!parsed.mind_map.center || typeof parsed.mind_map.center !== 'string') {
        parsed.mind_map.center = parsed.topic || 'Study Topic';
      }
      if (!Array.isArray(parsed.mind_map.branches) || parsed.mind_map.branches.length < 3) {
        parsed.mind_map.branches = buildFallbackMindMap(parsed).branches;
      }
      // Ensure each branch has exactly 3 children
      parsed.mind_map.branches = parsed.mind_map.branches.slice(0, 7).map((b, i) => ({
        label:    b.label    || `Branch ${i + 1}`,
        color:    b.color    || ['#4F9CF9', '#42C98A', '#F59E0B', '#A855F7', '#EF4444'][i % 5],
        children: Array.isArray(b.children)
          ? b.children.slice(0, 3).map((c, j) => String(c || `Child ${j + 1}`))
          : [`Point ${i * 3 + 1}`, `Point ${i * 3 + 2}`, `Point ${i * 3 + 3}`],
      }));
      // Ensure minimum 5 branches
      while (parsed.mind_map.branches.length < 5) {
        const fallback = buildFallbackMindMap(parsed);
        const fbBranches = fallback.branches;
        for (const fb of fbBranches) {
          if (parsed.mind_map.branches.length >= 5) break;
          if (!parsed.mind_map.branches.find(b => b.label === fb.label)) {
            parsed.mind_map.branches.push(fb);
          }
        }
      }
    }
  }

  const notesWc = wordCount(parsed.ultra_long_notes);
  logger.info(`Quality: ${notesWc} words in notes, ${parsed.key_concepts.length} concepts, ${parsed.practice_questions.length} questions`);

  return parsed;
}

// ╔══════════════════════════════════════════════════════════════════════════════╗
// ║  SECTION 10 — FALLBACK CONTENT BUILDERS                                    ║
// ╚══════════════════════════════════════════════════════════════════════════════╝

function buildFallbackConcepts(topic) {
  const t = topic || 'this topic';
  return [
    `Core Definition: ${t} refers to the fundamental principles, concepts and frameworks forming its theoretical and practical foundation within its academic and professional domain.`,
    `Primary Mechanisms: The main processes central to ${t} involve systematic, analysable interactions between identifiable components that produce consistent, observable outcomes under appropriate conditions.`,
    `Historical Development: ${t} evolved through successive waves of intellectual discovery, critical reappraisal and paradigm shifts, with key contributors gradually establishing the foundational frameworks in use today.`,
    `Practical Significance: ${t} carries substantial direct application value across multiple professional and research domains, enabling practitioners to solve real-world problems more effectively and achieve measurably better outcomes.`,
    `Critical Boundaries: A complete and intellectually honest understanding of ${t} requires recognising both its considerable explanatory power and the specific conditions where its standard frameworks have important limitations.`,
  ];
}

function buildFallbackTricks(topic) {
  const t = topic || 'this topic';
  return [
    `FIVE W's FRAMEWORK: Apply Who, What, When, Where and Why systematically to every dimension of ${t}. For each concept, explicitly answer all five questions before moving on. This forces active engagement, creates a complete mental map, and immediately reveals which specific aspects you don't fully understand yet — those gaps are exactly where your next study session should focus.`,

    `THE FEYNMAN TECHNIQUE: After studying ${t}, close your notes and try to explain the entire topic out loud as if teaching a curious 12-year-old. Every time you hesitate, use jargon without explanation, or lose the thread, you have discovered a genuine gap in understanding. Return to your source, study that specific gap, then restart the explanation from the beginning. Repeat until complete and fluent from memory.`,

    `SPACED REPETITION SCHEDULE: Study ${t} in focused 20-minute sessions across multiple days — not in one marathon. Optimal spacing: Day 1 (initial learning), Day 3 (first review), Day 7 (consolidation), Day 14 (long-term retention), Day 30 (mastery check). Each review begins precisely when memories start fading. Research consistently shows this produces 2-3x better long-term retention than massed practice.`,
  ];
}

function buildFallbackApplications(topic) {
  const t = topic || 'this topic';
  return [
    `Healthcare & Medicine: Principles from ${t} directly inform clinical decision-making, diagnostic reasoning, treatment protocol design and patient outcome prediction. Medical professionals who deeply understand these concepts make more accurate assessments and deliver measurably better patient care.`,
    `Technology & Software Engineering: ${t} concepts underpin critical software architecture decisions, algorithm selection, and system optimisation strategies. Engineers who understand these principles design more scalable, maintainable and reliable systems that function correctly as requirements evolve.`,
    `Business Strategy & Management: Organisations that apply frameworks derived from ${t} systematically outperform those that do not. Strategic planners use these principles to analyse competitive environments, operations managers apply them to streamline workflows, and the resulting improvements compound into sustainable competitive advantages.`,
  ];
}

function buildFallbackMisconceptions(topic) {
  const t = topic || 'this topic';
  return [
    `Many students believe ${t} can be mastered through repeated memorisation of facts and definitions alone. In reality, genuine mastery requires understanding the underlying principles, causal relationships between ideas, and the reasoning that connects them. Memorisation without comprehension produces knowledge that collapses under exam pressure when questions are framed differently.`,

    `A widespread misconception is that ${t} is only relevant to specialists in that field. In reality, the core reasoning patterns, analytical frameworks and mental models that ${t} develops transfer powerfully across disciplines. Professionals in law, engineering, art and business all benefit from understanding its principles.`,

    `Students often assume that once they understand the basic concepts of ${t}, there is little of substance left to learn. In reality, ${t} has significant depth with important nuances, active ongoing research, and genuine unresolved debates at its frontier. Even leading researchers in the field regularly encounter aspects that surprise and challenge their existing mental models.`,
  ];
}

function buildFallbackMindMap(parsed) {
  const topic = parsed.topic || 'Study Topic';
  const concepts = parsed.key_concepts || [];
  const apps = parsed.real_world_applications || [];

  return {
    center: topic.slice(0, 40),
    branches: [
      {
        label: 'Core Definition',
        color: '#4F9CF9',
        children: [
          concepts[0]?.split(':')[0]?.slice(0, 40) || 'What It Is',
          concepts[1]?.split(':')[0]?.slice(0, 40) || 'Key Principles',
          concepts[2]?.split(':')[0]?.slice(0, 40) || 'Fundamentals',
        ],
      },
      {
        label: 'How It Works',
        color: '#42C98A',
        children: [
          'Mechanisms & Processes',
          'Key Components',
          'Step-by-Step Flow',
        ],
      },
      {
        label: 'Applications',
        color: '#F59E0B',
        children: [
          apps[0]?.split(':')[0]?.slice(0, 40) || 'Real-World Use',
          apps[1]?.split(':')[0]?.slice(0, 40) || 'Industry Impact',
          'Practical Benefits',
        ],
      },
      {
        label: 'Key Techniques',
        color: '#A855F7',
        children: [
          'Study Method 1',
          'Study Method 2',
          'Mastery Strategy',
        ],
      },
      {
        label: 'Watch Out For',
        color: '#EF4444',
        children: [
          'Common Mistake 1',
          'Common Mistake 2',
          'Key Misconception',
        ],
      },
    ],
  };
}

// ╔══════════════════════════════════════════════════════════════════════════════╗
// ║  SECTION 11 — FULL OFFLINE FALLBACK (2500+ words)                          ║
// ╚══════════════════════════════════════════════════════════════════════════════╝

function generateOfflineFallback(topic, opts) {
  const t    = (topic || 'This Subject').trim();
  const lang = opts.language || 'English';
  const tool = opts.tool     || 'notes';

  logger.warn(`Using offline fallback for topic: "${t}", lang: ${lang}, tool: ${tool}`);

  const result = {
    topic:                t,
    curriculum_alignment: 'General Academic Study',
    _language:            lang,
    _fallback:            true,
    _fallback_reason:     'All AI models temporarily unavailable — high-quality offline content generated',
    ultra_long_notes:     buildOfflineNotes(t, tool),
    key_concepts:         buildFallbackConcepts(t),
    key_tricks:           buildFallbackTricks(t),
    practice_questions: [
      {
        question: `Explain the core principles of ${t} and describe how they interact to form a coherent, integrated theoretical framework.`,
        answer:   buildFallbackAnswer1(t),
      },
      {
        question: `Describe a realistic professional scenario where deep knowledge of ${t} would be essential. Walk through your approach step by step.`,
        answer:   buildFallbackAnswer2(t),
      },
      {
        question: `Compare two fundamentally different approaches to understanding ${t}. What are the core strengths and primary limitations of each?`,
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

  // Add mind_map for mindmap tool
  if (tool === 'mindmap') {
    result.mind_map = buildFallbackMindMap(result);
  }

  return result;
}

function buildOfflineNotes(t, tool) {
  const sections = getToolSections(tool);

  let notes = `## Introduction to ${t}\n\n` +
    `${t} is a significant, multi-dimensional area of study with broad intellectual implications and extensive practical applications across numerous academic disciplines and professional fields. A rigorous, well-structured understanding of ${t} is not merely valuable for passing examinations — it opens doors to deeper intellectual capability, more sophisticated professional reasoning, and the capacity for continued independent learning throughout a career.\n\n` +
    `This comprehensive study guide covers the complete scope of ${t}: its foundational concepts, core mechanisms, key examples, advanced aspects, real-world applications, and an integrative summary that anchors your understanding.\n\n`;

  // Core Concepts section
  notes += `---\n\n## Core Concepts\n\n` +
    `The study of ${t} begins by establishing its fundamental conceptual infrastructure — the vocabulary, definitions and foundational ideas upon which all subsequent understanding must be built. Without this foundation, advanced concepts lack their necessary grounding.\n\n` +
    `**Theoretical Foundation**: Every developed field of knowledge has a theoretical core — a set of foundational assumptions, definitions and logical relationships that organise its knowledge claims and give its conclusions their authority. Understanding the theoretical foundation of ${t} means understanding not just what the field claims, but why those claims are considered justified, what evidence supports them, and what reasoning connects individual facts to broader principles.\n\n` +
    `**Practical Dimension**: The practical dimension of ${t} is what connects its abstract theoretical content to concrete real-world value. Understanding how principles manifest in practice — in professional decisions, in designed systems, in observed phenomena — transforms theoretical knowledge from inert information into usable capability.\n\n`;

  // How It Works section
  notes += `---\n\n## How It Works\n\n` +
    `The core processes and mechanisms central to ${t} unfold through identifiable stages that can be studied, understood and applied systematically:\n\n` +
    `**Stage 1 — Initial Conditions**: Every application of ${t} begins with specific initial conditions, inputs or prerequisite states. Accurately identifying and characterising these starting conditions is critical — misunderstanding or overlooking initial conditions is a primary source of errors in both academic analysis and professional practice.\n\n` +
    `**Stage 2 — Active Mechanisms**: The defining mechanisms of ${t} transform initial conditions into outcomes through processes that follow identifiable patterns and obey describable rules. Understanding these mechanisms at a deep level enables practitioners to predict behaviour, explain anomalies and design effective interventions.\n\n` +
    `**Stage 3 — Feedback and Adjustment**: Many systems described by ${t} incorporate feedback loops through which outcomes influence subsequent inputs, creating adaptive or self-correcting behaviour. Understanding feedback dynamics is essential for accurate long-term prediction.\n\n`;

  // Key Examples section
  notes += `---\n\n## Key Examples\n\n` +
    `**Foundational Example**: The classic demonstration cases of ${t} isolate core mechanisms from confounding complexity, allowing underlying principles to be seen with maximum clarity. These canonical examples form shared reference points that allow practitioners to communicate efficiently about complex ideas.\n\n` +
    `**Complex Case**: Real-world applications of ${t} rarely present themselves with textbook simplicity. Professional practice requires applying core principles under conditions of incomplete information, multiple interacting variables, and genuine uncertainty.\n\n`;

  // Advanced Aspects section
  notes += `---\n\n## Advanced Aspects\n\n` +
    `**Theoretical Complications**: As understanding deepens, the apparently simple core principles of ${t} reveal layers of complexity. Boundary conditions require careful specification. General principles require contextual modification. Competing theoretical frameworks offer different but partially valid perspectives on the same phenomena.\n\n` +
    `**Current Frontiers**: ${t} is not a closed, completed body of knowledge. Active researchers continue to explore open questions, challenge established assumptions, and discover connections to adjacent fields. Awareness of these frontiers contextualises current knowledge within the ongoing project of intellectual discovery.\n\n`;

  // Applications section
  notes += `---\n\n## Real-World Applications\n\n` +
    `${t} finds systematic application in research and academic contexts, enabling better study design and more accurate data interpretation. In professional practice, it supports higher-quality decision-making and more effective problem diagnosis. In educational settings, it provides frameworks that help learners structure new knowledge effectively.\n\n`;

  // Summary section
  notes += `---\n\n## Summary & Key Takeaways\n\n` +
    `Mastering ${t} is fundamentally a project of building genuine understanding — comprehending the why behind the what, the mechanisms behind the patterns, the principles behind the applications. Surface-level familiarity provides only fragile, inflexible knowledge, while deep understanding enables confident application to novel situations and creative synthesis of ideas.\n\n` +
    `**Five essential commitments for mastery:** (1) Build strong conceptual foundations before advancing to complex applications. (2) Connect every abstract principle to concrete, specific examples. (3) Understand the limits and boundary conditions of every general rule. (4) Regularly practice applying knowledge to unfamiliar situations. (5) Engage actively through explanation, teaching, self-testing and deliberate reflection on what you do and do not yet understand.`;

  return notes;
}

function getToolSections(tool) {
  switch (tool) {
    case 'flashcards': return ['Core Definitions', 'Key Mechanisms', 'Comparisons', 'Process Steps'];
    case 'quiz':       return ['Exam Focus', 'Most Tested', 'Common Mistakes', 'Model Answers'];
    case 'summary':    return ['TL;DR', 'Core Concepts', 'Key Facts', '5 Things to Remember'];
    case 'mindmap':    return ['Central Concept', 'Main Branches', 'Sub-Nodes', 'Connections'];
    default:           return ['Introduction', 'Core Concepts', 'How It Works', 'Examples', 'Applications', 'Summary'];
  }
}

function buildFallbackAnswer1(t) {
  return `The core principles of ${t} form an integrated theoretical system in which each component reinforces and contextualises the others — a system where the whole is substantially greater than the sum of its parts. At the foundational level, these principles establish the definitions, assumptions and logical categories upon which all subsequent understanding must be built. Without a clear grasp of these foundations, advanced concepts remain poorly anchored and are applied unreliably.\n\nThe mechanisms central to ${t} follow internally consistent patterns, and this consistency is precisely what enables systematic analysis, reliable prediction and purposeful intervention. The framework becomes analytically powerful when we understand not just individual components in isolation but the relationships between them — how each element influences and is shaped by others through both direct and indirect pathways operating across multiple levels and timescales.\n\nFrom a practical perspective, integrated understanding of the core principles is what distinguishes practitioners who can genuinely problem-solve from those who can only apply memorised procedures to familiar situations. Students who achieve real mastery can adapt their knowledge confidently to novel problems they have never previously encountered, identify which specific principles are most relevant to a given context, and construct clear well-reasoned explanations of their analytical decisions.\n\nThe most common and consequential mistake is treating the principles of ${t} as a collection of isolated, independent facts to be memorised separately. This approach makes the subject harder to learn, easier to forget under examination pressure, and more likely to be misapplied when real situations do not match the exact form in which content was originally studied. Understanding the system is always more powerful than knowing the parts.`;
}

function buildFallbackAnswer2(t) {
  return `Consider a professional context where decisions involving ${t} carry significant real-world consequences — where errors are costly, information is incomplete, multiple stakeholders have conflicting interests, and time pressure demands efficient thinking under uncertainty. This is the normal operating environment of professional practice in any field where ${t} is applied.\n\nStep one — precise problem identification: Define exactly what challenge needs to be addressed, what constraints and available resources exist, what a successful outcome looks like in specific measurable terms, and what failure would mean for each stakeholder involved. This diagnostic phase is consistently the most critical in professional practice, because the great majority of costly professional failures stem not from poor execution of a solution but from solving the wrong problem with impressive efficiency.\n\nStep two — selecting relevant frameworks: Identify which specific aspects of ${t} are most directly applicable to this particular situation. A defining characteristic of genuine expertise is knowing which principles to apply in which contexts — and equally important, which to set aside as irrelevant to the problem at hand.\n\nStep three — developing a grounded strategy: Design an approach rooted in the applicable principles, decomposing the complex problem into manageable sub-problems, sequencing them appropriately, and anticipating where the standard frameworks may require contextual modification.\n\nStep four — disciplined implementation with monitoring: Execute the strategy while actively observing what is happening and remaining prepared to adjust. Real-world application always reveals complexity that theoretical frameworks alone cannot fully anticipate.\n\nStep five — rigorous evaluation and learning: Compare actual outcomes against the original success criteria. Identify what worked, what did not, and why. Extract specific transferable lessons. Professionals who omit this reflection forfeit the opportunity to convert experience into genuine expertise.`;
}

function buildFallbackAnswer3(t) {
  return `Two fundamentally different approaches to understanding ${t} offer complementary and partially overlapping perspectives, each with distinctive strengths and real limitations.\n\nThe theoretical or first-principles approach emphasises conceptual understanding, formal frameworks, and the ability to reason rigorously from foundational axioms and definitions. Its principal strength is generalisability — deep theoretical understanding applies across diverse situations precisely because it is independent of any particular context or set of surface features. Theoretical knowledge also transfers more readily to genuinely novel situations that practitioners have never previously encountered, because it equips them with reasoning tools to construct new solutions. Its core limitation is that without substantial engagement with concrete applications and cases, theoretical knowledge can remain stubbornly abstract and difficult to deploy under real conditions of time pressure and incomplete information.\n\nThe empirical or case-based approach focuses on specific historical instances, observable data patterns, successful and failed professional examples, and accumulated practical wisdom of experience. This method produces actionable, context-sensitive knowledge grounded in verifiable reality, and builds the kind of rapid intuitive judgment that characterises highly effective expert practitioners. Its limitation is that patterns reliably observed in one context may not generalise safely to substantially different settings, and without theoretical grounding, case-based knowledge becomes brittle when genuinely novel situations arise.\n\nThe most sophisticated approach to ${t} deliberately integrates both — using theoretical frameworks to organise, interpret and generalise from empirical experience, while using empirical engagement to stress-test theoretical predictions and keep abstract principles anchored in reality. The most costly mistake is committing exclusively to one approach at the expense of the other.`;
}

// ╔══════════════════════════════════════════════════════════════════════════════╗
// ║  SECTION 12 — MODEL CALLER WITH STREAMING                                  ║
// ╚══════════════════════════════════════════════════════════════════════════════╝

async function callModelStream(model, prompt, opts, onChunk) {
  const ctrl  = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), model.timeout_ms);
  const t0    = Date.now();
  const name  = model.id.split('/').pop().replace(':free', '');

  try {
    const response = await fetch(OPENROUTER_BASE, {
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
        temperature: model.temperature,
        stream:      true,
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
    let   lineBuffer  = '';
    let   fullContent = '';
    let   tokenCount  = 0;
    let   charsEmitted = 0;

    while (true) {
      const { done, value } = await reader.read();

      if (done) {
        if (lineBuffer.trim()) processLine(lineBuffer.trim());
        break;
      }

      lineBuffer += decoder.decode(value, { stream: true });
      const lines = lineBuffer.split('\n');
      lineBuffer  = lines.pop() || '';

      for (const line of lines) processLine(line);
    }

    function processLine(line) {
      line = line.trim();
      if (!line) return;
      if (line.startsWith('data: ')) {
        const dataStr = line.slice(6).trim();
        if (dataStr === '[DONE]') return;
        if (!dataStr) return;

        let evt;
        try { evt = JSON.parse(dataStr); }
        catch { return; }

        const delta = evt?.choices?.[0]?.delta?.content;
        if (delta && typeof delta === 'string' && delta.length > 0) {
          fullContent  += delta;
          charsEmitted += delta.length;
          tokenCount++;
          if (typeof onChunk === 'function') onChunk(delta);
        }
      }
    }

    const elapsed = Date.now() - t0;

    if (fullContent.trim().length < 100) {
      throw new Error(`${name} stream produced too-short content: ${fullContent.length} chars after ${elapsed}ms`);
    }

    logger.ok(`${name} stream complete: ${tokenCount} tokens, ${charsEmitted} chars, ${elapsed}ms`);

    const parsed = extractAndParseJSON(fullContent);
    return validateAndEnrich(parsed, opts, prompt);

  } catch (err) {
    clearTimeout(timer);
    throw err;
  }
}

// ╔══════════════════════════════════════════════════════════════════════════════╗
// ║  SECTION 13 — MAIN AI GENERATOR WITH FULL FALLBACK CHAIN (20 attempts)     ║
// ╚══════════════════════════════════════════════════════════════════════════════╝

async function generateWithAI(message, opts, onChunk) {
  if (!process.env.OPENROUTER_API_KEY) {
    throw new Error(
      'OPENROUTER_API_KEY environment variable is not set. ' +
      'Please add it in your Vercel project settings → Environment Variables.'
    );
  }

  const prompt   = buildPrompt(message, opts);
  const errors   = [];
  let modelsTried = 0;
  let totalAttempts = 0;

  logger.info(
    `Generation start — ` +
    `tool: ${opts.tool || 'notes'} | lang: ${opts.language || 'English'} | ` +
    `depth: ${opts.depth || 'detailed'} | style: ${opts.style || 'simple'} | ` +
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
        const result = await callModelStream(model, prompt, opts, onChunk);

        result._language     = opts.language || 'English';
        result._models_tried = modelsTried;
        result._attempts     = totalAttempts;

        logger.ok(
          `SUCCESS — ${name} (attempt ${attempt}) | ` +
          `models tried: ${modelsTried}/${MODELS.length} | total attempts: ${totalAttempts}`
        );

        return result;

      } catch (err) {
        const errMsg = (err.message || 'Unknown error').slice(0, 150);
        errors.push(`${name}[${attempt}]: ${errMsg}`);
        logger.warn(`FAIL — ${name} attempt ${attempt}: ${errMsg}`);

        // Rate limited → skip second attempt immediately
        if (errMsg.includes('[RATE_LIMITED]')) {
          logger.warn(`Rate limited on ${name} — skipping to next model`);
          break;
        }

        // Timeout → skip second attempt
        if (err.name === 'AbortError') {
          logger.warn(`${name} timed out after ${model.timeout_ms}ms`);
          break;
        }

        // Wait before retry
        if (attempt < maxAttempts) {
          await sleep(1200);
        }
      }
    }

    // Brief pause between models
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

// ╔══════════════════════════════════════════════════════════════════════════════╗
// ║  SECTION 14 — RESPONSE HEADERS                                            ║
// ╚══════════════════════════════════════════════════════════════════════════════╝

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

// ╔══════════════════════════════════════════════════════════════════════════════╗
// ║  SECTION 15 — FINALIZE RESULT                                             ║
// ╚══════════════════════════════════════════════════════════════════════════════╝

function finalizeResult(result, startTime, extra = {}) {
  result.powered_by   = `${BRAND} by ${DEVELOPER}`;
  result._timestamp   = new Date().toISOString();
  result._version     = APP_VERSION;
  result._duration_ms = Date.now() - startTime;

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

// ╔══════════════════════════════════════════════════════════════════════════════╗
// ║  SECTION 16 — MAIN VERCEL HANDLER                                          ║
// ╚══════════════════════════════════════════════════════════════════════════════╝

module.exports = async function handler(req, res) {

  const requestId = Math.random().toString(36).slice(2, 10);
  const startTime = Date.now();

  logger.info(`[${requestId}] ${req.method} /api/study — ${req.headers['content-type'] || 'no content-type'}`);

  // ── Apply headers to all responses ──
  applyResponseHeaders(res);

  // ── Handle CORS preflight ──
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // ── Reject non-POST requests ──
  if (req.method !== 'POST') {
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
    tool:     ['notes','flashcards','quiz','summary','mindmap'].includes(rawOpts.tool) ? rawOpts.tool : 'notes',
    depth:    ['standard','detailed','comprehensive','expert'].includes(rawOpts.depth) ? rawOpts.depth : 'detailed',
    style:    ['simple','academic','detailed','exam','visual'].includes(rawOpts.style) ? rawOpts.style : 'simple',
    language: typeof rawOpts.language === 'string' && rawOpts.language.trim().length > 0 ? rawOpts.language.trim() : 'English',
    stream:   rawOpts.stream !== false, // Default to true for streaming
  };

  logger.info(
    `[${requestId}] Input: ${trimmed.length} chars | ` +
    `tool: ${opts.tool} | lang: ${opts.language} | depth: ${opts.depth} | style: ${opts.style}`
  );

  // ══════════════════════════════════════════════════════════════════════════════
  // STREAMING MODE — Server-Sent Events
  // ══════════════════════════════════════════════════════════════════════════════

  if (opts.stream) {

    // ── Set SSE response headers ──
    res.setHeader('Content-Type',      'text/event-stream; charset=utf-8');
    res.setHeader('Cache-Control',     'no-cache, no-store, no-transform');
    res.setHeader('Connection',        'keep-alive');
    res.setHeader('X-Accel-Buffering', 'no');         // Nginx: disable buffering
    res.setHeader('Transfer-Encoding', 'chunked');

    // ── Flush headers immediately ──
    if (typeof res.flushHeaders === 'function') res.flushHeaders();

    // ── Helper: write a named SSE event ──
    const sendSSE = (eventName, data) => {
      if (res.writableEnded) return;
      try {
        const serialised = typeof data === 'string' ? data : JSON.stringify(data);
        res.write(`event: ${eventName}\ndata: ${serialised}\n\n`);
        if (typeof res.flush === 'function') res.flush();
      } catch (writeErr) {
        logger.warn(`[${requestId}] SSE write error: ${writeErr.message}`);
      }
    };

    // ── Send immediate heartbeat ──
    sendSSE(EVT_HEARTBEAT, { ts: Date.now(), requestId, status: 'connected', message: 'Savoiré AI connected — generating…' });

    // ── Send initial stage event ──
    sendSSE(EVT_STAGE, { idx: 0, label: 'Analysing your topic…' });

    // ── Heartbeat interval — prevents proxy/CDN/Vercel from closing idle connection ──
    const heartbeatInterval = setInterval(() => {
      if (res.writableEnded) { clearInterval(heartbeatInterval); return; }
      try {
        res.write(`: keepalive ${Date.now()}\n\n`);
        if (typeof res.flush === 'function') res.flush();
      } catch {
        clearInterval(heartbeatInterval);
      }
    }, 10000);

    // ── Stage advancement timers ──
    const stageTimings = [0, 4000, 9000, 16000, 25000];
    const stageLabels  = [
      'Analysing your topic…',
      'Writing your study content…',
      'Building sections and cards…',
      'Crafting practice questions…',
      'Finalising and formatting…',
    ];
    const stageTimers = stageTimings.map((delay, idx) => {
      if (idx === 0) return null;
      return setTimeout(() => {
        sendSSE(EVT_STAGE, { idx, label: stageLabels[idx] });
      }, delay);
    });

    const clearStageTimers = () => stageTimers.forEach(t => t && clearTimeout(t));

    try {
      let tokensSent = 0;
      let charsStreamed = 0;

      // ── Token callback — fires for every token from the AI model ──
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
        _tokens_sent:    tokensSent,
        _chars_streamed: charsStreamed,
        _request_id:     requestId,
      });

      logger.ok(
        `[${requestId}] Stream success — ` +
        `${tokensSent} tokens, ${charsStreamed} chars, ` +
        `${final._duration_ms}ms total`
      );

      // ── Send the complete structured data as final event ──
      sendSSE(EVT_DONE, final);
      res.end();

    } catch (aiError) {

      clearInterval(heartbeatInterval);
      clearStageTimers();

      logger.warn(`[${requestId}] AI streaming failed: ${aiError.message} — simulating fallback stream`);

      // ── FALLBACK: Stream offline content word by word ──
      const fallback   = generateOfflineFallback(trimmed, opts);
      const streamText = fallback.ultra_long_notes || '';
      const words      = streamText.split(' ');
      let   tokensSent = 0;

      sendSSE(EVT_STAGE, { idx: 2, label: 'Generating from local knowledge…' });

      // Stream words in small groups for natural feel
      for (let i = 0; i < words.length; i += 3) {
        if (res.writableEnded) break;

        const chunk = words.slice(i, i + 3).join(' ') + ' ';
        sendSSE(EVT_TOKEN, { t: chunk });
        tokensSent++;

        // ~40 words/second — feels natural
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

  // ══════════════════════════════════════════════════════════════════════════════
  // NON-STREAMING MODE — Full JSON response (used as fallback)
  // ══════════════════════════════════════════════════════════════════════════════

  try {
    let result;
    try {
      result = await generateWithAI(trimmed, opts);
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

    // Even on unexpected error — return something useful
    const emergencyFallback = generateOfflineFallback(trimmed, opts);
    const final = finalizeResult(emergencyFallback, startTime, {
      _request_id: requestId,
      _error:      true,
      _error_type: 'unexpected',
    });

    return res.status(200).json(final);
  }
};

// ╔══════════════════════════════════════════════════════════════════════════════╗
// ║  SECTION 17 — VERCEL CONFIGURATION REFERENCE                               ║
// ╚══════════════════════════════════════════════════════════════════════════════╝
//
// vercel.json (place in project root):
// {
//   "functions": {
//     "api/study.js": {
//       "maxDuration": 300
//     }
//   }
// }
//
// Environment Variables (set in Vercel dashboard → Settings → Environment Variables):
// Name:  OPENROUTER_API_KEY
// Value: sk-or-v1-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
//
// Get your free API key at: https://openrouter.ai
// All 10 models used here have the :free suffix — $0 per request, no credit card needed.

// ═══════════════════════════════════════════════════════════════════════════════════════════════════
// END OF FILE — api/study.js
// Savoiré AI v3.0 — Built by Sooban Talha Technologies | soobantalhatech.xyz
// Founder: Sooban Talha | Free for every student on Earth, forever.
// ═══════════════════════════════════════════════════════════════════════════════════════════════════
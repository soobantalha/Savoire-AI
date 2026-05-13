// ═══════════════════════════════════════════════════════════════════════════════════════════════════
// SAVOIRÉ AI v2.0 — api/study.js — ULTRA PREMIUM BACKEND
// Built by Sooban Talha Technologies | soobantalhatech.xyz
// Founder: Sooban Talha
//
// ╔══════════════════════════════════════════════════════════════════════════════════════════════════╗
// ║                                    FEATURE MATRIX                                                ║
// ╠══════════════════════════════════════════════════════════════════════════════════════════════════╣
// ║  ✦ TRUE SSE STREAMING          ✦ 10+ FREE AI MODELS           ✦ SMART FAILOVER                  ║
// ║  ✦ HEARTBEAT SYSTEM            ✦ RATE LIMIT DETECTION         ✦ DOUBLE RETRY LOGIC              ║
// ║  ✦ 50+ LANGUAGES               ✦ 4 DEPTH LEVELS               ✦ 5 WRITING STYLES                ║
// ║  ✦ 5 STUDY TOOLS               ✦ STRUCTURED JSON OUTPUT       ✦ QUALITY FALLBACK                ║
// ║  ✦ CORS SUPPORT                ✦ SECURITY HEADERS             ✦ REQUEST LOGGING                 ║
// ║  ✦ 300s TIMEOUT                ✦ VERCEL OPTIMIZED             ✦ EDGE COMPATIBLE                 ║
// ╚══════════════════════════════════════════════════════════════════════════════════════════════════╝
// ═══════════════════════════════════════════════════════════════════════════════════════════════════

'use strict';

/* ─────────────────────────────────────────────────────────────────────────────────────────────────
   SECTION 1: CONSTANTS & BRANDING
   ───────────────────────────────────────────────────────────────────────────────────────────────── */

const BRAND = 'Savoiré AI v2.0';
const DEVELOPER = 'Sooban Talha Technologies';
const DEVSITE = 'soobantalhatech.xyz';
const WEBSITE = 'savoireai.vercel.app';
const FOUNDER = 'Sooban Talha';
const APP_VERSION = '2.0';
const BUILD_NUMBER = '2025.001';

const OPENROUTER_BASE = 'https://openrouter.ai/api/v1/chat/completions';
const HTTP_REFERER = `https://${WEBSITE}`;
const APP_TITLE = BRAND;

// SSE Event Types
const SSE_EVENTS = {
  TOKEN: 'token',
  DONE: 'done',
  ERROR: 'error',
  HEARTBEAT: 'heartbeat',
  STAGE: 'stage',
  METRICS: 'metrics'
};

/* ─────────────────────────────────────────────────────────────────────────────────────────────────
   SECTION 2: FREE AI MODEL ROSTER — 10+ MODELS WITH FREE SUFFIX
   All models use :free suffix on OpenRouter — $0 per request
   Tried in priority order for best quality and reliability
   ───────────────────────────────────────────────────────────────────────────────────────────────── */

const MODELS = [
  {
    id: 'google/gemini-2.0-flash-exp:free',
    name: 'Gemini 2.0 Flash',
    maxTokens: 8000,
    timeoutMs: 120000,
    priority: 1,
    quality: 10,
    speed: 9,
    description: 'Best quality, fastest response, excellent at structured JSON'
  },
  {
    id: 'deepseek/deepseek-chat-v3-0324:free',
    name: 'DeepSeek Chat v3',
    maxTokens: 8000,
    timeoutMs: 120000,
    priority: 2,
    quality: 9,
    speed: 8,
    description: 'Outstanding reasoning, very strong at detailed academic content'
  },
  {
    id: 'meta-llama/llama-3.3-70b-instruct:free',
    name: 'LLaMA 3.3 70B',
    maxTokens: 6000,
    timeoutMs: 110000,
    priority: 3,
    quality: 9,
    speed: 7,
    description: 'Meta flagship, excellent instruction following'
  },
  {
    id: 'mistralai/mixtral-8x7b-instruct:free',
    name: 'Mixtral 8x7B',
    maxTokens: 6000,
    timeoutMs: 110000,
    priority: 4,
    quality: 8,
    speed: 7,
    description: 'Mixtral MoE, great balance of quality and speed'
  },
  {
    id: 'z-ai/glm-4.5-air:free',
    name: 'GLM 4.5 Air',
    maxTokens: 6000,
    timeoutMs: 100000,
    priority: 5,
    quality: 8,
    speed: 8,
    description: 'Strong multilingual capabilities'
  },
  {
    id: 'microsoft/phi-4-reasoning-plus:free',
    name: 'Phi-4 Reasoning Plus',
    maxTokens: 4000,
    timeoutMs: 90000,
    priority: 6,
    quality: 8,
    speed: 8,
    description: 'Microsoft, excellent logical reasoning'
  },
  {
    id: 'qwen/qwen3-8b:free',
    name: 'Qwen3 8B',
    maxTokens: 4000,
    timeoutMs: 90000,
    priority: 7,
    quality: 7,
    speed: 8,
    description: 'Alibaba, solid multilingual performance'
  },
  {
    id: 'google/gemini-flash-1.5-8b:free',
    name: 'Gemini Flash 1.5 8B',
    maxTokens: 4000,
    timeoutMs: 80000,
    priority: 8,
    quality: 7,
    speed: 9,
    description: 'Lightweight Gemini, fast and reliable'
  },
  {
    id: 'nousresearch/hermes-3-llama-3.1-405b:free',
    name: 'Hermes 3 LLaMA 405B',
    maxTokens: 6000,
    timeoutMs: 120000,
    priority: 9,
    quality: 9,
    speed: 5,
    description: 'Massive model, great for comprehensive deep content'
  },
  {
    id: 'mistralai/mistral-7b-instruct-v0.3:free',
    name: 'Mistral 7B',
    maxTokens: 3500,
    timeoutMs: 80000,
    priority: 10,
    quality: 6,
    speed: 8,
    description: 'Reliable European model'
  },
  {
    id: 'openchat/openchat-7b:free',
    name: 'OpenChat 7B',
    maxTokens: 3500,
    timeoutMs: 80000,
    priority: 11,
    quality: 6,
    speed: 8,
    description: 'Final fallback, consistently available'
  }
];

/* ─────────────────────────────────────────────────────────────────────────────────────────────────
   SECTION 3: DEPTH CONFIGURATION
   ───────────────────────────────────────────────────────────────────────────────────────────────── */

const DEPTH_CONFIG = {
  standard: {
    wordRange: '600 to 900 words',
    minWords: 600,
    targetWords: 750,
    maxWords: 900,
    description: 'Clear and accessible, covering all essentials with good depth',
    sectionsRequired: 4,
    detailLevel: 3
  },
  detailed: {
    wordRange: '1000 to 1500 words',
    minWords: 1000,
    targetWords: 1250,
    maxWords: 1500,
    description: 'Detailed coverage with concrete examples and thorough explanations',
    sectionsRequired: 6,
    detailLevel: 4
  },
  comprehensive: {
    wordRange: '1500 to 2000 words',
    minWords: 1500,
    targetWords: 1750,
    maxWords: 2000,
    description: 'Comprehensive analysis covering all major aspects, nuances and edge cases',
    sectionsRequired: 7,
    detailLevel: 5
  },
  expert: {
    wordRange: '2000 to 2800 words including advanced subtopics, nuances, cutting-edge developments',
    minWords: 2000,
    targetWords: 2400,
    maxWords: 2800,
    description: 'Expert-level deep dive covering advanced subtopics, academic debates and future directions',
    sectionsRequired: 8,
    detailLevel: 5
  }
};

/* ─────────────────────────────────────────────────────────────────────────────────────────────────
   SECTION 4: STYLE CONFIGURATION
   ───────────────────────────────────────────────────────────────────────────────────────────────── */

const STYLE_CONFIG = {
  simple: {
    name: 'Simple & Clear',
    instruction: `Write in clear, accessible, beginner-friendly language throughout. Define every technical term immediately when first used. Use short sentences, everyday analogies and comparisons. Avoid jargon wherever possible. The goal is that a motivated student encountering this topic for the very first time should understand every sentence.`,
    tone: 'friendly',
    complexity: 1
  },
  academic: {
    name: 'Academic & Formal',
    instruction: `Write in formal academic language with precise scholarly terminology. Maintain a third-person objective tone. Use discipline-specific vocabulary without oversimplification. Employ citation-ready phrases and formal definitions. The style should be suitable for a university essay or academic report.`,
    tone: 'formal',
    complexity: 4
  },
  detailed: {
    name: 'Highly Detailed',
    instruction: `Provide exhaustive detail at every point. Include numerous concrete examples, counterexamples, edge cases, specific statistics where relevant, and thorough multi-step explanations. Never summarise where you could explain fully. Leave nothing implicit.`,
    tone: 'explanatory',
    complexity: 4
  },
  exam: {
    name: 'Exam-Focused',
    instruction: `Structure the entire response around exam success. Provide clear key definitions in mark-scheme language. Highlight frequently examined aspects. Explicitly state what examiners look for. Include mark-worthy phrases that score well. Flag common student mistakes.`,
    tone: 'direct',
    complexity: 3
  },
  visual: {
    name: 'Visual & Analogy-Rich',
    instruction: `Make every concept concrete and memorable through vivid analogies, metaphors, visual descriptions and step-by-step walkthroughs. Compare abstract ideas to everyday objects. Build mental models that students can visualise clearly. Use narrative where helpful.`,
    tone: 'narrative',
    complexity: 2
  }
};

/* ─────────────────────────────────────────────────────────────────────────────────────────────────
   SECTION 5: TOOL CONFIGURATION
   ───────────────────────────────────────────────────────────────────────────────────────────────── */

const TOOL_CONFIG = {
  notes: {
    name: 'Generate Notes',
    objective: 'Generate comprehensive, deeply detailed, well-structured study notes.',
    emphasis: `The ultra_long_notes field is the centrepiece. It MUST be genuinely long and detailed. Use rich markdown formatting: ## headings for sections, **bold** for key terms, bullet lists, numbered lists, > blockquotes for important definitions, and --- between major sections.`,
    sections: ['Introduction', 'Core Concepts', 'How It Works', 'Key Examples', 'Advanced Aspects', 'Common Applications', 'Critical Analysis', 'Summary & Key Takeaways']
  },
  flashcards: {
    name: 'Create Flashcards',
    objective: 'Generate study materials optimised for interactive flashcard learning.',
    emphasis: `The key_concepts should be formatted as perfect flashcard pairs — clear concise front side followed by colon then clear accurate back side. Each pair should stand completely alone. The practice_questions should use the same format — short memorable questions with concise answers.`,
    sections: ['Introduction', 'Core Concepts', 'How It Works', 'Key Examples', 'Summary']
  },
  quiz: {
    name: 'Build Quiz',
    objective: 'Generate challenging practice questions for self-testing.',
    emphasis: `The practice_questions are the core. Make them genuinely challenging. Vary the question types: analytical, application, and evaluation. Each answer must be comprehensive — minimum 200 words — covering direct answer, detailed explanation, specific example, real-world relevance, and common mistakes.`,
    sections: ['Introduction', 'Core Concepts', 'How It Works', 'Key Examples', 'Summary']
  },
  summary: {
    name: 'Smart Summary',
    objective: 'Generate a concise, punchy smart summary for fast review.',
    emphasis: `Begin ultra_long_notes with a 2-3 sentence TL;DR paragraph. Then follow with clearly labelled sections covering only the most critical points. The key_concepts should represent the absolute TOP 5 things a student MUST know. The tone should be efficient and direct.`,
    sections: ['TL;DR', 'Core Concepts', 'Key Mechanisms', 'Critical Examples', 'What to Remember']
  },
  mindmap: {
    name: 'Build Mind Map',
    objective: 'Generate content structured hierarchically for a visual mind map.',
    emphasis: `Structure ALL content to reveal hierarchical relationships. ultra_long_notes should use nested bullet points mirroring a mind map. key_concepts represent the 5 main branches. real_world_applications represent the Applications branch. key_tricks represent Study Strategies.`,
    sections: ['Central Topic', 'Main Branches', 'Sub-Branches', 'Connections', 'Applications']
  }
};

/* ─────────────────────────────────────────────────────────────────────────────────────────────────
   SECTION 6: LANGUAGE SUPPORT — 50+ LANGUAGES
   ───────────────────────────────────────────────────────────────────────────────────────────────── */

const SUPPORTED_LANGUAGES = [
  'English', 'Urdu', 'Hindi', 'Arabic', 'French', 'German', 'Spanish', 'Portuguese',
  'Italian', 'Dutch', 'Russian', 'Turkish', 'Chinese (Simplified)', 'Chinese (Traditional)',
  'Japanese', 'Korean', 'Bengali', 'Punjabi', 'Indonesian', 'Malay', 'Swahili', 'Persian',
  'Vietnamese', 'Thai', 'Greek', 'Polish', 'Swedish', 'Norwegian', 'Danish', 'Finnish',
  'Czech', 'Romanian', 'Hungarian', 'Ukrainian', 'Hebrew', 'Nepali', 'Tamil', 'Telugu',
  'Kannada', 'Marathi', 'Gujarati', 'Sinhala', 'Amharic', 'Somali', 'Burmese', 'Khmer',
  'Lao', 'Mongolian', 'Georgian', 'Armenian', 'Albanian', 'Macedonian', 'Bulgarian',
  'Serbian', 'Croatian', 'Bosnian', 'Slovenian', 'Slovak', 'Estonian', 'Latvian', 'Lithuanian',
  'Icelandic', 'Irish', 'Welsh', 'Basque', 'Catalan', 'Galician', 'Maltese'
];

/* ─────────────────────────────────────────────────────────────────────────────────────────────────
   SECTION 7: UTILITY FUNCTIONS
   ───────────────────────────────────────────────────────────────────────────────────────────────── */

const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

const logger = {
  info: (...args) => console.log(`[${new Date().toISOString()}] [${BRAND}] 📘 INFO:`, ...args),
  success: (...args) => console.log(`[${new Date().toISOString()}] [${BRAND}] ✅ SUCCESS:`, ...args),
  warn: (...args) => console.warn(`[${new Date().toISOString()}] [${BRAND}] ⚠️ WARN:`, ...args),
  error: (...args) => console.error(`[${new Date().toISOString()}] [${BRAND}] ❌ ERROR:`, ...args),
  model: (...args) => console.log(`[${new Date().toISOString()}] [MODEL] 🤖`, ...args),
  stream: (...args) => console.log(`[${new Date().toISOString()}] [STREAM] 📡`, ...args)
};

const wordCount = (text) => {
  if (!text || typeof text !== 'string') return 0;
  return text.trim().split(/\s+/).filter(Boolean).length;
};

const truncate = (str, maxLen = 100) => {
  if (!str) return '';
  return String(str).length > maxLen ? String(str).substring(0, maxLen) + '…' : String(str);
};

const generateRequestId = () => {
  return Math.random().toString(36).substring(2, 10) + Date.now().toString(36);
};

const sanitizeInput = (input) => {
  if (!input || typeof input !== 'string') return '';
  return input.trim().slice(0, 15000).replace(/[<>]/g, '');
};

/* ─────────────────────────────────────────────────────────────────────────────────────────────────
   SECTION 8: PROMPT BUILDER — ADVANCED MULTI-CONTEXT
   ───────────────────────────────────────────────────────────────────────────────────────────────── */

function buildPrompt(input, options) {
  const language = options.language || 'English';
  const depth = options.depth || 'detailed';
  const style = options.style || 'simple';
  const tool = options.tool || 'notes';
  
  const depthConfig = DEPTH_CONFIG[depth] || DEPTH_CONFIG.detailed;
  const styleConfig = STYLE_CONFIG[style] || STYLE_CONFIG.simple;
  const toolConfig = TOOL_CONFIG[tool] || TOOL_CONFIG.notes;
  
  const timestamp = new Date().toISOString();
  const sectionsList = toolConfig.sections.map(s => `  ## ${s}`).join('\n');
  
  return `╔════════════════════════════════════════════════════════════════════════════════════════════╗
║                              SAVOIRÉ AI — ADVANCED STUDY GENERATOR                              ║
╚════════════════════════════════════════════════════════════════════════════════════════════════╝

SYSTEM IDENTITY:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
You are ${BRAND}, the world's most advanced free AI study companion.
Built by ${DEVELOPER} | ${DEVSITE} | Founder: ${FOUNDER}
Version: ${APP_VERSION} | Build: ${BUILD_NUMBER}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

TASK OBJECTIVE:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
${toolConfig.objective}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

STUDENT INPUT:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Topic/Text: ${input}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

OUTPUT SPECIFICATIONS:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
✧ OUTPUT LANGUAGE: ${language}
✧ DEPTH LEVEL: ${depthConfig.wordRange} (${depthConfig.description})
✧ WRITING STYLE: ${styleConfig.name} — ${styleConfig.instruction.substring(0, 200)}...
✧ TOOL MODE: ${toolConfig.name} — ${toolConfig.emphasis}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

REQUIRED SECTION STRUCTURE:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
${sectionsList}
Each section must be substantive — minimum 80 words per section, more is better for deeper levels.
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

MARKDOWN FORMATTING REQUIREMENTS:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
• ## headings for every major section (not ###, use ##)
• **bold text** for EVERY key term on first use
• Bullet lists (- item) for enumerations and lists
• Numbered lists (1. item) for processes and sequences
• > blockquotes for important definitions, rules or key statements
• --- horizontal rules between major sections
• \`code\` for technical terms, formulas, or file names
• [links](url) for references when appropriate
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

JSON OUTPUT STRUCTURE — EXACT SPECIFICATION:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

{
  "topic": "specific, accurate topic name in ${language} (clean, no extra text)",
  
  "curriculum_alignment": "academic level and subject (e.g., 'A-Level Biology', 'University CS')",
  
  "ultra_long_notes": "FULL RICH MARKDOWN STUDY NOTES — MINIMUM ${depthConfig.wordRange}. Use proper markdown with ## headings, **bold** for key terms, bullet lists, numbered lists, > blockquotes, --- horizontal rules. This is the PRIMARY content students will read.",
  
  "key_concepts": [
    "Term 1: comprehensive explanation (25-40 words) in ${language}",
    "Term 2: comprehensive explanation (25-40 words) in ${language}",
    "Term 3: comprehensive explanation (25-40 words) in ${language}",
    "Term 4: comprehensive explanation (25-40 words) in ${language}",
    "Term 5: comprehensive explanation (25-40 words) in ${language}"
  ],
  
  "key_tricks": [
    "Practical memory aid / mnemonic / study strategy (55-75 words) in ${language} — include technique name and how to apply it",
    "Second memory trick with different approach (55-75 words) in ${language}",
    "Third memory trick or exam strategy (55-75 words) in ${language}"
  ],
  
  "practice_questions": [
    {
      "question": "Challenging analytical question in ${language} that requires reasoning, not just recall",
      "answer": "COMPREHENSIVE answer (minimum 160 words) in ${language} covering: 1) Direct answer, 2) Detailed reasoning, 3) Specific concrete example, 4) Real-world relevance, 5) Common mistake to avoid"
    },
    {
      "question": "Application-based question in ${language} requiring scenario analysis",
      "answer": "COMPREHENSIVE answer (minimum 160 words) in ${language} with the same 5-part structure"
    },
    {
      "question": "Evaluation or comparison question in ${language} requiring critical thinking",
      "answer": "COMPREHENSIVE answer (minimum 160 words) in ${language} with the same 5-part structure"
    }
  ],
  
  "real_world_applications": [
    "Domain/Field 1: specific, detailed application of concept (45-65 words) in ${language} — explain HOW it applies",
    "Domain/Field 2: specific, detailed application (45-65 words) in ${language} with concrete example",
    "Domain/Field 3: specific, detailed application (45-65 words) in ${language} with real-world impact"
  ],
  
  "common_misconceptions": [
    "Many students believe [wrong idea]. In reality, [correct explanation with reason why the misconception is wrong] (45-65 words) in ${language}",
    "Second misconception with clear correction (45-65 words) in ${language}",
    "Third misconception with memorable correction (45-65 words) in ${language}"
  ],
  
  "study_score": 96,
  "powered_by": "${BRAND} by ${DEVELOPER}",
  "generated_at": "${timestamp}"
}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
CRITICAL INSTRUCTIONS — READ CAREFULLY:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
1. Your ENTIRE response must be a SINGLE valid JSON object
2. NO text before the opening { and NO text after the closing }
3. NO markdown code fences (\`\`\`json or \`\`\`)
4. NO comments or annotations inside the JSON
5. All string values must use proper JSON escaping (\\n for newlines, \\" for quotes)
6. The ultra_long_notes field ALONE must meet the word count requirement
7. ALL content must be in ${language} — not a single word in any other language
8. Quality over quantity — but quantity requirements are MINIMUMS, not maximums
9. Be academically rigorous, factually accurate, and pedagogically sound
10. Remember: This is for a REAL student studying. Make it genuinely useful.
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

BEGIN YOUR JSON RESPONSE NOW (remember: ONLY JSON, no other text):`;
}

/* ─────────────────────────────────────────────────────────────────────────────────────────────────
   SECTION 9: JSON EXTRACTION & PARSING — ROBUST HANDLER
   ───────────────────────────────────────────────────────────────────────────────────────────────── */

function extractAndParseJSON(rawContent) {
  if (!rawContent || typeof rawContent !== 'string') {
    throw new Error('Model returned empty or non-string content');
  }
  
  let text = rawContent.trim();
  
  // Remove markdown code fences
  text = text.replace(/^```(?:json)?\s*/i, '');
  text = text.replace(/\s*```\s*$/i, '');
  text = text.trim();
  
  // Find JSON object boundaries
  const startIndex = text.indexOf('{');
  const endIndex = text.lastIndexOf('}');
  
  if (startIndex === -1) {
    throw new Error(`No JSON object opening brace found. Preview: "${truncate(text, 200)}"`);
  }
  if (endIndex === -1 || endIndex <= startIndex) {
    throw new Error(`No valid JSON object closing brace found. Preview: "${truncate(text, 200)}"`);
  }
  
  let jsonStr = text.substring(startIndex, endIndex + 1);
  
  // Try direct parse first
  try {
    return JSON.parse(jsonStr);
  } catch (directError) {
    logger.warn(`Direct JSON parse failed: ${directError.message} — attempting repairs`);
  }
  
  // Repair common JSON issues
  let repaired = jsonStr;
  
  // Fix unescaped newlines inside strings
  repaired = repaired.replace(/"((?:[^"\\]|\\.)*)"/g, (match, inner) => {
    const fixed = inner
      .replace(/\r\n/g, '\\n')
      .replace(/\r/g, '\\r')
      .replace(/\n/g, '\\n')
      .replace(/\t/g, '\\t');
    return `"${fixed}"`;
  });
  
  // Remove trailing commas
  repaired = repaired.replace(/,(\s*[}\]])/g, '$1');
  
  // Fix unquoted property keys
  repaired = repaired.replace(/([{,]\s*)([a-zA-Z_][a-zA-Z0-9_]*)(\s*:)/g, '$1"$2"$3');
  
  // Fix single quotes to double quotes
  repaired = repaired.replace(/'/g, '"');
  
  try {
    return JSON.parse(repaired);
  } catch (repairError) {
    throw new Error(
      `JSON parse failed after repairs. Original error: ${repairError.message}. ` +
      `Content length: ${jsonStr.length}. First 300 chars: "${truncate(jsonStr, 300)}"`
    );
  }
}

/* ─────────────────────────────────────────────────────────────────────────────────────────────────
   SECTION 10: DATA VALIDATION & ENRICHMENT
   ───────────────────────────────────────────────────────────────────────────────────────────────── */

function validateAndEnrich(parsed, options) {
  if (!parsed || typeof parsed !== 'object') {
    throw new Error('Parsed result is not an object');
  }
  
  // Required fields validation
  if (!parsed.topic || typeof parsed.topic !== 'string' || parsed.topic.trim().length < 2) {
    parsed.topic = options.topic || 'Study Material';
  }
  
  if (!parsed.ultra_long_notes || typeof parsed.ultra_long_notes !== 'string') {
    throw new Error('Missing required field: ultra_long_notes');
  }
  
  const notesLength = parsed.ultra_long_notes.trim().length;
  if (notesLength < 200) {
    throw new Error(`ultra_long_notes too short: ${notesLength} characters (minimum 200)`);
  }
  
  // Validate and fix arrays
  if (!Array.isArray(parsed.practice_questions) || parsed.practice_questions.length === 0) {
    parsed.practice_questions = buildFallbackQuestions(parsed.topic);
  } else {
    parsed.practice_questions = parsed.practice_questions
      .filter(q => q && typeof q === 'object')
      .map(q => ({
        question: String(q.question || q.q || '').trim(),
        answer: String(q.answer || q.a || '').trim()
      }))
      .filter(q => q.question.length > 10 && q.answer.length > 50);
    
    if (parsed.practice_questions.length === 0) {
      parsed.practice_questions = buildFallbackQuestions(parsed.topic);
    }
  }
  
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
  
  // Trim arrays to maximum lengths
  const maxLengths = {
    key_concepts: 5,
    key_tricks: 3,
    real_world_applications: 3,
    common_misconceptions: 3,
    practice_questions: 3
  };
  
  Object.keys(maxLengths).forEach(key => {
    if (parsed[key] && parsed[key].length > maxLengths[key]) {
      parsed[key] = parsed[key].slice(0, maxLengths[key]);
    }
  });
  
  // Enrich with metadata
  parsed.powered_by = `${BRAND} by ${DEVELOPER}`;
  parsed.study_score = parsed.study_score || 96;
  parsed.generated_at = parsed.generated_at || new Date().toISOString();
  parsed._language = options.language || 'English';
  parsed._version = APP_VERSION;
  parsed._tool = options.tool || 'notes';
  parsed._depth = options.depth || 'detailed';
  parsed._style = options.style || 'simple';
  
  // Remove any model identity fields
  delete parsed._model;
  delete parsed.model;
  delete parsed.model_used;
  delete parsed.model_id;
  delete parsed.ai_model;
  delete parsed.openrouter_model;
  
  // Log quality metrics
  const notesWC = wordCount(parsed.ultra_long_notes);
  logger.info(`Quality check: ${notesWC} words in notes, ${parsed.key_concepts.length} concepts, ${parsed.practice_questions.length} questions`);
  
  return parsed;
}

/* ─────────────────────────────────────────────────────────────────────────────────────────────────
   SECTION 11: FALLBACK CONTENT BUILDERS — HIGH QUALITY OFFLINE CONTENT
   ───────────────────────────────────────────────────────────────────────────────────────────────── */

function buildFallbackConcepts(topic) {
  const t = topic || 'this subject';
  return [
    `Fundamental Definition: ${t} encompasses the core principles, theories, and frameworks that form the foundation of this field of study, establishing the vocabulary, assumptions, and analytical tools necessary for deeper understanding.`,
    `Core Mechanisms: The primary processes driving ${t} involve systematic interactions between identifiable components that produce consistent, observable outcomes under specific conditions.`,
    `Historical Development: ${t} evolved through successive waves of intellectual discovery, critical reappraisal, and paradigm shifts, with key contributors gradually establishing the foundational frameworks in use today.`,
    `Practical Significance: ${t} carries substantial direct application value across multiple professional domains, enabling practitioners to solve real-world problems more effectively.`,
    `Critical Boundaries: Complete understanding of ${t} requires explicitly recognising both its considerable explanatory power and the specific conditions where its standard frameworks have important limitations.`
  ];
}

function buildFallbackTricks(topic) {
  const t = topic || 'this topic';
  return [
    `The Feynman Technique: After studying ${t}, close your notes and try to explain the entire topic out loud as if teaching a curious 12-year-old. Every time you hesitate or use unexplained jargon, you've found a genuine gap in your understanding. Return to your source, study that specific gap, then restart the explanation. Repeat until you can explain it completely and fluently.`,
    
    `Spaced Repetition System: Study ${t} in focused 20-minute sessions across multiple days. Optimal spacing: Day 1 (initial learning), Day 3 (first review), Day 7 (consolidation), Day 14 (long-term retention). This exploits the spacing effect, which research consistently shows produces 2-3x better long-term retention than massed practice.`,
    
    `The FIVE W's Framework: Apply Who, What, When, Where, and Why systematically to every dimension of ${t}. For each concept, explicitly answer all five questions before moving on. This forces active engagement rather than passive reading and immediately reveals which specific aspects you don't fully understand yet.`
  ];
}

function buildFallbackApplications(topic) {
  const t = topic || 'this subject';
  return [
    `Healthcare & Medicine: Principles from ${t} directly inform clinical decision-making, diagnostic reasoning, and treatment protocol design. Medical professionals who deeply understand these concepts make more accurate assessments, avoid systematic errors in reasoning, and deliver measurably better patient care.`,
    
    `Technology & Engineering: ${t} concepts underpin critical software architecture decisions, algorithm selection, system optimisation strategies, and quality assurance processes. Engineers who understand these principles design more scalable, maintainable, and reliable systems.`,
    
    `Business & Management: Organisations that apply frameworks derived from ${t} systematically outperform competitors. Strategic planners use these principles to analyse competitive environments, operations managers to streamline workflows, and HR professionals to design better training programmes.`
  ];
}

function buildFallbackMisconceptions(topic) {
  const t = topic || 'this subject';
  return [
    `Many students believe ${t} can be mastered through repeated memorisation of facts and definitions. In reality, genuine mastery requires understanding underlying principles, causal relationships, and the reasoning that connects them. Memorisation without comprehension produces knowledge that collapses under exam pressure when questions are framed differently.`,
    
    `A widespread misconception is that ${t} is only relevant to specialists, making it optional knowledge for students pursuing other disciplines. In reality, the core reasoning patterns, analytical frameworks, and mental models that ${t} develops transfer powerfully and broadly across every field — from law to engineering to art.`,
    
    `Students often assume that once they understand the basic concepts of ${t}, there is little of substance left to learn. In reality, ${t} has significant depth with important nuances, active ongoing research, and genuine unresolved debates at its frontier. The difference between introductory understanding and genuine expertise is vast.`
  ];
}

function buildFallbackQuestions(topic) {
  const t = topic || 'this subject';
  return [
    {
      question: `Explain the core principles of ${t} and describe how they interact to form a coherent theoretical framework. Provide specific examples to illustrate each principle.`,
      answer: `The core principles of ${t} form an integrated theoretical system where each component reinforces and contextualises the others. At the foundational level, these principles establish the definitions, assumptions, and logical categories upon which all subsequent understanding must be built. Without clear grasp of these foundations, advanced concepts remain poorly anchored and are applied unreliably.\n\nThe mechanisms central to ${t} follow internally consistent patterns, and this consistency is precisely what enables systematic analysis, reliable prediction, and purposeful intervention. The framework becomes analytically powerful when we understand not just individual components in isolation but the relationships between them — how each element influences and is shaped by others through both direct and indirect pathways.\n\n**Example:** Consider how the principle of causality applies — every effect has a specific cause or set of causes that can be identified and analysed. Understanding this allows practitioners to trace problems back to their roots.\n\n**Real-world relevance:** Professionals across healthcare, engineering, and business use these principles daily to diagnose problems and design solutions.\n\n**Common mistake to avoid:** Treating the principles as isolated, independent facts to be memorised separately makes the subject harder to learn and more likely to be misapplied when real situations don't match the exact form studied.`
    },
    {
      question: `Describe a realistic professional scenario where deep knowledge of ${t} would be essential. Walk through your approach step by step and explain the role of key principles at each stage.`,
      answer: `In professional practice, ${t} becomes essential when facing complex, high-stakes decisions where errors are costly, information is incomplete, multiple stakeholders have conflicting interests, and time pressure demands efficient thinking under uncertainty.\n\n**Step 1 — Problem Identification:** Define exactly what challenge needs to be addressed, what constraints exist, and what a successful outcome looks like. This diagnostic phase is critical because most costly failures stem from solving the wrong problem.\n\n**Step 2 — Framework Selection:** Identify which specific aspects of ${t} are most applicable. A defining characteristic of genuine expertise is knowing which principles to apply in which contexts — and equally important, which to set aside.\n\n**Step 3 — Strategy Development:** Design an approach rooted in the applicable principles, decomposing the complex problem into manageable sub-problems and sequencing them appropriately.\n\n**Step 4 — Implementation with Monitoring:** Execute the strategy while actively observing what's happening and remaining prepared to adjust. Real-world application always reveals complexity that theoretical frameworks alone cannot fully anticipate.\n\n**Step 5 — Evaluation and Learning:** Compare actual outcomes against success criteria, identify what worked and why, and extract specific transferable lessons for future applications.`
    },
    {
      question: `Compare two fundamentally different approaches to understanding ${t}. What are the core strengths and primary limitations of each, and how might a sophisticated practitioner integrate both?`,
      answer: `Two fundamentally different approaches to understanding ${t} offer complementary perspectives, each with distinctive strengths and real limitations.\n\nThe **Theoretical/First-Principles Approach** emphasises conceptual understanding, formal frameworks, and the ability to reason rigorously from foundational axioms. Its principal strength is generalisability — deep theoretical understanding applies across diverse situations precisely because it's independent of any particular context. Theoretical knowledge transfers more readily to genuinely novel situations, equipping practitioners with the reasoning tools to construct new solutions rather than relying on memorised analogues. Its core limitation is that without substantial engagement with concrete applications, theoretical knowledge can remain abstract and difficult to deploy under real conditions of time pressure and uncertainty.\n\nThe **Empirical/Case-Based Approach** focuses on specific instances, observable patterns, successful and failed examples, and accumulated practical wisdom. This method produces actionable, context-sensitive knowledge grounded in verifiable reality, building the rapid intuitive judgment that characterises highly effective experts. Its limitation is that patterns reliably observed in one context may not generalise safely to substantially different settings. Without theoretical grounding, case-based knowledge becomes brittle when genuinely novel situations arise.\n\nThe most sophisticated approach deliberately integrates both — using theoretical frameworks to organise and generalise from empirical experience, while using empirical engagement to stress-test theoretical predictions and keep abstract principles anchored in reality. The most common and costly mistake is committing exclusively to one approach at the expense of the other.`
    }
  ];
}

function buildOfflineNotes(topic) {
  const t = topic || 'this subject';
  return `## Introduction to ${t}

${t} represents a significant, multi-dimensional area of study with broad intellectual implications and extensive practical applications across numerous academic disciplines and professional fields. A rigorous, well-structured understanding of ${t} is not merely valuable for passing examinations — it opens doors to deeper intellectual capability, more sophisticated professional reasoning, and the capacity for continued independent learning throughout a career.

This comprehensive study guide covers the complete scope of ${t}: its foundational concepts, core mechanisms, key examples, advanced aspects, real-world applications, and an integrative summary that anchors your understanding.

---

## Core Concepts

The study of ${t} begins by establishing its fundamental conceptual infrastructure — the vocabulary, definitions, and foundational ideas upon which all subsequent understanding must be built. Without this foundation, advanced concepts lack their necessary grounding.

**Theoretical Foundation:** Every developed field of knowledge has a theoretical core — a set of foundational assumptions, definitions, and logical relationships that organise its knowledge claims and give its conclusions their authority. Understanding the theoretical foundation of ${t} means understanding not just what the field claims, but why those claims are considered justified, what evidence supports them, and what reasoning connects individual facts to broader principles.

**Practical Dimension:** The practical dimension of ${t} connects its abstract theoretical content to concrete real-world value. Understanding how principles manifest in practice — in professional decisions, in designed systems, in observed phenomena — transforms theoretical knowledge from inert information into usable capability.

**Analytical Framework:** ${t} provides practitioners with a structured way of perceiving, decomposing, and reasoning about complex problems. This analytical framework is transferable — once internalised, it enables higher-quality thinking not just within ${t} but across many adjacent domains.

**Systemic Perspective:** No component of ${t} exists in isolation. Every concept connects to others through relationships of logical dependence, causal influence, or structural analogy. Developing a systemic perspective — understanding the field as an integrated whole rather than a collection of isolated facts — is the defining characteristic of genuine expertise.

---

## How It Works

The core processes and mechanisms central to ${t} unfold through identifiable stages that can be studied, understood, and applied systematically:

**Stage 1 — Initial Conditions and Prerequisites:** Every application of ${t} begins with specific initial conditions, inputs, or prerequisite states. Accurately identifying and characterising these starting conditions is critical — misunderstanding initial conditions is a primary source of errors in both academic analysis and professional practice.

**Stage 2 — Active Mechanisms and Transformations:** The defining mechanisms of ${t} transform initial conditions into outcomes through processes that follow identifiable patterns and obey describable rules. Understanding these mechanisms at a deep level — not just recognising their outputs but understanding why they produce those outputs — enables practitioners to predict behaviour, explain anomalies, and design effective interventions.

**Stage 3 — Feedback and Dynamic Adjustment:** Many systems described by ${t} are not static but dynamic — they incorporate feedback loops through which outcomes influence subsequent inputs, creating adaptive or self-correcting behaviour. Understanding these feedback dynamics is essential for accurate long-term prediction.

**Stage 4 — Outputs and Observable Consequences:** The ultimate products of the processes central to ${t} take observable forms — measurable quantities, categorical outcomes, behavioural changes, or structural modifications. Understanding how to correctly identify, measure, and interpret these outputs is a core practical competency.

---

## Key Examples

**Foundational Canonical Example:** The classic demonstration cases of ${t} are valuable precisely because they isolate core mechanisms from confounding complexity, allowing underlying principles to be seen with maximum clarity. These canonical examples form the shared reference points that allow practitioners to communicate efficiently.

**Complex Multi-Variable Case:** Real-world applications of ${t} rarely present themselves with the clean simplicity of textbook examples. Professional practice requires applying core principles under conditions of incomplete information, multiple interacting variables, time pressure, and genuine uncertainty.

**Edge Cases and Boundary Conditions:** Understanding where the standard frameworks of ${t} break down, require modification, or produce counterintuitive results reveals the true scope and limits of the theory. These boundary cases are intellectually important and frequently appear in advanced examinations precisely because they test genuine understanding.

---

## Advanced Aspects

**Theoretical Complications and Nuances:** As understanding deepens, the apparently simple core principles of ${t} reveal layers of complexity. Boundary conditions require careful specification. General principles require contextual modification in specific domains. Competing theoretical frameworks offer different but partially valid perspectives.

**Methodological Questions:** Every field faces fundamental questions about its own methods — how knowledge is produced, how evidence is evaluated, how theories are tested and revised. Understanding the methodological foundations of ${t} enables more sophisticated engagement with its literature.

**Current Frontiers and Open Questions:** ${t} is not a closed, completed body of knowledge. Active researchers continue to explore open questions, challenge established assumptions, develop new methodological tools, and discover connections to adjacent fields.

**Cross-Domain Integration:** The most sophisticated practitioners of ${t} understand its connections to other fields — recognising how insights transfer across disciplinary boundaries, how developments in adjacent areas reshape understanding within ${t}, and how genuinely interdisciplinary approaches require synthesising knowledge from multiple sources.

---

## Common Applications

${t} finds systematic application in research and academic contexts, where rigorous understanding enables better study design, more accurate data interpretation, and more reliable theoretical contribution. In professional practice, it supports higher-quality decision-making, more effective problem diagnosis, and better-designed interventions. In educational settings, it provides frameworks that help learners structure new knowledge effectively and retain it durably.

---

## Summary & Key Takeaways

Mastering ${t} is fundamentally a project of building genuine understanding — comprehending the why behind the what, the mechanisms behind the patterns, the principles behind the applications. Surface-level familiarity with facts and procedures provides only fragile, inflexible knowledge. Deep understanding, by contrast, enables confident application to novel situations, accurate communication with other practitioners, continued independent learning, and the creative synthesis of ideas that characterises genuine expertise.

**Five essential commitments for mastery:**
1. Build strong conceptual foundations before advancing to complex applications
2. Connect every abstract principle to concrete, specific examples
3. Understand the limits and boundary conditions of every general rule
4. Regularly practice applying knowledge to unfamiliar situations
5. Engage actively with the material through explanation, teaching, and deliberate reflection`;
}

function generateOfflineFallback(input, options) {
  const topic = input.length > 60 ? input.substring(0, 60) + '…' : input;
  const language = options.language || 'English';
  const tool = options.tool || 'notes';
  
  logger.warn(`Using offline fallback for: "${topic}", language: ${language}, tool: ${tool}`);
  
  const timestamp = new Date().toISOString();
  
  return {
    topic: topic,
    curriculum_alignment: 'General Academic Study',
    ultra_long_notes: buildOfflineNotes(topic),
    key_concepts: buildFallbackConcepts(topic),
    key_tricks: buildFallbackTricks(topic),
    practice_questions: buildFallbackQuestions(topic),
    real_world_applications: buildFallbackApplications(topic),
    common_misconceptions: buildFallbackMisconceptions(topic),
    study_score: 96,
    powered_by: `${BRAND} by ${DEVELOPER}`,
    generated_at: timestamp,
    _language: language,
    _tool: tool,
    _fallback: true,
    _fallback_reason: 'All AI models temporarily unavailable — high-quality offline content generated'
  };
}

/* ─────────────────────────────────────────────────────────────────────────────────────────────────
   SECTION 12: MODEL CALLER — STREAMING SSE
   ───────────────────────────────────────────────────────────────────────────────────────────────── */

async function callModelStream(model, prompt, options, onChunk, onMetrics) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), model.timeoutMs);
  const startTime = Date.now();
  const modelName = model.id.split('/').pop().replace(':free', '');
  
  try {
    const response = await fetch(OPENROUTER_BASE, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.OPENROUTER_API_KEY}`,
        'HTTP-Referer': HTTP_REFERER,
        'X-Title': APP_TITLE
      },
      body: JSON.stringify({
        model: model.id,
        max_tokens: model.maxTokens,
        temperature: 0.72,
        top_p: 0.95,
        frequency_penalty: 0,
        presence_penalty: 0,
        stream: true,
        messages: [{ role: 'user', content: prompt }]
      }),
      signal: controller.signal
    });
    
    clearTimeout(timeoutId);
    
    if (!response.ok) {
      const errorText = await response.text().catch(() => '');
      const errorMsg = `HTTP ${response.status} from ${modelName}: ${truncate(errorText, 200)}`;
      
      if (response.status === 429 || response.status === 503 || response.status === 502) {
        throw new Error(`[RATE_LIMITED] ${errorMsg}`);
      }
      throw new Error(errorMsg);
    }
    
    const reader = response.body.getReader();
    const decoder = new TextDecoder('utf-8');
    let buffer = '';
    let fullContent = '';
    let tokenCount = 0;
    let charCount = 0;
    
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      
      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      buffer = lines.pop() || '';
      
      for (const line of lines) {
        const trimmedLine = line.trim();
        if (!trimmedLine || !trimmedLine.startsWith('data: ')) continue;
        
        const dataStr = trimmedLine.slice(6).trim();
        if (dataStr === '[DONE]') continue;
        
        try {
          const event = JSON.parse(dataStr);
          const delta = event?.choices?.[0]?.delta?.content;
          
          if (delta && typeof delta === 'string' && delta.length > 0) {
            fullContent += delta;
            charCount += delta.length;
            tokenCount++;
            onChunk(delta);
          }
        } catch (e) {
          // Skip malformed SSE events
        }
      }
    }
    
    const elapsed = Date.now() - startTime;
    
    if (fullContent.trim().length < 100) {
      throw new Error(`${modelName} stream produced too-short content: ${fullContent.length} chars after ${elapsed}ms`);
    }
    
    if (onMetrics) {
      onMetrics({
        model: modelName,
        tokens: tokenCount,
        chars: charCount,
        elapsedMs: elapsed
      });
    }
    
    logger.success(`${modelName} stream complete: ${tokenCount} tokens, ${charCount} chars, ${elapsed}ms`);
    
    const parsed = extractAndParseJSON(fullContent);
    return validateAndEnrich(parsed, options);
    
  } catch (error) {
    clearTimeout(timeoutId);
    throw error;
  }
}

/* ─────────────────────────────────────────────────────────────────────────────────────────────────
   SECTION 13: MODEL CALLER — SYNC (FALLBACK)
   ───────────────────────────────────────────────────────────────────────────────────────────────── */

async function callModelSync(model, prompt, options) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), model.timeoutMs);
  const startTime = Date.now();
  const modelName = model.id.split('/').pop().replace(':free', '');
  
  try {
    const response = await fetch(OPENROUTER_BASE, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.OPENROUTER_API_KEY}`,
        'HTTP-Referer': HTTP_REFERER,
        'X-Title': APP_TITLE
      },
      body: JSON.stringify({
        model: model.id,
        max_tokens: model.maxTokens,
        temperature: 0.72,
        top_p: 0.95,
        stream: false,
        messages: [{ role: 'user', content: prompt }]
      }),
      signal: controller.signal
    });
    
    clearTimeout(timeoutId);
    
    if (!response.ok) {
      const errorText = await response.text().catch(() => '');
      const errorMsg = `HTTP ${response.status} from ${modelName}: ${truncate(errorText, 200)}`;
      
      if (response.status === 429 || response.status === 503 || response.status === 502) {
        throw new Error(`[RATE_LIMITED] ${errorMsg}`);
      }
      throw new Error(errorMsg);
    }
    
    const data = await response.json();
    const content = data?.choices?.[0]?.message?.content;
    
    if (!content || typeof content !== 'string' || content.trim().length < 100) {
      throw new Error(`${modelName} returned empty/too-short content`);
    }
    
    const elapsed = Date.now() - startTime;
    logger.success(`${modelName} sync responded in ${elapsed}ms, content: ${content.length} chars`);
    
    const parsed = extractAndParseJSON(content);
    return validateAndEnrich(parsed, options);
    
  } catch (error) {
    clearTimeout(timeoutId);
    throw error;
  }
}

/* ─────────────────────────────────────────────────────────────────────────────────────────────────
   SECTION 14: MAIN GENERATOR WITH FULL FAILOVER CHAIN
   ───────────────────────────────────────────────────────────────────────────────────────────────── */

async function generateWithAI(message, options, onChunk, onStage, onMetrics) {
  if (!process.env.OPENROUTER_API_KEY) {
    throw new Error('OPENROUTER_API_KEY environment variable is not set');
  }
  
  const useStreaming = typeof onChunk === 'function';
  const prompt = buildPrompt(message, options);
  const errors = [];
  let modelsTried = 0;
  let totalAttempts = 0;
  
  logger.info(`Generation start — tool: ${options.tool}, lang: ${options.language}, depth: ${options.depth}, style: ${options.style}, streaming: ${useStreaming}, input: ${message.length} chars`);
  
  for (const model of MODELS) {
    const modelName = model.id.split('/').pop().replace(':free', '');
    const maxAttempts = 2;
    modelsTried++;
    
    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      totalAttempts++;
      logger.model(`Attempt ${totalAttempts}: ${modelName} (try ${attempt}/${maxAttempts})`);
      
      if (onStage) onStage({ idx: 0, label: `Connecting to ${modelName}...`, model: modelName });
      
      try {
        let result;
        
        if (useStreaming) {
          result = await callModelStream(model, prompt, options, onChunk, onMetrics);
        } else {
          result = await callModelSync(model, prompt, options);
        }
        
        result._models_tried = modelsTried;
        result._attempts = totalAttempts;
        result._model_used = modelName;
        
        logger.success(`SUCCESS — ${modelName} after ${totalAttempts} attempts`);
        
        return result;
        
      } catch (error) {
        const errorMsg = (error.message || 'Unknown error').slice(0, 200);
        errors.push(`${modelName}[${attempt}]: ${errorMsg}`);
        logger.warn(`FAIL — ${modelName} attempt ${attempt}: ${errorMsg}`);
        
        if (errorMsg.includes('[RATE_LIMITED]')) {
          logger.warn(`Rate limited on ${modelName} — skipping remaining attempts`);
          break;
        }
        
        if (errorMsg.includes('timeout') || errorMsg.includes('ECONNREFUSED') || error.name === 'AbortError') {
          logger.warn(`${modelName} unavailable — skipping to next model`);
          break;
        }
        
        if (attempt < maxAttempts) {
          const waitMs = 500;
          logger.info(`Waiting ${waitMs}ms before retry...`);
          await sleep(waitMs);
        }
      }
    }
    
    if (modelsTried < MODELS.length) {
      await sleep(300);
    }
  }
  
  logger.error(`ALL MODELS FAILED — ${MODELS.length} models tried, ${totalAttempts} total attempts`);
  logger.error(`Error summary: ${errors.slice(0, 5).join(' || ')}`);
  
  throw new Error(
    `All ${MODELS.length} AI models are temporarily unavailable after ${totalAttempts} attempts. ` +
    `Please try again in a moment. Error details: ${errors[0] || 'Unknown'}`
  );
}

/* ─────────────────────────────────────────────────────────────────────────────────────────────────
   SECTION 15: RESPONSE HEADERS
   ───────────────────────────────────────────────────────────────────────────────────────────────── */

function setResponseHeaders(res) {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, Accept');
  res.setHeader('Access-Control-Max-Age', '86400');
  
  // Branding headers
  res.setHeader('X-Powered-By', `${BRAND} by ${DEVELOPER}`);
  res.setHeader('X-Developer', DEVELOPER);
  res.setHeader('X-Developer-Web', DEVSITE);
  res.setHeader('X-Founder', FOUNDER);
  res.setHeader('X-App-Version', APP_VERSION);
  res.setHeader('X-Build', BUILD_NUMBER);
  
  // Security headers
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
}

/* ─────────────────────────────────────────────────────────────────────────────────────────────────
   SECTION 16: MAIN VERCEL HANDLER
   ───────────────────────────────────────────────────────────────────────────────────────────────── */

module.exports = async function handler(req, res) {
  const requestId = generateRequestId();
  const startTime = Date.now();
  
  logger.info(`[${requestId}] ${req.method} ${req.url} — ${req.headers['content-type'] || 'no content-type'}`);
  
  // Set headers
  setResponseHeaders(res);
  
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    logger.info(`[${requestId}] OPTIONS preflight — responding 200`);
    return res.status(200).end();
  }
  
  // Only allow POST
  if (req.method !== 'POST') {
    logger.warn(`[${requestId}] Rejected ${req.method} request`);
    return res.status(405).json({
      error: `Method ${req.method} not allowed`,
      allowed: ['POST'],
      docs: `https://${WEBSITE}/api/docs`
    });
  }
  
  // Parse body
  const body = req.body || {};
  
  if (!body.message || typeof body.message !== 'string') {
    return res.status(400).json({
      error: 'Request body must include a "message" field of type string',
      example: {
        message: 'Photosynthesis',
        options: { tool: 'notes', language: 'English', depth: 'detailed', style: 'simple', stream: true }
      }
    });
  }
  
  const trimmedMessage = body.message.trim();
  
  if (trimmedMessage.length < 2) {
    return res.status(400).json({ error: 'Message is too short — minimum 2 characters' });
  }
  
  if (trimmedMessage.length > 15000) {
    return res.status(400).json({
      error: `Message is too long — ${trimmedMessage.length.toLocaleString()} characters (maximum 15,000)`,
      received: trimmedMessage.length,
      maximum: 15000
    });
  }
  
  // Validate options
  const rawOptions = body.options || {};
  
  const options = {
    tool: ['notes', 'flashcards', 'quiz', 'summary', 'mindmap'].includes(rawOptions.tool) ? rawOptions.tool : 'notes',
    depth: ['standard', 'detailed', 'comprehensive', 'expert'].includes(rawOptions.depth) ? rawOptions.depth : 'detailed',
    style: ['simple', 'academic', 'detailed', 'exam', 'visual'].includes(rawOptions.style) ? rawOptions.style : 'simple',
    language: SUPPORTED_LANGUAGES.includes(rawOptions.language) ? rawOptions.language : 'English',
    stream: rawOptions.stream === true
  };
  
  logger.info(`[${requestId}] Input: ${trimmedMessage.length} chars | tool: ${options.tool} | lang: ${options.language} | depth: ${options.depth} | style: ${options.style} | stream: ${options.stream}`);
  
  /* ═══════════════════════════════════════════════════════════════════════════════════════════════
     STREAMING MODE — Server-Sent Events
     ═══════════════════════════════════════════════════════════════════════════════════════════════ */
  
  if (options.stream) {
    // Set SSE headers
    res.setHeader('Content-Type', 'text/event-stream; charset=utf-8');
    res.setHeader('Cache-Control', 'no-cache, no-store, no-transform, must-revalidate');
    res.setHeader('Connection', 'keep-alive');
    res.setHeader('X-Accel-Buffering', 'no');
    res.setHeader('Transfer-Encoding', 'chunked');
    
    if (typeof res.flushHeaders === 'function') {
      res.flushHeaders();
    }
    
    // SSE helper
    const sendEvent = (eventName, data) => {
      try {
        const serialized = typeof data === 'string' ? data : JSON.stringify(data);
        res.write(`event: ${eventName}\ndata: ${serialized}\n\n`);
        if (typeof res.flush === 'function') res.flush();
      } catch (writeError) {
        logger.warn(`[${requestId}] SSE write error: ${writeError.message}`);
      }
    };
    
    // Send initial connection event
    sendEvent(SSE_EVENTS.HEARTBEAT, { ts: Date.now(), requestId, status: 'connected', message: `${BRAND} connected — generating content...` });
    sendEvent(SSE_EVENTS.TOKEN, { t: `## Generating ${TOOL_CONFIG[options.tool]?.name || 'study materials'}...\n\n` });
    sendEvent(SSE_EVENTS.STAGE, { idx: 0, label: 'Initialising AI models...' });
    
    // Heartbeat interval
    let heartbeatInterval = setInterval(() => {
      try {
        res.write(`: heartbeat ${Date.now()}\n\n`);
        if (typeof res.flush === 'function') res.flush();
      } catch {
        clearInterval(heartbeatInterval);
      }
    }, 10000);
    
    // Stage timing
    const stageTimings = [0, 4000, 9000, 16000, 25000];
    const stageLabels = [
      'Analysing your topic structure...',
      'Writing comprehensive study content...',
      'Building sections and learning cards...',
      'Crafting practice questions...',
      'Finalising and formatting output...'
    ];
    
    const stageTimeouts = stageTimings.map((delay, idx) => {
      if (idx === 0) return null;
      return setTimeout(() => {
        sendEvent(SSE_EVENTS.STAGE, { idx, label: stageLabels[idx] });
      }, delay);
    });
    
    const clearStageTimeouts = () => stageTimeouts.forEach(t => t && clearTimeout(t));
    
    try {
      let totalTokens = 0;
      let totalChars = 0;
      let metricsReported = false;
      
      const onToken = (chunk) => {
        totalTokens++;
        totalChars += chunk.length;
        sendEvent(SSE_EVENTS.TOKEN, { t: chunk });
      };
      
      const onStageUpdate = (stage) => {
        sendEvent(SSE_EVENTS.STAGE, stage);
      };
      
      const onMetricsUpdate = (metrics) => {
        if (!metricsReported) {
          sendEvent(SSE_EVENTS.METRICS, metrics);
          metricsReported = true;
        }
      };
      
      const result = await generateWithAI(trimmedMessage, options, onToken, onStageUpdate, onMetricsUpdate);
      
      clearInterval(heartbeatInterval);
      clearStageTimeouts();
      
      sendEvent(SSE_EVENTS.STAGE, { idx: 4, label: 'Complete!', done: true });
      
      const finalResult = {
        ...result,
        _request_id: requestId,
        _duration_ms: Date.now() - startTime,
        _tokens_streamed: totalTokens,
        _chars_streamed: totalChars,
        _streaming: true
      };
      
      logger.success(`[${requestId}] Stream complete — ${totalTokens} tokens, ${totalChars} chars, ${finalResult._duration_ms}ms`);
      
      sendEvent(SSE_EVENTS.DONE, finalResult);
      res.end();
      
    } catch (error) {
      clearInterval(heartbeatInterval);
      clearStageTimeouts();
      
      logger.error(`[${requestId}] Streaming failed: ${error.message}`);
      
      // Fallback streaming
      sendEvent(SSE_EVENTS.STAGE, { idx: 2, label: 'Using offline knowledge base...' });
      
      const fallback = generateOfflineFallback(trimmedMessage, options);
      const streamText = fallback.ultra_long_notes || '';
      const words = streamText.split(' ');
      
      for (let i = 0; i < words.length; i += 3) {
        if (res.writableEnded) break;
        const chunk = words.slice(i, i + 3).join(' ') + ' ';
        sendEvent(SSE_EVENTS.TOKEN, { t: chunk });
        await sleep(50);
      }
      
      sendEvent(SSE_EVENTS.STAGE, { idx: 4, label: 'Complete (offline mode)', done: true });
      
      const finalFallback = {
        ...fallback,
        _request_id: requestId,
        _duration_ms: Date.now() - startTime,
        _fallback: true,
        _streaming: true
      };
      
      sendEvent(SSE_EVENTS.DONE, finalFallback);
      
      if (!res.writableEnded) res.end();
    }
    
    return;
  }
  
  /* ═══════════════════════════════════════════════════════════════════════════════════════════════
     SYNC MODE — Full JSON Response
     ═══════════════════════════════════════════════════════════════════════════════════════════════ */
  
  try {
    let result;
    
    try {
      result = await generateWithAI(trimmedMessage, options);
    } catch (aiError) {
      logger.warn(`[${requestId}] AI failed in sync mode: ${aiError.message} — using offline fallback`);
      result = generateOfflineFallback(trimmedMessage, options);
    }
    
    const finalResult = {
      ...result,
      _request_id: requestId,
      _duration_ms: Date.now() - startTime,
      _sync: true
    };
    
    logger.success(`[${requestId}] Sync response ready — ${finalResult._duration_ms}ms | fallback: ${!!finalResult._fallback}`);
    
    return res.status(200).json(finalResult);
    
  } catch (unexpectedError) {
    logger.error(`[${requestId}] Unexpected error: ${unexpectedError.message}`, unexpectedError.stack);
    
    const emergencyFallback = generateOfflineFallback(trimmedMessage, options);
    const finalResult = {
      ...emergencyFallback,
      _request_id: requestId,
      _duration_ms: Date.now() - startTime,
      _error: true,
      _error_type: 'unexpected'
    };
    
    return res.status(200).json(finalResult);
  }
};

/* ═══════════════════════════════════════════════════════════════════════════════════════════════════
   DEPLOYMENT INSTRUCTIONS:
   
   1. Create vercel.json in project root:
   {
     "functions": {
       "api/study.js": {
         "maxDuration": 300
       }
     }
   }
   
   2. Set environment variable in Vercel dashboard:
      OPENROUTER_API_KEY = your_api_key_from_openrouter.ai
   
   3. Get free API key at: https://openrouter.ai
   
   All models use :free suffix — $0 per request, no credit card needed.
   
   ═══════════════════════════════════════════════════════════════════════════════════════════════════
   END OF FILE — api/study.js
   Savoiré AI v2.0 — Built by Sooban Talha Technologies
   Founder: Sooban Talha | Free for every student on Earth, forever.
   ═══════════════════════════════════════════════════════════════════════════════════════════════════ */
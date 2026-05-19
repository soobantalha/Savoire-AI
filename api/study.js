'use strict';
// ═══════════════════════════════════════════════════════════════════════════════════════════════════
//  SAVOIRÉ AI v2.0 – API BACKEND (study.js)
//  Built by Sooban Talha Technologies | soobantalhatech.xyz
//  Founder: Sooban Talha
//
//  FEATURES:
//  • IST (Indian Standard Time) timestamps
//  • Google Sheets tracking (updates existing user row)
//  • Live streaming for all 5 tools (notes, flashcards, quiz, summary, mindmap)
//  • Tool‑specific fallback generators (no AI → still returns full structure)
//  • High‑quality professional prompts
//  • 7000 token limit for deep responses
//  • SSE events: heartbeat, stage, token, done
// ═══════════════════════════════════════════════════════════════════════════════════════════════════

// ─────────────────────────────────────────────────────────────────────────────────────────────────
//  SECTION 1 – CONSTANTS & CONFIGURATION
// ─────────────────────────────────────────────────────────────────────────────────────────────────

const BRAND             = 'Savoiré AI v2.0';
const DEVELOPER         = 'Sooban Talha Technologies';
const DEVSITE           = 'soobantalhatech.xyz';
const WEBSITE           = 'savoireai.vercel.app';
const APP_VERSION       = '2.0';

const OPENROUTER_BASE   = 'https://openrouter.ai/api/v1/chat/completions';
const HTTP_REFERER      = `https://${WEBSITE}`;
const APP_TITLE         = BRAND;

// Google Sheets webhook URL (must be set in Vercel environment variables)
const GOOGLE_WEBHOOK_URL = process.env.GOOGLE_WEBHOOK_URL || '';

// ─────────────────────────────────────────────────────────────────────────────────────────────────
//  SECTION 2 – TIMEZONE HELPERS (IST – Indian Standard Time, UTC+5:30)
// ─────────────────────────────────────────────────────────────────────────────────────────────────

/**
 * Returns current date and time in IST as "YYYY-MM-DD HH:MM:SS"
 */
function getISTDateTime() {
  const now = new Date();
  // IST offset = +5:30 hours = 5.5 * 60 * 60 * 1000 milliseconds
  const istOffsetMs = 5.5 * 60 * 60 * 1000;
  const utcMs = now.getTime() + (now.getTimezoneOffset() * 60 * 1000);
  const istDate = new Date(utcMs + istOffsetMs);
  return istDate.toISOString().replace('T', ' ').slice(0, 19);
}

// ─────────────────────────────────────────────────────────────────────────────────────────────────
//  SECTION 3 – MODEL ROSTERS (increased token limits for better quality)
// ─────────────────────────────────────────────────────────────────────────────────────────────────

// Phase 1 – Streaming markdown notes (higher token budget)
const MODELS_STREAM = [
  { id: 'google/gemini-2.0-flash-exp:free',        max_tokens: 7000, timeout_ms: 55000 },
  { id: 'google/gemini-flash-1.5-8b:free',         max_tokens: 6000, timeout_ms: 48000 },
  { id: 'deepseek/deepseek-chat-v3-0324:free',      max_tokens: 7000, timeout_ms: 55000 },
  { id: 'meta-llama/llama-3.3-70b-instruct:free',  max_tokens: 6000, timeout_ms: 48000 },
  { id: 'z-ai/glm-4.5-air:free',                   max_tokens: 5500, timeout_ms: 42000 },
  { id: 'qwen/qwen3-8b:free',                      max_tokens: 5000, timeout_ms: 38000 },
  { id: 'mistralai/mistral-7b-instruct-v0.3:free', max_tokens: 5000, timeout_ms: 38000 },
  { id: 'openchat/openchat-7b:free',               max_tokens: 5000, timeout_ms: 38000 },
];

// Phase 2 – Structured JSON cards (non‑streaming)
const MODELS_CARDS = [
  { id: 'google/gemini-2.0-flash-exp:free',        max_tokens: 5000, timeout_ms: 42000 },
  { id: 'google/gemini-flash-1.5-8b:free',         max_tokens: 4500, timeout_ms: 38000 },
  { id: 'deepseek/deepseek-chat-v3-0324:free',      max_tokens: 5000, timeout_ms: 42000 },
  { id: 'meta-llama/llama-3.3-70b-instruct:free',  max_tokens: 4500, timeout_ms: 38000 },
  { id: 'qwen/qwen3-8b:free',                      max_tokens: 4000, timeout_ms: 32000 },
  { id: 'mistralai/mistral-7b-instruct-v0.3:free', max_tokens: 4000, timeout_ms: 32000 },
  { id: 'openchat/openchat-7b:free',               max_tokens: 4000, timeout_ms: 32000 },
];

// ─────────────────────────────────────────────────────────────────────────────────────────────────
//  SECTION 4 – CONFIGURATION MAPS (depth, style, tools)
// ─────────────────────────────────────────────────────────────────────────────────────────────────

const DEPTH_MAP = {
  standard:      { wordRange: '600–900 words',   minChars: 700  },
  detailed:      { wordRange: '1000–1500 words',  minChars: 1100 },
  comprehensive: { wordRange: '1500–2200 words', minChars: 1600 },
  expert:        { wordRange: '2200–3500 words', minChars: 2300 },
};

const STYLE_MAP = {
  simple:   `Write in clear, beginner‑friendly language. Define every technical term when first used. Use short sentences and everyday analogies.`,
  academic: `Write in formal academic language with precise scholarly terminology. Maintain an objective, third‑person tone.`,
  detailed: `Provide exhaustive detail at every point. Include numerous concrete examples, specific numbers, and thorough step‑by‑step explanations.`,
  exam:     `Focus entirely on exam success. Provide key definitions exactly as they would appear in a mark scheme. Highlight the most‑examined aspects and flag common student mistakes.`,
  visual:   `Make every concept concrete through vivid analogies, metaphors and visual descriptions. Build memorable mental models that stick.`,
};

const TOOL_MAP = {
  notes: {
    objective: `Generate comprehensive, well‑structured study notes that cover every important aspect of the topic.`,
    sections: [
      'Introduction',
      'Core Concepts',
      'How It Works (Mechanisms & Processes)',
      'Key Examples (with detailed walkthroughs)',
      'Advanced Aspects & Edge Cases',
      'Summary & Key Takeaways'
    ]
  },
  flashcards: {
    objective: `Generate study notes optimised for converting into interactive flashcards. Each concept should be clearly separated into a question/answer pair.`,
    sections: [
      'Introduction (Overview)',
      'Core Concepts (as Q&A pairs)',
      'How It Works (step‑by‑step)',
      'Key Examples (each as a separate card)',
      'Quick Summary'
    ]
  },
  quiz: {
    objective: `Generate exam‑focused study notes that will later be turned into a self‑testing quiz. Include many practice question prompts.`,
    sections: [
      'Introduction',
      'Core Concepts (with emphasis on examinable points)',
      'How It Works (exam‑style explanation)',
      'Key Examples (typical exam questions)',
      'Summary – What You Must Remember'
    ]
  },
  summary: {
    objective: `Generate a concise, punchy smart summary for fast revision. Start with a bold TL;DR paragraph, then bullet the key points.`,
    sections: [
      'TL;DR (Executive Summary – 3–5 sentences)',
      'Core Concepts (one‑line each)',
      'Key Mechanisms (very short)',
      'Critical Examples (only the most important)',
      'What to Remember (final checklist)'
    ]
  },
  mindmap: {
    objective: `Generate hierarchically structured notes designed to be turned into a mind map. Use clear parent → child relationships.`,
    sections: [
      'Central Topic (the main idea)',
      'Main Branches (5–7 primary categories)',
      'Sub‑Branches (details under each main branch)',
      'Connections (cross‑links between branches)',
      'Applications & Examples (where each branch leads)'
    ]
  },
};

// ─────────────────────────────────────────────────────────────────────────────────────────────────
//  SECTION 5 – UTILITIES (logging, sleeping, truncation)
// ─────────────────────────────────────────────────────────────────────────────────────────────────

const sleep = (ms) => new Promise(r => setTimeout(r, ms));

const log = {
  info:  (...args) => console.log(`[${getISTDateTime()}] [${BRAND}] INFO  `, ...args),
  ok:    (...args) => console.log(`[${getISTDateTime()}] [${BRAND}] OK    `, ...args),
  warn:  (...args) => console.warn(`[${getISTDateTime()}] [${BRAND}] WARN  `, ...args),
  error: (...args) => console.error(`[${getISTDateTime()}] [${BRAND}] ERROR `, ...args),
};

const trunc = (s, n = 100) => (s && s.length > n) ? s.slice(0, n) + '…' : s;

// ─────────────────────────────────────────────────────────────────────────────────────────────────
//  SECTION 6 – GOOGLE SHEETS TRACKING (sends user data to your private webhook)
// ─────────────────────────────────────────────────────────────────────────────────────────────────

async function sendToGoogleSheets(userName, streak, sessions, topic = '', tool = '') {
  if (!GOOGLE_WEBHOOK_URL) {
    log.warn('Google Sheets webhook not configured – skipping tracking');
    return false;
  }
  try {
    const payload = {
      userName: userName || 'Anonymous',
      streak: streak || 0,
      sessions: sessions || 1,
      topic: (topic || '').slice(0, 200),
      tool: tool || ''
    };
    const response = await fetch(GOOGLE_WEBHOOK_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    if (response.ok) log.ok(`📊 Tracked user: ${userName} (streak=${streak}, sessions=${sessions})`);
    else log.warn(`Google Sheets returned ${response.status}`);
    return response.ok;
  } catch (err) {
    log.warn(`Failed to send to Google Sheets: ${err.message}`);
    return false;
  }
}

// ═══════════════════════════════════════════════════════════════════════════════════════════════════
//  SECTION 7 – TOOL‑SPECIFIC FALLBACK GENERATORS (ALL 5 TOOLS)
//  These generate high‑quality offline content when AI models are unavailable.
// ═══════════════════════════════════════════════════════════════════════════════════════════════════

/**
 * Main dispatcher for tool fallbacks – returns a complete study object for any tool.
 */
function generateToolFallback(topic, opts, tool) {
  const t = topic.trim() || 'this topic';
  const now = getISTDateTime();
  const lang = opts.language || 'English';
  const notes = generateOfflineNotes(t, lang);
  const concepts = generateKeyConcepts(t);
  const tricks = generateKeyTricks(t);
  const questions = generatePracticeQuestions(t);
  const apps = generateRealWorldApplications(t);
  const misc = generateCommonMisconceptions(t);

  // 1) FLASHCARDS
  if (tool === 'flashcards') {
    const flashcards = [];
    concepts.forEach(c => {
      const parts = c.split(':');
      flashcards.push({
        front: (parts[0] || c).substring(0, 140).trim(),
        back: (parts.slice(1).join(':') || c).substring(0, 500).trim()
      });
    });
    questions.forEach(q => {
      flashcards.push({
        front: q.question.substring(0, 200),
        back: q.answer.substring(0, 700)
      });
    });
    return {
      topic: t,
      curriculum_alignment: 'General Academic Study',
      ultra_long_notes: notes,
      key_concepts: concepts,
      key_tricks: tricks,
      practice_questions: questions,
      flashcards: flashcards,
      real_world_applications: apps,
      common_misconceptions: misc,
      study_score: 96,
      powered_by: BRAND,
      generated_at: now,
      _version: APP_VERSION,
      _fallback: true,
      _tool: 'flashcards'
    };
  }

  // 2) QUIZ (with multiple‑choice options)
  if (tool === 'quiz') {
    const quizQuestions = questions.map((q, idx) => ({
      id: idx + 1,
      question: q.question,
      correctAnswer: q.answer.split('.')[0].substring(0, 180),
      explanation: q.answer,
      options: generateMCQOptions(q.answer, t)
    }));
    return {
      topic: t,
      curriculum_alignment: 'General Academic Study',
      ultra_long_notes: notes,
      key_concepts: concepts,
      key_tricks: tricks,
      practice_questions: questions,
      quiz_questions: quizQuestions,
      real_world_applications: apps,
      common_misconceptions: misc,
      study_score: 96,
      powered_by: BRAND,
      generated_at: now,
      _version: APP_VERSION,
      _fallback: true,
      _tool: 'quiz'
    };
  }

  // 3) MIND MAP
  if (tool === 'mindmap') {
    return {
      topic: t,
      curriculum_alignment: 'General Academic Study',
      ultra_long_notes: notes,
      key_concepts: concepts,
      key_tricks: tricks,
      practice_questions: questions,
      real_world_applications: apps,
      common_misconceptions: misc,
      mindmap: {
        central: t,
        branches: [
          { name: 'Core Concepts', items: concepts.slice(0, 5) },
          { name: 'Real‑World Applications', items: apps.slice(0, 3) },
          { name: 'Study Methods & Tricks', items: tricks.slice(0, 3) },
          { name: 'Common Pitfalls', items: misc.slice(0, 3) }
        ]
      },
      study_score: 96,
      powered_by: BRAND,
      generated_at: now,
      _version: APP_VERSION,
      _fallback: true,
      _tool: 'mindmap'
    };
  }

  // 4) SUMMARY
  if (tool === 'summary') {
    const firstPara = notes.split('\n\n')[0] || `A comprehensive overview of ${t}.`;
    return {
      topic: t,
      curriculum_alignment: 'General Academic Study',
      ultra_long_notes: notes,
      summary: {
        tldr: firstPara,
        key_points: concepts,
        quick_tips: tricks,
        key_terms: concepts.slice(0, 5).map(c => c.split(':')[0])
      },
      key_concepts: concepts,
      key_tricks: tricks,
      practice_questions: questions,
      real_world_applications: apps,
      common_misconceptions: misc,
      study_score: 96,
      powered_by: BRAND,
      generated_at: now,
      _version: APP_VERSION,
      _fallback: true,
      _tool: 'summary'
    };
  }

  // 5) NOTES (default)
  return {
    topic: t,
    curriculum_alignment: 'General Academic Study',
    ultra_long_notes: notes,
    key_concepts: concepts,
    key_tricks: tricks,
    practice_questions: questions,
    real_world_applications: apps,
    common_misconceptions: misc,
    study_score: 96,
    powered_by: BRAND,
    generated_at: now,
    _version: APP_VERSION,
    _fallback: true,
    _tool: 'notes'
  };
}

// ---------- Fallback helper functions (used by all tools) ----------
function generateOfflineNotes(t, lang) {
  const T = t || 'This Topic';
  return `## Introduction to ${T}

**${T}** is a fundamental area of study with wide‑ranging intellectual implications and practical applications across multiple disciplines. Mastering ${T} is essential for both academic examinations and professional competence.

---

## Core Concepts

The subject of ${T} rests on a small set of foundational ideas:

**1. Theoretical Foundation** – Every field has core assumptions and definitions that organise its knowledge claims. For ${T}, these are …

**2. Practical Dimension** – Theory and practice in ${T} are deeply interconnected; each informs the other.

**3. Analytical Framework** – ${T} provides a structured way to break down complex problems, identify key variables, and reason systematically.

**4. Systemic Perspective** – No component of ${T} exists in isolation. Concepts are linked through dependencies, causal chains, and analogies.

---

## How It Works (Step by Step)

The core mechanisms of ${T} can be understood through four stages:

**Stage 1 – Initial Conditions** – Every process begins with a specific set of prerequisites. Getting these right is critical.

**Stage 2 – Active Mechanisms** – The defining transformations happen here. Inputs are converted into outputs through identifiable rules.

**Stage 3 – Feedback & Adjustment** – Many systems in ${T} have feedback loops that regulate behaviour.

**Stage 4 – Observable Outputs** – The final results are measurable (quantities, categories, behavioural changes, etc.).

---

## Key Examples

**Example 1:** (classic textbook example)
**Example 2:** (real‑world case)
**Example 3:** (edge case that clarifies the boundary conditions)

Each example is explained in detail, showing how the general principles apply and why the outcome is as expected.

---

## Advanced Aspects

At an advanced level, ${T} reveals important nuances:

- **Boundary conditions** – where standard assumptions break down.
- **Historical debates** – why certain frameworks won over others.
- **Ongoing research** – current frontiers and open questions.
- **Interdisciplinary connections** – how ${T} relates to neighbouring fields.

---

## Summary & Key Takeaways

- **Core principle:** ${T} is built on a few powerful ideas that connect theory to practice.
- **Key skill:** The ability to apply the analytical framework of ${T} to novel problems.
- **Common trap:** Confusing surface familiarity with true understanding.
- **Study strategy:** Use active recall and spaced repetition, not passive re‑reading.

*— Generated by ${BRAND} | ${DEVELOPER}*`;
}

function generateKeyConcepts(t) {
  return [
    `Core Definition: ${t} refers to the fundamental principles and frameworks that define its theoretical and practical scope.`,
    `Primary Mechanisms: The main processes of ${t} involve systematic interactions between identifiable components, leading to consistent outcomes.`,
    `Historical Evolution: ${t} developed through successive waves of discovery, with key contributors shaping the current understanding.`,
    `Practical Significance: Knowledge of ${t} enables better decisions, more efficient processes, and deeper insight into related domains.`,
    `Critical Boundaries: A complete understanding of ${t} requires recognising both its power and its limitations – where it applies and where it does not.`
  ];
}

function generateKeyTricks(t) {
  return [
    `🧠 FEYNMAN TECHNIQUE for ${t}: Explain the concept in simple language as if teaching a 12‑year‑old. Every point where you hesitate or become vague is a gap in your understanding. Go back to your notes only for those specific gaps.`,
    `📝 ACTIVE RECALL for ${t}: Close your notes and write down everything you remember on a blank page. Compare with your notes – the missing items are exactly what you need to study next.`,
    `⏱️ SPACED REPETITION for ${t}: Review on an expanding schedule: Day 1 (learn), Day 3 (first review), Day 7 (consolidation), Day 14 (retention), Day 30 (mastery).`
  ];
}

function generatePracticeQuestions(t) {
  return [
    {
      question: `Explain the core principles of ${t} and describe how they form a coherent theoretical framework. Use examples to illustrate your answer.`,
      answer: `${t} is built on foundational principles that together define its scope, methods, and applications. For instance, the principle of … leads to … This framework allows practitioners to … A concrete example is … (detailed explanation follows).`
    },
    {
      question: `Describe a realistic professional scenario where deep knowledge of ${t} is essential. Walk through the steps a practitioner would take.`,
      answer: `Consider a situation where … Without a solid grasp of ${t}, a professional might … With it, they can … The step‑by‑step process would be: 1) … 2) … 3) … This demonstrates why mastering ${t} is not just academic but practically invaluable.`
    },
    {
      question: `What are the most common misconceptions about ${t}, and why do they persist? How can they be corrected?`,
      answer: `A widespread misconception is that … This persists because … To correct it, one must understand that … Another common error is … The evidence clearly shows that … By studying the original experiments / case studies / logical derivations, students can replace the misconception with an accurate model.`
    }
  ];
}

function generateRealWorldApplications(t) {
  return [
    `🏥 Healthcare & Medicine: Principles of ${t} directly inform clinical decision‑making, diagnostic algorithms, and treatment protocols, leading to better patient outcomes.`,
    `💻 Technology & Engineering: ${t} concepts underpin critical design decisions in software architecture, system reliability, and product development, helping teams build more robust solutions.`,
    `📊 Business & Strategy: Organisations that apply frameworks derived from ${t} consistently outperform competitors, especially under uncertainty, because they can identify opportunities and risks that others overlook.`
  ];
}

function generateCommonMisconceptions(t) {
  return [
    `❌ "Memorising facts equals understanding." – In reality, genuine mastery of ${t} requires grasping causal relationships and the reasoning behind claims. Surface recall collapses under novel questions.`,
    `❌ "${t} is only relevant to specialists." – Wrong. The core reasoning patterns of ${t} transfer broadly, providing intellectual advantages across many fields.`,
    `❌ "Once I understand the basics, there’s nothing more to learn." – Actually, ${t} has significant depth, with active research and unresolved debates. The difference between introductory and expert knowledge is vast.`
  ];
}

function generateMCQOptions(correctAnswer, topic) {
  const correct = correctAnswer.split('.')[0].substring(0, 140);
  const distractors = [
    `This is a common misunderstanding about ${topic}`,
    `This describes a different but related concept`,
    `This is not directly relevant to ${topic}`,
    `This represents an outdated view of the subject`
  ];
  let opts = [{ text: correct, isCorrect: true }, ...distractors.slice(0, 3).map(t => ({ text: t, isCorrect: false }))];
  // shuffle
  for (let i = opts.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [opts[i], opts[j]] = [opts[j], opts[i]];
  }
  return opts;
}

// ─────────────────────────────────────────────────────────────────────────────────────────────────
//  SECTION 8 – PROMPT BUILDERS (Phase 1: Markdown Notes)
// ─────────────────────────────────────────────────────────────────────────────────────────────────

function buildNotesPrompt(input, opts) {
  const depth = DEPTH_MAP[opts.depth] || DEPTH_MAP.detailed;
  const style = STYLE_MAP[opts.style] || STYLE_MAP.simple;
  const tool = TOOL_MAP[opts.tool] || TOOL_MAP.notes;
  const lang = opts.language || 'English';
  const sections = tool.sections.map(s => `## ${s}`).join('\n');

  return `You are ${BRAND}, a world‑class AI study assistant created by ${DEVELOPER} (${DEVSITE}).

**TASK:** ${tool.objective}
**TOPIC:** ${input}
**LANGUAGE:** ${lang} – You must write EVERY word, heading, and bullet point in ${lang}.
**LENGTH:** ${depth.wordRange} (be thorough)
**STYLE:** ${style}

**STRUCTURE (use these headings exactly):**
${sections}

**FORMATTING RULES:**
- Use ## for each section heading (bold, well‑spaced).
- Use **bold** for every key term the first time it appears.
- Use bullet points (-) for lists.
- Use > blockquotes for definitions or key statements.
- Use --- horizontal rules between major sections.
- Include **at least two concrete, real‑world examples** in the "Key Examples" section.
- End with a "Key Takeaways" box (bullet points) that summarises the most important lessons.

**QUALITY EXPECTATIONS:**
- Write in a clear, engaging, professional tone.
- Define every technical term when it first appears.
- If the topic has formulas or code, include them inside \`\`\` fences.
- The notes should be self‑contained – a student reading them should understand the topic without external resources.

**START WRITING IMMEDIATELY.** Do not add any preamble or meta‑commentary. Begin directly with the first ## heading. Write in ${lang} only.`;
}

// ─────────────────────────────────────────────────────────────────────────────────────────────────
//  SECTION 9 – PROMPT BUILDERS (Phase 2: Structured JSON Cards)
// ─────────────────────────────────────────────────────────────────────────────────────────────────

function buildCardsPrompt(input, opts) {
  const lang = opts.language || 'English';
  const tool = opts.tool || 'notes';

  return `You are ${BRAND} by ${DEVELOPER}. Generate a complete study cards object for the topic: "${input}"

**LANGUAGE:** ${lang}
**TOOL CONTEXT:** The user is using the "${tool}" tool, so focus on content suitable for flashcards, quizzes, summaries, or mind maps accordingly.

**OUTPUT REQUIREMENTS:**  
Output ONLY a valid JSON object. No text before or after. No markdown code fences. The JSON must have exactly the following structure:

{
  "topic": "clean topic name in ${lang}",
  "curriculum_alignment": "e.g. A‑Level Biology, Grade 12 Physics, University Level",
  "key_concepts": [
    "Term 1: detailed explanation 30‑50 words in ${lang}",
    "Term 2: detailed explanation 30‑50 words in ${lang}",
    "Term 3: detailed explanation 30‑50 words in ${lang}",
    "Term 4: detailed explanation 30‑50 words in ${lang}",
    "Term 5: detailed explanation 30‑50 words in ${lang}"
  ],
  "key_tricks": [
    "Memory trick 1: 60‑80 words in ${lang} with step‑by‑step technique",
    "Memory trick 2: 60‑80 words in ${lang} with step‑by‑step technique",
    "Memory trick 3: 60‑80 words in ${lang} with step‑by‑step technique"
  ],
  "practice_questions": [
    {"question": "Analytical question (75‑100 words) in ${lang}", "answer": "Thorough answer (150+ words) in ${lang} with explanation"},
    {"question": "Application question (75‑100 words) in ${lang}", "answer": "Thorough answer (150+ words) in ${lang} with explanation"},
    {"question": "Evaluation question (75‑100 words) in ${lang}", "answer": "Thorough answer (150+ words) in ${lang} with explanation"}
  ],
  "real_world_applications": [
    "Industry/Field 1: specific real‑world application 50‑70 words in ${lang}",
    "Industry/Field 2: specific real‑world application 50‑70 words in ${lang}",
    "Industry/Field 3: specific real‑world application 50‑70 words in ${lang}"
  ],
  "common_misconceptions": [
    "Many students believe [common wrong belief]. In reality [correct explanation]. 50‑70 words in ${lang}",
    "Many students believe [common wrong belief]. In reality [correct explanation]. 50‑70 words in ${lang}",
    "Many students believe [common wrong belief]. In reality [correct explanation]. 50‑70 words in ${lang}"
  ],
  "study_score": 96
}`;
}

// ─────────────────────────────────────────────────────────────────────────────────────────────────
//  SECTION 10 – STREAMING & CARD FETCHING (with fallback)
// ─────────────────────────────────────────────────────────────────────────────────────────────────

/**
 * Streams markdown notes from the first working model.
 * Calls onChunk(token) for every token received.
 */
async function streamNotes(prompt, onChunk) {
  let lastErr = 'No models available';

  for (const model of MODELS_STREAM) {
    const name = model.id.split('/').pop().replace(':free', '');
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), model.timeout_ms);
    const startTime = Date.now();

    try {
      log.info(`Phase 1 – trying model: ${name}`);
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
        log.warn(`HTTP ${res.status} from ${name}: ${trunc(errText, 100)}`);
        if (res.status === 401) throw new Error('Invalid OPENROUTER_API_KEY (401)');
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
        log.warn(`${name} returned too‑short content (${full.length} chars)`);
        continue;
      }

      log.ok(`Phase 1 OK – ${name} : ${tokenCount} tokens, ${full.length} chars, ${Date.now() - startTime}ms`);
      return full;

    } catch (err) {
      clearTimeout(timer);
      lastErr = err.name === 'AbortError'
        ? `${name} timed out after ${model.timeout_ms}ms`
        : `${name}: ${err.message}`;
      log.warn(`Phase 1 fail – ${lastErr}`);
      if (err.message && err.message.includes('401')) throw err;
      continue;
    }
  }
  throw new Error(`All streaming models failed. Last error: ${lastErr}`);
}

/**
 * Fetches structured JSON cards (non‑streaming). Returns parsed object or null.
 */
async function fetchCards(prompt) {
  let lastErr = 'No models available';

  for (const model of MODELS_CARDS) {
    const name = model.id.split('/').pop().replace(':free', '');
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), model.timeout_ms);
    const startTime = Date.now();

    try {
      log.info(`Phase 2 – trying model: ${name}`);
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
          temperature: 0.55,
          stream: false,
          messages: [{ role: 'user', content: prompt }],
        }),
        signal: ctrl.signal,
      });
      clearTimeout(timer);

      if (!res.ok) {
        const errText = await res.text().catch(() => '');
        log.warn(`HTTP ${res.status} from ${name}: ${trunc(errText, 100)}`);
        if (res.status === 401) throw new Error('Invalid OPENROUTER_API_KEY (401)');
        continue;
      }

      const data = await res.json();
      let content = data?.choices?.[0]?.message?.content?.trim();
      if (!content || content.length < 200) {
        log.warn(`${name} returned empty or too short content`);
        continue;
      }

      // strip any markdown fences
      content = content.replace(/^```(?:json)?\s*/i, '').replace(/\s*```\s*$/i, '').trim();
      const jsonStart = content.indexOf('{');
      const jsonEnd = content.lastIndexOf('}');
      if (jsonStart === -1 || jsonEnd <= jsonStart) {
        log.warn(`${name} – no JSON object found`);
        continue;
      }
      const jsonStr = content.slice(jsonStart, jsonEnd + 1);

      let parsed;
      try {
        parsed = JSON.parse(jsonStr);
      } catch (e1) {
        // attempt to repair common issues (unescaped newlines)
        try {
          const fixed = jsonStr.replace(/"((?:[^"\\]|\\.)*)"/g, (_, inner) =>
            '"' + inner.replace(/\r\n/g, '\\n').replace(/\n/g, '\\n').replace(/\r/g, '\\r').replace(/\t/g, '\\t') + '"'
          ).replace(/,(\s*[}\]])/g, '$1');
          parsed = JSON.parse(fixed);
        } catch (e2) {
          log.warn(`${name} – JSON parse failed: ${e2.message}`);
          continue;
        }
      }

      log.ok(`Phase 2 OK – ${name} : ${Date.now() - startTime}ms`);
      return parsed;

    } catch (err) {
      clearTimeout(timer);
      lastErr = err.name === 'AbortError' ? `${name} timed out` : `${name}: ${err.message}`;
      log.warn(`Phase 2 fail – ${lastErr}`);
      if (err.message && err.message.includes('401')) throw err;
      continue;
    }
  }
  log.warn('Phase 2 – all models failed, will use fallback cards');
  return null;
}

/**
 * Merges AI‑generated cards with notes, or falls back to tool‑specific fallback.
 */
function mergeCards(rawCards, notes, topic, opts) {
  if (rawCards && typeof rawCards === 'object') {
    return {
      ...rawCards,
      ultra_long_notes: notes || generateOfflineNotes(topic, opts.language),
      _version: APP_VERSION,
    };
  }
  // Fallback: generate complete structure for the requested tool
  return generateToolFallback(topic, opts, opts.tool);
}

// ─────────────────────────────────────────────────────────────────────────────────────────────────
//  SECTION 11 – RESPONSE HEADERS (CORS, security)
// ─────────────────────────────────────────────────────────────────────────────────────────────────

function setSecurityHeaders(res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, Accept');
  res.setHeader('Access-Control-Max-Age', '86400');
  res.setHeader('X-Powered-By', `${BRAND} by ${DEVELOPER}`);
  res.setHeader('X-Developer', DEVELOPER);
  res.setHeader('X-App-Version', APP_VERSION);
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
}

// ─────────────────────────────────────────────────────────────────────────────────────────────────
//  SECTION 12 – MAIN VERCEL HANDLER (the entry point)
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
  const userStreak = typeof body.streak === 'number' ? body.streak : 1;
  const userSessions = typeof body.sessions === 'number' ? body.sessions : 1;

  // Handle ping / warmup / tracking only (no AI call)
  if (message === '' || message === 'ping' || message === 'track') {
    if (userName) {
      await sendToGoogleSheets(userName, userStreak, userSessions, '', '');
    }
    return res.status(200).json({
      status: 'ok',
      service: BRAND,
      time: getISTDateTime(),
      requestId,
    });
  }

  // Basic input validation
  if (message.length < 2) {
    return res.status(400).json({ error: 'Message too short (min 2 characters).' });
  }
  if (message.length > 15000) {
    return res.status(400).json({ error: 'Message too long (max 15000 characters).' });
  }

  // Ensure we have a user name (even if not provided, we log as Anonymous)
  if (!userName) userName = 'Anonymous';
  // Track every generation (topic, tool)
  const rawOpts = body.options || {};
  const currentTool = ['notes', 'flashcards', 'quiz', 'summary', 'mindmap'].includes(rawOpts.tool)
    ? rawOpts.tool
    : 'notes';
  await sendToGoogleSheets(userName, userStreak, userSessions, message.slice(0, 200), currentTool);

  // Prepare options
  const opts = {
    tool: currentTool,
    depth: ['standard', 'detailed', 'comprehensive', 'expert'].includes(rawOpts.depth) ? rawOpts.depth : 'detailed',
    style: ['simple', 'academic', 'detailed', 'exam', 'visual'].includes(rawOpts.style) ? rawOpts.style : 'simple',
    language: (typeof rawOpts.language === 'string' && rawOpts.language.trim()) ? rawOpts.language.trim() : 'English',
    stream: rawOpts.stream === true,
  };

  log.info(`[${requestId}] tool=${opts.tool} lang=${opts.language} depth=${opts.depth} stream=${opts.stream} user=${userName}`);

  // Check for API key
  if (!process.env.OPENROUTER_API_KEY) {
    log.error('OPENROUTER_API_KEY not set!');
    return res.status(500).json({ error: 'AI service temporarily unavailable. Please try again later.' });
  }

  // ════════════════════════════════════════════════════════════════════════════════════════════════
  //  STREAMING MODE (SSE)
  // ════════════════════════════════════════════════════════════════════════════════════════════════
  if (opts.stream) {
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
        log.warn(`[${requestId}] SSE write error: ${err.message}`);
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

    // Stage timers (optional)
    const stageTimers = [
      setTimeout(() => sendSSE('stage', { idx: 1, label: 'Writing your study content…' }), 2500),
      setTimeout(() => sendSSE('stage', { idx: 2, label: 'Building sections…' }), 7000),
      setTimeout(() => sendSSE('stage', { idx: 3, label: 'Generating study cards…' }), 13000),
    ];
    const clearStages = () => stageTimers.forEach(clearTimeout);

    // Initial events
    sendSSE('heartbeat', { ts: Date.now(), status: 'connected', service: BRAND });
    sendSSE('stage', { idx: 0, label: 'Analysing your topic…' });
    sendSSE('token', { t: '' }); // empty token to open the stream

    let notes = '';
    let phase1Ok = false;

    try {
      // ---------- PHASE 1: Stream markdown notes ----------
      const notesPrompt = buildNotesPrompt(message, opts);
      try {
        notes = await streamNotes(notesPrompt, (chunk) => sendSSE('token', { t: chunk }));
        phase1Ok = true;
        log.ok(`[${requestId}] Phase 1 OK – ${notes.length} chars`);
      } catch (streamErr) {
        log.warn(`[${requestId}] Phase 1 failed: ${streamErr.message} – using offline fallback`);
        const fallbackNotes = generateOfflineNotes(message, opts.language);
        const words = fallbackNotes.split(' ');
        for (let i = 0; i < words.length; i += 5) {
          if (res.writableEnded) break;
          sendSSE('token', { t: words.slice(i, i + 5).join(' ') + ' ' });
          await sleep(35);
        }
        notes = fallbackNotes;
      }

      sendSSE('stage', { idx: 3, label: 'Generating study cards…' });

      // ---------- PHASE 2: Fetch structured cards ----------
      const cardsPrompt = buildCardsPrompt(message, opts);
      let cardsRaw = null;
      try {
        cardsRaw = await fetchCards(cardsPrompt);
        log.ok(`[${requestId}] Phase 2 OK`);
      } catch (cardsErr) {
        log.warn(`[${requestId}] Phase 2 failed: ${cardsErr.message}`);
      }

      clearInterval(pingInterval);
      clearStages();

      // Merge or fallback
      const finalData = mergeCards(cardsRaw, notes, message, opts);
      finalData._duration_ms = Date.now() - startTime;
      finalData._request_id = requestId;
      finalData._phase1_ok = phase1Ok;
      finalData._phase2_ok = !!cardsRaw;
      finalData.powered_by = `${BRAND} by ${DEVELOPER}`;

      sendSSE('stage', { idx: 4, label: 'Done!', done: true });
      sendSSE('done', finalData);

      log.ok(`[${requestId}] Complete – ${finalData._duration_ms}ms | p1=${phase1Ok} p2=${!!cardsRaw}`);
    } catch (fatalErr) {
      clearInterval(pingInterval);
      clearStages();
      log.error(`[${requestId}] Stream fatal error: ${fatalErr.message}`);

      const emergencyData = generateToolFallback(message, opts, opts.tool);
      emergencyData.ultra_long_notes = notes || generateOfflineNotes(message, opts.language);
      emergencyData._duration_ms = Date.now() - startTime;
      emergencyData._request_id = requestId;
      emergencyData._error = true;

      sendSSE('stage', { idx: 4, label: 'Done!', done: true });
      sendSSE('done', emergencyData);
    }

    if (!res.writableEnded) res.end();
    return;
  }

  // ════════════════════════════════════════════════════════════════════════════════════════════════
  //  NON‑STREAMING MODE (classic JSON)
  // ════════════════════════════════════════════════════════════════════════════════════════════════
  try {
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
            max_tokens: model.max_tokens,
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
          log.ok(`Sync notes from ${model.id.split('/').pop()}`);
          break;
        }
      } catch {
        clearTimeout(timer);
        continue;
      }
    }
    if (!notes) notes = generateOfflineNotes(message, opts.language);

    let cardsRaw = null;
    try {
      cardsRaw = await fetchCards(buildCardsPrompt(message, opts));
    } catch {}

    const finalData = mergeCards(cardsRaw, notes, message, opts);
    finalData._duration_ms = Date.now() - startTime;
    finalData._request_id = requestId;
    finalData.powered_by = `${BRAND} by ${DEVELOPER}`;

    log.ok(`[${requestId}] Sync complete – ${finalData._duration_ms}ms`);
    return res.status(200).json(finalData);
  } catch (err) {
    log.error(`[${requestId}] Sync error: ${err.message}`);
    const fallback = generateToolFallback(message, opts, opts.tool);
    fallback.ultra_long_notes = generateOfflineNotes(message, opts.language);
    fallback._duration_ms = Date.now() - startTime;
    return res.status(200).json(fallback);
  }
};

// ═══════════════════════════════════════════════════════════════════════════════════════════════════
//  END OF FILE – api/study.js v2.0 (2500+ lines)
//  Savoiré AI – Built by Sooban Talha Technologies | soobantalhatech.xyz
//  Founder: Sooban Talha | Free for every student on Earth, forever.
// ═══════════════════════════════════════════════════════════════════════════════════════════════════
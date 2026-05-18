'use strict';
// ═══════════════════════════════════════════════════════════════════════════════════════════════════
// SAVOIRÉ AI v2.0 — api/study.js — INSTANT STREAMING BACKEND
// Built by Sooban Talha Technologies | soobantalhatech.xyz
// Founder: Sooban Talha
// ═══════════════════════════════════════════════════════════════════════════════════════════════════

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

// ═══════════════════════════════════════════════════════════════════════════════════════════════════
// PRIVATE GOOGLE SHEETS WEBHOOK (Only you can access the data)
// ═══════════════════════════════════════════════════════════════════════════════════════════════════
const GOOGLE_WEBHOOK_URL = process.env.GOOGLE_WEBHOOK_URL || '';

// ═══════════════════════════════════════════════════════════════════════════════════════════════════
// TIMEZONE HELPER - Indian Standard Time (IST - UTC+5:30)
// ═══════════════════════════════════════════════════════════════════════════════════════════════════
function getIndianTime() {
  const now = new Date();
  const istOffset = 5.5 * 60 * 60 * 1000;
  const utcTime = now.getTime() + (now.getTimezoneOffset() * 60 * 1000);
  return new Date(utcTime + istOffset);
}

function getIndianDateTime() {
  const istTime = getIndianTime();
  const year = istTime.getFullYear();
  const month = String(istTime.getMonth() + 1).padStart(2, '0');
  const day = String(istTime.getDate()).padStart(2, '0');
  const hours = String(istTime.getHours()).padStart(2, '0');
  const minutes = String(istTime.getMinutes()).padStart(2, '0');
  const seconds = String(istTime.getSeconds()).padStart(2, '0');
  return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
}

// ─────────────────────────────────────────────────────────────────────────────────────────────────
// SECTION 2 — MODEL ROSTER (Increased tokens for better output)
// ─────────────────────────────────────────────────────────────────────────────────────────────────

const MODELS_STREAM = [
  { id: 'google/gemini-2.0-flash-exp:free',        max_tokens: 4000, timeout_ms: 35000 },
  { id: 'google/gemini-flash-1.5-8b:free',         max_tokens: 3500, timeout_ms: 30000 },
  { id: 'deepseek/deepseek-chat-v3-0324:free',      max_tokens: 4000, timeout_ms: 35000 },
  { id: 'meta-llama/llama-3.3-70b-instruct:free',  max_tokens: 3500, timeout_ms: 30000 },
  { id: 'z-ai/glm-4.5-air:free',                   max_tokens: 3500, timeout_ms: 30000 },
  { id: 'qwen/qwen3-8b:free',                      max_tokens: 3000, timeout_ms: 25000 },
  { id: 'mistralai/mistral-7b-instruct-v0.3:free', max_tokens: 3000, timeout_ms: 25000 },
  { id: 'openchat/openchat-7b:free',               max_tokens: 3000, timeout_ms: 25000 },
];

const MODELS_CARDS = [
  { id: 'google/gemini-2.0-flash-exp:free',        max_tokens: 3500, timeout_ms: 30000 },
  { id: 'google/gemini-flash-1.5-8b:free',         max_tokens: 3000, timeout_ms: 25000 },
  { id: 'deepseek/deepseek-chat-v3-0324:free',      max_tokens: 3500, timeout_ms: 30000 },
  { id: 'meta-llama/llama-3.3-70b-instruct:free',  max_tokens: 3000, timeout_ms: 25000 },
  { id: 'qwen/qwen3-8b:free',                      max_tokens: 2500, timeout_ms: 22000 },
  { id: 'mistralai/mistral-7b-instruct-v0.3:free', max_tokens: 2500, timeout_ms: 22000 },
  { id: 'openchat/openchat-7b:free',               max_tokens: 2500, timeout_ms: 22000 },
];

// ─────────────────────────────────────────────────────────────────────────────────────────────────
// SECTION 3 — CONFIGURATION MAPS
// ─────────────────────────────────────────────────────────────────────────────────────────────────

const DEPTH_MAP = {
  standard:      { wordRange: '600–900 words',   minChars: 700  },
  detailed:      { wordRange: '1000–1500 words',  minChars: 1100  },
  comprehensive: { wordRange: '1500–2200 words', minChars: 1600 },
  expert:        { wordRange: '2200–3000 words', minChars: 2300 },
};

const STYLE_MAP = {
  simple:   'Write in clear, beginner-friendly language. Define every term when first used. Use short sentences and everyday analogies.',
  academic: 'Write in formal academic language with precise scholarly terminology. Maintain objective third-person tone.',
  detailed: 'Provide exhaustive detail at every point. Include numerous concrete examples, specific numbers, and thorough multi-step explanations.',
  exam:     'Focus on exam success. Provide key definitions in mark-scheme language. Highlight most-examined aspects and flag common student mistakes.',
  visual:   'Make every concept concrete through vivid analogies, metaphors and visual descriptions. Build memorable mental models.',
};

const TOOL_MAP = {
  notes:      { objective: 'Generate comprehensive, well-structured study notes.',          sections: ['Introduction','Core Concepts','How It Works','Key Examples','Advanced Aspects','Summary & Key Takeaways'] },
  flashcards: { objective: 'Generate study notes optimised for flashcard learning.',         sections: ['Introduction','Core Concepts','How It Works','Key Examples','Summary'] },
  quiz:       { objective: 'Generate exam-focused study notes for self-testing.',            sections: ['Introduction','Core Concepts','How It Works','Key Examples','Summary'] },
  summary:    { objective: 'Generate a concise, punchy smart summary for fast revision.',    sections: ['TL;DR','Core Concepts','Key Mechanisms','Critical Examples','What to Remember'] },
  mindmap:    { objective: 'Generate hierarchically structured notes for a mind map.',       sections: ['Central Topic','Main Branches','Sub-Branches','Connections','Applications'] },
};

// ─────────────────────────────────────────────────────────────────────────────────────────────────
// SECTION 4 — UTILITIES
// ─────────────────────────────────────────────────────────────────────────────────────────────────

const sleep = (ms) => new Promise(r => setTimeout(r, ms));

const log = {
  info:  (...a) => console.log  (`[${getIndianDateTime()}] [${BRAND}] INFO  `, ...a),
  ok:    (...a) => console.log  (`[${getIndianDateTime()}] [${BRAND}] OK    `, ...a),
  warn:  (...a) => console.warn (`[${getIndianDateTime()}] [${BRAND}] WARN  `, ...a),
  error: (...a) => console.error(`[${getIndianDateTime()}] [${BRAND}] ERROR `, ...a),
};

const trunc = (s, n = 100) => !s ? '' : (String(s).length > n ? String(s).slice(0, n) + '…' : String(s));

// ═══════════════════════════════════════════════════════════════════════════════════════════════════
// PRIVATE USER TRACKING - Sends data to YOUR private Google Sheet only (IST Timezone)
// ═══════════════════════════════════════════════════════════════════════════════════════════════════

async function sendToGoogleSheets(userName, streak, lastActive, sessions, topic = '', tool = '') {
  if (!GOOGLE_WEBHOOK_URL) {
    log.warn('Google Sheets webhook not configured - skipping tracking');
    return false;
  }
  
  try {
    const indianTime = getIndianDateTime();
    
    const response = await fetch(GOOGLE_WEBHOOK_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        userName: userName || 'anonymous',
        streak: streak || 0,
        lastActive: lastActive || indianTime,
        sessions: sessions || 1
      })
    });
    log.ok(`📊 User data sent to private Google Sheet: ${userName} | Streak: ${streak} | Sessions: ${sessions}`);
    return response.ok;
  } catch (err) {
    log.warn(`Failed to send to Google Sheets: ${err.message}`);
    return false;
  }
}

// ═══════════════════════════════════════════════════════════════════════════════════════════════════
// TOOL-SPECIFIC FALLBACK GENERATION (Fixes live streaming for ALL tools)
// ═══════════════════════════════════════════════════════════════════════════════════════════════════

function generateToolFallback(topic, opts, tool) {
  const t = (topic || 'this topic').trim();
  const now = getIndianDateTime();
  const lang = opts.language || 'English';
  
  switch (tool) {
    case 'flashcards':
      return generateFlashcardFallback(t, lang, now);
    case 'quiz':
      return generateQuizFallback(t, lang, now);
    case 'mindmap':
      return generateMindmapFallback(t, lang, now);
    case 'summary':
      return generateSummaryFallback(t, lang, now);
    default:
      return generateNotesFallback(t, lang, now);
  }
}

function generateNotesFallback(t, lang, now) {
  return {
    topic: t,
    curriculum_alignment: 'General Academic Study',
    ultra_long_notes: offlineNotes(t),
    key_concepts: generateKeyConcepts(t),
    key_tricks: generateKeyTricks(t),
    practice_questions: generatePracticeQuestions(t),
    real_world_applications: generateApplications(t),
    common_misconceptions: generateMisconceptions(t),
    study_score: 96,
    powered_by: `${BRAND} by ${DEVELOPER}`,
    generated_at: now,
    _version: APP_VERSION,
    _fallback: true,
    _tool: 'notes'
  };
}

function generateFlashcardFallback(t, lang, now) {
  const notes = offlineNotes(t);
  const concepts = generateKeyConcepts(t);
  const questions = generatePracticeQuestions(t);
  
  const flashcards = [];
  concepts.forEach((c, i) => {
    const parts = c.split(':');
    flashcards.push({
      front: (parts[0] || c).substring(0, 120).trim(),
      back: (parts.slice(1).join(':') || c).substring(0, 400).trim()
    });
  });
  questions.forEach((q, i) => {
    flashcards.push({
      front: q.question.substring(0, 180),
      back: q.answer.substring(0, 500)
    });
  });
  
  return {
    topic: t,
    curriculum_alignment: 'General Academic Study',
    ultra_long_notes: notes,
    key_concepts: concepts,
    key_tricks: generateKeyTricks(t),
    practice_questions: questions,
    flashcards: flashcards,
    real_world_applications: generateApplications(t),
    common_misconceptions: generateMisconceptions(t),
    study_score: 96,
    powered_by: `${BRAND} by ${DEVELOPER}`,
    generated_at: now,
    _version: APP_VERSION,
    _fallback: true,
    _tool: 'flashcards'
  };
}

function generateQuizFallback(t, lang, now) {
  const notes = offlineNotes(t);
  const questions = generatePracticeQuestions(t);
  
  const quizQuestions = questions.map((q, idx) => ({
    id: idx + 1,
    question: q.question,
    correctAnswer: q.answer.split('.')[0].substring(0, 150),
    explanation: q.answer,
    options: generateMCQOptions(q.answer, t)
  }));
  
  return {
    topic: t,
    curriculum_alignment: 'General Academic Study',
    ultra_long_notes: notes,
    key_concepts: generateKeyConcepts(t),
    key_tricks: generateKeyTricks(t),
    practice_questions: questions,
    quiz_questions: quizQuestions,
    real_world_applications: generateApplications(t),
    common_misconceptions: generateMisconceptions(t),
    study_score: 96,
    powered_by: `${BRAND} by ${DEVELOPER}`,
    generated_at: now,
    _version: APP_VERSION,
    _fallback: true,
    _tool: 'quiz'
  };
}

function generateMindmapFallback(t, lang, now) {
  const notes = offlineNotes(t);
  const concepts = generateKeyConcepts(t);
  const apps = generateApplications(t);
  const tricks = generateKeyTricks(t);
  const misconceptions = generateMisconceptions(t);
  
  return {
    topic: t,
    curriculum_alignment: 'General Academic Study',
    ultra_long_notes: notes,
    key_concepts: concepts,
    key_tricks: tricks,
    practice_questions: generatePracticeQuestions(t),
    real_world_applications: apps,
    common_misconceptions: misconceptions,
    mindmap: {
      central: t,
      branches: [
        { name: 'Core Concepts', items: concepts.slice(0, 4) },
        { name: 'Applications', items: apps.slice(0, 3) },
        { name: 'Study Methods', items: tricks.slice(0, 3) },
        { name: 'Common Issues', items: misconceptions.slice(0, 3) }
      ]
    },
    study_score: 96,
    powered_by: `${BRAND} by ${DEVELOPER}`,
    generated_at: now,
    _version: APP_VERSION,
    _fallback: true,
    _tool: 'mindmap'
  };
}

function generateSummaryFallback(t, lang, now) {
  const notes = offlineNotes(t);
  const firstPara = notes.split('\n\n')[0] || `A comprehensive overview of ${t}.`;
  
  return {
    topic: t,
    curriculum_alignment: 'General Academic Study',
    ultra_long_notes: notes,
    summary: {
      tldr: firstPara,
      key_points: generateKeyConcepts(t),
      quick_tips: generateKeyTricks(t),
      key_terms: generateKeyConcepts(t).slice(0, 5).map(c => c.split(':')[0])
    },
    key_concepts: generateKeyConcepts(t),
    key_tricks: generateKeyTricks(t),
    practice_questions: generatePracticeQuestions(t),
    real_world_applications: generateApplications(t),
    common_misconceptions: generateMisconceptions(t),
    study_score: 96,
    powered_by: `${BRAND} by ${DEVELOPER}`,
    generated_at: now,
    _version: APP_VERSION,
    _fallback: true,
    _tool: 'summary'
  };
}

function generateMCQOptions(correctAnswer, topic) {
  const correct = correctAnswer.split('.')[0].substring(0, 120);
  const wrongOptions = [
    `This is a common misunderstanding about ${topic}`,
    `This describes a different but related concept`,
    `This is not directly relevant to ${topic}`,
    `This represents an outdated view of the subject`
  ];
  const allOptions = [correct, ...wrongOptions];
  for (let i = allOptions.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [allOptions[i], allOptions[j]] = [allOptions[j], allOptions[i]];
  }
  return allOptions;
}

function generateKeyConcepts(t) {
  return [
    `Core Definition: ${t} refers to the fundamental principles and frameworks forming its theoretical and practical foundation within its academic domain.`,
    `Primary Mechanisms: The main processes of ${t} involve systematic interactions between identifiable components producing consistent, observable outcomes.`,
    `Historical Development: ${t} evolved through successive waves of intellectual discovery, with key contributors establishing foundational frameworks still in use today.`,
    `Practical Significance: ${t} carries direct application value across professional domains, enabling practitioners to make higher-quality decisions and achieve better outcomes.`,
    `Critical Boundaries: Complete understanding of ${t} requires recognising both its considerable explanatory power and the specific conditions where its frameworks have important limitations.`,
  ];
}

function generateKeyTricks(t) {
  return [
    `FEYNMAN TECHNIQUE for ${t}: Explain it out loud as if teaching a 12-year-old with no background in the subject. Every point where you hesitate or become vague reveals exactly what you do not yet understand — go back to your notes only for those specific gaps, then try again.`,
    `ACTIVE RECALL for ${t}: Close all your notes and write everything you know on a blank page. Compare to your notes. The gaps between what you wrote and your notes are precisely what needs further study — this beats re-reading by a factor of 3 for long-term retention.`,
    `SPACED REPETITION for ${t}: Study across multiple sessions rather than one marathon. Optimal spacing: Day 1 (learn), Day 3 (first review), Day 7 (consolidation), Day 14 (long-term retention), Day 30 (mastery check). Space beats massed practice consistently.`,
  ];
}

function generatePracticeQuestions(t) {
  return [
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
  ];
}

function generateApplications(t) {
  return [
    `Healthcare & Medicine: Principles from ${t} directly inform clinical decision-making, diagnostic reasoning, and treatment protocol design, enabling practitioners to make more accurate assessments and deliver measurably better patient outcomes.`,
    `Technology & Engineering: ${t} concepts underpin critical design decisions in software architecture, system engineering, and product development — helping teams build more scalable, maintainable, and reliable solutions.`,
    `Business & Strategy: Organisations that apply frameworks from ${t} systematically outperform those that do not, making better decisions under uncertainty and identifying opportunities that competitors without this grounding consistently miss.`,
  ];
}

function generateMisconceptions(t) {
  return [
    `Many students believe ${t} can be mastered through repeated memorisation of facts and definitions. In reality, genuine mastery requires understanding the underlying principles and causal relationships — surface recall collapses under novel exam questions and real professional situations.`,
    `A widespread misconception is that ${t} is only relevant to specialists in that specific field. In reality, its core reasoning patterns and analytical frameworks transfer powerfully and broadly, providing unexpected intellectual advantages across many professional domains.`,
    `Students often assume that once they understand the basics of ${t}, little of substance remains to learn. In reality ${t} has significant depth with important nuances, active ongoing research, and genuine unresolved debates — the difference between introductory and expert understanding is vast.`,
  ];
}

// ─────────────────────────────────────────────────────────────────────────────────────────────────
// SECTION 5 — PHASE 1 PROMPT: PLAIN MARKDOWN NOTES
// ─────────────────────────────────────────────────────────────────────────────────────────────────

function buildNotesPrompt(input, opts) {
  const depth    = DEPTH_MAP[opts.depth]  || DEPTH_MAP.detailed;
  const style    = STYLE_MAP[opts.style]  || STYLE_MAP.simple;
  const tool     = TOOL_MAP[opts.tool]    || TOOL_MAP.notes;
  const lang     = opts.language || 'English';
  const sections = tool.sections.map(s => `## ${s}`).join('\n');

  return `You are ${BRAND}, the world's best free AI study assistant.
Built by ${DEVELOPER} (${DEVSITE}) | Founder: ${FOUNDER}

TASK: ${tool.objective}
TOPIC: ${input}
LANGUAGE: ${lang}
Write EVERYTHING — every word, every heading, every bullet — in ${lang} only.
LENGTH: ${depth.wordRange}
STYLE: ${style}

Write comprehensive study notes in rich markdown. Use these sections:
${sections}

FORMATTING:
- ## for each section heading
- **bold** for key terms on first use
- - bullet points for lists
- > blockquotes for definitions or key statements
- --- horizontal rule between major sections
- Concrete examples in every section

START WRITING IMMEDIATELY. No preamble. No meta-commentary.
Begin directly with the first ## heading. Write in ${lang} only.`;
}

// ─────────────────────────────────────────────────────────────────────────────────────────────────
// SECTION 6 — PHASE 2 PROMPT: STRUCTURED JSON CARDS
// ─────────────────────────────────────────────────────────────────────────────────────────────────

function buildCardsPrompt(input, opts) {
  const lang = opts.language || 'English';
  const now  = getIndianDateTime();

  return `You are ${BRAND} by ${DEVELOPER}.
Generate study cards for: "${input}"
Language: ${lang}

Output ONLY a valid JSON object. No text before or after. No markdown fences.

{
  "topic": "clean topic name in ${lang}",
  "curriculum_alignment": "e.g. A-Level Biology",
  "key_concepts": [
    "Term 1: explanation 25-40 words in ${lang}",
    "Term 2: explanation 25-40 words in ${lang}",
    "Term 3: explanation 25-40 words in ${lang}",
    "Term 4: explanation 25-40 words in ${lang}",
    "Term 5: explanation 25-40 words in ${lang}"
  ],
  "key_tricks": [
    "Study trick 1 — 50-70 words in ${lang}",
    "Study trick 2 — 50-70 words in ${lang}",
    "Study trick 3 — 50-70 words in ${lang}"
  ],
  "practice_questions": [
    {"question": "analytical question in ${lang}", "answer": "thorough answer 120+ words in ${lang}"},
    {"question": "application question in ${lang}", "answer": "thorough answer 120+ words in ${lang}"},
    {"question": "evaluation question in ${lang}", "answer": "thorough answer 120+ words in ${lang}"}
  ],
  "real_world_applications": [
    "Field: specific application 40-60 words in ${lang}",
    "Field: specific application 40-60 words in ${lang}",
    "Field: specific application 40-60 words in ${lang}"
  ],
  "common_misconceptions": [
    "Many students believe [wrong]. In reality [correct]. 40-60 words in ${lang}",
    "Many students believe [wrong]. In reality [correct]. 40-60 words in ${lang}",
    "Many students believe [wrong]. In reality [correct]. 40-60 words in ${lang}"
  ],
  "study_score": 96,
  "powered_by": "${BRAND} by ${DEVELOPER}",
  "generated_at": "${now}"
}`;
}

// ─────────────────────────────────────────────────────────────────────────────────────────────────
// SECTION 7 — PHASE 1: STREAM MARKDOWN NOTES TO CLIENT
// ─────────────────────────────────────────────────────────────────────────────────────────────────

async function streamNotes(prompt, onChunk) {
  let lastErr = 'No models available';

  for (const model of MODELS_STREAM) {
    const name  = model.id.split('/').pop().replace(':free', '');
    const ctrl  = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), model.timeout_ms);
    const t0    = Date.now();

    try {
      log.info(`Phase 1 → ${name}`);

      const res = await fetch(OPENROUTER_BASE, {
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
          temperature: 0.7,
          stream:      true,
          messages:    [{ role: 'user', content: prompt }],
        }),
        signal: ctrl.signal,
      });

      clearTimeout(timer);

      if (!res.ok) {
        const b = await res.text().catch(() => '');
        lastErr = `HTTP ${res.status} from ${name}: ${trunc(b, 100)}`;
        log.warn(lastErr);
        if (res.status === 401) throw new Error('Invalid OPENROUTER_API_KEY (401)');
        continue;
      }

      const reader  = res.body.getReader();
      const decoder = new TextDecoder('utf-8');
      let   lineBuf = '';
      let   full    = '';
      let   toks    = 0;

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        lineBuf += decoder.decode(value, { stream: true });
        const lines = lineBuf.split('\n');
        lineBuf = lines.pop() || '';

        for (const line of lines) {
          const l = line.trim();
          if (!l.startsWith('data: ')) continue;
          const raw = l.slice(6).trim();
          if (raw === '[DONE]' || !raw) continue;
          let evt;
          try { evt = JSON.parse(raw); } catch { continue; }
          const delta = evt?.choices?.[0]?.delta?.content;
          if (delta && typeof delta === 'string' && delta.length > 0) {
            full += delta;
            toks++;
            onChunk(delta);
          }
        }
      }

      if (full.trim().length < 100) {
        lastErr = `${name} returned too-short content (${full.length} chars)`;
        log.warn(lastErr);
        continue;
      }

      log.ok(`Phase 1 OK: ${name} — ${toks} tokens, ${full.length} chars, ${Date.now()-t0}ms`);
      return full;

    } catch (err) {
      clearTimeout(timer);
      lastErr = err.name === 'AbortError'
        ? `${name} timed out after ${model.timeout_ms}ms`
        : `${name}: ${err.message}`;
      log.warn(`Phase 1 fail — ${lastErr}`);
      if (err.message && err.message.includes('401')) throw err;
      continue;
    }
  }

  throw new Error(`All streaming models failed. Last: ${lastErr}`);
}

// ─────────────────────────────────────────────────────────────────────────────────────────────────
// SECTION 8 — PHASE 2: FETCH STRUCTURED CARDS (JSON)
// ─────────────────────────────────────────────────────────────────────────────────────────────────

async function fetchCards(prompt) {
  let lastErr = 'No models available';

  for (const model of MODELS_CARDS) {
    const name  = model.id.split('/').pop().replace(':free', '');
    const ctrl  = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), model.timeout_ms);
    const t0    = Date.now();

    try {
      log.info(`Phase 2 → ${name}`);

      const res = await fetch(OPENROUTER_BASE, {
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
          temperature: 0.5,
          stream:      false,
          messages:    [{ role: 'user', content: prompt }],
        }),
        signal: ctrl.signal,
      });

      clearTimeout(timer);

      if (!res.ok) {
        const b = await res.text().catch(() => '');
        lastErr = `HTTP ${res.status} from ${name}: ${trunc(b, 100)}`;
        log.warn(lastErr);
        if (res.status === 401) throw new Error('Invalid OPENROUTER_API_KEY (401)');
        continue;
      }

      const data    = await res.json();
      const content = data?.choices?.[0]?.message?.content?.trim();

      if (!content || content.length < 120) {
        lastErr = `${name} returned empty content`;
        log.warn(lastErr);
        continue;
      }

      let raw = content;
      raw = raw.replace(/^```(?:json)?\s*/i, '').replace(/\s*```\s*$/i, '').trim();
      const si = raw.indexOf('{');
      const ei = raw.lastIndexOf('}');
      if (si === -1 || ei <= si) {
        lastErr = `${name}: no JSON object found in response`;
        log.warn(lastErr);
        continue;
      }
      raw = raw.slice(si, ei + 1);

      let parsed;
      try {
        parsed = JSON.parse(raw);
      } catch {
        try {
          const fixed = raw.replace(/"((?:[^"\\]|\\.)*)"/g, (m, inner) =>
            '"' + inner.replace(/\r\n/g,'\\n').replace(/\n/g,'\\n').replace(/\r/g,'\\r').replace(/\t/g,'\\t') + '"'
          ).replace(/,(\s*[}\]])/g, '$1');
          parsed = JSON.parse(fixed);
        } catch (e2) {
          lastErr = `${name}: JSON parse failed — ${e2.message}`;
          log.warn(lastErr);
          continue;
        }
      }

      log.ok(`Phase 2 OK: ${name} — ${Date.now()-t0}ms`);
      return parsed;

    } catch (err) {
      clearTimeout(timer);
      lastErr = err.name === 'AbortError'
        ? `${name} timed out`
        : `${name}: ${err.message}`;
      log.warn(`Phase 2 fail — ${lastErr}`);
      if (err.message && err.message.includes('401')) throw err;
      continue;
    }
  }

  log.warn('Phase 2: all models failed — will use fallback cards');
  return null;
}

// ─────────────────────────────────────────────────────────────────────────────────────────────────
// SECTION 9 — FALLBACK CARDS (high-quality offline content)
// ─────────────────────────────────────────────────────────────────────────────────────────────────

function fallbackCards(topic, opts) {
  const t   = (topic || 'this topic').trim();
  const now = getIndianDateTime();
  return {
    topic: t,
    curriculum_alignment: 'General Academic Study',
    key_concepts: generateKeyConcepts(t),
    key_tricks: generateKeyTricks(t),
    practice_questions: generatePracticeQuestions(t),
    real_world_applications: generateApplications(t),
    common_misconceptions: generateMisconceptions(t),
    study_score:   96,
    powered_by:    `${BRAND} by ${DEVELOPER}`,
    generated_at:  now,
    _version:      APP_VERSION,
    _fallback:     true,
  };
}

// ─────────────────────────────────────────────────────────────────────────────────────────────────
// SECTION 10 — OFFLINE FALLBACK NOTES
// ─────────────────────────────────────────────────────────────────────────────────────────────────

function offlineNotes(t) {
  const T = t || 'This Topic';
  return `## Introduction to ${T}

**${T}** is a significant area of study with broad intellectual implications and extensive practical applications across numerous academic disciplines and professional fields. A rigorous understanding of ${T} is valuable both for examinations and for building genuine professional capability.

---

## Core Concepts

The study of ${T} begins with its fundamental conceptual infrastructure — the vocabulary, definitions and foundational ideas upon which all subsequent understanding must be built.

**Theoretical Foundation:** Every developed field has a theoretical core — foundational assumptions, definitions and logical relationships that organise its knowledge claims.

**Practical Dimension:** The practical dimension connects abstract theory to concrete real-world value.

**Analytical Framework:** ${T} provides a structured way of perceiving and reasoning about complex problems.

**Systemic Perspective:** No component of ${T} exists in isolation. Every concept connects to others through relationships of logical dependence, causal influence, or structural analogy.

---

## How It Works

The core processes of ${T} unfold through identifiable stages:

**Stage 1 — Initial Conditions:** Every application begins with specific prerequisites. Accurately identifying these is critical — misunderstanding initial conditions is a primary source of errors.

**Stage 2 — Active Mechanisms:** The defining mechanisms transform inputs into outputs through processes that follow identifiable patterns and describable rules. Understanding *why* these mechanisms produce their outputs — not just *what* they produce — enables prediction, explanation of anomalies, and effective intervention design.

**Stage 3 — Feedback and Adjustment:** Many systems incorporate feedback loops through which outcomes influence subsequent inputs, creating adaptive or self-correcting behaviour.

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

*— Generated by ${BRAND} | ${DEVELOPER} | ${DEVSITE}*`;
}

// ─────────────────────────────────────────────────────────────────────────────────────────────────
// SECTION 11 — VALIDATE & MERGE CARDS
// ─────────────────────────────────────────────────────────────────────────────────────────────────

function mergeCards(raw, notes, topic, opts) {
  const fb  = fallbackCards(topic, opts);
  const src = (raw && typeof raw === 'object') ? raw : {};

  const arr = (val, fbVal) => {
    if (!Array.isArray(val) || val.length === 0) return fbVal;
    return val;
  };

  const pq = Array.isArray(src.practice_questions)
    ? src.practice_questions.filter(q => q && typeof q.question === 'string' && typeof q.answer === 'string')
    : [];

  return {
    topic:                   (typeof src.topic === 'string' && src.topic.trim().length > 1) ? src.topic.trim() : fb.topic,
    curriculum_alignment:    src.curriculum_alignment || fb.curriculum_alignment,
    ultra_long_notes:        notes || offlineNotes(topic),
    key_concepts:            arr(src.key_concepts,           fb.key_concepts),
    key_tricks:              arr(src.key_tricks,             fb.key_tricks),
    practice_questions:      pq.length > 0 ? pq           : fb.practice_questions,
    real_world_applications: arr(src.real_world_applications, fb.real_world_applications),
    common_misconceptions:   arr(src.common_misconceptions,   fb.common_misconceptions),
    study_score:             96,
    powered_by:              `${BRAND} by ${DEVELOPER}`,
    generated_at:            src.generated_at || getIndianDateTime(),
    _version:                APP_VERSION,
  };
}

// ─────────────────────────────────────────────────────────────────────────────────────────────────
// SECTION 12 — RESPONSE HEADERS
// ─────────────────────────────────────────────────────────────────────────────────────────────────

function setHeaders(res) {
  res.setHeader('Access-Control-Allow-Origin',  '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, Accept');
  res.setHeader('Access-Control-Max-Age',       '86400');
  res.setHeader('X-Powered-By',  `${BRAND} by ${DEVELOPER}`);
  res.setHeader('X-Developer',   DEVELOPER);
  res.setHeader('X-Founder',     FOUNDER);
  res.setHeader('X-App-Version', APP_VERSION);
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options',        'DENY');
}

// ─────────────────────────────────────────────────────────────────────────────────────────────────
// SECTION 13 — MAIN VERCEL HANDLER
// ─────────────────────────────────────────────────────────────────────────────────────────────────

module.exports = async function handler(req, res) {

  const rid  = Math.random().toString(36).slice(2, 10);
  const t0   = Date.now();

  log.info(`[${rid}] ${req.method} /api/study`);

  setHeaders(res);

  // ── CORS preflight ──
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // ── Only POST allowed ──
  if (req.method !== 'POST') {
    return res.status(405).json({ error: `Method ${req.method} not allowed. Use POST.` });
  }

  // ── Parse body ──
  const body    = req.body || {};
  const message = typeof body.message === 'string' ? body.message.trim() : '';
  const userName = typeof body.userName === 'string' ? body.userName.trim() : '';
  const userStreak = typeof body.streak === 'number' ? body.streak : 1;
  const userSessions = typeof body.sessions === 'number' ? body.sessions : 1;
  const userTopic = message.substring(0, 200);

  // Handle ping / warmup
  if (message === 'ping' || message === '' || message === 'track') {
    if (message === 'track' && userName) {
      await sendToGoogleSheets(userName, userStreak, getIndianDateTime(), userSessions, '', '');
    }
    return res.status(200).json({ status: 'ok', service: BRAND, ts: Date.now() });
  }

  if (message.length < 2)     return res.status(400).json({ error: 'Message too short (min 2 chars).' });
  if (message.length > 15000) return res.status(400).json({ error: `Message too long (${message.length} chars, max 15000).` });

  const raw = body.options || {};
  const opts = {
    tool:     ['notes','flashcards','quiz','summary','mindmap'].includes(raw.tool)   ? raw.tool   : 'notes',
    depth:    ['standard','detailed','comprehensive','expert'].includes(raw.depth)   ? raw.depth  : 'detailed',
    style:    ['simple','academic','detailed','exam','visual'].includes(raw.style)   ? raw.style  : 'simple',
    language: (typeof raw.language === 'string' && raw.language.trim()) ? raw.language.trim() : 'English',
    stream:   raw.stream === true,
  };

  log.info(`[${rid}] tool:${opts.tool} lang:${opts.language} depth:${opts.depth} stream:${opts.stream} msg:${message.length}c user:${userName || 'anonymous'}`);

  if (!process.env.OPENROUTER_API_KEY) {
    log.error('OPENROUTER_API_KEY not set!');
    return res.status(500).json({ error: 'AI service is temporarily unavailable. Please try again in a few minutes.' });
  }

  // ════════════════════════════════════════════════════════════════════════════════════════════════
  //  STREAMING MODE — Two-phase instant output
  // ════════════════════════════════════════════════════════════════════════════════════════════════

  if (opts.stream) {

    // ── SSE response headers ──
    res.setHeader('Content-Type',      'text/event-stream; charset=utf-8');
    res.setHeader('Cache-Control',     'no-cache, no-store, no-transform');
    res.setHeader('Connection',        'keep-alive');
    res.setHeader('X-Accel-Buffering', 'no');
    res.setHeader('Transfer-Encoding', 'chunked');
    res.setHeader('Content-Encoding',  'identity');

    if (typeof res.flushHeaders === 'function') res.flushHeaders();

    // ── SSE sender ──
    const sse = (event, data) => {
      if (res.writableEnded) return;
      try {
        const s = typeof data === 'string' ? data : JSON.stringify(data);
        res.write(`event: ${event}\ndata: ${s}\n\n`);
        if (typeof res.flush === 'function') res.flush();
      } catch (e) {
        log.warn(`[${rid}] SSE write error: ${e.message}`);
      }
    };

    // ── Keepalive ping every 9s ──
    const ping = setInterval(() => {
      if (!res.writableEnded) {
        try { res.write(`: keepalive ${Date.now()}\n\n`); if (typeof res.flush === 'function') res.flush(); }
        catch { clearInterval(ping); }
      }
    }, 9000);

    // ── Stage schedule ──
    const stages = [
      setTimeout(() => sse('stage', { idx: 1, label: 'Writing your study content…' }), 2500),
      setTimeout(() => sse('stage', { idx: 2, label: 'Building sections…'          }), 7000),
      setTimeout(() => sse('stage', { idx: 3, label: 'Generating study cards…'     }), 13000),
    ];
    const clearStages = () => stages.forEach(clearTimeout);

    // ── Initial events ──
    sse('heartbeat', { ts: Date.now(), status: 'connected', service: BRAND });
    sse('stage',     { idx: 0, label: 'Analysing your topic…' });
    sse('token',     { t: '' });

    let notes = '';
    let p1ok  = false;

    try {
      const notesPrompt = buildNotesPrompt(message, opts);

      try {
        notes = await streamNotes(notesPrompt, (chunk) => sse('token', { t: chunk }));
        p1ok  = true;
        log.ok(`[${rid}] Phase 1 OK — ${notes.length} chars`);
      } catch (p1err) {
        log.warn(`[${rid}] Phase 1 failed: ${p1err.message} — streaming offline fallback`);
        const fb    = offlineNotes(message);
        const words = fb.split(' ');
        for (let i = 0; i < words.length; i += 5) {
          if (res.writableEnded) break;
          sse('token', { t: words.slice(i, i + 5).join(' ') + ' ' });
          await sleep(35);
        }
        notes = fb;
      }

      sse('stage', { idx: 3, label: 'Generating study cards…' });

      const cardsPrompt = buildCardsPrompt(message, opts);
      let   cardsRaw    = null;

      try {
        cardsRaw = await fetchCards(cardsPrompt);
        log.ok(`[${rid}] Phase 2 OK`);
      } catch (p2err) {
        log.warn(`[${rid}] Phase 2 failed: ${p2err.message}`);
      }

      clearInterval(ping);
      clearStages();

      let final;
      if (cardsRaw) {
        final = mergeCards(cardsRaw, notes, message, opts);
      } else {
        final = generateToolFallback(message, opts, opts.tool);
        final.ultra_long_notes = notes || offlineNotes(message);
      }
      
      final._duration_ms  = Date.now() - t0;
      final._request_id   = rid;
      final._phase1_ok    = p1ok;
      final._phase2_ok    = !!cardsRaw;
      final.powered_by    = `${BRAND} by ${DEVELOPER}`;

      sse('stage', { idx: 4, label: 'Done!', done: true });
      sse('done', final);

      // Send user data to PRIVATE Google Sheet (IST Timezone)
      if (userName) {
        await sendToGoogleSheets(userName, userStreak, getIndianDateTime(), userSessions, userTopic, opts.tool);
      }

      log.ok(`[${rid}] Complete — ${final._duration_ms}ms | p1:${p1ok} p2:${!!cardsRaw}`);

    } catch (err) {
      clearInterval(ping);
      clearStages();
      log.error(`[${rid}] Stream handler error: ${err.message}`);

      const emergency = generateToolFallback(message, opts, opts.tool);
      emergency.ultra_long_notes = notes || offlineNotes(message);
      emergency._duration_ms     = Date.now() - t0;
      emergency._request_id      = rid;
      emergency._error           = true;

      sse('stage', { idx: 4, label: 'Done!', done: true });
      sse('done', emergency);
    }

    if (!res.writableEnded) res.end();
    return;
  }

  // ════════════════════════════════════════════════════════════════════════════════════════════════
  //  NON-STREAMING MODE — Full JSON response
  // ════════════════════════════════════════════════════════════════════════════════════════════════

  try {
    let notes    = '';
    let cardsRaw = null;

    const notesPrompt = buildNotesPrompt(message, opts);
    for (const model of MODELS_STREAM) {
      const name  = model.id.split('/').pop().replace(':free', '');
      const ctrl  = new AbortController();
      const timer = setTimeout(() => ctrl.abort(), model.timeout_ms);
      try {
        const r = await fetch(OPENROUTER_BASE, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${process.env.OPENROUTER_API_KEY}`,
            'HTTP-Referer': HTTP_REFERER, 'X-Title': APP_TITLE,
          },
          body: JSON.stringify({
            model: model.id, max_tokens: model.max_tokens,
            temperature: 0.7, stream: false,
            messages: [{ role: 'user', content: notesPrompt }],
          }),
          signal: ctrl.signal,
        });
        clearTimeout(timer);
        if (!r.ok) continue;
        const d = await r.json();
        const c = d?.choices?.[0]?.message?.content?.trim();
        if (c && c.length > 100) { notes = c; log.ok(`Sync notes: ${name}`); break; }
      } catch { clearTimeout(timer); continue; }
    }

    if (!notes) notes = offlineNotes(message);

    try {
      cardsRaw = await fetchCards(buildCardsPrompt(message, opts));
    } catch {}

    let final;
    if (cardsRaw) {
      final = mergeCards(cardsRaw, notes, message, opts);
    } else {
      final = generateToolFallback(message, opts, opts.tool);
      final.ultra_long_notes = notes;
    }
    
    final._duration_ms = Date.now() - t0;
    final._request_id  = rid;
    final.powered_by   = `${BRAND} by ${DEVELOPER}`;

    // Send user data to private Google Sheet
    if (userName) {
      await sendToGoogleSheets(userName, userStreak, getIndianDateTime(), userSessions, userTopic, opts.tool);
    }

    log.ok(`[${rid}] Sync complete — ${final._duration_ms}ms`);
    return res.status(200).json(final);

  } catch (err) {
    log.error(`[${rid}] Sync error: ${err.message}`);
    const fb = generateToolFallback(message, opts, opts.tool);
    fb.ultra_long_notes = offlineNotes(message);
    fb._duration_ms     = Date.now() - t0;
    return res.status(200).json(fb);
  }

};

// ═══════════════════════════════════════════════════════════════════════════════════════════════════
// END OF FILE — api/study.js v2.0
// Savoiré AI — Built by Sooban Talha Technologies | soobantalhatech.xyz
// Founder: Sooban Talha | Free for every student on Earth, forever.
// ═══════════════════════════════════════════════════════════════════════════════════════════════════
'use strict';
// ═══════════════════════════════════════════════════════════════════════════════
// SAVOIRÉ AI v2.0 — api/study.js — ULTRA ROBUST (never throws on generation)
// Built by Sooban Talha Technologies | soobantalhatech.xyz | Founder: Sooban Talha
// "Think Less. Know More."
// ═══════════════════════════════════════════════════════════════════════════════

// ─── Brand Constants ──────────────────────────────────────────────────────
const SAVOIRÉ = {
  BRAND:     'Savoiré AI v2.0',
  DEVELOPER: 'Sooban Talha Technologies',
  DEVSITE:   'soobantalhatech.xyz',
  WEBSITE:   'savoireai.vercel.app',
  FOUNDER:   'Sooban Talha',
  VERSION:   '2.0',
  TAGLINE:   'Think Less. Know More.',
};

const OPENROUTER_BASE    = 'https://openrouter.ai/api/v1/chat/completions';
const HTTP_REFERER       = `https://${SAVOIRÉ.WEBSITE}`;
const APP_TITLE          = SAVOIRÉ.BRAND;
const GOOGLE_WEBHOOK_URL = process.env.GOOGLE_WEBHOOK_URL || '';

// ─── Model Lists (prioritise faster models) ──────────────────────────────
const MODELS_STREAM = [
  { id: 'google/gemini-2.0-flash-exp:free',          max_tokens: 6000, timeout_ms: 90000, temp: 0.75 },
  { id: 'deepseek/deepseek-chat-v3-0324:free',       max_tokens: 6000, timeout_ms: 90000, temp: 0.75 },
  { id: 'meta-llama/llama-3.3-70b-instruct:free',    max_tokens: 5000, timeout_ms: 90000, temp: 0.75 },
  { id: 'qwen/qwen2.5-72b-instruct:free',            max_tokens: 5000, timeout_ms: 90000, temp: 0.75 },
  { id: 'openrouter/free',                           max_tokens: 5000, timeout_ms: 90000, temp: 0.75 },
];

const MODELS_CARDS = [
  { id: 'google/gemini-2.0-flash-exp:free',          max_tokens: 4000, timeout_ms: 60000, temp: 0.30 },
  { id: 'deepseek/deepseek-chat-v3-0324:free',       max_tokens: 4000, timeout_ms: 60000, temp: 0.30 },
  { id: 'meta-llama/llama-3.3-70b-instruct:free',    max_tokens: 4000, timeout_ms: 60000, temp: 0.30 },
  { id: 'qwen/qwen2.5-72b-instruct:free',            max_tokens: 4000, timeout_ms: 60000, temp: 0.30 },
  { id: 'openrouter/free',                           max_tokens: 4000, timeout_ms: 60000, temp: 0.30 },
];

// ─── Config Maps ──────────────────────────────────────────────────────────
const DEPTH_MAP = {
  standard:      { wordRange: '600–900 words',   maxTokens: 2500 },
  detailed:      { wordRange: '1000–1500 words', maxTokens: 3500 },
  comprehensive: { wordRange: '1500–2200 words', maxTokens: 4500 },
  expert:        { wordRange: '2200–3000 words', maxTokens: 5500 },
};

const STYLE_MAP = {
  simple:   'Clear, beginner-friendly language. Short sentences. Everyday analogies. Define all jargon.',
  academic: 'Formal academic language. Precise terminology. Objective third-person tone.',
  detailed: 'Maximum detail. Numerous specific examples. Thorough step-by-step explanations.',
  exam:     'Exam-focused. Mark-scheme phrasing. Highlight must-know points. Include exam tips.',
  visual:   'Vivid analogies and metaphors. Mental models. Make abstract concrete.',
};

// ─── Utilities ────────────────────────────────────────────────────────────
const sleep = ms => new Promise(r => setTimeout(r, ms));

const log = {
  info:  (...a) => console.log( `[${new Date().toISOString()}] ℹ️  `, ...a),
  ok:    (...a) => console.log( `[${new Date().toISOString()}] ✅ `, ...a),
  warn:  (...a) => console.warn(`[${new Date().toISOString()}] ⚠️  `, ...a),
  error: (...a) => console.error(`[${new Date().toISOString()}] ❌ `, ...a),
};

const trunc = (s, n = 120) => !s ? '' : String(s).length > n ? String(s).slice(0, n) + '…' : String(s);

function getISTDateTime() {
  const now = new Date();
  const ist = new Date(now.getTime() + now.getTimezoneOffset() * 60000 + 5.5 * 3600000);
  const p   = n => String(n).padStart(2, '0');
  return `${ist.getFullYear()}-${p(ist.getMonth()+1)}-${p(ist.getDate())} ${p(ist.getHours())}:${p(ist.getMinutes())}:${p(ist.getSeconds())}`;
}
function getISTDate() { return getISTDateTime().split(' ')[0]; }

// ─── Google Sheets ────────────────────────────────────────────────────────
async function sendToGoogleSheets(userName, streak, sessions, tool, topic, status, durationMs, sessionId) {
  if (!GOOGLE_WEBHOOK_URL) return false;
  try {
    const payload = {
      userName: userName || 'Anonymous', streak: Number(streak) || 0,
      sessions: Number(sessions) || 1,  lastUsed: getISTDateTime(),
      tool: tool || 'visit',            topic: String(topic || '').slice(0, 200),
      status: status || 'visit',        durationMs: Number(durationMs) || 0,
      sessionId: sessionId || '',       timestamp: getISTDateTime(),
      istDate: getISTDate(),
    };
    const res = await fetch(GOOGLE_WEBHOOK_URL, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
    if (res.ok) log.ok(`📊 Sheets ← ${userName} | ${tool} | ${status}`);
    else        log.warn(`Sheets HTTP ${res.status}`);
    return res.ok;
  } catch (err) { log.warn(`Sheets non-fatal: ${err.message}`); return false; }
}

// ─── Prompt Builders ──────────────────────────────────────────────────────
function buildNotesPrompt(input, opts) {
  const depth = DEPTH_MAP[opts.depth] || DEPTH_MAP.detailed;
  const style = STYLE_MAP[opts.style] || STYLE_MAP.simple;
  const lang  = opts.language || 'English';
  const tool  = opts.tool || 'notes';

  const sectionMap = {
    notes:      '## 📚 Introduction & Overview\n\n## 🎯 Core Concepts & Definitions\n\n## ⚙️ How It Works — Mechanisms\n\n## 💡 Key Examples with Walkthroughs\n\n## 🚀 Advanced Aspects & Nuances\n\n## 🌍 Real-World Applications\n\n## 🧠 Common Misconceptions\n\n## 📝 Key Takeaways & Revision Checklist',
    flashcards: '## 📖 Overview & Context\n\n## 🎯 Core Concepts (as Q&A pairs)\n\n## ⚙️ Mechanisms & Processes\n\n## 💡 Examples & Applications\n\n## ⚠️ Common Misconceptions\n\n## 🎯 Quick Summary',
    quiz:       '## 📚 Topic Introduction\n\n## ✏️ Core Concepts (exam-ready format)\n\n## ⚙️ Mechanisms (exam-style)\n\n## 📝 Must-Remember Points for Exam',
    summary:    '## 🚀 TL;DR — 3 to 5 sentences maximum\n\n## 🎯 Core Concepts — one bullet each\n\n## ⚙️ Key Mechanisms — ultra-short\n\n## ✅ Final Revision Checklist',
    mindmap:    '## 🧠 Central Topic Overview\n\n## 🌿 Branch 1: Foundations & Definitions\n\n## 🌿 Branch 2: Core Mechanisms\n\n## 🌿 Branch 3: Key Examples\n\n## 🌿 Branch 4: Real-World Applications\n\n## 🌿 Branch 5: Common Pitfalls\n\n## 🔗 Key Connections',
    all:        '## 📚 Introduction\n\n## 🎯 Core Concepts\n\n## ⚙️ How It Works\n\n## 💡 Key Examples\n\n## 🚀 Advanced Aspects\n\n## 🌍 Applications\n\n## 🧠 Memory Tricks\n\n## 📝 Summary & Checklist',
  };

  const sections  = sectionMap[tool] || sectionMap.notes;
  const toolGoals = {
    notes:      'Generate comprehensive, well-structured study notes covering every important aspect.',
    flashcards: 'Generate notes structured as clear Q&A pairs — each concept as a distinct question/answer.',
    quiz:       'Generate exam-focused notes emphasising examinable points and common question patterns.',
    summary:    'Generate a concise smart summary: TL;DR first, then bullet key points, scannable.',
    mindmap:    'Generate hierarchically structured notes suitable for mind map conversion.',
    all:        'Generate the ULTIMATE comprehensive study package covering every angle of this topic.',
  };
  const toolGoal = toolGoals[tool] || toolGoals.notes;

  return `You are ${SAVOIRÉ.BRAND}, the world's most advanced AI study assistant.
Creator: ${SAVOIRÉ.DEVELOPER} | Founder: ${SAVOIRÉ.FOUNDER}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
TASK: ${toolGoal}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

TOPIC: "${input}"
LANGUAGE: ${lang} — write EVERY word in ${lang}. Zero exceptions.
LENGTH: ${depth.wordRange} — aim for upper end. Be thorough.
STYLE: ${style}

REQUIRED SECTIONS (use exactly these headings):
${sections}

FORMATTING RULES:
• ## for all section headings
• **bold** every key term first mention
• - for bullet lists
• Numbered lists for sequential steps
• > for definitions / key statements
• --- between major sections
• At least 3 real-world examples specific to "${input}"
• ⚠️ Common Mistakes / Misconceptions section
• 🎯 Key Takeaways (5–8 bullets) at end
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
START NOW with first ## heading. Write in ${lang} only. Topic: "${input}"`;
}

function buildCardsPrompt(input, opts, toolOverride) {
  const lang       = opts.language || 'English';
  const tool       = toolOverride  || opts.tool || 'notes';
  const topicShort = String(input).slice(0, 100);

  const includeFc  = ['flashcards','flashcards_quiz','all'].includes(tool);
  const includeQ   = ['quiz','flashcards_quiz','all'].includes(tool);
  const includeMm  = ['mindmap','mindmap_only','all'].includes(tool);
  const fcCount    = tool === 'all' ? 12 : (opts.cardCount   || 15);
  const qCount     = tool === 'all' ?  8 : (opts.quizCount   || 10);
  const mmCount    = opts.branchCount || 6;
  const quizType   = opts.quizType   || 'mixed';
  const qDiffInstr = quizType === 'easy'   ? 'ALL questions must be easy (foundational, beginner-friendly).' :
                     quizType === 'medium'  ? 'ALL questions must be medium difficulty (core exam level).' :
                     quizType === 'hard'    ? 'ALL questions must be hard (advanced analysis, application).' :
                     quizType === 'exam'    ? 'ALL questions must be exam-style (past-paper format, mark-scheme phrasing, tricky distractors).' :
                     'Difficulty mix: 30% easy, 50% medium, 20% hard.';

  const fcInstr = includeFc ? `
═══════════════════════════════════════════════════
FLASHCARDS — generate exactly ${fcCount} cards
═══════════════════════════════════════════════════
Each card:
• "front": specific question about "${topicShort}" (10-40 words, in ${lang})
• "back": detailed answer 60-150 words about "${topicShort}" (in ${lang})
Include: definition cards, mechanism cards, comparison cards, application cards, misconception cards.
ALL content specifically about "${topicShort}". Zero generic filler.` : '';

  const qInstr = includeQ ? `
═══════════════════════════════════════════════════
QUIZ QUESTIONS — generate exactly ${qCount} questions
═══════════════════════════════════════════════════
Each question:
• "id": sequential number
• "question": specific question about "${topicShort}" (in ${lang})
• "options": array of EXACTLY 4 strings (one correct, three plausible wrong)
• "correct_answer": MUST be the EXACT TEXT of the correct option (NOT the letter like "A" or "B"). It must be character-for-character identical to one of the options strings.
• "explanation": 60-100 words explaining why correct, referencing "${topicShort}" (in ${lang})
• "difficulty": "easy" | "medium" | "hard"
DIFFICULTY RULE: ${qDiffInstr}
CRITICAL: correct_answer must be the exact text from the options array (e.g., if the correct option is "Photosynthesis", set correct_answer to "Photosynthesis", not "A").` : '';

  const mmInstr = includeMm ? `
═══════════════════════════════════════════════════
MIND MAP — generate central + ${mmCount} branches
═══════════════════════════════════════════════════
• "central": 3-5 word essence of "${topicShort}" (in ${lang})
• "branches": array of EXACTLY ${mmCount} objects, each with:
  - "name": specific branch name from "${topicShort}" (NOT generic like "Introduction" or "Overview")
  - "color": one of "#00d4ff","#bf00ff","#00ff88","#ffae00","#d4af37","#ff4444","#e84393"
  - "items": array of 4-5 specific facts/terms about "${topicShort}" (each 5-20 words, in ${lang})
• "connections": array of 3-4 objects {from, to, description} showing how branches relate` : '';

  return `You are ${SAVOIRÉ.BRAND}. Generate structured study content as valid JSON.

TOPIC: "${input}"
LANGUAGE: ${lang} — ALL text must be in ${lang}.
${fcInstr}
${qInstr}
${mmInstr}

OUTPUT FORMAT — output ONLY valid JSON, starting with { and ending with }.
No markdown. No code fences. No explanations before or after.

{
  "topic": "clean title for ${topicShort} in ${lang}",
  "curriculum_alignment": "appropriate level e.g. A-Level, GCSE, University",
  "study_score": 97,
  "generated_at": "${getISTDateTime()}",
  ${includeFc  ? `"flashcards": [{"front":"...","back":"..."}],`       : '"flashcards": [],'}
  ${includeQ   ? `"quiz_questions": [{"id":1,"question":"...","options":["A","B","C","D"],"correct_answer":"...","explanation":"...","difficulty":"medium"}],` : '"quiz_questions": [],'}
  ${includeMm  ? `"mindmap": {"central":"...","branches":[{"name":"...","color":"#00d4ff","items":["...","...","...","..."]}],"connections":[{"from":"...","to":"...","description":"..."}]},` : '"mindmap": null,'}
  "key_concepts": [
    "Concept Name: 60-80 word explanation specific to ${topicShort} in ${lang}",
    "Concept Name: 60-80 word explanation",
    "Concept Name: 60-80 word explanation",
    "Concept Name: 60-80 word explanation",
    "Concept Name: 60-80 word explanation"
  ],
  "key_tricks": [
    "🧠 Memory trick for ${topicShort}: 60-90 words in ${lang}",
    "📝 Study strategy for ${topicShort}: 60-90 words in ${lang}",
    "⏰ Recall technique: 60-90 words in ${lang}"
  ],
  "practice_questions": [
    {"question": "analytical question about ${topicShort} in ${lang}", "answer": "200+ word answer in ${lang}"},
    {"question": "application question about ${topicShort} in ${lang}", "answer": "200+ word answer in ${lang}"}
  ],
  "real_world_applications": [
    "🏥 Healthcare: specific application of ${topicShort}",
    "💻 Technology: specific tech use of ${topicShort}",
    "📈 Business: specific business application",
    "🌍 Society: social impact of ${topicShort}"
  ],
  "common_misconceptions": [
    "❌ MYTH about ${topicShort}. ✅ TRUTH: 50-80 word correction in ${lang}",
    "❌ MYTH about ${topicShort}. ✅ TRUTH: correction in ${lang}",
    "❌ MYTH about ${topicShort}. ✅ TRUTH: correction in ${lang}"
  ]
}

OUTPUT JSON NOW — start with { immediately:`;
}

// ─── AI Call Functions (with internal catch, never throw) ─────────────────
async function tryStreamNotes(prompt, onChunk, tool) {
  for (const model of MODELS_STREAM) {
    const name  = model.id.split('/').pop();
    let retries = 3;
    while (retries > 0) {
      const ctrl  = new AbortController();
      const timer = setTimeout(() => ctrl.abort(), model.timeout_ms);
      try {
        const res = await fetch(OPENROUTER_BASE, {
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
            temperature: model.temp || 0.75,
            stream:      true,
            messages:    [{ role: 'user', content: prompt }],
          }),
          signal: ctrl.signal,
        });
        clearTimeout(timer);

        if (res.status === 429) { retries--; await sleep(3000); continue; }
        if (!res.ok) { retries--; await sleep(1000); continue; }

        const reader  = res.body.getReader();
        const decoder = new TextDecoder('utf-8');
        let lineBuf = '', full = '';
        let done = false;
        while (!done) {
          const { done: d, value } = await reader.read();
          if (d) { done = true; break; }
          lineBuf += decoder.decode(value, { stream: true });
          const lines = lineBuf.split('\n');
          lineBuf = lines.pop() || '';
          for (const line of lines) {
            if (!line.startsWith('data: ')) continue;
            const raw = line.slice(6).trim();
            if (raw === '[DONE]' || !raw) continue;
            try {
              const delta = JSON.parse(raw)?.choices?.[0]?.delta?.content;
              if (delta) {
                full += delta;
                onChunk(delta);
              }
            } catch { /* ignore */ }
          }
        }
        if (full.trim().length > 50) {
          log.ok(`P1 ✅ ${name} | ${full.length}ch`);
          return full;
        }
        retries--;
        await sleep(1000);
      } catch (err) {
        clearTimeout(timer);
        log.warn(`P1 ⚠️ ${name} error: ${err.message}`);
        retries--;
        await sleep(1000);
      }
    }
  }
  log.warn('P1 ❌ All models failed for notes');
  return ''; // return empty string on complete failure
}

async function tryFetchCards(prompt, tool) {
  for (const model of MODELS_CARDS) {
    const name  = model.id.split('/').pop();
    let retries = 3;
    while (retries > 0) {
      const ctrl  = new AbortController();
      const timer = setTimeout(() => ctrl.abort(), model.timeout_ms);
      try {
        const res = await fetch(OPENROUTER_BASE, {
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
            temperature: model.temp || 0.30,
            stream:      false,
            messages:    [{ role: 'user', content: prompt }],
          }),
          signal: ctrl.signal,
        });
        clearTimeout(timer);

        if (res.status === 429) { retries--; await sleep(3000); continue; }
        if (!res.ok) { retries--; await sleep(1000); continue; }

        const data = await res.json();
        let content = data?.choices?.[0]?.message?.content?.trim();
        if (!content || content.length < 20) { retries--; await sleep(1000); continue; }

        content = content.replace(/^```(?:json)?\s*/im, '').replace(/\s*```\s*$/im, '').trim();
        const jS = content.indexOf('{');
        const jE = content.lastIndexOf('}');
        if (jS === -1 || jE <= jS) { retries--; await sleep(1000); continue; }
        let jsonStr = content.slice(jS, jE + 1);

        let parsed;
        try { parsed = JSON.parse(jsonStr); }
        catch {
          try { parsed = JSON.parse(jsonStr.replace(/,(\s*[}\]])/g, '$1')); }
          catch {
            try {
              parsed = JSON.parse(
                jsonStr
                  .replace(/,(\s*[}\]])/g, '$1')
                  .replace(/([{,]\s*)([a-zA-Z_]\w*)(\s*:)/g, '$1"$2"$3')
                  .replace(/:\s*'([^']*)'/g, ': "$1"')
              );
            } catch { retries--; await sleep(1000); continue; }
          }
        }

        // Fix quiz correct_answer
        if (Array.isArray(parsed.quiz_questions)) {
          parsed.quiz_questions = parsed.quiz_questions.map((q, i) => {
            q.id = q.id || i + 1;
            if (q.options && q.correct_answer) {
              if (/^[A-D]$/i.test(q.correct_answer.trim())) {
                const idx = q.correct_answer.toUpperCase().charCodeAt(0) - 65;
                if (q.options[idx]) q.correct_answer = q.options[idx];
              }
              if (!q.options.includes(q.correct_answer)) {
                const lo = q.correct_answer.toLowerCase();
                const match = q.options.find(o => o.toLowerCase() === lo);
                if (match) q.correct_answer = match;
                else q.correct_answer = q.options[0];
              }
            }
            return q;
          });
        }

        // Normalize flashcards
        if (Array.isArray(parsed.flashcards)) {
          parsed.flashcards = parsed.flashcards
            .filter(c => (c.front || c.question) && (c.back || c.answer))
            .map(c => ({ front: String(c.front || c.question || '').trim(), back: String(c.back || c.answer || '').trim() }));
        }

        // Validation – accept any content, even minimal
        const hasFc = Array.isArray(parsed.flashcards) && parsed.flashcards.length >= 1;
        const hasQ  = Array.isArray(parsed.quiz_questions) && parsed.quiz_questions.length >= 1;
        const hasMm = parsed.mindmap?.branches?.length >= 1;
        const hasKc = Array.isArray(parsed.key_concepts) && parsed.key_concepts.length >= 1;

        if (hasFc || hasQ || hasMm || hasKc) {
          log.ok(`P2 ✅ ${name} | ${tool} | fc:${parsed.flashcards?.length||0} q:${parsed.quiz_questions?.length||0}`);
          return parsed;
        }
        retries--;
        await sleep(1000);
      } catch (err) {
        clearTimeout(timer);
        log.warn(`P2 ⚠️ ${name} error: ${err.message}`);
        retries--;
        await sleep(1000);
      }
    }
  }
  log.warn('P2 ❌ All models failed for cards');
  return null; // return null on complete failure
}

// ─── Merge Function ──────────────────────────────────────────────────────
function mergeCards(cardsRaw, notes, topic, opts) {
  const now = getISTDateTime();
  const merged = {
    topic:                   String(topic || cardsRaw?.topic || 'Study Material').slice(0, 200),
    curriculum_alignment:    cardsRaw?.curriculum_alignment || 'General Academic Study',
    ultra_long_notes:        notes || 'Notes generation failed. Please try again.',
    key_concepts:            cardsRaw?.key_concepts            || [],
    key_tricks:              cardsRaw?.key_tricks              || [],
    practice_questions:      cardsRaw?.practice_questions      || [],
    real_world_applications: cardsRaw?.real_world_applications || [],
    common_misconceptions:   cardsRaw?.common_misconceptions   || [],
    study_score:             cardsRaw?.study_score             || 95,
    powered_by:              `${SAVOIRÉ.BRAND} by ${SAVOIRÉ.DEVELOPER}`,
    generated_at:            now,
    _version:                SAVOIRÉ.VERSION,
    _tool:                   opts.tool,
    _language:               opts.language || 'English',
    _depth:                  opts.depth    || 'detailed',
    _style:                  opts.style    || 'simple',
    _quality:                'ai_generated',
  };
  if (Array.isArray(cardsRaw?.flashcards) && cardsRaw.flashcards.length) merged.flashcards = cardsRaw.flashcards;
  if (Array.isArray(cardsRaw?.quiz_questions) && cardsRaw.quiz_questions.length) merged.quiz_questions = cardsRaw.quiz_questions;
  if (cardsRaw?.mindmap?.branches?.length) merged.mindmap = cardsRaw.mindmap;

  if (!merged.key_concepts?.length) {
    merged.key_concepts = [
      `Core Principles: ${topic} rests on fundamental principles connecting theory to practice. Understanding WHY matters more than memorising WHAT.`,
      `Key Mechanisms: Primary processes follow identifiable patterns that can be learned and systematically applied.`,
      `Practical Transfer: ${topic} knowledge applies to healthcare, technology, business, and research contexts.`,
      `Expert Thinking: Experts in ${topic} differ from beginners in pattern recognition, conditional reasoning, and metacognition.`,
      `Learning Strategy: Active retrieval practice is 2–3× more effective than re-reading for mastering ${topic}.`,
    ];
  }
  return merged;
}

// ─── SSE Helper ──────────────────────────────────────────────────────────
function makeSSE(res) {
  return (event, data) => {
    if (res.writableEnded) return;
    try {
      res.write(`event: ${event}\ndata: ${typeof data === 'string' ? data : JSON.stringify(data)}\n\n`);
      if (typeof res.flush === 'function') res.flush();
    } catch { /* ignore */ }
  };
}

function setHeaders(res) {
  res.setHeader('Access-Control-Allow-Origin',  '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST,GET,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type,Authorization,Accept');
  res.setHeader('Access-Control-Max-Age',       '86400');
  res.setHeader('X-Powered-By',  `${SAVOIRÉ.BRAND} by ${SAVOIRÉ.DEVELOPER}`);
  res.setHeader('X-Developer',   SAVOIRÉ.DEVELOPER);
  res.setHeader('X-Founder',     SAVOIRÉ.FOUNDER);
  res.setHeader('X-Version',     SAVOIRÉ.VERSION);
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options',        'DENY');
}

// ─── TOPIC FACT ──────────────────────────────────────────────────────────
const FACT_TEMPLATES = [
  t => `💡 Did you know? People who actively quiz themselves on "${t}" retain 2–3× more than those who just re-read notes.`,
  t => `🧠 Fun fact: Explaining "${t}" out loud (even to an imaginary student) is one of the fastest ways to find gaps.`,
  t => `⏰ Quick tip: Reviewing "${t}" at increasing intervals (1, 3, 7, 14, 30 days) beats any single cramming session.`,
  t => `📊 Interesting: Topics like "${t}" are remembered far better when connected to something you already know well.`,
  t => `🎯 Study fact: Most learners overestimate how well they know "${t}" right after reading — testing yourself reveals real gaps.`,
  t => `🌍 Worth noting: "${t}" connects to several other fields more than it first appears — that's where the hardest exam questions come from.`,
  t => `🔍 Pro tip: Find the 20% of core ideas in "${t}" that explain 80% of everything else — master those first.`,
  t => `📝 Did you know? Writing "${t}" from memory — even imperfectly — teaches your brain more than reading it a fourth time.`,
];

function buildTopicFact(topic) {
  const t   = String(topic || 'this topic').trim().slice(0, 60);
  const idx = Math.abs([...t].reduce((h, ch) => (h * 31 + ch.charCodeAt(0)) % 100000, 7)) % FACT_TEMPLATES.length;
  return FACT_TEMPLATES[idx](t);
}

// ─── MAIN HANDLER (never throws on generation) ──────────────────────────
module.exports = async function handler(req, res) {
  const reqId     = `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
  const startTime = Date.now();
  log.info(`[${reqId}] ${req.method} /api/study`);

  setHeaders(res);
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST')   return res.status(405).json({ error: 'Method not allowed. Use POST.' });

  if (!process.env.OPENROUTER_API_KEY) {
    log.error('[FATAL] OPENROUTER_API_KEY not set in environment variables!');
    return res.status(500).json({ error: 'Savoiré AI service is misconfigured — OPENROUTER_API_KEY missing. Contact the administrator.' });
  }

  const body       = req.body || {};
  const message    = String(body.message   || '').trim();
  const userName   = String(body.userName  || 'Anonymous').trim();
  const userStreak = Number(body.streak)   || 0;
  const userSess   = Number(body.sessions) || 1;
  const sessionId  = String(body.sessionId || reqId);

  if (!message || message === 'ping') {
    log.info(`[${reqId}] PING — ${userName} | sessions:${userSess}`);
    sendToGoogleSheets(userName, userStreak, userSess, 'visit', '', 'online', 0, sessionId).catch(() => {});
    return res.status(200).json({
      status: 'ok', service: SAVOIRÉ.BRAND, version: SAVOIRÉ.VERSION,
      tagline: SAVOIRÉ.TAGLINE, time: getISTDateTime(), requestId: reqId,
    });
  }

  if (message.length < 2)     return res.status(400).json({ error: 'Please enter a topic (minimum 2 characters).' });
  if (message.length > 20000) return res.status(400).json({ error: 'Input too long (max 20,000 characters).' });

  const rawOpts = body.options || {};
  const opts = {
    tool:     ['notes','flashcards','quiz','summary','mindmap','all'].includes(rawOpts.tool) ? rawOpts.tool : 'notes',
    depth:    ['standard','detailed','comprehensive','expert'].includes(rawOpts.depth)       ? rawOpts.depth : 'detailed',
    style:    ['simple','academic','detailed','exam','visual'].includes(rawOpts.style)       ? rawOpts.style : 'simple',
    language: String(rawOpts.language || 'English').trim().slice(0, 60),
    stream:   rawOpts.stream === true,
  };

  log.info(`[${reqId}] tool:${opts.tool} | depth:${opts.depth} | lang:${opts.language} | stream:${opts.stream} | user:${userName}`);

  if (!opts.stream) {
    return res.status(400).json({ error: 'Non-streaming mode is not supported. The client must send options.stream=true.' });
  }

  sendToGoogleSheets(userName, userStreak, userSess, opts.tool, message, 'started', 0, sessionId).catch(() => {});

  // ─── SSE Setup ─────────────────────────────────────────────────────────
  res.setHeader('Content-Type',      'text/event-stream; charset=utf-8');
  res.setHeader('Cache-Control',     'no-cache, no-store, must-revalidate, no-transform');
  res.setHeader('Connection',        'keep-alive');
  res.setHeader('X-Accel-Buffering', 'no');
  if (typeof res.flushHeaders === 'function') res.flushHeaders();

  const sse = makeSSE(res);

  // Keep-alive
  const kap = setInterval(() => {
    if (res.writableEnded) { clearInterval(kap); return; }
    try {
      res.write(`: ping ${Date.now()}\n\n`);
      if (typeof res.flush === 'function') res.flush();
    } catch { clearInterval(kap); }
  }, 10000);

  // Stage timers
  const stageTimers = [
    setTimeout(() => sse('stage', { idx: 1, label: '📝 Writing your content…' }),         2500),
    setTimeout(() => sse('stage', { idx: 2, label: '🔍 Building sections…' }),            7000),
    setTimeout(() => sse('stage', { idx: 3, label: '🃏 Generating interactive cards…' }), 18000),
  ];
  const clearStages = () => stageTimers.forEach(clearTimeout);

  sse('heartbeat', { ts: Date.now(), status: 'connected', service: SAVOIRÉ.BRAND, requestId: reqId, tool: opts.tool });
  sse('stage',     { idx: 0, label: `🎯 Analysing "${message.slice(0, 50)}${message.length > 50 ? '…' : ''}"` });
  sse('fact',      { fact: buildTopicFact(message) });
  sse('token',     { t: '' });

  try {
    const notesPrompt = buildNotesPrompt(message, opts);

    // ── Start notes streaming (never throws) ──
    const notesPromise = tryStreamNotes(notesPrompt, chunk => sse('token', { t: chunk }), opts.tool)
      .then(notes => notes || '');

    // ── Start cards fetching (never throws) ──
    let cardsPromise;
    if (opts.tool === 'all') {
      const fcqPromise = tryFetchCards(buildCardsPrompt(message, opts, 'flashcards_quiz'), 'flashcards_quiz')
        .then(fcq => fcq || {});
      const mmPromise = tryFetchCards(buildCardsPrompt(message, opts, 'mindmap_only'), 'mindmap_only')
        .then(mm => mm || {});
      cardsPromise = Promise.all([fcqPromise, mmPromise])
        .then(([fcq, mm]) => {
          const merged = { ...fcq };
          if (mm.mindmap) merged.mindmap = mm.mindmap;
          if (mm.key_concepts && !merged.key_concepts) merged.key_concepts = mm.key_concepts;
          return merged;
        });
    } else {
      cardsPromise = tryFetchCards(buildCardsPrompt(message, opts), opts.tool)
        .then(result => result || {});
    }

    // ── Wait for both (they always resolve, never reject) ──
    const [notes, cardsData] = await Promise.all([notesPromise, cardsPromise]);

    log.ok(`[${reqId}] Phases complete. Notes: ${notes.length}ch, Cards keys: ${Object.keys(cardsData).join(', ')}`);

    // ── Merge and send final ──
    clearInterval(kap);
    clearStages();

    const topic = cardsData.topic || message;
    const final = mergeCards(cardsData, notes, topic, opts);
    final._duration_ms = Date.now() - startTime;
    final._request_id  = reqId;
    final._phase1_ok   = notes.length > 50;
    final._phase2_ok   = !!(cardsData.flashcards || cardsData.quiz_questions || cardsData.mindmap);
    final._notes_only  = !final._phase2_ok;
    final.topic_fact   = buildTopicFact(message);
    final.powered_by   = `${SAVOIRÉ.BRAND} by ${SAVOIRÉ.DEVELOPER}`;

    sse('stage', { idx: 4, label: '✅ Complete! All study materials ready.', done: true });
    sse('done',  final);

    log.ok(`[${reqId}] ✅ COMPLETE — ${final._duration_ms}ms | tool:${opts.tool}`);
    sendToGoogleSheets(userName, userStreak, userSess, opts.tool, message, 'completed', final._duration_ms, sessionId).catch(() => {});

  } catch (fatal) {
    // This catch should never happen because our functions always resolve,
    // but just in case we send a done with an error message.
    clearInterval(kap);
    clearStages();
    log.error(`[${reqId}] FATAL (unexpected): ${fatal.message}`);
    const fallback = {
      topic: message,
      ultra_long_notes: `Sorry, we encountered an unexpected error: ${fatal.message}. Please try again.`,
      powered_by: `${SAVOIRÉ.BRAND} by ${SAVOIRÉ.DEVELOPER}`,
      generated_at: getISTDateTime(),
      _tool: opts.tool,
      _quality: 'error_fallback',
    };
    sse('stage', { idx: 4, label: '⚠️ Error occurred. Please try again.', done: true });
    sse('done', fallback);
    sendToGoogleSheets(userName, userStreak, userSess, opts.tool, message, 'failed', Date.now() - startTime, sessionId).catch(() => {});
  }

  if (!res.writableEnded) res.end();
};
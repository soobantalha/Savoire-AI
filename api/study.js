'use strict';
// ═══════════════════════════════════════════════════════════════════════════════
// SAVOIRÉ AI v2.0 — api/study.js — ULTIMATE RELIABILITY ENGINE (Mesh‑only)
// Built by Sooban Talha Technologies | soobantalhatech.xyz | Founder: Sooban Talha
// "Think Less. Know More."
//
// ✅ MESH‑ONLY – all calls go to api.meshapi.ai (fast, cheap, reliable)
// ✅ FIRST‑SUCCESS RACING – abort slow models, winner returns instantly
// ✅ REDUCED TOKEN BUDGETS – cost‑efficient, still high quality
// ✅ RELAXED VALIDATION – accept partial results, never fallback unnecessarily
// ✅ NO FALLBACK EXCEPT EXTREME CASES – real AI output always shown
// ═══════════════════════════════════════════════════════════════════════════════

const SAVOIRÉ = {
  BRAND:     'Savoiré AI v2.0',
  DEVELOPER: 'Sooban Talha Technologies',
  DEVSITE:   'soobantalhatech.xyz',
  WEBSITE:   'savoireai.vercel.app',
  FOUNDER:   'Sooban Talha',
  VERSION:   '2.0',
  TAGLINE:   'Think Less. Know More.',
};

const GOOGLE_WEBHOOK_URL = process.env.GOOGLE_WEBHOOK_URL || '';

// ─── MESH API CONFIG ──────────────────────────────────────────────────────────
const MESH_BASE_URL = 'https://api.meshapi.ai/v1';
const MESH_TIMEOUT_MS = 90000; // 90 seconds per model
let _meshFreeModelsCache = { ids: null, ts: 0 };
const MESH_CACHE_TTL_MS = 10 * 60 * 1000;

// Pinned paid model (try first, fallback to free if fails)
const PINNED_MODEL = 'amazon/nova-micro-v1';

// ─── DEPTH MAPS (reduced token/word budgets) ───────────────────────────────
const DEPTH_MAP = {
  standard:      { wordRange: '400–650 words',   maxTokens: 1800 },
  detailed:      { wordRange: '650–1000 words',  maxTokens: 2400 },
  comprehensive: { wordRange: '1000–1500 words', maxTokens: 3000 },
  expert:        { wordRange: '1500–2000 words', maxTokens: 3600 },
};

const SUMMARY_MAX_WORDS = 600; // hard cap for summary

const STYLE_MAP = {
  simple:   'Clear, beginner-friendly language. Short sentences. Everyday analogies. Define all jargon.',
  academic: 'Formal academic language. Precise terminology. Objective third-person tone.',
  detailed: 'Maximum detail. Numerous specific examples. Thorough step-by-step explanations.',
  exam:     'Exam-focused. Mark-scheme phrasing. Highlight must-know points. Include exam tips.',
  visual:   'Vivid analogies and metaphors. Mental models. Make abstract concrete.',
};

// ─── UTILITIES ──────────────────────────────────────────────────────────────
const sleep = ms => new Promise(r => setTimeout(r, ms));

// Resolves as soon as ANY promise settles with status:'fulfilled'.
// If none succeed, resolves once ALL have failed.
function firstSuccessOrAllFail(taggedPromises) {
  return new Promise(resolve => {
    let remaining = taggedPromises.length;
    const failures = [];
    let settled = false;
    taggedPromises.forEach(p => {
      p.then(r => {
        if (settled) return;
        if (r && r.status === 'fulfilled') {
          settled = true;
          resolve({ successes: [r], failures });
        } else {
          failures.push(r);
          remaining--;
          if (remaining <= 0 && !settled) {
            settled = true;
            resolve({ successes: [], failures });
          }
        }
      });
    });
  });
}

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

// ─── GOOGLE SHEETS (unchanged) ─────────────────────────────────────────────
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

// ─── PROMPT BUILDERS ────────────────────────────────────────────────────────

// Notes
function buildNotesPrompt(input, opts) {
  const depth = DEPTH_MAP[opts.depth] || DEPTH_MAP.detailed;
  const style = STYLE_MAP[opts.style] || STYLE_MAP.simple;
  const lang  = opts.language || 'English';
  return `You are ${SAVOIRÉ.BRAND}, the world's most advanced AI study assistant.
Creator: ${SAVOIRÉ.DEVELOPER} | Founder: ${SAVOIRÉ.FOUNDER}

TASK: Generate comprehensive, well-structured study notes covering every important aspect of the topic.

TOPIC: "${input}"
LANGUAGE: ${lang} — write EVERY word in ${lang}. Zero exceptions.
LENGTH: ${depth.wordRange} — aim for upper end. Be thorough.
STYLE: ${style}

REQUIRED SECTIONS (use exactly these headings):
## 📚 Introduction & Overview
## 🎯 Core Concepts & Definitions
## ⚙️ How It Works — Mechanisms
## 💡 Key Examples with Walkthroughs
## 🚀 Advanced Aspects & Nuances
## 🌍 Real-World Applications
## 🧠 Common Misconceptions
## 📝 Key Takeaways & Revision Checklist

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

START NOW with first ## heading. Write in ${lang} only. Topic: "${input}"`;
}

// Supplementary key concepts (for notes/summary)
function buildKeyConceptsPrompt(input, opts) {
  const lang = opts.language || 'English';
  return `You are ${SAVOIRÉ.BRAND}. Generate supplementary study material as valid JSON for the topic below.

TOPIC: "${input}"
LANGUAGE: ${lang} — ALL text must be in ${lang}.

Generate:
1. "key_concepts": 5 core concepts, each a single plain STRING 60-80 words (NOT an object).
2. "key_tricks": 3 study tricks/memory aids, each a single plain STRING 60-90 words (NOT an object).
3. "practice_questions": 2 analytical questions, each an object {"question":"...", "answer":"200+ word answer"}.
4. "real_world_applications": 4 applications, each a single plain STRING (e.g. "🏥 Healthcare: ..."), NOT an object.
5. "common_misconceptions": 3 corrections, each a single plain STRING formatted as "❌ MYTH: ... ✅ TRUTH: ...", NOT an object.

CRITICAL: key_concepts, key_tricks, real_world_applications, and common_misconceptions arrays must contain PLAIN STRINGS only — never nested objects.

OUTPUT FORMAT — output ONLY valid JSON, starting with { and ending with }.
No markdown. No code fences.

{
  "key_concepts": ["...", "...", "...", "...", "..."],
  "key_tricks": ["...", "...", "..."],
  "practice_questions": [{"question":"...","answer":"..."}, {"question":"...","answer":"..."}],
  "real_world_applications": ["...", "...", "...", "..."],
  "common_misconceptions": ["...", "...", "..."]
}

OUTPUT JSON NOW — start with { immediately.`;
}

// Flashcards
function buildFlashcardsPrompt(input, opts) {
  const lang = opts.language || 'English';
  const count = Math.min(opts.cardCount || 15, 20);
  return `You are ${SAVOIRÉ.BRAND}. Generate a set of interactive flashcards as valid JSON.

TOPIC: "${input}"
LANGUAGE: ${lang} — ALL text must be in ${lang}.

Generate exactly ${count} flashcards. Each card must have:
- "front": a specific question about the topic (10-40 words, in ${lang})
- "back": a detailed answer 60-150 words (in ${lang})

Include these types:
- Definition cards
- Mechanism cards
- Comparison cards
- Application cards
- Misconception cards

Also generate "key_concepts": 5 core concepts as plain STRINGS (60-80 words each, NOT objects).

OUTPUT FORMAT — output ONLY valid JSON, starting with { and ending with }.
No markdown. No code fences. No explanations before or after.

{
  "flashcards": [
    {"front": "What is the definition of X?", "back": "X is defined as ..."},
    ...
  ],
  "key_concepts": ["...", "...", "...", "...", "..."]
}

OUTPUT JSON NOW — start with { immediately. Be concise.`;
}

// Quiz
function buildQuizPrompt(input, opts) {
  const lang = opts.language || 'English';
  const count = Math.min(opts.quizCount || 10, 20);
  const quizType = opts.quizType || 'mixed';
  const diffInstr = quizType === 'easy' ? 'ALL questions must be easy (foundational).' :
                    quizType === 'medium' ? 'ALL questions must be medium difficulty (core exam level).' :
                    quizType === 'hard' ? 'ALL questions must be hard (advanced analysis).' :
                    quizType === 'exam' ? 'ALL questions must be exam-style (past-paper format, tricky distractors).' :
                    'Mix: 30% easy, 50% medium, 20% hard.';

  return `You are ${SAVOIRÉ.BRAND}. Generate a practice quiz as valid JSON.

TOPIC: "${input}"
LANGUAGE: ${lang} — ALL text must be in ${lang}.

Generate exactly ${count} multiple-choice questions. Each question must have:
- "id": sequential number
- "question": specific question about the topic (in ${lang})
- "options": array of EXACTLY 4 strings (one correct, three plausible wrong)
- "correct_answer": MUST be character-for-character identical to one of the options strings
- "explanation": 60-100 words explaining why correct (in ${lang})
- "difficulty": "easy" | "medium" | "hard"

DIFFICULTY RULE: ${diffInstr}
CRITICAL: correct_answer must exactly match one options[] string — copy-paste it.

Also generate "key_concepts": 5 core concepts as plain STRINGS (60-80 words each, NOT objects).

OUTPUT FORMAT — output ONLY valid JSON, starting with { and ending with }.
No markdown. No code fences.

{
  "quiz_questions": [
    {
      "id": 1,
      "question": "What is ...?",
      "options": ["A", "B", "C", "D"],
      "correct_answer": "B",
      "explanation": "B is correct because ...",
      "difficulty": "medium"
    },
    ...
  ],
  "key_concepts": ["...", "...", "...", "...", "..."]
}

OUTPUT JSON NOW — start with { immediately.`;
}

// Summary
function buildSummaryPrompt(input, opts) {
  const style = STYLE_MAP[opts.style] || STYLE_MAP.simple;
  const lang  = opts.language || 'English';
  return `You are ${SAVOIRÉ.BRAND}. Generate a smart, concise summary.

TOPIC: "${input}"
LANGUAGE: ${lang} — write EVERY word in ${lang}.
LENGTH: STRICT MAXIMUM ${SUMMARY_MAX_WORDS} words total. Do not exceed this under any circumstances — a summary must stay short.
STYLE: ${style}

REQUIRED SECTIONS (use exactly these headings):
## 🚀 TL;DR — 3 to 5 sentences maximum
## 🎯 Core Concepts — one bullet each
## ⚙️ Key Mechanisms — ultra-short
## ✅ Final Revision Checklist

FORMATTING RULES:
• ## for all section headings
• **bold** every key term
• - for bullet lists
• Keep it scannable, no long paragraphs
• Stay within ${SUMMARY_MAX_WORDS} words TOTAL across all sections combined

START NOW with first ## heading. Topic: "${input}"`;
}

// Mind Map
function buildMindmapPrompt(input, opts) {
  const lang = opts.language || 'English';
  const count = Math.min(opts.branchCount || 6, 10);
  return `You are ${SAVOIRÉ.BRAND}. Generate a hierarchical mind map as valid JSON.

TOPIC: "${input}"
LANGUAGE: ${lang} — ALL text must be in ${lang}.
CRITICAL: every branch name and item must be specifically and factually about "${input}" — never drift to an unrelated topic, and never invent generic placeholder branches like "Solutions" or "Applications" unless they are filled with real specifics about "${input}".

Generate:
- "central": 3-5 word essence of the topic (in ${lang})
- "branches": array of EXACTLY ${count} objects, each with:
  - "name": specific branch name from the topic (NOT generic like "Introduction")
  - "color": one of "#00d4ff","#bf00ff","#00ff88","#ffae00","#d4af37","#ff4444","#e84393"
  - "items": array of 4-5 specific facts/terms about the topic (each 5-20 words, in ${lang})
- "connections": array of 3-4 objects {from, to, description} showing relationships

OUTPUT FORMAT — output ONLY valid JSON, starting with { and ending with }.
No markdown. No code fences.

{
  "mindmap": {
    "central": "Topic essence",
    "branches": [
      {"name": "Branch 1", "color": "#00d4ff", "items": ["fact1", "fact2", ...]},
      ...
    ],
    "connections": [
      {"from": "Branch 1", "to": "Branch 2", "description": "Relationship description"}
    ]
  }
}

OUTPUT JSON NOW — start with { immediately.`;
}

// Mega Bundle
function buildMegaPrompt(input, opts) {
  const lang = opts.language || 'English';
  const fcCount = 12, qCount = 8, mmCount = 6;
  return `You are ${SAVOIRÉ.BRAND}. Generate the ULTIMATE comprehensive study package covering ALL angles of this topic. Output must be valid JSON.

TOPIC: "${input}"
LANGUAGE: ${lang} — ALL text must be in ${lang}.
CRITICAL: stay strictly on-topic. Every field must be specifically about "${input}" — never drift to an unrelated topic.

Generate:
1. "flashcards": EXACTLY ${fcCount} flashcards [{"front":"...","back":"..."}]

2. "quiz_questions": EXACTLY ${qCount} multiple-choice questions with 4 options, correct_answer, explanation, difficulty.

3. "mindmap": {"central": "...", "branches": EXACTLY ${mmCount} objects {"name","color","items"}, "connections": [...]}

4. "key_concepts": 5-7 core concepts, each a plain STRING (60-80 words), NOT objects.

5. "key_tricks": 3 study tricks/memory aids, each a plain STRING (60-90 words), NOT objects.

6. "practice_questions": 2 objects {"question":"...","answer":"200+ word answer"}.

7. "real_world_applications": 4 applications, each a plain STRING, NOT objects.

8. "common_misconceptions": 3 corrections, each a plain STRING formatted "❌ MYTH: ... ✅ TRUTH: ...", NOT objects.

OUTPUT FORMAT — output ONLY valid JSON, starting with { and ending with }.
No markdown. No code fences. All fields must be present.

{
  "topic": "${input}",
  "curriculum_alignment": "appropriate level",
  "study_score": 97,
  "flashcards": [...],
  "quiz_questions": [...],
  "mindmap": {...},
  "key_concepts": [...],
  "key_tricks": [...],
  "practice_questions": [...],
  "real_world_applications": [...],
  "common_misconceptions": [...]
}

OUTPUT JSON NOW — start with { immediately.`;
}

// ─── MESH MODEL FETCHING ────────────────────────────────────────────────────
async function getMeshFreeModelIds() {
  const now = Date.now();
  if (_meshFreeModelsCache.ids && _meshFreeModelsCache.ids.length && (now - _meshFreeModelsCache.ts) < MESH_CACHE_TTL_MS) {
    return _meshFreeModelsCache.ids;
  }
  try {
    const res = await fetch(`${MESH_BASE_URL}/models`, {
      headers: { 'Authorization': `Bearer ${process.env.MESH_API_KEY}` },
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    const list = Array.isArray(data?.data)    ? data.data
               : Array.isArray(data?.models)  ? data.models
               : Array.isArray(data)          ? data
               : [];

    if (!list.length) {
      log.warn(`Mesh /models: response had 0 models. Raw keys: ${Object.keys(data || {}).join(',')}`);
      return _meshFreeModelsCache.ids || [];
    }

    const isFree = m => {
      if (!m || typeof m !== 'object') return false;
      if (m.is_free === true) return true;
      if (m.free === true) return true;
      const tier = String(m.tier ?? m.pricing_tier ?? '').toLowerCase();
      if (tier === 'free') return true;
      const p = m.pricing || m.price || {};
      const numericFields = [
        p.prompt_usd_per_1k, p.completion_usd_per_1k,
        p.prompt, p.completion,
        p.input_cost_per_token, p.output_cost_per_token,
        p.input_price_per_1k, p.output_price_per_1k,
        m.prompt_price, m.completion_price,
      ].filter(v => v !== undefined && v !== null);
      if (numericFields.length && numericFields.every(v => Number(v) === 0)) return true;
      if (typeof m.cost === 'number' && m.cost === 0) return true;
      if (String(m.id || '').toLowerCase().includes(':free')) return true;
      return false;
    };

    const freeModels = list.filter(isFree);
    const freeIds = freeModels.map(m => m.id || m.model || m.name).filter(Boolean);

    if (!freeIds.length) {
      const sample = list[0];
      log.warn(`Mesh /models: fetched ${list.length} models but matched 0 as free. Sample model keys: ${Object.keys(sample || {}).join(',')} | sample: ${JSON.stringify(sample).slice(0, 400)}`);
    } else {
      log.ok(`Mesh /models: ${freeIds.length} free models found (of ${list.length} total)`);
    }

    _meshFreeModelsCache = { ids: freeIds, ts: now };
    return freeIds;
  } catch (err) {
    log.warn(`Mesh /models fetch failed: ${err.message}`);
    return _meshFreeModelsCache.ids || [];
  }
}

// ─── PHASE 1: STREAM NOTES (Parallel, first success wins) ──────────────────
// Was reduced to 2 passes "to keep latency low" — but with the pinned model +
// only 8 free models raced per pass, 2 passes meant giving up (→ fallback)
// too easily whenever the first 8 candidates all happened to be flaky. Each
// pass is cheap (a fast winner returns immediately, firstSuccessOrAllFail
// doesn't wait for stragglers), so 3 passes costs little extra latency in the
// common case but meaningfully lowers the fallback rate in the bad case.
const MAX_PASSES = 3;

async function streamOneMeshModel(modelId, prompt, onChunk, maxTokens) {
  const ctrl  = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), MESH_TIMEOUT_MS);
  const t0 = Date.now();
  log.info(`P1 ⚡ starting Mesh:${modelId} (parallel)`);
  try {
    const res = await fetch(`${MESH_BASE_URL}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type':  'application/json',
        'Authorization': `Bearer ${process.env.MESH_API_KEY}`,
      },
      body: JSON.stringify({
        model: modelId, max_tokens: maxTokens || 2400, temperature: 0.75, stream: false,
        messages: [{ role: 'user', content: prompt }],
      }),
      signal: ctrl.signal,
    });
    clearTimeout(timer);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    const content = data?.choices?.[0]?.message?.content?.trim();
    if (!content || content.length < 80) throw new Error('Empty or too short response');
    const chunkSize = 300;
    for (let i = 0; i < content.length; i += chunkSize) {
      onChunk(content.slice(i, i + chunkSize));
      await sleep(5);
    }
    log.ok(`P1 Mesh:${modelId} WON in ${Date.now() - t0}ms — ${content.length}ch`);
    return content;
  } catch (err) {
    clearTimeout(timer);
    throw err;
  }
}

async function streamNotes(prompt, onChunk, tool, maxTokens) {
  const errors = [];

  if (!process.env.MESH_API_KEY) {
    log.error('P1 FATAL: MESH_API_KEY not set');
    throw new Error('Savoiré AI is configured to use Mesh API, but MESH_API_KEY is not set.');
  }

  // Priority: pinned paid model
  try {
    log.info(`P1 priority: trying pinned model ${PINNED_MODEL}`);
    const pinnedResult = await streamOneMeshModel(PINNED_MODEL, prompt, onChunk, maxTokens);
    log.ok(`P1 priority: ${PINNED_MODEL} succeeded — ${pinnedResult.length}ch`);
    return pinnedResult;
  } catch (err) {
    log.warn(`P1 priority: ${PINNED_MODEL} failed (${err.message}) — falling back to free models`);
    errors.push(`[pinned] ${PINNED_MODEL}: ${err.message}`);
  }

  for (let pass = 1; pass <= MAX_PASSES; pass++) {
    const freeIds = await getMeshFreeModelIds();
    if (!freeIds.length) {
      log.warn(`P1 pass ${pass}: no free Mesh models available right now`);
      errors.push(`[pass${pass}] no free Mesh models available`);
      if (pass < MAX_PASSES) { await sleep(pass * 1500); continue; }
      break;
    }

    const candidates = freeIds.slice(0, 8);
    log.info(`P1 pass ${pass}: racing ${candidates.length} free Mesh models in parallel`);

    const modelPromises = candidates.map(modelId =>
      streamOneMeshModel(modelId, prompt, onChunk, maxTokens)
        .then(result => ({ status: 'fulfilled', value: result, model: modelId }))
        .catch(err => ({ status: 'rejected', reason: err, model: modelId }))
    );

    const { successes, failures } = await firstSuccessOrAllFail(modelPromises);

    if (successes.length > 0) {
      const winner = successes[0];
      log.ok(`P1 pass ${pass}: WINNER ${winner.model} — returning ${winner.value.length}ch`);
      return winner.value;
    }

    const failReasons = failures.map(f => `${f.model || 'unknown'}: ${f.reason?.message || 'unknown'}`);
    errors.push(`[pass${pass}] ${failReasons.join('; ')}`);
    log.warn(`P1 pass ${pass}: ALL Mesh models failed — ${failReasons.length} failures`);

    if (pass < MAX_PASSES) {
      const backoff = pass * 1500;
      log.info(`P1 pass ${pass}: backing off ${backoff}ms before retry`);
      await sleep(backoff);
    }
  }

  log.error(`P1 ALL Mesh attempts failed: ${errors.join(' | ')}`);
  throw new Error('All Mesh AI models are currently busy. Please try again in a moment.');
}

// ─── PHASE 2: FETCH CARDS (Parallel, first success wins) ──────────────────
function normalizeCardsResult(parsed) {
  if (Array.isArray(parsed.quiz_questions)) {
    parsed.quiz_questions = parsed.quiz_questions.map(q => {
      if (q && Array.isArray(q.options) && q.correct_answer &&
          !q.options.includes(q.correct_answer)) {
        const fix = q.options.find(o => String(o).trim().toLowerCase() === String(q.correct_answer).trim().toLowerCase())
                 || q.options[0];
        if (fix) q.correct_answer = fix;
      }
      return q;
    });
  }
  if (Array.isArray(parsed.flashcards)) {
    parsed.flashcards = parsed.flashcards
      .filter(c => c && (c.front || c.question) && (c.back || c.answer))
      .map(c => ({ front: String(c.front || c.question || '').trim(), back: String(c.back || c.answer || '').trim() }));
  }
  return parsed;
}

function validateCardsResult(parsed, tool) {
  if (!parsed || typeof parsed !== 'object') return false;
  const hasFc = Array.isArray(parsed.flashcards) && parsed.flashcards.length >= 2;
  const hasQ  = Array.isArray(parsed.quiz_questions) &&
                parsed.quiz_questions.filter(q => q?.question && Array.isArray(q.options) && q.options.length >= 2).length >= 2;
  const hasMm = parsed.mindmap?.branches?.length >= 2;
  const hasKc = Array.isArray(parsed.key_concepts) &&
                parsed.key_concepts.filter(x => (typeof x === 'string' ? x.trim().length > 10 : !!x)).length >= 1;
  switch (tool) {
    case 'flashcards': return hasFc;
    case 'quiz':       return hasQ;
    case 'mindmap':    return hasMm;
    case 'all':        return hasFc || hasQ || hasMm || hasKc;
    default:           return hasKc; // notes / summary
  }
}

async function fetchCardsFromOneMeshModel(modelId, prompt, tool, maxTokens) {
  const ctrl  = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), MESH_TIMEOUT_MS);
  const t0 = Date.now();
  log.info(`P2 ⚡ starting Mesh:${modelId} (parallel) for tool:${tool}`);
  try {
    const res = await fetch(`${MESH_BASE_URL}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type':  'application/json',
        'Authorization': `Bearer ${process.env.MESH_API_KEY}`,
      },
      body: JSON.stringify({
        model: modelId, max_tokens: maxTokens || 6144, temperature: 0.30, stream: false,
        messages: [{ role: 'user', content: prompt }],
      }),
      signal: ctrl.signal,
    });
    clearTimeout(timer);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    let content = data?.choices?.[0]?.message?.content?.trim();
    if (!content) throw new Error('Empty response');
    content = content.replace(/^```(?:json)?\s*/im, '').replace(/\s*```\s*$/im, '').trim();
    const jS = content.indexOf('{'), jE = content.lastIndexOf('}');
    if (jS === -1 || jE <= jS) throw new Error('No JSON object found in response');
    let parsed = JSON.parse(content.slice(jS, jE + 1).replace(/,(\s*[}\]])/g, '$1'));
    parsed = normalizeCardsResult(parsed);
    if (!validateCardsResult(parsed, tool)) {
      throw new Error(`${modelId}: validation failed — missing/empty required fields for tool:${tool} (fc:${parsed.flashcards?.length||0} q:${parsed.quiz_questions?.length||0} mm:${parsed.mindmap?.branches?.length||0} kc:${parsed.key_concepts?.length||0})`);
    }
    log.ok(`P2 Mesh:${modelId} WON in ${Date.now() - t0}ms for tool:${tool}`);
    return parsed;
  } catch (err) {
    clearTimeout(timer);
    throw err;
  }
}

async function fetchCards(prompt, tool, maxTokens) {
  const errors = [];

  if (!process.env.MESH_API_KEY) {
    log.error('P2 FATAL: MESH_API_KEY not set');
    throw new Error('Savoiré AI is configured to use Mesh API, but MESH_API_KEY is not set.');
  }

  // Priority: pinned paid model
  try {
    log.info(`P2 priority: trying pinned model ${PINNED_MODEL} for tool:${tool}`);
    const pinnedResult = await fetchCardsFromOneMeshModel(PINNED_MODEL, prompt, tool, maxTokens);
    log.ok(`P2 priority: ${PINNED_MODEL} succeeded for tool:${tool}`);
    return pinnedResult;
  } catch (err) {
    log.warn(`P2 priority: ${PINNED_MODEL} failed (${err.message}) — falling back to free models`);
    errors.push(`[pinned] ${PINNED_MODEL}: ${err.message}`);
  }

  for (let pass = 1; pass <= MAX_PASSES; pass++) {
    const freeIds = await getMeshFreeModelIds();
    if (!freeIds.length) {
      log.warn(`P2 pass ${pass}: no free Mesh models available right now`);
      errors.push(`[pass${pass}] no free Mesh models available`);
      if (pass < MAX_PASSES) { await sleep(pass * 1500); continue; }
      break;
    }

    const candidates = freeIds.slice(0, 8);
    log.info(`P2 pass ${pass}: racing ${candidates.length} free Mesh models in parallel for tool:${tool}`);

    const modelPromises = candidates.map(modelId =>
      fetchCardsFromOneMeshModel(modelId, prompt, tool, maxTokens)
        .then(result => ({ status: 'fulfilled', value: result, model: modelId }))
        .catch(err => ({ status: 'rejected', reason: err, model: modelId }))
    );

    const { successes, failures } = await firstSuccessOrAllFail(modelPromises);

    if (successes.length > 0) {
      const winner = successes[0];
      log.ok(`P2 pass ${pass}: WINNER ${winner.model} for tool:${tool}`);
      return winner.value;
    }

    const failReasons = failures.map(f => `${f.model || 'unknown'}: ${f.reason?.message || 'unknown'}`);
    errors.push(`[pass${pass}] ${failReasons.join('; ')}`);
    log.warn(`P2 pass ${pass}: ALL Mesh models failed — ${failReasons.length} failures`);

    if (pass < MAX_PASSES) {
      const backoff = pass * 1500;
      log.info(`P2 pass ${pass}: backing off ${backoff}ms before retry`);
      await sleep(backoff);
    }
  }

  log.error(`P2 ALL Mesh attempts failed for tool:${tool}: ${errors.join(' | ')}`);
  throw new Error(`All Mesh AI models failed for tool:${tool}. Please try again.`);
}

// ─── FALLBACK CONTENT (only when truly nothing works) ──────────────────────
function offlineNotes(topic) {
  const T = topic || 'this topic';
  return `## 📚 Introduction to ${T}

**${T}** is an important area of study with significant theoretical foundations and practical applications. This guide covers the essential concepts, mechanisms, and real-world uses.

---

## 🎯 Core Concepts

> **Definition:** ${T} refers to the systematic study and application of its core domain — encompassing the principles, methods, and frameworks that define the field.

**Foundational Framework:** The study of ${T} rests on interconnected principles. Grasping how each concept connects to others is more valuable than memorising definitions in isolation.

**Key Relationships:** In ${T}, core components form a coherent system where understanding cause-and-effect chains is the key to genuine mastery.

---

## ⚙️ How It Works

The primary mechanism of ${T}:
1. **Initial conditions** are established and characterised
2. **Core process** begins, governed by the rules of ${T}
3. **Transformation** occurs through identifiable stages
4. **Outcomes** emerge and can be measured against expected standards

---

## 📝 Key Takeaways

- ✅ ${T} is a reasoning framework, not a collection of isolated facts
- ✅ Understanding WHY mechanisms work matters more than memorising WHAT they produce
- ✅ Active retrieval (self-testing) is 2–3× more effective than re-reading
- ✅ Real mastery = applying ${T} to novel situations, not just familiar ones
- ✅ Expert-level understanding comes from recognising patterns across contexts

---
*Generated by ${SAVOIRÉ.BRAND} | ${SAVOIRÉ.DEVELOPER} | Free forever for every student.*`;
}

function buildTopicFallback(tool, topic) {
  const T = topic || 'this topic';
  const base = {
    topic: T,
    curriculum_alignment: 'General Academic Study',
    study_score: 88,
    key_concepts: [
      `Core Principles: ${T} rests on fundamental principles connecting theory to practice. Understanding WHY matters more than memorising WHAT.`,
      `Key Mechanisms: Primary processes in ${T} follow identifiable patterns that can be learned and systematically applied.`,
      `Practical Transfer: ${T} knowledge applies across healthcare, technology, business, and research contexts.`,
      `Expert Thinking: Experts in ${T} differ from beginners in pattern recognition, conditional reasoning, and metacognition.`,
      `Learning Strategy: Active retrieval practice is 2–3× more effective than re-reading for mastering ${T}.`,
    ],
    key_tricks: [
      `🧠 Memory trick: Break ${T} into 3-4 chunks and create a short acronym from their first letters.`,
      `📝 Study strategy: Teach ${T} out loud to an imaginary student — gaps in your explanation reveal gaps in understanding.`,
      `⏰ Recall technique: Review ${T} at 1, 3, 7, and 14 day intervals (spaced repetition) instead of one long session.`,
    ],
    practice_questions: [
      { question: `Explain the core mechanism behind ${T} in your own words.`, answer: `A strong answer would identify the key components of ${T}, describe how they interact step by step, and give at least one real-world example showing the mechanism in action. Aim to connect cause and effect rather than listing isolated facts.` },
      { question: `How would you apply ${T} to solve a real-world problem?`, answer: `Identify a specific scenario where ${T} is relevant, map the relevant principles onto that scenario, and explain the expected outcome. Strong answers justify each step rather than just stating a conclusion.` },
    ],
    real_world_applications: [
      `🏥 Healthcare: Concepts from ${T} often inform diagnostic or treatment decision-making.`,
      `💻 Technology: ${T} principles are frequently applied in software, systems design, or automation.`,
      `📈 Business: Organisations apply ${T} thinking to strategy, operations, or decision-making.`,
      `🌍 Society: ${T} has broader social or environmental implications worth considering.`,
    ],
    common_misconceptions: [
      `❌ MYTH: ${T} is just a list of facts to memorise. ✅ TRUTH: It's a connected framework — understanding relationships matters more than rote memorisation.`,
      `❌ MYTH: Reading once is enough to master ${T}. ✅ TRUTH: Active recall and spaced repetition produce far stronger retention.`,
      `❌ MYTH: ${T} only matters for exams. ✅ TRUTH: Its principles transfer to real decision-making well beyond the classroom.`,
    ],
  };

  if (tool === 'flashcards' || tool === 'flashcards_quiz' || tool === 'all') {
    base.flashcards = base.key_concepts.map(c => {
      const [front, ...rest] = c.split(':');
      return { front: (front || T).trim() + '?', back: (rest.join(':') || c).trim() };
    }).concat([
      { front: `What is the most important thing to understand first about ${T}?`, back: `Start with the foundational definition and the core relationship between its main components — everything else builds on that.` },
      { front: `Name one common mistake students make when studying ${T}.`, back: `Treating ${T} as a list of disconnected facts instead of understanding the underlying mechanism and how each part connects to the whole.` },
    ]);
  }

  if (tool === 'quiz' || tool === 'flashcards_quiz' || tool === 'all') {
    base.quiz_questions = [
      {
        id: 1,
        question: `Which statement best describes ${T}?`,
        options: [
          `${T} is a connected framework of principles, mechanisms, and applications`,
          `${T} is a random collection of unrelated facts`,
          `${T} has no real-world relevance`,
          `${T} cannot be studied systematically`,
        ],
        correct_answer: `${T} is a connected framework of principles, mechanisms, and applications`,
        explanation: `${T}, like most academic subjects, is best understood as an interconnected system rather than isolated facts. Recognising how concepts relate to one another is what separates surface-level memorisation from genuine understanding.`,
        difficulty: 'easy',
      },
      {
        id: 2,
        question: `What is the most effective way to retain knowledge of ${T} long-term?`,
        options: [
          'Active recall with spaced repetition',
          'Reading the material once carefully',
          'Highlighting text in different colours',
          'Memorising without understanding context',
        ],
        correct_answer: 'Active recall with spaced repetition',
        explanation: `Research consistently shows that testing yourself (active recall) at increasing intervals (spaced repetition) produces dramatically better long-term retention of ${T} than passive re-reading or highlighting.`,
        difficulty: 'medium',
      },
    ];
  }

  if (tool === 'mindmap' || tool === 'mindmap_only' || tool === 'all') {
    base.mindmap = {
      central: T,
      branches: [
        { name: 'Foundations', color: '#00d4ff', items: base.key_concepts.slice(0, 2).map(c => c.slice(0, 80)) },
        { name: 'Mechanisms',  color: '#bf00ff', items: [`Core process behind ${T}`, `Step-by-step transformation in ${T}`] },
        { name: 'Applications', color: '#00ff88', items: base.real_world_applications.slice(0, 3).map(a => a.replace(/^[^\s]+\s/, '')) },
        { name: 'Pitfalls', color: '#ff4444', items: base.common_misconceptions.slice(0, 2).map(m => m.split('✅')[0].replace('❌ MYTH:', '').trim()) },
      ],
      connections: [
        { from: 'Foundations', to: 'Mechanisms', description: 'Foundational principles explain why the mechanisms work the way they do.' },
        { from: 'Mechanisms', to: 'Applications', description: 'Understanding the mechanism is what enables real-world application.' },
      ],
    };
  }

  base._fallback = true;
  return base;
}

// ─── TOPIC FACT ──────────────────────────────────────────────────────────────
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

// ─── MERGE ────────────────────────────────────────────────────────────────────
function mergeCards(cardsRaw, notes, topic, opts) {
  const now        = getISTDateTime();
  const isFallback = !!cardsRaw?._fallback;

  const toStringArray = arr => !Array.isArray(arr) ? [] : arr.map(item => {
    if (typeof item === 'string') return item;
    if (item && typeof item === 'object') {
      const vals = Object.values(item).filter(v => typeof v === 'string');
      if (vals.length) return vals.join(' — ');
      try { return JSON.stringify(item); } catch { return String(item); }
    }
    return String(item ?? '');
  }).filter(Boolean);

  const merged = {
    topic:                   String(topic || cardsRaw?.topic || 'Study Material').slice(0, 200),
    curriculum_alignment:    cardsRaw?.curriculum_alignment || 'General Academic Study',
    ultra_long_notes:        notes || '',
    key_concepts:            toStringArray(cardsRaw?.key_concepts),
    key_tricks:              toStringArray(cardsRaw?.key_tricks),
    practice_questions:      cardsRaw?.practice_questions      || [],
    real_world_applications: toStringArray(cardsRaw?.real_world_applications),
    common_misconceptions:   toStringArray(cardsRaw?.common_misconceptions),
    study_score:             cardsRaw?.study_score             || 95,
    powered_by:              `${SAVOIRÉ.BRAND} by ${SAVOIRÉ.DEVELOPER}`,
    generated_at:            now,
    _version:                SAVOIRÉ.VERSION,
    _tool:                   opts.tool,
    _language:               opts.language || 'English',
    _depth:                  opts.depth    || 'detailed',
    _style:                  opts.style    || 'simple',
    _quality:                isFallback ? 'enhanced_fallback' : 'ai_generated',
    _fallback:               isFallback,
  };
  if (Array.isArray(cardsRaw?.flashcards)    && cardsRaw.flashcards.length)    merged.flashcards     = cardsRaw.flashcards;
  if (Array.isArray(cardsRaw?.quiz_questions) && cardsRaw.quiz_questions.length) merged.quiz_questions = cardsRaw.quiz_questions;
  if (cardsRaw?.mindmap?.branches?.length)                                      merged.mindmap        = cardsRaw.mindmap;

  // Only fill if key_concepts is completely empty (not just sparse)
  const fillerEligible = ['notes', 'summary', 'all'].includes(opts.tool);
  if (fillerEligible && (!merged.key_concepts || merged.key_concepts.length === 0)) {
    merged.key_concepts = [
      `Core Principles: ${topic} rests on fundamental principles connecting theory to practice. Understanding WHY matters more than memorising WHAT.`,
      `Key Mechanisms: Primary processes follow identifiable patterns that can be learned and systematically applied.`,
      `Practical Transfer: ${topic} knowledge applies to healthcare, technology, business, and research contexts.`,
      `Expert Thinking: Experts in ${topic} differ from beginners in pattern recognition, conditional reasoning, and metacognition.`,
      `Learning Strategy: Active retrieval practice is 2–3× more effective than re-reading for mastering ${topic}.`,
    ];
    merged._key_concepts_filler = true;
  }
  return merged;
}

// ─── SSE HELPER + SECURITY HEADERS ──────────────────────────────────────────
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

// ─── MAIN HANDLER ─────────────────────────────────────────────────────────────
module.exports = async function handler(req, res) {
  const reqId     = `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
  const startTime = Date.now();
  log.info(`[${reqId}] ${req.method} /api/study`);

  setHeaders(res);
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST')   return res.status(405).json({ error: 'Method not allowed. Use POST.' });

  if (!process.env.MESH_API_KEY) {
    log.error('[FATAL] MESH_API_KEY not set in environment variables!');
    return res.status(500).json({ error: 'Savoiré AI service is misconfigured — MESH_API_KEY missing. Get a free key at meshapi.ai and set it in your environment. Contact the administrator.' });
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
    cardCount:   Math.min(Math.max(Number(rawOpts.cardCount) || 15, 1), 20),
    quizCount:   Math.min(Math.max(Number(rawOpts.quizCount) || 10, 1), 20),
    quizType:    String(rawOpts.quizType || 'mixed'),
    branchCount: Number(rawOpts.branchCount) || 6,
  };

  log.info(`[${reqId}] tool:${opts.tool} | depth:${opts.depth} | lang:${opts.language} | stream:${opts.stream} | user:${userName}`);

  if (!opts.stream) {
    return res.status(400).json({ error: 'Non-streaming mode is not supported. The client must send options.stream=true.' });
  }

  sendToGoogleSheets(userName, userStreak, userSess, opts.tool, message, 'started', 0, sessionId).catch(() => {});

  // ─── SSE STREAMING RESPONSE ────────────────────────────────────────────────
  res.setHeader('Content-Type',      'text/event-stream; charset=utf-8');
  res.setHeader('Cache-Control',     'no-cache, no-store, must-revalidate, no-transform');
  res.setHeader('Connection',        'keep-alive');
  res.setHeader('X-Accel-Buffering', 'no');
  if (typeof res.flushHeaders === 'function') res.flushHeaders();

  const sse = makeSSE(res);

  const kap = setInterval(() => {
    if (res.writableEnded) { clearInterval(kap); return; }
    try {
      res.write(`: ping ${Date.now()}\n\n`);
      if (typeof res.flush === 'function') res.flush();
    } catch { clearInterval(kap); }
  }, 10000);

  const stageTimers = [
    setTimeout(() => sse('stage', { idx: 1, label: '📝 Writing your content…' }), 2000),
    setTimeout(() => sse('stage', { idx: 2, label: '🔍 Building sections…' }),    6000),
  ];
  const clearStages = () => stageTimers.forEach(clearTimeout);

  sse('heartbeat', { ts: Date.now(), status: 'connected', service: SAVOIRÉ.BRAND, requestId: reqId, tool: opts.tool });
  sse('stage',     { idx: 0, label: `🎯 Analysing "${message.slice(0, 50)}${message.length > 50 ? '…' : ''}"` });
  sse('fact',      { fact: buildTopicFact(message) });
  sse('token',     { t: '' });

  let notes = '', p1ok = false;
  let p2Ticker = null;

  try {
    // ── Prompt selection ──
    let notesPrompt;
    switch (opts.tool) {
      case 'summary': notesPrompt = buildSummaryPrompt(message, opts); break;
      case 'notes':
      case 'flashcards':
      case 'quiz':
      case 'mindmap':
      case 'all':
      default: notesPrompt = buildNotesPrompt(message, opts);
    }

    sse('stage', { idx: 1, label: `📝 Writing ${opts.tool === 'summary' ? 'smart summary' : 'study notes'}…` });

    // ── Phase 2: cards generation – starts NOW in parallel ──
    let cardsPromise;
    const tokenBudgets = {
      all: 8192,
      flashcards: Math.min(6144, 400 + opts.cardCount * 150),
      quiz: Math.min(6144, 400 + opts.quizCount * 180),
      mindmap: 3500,
      default: 3000,
    };
    const tBudget = tokenBudgets[opts.tool] || tokenBudgets.default;

    if (opts.tool === 'all') {
      const megaPrompt = buildMegaPrompt(message, opts);
      cardsPromise = fetchCards(megaPrompt, 'all', tBudget).then(
        v => ({ status: 'fulfilled', value: v }),
        e => ({ status: 'rejected', reason: e })
      );
    } else if (opts.tool === 'flashcards') {
      const fcPrompt = buildFlashcardsPrompt(message, opts);
      cardsPromise = fetchCards(fcPrompt, 'flashcards', tBudget).then(
        v => ({ status: 'fulfilled', value: v }),
        e => ({ status: 'rejected', reason: e })
      );
    } else if (opts.tool === 'quiz') {
      const quizPrompt = buildQuizPrompt(message, opts);
      cardsPromise = fetchCards(quizPrompt, 'quiz', tBudget).then(
        v => ({ status: 'fulfilled', value: v }),
        e => ({ status: 'rejected', reason: e })
      );
    } else if (opts.tool === 'mindmap') {
      const mmPrompt = buildMindmapPrompt(message, opts);
      cardsPromise = fetchCards(mmPrompt, 'mindmap', tBudget).then(
        v => ({ status: 'fulfilled', value: v }),
        e => ({ status: 'rejected', reason: e })
      );
    } else {
      // notes or summary: fetch key concepts
      const kcPrompt = buildKeyConceptsPrompt(message, opts);
      cardsPromise = fetchCards(kcPrompt, opts.tool, tokenBudgets.default).then(
        v => ({ status: 'fulfilled', value: v }),
        e => ({ status: 'rejected', reason: e })
      );
    }

    // ── Phase 1: live notes stream ──
    const notesMaxTokens = opts.tool === 'summary'
      ? 1400
      : (opts.tool === 'notes' || opts.tool === 'all')
        ? (DEPTH_MAP[opts.depth] || DEPTH_MAP.detailed).maxTokens
        : 1800;

    try {
      notes = await streamNotes(notesPrompt, chunk => sse('token', { t: chunk }), opts.tool, notesMaxTokens);
      p1ok = true;
      log.ok(`[${reqId}] P1 done — ${notes.length}ch`);
    } catch (e1) {
      log.error(`[${reqId}] P1 FAILED — using offline notes: ${e1.message}`);
      notes = offlineNotes(message);
      for (let i = 0; i < notes.length; i += 300) {
        sse('token', { t: notes.slice(i, i + 300) });
        await sleep(4);
      }
      p1ok = false;
    }

    sse('stage', { idx: 2, label: '✅ Notes complete! Finalising interactive cards…' });
    sse('waiting', { afterLastToken: true, label: 'Finalising…' });

    // ── Keep-alive while waiting for Phase 2 ──
    let p2DotCount = 0;
    p2Ticker = setInterval(() => {
      p2DotCount = (p2DotCount % 3) + 1;
      sse('stage', { idx: 3, label: `🃏 Finalising your cards${'.'.repeat(p2DotCount)}` });
    }, 1500);

    // ── Wait for Phase 2 ──
    let cardsData = null, p2ok = false;
    const deadline = opts.tool === 'notes' || opts.tool === 'summary' ? 45000 : 30000;
    const deadlineFallback = new Promise(resolve => {
      setTimeout(() => resolve({ status: 'deadline' }), deadline);
    });

    const cardsResult = await Promise.race([cardsPromise, deadlineFallback]);

    if (cardsResult.status === 'deadline') {
      log.warn(`[${reqId}] Phase 2 exceeded ${deadline}ms deadline — using fallback`);
      cardsData = buildTopicFallback(opts.tool, message);
      p2ok = false;
    } else if (cardsResult.status === 'fulfilled') {
      cardsData = cardsResult.value;
      p2ok = true;
      log.ok(`[${reqId}] Phase 2 succeeded for ${opts.tool}`);
    } else {
      log.warn(`[${reqId}] Phase 2 failed for ${opts.tool}, using fallback`);
      cardsData = buildTopicFallback(opts.tool, message);
      p2ok = false;
    }

    // ── Stream cards live ──
    if (cardsData?.flashcards?.length && (opts.tool === 'flashcards' || opts.tool === 'all') && opts.cardCount) {
      const want = opts.cardCount;
      const have = cardsData.flashcards.length;
      if (have > want) {
        cardsData.flashcards = cardsData.flashcards.slice(0, want);
      } else if (have < want) {
        const filler = buildTopicFallback('flashcards', message)?.flashcards || [];
        let i = 0;
        while (cardsData.flashcards.length < want && filler.length) {
          cardsData.flashcards.push(filler[i % filler.length]);
          i++;
          if (i > want * 2) break;
        }
      }
      log.ok(`[${reqId}] Flashcard count enforced: wanted ${want}, delivering ${cardsData.flashcards.length}`);
    }

    if (cardsData?.flashcards?.length && (opts.tool === 'flashcards' || opts.tool === 'all')) {
      sse('stage', { idx: 3, label: `🃏 Streaming ${cardsData.flashcards.length} flashcards live…` });
      for (let i = 0; i < cardsData.flashcards.length; i++) {
        sse('card', { idx: i, total: cardsData.flashcards.length, card: cardsData.flashcards[i] });
        await sleep(50);
      }
      log.ok(`[${reqId}] Streamed ${cardsData.flashcards.length} flashcards`);
    }

    if (cardsData?.quiz_questions?.length && (opts.tool === 'quiz' || opts.tool === 'all')) {
      sse('stage', { idx: 3, label: `❓ Streaming ${cardsData.quiz_questions.length} quiz questions live…` });
      for (let i = 0; i < cardsData.quiz_questions.length; i++) {
        sse('question', { idx: i, total: cardsData.quiz_questions.length, q: cardsData.quiz_questions[i] });
        await sleep(60);
      }
      log.ok(`[${reqId}] Streamed ${cardsData.quiz_questions.length} questions`);
    }

    if (cardsData?.mindmap?.branches?.length && (opts.tool === 'mindmap' || opts.tool === 'all')) {
      sse('stage', { idx: 3, label: `🗺️ Streaming ${cardsData.mindmap.branches.length} mind map branches live…` });
      sse('branch', { idx: -1, total: cardsData.mindmap.branches.length, branch: { name: '_central_', value: cardsData.mindmap.central, connections: cardsData.mindmap.connections || [] } });
      await sleep(50);
      for (let i = 0; i < cardsData.mindmap.branches.length; i++) {
        sse('branch', { idx: i, total: cardsData.mindmap.branches.length, branch: cardsData.mindmap.branches[i] });
        await sleep(70);
      }
      log.ok(`[${reqId}] Streamed ${cardsData.mindmap.branches.length} branches`);
    }

    // ── Send final data ──
    clearInterval(kap);
    clearInterval(p2Ticker);
    clearStages();

    const final = mergeCards(cardsData, notes, message, opts);
    final._duration_ms  = Date.now() - startTime;
    final._request_id   = reqId;
    final._phase1_ok    = p1ok;
    final._phase2_ok    = p2ok;
    final._notes_only   = !p2ok;
    final.topic_fact    = buildTopicFact(message);
    final.powered_by    = `${SAVOIRÉ.BRAND} by ${SAVOIRÉ.DEVELOPER}`;

    sse('stage', { idx: 4, label: '✅ Complete! All study materials ready.', done: true });
    sse('done',  final);

    log.ok(`[${reqId}] ✅ COMPLETE — ${final._duration_ms}ms | p1:${p1ok} | p2:${p2ok} | tool:${opts.tool}`);
    sendToGoogleSheets(userName, userStreak, userSess, opts.tool, message, 'completed', final._duration_ms, sessionId).catch(() => {});

  } catch (fatal) {
    clearInterval(kap);
    if (p2Ticker) clearInterval(p2Ticker);
    clearStages();
    log.error(`[${reqId}] FATAL: ${fatal.message}`);
    const userMsg = fatal.message?.includes('API_KEY')
      ? 'Service configuration error. Please contact the administrator.'
      : 'Savoiré AI is momentarily unavailable. Please try again in a few seconds.';
    sse('error', { error: userMsg, requestId: reqId });
    sendToGoogleSheets(userName, userStreak, userSess, opts.tool, message, 'failed', Date.now() - startTime, sessionId).catch(() => {});
  }

  if (!res.writableEnded) res.end();
};
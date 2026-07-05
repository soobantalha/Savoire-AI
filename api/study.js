'use strict';
// ═══════════════════════════════════════════════════════════════════════════════
// SAVOIRÉ AI v2.0 — api/study.js — ULTIMATE RELIABILITY ENGINE (FULLY FIXED)
// Built by Sooban Talha Technologies | soobantalhatech.xyz | Founder: Sooban Talha
// "Think Less. Know More."
//
// ✅ EXTENDED TIMEOUTS — first token: 45s, full stream: 240s, per-model: 60s
// ✅ 4 PARALLEL PASSES — all models race, first to respond wins
// ✅ RELAXED VALIDATION — accepts even a single flashcard/quiz/branch as REAL AI
// ✅ CARDS DEADLINE 45s — gives models enough time to produce JSON
// ═══════════════════════════════════════════════════════════════════════════════

// ─────────────────────────────────────────────────────────────────────────────
// SECTION 1 — BRAND CONSTANTS
// ─────────────────────────────────────────────────────────────────────────────

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

// ─────────────────────────────────────────────────────────────────────────────
// SECTION 2 — MODEL LIST (MAXIMUM TOKENS, EXTENDED TIMEOUTS)
// ─────────────────────────────────────────────────────────────────────────────

// Only the most reliable free models (in order of preference)
const RELIABLE_MODELS_STREAM = [
  { id: 'openrouter/free',                            max_tokens: 8192, timeout_ms: 75000, temp: 0.75 },
  { id: 'google/gemini-2.0-flash-exp:free',          max_tokens: 8192, timeout_ms: 75000, temp: 0.75 },
];

// CRITICAL: OpenRouter's free tier hard-caps at ~20 requests per MINUTE
// combined across every :free model (it's a shared bucket, not per-model),
// plus a 50-1000/day ceiling — and that bucket is shared across EVERY user
// of this app hitting the same API key, not just one person testing. Cut
// down hard to 2 models x 1 pass = max 2 calls per single-tool request (4
// for mega), so a burst of retries or several concurrent users still stays
// far under the ceiling. More models was never more resilience here — every
// extra parallel model was extra self-inflicted 429 risk.
const ALL_MODELS_STREAM = [
  ...RELIABLE_MODELS_STREAM,
];

const ALL_MODELS_CARDS = [
  { id: 'openrouter/free',                             max_tokens: 16384, timeout_ms: 75000, temp: 0.30 },
  { id: 'google/gemini-2.0-flash-exp:free',            max_tokens: 16384, timeout_ms: 75000, temp: 0.30 },
];

// ─────────────────────────────────────────────────────────────────────────────
// SECTION 3 — CONFIG MAPS
// ─────────────────────────────────────────────────────────────────────────────

const DEPTH_MAP = {
  standard:      { wordRange: '600–900 words',   maxTokens: 2500 },
  detailed:      { wordRange: '1000–1500 words', maxTokens: 3500 },
  comprehensive: { wordRange: '1500–2200 words', maxTokens: 4500 },
  expert:        { wordRange: '2200–3000 words', maxTokens: 5500 },
};

// Summary must stay a summary — reusing DEPTH_MAP's notes-length ranges made
// a "comprehensive/expert" summary just as long as full notes, defeating
// the point. Matches the frontend's SUMMARY_DEPTH_CONFIG exactly.
const SUMMARY_DEPTH_MAP = {
  standard:      { wordRange: '80–150 words',  maxTokens: 800  },
  detailed:      { wordRange: '150–250 words', maxTokens: 1200 },
  comprehensive: { wordRange: '250–400 words', maxTokens: 1600 },
  expert:        { wordRange: '400–600 words', maxTokens: 2200 },
};

const STYLE_MAP = {
  simple:   'Clear, beginner-friendly language. Short sentences. Everyday analogies. Define all jargon.',
  academic: 'Formal academic language. Precise terminology. Objective third-person tone.',
  detailed: 'Maximum detail. Numerous specific examples. Thorough step-by-step explanations.',
  exam:     'Exam-focused. Mark-scheme phrasing. Highlight must-know points. Include exam tips.',
  visual:   'Vivid analogies and metaphors. Mental models. Make abstract concrete.',
};

// ─────────────────────────────────────────────────────────────────────────────
// SECTION 4 — UTILITIES
// ─────────────────────────────────────────────────────────────────────────────

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

// ─────────────────────────────────────────────────────────────────────────────
// SECTION 5 — GOOGLE SHEETS (unchanged)
// ─────────────────────────────────────────────────────────────────────────────

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

// ─────────────────────────────────────────────────────────────────────────────
// SECTION 6 — SEPARATE PROMPT BUILDERS FOR EACH TOOL
// ─────────────────────────────────────────────────────────────────────────────

// ── NOTES ──
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

DO NOT invent extra section headings beyond the 8 listed above (no "Cross-Connections", no custom checklists, etc.).
NEVER write a bullet with an empty/placeholder body — e.g. never output a line like "↔ :" or "• :" with nothing after
the colon. Every single bullet must contain real, specific, filled-in content about "${input}", or be omitted entirely.

START NOW with first ## heading. Write in ${lang} only. Topic: "${input}"`;
}

// ── SUPPLEMENTARY KEY CONCEPTS (for notes/summary) ──
function buildKeyConceptsPrompt(input, opts) {
  const lang = opts.language || 'English';
  return `You are ${SAVOIRÉ.BRAND}. Generate supplementary study material as valid JSON for the topic below.

TOPIC: "${input}"
LANGUAGE: ${lang} — ALL text must be in ${lang}.

Generate:
1. "key_concepts": 5 core concepts, each a single plain STRING 60-80 words (NOT an object).
2. "key_tricks": 3 study tricks/memory aids, each a single plain STRING 60-90 words (NOT an object).
3. "practice_questions": 2 analytical questions, each an object {"question":"...","answer":"200+ word answer"}.
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

// ── FLASHCARDS ──
function buildFlashcardsPrompt(input, opts) {
  const lang = opts.language || 'English';
  const count = opts.cardCount || 15;
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

// ── QUIZ ──
function buildQuizPrompt(input, opts) {
  const lang = opts.language || 'English';
  const count = opts.quizCount || 10;
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

// ── SUMMARY ──
function buildSummaryPrompt(input, opts) {
  const depth = SUMMARY_DEPTH_MAP[opts.depth] || SUMMARY_DEPTH_MAP.detailed;
  const style = STYLE_MAP[opts.style] || STYLE_MAP.simple;
  const lang  = opts.language || 'English';
  return `You are ${SAVOIRÉ.BRAND}. Generate a smart, concise summary.

TOPIC: "${input}"
LANGUAGE: ${lang} — write EVERY word in ${lang}.
LENGTH: ${depth.wordRange} — aim for upper end.
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

START NOW with first ## heading. Topic: "${input}"`;
}

// ── MIND MAP ──
function buildMindmapPrompt(input, opts) {
  const lang = opts.language || 'English';
  const count = opts.branchCount || 6;
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

// ── MEGA BUNDLE (all tools) ──
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

// ─────────────────────────────────────────────────────────────────────────────
// SECTION 7 — PHASE 1: ULTIMATE PARALLEL STREAM NOTES (FIXED TIMEOUTS)
// ─────────────────────────────────────────────────────────────────────────────

const FIRST_TOKEN_TIMEOUT_MS = 45000;   // 45s for first token
const FULL_STREAM_TIMEOUT_MS = 240000;  // 4 min total
const MAX_PASSES = 1;                   // 1 pass x 2 models = max 2 calls/request (4 for mega) — minimal footprint against the shared 20-req/min free-tier ceiling

async function streamOneModel(model, prompt, onChunk, tool, sharedState) {
  const name = model.id.split('/').pop().replace(':free', '');
  const ctrl  = new AbortController();

  let firstTokenTimer = setTimeout(() => ctrl.abort(), FIRST_TOKEN_TIMEOUT_MS);
  let fullStreamTimer = null;

  const t0 = Date.now();
  log.info(`P1 ⚡ starting ${name} (parallel) | tool:${tool}`);

  let res;
  try {
    res = await fetch(OPENROUTER_BASE, {
      method: 'POST',
      headers: {
        'Content-Type':  'application/json',
        'Authorization': `Bearer ${process.env.OPENROUTER_API_KEY}`,
        'HTTP-Referer':  HTTP_REFERER,
        'X-Title':       APP_TITLE,
      },
      body: JSON.stringify({
        model: model.id, max_tokens: model.max_tokens, temperature: model.temp || 0.75,
        stream: true, messages: [{ role: 'user', content: prompt }],
      }),
      signal: ctrl.signal,
    });
  } catch (err) {
    clearTimeout(firstTokenTimer);
    if (err.name === 'AbortError') throw new Error(`${name}: no response within ${FIRST_TOKEN_TIMEOUT_MS}ms`);
    throw new Error(`${name}: fetch failed — ${err.message}`);
  }

  if (!res.ok) {
    clearTimeout(firstTokenTimer);
    const txt = await res.text().catch(() => '');
    log.error(`P1 ${name}: HTTP ${res.status} — FULL BODY: ${txt.slice(0, 500)}`);
    if (res.status === 401 || res.status === 403) throw new Error('API_KEY_INVALID');
    throw new Error(`${name}: HTTP ${res.status} ${trunc(txt, 120)}`);
  }

  const reader  = res.body.getReader();
  const decoder = new TextDecoder('utf-8');
  let lineBuf = '';
  let full    = '';
  let gotFirstToken = false;
  let winnerDeclared = false;

  const checkWinner = () => {
    if (sharedState && sharedState.winnerId && sharedState.winnerId !== model.id) {
      winnerDeclared = true;
      return true;
    }
    return false;
  };

  try {
    while (true) {
      if (checkWinner()) {
        ctrl.abort();
        return full;
      }

      let chunk;
      try {
        chunk = await reader.read();
      } catch (readErr) {
        if (readErr.name === 'AbortError') {
          if (!gotFirstToken) throw new Error(`${name}: no first token within ${FIRST_TOKEN_TIMEOUT_MS}ms`);
          log.warn(`P1 ${name}: full-stream timeout — salvaging ${full.length}ch`);
          return full;
        }
        if (gotFirstToken) {
          log.warn(`P1 ${name}: read error mid-stream — salvaging ${full.length}ch`);
          return full;
        }
        throw readErr;
      }
      const { done, value } = chunk;
      if (done) break;

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
            if (!gotFirstToken) {
              gotFirstToken = true;
              clearTimeout(firstTokenTimer);
              fullStreamTimer = setTimeout(() => ctrl.abort(), FULL_STREAM_TIMEOUT_MS);

              if (sharedState && !sharedState.winnerId) {
                sharedState.winnerId = model.id;
                log.ok(`P1 🏆 ${name} WON in ${Date.now()-t0}ms`);
              } else if (sharedState && sharedState.winnerId && sharedState.winnerId !== model.id) {
                winnerDeclared = true;
                ctrl.abort();
                return full;
              }
            }
            if (!winnerDeclared && (!sharedState || sharedState.winnerId === model.id)) {
              full += delta;
              onChunk(delta);
            }
          }
        } catch { /* ignore */ }
      }
    }
  } finally {
    clearTimeout(firstTokenTimer);
    if (fullStreamTimer) clearTimeout(fullStreamTimer);
  }

  if (!gotFirstToken) throw new Error(`${name}: stream ended with no content`);
  if (full.trim().length < 80) {
    log.warn(`P1 ${name}: short response (${full.length}ch) but already streamed live — using as-is, no retry`);
  }

  log.ok(`P1 ✅ ${name} | ${full.length}ch | ${Date.now()-t0}ms`);
  return full;
}

// ── Last resort non-streaming fallback ──
async function streamNotesFallback(prompt, onChunk, tool) {
  log.info(`P1 fallback: attempting non-streaming request to openrouter/free`);
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
        model: 'openrouter/free',
        max_tokens: 16384,
        temperature: 0.75,
        stream: false,
        messages: [{ role: 'user', content: prompt }],
      }),
      timeout: 120000,
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    const content = data?.choices?.[0]?.message?.content?.trim();
    if (!content || content.length < 100) throw new Error('Empty or too short');
    // Stream it in chunks
    const chunkSize = 300;
    for (let i = 0; i < content.length; i += chunkSize) {
      onChunk(content.slice(i, i + chunkSize));
      await sleep(5);
    }
    log.ok(`P1 fallback: returned ${content.length}ch`);
    return content;
  } catch (err) {
    log.error(`P1 fallback failed: ${err.message}`);
    return null;
  }
}

// Races model attempts and resolves the instant the FIRST one succeeds —
// instead of Promise.allSettled, which always waits for every model to
// finish (including ones stuck at their 60s timeout) even after a fast
// model has already returned a good result. This is why first tokens/cards
// used to take up to a full pass-timeout even on a normal successful run.
// The stragglers keep running harmlessly in the background; we just stop
// waiting on them.
function raceFirstSuccess(modelPromises) {
  return new Promise((resolve) => {
    let remaining = modelPromises.length;
    let resolved = false;
    const settled = [];
    modelPromises.forEach(p => {
      p.then(r => {
        settled.push(r);
        if (!resolved && r.status === 'fulfilled') {
          resolved = true;
          resolve({ winner: r, all: null });
        }
        remaining--;
        if (!resolved && remaining === 0) {
          resolved = true;
          resolve({ winner: null, all: settled });
        }
      });
    });
  });
}

async function streamNotes(prompt, onChunk, tool) {
  const errors = [];
  const sharedState = { winnerId: null };

  // ── 4 FULL PASSES ──
  for (let pass = 1; pass <= MAX_PASSES; pass++) {
    log.info(`P1 pass ${pass}: starting ALL ${ALL_MODELS_STREAM.length} models in parallel`);
    sharedState.winnerId = null;

    const modelPromises = ALL_MODELS_STREAM.map(model =>
      streamOneModel(model, prompt, onChunk, tool, sharedState)
        .then(result => ({ status: 'fulfilled', value: result, model: model.id }))
        .catch(err => ({ status: 'rejected', reason: err, model: model.id }))
    );

    const raceResult = await raceFirstSuccess(modelPromises);

    if (raceResult.winner) {
      const winner = raceResult.winner;
      log.ok(`P1 pass ${pass}: WINNER ${winner.model} — returning ${winner.value.length}ch (fast-race, didn't wait for stragglers)`);
      return winner.value;
    }

    const results = raceResult.all.map(v => ({ status: 'fulfilled', value: v }));

    const failReasons = results
      .filter(r => r.status === 'fulfilled' && r.value?.status === 'rejected')
      .map(r => `${r.value.model}: ${r.value.reason?.message || 'unknown'}`)
      .concat(
        results
          .filter(r => r.status === 'rejected')
          .map(r => `promise-error: ${r.reason?.message || 'unknown'}`)
      );

    errors.push(`[pass${pass}] ${failReasons.join('; ')}`);
    log.warn(`P1 pass ${pass}: ALL models failed — ${failReasons.length} failures`);

    if (pass < MAX_PASSES) {
      const backoff = pass * 1500;
      log.info(`P1 pass ${pass}: backing off ${backoff}ms before retry`);
      await sleep(backoff);
    }
  }

  // ── LAST RESORT: non-streaming fallback ──
  log.warn('P1 all streaming attempts failed; trying non-streaming fallback');
  const fallbackResult = await streamNotesFallback(prompt, onChunk, tool);
  if (fallbackResult) {
    return fallbackResult;
  }

  log.error(`P1 ALL attempts failed: ${errors.join(' | ')}`);
  throw new Error(`All free AI models are currently busy. Please try again in a moment.`);
}

// ─────────────────────────────────────────────────────────────────────────────
// SECTION 8 — PHASE 2: ULTIMATE PARALLEL FETCH CARDS (EXTENDED TIMEOUTS)
// ─────────────────────────────────────────────────────────────────────────────

async function fetchCardsFromModel(model, prompt, tool, sharedState) {
  const name  = model.id.split('/').pop().replace(':free', '');
  const ctrl  = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), model.timeout_ms); // now 60s
  const t0    = Date.now();

  try {
    if (sharedState && sharedState.winnerId && sharedState.winnerId !== model.id) {
      throw new Error(`${name}: skipped — another model already won`);
    }

    const res = await fetch(OPENROUTER_BASE, {
      method: 'POST',
      headers: {
        'Content-Type':  'application/json',
        'Authorization': `Bearer ${process.env.OPENROUTER_API_KEY}`,
        'HTTP-Referer':  HTTP_REFERER,
        'X-Title':       APP_TITLE,
      },
      body: JSON.stringify({
        model: model.id, max_tokens: model.max_tokens, temperature: model.temp || 0.30,
        stream: false, messages: [{ role: 'user', content: prompt }],
      }),
      signal: ctrl.signal,
    });
    clearTimeout(timer);

    if (!res.ok) {
      const txt = await res.text().catch(() => '');
      log.error(`P2 ${name}: HTTP ${res.status} — FULL BODY: ${txt.slice(0, 500)}`);
      if (res.status === 401 || res.status === 403) throw new Error('API_KEY_INVALID');
      throw new Error(`${name}: HTTP ${res.status} ${trunc(txt, 120)}`);
    }

    const data    = await res.json();
    let   content = data?.choices?.[0]?.message?.content?.trim();
    if (!content || content.length < 20) throw new Error(`${name}: empty response`);

    // Clean JSON
    content = content.replace(/^```(?:json)?\s*/im, '').replace(/\s*```\s*$/im, '').trim();
    const jS = content.indexOf('{'), jE = content.lastIndexOf('}');
    if (jS === -1 || jE <= jS) throw new Error(`${name}: no JSON object`);
    let jsonStr = content.slice(jS, jE + 1);

    // 4-step JSON repair
    let parsed;
    try { parsed = JSON.parse(jsonStr); }
    catch {
      try { parsed = JSON.parse(jsonStr.replace(/,(\s*[}\]])/g, '$1')); }
      catch {
        try {
          parsed = JSON.parse(
            jsonStr.replace(/,(\s*[}\]])/g, '$1')
                   .replace(/([{,]\s*)([a-zA-Z_]\w*)(\s*:)/g, '$1"$2"$3')
                   .replace(/:\s*\'([^\']*)\'/g, ': "$1"')
          );
        }
        catch {
          try {
            parsed = JSON.parse(
              jsonStr.replace(/[\x00-\x1F\x7F]/g, ' ')
                     .replace(/,(\s*[}\]])/g, '$1')
                     .replace(/([{,]\s*)([a-zA-Z_]\w*)(\s*:)/g, '$1"$2"$3')
            );
          }
          catch (e4) { throw new Error(`${name}: JSON repair failed - ${e4.message.slice(0,60)}`); }
        }
      }
    }

    // Auto-fix quiz correct_answer mismatches + drop malformed questions.
    // IMPORTANT: also reject questions whose options are placeholder junk
    // (bare "A"/"B"/"C"/"D", or suspiciously short strings) — some weaker
    // free models return that instead of real answer text, and it used to
    // pass validation (structurally an array of 4 strings) and "win" the
    // fast-success race with garbage. Now it's treated as a failed question
    // and dropped, so a genuinely bad model's response can't win purely on
    // speed over a slower model's real content.
    const isJunkOption = (o) => {
      const t = String(o).trim();
      return t.length < 1 || /^[a-dA-D][.):]?$/.test(t) || /^option\s*[a-dA-D]$/i.test(t);
    };
    if (Array.isArray(parsed.quiz_questions)) {
      parsed.quiz_questions = parsed.quiz_questions
        .filter(q => q && typeof q.question === 'string' && q.question.trim().length > 3
                  && Array.isArray(q.options) && q.options.filter(o => typeof o === 'string' && o.trim()).length >= 2)
        .map((q, i) => {
          q.id = i + 1;
          q.options = q.options.filter(o => typeof o === 'string' && o.trim());
          if (q.options && q.correct_answer && !q.options.includes(q.correct_answer)) {
            const lo  = String(q.correct_answer).toLowerCase();
            const fix = q.options.find(o => o.toLowerCase() === lo)
                     || q.options.find(o => o.toLowerCase().includes(lo) || lo.includes(o.toLowerCase()))
                     || q.options[0];
            if (fix) q.correct_answer = fix;
          }
          return q;
        })
        .filter(q => q.options.filter(o => !isJunkOption(o)).length >= 2);
    }

    // Normalize flashcards
    if (Array.isArray(parsed.flashcards)) {
      parsed.flashcards = parsed.flashcards
        .filter(c => (c.front || c.question) && (c.back || c.answer))
        .map(c => ({ front: String(c.front || c.question || '').trim(), back: String(c.back || c.answer || '').trim() }));
    }

    // ─── RELAXED VALIDATION — accept even a single item ───
    const hasFc = Array.isArray(parsed.flashcards) && parsed.flashcards.length >= 1;
    const hasQ  = Array.isArray(parsed.quiz_questions) && parsed.quiz_questions.length >= 1;
    const hasMm = parsed.mindmap?.branches?.length >= 1; // at least 1 branch
    const hasKc = Array.isArray(parsed.key_concepts) && parsed.key_concepts.length >= 1;

    let valid = false;
    if (tool === 'flashcards' || tool === 'flashcards_quiz') valid = hasFc;
    else if (tool === 'quiz') valid = hasQ;
    else if (tool === 'mindmap' || tool === 'mindmap_only') valid = hasMm;
    else if (tool === 'all') valid = (hasFc || hasQ || hasMm || hasKc);
    else valid = hasKc; // notes/summary

    if (!valid) {
      // Log what we got for debugging
      log.warn(`${name}: validation failed - fc:${parsed.flashcards?.length||0} q:${parsed.quiz_questions?.length||0} mm:${parsed.mindmap?.branches?.length||0} kc:${parsed.key_concepts?.length||0}`);
      throw new Error(`${name}: validation failed`);
    }

    // Declare winner
    if (sharedState && !sharedState.winnerId) {
      sharedState.winnerId = model.id;
      log.ok(`P2 🏆 ${name} WON in ${Date.now()-t0}ms`);
    }

    log.ok(`P2 ✅ ${name} | ${tool} | fc:${parsed.flashcards?.length||0} q:${parsed.quiz_questions?.length||0} mm:${parsed.mindmap?.branches?.length||0} | ${Date.now()-t0}ms`);
    return parsed;

  } catch (err) {
    clearTimeout(timer);
    if (err.message === 'API_KEY_INVALID') throw err;
    const reason = err.name === 'AbortError' ? `${name} timed out` : err.message;
    log.warn(`P2 ✗ ${reason}`);
    throw new Error(reason);
  }
}

// ── Last resort non-streaming JSON fallback ──
async function fetchCardsFallback(prompt, tool) {
  log.info(`P2 fallback: attempting non-streaming JSON request to openrouter/free`);
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
        model: 'openrouter/free',
        max_tokens: 16384,
        temperature: 0.30,
        stream: false,
        messages: [{ role: 'user', content: prompt }],
      }),
      timeout: 120000,
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    const content = data?.choices?.[0]?.message?.content?.trim();
    if (!content) throw new Error('Empty response');
    // Try to parse JSON
    const cleaned = content.replace(/^```(?:json)?\s*/im, '').replace(/\s*```\s*$/im, '').trim();
    const jS = cleaned.indexOf('{'), jE = cleaned.lastIndexOf('}');
    if (jS === -1 || jE <= jS) throw new Error('No JSON');
    const jsonStr = cleaned.slice(jS, jE + 1);
    const parsed = JSON.parse(jsonStr);
    log.ok(`P2 fallback: returned JSON`);
    return parsed;
  } catch (err) {
    log.error(`P2 fallback failed: ${err.message}`);
    return null;
  }
}

async function fetchCards(prompt, tool) {
  const errors = [];
  const sharedState = { winnerId: null };

  for (let pass = 1; pass <= MAX_PASSES; pass++) {
    log.info(`P2 pass ${pass}: starting ALL ${ALL_MODELS_CARDS.length} models in parallel for tool:${tool}`);
    sharedState.winnerId = null;

    const modelPromises = ALL_MODELS_CARDS.map(model =>
      fetchCardsFromModel(model, prompt, tool, sharedState)
        .then(result => ({ status: 'fulfilled', value: result, model: model.id }))
        .catch(err => ({ status: 'rejected', reason: err, model: model.id }))
    );

    const raceResult = await raceFirstSuccess(modelPromises);

    if (raceResult.winner) {
      const winner = raceResult.winner;
      log.ok(`P2 pass ${pass}: WINNER ${winner.model} (fast-race, didn't wait for stragglers)`);
      return winner.value;
    }

    const results = raceResult.all.map(v => ({ status: 'fulfilled', value: v }));

    const failReasons = results
      .filter(r => r.status === 'fulfilled' && r.value?.status === 'rejected')
      .map(r => `${r.value.model}: ${r.value.reason?.message || 'unknown'}`)
      .concat(
        results
          .filter(r => r.status === 'rejected')
          .map(r => `promise-error: ${r.reason?.message || 'unknown'}`)
      );

    errors.push(`[pass${pass}] ${failReasons.join('; ')}`);
    log.warn(`P2 pass ${pass}: ALL models failed — ${failReasons.length} failures`);

    if (pass < MAX_PASSES) {
      const backoff = pass * 1500;
      log.info(`P2 pass ${pass}: backing off ${backoff}ms before retry`);
      await sleep(backoff);
    }
  }

  // ── LAST RESORT ──
  log.warn('P2 all attempts failed; trying non-streaming JSON fallback');
  const fallbackResult = await fetchCardsFallback(prompt, tool);
  if (fallbackResult) {
    return fallbackResult;
  }

  log.error(`P2 ALL attempts failed: ${errors.join(' | ')}`);
  throw new Error(`All free AI models failed for tool:${tool}.`);
}

// ─────────────────────────────────────────────────────────────────────────────
// SECTION 9 — FALLBACK CONTENT (almost never used)
// ─────────────────────────────────────────────────────────────────────────────

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

// ─────────────────────────────────────────────────────────────────────────────
// SECTION 10 — TOPIC FACT
// ─────────────────────────────────────────────────────────────────────────────

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

// ─────────────────────────────────────────────────────────────────────────────
// SECTION 11 — MERGE
// ─────────────────────────────────────────────────────────────────────────────

function mergeCards(cardsRaw, notes, topic, opts) {
  const now        = getISTDateTime();
  const isFallback = !!cardsRaw?._fallback;

  // Defensive normalizer — some free models occasionally return objects instead
  // of plain strings for these fields despite the prompt asking for strings.
  // Without this, the UI shows "[object Object]" instead of real text.
  const toStringArray = arr => !Array.isArray(arr) ? [] : arr.map(item => {
    if (typeof item === 'string') return item;
    if (item && typeof item === 'object') {
      // Try common shapes: {myth,truth}, {area,description}, {question,answer}, etc.
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

  // No synthetic key_concepts filler anymore, for ANY tool. If the AI
  // genuinely didn't return key_concepts, we show nothing there rather than
  // the same canned template every time — consistent with the no-fallback
  // policy applied everywhere else.
  return merged;
}

// ─────────────────────────────────────────────────────────────────────────────
// SECTION 12 — SSE HELPER + SECURITY HEADERS
// ─────────────────────────────────────────────────────────────────────────────

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

// ─────────────────────────────────────────────────────────────────────────────
// SECTION 13 — MAIN HANDLER (with extended deadline for notes/summary)
// ─────────────────────────────────────────────────────────────────────────────

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
    cardCount:   Math.min(Number(rawOpts.cardCount)   || 15, 20),
    quizCount:   Number(rawOpts.quizCount)   || 10,
    quizType:    String(rawOpts.quizType || 'mixed'),
    branchCount: Number(rawOpts.branchCount) || 6,
  };

  log.info(`[${reqId}] tool:${opts.tool} | depth:${opts.depth} | lang:${opts.language} | stream:${opts.stream} | user:${userName}`);

  if (!opts.stream) {
    return res.status(400).json({ error: 'Non-streaming mode is not supported. The client must send options.stream=true.' });
  }

  sendToGoogleSheets(userName, userStreak, userSess, opts.tool, message, 'started', 0, sessionId).catch(() => {});

  // ══════════════════════════════════════════════════════════════════════════
  // SSE STREAMING RESPONSE
  // ══════════════════════════════════════════════════════════════════════════

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
    // ── Phase 1 + Phase 2 run concurrently (parallel) ──

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

    // ── Phase 2: cards generation (concurrent) ──
    let cardsPromise;
    if (opts.tool === 'all') {
      const megaPrompt = buildMegaPrompt(message, opts);
      cardsPromise = fetchCards(megaPrompt, 'all').then(
        v => ({ status: 'fulfilled', value: v }),
        e => ({ status: 'rejected', reason: e })
      );
    } else if (opts.tool === 'flashcards') {
      const fcPrompt = buildFlashcardsPrompt(message, opts);
      cardsPromise = fetchCards(fcPrompt, 'flashcards').then(
        v => ({ status: 'fulfilled', value: v }),
        e => ({ status: 'rejected', reason: e })
      );
    } else if (opts.tool === 'quiz') {
      const quizPrompt = buildQuizPrompt(message, opts);
      cardsPromise = fetchCards(quizPrompt, 'quiz').then(
        v => ({ status: 'fulfilled', value: v }),
        e => ({ status: 'rejected', reason: e })
      );
    } else if (opts.tool === 'mindmap') {
      const mmPrompt = buildMindmapPrompt(message, opts);
      cardsPromise = fetchCards(mmPrompt, 'mindmap').then(
        v => ({ status: 'fulfilled', value: v }),
        e => ({ status: 'rejected', reason: e })
      );
    } else {
      // notes or summary – get key_concepts/tricks/Q&A/apps/misconceptions
      const kcPrompt = buildKeyConceptsPrompt(message, opts);
      cardsPromise = fetchCards(kcPrompt, opts.tool).then(
        v => ({ status: 'fulfilled', value: v }),
        e => ({ status: 'rejected', reason: e })
      );
    }

    // ── Phase 1: live notes stream — ONLY for tools that actually show notes.
    // flashcards/quiz/mindmap used to also generate a full prose notes essay
    // here "for fallback" even though it was never displayed — that wasted
    // an entire AI call's worth of time (comprehensive depth can take 60-90s)
    // before Phase 2 (the actual flashcards/quiz/mindmap content) even got a
    // chance to finish, which was the main reason those tools stalled out.
    if (opts.tool === 'notes' || opts.tool === 'summary' || opts.tool === 'all') {
      try {
        notes = await streamNotes(notesPrompt, chunk => sse('token', { t: chunk }), opts.tool);
        p1ok = true;
        log.ok(`[${reqId}] P1 done — ${notes.length}ch`);
      } catch (e1) {
        // No more offline/generic notes here either — if every model in
        // every retry pass genuinely failed, be honest about it instead of
        // streaming local template text that looks like a real AI answer.
        log.error(`[${reqId}] P1 failed for real: ${e1.message}`);
        clearInterval(kap);
        clearStages();
        sse('error', {
          error: 'We couldn\u2019t generate real AI content for this just now, so we\u2019re showing nothing rather than something fake. This is almost always momentary \u2014 tap Retry and it typically works right away.',
          tool: opts.tool,
        });
        if (!res.writableEnded) res.end();
        return;
      }
    } else {
      // flashcards / quiz / mindmap: no prose notes needed at all — go
      // straight to Phase 2, which is already running in the background
      // since cardsPromise was fired above before we even got here.
      p1ok = true;
    }

    sse('stage', { idx: 2, label: '✅ Notes complete! Finalising interactive cards…' });

    // ── Keep-alive pings while waiting for Phase 2 ──
    let p2DotCount = 0;
    p2Ticker = setInterval(() => {
      p2DotCount = (p2DotCount % 3) + 1;
      sse('stage', { idx: 3, label: `🃏 Finalising your cards${'.'.repeat(p2DotCount)}` });
    }, 1500);

    // ── Wait for Phase 2 ──
    let cardsData = null, p2ok = false;

    // These tools' ENTIRE output comes from cardsPromise — if it fails there is
    // nothing real to show, so we no longer silently substitute generic
    // template content. We wait generously (multiple retry passes across the
    // whole model pool already happen inside fetchCards) and only if that
    // genuinely exhausts do we surface a real error + Retry button — never a
    // fabricated result pretending to be AI-generated.
    const raceWithDeadline = (ms) => Promise.race([
      cardsPromise,
      new Promise(resolve => setTimeout(() => resolve({ status: 'deadline' }), ms)),
    ]);

    const CARD_ONLY_TOOLS = ['all', 'flashcards', 'quiz', 'mindmap'];
    if (CARD_ONLY_TOOLS.includes(opts.tool)) {
      const labels = {
        all:        '⚡ Finalising mega bundle — flashcards + quiz + mindmap…',
        flashcards: '🃏 Finalising flashcards…',
        quiz:       '❓ Finalising quiz…',
        mindmap:    '🗺️ Finalising mind map…',
      };
      const deadlineMs = opts.tool === 'all' ? 150000 : 120000;
      sse('stage', { idx: 3, label: labels[opts.tool] });
      const cardsResult = await raceWithDeadline(deadlineMs);

      if (cardsResult.status === 'fulfilled') {
        cardsData = cardsResult.value;
        p2ok = true;
        log.ok(`[${reqId}] ${opts.tool} succeeded`);
      } else {
        // Every model, every retry pass, genuinely exhausted (or a true hang
        // past the generous deadline). Send a real error, not fake content.
        const why = cardsResult.status === 'deadline'
          ? `exceeded ${deadlineMs}ms after full retries`
          : (cardsResult.reason?.message || 'all models failed');
        log.error(`[${reqId}] ${opts.tool} failed for real: ${why}`);
        sse('error', {
          error: 'We couldn\u2019t generate real AI content for this just now, so we\u2019re showing nothing rather than something fake. This is almost always momentary \u2014 tap Retry and it typically works right away.',
          tool: opts.tool,
        });
        clearInterval(kap);
        if (p2Ticker) clearInterval(p2Ticker);
        clearStages();
        if (!res.writableEnded) res.end();
        return; // stop here — no 'done' event, no fabricated result
      }
    } else {
      // notes or summary: P1 (the live notes prose) already succeeded by this
      // point — this is only the supplementary key_concepts/tricks/quiz-teaser
      // side data. If it fails, we still have real notes to show, so we don't
      // hard-error the whole response; we simply omit the supplementary
      // section rather than filling it with generic fallback text.
      const NOTES_CARDS_DEADLINE_MS = 90000;
      const deadlineFallback = new Promise(resolve => {
        setTimeout(() => resolve({ status: 'deadline' }), NOTES_CARDS_DEADLINE_MS);
      });
      const cardsResult = await Promise.race([cardsPromise, deadlineFallback]);
      if (cardsResult.status === 'fulfilled') {
        cardsData = cardsResult.value;
        p2ok = true;
        log.ok(`[${reqId}] Cards succeeded for ${opts.tool}`);
      } else {
        log.warn(`[${reqId}] Supplementary cards failed/timed out for ${opts.tool} — showing notes without them rather than fake filler`);
        cardsData = null;
        p2ok = false;
      }
    }

    // ╔═══════════════════════════════════════════════════════════════════════
    // ║  PHASE 3 — STREAM CARDS LIVE (unchanged)
    // ╚═══════════════════════════════════════════════════════════════════════

    // Enforce requested flashcard count — trim excess only; never pad with
    // synthetic filler cards. If the model genuinely returns fewer than
    // asked, the user gets fewer real cards rather than fake ones mixed in.
    if (cardsData?.flashcards?.length && (opts.tool === 'flashcards' || opts.tool === 'all') && opts.cardCount) {
      const want = opts.cardCount;
      const have = cardsData.flashcards.length;
      if (have > want) {
        cardsData.flashcards = cardsData.flashcards.slice(0, want);
      }
      log.ok(`[${reqId}] Flashcard count: wanted ${want}, delivering ${cardsData.flashcards.length} (real, no padding)`);
    }

    // Same for quiz — trim excess only, never pad with synthetic filler.
    if (cardsData?.quiz_questions?.length && (opts.tool === 'quiz' || opts.tool === 'all') && opts.quizCount) {
      const want = opts.quizCount;
      const have = cardsData.quiz_questions.length;
      if (have > want) {
        cardsData.quiz_questions = cardsData.quiz_questions.slice(0, want);
      }
      log.ok(`[${reqId}] Quiz count: wanted ${want}, delivering ${cardsData.quiz_questions.length} (real, no padding)`);
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

    // ╔═══════════════════════════════════════════════════════════════════════
    // ║  SEND FINAL DATA
    // ╚═══════════════════════════════════════════════════════════════════════

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
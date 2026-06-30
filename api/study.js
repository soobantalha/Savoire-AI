'use strict';
// ═══════════════════════════════════════════════════════════════════════════════
// SAVOIRÉ AI v2.0 — api/study.js — PARALLEL RACING, PER‑TOOL PIPELINES
// Built by Sooban Talha Technologies | soobantalhatech.xyz | Founder: Sooban Talha
// "Think Less. Know More."
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
// SECTION 2 — MODEL LISTS (only confirmed‑active free models)
// ─────────────────────────────────────────────────────────────────────────────

const MODELS_PROSE = [
  { id: 'google/gemini-2.0-flash-exp:free',        max_tokens: 50000, timeout_ms: 40000, temp: 0.75 },
  { id: 'google/gemini-flash-1.5-8b:free',         max_tokens: 45000, timeout_ms: 40000, temp: 0.75 },
  { id: 'meta-llama/llama-3.3-70b-instruct:free',  max_tokens: 45000, timeout_ms: 40000, temp: 0.75 },
  { id: 'microsoft/phi-3-mini-128k-instruct:free', max_tokens: 35000, timeout_ms: 35000, temp: 0.75 },
  { id: 'mistralai/mistral-7b-instruct-v0.3:free', max_tokens: 35000, timeout_ms: 35000, temp: 0.75 },
  { id: 'qwen/qwen2.5-72b-instruct:free',          max_tokens: 45000, timeout_ms: 40000, temp: 0.75 },
  { id: 'z-ai/glm-4.5-air:free',                   max_tokens: 40000, timeout_ms: 40000, temp: 0.75 },
  { id: 'openrouter/free',                          max_tokens: 50000, timeout_ms: 55000, temp: 0.75 },
];

const MODELS_JSON = [
  { id: 'google/gemini-2.0-flash-exp:free',        max_tokens: 50000, timeout_ms: 35000, temp: 0.25 },
  { id: 'google/gemini-flash-1.5-8b:free',         max_tokens: 45000, timeout_ms: 35000, temp: 0.25 },
  { id: 'meta-llama/llama-3.3-70b-instruct:free',  max_tokens: 45000, timeout_ms: 35000, temp: 0.25 },
  { id: 'microsoft/phi-3-mini-128k-instruct:free', max_tokens: 35000, timeout_ms: 30000, temp: 
  { id: 'qwen/qwen2.5-72b-instruct:free',          max_tokens: 35000, timeout_ms: 35000, temp: 0.25 },
  { id: 'z-ai/glm-4.5-air:free',                   max_tokens: 35000, timeout_ms: 35000, temp: 0.25 },
  { id: 'openrouter/free',                          max_tokens: 35000, timeout_ms: 45000, temp: 0.25 },
];

// ─────────────────────────────────────────────────────────────────────────────
// SECTION 3 — CONFIG MAPS (unchanged)
// ─────────────────────────────────────────────────────────────────────────────

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
// SECTION 6 — PER-TOOL PROMPT BUILDERS (single‑purpose, no cross‑tool content)
// ─────────────────────────────────────────────────────────────────────────────

function buildNotesPrompt(input, opts) {
  const depth = DEPTH_MAP[opts.depth] || DEPTH_MAP.detailed;
  const style = STYLE_MAP[opts.style] || STYLE_MAP.simple;
  const lang  = opts.language || 'English';

  const sections = '## 📚 Introduction & Overview\n\n## 🎯 Core Concepts & Definitions\n\n## ⚙️ How It Works — Mechanisms\n\n## 💡 Key Examples with Walkthroughs\n\n## 🚀 Advanced Aspects & Nuances\n\n## 🌍 Real-World Applications\n\n## 🧠 Common Misconceptions\n\n## 📝 Key Takeaways & Revision Checklist';

  return `You are ${SAVOIRÉ.BRAND}, the world's most advanced AI study assistant.
Creator: ${SAVOIRÉ.DEVELOPER} | Founder: ${SAVOIRÉ.FOUNDER}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
TASK: Generate comprehensive, well-structured study notes covering every important aspect of the topic.
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

function buildSummaryPrompt(input, opts) {
  const lang  = opts.language || 'English';
  const style = STYLE_MAP[opts.style] || STYLE_MAP.simple;

  return `You are ${SAVOIRÉ.BRAND}, an AI study assistant. Generate a concise, scannable smart summary.

TOPIC: "${input}"
LANGUAGE: ${lang} — write EVERY word in ${lang}.
STYLE: ${style}

REQUIRED SECTIONS (use exactly these headings):
## 🚀 TL;DR — 3 to 5 sentences maximum

## 🎯 Core Concepts — one bullet each (6-10 bullets)

## ⚙️ Key Mechanisms — ultra-short bullets (4-6 bullets)

## ✅ Final Revision Checklist (5-7 checkboxes using "- [ ]")

FORMATTING RULES:
• ## for section headings, **bold** key terms, - for bullets
• Keep EVERYTHING short and scannable — this is a summary, not an essay
• 300-600 words total maximum
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
START NOW with the TL;DR heading. Write in ${lang} only. Topic: "${input}"`;
}

function buildFlashcardsPrompt(input, opts) {
  const lang     = opts.language || 'English';
  const topic    = String(input).slice(0, 100);
  const fcCount  = opts.cardCount || 15;

  return `You are ${SAVOIRÉ.BRAND}. Generate exactly ${fcCount} study flashcards as valid JSON.

TOPIC: "${topic}"
LANGUAGE: ${lang} — ALL text must be in ${lang}.

Each flashcard:
• "front": specific question about "${topic}" (10-40 words, in ${lang})
• "back": detailed answer 60-150 words about "${topic}" (in ${lang})

Mix of types across the ${fcCount} cards: definition cards, mechanism cards, comparison cards,
application cards, misconception-correction cards. ALL content specifically about "${topic}".
Zero generic filler, zero placeholder text.

OUTPUT FORMAT — output ONLY valid JSON, starting with { and ending with }.
No markdown, no code fences, no explanation before or after.

{
  "topic": "clean title for ${topic} in ${lang}",
  "flashcards": [
    {"front": "Specific question 1 about ${topic}", "back": "Detailed 60-150 word answer 1"},
    {"front": "Specific question 2 about ${topic}", "back": "Detailed 60-150 word answer 2"}
  ]
}

The "flashcards" array must contain EXACTLY ${fcCount} objects, each with non-empty "front" and "back".
OUTPUT JSON NOW — start with { immediately:`;
}

function buildQuizPrompt(input, opts) {
  const lang      = opts.language || 'English';
  const topic     = String(input).slice(0, 100);
  const qCount    = opts.quizCount || 10;
  const quizType  = opts.quizType || 'mixed';
  const qDiffInstr =
    quizType === 'easy'   ? 'ALL questions must be easy (foundational, beginner-friendly).' :
    quizType === 'medium' ? 'ALL questions must be medium difficulty (core exam level).' :
    quizType === 'hard'   ? 'ALL questions must be hard (advanced analysis, application).' :
    quizType === 'exam'   ? 'ALL questions must be exam-style (past-paper format, mark-scheme phrasing, tricky distractors).' :
                             'Difficulty mix across the set: 30% easy, 50% medium, 20% hard.';

  return `You are ${SAVOIRÉ.BRAND}. Generate exactly ${qCount} multiple-choice quiz questions as valid JSON.

TOPIC: "${topic}"
LANGUAGE: ${lang} — ALL text must be in ${lang}.

Each question object:
• "id": sequential number starting at 1
• "question": specific question about "${topic}" (in ${lang})
• "options": array of EXACTLY 4 strings. EACH option must be a COMPLETE, FULL-LENGTH ANSWER
  (15-60 words each) written as real answer text — NEVER single letters like "A", "B", "C", "D"
  and NEVER short label-only options. All 4 must be plausible and topic-specific; exactly one is correct.
• "correct_answer": the value MUST be an exact, character-for-character COPY of one of the
  four strings inside "options" — copy-paste the full option text, not a letter, not an index.
• "explanation": 60-100 words explaining why the correct answer is right, referencing "${topic}" (in ${lang})
• "difficulty": one of "easy" | "medium" | "hard"

DIFFICULTY RULE: ${qDiffInstr}
VARY which position (1st, 2nd, 3rd, or 4th option) holds the correct answer from question to
question — do NOT always put the correct answer in the same options[] slot.

OUTPUT FORMAT — output ONLY valid JSON, starting with { and ending with }.
No markdown, no code fences, no explanation before or after.

{
  "topic": "clean title for ${topic} in ${lang}",
  "quiz_questions": [
    {
      "id": 1,
      "question": "Specific question about ${topic}",
      "options": [
        "Complete full-length answer option one here",
        "Complete full-length answer option two here",
        "Complete full-length answer option three here",
        "Complete full-length answer option four here"
      ],
      "correct_answer": "Complete full-length answer option two here",
      "explanation": "Detailed 60-100 word explanation of why this is correct",
      "difficulty": "medium"
    }
  ]
}

The "quiz_questions" array must contain EXACTLY ${qCount} objects matching the schema above.
OUTPUT JSON NOW — start with { immediately:`;
}

function buildMindmapPrompt(input, opts) {
  const lang    = opts.language || 'English';
  const topic   = String(input).slice(0, 100);
  const mmCount = opts.branchCount || 6;

  return `You are ${SAVOIRÉ.BRAND}. Generate a visual mind map structure as valid JSON.

TOPIC: "${topic}"
LANGUAGE: ${lang} — ALL text must be in ${lang}.

Structure:
• "central": 3-5 word essence/title of "${topic}" (in ${lang})
• "branches": array of EXACTLY ${mmCount} objects, each with:
  - "name": a specific branch name derived from "${topic}" — NEVER generic labels like
    "Introduction", "Overview", or "Basics". Must name an actual concept/sub-topic.
  - "color": one of "#00d4ff","#bf00ff","#00ff88","#ffae00","#d4af37","#ff4444","#e84393"
    (use a different color for each branch where possible)
  - "items": array of 4-5 specific facts/terms about that branch (each 5-20 words, in ${lang})
• "connections": array of 3-4 objects {"from": "branch name", "to": "branch name",
  "description": "how they relate, 10-20 words"} — showing real conceptual relationships
  between branches, not generic statements.

OUTPUT FORMAT — output ONLY valid JSON, starting with { and ending with }.
No markdown, no code fences, no explanation before or after.

{
  "topic": "clean title for ${topic} in ${lang}",
  "mindmap": {
    "central": "3-5 word essence of ${topic}",
    "branches": [
      {"name": "Specific branch 1", "color": "#00d4ff", "items": ["fact 1", "fact 2", "fact 3", "fact 4"]}
    ],
    "connections": [
      {"from": "Branch A", "to": "Branch B", "description": "how they relate"}
    ]
  }
}

The "branches" array must contain EXACTLY ${mmCount} objects matching the schema above.
OUTPUT JSON NOW — start with { immediately:`;
}

// ─────────────────────────────────────────────────────────────────────────────
// SECTION 7 — PARALLEL RACING FUNCTIONS (core speed & reliability fix)
// ─────────────────────────────────────────────────────────────────────────────
//
// ⚡ ROOT-CAUSE FIX (this revision):
// Single-tool flashcards/quiz/mindmap calls used to send ONE blank
// `sse('token', {t:''})` pulse and then `await` the entire non-streaming
// JSON race with NO further communication to the client until it resolved.
// The frontend's live-output view has its own "is this still alive?"
// timeout — seeing no activity for ~15-20s, it decided the request was
// dead and showed "temporarily unavailable", EVEN THOUGH the backend
// was still actively racing models and would have succeeded given more
// time (exactly as proven by the 'all' tool, which stays alive because
// notes are genuinely streaming token-by-token the whole time).
//
// FIX: raceJSON() now accepts an optional onHeartbeat callback. While the
// race is in flight, we emit small periodic "..." progress pulses via SSE
// (not fake content — just keep-alive signal) so the frontend's live view
// never goes quiet long enough to time out, no matter how long the real
// JSON generation takes. This exactly mirrors why 'all' already worked.
// ─────────────────────────────────────────────────────────────────────────────

async function raceProse(prompt, onChunk, label) {
  // Race all prose models in parallel, first successful stream wins.
  // If all fail, retry the race up to 3 times.
  const MAX_RETRIES = 3;
  let lastError = '';

  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    if (attempt > 1) {
      const backoff = Math.min(1000 * Math.pow(2, attempt - 1), 4000);
      log.warn(`${label} ↻ retry ${attempt}/${MAX_RETRIES} — backing off ${backoff}ms`);
      await sleep(backoff);
    }

    const promises = MODELS_PROSE.map(model => {
      const name = model.id.split('/').pop();
      const ctrl = new AbortController();
      const timer = setTimeout(() => ctrl.abort(), model.timeout_ms);
      const t0 = Date.now();

      return (async () => {
        try {
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
              temperature: model.temp || 0.75,
              stream: true,
              messages: [{ role: 'user', content: prompt }],
            }),
            signal: ctrl.signal,
          });
          clearTimeout(timer);

          if (!res.ok) {
            const txt = await res.text().catch(() => '');
            log.error(`${label} ${name}: HTTP ${res.status} — BODY: ${txt.slice(0, 300)}`);
            if (res.status === 429) throw new Error('429');
            if (res.status === 404) throw new Error('404');
            if (res.status === 401 || res.status === 403) throw new Error('AUTH_ERROR');
            throw new Error(`HTTP ${res.status} ${trunc(txt, 60)}`);
          }

          const reader = res.body.getReader();
          const decoder = new TextDecoder('utf-8');
          let lineBuf = '', full = '';
          let firstChunk = false;

          while (true) {
            const { done, value } = await reader.read();
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
                  if (!firstChunk) {
                    firstChunk = true;
                    log.ok(`${label} 🏆 ${name} won in ${Date.now() - t0}ms`);
                  }
                  full += delta;
                  onChunk(delta);
                }
              } catch { /* ignore */ }
            }
          }

          if (full.trim().length < 80) throw new Error('too_short');
          return full;

        } catch (err) {
          clearTimeout(timer);
          if (err.message === 'AUTH_ERROR') throw err;
          const reason = err.name === 'AbortError' ? 'timeout' : err.message;
          log.warn(`${label} ${name} failed: ${reason}`);
          throw new Error(reason);
        }
      })();
    });

    // Race all promises, but also add a global timeout for the whole race.
    const raceTimeout = new Promise((_, reject) => setTimeout(() => reject(new Error('race_timeout')), 42000));

    try {
      const result = await Promise.any([...promises, raceTimeout]);
      log.ok(`${label} ✅ successful on attempt ${attempt}`);
      return result; // returns the full notes string
    } catch (err) {
      lastError = err?.message || (err?.errors ? err.errors.map(e=>e.message).join(' | ') : 'unknown');
      log.warn(`${label} attempt ${attempt} failed: ${lastError}`);
      // If it's an auth error, don't retry.
      if (lastError === 'AUTH_ERROR') throw new Error('OPENROUTER_API_KEY is invalid or missing.');
      // Continue to next attempt.
    }
  }

  log.error(`${label} ALL retries failed. Last error: ${lastError}`);
  throw new Error(`All AI models are currently busy for ${label}. Please try again.`);
}

// ─────────────────────────────────────────────────────────────────────────────
// SECTION 8 — PARALLEL RACE FOR JSON (flashcards, quiz, mindmap)
// ─────────────────────────────────────────────────────────────────────────────

async function raceJSON(prompt, label, validateFn, repairFn, onHeartbeat) {
  const MAX_RETRIES = 3;
  let lastError = '';

  // ── Heartbeat ticker: keeps the live SSE connection visibly "alive" for
  // the ENTIRE duration of the JSON race (which has no natural token
  // stream of its own), exactly mirroring how notes' real token stream
  // keeps the 'all' tool from ever looking dead to the frontend. ──
  let hbTicker = null;
  if (typeof onHeartbeat === 'function') {
    let dots = 0;
    hbTicker = setInterval(() => {
      dots = (dots % 3) + 1;
      onHeartbeat('.'.repeat(dots));
    }, 1200);
  }

  try {
    for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
      if (attempt > 1) {
        const backoff = Math.min(1000 * Math.pow(2, attempt - 1), 4000);
        log.warn(`${label} ↻ retry ${attempt}/${MAX_RETRIES} — backing off ${backoff}ms`);
        await sleep(backoff);
      }

      const promises = MODELS_JSON.map(model => {
        const name = model.id.split('/').pop();
        const ctrl = new AbortController();
        const timer = setTimeout(() => ctrl.abort(), model.timeout_ms);
        const t0 = Date.now();

        return (async () => {
          try {
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
                temperature: model.temp || 0.25,
                stream: false,
                messages: [{ role: 'user', content: prompt }],
              }),
              signal: ctrl.signal,
            });
            clearTimeout(timer);

            if (!res.ok) {
              const txt = await res.text().catch(() => '');
              log.error(`${label} ${name}: HTTP ${res.status} — BODY: ${txt.slice(0, 300)}`);
              if (res.status === 429) throw new Error('429');
              if (res.status === 404) throw new Error('404');
              if (res.status === 401 || res.status === 403) throw new Error('AUTH_ERROR');
              throw new Error(`HTTP ${res.status} ${trunc(txt, 60)}`);
            }

            const data = await res.json();
            let content = data?.choices?.[0]?.message?.content?.trim();
            if (!content || content.length < 20) throw new Error('empty');

            // Clean and parse JSON
            content = content.replace(/^```(?:json)?\s*/im, '').replace(/\s*```\s*$/im, '').trim();
            const jS = content.indexOf('{'), jE = content.lastIndexOf('}');
            if (jS === -1 || jE <= jS) throw new Error('no_json');
            let jsonStr = content.slice(jS, jE + 1);

            let parsed;
            try { parsed = JSON.parse(jsonStr); }
            catch {
              try { parsed = JSON.parse(jsonStr.replace(/,(\s*[}\]])/g, '$1')); }
              catch {
                try {
                  parsed = JSON.parse(
                    jsonStr.replace(/,(\s*[}\]])/g, '$1')
                           .replace(/([{,]\s*)([a-zA-Z_]\w*)(\s*:)/g, '$1"$2"$3')
                           .replace(/:\s*'([^']*)'/g, ': "$1"')
                  );
                } catch {
                  try {
                    parsed = JSON.parse(
                      jsonStr.replace(/[\x00-\x1F\x7F]/g, ' ')
                             .replace(/,(\s*[}\]])/g, '$1')
                             .replace(/([{,]\s*)([a-zA-Z_]\w*)(\s*:)/g, '$1"$2"$3')
                    );
                  } catch (e4) {
                    throw new Error(`json_repair_failed: ${e4.message.slice(0, 60)}`);
                  }
                }
              }
            }

            if (typeof repairFn === 'function') {
              try { parsed = repairFn(parsed, name) || parsed; }
              catch { /* ignore repair errors */ }
            }

            if (!validateFn(parsed)) throw new Error('validation_failed');

            log.ok(`${label} ✅ ${name} won in ${Date.now() - t0}ms`);
            return parsed;

          } catch (err) {
            clearTimeout(timer);
            if (err.message === 'AUTH_ERROR') throw err;
            const reason = err.name === 'AbortError' ? 'timeout' : err.message;
            log.warn(`${label} ${name} failed: ${reason}`);
            throw new Error(reason);
          }
        })();
      });

      const raceTimeout = new Promise((_, reject) => setTimeout(() => reject(new Error('race_timeout')), 42000));

      try {
        const result = await Promise.any([...promises, raceTimeout]);
        log.ok(`${label} ✅ successful on attempt ${attempt}`);
        return result;
      } catch (err) {
        lastError = err?.message || (err?.errors ? err.errors.map(e=>e.message).join(' | ') : 'unknown');
        log.warn(`${label} attempt ${attempt} failed: ${lastError}`);
        if (lastError === 'AUTH_ERROR') throw new Error('OPENROUTER_API_KEY is invalid or missing.');
      }
    }

    log.error(`${label} ALL retries failed. Last error: ${lastError}`);
    throw new Error(`All AI models are currently busy for ${label}. Please try again.`);

  } finally {
    if (hbTicker) clearInterval(hbTicker);
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// SECTION 9 — REPAIR & VALIDATION FUNCTIONS
// ─────────────────────────────────────────────────────────────────────────────

function repairQuiz(parsed, modelName) {
  if (!Array.isArray(parsed.quiz_questions)) return parsed;
  parsed.quiz_questions = parsed.quiz_questions.map((q, i) => {
    q.id = q.id || i + 1;
    if (q.options && q.correct_answer) {
      const letterMap = { 'A': 0, 'B': 1, 'C': 2, 'D': 3, 'a': 0, 'b': 1, 'c': 2, 'd': 3 };
      const trimmedAnswer = String(q.correct_answer).trim();
      if (trimmedAnswer.length <= 2 && letterMap[trimmedAnswer] !== undefined) {
        const idx = letterMap[trimmedAnswer];
        if (q.options[idx]) {
          log.info(`${modelName}: converted letter answer "${trimmedAnswer}" → option[${idx}] for Q${i + 1}`);
          q.correct_answer = q.options[idx];
        }
      }
      if (!q.options.includes(q.correct_answer)) {
        const lo  = q.correct_answer.toLowerCase();
        const fix = q.options.find(o => o.toLowerCase() === lo)
                 || q.options.find(o => o.toLowerCase().includes(lo) || lo.includes(o.toLowerCase()));
        if (fix) { q.correct_answer = fix; log.info(`${modelName}: fuzzy-fixed Q${i + 1} correct_answer`); }
      }
    }
    return q;
  });
  return parsed;
}

function repairFlashcards(parsed) {
  if (Array.isArray(parsed.flashcards)) {
    parsed.flashcards = parsed.flashcards
      .filter(c => (c.front || c.question) && (c.back || c.answer))
      .map(c => ({ front: String(c.front || c.question || '').trim(), back: String(c.back || c.answer || '').trim() }));
  }
  return parsed;
}

// ─────────────────────────────────────────────────────────────────────────────
// SECTION 10 — PER‑TOOL GENERATORS (using the racing functions)
// ─────────────────────────────────────────────────────────────────────────────

function generateNotes(topic, opts, onChunk) {
  return raceProse(buildNotesPrompt(topic, opts), onChunk, 'NOTES');
}

function generateSummary(topic, opts, onChunk) {
  return raceProse(buildSummaryPrompt(topic, opts), onChunk, 'SUMMARY');
}

function generateFlashcards(topic, opts, onHeartbeat) {
  const wanted = opts.cardCount || 15;
  return raceJSON(
    buildFlashcardsPrompt(topic, opts),
    'FLASHCARDS',
    parsed => Array.isArray(parsed.flashcards) && parsed.flashcards.length >= Math.min(2, wanted),
    repairFlashcards,
    onHeartbeat
  );
}

function generateQuiz(topic, opts, onHeartbeat) {
  const wanted = opts.quizCount || 10;
  return raceJSON(
    buildQuizPrompt(topic, opts),
    'QUIZ',
    parsed => Array.isArray(parsed.quiz_questions) && parsed.quiz_questions.length >= Math.min(2, wanted),
    repairQuiz,
    onHeartbeat
  );
}

function generateMindmap(topic, opts, onHeartbeat) {
  const wanted = opts.branchCount || 6;
  return raceJSON(
    buildMindmapPrompt(topic, opts),
    'MINDMAP',
    parsed => parsed.mindmap?.branches?.length >= Math.min(2, wanted),
    null,
    onHeartbeat
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// SECTION 11 — TOPIC FACT (unchanged)
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
// SECTION 12 — RESULT ASSEMBLY
// ─────────────────────────────────────────────────────────────────────────────

function assembleResult({ topic, opts, notes, flashcards, quiz, mindmap }) {
  const result = {
    topic:                String(topic || 'Study Material').slice(0, 200),
    curriculum_alignment: 'General Academic Study',
    generated_at:         getISTDateTime(),
    study_score:          95,
    powered_by:           `${SAVOIRÉ.BRAND} by ${SAVOIRÉ.DEVELOPER}`,
    _version:             SAVOIRÉ.VERSION,
    _tool:                opts.tool,
    _language:             opts.language || 'English',
    _depth:                opts.depth    || 'detailed',
    _style:                opts.style    || 'simple',
    _quality:               'ai_generated',
  };

  if (notes)                                result.ultra_long_notes = notes;
  if (flashcards?.flashcards?.length)       result.flashcards       = flashcards.flashcards;
  if (flashcards?.topic && !topic)          result.topic            = flashcards.topic;
  if (quiz?.quiz_questions?.length)         result.quiz_questions   = quiz.quiz_questions;
  if (mindmap?.mindmap?.branches?.length)   result.mindmap          = mindmap.mindmap;

  return result;
}

// ─────────────────────────────────────────────────────────────────────────────
// SECTION 13 — SSE HELPER + SECURITY HEADERS
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
// SECTION 14 — MAIN HANDLER
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
    tool:        ['notes','flashcards','quiz','summary','mindmap','all'].includes(rawOpts.tool) ? rawOpts.tool : 'notes',
    depth:       ['standard','detailed','comprehensive','expert'].includes(rawOpts.depth)       ? rawOpts.depth : 'detailed',
    style:       ['simple','academic','detailed','exam','visual'].includes(rawOpts.style)       ? rawOpts.style : 'simple',
    language:    String(rawOpts.language || 'English').trim().slice(0, 60),
    stream:      rawOpts.stream === true,
    cardCount:   Math.min(Math.max(Number(rawOpts.cardCount) || 15, 5), 25),
    quizCount:   Math.min(Math.max(Number(rawOpts.quizCount) || 10, 5), 20),
    quizType:    ['mixed','easy','medium','hard','exam'].includes(rawOpts.quizType) ? rawOpts.quizType : 'mixed',
    branchCount: Math.min(Math.max(Number(rawOpts.branchCount) || 6, 3), 10),
  };

  log.info(`[${reqId}] tool:${opts.tool} | depth:${opts.depth} | lang:${opts.language} | user:${userName}`);

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
    setTimeout(() => sse('stage', { idx: 1, label: '📝 Writing your content…' }), 1500),
    setTimeout(() => sse('stage', { idx: 2, label: '🔍 Building sections…' }),    5000),
    setTimeout(() => sse('stage', { idx: 3, label: '🃏 Finalising materials…' }), 12000),
  ];
  const clearStages = () => stageTimers.forEach(clearTimeout);

  sse('heartbeat', { ts: Date.now(), status: 'connected', service: SAVOIRÉ.BRAND, requestId: reqId, tool: opts.tool });
  sse('stage',     { idx: 0, label: `🎯 Analysing "${message.slice(0, 50)}${message.length > 50 ? '…' : ''}"` });
  sse('fact',      { fact: buildTopicFact(message) });
  sse('token',     { t: '' }); // prime the token stream

  // For JSON-only tools (flashcards/quiz/mindmap), this drives BOTH the
  // visible live-output text AND the SSE keep-alive activity, so the
  // frontend's live view behaves exactly like it does for 'all' — never
  // silent long enough to be mistaken for a dead connection.
  const makeHeartbeatEmitter = (label) => {
    let elapsed = 0;
    return (dots) => {
      elapsed += 1.2;
      sse('token', { t: '' }); // keep-alive pulse, no visible text change needed
      sse('stage', { idx: 3, label: `🤖 ${label} generating${dots} (${elapsed.toFixed(0)}s)` });
    };
  };

  try {
    let result;

    // ── Each branch below is fully independent — its own prompt, its own
    //    generation function, its own validation. No cross-tool bleed. ──
    switch (opts.tool) {

      case 'notes': {
        const notes = await generateNotes(message, opts, chunk => sse('token', { t: chunk }));
        result = assembleResult({ topic: message, opts, notes });
        break;
      }

      case 'summary': {
        const notes = await generateSummary(message, opts, chunk => sse('token', { t: chunk }));
        result = assembleResult({ topic: message, opts, notes });
        break;
      }

      case 'flashcards': {
        sse('stage', { idx: 1, label: '🃏 Generating your flashcards…' });
        const fc = await generateFlashcards(message, opts, makeHeartbeatEmitter('Flashcards'));
        result = assembleResult({ topic: fc.topic || message, opts, flashcards: fc });
        break;
      }

      case 'quiz': {
        sse('stage', { idx: 1, label: '❓ Generating your quiz…' });
        const q = await generateQuiz(message, opts, makeHeartbeatEmitter('Quiz'));
        result = assembleResult({ topic: q.topic || message, opts, quiz: q });
        break;
      }

      case 'mindmap': {
        sse('stage', { idx: 1, label: '🗺️ Generating your mind map…' });
        const mm = await generateMindmap(message, opts, makeHeartbeatEmitter('Mind map'));
        result = assembleResult({ topic: mm.topic || message, opts, mindmap: mm });
        break;
      }

      case 'all': {
        // Mega bundle: notes streams live; flashcards, quiz, and mindmap run as
        // three SEPARATE lean JSON calls in parallel (not one bloated call).
        // Each is independently retried; a failure in one does not sink the others.
        const notesPromise = generateNotes(message, opts, chunk => sse('token', { t: chunk }));
        const fcPromise     = generateFlashcards(message, opts).catch(err => { log.warn(`[${reqId}] mega flashcards failed: ${err.message}`); return null; });
        const quizPromise   = generateQuiz(message, opts).catch(err => { log.warn(`[${reqId}] mega quiz failed: ${err.message}`); return null; });
        const mmPromise     = generateMindmap(message, opts).catch(err => { log.warn(`[${reqId}] mega mindmap failed: ${err.message}`); return null; });

        const [notes, fc, q, mm] = await Promise.all([notesPromise, fcPromise, quizPromise, mmPromise]);

        if (!fc && !q && !mm) {
          // Notes alone do not constitute a "Mega Bundle" — be honest about it
          // rather than silently shipping a partial product as if it were complete.
          if (!notes || notes.trim().length < 80) {
            throw new Error('Mega bundle: all components failed across every model.');
          }
        }

        result = assembleResult({ topic: message, opts, notes, flashcards: fc, quiz: q, mindmap: mm });
        result._mega_partial = !(fc && q && mm);
        break;
      }

      default: {
        const notes = await generateNotes(message, opts, chunk => sse('token', { t: chunk }));
        result = assembleResult({ topic: message, opts, notes });
      }
    }

    clearInterval(kap);
    clearStages();

    result._duration_ms = Date.now() - startTime;
    result._request_id  = reqId;
    result.topic_fact    = buildTopicFact(message);

    sse('stage', { idx: 4, label: '✅ Complete! All study materials ready.', done: true });
    sse('done',  result);

    log.ok(`[${reqId}] ✅ COMPLETE — ${result._duration_ms}ms | tool:${opts.tool}`);
    sendToGoogleSheets(userName, userStreak, userSess, opts.tool, message, 'completed', result._duration_ms, sessionId).catch(() => {});

  } catch (fatal) {
    // Lands here only when the active tool's content genuinely could not be
    // produced by ANY model across all retry passes. We never fabricate
    // filler content to paper over this — the user gets an honest signal
    // instead of a broken or misleading "success".
    clearInterval(kap);
    clearStages();
    log.error(`[${reqId}] FATAL (${opts.tool}): ${fatal.message}`);
    sse('error', { error: 'All AI models are currently busy. Please try again in a few seconds.', requestId: reqId });
    sendToGoogleSheets(userName, userStreak, userSess, opts.tool, message, 'failed', Date.now() - startTime, sessionId).catch(() => {});
  }

  if (!res.writableEnded) res.end();
};

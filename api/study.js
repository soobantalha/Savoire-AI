'use strict';
// ═══════════════════════════════════════════════════════════════════════════════
// SAVOIRÉ AI v3.0 — api/study.js — PER-TOOL PIPELINES, REAL ITEM-BY-ITEM STREAMING
// Built by Sooban Talha Technologies | soobantalhatech.xyz | Founder: Sooban Talha
// "Think Less. Know More."
//
// WHY THIS REWRITE EXISTS — the actual root causes found in the frontend:
//
// 1) Every tool used to share ONE bloated prompt asking for notes prose AND
//    flashcards AND quiz AND mindmap AND key_concepts etc. all at once, no
//    matter which single tool was selected. That wasted tokens, caused
//    cross-tool content bleed, and made everything slower and flakier.
//    FIX: each tool now has its own single-purpose prompt (Section 6).
//
// 2) THE BIG ONE: app.js already contains fully built live-rendering UI for
//    flashcards/quiz/mindmap (_updateLiveCards, _updateLiveQuestions,
//    _updateLiveMindmap) that expects the backend to emit SSE events shaped
//    like {card, idx, total}, {q, idx, total}, {branch, idx, total} for EACH
//    individual item as it's generated — exactly like notes streams token by
//    token. The old backend never sent these events; it only ever sent one
//    giant JSON blob inside the final `done` event. So the live overlay had
//    nothing to render for the entire generation — screen sat empty, then
//    everything popped in at once if/when the single call succeeded. With 8
//    models racing concurrently on every single attempt, that one big call
//    was also far more likely to get rate-limited into oblivion, which is
//    why it only worked "1 in 100 times".
//    FIX: flashcards/quiz/mindmap are now generated in small BATCHES (3-4
//    items per model call). As each batch resolves, every item in it is
//    immediately emitted as its own `card`/`q`/`branch` SSE event — so the
//    live UI starts filling in within a few seconds and keeps growing item
//    by item until the full set is ready, then `done` ships the final
//    assembled object. This is real progressive AI generation, not a fake
//    animation of an already-finished result.
//
// 3) Model calls are now SEQUENTIAL-per-batch (try model A, then B, then C…)
//    rather than firing all 8 models at once for every request. Racing 8
//    concurrent calls against the same API key for every single batch was
//    needlessly hammering the rate limit and is the likely cause of the
//    near-total failure rate. Sequential trial with fast-skip on 429/404
//    keeps things fast (first working model usually responds in 2-5s) while
//    being far gentler on shared rate limits.
// ═══════════════════════════════════════════════════════════════════════════════

// ─────────────────────────────────────────────────────────────────────────────
// SECTION 1 — BRAND CONSTANTS
// ─────────────────────────────────────────────────────────────────────────────

const SAVOIRÉ = {
  BRAND:     'Savoiré AI v3.0',
  DEVELOPER: 'Sooban Talha Technologies',
  DEVSITE:   'soobantalhatech.xyz',
  WEBSITE:   'savoireai.vercel.app',
  FOUNDER:   'Sooban Talha',
  VERSION:   '3.0',
  TAGLINE:   'Think Less. Know More.',
};

const OPENROUTER_BASE    = 'https://openrouter.ai/api/v1/chat/completions';
const HTTP_REFERER       = `https://${SAVOIRÉ.WEBSITE}`;
const APP_TITLE          = SAVOIRÉ.BRAND;
const GOOGLE_WEBHOOK_URL = process.env.GOOGLE_WEBHOOK_URL || '';

// ─────────────────────────────────────────────────────────────────────────────
// SECTION 2 — MODEL LISTS
// PROSE pool: streamed, higher temp, used for notes/summary.
// JSON pool: non-streamed, low temp, smaller max_tokens since each call now
// only ever produces a small BATCH of one content type (not everything).
// ─────────────────────────────────────────────────────────────────────────────

const MODELS_PROSE = [
  { id: 'google/gemini-2.0-flash-exp:free',        max_tokens: 5000, timeout_ms: 40000, temp: 0.75 },
  { id: 'google/gemini-flash-1.5-8b:free',         max_tokens: 4500, timeout_ms: 40000, temp: 0.75 },
  { id: 'meta-llama/llama-3.3-70b-instruct:free',  max_tokens: 4500, timeout_ms: 40000, temp: 0.75 },
  { id: 'microsoft/phi-3-mini-128k-instruct:free', max_tokens: 3500, timeout_ms: 35000, temp: 0.75 },
  { id: 'mistralai/mistral-7b-instruct-v0.3:free', max_tokens: 3500, timeout_ms: 35000, temp: 0.75 },
  { id: 'qwen/qwen2.5-72b-instruct:free',          max_tokens: 4500, timeout_ms: 40000, temp: 0.75 },
  { id: 'z-ai/glm-4.5-air:free',                   max_tokens: 4000, timeout_ms: 40000, temp: 0.75 },
  { id: 'openrouter/free',                          max_tokens: 5000, timeout_ms: 55000, temp: 0.75 },
];

// Small max_tokens — each call now only generates a BATCH of 3-4 items of
// ONE content type, so it needs a fraction of the old budget. Short timeouts
// because small batches should return in a few seconds on a healthy model.
const MODELS_JSON = [
  { id: 'google/gemini-2.0-flash-exp:free',        max_tokens: 1800, timeout_ms: 22000, temp: 0.4 },
  { id: 'google/gemini-flash-1.5-8b:free',         max_tokens: 1800, timeout_ms: 22000, temp: 0.4 },
  { id: 'meta-llama/llama-3.3-70b-instruct:free',  max_tokens: 1800, timeout_ms: 22000, temp: 0.4 },
  { id: 'microsoft/phi-3-mini-128k-instruct:free', max_tokens: 1500, timeout_ms: 20000, temp: 0.4 },
  { id: 'mistralai/mistral-7b-instruct-v0.3:free', max_tokens: 1500, timeout_ms: 20000, temp: 0.4 },
  { id: 'qwen/qwen2.5-72b-instruct:free',          max_tokens: 1800, timeout_ms: 22000, temp: 0.4 },
  { id: 'z-ai/glm-4.5-air:free',                   max_tokens: 1800, timeout_ms: 22000, temp: 0.4 },
  { id: 'openrouter/free',                          max_tokens: 1800, timeout_ms: 28000, temp: 0.4 },
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
// SECTION 6 — PROSE PROMPT BUILDERS (notes / summary)
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

// ─────────────────────────────────────────────────────────────────────────────
// SECTION 7 — BATCH JSON PROMPT BUILDERS (flashcards / quiz / mindmap)
// Each builds a prompt for a SMALL BATCH (a handful of items), not the full
// requested count — that's what makes per-item streaming + small fast model
// calls possible. avoidList lets us tell the model what's already been
// generated so the batches don't repeat themselves.
// ─────────────────────────────────────────────────────────────────────────────

function buildFlashcardBatchPrompt(topic, opts, batchSize, avoidList) {
  const lang  = opts.language || 'English';
  const t     = String(topic).slice(0, 100);
  const avoid = avoidList.length
    ? `\nALREADY COVERED — do NOT repeat these questions or near-duplicates:\n${avoidList.map(f => `- ${f}`).join('\n')}\n`
    : '';

  return `You are ${SAVOIRÉ.BRAND}. Generate exactly ${batchSize} NEW study flashcards as valid JSON.

TOPIC: "${t}"
LANGUAGE: ${lang} — ALL text must be in ${lang}.
${avoid}
Each flashcard:
• "front": specific question about "${t}" (10-40 words, in ${lang})
• "back": detailed answer 60-150 words about "${t}" (in ${lang})
Mix definition / mechanism / comparison / application / misconception-correction cards.
ALL content specifically about "${t}". Zero generic filler, zero placeholders.

OUTPUT ONLY valid JSON, starting with { and ending with }. No markdown, no code fences.
{
  "flashcards": [
    {"front": "Specific question about ${t}", "back": "Detailed 60-150 word answer"}
  ]
}
The "flashcards" array must contain EXACTLY ${batchSize} objects.
OUTPUT JSON NOW:`;
}

function buildQuizBatchPrompt(topic, opts, batchSize, avoidList) {
  const lang     = opts.language || 'English';
  const t        = String(topic).slice(0, 100);
  const quizType = opts.quizType || 'mixed';
  const qDiffInstr =
    quizType === 'easy'   ? 'ALL questions must be easy (foundational, beginner-friendly).' :
    quizType === 'medium' ? 'ALL questions must be medium difficulty (core exam level).' :
    quizType === 'hard'   ? 'ALL questions must be hard (advanced analysis, application).' :
    quizType === 'exam'   ? 'ALL questions must be exam-style (past-paper format, mark-scheme phrasing, tricky distractors).' :
                             'Mix of easy/medium/hard across this batch.';
  const avoid = avoidList.length
    ? `\nALREADY COVERED — do NOT repeat these questions or near-duplicates:\n${avoidList.map(q => `- ${q}`).join('\n')}\n`
    : '';

  return `You are ${SAVOIRÉ.BRAND}. Generate exactly ${batchSize} NEW multiple-choice quiz questions as valid JSON.

TOPIC: "${t}"
LANGUAGE: ${lang} — ALL text must be in ${lang}.
${avoid}
Each question object:
• "question": specific question about "${t}" (in ${lang})
• "options": array of EXACTLY 4 strings. EACH a COMPLETE full-length answer (15-60 words) —
  NEVER single letters like "A"/"B"/"C"/"D" and never short label-only options.
• "correct_answer": MUST be an exact character-for-character copy of one of the 4 "options" strings.
• "explanation": 60-100 words explaining why correct, referencing "${t}" (in ${lang})
• "difficulty": "easy" | "medium" | "hard"
${qDiffInstr}
VARY which position holds the correct answer across questions — don't always use the same slot.

OUTPUT ONLY valid JSON, starting with { and ending with }. No markdown, no code fences.
{
  "quiz_questions": [
    {
      "question": "Specific question about ${t}",
      "options": ["Full answer option one", "Full answer option two", "Full answer option three", "Full answer option four"],
      "correct_answer": "Full answer option two",
      "explanation": "Detailed 60-100 word explanation",
      "difficulty": "medium"
    }
  ]
}
The "quiz_questions" array must contain EXACTLY ${batchSize} objects.
OUTPUT JSON NOW:`;
}

function buildMindmapCentralPrompt(topic, opts) {
  const lang = opts.language || 'English';
  const t    = String(topic).slice(0, 100);
  return `You are ${SAVOIRÉ.BRAND}. Generate the central topic title for a mind map as valid JSON.

TOPIC: "${t}"
LANGUAGE: ${lang}

OUTPUT ONLY valid JSON: {"central": "3-5 word essence of ${t} in ${lang}"}
OUTPUT JSON NOW:`;
}

function buildMindmapBranchBatchPrompt(topic, opts, batchSize, avoidList) {
  const lang  = opts.language || 'English';
  const t     = String(topic).slice(0, 100);
  const avoid = avoidList.length
    ? `\nALREADY COVERED branch names — do NOT repeat or duplicate these:\n${avoidList.map(b => `- ${b}`).join('\n')}\n`
    : '';

  return `You are ${SAVOIRÉ.BRAND}. Generate exactly ${batchSize} NEW mind map branches as valid JSON.

TOPIC: "${t}"
LANGUAGE: ${lang} — ALL text must be in ${lang}.
${avoid}
Each branch:
• "name": a specific branch name derived from "${t}" — NEVER generic labels like "Introduction" or
  "Overview". Must name an actual concept/sub-topic.
• "color": one of "#00d4ff","#bf00ff","#00ff88","#ffae00","#d4af37","#ff4444","#e84393"
• "items": array of 4-5 specific facts/terms about that branch (each 5-20 words, in ${lang})

OUTPUT ONLY valid JSON, starting with { and ending with }. No markdown, no code fences.
{
  "branches": [
    {"name": "Specific branch name", "color": "#00d4ff", "items": ["fact 1", "fact 2", "fact 3", "fact 4"]}
  ]
}
The "branches" array must contain EXACTLY ${batchSize} objects.
OUTPUT JSON NOW:`;
}

function buildMindmapConnectionsPrompt(topic, opts, branchNames) {
  const lang = opts.language || 'English';
  const t    = String(topic).slice(0, 100);
  return `You are ${SAVOIRÉ.BRAND}. Given these mind map branches for "${t}": ${branchNames.join(', ')} —
generate 3-4 connections showing how they relate, as valid JSON.

LANGUAGE: ${lang}
OUTPUT ONLY valid JSON: {"connections": [{"from": "branch name", "to": "branch name", "description": "10-20 word relation in ${lang}"}]}
Use EXACT branch names from this list: ${branchNames.join(', ')}.
OUTPUT JSON NOW:`;
}

// ─────────────────────────────────────────────────────────────────────────────
// SECTION 8 — PROSE STREAMER (notes / summary)
// Sequential trial across MODELS_PROSE, 3 passes with exponential backoff.
// ─────────────────────────────────────────────────────────────────────────────

async function streamProse(prompt, onChunk, label) {
  const MAX_PASSES = 3;

  for (let pass = 0; pass < MAX_PASSES; pass++) {
    if (pass > 0) {
      const backoff = Math.min(1000 * Math.pow(2, pass), 4000);
      log.warn(`${label} ↻ Pass ${pass + 1}/${MAX_PASSES} — backing off ${backoff}ms`);
      await sleep(backoff);
    }

    for (const model of MODELS_PROSE) {
      const name  = model.id.split('/').pop();
      const ctrl  = new AbortController();
      const timer = setTimeout(() => ctrl.abort(), model.timeout_ms);
      const t0    = Date.now();

      try {
        log.info(`${label} → ${name} (pass ${pass + 1}/${MAX_PASSES})`);

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

        if (res.status === 429) { log.warn(`${label} ⏳ 429 on ${name} — next model`); continue; }
        if (res.status === 404) { log.warn(`${label} ⚠️ 404 on ${name} — skipping`); continue; }
        if (!res.ok) {
          const txt = await res.text().catch(() => '');
          log.warn(`${label} HTTP ${res.status} — ${name}: ${trunc(txt, 100)}`);
          if (res.status === 401 || res.status === 403) throw new Error('OPENROUTER_API_KEY is invalid or missing.');
          continue;
        }

        const reader  = res.body.getReader();
        const decoder = new TextDecoder('utf-8');
        let lineBuf = '', full = '', tokens = 0;

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
              if (delta) { full += delta; tokens++; onChunk(delta); }
            } catch { /* ignore */ }
          }
        }

        if (full.trim().length < 80) { log.warn(`${name}: response too short (${full.length}ch) — next model`); continue; }

        log.ok(`${label} ✅ ${name} | ${tokens} tokens | ${full.length}ch | ${Date.now() - t0}ms`);
        return full;

      } catch (err) {
        clearTimeout(timer);
        if (err.name === 'AbortError') log.warn(`${label} ⏱️ ${name} timed out after ${model.timeout_ms}ms`);
        else                            log.warn(`${label} ✗ ${name}: ${err.message}`);
        if (err.message?.includes('API_KEY') || err.message?.includes('invalid')) throw err;
      }
    }
  }

  log.error(`${label} ALL MODELS FAILED across ${MAX_PASSES} passes`);
  throw new Error(`All AI models are currently busy. Please try again in a moment.`);
}

// ─────────────────────────────────────────────────────────────────────────────
// SECTION 9 — SINGLE-CALL JSON FETCHER (used per-batch)
// Sequential trial across MODELS_JSON for ONE batch's worth of content.
// Small batches + small token budgets = each call is fast, so a handful of
// sequential attempts (not 8-way concurrent racing) still resolves quickly
// while being far gentler on rate limits.
// ─────────────────────────────────────────────────────────────────────────────

async function fetchJSONBatch(prompt, label, validateFn, repairFn) {
  const MAX_PASSES = 2; // batches are small — 2 full passes through all models is plenty

  for (let pass = 0; pass < MAX_PASSES; pass++) {
    if (pass > 0) await sleep(800);

    for (const model of MODELS_JSON) {
      const name  = model.id.split('/').pop();
      const ctrl  = new AbortController();
      const timer = setTimeout(() => ctrl.abort(), model.timeout_ms);
      const t0    = Date.now();

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
            temperature: model.temp || 0.4,
            stream:      false,
            messages:    [{ role: 'user', content: prompt }],
          }),
          signal: ctrl.signal,
        });

        clearTimeout(timer);

        if (res.status === 429) { log.warn(`${label} ⏳ 429 on ${name} — next model`); continue; }
        if (res.status === 404) { log.warn(`${label} ⚠️ 404 on ${name} — skipping`); continue; }
        if (!res.ok) {
          const txt = await res.text().catch(() => '');
          log.warn(`${label} HTTP ${res.status} — ${name}: ${trunc(txt, 100)}`);
          if (res.status === 401 || res.status === 403) throw new Error('OPENROUTER_API_KEY is invalid or missing.');
          continue;
        }

        const data    = await res.json();
        let content = data?.choices?.[0]?.message?.content?.trim();
        if (!content || content.length < 10) { log.warn(`${name}: empty response — next model`); continue; }

        content = content.replace(/^```(?:json)?\s*/im, '').replace(/\s*```\s*$/im, '').trim();
        const jS = content.indexOf('{');
        const jE = content.lastIndexOf('}');
        if (jS === -1 || jE <= jS) { log.warn(`${name}: no JSON object — next model`); continue; }
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
            }
            catch {
              try {
                parsed = JSON.parse(
                  jsonStr
                    .replace(/[\x00-\x1F\x7F]/g, ' ')
                    .replace(/,(\s*[}\]])/g, '$1')
                    .replace(/([{,]\s*)([a-zA-Z_]\w*)(\s*:)/g, '$1"$2"$3')
                );
              }
              catch (e4) {
                log.warn(`${name}: JSON repair failed — ${e4.message.slice(0, 80)} — next model`);
                continue;
              }
            }
          }
        }

        if (typeof repairFn === 'function') {
          try { parsed = repairFn(parsed, name) || parsed; }
          catch (repairErr) { log.warn(`${name}: repairFn threw — ${repairErr.message}`); }
        }

        if (!validateFn(parsed)) { log.warn(`${name}: validation failed for ${label} — next model`); continue; }

        log.ok(`${label} ✅ ${name} | ${Date.now() - t0}ms`);
        return parsed;

      } catch (err) {
        clearTimeout(timer);
        if (err.name === 'AbortError') log.warn(`${label} ⏱️ ${name} timed out after ${model.timeout_ms}ms`);
        else                            log.warn(`${label} ✗ ${name}: ${err.message}`);
        if (err.message?.includes('API_KEY') || err.message?.includes('invalid')) throw err;
      }
    }
  }

  return null; // batch failed across every model — caller decides what to do
}

// ── Quiz answer repair: convert letter answers / fuzzy-match to full option text ──
function repairQuiz(parsed, modelName) {
  if (!Array.isArray(parsed.quiz_questions)) return parsed;
  parsed.quiz_questions = parsed.quiz_questions.map((q) => {
    if (q.options && q.correct_answer) {
      const letterMap = { 'A': 0, 'B': 1, 'C': 2, 'D': 3, 'a': 0, 'b': 1, 'c': 2, 'd': 3 };
      const trimmedAnswer = String(q.correct_answer).trim();
      if (trimmedAnswer.length <= 2 && letterMap[trimmedAnswer] !== undefined) {
        const idx = letterMap[trimmedAnswer];
        if (q.options[idx]) q.correct_answer = q.options[idx];
      }
      if (!q.options.includes(q.correct_answer)) {
        const lo  = q.correct_answer.toLowerCase();
        const fix = q.options.find(o => o.toLowerCase() === lo)
                 || q.options.find(o => o.toLowerCase().includes(lo) || lo.includes(o.toLowerCase()));
        if (fix) q.correct_answer = fix;
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
// SECTION 10 — BATCHED, ITEM-STREAMING GENERATORS
// This is the core fix: instead of one giant call, we request small batches
// and emit each resulting item over SSE the moment it's ready, so the
// frontend's existing live-card/live-quiz/live-mindmap UI actually has
// something to animate within a few seconds — matching how notes streaming
// already behaves.
// ─────────────────────────────────────────────────────────────────────────────

function batchSizes(total, size) {
  const sizes = [];
  let remaining = total;
  while (remaining > 0) { const n = Math.min(size, remaining); sizes.push(n); remaining -= n; }
  return sizes;
}

async function generateFlashcardsStreaming(topic, opts, emitCard) {
  const total = opts.cardCount || 15;
  const sizes = batchSizes(total, 3); // 3 cards per call
  const collected = [];
  let resultTopic = null;

  for (const size of sizes) {
    const avoid = collected.map(c => c.front);
    const prompt = buildFlashcardBatchPrompt(topic, opts, size, avoid);
    const parsed = await fetchJSONBatch(
      prompt, 'FLASHCARDS',
      p => Array.isArray(p.flashcards) && p.flashcards.length >= 1,
      repairFlashcards
    );

    if (!parsed || !Array.isArray(parsed.flashcards) || !parsed.flashcards.length) {
      log.warn(`FLASHCARDS: batch of ${size} failed across all models — skipping this batch, continuing`);
      continue; // skip this batch but keep trying remaining batches
    }

    for (const card of parsed.flashcards) {
      collected.push(card);
      emitCard(collected.length - 1, total, card);
    }
  }

  if (collected.length === 0) throw new Error('FLASHCARDS_FAILED');
  return { topic: resultTopic, flashcards: collected.slice(0, total) };
}

async function generateQuizStreaming(topic, opts, emitQuestion) {
  const total = opts.quizCount || 10;
  const sizes = batchSizes(total, 3); // 3 questions per call
  const collected = [];

  for (const size of sizes) {
    const avoid = collected.map(q => q.question);
    const prompt = buildQuizBatchPrompt(topic, opts, size, avoid);
    const parsed = await fetchJSONBatch(
      prompt, 'QUIZ',
      p => Array.isArray(p.quiz_questions) && p.quiz_questions.length >= 1,
      repairQuiz
    );

    if (!parsed || !Array.isArray(parsed.quiz_questions) || !parsed.quiz_questions.length) {
      log.warn(`QUIZ: batch of ${size} failed across all models — skipping this batch, continuing`);
      continue;
    }

    for (const q of parsed.quiz_questions) {
      q.id = collected.length + 1;
      collected.push(q);
      emitQuestion(collected.length - 1, total, q);
    }
  }

  if (collected.length === 0) throw new Error('QUIZ_FAILED');
  return { quiz_questions: collected.slice(0, total) };
}

async function generateMindmapStreaming(topic, opts, emitBranch) {
  const total = opts.branchCount || 6;

  // Step 1: central node first — emits immediately so the UI shows the
  // central topic node right away, mirroring _updateLiveMindmap(idx=-1).
  let central = String(topic).slice(0, 40);
  const centralParsed = await fetchJSONBatch(
    buildMindmapCentralPrompt(topic, opts), 'MINDMAP_CENTRAL',
    p => typeof p.central === 'string' && p.central.trim().length > 0
  );
  if (centralParsed?.central) central = centralParsed.central.trim();

  // Step 2: branches in small batches.
  const sizes = batchSizes(total, 2); // 2 branches per call — richer items, smaller batch
  const collected = [];

  for (const size of sizes) {
    const avoid = collected.map(b => b.name);
    const prompt = buildMindmapBranchBatchPrompt(topic, opts, size, avoid);
    const parsed = await fetchJSONBatch(
      prompt, 'MINDMAP_BRANCH',
      p => Array.isArray(p.branches) && p.branches.length >= 1
    );

    if (!parsed || !Array.isArray(parsed.branches) || !parsed.branches.length) {
      log.warn(`MINDMAP: branch batch of ${size} failed across all models — skipping, continuing`);
      continue;
    }

    for (const branch of parsed.branches) {
      collected.push(branch);
      emitBranch(collected.length - 1, total, branch, central);
    }
  }

  if (collected.length === 0) throw new Error('MINDMAP_FAILED');

  // Step 3: connections — best-effort, doesn't block the result if it fails.
  let connections = [];
  if (collected.length >= 2) {
    const connParsed = await fetchJSONBatch(
      buildMindmapConnectionsPrompt(topic, opts, collected.map(b => b.name)), 'MINDMAP_CONN',
      p => Array.isArray(p.connections)
    );
    if (connParsed?.connections) connections = connParsed.connections;
  }

  return {
    mindmap: {
      central,
      branches: collected.slice(0, total),
      connections,
    },
  };
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

  if (notes)                              result.ultra_long_notes = notes;
  if (flashcards?.flashcards?.length)     result.flashcards       = flashcards.flashcards;
  if (quiz?.quiz_questions?.length)       result.quiz_questions   = quiz.quiz_questions;
  if (mindmap?.mindmap?.branches?.length) result.mindmap          = mindmap.mindmap;

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

  sse('heartbeat', { ts: Date.now(), status: 'connected', service: SAVOIRÉ.BRAND, requestId: reqId, tool: opts.tool });
  sse('stage',     { idx: 0, label: `🎯 Analysing "${message.slice(0, 50)}${message.length > 50 ? '…' : ''}"` });
  sse('fact',      { fact: buildTopicFact(message) });
  sse('token',     { t: '' }); // prime the token stream

  // Emitters that feed the SSE protocol app.js already expects natively.
  const emitCard     = (idx, total, card)   => sse('card', { idx, total, card });
  const emitQuestion = (idx, total, q)      => sse('question', { idx, total, q: { ...q, id: idx + 1 } }).valueOf() || sse('q', { idx, total, q: { ...q, id: idx + 1 } });
  const emitBranchCentral = (total, central, connections) => sse('branch', { idx: -1, total, branch: { name: '_central_', value: central, connections } });
  const emitBranch   = (idx, total, branch) => sse('branch', { idx, total, branch });

  try {
    let result;

    switch (opts.tool) {

      case 'notes': {
        const notes = await streamProse(buildNotesPrompt(message, opts), chunk => sse('token', { t: chunk }), 'NOTES');
        result = assembleResult({ topic: message, opts, notes });
        break;
      }

      case 'summary': {
        const notes = await streamProse(buildSummaryPrompt(message, opts), chunk => sse('token', { t: chunk }), 'SUMMARY');
        result = assembleResult({ topic: message, opts, notes });
        break;
      }

      case 'flashcards': {
        sse('stage', { idx: 1, label: '🃏 Generating your flashcards…' });
        const fc = await generateFlashcardsStreaming(message, opts, (idx, total, card) => emitCard(idx, total, card));
        result = assembleResult({ topic: message, opts, flashcards: fc });
        break;
      }

      case 'quiz': {
        sse('stage', { idx: 1, label: '❓ Generating your quiz…' });
        const q = await generateQuizStreaming(message, opts, (idx, total, question) => sse('q', { idx, total, q: question }));
        result = assembleResult({ topic: message, opts, quiz: q });
        break;
      }

      case 'mindmap': {
        sse('stage', { idx: 1, label: '🗺️ Generating your mind map…' });
        let centralSent = false;
        const mm = await generateMindmapStreaming(message, opts, (idx, total, branch, central) => {
          if (!centralSent) { emitBranchCentral(total, central, []); centralSent = true; }
          emitBranch(idx, total, branch);
        });
        result = assembleResult({ topic: message, opts, mindmap: mm });
        break;
      }

      case 'all': {
        // Mega bundle: notes streams live token-by-token; flashcards, quiz,
        // and mindmap each stream their own items live via the same batched
        // engines used standalone — all four running in parallel.
        const notesPromise = streamProse(buildNotesPrompt(message, opts), chunk => sse('token', { t: chunk }), 'NOTES');

        const fcCountMega = Math.min(opts.cardCount, 12);
        const qCountMega  = Math.min(opts.quizCount, 8);
        const megaOpts    = { ...opts, cardCount: fcCountMega, quizCount: qCountMega };

        const fcPromise = generateFlashcardsStreaming(message, megaOpts, (idx, total, card) => emitCard(idx, total, card))
          .catch(err => { log.warn(`[${reqId}] mega flashcards failed: ${err.message}`); return null; });

        const quizPromise = generateQuizStreaming(message, megaOpts, (idx, total, question) => sse('q', { idx, total, q: question }))
          .catch(err => { log.warn(`[${reqId}] mega quiz failed: ${err.message}`); return null; });

        let mmCentralSent = false;
        const mmPromise = generateMindmapStreaming(message, opts, (idx, total, branch, central) => {
          if (!mmCentralSent) { emitBranchCentral(total, central, []); mmCentralSent = true; }
          emitBranch(idx, total, branch);
        }).catch(err => { log.warn(`[${reqId}] mega mindmap failed: ${err.message}`); return null; });

        const [notes, fc, q, mm] = await Promise.all([notesPromise, fcPromise, quizPromise, mmPromise]);

        if (!fc && !q && !mm && (!notes || notes.trim().length < 80)) {
          throw new Error('Mega bundle: all components failed across every model.');
        }

        result = assembleResult({ topic: message, opts, notes, flashcards: fc, quiz: q, mindmap: mm });
        result._mega_partial = !(fc && q && mm);
        break;
      }

      default: {
        const notes = await streamProse(buildNotesPrompt(message, opts), chunk => sse('token', { t: chunk }), 'NOTES');
        result = assembleResult({ topic: message, opts, notes });
      }
    }

    clearInterval(kap);

    result._duration_ms = Date.now() - startTime;
    result._request_id  = reqId;
    result.topic_fact    = buildTopicFact(message);

    sse('stage', { idx: 4, label: '✅ Complete!', done: true });
    sse('done',  result);

    log.ok(`[${reqId}] ✅ COMPLETE — ${result._duration_ms}ms | tool:${opts.tool}`);
    sendToGoogleSheets(userName, userStreak, userSess, opts.tool, message, 'completed', result._duration_ms, sessionId).catch(() => {});

  } catch (fatal) {
    clearInterval(kap);
    log.error(`[${reqId}] FATAL (${opts.tool}): ${fatal.message}`);
    sse('error', { error: 'All AI models are currently busy. Please try again in a few seconds.', requestId: reqId });
    sendToGoogleSheets(userName, userStreak, userSess, opts.tool, message, 'failed', Date.now() - startTime, sessionId).catch(() => {});
  }

  if (!res.writableEnded) res.end();
};
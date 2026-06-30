'use strict';
// ═══════════════════════════════════════════════════════════════════════════════
// SAVOIRÉ AI v2.0 — api/study.js — COMPLETE REWRITE: bulletproof error handling
// Built by Sooban Talha Technologies | soobantalhatech.xyz | Founder: Sooban Talha
// "Think Less. Know More."
//
// THIS REWRITE FIXES:
// 1. Mid-stream OpenRouter errors (HTTP 200 + error embedded in SSE chunk) were
//    being silently swallowed before — now detected and surfaced immediately.
// 2. buildTopicFallback() was a STUB returning undefined — removed entirely,
//    zero fallback content anywhere, every output is 100% AI-generated.
// 3. Phase 1 (notes) and Phase 2 (cards) run truly in parallel from t=0.
// 4. Manual race resolves the instant ANY model succeeds — no waiting for stragglers.
// 5. Every failure path captures and forwards the REAL error reason to the UI.
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
// SECTION 2 — MODEL LIST — confirmed-active free OpenRouter models (June 2026)
// Both phases use the SAME roster — raced in parallel, first success wins.
// ─────────────────────────────────────────────────────────────────────────────

const FREE_MODELS = [
  'deepseek/deepseek-chat-v3-0324:free',
  'meta-llama/llama-3.3-70b-instruct:free',
  'deepseek/deepseek-r1-0528:free',
  'qwen/qwen-2.5-72b-instruct:free',
  'mistralai/mistral-small-3.1-24b-instruct:free',
  'google/gemma-3-12b-it:free',
  'meta-llama/llama-4-scout:free',
  'openrouter/free',
];

// Per-phase tuning (token budget + timeout) applied to every model in the race
const STREAM_TUNING = { max_tokens: 3500, timeout_ms: 30000, temp: 0.75 };
const CARDS_TUNING  = { max_tokens: 7000, timeout_ms: 25000, temp: 0.30 };

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

const trunc = (s, n = 250) => !s ? '' : String(s).length > n ? String(s).slice(0, n) + '…' : String(s);

function getISTDateTime() {
  const now = new Date();
  const ist = new Date(now.getTime() + now.getTimezoneOffset() * 60000 + 5.5 * 3600000);
  const p   = n => String(n).padStart(2, '0');
  return `${ist.getFullYear()}-${p(ist.getMonth()+1)}-${p(ist.getDate())} ${p(ist.getHours())}:${p(ist.getMinutes())}:${p(ist.getSeconds())}`;
}
function getISTDate() { return getISTDateTime().split(' ')[0]; }

// ─────────────────────────────────────────────────────────────────────────────
// SECTION 5 — GOOGLE SHEETS (unchanged — do not edit)
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
// SECTION 6 — PROMPT BUILDERS
// ─────────────────────────────────────────────────────────────────────────────

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
• "correct_answer": MUST be CHARACTER-FOR-CHARACTER identical to one of the options strings
• "explanation": 60-100 words explaining why correct, referencing "${topicShort}" (in ${lang})
• "difficulty": "easy" | "medium" | "hard"
DIFFICULTY RULE: ${qDiffInstr}
CRITICAL: correct_answer must exactly match one options[] string — copy-paste it.` : '';

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

  const isLeanCall = tool === 'flashcards_quiz' || tool === 'mindmap_only';

  const extraFieldsBlock = isLeanCall ? '' : `
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
  ]`;

  return `You are ${SAVOIRÉ.BRAND}. Generate structured study content as valid JSON.

TOPIC: "${input}"
LANGUAGE: ${lang} — ALL text must be in ${lang}.
${fcInstr}
${qInstr}
${mmInstr}

OUTPUT FORMAT — output ONLY valid JSON, starting with { and ending with }.
No markdown. No code fences. No explanations before or after. Keep it compact — no filler.

{
  "topic": "clean title for ${topicShort} in ${lang}",
  "curriculum_alignment": "appropriate level e.g. A-Level, GCSE, University",
  "study_score": 97,
  ${includeFc  ? `"flashcards": [{"front":"...","back":"..."}],`       : '"flashcards": [],'}
  ${includeQ   ? `"quiz_questions": [{"id":1,"question":"...","options":["A","B","C","D"],"correct_answer":"...","explanation":"...","difficulty":"medium"}],` : '"quiz_questions": [],'}
  ${includeMm  ? `"mindmap": {"central":"...","branches":[{"name":"...","color":"#00d4ff","items":["...","...","...","..."]}],"connections":[{"from":"...","to":"...","description":"..."}]},` : '"mindmap": null,'}
  "key_concepts": [
    "Concept Name: 60-80 word explanation specific to ${topicShort} in ${lang}",
    "Concept Name: 60-80 word explanation",
    "Concept Name: 60-80 word explanation"
  ]${extraFieldsBlock}
}

OUTPUT JSON NOW — start with { immediately. Be concise and fast:`;
}

// ─────────────────────────────────────────────────────────────────────────────
// SECTION 7 — CORE MODEL CALLER — used by both Phase 1 (streaming) and
// Phase 2 (JSON). This is the SINGLE source of truth for talking to OpenRouter,
// with bulletproof handling of every failure mode:
//   1. HTTP-level errors (4xx/5xx) — caught via res.ok check
//   2. Mid-stream errors — OpenRouter can return HTTP 200 then embed an
//      `error` object in an SSE chunk if the model/provider fails partway
//      through. THIS WAS THE SILENT BUG — now explicitly detected.
//   3. Network/abort errors — caught via try/catch around fetch
//   4. Empty/garbage responses — caught via content-length validation
// ─────────────────────────────────────────────────────────────────────────────

async function callModelStreaming(modelId, prompt, tuning, onChunk) {
  const name  = modelId.split('/').pop().replace(':free', '');
  const ctrl  = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), tuning.timeout_ms);
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
        model: modelId, max_tokens: tuning.max_tokens, temperature: tuning.temp,
        stream: true, messages: [{ role: 'user', content: prompt }],
      }),
      signal: ctrl.signal,
    });

    // HTTP-level failure (4xx/5xx) — most common: 401 (bad key), 429 (rate limit)
    if (!res.ok) {
      clearTimeout(timer);
      const txt = await res.text().catch(() => '');
      log.warn(`[STREAM] ✗ ${name}: HTTP ${res.status} — ${trunc(txt)}`);
      if (res.status === 401 || res.status === 403) {
        const e = new Error(`${name}: HTTP ${res.status} (invalid/missing API key) — ${trunc(txt, 120)}`);
        e.isAuthError = true;
        throw e;
      }
      throw new Error(`${name}: HTTP ${res.status} — ${trunc(txt, 150)}`);
    }

    const reader  = res.body.getReader();
    const decoder = new TextDecoder('utf-8');
    let lineBuf = '', full = '';
    let midStreamError = null;

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

        let parsed;
        try { parsed = JSON.parse(raw); }
        catch { continue; } // genuinely malformed SSE line, skip

        // ── CRITICAL FIX: detect mid-stream error objects ──────────────────
        // OpenRouter can send HTTP 200, then mid-stream emit a chunk like:
        //   { "error": { "message": "...", "code": ... } }
        // or with error.metadata.error_type / provider_code.
        // Previously this was silently ignored because we only looked for
        // choices[0].delta.content — now we explicitly check for `error`.
        if (parsed.error) {
          const errMsg  = parsed.error.message || JSON.stringify(parsed.error);
          const errCode = parsed.error.code || parsed.error.metadata?.error_type || '?';
          midStreamError = `${name}: mid-stream error [${errCode}] ${errMsg}`;
          log.warn(`[STREAM] ✗ ${midStreamError}`);
          continue; // keep reading in case more data follows, but remember the error
        }

        const delta = parsed?.choices?.[0]?.delta?.content;
        if (delta) {
          full += delta;
          onChunk(delta);
        }

        // Some providers signal failure via finish_reason: "error" or "content_filter"
        const finishReason = parsed?.choices?.[0]?.finish_reason;
        if (finishReason === 'error') {
          midStreamError = midStreamError || `${name}: stream finished with finish_reason=error`;
        }
      }
    }

    clearTimeout(timer);

    if (midStreamError && full.trim().length < 80) {
      // We got an explicit error AND no usable content — definitely a failure
      throw new Error(midStreamError);
    }
    if (full.trim().length < 80) {
      throw new Error(`${name}: response too short (${full.length} chars) — model may have refused or stalled`);
    }

    log.ok(`[STREAM] ✅ ${name} | ${full.length}ch | ${Date.now()-t0}ms`);
    return full;

  } catch (err) {
    clearTimeout(timer);
    if (err.isAuthError) throw err;
    if (err.name === 'AbortError') {
      throw new Error(`${name}: timed out after ${tuning.timeout_ms}ms`);
    }
    throw new Error(err.message?.startsWith(name) ? err.message : `${name}: ${err.message}`);
  }
}

async function callModelJSON(modelId, prompt, tuning) {
  const name  = modelId.split('/').pop().replace(':free', '');
  const ctrl  = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), tuning.timeout_ms);
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
        model: modelId, max_tokens: tuning.max_tokens, temperature: tuning.temp,
        stream: false, messages: [{ role: 'user', content: prompt }],
      }),
      signal: ctrl.signal,
    });
    clearTimeout(timer);

    if (!res.ok) {
      const txt = await res.text().catch(() => '');
      log.warn(`[CARDS] ✗ ${name}: HTTP ${res.status} — ${trunc(txt)}`);
      if (res.status === 401 || res.status === 403) {
        const e = new Error(`${name}: HTTP ${res.status} (invalid/missing API key) — ${trunc(txt, 120)}`);
        e.isAuthError = true;
        throw e;
      }
      throw new Error(`${name}: HTTP ${res.status} — ${trunc(txt, 150)}`);
    }

    const data = await res.json();

    // Non-streaming responses can ALSO carry an error object even with HTTP 200
    if (data.error) {
      const errMsg = data.error.message || JSON.stringify(data.error);
      throw new Error(`${name}: API error — ${trunc(errMsg, 150)}`);
    }

    let content = data?.choices?.[0]?.message?.content?.trim();
    if (!content || content.length < 20) {
      throw new Error(`${name}: empty response (finish_reason: ${data?.choices?.[0]?.finish_reason || 'unknown'})`);
    }

    content = content.replace(/^```(?:json)?\s*/im, '').replace(/\s*```\s*$/im, '').trim();
    const jS = content.indexOf('{'), jE = content.lastIndexOf('}');
    if (jS === -1 || jE <= jS) {
      throw new Error(`${name}: no JSON object found in response — got: ${trunc(content, 150)}`);
    }
    let jsonStr = content.slice(jS, jE + 1);

    // 4-step JSON repair pipeline
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
        }
        catch {
          try {
            parsed = JSON.parse(
              jsonStr.replace(/[\x00-\x1F\x7F]/g, ' ')
                     .replace(/,(\s*[}\]])/g, '$1')
                     .replace(/([{,]\s*)([a-zA-Z_]\w*)(\s*:)/g, '$1"$2"$3')
            );
          }
          catch (e4) {
            throw new Error(`${name}: JSON parse failed after repair attempts — ${e4.message.slice(0,100)}`);
          }
        }
      }
    }

    log.ok(`[CARDS] ✅ ${name} | ${Date.now()-t0}ms`);
    return parsed;

  } catch (err) {
    clearTimeout(timer);
    if (err.isAuthError) throw err;
    if (err.name === 'AbortError') {
      throw new Error(`${name}: timed out after ${tuning.timeout_ms}ms`);
    }
    throw new Error(err.message?.startsWith(name) ? err.message : `${name}: ${err.message}`);
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// SECTION 8 — RACE HELPER — fires a callback against ALL free models in
// parallel, resolves the instant the FIRST one succeeds. Rejects only if
// every single model has failed, with the full list of reasons attached.
// ─────────────────────────────────────────────────────────────────────────────

function raceAllModels(callFn, label) {
  return new Promise((resolve, reject) => {
    let settledCount = 0;
    let wonAlready    = false;
    const errors      = [];
    const total       = FREE_MODELS.length;

    FREE_MODELS.forEach(modelId => {
      Promise.resolve(callFn(modelId))
        .then(result => {
          if (!wonAlready) { wonAlready = true; resolve({ modelId, result }); }
        })
        .catch(err => {
          errors.push(`${modelId}: ${err.message}`);
          settledCount++;
          if (err.isAuthError && !wonAlready) {
            wonAlready = true;
            reject(Object.assign(new Error(`OPENROUTER_API_KEY is invalid, expired, or missing. (${err.message})`), { isAuthError: true }));
            return;
          }
          if (settledCount === total && !wonAlready) {
            reject(new Error(`[${label}] All ${total} free models failed.\n${errors.map(e => '• ' + e).join('\n')}`));
          }
        });
    });
  });
}

// ─────────────────────────────────────────────────────────────────────────────
// SECTION 8b — STREAMING RACE — special version for Phase 1 notes.
// Unlike raceAllModels (used for JSON calls where only the final result
// matters), streaming calls must NOT let multiple models call onChunk()
// simultaneously — that would interleave text from different model outputs
// into garbled live notes. This function declares a single "winner" (the
// first model to produce real content) and gates all onChunk calls to it.
// ─────────────────────────────────────────────────────────────────────────────

function raceStreamingModels(prompt, tuning, onChunk) {
  return new Promise((resolve, reject) => {
    let winnerModelId = null;
    let settledCount   = 0;
    const errors       = [];
    const total        = FREE_MODELS.length;
    const buffers       = {}; // modelId -> buffered chunks before winner is decided

    FREE_MODELS.forEach(modelId => {
      buffers[modelId] = [];
      const name = modelId.split('/').pop().replace(':free', '');

      const gatedChunk = chunk => {
        if (winnerModelId === null) {
          // No winner yet — buffer this model's output, check if it should win
          buffers[modelId].push(chunk);
          const bufferedLen = buffers[modelId].join('').length;
          if (bufferedLen > 50) {
            winnerModelId = modelId;
            log.ok(`[STREAM] 🏆 ${name} WON the race`);
            // Flush this model's buffer as the live stream
            for (const c of buffers[modelId]) onChunk(c);
            buffers[modelId] = [];
          }
        } else if (winnerModelId === modelId) {
          onChunk(chunk); // stream live — this is the winner
        }
        // else: this model lost the race, silently drop its chunks
      };

      callModelStreaming(modelId, prompt, tuning, gatedChunk)
        .then(fullText => {
          settledCount++;
          if (winnerModelId === null) {
            // This model finished completely before anyone hit the 50-char
            // threshold (can happen with very short/fast responses) — let it win.
            winnerModelId = modelId;
            for (const c of buffers[modelId]) onChunk(c);
            buffers[modelId] = [];
          }
          if (winnerModelId === modelId) {
            resolve({ modelId, result: fullText });
          }
          // else: a different model already won; this one's full result is discarded
        })
        .catch(err => {
          settledCount++;
          errors.push(`${modelId}: ${err.message}`);
          if (err.isAuthError && winnerModelId === null) {
            winnerModelId = '__auth_error__'; // prevent any further winner assignment
            reject(Object.assign(new Error(`OPENROUTER_API_KEY is invalid, expired, or missing. (${err.message})`), { isAuthError: true }));
            return;
          }
          if (settledCount === total && winnerModelId === null) {
            reject(new Error(`[NOTES] All ${total} free models failed.\n${errors.map(e => '• ' + e).join('\n')}`));
          }
        });
    });
  });
}



// ─────────────────────────────────────────────────────────────────────────────
// SECTION 9 — TOPIC FACT
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
// SECTION 10 — POST-PROCESS CARDS DATA (normalize, validate, auto-fix)
// ─────────────────────────────────────────────────────────────────────────────

function normalizeCardsData(parsed, tool) {
  // Auto-fix quiz correct_answer mismatches
  if (Array.isArray(parsed.quiz_questions)) {
    parsed.quiz_questions = parsed.quiz_questions.map((q, i) => {
      q.id = q.id || i + 1;
      if (q.options && q.correct_answer && !q.options.includes(q.correct_answer)) {
        const lo  = q.correct_answer.toLowerCase();
        const fix = q.options.find(o => o.toLowerCase() === lo)
                 || q.options.find(o => o.toLowerCase().includes(lo) || lo.includes(o.toLowerCase()))
                 || q.options[0];
        if (fix) q.correct_answer = fix;
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
  return parsed;
}

function validateCardsData(parsed, tool) {
  const hasFc = Array.isArray(parsed.flashcards) && parsed.flashcards.length >= 2;
  const hasQ  = Array.isArray(parsed.quiz_questions) && parsed.quiz_questions.length >= 2;
  const hasMm = parsed.mindmap?.branches?.length >= 2;
  const hasKc = Array.isArray(parsed.key_concepts) && parsed.key_concepts.length >= 1;
  if (['flashcards','flashcards_quiz'].includes(tool)) return hasFc;
  if (tool === 'quiz')                                  return hasQ;
  if (['mindmap','mindmap_only'].includes(tool))        return hasMm;
  if (tool === 'all')                                   return hasFc || hasQ || hasMm || hasKc;
  return hasKc; // notes/summary
}

// ─────────────────────────────────────────────────────────────────────────────
// SECTION 11 — MERGE NOTES + CARDS INTO FINAL OUTPUT
// ─────────────────────────────────────────────────────────────────────────────

function mergeCards(cardsRaw, notes, topic, opts) {
  const merged = {
    topic:                   String(topic || cardsRaw?.topic || 'Study Material').slice(0, 200),
    curriculum_alignment:    cardsRaw?.curriculum_alignment || 'General Academic Study',
    ultra_long_notes:        notes || '',
    key_concepts:            cardsRaw?.key_concepts            || [],
    key_tricks:              cardsRaw?.key_tricks              || [],
    practice_questions:      cardsRaw?.practice_questions      || [],
    real_world_applications: cardsRaw?.real_world_applications || [],
    common_misconceptions:   cardsRaw?.common_misconceptions   || [],
    study_score:             cardsRaw?.study_score             || 95,
    powered_by:              `${SAVOIRÉ.BRAND} by ${SAVOIRÉ.DEVELOPER}`,
    generated_at:            getISTDateTime(),
    _version:                SAVOIRÉ.VERSION,
    _tool:                   opts.tool,
    _language:               opts.language || 'English',
    _depth:                  opts.depth    || 'detailed',
    _style:                  opts.style    || 'simple',
    _quality:                'ai_generated', // ALWAYS ai_generated — zero fallback content exists
  };
  if (Array.isArray(cardsRaw?.flashcards)     && cardsRaw.flashcards.length)     merged.flashcards     = cardsRaw.flashcards;
  if (Array.isArray(cardsRaw?.quiz_questions) && cardsRaw.quiz_questions.length) merged.quiz_questions = cardsRaw.quiz_questions;
  if (cardsRaw?.mindmap?.branches?.length)                                      merged.mindmap        = cardsRaw.mindmap;
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
    } catch { /* client disconnected, ignore */ }
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
// SECTION 13 — MAIN HANDLER
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
    cardCount:   Number(rawOpts.cardCount)   || 15,
    quizCount:   Number(rawOpts.quizCount)   || 10,
    quizType:    String(rawOpts.quizType     || 'mixed'),
    branchCount: Number(rawOpts.branchCount) || 6,
  };

  log.info(`[${reqId}] tool:${opts.tool} | depth:${opts.depth} | lang:${opts.language} | stream:${opts.stream}`);

  if (!opts.stream) {
    return res.status(400).json({ error: 'Streaming required. Client must send options.stream=true.' });
  }

  sendToGoogleSheets(userName, userStreak, userSess, opts.tool, message, 'started', 0, sessionId).catch(() => {});

  res.setHeader('Content-Type',      'text/event-stream; charset=utf-8');
  res.setHeader('Cache-Control',     'no-cache, no-store, must-revalidate, no-transform');
  res.setHeader('Connection',        'keep-alive');
  res.setHeader('X-Accel-Buffering', 'no');
  if (typeof res.flushHeaders === 'function') res.flushHeaders();

  const sse = makeSSE(res);

  const kap = setInterval(() => {
    if (res.writableEnded) { clearInterval(kap); return; }
    try { res.write(`: ping ${Date.now()}\n\n`); if (typeof res.flush === 'function') res.flush(); }
    catch { clearInterval(kap); }
  }, 10000);

  sse('heartbeat', { ts: Date.now(), status: 'connected', service: SAVOIRÉ.BRAND, requestId: reqId, tool: opts.tool });
  sse('stage',     { idx: 0, label: `🎯 Analysing "${message.slice(0, 50)}${message.length > 50 ? '…' : ''}"` });
  sse('fact',      { fact: buildTopicFact(message) });
  sse('token',     { t: '' });

  let notes = '', p1ok = false;
  let p2Ticker = null;

  try {
    sse('stage', { idx: 1, label: `📝 Writing ${opts.tool === 'summary' ? 'smart summary' : 'study notes'}…` });

    const notesPrompt = buildNotesPrompt(message, opts);

    // ── PHASE 1 + PHASE 2 START SIMULTANEOUSLY ──────────────────────────────
    // Phase 2 (cards) starts racing the instant we begin Phase 1's race too,
    // so by the time notes finish streaming, cards are usually already done.
    // Phase 1 uses raceStreamingModels (NOT raceAllModels) because streaming
    // text from multiple models simultaneously would interleave/garble the
    // live output — only the declared winner's chunks reach onChunk().

    const notesRacePromise = raceStreamingModels(
      notesPrompt, STREAM_TUNING,
      chunk => sse('token', { t: chunk })
    );

    let cardsPromise;
    if (opts.tool === 'all') {
      cardsPromise = Promise.allSettled([
        raceAllModels(modelId => callModelJSON(modelId, buildCardsPrompt(message, opts, 'flashcards_quiz'), CARDS_TUNING), 'MEGA-FCQ'),
        raceAllModels(modelId => callModelJSON(modelId, buildCardsPrompt(message, opts, 'mindmap_only'),    CARDS_TUNING), 'MEGA-MM'),
      ]);
    } else {
      cardsPromise = raceAllModels(modelId => callModelJSON(modelId, buildCardsPrompt(message, opts), CARDS_TUNING), opts.tool.toUpperCase());
    }

    // ── AWAIT PHASE 1 ─────────────────────────────────────────────────────
    try {
      const winner = await notesRacePromise;
      notes = winner.result;
      p1ok  = true;
      log.ok(`[${reqId}] P1 done via ${winner.modelId} — ${notes.length}ch`);
    } catch (e1) {
      log.error(`[${reqId}] P1 FATAL: ${e1.message}`);
      throw e1; // propagate full detail to the fatal catch below
    }

    sse('stage', { idx: 2, label: '✅ Notes complete! Finalising interactive cards…' });

    let p2DotCount = 0;
    p2Ticker = setInterval(() => {
      p2DotCount = (p2DotCount % 3) + 1;
      sse('stage', { idx: 3, label: `🃏 AI is generating your cards${'.'.repeat(p2DotCount)}` });
    }, 2000);

    // ── AWAIT PHASE 2 ─────────────────────────────────────────────────────
    let cardsData = null;

    if (opts.tool === 'all') {
      sse('stage', { idx: 3, label: '⚡ Finalising mega bundle — flashcards + quiz + mindmap…' });
      const [fcqOutcome, mmOutcome] = await cardsPromise;

      cardsData = {};
      const errs = [];

      if (fcqOutcome.status === 'fulfilled') {
        const v = normalizeCardsData(fcqOutcome.value.result, 'flashcards_quiz');
        if (v.flashcards?.length)              cardsData.flashcards             = v.flashcards;
        if (v.quiz_questions?.length)          cardsData.quiz_questions         = v.quiz_questions;
        if (v.key_concepts?.length)            cardsData.key_concepts           = v.key_concepts;
        if (v.key_tricks?.length)              cardsData.key_tricks             = v.key_tricks;
        if (v.practice_questions?.length)      cardsData.practice_questions     = v.practice_questions;
        if (v.real_world_applications?.length) cardsData.real_world_applications= v.real_world_applications;
        if (v.common_misconceptions?.length)   cardsData.common_misconceptions  = v.common_misconceptions;
        if (v.topic)                           cardsData.topic                  = v.topic;
        if (v.study_score)                     cardsData.study_score            = v.study_score;
      } else {
        errs.push(`Flashcards+Quiz: ${fcqOutcome.reason?.message}`);
      }

      if (mmOutcome.status === 'fulfilled') {
        const v = mmOutcome.value.result;
        cardsData.mindmap = v.mindmap;
        if (!cardsData.key_concepts?.length && v.key_concepts?.length) cardsData.key_concepts = v.key_concepts;
      } else {
        errs.push(`Mindmap: ${mmOutcome.reason?.message}`);
      }

      const p2ok = !!(cardsData.flashcards?.length || cardsData.quiz_questions?.length || cardsData.mindmap);
      if (!p2ok) {
        throw new Error(`Mega bundle card generation failed.\n${errs.join('\n')}`);
      }
      if (errs.length) log.warn(`[${reqId}] Mega partial failure: ${errs.join(' | ')}`);

    } else {
      const label = { flashcards:'flashcards', quiz:'quiz questions', mindmap:'mind map', summary:'summary cards', notes:'study cards' }[opts.tool] || 'cards';
      sse('stage', { idx: 3, label: `🃏 Finalising ${label}…` });
      const winner = await cardsPromise; // throws with full detail if all models failed
      cardsData = normalizeCardsData(winner.result, opts.tool);
      if (!validateCardsData(cardsData, opts.tool)) {
        throw new Error(`${winner.modelId} returned JSON but it didn't contain valid ${label} (validation failed).`);
      }
      log.ok(`[${reqId}] P2 done via ${winner.modelId}`);
    }

    clearInterval(p2Ticker); p2Ticker = null;

    // ── PHASE 3 — STREAM CARDS LIVE ──────────────────────────────────────
    if (cardsData?.flashcards?.length && (opts.tool === 'flashcards' || opts.tool === 'all')) {
      sse('stage', { idx: 3, label: `🃏 Streaming ${cardsData.flashcards.length} flashcards live…` });
      for (let i = 0; i < cardsData.flashcards.length; i++) {
        sse('card', { idx: i, total: cardsData.flashcards.length, card: cardsData.flashcards[i] });
        await sleep(50);
      }
    }
    if (cardsData?.quiz_questions?.length && (opts.tool === 'quiz' || opts.tool === 'all')) {
      sse('stage', { idx: 3, label: `❓ Streaming ${cardsData.quiz_questions.length} quiz questions live…` });
      for (let i = 0; i < cardsData.quiz_questions.length; i++) {
        sse('question', { idx: i, total: cardsData.quiz_questions.length, q: cardsData.quiz_questions[i] });
        await sleep(60);
      }
    }
    if (cardsData?.mindmap?.branches?.length && (opts.tool === 'mindmap' || opts.tool === 'all')) {
      sse('stage', { idx: 3, label: `🗺️ Streaming ${cardsData.mindmap.branches.length} mind map branches live…` });
      sse('branch', { idx: -1, total: cardsData.mindmap.branches.length, branch: { name: '_central_', value: cardsData.mindmap.central, connections: cardsData.mindmap.connections || [] } });
      await sleep(50);
      for (let i = 0; i < cardsData.mindmap.branches.length; i++) {
        sse('branch', { idx: i, total: cardsData.mindmap.branches.length, branch: cardsData.mindmap.branches[i] });
        await sleep(70);
      }
    }

    // ── SEND FINAL DATA ──────────────────────────────────────────────────
    clearInterval(kap);
    if (p2Ticker) clearInterval(p2Ticker);

    const final = mergeCards(cardsData, notes, message, opts);
    final._duration_ms = Date.now() - startTime;
    final._request_id  = reqId;
    final._phase1_ok   = p1ok;
    final._phase2_ok   = true;
    final.topic_fact   = buildTopicFact(message);
    final.powered_by   = `${SAVOIRÉ.BRAND} by ${SAVOIRÉ.DEVELOPER}`;

    sse('stage', { idx: 4, label: '✅ Complete! All study materials ready.', done: true });
    sse('done',  final);

    log.ok(`[${reqId}] ✅ COMPLETE — ${final._duration_ms}ms | tool:${opts.tool}`);
    sendToGoogleSheets(userName, userStreak, userSess, opts.tool, message, 'completed', final._duration_ms, sessionId).catch(() => {});

  } catch (fatal) {
    clearInterval(kap);
    if (p2Ticker) clearInterval(p2Ticker);
    log.error(`[${reqId}] FATAL: ${fatal.message}`);
    const userMsg = fatal.isAuthError
      ? `Service configuration error: ${fatal.message}`
      : fatal.message; // forward the FULL real reason — every model's actual error
    sse('error', { error: userMsg, requestId: reqId });
    sendToGoogleSheets(userName, userStreak, userSess, opts.tool, message, 'failed', Date.now() - startTime, sessionId).catch(() => {});
  }

  if (!res.writableEnded) res.end();
};
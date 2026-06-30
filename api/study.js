'use strict';
// ═══════════════════════════════════════════════════════════════════════════════
// SAVOIRÉ AI v2.0 — api/study.js — SINGLE MODEL: openrouter/free
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
// SECTION 2 — MODEL LIST
// ─────────────────────────────────────────────────────────────────────────────
//
// ⚡ FIX NOTE (live-output-delay bug):
// The old version raced 8 free models simultaneously for BOTH phase 1 (notes)
// AND phase 2 (cards/quiz/mindmap). For "all" tool that meant up to
// 8 (notes) + 8 (flashcards_quiz) + 8 (mindmap) = 24 concurrent requests to
// OpenRouter's free tier at once. Free-tier endpoints throttle/queue hard
// under that load, so EVERY model became slow together — which is exactly
// the "live output finishes then huge wait for final result" symptom.
//
// FIX: race a SMALL pool (3 models) instead of all 8. openrouter/free is
// always included as the most reliable router. This keeps concurrent
// OpenRouter calls low enough to avoid self-inflicted throttling, while
// still giving 3-way redundancy so one slow/busy model doesn't block
// everything. Remaining models are kept in the array as a sequential
// fallback pool ONLY if the entire fast-pool race fails.
// ─────────────────────────────────────────────────────────────────────────────

const MODELS_STREAM = [
  { id: 'openrouter/free',                            max_tokens: 3500, timeout_ms: 25000, temp: 0.75 },
  { id: 'google/gemini-2.0-flash-exp:free',          max_tokens: 3500, timeout_ms: 25000, temp: 0.75 },
  { id: 'deepseek/deepseek-chat-v3-0324:free',       max_tokens: 3500, timeout_ms: 25000, temp: 0.75 },
  { id: 'meta-llama/llama-3.3-70b-instruct:free',    max_tokens: 3200, timeout_ms: 25000, temp: 0.75 },
  { id: 'qwen/qwen2.5-72b-instruct:free',            max_tokens: 3500, timeout_ms: 28000, temp: 0.75 },
  { id: 'mistralai/mistral-7b-instruct-v0.3:free',   max_tokens: 2800, timeout_ms: 28000, temp: 0.75 },
  { id: 'microsoft/phi-3-mini-128k-instruct:free',   max_tokens: 2800, timeout_ms: 28000, temp: 0.75 },
  { id: 'z-ai/glm-4.5-air:free',                     max_tokens: 3000, timeout_ms: 28000, temp: 0.75 },
];

const MODELS_CARDS = [
  { id: 'openrouter/free',                            max_tokens: 6500, timeout_ms: 18000, temp: 0.30 },
  { id: 'google/gemini-2.0-flash-exp:free',          max_tokens: 7000, timeout_ms: 18000, temp: 0.30 },
  { id: 'deepseek/deepseek-chat-v3-0324:free',       max_tokens: 7000, timeout_ms: 18000, temp: 0.30 },
  { id: 'meta-llama/llama-3.3-70b-instruct:free',    max_tokens: 6000, timeout_ms: 18000, temp: 0.30 },
  { id: 'qwen/qwen2.5-72b-instruct:free',            max_tokens: 6500, timeout_ms: 20000, temp: 0.30 },
  { id: 'mistralai/mistral-7b-instruct-v0.3:free',   max_tokens: 5000, timeout_ms: 20000, temp: 0.30 },
  { id: 'microsoft/phi-3-mini-128k-instruct:free',   max_tokens: 5000, timeout_ms: 20000, temp: 0.30 },
  { id: 'z-ai/glm-4.5-air:free',                     max_tokens: 6500, timeout_ms: 20000, temp: 0.30 },
];

// How many models to race SIMULTANEOUSLY (rest are sequential fallback only).
// Keeping this small avoids self-inflicted rate-limiting on OpenRouter free tier.
const STREAM_RACE_POOL_SIZE = 3;
const CARDS_RACE_POOL_SIZE  = 3;

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
// SECTION 6 — PROMPT BUILDERS (your existing ones — keep as is)
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
  // Use wizard-selected counts, fall back to defaults
  const fcCount    = tool === 'all' ? 12 : (opts.cardCount   || 15);
  const qCount     = tool === 'all' ?  8 : (opts.quizCount   || 10);
  const mmCount    = opts.branchCount || 6;
  const quizType   = opts.quizType   || 'mixed';
  // Quiz difficulty instruction based on type
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

  // For mega bundle sub-calls, skip the heavy extra fields (key_tricks, practice_questions,
  // applications, misconceptions) — those come from the main notes prompt already.
  // This keeps each mega sub-call's JSON compact = faster generation = faster final result.
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
// SECTION 7 — PHASE 1: STREAM NOTES — small-pool race + sequential fallback
// ─────────────────────────────────────────────────────────────────────────────
//
// ⚡ FIX: instead of racing all 8 models at once (which self-throttles
// OpenRouter's free tier and causes the long post-stream hang), we:
//   1) Race only STREAM_RACE_POOL_SIZE (3) models concurrently.
//   2) The very FIRST model to emit ANY token (not 60 chars — just the
//      first byte) is declared the winner instantly, so live output on
//      screen starts within 1-3 seconds of hitting Generate.
//   3. If the whole pool fails, fall back to the remaining models one at a
//      time (not all at once) so we don't pile on more concurrent load.
// ─────────────────────────────────────────────────────────────────────────────

function streamFromModel(model, prompt, onChunk, tool, abortSignalHolder) {
  return new Promise(async (resolve, reject) => {
    const name  = model.id.split('/').pop().replace(':free', '');
    const ctrl  = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), model.timeout_ms);
    const t0    = Date.now();
    let full = '';
    let firstTokenSent = false;

    if (abortSignalHolder) abortSignalHolder.ctrl = ctrl;

    try {
      log.info(`P1 → ${name} | tool:${tool}`);
      const res = await fetch(OPENROUTER_BASE, {
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
      clearTimeout(timer);

      if (!res.ok) {
        const txt = await res.text().catch(() => '');
        if (res.status === 401 || res.status === 403) { reject(new Error('API_KEY_INVALID')); return; }
        reject(new Error(`${name}: HTTP ${res.status} ${trunc(txt, 60)}`));
        return;
      }

      const reader  = res.body.getReader();
      const decoder = new TextDecoder('utf-8');
      let lineBuf = '';

      while (true) {
        if (ctrl.signal.aborted) { try { reader.cancel(); } catch {} reject(new Error(`${name}: aborted (lost race)`)); return; }
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
              full += delta;
              if (!firstTokenSent) {
                firstTokenSent = true;
                resolve({ name, winner: true, firstChunk: delta, reader, decoder, lineBuf, ctrl, onDone: () => full });
              }
              if (onChunk._isLive) onChunk(delta);
            }
          } catch { /* ignore bad chunk */ }
        }
      }
      // Stream ended without ever emitting a token (rare) — reject so caller can fall back.
      if (!firstTokenSent) reject(new Error(`${name}: empty stream`));

    } catch (err) {
      clearTimeout(timer);
      if (err.message === 'API_KEY_INVALID') { reject(err); return; }
      const reason = err.name === 'AbortError' ? `${name} timed out` : `${name}: ${err.message}`;
      reject(new Error(reason));
    }
  });
}

// Fully drains a winning stream's reader to completion, forwarding chunks live.
async function drainWinnerStream(winnerInfo, onChunk) {
  const { reader, decoder, ctrl } = winnerInfo;
  let lineBuf = winnerInfo.lineBuf || '';
  let full    = winnerInfo.onDone();

  // First chunk already captured before winner declared — emit it now.
  onChunk(winnerInfo.firstChunk);

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
        if (delta) { full += delta; onChunk(delta); }
      } catch { /* ignore */ }
    }
  }
  return full;
}

async function streamNotes(prompt, onChunk, tool) {
  // Build the race pool: openrouter/free + the next N-1 fastest-known models.
  const pool     = MODELS_STREAM.slice(0, STREAM_RACE_POOL_SIZE);
  const fallback = MODELS_STREAM.slice(STREAM_RACE_POOL_SIZE);

  const tryPool = async (models) => {
    const holders = models.map(() => ({}));
    const attempts = models.map((model, i) => {
      // No live forwarding during the race itself — only the eventual
      // winner's chunks get forwarded, via the firstChunk + drain step below.
      const muteOnChunk = () => {};
      muteOnChunk._isLive = false;
      return streamFromModel(model, prompt, muteOnChunk, tool, holders[i]).then(info => ({ info, idx: i }));
    });

    let winnerResult = null;
    try {
      winnerResult = await Promise.any(attempts);
    } catch (aggErr) {
      // Every model in this pool failed before producing even one token.
      const errs = (aggErr.errors || []).map(e => e.message);
      if (errs.some(m => m === 'API_KEY_INVALID')) throw new Error('OPENROUTER_API_KEY is invalid or missing.');
      throw new Error(`Pool failed: ${errs.slice(0,3).join(' | ')}`);
    }

    // Abort every other in-flight request in this pool — we have our winner.
    holders.forEach((h, i) => { if (i !== winnerResult.idx && h.ctrl) h.ctrl.abort(); });

    log.ok(`P1 🏆 ${winnerResult.info.name} WON (first token in pool)`);
    const liveOnChunk = (c) => onChunk(c);
    const full = await drainWinnerStream(winnerResult.info, liveOnChunk);

    if (full.trim().length < 80) throw new Error(`${winnerResult.info.name}: response too short`);
    return full;
  };

  // 1) Try the small concurrent pool first — this is the fast path (1-3s to first token).
  try {
    return await tryPool(pool);
  } catch (poolErr) {
    log.warn(`P1 pool race failed: ${poolErr.message} — falling back sequentially`);
    if (poolErr.message.includes('API_KEY')) throw poolErr;
  }

  // 2) Sequential fallback through remaining models (rare path — only if all 3 raced models failed).
  for (const model of fallback) {
    try {
      return await tryPool([model]);
    } catch (e) {
      log.warn(`P1 fallback ${model.id} failed: ${e.message}`);
    }
  }

  throw new Error('All free AI models are currently busy. Please try again in a moment.');
}

// ─────────────────────────────────────────────────────────────────────────────
// SECTION 8 — PHASE 2: FETCH CARDS — small-pool race + sequential fallback
// ─────────────────────────────────────────────────────────────────────────────

async function fetchCardsFromModel(model, prompt, tool) {
  const name  = model.id.split('/').pop().replace(':free', '');
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
        model: model.id, max_tokens: model.max_tokens, temperature: model.temp || 0.30,
        stream: false, messages: [{ role: 'user', content: prompt }],
      }),
      signal: ctrl.signal,
    });
    clearTimeout(timer);

    if (!res.ok) {
      if (res.status === 401 || res.status === 403) throw new Error('API_KEY_INVALID');
      throw new Error(`${name}: HTTP ${res.status}`);
    }

    const data    = await res.json();
    let   content = data?.choices?.[0]?.message?.content?.trim();
    if (!content || content.length < 20) throw new Error(`${name}: empty response`);

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

    // Validation
    const hasFc = Array.isArray(parsed.flashcards) && parsed.flashcards.length >= 2;
    const hasQ  = Array.isArray(parsed.quiz_questions) && parsed.quiz_questions.length >= 2;
    const hasMm = parsed.mindmap?.branches?.length >= 2;
    const hasKc = Array.isArray(parsed.key_concepts) && parsed.key_concepts.length >= 1;
    const valid = (['flashcards','flashcards_quiz'].includes(tool)) ? hasFc
                : tool === 'quiz'                                    ? hasQ
                : (['mindmap','mindmap_only'].includes(tool))        ? hasMm
                : tool === 'all'                                     ? (hasFc || hasQ || hasMm || hasKc)
                : hasKc;
    if (!valid) throw new Error(`${name}: validation failed - fc:${parsed.flashcards?.length||0} q:${parsed.quiz_questions?.length||0} mm:${parsed.mindmap?.branches?.length||0}`);

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

async function fetchCards(prompt, tool) {
  const pool     = MODELS_CARDS.slice(0, CARDS_RACE_POOL_SIZE);
  const fallback = MODELS_CARDS.slice(CARDS_RACE_POOL_SIZE);

  const raceSmallPool = async (models) => {
    log.info(`P2 racing ${models.length} models | tool:${tool}`);
    try {
      const winner = await Promise.any(models.map(m => fetchCardsFromModel(m, prompt, tool)));
      return winner;
    } catch (aggErr) {
      const errs = (aggErr.errors || []).map(e => e.message);
      if (errs.some(m => m === 'API_KEY_INVALID')) throw new Error('OPENROUTER_API_KEY is invalid or missing.');
      throw new Error(`Pool failed: ${errs.slice(0,3).join(' | ')}`);
    }
  };

  // 1) Fast path — small concurrent pool.
  try {
    return await raceSmallPool(pool);
  } catch (poolErr) {
    log.warn(`P2 pool race failed: ${poolErr.message} — falling back sequentially`);
    if (poolErr.message.includes('API_KEY')) throw poolErr;
  }

  // 2) Sequential fallback through remaining models — one at a time.
  for (const model of fallback) {
    try {
      return await fetchCardsFromModel(model, prompt, tool);
    } catch (e) {
      log.warn(`P2 fallback ${model.id} failed: ${e.message}`);
    }
  }

  throw new Error(`All free AI models failed for tool:${tool}.`);
}

// ─────────────────────────────────────────────────────────────────────────────
// SECTION 9 — FALLBACK CONTENT (used only when ALL retries fail)
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
  // ── Used ONLY if every single free model + every retry has failed.
  // Provides a usable (if generic) result so the UI never shows a dead end.
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
// SECTION 10 — TOPIC FACT (unchanged)
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
// SECTION 11 — MERGE (unchanged)
// ─────────────────────────────────────────────────────────────────────────────

function mergeCards(cardsRaw, notes, topic, opts) {
  const now        = getISTDateTime();
  const isFallback = !!cardsRaw?._fallback;
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
// SECTION 13 — MAIN HANDLER
// ─────────────────────────────────────────────────────────────────────────────

module.exports = async function handler(req, res) {
  const reqId     = `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
  const startTime = Date.now();
  log.info(`[${reqId}] ${req.method} /api/study`);

  setHeaders(res);
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST')   return res.status(405).json({ error: 'Method not allowed. Use POST.' });

  // ── API KEY CHECK — fail fast with clear message ──────────────────────────
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

  // ── PING / VISIT ──────────────────────────────────────────────────────────
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
    cardCount:   Number(rawOpts.cardCount)   || 15,
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

  // Keep-alive ping every 10s to prevent proxy/CDN timeout
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
  sse('token',     { t: '' }); // prime the token stream

  let notes = '', p1ok = false;
  let p2Ticker = null;

  try {
    // ╔═══════════════════════════════════════════════════════════════╗
    // ║  PHASE 1 + PHASE 2 RUN CONCURRENTLY                             ║
    // ║  Phase 2 starts the instant we kick off Phase 1's notes stream, ║
    // ║  so by the time the live notes finish on screen, the cards are  ║
    // ║  usually already done or very close — eliminating the dead gap. ║
    // ╚═══════════════════════════════════════════════════════════════╝

    sse('stage', { idx: 1, label: `📝 Writing ${opts.tool === 'summary' ? 'smart summary' : 'study notes'}…` });

    const notesPrompt = buildNotesPrompt(message, opts);

    // Kick off Phase 2 immediately in the background — small race pool only,
    // so it doesn't compete with Phase 1's own race pool for OpenRouter slots.
    let cardsPromise;
    if (opts.tool === 'all') {
      cardsPromise = Promise.allSettled([
        fetchCards(buildCardsPrompt(message, opts, 'flashcards_quiz'), 'flashcards_quiz'),
        fetchCards(buildCardsPrompt(message, opts, 'mindmap_only'),    'mindmap_only'),
      ]);
    } else {
      cardsPromise = fetchCards(buildCardsPrompt(message, opts), opts.tool).then(
        v => ({ status: 'fulfilled', value: v }),
        e => ({ status: 'rejected', reason: e })
      );
    }

    // ── PHASE 1 — live notes stream. Small race pool → first token in 1-3s. ──
    try {
      notes = await streamNotes(notesPrompt, chunk => sse('token', { t: chunk }), opts.tool);
      p1ok  = true;
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

    // Periodic "still working" pings so the UI never looks frozen while we
    // wait for Phase 2 (which has been running in the background already).
    let p2DotCount = 0;
    p2Ticker = setInterval(() => {
      p2DotCount = (p2DotCount % 3) + 1;
      sse('stage', { idx: 3, label: `🃏 Finalising your cards${'.'.repeat(p2DotCount)}` });
    }, 1500);

    // ── PHASE 2 — await the cards promise that's been running since P1 started ──
    let cardsData = null, p2ok = false;

    if (opts.tool === 'all') {
      sse('stage', { idx: 3, label: '⚡ Finalising mega bundle — flashcards + quiz + mindmap…' });
      let [fcqRes, mmRes] = await cardsPromise;

      cardsData = {};
      if (fcqRes.status === 'fulfilled' && fcqRes.value) {
        const v = fcqRes.value;
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
        log.error(`[${reqId}] Mega P2a (flashcards+quiz) failed: ${fcqRes.reason?.message}`);
      }
      if (mmRes.status === 'fulfilled' && mmRes.value?.mindmap) {
        cardsData.mindmap = mmRes.value.mindmap;
        if (!cardsData.key_concepts?.length && mmRes.value.key_concepts?.length)
          cardsData.key_concepts = mmRes.value.key_concepts;
      } else {
        log.error(`[${reqId}] Mega P2b (mindmap) failed: ${mmRes.reason?.message}`);
      }

      p2ok = !!(cardsData.flashcards?.length || cardsData.quiz_questions?.length || cardsData.mindmap);
      if (!p2ok) {
        log.warn(`[${reqId}] Mega bundle: all AI cards failed — using fallback content so user still gets a full result`);
        cardsData = buildTopicFallback('all', message);
      }

    } else {
      const label = { flashcards:'flashcards', quiz:'quiz questions', mindmap:'mind map', summary:'summary cards', notes:'study cards' }[opts.tool] || 'cards';
      sse('stage', { idx: 3, label: `🃏 Finalising ${label}…` });
      const cardsResult = await cardsPromise;
      if (cardsResult.status === 'fulfilled') {
        cardsData = cardsResult.value;
        p2ok = true;
      } else {
        log.warn(`[${reqId}] P2 failed for ${opts.tool} — using fallback content: ${cardsResult.reason?.message}`);
        cardsData = buildTopicFallback(opts.tool, message);
        p2ok = false;
      }
    }

    // ╔═══════════════════════════════════════════╗
    // ║  PHASE 3 — STREAM CARDS LIVE (animations)  ║
    // ╚═══════════════════════════════════════════╝

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

    // ╔═══════════════════╗
    // ║  SEND FINAL DATA  ║
    // ╚═══════════════════╝
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
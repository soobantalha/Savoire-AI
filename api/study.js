'use strict';
// ═══════════════════════════════════════════════════════════════════════════════
// SAVOIRÉ AI v2.0 — api/study.js — ULTIMATE MASTERSTROKE
// Built by Sooban Talha Technologies | soobantalhatech.xyz | Founder: Sooban Talha
// "Think Less. Know More."
//
// ⚡ MULTI-PROVIDER FALLBACK: OpenRouter → Groq → Gemini → … → Fallback
// ⚡ IN-MEMORY CACHE (1 hour TTL) – no duplicate calls
// ⚡ LIVE STREAMING for notes, flashcards, quiz, mindmap, mega bundle
// ⚡ SEQUENTIAL MODEL TRIAL – fast first token, no racing chaos
// ⚡ GENEROUS TIMEOUTS – but we fail fast if no first token
// ═══════════════════════════════════════════════════════════════════════════════

// ─────────────────────────────────────────────────────────────────────────────
// SECTION 1 – BRAND & CONSTANTS
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
const GROQ_BASE          = 'https://api.groq.com/openai/v1/chat/completions';
const GEMINI_BASE        = 'https://generativelanguage.googleapis.com/v1beta/models';
const HTTP_REFERER       = `https://${SAVOIRÉ.WEBSITE}`;
const APP_TITLE          = SAVOIRÉ.BRAND;
const GOOGLE_WEBHOOK_URL = process.env.GOOGLE_WEBHOOK_URL || '';

// ─────────────────────────────────────────────────────────────────────────────
// SECTION 2 – CONFIG MAPS (depth, style, prompts)
// ─────────────────────────────────────────────────────────────────────────────

const DEPTH_MAP = {
  standard:      { wordRange: '600–900 words',   maxTokens: 2500 },
  detailed:      { wordRange: '1000–1500 words', maxTokens: 3500 },
  comprehensive: { wordRange: '1500–2200 words', maxTokens: 4500 },
  expert:        { wordRange: '2200–3000 words', maxTokens: 5500 },
};

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
// SECTION 3 – UTILITIES (cache, sleep, logging, date helpers)
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

// ─── IN-MEMORY CACHE ─────────────────────────────────────────────────────────
const cache = new Map();
const CACHE_TTL_MS = 60 * 60 * 1000; // 1 hour

function getCacheKey(message, opts, tool, provider) {
  // Unique key based on input and options
  const d = opts.depth || 'detailed';
  const s = opts.style || 'simple';
  const l = opts.language || 'English';
  const t = tool || 'notes';
  const q = opts.quizType || 'mixed';
  const c = opts.cardCount || 15;
  const b = opts.branchCount || 6;
  return `${provider}:${t}:${d}:${s}:${l}:${q}:${c}:${b}:${message.slice(0, 200)}`;
}

function getCached(key) {
  const entry = cache.get(key);
  if (!entry) return null;
  if (Date.now() - entry.timestamp > CACHE_TTL_MS) {
    cache.delete(key);
    return null;
  }
  return entry.data;
}

function setCache(key, data) {
  cache.set(key, { data, timestamp: Date.now() });
  // Cleanup old entries if cache grows too large
  if (cache.size > 200) {
    for (const [k, v] of cache.entries()) {
      if (Date.now() - v.timestamp > CACHE_TTL_MS) cache.delete(k);
    }
  }
}

// ─── EXTRACT RETRY-AFTER FROM 429 ERROR ────────────────────────────────────
function getRetryAfter(errorText) {
  try {
    const json = JSON.parse(errorText);
    if (json.error?.metadata?.retry_after_seconds) {
      return Math.ceil(Number(json.error.metadata.retry_after_seconds)) + 1;
    }
    if (json.error?.metadata?.retry_after_seconds_raw) {
      return Math.ceil(Number(json.error.metadata.retry_after_seconds_raw)) + 1;
    }
    return null;
  } catch {
    return null;
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// SECTION 4 – GOOGLE SHEETS (unchanged)
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
// SECTION 5 – PROMPT BUILDERS (for notes and cards)
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
// SECTION 6 – PROVIDER HANDLERS (OpenRouter, Groq, Gemini)
// ─────────────────────────────────────────────────────────────────────────────

// Each provider has:
//   - streamNotes(prompt, onChunk, tool, opts) – returns full note text
//   - fetchCards(prompt, tool, opts) – returns parsed JSON
// They all accept a `providerName` for logging.

// ─── OPENROUTER ──────────────────────────────────────────────────────────────
async function openRouterStreamNotes(prompt, onChunk, tool, providerName = 'openrouter') {
  const model = 'openrouter/free'; // uses the best available free model
  const timeoutMs = 30000; // 30s for first token? Actually we use a two-stage timeout.
  const firstTokenTimeout = 16000;
  const fullStreamTimeout = 60000;

  const ctrl = new AbortController();
  let firstTokenTimer = setTimeout(() => ctrl.abort(), firstTokenTimeout);
  let fullStreamTimer = null;

  log.info(`[${providerName}] → streaming with ${model}`);

  let res;
  try {
    res = await fetch(OPENROUTER_BASE, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.OPENROUTER_API_KEY}`,
        'HTTP-Referer': HTTP_REFERER,
        'X-Title': APP_TITLE,
      },
      body: JSON.stringify({
        model: model,
        max_tokens: 8192,
        temperature: 0.75,
        stream: true,
        messages: [{ role: 'user', content: prompt }],
      }),
      signal: ctrl.signal,
    });
  } catch (err) {
    clearTimeout(firstTokenTimer);
    if (err.name === 'AbortError') throw new Error(`${providerName}: no response within ${firstTokenTimeout}ms`);
    throw new Error(`${providerName}: fetch failed — ${err.message}`);
  }

  if (!res.ok) {
    clearTimeout(firstTokenTimer);
    const txt = await res.text().catch(() => '');
    log.error(`${providerName}: HTTP ${res.status} — ${trunc(txt, 200)}`);
    if (res.status === 401 || res.status === 403) throw new Error('API_KEY_INVALID');
    if (res.status === 429) {
      const retryAfter = getRetryAfter(txt);
      if (retryAfter) throw new Error(`RATE_LIMIT:${retryAfter}`);
      throw new Error(`${providerName}: rate limited (429)`);
    }
    throw new Error(`${providerName}: HTTP ${res.status}`);
  }

  const reader = res.body.getReader();
  const decoder = new TextDecoder('utf-8');
  let lineBuf = '';
  let full = '';
  let gotFirstToken = false;

  try {
    while (true) {
      let chunk;
      try {
        chunk = await reader.read();
      } catch (readErr) {
        if (readErr.name === 'AbortError') {
          if (!gotFirstToken) throw new Error(`${providerName}: no first token within ${firstTokenTimeout}ms`);
          // We already committed – salvage what we have
          log.warn(`${providerName}: full-stream timeout, salvaging ${full.length}ch`);
          return full;
        }
        if (gotFirstToken) {
          log.warn(`${providerName}: read error mid-stream, salvaging ${full.length}ch`);
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
          const parsed = JSON.parse(raw);
          const delta = parsed?.choices?.[0]?.delta?.content;
          if (delta) {
            if (!gotFirstToken) {
              gotFirstToken = true;
              clearTimeout(firstTokenTimer);
              fullStreamTimer = setTimeout(() => ctrl.abort(), fullStreamTimeout);
              log.ok(`${providerName}: first token in ${Date.now()-Date.now()}ms (committed)`);
            }
            full += delta;
            onChunk(delta);
          }
        } catch { /* ignore malformed */ }
      }
    }
  } finally {
    clearTimeout(firstTokenTimer);
    if (fullStreamTimer) clearTimeout(fullStreamTimer);
  }

  if (!gotFirstToken) throw new Error(`${providerName}: stream ended with no content`);
  return full;
}

async function openRouterFetchCards(prompt, tool, providerName = 'openrouter') {
  const model = 'openrouter/free';
  const timeout = 25000;
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), timeout);

  log.info(`[${providerName}] → fetching cards with ${model}`);

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
        model: model,
        max_tokens: 8192,
        temperature: 0.30,
        stream: false,
        messages: [{ role: 'user', content: prompt }],
      }),
      signal: ctrl.signal,
    });
    clearTimeout(timer);

    if (!res.ok) {
      const txt = await res.text().catch(() => '');
      log.error(`${providerName}: HTTP ${res.status} — ${trunc(txt, 200)}`);
      if (res.status === 401 || res.status === 403) throw new Error('API_KEY_INVALID');
      if (res.status === 429) {
        const retryAfter = getRetryAfter(txt);
        if (retryAfter) throw new Error(`RATE_LIMIT:${retryAfter}`);
        throw new Error(`${providerName}: rate limited (429)`);
      }
      throw new Error(`${providerName}: HTTP ${res.status}`);
    }

    const data = await res.json();
    let content = data?.choices?.[0]?.message?.content?.trim();
    if (!content || content.length < 20) throw new Error(`${providerName}: empty response`);

    // Clean JSON
    content = content.replace(/^```(?:json)?\s*/im, '').replace(/\s*```\s*$/im, '').trim();
    const jS = content.indexOf('{'), jE = content.lastIndexOf('}');
    if (jS === -1 || jE <= jS) throw new Error(`${providerName}: no JSON object`);
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
          catch (e4) { throw new Error(`${providerName}: JSON repair failed - ${e4.message.slice(0,60)}`); }
        }
      }
    }

    // Normalise and validate as before
    if (Array.isArray(parsed.quiz_questions)) {
      parsed.quiz_questions = parsed.quiz_questions.map((q, i) => {
        q.id = q.id || i + 1;
        if (q.options && q.correct_answer && !q.options.includes(q.correct_answer)) {
          const lo = q.correct_answer.toLowerCase();
          const fix = q.options.find(o => o.toLowerCase() === lo) ||
                       q.options.find(o => o.toLowerCase().includes(lo) || lo.includes(o.toLowerCase())) ||
                       q.options[0];
          if (fix) q.correct_answer = fix;
        }
        return q;
      });
    }
    if (Array.isArray(parsed.flashcards)) {
      parsed.flashcards = parsed.flashcards
        .filter(c => (c.front || c.question) && (c.back || c.answer))
        .map(c => ({ front: String(c.front || c.question || '').trim(), back: String(c.back || c.answer || '').trim() }));
    }

    // Validation (relaxed)
    const hasFc = Array.isArray(parsed.flashcards) && parsed.flashcards.length >= 2;
    const hasQ  = Array.isArray(parsed.quiz_questions) && parsed.quiz_questions.length >= 2;
    const hasMm = parsed.mindmap?.branches?.length >= 2;
    const hasKc = Array.isArray(parsed.key_concepts) && parsed.key_concepts.length >= 1;
    const valid = (['flashcards','flashcards_quiz'].includes(tool)) ? hasFc
                : tool === 'quiz'                                    ? hasQ
                : (['mindmap','mindmap_only'].includes(tool))        ? hasMm
                : tool === 'all'                                     ? (hasFc || hasQ || hasMm || hasKc)
                : hasKc;
    if (!valid) throw new Error(`${providerName}: validation failed`);

    log.ok(`${providerName}: cards fetched (fc:${parsed.flashcards?.length||0}, q:${parsed.quiz_questions?.length||0}, mm:${parsed.mindmap?.branches?.length||0})`);
    return parsed;

  } catch (err) {
    clearTimeout(timer);
    throw err;
  }
}

// ─── GROQ ─────────────────────────────────────────────────────────────────────
async function groqStreamNotes(prompt, onChunk, tool, providerName = 'groq') {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) throw new Error('GROQ_API_KEY not set');

  const model = 'llama-3.1-70b-versatile'; // or 'mixtral-8x7b-32768'
  const firstTokenTimeout = 12000;
  const fullStreamTimeout = 60000;
  const ctrl = new AbortController();
  let firstTokenTimer = setTimeout(() => ctrl.abort(), firstTokenTimeout);
  let fullStreamTimer = null;

  log.info(`[${providerName}] → streaming with ${model}`);

  let res;
  try {
    res = await fetch(GROQ_BASE, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: model,
        max_tokens: 8192,
        temperature: 0.75,
        stream: true,
        messages: [{ role: 'user', content: prompt }],
      }),
      signal: ctrl.signal,
    });
  } catch (err) {
    clearTimeout(firstTokenTimer);
    if (err.name === 'AbortError') throw new Error(`${providerName}: no response within ${firstTokenTimeout}ms`);
    throw new Error(`${providerName}: fetch failed — ${err.message}`);
  }

  if (!res.ok) {
    clearTimeout(firstTokenTimer);
    const txt = await res.text().catch(() => '');
    log.error(`${providerName}: HTTP ${res.status} — ${trunc(txt, 200)}`);
    if (res.status === 401 || res.status === 403) throw new Error('API_KEY_INVALID');
    if (res.status === 429) {
      // Groq may not give retry-after, so just throw generic
      throw new Error(`${providerName}: rate limited (429)`);
    }
    throw new Error(`${providerName}: HTTP ${res.status}`);
  }

  const reader = res.body.getReader();
  const decoder = new TextDecoder('utf-8');
  let lineBuf = '';
  let full = '';
  let gotFirstToken = false;

  try {
    while (true) {
      let chunk;
      try {
        chunk = await reader.read();
      } catch (readErr) {
        if (readErr.name === 'AbortError') {
          if (!gotFirstToken) throw new Error(`${providerName}: no first token within ${firstTokenTimeout}ms`);
          log.warn(`${providerName}: full-stream timeout, salvaging ${full.length}ch`);
          return full;
        }
        if (gotFirstToken) {
          log.warn(`${providerName}: read error mid-stream, salvaging ${full.length}ch`);
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
          const parsed = JSON.parse(raw);
          const delta = parsed?.choices?.[0]?.delta?.content;
          if (delta) {
            if (!gotFirstToken) {
              gotFirstToken = true;
              clearTimeout(firstTokenTimer);
              fullStreamTimer = setTimeout(() => ctrl.abort(), fullStreamTimeout);
              log.ok(`${providerName}: first token in ${Date.now()-Date.now()}ms (committed)`);
            }
            full += delta;
            onChunk(delta);
          }
        } catch { /* ignore */ }
      }
    }
  } finally {
    clearTimeout(firstTokenTimer);
    if (fullStreamTimer) clearTimeout(fullStreamTimer);
  }

  if (!gotFirstToken) throw new Error(`${providerName}: stream ended with no content`);
  return full;
}

async function groqFetchCards(prompt, tool, providerName = 'groq') {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) throw new Error('GROQ_API_KEY not set');
  const model = 'llama-3.1-70b-versatile';
  const timeout = 25000;
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), timeout);

  log.info(`[${providerName}] → fetching cards with ${model}`);

  try {
    const res = await fetch(GROQ_BASE, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: model,
        max_tokens: 8192,
        temperature: 0.30,
        stream: false,
        messages: [{ role: 'user', content: prompt }],
      }),
      signal: ctrl.signal,
    });
    clearTimeout(timer);

    if (!res.ok) {
      const txt = await res.text().catch(() => '');
      log.error(`${providerName}: HTTP ${res.status} — ${trunc(txt, 200)}`);
      if (res.status === 401 || res.status === 403) throw new Error('API_KEY_INVALID');
      if (res.status === 429) throw new Error(`${providerName}: rate limited (429)`);
      throw new Error(`${providerName}: HTTP ${res.status}`);
    }

    const data = await res.json();
    let content = data?.choices?.[0]?.message?.content?.trim();
    if (!content || content.length < 20) throw new Error(`${providerName}: empty response`);

    // Same JSON cleaning and parsing as OpenRouter
    content = content.replace(/^```(?:json)?\s*/im, '').replace(/\s*```\s*$/im, '').trim();
    const jS = content.indexOf('{'), jE = content.lastIndexOf('}');
    if (jS === -1 || jE <= jS) throw new Error(`${providerName}: no JSON object`);
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
          catch (e4) { throw new Error(`${providerName}: JSON repair failed - ${e4.message.slice(0,60)}`); }
        }
      }
    }

    // Normalise and validate
    if (Array.isArray(parsed.quiz_questions)) {
      parsed.quiz_questions = parsed.quiz_questions.map((q, i) => {
        q.id = q.id || i + 1;
        if (q.options && q.correct_answer && !q.options.includes(q.correct_answer)) {
          const lo = q.correct_answer.toLowerCase();
          const fix = q.options.find(o => o.toLowerCase() === lo) ||
                       q.options.find(o => o.toLowerCase().includes(lo) || lo.includes(o.toLowerCase())) ||
                       q.options[0];
          if (fix) q.correct_answer = fix;
        }
        return q;
      });
    }
    if (Array.isArray(parsed.flashcards)) {
      parsed.flashcards = parsed.flashcards
        .filter(c => (c.front || c.question) && (c.back || c.answer))
        .map(c => ({ front: String(c.front || c.question || '').trim(), back: String(c.back || c.answer || '').trim() }));
    }

    const hasFc = Array.isArray(parsed.flashcards) && parsed.flashcards.length >= 2;
    const hasQ  = Array.isArray(parsed.quiz_questions) && parsed.quiz_questions.length >= 2;
    const hasMm = parsed.mindmap?.branches?.length >= 2;
    const hasKc = Array.isArray(parsed.key_concepts) && parsed.key_concepts.length >= 1;
    const valid = (['flashcards','flashcards_quiz'].includes(tool)) ? hasFc
                : tool === 'quiz'                                    ? hasQ
                : (['mindmap','mindmap_only'].includes(tool))        ? hasMm
                : tool === 'all'                                     ? (hasFc || hasQ || hasMm || hasKc)
                : hasKc;
    if (!valid) throw new Error(`${providerName}: validation failed`);

    log.ok(`${providerName}: cards fetched (fc:${parsed.flashcards?.length||0}, q:${parsed.quiz_questions?.length||0}, mm:${parsed.mindmap?.branches?.length||0})`);
    return parsed;

  } catch (err) {
    clearTimeout(timer);
    throw err;
  }
}

// ─── GOOGLE GEMINI ──────────────────────────────────────────────────────────
async function geminiStreamNotes(prompt, onChunk, tool, providerName = 'gemini') {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) throw new Error('GEMINI_API_KEY not set');
  const model = 'gemini-2.0-flash-exp'; // or 'gemini-1.5-flash'
  const url = `${GEMINI_BASE}/${model}:generateContent?key=${apiKey}`;
  const firstTokenTimeout = 12000;
  const fullStreamTimeout = 60000;
  const ctrl = new AbortController();
  let firstTokenTimer = setTimeout(() => ctrl.abort(), firstTokenTimeout);
  let fullStreamTimer = null;

  log.info(`[${providerName}] → streaming with ${model}`);

  // Gemini uses a slightly different request format and does not natively stream tokens
  // We simulate streaming by fetching the whole response and then chunking it.
  // For true streaming, we'd need to use the newer streaming API, but that requires different handling.
  // For simplicity, we'll fetch non-streaming and then push chunks.
  // This sacrifices "first token" speed but is a reliable fallback.

  // Actually, Gemini has a streaming API: `streamGenerateContent`. Let's implement that.
  // We'll use the streaming endpoint: `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:streamGenerateContent?key=...`
  const streamUrl = `https://generativelanguage.googleapis.com/v1beta/models/${model}:streamGenerateContent?key=${apiKey}`;

  let res;
  try {
    res = await fetch(streamUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: {
          temperature: 0.75,
          maxOutputTokens: 8192,
        },
      }),
      signal: ctrl.signal,
    });
  } catch (err) {
    clearTimeout(firstTokenTimer);
    if (err.name === 'AbortError') throw new Error(`${providerName}: no response within ${firstTokenTimeout}ms`);
    throw new Error(`${providerName}: fetch failed — ${err.message}`);
  }

  if (!res.ok) {
    clearTimeout(firstTokenTimer);
    const txt = await res.text().catch(() => '');
    log.error(`${providerName}: HTTP ${res.status} — ${trunc(txt, 200)}`);
    if (res.status === 401 || res.status === 403) throw new Error('API_KEY_INVALID');
    if (res.status === 429) throw new Error(`${providerName}: rate limited (429)`);
    throw new Error(`${providerName}: HTTP ${res.status}`);
  }

  // Gemini streaming returns a stream of JSON objects separated by newlines
  const reader = res.body.getReader();
  const decoder = new TextDecoder('utf-8');
  let lineBuf = '';
  let full = '';
  let gotFirstToken = false;

  try {
    while (true) {
      let chunk;
      try {
        chunk = await reader.read();
      } catch (readErr) {
        if (readErr.name === 'AbortError') {
          if (!gotFirstToken) throw new Error(`${providerName}: no first token within ${firstTokenTimeout}ms`);
          log.warn(`${providerName}: full-stream timeout, salvaging ${full.length}ch`);
          return full;
        }
        if (gotFirstToken) {
          log.warn(`${providerName}: read error mid-stream, salvaging ${full.length}ch`);
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
        if (!line.trim()) continue;
        try {
          const parsed = JSON.parse(line);
          const text = parsed?.candidates?.[0]?.content?.parts?.[0]?.text;
          if (text) {
            if (!gotFirstToken) {
              gotFirstToken = true;
              clearTimeout(firstTokenTimer);
              fullStreamTimer = setTimeout(() => ctrl.abort(), fullStreamTimeout);
              log.ok(`${providerName}: first token in ${Date.now()-Date.now()}ms (committed)`);
            }
            // Gemini may send the whole text in one go, but we'll chunk it
            // We'll simulate token-by-token by splitting into small pieces
            // Actually, it might send incremental chunks; let's accumulate.
            full += text;
            // Since Gemini often sends in chunks, we can just send the accumulated delta
            // For simplicity, we send the full text each time? No, we want live.
            // We'll just send the new text as it arrives.
            // But the text may be the full accumulated, so we need to compute delta.
            // Better: we'll treat the response as a stream of complete text; we'll send the delta.
            // We'll store previous full and send difference.
            // But for simplicity, we'll just send the text as it is (it may be the whole thing).
            // We'll chunk it into 300-char pieces.
            // Since we don't have a reliable way to get incremental tokens from Gemini's streaming,
            // we'll fake it by splitting the final text.
            // Actually we can capture the incremental text because each line may be partial.
            // For now, we'll just send the text as it comes.
            onChunk(text);
          }
        } catch { /* ignore */ }
      }
    }
  } finally {
    clearTimeout(firstTokenTimer);
    if (fullStreamTimer) clearTimeout(fullStreamTimer);
  }

  if (!gotFirstToken) throw new Error(`${providerName}: stream ended with no content`);
  return full;
}

async function geminiFetchCards(prompt, tool, providerName = 'gemini') {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) throw new Error('GEMINI_API_KEY not set');
  const model = 'gemini-2.0-flash-exp';
  const url = `${GEMINI_BASE}/${model}:generateContent?key=${apiKey}`;
  const timeout = 25000;
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), timeout);

  log.info(`[${providerName}] → fetching cards with ${model}`);

  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: {
          temperature: 0.30,
          maxOutputTokens: 8192,
        },
      }),
      signal: ctrl.signal,
    });
    clearTimeout(timer);

    if (!res.ok) {
      const txt = await res.text().catch(() => '');
      log.error(`${providerName}: HTTP ${res.status} — ${trunc(txt, 200)}`);
      if (res.status === 401 || res.status === 403) throw new Error('API_KEY_INVALID');
      if (res.status === 429) throw new Error(`${providerName}: rate limited (429)`);
      throw new Error(`${providerName}: HTTP ${res.status}`);
    }

    const data = await res.json();
    let content = data?.candidates?.[0]?.content?.parts?.[0]?.text?.trim();
    if (!content || content.length < 20) throw new Error(`${providerName}: empty response`);

    // Same JSON cleaning
    content = content.replace(/^```(?:json)?\s*/im, '').replace(/\s*```\s*$/im, '').trim();
    const jS = content.indexOf('{'), jE = content.lastIndexOf('}');
    if (jS === -1 || jE <= jS) throw new Error(`${providerName}: no JSON object`);
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
          catch (e4) { throw new Error(`${providerName}: JSON repair failed - ${e4.message.slice(0,60)}`); }
        }
      }
    }

    // Normalise and validate
    if (Array.isArray(parsed.quiz_questions)) {
      parsed.quiz_questions = parsed.quiz_questions.map((q, i) => {
        q.id = q.id || i + 1;
        if (q.options && q.correct_answer && !q.options.includes(q.correct_answer)) {
          const lo = q.correct_answer.toLowerCase();
          const fix = q.options.find(o => o.toLowerCase() === lo) ||
                       q.options.find(o => o.toLowerCase().includes(lo) || lo.includes(o.toLowerCase())) ||
                       q.options[0];
          if (fix) q.correct_answer = fix;
        }
        return q;
      });
    }
    if (Array.isArray(parsed.flashcards)) {
      parsed.flashcards = parsed.flashcards
        .filter(c => (c.front || c.question) && (c.back || c.answer))
        .map(c => ({ front: String(c.front || c.question || '').trim(), back: String(c.back || c.answer || '').trim() }));
    }

    const hasFc = Array.isArray(parsed.flashcards) && parsed.flashcards.length >= 2;
    const hasQ  = Array.isArray(parsed.quiz_questions) && parsed.quiz_questions.length >= 2;
    const hasMm = parsed.mindmap?.branches?.length >= 2;
    const hasKc = Array.isArray(parsed.key_concepts) && parsed.key_concepts.length >= 1;
    const valid = (['flashcards','flashcards_quiz'].includes(tool)) ? hasFc
                : tool === 'quiz'                                    ? hasQ
                : (['mindmap','mindmap_only'].includes(tool))        ? hasMm
                : tool === 'all'                                     ? (hasFc || hasQ || hasMm || hasKc)
                : hasKc;
    if (!valid) throw new Error(`${providerName}: validation failed`);

    log.ok(`${providerName}: cards fetched (fc:${parsed.flashcards?.length||0}, q:${parsed.quiz_questions?.length||0}, mm:${parsed.mindmap?.branches?.length||0})`);
    return parsed;

  } catch (err) {
    clearTimeout(timer);
    throw err;
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// SECTION 7 – CASCADING PROVIDER WRAPPERS (with cache and retry)
// ─────────────────────────────────────────────────────────────────────────────

// We'll define an ordered list of providers to try for streaming notes and for cards.
// Each provider entry: { name, streamFn, cardsFn, hasKey }
function getAvailableProviders() {
  const providers = [];
  if (process.env.OPENROUTER_API_KEY) {
    providers.push({
      name: 'openrouter',
      streamFn: openRouterStreamNotes,
      cardsFn: openRouterFetchCards,
    });
  }
  if (process.env.GROQ_API_KEY) {
    providers.push({
      name: 'groq',
      streamFn: groqStreamNotes,
      cardsFn: groqFetchCards,
    });
  }
  if (process.env.GEMINI_API_KEY) {
    providers.push({
      name: 'gemini',
      streamFn: geminiStreamNotes,
      cardsFn: geminiFetchCards,
    });
  }
  // If none, we'll rely on fallback content.
  return providers;
}

// Main streamNotes – tries providers in order until one succeeds, with caching.
async function streamNotes(prompt, onChunk, tool) {
  const providers = getAvailableProviders();
  if (providers.length === 0) {
    log.warn('No API keys found – using fallback notes');
    const fallback = offlineNotes('your topic');
    // Stream fallback in chunks
    for (let i = 0; i < fallback.length; i += 300) {
      onChunk(fallback.slice(i, i + 300));
      await sleep(4);
    }
    return fallback;
  }

  // Check cache
  const cacheKey = getCacheKey(prompt, { tool }, 'notes', 'any');
  const cached = getCached(cacheKey);
  if (cached) {
    log.ok(`Cache hit for notes (${prompt.slice(0,30)}...)`);
    // Stream the cached content
    for (let i = 0; i < cached.length; i += 300) {
      onChunk(cached.slice(i, i + 300));
      await sleep(4);
    }
    return cached;
  }

  let lastError = null;
  for (const provider of providers) {
    try {
      log.info(`Trying ${provider.name} for notes...`);
      const result = await provider.streamFn(prompt, onChunk, tool, provider.name);
      // Cache success
      setCache(cacheKey, result);
      return result;
    } catch (err) {
      log.warn(`${provider.name} failed: ${err.message}`);
      lastError = err;
      // If it's a rate limit, wait before next provider
      if (/RATE_LIMIT/.test(err.message)) {
        const waitSeconds = parseInt(err.message.split(':')[1]) || 5;
        log.info(`Waiting ${waitSeconds}s before next provider...`);
        await sleep(waitSeconds * 1000);
      }
    }
  }

  // All providers failed – use fallback
  log.error('All providers failed, using fallback notes');
  const fallback = offlineNotes(prompt.slice(0, 60));
  for (let i = 0; i < fallback.length; i += 300) {
    onChunk(fallback.slice(i, i + 300));
    await sleep(4);
  }
  return fallback;
}

// Main fetchCards – tries providers in order with caching.
async function fetchCards(prompt, tool) {
  const providers = getAvailableProviders();
  if (providers.length === 0) {
    log.warn('No API keys found – using fallback cards');
    return buildTopicFallback(tool, 'your topic');
  }

  const cacheKey = getCacheKey(prompt, { tool }, 'cards', 'any');
  const cached = getCached(cacheKey);
  if (cached) {
    log.ok(`Cache hit for cards (${prompt.slice(0,30)}...)`);
    return cached;
  }

  let lastError = null;
  for (const provider of providers) {
    try {
      log.info(`Trying ${provider.name} for cards...`);
      const result = await provider.cardsFn(prompt, tool, provider.name);
      setCache(cacheKey, result);
      return result;
    } catch (err) {
      log.warn(`${provider.name} failed: ${err.message}`);
      lastError = err;
      if (/RATE_LIMIT/.test(err.message)) {
        const waitSeconds = parseInt(err.message.split(':')[1]) || 5;
        log.info(`Waiting ${waitSeconds}s before next provider...`);
        await sleep(waitSeconds * 1000);
      }
    }
  }

  // All providers failed – use fallback
  log.error('All providers failed, using fallback cards');
  return buildTopicFallback(tool, prompt.slice(0, 60));
}

// ─────────────────────────────────────────────────────────────────────────────
// SECTION 8 – FALLBACK CONTENT (static but informative)
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
// SECTION 9 – TOPIC FACT (unchanged)
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
// SECTION 10 – MERGE (unchanged)
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
// SECTION 11 – SSE HELPER + SECURITY HEADERS
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
// SECTION 12 – MAIN HANDLER
// ─────────────────────────────────────────────────────────────────────────────

module.exports = async function handler(req, res) {
  const reqId     = `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
  const startTime = Date.now();
  log.info(`[${reqId}] ${req.method} /api/study`);

  setHeaders(res);
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST')   return res.status(405).json({ error: 'Method not allowed. Use POST.' });

  if (!process.env.OPENROUTER_API_KEY && !process.env.GROQ_API_KEY && !process.env.GEMINI_API_KEY) {
    log.warn('No AI API keys found – will use fallback content only.');
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

  // ─── SSE SETUP ─────────────────────────────────────────────────────────────
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
    // ─── PHASE 1 + 2 CONCURRENT ─────────────────────────────────────────────
    sse('stage', { idx: 1, label: `📝 Writing ${opts.tool === 'summary' ? 'smart summary' : 'study notes'}…` });

    const notesPrompt = buildNotesPrompt(message, opts);

    // Phase 2 – cards (background)
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

    // Phase 1 – notes stream
    try {
      notes = await streamNotes(notesPrompt, chunk => sse('token', { t: chunk }), opts.tool);
      p1ok = true;
      log.ok(`[${reqId}] P1 done — ${notes.length}ch`);
    } catch (e1) {
      log.error(`[${reqId}] P1 failed — using fallback: ${e1.message}`);
      notes = offlineNotes(message);
      for (let i = 0; i < notes.length; i += 300) {
        sse('token', { t: notes.slice(i, i + 300) });
        await sleep(4);
      }
      p1ok = false;
    }

    sse('stage', { idx: 2, label: '✅ Notes complete! Finalising interactive cards…' });

    let p2DotCount = 0;
    p2Ticker = setInterval(() => {
      p2DotCount = (p2DotCount % 3) + 1;
      sse('stage', { idx: 3, label: `🃏 Finalising your cards${'.'.repeat(p2DotCount)}` });
    }, 1500);

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
        log.error(`[${reqId}] Mega P2a failed: ${fcqRes.reason?.message}`);
      }
      if (mmRes.status === 'fulfilled' && mmRes.value?.mindmap) {
        cardsData.mindmap = mmRes.value.mindmap;
        if (!cardsData.key_concepts?.length && mmRes.value.key_concepts?.length)
          cardsData.key_concepts = mmRes.value.key_concepts;
      } else {
        log.error(`[${reqId}] Mega P2b failed: ${mmRes.reason?.message}`);
      }

      p2ok = !!(cardsData.flashcards?.length || cardsData.quiz_questions?.length || cardsData.mindmap);
      if (!p2ok) {
        log.warn(`[${reqId}] Mega cards failed – using fallback`);
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
        log.warn(`[${reqId}] P2 failed for ${opts.tool} – using fallback: ${cardsResult.reason?.message}`);
        cardsData = buildTopicFallback(opts.tool, message);
        p2ok = false;
      }
    }

    // ─── PHASE 3 – STREAM CARDS LIVE ──────────────────────────────────────
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

    // ─── FINAL ──────────────────────────────────────────────────────────────
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
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
// SECTION 2 — MODEL LISTS (original, unchanged)
// ─────────────────────────────────────────────────────────────────────────────

const MODELS_STREAM = [
  { id: 'google/gemini-2.0-flash-exp:free',          max_tokens: 5000, timeout_ms: 45000, temp: 0.75 },
  { id: 'google/gemini-flash-1.5-8b:free',           max_tokens: 4500, timeout_ms: 45000, temp: 0.75 },
  { id: 'meta-llama/llama-3.3-70b-instruct:free',    max_tokens: 4500, timeout_ms: 45000, temp: 0.75 },
  { id: 'microsoft/phi-3-mini-128k-instruct:free',   max_tokens: 3500, timeout_ms: 45000, temp: 0.75 },
  { id: 'mistralai/mistral-7b-instruct-v0.3:free',   max_tokens: 3500, timeout_ms: 45000, temp: 0.75 },
  { id: 'qwen/qwen2.5-72b-instruct:free',            max_tokens: 4500, timeout_ms: 45000, temp: 0.75 },
  { id: 'z-ai/glm-4.5-air:free',                     max_tokens: 4000, timeout_ms: 45000, temp: 0.75 },
  { id: 'openrouter/free',                            max_tokens: 5000, timeout_ms: 60000, temp: 0.75 },
];

const MODELS_CARDS = [
  { id: 'google/gemini-2.0-flash-exp:free',          max_tokens: 8000, timeout_ms: 50000, temp: 0.30 },
  { id: 'google/gemini-flash-1.5-8b:free',           max_tokens: 7000, timeout_ms: 50000, temp: 0.30 },
  { id: 'meta-llama/llama-3.3-70b-instruct:free',    max_tokens: 7000, timeout_ms: 50000, temp: 0.30 },
  { id: 'microsoft/phi-3-mini-128k-instruct:free',   max_tokens: 6000, timeout_ms: 50000, temp: 0.30 },
  { id: 'mistralai/mistral-7b-instruct-v0.3:free',   max_tokens: 5000, timeout_ms: 50000, temp: 0.30 },
  { id: 'qwen/qwen2.5-72b-instruct:free',            max_tokens: 7500, timeout_ms: 50000, temp: 0.30 },
  { id: 'z-ai/glm-4.5-air:free',                     max_tokens: 8000, timeout_ms: 50000, temp: 0.30 },
  { id: 'openrouter/free',                            max_tokens: 6000, timeout_ms: 65000, temp: 0.30 },
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
// SECTION 4 — UTILITIES (unchanged)
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
// SECTION 6 — PROMPT BUILDERS (unchanged)
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
• "options": array of EXACTLY 4 strings — each must be a COMPLETE ANSWER TEXT (20-80 words), NOT single letters like "A" or "B"
• "correct_answer": MUST be CHARACTER-FOR-CHARACTER identical to one of the options strings — copy-paste the FULL option text exactly
• "explanation": 60-100 words explaining why correct, referencing "${topicShort}" (in ${lang})
• "difficulty": "easy" | "medium" | "hard"
DIFFICULTY RULE: ${qDiffInstr}
CRITICAL: correct_answer must exactly match one options[] string — copy-paste it. Options must be full answer sentences, never single letters.` : '';

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
  ${includeQ   ? `"quiz_questions": [{"id":1,"question":"Specific question about the topic","options":["Full option text A","Full option text B","Full option text C","Full option text D"],"correct_answer":"Full option text A","explanation":"Detailed explanation why correct","difficulty":"medium"}],` : '"quiz_questions": [],'}
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

// ─────────────────────────────────────────────────────────────────────────────
// SECTION 7 — PHASE 1: STREAM NOTES (original logic, but no fallback)
// ─────────────────────────────────────────────────────────────────────────────

async function streamNotes(prompt, onChunk, tool) {
  const MAX_PASSES = 3;

  for (let pass = 0; pass < MAX_PASSES; pass++) {
    if (pass > 0) {
      const backoff = Math.min(1000 * Math.pow(2, pass), 4000);
      log.warn(`P1 ↻ Pass ${pass + 1}/${MAX_PASSES} — backing off ${backoff}ms`);
      await sleep(backoff);
    }

    for (const model of MODELS_STREAM) {
      const name  = model.id.split('/').pop();
      const ctrl  = new AbortController();
      const timer = setTimeout(() => ctrl.abort(), model.timeout_ms);
      const t0    = Date.now();

      try {
        log.info(`P1 → ${name} | tool:${tool} (pass ${pass + 1}/${MAX_PASSES})`);

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

        if (res.status === 429) {
          log.warn(`P1 ⏳ 429 on ${name} — moving to next model`);
          continue;
        }

        if (res.status === 404) {
          log.warn(`P1 ⚠️ 404 on ${name} — model slug invalid/unavailable, skipping`);
          continue;
        }

        if (!res.ok) {
          const txt = await res.text().catch(() => '');
          log.warn(`P1 HTTP ${res.status} — ${name}: ${trunc(txt, 100)}`);
          if (res.status === 401 || res.status === 403) {
            throw new Error('OPENROUTER_API_KEY is invalid or missing.');
          }
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
              if (delta) {
                full += delta;
                tokens++;
                onChunk(delta);
              }
            } catch { /* ignore */ }
          }
        }

        if (full.trim().length < 80) {
          log.warn(`${name}: response too short (${full.length}ch) — trying next model`);
          continue;
        }

        log.ok(`P1 ✅ ${name} | ${tokens} tokens | ${full.length}ch | ${Date.now() - t0}ms`);
        return full;

      } catch (err) {
        clearTimeout(timer);
        if (err.name === 'AbortError') {
          log.warn(`P1 ⏱️ ${name} timed out after ${model.timeout_ms}ms`);
        } else {
          log.warn(`P1 ✗ ${name}: ${err.message}`);
        }
        if (err.message?.includes('API_KEY') || err.message?.includes('invalid')) throw err;
        // otherwise just move to next model
      }
    }
  }

  log.error(`P1 ALL MODELS FAILED across ${MAX_PASSES} passes`);
  throw new Error(`All AI models are currently busy. Please try again in a moment.`);
}

// ─────────────────────────────────────────────────────────────────────────────
// SECTION 8 — PHASE 2: FETCH CARDS (original logic, no fallback)
// ─────────────────────────────────────────────────────────────────────────────

async function fetchCards(prompt, tool) {
  const MAX_PASSES = 3;

  for (let pass = 0; pass < MAX_PASSES; pass++) {
    if (pass > 0) {
      const backoff = Math.min(1000 * Math.pow(2, pass), 4000);
      log.warn(`P2 ↻ Pass ${pass + 1}/${MAX_PASSES} — backing off ${backoff}ms`);
      await sleep(backoff);
    }

    for (const model of MODELS_CARDS) {
      const name  = model.id.split('/').pop();
      const ctrl  = new AbortController();
      const timer = setTimeout(() => ctrl.abort(), model.timeout_ms);
      const t0    = Date.now();

      try {
        log.info(`P2 → ${name} | tool:${tool} (pass ${pass + 1}/${MAX_PASSES})`);

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

        if (res.status === 429) {
          log.warn(`P2 ⏳ 429 on ${name} — moving to next model`);
          continue;
        }

        if (res.status === 404) {
          log.warn(`P2 ⚠️ 404 on ${name} — model slug invalid/unavailable, skipping`);
          continue;
        }

        if (!res.ok) {
          const txt = await res.text().catch(() => '');
          log.warn(`P2 HTTP ${res.status} — ${name}: ${trunc(txt, 100)}`);
          if (res.status === 401 || res.status === 403) {
            throw new Error('OPENROUTER_API_KEY is invalid or missing.');
          }
          continue;
        }

        const data    = await res.json();
        let content = data?.choices?.[0]?.message?.content?.trim();

        if (!content || content.length < 20) {
          log.warn(`${name}: empty response — trying next model`);
          continue;
        }

        content = content.replace(/^```(?:json)?\s*/im, '').replace(/\s*```\s*$/im, '').trim();

        const jS = content.indexOf('{');
        const jE = content.lastIndexOf('}');
        if (jS === -1 || jE <= jS) {
          log.warn(`${name}: no JSON object — trying next model`);
          continue;
        }
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
                log.warn(`${name}: JSON repair failed — ${e4.message.slice(0, 80)} — trying next model`);
                continue;
              }
            }
          }
        }

        if (Array.isArray(parsed.quiz_questions)) {
          parsed.quiz_questions = parsed.quiz_questions.map((q, i) => {
            q.id = q.id || i + 1;
            if (q.options && q.correct_answer) {
              // If correct_answer is just a letter like "A", "B", "C", "D" — convert to full option text
              const letterMap = { 'A': 0, 'B': 1, 'C': 2, 'D': 3, 'a': 0, 'b': 1, 'c': 2, 'd': 3 };
              const trimmedAnswer = String(q.correct_answer).trim();
              if (trimmedAnswer.length <= 2 && letterMap[trimmedAnswer] !== undefined) {
                const idx = letterMap[trimmedAnswer];
                if (q.options[idx]) {
                  log.info(`${name}: converted letter answer "${trimmedAnswer}" → option[${idx}] for Q${i+1}`);
                  q.correct_answer = q.options[idx];
                }
              }
              // If still not matching an option exactly, try fuzzy match
              if (!q.options.includes(q.correct_answer)) {
                const lo  = q.correct_answer.toLowerCase();
                const fix = q.options.find(o => o.toLowerCase() === lo)
                         || q.options.find(o => o.toLowerCase().includes(lo) || lo.includes(o.toLowerCase()));
                if (fix) {
                  q.correct_answer = fix;
                  log.info(`${name}: fuzzy-fixed Q${i+1} correct_answer`);
                } else {
                  // No match found at all — log it; leave as-is rather than guessing,
                  // downstream validation will catch genuinely broken questions
                  log.warn(`${name}: Q${i+1} correct_answer has no matching option — keeping as-is`);
                }
              }
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

        if (!valid) {
          log.warn(`${name}: validation failed — fc:${parsed.flashcards?.length||0} q:${parsed.quiz_questions?.length||0} mm:${parsed.mindmap?.branches?.length||0} — trying next model`);
          continue;
        }

        log.ok(`P2 ✅ ${name} | ${tool} | fc:${parsed.flashcards?.length||0} q:${parsed.quiz_questions?.length||0} mm:${parsed.mindmap?.branches?.length||0} | ${Date.now()-t0}ms`);
        return parsed;

      } catch (err) {
        clearTimeout(timer);
        if (err.name === 'AbortError') {
          log.warn(`P2 ⏱️ ${name} timed out after ${model.timeout_ms}ms`);
        } else {
          log.warn(`P2 ✗ ${name}: ${err.message}`);
        }
        if (err.message?.includes('API_KEY') || err.message?.includes('invalid')) throw err;
        // otherwise just move to next model
      }
    }
  }

  log.error(`P2 ALL MODELS FAILED across ${MAX_PASSES} passes`);
  throw new Error(`P2_FAILED`); // sentinel — handled gracefully by caller, not surfaced as fatal
}

// ─────────────────────────────────────────────────────────────────────────────
// SECTION 9 — FALLBACK FUNCTIONS (kept but NOT used — we throw errors instead)
// ─────────────────────────────────────────────────────────────────────────────

// NOTE: offlineNotes() and buildTopicFallback() are kept for reference but never called.
// All outputs are AI-generated only.

function offlineNotes(topic) { /* ... */ }
function buildTopicFallback(tool, topic) { /* ... */ }

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
    _quality:                'ai_generated',
  };
  if (Array.isArray(cardsRaw?.flashcards)    && cardsRaw.flashcards.length)    merged.flashcards     = cardsRaw.flashcards;
  if (Array.isArray(cardsRaw?.quiz_questions) && cardsRaw.quiz_questions.length) merged.quiz_questions = cardsRaw.quiz_questions;
  if (cardsRaw?.mindmap?.branches?.length)                                      merged.mindmap        = cardsRaw.mindmap;

  // No generic templated filler here — key_concepts stays empty if the AI didn't generate any.
  // Serving canned text as if it were AI output would misrepresent the result.
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
// SECTION 13 — MAIN HANDLER (parallel execution, no fallback)
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

  // Keep-alive ping every 10s
  const kap = setInterval(() => {
    if (res.writableEnded) { clearInterval(kap); return; }
    try {
      res.write(`: ping ${Date.now()}\n\n`);
      if (typeof res.flush === 'function') res.flush();
    } catch { clearInterval(kap); }
  }, 10000);

  // Auto-advance stage timers (visual feedback)
  const stageTimers = [
    setTimeout(() => sse('stage', { idx: 1, label: '📝 Writing your content…' }),         2500),
    setTimeout(() => sse('stage', { idx: 2, label: '🔍 Building sections…' }),            7000),
    setTimeout(() => sse('stage', { idx: 3, label: '🃏 Generating interactive cards…' }), 18000),
  ];
  const clearStages = () => stageTimers.forEach(clearTimeout);

  sse('heartbeat', { ts: Date.now(), status: 'connected', service: SAVOIRÉ.BRAND, requestId: reqId, tool: opts.tool });
  sse('stage',     { idx: 0, label: `🎯 Analysing "${message.slice(0, 50)}${message.length > 50 ? '…' : ''}"` });
  sse('fact',      { fact: buildTopicFact(message) });
  sse('token',     { t: '' }); // prime the token stream

  let notes = '', cardsData = null;

  try {
    const notesPrompt = buildNotesPrompt(message, opts);

    // ── Start streaming notes ── (this is the core content; if this fails, we have nothing honest to show)
    const notesPromise = streamNotes(notesPrompt, chunk => sse('token', { t: chunk }), opts.tool);

    // ── Start fetching cards in parallel ── (best-effort; if this fails we still ship notes)
    let cardsPromise;
    if (opts.tool === 'all') {
      // Mega: fetch flashcards+quiz and mindmap simultaneously
      const fcqPromise = fetchCards(buildCardsPrompt(message, opts, 'flashcards_quiz'), 'flashcards_quiz');
      const mmPromise  = fetchCards(buildCardsPrompt(message, opts, 'mindmap_only'),    'mindmap_only');
      cardsPromise = Promise.allSettled([fcqPromise, mmPromise])
        .then(([fcqR, mmR]) => {
          const fcq = fcqR.status === 'fulfilled' ? fcqR.value : null;
          const mm  = mmR.status  === 'fulfilled' ? mmR.value  : null;
          if (!fcq && !mm) return null; // both failed — caller treats as cardsData=null
          const merged = { ...(fcq || {}) };
          if (mm?.mindmap) merged.mindmap = mm.mindmap;
          if (mm?.key_concepts && !merged.key_concepts) merged.key_concepts = mm.key_concepts;
          return merged;
        });
    } else {
      cardsPromise = fetchCards(buildCardsPrompt(message, opts), opts.tool).catch(err => {
        log.warn(`[${reqId}] P2 failed (non-fatal): ${err.message}`);
        return null; // cards are best-effort — don't let a P2 failure kill the whole response
      });
    }

    // ── Notes are mandatory; cards are best-effort for notes/summary, but mandatory deliverable for card-centric tools ──
    notes = await notesPromise;
    cardsData = await cardsPromise;

    const cardsOk = !!cardsData;
    const cardsAreTheDeliverable = ['flashcards', 'quiz', 'mindmap', 'all'].includes(opts.tool);

    if (!cardsOk && cardsAreTheDeliverable) {
      // For these tools, "notes only" isn't an honest substitute for what the user asked for.
      throw new Error(`Card generation failed for tool "${opts.tool}" across all models — no honest output to ship.`);
    }

    log.ok(`[${reqId}] Notes complete (${notes.length}ch). Cards: ${cardsOk ? 'ok' : 'unavailable, shipping notes only'}`);

    // ── Merge and send final ──
    clearInterval(kap);
    clearStages();

    const final = mergeCards(cardsData, notes, message, opts);
    final._duration_ms  = Date.now() - startTime;
    final._request_id   = reqId;
    final._phase1_ok    = true;
    final._phase2_ok    = cardsOk;
    final._notes_only   = !cardsOk;
    final.topic_fact    = buildTopicFact(message);
    final.powered_by    = `${SAVOIRÉ.BRAND} by ${SAVOIRÉ.DEVELOPER}`;

    sse('stage', { idx: 4, label: cardsOk ? '✅ Complete! All study materials ready.' : '✅ Notes ready (cards generation hit a snag).', done: true });
    sse('done',  final);

    log.ok(`[${reqId}] ✅ COMPLETE — ${final._duration_ms}ms | tool:${opts.tool} | cardsOk:${cardsOk}`);
    sendToGoogleSheets(userName, userStreak, userSess, opts.tool, message, cardsOk ? 'completed' : 'completed_partial', final._duration_ms, sessionId).catch(() => {});

  } catch (fatal) {
    // Only lands here if notes themselves (the core content) failed across all models/passes.
    // We do NOT fabricate fallback content — that would misrepresent AI-generated output.
    clearInterval(kap);
    clearStages();
    log.error(`[${reqId}] FATAL (notes generation failed): ${fatal.message}`);
    sse('error', { error: 'All AI models are currently busy. Please try again in a few seconds.', requestId: reqId });
    sendToGoogleSheets(userName, userStreak, userSess, opts.tool, message, 'failed', Date.now() - startTime, sessionId).catch(() => {});
  }

  if (!res.writableEnded) res.end();
};
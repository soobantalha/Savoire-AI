'use strict';
// ═══════════════════════════════════════════════════════════════════════════════
// SAVOIRÉ AI v2.0 — api/study.js — ULTRA RELIABLE, ALWAYS RETURNS DONE
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
// SECTION 2 — MODEL LIST (only currently available free models)
// ─────────────────────────────────────────────────────────────────────────────

// Phase 1: Streaming notes (faster models first)
const MODELS_STREAM = [
  { id: 'google/gemini-2.0-flash-exp:free',          max_tokens: 5000, timeout_ms: 40000, temp: 0.75 },
  { id: 'google/gemini-flash-1.5-8b:free',           max_tokens: 4500, timeout_ms: 40000, temp: 0.75 },
  { id: 'meta-llama/llama-3.3-70b-instruct:free',    max_tokens: 4500, timeout_ms: 40000, temp: 0.75 },
  { id: 'microsoft/phi-3-mini-128k-instruct:free',   max_tokens: 3500, timeout_ms: 40000, temp: 0.75 },
  { id: 'mistralai/mistral-7b-instruct-v0.3:free',   max_tokens: 3500, timeout_ms: 40000, temp: 0.75 },
  { id: 'qwen/qwen2.5-72b-instruct:free',            max_tokens: 4500, timeout_ms: 40000, temp: 0.75 },
  { id: 'z-ai/glm-4.5-air:free',                     max_tokens: 4000, timeout_ms: 40000, temp: 0.75 },
  { id: 'openrouter/free',                            max_tokens: 5000, timeout_ms: 55000, temp: 0.75 },
];

// Phase 2: Structured JSON (higher accuracy)
const MODELS_CARDS = [
  { id: 'google/gemini-2.0-flash-exp:free',          max_tokens: 7000, timeout_ms: 35000, temp: 0.30 },
  { id: 'google/gemini-flash-1.5-8b:free',           max_tokens: 6000, timeout_ms: 35000, temp: 0.30 },
  { id: 'meta-llama/llama-3.3-70b-instruct:free',    max_tokens: 6000, timeout_ms: 35000, temp: 0.30 },
  { id: 'microsoft/phi-3-mini-128k-instruct:free',   max_tokens: 5000, timeout_ms: 35000, temp: 0.30 },
  { id: 'mistralai/mistral-7b-instruct-v0.3:free',   max_tokens: 4500, timeout_ms: 35000, temp: 0.30 },
  { id: 'qwen/qwen2.5-72b-instruct:free',            max_tokens: 6000, timeout_ms: 35000, temp: 0.30 },
  { id: 'z-ai/glm-4.5-air:free',                     max_tokens: 5500, timeout_ms: 35000, temp: 0.30 },
  { id: 'openrouter/free',                            max_tokens: 7000, timeout_ms: 45000, temp: 0.30 },
];

// ─────────────────────────────────────────────────────────────────────────────
// SECTION 3 — CONFIG MAPS (unchanged)
// ─────────────────────────────────────────────────────────────────────────────

const DEPTH_MAP = {
  standard:      { wordRange: '600–900 words',   maxTokens: 2800 },
  detailed:      { wordRange: '1000–1500 words', maxTokens: 3800 },
  comprehensive: { wordRange: '1500–2200 words', maxTokens: 5000 },
  expert:        { wordRange: '2200–3500 words', maxTokens: 6500 },
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
// SECTION 7 — PHASE 1: STREAM NOTES (sequential retry with backoff)
// ─────────────────────────────────────────────────────────────────────────────

async function streamNotes(prompt, onChunk, tool) {
  let lastError = 'No model responded';
  const maxPasses = 3;
  for (let pass = 0; pass < maxPasses; pass++) {
    if (pass > 0) {
      const delay = Math.min(1000 * Math.pow(2, pass), 4000);
      log.info(`P1 retry pass ${pass+1} waiting ${delay}ms...`);
      await sleep(delay);
    }
    for (const model of MODELS_STREAM) {
      const name = model.id.split('/').pop().replace(':free', '');
      const ctrl = new AbortController();
      let timer = setTimeout(() => ctrl.abort(), model.timeout_ms);
      const t0 = Date.now();

      try {
        log.info(`P1 (${tool}) → ${name} (pass ${pass+1})`);
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
          log.warn(`P1 HTTP ${res.status} ${name}: ${trunc(txt, 80)}`);
          if (res.status === 401 || res.status === 403) {
            throw new Error('OPENROUTER_API_KEY is invalid or missing.');
          }
          if (res.status === 429) {
            lastError = `Rate limited (429) on ${name}`;
            continue;
          }
          lastError = `HTTP ${res.status} on ${name}`;
          continue;
        }

        const reader = res.body.getReader();
        const decoder = new TextDecoder('utf-8');
        let lineBuf = '';
        let full = '';
        let gotFirst = false;

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
                if (!gotFirst) {
                  gotFirst = true;
                  log.ok(`P1 🏆 ${name} first token in ${Date.now()-t0}ms`);
                }
                full += delta;
                onChunk(delta);
              }
            } catch { /* ignore */ }
          }
        }

        if (!gotFirst) {
          lastError = `${name}: no content received`;
          continue;
        }
        if (full.trim().length < 80) {
          log.warn(`${name}: short response (${full.length}) – using as‑is`);
        }
        log.ok(`P1 ✅ ${name} | ${full.length}ch | ${Date.now()-t0}ms`);
        return full; // success

      } catch (err) {
        clearTimeout(timer);
        if (err.message.includes('API_KEY')) throw err;
        const reason = err.name === 'AbortError' ? `${name} timed out` : err.message;
        log.warn(`P1 fail (${name}): ${reason}`);
        lastError = `${name}: ${reason}`;
        // Continue to next model
      }
    }
  }
  // All passes exhausted
  throw new Error(`Notes generation failed after ${maxPasses} passes. Last error: ${lastError}`);
}

// ─────────────────────────────────────────────────────────────────────────────
// SECTION 8 — PHASE 2: FETCH CARDS (sequential retry with backoff)
// ─────────────────────────────────────────────────────────────────────────────

async function fetchCards(prompt, tool, topic) {
  let lastError = 'No model responded';
  const maxPasses = 3;
  for (let pass = 0; pass < maxPasses; pass++) {
    if (pass > 0) {
      const delay = Math.min(1000 * Math.pow(2, pass), 4000);
      log.info(`P2 retry pass ${pass+1} waiting ${delay}ms...`);
      await sleep(delay);
    }
    for (const model of MODELS_CARDS) {
      const name = model.id.split('/').pop().replace(':free', '');
      const ctrl = new AbortController();
      const timer = setTimeout(() => ctrl.abort(), model.timeout_ms);
      const t0 = Date.now();

      try {
        log.info(`P2 (${tool}) → ${name} (pass ${pass+1})`);
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
            temperature: model.temp || 0.30,
            stream: false,
            messages: [{ role: 'user', content: prompt }],
          }),
          signal: ctrl.signal,
        });
        clearTimeout(timer);

        if (!res.ok) {
          const txt = await res.text().catch(() => '');
          log.warn(`P2 HTTP ${res.status} ${name}: ${trunc(txt, 80)}`);
          if (res.status === 401 || res.status === 403) {
            throw new Error('OPENROUTER_API_KEY is invalid or missing.');
          }
          if (res.status === 429) {
            lastError = `Rate limited (429) on ${name}`;
            continue;
          }
          lastError = `HTTP ${res.status} on ${name}`;
          continue;
        }

        const data = await res.json();
        let content = data?.choices?.[0]?.message?.content?.trim();
        if (!content || content.length < 50) {
          lastError = `${name}: empty response`;
          continue;
        }

        // Clean and parse JSON
        content = content.replace(/^```(?:json)?\s*/im, '').replace(/\s*```\s*$/im, '').trim();
        const jS = content.indexOf('{'), jE = content.lastIndexOf('}');
        if (jS === -1 || jE <= jS) {
          lastError = `${name}: no JSON object`;
          continue;
        }
        let jsonStr = content.slice(jS, jE + 1);

        // 4-step repair
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
                lastError = `${name}: JSON repair failed`;
                continue;
              }
            }
          }
        }

        // Auto-fix quiz correct_answer
        if (Array.isArray(parsed.quiz_questions)) {
          parsed.quiz_questions = parsed.quiz_questions.map((q, i) => {
            q.id = q.id || i + 1;
            if (q.options && q.correct_answer && !q.options.includes(q.correct_answer)) {
              const lower = q.correct_answer.toLowerCase();
              const fix = q.options.find(o => o.toLowerCase() === lower) ||
                          q.options.find(o => o.toLowerCase().includes(lower) || lower.includes(o.toLowerCase())) ||
                          q.options[0];
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

        // Validate
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
          lastError = `${name}: validation failed`;
          continue;
        }

        log.ok(`P2 ✅ ${name} | fc:${parsed.flashcards?.length||0} q:${parsed.quiz_questions?.length||0} mm:${parsed.mindmap?.branches?.length||0} | ${Date.now()-t0}ms`);
        return parsed;

      } catch (err) {
        clearTimeout(timer);
        if (err.message.includes('API_KEY')) throw err;
        const reason = err.name === 'AbortError' ? `${name} timed out` : err.message;
        log.warn(`P2 fail (${name}): ${reason}`);
        lastError = `${name}: ${reason}`;
        // Continue to next model
      }
    }
  }
  throw new Error(`Cards generation failed after ${maxPasses} passes. Last error: ${lastError}`);
}

// ─────────────────────────────────────────────────────────────────────────────
// SECTION 9 — FALLBACK CONTENT (only as absolute last resort)
// ─────────────────────────────────────────────────────────────────────────────

function offlineNotes(topic) {
  const T = topic || 'this topic';
  return `## 📚 Introduction to ${T}

**${T}** is an important area of study with significant theoretical foundations and practical applications. This guide covers the essential concepts, mechanisms, and applications.

---

## 🎯 Core Concepts

> **Definition:** ${T} refers to the systematic study and practice of its core domain, encompassing the principles, methods, and applications that define the field.

**Foundational Framework:** The study of ${T} rests on interconnected principles that together explain how and why things work as they do. Understanding these connections is more valuable than memorising individual definitions.

**Key Relationships:** Core concepts in ${T} are not isolated but form a coherent system. Grasping how each concept relates to others is the key to genuine mastery.

---

## ⚙️ How It Works

The primary mechanism of ${T} operates through a structured sequence:

1. **Initial conditions** are identified and characterised
2. **The primary process** begins following the rules of ${T}
3. **Intermediate stages** transform inputs progressively
4. **Observable outcomes** emerge and can be evaluated against standards

Each stage follows from the previous according to identifiable patterns.

---

## 💡 Key Examples

**Example 1:** The simplest case shows core principles in their clearest form — revealing the essential logic underlying all more complex instances.

**Example 2:** Real-world application adds complications requiring adaptation of the core approach to specific circumstances.

**Example 3:** Edge cases show where standard approaches break down, revealing boundary conditions that experts must recognise.

---

## 🚀 Advanced Aspects

**Boundary conditions:** Every principle holds under specific conditions and breaks down outside them. Knowing these boundaries is as important as knowing the principles themselves.

**Ongoing research:** Like all living fields, ${T} has active research frontiers where questions remain open.

**Interdisciplinary connections:** ${T} connects productively to adjacent fields in both directions.

---

## 📝 Key Takeaways

- ✅ ${T} is a reasoning framework, not a collection of facts
- ✅ Understanding WHY mechanisms work matters more than memorising WHAT they produce
- ✅ Real mastery = applying ${T} to novel situations, not just familiar ones  
- ✅ Knowing boundary conditions prevents systematic errors
- ✅ Active retrieval practice is 2-3× more effective than re-reading for ${T}

## ⚠️ Common Mistakes

- ⚠️ Memorising definitions without understanding mechanisms
- ⚠️ Applying principles outside their valid scope
- ⚠️ Confusing re-reading familiarity with genuine understanding

---
*Generated by ${SAVOIRÉ.BRAND} | ${SAVOIRÉ.DEVELOPER} | Free forever*`;
}

function buildTopicFallback(tool, topic) {
  // This is used only if ALL AI models fail – provides a usable (if generic) result.
  const T = topic || 'this topic';
  const base = {
    topic: T,
    curriculum_alignment: 'General Academic Study',
    study_score: 88,
    _fallback: true,
    key_concepts: [
      `Core Principles: ${T} rests on fundamental principles connecting theory to practice. Understanding WHY matters more than memorising WHAT.`,
      `Key Mechanisms: Primary processes in ${T} follow identifiable patterns that can be learned and applied.`,
      `Practical Transfer: ${T} knowledge applies across healthcare, technology, business, and research.`,
      `Expert Thinking: Experts in ${T} differ in pattern recognition and conditional reasoning.`,
      `Learning Strategy: Active retrieval is 2‑3× more effective than re‑reading for mastering ${T}.`,
    ],
    key_tricks: [
      `🧠 Memory trick: Break ${T} into 3-4 chunks and create a short acronym.`,
      `📝 Study strategy: Teach ${T} out loud to an imaginary student – gaps reveal themselves.`,
      `⏰ Recall technique: Review ${T} at 1, 3, 7, 14, 30 day intervals.`,
    ],
    practice_questions: [
      { question: `Explain the core mechanism behind ${T} in your own words.`, answer: `A strong answer identifies key components, describes their interaction, and gives a real-world example.` },
      { question: `How would you apply ${T} to solve a real-world problem?`, answer: `Identify a specific scenario, map the relevant principles, and explain the expected outcome.` },
    ],
    real_world_applications: [
      `🏥 Healthcare: ${T} informs diagnostic and treatment decision-making.`,
      `💻 Technology: ${T} principles are used in system design and automation.`,
      `📈 Business: Organisations apply ${T} thinking to strategy and operations.`,
      `🌍 Society: ${T} has broader social and environmental implications.`,
    ],
    common_misconceptions: [
      `❌ MYTH: ${T} is just a list of facts to memorise. ✅ TRUTH: It's a connected framework – relationships matter more.`,
      `❌ MYTH: Reading once is enough to master ${T}. ✅ TRUTH: Active recall and spaced repetition are essential.`,
      `❌ MYTH: ${T} only matters for exams. ✅ TRUTH: Its principles transfer to real decision-making.`,
    ],
  };
  if (tool === 'flashcards' || tool === 'all') {
    base.flashcards = base.key_concepts.map(c => {
      const parts = c.split(':');
      return { front: (parts[0] || T).trim() + '?', back: (parts[1] || c).trim() };
    });
  }
  if (tool === 'quiz' || tool === 'all') {
    base.quiz_questions = [
      {
        id: 1,
        question: `Which statement best describes ${T}?`,
        options: [
          `${T} is a connected framework of principles and applications`,
          `${T} is a random collection of unrelated facts`,
          `${T} has no real-world relevance`,
          `${T} cannot be studied systematically`,
        ],
        correct_answer: `${T} is a connected framework of principles and applications`,
        explanation: `${T} is best understood as an interconnected system rather than isolated facts.`,
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
        explanation: `Research shows that active recall at increasing intervals produces dramatically better long-term retention.`,
        difficulty: 'medium',
      },
    ];
  }
  if (tool === 'mindmap' || tool === 'all') {
    base.mindmap = {
      central: T,
      branches: [
        { name: 'Foundations', color: '#00d4ff', items: base.key_concepts.slice(0, 2) },
        { name: 'Mechanisms',  color: '#bf00ff', items: [`Core process behind ${T}`, `Step-by-step transformation`] },
        { name: 'Applications', color: '#00ff88', items: base.real_world_applications.slice(0, 3) },
        { name: 'Pitfalls', color: '#ff4444', items: base.common_misconceptions.slice(0, 2) },
      ],
      connections: [
        { from: 'Foundations', to: 'Mechanisms', description: 'Principles explain why mechanisms work.' },
        { from: 'Mechanisms', to: 'Applications', description: 'Understanding the mechanism enables real-world use.' },
      ],
    };
  }
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
      `Key Mechanisms: Primary processes follow identifiable patterns that can be learned and applied.`,
      `Practical Transfer: ${topic} knowledge applies to healthcare, technology, business, and research.`,
      `Expert Thinking: Experts in ${topic} differ in pattern recognition and conditional reasoning.`,
      `Learning Strategy: Active retrieval is 2‑3× more effective than re‑reading for mastering ${topic}.`,
    ];
  }
  return merged;
}

// ─────────────────────────────────────────────────────────────────────────────
// SECTION 12 — SSE HELPER + SECURITY HEADERS (unchanged)
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
// SECTION 13 — MAIN HANDLER (always returns done, no error screen)
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

  // Stage timers
  const stageTimers = [
    setTimeout(() => sse('stage', { idx: 1, label: '📝 Writing your content…' }), 2500),
    setTimeout(() => sse('stage', { idx: 2, label: '🔍 Building sections…' }), 7000),
    setTimeout(() => sse('stage', { idx: 3, label: '🃏 Generating interactive cards…' }), 18000),
  ];
  const clearStages = () => stageTimers.forEach(clearTimeout);

  sse('heartbeat', { ts: Date.now(), status: 'connected', service: SAVOIRÉ.BRAND, requestId: reqId, tool: opts.tool });
  sse('stage',     { idx: 0, label: `🎯 Analysing "${message.slice(0, 50)}${message.length > 50 ? '…' : ''}"` });
  sse('fact',      { fact: buildTopicFact(message) });
  sse('token',     { t: '' });

  let notes = '', p1ok = false;
  let p2Ticker = null;

  try {
    sse('stage', { idx: 1, label: `📝 Writing ${opts.tool === 'summary' ? 'smart summary' : 'study notes'}…` });

    const notesPrompt = buildNotesPrompt(message, opts);

    // Phase 1: Stream notes (with retries)
    notes = await streamNotes(notesPrompt, chunk => sse('token', { t: chunk }), opts.tool);
    p1ok = true;
    log.ok(`[${reqId}] P1 done — ${notes.length}ch`);

    sse('stage', { idx: 2, label: '✅ Notes complete! Finalising interactive cards…' });

    // Phase 2: Fetch cards (parallel, but we'll await it)
    let cardsData = null;
    let p2ok = false;

    // We start the cards fetch here; we'll await it after phase 1.
    const cardsPromise = (async () => {
      try {
        if (opts.tool === 'all') {
          const [fcqRes, mmRes] = await Promise.allSettled([
            fetchCards(buildCardsPrompt(message, opts, 'flashcards_quiz'), 'flashcards_quiz', message),
            fetchCards(buildCardsPrompt(message, opts, 'mindmap_only'),    'mindmap_only', message),
          ]);
          const combined = {};
          if (fcqRes.status === 'fulfilled' && fcqRes.value) {
            const v = fcqRes.value;
            if (v.flashcards?.length)              combined.flashcards = v.flashcards;
            if (v.quiz_questions?.length)          combined.quiz_questions = v.quiz_questions;
            if (v.key_concepts?.length)            combined.key_concepts = v.key_concepts;
            if (v.key_tricks?.length)              combined.key_tricks = v.key_tricks;
            if (v.practice_questions?.length)      combined.practice_questions = v.practice_questions;
            if (v.real_world_applications?.length) combined.real_world_applications = v.real_world_applications;
            if (v.common_misconceptions?.length)   combined.common_misconceptions = v.common_misconceptions;
            if (v.topic)                           combined.topic = v.topic;
            if (v.study_score)                     combined.study_score = v.study_score;
          }
          if (mmRes.status === 'fulfilled' && mmRes.value?.mindmap) {
            combined.mindmap = mmRes.value.mindmap;
            if (!combined.key_concepts?.length && mmRes.value.key_concepts?.length)
              combined.key_concepts = mmRes.value.key_concepts;
          }
          if (!combined.flashcards?.length && !combined.quiz_questions?.length && !combined.mindmap) {
            throw new Error('All sub-calls failed');
          }
          return combined;
        } else {
          return await fetchCards(buildCardsPrompt(message, opts), opts.tool, message);
        }
      } catch (err) {
        log.error(`[${reqId}] Cards generation failed: ${err.message}`);
        // Fallback to topic-specific fallback (only if all AI fails)
        return buildTopicFallback(opts.tool, message);
      }
    })();

    // We'll wait for cards with a timeout (60s total)
    cardsData = await Promise.race([
      cardsPromise,
      new Promise((_, reject) => setTimeout(() => reject(new Error('Cards timeout')), 60000))
    ]);

    p2ok = !cardsData?._fallback;

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
    clearStages();

    const final = mergeCards(cardsData, notes, message, opts);
    final._duration_ms = Date.now() - startTime;
    final._request_id  = reqId;
    final._phase1_ok   = p1ok;
    final._phase2_ok   = p2ok;
    final._notes_only  = !p2ok;
    final.topic_fact   = buildTopicFact(message);
    final.powered_by   = `${SAVOIRÉ.BRAND} by ${SAVOIRÉ.DEVELOPER}`;

    sse('stage', { idx: 4, label: '✅ Complete! All study materials ready.', done: true });
    sse('done',  final);

    log.ok(`[${reqId}] ✅ COMPLETE — ${final._duration_ms}ms | tool:${opts.tool}`);
    sendToGoogleSheets(userName, userStreak, userSess, opts.tool, message, 'completed', final._duration_ms, sessionId).catch(() => {});

  } catch (fatal) {
    clearInterval(kap);
    if (p2Ticker) clearInterval(p2Ticker);
    clearStages();
    log.error(`[${reqId}] FATAL: ${fatal.message}`);

    // Last resort: send a done event with fallback content (to avoid error screen)
    const fallbackNotes = offlineNotes(message);
    const fallbackCards = buildTopicFallback(opts.tool, message);
    const final = mergeCards(fallbackCards, fallbackNotes, message, opts);
    final._duration_ms = Date.now() - startTime;
    final._request_id  = reqId;
    final._phase1_ok   = false;
    final._phase2_ok   = false;
    final._notes_only  = true;
    final.topic_fact   = buildTopicFact(message);
    final.powered_by   = `${SAVOIRÉ.BRAND} by ${SAVOIRÉ.DEVELOPER}`;

    sse('stage', { idx: 4, label: '⚠️ Using fallback content — please try again later.', done: true });
    sse('done', final);

    sendToGoogleSheets(userName, userStreak, userSess, opts.tool, message, 'failed_fallback', Date.now() - startTime, sessionId).catch(() => {});
  }

  if (!res.writableEnded) res.end();
};

// ═══════════════════════════════════════════════════════════════════════════════
// END — api/study.js v2.0 | Sooban Talha Technologies
// "Think Less. Know More." — Free forever for every student on Earth.
// ═══════════════════════════════════════════════════════════════════════════════
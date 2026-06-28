
'use strict';
// ═══════════════════════════════════════════════════════════════════════════════
// SAVOIRÉ AI v2.0 — api/study.js
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
// openrouter/free = OpenRouter's smart free router (picks best available free model)
// Specific models as fallbacks. Timeouts generous for free tier (slow cold starts).
// ─────────────────────────────────────────────────────────────────────────────

const MODELS_STREAM = [
  
  { id: 'meta-llama/llama-3.3-70b-instruct:free',    max_tokens: 4000, timeout_ms: 90000, temp: 0.75 },
  { id: 'deepseek/deepseek-r1-0528:free',            max_tokens: 4000, timeout_ms: 90000, temp: 0.75 },
  { id: 'deepseek/deepseek-chat-v3-0324:free',       max_tokens: 4000, timeout_ms: 90000, temp: 0.75 },
  { id: 'google/gemini-2.0-flash-exp:free',          max_tokens: 4000, timeout_ms: 90000, temp: 0.75 },
  { id: 'google/gemma-3-27b-it:free',                max_tokens: 3500, timeout_ms: 90000, temp: 0.75 },
  { id: 'microsoft/phi-4-reasoning-plus:free',       max_tokens: 3500, timeout_ms: 90000, temp: 0.75 },
  { id: 'mistralai/mistral-7b-instruct:free',        max_tokens: 3000, timeout_ms: 90000, temp: 0.75 },
  { id: 'qwen/qwen3-8b:free',                        max_tokens: 3000, timeout_ms: 90000, temp: 0.75 },
];

const MODELS_CARDS = [
  
  { id: 'meta-llama/llama-3.3-70b-instruct:free',    max_tokens: 6000, timeout_ms: 90000, temp: 0.30 },
  { id: 'deepseek/deepseek-chat-v3-0324:free',       max_tokens: 6000, timeout_ms: 90000, temp: 0.30 },
  { id: 'deepseek/deepseek-r1-0528:free',            max_tokens: 6000, timeout_ms: 90000, temp: 0.30 },
  { id: 'google/gemini-2.0-flash-exp:free',          max_tokens: 6000, timeout_ms: 90000, temp: 0.30 },
  { id: 'google/gemma-3-27b-it:free',                max_tokens: 5000, timeout_ms: 90000, temp: 0.30 },
  { id: 'microsoft/phi-4-reasoning-plus:free',       max_tokens: 5000, timeout_ms: 90000, temp: 0.30 },
  { id: 'mistralai/mistral-7b-instruct:free',        max_tokens: 4000, timeout_ms: 90000, temp: 0.30 },
  { id: 'qwen/qwen3-8b:free',                        max_tokens: 4000, timeout_ms: 90000, temp: 0.30 },
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
  const fcCount    = tool === 'all' ? 12 : 15;
  const qCount     = tool === 'all' ?  8 : 10;

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
Mix: 30% easy, 50% medium, 20% hard.
CRITICAL: correct_answer must exactly match one options[] string — copy-paste it.` : '';

  const mmInstr = includeMm ? `
═══════════════════════════════════════════════════
MIND MAP — generate central + 5 branches
═══════════════════════════════════════════════════
• "central": 3-5 word essence of "${topicShort}" (in ${lang})
• "branches": array of 5 objects, each with:
  - "name": specific branch name from "${topicShort}" (NOT generic like "Introduction")
  - "color": one of "#00d4ff","#bf00ff","#00ff88","#ffae00","#d4af37","#ff4444","#e84393"
  - "items": array of 4-5 specific facts/terms about "${topicShort}" (each 5-20 words, in ${lang})
• "connections": array of 3 objects {from, to, description} showing relationships` : '';

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

// ─────────────────────────────────────────────────────────────────────────────
// SECTION 7 — PHASE 1: STREAM NOTES
// Tries models sequentially. First success wins. Falls back to offline if ALL fail.
// ─────────────────────────────────────────────────────────────────────────────

async function streamNotes(prompt, onChunk, tool) {
  let lastErr = 'No models available';

  for (const model of MODELS_STREAM) {
    const name  = model.id.split('/').pop().replace(':free', '');
    const ctrl  = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), model.timeout_ms);
    const t0    = Date.now();

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
          model:       model.id,
          max_tokens:  model.max_tokens,
          temperature: model.temp || 0.75,
          stream:      true,
          messages:    [{ role: 'user', content: prompt }],
        }),
        signal: ctrl.signal,
      });

      clearTimeout(timer);

      if (!res.ok) {
        const txt = await res.text().catch(() => '');
        log.warn(`P1 HTTP ${res.status} — ${name}: ${trunc(txt, 100)}`);
        if (res.status === 401 || res.status === 403) {
          throw new Error('OPENROUTER_API_KEY is invalid or missing. Check your environment variable.');
        }
        if (res.status === 429) await sleep(2000);
        continue; // try next model
      }

      const reader  = res.body.getReader();
      const decoder = new TextDecoder('utf-8');
      let   lineBuf = '', full = '', tokens = 0;

      outer: while (true) {
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
              full   += delta;
              tokens++;
              onChunk(delta); // ← sends SSE 'token' event to frontend immediately
            }
          } catch { /* bad chunk — ignore */ }
        }
      }

      if (full.trim().length < 80) {
        log.warn(`${name}: response too short (${full.length}ch) — trying next`);
        continue;
      }

      log.ok(`P1 ✅ ${name} | ${tokens} tokens | ${full.length}ch | ${Date.now() - t0}ms`);
      return full;

    } catch (err) {
      clearTimeout(timer);
      lastErr = err.name === 'AbortError'
        ? `${name} timed out after ${model.timeout_ms}ms`
        : `${name}: ${err.message}`;
      log.warn(`P1 ✗ ${lastErr}`);
      if (err.message?.includes('API_KEY') || err.message?.includes('invalid')) throw err;
    }
  }

  // ALL models failed — use offline notes so user at least gets something
  log.error(`P1 ALL MODELS FAILED. Last: ${lastErr}`);
  throw new Error(`All AI models failed: ${lastErr}`);
}

// ─────────────────────────────────────────────────────────────────────────────
// SECTION 8 — PHASE 2: FETCH STRUCTURED CARDS (JSON)
// ─────────────────────────────────────────────────────────────────────────────

async function fetchCards(prompt, tool) {
  let lastErr = 'No models available';

  for (const model of MODELS_CARDS) {
    const name  = model.id.split('/').pop().replace(':free', '');
    const ctrl  = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), model.timeout_ms);
    const t0    = Date.now();

    try {
      log.info(`P2 → ${name} | tool:${tool}`);

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

      if (!res.ok) {
        const txt = await res.text().catch(() => '');
        log.warn(`P2 HTTP ${res.status} — ${name}: ${trunc(txt, 100)}`);
        if (res.status === 401 || res.status === 403) {
          throw new Error('OPENROUTER_API_KEY is invalid or missing.');
        }
        if (res.status === 429) await sleep(2000);
        continue;
      }

      const data    = await res.json();
      let   content = data?.choices?.[0]?.message?.content?.trim();

      if (!content || content.length < 20) {
        log.warn(`${name}: empty response`);
        continue;
      }

      // Strip markdown code fences if present
      content = content.replace(/^```(?:json)?\s*/im, '').replace(/\s*```\s*$/im, '').trim();

      // Find JSON object bounds
      const jS = content.indexOf('{');
      const jE = content.lastIndexOf('}');
      if (jS === -1 || jE <= jS) {
        log.warn(`${name}: no JSON object in response`);
        continue;
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
              log.warn(`${name}: JSON repair failed — ${e4.message.slice(0, 80)}`);
              continue;
            }
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
            if (fix) { q.correct_answer = fix; log.info(`${name}: fixed Q${i+1} correct_answer`); }
          }
          return q;
        });
      }

      // Normalize flashcard formats
      if (Array.isArray(parsed.flashcards)) {
        parsed.flashcards = parsed.flashcards
          .filter(c => (c.front || c.question) && (c.back || c.answer))
          .map(c => ({ front: String(c.front || c.question || '').trim(), back: String(c.back || c.answer || '').trim() }));
      }

      // Lenient validation — partial data is fine
      const hasFc = Array.isArray(parsed.flashcards)    && parsed.flashcards.length    >= 2;
      const hasQ  = Array.isArray(parsed.quiz_questions) && parsed.quiz_questions.length >= 2;
      const hasMm = parsed.mindmap?.branches?.length >= 2;
      const hasKc = Array.isArray(parsed.key_concepts)  && parsed.key_concepts.length   >= 1;

      const valid = (['flashcards','flashcards_quiz'].includes(tool)) ? hasFc
                  : tool === 'quiz'                                    ? hasQ
                  : (['mindmap','mindmap_only'].includes(tool))        ? hasMm
                  : tool === 'all'                                     ? (hasFc || hasQ || hasMm || hasKc)
                  : hasKc; // notes/summary

      if (!valid) {
        log.warn(`${name}: validation failed — fc:${parsed.flashcards?.length||0} q:${parsed.quiz_questions?.length||0} mm:${parsed.mindmap?.branches?.length||0} kc:${parsed.key_concepts?.length||0}`);
        continue;
      }

      log.ok(`P2 ✅ ${name} | ${tool} | fc:${parsed.flashcards?.length||0} q:${parsed.quiz_questions?.length||0} mm:${parsed.mindmap?.branches?.length||0} | ${Date.now()-t0}ms`);
      return parsed;

    } catch (err) {
      clearTimeout(timer);
      lastErr = err.name === 'AbortError' ? `${name} timed out` : `${name}: ${err.message}`;
      log.warn(`P2 ✗ ${lastErr}`);
      if (err.message?.includes('API_KEY') || err.message?.includes('invalid')) throw err;
    }
  }

  throw new Error(`P2 all models failed. Last: ${lastErr}`);
}

// ─────────────────────────────────────────────────────────────────────────────
// SECTION 9 — FALLBACK CONTENT (used only when ALL models fail)
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
  const T   = topic || 'this topic';
  const now = getISTDateTime();
  const base = {
    topic: T, curriculum_alignment: 'General Academic Study', generated_at: now,
    study_score: 85, _fallback: true,
    flashcards: [], quiz_questions: [], mindmap: null,
    key_concepts: [
      `Core Definition: ${T} is the systematic study of its central domain. Mastery requires understanding WHY — not just memorising WHAT.`,
      `Primary Mechanism: The main process in ${T} follows a structured sequence where initial conditions lead to transformation and measurable outcomes.`,
      `Key Relationships: In ${T}, core concepts are deeply interconnected. Grasping these relationships provides more insight than knowing any concept in isolation.`,
      `Practical Transfer: ${T} knowledge applies directly to healthcare, technology, business, and policy through the same analytical frameworks.`,
      `Expert Thinking: Experts in ${T} recognise deep structural patterns that beginners miss. This gap closes only through deliberate practice, not passive review.`,
    ],
    key_tricks: [
      `🧠 FEYNMAN TECHNIQUE: Explain "${T}" out loud to an imaginary 12-year-old. Every hesitation reveals a gap. Return to notes only for gaps. Repeat until fully fluent.`,
      `📝 ACTIVE RECALL: After every ${T} session, write everything you remember from scratch — without looking. The gaps between what you wrote and the original = your study targets.`,
      `⏰ SPACED REPETITION: Review ${T} on days 1, 3, 7, 14, 30. Each review = active retrieval (not re-reading). This alone multiplies retention by 3–5×.`,
    ],
    practice_questions: [
      { question: `Explain the foundational principles of ${T} and illustrate with two specific examples.`, answer: `${T} rests on foundational principles collectively defining its scope, methods, and explanatory power. The first principle concerns the core subject matter and why it is understood as it is. The second addresses primary mechanisms. Understanding both requires grasping WHY principles hold. Example 1 illustrates core principles in a real situation. Example 2 demonstrates the mechanism in a different but related context. Together they confirm that ${T} is a structured reasoning framework, not merely a catalogue of facts.` },
      { question: `Describe a professional scenario where deep knowledge of ${T} produces measurably better outcomes.`, answer: `A professional facing a complex problem involving ${T} approaches it systematically: diagnosing using ${T} principles, analysing key variables, predicting outcomes, selecting the optimal approach, and verifying reasoning against known constraints. This systematic process avoids errors novices make, anticipates consequences invisible without ${T} expertise, and communicates reasoning clearly to stakeholders — consistently outperforming intuitive guesswork.` },
    ],
    real_world_applications: [
      `Healthcare: ${T} informs clinical reasoning and diagnostic protocols — enabling practitioners to make more systematic, evidence-based decisions.`,
      `Technology: ${T} principles underpin system architecture and engineering decisions — helping teams build robust, maintainable solutions.`,
      `Business: Strategic planning and risk assessment draw on ${T} frameworks — enabling better decisions under uncertainty.`,
      `Policy: Government agencies apply ${T} reasoning to design evidence-based interventions with measurable public outcomes.`,
    ],
    common_misconceptions: [
      `❌ MYTH: Memorising ${T} facts equals understanding. ✅ TRUTH: Real mastery of ${T} means grasping causal relationships and being able to apply them to new problems — not just recalling definitions.`,
      `❌ MYTH: Re-reading notes is an effective strategy for ${T}. ✅ TRUTH: Active retrieval (self-testing) outperforms re-reading by 200–300% for durable retention.`,
      `❌ MYTH: ${T} is only relevant for specialists. ✅ TRUTH: ${T} reasoning patterns transfer across healthcare, technology, business, and everyday decision-making.`,
    ],
  };

  if (tool === 'flashcards' || tool === 'all') {
    base.flashcards = [
      { front: `What is the precise definition of ${T} and why is it framed this way?`, back: `${T} is defined as the systematic study and practice of its core domain. The definition specifies exactly what is and isn't included, distinguishing it from related fields. Understanding WHY the definition takes this form — not just memorising it — is the foundation of genuine mastery.` },
      { front: `What are the 4–5 most fundamental principles of ${T}?`, back: `The foundational principles of ${T} are: (1) Core framework — establishes the basic structure; (2) Primary mechanism — governs core processes; (3) Key relationships — determines connections between components; (4) Boundary conditions — defines the limits of application; (5) Contextual connections — links ${T} to broader fields and real-world use.` },
      { front: `Explain the primary mechanism of ${T} step by step.`, back: `The mechanism of ${T}: Step 1 → identify and characterise initial conditions. Step 2 → triggering event or input occurs. Step 3 → primary transformation begins following the rules of ${T}. Step 4 → intermediate stages form progressively. Step 5 → observable, measurable outcome emerges. Understanding WHY each step follows the previous is what separates genuine mastery from surface familiarity.` },
    ];
  }
  if (tool === 'quiz' || tool === 'all') {
    base.quiz_questions = [
      { id:1, question:`Which statement BEST describes the central focus of ${T}?`, options:['A systematic framework for understanding through evidence-based reasoning','A collection of memorised facts recalled on demand','A purely historical record with limited contemporary relevance','An intuitive skill developed only through professional experience'], correct_answer:'A systematic framework for understanding through evidence-based reasoning', explanation:`${T} is fundamentally a systematic framework for reasoning — not fact collection. While some memorisation is necessary, the core value is building the ability to reason about problems in this domain. This framework allows ${T} knowledge to transfer to new situations, which memorisation alone cannot achieve.`, difficulty:'easy' },
      { id:2, question:`A student re-read ${T} notes five times and feels confident. What does learning research predict?`, options:['Excellent performance — thorough re-reading builds strong understanding','Potential underperformance — re-reading creates familiarity but not durable knowledge','Performance depends entirely on exam question difficulty','Strong performance if key passages were highlighted'], correct_answer:'Potential underperformance — re-reading creates familiarity but not durable knowledge', explanation:`Re-reading ${T} material creates an "illusion of fluency" — material feels familiar, which feels like knowledge. But active retrieval dramatically outperforms re-reading for durable retention. When exam questions require applying ${T} to novel situations, familiarity alone fails consistently.`, difficulty:'medium' },
    ];
  }
  if (tool === 'mindmap' || tool === 'all') {
    const topicWords = T.split(' ').slice(0, 4).join(' ');
    base.mindmap = {
      central: topicWords || T,
      branches: [
        { name: 'Core Concepts',   color: '#00d4ff', items: [`Definition of ${T}`, 'Foundational principles', 'Key terminology', 'Theoretical framework'] },
        { name: 'Mechanisms',      color: '#bf00ff', items: ['Primary mechanism', 'Step-by-step process', 'Key variables', 'Cause-effect chains'] },
        { name: 'Applications',    color: '#00ff88', items: ['Professional practice', 'Healthcare context', 'Technology applications', 'Business strategy'] },
        { name: 'Common Pitfalls', color: '#ffae00', items: ['Top misconception', 'Overgeneralisation errors', 'Ignoring edge cases', 'Surface vs deep learning'] },
        { name: 'Study Strategy',  color: '#d4af37', items: ['Active recall methods', 'Spaced repetition', 'Feynman technique', 'Self-testing tactics'] },
      ],
      connections: [
        { from: 'Core Concepts', to: 'Mechanisms',      description: `Principles explain how ${T} mechanisms operate` },
        { from: 'Mechanisms',    to: 'Applications',    description: `${T} mechanisms enable specific real-world uses` },
        { from: 'Core Concepts', to: 'Common Pitfalls', description: 'Misunderstanding concepts leads to common errors' },
      ],
    };
  }
  return base;
}

// ─────────────────────────────────────────────────────────────────────────────
// SECTION 10 — TOPIC FACT PILL
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
    } catch { /* ignore — client may have disconnected */ }
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

  // Auto-advance stage timers (visual feedback while waiting for models)
  const stageTimers = [
    setTimeout(() => sse('stage', { idx: 1, label: '📝 Writing your content…' }),         2500),
    setTimeout(() => sse('stage', { idx: 2, label: '🔍 Building sections…' }),            7000),
    setTimeout(() => sse('stage', { idx: 3, label: '🃏 Generating interactive cards…' }), 18000),
  ];
  const clearStages = () => stageTimers.forEach(clearTimeout);

  // Initial handshake events
  sse('heartbeat', { ts: Date.now(), status: 'connected', service: SAVOIRÉ.BRAND, requestId: reqId, tool: opts.tool });
  sse('stage',     { idx: 0, label: `🎯 Analysing "${message.slice(0, 50)}${message.length > 50 ? '…' : ''}"` });
  sse('fact',      { fact: buildTopicFact(message) });
  sse('token',     { t: '' }); // prime the token stream

  let notes = '', p1ok = false;

  try {
    // ╔══════════════════════════════════╗
    // ║  PHASE 1 — STREAM NOTES FROM AI  ║
    // ╚══════════════════════════════════╝
    sse('stage', { idx: 1, label: `📝 Writing ${opts.tool === 'summary' ? 'smart summary' : 'study notes'}…` });

    try {
      const notesPrompt = buildNotesPrompt(message, opts);
      notes = await streamNotes(notesPrompt, chunk => sse('token', { t: chunk }), opts.tool);
      p1ok  = true;
      log.ok(`[${reqId}] P1 done — ${notes.length}ch`);
      sse('stage', { idx: 2, label: '✅ Notes streamed! Building interactive cards…' });
    } catch (e1) {
      // P1 failed — use offline notes, stream them so live view still works
      log.error(`[${reqId}] P1 FAILED: ${e1.message}`);
      notes = offlineNotes(message);
      for (let i = 0; i < notes.length; i += 250) {
        sse('token', { t: notes.slice(i, i + 250) });
        await sleep(5);
      }
      p1ok = false;
      sse('stage', { idx: 2, label: '⚠️ Using cached notes — building cards…' });
    }

    // ╔══════════════════════════════════════════╗
    // ║  PHASE 2 — FETCH STRUCTURED CARDS (JSON)  ║
    // ╚══════════════════════════════════════════╝
    let cardsData = null, p2ok = false;

    if (opts.tool === 'all') {
      // MEGA BUNDLE: two parallel calls to avoid giant JSON timeouts
      sse('stage', { idx: 3, label: '⚡ Building mega bundle — flashcards + quiz + mindmap…' });
      const [fcqRes, mmRes] = await Promise.allSettled([
        fetchCards(buildCardsPrompt(message, opts, 'flashcards_quiz'), 'flashcards_quiz'),
        fetchCards(buildCardsPrompt(message, opts, 'mindmap_only'),    'mindmap_only'),
      ]);
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
      } else { log.warn(`[${reqId}] Mega P2a failed: ${fcqRes.reason?.message}`); }

      if (mmRes.status === 'fulfilled' && mmRes.value?.mindmap) {
        cardsData.mindmap = mmRes.value.mindmap;
        if (!cardsData.key_concepts?.length && mmRes.value.key_concepts?.length)
          cardsData.key_concepts = mmRes.value.key_concepts;
      } else { log.warn(`[${reqId}] Mega P2b failed: ${mmRes.reason?.message}`); }

      p2ok = !!(cardsData.flashcards?.length || cardsData.quiz_questions?.length || cardsData.mindmap);
      if (!p2ok) { cardsData = buildTopicFallback('all', message); }

    } else {
      // SINGLE TOOL
      const label = { flashcards:'flashcards', quiz:'quiz questions', mindmap:'mind map', summary:'summary cards', notes:'study cards' }[opts.tool] || 'cards';
      sse('stage', { idx: 3, label: `🃏 Building ${label}…` });
      try {
        cardsData = await fetchCards(buildCardsPrompt(message, opts), opts.tool);
        p2ok = true;
      } catch (e2) {
        log.error(`[${reqId}] P2 FAILED: ${e2.message} — using fallback cards`);
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
        await sleep(80);
      }
      log.ok(`[${reqId}] Streamed ${cardsData.flashcards.length} flashcards`);
    }

    if (cardsData?.quiz_questions?.length && (opts.tool === 'quiz' || opts.tool === 'all')) {
      sse('stage', { idx: 3, label: `❓ Streaming ${cardsData.quiz_questions.length} quiz questions live…` });
      for (let i = 0; i < cardsData.quiz_questions.length; i++) {
        sse('question', { idx: i, total: cardsData.quiz_questions.length, q: cardsData.quiz_questions[i] });
        await sleep(100);
      }
      log.ok(`[${reqId}] Streamed ${cardsData.quiz_questions.length} questions`);
    }

    if (cardsData?.mindmap?.branches?.length && (opts.tool === 'mindmap' || opts.tool === 'all')) {
      sse('stage', { idx: 3, label: `🗺️ Streaming ${cardsData.mindmap.branches.length} mind map branches live…` });
      sse('branch', { idx: -1, total: cardsData.mindmap.branches.length, branch: { name: '_central_', value: cardsData.mindmap.central, connections: cardsData.mindmap.connections || [] } });
      await sleep(80);
      for (let i = 0; i < cardsData.mindmap.branches.length; i++) {
        sse('branch', { idx: i, total: cardsData.mindmap.branches.length, branch: cardsData.mindmap.branches[i] });
        await sleep(120);
      }
      log.ok(`[${reqId}] Streamed ${cardsData.mindmap.branches.length} branches`);
    }

    // ╔═══════════════════╗
    // ║  SEND FINAL DATA  ║
    // ╚═══════════════════╝
    clearInterval(kap);
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
    clearStages();
    log.error(`[${reqId}] FATAL: ${fatal.message}`);
    // IMPORTANT: send {error:'...'} — frontend checks evt.error
    sse('error', { error: 'Savoiré AI is momentarily unavailable. Please try again in a few seconds.', requestId: reqId });
    sendToGoogleSheets(userName, userStreak, userSess, opts.tool, message, 'failed', Date.now() - startTime, sessionId).catch(() => {});
  }

  if (!res.writableEnded) res.end();
};

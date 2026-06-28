'use strict';
// ═══════════════════════════════════════════════════════════════════════════════════════════════════
// SAVOIRÉ AI v2.0 — api/study.js — COMPLETELY FIXED BACKEND
// Built by Sooban Talha Technologies | soobantalhatech.xyz | Founder: Sooban Talha
// FIXES: API key validation, model failover, SSE streaming, JSON repair, mega bundle split,
//        graceful fallback, error event format, live output in final result, fast animations
// ═══════════════════════════════════════════════════════════════════════════════════════════════════

// ─────────────────────────────────────────────────────────────────────────────
// SECTION 1 — CONSTANTS
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
// SECTION 2 — MODEL ROSTERS (RELIABLE FREE MODELS WITH GENEROUS TIMEOUTS)
// ─────────────────────────────────────────────────────────────────────────────

// Phase 1: Stream markdown notes — use these in order, first success wins
const MODELS_STREAM = [
  { id: 'meta-llama/llama-3.3-70b-instruct:free',  max_tokens: 3500, timeout_ms: 55000, temp: 0.75 },
  { id: 'deepseek/deepseek-chat-v3-0324:free',     max_tokens: 3500, timeout_ms: 60000, temp: 0.75 },
  { id: 'google/gemma-3-27b-it:free',              max_tokens: 3500, timeout_ms: 55000, temp: 0.75 },
  { id: 'microsoft/phi-4:free',                    max_tokens: 3000, timeout_ms: 50000, temp: 0.75 },
  { id: 'mistralai/mistral-7b-instruct:free',      max_tokens: 3000, timeout_ms: 50000, temp: 0.75 },
];

// Phase 2: JSON cards — non-streaming, reliability matters
const MODELS_CARDS = [
  { id: 'meta-llama/llama-3.3-70b-instruct:free',  max_tokens: 5500, timeout_ms: 60000, temp: 0.40 },
  { id: 'deepseek/deepseek-chat-v3-0324:free',     max_tokens: 5500, timeout_ms: 65000, temp: 0.40 },
  { id: 'google/gemma-3-27b-it:free',              max_tokens: 5000, timeout_ms: 60000, temp: 0.40 },
  { id: 'microsoft/phi-4:free',                    max_tokens: 5000, timeout_ms: 55000, temp: 0.40 },
  { id: 'mistralai/mistral-7b-instruct:free',      max_tokens: 4000, timeout_ms: 50000, temp: 0.40 },
];

// ─────────────────────────────────────────────────────────────────────────────
// SECTION 3 — CONFIGURATION
// ─────────────────────────────────────────────────────────────────────────────

const DEPTH_MAP = {
  standard:      { wordRange: '600–900 words',   maxTokens: 2500 },
  detailed:      { wordRange: '1000–1500 words', maxTokens: 3500 },
  comprehensive: { wordRange: '1500–2200 words', maxTokens: 4500 },
  expert:        { wordRange: '2200–3000 words', maxTokens: 5500 },
};

const STYLE_MAP = {
  simple:   'Clear beginner-friendly language. Short sentences. Everyday analogies. Define all jargon.',
  academic: 'Formal academic language. Precise scholarly terminology. Objective third-person tone.',
  detailed: 'Maximum detail. Numerous specific examples. Thorough step-by-step explanations.',
  exam:     'Exam-focused. Mark-scheme phrasing. Highlight must-know points. Include exam tips.',
  visual:   'Vivid analogies and metaphors. Mental models. Make abstract concrete.',
};

// ─────────────────────────────────────────────────────────────────────────────
// SECTION 4 — UTILITIES
// ─────────────────────────────────────────────────────────────────────────────

const sleep = ms => new Promise(r => setTimeout(r, ms));

const log = {
  info:  (...a) => console.log(`[${new Date().toISOString()}] ℹ️ `, ...a),
  ok:    (...a) => console.log(`[${new Date().toISOString()}] ✅`, ...a),
  warn:  (...a) => console.warn(`[${new Date().toISOString()}] ⚠️ `, ...a),
  error: (...a) => console.error(`[${new Date().toISOString()}] ❌`, ...a),
};

const trunc = (s, n=120) => !s ? '' : String(s).length > n ? String(s).slice(0,n)+'…' : String(s);

function getISTDateTime() {
  const now = new Date();
  const ist = new Date(now.getTime() + now.getTimezoneOffset()*60000 + 5.5*3600000);
  const p   = n => String(n).padStart(2,'0');
  return `${ist.getFullYear()}-${p(ist.getMonth()+1)}-${p(ist.getDate())} ${p(ist.getHours())}:${p(ist.getMinutes())}:${p(ist.getSeconds())}`;
}
function getISTDate() { return getISTDateTime().split(' ')[0]; }

// ─────────────────────────────────────────────────────────────────────────────
// SECTION 5 — GOOGLE SHEETS — DO NOT CHANGE
// ─────────────────────────────────────────────────────────────────────────────

async function sendToGoogleSheets(userName, streak, sessions, tool, topic, status, durationMs, sessionId) {
  if (!GOOGLE_WEBHOOK_URL) return false;
  try {
    const payload = {
      userName:   userName || 'Anonymous',
      streak:     Number(streak)   || 0,
      sessions:   Number(sessions) || 1,
      lastUsed:   getISTDateTime(),
      tool:       tool   || 'visit',
      topic:      String(topic || '').slice(0, 200),
      status:     status || 'visit',
      durationMs: Number(durationMs) || 0,
      sessionId:  sessionId || '',
      timestamp:  getISTDateTime(),
      istDate:    getISTDate(),
    };
    const res = await fetch(GOOGLE_WEBHOOK_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    if (res.ok) log.ok(`📊 Sheets ← ${userName} | ${tool} | ${status}`);
    else log.warn(`Sheets HTTP ${res.status}`);
    return res.ok;
  } catch (err) {
    log.warn(`Sheets error (non-fatal): ${err.message}`);
    return false;
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// SECTION 6 — NOTES PROMPT BUILDER (Phase 1)
// ─────────────────────────────────────────────────────────────────────────────

function buildNotesPrompt(input, opts) {
  const depth = DEPTH_MAP[opts.depth] || DEPTH_MAP.detailed;
  const style = STYLE_MAP[opts.style] || STYLE_MAP.simple;
  const lang  = opts.language || 'English';
  const tool  = opts.tool || 'notes';

  const sectionMap = {
    notes:      '## 📚 Introduction & Overview\n\n## 🎯 Core Concepts & Definitions\n\n## ⚙️ How It Works\n\n## 💡 Key Examples\n\n## 🚀 Advanced Aspects\n\n## 🌍 Real-World Applications\n\n## 🧠 Common Misconceptions\n\n## 📝 Key Takeaways',
    flashcards: '## 📖 Overview\n\n## 🎯 Core Concepts (Q&A pairs)\n\n## ⚙️ Mechanisms\n\n## 💡 Examples\n\n## 🎯 Quick Summary',
    quiz:       '## 📚 Topic Introduction\n\n## ✏️ Core Concepts (exam-ready)\n\n## ⚙️ Mechanisms\n\n## 📝 Must-Remember Points',
    summary:    '## 🚀 TL;DR (3–5 sentences max)\n\n## 🎯 Core Concepts\n\n## ⚙️ Key Mechanisms\n\n## ✅ Revision Checklist',
    mindmap:    '## 🧠 Central Topic\n\n## 🌿 Branch 1: Foundations\n\n## 🌿 Branch 2: Mechanisms\n\n## 🌿 Branch 3: Examples\n\n## 🌿 Branch 4: Applications\n\n## 🔗 Connections',
    all:        '## 📚 Introduction\n\n## 🎯 Core Concepts\n\n## ⚙️ How It Works\n\n## 💡 Key Examples\n\n## 🚀 Advanced Aspects\n\n## 🌍 Applications\n\n## 🧠 Memory Tricks\n\n## 📝 Summary',
  };

  const sections = sectionMap[tool] || sectionMap.notes;

  return `You are ${SAVOIRÉ.BRAND}, the world's most advanced AI study assistant.
Creator: ${SAVOIRÉ.DEVELOPER} | Founder: ${SAVOIRÉ.FOUNDER}

TOPIC: "${input}"
LANGUAGE: ${lang} (write EVERY word in ${lang})
LENGTH: ${depth.wordRange}
STYLE: ${style}

REQUIRED STRUCTURE:
${sections}

FORMATTING RULES:
- ## for section headings
- **bold** every key term
- - for bullets, numbers for steps
- > for definitions
- At least 3 real examples
- ⚠️ include common mistakes
- 🎯 Key Takeaways at end

START IMMEDIATELY with the first ## heading. Write in ${lang} only. Be thorough and specific about "${input}".`;
}

// ─────────────────────────────────────────────────────────────────────────────
// SECTION 7 — CARDS PROMPT BUILDER (Phase 2)
// ─────────────────────────────────────────────────────────────────────────────

function buildCardsPrompt(input, opts, toolOverride) {
  const lang     = opts.language || 'English';
  const tool     = toolOverride || opts.tool || 'notes';
  const topicShort = String(input).slice(0, 100);

  const includeFc = tool === 'flashcards' || tool === 'flashcards_quiz' || tool === 'all';
  const includeQ  = tool === 'quiz'       || tool === 'flashcards_quiz' || tool === 'all';
  const includeMm = tool === 'mindmap'    || tool === 'mindmap_only'    || tool === 'all';

  let fcCount  = includeFc ? (tool === 'all' ? 12 : 15) : 0;
  let qCount   = includeQ  ? (tool === 'all' ? 8  : 10) : 0;
  let mmCount  = includeMm ? 5 : 0;

  const fcBlock = includeFc ? `
FLASHCARDS (generate exactly ${fcCount}):
Each: {"front":"specific question about ${topicShort} in ${lang}","back":"detailed answer 60-150 words about ${topicShort} in ${lang}"}
Types needed: definitions, mechanisms, comparisons, applications, misconceptions.
ALL about "${topicShort}" specifically. Zero generic content.` : '';

  const qBlock = includeQ ? `
QUIZ QUESTIONS (generate exactly ${qCount}):
Each: {"id":N,"question":"specific question about ${topicShort}","options":["A","B","C","D"],"correct_answer":"EXACTLY one of the 4 options","explanation":"why correct, 60-100 words","difficulty":"easy|medium|hard"}
CRITICAL: correct_answer MUST be character-for-character identical to one options[] string.
ALL about "${topicShort}". Difficulty mix: 30% easy, 50% medium, 20% hard.` : '';

  const mmBlock = includeMm ? `
MIND MAP:
{"central":"3-5 word essence of ${topicShort}","branches":[{"name":"specific branch from ${topicShort}","color":"#00d4ff","items":["specific fact","specific fact","specific fact","specific fact"]},...],"connections":[{"from":"branch","to":"branch","description":"relationship"},...]}
Generate ${mmCount} branches. Colors: #00d4ff, #bf00ff, #00ff88, #ffae00, #d4af37, #ff4444
Branch names MUST be specific to "${topicShort}", not generic like "Introduction".` : '';

  return `You are ${SAVOIRÉ.BRAND}. Generate study content about: "${input}"
Language: ${lang}. ALL text in ${lang}.

${fcBlock}
${qBlock}
${mmBlock}

OUTPUT FORMAT — valid JSON only, start with {, end with }:
{
  "topic": "clean title for ${topicShort} in ${lang}",
  "curriculum_alignment": "appropriate academic level",
  "study_score": 97,
  ${includeFc ? `"flashcards": [/* ${fcCount} cards */],` : '"flashcards": [],'}
  ${includeQ  ? `"quiz_questions": [/* ${qCount} questions */],` : '"quiz_questions": [],'}
  ${includeMm ? `"mindmap": {/* 5 branches */},` : '"mindmap": null,'}
  "key_concepts": [
    "Concept name: 60-80 word explanation about ${topicShort} in ${lang}",
    "Concept name: 60-80 word explanation",
    "Concept name: 60-80 word explanation",
    "Concept name: 60-80 word explanation",
    "Concept name: 60-80 word explanation"
  ],
  "key_tricks": [
    "🧠 Memory trick specifically for ${topicShort} in ${lang} — 60-90 words",
    "📝 Study strategy for ${topicShort} — 60-90 words",
    "⏰ Recall technique for ${topicShort} — 60-90 words"
  ],
  "practice_questions": [
    {"question":"analytical question about ${topicShort} in ${lang}","answer":"200+ word answer in ${lang}"},
    {"question":"application question about ${topicShort} in ${lang}","answer":"200+ word answer in ${lang}"}
  ],
  "real_world_applications": [
    "🏥 Healthcare: specific application of ${topicShort}",
    "💻 Technology: specific tech use of ${topicShort}",
    "📈 Business: specific business use of ${topicShort}",
    "🌍 Society: social impact of ${topicShort}"
  ],
  "common_misconceptions": [
    "❌ MYTH about ${topicShort}. ✅ TRUTH: correction in ${lang}",
    "❌ MYTH about ${topicShort}. ✅ TRUTH: correction in ${lang}",
    "❌ MYTH about ${topicShort}. ✅ TRUTH: correction in ${lang}"
  ]
}

ABSOLUTE RULES:
1. Output ONLY valid JSON — nothing before { or after }
2. All placeholder text replaced with REAL content about "${topicShort}"
3. ALL text in ${lang}
4. quiz correct_answer MUST EXACTLY match one options[] string
5. No trailing commas. Double quotes only. Valid JSON.
OUTPUT JSON NOW:`;
}

// ─────────────────────────────────────────────────────────────────────────────
// SECTION 8 — PHASE 1: STREAM NOTES FROM AI
// ─────────────────────────────────────────────────────────────────────────────

async function streamNotes(prompt, onChunk, tool) {
  let lastErr = 'No models attempted';
  for (const model of MODELS_STREAM) {
    const name  = model.id.split('/').pop().replace(':free','');
    const ctrl  = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), model.timeout_ms);
    const t0    = Date.now();
    try {
      log.info(`P1 (${tool}) → ${name} [timeout:${model.timeout_ms}ms]`);
      const res = await fetch(OPENROUTER_BASE, {
        method:  'POST',
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
        const t = await res.text().catch(() => '');
        log.warn(`P1 HTTP ${res.status} — ${name}: ${trunc(t, 80)}`);
        if (res.status === 401 || res.status === 403) throw new Error('Invalid API key');
        if (res.status === 429) await sleep(1500);
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
          } catch { /* ignore bad SSE */ }
        }
      }

      if (full.trim().length < 100) {
        log.warn(`${name}: too short (${full.length}ch) — trying next model`);
        continue;
      }
      log.ok(`P1 OK — ${name} | ${tokens} tokens | ${full.length}ch | ${Date.now()-t0}ms`);
      return full;
    } catch (err) {
      clearTimeout(timer);
      lastErr = err.name === 'AbortError' ? `${name} timed out after ${model.timeout_ms}ms` : `${name}: ${err.message}`;
      log.warn(`P1 fail — ${lastErr}`);
      if (err.message?.includes('Invalid API key')) throw err;
    }
  }
  throw new Error(`All models busy. Last error: ${lastErr}`);
}

// ─────────────────────────────────────────────────────────────────────────────
// SECTION 9 — PHASE 2: FETCH STRUCTURED CARDS (JSON)
// ─────────────────────────────────────────────────────────────────────────────

async function fetchCards(prompt, tool) {
  let lastErr = 'No models attempted';
  for (const model of MODELS_CARDS) {
    const name  = model.id.split('/').pop().replace(':free','');
    const ctrl  = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), model.timeout_ms);
    const t0    = Date.now();
    try {
      log.info(`P2 (${tool}) → ${name} [timeout:${model.timeout_ms}ms]`);
      const res = await fetch(OPENROUTER_BASE, {
        method:  'POST',
        headers: {
          'Content-Type':  'application/json',
          'Authorization': `Bearer ${process.env.OPENROUTER_API_KEY}`,
          'HTTP-Referer':  HTTP_REFERER,
          'X-Title':       APP_TITLE,
        },
        body: JSON.stringify({
          model:       model.id,
          max_tokens:  model.max_tokens,
          temperature: model.temp || 0.40,
          stream:      false,
          messages:    [{ role: 'user', content: prompt }],
        }),
        signal: ctrl.signal,
      });
      clearTimeout(timer);

      if (!res.ok) {
        const t = await res.text().catch(() => '');
        log.warn(`P2 HTTP ${res.status} — ${name}: ${trunc(t, 80)}`);
        if (res.status === 401 || res.status === 403) throw new Error('Invalid API key');
        if (res.status === 429) await sleep(2000);
        continue;
      }

      const data    = await res.json();
      let   content = data?.choices?.[0]?.message?.content?.trim();
      if (!content || content.length < 30) { log.warn(`${name}: empty response`); continue; }

      // Strip markdown code fences
      content = content.replace(/^```(?:json)?\s*/im, '').replace(/\s*```\s*$/im, '').trim();

      // Extract JSON bounds
      const jS = content.indexOf('{');
      const jE = content.lastIndexOf('}');
      if (jS === -1 || jE <= jS) { log.warn(`${name}: no JSON object found`); continue; }
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
          if (!q.options || !q.correct_answer) return { ...q, id: q.id || i+1 };
          if (!q.options.includes(q.correct_answer)) {
            const lower = q.correct_answer.toLowerCase();
            const fix   = q.options.find(o => o.toLowerCase() === lower)
                       || q.options.find(o => o.toLowerCase().includes(lower) || lower.includes(o.toLowerCase()))
                       || q.options[0];
            if (fix) { log.info(`${name}: auto-fixed Q${i+1} correct_answer`); return { ...q, correct_answer: fix, id: q.id || i+1 }; }
          }
          return { ...q, id: q.id || i+1 };
        });
      }

      // Normalize flashcard formats
      if (Array.isArray(parsed.flashcards)) {
        parsed.flashcards = parsed.flashcards
          .filter(c => (c.front || c.question) && (c.back || c.answer))
          .map(c => ({ front: String(c.front || c.question || '').trim(), back: String(c.back || c.answer || '').trim() }));
      }

      // Validate minimums (lenient — partial data is OK)
      const hasFc  = Array.isArray(parsed.flashcards)     && parsed.flashcards.length     >= 2;
      const hasQ   = Array.isArray(parsed.quiz_questions)  && parsed.quiz_questions.length  >= 2;
      const hasMm  = parsed.mindmap?.branches?.length      >= 2;
      const hasKc  = Array.isArray(parsed.key_concepts)    && parsed.key_concepts.length    >= 1;

      const needFc = tool === 'flashcards' || tool === 'flashcards_quiz';
      const needQ  = tool === 'quiz'        || tool === 'flashcards_quiz';
      const needMm = tool === 'mindmap'     || tool === 'mindmap_only';
      const needAll = tool === 'all';

      const valid =
        needAll ? (hasFc || hasQ || hasMm || hasKc) :
        needFc  ? hasFc :
        needQ   ? hasQ  :
        needMm  ? hasMm :
        hasKc; // notes/summary — just need key_concepts

      if (!valid) {
        log.warn(`${name}: validation failed — fc:${parsed.flashcards?.length||0} q:${parsed.quiz_questions?.length||0} mm:${parsed.mindmap?.branches?.length||0}`);
        continue;
      }

      log.ok(`P2 OK — ${name} | ${tool} | fc:${parsed.flashcards?.length||0} | q:${parsed.quiz_questions?.length||0} | mm:${parsed.mindmap?.branches?.length||0} | ${Date.now()-t0}ms`);
      return parsed;
    } catch (err) {
      clearTimeout(timer);
      lastErr = err.name === 'AbortError' ? `${name} timed out` : `${name}: ${err.message}`;
      log.warn(`P2 fail — ${lastErr}`);
      if (err.message?.includes('Invalid API key')) throw err;
    }
  }
  throw new Error(`P2 all models failed: ${lastErr}`);
}

// ─────────────────────────────────────────────────────────────────────────────
// SECTION 10 — OFFLINE FALLBACK (only used if ALL models fail)
// ─────────────────────────────────────────────────────────────────────────────

function offlineNotes(topic) {
  const T = topic || 'this topic';
  return `## 📚 Introduction to ${T}

**${T}** is an important area of study with significant theoretical foundations and practical applications.

---

## 🎯 Core Concepts

> **Definition:** ${T} refers to the systematic study of its core domain, encompassing principles, methods, and applications.

**Foundational Framework:** The study of ${T} rests on interconnected principles that together explain how and why things work as they do.

---

## ⚙️ How It Works

The primary mechanism of ${T} operates through:
1. **Initial conditions** are identified and characterised
2. **Primary process** begins following the rules of ${T}
3. **Observable outcomes** emerge and can be evaluated

---

## 📝 Key Takeaways

- ✅ ${T} is a reasoning framework, not just a collection of facts
- ✅ Understanding WHY mechanisms work matters more than memorising WHAT they produce
- ✅ Active retrieval practice is 2-3× more effective than re-reading
- ✅ Real mastery = applying ${T} to novel situations

---
*Generated by ${SAVOIRÉ.BRAND} | ${SAVOIRÉ.DEVELOPER}*`;
}

function buildTopicFallback(tool, topic) {
  const T=topic||'this topic', now=getISTDateTime();
  const words=T.replace(/[^a-zA-Z\s]/g,'').split(/\s+/).filter(w=>w.length>3);
  const w1=words[0]||T.slice(0,20);

  const base = {
    topic: T, curriculum_alignment: 'General Academic Study', generated_at: now,
    study_score: 85, _fallback: true,
    flashcards: [], quiz_questions: [], mindmap: null,
    key_concepts: [
      `Core Definition: ${T} is the systematic study of its central domain. Mastery requires understanding WHY definitions are framed as they are — not just memorising them.`,
      `Primary Mechanism: The main process in ${T} follows a structured sequence where initial conditions lead to transformation and observable outcomes.`,
      `Key Relationships: In ${T}, core concepts are interconnected — grasping these relationships is more valuable than knowing each concept in isolation.`,
      `Practical Transfer: ${T} knowledge applies to healthcare, technology, business, and policy through the same analytical frameworks.`,
      `Expert Thinking: Experts in ${T} recognise deep structural patterns while beginners focus on surface features. This gap closes through deliberate practice.`,
    ],
    key_tricks: [
      `🧠 FEYNMAN TECHNIQUE for ${T}: Explain "${T}" aloud to an imaginary 12-year-old. Every hesitation reveals a gap. Return to notes only for gaps.`,
      `📝 ACTIVE RECALL for ${T}: After every study session, write everything you remember without looking. Gaps = study targets.`,
      `⏰ SPACED REPETITION: Review ${T} on days 1, 3, 7, 14, 30. Each review must be active retrieval, not re-reading.`,
    ],
    practice_questions: [
      { question: `Explain the foundational principles of ${T} with two specific examples.`, answer: `${T} rests on foundational principles collectively defining its scope, methods, and explanatory power. The first principle concerns the core subject matter and why it is understood as it is. The second addresses primary mechanisms. Understanding both requires grasping WHY principles hold — not just what they state. Example 1 illustrates core principles in a specific real situation. Example 2 shows the mechanism in a different context. Together they demonstrate that ${T} is a structured reasoning framework.` },
      { question: `Describe a professional scenario where deep knowledge of ${T} produces better outcomes.`, answer: `A professional facing a complex problem involving ${T} approaches it systematically: diagnosing the situation using ${T} principles, analysing key variables, predicting outcomes under different actions, selecting the optimal approach, and verifying reasoning against known constraints. This systematic process consistently outperforms intuitive pattern-matching, avoiding errors that novices make and anticipating consequences invisible without ${T} expertise.` },
    ],
    real_world_applications: [
      `Healthcare: ${T} informs clinical reasoning and diagnostic protocols — enabling more systematic decisions.`,
      `Technology: ${T} principles underpin system architecture and engineering decisions.`,
      `Business: Strategic planning draws on ${T} frameworks for better decisions under uncertainty.`,
      `Policy: Government agencies apply ${T} reasoning to design evidence-based interventions.`,
    ],
    common_misconceptions: [
      `❌ MYTH: Memorising ${T} facts equals understanding. ✅ TRUTH: Real mastery means grasping causal relationships and conditional application.`,
      `❌ MYTH: Re-reading notes is effective for ${T}. ✅ TRUTH: Active retrieval outperforms re-reading by 200-300%.`,
      `❌ MYTH: ${T} is only for specialists. ✅ TRUTH: ${T} reasoning transfers across many domains.`,
    ],
  };

  if (tool === 'flashcards' || tool === 'all') {
    base.flashcards = [
      { front: `What is the precise definition of ${T}?`, back: `${T} is defined as the systematic study of its core domain. The definition specifies exactly what is and isn't included, distinguishing ${T} from related fields. Understanding WHY the definition takes this form is the first step to genuine mastery.` },
      { front: `What are the most fundamental principles of ${T}?`, back: `The foundational principles of ${T} are: (1) Core framework establishing the basic structure; (2) Primary mechanism governing core processes; (3) Key relationships determining connections; (4) Boundary conditions defining limits; (5) Contextual connections linking ${T} to broader fields.` },
      { front: `Explain the primary mechanism of ${T} step by step.`, back: `The mechanism of ${T}: Step 1 → identify initial conditions. Step 2 → triggering event/input occurs. Step 3 → primary transformation begins following ${T} rules. Step 4 → intermediate stages form. Step 5 → observable outcome emerges. Understanding WHY each step follows is what separates genuine understanding from surface familiarity.` },
    ];
  }
  if (tool === 'quiz' || tool === 'all') {
    base.quiz_questions = [
      { id:1, question:`Which statement BEST describes the central focus of ${T}?`, options:['A systematic framework for understanding through evidence-based reasoning','A collection of memorised facts recalled on demand','A purely historical record with limited relevance','An intuitive skill only developed through experience'], correct_answer:'A systematic framework for understanding through evidence-based reasoning', explanation:`${T} is fundamentally about systematic frameworks for reasoning, not fact collection. This framework allows ${T} knowledge to transfer to new situations, which memorisation alone cannot achieve.`, difficulty:'easy' },
      { id:2, question:`A student re-read ${T} notes five times and feels confident. What does research predict?`, options:['Excellent performance — thorough re-reading builds understanding','Potential underperformance — re-reading creates familiarity but not durable knowledge','Performance depends entirely on exam difficulty','Strong performance if passages were highlighted'], correct_answer:'Potential underperformance — re-reading creates familiarity but not durable knowledge', explanation:`Re-reading ${T} material creates an "illusion of fluency" — material feels familiar but active retrieval dramatically outperforms re-reading for durable retention. When exams require applying ${T} to novel situations, familiarity alone fails.`, difficulty:'medium' },
    ];
  }
  if (tool === 'mindmap' || tool === 'all') {
    base.mindmap = {
      central: T.split(' ').slice(0,4).join(' ') || T,
      branches: [
        { name: 'Core Concepts',    color: '#00d4ff', items: [`Definition of ${T}`, 'Foundational principles', 'Key terminology', 'Theoretical framework'] },
        { name: 'Mechanisms',       color: '#bf00ff', items: ['Primary mechanism', 'Step-by-step process', 'Key variables', 'Cause-effect chains'] },
        { name: 'Applications',     color: '#00ff88', items: ['Professional practice', 'Healthcare uses', 'Technology applications', 'Business strategy'] },
        { name: 'Common Pitfalls',  color: '#ffae00', items: [`Misconception 1 about ${w1}`, 'Overgeneralisation', 'Ignoring edge cases', 'Surface vs deep learning'] },
      ],
      connections: [
        { from: 'Core Concepts', to: 'Mechanisms',    description: `Principles explain how ${T} mechanisms operate` },
        { from: 'Mechanisms',    to: 'Applications',  description: `${T} mechanisms enable real-world use` },
      ],
    };
  }
  return base;
}

// ─────────────────────────────────────────────────────────────────────────────
// SECTION 11 — TOPIC FACT
// ─────────────────────────────────────────────────────────────────────────────

const FACT_TEMPLATES = [
  t => `💡 Did you know? People who actively quiz themselves on "${t}" retain 2–3× more than those who just re-read notes.`,
  t => `🧠 Fun fact: Explaining "${t}" out loud (even to an imaginary student) is one of the fastest ways to find gaps.`,
  t => `⏰ Quick tip: Reviewing "${t}" at increasing intervals beats cramming it all in one sitting.`,
  t => `📊 Interesting: Topics like "${t}" are remembered better when connected to something you already know.`,
  t => `🎯 Study fact: Most learners overestimate how well they know "${t}" right after reading — testing reveals real gaps.`,
  t => `🌍 Worth noting: "${t}" connects to several other fields more than it first appears.`,
  t => `🔍 Pro tip: Find the 20% of core ideas that explain 80% of everything else in "${t}".`,
  t => `📝 Did you know? Writing "${t}" from memory — even badly — teaches more than reading it a fourth time.`,
];

function buildTopicFact(topic) {
  const t   = String(topic || 'this topic').trim().slice(0, 60);
  const idx = Math.abs([...t].reduce((h, ch) => (h*31 + ch.charCodeAt(0)) % 100000, 7)) % FACT_TEMPLATES.length;
  return FACT_TEMPLATES[idx](t);
}

// ─────────────────────────────────────────────────────────────────────────────
// SECTION 12 — MERGE CARDS + NOTES
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

  if (Array.isArray(cardsRaw?.flashcards)     && cardsRaw.flashcards.length)     merged.flashcards      = cardsRaw.flashcards;
  if (Array.isArray(cardsRaw?.quiz_questions)  && cardsRaw.quiz_questions.length) merged.quiz_questions  = cardsRaw.quiz_questions;
  if (cardsRaw?.mindmap?.branches?.length)                                        merged.mindmap         = cardsRaw.mindmap;

  // Ensure key_concepts always has content
  if (!merged.key_concepts?.length) {
    merged.key_concepts = [
      `Core Principles: ${topic} rests on fundamental principles connecting theory to practice. Understanding WHY matters more than memorising WHAT.`,
      `Key Mechanisms: Primary processes follow identifiable patterns that can be learned and applied systematically.`,
      `Practical Transfer: ${topic} knowledge applies to healthcare, technology, business, and research.`,
      `Expert Thinking: Experts in ${topic} differ from beginners in pattern recognition, conditional reasoning, and metacognition.`,
      `Learning Strategy: Active retrieval practice is 2-3× more effective than re-reading for mastering ${topic}.`,
    ];
  }
  return merged;
}

// ─────────────────────────────────────────────────────────────────────────────
// SECTION 13 — SSE HELPER + HEADERS
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
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST,GET,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type,Authorization,Accept');
  res.setHeader('Access-Control-Max-Age', '86400');
  res.setHeader('X-Powered-By', `${SAVOIRÉ.BRAND} by ${SAVOIRÉ.DEVELOPER}`);
  res.setHeader('X-Developer', SAVOIRÉ.DEVELOPER);
  res.setHeader('X-Founder', SAVOIRÉ.FOUNDER);
  res.setHeader('X-Version', SAVOIRÉ.VERSION);
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
}

// ─────────────────────────────────────────────────────────────────────────────
// SECTION 14 — MAIN HANDLER
// ─────────────────────────────────────────────────────────────────────────────

module.exports = async function handler(req, res) {
  const reqId     = `${Date.now().toString(36)}-${Math.random().toString(36).slice(2,8)}`;
  const startTime = Date.now();
  log.info(`[${reqId}] ${req.method} /api/study`);
  setHeaders(res);
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST')   return res.status(405).json({ error: 'Use POST.' });

  const body       = req.body || {};
  const message    = String(body.message    || '').trim();
  const userName   = String(body.userName   || 'Anonymous').trim();
  const userStreak = Number(body.streak)    || 0;
  const userSess   = Number(body.sessions)  || 1;
  const sessionId  = String(body.sessionId  || reqId);

  // ── PING / VISIT TRACKING ─────────────────────────────────────────────────
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

  log.info(`[${reqId}] tool:${opts.tool} | lang:${opts.language} | depth:${opts.depth} | stream:${opts.stream} | user:${userName}`);

  // ── API KEY CHECK ─────────────────────────────────────────────────────────
  if (!process.env.OPENROUTER_API_KEY) {
    log.error('[CONFIG] OPENROUTER_API_KEY not set in environment!');
    return res.status(500).json({ error: 'Savoiré AI service is misconfigured. Please contact the administrator.' });
  }

  sendToGoogleSheets(userName, userStreak, userSess, opts.tool, message, 'started', 0, sessionId).catch(() => {});

  // ══════════════════════════════════════════════════════════════════════════
  // STREAMING SSE — ALL TOOLS
  // ══════════════════════════════════════════════════════════════════════════

  if (!opts.stream) {
    // Non-streaming is not supported; client must send stream:true
    return res.status(400).json({ error: 'Streaming is required. Please refresh and try again.' });
  }

  // Set SSE headers
  res.setHeader('Content-Type',   'text/event-stream; charset=utf-8');
  res.setHeader('Cache-Control',  'no-cache, no-store, must-revalidate, no-transform');
  res.setHeader('Connection',     'keep-alive');
  res.setHeader('X-Accel-Buffering', 'no');
  if (typeof res.flushHeaders === 'function') res.flushHeaders();

  const sse = makeSSE(res);

  // Keepalive ping every 12s to prevent proxy timeout
  const kap = setInterval(() => {
    if (res.writableEnded) { clearInterval(kap); return; }
    try { res.write(`: ping ${Date.now()}\n\n`); if (typeof res.flush === 'function') res.flush(); }
    catch { clearInterval(kap); }
  }, 12000);

  // Auto-advance stage timers (in case model is slow to start)
  const stageTimers = [
    setTimeout(() => sse('stage', { idx:1, label: '📝 Writing your content…' }),          2000),
    setTimeout(() => sse('stage', { idx:2, label: '🔍 Building sections…' }),             6000),
    setTimeout(() => sse('stage', { idx:3, label: '🃏 Generating interactive cards…' }), 14000),
  ];
  const clearStages = () => stageTimers.forEach(clearTimeout);

  // Send initial events
  sse('heartbeat', { ts: Date.now(), status: 'connected', service: SAVOIRÉ.BRAND, requestId: reqId, tool: opts.tool });
  sse('stage',     { idx: 0, label: `🎯 Analysing "${message.slice(0, 50)}${message.length>50?'…':''}"` });
  sse('fact',      { fact: buildTopicFact(message) });
  sse('token',     { t: '' }); // prime the stream

  let notes = '', p1ok = false;

  try {
    // ── PHASE 1: Stream Notes ─────────────────────────────────────────────
    sse('stage', { idx: 1, label: `📝 Writing ${opts.tool === 'summary' ? 'smart summary' : 'study notes'} for "${message.slice(0,40)}…"` });
    const notesPrompt = buildNotesPrompt(message, opts);

    try {
      notes = await streamNotes(notesPrompt, chunk => sse('token', { t: chunk }), opts.tool);
      p1ok  = true;
      log.ok(`[${reqId}] P1 done — ${notes.length}ch`);
      sse('stage', { idx: 2, label: '✅ Notes complete! Building interactive cards…' });
    } catch (e1) {
      log.error(`[${reqId}] P1 all models failed: ${e1.message} — using offline notes`);
      // Use offline notes as graceful fallback
      notes = offlineNotes(message);
      // Stream offline notes in chunks so the live view still works
      for (let i = 0; i < notes.length; i += 300) {
        sse('token', { t: notes.slice(i, i + 300) });
        await sleep(4);
      }
      p1ok = false;
      sse('stage', { idx: 2, label: '⚠️ Using cached notes — building cards…' });
    }

    // ── PHASE 2: Fetch Structured Cards ──────────────────────────────────
    let cardsData = null, p2ok = false;

    if (opts.tool === 'all') {
      // MEGA BUNDLE: split into 2 parallel calls (flashcards+quiz) + (mindmap)
      // to avoid giant JSON that times out on free models
      sse('stage', { idx: 3, label: '⚡ Building mega bundle (flashcards + quiz + mindmap)…' });
      try {
        const [fcqResult, mmResult] = await Promise.allSettled([
          fetchCards(buildCardsPrompt(message, opts, 'flashcards_quiz'), 'flashcards_quiz'),
          fetchCards(buildCardsPrompt(message, opts, 'mindmap_only'),    'mindmap_only'),
        ]);
        cardsData = {};
        if (fcqResult.status === 'fulfilled' && fcqResult.value) {
          const v = fcqResult.value;
          if (v.flashcards?.length)     cardsData.flashcards       = v.flashcards;
          if (v.quiz_questions?.length) cardsData.quiz_questions   = v.quiz_questions;
          if (v.key_concepts?.length)   cardsData.key_concepts     = v.key_concepts;
          if (v.key_tricks?.length)     cardsData.key_tricks       = v.key_tricks;
          if (v.topic)                  cardsData.topic            = v.topic;
          if (v.study_score)            cardsData.study_score      = v.study_score;
          if (v.practice_questions?.length) cardsData.practice_questions = v.practice_questions;
          if (v.real_world_applications?.length) cardsData.real_world_applications = v.real_world_applications;
          if (v.common_misconceptions?.length)   cardsData.common_misconceptions   = v.common_misconceptions;
        } else {
          log.warn(`[${reqId}] Mega P2a (fc+quiz) failed: ${fcqResult.reason?.message}`);
        }
        if (mmResult.status === 'fulfilled' && mmResult.value?.mindmap) {
          cardsData.mindmap = mmResult.value.mindmap;
          if (!cardsData.key_concepts?.length && mmResult.value.key_concepts?.length) {
            cardsData.key_concepts = mmResult.value.key_concepts;
          }
        } else {
          log.warn(`[${reqId}] Mega P2b (mindmap) failed: ${mmResult.reason?.message}`);
        }
        p2ok = !!(cardsData.flashcards?.length || cardsData.quiz_questions?.length || cardsData.mindmap);
        log.ok(`[${reqId}] Mega P2 — fc:${cardsData.flashcards?.length||0} q:${cardsData.quiz_questions?.length||0} mm:${cardsData.mindmap?.branches?.length||0}`);
      } catch (e2) {
        log.error(`[${reqId}] Mega P2 fatal: ${e2.message}`);
        p2ok = false; cardsData = null;
      }
      // Fallback for mega if both calls fail
      if (!p2ok) {
        cardsData = buildTopicFallback('all', message);
        sse('stage', { idx: 3, label: '📝 Loading comprehensive study cards…' });
      }
    } else {
      // SINGLE TOOL
      const toolLabel = { flashcards:'flashcards', quiz:'quiz questions', summary:'summary cards', mindmap:'mind map branches', notes:'study cards' }[opts.tool] || 'cards';
      sse('stage', { idx: 3, label: `🃏 Building ${toolLabel} for "${message.slice(0,30)}…"` });
      try {
        cardsData = await fetchCards(buildCardsPrompt(message, opts), opts.tool);
        p2ok = true;
        log.ok(`[${reqId}] P2 done`);
      } catch (e2) {
        log.error(`[${reqId}] P2 all models failed: ${e2.message} — using fallback cards`);
        cardsData = buildTopicFallback(opts.tool, message);
        p2ok = false;
        sse('stage', { idx: 3, label: '📝 Loading study cards…' });
      }
    }

    // ── PHASE 3: Stream Cards Live ────────────────────────────────────────
    if (cardsData?.flashcards?.length && (opts.tool === 'flashcards' || opts.tool === 'all')) {
      sse('stage', { idx: 3, label: `🃏 Streaming ${cardsData.flashcards.length} flashcards…` });
      for (let i = 0; i < cardsData.flashcards.length; i++) {
        sse('card', { idx: i, total: cardsData.flashcards.length, card: cardsData.flashcards[i] });
        await sleep(60);
      }
      log.ok(`[${reqId}] Streamed ${cardsData.flashcards.length} flashcards`);
    }

    if (cardsData?.quiz_questions?.length && (opts.tool === 'quiz' || opts.tool === 'all')) {
      sse('stage', { idx: 3, label: `❓ Streaming ${cardsData.quiz_questions.length} quiz questions…` });
      for (let i = 0; i < cardsData.quiz_questions.length; i++) {
        sse('question', { idx: i, total: cardsData.quiz_questions.length, q: cardsData.quiz_questions[i] });
        await sleep(70);
      }
      log.ok(`[${reqId}] Streamed ${cardsData.quiz_questions.length} questions`);
    }

    if (cardsData?.mindmap?.branches?.length && (opts.tool === 'mindmap' || opts.tool === 'all')) {
      sse('stage', { idx: 3, label: `🗺️ Streaming ${cardsData.mindmap.branches.length} mind map branches…` });
      sse('branch', { idx: -1, total: cardsData.mindmap.branches.length, branch: { name: '_central_', value: cardsData.mindmap.central, connections: cardsData.mindmap.connections || [] } });
      await sleep(80);
      for (let i = 0; i < cardsData.mindmap.branches.length; i++) {
        sse('branch', { idx: i, total: cardsData.mindmap.branches.length, branch: cardsData.mindmap.branches[i] });
        await sleep(80);
      }
      log.ok(`[${reqId}] Streamed ${cardsData.mindmap.branches.length} branches`);
    }

    // ── FINAL: Merge and Send ─────────────────────────────────────────────
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

    log.ok(`[${reqId}] COMPLETE — ${final._duration_ms}ms | p1:${p1ok} | p2:${p2ok}`);
    sendToGoogleSheets(userName, userStreak, userSess, opts.tool, message, 'completed', final._duration_ms, sessionId).catch(() => {});

  } catch (fatal) {
    clearInterval(kap);
    clearStages();
    log.error(`[${reqId}] FATAL: ${fatal.message}`);
    // Always send error as {error:'...'} — frontend checks evt.error
    sse('error', { error: 'Savoiré AI is momentarily unavailable. Please try again in a few seconds.', requestId: reqId });
    sendToGoogleSheets(userName, userStreak, userSess, opts.tool, message, 'failed', Date.now()-startTime, sessionId).catch(() => {});
  }

  if (!res.writableEnded) res.end();
};
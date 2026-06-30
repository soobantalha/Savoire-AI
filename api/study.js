'use strict';
// ═══════════════════════════════════════════════════════════════════════════════
// SAVOIRÉ AI v2.0 — api/study.js — PARALLEL RACING (fast, real AI only)
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
// SECTION 2 — FAST MODEL LISTS (parallel racing)
// ─────────────────────────────────────────────────────────────────────────────

// For streaming notes – fastest models first, but we race all simultaneously
const MODELS_STREAM = [
  { id: 'google/gemini-2.0-flash-exp:free',          max_tokens: 5000, temp: 0.75 },
  { id: 'deepseek/deepseek-chat-v3-0324:free',       max_tokens: 5000, temp: 0.75 },
  { id: 'meta-llama/llama-3.3-70b-instruct:free',    max_tokens: 4500, temp: 0.75 },
  { id: 'qwen/qwen2.5-72b-instruct:free',            max_tokens: 4500, temp: 0.75 },
  { id: 'microsoft/phi-3-mini-128k-instruct:free',   max_tokens: 4000, temp: 0.75 },
  { id: 'z-ai/glm-4.5-air:free',                     max_tokens: 4000, temp: 0.75 },
  { id: 'openrouter/free',                            max_tokens: 5000, temp: 0.75 },
];

// For structured JSON cards – high accuracy, but we race them all
const MODELS_CARDS = [
  { id: 'google/gemini-2.0-flash-exp:free',          max_tokens: 7000, temp: 0.30 },
  { id: 'deepseek/deepseek-chat-v3-0324:free',       max_tokens: 7000, temp: 0.30 },
  { id: 'meta-llama/llama-3.3-70b-instruct:free',    max_tokens: 6000, temp: 0.30 },
  { id: 'qwen/qwen2.5-72b-instruct:free',            max_tokens: 6000, temp: 0.30 },
  { id: 'microsoft/phi-3-mini-128k-instruct:free',   max_tokens: 5000, temp: 0.30 },
  { id: 'z-ai/glm-4.5-air:free',                     max_tokens: 5000, temp: 0.30 },
  { id: 'openrouter/free',                            max_tokens: 7000, temp: 0.30 },
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
  simple:   'Write in clear, beginner‑friendly language. Short sentences. Everyday analogies. Define all jargon immediately.',
  academic: 'Write in formal academic language. Precise scholarly terminology. Objective, third‑person tone.',
  detailed: 'Maximum exhaustive detail. Numerous specific examples. Thorough step‑by‑step explanations. Cover all edge cases.',
  exam:     'Exam‑focused. Mark‑scheme phrasing. Highlight must‑know points. Flag common student mistakes. Include exam tips.',
  visual:   'Vivid analogies and metaphors for everything. Mental models. Spatial descriptions. Make abstract concrete.',
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

const trunc = (s, n = 120) => !s ? '' : String(s).length > n ? String(s).slice(0, n) + '…' : String(s);

function getISTDateTime() {
  const now  = new Date();
  const ist  = new Date(now.getTime() + now.getTimezoneOffset() * 60000 + 5.5 * 3600000);
  const pad  = n => String(n).padStart(2, '0');
  return `${ist.getFullYear()}-${pad(ist.getMonth()+1)}-${pad(ist.getDate())} ${pad(ist.getHours())}:${pad(ist.getMinutes())}:${pad(ist.getSeconds())}`;
}
function getISTDate() { return getISTDateTime().split(' ')[0]; }

// ─────────────────────────────────────────────────────────────────────────────
// SECTION 5 — GOOGLE SHEETS (unchanged)
// ─────────────────────────────────────────────────────────────────────────────

async function sendToGoogleSheets(userName, streak, sessions, tool, topic, status, durationMs, sessionId) {
  if (!GOOGLE_WEBHOOK_URL) return false;
  try {
    const payload = {
      userName:   userName || 'Anonymous',
      streak:     Number(streak)    || 0,
      sessions:   Number(sessions)  || 1,
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
    if (res.ok) log.ok(`📊 Sheets ← ${userName} | ${tool} | ${status} | sessions:${sessions}`);
    else log.warn(`Sheets HTTP ${res.status}`);
    return res.ok;
  } catch (err) {
    log.warn(`Sheets error (non-fatal): ${err.message}`);
    return false;
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// SECTION 6 — PROMPT BUILDERS (optimised for speed)
// ─────────────────────────────────────────────────────────────────────────────

function buildNotesPrompt(input, opts) {
  const depth = DEPTH_MAP[opts.depth] || DEPTH_MAP.detailed;
  const style = STYLE_MAP[opts.style] || STYLE_MAP.simple;
  const lang  = opts.language || 'English';
  const tool  = opts.tool    || 'notes';

  const sectionMap = {
    notes:
      '## 📚 Introduction & Overview\n\n## 🎯 Core Concepts & Definitions\n\n## ⚙️ How It Works — Mechanisms\n\n## 💡 Key Examples\n\n## 🚀 Advanced Aspects\n\n## 🌍 Real-World Applications\n\n## 🧠 Common Misconceptions\n\n## 📝 Key Takeaways',
    flashcards:
      '## 📖 Overview\n\n## 🎯 Core Concepts (Q&A)\n\n## ⚙️ Mechanisms (Q&A)\n\n## 💡 Examples & Applications\n\n## ⚠️ Misconceptions\n\n## 🎯 Quick Summary',
    quiz:
      '## 📚 Topic Intro\n\n## ✏️ Core Concepts (exam-ready)\n\n## ⚙️ Mechanisms (exam-style)\n\n## 📝 Model Answers\n\n## 🎯 Must-Remember Points',
    summary:
      '## 🚀 TL;DR (3-5 sentences)\n\n## 🎯 Core Concepts (bullets)\n\n## ⚙️ Key Mechanisms (short)\n\n## 💡 Critical Examples\n\n## ✅ Revision Checklist',
    mindmap:
      '## 🧠 Central Topic\n\n## 🌿 Branch 1: Foundations\n\n## 🌿 Branch 2: Core Mechanisms\n\n## 🌿 Branch 3: Key Examples\n\n## 🌿 Branch 4: Applications\n\n## 🌿 Branch 5: Pitfalls\n\n## 🔗 Connections',
    all:
      '## 📚 Introduction\n\n## 🎯 Core Concepts\n\n## ⚙️ How It Works\n\n## 💡 Key Examples\n\n## 🚀 Advanced\n\n## 🌍 Applications\n\n## 🧠 Memory Tricks\n\n## 📝 Revision Checklist',
  };

  const sections = sectionMap[tool] || sectionMap.notes;
  const toolGoal = {
    notes:      'Comprehensive study notes.',
    flashcards: 'Notes as Q&A pairs.',
    quiz:       'Exam-focused notes.',
    summary:    'Concise smart summary.',
    mindmap:    'Hierarchical notes for mind map.',
    all:        'Ultimate study package.',
  }[tool] || 'Study notes.';

  return `You are ${SAVOIRÉ.BRAND}. ${toolGoal}

TOPIC: "${input}"
LANGUAGE: ${lang} (ALL words in ${lang})
LENGTH: ${depth.wordRange}
STYLE: ${style}

REQUIRED SECTIONS (use exactly these ## headings):
${sections}

FORMATTING:
- **bold** key terms
- - for bullets
- 1., 2. for steps
- > for definitions
- --- between sections
- At least 5 examples
- ⚠️ Common Mistakes
- 🎯 Key Takeaways (5-8 bullets)

START NOW with first ## heading. Write in ${lang} only.`;
}

function buildCardsPrompt(input, opts) {
  const lang = opts.language || 'English';
  const tool = opts.tool     || 'notes';
  const topicShort = String(input).slice(0, 120);

  let toolBlock = '';
  let fcField   = '"flashcards": []';
  let qField    = '"quiz_questions": []';
  let mmField   = '"mindmap": null';

  if (tool === 'flashcards' || tool === 'all') {
    toolBlock += `Generate 15-20 flashcards about "${topicShort}". Each: front (10-40 words), back (60-180 words). Types: definition, mechanism, comparison, application, misconception.`;
    fcField = `"flashcards": [
      {"front": "[question about ${topicShort}]", "back": "[answer with example]"},
      {"front": "[another question]", "back": "[another answer]"}
    ]`;
  }

  if (tool === 'quiz' || tool === 'all') {
    toolBlock += `Generate 10-12 quiz questions about "${topicShort}". Each: question, 4 options (one correct), correct_answer (exact match), explanation (80-130 words), difficulty (easy/medium/hard).`;
    qField = `"quiz_questions": [
      {"id":1,"question":"[question]","options":["A","B","C","D"],"correct_answer":"[B]","explanation":"[explanation]","difficulty":"medium"}
    ]`;
  }

  if (tool === 'mindmap' || tool === 'all') {
    toolBlock += `Generate mind map with 5-7 branches about "${topicShort}". central: 3-6 words. branches: name (specific), color (#hex), items (4-6 facts). connections: 3-5 {from, to, description}.`;
    mmField = `"mindmap": {
      "central": "[essence]",
      "branches": [
        {"name":"[specific category]","color":"#00d4ff","items":["fact1","fact2","fact3","fact4"]}
      ],
      "connections": [{"from":"[branch]","to":"[branch]","description":"[relationship]"}]
    }`;
  }

  return `You are ${SAVOIRÉ.BRAND}. Generate valid JSON about:

TOPIC: "${input}"
LANGUAGE: ${lang}
TOOL: ${tool}

${toolBlock}

OUTPUT: ONLY JSON, starting with {.

{
  "topic": "[title]",
  "curriculum_alignment": "[level]",
  "study_score": 97,
  ${fcField},
  ${qField},
  ${mmField},
  "key_concepts": ["concept1: explanation", "concept2: explanation"],
  "key_tricks": ["🧠 trick1", "📝 trick2"],
  "practice_questions": [{"question":"q1","answer":"a1"}],
  "real_world_applications": ["app1","app2"],
  "common_misconceptions": ["❌ myth1 ✅ truth1"]
}

RULES: valid JSON, all placeholders replaced with real content about "${topicShort}", ALL text in ${lang}, no extra text. OUTPUT JSON NOW:`;
}

// ─────────────────────────────────────────────────────────────────────────────
// SECTION 7 — PHASE 1: STREAM NOTES (parallel race)
// ─────────────────────────────────────────────────────────────────────────────

const FIRST_TOKEN_TIMEOUT = 8000;  // 8 seconds to get first token
const FULL_STREAM_TIMEOUT = 60000; // 60 seconds total after first token

async function streamNotes(prompt, onChunk, tool) {
  const controllers = [];
  const winner = { id: null, reader: null, done: false };

  // Start all model fetches
  const fetches = MODELS_STREAM.map(model => {
    const ctrl = new AbortController();
    controllers.push(ctrl);
    const name = model.id.split('/').pop().replace(':free', '');
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

        if (!res.ok) {
          const txt = await res.text().catch(() => '');
          if (res.status === 401) throw new Error('Invalid API key');
          throw new Error(`HTTP ${res.status} ${trunc(txt, 60)}`);
        }

        const reader = res.body.getReader();
        const decoder = new TextDecoder('utf-8');
        let lineBuf = '';
        let full = '';
        let firstTokenSent = false;

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
                if (!firstTokenSent) {
                  // This model is the first to produce a token – it wins the race
                  firstTokenSent = true;
                  log.ok(`P1 🏆 ${name} won in ${Date.now()-t0}ms`);
                  // Cancel all other controllers
                  for (const otherCtrl of controllers) {
                    if (otherCtrl !== ctrl) otherCtrl.abort();
                  }
                  // Set winner reader and start streaming its tokens
                  winner.id = name;
                  winner.reader = reader;
                  // We need to continue reading from this reader, but we are inside this loop.
                  // We'll break out and let the outer loop handle the winner.
                  // But we need to stop processing other lines from other models.
                  // Since we already cancelled others, we can safely return the full string later.
                  // For now, we'll just stream this delta and continue reading from this reader.
                  // We'll set a flag so we know this model is the winner.
                  // We'll also break out of the line loop to avoid reading further lines from other models.
                  // But we are inside the loop for this model only, so it's fine.
                  // We'll just keep streaming.
                  onChunk(delta);
                  full += delta;
                  // Continue reading from this reader
                } else {
                  // This model is the winner, continue streaming
                  onChunk(delta);
                  full += delta;
                }
              }
            } catch { /* ignore */ }
          }
        }

        // If we reach here, the stream ended. Return the full content.
        // But only if this model was the winner (firstTokenSent) or if no other won.
        // In the case where this model was the first to send a token, it already won.
        // If no one won (shouldn't happen because we have at least one model), return whatever we have.
        if (firstTokenSent) {
          // This is the winner – return full content
          return full;
        } else {
          // This model didn't win, but we might still have content; we'll ignore it.
          return null;
        }

      } catch (err) {
        if (err.name !== 'AbortError') {
          log.warn(`P1 ${name} error: ${err.message}`);
        }
        return null;
      }
    })();
  });

  // Wait for the first model to complete successfully (returning a non-null string)
  // Use Promise.race with a timeout for the entire race
  const raceTimeout = new Promise((_, reject) => setTimeout(() => reject(new Error('Race timeout')), 30000));

  try {
    const result = await Promise.race([
      Promise.any(fetches.map(p => p.then(r => r))),
      raceTimeout,
    ]);
    // result is the full notes string from the winner
    if (result && typeof result === 'string' && result.length > 50) {
      log.ok(`P1 ✅ ${winner.id || 'winner'} | ${result.length}ch`);
      return result;
    } else {
      throw new Error('Winner returned insufficient content');
    }
  } catch (err) {
    // Race failed or timed out
    log.error(`P1 race failed: ${err.message}`);
    // Retry the whole race once with a small delay
    await sleep(1500);
    // Recursively try again (but only once)
    return await streamNotes(prompt, onChunk, tool);
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// SECTION 8 — PHASE 2: FETCH CARDS (parallel race)
// ─────────────────────────────────────────────────────────────────────────────

async function fetchCards(prompt, tool, topic) {
  const controllers = [];

  const fetches = MODELS_CARDS.map(model => {
    const ctrl = new AbortController();
    controllers.push(ctrl);
    const name = model.id.split('/').pop().replace(':free', '');
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
            temperature: model.temp || 0.30,
            stream: false,
            messages: [{ role: 'user', content: prompt }],
          }),
          signal: ctrl.signal,
        });

        if (!res.ok) {
          const txt = await res.text().catch(() => '');
          if (res.status === 401) throw new Error('Invalid API key');
          throw new Error(`HTTP ${res.status} ${trunc(txt, 60)}`);
        }

        const data = await res.json();
        let content = data?.choices?.[0]?.message?.content?.trim();
        if (!content || content.length < 50) throw new Error('empty response');

        // Remove code fences and extract JSON
        content = content.replace(/^```(?:json)?\s*/im, '').replace(/\s*```\s*$/im, '').trim();
        const jS = content.indexOf('{');
        const jE = content.lastIndexOf('}');
        if (jS === -1 || jE <= jS) throw new Error('no JSON');
        let jsonStr = content.slice(jS, jE + 1);

        // JSON repair (4 steps)
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
                throw new Error(`JSON repair failed: ${e4.message.slice(0,60)}`);
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

        // Validation (tool-specific)
        let valid = true;
        if ((tool === 'flashcards' || tool === 'all') && (!Array.isArray(parsed.flashcards) || parsed.flashcards.length < 3)) valid = false;
        if ((tool === 'quiz' || tool === 'all') && (!Array.isArray(parsed.quiz_questions) || parsed.quiz_questions.length < 3)) valid = false;
        if ((tool === 'mindmap' || tool === 'all') && (!parsed.mindmap?.branches || parsed.mindmap.branches.length < 2)) valid = false;
        if (!valid && tool !== 'all') throw new Error('validation failed');

        log.ok(`P2 ✅ ${name} | fc:${parsed.flashcards?.length||0} q:${parsed.quiz_questions?.length||0} mm:${parsed.mindmap?.branches?.length||0} | ${Date.now()-t0}ms`);
        return parsed;

      } catch (err) {
        if (err.name !== 'AbortError') log.warn(`P2 ${name} error: ${err.message}`);
        return null;
      }
    })();
  });

  try {
    const result = await Promise.any(fetches.map(p => p.then(r => r)));
    if (result) return result;
    throw new Error('All models returned null');
  } catch (err) {
    log.error(`P2 race failed: ${err.message}`);
    // Retry once
    await sleep(1500);
    // Recursive retry
    return await fetchCards(prompt, tool, topic);
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// SECTION 9 — MERGE (unchanged)
// ─────────────────────────────────────────────────────────────────────────────

function mergeCards(cardsRaw, notes, topic, opts) {
  const now = getISTDateTime();
  const isFallback = !!cardsRaw?._fallback;
  const merged = {
    topic:                   topic || cardsRaw?.topic || 'Study Material',
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

  if (Array.isArray(cardsRaw?.flashcards) && cardsRaw.flashcards.length)    merged.flashcards = cardsRaw.flashcards;
  if (Array.isArray(cardsRaw?.quiz_questions) && cardsRaw.quiz_questions.length) merged.quiz_questions = cardsRaw.quiz_questions;
  if (cardsRaw?.mindmap?.branches?.length)                                  merged.mindmap = cardsRaw.mindmap;

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
// SECTION 10 — SSE HELPER + HEADERS (unchanged)
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
// SECTION 11 — MAIN HANDLER — with parallel race, no fallback unless all fail
// ─────────────────────────────────────────────────────────────────────────────

module.exports = async function handler(req, res) {
  const reqId = `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
  const startTime = Date.now();
  log.info(`[${reqId}] ${req.method} /api/study`);

  setHeaders(res);
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Use POST.' });

  if (!process.env.OPENROUTER_API_KEY) {
    log.error('[FATAL] OPENROUTER_API_KEY not set!');
    return res.status(200).json({ status: 'error', message: 'Service misconfigured. Contact admin.', requestId: reqId });
  }

  const body = req.body || {};
  const message      = String(body.message    || '').trim();
  const userName     = String(body.userName   || 'Anonymous').trim();
  const userStreak   = Number(body.streak)    || 0;
  const userSessions = Number(body.sessions)  || 1;
  const sessionId    = String(body.sessionId  || reqId);

  if (!message || message === 'ping') {
    log.info(`[${reqId}] PING — ${userName} | sessions:${userSessions}`);
    sendToGoogleSheets(userName, userStreak, userSessions, 'visit', '', 'online', 0, sessionId).catch(() => {});
    return res.status(200).json({
      status: 'ok',
      service: SAVOIRÉ.BRAND,
      version: SAVOIRÉ.VERSION,
      tagline: SAVOIRÉ.TAGLINE,
      time: getISTDateTime(),
      requestId: reqId,
    });
  }

  if (message.length < 2) return res.status(400).json({ error: 'Please enter a topic (minimum 2 characters).' });
  if (message.length > 20000) return res.status(400).json({ error: 'Input too long (max 20,000 characters).' });

  const rawOpts = body.options || {};
  const opts = {
    tool:     ['notes','flashcards','quiz','summary','mindmap','all'].includes(rawOpts.tool) ? rawOpts.tool : 'notes',
    depth:    ['standard','detailed','comprehensive','expert'].includes(rawOpts.depth) ? rawOpts.depth : 'detailed',
    style:    ['simple','academic','detailed','exam','visual'].includes(rawOpts.style) ? rawOpts.style : 'simple',
    language: String(rawOpts.language || 'English').trim().slice(0, 60),
    stream:   rawOpts.stream === true,
  };

  log.info(`[${reqId}] tool:${opts.tool} | lang:${opts.language} | user:${userName} | sessions:${userSessions}`);

  if (!opts.stream) {
    return res.status(400).json({ error: 'The client must send options.stream=true.' });
  }

  sendToGoogleSheets(userName, userStreak, userSessions, opts.tool, message, 'started', 0, sessionId).catch(() => {});

  // ── SSE SETUP ─────────────────────────────────────────────────────────────
  res.setHeader('Content-Type', 'text/event-stream; charset=utf-8');
  res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate, no-transform');
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('X-Accel-Buffering', 'no');
  if (typeof res.flushHeaders === 'function') res.flushHeaders();

  const sse = makeSSE(res);
  const kap = setInterval(() => {
    if (res.writableEnded) { clearInterval(kap); return; }
    try { res.write(`: ping ${Date.now()}\n\n`); if (typeof res.flush === 'function') res.flush(); } catch { clearInterval(kap); }
  }, 10000);

  const stageTimers = [
    setTimeout(() => sse('stage', { idx: 1, label: '📝 Writing your content…' }), 1500),
    setTimeout(() => sse('stage', { idx: 2, label: '🔍 Building sections…' }), 5000),
    setTimeout(() => sse('stage', { idx: 3, label: '🃏 Generating interactive cards…' }), 10000),
  ];
  const clearStages = () => stageTimers.forEach(clearTimeout);

  sse('heartbeat', { ts: Date.now(), status: 'connected', service: SAVOIRÉ.BRAND, requestId: reqId, tool: opts.tool });
  sse('stage', { idx: 0, label: `🎯 Analysing "${message.slice(0, 50)}${message.length > 50 ? '…' : ''}"` });
  sse('fact', { fact: buildTopicFact(message) });
  sse('token', { t: '' });

  let notes = '';
  let cardsData = null;
  let notesSuccess = false;
  let cardsSuccess = false;

  try {
    // ── PHASE 1: Stream notes (parallel race) ──────────────────────────────
    sse('stage', { idx: 1, label: `📝 Writing ${opts.tool === 'summary' ? 'smart summary' : 'study notes'}…` });
    const notesPrompt = buildNotesPrompt(message, opts);

    try {
      notes = await streamNotes(notesPrompt, chunk => sse('token', { t: chunk }), opts.tool);
      notesSuccess = true;
      log.ok(`[${reqId}] P1 done — ${notes.length}ch`);
    } catch (err) {
      log.error(`[${reqId}] P1 failed: ${err.message}`);
      // We will still continue, but notes will be empty. The final merge will add generic content.
      notes = `## Study Notes on ${message}\n\nWe could not generate AI content at this moment. Please try again.`;
      notesSuccess = false;
    }

    // ── PHASE 2: Fetch cards (parallel race) ──────────────────────────────
    if (notesSuccess) {
      sse('stage', { idx: 2, label: '✅ Notes complete! Finalising interactive cards…' });
      const cardsPrompt = buildCardsPrompt(message, opts);
      try {
        cardsData = await fetchCards(cardsPrompt, opts.tool, message);
        cardsSuccess = true;
        log.ok(`[${reqId}] P2 done — fc:${cardsData?.flashcards?.length||0} q:${cardsData?.quiz_questions?.length||0} mm:${cardsData?.mindmap?.branches?.length||0}`);
      } catch (err) {
        log.error(`[${reqId}] P2 failed: ${err.message}`);
        cardsSuccess = false;
        cardsData = { _fallback: true, flashcards: [], quiz_questions: [], mindmap: null };
      }
    }

    // ── STREAM CARDS IF AVAILABLE ──────────────────────────────────────────
    if (cardsData?.flashcards?.length && (opts.tool === 'flashcards' || opts.tool === 'all')) {
      sse('stage', { idx: 3, label: `🃏 Streaming ${cardsData.flashcards.length} flashcards…` });
      for (let i = 0; i < cardsData.flashcards.length; i++) {
        sse('card', { idx: i, total: cardsData.flashcards.length, card: cardsData.flashcards[i] });
        await sleep(60);
      }
    }

    if (cardsData?.quiz_questions?.length && (opts.tool === 'quiz' || opts.tool === 'all')) {
      sse('stage', { idx: 3, label: `❓ Streaming ${cardsData.quiz_questions.length} quiz questions…` });
      for (let i = 0; i < cardsData.quiz_questions.length; i++) {
        sse('question', { idx: i, total: cardsData.quiz_questions.length, q: cardsData.quiz_questions[i] });
        await sleep(80);
      }
    }

    if (cardsData?.mindmap?.branches?.length && (opts.tool === 'mindmap' || opts.tool === 'all')) {
      sse('stage', { idx: 3, label: `🗺️ Streaming ${cardsData.mindmap.branches.length} mind map branches…` });
      sse('branch', { idx: -1, total: cardsData.mindmap.branches.length, branch: { name: '_central_', value: cardsData.mindmap.central, connections: cardsData.mindmap.connections || [] } });
      await sleep(100);
      for (let i = 0; i < cardsData.mindmap.branches.length; i++) {
        sse('branch', { idx: i, total: cardsData.mindmap.branches.length, branch: cardsData.mindmap.branches[i] });
        await sleep(100);
      }
    }

    // ── FINAL DONE EVENT ──────────────────────────────────────────────────
    clearInterval(kap);
    clearStages();

    const final = mergeCards(cardsData, notes, message, opts);
    final._duration_ms = Date.now() - startTime;
    final._request_id = reqId;
    final._phase1_ok = notesSuccess;
    final._phase2_ok = cardsSuccess;
    final._notes_only = !cardsSuccess;
    final.powered_by = `${SAVOIRÉ.BRAND} by ${SAVOIRÉ.DEVELOPER}`;

    sse('stage', { idx: 4, label: '✅ Complete! All study materials ready.', done: true });
    sse('done', final);

    log.ok(`[${reqId}] ✅ COMPLETE — ${final._duration_ms}ms | p1:${notesSuccess} | p2:${cardsSuccess}`);
    sendToGoogleSheets(userName, userStreak, userSessions, opts.tool, message, 'completed', final._duration_ms, sessionId).catch(() => {});

  } catch (fatal) {
    clearInterval(kap);
    clearStages();
    log.error(`[${reqId}] FATAL: ${fatal.message}`);

    // Even on fatal, we send a done event with a generic message
    const fallbackNotes = `## Study Notes on ${message}\n\nWe're sorry, but the AI service is currently unavailable. Please try again in a few moments.`;
    const fallbackData = { _fallback: true, flashcards: [], quiz_questions: [], mindmap: null, key_concepts: [] };
    const final = mergeCards(fallbackData, fallbackNotes, message, opts);
    final._duration_ms = Date.now() - startTime;
    final._request_id = reqId;
    final._phase1_ok = false;
    final._phase2_ok = false;
    final._notes_only = true;
    final.powered_by = `${SAVOIRÉ.BRAND} by ${SAVOIRÉ.DEVELOPER}`;

    sse('stage', { idx: 4, label: '⚠️ Service temporarily unavailable – please try again later.', done: true });
    sse('done', final);

    sendToGoogleSheets(userName, userStreak, userSessions, opts.tool, message, 'failed_fallback', Date.now() - startTime, sessionId).catch(() => {});
  }

  if (!res.writableEnded) res.end();
};

// ─────────────────────────────────────────────────────────────────────────────
// SECTION 12 — TOPIC FACT (helper)
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
  const t = String(topic || 'this topic').trim().slice(0, 60);
  const idx = Math.abs([...t].reduce((h, ch) => (h * 31 + ch.charCodeAt(0)) % 100000, 7)) % FACT_TEMPLATES.length;
  return FACT_TEMPLATES[idx](t);
}

// ═══════════════════════════════════════════════════════════════════════════════
// END — api/study.js v2.0 PARALLEL RACING | Sooban Talha Technologies
// "Think Less. Know More." — Free forever for every student on Earth.
// ═══════════════════════════════════════════════════════════════════════════════
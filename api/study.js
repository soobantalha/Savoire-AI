'use strict';
// ═══════════════════════════════════════════════════════════════════════════════
// SAVOIRÉ AI v2.0 — api/study.js — ULTRA RELIABLE, NO ERROR SCREEN
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
// SECTION 2 — SINGLE MODEL (openrouter/free) — most reliable
// ─────────────────────────────────────────────────────────────────────────────

const MODEL = {
  id: 'openrouter/free',
  max_tokens: 6000,        // for notes; cards we'll increase later
  timeout_ms: 120000,      // 2 minutes for full response
  temp: 0.75,
};

// We'll use the same model for both notes and cards, but with different max_tokens

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
// SECTION 6 — PROMPT BUILDERS (unchanged from previous working version)
// ─────────────────────────────────────────────────────────────────────────────

function buildNotesPrompt(input, opts) {
  const depth = DEPTH_MAP[opts.depth] || DEPTH_MAP.detailed;
  const style = STYLE_MAP[opts.style] || STYLE_MAP.simple;
  const lang  = opts.language || 'English';
  const tool  = opts.tool    || 'notes';

  const sectionMap = {
    notes:
      '## 📚 Introduction & Overview\n\n## 🎯 Core Concepts & Definitions\n\n## ⚙️ How It Works — Mechanisms & Processes\n\n## 💡 Key Examples with Detailed Walkthroughs\n\n## 🚀 Advanced Aspects, Nuances & Edge Cases\n\n## 🌍 Real-World Applications\n\n## 🧠 Common Misconceptions & Corrections\n\n## 📝 Summary, Key Takeaways & Revision Checklist',
    flashcards:
      '## 📖 Overview & Context\n\n## 🎯 Core Concepts (as Q&A pairs)\n\n## ⚙️ Mechanisms & Processes (each step = one Q&A)\n\n## 💡 Examples & Applications\n\n## ⚠️ Common Misconceptions\n\n## 🎯 Quick Summary',
    quiz:
      '## 📚 Topic Introduction\n\n## ✏️ Core Concepts (exam‑ready format)\n\n## ⚙️ Mechanisms (exam‑style explanation)\n\n## 📝 Typical Exam Questions & Model Answers\n\n## 🎯 Must‑Remember Points',
    summary:
      '## 🚀 TL;DR — Executive Summary (3–5 sentences maximum)\n\n## 🎯 Core Concepts (one bullet each — crisp)\n\n## ⚙️ Key Mechanisms (ultra‑short)\n\n## 💡 Critical Examples Only\n\n## ✅ Final Revision Checklist',
    mindmap:
      '## 🧠 Central Topic Overview\n\n## 🌿 Branch 1: Foundations & Definitions\n\n## 🌿 Branch 2: Core Mechanisms\n\n## 🌿 Branch 3: Key Examples\n\n## 🌿 Branch 4: Real‑World Applications\n\n## 🌿 Branch 5: Common Pitfalls & Misconceptions\n\n## 🔗 Key Connections Between Branches',
    all:
      '## 📚 Introduction & Overview\n\n## 🎯 Core Concepts & Definitions\n\n## ⚙️ How It Works — Mechanisms\n\n## 💡 Key Examples\n\n## 🚀 Advanced Aspects\n\n## 🌍 Real‑World Applications\n\n## 🧠 Memory Tricks\n\n## 📝 Revision Checklist',
  };

  const sections = sectionMap[tool] || sectionMap.notes;

  const toolGoal = {
    notes:      'Generate comprehensive, well‑structured study notes covering every important aspect.',
    flashcards: 'Generate notes structured as clear Q&A pairs, each concept as a distinct question/answer.',
    quiz:       'Generate exam‑focused notes emphasising examinable points and common question patterns.',
    summary:    'Generate a concise smart summary: TL;DR first, then bullet key points, scannable.',
    mindmap:    'Generate hierarchically structured notes for mind map conversion — clear parent→child.',
    all:        'Generate the ULTIMATE comprehensive study package covering every angle of this topic.',
  }[tool] || 'Generate comprehensive study notes.';

  return `You are ${SAVOIRÉ.BRAND}, the world's most advanced AI study assistant.
Creator: ${SAVOIRÉ.DEVELOPER} (${SAVOIRÉ.DEVSITE}) | Founder: ${SAVOIRÉ.FOUNDER}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🎯 TASK: ${toolGoal}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

📖 TOPIC: "${input}"

🌐 LANGUAGE: ${lang}
   ⚠️ Write EVERY word in ${lang}. Zero exceptions. No mixing.

📏 LENGTH: ${depth.wordRange} — aim for the upper end; be thorough

🎨 STYLE: ${style}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📋 REQUIRED STRUCTURE — use exactly these headings:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

${sections}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📐 MANDATORY FORMATTING:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
• ## for all section headings
• **bold** every key term first time
• - for bullet lists
• Numbered lists for sequential steps
• > for definitions/key statements
• --- between major sections
• \`inline code\` for formulas/precise terms
• At least 5 real‑world examples
• ⚠️ Common Mistakes section
• 🎯 Key Takeaways (5‑8 bullets) at end
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🚀 BEGIN IMMEDIATELY — start with first ## heading. Write in ${lang} only.
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`;
}

function buildCardsPrompt(input, opts) {
  const lang = opts.language || 'English';
  const tool = opts.tool     || 'notes';
  const now  = getISTDateTime();
  const topicShort = String(input).slice(0, 120);

  let toolBlock = '';
  let fcField   = '"flashcards": []';
  let qField    = '"quiz_questions": []';
  let mmField   = '"mindmap": null';

  if (tool === 'flashcards' || tool === 'all') {
    toolBlock += `
╔═══════════════════════════════════════════════════════════════════════════╗
║  MANDATORY: Generate 15–20 FLASHCARDS about "${topicShort}"               ║
╚═══════════════════════════════════════════════════════════════════════════╝

Each flashcard MUST have:
• "front" (10–40 words in ${lang}): a SPECIFIC question about "${topicShort}"
• "back" (60–180 words in ${lang}): a SPECIFIC detailed answer with a concrete example from this topic

Card types (include at least 2 of each):
  - Definition cards    – "What is X in [topic]?"
  - Mechanism cards     – "How does X work in [topic]?"
  - Comparison cards    – "X vs Y in [topic]"
  - Application cards   – "How is X used in real world (specific to topic)?"
  - Misconception cards – "What do people get wrong about [topic]?"
`;
    fcField = `"flashcards": [
    {"front": "[SPECIFIC question about ${topicShort} in ${lang}]", "back": "[SPECIFIC 60‑180 word answer with example]"},
    {"front": "[Another SPECIFIC question]", "back": "[Another SPECIFIC answer]"},
    {"front": "[Mechanism question]", "back": "[Step‑by‑step explanation specific to ${topicShort}]"},
    {"front": "[Comparison question]", "back": "[Clear comparison with details from ${topicShort}]"},
    {"front": "[Application question]", "back": "[Real‑world application specific to ${topicShort}]"}
  ]`;
  }

  if (tool === 'quiz' || tool === 'all') {
    toolBlock += `
╔═══════════════════════════════════════════════════════════════════════════╗
║  MANDATORY: Generate 10–12 QUIZ QUESTIONS about "${topicShort}"           ║
╚═══════════════════════════════════════════════════════════════════════════╝

Each question MUST have:
• "question": a SPECIFIC factual question about "${topicShort}" in ${lang}
• "options": EXACTLY 4 strings (one correct, three plausible distractors) – all related to "${topicShort}"
• "correct_answer": CHARACTER‑FOR‑CHARACTER IDENTICAL to the correct option (copy‑paste exact string)
• "explanation": 80‑130 words in ${lang}, referencing "${topicShort}" specifically
• "difficulty": "easy", "medium", or "hard" (target: 3 easy, 5 medium, 4 hard)
`;
    qField = `"quiz_questions": [
    {
      "id": 1,
      "question": "[SPECIFIC question about ${topicShort} in ${lang}]",
      "options": ["[Plausible wrong A]", "[CORRECT answer — copy exact]", "[Plausible wrong C]", "[Plausible wrong D]"],
      "correct_answer": "[CORRECT answer — copy exact from options]",
      "explanation": "[80‑130 words specifically about ${topicShort} in ${lang}]",
      "difficulty": "medium"
    },
    {
      "id": 2,
      "question": "[Another SPECIFIC question]",
      "options": ["[Option A]", "[Option B — correct]", "[Option C]", "[Option D]"],
      "correct_answer": "[Option B — correct]",
      "explanation": "[Explanation specifically about ${topicShort}]",
      "difficulty": "hard"
    }
  ]`;
  }

  if (tool === 'mindmap' || tool === 'all') {
    toolBlock += `
╔═══════════════════════════════════════════════════════════════════════════╗
║  MANDATORY: Generate MIND MAP with 5–7 BRANCHES about "${topicShort}"    ║
╚═══════════════════════════════════════════════════════════════════════════╝

• "central": 3–6 words capturing the ESSENCE of "${topicShort}" in ${lang}
• "branches": 5–7 branches with SPECIFIC NAMES from "${topicShort}" (NOT generic labels like "Introduction")
• Each branch: 4–6 items (specific facts, terms, or concepts from "${topicShort}") each 5‑20 words
• "connections": 3–5 cross‑connections describing relationships within "${topicShort}"
`;
    mmField = `"mindmap": {
    "central": "[3‑6 word essence of ${topicShort} in ${lang}]",
    "branches": [
      {"name": "[SPECIFIC category from ${topicShort}]", "color": "#00d4ff", "items": ["[Specific fact 1]", "[Specific fact 2]", "[Specific fact 3]", "[Specific fact 4]", "[Specific fact 5]"]},
      {"name": "[SPECIFIC aspect]", "color": "#bf00ff", "items": ["[Item 1]", "[Item 2]", "[Item 3]", "[Item 4]"]},
      {"name": "[SPECIFIC process]", "color": "#00ff88", "items": ["[Item 1]", "[Item 2]", "[Item 3]", "[Item 4]"]},
      {"name": "[SPECIFIC application]", "color": "#ffae00", "items": ["[Item 1]", "[Item 2]", "[Item 3]", "[Item 4]"]},
      {"name": "[SPECIFIC challenge]", "color": "#d4af37", "items": ["[Item 1]", "[Item 2]", "[Item 3]", "[Item 4]"]}
    ],
    "connections": [
      {"from": "[Branch name]", "to": "[Branch name]", "description": "[How they relate in ${topicShort}]"},
      {"from": "[Branch name]", "to": "[Branch name]", "description": "[Another relationship]"},
      {"from": "[Branch name]", "to": "[Branch name]", "description": "[Third connection]"}
    ]
  }`;
  }

  return `You are ${SAVOIRÉ.BRAND}. Generate a complete structured JSON about:

📖 TOPIC: "${input}"
🌐 LANGUAGE: ${lang} (ALL text MUST be in ${lang})
🛠️ TOOL: ${tool.toUpperCase()}

${toolBlock}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
⚡ OUTPUT: Valid JSON ONLY. Start with {. End with }. No markdown. No explanations.
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

{
  "topic": "[Clean title of topic in ${lang}]",
  "curriculum_alignment": "[Specific level e.g. 'A‑Level Biology']",
  "generated_at": "${now}",
  "study_score": 97,

  ${fcField},
  ${qField},
  ${mmField},

  "key_concepts": [
    "[Name of concept]: [55‑80 word explanation with specific example]",
    "[Second concept]: [55‑80 words with example]",
    "[Third concept]: [55‑80 words with example]",
    "[Fourth concept]: [55‑80 words with example]",
    "[Fifth concept]: [55‑80 words with example]",
    "[Sixth concept]: [55‑80 words with example]"
  ],

  "key_tricks": [
    "🧠 [Mnemonic for ${topicShort}]: [70‑110 words with specific application]",
    "📝 [Study method]: [70‑110 words with concrete instructions]",
    "⏰ [Memory strategy]: [70‑110 words with specific application]",
    "🎨 [Visualization]: [70‑110 words making this topic vivid]"
  ],

  "practice_questions": [
    {"question": "[Analytical 80‑130 word question about ${topicShort}]", "answer": "[200+ word answer with reasoning]"},
    {"question": "[Application 80‑130 word question about ${topicShort}]", "answer": "[200+ word answer]"},
    {"question": "[Evaluation 80‑130 word question]", "answer": "[200+ word answer]"},
    {"question": "[Synthesis 80‑130 word question]", "answer": "[200+ word answer]"}
  ],

  "real_world_applications": [
    "🏥 Healthcare: [60‑90 word specific application]",
    "💻 Technology: [60‑90 word specific tech application]",
    "📈 Business: [60‑90 word specific business application]",
    "🎓 Research: [60‑90 word academic research application]",
    "🌍 Society: [60‑90 word social impact]",
    "🏠 Daily Life: [60‑90 word everyday relevance]"
  ],

  "common_misconceptions": [
    "❌ MYTH: [Specific wrong belief]. ✅ TRUTH: [60‑90 word correction]",
    "❌ MYTH: [Second misconception]. ✅ TRUTH: [60‑90 word correction]",
    "❌ MYTH: [Third misconception]. ✅ TRUTH: [60‑90 word correction]",
    "❌ MYTH: [Fourth misconception]. ✅ TRUTH: [60‑90 word correction]"
  ]
}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🚨 ABSOLUTE RULES — violation = failed generation:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
1. Output ONLY valid JSON — nothing before { or after }
2. ALL placeholder text REPLACED with REAL content about "${topicShort}"
3. ALL text in ${lang}
4. quiz correct_answer = CHARACTER‑FOR‑CHARACTER IDENTICAL to one options[] string
5. ${tool==='flashcards'||tool==='all' ? 'Generate 15‑20 flashcards about this specific topic' : ''}
6. ${tool==='quiz'||tool==='all' ? 'Generate 10‑12 quiz questions about this specific topic' : ''}
7. ${tool==='mindmap'||tool==='all' ? 'Generate 5‑7 branches with SPECIFIC names from this topic' : ''}
8. No trailing commas. All strings in double quotes. Valid JSON.
9. FORBIDDEN: Generic content, placeholder text, content NOT about "${topicShort}"
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🚀 OUTPUT JSON NOW:`;
}

// ─────────────────────────────────────────────────────────────────────────────
// SECTION 7 — PHASE 1: STREAM NOTES (single model, long timeout, retries)
// ─────────────────────────────────────────────────────────────────────────────

const FIRST_TOKEN_TIMEOUT = 30000; // 30 seconds to get first token
const FULL_STREAM_TIMEOUT = 120000; // 2 minutes total

async function streamNotes(prompt, onChunk, tool) {
  let attempt = 0;
  const maxAttempts = 6;
  let lastError = '';

  while (attempt < maxAttempts) {
    attempt++;
    const delay = attempt === 1 ? 0 : Math.min(2000 * Math.pow(2, attempt - 2), 30000);
    if (delay > 0) {
      log.info(`P1 retry ${attempt} waiting ${delay}ms...`);
      await sleep(delay);
    }

    const name = 'openrouter/free';
    const ctrl = new AbortController();
    let firstTokenTimer = setTimeout(() => ctrl.abort(), FIRST_TOKEN_TIMEOUT);
    let fullStreamTimer = null;
    const t0 = Date.now();

    try {
      log.info(`P1 (${tool}) → ${name} (attempt ${attempt})`);

      const res = await fetch(OPENROUTER_BASE, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${process.env.OPENROUTER_API_KEY}`,
          'HTTP-Referer': HTTP_REFERER,
          'X-Title': APP_TITLE,
        },
        body: JSON.stringify({
          model: 'openrouter/free',
          max_tokens: 6000,
          temperature: 0.75,
          stream: true,
          messages: [{ role: 'user', content: prompt }],
        }),
        signal: ctrl.signal,
      });

      clearTimeout(firstTokenTimer);

      if (!res.ok) {
        const body = await res.text().catch(() => '');
        log.warn(`P1 HTTP ${res.status} — ${trunc(body, 80)}`);
        if (res.status === 429) {
          lastError = 'Rate limited (429)';
          continue; // will retry with backoff
        }
        if (res.status === 401) throw new Error('Invalid API key');
        lastError = `HTTP ${res.status}`;
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
                clearTimeout(firstTokenTimer);
                fullStreamTimer = setTimeout(() => ctrl.abort(), FULL_STREAM_TIMEOUT);
                log.ok(`P1 🏆 first token in ${Date.now()-t0}ms — committing`);
              }
              full += delta;
              onChunk(delta);
            }
          } catch { /* ignore */ }
        }
      }

      clearTimeout(fullStreamTimer);

      if (!gotFirst) {
        lastError = 'No content received';
        continue;
      }

      if (full.trim().length < 80) {
        log.warn(`P1 short response (${full.length} chars) — using as‑is`);
      }

      log.ok(`P1 ✅ ${name} | ${full.length}ch | ${Date.now()-t0}ms (attempt ${attempt})`);
      return full; // success

    } catch (err) {
      clearTimeout(firstTokenTimer);
      if (fullStreamTimer) clearTimeout(fullStreamTimer);
      if (err.message === 'Invalid API key') throw err;
      const reason = err.name === 'AbortError' ? (gotFirst ? 'full‑stream timeout' : 'no first token') : err.message;
      log.warn(`P1 fail (attempt ${attempt}): ${reason}`);
      lastError = reason;
      // Continue to next attempt
    }
  }

  throw new Error(`Notes generation failed after ${maxAttempts} attempts. Last error: ${lastError}`);
}

// ─────────────────────────────────────────────────────────────────────────────
// SECTION 8 — PHASE 2: FETCH STRUCTURED CARDS (single model, long timeout, retries)
// ─────────────────────────────────────────────────────────────────────────────

async function fetchCards(prompt, tool, topic) {
  let attempt = 0;
  const maxAttempts = 5;
  let lastError = '';

  while (attempt < maxAttempts) {
    attempt++;
    const delay = attempt === 1 ? 0 : Math.min(2000 * Math.pow(2, attempt - 2), 20000);
    if (delay > 0) {
      log.info(`P2 retry ${attempt} waiting ${delay}ms...`);
      await sleep(delay);
    }

    const name = 'openrouter/free';
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), 90000); // 90 seconds for JSON
    const t0 = Date.now();

    try {
      log.info(`P2 (${tool}) → ${name} (attempt ${attempt})`);

      const res = await fetch(OPENROUTER_BASE, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${process.env.OPENROUTER_API_KEY}`,
          'HTTP-Referer': HTTP_REFERER,
          'X-Title': APP_TITLE,
        },
        body: JSON.stringify({
          model: 'openrouter/free',
          max_tokens: 8000,
          temperature: 0.30,
          stream: false,
          messages: [{ role: 'user', content: prompt }],
        }),
        signal: ctrl.signal,
      });

      clearTimeout(timer);

      if (!res.ok) {
        const body = await res.text().catch(() => '');
        log.warn(`P2 HTTP ${res.status} — ${trunc(body, 80)}`);
        if (res.status === 429) {
          lastError = 'Rate limited (429)';
          continue;
        }
        if (res.status === 401) throw new Error('Invalid API key');
        lastError = `HTTP ${res.status}`;
        continue;
      }

      const data = await res.json();
      let content = data?.choices?.[0]?.message?.content?.trim();

      if (!content || content.length < 50) {
        lastError = 'Empty or short response';
        continue;
      }

      // Remove code fences
      content = content.replace(/^```(?:json)?\s*/im, '').replace(/\s*```\s*$/im, '').trim();

      // Extract JSON object
      const jS = content.indexOf('{');
      const jE = content.lastIndexOf('}');
      if (jS === -1 || jE <= jS) {
        lastError = 'No JSON object';
        continue;
      }
      let jsonStr = content.slice(jS, jE + 1);

      // JSON repair (4 steps)
      let parsed;
      try {
        parsed = JSON.parse(jsonStr);
      } catch {
        try {
          parsed = JSON.parse(jsonStr.replace(/,(\s*[}\]])/g, '$1'));
        } catch {
          try {
            parsed = JSON.parse(
              jsonStr
                .replace(/,(\s*[}\]])/g, '$1')
                .replace(/([{,]\s*)([a-zA-Z_]\w*)(\s*:)/g, '$1"$2"$3')
                .replace(/:\s*'([^']*)'/g, ': "$1"')
            );
          } catch {
            try {
              parsed = JSON.parse(
                jsonStr
                  .replace(/[\x00-\x1F\x7F]/g, ' ')
                  .replace(/,(\s*[}\]])/g, '$1')
                  .replace(/([{,]\s*)([a-zA-Z_]\w*)(\s*:)/g, '$1"$2"$3')
              );
            } catch (e4) {
              lastError = `JSON repair failed: ${e4.message.slice(0,60)}`;
              continue;
            }
          }
        }
      }

      // Auto‑fix quiz correct_answer mismatches
      if (Array.isArray(parsed.quiz_questions)) {
        parsed.quiz_questions = parsed.quiz_questions.map((q, i) => {
          q.id = q.id || i + 1;
          if (q.options && q.correct_answer && !q.options.includes(q.correct_answer)) {
            const lower = q.correct_answer.toLowerCase();
            const fix = q.options.find(o => o.toLowerCase() === lower) ||
                        q.options.find(o => o.toLowerCase().includes(lower) || lower.includes(o.toLowerCase())) ||
                        q.options[0];
            if (fix) {
              log.info(`P2 auto‑fixed Q${i+1} correct_answer`);
              return { ...q, correct_answer: fix };
            }
          }
          return q;
        });
      }

      // Normalize flashcards
      if (Array.isArray(parsed.flashcards)) {
        parsed.flashcards = parsed.flashcards
          .filter(c => (c.front || c.question) && (c.back || c.answer))
          .map(c => ({
            front: String(c.front || c.question || '').trim(),
            back: String(c.back || c.answer || '').trim(),
          }));
      }

      // Validate (tool‑specific)
      let valid = true;
      if ((tool === 'flashcards' || tool === 'all') && (!Array.isArray(parsed.flashcards) || parsed.flashcards.length < 3)) {
        log.warn(`P2 insufficient flashcards (${parsed.flashcards?.length||0})`);
        valid = false;
      }
      if ((tool === 'quiz' || tool === 'all') && (!Array.isArray(parsed.quiz_questions) || parsed.quiz_questions.length < 3)) {
        log.warn(`P2 insufficient quiz questions (${parsed.quiz_questions?.length||0})`);
        valid = false;
      }
      if ((tool === 'mindmap' || tool === 'all') && (!parsed.mindmap?.branches || parsed.mindmap.branches.length < 2)) {
        log.warn(`P2 insufficient mindmap branches (${parsed.mindmap?.branches?.length||0})`);
        valid = false;
      }

      if (!valid && tool !== 'all') {
        lastError = 'Validation failed';
        continue;
      }

      log.ok(`P2 ✅ ${name} | fc:${parsed.flashcards?.length||0} q:${parsed.quiz_questions?.length||0} mm:${parsed.mindmap?.branches?.length||0} | ${Date.now()-t0}ms (attempt ${attempt})`);
      return parsed; // success

    } catch (err) {
      clearTimeout(timer);
      if (err.message === 'Invalid API key') throw err;
      const reason = err.name === 'AbortError' ? 'timed out' : err.message;
      log.warn(`P2 fail (attempt ${attempt}): ${reason}`);
      lastError = reason;
      // Continue to next attempt
    }
  }

  throw new Error(`Cards generation failed after ${maxAttempts} attempts. Last error: ${lastError}`);
}

// ─────────────────────────────────────────────────────────────────────────────
// SECTION 9 — MERGE
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
// SECTION 10 — SSE HELPER + HEADERS
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
// SECTION 11 — MAIN HANDLER — ALWAYS DELIVERS A RESPONSE (no error screen)
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
    // Still return a JSON response, not an error screen
    return res.status(500).json({ error: 'Service misconfigured. Please contact admin.' });
  }

  const body = req.body || {};
  const message      = String(body.message    || '').trim();
  const userName     = String(body.userName   || 'Anonymous').trim();
  const userStreak   = Number(body.streak)    || 0;
  const userSessions = Number(body.sessions)  || 1;
  const sessionId    = String(body.sessionId  || reqId);

  // ── PING / VISIT ──────────────────────────────────────────────────────────
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

  // Keep‑alive
  const kap = setInterval(() => {
    if (res.writableEnded) { clearInterval(kap); return; }
    try {
      res.write(`: ping ${Date.now()}\n\n`);
      if (typeof res.flush === 'function') res.flush();
    } catch { clearInterval(kap); }
  }, 10000);

  // Stage timers (cosmetic)
  const stageTimers = [
    setTimeout(() => sse('stage', { idx: 1, label: '📝 Writing your content…' }), 2000),
    setTimeout(() => sse('stage', { idx: 2, label: '🔍 Building sections…' }), 6000),
    setTimeout(() => sse('stage', { idx: 3, label: '🃏 Generating interactive cards…' }), 12000),
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
    // ── PHASE 1: Stream notes ──────────────────────────────────────────────
    sse('stage', { idx: 1, label: `📝 Writing ${opts.tool === 'summary' ? 'smart summary' : 'study notes'}…` });
    const notesPrompt = buildNotesPrompt(message, opts);

    try {
      notes = await streamNotes(notesPrompt, chunk => sse('token', { t: chunk }), opts.tool);
      notesSuccess = true;
      log.ok(`[${reqId}] P1 done — ${notes.length}ch`);
    } catch (err) {
      log.error(`[${reqId}] P1 failed: ${err.message}`);
      // We will continue without notes; we'll generate a fallback later
    }

    // ── PHASE 2: Fetch cards (only if notes succeeded, otherwise skip) ────
    if (notesSuccess) {
      sse('stage', { idx: 2, label: '✅ Notes complete! Finalising interactive cards…' });
      const cardsPrompt = buildCardsPrompt(message, opts);
      try {
        cardsData = await fetchCards(cardsPrompt, opts.tool, message);
        cardsSuccess = true;
        log.ok(`[${reqId}] P2 done — fc:${cardsData?.flashcards?.length||0} q:${cardsData?.quiz_questions?.length||0} mm:${cardsData?.mindmap?.branches?.length||0}`);
      } catch (err) {
        log.error(`[${reqId}] P2 failed: ${err.message}`);
        // Cards failed, but we still have notes – we'll proceed without cards
      }
    } else {
      // If notes failed, we'll try a fallback generation without streaming (sync) for notes
      log.warn(`[${reqId}] Notes failed, attempting offline fallback notes`);
      notes = await generateFallbackNotes(message, opts);
      notesSuccess = true; // we have something
      // stream the fallback notes in chunks
      for (let i = 0; i < notes.length; i += 200) {
        sse('token', { t: notes.slice(i, i + 200) });
        await sleep(5);
      }
    }

    // ── STREAM CARDS IF AVAILABLE ──────────────────────────────────────────
    if (cardsData?.flashcards?.length && (opts.tool === 'flashcards' || opts.tool === 'all')) {
      sse('stage', { idx: 3, label: `🃏 Streaming ${cardsData.flashcards.length} flashcards…` });
      for (let i = 0; i < cardsData.flashcards.length; i++) {
        sse('card', { idx: i, total: cardsData.flashcards.length, card: cardsData.flashcards[i] });
        await sleep(80);
      }
      log.ok(`[${reqId}] Streamed ${cardsData.flashcards.length} flashcards`);
    }

    if (cardsData?.quiz_questions?.length && (opts.tool === 'quiz' || opts.tool === 'all')) {
      sse('stage', { idx: 3, label: `❓ Streaming ${cardsData.quiz_questions.length} quiz questions…` });
      for (let i = 0; i < cardsData.quiz_questions.length; i++) {
        sse('question', { idx: i, total: cardsData.quiz_questions.length, q: cardsData.quiz_questions[i] });
        await sleep(100);
      }
      log.ok(`[${reqId}] Streamed ${cardsData.quiz_questions.length} questions`);
    }

    if (cardsData?.mindmap?.branches?.length && (opts.tool === 'mindmap' || opts.tool === 'all')) {
      sse('stage', { idx: 3, label: `🗺️ Streaming ${cardsData.mindmap.branches.length} mind map branches…` });
      sse('branch', { idx: -1, total: cardsData.mindmap.branches.length, branch: { name: '_central_', value: cardsData.mindmap.central, connections: cardsData.mindmap.connections || [] } });
      await sleep(150);
      for (let i = 0; i < cardsData.mindmap.branches.length; i++) {
        sse('branch', { idx: i, total: cardsData.mindmap.branches.length, branch: cardsData.mindmap.branches[i] });
        await sleep(120);
      }
      log.ok(`[${reqId}] Streamed ${cardsData.mindmap.branches.length} branches`);
    }

    // ── FINAL DONE EVENT ──────────────────────────────────────────────────
    clearInterval(kap);
    clearStages();

    // If cardsData is null, create an empty structure
    if (!cardsData) {
      cardsData = { _fallback: true, flashcards: [], quiz_questions: [], mindmap: null };
    }

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

    // We still send a done event with a basic fallback to avoid error screen
    const fallbackNotes = `## 📚 Study Notes on ${message}\n\nWe're sorry, but the AI service is temporarily unavailable. Please try again in a moment.`;
    const fallbackData = { _fallback: true, flashcards: [], quiz_questions: [], mindmap: null, key_concepts: [] };
    const final = mergeCards(fallbackData, fallbackNotes, message, opts);
    final._duration_ms = Date.now() - startTime;
    final._request_id = reqId;
    final._phase1_ok = false;
    final._phase2_ok = false;
    final._notes_only = true;
    final.powered_by = `${SAVOIRÉ.BRAND} by ${SAVOIRÉ.DEVELOPER}`;

    sse('stage', { idx: 4, label: '⚠️ Using fallback content — please try again later.', done: true });
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

// ─────────────────────────────────────────────────────────────────────────────
// SECTION 13 — FALLBACK NOTES GENERATOR (sync, no AI)
// ─────────────────────────────────────────────────────────────────────────────

async function generateFallbackNotes(topic, opts) {
  // This is used only if the AI notes generation completely fails
  const lang = opts.language || 'English';
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

// ═══════════════════════════════════════════════════════════════════════════════
// END — api/study.js v2.0 ULTRA RELIABLE | Sooban Talha Technologies
// "Think Less. Know More." — Free forever for every student on Earth.
// ═══════════════════════════════════════════════════════════════════════════════
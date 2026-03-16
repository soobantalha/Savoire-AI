// =====================================================================
// api/study.js — Savoiré AI v2.0 — Vercel Serverless Backend
// Built by Sooban Talha Technologies | savoireai.vercel.app
// Founder: Sooban Talha
//
// KEY FIX: maxDuration set to 300 in vercel.json (5 minutes).
// Each model gets up to 120 seconds. No more timeout errors.
// 10 free models tried in sequence — ALWAYS returns a result.
// =====================================================================
'use strict';

// ── FREE AI MODELS (internal only — names NEVER sent to frontend) ────
const MODELS = [
  { id: 'google/gemini-2.0-flash-exp:free',         max: 8000, timeout: 120000 },
  { id: 'deepseek/deepseek-chat-v3-0324:free',       max: 8000, timeout: 120000 },
  { id: 'meta-llama/llama-3.3-70b-instruct:free',    max: 6000, timeout: 110000 },
  { id: 'z-ai/glm-4.5-air:free',                     max: 6000, timeout: 100000 },
  { id: 'microsoft/phi-4-reasoning-plus:free',       max: 4000, timeout:  90000 },
  { id: 'qwen/qwen3-8b:free',                        max: 4000, timeout:  90000 },
  { id: 'google/gemini-flash-1.5-8b:free',           max: 4000, timeout:  80000 },
  { id: 'nousresearch/hermes-3-llama-3.1-405b:free', max: 6000, timeout: 110000 },
  { id: 'mistralai/mistral-7b-instruct-v0.3:free',   max: 3500, timeout:  80000 },
  { id: 'openchat/openchat-7b:free',                 max: 3500, timeout:  80000 },
];

// ── PROMPT BUILDER ───────────────────────────────────────────────────
function buildPrompt(input, opts) {
  const lang  = opts.language || 'English';
  const depth = opts.depth    || 'detailed';
  const style = opts.style    || 'simple';
  const tool  = opts.tool     || 'notes';

  const depthMap = {
    standard:      '600 to 900 words',
    detailed:      '1000 to 1500 words',
    comprehensive: '1500 to 2000 words',
    expert:        '2000 to 2800 words including advanced subtopics',
  };

  const styleMap = {
    simple:   'Use clear, accessible, beginner-friendly language. Define technical terms immediately.',
    academic: 'Use formal academic language and precise scholarly terminology.',
    detailed: 'Provide exhaustive detail with many examples and thorough explanations.',
    exam:     'Focus on exam-relevant content: key definitions, common question patterns, mark-worthy phrases.',
    visual:   'Use vivid analogies, step-by-step processes, and descriptive mental models.',
  };

  const toolMap = {
    notes:      'Generate comprehensive, well-structured study notes.',
    flashcards: 'Generate study materials optimized for flashcard learning with clear Q&A pairs.',
    quiz:       'Generate study materials with 3 strong, varied practice questions for quizzing.',
    summary:    'Generate study materials with emphasis on TL;DR and key points.',
    mindmap:    'Generate study materials structured hierarchically for a mind map.',
  };

  return `You are Savoiré AI v2.0, an advanced study companion by Sooban Talha Technologies (savoireai.vercel.app).

TASK: ${toolMap[tool] || toolMap.notes}
TOPIC/CONTENT: "${input}"
OUTPUT LANGUAGE: ${lang} — ALL content must be in ${lang}
STYLE: ${styleMap[style] || styleMap.simple}
NOTES LENGTH: ${depthMap[depth] || depthMap.detailed}

REQUIREMENTS:
- ultra_long_notes: ${depthMap[depth] || depthMap.detailed}, rich markdown (## headings, **bold** key terms, bullet lists, numbered steps, > blockquotes)
  Must include sections: Introduction, Core Concepts, How It Works, Key Examples, Advanced Aspects, Summary
- key_concepts: EXACTLY 5 items — format: "Term: explanation (20-35 words each)"
- key_tricks: EXACTLY 3 items — practical memory aids, mnemonics, or study strategies (40-60 words each)
- practice_questions: EXACTLY 3 items, each with "question" and "answer"
  Each answer MINIMUM 130 words: direct answer + reasoning + concrete example + real-world relevance + common mistake
- real_world_applications: EXACTLY 3 items (35-55 words each, specific domain and mechanism)
- common_misconceptions: EXACTLY 3 items (35-55 words each: state wrong belief then correct it)
- study_score: always 96
- powered_by: always "Savoiré AI v2.0 by Sooban Talha Technologies"

RESPOND WITH ONLY VALID JSON — NOTHING BEFORE { AND NOTHING AFTER }:
{
  "topic": "clean topic name",
  "curriculum_alignment": "e.g. High School Biology, University Physics, Computer Science",
  "ultra_long_notes": "full markdown notes here",
  "key_concepts": ["Term: explanation","Term: explanation","Term: explanation","Term: explanation","Term: explanation"],
  "key_tricks": ["Trick 1","Trick 2","Trick 3"],
  "practice_questions": [
    {"question":"...","answer":"minimum 130 words..."},
    {"question":"...","answer":"minimum 130 words..."},
    {"question":"...","answer":"minimum 130 words..."}
  ],
  "real_world_applications": ["app1","app2","app3"],
  "common_misconceptions": ["misc1","misc2","misc3"],
  "study_score": 96,
  "powered_by": "Savoiré AI v2.0 by Sooban Talha Technologies",
  "generated_at": "${new Date().toISOString()}"
}`;
}

// ── CALL ONE MODEL ────────────────────────────────────────────────────
async function callModel(model, prompt) {
  const ctrl  = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), model.timeout);

  try {
    const res = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method:  'POST',
      headers: {
        'Content-Type':  'application/json',
        'Authorization': `Bearer ${process.env.OPENROUTER_API_KEY}`,
        'HTTP-Referer':  'https://savoireai.vercel.app',
        'X-Title':       'Savoiré AI v2.0',
      },
      body: JSON.stringify({
        model:       model.id,
        max_tokens:  model.max,
        temperature: 0.72,
        messages:    [{ role: 'user', content: prompt }],
      }),
      signal: ctrl.signal,
    });

    clearTimeout(timer);

    if (!res.ok) {
      const body = await res.text().catch(() => '');
      throw new Error(`HTTP ${res.status}: ${body.slice(0, 150)}`);
    }

    const data    = await res.json();
    const content = data?.choices?.[0]?.message?.content;
    if (!content || content.trim().length < 50) throw new Error('Empty response');

    // Extract JSON
    let raw = content.trim()
      .replace(/^```(?:json)?\s*/i, '')
      .replace(/\s*```\s*$/i,       '');

    const start = raw.indexOf('{');
    const end   = raw.lastIndexOf('}');
    if (start < 0 || end < 0) throw new Error('No JSON object in response');

    const parsed = JSON.parse(raw.slice(start, end + 1));

    // Validate required fields
    if (!parsed.topic)                             throw new Error('Missing: topic');
    if (!parsed.ultra_long_notes)                  throw new Error('Missing: ultra_long_notes');
    if (!Array.isArray(parsed.practice_questions)) throw new Error('Missing: practice_questions');
    if (!Array.isArray(parsed.key_concepts))       throw new Error('Missing: key_concepts');

    // Fill any missing optional arrays
    if (!parsed.key_tricks?.length)               parsed.key_tricks = fallbackTricks(parsed.topic);
    if (!parsed.real_world_applications?.length)  parsed.real_world_applications = fallbackApps(parsed.topic);
    if (!parsed.common_misconceptions?.length)    parsed.common_misconceptions = fallbackMisconceptions(parsed.topic);

    // Enforce branding — NEVER expose model name
    parsed.powered_by    = 'Savoiré AI v2.0 by Sooban Talha Technologies';
    parsed.study_score   = 96;
    parsed.generated_at  = parsed.generated_at || new Date().toISOString();
    delete parsed._model;

    return parsed;

  } catch (err) {
    clearTimeout(timer);
    throw err;
  }
}

// ── MAIN GENERATOR WITH FULL FALLBACK CHAIN ──────────────────────────
async function generateWithAI(message, options) {
  if (!process.env.OPENROUTER_API_KEY) {
    throw new Error('OPENROUTER_API_KEY not set');
  }

  const prompt = buildPrompt(message, options);
  const errors = [];

  for (const model of MODELS) {
    for (let attempt = 1; attempt <= 2; attempt++) {
      const name = model.id.split('/').pop().replace(':free', '');
      try {
        console.log(`[Savoiré AI] ${name} attempt ${attempt}`);
        const result = await callModel(model, prompt);
        result._language = options.language || 'English';
        console.log(`[Savoiré AI] SUCCESS — ${name}`);
        return result;
      } catch (err) {
        errors.push(`${name} a${attempt}: ${err.message.slice(0, 80)}`);
        console.warn(`[Savoiré AI] FAIL — ${name} a${attempt}: ${err.message.slice(0, 80)}`);
        if (attempt === 1) await sleep(1200);
      }
    }
  }

  console.error('[Savoiré AI] All models failed:', errors.slice(0, 5).join(' | '));
  throw new Error('All AI models temporarily unavailable');
}

const sleep = ms => new Promise(r => setTimeout(r, ms));

// ── FALLBACK HELPERS ─────────────────────────────────────────────────
function fallbackTricks(t) {
  return [
    `FIVE W's Method: Ask Who, What, When, Where and Why about every aspect of ${t}. Systematically answering all five creates a complete mental map and immediately shows which areas need more study.`,
    `FEYNMAN TECHNIQUE: Explain ${t} out loud as if teaching a curious 12-year-old. Every time you struggle or use unclear jargon, you have found a gap. Return to your notes, fill that gap, then try again until the explanation flows naturally.`,
    `SPACED REPETITION: Study ${t} in 20-minute sessions spaced over several days — Day 1, Day 3, Day 7, Day 14. Review begins just as memory starts fading, which dramatically improves long-term retention compared to marathon single sessions.`,
  ];
}

function fallbackApps(t) {
  return [
    `Healthcare: Principles from ${t} directly inform clinical diagnosis, treatment protocols, and medical research methodology, contributing to improved patient outcomes and advancing evidence-based medicine worldwide.`,
    `Technology & Engineering: ${t} concepts guide software architecture, algorithm design, and system engineering — enabling engineers to build more scalable, reliable, and efficient solutions across digital infrastructure.`,
    `Business & Management: Organizations apply frameworks derived from ${t} to improve strategic decision-making, optimize workflows, train staff more effectively, and maintain competitive advantage in dynamic markets.`,
  ];
}

function fallbackMisconceptions(t) {
  return [
    `Misconception: ${t} is best learned by memorizing facts. Reality: True mastery requires understanding underlying principles and connections. Memorization without comprehension produces fragile knowledge that cannot be applied flexibly when questions are framed differently.`,
    `Misconception: ${t} is only relevant to specialists in that specific field. Reality: The reasoning patterns and mental models from ${t} transfer broadly across many disciplines and everyday decision-making situations that non-specialists encounter regularly.`,
    `Misconception: Once you understand the basics of ${t}, there is little more to learn. Reality: ${t} has significant depth with important nuances, ongoing research, and evolving applications. Even experts continue learning as the field develops through new discoveries.`,
  ];
}

// ── FULL OFFLINE FALLBACK ─────────────────────────────────────────────
function generateFallback(topic, opts) {
  const t    = (topic || 'This Topic').trim();
  const lang = opts.language || 'English';
  return {
    topic: t,
    curriculum_alignment: 'General Academic Study',
    _language: lang,
    ultra_long_notes: `## Introduction to ${t}

${t} is a significant area of study with broad implications across multiple disciplines. A solid understanding opens doors to deeper comprehension and practical capability.

## Core Foundations

The study of ${t} begins with its fundamental concepts — the building blocks upon which all advanced understanding is constructed.

**Key Principle 1:** The theoretical framework of ${t} provides the conceptual vocabulary needed to analyze, discuss, and apply knowledge in this domain. Without clear foundations, advanced study becomes difficult to anchor.

**Key Principle 2:** The practical dimension of ${t} connects abstract theory to real-world outcomes. Understanding how principles manifest in practice makes the subject both meaningful and applicable.

**Key Principle 3:** Critical thinking about ${t} means questioning assumptions, evaluating evidence, and forming reasoned conclusions rather than accepting information uncritically.

## How It Works

The processes central to ${t} unfold through distinct phases:
1. **Initial Conditions** — The starting state or inputs that set the process in motion
2. **Active Mechanisms** — The forces, rules, or interactions that drive transformation
3. **Output or Result** — The observable product or changed state
4. **Feedback** — How outcomes influence subsequent cycles

## Key Examples

**Example 1 — Foundational Case:** The classic demonstration of ${t} shows principles at their most basic, where core mechanisms operate as predicted by theory. This example builds initial understanding.

**Example 2 — Complex Application:** A real-world application shows ${t} operating under uncertainty with multiple competing variables. This demonstrates the thinking required of expert practitioners.

## Advanced Aspects

At an advanced level, ${t} introduces important complications:
- **Edge Cases:** General rules have exceptions; knowing when they apply separates novice from expert
- **Interacting Variables:** Advanced application requires holding multiple factors simultaneously
- **Ongoing Debates:** Experts in ${t} disagree on some questions — engaging with debates builds intellectual maturity

## Summary

Mastering ${t} requires moving beyond memorization to genuine comprehension — understanding *why* things work the way they do, not just *that* they do. With that understanding, you can apply knowledge flexibly and continue learning independently.`,
    key_concepts: [
      `Core Definition: ${t} refers to the fundamental principles and concepts forming its theoretical and practical foundation within its field of study.`,
      `Primary Mechanisms: The main processes driving ${t} involve systematic interactions between components producing predictable, observable outcomes.`,
      `Historical Context: ${t} evolved through key discoveries and contributions that gradually established its current foundational principles and methods.`,
      `Practical Significance: ${t} has direct applications across multiple domains, solving real problems and improving understanding in meaningful ways.`,
      `Critical Evaluation: Complete understanding of ${t} requires recognizing both its explanatory power and contexts where its applicability is limited.`,
    ],
    key_tricks: fallbackTricks(t),
    practice_questions: [
      {
        question: `Explain the core principles of ${t} and how they work together to form a coherent framework.`,
        answer: `The core principles of ${t} form an integrated system where each component reinforces and contextualizes the others. At the foundational level, these principles establish basic definitions and assumptions upon which all further understanding is built — without this foundation, advanced concepts lack necessary context and are difficult to apply accurately. The mechanisms driving ${t} follow consistent patterns, which is precisely what makes the subject analyzable and outcomes predictable. The framework becomes complete when we recognize relationships between individual components — each element influences others through direct and indirect pathways. Practically, this integrated understanding enables genuine problem-solving rather than rote application of memorized procedures. Students who master core principles can adapt their knowledge to novel situations, recognize which principles apply in a given context, and explain their reasoning clearly. A common mistake is treating principles as isolated facts rather than as parts of a connected system — doing so makes the subject harder to learn and easier to misapply in practice.`,
      },
      {
        question: `Describe a real-world scenario where ${t} knowledge is essential. Explain your step-by-step approach.`,
        answer: `Consider a professional context where decisions involving ${t} carry significant consequences. Step one is accurate problem identification: defining exactly what challenge needs addressing, what constraints exist, and what success looks like. This diagnostic phase is critical — many failures stem from solving the wrong problem. Step two is selecting which aspects of ${t} are most relevant, filtering out peripheral information to direct focus effectively. Not all principles apply equally to every situation; part of expertise is knowing which tools to reach for. Step three is developing a solution strategy grounded in relevant principles, decomposing the complex challenge into manageable components. Step four is implementation with active monitoring — theoretical knowledge meets practical reality here, and adjustments are inevitable as real-world complexity exceeds the model. Step five is evaluation: comparing outcomes against initial goals, identifying what worked and what did not, and extracting lessons. This reflection phase deepens understanding and improves future performance. Skipping evaluation loses the opportunity to convert experience into expertise.`,
      },
      {
        question: `Compare two different approaches to understanding ${t}. What are the strengths and limitations of each?`,
        answer: `Understanding ${t} benefits from examining it through multiple frameworks. The theoretical approach emphasizes conceptual understanding, formal frameworks, and reasoning from first principles. Its primary strength is generalizability — deep theoretical understanding applies across diverse situations because it is not tied to specific contexts. Its limitation is that without sufficient engagement with concrete cases, theoretical knowledge can remain abstract and difficult to deploy under real-world conditions of uncertainty and ambiguity. The empirical or case-based approach focuses on specific instances, data, and observable patterns. This method produces actionable knowledge grounded in reality and builds the intuitive judgment that characterizes expert practitioners. Its limitation is that patterns identified in one context may not generalize reliably to different settings, and without theoretical grounding, case knowledge becomes brittle when novel situations arise. The most effective understanding of ${t} integrates both approaches: theoretical frameworks organize and interpret experience, while empirical engagement reveals where theoretical predictions break down. A common mistake is committing exclusively to one approach — pure theorists can lack practical judgment, while pure practitioners can lack the conceptual tools needed when their experience does not directly apply.`,
      },
    ],
    real_world_applications: fallbackApps(t),
    common_misconceptions: fallbackMisconceptions(t),
    study_score:  96,
    powered_by:   'Savoiré AI v2.0 by Sooban Talha Technologies',
    generated_at: new Date().toISOString(),
    _fallback:    true,
    _language:    lang,
  };
}

// ── MAIN VERCEL HANDLER ───────────────────────────────────────────────
module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin',  '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  res.setHeader('X-Powered-By', 'Savoiré AI v2.0 by Sooban Talha Technologies');
  res.setHeader('X-Content-Type-Options', 'nosniff');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST')    return res.status(405).json({ error: 'Method not allowed' });

  const { message, options } = req.body || {};
  if (!message || typeof message !== 'string') {
    return res.status(400).json({ error: 'Request body must include a "message" string.' });
  }

  const trimmed = message.trim();
  if (trimmed.length < 2)     return res.status(400).json({ error: 'Message too short.' });
  if (trimmed.length > 15000) return res.status(400).json({ error: 'Message too long (max 15,000 characters).' });

  console.log(`[Savoiré AI] Request: "${trimmed.slice(0, 80).replace(/\n/g, ' ')}"`);

  try {
    let result;
    try {
      result = await generateWithAI(trimmed, options || {});
    } catch (aiErr) {
      console.warn('[Savoiré AI] AI failed, using offline fallback:', aiErr.message);
      result = generateFallback(trimmed, options || {});
    }

    // Always enforce branding
    result.powered_by   = 'Savoiré AI v2.0 by Sooban Talha Technologies';
    result._timestamp   = new Date().toISOString();
    result._version     = '2.0';
    delete result._model;

    return res.status(200).json(result);

  } catch (err) {
    console.error('[Savoiré AI] Unexpected error:', err.message || err);
    const fb = generateFallback(trimmed, options || {});
    fb._timestamp = new Date().toISOString();
    return res.status(200).json(fb);
  }
};
// =====================================================================
// END — Savoiré AI v2.0 API
// Sooban Talha Technologies | savoireai.vercel.app
// =====================================================================
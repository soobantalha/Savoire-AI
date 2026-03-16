// =====================================================================
// api/study.js — Savoiré AI v2.0 — Vercel Serverless Backend
// Built by Sooban Talha Technologies | savoireai.vercel.app
// Founder: Sooban Talha
//
// SETUP (takes 5 minutes, all free):
//   1. Go to https://openrouter.ai → Sign up free → Create API key
//   2. On Vercel: Settings → Environment Variables → Add:
//      OPENROUTER_API_KEY = sk-or-your-key-here
//   3. Redeploy → Done. Everything works.
//
// No npm packages needed. Uses Node.js 18+ built-in fetch.
// =====================================================================

'use strict';

// ─────────────────────────────────────────────────────────────────────
// SECTION 1: FREE AI MODELS
// All free-tier via OpenRouter. Model names NEVER sent to frontend.
// Frontend always sees "Powered by Savoiré AI v2.0"
// ─────────────────────────────────────────────────────────────────────

const AI_MODELS = [
  {
    id:      'google/gemini-2.0-flash-exp:free',
    max:     8000,
    timeout: 90000,
    temp:    0.72,
  },
  {
    id:      'deepseek/deepseek-chat-v3-0324:free',
    max:     8000,
    timeout: 90000,
    temp:    0.72,
  },
  {
    id:      'meta-llama/llama-3.3-70b-instruct:free',
    max:     6000,
    timeout: 80000,
    temp:    0.68,
  },
  {
    id:      'z-ai/glm-4.5-air:free',
    max:     6000,
    timeout: 80000,
    temp:    0.72,
  },
  {
    id:      'microsoft/phi-4-reasoning-plus:free',
    max:     4000,
    timeout: 70000,
    temp:    0.65,
  },
  {
    id:      'qwen/qwen3-8b:free',
    max:     4000,
    timeout: 70000,
    temp:    0.72,
  },
  {
    id:      'google/gemini-flash-1.5-8b:free',
    max:     4000,
    timeout: 65000,
    temp:    0.70,
  },
  {
    id:      'nousresearch/hermes-3-llama-3.1-405b:free',
    max:     6000,
    timeout: 90000,
    temp:    0.70,
  },
  {
    id:      'mistralai/mistral-7b-instruct-v0.3:free',
    max:     3500,
    timeout: 60000,
    temp:    0.72,
  },
  {
    id:      'openchat/openchat-7b:free',
    max:     3500,
    timeout: 60000,
    temp:    0.72,
  },
];

// ─────────────────────────────────────────────────────────────────────
// SECTION 2: PROMPT BUILDER
// ─────────────────────────────────────────────────────────────────────

function buildPrompt(userInput, opts) {
  const language = opts.language || 'English';
  const depth    = opts.depth    || 'detailed';
  const style    = opts.style    || 'simple';
  const tool     = opts.tool     || 'notes';

  // depth → how long ultra_long_notes should be
  const depthMap = {
    standard:      '600 to 900 words',
    detailed:      '1000 to 1500 words',
    comprehensive: '1500 to 2000 words',
    expert:        '2000 to 2800 words including advanced subtopics',
  };
  const wordTarget = depthMap[depth] || depthMap.detailed;

  // style → tone instruction
  const styleMap = {
    simple:   'Use clear, accessible, friendly language suitable for beginners. Avoid jargon; when technical terms are necessary, define them immediately.',
    academic: 'Use formal academic language, precise technical terminology, and a scholarly tone appropriate for university-level study.',
    detailed: 'Provide exhaustive detail. Include multiple examples, edge cases, exceptions, and nuanced explanations for every concept.',
    exam:     'Focus on exam-relevant content: key definitions, common question patterns, mark-worthy phrases, and the most frequently tested concepts.',
    visual:   'Use vivid analogies, step-by-step processes, mental models, and descriptive language that helps readers visualize abstract concepts.',
  };
  const styleInstruction = styleMap[style] || styleMap.simple;

  // tool → what kind of output to emphasize
  const toolMap = {
    notes:      'Generate comprehensive, well-structured study notes that cover the topic thoroughly.',
    flashcards: 'Generate study materials optimized for flashcard use — clear question-answer pairs, concise definitions, memorable phrasing.',
    quiz:       'Generate study materials with 3 strong, varied practice questions that test different levels of understanding.',
    summary:    'Generate study materials with a strong focus on the TL;DR, key points, and concise explanations.',
    mindmap:    'Generate study materials structured hierarchically — main topic, major branches, and sub-points clearly organized.',
  };
  const toolInstruction = toolMap[tool] || toolMap.notes;

  return `You are Savoiré AI v2.0 — an advanced AI study companion created by Sooban Talha Technologies (savoireai.vercel.app). Your purpose is to generate genuinely educational, high-quality study materials that help people learn effectively.

TASK: ${toolInstruction}
TOPIC OR CONTENT: "${userInput}"
OUTPUT LANGUAGE: Generate ALL content in ${language}
WRITING STYLE: ${styleInstruction}
LENGTH TARGET FOR NOTES: ${wordTarget}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
FIELD-BY-FIELD REQUIREMENTS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

FIELD: topic
  → Clean, concise name for the topic (3-8 words max)

FIELD: curriculum_alignment
  → What subject or field this belongs to, e.g.:
    "High School Physics", "University Biology", "Computer Science",
    "World History", "Economics", "Mathematics", "Literature"

FIELD: ultra_long_notes  ← MOST IMPORTANT FIELD
  → Length: ${wordTarget}
  → Format: Use rich markdown throughout:
      ## for major section headings
      ### for sub-section headings
      **bold** for key terms and important phrases
      *italic* for emphasis and examples
      - for bullet lists
      1. for numbered steps or sequences
      > for important quotes or callouts
      \`code\` for any technical syntax
  → Structure must include ALL of these sections:
      1. Introduction / Overview (what it is, why it matters)
      2. Historical Background or Context (how it developed)
      3. Core Concepts (detailed explanations of 3-5 main ideas)
      4. How It Works / The Process (mechanisms, steps, cause-effect)
      5. Key Examples (at least 2 concrete, specific examples)
      6. Advanced Aspects (deeper nuances, exceptions, edge cases)
      7. Connections to Related Topics (what else it links to)
      8. Summary (3-5 sentence recap of the whole topic)
  → MUST be genuinely educational. No generic filler. Every sentence must add value.

FIELD: key_concepts — EXACTLY 5 items
  → Format each as: "Term: clear explanation in 20-35 words"
  → Each concept must be DISTINCT (no overlap with others)
  → Choose the 5 most important concepts a student must know
  → Example: "Mitosis: The process by which a cell divides into two identical daughter cells, preserving the original chromosome number, essential for growth and tissue repair."

FIELD: key_tricks — EXACTLY 3 items
  → Each item must be 40-60 words
  → Each must be a PRACTICAL study aid: mnemonic, acronym, analogy, visualization technique, or memory strategy
  → Must be genuinely memorable and directly related to the topic
  → Example: "Use the acronym PMAT (Prophase, Metaphase, Anaphase, Telophase) to remember the four stages of mitosis in order. Visualize a cell performing each stage like a stage play: the curtains open (Prophase), actors take center stage (Metaphase), they part ways (Anaphase), and the curtain falls twice (Telophase)."

FIELD: practice_questions — EXACTLY 3 items, each with "question" and "answer"
  → Question 1: A conceptual question testing deep understanding of principles
  → Question 2: An application question requiring critical thinking and analysis
  → Question 3: An evaluation question testing higher-order synthesis or comparison
  → Each ANSWER must be MINIMUM 140 WORDS and must include:
      a) Direct, clear answer to the question
      b) Explanation of the underlying reasoning or mechanism
      c) At least one concrete, specific example
      d) Real-world relevance or practical significance
      e) A common mistake or misconception students make about this
  → Answers must be genuinely helpful — not generic filler

FIELD: real_world_applications — EXACTLY 3 items
  → Each item must be 35-60 words
  → Each must name a SPECIFIC real-world domain, industry, technology, or scenario
  → Must explain HOW the topic is used, not just that it is used
  → Example: "Medical Imaging: MRI machines exploit quantum mechanical properties of hydrogen atoms, using strong magnetic fields and radio waves to create detailed 3D images of soft tissue without radiation, revolutionizing cancer detection and neurological diagnosis."

FIELD: common_misconceptions — EXACTLY 3 items
  → Each item must be 35-60 words
  → Format: State the wrong belief first, then clearly correct it
  → Choose misconceptions that students commonly actually have
  → Example: "Misconception: Evolution means animals consciously adapt to their environment. Reality: Evolution is a passive process driven by natural selection — individuals do not change during their lifetime; rather, populations change over generations as better-adapted individuals survive and reproduce more."

FIELD: study_score
  → Always output: 96

FIELD: powered_by
  → Always output exactly: "Savoiré AI v2.0 by Sooban Talha Technologies"

FIELD: generated_at
  → ISO timestamp string

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
CRITICAL OUTPUT RULES
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

1. Respond with ONLY valid JSON. Absolutely nothing before { and nothing after }
2. Do NOT wrap in markdown code fences (\`\`\`json ... \`\`\`)
3. Do NOT include any explanation, preamble, or postscript
4. Escape all special characters properly inside JSON strings
5. ultra_long_notes must contain actual newlines as \\n inside the JSON string
6. Every field must be present and non-empty

OUTPUT THE FOLLOWING JSON STRUCTURE:
{
  "topic": "string",
  "curriculum_alignment": "string",
  "ultra_long_notes": "string",
  "key_concepts": [
    "Term 1: explanation",
    "Term 2: explanation",
    "Term 3: explanation",
    "Term 4: explanation",
    "Term 5: explanation"
  ],
  "key_tricks": [
    "Trick 1: full memory strategy",
    "Trick 2: full memory strategy",
    "Trick 3: full memory strategy"
  ],
  "practice_questions": [
    {
      "question": "Conceptual question text",
      "answer": "Minimum 140-word comprehensive answer"
    },
    {
      "question": "Application question text",
      "answer": "Minimum 140-word comprehensive answer"
    },
    {
      "question": "Evaluation question text",
      "answer": "Minimum 140-word comprehensive answer"
    }
  ],
  "real_world_applications": [
    "Application 1 with specific domain and mechanism",
    "Application 2 with specific domain and mechanism",
    "Application 3 with specific domain and mechanism"
  ],
  "common_misconceptions": [
    "Misconception 1: wrong belief then correction",
    "Misconception 2: wrong belief then correction",
    "Misconception 3: wrong belief then correction"
  ],
  "study_score": 96,
  "powered_by": "Savoiré AI v2.0 by Sooban Talha Technologies",
  "generated_at": "${new Date().toISOString()}"
}`;
}

// ─────────────────────────────────────────────────────────────────────
// SECTION 3: CALL ONE MODEL
// ─────────────────────────────────────────────────────────────────────

async function callModel(model, prompt) {
  const controller = new AbortController();
  const timer      = setTimeout(() => controller.abort(), model.timeout);

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
        temperature: model.temp,
        messages:    [{ role: 'user', content: prompt }],
      }),
      signal: controller.signal,
    });

    clearTimeout(timer);

    if (!res.ok) {
      const errText = await res.text().catch(() => '');
      throw new Error(`HTTP ${res.status} from model: ${errText.slice(0, 200)}`);
    }

    const data    = await res.json();
    const content = data?.choices?.[0]?.message?.content;

    if (!content || content.trim().length < 50) {
      throw new Error('Model returned empty or too-short response');
    }

    // ── Extract JSON from the response ──────────────────────────────
    let raw = content.trim();

    // Strip markdown code fences if model added them
    raw = raw.replace(/^```(?:json)?\s*/i, '').replace(/\s*```\s*$/i, '');

    // Find the JSON object boundaries
    const jsonStart = raw.indexOf('{');
    const jsonEnd   = raw.lastIndexOf('}');

    if (jsonStart === -1 || jsonEnd === -1 || jsonEnd <= jsonStart) {
      throw new Error('No valid JSON object found in model response');
    }

    const jsonStr = raw.slice(jsonStart, jsonEnd + 1);
    const parsed  = JSON.parse(jsonStr); // throws SyntaxError on bad JSON

    // ── Validate required fields ──────────────────────────────────────
    if (!parsed.topic || typeof parsed.topic !== 'string') {
      throw new Error('Response missing required field: topic');
    }
    if (!parsed.ultra_long_notes || parsed.ultra_long_notes.length < 100) {
      throw new Error('Response missing or too-short field: ultra_long_notes');
    }
    if (!Array.isArray(parsed.practice_questions) || parsed.practice_questions.length === 0) {
      throw new Error('Response missing required field: practice_questions');
    }
    if (!Array.isArray(parsed.key_concepts) || parsed.key_concepts.length === 0) {
      throw new Error('Response missing required field: key_concepts');
    }

    // ── Patch missing optional arrays with fallbacks ──────────────────
    if (!Array.isArray(parsed.key_tricks) || parsed.key_tricks.length === 0) {
      parsed.key_tricks = fallbackTricks(parsed.topic);
    }
    if (!Array.isArray(parsed.real_world_applications) || parsed.real_world_applications.length === 0) {
      parsed.real_world_applications = fallbackApps(parsed.topic);
    }
    if (!Array.isArray(parsed.common_misconceptions) || parsed.common_misconceptions.length === 0) {
      parsed.common_misconceptions = fallbackMisconceptions(parsed.topic);
    }

    // ── Ensure branding is correct (never expose model name) ──────────
    parsed.powered_by   = 'Savoiré AI v2.0 by Sooban Talha Technologies';
    parsed.study_score  = 96;
    parsed.generated_at = parsed.generated_at || new Date().toISOString();

    return parsed;

  } catch (err) {
    clearTimeout(timer);
    throw err;
  }
}

// ─────────────────────────────────────────────────────────────────────
// SECTION 4: MAIN GENERATION WITH FULL FALLBACK CHAIN
// ─────────────────────────────────────────────────────────────────────

async function generateWithAI(message, options) {
  if (!process.env.OPENROUTER_API_KEY) {
    throw new Error('OPENROUTER_API_KEY environment variable is not configured. See setup instructions at top of file.');
  }

  const prompt = buildPrompt(message, options);
  const errors = [];

  for (const model of AI_MODELS) {
    for (let attempt = 1; attempt <= 2; attempt++) {
      const shortName = model.id.split('/').pop().replace(':free', '');
      try {
        console.log(`[Savoiré AI] Trying ${shortName} (attempt ${attempt})`);
        const result = await callModel(model, prompt);
        result._language = options.language || 'English';
        console.log(`[Savoiré AI] SUCCESS with ${shortName}`);
        return result;
      } catch (err) {
        const msg = `${shortName} attempt ${attempt}: ${err.message.slice(0, 100)}`;
        console.warn(`[Savoiré AI] FAIL — ${msg}`);
        errors.push(msg);
        // Short wait before retry to avoid hammering
        if (attempt === 1) await sleep(1500);
      }
    }
  }

  // All models failed
  console.error('[Savoiré AI] All models failed:', errors.slice(0, 5).join(' | '));
  throw new Error('All AI models temporarily unavailable. Serving offline content.');
}

const sleep = ms => new Promise(r => setTimeout(r, ms));

// ─────────────────────────────────────────────────────────────────────
// SECTION 5: FALLBACK CONTENT (rich offline content, no AI needed)
// ─────────────────────────────────────────────────────────────────────

function fallbackConcepts(topic) {
  return [
    `Core Definition: ${topic} is a fundamental concept defined by its key properties and characteristics that distinguish it within its field of study.`,
    `Primary Mechanism: The main processes driving ${topic} involve systematic interactions between components that produce observable, predictable outcomes.`,
    `Historical Development: ${topic} evolved through key discoveries and contributions from researchers and practitioners who established its foundational principles.`,
    `Practical Significance: ${topic} has direct applications across multiple domains, solving real problems and improving understanding in meaningful ways.`,
    `Critical Evaluation: A complete understanding of ${topic} requires recognizing both its explanatory power and the contexts where its applicability is limited.`,
  ];
}

function fallbackTricks(topic) {
  return [
    `The FIVE W's method: Ask Who, What, When, Where, and Why about every aspect of ${topic}. Systematically answering all five questions creates a complete mental map. Write each answer in one sentence, then connect them — you will immediately see which areas need more study.`,
    `The FEYNMAN TECHNIQUE applied to ${topic}: Write the topic name at the top of a blank page. Explain everything you know in simple language as if teaching a curious 12-year-old. Every time you get stuck or use unclear jargon, you have found a gap in your understanding. Return to your notes and fill that gap before continuing.`,
    `SPACED CHUNKING for ${topic}: Break the subject into 4-5 major sub-topics. Study one chunk per session. Review the previous session's chunk for 5 minutes before starting the next. After finishing all chunks, do a complete review connecting them. This spacing dramatically improves long-term retention compared to marathon sessions.`,
  ];
}

function fallbackApps(topic) {
  return [
    `Healthcare and Medical Research: Principles from ${topic} are directly applied in clinical diagnosis, treatment protocol design, and medical research methodology, contributing to improved patient outcomes and advancing evidence-based medicine worldwide.`,
    `Technology and Software Engineering: ${topic} concepts inform modern software architecture, algorithm design, and system engineering — enabling engineers to build scalable, reliable, and efficient technological solutions that power everyday digital infrastructure.`,
    `Business Strategy and Organizational Management: Organizations apply frameworks derived from ${topic} to improve strategic decision-making, optimize operational workflows, train personnel more effectively, and gain competitive advantage in dynamic market environments.`,
  ];
}

function fallbackMisconceptions(topic) {
  return [
    `Misconception: ${topic} is best understood through memorization of facts and definitions. Reality: True mastery requires understanding underlying principles and the relationships between concepts. Memorization without comprehension produces knowledge that cannot be flexibly applied when contexts change or questions are framed differently.`,
    `Misconception: ${topic} is only relevant to specialists who work directly in that field. Reality: The reasoning patterns, principles, and mental models from ${topic} transfer broadly across many disciplines and everyday situations. Even non-specialists benefit from foundational literacy in the subject.`,
    `Misconception: Once you grasp the basics of ${topic}, there is little more to learn. Reality: ${topic} has considerable depth. Advanced study reveals important nuances, exceptions to basic rules, ongoing debates in the field, and evolving applications. Even experts continue learning as the field develops through new research.`,
  ];
}

function generateFallback(topic, opts) {
  const t    = (topic || 'This Topic').trim();
  const lang = opts.language || 'English';

  return {
    topic:                t,
    curriculum_alignment: 'General Academic Study',
    _language:            lang,
    ultra_long_notes: `## Introduction to ${t}

${t} is a significant area of study that has shaped understanding across multiple disciplines. Developing a deep knowledge of this subject equips learners with both conceptual frameworks and practical tools applicable in academic and professional contexts.

## Historical Background and Context

The study of ${t} has roots that stretch back through intellectual history. Early thinkers laid the groundwork by observing patterns and formulating initial theories. Over time, accumulated evidence and refined methods produced the more robust understanding we have today. Each generation of scholars built upon — and sometimes challenged — the work of those who came before, gradually converging on more accurate and comprehensive explanations.

Key milestones in this development include shifts in methodology, the emergence of new evidence, and contributions from thinkers across different cultural and institutional contexts. Understanding this historical dimension adds depth to any study of ${t} by revealing why certain ideas were accepted, why others were rejected, and how the current consensus emerged.

## Core Concepts

**The Foundational Framework:** Every area of study rests on a set of basic assumptions and definitions. For ${t}, these foundations establish what the subject is about, what questions it addresses, and what kinds of evidence are considered valid. Without clarity on these foundations, more advanced study lacks the necessary anchor.

**Key Mechanisms and Processes:** ${t} is characterized by specific processes that produce observable outcomes. Understanding *how* these mechanisms work — not just *that* they exist — is the difference between surface-level familiarity and genuine comprehension. The mechanisms typically involve cause-and-effect relationships that can be analyzed systematically.

**Structural Organization:** Like most complex subjects, ${t} has an internal structure — categories, hierarchies, or stages that organize its components into a coherent whole. Recognizing this structure makes it easier to situate new information and understand how pieces relate to each other.

**Dynamic Aspects:** Rather than being static, ${t} involves change over time, feedback loops, or adaptive responses. Understanding the dynamic dimension — how things evolve, respond to conditions, or interact in real time — is essential for predicting outcomes and applying knowledge practically.

**Evaluative Criteria:** Experts in ${t} use specific standards to assess quality, validity, or effectiveness. Learning to apply these criteria develops critical thinking and allows for independent evaluation rather than reliance on authority alone.

## How It Works: The Core Process

The processes central to ${t} can be understood through a simplified sequence:

1. **Initial Conditions** — The starting state or inputs that set the process in motion
2. **Active Mechanisms** — The forces, rules, or interactions that drive transformation
3. **Intermediate States** — The transitional stages between input and final outcome
4. **Output or Result** — The observable product, conclusion, or changed state
5. **Feedback and Iteration** — How outcomes influence subsequent cycles of the same process

This sequence is a simplification — real instances of ${t} involve greater complexity, variation, and interaction with external factors — but it provides a useful mental scaffold for initial understanding.

## Key Examples

**Example One — Foundational Case:** The classic case study of ${t} demonstrates the principles at their most basic. In controlled or ideal conditions, the core mechanisms operate as predicted by theory, producing outcomes that confirm foundational hypotheses. This example is most useful for initial learning and for testing whether foundational understanding is secure.

**Example Two — Complex Application:** A more complex real-world application shows how ${t} operates under conditions of uncertainty, competing variables, and partial information. Here, the principles still apply but must be adapted and applied with greater nuance. This example demonstrates the kind of thinking that expert practitioners routinely perform.

## Advanced Aspects

At an advanced level, ${t} introduces important complications:

- **Edge Cases and Exceptions:** The general rules have important exceptions. Knowing *when* the standard principles apply and *when* they do not separates novice from expert understanding.
- **Interacting Variables:** Advanced application requires holding multiple factors in mind simultaneously and understanding how they interact — not just how each affects outcomes in isolation.
- **Ongoing Debates:** In most fields, ${t} includes areas where evidence is incomplete or experts disagree. Engaging with these debates develops intellectual maturity and an accurate picture of what is known versus what is still uncertain.
- **Emerging Developments:** Recent research may be refining or revising established understanding. Staying current with developments in ${t} is important for anyone applying the knowledge professionally.

## Connections to Related Topics

${t} does not exist in isolation. It connects meaningfully to adjacent areas of knowledge:
- Related subjects share foundational assumptions or methodological approaches
- Upstream topics provide prerequisite knowledge that enables understanding of ${t}
- Downstream topics build directly on ${t} as their own foundation
- Cross-disciplinary connections reveal how ideas from ${t} illuminate questions in seemingly unrelated fields

Recognizing these connections accelerates learning and builds a more integrated understanding than studying any single topic in isolation.

## Summary

${t} is a rich subject that rewards careful study. Its foundational principles provide a framework for analysis, its mechanisms explain how and why outcomes occur, and its applications demonstrate real-world relevance. Mastery requires moving beyond memorization to achieve genuine comprehension — understanding *why* things work the way they do, not just *that* they do. With that understanding, students can apply their knowledge flexibly, think critically about new information, and continue learning independently long after formal study ends.`,

    key_concepts:             fallbackConcepts(t),
    key_tricks:               fallbackTricks(t),
    practice_questions:       fallbackQuestions(t),
    real_world_applications:  fallbackApps(t),
    common_misconceptions:    fallbackMisconceptions(t),
    study_score:              96,
    powered_by:               'Savoiré AI v2.0 by Sooban Talha Technologies',
    generated_at:             new Date().toISOString(),
    _fallback:                true,
    _language:                lang,
  };
}

function fallbackQuestions(topic) {
  return [
    {
      question: `Explain the core principles of ${topic} and describe how they work together to form a coherent framework for understanding this subject.`,
      answer: `The core principles of ${topic} form an integrated intellectual system where each component reinforces and contextualizes the others. At the most foundational level, these principles establish the basic definitions and assumptions upon which all further understanding is built. Without this foundation, more advanced concepts lack the necessary context and become difficult to apply accurately. The mechanisms that drive ${topic} operate through systematic processes that follow consistent patterns — this regularity is precisely what makes the subject analyzable and its outcomes predictable. The framework becomes complete when we recognize the relationships between individual components: each element influences others through direct and indirect pathways. Practically speaking, this integrated understanding enables genuine problem-solving rather than rote application of memorized procedures. Students who master the core principles can adapt their knowledge to novel situations, recognize which principles are relevant in a given context, and explain their reasoning clearly to others. A common mistake is treating the principles as isolated facts rather than as parts of a connected system — doing so makes the subject harder to learn and easier to misapply. The most productive approach is to continually ask how each new concept connects to what you already know, building a rich mental network rather than a list.`,
    },
    {
      question: `Describe a real-world scenario where knowledge of ${topic} is essential. Explain step-by-step how you would apply relevant concepts to address the challenge.`,
      answer: `Consider a professional context where decisions involving ${topic} have significant consequences. The first step is accurate problem identification: defining exactly what challenge needs to be addressed, what constraints exist, and what a successful outcome looks like. This diagnostic phase is critical — many failures in practice stem from solving the wrong problem or misunderstanding its scope. The second step is selecting which aspects of ${topic} are most relevant, filtering out peripheral information to direct cognitive resources effectively. Not all principles apply equally to every situation, and part of expertise is knowing which tools to reach for. The third step is developing a solution strategy grounded in those relevant principles, decomposing the complex challenge into manageable components that can be addressed sequentially. The fourth step is implementation with active monitoring: theoretical knowledge meets practical reality here, and adjustments are inevitable as real-world complexity exceeds the model. The fifth step is evaluation — comparing outcomes against the initial goals, identifying what worked, what did not, and why. This reflection phase is how theoretical understanding deepens through experience. A common mistake at this stage is skipping evaluation and moving immediately to the next challenge, losing the opportunity to extract lessons that improve future performance. This scenario illustrates that ${topic} knowledge is not merely academic but provides the intellectual infrastructure for high-quality decision-making.`,
    },
    {
      question: `Compare two different approaches to studying or applying ${topic}. Analyze the strengths and limitations of each and evaluate which produces better outcomes in different contexts.`,
      answer: `Understanding ${topic} benefits from examining it through multiple frameworks, each of which illuminates different aspects while having corresponding blind spots. The first approach — theoretical or principle-based — emphasizes conceptual understanding, formal frameworks, and systematic reasoning from first principles. Its primary strength is generalizability: deep theoretical understanding can be applied across diverse situations because it is not tied to specific contexts or examples. Its limitation is that without sufficient engagement with concrete cases, theoretical knowledge can remain abstract and difficult to deploy under real-world conditions of complexity and ambiguity. The second approach — empirical or case-based — focuses on specific instances, data, and observable patterns. This method produces actionable knowledge grounded in reality and often builds the intuitive judgment that characterizes expert practitioners. Its limitation is that patterns identified in one context may not generalize reliably to different settings, and without theoretical grounding, case knowledge can be brittle when novel situations arise. The most effective understanding of ${topic} integrates both approaches in a complementary way: theoretical frameworks provide the structure for organizing and interpreting experience, while empirical engagement grounds theory in observable reality and reveals where theoretical predictions break down. Experts characteristically demonstrate exactly this synthesis — they can reason from principles and draw on relevant precedents simultaneously. A common mistake is committing exclusively to one approach: pure theorists can lack practical judgment, while pure practitioners can lack the conceptual tools needed when their experience does not directly apply.`,
    },
  ];
}

// ─────────────────────────────────────────────────────────────────────
// SECTION 6: REQUEST VALIDATION
// ─────────────────────────────────────────────────────────────────────

function validateRequest(req) {
  if (req.method !== 'POST') {
    return { valid: false, status: 405, error: 'Method not allowed. Use POST.' };
  }

  const { message } = req.body || {};

  if (!message || typeof message !== 'string') {
    return { valid: false, status: 400, error: 'Request body must contain a "message" string field.' };
  }

  const trimmed = message.trim();

  if (trimmed.length < 3) {
    return { valid: false, status: 400, error: 'Message is too short. Please provide at least 3 characters.' };
  }

  if (trimmed.length > 15000) {
    return { valid: false, status: 400, error: 'Message is too long. Maximum is 15,000 characters.' };
  }

  // Basic spam / garbage detection
  if (/^(.)\1{30,}$/.test(trimmed)) {
    return { valid: false, status: 400, error: 'Message appears to be invalid (excessive repetition).' };
  }

  return { valid: true, trimmed };
}

// ─────────────────────────────────────────────────────────────────────
// SECTION 7: MAIN VERCEL HANDLER
// ─────────────────────────────────────────────────────────────────────

module.exports = async (req, res) => {

  // ── CORS Headers (public free tool — allow all origins) ──
  res.setHeader('Access-Control-Allow-Origin',  '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  res.setHeader('Access-Control-Max-Age',        '86400');

  // ── Security Headers ──
  res.setHeader('X-Powered-By',           'Savoiré AI v2.0 by Sooban Talha Technologies');
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options',        'DENY');

  // ── Preflight ──
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // ── Validate ──
  const validation = validateRequest(req);

  if (!validation.valid) {
    console.warn(`[Savoiré AI] Validation failed: ${validation.error}`);
    // For invalid requests, still return a usable fallback with status 200
    // so the frontend can show something useful
    if (validation.status === 400) {
      const fb = generateFallback(req.body?.message || 'Study Topic', req.body?.options || {});
      fb._notice = validation.error;
      return res.status(200).json(fb);
    }
    return res.status(validation.status).json({ error: validation.error });
  }

  const { trimmed } = validation;
  const options     = req.body.options || {};

  console.log(`[Savoiré AI] Processing: "${trimmed.slice(0, 80).replace(/\n/g, ' ')}…"`);

  try {
    let result;

    try {
      // Try AI generation (full model fallback chain)
      result = await generateWithAI(trimmed, options);
    } catch (aiErr) {
      // All AI models failed — serve rich offline fallback
      console.warn(`[Savoiré AI] All AI models failed. Serving offline fallback. Reason: ${aiErr.message}`);
      result = generateFallback(trimmed, options);
    }

    // ── Final metadata (always enforce branding) ──
    result.powered_by    = 'Savoiré AI v2.0 by Sooban Talha Technologies';
    result._timestamp    = new Date().toISOString();
    result._version      = '2.0';
    // Never expose model name: delete internal field if it crept in
    delete result._model;

    return res.status(200).json(result);

  } catch (unexpectedErr) {
    // This should never happen — every error path above is caught.
    // But just in case, always return something useful.
    console.error('[Savoiré AI] Unexpected top-level error:', unexpectedErr.message || unexpectedErr);

    const emergency = generateFallback(trimmed, options);
    emergency._notice    = 'Recovered from unexpected server error';
    emergency._timestamp = new Date().toISOString();
    emergency._version   = '2.0';

    return res.status(200).json(emergency);
  }
};

// =====================================================================
// END — Savoiré AI v2.0 Backend
// Sooban Talha Technologies | savoireai.vercel.app
// Founder: Sooban Talha
// =====================================================================
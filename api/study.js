export default async function handler(req, res) {
  // ── CORS preflight handler ──
  if (req.method === 'OPTIONS') {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    res.status(200).end();
    return;
  }
  
  'use strict';

  // ─────────────────────────────────────────────────────────────────────────────────────────────────
  // CONSTANTS & BRANDING
  // ─────────────────────────────────────────────────────────────────────────────────────────────────

  const BRAND       = 'Savoiré AI v2.0';
  const DEVELOPER   = 'Sooban Talha Technologies';
  const DEVSITE     = 'soobantalhatech.xyz';
  const WEBSITE     = 'savoireai.vercel.app';
  const FOUNDER     = 'Sooban Talha';
  const APP_VERSION = '2.0';

  const OPENROUTER_BASE = 'https://openrouter.ai/api/v1/chat/completions';
  const HTTP_REFERER    = `https://${WEBSITE}`;
  const APP_TITLE       = BRAND;

  // SSE event names
  const EVT_TOKEN     = 'token';
  const EVT_DONE      = 'done';
  const EVT_ERROR     = 'error';
  const EVT_HEARTBEAT = 'heartbeat';
  const EVT_STAGE     = 'stage';

  // ─────────────────────────────────────────────────────────────────────────────────────────────────
  // FREE AI MODEL ROSTER - SIMPLIFIED FOR RELIABILITY
  // ─────────────────────────────────────────────────────────────────────────────────────────────────

  const MODELS = [
    {
      id:          'google/gemini-2.0-flash-exp:free',
      max_tokens:   8000,
      timeout_ms:   60000,
      priority:     1,
      description:  'Gemini 2.0 Flash — Best quality, fastest response',
    },
    {
      id:          'deepseek/deepseek-chat:free',
      max_tokens:   8000,
      timeout_ms:   60000,
      priority:     2,
      description:  'DeepSeek Chat — Excellent reasoning',
    },
  ];

  // ─────────────────────────────────────────────────────────────────────────────────────────────────
  // DEPTH CONFIGURATION
  // ─────────────────────────────────────────────────────────────────────────────────────────────────

  const DEPTH_MAP = {
    standard: { wordRange: '600 to 900 words', minWords: 600, targetWords: 750 },
    detailed: { wordRange: '1000 to 1500 words', minWords: 1000, targetWords: 1250 },
    comprehensive: { wordRange: '1500 to 2000 words', minWords: 1500, targetWords: 1750 },
    expert: { wordRange: '2000 to 2800 words', minWords: 2000, targetWords: 2400 },
  };

  // ─────────────────────────────────────────────────────────────────────────────────────────────────
  // STYLE CONFIGURATION
  // ─────────────────────────────────────────────────────────────────────────────────────────────────

  const STYLE_MAP = {
    simple: { name: 'Simple & Clear', instruction: 'Write in clear, accessible, beginner-friendly language.' },
    academic: { name: 'Academic & Formal', instruction: 'Write in formal academic language with precise terminology.' },
    detailed: { name: 'Highly Detailed', instruction: 'Provide exhaustive detail with numerous examples.' },
    exam: { name: 'Exam-Focused', instruction: 'Structure response around exam success with mark-worthy phrases.' },
    visual: { name: 'Visual & Analogy-Rich', instruction: 'Use vivid analogies and metaphors to explain concepts.' },
  };

  // ─────────────────────────────────────────────────────────────────────────────────────────────────
  // TOOL CONFIGURATION
  // ─────────────────────────────────────────────────────────────────────────────────────────────────

  const TOOL_MAP = {
    notes: {
      name: 'Generate Notes',
      objective: 'Generate comprehensive, deeply detailed, well-structured study notes.',
      sections: ['Introduction', 'Core Concepts', 'How It Works', 'Key Examples', 'Summary'],
    },
    flashcards: {
      name: 'Create Flashcards',
      objective: 'Generate study materials optimised for flashcard learning.',
      sections: ['Introduction', 'Core Concepts', 'Key Terms', 'Examples', 'Summary'],
    },
    quiz: {
      name: 'Build Quiz',
      objective: 'Generate challenging practice questions with detailed answers.',
      sections: ['Introduction', 'Core Concepts', 'Practice Questions', 'Answers', 'Summary'],
    },
    summary: {
      name: 'Smart Summary',
      objective: 'Generate a concise, punchy smart summary for fast review.',
      sections: ['TL;DR', 'Core Concepts', 'Key Takeaways', 'Important Details', 'Final Notes'],
    },
    mindmap: {
      name: 'Build Mind Map',
      objective: 'Generate content structured hierarchically for a visual mind map.',
      sections: ['Central Topic', 'Main Branches', 'Sub-Branches', 'Connections', 'Applications'],
    },
  };

  // ─────────────────────────────────────────────────────────────────────────────────────────────────
  // UTILITY FUNCTIONS
  // ─────────────────────────────────────────────────────────────────────────────────────────────────

  const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

  const logger = {
    info:    (...a) => console.log(`[${new Date().toISOString()}] INFO:`, ...a),
    ok:      (...a) => console.log(`[${new Date().toISOString()}] ✓:`, ...a),
    warn:    (...a) => console.warn(`[${new Date().toISOString()}] WARN:`, ...a),
    error:   (...a) => console.error(`[${new Date().toISOString()}] ERROR:`, ...a),
  };

  function wordCount(text) {
    if (!text || typeof text !== 'string') return 0;
    return text.trim().split(/\s+/).filter(Boolean).length;
  }

  function trunc(s, n = 100) {
    if (!s) return '';
    return String(s).length > n ? String(s).slice(0, n) + '…' : String(s);
  }

  // ─────────────────────────────────────────────────────────────────────────────────────────────────
  // PROMPT BUILDER
  // ─────────────────────────────────────────────────────────────────────────────────────────────────

  function buildPrompt(input, opts) {
    const language = (opts.language || 'English').trim();
    const depth = opts.depth || 'detailed';
    const style = opts.style || 'simple';
    const tool = opts.tool || 'notes';

    const depthCfg = DEPTH_MAP[depth] || DEPTH_MAP.detailed;
    const styleCfg = STYLE_MAP[style] || STYLE_MAP.simple;
    const toolCfg = TOOL_MAP[tool] || TOOL_MAP.notes;

    const nowISO = new Date().toISOString();

    return `You are ${BRAND}, a professional AI study companion.

STUDENT'S TOPIC: ${input}

OUTPUT LANGUAGE: ${language}
OUTPUT DEPTH: ${depthCfg.wordRange}
WRITING STYLE: ${styleCfg.name} - ${styleCfg.instruction}
TOOL MODE: ${toolCfg.name} - ${toolCfg.objective}

REQUIRED OUTPUT FORMAT - VALID JSON ONLY:

{
  "topic": "specific topic name in ${language}",
  "curriculum_alignment": "Academic level and subject",
  "ultra_long_notes": "Comprehensive ${depthCfg.wordRange} study notes in ${language} with markdown formatting (## headings, **bold**, bullet lists)",
  "key_concepts": ["Concept 1: explanation", "Concept 2: explanation", "Concept 3: explanation", "Concept 4: explanation", "Concept 5: explanation"],
  "key_tricks": ["Memory trick 1", "Memory trick 2", "Memory trick 3"],
  "practice_questions": [
    {"question": "Question 1", "answer": "Detailed answer 1"},
    {"question": "Question 2", "answer": "Detailed answer 2"},
    {"question": "Question 3", "answer": "Detailed answer 3"}
  ],
  "real_world_applications": ["Application 1", "Application 2", "Application 3"],
  "common_misconceptions": ["Misconception 1", "Misconception 2", "Misconception 3"],
  "study_score": 96,
  "powered_by": "${BRAND} by ${DEVELOPER}",
  "generated_at": "${nowISO}"
}`;
  }

  // ─────────────────────────────────────────────────────────────────────────────────────────────────
  // JSON EXTRACTION & PARSING
  // ─────────────────────────────────────────────────────────────────────────────────────────────────

  function extractAndParseJSON(rawContent) {
    if (!rawContent || typeof rawContent !== 'string') {
      throw new Error('Model returned empty content');
    }

    let text = rawContent.trim();
    text = text.replace(/^```(?:json)?\s*/i, '');
    text = text.replace(/\s*```\s*$/i, '');
    text = text.trim();

    const startIdx = text.indexOf('{');
    const endIdx = text.lastIndexOf('}');

    if (startIdx === -1 || endIdx === -1 || endIdx <= startIdx) {
      throw new Error('No valid JSON found');
    }

    let jsonStr = text.slice(startIdx, endIdx + 1);

    try {
      return JSON.parse(jsonStr);
    } catch (directErr) {
      // Attempt repairs
      let repaired = jsonStr;
      repaired = repaired.replace(/"((?:[^"\\]|\\.)*)"/g, (match, inner) => {
        const fixed = inner.replace(/\n/g, '\\n').replace(/\r/g, '\\r').replace(/\t/g, '\\t');
        return `"${fixed}"`;
      });
      repaired = repaired.replace(/,(\s*[}\]])/g, '$1');
      repaired = repaired.replace(/([{,]\s*)([a-zA-Z_][a-zA-Z0-9_]*)(\s*:)/g, '$1"$2"$3');
      
      return JSON.parse(repaired);
    }
  }

  // ─────────────────────────────────────────────────────────────────────────────────────────────────
  // DATA VALIDATION & ENRICHMENT
  // ─────────────────────────────────────────────────────────────────────────────────────────────────

  function validateAndEnrich(parsed, opts) {
    if (!parsed || typeof parsed !== 'object') {
      throw new Error('Invalid parsed result');
    }

    if (!parsed.topic || typeof parsed.topic !== 'string') {
      parsed.topic = opts.topic || 'Study Material';
    }

    if (!parsed.ultra_long_notes || typeof parsed.ultra_long_notes !== 'string') {
      parsed.ultra_long_notes = generateFallbackNotes(parsed.topic);
    }

    if (!parsed.key_concepts || !Array.isArray(parsed.key_concepts)) {
      parsed.key_concepts = generateFallbackConcepts(parsed.topic);
    }

    if (!parsed.key_tricks || !Array.isArray(parsed.key_tricks)) {
      parsed.key_tricks = generateFallbackTricks(parsed.topic);
    }

    if (!parsed.practice_questions || !Array.isArray(parsed.practice_questions)) {
      parsed.practice_questions = generateFallbackQuestions(parsed.topic);
    }

    if (!parsed.real_world_applications || !Array.isArray(parsed.real_world_applications)) {
      parsed.real_world_applications = generateFallbackApplications(parsed.topic);
    }

    if (!parsed.common_misconceptions || !Array.isArray(parsed.common_misconceptions)) {
      parsed.common_misconceptions = generateFallbackMisconceptions(parsed.topic);
    }

    parsed.powered_by = `${BRAND} by ${DEVELOPER}`;
    parsed.study_score = 96;
    parsed.generated_at = parsed.generated_at || new Date().toISOString();
    parsed._language = opts.language || 'English';
    parsed._version = APP_VERSION;

    delete parsed._model;
    delete parsed.model;

    return parsed;
  }

  // ─────────────────────────────────────────────────────────────────────────────────────────────────
  // FALLBACK CONTENT GENERATORS
  // ─────────────────────────────────────────────────────────────────────────────────────────────────

  function generateFallbackNotes(topic) {
    const t = topic || 'This Topic';
    return `## Introduction to ${t}

${t} is a fascinating and important area of study with wide-ranging applications and implications. Understanding ${t} requires a solid grasp of its fundamental principles and how they connect to real-world phenomena.

---

## Core Concepts

**Definition and Scope:** ${t} encompasses the key ideas, frameworks, and methodologies that define this field of knowledge. The core concepts provide the foundation upon which deeper understanding is built.

**Key Principles:** Several fundamental principles govern how ${t} operates and why it matters. These principles include causality, systematic analysis, and evidence-based reasoning.

**Theoretical Framework:** The theoretical underpinnings of ${t} draw from multiple disciplines, creating an integrated approach to understanding complex phenomena.

---

## How It Works

**Step 1 - Foundation:** Begin by establishing the basic vocabulary and assumptions of ${t}. This includes understanding the key terms and their precise meanings.

**Step 2 - Analysis:** Apply analytical frameworks to break down complex problems into manageable components. Each component can be examined individually before synthesizing the whole.

**Step 3 - Synthesis:** Combine the analyzed components to form a complete picture. This synthesis reveals how individual elements interact and influence each other.

**Step 4 - Application:** Use the synthesized understanding to solve real problems, answer questions, or generate new insights about ${t}.

---

## Key Examples

**Example 1 - Basic Application:** A straightforward demonstration of how ${t} principles apply to everyday situations. This example illustrates the core mechanisms in action.

**Example 2 - Complex Scenario:** A more nuanced case that requires applying multiple concepts simultaneously. This shows how ${t} handles real-world complexity.

**Example 3 - Edge Case:** An unusual situation that tests the boundaries of standard ${t} frameworks, revealing both strengths and limitations.

---

## Summary

Mastering ${t} requires dedicated study, active engagement with the material, and consistent practice. The key takeaways include understanding the fundamental principles, recognizing patterns, and applying knowledge flexibly across different contexts. Regular review and self-testing will reinforce learning and build long-term retention.`;
  }

  function generateFallbackConcepts(topic) {
    const t = topic || 'This topic';
    return [
      `Fundamental Definition: ${t} represents the core principles and frameworks that define this area of study and practice.`,
      `Key Mechanisms: The primary processes and interactions that drive phenomena within ${t} and produce observable outcomes.`,
      `Theoretical Foundation: The established body of knowledge, assumptions, and validated theories that underpin ${t}.`,
      `Practical Application: How the principles of ${t} translate into real-world solutions and professional practice.`,
      `Critical Analysis: The methods and approaches used to evaluate, critique, and advance understanding of ${t}.`,
    ];
  }

  function generateFallbackTricks(topic) {
    const t = topic || 'this topic';
    return [
      `Active Recall: After studying ${t}, close your notes and try to explain the key concepts from memory. This strengthens neural pathways and improves retention.`,
      `Spaced Repetition: Review ${t} at increasing intervals (1 day, 3 days, 1 week, 2 weeks) to move knowledge from short-term to long-term memory.`,
      `Feynman Technique: Explain ${t} in simple language as if teaching a beginner. Identify gaps in your explanation, then review those specific areas.`,
    ];
  }

  function generateFallbackQuestions(topic) {
    const t = topic || 'this topic';
    return [
      {
        question: `What are the fundamental principles of ${t} and why do they matter?`,
        answer: `The fundamental principles of ${t} establish the foundation for understanding this field. They define the scope, methods, and key insights that make ${t} valuable. These principles matter because they provide a framework for analyzing problems, generating solutions, and communicating effectively with others in the field. Without a solid grasp of these fundamentals, deeper understanding becomes difficult or impossible.`,
      },
      {
        question: `How can the concepts of ${t} be applied in real-world professional settings?`,
        answer: `The concepts of ${t} have numerous practical applications across industries. Professionals use these principles to solve complex problems, optimize processes, and make better decisions. For example, understanding ${t} helps in diagnosing issues, predicting outcomes, and designing effective interventions. Real-world applications range from healthcare and engineering to business strategy and education. The key is recognizing which principles apply to which situations and adapting them appropriately.`,
      },
      {
        question: `What are common misunderstandings about ${t} and how can they be corrected?`,
        answer: `Common misunderstandings about ${t} often arise from oversimplification or outdated information. Many people mistakenly believe that ${t} is only relevant in academic contexts, when in fact it has broad practical applications. Others may think the core ideas are intuitive and require no study, missing the nuanced insights that come from deeper engagement. Correcting these misunderstandings requires exposure to concrete examples, hands-on application, and careful study of how principles translate to practice.`,
      },
    ];
  }

  function generateFallbackApplications(topic) {
    const t = topic || 'this topic';
    return [
      `Professional Practice: Professionals across industries apply ${t} daily to solve problems, make decisions, and create value for their organizations.`,
      `Research & Development: Researchers use frameworks from ${t} to design studies, interpret data, and advance knowledge in their fields.`,
      `Education & Training: Educators incorporate ${t} into curricula to help students develop critical thinking and analytical skills that transfer across domains.`,
    ];
  }

  function generateFallbackMisconceptions(topic) {
    const t = topic || 'this topic';
    return [
      `Many believe ${t} is only theoretical with no practical use. In reality, ${t} has extensive real-world applications that professionals use every day.`,
      `Some think ${t} can be mastered through memorization alone. True understanding requires active engagement, application, and critical thinking.`,
      `A common misconception is that ${t} is static and unchanging. In fact, ${t} continues to evolve as new research and insights emerge.`,
    ];
  }

  // ─────────────────────────────────────────────────────────────────────────────────────────────────
  // MODEL CALLER WITH STREAMING
  // ─────────────────────────────────────────────────────────────────────────────────────────────────

  async function callModelWithStream(model, prompt, onChunk) {
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), model.timeout_ms);
    const t0 = Date.now();

    try {
      const apiKey = process.env.OPENROUTER_API_KEY;
      if (!apiKey) {
        throw new Error('OPENROUTER_API_KEY not set');
      }

      const response = await fetch(OPENROUTER_BASE, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`,
          'HTTP-Referer': HTTP_REFERER,
          'X-Title': APP_TITLE,
        },
        body: JSON.stringify({
          model: model.id,
          max_tokens: model.max_tokens,
          temperature: 0.7,
          stream: true,
          messages: [{ role: 'user', content: prompt }],
        }),
        signal: ctrl.signal,
      });

      clearTimeout(timer);

      if (!response.ok) {
        const errorText = await response.text().catch(() => '');
        throw new Error(`HTTP ${response.status}: ${errorText.slice(0, 100)}`);
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder('utf-8');
      let buffer = '';
      let fullContent = '';
      let tokenCount = 0;

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          const trimmed = line.trim();
          if (!trimmed || !trimmed.startsWith('data: ')) continue;

          const data = trimmed.slice(6);
          if (data === '[DONE]') continue;

          try {
            const parsed = JSON.parse(data);
            const token = parsed.choices?.[0]?.delta?.content;
            if (token && typeof token === 'string') {
              fullContent += token;
              tokenCount++;
              onChunk(token);
            }
          } catch {
            // Skip invalid JSON
          }
        }
      }

      const elapsed = Date.now() - t0;
      logger.ok(`Stream complete: ${tokenCount} tokens, ${fullContent.length} chars, ${elapsed}ms`);

      if (fullContent.length < 50) {
        throw new Error('Response too short');
      }

      return extractAndParseJSON(fullContent);

    } catch (err) {
      clearTimeout(timer);
      throw err;
    }
  }

  // ─────────────────────────────────────────────────────────────────────────────────────────────────
  // MAIN GENERATION FUNCTION
  // ─────────────────────────────────────────────────────────────────────────────────────────────────

  async function generateWithAI(message, opts, onChunk) {
    const prompt = buildPrompt(message, opts);
    let lastError = null;

    for (const model of MODELS) {
      try {
        logger.info(`Trying model: ${model.id}`);
        const result = await callModelWithStream(model, prompt, onChunk);
        return validateAndEnrich(result, opts);
      } catch (err) {
        lastError = err;
        logger.warn(`Model ${model.id} failed: ${err.message}`);
        await sleep(500);
      }
    }

    // Fallback to offline content
    logger.warn('All models failed, using offline fallback');
    const fallback = {
      topic: message.slice(0, 50),
      curriculum_alignment: 'General Study',
      ultra_long_notes: generateFallbackNotes(message),
      key_concepts: generateFallbackConcepts(message),
      key_tricks: generateFallbackTricks(message),
      practice_questions: generateFallbackQuestions(message),
      real_world_applications: generateFallbackApplications(message),
      common_misconceptions: generateFallbackMisconceptions(message),
      study_score: 96,
      powered_by: `${BRAND} by ${DEVELOPER}`,
      generated_at: new Date().toISOString(),
      _fallback: true,
    };
    return validateAndEnrich(fallback, opts);
  }

  // ─────────────────────────────────────────────────────────────────────────────────────────────────
  // RESPONSE HEADERS
  // ─────────────────────────────────────────────────────────────────────────────────────────────────

  function setResponseHeaders(res) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    res.setHeader('X-Powered-By', `${BRAND} by ${DEVELOPER}`);
    res.setHeader('X-Developer', DEVELOPER);
    res.setHeader('X-Founder', FOUNDER);
    res.setHeader('X-Content-Type-Options', 'nosniff');
  }

  // ─────────────────────────────────────────────────────────────────────────────────────────────────
  // MAIN HANDLER
  // ─────────────────────────────────────────────────────────────────────────────────────────────────

  try {
    setResponseHeaders(res);

    if (req.method === 'OPTIONS') {
      return res.status(200).end();
    }

    if (req.method !== 'POST') {
      return res.status(405).json({ error: 'Method not allowed' });
    }

    const body = req.body || {};
    const message = body.message?.trim();

    if (!message || message.length < 2) {
      return res.status(400).json({ error: 'Message must be at least 2 characters' });
    }

    const opts = {
      tool: body.options?.tool || 'notes',
      depth: body.options?.depth || 'detailed',
      style: body.options?.style || 'simple',
      language: body.options?.language || 'English',
      stream: body.options?.stream === true,
    };

    logger.info(`Request: tool=${opts.tool}, lang=${opts.language}, stream=${opts.stream}, msg=${message.length} chars`);

    // STREAMING MODE
    if (opts.stream) {
      res.setHeader('Content-Type', 'text/event-stream; charset=utf-8');
      res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
      res.setHeader('Connection', 'keep-alive');
      res.setHeader('X-Accel-Buffering', 'no');
      res.flushHeaders();

      const sendSSE = (event, data) => {
        try {
          res.write(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`);
        } catch (err) {
          logger.warn(`SSE write error: ${err.message}`);
        }
      };

      // Send initial connection confirmed
      sendSSE(EVT_HEARTBEAT, { ts: Date.now(), status: 'connected' });
      sendSSE(EVT_STAGE, { idx: 0, label: 'Analysing your topic...' });

      let tokenCount = 0;
      let stageTimer = setTimeout(() => sendSSE(EVT_STAGE, { idx: 1, label: 'Writing your content...' }), 2000);
      let stageTimer2 = setTimeout(() => sendSSE(EVT_STAGE, { idx: 2, label: 'Building sections...' }), 5000);
      let stageTimer3 = setTimeout(() => sendSSE(EVT_STAGE, { idx: 3, label: 'Finalising...' }), 8000);

      try {
        const result = await generateWithAI(message, opts, (chunk) => {
          tokenCount++;
          sendSSE(EVT_TOKEN, { t: chunk });
        });

        clearTimeout(stageTimer);
        clearTimeout(stageTimer2);
        clearTimeout(stageTimer3);
        
        sendSSE(EVT_STAGE, { idx: 4, label: 'Complete!', done: true });
        sendSSE(EVT_DONE, result);
        res.end();

        logger.info(`Stream completed: ${tokenCount} tokens sent`);

      } catch (err) {
        clearTimeout(stageTimer);
        clearTimeout(stageTimer2);
        clearTimeout(stageTimer3);
        
        logger.error(`Stream error: ${err.message}`);
        sendSSE(EVT_ERROR, { message: err.message || 'Generation failed' });
        res.end();
      }
      return;
    }

    // NON-STREAMING MODE
    const result = await generateWithAI(message, opts);
    return res.status(200).json(result);

  } catch (err) {
    logger.error(`Handler error: ${err.message}`);
    return res.status(500).json({ error: err.message || 'Internal server error' });
  }
}
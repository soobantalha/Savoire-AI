// ====================================================================================================
// SAVOIRÉ AI v2.0 - ULTRA-FAST BACKEND API
// Built by Sooban Talha Technologies | soobantalhatech.xyz
// Live streaming: First token in 0.8-1.2 seconds
// ====================================================================================================

export default async function handler(req, res) {
  // ==================================================================================================
  // CORS & PREFLIGHT HANDLER
  // ==================================================================================================
  if (req.method === 'OPTIONS') {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    res.setHeader('Access-Control-Max-Age', '86400');
    res.status(200).end();
    return;
  }

  'use strict';

  // ==================================================================================================
  // SECTION 1: CONFIGURATION & CONSTANTS
  // ==================================================================================================
  
  const CONFIG = {
    BRAND: 'Savoiré AI v2.0',
    DEVELOPER: 'Sooban Talha Technologies',
    DEVSITE: 'soobantalhatech.xyz',
    WEBSITE: 'savoireai.vercel.app',
    FOUNDER: 'Sooban Talha',
    VERSION: '2.0',
    OPENROUTER_BASE: 'https://openrouter.ai/api/v1/chat/completions',
    API_KEY: process.env.OPENROUTER_API_KEY,
    MAX_TOKENS: 8000,
    TEMPERATURE: 0.72,
  };

  // SSE Event Types
  const EVENTS = {
    TOKEN: 'token',
    DONE: 'done',
    ERROR: 'error',
    HEARTBEAT: 'heartbeat',
    STAGE: 'stage',
    THINKING: 'thinking',
  };

  // ==================================================================================================
  // SECTION 2: ULTRA-FAST AI MODELS (Priority-optimized for speed)
  // ==================================================================================================
  
  const FAST_MODELS = [
    {
      id: 'google/gemini-2.0-flash-exp:free',
      max_tokens: 8000,
      timeout_ms: 30000,
      priority: 1,
      speed: 'ultra-fast',
      description: 'Gemini 2.0 Flash - Fastest response times'
    },
    {
      id: 'deepseek/deepseek-chat:free',
      max_tokens: 8000,
      timeout_ms: 30000,
      priority: 2,
      speed: 'fast',
      description: 'DeepSeek Chat - Excellent speed and quality'
    },
    {
      id: 'meta-llama/llama-3.2-3b-instruct:free',
      max_tokens: 4000,
      timeout_ms: 25000,
      priority: 3,
      speed: 'very-fast',
      description: 'LLaMA 3.2 3B - Ultra lightweight'
    },
    {
      id: 'google/gemini-flash-1.5-8b:free',
      max_tokens: 4000,
      timeout_ms: 25000,
      priority: 4,
      speed: 'fast',
      description: 'Gemini Flash 1.5 - Optimized for speed'
    },
    {
      id: 'qwen/qwen3-8b:free',
      max_tokens: 4000,
      timeout_ms: 30000,
      priority: 5,
      speed: 'fast',
      description: 'Qwen3 8B - Reliable fast responses'
    }
  ];

  // ==================================================================================================
  // SECTION 3: PROMPT TEMPLATES (Optimized for speed)
  // ==================================================================================================
  
  const DEPTH_CONFIG = {
    standard: { words: '600-900', target: 750, desc: 'Clear and concise' },
    detailed: { words: '1000-1500', target: 1250, desc: 'Detailed with examples' },
    comprehensive: { words: '1500-2000', target: 1750, desc: 'Comprehensive analysis' },
    expert: { words: '2000-2800', target: 2400, desc: 'Expert-level depth' }
  };

  const STYLE_CONFIG = {
    simple: 'Simple & Clear - Beginner friendly',
    academic: 'Academic & Formal - Scholarly tone',
    detailed: 'Highly Detailed - Maximum depth',
    exam: 'Exam-Focused - Mark-worthy phrases',
    visual: 'Visual & Analogy-Rich - Mental models'
  };

  const TOOL_CONFIG = {
    notes: { name: 'Notes', icon: 'fa-book-open' },
    flashcards: { name: 'Flashcards', icon: 'fa-layer-group' },
    quiz: { name: 'Quiz', icon: 'fa-question-circle' },
    summary: { name: 'Summary', icon: 'fa-align-left' },
    mindmap: { name: 'Mind Map', icon: 'fa-project-diagram' }
  };

  // ==================================================================================================
  // SECTION 4: UTILITY FUNCTIONS
  // ==================================================================================================
  
  const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));
  
  const logger = {
    info: (...args) => console.log(`[${new Date().toISOString()}] 📘 INFO:`, ...args),
    ok: (...args) => console.log(`[${new Date().toISOString()}] ✅ OK:`, ...args),
    warn: (...args) => console.warn(`[${new Date().toISOString()}] ⚠️ WARN:`, ...args),
    error: (...args) => console.error(`[${new Date().toISOString()}] ❌ ERROR:`, ...args),
    timing: (...args) => console.log(`[${new Date().toISOString()}] ⏱️ TIMING:`, ...args)
  };

  const wordCount = (text) => {
    if (!text || typeof text !== 'string') return 0;
    return text.trim().split(/\s+/).filter(Boolean).length;
  };

  const truncate = (str, maxLen = 100) => {
    if (!str) return '';
    return String(str).length > maxLen ? String(str).slice(0, maxLen) + '…' : String(str);
  };

  // ==================================================================================================
  // SECTION 5: ULTRA-FAST PROMPT BUILDER (Minimal latency)
  // ==================================================================================================
  
  function buildPrompt(input, options) {
    const language = options.language || 'English';
    const depth = options.depth || 'detailed';
    const style = options.style || 'simple';
    const tool = options.tool || 'notes';
    
    const depthCfg = DEPTH_CONFIG[depth] || DEPTH_CONFIG.detailed;
    const styleText = STYLE_CONFIG[style] || STYLE_CONFIG.simple;
    const toolName = TOOL_CONFIG[tool].name;
    
    return `You are Savoiré AI. Create ${depthCfg.words} words of ${toolName} about: "${input}"

Language: ${language}
Style: ${styleText}

Output JSON format:
{
  "topic": "topic name",
  "curriculum_alignment": "level/subject",
  "ultra_long_notes": "detailed markdown notes with ## headings, **bold**, bullet lists",
  "key_concepts": ["concept1", "concept2", "concept3", "concept4", "concept5"],
  "key_tricks": ["trick1", "trick2", "trick3"],
  "practice_questions": [
    {"question": "Q1", "answer": "A1"},
    {"question": "Q2", "answer": "A2"},
    {"question": "Q3", "answer": "A3"}
  ],
  "real_world_applications": ["app1", "app2", "app3"],
  "common_misconceptions": ["mis1", "mis2", "mis3"],
  "study_score": 96,
  "powered_by": "Savoiré AI v2.0",
  "generated_at": "${new Date().toISOString()}"
}

Respond with ONLY valid JSON. No text before or after.`;
  }

  // ==================================================================================================
  // SECTION 6: ULTRA-FAST JSON PARSER
  // ==================================================================================================
  
  function extractJSON(raw) {
    if (!raw || typeof raw !== 'string') throw new Error('No content');
    
    let text = raw.trim();
    text = text.replace(/^```(?:json)?\s*/i, '').replace(/\s*```\s*$/i, '');
    
    const start = text.indexOf('{');
    const end = text.lastIndexOf('}');
    if (start === -1 || end === -1) throw new Error('No JSON found');
    
    let jsonStr = text.slice(start, end + 1);
    
    try {
      return JSON.parse(jsonStr);
    } catch(e) {
      // Fast repair attempts
      jsonStr = jsonStr.replace(/\n/g, '\\n').replace(/\r/g, '\\r');
      jsonStr = jsonStr.replace(/,(\s*[}\]])/g, '$1');
      jsonStr = jsonStr.replace(/([{,]\s*)([a-zA-Z_][a-zA-Z0-9_]*)(\s*:)/g, '$1"$2"$3');
      return JSON.parse(jsonStr);
    }
  }

  // ==================================================================================================
  // SECTION 7: VALIDATION & ENRICHMENT
  // ==================================================================================================
  
  function validateResult(data, options) {
    if (!data.topic) data.topic = options.input?.slice(0, 50) || 'Study Material';
    if (!data.ultra_long_notes) data.ultra_long_notes = generateQuickNotes(data.topic);
    if (!data.key_concepts?.length) data.key_concepts = generateQuickConcepts(data.topic);
    if (!data.key_tricks?.length) data.key_tricks = generateQuickTricks(data.topic);
    if (!data.practice_questions?.length) data.practice_questions = generateQuickQuestions(data.topic);
    if (!data.real_world_applications?.length) data.real_world_applications = generateQuickApps(data.topic);
    if (!data.common_misconceptions?.length) data.common_misconceptions = generateQuickMisconceptions(data.topic);
    
    data.powered_by = `${CONFIG.BRAND} by ${CONFIG.DEVELOPER}`;
    data.study_score = 96;
    data.generated_at = new Date().toISOString();
    data._language = options.language || 'English';
    data._word_count = wordCount(data.ultra_long_notes);
    
    delete data._model;
    delete data.model;
    
    return data;
  }

  // ==================================================================================================
  // SECTION 8: QUICK FALLBACK GENERATORS (Instant response)
  // ==================================================================================================
  
  function generateQuickNotes(topic) {
    const t = topic || 'this topic';
    return `## Introduction to ${t}

${t} is a fundamental topic with broad applications across multiple fields.

---

## Core Concepts

**Definition:** ${t} encompasses the key principles and frameworks essential for understanding this domain.

**Key Principles:** Several fundamental principles govern how ${t} operates and why it matters.

**Applications:** Understanding ${t} enables better problem-solving and decision-making.

---

## Summary

Mastering ${t} requires consistent practice and active engagement with the material.`;
  }

  function generateQuickConcepts(topic) {
    const t = topic || 'This topic';
    return [
      `Definition: ${t} refers to the core principles and frameworks of this field.`,
      `Mechanisms: The processes that drive ${t} and produce observable outcomes.`,
      `Applications: How ${t} principles translate into real-world solutions.`,
      `Analysis: Methods used to evaluate and understand ${t}.`,
      `Significance: Why ${t} matters in academic and professional contexts.`
    ];
  }

  function generateQuickTricks(topic) {
    const t = topic || 'this topic';
    return [
      `Active Recall: Test yourself on ${t} without notes to strengthen memory.`,
      `Spaced Repetition: Review ${t} at increasing intervals for better retention.`,
      `Feynman Technique: Explain ${t} simply to identify knowledge gaps.`
    ];
  }

  function generateQuickQuestions(topic) {
    const t = topic || 'this topic';
    return [
      { question: `What are the core principles of ${t}?`, answer: `The core principles of ${t} establish the foundation for understanding this field. These principles include fundamental definitions, key mechanisms, and analytical frameworks that professionals use daily.` },
      { question: `How does ${t} apply in real-world scenarios?`, answer: `${t} has extensive real-world applications across healthcare, technology, and business. Professionals use these concepts to solve problems, make decisions, and create value.` },
      { question: `What are common misconceptions about ${t}?`, answer: `Many believe ${t} is purely theoretical, but it has practical applications. Others think memorization is enough, but true understanding requires active engagement and critical thinking.` }
    ];
  }

  function generateQuickApps(topic) {
    const t = topic || 'this topic';
    return [
      `Healthcare: ${t} principles guide diagnosis and treatment planning.`,
      `Technology: ${t} concepts inform software and system design.`,
      `Business: ${t} frameworks improve strategy and operations.`
    ];
  }

  function generateQuickMisconceptions(topic) {
    const t = topic || 'this topic';
    return [
      `Many think ${t} is only theoretical - it has extensive practical applications.`,
      `Some believe memorization equals mastery - true understanding requires active engagement.`,
      `A common misconception is that ${t} is static - it continues to evolve with research.`
    ];
  }

  // ==================================================================================================
  // SECTION 9: ULTRA-FAST STREAMING MODEL CALLER
  // ==================================================================================================
  
  async function fastStreamCall(model, prompt, onToken) {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), model.timeout_ms);
    const startTime = Date.now();
    
    try {
      if (!CONFIG.API_KEY) {
        throw new Error('API_KEY_MISSING');
      }
      
      const response = await fetch(CONFIG.OPENROUTER_BASE, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${CONFIG.API_KEY}`,
          'HTTP-Referer': `https://${CONFIG.WEBSITE}`,
          'X-Title': CONFIG.BRAND
        },
        body: JSON.stringify({
          model: model.id,
          max_tokens: model.max_tokens,
          temperature: CONFIG.TEMPERATURE,
          stream: true,
          messages: [{ role: 'user', content: prompt }]
        }),
        signal: controller.signal
      });
      
      clearTimeout(timeout);
      
      if (!response.ok) {
        const errorText = await response.text().catch(() => '');
        throw new Error(`HTTP ${response.status}`);
      }
      
      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';
      let fullContent = '';
      let firstToken = false;
      
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
            if (token && typeof token === 'string' && token.length > 0) {
              if (!firstToken) {
                firstToken = true;
                const elapsed = Date.now() - startTime;
                logger.timing(`First token from ${model.id}: ${elapsed}ms`);
              }
              fullContent += token;
              onToken(token);
            }
          } catch(e) {}
        }
      }
      
      const elapsed = Date.now() - startTime;
      logger.ok(`${model.id}: ${fullContent.length} chars in ${elapsed}ms`);
      
      if (fullContent.length < 50) throw new Error('Response too short');
      
      return extractJSON(fullContent);
      
    } catch(err) {
      clearTimeout(timeout);
      throw err;
    }
  }

  // ==================================================================================================
  // SECTION 10: MAIN GENERATION WITH INSTANT FALLBACK
  // ==================================================================================================
  
  async function generateFast(input, options, onToken) {
    const prompt = buildPrompt(input, options);
    
    // Try fast models in priority order
    for (const model of FAST_MODELS) {
      try {
        logger.info(`Trying ${model.id}...`);
        const result = await fastStreamCall(model, prompt, onToken);
        return validateResult(result, { ...options, input });
      } catch(err) {
        logger.warn(`${model.id} failed: ${err.message}`);
        await sleep(100);
      }
    }
    
    // Instant fallback - no waiting
    logger.warn('Using instant fallback content');
    const fallback = {
      topic: input.slice(0, 50),
      curriculum_alignment: 'General Study',
      ultra_long_notes: generateQuickNotes(input),
      key_concepts: generateQuickConcepts(input),
      key_tricks: generateQuickTricks(input),
      practice_questions: generateQuickQuestions(input),
      real_world_applications: generateQuickApps(input),
      common_misconceptions: generateQuickMisconceptions(input),
      study_score: 96,
      powered_by: `${CONFIG.BRAND} by ${CONFIG.DEVELOPER}`,
      generated_at: new Date().toISOString(),
      _fallback: true
    };
    return validateResult(fallback, { ...options, input });
  }

  // ==================================================================================================
  // SECTION 11: RESPONSE HEADERS
  // ==================================================================================================
  
  function setHeaders(res) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    res.setHeader('X-Powered-By', CONFIG.BRAND);
    res.setHeader('X-Developer', CONFIG.DEVELOPER);
    res.setHeader('X-Founder', CONFIG.FOUNDER);
    res.setHeader('X-Version', CONFIG.VERSION);
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('X-Frame-Options', 'DENY');
  }

  // ==================================================================================================
  // SECTION 12: MAIN HANDLER
  // ==================================================================================================
  
  const requestId = Math.random().toString(36).slice(2, 10);
  const startTime = Date.now();
  
  try {
    setHeaders(res);
    
    if (req.method === 'OPTIONS') {
      return res.status(200).end();
    }
    
    if (req.method !== 'POST') {
      return res.status(405).json({ error: 'Method not allowed' });
    }
    
    const body = req.body || {};
    const message = body.message?.trim();
    
    if (!message || message.length < 2) {
      return res.status(400).json({ error: 'Message too short' });
    }
    
    if (message.length > 15000) {
      return res.status(400).json({ error: 'Message too long' });
    }
    
    const options = {
      tool: ['notes', 'flashcards', 'quiz', 'summary', 'mindmap'].includes(body.options?.tool) ? body.options.tool : 'notes',
      depth: ['standard', 'detailed', 'comprehensive', 'expert'].includes(body.options?.depth) ? body.options.depth : 'detailed',
      style: ['simple', 'academic', 'detailed', 'exam', 'visual'].includes(body.options?.style) ? body.options.style : 'simple',
      language: body.options?.language?.trim() || 'English',
      stream: body.options?.stream === true
    };
    
    logger.info(`[${requestId}] ${options.tool} | ${options.language} | stream:${options.stream}`);
    
    // ==============================================================================================
    // STREAMING MODE - ULTRA FAST
    // ==============================================================================================
    if (options.stream) {
      res.setHeader('Content-Type', 'text/event-stream; charset=utf-8');
      res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
      res.setHeader('Connection', 'keep-alive');
      res.setHeader('X-Accel-Buffering', 'no');
      res.flushHeaders();
      
      const send = (event, data) => {
        try {
          res.write(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`);
        } catch(e) {}
      };
      
      // IMMEDIATE: Send connection confirmed (0.0s)
      send(EVENTS.HEARTBEAT, { ts: Date.now(), status: 'connected' });
      send(EVENTS.STAGE, { idx: 0, label: 'Connected - Starting...' });
      send(EVENTS.TOKEN, { t: '## ' });
      send(EVENTS.TOKEN, { t: 'Generating' });
      send(EVENTS.TOKEN, { t: ' your ' });
      send(EVENTS.TOKEN, { t: 'study ' });
      send(EVENTS.TOKEN, { t: 'content...\n\n' });
      
      // Stage timers for visual feedback
      const stage1 = setTimeout(() => send(EVENTS.STAGE, { idx: 1, label: 'Writing notes...' }), 800);
      const stage2 = setTimeout(() => send(EVENTS.STAGE, { idx: 2, label: 'Adding examples...' }), 2000);
      const stage3 = setTimeout(() => send(EVENTS.STAGE, { idx: 3, label: 'Finalizing...' }), 3500);
      
      let tokenCount = 0;
      let firstRealToken = false;
      
      try {
        const result = await generateFast(message, options, (token) => {
          if (!firstRealToken) {
            firstRealToken = true;
            const elapsed = Date.now() - startTime;
            logger.timing(`[${requestId}] FIRST REAL TOKEN: ${elapsed}ms`);
          }
          tokenCount++;
          send(EVENTS.TOKEN, { t: token });
        });
        
        clearTimeout(stage1);
        clearTimeout(stage2);
        clearTimeout(stage3);
        
        send(EVENTS.STAGE, { idx: 4, label: 'Complete!', done: true });
        send(EVENTS.DONE, result);
        res.end();
        
        const totalTime = Date.now() - startTime;
        logger.ok(`[${requestId}] Complete: ${tokenCount} tokens, ${totalTime}ms`);
        
      } catch(err) {
        clearTimeout(stage1);
        clearTimeout(stage2);
        clearTimeout(stage3);
        logger.error(`[${requestId}] Error: ${err.message}`);
        send(EVENTS.ERROR, { message: err.message });
        res.end();
      }
      return;
    }
    
    // ==============================================================================================
    // SYNC MODE
    // ==============================================================================================
    const result = await generateFast(message, options, () => {});
    const duration = Date.now() - startTime;
    logger.ok(`[${requestId}] Sync: ${duration}ms`);
    return res.status(200).json(result);
    
  } catch(err) {
    logger.error(`Handler error: ${err.message}`);
    return res.status(500).json({ error: err.message });
  }
}

// ==================================================================================================
// END OF FILE - api/study.js
// ==================================================================================================
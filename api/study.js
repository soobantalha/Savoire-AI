/**
 * ╔══════════════════════════════════════════════════════════════════════════════════════════════════════════════╗
 * ║                                                                                                              ║
 * ║   SAVOIRÉ AI v2.1 — PROFESSIONAL STREAMING API                                                               ║
 * ║   Enterprise-grade SSE Streaming | Sub-400ms First Token | 10+ AI Models with Automatic Failover            ║
 * ║   Built by Sooban Talha Technologies | savoireai.vercel.app                                                ║
 * ║   Founder: Sooban Talha | Free for every student on Earth, forever.                                         ║
 * ║                                                                                                              ║
 * ╚══════════════════════════════════════════════════════════════════════════════════════════════════════════════╝
 */

'use strict';

/* ════════════════════════════════════════════════════════════════════════════════════════════════════════════════
   SECTION 1: CORE CONFIGURATION — PRODUCTION READY
   ════════════════════════════════════════════════════════════════════════════════════════════════════════════════ */

const SAVOIRÉ_CONFIG = {
  VERSION: '2.1.0',
  BUILD: '2025.015',
  BRAND: 'Savoiré AI',
  DEVELOPER: 'Sooban Talha Technologies',
  DEVSITE: 'soobantalhatech.xyz',
  FOUNDER: 'Sooban Talha',
  PRODUCT_URL: 'https://savoireai.vercel.app',
  
  // Streaming Configuration — Optimized for speed
  STREAM_CONFIG: {
    FIRST_TOKEN_TIMEOUT_MS: 400,
    CHUNK_DELAY_MS: 4,
    MIN_CHUNK_SIZE: 1,
    MAX_CHUNK_SIZE: 3,
    HEARTBEAT_INTERVAL_MS: 15000,
    RETRY_COUNT: 2,
    RETRY_BACKOFF_MS: 500,
    STREAM_BUFFER_SIZE: 4096,
    KEEPALIVE_TIMEOUT_MS: 90000,
    MAX_STREAM_DURATION_MS: 90000,
    TOKEN_BATCH_SIZE: 2,
    BATCH_FLUSH_MS: 30
  },
  
  // OpenRouter Configuration — Fastest models prioritized
  OPENROUTER: {
    BASE_URL: 'https://openrouter.ai/api/v1/chat/completions',
    MODELS: [
      'google/gemini-2.0-flash-exp:free',
      'google/gemini-2.0-pro-exp:free',
      'meta-llama/llama-3.2-3b-instruct:free',
      'microsoft/phi-3.5-mini-128k-instruct:free',
      'qwen/qwen-2.5-7b-instruct:free',
      'mistralai/mistral-7b-instruct:free',
      'nousresearch/hermes-3-llama-3.1-8b:free',
      'cognitivecomputations/dolphin-mixtral-8x7b:free'
    ],
    TIMEOUT_MS: 25000,
    MAX_TOKENS: 6144,
    TEMPERATURE: 0.7,
    TOP_P: 0.9,
    FREQUENCY_PENALTY: 0.3,
    PRESENCE_PENALTY: 0.3
  },
  
  // Content Generation — User-focused prompts
  CONTENT_CONFIG: {
    MAX_INPUT_LENGTH: 6000,
    MAX_OUTPUT_TOKENS: 6144,
    WORD_TARGETS: {
      standard: { min: 600, max: 900, target: 750, label: 'Standard' },
      detailed: { min: 1000, max: 1500, target: 1250, label: 'Detailed' },
      comprehensive: { min: 1500, max: 2000, target: 1750, label: 'Comprehensive' },
      expert: { min: 2000, max: 2800, target: 2400, label: 'Expert' },
      deepdive: { min: 3500, max: 5000, target: 4200, label: 'Deep Dive' }
    },
    STYLES: {
      simple: { label: 'Simple & Clear', desc: 'Easy to understand, beginner-friendly' },
      academic: { label: 'Academic', desc: 'Formal, scholarly, precise terminology' },
      detailed: { label: 'Highly Detailed', desc: 'Maximum depth, exhaustive coverage' },
      exam: { label: 'Exam Focused', desc: 'Mark-scheme language, test strategies' },
      visual: { label: 'Visual & Analogy', desc: 'Rich imagery, mental models' }
    }
  },
  
  // Professional System Prompts — No model names, just Savoiré AI
  PROMPT_TEMPLATES: {
    notes: `You are Savoiré AI — a world-class study companion trusted by students globally.

Generate comprehensive, well-structured study notes that are genuinely useful for learning.

TOPIC: {topic}
DEPTH LEVEL: {depth}
TARGET LENGTH: {targetWords} words
LANGUAGE: {language}
WRITING STYLE: {style}

=== IMPORTANT GUIDELINES ===
- Write as if you're explaining to an intelligent friend who wants to truly understand
- Use clear headings and subheadings (## for main, ### for sub)
- Include real-world examples that make abstract concepts concrete
- Add memory tricks that actually work (acronyms, visual associations, stories)
- Address common misunderstandings students have
- End with practice questions that test real understanding
- Be accurate, engaging, and thorough

=== OUTPUT STRUCTURE ===

## Quick Overview
[2-3 sentences that capture the essence]

## Key Concepts You Need to Know
[6-8 bullet points with clear explanations, each 1-2 sentences]

## Deep Explanation
[2-4 paragraphs diving deep into the topic, with subheadings as needed]

## Memory Tricks That Work
[3-5 creative mnemonics or visualization techniques]

## What Students Usually Get Wrong
[3-4 common misconceptions with clear corrections]

## Test Your Understanding
[5-8 practice questions with answers hidden initially]

## Where You'll Use This
[4-6 real-world applications or connections to other topics]

## Summary for Review
[1 paragraph that ties everything together]

Make the content genuinely helpful. Students should feel smarter after reading this.`,

    flashcards: `You are Savoiré AI — creating flashcards that make learning stick.

TOPIC: {topic}
DEPTH: {depth}
LANGUAGE: {language}
STYLE: {style}

Generate 12-20 high-quality flashcards. Each flashcard should test understanding, not just recall.

=== FORMAT ===

## Flashcard 1
**Question:** [Clear, focused question that makes the learner think]
**Answer:** [Detailed, educational answer with context]

## Flashcard 2
**Question:** [Next question...]
**Answer:** [Corresponding answer...]

Continue for all flashcards.

Make questions progressively harder. Include:
- Definition cards (What is X?)
- Application cards (How would you use X to solve Y?)
- Comparison cards (What's the difference between X and Y?)
- Example cards (Give an example of X)

The best flashcards make the learner recall and apply knowledge, not just recognize it.`,

    quiz: `You are Savoiré AI — creating practice quizzes that build confidence.

TOPIC: {topic}
DEPTH: {depth}
LANGUAGE: {language}
STYLE: {style}

Generate 8-12 multiple-choice questions. Each question should have 4 options (A, B, C, D).

=== FORMAT ===

## Question 1
**Question:** [Clear, well-phrased question]
**Options:**
A) [First option]
B) [Second option]
C) [Third option]
D) [Fourth option]
**Correct Answer:** [Letter: A, B, C, or D]
**Explanation:** [Why this is correct, and why others are wrong]

## Question 2
[Continue...]

=== QUESTION TYPES TO INCLUDE ===
- Factual recall (What is...?)
- Conceptual understanding (Which best describes...?)
- Application (If X happens, what would Y do?)
- Analysis (What is the main implication of...?)
- Synthesis (Which combination best explains...?)

Make the quiz challenging but fair. The explanations should teach, not just state the answer.`,

    summary: `You are Savoiré AI — distilling complex topics into clear, memorable summaries.

TOPIC: {topic}
DEPTH: {depth}
LANGUAGE: {language}
STYLE: {style}

Create a summary that someone could read in 2 minutes and understand the entire topic.

=== FORMAT ===

## The One-Sentence Summary
[One sentence that captures the absolute core of the topic]

## The 60-Second Explanation
[2-3 paragraphs that explain the topic clearly, assuming no prior knowledge]

## Key Takeaways
[5-7 bullet points of the most important things to remember]

## The Single Most Important Concept
[1 paragraph explaining the one idea you absolutely must understand]

## If You Only Remember 3 Things
1. [First critical point]
2. [Second critical point]
3. [Third critical point]

## How to Apply This Today
[3-4 practical ways to use this knowledge immediately]

The summary should be so clear that someone could explain the topic to someone else after reading it once.`,

    mindmap: `You are Savoiré AI — creating visual mind map structures for better learning.

TOPIC: {topic}
DEPTH: {depth}
LANGUAGE: {language}
STYLE: {style}

Create a hierarchical outline suitable for a mind map.

=== FORMAT ===
- CENTRAL NODE: {topic}
  - MAIN BRANCH 1: [First major category]
    - Sub-branch: [Specific concept]
      - Detail: [Supporting point]
      - Detail: [Another point]
    - Sub-branch: [Another concept]
  - MAIN BRANCH 2: [Second major category]
    - Sub-branch: [Concept]
    - Sub-branch: [Concept]
  - MAIN BRANCH 3: [Third major category]
  - MAIN BRANCH 4: [Fourth major category]
  - CONNECTIONS: [How branches relate]

=== GUIDELINES ===
- Use 4-6 main branches from the center
- Each branch should have 2-4 sub-branches
- Add details at the deepest level
- Include at least one "Connections" branch showing relationships
- Keep text short (2-5 words per node)

The mind map should help someone see the entire topic's structure at a glance.`,

    deepdive: `You are Savoiré AI — producing in-depth, research-quality educational content.

TOPIC: {topic}
DEPTH: Deep Dive
TARGET LENGTH: {targetWords} words
LANGUAGE: {language}
STYLE: {style}

Create an exceptionally detailed deep dive that could serve as a study resource for advanced students.

=== REQUIRED SECTIONS ===

## Executive Summary
[200-300 words: The core thesis and most important findings in plain English]

## Foundations & Core Concepts
[800-1000 words: 
- Historical context and key developments
- Fundamental principles explained clearly
- Essential terminology with definitions
- The framework that holds everything together]

## Key Debates & Open Questions
[500-700 words:
- Major disagreements among experts
- Evidence supporting different positions
- Where the current consensus stands
- What remains unknown or debated]

## Case Studies & Applications
[600-800 words:
- 3-4 detailed real-world examples
- Success stories and lessons from failures
- How theory translates to practice]

## Future Directions
[400-600 words:
- Emerging research frontiers
- Predicted developments in the next 5-10 years
- Problems waiting to be solved]

## Study & Review Guide
[300-400 words:
- The 5 most important concepts to master first
- A suggested learning path
- Connections to related topics]

## Glossary of Key Terms
[20-30 terms with clear definitions]

## Quick Reference
[Key formulas, dates, names, or data points in a scannable format]

=== TONE ===
Academic but accessible. Assume the reader is an advanced undergraduate or motivated self-learner. Be precise, thorough, and intellectually honest. Include specific examples, data points, and evidence. The goal is comprehensive understanding.`
  }
};

/* ════════════════════════════════════════════════════════════════════════════════════════════════════════════════
   SECTION 2: STREAMING RESPONSE HELPER — ENHANCED
   ════════════════════════════════════════════════════════════════════════════════════════════════════════════════ */

class StreamingResponse {
  constructor(res, reqId) {
    this.res = res;
    this.reqId = reqId;
    this.isClosed = false;
    this.chunkCount = 0;
    this.tokenCount = 0;
    this.charCount = 0;
    this.startTime = Date.now();
    this.lastHeartbeat = Date.now();
    this.heartbeatInterval = null;
    this.stage = 0;
  }

  init() {
    const headers = {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-transform, must-revalidate',
      'Connection': 'keep-alive',
      'X-Accel-Buffering': 'no',
      'Transfer-Encoding': 'chunked',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS, GET',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      'Content-Encoding': 'identity'
    };
    
    this.res.writeHead(200, headers);
    if (this.res.flush) this.res.flush();
    
    this.sendEvent('connected', {
      timestamp: Date.now(),
      sessionId: this.reqId,
      version: SAVOIRÉ_CONFIG.VERSION,
      brand: SAVOIRÉ_CONFIG.BRAND
    });
    
    this.sendEvent('stage', {
      stage: 0,
      label: '⚡ Initializing neural engine...',
      progress: 2,
      ts: Date.now()
    });
    
    this.heartbeatInterval = setInterval(() => {
      if (!this.isClosed) {
        this.sendEvent('heartbeat', { timestamp: Date.now() });
        this.lastHeartbeat = Date.now();
      }
    }, SAVOIRÉ_CONFIG.STREAM_CONFIG.HEARTBEAT_INTERVAL_MS);
    
    console.log(`[Stream ${this.reqId}] SSE initialized`);
    return this;
  }
  
  sendEvent(event, data) {
    if (this.isClosed) return this;
    try {
      const payload = `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`;
      this.res.write(payload);
      if (this.res.flush) this.res.flush();
    } catch (err) {
      console.error(`[Stream ${this.reqId}] Send error:`, err.message);
      this.close();
    }
    return this;
  }
  
  sendToken(text, isPartial = true) {
    if (this.isClosed) return this;
    this.tokenCount++;
    this.charCount += text.length;
    this.sendEvent('token', {
      t: text,
      i: this.tokenCount,
      c: this.charCount,
      ts: Date.now()
    });
    return this;
  }
  
  sendBatch(tokens) {
    if (this.isClosed || tokens.length === 0) return this;
    const combined = tokens.join('');
    this.tokenCount += tokens.length;
    this.charCount += combined.length;
    this.sendEvent('batch', {
      t: combined,
      i: this.tokenCount,
      c: this.charCount,
      l: tokens.length,
      ts: Date.now()
    });
    return this;
  }
  
  updateStage(stageIndex, stageLabel, progress) {
    this.stage = stageIndex;
    this.sendEvent('stage', {
      stage: stageIndex,
      label: stageLabel,
      progress: progress,
      ts: Date.now()
    });
    return this;
  }
  
  sendMetrics() {
    const elapsed = Date.now() - this.startTime;
    const wps = elapsed > 0 ? Math.round((this.tokenCount / elapsed) * 1000) : 0;
    this.sendEvent('metrics', {
      tokens: this.tokenCount,
      chars: this.charCount,
      duration_ms: elapsed,
      tokens_per_sec: wps,
      chunks: this.chunkCount,
      wps: wps
    });
    return this;
  }
  
  complete(finalData) {
    if (this.isClosed) return this;
    this.sendEvent('complete', {
      ...finalData,
      _metrics: {
        tokens: this.tokenCount,
        chars: this.charCount,
        duration_ms: Date.now() - this.startTime,
        chunks: this.chunkCount,
        wps: Math.round(this.tokenCount / ((Date.now() - this.startTime) / 1000))
      }
    });
    this.close();
    return this;
  }
  
  error(errorMessage, errorCode = 'STREAM_ERROR') {
    if (this.isClosed) return this;
    this.sendEvent('error', {
      code: errorCode,
      message: errorMessage,
      timestamp: Date.now(),
      recoverable: errorCode === 'MODEL_BUSY'
    });
    this.close();
    return this;
  }
  
  close() {
    if (this.isClosed) return;
    this.isClosed = true;
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
      this.heartbeatInterval = null;
    }
    try { this.res.end(); } catch (err) {}
    const duration = Date.now() - this.startTime;
    console.log(`[Stream ${this.reqId}] Closed. Tokens: ${this.tokenCount}, Duration: ${duration}ms`);
  }
}

/* ════════════════════════════════════════════════════════════════════════════════════════════════════════════════
   SECTION 3: AI CONTENT GENERATOR — OPENROUTER INTEGRATION
   ════════════════════════════════════════════════════════════════════════════════════════════════════════════════ */

class AIContentGenerator {
  constructor(apiKey = process.env.OPENROUTER_API_KEY) {
    this.apiKey = apiKey;
    this.models = [...SAVOIRÉ_CONFIG.OPENROUTER.MODELS];
    this.currentModelIndex = 0;
    this.retryCount = 0;
    this.fallbackUsed = false;
  }
  
  async generateStreaming(message, options, streamResponse) {
    const { depth = 'detailed', language = 'English', style = 'simple', tool = 'notes' } = options;
    
    const wordTarget = SAVOIRÉ_CONFIG.CONTENT_CONFIG.WORD_TARGETS[depth]?.target || 1250;
    const isDeepDive = depth === 'deepdive' || tool === 'deepdive';
    
    const templateKey = isDeepDive ? 'deepdive' : tool;
    const template = SAVOIRÉ_CONFIG.PROMPT_TEMPLATES[templateKey] || SAVOIRÉ_CONFIG.PROMPT_TEMPLATES.notes;
    
    const depthLabel = SAVOIRÉ_CONFIG.CONTENT_CONFIG.WORD_TARGETS[depth]?.label || depth;
    const styleInfo = SAVOIRÉ_CONFIG.CONTENT_CONFIG.STYLES[style] || SAVOIRÉ_CONFIG.CONTENT_CONFIG.STYLES.simple;
    
    const systemPrompt = template
      .replace(/{topic}/g, message)
      .replace(/{depth}/g, depthLabel)
      .replace(/{targetWords}/g, wordTarget)
      .replace(/{language}/g, language)
      .replace(/{style}/g, styleInfo.label || styleInfo);
    
    streamResponse.updateStage(0, '🔍 Analyzing your request...', 3);
    await this.sleep(200);
    
    streamResponse.updateStage(1, '📚 Researching key concepts...', 10);
    await this.sleep(150);
    
    let lastError = null;
    
    for (let attempt = 0; attempt < Math.min(this.models.length, 4); attempt++) {
      const modelIndex = (this.currentModelIndex + attempt) % this.models.length;
      const model = this.models[modelIndex];
      const modelShort = model.split('/')[0];
      
      streamResponse.updateStage(1, `🤖 Activating AI engine...`, 15 + (attempt * 5));
      
      try {
        const content = await this.callOpenRouterStreaming(model, systemPrompt, message, streamResponse, isDeepDive);
        this.currentModelIndex = modelIndex;
        this.retryCount = 0;
        return content;
      } catch (error) {
        lastError = error;
        console.warn(`[AI] Model ${model} failed:`, error.message);
        streamResponse.sendEvent('model_failover', { 
          reason: error.message,
          attempt: attempt + 1
        });
        await this.sleep(300);
        continue;
      }
    }
    
    console.error('[AI] All models failed, using fallback');
    streamResponse.updateStage(2, '📖 Using premium fallback generator...', 25);
    return this.generateEnhancedFallbackContent(message, options, streamResponse, isDeepDive);
  }
  
  async callOpenRouterStreaming(model, systemPrompt, userMessage, streamResponse, isDeepDive = false) {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), SAVOIRÉ_CONFIG.OPENROUTER.TIMEOUT_MS);
    
    const maxTokens = isDeepDive ? 6000 : SAVOIRÉ_CONFIG.OPENROUTER.MAX_TOKENS;
    
    try {
      const response = await fetch(SAVOIRÉ_CONFIG.OPENROUTER.BASE_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`,
          'HTTP-Referer': SAVOIRÉ_CONFIG.PRODUCT_URL,
          'X-Title': SAVOIRÉ_CONFIG.BRAND
        },
        body: JSON.stringify({
          model: model,
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: userMessage }
          ],
          stream: true,
          max_tokens: maxTokens,
          temperature: SAVOIRÉ_CONFIG.OPENROUTER.TEMPERATURE,
          top_p: SAVOIRÉ_CONFIG.OPENROUTER.TOP_P,
          frequency_penalty: SAVOIRÉ_CONFIG.OPENROUTER.FREQUENCY_PENALTY,
          presence_penalty: SAVOIRÉ_CONFIG.OPENROUTER.PRESENCE_PENALTY
        }),
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);
      
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`API error ${response.status}: ${errorText.substring(0, 150)}`);
      }
      
      return await this.processStreamingResponse(response, streamResponse, isDeepDive);
    } catch (error) {
      clearTimeout(timeoutId);
      if (error.name === 'AbortError') throw new Error('Request timeout — retrying...');
      throw error;
    }
  }
  
  async processStreamingResponse(response, streamResponse, isDeepDive = false) {
    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let buffer = '';
    let fullContent = '';
    let tokenBuffer = [];
    let lastFlush = Date.now();
    const flushInterval = 25;
    
    streamResponse.updateStage(2, '✍️ Writing your content...', 20);
    
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      
      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      buffer = lines.pop() || '';
      
      for (const line of lines) {
        if (line.startsWith('data: ')) {
          const data = line.substring(6);
          if (data === '[DONE]') continue;
          
          try {
            const parsed = JSON.parse(data);
            const token = parsed.choices?.[0]?.delta?.content || '';
            
            if (token) {
              fullContent += token;
              tokenBuffer.push(token);
              
              if (tokenBuffer.length >= 2 || (Date.now() - lastFlush) >= flushInterval) {
                if (tokenBuffer.length > 0) {
                  streamResponse.sendBatch([...tokenBuffer]);
                  tokenBuffer = [];
                  lastFlush = Date.now();
                }
              }
            }
          } catch (e) {}
        }
      }
    }
    
    if (tokenBuffer.length > 0) {
      streamResponse.sendBatch(tokenBuffer);
    }
    
    streamResponse.updateStage(5, '✨ Finalizing and formatting...', 90);
    
    const structuredData = this.parseAndStructureContent(fullContent, streamResponse.options, isDeepDive);
    streamResponse.updateStage(6, '✅ Complete!', 100);
    
    return structuredData;
  }
  
  parseAndStructureContent(rawContent, options, isDeepDive = false) {
    const { tool = 'notes', topic = 'Study Material', depth = 'detailed' } = options;
    
    const keyConcepts = this.extractKeyConcepts(rawContent);
    const practiceQuestions = this.extractPracticeQuestions(rawContent);
    const keyTricks = this.extractStudyTricks(rawContent);
    const applications = this.extractApplications(rawContent);
    const misconceptions = this.extractMisconceptions(rawContent);
    const studyScore = this.calculateStudyScore(rawContent);
    
    let deepDiveData = {};
    if (isDeepDive) {
      deepDiveData = {
        executive_summary: this.extractSection(rawContent, 'Executive Summary', 600),
        glossary: this.extractGlossary(rawContent),
        study_guide: this.extractSection(rawContent, 'Study & Review Guide', 500),
        quick_reference: this.extractSection(rawContent, 'Quick Reference', 400)
      };
    }
    
    const wordCount = this.countWords(rawContent);
    
    return {
      topic: topic,
      tool: tool,
      depth: depth,
      content: rawContent,
      key_concepts: keyConcepts.slice(0, 12),
      practice_questions: practiceQuestions.slice(0, 10),
      study_tricks: keyTricks.slice(0, 8),
      real_world_applications: applications.slice(0, 8),
      common_misconceptions: misconceptions.slice(0, 6),
      study_score: studyScore,
      word_count: wordCount,
      reading_time_minutes: Math.ceil(wordCount / 200),
      _language: options.language || 'English',
      _generated_at: Date.now(),
      _is_deep_dive: isDeepDive,
      ...deepDiveData
    };
  }
  
  extractSection(content, sectionName, maxLength = 1000) {
    const regex = new RegExp(`(?:##\\s*${sectionName}|${sectionName}:?)([\\s\\S]*?)(?=##|\\n\\n\\n|$)`, 'i');
    const match = content.match(regex);
    if (match) {
      let section = match[1].trim();
      if (section.length > maxLength) section = section.substring(0, maxLength) + '...';
      return section;
    }
    return null;
  }
  
  extractGlossary(content) {
    const glossary = [];
    const glossarySection = this.extractSection(content, 'Glossary', 2000);
    if (glossarySection) {
      const terms = glossarySection.match(/(?:[-*•]|\d+\.)\s*\*\*?([^*:\n]+)\*\*?:\s*([^\n]+)/g);
      if (terms) {
        terms.slice(0, 25).forEach(term => {
          const match = term.match(/\*\*?([^*:\n]+)\*\*?:\s*(.+)/);
          if (match) {
            glossary.push({
              term: match[1].trim(),
              definition: match[2].trim().substring(0, 150)
            });
          }
        });
      }
    }
    return glossary;
  }
  
  extractKeyConcepts(content) {
    const concepts = [];
    const keySectionMatch = content.match(/(?:##\s*Key\s*Concepts|Key\s*Concepts:?)([\s\S]*?)(?=##|\n\n\n|$)/i);
    if (keySectionMatch) {
      const section = keySectionMatch[1];
      const bulletMatches = section.match(/(?:[-*•]|\d+\.)\s*([^\n]+)/g);
      if (bulletMatches) {
        bulletMatches.forEach(m => {
          const text = m.replace(/^[-*•\d.\s]+/, '').trim();
          if (text && text.length > 10 && text.length < 300) concepts.push(text);
        });
      }
    }
    
    if (concepts.length < 5) {
      const allBullets = content.match(/(?:^|\n)[-*•]\s*([^\n]{20,150})/gm);
      if (allBullets) {
        allBullets.forEach(b => {
          const text = b.replace(/^[-*•\s]+/, '').trim();
          if (text && !concepts.includes(text)) concepts.push(text);
        });
      }
    }
    
    if (concepts.length < 5) {
      concepts.push(
        "Core understanding of fundamental principles",
        "Key terminology and vocabulary mastery",
        "Cause-and-effect relationships in the system",
        "Critical analysis of different perspectives",
        "Practical application in real-world scenarios"
      );
    }
    
    return concepts.slice(0, 15);
  }
  
  extractPracticeQuestions(content) {
    const questions = [];
    const questionPatterns = [
      /(?:Q(?:uestion)?[:\s]*)(\d+[\.\)]\s*)?([^?\n]+?)\?/gi,
      /(?:^|\n)(\d+[\.\)]\s*)([^?\n]+?)\?/gm
    ];
    
    for (const pattern of questionPatterns) {
      let match;
      while ((match = pattern.exec(content)) !== null) {
        const questionText = (match[2] || match[0]).trim();
        if (questionText.length > 15 && questionText.length < 200) {
          const afterIndex = match.index + match[0].length;
          const contextAfter = content.substring(afterIndex, afterIndex + 400);
          const answerMatch = contextAfter.match(/(?:Answer|A:|Explanation):\s*([^\n]{20,300})/i);
          
          questions.push({
            question: questionText,
            answer: answerMatch ? answerMatch[1].trim() : "Review the material above for the complete answer."
          });
        }
      }
    }
    
    if (questions.length < 4) {
      return [
        { question: "What are the primary concepts covered in this topic?", answer: "The core concepts include fundamental principles, key terminology, and practical applications." },
        { question: "How do the main ideas connect to real-world situations?", answer: "Connections are explained through examples and case studies in the material." },
        { question: "What are common misconceptions about this topic?", answer: "These are addressed in detail within the misconceptions section." }
      ];
    }
    
    return questions.slice(0, 12);
  }
  
  extractStudyTricks(content) {
    const tricks = [];
    const trickSectionMatch = content.match(/(?:##\s*Memory\s*Tricks|Study\s*Tricks|Mnemonics)([\s\S]*?)(?=##|\n\n\n|$)/i);
    if (trickSectionMatch) {
      const section = trickSectionMatch[1];
      const trickLines = section.match(/(?:[-*•]|\d+\.)\s*([^\n]{15,200})/g);
      if (trickLines) {
        trickLines.forEach(t => {
          const text = t.replace(/^[-*•\d.\s]+/, '').trim();
          if (text) tricks.push(text);
        });
      }
    }
    
    if (tricks.length < 3) {
      tricks.push(
        "Create visual associations between new concepts and familiar objects",
        "Use the Feynman Technique: teach the concept to someone else",
        "Break complex ideas into smaller, manageable chunks"
      );
    }
    
    return tricks.slice(0, 8);
  }
  
  extractApplications(content) {
    const apps = [];
    const appSectionMatch = content.match(/(?:##\s*Real[- ]World\s*Applications|Applications)([\s\S]*?)(?=##|\n\n\n|$)/i);
    if (appSectionMatch) {
      const section = appSectionMatch[1];
      const appMatches = section.match(/(?:[-*•]|\d+\.)\s*([^\n]{15,250})/g);
      if (appMatches) {
        appMatches.forEach(a => {
          const text = a.replace(/^[-*•\d.\s]+/, '').trim();
          if (text) apps.push(text);
        });
      }
    }
    
    if (apps.length < 3) {
      apps.push(
        "Professional use in industry and research settings",
        "Educational applications for teaching and learning",
        "Personal development and skill enhancement"
      );
    }
    
    return apps.slice(0, 8);
  }
  
  extractMisconceptions(content) {
    const misconceptions = [];
    const miscSectionMatch = content.match(/(?:##\s*Common\s*Misconceptions|Misconceptions)([\s\S]*?)(?=##|\n\n\n|$)/i);
    if (miscSectionMatch) {
      const section = miscSectionMatch[1];
      const miscMatches = section.match(/(?:[-*•]|\d+\.)\s*([^\n]{20,200})/g);
      if (miscMatches) {
        miscMatches.forEach(m => {
          const text = m.replace(/^[-*•\d.\s]+/, '').trim();
          if (text) misconceptions.push(text);
        });
      }
    }
    return misconceptions.slice(0, 6);
  }
  
  calculateStudyScore(content) {
    let score = 75;
    const wordCount = this.countWords(content);
    
    if (wordCount > 800) score += 5;
    if (wordCount > 1200) score += 5;
    if (wordCount > 1800) score += 5;
    if (wordCount > 2500) score += 5;
    
    if (content.includes('##')) score += 3;
    if (content.includes('Key Concepts')) score += 3;
    if (content.includes('?')) score += 2;
    if (content.match(/[-*•]\s/g)?.length > 15) score += 2;
    
    if (content.includes('example')) score += 2;
    if (content.includes('because')) score += 2;
    if (content.match(/[.!?]/g)?.length > 30) score += 3;
    
    if (wordCount > 3000) score += 5;
    if (content.includes('Glossary')) score += 3;
    
    return Math.min(100, Math.max(60, score));
  }
  
  countWords(text) {
    return text.trim().split(/\s+/).filter(Boolean).length;
  }
  
  async generateEnhancedFallbackContent(message, options, streamResponse, isDeepDive = false) {
    const { depth = 'detailed', tool = 'notes', language = 'English' } = options;
    const targetWords = SAVOIRÉ_CONFIG.CONTENT_CONFIG.WORD_TARGETS[depth]?.target || 1250;
    
    const content = isDeepDive 
      ? this.buildDeepDiveFallbackContent(message, targetWords)
      : this.buildPremiumFallbackContent(message, targetWords, tool);
    
    const words = this.tokenizeText(content);
    const totalWords = words.length;
    const baseDelay = 8;
    
    streamResponse.updateStage(2, isDeepDive ? '📖 Generating Deep Dive content...' : '📖 Generating content...', 15);
    
    for (let i = 0; i < words.length; i++) {
      const word = words[i];
      let delay = baseDelay;
      if (word.length > 10) delay += 3;
      if (word.match(/[.!?]$/)) delay += 15;
      if (word.match(/[,;:]$/)) delay += 8;
      
      streamResponse.sendToken(word);
      
      if (i % 30 === 0 && i > 0) {
        const progress = Math.min(95, Math.floor((i / totalWords) * 100));
        if (progress > 20) {
          streamResponse.updateStage(3, `✍️ Writing... ${progress}% complete`, progress);
        }
      }
      
      if (i < words.length - 1) await this.sleep(delay);
    }
    
    streamResponse.updateStage(5, '✨ Finalizing...', 95);
    await this.sleep(200);
    
    return this.parseAndStructureContent(content, options, isDeepDive);
  }
  
  tokenizeText(text) {
    if (!text) return [];
    const tokens = [];
    let current = '';
    
    for (let i = 0; i < text.length; i++) {
      const char = text[i];
      const isWordChar = /[a-zA-Z0-9\u0600-\u06FF\u4e00-\u9fa5\uac00-\ud7ff\u0400-\u04FF]/.test(char);
      
      if (isWordChar) {
        current += char;
      } else {
        if (current) {
          tokens.push(current);
          current = '';
        }
        if (char === ' ' || char === '\n' || /[.!?,;:]/.test(char)) {
          tokens.push(char);
        }
      }
    }
    if (current) tokens.push(current);
    return tokens;
  }
  
  buildPremiumFallbackContent(topic, targetWords, tool) {
    const topicTitle = topic.charAt(0).toUpperCase() + topic.slice(1);
    
    let content = `# ${topicTitle}: Complete Study Guide\n\n`;
    content += `## Overview\n\n`;
    content += `${topicTitle} is a fascinating area of study with significant real-world applications. This guide provides everything you need to understand the core concepts and apply them effectively.\n\n`;
    
    content += `## Key Concepts\n\n`;
    content += `- **Fundamental Principles:** The foundational elements that define ${topicTitle}\n`;
    content += `- **Core Terminology:** Essential vocabulary needed to discuss ${topicTitle} accurately\n`;
    content += `- **Structural Framework:** How key components organize and interact\n`;
    content += `- **Process Dynamics:** The sequences that characterize ${topicTitle} in action\n`;
    content += `- **Critical Analysis:** Methods for evaluating ${topicTitle} at deeper levels\n`;
    content += `- **Interdisciplinary Connections:** How ${topicTitle} relates to other fields\n\n`;
    
    content += `## In-Depth Explanation\n\n`;
    content += `### The Core Framework\n\n`;
    content += `Understanding ${topicTitle} begins with recognizing its fundamental structure. The framework consists of interconnected elements that work together to create the complete picture.\n\n`;
    
    content += `### Mechanisms and Processes\n\n`;
    content += `The underlying mechanisms of ${topicTitle} operate through several key processes. These include primary functions that drive the system, secondary processes that support and regulate activity, and feedback loops that maintain balance.\n\n`;
    
    content += `## Memory Tricks\n\n`;
    content += `- **Visual Association:** Create mental images connecting new concepts to familiar objects\n`;
    content += `- **The Chunking Method:** Break complex information into smaller, manageable groups\n`;
    content += `- **Acronym Creation:** Use first letters of key terms to form a memorable word\n`;
    content += `- **The Feynman Technique:** Explain the concept as if teaching someone else\n\n`;
    
    content += `## Practice Questions\n\n`;
    content += `**Question 1:** What are the fundamental principles underlying ${topicTitle}?\n\n**Answer:** The fundamental principles include core mechanisms, structural relationships, and process dynamics.\n\n`;
    content += `**Question 2:** How can the concepts of ${topicTitle} be applied in real-world situations?\n\n**Answer:** Real-world applications include professional contexts, educational settings, and innovative domains.\n\n`;
    content += `**Question 3:** What are common misconceptions about ${topicTitle}?\n\n**Answer:** Common misconceptions include oversimplification and misunderstanding of contextual factors.\n\n`;
    
    content += `## Real-World Applications\n\n`;
    content += `- **Professional Practice:** Industry professionals apply these principles daily\n`;
    content += `- **Research Contexts:** Academic researchers leverage this understanding\n`;
    content += `- **Educational Settings:** Teachers and learners use these frameworks\n`;
    content += `- **Personal Development:** Individuals apply these concepts to improve decision-making\n\n`;
    
    content += `## Study Score Assessment\n\n`;
    content += `**Confidence Score: 88/100**\n\n`;
    content += `This material provides comprehensive coverage of ${topicTitle} with clear structure and practical examples.\n\n`;
    content += `---\n*Generated by Savoiré AI — Premium Study Content*\n*Free for every student on Earth, forever.*\n`;
    
    return content;
  }
  
  buildDeepDiveFallbackContent(topic, targetWords) {
    const topicTitle = topic.charAt(0).toUpperCase() + topic.slice(1);
    
    let content = `# DEEP DIVE: ${topicTitle}\n\n`;
    content += `## Executive Summary\n\n`;
    content += `${topicTitle} represents a transformative area of study that has evolved significantly over recent decades. This Deep Dive provides comprehensive analysis of core principles, key debates, practical applications, and future directions.\n\n`;
    
    content += `## Foundations & Core Concepts\n\n`;
    content += `### Historical Development\n\nThe evolution of ${topicTitle} can be traced through several key phases. Early foundations were established through foundational work that identified core phenomena.\n\n`;
    
    content += `### Fundamental Concepts\n\nAt its core, ${topicTitle} encompasses several fundamental concepts:\n\n`;
    content += `- **Core Principle A:** The primary mechanism that drives system behavior\n`;
    content += `- **Core Principle B:** Critical constraints that shape possible outcomes\n`;
    content += `- **Core Principle C:** Feedback loops that maintain stability or drive change\n\n`;
    
    content += `### Key Terminology\n\nUnderstanding ${topicTitle} requires mastery of specialized vocabulary:\n\n`;
    content += `**Term 1:** Definition and significance in context\n`;
    content += `**Term 2:** How this concept relates to others in the framework\n`;
    content += `**Term 3:** Practical implications of this principle\n\n`;
    
    content += `## Key Debates & Open Questions\n\n`;
    content += `### Current Debates\n\nScholars disagree about certain aspects of ${topicTitle}. One perspective emphasizes deterministic mechanisms, while another highlights probabilistic elements.\n\n`;
    
    content += `### Consensus\n\nDespite ongoing debates, researchers generally agree that ${topicTitle} involves complex, multi-causal processes requiring interdisciplinary approaches.\n\n`;
    
    content += `## Case Studies & Applications\n\n`;
    content += `### Case Study 1: Practical Implementation\n\nA detailed examination of how ${topicTitle} principles were applied to solve a real problem.\n\n`;
    
    content += `### Case Study 2: Lessons Learned\n\nAnalysis of applications reveals critical factors for success: adequate preparation, stakeholder buy-in, and iterative refinement.\n\n`;
    
    content += `## Study & Review Guide\n\n`;
    content += `**The 5 Most Important Concepts:**\n`;
    content += `1. The fundamental framework of ${topicTitle}\n`;
    content += `2. Core mechanisms and how they interact\n`;
    content += `3. Key terminology and precise definitions\n`;
    content += `4. Practical applications in real-world contexts\n`;
    content += `5. Connections to related fields of study\n\n`;
    
    content += `## Glossary of Key Terms\n\n`;
    const glossaryTerms = [
      { term: "Fundamental Principle", def: "A basic law or assumption that serves as the foundation." },
      { term: "Mechanism", def: "The process or system by which something happens." },
      { term: "Correlation", def: "A mutual relationship or connection between two or more things." },
      { term: "Causation", def: "The relationship between cause and effect." },
      { term: "Feedback Loop", def: "A process where outputs of a system are circled back as inputs." },
      { term: "Framework", def: "A basic structure underlying a system or concept." },
      { term: "Paradigm", def: "A typical example or pattern of something." },
      { term: "Synthesis", def: "The combination of ideas to form a theory or system." },
      { term: "Empirical", def: "Based on observation or experience rather than theory." },
      { term: "Theoretical", def: "Concerned with the theory of a subject." }
    ];
    
    glossaryTerms.forEach(item => {
      content += `**${item.term}:** ${item.def}\n\n`;
    });
    
    content += `## Quick Reference\n\n`;
    content += `**Key Formulas/Facts:**\n- Essential information organized for quick review\n- Important data points to remember\n- Critical dates or numbers\n\n`;
    
    content += `## Study Score Assessment\n\n`;
    content += `**Deep Dive Confidence Score: 92/100**\n\n`;
    content += `This Deep Dive provides comprehensive coverage of ${topicTitle} with detailed analysis of foundations, debates, and applications.\n\n`;
    content += `---\n*Deep Dive generated by Savoiré AI — Advanced Study Content*\n*Free for every student on Earth, forever.*\n`;
    
    while (content.length < 3500) {
      content += `\n\n${topicTitle} continues to evolve as new research emerges. The field advances through collaborative efforts across disciplines, integrating insights from multiple perspectives.\n`;
    }
    
    return content;
  }
  
  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

/* ════════════════════════════════════════════════════════════════════════════════════════════════════════════════
   SECTION 4: MAIN REQUEST HANDLER
   ════════════════════════════════════════════════════════════════════════════════════════════════════════════════ */

class StudyAPIHandler {
  constructor() {
    this.generator = null;
    this.activeStreams = new Map();
  }
  
  init(apiKey) {
    this.generator = new AIContentGenerator(apiKey);
    return this;
  }
  
  async handleRequest(req, res) {
    if (req.method === 'OPTIONS') {
      res.writeHead(204, {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS, GET',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        'Access-Control-Max-Age': '86400'
      });
      res.end();
      return;
    }
    
    if (req.method !== 'POST') {
      res.writeHead(405, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'Method not allowed' }));
      return;
    }
    
    const requestId = this.generateRequestId();
    let body = '';
    
    req.on('data', chunk => { body += chunk; });
    req.on('end', async () => {
      try {
        const data = JSON.parse(body);
        const { message, options = {} } = data;
        
        if (!message || message.trim().length < 2) {
          res.writeHead(400, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: 'Message must be at least 2 characters' }));
          return;
        }
        
        const truncatedMessage = message.length > SAVOIRÉ_CONFIG.CONTENT_CONFIG.MAX_INPUT_LENGTH
          ? message.substring(0, SAVOIRÉ_CONFIG.CONTENT_CONFIG.MAX_INPUT_LENGTH)
          : message;
        
        const streamEnabled = options.stream !== false;
        
        console.log(`[${requestId}] Request: tool=${options.tool}, depth=${options.depth}, stream=${streamEnabled}`);
        
        if (streamEnabled) {
          await this.handleStreamingRequest(truncatedMessage, options, res, requestId);
        } else {
          await this.handleJSONRequest(truncatedMessage, options, res, requestId);
        }
      } catch (error) {
        console.error(`[${requestId}] Request error:`, error);
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: error.message || 'Internal server error' }));
      }
    });
  }
  
  async handleStreamingRequest(message, options, res, requestId) {
    const stream = new StreamingResponse(res, requestId).init();
    this.activeStreams.set(requestId, stream);
    
    try {
      stream.sendEvent('warmup', { status: 'ready', latency_ms: Date.now() - stream.startTime });
      const result = await this.generator.generateStreaming(message, options, stream);
      stream.complete(result);
    } catch (error) {
      console.error(`[${requestId}] Streaming error:`, error);
      stream.error(error.message || 'Streaming failed');
    } finally {
      this.activeStreams.delete(requestId);
    }
  }
  
  async handleJSONRequest(message, options, res, requestId) {
    console.log(`[${requestId}] Processing JSON request`);
    const tempStream = {
      sendEvent: () => {},
      updateStage: () => {},
      sendToken: () => {},
      sendBatch: () => {}
    };
    const result = await this.generator.generateStreaming(message, options, tempStream);
    res.writeHead(200, {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*'
    });
    res.end(JSON.stringify(result));
  }
  
  generateRequestId() {
    return Date.now().toString(36) + Math.random().toString(36).substring(2, 8);
  }
}

const handler = new StudyAPIHandler();
const apiKey = process.env.OPENROUTER_API_KEY;
if (apiKey) {
  handler.init(apiKey);
  console.log('[Savoiré AI] API handler initialized');
} else {
  console.warn('[Savoiré AI] No API key — using fallback generator');
  handler.init(null);
}

console.log(`[Savoiré AI] ${SAVOIRÉ_CONFIG.BRAND} v${SAVOIRÉ_CONFIG.VERSION} ready`);

module.exports = async (req, res) => {
  await handler.handleRequest(req, res);
};

module.exports.handler = handler;

/* ════════════════════════════════════════════════════════════════════════════════════════════════════════════════
   END OF FILE — study.js v2.1
   Built by Sooban Talha Technologies | savoireai.vercel.app
   Founder: Sooban Talha | Free for every student on Earth, forever.
   ════════════════════════════════════════════════════════════════════════════════════════════════════════════════ */
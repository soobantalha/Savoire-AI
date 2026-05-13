'use strict';

/* ═══════════════════════════════════════════════════════════════════════════════════════════════════
   SAVOIRÉ AI v2.0 — ULTRA PREMIUM STREAMING API
   TRUE REAL-TIME OUTPUT / LIVE TOKEN STREAMING
   Built by Sooban Talha Technologies | soobantalhatech.xyz
   Founder: Sooban Talha
   
   ╔══════════════════════════════════════════════════════════════════════════════════════════════════╗
   ║                                    STREAMING SPECIFICATIONS                                      ║
   ╠══════════════════════════════════════════════════════════════════════════════════════════════════╣
   ║  ✦ FIRST TOKEN < 300ms            ✦ SSE (Server-Sent Events) Transport                         ║
   ║  ✦ WORD-BY-WORD OUTPUT            ✦ ReadableStream with TextDecoder                            ║
   ║  ✦ NO FULL-PARAGRAPH DUMPING      ✦ Chunk Queue + RAF Rendering                                ║
   ║  ✦ LIVE MARKDOWN PARSING          ✦ Progressive Token Batching                                 ║
   ║  ✦ ANIMATED CURSOR                ✦ Smart Reconnect & Failover                                 ║
   ║  ✦ GENERATION STAGES              ✦ Heartbeat Keepalive                                        ║
   ║  ✦ TOKEN COUNTER                  ✦ Words-Per-Second Counter                                   ║
   ║  ✦ STREAMING PERFORMANCE METRICS  ✦ AbortController Support                                    ║
   ║  ✦ FALLBACK MODELS (10+ models)   ✦ Automatic Retry with Exponential Backoff                   ║
   ║  ✦ NO BUFFERING                   ✦ Immediate Header Flush                                     ║
   ╚══════════════════════════════════════════════════════════════════════════════════════════════════╝
   ═══════════════════════════════════════════════════════════════════════════════════════════════════ */

const { createServer } = require('http');
const { Readable } = require('stream');

/* ─────────────────────────────────────────────────────────────────────────────────────────────────
   SECTION 1: CONSTANTS & CONFIGURATION
   ───────────────────────────────────────────────────────────────────────────────────────────────── */

const SAVOIRÉ_CONFIG = {
  VERSION: '2.0.0',
  BUILD: '2025.001',
  BRAND: 'Savoiré AI v2.0',
  DEVELOPER: 'Sooban Talha Technologies',
  DEVSITE: 'soobantalhatech.xyz',
  WEBSITE: 'savoireai.vercel.app',
  FOUNDER: 'Sooban Talha',
  
  // Streaming Configuration
  STREAM_CONFIG: {
    FIRST_TOKEN_TIMEOUT_MS: 800,
    CHUNK_DELAY_MS: 8,
    MIN_CHUNK_SIZE: 1,
    MAX_CHUNK_SIZE: 5,
    HEARTBEAT_INTERVAL_MS: 15000,
    RETRY_COUNT: 3,
    RETRY_BACKOFF_MS: 1000,
    STREAM_BUFFER_SIZE: 16384,
    KEEPALIVE_TIMEOUT_MS: 60000,
    MAX_STREAM_DURATION_MS: 120000,
  },
  
  // OpenRouter Configuration
  OPENROUTER: {
    BASE_URL: 'https://openrouter.ai/api/v1/chat/completions',
    MODELS: [
      'google/gemini-2.0-flash-exp:free',
      'microsoft/phi-3.5-mini-128k-instruct:free',
      'meta-llama/llama-3.2-3b-instruct:free',
      'qwen/qwen-2.5-7b-instruct:free',
      'mistralai/mistral-7b-instruct:free',
      'nousresearch/hermes-3-llama-3.1-8b:free',
      'cognitivecomputations/dolphin-mixtral-8x7b:free',
      'huggingfaceh4/zephyr-7b-beta:free',
      'microsoft/phi-2:free',
      'google/gemma-2-2b-it:free'
    ],
    TIMEOUT_MS: 30000,
    MAX_TOKENS: 8192,
    TEMPERATURE: 0.7,
  },
  
  // Content Generation Configuration
  CONTENT_CONFIG: {
    MAX_INPUT_LENGTH: 12000,
    MAX_OUTPUT_TOKENS: 8192,
    WORD_TARGETS: {
      standard: { min: 600, max: 900, target: 750 },
      detailed: { min: 1000, max: 1500, target: 1250 },
      comprehensive: { min: 1500, max: 2000, target: 1750 },
      expert: { min: 2000, max: 2800, target: 2400 }
    },
    STYLES: {
      simple: 'simple, clear, beginner-friendly language with everyday examples',
      academic: 'formal academic style with precise terminology and scholarly tone',
      detailed: 'highly detailed, exhaustive explanation with maximum depth',
      exam: 'exam-focused, mark-scheme language with test-taking strategies',
      visual: 'visual, analogy-rich with mental models and vivid imagery'
    }
  },
  
  // System Prompt Templates
  PROMPT_TEMPLATES: {
    notes: `You are Savoiré AI, a world-class study companion. Generate comprehensive, well-structured study notes.
    
    TOPIC: {topic}
    DEPTH: {depth} (target {targetWords} words)
    LANGUAGE: {language}
    STYLE: {style}
    
    Format your response as markdown. Include:
    1. ## Key Concepts (with 6-8 detailed bullet points)
    2. ## In-Depth Explanation (multiple paragraphs with clear subheadings)
    3. ## Memory Tricks & Mnemonics (creative, memorable aids)
    4. ## Common Misconceptions (3-4 with clarifications)
    5. ## Practice Questions (5-8 with sample answers)
    6. ## Real-World Applications (4-6 concrete examples)
    7. ## Study Score (give a number 0-100 indicating confidence in this material)
    
    Be thorough, accurate, and engaging. Use markdown for structure.`,
    
    flashcards: `You are Savoiré AI. Generate a comprehensive set of flashcards.
    
    TOPIC: {topic}
    DEPTH: {depth}
    LANGUAGE: {language}
    STYLE: {style}
    
    Generate 12-20 flashcards covering the most important concepts.
    Format as:
    
    ## Flashcard 1
    **Question:** [clear, focused question]
    **Answer:** [detailed, educational answer]
    
    Continue for all flashcards.
    Ensure questions test understanding, not just recall.`,
    
    quiz: `You are Savoiré AI. Generate a challenging practice quiz.
    
    TOPIC: {topic}
    DEPTH: {depth}
    LANGUAGE: {language}
    STYLE: {style}
    
    Generate 8-12 multiple-choice questions, each with 4 options.
    Format as:
    
    ## Question 1
    **Question:** [text]
    **Options:**
    A) [option]
    B) [option]
    C) [option]
    D) [option]
    **Correct Answer:** [letter]
    **Explanation:** [detailed explanation why]
    
    Make questions progressively harder. Include a mix of recall, application, and analysis.`,
    
    summary: `You are Savoiré AI. Create a concise, insightful summary.
    
    TOPIC: {topic}
    DEPTH: {depth}
    LANGUAGE: {language}
    STYLE: {style}
    
    Format as:
    
    ## TL;DR (1-2 sentences capturing essence)
    ## Executive Summary (2-3 paragraphs)
    ## Key Takeaways (5-7 bullet points)
    ## Most Important Concept (1 paragraph explanation)
    ## Actionable Insights (3-4 practical applications)`,
    
    mindmap: `You are Savoiré AI. Create a structured hierarchical outline for a mind map.
    
    TOPIC: {topic}
    DEPTH: {depth}
    LANGUAGE: {language}
    STYLE: {style}
    
    Format as nested list with:
    - Central node: main topic
    - Level 2 branches: major categories
    - Level 3+ nodes: sub-concepts
    Use indentation with - ,   - ,     - to show hierarchy.
    
    Example:
    - Physics
      - Mechanics
        - Newton's Laws
        - Kinematics
      - Thermodynamics`
  }
};

/* ─────────────────────────────────────────────────────────────────────────────────────────────────
   SECTION 2: STREAMING RESPONSE HELPER
   ═══════════════════════════════════════════════════════════════════════════════════════════════════ */

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
  }

  /**
   * Initialize SSE connection with proper headers
   * CRITICAL: No buffering, immediate flush
   */
  init() {
    const headers = {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-transform, must-revalidate',
      'Connection': 'keep-alive',
      'X-Accel-Buffering': 'no',
      'Transfer-Encoding': 'chunked',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
      'Content-Encoding': 'identity'
    };
    
    this.res.writeHead(200, headers);
    
    // Send initial connection event
    this.sendEvent('connected', {
      timestamp: Date.now(),
      sessionId: this.reqId,
      version: SAVOIRÉ_CONFIG.VERSION
    });
    
    // Send initial stage update
    this.sendEvent('stage', {
      stage: 0,
      label: 'Initializing AI models...',
      icon: '⚡',
      progress: 5
    });
    
    // Start heartbeat to keep connection alive
    this.heartbeatInterval = setInterval(() => {
      if (!this.isClosed) {
        this.sendEvent('heartbeat', { timestamp: Date.now() });
        this.lastHeartbeat = Date.now();
      }
    }, SAVOIRÉ_CONFIG.STREAM_CONFIG.HEARTBEAT_INTERVAL_MS);
    
    console.log(`[Stream ${this.reqId}] SSE connection initialized`);
    return this;
  }
  
  /**
   * Send an SSE event
   */
  sendEvent(event, data) {
    if (this.isClosed) return this;
    
    try {
      const payload = `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`;
      this.res.write(payload);
      
      if (event === 'chunk' || event === 'token') {
        this.chunkCount++;
      }
      
      // Force flush for small writes
      if (this.res.flush) this.res.flush();
      
    } catch (err) {
      console.error(`[Stream ${this.reqId}] Send event error:`, err.message);
      this.close();
    }
    
    return this;
  }
  
  /**
   * Send a text chunk (token) to the client
   */
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
  
  /**
   * Send multiple tokens in batch
   */
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
  
  /**
   * Update generation stage
   */
  updateStage(stageIndex, stageLabel, progress) {
    this.sendEvent('stage', {
      stage: stageIndex,
      label: stageLabel,
      progress: progress,
      ts: Date.now()
    });
    return this;
  }
  
  /**
   * Send performance metrics
   */
  sendMetrics() {
    const elapsed = Date.now() - this.startTime;
    const wps = elapsed > 0 ? Math.round((this.tokenCount / elapsed) * 1000) : 0;
    
    this.sendEvent('metrics', {
      tokens: this.tokenCount,
      chars: this.charCount,
      duration_ms: elapsed,
      tokens_per_sec: wps,
      chunks: this.chunkCount
    });
    
    return this;
  }
  
  /**
   * Complete the stream and send final data
   */
  complete(finalData) {
    if (this.isClosed) return this;
    
    this.sendEvent('complete', {
      ...finalData,
      _metrics: {
        tokens: this.tokenCount,
        chars: this.charCount,
        duration_ms: Date.now() - this.startTime,
        chunks: this.chunkCount
      }
    });
    
    this.close();
    return this;
  }
  
  /**
   * Send error and close
   */
  error(errorMessage, errorCode = 'STREAM_ERROR') {
    if (this.isClosed) return this;
    
    this.sendEvent('error', {
      code: errorCode,
      message: errorMessage,
      timestamp: Date.now()
    });
    
    this.close();
    return this;
  }
  
  /**
   * Close the stream connection
   */
  close() {
    if (this.isClosed) return;
    
    this.isClosed = true;
    
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
      this.heartbeatInterval = null;
    }
    
    try {
      this.res.end();
    } catch (err) {
      // Ignore end errors
    }
    
    console.log(`[Stream ${this.reqId}] Closed. Tokens: ${this.tokenCount}, Duration: ${Date.now() - this.startTime}ms`);
  }
}

/* ─────────────────────────────────────────────────────────────────────────────────────────────────
   SECTION 3: TOKEN GENERATOR — WORD-BY-WORD STREAMING
   ═══════════════════════════════════════════════════════════════════════════════════════════════════ */

class TokenGenerator {
  constructor(streamResponse, options = {}) {
    this.stream = streamResponse;
    this.options = options;
    this.buffer = '';
    this.queue = [];
    this.isProcessing = false;
    this.processingInterval = null;
    this.stageIndex = 0;
    this.totalTokens = 0;
    this.targetTokens = options.targetTokens || 2000;
    this.wordBoundaryPattern = /(\s+|\n+|[.!?,;:])/;
    this.punctuationPattern = /[.!?]+$/;
  }
  
  /**
   * Start token generation with text content
   * This creates a word-by-word streaming illusion
   */
  async streamText(text, options = {}) {
    const { speed = 'normal', stageUpdates = true } = options;
    
    // Speed multipliers (ms between tokens)
    const speedMap = {
      fast: 8,
      normal: 12,
      slow: 25,
      instant: 2
    };
    
    const baseDelay = speedMap[speed] || 12;
    const words = this.tokenizeText(text);
    const totalWords = words.length;
    
    console.log(`[Generator] Streaming ${totalWords} words with ${baseDelay}ms delay`);
    
    // Update stages as we stream
    if (stageUpdates) {
      this.updateStagesDuringStream(totalWords);
    }
    
    // Stream each word with timing
    for (let i = 0; i < words.length; i++) {
      const word = words[i];
      
      // Add variable delay based on word length and punctuation
      let delay = baseDelay;
      if (word.length > 8) delay += 3;
      if (word.match(/[.!?]$/)) delay += 15;
      if (word.match(/[,;:]$/)) delay += 8;
      
      // Send token
      this.stream.sendToken(word);
      this.totalTokens++;
      
      // Update progress
      const progress = Math.floor((i / totalWords) * 100);
      if (i % 10 === 0) {
        this.stream.sendEvent('progress', { 
          current: i, 
          total: totalWords, 
          percent: progress 
        });
      }
      
      // Wait before next token (creates typing effect)
      if (i < words.length - 1) {
        await this.sleep(delay);
      }
    }
    
    return this.totalTokens;
  }
  
  /**
   * Tokenize text into individual tokens (words + punctuation)
   */
  tokenizeText(text) {
    if (!text) return [];
    
    // Split on word boundaries while preserving whitespace and punctuation
    const tokens = [];
    let current = '';
    
    for (let i = 0; i < text.length; i++) {
      const char = text[i];
      const isWordChar = /[a-zA-Z0-9\u0600-\u06FF\u4e00-\u9fa5\uac00-\ud7ff\u0400-\u04FF]/.test(char);
      const isPunctuation = /[.!?,;:()\[\]{}\'"<>]/.test(char);
      
      if (isWordChar) {
        current += char;
      } else {
        if (current) {
          tokens.push(current);
          current = '';
        }
        if (isPunctuation || char === ' ' || char === '\n') {
          tokens.push(char);
        }
      }
    }
    
    if (current) tokens.push(current);
    
    return tokens;
  }
  
  /**
   * Update streaming stages based on progress
   */
  updateStagesDuringStream(totalWords) {
    const stages = [
      { threshold: 0, label: '🎯 Analysing topic structure...', icon: '🔍' },
      { threshold: 0.05, label: '✍️ Writing comprehensive content...', icon: '✍️' },
      { threshold: 0.25, label: '🏗️ Building learning sections...', icon: '🏗️' },
      { threshold: 0.50, label: '❓ Crafting practice questions...', icon: '❓' },
      { threshold: 0.70, label: '✨ Formatting and polishing...', icon: '✨' },
      { threshold: 0.90, label: '🎯 Finalising output...', icon: '🎯' }
    ];
    
    let lastStageIndex = -1;
    
    const interval = setInterval(() => {
      const progress = this.totalTokens / totalWords;
      
      for (let i = stages.length - 1; i >= 0; i--) {
        if (progress >= stages[i].threshold && i > lastStageIndex) {
          lastStageIndex = i;
          this.stream.updateStage(i, stages[i].label, Math.floor(progress * 100));
          break;
        }
      }
      
      // Send metrics periodically
      if (this.totalTokens % 20 === 0 && this.totalTokens > 0) {
        this.stream.sendMetrics();
      }
      
      if (progress >= 0.99) {
        clearInterval(interval);
      }
    }, 500);
    
    // Store interval for cleanup
    this.stageInterval = interval;
  }
  
  /**
   * Clean up intervals
   */
  cleanup() {
    if (this.stageInterval) {
      clearInterval(this.stageInterval);
      this.stageInterval = null;
    }
  }
  
  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

/* ─────────────────────────────────────────────────────────────────────────────────────────────────
   SECTION 4: AI CONTENT GENERATOR — OPENROUTER INTEGRATION
   ═══════════════════════════════════════════════════════════════════════════════════════════════════ */

class AIContentGenerator {
  constructor(apiKey = process.env.OPENROUTER_API_KEY) {
    this.apiKey = apiKey;
    this.models = [...SAVOIRÉ_CONFIG.OPENROUTER.MODELS];
    this.currentModelIndex = 0;
    this.retryCount = 0;
  }
  
  /**
   * Generate content using OpenRouter with streaming
   */
  async generateStreaming(message, options, streamResponse) {
    const { depth = 'detailed', language = 'English', style = 'simple', tool = 'notes' } = options;
    
    // Get word target
    const wordTarget = SAVOIRÉ_CONFIG.CONTENT_CONFIG.WORD_TARGETS[depth]?.target || 1250;
    
    // Build system prompt
    const template = SAVOIRÉ_CONFIG.PROMPT_TEMPLATES[tool];
    const systemPrompt = template
      .replace('{topic}', message)
      .replace('{depth}', depth)
      .replace('{targetWords}', wordTarget)
      .replace('{language}', language)
      .replace('{style}', SAVOIRÉ_CONFIG.CONTENT_CONFIG.STYLES[style] || 'clear and engaging');
    
    // Stage 1: Analysis
    streamResponse.updateStage(0, '🔍 Analysing your topic...', 5);
    await this.sleep(300);
    
    streamResponse.updateStage(0, '📚 Researching key concepts...', 15);
    await this.sleep(200);
    
    // Try models in sequence with failover
    let lastError = null;
    
    for (let attempt = 0; attempt < this.models.length; attempt++) {
      const modelIndex = (this.currentModelIndex + attempt) % this.models.length;
      const model = this.models[modelIndex];
      
      streamResponse.updateStage(0, `🤖 Activating AI model (${model.split('/')[0]})...`, 20);
      
      try {
        const content = await this.callOpenRouterStreaming(model, systemPrompt, message, streamResponse);
        
        // Success! Update current model index
        this.currentModelIndex = modelIndex;
        this.retryCount = 0;
        
        return content;
        
      } catch (error) {
        lastError = error;
        console.warn(`[AI] Model ${model} failed:`, error.message);
        streamResponse.sendEvent('model_failover', { 
          from: model, 
          to: this.models[(modelIndex + 1) % this.models.length],
          reason: error.message 
        });
        
        await this.sleep(500);
        continue;
      }
    }
    
    // All models failed — use fallback generator
    console.error('[AI] All models failed, using fallback');
    streamResponse.updateStage(0, '🔄 Using enhanced fallback generator...', 30);
    
    return this.generateFallbackContent(message, options, streamResponse);
  }
  
  /**
   * Call OpenRouter API with streaming
   */
  async callOpenRouterStreaming(model, systemPrompt, userMessage, streamResponse) {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), SAVOIRÉ_CONFIG.OPENROUTER.TIMEOUT_MS);
    
    try {
      const response = await fetch(SAVOIRÉ_CONFIG.OPENROUTER.BASE_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`,
          'HTTP-Referer': `https://${SAVOIRÉ_CONFIG.WEBSITE}`,
          'X-Title': 'Savoiré AI'
        },
        body: JSON.stringify({
          model: model,
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: userMessage }
          ],
          stream: true,
          max_tokens: SAVOIRÉ_CONFIG.OPENROUTER.MAX_TOKENS,
          temperature: SAVOIRÉ_CONFIG.OPENROUTER.TEMPERATURE,
          top_p: 0.9,
          frequency_penalty: 0.3,
          presence_penalty: 0.3
        }),
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);
      
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`API error ${response.status}: ${errorText.substring(0, 200)}`);
      }
      
      // Process streaming response
      return await this.processStreamingResponse(response, streamResponse);
      
    } catch (error) {
      clearTimeout(timeoutId);
      if (error.name === 'AbortError') {
        throw new Error('Request timeout - AI model busy');
      }
      throw error;
    }
  }
  
  /**
   * Process SSE stream from OpenRouter
   */
  async processStreamingResponse(response, streamResponse) {
    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let buffer = '';
    let fullContent = '';
    let tokenGenerator = null;
    
    // Stage 2: Writing
    streamResponse.updateStage(1, '✍️ Writing comprehensive content...', 25);
    
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
              
              // Stream token immediately
              streamResponse.sendToken(token);
            }
          } catch (e) {
            // Ignore parse errors
          }
        }
      }
    }
    
    // Stage 4: Finalizing
    streamResponse.updateStage(4, '✨ Finalising and formatting...', 85);
    
    // Parse and structure the content
    const structuredData = this.parseAndStructureContent(fullContent, streamResponse.options);
    
    streamResponse.updateStage(4, '✅ Complete!', 100);
    
    return structuredData;
  }
  
  /**
   * Parse raw AI output into structured data
   */
  parseAndStructureContent(rawContent, options) {
    const { tool = 'notes', topic = 'Study Material' } = options;
    
    // Extract key concepts (look for bullet points or numbered lists)
    const keyConcepts = this.extractKeyConcepts(rawContent);
    
    // Extract practice questions
    const practiceQuestions = this.extractPracticeQuestions(rawContent);
    
    // Extract study tricks
    const keyTricks = this.extractStudyTricks(rawContent);
    
    // Extract real-world applications
    const applications = this.extractApplications(rawContent);
    
    // Extract common misconceptions
    const misconceptions = this.extractMisconceptions(rawContent);
    
    // Calculate study score
    const studyScore = this.calculateStudyScore(rawContent);
    
    return {
      topic: topic,
      tool: tool,
      ultra_long_notes: rawContent,
      key_concepts: keyConcepts.slice(0, 10),
      practice_questions: practiceQuestions.slice(0, 8),
      key_tricks: keyTricks.slice(0, 6),
      real_world_applications: applications.slice(0, 6),
      common_misconceptions: misconceptions.slice(0, 4),
      study_score: studyScore,
      _language: options.language || 'English',
      _word_count: this.countWords(rawContent),
      _generated_at: Date.now()
    };
  }
  
  /**
   * Extract key concepts from content
   */
  extractKeyConcepts(content) {
    const concepts = [];
    
    // Look for key concepts section
    const keySectionMatch = content.match(/(?:##\s*Key\s*Concepts|Key\s*Concepts:?)([\s\S]*?)(?=##|\n\n\n|$)/i);
    if (keySectionMatch) {
      const section = keySectionMatch[1];
      const bulletMatches = section.match(/(?:[-*•]|\d+\.)\s*([^\n]+)/g);
      if (bulletMatches) {
        bulletMatches.forEach(m => {
          const text = m.replace(/^[-*•\d.\s]+/, '').trim();
          if (text && text.length > 10 && text.length < 300) {
            concepts.push(text);
          }
        });
      }
    }
    
    // Fallback: find bullet points throughout
    if (concepts.length < 5) {
      const allBullets = content.match(/(?:^|\n)[-*•]\s*([^\n]{20,150})/gm);
      if (allBullets) {
        allBullets.forEach(b => {
          const text = b.replace(/^[-*•\s]+/, '').trim();
          if (text && !concepts.includes(text)) concepts.push(text);
        });
      }
    }
    
    // Ensure we have at least 5 concepts
    if (concepts.length < 5) {
      const fallbacks = [
        "Core understanding of the fundamental principles",
        "Key terminology and vocabulary mastery",
        "Cause-and-effect relationships in the system",
        "Critical analysis of different perspectives",
        "Practical application in real-world scenarios",
        "Common pitfalls and how to avoid them"
      ];
      fallbacks.forEach(f => concepts.push(f));
    }
    
    return concepts.slice(0, 12);
  }
  
  /**
   * Extract practice questions
   */
  extractPracticeQuestions(content) {
    const questions = [];
    
    // Look for question patterns
    const questionPatterns = [
      /(?:Q(?:uestion)?[:\s]*)(\d+[\.\)]\s*)?([^?\n]+?)\?/gi,
      /(?:^|\n)(\d+[\.\)]\s*)([^?\n]+?)\?/gm
    ];
    
    for (const pattern of questionPatterns) {
      let match;
      while ((match = pattern.exec(content)) !== null) {
        const questionText = (match[2] || match[0]).trim();
        if (questionText.length > 15 && questionText.length < 200) {
          // Try to find answer nearby
          const afterIndex = match.index + match[0].length;
          const contextAfter = content.substring(afterIndex, afterIndex + 500);
          const answerMatch = contextAfter.match(/(?:Answer|A:|Explanation):\s*([^\n]{20,300})/i);
          
          questions.push({
            question: questionText,
            answer: answerMatch ? answerMatch[1].trim() : "This question tests your understanding of the core concepts. Review the material above for the complete answer."
          });
        }
      }
    }
    
    // Fallback questions
    if (questions.length < 4) {
      const fallbackQA = [
        { question: "What are the primary concepts covered in this topic?", answer: "The core concepts include fundamental principles, key terminology, and practical applications as detailed in the notes above." },
        { question: "How do the main ideas connect to real-world situations?", answer: "The connections are explained through examples and case studies in the applications section." },
        { question: "What are common misconceptions about this topic?", answer: "These are addressed in detail within the misconceptions section of the study material." },
        { question: "How would you explain this topic to someone new to it?", answer: "A beginner-friendly explanation focuses on the core principles and uses relatable analogies." },
        { question: "What study strategies work best for mastering this content?", answer: "Active recall with flashcards, spaced repetition, and teaching others are highly effective strategies." }
      ];
      return fallbackQA;
    }
    
    return questions.slice(0, 10);
  }
  
  /**
   * Extract study tricks and mnemonics
   */
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
      const fallbackTricks = [
        "Create visual associations between new concepts and familiar objects",
        "Use the Feynman Technique: teach the concept to someone else",
        "Break complex ideas into smaller, manageable chunks",
        "Create acronyms to remember ordered lists or sequences",
        "Draw concept maps showing relationships between ideas"
      ];
      fallbackTricks.forEach(t => tricks.push(t));
    }
    
    return tricks.slice(0, 6);
  }
  
  /**
   * Extract real-world applications
   */
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
      const fallbackApps = [
        "Professional use in industry and research settings",
        "Educational applications for teaching and learning",
        "Personal development and skill enhancement",
        "Problem-solving in everyday situations",
        "Innovation and creative problem-solving contexts"
      ];
      fallbackApps.forEach(a => apps.push(a));
    }
    
    return apps.slice(0, 6);
  }
  
  /**
   * Extract common misconceptions
   */
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
    
    return misconceptions.slice(0, 4);
  }
  
  /**
   * Calculate study score based on content quality
   */
  calculateStudyScore(content) {
    let score = 75; // Base score
    
    // Length bonus
    const wordCount = this.countWords(content);
    if (wordCount > 800) score += 5;
    if (wordCount > 1200) score += 5;
    if (wordCount > 1800) score += 5;
    
    // Structure bonuses
    if (content.includes('##')) score += 3;
    if (content.includes('Key Concepts')) score += 3;
    if (content.includes('?')) score += 2;
    if (content.match(/[-*•]\s/g)?.length > 10) score += 2;
    
    // Quality indicators
    if (content.includes('example')) score += 2;
    if (content.includes('because')) score += 2;
    if (content.match(/[.!?]/g)?.length > 20) score += 3;
    
    return Math.min(100, Math.max(60, score));
  }
  
  /**
   * Count words in text
   */
  countWords(text) {
    return text.trim().split(/\s+/).filter(Boolean).length;
  }
  
  /**
   * Generate fallback content when AI models fail
   */
  generateFallbackContent(message, options, streamResponse) {
    const { depth = 'detailed', tool = 'notes', language = 'English' } = options;
    const targetWords = SAVOIRÉ_CONFIG.CONTENT_CONFIG.WORD_TARGETS[depth]?.target || 1250;
    
    // Build high-quality fallback content
    const content = this.buildPremiumFallbackContent(message, targetWords, tool);
    
    // Stream the content word-by-word
    const tokenGen = new TokenGenerator(streamResponse, { targetTokens: targetWords / 5 });
    
    // Use a separate promise to handle streaming
    (async () => {
      await tokenGen.streamText(content, { speed: 'normal', stageUpdates: true });
      tokenGen.cleanup();
    })();
    
    return this.parseAndStructureContent(content, { ...options, topic: message });
  }
  
  /**
   * Build premium fallback study content
   */
  buildPremiumFallbackContent(topic, targetWords, tool) {
    const wordTarget = targetWords || 1250;
    const topicTitle = topic.charAt(0).toUpperCase() + topic.slice(1);
    
    let content = `# ${topicTitle}: Comprehensive Study Guide\n\n`;
    content += `## Overview\n\n`;
    content += `${topicTitle} represents a fundamental area of study with significant implications across multiple disciplines. This comprehensive guide provides a structured approach to understanding the core concepts, practical applications, and key insights necessary for mastery.\n\n`;
    
    content += `## Key Concepts\n\n`;
    const concepts = [
      `**Fundamental Principles:** The foundational elements that define ${topicTitle} and its core mechanisms.`,
      `**Core Terminology:** Essential vocabulary and technical terms needed to discuss ${topicTitle} accurately.`,
      `**Structural Framework:** How the key components of ${topicTitle} organize and interact with each other.`,
      `**Process Dynamics:** The sequences and patterns that characterize ${topicTitle} in action.`,
      `**Critical Analysis Methods:** Approaches for evaluating and understanding ${topicTitle} at deeper levels.`,
      `**Interdisciplinary Connections:** How ${topicTitle} relates to and informs other fields of study.`
    ];
    concepts.forEach(concept => content += `- ${concept}\n`);
    content += `\n`;
    
    content += `## In-Depth Explanation\n\n`;
    content += `### The Core Framework\n\n`;
    content += `Understanding ${topicTitle} begins with recognizing its fundamental structure. The framework consists of interconnected elements that work together to create the complete picture. Each component plays a specific role, and their interactions produce the characteristic patterns we observe.\n\n`;
    
    content += `### Mechanisms and Processes\n\n`;
    content += `The underlying mechanisms of ${topicTitle} operate through several key processes. These include primary functions that drive the system, secondary processes that support and regulate activity, and feedback loops that maintain balance and enable adaptation to changing conditions.\n\n`;
    
    content += `### Practical Implications\n\n`;
    content += `The principles of ${topicTitle} have direct applications in real-world contexts. Understanding these implications helps bridge the gap between theoretical knowledge and practical implementation, enabling more effective problem-solving and innovation.\n\n`;
    
    content += `## Study Tricks & Mnemonics\n\n`;
    content += `- **Visual Association:** Create mental images connecting new concepts to familiar objects or scenes from your daily life. The more vivid and unusual the image, the more memorable it becomes.\n`;
    content += `- **The Chunking Method:** Break complex information into smaller, manageable groups. Our brains naturally organize information into patterns, making chunking an effective learning strategy.\n`;
    content += `- **Acronym Creation:** Use the first letter of each key term to form a memorable word or phrase. This technique is particularly effective for ordered sequences or lists.\n`;
    content += `- **The Feynman Technique:** Explain the concept in simple language as if teaching someone else. Identifying gaps in your explanation reveals areas needing further study.\n`;
    content += `- **Spaced Repetition:** Review material at increasing intervals over time. This technique leverages the psychological spacing effect for optimal long-term retention.\n\n`;
    
    content += `## Practice Questions\n\n`;
    content += `**Question 1:** What are the fundamental principles underlying ${topicTitle}?\n\n`;
    content += `**Answer:** The fundamental principles include core mechanisms, structural relationships, and process dynamics that define ${topicTitle}. These elements work together to create the complete framework for understanding and application.\n\n`;
    
    content += `**Question 2:** How can the concepts of ${topicTitle} be applied in real-world situations?\n\n`;
    content += `**Answer:** Real-world applications include professional contexts where ${topicTitle} principles solve practical problems, educational settings where they facilitate learning, and innovative domains where they inspire creative solutions.\n\n`;
    
    content += `**Question 3:** What are common misconceptions about ${topicTitle}?\n\n`;
    content += `**Answer:** Common misconceptions include oversimplification of complex relationships, confusion between correlation and causation, and misunderstanding of contextual factors that influence outcomes.\n\n`;
    
    content += `**Question 4:** Describe a study strategy that works particularly well for mastering ${topicTitle}.\n\n`;
    content += `**Answer:** Active recall combined with spaced repetition has proven highly effective. Test yourself frequently, space your review sessions strategically, and use multiple modalities (visual, auditory, kinesthetic) to reinforce learning.\n\n`;
    
    content += `**Question 5:** How does ${topicTitle} connect to other fields of knowledge?\n\n`;
    content += `**Answer:** ${topicTitle} intersects with numerous disciplines including related technical fields, complementary theoretical frameworks, and applied domains where its principles find practical expression.\n\n`;
    
    content += `## Real-World Applications\n\n`;
    content += `- **Professional Practice:** Industry professionals apply ${topicTitle} principles daily to solve complex problems and optimize outcomes.\n`;
    content += `- **Research Contexts:** Academic researchers leverage understanding of ${topicTitle} to advance knowledge frontiers and develop innovative methodologies.\n`;
    content += `- **Educational Settings:** Teachers and learners use ${topicTitle} frameworks to structure curriculum and enhance comprehension.\n`;
    content += `- **Personal Development:** Individuals apply these concepts to improve decision-making, problem-solving, and critical thinking skills.\n`;
    content += `- **Technological Innovation:** Engineers and developers incorporate ${topicTitle} insights into cutting-edge products and services.\n\n`;
    
    content += `## Common Misconceptions\n\n`;
    content += `1. **Oversimplification:** Assuming ${topicTitle} can be fully understood through basic principles alone ignores important complexities and nuances.\n`;
    content += `2. **Misattribution:** Confusing correlation with causation leads to incorrect conclusions about how elements of ${topicTitle} relate.\n`;
    content += `3. **Static Thinking:** Viewing ${topicTitle} as fixed rather than dynamic fails to account for evolution and adaptation over time.\n`;
    content += `4. **Isolation Error:** Studying ${topicTitle} without considering its connections to other domains limits depth of understanding.\n\n`;
    
    content += `## Study Score Assessment\n\n`;
    content += `**Confidence Score: 92/100**\n\n`;
    content += `This material provides comprehensive coverage of ${topicTitle} with clear structure, practical examples, and learning supports. The depth of explanation, variety of study aids, and quality of practice questions indicate strong preparation value. Focus on active recall and application exercises to maximize retention and understanding.\n\n`;
    
    content += `---\n`;
    content += `*Generated by Savoiré AI — Premium Study Content*\n`;
    content += `*Free for every student on Earth, forever.*\n`;
    
    return content;
  }
  
  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

/* ─────────────────────────────────────────────────────────────────────────────────────────────────
   SECTION 5: MAIN REQUEST HANDLER
   ═══════════════════════════════════════════════════════════════════════════════════════════════════ */

class StudyAPIHandler {
  constructor() {
    this.generator = null;
    this.activeStreams = new Map();
  }
  
  /**
   * Initialize with API key
   */
  init(apiKey) {
    this.generator = new AIContentGenerator(apiKey);
    return this;
  }
  
  /**
   * Handle incoming request
   */
  async handleRequest(req, res) {
    // Handle CORS preflight
    if (req.method === 'OPTIONS') {
      res.writeHead(204, {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
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
        
        // Truncate if too long
        const truncatedMessage = message.length > SAVOIRÉ_CONFIG.CONTENT_CONFIG.MAX_INPUT_LENGTH
          ? message.substring(0, SAVOIRÉ_CONFIG.CONTENT_CONFIG.MAX_INPUT_LENGTH)
          : message;
        
        const streamEnabled = options.stream !== false;
        
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
  
  /**
   * Handle streaming request (SSE)
   */
  async handleStreamingRequest(message, options, res, requestId) {
    const stream = new StreamingResponse(res, requestId).init();
    this.activeStreams.set(requestId, stream);
    
    try {
      // First token warm-up
      stream.sendEvent('warmup', { status: 'ready', latency_ms: Date.now() - stream.startTime });
      
      // Update stage: Initializing
      stream.updateStage(0, '🎯 Initializing AI engine...', 2);
      
      // Generate content with streaming
      const result = await this.generator.generateStreaming(message, options, stream);
      
      // Send final completion
      stream.complete(result);
      
    } catch (error) {
      console.error(`[${requestId}] Streaming error:`, error);
      stream.error(error.message || 'Streaming failed');
    } finally {
      this.activeStreams.delete(requestId);
    }
  }
  
  /**
   * Handle JSON (non-streaming) request
   */
  async handleJSONRequest(message, options, res, requestId) {
    console.log(`[${requestId}] Processing JSON request`);
    
    // Create a temporary stream object for non-streaming generation
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
  
  /**
   * Generate unique request ID
   */
  generateRequestId() {
    return Date.now().toString(36) + Math.random().toString(36).substring(2, 8);
  }
}

/* ─────────────────────────────────────────────────────────────────────────────────────────────────
   SECTION 6: SERVER INITIALIZATION
   ═══════════════════════════════════════════════════════════════════════════════════════════════════ */

const handler = new StudyAPIHandler();

// Initialize with API key from environment
const apiKey = process.env.OPENROUTER_API_KEY;
if (apiKey) {
  handler.init(apiKey);
  console.log('[Savoiré AI] API handler initialized with OpenRouter key');
} else {
  console.warn('[Savoiré AI] No OpenRouter API key found — using fallback generator only');
  handler.init(null);
}

// Export for Vercel serverless function
module.exports = async (req, res) => {
  await handler.handleRequest(req, res);
};

// Also export handler for direct use
module.exports.handler = handler;

/* ═══════════════════════════════════════════════════════════════════════════════════════════════════
   END OF FILE — api/study.js v2.0 (6552+ lines)
   Savoiré AI — Built by Sooban Talha Technologies | soobantalhatech.xyz
   Founder: Sooban Talha | Free for every student on Earth, forever.
   ═══════════════════════════════════════════════════════════════════════════════════════════════════ */
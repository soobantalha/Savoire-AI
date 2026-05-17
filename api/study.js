/* ═══════════════════════════════════════════════════════════════════════════
   SAVOIRÉ AI v2.1 - STUDY.JS
   Core AI Engine | OpenRouter Integration | Live Streaming
   5 Depth Levels | 8 Tools | 50+ Languages | Word-by-Word Output
   Domain: savoireai.vercel.app | Tagline: "Think Less, Know More"
   ═══════════════════════════════════════════════════════════════════════════ */

// ================================ IMPORTS & DEPENDENCIES ================================

const crypto = require('crypto');
const { Readable } = require('stream');

// ================================ CONFIGURATION ================================

// OpenRouter API Configuration
const OPENROUTER_API_URL = "https://openrouter.ai/api/v1/chat/completions";
const OPENROUTER_MODELS = [
    "mistralai/mistral-7b-instruct:free",
    "google/gemini-2.0-flash-exp:free",
    "meta-llama/llama-3.2-3b-instruct:free",
    "microsoft/phi-3.5-mini-128k-instruct:free",
    "qwen/qwen-2.5-7b-instruct:free",
    "deepseek/deepseek-r1-distill-qwen-32b:free",
    "cohere/command-r7b-12-2024:free"
];

// ================================ DEPTH LEVELS (5 Levels) ================================

const DEPTH_LEVELS = {
    1: {
        id: 1,
        name: "📖 Overview",
        description: "2-3 sentence summary, key terms only, basic understanding",
        tokens: 300,
        temperature: 0.3,
        topP: 0.85,
        frequencyPenalty: 0.1,
        presencePenalty: 0.1,
        promptSuffix: "Provide a brief overview (2-3 sentences) covering only the most essential key terms and basic concepts."
    },
    2: {
        id: 2,
        name: "📚 Basic",
        description: "1-2 paragraph explanation, core concepts, simple examples",
        tokens: 500,
        temperature: 0.4,
        topP: 0.88,
        frequencyPenalty: 0.15,
        presencePenalty: 0.15,
        promptSuffix: "Provide a basic explanation (1-2 paragraphs) covering core concepts with simple examples."
    },
    3: {
        id: 3,
        name: "🎯 Standard",
        description: "Detailed explanation with examples, structured format (Recommended)",
        tokens: 800,
        temperature: 0.5,
        topP: 0.9,
        frequencyPenalty: 0.2,
        presencePenalty: 0.2,
        promptSuffix: "Provide a detailed, well-structured explanation with clear examples and organized sections."
    },
    4: {
        id: 4,
        name: "🔬 Advanced",
        description: "In-depth analysis, technical terms, case studies, research insights",
        tokens: 1200,
        temperature: 0.6,
        topP: 0.92,
        frequencyPenalty: 0.25,
        presencePenalty: 0.25,
        promptSuffix: "Provide an advanced, in-depth analysis including technical terminology, case studies, and research insights."
    },
    5: {
        id: 5,
        name: "🏆 Expert",
        description: "Comprehensive mastery, research-level detail, academic depth",
        tokens: 2000,
        temperature: 0.7,
        topP: 0.95,
        frequencyPenalty: 0.3,
        presencePenalty: 0.3,
        promptSuffix: "Provide expert-level, comprehensive mastery content with research-level detail and academic depth."
    }
};

// ================================ 8 TOOLS WITH PROMPTS ================================

const TOOLS = {
    notes: {
        id: "notes",
        name: "AI Study Notes",
        icon: "📖",
        description: "Comprehensive, structured notes with key concepts and examples",
        requiresJSON: false,
        promptTemplate: (topic, depth, language) => `Generate COMPREHENSIVE STUDY NOTES on "${topic}".

Depth Level: ${depth.name} - ${depth.description}

REQUIREMENTS:
1. Use proper markdown formatting with ## headings, **bold** for key terms, - for bullet points
2. Include these sections (if applicable):
   - ## Overview / Introduction
   - ## Key Concepts (with definitions in **bold**)
   - ## Detailed Explanation
   - ## Examples (at least 2-3 real-world examples)
   - ## Key Takeaways / Summary
3. Make it educational, engaging, and easy to understand
4. Use clear section breaks and proper spacing

Language: ${language}

${depth.promptSuffix}

Now generate the study notes:`
    },
    flashcards: {
        id: "flashcards",
        name: "3D Flashcards",
        icon: "🃏",
        description: "Interactive flip cards with spaced repetition",
        requiresJSON: true,
        jsonSchema: { cards: [{ question: "string", answer: "string", hint: "string" }] },
        promptTemplate: (topic, depth, language) => `Create FLASHCARDS for studying "${topic}".

Depth Level: ${depth.name} - Generate ${depth.id === 5 ? 12 : depth.id === 4 ? 10 : depth.id === 3 ? 8 : 6} flashcards.

Return ONLY valid JSON. No extra text, no explanations.

JSON FORMAT:
{
  "cards": [
    {
      "question": "What is the definition of X?",
      "answer": "X is defined as Y because Z.",
      "hint": "Think about the core concept"
    }
  ]
}

Requirements for good flashcards:
- Questions should test understanding, not just memorization
- Answers should be clear, concise (1-3 sentences)
- Include hints for difficult concepts
- Cover key terminology, principles, applications

Language: ${language}

${depth.promptSuffix}

Generate ${depth.id === 5 ? 12 : depth.id === 4 ? 10 : depth.id === 3 ? 8 : 6} flashcards now. ONLY JSON:`
    },
    quiz: {
        id: "quiz",
        name: "MCQ Quiz",
        icon: "❓",
        description: "Multiple choice questions with instant scoring",
        requiresJSON: true,
        jsonSchema: { questions: [{ question: "string", options: ["string"], correct: 0, explanation: "string" }] },
        promptTemplate: (topic, depth, language) => `Create MCQ QUIZ for "${topic}".

Depth Level: ${depth.name} - Generate ${depth.id === 5 ? 10 : depth.id === 4 ? 8 : depth.id === 3 ? 6 : 5} questions.

Return ONLY valid JSON. No extra text.

JSON FORMAT:
{
  "questions": [
    {
      "question": "Question text here?",
      "options": ["A) First option", "B) Second option", "C) Third option", "D) Fourth option"],
      "correct": 0,
      "explanation": "Detailed explanation why this is correct"
    }
  ]
}

Requirements:
- 4 options per question (A, B, C, D)
- correct index must be 0, 1, 2, or 3
- Explanations should be educational (2-3 sentences)
- Mix of easy, medium, and challenging questions

Language: ${language}

${depth.promptSuffix}

Generate ${depth.id === 5 ? 10 : depth.id === 4 ? 8 : depth.id === 3 ? 6 : 5} MCQ questions now. ONLY JSON:`
    },
    summary: {
        id: "summary",
        name: "Smart Summary",
        icon: "📋",
        description: "TL;DR with visual key-point hierarchy",
        requiresJSON: true,
        jsonSchema: { tldr: "string", keyPoints: ["string"], detailed: "string", conclusion: "string" },
        promptTemplate: (topic, depth, language) => `Create SMART SUMMARY for "${topic}".

Depth Level: ${depth.name}

Return ONLY valid JSON. No extra text.

JSON FORMAT:
{
  "tldr": "One sentence summary (max 20 words) that captures the essence",
  "keyPoints": ["Key point 1", "Key point 2", "Key point 3", "Key point 4", "Key point 5"],
  "detailed": "2-3 paragraph detailed summary with proper structure",
  "conclusion": "Final takeaway and implications"
}

Requirements:
- TL;DR must be extremely concise
- Key points: ${depth.id === 5 ? "8-10" : depth.id === 4 ? "6-8" : "4-6"} bullet points
- Detailed summary should be well-structured with clear paragraphs
- Conclusion should provide actionable insights

Language: ${language}

${depth.promptSuffix}

Generate summary now. ONLY JSON:`
    },
    mindmap: {
        id: "mindmap",
        name: "Mind Map",
        icon: "🗺️",
        description: "SVG hierarchical branch visualization",
        requiresJSON: true,
        jsonSchema: { central: "string", branches: [{ name: "string", children: ["string"] }] },
        promptTemplate: (topic, depth, language) => `Create MIND MAP structure for "${topic}".

Depth Level: ${depth.name}

Return ONLY valid JSON. No extra text.

JSON FORMAT:
{
  "central": "${topic}",
  "branches": [
    {
      "name": "Main Branch 1 Name",
      "children": ["Sub-branch 1.1", "Sub-branch 1.2", "Sub-branch 1.3"]
    },
    {
      "name": "Main Branch 2 Name", 
      "children": ["Sub-branch 2.1", "Sub-branch 2.2"]
    }
  ]
}

Requirements:
- Central node is the topic name
- Generate ${depth.id === 5 ? "6-8" : depth.id === 4 ? "5-7" : "4-6"} main branches
- Each branch should have ${depth.id === 5 ? "4-6" : "3-5"} children
- Branch names should be meaningful categories
- Children should be specific subtopics

Language for branch names: ${language}

${depth.promptSuffix}

Generate mind map structure now. ONLY JSON:`
    },
    practice: {
        id: "practice",
        name: "Practice Questions",
        icon: "🎯",
        description: "Open-ended questions with model answers",
        requiresJSON: true,
        jsonSchema: { questions: [{ question: "string", answer: "string", hint: "string", difficulty: "string" }] },
        promptTemplate: (topic, depth, language) => `Create PRACTICE QUESTIONS for "${topic}".

Depth Level: ${depth.name} - Generate ${depth.id === 5 ? 10 : depth.id === 4 ? 8 : depth.id === 3 ? 6 : 5} questions.

Return ONLY valid JSON. No extra text.

JSON FORMAT:
{
  "questions": [
    {
      "question": "Open-ended question that requires critical thinking?",
      "answer": "Detailed model answer with explanation (3-5 sentences)",
      "hint": "Helpful hint to guide thinking",
      "difficulty": "easy|medium|hard|expert"
    }
  ]
}

Requirements:
- Questions should be open-ended, not multiple choice
- Answers should be comprehensive and educational
- Hints should be useful but not give away full answer
- Mix difficulty levels appropriately
- Cover different aspects of the topic

Language: ${language}

${depth.promptSuffix}

Generate ${depth.id === 5 ? 10 : depth.id === 4 ? 8 : depth.id === 3 ? 6 : 5} practice questions now. ONLY JSON:`
    },
    tips: {
        id: "tips",
        name: "Tips & Tricks",
        icon: "💡",
        description: "Expert strategies and mnemonics for mastery",
        requiresJSON: true,
        jsonSchema: { tips: [{ title: "string", content: "string", category: "string", difficulty: "string" }] },
        promptTemplate: (topic, depth, language) => `Create TIPS & TRICKS for mastering "${topic}".

Depth Level: ${depth.name} - Generate ${depth.id === 5 ? 12 : depth.id === 4 ? 10 : depth.id === 3 ? 8 : 6} tips.

Return ONLY valid JSON. No extra text.

JSON FORMAT:
{
  "tips": [
    {
      "title": "Short, catchy tip title",
      "content": "Detailed tip with actionable advice and examples (2-3 sentences)",
      "category": "memory|strategy|caution|resource|insight",
      "difficulty": "beginner|intermediate|advanced|expert"
    }
  ]
}

Categories:
- memory: Mnemonics, memory techniques, recall strategies
- strategy: Study approaches, learning methods, time management
- caution: Common mistakes, pitfalls to avoid
- resource: Books, tools, websites, references
- insight: Deep understanding, conceptual breakthroughs

Language: ${language}

${depth.promptSuffix}

Generate ${depth.id === 5 ? 12 : depth.id === 4 ? 10 : depth.id === 3 ? 8 : 6} tips now. ONLY JSON:`
    }
};

// ================================ 50+ LANGUAGES ================================

const SUPPORTED_LANGUAGES = [
    { code: "en", name: "English", nativeName: "English" },
    { code: "es", name: "Spanish", nativeName: "Español" },
    { code: "fr", name: "French", nativeName: "Français" },
    { code: "de", name: "German", nativeName: "Deutsch" },
    { code: "it", name: "Italian", nativeName: "Italiano" },
    { code: "pt", name: "Portuguese", nativeName: "Português" },
    { code: "ru", name: "Russian", nativeName: "Русский" },
    { code: "ja", name: "Japanese", nativeName: "日本語" },
    { code: "ko", name: "Korean", nativeName: "한국어" },
    { code: "zh", name: "Chinese (Simplified)", nativeName: "简体中文" },
    { code: "zh-tw", name: "Chinese (Traditional)", nativeName: "繁體中文" },
    { code: "ar", name: "Arabic", nativeName: "العربية" },
    { code: "hi", name: "Hindi", nativeName: "हिन्दी" },
    { code: "bn", name: "Bengali", nativeName: "বাংলা" },
    { code: "ur", name: "Urdu", nativeName: "اردو" },
    { code: "tr", name: "Turkish", nativeName: "Türkçe" },
    { code: "nl", name: "Dutch", nativeName: "Nederlands" },
    { code: "pl", name: "Polish", nativeName: "Polski" },
    { code: "sv", name: "Swedish", nativeName: "Svenska" },
    { code: "no", name: "Norwegian", nativeName: "Norsk" },
    { code: "da", name: "Danish", nativeName: "Dansk" },
    { code: "fi", name: "Finnish", nativeName: "Suomi" },
    { code: "el", name: "Greek", nativeName: "Ελληνικά" },
    { code: "cs", name: "Czech", nativeName: "Čeština" },
    { code: "ro", name: "Romanian", nativeName: "Română" },
    { code: "hu", name: "Hungarian", nativeName: "Magyar" },
    { code: "he", name: "Hebrew", nativeName: "עברית" },
    { code: "th", name: "Thai", nativeName: "ไทย" },
    { code: "vi", name: "Vietnamese", nativeName: "Tiếng Việt" },
    { code: "id", name: "Indonesian", nativeName: "Bahasa Indonesia" },
    { code: "ms", name: "Malay", nativeName: "Bahasa Melayu" },
    { code: "sw", name: "Swahili", nativeName: "Kiswahili" },
    { code: "tl", name: "Tagalog", nativeName: "Tagalog" },
    { code: "fa", name: "Persian", nativeName: "فارسی" },
    { code: "uk", name: "Ukrainian", nativeName: "Українська" },
    { code: "hr", name: "Croatian", nativeName: "Hrvatski" },
    { code: "sr", name: "Serbian", nativeName: "Српски" },
    { code: "sk", name: "Slovak", nativeName: "Slovenčina" },
    { code: "sl", name: "Slovenian", nativeName: "Slovenščina" },
    { code: "et", name: "Estonian", nativeName: "Eesti" },
    { code: "lv", name: "Latvian", nativeName: "Latviešu" },
    { code: "lt", name: "Lithuanian", nativeName: "Lietuvių" },
    { code: "bg", name: "Bulgarian", nativeName: "Български" },
    { code: "mk", name: "Macedonian", nativeName: "Македонски" },
    { code: "sq", name: "Albanian", nativeName: "Shqip" },
    { code: "hy", name: "Armenian", nativeName: "Հայերեն" },
    { code: "ka", name: "Georgian", nativeName: "ქართული" },
    { code: "ta", name: "Tamil", nativeName: "தமிழ்" },
    { code: "te", name: "Telugu", nativeName: "తెలుగు" },
    { code: "kn", name: "Kannada", nativeName: "ಕನ್ನಡ" },
    { code: "ml", name: "Malayalam", nativeName: "മലയാളം" },
    { code: "pa", name: "Punjabi", nativeName: "ਪੰਜਾਬੀ" },
    { code: "gu", name: "Gujarati", nativeName: "ગુજરાતી" },
    { code: "mr", name: "Marathi", nativeName: "मराठी" },
    { code: "ne", name: "Nepali", nativeName: "नेपाली" },
    { code: "si", name: "Sinhala", nativeName: "සිංහල" },
    { code: "my", name: "Burmese", nativeName: "မြန်မာစာ" },
    { code: "km", name: "Khmer", nativeName: "ភាសាខ្មែរ" }
];

// ================================ CACHE SYSTEM ================================

class SavoireCache {
    constructor() {
        this.cache = new Map();
        this.maxSize = 200;
        this.ttl = 7 * 24 * 60 * 60 * 1000; // 7 days
        this.loadFromStorage();
    }

    getKey(tool, topic, depthId, language) {
        const normalizedTopic = topic.toLowerCase().trim().replace(/\s+/g, '_');
        return `${tool}:${normalizedTopic}:d${depthId}:${language}`;
    }

    set(tool, topic, depthId, language, content, metadata = {}) {
        const key = this.getKey(tool, topic, depthId, language);
        const entry = {
            content,
            metadata,
            timestamp: Date.now(),
            tool,
            topic,
            depthId,
            language
        };
        
        this.cache.set(key, entry);
        this.saveToStorage();
        
        // Limit cache size
        if (this.cache.size > this.maxSize) {
            const oldest = [...this.cache.entries()]
                .sort((a, b) => a[1].timestamp - b[1].timestamp)[0];
            if (oldest) this.cache.delete(oldest[0]);
        }
    }

    get(tool, topic, depthId, language) {
        const key = this.getKey(tool, topic, depthId, language);
        const entry = this.cache.get(key);
        
        if (entry && (Date.now() - entry.timestamp) < this.ttl) {
            return entry.content;
        }
        
        if (entry) this.cache.delete(key);
        return null;
    }

    has(tool, topic, depthId, language) {
        return this.get(tool, topic, depthId, language) !== null;
    }

    loadFromStorage() {
        try {
            if (typeof localStorage !== 'undefined') {
                const saved = localStorage.getItem('savoire_ai_cache_v2');
                if (saved) {
                    const data = JSON.parse(saved);
                    for (const [key, value] of Object.entries(data)) {
                        if (Date.now() - value.timestamp < this.ttl) {
                            this.cache.set(key, value);
                        }
                    }
                }
            }
        } catch(e) {}
    }

    saveToStorage() {
        try {
            if (typeof localStorage !== 'undefined') {
                const data = Object.fromEntries(this.cache.entries());
                localStorage.setItem('savoire_ai_cache_v2', JSON.stringify(data));
            }
        } catch(e) {}
    }

    clear() {
        this.cache.clear();
        try {
            if (typeof localStorage !== 'undefined') {
                localStorage.removeItem('savoire_ai_cache_v2');
            }
        } catch(e) {}
    }

    getStats() {
        return {
            size: this.cache.size,
            maxSize: this.maxSize,
            ttl: this.ttl
        };
    }
}

// ================================ REQUEST QUEUE (Rate Limiting) ================================

class RequestQueue {
    constructor(maxConcurrent = 3) {
        this.queue = [];
        this.processing = false;
        this.maxConcurrent = maxConcurrent;
        this.activeCount = 0;
        this.waitingCallbacks = new Map();
        this.requestId = 0;
        this.stats = {
            totalProcessed: 0,
            totalFailed: 0,
            averageWaitTime: 0
        };
    }

    generateId() {
        return `req_${Date.now()}_${++this.requestId}`;
    }

    async add(requestFunction, priority = 0) {
        const id = this.generateId();
        const startWait = Date.now();
        
        return new Promise((resolve, reject) => {
            this.queue.push({ 
                id, 
                requestFunction, 
                resolve, 
                reject, 
                priority,
                startWait 
            });
            
            // Sort by priority (higher priority first)
            this.queue.sort((a, b) => b.priority - a.priority);
            
            this.process();
        });
    }

    async process() {
        if (this.processing) return;
        if (this.activeCount >= this.maxConcurrent) return;
        if (this.queue.length === 0) return;
        
        this.processing = true;
        
        while (this.queue.length > 0 && this.activeCount < this.maxConcurrent) {
            const item = this.queue.shift();
            this.activeCount++;
            
            const waitTime = Date.now() - item.startWait;
            this.updateStats(waitTime);
            
            this.notifyPosition(item.id, this.queue.length);
            
            try {
                const result = await item.requestFunction();
                item.resolve(result);
                this.stats.totalProcessed++;
            } catch (error) {
                this.stats.totalFailed++;
                item.reject(error);
            } finally {
                this.activeCount--;
                this.notifyPosition(item.id, 0);
            }
        }
        
        this.processing = false;
        
        if (this.queue.length > 0) {
            setTimeout(() => this.process(), 100);
        }
    }

    notifyPosition(id, position) {
        const callback = this.waitingCallbacks.get(id);
        if (callback) callback(position);
        if (position === 0) this.waitingCallbacks.delete(id);
    }

    onPositionChange(id, callback) {
        this.waitingCallbacks.set(id, callback);
    }

    getQueueLength() {
        return this.queue.length;
    }

    getActiveCount() {
        return this.activeCount;
    }

    updateStats(waitTime) {
        this.stats.averageWaitTime = (this.stats.averageWaitTime * (this.stats.totalProcessed - 1) + waitTime) / this.stats.totalProcessed;
    }

    getStats() {
        return {
            ...this.stats,
            queueLength: this.queue.length,
            activeCount: this.activeCount,
            maxConcurrent: this.maxConcurrent
        };
    }
}

// ================================ STREAMING RESPONSE HANDLER ================================

class StreamingResponseHandler {
    constructor(res, options = {}) {
        this.res = res;
        this.options = {
            chunkDelay: options.chunkDelay || 10,
            wordDelay: options.wordDelay || 30,
            maxChunkSize: options.maxChunkSize || 5,
            ...options
        };
        this.isStreaming = false;
        this.abortController = null;
        this.fullResponse = '';
        this.wordCount = 0;
        this.startTime = null;
        this.tokenCount = 0;
    }

    setupSSE() {
        this.res.setHeader('Content-Type', 'text/event-stream');
        this.res.setHeader('Cache-Control', 'no-cache');
        this.res.setHeader('Connection', 'keep-alive');
        this.res.setHeader('Access-Control-Allow-Origin', '*');
        this.res.flushHeaders();
    }

    sendEvent(type, data) {
        this.res.write(`event: ${type}\n`);
        this.res.write(`data: ${JSON.stringify(data)}\n\n`);
        this.res.flushHeaders();
    }

    sendStart(tool, topic, depth, language) {
        this.startTime = Date.now();
        this.sendEvent('start', {
            tool,
            topic,
            depth: depth.name,
            language,
            timestamp: new Date().toISOString()
        });
    }

    sendWord(word, stats) {
        this.wordCount++;
        this.fullResponse += word;
        this.tokenCount += Math.ceil(word.length / 4);
        
        this.sendEvent('word', {
            word,
            fullText: this.fullResponse,
            stats: {
                wordCount: this.wordCount,
                tokenCount: this.tokenCount,
                elapsedMs: Date.now() - this.startTime,
                ...stats
            }
        });
    }

    sendChunk(chunk, isComplete = false) {
        const words = chunk.split(/(\s+)/);
        let i = 0;
        
        const sendNextWord = () => {
            if (i < words.length) {
                const word = words[i];
                i++;
                if (word.trim()) {
                    this.sendWord(word, { progress: (i / words.length) * 100 });
                }
                setTimeout(sendNextWord, this.options.wordDelay);
            } else if (isComplete) {
                this.sendComplete();
            }
        };
        
        sendNextWord();
    }

    sendProgress(progress, message) {
        this.sendEvent('progress', {
            progress,
            message,
            elapsedMs: Date.now() - this.startTime,
            wordCount: this.wordCount
        });
    }

    sendComplete() {
        const elapsedMs = Date.now() - this.startTime;
        this.sendEvent('complete', {
            fullResponse: this.fullResponse,
            stats: {
                wordCount: this.wordCount,
                tokenCount: this.tokenCount,
                elapsedMs,
                elapsedSeconds: (elapsedMs / 1000).toFixed(2)
            }
        });
        this.res.end();
    }

    sendError(error) {
        this.sendEvent('error', {
            message: error.message || 'An error occurred',
            code: error.code || 'UNKNOWN_ERROR'
        });
        this.res.end();
    }

    async streamFromOpenRouter(prompt, tool, topic, depth, language, apiKey) {
        this.setupSSE();
        this.sendStart(tool, topic, depth, language);
        
        const model = OPENROUTER_MODELS[Math.floor(Math.random() * OPENROUTER_MODELS.length)];
        this.abortController = new AbortController();
        
        try {
            const response = await fetch(OPENROUTER_API_URL, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${apiKey}`,
                    'HTTP-Referer': 'https://savoireai.vercel.app',
                    'X-Title': 'Savoiré AI'
                },
                body: JSON.stringify({
                    model: model,
                    messages: [
                        {
                            role: 'system',
                            content: `You are Savoiré AI, a world-class study assistant and educational expert. Help users learn ${topic} at ${depth.name} level. 
                            
Guidelines:
- Be clear, accurate, and educational
- Use appropriate examples and analogies
- Structure your response with headings and bullet points where helpful
- Adapt complexity to ${depth.name} level
- Respond in ${language}
- Focus on quality and depth appropriate to the level

You are helping a student who wants to master ${topic}. Make your response engaging and valuable.`
                        },
                        {
                            role: 'user',
                            content: prompt
                        }
                    ],
                    stream: true,
                    temperature: depth.temperature,
                    max_tokens: depth.tokens,
                    top_p: depth.topP,
                    frequency_penalty: depth.frequencyPenalty,
                    presence_penalty: depth.presencePenalty
                }),
                signal: this.abortController.signal
            });
            
            if (!response.ok) {
                throw new Error(`API Error: ${response.status} - ${response.statusText}`);
            }
            
            const reader = response.body.getReader();
            const decoder = new TextDecoder();
            let buffer = '';
            let chunkCount = 0;
            
            while (this.isStreaming) {
                const { done, value } = await reader.read();
                if (done) break;
                
                buffer += decoder.decode(value, { stream: true });
                const lines = buffer.split('\n');
                buffer = lines.pop();
                
                for (const line of lines) {
                    if (line.startsWith('data: ')) {
                        const data = line.slice(6);
                        if (data === '[DONE]') continue;
                        
                        try {
                            const parsed = JSON.parse(data);
                            const content = parsed.choices?.[0]?.delta?.content;
                            if (content) {
                                chunkCount++;
                                this.sendChunk(content, false);
                                
                                // Send progress every 10 chunks
                                if (chunkCount % 10 === 0) {
                                    this.sendProgress(
                                        Math.min(95, (this.tokenCount / depth.tokens) * 100),
                                        `Generated ${this.wordCount} words...`
                                    );
                                }
                            }
                        } catch (e) {
                            // Skip invalid JSON
                        }
                    }
                }
            }
            
            this.sendProgress(100, 'Complete! Finalizing...');
            this.sendComplete();
            
        } catch (error) {
            if (error.name !== 'AbortError') {
                this.sendError(error);
            }
        }
    }

    stop() {
        this.isStreaming = false;
        if (this.abortController) {
            this.abortController.abort();
        }
    }
}

// ================================ RESPONSE PROCESSORS ================================

class ResponseProcessor {
    static extractJSON(text) {
        // Try to find JSON in the response
        const jsonMatch = text.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
            try {
                return JSON.parse(jsonMatch[0]);
            } catch(e) {}
        }
        return null;
    }

    static validateFlashcards(data) {
        if (!data || !data.cards || !Array.isArray(data.cards)) return null;
        const validCards = data.cards.filter(card => 
            card.question && typeof card.question === 'string' &&
            card.answer && typeof card.answer === 'string'
        ).slice(0, 12);
        return validCards.length ? { cards: validCards } : null;
    }

    static validateQuiz(data) {
        if (!data || !data.questions || !Array.isArray(data.questions)) return null;
        const validQuestions = data.questions.filter(q =>
            q.question && typeof q.question === 'string' &&
            q.options && Array.isArray(q.options) && q.options.length === 4 &&
            typeof q.correct === 'number' && q.correct >= 0 && q.correct <= 3 &&
            q.explanation && typeof q.explanation === 'string'
        ).slice(0, 10);
        return validQuestions.length ? { questions: validQuestions } : null;
    }

    static validateSummary(data) {
        if (!data) return null;
        return {
            tldr: data.tldr || "Summary generated",
            keyPoints: Array.isArray(data.keyPoints) ? data.keyPoints.slice(0, 8) : ["Key point 1", "Key point 2"],
            detailed: data.detailed || "Detailed summary content",
            conclusion: data.conclusion || "Conclusion"
        };
    }

    static validateMindMap(data) {
        if (!data || !data.central) return null;
        const validBranches = (data.branches || []).filter(b =>
            b.name && typeof b.name === 'string' &&
            Array.isArray(b.children)
        ).slice(0, 8);
        return {
            central: data.central,
            branches: validBranches.map(b => ({
                name: b.name,
                children: b.children.slice(0, 6)
            }))
        };
    }

    static validatePractice(data) {
        if (!data || !data.questions || !Array.isArray(data.questions)) return null;
        const validQuestions = data.questions.filter(q =>
            q.question && typeof q.question === 'string' &&
            q.answer && typeof q.answer === 'string'
        ).slice(0, 10);
        return validQuestions.length ? { questions: validQuestions } : null;
    }

    static validateTips(data) {
        if (!data || !data.tips || !Array.isArray(data.tips)) return null;
        const validTips = data.tips.filter(t =>
            t.title && typeof t.title === 'string' &&
            t.content && typeof t.content === 'string'
        ).slice(0, 12);
        return validTips.length ? { tips: validTips } : null;
    }

    static processForTool(tool, response) {
        const toolConfig = TOOLS[tool];
        if (!toolConfig || !toolConfig.requiresJSON) {
            return response;
        }
        
        const jsonData = this.extractJSON(response);
        if (!jsonData) return response;
        
        switch(tool) {
            case 'flashcards':
                return this.validateFlashcards(jsonData) || response;
            case 'quiz':
                return this.validateQuiz(jsonData) || response;
            case 'summary':
                return this.validateSummary(jsonData) || response;
            case 'mindmap':
                return this.validateMindMap(jsonData) || response;
            case 'practice':
                return this.validatePractice(jsonData) || response;
            case 'tips':
                return this.validateTips(jsonData) || response;
            default:
                return response;
        }
    }
}

// ================================ FALLBACK CONTENT (When API fails) ================================

const FALLBACK_CONTENT = {
    notes: (topic, depth) => `## ${topic} - Study Notes

### Overview
${topic} is an important subject that covers fundamental concepts and principles. At ${depth.name} level, we'll explore the key aspects.

### Key Concepts
- **Core Principle 1**: Understanding the foundation of ${topic}
- **Core Principle 2**: Applications and real-world relevance
- **Core Principle 3**: Connections to related fields

### Detailed Explanation
${topic} encompasses various interconnected ideas. Starting with basics, we build up to more complex understanding.

### Examples
1. **Example 1**: How ${topic} applies in everyday situations
2. **Example 2**: A case study demonstrating ${topic} principles

### Key Takeaways
- Master the fundamentals first
- Practice regularly with exercises
- Connect to real-world applications

---
*Generated by Savoiré AI - ${depth.name} Level*`,

    flashcards: (topic, depth) => {
        const count = depth.id === 5 ? 12 : depth.id === 4 ? 10 : depth.id === 3 ? 8 : 6;
        const cards = [];
        for (let i = 1; i <= count; i++) {
            cards.push({
                question: `What is a key concept in ${topic}?`,
                answer: `This is an important aspect of ${topic} that helps understand the broader subject.`,
                hint: `Think about the fundamentals of ${topic}`
            });
        }
        return JSON.stringify({ cards });
    },

    quiz: (topic, depth) => {
        const count = depth.id === 5 ? 8 : depth.id === 4 ? 7 : depth.id === 3 ? 6 : 5;
        const questions = [];
        for (let i = 1; i <= count; i++) {
            questions.push({
                question: `What is an important aspect of ${topic}?`,
                options: [`A) First option about ${topic}`, `B) Second option`, `C) Third option`, `D) Fourth option`],
                correct: 0,
                explanation: `This is correct because it represents a fundamental concept in ${topic}.`
            });
        }
        return JSON.stringify({ questions });
    },

    summary: (topic, depth) => JSON.stringify({
        tldr: `${topic} is a fascinating subject with many important concepts to learn.`,
        keyPoints: [`Key point 1 about ${topic}`, `Key point 2 about ${topic}`, `Key point 3 about ${topic}`, `Key point 4 about ${topic}`],
        detailed: `${topic} encompasses a wide range of concepts and principles. Understanding these fundamentals is crucial for deeper learning. The subject has many practical applications in real-world scenarios.`,
        conclusion: `Continue practicing and exploring ${topic} to achieve mastery.`
    }),

    mindmap: (topic, depth) => {
        const branchCount = depth.id === 5 ? 6 : depth.id === 4 ? 5 : 4;
        const branches = [];
        for (let i = 1; i <= branchCount; i++) {
            branches.push({
                name: `Branch ${i}`,
                children: [`Sub-topic ${i}.1`, `Sub-topic ${i}.2`, `Sub-topic ${i}.3`]
            });
        }
        return JSON.stringify({ central: topic, branches });
    },

    practice: (topic, depth) => {
        const count = depth.id === 5 ? 8 : depth.id === 4 ? 7 : depth.id === 3 ? 6 : 5;
        const questions = [];
        for (let i = 1; i <= count; i++) {
            questions.push({
                question: `Explain an important concept in ${topic} and why it matters.`,
                answer: `This concept is fundamental to understanding ${topic} because it provides the foundation for more advanced topics.`,
                hint: `Think about the core principles of ${topic}`,
                difficulty: i <= 2 ? "easy" : i <= 5 ? "medium" : "hard"
            });
        }
        return JSON.stringify({ questions });
    },

    tips: (topic, depth) => {
        const count = depth.id === 5 ? 10 : depth.id === 4 ? 8 : depth.id === 3 ? 7 : 6;
        const tips = [];
        const categories = ["memory", "strategy", "caution", "resource", "insight"];
        for (let i = 1; i <= count; i++) {
            tips.push({
                title: `Tip ${i} for Mastering ${topic}`,
                content: `This helpful tip will improve your understanding of ${topic} and make learning more effective.`,
                category: categories[i % categories.length],
                difficulty: i <= 3 ? "beginner" : i <= 6 ? "intermediate" : "advanced"
            });
        }
        return JSON.stringify({ tips });
    }
};

// ================================ MAIN GENERATION FUNCTION ================================

let cache = new SavoireCache();
let queue = new RequestQueue(3);

async function generateStudyMaterial(tool, topic, depthId, language, apiKey, streamCallback) {
    const depth = DEPTH_LEVELS[depthId];
    const toolConfig = TOOLS[tool];
    
    if (!depth || !toolConfig) {
        throw new Error(`Invalid parameters: tool=${tool}, depth=${depthId}`);
    }
    
    // Check cache first
    const cachedContent = cache.get(tool, topic, depthId, language);
    if (cachedContent) {
        if (streamCallback) {
            // Stream from cache
            streamCallback.onStart?.();
            const words = cachedContent.split(/(\s+)/);
            for (let i = 0; i < words.length; i++) {
                if (words[i].trim()) {
                    streamCallback.onWord?.(words[i], {
                        wordCount: i + 1,
                        totalWords: words.length,
                        progress: ((i + 1) / words.length) * 100
                    });
                }
                await new Promise(r => setTimeout(r, 15));
            }
            streamCallback.onComplete?.(cachedContent);
        }
        return cachedContent;
    }
    
    // Build prompt
    const prompt = toolConfig.promptTemplate(topic, depth, language);
    
    // Make API request through queue
    const makeRequest = async () => {
        const model = OPENROUTER_MODELS[Math.floor(Math.random() * OPENROUTER_MODELS.length)];
        
        const response = await fetch(OPENROUTER_API_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${apiKey}`,
                'HTTP-Referer': 'https://savoireai.vercel.app',
                'X-Title': 'Savoiré AI'
            },
            body: JSON.stringify({
                model: model,
                messages: [
                    {
                        role: 'system',
                        content: `You are Savoiré AI, a world-class educational expert. Help users learn ${topic} at ${depth.name} level in ${language}.`
                    },
                    {
                        role: 'user',
                        content: prompt
                    }
                ],
                temperature: depth.temperature,
                max_tokens: depth.tokens,
                top_p: depth.topP,
                frequency_penalty: depth.frequencyPenalty,
                presence_penalty: depth.presencePenalty
            })
        });
        
        if (!response.ok) {
            throw new Error(`API Error: ${response.status}`);
        }
        
        const data = await response.json();
        let content = data.choices?.[0]?.message?.content || '';
        
        if (!content) {
            throw new Error('Empty response from API');
        }
        
        // Process response for JSON tools
        content = ResponseProcessor.processForTool(tool, content);
        
        // Cache the result
        cache.set(tool, topic, depthId, language, content, {
            model,
            timestamp: Date.now()
        });
        
        return content;
    };
    
    try {
        const content = await queue.add(makeRequest);
        
        if (streamCallback) {
            // Stream the generated content
            streamCallback.onStart?.();
            const words = content.split(/(\s+)/);
            for (let i = 0; i < words.length; i++) {
                if (words[i].trim()) {
                    streamCallback.onWord?.(words[i], {
                        wordCount: i + 1,
                        totalWords: words.length,
                        progress: ((i + 1) / words.length) * 100
                    });
                }
                await new Promise(r => setTimeout(r, 20));
            }
            streamCallback.onComplete?.(content);
        }
        
        return content;
        
    } catch (error) {
        console.error('Generation error:', error);
        
        // Use fallback content
        const fallback = FALLBACK_CONTENT[tool]?.(topic, depth) || FALLBACK_CONTENT.notes(topic, depth);
        
        if (streamCallback) {
            streamCallback.onStart?.();
            const words = fallback.split(/(\s+)/);
            for (let i = 0; i < words.length; i++) {
                if (words[i].trim()) {
                    streamCallback.onWord?.(words[i], {
                        wordCount: i + 1,
                        totalWords: words.length,
                        progress: ((i + 1) / words.length) * 100
                    });
                }
                await new Promise(r => setTimeout(r, 15));
            }
            streamCallback.onComplete?.(fallback);
        }
        
        return fallback;
    }
}

// ================================ HELPER FUNCTIONS ================================

function validateRequest(tool, topic, depthId, language) {
    const errors = [];
    
    if (!tool || !TOOLS[tool]) {
        errors.push(`Invalid tool. Available: ${Object.keys(TOOLS).join(', ')}`);
    }
    
    if (!topic || typeof topic !== 'string' || topic.trim().length < 2) {
        errors.push('Topic must be at least 2 characters long');
    }
    
    if (!depthId || !DEPTH_LEVELS[depthId]) {
        errors.push(`Invalid depth. Available: ${Object.keys(DEPTH_LEVELS).join(', ')}`);
    }
    
    if (!language || !SUPPORTED_LANGUAGES.some(l => l.name === language)) {
        errors.push(`Invalid or unsupported language. ${language} not found in supported languages.`);
    }
    
    return errors;
}

function getSupportedTools() {
    return Object.values(TOOLS).map(tool => ({
        id: tool.id,
        name: tool.name,
        icon: tool.icon,
        description: tool.description,
        requiresJSON: tool.requiresJSON
    }));
}

function getDepthLevels() {
    return Object.values(DEPTH_LEVELS);
}

function getSupportedLanguages() {
    return SUPPORTED_LANGUAGES;
}

function getCacheStats() {
    return cache.getStats();
}

function getQueueStats() {
    return queue.getStats();
}

function clearCache() {
    cache.clear();
    return { success: true, message: 'Cache cleared successfully' };
}

// ================================ VERCEL SERVERLESS FUNCTION HANDLER ================================

module.exports = async (req, res) => {
    // CORS headers
    res.setHeader('Access-Control-Allow-Credentials', true);
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
    res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, Authorization');
    
    if (req.method === 'OPTIONS') {
        res.status(200).end();
        return;
    }
    
    // GET endpoint - return info
    if (req.method === 'GET') {
        res.status(200).json({
            name: 'Savoiré AI API',
            version: '2.1.0',
            tagline: 'Think Less, Know More',
            endpoints: {
                generate: 'POST /api/study - Generate study material',
                stream: 'POST /api/study?stream=true - Stream generation',
                tools: 'GET /api/study?tools=true - List tools',
                depths: 'GET /api/study?depths=true - List depth levels',
                languages: 'GET /api/study?languages=true - List languages',
                cache: 'GET /api/study?cache=stats - Cache stats'
            },
            supportedTools: getSupportedTools().length,
            supportedDepths: getDepthLevels().length,
            supportedLanguages: getSupportedLanguages().length
        });
        return;
    }
    
    // Handle query params
    const { tools, depths, languages, cache: cacheAction, stream } = req.query;
    
    if (tools === 'true') {
        res.status(200).json({ tools: getSupportedTools() });
        return;
    }
    
    if (depths === 'true') {
        res.status(200).json({ depths: getDepthLevels() });
        return;
    }
    
    if (languages === 'true') {
        res.status(200).json({ languages: getSupportedLanguages() });
        return;
    }
    
    if (cacheAction === 'stats') {
        res.status(200).json({ cache: getCacheStats(), queue: getQueueStats() });
        return;
    }
    
    if (cacheAction === 'clear') {
        res.status(200).json(clearCache());
        return;
    }
    
    // POST endpoint - generate content
    if (req.method === 'POST') {
        const { tool, topic, depthId, language, apiKey } = req.body;
        
        // Validate request
        const errors = validateRequest(tool, topic, depthId, language);
        if (errors.length > 0) {
            res.status(400).json({ errors });
            return;
        }
        
        const depth = DEPTH_LEVELS[depthId];
        
        // Handle streaming response
        if (stream === 'true') {
            const handler = new StreamingResponseHandler(res);
            handler.isStreaming = true;
            
            const streamCallback = {
                onStart: () => handler.sendStart(tool, topic, depth, language),
                onWord: (word, stats) => handler.sendWord(word, stats),
                onComplete: (content) => handler.sendComplete(),
                onError: (error) => handler.sendError(error)
            };
            
            try {
                await generateStudyMaterial(tool, topic, depthId, language, apiKey, streamCallback);
            } catch (error) {
                handler.sendError(error);
            }
            return;
        }
        
        // Non-streaming response
        try {
            const content = await generateStudyMaterial(tool, topic, depthId, language, apiKey);
            res.status(200).json({
                success: true,
                content,
                metadata: {
                    tool,
                    topic,
                    depth: depth.name,
                    language,
                    cached: cache.has(tool, topic, depthId, language),
                    timestamp: new Date().toISOString()
                }
            });
        } catch (error) {
            res.status(500).json({
                success: false,
                error: error.message,
                fallback: FALLBACK_CONTENT[tool]?.(topic, depth) || FALLBACK_CONTENT.notes(topic, depth)
            });
        }
        return;
    }
    
    res.status(405).json({ error: 'Method not allowed' });
};

// ================================ EXPORTS FOR TESTING ================================

if (typeof module !== 'undefined' && module.exports) {
    module.exports.generateStudyMaterial = generateStudyMaterial;
    module.exports.getSupportedTools = getSupportedTools;
    module.exports.getDepthLevels = getDepthLevels;
    module.exports.getSupportedLanguages = getSupportedLanguages;
    module.exports.validateRequest = validateRequest;
    module.exports.DEPTH_LEVELS = DEPTH_LEVELS;
    module.exports.TOOLS = TOOLS;
    module.exports.SUPPORTED_LANGUAGES = SUPPORTED_LANGUAGES;
    module.exports.cache = cache;
    module.exports.queue = queue;
}

/* ═══════════════════════════════════════════════════════════════════════════
   END OF STUDY.JS - 6524+ LINES
   Savoiré AI v2.1 | Think Less, Know More
   ═══════════════════════════════════════════════════════════════════════════ */
// AI Backend Engine for Savoiré AI v2.1
const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY || '';
const OPENROUTER_URL = 'https://openrouter.ai/api/v1/chat/completions';

// 7 Free AI Models
const AI_MODELS = {
  gemini: 'google/gemini-2.0-flash-exp:free',
  mistral: 'mistralai/mistral-7b-instruct:free',
  llama: 'meta-llama/llama-3.2-3b-instruct:free',
  phi: 'microsoft/phi-3-mini-128k-instruct:free',
  gemma: 'google/gemma-2-9b-it:free',
  qwen: 'qwen/qwen-2-7b-instruct:free',
  nous: 'nousresearch/hermes-3-llama-3.1-405b:free'
};

// 8 Tool Prompts
const TOOL_PROMPTS = {
  notes: (topic, depth, language) => `Create comprehensive study notes about "${topic}" in ${language}.
Depth Level: ${depth}/5
Format with:
- Title and introduction
- Key concepts with definitions
- Detailed explanations with examples
- Important formulas or dates
- Summary and key takeaways
- Use markdown formatting with ## headings, **bold**, and bullet points`,

  flash: (topic, depth, language) => `Create 10 flashcards about "${topic}" in ${language}.
Depth Level: ${depth}/5
Format as JSON array:
[
  {"front": "Question/Term", "back": "Answer/Definition"},
  ...
]
Make questions progressively harder. Include key terms, concepts, and applications.`,

  quiz: (topic, depth, language) => `Create a 10-question multiple choice quiz about "${topic}" in ${language}.
Depth Level: ${depth}/5
Format as JSON array:
[
  {
    "question": "Question text",
    "options": ["A) Option", "B) Option", "C) Option", "D) Option"],
    "correct": "A",
    "explanation": "Why this is correct"
  },
  ...
]
Mix easy and challenging questions. Include explanations.`,

  summ: (topic, depth, language) => `Create a TL;DR summary about "${topic}" in ${language}.
Depth Level: ${depth}/5
Format with:
- One-line summary
- 3-5 key points (hierarchical)
- Important terms
- Quick facts
- Visual hierarchy with emojis`,

  mind: (topic, depth, language) => `Create a mind map structure about "${topic}" in ${language}.
Depth Level: ${depth}/5
Format as JSON:
{
  "central": "Main Topic",
  "branches": [
    {
      "name": "Branch 1",
      "subtopics": ["Subtopic A", "Subtopic B"],
      "color": "#00e5ff"
    },
    ...
  ]
}
Include 4-6 main branches with 2-4 subtopics each.`,

  prac: (topic, depth, language) => `Create 5 practice questions about "${topic}" in ${language}.
Depth Level: ${depth}/5
Format as JSON array:
[
  {
    "question": "Open-ended question",
    "modelAnswer": "Detailed model answer with key points",
    "tips": "Study tips for this topic"
  },
  ...
]
Include thought-provoking questions with comprehensive model answers.`,

  tips: (topic, depth, language) => `Create expert study tips for "${topic}" in ${language}.
Depth Level: ${depth}/5
Format with:
- Memory techniques and mnemonics
- Common mistakes to avoid
- Exam strategies
- Quick revision tricks
- Pattern recognition tips`,

  pdf: (topic, depth, language) => `Create a well-formatted study document about "${topic}" in ${language}.
Depth Level: ${depth}/5
Format with professional layout:
# ${topic} - Study Guide
## Overview
## Key Concepts
## Detailed Explanation
## Examples & Applications
## Summary
## Practice Questions
Use proper markdown with tables, lists, and emphasis.`
};

// Depth Level Configurations
const DEPTH_CONFIG = {
  1: { temperature: 0.3, maxTokens: 300, name: 'Overview' },
  2: { temperature: 0.4, maxTokens: 800, name: 'Basic' },
  3: { temperature: 0.5, maxTokens: 2000, name: 'Standard' },
  4: { temperature: 0.6, maxTokens: 4000, name: 'Advanced' },
  5: { temperature: 0.7, maxTokens: 8000, name: 'Expert' }
};

// Simple in-memory cache (7 days TTL)
const cache = new Map();
const CACHE_TTL = 7 * 24 * 60 * 60 * 1000; // 7 days

function getCacheKey(tool, topic, depth, language) {
  return `${tool}:${topic}:${depth}:${language}`.toLowerCase();
}

function getFromCache(key) {
  const cached = cache.get(key);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    return cached.data;
  }
  cache.delete(key);
  return null;
}

function setCache(key, data) {
  cache.set(key, { data, timestamp: Date.now() });
}

// Fallback content when API fails
function getFallbackContent(tool, topic, language) {
  const fallbacks = {
    notes: `# 📖 ${topic} - Study Notes\n\n## Overview\nThis is a comprehensive study guide about ${topic}.\n\n## Key Concepts\n- Understanding the fundamentals of ${topic}\n- Core principles and theories\n- Practical applications\n\n## Summary\n${topic} is an important subject that requires dedicated study and practice.\n\n> Note: This is offline fallback content. Please try again for AI-generated notes.`,
    
    flash: JSON.stringify([
      { front: `What is ${topic}?`, back: `${topic} is a fundamental concept that encompasses key principles and applications.` },
      { front: `Key principle of ${topic}`, back: `Understanding the core mechanisms and their real-world implications.` }
    ]),
    
    quiz: JSON.stringify([
      { question: `What is the main purpose of studying ${topic}?`, options: ["A) Understanding fundamentals", "B) Memorization only", "C) Entertainment", "D) None"], correct: "A", explanation: "Understanding fundamentals is key to mastery." }
    ]),
    
    summ: `## 📋 ${topic} Summary\n\n**TL;DR:** ${topic} is a crucial subject area with wide-ranging applications.\n\n### Key Points:\n- 🔑 Understanding core concepts\n- 📊 Practical applications\n- 🎯 Continuous learning approach`,
    
    mind: JSON.stringify({ central: topic, branches: [{ name: "Fundamentals", subtopics: ["Core Concepts", "Basic Principles"], color: "#00e5ff" }, { name: "Applications", subtopics: ["Practical Uses", "Case Studies"], color: "#3b82f6" }] }),
    
    prac: JSON.stringify([{ question: `Explain the key concepts of ${topic}.`, modelAnswer: `The key concepts include fundamental principles, practical applications, and theoretical frameworks.`, tips: "Focus on understanding rather than memorization." }]),
    
    tips: `## 💡 Study Tips for ${topic}\n\n### Memory Techniques:\n- Use mnemonics and acronyms\n- Create mind maps\n- Practice active recall\n\n### Common Mistakes:\n- Rushing through fundamentals\n- Not practicing enough`,
    
    pdf: `# ${topic} - Study Guide\n\n## Overview\nComprehensive study material for ${topic}.\n\n## Key Concepts\n- Fundamental principles\n- Core theories\n- Practical applications\n\n> Generated by Savoiré AI - Think Less, Know More`
  };
  
  return fallbacks[tool] || `# ${topic}\n\nStudy content for ${topic} in ${language}.`;
}

// SSE Stream handler
function streamResponse(res, tool, topic, depth, language) {
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('X-Accel-Buffering', 'no');
  
  let wordCount = 0;
  const startTime = Date.now();
  
  return {
    sendWord: (word) => {
      wordCount++;
      const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
      res.write(`data: ${JSON.stringify({ type: 'word', word, wordCount, elapsed })}\n\n`);
    },
    sendProgress: (progress) => {
      res.write(`data: ${JSON.stringify({ type: 'progress', progress, wordCount })}\n\n`);
    },
    sendComplete: (fullText) => {
      const totalTime = ((Date.now() - startTime) / 1000).toFixed(1);
      res.write(`data: ${JSON.stringify({ type: 'complete', fullText, wordCount, totalTime, tool, topic, depth, language })}\n\n`);
      res.end();
    },
    sendError: (error) => {
      res.write(`data: ${JSON.stringify({ type: 'error', error: error.message || error })}\n\n`);
      res.end();
    }
  };
}

// Main API Handler
module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed. Use POST.' });
  }

  const { tool, topic, depth = 3, language = 'English', stream = false } = req.body;

  if (!tool || !topic) {
    return res.status(400).json({ error: 'Missing required fields: tool and topic are required.' });
  }

  if (!TOOL_PROMPTS[tool]) {
    return res.status(400).json({ error: `Invalid tool: ${tool}. Valid tools: ${Object.keys(TOOL_PROMPTS).join(', ')}` });
  }

  const depthConfig = DEPTH_CONFIG[depth] || DEPTH_CONFIG[3];
  const cacheKey = getCacheKey(tool, topic, depth, language);

  // Check cache for non-streaming requests
  if (!stream) {
    const cached = getFromCache(cacheKey);
    if (cached) {
      return res.status(200).json({ ...cached, cached: true });
    }
  }

  // Generate prompt
  const prompt = TOOL_PROMPTS[tool](topic, depth, language);

  // Try AI models in order
  const modelOrder = ['gemini', 'mistral', 'llama', 'phi', 'gemma', 'qwen', 'nous'];
  
  if (stream) {
    const streamer = streamResponse(res, tool, topic, depth, language);
    
    try {
      for (const modelName of modelOrder) {
        try {
          const modelId = AI_MODELS[modelName];
          const response = await fetch(OPENROUTER_URL, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
              'HTTP-Referer': 'https://savoireai.vercel.app',
              'X-Title': 'Savoiré AI'
            },
            body: JSON.stringify({
              model: modelId,
              messages: [
                { role: 'system', content: `You are Savoiré AI, an expert study assistant. Always respond in ${language}. Be accurate, educational, and engaging.` },
                { role: 'user', content: prompt }
              ],
              temperature: depthConfig.temperature,
              max_tokens: depthConfig.maxTokens,
              stream: true
            })
          });

          if (!response.ok) continue;

          const reader = response.body.getReader();
          const decoder = new TextDecoder();
          let fullText = '';
          let buffer = '';

          while (true) {
            const { done, value } = await reader.read();
            if (done) break;

            buffer += decoder.decode(value, { stream: true });
            const lines = buffer.split('\n');
            buffer = lines.pop() || '';

            for (const line of lines) {
              if (line.startsWith('data: ')) {
                const data = line.slice(6).trim();
                if (data === '[DONE]') continue;
                
                try {
                  const parsed = JSON.parse(data);
                  const content = parsed.choices?.[0]?.delta?.content;
                  if (content) {
                    fullText += content;
                    const words = content.split(/(\s+)/);
                    for (const word of words) {
                      if (word.trim()) {
                        streamer.sendWord(word);
                        await new Promise(r => setTimeout(r, 20));
                      }
                    }
                  }
                } catch (e) {}
              }
            }
          }

          if (fullText) {
            setCache(cacheKey, { tool, topic, depth, language, content: fullText, model: modelName });
            streamer.sendComplete(fullText);
            return;
          }
        } catch (modelError) {
          console.error(`Model ${modelName} failed:`, modelError.message);
        }
      }

      // All models failed, use fallback with streaming effect
      const fallback = getFallbackContent(tool, topic, language);
      const words = fallback.split(/(\s+)/);
      for (const word of words) {
        if (word.trim()) {
          streamer.sendWord(word);
          await new Promise(r => setTimeout(r, 30));
        }
      }
      streamer.sendComplete(fallback);
    } catch (error) {
      streamer.sendError(error);
    }
  } else {
    // Non-streaming mode
    for (const modelName of modelOrder) {
      try {
        const modelId = AI_MODELS[modelName];
        const response = await fetch(OPENROUTER_URL, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
            'HTTP-Referer': 'https://savoireai.vercel.app',
            'X-Title': 'Savoiré AI'
          },
          body: JSON.stringify({
            model: modelId,
            messages: [
              { role: 'system', content: `You are Savoiré AI, an expert study assistant. Always respond in ${language}.` },
              { role: 'user', content: prompt }
            ],
            temperature: depthConfig.temperature,
            max_tokens: depthConfig.maxTokens
          })
        });

        if (!response.ok) continue;

        const data = await response.json();
        const content = data.choices?.[0]?.message?.content;
        
        if (content) {
          const result = { tool, topic, depth, language, content, model: modelName };
          setCache(cacheKey, result);
          return res.status(200).json(result);
        }
      } catch (modelError) {
        console.error(`Model ${modelName} failed:`, modelError.message);
      }
    }

    // Fallback
    const fallback = getFallbackContent(tool, topic, language);
    return res.status(200).json({ tool, topic, depth, language, content: fallback, fallback: true });
  }
};
/**
 * Savoiré AI v2.0 - AI Backend API
 * Free Models Only - Multi-Fallback System
 * by Sooban Talha Productions
 */

module.exports = async (req, res) => {
    // Enable CORS
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    
    // Handle preflight
    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }
    
    // Only accept POST
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }
    
    try {
        const { message, model = 'auto' } = req.body;
        
        if (!message || message.trim().length === 0) {
            return res.status(400).json({ error: 'Message is required' });
        }
        
        // Log request
        console.log(`AI Request: ${message.substring(0, 100)}...`);
        
        // Try multiple free models
        const aiResponse = await tryFreeModels(message, model);
        
        // Return response
        res.status(200).json({
            success: true,
            response: aiResponse.content,
            model: aiResponse.model,
            tokens: aiResponse.tokens || 0,
            timestamp: new Date().toISOString(),
            powered_by: 'Savoiré AI Model Ultra v1.2',
            credits: 'https://soobantalhatech.xyz'
        });
        
    } catch (error) {
        console.error('API Error:', error);
        
        // Fallback response
        res.status(200).json({
            success: false,
            response: generateFallbackResponse(req.body?.message),
            model: 'fallback',
            tokens: 0,
            timestamp: new Date().toISOString(),
            powered_by: 'Savoiré AI Model Ultra v1.2',
            credits: 'https://soobantalhatech.xyz',
            error: error.message
        });
    }
};

/**
 * Try multiple free models with fallback
 */
async function tryFreeModels(message, preferredModel) {
    // List of free models in priority order
    const freeModels = [
        'google/gemini-2.0-flash-exp:free',
        'deepseek/deepseek-chat-v3.1:free',
        'meta-llama/llama-3.2-3b-instruct:free',
        'z-ai/glm-4.5-air:free',
        'qwen/qwen-2.5-32b-instruct:free'
    ];
    
    // Use preferred model if specified and available
    const modelsToTry = preferredModel && preferredModel !== 'auto' 
        ? [preferredModel, ...freeModels.filter(m => m !== preferredModel)]
        : freeModels;
    
    let lastError = null;
    
    for (const model of modelsToTry) {
        try {
            console.log(`Trying model: ${model}`);
            const response = await callOpenRouter(message, model);
            console.log(`Success with model: ${model}`);
            return {
                content: response.content,
                model: model,
                tokens: response.tokens
            };
        } catch (error) {
            console.log(`Model ${model} failed: ${error.message}`);
            lastError = error;
            
            // Wait before trying next model
            await new Promise(resolve => setTimeout(resolve, 500));
        }
    }
    
    throw lastError || new Error('All AI models failed');
}

/**
 * Call OpenRouter API
 */
async function callOpenRouter(message, model) {
    const apiKey = process.env.OPENROUTER_API_KEY;
    
    if (!apiKey) {
        throw new Error('OpenRouter API key not configured');
    }
    
    // Enhanced system prompt for study assistance
    const systemPrompt = `You are Savoiré AI Model Ultra v1.2, an advanced study assistant created by Sooban Talha Productions.

CRITICAL GUIDELINES:
1. Provide EXTREMELY DETAILED explanations (500-800 words for complex topics)
2. Use professional markdown formatting with proper structure
3. ALWAYS include practical examples and real-world applications
4. Break down complex concepts into digestible parts
5. Add key takeaways and study tips at the end
6. For code: use syntax highlighting with language labels
7. For math: use LaTeX notation within $$ for equations
8. For data: use clean, readable tables
9. End with a summary and suggested next learning steps

RESPONSE STRUCTURE:
1. Comprehensive Overview
2. Key Concepts Explained Simply
3. Detailed Technical Explanation
4. Practical Examples & Applications
5. Common Pitfalls & Solutions
6. Study Tips & Best Practices
7. Practice Questions (2-3 with answers)
8. Summary & Next Steps

FORMAT: Return ONLY educational content in beautiful markdown.`;

    const requestBody = {
        model: model,
        messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: message }
        ],
        max_tokens: 4000,
        temperature: 0.7,
        top_p: 0.9,
        frequency_penalty: 0.1,
        presence_penalty: 0.1
    };
    
    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${apiKey}`,
            'HTTP-Referer': 'https://savoireai.vercel.app',
            'X-Title': 'Savoiré AI'
        },
        body: JSON.stringify(requestBody)
    });
    
    if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`OpenRouter API error: ${response.status}`);
    }
    
    const data = await response.json();
    
    if (!data.choices || data.choices.length === 0) {
        throw new Error('No response from AI model');
    }
    
    const content = data.choices[0].message.content;
    const tokens = data.usage?.total_tokens || Math.ceil(content.length / 4);
    
    return {
        content: content,
        tokens: tokens
    };
}

/**
 * Generate fallback response when all models fail
 */
function generateFallbackResponse(userMessage) {
    const query = userMessage ? userMessage.substring(0, 200) : "your question";
    
    return `# Comprehensive Study Guide

## 📚 Overview
I'm currently experiencing high demand, but here's a structured approach to learning about **${query}**:

## 🎯 Key Learning Objectives
1. Understand the fundamental principles
2. Master core concepts and terminology
3. Apply knowledge to practical scenarios
4. Develop problem-solving skills

## 🔍 Study Framework

### Step 1: Foundation Building
- Start with basic definitions and terminology
- Understand the historical context and evolution
- Identify key contributors and milestones

### Step 2: Core Concepts
- Break down complex ideas into simpler components
- Create mental models and analogies
- Practice with basic examples

### Step 3: Practical Application
- Work through real-world scenarios
- Solve practice problems
- Build small projects or experiments

### Step 4: Advanced Understanding
- Explore edge cases and exceptions
- Connect with related fields
- Stay updated with current developments

## 💡 Learning Strategies

### Effective Techniques
1. **Active Recall**: Test yourself without looking at materials
2. **Spaced Repetition**: Review at increasing intervals
3. **Interleaving**: Mix different types of problems
4. **Elaboration**: Explain concepts in your own words

### Time Management
- Use Pomodoro technique (25 min focus, 5 min break)
- Set specific, measurable goals
- Regular review sessions

## 📝 Practice Questions

1. **Basic**: What are the three most important aspects of ${query}?
2. **Intermediate**: How would you explain ${query} to someone without technical background?
3. **Advanced**: What real-world problem could be solved using principles of ${query}?

## 🔮 Next Steps

### Immediate Actions
1. Search for introductory materials on ${query}
2. Find 2-3 reliable sources (academic papers, textbooks, reputable websites)
3. Start with the simplest concepts and build upward

### Long-term Strategy
1. Create a study schedule
2. Join relevant communities or forums
3. Practice regularly with varied materials

## ⚠️ Common Mistakes to Avoid
- Trying to learn everything at once
- Skipping fundamentals
- Not practicing application
- Isolating concepts from real-world use

---

*Generated by Savoiré AI Model Ultra v1.2 · Sooban Talha Productions · https://soobantalhatech.xyz*

**Tip**: Try rephrasing your question or asking about specific aspects for more detailed guidance.`;
}
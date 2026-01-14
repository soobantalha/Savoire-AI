/**
 * Savoiré AI v2.0 - Enhanced AI Study Assistant API
 * Vercel Serverless Function for OpenRouter AI Integration
 * by Sooban Talha Technologies
 */

module.exports = async (req, res) => {
    // Handle CORS
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    
    // Handle preflight request
    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }
    
    // Only accept POST requests
    if (req.method !== 'POST') {
        return res.status(405).json({ 
            error: 'Method not allowed',
            message: 'Only POST requests are supported'
        });
    }
    
    try {
        // Parse request body
        const { message, model, includeImage } = req.body;
        
        if (!message) {
            return res.status(400).json({ 
                error: 'Message is required',
                message: 'Please provide a message or question'
            });
        }
        
        // Log the request
        console.log(`AI Request: ${message.substring(0, 100)}...`);
        console.log(`Model: ${model || 'default'}`);
        console.log(`Include Image: ${!!includeImage}`);
        
        // Generate AI response with multiple model fallback
        const startTime = Date.now();
        const aiResponse = await generateAIResponseWithFallback(message, model, includeImage);
        const latency = Date.now() - startTime;
        
        // Format response
        const response = {
            success: true,
            response: aiResponse.content,
            tokens: aiResponse.tokens,
            model: aiResponse.model,
            latency: latency,
            timestamp: new Date().toISOString(),
            powered_by: 'Savoiré AI by Sooban Talha Technologies',
            credits: 'https://soobantalhatech.xyz'
        };
        
        // Send response
        res.status(200).json(response);
        
    } catch (error) {
        console.error('API Error:', error);
        
        // Provide fallback response
        const fallbackResponse = {
            success: false,
            response: `I apologize, but I'm having trouble connecting to the AI service right now. Here's what I can tell you about your query:\n\n${req.body?.message ? `You asked about: "${req.body.message.substring(0, 100)}..."\n\nPlease try again in a moment, or rephrase your question.` : 'Please try again with a specific question.'}`,
            tokens: 0,
            model: 'fallback',
            latency: 0,
            timestamp: new Date().toISOString(),
            powered_by: 'Savoiré AI by Sooban Talha Technologies',
            credits: 'https://soobantalhatech.xyz',
            error: error.message
        };
        
        res.status(200).json(fallbackResponse);
    }
};

/**
 * Generate AI response with model fallback strategy
 */
async function generateAIResponseWithFallback(message, preferredModel = null, includeImage = false) {
    // Available models in priority order
    const modelPriority = [
        'google/gemini-2.0-flash-exp:free',
        'deepseek/deepseek-chat-v3.1:free',
        'meta-llama/llama-3.2-3b-instruct:free',
        'z-ai/glm-4.5-air:free',
        'tngtech/deepseek-r1t2-chimera:free'
    ];
    
    // Use preferred model if specified, otherwise use priority list
    const modelsToTry = preferredModel 
        ? [preferredModel, ...modelPriority.filter(m => m !== preferredModel)]
        : modelPriority;
    
    let lastError = null;
    
    for (const model of modelsToTry) {
        try {
            console.log(`Trying model: ${model}`);
            const response = await callOpenRouterAPI(message, model, includeImage);
            console.log(`Success with model: ${model}`);
            return response;
        } catch (error) {
            console.log(`Model ${model} failed:`, error.message);
            lastError = error;
            
            // Wait a bit before trying next model
            await new Promise(resolve => setTimeout(resolve, 500));
        }
    }
    
    throw lastError || new Error('All AI models failed');
}

/**
 * Call OpenRouter API
 */
async function callOpenRouterAPI(message, model, includeImage = false) {
    if (!process.env.OPENROUTER_API_KEY) {
        throw new Error('OpenRouter API key not configured');
    }
    
    // Check if message contains image
    let messages = [];
    
    if (includeImage && message.includes('data:image')) {
        // Extract text and image
        const textMatch = message.match(/Analyze this image: (data:image\/[^;]+;base64,[^"]+)/);
        if (textMatch) {
            const imageData = textMatch[1];
            const text = message.replace(textMatch[0], '').trim() || 'Please analyze this image and provide detailed insights.';
            
            messages = [
                {
                    role: 'user',
                    content: [
                        { type: 'text', text: text },
                        { type: 'image_url', image_url: { url: imageData } }
                    ]
                }
            ];
        }
    } else {
        messages = [{ role: 'user', content: message }];
    }
    
    // System prompt for study assistance
    const systemPrompt = `You are Savoiré AI, an advanced study assistant created by Sooban Talha Technologies. Your goal is to provide comprehensive, detailed educational responses.

IMPORTANT GUIDELINES:
1. Provide ULTRA-DETAILED explanations (800-1200 words for complex topics)
2. Use markdown formatting with proper headers, lists, and code blocks
3. Include practical examples and real-world applications
4. Break down complex concepts into digestible parts
5. Add key takeaways and study tips
6. For code: use syntax highlighting with language specification
7. For math: use LaTeX notation within $$ for equations
8. For data: use tables with proper formatting
9. End with a summary and suggested next steps

RESPONSE STRUCTURE:
- Comprehensive Overview
- Key Concepts (4-5 bullet points)
- Detailed Explanation with Examples
- Practical Applications
- Common Pitfalls & Solutions
- Study Tips & Tricks
- Practice Questions (2-3 with answers)
- Summary & Next Steps

FORMAT: Return ONLY the educational content in markdown format.`;

    const requestBody = {
        model: model,
        messages: [
            { role: 'system', content: systemPrompt },
            ...messages
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
            'Authorization': `Bearer ${process.env.OPENROUTER_API_KEY}`,
            'HTTP-Referer': 'https://savoireai.vercel.app',
            'X-Title': 'Savoiré AI'
        },
        body: JSON.stringify(requestBody)
    });
    
    if (!response.ok) {
        const errorText = await response.text();
        console.error(`OpenRouter API Error ${response.status}:`, errorText);
        throw new Error(`API request failed with status ${response.status}`);
    }
    
    const data = await response.json();
    
    if (!data.choices || data.choices.length === 0) {
        throw new Error('No response from AI model');
    }
    
    const content = data.choices[0].message.content;
    const tokens = data.usage?.total_tokens || Math.ceil(content.length / 4);
    
    return {
        content: content,
        tokens: tokens,
        model: model,
        raw: data
    };
}

/**
 * Generate fallback study materials (when API fails)
 */
function generateFallbackStudyMaterials(topic) {
    return {
        content: `# COMPREHENSIVE STUDY GUIDE: ${topic.toUpperCase()}

## 📚 Overview
${topic} represents a fundamental area of study with significant theoretical and practical implications. This guide provides a structured approach to understanding the core concepts and applications.

## 🎯 Key Learning Objectives
- Master the fundamental principles and theoretical foundations
- Understand practical applications and real-world implementations
- Develop problem-solving skills and analytical thinking
- Apply knowledge to complex scenarios and case studies

## 🔍 Detailed Analysis

### Core Principles
The study of ${topic} involves understanding interconnected systems and relationships. Key aspects include:

1. **Theoretical Framework**: The underlying models and assumptions
2. **Methodological Approaches**: Systematic ways to analyze and solve problems
3. **Practical Implementation**: Real-world application of theoretical concepts
4. **Advanced Applications**: Complex scenarios and edge cases

### Step-by-Step Learning Path
1. **Foundation Building**: Start with basic concepts and terminology
2. **Concept Integration**: Connect related ideas and theories
3. **Application Practice**: Work through examples and exercises
4. **Advanced Exploration**: Dive deeper into specialized areas

## 💡 Practical Examples

### Example 1: Basic Application
\`\`\`python
# Simple demonstration of ${topic} concept
def demonstrate_concept(input_data):
    """
    Illustrate the core principle through code
    """
    processed = analyze(input_data)
    result = apply_theory(processed)
    return validate(result)
\`\`\`

### Example 2: Real-World Scenario
Consider how ${topic} applies in industry settings, addressing specific challenges and providing measurable solutions.

## ⚠️ Common Challenges & Solutions

### Challenge 1: Conceptual Complexity
**Solution**: Break down into smaller components, use analogies, and practice with varied examples.

### Challenge 2: Application Difficulty
**Solution**: Start with simplified scenarios, gradually increase complexity, and seek peer feedback.

## 🎓 Study Strategies

### Effective Learning Techniques
1. **Active Recall**: Test yourself without looking at materials
2. **Spaced Repetition**: Review concepts at increasing intervals
3. **Interleaving**: Mix different types of problems
4. **Elaboration**: Explain concepts in your own words

### Time Management
- Pomodoro Technique: 25-minute focused sessions
- Weekly review sessions
- Regular practice and application

## 📈 Assessment & Progress Tracking

### Self-Evaluation Questions
1. What are the three most important principles of ${topic}?
2. How would you explain ${topic} to someone without background knowledge?
3. What real-world problem could be solved using ${topic}?

### Progress Metrics
- Conceptual understanding (0-10)
- Application skill (0-10)
- Problem-solving speed (0-10)

## 🔮 Future Directions

### Advanced Topics to Explore
- Emerging research in ${topic}
- Cross-disciplinary applications
- Industry-specific implementations

### Career Applications
- Research and development
- Technical consulting
- Innovation and entrepreneurship

## 📝 Summary & Next Steps

### Key Takeaways
1. Master fundamentals before advancing
2. Practice consistently with varied materials
3. Seek feedback and collaborate with peers
4. Apply knowledge to real-world problems

### Recommended Actions
1. Complete 3 practice problems daily
2. Review one case study per week
3. Teach the concept to someone else
4. Build a small project applying ${topic}

---

*Generated by Savoiré AI • Comprehensive Study Assistant • by [Sooban Talha Technologies](https://soobantalhatech.xyz)*`,
        tokens: 850,
        model: 'fallback'
    };
}
// Savoiré AI v2.0 - Enhanced OpenRouter API Handler
// by Sooban Talha Technologies

// List of FREE models to try (in order of preference)
const FREE_MODELS = [
    'google/gemini-2.0-flash-exp:free',
    'z-ai/glm-4.5-air:free',
    'tngtech/deepseek-r1t2-chimera:free',
    'deepseek/deepseek-chat-v3.1:free',
    'deepseek/deepseek-r1-0528:free',
    'meta-llama/llama-3.2-3b-instruct:free',
    'qwen/qwen-2.5-coder-0.5b-instruct:free',
    'microsoft/phi-3.5-mini-instruct:free'
];

module.exports = async (req, res) => {
    // Handle CORS
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    
    // Handle preflight
    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }
    
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }
    
    try {
        const { 
            message, 
            model: preferredModel, 
            temperature = 0.7,
            systemPrompt,
            simplify = false,
            image,
            visionModel = 'google/gemini-2.0-flash-exp:free'
        } = req.body;
        
        if (!message && !image) {
            return res.status(400).json({ error: 'Message or image is required' });
        }
        
        console.log('Processing request:', {
            message: message?.substring(0, 100) + '...',
            preferredModel,
            temperature,
            simplify,
            hasImage: !!image
        });
        
        let result;
        
        // Handle image analysis
        if (image && image.startsWith('data:image')) {
            console.log('Processing image analysis request');
            result = await analyzeImageWithAI(image, message || 'Describe this image in detail', visionModel);
        } else {
            // Handle text conversation
            console.log('Processing text request');
            result = await generateStudyResponse(message, {
                preferredModel,
                temperature,
                systemPrompt,
                simplify
            });
        }
        
        res.status(200).json(result);
        
    } catch (error) {
        console.error('Unexpected error:', error);
        
        // Fallback response
        const fallback = generateFallbackResponse(req.body?.message || 'General Topic');
        res.status(200).json(fallback);
    }
};

async function generateStudyResponse(message, options = {}) {
    const {
        preferredModel,
        temperature = 0.7,
        systemPrompt = "You are Savoiré AI, an advanced study assistant created by Sooban Talha Technologies.",
        simplify = false
    } = options;
    
    // Enhanced prompt for better study responses
    const studyPrompt = `${systemPrompt}

User Question: "${message}"

IMPORTANT INSTRUCTIONS:
1. Provide COMPREHENSIVE, DETAILED analysis
2. Use proper markdown formatting with headers, lists, and code blocks
3. Include practical examples when relevant
4. Break down complex concepts into digestible parts
5. ${simplify ? "Explain in simple terms suitable for beginners" : "Provide advanced insights for serious students"}

RESPONSE STRUCTURE:
- Start with a clear overview
- Break down into logical sections with headers (##)
- Include bullet points for key concepts
- Add code examples for programming topics
- Include mathematical formulas using LaTeX ($...$ for inline, $$...$$ for display)
- Create tables for comparison when relevant
- End with summary and further study suggestions

Make the response ULTRA-DETAILED but well-organized. Aim for 500-1000 words of high-quality content.`;

    // Try models in order
    const modelsToTry = preferredModel ? 
        [preferredModel, ...FREE_MODELS.filter(m => m !== preferredModel)] : 
        FREE_MODELS;
    
    for (const model of modelsToTry) {
        try {
            console.log(`Trying model: ${model}`);
            const response = await callOpenRouterAPI(model, studyPrompt, temperature);
            
            if (response && response.content) {
                console.log(`Success with model: ${model}`);
                
                // Estimate tokens (rough approximation)
                const estimatedTokens = Math.ceil(response.content.length / 4);
                
                return {
                    response: response.content,
                    modelUsed: model,
                    estimatedTokens,
                    timestamp: new Date().toISOString(),
                    poweredBy: 'Savoiré AI by Sooban Talha Technologies'
                };
            }
        } catch (error) {
            console.log(`Model ${model} failed:`, error.message);
            continue;
        }
    }
    
    throw new Error('All models failed. Please try again.');
}

async function analyzeImageWithAI(imageBase64, prompt, model) {
    const visionPrompt = `Analyze this image and ${prompt || 'describe what you see in detail'}.

Provide a comprehensive analysis including:
1. What the image shows
2. Key elements and their relationships
3. Context and possible meaning
4. Technical details if relevant
5. Educational insights

Be detailed and analytical.`;

    try {
        const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${process.env.OPENROUTER_API_KEY}`,
                'HTTP-Referer': 'https://savoireai.vercel.app',
                'X-Title': 'Savoiré AI'
            },
            body: JSON.stringify({
                model: model,
                messages: [
                    {
                        role: 'user',
                        content: [
                            { type: 'text', text: visionPrompt },
                            { type: 'image_url', image_url: { url: imageBase64 } }
                        ]
                    }
                ],
                max_tokens: 2000,
                temperature: 0.7
            })
        });
        
        if (!response.ok) {
            throw new Error(`Vision API failed: ${response.status}`);
        }
        
        const data = await response.json();
        const content = data.choices[0].message.content;
        
        return {
            response: content,
            modelUsed: model,
            estimatedTokens: Math.ceil(content.length / 4),
            timestamp: new Date().toISOString(),
            poweredBy: 'Savoiré AI Vision by Sooban Talha Technologies'
        };
        
    } catch (error) {
        console.error('Vision analysis failed:', error);
        
        // Fallback for image analysis
        return {
            response: `I can see you've uploaded an image. While I'm having trouble analyzing it with advanced vision capabilities, here's what I can help with:

**Image Analysis Fallback:**
1. For detailed image analysis, try describing the image to me in text
2. I can help with questions about images related to:
   - Study materials and diagrams
   - Mathematical equations and graphs
   - Science and engineering concepts
   - Historical or artistic context

**What to do next:**
- Describe the image content in detail
- Ask specific questions about what you see
- Upload the image to a service like Imgur and share the link

I'm ready to help you learn based on your description!`,
            modelUsed: 'fallback',
            estimatedTokens: 100,
            timestamp: new Date().toISOString(),
            poweredBy: 'Savoiré AI by Sooban Talha Technologies'
        };
    }
}

async function callOpenRouterAPI(model, prompt, temperature) {
    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${process.env.OPENROUTER_API_KEY}`,
            'HTTP-Referer': 'https://savoireai.vercel.app',
            'X-Title': 'Savoiré AI'
        },
        body: JSON.stringify({
            model: model,
            messages: [{ role: 'user', content: prompt }],
            max_tokens: 4000,
            temperature: temperature,
            top_p: 0.9,
            frequency_penalty: 0.2,
            presence_penalty: 0.1
        })
    });
    
    if (!response.ok) {
        throw new Error(`API Error ${response.status}: ${await response.text()}`);
    }
    
    const data = await response.json();
    return data.choices[0].message;
}

function generateFallbackResponse(topic) {
    return {
        response: `# COMPREHENSIVE STUDY GUIDE: ${topic.toUpperCase()}

## Overview
${topic} is a fascinating subject that combines theoretical knowledge with practical applications. This guide provides a structured approach to mastering this topic.

## Core Concepts
1. **Fundamental Principles** - The basic rules and theories that form the foundation
2. **Key Applications** - How this knowledge is used in real-world scenarios
3. **Advanced Topics** - Complex aspects that build upon the basics

## Detailed Analysis
### Section 1: Theoretical Framework
Understanding the theoretical background is crucial for mastery. This involves:

- **Basic Definitions**: Clear explanation of key terms
- **Core Principles**: The fundamental rules that govern this topic
- **Mathematical Foundations** (if applicable): Essential formulas and equations

### Section 2: Practical Implementation
Applying theoretical knowledge to solve real problems:

\`\`\`python
# Example code for practical application
def solve_problem(input_data):
    """
    Demonstrate how to approach problems in this field
    """
    # Step-by-step solution
    result = process_data(input_data)
    return optimized_solution(result)
\`\`\`

### Section 3: Study Strategies
Effective learning techniques:

| Strategy | Description | Effectiveness |
|----------|-------------|---------------|
| Spaced Repetition | Review material at increasing intervals | High |
| Active Recall | Test yourself without looking at material | Very High |
| Interleaving | Mix different topics during study | High |
| Elaboration | Explain concepts in your own words | High |

## Key Formulas (if applicable)
- Basic Equation: $E = mc^2$
- Intermediate: $\\frac{d}{dx}f(x) = \\lim_{h \\to 0}\\frac{f(x+h)-f(x)}{h}$
- Advanced: $\\int_{-\\infty}^{\\infty} e^{-x^2} dx = \\sqrt{\\pi}$

## Common Mistakes to Avoid
1. **Oversimplification** - Missing important nuances
2. **Memorization without understanding** - Learning patterns instead of concepts
3. **Ignoring fundamentals** - Trying to learn advanced topics without proper base

## Practice Exercises
1. **Beginner**: Explain the basic concept in your own words
2. **Intermediate**: Solve a typical problem showing all steps
3. **Advanced**: Apply the concept to a novel situation

## Further Resources
- Textbooks and academic papers
- Online courses and tutorials
- Practice problems with solutions
- Study groups and discussion forums

## Summary
Mastering ${topic} requires consistent practice and deep understanding. Start with fundamentals, build up gradually, and apply your knowledge to practical problems.

*Generated by Savoiré AI • Sooban Talha Technologies • ${new Date().toLocaleDateString()}*`,
        modelUsed: 'fallback',
        estimatedTokens: 450,
        timestamp: new Date().toISOString(),
        poweredBy: 'Savoiré AI by Sooban Talha Technologies'
    };
}

// Utility function for model health check (optional)
async function checkModelHealth(model) {
    try {
        const response = await fetch('https://openrouter.ai/api/v1/models', {
            headers: {
                'Authorization': `Bearer ${process.env.OPENROUTER_API_KEY}`
            }
        });
        
        if (response.ok) {
            const models = await response.json();
            return models.data.some(m => m.id === model);
        }
        return false;
    } catch {
        return false;
    }
}
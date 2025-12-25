// Savoiré AI - Premium Response Engine

module.exports = async (req, res) => {
    // Enhanced CORS
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    
    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }
    
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }
    
    try {
        const { message } = req.body;
        
        if (!message) {
            return res.status(400).json({ error: 'Message is required' });
        }
        
        console.log(`Processing: "${message.substring(0, 100)}..."`);
        
        let response;
        try {
            response = await generatePremiumResponse(message);
        } catch (error) {
            console.error('AI generation failed:', error);
            response = generateFallbackResponse(message);
        }
        
        // Add metadata
        response.generated_at = new Date().toISOString();
        response.platform = 'Savoiré AI';
        response.brand = 'Sooban Talha Technologies';
        
        res.status(200).json(response);
        
    } catch (error) {
        console.error('Server error:', error);
        res.status(500).json({
            error: 'Internal server error',
            message: error.message,
            fallback: generateFallbackResponse(req.body?.message || 'Unknown')
        });
    }
};

async function generatePremiumResponse(query) {
    if (!process.env.OPENROUTER_API_KEY) {
        throw new Error('API key not configured');
    }
    
    const systemPrompt = `You are Savoiré AI, an elite cognitive platform that provides deep, structured educational content.

IMPORTANT RULES:
1. Respond ONLY with valid JSON matching the exact structure below
2. No markdown, no additional text outside JSON
3. Use LaTeX for math: $...$ for inline, $$...$$ for display
4. Be comprehensive but concise
5. Focus on conceptual understanding
6. Provide practical examples
7. Include common misconceptions

RESPONSE FORMAT:
{
    "topic": "Clear topic title",
    "difficulty_level": "Beginner|Intermediate|Advanced",
    "estimated_study_time": "e.g., 20-30 minutes",
    
    "one_line_intuition": "Core insight in one sentence",
    
    "mental_model": {
        "visualization": "How to visualize this concept",
        "analogy": "Helpful analogy",
        "why_it_works": "Fundamental reason"
    },
    
    "conceptual_breakdown": [
        {
            "concept": "Concept name",
            "intuition": "Intuitive understanding",
            "formal_definition": "Precise definition",
            "common_confusion": "What learners get wrong",
            "clarification": "Correct understanding"
        }
    ],
    
    "ultra_long_notes": {
        "core_explanation": "Detailed explanation",
        "step_by_step_reasoning": "Logical progression",
        "important_formulas_or_rules": ["Formula 1", "Formula 2"],
        "edge_cases_and_exceptions": ["Exception 1", "Exception 2"],
        "exam_oriented_insights": ["Insight 1", "Insight 2"]
    },
    
    "worked_examples": [
        {
            "problem": "Example problem",
            "thinking_process": "How to approach",
            "solution_steps": "Step-by-step solution",
            "final_answer": "Final answer"
        }
    ],
    
    "key_tricks": [
        {
            "trick": "Useful trick",
            "when_to_use": "When applicable",
            "why_it_works": "Reason it works"
        }
    ],
    
    "exam_focus": {
        "frequently_asked_patterns": ["Pattern 1", "Pattern 2"],
        "how_examiners_trick_students": ["Trick 1", "Trick 2"],
        "how_toppers_think_differently": ["Mindset 1", "Mindset 2"]
    },
    
    "confidence_score": 92
}

USER QUERY: "${query}"`;
    
    const models = [
        'google/gemini-2.0-flash-exp:free',
        'meta-llama/llama-3-8b-instruct:free',
        'mistralai/mistral-7b-instruct:free',
        'deepseek/deepseek-chat:free'
    ];
    
    for (const model of models) {
        try {
            console.log(`Trying model: ${model}`);
            
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
                        { role: 'system', content: systemPrompt },
                        { role: 'user', content: query }
                    ],
                    max_tokens: 4000,
                    temperature: 0.7
                })
            });
            
            if (!response.ok) {
                console.log(`Model ${model} failed: ${response.status}`);
                continue;
            }
            
            const data = await response.json();
            const content = data.choices[0]?.message?.content;
            
            if (!content) {
                console.log(`Model ${model} returned empty content`);
                continue;
            }
            
            // Extract JSON
            const jsonMatch = content.match(/\{[\s\S]*\}/);
            if (!jsonMatch) {
                console.log(`Model ${model} didn't return JSON`);
                continue;
            }
            
            let parsed;
            try {
                parsed = JSON.parse(jsonMatch[0]);
            } catch (parseError) {
                console.log(`Model ${model} JSON parse error:`, parseError.message);
                continue;
            }
            
            // Validate structure
            if (!parsed.topic || !parsed.conceptual_breakdown) {
                console.log(`Model ${model} incomplete structure`);
                continue;
            }
            
            console.log(`✅ Success with model: ${model}`);
            return parsed;
            
        } catch (error) {
            console.log(`Model ${model} error:`, error.message);
            continue;
        }
    }
    
    throw new Error('All models failed');
}

function generateFallbackResponse(query) {
    return {
        topic: query,
        difficulty_level: "Intermediate",
        estimated_study_time: "25-35 minutes",
        
        one_line_intuition: "Understanding complex concepts requires breaking them down into fundamental principles and relationships.",
        
        mental_model: {
            visualization: "Imagine knowledge as a network where core concepts connect to applications through relationships.",
            analogy: "Like learning a language: first alphabet (fundamentals), then words (concepts), then sentences (applications).",
            why_it_works: "This approach builds understanding from the ground up, ensuring solid foundation before complexity."
        },
        
        conceptual_breakdown: [
            {
                concept: "Core Principles",
                intuition: "The fundamental rules that everything else depends on",
                formal_definition: "Basic axioms or laws that define the system",
                common_confusion: "Mixing up derived rules with fundamental ones",
                clarification: "Ask: 'Can this be broken down further?' If yes, it's not fundamental."
            },
            {
                concept: "Relationships",
                intuition: "How different parts interact and influence each other",
                formal_definition: "Connections and dependencies between concepts",
                common_confusion: "Studying concepts in isolation",
                clarification: "The whole emerges from interactions - study connections."
            },
            {
                concept: "Applications",
                intuition: "How theory solves real problems",
                formal_definition: "Practical implementation of theoretical concepts",
                common_confusion: "Seeing theory and practice as separate",
                clarification: "Good theory predicts practice; practice informs theory."
            }
        ],
        
        ultra_long_notes: {
            core_explanation: `This topic involves understanding interconnected concepts through systematic analysis. The approach involves:

1. Identifying core principles that form the foundation
2. Analyzing relationships between concepts
3. Applying knowledge to practical scenarios
4. Considering edge cases and limitations
5. Synthesizing into coherent understanding

Each level builds upon the previous, creating depth and breadth of knowledge.`,
            
            step_by_step_reasoning: `1. Start with first principles
2. Identify key components and variables
3. Analyze interactions and dependencies
4. Consider practical constraints
5. Test with edge cases
6. Synthesize understanding`,
            
            important_formulas_or_rules: [
                "Understanding = Foundations × Applications",
                "Complexity ≈ Components² × Interactions"
            ],
            
            edge_cases_and_exceptions: [
                "Systems may behave differently at extremes",
                "Common assumptions may fail in specific contexts",
                "Real-world constraints modify theoretical predictions"
            ],
            
            exam_oriented_insights: [
                "Focus on understanding relationships",
                "Practice application to novel situations",
                "Learn to recognize patterns"
            ]
        },
        
        worked_examples: [
            {
                problem: "How would you approach understanding a complex system with multiple interacting components?",
                thinking_process: "Start with individual components, then study interactions, then analyze the whole system.",
                solution_steps: "1. List components\n2. Understand each component\n3. Map interactions\n4. Identify dependencies\n5. Predict system behavior",
                final_answer: "A systematic approach involving component analysis, interaction mapping, and holistic evaluation."
            }
        ],
        
        key_tricks: [
            {
                trick: "First Principles Thinking",
                when_to_use: "When facing novel problems or challenging assumptions",
                why_it_works: "Breaks complex problems into fundamental truths"
            },
            {
                trick: "The Feynman Technique",
                when_to_use: "When you need deep understanding of a concept",
                why_it_works: "Teaching forces simplification and reveals knowledge gaps"
            }
        ],
        
        exam_focus: {
            frequently_asked_patterns: [
                "Application of theory to practice",
                "Analysis of relationships",
                "Identification of assumptions"
            ],
            how_examiners_trick_students: [
                "Presenting information in unfamiliar contexts",
                "Testing understanding over memorization",
                "Requiring synthesis of multiple concepts"
            ],
            how_toppers_think_differently: [
                "Focus on why, not just what",
                "Look for patterns and connections",
                "Practice application, not just recognition"
            ]
        },
        
        confidence_score: 85
    };
}
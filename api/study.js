// SAVOIRÉ AI - ELITE COGNITIVE ENGINE
// Ultra-Advanced Study Material Generation with Socratic Tutoring

module.exports = async (req, res) => {
    // Enhanced CORS headers
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS, GET');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    res.setHeader('Access-Control-Max-Age', '86400');

    // Handle preflight
    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    if (req.method !== 'POST') {
        return res.status(405).json({ 
            error: 'Method not allowed',
            allowed: ['POST']
        });
    }

    try {
        const { message, mode = 'cognitive', depth = 'elite', include_math = true } = req.body;

        if (!message) {
            return res.status(400).json({ 
                error: 'Message is required',
                example: 'Explain quantum computing with mental models'
            });
        }

        console.log(`🧠 Processing request: "${message.substring(0, 100)}..."`);

        let studyMaterials;
        
        try {
            // Try AI generation first
            studyMaterials = await generateEliteCognitiveResponse(message, mode, depth, include_math);
            
            // Ensure proper JSON structure
            studyMaterials = validateAndEnhanceResponse(studyMaterials, message);
            
        } catch (aiError) {
            console.error('AI generation failed:', aiError);
            
            // Try fallback with different models
            studyMaterials = await tryFallbackGeneration(message);
            
            // If still fails, use comprehensive fallback
            if (!studyMaterials) {
                studyMaterials = generateComprehensiveFallback(message);
            }
        }

        // Add metadata
        studyMaterials.generation_timestamp = new Date().toISOString();
        studyMaterials.generated_by = "Savoiré AI — Elite Cognitive Platform";
        studyMaterials.brand = "Sooban Talha Technologies";
        studyMaterials.website = "https://soobantalhatech.xyz";
        studyMaterials.api_version = "2.0.0";

        res.status(200).json(studyMaterials);

    } catch (error) {
        console.error('Unexpected error:', error);
        
        // Provide helpful error response
        const fallback = generateComprehensiveFallback(req.body?.message || 'General Topic');
        fallback.error_note = `Original error: ${error.message}`;
        
        res.status(200).json(fallback);
    }
};

// ==================== ELITE COGNITIVE GENERATION ====================
async function generateEliteCognitiveResponse(userInput, mode, depth, includeMath) {
    if (!process.env.OPENROUTER_API_KEY) {
        throw new Error('OpenRouter API key not configured');
    }

    const systemPrompt = `You are Savoiré AI, an elite cognitive tutoring platform with Socratic methodology.

CRITICAL INSTRUCTIONS:
1. Respond ONLY with valid JSON matching the exact structure below
2. No markdown, no additional text, no explanations outside JSON
3. Math must be in LaTeX format (use $...$ for inline, $$...$$ for display)
4. Be comprehensive, authoritative, and engaging
5. Focus on conceptual understanding over memorization
6. Provide practical, real-world applications
7. Include common misconceptions and how to avoid them
8. Structure for active learning and retention

USER QUERY: "${userInput}"

RESPONSE FORMAT (JSON ONLY):
{
    "topic": "Clear, concise topic title",
    "difficulty_level": "Beginner | Intermediate | Advanced",
    "estimated_study_time": "e.g., '30-45 minutes'",
    
    "one_line_intuition": "Single sentence that captures the core idea",
    
    "mental_model": {
        "visualization": "How to visualize this concept",
        "analogy": "A powerful analogy that makes it intuitive",
        "why_it_works": "The fundamental reason this concept works"
    },
    
    "conceptual_breakdown": [
        {
            "concept": "Specific concept name",
            "intuition": "Intuitive understanding",
            "formal_definition": "Precise definition",
            "common_confusion": "What students typically get wrong",
            "clarification": "How to think about it correctly"
        }
    ],
    
    "ultra_long_notes": {
        "core_explanation": "Detailed explanation covering fundamentals",
        "step_by_step_reasoning": "Logical progression of understanding",
        "important_formulas_or_rules": "Key formulas with explanations",
        "edge_cases_and_exceptions": "Important exceptions and special cases",
        "exam_oriented_insights": "What examiners look for"
    },
    
    "worked_examples": [
        {
            "problem": "A challenging problem statement",
            "thinking_process": "How to approach this problem",
            "solution_steps": "Step-by-step solution with reasoning",
            "final_answer": "The final answer with proper formatting"
        }
    ],
    
    "key_tricks": [
        {
            "trick": "A useful shortcut or trick",
            "when_to_use": "When this trick is applicable",
            "why_it_works": "Why this trick works mathematically"
        }
    ],
    
    "exam_focus": {
        "frequently_asked_patterns": ["Pattern 1", "Pattern 2", "Pattern 3"],
        "how_examiners_trick_students": ["Common trick 1", "Common trick 2"],
        "how_toppers_think_differently": ["Mindset 1", "Mindset 2", "Mindset 3"]
    },
    
    "interdisciplinary_connections": [
        {
            "field": "Related field",
            "connection": "How this connects to the main topic",
            "why_it_matters": "Why this connection is important"
        }
    ],
    
    "real_world_applications": [
        {
            "application": "Specific real-world application",
            "where_it_is_used": "Where this is applied",
            "impact": "The impact or significance"
        }
    ],
    
    "misconceptions_and_pitfalls": [
        {
            "misconception": "Common wrong belief",
            "why_it_is_wrong": "Why this belief is incorrect",
            "correct_thinking": "The correct way to think"
        }
    ],
    
    "active_recall": {
        "quick_check_questions": ["Question 1", "Question 2", "Question 3"],
        "challenge_question": "A challenging question to test deep understanding"
    },
    
    "memory_anchors": ["Anchor 1", "Anchor 2", "Anchor 3", "Anchor 4"],
    
    "summary_for_revision": {
        "bullet_summary": ["Point 1", "Point 2", "Point 3", "Point 4", "Point 5"],
        "formula_sheet_if_any": ["Formula 1", "Formula 2", "Formula 3"]
    },
    
    "next_level_extensions": ["Extension 1", "Extension 2", "Extension 3"],
    
    "confidence_score": 96
}

IMPORTANT:
- Each section must be filled with high-quality content
- Be specific and detailed, not generic
- Use analogies and visualizations where helpful
- Include mathematical rigor when appropriate
- Make it engaging and thought-provoking
- Aim for depth, not just breadth`;

    // Priority model list (updated for best performance)
    const priorityModels = [
        'meta-llama/llama-3-70b-instruct:free',
        'google/gemini-2.0-flash-exp:free',
        'mistralai/mistral-large',
        'deepseek/deepseek-chat',
        'z-ai/glm-4.5-air:free',
        'tngtech/deepseek-r1t2-chimera:free',
        'qwen/qwen-2.5-32b-instruct:free',
        'meta-llama/llama-3-8b-instruct:free'
    ];

    // Try models in sequence with no timeout
    for (const model of priorityModels) {
        try {
            console.log(`🤖 Trying model: ${model}`);
            
            const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${process.env.OPENROUTER_API_KEY}`,
                    'HTTP-Referer': 'https://savoireai.vercel.app',
                    'X-Title': 'Savoiré AI - Elite Cognitive Platform'
                },
                body: JSON.stringify({
                    model: model,
                    messages: [
                        {
                            role: "system",
                            content: systemPrompt
                        },
                        {
                            role: "user",
                            content: userInput
                        }
                    ],
                    max_tokens: 8000,
                    temperature: 0.7,
                    top_p: 0.9,
                    frequency_penalty: 0.1,
                    presence_penalty: 0.1
                })
            });

            if (!response.ok) {
                console.log(`Model ${model} failed with status: ${response.status}`);
                continue;
            }

            const data = await response.json();
            const content = data.choices[0]?.message?.content;
            
            if (!content) {
                console.log(`Model ${model} returned empty content`);
                continue;
            }

            // Extract JSON from response
            const jsonMatch = content.match(/\{[\s\S]*\}/);
            if (!jsonMatch) {
                console.log(`Model ${model} didn't return valid JSON`);
                continue;
            }

            let studyData;
            try {
                studyData = JSON.parse(jsonMatch[0]);
            } catch (parseError) {
                console.log(`Model ${model} returned invalid JSON:`, parseError.message);
                continue;
            }

            // Validate structure
            if (!studyData.topic || !studyData.conceptual_breakdown) {
                console.log(`Model ${model} returned incomplete structure`);
                continue;
            }

            console.log(`✅ Success with model: ${model}`);
            return studyData;

        } catch (modelError) {
            console.log(`Model ${model} error:`, modelError.message);
            continue;
        }
    }

    throw new Error('All AI models failed to generate response');
}

// ==================== FALLBACK GENERATION ====================
async function tryFallbackGeneration(userInput) {
    // Try simpler models or different approaches
    const fallbackModels = [
        'google/gemini-2.0-flash:free',
        'mistralai/mistral-7b-instruct:free',
        'huggingfaceh4/zephyr-7b-beta:free',
        'microsoft/phi-3-medium-128k-instruct:free'
    ];

    for (const model of fallbackModels) {
        try {
            const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${process.env.OPENROUTER_API_KEY}`,
                    'HTTP-Referer': 'https://savoireai.vercel.app'
                },
                body: JSON.stringify({
                    model: model,
                    messages: [{
                        role: "user",
                        content: `Provide a structured educational analysis of: "${userInput}". Return as JSON with sections: topic, key_concepts, detailed_explanation, examples, applications.`
                    }],
                    max_tokens: 4000,
                    temperature: 0.7
                })
            });

            if (response.ok) {
                const data = await response.json();
                const content = data.choices[0]?.message?.content;
                const jsonMatch = content.match(/\{[\s\S]*\}/);
                
                if (jsonMatch) {
                    return JSON.parse(jsonMatch[0]);
                }
            }
        } catch (error) {
            continue;
        }
    }
    
    return null;
}

// ==================== COMPREHENSIVE FALLBACK ====================
function generateComprehensiveFallback(topic) {
    const now = new Date();
    
    return {
        topic: topic || "Cognitive Analysis",
        difficulty_level: "Intermediate",
        estimated_study_time: "45-60 minutes",
        
        one_line_intuition: "Understanding complex systems requires breaking them down into fundamental components and relationships.",
        
        mental_model: {
            visualization: "Imagine a complex system as a network of interconnected nodes, where understanding flows from core principles outward.",
            analogy: "Like understanding a city by first learning its major landmarks, then streets, then neighborhoods, and finally individual buildings.",
            why_it_works: "This approach works because it builds from foundational concepts to complex applications, ensuring deep understanding."
        },
        
        conceptual_breakdown: [
            {
                concept: "Core Principles",
                intuition: "The fundamental rules that govern the entire system",
                formal_definition: "Basic axioms or laws from which all other concepts derive",
                common_confusion: "Mistaking derived rules for fundamental principles",
                clarification: "Always ask: 'Can this be broken down further?' If yes, it's not fundamental."
            },
            {
                concept: "System Relationships",
                intuition: "How different parts interact and influence each other",
                formal_definition: "The connections and dependencies between system components",
                common_confusion: "Analyzing components in isolation rather than as part of a system",
                clarification: "The whole is greater than the sum of its parts - study interactions."
            },
            {
                concept: "Practical Applications",
                intuition: "How theoretical knowledge solves real problems",
                formal_definition: "The implementation of theoretical concepts in practical scenarios",
                common_confusion: "Treating theory and practice as separate domains",
                clarification: "Good theory predicts practice; good practice informs theory."
            }
        ],
        
        ultra_long_notes: {
            core_explanation: `This topic represents a complex system of interconnected concepts that require systematic analysis. The fundamental approach involves:

1. Identification of core principles that form the foundation
2. Analysis of relationships and dependencies between concepts
3. Application of theoretical knowledge to practical scenarios
4. Evaluation of edge cases and limitations
5. Synthesis of understanding into actionable knowledge

Each layer builds upon the previous, creating a comprehensive understanding that is both deep and wide.`,
            
            step_by_step_reasoning: `1. Start with first principles - what are the undeniable truths?
2. Identify key variables and their relationships
3. Analyze how changes in one area affect others
4. Consider practical constraints and real-world applications
5. Test understanding with edge cases and exceptions
6. Synthesize into a coherent mental model`,
            
            important_formulas_or_rules: [
                "Understanding = Foundations × Applications",
                "Complexity ≈ (Components)² × (Interactions)",
                "Practical Value = Theoretical Depth × Implementation Skill"
            ],
            
            edge_cases_and_exceptions: [
                "Systems may behave differently at extreme values",
                "Assumptions that hold generally may fail in specific contexts",
                "Real-world constraints often modify theoretical predictions"
            ],
            
            exam_oriented_insights: [
                "Focus on understanding relationships, not just memorizing facts",
                "Practice applying concepts to novel situations",
                "Learn to recognize patterns that indicate specific approaches"
            ]
        },
        
        worked_examples: [
            {
                problem: "Given a complex system with multiple interacting components, how would you approach understanding its behavior?",
                thinking_process: "First, identify the core components and their individual behaviors. Then analyze how they interact. Finally, consider the system as a whole.",
                solution_steps: [
                    "Step 1: List all major components",
                    "Step 2: Understand each component's function",
                    "Step 3: Map interactions between components",
                    "Step 4: Identify feedback loops and dependencies",
                    "Step 5: Predict system behavior under different conditions"
                ],
                final_answer: "A systematic approach involving component analysis, interaction mapping, and holistic evaluation provides comprehensive understanding."
            },
            {
                problem: "How would you explain a complex concept to someone with no background in the field?",
                thinking_process: "Use analogies, build from familiar concepts, and focus on intuition before details.",
                solution_steps: [
                    "Step 1: Find a relatable analogy",
                    "Step 2: Start with the core intuition",
                    "Step 3: Build complexity gradually",
                    "Step 4: Use visualizations where helpful",
                    "Step 5: Connect to practical applications"
                ],
                final_answer: "Effective explanation involves analogies, gradual complexity buildup, and practical connections."
            }
        ],
        
        key_tricks: [
            {
                trick: "The Feynman Technique",
                when_to_use: "When you need to deeply understand a complex concept",
                why_it_works: "Teaching forces you to simplify and identify gaps in understanding"
            },
            {
                trick: "First Principles Thinking",
                when_to_use: "When facing novel problems or challenging assumptions",
                why_it_works: "Breaking down to fundamentals avoids incorrect assumptions"
            }
        ],
        
        exam_focus: {
            frequently_asked_patterns: [
                "Application of theory to practical scenarios",
                "Analysis of relationships between concepts",
                "Identification of assumptions and limitations"
            ],
            how_examiners_trick_students: [
                "Presenting information in unfamiliar contexts",
                "Testing understanding rather than memorization",
                "Requiring synthesis of multiple concepts"
            ],
            how_toppers_think_differently: [
                "Focus on understanding why, not just what",
                "Look for patterns and connections",
                "Practice application, not just recognition"
            ]
        },
        
        interdisciplinary_connections: [
            {
                field: "Systems Thinking",
                connection: "Both analyze complex systems and their interactions",
                why_it_matters: "Provides tools for understanding complexity"
            },
            {
                field: "Cognitive Psychology",
                connection: "Understanding how people learn and process complex information",
                why_it_matters: "Improves teaching and learning strategies"
            }
        ],
        
        real_world_applications: [
            {
                application: "Problem Solving in Technology",
                where_it_is_used: "Software engineering, system design, troubleshooting",
                impact: "Enables creation of robust, scalable systems"
            },
            {
                application: "Strategic Decision Making",
                where_it_is_used: "Business strategy, policy development, research planning",
                impact: "Leads to more effective and sustainable decisions"
            }
        ],
        
        misconceptions_and_pitfalls: [
            {
                misconception: "Complexity requires complex solutions",
                why_it_is_wrong: "Often, simple solutions emerge from deep understanding",
                correct_thinking: "Seek simple, elegant solutions that address root causes"
            },
            {
                misconception: "More information equals better understanding",
                why_it_is_wrong: "Understanding requires synthesis, not just accumulation",
                correct_thinking: "Focus on relationships and patterns, not just facts"
            }
        ],
        
        active_recall: {
            quick_check_questions: [
                "What are the core principles of this topic?",
                "How do the main components interact?",
                "What are the most common applications?"
            ],
            challenge_question: "Design a framework for analyzing any complex system based on the principles learned."
        },
        
        memory_anchors: [
            "Foundations first, applications second",
            "Relationships reveal understanding",
            "Simple often beats complex"
        ],
        
        summary_for_revision: {
            bullet_summary: [
                "Start with fundamental principles",
                "Analyze relationships and interactions",
                "Apply to practical scenarios",
                "Watch for edge cases and exceptions",
                "Synthesize into coherent understanding"
            ],
            formula_sheet_if_any: [
                "Understanding = Depth × Breadth",
                "Value = Theory × Implementation",
                "Complexity ∝ (Components) × (Interactions)²"
            ]
        },
        
        next_level_extensions: [
            "Explore advanced systems analysis techniques",
            "Study related fields for cross-pollination of ideas",
            "Apply to increasingly complex real-world problems"
        ],
        
        confidence_score: 85,
        
        // Metadata
        generated_by: "Savoiré AI — Fallback Generation System",
        brand: "Sooban Talha Technologies",
        website: "https://soobantalhatech.xyz",
        generation_timestamp: now.toISOString(),
        note: "This is a comprehensive fallback response. For more detailed, AI-generated analysis, ensure your API key is properly configured."
    };
}

// ==================== RESPONSE VALIDATION ====================
function validateAndEnhanceResponse(response, originalQuery) {
    // Ensure all required fields exist
    const enhanced = {
        topic: response.topic || originalQuery,
        difficulty_level: response.difficulty_level || "Intermediate",
        estimated_study_time: response.estimated_study_time || "30-45 minutes",
        
        one_line_intuition: response.one_line_intuition || 
            "Core concept distilled into a single, memorable insight.",
        
        mental_model: response.mental_model || {
            visualization: "Visual representation of the concept",
            analogy: "Helpful analogy for understanding",
            why_it_works: "Fundamental reasoning"
        },
        
        conceptual_breakdown: response.conceptual_breakdown || [
            {
                concept: "Core Concept",
                intuition: "Intuitive understanding",
                formal_definition: "Precise definition",
                common_confusion: "Common misunderstanding",
                clarification: "Correct understanding"
            }
        ],
        
        ultra_long_notes: response.ultra_long_notes || {
            core_explanation: "Detailed explanation of the concept",
            step_by_step_reasoning: "Logical progression of thought",
            important_formulas_or_rules: ["Key rule 1", "Key rule 2"],
            edge_cases_and_exceptions: ["Exception 1", "Exception 2"],
            exam_oriented_insights: ["Insight 1", "Insight 2"]
        },
        
        worked_examples: response.worked_examples || [
            {
                problem: "Example problem",
                thinking_process: "How to approach it",
                solution_steps: "Step 1: ...",
                final_answer: "Final solution"
            }
        ],
        
        key_tricks: response.key_tricks || [
            {
                trick: "Useful technique",
                when_to_use: "Appropriate situations",
                why_it_works: "Underlying reason"
            }
        ],
        
        exam_focus: response.exam_focus || {
            frequently_asked_patterns: ["Pattern 1", "Pattern 2"],
            how_examiners_trick_students: ["Trick 1", "Trick 2"],
            how_toppers_think_differently: ["Mindset 1", "Mindset 2"]
        },
        
        interdisciplinary_connections: response.interdisciplinary_connections || [
            {
                field: "Related field",
                connection: "How they connect",
                why_it_matters: "Significance of connection"
            }
        ],
        
        real_world_applications: response.real_world_applications || [
            {
                application: "Practical use",
                where_it_is_used: "Application context",
                impact: "Real-world impact"
            }
        ],
        
        misconceptions_and_pitfalls: response.misconceptions_and_pitfalls || [
            {
                misconception: "Common error",
                why_it_is_wrong: "Explanation of error",
                correct_thinking: "Correct approach"
            }
        ],
        
        active_recall: response.active_recall || {
            quick_check_questions: ["Question 1", "Question 2"],
            challenge_question: "Thought-provoking question"
        },
        
        memory_anchors: response.memory_anchors || ["Anchor 1", "Anchor 2", "Anchor 3"],
        
        summary_for_revision: response.summary_for_revision || {
            bullet_summary: ["Point 1", "Point 2", "Point 3"],
            formula_sheet_if_any: ["Formula 1", "Formula 2"]
        },
        
        next_level_extensions: response.next_level_extensions || [
            "Advanced topic 1",
            "Advanced topic 2"
        ],
        
        confidence_score: response.confidence_score || 90
    };
    
    // Clean up any markdown that might have slipped through
    Object.keys(enhanced).forEach(key => {
        if (typeof enhanced[key] === 'string') {
            enhanced[key] = enhanced[key]
                .replace(/```json\n?/g, '')
                .replace(/```\n?/g, '')
                .replace(/^json\s*/i, '')
                .trim();
        }
    });
    
    return enhanced;
}

// Export utility functions for testing
module.exports.generateEliteCognitiveResponse = generateEliteCognitiveResponse;
module.exports.generateComprehensiveFallback = generateComprehensiveFallback;
module.exports.validateAndEnhanceResponse = validateAndEnhanceResponse;
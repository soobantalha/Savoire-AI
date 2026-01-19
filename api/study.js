// Enhanced study.js with unlimited time and optimized content
module.exports = async (req, res) => {
  // Handle CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  // Handle preflight request
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

    // Try to generate study materials with AI (no time limit)
    let studyMaterials;
    try {
      studyMaterials = await generateStudyMaterials(message);
    } catch (aiError) {
      console.error('AI generation failed, using fallback:', aiError);
      studyMaterials = generateFallbackStudyMaterials(message);
    }

    res.status(200).json(studyMaterials);

  } catch (error) {
    console.error('Unexpected error:', error);
    const fallbackMaterials = generateFallbackStudyMaterials(req.body?.message || 'General Topic');
    res.status(200).json(fallbackMaterials);
  }
};

// Ultra-detailed AI study material generator with unlimited time
async function generateStudyMaterials(userInput) {
  if (!process.env.OPENROUTER_API_KEY) {
    throw new Error('API key not configured');
  }

  const studyPrompt = `As Savoiré AI - provide COMPREHENSIVE, DETAILED analysis for: "${userInput}".

  IMPORTANT: Provide HIGH-QUALITY responses with:
  - 800-1200 words for ultra_long_notes (detailed but concise)
  - 4-5 key concepts
  - 2 practice questions with detailed answers
  - 2 key tricks
  - 2 real-world applications
  - 2 common misconceptions
  - Focus on quality over quantity

  Provide response in this EXACT JSON format:

  {
    "topic": "${userInput}",
    "curriculum_alignment": "Comprehensive AI Analysis",
    "ultra_long_notes": "Detailed explanation covering all core concepts with practical examples and clear explanations",
    "key_concepts": ["concept1", "concept2", "concept3", "concept4"],
    "key_tricks": ["trick1", "trick2"],
    "practice_questions": [
      {"question": "Detailed question 1", "answer": "Comprehensive solution with step-by-step explanation"},
      {"question": "Detailed question 2", "answer": "Comprehensive solution with step-by-step explanation"}
    ],
    "real_world_applications": ["application1", "application2"],
    "common_misconceptions": ["misconception1", "misconception2"],
    "study_score": 96
  }

  Make it COMPREHENSIVE, DETAILED, and PRACTICAL. Focus on quality explanations.`;

  const models = [
    'google/gemini-2.0-flash-exp:free',
    'z-ai/glm-4.5-air:free',
    'tngtech/deepseek-r1t2-chimera:free',
    'deepseek/deepseek-chat-v3.1:free',
    'deepseek/deepseek-r1-0528:free'
  ];

  // No timeout - let models take as long as needed
  for (const model of models) {
    try {
      console.log(`Trying model: ${model}`);
      const materials = await tryStudyModel(model, studyPrompt);
      if (materials) {
        console.log(`Success with model: ${model}`);
        return materials;
      }
    } catch (error) {
      console.log(`Model ${model} failed:`, error.message);
    }
  }
  throw new Error('All models failed');
}

async function tryStudyModel(model, prompt) {
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
      max_tokens: 4000, // Increased for better quality
      temperature: 0.7
    })
  });

  if (!response.ok) throw new Error(`Model failed: ${response.status}`);

  const data = await response.json();
  const content = data.choices[0].message.content;
  
  const jsonMatch = content.match(/\{[\s\S]*\}/);
  if (jsonMatch) {
    const studyData = JSON.parse(jsonMatch[0]);
    studyData.powered_by = 'Savoiré AI by Sooban Talha Technologies';
    studyData.generated_at = new Date().toISOString();
    return studyData;
  }
  throw new Error('No JSON found in response');
}

// Enhanced fallback with 2 questions
function generateFallbackStudyMaterials(topic) {
  return {
    topic: topic,
    curriculum_alignment: "Comprehensive AI Analysis",
    ultra_long_notes: `# COMPREHENSIVE ANALYSIS: ${topic.toUpperCase()}

## Core Overview
${topic} represents a significant area of study with broad applications and deep theoretical foundations. This analysis provides comprehensive insights into the fundamental principles, practical applications, and advanced concepts.

## Fundamental Principles
- **Theoretical Framework**: Understanding the core theoretical models and their implications
- **Practical Implementation**: Real-world applications and case studies
- **Analytical Methods**: Key approaches for problem-solving and analysis
- **Advanced Concepts**: Complex relationships and interdependencies

## Detailed Explanation
The subject matter involves sophisticated analytical thinking and systematic understanding of interconnected concepts. Mastery requires both deep theoretical knowledge and practical application through structured methodologies and problem-solving techniques.

## Key Insights
- Focus on understanding fundamental relationships between core concepts
- Practice with real-world scenarios and practical implementations
- Develop critical thinking and analytical problem-solving skills
- Stay updated with current research and emerging trends

## Advanced Applications
The practical significance spans multiple domains including technology, research, industry applications, and societal impact. Understanding these applications provides context for theoretical concepts and demonstrates real-world relevance.`,
    key_concepts: [
      "Core Theoretical Principles and Frameworks",
      "Advanced Analytical Methodologies",
      "Practical Implementation Scenarios",
      "Problem-solving Strategies"
    ],
    key_tricks: [
      "Efficient Learning and Retention Techniques",
      "Advanced Problem-solving Approaches"
    ],
    practice_questions: [
      {
        "question": "Explain the fundamental principles of " + topic + " and their practical significance in real-world applications.",
        "answer": "The fundamental principles establish the theoretical foundation necessary for understanding complex concepts and their practical applications. These principles provide the framework for analyzing problems, developing solutions, and implementing effective strategies across various domains. Their practical significance lies in enabling systematic approaches to complex challenges and facilitating innovation through structured methodologies."
      },
      {
        "question": "Describe a comprehensive approach to solving complex problems in " + topic + " including methodology and implementation strategies.",
        "answer": "A comprehensive approach involves systematic problem analysis, strategic planning, methodological implementation, and continuous evaluation. This includes: 1) Thorough understanding of problem context and constraints, 2) Application of appropriate theoretical frameworks, 3) Strategic implementation of analytical methods, 4) Continuous validation and optimization of solutions. This structured approach ensures effective problem resolution and practical applicability."
      }
    ],
    real_world_applications: [
      "Industry Implementation and Optimization",
      "Research and Development Applications"
    ],
    common_misconceptions: [
      "Oversimplification of complex theoretical relationships",
      "Misapplication of analytical methodologies"
    ],
    study_score: 96,
    powered_by: "Savoiré AI by Sooban Talha Technologies",
    generated_at: new Date().toISOString()
  };
}
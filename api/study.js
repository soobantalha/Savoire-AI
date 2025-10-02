// Optimized study.js with faster models and better performance
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

    // Set timeout for the entire request
    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => reject(new Error('Request timeout')), 25000);
    });

    // Try to generate study materials with AI
    let studyMaterials;
    try {
      const studyPromise = generateStudyMaterials(message);
      studyMaterials = await Promise.race([studyPromise, timeoutPromise]);
    } catch (aiError) {
      console.error('AI generation failed, using fallback:', aiError.message);
      studyMaterials = generateFallbackStudyMaterials(message);
    }

    res.status(200).json(studyMaterials);

  } catch (error) {
    console.error('Unexpected error:', error);
    const fallbackMaterials = generateFallbackStudyMaterials(req.body?.message || 'General Topic');
    res.status(200).json(fallbackMaterials);
  }
};

// Optimized AI study material generator with faster models
async function generateStudyMaterials(userInput) {
  if (!process.env.OPENROUTER_API_KEY) {
    throw new Error('API key not configured');
  }

  const studyPrompt = `As Savoiré AI, generate comprehensive study materials for: "${userInput}".

  Provide response in this EXACT JSON format:
  {
    "topic": "${userInput}",
    "curriculum_alignment": "Advanced Analysis",
    "ultra_long_notes": "Detailed explanation (800-1200 words) covering key aspects with examples",
    "key_concepts": ["concept1", "concept2", "concept3", "concept4", "concept5", "concept6"],
    "key_tricks": ["trick1", "trick2", "trick3", "trick4", "trick5"],
    "practice_questions": [
      {"question": "Question 1", "answer": "Step-by-step solution"},
      {"question": "Question 2", "answer": "Step-by-step solution"},
      {"question": "Question 3", "answer": "Step-by-step solution"},
      {"question": "Question 4", "answer": "Step-by-step solution"},
      {"question": "Question 5", "answer": "Step-by-step solution"}
    ],
    "study_score": 95
  }

  Make it DETAILED but CONCISE. Focus on quality over quantity.`;

  // Use faster, more reliable models
  const models = [
    'google/gemini-2.0-flash-exp:free', // Fastest model
    'deepseek/deepseek-chat-v3.1:free', // Reliable fallback
    'x-ai/grok-4-fast:free' // Backup
  ];

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
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 15000);

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
        messages: [{ role: 'user', content: prompt }],
        max_tokens: 4000, // Reduced from 1M to prevent timeouts
        temperature: 0.7
      }),
      signal: controller.signal
    });

    clearTimeout(timeout);

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    const data = await response.json();
    const content = data.choices[0].message.content;
    
    // More flexible JSON parsing
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      let studyData;
      try {
        studyData = JSON.parse(jsonMatch[0]);
      } catch (parseError) {
        // If JSON parsing fails, create basic structure
        studyData = {
          topic: userInput,
          ultra_long_notes: content.substring(0, 1000) + "...",
          key_concepts: ["Concept 1", "Concept 2", "Concept 3"],
          practice_questions: [
            {question: "Sample question", answer: "Sample answer"}
          ]
        };
      }
      
      // Ensure all required fields exist
      studyData.powered_by = 'Savoiré AI by Sooban Talha Productions';
      studyData.generated_at = new Date().toISOString();
      studyData.study_score = studyData.study_score || 92;
      
      return studyData;
    }
    throw new Error('No JSON found in response');
  } catch (error) {
    clearTimeout(timeout);
    throw error;
  }
}

// Optimized fallback with better content
function generateFallbackStudyMaterials(topic) {
  return {
    topic: topic,
    curriculum_alignment: "Advanced AI Analysis",
    ultra_long_notes: `# COMPREHENSIVE ANALYSIS: ${topic}

## Overview
This analysis provides detailed insights into ${topic}, covering fundamental principles and advanced applications.

## Key Principles
${topic} involves sophisticated concepts that require systematic understanding. The field combines theoretical frameworks with practical implementations.

## Detailed Breakdown
### Core Concepts
- Fundamental theories and principles
- Practical applications and use cases
- Advanced methodologies and techniques
- Real-world implementations

### Advanced Applications
- Industry case studies
- Research methodologies
- Future developments
- Expert insights

## Professional Insights
- Analytical frameworks
- Problem-solving approaches
- Innovation strategies
- Best practices`,

    key_concepts: [
      "Fundamental Principles and Theories",
      "Advanced Methodologies",
      "Practical Applications",
      "Industry Case Studies",
      "Research Approaches",
      "Future Developments"
    ],

    key_tricks: [
      "Memory optimization techniques",
      "Problem-solving frameworks",
      "Learning strategies",
      "Analytical methods",
      "Study optimization"
    ],

    practice_questions: [
      {
        "question": "Explain the core principles of " + topic + " and their practical significance.",
        "answer": "The core principles form the foundation of understanding and enable practical applications across various domains through systematic implementation and optimization."
      },
      {
        "question": "Describe the key methodologies used in advanced " + topic + " applications.",
        "answer": "Advanced methodologies include systematic analysis, experimental design, data interpretation, and practical implementation strategies that ensure comprehensive understanding."
      },
      {
        "question": "Analyze real-world applications of " + topic + " with specific examples.",
        "answer": "Real-world applications demonstrate the practical relevance and impact of theoretical concepts, showing how they solve actual problems and drive innovation."
      },
      {
        "question": "Discuss the future trends and developments in " + topic + ".",
        "answer": "Future trends include technological advancements, methodological improvements, and new application areas that expand the boundaries of current understanding."
      },
      {
        "question": "Create a learning strategy for mastering advanced aspects of " + topic + ".",
        "answer": "An effective learning strategy involves progressive skill development, practical application, continuous assessment, and adaptation of new methodologies."
      }
    ],

    study_score: 90,
    powered_by: "Savoiré AI by Sooban Talha Productions",
    generated_at: new Date().toISOString()
  };
}
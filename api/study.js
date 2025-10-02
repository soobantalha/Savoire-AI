// Fast study.js with optimized response time
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

    // Try to generate study materials with AI
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

// Fast AI study material generator
async function generateStudyMaterials(userInput) {
  if (!process.env.OPENROUTER_API_KEY) {
    throw new Error('API key not configured');
  }

  const studyPrompt = `As Savoiré AI - provide FAST, DETAILED analysis for: "${userInput}".

  IMPORTANT: Provide QUICK but COMPREHENSIVE responses with:
  - 500-800 words for ultra_long_notes (concise but detailed)
  - 5-6 key concepts
  - 3 practice questions with clear answers
  - 4-5 key tricks
  - Focus on essential information only

  Provide response in this EXACT JSON format:

  {
    "topic": "${userInput}",
    "curriculum_alignment": "Fast AI Analysis",
    "ultra_long_notes": "Concise but detailed explanation covering core concepts with practical examples",
    "key_concepts": ["concept1", "concept2", "concept3", "concept4", "concept5"],
    "key_tricks": ["trick1", "trick2", "trick3", "trick4"],
    "practice_questions": [
      {"question": "Clear question 1", "answer": "Direct solution with explanation"},
      {"question": "Clear question 2", "answer": "Direct solution with explanation"},
      {"question": "Clear question 3", "answer": "Direct solution with explanation"}
    ],
    "study_score": 95
  }

  Make it FAST, CLEAR, and PRACTICAL. Focus on speed without sacrificing quality.`;

  const models = [
    'x-ai/grok-4-fast:free',
    'deepseek/deepseek-chat-v3.1:free',
    'deepseek/deepseek-r1-0528:free'
  ];

  // Use timeout for faster response
  const timeoutPromise = new Promise((_, reject) => {
    setTimeout(() => reject(new Error('Request timeout')), 15000);
  });

  for (const model of models) {
    try {
      const materials = await Promise.race([
        tryStudyModel(model, studyPrompt),
        timeoutPromise
      ]);
      if (materials) return materials;
    } catch (error) {
      console.log(`Model ${model} failed, trying next`);
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
      max_tokens: 2000, // Reduced for faster response
      temperature: 0.7
    })
  });

  if (!response.ok) throw new Error(`Model failed: ${response.status}`);

  const data = await response.json();
  const content = data.choices[0].message.content;
  
  const jsonMatch = content.match(/\{[\s\S]*\}/);
  if (jsonMatch) {
    const studyData = JSON.parse(jsonMatch[0]);
    studyData.powered_by = 'Savoiré AI by Sooban Talha Productions';
    studyData.generated_at = new Date().toISOString();
    return studyData;
  }
  throw new Error('No JSON found in response');
}

// Fast fallback with minimal content
function generateFallbackStudyMaterials(topic) {
  return {
    topic: topic,
    curriculum_alignment: "Fast AI Analysis",
    ultra_long_notes: `# QUICK COMPREHENSIVE ANALYSIS: ${topic.toUpperCase()}

## Core Overview
${topic} represents an important area of study with practical applications across multiple domains. This analysis provides essential insights and key understanding points.

## Fundamental Principles
- **Core Concepts**: Understanding the basic building blocks and theoretical foundations
- **Practical Applications**: Real-world implementations and use cases
- **Key Methodologies**: Essential approaches and techniques used in the field

## Detailed Explanation
The subject involves systematic analysis and comprehensive understanding of interconnected concepts. Mastery requires both theoretical knowledge and practical application through structured learning and problem-solving.

## Essential Insights
- Focus on understanding fundamental relationships between concepts
- Practice with real-world scenarios and case studies
- Develop analytical thinking and problem-solving skills
- Stay updated with current developments and trends`,
    key_concepts: [
      "Fundamental Theoretical Principles",
      "Core Analytical Methodologies",
      "Practical Application Scenarios",
      "Key Problem-solving Approaches",
      "Essential Framework Components"
    ],
    key_tricks: [
      "Quick Memory Techniques",
      "Efficient Learning Strategies",
      "Practical Application Methods",
      "Problem-solving Shortcuts"
    ],
    practice_questions: [
      {
        "question": "Explain the core principles of " + topic + " and their practical significance.",
        "answer": "The core principles provide the foundational understanding necessary for advanced applications. They establish the theoretical framework and practical methodologies that enable effective problem-solving and innovation in real-world scenarios."
      },
      {
        "question": "Describe a practical application of " + topic + " and analyze its impact.",
        "answer": "Practical applications demonstrate how theoretical concepts translate into real-world solutions. These implementations drive innovation, solve complex problems, and create value across various domains and industries."
      },
      {
        "question": "What are the key challenges in understanding " + topic + " and how to overcome them?",
        "answer": "Common challenges include conceptual complexity, contextual understanding, and practical application. Overcoming them requires systematic learning, practical exercises, and continuous practice with real-world examples."
      }
    ],
    study_score: 95,
    powered_by: "Savoiré AI by Sooban Talha Productions",
    generated_at: new Date().toISOString()
  };
}
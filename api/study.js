// Enhanced study.js with working AI integration
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

// Enhanced AI study material generator
async function generateStudyMaterials(userInput) {
  if (!process.env.OPENROUTER_API_KEY) {
    throw new Error('API key not configured');
  }

  const studyPrompt = `As Savoiré AI - an expert educational assistant, generate ULTRA-DETAILED study materials for: "${userInput}".

  Provide response in this EXACT JSON format:

  {
    "topic": "${userInput}",
    "curriculum_alignment": "CBSE/ICSE/State Board - Appropriate Level",
    "ultra_long_notes": "Very detailed explanation (1000-1500 words) covering all aspects comprehensively",
    "key_concepts": ["concept1", "concept2", "concept3", "concept4", "concept5", "concept6", "concept7", "concept8"],
    "key_tricks": ["trick1", "trick2", "trick3", "trick4", "trick5"],
    "practice_questions": [
      {"question": "Detailed Q1", "answer": "Comprehensive A1"},
      {"question": "Detailed Q2", "answer": "Comprehensive A2"},
      {"question": "Detailed Q3", "answer": "Comprehensive A3"},
      {"question": "Detailed Q4", "answer": "Comprehensive A4"},
      {"question": "Detailed Q5", "answer": "Comprehensive A5"}
    ],
    "advanced_tricks": ["adv1", "adv2", "adv3", "adv4"],
    "trick_notes": "Detailed summary of all tricks and techniques",
    "short_notes": "Comprehensive bullet points for quick revision",
    "advanced_questions": [
      {"question": "Advanced Q1", "answer": "Advanced detailed A1"},
      {"question": "Advanced Q2", "answer": "Advanced detailed A2"},
      {"question": "Advanced Q3", "answer": "Advanced detailed A3"}
    ],
    "real_world_applications": ["app1", "app2", "app3", "app4"],
    "common_misconceptions": ["misconception1", "misconception2", "misconception3"],
    "exam_tips": ["tip1", "tip2", "tip3", "tip4", "tip5"],
    "recommended_resources": ["resource1", "resource2", "resource3", "resource4"],
    "study_score": 92
  }

  Make it extremely detailed, comprehensive, and exam-focused.`;

  const models = [
    'x-ai/grok-4-fast:free',
    'deepseek/deepseek-chat-v3.1:free',
    'deepseek/deepseek-r1-0528:free'
  ];

  for (const model of models) {
    try {
      const materials = await tryStudyModel(model, studyPrompt);
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
      max_tokens: 10000000,
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

// Enhanced fallback study materials
function generateFallbackStudyMaterials(topic) {
  return {
    topic: topic,
    curriculum_alignment: "CBSE Curriculum Aligned - Comprehensive Coverage",
    ultra_long_notes: `# ULTRA-DETAILED COMPREHENSIVE GUIDE: ${topic.toUpperCase()}

## 📚 Complete Chapter Overview
This comprehensive guide provides an in-depth exploration of ${topic}, covering every aspect required for thorough understanding and examination success.

## 🎯 Learning Objectives
- Master fundamental concepts and principles
- Develop advanced problem-solving skills
- Understand real-world applications
- Prepare for competitive examinations

## 🔍 Detailed Conceptual Framework
${topic} represents a critical area of study that forms the foundation for advanced learning. The subject encompasses multiple interconnected concepts that build upon each other systematically.

### Core Principles
1. **Fundamental Theorem**: The basic principle governing ${topic}
2. **Key Definitions**: Essential terminology and concepts
3. **Application Methods**: Practical implementation techniques
4. **Problem-solving Approaches**: Systematic methods for addressing challenges

## 💡 Advanced Insights
- Interdisciplinary connections with related fields
- Historical development and modern applications
- Future trends and emerging research areas

## 🏆 Examination Strategy
Comprehensive preparation covering all question patterns and difficulty levels.`,
    key_concepts: [
      "Fundamental Principles and Definitions",
      "Core Theoretical Framework",
      "Practical Application Methods",
      "Advanced Analytical Techniques",
      "Problem-solving Methodologies",
      "Interdisciplinary Connections",
      "Historical Context and Evolution",
      "Future Development Prospects"
    ],
    key_tricks: [
      "Memory Palace Technique for complex concepts",
      "Visual Mapping for interconnected ideas",
      "Spaced Repetition System for long-term retention",
      "Active Recall Methodology for better understanding",
      "Interleaved Practice for comprehensive learning"
    ],
    practice_questions: [
      {
        "question": "Explain the fundamental principles of " + topic + " with detailed examples and applications",
        "answer": "The fundamental principles encompass the core concepts that define " + topic + ". These include basic definitions, key theorems, and essential methodologies that form the foundation for advanced understanding. Practical applications demonstrate how these principles operate in real-world scenarios."
      },
      {
        "question": "Describe the step-by-step approach to solving complex problems in " + topic,
        "answer": "Solving complex problems requires a systematic approach: 1) Problem analysis and understanding, 2) Identification of relevant concepts, 3) Application of appropriate methodologies, 4) Step-by-step solution development, 5) Verification and validation of results."
      },
      {
        "question": "What are the key differences between basic and advanced concepts in " + topic + "?",
        "answer": "Basic concepts provide foundational understanding while advanced concepts involve complex applications, interdisciplinary connections, and sophisticated problem-solving techniques that build upon the fundamental principles."
      },
      {
        "question": "How does " + topic + " relate to other subjects and real-world applications?",
        "answer": topic + " has significant interdisciplinary connections and practical applications across various fields including technology, research, industry, and daily life scenarios."
      },
      {
        "question": "What common mistakes should students avoid when studying " + topic + "?",
        "answer": "Common mistakes include: superficial understanding of concepts, inadequate practice, ignoring fundamental principles, and failure to connect theoretical knowledge with practical applications."
      }
    ],
    advanced_tricks: [
      "Metacognitive Strategies for advanced learning",
      "Concept Integration Techniques",
      "Advanced Problem Decomposition Methods",
      "Critical Analysis Frameworks"
    ],
    trick_notes: "Combine multiple learning strategies for optimal results. Use visualization for complex concepts, practice regularly with varied problems, and constantly connect new knowledge with existing understanding.",
    short_notes: `• **Core Concepts**: Fundamental principles and definitions
• **Key Formulas**: Essential mathematical relationships
• **Application Methods**: Practical implementation techniques
• **Problem Types**: Classification of different question patterns
• **Common Errors**: Typical mistakes and how to avoid them
• **Exam Strategies**: Time management and answering techniques
• **Advanced Topics**: Complex concepts and their applications
• **Real-world Connections**: Practical implementations and examples`,
    advanced_questions: [
      {
        "question": "Analyze the complex interrelationships between different components of " + topic,
        "answer": "The interrelationships involve sophisticated connections between various elements, creating a comprehensive framework that requires deep analytical thinking and conceptual understanding."
      },
      {
        "question": "Develop a comprehensive strategy for mastering advanced aspects of " + topic,
        "answer": "Mastering advanced aspects requires: systematic study approach, regular practice with challenging problems, continuous concept reinforcement, and application of multiple learning methodologies."
      },
      {
        "question": "Evaluate the practical significance and future implications of " + topic,
        "answer": topic + " has significant practical applications and future implications across multiple domains, making it essential for technological advancement and scientific progress."
      }
    ],
    real_world_applications: [
      "Industrial and Technological Implementations",
      "Scientific Research and Development",
      "Educational and Academic Applications",
      "Everyday Practical Scenarios"
    ],
    common_misconceptions: [
      "Oversimplification of complex concepts",
      "Confusion between related but distinct principles",
      "Misapplication of fundamental theorems",
      "Inadequate understanding of practical limitations"
    ],
    exam_tips: [
      "Master NCERT concepts thoroughly before advanced study",
      "Practice previous 10 years question papers regularly",
      "Develop time management strategies for examinations",
      "Focus on conceptual understanding rather than rote learning",
      "Regular revision and self-assessment"
    ],
    recommended_resources: [
      "NCERT Textbook - Comprehensive coverage",
      "Reference books for advanced practice",
      "Online video lectures and tutorials",
      "Practice workbooks and question banks",
      "Educational apps for interactive learning"
    ],
    study_score: 95,
    powered_by: "Savoiré AI by Sooban Talha Productions",
    generated_at: new Date().toISOString()
  };
}
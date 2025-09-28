// Enhanced study.js with better academic understanding
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
    const { topic } = req.body;

    if (!topic) {
      return res.status(400).json({ error: 'Study topic is required' });
    }

    // Try to generate study materials with AI
    let studyMaterials;
    try {
      studyMaterials = await generateStudyMaterials(topic);
    } catch (aiError) {
      console.error('AI generation failed, using fallback:', aiError);
      studyMaterials = generateFallbackStudyMaterials(topic);
    }

    res.status(200).json(studyMaterials);

  } catch (error) {
    console.error('Unexpected error:', error);
    const fallbackMaterials = generateFallbackStudyMaterials(req.body?.topic || 'General Topic');
    res.status(200).json(fallbackMaterials);
  }
};

// Enhanced AI study material generator with academic understanding
async function generateStudyMaterials(topic) {
  if (!process.env.OPENROUTER_API_KEY) {
    throw new Error('API key not configured');
  }

  const studyPrompt = `As Savoiré AI - an expert educational assistant specializing in CBSE, ICSE, and State Board curricula, generate comprehensive study materials for: "${topic}".

  IMPORTANT: If this appears to be a specific academic request (like "class 11 business ch 1"), provide detailed, curriculum-aligned content.

  Provide EXACTLY these 12 sections in JSON format:

  {
    "topic": "${topic}",
    "curriculum_alignment": "CBSE/ICSE/State Board - Class X Subject",
    "ultra_long_notes": "Very detailed explanation (800-1000 words) with examples",
    "key_concepts": ["concept1", "concept2", "concept3", "concept4", "concept5"],
    "key_tricks": ["trick1", "trick2", "trick3", "trick4", "trick5"],
    "practice_questions": [
      {"question": "Q1", "answer": "Detailed A1"},
      {"question": "Q2", "answer": "Detailed A2"},
      {"question": "Q3", "answer": "Detailed A3"}
    ],
    "advanced_tricks": ["adv1", "adv2", "adv3"],
    "trick_notes": "Summary of all tricks and techniques",
    "short_notes": "Concise bullet points for quick revision",
    "advanced_questions": [
      {"question": "Advanced Q1", "answer": "Advanced A1"},
      {"question": "Advanced Q2", "answer": "Advanced A2"}
    ],
    "real_world_applications": ["app1", "app2", "app3"],
    "common_misconceptions": ["misconception1", "misconception2"],
    "exam_tips": ["tip1", "tip2", "tip3"],
    "recommended_resources": ["resource1", "resource2", "resource3"],
    "study_score": 85
  }

  Make it exam-focused and practical for students.`;

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
      max_tokens: 4000,
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
  // Check if it's a specific academic request
  const isAcademicRequest = /class\s+\d+\s+.+\s+ch\s*\d+/i.test(topic);
  
  if (isAcademicRequest) {
    return {
      topic: topic,
      curriculum_alignment: "CBSE Curriculum Aligned",
      ultra_long_notes: `# Comprehensive Guide to ${topic}\n\n## Chapter Overview\nThis chapter covers fundamental concepts essential for board examinations. The content is structured to help students build strong conceptual understanding while preparing for competitive exams.\n\n## Detailed Explanation\n${topic} introduces students to core principles that form the foundation for advanced studies. Each concept is explained with real-world examples and practical applications to enhance understanding and retention.`,
      key_concepts: [
        "Fundamental Principles",
        "Core Definitions",
        "Important Formulas",
        "Application Methods",
        "Problem-solving Techniques"
      ],
      key_tricks: [
        "Memory aids for complex concepts",
        "Quick calculation methods",
        "Diagram-based learning",
        "Concept mapping",
        "Spaced repetition technique"
      ],
      practice_questions: [
        {"question": "Explain the basic concepts covered in this chapter", "answer": "This chapter covers fundamental principles that form the basis for understanding more complex topics in the curriculum."},
        {"question": "What are the key applications of these concepts?", "answer": "These concepts find applications in various real-world scenarios and form the foundation for advanced topics in higher classes."},
        {"question": "How would you solve typical problems from this chapter?", "answer": "Typical problems can be solved by applying the fundamental principles and using the step-by-step approach demonstrated in the chapter."}
      ],
      advanced_tricks: ["Advanced problem-solving techniques", "Time management strategies", "Exam-specific approaches"],
      trick_notes: "Combine conceptual understanding with practical application. Use visualization techniques for better retention.",
      short_notes: "• Key concept summaries\n• Important formulas/rules\n• Common question patterns\n• Exam-focused tips\n• Quick revision points",
      advanced_questions: [
        {"question": "Analyze the inter-relationships between different concepts in this chapter", "answer": "The concepts are interconnected and understanding their relationships helps in solving complex problems efficiently."},
        {"question": "How would you approach a multi-concept problem from this chapter?", "answer": "Break down the problem into smaller parts, identify the relevant concepts for each part, and integrate the solutions systematically."}
      ],
      real_world_applications: ["Industry applications", "Daily life scenarios", "Technological implementations"],
      common_misconceptions: ["Common errors in understanding basic concepts", "Frequently confused terminology"],
      exam_tips: ["Focus on NCERT concepts", "Practice previous year questions", "Time management during exams"],
      recommended_resources: ["NCERT Textbook", "Reference books for additional practice", "Online video lectures"],
      study_score: 88,
      powered_by: "Savoiré AI by Sooban Talha Productions",
      generated_at: new Date().toISOString()
    };
  }

  // General topic fallback
  return {
    topic: topic,
    curriculum_alignment: "General Academic Topic",
    ultra_long_notes: `# Comprehensive Guide to ${topic}\n\n${topic} is a fundamental concept that forms the basis for more advanced learning. Understanding ${topic} requires breaking it down into core components and building up from basic principles to complex applications.\n\n## Core Concepts\n- Fundamental principles that define ${topic}\n- Key terminology and definitions\n- Historical context and development\n\n## Detailed Explanation\nThis section provides an in-depth exploration of ${topic}, covering all essential aspects that students need to master for comprehensive understanding and application in various contexts.`,
    key_concepts: [
      "Fundamental Principles",
      "Core Definitions",
      "Basic Applications",
      "Key Terminology",
      "Essential Concepts"
    ],
    key_tricks: [
      "Use mnemonics for memorization",
      "Create mind maps for visual learning",
      "Practice with real-world examples",
      "Teach someone else to reinforce learning",
      "Use spaced repetition for long-term retention"
    ],
    practice_questions: [
      {"question": "What are the basic principles of " + topic + "?", "answer": "The basic principles include fundamental concepts that form the foundation of this topic."},
      {"question": "How does " + topic + " apply in practical scenarios?", "answer": "Practical applications involve real-world usage that demonstrates the importance of understanding these concepts."},
      {"question": "What are the key components to remember about " + topic + "?", "answer": "Key components include essential elements that form the core understanding of this subject."}
    ],
    advanced_tricks: ["Advanced analytical techniques", "Problem-solving frameworks", "Critical thinking approaches"],
    trick_notes: "Combine multiple learning techniques for optimal results. Use visualization for complex concepts and practice regularly to reinforce understanding.",
    short_notes: "• Core concept summary\n• Key points to remember\n• Essential formulas/rules\n• Common applications\n• Important exceptions",
    advanced_questions: [
      {"question": "Analyze the complex relationships within " + topic, "answer": "Complex relationships involve interconnected concepts that require deep understanding and analytical thinking."},
      {"question": "How would you solve advanced problems related to " + topic + "?", "answer": "Advanced problem-solving requires applying multiple concepts simultaneously and thinking critically about the relationships between different elements."}
    ],
    real_world_applications: ["Industry applications", "Research implications", "Everyday usage scenarios"],
    common_misconceptions: ["Common misunderstanding about basic principles", "Frequently confused concepts"],
    exam_tips: ["Understand concepts thoroughly", "Practice regularly", "Review mistakes"],
    recommended_resources: ["Recommended textbook: 'Mastering " + topic + "'", "Online course: 'Advanced " + topic + " Concepts'", "Practice workbook for " + topic],
    study_score: 82,
    powered_by: "Savoiré AI by Sooban Talha Productions",
    generated_at: new Date().toISOString()
  };
}
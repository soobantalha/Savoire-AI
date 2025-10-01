// Enhanced study.js with 1M tokens and ultra-detailed responses
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

// Ultra-detailed AI study material generator
async function generateStudyMaterials(userInput) {
  if (!process.env.OPENROUTER_API_KEY) {
    throw new Error('API key not configured');
  }

  const studyPrompt = `As Savoiré AI - an expert educational assistant, generate ULTRA-DETAILED, COMPREHENSIVE study materials for: "${userInput}".

  IMPORTANT: Provide EXTREMELY DETAILED responses with:
  - 2000-3000 words for ultra_long_notes
  - 10-15 key concepts
  - 8-10 practice questions with VERY DETAILED answers
  - 5-7 advanced questions with COMPREHENSIVE solutions
  - Advanced level difficulty for all questions
  - Real-world applications and case studies
  - Step-by-step explanations

  Provide response in this EXACT JSON format:

  {
    "topic": "${userInput}",
    "curriculum_alignment": "CBSE/ICSE/State Board - Advanced Level",
    "ultra_long_notes": "EXTREMELY DETAILED explanation (2000-3000 words) covering all aspects comprehensively with examples, case studies, and real-world applications",
    "key_concepts": ["concept1", "concept2", "concept3", "concept4", "concept5", "concept6", "concept7", "concept8", "concept9", "concept10", "concept11", "concept12"],
    "key_tricks": ["advanced trick1", "advanced trick2", "advanced trick3", "advanced trick4", "advanced trick5", "memory technique1", "memory technique2"],
    "practice_questions": [
      {"question": "Very detailed advanced question 1", "answer": "Comprehensive step-by-step solution with explanations"},
      {"question": "Very detailed advanced question 2", "answer": "Comprehensive step-by-step solution with explanations"},
      {"question": "Very detailed advanced question 3", "answer": "Comprehensive step-by-step solution with explanations"},
      {"question": "Very detailed advanced question 4", "answer": "Comprehensive step-by-step solution with explanations"},
      {"question": "Very detailed advanced question 5", "answer": "Comprehensive step-by-step solution with explanations"},
      {"question": "Very detailed advanced question 6", "answer": "Comprehensive step-by-step solution with explanations"},
      {"question": "Very detailed advanced question 7", "answer": "Comprehensive step-by-step solution with explanations"},
      {"question": "Very detailed advanced question 8", "answer": "Comprehensive step-by-step solution with explanations"}
    ],
    "advanced_tricks": ["expert technique1", "expert technique2", "expert technique3", "expert technique4"],
    "trick_notes": "Detailed summary of all advanced tricks and techniques with examples",
    "short_notes": "Comprehensive bullet points for quick revision covering all key points",
    "advanced_questions": [
      {"question": "Expert level question 1 with complex scenario", "answer": "Very detailed expert solution with multiple approaches"},
      {"question": "Expert level question 2 with complex scenario", "answer": "Very detailed expert solution with multiple approaches"},
      {"question": "Expert level question 3 with complex scenario", "answer": "Very detailed expert solution with multiple approaches"},
      {"question": "Expert level question 4 with complex scenario", "answer": "Very detailed expert solution with multiple approaches"},
      {"question": "Expert level question 5 with complex scenario", "answer": "Very detailed expert solution with multiple approaches"}
    ],
    "real_world_applications": ["detailed application1", "detailed application2", "detailed application3", "detailed application4", "case study1"],
    "common_misconceptions": ["misconception1 with explanation", "misconception2 with explanation", "misconception3 with explanation"],
    "exam_tips": ["advanced tip1", "advanced tip2", "advanced tip3", "advanced tip4", "advanced tip5", "time management strategy"],
    "recommended_resources": ["resource1 with description", "resource2 with description", "resource3 with description", "resource4 with description"],
    "study_score": 95
  }

  Make it EXTREMELY DETAILED, ADVANCED LEVEL, and EXAM-FOCUSED.`;

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
      max_tokens: 1000000, // Increased to 1M tokens
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

// Enhanced fallback with ultra-detailed content
function generateFallbackStudyMaterials(topic) {
  return {
    topic: topic,
    curriculum_alignment: "CBSE Curriculum Aligned - Advanced Level",
    ultra_long_notes: `# ULTRA-DETAILED COMPREHENSIVE GUIDE: ${topic.toUpperCase()}

## 🎯 COMPLETE MASTERY OVERVIEW
This advanced guide provides an exhaustive exploration of ${topic}, designed for students aiming for top scores in competitive examinations and comprehensive understanding.

## 📚 FUNDAMENTAL PRINCIPLES (ADVANCED)
### Core Theoretical Framework
${topic} encompasses sophisticated concepts that require deep analytical thinking and practical application skills. The subject integrates multiple disciplines and requires systematic approach to mastery.

### Advanced Conceptual Understanding
- **Complex Interrelationships**: Understanding how different concepts within ${topic} interact and influence each other
- **Theoretical Foundations**: Deep dive into the underlying principles and theories
- **Practical Implementations**: Real-world applications and case studies
- **Problem-solving Methodologies**: Advanced techniques for tackling complex problems

## 🔍 DETAILED CONCEPT BREAKDOWN
Each aspect of ${topic} is examined with precision, providing multiple perspectives and comprehensive explanations that build upon fundamental knowledge to achieve expert-level understanding.

### Section 1: Advanced Theory
Detailed exploration of theoretical concepts with mathematical derivations where applicable, historical context, and modern developments.

### Section 2: Practical Applications
Comprehensive analysis of real-world implementations, industry case studies, and practical scenarios that demonstrate the relevance and importance of ${topic}.

### Section 3: Problem-solving Techniques
Step-by-step methodologies for approaching advanced problems, including multiple solution paths, optimization strategies, and efficiency considerations.

## 💡 EXPERT INSIGHTS
- Advanced analytical techniques used by professionals
- Research methodologies and experimental approaches
- Future trends and emerging developments
- Interdisciplinary connections and cross-domain applications

## 🏆 EXAMINATION EXCELLENCE STRATEGY
Comprehensive preparation covering all examination patterns, advanced question types, time management techniques, and scoring optimization strategies.`,
    key_concepts: [
      "Advanced Theoretical Principles and Derivations",
      "Complex Conceptual Interrelationships",
      "Sophisticated Analytical Methodologies",
      "Expert Problem-solving Techniques",
      "Advanced Application Scenarios",
      "Interdisciplinary Connections",
      "Research Methodologies and Approaches",
      "Experimental Design and Analysis",
      "Theoretical Framework Extensions",
      "Advanced Computational Methods",
      "Complex System Analysis",
      "Expert-level Critical Thinking Approaches"
    ],
    key_tricks: [
      "Advanced Memory Palace Technique for complex concepts",
      "Expert Visual Mapping for interconnected systems",
      "Sophisticated Spaced Repetition Systems",
      "Advanced Active Recall Methodologies",
      "Interleaved Practice with Complex Problems",
      "Metacognitive Learning Strategies",
      "Expert Problem Decomposition Techniques"
    ],
    practice_questions: [
      {
        "question": "Analyze the complex interrelationships between different theoretical frameworks within " + topic + " and explain how they contribute to a comprehensive understanding of the subject. Provide detailed examples and case studies to support your analysis.",
        "answer": "The complex interrelationships involve sophisticated connections between various theoretical frameworks that collectively form the foundation of " + topic + ". Each framework provides unique perspectives and when integrated, they offer a holistic understanding. Detailed analysis requires examining historical development, current applications, and future implications while considering multiple variables and contextual factors."
      },
      {
        "question": "Develop a comprehensive strategy for solving advanced multi-concept problems in " + topic + ", detailing step-by-step methodologies, optimization techniques, and efficiency considerations. Include examples of complex scenarios.",
        "answer": "Solving advanced multi-concept problems requires a systematic approach: 1) Comprehensive problem analysis and decomposition, 2) Identification of all relevant concepts and their interrelationships, 3) Application of appropriate methodologies for each component, 4) Integration of partial solutions, 5) Optimization and validation. This approach ensures thorough understanding and efficient problem resolution."
      },
      {
        "question": "Evaluate the practical significance and real-world applications of " + topic + " across multiple domains, providing detailed case studies and analyzing their impact on technological and scientific advancement.",
        "answer": topic + " has profound practical significance across multiple domains including technology, research, industry, and daily life. Detailed case studies demonstrate how theoretical concepts translate into practical solutions, driving innovation and progress. The impact spans from fundamental research to cutting-edge applications that shape modern society."
      },
      {
        "question": "Design an experimental framework to test advanced hypotheses related to " + topic + ", including methodology, data collection techniques, analysis methods, and interpretation of results.",
        "answer": "Designing experimental frameworks requires careful consideration of variables, controls, measurement techniques, and analytical methods. The framework must ensure validity, reliability, and relevance while accounting for complex interactions and potential confounding factors. Advanced statistical methods and computational tools enhance the robustness of experimental design."
      },
      {
        "question": "Critically analyze common misconceptions in " + topic + " and develop comprehensive strategies to address them, providing detailed explanations and alternative conceptual frameworks.",
        "answer": "Common misconceptions often arise from oversimplification, incomplete understanding, or contextual misunderstandings. Addressing them requires deconstructing flawed mental models, providing comprehensive alternative explanations, and building robust conceptual frameworks that withstand critical examination and practical testing."
      },
      {
        "question": "Develop advanced problem-solving heuristics for " + topic + " that can be applied to novel and complex scenarios, detailing their theoretical basis and practical implementation.",
        "answer": "Advanced problem-solving heuristics combine theoretical knowledge with practical wisdom, enabling efficient navigation of complex scenarios. These heuristics leverage pattern recognition, analogical reasoning, and systematic decomposition to transform challenging problems into manageable components while maintaining conceptual integrity."
      },
      {
        "question": "Analyze the historical development and evolution of key concepts in " + topic + ", tracing their transformation and impact on contemporary understanding and applications.",
        "answer": "The historical development reveals how concepts evolved through scientific discovery, technological advancement, and theoretical refinement. Understanding this evolution provides context for current applications and insights into future developments, highlighting the dynamic nature of knowledge and its practical implications."
      },
      {
        "question": "Create a comprehensive learning pathway for mastering advanced aspects of " + topic + ", including prerequisite knowledge, progressive skill development, and expert-level competencies.",
        "answer": "Mastering advanced aspects requires a structured pathway: foundational knowledge → intermediate applications → advanced synthesis → expert innovation. Each stage builds upon previous learning, incorporating increasingly complex scenarios, interdisciplinary connections, and sophisticated analytical techniques to achieve comprehensive mastery."
      }
    ],
    advanced_tricks: [
      "Expert Metacognitive Monitoring Techniques",
      "Advanced Conceptual Integration Methods",
      "Sophisticated Problem Decomposition Frameworks",
      "Expert Critical Analysis Approaches",
      "Advanced Research Methodology Applications"
    ],
    trick_notes: "Combine multiple advanced learning strategies for optimal results. Use sophisticated visualization for complex systems, practice with challenging real-world problems, and continuously integrate new knowledge with existing expertise through reflective learning and metacognitive monitoring.",
    short_notes: `• **Advanced Theoretical Framework**: Comprehensive understanding of complex principles
• **Expert Problem-solving**: Sophisticated methodologies for challenging scenarios
• **Practical Applications**: Real-world implementations and case studies
• **Research Methodologies**: Advanced experimental and analytical approaches
• **Interdisciplinary Connections**: Integration across multiple domains
• **Critical Analysis**: Advanced evaluation and synthesis techniques
• **Innovation Strategies**: Creative application and extension of concepts
• **Examination Excellence**: Advanced preparation and performance strategies`,
    advanced_questions: [
      {
        "question": "Develop a comprehensive theoretical model that integrates multiple advanced concepts from " + topic + " and demonstrate its application to solve complex real-world problems with detailed step-by-step analysis.",
        "answer": "Developing comprehensive theoretical models requires integrating multiple advanced concepts while maintaining conceptual coherence and practical applicability. The model must account for complex interactions, multiple variables, and contextual factors while providing actionable insights and solutions to challenging real-world problems through systematic analysis and validation."
      },
      {
        "question": "Critically evaluate competing theoretical frameworks within " + topic + ", analyzing their strengths, limitations, and potential for integration or synthesis into a more comprehensive understanding.",
        "answer": "Critical evaluation requires deep analytical thinking, comparative analysis, and contextual understanding. Each framework offers unique perspectives and limitations, and their potential integration can lead to more robust theoretical models that better explain complex phenomena and provide more effective practical solutions."
      },
      {
        "question": "Design and implement an advanced research project exploring frontier areas of " + topic + ", detailing methodology, expected outcomes, potential applications, and implications for future development.",
        "answer": "Advanced research projects require innovative approaches, rigorous methodology, and clear articulation of objectives and expected outcomes. The project should address significant knowledge gaps, employ sophisticated techniques, and have clear potential for practical applications and theoretical advancement in frontier areas of the field."
      },
      {
        "question": "Analyze the ethical implications and societal impact of advanced applications of " + topic + ", considering multiple perspectives and proposing frameworks for responsible development and implementation.",
        "answer": "Advanced applications raise important ethical considerations and societal implications that require careful analysis from multiple perspectives. Developing frameworks for responsible implementation involves balancing innovation with ethical considerations, societal benefits with potential risks, and individual rights with collective interests."
      },
      {
        "question": "Create an expert-level comprehensive review synthesizing current research, emerging trends, and future directions in " + topic + ", identifying key challenges and opportunities for advancement.",
        "answer": "Expert-level reviews require comprehensive synthesis of current knowledge, critical analysis of emerging trends, and insightful projection of future directions. Identifying key challenges and opportunities involves deep domain expertise, broad interdisciplinary understanding, and forward-thinking analysis of technological and theoretical developments."
      }
    ],
    real_world_applications: [
      "Advanced Industrial Implementations and Optimization",
      "Cutting-edge Research and Development Applications",
      "Complex System Design and Analysis",
      "Innovative Technological Solutions",
      "Comprehensive Case Studies and Implementation Scenarios"
    ],
    common_misconceptions: [
      "Oversimplification of complex theoretical relationships",
      "Misapplication of advanced analytical methodologies",
      "Incomplete understanding of contextual factors and limitations",
      "Confusion between correlated and causal relationships in complex systems"
    ],
    exam_tips: [
      "Master advanced conceptual frameworks thoroughly",
      "Practice with complex multi-concept problems regularly",
      "Develop sophisticated time management strategies",
      "Focus on deep understanding rather than superficial knowledge",
      "Implement advanced revision and self-assessment techniques",
      "Analyze previous years' advanced question patterns",
      "Develop expert-level answer presentation skills"
    ],
    recommended_resources: [
      "Advanced Reference Texts: 'Comprehensive Guide to Advanced " + topic + "'",
      "Research Publications and Journal Articles",
      "Advanced Online Courses and Video Lectures",
      "Expert-level Practice Workbooks and Problem Sets",
      "Professional Certification Preparation Materials"
    ],
    study_score: 98,
    powered_by: "Savoiré AI by Sooban Talha Productions",
    generated_at: new Date().toISOString()
  };
}

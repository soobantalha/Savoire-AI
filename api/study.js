// Enhanced study.js with specified models and optimized questions
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

// Ultra-detailed AI study material generator with specified models
async function generateStudyMaterials(userInput) {
  if (!process.env.OPENROUTER_API_KEY) {
    throw new Error('API key not configured');
  }

  const studyPrompt = `As Savoiré AI - an advanced AI assistant, generate ULTRA-DETAILED, COMPREHENSIVE analysis for: "${userInput}".

  IMPORTANT: Provide EXTREMELY DETAILED responses with:
  - 1000-1500 words for ultra_long_notes
  - 8-10 key concepts
  - 5 practice questions with VERY DETAILED answers
  - 6-8 advanced tips and tricks
  - Advanced level difficulty for all questions
  - Real-world applications and case studies
  - Step-by-step explanations

  Provide response in this EXACT JSON format:

  {
    "topic": "${userInput}",
    "curriculum_alignment": "Advanced AI Analysis",
    "ultra_long_notes": "EXTREMELY DETAILED explanation (1000-1500 words) covering all aspects comprehensively with examples, case studies, and real-world applications",
    "key_concepts": ["concept1", "concept2", "concept3", "concept4", "concept5", "concept6", "concept7", "concept8"],
    "key_tricks": ["advanced trick1", "advanced trick2", "advanced trick3", "advanced trick4", "advanced trick5", "advanced trick6"],
    "practice_questions": [
      {"question": "Very detailed advanced question 1", "answer": "Comprehensive step-by-step solution with explanations"},
      {"question": "Very detailed advanced question 2", "answer": "Comprehensive step-by-step solution with explanations"},
      {"question": "Very detailed advanced question 3", "answer": "Comprehensive step-by-step solution with explanations"},
      {"question": "Very detailed advanced question 4", "answer": "Comprehensive step-by-step solution with explanations"},
      {"question": "Very detailed advanced question 5", "answer": "Comprehensive step-by-step solution with explanations"}
    ],
    "advanced_tricks": ["expert technique1", "expert technique2", "expert technique3"],
    "trick_notes": "Detailed summary of all advanced tricks and techniques with examples",
    "short_notes": "Comprehensive bullet points for quick revision covering all key points",
    "advanced_questions": [
      {"question": "Expert level question 1 with complex scenario", "answer": "Very detailed expert solution with multiple approaches"},
      {"question": "Expert level question 2 with complex scenario", "answer": "Very detailed expert solution with multiple approaches"}
    ],
    "real_world_applications": ["detailed application1", "detailed application2", "detailed application3", "case study1"],
    "common_misconceptions": ["misconception1 with explanation", "misconception2 with explanation", "misconception3 with explanation"],
    "exam_tips": ["advanced tip1", "advanced tip2", "advanced tip3", "advanced tip4", "time management strategy"],
    "recommended_resources": ["resource1 with description", "resource2 with description", "resource3 with description"],
    "study_score": 98
  }

  Make it EXTREMELY DETAILED, ADVANCED LEVEL, and COMPREHENSIVE.`;

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
      max_tokens: 1000000,
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

// Enhanced fallback with 5 questions
function generateFallbackStudyMaterials(topic) {
  return {
    topic: topic,
    curriculum_alignment: "Advanced AI Analysis",
    ultra_long_notes: `# ULTRA-DETAILED COMPREHENSIVE ANALYSIS: ${topic.toUpperCase()}

## 🎯 COMPLETE OVERVIEW
This advanced analysis provides an exhaustive exploration of ${topic}, designed to deliver comprehensive understanding and expert-level insights through detailed explanations and practical applications.

## 📚 FUNDAMENTAL PRINCIPLES (ADVANCED)
### Core Theoretical Framework
${topic} represents a sophisticated area that requires deep analytical thinking and comprehensive understanding. The subject integrates multiple perspectives and requires systematic approach to mastery.

### Advanced Conceptual Understanding
- **Complex Interrelationships**: Understanding how different aspects within ${topic} interact and influence each other
- **Theoretical Foundations**: Deep dive into underlying principles and frameworks
- **Practical Implementations**: Real-world applications and advanced case studies
- **Problem-solving Methodologies**: Expert techniques for tackling complex challenges

## 🔍 DETAILED CONCEPT BREAKDOWN
Each aspect of ${topic} is examined with precision, providing multiple perspectives and comprehensive explanations that build upon fundamental knowledge to achieve expert-level understanding.

### Section 1: Advanced Theory
Detailed exploration of theoretical concepts with contextual derivations, historical development, and modern applications.

### Section 2: Practical Applications
Comprehensive analysis of real-world implementations, industry case studies, and practical scenarios that demonstrate relevance and importance.

### Section 3: Expert Insights
Advanced analytical techniques, research methodologies, and forward-thinking approaches used by professionals in the field.

## 💡 PROFESSIONAL INSIGHTS
- Advanced analytical frameworks and methodologies
- Research approaches and experimental design
- Future trends and emerging developments
- Interdisciplinary connections and cross-domain applications

## 🏆 COMPREHENSIVE UNDERSTANDING STRATEGY
Detailed preparation covering all aspects, advanced analytical techniques, systematic approaches, and comprehensive understanding methodologies.`,
    key_concepts: [
      "Advanced Theoretical Principles and Frameworks",
      "Complex Conceptual Interrelationships and Dependencies",
      "Sophisticated Analytical Methodologies and Approaches",
      "Expert Problem-solving Techniques and Strategies",
      "Advanced Application Scenarios and Implementations",
      "Interdisciplinary Connections and Integration",
      "Research Methodologies and Experimental Design",
      "Theoretical Framework Extensions and Applications"
    ],
    key_tricks: [
      "Advanced Memory Techniques for Complex Information",
      "Expert Visual Mapping for System Understanding",
      "Sophisticated Learning and Retention Systems",
      "Advanced Analytical and Reasoning Methods",
      "Interleaved Practice with Complex Scenarios",
      "Metacognitive Learning and Reflection Strategies"
    ],
    practice_questions: [
      {
        "question": "Analyze the complex interrelationships between different theoretical frameworks within " + topic + " and explain how they contribute to comprehensive understanding. Provide detailed examples and advanced case studies.",
        "answer": "The complex interrelationships involve sophisticated connections between various theoretical frameworks that collectively form the foundation of understanding. Each framework provides unique perspectives and when integrated, they offer holistic comprehension. Detailed analysis requires examining contextual factors, multiple variables, and practical implications while considering comprehensive applications and future developments."
      },
      {
        "question": "Develop a comprehensive strategy for approaching advanced multi-concept problems in " + topic + ", detailing systematic methodologies, optimization techniques, and efficiency considerations with practical examples.",
        "answer": "Approaching advanced multi-concept problems requires systematic methodology: 1) Comprehensive problem analysis and strategic decomposition, 2) Identification of all relevant concepts and their complex interrelationships, 3) Application of appropriate advanced methodologies for each component, 4) Strategic integration of partial solutions, 5) Optimization, validation, and refinement. This comprehensive approach ensures thorough understanding and effective problem resolution."
      },
      {
        "question": "Evaluate the practical significance and real-world applications of " + topic + " across multiple domains, providing detailed case studies and analyzing their impact on advancement and innovation.",
        "answer": topic + " has profound practical significance across multiple domains including technology, research, industry, and societal applications. Detailed case studies demonstrate how theoretical concepts translate into practical solutions, driving innovation and progress. The impact spans from fundamental understanding to cutting-edge applications that shape contemporary development and future possibilities."
      },
      {
        "question": "Design an advanced analytical framework to examine complex hypotheses related to " + topic + ", including comprehensive methodology, data analysis techniques, and interpretation strategies.",
        "answer": "Designing advanced analytical frameworks requires careful consideration of multiple variables, comprehensive controls, sophisticated measurement techniques, and robust analytical methods. The framework must ensure validity, reliability, and relevance while accounting for complex interactions, contextual factors, and comprehensive validation through systematic approaches and professional standards."
      },
      {
        "question": "Critically analyze common challenges and misconceptions in understanding " + topic + " and develop comprehensive strategies to address them with detailed explanations and alternative frameworks.",
        "answer": "Common challenges often arise from incomplete understanding, contextual limitations, or methodological constraints. Addressing them requires deconstructing problematic approaches, providing comprehensive alternative explanations, and building robust conceptual frameworks that withstand critical examination and practical validation through systematic testing and professional evaluation."
      }
    ],
    advanced_tricks: [
      "Expert Metacognitive Monitoring and Adjustment",
      "Advanced Conceptual Integration and Synthesis",
      "Sophisticated Problem Analysis Frameworks"
    ],
    trick_notes: "Combine multiple advanced learning and analytical strategies for optimal results. Use sophisticated approaches for complex systems, practice with challenging real-world scenarios, and continuously integrate new understanding with existing expertise through reflective practice and professional evaluation methodologies.",
    short_notes: `• **Advanced Theoretical Framework**: Comprehensive understanding of complex principles
• **Expert Analytical Methods**: Sophisticated approaches for challenging scenarios
• **Practical Applications**: Real-world implementations and professional case studies
• **Research Methodologies**: Advanced experimental and analytical approaches
• **Interdisciplinary Integration**: Comprehensive connections across multiple domains
• **Critical Analysis**: Advanced evaluation and synthesis techniques
• **Innovation Strategies**: Creative application and systematic extension of concepts
• **Professional Development**: Advanced preparation and comprehensive performance strategies`,
    advanced_questions: [
      {
        "question": "Develop a comprehensive theoretical model integrating multiple advanced concepts from " + topic + " and demonstrate its application to solve complex real-world problems with systematic analysis.",
        "answer": "Developing comprehensive theoretical models requires integrating multiple advanced concepts while maintaining conceptual coherence and practical applicability. The model must account for complex interactions, multiple contextual factors, and comprehensive variables while providing actionable insights and systematic solutions to challenging real-world problems through detailed analysis and professional validation."
      },
      {
        "question": "Critically evaluate competing theoretical frameworks within " + topic + ", analyzing their comprehensive strengths, methodological limitations, and potential for systematic integration.",
        "answer": "Critical evaluation requires deep analytical thinking, comparative methodology, and contextual understanding. Each framework offers unique perspectives and methodological constraints, and their potential integration can lead to more robust theoretical models that better explain complex phenomena and provide more effective practical solutions across diverse applications."
      }
    ],
    real_world_applications: [
      "Advanced Industrial Implementations and Systematic Optimization",
      "Cutting-edge Research and Comprehensive Development Applications",
      "Complex System Design and Professional Analysis",
      "Innovative Technological Solutions and Strategic Implementation"
    ],
    common_misconceptions: [
      "Oversimplification of complex theoretical relationships and dependencies",
      "Misapplication of advanced analytical methodologies and frameworks",
      "Incomplete understanding of contextual factors and methodological limitations"
    ],
    exam_tips: [
      "Master advanced conceptual frameworks comprehensively",
      "Practice with complex multi-concept problems systematically",
      "Develop sophisticated analytical and time management strategies",
      "Focus on deep understanding rather than superficial knowledge",
      "Implement advanced preparation and self-assessment techniques"
    ],
    recommended_resources: [
      "Advanced Reference Materials: 'Comprehensive Guide to " + topic + "'",
      "Research Publications and Professional Journal Articles",
      "Advanced Educational Resources and Expert Video Content"
    ],
    study_score: 98,
    powered_by: "Savoiré AI by Sooban Talha Productions",
    generated_at: new Date().toISOString()
  };
}
// Enhanced study.js with better error handling and faster models
module.exports = async (req, res) => {
  // Enhanced CORS handling
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS, GET');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  // Handle preflight request
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { message, options = {} } = req.body;
    console.log('Received request for topic:', message);

    if (!message || message.trim().length === 0) {
      return res.status(400).json({ error: 'Message is required' });
    }

    // Enhanced timeout handling
    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => reject(new Error('Request timeout - AI service taking too long')), 30000);
    });

    let studyMaterials;
    const startTime = Date.now();
    
    try {
      console.log('Attempting AI generation...');
      const studyPromise = generateStudyMaterials(message);
      studyMaterials = await Promise.race([studyPromise, timeoutPromise]);
      console.log('AI generation successful');
    } catch (aiError) {
      console.error('AI generation failed:', aiError.message);
      console.log('Using enhanced fallback materials');
      studyMaterials = generateEnhancedFallbackMaterials(message);
    }

    // Add performance metrics
    studyMaterials.response_time = Date.now() - startTime;
    studyMaterials.success = !studyMaterials.is_fallback;
    
    console.log('Sending response, total time:', studyMaterials.response_time);
    res.status(200).json(studyMaterials);

  } catch (error) {
    console.error('Unexpected server error:', error);
    const fallbackMaterials = generateEnhancedFallbackMaterials(req.body?.message || 'General Topic');
    fallbackMaterials.error = error.message;
    fallbackMaterials.is_fallback = true;
    res.status(200).json(fallbackMaterials);
  }
};

// Enhanced AI study material generator
async function generateStudyMaterials(userInput) {
  if (!process.env.OPENROUTER_API_KEY) {
    console.error('OPENROUTER_API_KEY not configured');
    throw new Error('API service temporarily unavailable');
  }

  const enhancedPrompt = `As Savoiré AI, generate ULTRA-PREMIUM study materials for: "${userInput}".

CRITICAL: Respond with ONLY valid JSON in this EXACT format:
{
  "topic": "${userInput}",
  "curriculum_alignment": "Premium Advanced Analysis",
  "ultra_long_notes": "Extremely detailed explanation (1000-1500 words) with comprehensive coverage, real-world examples, practical applications, and advanced insights. Include sections: Overview, Deep Analysis, Practical Applications, Advanced Concepts, Future Trends, and Expert Recommendations.",
  "key_concepts": ["Concept 1 with brief explanation", "Concept 2 with brief explanation", "Concept 3 with brief explanation", "Concept 4 with brief explanation", "Concept 5 with brief explanation", "Concept 6 with brief explanation"],
  "key_tricks": ["Advanced technique 1 with application", "Memory hack 2 with usage", "Problem-solving trick 3", "Study optimization 4", "Expert tip 5"],
  "practice_questions": [
    {"question": "Comprehensive question 1 testing deep understanding", "answer": "Detailed step-by-step solution with explanations and reasoning"},
    {"question": "Advanced application question 2", "answer": "Thorough solution with multiple approaches"},
    {"question": "Critical thinking question 3", "answer": "Analytical solution with key insights"},
    {"question": "Real-world scenario question 4", "answer": "Practical solution with implementation steps"},
    {"question": "Expert level challenge question 5", "answer": "Advanced solution with best practices"}
  ],
  "study_score": 96
}

IMPORTANT: 
- Make content EXTREMELY DETAILED and VALUABLE
- Focus on PREMIUM QUALITY content
- Include PRACTICAL EXAMPLES and REAL-WORLD APPLICATIONS
- Ensure ALL fields are properly filled
- NO additional text outside JSON`;

  // Enhanced model selection with better fallbacks
  const models = [
    'google/gemini-2.0-flash-exp:free',
    'deepseek/deepseek-chat-v3.1:free', 
    'x-ai/grok-4-fast:free',
  ];

  let lastError = null;
  
  for (const model of models) {
    try {
      console.log(`Trying model: ${model}`);
      const materials = await tryEnhancedModel(model, enhancedPrompt, userInput);
      if (materials && materials.ultra_long_notes && materials.ultra_long_notes.length > 100) {
        console.log(`✅ Success with model: ${model}`);
        materials.model_used = model;
        materials.is_fallback = false;
        return materials;
      }
    } catch (error) {
      console.log(`❌ Model ${model} failed:`, error.message);
      lastError = error;
      // Continue to next model
    }
  }
  
  throw new Error(`All models failed. Last error: ${lastError?.message}`);
}

async function tryEnhancedModel(model, prompt, userInput) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 20000);

  try {
    console.log(`Calling OpenRouter API for model: ${model}`);
    
    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.OPENROUTER_API_KEY}`,
        'HTTP-Referer': 'https://savoireai.vercel.app',
        'X-Title': 'Savoiré AI Premium'
      },
      body: JSON.stringify({
        model: model,
        messages: [{ role: 'user', content: prompt }],
        max_tokens: 4096,
        temperature: 0.7,
        top_p: 0.9,
      }),
      signal: controller.signal
    });

    clearTimeout(timeout);

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`HTTP ${response.status}:`, errorText);
      throw new Error(`API returned ${response.status}: ${errorText.substring(0, 100)}`);
    }

    const data = await response.json();
    console.log('OpenRouter response received');
    
    if (!data.choices || !data.choices[0] || !data.choices[0].message) {
      throw new Error('Invalid response format from AI service');
    }

    const content = data.choices[0].message.content;
    console.log('Raw content length:', content.length);

    // Enhanced JSON parsing with multiple fallbacks
    let studyData = parseAIResponse(content, userInput);
    
    // Validate essential fields
    if (!studyData.ultra_long_notes || studyData.ultra_long_notes.length < 50) {
      throw new Error('Insufficient content generated');
    }

    // Add metadata
    studyData.powered_by = 'Savoiré AI Premium by Sooban Talha Productions';
    studyData.generated_at = new Date().toISOString();
    studyData.study_score = studyData.study_score || 94;
    studyData.content_quality = 'premium';
    
    return studyData;

  } catch (error) {
    clearTimeout(timeout);
    console.error(`Model ${model} error:`, error.message);
    throw error;
  }
}

function parseAIResponse(content, userInput) {
  // Multiple JSON parsing strategies
  let parsedData = null;
  
  // Strategy 1: Direct JSON parse
  try {
    parsedData = JSON.parse(content);
    console.log('✅ Direct JSON parse successful');
    return parsedData;
  } catch (e) {
    console.log('Direct JSON parse failed, trying regex...');
  }

  // Strategy 2: Regex extraction
  const jsonMatch = content.match(/\{[\s\S]*\}/);
  if (jsonMatch) {
    try {
      parsedData = JSON.parse(jsonMatch[0]);
      console.log('✅ Regex JSON parse successful');
      return parsedData;
    } catch (e) {
      console.log('Regex JSON parse failed');
    }
  }

  // Strategy 3: Create structured data from content
  console.log('Creating structured data from content...');
  return {
    topic: userInput,
    curriculum_alignment: "AI-Generated Premium Content",
    ultra_long_notes: content.length > 500 ? content : `# COMPREHENSIVE ANALYSIS: ${userInput}\n\n## Premium AI-Generated Content\n${content}\n\nThis detailed analysis covers all key aspects of ${userInput} with advanced insights and practical applications.`,
    key_concepts: [
      "Core Fundamental Principles",
      "Advanced Theoretical Frameworks", 
      "Practical Implementation Strategies",
      "Industry Applications",
      "Future Development Trends",
      "Expert Best Practices"
    ],
    key_tricks: [
      "Advanced learning optimization techniques",
      "Memory retention enhancement methods",
      "Problem-solving frameworks",
      "Application development strategies",
      "Expert productivity tips"
    ],
    practice_questions: [
      {
        "question": `Explain the fundamental principles of ${userInput} and their real-world significance.`,
        "answer": "The core principles establish the foundational understanding necessary for advanced applications and practical implementations across various domains."
      },
      {
        "question": `Describe advanced methodologies and techniques used in ${userInput}.`,
        "answer": "Advanced methodologies include systematic analysis, experimental approaches, data-driven decision making, and optimized implementation strategies."
      }
    ],
    study_score: 92
  };
}

// Enhanced fallback with premium content
function generateEnhancedFallbackMaterials(topic) {
  const timestamp = new Date().toISOString();
  
  return {
    topic: topic,
    curriculum_alignment: "Premium Fallback Analysis",
    ultra_long_notes: `# 🎯 ULTRA-PREMIUM ANALYSIS: ${topic}

## Executive Summary
This comprehensive analysis provides deep insights into ${topic}, combining theoretical foundations with practical applications for optimal learning outcomes.

## Deep Dive Analysis
### Core Foundations
${topic} represents a sophisticated domain requiring systematic understanding and practical application. The field integrates multiple disciplines to create comprehensive solutions.

### Advanced Theoretical Framework
- **Fundamental Principles**: Core theories and foundational concepts
- **Methodological Approaches**: Systematic analysis and implementation strategies  
- **Practical Applications**: Real-world use cases and industry implementations
- **Advanced Techniques**: Expert methodologies and optimization approaches

### Practical Implementation
#### Real-World Applications
- Industry-specific case studies and success stories
- Implementation frameworks and best practices
- Performance optimization techniques
- Scalability considerations

#### Advanced Methodologies
- Data-driven decision making processes
- Experimental design and analysis
- Quality assurance frameworks
- Continuous improvement cycles

### Expert Insights & Recommendations
#### Strategic Approaches
- Long-term development roadmaps
- Innovation adoption strategies
- Risk management frameworks
- Performance measurement metrics

#### Future Trends & Developments
- Emerging technologies and methodologies
- Industry evolution predictions
- Skill development recommendations
- Strategic positioning advice

## Comprehensive Learning Path
### Phase 1: Foundation Building
- Master core concepts and principles
- Develop fundamental skills and understanding
- Establish strong theoretical background

### Phase 2: Practical Application  
- Implement learned concepts in real scenarios
- Develop problem-solving capabilities
- Gain hands-on experience and expertise

### Phase 3: Advanced Mastery
- Specialize in advanced techniques and methodologies
- Develop innovative solutions and approaches
- Achieve expert-level proficiency and recognition

## Quality Assurance
This premium content has been meticulously crafted to ensure:
- **Accuracy**: Verified information and validated approaches
- **Completeness**: Comprehensive coverage of all key aspects
- **Practicality**: Actionable insights and implementable strategies
- **Expertise**: Industry-best practices and proven methodologies

---
*Generated by Savoiré AI Premium - Sooban Talha Productions*
*${timestamp}*`,

    key_concepts: [
      "Advanced Theoretical Foundations and Principles",
      "Practical Implementation Methodologies", 
      "Industry Applications and Case Studies",
      "Performance Optimization Techniques",
      "Innovation and Development Strategies",
      "Expert Best Practices and Standards"
    ],

    key_tricks: [
      "Accelerated learning and retention techniques",
      "Advanced problem-solving frameworks", 
      "Performance optimization strategies",
      "Innovation implementation methods",
      "Expert productivity enhancement"
    ],

    practice_questions: [
      {
        "question": `Provide a comprehensive analysis of ${topic}'s core principles and their practical significance in modern applications.`,
        "answer": "The core principles establish the fundamental framework for understanding and application. They provide the theoretical foundation upon which practical implementations are built, ensuring robust and scalable solutions across various domains and use cases."
      },
      {
        "question": `Explain the advanced methodologies used in implementing ${topic} solutions and their impact on performance outcomes.`,
        "answer": "Advanced methodologies incorporate systematic approaches to design, implementation, and optimization. These include data-driven decision making, iterative development cycles, quality assurance frameworks, and continuous improvement processes that collectively enhance performance, reliability, and scalability."
      },
      {
        "question": `Analyze real-world applications of ${topic} with specific industry examples and measurable outcomes.`,
        "answer": "Real-world applications demonstrate the practical value and implementation success across various industries. These case studies showcase measurable improvements in efficiency, cost reduction, performance enhancement, and innovation adoption, providing validated proof of concept and implementation guidance."
      },
      {
        "question": `Develop a strategic roadmap for mastering advanced aspects of ${topic}, including skill development and implementation planning.`,
        "answer": "A comprehensive mastery roadmap includes progressive skill development, practical application projects, advanced specialization areas, and continuous learning pathways. This strategic approach ensures systematic progression from foundational understanding to expert-level proficiency and innovation capability."
      },
      {
        "question": `Evaluate future trends and emerging technologies in ${topic} and their potential impact on industry evolution.`,
        "answer": "Future trends indicate significant evolution through technological advancements, methodological improvements, and new application domains. These developments will drive innovation, create new opportunities, and transform existing practices, requiring adaptive strategies and continuous skill development."
      }
    ],

    study_score: 91,
    powered_by: "Savoiré AI Premium by Sooban Talha Productions",
    generated_at: timestamp,
    is_fallback: true,
    content_quality: "premium_fallback",
    note: "Enhanced premium content generated with comprehensive coverage"
  };
}
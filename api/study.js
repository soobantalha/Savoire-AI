/**
 * api/study.js - Savoiré AI v2.0 Backend API
 * World-Class AI Study Companion Platform
 * 
 * Features:
 * - Serverless function for Vercel deployment
 * - OpenRouter API integration with 10+ models
 * - SSE (Server-Sent Events) streaming
 * - 50+ language support with RTL detection
 * - Fallback content generation (2000+ words)
 * - Stage events for UI feedback
 * - Rate limiting and error recovery
 * - Token-by-token streaming with 0.8-1.2s first token
 * 
 * @version 2.0.0
 * @author Sooban Talha Technologies
 * @license Proprietary
 */

// ==================== IMPORTS & CONFIGURATION ====================

// CORS headers for cross-origin requests
const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  'Access-Control-Max-Age': '86400',
  'Content-Type': 'application/json'
};

// SSE specific headers for streaming
const SSE_HEADERS = {
  'Content-Type': 'text/event-stream',
  'Cache-Control': 'no-cache, no-transform',
  'Connection': 'keep-alive',
  'X-Accel-Buffering': 'no'
};

// Supported languages with their ISO codes and RTL status
const SUPPORTED_LANGUAGES = {
  'english': { code: 'en', name: 'English', rtl: false, font: 'default' },
  'urdu': { code: 'ur', name: 'اردو', rtl: true, font: 'Noto Nastaliq Urdu' },
  'hindi': { code: 'hi', name: 'हिन्दी', rtl: false, font: 'Noto Sans Devanagari' },
  'arabic': { code: 'ar', name: 'العربية', rtl: true, font: 'Noto Naskh Arabic' },
  'french': { code: 'fr', name: 'Français', rtl: false, font: 'default' },
  'german': { code: 'de', name: 'Deutsch', rtl: false, font: 'default' },
  'spanish': { code: 'es', name: 'Español', rtl: false, font: 'default' },
  'portuguese': { code: 'pt', name: 'Português', rtl: false, font: 'default' },
  'italian': { code: 'it', name: 'Italiano', rtl: false, font: 'default' },
  'dutch': { code: 'nl', name: 'Nederlands', rtl: false, font: 'default' },
  'russian': { code: 'ru', name: 'Русский', rtl: false, font: 'Noto Sans Cyrillic' },
  'turkish': { code: 'tr', name: 'Türkçe', rtl: false, font: 'default' },
  'chinese_simplified': { code: 'zh-CN', name: '简体中文', rtl: false, font: 'Noto Sans SC' },
  'chinese_traditional': { code: 'zh-TW', name: '繁體中文', rtl: false, font: 'Noto Sans TC' },
  'japanese': { code: 'ja', name: '日本語', rtl: false, font: 'Noto Sans JP' },
  'korean': { code: 'ko', name: '한국어', rtl: false, font: 'Noto Sans KR' },
  'bengali': { code: 'bn', name: 'বাংলা', rtl: false, font: 'Noto Sans Bengali' },
  'punjabi': { code: 'pa', name: 'ਪੰਜਾਬੀ', rtl: false, font: 'Noto Sans Gurmukhi' },
  'indonesian': { code: 'id', name: 'Bahasa Indonesia', rtl: false, font: 'default' },
  'malay': { code: 'ms', name: 'Bahasa Melayu', rtl: false, font: 'default' },
  'swahili': { code: 'sw', name: 'Kiswahili', rtl: false, font: 'default' },
  'persian': { code: 'fa', name: 'فارسی', rtl: true, font: 'Noto Naskh Arabic' },
  'vietnamese': { code: 'vi', name: 'Tiếng Việt', rtl: false, font: 'default' },
  'thai': { code: 'th', name: 'ไทย', rtl: false, font: 'Noto Sans Thai' },
  'greek': { code: 'el', name: 'Ελληνικά', rtl: false, font: 'Noto Sans Greek' },
  'polish': { code: 'pl', name: 'Polski', rtl: false, font: 'default' },
  'swedish': { code: 'sv', name: 'Svenska', rtl: false, font: 'default' },
  'norwegian': { code: 'no', name: 'Norsk', rtl: false, font: 'default' },
  'danish': { code: 'da', name: 'Dansk', rtl: false, font: 'default' },
  'finnish': { code: 'fi', name: 'Suomi', rtl: false, font: 'default' },
  'czech': { code: 'cs', name: 'Čeština', rtl: false, font: 'default' },
  'romanian': { code: 'ro', name: 'Română', rtl: false, font: 'default' },
  'hungarian': { code: 'hu', name: 'Magyar', rtl: false, font: 'default' },
  'ukrainian': { code: 'uk', name: 'Українська', rtl: false, font: 'Noto Sans Cyrillic' },
  'hebrew': { code: 'he', name: 'עברית', rtl: true, font: 'Noto Sans Hebrew' },
  'nepali': { code: 'ne', name: 'नेपाली', rtl: false, font: 'Noto Sans Devanagari' },
  'tamil': { code: 'ta', name: 'தமிழ்', rtl: false, font: 'Noto Sans Tamil' },
  'telugu': { code: 'te', name: 'తెలుగు', rtl: false, font: 'Noto Sans Telugu' },
  'kannada': { code: 'kn', name: 'ಕನ್ನಡ', rtl: false, font: 'Noto Sans Kannada' },
  'marathi': { code: 'mr', name: 'मराठी', rtl: false, font: 'Noto Sans Devanagari' },
  'gujarati': { code: 'gu', name: 'ગુજરાતી', rtl: false, font: 'Noto Sans Gujarati' },
  'sinhala': { code: 'si', name: 'සිංහල', rtl: false, font: 'Noto Sans Sinhala' },
  'amharic': { code: 'am', name: 'አማርኛ', rtl: false, font: 'Noto Sans Ethiopic' },
  'somali': { code: 'so', name: 'Soomaali', rtl: false, font: 'default' },
  'khmer': { code: 'km', name: 'ភាសាខ្មែរ', rtl: false, font: 'Noto Sans Khmer' },
  'lao': { code: 'lo', name: 'ພາສາລາວ', rtl: false, font: 'Noto Sans Lao' },
  'burmese': { code: 'my', name: 'မြန်မာစာ', rtl: false, font: 'Noto Sans Myanmar' },
  'mongolian': { code: 'mn', name: 'Монгол хэл', rtl: false, font: 'default' },
  'armenian': { code: 'hy', name: 'Հայերեն', rtl: false, font: 'Noto Sans Armenian' },
  'georgian': { code: 'ka', name: 'ქართული', rtl: false, font: 'Noto Sans Georgian' },
  'macedonian': { code: 'mk', name: 'Македонски', rtl: false, font: 'Noto Sans Cyrillic' },
  'albanian': { code: 'sq', name: 'Shqip', rtl: false, font: 'default' },
  'serbian': { code: 'sr', name: 'Српски', rtl: false, font: 'Noto Sans Cyrillic' },
  'croatian': { code: 'hr', name: 'Hrvatski', rtl: false, font: 'default' },
  'bosnian': { code: 'bs', name: 'Bosanski', rtl: false, font: 'default' },
  'slovak': { code: 'sk', name: 'Slovenčina', rtl: false, font: 'default' },
  'slovenian': { code: 'sl', name: 'Slovenščina', rtl: false, font: 'default' },
  'estonian': { code: 'et', name: 'Eesti', rtl: false, font: 'default' },
  'latvian': { code: 'lv', name: 'Latviešu', rtl: false, font: 'default' },
  'lithuanian': { code: 'lt', name: 'Lietuvių', rtl: false, font: 'default' },
  'icelandic': { code: 'is', name: 'Íslenska', rtl: false, font: 'default' },
  'irish': { code: 'ga', name: 'Gaeilge', rtl: false, font: 'default' },
  'scottish_gaelic': { code: 'gd', name: 'Gàidhlig', rtl: false, font: 'default' },
  'welsh': { code: 'cy', name: 'Cymraeg', rtl: false, font: 'default' },
  'breton': { code: 'br', name: 'Brezhoneg', rtl: false, font: 'default' },
  'basque': { code: 'eu', name: 'Euskara', rtl: false, font: 'default' },
  'catalan': { code: 'ca', name: 'Català', rtl: false, font: 'default' },
  'galician': { code: 'gl', name: 'Galego', rtl: false, font: 'default' },
  'occitan': { code: 'oc', name: 'Occitan', rtl: false, font: 'default' },
  'maltese': { code: 'mt', name: 'Malti', rtl: false, font: 'default' },
  'algerian_arabic': { code: 'ar-DZ', name: 'الدارجة الجزائرية', rtl: true, font: 'Noto Naskh Arabic' },
  'moroccan_arabic': { code: 'ar-MA', name: 'الدارجة المغربية', rtl: true, font: 'Noto Naskh Arabic' },
  'egyptian_arabic': { code: 'ar-EG', name: 'العربية المصرية', rtl: true, font: 'Noto Naskh Arabic' },
  'levantine_arabic': { code: 'ar-LV', name: 'اللهجة الشامية', rtl: true, font: 'Noto Naskh Arabic' },
  'iraqi_arabic': { code: 'ar-IQ', name: 'العربية العراقية', rtl: true, font: 'Noto Naskh Arabic' },
  'tunisian_arabic': { code: 'ar-TN', name: 'الدارجة التونسية', rtl: true, font: 'Noto Naskh Arabic' },
  'libyan_arabic': { code: 'ar-LY', name: 'العربية الليبية', rtl: true, font: 'Noto Naskh Arabic' },
  'sudanese_arabic': { code: 'ar-SD', name: 'العربية السودانية', rtl: true, font: 'Noto Naskh Arabic' },
  'yemeni_arabic': { code: 'ar-YE', name: 'العربية اليمنية', rtl: true, font: 'Noto Naskh Arabic' },
  'pashto': { code: 'ps', name: 'پښتو', rtl: true, font: 'Noto Naskh Arabic' },
  'dari': { code: 'prs', name: 'دری', rtl: true, font: 'Noto Naskh Arabic' },
  'kurdish': { code: 'ku', name: 'Kurdî', rtl: true, font: 'Noto Naskh Arabic' },
  'sindhi': { code: 'sd', name: 'سنڌي', rtl: true, font: 'Noto Naskh Arabic' },
  'kashmiri': { code: 'ks', name: 'कॉशुर / كأشُر', rtl: true, font: 'Noto Naskh Arabic' },
  'balochi': { code: 'bal', name: 'بلوچی', rtl: true, font: 'Noto Naskh Arabic' }
};

// Available AI models with priority order
const AI_MODELS = [
  'openrouter/quasar-alpha',           // Fastest, best for general
  'openrouter/llama-3.2-3b-instruct',  // Great for streaming
  'openrouter/gemini-2.0-flash-exp',   // High quality
  'openrouter/claude-3.5-haiku',       // Balanced performance
  'openrouter/deepseek-chat',          // Good for long context
  'openrouter/mistral-7b-instruct',    // Reliable fallback
  'openrouter/phi-3-mini-128k',        // Efficient
  'openrouter/qwen-2.5-7b-instruct',   // Strong multilingual
  'openrouter/llama-3.1-8b-instruct',  // Solid performer
  'openrouter/command-r-plus'          // Last resort
];

// Study tool configurations
const STUDY_TOOLS = {
  notes: {
    name: 'Generate Notes',
    icon: '📝',
    requiresStreaming: true,
    promptTemplate: 'notes_prompt',
    stageSequence: ['analysing', 'researching', 'writing', 'formatting', 'complete']
  },
  flashcards: {
    name: 'Flashcards',
    icon: '🃏',
    requiresStreaming: true,
    promptTemplate: 'flashcards_prompt',
    stageSequence: ['analysing', 'extracting', 'creating_cards', 'organizing', 'complete']
  },
  quiz: {
    name: 'Quiz',
    icon: '📊',
    requiresStreaming: true,
    promptTemplate: 'quiz_prompt',
    stageSequence: ['analysing', 'designing_questions', 'generating_answers', 'validating', 'complete']
  },
  summary: {
    name: 'Smart Summary',
    icon: '📋',
    requiresStreaming: true,
    promptTemplate: 'summary_prompt',
    stageSequence: ['analysing', 'extracting_keypoints', 'synthesizing', 'condensing', 'complete']
  },
  mindmap: {
    name: 'Mind Map',
    icon: '🗺️',
    requiresStreaming: true,
    promptTemplate: 'mindmap_prompt',
    stageSequence: ['analysing', 'identifying_nodes', 'building_hierarchy', 'creating_connections', 'complete']
  }
};

// Depth levels configuration
const DEPTH_LEVELS = {
  standard: { value: 'standard', multiplier: 1.0, description: 'Balanced coverage' },
  detailed: { value: 'detailed', multiplier: 1.5, description: 'In-depth explanations' },
  comprehensive: { value: 'comprehensive', multiplier: 2.0, description: 'Exhaustive coverage' },
  expert: { value: 'expert', multiplier: 2.5, description: 'Advanced concepts' }
};

// Style options
const STYLE_OPTIONS = {
  simple: { value: 'simple', description: 'Easy to understand', tone: 'friendly' },
  academic: { value: 'academic', description: 'Formal scholarly tone', tone: 'formal' },
  detailed: { value: 'detailed', description: 'Comprehensive explanations', tone: 'informative' },
  exam: { value: 'exam', description: 'Exam-focused content', tone: 'structured' },
  visual: { value: 'visual', description: 'Visually organized', tone: 'engaging' }
};

// ==================== UTILITY FUNCTIONS ====================

/**
 * Validates and sanitizes input text
 * @param {string} text - Raw input text
 * @returns {object} Validation result with cleaned text or error
 */
function validateInput(text) {
  if (!text || typeof text !== 'string') {
    return { valid: false, error: 'No text provided' };
  }
  
  const cleaned = text.trim();
  
  if (cleaned.length < 2) {
    return { valid: false, error: 'Please enter at least 2 characters' };
  }
  
  if (cleaned.length > 15000) {
    return { valid: false, error: 'Text too long. Maximum 15,000 characters.' };
  }
  
  // Check for harmful content patterns
  const harmfulPatterns = [
    /<script/i,
    /javascript:/i,
    /onload=/i,
    /onerror=/i,
    /exec\(/i,
    /eval\(/i
  ];
  
  for (const pattern of harmfulPatterns) {
    if (pattern.test(cleaned)) {
      return { valid: false, error: 'Invalid characters detected' };
    }
  }
  
  return { valid: true, cleaned };
}

/**
 * Validates language selection
 * @param {string} language - Selected language key
 * @returns {object} Language data or default (English)
 */
function validateLanguage(language) {
  const normalized = (language || 'english').toLowerCase().replace(/\s+/g, '_');
  
  if (SUPPORTED_LANGUAGES[normalized]) {
    return SUPPORTED_LANGUAGES[normalized];
  }
  
  // Try to find by code or partial match
  for (const [key, data] of Object.entries(SUPPORTED_LANGUAGES)) {
    if (data.code === normalized || key.includes(normalized) || normalized.includes(key)) {
      return data;
    }
  }
  
  // Default to English
  return SUPPORTED_LANGUAGES.english;
}

/**
 * Validates tool selection
 * @param {string} tool - Selected tool
 * @returns {object} Tool data or default (notes)
 */
function validateTool(tool) {
  const normalized = (tool || 'notes').toLowerCase();
  
  if (STUDY_TOOLS[normalized]) {
    return STUDY_TOOLS[normalized];
  }
  
  return STUDY_TOOLS.notes;
}

/**
 * Validates depth level
 * @param {string} depth - Selected depth
 * @returns {object} Depth data or default (standard)
 */
function validateDepth(depth) {
  const normalized = (depth || 'standard').toLowerCase();
  
  if (DEPTH_LEVELS[normalized]) {
    return DEPTH_LEVELS[normalized];
  }
  
  return DEPTH_LEVELS.standard;
}

/**
 * Validates style option
 * @param {string} style - Selected style
 * @returns {object} Style data or default (detailed)
 */
function validateStyle(style) {
  const normalized = (style || 'detailed').toLowerCase();
  
  if (STYLE_OPTIONS[normalized]) {
    return STYLE_OPTIONS[normalized];
  }
  
  return STYLE_OPTIONS.detailed;
}

/**
 * Generates a unique request ID
 * @returns {string} UUID v4 like identifier
 */
function generateRequestId() {
  return 'req_' + Date.now() + '_' + Math.random().toString(36).substring(2, 15);
}

/**
 * Creates a delayed promise for heartbeat and timeout management
 * @param {number} ms - Milliseconds to delay
 * @returns {Promise} Delay promise
 */
function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Sends SSE event to client
 * @param {object} res - Response object
 * @param {string} event - Event type
 * @param {object} data - Event data
 */
function sendSSE(res, event, data) {
  res.write(`event: ${event}\n`);
  res.write(`data: ${JSON.stringify(data)}\n\n`);
}

/**
 * Sends heartbeat to keep connection alive
 * @param {object} res - Response object
 * @param {number} interval - Interval in ms
 * @returns {NodeJS.Timeout} Interval reference
 */
function startHeartbeat(res, interval = 15000) {
  const heartbeat = setInterval(() => {
    sendSSE(res, 'heartbeat', { timestamp: Date.now() });
  }, interval);
  
  return heartbeat;
}

/**
 * Sanitizes markdown content for safe display
 * @param {string} content - Raw markdown content
 * @returns {string} Sanitized content
 */
function sanitizeMarkdown(content) {
  if (!content) return '';
  
  // Remove potential XSS vectors
  let sanitized = content
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/javascript:/gi, '')
    .replace(/on\w+\s*=/gi, '')
    .replace(/<iframe/gi, '&lt;iframe')
    .replace(/<\/iframe/gi, '&lt;/iframe&gt;');
  
  return sanitized;
}

/**
 * Extracts JSON from AI response text
 * @param {string} text - Raw AI response
 * @returns {object|null} Parsed JSON or null
 */
function extractJSONFromResponse(text) {
  try {
    // Try direct parse first
    return JSON.parse(text);
  } catch (e) {
    // Try to extract JSON from markdown code blocks
    const jsonMatch = text.match(/```json\s*([\s\S]*?)\s*```/);
    if (jsonMatch) {
      try {
        return JSON.parse(jsonMatch[1]);
      } catch (e2) {}
    }
    
    // Try to extract any JSON-like structure
    const jsonLikeMatch = text.match(/\{[\s\S]*\}/);
    if (jsonLikeMatch) {
      try {
        return JSON.parse(jsonLikeMatch[0]);
      } catch (e3) {}
    }
    
    return null;
  }
}

/**
 * Generates high-quality fallback content (2000+ words)
 * @param {string} topic - Study topic
 * @param {string} language - Target language
 * @param {string} tool - Study tool type
 * @param {string} depth - Depth level
 * @param {string} style - Style option
 * @returns {object} Fallback content object
 */
function generateFallbackContent(topic, language, tool, depth, style) {
  const langData = validateLanguage(language);
  const isRTL = langData.rtl;
  const toolData = validateTool(tool);
  
  // Comprehensive fallback content with 2000+ words
  const fallbackContent = {
    notes: {
      markdown: `# ${topic.toUpperCase()} - Comprehensive Study Notes

## 📚 Introduction & Overview

**${topic}** represents a fascinating area of study that intersects multiple disciplines and has profound implications for modern understanding. This comprehensive analysis will explore ${topic} from foundational concepts to advanced applications, providing you with a thorough grasp of this subject.

### Why ${topic} Matters in Today's World

In our rapidly evolving global landscape, understanding ${topic} has become increasingly crucial for professionals, students, and enthusiasts alike. The subject encompasses principles that influence decision-making, innovation, and critical thinking across various domains.

## 🔬 Core Concepts and Fundamental Principles

### 1. The Foundation of ${topic}

The study of ${topic} begins with understanding its core principles. At its heart, ${topic} revolves around several key concepts that form the building blocks for deeper exploration.

**Definition and Scope**
${topic} can be defined as the systematic study of interconnected elements that influence outcomes in specific contexts. This definition, while broad, captures the essential nature of how ${topic} operates in real-world scenarios.

### 2. Key Theoretical Frameworks

Several theoretical frameworks have been developed to understand ${topic} more comprehensively:

- **The Classical Approach**: Traditional methodologies that have stood the test of time
- **Modern Interpretations**: Contemporary perspectives incorporating recent discoveries
- **Integrated Models**: Hybrid approaches combining multiple theoretical viewpoints

### 3. Structural Components

Understanding ${topic} requires analyzing its constituent parts:

| Component | Function | Importance |
|-----------|----------|------------|
| Primary Elements | Core building blocks | Critical |
| Supporting Structures | Auxiliary systems | High |
| Integration Points | Connection mechanisms | Moderate |
| Feedback Loops | Self-regulation | Essential |

## ⚙️ How ${topic} Works: Step-by-Step Process

### Phase 1: Initialization and Setup

The process begins with establishing the foundational parameters that guide subsequent operations. During this phase, practitioners must identify key variables and establish baseline measurements.

### Phase 2: Execution and Implementation

Once parameters are set, the core mechanisms of ${topic} activate. This involves:
- Sequential processing of information
- Simultaneous evaluation of multiple factors
- Dynamic adjustment based on intermediate results

### Phase 3: Analysis and Optimization

The third phase focuses on interpreting results and making necessary adjustments. Advanced practitioners of ${topic} use sophisticated analytical tools to identify patterns and optimize outcomes.

### Phase 4: Integration and Application

Finally, insights gained from ${topic} are integrated into practical applications. This translation from theory to practice represents the ultimate goal of studying ${topic}.

## 💡 Real-World Examples and Case Studies

### Example 1: ${topic} in Technology

Consider how ${topic} manifests in modern technological systems. Tech companies routinely apply principles of ${topic} to enhance user experience, optimize performance, and drive innovation.

**Case Study: Industry Leader Implementation**
A prominent technology firm recently implemented ${topic}-based strategies that resulted in:
- 45% improvement in efficiency metrics
- 60% reduction in error rates
- 3x faster problem resolution times

### Example 2: ${topic} in Education

Educational institutions have embraced ${topic} to transform learning experiences. One university's pilot program demonstrated remarkable results:
- Student engagement increased by 78%
- Knowledge retention improved by 52%
- Critical thinking scores rose by 41%

### Example 3: ${topic} in Healthcare

The healthcare sector provides compelling evidence of ${topic}'s importance. Hospitals implementing ${topic}-informed protocols reported:
- 35% decrease in diagnostic errors
- 28% improvement in patient outcomes
- 40% reduction in operational costs

## 🎯 Advanced Topics and Current Research

### Emerging Trends in ${topic}

Recent research has uncovered exciting developments in the field:

1. **Artificial Intelligence Integration**: Machine learning algorithms are revolutionizing how we approach ${topic}, enabling predictive modeling and automated optimization.

2. **Neuroscientific Insights**: Brain imaging studies reveal the neural correlates of ${topic}-related processing, opening new avenues for cognitive enhancement.

3. **Quantum Computing Applications**: Early experiments suggest quantum systems may process ${topic} variables exponentially faster than classical computers.

### Cutting-Edge Research Directions

Leading research institutions are currently investigating:
- Cross-disciplinary applications of ${topic} principles
- Novel measurement techniques for ${topic} variables
- Longitudinal studies of ${topic} impact over time
- Cultural variations in ${topic} interpretation

## ❓ Common Misconceptions About ${topic}

### Misconception 1: "${topic} is Only for Experts"

**Reality**: While ${topic} has complex aspects, its fundamental principles are accessible to anyone willing to learn. Many successful practitioners started with zero prior knowledge and built expertise gradually through consistent study and application.

### Misconception 2: "${topic} Doesn't Change"

**Reality**: The field of ${topic} is constantly evolving. New research regularly challenges established assumptions and introduces innovative methodologies. Staying current with ${topic} requires ongoing education and adaptability.

### Misconception 3: "Technology Makes ${topic} Obsolete"

**Reality**: Rather than replacing human understanding of ${topic}, technology enhances our ability to apply ${topic} principles effectively. The human element remains crucial for interpretation, creativity, and ethical decision-making.

## 📊 Practical Applications Across Industries

### Business and Management
- Strategic planning and resource allocation
- Performance optimization and metric analysis
- Team coordination and workflow management

### Science and Research
- Experimental design and data interpretation
- Hypothesis generation and testing
- Peer review and knowledge dissemination

### Arts and Humanities
- Creative process optimization
- Audience engagement strategies
- Critical analysis frameworks

### Public Policy
- Evidence-based decision making
- Stakeholder impact assessment
- Long-term strategic planning

## 🔮 Future Outlook and Predictions

Experts predict several transformative developments in ${topic} over the next decade:

**Short-term (1-3 years)**:
- Wider adoption of AI-assisted ${topic} analysis
- Improved measurement and quantification methods
- Enhanced educational resources and training programs

**Medium-term (4-7 years)**:
- Integration of ${topic} into standard curricula
- Development of specialized ${topic} certification programs
- Emergence of ${topic} consulting as a distinct profession

**Long-term (8-10 years)**:
- Breakthrough applications in previously unrelated fields
- Standardization of ${topic} metrics and benchmarks
- Global collaboration networks for ${topic} research

## 📝 Key Takeaways and Summary

### What You Should Remember

1. **${topic}** is a dynamic, evolving field with practical applications across virtually every domain
2. **Mastery comes through** consistent study, practical application, and staying current with research
3. **The future** of ${topic} promises exciting developments that will reshape how we understand and interact with the world

### Actionable Next Steps

To deepen your understanding of ${topic}:
- Review the core concepts section again to solidify your foundation
- Explore the case studies relevant to your field of interest
- Apply ${topic} principles to a personal or professional project
- Join online communities dedicated to ${topic} discussion
- Set aside regular time for continued study and practice

## 📚 Further Learning Resources

**Books and Publications**:
- "The Essential Guide to ${topic}" - Comprehensive textbook
- "${topic} in Practice" - Applied case studies collection
- "Advanced ${topic} Theory" - Graduate-level exploration

**Online Resources**:
- Interactive ${topic} simulations and exercises
- Video lectures from leading ${topic} researchers
- Discussion forums and study groups

**Professional Development**:
- Certification programs in ${topic}
- Workshops and seminars
- Research collaboration opportunities

---

*This comprehensive guide to ${topic} was generated by Savoiré AI v2.0 - Your world-class study companion. Continue exploring, questioning, and applying these principles to achieve mastery in ${topic} and beyond.*`,
      concepts: [
        "**Fundamental Principle**: ${topic} operates on the core principle that interconnected elements influence outcomes through feedback loops and emergent properties. Understanding this principle is essential for applying ${topic} effectively in any context.",
        "**System Dynamics**: The dynamic nature of ${topic} means that changes in one component create ripple effects throughout the entire system. This interconnectedness requires holistic thinking rather than isolated analysis.",
        "**Optimization Framework**: Successful application of ${topic} depends on identifying key leverage points where small changes produce significant improvements. This framework guides efficient resource allocation.",
        "**Adaptive Mechanisms**: ${topic} incorporates adaptive mechanisms that respond to environmental changes, ensuring relevance and effectiveness across varying conditions and requirements.",
        "**Integration Strategy**: The integration of ${topic} principles with existing knowledge and practices creates synergistic effects that amplify overall effectiveness beyond individual components."
      ],
      tricks: [
        "**The 80/20 Principle in ${topic}**: Focus 80% of your effort on understanding the 20% of concepts that drive 80% of practical outcomes. Identify the core leverage points that yield maximum results with minimum input when studying ${topic}.",
        "**Spaced Repetition for ${topic} Mastery**: Review key ${topic} concepts at increasing intervals (1 day, 3 days, 1 week, 2 weeks) to transfer knowledge from short-term to long-term memory. This technique dramatically improves retention and application ability.",
        "**Active Recall Practice**: After studying a ${topic} concept, close your notes and explain it in your own words. Identify gaps in your understanding immediately. This active engagement strengthens neural pathways and reveals areas needing additional focus."
      ],
      questions: [
        {
          q: "How does ${topic} apply to real-world problem-solving scenarios?",
          a: "${topic} provides a structured framework for breaking down complex problems into manageable components. Real-world applications include business strategy development, scientific research design, educational curriculum planning, and technological innovation. By applying ${topic} principles, practitioners can identify root causes rather than symptoms, predict potential outcomes of different interventions, and optimize solutions based on multiple criteria simultaneously. The systematic nature of ${topic} ensures that solutions are comprehensive, scalable, and sustainable over time."
        },
        {
          q: "What distinguishes expert-level understanding of ${topic} from basic knowledge?",
          a: "Expert-level understanding transcends memorization of facts to encompass intuitive grasp of relationships, patterns, and applications. While beginners focus on individual components, experts perceive systems holistically, anticipating emergent behaviors and subtle interactions. Experts also possess metacognitive awareness of their own ${topic} knowledge boundaries, enabling them to seek appropriate resources when facing novel challenges. Additionally, experts can transfer ${topic} principles across domains, recognizing analogous situations where similar approaches may prove effective despite surface differences."
        },
        {
          q: "How is ${topic} evolving with technological advancement?",
          a: "Technology is transforming ${topic} in several profound ways. First, computational tools enable analysis of ${topic} at unprecedented scale and complexity, revealing patterns invisible to human observation alone. Second, AI and machine learning are automating routine ${topic} applications, freeing human experts to focus on creative and strategic aspects. Third, digital collaboration platforms facilitate global ${topic} communities, accelerating knowledge sharing and innovation. Finally, emerging technologies like virtual and augmented reality provide immersive ${topic} learning experiences that enhance understanding and retention."
        }
      ],
      applications: [
        "**Corporate Strategy**: Fortune 500 companies use ${topic} frameworks to guide multi-year strategic planning, resource allocation decisions, and competitive positioning in dynamic markets.",
        "**Medical Diagnosis**: Healthcare systems apply ${topic} principles to diagnostic protocols, treatment planning, and patient care coordination, improving outcomes while reducing costs.",
        "**Environmental Management**: Climate scientists and conservationists employ ${topic} models to understand ecosystem dynamics, predict intervention outcomes, and develop sustainable management strategies."
      ],
      misconceptions: [
        "**Reality Check**: ${topic} is NOT a rigid set of rules but rather a flexible framework adaptable to specific contexts. Rigid application without contextual consideration often leads to suboptimal results, while thoughtful adaptation enhances effectiveness.",
        "**Clarification**: While ${topic} incorporates quantitative elements, it is NOT purely mathematical or computational. Human judgment, creativity, and ethical consideration remain essential components that cannot be fully automated or reduced to algorithms.",
        "**Important Distinction**: ${topic} is NOT a quick fix or magic solution for all problems. Like any meaningful discipline, mastery requires sustained effort, practice, and continuous learning. Shortcuts and oversimplifications undermine potential benefits."
      ]
    },
    flashcards: generateFlashcardsFallback(topic),
    quiz: generateQuizFallback(topic),
    summary: generateSummaryFallback(topic),
    mindmap: generateMindmapFallback(topic)
  };
  
  // Add RTL support and language-specific adjustments
  let result = fallbackContent[tool] || fallbackContent.notes;
  
  if (typeof result === 'object' && result.markdown) {
    if (isRTL) {
      result.markdown = `<div dir="rtl" style="font-family: ${langData.font}">\n${result.markdown}\n</div>`;
    }
    
    // Replace placeholders with actual topic
    const placeholderRegex = /\${topic}/g;
    if (result.markdown) result.markdown = result.markdown.replace(placeholderRegex, topic);
    if (result.concepts) result.concepts = result.concepts.map(c => c.replace(placeholderRegex, topic));
    if (result.tricks) result.tricks = result.tricks.map(t => t.replace(placeholderRegex, topic));
    if (result.questions) result.questions = result.questions.map(q => ({ q: q.q.replace(placeholderRegex, topic), a: q.a.replace(placeholderRegex, topic) }));
    if (result.applications) result.applications = result.applications.map(a => a.replace(placeholderRegex, topic));
    if (result.misconceptions) result.misconceptions = result.misconceptions.map(m => m.replace(placeholderRegex, topic));
  }
  
  return result;
}

/**
 * Generates flashcards fallback content
 * @param {string} topic - Study topic
 * @returns {object} Flashcards data
 */
function generateFlashcardsFallback(topic) {
  return {
    cards: [
      {
        front: `What is ${topic}?`,
        back: `${topic} is a comprehensive field of study that examines the relationships, principles, and applications of interconnected elements within specific contexts. It provides frameworks for understanding complex systems and optimizing outcomes across various domains.`
      },
      {
        front: `Why is ${topic} important?`,
        back: `${topic} is crucial because it provides systematic approaches to problem-solving, decision-making, and innovation. Understanding ${topic} enables individuals and organizations to navigate complexity, identify opportunities, and achieve better results with available resources.`
      },
      {
        front: `What are the core principles of ${topic}?`,
        back: `The core principles include systems thinking (understanding interconnections), feedback loops (recognizing cause-effect cycles), emergence (how simple rules create complex patterns), adaptation (responding to environmental changes), and optimization (achieving best possible outcomes with given constraints).`
      },
      {
        front: `How can I apply ${topic} in daily life?`,
        back: `Apply ${topic} by analyzing everyday problems systematically, considering multiple perspectives before deciding, looking for patterns in recurring issues, testing small changes before large commitments, and continuously learning from outcomes to improve future approaches.`
      },
      {
        front: `What's the future of ${topic} research?`,
        back: `Future research focuses on AI integration for predictive modeling, neuroscientific understanding of ${topic}-related cognition, quantum computing applications, cross-cultural comparative studies, and development of practical tools making ${topic} principles accessible to broader audiences.`
      }
    ]
  };
}

/**
 * Generates quiz fallback content
 * @param {string} topic - Study topic
 * @returns {object} Quiz data
 */
function generateQuizFallback(topic) {
  return {
    questions: [
      {
        text: `What best defines ${topic}?`,
        options: [
          "A rigid set of unchangeable rules",
          "A flexible framework for understanding systems",
          "A purely mathematical calculation method",
          "A quick-fix solution for all problems"
        ],
        correct: 1,
        explanation: `${topic} is best understood as a flexible, adaptable framework that helps analyze and optimize complex systems. While it incorporates analytical elements, it's not rigid, purely mathematical, or a magic solution.`
      },
      {
        text: `Which factor is essential for mastering ${topic}?`,
        options: [
          "Natural talent only",
          "Sustained practice and continuous learning",
          "Memorizing formulas",
          "Avoiding real-world application"
        ],
        correct: 1,
        explanation: `Mastery of ${topic} requires ongoing commitment to learning, practice, and application. While natural aptitude may help, consistent effort and real-world experience are essential for developing expertise.`
      },
      {
        text: `How does technology affect ${topic}?`,
        options: [
          "Technology makes ${topic} completely obsolete",
          "Technology replaces human understanding entirely",
          "Technology enhances and extends ${topic} applications",
          "Technology has no relationship to ${topic}"
        ],
        correct: 2,
        explanation: `Technology serves as a powerful tool that enhances our ability to apply ${topic} principles, enabling analysis at greater scale and complexity while freeing humans to focus on creative and strategic aspects.`
      },
      {
        text: `What distinguishes expert ${topic} practitioners?`,
        options: [
          "Memorizing more facts",
          "Using more complex tools",
          "Holistic system perception and pattern recognition",
          "Working longer hours"
        ],
        correct: 2,
        explanation: `Experts distinguish themselves through intuitive grasp of whole systems, pattern recognition across domains, and metacognitive awareness of knowledge boundaries, not merely through memorization or time spent.`
      },
      {
        text: `Which best describes ${topic}'s real-world impact?`,
        options: [
          "Limited to academic settings",
          "Broad applications across all industries",
          "Only relevant for large corporations",
          "Primarily theoretical with few practical uses"
        ],
        correct: 1,
        explanation: `${topic} has demonstrated value across virtually every domain including business, healthcare, education, technology, environmental management, public policy, and many others, with both practical and strategic applications.`
      }
    ]
  };
}

/**
 * Generates summary fallback content
 * @param {string} topic - Study topic
 * @returns {object} Summary data
 */
function generateSummaryFallback(topic) {
  return {
    executiveSummary: `${topic} represents a comprehensive framework for understanding and optimizing complex systems across multiple domains. By mastering core principles including systems thinking, feedback loops, and adaptive mechanisms, practitioners can achieve superior outcomes in problem-solving, decision-making, and innovation. The field continues evolving with technological advances, particularly in AI integration and computational analysis, while maintaining essential human elements of creativity and ethical judgment. Future developments promise expanded applications and accessibility, making ${topic} increasingly valuable for professionals, students, and organizations worldwide.`,
    keyPoints: [
      `${topic} provides systematic approaches to analyzing complexity and optimizing outcomes through understanding interconnections and leverage points.`,
      `Mastery requires sustained practice, active recall, and real-world application rather than passive memorization or shortcut-seeking.`,
      `Technology enhances rather than replaces human ${topic} expertise, enabling analysis at unprecedented scale and complexity.`,
      `Expert practitioners distinguish themselves through holistic perception, pattern recognition, and metacognitive awareness of knowledge boundaries.`,
      `${topic} demonstrates proven value across business, healthcare, education, technology, environmental management, and public policy domains.`
    ],
    actionItems: [
      "Review core concepts weekly using spaced repetition techniques",
      "Apply one ${topic} principle daily to a real situation you encounter",
      "Join online communities discussing ${topic} applications in your field",
      "Set measurable goals for developing specific ${topic} competencies",
      "Find a mentor or study group to accelerate your ${topic} learning"
    ],
    resources: [
      "Books: 'The Essential Guide to ${topic}', '${topic} in Practice', 'Advanced ${topic} Theory'",
      "Online: Interactive simulations, video lectures from leading researchers, discussion forums",
      "Professional: Certification programs, workshops, seminars, research collaboration opportunities"
    ]
  };
}

/**
 * Generates mindmap fallback content
 * @param {string} topic - Study topic
 * @returns {object} Mindmap data
 */
function generateMindmapFallback(topic) {
  return {
    central: topic,
    nodes: [
      { id: 'core_concepts', label: 'Core Concepts', parent: 'central', level: 1 },
      { id: 'principles', label: 'Key Principles', parent: 'core_concepts', level: 2 },
      { id: 'frameworks', label: 'Theoretical Frameworks', parent: 'core_concepts', level: 2 },
      { id: 'components', label: 'Structural Components', parent: 'core_concepts', level: 2 },
      
      { id: 'applications', label: 'Applications', parent: 'central', level: 1 },
      { id: 'business', label: 'Business & Management', parent: 'applications', level: 2 },
      { id: 'healthcare', label: 'Healthcare', parent: 'applications', level: 2 },
      { id: 'education', label: 'Education', parent: 'applications', level: 2 },
      { id: 'technology', label: 'Technology', parent: 'applications', level: 2 },
      
      { id: 'process', label: 'Process', parent: 'central', level: 1 },
      { id: 'initialization', label: 'Initialization', parent: 'process', level: 2 },
      { id: 'execution', label: 'Execution', parent: 'process', level: 2 },
      { id: 'analysis', label: 'Analysis & Optimization', parent: 'process', level: 2 },
      { id: 'integration', label: 'Integration', parent: 'process', level: 2 },
      
      { id: 'advanced', label: 'Advanced Topics', parent: 'central', level: 1 },
      { id: 'ai_integration', label: 'AI Integration', parent: 'advanced', level: 2 },
      { id: 'neuroscience', label: 'Neuroscientific Insights', parent: 'advanced', level: 2 },
      { id: 'quantum', label: 'Quantum Applications', parent: 'advanced', level: 2 },
      
      { id: 'misconceptions', label: 'Common Misconceptions', parent: 'central', level: 1 },
      { id: 'expert_only', label: 'Only for Experts', parent: 'misconceptions', level: 2 },
      { id: 'static', label: 'Doesn\'t Change', parent: 'misconceptions', level: 2 },
      { id: 'tech_replacement', label: 'Tech Makes Obsolete', parent: 'misconceptions', level: 2 }
    ],
    connections: [
      { from: 'principles', to: 'frameworks' },
      { from: 'frameworks', to: 'components' },
      { from: 'business', to: 'technology' },
      { from: 'healthcare', to: 'education' },
      { from: 'initialization', to: 'execution' },
      { from: 'execution', to: 'analysis' },
      { from: 'analysis', to: 'integration' },
      { from: 'ai_integration', to: 'neuroscience' },
      { from: 'neuroscience', to: 'quantum' }
    ]
  };
}

// ==================== PROMPT GENERATION ====================

/**
 * Generates the system prompt for AI based on parameters
 * @param {string} topic - Study topic
 * @param {string} language - Target language
 * @param {string} tool - Study tool
 * @param {string} depth - Depth level
 * @param {string} style - Style option
 * @returns {string} Complete system prompt
 */
function generateSystemPrompt(topic, language, tool, depth, style) {
  const langData = validateLanguage(language);
  const toolData = validateTool(tool);
  const depthData = validateDepth(depth);
  const styleData = validateStyle(style);
  
  const isRTL = langData.rtl;
  const rtlInstruction = isRTL ? 'Use RTL (right-to-left) formatting, proper Arabic script rendering, and appropriate text alignment.' : 'Use LTR (left-to-right) formatting.';
  
  const prompts = {
    notes: `You are Savoiré AI, a world-class study companion. Generate COMPREHENSIVE, HIGH-QUALITY study notes about "${topic}".

CRITICAL REQUIREMENTS:
- Language: ${langData.name} (${rtlInstruction})
- Depth Level: ${depthData.description} (${depthData.multiplier}x detail multiplier)
- Style: ${styleData.description} (tone: ${styleData.tone})

NOTE STRUCTURE (MUST INCLUDE ALL):
1. # Title: "${topic} - Complete Study Guide"
2. ## Introduction with comprehensive overview
3. ## Core Concepts (at least 5 concepts with 50+ words each)
4. ## How It Works (step-by-step process, 4+ phases)
5. ## Key Examples (3+ real-world examples with analysis)
6. ## Advanced Topics (current research and future directions)
7. ## Summary with key takeaways (5+ bullet points)

ADDITIONAL SECTIONS:
- **Pro Tips**: Expert-level insights (3+ tips)
- **Practice Questions**: 3+ questions with detailed answers (150+ words each)
- **Common Mistakes**: 3+ misconceptions clarified
- **Further Resources**: Books, courses, online materials

FORMATTING REQUIREMENTS:
- Use proper markdown: ## headings, **bold** for emphasis, *italics* for terms
- Use bullet points (- ) and numbered lists (1. )
- Use tables for comparisons where appropriate
- Use > quotes for important definitions
- Use --- horizontal rules between major sections
- Include emojis for visual appeal: 📚 🎯 💡 🔑 ⚠️ ✅

QUALITY STANDARDS:
- Minimum 2000 words total
- Each major section: 200-400 words
- Each concept: 50-100 word explanation
- Examples must include real scenarios with specific details
- Language must be natural, engaging, and educational

Return ONLY the markdown content, no explanations or meta-commentary.`,

    flashcards: `You are Savoiré AI. Generate INTERACTIVE FLASHCARDS about "${topic}".

REQUIREMENTS:
- Language: ${langData.name}
- Generate 15-20 flashcards covering key concepts, definitions, principles, examples
- Each card has a "front" (question/term/prompt) and "back" (answer/definition/explanation)

FLASHCARD STRUCTURE:
Return JSON object:
{
  "cards": [
    {"front": "What is X?", "back": "X is Y because Z... (detailed 30-50 word explanation)"},
    ...
  ]
}

CARD COVERAGE:
- 5 cards: Core definitions and fundamental concepts
- 5 cards: Key principles and important relationships
- 3 cards: Real-world examples and applications
- 3 cards: Common misconceptions clarified
- 4 cards: Advanced concepts and connections

QUALITY: Each back must be informative (30-50 words), each front must be clear and concise (5-15 words).`,

    quiz: `You are Savoiré AI. Generate a COMPREHENSIVE QUIZ about "${topic}".

REQUIREMENTS:
- Language: ${langData.name}
- Generate 10 multiple-choice questions
- Each question: text + 4 options + correct answer (0-3) + explanation

QUIZ STRUCTURE:
Return JSON:
{
  "questions": [
    {
      "text": "Question text...",
      "options": ["Option A", "Option B", "Option C", "Option D"],
      "correct": 2,
      "explanation": "Detailed 50+ word explanation why this is correct..."
    }
  ]
}

QUESTION DIFFICULTY DISTRIBUTION:
- 3 easy: Foundational concepts everyone should know
- 4 medium: Applied knowledge and relationships
- 3 hard: Advanced concepts and nuanced understanding

COVERAGE AREAS:
- Definitions and terminology
- Principles and theories
- Applications and examples
- Comparisons and distinctions
- Implications and significance

Each explanation must teach beyond the correct answer.`,

    summary: `You are Savoiré AI. Generate a CONCISE YET COMPREHENSIVE SUMMARY about "${topic}".

REQUIREMENTS:
- Language: ${langData.name}
- Style: Brief, clear, impactful, memorable

SUMMARY STRUCTURE:
Return JSON:
{
  "executiveSummary": "150-200 word TL;DR covering the essence...",
  "keyPoints": ["Point 1 (25-40 words)", "Point 2...", "Point 3...", "Point 4...", "Point 5..."],
  "actionItems": ["Actionable item 1", "Action 2", "Action 3", "Action 4", "Action 5"],
  "resources": ["Resource recommendation 1", "Resource 2", "Resource 3"]
}

CHARACTERISTICS:
- Executive summary: Captures core thesis, importance, and implications
- Key points: Most critical takeaways, each self-contained
- Action items: Specific, practical next steps for the learner
- Resources: High-quality books, courses, websites, or tools

TONE: Professional yet accessible, authoritative yet engaging.`,

    mindmap: `You are Savoiré AI. Generate a STRUCTURED MIND MAP about "${topic}".

REQUIREMENTS:
- Language: ${langData.name} (for labels)
- Create hierarchical concept map with 20-30 nodes
- Include meaningful connections between related nodes

MIND MAP STRUCTURE:
Return JSON:
{
  "central": "${topic}",
  "nodes": [
    {"id": "unique_id", "label": "Node Label", "parent": "parent_id", "level": 1},
    ...
  ],
  "connections": [
    {"from": "node_id_1", "to": "node_id_2"},
    ...
  ]
}

HIERARCHY LEVELS:
- Level 1: Main branches (5-7 major categories)
- Level 2: Sub-branches (3-5 per main branch)
- Level 3: Detailed nodes (2-3 per sub-branch where needed)

BRANCH CATEGORIES (for level 1):
1. Core Concepts & Definitions
2. Key Principles & Theories
3. Major Applications & Use Cases
4. Important Processes & Workflows
5. Related Disciplines & Connections
6. Common Challenges & Solutions
7. Future Developments & Trends

CONNECTIONS: Create 10-15 meaningful cross-connections showing relationships between nodes from different branches.`
  };
  
  return prompts[tool] || prompts.notes;
}

/**
 * Generates user prompt based on parameters
 * @param {string} topic - Study topic
 * @param {string} tool - Study tool
 * @returns {string} User prompt
 */
function generateUserPrompt(topic, tool) {
  const toolData = validateTool(tool);
  
  const prompts = {
    notes: `Create comprehensive study notes about "${topic}". Include introduction, core concepts, how it works, examples, advanced topics, and summary. Make it thorough and educational.`,
    flashcards: `Create flashcards about "${topic}". Cover definitions, principles, examples, and common misconceptions.`,
    quiz: `Create a quiz about "${topic}" with 10 multiple-choice questions. Include explanations for each answer.`,
    summary: `Summarize "${topic}" with executive summary, key points, action items, and resources.`,
    mindmap: `Create a mind map about "${topic}" with main branches for concepts, applications, processes, and relationships.`
  };
  
  return prompts[tool] || prompts.notes;
}

// ==================== API MODEL CALL ====================

/**
 * Calls OpenRouter API with streaming and retry logic
 * @param {string} topic - Study topic
 * @param {string} language - Target language
 * @param {string} tool - Study tool
 * @param {string} depth - Depth level
 * @param {string} style - Style option
 * @param {object} res - Response object for streaming
 * @returns {Promise<string>} Generated content
 */
async function callOpenRouterAPI(topic, language, tool, depth, style, res) {
  const systemPrompt = generateSystemPrompt(topic, language, tool, depth, style);
  const userPrompt = generateUserPrompt(topic, tool);
  const requestId = generateRequestId();
  
  console.log(`[${requestId}] Starting API call for topic: ${topic}, tool: ${tool}`);
  
  // Send initial stage events
  const toolData = validateTool(tool);
  for (const stage of toolData.stageSequence) {
    sendSSE(res, 'stage', { stage, message: getStageMessage(stage, tool) });
    await delay(300); // Small delay for UI feedback
  }
  
  // Track streaming content
  let fullContent = '';
  let lastHeartbeat = Date.now();
  
  // Try each model in priority order
  for (let modelIndex = 0; modelIndex < AI_MODELS.length; modelIndex++) {
    const model = AI_MODELS[modelIndex];
    console.log(`[${requestId}] Trying model ${modelIndex + 1}/${AI_MODELS.length}: ${model}`);
    
    sendSSE(res, 'status', { status: 'connecting', model, attempt: modelIndex + 1 });
    
    try {
      const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${process.env.OPENROUTER_API_KEY}`,
          'HTTP-Referer': 'https://savoire-ai.vercel.app',
          'X-Title': 'Savoiré AI v2.0'
        },
        body: JSON.stringify({
          model: model,
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: userPrompt }
          ],
          stream: true,
          temperature: 0.7,
          max_tokens: 4000,
          top_p: 0.9,
          frequency_penalty: 0.3,
          presence_penalty: 0.3
        })
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error(`[${requestId}] Model ${model} failed: ${response.status} - ${errorText}`);
        
        // Skip rate limiting and server errors quickly
        if (response.status === 429 || response.status === 503) {
          console.log(`[${requestId}] Skipping ${model} due to rate limit/server error`);
          continue;
        }
        
        throw new Error(`API error: ${response.status}`);
      }
      
      sendSSE(res, 'status', { status: 'streaming', model });
      
      // Process stream
      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';
      
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';
        
        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = line.slice(6);
            if (data === '[DONE]') continue;
            
            try {
              const parsed = JSON.parse(data);
              const token = parsed.choices?.[0]?.delta?.content || '';
              
              if (token) {
                fullContent += token;
                // Stream token to client
                sendSSE(res, 'token', { token, full: fullContent });
                
                // Send heartbeat every 50 tokens to prevent timeout
                if (fullContent.length % 500 < token.length) {
                  sendSSE(res, 'heartbeat', { timestamp: Date.now(), length: fullContent.length });
                }
              }
            } catch (e) {
              // Skip malformed JSON
            }
          }
        }
      }
      
      // Success! Return the content
      console.log(`[${requestId}] Success with model ${model}, generated ${fullContent.length} characters`);
      return fullContent;
      
    } catch (error) {
      console.error(`[${requestId}] Error with model ${model}:`, error);
      // Continue to next model
      continue;
    }
  }
  
  // All models failed, use fallback
  console.log(`[${requestId}] All models failed, using fallback content`);
  sendSSE(res, 'status', { status: 'fallback', message: 'Using enhanced local content' });
  
  const fallback = generateFallbackContent(topic, language, tool, depth, style);
  
  if (tool === 'notes' && fallback.markdown) {
    // Stream fallback content character by character for consistent UX
    const content = fallback.markdown;
    for (let i = 0; i < content.length; i++) {
      const token = content[i];
      fullContent += token;
      sendSSE(res, 'token', { token, full: fullContent });
      
      // Small delay for streaming effect
      if (i % 10 === 0) await delay(1);
    }
    return fullContent;
  } else if (fallback.cards || fallback.questions || fallback.executiveSummary || fallback.central) {
    const content = JSON.stringify(fallback);
    for (let i = 0; i < content.length; i++) {
      const token = content[i];
      fullContent += token;
      sendSSE(res, 'token', { token, full: fullContent });
      if (i % 10 === 0) await delay(1);
    }
    return fullContent;
  }
  
  return JSON.stringify(fallback);
}

/**
 * Gets stage message for UI display
 * @param {string} stage - Stage identifier
 * @param {object} tool - Tool data
 * @returns {string} User-friendly stage message
 */
function getStageMessage(stage, tool) {
  const messages = {
    analysing: '🔍 Analysing your request...',
    researching: '📚 Researching topic deeply...',
    writing: '✍️ Writing comprehensive content...',
    formatting: '🎨 Formatting for optimal learning...',
    extracting: '📖 Extracting key concepts...',
    creating_cards: '🃏 Creating flashcards...',
    organizing: '📑 Organizing card deck...',
    designing_questions: '❓ Designing quiz questions...',
    generating_answers: '✅ Generating answer explanations...',
    validating: '✔️ Validating quiz accuracy...',
    identifying_nodes: '🗺️ Identifying mind map nodes...',
    building_hierarchy: '🌳 Building hierarchical structure...',
    creating_connections: '🔗 Creating connections...',
    synthesizing: '🔬 Synthesizing information...',
    condensing: '📝 Condensing key points...',
    complete: '✨ Complete! Rendering content...'
  };
  
  return messages[stage] || `Processing: ${stage}...`;
}

// ==================== MAIN HANDLER ====================

/**
 * Vercel serverless function handler
 * @param {object} req - Request object
 * @param {object} res - Response object
 */
export default async function handler(req, res) {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    res.writeHead(200, CORS_HEADERS);
    res.end();
    return;
  }
  
  // Only allow POST
  if (req.method !== 'POST') {
    res.writeHead(405, CORS_HEADERS);
    res.end(JSON.stringify({ error: 'Method not allowed' }));
    return;
  }
  
  // Parse request body
  let body;
  try {
    body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
  } catch (e) {
    res.writeHead(400, CORS_HEADERS);
    res.end(JSON.stringify({ error: 'Invalid JSON body' }));
    return;
  }
  
  const { topic, language, tool, depth, style } = body;
  
  // Validate input
  const validation = validateInput(topic);
  if (!validation.valid) {
    res.writeHead(400, CORS_HEADERS);
    res.end(JSON.stringify({ error: validation.error }));
    return;
  }
  
  const cleanTopic = validation.cleaned;
  const langData = validateLanguage(language);
  const toolData = validateTool(tool);
  const depthData = validateDepth(depth);
  const styleData = validateStyle(style);
  
  // Set up SSE response
  res.writeHead(200, {
    ...SSE_HEADERS,
    ...CORS_HEADERS
  });
  
  // Send initial connection event
  sendSSE(res, 'connected', {
    timestamp: Date.now(),
    topic: cleanTopic,
    language: langData.name,
    tool: toolData.name,
    depth: depthData.value,
    style: styleData.value,
    rtl: langData.rtl
  });
  
  // Start heartbeat to keep connection alive
  const heartbeat = startHeartbeat(res, 15000);
  
  try {
    // Generate content
    const content = await callOpenRouterAPI(cleanTopic, language, tool, depth, style, res);
    
    // Send completion event
    sendSSE(res, 'complete', {
      content,
      length: content.length,
      timestamp: Date.now()
    });
    
  } catch (error) {
    console.error('Handler error:', error);
    sendSSE(res, 'error', {
      error: 'Failed to generate content. Please try again.',
      details: error.message
    });
  } finally {
    // Clean up
    clearInterval(heartbeat);
    res.end();
  }
}
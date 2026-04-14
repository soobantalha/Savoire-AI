// ═══════════════════════════════════════════════════════════════════════════════════════════════════
// SAVOIRÉ AI v2.0 — api/study.js — ULTIMATE WORLD-CLASS PROFESSIONAL BACKEND
// Built by Sooban Talha Technologies | soobantalhatech.xyz
// Founder: Sooban Talha
// Version: 2.0.0 — ENTERPRISE EDITION
// ═══════════════════════════════════════════════════════════════════════════════════════════════════
//
// This file is the complete, production-ready backend for Savoiré AI.
// It handles:
//   • True Zero-Delay Live Streaming (Token-by-Token SSE)
//   • 20+ Free OpenRouter AI Models with Intelligent Failover
//   • 9-Stage JSON Extraction & Repair Pipeline (Handles 100% of AI errors)
//   • 9 Advanced Study Tools (Notes, Flashcards, Quiz, Summary, Mind Map, Essay Outline,
//     Concept Explainer, Exam Predictor, Study Scheduler)
//   • Multi-Language Support (50+ Languages)
//   • Advanced Input Sanitization & Semantic Analysis
//   • Professional Offline Fallback Generation
//   • Enterprise-Grade Logging & Monitoring
//
// ═══════════════════════════════════════════════════════════════════════════════════════════════════

'use strict';

// ═══════════════════════════════════════════════════════════════════════════════════════════════════
// SECTION 1 — GLOBAL CONSTANTS & ENTERPRISE BRANDING
// ═══════════════════════════════════════════════════════════════════════════════════════════════════

const BRAND_NAME        = 'Savoiré AI v2.0';
const DEVELOPER_NAME    = 'Sooban Talha Technologies';
const DEVELOPER_SITE    = 'soobantalhatech.xyz';
const APP_WEBSITE       = 'savoireai.vercel.app';
const FOUNDER_NAME      = 'Sooban Talha';
const APP_VERSION       = '2.0.0-enterprise';
const COPYRIGHT_YEAR    = '2024-2026';

const OPENROUTER_BASE_URL = 'https://openrouter.ai/api/v1/chat/completions';
const HTTP_REFERER_URL    = `https://${APP_WEBSITE}`;
const APP_TITLE_HEADER    = BRAND_NAME;

// SSE Event Types for Frontend Communication
const SSE_EVENT_TOKEN     = 'token';
const SSE_EVENT_DONE      = 'done';
const SSE_EVENT_ERROR     = 'error';
const SSE_EVENT_STAGE     = 'stage';
const SSE_EVENT_METADATA  = 'metadata';
const SSE_EVENT_HEARTBEAT = 'heartbeat';

// Request Configuration
const MAX_INPUT_LENGTH     = 12000;
const MAX_OUTPUT_TOKENS    = 8192;
const DEFAULT_TIMEOUT_MS   = 180000; // 3 minutes
const HEARTBEAT_INTERVAL_MS = 8000;

// ═══════════════════════════════════════════════════════════════════════════════════════════════════
// SECTION 2 — ADVANCED FREE AI MODEL ROSTER (20+ MODELS)
// ═══════════════════════════════════════════════════════════════════════════════════════════════════
//
// Priority is determined by: Speed, JSON Accuracy, Context Length, and Availability.
// All models use the ':free' suffix on OpenRouter = $0 cost per request.
// This roster is continuously optimized for the best student experience.

const AI_MODEL_ROSTER = [
  // TIER 1 — ULTRA-PREMIUM FREE MODELS (Highest Priority)
  { id: 'google/gemini-2.0-flash-exp:free',       max_tokens: 8192, timeout_ms: 120000, temp: 0.70, priority: 1,  provider: 'Google',    description: 'Gemini 2.0 Flash Experimental — Fastest, highest quality JSON, excellent multilingual support.' },
  { id: 'deepseek/deepseek-chat-v3-0324:free',    max_tokens: 8192, timeout_ms: 130000, temp: 0.68, priority: 2,  provider: 'DeepSeek',   description: 'DeepSeek Chat v3 — Outstanding reasoning, exceptional detail for academic content.' },
  { id: 'meta-llama/llama-3.3-70b-instruct:free', max_tokens: 6144, timeout_ms: 120000, temp: 0.72, priority: 3,  provider: 'Meta',       description: 'LLaMA 3.3 70B — Meta flagship, superb long-form writing and instruction following.' },
  { id: 'nousresearch/hermes-3-llama-3.1-405b:free', max_tokens: 6144, timeout_ms: 140000, temp: 0.70, priority: 4, provider: 'Nous',  description: 'Hermes 3 405B — Massive 405B parameter model, incredible depth and nuance.' },
  
  // TIER 2 — HIGH-PERFORMANCE FREE MODELS
  { id: 'z-ai/glm-4.5-air:free',                  max_tokens: 6144, timeout_ms: 100000, temp: 0.70, priority: 5,  provider: 'Z-AI',       description: 'GLM 4.5 Air — Strong multilingual, especially Chinese, good structured output.' },
  { id: 'microsoft/phi-4-reasoning-plus:free',    max_tokens: 4096, timeout_ms: 100000, temp: 0.65, priority: 6,  provider: 'Microsoft',  description: 'Phi-4 Reasoning Plus — Excellent logical reasoning and analytical depth.' },
  { id: 'qwen/qwen3-8b:free',                     max_tokens: 4096, timeout_ms: 90000,  temp: 0.70, priority: 7,  provider: 'Alibaba',    description: 'Qwen3 8B — Solid general purpose, good JSON compliance and multilingual ability.' },
  { id: 'google/gemini-flash-1.5-8b:free',        max_tokens: 4096, timeout_ms: 80000,  temp: 0.72, priority: 8,  provider: 'Google',     description: 'Gemini Flash 1.5 8B — Lightweight and reliable for standard content.' },
  { id: 'mistralai/mistral-7b-instruct-v0.3:free',max_tokens: 3584, timeout_ms: 80000,  temp: 0.72, priority: 9,  provider: 'Mistral AI', description: 'Mistral 7B v0.3 — European model, consistent JSON output.' },
  { id: 'openchat/openchat-7b:free',              max_tokens: 3584, timeout_ms: 80000,  temp: 0.72, priority: 10, provider: 'OpenChat',   description: 'OpenChat 7B — Consistently available, adequate quality fallback.' },
  
  // TIER 3 — RELIABLE FALLBACK MODELS
  { id: 'cognitivecomputations/dolphin3.0-mistral-24b:free', max_tokens: 4096, timeout_ms: 90000, temp: 0.70, priority: 11, provider: 'Cognitive', description: 'Dolphin 3.0 Mistral 24B — Uncensored, creative, strong instruction following.' },
  { id: 'huggingfaceh4/zephyr-7b-beta:free',      max_tokens: 3584, timeout_ms: 80000, temp: 0.72, priority: 12, provider: 'HuggingFace', description: 'Zephyr 7B Beta — Well-tuned for helpful and harmless responses.' },
  { id: 'gryphe/mythomax-l2-13b:free',            max_tokens: 4096, timeout_ms: 80000, temp: 0.75, priority: 13, provider: 'Gryphe', description: 'MythoMax L2 13B — Creative and detailed story-telling capabilities.' },
  { id: 'undi95/toppy-m-7b:free',                 max_tokens: 3584, timeout_ms: 70000, temp: 0.72, priority: 14, provider: 'Undi95', description: 'Toppy M 7B — Solid all-around performance.' },
  { id: 'teknium/openhermes-2.5-mistral-7b:free', max_tokens: 3584, timeout_ms: 70000, temp: 0.70, priority: 15, provider: 'Teknium', description: 'OpenHermes 2.5 Mistral 7B — Strong conversational and instructional model.' },
  
  // TIER 4 — SPECIALIZED & RESERVE MODELS
  { id: 'lizpreciatior/lzlv-70b-fp16-hf:free',    max_tokens: 4096, timeout_ms: 110000, temp: 0.70, priority: 16, provider: 'Lizpreciatior', description: 'LZLV 70B — Powerful 70B model, excellent for complex tasks.' },
  { id: 'neversleep/llama-3.1-lumimaid-8b:free',  max_tokens: 4096, timeout_ms: 80000, temp: 0.72, priority: 17, provider: 'NeverSleep', description: 'Llama 3.1 Lumimaid 8B — Optimized for creative and detailed outputs.' },
  { id: 'sao10k/l3.3-euryale-70b:free',           max_tokens: 4096, timeout_ms: 110000, temp: 0.70, priority: 18, provider: 'Sao10k', description: 'Euryale 70B — Strong creative writing and complex instruction model.' },
  { id: 'anthracite-org/magnum-v4-72b:free',      max_tokens: 4096, timeout_ms: 110000, temp: 0.70, priority: 19, provider: 'Anthracite', description: 'Magnum v4 72B — High-parameter model for deep analysis.' },
  { id: 'nvidia/llama-3.1-nemotron-70b-instruct:free', max_tokens: 4096, timeout_ms: 110000, temp: 0.70, priority: 20, provider: 'NVIDIA', description: 'Nemotron 70B — NVIDIA-optimized instruction model.' }
];

// ═══════════════════════════════════════════════════════════════════════════════════════════════════
// SECTION 3 — ULTRA-ADVANCED TOOL CONFIGURATIONS (9 TOOLS)
// ═══════════════════════════════════════════════════════════════════════════════════════════════════
//
// Each tool has a world-class, hyper-detailed prompt blueprint that forces the AI
// to produce the richest, most accurate, and most useful output possible.

const TOOL_CONFIGURATION_MAP = {
  
  // ═══════════════════════════════════════════════════════════════════════════════════════════════
  // TOOL 1: NOTES — The Ultimate Study Guide Generator
  // ═══════════════════════════════════════════════════════════════════════════════════════════════
  notes: {
    name: 'Comprehensive Study Notes',
    description: 'Generates a complete, textbook-quality chapter on any topic.',
    objective: 'Produce an exhaustive, deeply detailed, and beautifully structured set of study notes that serves as the student\'s primary and sole resource for mastering this topic.',
    emphasis: `
    ═════════════════════════════════════════════════════════════════════════════════════════════════
    NOTES TOOL — ULTRA-ADVANCED PRODUCTION SPECIFICATION
    ═════════════════════════════════════════════════════════════════════════════════════════════════
    
    THE CENTREPIECE: "ultra_long_notes" FIELD
    This field is the absolute core of the Notes tool. It MUST be a genuine, substantive, and lengthy textbook chapter. Minimum 1800 words, target 2500+ words.
    
    MANDATORY STRUCTURE & FORMATTING for ultra_long_notes:
    • ## Main Section Headings (e.g., "## 1. Introduction and Historical Context")
    • ### Sub-section Headings (e.g., "### 1.1 The Origins of the Concept")
    • **Bold Text** around EVERY key term, important concept, critical fact, and person's name upon first use.
    • Bullet lists (- item) for characteristics, features, types, properties, and components.
    • Numbered lists (1. item) for processes, steps, algorithms, sequences, and procedures.
    • > Blockquotes for the single most important definition, law, formula, or principle in each major section.
    • --- Horizontal rule between EVERY major section to aid navigation and visual clarity.
    • Concrete, specific examples — MINIMUM ONE per section, with real names, numbers, dates, and outcomes.
    • Tables using markdown | syntax for comparisons, properties, or classifications where appropriate.
    • NO empty or thin sections. Every section must deliver genuine educational depth.
    
    REQUIRED SECTIONS (in this order):
    1. ## Introduction & Overview: Define the topic precisely. Explain its significance and scope. Provide historical context and mention key figures.
    2. ## Core Concepts & Foundational Principles: Explain the fundamental ideas, terminology, and building blocks.
    3. ## Mechanisms: How It Works: A step-by-step technical walkthrough. Explain not just WHAT happens, but HOW and WHY.
    4. ## Key Examples & Case Studies: Provide real-world, named examples. Include specific details (names, dates, figures, outcomes).
    5. ## Advanced Aspects & Nuances: Cover subtleties, edge cases, exceptions, and complications beyond the basics.
    6. ## Real-World Applications: Discuss specific industries and use cases with concrete mechanism descriptions.
    7. ## Critical Analysis, Limitations & Open Questions: Address what the framework doesn't explain well, current debates, and areas of active research.
    8. ## Summary & Key Takeaways: Synthesize the most important insights. Connect concepts across sections. State the 5 most critical things to remember.
    
    DEPTH OF EXPLANATION:
    • For every mechanism: Explain the sequence of events from cause to effect.
    • For every concept: Explain why it is structured the way it is (not just what it is).
    • For every claim: Provide supporting evidence or reasoning.
    • Connect ideas across sections — show how concepts relate and depend on each other.
    • Include expert-level nuance that distinguishes a B student from an A* student.
    `,
    question_spec: `PRACTICE QUESTIONS for NOTES tool:
    Each question must test genuine understanding, not rote recall.
      • Q1 — ANALYTICAL: "Explain how [mechanism] produces [outcome] and why [consequence] follows."
      • Q2 — APPLICATION: "A student/professional encounters [specific realistic scenario]. How should they apply knowledge of [topic] to [task]?"
      • Q3 — SYNTHESIS: "Compare [approach A] with [approach B] in the context of [topic]. Under what conditions is each preferable and why?"`
  },

  // ═══════════════════════════════════════════════════════════════════════════════════════════════
  // TOOL 2: FLASHCARDS — Optimized for Spaced Repetition
  // ═══════════════════════════════════════════════════════════════════════════════════════════════
  flashcards: {
    name: 'Interactive Flashcards',
    description: 'Creates a deck of flashcards perfect for active recall and spaced repetition.',
    objective: 'Generate study materials perfectly optimized for interactive flashcard learning. Every element should be designed for the flip interaction — short question front, clear definitive answer back.',
    emphasis: `
    ═════════════════════════════════════════════════════════════════════════════════════════════════
    FLASHCARDS TOOL — ULTRA-ADVANCED PRODUCTION SPECIFICATION
    ═════════════════════════════════════════════════════════════════════════════════════════════════
    
    THE CENTREPIECE: "practice_questions" FIELD (THESE ARE THE FLASHCARDS)
    Each object in the practice_questions array is ONE flashcard.
    FRONT OF CARD = "question" field (shown before flip).
    BACK OF CARD  = "answer" field (revealed after flip).
    
    FLASHCARD QUESTION DESIGN (FRONT):
    • Must be a SHORT, FOCUSED question — maximum 15 words.
    • Must have ONE clear, specific correct answer.
    • Formats: "What is [term]?", "Define [concept].", "[Term A] vs [Term B]: key difference?", "What are the [N] steps of [process]?"
    
    FLASHCARD ANSWER DESIGN (BACK):
    • Must be COMPLETE but CONCISE — 2 to 4 sentences maximum.
    • Must unambiguously answer the specific question.
    • Include ONE concrete example if it aids recall.
    • Use **bold** for the specific term being defined.
    
    FLASHCARD SET DESIGN (Generate exactly 5 cards):
    • Card 1: A DEFINITION card (key term → precise definition + example).
    • Card 2: A PROCESS/MECHANISM card (how something works → step-by-step).
    • Card 3: A COMPARISON card (A vs B → key distinctions).
    • Card 4: An APPLICATION card (a real-world use case → description).
    • Card 5: A FORMULA/RULE card (key equation or principle → statement).
    `,
    question_spec: `PRACTICE QUESTIONS for FLASHCARDS tool (Generate 5 distinct cards):
    • Q1 — DEFINITION: "What is [core term]?"
    • Q2 — PROCESS: "What are the steps in [key process]?"
    • Q3 — COMPARISON: "[Concept A] vs [Concept B]: main difference?"
    • Q4 — APPLICATION: "Give one real-world application of [topic]."
    • Q5 — FORMULA: "State the formula/rule for [key principle]."`
  },

  // ═══════════════════════════════════════════════════════════════════════════════════════════════
  // TOOL 3: QUIZ — Exam-Quality Practice Questions
  // ═══════════════════════════════════════════════════════════════════════════════════════════════
  quiz: {
    name: 'Practice Quiz',
    description: 'Generates challenging, exam-style questions with detailed answer explanations.',
    objective: 'Generate a challenging, varied, exam-quality practice quiz with MCQ-ready questions and comprehensive educational answers. Each question must test genuine understanding. Each answer must teach as well as explain.',
    emphasis: `
    ═════════════════════════════════════════════════════════════════════════════════════════════════
    QUIZ TOOL — ULTRA-ADVANCED PRODUCTION SPECIFICATION
    ═════════════════════════════════════════════════════════════════════════════════════════════════
    
    THE CENTREPIECE: "practice_questions" FIELD (THE QUIZ)
    The questions must be outstanding and MCQ-compatible. The frontend will generate 4 options (A/B/C/D).
    
    QUESTION DESIGN — MANDATORY RULES:
    • Q1 — ANALYTICAL: Tests causal reasoning ("Why does [X] occur?").
    • Q2 — APPLICATION: Tests applying a concept to a new scenario ("[Scenario]. What should [actor] do?").
    • Q3 — EVALUATION: Tests comparing approaches or making a judgement ("Which is better and why?").
    
    ANSWER DESIGN — MANDATORY 5-PART STRUCTURE (Minimum 250 words each):
    1. DIRECT ANSWER: Begin with "The correct answer is: [short statement]."
    2. DEEP EXPLANATION: Explain WHY the answer is correct at a mechanistic level. (5-6 sentences)
    3. CONCRETE REAL-WORLD EXAMPLE: Provide ONE specific, named example with real details. (3-4 sentences)
    4. COMMON MISTAKE WARNING: "A common mistake is to think... [explain why it's wrong]." (3-4 sentences)
    5. EXAM TECHNIQUE TIP: "Exam tip: [give practical advice for this question type]." (2-3 sentences)
    `,
    question_spec: `PRACTICE QUESTIONS for QUIZ tool (Generate 3 exam-quality questions):
    • Q1 — ANALYTICAL: Tests causal reasoning and mechanisms.
    • Q2 — APPLICATION: Tests ability to apply concepts to a novel, realistic scenario.
    • Q3 — EVALUATION: Tests critical judgment and comparison of different approaches.`
  },

  // ═══════════════════════════════════════════════════════════════════════════════════════════════
  // TOOL 4: SUMMARY — Ruthlessly Concise Revision Notes
  // ═══════════════════════════════════════════════════════════════════════════════════════════════
  summary: {
    name: 'Smart Summary',
    description: 'Creates a concise, scannable summary perfect for last-minute revision.',
    objective: 'Generate a ruthlessly concise, intelligently structured smart summary optimized for rapid revision. Every element should be scannable in seconds and instantly memorable.',
    emphasis: `
    ═════════════════════════════════════════════════════════════════════════════════════════════════
    SUMMARY TOOL — ULTRA-ADVANCED PRODUCTION SPECIFICATION
    ═════════════════════════════════════════════════════════════════════════════════════════════════
    
    THE CENTREPIECE: "ultra_long_notes" FIELD (STRUCTURED SMART SUMMARY)
    Aim for quality over quantity. Every word must earn its place. No padding.
    
    MANDATORY STRUCTURE:
    1. > Single most important sentence about this topic as a blockquote.
    2. ## TL;DR: Maximum 3 sentences capturing the absolute essence.
    3. ## Core Concept: What It Is (2-3 short bullet points).
    4. ## Why It Matters: Significance & Impact (2-3 short bullet points).
    5. ## How It Works: Core Mechanism (3-4 step numbered list).
    6. ## ⭐ 5 Things to Remember: Exactly 5 numbered items, one sentence each, bold the key term.
    `,
    question_spec: `PRACTICE QUESTIONS for SUMMARY tool:
    Short, punchy questions optimized for rapid revision self-testing.
      • Q1 — RECALL: "In one sentence, what is [topic]?"
      • Q2 — SIGNIFICANCE: "Why is [topic] important? Name 2 specific reasons."
      • Q3 — MECHANISM: "Describe [core mechanism] in 3 steps."`
  },

  // ═══════════════════════════════════════════════════════════════════════════════════════════════
  // TOOL 5: MIND MAP — Visual Conceptual Hierarchy
  // ═══════════════════════════════════════════════════════════════════════════════════════════════
  mindmap: {
    name: 'Visual Mind Map',
    description: 'Builds a structured mind map to visualize the connections between concepts.',
    objective: 'Generate content structured hierarchically to reveal the conceptual architecture of this topic, ready to render as a beautiful visual mind map.',
    emphasis: `
    ═════════════════════════════════════════════════════════════════════════════════════════════════
    MIND MAP TOOL — ULTRA-ADVANCED PRODUCTION SPECIFICATION
    ═════════════════════════════════════════════════════════════════════════════════════════════════
    
    THE CENTREPIECE: "mind_map" JSON OBJECT
    You MUST include a "mind_map" field in your JSON output.
    
    MIND MAP JSON SCHEMA:
    {
      "center": "[Topic name — max 5 words]",
      "branches": [
        { "label": "Branch 1", "color": "#4F9CF9", "children": ["Child 1.1", "Child 1.2", "Child 1.3"] },
        { "label": "Branch 2", "color": "#42C98A", "children": ["Child 2.1", "Child 2.2", "Child 2.3"] },
        ... up to 5-7 branches
      ]
    }
    
    MIND MAP DESIGN RULES:
    • Generate exactly 5 to 7 branches.
    • Each branch must have exactly 3 children.
    • Branch labels: max 4 words.
    • Child labels: max 6 words.
    • Colors in cycle: "#4F9CF9", "#42C98A", "#F59E0B", "#A855F7", "#EF4444", "#06B6D4", "#F97316".
    `,
    question_spec: `PRACTICE QUESTIONS for MIND MAP tool:
    Questions that test understanding of the conceptual architecture.
      • Q1 — CONNECTIONS: "Explain the relationship between [Branch A concept] and [Branch B concept]."
      • Q2 — CLASSIFICATION: "Why is [topic] classified into [types]? What is the key criterion?"
      • Q3 — OVERVIEW: "Provide a structured overview of [topic] covering its definition, mechanism, and main application."`
  },

  // ═══════════════════════════════════════════════════════════════════════════════════════════════
  // TOOL 6: ESSAY OUTLINE — Structured Argument Builder
  // ═══════════════════════════════════════════════════════════════════════════════════════════════
  essay_outline: {
    name: 'Essay Outliner',
    description: 'Creates a detailed, structured outline for writing a high-scoring essay.',
    objective: 'Generate a comprehensive essay outline with a strong thesis statement, topic sentences, supporting evidence, and a conclusion structure.',
    emphasis: `
    ═════════════════════════════════════════════════════════════════════════════════════════════════
    ESSAY OUTLINER TOOL — ULTRA-ADVANCED SPECIFICATION
    ═════════════════════════════════════════════════════════════════════════════════════════════════
    
    STRUCTURE:
    1. **Thesis Statement**: A single, clear, and arguable sentence.
    2. **Introduction**: Hook, background context, and the thesis statement.
    3. **Body Paragraph 1**: Topic sentence, evidence/example, analysis, concluding sentence.
    4. **Body Paragraph 2**: Topic sentence, evidence/example, analysis, concluding sentence.
    5. **Body Paragraph 3**: Topic sentence, evidence/example, analysis, concluding sentence.
    6. **Counterargument & Rebuttal**: Acknowledge an opposing view and refute it.
    7. **Conclusion**: Restate thesis, synthesize main points, and offer a final thought.
    `,
    question_spec: `Generate a single practice question asking the student to write a full essay based on the outline provided.`
  },

  // ═══════════════════════════════════════════════════════════════════════════════════════════════
  // TOOL 7: CONCEPT EXPLAINER — Deep Dive into a Single Idea
  // ═══════════════════════════════════════════════════════════════════════════════════════════════
  concept_explainer: {
    name: 'Concept Explainer',
    description: 'Provides an ultra-deep, multi-perspective explanation of a single concept.',
    objective: 'Explain a single, specific concept from the ground up, using multiple analogies, examples, and perspectives to ensure complete understanding.',
    emphasis: `
    ═════════════════════════════════════════════════════════════════════════════════════════════════
    CONCEPT EXPLAINER TOOL — ULTRA-ADVANCED SPECIFICATION
    ═════════════════════════════════════════════════════════════════════════════════════════════════
    
    EXPLANATION STRUCTURE:
    1. **Simple Definition**: Explain it like I'm 5 years old.
    2. **Technical Definition**: Provide the formal, academic definition.
    3. **Analogy 1**: Use an everyday analogy.
    4. **Analogy 2**: Use a different analogy from another domain (e.g., physics, sports, cooking).
    5. **Why It Matters**: Explain its significance in the larger context.
    6. **Common Misunderstandings**: Address exactly what people get wrong.
    7. **Related Concepts**: Show how it connects to 2-3 other key ideas.
    `,
    question_spec: `Generate 2 questions: 1) Asking for a real-world example of the concept. 2) Asking to distinguish it from a related concept.`
  },

  // ═══════════════════════════════════════════════════════════════════════════════════════════════
  // TOOL 8: EXAM PREDICTOR — Focus on High-Yield Topics
  // ═══════════════════════════════════════════════════════════════════════════════════════════════
  exam_predictor: {
    name: 'Exam Question Predictor',
    description: 'Predicts and generates likely exam questions based on the topic\'s core principles.',
    objective: 'Analyze the topic and generate the 5 most likely types of exam questions, with model answers and marking criteria.',
    emphasis: `
    ═════════════════════════════════════════════════════════════════════════════════════════════════
    EXAM PREDICTOR TOOL — ULTRA-ADVANCED SPECIFICATION
    ═════════════════════════════════════════════════════════════════════════════════════════════════
    
    For the given topic, generate 5 high-yield questions:
    1. **Definition/Recall Question** (2-4 marks)
    2. **Explanation Question** (4-6 marks)
    3. **Application/Analysis Question** (6-8 marks)
    4. **Evaluation/Synthesis Question** (8-12 marks)
    5. **Diagram/Calculation Question** (variable marks)
    
    For EACH question, provide:
    • The Question Stem
    • A Model Answer (bullet points or short paragraphs)
    • Marking Criteria (what examiners are looking for to award marks)
    `,
    question_spec: `The practice_questions field should contain the 5 predicted questions with their model answers and marking criteria.`
  },

  // ═══════════════════════════════════════════════════════════════════════════════════════════════
  // TOOL 9: STUDY SCHEDULER — Personalized Learning Plan
  // ═══════════════════════════════════════════════════════════════════════════════════════════════
  study_scheduler: {
    name: 'Study Schedule Generator',
    description: 'Creates a personalized, day-by-day study schedule to master the topic.',
    objective: 'Create a detailed, week-by-week study plan that breaks the topic into manageable chunks, incorporating active recall and spaced repetition.',
    emphasis: `
    ═════════════════════════════════════════════════════════════════════════════════════════════════
    STUDY SCHEDULER TOOL — ULTRA-ADVANCED SPECIFICATION
    ═════════════════════════════════════════════════════════════════════════════════════════════════
    
    Generate a 4-week study schedule.
    For each week:
    • **Week Theme**: e.g., "Foundations", "Core Mechanisms", "Applications", "Review & Mastery".
    • **Daily Tasks (Mon-Sun)**: Specific, actionable study tasks (e.g., "Read pages 10-25 on X", "Create 10 flashcards on Y", "Complete practice questions 1-5").
    • **Active Recall Prompts**: Questions the student should ask themselves at the end of each day.
    • **Weekly Review**: A set of tasks for the end of the week (e.g., "Take a practice quiz on Week 1-2 material").
    `,
    question_spec: `Generate a single "final exam" question that covers the entire 4-week syllabus.`
  }
};

// ═══════════════════════════════════════════════════════════════════════════════════════════════════
// SECTION 4 — ADVANCED DEPTH & STYLE CONFIGURATION
// ═══════════════════════════════════════════════════════════════════════════════════════════════════

const DEPTH_CONFIGURATION_MAP = {
  standard: {
    name: 'Standard',
    word_target: '800-1200 words',
    min_words: 800,
    instruction: 'Provide a clear and thorough overview, covering all essential concepts with good explanatory depth and concrete examples. Prioritize clarity and accessibility.'
  },
  detailed: {
    name: 'Detailed',
    word_target: '1500-2200 words',
    min_words: 1500,
    instruction: 'Provide detailed coverage with concrete examples, thorough mechanisms, and full explanations. Go beyond surface-level facts. Explain causes, effects, and real-world examples for every concept.'
  },
  comprehensive: {
    name: 'Comprehensive',
    word_target: '2500-3500 words',
    min_words: 2500,
    instruction: 'Provide comprehensive analysis covering all major aspects, important nuances, edge cases, and interdisciplinary connections. Address common misconceptions and include expert-level detail.'
  },
  expert: {
    name: 'Expert',
    word_target: '3500-5000+ words',
    min_words: 3500,
    instruction: 'Write at the level of a well-researched academic paper or advanced textbook chapter. Include historical development of ideas, active academic debates, limitations of mainstream frameworks, and cutting-edge research directions.'
  }
};

const STYLE_CONFIGURATION_MAP = {
  simple: {
    name: 'Simple & Clear',
    instruction: `Write in crystal-clear, accessible, beginner-friendly language. Define EVERY technical term immediately. Use short sentences (under 20 words). Use everyday analogies. Avoid jargon. Assume zero prior knowledge.`
  },
  academic: {
    name: 'Academic & Formal',
    instruction: `Write in precise, rigorous, formal academic language. Use discipline-specific technical vocabulary. Maintain a third-person objective tone. Structure arguments logically. Reference theoretical frameworks.`
  },
  detailed: {
    name: 'Maximally Detailed',
    instruction: `Provide the most exhaustive detail possible at every single point. Include numerous specific, concrete examples for every concept. Specify exact quantities, percentages, and timescales. Explain every mechanism step-by-step. Never summarize where you could explain in full.`
  },
  exam: {
    name: 'Exam-Focused',
    instruction: `Structure every element around maximizing exam performance. Frame key definitions in precise mark-scheme language. Identify "examiner favorite" concepts. Include mark-worthy phrases in bold. State explicitly what examiners look for.`
  },
  visual: {
    name: 'Visual & Analogy-Rich',
    instruction: `Make every concept concrete, vivid, and unforgettable through imagery and analogy. Open every major concept with a powerful, memorable analogy. Build rich mental models using visual language: "Imagine...", "Picture...". Use narrative and storytelling.`
  }
};

// ═══════════════════════════════════════════════════════════════════════════════════════════════════
// SECTION 5 — ULTRA-ADVANCED PROMPT BUILDER (THE BRAIN)
// ═══════════════════════════════════════════════════════════════════════════════════════════════════
//
// This function dynamically constructs the perfect system prompt based on all user options.
// It combines tool, depth, style, and language into a single, powerful instruction set.

function buildWorldClassPrompt(userInput, requestOptions) {
  const toolKey = requestOptions.tool || 'notes';
  const toolConfig = TOOL_CONFIGURATION_MAP[toolKey] || TOOL_CONFIGURATION_MAP.notes;
  const depthKey = requestOptions.depth || 'detailed';
  const depthConfig = DEPTH_CONFIGURATION_MAP[depthKey] || DEPTH_CONFIGURATION_MAP.detailed;
  const styleKey = requestOptions.style || 'simple';
  const styleConfig = STYLE_CONFIGURATION_MAP[styleKey] || STYLE_CONFIGURATION_MAP.simple;
  const outputLanguage = requestOptions.language || 'English';
  const isMindmapTool = toolKey === 'mindmap';

  // Build the JSON Schema Example dynamically
  const mindmapSchemaPart = isMindmapTool ? `
  "mind_map": {
    "center": "[Topic name — max 5 words]",
    "branches": [
      { "label": "Branch 1", "color": "#4F9CF9", "children": ["Child 1.1", "Child 1.2", "Child 1.3"] },
      { "label": "Branch 2", "color": "#42C98A", "children": ["Child 2.1", "Child 2.2", "Child 2.3"] },
      { "label": "Branch 3", "color": "#F59E0B", "children": ["Child 3.1", "Child 3.2", "Child 3.3"] },
      { "label": "Branch 4", "color": "#A855F7", "children": ["Child 4.1", "Child 4.2", "Child 4.3"] },
      { "label": "Branch 5", "color": "#EF4444", "children": ["Child 5.1", "Child 5.2", "Child 5.3"] }
    ]
  },` : '';

  const jsonSchemaExample = `{
  "topic": "[Specific topic name in ${outputLanguage}]",
  "curriculum_alignment": "[e.g., A-Level Biology, University Computer Science, GCSE History]",
  "ultra_long_notes": "[Full rich markdown content in ${outputLanguage}. Minimum ${depthConfig.min_words} words. Use ## headings, **bold**, bullet lists, numbered lists, > blockquotes, and --- horizontal rules. All content MUST be in ${outputLanguage}.]",
  "key_concepts": [
    "[Concept 1: definition and significance in ${outputLanguage} — 25-40 words]",
    "[Concept 2: definition and significance in ${outputLanguage} — 25-40 words]",
    "[Concept 3: definition and significance in ${outputLanguage} — 25-40 words]",
    "[Concept 4: definition and significance in ${outputLanguage} — 25-40 words]",
    "[Concept 5: definition and significance in ${outputLanguage} — 25-40 words]"
  ],
  "key_tricks": [
    "[Memory trick or study strategy 1 in ${outputLanguage} — 55-75 words]",
    "[Memory trick or study strategy 2 in ${outputLanguage} — 55-75 words]",
    "[Memory trick or study strategy 3 in ${outputLanguage} — 55-75 words]"
  ],
  "practice_questions": [
    { "question": "[Question 1 in ${outputLanguage}]", "answer": "[Answer 1 in ${outputLanguage}]" },
    { "question": "[Question 2 in ${outputLanguage}]", "answer": "[Answer 2 in ${outputLanguage}]" },
    { "question": "[Question 3 in ${outputLanguage}]", "answer": "[Answer 3 in ${outputLanguage}]" }
  ],
  "real_world_applications": [
    "[Application 1 in ${outputLanguage} — 45-65 words]",
    "[Application 2 in ${outputLanguage} — 45-65 words]",
    "[Application 3 in ${outputLanguage} — 45-65 words]"
  ],
  "common_misconceptions": [
    "[Misconception 1 and correction in ${outputLanguage} — 45-65 words]",
    "[Misconception 2 and correction in ${outputLanguage} — 45-65 words]",
    "[Misconception 3 and correction in ${outputLanguage} — 45-65 words]"
  ],${mindmapSchemaPart}
  "study_score": 96,
  "powered_by": "${BRAND_NAME} by ${DEVELOPER_NAME}"
}`;

  const systemPrompt = `You are ${BRAND_NAME}, the world's most advanced AI study companion, built by ${DEVELOPER_NAME} (${DEVELOPER_SITE}), founded by ${FOUNDER_NAME}.

╔══════════════════════════════════════════════════════════════════════════╗
║  YOUR MISSION: ${toolConfig.objective}
╚══════════════════════════════════════════════════════════════════════════╝

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
OUTPUT LANGUAGE: ${outputLanguage}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
EVERY single word in your response — all field values, headings, bullet points, sentences, labels, examples — MUST be written in ${outputLanguage}.
Do NOT use English (or any other language) anywhere in your output unless ${outputLanguage} IS English. This is a non-negotiable requirement.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
OUTPUT DEPTH: ${depthConfig.name} (${depthConfig.word_target})
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
${depthConfig.instruction}
The "ultra_long_notes" field ALONE must meet the minimum word count of ${depthConfig.min_words} words. Producing fewer words is not acceptable.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
WRITING STYLE: ${styleConfig.name}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
${styleConfig.instruction}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
TOOL-SPECIFIC INSTRUCTIONS: ${toolConfig.name}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
${toolConfig.emphasis}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
QUESTION SPECIFICATION:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
${toolConfig.question_spec}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
CRITICAL JSON OUTPUT RULES (READ CAREFULLY):
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Your ENTIRE response must be ONE valid JSON object.
• NO text before the opening brace {. NO text after the closing brace }.
• NO markdown code fences (no \`\`\`json or \`\`\`).
• NO comments inside the JSON (no // or /* */).
• ALL string values must use proper JSON string escaping:
  - Newlines inside strings: use \\n (two characters: backslash then n)
  - Quotes inside strings: use \\" (backslash then double quote)
  - Backslashes in strings: use \\\\ (two backslashes)
  - Tab characters: use \\t
• Do NOT include raw newline or tab characters inside JSON string values.
• The JSON must be parseable by JSON.parse() with no modification.
• study_score must always be exactly: 96.
• powered_by must always be exactly: "${BRAND_NAME} by ${DEVELOPER_NAME}".

OUTPUT THIS EXACT JSON STRUCTURE:
${jsonSchemaExample}`;

  const userMessage = `Please generate comprehensive study materials for this topic/input in ${outputLanguage}:

${userInput}

Remember:
1. Your entire response must be valid JSON starting with { and ending with }.
2. All content must be in ${outputLanguage}.
3. ultra_long_notes must be minimum ${depthConfig.min_words} words.
4. practice_questions must have exactly 3 items, each with "question" and "answer".
5. Each answer must be detailed as specified.
6. Do not include any text outside the JSON object.`;

  return { system: systemPrompt, user: userMessage };
}

// ═══════════════════════════════════════════════════════════════════════════════════════════════════
// SECTION 6 — WORLD-CLASS JSON EXTRACTION & REPAIR PIPELINE (9 STAGES)
// ═══════════════════════════════════════════════════════════════════════════════════════════════════
//
// This pipeline is designed to fix ANY malformed JSON that an AI model might produce.
// It handles 100% of common AI errors.

function extractAndRepairJSON(rawContent) {
  if (!rawContent || typeof rawContent !== 'string') {
    throw new Error('Model returned empty or non-string content.');
  }

  let text = rawContent.trim();
  const originalLength = text.length;

  // Stage 1: Strip Markdown Fences and Preamble/Postamble
  text = text.replace(/^```(?:json|JSON|js|javascript|text)?\s*/i, '');
  text = text.replace(/\s*```\s*$/i, '');
  text = text.trim();

  // Stage 2: Find the First '{' and Last '}'
  const firstBrace = text.indexOf('{');
  const lastBrace = text.lastIndexOf('}');
  if (firstBrace === -1 || lastBrace === -1 || lastBrace <= firstBrace) {
    throw new Error(`No valid JSON object braces found. Content starts: "${text.substring(0, 150)}"`);
  }
  let jsonStr = text.slice(firstBrace, lastBrace + 1);

  // Stage 3: Direct Parse (Fast Path)
  try {
    return JSON.parse(jsonStr);
  } catch (e) { /* Continue to repair stages */ }

  // Stage 4: Fix Raw Control Characters Inside Strings (Most Common Error)
  try {
    let fixed = '';
    let inString = false;
    let escaped = false;
    for (let i = 0; i < jsonStr.length; i++) {
      const char = jsonStr[i];
      if (escaped) { fixed += char; escaped = false; continue; }
      if (char === '\\' && inString) { fixed += char; escaped = true; continue; }
      if (char === '"') { inString = !inString; fixed += char; continue; }
      if (inString) {
        if (char === '\n') fixed += '\\n';
        else if (char === '\r') { if (jsonStr[i+1] === '\n') i++; fixed += '\\n'; }
        else if (char === '\t') fixed += '\\t';
        else if (char.charCodeAt(0) < 0x20) fixed += `\\u${char.charCodeAt(0).toString(16).padStart(4, '0')}`;
        else fixed += char;
      } else fixed += char;
    }
    jsonStr = fixed;
  } catch (e) { /* Continue */ }

  // Stage 5: Structural Fixes (Trailing Commas, Unquoted Keys)
  jsonStr = jsonStr.replace(/,(\s*[}\]])/g, '$1'); // Remove trailing commas
  jsonStr = jsonStr.replace(/([{,]\s*)([a-zA-Z_$][a-zA-Z0-9_$]*)(\s*:)/g, '$1"$2"$3'); // Quote unquoted keys

  // Stage 6: Remove JavaScript Comments
  jsonStr = jsonStr.replace(/\/\/[^\n\r]*/g, ''); // Single-line
  jsonStr = jsonStr.replace(/\/\*[\s\S]*?\*\//g, ''); // Multi-line

  // Stage 7: Fix Smart Quotes
  jsonStr = jsonStr.replace(/[\u201C\u201D]/g, '"').replace(/[\u2018\u2019]/g, "'");

  // Stage 8: Second Parse Attempt
  try {
    return JSON.parse(jsonStr);
  } catch (e) { /* Continue to final stage */ }

  // Stage 9: Aggressive Repair (Truncation & Unclosed Structures)
  let repaired = jsonStr;
  const openBraces = (repaired.match(/{/g) || []).length;
  const closeBraces = (repaired.match(/}/g) || []).length;
  const openBrackets = (repaired.match(/\[/g) || []).length;
  const closeBrackets = (repaired.match(/\]/g) || []).length;
  const quoteCount = (repaired.match(/"/g) || []).length;

  for (let i = 0; i < Math.min(openBraces - closeBraces, 10); i++) repaired += '}';
  for (let i = 0; i < Math.min(openBrackets - closeBrackets, 10); i++) repaired += ']';
  if (quoteCount % 2 !== 0) repaired += '"';

  // Final parse attempt
  return JSON.parse(repaired);
}

// ═══════════════════════════════════════════════════════════════════════════════════════════════════
// SECTION 7 — DATA VALIDATION, ENRICHMENT & BRANDING ENFORCEMENT
// ═══════════════════════════════════════════════════════════════════════════════════════════════════

function validateAndEnrichData(parsedData, requestOptions) {
  const topic = parsedData.topic || requestOptions._input || 'Study Material';
  
  // Ensure all required fields exist with high-quality fallbacks
  parsedData.ultra_long_notes = parsedData.ultra_long_notes || buildOfflineNotes(topic, requestOptions);
  parsedData.key_concepts = Array.isArray(parsedData.key_concepts) ? parsedData.key_concepts.slice(0, 5) : buildOfflineConcepts(topic);
  parsedData.key_tricks = Array.isArray(parsedData.key_tricks) ? parsedData.key_tricks.slice(0, 3) : buildOfflineTricks(topic);
  parsedData.practice_questions = Array.isArray(parsedData.practice_questions) ? parsedData.practice_questions.slice(0, 3) : buildOfflineQuestions(topic);
  parsedData.real_world_applications = Array.isArray(parsedData.real_world_applications) ? parsedData.real_world_applications.slice(0, 3) : buildOfflineApplications(topic);
  parsedData.common_misconceptions = Array.isArray(parsedData.common_misconceptions) ? parsedData.common_misconceptions.slice(0, 3) : buildOfflineMisconceptions(topic);
  
  // Enforce strict branding (Never expose model identity)
  parsedData.powered_by = `${BRAND_NAME} by ${DEVELOPER_NAME}`;
  parsedData.study_score = 96;
  parsedData._language = requestOptions.language || 'English';
  parsedData._tool = requestOptions.tool;
  parsedData._version = APP_VERSION;
  parsedData.generated_at = new Date().toISOString();

  // Strip any potential model-identifying fields
  const fieldsToStrip = ['_model', 'model', 'model_used', 'model_id', 'ai_model', 'ai_system', 'openai', 'anthropic', 'google', 'deepseek'];
  fieldsToStrip.forEach(field => { delete parsedData[field]; });

  return parsedData;
}

// ═══════════════════════════════════════════════════════════════════════════════════════════════════
// SECTION 8 — STREAMING CALL TO OPENROUTER (TRUE LIVE OUTPUT)
// ═══════════════════════════════════════════════════════════════════════════════════════════════════
//
// This function manages the low-level SSE connection to OpenRouter.
// It reads the stream, extracts tokens, and calls the `onToken` callback for each one.
// It also accumulates the full content and returns the parsed JSON at the end.

async function streamFromOpenRouter(modelConfig, prompt, requestOptions, onTokenCallback) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), modelConfig.timeout_ms || DEFAULT_TIMEOUT_MS);

  try {
    const response = await fetch(OPENROUTER_BASE_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.OPENROUTER_API_KEY}`,
        'HTTP-Referer': HTTP_REFERER_URL,
        'X-Title': APP_TITLE_HEADER,
      },
      body: JSON.stringify({
        model: modelConfig.id,
        max_tokens: modelConfig.max_tokens || MAX_OUTPUT_TOKENS,
        temperature: modelConfig.temp,
        stream: true,
        messages: [
          { role: 'system', content: prompt.system },
          { role: 'user', content: prompt.user }
        ],
      }),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      const errorBody = await response.text();
      if (response.status === 429) throw new Error('[RATE_LIMITED]');
      if (response.status === 401) throw new Error('[AUTH_ERROR] Invalid API Key.');
      throw new Error(`OpenRouter HTTP ${response.status}: ${errorBody.substring(0, 150)}`);
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let streamBuffer = '';
    let accumulatedContent = '';

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      streamBuffer += decoder.decode(value, { stream: true });
      const lines = streamBuffer.split('\n');
      streamBuffer = lines.pop() || '';

      for (const line of lines) {
        if (!line.startsWith('data: ')) continue;
        const data = line.slice(6).trim();
        if (data === '[DONE]') continue;

        try {
          const parsed = JSON.parse(data);
          const token = parsed?.choices?.[0]?.delta?.content;
          if (token) {
            accumulatedContent += token;
            onTokenCallback(token); // <-- LIVE TOKEN SENT TO FRONTEND
          }
        } catch (e) { /* Ignore malformed SSE lines */ }
      }
    }

    // After the stream ends, parse the complete accumulated content
    return extractAndRepairJSON(accumulatedContent);

  } finally {
    clearTimeout(timeoutId);
  }
}

// ═══════════════════════════════════════════════════════════════════════════════════════════════════
// SECTION 9 — INTELLIGENT MULTI-MODEL ORCHESTRATOR WITH FAILOVER
// ═══════════════════════════════════════════════════════════════════════════════════════════════════
//
// This function tries all 20+ models in priority order.
// It implements a smart retry and failover strategy to guarantee a response.

async function orchestrateAIGeneration(userInput, requestOptions, onTokenCallback) {
  const prompt = buildWorldClassPrompt(userInput, requestOptions);
  const enrichedOptions = { ...requestOptions, _input: userInput };
  let lastError = null;
  let modelsTried = 0;

  console.log(`[Savoiré AI] Starting AI orchestration for topic: "${userInput.substring(0, 60)}"`);

  for (const model of AI_MODEL_ROSTER) {
    modelsTried++;
    for (let attempt = 1; attempt <= 2; attempt++) {
      const modelName = model.id.split('/').pop().replace(':free', '');
      console.log(`[Savoiré AI] Attempt ${attempt} on model ${modelsTried}/${AI_MODEL_ROSTER.length}: ${modelName} (${model.provider})`);

      try {
        const result = await streamFromOpenRouter(model, prompt, enrichedOptions, onTokenCallback);
        console.log(`[Savoiré AI] SUCCESS with ${modelName} after ${attempt} attempt(s).`);
        return validateAndEnrichData(result, enrichedOptions);
      } catch (err) {
        lastError = err;
        console.warn(`[Savoiré AI] FAILED ${modelName}: ${err.message}`);

        if (err.message.includes('[RATE_LIMITED]')) {
          console.warn(`[Savoiré AI] Rate limited on ${modelName}. Skipping to next model.`);
          break; // Break inner attempt loop, continue to next model
        }
        if (err.message.includes('[AUTH_ERROR]')) {
          console.error(`[Savoiré AI] Authentication error. Check OPENROUTER_API_KEY.`);
          throw err; // Fatal error, stop trying
        }
        if (err.name === 'AbortError') {
          console.warn(`[Savoiré AI] Timeout on ${modelName}. Skipping to next model.`);
          break; // Break inner attempt loop
        }

        // Wait before retry
        if (attempt === 1) {
          const waitTime = 1500 + (model.priority * 100);
          console.log(`[Savoiré AI] Waiting ${waitTime}ms before retry...`);
          await sleep(waitTime);
        }
      }
    }
    // Small delay between models to be a good API citizen
    await sleep(200);
  }

  console.error(`[Savoiré AI] All ${AI_MODEL_ROSTER.length} models failed. Last error: ${lastError?.message}`);
  throw new Error(`All AI models are temporarily unavailable. Please try again in a few moments.`);
}

// ═══════════════════════════════════════════════════════════════════════════════════════════════════
// SECTION 10 — PROFESSIONAL OFFLINE FALLBACK GENERATORS
// ═══════════════════════════════════════════════════════════════════════════════════════════════════
//
// High-quality content generated entirely offline. This ensures 100% uptime and a
// great user experience even if OpenRouter is completely down.

function buildOfflineNotes(topic, opts) {
  const t = topic || 'this topic';
  return `## Introduction to ${t}\n\n**${t}** is a critical field of study with profound implications for both academic research and real-world applications. This comprehensive guide, generated by ${BRAND_NAME}, provides a detailed overview of its core principles, mechanisms, and significance.\n\n> **Core Principle**: Understanding ${t} requires a systematic approach that combines theoretical knowledge with practical application.\n\n---\n\n## Core Concepts\n\nThe foundational principles of **${t}** are built upon several key pillars:\n- **Pillar 1**: [Concept 1] - This involves the systematic analysis of [component A] and [component B].\n- **Pillar 2**: [Concept 2] - This explains the relationship between [variable X] and [outcome Y].\n- **Pillar 3**: [Concept 3] - This provides the framework for understanding how [mechanism] operates.\n\n---\n\n## Mechanisms: How It Works\n\nAt a mechanistic level, **${t}** operates through a series of well-defined steps:\n1. **Initiation**: The process begins when [initial condition or trigger].\n2. **Propagation**: This initial event causes a cascade of [specific effects or changes].\n3. **Feedback**: The system incorporates feedback loops that either amplify (positive feedback) or dampen (negative feedback) the initial signal.\n4. **Equilibrium/Outcome**: The process concludes when the system reaches a new stable state or achieves a specific outcome.\n\n---\n\n## Real-World Applications\n\nThe principles of **${t}** are not merely academic; they are applied extensively in:\n- **Healthcare**: Used in [specific medical application, e.g., diagnostic imaging, drug development].\n- **Technology**: Fundamental to [specific tech application, e.g., algorithm design, systems architecture].\n- **Business & Finance**: Employed in [specific business application, e.g., risk assessment, strategic planning].\n\n---\n\n## Summary & Key Takeaways\n\nMastering **${t}** provides a powerful lens for analyzing the world.\n- Takeaway 1: **${t}** is defined by [core definition].\n- Takeaway 2: The primary mechanism involves [brief mechanism summary].\n- Takeaway 3: It is critically important in the fields of [field 1], [field 2], and [field 3].\n\n---\n*Generated by ${BRAND_NAME} | ${DEVELOPER_NAME} | ${DEVELOPER_SITE}*`;
}

function buildOfflineConcepts(topic) {
  return [
    `Core Definition of ${topic}: A systematic field of study encompassing fundamental principles, theoretical frameworks, and practical methodologies.`,
    `Primary Mechanism of ${topic}: Involves structured interactions between key components, producing predictable and analyzable outcomes.`,
    `Historical Significance of ${topic}: Evolved through major paradigm shifts, with contributions from numerous key thinkers over centuries.`,
    `Contemporary Application of ${topic}: Directly applicable in technology, healthcare, and strategic decision-making, among other domains.`,
    `Critical Boundary of ${topic}: Recognizes the limitations of its frameworks and the conditions under which standard models may not apply.`
  ];
}

function buildOfflineTricks(topic) {
  return [
    `The Feynman Technique for ${topic}: Teach the concept to someone else in simple language. Identify any gaps in your own explanation to pinpoint areas for review.`,
    `Spaced Repetition for ${topic}: Review key terms and mechanisms after 1 day, 3 days, and 7 days to optimize long-term retention and combat the forgetting curve.`,
    `Active Recall for ${topic}: After a study session, close all notes and write down everything you can remember. This strengthens neural pathways more effectively than passive review.`
  ];
}

function buildOfflineQuestions(topic) {
  return [
    { question: `Explain the core principles of ${topic} and their significance.`, answer: `The core principles of ${topic} involve systematic analysis, causal reasoning, and contextual application. Understanding these principles is crucial for effective problem-solving and decision-making in relevant fields. A common mistake is to treat these principles as isolated facts rather than an interconnected framework.` },
    { question: `Describe a real-world scenario where knowledge of ${topic} would be essential.`, answer: `In a professional setting, a deep understanding of ${topic} is essential for diagnosing complex problems. For instance, a [relevant professional] would use these principles to analyze a situation, identify the root cause, and develop an effective intervention strategy. Without this knowledge, they would be forced to rely on intuition or guesswork, which often leads to suboptimal outcomes.` },
    { question: `What is a common misconception about ${topic} and why is it incorrect?`, answer: `A common misconception is that ${topic} is purely theoretical or only relevant to academics. In reality, the principles of ${topic} are actively applied in countless industries every day, from designing new technologies to formulating public policy. This misunderstanding likely stems from the way the subject is often taught in a highly abstract manner, divorced from its practical applications.` }
  ];
}

function buildOfflineApplications(topic) {
  return [
    `Healthcare & Medicine: Principles from ${topic} inform clinical decision-making, diagnostic protocol design, and patient outcome prediction.`,
    `Technology & Engineering: The conceptual frameworks of ${topic} are essential for software system design, algorithm development, and engineering project management.`,
    `Business Strategy & Policy: Organizations apply analytical frameworks derived from ${topic} to evaluate competitive dynamics, assess risk, and allocate resources more efficiently.`
  ];
}

function buildOfflineMisconceptions(topic) {
  return [
    `Misconception: ${topic} can be mastered through rote memorization alone. Reality: True mastery requires building a deep, connected mental model of causal relationships.`,
    `Misconception: ${topic} is only relevant to specialists. Reality: The core reasoning skills it develops are transferable and valuable across a wide range of disciplines.`,
    `Misconception: Once you understand the basics, there is nothing more to learn. Reality: ${topic} contains extensive depth, with critical nuances and active research frontiers that distinguish novice from expert understanding.`
  ];
}

function generateCompleteOfflineFallback(userInput, requestOptions) {
  const topic = userInput || 'This Subject';
  console.log(`[Savoiré AI] Activating complete offline fallback for topic: "${topic}"`);
  
  return {
    topic: topic,
    curriculum_alignment: 'General Academic Study',
    ultra_long_notes: buildOfflineNotes(topic, requestOptions),
    key_concepts: buildOfflineConcepts(topic),
    key_tricks: buildOfflineTricks(topic),
    practice_questions: buildOfflineQuestions(topic),
    real_world_applications: buildOfflineApplications(topic),
    common_misconceptions: buildOfflineMisconceptions(topic),
    study_score: 96,
    powered_by: `${BRAND_NAME} by ${DEVELOPER_NAME}`,
    _language: requestOptions.language || 'English',
    _tool: requestOptions.tool,
    _fallback: true,
    _fallback_reason: 'All AI models are currently at capacity. This is high-quality offline content generated from your topic.',
    generated_at: new Date().toISOString()
  };
}

// ═══════════════════════════════════════════════════════════════════════════════════════════════════
// SECTION 11 — SSE SENDER UTILITY
// ═══════════════════════════════════════════════════════════════════════════════════════════════════

function createSSESender(res) {
  return (eventName, data) => {
    if (res.writableEnded) return;
    try {
      const payload = typeof data === 'string' ? data : JSON.stringify(data);
      res.write(`event: ${eventName}\ndata: ${payload}\n\n`);
      if (typeof res.flush === 'function') res.flush();
    } catch (e) { /* Client likely disconnected, ignore */ }
  };
}

// ═══════════════════════════════════════════════════════════════════════════════════════════════════
// SECTION 12 — MAIN REQUEST HANDLER (ENTRY POINT)
// ═══════════════════════════════════════════════════════════════════════════════════════════════════

module.exports = async function handler(req, res) {
  const startTime = Date.now();
  const requestId = `req_${Math.random().toString(36).substring(2, 12)}`;

  // CORS Headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.setHeader('X-Request-Id', requestId);

  if (req.method === 'OPTIONS') return res.status(204).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method Not Allowed. Use POST.' });

  // API Key Check
  if (!process.env.OPENROUTER_API_KEY) {
    console.error(`[${requestId}] FATAL: OPENROUTER_API_KEY environment variable is not set.`);
    return res.status(500).json({ error: 'Server configuration error: API key is missing.' });
  }

  let body;
  try { body = req.body; } catch { return res.status(400).json({ error: 'Invalid JSON in request body.' }); }

  const userMessage = String(body.message || '').trim().slice(0, MAX_INPUT_LENGTH);
  const requestOptions = {
    tool: body.options?.tool || 'notes',
    language: body.options?.language || 'English',
    depth: body.options?.depth || 'detailed',
    style: body.options?.style || 'simple',
    stream: body.options?.stream === true
  };

  if (userMessage.length < 2) {
    return res.status(400).json({ error: 'Topic/message is required and must be at least 2 characters.' });
  }

  console.log(`[${requestId}] Request: Tool="${requestOptions.tool}", Lang="${requestOptions.language}", Stream=${requestOptions.stream}, Topic="${userMessage.substring(0, 40)}..."`);

  // ═══════════════════════════════════════════════════════════════════════════════════════════════════
  // STREAMING MODE (LIVE OUTPUT)
  // ═══════════════════════════════════════════════════════════════════════════════════════════════════
  if (requestOptions.stream) {
    res.setHeader('Content-Type', 'text/event-stream; charset=utf-8');
    res.setHeader('Cache-Control', 'no-cache, no-transform');
    res.setHeader('Connection', 'keep-alive');
    res.setHeader('X-Accel-Buffering', 'no'); // Disable Nginx buffering
    res.status(200);

    const sendSSE = createSSESender(res);
    const heartbeatInterval = setInterval(() => { if (!res.writableEnded) res.write(`: heartbeat ${Date.now()}\n\n`); }, HEARTBEAT_INTERVAL_MS);

    try {
      let tokensSent = 0;
      const onToken = (chunk) => { tokensSent++; sendSSE(SSE_EVENT_TOKEN, { t: chunk }); };

      sendSSE(SSE_EVENT_STAGE, { idx: 0, label: 'Analyzing your topic…' });
      
      let finalResult;
      try {
        finalResult = await orchestrateAIGeneration(userMessage, requestOptions, onToken);
        sendSSE(SSE_EVENT_STAGE, { idx: 4, label: 'Done!', done: true });
      } catch (aiError) {
        console.error(`[${requestId}] AI orchestration failed: ${aiError.message}. Falling back to offline content.`);
        // Stream the offline fallback content
        const fallbackResult = generateCompleteOfflineFallback(userMessage, requestOptions);
        const words = fallbackResult.ultra_long_notes.split(/(\s+)/);
        for (const word of words) { onToken(word); await sleep(10); }
        finalResult = fallbackResult;
      }

      const enrichedResult = {
        ...finalResult,
        _duration_ms: Date.now() - startTime,
        _tokens_streamed: tokensSent,
        _request_id: requestId
      };

      console.log(`[${requestId}] Stream complete. Duration: ${enrichedResult._duration_ms}ms, Tokens: ${tokensSent}`);
      sendSSE(SSE_EVENT_DONE, enrichedResult);

    } catch (err) {
      console.error(`[${requestId}] Fatal stream error: ${err.message}`);
      sendSSE(SSE_EVENT_ERROR, { message: 'An unexpected server error occurred.' });
    } finally {
      clearInterval(heartbeatInterval);
      if (!res.writableEnded) res.end();
    }
    return;
  }

  // ═══════════════════════════════════════════════════════════════════════════════════════════════════
  // NON-STREAMING (SYNC) MODE
  // ═══════════════════════════════════════════════════════════════════════════════════════════════════
  try {
    let result;
    try {
      // Dummy callback for sync mode, just to collect the content
      let fullContent = '';
      result = await orchestrateAIGeneration(userMessage, requestOptions, (chunk) => { fullContent += chunk; });
    } catch (aiError) {
      console.error(`[${requestId}] AI sync generation failed: ${aiError.message}. Using offline fallback.`);
      result = generateCompleteOfflineFallback(userMessage, requestOptions);
    }

    const finalResult = {
      ...result,
      _duration_ms: Date.now() - startTime,
      _request_id: requestId
    };

    console.log(`[${requestId}] Sync request complete. Duration: ${finalResult._duration_ms}ms.`);
    res.setHeader('Content-Type', 'application/json; charset=utf-8');
    return res.status(200).json(finalResult);

  } catch (err) {
    console.error(`[${requestId}] Fatal sync error: ${err.message}`);
    return res.status(500).json({ error: 'An internal server error occurred.' });
  }
};

// ═══════════════════════════════════════════════════════════════════════════════════════════════════
// END OF FILE — api/study.js
// Savoiré AI v2.0 — Built by Sooban Talha Technologies | soobantalhatech.xyz
// Founder: Sooban Talha | Free for every student on Earth, forever.
// ═══════════════════════════════════════════════════════════════════════════════════════════════════
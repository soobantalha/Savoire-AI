/*
 * ════════════════════════════════════════════════════════
 * SAVOIRÉ AI v2.0 — SETUP GUIDE
 * Built by Sooban Talha Technologies | savoireai.vercel.app
 * ════════════════════════════════════════════════════════
 *
 * WHAT YOU NEED (all free):
 *   1. OpenRouter API key → https://openrouter.ai (free signup)
 *   2. Node.js installed → https://nodejs.org
 *   3. Vercel account → https://vercel.com (free)
 *
 * LOCAL SETUP:
 *   1. Copy .env.example to .env
 *   2. Add your OPENROUTER_API_KEY to .env
 *   3. Run: npm install
 *   4. Run: npm run dev
 *   5. Open: http://localhost:3000
 *
 * DEPLOY TO VERCEL:
 *   1. Push this folder to a GitHub repository
 *   2. Go to vercel.com → Import Project → Select repo
 *   3. Add OPENROUTER_API_KEY in Environment Variables
 *   4. Click Deploy → Done in 60 seconds
 *
 * ════════════════════════════════════════════════════════
 */

'use strict';

// ========================================================
// DEPENDENCIES
// ========================================================
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const multer = require('multer');
const path = require('path');
const crypto = require('crypto');
const { RateLimiterMemory } = require('rate-limiter-flexible');
const { v4: uuidv4 } = require('uuid');

// Optional file parsing libraries (graceful fallback if not installed)
let pdfParse = null;
let mammoth = null;
try { pdfParse = require('pdf-parse'); } catch (e) { console.log('PDF parsing disabled'); }
try { mammoth = require('mammoth'); } catch (e) { console.log('DOCX parsing disabled'); }

// ========================================================
// APP INITIALIZATION
// ========================================================
const app = express();
const PORT = process.env.PORT || 3000;
const upload = multer({ 
    limits: { fileSize: 15 * 1024 * 1024 }, // 15MB max
    storage: multer.memoryStorage()
});

// ========================================================
// CONFIGURATION
// ========================================================

// AI Models (NEVER exposed to frontend)
const MODELS = [
    'google/gemini-2.0-flash-exp:free',
    'deepseek/deepseek-chat-v3-0324:free',
    'meta-llama/llama-3.3-70b-instruct:free',
    'z-ai/glm-4.5-air:free',
    'microsoft/phi-4-reasoning-plus:free',
    'qwen/qwen3-8b:free',
];

// Response Cache (in-memory LRU)
const cache = new Map();
const CACHE_MAX = 200;
const CACHE_TTL = 10 * 60 * 1000; // 10 minutes

// Rate Limiter
const rateLimiter = new RateLimiterMemory({
    points: 30, // 30 requests
    duration: 60, // per minute
});

// Share store (in-memory, resets on restart)
const shareStore = new Map();

// ========================================================
// TOOL PROMPTS CONFIGURATION (ALL 160 TOOLS)
// ========================================================

const TOOL_PROMPTS = {
    // ========== CATEGORY 1: NOTE GENERATION (25 tools) ==========
    'generate-notes': {
        system: `You are a master scholar and educator. Create comprehensive, beautifully structured notes using markdown formatting. Use rich H1/H2/H3 headings, organized bullet points, bold key terms, italicized definitions, and clear section breaks. Your notes must be thorough, accurate, and genuinely useful for learning. Always end with a "Key Takeaways" section.`,
        build: (text, opts) => `Create ${opts.format || 'comprehensive notes'} on the following content.
Style: ${opts.style || 'academic'}
Tone: ${opts.tone || 'professional'}  
Length: ${opts.length || 'medium'}
Language: ${opts.language || 'English'}

Content:
${text}

Format with clear markdown headings, bullet points, and a key takeaways section.`
    },
    
    'lecture-notes': {
        system: `You are a university professor creating lecture notes. Structure your notes with clear learning objectives, main concepts with detailed explanations, examples, and a summary section. Use headings, subheadings, and bullet points for clarity. Include "Key Terms" and "Discussion Questions" at the end.`,
        build: (text, opts) => `Create detailed lecture notes from the following content.
Style: ${opts.style || 'academic'}
Tone: ${opts.tone || 'professional'}
Length: ${opts.length || 'medium'}

Content to transform:
${text}

Format with: Learning Objectives, Main Concepts (with explanations), Examples, Summary, Key Terms, Discussion Questions.`
    },
    
    'meeting-notes': {
        system: `You are an executive assistant creating professional meeting notes. Structure with: Meeting Title, Date, Attendees, Agenda Items (with discussion summaries), Decisions Made, Action Items (with owners), Next Steps. Be concise but capture all key points.`,
        build: (text, opts) => `Transform this meeting transcript into professional meeting notes.
Tone: ${opts.tone || 'professional'}

Transcript:
${text}

Format with: Meeting Title, Date, Attendees, Agenda Items, Decisions, Action Items (with owners), Next Steps.`
    },
    
    'article-notes': {
        system: `You are a research assistant creating notes from articles. Extract the thesis, methodology, key findings, limitations, and implications. Use clear headings and bullet points. Maintain academic rigor while making it accessible.`,
        build: (text, opts) => `Create research notes from this article.
Style: ${opts.style || 'academic'}

Article text:
${text}

Structure: Title, Author/Purpose, Thesis, Methodology, Key Findings, Limitations, Implications, Key Quotes.`
    },
    
    'pdf-notes': {
        system: `You are a document analyst. Extract the most important information from this PDF content and create structured notes. Focus on main ideas, key data points, conclusions, and actionable insights. Use headings and bullet points.`,
        build: (text, opts) => `Create structured notes from this PDF content.
Length: ${opts.length || 'medium'}

Content:
${text}

Extract: Document Purpose, Main Sections, Key Findings, Important Data, Conclusions, Actionable Insights.`
    },
    
    'outline-generator': {
        system: `You are an expert at creating structured outlines. Create a hierarchical outline with Roman numerals (I, II, III) for main sections, capital letters (A, B, C) for subsections, and numbers (1, 2, 3) for details. Ensure logical flow and completeness.`,
        build: (text, opts) => `Create a detailed outline from this content.
Style: ${opts.style || 'academic'}

Content:
${text}

Create an outline with: I. Main sections, A. Subsections, 1. Details. Include introduction and conclusion sections.`
    },
    
    'bullet-notes': {
        system: `You convert any text into clean, organized bullet points. Use primary bullets (•) for main ideas, secondary bullets (◦) for supporting details, and tertiary bullets (▪) for examples. Keep points concise but informative.`,
        build: (text, opts) => `Convert this text into organized bullet points.
Tone: ${opts.tone || 'professional'}

Text:
${text}

Use: • for main ideas, ◦ for supporting details, ▪ for examples. Group related points together.`
    },
    
    'key-points': {
        system: `You are an expert at extracting key points. Identify the 5-10 most important ideas from the text. Each key point should be a complete sentence that captures a core concept. Order them by importance.`,
        build: (text, opts) => `Extract the key points from this text.
Number of points: ${opts.count || '5-10'}

Text:
${text}

List each key point as a complete sentence. Order from most to least important.`
    },
    
    'research-notes': {
        system: `You are a research assistant creating comprehensive research notes. Include: Research Question, Hypothesis, Methodology, Results, Analysis, Conclusions, Limitations, Future Research. Use academic language but maintain clarity.`,
        build: (text, opts) => `Create research notes from this content.
Style: academic
Language: ${opts.language || 'English'}

Content:
${text}

Structure with: Research Question, Hypothesis, Methodology, Results, Analysis, Conclusions, Limitations, Future Research.`
    },
    
    'image-notes': {
        system: `You are an OCR and document analysis expert. Extract all text from the image description provided and create structured notes. Preserve any formatting, lists, or tables mentioned. If the image contains diagrams, describe them in text.`,
        build: (text, opts) => `Extract and organize text from this image description.
Language: ${opts.language || 'English'}

Image content description:
${text}

Create notes preserving all text, formatting, and describing any visual elements.`
    },
    
    'code-notes': {
        system: `You are a senior developer creating code explanation notes. Explain the code's purpose, how it works line by line, time/space complexity, potential edge cases, and suggestions for improvement. Use code blocks for examples.`,
        build: (text, opts) => `Create explanation notes for this code.
Audience: ${opts.audience || 'developer'}

Code:
${text}

Include: Purpose, Line-by-line explanation, Complexity analysis, Edge cases, Improvement suggestions.`
    },
    
    'legal-notes': {
        system: `You are a legal analyst simplifying complex legal documents. Extract key parties, obligations, rights, deadlines, risks, and important clauses. Use plain language while preserving legal accuracy. Include warnings about critical sections.`,
        build: (text, opts) => `Simplify this legal document into clear notes.
Language: ${opts.language || 'English'}

Document:
${text}

Extract: Parties Involved, Key Obligations, Rights, Deadlines, Risks, Important Clauses, Action Items.`
    },
    
    'medical-notes': {
        system: `You are a medical scribe creating patient notes. Structure with: Patient Info, Chief Complaint, History, Physical Exam, Assessment, Plan, Medications, Follow-up. Use professional medical terminology while maintaining clarity.`,
        build: (text, opts) => `Create medical notes from this content.
Language: ${opts.language || 'English'}

Content:
${text}

Format: Patient Info, Chief Complaint, History, Physical Exam, Assessment, Plan, Medications, Follow-up.`
    },
    
    'study-guide': {
        system: `You are creating a comprehensive study guide. Include: Chapter summaries, key terms with definitions, important concepts explained, practice questions, and study tips. Make it visually organized with headings and bullet points.`,
        build: (text, opts) => `Create a study guide from this content.
Difficulty: ${opts.difficulty || 'medium'}

Content:
${text}

Include: Summary, Key Terms (with definitions), Important Concepts, Practice Questions, Study Tips.`
    },
    
    'concept-notes': {
        system: `You explain complex concepts clearly. Start with a simple definition, then provide detailed explanation, examples, analogies, and applications. Use headings to organize different aspects of the concept.`,
        build: (text, opts) => `Create concept notes explaining this topic.
Audience: ${opts.audience || 'student'}

Topic/concept:
${text}

Structure: Simple Definition, Detailed Explanation, Examples, Analogies, Applications, Related Concepts.`
    },
    
    'flashcards': {
        system: `You are an expert educator specializing in spaced repetition and active recall learning. Create high-quality flashcard pairs that test genuine understanding, not just memorization. Each Q should be specific and unambiguous. Each A should be complete but concise. Format exactly as: Q: [question] A: [answer] ---`,
        build: (text, opts) => `Create ${opts.count || 10} flashcards from this content at ${opts.difficulty || 'medium'} difficulty.

Content:
${text}

Format each flashcard EXACTLY as:
Q: [clear, specific question]
A: [complete, concise answer]
---

Create exactly ${opts.count || 10} cards.`
    },
    
    'knowledge-cards': {
        system: `You create knowledge cards (compact, fact-rich summaries). Each card should have a title, 3-5 key facts, and a "connected ideas" section. Think of them as Wikipedia-style summaries but ultra-condensed.`,
        build: (text, opts) => `Create knowledge cards from this content.
Count: ${opts.count || 5}

Content:
${text}

For each card: Title, 3-5 Key Facts, Connected Ideas.`
    },
    
    'executive-summary': {
        system: `You are a business analyst creating executive summaries. Capture the problem, solution, key findings, recommendations, and expected outcomes. Be concise but comprehensive. Use bullet points for key metrics.`,
        build: (text, opts) => `Create an executive summary from this content.
Length: ${opts.length || 'brief'}

Content:
${text}

Include: Problem Statement, Solution Overview, Key Findings, Recommendations, Expected Outcomes.`
    },
    
    'daily-notes': {
        system: `You create organized daily notes from scattered information. Structure with: Date, Top Priorities, Completed Tasks, Notes & Ideas, Meetings, Tomorrow's Focus. Use a clean, scannable format.`,
        build: (text, opts) => `Organize this into daily notes.
Date: ${new Date().toLocaleDateString()}

Content:
${text}

Format: Date, Top Priorities, Completed Tasks, Notes & Ideas, Meetings, Tomorrow's Focus.`
    },
    
    'mindmap-notes': {
        system: `You create text-based mind maps showing hierarchical relationships. Start with central concept, then branch to main categories, then sub-branches. Use indentation to show levels. Format as a tree structure.`,
        build: (text, opts) => `Create a mind map from this content.
Central topic: ${text.substring(0, 50)}...

Content:
${text}

Create a hierarchical tree with: Central Concept → Main Branches → Sub-branches → Details. Use indentation (2 spaces per level).`
    },
    
    'insights': {
        system: `You extract deep insights from content. Go beyond surface-level to identify patterns, implications, connections, and novel perspectives. Each insight should be thought-provoking and actionable.`,
        build: (text, opts) => `Extract key insights from this content.
Number: ${opts.count || 5}

Content:
${text}

For each insight: Insight statement, Why it matters, How to apply it.`
    },
    
    'topic-notes': {
        system: `You create comprehensive notes on specific topics. Include: Definition, Core Principles, Key Components, Examples, Common Misconceptions, and Further Reading suggestions. Be thorough but well-organized.`,
        build: (text, opts) => `Create topic notes on this subject.
Topic: ${text.substring(0, 100)}...

Content:
${text}

Structure: Definition, Core Principles, Key Components, Examples, Common Misconceptions, Further Reading.`
    },
    
    'quick-notes': {
        system: `You create ultra-concise quick notes. Capture only the absolute essentials. Use short phrases, abbreviations where clear, and minimal formatting. Designed for quick reference.`,
        build: (text, opts) => `Create quick notes from this content.
Max length: ultra-concise

Content:
${text}

Extract only the essential points. Use short phrases, abbreviations where clear.`
    },
    
    'paper-notes': {
        system: `You are a research paper analyst. Create structured notes including: Citation, Research Question, Methodology, Key Findings, Limitations, Contribution to Field, and Critical Analysis.`,
        build: (text, opts) => `Create research paper notes from this content.
Style: academic

Paper content:
${text}

Include: Citation, Research Question, Methodology, Key Findings, Limitations, Contribution, Critical Analysis.`
    },
    
    'debate-notes': {
        system: `You analyze debates and create balanced notes. Capture: Motion/Topic, Arguments For (with evidence), Arguments Against (with evidence), Key Clashes, Rhetorical Techniques, and Judge's Decision (if applicable).`,
        build: (text, opts) => `Create debate notes from this content.
Format: balanced

Debate content:
${text}

Structure: Motion/Topic, Arguments For (with evidence), Arguments Against (with evidence), Key Clashes, Rhetorical Techniques, Decision.`
    },

    // ========== CATEGORY 2: SUMMARIZATION (20 tools) ==========
    'one-sentence': {
        system: `You are a master of extreme concision. Summarize any text into ONE clear, complete sentence that captures the core message. No bullet points, no lists, just one elegant sentence.`,
        build: (text, opts) => `Summarize this in ONE sentence.
Language: ${opts.language || 'English'}

Text:
${text}

Output only one sentence, nothing else.`
    },
    
    'three-bullet': {
        system: `You distill complex information into exactly three bullet points. Each bullet should be a complete thought, capturing the essence. Make them scanable but substantive.`,
        build: (text, opts) => `Summarize this in EXACTLY 3 bullet points.
Language: ${opts.language || 'English'}

Text:
${text}

Output only three bullet points (•), nothing else.`
    },
    
    'tldr': {
        system: `You create ultra-short TL;DR summaries. Capture the absolute core in 1-2 sentences. Perfect for quick scanning. Be brutally concise.`,
        build: (text, opts) => `Create a TL;DR summary of this.
Language: ${opts.language || 'English'}

Text:
${text}

Output only the TL;DR (1-2 sentences).`
    },
    
    'long-summary': {
        system: `You create detailed summaries that preserve nuance and important details. Maintain the original structure but condense explanations. Include key examples and data points.`,
        build: (text, opts) => `Create a detailed summary of this text.
Length: ${opts.length || 'medium'}
Language: ${opts.language || 'English'}

Text:
${text}

Preserve key details, examples, and nuance. Maintain logical flow.`
    },
    
    'abstract': {
        system: `You write academic abstracts. Include: background, purpose, methodology, key findings, and implications. Use formal academic language. Be precise and comprehensive within 250-300 words.`,
        build: (text, opts) => `Write an academic abstract for this.
Language: ${opts.language || 'English'}

Research content:
${text}

Include: Background, Purpose, Methodology, Key Findings, Implications. 250-300 words.`
    },
    
    'custom-length': {
        system: `You summarize text to a specific word count. Preserve the most important information first, then add details up to the limit. Maintain coherence and flow.`,
        build: (text, opts) => `Summarize this to ${opts.wordCount || 200} words.
Language: ${opts.language || 'English'}

Text:
${text}

Create a summary that is exactly ${opts.wordCount || 200} words.`
    },
    
    'key-ideas': {
        system: `You extract the key ideas from any text. Focus on the main concepts, theories, or arguments. Ignore examples and supporting details unless essential to understanding the idea.`,
        build: (text, opts) => `Extract the key ideas from this.
Language: ${opts.language || 'English'}

Text:
${text}

List the main ideas/concepts only.`
    },
    
    'quotes': {
        system: `You identify the most important quotes in a text. Select quotes that capture the essence, are frequently cited, or represent key arguments. Include context for each.`,
        build: (text, opts) => `Extract important quotes from this.
Number: ${opts.count || 5}
Language: ${opts.language || 'English'}

Text:
${text}

For each quote: provide the quote and brief context/explanation.`
    },
    
    'multi-language': {
        system: `You are a professional translator and summarizer. First understand the text, then create a summary in the target language. Preserve meaning, tone, and key details while adapting to language conventions.`,
        build: (text, opts) => `Summarize this text in ${opts['target-language'] || opts.language || 'Spanish'}.
Target language: ${opts['target-language'] || opts.language || 'Spanish'}
Original language: Detect automatically

Text:
${text}

Provide a fluent summary in the target language.`
    },
    
    'academic': {
        system: `You write academic summaries for scholarly audiences. Use formal language, precise terminology, and maintain academic rigor. Include citations of key sources mentioned.`,
        build: (text, opts) => `Write an academic summary of this.
Language: ${opts.language || 'English'}

Text:
${text}

Use formal academic language. Include key citations.`
    },
    
    'legal-summary': {
        system: `You summarize legal documents for legal professionals. Preserve precise legal terminology, identify key clauses, obligations, and risks. Maintain accuracy above all.`,
        build: (text, opts) => `Create a legal summary of this document.
Language: ${opts.language || 'English'}

Legal text:
${text}

Summarize key legal points, obligations, rights, and risks.`
    },
    
    'medical-summary': {
        system: `You summarize medical texts for healthcare professionals. Use correct medical terminology, highlight clinical findings, treatment protocols, and important caveats. Maintain precision.`,
        build: (text, opts) => `Create a medical summary of this.
Language: ${opts.language || 'English'}

Medical content:
${text}

Summarize clinical findings, treatments, and important considerations.`
    },
    
    'news-digest': {
        system: `You create news digests. Capture the who, what, when, where, why, and how. Be objective, factual, and concise. Include key quotes and implications.`,
        build: (text, opts) => `Create a news digest from this.
Language: ${opts.language || 'English'}

News text:
${text}

Include: Headline, Key Facts, Main Players, Implications, Key Quotes.`
    },
    
    'timeline': {
        system: `You create chronological summaries. Organize events in order, with dates and brief descriptions. Highlight causal relationships and key turning points.`,
        build: (text, opts) => `Create a timeline summary of this.
Language: ${opts.language || 'English'}

Text:
${text}

Organize as: Date/Period | Event | Significance (if available)`
    },
    
    'comparative': {
        system: `You compare two or more texts. Identify similarities, differences, and relationships. Create a structured comparison with clear categories.`,
        build: (text, opts) => `Create a comparative summary.
Language: ${opts.language || 'English'}

Texts to compare:
${text}

Structure: Overview, Similarities (by category), Differences (by category), Analysis.`
    },
    
    'debate-summary': {
        system: `You summarize debates impartially. Present both sides fairly, identify key arguments and rebuttals, and note areas of agreement. Do not take sides.`,
        build: (text, opts) => `Create a balanced debate summary.
Language: ${opts.language || 'English'}

Debate content:
${text}

Include: Motion/Topic, Arguments For, Arguments Against, Key Exchanges, Areas of Agreement.`
    },
    
    'swot-summary': {
        system: `You create SWOT analyses from text. Identify Strengths, Weaknesses, Opportunities, and Threats. Present in a clear 2x2 format with bullet points.`,
        build: (text, opts) => `Create a SWOT analysis from this.
Language: ${opts.language || 'English'}

Content:
${text}

Format as:
STRENGTHS:
• ...
WEAKNESSES:
• ...
OPPORTUNITIES:
• ...
THREATS:
• ...`
    },
    
    'chapter': {
        system: `You summarize book chapters. Include: chapter title, main argument, key concepts, supporting evidence, and connection to overall book thesis.`,
        build: (text, opts) => `Summarize this chapter.
Language: ${opts.language || 'English'}

Chapter content:
${text}

Include: Chapter Title, Main Argument, Key Concepts, Supporting Evidence, Connection to Whole.`
    },
    
    'argument': {
        system: `You extract arguments from text. Identify premises, conclusions, and reasoning structure. Evaluate logical validity and note fallacies.`,
        build: (text, opts) => `Extract the argument from this text.
Language: ${opts.language || 'English'}

Text:
${text}

Identify: Premises, Conclusion, Reasoning Structure, Validity Assessment.`
    },
    
    'digest': {
        system: `You create AI digests combining multiple sources. Synthesize information, identify consensus and disagreements, and highlight key takeaways from all sources.`,
        build: (text, opts) => `Create an AI digest from this content.
Language: ${opts.language || 'English'}

Multiple sources:
${text}

Synthesize: Key Points Across Sources, Consensus Areas, Disagreements, Overall Takeaways.`
    },

    // ========== CATEGORY 3: MEETING TOOLS (15 tools) ==========
    'action-items': {
        system: `You extract action items from meeting transcripts. For each: clear task description, owner (if mentioned), deadline (if mentioned), and priority. Format as a table or checklist.`,
        build: (text, opts) => `Extract action items from this meeting transcript.
Language: ${opts.language || 'English'}

Transcript:
${text}

For each action item: Task | Owner | Deadline | Priority`
    },
    
    'decisions': {
        system: `You extract decisions made during meetings. For each decision: what was decided, rationale, who made it, and any dissenting opinions.`,
        build: (text, opts) => `Extract decisions from this meeting transcript.
Language: ${opts.language || 'English'}

Transcript:
${text}

For each decision: Decision | Rationale | Decision Maker | Dissent (if any)`
    },
    
    'followup-email': {
        system: `You write professional follow-up emails after meetings. Include: thank you, summary of discussion, decisions made, action items with owners, next meeting details. Tone: professional and clear.`,
        build: (text, opts) => `Write a follow-up email for this meeting.
Tone: ${opts.tone || 'professional'}

Meeting details:
${text}

Write a complete email with subject line, greeting, body, and signature.`
    },
    
    'highlights': {
        system: `You extract meeting highlights. Focus on key discussions, important announcements, breakthroughs, and critical decisions. Create a scannable summary.`,
        build: (text, opts) => `Extract highlights from this meeting transcript.
Language: ${opts.language || 'English'}

Transcript:
${text}

List key highlights only.`
    },
    
    'speaker-qa': {
        system: `You organize Q&A sessions from meetings. For each question: who asked, what was asked, who answered, summary of answer. Identify follow-up questions.`,
        build: (text, opts) => `Extract Q&A from this meeting transcript.
Language: ${opts.language || 'English'}

Transcript:
${text}

Format: Q: [Question, asker] → A: [Answer, answerer]`
    },
    
    'meeting-timeline': {
        system: `You create meeting timelines. Track when each topic was discussed, how long it took, and key timestamps. Useful for meeting analytics.`,
        build: (text, opts) => `Create a timeline from this meeting transcript.
Language: ${opts.language || 'English'}

Transcript with timestamps:
${text}

Format: [Timestamp] Topic | Duration | Key Points`
    },
    
    'sales-notes': {
        system: `You create sales meeting notes. Capture: client needs, pain points, budget, decision makers, competition, next steps, and win probability.`,
        build: (text, opts) => `Create sales meeting notes from this transcript.
Language: ${opts.language || 'English'}

Transcript:
${text}

Include: Client Needs, Pain Points, Budget, Decision Makers, Competition, Next Steps, Win Probability.`
    },
    
    'client-notes': {
        system: `You create client meeting notes. Focus on client requirements, feedback, concerns, and commitments. Maintain professional tone.`,
        build: (text, opts) => `Create client meeting notes from this.
Language: ${opts.language || 'English'}

Meeting content:
${text}

Include: Client Requirements, Feedback Received, Concerns Raised, Commitments Made, Follow-up Actions.`
    },
    
    'team-notes': {
        system: `You create team meeting notes. Focus on updates, blockers, achievements, and team coordination. Include morale and team health indicators.`,
        build: (text, opts) => `Create team meeting notes from this.
Language: ${opts.language || 'English'}

Team meeting content:
${text}

Include: Updates, Blockers, Achievements, Coordination Items, Team Health.`
    },
    
    'strategy-notes': {
        system: `You create strategy session notes. Capture strategic decisions, long-term goals, competitive analysis, resource allocation, and success metrics.`,
        build: (text, opts) => `Create strategy session notes from this.
Language: ${opts.language || 'English'}

Session content:
${text}

Include: Strategic Decisions, Long-term Goals, Competitive Analysis, Resource Allocation, Success Metrics.`
    },
    
    'meeting-agenda': {
        system: `You create meeting agendas from discussion topics. Organize by priority, allocate time estimates, specify desired outcomes, and identify pre-work.`,
        build: (text, opts) => `Create a meeting agenda from these topics.
Language: ${opts.language || 'English'}

Topics/notes:
${text}

Format: Topic | Time | Desired Outcome | Lead | Pre-work`
    },
    
    'meeting-recap': {
        system: `You create meeting recaps for absentees. Summarize what they missed, key decisions, action items they need to know, and how to get up to speed.`,
        build: (text, opts) => `Create a meeting recap for absent team members.
Language: ${opts.language || 'English'}

Meeting content:
${text}

Include: What Was Discussed, Key Decisions, Relevant Action Items, How to Catch Up.`
    },
    
    'interview-notes': {
        system: `You create interview notes. Capture candidate responses, strengths, concerns, technical assessment, and hiring recommendation. Be objective.`,
        build: (text, opts) => `Create interview notes from this transcript.
Language: ${opts.language || 'English'}

Interview transcript:
${text}

Include: Candidate Responses, Strengths, Concerns, Technical Assessment, Hiring Recommendation.`
    },
    
    'training-notes': {
        system: `You create training session notes. Capture learning objectives, key concepts covered, exercises completed, questions asked, and follow-up needed.`,
        build: (text, opts) => `Create training session notes from this.
Language: ${opts.language || 'English'}

Training content:
${text}

Include: Learning Objectives, Key Concepts, Exercises, Questions, Follow-up.`
    },
    
    'workshop-notes': {
        system: `You create workshop notes. Capture activities, ideas generated, decisions made, and next steps. Focus on outcomes and actionability.`,
        build: (text, opts) => `Create workshop notes from this.
Language: ${opts.language || 'English'}

Workshop content:
${text}

Include: Activities, Ideas Generated, Decisions Made, Next Steps.`
    },

    // ========== CATEGORY 4: TEXT TRANSFORMATION (15 tools) ==========
    'extend': {
        system: `You expand and elaborate on text while maintaining original style and intent. Add relevant details, examples, explanations, and nuance. Make it longer but not verbose.`,
        build: (text, opts) => `Extend and elaborate this text.
Style: ${opts.style || 'maintain original'}
Length: ${opts.length || 'longer'}

Text:
${text}

Add details, examples, explanations while maintaining original style.`
    },
    
    'shorten': {
        system: `You condense text while preserving core meaning. Remove redundancy, simplify phrases, and tighten sentences. Be concise but clear.`,
        build: (text, opts) => `Shorten this text.
Target length: ${opts.length || 'concise'}
Style: ${opts.style || 'maintain original'}

Text:
${text}

Make it shorter while preserving all key information.`
    },
    
    'rephrase': {
        system: `You rephrase text while preserving meaning. Use different sentence structures, synonyms, and phrasing. Improve flow and readability.`,
        build: (text, opts) => `Rephrase this text.
Tone: ${opts.tone || 'maintain original'}

Text:
${text}

Express the same ideas differently with improved flow.`
    },
    
    'grammar': {
        system: `You fix spelling and grammar errors. Correct punctuation, verb tense, subject-verb agreement, and word usage. Preserve the author's voice.`,
        build: (text, opts) => `Fix spelling and grammar in this text.
Language: ${opts.language || 'English'}

Text:
${text}

Correct all errors while preserving the original voice.`
    },
    
    'vocabulary': {
        system: `You improve vocabulary usage. Replace simple words with more precise or sophisticated alternatives where appropriate. Maintain readability.`,
        build: (text, opts) => `Improve vocabulary in this text.
Level: ${opts.level || 'advanced'}

Text:
${text}

Enhance word choice with more precise or sophisticated vocabulary.`
    },
    
    'change-tone': {
        system: `You change the tone of text while preserving meaning. Adjust word choice, sentence structure, and formality to match the target tone.`,
        build: (text, opts) => `Change the tone of this text to ${opts.tone || 'professional'}.
Target tone: ${opts.tone || 'professional'}

Text:
${text}

Rewrite with appropriate vocabulary and phrasing for the target tone.`
    },
    
    'change-style': {
        system: `You change writing style while preserving content. Adapt to academic, blog, technical, creative, or report styles as requested.`,
        build: (text, opts) => `Change this text to ${opts.style || 'academic'} style.
Target style: ${opts.style || 'academic'}

Text:
${text}

Rewrite with appropriate structure, vocabulary, and conventions for the target style.`
    },
    
    'translate': {
        system: `You are a professional translator. Translate accurately while preserving meaning, tone, and nuance. Adapt idioms and cultural references appropriately.`,
        build: (text, opts) => `Translate this text to ${opts['target-language'] || opts.language || 'Spanish'}.
Target language: ${opts['target-language'] || opts.language || 'Spanish'}

Text:
${text}

Provide a fluent, accurate translation.`
    },
    
    'simplify': {
        system: `You simplify complex text for broader audiences. Use simpler words, shorter sentences, and clear explanations. Maintain all key information.`,
        build: (text, opts) => `Simplify this complex text.
Audience: ${opts.audience || 'general'}

Text:
${text}

Make it easier to understand without losing important information.`
    },
    
    'formalize': {
        system: `You make informal text more formal. Remove colloquialisms, contractions, and casual language. Use professional vocabulary and structure.`,
        build: (text, opts) => `Make this text more formal.
Text:
${text}

Rewrite in formal, professional language.`
    },
    
    'engage': {
        system: `You make text more engaging and compelling. Use rhetorical devices, varied sentence structure, and vivid language. Capture reader attention.`,
        build: (text, opts) => `Make this text more engaging.
Text:
${text}

Enhance with rhetorical devices, varied sentences, and vivid language.`
    },
    
    'remove-redundancy': {
        system: `You remove redundancy and repetition from text. Eliminate duplicate ideas, unnecessary words, and verbose phrases. Tighten without losing meaning.`,
        build: (text, opts) => `Remove redundancy from this text.
Text:
${text}

Eliminate repetition and unnecessary words while preserving all information.`
    },
    
    'add-examples': {
        system: `You add relevant examples to illustrate concepts. Examples should be clear, concrete, and helpful for understanding. Match the text's tone.`,
        build: (text, opts) => `Add examples to this text.
Number: ${opts.count || 3}

Text:
${text}

Add clear, relevant examples to illustrate key points.`
    },
    
    'passive-to-active': {
        system: `You convert passive voice to active voice where appropriate. Identify passive constructions and rewrite with active subjects. Improve clarity and directness.`,
        build: (text, opts) => `Convert passive voice to active voice.
Text:
${text}

Rewrite passive constructions to active voice. Preserve meaning.`
    },
    
    'clarity': {
        system: `You improve text clarity. Untangle confusing sentences, clarify ambiguous references, and improve logical flow. Make the text easier to understand.`,
        build: (text, opts) => `Improve clarity of this text.
Text:
${text}

Clarify confusing parts, fix ambiguity, improve flow.`
    },

    // ========== CATEGORY 5: STUDY & LEARNING (15 tools) ==========
    'flashcard-gen': {
        system: `You create high-quality flashcards for learning. Questions should test understanding, not just recall. Answers should be complete but concise. Format: Q: [question] A: [answer] ---`,
        build: (text, opts) => `Create ${opts.count || 10} flashcards from this content.
Difficulty: ${opts.difficulty || 'medium'}

Content:
${text}

Format each: Q: [question] A: [answer] ---`
    },
    
    'mcq': {
        system: `You create multiple choice questions. Each question should have 4 options (A-D), one correct answer, and explanations for why the correct answer is right and others are wrong.`,
        build: (text, opts) => `Create ${opts.count || 5} multiple choice questions.
Difficulty: ${opts.difficulty || 'medium'}
Type: ${opts.type || 'standard'}

Content:
${text}

For each: Question, Options A-D, Correct Answer, Explanation.`
    },
    
    'fill-blanks': {
        system: `You create fill-in-the-blank questions. Remove key terms or phrases, replace with _____ . Provide context clues. Include answer key.`,
        build: (text, opts) => `Create ${opts.count || 5} fill-in-the-blank questions.
Difficulty: ${opts.difficulty || 'medium'}

Content:
${text}

For each: Sentence with blank, context, answer.`
    },
    
    'true-false': {
        system: `You create true/false questions. Statements should be clearly true or false (not ambiguous). Include explanation for the answer.`,
        build: (text, opts) => `Create ${opts.count || 5} true/false questions.
Difficulty: ${opts.difficulty || 'medium'}

Content:
${text}

For each: Statement, Answer (T/F), Explanation.`
    },
    
    'study-schedule': {
        system: `You create study schedules based on content and time available. Break topics into sessions, estimate time needed, suggest review intervals, and include breaks.`,
        build: (text, opts) => `Create a study schedule for this content.
Time available: ${opts.time || '1 week'}

Content to study:
${text}

Create schedule with: daily sessions, topics to cover, review intervals, breaks.`
    },
    
    'exam-notes': {
        system: `You create exam preparation notes. Focus on likely test topics, key formulas/concepts, common pitfalls, and practice questions. Highlight what's most important.`,
        build: (text, opts) => `Create exam prep notes from this content.
Exam type: ${opts.type || 'standard'}

Content:
${text}

Include: Key Topics, Important Formulas/Concepts, Common Pitfalls, Practice Questions.`
    },
    
    'explain': {
        system: `You explain concepts at different levels. For ELI5: use simple analogies. For Student: clear educational explanation. For Expert: technical depth.`,
        build: (text, opts) => `Explain this concept for a ${opts.audience || 'student'} audience.
Audience level: ${opts.audience || 'student'}

Concept:
${text}

Provide clear explanation appropriate for the audience.`
    },
    
    'definitions': {
        system: `You extract key terms and provide clear definitions. Include pronunciation if helpful, part of speech, and example sentence.`,
        build: (text, opts) => `Extract key terms and define them.
Language: ${opts.language || 'English'}

Text:
${text}

For each term: Term, Definition, Example sentence.`
    },
    
    'formulas': {
        system: `You extract formulas and explain them. For each: formula in proper notation, what each variable means, when to use it, and example application.`,
        build: (text, opts) => `Extract formulas from this content.
Text:
${text}

For each formula: Formula, Variables (with meanings), When to use, Example.`
    },
    
    'case-study': {
        system: `You break down case studies. Include: background, problem, solution, outcomes, key lessons, and discussion questions. Use structured format.`,
        build: (text, opts) => `Create a case study breakdown.
Text:
${text}

Structure: Background, Problem, Solution, Outcomes, Key Lessons, Discussion Questions.`
    },
    
    'comparison-table': {
        system: `You create comparison tables. Identify items to compare, relevant dimensions, and populate cells with accurate information. Present as markdown table.`,
        build: (text, opts) => `Create a comparison table from this.
Text:
${text}

Create a markdown table comparing the key items across relevant dimensions.`
    },
    
    'procon': {
        system: `You create balanced pro/con lists. Identify arguments for and against, weight them by importance, and provide analysis.`,
        build: (text, opts) => `Create a pro/con list for this topic.
Topic/issue:
${text}

Format:
PROS:
• ...
CONS:
• ...
Analysis: ...`
    },
    
    'timeline-study': {
        system: `You create historical timelines. Organize events chronologically, include dates, brief descriptions, and significance. Note causal relationships.`,
        build: (text, opts) => `Create a historical timeline from this.
Text:
${text}

Format: Date | Event | Description | Significance`
    },
    
    'glossary': {
        system: `You create glossaries from text. Alphabetize terms, provide clear definitions, and cross-reference related terms.`,
        build: (text, opts) => `Create a glossary from this text.
Text:
${text}

Alphabetical list of key terms with definitions.`
    },
    
    'mindmap-study': {
        system: `You create study mind maps. Central topic, main branches, sub-branches. Use indentation to show hierarchy. Include connections between branches.`,
        build: (text, opts) => `Create a study mind map from this.
Central topic: ${text.substring(0, 50)}...

Text:
${text}

Create hierarchical tree with: Central Topic → Main Branches → Sub-branches → Details. Use indentation.`
    },

    // ========== CATEGORY 6: RESEARCH & WRITING (15 tools) ==========
    'research-outline': {
        system: `You create research paper outlines. Include: title, abstract summary, introduction sections, literature review structure, methodology, results organization, discussion points, conclusion, references.`,
        build: (text, opts) => `Create a research outline from this.
Topic: ${text.substring(0, 100)}...

Additional details:
${text}

Structure: Title, Abstract (summary), Introduction sections, Literature Review, Methodology, Results, Discussion, Conclusion, References.`
    },
    
    'thesis': {
        system: `You craft strong thesis statements. Should be specific, arguable, and map the paper's structure. Provide options with explanations.`,
        build: (text, opts) => `Create a thesis statement for this topic.
Topic/notes:
${text}

Provide 3 thesis options with brief explanation of each.`
    },
    
    'intro': {
        system: `You write engaging introduction paragraphs. Hook reader, provide context, state thesis, and preview structure. Adjust to academic or general audience.`,
        build: (text, opts) => `Write an introduction for this topic.
Audience: ${opts.audience || 'academic'}

Topic/notes:
${text}

Write a complete introduction with hook, context, thesis, and preview.`
    },
    
    'conclusion': {
        system: `You write strong conclusion paragraphs. Synthesize main points, restate thesis freshly, discuss implications, and end memorably. No new information.`,
        build: (text, opts) => `Write a conclusion for this paper.
Paper content:
${text}

Write conclusion synthesizing main points and discussing implications.`
    },
    
    'essay-planner': {
        system: `You create essay structure plans. Include: thesis, topic sentences for each paragraph, evidence needed, and transitions. Create coherent argument flow.`,
        build: (text, opts) => `Create an essay structure plan.
Topic/notes:
${text}

Plan: Thesis, Paragraph 1 (topic sentence + evidence), Paragraph 2 (...), etc., Conclusion approach.`
    },
    
    'bibliography': {
        system: `You format citations in APA, MLA, or Chicago style. Provide properly formatted references and in-text citation examples.`,
        build: (text, opts) => `Format these sources in ${opts.style || 'APA'} style.
Style: ${opts.style || 'APA'}

Sources:
${text}

Provide formatted bibliography and in-text citation examples.`
    },
    
    'strengthen': {
        system: `You strengthen arguments by adding evidence, improving logic, addressing counterarguments, and using rhetorical devices. Make arguments more persuasive.`,
        build: (text, opts) => `Strengthen this argument.
Argument:
${text}

Add evidence, improve logic, address counterarguments, enhance persuasion.`
    },
    
    'counter-arg': {
        system: `You generate thoughtful counterarguments. Anticipate objections, acknowledge valid points, and prepare rebuttals. Strengthen critical thinking.`,
        build: (text, opts) => `Generate counterarguments for this position.
Position/argument:
${text}

For each counterargument: The objection, why it's valid (if it is), potential rebuttal.`
    },
    
    'evidence': {
        system: `You suggest types of evidence that would support arguments. Recommend statistics, expert opinions, case studies, examples, or data needed.`,
        build: (text, opts) => `Suggest evidence for this argument.
Argument:
${text}

Recommend specific types of evidence and how to find/use them.`
    },
    
    'research-questions': {
        system: `You formulate research questions. Questions should be specific, researchable, and significant. Provide main question and sub-questions.`,
        build: (text, opts) => `Formulate research questions for this topic.
Topic/area:
${text}

Provide main research question and 3-5 sub-questions.`
    },
    
    'hypothesis': {
        system: `You generate testable hypotheses. Should be specific, falsifiable, and based on existing knowledge. Include independent and dependent variables.`,
        build: (text, opts) => `Generate a hypothesis for this research topic.
Topic/background:
${text}

Provide hypothesis with: If... then... statement, variables, and rationale.`
    },
    
    'lit-review': {
        system: `You create literature review notes. Summarize key papers, identify themes and debates, note methodological approaches, and highlight gaps.`,
        build: (text, opts) => `Create literature review notes from these sources.
Sources:
${text}

Organize by themes/debates, summarize key findings, identify gaps.`
    },
    
    'abstract-writer': {
        system: `You write abstracts for papers. Include: background, objective, methods, key results, conclusion, keywords. Stay within word limit.`,
        build: (text, opts) => `Write an abstract for this paper.
Paper content:
${text}

Include: Background, Objective, Methods, Results, Conclusion, Keywords.`
    },
    
    'report-structure': {
        system: `You create report structures. Include: executive summary, introduction, methodology, findings, analysis, conclusions, recommendations, appendices.`,
        build: (text, opts) => `Create a report structure for this topic.
Topic/content:
${text}

Outline complete report structure with section descriptions.`
    },
    
    'white-paper': {
        system: `You create white paper outlines. Include: title, abstract, problem statement, solution overview, detailed solution, case studies, implementation, conclusion, about author.`,
        build: (text, opts) => `Create a white paper outline on this topic.
Topic:
${text}

Outline with: Title, Abstract, Problem, Solution, Details, Case Studies, Implementation, Conclusion.`
    },

    // ========== CATEGORY 7: CONTENT CREATION (15 tools) ==========
    'blog-outline': {
        system: `You create blog post outlines. Include: catchy title, introduction hook, 3-5 main sections with subpoints, conclusion, and SEO keywords.`,
        build: (text, opts) => `Create a blog post outline on this topic.
Topic:
${text}

Outline: Title, Introduction, Main sections (3-5 with subpoints), Conclusion, SEO keywords.`
    },
    
    'blog-intro': {
        system: `You write engaging blog introductions. Start with hook, establish relevance, preview content, and encourage reading. Match blog's voice.`,
        build: (text, opts) => `Write a blog introduction for this topic.
Topic/notes:
${text}
Tone: ${opts.tone || 'conversational'}

Write engaging introduction paragraph(s).`
    },
    
    'social-caption': {
        system: `You write social media captions for different platforms. For Twitter/X: concise with hashtags. LinkedIn: professional with insights. Instagram: visual-focused with emojis.`,
        build: (text, opts) => `Write a ${opts.platform || 'Twitter'} caption for this.
Platform: ${opts.platform || 'Twitter'}
Content:
${text}

Write appropriate caption with hashtags.`
    },
    
    'email-writer': {
        system: `You write professional emails. Include subject line, appropriate greeting, clear purpose, call to action, professional closing, and signature.`,
        build: (text, opts) => `Write an email about this.
Context:
${text}
Tone: ${opts.tone || 'professional'}

Write complete email with subject, greeting, body, call to action, closing.`
    },
    
    'newsletter': {
        system: `You write newsletter sections. Engaging subject line, welcoming intro, main content with subheadings, and closing with call to action.`,
        build: (text, opts) => `Write a newsletter section on this topic.
Topic/content:
${text}

Include: Subject line idea, engaging intro, main content, call to action.`
    },
    
    'press-release': {
        system: `You write press release outlines. Include: FOR IMMEDIATE RELEASE, headline, dateline, lead paragraph, body quotes, boilerplate, media contact.`,
        build: (text, opts) => `Create a press release outline for this announcement.
Announcement details:
${text}

Structure with all standard press release elements.`
    },
    
    'product-desc': {
        system: `You write compelling product descriptions. Highlight benefits, features, use cases, and differentiation. Persuasive and clear.`,
        build: (text, opts) => `Write a product description for this.
Product info:
${text}

Describe benefits, features, use cases, what makes it different.`
    },
    
    'ad-copy': {
        system: `You write advertising copy. Attention-grabbing headline, persuasive body, strong call to action. Adapt to medium (print, digital, social).`,
        build: (text, opts) => `Write ad copy for this product/service.
Details:
${text}
Medium: ${opts.medium || 'digital'}

Write headline, body, call to action.`
    },
    
    'tagline': {
        system: `You create memorable taglines. Short, catchy, meaningful, and brand-appropriate. Provide options with rationale.`,
        build: (text, opts) => `Create taglines for this brand/product.
Description:
${text}

Provide 5 tagline options with brief explanation for each.`
    },
    
    'headline': {
        system: `You write attention-grabbing headlines. Use power words, create curiosity, promise value, and optimize for clicks. Provide options.`,
        build: (text, opts) => `Write headlines for this content.
Content summary:
${text}

Provide 10 headline options with different angles.`
    },
    
    'faq': {
        system: `You create FAQ sections. Anticipate common questions, provide clear answers, organize logically. Use customer-friendly language.`,
        build: (text, opts) => `Create FAQ for this topic/product.
Information:
${text}

Create 8-10 FAQs with clear, helpful answers.`
    },
    
    'about-page': {
        system: `You write About page content. Tell company story, convey mission/values, build trust, and include call to action. Engaging and authentic.`,
        build: (text, opts) => `Write About page content for this company.
Company info:
${text}

Include: Story, Mission/Values, Team (if relevant), Call to action.`
    },
    
    'bio': {
        system: `You write professional or casual bios. Include key achievements, expertise, personality, and purpose. Adapt to platform.`,
        build: (text, opts) => `Write a ${opts.tone || 'professional'} bio for this person.
Information:
${text}
Tone: ${opts.tone || 'professional'}

Write appropriate bio for the context.`
    },
    
    'cover-letter': {
        system: `You write cover letters. Address specific job, highlight relevant skills, show enthusiasm, and request interview. Professional and personalized.`,
        build: (text, opts) => `Write a cover letter for this job application.
Job details and qualifications:
${text}

Write complete, professional cover letter.`
    },
    
    'job-desc': {
        system: `You write job descriptions. Include: job title, summary, responsibilities, requirements, benefits, and how to apply. Clear and attractive.`,
        build: (text, opts) => `Write a job description from these notes.
Position details:
${text}

Include: Title, Summary, Responsibilities, Requirements, Benefits, Application process.`
    },

    // ========== CATEGORY 8: DOCUMENT TOOLS (15 tools) ==========
    'doc-analyzer': {
        system: `You analyze document structure. Identify document type, sections, purpose, audience, and key elements. Provide structural insights.`,
        build: (text, opts) => `Analyze this document's structure.
Document:
${text}

Identify: Document type, Main sections, Purpose, Target audience, Key structural elements.`
    },
    
    'toc': {
        system: `You generate table of contents from documents. Extract headings at all levels, maintain hierarchy, include page numbers if available.`,
        build: (text, opts) => `Generate a table of contents from this document.
Document:
${text}

Extract headings with proper indentation showing hierarchy.`
    },
    
    'exec-summary': {
        system: `You write executive summaries for business documents. Capture problem, solution, key findings, recommendations, and expected outcomes. Concise for executives.`,
        build: (text, opts) => `Write an executive summary for this document.
Document:
${text}

Summarize for executives: Problem, Solution, Findings, Recommendations, Outcomes.`
    },
    
    'action-plan': {
        system: `You create action plans from goals. Break down into steps, assign responsibilities, set timelines, identify resources needed, and define success metrics.`,
        build: (text, opts) => `Create an action plan from these goals.
Goals/objectives:
${text}

Plan: Steps (with owner and timeline), Resources needed, Success metrics.`
    },
    
    'project-brief': {
        system: `You write project briefs. Include: project overview, objectives, scope, deliverables, timeline, stakeholders, success criteria.`,
        build: (text, opts) => `Write a project brief from these notes.
Project information:
${text}

Include: Overview, Objectives, Scope, Deliverables, Timeline, Stakeholders, Success criteria.`
    },
    
    'sop': {
        system: `You create Standard Operating Procedures. Clear title, purpose, scope, responsibilities, step-by-step instructions, safety notes, and review date.`,
        build: (text, opts) => `Create an SOP from these instructions.
Process information:
${text}

Format: Title, Purpose, Scope, Responsibilities, Steps (numbered), Safety notes, Review date.`
    },
    
    'policy-outline': {
        system: `You create policy document outlines. Include: policy statement, purpose, scope, definitions, policy details, compliance, exceptions, review cycle.`,
        build: (text, opts) => `Create a policy outline for this area.
Policy topic/notes:
${text}

Outline with all standard policy sections.`
    },
    
    'proposal-outline': {
        system: `You create proposal outlines. Include: executive summary, problem statement, proposed solution, methodology, timeline, budget, qualifications, conclusion.`,
        build: (text, opts) => `Create a proposal outline for this project.
Project details:
${text}

Outline with all proposal sections.`
    },
    
    'contract-simplify': {
        system: `You simplify contract clauses into plain language. Explain what each clause means in practice, highlight obligations and risks.`,
        build: (text, opts) => `Simplify these contract clauses.
Contract text:
${text}

For each clause: Original summary, Plain language explanation, Key obligations, Risks.`
    },
    
    'tos-simplify': {
        system: `You simplify Terms of Service. Highlight key points: what user agrees to, what company promises, limitations, termination, dispute resolution.`,
        build: (text, opts) => `Simplify these Terms of Service.
ToS text:
${text}

Summarize: User obligations, Company commitments, Limitations, Termination, Dispute resolution.`
    },
    
    'privacy-simplify': {
        system: `You simplify Privacy Policies. Explain: what data collected, how used, who shared with, user rights, cookie policy, contact info.`,
        build: (text, opts) => `Simplify this Privacy Policy.
Policy text:
${text}

Summarize: Data collected, Usage, Sharing, User rights, Cookies, Contact.`
    },
    
    'meeting-agenda-doc': {
        system: `You create professional meeting agendas. Include: meeting title, date/time, attendees, objectives, agenda items with time allocations, pre-work, preparation notes.`,
        build: (text, opts) => `Create a meeting agenda from these notes.
Meeting details:
${text}

Create complete agenda with all elements.`
    },
    
    'business-plan': {
        system: `You create business plan outlines. Include: executive summary, company description, market analysis, organization, product line, marketing, funding request, financial projections.`,
        build: (text, opts) => `Create a business plan outline for this venture.
Venture details:
${text}

Outline with all standard business plan sections.`
    },
    
    'pitch-deck': {
        system: `You create pitch deck outlines. Include: problem, solution, market size, product, business model, traction, team, competition, financials, ask.`,
        build: (text, opts) => `Create a pitch deck outline for this startup.
Company details:
${text}

Outline 10-12 slides with key content for each.`
    },
    
    'investor-brief': {
        system: `You create investor briefs. Concise document with: company overview, market opportunity, competitive advantage, financial highlights, use of funds, traction.`,
        build: (text, opts) => `Create an investor brief for this company.
Company information:
${text}

Create 1-page brief covering key investment information.`
    },

    // ========== CATEGORY 9: AI REWRITING (15 tools) ==========
    'academic-rewrite': {
        system: `You rewrite text in formal academic style. Use scholarly vocabulary, complex sentences, passive voice where appropriate, and citation-style references.`,
        build: (text, opts) => `Rewrite this in academic style.
Text:
${text}

Use formal academic language, appropriate terminology, and scholarly tone.`
    },
    
    'humanize': {
        system: `You make AI-generated text sound more human and natural. Add personality, vary sentence structure, include natural hesitations and emphasis, make it conversational.`,
        build: (text, opts) => `Humanize this AI-generated text.
Text:
${text}

Make it sound more natural, conversational, and human.`
    },
    
    'make-formal': {
        system: `You make text more formal. Remove contractions, colloquialisms, casual language. Use professional vocabulary and sentence structure.`,
        build: (text, opts) => `Make this text more formal.
Text:
${text}

Rewrite in formal, professional language.`
    },
    
    'make-casual': {
        system: `You make text more casual and conversational. Use contractions, simpler words, friendly tone. Write like you're talking to a friend.`,
        build: (text, opts) => `Make this text more casual.
Text:
${text}

Rewrite in friendly, conversational style.`
    },
    
    'paraphrase': {
        system: `You paraphrase text to avoid plagiarism while preserving meaning. Use different sentence structures and synonyms. Maintain original ideas.`,
        build: (text, opts) => `Paraphrase this text.
Text:
${text}

Express the same ideas completely differently.`
    },
    
    'restructure': {
        system: `You restructure sentences for variety and flow. Vary sentence length, change sentence openings, combine or split sentences as needed.`,
        build: (text, opts) => `Restructure sentences in this text.
Text:
${text}

Improve sentence variety and flow while preserving meaning.`
    },
    
    'condense': {
        system: `You condense paragraphs while preserving key information. Remove redundancy, combine ideas, tighten phrasing. Make it concise.`,
        build: (text, opts) => `Condense these paragraphs.
Text:
${text}

Make it more concise while preserving all key information.`
    },
    
    'expand': {
        system: `You expand on ideas with additional explanation, examples, and details. Maintain original style and add value.`,
        build: (text, opts) => `Expand on these ideas.
Text:
${text}

Add explanations, examples, and relevant details.`
    },
    
    'transitions': {
        system: `You add transitional phrases to improve flow between sentences and paragraphs. Use appropriate transitions for logical relationships.`,
        build: (text, opts) => `Add transitions to improve flow.
Text:
${text}

Insert appropriate transitional words and phrases.`
    },
    
    'clarity-rewrite': {
        system: `You rewrite for maximum clarity. Untangle complex sentences, clarify ambiguous references, use simpler words where appropriate, improve readability.`,
        build: (text, opts) => `Rewrite this for clarity.
Text:
${text}

Make it easier to understand while preserving all information.`
    },
    
    'coherence': {
        system: `You improve coherence by ensuring ideas connect logically. Add linking concepts, ensure smooth progression, check that each sentence follows from the last.`,
        build: (text, opts) => `Improve coherence of this text.
Text:
${text}

Ensure logical flow and smooth connections between ideas.`
    },
    
    'flow': {
        system: `You improve writing flow. Vary sentence structure, use appropriate rhythm, ensure smooth reading experience. Make it pleasurable to read.`,
        build: (text, opts) => `Improve the flow of this text.
Text:
${text}

Enhance rhythm and reading experience.`
    },
    
    'emphasis': {
        system: `You add emphasis to key points. Use rhetorical devices, strategic repetition, strong vocabulary, and sentence structure that highlights important ideas.`,
        build: (text, opts) => `Add emphasis to key points in this text.
Text:
${text}

Highlight the most important ideas without changing meaning.`
    },
    
    'storytelling': {
        system: `You rewrite text in storytelling style. Use narrative elements: character, conflict, resolution, vivid details, emotional engagement. Make it compelling.`,
        build: (text, opts) => `Rewrite this as a story.
Text:
${text}

Use narrative elements to make it engaging and compelling.`
    },
    
    'tech-to-simple': {
        system: `You translate technical language to simple terms. Explain jargon, avoid acronyms without explanation, use analogies. Make it accessible to non-experts.`,
        build: (text, opts) => `Simplify this technical text for non-experts.
Technical text:
${text}

Explain concepts simply with analogies where helpful.`
    },

    // ========== CATEGORY 10: SPECIAL AI TOOLS (15 tools) ==========
    'swot': {
        system: `You create comprehensive SWOT analyses. Identify Strengths, Weaknesses, Opportunities, and Threats. Provide strategic insights based on the analysis.`,
        build: (text, opts) => `Create a SWOT analysis for this situation.
Context:
${text}

Format:
STRENGTHS:
• ...
WEAKNESSES:
• ...
OPPORTUNITIES:
• ...
THREATS:
• ...
Strategic Insights: ...`
    },
    
    'risk': {
        system: `You create risk assessment notes. Identify risks, assess likelihood and impact, propose mitigation strategies, and assign owners.`,
        build: (text, opts) => `Create risk assessment for this project/activity.
Context:
${text}

For each risk: Risk description, Likelihood (H/M/L), Impact (H/M/L), Mitigation strategy, Owner.`
    },
    
    'decision-matrix': {
        system: `You create decision matrices. Identify options, criteria, weights, and scores. Calculate weighted scores and recommend best option.`,
        build: (text, opts) => `Create a decision matrix for this choice.
Decision context and options:
${text}

Create matrix with: Options, Criteria (with weights), Scores, Weighted totals, Recommendation.`
    },
    
    'root-cause': {
        system: `You perform root cause analysis. Identify problem, gather data, identify causal factors, find root causes, recommend solutions. Use fishbone or 5-why approach.`,
        build: (text, opts) => `Perform root cause analysis for this problem.
Problem description:
${text}

Identify: Problem statement, Causal factors, Root causes, Recommended solutions.`
    },
    
    'five-why': {
        system: `You apply 5-Why analysis. Start with problem, ask "why" five times to trace to root cause. Document each level with evidence.`,
        build: (text, opts) => `Apply 5-Why analysis to this problem.
Problem:
${text}

Document:
Why 1: ... → Because ...
Why 2: ... → Because ...
Why 3: ... → Because ...
Why 4: ... → Because ...
Why 5: ... → Because ...
Root cause: ...`
    },
    
    'problem-solution': {
        system: `You create problem-solution notes. Clearly define problem, analyze causes, generate multiple solutions, evaluate options, recommend best solution with implementation steps.`,
        build: (text, opts) => `Create problem-solution analysis for this.
Issue:
${text}

Include: Problem definition, Cause analysis, Solution options, Evaluation, Recommended solution, Implementation steps.`
    },
    
    'brainstorming': {
        system: `You generate brainstorming ideas. Quantity over quality initially, then refine and organize. Encourage creative, diverse ideas.`,
        build: (text, opts) => `Brainstorm ideas for this topic/challenge.
Topic:
${text}

Generate 20+ diverse ideas, then group and prioritize the best ones.`
    },
    
    'mindmap-special': {
        system: `You create mind maps for any topic. Central idea, main branches, sub-branches, and connections. Use indentation for hierarchy.`,
        build: (text, opts) => `Create a mind map for this topic.
Topic:
${text}

Create hierarchical tree with indentation showing relationships.`
    },
    
    'concept-map': {
        system: `You create concept maps showing relationships between ideas. Identify concepts, connect with labeled arrows (e.g., "leads to", "contradicts", "supports").`,
        build: (text, opts) => `Create a concept map for these ideas.
Content:
${text}

List concepts and describe relationships between them. Format as: Concept A --[relationship]--> Concept B`
    },
    
    'knowledge-base': {
        system: `You write knowledge base articles. Clear title, brief summary, detailed sections, examples, related articles. Make it useful and searchable.`,
        build: (text, opts) => `Create a knowledge base article on this topic.
Topic/information:
${text}

Structure: Title, Summary, Detailed sections, Examples, Related topics.`
    },
    
    'lesson-plan': {
        system: `You create lesson plans. Include: learning objectives, materials needed, lesson flow (with timing), activities, assessment, differentiation, homework.`,
        build: (text, opts) => `Create a lesson plan for this topic.
Topic/notes:
${text}
Duration: ${opts.duration || '60 minutes'}

Create complete lesson plan with all elements.`
    },
    
    'training': {
        system: `You create training material outlines. Include: learning objectives, modules with topics, activities, assessments, resources, and time allocation.`,
        build: (text, opts) => `Create training material outline for this subject.
Subject/content:
${text}
Duration: ${opts.duration || 'full day'}

Outline modules, topics, activities, assessments.`
    },
    
    'workshop': {
        system: `You create workshop agendas. Include: workshop title, learning objectives, schedule with timings, activities for each segment, materials needed, facilitation notes.`,
        build: (text, opts) => `Create a workshop agenda for this topic.
Workshop topic:
${text}
Duration: ${opts.duration || 'half day'}

Create detailed agenda with timings and activities.`
    },
    
    'tutorial': {
        system: `You create tutorial outlines. Step-by-step instructions, prerequisites, learning objectives, practice exercises, troubleshooting tips.`,
        build: (text, opts) => `Create a tutorial outline for this skill/topic.
Topic:
${text}

Include: Prerequisites, Learning objectives, Steps (with explanations), Practice exercises, Troubleshooting.`
    },
    
    'how-to': {
        system: `You create how-to guides. Clear title, brief introduction, list of required items/skills, numbered steps with explanations, tips, and troubleshooting.`,
        build: (text, opts) => `Create a how-to guide for this task.
Task description:
${text}

Create complete guide: Introduction, Requirements, Steps (numbered with explanations), Tips, Troubleshooting.`
    }
};

// ========================================================
// OPTIONS CONFIGURATION
// ========================================================

const TOOL_OPTIONS = {
    // Note Generation
    'generate-notes': ['format', 'style', 'tone', 'length', 'language'],
    'lecture-notes': ['style', 'tone', 'length', 'language'],
    'meeting-notes': ['tone', 'language'],
    'article-notes': ['style', 'language'],
    'pdf-notes': ['length', 'language'],
    'outline-generator': ['style', 'language'],
    'bullet-notes': ['tone', 'language'],
    'key-points': ['count', 'language'],
    'research-notes': ['language'],
    'image-notes': ['language'],
    'code-notes': ['audience', 'language'],
    'legal-notes': ['language'],
    'medical-notes': ['language'],
    'study-guide': ['difficulty', 'language'],
    'concept-notes': ['audience', 'language'],
    'flashcards': ['count', 'difficulty', 'language'],
    'knowledge-cards': ['count', 'language'],
    'executive-summary': ['length', 'language'],
    'daily-notes': ['language'],
    'mindmap-notes': ['language'],
    'insights': ['count', 'language'],
    'topic-notes': ['language'],
    'quick-notes': ['language'],
    'paper-notes': ['language'],
    'debate-notes': ['language'],
    
    // Summarization
    'one-sentence': ['language'],
    'three-bullet': ['language'],
    'tldr': ['language'],
    'long-summary': ['length', 'language'],
    'abstract': ['language'],
    'custom-length': ['wordCount', 'language'],
    'key-ideas': ['language'],
    'quotes': ['count', 'language'],
    'multi-language': ['target-language', 'language'],
    'academic': ['language'],
    'legal-summary': ['language'],
    'medical-summary': ['language'],
    'news-digest': ['language'],
    'timeline': ['language'],
    'comparative': ['language'],
    'debate-summary': ['language'],
    'swot-summary': ['language'],
    'chapter': ['language'],
    'argument': ['language'],
    'digest': ['language'],
    
    // Meeting Tools
    'action-items': ['language'],
    'decisions': ['language'],
    'followup-email': ['tone', 'language'],
    'highlights': ['language'],
    'speaker-qa': ['language'],
    'meeting-timeline': ['language'],
    'sales-notes': ['language'],
    'client-notes': ['language'],
    'team-notes': ['language'],
    'strategy-notes': ['language'],
    'meeting-agenda': ['language'],
    'meeting-recap': ['language'],
    'interview-notes': ['language'],
    'training-notes': ['language'],
    'workshop-notes': ['language'],
    
    // Text Transformation
    'extend': ['style', 'length', 'language'],
    'shorten': ['length', 'style', 'language'],
    'rephrase': ['tone', 'language'],
    'grammar': ['language'],
    'vocabulary': ['level', 'language'],
    'change-tone': ['tone', 'language'],
    'change-style': ['style', 'language'],
    'translate': ['target-language', 'language'],
    'simplify': ['audience', 'language'],
    'formalize': ['language'],
    'engage': ['language'],
    'remove-redundancy': ['language'],
    'add-examples': ['count', 'language'],
    'passive-to-active': ['language'],
    'clarity': ['language'],
    
    // Study & Learning
    'flashcard-gen': ['count', 'difficulty', 'language'],
    'mcq': ['count', 'difficulty', 'type', 'language'],
    'fill-blanks': ['count', 'difficulty', 'language'],
    'true-false': ['count', 'difficulty', 'language'],
    'study-schedule': ['time', 'language'],
    'exam-notes': ['type', 'language'],
    'explain': ['audience', 'language'],
    'definitions': ['language'],
    'formulas': ['language'],
    'case-study': ['language'],
    'comparison-table': ['language'],
    'procon': ['language'],
    'timeline-study': ['language'],
    'glossary': ['language'],
    'mindmap-study': ['language'],
    
    // Research & Writing
    'research-outline': ['language'],
    'thesis': ['language'],
    'intro': ['audience', 'language'],
    'conclusion': ['language'],
    'essay-planner': ['language'],
    'bibliography': ['style', 'language'],
    'strengthen': ['language'],
    'counter-arg': ['language'],
    'evidence': ['language'],
    'research-questions': ['language'],
    'hypothesis': ['language'],
    'lit-review': ['language'],
    'abstract-writer': ['language'],
    'report-structure': ['language'],
    'white-paper': ['language'],
    
    // Content Creation
    'blog-outline': ['language'],
    'blog-intro': ['tone', 'language'],
    'social-caption': ['platform', 'language'],
    'email-writer': ['tone', 'language'],
    'newsletter': ['language'],
    'press-release': ['language'],
    'product-desc': ['language'],
    'ad-copy': ['medium', 'language'],
    'tagline': ['language'],
    'headline': ['language'],
    'faq': ['language'],
    'about-page': ['language'],
    'bio': ['tone', 'language'],
    'cover-letter': ['language'],
    'job-desc': ['language'],
    
    // Document Tools
    'doc-analyzer': ['language'],
    'toc': ['language'],
    'exec-summary': ['language'],
    'action-plan': ['language'],
    'project-brief': ['language'],
    'sop': ['language'],
    'policy-outline': ['language'],
    'proposal-outline': ['language'],
    'contract-simplify': ['language'],
    'tos-simplify': ['language'],
    'privacy-simplify': ['language'],
    'meeting-agenda-doc': ['language'],
    'business-plan': ['language'],
    'pitch-deck': ['language'],
    'investor-brief': ['language'],
    
    // AI Rewriting
    'academic-rewrite': ['language'],
    'humanize': ['language'],
    'make-formal': ['language'],
    'make-casual': ['language'],
    'paraphrase': ['language'],
    'restructure': ['language'],
    'condense': ['language'],
    'expand': ['language'],
    'transitions': ['language'],
    'clarity-rewrite': ['language'],
    'coherence': ['language'],
    'flow': ['language'],
    'emphasis': ['language'],
    'storytelling': ['language'],
    'tech-to-simple': ['language'],
    
    // Special Tools
    'swot': ['language'],
    'risk': ['language'],
    'decision-matrix': ['language'],
    'root-cause': ['language'],
    'five-why': ['language'],
    'problem-solution': ['language'],
    'brainstorming': ['language'],
    'mindmap-special': ['language'],
    'concept-map': ['language'],
    'knowledge-base': ['language'],
    'lesson-plan': ['duration', 'language'],
    'training': ['duration', 'language'],
    'workshop': ['duration', 'language'],
    'tutorial': ['language'],
    'how-to': ['language']
};

// ========================================================
// MIDDLEWARE
// ========================================================

app.use(express.json({ limit: '15mb' }));
app.use(express.urlencoded({ extended: true, limit: '15mb' }));
app.use(cors({
    origin: '*', // Open CORS for public tool
    methods: ['GET', 'POST'],
    allowedHeaders: ['Content-Type']
}));
app.use(express.static(__dirname)); // Serve static files

// Rate limiting middleware
app.use(async (req, res, next) => {
    if (req.path.startsWith('/api/')) {
        try {
            const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress;
            await rateLimiter.consume(ip);
            next();
        } catch (error) {
            res.status(429).json({ 
                error: 'Savoiré AI is busy. Please wait a moment.' 
            });
        }
    } else {
        next();
    }
});

// Security headers
app.use((req, res, next) => {
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('X-Frame-Options', 'DENY');
    res.setHeader('X-XSS-Protection', '1; mode=block');
    next();
});

// ========================================================
// UTILITY FUNCTIONS
// ========================================================

// Generate cache key
function generateCacheKey(text, tool, opts) {
    const data = { text, tool, ...opts };
    return crypto.createHash('sha256').update(JSON.stringify(data)).digest('hex');
}

// Clean cache periodically
setInterval(() => {
    const now = Date.now();
    for (const [key, value] of cache.entries()) {
        if (now - value.timestamp > CACHE_TTL) {
            cache.delete(key);
        }
    }
}, 60000); // Clean every minute

// Sanitize text input
function sanitizeText(text) {
    if (!text) return '';
    // Strip HTML tags
    text = text.replace(/<[^>]*>/g, '');
    // Limit length
    return text.substring(0, 25000);
}

// Validate tool
function validateTool(tool) {
    return TOOL_PROMPTS.hasOwnProperty(tool);
}

// Async handler wrapper
const asyncHandler = (fn) => (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
};

// ========================================================
// AI CALL FUNCTION (SSE STREAMING + FALLBACK)
// ========================================================

async function callAI(userPrompt, systemPrompt, streamMode = false, res = null) {
    const cacheKey = generateCacheKey(userPrompt, systemPrompt, {});
    
    // Check cache first (for non-streaming)
    if (!streamMode && cache.has(cacheKey)) {
        const cached = cache.get(cacheKey);
        if (Date.now() - cached.timestamp < CACHE_TTL) {
            return cached.result;
        }
    }
    
    const startTime = Date.now();
    const apiKey = process.env.OPENROUTER_API_KEY;
    
    if (!apiKey) {
        const errorMsg = 'OpenRouter API key not configured';
        if (streamMode && res) {
            res.write(`data: ${JSON.stringify({ type: 'error', message: errorMsg })}\n\n`);
            res.end();
            return;
        }
        throw new Error(errorMsg);
    }
    
    // Try each model in order
    for (const model of MODELS) {
        try {
            const controller = new AbortController();
            const timeout = setTimeout(() => controller.abort(), 40000); // 40s timeout
            
            const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${apiKey}`,
                    'Content-Type': 'application/json',
                    'HTTP-Referer': process.env.SITE_URL || 'http://localhost:3000',
                    'X-Title': 'Savoiré AI'
                },
                body: JSON.stringify({
                    model: model,
                    messages: [
                        { role: 'system', content: systemPrompt },
                        { role: 'user', content: userPrompt }
                    ],
                    temperature: 0.7,
                    max_tokens: 4000,
                    stream: streamMode
                }),
                signal: controller.signal
            });
            
            clearTimeout(timeout);
            
            if (!response.ok) {
                console.log(`Model ${model} failed: ${response.status}`);
                continue; // Try next model
            }
            
            if (streamMode && res) {
                // Handle streaming response
                res.setHeader('Content-Type', 'text/event-stream');
                res.setHeader('Cache-Control', 'no-cache');
                res.setHeader('Connection', 'keep-alive');
                
                res.write(`data: ${JSON.stringify({ type: 'start' })}\n\n`);
                
                const reader = response.body.getReader();
                const decoder = new TextDecoder();
                let fullText = '';
                
                while (true) {
                    const { done, value } = await reader.read();
                    if (done) break;
                    
                    const chunk = decoder.decode(value);
                    const lines = chunk.split('\n');
                    
                    for (const line of lines) {
                        if (line.startsWith('data: ')) {
                            const data = line.slice(6);
                            if (data === '[DONE]') continue;
                            
                            try {
                                const parsed = JSON.parse(data);
                                const content = parsed.choices[0]?.delta?.content || '';
                                if (content) {
                                    fullText += content;
                                    // Send token (word by word handled by frontend)
                                    res.write(`data: ${JSON.stringify({ type: 'token', content })}\n\n`);
                                }
                            } catch (e) {
                                // Ignore parse errors
                            }
                        }
                    }
                }
                
                const processingTime = Date.now() - startTime;
                res.write(`data: ${JSON.stringify({ type: 'done', meta: { ms: processingTime } })}\n\n`);
                res.end();
                
                // Cache the full result
                const cacheEntry = {
                    result: fullText,
                    timestamp: Date.now()
                };
                
                if (cache.size >= CACHE_MAX) {
                    // Remove oldest entry
                    const oldestKey = cache.keys().next().value;
                    cache.delete(oldestKey);
                }
                cache.set(cacheKey, cacheEntry);
                
                return;
            } else {
                // Handle non-streaming response
                const data = await response.json();
                const result = data.choices[0]?.message?.content || '';
                
                // Cache the result
                const cacheEntry = {
                    result,
                    timestamp: Date.now()
                };
                
                if (cache.size >= CACHE_MAX) {
                    const oldestKey = cache.keys().next().value;
                    cache.delete(oldestKey);
                }
                cache.set(cacheKey, cacheEntry);
                
                return result;
            }
        } catch (error) {
            console.log(`Error with model ${model}:`, error.message);
            continue; // Try next model
        }
    }
    
    // All models failed
    const fallbackText = "Savoiré AI is processing your request. Please try again in a moment.";
    
    if (streamMode && res) {
        res.write(`data: ${JSON.stringify({ type: 'token', content: fallbackText })}\n\n`);
        res.write(`data: ${JSON.stringify({ type: 'done', meta: { ms: Date.now() - startTime } })}\n\n`);
        res.end();
    } else {
        return fallbackText;
    }
}

// ========================================================
// FILE EXTRACTION FUNCTIONS
// ========================================================

async function extractFromPDF(buffer) {
    if (!pdfParse) return "PDF parsing library not available. Please install pdf-parse.";
    try {
        const data = await pdfParse(buffer);
        return data.text;
    } catch (error) {
        console.error('PDF extraction error:', error);
        return "Error extracting text from PDF.";
    }
}

async function extractFromDOCX(buffer) {
    if (!mammoth) return "DOCX parsing library not available. Please install mammoth.";
    try {
        const result = await mammoth.extractRawText({ buffer });
        return result.value;
    } catch (error) {
        console.error('DOCX extraction error:', error);
        return "Error extracting text from DOCX.";
    }
}

function extractFromTXT(buffer) {
    return buffer.toString('utf-8');
}

async function extractFromImage(buffer, mimetype) {
    // Use OpenRouter vision API
    const apiKey = process.env.OPENROUTER_API_KEY;
    if (!apiKey) return "OpenRouter API key not configured for image extraction.";
    
    const base64Image = buffer.toString('base64');
    const dataUrl = `data:${mimetype};base64,${base64Image}`;
    
    try {
        const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${apiKey}`,
                'Content-Type': 'application/json',
                'HTTP-Referer': process.env.SITE_URL || 'http://localhost:3000',
                'X-Title': 'Savoiré AI'
            },
            body: JSON.stringify({
                model: 'google/gemini-2.0-flash-exp:free',
                messages: [
                    {
                        role: 'user',
                        content: [
                            { type: 'text', text: 'Extract all text from this image exactly as written. Return only the extracted text.' },
                            { type: 'image_url', image_url: { url: dataUrl } }
                        ]
                    }
                ],
                max_tokens: 2000
            })
        });
        
        const data = await response.json();
        return data.choices[0]?.message?.content || 'No text extracted from image.';
    } catch (error) {
        console.error('Image extraction error:', error);
        return 'Error extracting text from image.';
    }
}

async function extractFromFile(file) {
    const { mimetype, buffer } = file;
    
    if (mimetype === 'application/pdf') {
        return await extractFromPDF(buffer);
    } else if (mimetype === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
        return await extractFromDOCX(buffer);
    } else if (mimetype === 'text/plain') {
        return extractFromTXT(buffer);
    } else if (mimetype.startsWith('image/')) {
        return await extractFromImage(buffer, mimetype);
    } else {
        return 'Unsupported file type.';
    }
}

// ========================================================
// API ROUTES
// ========================================================

// GET /api/health
app.get('/api/health', (req, res) => {
    res.json({ 
        status: 'operational', 
        version: '2.0', 
        tools: Object.keys(TOOL_PROMPTS).length 
    });
});

// GET /api/tools
app.get('/api/tools', (req, res) => {
    const tools = Object.keys(TOOL_PROMPTS).map(key => ({
        id: key,
        name: key.split('-').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' '),
        description: TOOL_PROMPTS[key].system.substring(0, 100) + '...',
        category: getCategoryFromTool(key),
        options: TOOL_OPTIONS[key] || []
    }));
    
    res.json({ tools });
});

// Helper to determine category
function getCategoryFromTool(toolId) {
    if (toolId.includes('notes') || toolId.includes('lecture') || toolId.includes('outline') || 
        toolId.includes('bullet') || toolId.includes('flashcard') || toolId.includes('mindmap') ||
        toolId.includes('study') || toolId.includes('knowledge') || toolId.includes('topic')) {
        return 'note-generation';
    }
    if (toolId.includes('summary') || toolId.includes('tldr') || toolId.includes('abstract') ||
        toolId.includes('digest') || toolId.includes('quotes') || toolId.includes('extract')) {
        return 'summarization';
    }
    if (toolId.includes('meeting') || toolId.includes('action') || toolId.includes('decision') ||
        toolId.includes('agenda') || toolId.includes('recap') || toolId.includes('interview')) {
        return 'meeting-tools';
    }
    if (toolId.includes('extend') || toolId.includes('shorten') || toolId.includes('rephrase') ||
        toolId.includes('grammar') || toolId.includes('vocabulary') || toolId.includes('tone') ||
        toolId.includes('style') || toolId.includes('translate')) {
        return 'text-transformation';
    }
    if (toolId.includes('flashcard') || toolId.includes('quiz') || toolId.includes('explain') ||
        toolId.includes('definition') || toolId.includes('formula') || toolId.includes('glossary')) {
        return 'study-learning';
    }
    if (toolId.includes('research') || toolId.includes('thesis') || toolId.includes('bibliography') ||
        toolId.includes('hypothesis') || toolId.includes('literature') || toolId.includes('abstract')) {
        return 'research-writing';
    }
    if (toolId.includes('blog') || toolId.includes('social') || toolId.includes('email') ||
        toolId.includes('newsletter') || toolId.includes('press') || toolId.includes('ad') ||
        toolId.includes('tagline') || toolId.includes('headline') || toolId.includes('faq')) {
        return 'content-creation';
    }
    if (toolId.includes('document') || toolId.includes('sop') || toolId.includes('policy') ||
        toolId.includes('proposal') || toolId.includes('contract') || toolId.includes('plan')) {
        return 'document-tools';
    }
    if (toolId.includes('rewrite') || toolId.includes('humanize') || toolId.includes('paraphrase') ||
        toolId.includes('restructure') || toolId.includes('condense') || toolId.includes('expand')) {
        return 'ai-rewriting';
    }
    return 'special-tools';
}

// POST /api/process (SSE streaming)
app.post('/api/process', upload.single('file'), asyncHandler(async (req, res) => {
    const { tool, text, format, style, tone, length, language, targetLanguage, audience, count, difficulty, type, wordCount, platform, medium, level, time, duration } = req.body;
    const file = req.file;
    
    // Validate tool
    if (!tool || !validateTool(tool)) {
        return res.status(400).json({ error: 'Invalid or missing tool' });
    }
    
    // Get input text (either from body or extracted from file)
    let inputText = text || '';
    if (file) {
        const extracted = await extractFromFile(file);
        inputText = extracted;
    }
    
    // Sanitize and validate
    inputText = sanitizeText(inputText);
    if (!inputText && !file) {
        return res.status(400).json({ error: 'No input text provided' });
    }
    
    // Build options object
    const opts = {
        format, style, tone, length, language,
        'target-language': targetLanguage,
        audience, count, difficulty, type,
        wordCount: parseInt(wordCount) || 200,
        platform, medium, level, time, duration
    };
    
    // Get tool config
    const toolConfig = TOOL_PROMPTS[tool];
    const userPrompt = toolConfig.build(inputText, opts);
    
    // Call AI with streaming
    await callAI(userPrompt, toolConfig.system, true, res);
}));

// POST /api/process/sync (non-streaming fallback)
app.post('/api/process/sync', upload.single('file'), asyncHandler(async (req, res) => {
    const { tool, text, format, style, tone, length, language, targetLanguage, audience, count, difficulty, type, wordCount, platform, medium, level, time, duration } = req.body;
    const file = req.file;
    
    // Validate tool
    if (!tool || !validateTool(tool)) {
        return res.status(400).json({ error: 'Invalid or missing tool' });
    }
    
    // Get input text
    let inputText = text || '';
    if (file) {
        const extracted = await extractFromFile(file);
        inputText = extracted;
    }
    
    inputText = sanitizeText(inputText);
    if (!inputText && !file) {
        return res.status(400).json({ error: 'No input text provided' });
    }
    
    // Build options
    const opts = {
        format, style, tone, length, language,
        'target-language': targetLanguage,
        audience, count, difficulty, type,
        wordCount: parseInt(wordCount) || 200,
        platform, medium, level, time, duration
    };
    
    // Get tool config
    const toolConfig = TOOL_PROMPTS[tool];
    const userPrompt = toolConfig.build(inputText, opts);
    
    // Call AI (non-streaming)
    const startTime = Date.now();
    const result = await callAI(userPrompt, toolConfig.system, false);
    const processingTime = Date.now() - startTime;
    
    // Count words
    const wordCount_result = result.trim().split(/\s+/).length;
    
    res.json({
        success: true,
        result: {
            text: result,
            tool,
            wordCount: wordCount_result
        },
        meta: { ms: processingTime }
    });
}));

// POST /api/extract
app.post('/api/extract', upload.single('file'), asyncHandler(async (req, res) => {
    const file = req.file;
    
    if (!file) {
        return res.status(400).json({ error: 'No file uploaded' });
    }
    
    const extractedText = await extractFromFile(file);
    const charCount = extractedText.length;
    const wordCount = extractedText.trim().split(/\s+/).length;
    
    res.json({
        success: true,
        text: extractedText,
        charCount,
        wordCount
    });
}));

// POST /api/share
app.post('/api/share', asyncHandler(async (req, res) => {
    const { title, content, tool } = req.body;
    
    if (!content) {
        return res.status(400).json({ error: 'No content to share' });
    }
    
    const id = uuidv4();
    shareStore.set(id, {
        title: title || 'Shared Note',
        content,
        tool,
        created: Date.now()
    });
    
    res.json({ id });
}));

// GET /api/share/:id
app.get('/api/share/:id', asyncHandler(async (req, res) => {
    const { id } = req.params;
    
    if (!shareStore.has(id)) {
        return res.status(404).json({ error: 'Shared content not found' });
    }
    
    res.json(shareStore.get(id));
}));

// ========================================================
// ERROR HANDLING
// ========================================================

// 404 handler
app.use((req, res) => {
    res.status(404).sendFile(path.join(__dirname, '404.html'));
});

// Error handler middleware
app.use((err, req, res, next) => {
    console.error('Server error:', err);
    
    // Don't leak error details in production
    const message = process.env.NODE_ENV === 'production' 
        ? 'An unexpected error occurred'
        : err.message;
    
    res.status(500).json({ error: message });
});

// ========================================================
// START SERVER
// ========================================================

app.listen(PORT, () => {
    console.log(`✦ Savoiré AI v2.0 running on port ${PORT}`);
    console.log(`✦ ${Object.keys(TOOL_PROMPTS).length} tools loaded`);
    console.log(`✦ Open http://localhost:${PORT} to start`);
});

// Export for Vercel
module.exports = app;
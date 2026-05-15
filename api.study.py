"""
Savoire AI v2.1 - Study API Engine
Developed by: Sooban Talha Technologies (soobantalhatech.xyz)
Founder: Sooban Talha
Ultra Luxury Dark Premium Edition
"""

import os
import json
import time
import re
from datetime import datetime
from typing import Generator, List, Dict, Any
from flask import Flask, request, jsonify, Response, stream_with_context

# OpenRouter Configuration
import openai

class SavoireStudyEngine:
    """Ultra-luxury AI study engine with 10 premium tools"""
    
    def __init__(self, api_key: str = None):
        self.client = openai.OpenAI(
            base_url="https://openrouter.ai/api/v1",
            api_key=api_key or os.getenv("OPENROUTER_API_KEY", "sk-or-v1-your-key-here")
        )
        self.default_model = "meta-llama/llama-3.3-70b-instruct:free"
        self.reasoning_model = "deepseek/deepseek-r1:free"
        self.fast_model = "google/gemini-2.0-flash-lite:free"
        
        # Luxury brand styling constants
        self.brand = {
            "name": "Savoire AI v2.1",
            "developer": "Sooban Talha Technologies",
            "url": "https://soobantalhatech.xyz",
            "founder": "Sooban Talha",
            "aesthetic": "Dark Luxury Premium"
        }
        
    def stream_word_by_word(self, text: str, delay: float = 0.03) -> Generator:
        """Stream text word by word for luxury feel"""
        words = text.split()
        for i, word in enumerate(words):
            is_last = (i == len(words) - 1)
            yield f"data: {json.dumps({'word': word, 'is_last': is_last, 'index': i})}\n\n"
            time.sleep(delay)
        yield f"data: {json.dumps({'done': True})}\n\n"
    
    def stream_from_openrouter(self, messages: List[Dict], model: str = None) -> Generator:
        """Stream AI response word by word from OpenRouter"""
        try:
            stream = self.client.chat.completions.create(
                model=model or self.default_model,
                messages=messages,
                stream=True,
                temperature=0.7,
                max_tokens=2000
            )
            
            accumulated = ""
            for chunk in stream:
                if chunk.choices[0].delta.content:
                    content = chunk.choices[0].delta.content
                    accumulated += content
                    # Split into words and stream
                    words = accumulated.split()
                    if words:
                        yield f"data: {json.dumps({'word': words[-1], 'accumulated': accumulated, 'done': False})}\n\n"
            
            yield f"data: {json.dumps({'done': True, 'full_text': accumulated})}\n\n"
        except Exception as e:
            yield f"data: {json.dumps({'error': str(e), 'done': True})}\n\n"

    # ═══════════════════════════════════════════════════════════════
    # TOOL 1: Smart Lecture Transcriber & Note Formatter
    # ═══════════════════════════════════════════════════════════════
    
    def tool_transcribe_lecture(self, transcript: str) -> Generator:
        """Convert raw lecture transcript into structured study notes"""
        system_prompt = """You are an elite academic note formatter for Savoire AI v2.1. 
        Convert this lecture transcript into premium structured study notes.
        
        OUTPUT FORMAT:
        
        ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
        📌 MAIN TOPIC
        ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
        [One-line summary of the lecture]
        
        ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
        🎯 LEARNING OBJECTIVES
        ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
        • [Objective 1]
        • [Objective 2]
        • [Objective 3]
        
        ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
        📖 DETAILED NOTES
        ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
        [Organized by subtopic with clear headings]
        
        ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
        💡 KEY TAKEAWAYS
        ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
        • [Takeaway 1]
        • [Takeaway 2]
        
        ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
        ⚠️ EXAM-LIKELY TOPICS
        ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
        • [Topic that will likely be tested]"""
        
        return self.stream_from_openrouter([
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": f"TRANSCRIPT:\n\n{transcript}"}
        ])
    
    # ═══════════════════════════════════════════════════════════════
    # TOOL 2: Key Concept Extractor & Highlighter
    # ═══════════════════════════════════════════════════════════════
    
    def tool_extract_concepts(self, notes: str) -> Generator:
        """Extract definitions, formulas, dates, and key concepts"""
        system_prompt = """You are the Savoire AI v2.1 Key Concept Engine.
        Extract and highlight all critical academic content from these notes.
        
        OUTPUT:
        
        ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
        📖 DEFINITIONS
        ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
        • [Term]: [Precise definition]
        
        ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
        🔢 FORMULAS & EQUATIONS
        ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
        • [Formula name]: [LaTeX format]
        
        ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
        📅 IMPORTANT DATES & TIMELINES
        ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
        • [Date]: [Event significance]
        
        ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
        👤 KEY FIGURES
        ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
        • [Name]: [Contribution and significance]
        
        ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
        ⭐ EXAM-LIKELY CONCEPTS
        ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
        • [Concept most likely to appear on tests]"""
        
        return self.stream_from_openrouter([
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": f"NOTES:\n\n{notes}"}
        ], model=self.reasoning_model)
    
    # ═══════════════════════════════════════════════════════════════
    # TOOL 3: Flashcard Factory
    # ═══════════════════════════════════════════════════════════════
    
    def tool_generate_flashcards(self, notes: str, count: int = 15) -> Generator:
        """Generate Anki-compatible flashcards"""
        system_prompt = f"""Generate {count} premium flashcards from these notes.
        Return ONLY valid JSON array.
        
        Each flashcard:
        {{
            "type": "basic",
            "front": "Question text",
            "back": "Complete answer",
            "tags": ["subject", "topic"],
            "difficulty": "easy|medium|hard"
        }}
        
        Include mix of: definitions, processes, comparisons, cause-effect, applications"""
        
        return self.stream_from_openrouter([
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": f"STUDY NOTES:\n\n{notes}"}
        ])
    
    # ═══════════════════════════════════════════════════════════════
    # TOOL 4: Mock Exam Generator
    # ═══════════════════════════════════════════════════════════════
    
    def tool_mock_exam(self, notes: str, difficulty: str = "medium") -> Generator:
        """Generate complete practice exam"""
        system_prompt = f"""Create a {difficulty} difficulty practice exam.
        
        EXAM STRUCTURE:
        
        ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
        SECTION A: MULTIPLE CHOICE (10 Qs)
        ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
        [10 questions with 4 options each, mark correct answer with ✓]
        
        ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
        SECTION B: SHORT ANSWER (5 Qs)
        ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
        [Questions requiring 2-4 sentence responses]
        
        ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
        SECTION C: ESSAY (1 Q)
        ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
        [Analysis/synthesis question with marking rubric]
        
        ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
        ANSWER KEY
        ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"""
        
        return self.stream_from_openrouter([
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": f"STUDY MATERIAL:\n\n{notes}"}
        ], model=self.reasoning_model)
    
    # ═══════════════════════════════════════════════════════════════
    # TOOL 5: Study Guide Generator
    # ═══════════════════════════════════════════════════════════════
    
    def tool_study_guide(self, notes: str, subject: str = "") -> Generator:
        """Generate comprehensive study guide"""
        system_prompt = f"""Create a comprehensive study guide{' for ' + subject if subject else ''}.
        
        STRUCTURE:
        
        ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
        CHAPTER OVERVIEW
        ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
        
        ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
        KEY TERMINOLOGY
        ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
        
        ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
        CONCEPT MAP
        ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
        [Show relationships between concepts]
        
        ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
        PRACTICE PROBLEMS
        ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
        
        ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
        COMMON MISTAKES TO AVOID
        ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
        
        ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
        QUICK REVISION SHEET
        ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"""
        
        return self.stream_from_openrouter([
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": f"SOURCE MATERIAL:\n\n{notes}"}
        ], model=self.reasoning_model)
    
    # ═══════════════════════════════════════════════════════════════
    # TOOL 6: Textbook Chapter Summarizer
    # ═══════════════════════════════════════════════════════════════
    
    def tool_chapter_summary(self, chapter_text: str) -> Generator:
        """Summarize textbook chapters in minutes"""
        system_prompt = """Summarize this textbook chapter into a concise study digest.
        
        ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
        CHAPTER AT A GLANCE
        ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
        [3-sentence chapter summary]
        
        ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
        MAIN SECTIONS BREAKDOWN
        ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
        [Each section with 2-3 key points]
        
        ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
        MUST-REMEMBER POINTS
        ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
        [5-7 critical facts/concepts]
        
        ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
        VISUAL SUMMARY TABLE
        ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
        [Key topics in table format]"""
        
        return self.stream_from_openrouter([
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": f"TEXTBOOK CHAPTER:\n\n{chapter_text}"}
        ])
    
    # ═══════════════════════════════════════════════════════════════
    # TOOL 7: Math Problem Solver & Explainer
    # ═══════════════════════════════════════════════════════════════
    
    def tool_math_solver(self, problem: str) -> Generator:
        """Solve math problems with step-by-step explanation"""
        system_prompt = """Solve this math problem with detailed steps.
        
        ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
        PROBLEM RESTATEMENT
        ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
        
        ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
        GIVEN INFORMATION
        ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
        
        ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
        STEP-BY-STEP SOLUTION
        ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
        [Each step with explanation of WHY]
        
        ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
        FINAL ANSWER
        ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
        
        ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
        VERIFICATION
        ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"""
        
        return self.stream_from_openrouter([
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": f"PROBLEM:\n{problem}"}
        ], model=self.reasoning_model)
    
    # ═══════════════════════════════════════════════════════════════
    # TOOL 8: Essay Outliner & Thesis Builder
    # ═══════════════════════════════════════════════════════════════
    
    def tool_essay_outliner(self, topic: str, essay_type: str = "argumentative") -> Generator:
        """Generate essay outline with thesis statement"""
        system_prompt = f"""Create a {essay_type} essay outline for this topic.
        
        ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
        THESIS STATEMENT
        ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
        [Strong, debatable thesis]
        
        ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
        INTRODUCTION OUTLINE
        ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
        • Hook
        • Background context
        • Thesis placement
        
        ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
        BODY PARAGRAPH 1
        ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
        • Topic sentence
        • Evidence points
        • Analysis
        
        ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
        BODY PARAGRAPH 2
        ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
        • Topic sentence
        • Evidence points
        • Counter-argument
        
        ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
        BODY PARAGRAPH 3
        ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
        • Topic sentence
        • Strongest evidence
        • Synthesis
        
        ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
        CONCLUSION OUTLINE
        ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
        • Restated thesis
        • Summary of arguments
        • Call to action / Final thought
        
        ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
        RECOMMENDED SOURCES
        ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
        [Types of sources to find]"""
        
        return self.stream_from_openrouter([
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": f"ESSAY TOPIC: {topic}"}
        ], model=self.reasoning_model)
    
    # ═══════════════════════════════════════════════════════════════
    # TOOL 9: Research Paper Analyzer
    # ═══════════════════════════════════════════════════════════════
    
    def tool_paper_analyzer(self, paper_text: str) -> Generator:
        """Analyze research papers and extract key information"""
        system_prompt = """Analyze this research paper and extract key academic content.
        
        ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
        PAPER SUMMARY
        ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
        [5-sentence abstract-level summary]
        
        ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
        RESEARCH QUESTION
        ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
        
        ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
        METHODOLOGY
        ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
        
        ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
        KEY FINDINGS
        ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
        
        ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
        LIMITATIONS
        ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
        
        ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
        CITATIONS TO FOLLOW UP
        ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
        
        ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
        CRITICAL EVALUATION
        ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
        [Strengths and weaknesses of the paper]"""
        
        return self.stream_from_openrouter([
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": f"RESEARCH PAPER:\n\n{paper_text}"}
        ], model=self.reasoning_model)
    
    # ═══════════════════════════════════════════════════════════════
    # TOOL 10: Personalized Study Plan Generator
    # ═══════════════════════════════════════════════════════════════
    
    def tool_study_plan(self, subjects: str, exam_date: str, hours_per_day: int = 4) -> Generator:
        """Generate personalized study schedule"""
        system_prompt = f"""Create a personalized study plan based on these parameters.
        Exam date: {exam_date}
        Available hours per day: {hours_per_day}
        
        ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
        STUDY PLAN OVERVIEW
        ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
        
        ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
        WEEKLY BREAKDOWN
        ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
        [Day-by-day schedule with time blocks]
        
        ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
        SUBJECT ALLOCATION
        ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
        [Time distribution per subject with justification]
        
        ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
        ACTIVE RECALL SESSIONS
        ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
        
        ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
        PRACTICE TEST SCHEDULE
        ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
        
        ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
        REVISION PHASES
        ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
        
        ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
        DAILY ROUTINE TEMPLATE
        ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
        [Morning, afternoon, evening blocks]"""
        
        return self.stream_from_openrouter([
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": f"SUBJECTS TO STUDY:\n{subjects}"}
        ], model=self.reasoning_model)


# ═══════════════════════════════════════════════════════════════════
# Flask API Application
# ═══════════════════════════════════════════════════════════════════

app = Flask(__name__)
engine = SavoireStudyEngine()

@app.route('/api/study/tool1', methods=['POST'])
def api_tool1_transcribe():
    """Smart Lecture Transcriber & Note Formatter"""
    data = request.json
    transcript = data.get('transcript', '')
    return Response(
        stream_with_context(engine.tool_transcribe_lecture(transcript)),
        content_type='text/event-stream'
    )

@app.route('/api/study/tool2', methods=['POST'])
def api_tool2_concepts():
    """Key Concept Extractor"""
    data = request.json
    notes = data.get('notes', '')
    return Response(
        stream_with_context(engine.tool_extract_concepts(notes)),
        content_type='text/event-stream'
    )

@app.route('/api/study/tool3', methods=['POST'])
def api_tool3_flashcards():
    """Flashcard Factory"""
    data = request.json
    notes = data.get('notes', '')
    count = data.get('count', 15)
    return Response(
        stream_with_context(engine.tool_generate_flashcards(notes, count)),
        content_type='text/event-stream'
    )

@app.route('/api/study/tool4', methods=['POST'])
def api_tool4_exam():
    """Mock Exam Generator"""
    data = request.json
    notes = data.get('notes', '')
    difficulty = data.get('difficulty', 'medium')
    return Response(
        stream_with_context(engine.tool_mock_exam(notes, difficulty)),
        content_type='text/event-stream'
    )

@app.route('/api/study/tool5', methods=['POST'])
def api_tool5_guide():
    """Study Guide Generator"""
    data = request.json
    notes = data.get('notes', '')
    subject = data.get('subject', '')
    return Response(
        stream_with_context(engine.tool_study_guide(notes, subject)),
        content_type='text/event-stream'
    )

@app.route('/api/study/tool6', methods=['POST'])
def api_tool6_chapter():
    """Textbook Chapter Summarizer"""
    data = request.json
    chapter = data.get('chapter', '')
    return Response(
        stream_with_context(engine.tool_chapter_summary(chapter)),
        content_type='text/event-stream'
    )

@app.route('/api/study/tool7', methods=['POST'])
def api_tool7_math():
    """Math Problem Solver"""
    data = request.json
    problem = data.get('problem', '')
    return Response(
        stream_with_context(engine.tool_math_solver(problem)),
        content_type='text/event-stream'
    )

@app.route('/api/study/tool8', methods=['POST'])
def api_tool8_essay():
    """Essay Outliner"""
    data = request.json
    topic = data.get('topic', '')
    essay_type = data.get('essay_type', 'argumentative')
    return Response(
        stream_with_context(engine.tool_essay_outliner(topic, essay_type)),
        content_type='text/event-stream'
    )

@app.route('/api/study/tool9', methods=['POST'])
def api_tool9_paper():
    """Research Paper Analyzer"""
    data = request.json
    paper = data.get('paper', '')
    return Response(
        stream_with_context(engine.tool_paper_analyzer(paper)),
        content_type='text/event-stream'
    )

@app.route('/api/study/tool10', methods=['POST'])
def api_tool10_plan():
    """Study Plan Generator"""
    data = request.json
    subjects = data.get('subjects', '')
    exam_date = data.get('exam_date', '')
    hours = data.get('hours_per_day', 4)
    return Response(
        stream_with_context(engine.tool_study_plan(subjects, exam_date, hours)),
        content_type='text/event-stream'
    )

@app.route('/api/health')
def health_check():
    return jsonify({
        "status": "operational",
        "brand": engine.brand,
        "version": "2.1",
        "aesthetic": "Dark Luxury Premium"
    })

if __name__ == '__main__':
    app.run(debug=True, port=5000)
// Savoiré AI v2.0 - Frontend Application
// Developed by Sooban Talha Technologies (soobantalhatech.xyz)
// Version: 2.0.0

class SavoireAI {
    constructor() {
        this.API_URL = '/api/study';
        this.currentData = null;
        this.loadingTips = [
            'Analyzing your topic for maximum educational value...',
            'Consulting multiple AI models for comprehensive coverage...',
            'Structuring content for optimal learning retention...',
            'Adding real-world examples and applications...',
            'Generating practice questions with detailed solutions...',
            'Creating memory techniques tailored to your topic...',
            'Verifying accuracy across multiple sources...',
            'Optimizing content for your education level...',
            'Adding cross-disciplinary connections...',
            'Preparing study guides and learning objectives...'
        ];
        
        this.init();
    }
    
    init() {
        this.cacheElements();
        this.bindEvents();
        this.checkTheme();
        this.startLoadingTips();
    }
    
    cacheElements() {
        this.form = document.getElementById('studyForm');
        this.topicInput = document.getElementById('topicInput');
        this.generateBtn = document.getElementById('generateBtn');
        this.resultsSection = document.getElementById('resultsSection');
        this.loadingOverlay = document.getElementById('loadingOverlay');
        this.loadingTip = document.getElementById('loadingTip');
        this.progressFill = document.getElementById('progressFill');
        this.progressText = document.getElementById('progressText');
        this.errorToast = document.getElementById('errorToast');
        this.errorMessage = document.getElementById('errorMessage');
        this.themeToggle = document.getElementById('themeToggle');
        this.educationLevel = document.getElementById('educationLevel');
        this.language = document.getElementById('language');
        this.downloadBtn = document.getElementById('downloadBtn');
        this.shareBtn = document.getElementById('shareBtn');
        this.printBtn = document.getElementById('printBtn');
        this.tabButtons = document.querySelectorAll('.tab-btn');
    }
    
    bindEvents() {
        this.form.addEventListener('submit', (e) => this.handleSubmit(e));
        this.themeToggle.addEventListener('click', () => this.toggleTheme());
        this.downloadBtn?.addEventListener('click', () => this.downloadPDF());
        this.shareBtn?.addEventListener('click', () => this.shareContent());
        this.printBtn?.addEventListener('click', () => window.print());
        
        document.querySelectorAll('.example-topic').forEach(btn => {
            btn.addEventListener('click', () => {
                this.topicInput.value = btn.textContent;
                this.form.dispatchEvent(new Event('submit'));
            });
        });
        
        this.tabButtons.forEach(btn => {
            btn.addEventListener('click', (e) => this.switchTab(e.target.dataset.tab));
        });
    }
    
    async handleSubmit(e) {
        e.preventDefault();
        
        const topic = this.topicInput.value.trim();
        if (!topic) {
            this.showError('Please enter a topic to study');
            return;
        }
        
        this.startLoading();
        
        try {
            const response = await fetch(this.API_URL, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json'
                },
                body: JSON.stringify({
                    message: topic,
                    education_level: this.educationLevel.value,
                    language: this.language.value
                })
            });
            
            if (!response.ok) {
                throw new Error(`Server responded with status ${response.status}`);
            }
            
            const data = await response.json();
            this.currentData = data;
            this.displayResults(data);
            this.stopLoading();
            
        } catch (error) {
            console.error('Generation error:', error);
            this.stopLoading();
            this.showError('Failed to generate study materials. Please try again.');
            
            // Fallback to offline generator
            this.currentData = this.generateOfflineFallback(topic);
            this.displayResults(this.currentData);
        }
    }
    
    displayResults(data) {
        // Display study score
        if (data.study_score) {
            document.getElementById('studyScore').classList.remove('hidden');
            document.getElementById('scoreValue').textContent = data.study_score;
        }
        
        // Display executive summary
        if (data.executive_summary) {
            document.getElementById('executiveSummary').innerHTML = this.formatMarkdown(data.executive_summary);
        }
        
        // Display comprehensive notes
        if (data.comprehensive_notes) {
            document.getElementById('comprehensiveNotes').innerHTML = this.formatMarkdown(data.comprehensive_notes);
        }
        
        // Display key concepts
        if (data.key_concepts) {
            this.displayKeyConcepts(data.key_concepts);
        }
        
        // Display memory techniques
        if (data.memory_techniques) {
            this.displayMemoryTechniques(data.memory_techniques);
        }
        
        // Display practice questions
        if (data.practice_questions) {
            this.displayPracticeQuestions(data.practice_questions);
        }
        
        // Display real-world applications
        if (data.real_world_applications) {
            this.displayApplications(data.real_world_applications);
        }
        
        // Display study guide
        if (data.study_guide) {
            this.displayStudyGuide(data.study_guide);
        }
        
        // Display metadata
        if (data.generated_at) {
            document.getElementById('generatedAt').textContent = `Generated: ${new Date(data.generated_at).toLocaleString()}`;
        }
        
        if (data.model_used) {
            document.getElementById('modelUsed').textContent = `Model: ${data.model_used}`;
        }
        
        // Show results section
        this.resultsSection.classList.remove('hidden');
        
        // Scroll to results
        this.resultsSection.scrollIntoView({ behavior: 'smooth' });
        
        // Process math expressions
        if (window.MathJax) {
            MathJax.Hub.Queue(['Typeset', MathJax.Hub]);
        }
    }
    
    displayKeyConcepts(concepts) {
        const container = document.getElementById('keyConcepts');
        if (!container) return;
        
        container.innerHTML = concepts.map(concept => `
            <div class="concept-card">
                <h4 class="concept-name">${concept.name}</h4>
                <p class="concept-definition">${concept.definition}</p>
                <div class="concept-details">
                    <p><strong>Explanation:</strong> ${concept.explanation}</p>
                    <p><strong>Example:</strong> ${concept.example}</p>
                    <p><strong>Why it matters:</strong> ${concept.importance}</p>
                </div>
            </div>
        `).join('');
    }
    
    displayMemoryTechniques(techniques) {
        const container = document.getElementById('memoryTechniques');
        if (!container) return;
        
        container.innerHTML = techniques.map(technique => `
            <div class="memory-card">
                <i class="fas fa-lightbulb"></i>
                <p>${technique}</p>
            </div>
        `).join('');
    }
    
    displayPracticeQuestions(questions) {
        const container = document.getElementById('practiceQuestions');
        if (!container) return;
        
        container.innerHTML = questions.map((q, index) => `
            <div class="practice-card">
                <div class="question-header">
                    <span class="question-number">Question ${index + 1}</span>
                    <button class="toggle-answer" onclick="this.nextElementSibling.classList.toggle('hidden')">
                        <i class="fas fa-eye"></i> Show Answer
                    </button>
                </div>
                <div class="question-content">
                    <p class="question-text"><strong>Q:</strong> ${q.question}</p>
                    ${q.context ? `<p class="question-context"><em>Context: ${q.context}</em></p>` : ''}
                </div>
                <div class="answer-content hidden">
                    ${q.solution_steps ? `
                        <div class="solution-steps">
                            <strong>Solution:</strong>
                            <ol>
                                ${q.solution_steps.map(step => `<li>${step}</li>`).join('')}
                            </ol>
                        </div>
                    ` : ''}
                    ${q.final_answer ? `
                        <div class="final-answer">
                            <strong>Answer:</strong>
                            <p>${q.final_answer}</p>
                        </div>
                    ` : ''}
                    ${q.common_pitfalls ? `
                        <div class="common-pitfalls">
                            <strong>Common Pitfalls:</strong>
                            <ul>
                                ${q.common_pitfalls.map(pitfall => `<li>${pitfall}</li>`).join('')}
                            </ul>
                        </div>
                    ` : ''}
                </div>
            </div>
        `).join('');
    }
    
    displayApplications(applications) {
        const container = document.getElementById('applications');
        if (!container) return;
        
        container.innerHTML = applications.map(app => `
            <div class="application-card">
                <h4><i class="fas fa-industry"></i> ${app.industry}</h4>
                <p><strong>Use Case:</strong> ${app.use_case}</p>
                <p><strong>Implementation:</strong> ${app.implementation}</p>
                <p><strong>Impact:</strong> ${app.impact}</p>
                ${app.future_potential ? `<p><strong>Future Potential:</strong> ${app.future_potential}</p>` : ''}
            </div>
        `).join('');
    }
    
    displayStudyGuide(guide) {
        const container = document.getElementById('studyGuide');
        if (!container) return;
        
        container.innerHTML = `
            <div class="guide-section">
                <h4>Learning Objectives</h4>
                <ul>
                    ${guide.learning_objectives?.map(obj => `<li>${obj}</li>`).join('') || ''}
                </ul>
            </div>
            
            <div class="guide-section">
                <h4>Prerequisites</h4>
                <ul>
                    ${guide.prerequisites?.map(req => `<li>${req}</li>`).join('') || ''}
                </ul>
            </div>
            
            <div class="guide-section">
                <h4>Recommended Study Order</h4>
                <ol>
                    ${guide.study_order?.map(step => `<li>${step}</li>`).join('') || ''}
                </ol>
            </div>
            
            ${guide.glossary ? `
                <div class="guide-section">
                    <h4>Key Terms Glossary</h4>
                    <dl>
                        ${guide.glossary.map(item => `
                            <dt>${item.term}</dt>
                            <dd>${item.definition}</dd>
                        `).join('')}
                    </dl>
                </div>
            ` : ''}
            
            ${guide.resources ? `
                <div class="guide-section">
                    <h4>Additional Resources</h4>
                    <ul>
                        ${guide.resources.map(resource => `
                            <li><strong>${resource.type}:</strong> ${resource.title} - ${resource.description}</li>
                        `).join('')}
                    </ul>
                </div>
            ` : ''}
            
            <div class="guide-section">
                <h4>Self-Assessment Questions</h4>
                <ul>
                    ${guide.self_assessment?.map(q => `<li>${q}</li>`).join('') || ''}
                </ul>
            </div>
        `;
    }
    
    formatMarkdown(text) {
        if (!text) return '';
        
        // Convert headers
        text = text.replace(/^# (.*$)/gm, '<h1>$1</h1>');
        text = text.replace(/^## (.*$)/gm, '<h2>$1</h2>');
        text = text.replace(/^### (.*$)/gm, '<h3>$1</h3>');
        text = text.replace(/^#### (.*$)/gm, '<h4>$1</h4>');
        
        // Convert bold and italic
        text = text.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
        text = text.replace(/\*(.*?)\*/g, '<em>$1</em>');
        
        // Convert lists
        text = text.replace(/^- (.*$)/gm, '<li>$1</li>');
        text = text.replace(/<\/li>\n<li>/g, '</li><li>');
        text = text.replace(/(<li>.*<\/li>)/gs, '<ul>$1</ul>');
        
        // Convert numbered lists
        text = text.replace(/^\d+\. (.*$)/gm, '<li>$1</li>');
        text = text.replace(/(<li>.*<\/li>)/gs, '<ol>$1</ol>');
        
        // Convert code blocks
        text = text.replace(/```([\s\S]*?)```/g, '<pre><code>$1</code></pre>');
        
        // Convert inline code
        text = text.replace(/`(.*?)`/g, '<code>$1</code>');
        
        // Convert blockquotes
        text = text.replace(/^> (.*$)/gm, '<blockquote>$1</blockquote>');
        
        // Convert paragraphs
        text = text.replace(/^(?!<[a-z])(.*$)/gm, '<p>$1</p>');
        
        return text;
    }
    
    switchTab(tabId) {
        // Update tab buttons
        this.tabButtons.forEach(btn => {
            btn.classList.toggle('active', btn.dataset.tab === tabId);
        });
        
        // Update tab content
        document.querySelectorAll('.tab-content').forEach(content => {
            content.classList.toggle('active', content.id === `${tabId}Tab`);
        });
    }
    
    startLoading() {
        this.loadingOverlay.classList.remove('hidden');
        this.generateBtn.disabled = true;
        this.generateBtn.classList.add('loading');
        
        let progress = 0;
        this.loadingInterval = setInterval(() => {
            progress += 2;
            if (progress <= 100) {
                this.progressFill.style.width = `${progress}%`;
                this.progressText.textContent = `${progress}%`;
            }
        }, 600); // 30 seconds for full progress
    }
    
    stopLoading() {
        this.loadingOverlay.classList.add('hidden');
        this.generateBtn.disabled = false;
        this.generateBtn.classList.remove('loading');
        if (this.loadingInterval) {
            clearInterval(this.loadingInterval);
        }
    }
    
    startLoadingTips() {
        setInterval(() => {
            if (!this.loadingOverlay.classList.contains('hidden')) {
                const randomTip = this.loadingTips[Math.floor(Math.random() * this.loadingTips.length)];
                this.loadingTip.textContent = randomTip;
            }
        }, 3000);
    }
    
    showError(message) {
        this.errorMessage.textContent = message;
        this.errorToast.classList.remove('hidden');
        
        setTimeout(() => {
            this.errorToast.classList.add('hidden');
        }, 5000);
    }
    
    toggleTheme() {
        document.body.classList.toggle('light-theme');
        const icon = this.themeToggle.querySelector('i');
        icon.classList.toggle('fa-moon');
        icon.classList.toggle('fa-sun');
        localStorage.setItem('theme', document.body.classList.contains('light-theme') ? 'light' : 'dark');
    }
    
    checkTheme() {
        const savedTheme = localStorage.getItem('theme');
        if (savedTheme === 'light') {
            document.body.classList.add('light-theme');
            this.themeToggle.querySelector('i').classList.replace('fa-moon', 'fa-sun');
        }
    }
    
    async downloadPDF() {
        if (!this.currentData) return;
        
        // Simple download as text file
        const content = JSON.stringify(this.currentData, null, 2);
        const blob = new Blob([content], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `savoire-${this.currentData.topic.toLowerCase().replace(/\s+/g, '-')}.json`;
        a.click();
        URL.revokeObjectURL(url);
        
        this.showSuccess('Download started!');
    }
    
    async shareContent() {
        if (!this.currentData) return;
        
        if (navigator.share) {
            try {
                await navigator.share({
                    title: `Study Materials: ${this.currentData.topic}`,
                    text: `Check out these AI-generated study materials for ${this.currentData.topic}`,
                    url: window.location.href
                });
            } catch (error) {
                console.log('Share cancelled');
            }
        } else {
            // Fallback: copy link to clipboard
            navigator.clipboard.writeText(window.location.href);
            this.showSuccess('Link copied to clipboard!');
        }
    }
    
    showSuccess(message) {
        // Create and show success toast
        const toast = document.createElement('div');
        toast.className = 'success-toast';
        toast.innerHTML = `
            <i class="fas fa-check-circle"></i>
            <span>${message}</span>
        `;
        document.body.appendChild(toast);
        
        setTimeout(() => {
            toast.remove();
        }, 3000);
    }
    
    generateOfflineFallback(topic) {
        return {
            topic: topic,
            education_level: this.educationLevel.value,
            executive_summary: `This is an offline-generated summary for ${topic}. For full AI-powered content, please check your internet connection and try again.`,
            comprehensive_notes: `# ${topic}\n\n## Overview\nThis topic covers fundamental concepts and applications in ${topic}.`,
            key_concepts: [
                {
                    name: 'Core Concept',
                    definition: 'Fundamental principle',
                    explanation: 'This concept forms the basis of understanding',
                    example: 'Real-world example',
                    importance: 'Essential for mastery'
                }
            ],
            memory_techniques: [
                'Create mind maps',
                'Use flashcards',
                'Practice spaced repetition'
            ],
            practice_questions: [
                {
                    question: `What are the key principles of ${topic}?`,
                    context: 'This tests fundamental understanding',
                    solution_steps: ['Review core concepts', 'Apply to examples'],
                    final_answer: 'The key principles include...'
                }
            ],
            real_world_applications: [
                {
                    industry: 'Various',
                    use_case: `Applications of ${topic}`,
                    implementation: 'Practical implementation methods',
                    impact: 'Positive outcomes and benefits'
                }
            ],
            study_guide: {
                learning_objectives: [`Understand ${topic}`],
                prerequisites: ['Basic knowledge'],
                study_order: ['Start with basics', 'Move to advanced'],
                glossary: [],
                resources: [],
                self_assessment: ['Can you explain the concept?']
            },
            study_score: 85,
            generated_at: new Date().toISOString(),
            model_used: 'offline-fallback'
        };
    }
}

// Initialize application
document.addEventListener('DOMContentLoaded', () => {
    window.app = new SavoireAI();
});
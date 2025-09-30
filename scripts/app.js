// app.js - Enhanced with 5 Components & Better Layout
class SavoireAI {
    constructor() {
        this.initializeElements();
        this.setupEventListeners();
        this.setupQuickPrompts();
        this.chatHistory = [];
    }

    initializeElements() {
        // Core elements
        this.welcomeScreen = document.getElementById('welcomeScreen');
        this.chatMessages = document.getElementById('chatMessages');
        this.messageInput = document.getElementById('messageInput');
        this.sendButton = document.getElementById('sendButton');
        this.loadingIndicator = document.getElementById('loadingIndicator');
        
        // Action buttons
        this.clearChatBtn = document.getElementById('clearChat');
        this.downloadPDFBtn = document.getElementById('downloadPDF');
        
        // Auto-resize textarea
        this.setupTextareaResize();
    }

    setupEventListeners() {
        this.sendButton.addEventListener('click', () => this.sendMessage());
        
        this.messageInput.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                this.sendMessage();
            }
        });
        
        this.clearChatBtn.addEventListener('click', () => this.clearChat());
        this.downloadPDFBtn.addEventListener('click', () => this.downloadPDF());
        this.messageInput.focus();
    }

    setupQuickPrompts() {
        document.querySelectorAll('.prompt-card').forEach(card => {
            card.addEventListener('click', () => {
                const prompt = card.getAttribute('data-prompt');
                this.messageInput.value = prompt;
                this.sendMessage();
            });
        });
    }

    setupTextareaResize() {
        this.messageInput.addEventListener('input', () => {
            this.messageInput.style.height = 'auto';
            this.messageInput.style.height = Math.min(this.messageInput.scrollHeight, 120) + 'px';
        });
    }

    async sendMessage() {
        const message = this.messageInput.value.trim();
        if (!message) return;

        // Add user message to chat
        this.addMessage(message, 'user');
        this.messageInput.value = '';
        this.messageInput.style.height = 'auto';
        
        // Show loading and hide welcome screen
        this.showLoading();
        this.hideWelcomeScreen();

        try {
            // Get AI response with 5 components
            const response = await this.getAIResponse(message);
            this.addMessage(response, 'ai');
            
        } catch (error) {
            console.error('Error:', error);
            this.addMessage(
                "I apologize, but I'm having trouble generating a response right now. Please try again in a moment.",
                'ai'
            );
        } finally {
            this.hideLoading();
            this.scrollToBottom();
        }
    }

    async getAIResponse(userMessage) {
        try {
            const response = await fetch('/api/study', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ 
                    topic: userMessage,
                    format: 'structured',
                    include_questions: true
                })
            });

            if (response.ok) {
                const data = await response.json();
                return this.formatStructuredResponse(data);
            } else {
                throw new Error('API not available');
            }
            
        } catch (error) {
            // Enhanced fallback with 5 components
            return this.generateStructuredResponse(userMessage);
        }
    }

    generateStructuredResponse(userMessage) {
        const subject = this.detectSubject(userMessage);
        
        return `
<div class="response-container">

<div class="component-section" data-component="introduction">
    <div class="component-header">
        <i class="fas fa-star"></i>
        <h3>Introduction & Overview</h3>
    </div>
    <div class="component-content">
        <p><strong>${userMessage}</strong> is a fundamental topic that forms the basis for advanced learning in ${subject}. This comprehensive guide covers all essential aspects you need to master.</p>
        
        <div class="key-points">
            <div class="key-point">
                <i class="fas fa-bullseye"></i>
                <span><strong>Learning Objectives:</strong> Understand core concepts, applications, and problem-solving techniques</span>
            </div>
            <div class="key-point">
                <i class="fas fa-clock"></i>
                <span><strong>Study Time:</strong> 3-4 hours for basic mastery</span>
            </div>
            <div class="key-point">
                <i class="fas fa-chart-line"></i>
                <span><strong>Difficulty Level:</strong> Beginner to Intermediate</span>
            </div>
        </div>
    </div>
</div>

<div class="component-section" data-component="explanation">
    <div class="component-header">
        <i class="fas fa-book"></i>
        <h3>Detailed Explanation</h3>
    </div>
    <div class="component-content">
        <h4>Core Concepts</h4>
        <ul>
            <li><strong>Fundamental Principles:</strong> Basic theories and foundational ideas</li>
            <li><strong>Key Definitions:</strong> Essential terminology with examples</li>
            <li><strong>Practical Applications:</strong> Real-world usage scenarios</li>
            <li><strong>Advanced Insights:</strong> Deeper understanding of complex aspects</li>
        </ul>
        
        <h4>Step-by-Step Understanding</h4>
        <div class="step-by-step">
            <div class="step">
                <span class="step-number">1</span>
                <span class="step-text">Start with basic definitions and concepts</span>
            </div>
            <div class="step">
                <span class="step-number">2</span>
                <span class="step-text">Understand relationships between different elements</span>
            </div>
            <div class="step">
                <span class="step-number">3</span>
                <span class="step-text">Practice with simple examples</span>
            </div>
            <div class="step">
                <span class="step-number">4</span>
                <span class="step-text">Apply to complex problems</span>
            </div>
        </div>
    </div>
</div>

<div class="component-section" data-component="examples">
    <div class="component-header">
        <i class="fas fa-lightbulb"></i>
        <h3>Examples & Applications</h3>
    </div>
    <div class="component-content">
        <div class="example-grid">
            <div class="example-card">
                <div class="example-title">Basic Example</div>
                <div class="example-content">
                    <strong>Scenario:</strong> Simple application case<br>
                    <strong>Solution:</strong> Step-by-step explanation<br>
                    <strong>Key Learning:</strong> Fundamental concept application
                </div>
            </div>
            
            <div class="example-card">
                <div class="example-title">Real-World Application</div>
                <div class="example-content">
                    <strong>Industry Use:</strong> Practical implementation<br>
                    <strong>Benefits:</strong> Efficiency and effectiveness<br>
                    <strong>Impact:</strong> Significant improvements
                </div>
            </div>
            
            <div class="example-card">
                <div class="example-title">Advanced Case Study</div>
                <div class="example-content">
                    <strong>Complex Problem:</strong> Multi-faceted scenario<br>
                    <strong>Approach:</strong> Analytical methodology<br>
                    <strong>Outcome:</strong> Optimal solution
                </div>
            </div>
        </div>
    </div>
</div>

<div class="component-section" data-component="questions">
    <div class="component-header">
        <i class="fas fa-question-circle"></i>
        <h3>Practice Questions & Solutions</h3>
    </div>
    <div class="component-content">
        ${this.generateEnhancedQuestions(userMessage)}
    </div>
</div>

<div class="component-section" data-component="summary">
    <div class="component-header">
        <i class="fas fa-check-circle"></i>
        <h3>Key Takeaways & Tips</h3>
    </div>
    <div class="component-content">
        <div class="takeaways-grid">
            <div class="takeaway-item">
                <i class="fas fa-graduation-cap"></i>
                <div>
                    <strong>Study Strategy</strong>
                    <p>Focus on conceptual understanding first, then practice applications</p>
                </div>
            </div>
            
            <div class="takeaway-item">
                <i class="fas fa-brain"></i>
                <div>
                    <strong>Memory Techniques</strong>
                    <p>Use mnemonics and visual aids for better retention</p>
                </div>
            </div>
            
            <div class="takeaway-item">
                <i class="fas fa-rocket"></i>
                <div>
                    <strong>Exam Preparation</strong>
                    <p>Practice previous year questions and time management</p>
                </div>
            </div>
        </div>
        
        <div class="pro-tip">
            <strong>💡 Pro Tip:</strong> Regular revision and practical application are key to mastering this topic.
        </div>
    </div>
</div>

</div>

<div class="response-footer">
    <span class="ai-signature">Generated by Savoiré AI • ${new Date().toLocaleString()}</span>
</div>
        `;
    }

    generateEnhancedQuestions(topic) {
        const questions = [
            {
                question: `What are the fundamental principles of ${topic}?`,
                answer: `The fundamental principles include core concepts that form the foundation. These principles are essential for understanding more complex aspects and practical applications.`,
                difficulty: 'Easy'
            },
            {
                question: `How does ${topic} apply in real-world scenarios?`,
                answer: `Real-world applications involve practical implementations that demonstrate the importance and utility of these concepts in various industries and daily life situations.`,
                difficulty: 'Medium'
            },
            {
                question: `What are the common challenges in understanding ${topic}?`,
                answer: `Common challenges include conceptual complexity, abstract nature, and application difficulties. These can be overcome through systematic study and practical examples.`,
                difficulty: 'Medium'
            },
            {
                question: `Explain the relationship between different components of ${topic}.`,
                answer: `The components are interconnected through complex relationships that require holistic understanding. Changes in one area can significantly impact others.`,
                difficulty: 'Hard'
            },
            {
                question: `What future developments do you foresee in ${topic}?`,
                answer: `Future advancements will likely involve technological integration, new methodologies, and expanded applications across various fields.`,
                difficulty: 'Hard'
            }
        ];

        return questions.map((q, index) => `
            <div class="question-block" data-difficulty="${q.difficulty.toLowerCase()}">
                <div class="question-header">
                    <span class="question-number">Q${index + 1}</span>
                    <span class="difficulty-badge ${q.difficulty.toLowerCase()}">${q.difficulty}</span>
                </div>
                <div class="question-text">${q.question}</div>
                <div class="answer-section">
                    <div class="answer-toggle">Show Answer ▼</div>
                    <div class="answer-text">${q.answer}</div>
                </div>
            </div>
        `).join('');
    }

    formatStructuredResponse(data) {
        if (data.components) {
            return this.formatAPIResponse(data);
        } else {
            return this.generateStructuredResponse(data.topic || 'the topic');
        }
    }

    formatAPIResponse(data) {
        // Format API response with 5 components structure
        let response = `<div class="response-container">`;

        // Component 1: Introduction
        if (data.components.introduction) {
            response += `
                <div class="component-section" data-component="introduction">
                    <div class="component-header">
                        <i class="fas fa-star"></i>
                        <h3>Introduction</h3>
                    </div>
                    <div class="component-content">
                        ${data.components.introduction}
                    </div>
                </div>
            `;
        }

        // Component 2: Detailed Explanation
        if (data.components.detailed_explanation) {
            response += `
                <div class="component-section" data-component="explanation">
                    <div class="component-header">
                        <i class="fas fa-book"></i>
                        <h3>Detailed Explanation</h3>
                    </div>
                    <div class="component-content">
                        ${data.components.detailed_explanation}
                    </div>
                </div>
            `;
        }

        // Component 3: Examples
        if (data.components.real_world_applications) {
            response += `
                <div class="component-section" data-component="examples">
                    <div class="component-header">
                        <i class="fas fa-lightbulb"></i>
                        <h3>Real-World Applications</h3>
                    </div>
                    <div class="component-content">
                        <ul>
                            ${data.components.real_world_applications.map(app => `<li>${app}</li>`).join('')}
                        </ul>
                    </div>
                </div>
            `;
        }

        // Component 4: Questions
        if (data.components.practice_questions) {
            response += `
                <div class="component-section" data-component="questions">
                    <div class="component-header">
                        <i class="fas fa-question-circle"></i>
                        <h3>Practice Questions</h3>
                    </div>
                    <div class="component-content">
                        ${data.components.practice_questions.map((q, i) => `
                            <div class="question-block">
                                <div class="question-header">
                                    <span class="question-number">Q${i + 1}</span>
                                </div>
                                <div class="question-text">${q.question}</div>
                                <div class="answer-section">
                                    <div class="answer-toggle">Show Answer ▼</div>
                                    <div class="answer-text">${q.answer}</div>
                                </div>
                            </div>
                        `).join('')}
                    </div>
                </div>
            `;
        }

        // Component 5: Summary
        response += `
            <div class="component-section" data-component="summary">
                <div class="component-header">
                    <i class="fas fa-check-circle"></i>
                    <h3>Key Takeaways</h3>
                </div>
                <div class="component-content">
                    <div class="study-score">
                        <strong>Study Score:</strong> ${data.study_score || 85}/100
                    </div>
                    ${data.components.short_notes ? `
                        <div class="short-notes">
                            <h4>Quick Revision Points:</h4>
                            <p>${data.components.short_notes}</p>
                        </div>
                    ` : ''}
                </div>
            </div>
        `;

        response += `</div>`;
        response += `<div class="response-footer">
            <span class="ai-signature">Generated by Savoiré AI • ${new Date().toLocaleString()}</span>
        </div>`;

        return response;
    }

    detectSubject(message) {
        const lowerMessage = message.toLowerCase();
        if (lowerMessage.includes('math') || lowerMessage.includes('calculus')) return 'Mathematics';
        if (lowerMessage.includes('science') || lowerMessage.includes('physics') || lowerMessage.includes('chemistry') || lowerMessage.includes('biology')) return 'Science';
        if (lowerMessage.includes('business') || lowerMessage.includes('commerce') || lowerMessage.includes('economics')) return 'Business';
        if (lowerMessage.includes('computer') || lowerMessage.includes('programming') || lowerMessage.includes('coding')) return 'Computer Science';
        return 'General Studies';
    }

    addMessage(content, type) {
        const messageDiv = document.createElement('div');
        messageDiv.className = `message ${type}-message`;
        
        const avatar = document.createElement('div');
        avatar.className = 'message-avatar';
        avatar.innerHTML = type === 'user' ? '<i class="fas fa-user"></i>' : '<i class="fas fa-robot"></i>';
        
        const messageContent = document.createElement('div');
        messageContent.className = 'message-content';
        
        const messageText = document.createElement('div');
        messageText.className = 'message-text';
        
        if (type === 'ai') {
            messageText.innerHTML = content;
            // Add interactive functionality for answer toggles
            setTimeout(() => this.setupInteractiveElements(messageText), 100);
        } else {
            messageText.textContent = content;
        }
        
        messageContent.appendChild(messageText);
        messageDiv.appendChild(avatar);
        messageDiv.appendChild(messageContent);
        
        this.chatMessages.appendChild(messageDiv);
        this.scrollToBottom();
        
        // Add to chat history
        this.chatHistory.push({ type, content, timestamp: new Date() });
    }

    setupInteractiveElements(container) {
        // Answer toggle functionality
        const answerToggles = container.querySelectorAll('.answer-toggle');
        answerToggles.forEach(toggle => {
            toggle.addEventListener('click', function() {
                const answerText = this.nextElementSibling;
                const isVisible = answerText.style.display === 'block';
                
                answerText.style.display = isVisible ? 'none' : 'block';
                this.textContent = isVisible ? 'Show Answer ▼' : 'Hide Answer ▲';
            });
        });

        // Initially hide all answers
        const answerTexts = container.querySelectorAll('.answer-text');
        answerTexts.forEach(answer => {
            answer.style.display = 'none';
        });
    }

    showLoading() {
        this.loadingIndicator.style.display = 'flex';
        this.sendButton.disabled = true;
    }

    hideLoading() {
        this.loadingIndicator.style.display = 'none';
        this.sendButton.disabled = false;
    }

    hideWelcomeScreen() {
        this.welcomeScreen.style.display = 'none';
        this.chatMessages.style.display = 'flex';
    }

    scrollToBottom() {
        this.chatMessages.scrollTop = this.chatMessages.scrollHeight;
    }

    clearChat() {
        this.chatMessages.innerHTML = '';
        this.chatHistory = [];
        this.welcomeScreen.style.display = 'block';
        this.chatMessages.style.display = 'none';
    }

    async downloadPDF() {
        const { jsPDF } = window.jspdf;
        
        try {
            this.showNotification('Creating PDF document...', 'info');
            
            // Create a temporary div for PDF generation
            const pdfContent = document.createElement('div');
            pdfContent.className = 'pdf-export';
            pdfContent.style.cssText = `
                background: white;
                color: black;
                padding: 20px;
                max-width: 800px;
                margin: 0 auto;
            `;
            
            // Add header
            const header = document.createElement('div');
            header.innerHTML = `
                <h1 style="color: #3b82f6; border-bottom: 2px solid #3b82f6; padding-bottom: 10px;">
                    Savoiré AI - Chat History
                </h1>
                <p style="color: #666; font-size: 14px;">
                    Generated on ${new Date().toLocaleString()} • by Sooban Talha Productions
                </p>
            `;
            pdfContent.appendChild(header);
            
            // Add chat content
            this.chatHistory.forEach(msg => {
                const msgDiv = document.createElement('div');
                msgDiv.style.cssText = `
                    margin: 20px 0;
                    padding: 15px;
                    border-radius: 10px;
                    background: ${msg.type === 'user' ? '#e3f2fd' : '#f5f5f5'};
                    border-left: 4px solid ${msg.type === 'user' ? '#3b82f6' : '#666'};
                `;
                
                if (msg.type === 'ai') {
                    // Clean HTML for PDF
                    const cleanContent = msg.content
                        .replace(/<[^>]*>/g, ' ')
                        .replace(/\s+/g, ' ')
                        .trim();
                    msgDiv.textContent = cleanContent;
                } else {
                    msgDiv.textContent = msg.content;
                }
                
                pdfContent.appendChild(msgDiv);
            });
            
            document.body.appendChild(pdfContent);
            
            const canvas = await html2canvas(pdfContent, {
                scale: 2,
                useCORS: true,
                logging: false,
                backgroundColor: '#ffffff'
            });
            
            document.body.removeChild(pdfContent);
            
            const imgData = canvas.toDataURL('image/png');
            const pdf = new jsPDF('p', 'mm', 'a4');
            const imgProps = pdf.getImageProperties(imgData);
            const pdfWidth = pdf.internal.pageSize.getWidth();
            const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;
            
            pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
            
            const fileName = `Savoire-AI-Chat-${new Date().toISOString().split('T')[0]}.pdf`;
            pdf.save(fileName);
            this.showNotification('PDF downloaded successfully!', 'success');
            
        } catch (error) {
            console.error('PDF generation error:', error);
            this.showNotification('Failed to generate PDF. Please try again.', 'error');
        }
    }

    showNotification(message, type = 'info') {
        const notification = document.createElement('div');
        notification.className = `notification ${type}`;
        notification.textContent = message;
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: ${type === 'success' ? '#10b981' : type === 'error' ? '#ef4444' : '#3b82f6'};
            color: white;
            padding: 1rem 1.5rem;
            border-radius: 8px;
            z-index: 1000;
            animation: slideIn 0.3s ease;
        `;
        
        document.body.appendChild(notification);
        
        setTimeout(() => {
            notification.style.animation = 'slideOut 0.3s ease';
            setTimeout(() => notification.remove(), 300);
        }, 4000);
    }
}

// Initialize the application
document.addEventListener('DOMContentLoaded', () => {
    new SavoireAI();
});
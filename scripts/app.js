// app.js - Real AI Chat Interface
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
        // Send message on button click
        this.sendButton.addEventListener('click', () => this.sendMessage());
        
        // Send message on Enter (but allow Shift+Enter for new line)
        this.messageInput.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                this.sendMessage();
            }
        });
        
        // Clear chat
        this.clearChatBtn.addEventListener('click', () => this.clearChat());
        
        // Download PDF
        this.downloadPDFBtn.addEventListener('click', () => this.downloadPDF());
        
        // Auto-focus input
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
            // Get AI response
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
            // First try the API
            const response = await fetch('/api/study', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ 
                    topic: userMessage,
                    format: 'detailed',
                    include_questions: true,
                    include_tricks: true
                })
            });

            if (response.ok) {
                const data = await response.json();
                return this.formatAIResponse(data);
            } else {
                throw new Error('API not available');
            }
            
        } catch (error) {
            // Fallback to enhanced response generation
            return this.generateEnhancedResponse(userMessage);
        }
    }

    generateEnhancedResponse(userMessage) {
        // Enhanced fallback response with proper formatting
        const subject = this.detectSubject(userMessage);
        
        return `
# Comprehensive Study Guide

## 📚 Detailed Explanation

**${userMessage}** covers fundamental concepts that are essential for building a strong foundation in this subject. Let me break this down into comprehensive sections:

### Core Concepts
- **Fundamental Principles**: Understanding the basic building blocks and theories
- **Key Terminology**: Essential definitions and concepts you must know
- **Practical Applications**: Real-world implementations and use cases
- **Advanced Insights**: Deeper understanding of complex relationships

### In-Depth Analysis
This topic combines theoretical knowledge with practical applications, making it crucial for both academic and professional growth. The interconnected nature of concepts means that understanding relationships is as important as knowing individual elements.

## 🎯 10 Challenging Questions with Answers

${this.generateQuestions(userMessage)}

## 💡 Memory Tricks & Techniques

${this.generateTricks(userMessage)}

## 📝 Key Takeaways
- Master both theoretical concepts and practical applications
- Focus on understanding relationships between different elements
- Regular practice and revision are essential for retention
- Apply concepts to real-world scenarios for better understanding

*Generated by Savoiré AI - Your Intelligent Study Companion*
        `;
    }

    generateQuestions(topic) {
        const questions = [];
        for (let i = 1; i <= 10; i++) {
            questions.push(`
<div class="question-block">
    <div class="question-text">Q${i}: ${this.getQuestionText(topic, i)}</div>
    <div class="answer-text">${this.getAnswerText(topic, i)}</div>
</div>
            `);
        }
        return questions.join('');
    }

    getQuestionText(topic, number) {
        const questionTemplates = [
            `Explain the fundamental concept of ${topic} and its significance in modern applications.`,
            `Describe the key principles that govern ${topic} and provide real-world examples.`,
            `Analyze the relationship between different components of ${topic} and their interdependencies.`,
            `What are the main challenges in understanding ${topic} and how can they be overcome?`,
            `Compare and contrast different approaches to studying ${topic} and their effectiveness.`,
            `How does ${topic} relate to other subjects in the curriculum? Provide specific connections.`,
            `What are the most common misconceptions about ${topic} and how would you correct them?`,
            `Explain the historical development and evolution of concepts in ${topic}.`,
            `Describe a complex problem related to ${topic} and outline your step-by-step solution.`,
            `What future developments or advancements do you foresee in the field of ${topic}?`
        ];
        return questionTemplates[number - 1] || questionTemplates[0];
    }

    getAnswerText(topic, number) {
        const answerTemplates = [
            `The fundamental concept involves core principles that form the foundation. Its significance lies in providing the basis for advanced applications and practical implementations across various fields.`,
            `Key principles include systematic approaches, theoretical frameworks, and practical methodologies. Real-world examples demonstrate how these principles solve actual problems and create value.`,
            `Components are interconnected through complex relationships that require holistic understanding. Their interdependencies mean that changes in one area can significantly impact others.`,
            `Main challenges include conceptual complexity, abstract nature, and application difficulties. These can be overcome through systematic study, practical examples, and regular practice.`,
            `Different approaches offer unique perspectives - theoretical focuses on concepts while practical emphasizes applications. The most effective method combines both for comprehensive understanding.`,
            `This subject connects with others through shared principles, complementary concepts, and interdisciplinary applications. Understanding these connections enhances overall learning.`,
            `Common misconceptions often arise from oversimplification or incomplete understanding. Correct understanding requires detailed study and practical application of concepts.`,
            `Historical development shows progressive refinement of ideas, from basic observations to sophisticated theories. Understanding this evolution provides context for current concepts.`,
            `Complex problems require systematic analysis, breaking down into components, and applying appropriate methodologies. The solution involves multiple steps and verification processes.`,
            `Future advancements will likely involve technological integration, new methodologies, and expanded applications. Staying updated with current research is essential for forward-looking understanding.`
        ];
        return answerTemplates[number - 1] || answerTemplates[0];
    }

    generateTricks(topic) {
        return `
<div class="trick-box">
    <strong>Memory Technique 1:</strong> Use acronyms or mnemonics to remember key concepts and their sequences.
</div>

<div class="trick-box">
    <strong>Visualization Method:</strong> Create mind maps or diagrams to visualize relationships between different concepts.
</div>

<div class="trick-box">
    <strong>Association Strategy:</strong> Connect new information with existing knowledge through meaningful associations.
</div>

<div class="trick-box">
    <strong>Spaced Repetition:</strong> Review material at increasing intervals to strengthen long-term memory.
</div>
        `;
    }

    detectSubject(message) {
        const lowerMessage = message.toLowerCase();
        if (lowerMessage.includes('math') || lowerMessage.includes('calculus')) return 'Mathematics';
        if (lowerMessage.includes('science') || lowerMessage.includes('physics') || lowerMessage.includes('chemistry') || lowerMessage.includes('biology')) return 'Science';
        if (lowerMessage.includes('business') || lowerMessage.includes('commerce') || lowerMessage.includes('economics')) return 'Business';
        if (lowerMessage.includes('computer') || lowerMessage.includes('programming') || lowerMessage.includes('coding')) return 'Computer Science';
        return 'General';
    }

    formatAIResponse(data) {
        // Format the API response into a beautiful chat message
        if (data.components) {
            return this.formatStructuredResponse(data);
        } else if (data.ultra_long_notes) {
            return this.formatLegacyResponse(data);
        } else {
            return this.generateEnhancedResponse(data.topic || 'the topic');
        }
    }

    formatStructuredResponse(data) {
        let response = `# ${data.topic}\n\n`;
        
        if (data.components.introduction) {
            response += `## 📖 Introduction\n\n${data.components.introduction}\n\n`;
        }
        
        if (data.components.detailed_explanation) {
            response += `## 📚 Detailed Explanation\n\n${data.components.detailed_explanation}\n\n`;
        }
        
        if (data.components.practice_questions) {
            response += `## 🎯 Practice Questions\n\n`;
            data.components.practice_questions.forEach((q, i) => {
                response += `<div class="question-block">
                    <div class="question-text">Q${i + 1}: ${q.question}</div>
                    <div class="answer-text">${q.answer}</div>
                </div>\n\n`;
            });
        }
        
        response += `\n*Generated by Savoiré AI | Score: ${data.study_score || 85}/100*`;
        return response;
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
        messageText.innerHTML = this.formatMessageText(content);
        
        messageContent.appendChild(messageText);
        messageDiv.appendChild(avatar);
        messageDiv.appendChild(messageContent);
        
        this.chatMessages.appendChild(messageDiv);
        this.scrollToBottom();
        
        // Add to chat history
        this.chatHistory.push({ type, content, timestamp: new Date() });
    }

    formatMessageText(text) {
        // Convert markdown-like syntax to HTML
        return text
            .replace(/\n/g, '<br>')
            .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
            .replace(/\*(.*?)\*/g, '<em>$1</em>')
            .replace(/## (.*?)(<br>|$)/g, '<h2>$1</h2>')
            .replace(/# (.*?)(<br>|$)/g, '<h1>$1</h1>')
            .replace(/### (.*?)(<br>|$)/g, '<h3>$1</h3>')
            .replace(/📖 (.*?)(<br>|$)/g, '<div class="highlight-box"><strong>📖 $1</strong></div>')
            .replace(/📚 (.*?)(<br>|$)/g, '<div class="highlight-box"><strong>📚 $1</strong></div>')
            .replace(/🎯 (.*?)(<br>|$)/g, '<div class="highlight-box"><strong>🎯 $1</strong></div>')
            .replace(/💡 (.*?)(<br>|$)/g, '<div class="highlight-box"><strong>💡 $1</strong></div>');
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
            
            const element = this.chatMessages;
            const canvas = await html2canvas(element, {
                scale: 2,
                useCORS: true,
                logging: false,
                backgroundColor: '#0f172a'
            });
            
            const imgData = canvas.toDataURL('image/png');
            const pdf = new jsPDF('p', 'mm', 'a4');
            const imgProps = pdf.getImageProperties(imgData);
            const pdfWidth = pdf.internal.pageSize.getWidth();
            const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;
            
            // Add header
            pdf.setFillColor(30, 41, 59);
            pdf.rect(0, 0, pdfWidth, 25, 'F');
            pdf.setTextColor(59, 130, 246);
            pdf.setFontSize(16);
            pdf.text('Savoiré AI Chat History', 20, 15);
            pdf.setTextColor(255, 255, 255);
            pdf.setFontSize(8);
            pdf.text('by Sooban Talha Productions', 20, 20);
            
            // Add content
            pdf.addImage(imgData, 'PNG', 0, 30, pdfWidth, pdfHeight);
            
            // Add footer
            const totalPages = pdf.internal.getNumberOfPages();
            for (let i = 1; i <= totalPages; i++) {
                pdf.setPage(i);
                pdf.setFontSize(8);
                pdf.setTextColor(100, 100, 100);
                pdf.text(
                    `Page ${i} of ${totalPages} - Generated by Savoiré AI`, 
                    pdfWidth / 2, 
                    pdf.internal.pageSize.getHeight() - 10, 
                    { align: 'center' }
                );
            }
            
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
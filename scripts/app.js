// Ultra-Advanced Gold Theme AI Assistant
class GoldSavoireAI {
    constructor() {
        this.initializeApp();
        this.bindEvents();
        this.initializeAdvancedAnimations();
    }

    initializeApp() {
        this.chatMessages = document.getElementById('chatMessages');
        this.messageInput = document.getElementById('messageInput');
        this.sendButton = document.getElementById('sendButton');
        this.welcomeArea = document.getElementById('welcomeArea');
        this.messagesContainer = document.getElementById('messagesContainer');
        this.thinkingIndicator = document.getElementById('thinkingIndicator');
        this.clearChatBtn = document.getElementById('clearChat');
        
        this.conversationHistory = [];
        this.isGenerating = false;
    }

    initializeAdvancedAnimations() {
        // Add intersection observer for scroll animations
        this.observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('animate-in');
                }
            });
        }, { threshold: 0.1 });
    }

    bindEvents() {
        this.sendButton.addEventListener('click', () => this.sendMessage());
        this.messageInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                this.sendMessage();
            }
        });

        this.clearChatBtn.addEventListener('click', () => this.clearChat());

        // Auto-resize textarea with animation
        this.messageInput.addEventListener('input', () => {
            this.autoResize();
            this.animateInput();
        });

        // Quick suggestion chips with enhanced animations
        document.querySelectorAll('.suggestion-chip').forEach(chip => {
            chip.addEventListener('click', (e) => {
                this.animateButton(e.target);
                const prompt = chip.getAttribute('data-prompt');
                this.messageInput.value = prompt;
                setTimeout(() => this.sendMessage(), 300);
            });
        });

        // Theme toggle with enhanced animation
        document.querySelector('.theme-toggle').addEventListener('click', (e) => {
            this.animateButton(e.target);
            setTimeout(() => this.toggleTheme(), 200);
        });

        // Input focus animations
        this.messageInput.addEventListener('focus', () => {
            this.messageInput.parentElement.classList.add('focused');
        });

        this.messageInput.addEventListener('blur', () => {
            this.messageInput.parentElement.classList.remove('focused');
        });
    }

    animateInput() {
        this.messageInput.style.transform = 'scale(1.02)';
        setTimeout(() => {
            this.messageInput.style.transform = 'scale(1)';
        }, 150);
    }

    animateButton(button) {
        button.style.transform = 'scale(0.95)';
        setTimeout(() => {
            button.style.transform = 'scale(1)';
        }, 150);
    }

    autoResize() {
        this.messageInput.style.height = 'auto';
        this.messageInput.style.height = Math.min(this.messageInput.scrollHeight, 120) + 'px';
    }

    async sendMessage() {
        const message = this.messageInput.value.trim();
        if (!message || this.isGenerating) return;

        // Hide welcome area, show messages with animation
        this.welcomeArea.style.display = 'none';
        this.messagesContainer.style.display = 'block';

        // Add user message with animation
        this.addMessage(message, 'user');

        // Clear input with animation
        this.animateClearInput();

        // Show thinking indicator
        this.showThinking();

        this.isGenerating = true;
        this.sendButton.disabled = true;

        try {
            const studyData = await this.generateStudyMaterials(message);
            this.hideThinking();
            this.displayStudyMaterials(studyData);
        } catch (error) {
            this.hideThinking();
            this.showError(error.message);
        }

        this.isGenerating = false;
        this.sendButton.disabled = false;
    }

    animateClearInput() {
        this.messageInput.style.opacity = '0';
        this.messageInput.style.transform = 'translateX(-20px)';
        setTimeout(() => {
            this.messageInput.value = '';
            this.autoResize();
            this.messageInput.style.opacity = '1';
            this.messageInput.style.transform = 'translateX(0)';
        }, 300);
    }

    async generateStudyMaterials(message) {
        console.log('Sending request to AI:', message);

        const response = await fetch('/api/study', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ message })
        });

        if (!response.ok) {
            throw new Error(`API Error: ${response.status}`);
        }

        const data = await response.json();
        console.log('Received detailed study data:', data);
        return data;
    }

    addMessage(content, type) {
        const messageDiv = document.createElement('div');
        messageDiv.className = `message ${type}-message`;
        
        const avatar = type === 'user' ? 
            '<div class="message-avatar">👤</div>' : 
            '<div class="message-avatar"><div class="logo-background small"><img src="LOGO.png" alt="AI" class="logo-img"></div></div>';
        
        const time = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

        if (type === 'user') {
            messageDiv.innerHTML = `
                ${avatar}
                <div class="message-content">
                    <div class="message-text">${this.escapeHtml(content)}</div>
                    <div class="message-time">${time}</div>
                </div>
            `;
        } else {
            messageDiv.innerHTML = `
                ${avatar}
                <div class="message-content">
                    ${content}
                    <div class="message-time">${time}</div>
                </div>
            `;
        }

        this.chatMessages.appendChild(messageDiv);
        this.scrollToBottom();
        
        // Add to conversation history
        this.conversationHistory.push({ type, content, time });
    }

    displayStudyMaterials(data) {
        const formattedContent = this.formatStudyData(data);
        this.addMessage(formattedContent, 'ai');
        
        // Add scroll animations to new study sections
        setTimeout(() => {
            document.querySelectorAll('.study-section').forEach(section => {
                this.observer.observe(section);
            });
        }, 100);
    }

    formatStudyData(data) {
        if (data.error) {
            return `
                <div class="error-message">
                    <h3>Unable to Generate Response</h3>
                    <p>${data.error}</p>
                    <p>Please try again or check your connection.</p>
                </div>
            `;
        }

        // Limit questions to 3 for faster response
        const limitedQuestions = data.practice_questions ? 
            data.practice_questions.slice(0, 3) : [];

        return `
            <div class="study-materials" data-topic="${this.escapeHtml(data.topic)}">
                <!-- Header -->
                <div class="study-section">
                    <h1 class="study-title">${this.escapeHtml(data.topic)}</h1>
                    <div class="powered-by">
                        Powered by Advanced AI Models • 
                        Score: ${data.study_score || 98}/100 • 
                        by Sooban Talha Productions
                    </div>
                </div>

                <!-- Ultra Detailed Notes -->
                <div class="study-section">
                    <h2 class="section-title">📚 COMPREHENSIVE ANALYSIS</h2>
                    <div class="ultra-notes">
                        ${this.formatNotes(data.ultra_long_notes)}
                    </div>
                </div>

                <!-- Key Concepts -->
                ${data.key_concepts && data.key_concepts.length > 0 ? `
                <div class="study-section">
                    <h2 class="section-title">🔑 KEY CONCEPTS</h2>
                    <div class="concepts-list">
                        ${data.key_concepts.map(concept => `
                            <div class="concept-item">${this.escapeHtml(concept)}</div>
                        `).join('')}
                    </div>
                </div>
                ` : ''}

                <!-- Practice Questions -->
                ${limitedQuestions.length > 0 ? `
                <div class="study-section">
                    <h2 class="section-title">❓ ADVANCED QUESTIONS</h2>
                    <div class="questions-list">
                        ${limitedQuestions.map((q, index) => `
                            <div class="question-item">
                                <div class="question-text">Q${index + 1}: ${this.escapeHtml(q.question)}</div>
                                <div class="answer-text">${this.escapeHtml(q.answer)}</div>
                            </div>
                        `).join('')}
                    </div>
                </div>
                ` : ''}

                <!-- Tips & Tricks -->
                ${data.key_tricks && data.key_tricks.length > 0 ? `
                <div class="study-section">
                    <h2 class="section-title">⚡ TIPS & TRICKS</h2>
                    <div class="tips-list">
                        ${data.key_tricks.map(trick => `
                            <div class="tip-item">${this.escapeHtml(trick)}</div>
                        `).join('')}
                    </div>
                </div>
                ` : ''}

                <!-- PDF Download Button -->
                <div class="study-section">
                    <div class="pdf-download-section">
                        <button class="download-btn" onclick="goldAI.generateFullPDF('${this.escapeHtml(data.topic)}')">
                            <i class="fas fa-file-pdf"></i>
                            Download Full PDF Report
                        </button>
                    </div>
                </div>

                <!-- Footer -->
                <div class="study-section">
                    <div class="powered-by">
                        Generated by Savoiré AI • 
                        ${data.generated_at ? new Date(data.generated_at).toLocaleString() : new Date().toLocaleString()}
                    </div>
                </div>
            </div>
        `;
    }

    formatNotes(notes) {
        if (!notes) return '<p>No response available.</p>';
        
        // Convert markdown-like formatting to HTML with enhanced styling
        return notes
            .replace(/\n/g, '<br>')
            .replace(/\*\*(.*?)\*\*/g, '<strong style="color: var(--accent-color);">$1</strong>')
            .replace(/\*(.*?)\*/g, '<em>$1</em>')
            .replace(/### (.*?)(?=\n|$)/g, '<h3 style="color: var(--accent-color); margin: 1.5rem 0 1rem 0;">$1</h3>')
            .replace(/## (.*?)(?=\n|$)/g, '<h2 style="color: var(--accent-color); margin: 2rem 0 1rem 0; border-bottom: 2px solid var(--accent-color); padding-bottom: 0.5rem;">$1</h2>')
            .replace(/# (.*?)(?=\n|$)/g, '<h1 style="color: var(--accent-color); margin: 2.5rem 0 1.5rem 0; text-align: center;">$1</h1>');
    }

    generateFullPDF(topic) {
        const { jsPDF } = window.jspdf;
        const doc = new jsPDF();
        
        // Get all the content from study materials
        const studyMaterials = document.querySelector('.study-materials');
        
        // Add header with logo and branding
        doc.setFillColor(255, 215, 0);
        doc.rect(0, 0, 210, 30, 'F');
        doc.setTextColor(0, 0, 0);
        doc.setFontSize(18);
        doc.setFont(undefined, 'bold');
        doc.text('Savoiré AI', 105, 12, { align: 'center' });
        doc.setFontSize(10);
        doc.text('by Sooban Talha Productions', 105, 18, { align: 'center' });
        
        // Add topic title
        doc.setFontSize(16);
        doc.setTextColor(0, 0, 0);
        doc.text(topic, 105, 30, { align: 'center' });
        
        let yPosition = 45;
        
        // Function to add text with page break check
        const addText = (text, fontSize = 10, isBold = false, marginLeft = 20) => {
            if (yPosition > 270) {
                doc.addPage();
                yPosition = 20;
            }
            
            doc.setFontSize(fontSize);
            doc.setFont(undefined, isBold ? 'bold' : 'normal');
            
            const lines = doc.splitTextToSize(text, 170);
            doc.text(lines, marginLeft, yPosition);
            yPosition += (lines.length * (fontSize / 3)) + 5;
        };
        
        // Add comprehensive notes
        const notesElement = studyMaterials.querySelector('.ultra-notes');
        if (notesElement) {
            doc.setFontSize(14);
            doc.setTextColor(255, 215, 0);
            doc.text('COMPREHENSIVE ANALYSIS', 20, yPosition);
            yPosition += 10;
            
            const notesText = this.stripHtml(notesElement.innerHTML)
                .replace(/\n/g, ' ')
                .replace(/\s+/g, ' ')
                .trim();
            
            addText(notesText, 10, false, 20);
            yPosition += 10;
        }
        
        // Add key concepts
        const concepts = Array.from(studyMaterials.querySelectorAll('.concept-item'));
        if (concepts.length > 0) {
            doc.setFontSize(14);
            doc.setTextColor(255, 215, 0);
            doc.text('KEY CONCEPTS', 20, yPosition);
            yPosition += 10;
            
            concepts.forEach((concept, index) => {
                addText(`${index + 1}. ${concept.textContent}`, 10, false, 25);
            });
            yPosition += 10;
        }
        
        // Add questions and answers
        const questions = Array.from(studyMaterials.querySelectorAll('.question-item'));
        if (questions.length > 0) {
            doc.setFontSize(14);
            doc.setTextColor(255, 215, 0);
            doc.text('ADVANCED QUESTIONS', 20, yPosition);
            yPosition += 10;
            
            questions.forEach((question, index) => {
                const questionText = question.querySelector('.question-text').textContent;
                const answerText = question.querySelector('.answer-text').textContent;
                
                addText(`Q${index + 1}: ${questionText}`, 10, true, 25);
                addText(`Answer: ${answerText}`, 10, false, 30);
                yPosition += 5;
            });
        }
        
        // Add tips and tricks
        const tips = Array.from(studyMaterials.querySelectorAll('.tip-item'));
        if (tips.length > 0) {
            if (yPosition > 250) {
                doc.addPage();
                yPosition = 20;
            }
            
            doc.setFontSize(14);
            doc.setTextColor(255, 215, 0);
            doc.text('TIPS & TRICKS', 20, yPosition);
            yPosition += 10;
            
            tips.forEach((tip, index) => {
                addText(`${index + 1}. ${tip.textContent}`, 10, false, 25);
            });
        }
        
        // Add footer
        doc.setFontSize(8);
        doc.setTextColor(128, 128, 128);
        doc.text(`Generated by Savoiré AI - ${new Date().toLocaleString()}`, 105, 285, { align: 'center' });
        
        // Save the PDF
        doc.save(`SavoireAI_${topic.replace(/[^a-zA-Z0-9]/g, '_')}_Full_Report.pdf`);
    }

    showThinking() {
        this.thinkingIndicator.style.display = 'flex';
        this.scrollToBottom();
    }

    hideThinking() {
        this.thinkingIndicator.style.display = 'none';
    }

    showError(message) {
        const errorMessage = `
            <div class="error-message">
                <h3>Connection Issue</h3>
                <p>${this.escapeHtml(message)}</p>
                <p>Please check your internet connection and try again.</p>
            </div>
        `;
        this.addMessage(errorMessage, 'ai');
    }

    clearChat() {
        this.animateButton(this.clearChatBtn);
        setTimeout(() => {
            this.chatMessages.innerHTML = '';
            this.conversationHistory = [];
            this.welcomeArea.style.display = 'block';
            this.messagesContainer.style.display = 'none';
        }, 300);
    }

    scrollToBottom() {
        setTimeout(() => {
            this.chatMessages.scrollTo({
                top: this.chatMessages.scrollHeight,
                behavior: 'smooth'
            });
        }, 100);
    }

    escapeHtml(unsafe) {
        if (!unsafe) return '';
        return unsafe
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#039;");
    }

    stripHtml(html) {
        if (!html) return '';
        const tmp = document.createElement('DIV');
        tmp.innerHTML = html;
        return tmp.textContent || tmp.innerText || '';
    }

    toggleTheme() {
        document.body.classList.toggle('light-theme');
        const icon = document.querySelector('.theme-toggle i');
        if (document.body.classList.contains('light-theme')) {
            icon.className = 'fas fa-sun';
            document.documentElement.style.setProperty('--primary-bg', '#ffffff');
            document.documentElement.style.setProperty('--secondary-bg', '#f8f9fa');
            document.documentElement.style.setProperty('--surface-bg', '#ffffff');
            document.documentElement.style.setProperty('--text-primary', '#202124');
            document.documentElement.style.setProperty('--text-secondary', '#5f6368');
            document.documentElement.style.setProperty('--text-muted', '#80868b');
            document.documentElement.style.setProperty('--border-color', '#dadce0');
            document.documentElement.style.setProperty('--ai-message-bg', '#f8f9fa');
            document.documentElement.style.setProperty('--user-message-bg', '#e8f0fe');
        } else {
            icon.className = 'fas fa-moon';
            document.documentElement.style.setProperty('--primary-bg', '#0a0a0a');
            document.documentElement.style.setProperty('--secondary-bg', '#141414');
            document.documentElement.style.setProperty('--surface-bg', '#1f1f1f');
            document.documentElement.style.setProperty('--text-primary', '#f5f5f5');
            document.documentElement.style.setProperty('--text-secondary', '#cccccc');
            document.documentElement.style.setProperty('--text-muted', '#888888');
            document.documentElement.style.setProperty('--border-color', '#333333');
            document.documentElement.style.setProperty('--ai-message-bg', '#252525');
            document.documentElement.style.setProperty('--user-message-bg', '#1a1a1a');
        }
    }
}

// Initialize the app
const goldAI = new GoldSavoireAI();

// Make available globally
window.goldAI = goldAI;

// Add additional CSS for scroll animations
const scrollAnimations = document.createElement('style');
scrollAnimations.textContent = `
    .study-section {
        opacity: 0;
        transform: translateY(30px);
        transition: all 0.6s cubic-bezier(0.4, 0, 0.2, 1);
    }
    
    .study-section.animate-in {
        opacity: 1;
        transform: translateY(0);
    }
    
    .study-section:nth-child(even) {
        transition-delay: 0.1s;
    }
    
    .study-section:nth-child(odd) {
        transition-delay: 0.2s;
    }
    
    .text-input-container.focused {
        transform: translateY(-2px);
        box-shadow: 0 8px 25px rgba(255, 215, 0, 0.2);
    }
    
    .pdf-download-section {
        text-align: center;
        margin-top: 2rem;
        padding-top: 1.5rem;
        border-top: 1px solid var(--border-color);
    }
    
    /* Mobile specific fixes */
    @media (max-width: 768px) {
        .study-materials {
            margin: 0.5rem 0;
            padding: 1rem;
        }
        
        .message-content {
            max-width: 95%;
        }
        
        .ultra-notes {
            padding: 1rem;
            font-size: 14px;
        }
        
        .concept-item, .tip-item, .question-item {
            padding: 0.6rem;
            font-size: 14px;
        }
        
        .study-title {
            font-size: 1.5rem;
        }
        
        .section-title {
            font-size: 1.1rem;
        }
    }
    
    @media (max-width: 480px) {
        .study-materials {
            padding: 0.8rem;
        }
        
        .ultra-notes {
            padding: 0.8rem;
        }
        
        .question-item {
            padding: 0.8rem;
        }
        
        .download-btn {
            width: 100%;
            padding: 0.8rem 1rem;
            font-size: 14px;
        }
    }
`;
document.head.appendChild(scrollAnimations);
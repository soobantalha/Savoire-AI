// Modern Gemini-style AI Study Assistant
class ModernSavoireAI {
    constructor() {
        this.initializeApp();
        this.bindEvents();
    }

    initializeApp() {
        this.chatMessages = document.getElementById('chatMessages');
        this.messageInput = document.getElementById('messageInput');
        this.sendButton = document.getElementById('sendButton');
        this.welcomeArea = document.getElementById('welcomeArea');
        this.messagesContainer = document.getElementById('messagesContainer');
        this.thinkingIndicator = document.getElementById('thinkingIndicator');
        this.clearChatBtn = document.getElementById('clearChat');
        this.downloadPDFBtn = document.getElementById('downloadPDF');
        
        this.conversationHistory = [];
        this.isGenerating = false;
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
        this.downloadPDFBtn.addEventListener('click', () => this.downloadPDF());

        // Auto-resize textarea
        this.messageInput.addEventListener('input', () => this.autoResize());

        // Quick suggestion chips
        document.querySelectorAll('.suggestion-chip').forEach(chip => {
            chip.addEventListener('click', () => {
                const prompt = chip.getAttribute('data-prompt');
                this.messageInput.value = prompt;
                this.sendMessage();
            });
        });

        // Theme toggle
        document.querySelector('.theme-toggle').addEventListener('click', () => this.toggleTheme());
    }

    autoResize() {
        this.messageInput.style.height = 'auto';
        this.messageInput.style.height = Math.min(this.messageInput.scrollHeight, 120) + 'px';
    }

    async sendMessage() {
        const message = this.messageInput.value.trim();
        if (!message || this.isGenerating) return;

        // Hide welcome area, show messages
        this.welcomeArea.style.display = 'none';
        this.messagesContainer.style.display = 'block';

        // Add user message
        this.addMessage(message, 'user');

        // Clear input
        this.messageInput.value = '';
        this.autoResize();

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
        console.log('Received study data:', data);
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
    }

    formatStudyData(data) {
        if (data.error) {
            return `
                <div class="error-message">
                    <h3>Unable to Generate Study Materials</h3>
                    <p>${data.error}</p>
                    <p>Please try again or check your connection.</p>
                </div>
            `;
        }

        return `
            <div class="study-materials" data-topic="${this.escapeHtml(data.topic)}">
                <!-- Header -->
                <div class="study-section">
                    <h1 class="study-title">${this.escapeHtml(data.topic)}</h1>
                    <div class="powered-by">
                        ${data.curriculum_alignment || 'Comprehensive Study Guide'} • 
                        Score: ${data.study_score || 90}/100 • 
                        by Sooban Talha Productions
                    </div>
                </div>

                <!-- Ultra Detailed Notes -->
                <div class="study-section">
                    <h2 class="section-title">📚 Comprehensive Study Notes</h2>
                    <div class="ultra-notes">
                        ${this.formatNotes(data.ultra_long_notes)}
                    </div>
                </div>

                <!-- Key Concepts -->
                ${data.key_concepts && data.key_concepts.length > 0 ? `
                <div class="study-section">
                    <h2 class="section-title">🔑 Key Concepts</h2>
                    <div class="concepts-list">
                        ${data.key_concepts.map(concept => `
                            <div class="concept-item">${this.escapeHtml(concept)}</div>
                        `).join('')}
                    </div>
                </div>
                ` : ''}

                <!-- Practice Questions -->
                ${data.practice_questions && data.practice_questions.length > 0 ? `
                <div class="study-section">
                    <h2 class="section-title">❓ Practice Questions</h2>
                    <div class="questions-list">
                        ${data.practice_questions.map((q, index) => `
                            <div class="question-item">
                                <div class="question-text">Q${index + 1}: ${this.escapeHtml(q.question)}</div>
                                <div class="answer-text">${this.escapeHtml(q.answer)}</div>
                            </div>
                        `).join('')}
                    </div>
                </div>
                ` : ''}

                <!-- Learning Techniques -->
                ${data.key_tricks && data.key_tricks.length > 0 ? `
                <div class="study-section">
                    <h2 class="section-title">⚡ Learning Techniques</h2>
                    <div class="tips-list">
                        ${data.key_tricks.map(trick => `
                            <div class="tip-item">${this.escapeHtml(trick)}</div>
                        `).join('')}
                    </div>
                </div>
                ` : ''}

                <!-- Exam Tips -->
                ${data.exam_tips && data.exam_tips.length > 0 ? `
                <div class="study-section">
                    <h2 class="section-title">📝 Exam Preparation</h2>
                    <div class="tips-list">
                        ${data.exam_tips.map(tip => `
                            <div class="tip-item">${this.escapeHtml(tip)}</div>
                        `).join('')}
                    </div>
                </div>
                ` : ''}

                <!-- Footer -->
                <div class="study-section">
                    <div class="powered-by">
                        Generated by ${data.powered_by || 'Savoiré AI'} • 
                        ${data.generated_at ? new Date(data.generated_at).toLocaleString() : new Date().toLocaleString()}
                    </div>
                    <button class="download-btn" onclick="modernAI.downloadStudyPDF(this)">
                        <i class="fas fa-download"></i> Download Study Guide
                    </button>
                </div>
            </div>
        `;
    }

    formatNotes(notes) {
        if (!notes) return '<p>No notes available.</p>';
        
        // Convert markdown-like formatting to HTML
        return notes
            .replace(/\n/g, '<br>')
            .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
            .replace(/\*(.*?)\*/g, '<em>$1</em>')
            .replace(/### (.*?)(?=\n|$)/g, '<h3>$1</h3>')
            .replace(/## (.*?)(?=\n|$)/g, '<h2>$1</h2>')
            .replace(/# (.*?)(?=\n|$)/g, '<h1>$1</h1>');
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
        this.chatMessages.innerHTML = '';
        this.conversationHistory = [];
        this.welcomeArea.style.display = 'block';
        this.messagesContainer.style.display = 'none';
    }

    async downloadPDF() {
        if (this.conversationHistory.length === 0) {
            alert('No conversation to download!');
            return;
        }

        try {
            this.downloadPDFBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Generating...';
            this.downloadPDFBtn.disabled = true;

            const { jsPDF } = window.jspdf;
            const pdf = new jsPDF();
            
            let yPosition = 20;
            const pageHeight = pdf.internal.pageSize.height;
            const margin = 20;
            const lineHeight = 7;

            // Add header
            pdf.setFontSize(20);
            pdf.setTextColor(138, 180, 248);
            pdf.text('Savoiré AI - Study Session', margin, yPosition);
            
            yPosition += 10;
            pdf.setFontSize(12);
            pdf.setTextColor(100, 100, 100);
            pdf.text('by Sooban Talha Productions', margin, yPosition);
            
            yPosition += 15;
            pdf.setFontSize(10);
            pdf.text(`Generated on: ${new Date().toLocaleString()}`, margin, yPosition);
            
            yPosition += 20;

            // Add conversation
            pdf.setFontSize(12);
            pdf.setTextColor(0, 0, 0);

            this.conversationHistory.forEach((msg, index) => {
                if (yPosition > pageHeight - 50) {
                    pdf.addPage();
                    yPosition = margin;
                }

                pdf.setFont('helvetica', msg.type === 'user' ? 'bold' : 'normal');
                pdf.setTextColor(msg.type === 'user' ? 30 : 0, msg.type === 'user' ? 58 : 0, msg.type === 'user' ? 95 : 0);
                pdf.text(`${msg.type === 'user' ? 'You' : 'Savoiré AI'}:`, margin, yPosition);
                
                yPosition += lineHeight;
                
                pdf.setFont('helvetica', 'normal');
                pdf.setTextColor(0, 0, 0);
                
                const lines = pdf.splitTextToSize(this.stripHtml(msg.content), 170);
                lines.forEach(line => {
                    if (yPosition > pageHeight - 20) {
                        pdf.addPage();
                        yPosition = margin;
                    }
                    pdf.text(line, margin, yPosition);
                    yPosition += lineHeight;
                });
                
                yPosition += 10;
            });

            pdf.save(`savoire-ai-session-${Date.now()}.pdf`);
            
        } catch (error) {
            console.error('PDF generation failed:', error);
            alert('PDF generation failed. Please try again.');
        } finally {
            this.downloadPDFBtn.innerHTML = '<i class="fas fa-download"></i> Export PDF';
            this.downloadPDFBtn.disabled = false;
        }
    }

    async downloadStudyPDF(button) {
        const studyElement = button.closest('.study-materials');
        const topic = studyElement.getAttribute('data-topic');

        try {
            button.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Creating PDF...';
            button.disabled = true;

            const { jsPDF } = window.jspdf;
            
            // Create PDF from study content
            const pdf = new jsPDF();
            let yPosition = 20;
            const margin = 20;
            const lineHeight = 7;
            const pageHeight = pdf.internal.pageSize.height;

            // Add header
            pdf.setFontSize(20);
            pdf.setTextColor(138, 180, 248);
            pdf.text('Savoiré AI Study Guide', margin, yPosition);
            
            yPosition += 10;
            pdf.setFontSize(12);
            pdf.setTextColor(100, 100, 100);
            pdf.text('by Sooban Talha Productions', margin, yPosition);
            
            yPosition += 10;
            pdf.setFontSize(16);
            pdf.setTextColor(0, 0, 0);
            pdf.text(topic, margin, yPosition);
            
            yPosition += 20;

            // Add content
            pdf.setFontSize(12);
            const content = this.stripHtml(studyElement.textContent);
            const lines = pdf.splitTextToSize(content, 170);
            
            lines.forEach(line => {
                if (yPosition > pageHeight - 20) {
                    pdf.addPage();
                    yPosition = margin;
                }
                pdf.text(line, margin, yPosition);
                yPosition += lineHeight;
            });

            pdf.save(`savoire-ai-${topic.replace(/[^a-z0-9]/gi, '-').toLowerCase()}-${Date.now()}.pdf`);
            
        } catch (error) {
            console.error('Study PDF generation failed:', error);
            alert('PDF generation failed. Please try again.');
        } finally {
            button.innerHTML = '<i class="fas fa-download"></i> Download Study Guide';
            button.disabled = false;
        }
    }

    scrollToBottom() {
        setTimeout(() => {
            this.chatMessages.scrollTop = this.chatMessages.scrollHeight;
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
            // Update CSS variables for light theme
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
            // Reset to dark theme
            document.documentElement.style.setProperty('--primary-bg', '#101010');
            document.documentElement.style.setProperty('--secondary-bg', '#1a1a1a');
            document.documentElement.style.setProperty('--surface-bg', '#262626');
            document.documentElement.style.setProperty('--text-primary', '#e8eaed');
            document.documentElement.style.setProperty('--text-secondary', '#9aa0a6');
            document.documentElement.style.setProperty('--text-muted', '#5f6368');
            document.documentElement.style.setProperty('--border-color', '#3c4043');
            document.documentElement.style.setProperty('--ai-message-bg', '#282828');
            document.documentElement.style.setProperty('--user-message-bg', '#1e3a5f');
        }
    }
}

// Initialize the modern app
const modernAI = new ModernSavoireAI();

// Make available globally
window.modernAI = modernAI;
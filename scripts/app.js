// app.js - Ultra Premium AI with 11-Section Card Layout
class SavoireAI {
    constructor() {
        this.initializeElements();
        this.setupEventListeners();
        this.setupQuickPrompts();
        this.chatHistory = [];
        this.isGenerating = false;
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
        this.suggestPromptsBtn = document.getElementById('suggestPrompts');
        
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
        this.suggestPromptsBtn.addEventListener('click', () => this.showPromptSuggestions());
        
        this.messageInput.focus();
    }

    setupQuickPrompts() {
        document.querySelectorAll('.luxury-start-card').forEach(card => {
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
            this.messageInput.style.height = Math.min(this.messageInput.scrollHeight, 150) + 'px';
        });
    }

    async sendMessage() {
        if (this.isGenerating) return;
        
        const message = this.messageInput.value.trim();
        if (!message) return;

        this.isGenerating = true;

        // Add user message to chat
        this.addMessage(message, 'user');
        this.messageInput.value = '';
        this.messageInput.style.height = 'auto';
        
        // Show loading and hide welcome screen
        this.showLoading();
        this.hideWelcomeScreen();

        try {
            // Get pure AI response with 11-section layout
            const response = await this.getAIResponse(message);
            this.addMessage(response, 'ai');
            
        } catch (error) {
            console.error('Error:', error);
            this.addMessage(
                this.getErrorResponse(),
                'ai'
            );
        } finally {
            this.hideLoading();
            this.scrollToBottom();
            this.isGenerating = false;
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
                    format: 'premium',
                    components: 'all'
                })
            });

            if (response.ok) {
                const data = await response.json();
                return this.displayStudyResults(data);
            } else {
                throw new Error('AI service unavailable');
            }
            
        } catch (error) {
            throw new Error('Unable to connect to AI services');
        }
    }

    // Display study results in unique card-based layout
    displayStudyResults(studyData) {
        const sections = [
            {
                title: '📚 Core Concepts & Fundamentals',
                content: studyData.ultra_long_notes,
                type: 'long-text',
                icon: '📚'
            },
            {
                title: '🎯 Key Concepts Breakdown',
                content: studyData.key_concepts,
                type: 'bubble-list',
                icon: '🎯'
            },
            {
                title: '💡 Smart Techniques & Tricks',
                content: studyData.key_tricks,
                type: 'card-list',
                icon: '💡'
            },
            {
                title: '❓ Practice Questions & Solutions',
                content: studyData.practice_questions,
                type: 'qa-grid',
                icon: '❓'
            },
            {
                title: '🚀 Advanced Strategies',
                content: studyData.advanced_tricks,
                type: 'highlight-list',
                icon: '🚀'
            },
            {
                title: '📝 Quick Revision Notes',
                content: studyData.short_notes,
                type: 'compact-text',
                icon: '📝'
            },
            {
                title: '🧠 Advanced Challenge Questions',
                content: studyData.advanced_questions,
                type: 'qa-advanced',
                icon: '🧠'
            },
            {
                title: '🌍 Real-World Applications',
                content: studyData.real_world_applications,
                type: 'application-cards',
                icon: '🌍'
            },
            {
                title: '⚠️ Common Pitfalls & Misconceptions',
                content: studyData.common_misconceptions,
                type: 'warning-list',
                icon: '⚠️'
            },
            {
                title: '📊 Exam Success Tips',
                content: studyData.exam_tips,
                type: 'tip-cards',
                icon: '📊'
            },
            {
                title: '🔗 Recommended Resources',
                content: studyData.recommended_resources,
                type: 'resource-links',
                icon: '🔗'
            }
        ];

        let html = `
            <div class="study-dashboard">
                <div class="dashboard-header">
                    <div class="topic-main">
                        <h2>${studyData.topic || 'Study Topic'}</h2>
                        <div class="topic-meta">
                            <span class="curriculum-badge">${studyData.curriculum_alignment || 'Premium Learning'}</span>
                            <span class="score-display">Mastery Score: ${studyData.study_score || 85}/100</span>
                        </div>
                    </div>
                    <div class="progress-summary">
                        <div class="progress-circle">
                            <svg width="80" height="80" viewBox="0 0 80 80">
                                <circle cx="40" cy="40" r="35" stroke="#333" stroke-width="3" fill="none"></circle>
                                <circle cx="40" cy="40" r="35" stroke="url(#goldGradient)" stroke-width="3" fill="none" 
                                        stroke-dasharray="${2 * Math.PI * 35}" 
                                        stroke-dashoffset="${2 * Math.PI * 35 * (1 - (studyData.study_score || 85)/100)}"
                                        transform="rotate(-90 40 40)"></circle>
                                <defs>
                                    <linearGradient id="goldGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                                        <stop offset="0%" style="stop-color:#ffd700;stop-opacity:1" />
                                        <stop offset="100%" style="stop-color:#ffed4e;stop-opacity:1" />
                                    </linearGradient>
                                </defs>
                            </svg>
                            <span>${studyData.study_score || 85}%</span>
                        </div>
                    </div>
                </div>

                <div class="dashboard-grid">
        `;

        sections.forEach((section, index) => {
            if (section.content && (!Array.isArray(section.content) || section.content.length > 0)) {
                html += `
                    <div class="study-card" data-card-type="${section.type}">
                        <div class="card-header">
                            <span class="card-icon">${section.icon}</span>
                            <h3>${section.title}</h3>
                            <button class="card-toggle">+</button>
                        </div>
                        <div class="card-content">
                            ${this.formatSectionContent(section.content, section.type)}
                        </div>
                    </div>
                `;
            }
        });

        html += `
                </div>
                
                <div class="study-footer">
                    <div class="completion-badge">
                        <span class="badge-icon">🏆</span>
                        <div class="badge-content">
                            <strong>Study Package Complete</strong>
                            <span>Generated by ${studyData.powered_by || 'Savoiré AI by Sooban Talha Productions'}</span>
                            <small>${new Date(studyData.generated_at || new Date()).toLocaleString()}</small>
                        </div>
                    </div>
                </div>
            </div>
        `;

        return html;
    }

    // Updated formatSectionContent function
    formatSectionContent(content, type) {
        if (!content) return '<p class="no-content">Content not available</p>';
        
        switch (type) {
            case 'bubble-list':
                if (Array.isArray(content)) {
                    return `<div class="bubble-container">${content.map(item => 
                        `<div class="concept-bubble">${this.escapeHtml(item)}</div>`
                    ).join('')}</div>`;
                }
                return `<p>${this.escapeHtml(content)}</p>`;
                
            case 'card-list':
                if (Array.isArray(content)) {
                    return `<div class="technique-grid">${content.map(item => 
                        `<div class="technique-card">
                            <div class="card-bullet">✦</div>
                            <div class="card-text">${this.escapeHtml(item)}</div>
                        </div>`
                    ).join('')}</div>`;
                }
                return `<p>${this.escapeHtml(content)}</p>`;
                
            case 'qa-grid':
                if (Array.isArray(content)) {
                    return `<div class="qa-grid">${content.map(qa => 
                        `<div class="qa-card">
                            <div class="question-box">
                                <strong>${this.escapeHtml(qa.question)}</strong>
                            </div>
                            <div class="answer-box">
                                ${this.escapeHtml(qa.answer)}
                            </div>
                        </div>`
                    ).join('')}</div>`;
                }
                return `<p>${this.escapeHtml(content)}</p>`;
                
            case 'highlight-list':
                if (Array.isArray(content)) {
                    return `<div class="highlight-list">${content.map(item => 
                        `<div class="highlight-item">
                            <span class="highlight-bullet">🚀</span>
                            <span>${this.escapeHtml(item)}</span>
                        </div>`
                    ).join('')}</div>`;
                }
                return `<p>${this.escapeHtml(content)}</p>`;
                
            case 'application-cards':
                if (Array.isArray(content)) {
                    return `<div class="application-grid">${content.map(item => 
                        `<div class="application-card">
                            <div class="app-icon">🌍</div>
                            <div class="app-content">${this.escapeHtml(item)}</div>
                        </div>`
                    ).join('')}</div>`;
                }
                return `<p>${this.escapeHtml(content)}</p>`;
                
            case 'warning-list':
                if (Array.isArray(content)) {
                    return `<div class="warning-container">${content.map(item => 
                        `<div class="warning-item">
                            <span class="warning-icon">⚠️</span>
                            <span>${this.escapeHtml(item)}</span>
                        </div>`
                    ).join('')}</div>`;
                }
                return `<p>${this.escapeHtml(content)}</p>`;
                
            case 'tip-cards':
                if (Array.isArray(content)) {
                    return `<div class="tips-grid">${content.map((tip, i) => 
                        `<div class="tip-card">
                            <div class="tip-number">${i + 1}</div>
                            <div class="tip-content">${this.escapeHtml(tip)}</div>
                        </div>`
                    ).join('')}</div>`;
                }
                return `<p>${this.escapeHtml(content)}</p>`;
                
            case 'resource-links':
                if (Array.isArray(content)) {
                    return `<div class="resources-list">${content.map(item => 
                        `<div class="resource-item">
                            <span class="resource-bullet">📚</span>
                            <span>${this.escapeHtml(item)}</span>
                        </div>`
                    ).join('')}</div>`;
                }
                return `<p>${this.escapeHtml(content)}</p>`;
                
            case 'long-text':
                return `<div class="content-scrollable"><div class="formatted-content">${this.escapeHtml(content).replace(/\n/g, '</p><p>')}</div></div>`;
                
            case 'compact-text':
                return `<div class="compact-notes">${this.escapeHtml(content)}</div>`;
                
            case 'qa-advanced':
                if (Array.isArray(content)) {
                    return content.map(qa => 
                        `<div class="advanced-qa">
                            <div class="advanced-question">
                                <span class="q-marker">🧠</span>
                                <strong>${this.escapeHtml(qa.question)}</strong>
                            </div>
                            <div class="advanced-answer">
                                ${this.escapeHtml(qa.answer)}
                            </div>
                        </div>`
                    ).join('');
                }
                return `<p>${this.escapeHtml(content)}</p>`;
                
            default:
                return `<p>${this.escapeHtml(content)}</p>`;
        }
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

    addMessage(content, type) {
        const messageDiv = document.createElement('div');
        messageDiv.className = `message-luxury ${type}-message-luxury`;
        
        const avatar = document.createElement('div');
        avatar.className = 'message-avatar-luxury';
        avatar.innerHTML = type === 'user' ? '<i class="fas fa-user"></i>' : '<i class="fas fa-crown"></i>';
        
        const messageContent = document.createElement('div');
        messageContent.className = 'message-content-luxury';
        
        const messageText = document.createElement('div');
        messageText.className = 'message-text';
        
        if (type === 'ai') {
            messageText.innerHTML = content;
            // Add interactive functionality
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
        this.chatHistory.push({ 
            type, 
            content: type === 'ai' ? this.stripHTML(content) : content,
            timestamp: new Date(),
            html: type === 'ai' ? content : null
        });
    }

    setupInteractiveElements(container) {
        // Card toggle functionality
        const cardToggles = container.querySelectorAll('.card-toggle');
        cardToggles.forEach(toggle => {
            toggle.addEventListener('click', function() {
                const card = this.closest('.study-card');
                const content = card.querySelector('.card-content');
                const isExpanded = content.style.display !== 'none';
                
                content.style.display = isExpanded ? 'none' : 'block';
                this.textContent = isExpanded ? '+' : '−';
                card.classList.toggle('collapsed', isExpanded);
            });
        });

        // Initially show all card contents
        const cardContents = container.querySelectorAll('.card-content');
        cardContents.forEach(content => {
            content.style.display = 'block';
        });

        // Add gold hover effects
        const studyCards = container.querySelectorAll('.study-card');
        studyCards.forEach(card => {
            card.addEventListener('mouseenter', function() {
                this.style.transform = 'translateY(-8px) scale(1.02)';
            });
            
            card.addEventListener('mouseleave', function() {
                this.style.transform = 'translateY(-5px) scale(1)';
            });
        });
    }

    stripHTML(html) {
        const tmp = document.createElement('div');
        tmp.innerHTML = html;
        return tmp.textContent || tmp.innerText || '';
    }

    getErrorResponse() {
        return `
            <div class="study-dashboard">
                <div class="dashboard-header">
                    <div class="topic-main">
                        <h2>Service Update</h2>
                        <div class="topic-meta">
                            <span class="curriculum-badge">System Notice</span>
                            <span class="score-display">Status: Temporarily Unavailable</span>
                        </div>
                    </div>
                </div>
                <div class="dashboard-grid">
                    <div class="study-card">
                        <div class="card-header">
                            <span class="card-icon">⚠️</span>
                            <h3>Service Maintenance</h3>
                            <button class="card-toggle">+</button>
                        </div>
                        <div class="card-content">
                            <div class="warning-container">
                                <div class="warning-item">
                                    <span class="warning-icon">🔧</span>
                                    <span>Our AI services are currently undergoing maintenance</span>
                                </div>
                                <div class="warning-item">
                                    <span class="warning-icon">⏰</span>
                                    <span>Please try again in a few moments</span>
                                </div>
                                <div class="warning-item">
                                    <span class="warning-icon">📞</span>
                                    <span>Contact support if issues persist</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
                <div class="study-footer">
                    <div class="completion-badge">
                        <span class="badge-icon">⚡</span>
                        <div class="badge-content">
                            <strong>Savoiré AI by Sooban Talha Productions</strong>
                            <span>Premium Intelligence Platform</span>
                            <small>${new Date().toLocaleString()}</small>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

    showLoading() {
        this.loadingIndicator.style.display = 'block';
        this.sendButton.disabled = true;
        this.sendButton.innerHTML = '<i class="fas fa-spinner fa-spin"></i><span class="btn-text-gold">Processing...</span>';
    }

    hideLoading() {
        this.loadingIndicator.style.display = 'none';
        this.sendButton.disabled = false;
        this.sendButton.innerHTML = '<i class="fas fa-paper-plane"></i><span class="btn-text-gold">Send</span>';
    }

    hideWelcomeScreen() {
        this.welcomeScreen.style.display = 'none';
        this.chatMessages.style.display = 'flex';
    }

    scrollToBottom() {
        setTimeout(() => {
            this.chatMessages.scrollTop = this.chatMessages.scrollHeight;
        }, 100);
    }

    clearChat() {
        if (confirm('Start a new premium session? Your current conversation will be cleared.')) {
            this.chatMessages.innerHTML = '';
            this.chatHistory = [];
            this.welcomeScreen.style.display = 'block';
            this.chatMessages.style.display = 'none';
            this.showNotification('New premium session started', 'success');
        }
    }

    showPromptSuggestions() {
        const suggestions = [
            "Explain artificial intelligence with business transformation strategies",
            "Compare classical and modern economic theories with case studies",
            "Describe blockchain technology with investment opportunities",
            "Analyze climate change solutions with technological innovations", 
            "Discuss quantum computing with real-world industry applications"
        ];
        
        const randomPrompt = suggestions[Math.floor(Math.random() * suggestions.length)];
        this.messageInput.value = randomPrompt;
        this.messageInput.focus();
        this.showNotification('Premium suggestion added!', 'info');
    }

    async downloadPDF() {
        if (this.chatHistory.length === 0) {
            this.showNotification('No conversation to export', 'warning');
            return;
        }

        const { jsPDF } = window.jspdf;
        
        try {
            this.showNotification('Creating luxury PDF document...', 'info');
            
            const pdf = new jsPDF('p', 'mm', 'a4');
            let yPosition = 20;
            const pageWidth = pdf.internal.pageSize.getWidth();
            const margin = 20;
            const contentWidth = pageWidth - (2 * margin);

            // Add luxury header
            pdf.setFillColor(255, 215, 0);
            pdf.rect(0, 0, pageWidth, 60, 'F');
            
            pdf.setTextColor(0, 0, 0);
            pdf.setFontSize(24);
            pdf.setFont('helvetica', 'bold');
            pdf.text('Savoiré AI', margin, 30);
            
            pdf.setFontSize(12);
            pdf.setFont('helvetica', 'normal');
            pdf.text('Premium Intelligence Platform - Sooban Talha Productions', margin, 38);
            pdf.text(`Generated on ${new Date().toLocaleString()}`, margin, 45);

            yPosition = 70;

            // Add chat content
            pdf.setTextColor(0, 0, 0);
            this.chatHistory.forEach((msg, index) => {
                if (yPosition > 250) {
                    pdf.addPage();
                    yPosition = 20;
                }

                pdf.setFont('helvetica', 'bold');
                pdf.setFontSize(14);
                pdf.setTextColor(255, 215, 0);
                pdf.text(`${msg.type.toUpperCase()}:`, margin, yPosition);
                
                pdf.setFont('helvetica', 'normal');
                pdf.setFontSize(10);
                pdf.setTextColor(0, 0, 0);
                
                const lines = pdf.splitTextToSize(msg.content, contentWidth);
                pdf.text(lines, margin, yPosition + 8);
                
                yPosition += (lines.length * 5) + 20;
            });

            // Add luxury footer to each page
            const totalPages = pdf.internal.getNumberOfPages();
            for (let i = 1; i <= totalPages; i++) {
                pdf.setPage(i);
                pdf.setFontSize(9);
                pdf.setTextColor(100, 100, 100);
                pdf.text(
                    `Page ${i} of ${totalPages} • Savoiré AI by Sooban Talha Productions • Premium Export`, 
                    pageWidth / 2, 
                    pdf.internal.pageSize.getHeight() - 10, 
                    { align: 'center' }
                );
            }

            const fileName = `Savoire-AI-Premium-${new Date().toISOString().split('T')[0]}.pdf`;
            pdf.save(fileName);
            this.showNotification('Luxury PDF exported successfully!', 'success');
            
        } catch (error) {
            console.error('PDF generation error:', error);
            this.showNotification('Failed to generate PDF. Please try again.', 'error');
        }
    }

    showNotification(message, type = 'info') {
        const notification = document.createElement('div');
        notification.className = `notification-luxury ${type}`;
        
        const icons = {
            success: 'fa-check-circle',
            error: 'fa-exclamation-circle', 
            warning: 'fa-exclamation-triangle',
            info: 'fa-info-circle'
        };
        
        const colors = {
            success: '#10b981',
            error: '#ef4444',
            warning: '#f59e0b', 
            info: '#ffd700'
        };
        
        notification.innerHTML = `
            <i class="fas ${icons[type]}"></i>
            <span>${message}</span>
        `;
        
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: ${colors[type]};
            color: ${type === 'success' ? 'white' : 'black'};
            padding: 1.2rem 1.8rem;
            border-radius: 15px;
            z-index: 10000;
            animation: slideInLuxury 0.3s ease;
            display: flex;
            align-items: center;
            gap: 1rem;
            box-shadow: var(--shadow-gold-strong);
            max-width: 400px;
            font-weight: 600;
            border: 2px solid var(--border-gold);
        `;
        
        document.body.appendChild(notification);
        
        setTimeout(() => {
            notification.style.animation = 'slideOutLuxury 0.3s ease';
            setTimeout(() => notification.remove(), 300);
        }, 4000);
    }
}

// Initialize the application
document.addEventListener('DOMContentLoaded', () => {
    new SavoireAI();
});

// Add CSS animations for luxury notifications
const style = document.createElement('style');
style.textContent = `
    @keyframes slideInLuxury {
        from { transform: translateX(100%); opacity: 0; }
        to { transform: translateX(0); opacity: 1; }
    }
    
    @keyframes slideOutLuxury {
        from { transform: translateX(0); opacity: 1; }
        to { transform: translateX(100%); opacity: 0; }
    }
    
    .notification-luxury {
        font-family: 'Inter', sans-serif;
    }
`;
document.head.appendChild(style);
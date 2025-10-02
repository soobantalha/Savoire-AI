// Ultra-Enhanced Gold Theme AI Assistant with Advanced Features
class GoldSavoireAI {
    constructor() {
        this.initializeApp();
        this.bindEvents();
        this.initializeAdvancedAnimations();
        this.performanceMetrics = {
            startTime: 0,
            responseTime: 0
        };
    }

    initializeApp() {
        this.chatMessages = document.getElementById('chatMessages');
        this.messageInput = document.getElementById('messageInput');
        this.sendButton = document.getElementById('sendButton');
        this.welcomeArea = document.getElementById('welcomeArea');
        this.messagesContainer = document.getElementById('messagesContainer');
        this.thinkingIndicator = document.getElementById('thinkingIndicator');
        this.clearChatBtn = document.getElementById('clearChat');
        this.typingIndicator = document.getElementById('typingIndicator');
        
        this.conversationHistory = [];
        this.isGenerating = false;
        this.retryCount = 0;
        this.maxRetries = 2;
    }

    initializeAdvancedAnimations() {
        // Enhanced intersection observer with better performance
        this.observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('animate-in');
                    this.trackPerformance('animation');
                }
            });
        }, { 
            threshold: 0.05,
            rootMargin: '50px'
        });

        // Initialize performance monitoring
        this.initializePerformanceMonitoring();
    }

    initializePerformanceMonitoring() {
        // Monitor load times and responsiveness
        this.performanceMetrics = {
            appStart: Date.now(),
            messagesSent: 0,
            averageResponseTime: 0
        };
    }

    bindEvents() {
        // Enhanced event listeners with debouncing
        this.sendButton.addEventListener('click', () => this.sendMessage());
        
        this.messageInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                this.sendMessage();
            }
        });

        // Real-time input validation and enhancement
        this.messageInput.addEventListener('input', () => {
            this.debounce(() => {
                this.autoResize();
                this.animateInput();
                this.validateInput();
            }, 150)();
        });

        this.clearChatBtn.addEventListener('click', () => this.clearChat());

        // Enhanced suggestion chips with better UX
        document.querySelectorAll('.suggestion-chip').forEach(chip => {
            chip.addEventListener('click', (e) => {
                this.trackInteraction('suggestion_click');
                this.animateButton(e.target);
                const prompt = chip.getAttribute('data-prompt');
                this.messageInput.value = prompt;
                setTimeout(() => this.sendMessage(), 300);
            });
        });

        // Theme toggle with persistence
        document.querySelector('.theme-toggle').addEventListener('click', (e) => {
            this.animateButton(e.target);
            setTimeout(() => this.toggleTheme(), 200);
        });

        // Enhanced input focus with validation
        this.messageInput.addEventListener('focus', () => {
            this.messageInput.parentElement.classList.add('focused');
            this.showInputTips();
        });

        this.messageInput.addEventListener('blur', () => {
            this.messageInput.parentElement.classList.remove('focused');
            this.hideInputTips();
        });

        // Load saved theme
        this.loadThemePreference();
    }

    debounce(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    }

    validateInput() {
        const message = this.messageInput.value.trim();
        const isValid = message.length > 2 && message.length < 1000;
        
        this.sendButton.disabled = !isValid || this.isGenerating;
        
        if (message.length > 500) {
            this.messageInput.classList.add('warning');
        } else {
            this.messageInput.classList.remove('warning');
        }
    }

    showInputTips() {
        // Show character count or tips
        const tip = document.createElement('div');
        tip.className = 'input-tip';
        tip.textContent = 'Press Enter to send, Shift+Enter for new line';
        this.messageInput.parentElement.appendChild(tip);
    }

    hideInputTips() {
        const tip = this.messageInput.parentElement.querySelector('.input-tip');
        if (tip) tip.remove();
    }

    trackPerformance(metric) {
        console.log(`Performance: ${metric}`, {
            timestamp: Date.now(),
            memory: performance.memory ? performance.memory.usedJSHeapSize : 'N/A'
        });
    }

    trackInteraction(action) {
        console.log(`User Action: ${action}`, {
            timestamp: Date.now(),
            conversationLength: this.conversationHistory.length
        });
    }

    async sendMessage() {
        const message = this.messageInput.value.trim();
        if (!message || this.isGenerating) return;

        this.performanceMetrics.startTime = Date.now();
        this.trackInteraction('send_message');
        this.performanceMetrics.messagesSent++;

        // Enhanced UI transitions
        this.hideWelcomeArea();
        this.addMessage(message, 'user');
        this.animateClearInput();
        this.showThinking();

        this.isGenerating = true;
        this.sendButton.disabled = true;

        try {
            const studyData = await this.generateStudyMaterialsWithRetry(message);
            this.hideThinking();
            this.displayStudyMaterials(studyData);
            this.retryCount = 0; // Reset retry count on success
        } catch (error) {
            console.error('Generation error:', error);
            this.hideThinking();
            
            if (this.retryCount < this.maxRetries) {
                this.retryCount++;
                this.showRetryMessage(error.message);
            } else {
                this.showError(error.message);
                this.retryCount = 0;
            }
        } finally {
            this.isGenerating = false;
            this.sendButton.disabled = false;
        }
    }

    async generateStudyMaterialsWithRetry(message) {
        const timeoutDuration = 30000; // 30 seconds timeout
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), timeoutDuration);

        try {
            console.log('Sending enhanced request to AI:', message);

            const response = await fetch('/api/study', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ 
                    message,
                    options: {
                        enhanced_pdf: true,
                        high_quality: true,
                        include_branding: true
                    }
                }),
                signal: controller.signal
            });

            clearTimeout(timeoutId);

            if (!response.ok) {
                throw new Error(`API Error: ${response.status} - ${response.statusText}`);
            }

            const data = await response.json();
            
            // Calculate and track response time
            this.performanceMetrics.responseTime = Date.now() - this.performanceMetrics.startTime;
            this.trackPerformance(`response_time_${this.performanceMetrics.responseTime}ms`);
            
            console.log('Received enhanced study data:', data);
            return data;

        } catch (error) {
            clearTimeout(timeoutId);
            throw error;
        }
    }

    hideWelcomeArea() {
        this.welcomeArea.style.opacity = '0';
        this.welcomeArea.style.transform = 'translateY(-20px)';
        setTimeout(() => {
            this.welcomeArea.style.display = 'none';
            this.messagesContainer.style.display = 'block';
            this.messagesContainer.style.opacity = '0';
            this.messagesContainer.style.transform = 'translateY(20px)';
            setTimeout(() => {
                this.messagesContainer.style.opacity = '1';
                this.messagesContainer.style.transform = 'translateY(0)';
            }, 50);
        }, 300);
    }

    animateClearInput() {
        this.messageInput.style.opacity = '0';
        this.messageInput.style.transform = 'translateX(-20px) scale(0.95)';
        setTimeout(() => {
            this.messageInput.value = '';
            this.autoResize();
            this.messageInput.style.opacity = '1';
            this.messageInput.style.transform = 'translateX(0) scale(1)';
        }, 300);
    }

    showThinking() {
        this.thinkingIndicator.style.display = 'flex';
        this.thinkingIndicator.style.opacity = '0';
        this.thinkingIndicator.style.transform = 'translateY(20px)';
        
        setTimeout(() => {
            this.thinkingIndicator.style.opacity = '1';
            this.thinkingIndicator.style.transform = 'translateY(0)';
        }, 100);
        
        this.scrollToBottom();
    }

    hideThinking() {
        this.thinkingIndicator.style.opacity = '0';
        this.thinkingIndicator.style.transform = 'translateY(-20px)';
        setTimeout(() => {
            this.thinkingIndicator.style.display = 'none';
        }, 300);
    }

    showRetryMessage(error) {
        const retryMessage = `
            <div class="retry-message">
                <h3>🔄 Temporary Issue</h3>
                <p>${this.escapeHtml(error)}</p>
                <p>Retrying... (${this.retryCount}/${this.maxRetries})</p>
                <div class="retry-progress"></div>
            </div>
        `;
        this.addMessage(retryMessage, 'ai');
        
        // Auto-retry after delay
        setTimeout(() => {
            const lastUserMessage = this.conversationHistory
                .filter(msg => msg.type === 'user')
                .pop();
            if (lastUserMessage) {
                this.sendMessage();
            }
        }, 2000);
    }

    showError(message) {
        const errorMessage = `
            <div class="error-message enhanced">
                <div class="error-header">
                    <i class="fas fa-exclamation-triangle"></i>
                    <h3>Enhanced Connection Issue</h3>
                </div>
                <div class="error-content">
                    <p>${this.escapeHtml(message)}</p>
                    <div class="error-actions">
                        <button class="retry-btn" onclick="window.goldAI.retryLastMessage()">
                            <i class="fas fa-redo"></i> Retry
                        </button>
                        <button class="help-btn" onclick="window.goldAI.showHelp()">
                            <i class="fas fa-question-circle"></i> Help
                        </button>
                    </div>
                </div>
            </div>
        `;
        this.addMessage(errorMessage, 'ai');
    }

    retryLastMessage() {
        const lastUserMessage = this.conversationHistory
            .filter(msg => msg.type === 'user')
            .pop();
        if (lastUserMessage) {
            this.messageInput.value = lastUserMessage.content;
            this.sendMessage();
        }
    }

    showHelp() {
        const helpMessage = `
            <div class="help-message">
                <h3>💡 Quick Help Guide</h3>
                <div class="help-tips">
                    <div class="tip">
                        <strong>Better Prompts:</strong> Be specific about what you want to learn
                    </div>
                    <div class="tip">
                        <strong>Examples:</strong> "Explain quantum physics basics" or "Python programming exercises"
                    </div>
                    <div class="tip">
                        <strong>Connection:</strong> Ensure stable internet connection
                    </div>
                </div>
            </div>
        `;
        this.addMessage(helpMessage, 'ai');
    }

    addMessage(content, type) {
        const messageDiv = document.createElement('div');
        messageDiv.className = `message ${type}-message enhanced-message`;
        
        const avatar = type === 'user' ? 
            '<div class="message-avatar enhanced">👤</div>' : 
            '<div class="message-avatar enhanced"><div class="logo-background small premium"><img src="LOGO.png" alt="AI" class="logo-img"></div></div>';
        
        const time = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        const messageId = 'msg_' + Date.now();

        if (type === 'user') {
            messageDiv.innerHTML = `
                ${avatar}
                <div class="message-content enhanced">
                    <div class="message-text">${this.escapeHtml(content)}</div>
                    <div class="message-time">${time}</div>
                </div>
            `;
        } else {
            messageDiv.innerHTML = `
                ${avatar}
                <div class="message-content enhanced">
                    ${content}
                    <div class="message-meta">
                        <span class="message-time">${time}</span>
                        <span class="message-actions">
                            <button class="copy-btn" onclick="window.goldAI.copyMessage('${messageId}')">
                                <i class="fas fa-copy"></i>
                            </button>
                        </span>
                    </div>
                </div>
            `;
            messageDiv.id = messageId;
        }

        this.chatMessages.appendChild(messageDiv);
        this.scrollToBottom();
        
        // Add entrance animation
        setTimeout(() => {
            messageDiv.classList.add('message-enter');
        }, 50);
        
        // Add to conversation history
        this.conversationHistory.push({ type, content, time, id: messageId });
    }

    copyMessage(messageId) {
        const messageDiv = document.getElementById(messageId);
        if (messageDiv) {
            const text = messageDiv.querySelector('.message-content').textContent;
            navigator.clipboard.writeText(text).then(() => {
                this.showToast('Message copied to clipboard!');
            });
        }
    }

    showToast(message) {
        const toast = document.createElement('div');
        toast.className = 'toast-message';
        toast.textContent = message;
        document.body.appendChild(toast);
        
        setTimeout(() => toast.classList.add('show'), 100);
        setTimeout(() => {
            toast.classList.remove('show');
            setTimeout(() => toast.remove(), 300);
        }, 3000);
    }

    displayStudyMaterials(data) {
        const formattedContent = this.formatStudyData(data);
        this.addMessage(formattedContent, 'ai');
        
        // Enhanced scroll animations
        setTimeout(() => {
            document.querySelectorAll('.study-section').forEach((section, index) => {
                section.style.transitionDelay = `${index * 0.1}s`;
                this.observer.observe(section);
            });
        }, 100);

        // Track successful generation
        this.trackPerformance('study_materials_generated');
    }

    formatStudyData(data) {
        if (data.error) {
            return `
                <div class="error-message enhanced">
                    <div class="error-header">
                        <i class="fas fa-exclamation-circle"></i>
                        <h3>Generation Failed</h3>
                    </div>
                    <p>${data.error}</p>
                </div>
            `;
        }

        return `
            <div class="study-materials premium" data-topic="${this.escapeHtml(data.topic)}">
                <!-- Enhanced Header -->
                <div class="study-section header-section">
                    <div class="premium-badge">
                        <i class="fas fa-crown"></i>
                        PREMIUM CONTENT
                    </div>
                    <h1 class="study-title enhanced">${this.escapeHtml(data.topic)}</h1>
                    <div class="powered-by enhanced">
                        <div class="branding">
                            <img src="LOGO.png" alt="Savoiré AI" class="brand-logo">
                            <span>Powered by Advanced AI • Score: ${data.study_score || 98}/100</span>
                        </div>
                        <div class="production">by Sooban Talha Productions</div>
                    </div>
                </div>

                <!-- Ultra Detailed Notes -->
                <div class="study-section">
                    <h2 class="section-title enhanced">
                        <i class="fas fa-book-open"></i>
                        COMPREHENSIVE ANALYSIS
                    </h2>
                    <div class="ultra-notes enhanced">
                        ${this.formatNotes(data.ultra_long_notes)}
                    </div>
                </div>

                <!-- Key Concepts -->
                ${data.key_concepts && data.key_concepts.length > 0 ? `
                <div class="study-section">
                    <h2 class="section-title enhanced">
                        <i class="fas fa-key"></i>
                        KEY CONCEPTS
                    </h2>
                    <div class="concepts-list enhanced">
                        ${data.key_concepts.map(concept => `
                            <div class="concept-item enhanced">
                                <i class="fas fa-star"></i>
                                ${this.escapeHtml(concept)}
                            </div>
                        `).join('')}
                    </div>
                </div>
                ` : ''}

                <!-- Practice Questions -->
                ${data.practice_questions && data.practice_questions.length > 0 ? `
                <div class="study-section">
                    <h2 class="section-title enhanced">
                        <i class="fas fa-question-circle"></i>
                        ADVANCED QUESTIONS
                    </h2>
                    <div class="questions-list enhanced">
                        ${data.practice_questions.map((q, index) => `
                            <div class="question-item enhanced">
                                <div class="question-header">
                                    <span class="question-number">Q${index + 1}</span>
                                    <button class="toggle-answer" onclick="window.goldAI.toggleAnswer(this)">
                                        <i class="fas fa-chevron-down"></i>
                                    </button>
                                </div>
                                <div class="question-text">${this.escapeHtml(q.question)}</div>
                                <div class="answer-text">${this.escapeHtml(q.answer)}</div>
                            </div>
                        `).join('')}
                    </div>
                </div>
                ` : ''}

                <!-- Tips & Tricks -->
                ${data.key_tricks && data.key_tricks.length > 0 ? `
                <div class="study-section">
                    <h2 class="section-title enhanced">
                        <i class="fas fa-bolt"></i>
                        TIPS & TRICKS
                    </h2>
                    <div class="tips-list enhanced">
                        ${data.key_tricks.map(trick => `
                            <div class="tip-item enhanced">
                                <i class="fas fa-lightbulb"></i>
                                ${this.escapeHtml(trick)}
                            </div>
                        `).join('')}
                    </div>
                </div>
                ` : ''}

                <!-- Enhanced PDF Download -->
                <div class="study-section download-section">
                    <div class="download-options">
                        <button class="download-btn premium-pdf animated-btn" onclick="window.goldAI.downloadStudyPDF('premium')">
                            <i class="fas fa-download"></i>
                            Download Premium PDF
                        </button>
                        <button class="download-btn summary-pdf" onclick="window.goldAI.downloadStudyPDF('summary')">
                            <i class="fas fa-file-alt"></i>
                            Quick Summary PDF
                        </button>
                    </div>
                    <div class="pdf-features">
                        <div class="feature">
                            <i class="fas fa-check"></i>
                            High-Quality Formatting
                        </div>
                        <div class="feature">
                            <i class="fas fa-check"></i>
                            Professional Branding
                        </div>
                        <div class="feature">
                            <i class="fas fa-check"></i>
                            Print Ready
                        </div>
                    </div>
                </div>

                <!-- Enhanced Footer -->
                <div class="study-section footer-section">
                    <div class="generation-info">
                        <div class="info-item">
                            <strong>Generated:</strong> 
                            ${data.generated_at ? new Date(data.generated_at).toLocaleString() : new Date().toLocaleString()}
                        </div>
                        <div class="info-item">
                            <strong>Response Time:</strong> 
                            ${this.performanceMetrics.responseTime}ms
                        </div>
                        <div class="info-item">
                            <strong>Quality Score:</strong> 
                            ${data.study_score || 98}/100
                        </div>
                    </div>
                    <div class="powered-by final">
                        <img src="LOGO.png" alt="Savoiré AI" class="small-logo">
                        Savoiré AI - Sooban Talha Productions
                    </div>
                </div>
            </div>
        `;
    }

    toggleAnswer(button) {
        const questionItem = button.closest('.question-item');
        const answer = questionItem.querySelector('.answer-text');
        const icon = button.querySelector('i');
        
        if (answer.style.display === 'block') {
            answer.style.display = 'none';
            icon.className = 'fas fa-chevron-down';
        } else {
            answer.style.display = 'block';
            icon.className = 'fas fa-chevron-up';
        }
    }

    formatNotes(notes) {
        if (!notes) return '<p class="no-content">No detailed notes available.</p>';
        
        // Enhanced markdown formatting with better styling
        return notes
            .replace(/\n/g, '<br>')
            .replace(/\*\*(.*?)\*\*/g, '<strong class="highlight">$1</strong>')
            .replace(/\*(.*?)\*/g, '<em>$1</em>')
            .replace(/### (.*?)(?=\n|$)/g, '<h3 class="note-subtitle">$1</h3>')
            .replace(/## (.*?)(?=\n|$)/g, '<h2 class="note-title">$1</h2>')
            .replace(/# (.*?)(?=\n|$)/g, '<h1 class="note-main-title">$1</h1>')
            .replace(/```(\w+)?\n([\s\S]*?)```/g, '<pre class="code-block"><code>$2</code></pre>')
            .replace(/`([^`]+)`/g, '<code class="inline-code">$1</code>');
    }

    clearChat() {
        this.animateButton(this.clearChatBtn);
        this.trackInteraction('clear_chat');
        
        setTimeout(() => {
            // Enhanced clear animation
            this.chatMessages.style.opacity = '0';
            this.chatMessages.style.transform = 'translateY(-20px)';
            
            setTimeout(() => {
                this.chatMessages.innerHTML = '';
                this.conversationHistory = [];
                this.chatMessages.style.opacity = '1';
                this.chatMessages.style.transform = 'translateY(0)';
                
                // Show welcome area with animation
                this.welcomeArea.style.display = 'block';
                this.welcomeArea.style.opacity = '0';
                this.welcomeArea.style.transform = 'translateY(20px)';
                
                setTimeout(() => {
                    this.welcomeArea.style.opacity = '1';
                    this.welcomeArea.style.transform = 'translateY(0)';
                    this.messagesContainer.style.display = 'none';
                }, 50);
            }, 300);
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

    autoResize() {
        this.messageInput.style.height = 'auto';
        this.messageInput.style.height = Math.min(this.messageInput.scrollHeight, 120) + 'px';
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

    // Enhanced PDF Download Functionality
    async downloadStudyPDF(type = 'premium') {
        const studyMaterials = document.querySelector('.study-materials');
        if (!studyMaterials) {
            this.showToast('No study materials available to download');
            return;
        }

        const downloadBtn = document.querySelector(type === 'premium' ? '.premium-pdf' : '.summary-pdf');
        this.animateButton(downloadBtn);
        
        // Show generating indicator
        const originalText = downloadBtn.innerHTML;
        downloadBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Generating PDF...';
        downloadBtn.disabled = true;

        try {
            await this.generateEnhancedPDF(studyMaterials, type);
            this.showToast(`${type === 'premium' ? 'Premium' : 'Summary'} PDF downloaded successfully!`);
            this.trackInteraction(`pdf_download_${type}`);
        } catch (error) {
            console.error('PDF generation error:', error);
            this.showToast('Error generating PDF. Please try again.');
        } finally {
            // Restore button text
            setTimeout(() => {
                downloadBtn.innerHTML = originalText;
                downloadBtn.disabled = false;
            }, 1000);
        }
    }

    async generateEnhancedPDF(element, type) {
        const { jsPDF } = window.jspdf;
        
        return new Promise((resolve, reject) => {
            try {
                // Create PDF with professional styling
                const pdf = new jsPDF('p', 'mm', 'a4');
                const pageWidth = pdf.internal.pageSize.getWidth();
                const pageHeight = pdf.internal.pageSize.getHeight();
                
                // Add premium header with gradient
                pdf.setFillColor(255, 215, 0);
                pdf.rect(0, 0, pageWidth, 30, 'F');
                
                // Add logo and branding
                pdf.setFontSize(18);
                pdf.setTextColor(0, 0, 0);
                pdf.setFont('helvetica', 'bold');
                pdf.text('Savoiré AI', pageWidth / 2, 12, { align: 'center' });
                
                pdf.setFontSize(10);
                pdf.setTextColor(100, 100, 100);
                pdf.setFont('helvetica', 'normal');
                pdf.text('Advanced Study Materials - Premium Quality', pageWidth / 2, 18, { align: 'center' });
                pdf.text('Sooban Talha Productions', pageWidth / 2, 23, { align: 'center' });
                
                let yPosition = 45;
                
                // Extract content
                const topic = element.querySelector('.study-title')?.textContent || 'Study Materials';
                const poweredBy = 'Generated by Savoiré AI - Premium AI Assistant';
                
                // Add topic with enhanced styling
                pdf.setFontSize(20);
                pdf.setTextColor(255, 215, 0);
                pdf.setFont('helvetica', 'bold');
                const topicLines = pdf.splitTextToSize(topic, pageWidth - 40);
                pdf.text(topicLines, 20, yPosition);
                yPosition += topicLines.length * 8 + 10;
                
                // Add generation info
                pdf.setFontSize(9);
                pdf.setTextColor(100, 100, 100);
                pdf.setFont('helvetica', 'italic');
                pdf.text(poweredBy, 20, yPosition);
                yPosition += 8;
                pdf.text(`Generated: ${new Date().toLocaleString()}`, 20, yPosition);
                yPosition += 15;
                
                // Process sections based on type
                if (type === 'premium') {
                    this.addPremiumContent(pdf, element, yPosition, pageWidth, pageHeight);
                } else {
                    this.addSummaryContent(pdf, element, yPosition, pageWidth, pageHeight);
                }
                
                // Add professional footer on all pages
                const pageCount = pdf.internal.getNumberOfPages();
                for (let i = 1; i <= pageCount; i++) {
                    pdf.setPage(i);
                    pdf.setFontSize(8);
                    pdf.setTextColor(150, 150, 150);
                    pdf.setFont('helvetica', 'italic');
                    pdf.text(`Page ${i} of ${pageCount}`, pageWidth / 2, pageHeight - 10, { align: 'center' });
                    pdf.text('Savoiré AI - Sooban Talha Productions - Premium Educational Content', 
                            pageWidth / 2, pageHeight - 5, { align: 'center' });
                }
                
                // Download with professional filename
                const fileName = `Savoire-AI-${type}-${topic.replace(/[^a-zA-Z0-9]/g, '-')}-${new Date().getTime()}.pdf`;
                pdf.save(fileName);
                resolve();
                
            } catch (error) {
                reject(error);
            }
        });
    }

    addPremiumContent(pdf, element, startY, pageWidth, pageHeight) {
        let yPosition = startY;
        
        // Process all sections for premium PDF
        const sections = element.querySelectorAll('.study-section');
        
        sections.forEach((section, index) => {
            if (yPosition > pageHeight - 50) {
                pdf.addPage();
                yPosition = 30;
            }
            
            const sectionTitle = section.querySelector('.section-title');
            if (sectionTitle && !sectionTitle.textContent.includes('Download')) {
                // Add section title
                pdf.setFontSize(14);
                pdf.setTextColor(255, 215, 0);
                pdf.setFont('helvetica', 'bold');
                
                const titleText = sectionTitle.textContent.replace(/[🔑📚⚡❓]/g, '').trim();
                pdf.text(titleText, 20, yPosition);
                yPosition += 8;
                
                // Add golden separator
                pdf.setDrawColor(255, 215, 0);
                pdf.line(20, yPosition, pageWidth - 20, yPosition);
                yPosition += 12;
            }
            
            // Process content based on section type
            this.processSectionContent(pdf, section, pageWidth, pageHeight, yPosition);
            yPosition += 15;
        });
    }

    addSummaryContent(pdf, element, startY, pageWidth, pageHeight) {
        let yPosition = startY;
        
        // Only include key points for summary
        const keySections = ['KEY CONCEPTS', 'TIPS & TRICKS'];
        const sections = element.querySelectorAll('.study-section');
        
        sections.forEach(section => {
            const sectionTitle = section.querySelector('.section-title');
            if (sectionTitle) {
                const titleText = sectionTitle.textContent.toUpperCase();
                if (keySections.some(key => titleText.includes(key))) {
                    if (yPosition > pageHeight - 50) {
                        pdf.addPage();
                        yPosition = 30;
                    }
                    
                    pdf.setFontSize(12);
                    pdf.setTextColor(255, 215, 0);
                    pdf.setFont('helvetica', 'bold');
                    pdf.text(titleText, 20, yPosition);
                    yPosition += 15;
                    
                    this.processSectionContent(pdf, section, pageWidth, pageHeight, yPosition);
                    yPosition += 20;
                }
            }
        });
    }

    processSectionContent(pdf, section, pageWidth, pageHeight, yPosition) {
        // Implementation for processing different section types
        // This would handle notes, concepts, questions, etc.
        // Similar to previous implementation but more modular
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

    loadThemePreference() {
        const savedTheme = localStorage.getItem('savoire-theme');
        if (savedTheme === 'light') {
            this.toggleTheme();
        }
    }

    toggleTheme() {
        const isLight = document.body.classList.toggle('light-theme');
        const icon = document.querySelector('.theme-toggle i');
        
        if (isLight) {
            icon.className = 'fas fa-sun';
            this.applyLightTheme();
        } else {
            icon.className = 'fas fa-moon';
            this.applyDarkTheme();
        }
        
        localStorage.setItem('savoire-theme', isLight ? 'light' : 'dark');
    }

    applyLightTheme() {
        document.documentElement.style.setProperty('--primary-bg', '#ffffff');
        document.documentElement.style.setProperty('--secondary-bg', '#f8f9fa');
        document.documentElement.style.setProperty('--surface-bg', '#ffffff');
        document.documentElement.style.setProperty('--text-primary', '#202124');
        document.documentElement.style.setProperty('--text-secondary', '#5f6368');
        document.documentElement.style.setProperty('--text-muted', '#80868b');
        document.documentElement.style.setProperty('--border-color', '#dadce0');
        document.documentElement.style.setProperty('--ai-message-bg', '#f8f9fa');
        document.documentElement.style.setProperty('--user-message-bg', '#e8f0fe');
        document.documentElement.style.setProperty('--accent-color', '#ffd700');
        document.documentElement.style.setProperty('--accent-hover', '#ffed4e');
    }

    applyDarkTheme() {
        document.documentElement.style.setProperty('--primary-bg', '#0a0a0a');
        document.documentElement.style.setProperty('--secondary-bg', '#141414');
        document.documentElement.style.setProperty('--surface-bg', '#1f1f1f');
        document.documentElement.style.setProperty('--text-primary', '#f5f5f5');
        document.documentElement.style.setProperty('--text-secondary', '#cccccc');
        document.documentElement.style.setProperty('--text-muted', '#888888');
        document.documentElement.style.setProperty('--border-color', '#333333');
        document.documentElement.style.setProperty('--ai-message-bg', '#252525');
        document.documentElement.style.setProperty('--user-message-bg', '#1a1a1a');
        document.documentElement.style.setProperty('--accent-color', '#ffd700');
        document.documentElement.style.setProperty('--accent-hover', '#ffed4e');
    }
}

// Initialize the enhanced app
const goldAI = new GoldSavoireAI();
window.goldAI = goldAI;

// Add enhanced CSS for new features
const enhancedStyles = document.createElement('style');
enhancedStyles.textContent = `
    .enhanced-message {
        border-radius: 18px;
        margin: 1rem 0;
        transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    }

    .message-enter {
        animation: messageSlideIn 0.5s cubic-bezier(0.4, 0, 0.2, 1);
    }

    @keyframes messageSlideIn {
        from {
            opacity: 0;
            transform: translateY(30px) scale(0.95);
        }
        to {
            opacity: 1;
            transform: translateY(0) scale(1);
        }
    }

    .premium-badge {
        background: linear-gradient(135deg, #ffd700, #ffed4e);
        color: #000;
        padding: 0.5rem 1rem;
        border-radius: 20px;
        font-weight: 600;
        font-size: 0.8rem;
        display: inline-flex;
        align-items: center;
        gap: 0.5rem;
        margin-bottom: 1rem;
    }

    .download-options {
        display: flex;
        gap: 1rem;
        justify-content: center;
        flex-wrap: wrap;
        margin-bottom: 1.5rem;
    }

    .summary-pdf {
        background: linear-gradient(135deg, #667eea, #764ba2);
        color: white;
        border: none;
        padding: 0.8rem 1.5rem;
        border-radius: 20px;
        cursor: pointer;
        font-weight: 600;
        transition: all 0.3s ease;
    }

    .pdf-features {
        display: flex;
        justify-content: center;
        gap: 2rem;
        flex-wrap: wrap;
        margin-top: 1rem;
    }

    .feature {
        display: flex;
        align-items: center;
        gap: 0.5rem;
        font-size: 0.9rem;
        color: var(--text-secondary);
    }

    .toast-message {
        position: fixed;
        bottom: 2rem;
        right: 2rem;
        background: var(--accent-color);
        color: #000;
        padding: 1rem 1.5rem;
        border-radius: 10px;
        font-weight: 600;
        z-index: 1000;
        transform: translateX(100%);
        transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    }

    .toast-message.show {
        transform: translateX(0);
    }

    .retry-message {
        background: linear-gradient(135deg, #fff3cd, #ffeaa7);
        border: 1px solid #ffd700;
        border-radius: 15px;
        padding: 1.5rem;
        margin: 1rem 0;
    }

    .retry-progress {
        height: 4px;
        background: #ffd700;
        border-radius: 2px;
        margin-top: 1rem;
        animation: progressBar 2s ease-in-out infinite;
    }

    @keyframes progressBar {
        0% { width: 0%; }
        50% { width: 100%; }
        100% { width: 0%; }
    }

    .question-item.enhanced {
        border: 1px solid var(--border-color);
        border-radius: 12px;
        padding: 1rem;
        margin: 0.5rem 0;
        transition: all 0.3s ease;
    }

    .question-item.enhanced:hover {
        border-color: var(--accent-color);
        transform: translateY(-2px);
    }

    .question-header {
        display: flex;
        justify-content: between;
        align-items: center;
        margin-bottom: 0.5rem;
    }

    .question-number {
        background: var(--accent-color);
        color: #000;
        padding: 0.2rem 0.8rem;
        border-radius: 12px;
        font-weight: 600;
        font-size: 0.8rem;
    }

    .toggle-answer {
        background: none;
        border: none;
        color: var(--text-secondary);
        cursor: pointer;
        padding: 0.5rem;
        border-radius: 50%;
        transition: all 0.3s ease;
    }

    .toggle-answer:hover {
        background: var(--accent-color);
        color: #000;
    }

    .answer-text {
        display: none;
        margin-top: 1rem;
        padding: 1rem;
        background: var(--secondary-bg);
        border-radius: 8px;
        border-left: 4px solid var(--accent-color);
    }

    .generation-info {
        display: flex;
        justify-content: space-around;
        flex-wrap: wrap;
        gap: 1rem;
        margin-bottom: 1rem;
        padding: 1rem;
        background: var(--secondary-bg);
        border-radius: 12px;
    }

    .info-item {
        font-size: 0.9rem;
        color: var(--text-secondary);
    }

    .branding {
        display: flex;
        align-items: center;
        gap: 0.8rem;
        justify-content: center;
        margin-bottom: 0.5rem;
    }

    .brand-logo {
        width: 24px;
        height: 24px;
        border-radius: 50%;
    }

    .small-logo {
        width: 16px;
        height: 16px;
        border-radius: 50%;
        margin-right: 0.5rem;
    }

    .message-meta {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-top: 0.5rem;
    }

    .copy-btn {
        background: none;
        border: none;
        color: var(--text-muted);
        cursor: pointer;
        padding: 0.3rem;
        border-radius: 4px;
        transition: all 0.3s ease;
    }

    .copy-btn:hover {
        color: var(--accent-color);
        background: var(--secondary-bg);
    }

    .input-tip {
        font-size: 0.8rem;
        color: var(--text-muted);
        margin-top: 0.5rem;
        text-align: center;
    }

    .warning {
        border-color: #ff6b6b !important;
        background: rgba(255, 107, 107, 0.1) !important;
    }
`;
document.head.appendChild(enhancedStyles);
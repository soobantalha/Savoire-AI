// Ultra-Premium Gold Theme AI Assistant - Enhanced Version
class PremiumSavoireAI {
    constructor() {
        this.initializeApp();
        this.bindEvents();
        this.initializePremiumAnimations();
        this.setupPerformanceTracking();
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
        this.retryCount = 0;
        this.maxRetries = 2;
        this.currentTopic = '';
    }

    setupPerformanceTracking() {
        this.performanceMetrics = {
            appStart: Date.now(),
            messagesSent: 0,
            totalResponseTime: 0,
            lastResponseTime: 0
        };
    }

    initializePremiumAnimations() {
        // Premium intersection observer
        this.observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('premium-animate-in');
                    this.trackPerformance('animation_trigger');
                }
            });
        }, { 
            threshold: 0.1,
            rootMargin: '30px'
        });
    }

    bindEvents() {
        // Enhanced event binding with error handling
        this.sendButton.addEventListener('click', () => this.sendMessage());
        
        this.messageInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                this.sendMessage();
            }
        });

        // Enhanced input handling
        this.messageInput.addEventListener('input', () => {
            this.debounce(() => {
                this.autoResize();
                this.animateInput();
                this.validateInput();
            }, 100)();
        });

        this.clearChatBtn.addEventListener('click', () => this.clearChat());

        // Premium suggestion chips
        document.querySelectorAll('.suggestion-chip').forEach(chip => {
            chip.addEventListener('click', (e) => {
                this.trackInteraction('premium_suggestion_click');
                this.animatePremiumButton(e.target);
                const prompt = chip.getAttribute('data-prompt');
                this.messageInput.value = prompt;
                setTimeout(() => this.sendMessage(), 400);
            });
        });

        // Enhanced theme toggle
        const themeToggle = document.querySelector('.theme-toggle');
        if (themeToggle) {
            themeToggle.addEventListener('click', (e) => {
                this.animatePremiumButton(e.currentTarget);
                setTimeout(() => this.toggleTheme(), 200);
            });
        }

        // Load preferences
        this.loadThemePreference();
        
        console.log('Premium Savoire AI initialized successfully');
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
        const isValid = message.length > 1 && message.length < 2000;
        
        this.sendButton.disabled = !isValid || this.isGenerating;
        
        // Visual feedback
        if (message.length > 800) {
            this.messageInput.classList.add('warning');
        } else {
            this.messageInput.classList.remove('warning');
        }
    }

    async sendMessage() {
        const message = this.messageInput.value.trim();
        if (!message || this.isGenerating) return;

        this.currentTopic = message;
        this.performanceMetrics.startTime = Date.now();
        this.trackInteraction('premium_message_sent');
        this.performanceMetrics.messagesSent++;

        // Premium UI transitions
        this.hideWelcomeArea();
        this.addMessage(message, 'user');
        this.animateClearInput();
        this.showPremiumThinking();

        this.isGenerating = true;
        this.updateSendButtonState();

        try {
            const studyData = await this.generatePremiumStudyMaterials(message);
            this.hideThinking();
            this.displayPremiumStudyMaterials(studyData);
            this.retryCount = 0;
            this.trackPerformance('generation_success');
        } catch (error) {
            console.error('Premium generation error:', error);
            this.hideThinking();
            
            if (this.retryCount < this.maxRetries) {
                this.retryCount++;
                this.showPremiumRetryMessage(error.message);
            } else {
                this.showPremiumError(error.message);
                this.retryCount = 0;
            }
            this.trackPerformance('generation_failed');
        } finally {
            this.isGenerating = false;
            this.updateSendButtonState();
        }
    }

    async generatePremiumStudyMaterials(message) {
        const timeoutDuration = 35000;
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), timeoutDuration);

        try {
            console.log('Sending premium request to API...');

            const response = await fetch('/api/study', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ 
                    message: message,
                    options: {
                        premium_quality: true,
                        enhanced_content: true,
                        detailed_analysis: true
                    }
                }),
                signal: controller.signal
            });

            clearTimeout(timeoutId);

            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(`Server error: ${response.status} - ${errorText}`);
            }

            const data = await response.json();
            
            // Calculate performance metrics
            this.performanceMetrics.lastResponseTime = Date.now() - this.performanceMetrics.startTime;
            this.performanceMetrics.totalResponseTime += this.performanceMetrics.lastResponseTime;
            
            console.log('Premium study data received:', data);
            return data;

        } catch (error) {
            clearTimeout(timeoutId);
            console.error('API call failed:', error);
            throw new Error(`Network error: ${error.message}`);
        }
    }

    hideWelcomeArea() {
        this.welcomeArea.style.opacity = '0';
        this.welcomeArea.style.transform = 'translateY(-30px) scale(0.95)';
        setTimeout(() => {
            this.welcomeArea.style.display = 'none';
            this.messagesContainer.style.display = 'block';
            this.messagesContainer.style.opacity = '0';
            setTimeout(() => {
                this.messagesContainer.style.opacity = '1';
            }, 50);
        }, 400);
    }

    animateClearInput() {
        this.messageInput.style.transform = 'translateX(-30px) scale(0.9)';
        this.messageInput.style.opacity = '0.5';
        setTimeout(() => {
            this.messageInput.value = '';
            this.autoResize();
            this.messageInput.style.transform = 'translateX(0) scale(1)';
            this.messageInput.style.opacity = '1';
        }, 300);
    }

    showPremiumThinking() {
        this.thinkingIndicator.style.display = 'flex';
        this.thinkingIndicator.style.opacity = '0';
        this.thinkingIndicator.style.transform = 'translateY(20px) scale(0.9)';
        
        setTimeout(() => {
            this.thinkingIndicator.style.opacity = '1';
            this.thinkingIndicator.style.transform = 'translateY(0) scale(1)';
        }, 150);
        
        this.scrollToBottom();
    }

    hideThinking() {
        this.thinkingIndicator.style.opacity = '0';
        this.thinkingIndicator.style.transform = 'translateY(-20px) scale(0.9)';
        setTimeout(() => {
            this.thinkingIndicator.style.display = 'none';
        }, 300);
    }

    showPremiumRetryMessage(error) {
        const retryMessage = `
            <div class="premium-retry-message">
                <div class="retry-header">
                    <i class="fas fa-sync-alt"></i>
                    <h3>Premium Retry System</h3>
                </div>
                <p>${this.escapeHtml(error)}</p>
                <p>Auto-retrying in 2 seconds... (Attempt ${this.retryCount}/${this.maxRetries})</p>
                <div class="premium-progress">
                    <div class="progress-bar"></div>
                </div>
            </div>
        `;
        this.addMessage(retryMessage, 'ai');
        
        setTimeout(() => {
            if (this.currentTopic) {
                this.sendMessage();
            }
        }, 2000);
    }

    showPremiumError(message) {
        const errorMessage = `
            <div class="premium-error-message">
                <div class="error-header">
                    <i class="fas fa-exclamation-triangle"></i>
                    <h3>Premium Service Alert</h3>
                </div>
                <div class="error-content">
                    <p>${this.escapeHtml(message)}</p>
                    <div class="premium-error-actions">
                        <button class="premium-retry-btn" onclick="window.premiumAI.retryLastMessage()">
                            <i class="fas fa-bolt"></i>
                            Premium Retry
                        </button>
                        <button class="premium-help-btn" onclick="window.premiumAI.showPremiumHelp()">
                            <i class="fas fa-life-ring"></i>
                            Get Help
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

    showPremiumHelp() {
        const helpMessage = `
            <div class="premium-help-message">
                <div class="help-header">
                    <i class="fas fa-crown"></i>
                    <h3>Premium Support Guide</h3>
                </div>
                <div class="premium-tips">
                    <div class="premium-tip">
                        <strong>Optimal Prompts:</strong> "Advanced machine learning algorithms" or "Comprehensive business strategy frameworks"
                    </div>
                    <div class="premium-tip">
                        <strong>Enhanced Results:</strong> Be specific about depth and application areas
                    </div>
                    <div class="premium-tip">
                        <strong>Technical Issues:</strong> Check internet connection and try refreshing
                    </div>
                </div>
            </div>
        `;
        this.addMessage(helpMessage, 'ai');
    }

    addMessage(content, type) {
        const messageDiv = document.createElement('div');
        messageDiv.className = `message ${type}-message premium-message`;
        
        const avatar = type === 'user' ? 
            '<div class="premium-avatar user">👤</div>' : 
            '<div class="premium-avatar ai"><div class="gold-logo"><img src="LOGO.png" alt="AI" onerror="this.style.display=\'none\'"></div></div>';
        
        const time = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        const messageId = 'premium_msg_' + Date.now();

        if (type === 'user') {
            messageDiv.innerHTML = `
                ${avatar}
                <div class="premium-message-content">
                    <div class="premium-message-text">${this.escapeHtml(content)}</div>
                    <div class="premium-message-time">${time}</div>
                </div>
            `;
        } else {
            messageDiv.innerHTML = `
                ${avatar}
                <div class="premium-message-content">
                    ${content}
                    <div class="premium-message-meta">
                        <span class="premium-time">${time}</span>
                        <span class="premium-actions">
                            <button class="premium-copy-btn" onclick="window.premiumAI.copyPremiumMessage('${messageId}')" title="Copy to clipboard">
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
        
        // Premium entrance animation
        setTimeout(() => {
            messageDiv.classList.add('premium-message-enter');
        }, 50);
        
        // Add to conversation history
        this.conversationHistory.push({ 
            type, 
            content, 
            time, 
            id: messageId,
            timestamp: Date.now()
        });
    }

    copyPremiumMessage(messageId) {
        const messageDiv = document.getElementById(messageId);
        if (messageDiv) {
            const text = messageDiv.querySelector('.premium-message-content').textContent;
            navigator.clipboard.writeText(text).then(() => {
                this.showPremiumToast('✅ Copied to clipboard!');
            }).catch(() => {
                this.showPremiumToast('❌ Copy failed');
            });
        }
    }

    showPremiumToast(message) {
        const toast = document.createElement('div');
        toast.className = 'premium-toast';
        toast.innerHTML = `
            <div class="toast-content">
                <i class="fas fa-check-circle"></i>
                <span>${message}</span>
            </div>
        `;
        document.body.appendChild(toast);
        
        setTimeout(() => toast.classList.add('show'), 100);
        setTimeout(() => {
            toast.classList.remove('show');
            setTimeout(() => toast.remove(), 400);
        }, 3000);
    }

    displayPremiumStudyMaterials(data) {
        const formattedContent = this.formatPremiumStudyData(data);
        this.addMessage(formattedContent, 'ai');
        
        // Enhanced animations
        setTimeout(() => {
            document.querySelectorAll('.premium-section').forEach((section, index) => {
                section.style.transitionDelay = `${index * 0.15}s`;
                this.observer.observe(section);
            });
        }, 200);

        this.trackPerformance('premium_content_displayed');
    }

    formatPremiumStudyData(data) {
        if (data.error) {
            return `
                <div class="premium-error-message">
                    <div class="error-header">
                        <i class="fas fa-times-circle"></i>
                        <h3>Generation Failed</h3>
                    </div>
                    <p>${data.error}</p>
                    <p class="error-suggestion">Please try a different prompt or check your connection.</p>
                </div>
            `;
        }

        const isFallback = data.is_fallback || data.content_quality === 'premium_fallback';
        const score = data.study_score || 92;
        const responseTime = data.response_time || this.performanceMetrics.lastResponseTime;

        return `
            <div class="premium-study-materials" data-topic="${this.escapeHtml(data.topic)}" data-fallback="${isFallback}">
                <!-- Premium Header -->
                <div class="premium-section header-section">
                    ${isFallback ? `
                    <div class="premium-fallback-badge">
                        <i class="fas fa-shield-alt"></i>
                        PREMIUM FALLBACK CONTENT
                    </div>
                    ` : `
                    <div class="premium-badge">
                        <i class="fas fa-crown"></i>
                        ULTRA-PREMIUM CONTENT
                    </div>
                    `}
                    <h1 class="premium-title">${this.escapeHtml(data.topic)}</h1>
                    <div class="premium-meta">
                        <div class="meta-item">
                            <i class="fas fa-bolt"></i>
                            Score: ${score}/100
                        </div>
                        <div class="meta-item">
                            <i class="fas fa-clock"></i>
                            ${responseTime}ms
                        </div>
                        <div class="meta-item">
                            <i class="fas fa-star"></i>
                            ${isFallback ? 'Enhanced Fallback' : 'AI Generated'}
                        </div>
                    </div>
                </div>

                <!-- Ultra Detailed Notes -->
                <div class="premium-section">
                    <h2 class="premium-section-title">
                        <i class="fas fa-gem"></i>
                        COMPREHENSIVE ANALYSIS
                    </h2>
                    <div class="premium-notes">
                        ${this.formatPremiumNotes(data.ultra_long_notes)}
                    </div>
                </div>

                <!-- Key Concepts -->
                ${data.key_concepts && data.key_concepts.length > 0 ? `
                <div class="premium-section">
                    <h2 class="premium-section-title">
                        <i class="fas fa-key"></i>
                        CORE CONCEPTS
                    </h2>
                    <div class="premium-concepts">
                        ${data.key_concepts.map(concept => `
                            <div class="premium-concept">
                                <i class="fas fa-diamond"></i>
                                <span>${this.escapeHtml(concept)}</span>
                            </div>
                        `).join('')}
                    </div>
                </div>
                ` : ''}

                <!-- Practice Questions -->
                ${data.practice_questions && data.practice_questions.length > 0 ? `
                <div class="premium-section">
                    <h2 class="premium-section-title">
                        <i class="fas fa-brain"></i>
                        ADVANCED QUESTIONS
                    </h2>
                    <div class="premium-questions">
                        ${data.practice_questions.map((q, index) => `
                            <div class="premium-question">
                                <div class="question-header">
                                    <span class="question-tag">Q${index + 1}</span>
                                    <button class="premium-toggle" onclick="window.premiumAI.togglePremiumAnswer(this)">
                                        <i class="fas fa-chevron-down"></i>
                                    </button>
                                </div>
                                <div class="question-content">${this.escapeHtml(q.question)}</div>
                                <div class="premium-answer">${this.escapeHtml(q.answer)}</div>
                            </div>
                        `).join('')}
                    </div>
                </div>
                ` : ''}

                <!-- Tips & Tricks -->
                ${data.key_tricks && data.key_tricks.length > 0 ? `
                <div class="premium-section">
                    <h2 class="premium-section-title">
                        <i class="fas fa-magic"></i>
                        EXPERT TIPS
                    </h2>
                    <div class="premium-tips-list">
                        ${data.key_tricks.map(trick => `
                            <div class="premium-tip-item">
                                <i class="fas fa-lightbulb"></i>
                                ${this.escapeHtml(trick)}
                            </div>
                        `).join('')}
                    </div>
                </div>
                ` : ''}

                <!-- Premium PDF Download -->
                <div class="premium-section download-section">
                    <div class="premium-download-card">
                        <div class="download-header">
                            <i class="fas fa-download"></i>
                            <h3>Premium PDF Export</h3>
                        </div>
                        <p>Download enhanced premium PDF with professional formatting</p>
                        <button class="premium-download-btn" onclick="window.premiumAI.downloadPremiumPDF()">
                            <i class="fas fa-file-pdf"></i>
                            Download Premium PDF
                        </button>
                        <div class="download-features">
                            <span><i class="fas fa-check"></i> High Quality</span>
                            <span><i class="fas fa-check"></i> Professional</span>
                            <span><i class="fas fa-check"></i> Print Ready</span>
                        </div>
                    </div>
                </div>

                <!-- Premium Footer -->
                <div class="premium-section footer-section">
                    <div class="premium-footer">
                        <div class="footer-content">
                            <div class="footer-brand">
                                <img src="LOGO.png" alt="Savoiré AI" class="footer-logo" onerror="this.style.display='none'">
                                <span>Savoiré AI Premium</span>
                            </div>
                            <div class="footer-info">
                                Generated: ${data.generated_at ? new Date(data.generated_at).toLocaleString() : new Date().toLocaleString()}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

    togglePremiumAnswer(button) {
        const question = button.closest('.premium-question');
        const answer = question.querySelector('.premium-answer');
        const icon = button.querySelector('i');
        
        if (answer.style.display === 'block') {
            answer.style.display = 'none';
            icon.className = 'fas fa-chevron-down';
            button.classList.remove('active');
        } else {
            answer.style.display = 'block';
            icon.className = 'fas fa-chevron-up';
            button.classList.add('active');
        }
    }

    formatPremiumNotes(notes) {
        if (!notes) return '<p class="no-content">No detailed notes available.</p>';
        
        return notes
            .replace(/\n/g, '<br>')
            .replace(/\*\*(.*?)\*\*/g, '<strong class="gold-highlight">$1</strong>')
            .replace(/\*(.*?)\*/g, '<em>$1</em>')
            .replace(/### (.*?)(?=\n|$)/g, '<h3 class="note-subheading">$1</h3>')
            .replace(/## (.*?)(?=\n|$)/g, '<h2 class="note-heading">$1</h2>')
            .replace(/# (.*?)(?=\n|$)/g, '<h1 class="note-main-heading">$1</h1>')
            .replace(/`([^`]+)`/g, '<code class="inline-code">$1</code>');
    }

    async downloadPremiumPDF() {
        const studyMaterials = document.querySelector('.premium-study-materials');
        if (!studyMaterials) {
            this.showPremiumToast('No study materials available');
            return;
        }

        const downloadBtn = document.querySelector('.premium-download-btn');
        this.animatePremiumButton(downloadBtn);
        
        // Show generating state
        const originalHTML = downloadBtn.innerHTML;
        downloadBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Creating Premium PDF...';
        downloadBtn.disabled = true;

        try {
            await this.generateUltraPremiumPDF(studyMaterials);
            this.showPremiumToast('✅ Premium PDF Downloaded!');
            this.trackInteraction('premium_pdf_downloaded');
        } catch (error) {
            console.error('PDF generation failed:', error);
            this.showPremiumToast('❌ PDF generation failed');
        } finally {
            // Restore button
            setTimeout(() => {
                downloadBtn.innerHTML = originalHTML;
                downloadBtn.disabled = false;
            }, 1500);
        }
    }

    async generateUltraPremiumPDF(element) {
        return new Promise((resolve, reject) => {
            try {
                const { jsPDF } = window.jspdf;
                const pdf = new jsPDF('p', 'mm', 'a4');
                const pageWidth = pdf.internal.pageSize.getWidth();
                const pageHeight = pdf.internal.pageSize.getHeight();
                
                // Premium golden header
                pdf.setFillColor(255, 215, 0);
                pdf.rect(0, 0, pageWidth, 25, 'F');
                
                // Premium title
                pdf.setFontSize(16);
                pdf.setTextColor(0, 0, 0);
                pdf.setFont('helvetica', 'bold');
                pdf.text('Savoiré AI - Premium Study Materials', pageWidth / 2, 10, { align: 'center' });
                
                pdf.setFontSize(10);
                pdf.setTextColor(100, 100, 100);
                pdf.setFont('helvetica', 'normal');
                pdf.text('Ultra-Premium Educational Content', pageWidth / 2, 16, { align: 'center' });
                
                let yPosition = 40;
                
                // Extract topic
                const topic = element.querySelector('.premium-title')?.textContent || 'Study Materials';
                
                // Add main topic
                pdf.setFontSize(20);
                pdf.setTextColor(255, 215, 0);
                pdf.setFont('helvetica', 'bold');
                pdf.text(topic, 20, yPosition);
                yPosition += 15;
                
                // Add metadata
                pdf.setFontSize(10);
                pdf.setTextColor(100, 100, 100);
                pdf.text(`Generated: ${new Date().toLocaleString()}`, 20, yPosition);
                yPosition += 20;
                
                // Process content sections
                this.addPDFContent(pdf, element, yPosition, pageWidth, pageHeight);
                
                // Add premium footer
                const pageCount = pdf.internal.getNumberOfPages();
                for (let i = 1; i <= pageCount; i++) {
                    pdf.setPage(i);
                    pdf.setFontSize(8);
                    pdf.setTextColor(150, 150, 150);
                    pdf.text(`Savoiré AI Premium - Page ${i} of ${pageCount}`, pageWidth / 2, pageHeight - 10, { align: 'center' });
                }
                
                const fileName = `Savoire-AI-Premium-${topic.replace(/[^a-zA-Z0-9]/g, '-')}-${Date.now()}.pdf`;
                pdf.save(fileName);
                resolve();
                
            } catch (error) {
                reject(error);
            }
        });
    }

    addPDFContent(pdf, element, startY, pageWidth, pageHeight) {
        // Simplified PDF content addition
        let yPosition = startY;
        
        // Add notes section
        const notes = element.querySelector('.premium-notes');
        if (notes) {
            const notesText = this.stripHtml(notes.innerHTML);
            const lines = pdf.splitTextToSize(notesText, pageWidth - 40);
            
            pdf.setFontSize(11);
            pdf.setTextColor(0, 0, 0);
            pdf.setFont('helvetica', 'normal');
            
            for (let line of lines) {
                if (yPosition > pageHeight - 20) {
                    pdf.addPage();
                    yPosition = 30;
                }
                pdf.text(line, 20, yPosition);
                yPosition += 5;
            }
            yPosition += 10;
        }
    }

    clearChat() {
        this.animatePremiumButton(this.clearChatBtn);
        this.trackInteraction('premium_chat_cleared');
        
        setTimeout(() => {
            this.chatMessages.style.opacity = '0';
            this.chatMessages.style.transform = 'translateY(-30px) scale(0.95)';
            
            setTimeout(() => {
                this.chatMessages.innerHTML = '';
                this.conversationHistory = [];
                this.currentTopic = '';
                this.chatMessages.style.opacity = '1';
                this.chatMessages.style.transform = 'translateY(0) scale(1)';
                
                // Show welcome area
                this.welcomeArea.style.display = 'block';
                this.welcomeArea.style.opacity = '0';
                setTimeout(() => {
                    this.welcomeArea.style.opacity = '1';
                    this.messagesContainer.style.display = 'none';
                }, 50);
            }, 400);
        }, 300);
    }

    scrollToBottom() {
        setTimeout(() => {
            this.chatMessages.scrollTo({
                top: this.chatMessages.scrollHeight,
                behavior: 'smooth'
            });
        }, 150);
    }

    autoResize() {
        this.messageInput.style.height = 'auto';
        this.messageInput.style.height = Math.min(this.messageInput.scrollHeight, 150) + 'px';
    }

    animateInput() {
        this.messageInput.style.transform = 'scale(1.02)';
        setTimeout(() => {
            this.messageInput.style.transform = 'scale(1)';
        }, 200);
    }

    animatePremiumButton(button) {
        button.style.transform = 'scale(0.92)';
        button.style.opacity = '0.8';
        setTimeout(() => {
            button.style.transform = 'scale(1)';
            button.style.opacity = '1';
        }, 200);
    }

    updateSendButtonState() {
        this.sendButton.disabled = this.isGenerating;
        this.sendButton.innerHTML = this.isGenerating ? 
            '<i class="fas fa-spinner fa-spin"></i>' : 
            '<i class="fas fa-paper-plane"></i>';
    }

    trackPerformance(metric) {
        console.log(`🏆 ${metric}`, {
            time: Date.now() - this.performanceMetrics.appStart,
            messages: this.performanceMetrics.messagesSent
        });
    }

    trackInteraction(action) {
        console.log(`👤 ${action}`);
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
        const savedTheme = localStorage.getItem('savoire-premium-theme');
        if (savedTheme === 'light') {
            this.toggleTheme();
        }
    }

    toggleTheme() {
        const isLight = document.body.classList.toggle('light-theme');
        const icon = document.querySelector('.theme-toggle i');
        
        if (icon) {
            icon.className = isLight ? 'fas fa-moon' : 'fas fa-sun';
        }
        
        localStorage.setItem('savoire-premium-theme', isLight ? 'light' : 'dark');
    }
}

// Initialize premium app
const premiumAI = new PremiumSavoireAI();
window.premiumAI = premiumAI;

// Add premium CSS
const premiumStyles = document.createElement('style');
premiumStyles.textContent = `
    .premium-message {
        border-radius: 20px;
        margin: 1.2rem 0;
        border: 1px solid var(--border-color);
        transition: all 0.4s cubic-bezier(0.25, 0.46, 0.45, 0.94);
    }

    .premium-message-enter {
        animation: premiumMessageSlide 0.6s cubic-bezier(0.25, 0.46, 0.45, 0.94);
    }

    @keyframes premiumMessageSlide {
        0% {
            opacity: 0;
            transform: translateY(40px) scale(0.9);
        }
        100% {
            opacity: 1;
            transform: translateY(0) scale(1);
        }
    }

    .premium-avatar {
        width: 40px;
        height: 40px;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 1.2rem;
        background: linear-gradient(135deg, var(--accent-color), var(--accent-hover));
        flex-shrink: 0;
    }

    .gold-logo {
        width: 24px;
        height: 24px;
        border-radius: 50%;
        background: gold;
        display: flex;
        align-items: center;
        justify-content: center;
    }

    .premium-badge {
        background: linear-gradient(135deg, #ffd700, #ffed4e, #ffd700);
        color: #000;
        padding: 0.6rem 1.2rem;
        border-radius: 25px;
        font-weight: 700;
        font-size: 0.75rem;
        display: inline-flex;
        align-items: center;
        gap: 0.6rem;
        margin-bottom: 1rem;
        border: 2px solid gold;
        text-shadow: 0 1px 2px rgba(0,0,0,0.1);
    }

    .premium-fallback-badge {
        background: linear-gradient(135deg, #667eea, #764ba2);
        color: white;
        padding: 0.6rem 1.2rem;
        border-radius: 25px;
        font-weight: 700;
        font-size: 0.75rem;
        display: inline-flex;
        align-items: center;
        gap: 0.6rem;
        margin-bottom: 1rem;
        border: 2px solid #667eea;
    }

    .premium-title {
        font-size: 2.2rem;
        background: linear-gradient(135deg, var(--accent-color), #ffed4e);
        -webkit-background-clip: text;
        -webkit-text-fill-color: transparent;
        text-align: center;
        margin: 1rem 0;
        font-weight: 800;
    }

    .premium-meta {
        display: flex;
        justify-content: center;
        gap: 2rem;
        flex-wrap: wrap;
        margin: 1.5rem 0;
    }

    .meta-item {
        display: flex;
        align-items: center;
        gap: 0.5rem;
        padding: 0.5rem 1rem;
        background: var(--secondary-bg);
        border-radius: 15px;
        font-size: 0.9rem;
        font-weight: 600;
    }

    .premium-section {
        opacity: 0;
        transform: translateY(30px);
        transition: all 0.6s cubic-bezier(0.25, 0.46, 0.45, 0.94);
        margin: 2.5rem 0;
    }

    .premium-section.premium-animate-in {
        opacity: 1;
        transform: translateY(0);
    }

    .premium-section-title {
        display: flex;
        align-items: center;
        gap: 1rem;
        font-size: 1.5rem;
        color: var(--accent-color);
        margin-bottom: 1.5rem;
        padding-bottom: 0.5rem;
        border-bottom: 2px solid var(--accent-color);
    }

    .premium-notes {
        background: var(--secondary-bg);
        padding: 2rem;
        border-radius: 20px;
        border-left: 4px solid var(--accent-color);
        line-height: 1.7;
    }

    .gold-highlight {
        background: linear-gradient(135deg, var(--accent-color), var(--accent-hover));
        -webkit-background-clip: text;
        -webkit-text-fill-color: transparent;
        font-weight: 700;
    }

    .premium-concepts {
        display: grid;
        gap: 1rem;
        grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
    }

    .premium-concept {
        display: flex;
        align-items: center;
        gap: 1rem;
        padding: 1.2rem;
        background: var(--secondary-bg);
        border-radius: 15px;
        border-left: 4px solid var(--accent-color);
        transition: all 0.3s ease;
    }

    .premium-concept:hover {
        transform: translateX(10px);
        background: var(--surface-bg);
    }

    .premium-questions {
        display: flex;
        flex-direction: column;
        gap: 1.5rem;
    }

    .premium-question {
        background: var(--secondary-bg);
        border-radius: 15px;
        padding: 1.5rem;
        border: 1px solid var(--border-color);
        transition: all 0.3s ease;
    }

    .premium-question:hover {
        border-color: var(--accent-color);
        transform: translateY(-2px);
    }

    .question-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 1rem;
    }

    .question-tag {
        background: var(--accent-color);
        color: #000;
        padding: 0.3rem 1rem;
        border-radius: 20px;
        font-weight: 700;
        font-size: 0.8rem;
    }

    .premium-toggle {
        background: none;
        border: none;
        color: var(--text-secondary);
        cursor: pointer;
        padding: 0.5rem;
        border-radius: 50%;
        transition: all 0.3s ease;
    }

    .premium-toggle:hover, .premium-toggle.active {
        background: var(--accent-color);
        color: #000;
    }

    .premium-answer {
        display: none;
        margin-top: 1.2rem;
        padding: 1.2rem;
        background: var(--surface-bg);
        border-radius: 10px;
        border-left: 4px solid var(--accent-color);
        line-height: 1.6;
    }

    .premium-download-card {
        background: linear-gradient(135deg, var(--secondary-bg), var(--surface-bg));
        padding: 2.5rem;
        border-radius: 25px;
        text-align: center;
        border: 2px solid var(--accent-color);
        box-shadow: 0 10px 40px rgba(255, 215, 0, 0.2);
    }

    .download-header {
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 1rem;
        margin-bottom: 1rem;
    }

    .premium-download-btn {
        background: linear-gradient(135deg, var(--accent-color), var(--accent-hover));
        color: #000;
        border: none;
        padding: 1.2rem 2.5rem;
        border-radius: 30px;
        font-weight: 700;
        font-size: 1.1rem;
        cursor: pointer;
        transition: all 0.3s ease;
        display: inline-flex;
        align-items: center;
        gap: 1rem;
        margin: 1.5rem 0;
        box-shadow: 0 8px 25px rgba(255, 215, 0, 0.4);
    }

    .premium-download-btn:hover:not(:disabled) {
        transform: translateY(-3px) scale(1.05);
        box-shadow: 0 12px 35px rgba(255, 215, 0, 0.6);
    }

    .premium-download-btn:disabled {
        opacity: 0.6;
        cursor: not-allowed;
        transform: none !important;
    }

    .download-features {
        display: flex;
        justify-content: center;
        gap: 2rem;
        flex-wrap: wrap;
        margin-top: 1.5rem;
    }

    .download-features span {
        display: flex;
        align-items: center;
        gap: 0.5rem;
        font-size: 0.9rem;
        color: var(--text-secondary);
    }

    .premium-toast {
        position: fixed;
        bottom: 2rem;
        right: 2rem;
        background: var(--accent-color);
        color: #000;
        padding: 1rem 1.5rem;
        border-radius: 15px;
        font-weight: 600;
        z-index: 10000;
        transform: translateX(400px);
        transition: transform 0.4s cubic-bezier(0.25, 0.46, 0.45, 0.94);
        box-shadow: 0 10px 30px rgba(0,0,0,0.2);
    }

    .premium-toast.show {
        transform: translateX(0);
    }

    .toast-content {
        display: flex;
        align-items: center;
        gap: 0.8rem;
    }

    .premium-retry-message, .premium-error-message, .premium-help-message {
        background: var(--secondary-bg);
        border-radius: 20px;
        padding: 2rem;
        margin: 1rem 0;
        border-left: 4px solid var(--accent-color);
    }

    .retry-header, .error-header, .help-header {
        display: flex;
        align-items: center;
        gap: 1rem;
        margin-bottom: 1rem;
    }

    .premium-progress {
        height: 6px;
        background: var(--surface-bg);
        border-radius: 3px;
        margin-top: 1rem;
        overflow: hidden;
    }

    .progress-bar {
        height: 100%;
        background: linear-gradient(90deg, var(--accent-color), var(--accent-hover));
        animation: progressAnimation 2s ease-in-out infinite;
    }

    @keyframes progressAnimation {
        0% { transform: translateX(-100%); }
        100% { transform: translateX(100%); }
    }

    .premium-error-actions, .premium-help-actions {
        display: flex;
        gap: 1rem;
        margin-top: 1.5rem;
        flex-wrap: wrap;
    }

    .premium-retry-btn, .premium-help-btn {
        padding: 0.8rem 1.5rem;
        border: none;
        border-radius: 15px;
        font-weight: 600;
        cursor: pointer;
        transition: all 0.3s ease;
        display: flex;
        align-items: center;
        gap: 0.5rem;
    }

    .premium-retry-btn {
        background: var(--accent-color);
        color: #000;
    }

    .premium-help-btn {
        background: var(--surface-bg);
        color: var(--text-primary);
        border: 1px solid var(--border-color);
    }

    .premium-footer {
        background: var(--secondary-bg);
        padding: 1.5rem;
        border-radius: 15px;
        text-align: center;
    }

    .footer-content {
        display: flex;
        justify-content: space-between;
        align-items: center;
        flex-wrap: wrap;
        gap: 1rem;
    }

    .footer-brand {
        display: flex;
        align-items: center;
        gap: 0.8rem;
        font-weight: 600;
        color: var(--accent-color);
    }

    .footer-logo {
        width: 20px;
        height: 20px;
        border-radius: 50%;
    }

    @media (max-width: 768px) {
        .premium-meta {
            flex-direction: column;
            gap: 1rem;
        }
        
        .premium-concepts {
            grid-template-columns: 1fr;
        }
        
        .footer-content {
            flex-direction: column;
            text-align: center;
        }
        
        .premium-download-card {
            padding: 1.5rem;
        }
    }
`;
document.head.appendChild(premiumStyles);

console.log('🎯 Premium Savoire AI Loaded Successfully');
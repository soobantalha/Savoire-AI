// Savoiré AI - Premium Chat Experience
// Clean, cinematic, professional

class SavoirePremiumAI {
    constructor() {
        // Core state
        this.state = {
            isGenerating: false,
            isThinking: false,
            currentSession: null,
            conversation: [],
            sessions: [],
            selectedPDFType: 'summary',
            thinkingMessages: [
                "Processing your query...",
                "Analyzing deeply...",
                "Structuring response...",
                "Preparing insights...",
                "Crafting explanation..."
            ]
        };

        // DOM elements
        this.elements = {};
        
        // Initialize
        this.init();
    }

    init() {
        this.cacheElements();
        this.bindEvents();
        this.initParticles();
        this.loadSessions();
        this.setupInput();
        
        console.log('🎯 Savoiré AI Premium initialized');
    }

    cacheElements() {
        // Core UI
        this.elements.app = document.querySelector('.app-container');
        this.elements.welcomeScreen = document.getElementById('welcomeScreen');
        this.elements.messagesArea = document.getElementById('messagesArea');
        this.elements.messagesScroll = document.getElementById('messagesScroll');
        this.elements.thinkingIndicator = document.getElementById('thinkingIndicator');
        
        // Input
        this.elements.messageInput = document.getElementById('messageInput');
        this.elements.sendButton = document.getElementById('sendButton');
        
        // Modals
        this.elements.pdfModal = document.getElementById('pdfModal');
        this.elements.pdfModalClose = document.getElementById('pdfModalClose');
        this.elements.pdfCancel = document.getElementById('pdfCancel');
        this.elements.pdfGenerate = document.getElementById('pdfGenerate');
        
        // Buttons
        this.elements.themeToggle = document.getElementById('themeToggle');
        this.elements.newChatBtn = document.getElementById('newChatBtn');
        
        // Audio
        this.elements.sendSound = document.getElementById('sendSound');
        this.elements.typeSound = document.getElementById('typeSound');
    }

    bindEvents() {
        // Send message
        this.elements.sendButton.addEventListener('click', () => this.sendMessage());
        
        // Enter to send, Shift+Enter for new line
        this.elements.messageInput.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                this.sendMessage();
            }
        });
        
        // Auto-resize textarea
        this.elements.messageInput.addEventListener('input', () => {
            this.autoResize();
        });
        
        // Quick prompts
        document.querySelectorAll('.prompt-chip').forEach(chip => {
            chip.addEventListener('click', (e) => {
                const prompt = e.currentTarget.getAttribute('data-prompt');
                this.elements.messageInput.value = prompt;
                this.autoResize();
                this.focusInput();
            });
        });
        
        // Theme toggle
        this.elements.themeToggle.addEventListener('click', () => this.toggleTheme());
        
        // New chat
        this.elements.newChatBtn.addEventListener('click', () => this.newChat());
        
        // PDF modal
        this.elements.pdfModalClose.addEventListener('click', () => this.hidePDFModal());
        this.elements.pdfCancel.addEventListener('click', () => this.hidePDFModal());
        this.elements.pdfGenerate.addEventListener('click', () => this.generatePDF());
        
        // PDF options
        document.querySelectorAll('.pdf-option').forEach(option => {
            option.addEventListener('click', (e) => {
                document.querySelectorAll('.pdf-option').forEach(opt => {
                    opt.classList.remove('selected');
                });
                e.currentTarget.classList.add('selected');
                this.state.selectedPDFType = e.currentTarget.getAttribute('data-type');
            });
        });
    }

    initParticles() {
        const container = document.getElementById('particles');
        if (!container) return;
        
        const particles = [];
        const particleCount = 30;
        
        for (let i = 0; i < particleCount; i++) {
            const particle = document.createElement('div');
            particle.className = 'particle';
            
            // Random position and size
            const size = Math.random() * 3 + 1;
            particle.style.width = `${size}px`;
            particle.style.height = `${size}px`;
            particle.style.left = `${Math.random() * 100}%`;
            particle.style.top = `${Math.random() * 100}%`;
            
            // Random color (blue/purple spectrum)
            const hue = Math.floor(Math.random() * 60) + 220; // 220-280 (blue to purple)
            particle.style.backgroundColor = `hsla(${hue}, 70%, 70%, ${Math.random() * 0.2 + 0.1})`;
            
            // Animation
            particle.style.animation = `float ${Math.random() * 20 + 10}s linear infinite`;
            particle.style.animationDelay = `${Math.random() * 5}s`;
            
            container.appendChild(particle);
            particles.push(particle);
        }
        
        // Add CSS for particles
        const style = document.createElement('style');
        style.textContent = `
            .particle {
                position: absolute;
                border-radius: 50%;
                pointer-events: none;
                z-index: -1;
            }
            
            @keyframes float {
                0%, 100% {
                    transform: translate(0, 0) rotate(0deg);
                    opacity: 0.1;
                }
                25% {
                    transform: translate(${Math.random() * 100 - 50}px, ${Math.random() * 50 - 25}px) rotate(90deg);
                    opacity: 0.3;
                }
                50% {
                    transform: translate(${Math.random() * 100 - 50}px, ${Math.random() * 100 - 50}px) rotate(180deg);
                    opacity: 0.1;
                }
                75% {
                    transform: translate(${Math.random() * 50 - 25}px, ${Math.random() * 100 - 50}px) rotate(270deg);
                    opacity: 0.3;
                }
            }
        `;
        document.head.appendChild(style);
    }

    setupInput() {
        // Focus input on load
        setTimeout(() => {
            this.focusInput();
        }, 100);
        
        // Enable/disable send button based on input
        this.elements.messageInput.addEventListener('input', () => {
            this.elements.sendButton.disabled = !this.elements.messageInput.value.trim();
        });
    }

    async sendMessage() {
        const message = this.elements.messageInput.value.trim();
        if (!message || this.state.isGenerating) return;
        
        // Hide welcome screen if shown
        if (this.elements.welcomeScreen.style.display !== 'none') {
            this.elements.welcomeScreen.style.display = 'none';
            this.elements.messagesArea.style.display = 'block';
        }
        
        // Add user message
        this.addMessage(message, 'user');
        
        // Clear input
        this.clearInput();
        
        // Show thinking indicator
        this.showThinking();
        
        // Disable input
        this.state.isGenerating = true;
        this.elements.sendButton.disabled = true;
        
        // Play sound
        this.playSound('send');
        
        try {
            // Get AI response
            const response = await this.getAIResponse(message);
            
            // Hide thinking indicator
            this.hideThinking();
            
            // Show AI response with typing effect
            await this.showAIResponse(response);
            
            // Show PDF actions after completion
            this.showPDFActions();
            
        } catch (error) {
            this.hideThinking();
            this.showError(error.message);
        }
        
        // Re-enable input
        this.state.isGenerating = false;
        this.elements.sendButton.disabled = false;
        this.focusInput();
    }

    addMessage(content, type) {
        const messageId = `msg_${Date.now()}`;
        const messageDiv = document.createElement('div');
        messageDiv.className = `message ${type}`;
        messageDiv.id = messageId;
        
        const avatar = type === 'user' 
            ? '<div class="user-avatar">👤</div>'
            : '<div class="ai-avatar"><i class="fas fa-brain"></i></div>';
        
        const bubbleClass = type === 'user' ? 'user' : 'ai';
        
        messageDiv.innerHTML = `
            <div class="message-avatar">
                ${avatar}
            </div>
            <div class="message-content">
                <div class="message-bubble ${bubbleClass}">
                    <div class="message-text">${this.escapeHtml(content)}</div>
                </div>
            </div>
        `;
        
        this.elements.messagesScroll.appendChild(messageDiv);
        this.scrollToBottom();
        
        // Add to conversation history
        this.state.conversation.push({
            id: messageId,
            type: type,
            content: content,
            timestamp: new Date().toISOString()
        });
        
        return messageDiv;
    }

    async getAIResponse(message) {
        const response = await fetch('/api/study', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ 
                message: message,
                mode: 'premium',
                depth: 'deep'
            })
        });
        
        if (!response.ok) {
            throw new Error(`API error: ${response.status}`);
        }
        
        const data = await response.json();
        
        // Format the response for display
        return this.formatAIResponse(data);
    }

    formatAIResponse(data) {
        if (data.error) {
            return `<p><strong>Error:</strong> ${this.escapeHtml(data.error)}</p>`;
        }
        
        let html = '';
        
        // Topic header
        html += `<h2>${this.escapeHtml(data.topic)}</h2>`;
        
        // One-line intuition
        if (data.one_line_intuition) {
            html += `<div class="insight-box">
                <strong>🎯 Core Insight:</strong> ${this.escapeHtml(data.one_line_intuition)}
            </div>`;
        }
        
        // Mental model
        if (data.mental_model) {
            html += `<h3>🧠 Mental Model</h3>`;
            html += `<p><strong>Visualization:</strong> ${this.escapeHtml(data.mental_model.visualization)}</p>`;
            if (data.mental_model.analogy) {
                html += `<p><strong>Analogy:</strong> ${this.escapeHtml(data.mental_model.analogy)}</p>`;
            }
        }
        
        // Conceptual breakdown
        if (data.conceptual_breakdown && data.conceptual_breakdown.length > 0) {
            html += `<h3>📚 Key Concepts</h3>`;
            data.conceptual_breakdown.forEach((concept, i) => {
                html += `<div class="concept-block">
                    <h4>${i + 1}. ${this.escapeHtml(concept.concept)}</h4>
                    <p><strong>Intuition:</strong> ${this.escapeHtml(concept.intuition)}</p>
                    ${concept.common_confusion ? `<p><em>Common confusion:</em> ${this.escapeHtml(concept.common_confusion)}</p>` : ''}
                </div>`;
            });
        }
        
        // Detailed notes
        if (data.ultra_long_notes) {
            html += `<h3>📖 Detailed Analysis</h3>`;
            if (data.ultra_long_notes.core_explanation) {
                html += `<p>${this.formatTextWithMath(data.ultra_long_notes.core_explanation)}</p>`;
            }
            if (data.ultra_long_notes.step_by_step_reasoning) {
                html += `<div class="reasoning-box">
                    <strong>Step-by-step reasoning:</strong>
                    <p>${this.formatTextWithMath(data.ultra_long_notes.step_by_step_reasoning)}</p>
                </div>`;
            }
        }
        
        // Examples
        if (data.worked_examples && data.worked_examples.length > 0) {
            html += `<h3>🔍 Worked Examples</h3>`;
            data.worked_examples.forEach((example, i) => {
                html += `<div class="example-block">
                    <h4>Example ${i + 1}</h4>
                    <p><strong>Problem:</strong> ${this.escapeHtml(example.problem)}</p>
                    <p><strong>Solution:</strong> ${this.formatTextWithMath(example.solution_steps)}</p>
                    ${example.final_answer ? `<p><strong>Answer:</strong> ${this.escapeHtml(example.final_answer)}</p>` : ''}
                </div>`;
            });
        }
        
        // Key tricks
        if (data.key_tricks && data.key_tricks.length > 0) {
            html += `<h3>⚡ Key Tricks</h3>`;
            html += `<ul>`;
            data.key_tricks.forEach(trick => {
                html += `<li><strong>${this.escapeHtml(trick.trick)}</strong> - ${this.escapeHtml(trick.when_to_use)}</li>`;
            });
            html += `</ul>`;
        }
        
        // Exam focus
        if (data.exam_focus) {
            html += `<h3>🎯 Exam Focus</h3>`;
            if (data.exam_focus.how_examiners_trick_students) {
                html += `<div class="warning-box">
                    <strong>Common exam traps:</strong>
                    <ul>${data.exam_focus.how_examiners_trick_students.map(trick => 
                        `<li>${this.escapeHtml(trick)}</li>`
                    ).join('')}</ul>
                </div>`;
            }
        }
        
        // Footer
        html += `<div class="response-footer">
            <p><em>Generated by Savoiré AI • Confidence: ${data.confidence_score || 96}/100</em></p>
        </div>`;
        
        return html;
    }

    formatTextWithMath(text) {
        if (!text) return '';
        
        // Convert LaTeX math to MathJax format
        let formatted = this.escapeHtml(text);
        
        // Handle inline math: $...$
        formatted = formatted.replace(/\$(.*?)\$/g, '\\($1\\)');
        
        // Handle display math: $$...$$
        formatted = formatted.replace(/\$\$(.*?)\$\$/g, '\\[$1\\]');
        
        // Convert markdown-like formatting
        formatted = formatted.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
        formatted = formatted.replace(/\*(.*?)\*/g, '<em>$1</em>');
        formatted = formatted.replace(/`(.*?)`/g, '<code>$1</code>');
        
        // Convert newlines to breaks
        formatted = formatted.replace(/\n/g, '<br>');
        
        return formatted;
    }

    async showAIResponse(content) {
        // Create AI message container
        const messageDiv = this.addMessage('', 'ai');
        const textContainer = messageDiv.querySelector('.message-text');
        
        // Type out the response character by character
        const typingSpeed = 20; // ms per character
        let i = 0;
        
        // Show typing cursor
        textContainer.innerHTML = '<span class="typing-cursor"></span>';
        
        while (i < content.length) {
            // Add next character
            textContainer.innerHTML = content.substring(0, i + 1) + '<span class="typing-cursor"></span>';
            
            // Scroll to bottom
            this.scrollToBottom();
            
            // Play typing sound occasionally
            if (i % 30 === 0 && this.elements.typeSound) {
                this.elements.typeSound.currentTime = 0;
                this.elements.typeSound.play().catch(() => {});
            }
            
            i++;
            await this.sleep(typingSpeed);
        }
        
        // Remove typing cursor
        textContainer.innerHTML = content;
        
        // Render MathJax if available
        if (window.MathJax) {
            setTimeout(() => {
                MathJax.typesetPromise([textContainer]).catch(console.error);
            }, 100);
        }
        
        // Store formatted content for PDF generation
        messageDiv.dataset.formattedContent = content;
        
        return messageDiv;
    }

    showPDFActions() {
        // Find the last AI message
        const aiMessages = this.elements.messagesScroll.querySelectorAll('.message.ai');
        const lastAIMessage = aiMessages[aiMessages.length - 1];
        
        if (!lastAIMessage) return;
        
        // Create PDF actions container
        let actionsContainer = lastAIMessage.querySelector('.pdf-actions-container');
        
        if (!actionsContainer) {
            actionsContainer = document.createElement('div');
            actionsContainer.className = 'pdf-actions-container';
            
            actionsContainer.innerHTML = `
                <div class="pdf-action-buttons">
                    <button class="pdf-action-btn" data-type="summary">
                        <i class="fas fa-file-alt"></i>
                        Summary PDF
                    </button>
                    <button class="pdf-action-btn" data-type="full">
                        <i class="fas fa-book"></i>
                        Full Notes
                    </button>
                    <button class="pdf-action-btn" data-type="exam">
                        <i class="fas fa-graduation-cap"></i>
                        Exam Ready
                    </button>
                </div>
            `;
            
            lastAIMessage.querySelector('.message-content').appendChild(actionsContainer);
            
            // Bind PDF action buttons
            actionsContainer.querySelectorAll('.pdf-action-btn').forEach(btn => {
                btn.addEventListener('click', (e) => {
                    const type = e.currentTarget.getAttribute('data-type');
                    this.state.selectedPDFType = type;
                    this.showPDFModal(lastAIMessage);
                });
            });
        }
        
        // Show with animation
        setTimeout(() => {
            actionsContainer.classList.add('show');
        }, 100);
    }

    showPDFModal(messageElement) {
        this.elements.pdfModal.classList.add('show');
        this.currentPDFMessage = messageElement;
        
        // Select the corresponding PDF option
        document.querySelectorAll('.pdf-option').forEach(opt => {
            opt.classList.toggle('selected', 
                opt.getAttribute('data-type') === this.state.selectedPDFType);
        });
    }

    hidePDFModal() {
        this.elements.pdfModal.classList.remove('show');
        this.currentPDFMessage = null;
    }

    generatePDF() {
        if (!this.currentPDFMessage) return;
        
        const { jsPDF } = window.jspdf;
        const doc = new jsPDF();
        
        const content = this.currentPDFMessage.dataset.formattedContent || '';
        const topic = this.extractTopic(content) || 'Study Materials';
        const type = this.state.selectedPDFType;
        
        // Show loading
        this.showToast('Generating PDF...', 'info');
        
        // Generate based on type
        switch(type) {
            case 'summary':
                this.generateSummaryPDF(doc, topic, content);
                break;
            case 'exam':
                this.generateExamPDF(doc, topic, content);
                break;
            default:
                this.generateFullPDF(doc, topic, content);
        }
        
        // Save PDF
        const fileName = `SavoireAI_${type}_${this.sanitizeFilename(topic)}_${Date.now()}.pdf`;
        doc.save(fileName);
        
        this.showToast('PDF downloaded!', 'success');
        this.hidePDFModal();
    }

    generateSummaryPDF(doc, topic, content) {
        // Cover
        this.addPDFCover(doc, topic, 'Summary');
        
        // Content
        doc.addPage();
        doc.setFontSize(11);
        doc.setTextColor(0, 0, 0);
        
        const lines = doc.splitTextToSize(this.stripHTML(content), 180);
        doc.text(lines, 15, 20);
        
        // Footer
        this.addPDFFooter(doc, 1);
    }

    generateFullPDF(doc, topic, content) {
        this.addPDFCover(doc, topic, 'Complete Notes');
        
        let yPos = 40;
        let page = 1;
        
        const sections = this.extractSections(content);
        
        sections.forEach((section, index) => {
            if (yPos > 270) {
                doc.addPage();
                page++;
                yPos = 20;
                this.addPDFFooter(doc, page);
            }
            
            // Section header
            doc.setFontSize(12);
            doc.setFont(undefined, 'bold');
            doc.text(section.title, 15, yPos);
            yPos += 10;
            
            // Section content
            doc.setFontSize(10);
            doc.setFont(undefined, 'normal');
            const lines = doc.splitTextToSize(section.content, 180);
            doc.text(lines, 15, yPos);
            yPos += (lines.length * 6) + 15;
        });
    }

    generateExamPDF(doc, topic, content) {
        this.addPDFCover(doc, topic, 'Exam Preparation');
        
        doc.addPage();
        
        // Extract key points for exam
        const examContent = this.extractExamContent(content);
        
        doc.setFontSize(11);
        doc.setTextColor(0, 0, 0);
        
        const lines = doc.splitTextToSize(examContent, 180);
        doc.text(lines, 15, 20);
        
        this.addPDFFooter(doc, 1);
    }

    addPDFCover(doc, topic, subtitle) {
        // Background
        doc.setFillColor(10, 10, 20);
        doc.rect(0, 0, 210, 297, 'F');
        
        // Title
        doc.setFontSize(24);
        doc.setFont(undefined, 'bold');
        doc.setTextColor(99, 102, 241);
        doc.text('SAVOIRÉ AI', 105, 100, { align: 'center' });
        
        // Subtitle
        doc.setFontSize(14);
        doc.setTextColor(200, 200, 220);
        doc.text(subtitle, 105, 120, { align: 'center' });
        
        // Topic
        doc.setFontSize(20);
        doc.setTextColor(255, 255, 255);
        doc.text(topic, 105, 160, { align: 'center' });
        
        // Line
        doc.setDrawColor(99, 102, 241);
        doc.setLineWidth(1);
        doc.line(50, 170, 160, 170);
        
        // Branding
        doc.setFontSize(10);
        doc.setTextColor(150, 150, 170);
        doc.text('Generated by', 105, 250, { align: 'center' });
        
        doc.setFontSize(12);
        doc.setTextColor(99, 102, 241);
        doc.text('Sooban Talha Technologies', 105, 260, { align: 'center' });
        
        doc.setFontSize(8);
        doc.setTextColor(150, 150, 170);
        doc.text('https://soobantalhatech.xyz', 105, 270, { align: 'center' });
        
        doc.text(new Date().toLocaleDateString(), 105, 280, { align: 'center' });
    }

    addPDFFooter(doc, pageNumber) {
        doc.setFontSize(8);
        doc.setTextColor(100, 100, 100);
        
        // Page number
        doc.text(`Page ${pageNumber}`, 105, 290, { align: 'center' });
        
        // Branding
        doc.text('Savoiré AI • https://soobantalhatech.xyz', 105, 295, { align: 'center' });
    }

    extractTopic(content) {
        const match = content.match(/<h2>(.*?)<\/h2>/);
        return match ? this.stripHTML(match[1]) : 'Study Materials';
    }

    extractSections(content) {
        const sections = [];
        const html = document.createElement('div');
        html.innerHTML = content;
        
        // Extract headers and their content
        let currentSection = null;
        
        html.childNodes.forEach(node => {
            if (node.tagName && node.tagName.match(/^H[2-4]$/)) {
                if (currentSection) {
                    sections.push(currentSection);
                }
                currentSection = {
                    title: this.stripHTML(node.textContent),
                    content: ''
                };
            } else if (currentSection && node.textContent) {
                currentSection.content += this.stripHTML(node.textContent) + '\n';
            }
        });
        
        if (currentSection) {
            sections.push(currentSection);
        }
        
        return sections;
    }

    extractExamContent(content) {
        // Extract exam-relevant parts
        const examParts = [];
        const html = document.createElement('div');
        html.innerHTML = content;
        
        // Look for key sections
        const keywords = ['trick', 'exam', 'trap', 'pattern', 'common', 'mistake'];
        
        html.querySelectorAll('h3, h4, strong, em').forEach(el => {
            const text = el.textContent.toLowerCase();
            if (keywords.some(keyword => text.includes(keyword))) {
                examParts.push(el.textContent + ': ' + 
                    (el.nextSibling?.textContent || ''));
            }
        });
        
        return examParts.join('\n\n');
    }

    showThinking() {
        // Random thinking message
        const messages = this.state.thinkingMessages;
        const randomMsg = messages[Math.floor(Math.random() * messages.length)];
        
        this.elements.thinkingIndicator.querySelector('.thinking-text').textContent = randomMsg;
        this.elements.thinkingIndicator.style.display = 'flex';
        this.state.isThinking = true;
        
        this.scrollToBottom();
    }

    hideThinking() {
        this.elements.thinkingIndicator.style.display = 'none';
        this.state.isThinking = false;
    }

    showError(message) {
        const errorDiv = document.createElement('div');
        errorDiv.className = 'message ai';
        errorDiv.innerHTML = `
            <div class="message-avatar">
                <div class="ai-avatar"><i class="fas fa-exclamation-triangle"></i></div>
            </div>
            <div class="message-content">
                <div class="message-bubble ai">
                    <div class="message-text">
                        <p><strong>Error:</strong> ${this.escapeHtml(message)}</p>
                        <p>Please try again or check your connection.</p>
                        <button class="action-btn retry-btn">
                            <i class="fas fa-redo"></i> Retry
                        </button>
                    </div>
                </div>
            </div>
        `;
        
        this.elements.messagesScroll.appendChild(errorDiv);
        this.scrollToBottom();
        
        // Bind retry button
        const retryBtn = errorDiv.querySelector('.retry-btn');
        retryBtn.addEventListener('click', () => {
            const lastUserMessage = this.state.conversation
                .filter(msg => msg.type === 'user')
                .pop();
            if (lastUserMessage) {
                this.elements.messageInput.value = lastUserMessage.content;
                this.sendMessage();
            }
        });
    }

    showToast(message, type = 'info') {
        // Create toast
        const toast = document.createElement('div');
        toast.className = `toast toast-${type}`;
        toast.textContent = message;
        
        // Add to body
        document.body.appendChild(toast);
        
        // Remove after delay
        setTimeout(() => {
            toast.classList.add('fade-out');
            setTimeout(() => toast.remove(), 300);
        }, 3000);
        
        // Add CSS if not exists
        if (!document.querySelector('#toast-styles')) {
            const style = document.createElement('style');
            style.id = 'toast-styles';
            style.textContent = `
                .toast {
                    position: fixed;
                    bottom: 100px;
                    left: 50%;
                    transform: translateX(-50%);
                    background: var(--bg-card);
                    backdrop-filter: var(--glass-blur);
                    border: 1px solid var(--glass-border);
                    border-radius: var(--border-radius);
                    padding: 12px 20px;
                    color: var(--text-primary);
                    font-size: 14px;
                    font-weight: 500;
                    z-index: 1000;
                    animation: toastSlide 300ms ease;
                    box-shadow: var(--shadow-lg);
                }
                
                .toast-success {
                    border-left: 4px solid var(--success);
                }
                
                .toast-error {
                    border-left: 4px solid var(--error);
                }
                
                .toast-info {
                    border-left: 4px solid var(--info);
                }
                
                .toast.fade-out {
                    opacity: 0;
                    transform: translateX(-50%) translateY(10px);
                    transition: all 300ms ease;
                }
                
                @keyframes toastSlide {
                    from {
                        opacity: 0;
                        transform: translateX(-50%) translateY(20px);
                    }
                    to {
                        opacity: 1;
                        transform: translateX(-50%) translateY(0);
                    }
                }
            `;
            document.head.appendChild(style);
        }
    }

    autoResize() {
        const textarea = this.elements.messageInput;
        textarea.style.height = 'auto';
        textarea.style.height = Math.min(textarea.scrollHeight, 120) + 'px';
    }

    clearInput() {
        this.elements.messageInput.value = '';
        this.autoResize();
        this.elements.sendButton.disabled = true;
    }

    focusInput() {
        this.elements.messageInput.focus();
    }

    scrollToBottom() {
        setTimeout(() => {
            this.elements.messagesScroll.scrollTo({
                top: this.elements.messagesScroll.scrollHeight,
                behavior: 'smooth'
            });
        }, 100);
    }

    playSound(type) {
        try {
            const audio = this.elements[`${type}Sound`];
            if (audio) {
                audio.currentTime = 0;
                audio.volume = 0.3;
                audio.play().catch(() => {});
            }
        } catch (error) {
            // Silent fail
        }
    }

    toggleTheme() {
        const isDark = document.documentElement.classList.contains('dark-theme');
        
        if (isDark) {
            document.documentElement.classList.remove('dark-theme');
            document.documentElement.classList.add('light-theme');
            this.elements.themeToggle.innerHTML = '<i class="fas fa-sun"></i>';
            
            // Update CSS variables for light theme
            document.documentElement.style.setProperty('--bg-primary', '#ffffff');
            document.documentElement.style.setProperty('--bg-secondary', '#f8f9fa');
            document.documentElement.style.setProperty('--bg-surface', 'rgba(255, 255, 255, 0.7)');
            document.documentElement.style.setProperty('--bg-card', 'rgba(255, 255, 255, 0.9)');
            document.documentElement.style.setProperty('--text-primary', '#1a1a1a');
            document.documentElement.style.setProperty('--text-secondary', '#666666');
        } else {
            document.documentElement.classList.remove('light-theme');
            document.documentElement.classList.add('dark-theme');
            this.elements.themeToggle.innerHTML = '<i class="fas fa-moon"></i>';
            
            // Reset to dark theme variables
            document.documentElement.style.setProperty('--bg-primary', '#0a0a0f');
            document.documentElement.style.setProperty('--bg-secondary', '#0f0f1a');
            document.documentElement.style.setProperty('--bg-surface', 'rgba(20, 20, 35, 0.7)');
            document.documentElement.style.setProperty('--bg-card', 'rgba(25, 25, 40, 0.9)');
            document.documentElement.style.setProperty('--text-primary', '#ffffff');
            document.documentElement.style.setProperty('--text-secondary', '#a1a1aa');
        }
        
        this.playSound('send');
    }

    newChat() {
        if (this.state.conversation.length === 0) return;
        
        // Save current conversation
        this.saveSession();
        
        // Clear chat
        this.elements.messagesScroll.innerHTML = '';
        this.state.conversation = [];
        
        // Show welcome screen
        this.elements.welcomeScreen.style.display = 'block';
        this.elements.messagesArea.style.display = 'none';
        
        this.showToast('New chat started', 'info');
        this.playSound('send');
    }

    loadSessions() {
        try {
            const saved = localStorage.getItem('savoire_sessions');
            if (saved) {
                this.state.sessions = JSON.parse(saved);
            }
        } catch (error) {
            console.error('Error loading sessions:', error);
        }
    }

    saveSession() {
        if (this.state.conversation.length === 0) return;
        
        const session = {
            id: Date.now().toString(),
            title: this.state.conversation[0]?.content?.substring(0, 50) || 'New Session',
            conversation: this.state.conversation,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };
        
        this.state.sessions.unshift(session);
        
        // Keep only last 20 sessions
        this.state.sessions = this.state.sessions.slice(0, 20);
        
        try {
            localStorage.setItem('savoire_sessions', JSON.stringify(this.state.sessions));
        } catch (error) {
            console.error('Error saving session:', error);
        }
    }

    escapeHtml(text) {
        if (!text) return '';
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    stripHTML(html) {
        if (!html) return '';
        const div = document.createElement('div');
        div.innerHTML = html;
        return div.textContent || div.innerText || '';
    }

    sanitizeFilename(filename) {
        return filename.replace(/[^a-z0-9]/gi, '_').toLowerCase();
    }

    sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
}

// Initialize the app
const savoireAI = new SavoirePremiumAI();

// Make available globally
window.savoireAI = savoireAI;

// Additional CSS for dynamic elements
const additionalStyles = document.createElement('style');
additionalStyles.textContent = `
    .insight-box {
        background: rgba(99, 102, 241, 0.1);
        border: 1px solid rgba(99, 102, 241, 0.3);
        border-radius: 10px;
        padding: 16px;
        margin: 16px 0;
        color: var(--text-primary);
    }
    
    .concept-block {
        background: var(--bg-glass);
        border: 1px solid var(--glass-border);
        border-radius: 10px;
        padding: 16px;
        margin: 12px 0;
    }
    
    .concept-block h4 {
        color: var(--accent-primary);
        margin-bottom: 8px;
        font-size: 15px;
    }
    
    .reasoning-box {
        background: rgba(59, 130, 246, 0.1);
        border: 1px solid rgba(59, 130, 246, 0.3);
        border-radius: 10px;
        padding: 16px;
        margin: 16px 0;
    }
    
    .example-block {
        background: var(--bg-glass);
        border: 1px solid var(--glass-border);
        border-radius: 10px;
        padding: 16px;
        margin: 16px 0;
    }
    
    .example-block h4 {
        color: var(--accent-secondary);
        margin-bottom: 12px;
        font-size: 15px;
    }
    
    .warning-box {
        background: rgba(245, 158, 11, 0.1);
        border: 1px solid rgba(245, 158, 11, 0.3);
        border-radius: 10px;
        padding: 16px;
        margin: 16px 0;
    }
    
    .warning-box ul {
        margin: 8px 0 0 20px;
    }
    
    .response-footer {
        margin-top: 24px;
        padding-top: 16px;
        border-top: 1px solid var(--glass-border);
        color: var(--text-muted);
        font-size: 14px;
    }
    
    .retry-btn {
        margin-top: 12px;
    }
`;

document.head.appendChild(additionalStyles);

// Initialize MathJax configuration
window.MathJax = {
    tex: {
        inlineMath: [['\\(', '\\)']],
        displayMath: [['\\[', '\\]']],
        processEscapes: true,
        processEnvironments: true
    },
    options: {
        skipHtmlTags: ['script', 'noscript', 'style', 'textarea', 'pre', 'code'],
        ignoreHtmlClass: 'tex2jax_ignore',
        processHtmlClass: 'tex2jax_process'
    }
};
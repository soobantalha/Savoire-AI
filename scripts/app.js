// SAVOIRÉ AI - ULTIMATE STUDY PLATFORM
// Advanced AI Study Assistant with PDF Generation

class SavoireStudyAI {
    constructor() {
        // State Management
        this.state = {
            isGenerating: false,
            isTyping: false,
            currentSubject: null,
            conversation: [],
            sessions: [],
            selectedPDFType: 'summary',
            thinkingMessages: [
                "Analyzing your study request...",
                "Structuring comprehensive notes...",
                "Generating key concepts...",
                "Preparing examples...",
                "Compiling practice questions..."
            ]
        };

        // DOM Elements
        this.elements = {};
        
        // Typing Effect
        this.typingSpeed = 20; // ms per character
        this.typingQueue = [];
        
        // Initialize
        this.init();
    }

    init() {
        this.cacheElements();
        this.bindEvents();
        this.loadSessions();
        this.setupInput();
        this.setupMathJax();
        
        console.log('📚 Savoiré Study AI Initialized');
    }

    cacheElements() {
        // Core UI
        this.elements.welcomeScreen = document.getElementById('welcomeScreen');
        this.elements.studyChat = document.getElementById('studyChat');
        this.elements.messagesContainer = document.getElementById('messagesContainer');
        this.elements.thinkingIndicator = document.getElementById('thinkingIndicator');
        this.elements.studyActions = document.getElementById('studyActions');
        
        // Input
        this.elements.messageInput = document.getElementById('messageInput');
        this.elements.sendBtn = document.getElementById('sendBtn');
        
        // Buttons
        this.elements.newSession = document.getElementById('newSession');
        this.elements.themeToggle = document.getElementById('themeToggle');
        this.elements.clearChat = document.getElementById('clearChat');
        this.elements.exportSession = document.getElementById('exportSession');
        
        // PDF Modal
        this.elements.pdfModal = document.getElementById('pdfModal');
        this.elements.closeModal = document.getElementById('closeModal');
        this.elements.cancelPdf = document.getElementById('cancelPdf');
        this.elements.generatePdf = document.getElementById('generatePdf');
        this.elements.pdfOptions = document.querySelectorAll('.pdf-option');
        
        // Study Actions
        this.elements.actionButtons = document.querySelectorAll('.action-btn');
    }

    bindEvents() {
        // Send message
        this.elements.sendBtn.addEventListener('click', () => this.sendMessage());
        
        // Enter to send
        this.elements.messageInput.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                this.sendMessage();
            }
        });
        
        // Auto-resize textarea
        this.elements.messageInput.addEventListener('input', () => {
            this.autoResize();
            this.updateSendButton();
        });
        
        // New session
        this.elements.newSession.addEventListener('click', () => this.newSession());
        
        // Clear chat
        this.elements.clearChat.addEventListener('click', () => this.clearChat());
        
        // Export session
        this.elements.exportSession.addEventListener('click', () => this.exportSession());
        
        // Theme toggle
        this.elements.themeToggle.addEventListener('click', () => this.toggleTheme());
        
        // PDF Modal
        this.elements.closeModal.addEventListener('click', () => this.hideModal());
        this.elements.cancelPdf.addEventListener('click', () => this.hideModal());
        this.elements.generatePdf.addEventListener('click', () => this.generatePDF());
        
        // PDF options selection
        this.elements.pdfOptions.forEach(option => {
            option.addEventListener('click', (e) => {
                this.elements.pdfOptions.forEach(opt => opt.classList.remove('selected'));
                e.currentTarget.classList.add('selected');
                this.state.selectedPDFType = e.currentTarget.dataset.type;
            });
        });
        
        // Study action buttons
        this.elements.actionButtons.forEach(btn => {
            btn.addEventListener('click', (e) => {
                const action = e.currentTarget.dataset.action;
                this.handleStudyAction(action);
            });
        });
        
        // Voice button
        document.getElementById('voiceBtn')?.addEventListener('click', () => this.startVoiceInput());
    }

    setupInput() {
        this.elements.messageInput.focus();
        this.updateSendButton();
    }

    setupMathJax() {
        // MathJax is loaded via CDN, ensure it processes dynamic content
        if (window.MathJax) {
            MathJax.typesetPromise();
        }
    }

    async sendMessage() {
        const message = this.elements.messageInput.value.trim();
        if (!message || this.state.isGenerating) return;
        
        // Switch to chat view
        this.showChatView();
        
        // Add user message
        this.addMessage(message, 'user');
        
        // Clear input
        this.clearInput();
        
        // Show thinking indicator
        this.showThinking();
        
        // Disable input
        this.state.isGenerating = true;
        this.updateUIState();
        
        try {
            // Get AI response
            const response = await this.getStudyMaterials(message);
            
            // Hide thinking indicator
            this.hideThinking();
            
            // Show AI response with typing effect
            await this.showTypingResponse(response);
            
            // Show study actions
            this.showStudyActions();
            
            // Save session
            this.saveSession();
            
        } catch (error) {
            console.error('Error:', error);
            this.hideThinking();
            this.showError(error.message);
        }
        
        // Re-enable input
        this.state.isGenerating = false;
        this.updateUIState();
        this.elements.messageInput.focus();
    }

    showChatView() {
        if (this.elements.welcomeScreen.style.display !== 'none') {
            this.elements.welcomeScreen.style.display = 'none';
            this.elements.studyChat.style.display = 'flex';
        }
    }

    addMessage(content, type) {
        const messageId = `msg_${Date.now()}`;
        const messageDiv = document.createElement('div');
        messageDiv.className = `message ${type}`;
        messageDiv.id = messageId;
        
        const avatar = type === 'user' 
            ? '<div class="user-avatar"><i class="fas fa-user"></i></div>'
            : '<div class="ai-avatar"><i class="fas fa-graduation-cap"></i></div>';
        
        messageDiv.innerHTML = `
            <div class="message-avatar">
                ${avatar}
            </div>
            <div class="message-content">
                <div class="message-bubble">
                    <div class="message-text">${this.escapeHtml(content)}</div>
                </div>
            </div>
        `;
        
        this.elements.messagesContainer.appendChild(messageDiv);
        this.scrollToBottom();
        
        // Add to conversation
        this.state.conversation.push({
            id: messageId,
            type: type,
            content: content,
            timestamp: new Date().toISOString()
        });
        
        return messageDiv;
    }

    async getStudyMaterials(query) {
        console.log('📖 Fetching study materials for:', query);
        
        const response = await fetch('/api/study', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ 
                message: query,
                type: 'comprehensive',
                include_math: true,
                include_examples: true,
                include_questions: true
            })
        });
        
        if (!response.ok) {
            throw new Error(`API Error: ${response.status}`);
        }
        
        const data = await response.json();
        console.log('📚 Received study data:', data);
        
        // Format for display
        return this.formatStudyResponse(data);
    }

    formatStudyResponse(data) {
        if (data.error) {
            return `<p><strong>Error:</strong> ${this.escapeHtml(data.error)}</p>`;
        }
        
        let html = '';
        
        // Header
        html += `<h1>${this.escapeHtml(data.topic || 'Study Materials')}</h1>`;
        
        // Executive Summary
        if (data.executive_summary) {
            html += `<div class="summary-section">
                <h2><i class="fas fa-bolt"></i> Executive Summary</h2>
                <p>${this.formatText(data.executive_summary)}</p>
            </div>`;
        }
        
        // Key Concepts
        if (data.key_concepts && data.key_concepts.length > 0) {
            html += `<div class="concepts-section">
                <h2><i class="fas fa-star"></i> Key Concepts</h2>
                <ul>`;
            data.key_concepts.forEach(concept => {
                html += `<li>${this.formatText(concept)}</li>`;
            });
            html += `</ul></div>`;
        }
        
        // Detailed Explanation
        if (data.detailed_explanation) {
            html += `<div class="explanation-section">
                <h2><i class="fas fa-book-open"></i> Detailed Explanation</h2>
                ${this.formatText(data.detailed_explanation)}
            </div>`;
        }
        
        // Formulas and Equations
        if (data.formulas && data.formulas.length > 0) {
            html += `<div class="formulas-section">
                <h2><i class="fas fa-square-root-alt"></i> Key Formulas</h2>
                <div class="formula-grid">`;
            data.formulas.forEach(formula => {
                html += `<div class="formula-item">${this.formatText(formula)}</div>`;
            });
            html += `</div></div>`;
        }
        
        // Examples
        if (data.examples && data.examples.length > 0) {
            html += `<div class="examples-section">
                <h2><i class="fas fa-lightbulb"></i> Examples</h2>`;
            data.examples.forEach((example, index) => {
                html += `<div class="example-item">
                    <h3>Example ${index + 1}</h3>
                    <p><strong>Problem:</strong> ${this.formatText(example.problem)}</p>
                    <p><strong>Solution:</strong> ${this.formatText(example.solution)}</p>
                </div>`;
            });
            html += `</div>`;
        }
        
        // Practice Questions
        if (data.practice_questions && data.practice_questions.length > 0) {
            html += `<div class="questions-section">
                <h2><i class="fas fa-question-circle"></i> Practice Questions</h2>`;
            data.practice_questions.forEach((question, index) => {
                html += `<div class="question-item">
                    <h3>Q${index + 1}: ${this.formatText(question.question)}</h3>
                    ${question.hint ? `<p><em>Hint:</em> ${this.formatText(question.hint)}</p>` : ''}
                    <details>
                        <summary>Show Answer</summary>
                        <div class="answer">${this.formatText(question.answer)}</div>
                    </details>
                </div>`;
            });
            html += `</div>`;
        }
        
        // Common Mistakes
        if (data.common_mistakes && data.common_mistakes.length > 0) {
            html += `<div class="mistakes-section">
                <h2><i class="fas fa-exclamation-triangle"></i> Common Mistakes</h2>
                <ul>`;
            data.common_mistakes.forEach(mistake => {
                html += `<li>${this.formatText(mistake)}</li>`;
            });
            html += `</ul></div>`;
        }
        
        // Study Tips
        if (data.study_tips && data.study_tips.length > 0) {
            html += `<div class="tips-section">
                <h2><i class="fas fa-trophy"></i> Study Tips</h2>
                <ul>`;
            data.study_tips.forEach(tip => {
                html += `<li>${this.formatText(tip)}</li>`;
            });
            html += `</ul></div>`;
        }
        
        // Footer
        html += `<div class="study-footer">
            <p><em>Generated by Savoiré AI • Confidence: ${data.confidence_score || 95}/100</em></p>
        </div>`;
        
        return html;
    }

    formatText(text) {
        if (!text) return '';
        
        // Handle math expressions
        let formatted = this.escapeHtml(text);
        
        // Convert LaTeX inline math: $...$
        formatted = formatted.replace(/\$(.*?)\$/g, '\\($1\\)');
        
        // Convert LaTeX display math: $$...$$
        formatted = formatted.replace(/\$\$(.*?)\$\$/g, '\\[$1\\]');
        
        // Convert markdown-like formatting
        formatted = formatted.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
        formatted = formatted.replace(/\*(.*?)\*/g, '<em>$1</em>');
        formatted = formatted.replace(/`(.*?)`/g, '<code>$1</code>');
        
        // Convert newlines to breaks
        formatted = formatted.replace(/\n/g, '<br>');
        
        return formatted;
    }

    async showTypingResponse(content) {
        // Create AI message container
        const messageDiv = this.addMessage('', 'ai');
        const textContainer = messageDiv.querySelector('.message-text');
        
        // Store full content
        messageDiv.dataset.fullContent = content;
        
        // Type out the response
        this.state.isTyping = true;
        
        let i = 0;
        const speed = this.typingSpeed;
        
        // Show typing cursor
        textContainer.innerHTML = '<span class="typing-cursor"></span>';
        
        while (i < content.length && this.state.isTyping) {
            // Add next character
            textContainer.innerHTML = content.substring(0, i + 1) + '<span class="typing-cursor"></span>';
            
            // Scroll to bottom
            this.scrollToBottom();
            
            i++;
            await this.sleep(speed);
            
            // Speed up for long content after first 500 chars
            if (i > 500) {
                await this.sleep(speed / 2);
            }
        }
        
        // Remove typing cursor
        textContainer.innerHTML = content;
        this.state.isTyping = false;
        
        // Render MathJax
        if (window.MathJax) {
            setTimeout(() => {
                MathJax.typesetPromise([textContainer]).catch(console.error);
            }, 100);
        }
        
        return messageDiv;
    }

    showThinking() {
        const messages = this.state.thinkingMessages;
        const randomMsg = messages[Math.floor(Math.random() * messages.length)];
        
        const thinkingText = this.elements.thinkingIndicator.querySelector('.thinking-text');
        if (thinkingText) {
            thinkingText.textContent = randomMsg;
        }
        
        this.elements.thinkingIndicator.style.display = 'block';
        this.scrollToBottom();
    }

    hideThinking() {
        this.elements.thinkingIndicator.style.display = 'none';
    }

    showStudyActions() {
        this.elements.studyActions.style.display = 'block';
        this.scrollToBottom();
    }

    showError(message) {
        const errorDiv = document.createElement('div');
        errorDiv.className = 'message ai';
        errorDiv.innerHTML = `
            <div class="message-avatar">
                <div class="ai-avatar"><i class="fas fa-exclamation-triangle"></i></div>
            </div>
            <div class="message-content">
                <div class="message-bubble">
                    <div class="message-text">
                        <p><strong>Error:</strong> ${this.escapeHtml(message)}</p>
                        <p>Please try again or check your connection.</p>
                        <button class="action-btn" onclick="savoireStudy.retryLastMessage()">
                            <i class="fas fa-redo"></i> Retry
                        </button>
                    </div>
                </div>
            </div>
        `;
        
        this.elements.messagesContainer.appendChild(errorDiv);
        this.scrollToBottom();
    }

    retryLastMessage() {
        const lastUserMessage = this.state.conversation
            .filter(msg => msg.type === 'user')
            .pop();
        
        if (lastUserMessage) {
            this.elements.messageInput.value = lastUserMessage.content;
            this.sendMessage();
        }
    }

    handleStudyAction(action) {
        // Find last AI message
        const aiMessages = this.elements.messagesContainer.querySelectorAll('.message.ai');
        const lastAIMessage = aiMessages[aiMessages.length - 1];
        
        if (!lastAIMessage) return;
        
        this.state.selectedPDFType = action;
        this.showModal();
    }

    showModal() {
        this.elements.pdfModal.style.display = 'flex';
        
        // Select current PDF type
        this.elements.pdfOptions.forEach(opt => {
            opt.classList.toggle('selected', opt.dataset.type === this.state.selectedPDFType);
        });
    }

    hideModal() {
        this.elements.pdfModal.style.display = 'none';
    }

    async generatePDF() {
        // Find last AI message
        const aiMessages = this.elements.messagesContainer.querySelectorAll('.message.ai');
        const lastAIMessage = aiMessages[aiMessages.length - 1];
        
        if (!lastAIMessage) {
            this.showToast('No study materials to export', 'error');
            return;
        }
        
        const content = lastAIMessage.dataset.fullContent || lastAIMessage.querySelector('.message-text').innerHTML;
        const topic = this.extractTopic(content) || 'Study Materials';
        const type = this.state.selectedPDFType;
        
        // Show loading
        this.showToast('Generating PDF...', 'info');
        
        const { jsPDF } = window.jspdf;
        const doc = new jsPDF();
        
        // Generate cover
        this.generatePDFCover(doc, topic, type);
        
        // Add content based on type
        switch(type) {
            case 'summary':
                this.generateSummaryPDF(doc, content);
                break;
            case 'detailed':
                this.generateDetailedPDF(doc, content);
                break;
            case 'exam':
                this.generateExamPDF(doc, content);
                break;
            case 'cheatsheet':
                this.generateCheatsheetPDF(doc, content);
                break;
        }
        
        // Save PDF
        const filename = `Savoire_${type}_${this.sanitizeFilename(topic)}_${Date.now()}.pdf`;
        doc.save(filename);
        
        this.showToast('PDF downloaded successfully!', 'success');
        this.hideModal();
    }

    generatePDFCover(doc, topic, type) {
        // Black background
        doc.setFillColor(0, 0, 0);
        doc.rect(0, 0, 210, 297, 'F');
        
        // Title
        doc.setTextColor(255, 255, 255);
        doc.setFontSize(28);
        doc.setFont(undefined, 'bold');
        doc.text('SAVOIRÉ AI', 105, 80, { align: 'center' });
        
        // Subtitle
        doc.setFontSize(16);
        doc.text('Study Platform', 105, 100, { align: 'center' });
        
        // Topic
        doc.setFontSize(22);
        doc.setTextColor(59, 130, 246);
        doc.text(topic.toUpperCase(), 105, 140, { align: 'center' });
        
        // Type
        doc.setFontSize(14);
        doc.setTextColor(200, 200, 200);
        doc.text(`${type.charAt(0).toUpperCase() + type.slice(1)} Edition`, 105, 160, { align: 'center' });
        
        // Line
        doc.setDrawColor(59, 130, 246);
        doc.setLineWidth(1);
        doc.line(50, 170, 160, 170);
        
        // Branding
        doc.setFontSize(10);
        doc.setTextColor(150, 150, 150);
        doc.text('Generated by', 105, 220, { align: 'center' });
        
        doc.setFontSize(12);
        doc.setTextColor(59, 130, 246);
        doc.text('Sooban Talha Technologies', 105, 230, { align: 'center' });
        
        doc.setFontSize(8);
        doc.setTextColor(150, 150, 150);
        doc.text('https://soobantalhatech.xyz', 105, 240, { align: 'center' });
        
        // Date
        doc.text(new Date().toLocaleDateString(), 105, 250, { align: 'center' });
    }

    generateSummaryPDF(doc, content) {
        doc.addPage();
        doc.setFontSize(11);
        doc.setTextColor(0, 0, 0);
        
        // Extract summary sections
        const summary = this.extractSummary(content);
        const lines = doc.splitTextToSize(summary, 180);
        doc.text(lines, 15, 20);
        
        this.addPDFFooter(doc, 1);
    }

    generateDetailedPDF(doc, content) {
        let yPos = 20;
        let page = 1;
        
        // Split content into sections
        const sections = this.extractSections(content);
        
        sections.forEach((section, index) => {
            if (yPos > 270) {
                doc.addPage();
                page++;
                yPos = 20;
                this.addPDFFooter(doc, page);
            }
            
            // Section title
            doc.setFontSize(12);
            doc.setFont(undefined, 'bold');
            doc.text(section.title, 15, yPos);
            yPos += 8;
            
            // Section content
            doc.setFontSize(10);
            doc.setFont(undefined, 'normal');
            const lines = doc.splitTextToSize(section.content, 180);
            doc.text(lines, 15, yPos);
            yPos += (lines.length * 5) + 15;
        });
    }

    generateExamPDF(doc, content) {
        doc.addPage();
        
        // Extract questions and answers
        const examContent = this.extractExamContent(content);
        
        doc.setFontSize(11);
        doc.setTextColor(0, 0, 0);
        
        const lines = doc.splitTextToSize(examContent, 180);
        doc.text(lines, 15, 20);
        
        this.addPDFFooter(doc, 1);
    }

    generateCheatsheetPDF(doc, content) {
        doc.addPage();
        
        // Extract key points
        const cheatsheet = this.extractCheatsheet(content);
        
        // Two-column layout
        doc.setFontSize(9);
        doc.setTextColor(0, 0, 0);
        
        const columnWidth = 85;
        const leftMargin = 15;
        const rightMargin = 110;
        
        // Left column
        const leftLines = doc.splitTextToSize(cheatsheet.left, columnWidth);
        doc.text(leftLines, leftMargin, 20);
        
        // Right column
        const rightLines = doc.splitTextToSize(cheatsheet.right, columnWidth);
        doc.text(rightLines, rightMargin, 20);
        
        this.addPDFFooter(doc, 1);
    }

    addPDFFooter(doc, page) {
        doc.setFontSize(8);
        doc.setTextColor(100, 100, 100);
        doc.text(`Page ${page}`, 105, 290, { align: 'center' });
        doc.text('Savoiré AI • https://soobantalhatech.xyz', 105, 295, { align: 'center' });
    }

    extractTopic(content) {
        const match = content.match(/<h1>(.*?)<\/h1>/);
        return match ? this.stripHTML(match[1]) : 'Study Materials';
    }

    extractSummary(content) {
        // Extract first few sections for summary
        const div = document.createElement('div');
        div.innerHTML = content;
        
        const sections = [];
        let count = 0;
        
        div.childNodes.forEach(node => {
            if (count >= 3) return;
            if (node.textContent && node.textContent.trim().length > 50) {
                sections.push(this.stripHTML(node.textContent));
                count++;
            }
        });
        
        return sections.join('\n\n');
    }

    extractSections(content) {
        const sections = [];
        const div = document.createElement('div');
        div.innerHTML = content;
        
        let currentSection = null;
        
        div.childNodes.forEach(node => {
            if (node.tagName && node.tagName.match(/^H[1-3]$/)) {
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
        const examParts = [];
        const div = document.createElement('div');
        div.innerHTML = content;
        
        // Look for questions and answers
        div.querySelectorAll('h3, strong').forEach(el => {
            const text = el.textContent.toLowerCase();
            if (text.includes('question') || text.includes('q:') || text.includes('problem')) {
                let question = el.textContent;
                let answer = '';
                
                // Try to find answer
                let next = el.nextElementSibling;
                while (next && !next.textContent.toLowerCase().includes('answer')) {
                    next = next.nextElementSibling;
                }
                if (next) {
                    answer = next.textContent;
                }
                
                examParts.push(`${question}\n${answer}\n\n`);
            }
        });
        
        return examParts.join('\n');
    }

    extractCheatsheet(content) {
        const div = document.createElement('div');
        div.innerHTML = content;
        
        const allText = this.stripHTML(content);
        const mid = Math.floor(allText.length / 2);
        
        return {
            left: allText.substring(0, mid),
            right: allText.substring(mid)
        };
    }

    newSession() {
        if (this.state.conversation.length === 0) return;
        
        // Save current session
        this.saveSession();
        
        // Clear UI
        this.elements.messagesContainer.innerHTML = '';
        this.elements.studyActions.style.display = 'none';
        this.state.conversation = [];
        
        // Show welcome screen
        this.elements.welcomeScreen.style.display = 'block';
        this.elements.studyChat.style.display = 'none';
        
        this.showToast('New session started', 'info');
    }

    clearChat() {
        if (this.state.conversation.length === 0) return;
        
        this.elements.messagesContainer.innerHTML = '';
        this.elements.studyActions.style.display = 'none';
        this.state.conversation = [];
        
        this.showToast('Chat cleared', 'info');
    }

    exportSession() {
        const sessionData = {
            platform: 'Savoiré AI',
            version: '2.0',
            exported: new Date().toISOString(),
            conversation: this.state.conversation,
            stats: {
                total_messages: this.state.conversation.length,
                ai_messages: this.state.conversation.filter(m => m.type === 'ai').length,
                user_messages: this.state.conversation.filter(m => m.type === 'user').length
            },
            brand: 'Sooban Talha Technologies',
            website: 'https://soobantalhatech.xyz'
        };
        
        const dataStr = JSON.stringify(sessionData, null, 2);
        const dataUri = 'data:application/json;charset=utf-8,' + encodeURIComponent(dataStr);
        
        const link = document.createElement('a');
        link.setAttribute('href', dataUri);
        link.setAttribute('download', `savoire_session_${Date.now()}.json`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        this.showToast('Session exported', 'success');
    }

    toggleTheme() {
        const isDark = document.documentElement.classList.contains('cyber-study');
        
        if (isDark) {
            document.documentElement.classList.remove('cyber-study');
            document-study');
            document.documentElement.classList.add('light-study');
            this.elements.themeToggle.innerHTML = '<i class="fas fa-sun"></i>';
            
           .documentElement.classList.add('light-study');
            this.elements.themeToggle.innerHTML = '<i class="fas fa-sun"></i>';
            
            // Light theme variables
            // Light theme variables
            document.documentElement.style.set document.documentElement.style.setProperty('Property('--bg-primary', '#ffffff--bg-primary', '#ffffff');
            document.documentElement');
            document.documentElement.style.set.style.setProperty('--bgProperty('--bg-secondary', '#f-secondary', '#f8f9fa8f9fa');
            document.d');
            document.documentElement.style.setProperty('--bgocumentElement.style.setProperty('--bg-surface',-surface', 'rgba( 'rgba(255, 255, 255, 255, 255, 0.8)');
255, 0.8)');
            document            document.documentElement.style.documentElement.style.setProperty('--text-primary.setProperty('--text-primary', '#1a1a1a', '#1a1a1a');
           ');
            document.documentElement document.documentElement.style.setProperty('--text.style.setProperty('--text-secondary', '#666666');
       -secondary', '#666666');
        } else {
 } else {
            document.document            document.documentElement.classList.remove('light-studyElement.classList.remove('light-study');
            document.documentElement');
            document.documentElement.classList.add.classList.add('cyber-study');
           ('cyber-study');
            this.e this.elements.themeToggle.innerHTML = '<i class="lements.themeToggle.innerHTML = '<i class="fas fafas fa-moon"></i>';
-moon"></i>';
            
            // Reset to            
            // Reset to dark theme dark theme

            document.documentElement.style.setProperty('--bg-primary', '#0a0a            document.documentElement.style.setProperty('--bg-primary', '#0a0a0a');
            document.document0a');
            document.documentElement.style.setProperty('--bg-secondary', '#Element.style.setProperty('--bg-secondary', '#111111');
            document.document111111');
            document.documentElement.style.setProperty('--bg-surface',Element.style.setProperty('--bg-surface', 'rgba(30 'rgba(30, 30, 30,, 30, 30, 0. 0.8)');
            document.documentElement.style.set8)');
            document.documentElement.style.setProperty('--text-primary', '#Property('--text-primary', '#ffffff');
            document.documentElement.style.setProperty('--textffffff');
            document.documentElement.style.setProperty('--text-secondary', '#d4d4-secondary', '#d4d4d8d8');
        }
   ');
        }
    }

    startVoiceInput() }

    startVoiceInput() {
        if (!('webkitSpeech {
        if (!('webkitSpeechRecognitionRecognition' in' in window)) {
            this.showToast(' window)) {
            this.showToast('Voice input not supported', 'error');
            return;
        }
        
        const recognition = new webkitSpeechRecognition();
       Voice input not supported', 'error');
            return;
        }
        
        const recognition = new webkitSpeechRecognition();
        recognition.continuous = false;
 recognition.continuous = false;
        recognition.interimResults = false;
        recognition.interimResults = false;
        
               
        recognition.onstart = recognition.onstart = () => () => {
            this.show {
            this.showToast('Listening...', 'Toast('Listening...', 'info');
info');
        };
        };
        
        recognition.onresult = (event) =>        
        recognition.onresult = (event) => {
            const {
            const transcript = event.res transcript = event.results[0][0].ults[0][0].transcript;
            this.elementstranscript;
            this.elements.messageInput.value.messageInput.value = transcript;
 = transcript;
            this.autoResize            this.autoResize();
            this.updateSendButton();
       ();
            this.updateSendButton();
        };
        
 };
        
        recognition.onerror        recognition.onerror = (event) => {
            this.showToast('Voice recognition = (event) => {
            this.showToast('Voice recognition error', 'error');
        error', 'error');
        };
        
        recognition.start();
    }

    loadSessions };
        
        recognition.start();
    }

    loadSessions() {
        try {
            const saved() {
        try {
            const saved = localStorage.getItem('sav = localStorage.getItem('savoire_sessions');
oire_sessions');
            if (saved) {
                           if (saved) {
                this.state.sessions = JSON this.state.sessions = JSON.parse(saved);
            }
        } catch.parse(saved);
            }
        } catch (error (error) {
            console) {
            console.error('Error loading sessions:',.error('Error loading sessions:', error);
        }
    }

    error);
        }
    }

    saveSession() {
        saveSession() {
        if (this.state if (this.state.conversation.length.conversation.length === 0) return;
        
 === 0) return;
        
        const session = {
            id: Date        const session = {
            id: Date.now().toString(),
            title: this.state.con.now().toString(),
            title: this.state.conversversation[0]?.ation[0]?.content?.substring(0,content?.substring(0, 50) || 'Study Session',
            50) || 'Study Session',
            conversation: this.state.conversation conversation: this.state.conversation,
            createdAt,
            createdAt: new Date().toISO: new Date().toISOString(),
            updatedAt: new DateString(),
            updatedAt: new Date().to().toISOString()
        };
        
        this.state.sISOString()
        };
        
        this.state.sessions.unshift(session);
        this.state.sessions = this.stateessions.unshift(session);
        this.state.sessions = this.state.sessions.slice(.sessions.slice(0, 0, 20); // Keep20); // Keep last 20
        
        try last 20
        
        try {
            localStorage.setItem('savoire_sessions', JSON.stringify(this.state.sessions));
        } catch (error) {
            console.error('Error saving session:', error);
        }
    }

 {
            localStorage.setItem('savoire_sessions', JSON.stringify(this.state.sessions));
        } catch (error) {
            console.error('Error saving session:', error);
        }
    }

    auto    autoResize() {
        constResize() {
        const textarea = this.elements textarea = this.elements.messageInput;
        textarea.messageInput;
        textarea.style.height.style.height = 'auto';
        textarea.style.height = = 'auto';
        textarea.style.height = Math.min Math.min(textarea.scrollHeight,(textarea.scrollHeight, 120) + 120) + 'px 'px';
    }

    clearInput';
    }

    clearInput() {
        this.elements.messageInput() {
        this.elements.messageInput.value =.value = '';
        this.autoResize();
        this '';
        this.autoResize();
        this.updateSend.updateSendButton();
    }

Button();
    }

    updateSendButton() {
        const hasText = this.elements    updateSendButton() {
        const hasText = this.elements.messageInput.value.trim().length.messageInput.value.trim().length > 0;
        this > 0;
        this.elements.sendBtn.disabled = !.elements.sendBtn.disabled = !hasTexthasText || this || this.state.isGenerating;
    }

   .state.isGenerating;
    }

    updateUIState() {
        this updateUIState() {
        this.elements.message.elements.messageInput.disabledInput.disabled = this.state.isGenerating;
 = this.state.isGenerating;
        this.elements.sendBtn        this.elements.sendBtn.disabled.disabled = this.state.is = this.state.isGenerating || !Generating || !this.elements.messagethis.elements.messageInput.value.trim();
    }

Input.value.trim();
    }

    scroll    scrollToBottom() {
       ToBottom() {
        setTimeout(() => {
            this.elements setTimeout(() => {
            this.elements.messagesContainer.scrollTop =.messagesContainer.scrollTop = this.elements.messagesContainer.scroll this.elements.messagesContainer.scrollHeight;
        }, 100);
    }

    showToast(message, type = 'info') {
        //Height;
        }, 100);
    }

    showToast(message, type = 'info') {
        // Create toast element
        const Create toast element
        const toast = document.createElement toast = document.createElement('div('div');
        toast.className');
        toast.className = `toast toast-${type}` = `toast toast-${type}`;
        toast.textContent = message;
        
        // Add;
        toast.textContent = message;
        
        // Add to page
        document.body.appendChild to page
        document.body.appendChild(toast);
(toast);
        
        //        
        // Remove after delay Remove after delay
        setTimeout(() => {
            toast.classList
        setTimeout(() => {
            toast.classList.add.add('fade-out');
('fade-out');
            setTimeout(() => toast.remove(), 300);
        }, 300            setTimeout(() => toast.remove(), 300);
        }, 3000);
        
        // Add0);
        
        // Add CSS if needed
        if (!document.querySelector('#to CSS if needed
        if (!document.querySelector('#toast-styles')) {
            const styleast-styles')) {
            const style = document.createElement('style = document.createElement('style');
            style.id = 'toast');
            style.id = 'toast-styles';
            style.textContent = `
                .toast-styles';
            style.textContent = `
                .toast {
                    position: fixed;
                    bottom: 100px;
                    left: 50%;
                    transform: translateX(-50%);
                    background: var(-- {
                    position: fixed;
                    bottom: 100px;
                    left: 50%;
                    transform: translateX(-50%);
                    background: var(--bg-card);
bg-card);
                    backdrop-filter: var(--glass-blur);
                    backdrop-filter: var(--glass-blur);
                    border: 1px                    border: 1px solid var(--glass-border);
                    border-radius: var(--border-radius solid var(--glass-border);
                    border-radius: var(--border-radius);
                    padding: 12);
                    padding: 12px 20px 20px;
                   px;
                    color: var(-- color: var(--text-primary);
                    font-size: 14pxtext-primary);
                    font-size: 14px;
                   ;
                    font-weight:  font-weight: 500;
                    z-index:500;
                    z-index: 1000;
                    box-shadow 1000;
                    box-shadow: var(--: var(--shadow-lg);
                    animation: toastSlideshadow-lg);
                    animation: toastSlide 0.3s ease;
 0.3s ease;
                               }
                
                .toast }
                
                .toast-success {
                    border-left: 4-success {
                    border-left: 4px solidpx solid var(--accent-success);
                }
                
                . var(--accent-success);
                }
                
                .toasttoast-error-error {
                    border-left: 4px {
                    border-left: 4px solid var(--error);
                }
                
 solid var(--error);
                }
                
                .toast-info {
                    border-left: 4px solid var(--accent-info);
                .toast-info {
                    border-left: 4px solid var(--accent-info);
                }
                
                .toast.fade-out {
                }
                
                .toast.fade-out {
                    opacity: 0;
                    transform: translateX(-50%) translate                    opacity: 0;
                    transform: translateX(-50%) translateY(10px);
                    transition: all 0.3s ease;
                }
                
Y(10px);
                    transition: all 0.3s ease;
                }
                
                @keyframes                @keyframes toastSlide {
                    from {
                        opacity: toastSlide {
                    from {
                        opacity: 0;
                        transform 0;
                        transform: translateX(-50%) translateY(: translateX(-50%) translateY(20px);
                    }
                    to {
                        opacity: 20px);
                    }
                    to {
                        opacity: 1;
                        transform: translate1;
                        transform: translateX(-50%) translateY(0);
                    }
                }
           X(-50%) translateY(0);
                    }
                }
            `;
            document.head.appendChild( `;
            document.head.appendChild(stylestyle);
        }
   );
        }
    }

    escapeHtml(text) {
        }

    escapeHtml(text) {
        if (!text) return '';
 if (!text) return '';
        const div =        const div = document.createElement(' document.createElement('div');
        div.textContent =div');
        div.textContent = text;
        return div.innerHTML text;
        return div.innerHTML;
    }

;
    }

    stripHTML    stripHTML(html) {
        if(html) {
        if (!html) return '';
        const div (!html) return '';
        const div = document.createElement('div');
        div.innerHTML = html;
 = document.createElement('div');
        div.innerHTML = html;
        return div.textContent || div        return div.textContent || div.innerText || '';
    }

    sanitizeFilename(filename) {
.innerText || '';
    }

    sanitizeFilename(filename) {
        return filename.replace(/        return filename.replace(/[^a-z0[^a-z0-9]/-9]/gi, '_').toLowerCasegi, '_').toLowerCase();
    }

    sleep(ms();
    }

    sleep(ms) {
) {
        return new Promise(resolve => setTimeout(resolve,        return new Promise(resolve => setTimeout(resolve, ms));
    }
}

// Initialize ms));
    }
}

// Initialize the platform
const the platform
const savoire savoireStudy = new SavoireStudyStudy = new SavoireStudyAI();
window.savoireStudyAI();
window.savoireStudy = savoire = savoireStudy;

// Additional CSS for study features
const studyStyles = document.createElement('style');
studyStyles.textContent = `
    .summary-section,
    .concepts-section,
Study;

// Additional CSS for study features
const studyStyles = document.createElement('style');
studyStyles.textContent = `
    .summary-section,
    .concepts-section,
    .expl    .explanation-section,
    .formanation-section,
    .formulas-section,
    .ulas-section,
    .examples-section,
    .questions-sectionexamples-section,
    .questions-section,
    .mistakes-section,
    .,
    .mistakes-section,
    .tips-section {
        margin: 2rem 0;
        padding:tips-section {
        margin: 2rem 0;
        padding:  1.5rem;
        background:1.5rem;
        background: var(--bg-glass);
        var(--bg-glass);
        border: 1px solid var(--glass-border border: 1px solid var(--glass-border);
);
        border-radius: var        border-radius: var(--border-radius);
   (--border-radius);
    }
    
 }
    
    .summary-section    .summary-section h2,
    .concepts-section h2,
    .concepts-section h2,
    h2,
    .explanation-section h2,
    .form .explanation-section h2,
    .formulas-sectionulas-section h2,
    h2,
    .examples-section .examples-section h2,
    .questions-section h2,
 h2,
    .questions-section h2,
       .mistakes-section h2 .mistakes-section h2,
   ,
    .tips-section h .tips-section h2 {
2 {
        color: var(--accent-primary);
        margin        color: var(--accent-primary);
        margin-bottom-bottom: 1rem;
       : 1rem;
        display: flex;
 display: flex;
        align-items: center;
        gap:        align-items: center;
        gap:  0.75rem;
   0.75rem;
    }
    
 }
    
    .formula-grid {
        display: grid    .formula-grid {
        display: grid;
       ;
        grid-template-columns grid-template-columns: repeat(auto-fit, min: repeat(auto-fit, minmax(200px, 1frmax(200px, 1fr));
        gap:));
        gap: 1rem;
        margin-top: 1rem;
        margin-top:  1rem;
    }
    
   1rem;
    }
    
    .form .formula-item {
        padding: 1rem;
ula-item {
        padding: 1rem;
        background        background: rgba(0: rgba(0, 0, 0, 0.2);
        border, 0, 0, 0.2);
        border-radius: 8px;
-radius: 8px;
        border-left:        border-left: 4px 4px solid var(--accent solid var(--accent-primary);
        font-family: 'Mon-primary);
        font-family: 'Monaco', 'Menaco', 'Menlo', monospace;
        font-size:lo', monospace;
        font-size:  0.9rem;
   0.9rem;
    }
    
    }
    
    .example-item .example-item {
        margin {
        margin: 1.5rem 0;
: 1.5rem 0;
        padding: 1.5        padding: 1.5rem;
        background: rgba(59, rem;
        background: rgba(59, 130,130, 246,  246, 0.1);
        border-radius0.1);
        border-radius: : 8px;
        border: 1px solid rgba(8px;
        border: 1px solid rgba(59, 130, 246, 0.3);
    }
    
    .example59, 130, 246, 0.3);
    }
    
    .example-item-item h3 {
        color: var(--accent-primary);
        margin-bottom h3 {
        color: var(--accent-primary);
        margin-bottom: 1rem: 1rem;
    }
    
;
    }
    
    .question-item    .question-item {
        margin: {
        margin: 1.5rem 0;
        1.5rem 0;
        padding padding: 1.5rem: 1.5rem;
        background: var(--bg-glass;
        background: var(--bg-glass);
        border: 1px solid var(--glass);
        border: 1px solid var(--glass-border);
        border-border);
        border-radius: -radius: 8px;
    }
    
8px;
    }
    
    .question-item h3 {
    .question-item h3 {
        color: var(--text-primary);
        margin-bottom: 1rem;
    }
    
    details {
        margin-top: 1rem;
        background: rgba(0, 0        color: var(--text-primary);
        margin-bottom: 1rem;
    }
    
    details {
        margin-top: 1rem;
        background: rgba(0, 0, 0, 0, 0, 0.2);
        border-radius: 8px;
        padding:.2);
        border-radius: 8px;
        padding: 1rem;
    }
 1rem;
    }
    
    summary {
    
    summary {
        cursor: pointer;
        color: var(--        cursor: pointer;
        color: var(--accent-primary);
        fontaccent-primary);
        font-weight: 500-weight: 500;
       ;
        padding: 0. padding: 0.5rem;
    }
    
   5rem;
    }
    
    .answer {
        margin .answer {
        margin-top: 1rem;
        padding-top: 1rem;
        border-top: 1px solid var(--glass-border);
-top: 1rem;
        padding-top: 1rem;
        border-top: 1px solid var(--glass-border);
               color: var(--text-secondary);
    }
 color: var(--text-secondary);
    }
    
    .study-footer {
        margin-top: 2rem;
        padding    
    .study-footer {
        margin-top: 2rem;
        padding-top: 1.5-top: 1.5rem;
        border-top: 1px solid var(--glass-borderrem;
        border-top: 1px solid var(--glass-border);
        color: var(--);
        color: var(--text-muted);
text-muted);
        font        font-size: 0.-size: 0.9rem9rem;
        text-align: center;
        text-align: center;
   ;
    }
    
    .typing-cursor {
        display: inline-block;
        width: 2px;
        height: 1.2em;
        background }
    
    .typing-cursor {
        display: inline-block;
        width: 2px;
        height: 1.2em;
        background: var(--ac: var(--accent-primary);
        margin-left: 2px;
        animationcent-primary);
        margin-left: 2px;
        animation:: blink 1s infinite blink 1s infinite;
        vertical-align: middle;
    }
    
    @;
        vertical-align: middle;
    }
    
    @keyframes blink {
        0%,keyframes blink {
        0%, 100% { opacity 100% { opacity: 1; }
        50% { opacity: 0; }
    }
`;

document.head.appendChild: 1; }
        50% { opacity: 0; }
    }
`;

document.head.appendChild(studyStyles);
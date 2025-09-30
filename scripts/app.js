// ULTRA-ADVANCED AI STUDY ASSISTANT
class SavoireAI {
    constructor() {
        this.initializeApp();
        this.bindEvents();
        this.initializeParticles();
    }

    initializeApp() {
        this.chatMessages = document.getElementById('chatMessages');
        this.messageInput = document.getElementById('messageInput');
        this.sendButton = document.getElementById('sendButton');
        this.welcomeScreen = document.getElementById('welcomeScreen');
        this.loadingIndicator = document.getElementById('loadingIndicator');
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

        // Quick prompt cards
        document.querySelectorAll('.prompt-card').forEach(card => {
            card.addEventListener('click', () => {
                const prompt = card.getAttribute('data-prompt');
                this.messageInput.value = prompt;
                this.sendMessage();
            });
        });

        // Theme toggle
        document.querySelector('.theme-toggle').addEventListener('click', () => this.toggleTheme());
    }

    initializeParticles() {
        const particlesContainer = document.createElement('div');
        particlesContainer.className = 'quantum-particles';
        document.body.appendChild(particlesContainer);

        for (let i = 0; i < 50; i++) {
            this.createParticle(particlesContainer);
        }
    }

    createParticle(container) {
        const particle = document.createElement('div');
        particle.className = 'quantum-particle';

        const size = Math.random() * 6 + 2;
        const posX = Math.random() * 100;
        const posY = Math.random() * 100;
        const duration = Math.random() * 20 + 10;
        const delay = Math.random() * 5;

        particle.style.cssText = `
            position: fixed;
            width: ${size}px;
            height: ${size}px;
            background: radial-gradient(circle, 
                rgba(59, 130, 246, 0.8), 
                rgba(139, 92, 246, 0.4),
                transparent 70%);
            border-radius: 50%;
            left: ${posX}%;
            top: ${posY}%;
            animation: quantumFloat ${duration}s infinite ease-in-out ${delay}s;
            pointer-events: none;
            z-index: -1;
            filter: blur(1px);
        `;

        container.appendChild(particle);
    }

    autoResize() {
        this.messageInput.style.height = 'auto';
        this.messageInput.style.height = Math.min(this.messageInput.scrollHeight, 120) + 'px';
    }

    async sendMessage() {
        const message = this.messageInput.value.trim();
        if (!message || this.isGenerating) return;

        // Hide welcome screen
        this.welcomeScreen.style.display = 'none';
        this.chatMessages.style.display = 'block';

        // Add user message
        this.addMessage(message, 'user');

        // Clear input
        this.messageInput.value = '';
        this.autoResize();

        // Show loading
        this.showLoading();

        this.isGenerating = true;
        this.sendButton.disabled = true;

        try {
            const studyData = await this.generateStudyMaterials(message);
            this.hideLoading();
            this.displayStudyMaterials(studyData);
        } catch (error) {
            this.hideLoading();
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
        
        const avatar = type === 'user' ? '👤' : '🤖';
        const time = new Date().toLocaleTimeString();

        if (type === 'user') {
            messageDiv.innerHTML = `
                <div class="message-avatar">${avatar}</div>
                <div class="message-content">
                    <div class="message-text">${this.escapeHtml(content)}</div>
                    <div class="message-time">${time}</div>
                </div>
            `;
        } else {
            messageDiv.innerHTML = `
                <div class="message-avatar">${avatar}</div>
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
                    <h3>🚨 Unable to Generate Study Materials</h3>
                    <p><strong>Error:</strong> ${data.error}</p>
                    <p>Please try again or check your connection.</p>
                </div>
            `;
        }

        return `
            <div class="study-materials" data-topic="${this.escapeHtml(data.topic)}">
                <!-- Header -->
                <div class="study-header">
                    <h1 class="study-title">🎓 ${this.escapeHtml(data.topic)}</h1>
                    <div class="study-meta">
                        <span class="curriculum-badge">${data.curriculum_alignment || 'Comprehensive Study Guide'}</span>
                        <span class="score-badge">⭐ ${data.study_score || 90}/100</span>
                    </div>
                </div>

                <!-- Ultra Detailed Notes -->
                <div class="study-section">
                    <h2 class="section-title">📖 Comprehensive Study Notes</h2>
                    <div class="ultra-notes">
                        ${this.formatNotes(data.ultra_long_notes)}
                    </div>
                </div>

                <!-- Key Concepts -->
                <div class="study-section">
                    <h2 class="section-title">🔑 Key Concepts</h2>
                    <div class="concepts-grid">
                        ${data.key_concepts ? data.key_concepts.map(concept => `
                            <div class="concept-card">
                                <div class="concept-icon">💡</div>
                                <div class="concept-text">${this.escapeHtml(concept)}</div>
                            </div>
                        `).join('') : ''}
                    </div>
                </div>

                <!-- Practice Questions -->
                <div class="study-section">
                    <h2 class="section-title">❓ Practice Questions</h2>
                    <div class="questions-container">
                        ${data.practice_questions ? data.practice_questions.map((q, index) => `
                            <div class="question-block">
                                <div class="question-header">
                                    <span class="question-number">Q${index + 1}</span>
                                    <span class="question-difficulty">Medium</span>
                                </div>
                                <div class="question-text">${this.escapeHtml(q.question)}</div>
                                <div class="answer-section">
                                    <strong>Answer:</strong>
                                    <div class="answer-text">${this.escapeHtml(q.answer)}</div>
                                </div>
                            </div>
                        `).join('') : ''}
                    </div>
                </div>

                <!-- Advanced Questions -->
                ${data.advanced_questions && data.advanced_questions.length > 0 ? `
                <div class="study-section">
                    <h2 class="section-title">🚀 Advanced Questions</h2>
                    <div class="questions-container advanced-questions">
                        ${data.advanced_questions.map((q, index) => `
                            <div class="question-block advanced">
                                <div class="question-header">
                                    <span class="question-number">Advanced Q${index + 1}</span>
                                    <span class="question-difficulty">Hard</span>
                                </div>
                                <div class="question-text">${this.escapeHtml(q.question)}</div>
                                <div class="answer-section">
                                    <strong>Detailed Solution:</strong>
                                    <div class="answer-text">${this.escapeHtml(q.answer)}</div>
                                </div>
                            </div>
                        `).join('')}
                    </div>
                </div>
                ` : ''}

                <!-- Learning Tricks -->
                <div class="study-section">
                    <h2 class="section-title">🎯 Learning Techniques</h2>
                    <div class="tricks-container">
                        ${data.key_tricks ? data.key_tricks.map(trick => `
                            <div class="trick-card">
                                <div class="trick-icon">⚡</div>
                                <div class="trick-text">${this.escapeHtml(trick)}</div>
                            </div>
                        `).join('') : ''}
                    </div>
                </div>

                <!-- Exam Tips -->
                <div class="study-section">
                    <h2 class="section-title">📝 Exam Preparation</h2>
                    <div class="tips-grid">
                        ${data.exam_tips ? data.exam_tips.map(tip => `
                            <div class="tip-item">
                                <span class="tip-bullet">✅</span>
                                <span>${this.escapeHtml(tip)}</span>
                            </div>
                        `).join('') : ''}
                    </div>
                </div>

                <!-- Footer -->
                <div class="study-footer">
                    <div class="powered-by">
                        Generated by ${data.powered_by || 'Savoiré AI'} • 
                        ${data.generated_at ? new Date(data.generated_at).toLocaleString() : new Date().toLocaleString()}
                    </div>
                </div>

                <!-- Download Button -->
                <div class="download-section">
                    <button class="download-pdf-btn" onclick="savoireAI.downloadStudyPDF(this)">
                        <i class="fas fa-download"></i> Download Complete Study Guide (PDF)
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

    showLoading() {
        this.loadingIndicator.style.display = 'flex';
        this.scrollToBottom();
    }

    hideLoading() {
        this.loadingIndicator.style.display = 'none';
    }

    showError(message) {
        const errorMessage = `
            <div class="error-message">
                <h3>⚠️ Connection Issue</h3>
                <p>${this.escapeHtml(message)}</p>
                <p>Please check your internet connection and try again.</p>
            </div>
        `;
        this.addMessage(errorMessage, 'ai');
    }

    clearChat() {
        this.chatMessages.innerHTML = '';
        this.conversationHistory = [];
        this.welcomeScreen.style.display = 'block';
        this.chatMessages.style.display = 'none';
    }

    async downloadPDF() {
        if (this.conversationHistory.length === 0) {
            alert('No conversation to download!');
            return;
        }

        try {
            this.downloadPDFBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Generating PDF...';
            this.downloadPDFBtn.disabled = true;

            const { jsPDF } = window.jspdf;
            const pdf = new jsPDF();
            
            let yPosition = 20;
            const pageHeight = pdf.internal.pageSize.height;
            const margin = 20;
            const lineHeight = 7;

            // Add header
            pdf.setFontSize(20);
            pdf.setTextColor(59, 130, 246);
            pdf.text('Savoiré AI - Study Session', margin, yPosition);
            
            yPosition += 15;
            pdf.setFontSize(10);
            pdf.setTextColor(100, 100, 100);
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
                pdf.setTextColor(msg.type === 'user' ? 59 : 0, msg.type === 'user' ? 130 : 0, msg.type === 'user' ? 246 : 0);
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
            this.downloadPDFBtn.innerHTML = '<i class="fas fa-download"></i> PDF';
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
            const pdf = new jsPDF();
            
            // Capture the study materials as image
            const canvas = await html2canvas(studyElement, {
                scale: 2,
                useCORS: true,
                logging: false
            });

            const imgData = canvas.toDataURL('image/png');
            const imgWidth = pdf.internal.pageSize.getWidth();
            const imgHeight = (canvas.height * imgWidth) / canvas.width;

            pdf.addImage(imgData, 'PNG', 0, 0, imgWidth, imgHeight);
            pdf.save(`savoire-ai-${topic.replace(/[^a-z0-9]/gi, '-').toLowerCase()}-${Date.now()}.pdf`);
            
        } catch (error) {
            console.error('Study PDF generation failed:', error);
            alert('PDF generation failed. Please try again.');
        } finally {
            button.innerHTML = '<i class="fas fa-download"></i> Download Complete Study Guide (PDF)';
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
        } else {
            icon.className = 'fas fa-moon';
        }
    }
}

// Initialize the app
const savoireAI = new SavoireAI();

// Make available globally
window.savoireAI = savoireAI;

// Add enhanced styles
const enhancedStyles = document.createElement('style');
enhancedStyles.textContent = `
    /* Quantum Particles Animation */
    @keyframes quantumFloat {
        0%, 100% { 
            transform: translate(0, 0) rotate(0deg); 
            opacity: 0.7;
        }
        25% { 
            transform: translate(10px, -15px) rotate(90deg); 
            opacity: 1;
        }
        50% { 
            transform: translate(-5px, 10px) rotate(180deg); 
            opacity: 0.5;
        }
        75% { 
            transform: translate(15px, 5px) rotate(270deg); 
            opacity: 0.8;
        }
    }

    /* Study Materials Styling */
    .study-materials {
        background: linear-gradient(135deg, rgba(30, 41, 59, 0.9), rgba(15, 23, 42, 0.9));
        border: 1px solid rgba(59, 130, 246, 0.3);
        border-radius: 20px;
        padding: 2rem;
        margin: 1rem 0;
        backdrop-filter: blur(10px);
        box-shadow: 0 20px 40px rgba(0, 0, 0, 0.3);
    }

    .study-header {
        text-align: center;
        margin-bottom: 2rem;
        padding-bottom: 1.5rem;
        border-bottom: 2px solid rgba(59, 130, 246, 0.3);
    }

    .study-title {
        font-size: 2.2rem;
        background: linear-gradient(135deg, #3b82f6, #8b5cf6);
        -webkit-background-clip: text;
        -webkit-text-fill-color: transparent;
        margin-bottom: 1rem;
    }

    .study-meta {
        display: flex;
        justify-content: center;
        gap: 1rem;
        flex-wrap: wrap;
    }

    .curriculum-badge, .score-badge {
        background: rgba(59, 130, 246, 0.2);
        border: 1px solid #3b82f6;
        padding: 0.5rem 1rem;
        border-radius: 25px;
        font-size: 0.9rem;
        font-weight: 600;
    }

    .score-badge {
        background: rgba(245, 158, 11, 0.2);
        border-color: #f59e0b;
        color: #f59e0b;
    }

    .study-section {
        margin-bottom: 2.5rem;
    }

    .section-title {
        font-size: 1.5rem;
        color: #3b82f6;
        margin-bottom: 1.5rem;
        padding-bottom: 0.5rem;
        border-bottom: 1px solid rgba(59, 130, 246, 0.3);
        display: flex;
        align-items: center;
        gap: 0.5rem;
    }

    .ultra-notes {
        background: rgba(255, 255, 255, 0.05);
        border-radius: 15px;
        padding: 2rem;
        line-height: 1.8;
        border-left: 4px solid #3b82f6;
    }

    .concepts-grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
        gap: 1rem;
    }

    .concept-card {
        background: rgba(59, 130, 246, 0.1);
        border: 1px solid rgba(59, 130, 246, 0.3);
        border-radius: 12px;
        padding: 1.2rem;
        display: flex;
        align-items: flex-start;
        gap: 1rem;
        transition: all 0.3s ease;
    }

    .concept-card:hover {
        transform: translateY(-2px);
        box-shadow: 0 10px 25px rgba(59, 130, 246, 0.2);
    }

    .concept-icon {
        font-size: 1.5rem;
        flex-shrink: 0;
    }

    .concept-text {
        font-weight: 500;
    }

    .questions-container {
        display: flex;
        flex-direction: column;
        gap: 1.5rem;
    }

    .question-block {
        background: rgba(255, 255, 255, 0.05);
        border-radius: 12px;
        padding: 1.5rem;
        border-left: 4px solid #10b981;
    }

    .question-block.advanced {
        border-left-color: #f59e0b;
        background: rgba(245, 158, 11, 0.05);
    }

    .question-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 1rem;
    }

    .question-number {
        font-weight: 700;
        color: #3b82f6;
        font-size: 1.1rem;
    }

    .question-difficulty {
        background: rgba(16, 185, 129, 0.2);
        color: #10b981;
        padding: 0.3rem 0.8rem;
        border-radius: 15px;
        font-size: 0.8rem;
        font-weight: 600;
    }

    .question-block.advanced .question-difficulty {
        background: rgba(245, 158, 11, 0.2);
        color: #f59e0b;
    }

    .question-text {
        font-weight: 600;
        margin-bottom: 1rem;
        line-height: 1.6;
    }

    .answer-section {
        background: rgba(255, 255, 255, 0.03);
        border-radius: 8px;
        padding: 1rem;
        border-left: 3px solid #3b82f6;
    }

    .answer-text {
        line-height: 1.6;
        margin-top: 0.5rem;
    }

    .tricks-container {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
        gap: 1rem;
    }

    .trick-card {
        background: rgba(139, 92, 246, 0.1);
        border: 1px solid rgba(139, 92, 246, 0.3);
        border-radius: 12px;
        padding: 1.2rem;
        display: flex;
        align-items: center;
        gap: 1rem;
        transition: all 0.3s ease;
    }

    .trick-card:hover {
        transform: translateY(-2px);
        box-shadow: 0 10px 25px rgba(139, 92, 246, 0.2);
    }

    .trick-icon {
        font-size: 1.5rem;
        flex-shrink: 0;
    }

    .tips-grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
        gap: 1rem;
    }

    .tip-item {
        display: flex;
        align-items: center;
        gap: 1rem;
        padding: 0.8rem;
        background: rgba(255, 255, 255, 0.03);
        border-radius: 8px;
    }

    .tip-bullet {
        color: #10b981;
        font-size: 1.2rem;
    }

    .study-footer {
        text-align: center;
        margin-top: 2rem;
        padding-top: 1.5rem;
        border-top: 1px solid rgba(59, 130, 246, 0.3);
    }

    .powered-by {
        color: var(--text-muted);
        font-size: 0.9rem;
    }

    .download-section {
        text-align: center;
        margin-top: 2rem;
    }

    .download-pdf-btn {
        background: linear-gradient(135deg, #10b981, #059669);
        border: none;
        color: white;
        padding: 1rem 2rem;
        border-radius: 12px;
        font-weight: 600;
        cursor: pointer;
        transition: all 0.3s ease;
        display: inline-flex;
        align-items: center;
        gap: 0.8rem;
        font-size: 1rem;
    }

    .download-pdf-btn:hover {
        transform: translateY(-2px);
        box-shadow: 0 10px 25px rgba(16, 185, 129, 0.4);
    }

    .download-pdf-btn:disabled {
        opacity: 0.7;
        cursor: not-allowed;
        transform: none;
    }

    .error-message {
        background: linear-gradient(135deg, rgba(239, 68, 68, 0.1), rgba(220, 38, 38, 0.1));
        border: 1px solid rgba(239, 68, 68, 0.3);
        border-radius: 15px;
        padding: 1.5rem;
        text-align: center;
    }

    .error-message h3 {
        color: #ef4444;
        margin-bottom: 1rem;
    }

    /* Enhanced Message Styles */
    .ai-message .message-content {
        max-width: 90%;
    }

    .user-message .message-content {
        max-width: 70%;
    }

    /* Light Theme */
    .light-theme {
        --primary-bg: #f8fafc;
        --secondary-bg: #ffffff;
        --card-bg: #f1f5f9;
        --text-primary: #1e293b;
        --text-secondary: #475569;
        --text-muted: #64748b;
        --border-color: #e2e8f0;
        --user-message-bg: #3b82f6;
        --ai-message-bg: #ffffff;
    }

    /* Responsive Design */
    @media (max-width: 768px) {
        .study-materials {
            padding: 1.5rem;
            margin: 0.5rem 0;
        }

        .study-title {
            font-size: 1.8rem;
        }

        .concepts-grid,
        .tricks-container,
        .tips-grid {
            grid-template-columns: 1fr;
        }

        .ai-message .message-content,
        .user-message .message-content {
            max-width: 95%;
        }

        .section-title {
            font-size: 1.3rem;
        }
    }

    /* Smooth animations */
    .study-materials {
        animation: materialAppear 0.6s ease-out;
    }

    @keyframes materialAppear {
        from {
            opacity: 0;
            transform: translateY(30px) scale(0.95);
        }
        to {
            opacity: 1;
            transform: translateY(0) scale(1);
        }
    }
`;
document.head.appendChild(enhancedStyles);
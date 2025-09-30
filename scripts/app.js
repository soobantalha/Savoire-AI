// app.js - Real AI Only (No Templates)
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
            // Get REAL AI response only - no fallbacks
            const response = await this.getRealAIResponse(message);
            this.addMessage(response, 'ai');
            
        } catch (error) {
            console.error('AI Error:', error);
            this.addMessage(
                "❌ **I apologize, but I'm unable to generate a response right now.**\n\n" +
                "This could be due to:\n" +
                "• API service temporarily unavailable\n" + 
                "• Network connectivity issues\n" +
                "• Server capacity limits\n\n" +
                "Please try again in a few moments, or check your API configuration.",
                'ai'
            );
        } finally {
            this.hideLoading();
            this.scrollToBottom();
        }
    }

    async getRealAIResponse(userMessage) {
        // ONLY use real AI API - no templates, no fallbacks
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

        if (!response.ok) {
            throw new Error(`API Error: ${response.status}`);
        }

        const data = await response.json();
        return this.formatAIResponse(data);
    }

    formatAIResponse(data) {
        // Format whatever the real AI returns
        if (data.ultra_long_notes || data.practice_questions || data.key_concepts) {
            return this.formatStructuredResponse(data);
        } else if (data.content || data.response) {
            // Handle different AI response formats
            return data.content || data.response;
        } else {
            // If AI returns unexpected format, show raw response
            return `**AI Response:**\n\n${JSON.stringify(data, null, 2)}`;
        }
    }

    formatStructuredResponse(data) {
        let response = '';
        
        // Add topic title
        if (data.topic) {
            response += `# ${data.topic}\n\n`;
        }
        
        // Add curriculum alignment if available
        if (data.curriculum_alignment) {
            response += `**Curriculum:** ${data.curriculum_alignment}\n\n`;
        }
        
        // Add main content
        if (data.ultra_long_notes) {
            response += `## 📚 Detailed Explanation\n\n${data.ultra_long_notes}\n\n`;
        }
        
        // Add key concepts
        if (data.key_concepts && data.key_concepts.length > 0) {
            response += `## 🎯 Key Concepts\n\n`;
            data.key_concepts.forEach(concept => {
                response += `• **${concept}**\n`;
            });
            response += `\n`;
        }
        
        // Add practice questions
        if (data.practice_questions && data.practice_questions.length > 0) {
            response += `## ❓ Practice Questions\n\n`;
            data.practice_questions.forEach((q, i) => {
                response += `**Q${i + 1}:** ${q.question}\n\n`;
                response += `**A${i + 1}:** ${q.answer}\n\n`;
            });
        }
        
        // Add advanced questions
        if (data.advanced_questions && data.advanced_questions.length > 0) {
            response += `## 🧠 Advanced Questions\n\n`;
            data.advanced_questions.forEach((q, i) => {
                response += `**Advanced Q${i + 1}:** ${q.question}\n\n`;
                response += `**Advanced A${i + 1}:** ${q.answer}\n\n`;
            });
        }
        
        // Add tricks and tips
        if (data.key_tricks && data.key_tricks.length > 0) {
            response += `## 💡 Tips & Tricks\n\n`;
            data.key_tricks.forEach(trick => {
                response += `• ${trick}\n`;
            });
            response += `\n`;
        }
        
        // Add real-world applications
        if (data.real_world_applications && data.real_world_applications.length > 0) {
            response += `## 🌍 Real-World Applications\n\n`;
            data.real_world_applications.forEach(app => {
                response += `• ${app}\n`;
            });
            response += `\n`;
        }
        
        // Add study score if available
        if (data.study_score) {
            response += `\n---\n*Study Score: ${data.study_score}/100 | Generated by Savoiré AI*`;
        } else {
            response += `\n---\n*Generated by Savoiré AI*`;
        }
        
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
            .replace(/❓ (.*?)(<br>|$)/g, '<div class="highlight-box"><strong>❓ $1</strong></div>')
            .replace(/🧠 (.*?)(<br>|$)/g, '<div class="highlight-box"><strong>🧠 $1</strong></div>')
            .replace(/💡 (.*?)(<br>|$)/g, '<div class="highlight-box"><strong>💡 $1</strong></div>')
            .replace(/🌍 (.*?)(<br>|$)/g, '<div class="highlight-box"><strong>🌍 $1</strong></div>');
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
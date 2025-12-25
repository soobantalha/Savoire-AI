// ============================================
// SAVOIRÉ OMEGA - NEURAL LOGIC CORE
// Ultra-Reliable AI Interface
// ============================================

class SavoireOmega {
    // Add this method to SavoireOmega class:

async sendMessage() {
    const message = this.messageInput.value.trim();
    if (!message || this.isGenerating) return;
    
    // Hide welcome screen
    if (this.welcomeScreen.style.display !== 'none') {
        this.welcomeScreen.style.display = 'none';
        this.chatContainer.style.display = 'block';
    }
    
    // Add user message
    this.addMessage(message, 'user');
    
    // Clear input
    this.messageInput.value = '';
    this.autoResizeTextarea();
    this.capsule.classList.remove('expanded');
    
    // Show thinking indicator
    this.showThinking();
    
    this.isGenerating = true;
    this.sendButton.disabled = true;
    
    try {
        // First try local free endpoint
        const response = await fetch('/api/study', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ message })
        });
        
        if (!response.ok) {
            // If local fails, try direct free API
            throw new Error(`API Error: ${response.status}`);
        }
        
        const data = await response.json();
        this.hideThinking();
        
        if (data.error) {
            throw new Error(data.error);
        }
        
        this.displayStudyDossier(data);
        
    } catch (error) {
        console.error('API Error:', error);
        this.hideThinking();
        
        // Try direct free model call as last resort
        this.showError('Trying alternative free models...');
        
        try {
            const fallbackResponse = await this.tryDirectFreeAPI(message);
            this.displayStudyDossier(fallbackResponse);
        } catch (finalError) {
            console.error('All methods failed:', finalError);
            this.showError('All models failed. Using local synthesis...');
            
            // Ultimate fallback
            setTimeout(() => {
                const localData = this.generateLocalDossier(message);
                this.displayStudyDossier(localData);
            }, 1000);
        }
    }
    
    this.isGenerating = false;
    this.sendButton.disabled = false;
}

// Add direct free API method:
async tryDirectFreeAPI(message) {
    // Try Hugging Face Inference API (free tier)
    try {
        const response = await fetch('https://api-inference.huggingface.co/models/mistralai/Mistral-7B-Instruct-v0.1', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                inputs: `Generate a comprehensive study guide about: ${message}`,
                parameters: {
                    max_new_tokens: 1500,
                    temperature: 0.7
                }
            })
        });

        if (response.ok) {
            const data = await response.json();
            return {
                success: true,
                content: data[0]?.generated_text || 'Study guide generated',
                model_used: 'Mistral-7B (Hugging Face)',
                is_free: true
            };
        }
    } catch (error) {
        console.log('Hugging Face failed:', error);
    }

    // Try another free endpoint
    try {
        const response = await fetch('https://free.chatgptapi.io/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                model: 'gpt-3.5-turbo',
                messages: [
                    { role: 'system', content: 'You are a helpful tutor.' },
                    { role: 'user', content: `Explain: ${message}` }
                ],
                max_tokens: 1000
            })
        });

        if (response.ok) {
            const data = await response.json();
            return {
                success: true,
                content: data.choices[0].message.content,
                model_used: 'GPT-3.5 (Free API)',
                is_free: true
            };
        }
    } catch (error) {
        console.log('Free API failed:', error);
    }

    throw new Error('All direct free APIs failed');
}
    constructor() {
        // Core State
        this.isGenerating = false;
        this.currentTypewriter = null;
        this.conversationHistory = [];
        this.soundEnabled = true;
        
        // Initialize Systems
        this.initNeuralCanvas();
        this.initSoundEngine();
        this.initElements();
        this.bindEvents();
        
        // Welcome
        this.playSound('hover');
    }

    // ============================================
    // NEURAL CANVAS - Particle Network
    // ============================================
    initNeuralCanvas() {
        this.canvas = document.getElementById('neuralCanvas');
        this.ctx = this.canvas.getContext('2d');
        this.particles = [];
        this.mouse = { x: 0, y: 0 };
        
        this.resizeCanvas();
        window.addEventListener('resize', () => this.resizeCanvas());
        window.addEventListener('mousemove', (e) => this.onMouseMove(e));
        
        this.createParticles();
        this.animateCanvas();
    }

    resizeCanvas() {
        this.canvas.width = window.innerWidth;
        this.canvas.height = window.innerHeight;
        this.createParticles();
    }

    onMouseMove(e) {
        this.mouse.x = e.clientX;
        this.mouse.y = e.clientY;
    }

    createParticles() {
        const count = Math.min(60, Math.floor(window.innerWidth / 25));
        this.particles = [];
        
        for (let i = 0; i < count; i++) {
            this.particles.push({
                x: Math.random() * this.canvas.width,
                y: Math.random() * this.canvas.height,
                vx: (Math.random() - 0.5) * 0.3,
                vy: (Math.random() - 0.5) * 0.3,
                radius: Math.random() * 1.5 + 0.5,
                color: Math.random() > 0.5 ? '#00f3ff' : '#7000ff',
                opacity: Math.random() * 0.4 + 0.2
            });
        }
    }

    animateCanvas() {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        
        // Update and draw particles
        this.particles.forEach(particle => {
            // Update position
            particle.x += particle.vx;
            particle.y += particle.vy;
            
            // Bounce off walls
            if (particle.x < 0 || particle.x > this.canvas.width) particle.vx *= -1;
            if (particle.y < 0 || particle.y > this.canvas.height) particle.vy *= -1;
            
            // Attract to mouse
            const dx = this.mouse.x - particle.x;
            const dy = this.mouse.y - particle.y;
            const distance = Math.sqrt(dx * dx + dy * dy);
            
            if (distance < 150) {
                particle.vx += dx * 0.00005;
                particle.vy += dy * 0.00005;
                
                // Limit velocity
                const speed = Math.sqrt(particle.vx * particle.vx + particle.vy * particle.vy);
                if (speed > 0.5) {
                    particle.vx = (particle.vx / speed) * 0.5;
                    particle.vy = (particle.vy / speed) * 0.5;
                }
            }
            
            // Draw particle
            this.ctx.beginPath();
            this.ctx.arc(particle.x, particle.y, particle.radius, 0, Math.PI * 2);
            this.ctx.fillStyle = particle.color;
            this.ctx.globalAlpha = particle.opacity;
            this.ctx.fill();
        });
        
        // Draw connections
        this.ctx.globalAlpha = 0.1;
        this.ctx.strokeStyle = '#00f3ff';
        this.ctx.lineWidth = 0.5;
        
        for (let i = 0; i < this.particles.length; i++) {
            for (let j = i + 1; j < this.particles.length; j++) {
                const p1 = this.particles[i];
                const p2 = this.particles[j];
                
                const dx = p1.x - p2.x;
                const dy = p1.y - p2.y;
                const distance = Math.sqrt(dx * dx + dy * dy);
                
                if (distance < 80) {
                    this.ctx.beginPath();
                    this.ctx.moveTo(p1.x, p1.y);
                    this.ctx.lineTo(p2.x, p2.y);
                    this.ctx.strokeStyle = `rgba(0, 243, 255, ${0.2 * (1 - distance / 80)})`;
                    this.ctx.stroke();
                }
            }
        }
        
        // Draw mouse connections
        this.ctx.globalAlpha = 0.15;
        this.ctx.strokeStyle = '#7000ff';
        
        this.particles.forEach(particle => {
            const dx = this.mouse.x - particle.x;
            const dy = this.mouse.y - particle.y;
            const distance = Math.sqrt(dx * dx + dy * dy);
            
            if (distance < 100) {
                this.ctx.beginPath();
                this.ctx.moveTo(particle.x, particle.y);
                this.ctx.lineTo(this.mouse.x, this.mouse.y);
                this.ctx.strokeStyle = `rgba(112, 0, 255, ${0.25 * (1 - distance / 100)})`;
                this.ctx.stroke();
            }
        });
        
        // Reset alpha
        this.ctx.globalAlpha = 1;
        
        requestAnimationFrame(() => this.animateCanvas());
    }

    // ============================================
    // SOUND ENGINE
    // ============================================
    initSoundEngine() {
        this.sounds = {
            hover: document.getElementById('hoverSound'),
            click: document.getElementById('clickSound'),
            type: document.getElementById('typeSound'),
            success: document.getElementById('successSound')
        };
        
        // Preload sounds
        Object.values(this.sounds).forEach(sound => {
            if (sound) {
                sound.volume = 0.3;
                sound.load();
            }
        });
    }

    playSound(soundName) {
        if (!this.soundEnabled || !this.sounds[soundName]) return;
        
        try {
            const sound = this.sounds[soundName];
            sound.currentTime = 0;
            sound.play().catch(e => console.log('Sound play failed:', e));
        } catch (error) {
            console.log('Sound error:', error);
        }
    }

    toggleSound() {
        this.soundEnabled = !this.soundEnabled;
        const icon = document.querySelector('#soundToggle i');
        if (icon) {
            icon.className = this.soundEnabled ? 'fas fa-volume-up' : 'fas fa-volume-mute';
        }
        this.playSound('click');
    }

    // ============================================
    // ELEMENT INITIALIZATION
    // ============================================
    initElements() {
        this.chatMessages = document.getElementById('chatMessages');
        this.messageInput = document.getElementById('messageInput');
        this.sendButton = document.getElementById('sendButton');
        this.welcomeScreen = document.getElementById('welcomeScreen');
        this.chatContainer = document.getElementById('chatContainer');
        this.thinkingIndicator = document.getElementById('thinkingIndicator');
        this.pdfSection = document.getElementById('pdfSection');
        this.downloadPDFBtn = document.getElementById('downloadPDF');
        this.clearChatBtn = document.getElementById('clearChat');
        this.themeToggle = document.getElementById('themeToggle');
        this.soundToggle = document.getElementById('soundToggle');
        this.capsule = document.getElementById('capsule');
        
        // Quick prompt chips
        this.promptChips = document.querySelectorAll('.prompt-chip');
    }

    // ============================================
    // EVENT BINDING
    // ============================================
    bindEvents() {
        // Send message
        this.sendButton.addEventListener('click', () => this.sendMessage());
        this.messageInput.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                this.sendMessage();
            }
        });
        
        // Auto-resize textarea
        this.messageInput.addEventListener('input', () => {
            this.autoResizeTextarea();
            this.playSound('type');
        });
        
        // Input focus effects
        this.messageInput.addEventListener('focus', () => {
            this.capsule.classList.add('expanded');
            this.playSound('hover');
        });
        
        this.messageInput.addEventListener('blur', () => {
            if (!this.messageInput.value.trim()) {
                this.capsule.classList.remove('expanded');
            }
        });
        
        // Quick prompt chips
        this.promptChips.forEach(chip => {
            chip.addEventListener('click', (e) => {
                const prompt = e.currentTarget.getAttribute('data-prompt');
                this.messageInput.value = prompt;
                this.autoResizeTextarea();
                this.capsule.classList.add('expanded');
                this.playSound('click');
                setTimeout(() => this.sendMessage(), 300);
            });
            
            chip.addEventListener('mouseenter', () => this.playSound('hover'));
        });
        
        // Control buttons
        this.clearChatBtn.addEventListener('click', () => this.clearChat());
        this.themeToggle.addEventListener('click', () => this.toggleTheme());
        this.soundToggle.addEventListener('click', () => this.toggleSound());
        this.downloadPDFBtn.addEventListener('click', () => this.generatePremiumPDF());
        
        // Apply sound to all buttons
        document.querySelectorAll('button').forEach(btn => {
            btn.addEventListener('mouseenter', () => this.playSound('hover'));
            btn.addEventListener('click', () => this.playSound('click'));
        });
        
        // Input action buttons
        document.getElementById('voiceInput')?.addEventListener('click', () => {
            this.showToast('Voice input coming in v2.0');
        });
        
        document.getElementById('attachFile')?.addEventListener('click', () => {
            this.showToast('File attachment coming in v2.0');
        });
    }

    // ============================================
    // CHAT FUNCTIONS
    // ============================================
    async sendMessage() {
        const message = this.messageInput.value.trim();
        if (!message || this.isGenerating) return;
        
        // Hide welcome screen
        if (this.welcomeScreen.style.display !== 'none') {
            this.welcomeScreen.style.display = 'none';
            this.chatContainer.style.display = 'block';
        }
        
        // Add user message
        this.addMessage(message, 'user');
        
        // Clear input
        this.messageInput.value = '';
        this.autoResizeTextarea();
        this.capsule.classList.remove('expanded');
        
        // Show thinking indicator
        this.showThinking();
        
        this.isGenerating = true;
        this.sendButton.disabled = true;
        
        try {
            const response = await fetch('/api/study', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ message })
            });
            
            if (!response.ok) {
                throw new Error(`API Error: ${response.status}`);
            }
            
            const data = await response.json();
            this.hideThinking();
            
            if (data.error) {
                throw new Error(data.error);
            }
            
            this.displayStudyDossier(data);
            
        } catch (error) {
            console.error('API Error:', error);
            this.hideThinking();
            this.showError('Network error. Using local synthesis...');
            
            // Generate local fallback
            setTimeout(() => {
                const fallbackData = this.generateLocalDossier(message);
                this.displayStudyDossier(fallbackData);
            }, 1000);
        }
        
        this.isGenerating = false;
        this.sendButton.disabled = false;
    }

    addMessage(content, type) {
        const messageDiv = document.createElement('div');
        messageDiv.className = `message ${type}-message`;
        
        const time = new Date().toLocaleTimeString([], { 
            hour: '2-digit', 
            minute: '2-digit',
            hour12: false 
        });
        
        if (type === 'user') {
            messageDiv.innerHTML = `
                <div class="user-bubble glass-panel">
                    <div class="message-header">
                        <div class="message-avatar">
                            <i class="fas fa-user"></i>
                        </div>
                        <div class="message-sender">YOU</div>
                        <div class="message-time">${time}</div>
                    </div>
                    <div class="message-content">${this.escapeHtml(content)}</div>
                </div>
            `;
        } else {
            messageDiv.innerHTML = `
                <div class="ai-bubble glass-panel">
                    <div class="message-header">
                        <div class="message-avatar">
                            <i class="fas fa-robot"></i>
                        </div>
                        <div class="message-sender">PROFESSOR X</div>
                        <div class="message-time">${time}</div>
                    </div>
                    <div class="message-content" id="aiResponseContent"></div>
                </div>
            `;
        }
        
        this.chatMessages.appendChild(messageDiv);
        this.scrollToBottom();
        
        // Add to history
        this.conversationHistory.push({
            type,
            content,
            time,
            timestamp: new Date().toISOString()
        });
        
        return messageDiv;
    }

    displayStudyDossier(data) {
        // Hide PDF section initially
        this.pdfSection.style.display = 'none';
        
        // Create AI message
        const aiMessage = this.addMessage('', 'ai');
        const responseElement = aiMessage.querySelector('#aiResponseContent');
        
        // Get content (handle both formats)
        let content = '';
        if (typeof data === 'string') {
            content = data;
        } else if (data.content) {
            content = data.content;
        } else if (data.error) {
            content = `**Error:** ${data.error}\n\nUsing fallback generation...`;
        } else {
            content = JSON.stringify(data, null, 2);
        }
        
        // Format markdown
        const formattedContent = this.markdownToHtml(content);
        
        // Start typewriter effect
        this.currentTypewriter = new TypeWriter(
            responseElement, 
            formattedContent,
            15, // Speed
            () => {
                this.playSound('type');
                this.scrollToBottom();
            },
            () => {
                this.playSound('success');
                this.showPDFSection();
                this.renderMathJax();
            }
        );
        
        // Add skip button
        const skipBtn = this.createSkipButton();
        aiMessage.querySelector('.ai-bubble').appendChild(skipBtn);
        
        // Start typing
        this.currentTypewriter.start();
    }

    // ============================================
    // TYPEWRITER SYSTEM
    // ============================================
    createSkipButton() {
        const skipBtn = document.createElement('button');
        skipBtn.className = 'control-btn';
        skipBtn.innerHTML = '<i class="fas fa-forward"></i> SKIP';
        skipBtn.style.marginTop = '1rem';
        skipBtn.style.fontSize = '0.9rem';
        skipBtn.style.padding = '0.5rem 1rem';
        skipBtn.style.width = 'auto';
        
        skipBtn.addEventListener('click', () => {
            if (this.currentTypewriter) {
                this.currentTypewriter.skip();
                skipBtn.remove();
            }
        });
        
        return skipBtn;
    }

    // ============================================
    // PDF GENERATION
    // ============================================
    async generatePremiumPDF() {
        this.playSound('click');
        
        // Show generating indicator
        const originalText = this.downloadPDFBtn.innerHTML;
        this.downloadPDFBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> GENERATING...';
        this.downloadPDFBtn.disabled = true;
        
        try {
            const { jsPDF } = window.jspdf;
            const doc = new jsPDF({
                orientation: 'portrait',
                unit: 'mm',
                format: 'a4'
            });
            
            const pageWidth = doc.internal.pageSize.getWidth();
            const pageHeight = doc.internal.pageSize.getHeight();
            const margin = 15;
            
            // ========== COVER PAGE ==========
            // Black background
            doc.setFillColor(2, 2, 4);
            doc.rect(0, 0, pageWidth, pageHeight, 'F');
            
            // Gold border
            doc.setDrawColor(255, 215, 0);
            doc.setLineWidth(1);
            doc.rect(margin, margin, pageWidth - 2 * margin, pageHeight - 2 * margin);
            
            // Title
            doc.setTextColor(255, 215, 0);
            doc.setFontSize(32);
            doc.setFont('helvetica', 'bold');
            doc.text('SAVOIRÉ OMEGA', pageWidth / 2, 60, { align: 'center' });
            
            // Subtitle
            doc.setTextColor(0, 243, 255);
            doc.setFontSize(16);
            doc.text('CLASSIFIED STUDY DOSSIER', pageWidth / 2, 75, { align: 'center' });
            
            // Divider
            doc.setDrawColor(0, 243, 255);
            doc.setLineWidth(0.5);
            doc.line(margin + 20, 85, pageWidth - margin - 20, 85);
            
            // Topic
            const topic = this.getCurrentTopic();
            doc.setTextColor(255, 255, 255);
            doc.setFontSize(24);
            doc.text(topic.toUpperCase(), pageWidth / 2, 110, { align: 'center' });
            
            // Logo
            doc.setFillColor(0, 243, 255, 0.1);
            doc.circle(pageWidth / 2, 150, 25, 'F');
            doc.setTextColor(0, 243, 255);
            doc.setFontSize(20);
            doc.text('⚡', pageWidth / 2, 155, { align: 'center' });
            
            // Authorized by
            doc.setTextColor(255, 255, 255);
            doc.setFontSize(10);
            doc.text('AUTHORIZED BY', pageWidth / 2, 190, { align: 'center' });
            
            doc.setTextColor(255, 215, 0);
            doc.setFontSize(12);
            doc.textWithLink('Sooban Talha Technologies', pageWidth / 2, 200, { 
                align: 'center',
                url: 'https://soobantalhatech.xyz'
            });
            
            // Generation info
            doc.setTextColor(150, 150, 150);
            doc.setFontSize(8);
            doc.text(`Generated: ${new Date().toLocaleString()}`, pageWidth / 2, 230, { align: 'center' });
            doc.text('Professor X Protocol • 3000+ Word Analysis', pageWidth / 2, 235, { align: 'center' });
            
            doc.text('Page 1', pageWidth / 2, pageHeight - margin, { align: 'center' });
            
            // ========== CONTENT PAGES ==========
            const latestMessage = this.chatMessages.querySelector('.ai-bubble:last-child .message-content');
            if (latestMessage) {
                // Convert to canvas
                const canvas = await html2canvas(latestMessage, {
                    scale: 2,
                    useCORS: true,
                    backgroundColor: '#020204'
                });
                
                // Add new page
                doc.addPage();
                
                // Content header
                doc.setTextColor(0, 243, 255);
                doc.setFontSize(14);
                doc.setFont('helvetica', 'bold');
                doc.text('STUDY DOSSIER CONTENT', pageWidth / 2, margin, { align: 'center' });
                
                // Add content image
                const imgWidth = pageWidth - 2 * margin;
                const imgHeight = (canvas.height * imgWidth) / canvas.width;
                
                doc.addImage(canvas, 'PNG', margin, margin + 10, imgWidth, imgHeight);
                
                // Page number
                doc.setTextColor(100, 100, 100);
                doc.setFontSize(8);
                doc.text('Page 2', pageWidth / 2, pageHeight - margin, { align: 'center' });
            }
            
            // ========== FOOTER ON ALL PAGES ==========
            const totalPages = doc.internal.getNumberOfPages();
            
            for (let i = 1; i <= totalPages; i++) {
                doc.setPage(i);
                
                // Footer line
                doc.setDrawColor(0, 243, 255, 0.3);
                doc.setLineWidth(0.2);
                doc.line(margin, pageHeight - margin - 5, pageWidth - margin, pageHeight - margin - 5);
                
                // Copyright
                doc.setTextColor(150, 150, 150);
                doc.setFontSize(7);
                doc.textWithLink('Powered by Sooban Talha Technologies', pageWidth / 2, pageHeight - margin, {
                    align: 'center',
                    url: 'https://soobantalhatech.xyz'
                });
            }
            
            // Save PDF
            const fileName = `SavoireOmega_${this.getCurrentTopic().replace(/[^a-zA-Z0-9]/g, '_')}.pdf`;
            doc.save(fileName);
            
            this.showToast('PDF generated successfully!');
            
        } catch (error) {
            console.error('PDF Generation Error:', error);
            this.showToast('PDF generation failed. Please try again.');
        } finally {
            // Restore button
            this.downloadPDFBtn.innerHTML = originalText;
            this.downloadPDFBtn.disabled = false;
        }
    }
    
    getCurrentTopic() {
        const lastUserMessage = this.conversationHistory
            .filter(msg => msg.type === 'user')
            .pop();
        return lastUserMessage?.content || 'Study Topic';
    }

    // ============================================
    // UTILITY FUNCTIONS
    // ============================================
    autoResizeTextarea() {
        this.messageInput.style.height = 'auto';
        this.messageInput.style.height = Math.min(this.messageInput.scrollHeight, 200) + 'px';
    }

    showThinking() {
        this.thinkingIndicator.style.display = 'block';
        this.scrollToBottom();
    }

    hideThinking() {
        this.thinkingIndicator.style.display = 'none';
    }

    showPDFSection() {
        this.pdfSection.style.display = 'block';
        this.scrollToBottom();
    }

    showError(message) {
        const errorMessage = `
            <div class="error-message">
                <h3><i class="fas fa-exclamation-triangle"></i> SYSTEM ALERT</h3>
                <p>${this.escapeHtml(message)}</p>
                <p>Engaging fallback protocols...</p>
            </div>
        `;
        this.addMessage(errorMessage, 'ai');
    }

    showToast(message) {
        // Create toast element
        const toast = document.createElement('div');
        toast.className = 'omega-toast';
        toast.innerHTML = `
            <div class="toast-content">
                <i class="fas fa-info-circle"></i>
                <span>${this.escapeHtml(message)}</span>
            </div>
        `;
        
        document.body.appendChild(toast);
        
        // Show
        setTimeout(() => toast.classList.add('show'), 10);
        
        // Remove
        setTimeout(() => {
            toast.classList.remove('show');
            setTimeout(() => toast.remove(), 300);
        }, 3000);
    }

    clearChat() {
        this.playSound('click');
        
        this.chatMessages.style.opacity = '0';
        this.chatMessages.style.transform = 'translateY(20px)';
        
        setTimeout(() => {
            this.chatMessages.innerHTML = '';
            this.conversationHistory = [];
            this.chatContainer.style.display = 'none';
            this.welcomeScreen.style.display = 'block';
            this.pdfSection.style.display = 'none';
            
            this.chatMessages.style.opacity = '1';
            this.chatMessages.style.transform = 'translateY(0)';
        }, 300);
    }

    toggleTheme() {
        document.body.classList.toggle('light-mode');
        const icon = this.themeToggle.querySelector('i');
        if (document.body.classList.contains('light-mode')) {
            icon.className = 'fas fa-sun';
            document.documentElement.style.setProperty('--void-black', '#f5f5f5');
            document.documentElement.style.setProperty('--text-primary', '#202124');
            document.documentElement.style.setProperty('--text-secondary', '#5f6368');
        } else {
            icon.className = 'fas fa-moon';
            document.documentElement.style.setProperty('--void-black', '#020204');
            document.documentElement.style.setProperty('--text-primary', '#ffffff');
            document.documentElement.style.setProperty('--text-secondary', '#a0a0a0');
        }
        this.playSound('click');
    }

    scrollToBottom() {
        setTimeout(() => {
            this.chatMessages.scrollTo({
                top: this.chatMessages.scrollHeight,
                behavior: 'smooth'
            });
        }, 100);
    }

    renderMathJax() {
        if (window.MathJax) {
            setTimeout(() => {
                window.MathJax.typesetPromise().catch(err => console.log('MathJax error:', err));
            }, 500);
        }
    }

    escapeHtml(text) {
        if (!text) return '';
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    markdownToHtml(text) {
        if (!text) return '';
        
        return text
            .replace(/\\n/g, '<br>')
            .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
            .replace(/\*(.*?)\*/g, '<em>$1</em>')
            .replace(/`(.*?)`/g, '<code>$1</code>')
            .replace(/^### (.*?)$/gm, '<h3>$1</h3>')
            .replace(/^## (.*?)$/gm, '<h2>$1</h2>')
            .replace(/^# (.*?)$/gm, '<h1>$1</h1>')
            .replace(/^\d+\. (.*?)$/gm, '<li>$1</li>')
            .replace(/^- (.*?)$/gm, '<li>$1</li>')
            .replace(/\$\$(.*?)\$\$/g, '$$$1$$')
            .replace(/\$(.*?)\$/g, '$$$1$$');
    }

    generateLocalDossier(topic) {
        return {
            content: `# COMPREHENSIVE ANALYSIS: ${topic.toUpperCase()}

## 🚀 EXECUTIVE SUMMARY

${topic} represents a critical domain of study with applications across multiple disciplines. This local analysis provides foundational understanding.

## 📖 DEEP DIVE LECTURE

### Foundational Principles
The study of ${topic} rests on several core axioms:

1. **Principle of Operation**: Systems evolve according to fundamental laws
2. **Conservation Principles**: Key quantities remain invariant
3. **Symmetry Considerations**: Physical laws exhibit invariance properties

### Mathematical Formalism
Key equations include:

$$
\\frac{dx}{dt} = f(x, t)
$$

Where system evolution depends on current state and time.

## 🧠 TOPPER MENTAL MODELS

### Visualization Techniques
Create mental maps connecting related concepts.

### Chunking Strategy
Group concepts into meaningful units for easier recall.

## ⚠️ THE TRAP ZONE

### Common Error: Oversimplification
Complex systems often require nuanced understanding.

### Solution: Systematic Analysis
Break problems into components, analyze each part, then synthesize.

## 🧪 EXAM SIMULATION

### Question 1
**Problem**: Explain core principles of ${topic}.

**Solution**: Systematic analysis reveals interconnected theoretical frameworks...

**Difficulty**: 7/10

## 🌍 REAL WORLD APPLICATIONS

- Research and development
- Technological innovation
- Problem-solving frameworks

---

*Generated by Savoiré Omega Local Synthesis • ${new Date().toLocaleString()}*`,
            model_used: 'LOCAL_FALLBACK',
            provider: 'Emergency Protocol',
            generated_at: new Date().toISOString(),
            word_count: 450,
            is_fallback: true
        };
    }
}

// ============================================
// TYPEWRITER CLASS
// ============================================
class TypeWriter {
    constructor(element, text, speed = 20, onChar = () => {}, onComplete = () => {}) {
        this.element = element;
        this.text = text;
        this.speed = speed;
        this.onChar = onChar;
        this.onComplete = onComplete;
        
        this.index = 0;
        this.isTyping = false;
        this.timer = null;
    }
    
    start() {
        if (this.isTyping) return;
        
        this.isTyping = true;
        this.index = 0;
        this.element.innerHTML = '';
        this.type();
    }
    
    type() {
        if (this.index >= this.text.length) {
            this.complete();
            return;
        }
        
        let char = this.text.charAt(this.index);
        this.index++;
        
        // Handle HTML tags
        if (char === '<') {
            const tagEnd = this.text.indexOf('>', this.index);
            if (tagEnd !== -1) {
                char = this.text.substring(this.index - 1, tagEnd + 1);
                this.index = tagEnd + 1;
            }
        }
        
        // Handle LaTeX
        if (char === '$' && this.text.charAt(this.index) === '$') {
            const mathEnd = this.text.indexOf('$$', this.index + 1);
            if (mathEnd !== -1) {
                char = this.text.substring(this.index - 1, mathEnd + 2);
                this.index = mathEnd + 2;
            }
        } else if (char === '$') {
            const mathEnd = this.text.indexOf('$', this.index);
            if (mathEnd !== -1) {
                char = this.text.substring(this.index - 1, mathEnd + 1);
                this.index = mathEnd + 1;
            }
        }
        
        this.element.innerHTML += char;
        
        // Callback every few characters
        if (this.index % 3 === 0) {
            this.onChar();
        }
        
        this.timer = setTimeout(() => this.type(), this.speed);
    }
    
    skip() {
        if (this.timer) {
            clearTimeout(this.timer);
        }
        
        this.element.innerHTML = this.text;
        this.isTyping = false;
        this.complete();
    }
    
    complete() {
        this.isTyping = false;
        this.onComplete();
    }
}

// ============================================
// INITIALIZATION
// ============================================
document.addEventListener('DOMContentLoaded', () => {
    // Add toast styles
    const style = document.createElement('style');
    style.textContent = `
        .omega-toast {
            position: fixed;
            bottom: 100px;
            left: 50%;
            transform: translateX(-50%) translateY(100px);
            background: rgba(0, 243, 255, 0.1);
            backdrop-filter: blur(20px);
            border: 1px solid rgba(0, 243, 255, 0.3);
            border-radius: 12px;
            padding: 12px 20px;
            color: var(--text-primary);
            font-family: var(--font-mono);
            font-size: 0.9rem;
            z-index: 10000;
            opacity: 0;
            transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
            max-width: 90%;
            text-align: center;
        }
        
        .omega-toast.show {
            transform: translateX(-50%) translateY(0);
            opacity: 1;
        }
        
        .toast-content {
            display: flex;
            align-items: center;
            gap: 10px;
        }
        
        .toast-content i {
            color: var(--cyber-blue);
        }
        
        .error-message {
            background: rgba(255, 55, 95, 0.1);
            border: 1px solid rgba(255, 55, 95, 0.3);
            border-radius: var(--radius-md);
            padding: var(--space-md);
            margin: var(--space-md) 0;
        }
        
        .error-message h3 {
            color: var(--alert-red);
            margin-bottom: var(--space-sm);
        }
        
        .expanded {
            border-color: var(--cyber-blue) !important;
            box-shadow: 0 0 40px rgba(0, 243, 255, 0.3) !important;
        }
        
        .light-mode {
            --void-black: #f5f5f5;
            --void-surface: #ffffff;
            --text-primary: #202124;
            --text-secondary: #5f6368;
            --glass-bg: rgba(0, 0, 0, 0.03);
            --glass-border: rgba(0, 0, 0, 0.08);
        }
    `;
    document.head.appendChild(style);
    
    // Initialize app
    window.omega = new SavoireOmega();
    console.log('Savoiré Omega Online');
    console.log('Professor X Protocol Active');
    console.log('Multi-Model Failover System Ready');
});
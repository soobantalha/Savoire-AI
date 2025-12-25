// ============================================
// SAVOIRÉ AI - NEURAL LOGIC CORE
// Ultra-High-Fidelity Cybernetic Interface
// ============================================

class CyberneticAI {
    constructor() {
        // Core State
        this.isGenerating = false;
        this.currentTypewriter = null;
        this.conversationHistory = [];
        this.soundEnabled = true;
        this.theme = 'void';
        
        // Initialize Systems
        this.initNeuralCanvas();
        this.initSoundEngine();
        this.initElements();
        this.bindEvents();
        this.initAnimations();
        
        // Welcome
        this.playSound('hover');
        setTimeout(() => {
            this.playSound('click');
        }, 300);
    }

    // ============================================
    // NEURAL CANVAS - Particle Network
    // ============================================
    initNeuralCanvas() {
        this.canvas = document.getElementById('neuralCanvas');
        this.ctx = this.canvas.getContext('2d');
        this.particles = [];
        this.connections = [];
        this.mouse = { x: 0, y: 0 };
        this.frameCount = 0;
        
        this.resizeCanvas();
        window.addEventListener('resize', () => this.resizeCanvas());
        window.addEventListener('mousemove', (e) => this.onMouseMove(e));
        
        this.createParticles();
        this.animateCanvas();
    }

    resizeCanvas() {
        this.canvas.width = window.innerWidth;
        this.canvas.height = window.innerHeight;
    }

    onMouseMove(e) {
        this.mouse.x = e.clientX;
        this.mouse.y = e.clientY;
    }

    createParticles() {
        const count = Math.min(80, Math.floor(window.innerWidth / 20));
        this.particles = [];
        
        for (let i = 0; i < count; i++) {
            this.particles.push({
                x: Math.random() * this.canvas.width,
                y: Math.random() * this.canvas.height,
                vx: (Math.random() - 0.5) * 0.5,
                vy: (Math.random() - 0.5) * 0.5,
                radius: Math.random() * 1.5 + 0.5,
                color: Math.random() > 0.5 ? '#00f3ff' : '#7000ff',
                opacity: Math.random() * 0.5 + 0.3,
                connections: []
            });
        }
    }

    animateCanvas() {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        this.frameCount++;
        
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
                particle.vx += dx * 0.0001;
                particle.vy += dy * 0.0001;
            }
            
            // Draw particle
            this.ctx.beginPath();
            this.ctx.arc(particle.x, particle.y, particle.radius, 0, Math.PI * 2);
            this.ctx.fillStyle = particle.color;
            this.ctx.globalAlpha = particle.opacity;
            this.ctx.fill();
            
            // Store connections for this frame
            particle.connections = [];
        });
        
        // Draw connections
        this.ctx.globalAlpha = 0.15;
        this.ctx.strokeStyle = '#00f3ff';
        this.ctx.lineWidth = 0.5;
        
        for (let i = 0; i < this.particles.length; i++) {
            for (let j = i + 1; j < this.particles.length; j++) {
                const p1 = this.particles[i];
                const p2 = this.particles[j];
                
                const dx = p1.x - p2.x;
                const dy = p1.y - p2.y;
                const distance = Math.sqrt(dx * dx + dy * dy);
                
                if (distance < 100) {
                    // Dynamic opacity based on distance and mouse
                    const mouseDistance = Math.min(
                        Math.sqrt((this.mouse.x - (p1.x + p2.x) / 2) ** 2 + 
                                 (this.mouse.y - (p1.y + p2.y) / 2) ** 2),
                        200
                    );
                    
                    const opacity = (1 - distance / 100) * (1 - mouseDistance / 200) * 0.5;
                    
                    this.ctx.beginPath();
                    this.ctx.moveTo(p1.x, p1.y);
                    this.ctx.lineTo(p2.x, p2.y);
                    this.ctx.strokeStyle = `rgba(0, 243, 255, ${opacity})`;
                    this.ctx.stroke();
                    
                    p1.connections.push(j);
                    p2.connections.push(i);
                }
            }
        }
        
        // Draw mouse connections
        this.ctx.globalAlpha = 0.2;
        this.ctx.strokeStyle = '#7000ff';
        
        this.particles.forEach(particle => {
            const dx = this.mouse.x - particle.x;
            const dy = this.mouse.y - particle.y;
            const distance = Math.sqrt(dx * dx + dy * dy);
            
            if (distance < 120) {
                this.ctx.beginPath();
                this.ctx.moveTo(particle.x, particle.y);
                this.ctx.lineTo(this.mouse.x, this.mouse.y);
                this.ctx.strokeStyle = `rgba(112, 0, 255, ${0.3 * (1 - distance / 120)})`;
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
            sound.volume = 0.3;
            sound.load();
        });
    }

    playSound(soundName) {
        if (!this.soundEnabled) return;
        
        const sound = this.sounds[soundName];
        if (sound) {
            sound.currentTime = 0;
            sound.play().catch(e => console.log('Sound play failed:', e));
        }
    }

    toggleSound() {
        this.soundEnabled = !this.soundEnabled;
        const icon = document.querySelector('#soundToggle i');
        icon.className = this.soundEnabled ? 'fas fa-volume-up' : 'fas fa-volume-mute';
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
        
        // Quick query chips
        this.queryChips = document.querySelectorAll('.query-chip');
        
        // Initialize MathJax
        if (window.MathJax) {
            window.MathJax.typesetClear();
        }
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
        
        // Quick query chips
        this.queryChips.forEach(chip => {
            chip.addEventListener('click', (e) => {
                const query = e.currentTarget.getAttribute('data-query');
                this.messageInput.value = query;
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
        document.getElementById('voiceInput').addEventListener('click', () => {
            this.showToast('Voice input coming in next update');
        });
        
        document.getElementById('attachFile').addEventListener('click', () => {
            this.showToast('File attachment coming in next update');
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
            
            if (!response.ok) throw new Error(`API Error: ${response.status}`);
            
            const studyData = await response.json();
            this.hideThinking();
            this.displayStudyDossier(studyData);
            
        } catch (error) {
            console.error('API Error:', error);
            this.hideThinking();
            this.showError('Neural synthesis disrupted. Using local knowledge base...');
            
            // Fallback after delay
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
                        <div class="message-sender">PROFESSOR X-ALPHA</div>
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

    displayStudyDossier(dossier) {
        // Hide PDF section initially
        this.pdfSection.style.display = 'none';
        
        // Create AI message
        const aiMessage = this.addMessage('', 'ai');
        const responseElement = aiMessage.querySelector('#aiResponseContent');
        
        // Format dossier
        const formattedContent = this.formatDossier(dossier);
        
        // Start typewriter effect
        this.currentTypewriter = new TypeWriter(
            responseElement, 
            formattedContent, 
            {
                speed: 10,
                onChar: () => {
                    this.playSound('type');
                    this.scrollToBottom();
                },
                onComplete: () => {
                    this.playSound('success');
                    this.showPDFSection();
                    this.renderMathJax();
                }
            }
        );
        
        // Add skip button
        const skipBtn = this.createSkipButton();
        aiMessage.querySelector('.ai-bubble').appendChild(skipBtn);
        
        // Start typing
        this.currentTypewriter.start();
    }

    formatDossier(dossier) {
        if (dossier.error) {
            return `<div class="error-message">
                <h3><i class="fas fa-exclamation-triangle"></i> SYSTEM ALERT</h3>
                <p>${this.escapeHtml(dossier.error)}</p>
                <p>Fallback analysis engaged...</p>
            </div>`;
        }
        
        let html = `<div class="dossier-container">`;
        
        // Header
        html += `
            <div class="dossier-header">
                <h1 class="dossier-title">${this.escapeHtml(dossier.topic)}</h1>
                <div class="dossier-meta">
                    <div class="meta-item">
                        <i class="fas fa-brain"></i>
                        <span>MASTERY SCORE: ${dossier.stats?.mastery_score || 95}/100</span>
                    </div>
                    <div class="meta-item">
                        <i class="fas fa-clock"></i>
                        <span>${dossier.stats?.estimated_study_hours || 30} HOURS</span>
                    </div>
                    <div class="meta-item">
                        <i class="fas fa-layer-group"></i>
                        <span>${dossier.metadata?.word_count || 3000}+ WORDS</span>
                    </div>
                </div>
            </div>
        `;
        
        // Executive Summary
        if (dossier.content?.executive_summary) {
            html += `
                <div class="dossier-section">
                    <h2 class="section-title">
                        <i class="fas fa-scroll"></i>
                        EXECUTIVE SUMMARY
                    </h2>
                    <div class="section-content">
                        ${this.markdownToHtml(dossier.content.executive_summary)}
                    </div>
                </div>
            `;
        }
        
        // Deep Dive Lecture
        if (dossier.content?.deep_dive_lecture) {
            html += `
                <div class="dossier-section">
                    <h2 class="section-title">
                        <i class="fas fa-graduation-cap"></i>
                        COMPREHENSIVE LECTURE
                    </h2>
                    <div class="section-content">
                        ${this.markdownToHtml(dossier.content.deep_dive_lecture)}
                    </div>
                </div>
            `;
        }
        
        // Key Formulas & Concepts
        if (dossier.content?.key_formulas_concepts?.length > 0) {
            html += `
                <div class="dossier-section">
                    <h2 class="section-title">
                        <i class="fas fa-square-root-alt"></i>
                        KEY FORMULAS & CONCEPTS
                    </h2>
                    <div class="concept-grid">
            `;
            
            dossier.content.key_formulas_concepts.forEach((item, index) => {
                html += `
                    <div class="concept-card glass-panel-thin">
                        <div class="concept-header">
                            <span class="concept-number">${index + 1}</span>
                            <h3>${this.escapeHtml(item.name)}</h3>
                        </div>
                        <div class="concept-formula">
                            ${item.latex || '$$\\text{Formula}$$'}
                        </div>
                        <div class="concept-explanation">
                            ${this.escapeHtml(item.explanation)}
                        </div>
                        ${item.example ? `
                            <div class="concept-example">
                                <strong>Example:</strong> ${this.escapeHtml(item.example)}
                            </div>
                        ` : ''}
                    </div>
                `;
            });
            
            html += `</div></div>`;
        }
        
        // Memorization Tricks
        if (dossier.content?.memorization_tricks?.length > 0) {
            html += `
                <div class="dossier-section">
                    <h2 class="section-title">
                        <i class="fas fa-lightbulb"></i>
                        TOPPER SECRETS & MNEMONICS
                    </h2>
                    <div class="trick-grid">
            `;
            
            dossier.content.memorization_tricks.forEach((trick, index) => {
                html += `
                    <div class="trick-card glass-panel-thin">
                        <div class="trick-header">
                            <span class="trick-icon">💡</span>
                            <h3>${this.escapeHtml(trick.name)}</h3>
                            <span class="trick-rating">${trick.effectiveness}</span>
                        </div>
                        <div class="trick-description">
                            ${this.escapeHtml(trick.description)}
                        </div>
                    </div>
                `;
            });
            
            html += `</div></div>`;
        }
        
        // Real World Applications
        if (dossier.content?.real_world_applications?.length > 0) {
            html += `
                <div class="dossier-section">
                    <h2 class="section-title">
                        <i class="fas fa-globe"></i>
                        REAL-WORLD APPLICATIONS
                    </h2>
                    <div class="application-grid">
            `;
            
            dossier.content.real_world_applications.forEach((app, index) => {
                html += `
                    <div class="application-card glass-panel-thin">
                        <div class="app-domain">
                            <i class="fas fa-industry"></i>
                            <span>${this.escapeHtml(app.domain)}</span>
                        </div>
                        <h4>${this.escapeHtml(app.application)}</h4>
                        <div class="app-impact">
                            ${this.escapeHtml(app.impact)}
                        </div>
                    </div>
                `;
            });
            
            html += `</div></div>`;
        }
        
        // Pitfall Analysis
        if (dossier.content?.pitfall_analysis?.length > 0) {
            html += `
                <div class="dossier-section">
                    <h2 class="section-title">
                        <i class="fas fa-exclamation-triangle"></i>
                        PITFALL ANALYSIS
                    </h2>
                    <div class="pitfall-grid">
            `;
            
            dossier.content.pitfall_analysis.forEach((pitfall, index) => {
                html += `
                    <div class="pitfall-card glass-panel-thin">
                        <div class="pitfall-header">
                            <span class="pitfall-number">⚠️</span>
                            <h3>${this.escapeHtml(pitfall.pitfall)}</h3>
                        </div>
                        <div class="pitfall-wrong">
                            <strong>Why Wrong:</strong> ${this.escapeHtml(pitfall.why_wrong)}
                        </div>
                        <div class="pitfall-correct">
                            <strong>Correct Approach:</strong> ${this.escapeHtml(pitfall.correct_approach)}
                        </div>
                    </div>
                `;
            });
            
            html += `</div></div>`;
        }
        
        // Exam Questions
        if (dossier.content?.exam_questions?.length > 0) {
            html += `
                <div class="dossier-section">
                    <h2 class="section-title">
                        <i class="fas fa-file-alt"></i>
                        EXAM SIMULATION (${dossier.content.exam_questions.length} Questions)
                    </h2>
                    <div class="question-grid">
            `;
            
            dossier.content.exam_questions.forEach((q, index) => {
                html += `
                    <div class="question-card glass-panel-thin">
                        <div class="question-header">
                            <span class="question-number">Q${index + 1}</span>
                            <span class="question-difficulty">
                                Difficulty: ${'★'.repeat(q.difficulty || 5)}${'☆'.repeat(10 - (q.difficulty || 5))}
                            </span>
                            <span class="question-time">${q.time_estimate || '15 min'}</span>
                        </div>
                        <div class="question-text">
                            ${this.markdownToHtml(q.question)}
                        </div>
                        <details class="question-solution">
                            <summary>View Solution</summary>
                            <div class="solution-content">
                                ${this.markdownToHtml(q.answer)}
                                ${q.common_errors?.length > 0 ? `
                                    <div class="common-errors">
                                        <strong>Common Errors:</strong>
                                        <ul>
                                            ${q.common_errors.map(err => `<li>${this.escapeHtml(err)}</li>`).join('')}
                                        </ul>
                                    </div>
                                ` : ''}
                            </div>
                        </details>
                    </div>
                `;
            });
            
            html += `</div></div>`;
        }
        
        // Further Exploration
        if (dossier.content?.further_exploration) {
            html += `
                <div class="dossier-section">
                    <h2 class="section-title">
                        <i class="fas fa-rocket"></i>
                        FURTHER EXPLORATION
                    </h2>
                    <div class="exploration-content">
            `;
            
            const explore = dossier.content.further_exploration;
            
            if (explore.books?.length > 0) {
                html += `
                    <h4><i class="fas fa-book"></i> Recommended Books:</h4>
                    <ul>
                        ${explore.books.map(book => `<li>${this.escapeHtml(book)}</li>`).join('')}
                    </ul>
                `;
            }
            
            if (explore.papers?.length > 0) {
                html += `
                    <h4><i class="fas fa-file-alt"></i> Research Papers:</h4>
                    <ul>
                        ${explore.papers.map(paper => `<li>${this.escapeHtml(paper)}</li>`).join('')}
                    </ul>
                `;
            }
            
            if (explore.courses?.length > 0) {
                html += `
                    <h4><i class="fas fa-university"></i> Online Courses:</h4>
                    <ul>
                        ${explore.courses.map(course => `<li>${this.escapeHtml(course)}</li>`).join('')}
                    </ul>
                `;
            }
            
            if (explore.tools?.length > 0) {
                html += `
                    <h4><i class="fas fa-tools"></i> Software Tools:</h4>
                    <ul>
                        ${explore.tools.map(tool => `<li>${this.escapeHtml(tool)}</li>`).join('')}
                    </ul>
                `;
            }
            
            html += `</div></div>`;
        }
        
        // Footer
        html += `
            <div class="dossier-footer">
                <div class="footer-meta">
                    <div class="meta-item">
                        <i class="fas fa-cube"></i>
                        <span>Generated by <a href="https://soobantalhatech.xyz" target="_blank">Sooban Talha Technologies</a></span>
                    </div>
                    <div class="meta-item">
                        <i class="fas fa-robot"></i>
                        <span>Professor X-Alpha Model v2.0</span>
                    </div>
                    <div class="meta-item">
                        <i class="fas fa-calendar"></i>
                        <span>${new Date(dossier.generated_at || new Date()).toLocaleString()}</span>
                    </div>
                </div>
            </div>
        `;
        
        html += `</div>`;
        return html;
    }

    // ============================================
    // TYPEWRITER SYSTEM
    // ============================================
    createSkipButton() {
        const skipBtn = document.createElement('button');
        skipBtn.className = 'cyber-button skip-button';
        skipBtn.innerHTML = '<i class="fas fa-forward"></i> SKIP ANIMATION';
        skipBtn.style.marginTop = '1rem';
        skipBtn.style.fontSize = '0.9rem';
        skipBtn.style.padding = '0.5rem 1rem';
        
        skipBtn.addEventListener('click', () => {
            if (this.currentTypewriter) {
                this.currentTypewriter.skip();
                skipBtn.remove();
            }
        });
        
        return skipBtn;
    }

    // ============================================
    // PDF GENERATION ENGINE
    // ============================================
    async generatePremiumPDF() {
        this.playSound('click');
        
        // Show generating indicator
        const originalText = this.downloadPDFBtn.innerHTML;
        this.downloadPDFBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> GENERATING PDF...';
        this.downloadPDFBtn.disabled = true;
        
        try {
            const { jsPDF } = window.jspdf;
            const doc = new jsPDF({
                orientation: 'portrait',
                unit: 'mm',
                format: 'a4',
                putOnlyUsedFonts: true,
                floatPrecision: 16
            });
            
            // Set PDF metadata
            doc.setProperties({
                title: `Savoiré AI Dossier - ${this.getCurrentTopic()}`,
                subject: 'Comprehensive Study Dossier',
                author: 'Sooban Talha Technologies',
                keywords: 'education, ai, study, learning',
                creator: 'Savoiré AI Neural Matrix'
            });
            
            const pageWidth = doc.internal.pageSize.getWidth();
            const pageHeight = doc.internal.pageSize.getHeight();
            const margin = 15;
            let yPos = margin;
            let currentPage = 1;
            
            // ========== COVER PAGE ==========
            // Black background
            doc.setFillColor(5, 5, 10);
            doc.rect(0, 0, pageWidth, pageHeight, 'F');
            
            // Gold border
            doc.setDrawColor(255, 215, 0);
            doc.setLineWidth(1);
            doc.rect(margin, margin, pageWidth - 2 * margin, pageHeight - 2 * margin);
            
            // Title
            doc.setTextColor(255, 215, 0);
            doc.setFontSize(36);
            doc.setFont('helvetica', 'bold');
            doc.text('SAVOIRÉ AI', pageWidth / 2, 60, { align: 'center' });
            
            // Subtitle
            doc.setTextColor(0, 243, 255);
            doc.setFontSize(18);
            doc.text('NEURAL EDUCATION MATRIX', pageWidth / 2, 80, { align: 'center' });
            
            // Divider
            doc.setDrawColor(0, 243, 255);
            doc.setLineWidth(0.5);
            doc.line(margin + 20, 90, pageWidth - margin - 20, 90);
            
            // Topic
            doc.setTextColor(255, 255, 255);
            doc.setFontSize(28);
            doc.text(this.getCurrentTopic().toUpperCase(), pageWidth / 2, 120, { align: 'center' });
            
            // Logo area
            doc.setFillColor(0, 243, 255, 0.1);
            doc.circle(pageWidth / 2, 160, 30, 'F');
            doc.setTextColor(0, 243, 255);
            doc.setFontSize(24);
            doc.text('⚡', pageWidth / 2, 165, { align: 'center' });
            
            // Authorized by
            doc.setTextColor(255, 255, 255);
            doc.setFontSize(12);
            doc.text('AUTHORIZED EDITION', pageWidth / 2, 200, { align: 'center' });
            
            doc.setTextColor(255, 215, 0);
            doc.setFontSize(10);
            doc.textWithLink('Sooban Talha Technologies', pageWidth / 2, 210, { 
                align: 'center',
                url: 'https://soobantalhatech.xyz'
            });
            
            // Generation info
            doc.setTextColor(150, 150, 150);
            doc.setFontSize(8);
            doc.text(`Generated: ${new Date().toLocaleString()}`, pageWidth / 2, 250, { align: 'center' });
            doc.text('Professor X-Alpha Model • 3000+ Word Analysis', pageWidth / 2, 255, { align: 'center' });
            
            // Page number
            doc.setTextColor(100, 100, 100);
            doc.text(`Page ${currentPage}`, pageWidth / 2, pageHeight - margin, { align: 'center' });
            
            // ========== CONTENT PAGES ==========
            const messages = this.chatMessages.querySelectorAll('.ai-bubble .dossier-container');
            if (messages.length > 0) {
                const latestDossier = messages[messages.length - 1];
                
                // Convert to canvas for better formatting
                const canvas = await html2canvas(latestDossier, {
                    scale: 2,
                    useCORS: true,
                    backgroundColor: '#020204'
                });
                
                // Add new page for content
                doc.addPage();
                currentPage++;
                yPos = margin;
                
                // Add content header
                doc.setTextColor(0, 243, 255);
                doc.setFontSize(16);
                doc.setFont('helvetica', 'bold');
                doc.text('COMPREHENSIVE STUDY DOSSIER', pageWidth / 2, yPos, { align: 'center' });
                yPos += 10;
                
                doc.setDrawColor(0, 243, 255);
                doc.setLineWidth(0.3);
                doc.line(margin, yPos, pageWidth - margin, yPos);
                yPos += 15;
                
                // Add canvas image (scaled to fit)
                const imgWidth = pageWidth - 2 * margin;
                const imgHeight = (canvas.height * imgWidth) / canvas.width;
                
                // Split across multiple pages if needed
                let imgY = yPos;
                let remainingHeight = imgHeight;
                const maxPageHeight = pageHeight - margin - 20; // Leave space for footer
                
                while (remainingHeight > 0) {
                    const pageImgHeight = Math.min(remainingHeight, maxPageHeight - imgY);
                    
                    doc.addImage(canvas, 'PNG', margin, imgY, imgWidth, imgHeight, 
                                undefined, 'FAST', 0);
                    
                    remainingHeight -= pageImgHeight;
                    
                    if (remainingHeight > 0) {
                        doc.addPage();
                        currentPage++;
                        imgY = margin;
                        
                        // Add continuation header
                        doc.setTextColor(100, 100, 100);
                        doc.setFontSize(10);
                        doc.setFont('helvetica', 'italic');
                        doc.text(`(Continued) ${this.getCurrentTopic()}`, margin, imgY - 5);
                    }
                }
            }
            
            // ========== ADD FOOTER TO ALL PAGES ==========
            const totalPages = doc.internal.getNumberOfPages();
            
            for (let i = 1; i <= totalPages; i++) {
                doc.setPage(i);
                
                // Footer line
                doc.setDrawColor(0, 243, 255, 0.3);
                doc.setLineWidth(0.2);
                doc.line(margin, pageHeight - margin + 5, pageWidth - margin, pageHeight - margin + 5);
                
                // Page number
                doc.setTextColor(100, 100, 100);
                doc.setFontSize(8);
                doc.text(`Page ${i} of ${totalPages}`, pageWidth / 2, pageHeight - margin + 10, { align: 'center' });
                
                // Copyright and link
                doc.setTextColor(150, 150, 150);
                doc.setFontSize(7);
                doc.textWithLink('Powered by Sooban Talha Technologies', pageWidth / 2, pageHeight - margin + 15, {
                    align: 'center',
                    url: 'https://soobantalhatech.xyz'
                });
                
                doc.text(`Generated by Savoiré AI • ${new Date().toLocaleDateString()}`, pageWidth / 2, pageHeight - margin + 19, { align: 'center' });
            }
            
            // Save PDF
            const fileName = `SavoireAI_Dossier_${this.getCurrentTopic().replace(/[^a-zA-Z0-9]/g, '_')}_${Date.now()}.pdf`;
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
        const lastMessage = this.conversationHistory
            .filter(msg => msg.type === 'user')
            .pop();
        return lastMessage?.content || 'Study Topic';
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
                <h3><i class="fas fa-exclamation-circle"></i> SYSTEM NOTIFICATION</h3>
                <p>${this.escapeHtml(message)}</p>
                <p>Engaging local knowledge synthesis...</p>
            </div>
        `;
        this.addMessage(errorMessage, 'ai');
    }

    showToast(message) {
        // Create toast element
        const toast = document.createElement('div');
        toast.className = 'cyber-toast';
        toast.innerHTML = `
            <div class="toast-content">
                <i class="fas fa-info-circle"></i>
                <span>${this.escapeHtml(message)}</span>
            </div>
        `;
        
        document.body.appendChild(toast);
        
        // Show with animation
        setTimeout(() => toast.classList.add('show'), 10);
        
        // Remove after delay
        setTimeout(() => {
            toast.classList.remove('show');
            setTimeout(() => toast.remove(), 300);
        }, 3000);
    }

    clearChat() {
        this.playSound('click');
        
        // Animation
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
        this.theme = this.theme === 'void' ? 'light' : 'void';
        document.body.setAttribute('data-theme', this.theme);
        
        const icon = this.themeToggle.querySelector('i');
        icon.className = this.theme === 'void' ? 'fas fa-moon' : 'fas fa-sun';
        
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
                window.MathJax.typesetClear();
                window.MathJax.typeset();
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
            .replace(/!\[(.*?)\]\((.*?)\)/g, '<img alt="$1" src="$2">')
            .replace(/\[(.*?)\]\((.*?)\)/g, '<a href="$2" target="_blank">$1</a>')
            .replace(/^### (.*?)$/gm, '<h3>$1</h3>')
            .replace(/^## (.*?)$/gm, '<h2>$1</h2>')
            .replace(/^# (.*?)$/gm, '<h1>$1</h1>')
            .replace(/^\d+\. (.*?)$/gm, '<li>$1</li>')
            .replace(/^- (.*?)$/gm, '<li>$1</li>')
            .replace(/\$\$(.*?)\$\$/g, '$$$1$$') // Preserve LaTeX
            .replace(/\$(.*?)\$/g, '$$$1$$');   // Preserve inline math
    }

    generateLocalDossier(topic) {
        // Simple local fallback
        return {
            topic: topic,
            stats: {
                difficulty: "Advanced",
                mastery_score: 92,
                estimated_study_hours: 25
            },
            content: {
                executive_summary: `Local analysis of ${topic} reveals complex interrelationships requiring systematic study. This dossier provides foundational understanding through rigorous examination of core principles, practical applications, and advanced theoretical frameworks.`,
                deep_dive_lecture: `# LOCAL KNOWLEDGE SYNTHESIS: ${topic.toUpperCase()}

## Core Analysis
${topic} represents a domain of study with significant theoretical depth and practical applications. Mastery requires understanding of:

1. **Fundamental Principles**
   - Axiomatic foundations
   - Mathematical formalisms
   - Empirical validations

2. **Advanced Concepts**
   - Theoretical extensions
   - Methodological innovations
   - Interdisciplinary connections

3. **Practical Implementation**
   - Real-world applications
   - Problem-solving strategies
   - Optimization techniques

## Learning Pathway
Systematic study should proceed through sequential mastery of:
- Foundational definitions and axioms
- Core theorems and proofs
- Application methodologies
- Advanced research frontiers

## Key Insights
Success in ${topic} requires:
- Strong mathematical foundation
- Critical thinking skills
- Systematic problem-solving approach
- Continuous knowledge integration`,
                key_formulas_concepts: [
                    {
                        name: "Fundamental Equation",
                        latex: "$$A = \\pi r^2$$",
                        explanation: "Basic area calculation",
                        example: "Circle with radius 5 has area 78.54"
                    }
                ],
                memorization_tricks: [
                    {
                        name: "Concept Mapping",
                        description: "Create visual diagrams connecting related ideas",
                        effectiveness: "8/10"
                    }
                ],
                real_world_applications: [
                    {
                        domain: "General",
                        application: "Problem solving and analysis",
                        impact: "Improved decision making"
                    }
                ],
                pitfall_analysis: [
                    {
                        pitfall: "Overgeneralization",
                        why_wrong: "Applying specific cases too broadly",
                        correct_approach: "Careful consideration of boundary conditions"
                    }
                ],
                exam_questions: [
                    {
                        question: "Explain the core principles of " + topic,
                        answer: "The core principles establish foundational understanding through systematic analysis of fundamental relationships and practical implementations.",
                        difficulty: 6,
                        time_estimate: "15 minutes",
                        common_errors: ["Oversimplification", "Missing key connections"]
                    }
                ]
            },
            metadata: {
                generated_at: new Date().toISOString(),
                model: "Local Knowledge Base",
                word_count: 1200
            }
        };
    }

    initAnimations() {
        // Add CSS for toast
        const toastStyle = document.createElement('style');
        toastStyle.textContent = `
            .cyber-toast {
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
            
            .cyber-toast.show {
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
            
            .skip-button {
                animation: pulse 2s infinite;
            }
            
            @keyframes pulse {
                0%, 100% { opacity: 1; }
                50% { opacity: 0.7; }
            }
        `;
        document.head.appendChild(toastStyle);
    }
}

// ============================================
// TYPEWRITER CLASS
// ============================================
class TypeWriter {
    constructor(element, text, options = {}) {
        this.element = element;
        this.text = text;
        this.speed = options.speed || 20;
        this.onChar = options.onChar || (() => {});
        this.onComplete = options.onComplete || (() => {});
        
        this.index = 0;
        this.isTyping = false;
        this.timer = null;
    }
    
    start() {
        if (this.isTyping) return;
        
        this.isTyping = true;
        this.index = 0;
        this.element.innerHTML = '';
        this.typeNextChar();
    }
    
    typeNextChar() {
        if (this.index >= this.text.length) {
            this.complete();
            return;
        }
        
        // Get next character
        let char = this.text.charAt(this.index);
        this.index++;
        
        // Handle HTML tags
        if (char === '<') {
            // Find the closing >
            const tagEnd = this.text.indexOf('>', this.index);
            if (tagEnd !== -1) {
                char = this.text.substring(this.index - 1, tagEnd + 1);
                this.index = tagEnd + 1;
            }
        }
        
        // Handle LaTeX math
        if (char === '$' && this.text.charAt(this.index) === '$') {
            // Find closing $$
            const mathEnd = this.text.indexOf('$$', this.index + 1);
            if (mathEnd !== -1) {
                char = this.text.substring(this.index - 1, mathEnd + 2);
                this.index = mathEnd + 2;
            }
        } else if (char === '$') {
            // Find closing $
            const mathEnd = this.text.indexOf('$', this.index);
            if (mathEnd !== -1) {
                char = this.text.substring(this.index - 1, mathEnd + 1);
                this.index = mathEnd + 1;
            }
        }
        
        // Add character to element
        this.element.innerHTML += char;
        
        // Callback for each character
        if (this.index % 3 === 0) {
            this.onChar();
        }
        
        // Schedule next character
        const delay = char === ' ' ? this.speed / 2 : this.speed;
        this.timer = setTimeout(() => this.typeNextChar(), delay);
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
// INITIALIZE APPLICATION
// ============================================
document.addEventListener('DOMContentLoaded', () => {
    window.savoireAI = new CyberneticAI();
    console.log('Savoiré AI Neural Matrix Online');
    console.log('Professor X-Alpha Model Active');
    console.log('Ready for 3000+ word dossier generation');
});
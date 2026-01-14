/**
 * Savoiré AI v2.0 - The Ultimate Study Station
 * Main Application Class
 * by Sooban Talha Technologies
 */

class SavoireApp {
    constructor() {
        // State Management
        this.state = {
            conversation: [],
            currentModel: 'google/gemini-2.0-flash-exp:free',
            isGenerating: false,
            isFocusMode: false,
            isMusicPlaying: false,
            userName: 'Learner',
            userAvatarColor: '#FFD700',
            systemPrompt: `You are Savoiré AI, an advanced study assistant created by Sooban Talha Technologies. Provide comprehensive, detailed explanations with examples. Use markdown formatting, include code blocks when relevant, and explain concepts step-by-step.`,
            animationsEnabled: true,
            musicEnabled: true,
            history: [],
            pomodoroTime: 25 * 60, // 25 minutes in seconds
            isTimerRunning: false,
            apiStats: {
                calls: 0,
                totalTokens: 0,
                totalLatency: 0,
                errors: 0
            }
        };
        
        // DOM Elements
        this.elements = {};
        
        // Wormhole Particle System
        this.wormhole = null;
        
        // Speech Synthesis
        this.speech = window.speechSynthesis;
        this.currentSpeech = null;
        
        // Initialize
        this.init();
    }
    
    /**
     * Initialize the application
     */
    async init() {
        this.cacheElements();
        this.loadState();
        this.bindEvents();
        this.initWormhole();
        this.initSpeech();
        this.setupKeyboardShortcuts();
        
        // Show cinematic intro
        this.showCinematicIntro();
        
        // Initialize markdown renderer
        marked.setOptions({
            gfm: true,
            breaks: true,
            highlight: function(code, lang) {
                if (Prism.languages[lang]) {
                    return Prism.highlight(code, Prism.languages[lang], lang);
                }
                return code;
            }
        });
        
        // Auto-render KaTeX
        renderMathInElement(document.body, {
            delimiters: [
                {left: '$$', right: '$$', display: true},
                {left: '$', right: '$', display: false},
                {left: '\\(', right: '\\)', display: false},
                {left: '\\[', right: '\\]', display: true}
            ]
        });
        
        // Load history
        this.loadHistory();
        
        // Check first visit
        if (!localStorage.getItem('savoire-first-visit')) {
            setTimeout(() => {
                this.showWelcomeModal();
            }, 4000);
        }
        
        // Initialize custom cursor
        this.initCustomCursor();
        
        // Log initialization
        this.log('INFO', 'Savoiré AI v2.0 initialized');
    }
    
    /**
     * Cache DOM elements
     */
    cacheElements() {
        // Intro Screen
        this.elements.introScreen = document.getElementById('introScreen');
        this.elements.appContainer = document.getElementById('appContainer');
        
        // Header
        this.elements.modelSelect = document.getElementById('modelSelect');
        this.elements.modelStatus = document.getElementById('modelStatus');
        this.elements.timerToggle = document.getElementById('timerToggle');
        this.elements.timerDisplay = document.getElementById('timerDisplay');
        this.elements.timerReset = document.getElementById('timerReset');
        this.elements.focusToggle = document.getElementById('focusToggle');
        this.elements.settingsToggle = document.getElementById('settingsToggle');
        this.elements.historyToggle = document.getElementById('historyToggle');
        this.elements.userAvatar = document.getElementById('userAvatar');
        
        // Main Grid
        this.elements.mainGrid = document.getElementById('mainGrid');
        
        // Chat Pane
        this.elements.clearChatBtn = document.getElementById('clearChatBtn');
        this.elements.chatHistory = document.getElementById('chatHistory');
        this.elements.messageInput = document.getElementById('messageInput');
        this.elements.voiceInputBtn = document.getElementById('voiceInputBtn');
        this.elements.imageUploadBtn = document.getElementById('imageUploadBtn');
        this.elements.imageUpload = document.getElementById('imageUpload');
        this.elements.sendButton = document.getElementById('sendButton');
        this.elements.dropZone = document.getElementById('dropZone');
        
        // Notes Pane
        this.elements.notesContent = document.getElementById('notesContent');
        this.elements.readAloudBtn = document.getElementById('readAloudBtn');
        this.elements.exportPdfBtn = document.getElementById('exportPdfBtn');
        this.elements.fullscreenNotesBtn = document.getElementById('fullscreenNotesBtn');
        
        // Music Player
        this.elements.musicPlayer = document.getElementById('musicPlayer');
        this.elements.playPauseBtn = document.getElementById('playPauseBtn');
        this.elements.volumeToggleBtn = document.getElementById('volumeToggleBtn');
        this.elements.volumeSlider = document.getElementById('volumeSlider');
        this.elements.lofiAudio = document.getElementById('lofiAudio');
        this.elements.playerStatus = document.getElementById('playerStatus');
        
        // Status Bar
        this.elements.tokenCount = document.getElementById('tokenCount');
        this.elements.responseTime = document.getElementById('responseTime');
        
        // Modals & Sidebars
        this.elements.settingsModal = document.getElementById('settingsModal');
        this.elements.settingsClose = document.getElementById('settingsClose');
        this.elements.historySidebar = document.getElementById('historySidebar');
        this.elements.historyClose = document.getElementById('historyClose');
        this.elements.historyList = document.getElementById('historyList');
        this.elements.devConsole = document.getElementById('devConsole');
        this.elements.consoleClose = document.getElementById('consoleClose');
        this.elements.consoleLogs = document.getElementById('consoleLogs');
        this.elements.welcomeModal = document.getElementById('welcomeModal');
        this.elements.welcomeSubmit = document.getElementById('welcomeSubmit');
        this.elements.welcomeNameInput = document.getElementById('welcomeNameInput');
        
        // Settings
        this.elements.userNameInput = document.getElementById('userNameInput');
        this.elements.avatarColorPicker = document.getElementById('avatarColorPicker');
        this.elements.animationsToggle = document.getElementById('animationsToggle');
        this.elements.musicToggle = document.getElementById('musicToggle');
        this.elements.defaultModelSelect = document.getElementById('defaultModelSelect');
        this.elements.systemPromptInput = document.getElementById('systemPromptInput');
        this.elements.saveSettings = document.getElementById('saveSettings');
        this.elements.resetSettings = document.getElementById('resetSettings');
        
        // Developer Console
        this.elements.devConsoleBtn = document.getElementById('devConsoleBtn');
        this.elements.apiCallCount = document.getElementById('apiCallCount');
        this.elements.avgLatency = document.getElementById('avgLatency');
        this.elements.totalTokens = document.getElementById('totalTokens');
        
        // Toast Container
        this.elements.toastContainer = document.getElementById('toastContainer');
    }
    
    /**
     * Bind event listeners
     */
    bindEvents() {
        // Chat Input
        this.elements.messageInput.addEventListener('input', () => this.autoResizeInput());
        this.elements.messageInput.addEventListener('keydown', (e) => this.handleInputKeydown(e));
        this.elements.sendButton.addEventListener('click', () => this.sendMessage());
        
        // Voice Input
        this.elements.voiceInputBtn.addEventListener('click', () => this.toggleVoiceInput());
        
        // Image Upload
        this.elements.imageUploadBtn.addEventListener('click', () => this.elements.imageUpload.click());
        this.elements.imageUpload.addEventListener('change', (e) => this.handleImageUpload(e));
        
        // Drag & Drop
        this.elements.dropZone.addEventListener('dragover', (e) => {
            e.preventDefault();
            this.elements.dropZone.classList.add('active');
        });
        
        this.elements.dropZone.addEventListener('dragleave', () => {
            this.elements.dropZone.classList.remove('active');
        });
        
        this.elements.dropZone.addEventListener('drop', (e) => {
            e.preventDefault();
            this.elements.dropZone.classList.remove('active');
            this.handleImageDrop(e);
        });
        
        // Clear Chat
        this.elements.clearChatBtn.addEventListener('click', () => this.clearChat());
        
        // Model Selection
        this.elements.modelSelect.addEventListener('change', (e) => {
            this.state.currentModel = e.target.value;
            this.showToast('Model Changed', `Switched to ${e.target.selectedOptions[0].text}`, 'info');
            this.log('INFO', `Model changed to: ${this.state.currentModel}`);
        });
        
        // Pomodoro Timer
        this.elements.timerToggle.addEventListener('click', () => this.toggleTimer());
        this.elements.timerReset.addEventListener('click', () => this.resetTimer());
        
        // Focus Mode
        this.elements.focusToggle.addEventListener('click', () => this.toggleFocusMode());
        
        // Settings
        this.elements.settingsToggle.addEventListener('click', () => this.showSettings());
        this.elements.settingsClose.addEventListener('click', () => this.hideSettings());
        
        // Chat History
        this.elements.historyToggle.addEventListener('click', () => this.toggleHistorySidebar());
        this.elements.historyClose.addEventListener('click', () => this.hideHistorySidebar());
        
        // Notes Actions
        this.elements.readAloudBtn.addEventListener('click', () => this.toggleReadAloud());
        this.elements.exportPdfBtn.addEventListener('click', () => this.exportToPDF());
        this.elements.fullscreenNotesBtn.addEventListener('click', () => this.toggleFullscreenNotes());
        
        // Music Player
        this.elements.playPauseBtn.addEventListener('click', () => this.toggleMusic());
        this.elements.volumeToggleBtn.addEventListener('click', () => this.toggleMute());
        this.elements.volumeSlider.addEventListener('input', (e) => {
            this.elements.lofiAudio.volume = e.target.value / 100;
        });
        
        // Welcome Modal
        this.elements.welcomeSubmit.addEventListener('click', () => this.handleWelcomeSubmit());
        this.elements.welcomeNameInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') this.handleWelcomeSubmit();
        });
        
        // Settings Form
        this.elements.saveSettings.addEventListener('click', () => this.saveSettings());
        this.elements.resetSettings.addEventListener('click', () => this.resetSettings());
        
        // Developer Console
        this.elements.devConsoleBtn.addEventListener('click', () => this.showDevConsole());
        this.elements.consoleClose.addEventListener('click', () => this.hideDevConsole());
        
        // User Avatar
        this.elements.userAvatar.addEventListener('click', () => this.showSettings());
        
        // Window Events
        window.addEventListener('beforeunload', () => this.saveState());
        window.addEventListener('resize', () => this.handleResize());
        
        // Speech Events
        this.speech.addEventListener('voiceschanged', () => this.initSpeech());
        
        // Audio Events
        this.elements.lofiAudio.addEventListener('play', () => {
            this.state.isMusicPlaying = true;
            this.updateMusicUI();
        });
        
        this.elements.lofiAudio.addEventListener('pause', () => {
            this.state.isMusicPlaying = false;
            this.updateMusicUI();
        });
        
        // Auto-save settings
        setInterval(() => this.saveState(), 30000);
    }
    
    /**
     * Initialize custom cursor
     */
    initCustomCursor() {
        const cursorDot = document.querySelector('.cursor-dot');
        const cursorTrail = document.querySelector('.cursor-trail');
        
        let mouseX = 0, mouseY = 0;
        let trailX = 0, trailY = 0;
        
        document.addEventListener('mousemove', (e) => {
            mouseX = e.clientX;
            mouseY = e.clientY;
            
            if (this.state.animationsEnabled) {
                cursorDot.style.left = `${mouseX}px`;
                cursorDot.style.top = `${mouseY}px`;
                
                // Smooth trail effect
                trailX += (mouseX - trailX) * 0.1;
                trailY += (mouseY - trailY) * 0.1;
                
                cursorTrail.style.left = `${trailX}px`;
                cursorTrail.style.top = `${trailY}px`;
            }
        });
        
        // Hide cursor on leaving window
        document.addEventListener('mouseleave', () => {
            cursorDot.style.opacity = '0';
            cursorTrail.style.opacity = '0';
        });
        
        document.addEventListener('mouseenter', () => {
            cursorDot.style.opacity = '1';
            cursorTrail.style.opacity = '0.3';
        });
        
        // Interactive elements
        const interactiveElements = document.querySelectorAll('button, input, textarea, select, a');
        interactiveElements.forEach(el => {
            el.addEventListener('mouseenter', () => {
                cursorDot.style.transform = 'translate(-50%, -50%) scale(1.5)';
                cursorTrail.style.transform = 'translate(-50%, -50%) scale(1.2)';
            });
            
            el.addEventListener('mouseleave', () => {
                cursorDot.style.transform = 'translate(-50%, -50%) scale(1)';
                cursorTrail.style.transform = 'translate(-50%, -50%) scale(1)';
            });
        });
    }
    
    /**
     * Show cinematic intro
     */
    showCinematicIntro() {
        setTimeout(() => {
            this.elements.introScreen.style.opacity = '0';
            setTimeout(() => {
                this.elements.introScreen.style.display = 'none';
                this.elements.appContainer.style.display = 'grid';
                
                // Animate in app container
                setTimeout(() => {
                    this.elements.appContainer.style.opacity = '1';
                }, 100);
                
                // Start background music if enabled
                if (this.state.musicEnabled) {
                    setTimeout(() => {
                        this.elements.lofiAudio.play().catch(e => {
                            console.log('Auto-play prevented:', e);
                            this.showToast('Music', 'Click play to start background music', 'info');
                        });
                    }, 1000);
                }
            }, 1000);
        }, 4000); // 4 seconds for intro animation
    }
    
    /**
     * Show welcome modal for first-time users
     */
    showWelcomeModal() {
        this.elements.welcomeModal.classList.add('active');
        this.elements.welcomeNameInput.focus();
    }
    
    /**
     * Handle welcome modal submission
     */
    handleWelcomeSubmit() {
        const name = this.elements.welcomeNameInput.value.trim();
        if (name) {
            this.state.userName = name;
            this.updateUserAvatar();
            localStorage.setItem('savoire-first-visit', 'true');
            this.showToast(`Welcome, ${name}!`, 'Your learning journey begins now.', 'success');
        }
        this.elements.welcomeModal.classList.remove('active');
    }
    
    /**
     * Initialize wormhole particle system
     */
    initWormhole() {
        const canvas = document.getElementById('wormholeCanvas');
        const ctx = canvas.getContext('2d');
        
        // Set canvas size
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
        
        // Particle system
        const particles = [];
        const particleCount = 100;
        
        // Create particles
        for (let i = 0; i < particleCount; i++) {
            particles.push({
                x: Math.random() * canvas.width,
                y: Math.random() * canvas.height,
                size: Math.random() * 2 + 1,
                speedX: Math.random() * 2 - 1,
                speedY: Math.random() * 2 - 1,
                color: `rgba(255, 215, 0, ${Math.random() * 0.3 + 0.1})`
            });
        }
        
        // Mouse position
        let mouseX = canvas.width / 2;
        let mouseY = canvas.height / 2;
        
        canvas.addEventListener('mousemove', (e) => {
            mouseX = e.clientX;
            mouseY = e.clientY;
        });
        
        // Animation loop
        const animate = () => {
            if (!this.state.animationsEnabled) {
                requestAnimationFrame(animate);
                return;
            }
            
            // Clear with fade effect
            ctx.fillStyle = 'rgba(5, 5, 5, 0.1)';
            ctx.fillRect(0, 0, canvas.width, canvas.height);
            
            // Update and draw particles
            particles.forEach(particle => {
                // Move towards mouse (wormhole effect)
                const dx = mouseX - particle.x;
                const dy = mouseY - particle.y;
                const distance = Math.sqrt(dx * dx + dy * dy);
                
                if (distance < 150) {
                    // Suck into wormhole
                    const force = (150 - distance) / 150;
                    particle.x += dx * 0.01 * force;
                    particle.y += dy * 0.01 * force;
                } else {
                    // Normal movement
                    particle.x += particle.speedX;
                    particle.y += particle.speedY;
                }
                
                // Bounce off edges
                if (particle.x < 0 || particle.x > canvas.width) particle.speedX *= -1;
                if (particle.y < 0 || particle.y > canvas.height) particle.speedY *= -1;
                
                // Draw particle
                ctx.beginPath();
                ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
                ctx.fillStyle = particle.color;
                ctx.fill();
                
                // Draw connection lines
                particles.forEach(otherParticle => {
                    const dx = particle.x - otherParticle.x;
                    const dy = particle.y - otherParticle.y;
                    const distance = Math.sqrt(dx * dx + dy * dy);
                    
                    if (distance < 100) {
                        ctx.beginPath();
                        ctx.strokeStyle = `rgba(255, 215, 0, ${0.1 * (1 - distance / 100)})`;
                        ctx.lineWidth = 0.5;
                        ctx.moveTo(particle.x, particle.y);
                        ctx.lineTo(otherParticle.x, otherParticle.y);
                        ctx.stroke();
                    }
                });
            });
            
            requestAnimationFrame(animate);
        };
        
        animate();
        
        // Handle resize
        window.addEventListener('resize', () => {
            canvas.width = window.innerWidth;
            canvas.height = window.innerHeight;
        });
        
        this.wormhole = { canvas, ctx, particles };
    }
    
    /**
     * Initialize speech synthesis
     */
    initSpeech() {
        if ('speechSynthesis' in window) {
            // Get available voices
            const voices = this.speech.getVoices();
            if (voices.length > 0) {
                // Prefer English voices
                const englishVoice = voices.find(voice => voice.lang.startsWith('en')) || voices[0];
                this.speechVoice = englishVoice;
            }
        }
    }
    
    /**
     * Setup keyboard shortcuts
     */
    setupKeyboardShortcuts() {
        document.addEventListener('keydown', (e) => {
            // Ctrl+K for history search
            if (e.ctrlKey && e.key === 'k') {
                e.preventDefault();
                this.toggleHistorySidebar();
                return;
            }
            
            // Ctrl+Enter to send message
            if (e.ctrlKey && e.key === 'Enter') {
                e.preventDefault();
                this.sendMessage();
                return;
            }
            
            // Shift+Enter for new line
            if (e.shiftKey && e.key === 'Enter') {
                // Allow default behavior (new line)
                return;
            }
            
            // Escape to close modals
            if (e.key === 'Escape') {
                this.hideSettings();
                this.hideHistorySidebar();
                this.hideDevConsole();
                return;
            }
            
            // Ctrl+/ for dev console
            if (e.ctrlKey && e.key === '/') {
                e.preventDefault();
                this.toggleDevConsole();
                return;
            }
        });
    }
    
    /**
     * Handle image upload
     */
    handleImageUpload(event) {
        const file = event.target.files[0];
        if (!file) return;
        
        if (!file.type.startsWith('image/')) {
            this.showToast('Invalid File', 'Please upload an image file', 'error');
            return;
        }
        
        this.processImage(file);
    }
    
    /**
     * Handle image drop
     */
    handleImageDrop(event) {
        event.preventDefault();
        const file = event.dataTransfer.files[0];
        if (file) {
            this.processImage(file);
        }
    }
    
    /**
     * Process image for AI analysis
     */
    async processImage(file) {
        this.showToast('Processing Image', 'Converting image for AI analysis...', 'info');
        
        try {
            const base64 = await this.fileToBase64(file);
            const message = `Analyze this image: ${base64}`;
            this.elements.messageInput.value = message;
            this.autoResizeInput();
            
            this.showToast('Image Ready', 'Image uploaded successfully. Press send to analyze.', 'success');
            
            // Scroll to input
            this.elements.messageInput.focus();
        } catch (error) {
            this.showToast('Image Error', 'Failed to process image', 'error');
            this.log('ERROR', `Image processing failed: ${error.message}`);
        }
    }
    
    /**
     * Convert file to base64
     */
    fileToBase64(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.readAsDataURL(file);
            reader.onload = () => resolve(reader.result);
            reader.onerror = error => reject(error);
        });
    }
    
    /**
     * Send message to AI
     */
    async sendMessage() {
        const message = this.elements.messageInput.value.trim();
        if (!message || this.state.isGenerating) return;
        
        // Add user message to chat
        this.addMessage(message, 'user');
        
        // Clear input
        this.elements.messageInput.value = '';
        this.autoResizeInput();
        
        // Show generating indicator
        this.showGeneratingIndicator();
        
        // Save to history
        this.saveToHistory(message);
        
        try {
            // Generate AI response
            const startTime = Date.now();
            const response = await this.generateAIResponse(message);
            const latency = Date.now() - startTime;
            
            // Update stats
            this.state.apiStats.calls++;
            this.state.apiStats.totalLatency += latency;
            this.updateStatsUI();
            
            // Hide generating indicator
            this.hideGeneratingIndicator();
            
            // Add AI response with typewriter effect
            this.addMessage(response, 'ai', true);
            
            // Update notes panel
            this.updateNotesPanel(response);
            
            // Log success
            this.log('INFO', `AI response generated in ${latency}ms`);
            
        } catch (error) {
            this.hideGeneratingIndicator();
            this.showToast('AI Error', error.message, 'error');
            this.log('ERROR', `AI generation failed: ${error.message}`);
            
            // Add error message
            this.addMessage(`
                <div class="error-message">
                    <h3>Unable to Generate Response</h3>
                    <p>${this.escapeHtml(error.message)}</p>
                    <button class="regenerate-btn" onclick="savoireApp.regenerateLast()">
                        <i class="fas fa-redo"></i> Try Again
                    </button>
                </div>
            `, 'ai');
            
            this.state.apiStats.errors++;
        }
    }
    
    /**
     * Generate AI response using multiple models (race condition)
     */
    async generateAIResponse(message) {
        const models = [
            this.state.currentModel,
            'google/gemini-2.0-flash-exp:free',
            'deepseek/deepseek-chat-v3.1:free',
            'meta-llama/llama-3.2-3b-instruct:free'
        ].filter((model, index, self) => self.indexOf(model) === index); // Remove duplicates
        
        const prompt = `${this.state.systemPrompt}\n\nUser: ${message}`;
        
        // Try models in sequence
        for (const model of models) {
            try {
                this.log('INFO', `Trying model: ${model}`);
                
                const response = await fetch('/api/study', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        message: prompt,
                        model: model,
                        includeImage: message.includes('data:image')
                    })
                });
                
                if (!response.ok) {
                    throw new Error(`API error: ${response.status}`);
                }
                
                const data = await response.json();
                
                // Update token count
                if (data.tokens) {
                    this.state.apiStats.totalTokens += data.tokens;
                }
                
                return data.response || data.text || 'No response generated';
                
            } catch (error) {
                this.log('WARN', `Model ${model} failed: ${error.message}`);
                continue; // Try next model
            }
        }
        
        throw new Error('All AI models failed. Please try again.');
    }
    
    /**
     * Add message to chat
     */
    addMessage(content, type, withTypewriter = false) {
        const messageDiv = document.createElement('div');
        messageDiv.className = `message ${type}`;
        
        const time = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        
        // Create avatar
        const avatar = document.createElement('div');
        avatar.className = 'message-avatar';
        
        if (type === 'user') {
            avatar.innerHTML = this.state.userName.charAt(0).toUpperCase();
            avatar.style.background = this.state.userAvatarColor;
            avatar.style.color = this.getContrastColor(this.state.userAvatarColor);
        } else {
            avatar.innerHTML = '<i class="fas fa-robot"></i>';
        }
        
        // Create content
        const contentDiv = document.createElement('div');
        contentDiv.className = 'message-content';
        
        if (type === 'user') {
            contentDiv.innerHTML = `
                <div class="message-text">${this.escapeHtml(content)}</div>
                <div class="message-time">${time}</div>
            `;
        } else if (withTypewriter) {
            contentDiv.innerHTML = `
                <div class="message-text typewriter" id="typewriter-${Date.now()}">${this.escapeHtml(content)}</div>
                <div class="message-time">${time}</div>
            `;
            
            // Trigger typewriter effect after a delay
            setTimeout(() => {
                const textElement = contentDiv.querySelector('.typewriter');
                if (textElement) {
                    this.typewriterEffect(textElement, content);
                }
            }, 100);
        } else {
            contentDiv.innerHTML = content + `<div class="message-time">${time}</div>`;
        }
        
        messageDiv.appendChild(avatar);
        messageDiv.appendChild(contentDiv);
        
        this.elements.chatHistory.appendChild(messageDiv);
        this.scrollToBottom();
        
        // Add to conversation state
        this.state.conversation.push({ type, content, time });
    }
    
    /**
     * Typewriter effect for AI responses
     */
    typewriterEffect(element, text) {
        element.style.borderRight = '2px solid var(--color-cyber-gold)';
        element.style.width = '0';
        element.style.whiteSpace = 'nowrap';
        element.style.overflow = 'hidden';
        
        let i = 0;
        const speed = 20; // ms per character
        
        const type = () => {
            if (i < text.length) {
                element.innerHTML = this.escapeHtml(text.substring(0, i + 1));
                element.style.width = `${((i + 1) / text.length) * 100}%`;
                i++;
                setTimeout(type, speed);
            } else {
                element.style.borderRight = 'none';
                element.style.width = 'auto';
                element.style.whiteSpace = 'normal';
                
                // Render markdown and math after typing
                setTimeout(() => {
                    this.renderMarkdown(element);
                    this.renderMath(element);
                }, 100);
            }
        };
        
        type();
    }
    
    /**
     * Show generating indicator
     */
    showGeneratingIndicator() {
        this.state.isGenerating = true;
        this.elements.sendButton.disabled = true;
        
        // Add thinking message
        const thinkingDiv = document.createElement('div');
        thinkingDiv.className = 'message ai';
        thinkingDiv.id = 'thinking-message';
        thinkingDiv.innerHTML = `
            <div class="message-avatar">
                <i class="fas fa-robot"></i>
            </div>
            <div class="message-content">
                <div class="thinking-indicator">
                    <div class="spinner"></div>
                    <span>Toppers don't rush, they wait for clarity — your clarity is loading 📘🚀...</span>
                </div>
            </div>
        `;
        
        this.elements.chatHistory.appendChild(thinkingDiv);
        this.scrollToBottom();
    }
    
    /**
     * Hide generating indicator
     */
    hideGeneratingIndicator() {
        this.state.isGenerating = false;
        this.elements.sendButton.disabled = false;
        
        const thinkingMessage = document.getElementById('thinking-message');
        if (thinkingMessage) {
            thinkingMessage.remove();
        }
    }
    
    /**
     * Regenerate last response
     */
    async regenerateLast() {
        const lastUserMessage = this.state.conversation
            .filter(msg => msg.type === 'user')
            .pop();
            
        if (lastUserMessage) {
            this.elements.messageInput.value = lastUserMessage.content;
            this.sendMessage();
        }
    }
    
    /**
     * Update notes panel with AI response
     */
    updateNotesPanel(content) {
        // Parse and format the content
        let formattedContent = marked.parse(content);
        
        // Add syntax highlighting
        formattedContent = formattedContent.replace(/<pre><code class="language-(\w+)">/g, (match, lang) => {
            return `
                <div class="code-header">
                    <span>${lang.toUpperCase()}</span>
                    <button class="copy-code-btn" onclick="savoireApp.copyCode(this)">
                        <i class="fas fa-copy"></i> Copy
                    </button>
                </div>
                <pre><code class="language-${lang}">
            `;
        });
        
        // Update notes content
        this.elements.notesContent.innerHTML = formattedContent;
        
        // Apply Prism highlighting
        Prism.highlightAllUnder(this.elements.notesContent);
        
        // Render math equations
        this.renderMath(this.elements.notesContent);
        
        // Add copy functionality to code blocks
        this.setupCodeCopyButtons();
    }
    
    /**
     * Render math equations using KaTeX
     */
    renderMath(element) {
        try {
            renderMathInElement(element, {
                delimiters: [
                    {left: '$$', right: '$$', display: true},
                    {left: '$', right: '$', display: false},
                    {left: '\\(', right: '\\)', display: false},
                    {left: '\\[', right: '\\]', display: true}
                ],
                throwOnError: false
            });
        } catch (error) {
            console.warn('KaTeX rendering error:', error);
        }
    }
    
    /**
     * Render markdown
     */
    renderMarkdown(element) {
        const html = marked.parse(element.innerHTML);
        element.innerHTML = html;
    }
    
    /**
     * Setup copy buttons for code blocks
     */
    setupCodeCopyButtons() {
        const codeBlocks = this.elements.notesContent.querySelectorAll('pre code');
        codeBlocks.forEach((codeBlock, index) => {
            // Check if already has copy button
            if (!codeBlock.closest('div').querySelector('.copy-code-btn')) {
                const container = codeBlock.closest('pre');
                const lang = codeBlock.className.replace('language-', '') || 'code';
                
                const header = document.createElement('div');
                header.className = 'code-header';
                header.innerHTML = `
                    <span>${lang.toUpperCase()}</span>
                    <button class="copy-code-btn" onclick="savoireApp.copyCode(this)">
                        <i class="fas fa-copy"></i> Copy
                    </button>
                `;
                
                container.parentNode.insertBefore(header, container);
            }
        });
    }
    
    /**
     * Copy code to clipboard
     */
    copyCode(button) {
        const codeBlock = button.closest('.code-header').nextElementSibling.querySelector('code');
        const code = codeBlock.textContent;
        
        navigator.clipboard.writeText(code).then(() => {
            const originalHTML = button.innerHTML;
            button.innerHTML = '<i class="fas fa-check"></i> Copied!';
            button.style.background = 'var(--color-success)';
            button.style.borderColor = 'var(--color-success)';
            
            setTimeout(() => {
                button.innerHTML = originalHTML;
                button.style.background = '';
                button.style.borderColor = '';
            }, 2000);
        }).catch(err => {
            this.showToast('Copy Failed', 'Could not copy code to clipboard', 'error');
        });
    }
    
    /**
     * Export notes to PDF
     */
    async exportToPDF() {
        this.showToast('Exporting', 'Generating PDF document...', 'info');
        
        try {
            const element = this.elements.notesContent;
            const opt = {
                margin: [10, 10, 10, 10],
                filename: `SavoireAI_Notes_${Date.now()}.pdf`,
                image: { type: 'jpeg', quality: 0.98 },
                html2canvas: { 
                    scale: 2,
                    useCORS: true,
                    backgroundColor: '#0a0a0a'
                },
                jsPDF: { 
                    unit: 'mm', 
                    format: 'a4', 
                    orientation: 'portrait' 
                }
            };
            
            // Create PDF
            await html2pdf().set(opt).from(element).save();
            
            this.showToast('PDF Exported', 'Document downloaded successfully', 'success');
            this.log('INFO', 'PDF exported successfully');
            
        } catch (error) {
            this.showToast('Export Failed', 'Could not generate PDF', 'error');
            this.log('ERROR', `PDF export failed: ${error.message}`);
        }
    }
    
    /**
     * Toggle read aloud for notes
     */
    toggleReadAloud() {
        if (this.currentSpeech && this.speech.speaking) {
            this.speech.cancel();
            this.elements.readAloudBtn.innerHTML = '<i class="fas fa-volume-up"></i>';
            this.showToast('Read Aloud', 'Stopped reading', 'info');
        } else {
            const text = this.elements.notesContent.textContent;
            if (text.trim().length < 50) {
                this.showToast('Read Aloud', 'Not enough content to read', 'warning');
                return;
            }
            
            const utterance = new SpeechSynthesisUtterance(text.substring(0, 5000)); // Limit length
            utterance.voice = this.speechVoice;
            utterance.rate = 1;
            utterance.pitch = 1;
            utterance.volume = 1;
            
            utterance.onstart = () => {
                this.elements.readAloudBtn.innerHTML = '<i class="fas fa-stop"></i>';
                this.showToast('Read Aloud', 'Started reading notes', 'info');
            };
            
            utterance.onend = () => {
                this.elements.readAloudBtn.innerHTML = '<i class="fas fa-volume-up"></i>';
            };
            
            utterance.onerror = (event) => {
                console.error('Speech synthesis error:', event);
                this.elements.readAloudBtn.innerHTML = '<i class="fas fa-volume-up"></i>';
                this.showToast('Read Aloud', 'Speech synthesis failed', 'error');
            };
            
            this.speech.speak(utterance);
            this.currentSpeech = utterance;
        }
    }
    
    /**
     * Toggle voice input
     */
    toggleVoiceInput() {
        if (!('webkitSpeechRecognition' in window || 'SpeechRecognition' in window)) {
            this.showToast('Voice Input', 'Not supported in your browser', 'warning');
            return;
        }
        
        if (this.voiceRecognition && this.voiceRecognition.recording) {
            this.stopVoiceInput();
        } else {
            this.startVoiceInput();
        }
    }
    
    /**
     * Start voice input
     */
    startVoiceInput() {
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        this.voiceRecognition = new SpeechRecognition();
        
        this.voiceRecognition.continuous = false;
        this.voiceRecognition.interimResults = false;
        this.voiceRecognition.lang = 'en-US';
        
        this.voiceRecognition.onstart = () => {
            this.elements.voiceInputBtn.innerHTML = '<i class="fas fa-microphone-slash"></i>';
            this.elements.voiceInputBtn.style.background = 'rgba(239, 68, 68, 0.2)';
            this.showToast('Voice Input', 'Listening... Speak now', 'info');
        };
        
        this.voiceRecognition.onresult = (event) => {
            const transcript = event.results[0][0].transcript;
            this.elements.messageInput.value += transcript + ' ';
            this.autoResizeInput();
        };
        
        this.voiceRecognition.onerror = (event) => {
            console.error('Speech recognition error:', event.error);
            this.showToast('Voice Input', `Error: ${event.error}`, 'error');
            this.stopVoiceInput();
        };
        
        this.voiceRecognition.onend = () => {
            this.stopVoiceInput();
        };
        
        this.voiceRecognition.recording = true;
        this.voiceRecognition.start();
    }
    
    /**
     * Stop voice input
     */
    stopVoiceInput() {
        if (this.voiceRecognition) {
            this.voiceRecognition.stop();
            this.voiceRecognition.recording = false;
            this.elements.voiceInputBtn.innerHTML = '<i class="fas fa-microphone"></i>';
            this.elements.voiceInputBtn.style.background = '';
        }
    }
    
    /**
     * Toggle focus mode
     */
    toggleFocusMode() {
        this.state.isFocusMode = !this.state.isFocusMode;
        this.elements.mainGrid.classList.toggle('focus-mode', this.state.isFocusMode);
        
        const icon = this.elements.focusToggle.querySelector('i');
        if (this.state.isFocusMode) {
            icon.className = 'fas fa-compress';
            this.showToast('Focus Mode', 'Entered focus mode', 'success');
        } else {
            icon.className = 'fas fa-expand';
            this.showToast('Focus Mode', 'Exited focus mode', 'info');
        }
    }
    
    /**
     * Toggle fullscreen notes
     */
    toggleFullscreenNotes() {
        const notesPane = this.elements.notesContent.closest('.notes-pane');
        
        if (!document.fullscreenElement) {
            if (notesPane.requestFullscreen) {
                notesPane.requestFullscreen();
            } else if (notesPane.webkitRequestFullscreen) {
                notesPane.webkitRequestFullscreen();
            }
            this.elements.fullscreenNotesBtn.innerHTML = '<i class="fas fa-compress"></i>';
        } else {
            if (document.exitFullscreen) {
                document.exitFullscreen();
            } else if (document.webkitExitFullscreen) {
                document.webkitExitFullscreen();
            }
            this.elements.fullscreenNotesBtn.innerHTML = '<i class="fas fa-expand"></i>';
        }
    }
    
    /**
     * Toggle pomodoro timer
     */
    toggleTimer() {
        this.state.isTimerRunning = !this.state.isTimerRunning;
        
        const icon = this.elements.timerToggle.querySelector('i');
        if (this.state.isTimerRunning) {
            icon.className = 'fas fa-pause';
            this.startTimer();
            this.showToast('Pomodoro Timer', 'Timer started - 25 minutes', 'info');
        } else {
            icon.className = 'fas fa-play';
            this.showToast('Pomodoro Timer', 'Timer paused', 'info');
        }
    }
    
    /**
     * Start pomodoro timer
     */
    startTimer() {
        if (!this.state.isTimerRunning) return;
        
        const timer = () => {
            if (!this.state.isTimerRunning) return;
            
            if (this.state.pomodoroTime > 0) {
                this.state.pomodoroTime--;
                this.updateTimerDisplay();
                
                // Check for break time
                if (this.state.pomodoroTime === 0) {
                    this.showToast('Time\'s Up!', 'Take a 5-minute break', 'success');
                    new Notification('Savoiré AI', {
                        body: 'Pomodoro session complete! Take a 5-minute break.',
                        icon: 'LOGO.png'
                    });
                    
                    // Reset for break
                    this.state.pomodoroTime = 5 * 60; // 5 minute break
                }
                
                setTimeout(timer, 1000);
            }
        };
        
        timer();
    }
    
    /**
     * Update timer display
     */
    updateTimerDisplay() {
        const minutes = Math.floor(this.state.pomodoroTime / 60);
        const seconds = this.state.pomodoroTime % 60;
        this.elements.timerDisplay.textContent = 
            `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    }
    
    /**
     * Reset timer
     */
    resetTimer() {
        this.state.isTimerRunning = false;
        this.state.pomodoroTime = 25 * 60;
        this.updateTimerDisplay();
        
        this.elements.timerToggle.querySelector('i').className = 'fas fa-play';
        this.showToast('Pomodoro Timer', 'Timer reset to 25 minutes', 'info');
    }
    
    /**
     * Toggle background music
     */
    toggleMusic() {
        if (this.state.isMusicPlaying) {
            this.elements.lofiAudio.pause();
        } else {
            this.elements.lofiAudio.play().catch(e => {
                this.showToast('Music', 'Could not play music. Click to enable.', 'warning');
            });
        }
    }
    
    /**
     * Toggle mute
     */
    toggleMute() {
        this.elements.lofiAudio.muted = !this.elements.lofiAudio.muted;
        const icon = this.elements.volumeToggleBtn.querySelector('i');
        icon.className = this.elements.lofiAudio.muted ? 'fas fa-volume-mute' : 'fas fa-volume-up';
    }
    
    /**
     * Update music UI
     */
    updateMusicUI() {
        const playIcon = this.elements.playPauseBtn.querySelector('i');
        const status = this.elements.playerStatus;
        
        if (this.state.isMusicPlaying) {
            playIcon.className = 'fas fa-pause';
            status.textContent = 'Playing';
            status.style.color = 'var(--color-success)';
        } else {
            playIcon.className = 'fas fa-play';
            status.textContent = 'Paused';
            status.style.color = 'var(--color-text-muted)';
        }
    }
    
    /**
     * Show settings modal
     */
    showSettings() {
        // Load current settings
        this.elements.userNameInput.value = this.state.userName;
        this.elements.avatarColorPicker.value = this.state.userAvatarColor;
        this.elements.animationsToggle.checked = this.state.animationsEnabled;
        this.elements.musicToggle.checked = this.state.musicEnabled;
        this.elements.defaultModelSelect.value = this.state.currentModel;
        this.elements.systemPromptInput.value = this.state.systemPrompt;
        
        this.elements.settingsModal.classList.add('active');
    }
    
    /**
     * Hide settings modal
     */
    hideSettings() {
        this.elements.settingsModal.classList.remove('active');
    }
    
    /**
     * Save settings
     */
    saveSettings() {
        this.state.userName = this.elements.userNameInput.value || 'Learner';
        this.state.userAvatarColor = this.elements.avatarColorPicker.value;
        this.state.animationsEnabled = this.elements.animationsToggle.checked;
        this.state.musicEnabled = this.elements.musicToggle.checked;
        this.state.currentModel = this.elements.defaultModelSelect.value;
        this.state.systemPrompt = this.elements.systemPromptInput.value;
        
        // Update model select
        this.elements.modelSelect.value = this.state.currentModel;
        
        // Update UI
        this.updateUserAvatar();
        
        // Toggle music
        if (!this.state.musicEnabled && this.state.isMusicPlaying) {
            this.elements.lofiAudio.pause();
        }
        
        // Toggle animations
        document.body.style.animation = this.state.animationsEnabled ? '' : 'none';
        
        this.showToast('Settings', 'Settings saved successfully', 'success');
        this.saveState();
        this.hideSettings();
    }
    
    /**
     * Reset settings to defaults
     */
    resetSettings() {
        if (confirm('Reset all settings to default values?')) {
            this.state = {
                ...this.state,
                userName: 'Learner',
                userAvatarColor: '#FFD700',
                animationsEnabled: true,
                musicEnabled: true,
                currentModel: 'google/gemini-2.0-flash-exp:free',
                systemPrompt: `You are Savoiré AI, an advanced study assistant created by Sooban Talha Technologies. Provide comprehensive, detailed explanations with examples. Use markdown formatting, include code blocks when relevant, and explain concepts step-by-step.`
            };
            
            this.saveSettings();
            this.showToast('Settings', 'Settings reset to defaults', 'info');
        }
    }
    
    /**
     * Update user avatar
     */
    updateUserAvatar() {
        const avatar = this.elements.userAvatar;
        avatar.innerHTML = this.state.userName.charAt(0).toUpperCase();
        avatar.style.background = this.state.userAvatarColor;
        avatar.style.color = this.getContrastColor(this.state.userAvatarColor);
        avatar.title = this.state.userName;
    }
    
    /**
     * Get contrast color for background
     */
    getContrastColor(hexColor) {
        // Convert hex to RGB
        const r = parseInt(hexColor.slice(1, 3), 16);
        const g = parseInt(hexColor.slice(3, 5), 16);
        const b = parseInt(hexColor.slice(5, 7), 16);
        
        // Calculate luminance
        const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
        
        // Return black or white based on luminance
        return luminance > 0.5 ? '#000000' : '#FFFFFF';
    }
    
    /**
     * Toggle history sidebar
     */
    toggleHistorySidebar() {
        this.elements.historySidebar.classList.toggle('active');
        if (this.elements.historySidebar.classList.contains('active')) {
            this.loadHistoryUI();
        }
    }
    
    /**
     * Hide history sidebar
     */
    hideHistorySidebar() {
        this.elements.historySidebar.classList.remove('active');
    }
    
    /**
     * Load chat history
     */
    loadHistory() {
        try {
            const saved = localStorage.getItem('savoire-history');
            if (saved) {
                this.state.history = JSON.parse(saved);
            }
        } catch (error) {
            console.error('Failed to load history:', error);
            this.state.history = [];
        }
    }
    
    /**
     * Save to history
     */
    saveToHistory(query) {
        const historyItem = {
            id: Date.now(),
            query,
            timestamp: new Date().toISOString(),
            model: this.state.currentModel
        };
        
        this.state.history.unshift(historyItem);
        
        // Keep only last 100 items
        if (this.state.history.length > 100) {
            this.state.history = this.state.history.slice(0, 100);
        }
        
        this.saveHistory();
        this.loadHistoryUI();
    }
    
    /**
     * Save history to localStorage
     */
    saveHistory() {
        try {
            localStorage.setItem('savoire-history', JSON.stringify(this.state.history));
        } catch (error) {
            console.error('Failed to save history:', error);
        }
    }
    
    /**
     * Load history UI
     */
    loadHistoryUI() {
        const historyList = this.elements.historyList;
        historyList.innerHTML = '';
        
        if (this.state.history.length === 0) {
            historyList.innerHTML = `
                <div class="history-empty">
                    <i class="fas fa-history"></i>
                    <p>No chat history yet</p>
                </div>
            `;
            return;
        }
        
        this.state.history.forEach(item => {
            const historyItem = document.createElement('div');
            historyItem.className = 'history-item';
            historyItem.dataset.id = item.id;
            
            const date = new Date(item.timestamp);
            const timeString = date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
            const dateString = date.toLocaleDateString();
            
            historyItem.innerHTML = `
                <div class="history-query">${this.escapeHtml(item.query.substring(0, 100))}${item.query.length > 100 ? '...' : ''}</div>
                <div class="history-meta">
                    <span>${timeString}</span>
                    <span>${dateString}</span>
                </div>
                <button class="history-delete" title="Delete">
                    <i class="fas fa-trash"></i>
                </button>
            `;
            
            historyItem.addEventListener('click', () => {
                this.loadFromHistory(item);
            });
            
            const deleteBtn = historyItem.querySelector('.history-delete');
            deleteBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                this.deleteHistoryItem(item.id);
            });
            
            historyList.appendChild(historyItem);
        });
    }
    
    /**
     * Load conversation from history
     */
    loadFromHistory(item) {
        // Clear current chat
        this.clearChat();
        
        // Add the historical query
        this.addMessage(item.query, 'user');
        
        // Show loading indicator
        this.showGeneratingIndicator();
        
        // Simulate AI response (in real app, this would fetch from API)
        setTimeout(() => {
            this.hideGeneratingIndicator();
            this.addMessage(`This is a historical response for: "${item.query}"\n\nTo get a fresh response, please ask again.`, 'ai');
            this.showToast('History', 'Loaded from history', 'info');
        }, 1000);
        
        this.hideHistorySidebar();
    }
    
    /**
     * Delete history item
     */
    deleteHistoryItem(id) {
        this.state.history = this.state.history.filter(item => item.id !== id);
        this.saveHistory();
        this.loadHistoryUI();
        this.showToast('History', 'Item deleted', 'info');
    }
    
    /**
     * Clear chat
     */
    clearChat() {
        if (this.state.conversation.length === 0) return;
        
        if (confirm('Clear all messages?')) {
            this.elements.chatHistory.innerHTML = '';
            this.state.conversation = [];
            this.elements.notesContent.innerHTML = `
                <div class="notes-placeholder">
                    <div class="placeholder-icon">
                        <i class="fas fa-lightbulb"></i>
                    </div>
                    <h3>Your Notes Will Appear Here</h3>
                    <p>Ask a question or upload an image to generate comprehensive study notes.</p>
                </div>
            `;
            
            this.showToast('Chat', 'All messages cleared', 'info');
        }
    }
    
    /**
     * Show developer console
     */
    showDevConsole() {
        this.elements.devConsole.classList.add('active');
        this.updateStatsUI();
    }
    
    /**
     * Hide developer console
     */
    hideDevConsole() {
        this.elements.devConsole.classList.remove('active');
    }
    
    /**
     * Toggle developer console
     */
    toggleDevConsole() {
        if (this.elements.devConsole.classList.contains('active')) {
            this.hideDevConsole();
        } else {
            this.showDevConsole();
        }
    }
    
    /**
     * Update developer console stats
     */
    updateStatsUI() {
        this.elements.apiCallCount.textContent = this.state.apiStats.calls;
        this.elements.totalTokens.textContent = this.state.apiStats.totalTokens.toLocaleString();
        
        const avgLatency = this.state.apiStats.calls > 0 
            ? Math.round(this.state.apiStats.totalLatency / this.state.apiStats.calls)
            : 0;
        this.elements.avgLatency.textContent = `${avgLatency}ms`;
        
        // Update status bar
        this.elements.tokenCount.textContent = `${this.state.apiStats.totalTokens.toLocaleString()} tokens`;
        this.elements.responseTime.textContent = `${avgLatency}ms avg`;
    }
    
    /**
     * Log to developer console
     */
    log(level, message) {
        const time = new Date().toLocaleTimeString();
        const logEntry = document.createElement('div');
        logEntry.className = 'log-entry';
        logEntry.innerHTML = `
            <span class="log-time">[${time}]</span>
            <span class="log-level" data-level="${level}">${level}</span>
            <span class="log-message">${this.escapeHtml(message)}</span>
        `;
        
        this.elements.consoleLogs.appendChild(logEntry);
        
        // Keep only last 50 logs
        const logs = this.elements.consoleLogs.querySelectorAll('.log-entry');
        if (logs.length > 50) {
            logs[0].remove();
        }
        
        // Auto-scroll to bottom
        this.elements.consoleLogs.scrollTop = this.elements.consoleLogs.scrollHeight;
        
        // Also log to browser console
        switch(level) {
            case 'ERROR': console.error(message); break;
            case 'WARN': console.warn(message); break;
            default: console.log(message);
        }
    }
    
    /**
     * Show toast notification
     */
    showToast(title, message, type = 'info') {
        const toast = document.createElement('div');
        toast.className = `toast ${type}`;
        toast.innerHTML = `
            <div class="toast-icon">
                <i class="fas fa-${this.getToastIcon(type)}"></i>
            </div>
            <div class="toast-content">
                <div class="toast-title">${title}</div>
                <div class="toast-message">${message}</div>
            </div>
            <button class="toast-close">
                <i class="fas fa-times"></i>
            </button>
        `;
        
        this.elements.toastContainer.appendChild(toast);
        
        // Close button
        const closeBtn = toast.querySelector('.toast-close');
        closeBtn.addEventListener('click', () => {
            toast.remove();
        });
        
        // Auto-remove after 5 seconds
        setTimeout(() => {
            if (toast.parentNode) {
                toast.remove();
            }
        }, 5000);
    }
    
    /**
     * Get icon for toast type
     */
    getToastIcon(type) {
        switch(type) {
            case 'success': return 'check-circle';
            case 'error': return 'exclamation-circle';
            case 'warning': return 'exclamation-triangle';
            default: return 'info-circle';
        }
    }
    
    /**
     * Auto-resize textarea
     */
    autoResizeInput() {
        const textarea = this.elements.messageInput;
        textarea.style.height = 'auto';
        textarea.style.height = Math.min(textarea.scrollHeight, 200) + 'px';
    }
    
    /**
     * Handle input keydown
     */
    handleInputKeydown(e) {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            this.sendMessage();
        }
    }
    
    /**
     * Handle window resize
     */
    handleResize() {
        this.autoResizeInput();
        
        // Update wormhole canvas
        if (this.wormhole) {
            this.wormhole.canvas.width = window.innerWidth;
            this.wormhole.canvas.height = window.innerHeight;
        }
    }
    
    /**
     * Scroll chat to bottom
     */
    scrollToBottom() {
        this.elements.chatHistory.scrollTop = this.elements.chatHistory.scrollHeight;
    }
    
    /**
     * Escape HTML to prevent XSS
     */
    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
    
    /**
     * Load state from localStorage
     */
    loadState() {
        try {
            const saved = localStorage.getItem('savoire-state');
            if (saved) {
                const parsed = JSON.parse(saved);
                this.state = { ...this.state, ...parsed };
                
                // Update UI from loaded state
                this.elements.modelSelect.value = this.state.currentModel;
                this.updateUserAvatar();
                this.updateTimerDisplay();
                this.updateMusicUI();
            }
        } catch (error) {
            console.error('Failed to load state:', error);
        }
    }
    
    /**
     * Save state to localStorage
     */
    saveState() {
        try {
            // Don't save conversation (too large)
            const stateToSave = { ...this.state };
            delete stateToSave.conversation;
            
            localStorage.setItem('savoire-state', JSON.stringify(stateToSave));
            this.saveHistory();
        } catch (error) {
            console.error('Failed to save state:', error);
        }
    }
}

// Initialize the application
window.savoireApp = new SavoireApp();
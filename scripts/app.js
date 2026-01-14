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
            },
            isTyping: false,
            typingSpeed: 20 // ms per character
        };
        
        // DOM Elements
        this.elements = {};
        
        // Wormhole Particle System
        this.wormhole = null;
        
        // Speech Synthesis
        this.speech = window.speechSynthesis;
        this.currentSpeech = null;
        
        // Voice Recognition
        this.voiceRecognition = null;
        
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
        this.initAnimations();
        
        // Show cinematic intro
        this.showCinematicIntro();
        
        // Initialize markdown renderer
        this.initMarkdown();
        
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
        
        // Preload audio
        this.preloadAudio();
    }
    
    /**
     * Initialize markdown renderer
     */
    initMarkdown() {
        marked.setOptions({
            gfm: true,
            breaks: true,
            smartLists: true,
            smartypants: true,
            xhtml: true,
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
            ],
            throwOnError: false,
            errorColor: '#FF6B6B',
            macros: {"\\RR": "\\mathbb{R}"}
        });
    }
    
    /**
     * Initialize CSS animations
     */
    initAnimations() {
        // Add CSS for typewriter animations
        if (!document.querySelector('#typewriter-animations')) {
            const style = document.createElement('style');
            style.id = 'typewriter-animations';
            style.textContent = `
                @keyframes typewriter-blink {
                    0%, 100% { opacity: 1; }
                    50% { opacity: 0; }
                }
                
                @keyframes message-slide-in {
                    from {
                        opacity: 0;
                        transform: translateY(20px) scale(0.95);
                    }
                    to {
                        opacity: 1;
                        transform: translateY(0) scale(1);
                    }
                }
                
                .typewriter-cursor {
                    display: inline-block;
                    width: 2px;
                    height: 1.2em;
                    background-color: var(--color-cyber-gold);
                    margin-left: 2px;
                    vertical-align: text-bottom;
                    animation: typewriter-blink 0.75s step-end infinite;
                }
                
                .message {
                    animation: message-slide-in 0.3s cubic-bezier(0.4, 0, 0.2, 1);
                }
                
                .thinking-indicator {
                    display: flex;
                    align-items: center;
                    gap: 12px;
                }
                
                .thinking-dots {
                    display: flex;
                    gap: 4px;
                }
                
                .thinking-dot {
                    width: 8px;
                    height: 8px;
                    border-radius: 50%;
                    background: var(--color-cyber-gold);
                    animation: thinking-pulse 1.4s ease-in-out infinite;
                }
                
                .thinking-dot:nth-child(2) {
                    animation-delay: 0.2s;
                }
                
                .thinking-dot:nth-child(3) {
                    animation-delay: 0.4s;
                }
                
                @keyframes thinking-pulse {
                    0%, 100% { opacity: 0.4; transform: scale(0.9); }
                    50% { opacity: 1; transform: scale(1.1); }
                }
            `;
            document.head.appendChild(style);
        }
    }
    
    /**
     * Preload audio for better UX
     */
    preloadAudio() {
        this.elements.lofiAudio.load();
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
        
        // Wormhole Canvas
        this.elements.wormholeCanvas = document.getElementById('wormholeCanvas');
    }
    
    /**
     * Initialize custom cursor
     */
    initCustomCursor() {
        const cursorDot = document.querySelector('.cursor-dot');
        const cursorTrail = document.querySelector('.cursor-trail');
        
        if (!cursorDot || !cursorTrail) return;
        
        let mouseX = 0, mouseY = 0;
        let trailX = 0, trailY = 0;
        let isMoving = false;
        let moveTimeout;
        
        const updateCursor = () => {
            if (this.state.animationsEnabled) {
                cursorDot.style.left = `${mouseX}px`;
                cursorDot.style.top = `${mouseY}px`;
                
                // Smooth trail effect with easing
                trailX += (mouseX - trailX) * 0.15;
                trailY += (mouseY - trailY) * 0.15;
                
                cursorTrail.style.left = `${trailX}px`;
                cursorTrail.style.top = `${trailY}px`;
                
                // Update cursor size based on movement speed
                const dx = mouseX - trailX;
                const dy = mouseY - trailY;
                const speed = Math.sqrt(dx * dx + dy * dy);
                const scale = Math.min(1 + speed * 0.01, 1.5);
                
                cursorTrail.style.transform = `translate(-50%, -50%) scale(${scale})`;
                cursorTrail.style.opacity = Math.min(0.3 + speed * 0.005, 0.6);
            }
        };
        
        const animateCursor = () => {
            updateCursor();
            if (isMoving) {
                requestAnimationFrame(animateCursor);
            }
        };
        
        document.addEventListener('mousemove', (e) => {
            mouseX = e.clientX;
            mouseY = e.clientY;
            
            if (!isMoving) {
                isMoving = true;
                animateCursor();
            }
            
            clearTimeout(moveTimeout);
            moveTimeout = setTimeout(() => {
                isMoving = false;
            }, 100);
        });
        
        // Interactive elements
        const interactiveElements = document.querySelectorAll('button, input, textarea, select, a, .clickable');
        interactiveElements.forEach(el => {
            el.addEventListener('mouseenter', () => {
                cursorDot.style.transform = 'translate(-50%, -50%) scale(1.8)';
                cursorDot.style.background = 'var(--color-neon-blue)';
                cursorTrail.style.transform = 'translate(-50%, -50%) scale(1.3)';
                cursorTrail.style.borderColor = 'var(--color-neon-blue)';
            });
            
            el.addEventListener('mouseleave', () => {
                cursorDot.style.transform = 'translate(-50%, -50%) scale(1)';
                cursorDot.style.background = 'var(--color-cyber-gold)';
                cursorTrail.style.transform = 'translate(-50%, -50%) scale(1)';
                cursorTrail.style.borderColor = 'var(--color-cyber-gold)';
            });
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
        ['dragover', 'dragenter'].forEach(eventName => {
            this.elements.dropZone.addEventListener(eventName, (e) => {
                e.preventDefault();
                this.elements.dropZone.classList.add('active');
            });
        });
        
        ['dragleave', 'dragend'].forEach(eventName => {
            this.elements.dropZone.addEventListener(eventName, () => {
                this.elements.dropZone.classList.remove('active');
            });
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
        window.addEventListener('online', () => this.handleConnectionChange(true));
        window.addEventListener('offline', () => this.handleConnectionChange(false));
        
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
        
        this.elements.lofiAudio.addEventListener('volumechange', () => {
            this.elements.volumeSlider.value = this.elements.lofiAudio.volume * 100;
        });
        
        // Fullscreen events
        document.addEventListener('fullscreenchange', () => this.handleFullscreenChange());
        document.addEventListener('webkitfullscreenchange', () => this.handleFullscreenChange());
        
        // Auto-save settings
        setInterval(() => this.saveState(), 30000);
        
        // Periodic stats update
        setInterval(() => this.updateStatsUI(), 5000);
    }
    
    /**
     * Handle fullscreen change
     */
    handleFullscreenChange() {
        const isFullscreen = document.fullscreenElement || document.webkitFullscreenElement;
        const icon = this.elements.fullscreenNotesBtn.querySelector('i');
        
        if (isFullscreen) {
            icon.className = 'fas fa-compress';
        } else {
            icon.className = 'fas fa-expand';
        }
    }
    
    /**
     * Handle connection change
     */
    handleConnectionChange(isOnline) {
        if (isOnline) {
            this.showToast('Connection Restored', 'You are back online', 'success');
            this.elements.modelStatus.querySelector('.status-dot').style.background = 'var(--color-success)';
            this.elements.modelStatus.querySelector('span').textContent = 'Online';
        } else {
            this.showToast('Connection Lost', 'You are offline', 'error');
            this.elements.modelStatus.querySelector('.status-dot').style.background = 'var(--color-error)';
            this.elements.modelStatus.querySelector('span').textContent = 'Offline';
        }
    }
    
    /**
     * Show cinematic intro
     */
    showCinematicIntro() {
        setTimeout(() => {
            this.elements.introScreen.style.opacity = '0';
            this.elements.introScreen.style.transition = 'opacity 1s ease';
            
            setTimeout(() => {
                this.elements.introScreen.style.display = 'none';
                this.elements.appContainer.style.display = 'grid';
                
                // Animate in app container
                setTimeout(() => {
                    this.elements.appContainer.style.opacity = '1';
                    this.elements.appContainer.style.transition = 'opacity 0.5s ease';
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
        }, 4000);
    }
    
    /**
     * Show welcome modal for first-time users
     */
    showWelcomeModal() {
        this.elements.welcomeModal.classList.add('active');
        setTimeout(() => {
            this.elements.welcomeNameInput.focus();
        }, 300);
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
        } else {
            this.state.userName = 'Learner';
            this.updateUserAvatar();
            localStorage.setItem('savoire-first-visit', 'true');
            this.showToast('Welcome!', 'Your learning journey begins now.', 'success');
        }
        
        this.elements.welcomeModal.classList.remove('active');
    }
    
    /**
     * Initialize wormhole particle system
     */
    initWormhole() {
        const canvas = this.elements.wormholeCanvas;
        if (!canvas) return;
        
        const ctx = canvas.getContext('2d');
        
        // Set canvas size
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
        
        // Particle system
        const particles = [];
        const particleCount = 150;
        
        // Create particles with varying properties
        for (let i = 0; i < particleCount; i++) {
            const angle = Math.random() * Math.PI * 2;
            const distance = Math.random() * Math.min(canvas.width, canvas.height) * 0.4;
            
            particles.push({
                x: canvas.width / 2 + Math.cos(angle) * distance,
                y: canvas.height / 2 + Math.sin(angle) * distance,
                size: Math.random() * 3 + 0.5,
                speedX: (Math.random() - 0.5) * 0.5,
                speedY: (Math.random() - 0.5) * 0.5,
                color: `hsla(${Math.random() * 30 + 40}, 100%, 60%, ${Math.random() * 0.3 + 0.1})`,
                orbitDistance: distance,
                orbitSpeed: (Math.random() - 0.5) * 0.02,
                angle: angle
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
            
            // Clear with fade effect for trails
            ctx.fillStyle = 'rgba(5, 5, 5, 0.05)';
            ctx.fillRect(0, 0, canvas.width, canvas.height);
            
            // Draw center glow
            const gradient = ctx.createRadialGradient(
                mouseX, mouseY, 0,
                mouseX, mouseY, 100
            );
            gradient.addColorStop(0, 'rgba(255, 215, 0, 0.3)');
            gradient.addColorStop(1, 'rgba(255, 215, 0, 0)');
            
            ctx.fillStyle = gradient;
            ctx.beginPath();
            ctx.arc(mouseX, mouseY, 100, 0, Math.PI * 2);
            ctx.fill();
            
            // Update and draw particles
            particles.forEach(particle => {
                // Calculate distance from mouse
                const dx = mouseX - particle.x;
                const dy = mouseY - particle.y;
                const distance = Math.sqrt(dx * dx + dy * dy);
                
                // Wormhole effect
                if (distance < 200) {
                    const force = (200 - distance) / 200;
                    const angle = Math.atan2(dy, dx);
                    
                    particle.x += Math.cos(angle) * force * 2;
                    particle.y += Math.sin(angle) * force * 2;
                    
                    // Increase size near center
                    particle.size = Math.min(particle.size + force * 0.5, 5);
                } else {
                    // Orbital motion
                    particle.angle += particle.orbitSpeed;
                    particle.x = canvas.width / 2 + Math.cos(particle.angle) * particle.orbitDistance;
                    particle.y = canvas.height / 2 + Math.sin(particle.angle) * particle.orbitDistance;
                    particle.size = Math.max(particle.size - 0.05, 0.5);
                }
                
                // Draw particle with glow
                ctx.beginPath();
                ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
                
                const particleGradient = ctx.createRadialGradient(
                    particle.x, particle.y, 0,
                    particle.x, particle.y, particle.size * 2
                );
                particleGradient.addColorStop(0, particle.color);
                particleGradient.addColorStop(1, 'rgba(255, 215, 0, 0)');
                
                ctx.fillStyle = particleGradient;
                ctx.fill();
                
                // Draw connections
                particles.forEach(otherParticle => {
                    const dx = particle.x - otherParticle.x;
                    const dy = particle.y - otherParticle.y;
                    const distance = Math.sqrt(dx * dx + dy * dy);
                    
                    if (distance < 120) {
                        const opacity = 0.1 * (1 - distance / 120);
                        
                        ctx.beginPath();
                        ctx.moveTo(particle.x, particle.y);
                        ctx.lineTo(otherParticle.x, otherParticle.y);
                        ctx.strokeStyle = `rgba(255, 215, 0, ${opacity})`;
                        ctx.lineWidth = 0.5;
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
            const voices = this.speech.getVoices();
            if (voices.length > 0) {
                // Prefer English voices with good quality
                this.speechVoice = voices.find(voice => 
                    voice.lang.startsWith('en') && 
                    voice.name.includes('Natural')
                ) || voices.find(voice => voice.lang.startsWith('en')) || voices[0];
            }
        }
    }
    
    /**
     * Setup keyboard shortcuts
     */
    setupKeyboardShortcuts() {
        document.addEventListener('keydown', (e) => {
            // Don't trigger if user is typing in input
            if (e.target.tagName === 'TEXTAREA' || e.target.tagName === 'INPUT') {
                if (e.key === 'Escape') {
                    e.target.blur();
                    return;
                }
                return;
            }
            
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
            
            // Shift+Enter for new line (handled by textarea)
            
            // Escape to close modals
            if (e.key === 'Escape') {
                if (this.elements.settingsModal.classList.contains('active')) {
                    this.hideSettings();
                } else if (this.elements.historySidebar.classList.contains('active')) {
                    this.hideHistorySidebar();
                } else if (this.elements.devConsole.classList.contains('active')) {
                    this.hideDevConsole();
                } else if (this.elements.welcomeModal.classList.contains('active')) {
                    this.elements.welcomeModal.classList.remove('active');
                }
                return;
            }
            
            // Ctrl+/ for dev console
            if (e.ctrlKey && e.key === '/') {
                e.preventDefault();
                this.toggleDevConsole();
                return;
            }
            
            // Ctrl+Shift+C for clear chat
            if (e.ctrlKey && e.shiftKey && e.key === 'C') {
                e.preventDefault();
                this.clearChat();
                return;
            }
            
            // Space to play/pause music
            if (e.key === ' ' && !e.ctrlKey && !e.shiftKey && !e.altKey) {
                e.preventDefault();
                this.toggleMusic();
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
            this.showToast('Invalid File', 'Please upload an image file (PNG, JPG, JPEG, GIF)', 'error');
            return;
        }
        
        if (file.size > 10 * 1024 * 1024) { // 10MB limit
            this.showToast('File Too Large', 'Image must be less than 10MB', 'error');
            return;
        }
        
        this.processImage(file);
        event.target.value = ''; // Reset file input
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
            this.scrollToBottom();
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
            const aiMessage = this.addMessage(response, 'ai', true);
            
            // Update notes panel
            this.updateNotesPanel(response);
            
            // Log success
            this.log('INFO', `AI response generated in ${latency}ms using ${this.state.currentModel}`);
            
        } catch (error) {
            this.hideGeneratingIndicator();
            this.showToast('AI Error', error.message, 'error');
            this.log('ERROR', `AI generation failed: ${error.message}`);
            
            // Add error message with retry option
            this.addMessage(`
                <div class="error-message">
                    <h3><i class="fas fa-exclamation-triangle"></i> Unable to Generate Response</h3>
                    <p>${this.escapeHtml(error.message)}</p>
                    <div class="error-actions">
                        <button class="regenerate-btn" onclick="savoireApp.regenerateLast()">
                            <i class="fas fa-redo"></i> Try Again
                        </button>
                        <button class="change-model-btn" onclick="savoireApp.showSettings()">
                            <i class="fas fa-cog"></i> Change Model
                        </button>
                    </div>
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
            'meta-llama/llama-3.2-3b-instruct:free',
            'z-ai/glm-4.5-air:free'
        ].filter((model, index, self) => self.indexOf(model) === index);
        
        const prompt = `${this.state.systemPrompt}\n\nUser: ${message}`;
        
        // Create promises for all models
        const promises = models.map(model => 
            this.tryModel(model, prompt).catch(error => {
                this.log('WARN', `Model ${model} failed: ${error.message}`);
                return null;
            })
        );
        
        // Race the promises
        for (let i = 0; i < promises.length; i++) {
            try {
                const result = await Promise.race(promises.filter(p => p !== null));
                if (result) {
                    this.log('INFO', `Selected model: ${result.model}`);
                    return result;
                }
            } catch (error) {
                continue;
            }
        }
        
        throw new Error('All AI models failed. Please try again or check your connection.');
    }
    
    /**
     * Try a specific model
     */
    async tryModel(model, prompt) {
        return new Promise(async (resolve, reject) => {
            const timeout = setTimeout(() => {
                reject(new Error(`Model ${model} timeout`));
            }, 30000); // 30 second timeout
            
            try {
                const response = await fetch('/api/study', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        message: prompt,
                        model: model,
                        includeImage: prompt.includes('data:image')
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
                
                clearTimeout(timeout);
                resolve({
                    content: data.response || data.text || 'No response generated',
                    tokens: data.tokens || 0,
                    model: model
                });
                
            } catch (error) {
                clearTimeout(timeout);
                reject(error);
            }
        });
    }
    
    /**
     * Add message to chat (FIXED VERSION WITH PROPER BOUNDARIES)
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
        
        // Create content container with proper boundaries
        const contentDiv = document.createElement('div');
        contentDiv.className = 'message-content';
        
        // Create message text container
        const textContainer = document.createElement('div');
        textContainer.className = 'message-text';
        
        // Create time element
        const timeElement = document.createElement('div');
        timeElement.className = 'message-time';
        timeElement.textContent = time;
        
        if (type === 'user') {
            // User messages: simple text display
            textContainer.innerHTML = this.escapeHtml(content);
            contentDiv.appendChild(textContainer);
            contentDiv.appendChild(timeElement);
            
        } else if (withTypewriter) {
            // AI messages with typewriter effect
            contentDiv.appendChild(textContainer);
            contentDiv.appendChild(timeElement);
            
            // Store the text container for typewriter
            const messageId = `message-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
            textContainer.id = messageId;
            
            // Start typewriter after a brief delay
            setTimeout(() => {
                this.advancedTypewriterEffect(textContainer, content);
            }, 100);
            
        } else {
            // AI messages without typewriter (for errors, etc.)
            const parsedContent = marked.parse(this.escapeHtml(content));
            textContainer.innerHTML = parsedContent;
            contentDiv.appendChild(textContainer);
            contentDiv.appendChild(timeElement);
            
            // Apply syntax highlighting
            setTimeout(() => {
                Prism.highlightAllUnder(textContainer);
                this.renderMath(textContainer);
                this.setupCodeCopyButtons();
            }, 100);
        }
        
        messageDiv.appendChild(avatar);
        messageDiv.appendChild(contentDiv);
        
        this.elements.chatHistory.appendChild(messageDiv);
        this.scrollToBottom();
        
        // Add to conversation state
        this.state.conversation.push({ 
            type, 
            content, 
            time,
            element: messageDiv 
        });
        
        return messageDiv;
    }
    
    /**
     * Advanced Typewriter Effect with Perfect Boundaries
     */
    advancedTypewriterEffect(element, text) {
        // Clear element and set up for typewriter
        element.innerHTML = '';
        element.style.cssText = `
            white-space: pre-wrap;
            word-wrap: break-word;
            overflow-wrap: break-word;
            word-break: break-word;
            display: block;
            max-width: 100%;
            min-height: 1.2em;
            line-height: 1.6;
        `;
        
        // Create cursor
        const cursor = document.createElement('span');
        cursor.className = 'typewriter-cursor';
        element.appendChild(cursor);
        
        // Prepare text for display
        const escapedText = this.escapeHtml(text);
        let displayedText = '';
        let currentIndex = 0;
        
        // Function to render current state
        const render = () => {
            // Create temporary container to process markdown
            const tempDiv = document.createElement('div');
            tempDiv.innerHTML = marked.parse(displayedText);
            
            // Replace element content with processed content + cursor
            element.innerHTML = tempDiv.innerHTML;
            element.appendChild(cursor);
            
            // Scroll cursor into view
            cursor.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
            
            // Apply syntax highlighting to visible code blocks
            Prism.highlightAllUnder(element);
            
            // Render math equations
            this.renderMath(element);
            
            // Setup copy buttons
            this.setupCodeCopyButtons();
        };
        
        // Typewriter function
        const typeCharacter = () => {
            if (currentIndex < escapedText.length) {
                // Add next character(s) - handle markdown characters in chunks
                const nextChar = escapedText.charAt(currentIndex);
                displayedText += nextChar;
                currentIndex++;
                
                render();
                
                // Calculate delay for next character
                let delay = this.state.typingSpeed;
                
                // Adjust delay for punctuation
                if (/[.!?]/.test(nextChar)) {
                    delay += 150; // Pause after sentences
                } else if (nextChar === ',') {
                    delay += 50; // Pause after commas
                } else if (nextChar === '\n') {
                    delay += 100; // Pause after new lines
                }
                
                // Add random variation for natural feel
                delay += Math.random() * 20 - 10;
                
                setTimeout(typeCharacter, Math.max(10, delay));
            } else {
                // Typing complete - remove cursor
                cursor.style.display = 'none';
                
                // Final render with complete markdown processing
                setTimeout(() => {
                    element.innerHTML = marked.parse(escapedText);
                    
                    // Final syntax highlighting
                    Prism.highlightAllUnder(element);
                    this.renderMath(element);
                    this.setupCodeCopyButtons();
                    
                    // Trigger completion event
                    this.onTypewriterComplete();
                }, 300);
            }
        };
        
        // Start typing
        setTimeout(typeCharacter, 100);
    }
    
    /**
     * Called when typewriter effect completes
     */
    onTypewriterComplete() {
        // Scroll to bottom to ensure everything is visible
        this.scrollToBottom();
        
        // Update UI if needed
        this.elements.sendButton.disabled = false;
        
        // Log completion
        this.log('INFO', 'Typewriter effect completed');
    }
    
    /**
     * Show generating indicator
     */
    showGeneratingIndicator() {
        this.state.isGenerating = true;
        this.state.isTyping = true;
        this.elements.sendButton.disabled = true;
        
        // Create thinking message
        const thinkingDiv = document.createElement('div');
        thinkingDiv.className = 'message ai';
        thinkingDiv.id = 'thinking-message';
        thinkingDiv.innerHTML = `
            <div class="message-avatar">
                <i class="fas fa-robot"></i>
            </div>
            <div class="message-content">
                <div class="thinking-indicator">
                    <div class="thinking-dots">
                        <div class="thinking-dot"></div>
                        <div class="thinking-dot"></div>
                        <div class="thinking-dot"></div>
                    </div>
                    <span class="thinking-text">Toppers don't rush, they wait for clarity — your clarity is loading 📘🚀...</span>
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
        const thinkingMessage = document.getElementById('thinking-message');
        if (thinkingMessage) {
            thinkingMessage.remove();
        }
        
        this.state.isGenerating = false;
        this.elements.sendButton.disabled = false;
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
            this.autoResizeInput();
            this.sendMessage();
        }
    }
    
    /**
     * Update notes panel with AI response
     */
    updateNotesPanel(content) {
        // Clear current notes
        this.elements.notesContent.innerHTML = '';
        
        // Create loading indicator
        const loadingDiv = document.createElement('div');
        loadingDiv.className = 'notes-loading';
        loadingDiv.innerHTML = `
            <div class="loading-spinner"></div>
            <p>Generating study notes...</p>
        `;
        
        this.elements.notesContent.appendChild(loadingDiv);
        
        // Process content after a brief delay
        setTimeout(() => {
            // Parse markdown
            const parsedContent = marked.parse(this.escapeHtml(content));
            
            // Create notes container
            const notesContainer = document.createElement('div');
            notesContainer.className = 'notes-container';
            notesContainer.innerHTML = parsedContent;
            
            // Replace loading with notes
            this.elements.notesContent.innerHTML = '';
            this.elements.notesContent.appendChild(notesContainer);
            
            // Apply syntax highlighting
            Prism.highlightAllUnder(notesContainer);
            
            // Render math equations
            this.renderMath(notesContainer);
            
            // Setup copy buttons for code blocks
            this.setupCodeCopyButtons();
            
            // Add note actions
            this.addNoteActions(notesContainer);
            
            // Log completion
            this.log('INFO', 'Study notes generated and rendered');
        }, 500);
    }
    
    /**
     * Add action buttons to notes
     */
    addNoteActions(container) {
        // Create actions container
        const actionsDiv = document.createElement('div');
        actionsDiv.className = 'notes-actions-container';
        actionsDiv.innerHTML = `
            <button class="notes-action" onclick="savoireApp.highlightNotes()">
                <i class="fas fa-highlighter"></i> Highlight
            </button>
            <button class="notes-action" onclick="savoireApp.printNotes()">
                <i class="fas fa-print"></i> Print
            </button>
            <button class="notes-action" onclick="savoireApp.shareNotes()">
                <i class="fas fa-share"></i> Share
            </button>
        `;
        
        container.appendChild(actionsDiv);
    }
    
    /**
     * Highlight important notes
     */
    highlightNotes() {
        const notes = this.elements.notesContent;
        const headers = notes.querySelectorAll('h1, h2, h3');
        
        headers.forEach(header => {
            header.style.backgroundColor = 'rgba(255, 215, 0, 0.1)';
            header.style.padding = '10px';
            header.style.borderRadius = '5px';
            header.style.borderLeft = '4px solid var(--color-cyber-gold)';
        });
        
        this.showToast('Notes Highlighted', 'Key sections have been highlighted', 'success');
    }
    
    /**
     * Print notes
     */
    printNotes() {
        const printWindow = window.open('', '_blank');
        printWindow.document.write(`
            <html>
                <head>
                    <title>Savoiré AI Study Notes</title>
                    <style>
                        body { font-family: Arial, sans-serif; margin: 20px; }
                        h1, h2, h3 { color: #000; }
                        pre { background: #f5f5f5; padding: 10px; border-radius: 5px; }
                        code { font-family: 'Courier New', monospace; }
                        .print-header { text-align: center; margin-bottom: 30px; }
                        .print-footer { margin-top: 30px; text-align: center; font-size: 12px; color: #666; }
                    </style>
                </head>
                <body>
                    <div class="print-header">
                        <h1>Savoiré AI Study Notes</h1>
                        <p>Generated on ${new Date().toLocaleString()}</p>
                    </div>
                    ${this.elements.notesContent.innerHTML}
                    <div class="print-footer">
                        <p>Generated by Savoiré AI • Powered by Sooban Talha Technologies</p>
                        <p>https://soobantalhatech.xyz</p>
                    </div>
                </body>
            </html>
        `);
        printWindow.document.close();
        printWindow.print();
    }
    
    /**
     * Share notes
     */
    async shareNotes() {
        try {
            if (navigator.share) {
                await navigator.share({
                    title: 'Savoiré AI Study Notes',
                    text: 'Check out these study notes generated by Savoiré AI',
                    url: window.location.href
                });
                this.showToast('Shared', 'Notes shared successfully', 'success');
            } else {
                // Fallback: copy to clipboard
                const notesText = this.elements.notesContent.textContent.substring(0, 1000) + '...';
                await navigator.clipboard.writeText(notesText);
                this.showToast('Copied', 'Notes copied to clipboard', 'success');
            }
        } catch (error) {
            this.showToast('Share Failed', 'Could not share notes', 'error');
        }
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
                throwOnError: false,
                errorColor: '#FF6B6B',
                macros: {
                    "\\RR": "\\mathbb{R}",
                    "\\NN": "\\mathbb{N}",
                    "\\ZZ": "\\mathbb{Z}",
                    "\\QQ": "\\mathbb{Q}",
                    "\\CC": "\\mathbb{C}"
                }
            });
        } catch (error) {
            console.warn('KaTeX rendering error:', error);
        }
    }
    
    /**
     * Setup copy buttons for code blocks
     */
    setupCodeCopyButtons() {
        const codeBlocks = document.querySelectorAll('pre code');
        codeBlocks.forEach((codeBlock, index) => {
            const preElement = codeBlock.closest('pre');
            if (preElement && !preElement.querySelector('.copy-code-btn')) {
                const copyButton = document.createElement('button');
                copyButton.className = 'copy-code-btn';
                copyButton.innerHTML = '<i class="fas fa-copy"></i>';
                copyButton.title = 'Copy code';
                copyButton.onclick = () => this.copyCode(copyButton);
                
                // Add language label if available
                const language = codeBlock.className.replace('language-', '');
                if (language && language !== 'code') {
                    const langLabel = document.createElement('span');
                    langLabel.className = 'code-language';
                    langLabel.textContent = language;
                    preElement.parentNode.insertBefore(langLabel, preElement);
                }
                
                preElement.appendChild(copyButton);
            }
        });
    }
    
    /**
     * Copy code to clipboard
     */
    copyCode(button) {
        const codeBlock = button.closest('pre').querySelector('code');
        const code = codeBlock.textContent;
        
        navigator.clipboard.writeText(code).then(() => {
            const originalHTML = button.innerHTML;
            button.innerHTML = '<i class="fas fa-check"></i>';
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
            
            // Create a temporary container for PDF generation
            const tempContainer = document.createElement('div');
            tempContainer.style.cssText = `
                background: white;
                color: black;
                padding: 20px;
                font-family: Arial, sans-serif;
            `;
            
            // Add header
            const header = document.createElement('div');
            header.style.cssText = `
                text-align: center;
                margin-bottom: 30px;
                border-bottom: 2px solid #FFD700;
                padding-bottom: 10px;
            `;
            header.innerHTML = `
                <h1 style="color: #000; margin: 0;">Savoiré AI Study Notes</h1>
                <p style="color: #666; margin: 5px 0;">Generated on ${new Date().toLocaleString()}</p>
                <p style="color: #666; margin: 0;">by Sooban Talha Technologies</p>
            `;
            
            // Add content
            const content = element.cloneNode(true);
            
            // Fix styling for PDF
            content.querySelectorAll('*').forEach(el => {
                el.style.color = '#000';
                el.style.backgroundColor = 'transparent';
                el.style.borderColor = '#ddd';
            });
            
            // Add footer
            const footer = document.createElement('div');
            footer.style.cssText = `
                text-align: center;
                margin-top: 30px;
                padding-top: 10px;
                border-top: 1px solid #ddd;
                color: #666;
                font-size: 12px;
            `;
            footer.innerHTML = `
                <p>Generated by Savoiré AI • https://soobantalhatech.xyz</p>
                <p>Page {{page}} of {{total}}</p>
            `;
            
            // Assemble PDF content
            tempContainer.appendChild(header);
            tempContainer.appendChild(content);
            tempContainer.appendChild(footer);
            
            // Generate PDF
            const opt = {
                margin: [10, 10, 10, 10],
                filename: `SavoireAI_Notes_${Date.now()}.pdf`,
                image: { type: 'jpeg', quality: 0.98 },
                html2canvas: { 
                    scale: 2,
                    useCORS: true,
                    backgroundColor: '#ffffff',
                    logging: false
                },
                jsPDF: { 
                    unit: 'mm', 
                    format: 'a4', 
                    orientation: 'portrait' 
                },
                pagebreak: { mode: 'avoid-all' }
            };
            
            await html2pdf().set(opt).from(tempContainer).save();
            
            this.showToast('PDF Exported', 'Document downloaded successfully', 'success');
            this.log('INFO', 'PDF exported successfully');
            
        } catch (error) {
            console.error('PDF Export Error:', error);
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
            
            const utterance = new SpeechSynthesisUtterance(text.substring(0, 5000));
            
            if (this.speechVoice) {
                utterance.voice = this.speechVoice;
            }
            
            utterance.rate = 1;
            utterance.pitch = 1;
            utterance.volume = 1;
            
            utterance.onstart = () => {
                this.elements.readAloudBtn.innerHTML = '<i class="fas fa-stop"></i>';
                this.showToast('Read Aloud', 'Started reading notes', 'info');
            };
            
            utterance.onend = () => {
                this.elements.readAloudBtn.innerHTML = '<i class="fas fa-volume-up"></i>';
                this.showToast('Read Aloud', 'Finished reading', 'success');
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
        
        if (this.voiceRecognition && this.isListening) {
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
        this.voiceRecognition.interimResults = true;
        this.voiceRecognition.lang = 'en-US';
        this.voiceRecognition.maxAlternatives = 1;
        
        this.voiceRecognition.onstart = () => {
            this.isListening = true;
            this.elements.voiceInputBtn.innerHTML = '<i class="fas fa-microphone-slash"></i>';
            this.elements.voiceInputBtn.style.background = 'rgba(239, 68, 68, 0.2)';
            this.showToast('Voice Input', 'Listening... Speak now', 'info');
        };
        
        this.voiceRecognition.onresult = (event) => {
            const transcript = Array.from(event.results)
                .map(result => result[0])
                .map(result => result.transcript)
                .join('');
            
            this.elements.messageInput.value = transcript;
            this.autoResizeInput();
        };
        
        this.voiceRecognition.onerror = (event) => {
            console.error('Speech recognition error:', event.error);
            
            let errorMessage = 'Unknown error';
            switch(event.error) {
                case 'no-speech':
                    errorMessage = 'No speech detected';
                    break;
                case 'audio-capture':
                    errorMessage = 'No microphone found';
                    break;
                case 'not-allowed':
                    errorMessage = 'Microphone permission denied';
                    break;
                default:
                    errorMessage = `Error: ${event.error}`;
            }
            
            this.showToast('Voice Input', errorMessage, 'error');
            this.stopVoiceInput();
        };
        
        this.voiceRecognition.onend = () => {
            this.stopVoiceInput();
        };
        
        try {
            this.voiceRecognition.start();
        } catch (error) {
            this.showToast('Voice Input', 'Could not start voice recognition', 'error');
        }
    }
    
    /**
     * Stop voice input
     */
    stopVoiceInput() {
        if (this.voiceRecognition) {
            try {
                this.voiceRecognition.stop();
            } catch (error) {
                // Ignore stop errors
            }
        }
        
        this.isListening = false;
        this.elements.voiceInputBtn.innerHTML = '<i class="fas fa-microphone"></i>';
        this.elements.voiceInputBtn.style.background = '';
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
            this.showToast('Focus Mode', 'Entered focus mode - distractions minimized', 'success');
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
        } else {
            if (document.exitFullscreen) {
                document.exitFullscreen();
            } else if (document.webkitExitFullscreen) {
                document.webkitExitFullscreen();
            }
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
        
        const timerInterval = setInterval(() => {
            if (!this.state.isTimerRunning) {
                clearInterval(timerInterval);
                return;
            }
            
            if (this.state.pomodoroTime > 0) {
                this.state.pomodoroTime--;
                this.updateTimerDisplay();
                
                // Check for break time
                if (this.state.pomodoroTime === 0) {
                    this.showToast('Time\'s Up!', 'Take a 5-minute break', 'success');
                    
                    // Browser notification
                    if ('Notification' in window && Notification.permission === 'granted') {
                        new Notification('Savoiré AI', {
                            body: 'Pomodoro session complete! Take a 5-minute break.',
                            icon: 'LOGO.png'
                        });
                    }
                    
                    // Reset for break
                    this.state.pomodoroTime = 5 * 60; // 5 minute break
                }
            }
        }, 1000);
        
        this.timerInterval = timerInterval;
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
        if (this.timerInterval) {
            clearInterval(this.timerInterval);
        }
        
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
                console.error('Audio play failed:', e);
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
        
        this.showToast(
            this.elements.lofiAudio.muted ? 'Muted' : 'Unmuted',
            this.elements.lofiAudio.muted ? 'Music is muted' : 'Music is unmuted',
            'info'
        );
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
        
        // Update model select in header
        this.elements.modelSelect.value = this.state.currentModel;
        
        // Update UI
        this.updateUserAvatar();
        
        // Toggle music
        if (!this.state.musicEnabled && this.state.isMusicPlaying) {
            this.elements.lofiAudio.pause();
        }
        
        // Toggle animations
        this.toggleAnimations(this.state.animationsEnabled);
        
        this.showToast('Settings', 'Settings saved successfully', 'success');
        this.saveState();
        this.hideSettings();
    }
    
    /**
     * Toggle animations
     */
    toggleAnimations(enabled) {
        document.body.style.animationPlayState = enabled ? 'running' : 'paused';
        
        const animatedElements = document.querySelectorAll('[class*="animate"], [class*="animation"]');
        animatedElements.forEach(el => {
            el.style.animationPlayState = enabled ? 'running' : 'paused';
        });
    }
    
    /**
     * Reset settings to defaults
     */
    resetSettings() {
        if (confirm('Reset all settings to default values? This cannot be undone.')) {
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
        // Remove # if present
        hexColor = hexColor.replace('#', '');
        
        // Convert to RGB
        const r = parseInt(hexColor.substr(0, 2), 16);
        const g = parseInt(hexColor.substr(2, 2), 16);
        const b = parseInt(hexColor.substr(4, 2), 16);
        
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
            model: this.state.currentModel,
            preview: query.substring(0, 100) + (query.length > 100 ? '...' : '')
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
                    <p class="empty-subtitle">Start a conversation to see history here</p>
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
                <div class="history-content">
                    <div class="history-query">${this.escapeHtml(item.preview)}</div>
                    <div class="history-meta">
                        <span class="history-time">${timeString}</span>
                        <span class="history-date">${dateString}</span>
                        <span class="history-model">${item.model.split('/').pop().split(':')[0]}</span>
                    </div>
                </div>
                <button class="history-delete" title="Delete">
                    <i class="fas fa-trash"></i>
                </button>
            `;
            
            historyItem.addEventListener('click', (e) => {
                if (!e.target.closest('.history-delete')) {
                    this.loadFromHistory(item);
                }
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
        
        // Simulate AI response
        setTimeout(() => {
            this.hideGeneratingIndicator();
            this.addMessage(`This is a historical response for: "${item.query}"\n\nTo get a fresh response, please ask again or modify your query.`, 'ai');
            this.showToast('History', 'Loaded from history', 'info');
        }, 1000);
        
        this.hideHistorySidebar();
    }
    
    /**
     * Delete history item
     */
    deleteHistoryItem(id) {
        if (confirm('Delete this history item?')) {
            this.state.history = this.state.history.filter(item => item.id !== id);
            this.saveHistory();
            this.loadHistoryUI();
            this.showToast('History', 'Item deleted', 'info');
        }
    }
    
    /**
     * Clear chat
     */
    clearChat() {
        if (this.state.conversation.length === 0) return;
        
        if (confirm('Clear all messages? This cannot be undone.')) {
            this.elements.chatHistory.innerHTML = '';
            this.state.conversation = [];
            this.elements.notesContent.innerHTML = `
                <div class="notes-placeholder">
                    <div class="placeholder-icon">
                        <i class="fas fa-lightbulb"></i>
                    </div>
                    <h3>Your Notes Will Appear Here</h3>
                    <p>Ask a question or upload an image to generate comprehensive study notes.</p>
                    <p class="placeholder-tip">
                        <i class="fas fa-star"></i>
                        Pro Tip: Use images for diagrams, equations, or handwritten notes analysis.
                    </p>
                </div>
            `;
            
            this.showToast('Chat', 'All messages cleared', 'info');
            this.log('INFO', 'Chat cleared');
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
        const time = new Date().toLocaleTimeString([], { hour12: false });
        const logEntry = document.createElement('div');
        logEntry.className = 'log-entry';
        logEntry.innerHTML = `
            <span class="log-time">[${time}]</span>
            <span class="log-level" data-level="${level}">${level}</span>
            <span class="log-message">${this.escapeHtml(message)}</span>
        `;
        
        this.elements.consoleLogs.appendChild(logEntry);
        
        // Keep only last 100 logs
        const logs = this.elements.consoleLogs.querySelectorAll('.log-entry');
        if (logs.length > 100) {
            logs[0].remove();
        }
        
        // Auto-scroll to bottom
        this.elements.consoleLogs.scrollTop = this.elements.consoleLogs.scrollHeight;
        
        // Also log to browser console
        const consoleMethod = {
            'ERROR': console.error,
            'WARN': console.warn,
            'INFO': console.info,
            'DEBUG': console.debug
        }[level] || console.log;
        
        consoleMethod.call(console, `[${level}] ${message}`);
    }
    
    /**
     * Show toast notification
     */
    showToast(title, message, type = 'info') {
        // Remove existing toasts after 5 seconds
        const existingToasts = this.elements.toastContainer.querySelectorAll('.toast');
        if (existingToasts.length > 3) {
            existingToasts[0].remove();
        }
        
        const toast = document.createElement('div');
        toast.className = `toast ${type}`;
        
        const icons = {
            success: 'check-circle',
            error: 'exclamation-circle',
            warning: 'exclamation-triangle',
            info: 'info-circle'
        };
        
        toast.innerHTML = `
            <div class="toast-icon">
                <i class="fas fa-${icons[type] || 'info-circle'}"></i>
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
        
        // Animate in
        setTimeout(() => {
            toast.style.transform = 'translateX(0)';
            toast.style.opacity = '1';
        }, 10);
        
        // Close button
        const closeBtn = toast.querySelector('.toast-close');
        closeBtn.addEventListener('click', () => {
            toast.style.transform = 'translateX(100%)';
            toast.style.opacity = '0';
            setTimeout(() => toast.remove(), 300);
        });
        
        // Auto-remove after 5 seconds
        setTimeout(() => {
            if (toast.parentNode) {
                toast.style.transform = 'translateX(100%)';
                toast.style.opacity = '0';
                setTimeout(() => toast.remove(), 300);
            }
        }, 5000);
    }
    
    /**
     * Auto-resize textarea
     */
    autoResizeInput() {
        const textarea = this.elements.messageInput;
        textarea.style.height = 'auto';
        const newHeight = Math.min(textarea.scrollHeight, 150);
        textarea.style.height = newHeight + 'px';
        
        // Update send button position
        if (newHeight > 44) {
            this.elements.sendButton.style.alignSelf = 'flex-end';
        } else {
            this.elements.sendButton.style.alignSelf = 'center';
        }
    }
    
    /**
     * Handle input keydown
     */
    handleInputKeydown(e) {
        if (e.key === 'Enter' && !e.shiftKey && !e.ctrlKey && !e.altKey) {
            e.preventDefault();
            this.sendMessage();
        }
        
        // Ctrl+Enter already handled globally
        if (e.key === 'Enter' && e.shiftKey) {
            // Allow new line
            return;
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
        
        // Update UI for mobile/desktop
        if (window.innerWidth < 768) {
            document.body.classList.add('mobile');
            document.body.classList.remove('desktop');
        } else {
            document.body.classList.add('desktop');
            document.body.classList.remove('mobile');
        }
    }
    
    /**
     * Scroll chat to bottom
     */
    scrollToBottom() {
        setTimeout(() => {
            this.elements.chatHistory.scrollTo({
                top: this.elements.chatHistory.scrollHeight,
                behavior: 'smooth'
            });
        }, 100);
    }
    
    /**
     * Escape HTML to prevent XSS
     */
    escapeHtml(text) {
        if (!text) return '';
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
                this.elements.defaultModelSelect.value = this.state.currentModel;
                this.updateUserAvatar();
                this.updateTimerDisplay();
                this.updateMusicUI();
                this.toggleAnimations(this.state.animationsEnabled);
            }
        } catch (error) {
            console.error('Failed to load state:', error);
            this.log('ERROR', `Failed to load state: ${error.message}`);
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
            delete stateToSave.isGenerating;
            delete stateToSave.isTyping;
            
            localStorage.setItem('savoire-state', JSON.stringify(stateToSave));
            this.saveHistory();
            
            this.log('DEBUG', 'State saved to localStorage');
        } catch (error) {
            console.error('Failed to save state:', error);
            this.log('ERROR', `Failed to save state: ${error.message}`);
        }
    }
}

// Initialize the application
window.savoireApp = new SavoireApp();

// Make available globally
if (typeof module !== 'undefined' && module.exports) {
    module.exports = SavoireApp;
}
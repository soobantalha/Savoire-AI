// SAVOIRÉ AI - ELITE CINEMATIC ENGINE
// Premium AI Platform with Futuristic Features

class SavoireEliteAI {
    constructor() {
        // Core State
        this.appState = {
            isInitialized: false,
            isGenerating: false,
            isListening: false,
            isSidebarOpen: false,
            isFullscreen: false,
            isDarkMode: true,
            currentSession: null,
            sessions: [],
            conversation: [],
            voiceTranscript: '',
            thinkingQuotes: [
                "Building cognitive framework...",
                "Analyzing conceptual relationships...",
                "Generating Socratic questions...",
                "Structuring mental models...",
                "Preparing worked examples...",
                "Connecting interdisciplinary concepts..."
            ],
            motivationalQuotes: [
                "Education is not preparation for life; education is life itself. - John Dewey",
                "The mind is not a vessel to be filled, but a fire to be kindled. - Plutarch",
                "Intellectual growth should commence at birth and cease only at death. - Albert Einstein",
                "The beautiful thing about learning is that no one can take it away from you. - B.B. King",
                "Live as if you were to die tomorrow. Learn as if you were to live forever. - Mahatma Gandhi"
            ]
        };

        // DOM Elements
        this.elements = {};
        
        // Initialize
        this.initializeEngine();
        this.bindPremiumEvents();
        this.loadSessions();
        this.initializeNeuralBackground();
        this.initializeVoice();
        this.initializeMathJax();
    }

    // ==================== CORE INITIALIZATION ====================
    initializeEngine() {
        // Cache DOM elements
        this.cacheElements();
        
        // Initialize session
        this.createNewSession();
        
        // Start session timer
        this.startSessionTimer();
        
        // Initialize scroll animations
        this.initializeScrollAnimations();
        
        // Check online status
        this.initializeConnectivity();
        
        // Play initialization sound
        this.playSound('click');
        
        // Mark as initialized
        this.appState.isInitialized = true;
        
        console.log('🔥 Savoiré Elite AI Engine Initialized');
    }

    cacheElements() {
        // Core containers
        this.elements.appContainer = document.getElementById('appContainer');
        this.elements.welcomeArea = document.getElementById('welcomeArea');
        this.elements.messagesContainer = document.getElementById('messagesContainer');
        this.elements.chatMessages = document.getElementById('chatMessages');
        this.elements.thinkingIndicator = document.getElementById('thinkingIndicator');
        this.elements.thinkingMessage = document.getElementById('thinkingMessage');
        this.elements.thinkingQuote = document.getElementById('thinkingQuote');
        
        // Input elements
        this.elements.messageInput = document.getElementById('messageInput');
        this.elements.sendButton = document.getElementById('sendButton');
        this.elements.voiceBtn = document.getElementById('voiceBtn');
        this.elements.voiceInterface = document.getElementById('voiceInterface');
        this.elements.voiceVisualizer = document.getElementById('voiceVisualizer');
        this.elements.voiceTranscript = document.getElementById('voiceTranscript');
        this.elements.voiceClose = document.getElementById('voiceClose');
        
        // UI Controls
        this.elements.themeToggle = document.getElementById('themeToggle');
        this.elements.voiceToggle = document.getElementById('voiceToggle');
        this.elements.fullscreenToggle = document.getElementById('fullscreenToggle');
        this.elements.newSession = document.getElementById('newSession');
        this.elements.clearChatBtn = document.getElementById('clearChatBtn');
        this.elements.exportBtn = document.getElementById('exportBtn');
        this.elements.sidebarToggle = document.getElementById('sidebarToggle');
        
        // Quick actions
        this.elements.quickActions = document.getElementById('quickActions');
        
        // Stats
        this.elements.sessionMessages = document.getElementById('sessionMessages');
        this.elements.sessionTime = document.getElementById('sessionTime');
        this.elements.storageUsage = document.getElementById('storageUsage');
        
        // Modals
        this.elements.pdfModal = document.getElementById('pdfModal');
        this.elements.pdfModalClose = document.getElementById('pdfModalClose');
        this.elements.pdfGenerateBtn = document.getElementById('pdfGenerateBtn');
        this.elements.pdfPreviewBtn = document.getElementById('pdfPreviewBtn');
        
        // Toast container
        this.elements.toastContainer = document.getElementById('toastContainer');
    }

    // ==================== PREMIUM EVENT BINDING ====================
    bindPremiumEvents() {
        // Send message on button click
        this.elements.sendButton.addEventListener('click', () => this.sendMessage());
        
        // Send message on Enter (but allow Shift+Enter for new line)
        this.elements.messageInput.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                this.sendMessage();
            }
        });
        
        // Auto-resize textarea
        this.elements.messageInput.addEventListener('input', () => {
            this.autoResizeTextarea();
            this.animateInput();
        });
        
        // Voice controls
        this.elements.voiceBtn.addEventListener('click', () => this.toggleVoiceInput());
        this.elements.voiceClose.addEventListener('click', () => this.closeVoiceInterface());
        this.elements.voiceToggle.addEventListener('click', () => this.toggleVoiceInput());
        
        // Theme toggle
        this.elements.themeToggle.addEventListener('click', () => this.toggleTheme());
        
        // Fullscreen toggle
        this.elements.fullscreenToggle.addEventListener('click', () => this.toggleFullscreen());
        
        // New session
        this.elements.newSession.addEventListener('click', () => this.createNewSession());
        
        // Clear chat
        this.elements.clearChatBtn.addEventListener('click', () => this.clearCurrentSession());
        
        // Export session
        this.elements.exportBtn.addEventListener('click', () => this.exportSession());
        
        // Sidebar toggle
        this.elements.sidebarToggle.addEventListener('click', () => this.toggleSidebar());
        
        // PDF modal
        this.elements.pdfModalClose.addEventListener('click', () => this.closeModal('pdfModal'));
        this.elements.pdfGenerateBtn.addEventListener('click', () => this.generatePremiumPDF());
        this.elements.pdfPreviewBtn.addEventListener('click', () => this.previewPDF());
        
        // Quick start cards
        document.querySelectorAll('.start-card').forEach(card => {
            card.addEventListener('click', (e) => {
                this.animateButton(e.currentTarget);
                const prompt = e.currentTarget.getAttribute('data-prompt');
                this.elements.messageInput.value = prompt;
                setTimeout(() => this.sendMessage(), 300);
            });
        });
        
        // Quick action buttons
        document.querySelectorAll('.action-btn[data-action]').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const action = e.currentTarget.getAttribute('data-action');
                this.handleQuickAction(action);
            });
        });
        
        // PDF options
        document.querySelectorAll('.pdf-option').forEach(option => {
            option.addEventListener('click', (e) => {
                document.querySelectorAll('.pdf-option').forEach(opt => 
                    opt.classList.remove('selected'));
                e.currentTarget.classList.add('selected');
            });
        });
        
        // Magnetic buttons effect
        this.initializeMagneticButtons();
        
        // Click sound on interactive elements
        this.initializeClickSounds();
    }

    // ==================== CINEMATIC INITIALIZATIONS ====================
    initializeNeuralBackground() {
        const canvas = document.getElementById('neuralCanvas');
        if (!canvas) return;
        
        const ctx = canvas.getContext('2d');
        let width = window.innerWidth;
        let height = window.innerHeight;
        
        canvas.width = width;
        canvas.height = height;
        
        // Neural nodes
        const nodes = [];
        const connections = [];
        const nodeCount = 50;
        
        // Create nodes
        for (let i = 0; i < nodeCount; i++) {
            nodes.push({
                x: Math.random() * width,
                y: Math.random() * height,
                vx: (Math.random() - 0.5) * 0.5,
                vy: (Math.random() - 0.5) * 0.5,
                radius: Math.random() * 2 + 1,
                glow: Math.random() * 0.5 + 0.5
            });
        }
        
        // Create connections
        for (let i = 0; i < nodes.length; i++) {
            for (let j = i + 1; j < nodes.length; j++) {
                const dx = nodes[i].x - nodes[j].x;
                const dy = nodes[i].y - nodes[j].y;
                const distance = Math.sqrt(dx * dx + dy * dy);
                
                if (distance < 150) {
                    connections.push({
                        node1: nodes[i],
                        node2: nodes[j],
                        distance: distance,
                        opacity: 1 - (distance / 150)
                    });
                }
            }
        }
        
        // Mouse interaction
        let mouse = { x: 0, y: 0 };
        canvas.addEventListener('mousemove', (e) => {
            const rect = canvas.getBoundingClientRect();
            mouse.x = e.clientX - rect.left;
            mouse.y = e.clientY - rect.top;
        });
        
        // Animation loop
        const animate = () => {
            // Clear with fade effect
            ctx.fillStyle = 'rgba(10, 10, 10, 0.05)';
            ctx.fillRect(0, 0, width, height);
            
            // Update nodes
            nodes.forEach(node => {
                // Move nodes
                node.x += node.vx;
                node.y += node.vy;
                
                // Bounce off edges
                if (node.x < 0 || node.x > width) node.vx *= -1;
                if (node.y < 0 || node.y > height) node.vy *= -1;
                
                // Mouse repulsion
                const dx = mouse.x - node.x;
                const dy = mouse.y - node.y;
                const distance = Math.sqrt(dx * dx + dy * dy);
                
                if (distance < 100) {
                    node.vx -= dx * 0.0001;
                    node.vy -= dy * 0.0001;
                }
                
                // Draw node glow
                const gradient = ctx.createRadialGradient(
                    node.x, node.y, 0,
                    node.x, node.y, node.radius * 3
                );
                gradient.addColorStop(0, `rgba(255, 215, 0, ${node.glow * 0.3})`);
                gradient.addColorStop(1, 'rgba(255, 215, 0, 0)');
                
                ctx.fillStyle = gradient;
                ctx.beginPath();
                ctx.arc(node.x, node.y, node.radius * 3, 0, Math.PI * 2);
                ctx.fill();
                
                // Draw node
                ctx.fillStyle = 'rgba(255, 215, 0, 0.8)';
                ctx.beginPath();
                ctx.arc(node.x, node.y, node.radius, 0, Math.PI * 2);
                ctx.fill();
            });
            
            // Draw connections
            connections.forEach(conn => {
                const dx = conn.node1.x - conn.node2.x;
                const dy = conn.node1.y - conn.node2.y;
                const distance = Math.sqrt(dx * dx + dy * dy);
                
                if (distance < 150) {
                    ctx.strokeStyle = `rgba(255, 215, 0, ${conn.opacity * 0.2})`;
                    ctx.lineWidth = 0.5;
                    ctx.beginPath();
                    ctx.moveTo(conn.node1.x, conn.node1.y);
                    ctx.lineTo(conn.node2.x, conn.node2.y);
                    ctx.stroke();
                }
            });
            
            requestAnimationFrame(animate);
        };
        
        // Handle resize
        window.addEventListener('resize', () => {
            width = window.innerWidth;
            height = window.innerHeight;
            canvas.width = width;
            canvas.height = height;
        });
        
        animate();
    }

    initializeVoice() {
        if (!('webkitSpeechRecognition' in window || 'SpeechRecognition' in window)) {
            console.warn('Speech recognition not supported');
            this.elements.voiceBtn.style.display = 'none';
            this.elements.voiceToggle.style.display = 'none';
            return;
        }
        
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        this.recognition = new SpeechRecognition();
        
        this.recognition.continuous = false;
        this.recognition.interimResults = true;
        this.recognition.lang = 'en-US';
        this.recognition.maxAlternatives = 1;
        
        this.recognition.onstart = () => {
            this.appState.isListening = true;
            this.elements.voiceBtn.classList.add('voice-active');
            this.elements.voiceInterface.style.display = 'block';
            this.updateVoiceVisualizer();
            this.showToast('Voice input active', 'info');
        };
        
        this.recognition.onresult = (event) => {
            let transcript = '';
            for (let i = event.resultIndex; i < event.results.length; i++) {
                if (event.results[i].isFinal) {
                    transcript += event.results[i][0].transcript;
                } else {
                    transcript += event.results[i][0].transcript;
                }
            }
            
            this.appState.voiceTranscript = transcript;
            this.elements.voiceTranscript.textContent = transcript;
            
            // Update input if we have final results
            if (event.results[event.results.length - 1].isFinal) {
                this.elements.messageInput.value = transcript;
                this.autoResizeTextarea();
            }
        };
        
        this.recognition.onend = () => {
            this.appState.isListening = false;
            this.elements.voiceBtn.classList.remove('voice-active');
            
            if (this.appState.voiceTranscript) {
                setTimeout(() => {
                    this.sendMessage();
                    this.appState.voiceTranscript = '';
                    this.elements.voiceTranscript.textContent = '';
                }, 500);
            }
            
            setTimeout(() => {
                if (!this.appState.isListening) {
                    this.elements.voiceInterface.style.display = 'none';
                }
            }, 1000);
        };
        
        this.recognition.onerror = (event) => {
            console.error('Speech recognition error:', event.error);
            this.showToast(`Voice error: ${event.error}`, 'error');
            this.appState.isListening = false;
            this.elements.voiceBtn.classList.remove('voice-active');
            this.elements.voiceInterface.style.display = 'none';
        };
    }

    initializeMathJax() {
        window.MathJax = {
            tex: {
                inlineMath: [['$', '$'], ['\\(', '\\)']],
                displayMath: [['$$', '$$'], ['\\[', '\\]']],
                processEscapes: true,
                processEnvironments: true
            },
            options: {
                skipHtmlTags: ['script', 'noscript', 'style', 'textarea', 'pre', 'code'],
                ignoreHtmlClass: 'tex2jax_ignore',
                processHtmlClass: 'tex2jax_process'
            },
            startup: {
                pageReady: () => {
                    return MathJax.startup.defaultPageReady();
                }
            }
        };
    }

    initializeScrollAnimations() {
        this.observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('animate-in');
                }
            });
        }, { threshold: 0.1, rootMargin: '0px 0px -50px 0px' });
        
        // Observe study sections
        setTimeout(() => {
            document.querySelectorAll('.study-section').forEach(section => {
                this.observer.observe(section);
            });
        }, 1000);
    }

    initializeMagneticButtons() {
        document.querySelectorAll('.magnetic').forEach(button => {
            button.addEventListener('mousemove', (e) => {
                const rect = button.getBoundingClientRect();
                const x = e.clientX - rect.left;
                const y = e.clientY - rect.top;
                
                const centerX = rect.width / 2;
                const centerY = rect.height / 2;
                
                const deltaX = (x - centerX) / centerX;
                const deltaY = (y - centerY) / centerY;
                
                button.style.transform = `translate(${deltaX * 5}px, ${deltaY * 5}px)`;
            });
            
            button.addEventListener('mouseleave', () => {
                button.style.transform = 'translate(0, 0)';
            });
        });
    }

    initializeClickSounds() {
        document.querySelectorAll('button, .start-card, .pdf-option').forEach(element => {
            element.addEventListener('click', () => {
                this.playSound('click');
            });
        });
    }

    initializeConnectivity() {
        window.addEventListener('online', () => {
            this.showToast('Back online - AI connected', 'success');
        });
        
        window.addEventListener('offline', () => {
            this.showToast('Connection lost - working offline', 'warning');
        });
    }

    // ==================== CORE FUNCTIONALITY ====================
    async sendMessage() {
        const message = this.elements.messageInput.value.trim();
        if (!message || this.appState.isGenerating) return;
        
        // Hide welcome, show messages
        this.elements.welcomeArea.style.display = 'none';
        this.elements.messagesContainer.style.display = 'block';
        
        // Add user message
        this.addMessage(message, 'user');
        
        // Clear input with animation
        this.animateClearInput();
        
        // Show thinking indicator
        this.showThinking();
        
        // Update state
        this.appState.isGenerating = true;
        this.elements.sendButton.disabled = true;
        
        try {
            const studyData = await this.generateCognitiveResponse(message);
            this.hideThinking();
            this.displayCognitiveResponse(studyData);
        } catch (error) {
            this.hideThinking();
            this.showError(error.message);
        }
        
        this.appState.isGenerating = false;
        this.elements.sendButton.disabled = false;
        this.updateSessionStats();
    }

    async generateCognitiveResponse(message) {
        console.log('🚀 Sending cognitive request:', message);
        
        const response = await fetch('/api/study', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ 
                message,
                mode: 'cognitive',
                include_math: true,
                depth: 'elite'
            })
        });
        
        if (!response.ok) {
            throw new Error(`API Error: ${response.status}`);
        }
        
        const data = await response.json();
        console.log('🧠 Received cognitive data:', data);
        return data;
    }

    addMessage(content, type) {
        const messageDiv = document.createElement('div');
        messageDiv.className = `message ${type}-message`;
        
        const time = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        
        if (type === 'user') {
            messageDiv.innerHTML = `
                <div class="message-avatar user-avatar">👤</div>
                <div class="message-content">
                    <div class="message-text">${this.escapeHtml(content)}</div>
                    <div class="message-actions">
                        <button class="action-icon copy-btn" title="Copy">
                            <i class="fas fa-copy"></i>
                        </button>
                        <button class="action-icon edit-btn" title="Edit">
                            <i class="fas fa-edit"></i>
                        </button>
                    </div>
                    <div class="message-time">${time}</div>
                </div>
            `;
        } else {
            messageDiv.innerHTML = `
                <div class="message-avatar ai-avatar">
                    <div class="logo-orb small">
                        <div class="logo-core">
                            <img src="LOGO.png" alt="Savoiré AI">
                        </div>
                    </div>
                </div>
                <div class="message-content">
                    ${content}
                    <div class="message-actions">
                        <button class="action-icon copy-btn" title="Copy">
                            <i class="fas fa-copy"></i>
                        </button>
                        <button class="action-icon like-btn" title="Like">
                            <i class="fas fa-thumbs-up"></i>
                        </button>
                        <button class="action-icon pdf-btn" title="Generate PDF">
                            <i class="fas fa-file-pdf"></i>
                        </button>
                    </div>
                    <div class="message-time">${time}</div>
                </div>
            `;
            
            // Bind action buttons for AI messages
            setTimeout(() => {
                const aiMessage = messageDiv.querySelector('.message-content');
                aiMessage.querySelector('.copy-btn')?.addEventListener('click', () => 
                    this.copyToClipboard(aiMessage.querySelector('.study-materials') || aiMessage));
                
                aiMessage.querySelector('.like-btn')?.addEventListener('click', () => 
                    this.showToast('Response liked!', 'success'));
                
                aiMessage.querySelector('.pdf-btn')?.addEventListener('click', () => 
                    this.openPDFModal(aiMessage.querySelector('.study-materials')));
            }, 100);
        }
        
        this.elements.chatMessages.appendChild(messageDiv);
        this.scrollToBottom();
        
        // Add to conversation history
        this.appState.conversation.push({ type, content, time });
        
        // Update stats
        this.updateSessionStats();
        
        // Trigger MathJax rendering for AI messages
        if (type === 'ai' && window.MathJax) {
            setTimeout(() => {
                MathJax.typesetPromise([messageDiv]).catch(console.error);
            }, 100);
        }
    }

    displayCognitiveResponse(data) {
        const formattedContent = this.formatCognitiveData(data);
        this.addMessage(formattedContent, 'ai');
        
        // Add scroll animations
        setTimeout(() => {
            document.querySelectorAll('.study-section').forEach(section => {
                this.observer.observe(section);
            });
        }, 100);
    }

    formatCognitiveData(data) {
        if (data.error) {
            return `
                <div class="error-message">
                    <h3><i class="fas fa-exclamation-triangle"></i> Unable to Generate Response</h3>
                    <p>${data.error}</p>
                    <button class="action-btn magnetic" onclick="savoireAI.retryLastMessage()">
                        <i class="fas fa-redo"></i> Retry
                    </button>
                </div>
            `;
        }
        
        return `
            <div class="study-materials" data-topic="${this.escapeHtml(data.topic)}">
                <!-- Header -->
                <div class="study-section">
                    <div class="study-header">
                        <h1 class="study-title">${this.escapeHtml(data.topic)}</h1>
                        <div class="study-meta">
                            <span><i class="fas fa-chart-line"></i> ${data.difficulty_level || 'Advanced'}</span>
                            <span><i class="fas fa-clock"></i> ${data.estimated_study_time || '30-45 minutes'}</span>
                            <span><i class="fas fa-brain"></i> Confidence: ${data.confidence_score || 96}/100</span>
                        </div>
                        <div class="powered-by">
                            Powered by <a href="https://soobantalhatech.xyz" target="_blank" class="brand-link">Sooban Talha Technologies</a>
                        </div>
                    </div>
                </div>

                <!-- One Line Intuition -->
                ${data.one_line_intuition ? `
                <div class="study-section">
                    <h2 class="section-title"><i class="fas fa-bolt"></i> ONE-LINE INTUITION</h2>
                    <div class="intuition-card">
                        <p>${this.escapeHtml(data.one_line_intuition)}</p>
                    </div>
                </div>
                ` : ''}

                <!-- Mental Model -->
                ${data.mental_model ? `
                <div class="study-section">
                    <h2 class="section-title"><i class="fas fa-chess-board"></i> MENTAL MODEL</h2>
                    <div class="mental-model-grid">
                        ${data.mental_model.visualization ? `
                        <div class="model-card">
                            <h3><i class="fas fa-eye"></i> Visualization</h3>
                            <p>${this.escapeHtml(data.mental_model.visualization)}</p>
                        </div>
                        ` : ''}
                        
                        ${data.mental_model.analogy ? `
                        <div class="model-card">
                            <h3><i class="fas fa-balance-scale"></i> Analogy</h3>
                            <p>${this.escapeHtml(data.mental_model.analogy)}</p>
                        </div>
                        ` : ''}
                        
                        ${data.mental_model.why_it_works ? `
                        <div class="model-card">
                            <h3><i class="fas fa-cogs"></i> Why It Works</h3>
                            <p>${this.escapeHtml(data.mental_model.why_it_works)}</p>
                        </div>
                        ` : ''}
                    </div>
                </div>
                ` : ''}

                <!-- Conceptual Breakdown -->
                ${data.conceptual_breakdown && data.conceptual_breakdown.length > 0 ? `
                <div class="study-section">
                    <h2 class="section-title"><i class="fas fa-puzzle-piece"></i> CONCEPTUAL BREAKDOWN</h2>
                    <div class="concepts-accordion">
                        ${data.conceptual_breakdown.map((concept, index) => `
                            <div class="concept-card">
                                <div class="concept-header">
                                    <h3>${index + 1}. ${this.escapeHtml(concept.concept)}</h3>
                                    <i class="fas fa-chevron-down"></i>
                                </div>
                                <div class="concept-content">
                                    ${concept.intuition ? `
                                    <div class="concept-item">
                                        <strong><i class="fas fa-lightbulb"></i> Intuition:</strong>
                                        <p>${this.escapeHtml(concept.intuition)}</p>
                                    </div>
                                    ` : ''}
                                    
                                    ${concept.formal_definition ? `
                                    <div class="concept-item">
                                        <strong><i class="fas fa-book"></i> Formal Definition:</strong>
                                        <p>${this.escapeHtml(concept.formal_definition)}</p>
                                    </div>
                                    ` : ''}
                                    
                                    ${concept.common_confusion ? `
                                    <div class="concept-item">
                                        <strong><i class="fas fa-exclamation-triangle"></i> Common Confusion:</strong>
                                        <p>${this.escapeHtml(concept.common_confusion)}</p>
                                    </div>
                                    ` : ''}
                                    
                                    ${concept.clarification ? `
                                    <div class="concept-item">
                                        <strong><i class="fas fa-check-circle"></i> Clarification:</strong>
                                        <p>${this.escapeHtml(concept.clarification)}</p>
                                    </div>
                                    ` : ''}
                                </div>
                            </div>
                        `).join('')}
                    </div>
                </div>
                ` : ''}

                <!-- Ultra Detailed Notes -->
                ${data.ultra_long_notes ? `
                <div class="study-section">
                    <h2 class="section-title"><i class="fas fa-book-open"></i> COMPREHENSIVE ANALYSIS</h2>
                    <div class="ultra-notes">
                        ${this.formatDetailedNotes(data.ultra_long_notes)}
                    </div>
                </div>
                ` : ''}

                <!-- Worked Examples -->
                ${data.worked_examples && data.worked_examples.length > 0 ? `
                <div class="study-section">
                    <h2 class="section-title"><i class="fas fa-calculator"></i> WORKED EXAMPLES</h2>
                    <div class="examples-grid">
                        ${data.worked_examples.map((example, index) => `
                            <div class="example-card">
                                <div class="example-header">
                                    <span class="example-number">Example ${index + 1}</span>
                                    <span class="example-difficulty">${example.difficulty || 'Standard'}</span>
                                </div>
                                <div class="example-problem">
                                    <strong>Problem:</strong>
                                    <p>${this.escapeHtml(example.problem)}</p>
                                </div>
                                <div class="example-solution">
                                    <strong>Solution Process:</strong>
                                    <p>${this.escapeHtml(example.thinking_process)}</p>
                                </div>
                                <div class="example-steps">
                                    <strong>Step-by-Step:</strong>
                                    <div class="steps">${this.formatSteps(example.solution_steps)}</div>
                                </div>
                                <div class="example-answer">
                                    <strong>Final Answer:</strong>
                                    <p>${this.escapeHtml(example.final_answer)}</p>
                                </div>
                            </div>
                        `).join('')}
                    </div>
                </div>
                ` : ''}

                <!-- Key Tricks -->
                ${data.key_tricks && data.key_tricks.length > 0 ? `
                <div class="study-section">
                    <h2 class="section-title"><i class="fas fa-magic"></i> KEY TRICKS & SHORTCUTS</h2>
                    <div class="tricks-grid">
                        ${data.key_tricks.map((trick, index) => `
                            <div class="trick-card">
                                <div class="trick-icon">
                                    <i class="fas fa-star"></i>
                                </div>
                                <h3>${index + 1}. ${this.escapeHtml(trick.trick)}</h3>
                                ${trick.when_to_use ? `
                                <div class="trick-when">
                                    <strong>When to use:</strong>
                                    <p>${this.escapeHtml(trick.when_to_use)}</p>
                                </div>
                                ` : ''}
                                ${trick.why_it_works ? `
                                <div class="trick-why">
                                    <strong>Why it works:</strong>
                                    <p>${this.escapeHtml(trick.why_it_works)}</p>
                                </div>
                                ` : ''}
                            </div>
                        `).join('')}
                    </div>
                </div>
                ` : ''}

                <!-- Exam Focus -->
                ${data.exam_focus ? `
                <div class="study-section">
                    <h2 class="section-title"><i class="fas fa-graduation-cap"></i> EXAM FOCUS</h2>
                    <div class="exam-focus-grid">
                        ${data.exam_focus.frequently_asked_patterns && data.exam_focus.frequently_asked_patterns.length > 0 ? `
                        <div class="exam-card">
                            <h3><i class="fas fa-history"></i> Frequently Asked Patterns</h3>
                            <ul>
                                ${data.exam_focus.frequently_asked_patterns.map(pattern => `
                                    <li>${this.escapeHtml(pattern)}</li>
                                `).join('')}
                            </ul>
                        </div>
                        ` : ''}
                        
                        ${data.exam_focus.how_examiners_trick_students && data.exam_focus.how_examiners_trick_students.length > 0 ? `
                        <div class="exam-card">
                            <h3><i class="fas fa-trick"></i> Examiner's Tricks</h3>
                            <ul>
                                ${data.exam_focus.how_examiners_trick_students.map(trick => `
                                    <li>${this.escapeHtml(trick)}</li>
                                `).join('')}
                            </ul>
                        </div>
                        ` : ''}
                        
                        ${data.exam_focus.how_toppers_think_differently && data.exam_focus.how_toppers_think_differently.length > 0 ? `
                        <div class="exam-card">
                            <h3><i class="fas fa-crown"></i> Topper's Mindset</h3>
                            <ul>
                                ${data.exam_focus.how_toppers_think_differently.map(thought => `
                                    <li>${this.escapeHtml(thought)}</li>
                                `).join('')}
                            </ul>
                        </div>
                        ` : ''}
                    </div>
                </div>
                ` : ''}

                <!-- Interdisciplinary Connections -->
                ${data.interdisciplinary_connections && data.interdisciplinary_connections.length > 0 ? `
                <div class="study-section">
                    <h2 class="section-title"><i class="fas fa-project-diagram"></i> INTERDISCIPLINARY CONNECTIONS</h2>
                    <div class="connections-grid">
                        ${data.interdisciplinary_connections.map(connection => `
                            <div class="connection-card">
                                <h3><i class="fas fa-link"></i> ${this.escapeHtml(connection.field)}</h3>
                                <p><strong>Connection:</strong> ${this.escapeHtml(connection.connection)}</p>
                                ${connection.why_it_matters ? `
                                <p><strong>Significance:</strong> ${this.escapeHtml(connection.why_it_matters)}</p>
                                ` : ''}
                            </div>
                        `).join('')}
                    </div>
                </div>
                ` : ''}

                <!-- Real World Applications -->
                ${data.real_world_applications && data.real_world_applications.length > 0 ? `
                <div class="study-section">
                    <h2 class="section-title"><i class="fas fa-globe"></i> REAL-WORLD APPLICATIONS</h2>
                    <div class="applications-grid">
                        ${data.real_world_applications.map((app, index) => `
                            <div class="application-card">
                                <div class="app-number">${index + 1}</div>
                                <h3>${this.escapeHtml(app.application)}</h3>
                                ${app.where_it_is_used ? `
                                <p><strong>Where used:</strong> ${this.escapeHtml(app.where_it_is_used)}</p>
                                ` : ''}
                                ${app.impact ? `
                                <p><strong>Impact:</strong> ${this.escapeHtml(app.impact)}</p>
                                ` : ''}
                            </div>
                        `).join('')}
                    </div>
                </div>
                ` : ''}

                <!-- Misconceptions -->
                ${data.misconceptions_and_pitfalls && data.misconceptions_and_pitfalls.length > 0 ? `
                <div class="study-section">
                    <h2 class="section-title"><i class="fas fa-exclamation-circle"></i> COMMON MISCONCEPTIONS</h2>
                    <div class="misconceptions-grid">
                        ${data.misconceptions_and_pitfalls.map((misconception, index) => `
                            <div class="misconception-card">
                                <div class="misconception-header">
                                    <span class="misconception-wrong">${this.escapeHtml(misconception.misconception)}</span>
                                    <i class="fas fa-times error-color"></i>
                                </div>
                                ${misconception.why_it_is_wrong ? `
                                <div class="misconception-why">
                                    <strong>Why it's wrong:</strong>
                                    <p>${this.escapeHtml(misconception.why_it_is_wrong)}</p>
                                </div>
                                ` : ''}
                                ${misconception.correct_thinking ? `
                                <div class="misconception-correct">
                                    <strong>Correct thinking:</strong>
                                    <p>${this.escapeHtml(misconception.correct_thinking)}</p>
                                </div>
                                ` : ''}
                            </div>
                        `).join('')}
                    </div>
                </div>
                ` : ''}

                <!-- Active Recall -->
                ${data.active_recall ? `
                <div class="study-section">
                    <h2 class="section-title"><i class="fas fa-brain"></i> ACTIVE RECALL</h2>
                    <div class="active-recall-grid">
                        ${data.active_recall.quick_check_questions && data.active_recall.quick_check_questions.length > 0 ? `
                        <div class="recall-card">
                            <h3><i class="fas fa-question-circle"></i> Quick Check</h3>
                            <ol>
                                ${data.active_recall.quick_check_questions.map((question, index) => `
                                    <li>${this.escapeHtml(question)}</li>
                                `).join('')}
                            </ol>
                        </div>
                        ` : ''}
                        
                        ${data.active_recall.challenge_question ? `
                        <div class="recall-card challenge">
                            <h3><i class="fas fa-flag"></i> Challenge Question</h3>
                            <p>${this.escapeHtml(data.active_recall.challenge_question)}</p>
                            <button class="action-btn magnetic show-answer">
                                <i class="fas fa-eye"></i> Show Answer
                            </button>
                        </div>
                        ` : ''}
                    </div>
                </div>
                ` : ''}

                <!-- Memory Anchors -->
                ${data.memory_anchors && data.memory_anchors.length > 0 ? `
                <div class="study-section">
                    <h2 class="section-title"><i class="fas fa-anchor"></i> MEMORY ANCHORS</h2>
                    <div class="anchors-grid">
                        ${data.memory_anchors.map((anchor, index) => `
                            <div class="anchor-card">
                                <div class="anchor-number">${index + 1}</div>
                                <p>${this.escapeHtml(anchor)}</p>
                            </div>
                        `).join('')}
                    </div>
                </div>
                ` : ''}

                <!-- Summary for Revision -->
                ${data.summary_for_revision ? `
                <div class="study-section">
                    <h2 class="section-title"><i class="fas fa-file-alt"></i> REVISION SUMMARY</h2>
                    <div class="summary-grid">
                        ${data.summary_for_revision.bullet_summary && data.summary_for_revision.bullet_summary.length > 0 ? `
                        <div class="summary-card">
                            <h3><i class="fas fa-list"></i> Key Points</h3>
                            <ul>
                                ${data.summary_for_revision.bullet_summary.map(point => `
                                    <li>${this.escapeHtml(point)}</li>
                                `).join('')}
                            </ul>
                        </div>
                        ` : ''}
                        
                        ${data.summary_for_revision.formula_sheet_if_any && data.summary_for_revision.formula_sheet_if_any.length > 0 ? `
                        <div class="summary-card">
                            <h3><i class="fas fa-square-root-alt"></i> Formula Sheet</h3>
                            <div class="formula-list">
                                ${data.summary_for_revision.formula_sheet_if_any.map(formula => `
                                    <div class="formula-item">${this.escapeHtml(formula)}</div>
                                `).join('')}
                            </div>
                        </div>
                        ` : ''}
                    </div>
                </div>
                ` : ''}

                <!-- Next Level Extensions -->
                ${data.next_level_extensions && data.next_level_extensions.length > 0 ? `
                <div class="study-section">
                    <h2 class="section-title"><i class="fas fa-rocket"></i> NEXT LEVEL EXTENSIONS</h2>
                    <div class="extensions-list">
                        ${data.next_level_extensions.map((extension, index) => `
                            <div class="extension-item">
                                <div class="extension-number">${index + 1}</div>
                                <p>${this.escapeHtml(extension)}</p>
                            </div>
                        `).join('')}
                    </div>
                </div>
                ` : ''}

                <!-- PDF Generation -->
                <div class="study-section">
                    <div class="pdf-generation-section">
                        <h3><i class="fas fa-file-pdf"></i> PREMIUM PDF EXPORT</h3>
                        <p>Generate a beautifully formatted PDF with all the content above, ready for printing or offline study.</p>
                        <div class="pdf-options-inline">
                            <button class="action-btn magnetic" onclick="savoireAI.generatePremiumPDF('summary', this)">
                                <i class="fas fa-file-alt"></i> Summary PDF
                            </button>
                            <button class="action-btn magnetic" onclick="savoireAI.generatePremiumPDF('full', this)">
                                <i class="fas fa-book"></i> Full Notes
                            </button>
                            <button class="action-btn magnetic premium" onclick="savoireAI.generatePremiumPDF('exam', this)">
                                <i class="fas fa-graduation-cap"></i> Exam Ready
                            </button>
                        </div>
                    </div>
                </div>

                <!-- Footer -->
                <div class="study-section">
                    <div class="study-footer">
                        <div class="generation-info">
                            <p>
                                <i class="fas fa-robot"></i> Generated by Savoiré AI Cognitive Engine
                                <br>
                                <i class="fas fa-calendar"></i> ${data.generation_timestamp || new Date().toLocaleString()}
                                <br>
                                <i class="fas fa-code-branch"></i> by <a href="https://soobantalhatech.xyz" target="_blank" class="brand-link">Sooban Talha Technologies</a>
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

    formatDetailedNotes(notes) {
        if (!notes) return '<p>No detailed notes available.</p>';
        
        let formatted = notes;
        
        // Format headers
        formatted = formatted.replace(/### (.*?)(?=\n|$)/g, '<h3 style="color: var(--accent-primary); margin: 1.5rem 0 1rem 0;">$1</h3>');
        formatted = formatted.replace(/## (.*?)(?=\n|$)/g, '<h2 style="color: var(--accent-primary); margin: 2rem 0 1rem 0; border-bottom: 2px solid var(--glass-border); padding-bottom: 0.5rem;">$1</h2>');
        formatted = formatted.replace(/# (.*?)(?=\n|$)/g, '<h1 style="color: var(--accent-primary); margin: 2.5rem 0 1.5rem 0; text-align: center;">$1</h1>');
        
        // Format bold and italic
        formatted = formatted.replace(/\*\*(.*?)\*\*/g, '<strong style="color: var(--accent-primary);">$1</strong>');
        formatted = formatted.replace(/\*(.*?)\*/g, '<em>$1</em>');
        
        // Format lists
        formatted = formatted.replace(/\n\s*[-•*]\s+(.*?)(?=\n|$)/g, '\n<li>$1</li>');
        formatted = formatted.replace(/(<li>.*<\/li>)/g, '<ul>$1</ul>');
        
        // Format paragraphs
        formatted = formatted.split('\n\n').map(para => {
            if (!para.startsWith('<') && para.trim()) {
                return `<p>${para}</p>`;
            }
            return para;
        }).join('\n');
        
        // Format inline math (simple support)
        formatted = formatted.replace(/\$(.*?)\$/g, '<span class="math-inline">$1</span>');
        
        return formatted;
    }

    formatSteps(steps) {
        if (!steps) return '';
        
        if (typeof steps === 'string') {
            return steps.split('\n').map(step => 
                `<div class="step">${this.escapeHtml(step.trim())}</div>`
            ).join('');
        }
        
        return '';
    }

    // ==================== PREMIUM PDF GENERATION ====================
    generatePremiumPDF(type = 'full', button = null) {
        if (button) this.animateButton(button);
        
        const { jsPDF } = window.jspdf;
        const doc = new jsPDF();
        
        const studyMaterials = document.querySelector('.study-materials');
        if (!studyMaterials) {
            this.showToast('No study materials found', 'error');
            return;
        }
        
        const topic = studyMaterials.getAttribute('data-topic') || 'Study Materials';
        
        // Show loading
        this.showToast('Generating premium PDF...', 'info');
        
        // Generate based on type
        switch(type) {
            case 'summary':
                this.generateSummaryPDF(doc, topic, studyMaterials);
                break;
            case 'exam':
                this.generateExamPDF(doc, topic, studyMaterials);
                break;
            default:
                this.generateFullPDF(doc, topic, studyMaterials);
        }
        
        // Save the PDF
        const fileName = `SavoireAI_${type}_${topic.replace(/[^a-zA-Z0-9]/g, '_')}_${Date.now()}.pdf`;
        doc.save(fileName);
        
        this.showToast('PDF generated successfully!', 'success');
    }

    generateFullPDF(doc, topic, studyMaterials) {
        // Cover Page
        this.generateCoverPage(doc, topic);
        
        // Table of Contents
        this.generateTableOfContents(doc, studyMaterials);
        
        // Add content sections
        let yPosition = 40;
        let pageNumber = 2;
        
        // Helper function to add section
        const addSection = (title, content, isHeader = false) => {
            if (yPosition > 270) {
                doc.addPage();
                yPosition = 20;
                pageNumber++;
                this.addPageFooter(doc, pageNumber, topic);
            }
            
            if (isHeader) {
                doc.setFontSize(16);
                doc.setFont(undefined, 'bold');
                doc.setTextColor(255, 215, 0);
                doc.text(title, 20, yPosition);
                yPosition += 10;
                
                doc.setDrawColor(255, 215, 0);
                doc.setLineWidth(0.5);
                doc.line(20, yPosition, 190, yPosition);
                yPosition += 15;
            } else {
                doc.setFontSize(12);
                doc.setFont(undefined, 'bold');
                doc.setTextColor(0, 0, 0);
                doc.text(title, 20, yPosition);
                yPosition += 8;
                
                doc.setFontSize(10);
                doc.setFont(undefined, 'normal');
                const lines = doc.splitTextToSize(content, 170);
                doc.text(lines, 25, yPosition);
                yPosition += (lines.length * 5) + 10;
            }
            
            return yPosition;
        };
        
        // Extract and add sections from study materials
        const sections = studyMaterials.querySelectorAll('.study-section');
        sections.forEach((section, index) => {
            const title = section.querySelector('.section-title')?.textContent || `Section ${index + 1}`;
            const content = this.stripHtml(section.innerHTML);
            
            addSection(title, content, index === 0);
        });
        
        // Add final page with branding
        doc.addPage();
        this.generateBrandingPage(doc, topic);
    }

    generateCoverPage(doc, topic) {
        // Gold background
        doc.setFillColor(255, 215, 0);
        doc.rect(0, 0, 210, 297, 'F');
        
        // Black overlay with gradient effect
        const gradient = doc.context2d.createLinearGradient(0, 0, 210, 297);
        gradient.addColorStop(0, 'rgba(0, 0, 0, 0.8)');
        gradient.addColorStop(1, 'rgba(0, 0, 0, 0.4)');
        doc.setFillColor(0, 0, 0);
        doc.rect(0, 0, 210, 297, 'F');
        
        // Logo area
        doc.setFillColor(255, 215, 0);
        doc.circle(105, 100, 30, 'F');
        
        // Title
        doc.setTextColor(255, 215, 0);
        doc.setFontSize(32);
        doc.setFont(undefined, 'bold');
        doc.text('SAVOIRÉ AI', 105, 160, { align: 'center' });
        
        // Subtitle
        doc.setFontSize(14);
        doc.text('ELITE COGNITIVE PLATFORM', 105, 175, { align: 'center' });
        
        // Topic
        doc.setFontSize(24);
        doc.text(topic.toUpperCase(), 105, 220, { align: 'center' });
        
        // Decorative line
        doc.setDrawColor(255, 215, 0);
        doc.setLineWidth(2);
        doc.line(50, 230, 160, 230);
        
        // Branding
        doc.setFontSize(10);
        doc.setTextColor(255, 255, 255, 0.7);
        doc.text('Generated by', 105, 260, { align: 'center' });
        
        doc.setFontSize(12);
        doc.setTextColor(255, 215, 0);
        doc.text('Sooban Talha Technologies', 105, 270, { align: 'center' });
        
        doc.setFontSize(8);
        doc.setTextColor(255, 255, 255, 0.5);
        doc.text('https://soobantalhatech.xyz', 105, 275, { align: 'center' });
        
        doc.setTextColor(255, 255, 255, 0.3);
        doc.text(new Date().toLocaleDateString(), 105, 285, { align: 'center' });
    }

    generateTableOfContents(doc, studyMaterials) {
        doc.addPage();
        
        // Header
        doc.setFontSize(20);
        doc.setFont(undefined, 'bold');
        doc.setTextColor(0, 0, 0);
        doc.text('TABLE OF CONTENTS', 20, 30);
        
        doc.setDrawColor(255, 215, 0);
        doc.setLineWidth(1);
        doc.line(20, 35, 190, 35);
        
        // Sections
        let yPosition = 60;
        const sections = studyMaterials.querySelectorAll('.study-section');
        
        sections.forEach((section, index) => {
            if (yPosition > 270) {
                doc.addPage();
                yPosition = 40;
            }
            
            const title = section.querySelector('.section-title')?.textContent || `Section ${index + 1}`;
            
            doc.setFontSize(11);
            doc.setFont(undefined, 'normal');
            doc.text(title, 25, yPosition);
            
            // Dotted line
            const pageWidth = 190;
            const textWidth = doc.getTextWidth(title);
            const dots = '.'.repeat(Math.floor((pageWidth - textWidth - 40) / 2));
            
            doc.setFont(undefined, 'bold');
            doc.text(dots, 25 + textWidth + 5, yPosition);
            
            // Page number
            const pageNum = Math.floor(yPosition / 270) + 3;
            doc.text(pageNum.toString(), 185, yPosition, { align: 'right' });
            
            yPosition += 10;
        });
        
        // Footer
        this.addPageFooter(doc, 2, 'Table of Contents');
    }

    generateBrandingPage(doc, topic) {
        doc.setFillColor(10, 10, 10);
        doc.rect(0, 0, 210, 297, 'F');
        
        // Gold text
        doc.setTextColor(255, 215, 0);
        doc.setFontSize(16);
        doc.setFont(undefined, 'bold');
        doc.text('STUDY COMPLETE', 105, 100, { align: 'center' });
        
        doc.setFontSize(24);
        doc.text(topic.toUpperCase(), 105, 120, { align: 'center' });
        
        // Decorative elements
        doc.setDrawColor(255, 215, 0);
        doc.setLineWidth(1);
        doc.line(60, 130, 150, 130);
        
        // Quote
        doc.setFontSize(12);
        doc.setFont(undefined, 'italic');
        doc.setTextColor(255, 255, 255, 0.8);
        
        const quote = this.getRandomQuote();
        const quoteLines = doc.splitTextToSize(quote, 150);
        doc.text(quoteLines, 105, 160, { align: 'center' });
        
        // Final branding
        doc.setFontSize(14);
        doc.setFont(undefined, 'bold');
        doc.setTextColor(255, 215, 0);
        doc.text('Savoiré AI', 105, 220, { align: 'center' });
        
        doc.setFontSize(10);
        doc.setTextColor(255, 255, 255, 0.7);
        doc.text('An Elite Cognitive Platform', 105, 230, { align: 'center' });
        
        doc.setFontSize(12);
        doc.setTextColor(255, 215, 0);
        doc.text('by Sooban Talha Technologies', 105, 250, { align: 'center' });
        
        doc.setFontSize(8);
        doc.setTextColor(255, 255, 255, 0.5);
        doc.text('https://soobantalhatech.xyz', 105, 260, { align: 'center' });
        
        // Generation info
        doc.text(`Generated: ${new Date().toLocaleString()}`, 105, 270, { align: 'center' });
        doc.text(`Confidence Score: 96/100`, 105, 275, { align: 'center' });
    }

    addPageFooter(doc, pageNumber, topic) {
        // Footer line
        doc.setDrawColor(255, 215, 0);
        doc.setLineWidth(0.3);
        doc.line(20, 280, 190, 280);
        
        // Page info
        doc.setFontSize(8);
        doc.setTextColor(128, 128, 128);
        doc.text(`Page ${pageNumber}`, 105, 285, { align: 'center' });
        
        // Branding
        doc.text(`Savoiré AI • ${topic}`, 105, 290, { align: 'center' });
        doc.text('https://soobantalhatech.xyz', 105, 295, { align: 'center' });
    }

    // ==================== VOICE INTERFACE ====================
    toggleVoiceInput() {
        if (this.appState.isListening) {
            this.recognition.stop();
        } else {
            this.recognition.start();
        }
    }

    updateVoiceVisualizer() {
        if (!this.appState.isListening) return;
        
        const visualizer = this.elements.voiceVisualizer;
        visualizer.innerHTML = '';
        
        for (let i = 0; i < 20; i++) {
            const bar = document.createElement('div');
            bar.className = 'voice-bar';
            bar.style.height = `${Math.random() * 40 + 10}px`;
            bar.style.animationDelay = `${i * 0.05}s`;
            visualizer.appendChild(bar);
        }
        
        // Update animation
        setTimeout(() => this.updateVoiceVisualizer(), 100);
    }

    closeVoiceInterface() {
        if (this.appState.isListening) {
            this.recognition.stop();
        }
        this.elements.voiceInterface.style.display = 'none';
    }

    // ==================== UI CONTROLS ====================
    toggleTheme() {
        this.appState.isDarkMode = !this.appState.isDarkMode;
        
        if (this.appState.isDarkMode) {
            document.documentElement.style.setProperty('--primary-bg', '#0a0a0a');
            document.documentElement.style.setProperty('--secondary-bg', '#111111');
            document.documentElement.style.setProperty('--surface-bg', 'rgba(30, 30, 30, 0.7)');
            document.documentElement.style.setProperty('--text-primary', '#ffffff');
            this.elements.themeToggle.innerHTML = '<i class="fas fa-moon"></i>';
        } else {
            document.documentElement.style.setProperty('--primary-bg', '#ffffff');
            document.documentElement.style.setProperty('--secondary-bg', '#f8f9fa');
            document.documentElement.style.setProperty('--surface-bg', 'rgba(255, 255, 255, 0.7)');
            document.documentElement.style.setProperty('--text-primary', '#202124');
            this.elements.themeToggle.innerHTML = '<i class="fas fa-sun"></i>';
        }
        
        this.playSound('click');
        this.showToast(`Switched to ${this.appState.isDarkMode ? 'dark' : 'light'} mode`, 'info');
    }

    toggleFullscreen() {
        if (!document.fullscreenElement) {
            document.documentElement.requestFullscreen().catch(console.error);
            this.appState.isFullscreen = true;
            this.elements.fullscreenToggle.innerHTML = '<i class="fas fa-compress"></i>';
        } else {
            document.exitFullscreen();
            this.appState.isFullscreen = false;
            this.elements.fullscreenToggle.innerHTML = '<i class="fas fa-expand"></i>';
        }
        
        this.playSound('click');
    }

    toggleSidebar() {
        this.appState.isSidebarOpen = !this.appState.isSidebarOpen;
        
        const sidebar = document.querySelector('.session-sidebar');
        const contentArea = document.querySelector('.content-area');
        const toggleIcon = this.elements.sidebarToggle.querySelector('i');
        
        if (this.appState.isSidebarOpen) {
            sidebar.classList.add('open');
            contentArea.classList.add('sidebar-open');
            toggleIcon.className = 'fas fa-chevron-right';
        } else {
            sidebar.classList.remove('open');
            contentArea.classList.remove('sidebar-open');
            toggleIcon.className = 'fas fa-chevron-left';
        }
        
        this.playSound('click');
    }

    // ==================== SESSION MANAGEMENT ====================
    createNewSession() {
        const sessionId = Date.now().toString();
        const session = {
            id: sessionId,
            name: `Session ${this.appState.sessions.length + 1}`,
            createdAt: new Date().toISOString(),
            messages: [],
            stats: {
                messageCount: 0,
                duration: 0
            }
        };
        
        this.appState.currentSession = session;
        this.appState.sessions.push(session);
        this.appState.conversation = [];
        
        // Clear chat UI
        this.elements.chatMessages.innerHTML = '';
        this.elements.welcomeArea.style.display = 'block';
        this.elements.messagesContainer.style.display = 'none';
        
        // Update UI
        this.updateSessionStats();
        this.saveSessions();
        
        this.showToast('New session created', 'success');
        this.playSound('click');
    }

    clearCurrentSession() {
        if (this.appState.conversation.length === 0) {
            this.showToast('No messages to clear', 'info');
            return;
        }
        
        this.animateButton(this.elements.clearChatBtn);
        
        setTimeout(() => {
            this.elements.chatMessages.innerHTML = '';
            this.appState.conversation = [];
            this.elements.welcomeArea.style.display = 'block';
            this.elements.messagesContainer.style.display = 'none';
            
            if (this.appState.currentSession) {
                this.appState.currentSession.messages = [];
            }
            
            this.updateSessionStats();
            this.showToast('Chat cleared', 'success');
        }, 300);
    }

    loadSessions() {
        try {
            const saved = localStorage.getItem('savoire_sessions');
            if (saved) {
                this.appState.sessions = JSON.parse(saved);
                this.updateSidebar();
            }
        } catch (error) {
            console.error('Error loading sessions:', error);
        }
    }

    saveSessions() {
        try {
            localStorage.setItem('savoire_sessions', JSON.stringify(this.appState.sessions));
            this.updateStorageUsage();
        } catch (error) {
            console.error('Error saving sessions:', error);
        }
    }

    updateSessionStats() {
        const messageCount = this.appState.conversation.length;
        this.elements.sessionMessages.textContent = messageCount;
        
        // Update storage usage
        this.updateStorageUsage();
    }

    updateStorageUsage() {
        try {
            const used = JSON.stringify(this.appState.sessions).length;
            const limit = 5 * 1024 * 1024; // 5MB
            const percentage = Math.min(Math.round((used / limit) * 100), 100);
            
            this.elements.storageUsage.textContent = `${percentage}% used`;
            
            if (percentage > 90) {
                this.elements.storageUsage.style.color = 'var(--error-color)';
            } else if (percentage > 70) {
                this.elements.storageUsage.style.color = 'var(--warning-color)';
            } else {
                this.elements.storageUsage.style.color = 'var(--text-muted)';
            }
        } catch (error) {
            console.error('Error updating storage:', error);
        }
    }

    startSessionTimer() {
        let seconds = 0;
        
        setInterval(() => {
            seconds++;
            const minutes = Math.floor(seconds / 60);
            const remainingSeconds = seconds % 60;
            
            this.elements.sessionTime.textContent = 
                `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
            
            if (this.appState.currentSession) {
                this.appState.currentSession.stats.duration = seconds;
            }
        }, 1000);
    }

    // ==================== QUICK ACTIONS ====================
    handleQuickAction(action) {
        const lastMessage = this.appState.conversation[this.appState.conversation.length - 1];
        
        if (!lastMessage || lastMessage.type !== 'ai') {
            this.showToast('No AI response to work with', 'warning');
            return;
        }
        
        let prompt = '';
        
        switch(action) {
            case 'explain':
                prompt = `Explain this in more depth with additional examples: ${lastMessage.content.substring(0, 200)}`;
                break;
            case 'simplify':
                prompt = `Simplify this explanation for a beginner: ${lastMessage.content.substring(0, 200)}`;
                break;
            case 'examples':
                prompt = `Provide more practical examples for: ${lastMessage.content.substring(0, 200)}`;
                break;
            case 'exam':
                prompt = `Focus on exam-relevant aspects and common questions for: ${lastMessage.content.substring(0, 200)}`;
                break;
            case 'pdf':
                this.openPDFModal();
                return;
        }
        
        this.elements.messageInput.value = prompt;
        setTimeout(() => this.sendMessage(), 300);
    }

    // ==================== UTILITIES ====================
    showThinking() {
        // Set random thinking message
        const randomMsg = this.appState.thinkingQuotes[
            Math.floor(Math.random() * this.appState.thinkingQuotes.length)
        ];
        const randomQuote = this.appState.motivationalQuotes[
            Math.floor(Math.random() * this.appState.motivationalQuotes.length)
        ];
        
        this.elements.thinkingMessage.textContent = randomMsg;
        this.elements.thinkingQuote.textContent = randomQuote;
        this.elements.thinkingIndicator.style.display = 'block';
        
        this.scrollToBottom();
    }

    hideThinking() {
        this.elements.thinkingIndicator.style.display = 'none';
    }

    showToast(message, type = 'info') {
        const toast = document.createElement('div');
        toast.className = `toast ${type}`;
        
        const icons = {
            success: 'fas fa-check-circle',
            error: 'fas fa-exclamation-circle',
            warning: 'fas fa-exclamation-triangle',
            info: 'fas fa-info-circle'
        };
        
        toast.innerHTML = `
            <i class="${icons[type] || icons.info}"></i>
            <span>${message}</span>
            <button class="toast-close">
                <i class="fas fa-times"></i>
            </button>
        `;
        
        this.elements.toastContainer.appendChild(toast);
        
        // Close button
        toast.querySelector('.toast-close').addEventListener('click', () => {
            toast.style.animation = 'slideInRight 0.3s ease reverse';
            setTimeout(() => toast.remove(), 300);
        });
        
        // Auto-remove after 5 seconds
        setTimeout(() => {
            if (toast.parentNode) {
                toast.style.opacity = '0';
                setTimeout(() => toast.remove(), 300);
            }
        }, 5000);
    }

    showError(message) {
        const errorDiv = document.createElement('div');
        errorDiv.className = 'error-message';
        errorDiv.innerHTML = `
            <h3><i class="fas fa-exclamation-triangle"></i> Error</h3>
            <p>${this.escapeHtml(message)}</p>
            <button class="action-btn magnetic" onclick="savoireAI.retryLastMessage()">
                <i class="fas fa-redo"></i> Retry
            </button>
        `;
        
        this.addMessage(errorDiv.outerHTML, 'ai');
    }

    retryLastMessage() {
        const lastUserMessage = this.appState.conversation
            .slice().reverse()
            .find(msg => msg.type === 'user');
        
        if (lastUserMessage) {
            this.elements.messageInput.value = lastUserMessage.content;
            setTimeout(() => this.sendMessage(), 300);
        }
    }

    animateButton(button) {
        if (!button) return;
        
        button.style.transform = 'scale(0.95)';
        setTimeout(() => {
            button.style.transform = '';
        }, 150);
    }

    animateInput() {
        const input = this.elements.messageInput;
        input.style.transform = 'scale(1.02)';
        
        setTimeout(() => {
            input.style.transform = 'scale(1)';
        }, 150);
    }

    animateClearInput() {
        const input = this.elements.messageInput;
        input.style.opacity = '0';
        input.style.transform = 'translateX(-20px)';
        
        setTimeout(() => {
            input.value = '';
            this.autoResizeTextarea();
            input.style.opacity = '1';
            input.style.transform = 'translateX(0)';
        }, 300);
    }

    autoResizeTextarea() {
        const textarea = this.elements.messageInput;
        textarea.style.height = 'auto';
        textarea.style.height = Math.min(textarea.scrollHeight, 150) + 'px';
    }

    scrollToBottom() {
        setTimeout(() => {
            this.elements.chatMessages.scrollTo({
                top: this.elements.chatMessages.scrollHeight,
                behavior: 'smooth'
            });
        }, 100);
    }

    playSound(type = 'click') {
        try {
            const audio = document.getElementById('clickSound');
            if (audio) {
                audio.currentTime = 0;
                audio.play();
            }
        } catch (error) {
            // Sound playback failed silently
        }
    }

    copyToClipboard(element) {
        const text = this.stripHtml(element.innerHTML);
        
        navigator.clipboard.writeText(text).then(() => {
            this.showToast('Copied to clipboard!', 'success');
        }).catch(() => {
            // Fallback for older browsers
            const textArea = document.createElement('textarea');
            textArea.value = text;
            document.body.appendChild(textArea);
            textArea.select();
            document.execCommand('copy');
            document.body.removeChild(textArea);
            this.showToast('Copied to clipboard!', 'success');
        });
    }

    openPDFModal(element = null) {
        this.elements.pdfModal.style.display = 'flex';
        this.playSound('click');
    }

    closeModal(modalId) {
        const modal = document.getElementById(modalId);
        if (modal) {
            modal.style.display = 'none';
        }
        this.playSound('click');
    }

    previewPDF() {
        this.showToast('PDF preview coming soon!', 'info');
    }

    exportSession() {
        const sessionData = {
            app: 'Savoiré AI',
            version: '2.0',
            exported: new Date().toISOString(),
            session: this.appState.currentSession,
            conversation: this.appState.conversation,
            brand: 'Sooban Talha Technologies',
            website: 'https://soobantalhatech.xyz'
        };
        
        const dataStr = JSON.stringify(sessionData, null, 2);
        const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
        
        const exportName = `savoire_session_${Date.now()}.json`;
        
        const linkElement = document.createElement('a');
        linkElement.setAttribute('href', dataUri);
        linkElement.setAttribute('download', exportName);
        linkElement.click();
        
        this.showToast('Session exported successfully!', 'success');
    }

    getRandomQuote() {
        return this.appState.motivationalQuotes[
            Math.floor(Math.random() * this.appState.motivationalQuotes.length)
        ];
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

    // ==================== PUBLIC INTERFACE ====================
    initializeCinematic() {
        console.log('🎬 Initializing cinematic experience...');
        
        // Trigger initial animations
        setTimeout(() => {
            document.querySelectorAll('.slide-in').forEach(el => {
                el.style.animationPlayState = 'running';
            });
        }, 100);
    }
}

// Initialize and expose globally
const savoireAI = new SavoireEliteAI();
window.savoireAI = savoireAI;

// Make compatible with existing code
window.goldAI = {
    sendMessage: () => savoireAI.sendMessage(),
    clearChat: () => savoireAI.clearCurrentSession(),
    generatePremiumPDF: (type) => savoireAI.generatePremiumPDF(type),
    playSound: () => savoireAI.playSound(),
    initializeCinematic: () => savoireAI.initializeCinematic()
};

// Additional CSS for dynamic elements
const dynamicStyles = document.createElement('style');
dynamicStyles.textContent = `
    /* Additional styles for new components */
    .intuition-card {
        background: rgba(255, 215, 0, 0.1);
        border: 1px solid var(--accent-primary);
        border-radius: 15px;
        padding: 1.5rem;
        margin: 1rem 0;
        text-align: center;
        font-size: 1.1rem;
        font-weight: 500;
        color: var(--accent-primary);
    }
    
    .mental-model-grid,
    .concepts-accordion,
    .examples-grid,
    .tricks-grid,
    .exam-focus-grid,
    .connections-grid,
    .applications-grid,
    .misconceptions-grid,
    .active-recall-grid,
    .anchors-grid,
    .summary-grid,
    .extensions-list {
        display: grid;
        gap: 1rem;
        margin: 1rem 0;
    }
    
    .model-card,
    .concept-card,
    .example-card,
    .trick-card,
    .exam-card,
    .connection-card,
    .application-card,
    .misconception-card,
    .recall-card,
    .anchor-card,
    .summary-card {
        background: var(--glass-bg);
        border: 1px solid var(--glass-border);
        border-radius: 12px;
        padding: 1.5rem;
        transition: var(--transition-smooth);
    }
    
    .model-card:hover,
    .concept-card:hover,
    .example-card:hover,
    .trick-card:hover,
    .exam-card:hover,
    .connection-card:hover,
    .application-card:hover,
    .misconception-card:hover,
    .recall-card:hover,
    .anchor-card:hover,
    .summary-card:hover {
        transform: translateY(-2px);
        border-color: var(--accent-primary);
        box-shadow: var(--shadow-gold);
    }
    
    .concept-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        cursor: pointer;
        padding: 1rem;
        background: rgba(255, 255, 255, 0.05);
        border-radius: 8px;
        margin: -1rem;
        margin-bottom: 1rem;
    }
    
    .concept-content {
        display: none;
        padding-top: 1rem;
        border-top: 1px solid var(--glass-border);
    }
    
    .concept-card.open .concept-content {
        display: block;
    }
    
    .concept-card.open .concept-header i {
        transform: rotate(180deg);
    }
    
    .example-header {
        display: flex;
        justify-content: space-between;
        margin-bottom: 1rem;
        padding-bottom: 0.5rem;
        border-bottom: 1px solid var(--glass-border);
    }
    
    .example-number {
        font-weight: 600;
        color: var(--accent-primary);
    }
    
    .example-difficulty {
        font-size: 0.8rem;
        padding: 0.25rem 0.75rem;
        background: var(--glass-bg);
        border-radius: 12px;
        color: var(--text-secondary);
    }
    
    .steps {
        display: flex;
        flex-direction: column;
        gap: 0.5rem;
        margin-top: 0.5rem;
    }
    
    .step {
        padding: 0.75rem;
        background: rgba(255, 255, 255, 0.03);
        border-radius: 8px;
        border-left: 3px solid var(--accent-primary);
    }
    
    .trick-icon {
        width: 40px;
        height: 40px;
        background: var(--gradient-gold);
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        margin-bottom: 1rem;
        color: var(--text-on-accent);
    }
    
    .recall-card.challenge {
        border: 2px solid var(--accent-primary);
    }
    
    .anchor-number,
    .app-number,
    .extension-number {
        width: 30px;
        height: 30px;
        background: var(--gradient-gold);
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        margin-bottom: 1rem;
        color: var(--text-on-accent);
        font-weight: 600;
    }
    
    .formula-item {
        padding: 0.75rem;
        background: rgba(255, 255, 255, 0.03);
        border-radius: 8px;
        margin: 0.5rem 0;
        font-family: 'Courier New', monospace;
        border-left: 3px solid var(--accent-primary);
    }
    
    .pdf-options-inline {
        display: flex;
        gap: 1rem;
        margin-top: 1rem;
        flex-wrap: wrap;
        justify-content: center;
    }
    
    .study-footer {
        text-align: center;
        padding-top: 2rem;
        border-top: 1px solid var(--glass-border);
        color: var(--text-muted);
        font-size: 0.9rem;
    }
    
    .generation-info i {
        margin-right: 0.5rem;
        color: var(--accent-primary);
    }
    
    /* Responsive grids */
    @media (min-width: 768px) {
        .mental-model-grid,
        .exam-focus-grid,
        .summary-grid {
            grid-template-columns: repeat(3, 1fr);
        }
        
        .concepts-accordion,
        .extensions-list {
            grid-template-columns: 1fr;
        }
        
        .examples-grid,
        .tricks-grid,
        .connections-grid,
        .applications-grid,
        .misconceptions-grid,
        .active-recall-grid,
        .anchors-grid {
            grid-template-columns: repeat(2, 1fr);
        }
    }
    
    @media (max-width: 767px) {
        .mental-model-grid,
        .exam-focus-grid,
        .summary-grid,
        .examples-grid,
        .tricks-grid,
        .connections-grid,
        .applications-grid,
        .misconceptions-grid,
        .active-recall-grid,
        .anchors-grid {
            grid-template-columns: 1fr;
        }
    }
    
    /* Math styling */
    .math-inline {
        background: rgba(255, 215, 0, 0.1);
        padding: 0.1rem 0.4rem;
        border-radius: 4px;
        font-family: 'Courier New', monospace;
    }
    
    .mjx-chtml {
        font-size: 1.1em !important;
    }
`;
document.head.appendChild(dynamicStyles);

// Initialize when page loads
document.addEventListener('DOMContentLoaded', () => {
    // MathJax configuration
    if (window.MathJax) {
        MathJax.typesetPromise();
    }
});
// Savoiré AI v2.0 - The Ultimate Study Station
// by Sooban Talha Technologies

class SavoireAI {
    constructor() {
        // State Management
        this.state = {
            currentChat: null,
            chats: [],
            history: [],
            isGenerating: false,
            isListening: false,
            isSpeaking: false,
            isFocusMode: false,
            isLofiPlaying: false,
            isConsoleOpen: false,
            currentModel: 'google/gemini-2.0-flash-exp:free',
            temperature: 0.7,
            simplifyMode: false,
            systemPrompt: "You are Savoiré AI, an advanced study assistant created by Sooban Talha Technologies. You help students learn complex topics by providing detailed, accurate, and engaging explanations. Always format responses with proper markdown, include examples when relevant, and break down complex concepts into digestible parts.",
            settings: {
                userName: 'Student',
                userAvatar: 'user',
                autoSave: true,
                enableAnimations: true,
                includeExamples: true,
                pomodoroDuration: 25,
                defaultModel: 'google/gemini-2.0-flash-exp:free'
            },
            tokensUsed: 6543,
            maxTokens: 10000,
            pomodoro: {
                isRunning: false,
                timeLeft: 25 * 60,
                duration: 25 * 60,
                mode: 'work' // 'work' or 'break'
            }
        };

        // DOM Elements
        this.elements = {};
        this.initializeElements();
        
        // Initialize App
        this.initializeApp();
        this.bindEvents();
        this.loadState();
        this.initializeWormhole();
        this.initializeSwipe();
        this.initializeKeyboardShortcuts();
        
        // Log initialization
        this.log('Savoiré AI v2.0 initialized', 'success');
    }

    initializeElements() {
        // Main Containers
        this.elements.sidebar = document.getElementById('sidebar');
        this.elements.mainContent = document.querySelector('.main-content');
        this.elements.messagesContainer = document.getElementById('messagesContainer');
        this.elements.notesContent = document.getElementById('notesContent');
        this.elements.workspace = document.getElementById('workspace');
        
        // Buttons & Toggles
        this.elements.sidebarToggle = document.getElementById('sidebarToggle');
        this.elements.sidebarClose = document.getElementById('sidebarClose');
        this.elements.focusMode = document.getElementById('focusMode');
        this.elements.lofiToggle = document.getElementById('lofiToggle');
        this.elements.voiceInput = document.getElementById('voiceInput');
        this.elements.voiceToggle = document.getElementById('voiceToggle');
        this.elements.simplifyToggle = document.getElementById('simplifyToggle');
        this.elements.newChat = document.getElementById('newChat');
        this.elements.clearChat = document.getElementById('clearChat');
        this.elements.sendButton = document.getElementById('sendButton');
        this.elements.uploadImage = document.getElementById('uploadImage');
        this.elements.imageUpload = document.getElementById('imageUpload');
        
        // Inputs & Forms
        this.elements.messageInput = document.getElementById('messageInput');
        this.elements.modelSelect = document.getElementById('modelSelect');
        this.elements.temperature = document.getElementById('temperature');
        this.elements.tempValue = document.getElementById('tempValue');
        this.elements.historySearch = document.getElementById('historySearch');
        this.elements.clearSearch = document.getElementById('clearSearch');
        
        // Settings
        this.elements.openSettings = document.getElementById('openSettings');
        this.elements.settingsModal = document.getElementById('settingsModal');
        this.elements.closeSettings = document.getElementById('closeSettings');
        this.elements.saveSettings = document.getElementById('saveSettings');
        this.elements.resetSettings = document.getElementById('resetSettings');
        
        // User Profile
        this.elements.userName = document.getElementById('userName');
        this.elements.userAvatar = document.getElementById('userAvatar');
        this.elements.userNameInput = document.getElementById('userNameInput');
        
        // Notes Actions
        this.elements.copyNotes = document.getElementById('copyNotes');
        this.elements.downloadPDF = document.getElementById('downloadPDF');
        this.elements.ttsButton = document.getElementById('ttsButton');
        this.elements.fullscreenNotes = document.getElementById('fullscreenNotes');
        this.elements.exportMarkdown = document.getElementById('exportMarkdown');
        
        // Pomodoro
        this.elements.pomodoroTimer = document.getElementById('pomodoroTimer');
        this.elements.timerToggle = document.getElementById('timerToggle');
        this.elements.timerDisplay = document.getElementById('timerDisplay');
        this.elements.timerFill = document.getElementById('timerFill');
        
        // Token Meter
        this.elements.tokenFill = document.getElementById('tokenFill');
        this.elements.tokenCount = document.getElementById('tokenCount');
        
        // Console
        this.elements.showConsole = document.getElementById('showConsole');
        this.elements.developerConsole = document.getElementById('developerConsole');
        this.elements.closeConsole = document.getElementById('closeConsole');
        this.elements.consoleOutput = document.getElementById('consoleOutput');
        this.elements.consoleCommand = document.getElementById('consoleCommand');
        this.elements.consoleSend = document.getElementById('consoleSend');
        
        // Image Modal
        this.elements.imageModal = document.getElementById('imageModal');
        this.elements.closeImageModal = document.getElementById('closeImageModal');
        this.elements.previewImage = document.getElementById('previewImage');
        this.elements.analyzeImage = document.getElementById('analyzeImage');
        this.elements.removeImage = document.getElementById('removeImage');
        
        // Quick Prompts
        this.elements.quickPrompts = document.getElementById('quickPrompts');
        this.elements.togglePrompts = document.getElementById('togglePrompts');
        this.elements.promptChips = document.querySelectorAll('.prompt-chip');
        
        // History Groups
        this.elements.historyGroups = document.getElementById('historyGroups');
        
        // Current Chat Title
        this.elements.currentChatTitle = document.getElementById('currentChatTitle');
        this.elements.currentModel = document.getElementById('currentModel');
        
        // Tabs
        this.elements.tabs = document.querySelectorAll('.tab');
        this.elements.tabContents = document.querySelectorAll('.tab-content');
        
        // Theme Options
        this.elements.themeOptions = document.querySelectorAll('.theme-option');
        
        // Quick Actions
        this.elements.quickActions = document.getElementById('quickActions');
        
        // Wormhole Canvas
        this.elements.wormholeCanvas = document.getElementById('wormholeCanvas');
        
        // Lofi Player
        this.elements.lofiPlayer = document.getElementById('lofiPlayer');
    }

    initializeApp() {
        // Auto-resize textarea
        this.elements.messageInput.addEventListener('input', () => {
            this.autoResizeTextarea();
        });

        // Initialize model select
        this.elements.modelSelect.value = this.state.currentModel;
        
        // Initialize temperature slider
        this.elements.temperature.value = this.state.temperature * 100;
        this.elements.tempValue.textContent = this.state.temperature.toFixed(1);
        
        // Update token meter
        this.updateTokenMeter();
        
        // Update pomodoro display
        this.updatePomodoroDisplay();
        
        // Load history
        this.loadHistory();
        
        // Create new chat
        this.createNewChat();
    }

    bindEvents() {
        // Sidebar Controls
        this.elements.sidebarToggle.addEventListener('click', () => this.toggleSidebar());
        this.elements.sidebarClose.addEventListener('click', () => this.toggleSidebar());
        
        // Chat Controls
        this.elements.sendButton.addEventListener('click', () => this.sendMessage());
        this.elements.messageInput.addEventListener('keydown', (e) => this.handleKeyDown(e));
        this.elements.newChat.addEventListener('click', () => this.createNewChat());
        this.elements.clearChat.addEventListener('click', () => this.clearCurrentChat());
        
        // Voice Controls
        this.elements.voiceInput.addEventListener('click', () => this.toggleVoiceInput());
        this.elements.voiceToggle.addEventListener('click', () => this.toggleVoiceInput());
        
        // Image Upload
        this.elements.uploadImage.addEventListener('click', () => this.elements.imageUpload.click());
        this.elements.imageUpload.addEventListener('change', (e) => this.handleImageUpload(e));
        
        // Settings
        this.elements.openSettings.addEventListener('click', () => this.openSettings());
        this.elements.closeSettings.addEventListener('click', () => this.closeSettings());
        this.elements.saveSettings.addEventListener('click', () => this.saveSettings());
        this.elements.resetSettings.addEventListener('click', () => this.resetSettings());
        
        // Notes Actions
        this.elements.copyNotes.addEventListener('click', () => this.copyNotes());
        this.elements.downloadPDF.addEventListener('click', () => this.downloadPDF());
        this.elements.ttsButton.addEventListener('click', () => this.toggleTextToSpeech());
        this.elements.fullscreenNotes.addEventListener('click', () => this.toggleFullscreenNotes());
        this.elements.exportMarkdown.addEventListener('click', () => this.exportMarkdown());
        
        // Pomodoro Timer
        this.elements.timerToggle.addEventListener('click', () => this.togglePomodoro());
        
        // Console
        this.elements.showConsole.addEventListener('click', () => this.toggleConsole());
        this.elements.closeConsole.addEventListener('click', () => this.toggleConsole());
        this.elements.consoleSend.addEventListener('click', () => this.executeConsoleCommand());
        this.elements.consoleCommand.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') this.executeConsoleCommand();
        });
        
        // Image Modal
        this.elements.closeImageModal.addEventListener('click', () => this.closeImageModal());
        this.elements.analyzeImage.addEventListener('click', () => this.analyzeImage());
        this.elements.removeImage.addEventListener('click', () => this.removeImage());
        
        // Quick Prompts
        this.elements.togglePrompts.addEventListener('click', () => this.toggleQuickPrompts());
        this.elements.promptChips.forEach(chip => {
            chip.addEventListener('click', (e) => this.handleQuickPrompt(e));
        });
        
        // Settings Tabs
        this.elements.tabs.forEach(tab => {
            tab.addEventListener('click', (e) => this.switchTab(e));
        });
        
        // Theme Options
        this.elements.themeOptions.forEach(option => {
            option.addEventListener('click', (e) => this.changeTheme(e));
        });
        
        // Temperature Slider
        this.elements.temperature.addEventListener('input', (e) => {
            this.state.temperature = e.target.value / 100;
            this.elements.tempValue.textContent = this.state.temperature.toFixed(1);
        });
        
        // Model Select
        this.elements.modelSelect.addEventListener('change', (e) => {
            this.state.currentModel = e.target.value;
            this.elements.currentModel.textContent = this.getModelName(e.target.value);
        });
        
        // Search
        this.elements.historySearch.addEventListener('input', () => this.searchHistory());
        this.elements.clearSearch.addEventListener('click', () => {
            this.elements.historySearch.value = '';
            this.searchHistory();
        });
        
        // Focus Mode
        this.elements.focusMode.addEventListener('click', () => this.toggleFocusMode());
        
        // Lofi Player
        this.elements.lofiToggle.addEventListener('click', () => this.toggleLofi());
        
        // Simplify Mode
        this.elements.simplifyToggle.addEventListener('click', () => this.toggleSimplifyMode());
        
        // Quick Actions
        this.elements.quickActions.addEventListener('click', () => {
            this.elements.quickActions.parentElement.classList.toggle('open');
        });
        
        // Click outside to close dropdowns
        document.addEventListener('click', (e) => {
            if (!e.target.closest('.quick-actions')) {
                this.elements.quickActions.parentElement.classList.remove('open');
            }
        });
    }

    // ============================================
    // FEATURE 1-3: Chat & Streaming
    // ============================================

    async sendMessage() {
        const message = this.elements.messageInput.value.trim();
        if (!message || this.state.isGenerating) return;

        // Add user message
        this.addMessage(message, 'user');
        
        // Clear input
        this.elements.messageInput.value = '';
        this.autoResizeTextarea();
        
        // Show typing indicator
        this.showTypingIndicator();
        
        // Set generating state
        this.state.isGenerating = true;
        this.elements.sendButton.disabled = true;
        
        try {
            // Generate AI response with streaming
            const response = await this.generateAIResponse(message);
            
            // Remove typing indicator
            this.hideTypingIndicator();
            
            // Stream the response
            await this.streamResponse(response);
            
        } catch (error) {
            this.hideTypingIndicator();
            this.showError('Failed to get response. Please try again.');
            this.log(`API Error: ${error.message}`, 'error');
        }
        
        this.state.isGenerating = false;
        this.elements.sendButton.disabled = false;
        
        // Save to history
        this.saveToHistory();
    }

    async generateAIResponse(message) {
        const startTime = Date.now();
        
        const payload = {
            message,
            model: this.state.currentModel,
            temperature: this.state.temperature,
            systemPrompt: this.state.systemPrompt,
            simplify: this.state.simplifyMode
        };

        // Check for image analysis
        if (this.state.currentImage) {
            payload.image = this.state.currentImage;
            payload.visionModel = 'google/gemini-2.0-flash-exp:free';
        }

        try {
            const response = await fetch('/api/study', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(payload)
            });

            if (!response.ok) {
                throw new Error(`HTTP ${response.status}`);
            }

            const data = await response.json();
            const latency = Date.now() - startTime;
            
            this.log(`Response received in ${latency}ms from ${this.state.currentModel}`, 'success');
            this.updateTokenUsage(data.estimatedTokens || 100);
            
            return data.response || data;
        } catch (error) {
            // Fallback to local generation
            this.log('Using fallback response generator', 'warning');
            return this.generateFallbackResponse(message);
        }
    }

    async streamResponse(response) {
        const messageId = `msg-${Date.now()}`;
        const messageDiv = this.createAIMessageContainer(messageId);
        
        // Simulate streaming for free models
        const words = response.split(' ');
        let currentText = '';
        
        for (let i = 0; i < words.length; i++) {
            currentText += words[i] + ' ';
            this.updateMessageContent(messageId, currentText);
            
            // Random delay for natural typing effect
            await this.sleep(Math.random() * 50 + 20);
            
            // Scroll to bottom
            this.scrollToBottom();
        }
        
        // Update notes panel
        this.updateNotesPanel(currentText);
        
        // Add copy button
        this.addCopyButton(messageDiv);
        
        // Add regenerate button
        this.addRegenerateButton(messageDiv, response);
    }

    addMessage(content, type) {
        const messageDiv = document.createElement('div');
        messageDiv.className = `message ${type}`;
        messageDiv.id = `msg-${Date.now()}`;
        
        const avatar = type === 'user' ? 
            `<div class="message-avatar">
                <i class="fas fa-user"></i>
            </div>` :
            `<div class="message-avatar">
                <i class="fas fa-brain"></i>
            </div>`;
        
        const time = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        
        messageDiv.innerHTML = `
            ${avatar}
            <div class="message-content">
                <div class="message-text">${this.escapeHtml(content)}</div>
                <div class="message-actions">
                    <button class="message-action" onclick="app.copyMessage('${messageDiv.id}')" title="Copy">
                        <i class="fas fa-copy"></i>
                    </button>
                    ${type === 'user' ? `
                    <button class="message-action" onclick="app.editMessage('${messageDiv.id}')" title="Edit">
                        <i class="fas fa-edit"></i>
                    </button>
                    ` : ''}
                </div>
                <div class="message-time">${time}</div>
            </div>
        `;
        
        this.elements.messagesContainer.appendChild(messageDiv);
        this.scrollToBottom();
        
        // Add to current chat
        if (this.state.currentChat) {
            this.state.currentChat.messages.push({
                type,
                content,
                time,
                id: messageDiv.id
            });
        }
    }

    createAIMessageContainer(id) {
        const messageDiv = document.createElement('div');
        messageDiv.className = 'message ai';
        messageDiv.id = id;
        
        messageDiv.innerHTML = `
            <div class="message-avatar">
                <i class="fas fa-brain"></i>
            </div>
            <div class="message-content">
                <div class="message-text" id="${id}-text"></div>
                <div class="message-actions" style="display: none;">
                    <button class="message-action" onclick="app.copyMessage('${id}')" title="Copy">
                        <i class="fas fa-copy"></i>
                    </button>
                    <button class="message-action" onclick="app.regenerateMessage('${id}')" title="Regenerate">
                        <i class="fas fa-redo"></i>
                    </button>
                </div>
                <div class="message-time">${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
            </div>
        `;
        
        this.elements.messagesContainer.appendChild(messageDiv);
        return messageDiv;
    }

    updateMessageContent(id, content) {
        const textElement = document.getElementById(`${id}-text`);
        if (textElement) {
            // Parse markdown and render
            const html = marked.parse(content);
            const cleanHTML = DOMPurify.sanitize(html);
            textElement.innerHTML = cleanHTML;
            
            // Render math and code
            this.renderMath();
            this.renderCodeBlocks();
        }
    }

    showTypingIndicator() {
        const indicator = document.createElement('div');
        indicator.className = 'typing-indicator';
        indicator.id = 'typing-indicator';
        
        indicator.innerHTML = `
            <div class="message-avatar">
                <i class="fas fa-brain"></i>
            </div>
            <div class="typing-dots">
                <div class="typing-dot"></div>
                <div class="typing-dot"></div>
                <div class="typing-dot"></div>
            </div>
            <div class="typing-text">Savoiré AI is thinking...</div>
        `;
        
        this.elements.messagesContainer.appendChild(indicator);
        this.scrollToBottom();
    }

    hideTypingIndicator() {
        const indicator = document.getElementById('typing-indicator');
        if (indicator) {
            indicator.remove();
        }
    }

    // ============================================
    // FEATURE 4-8: Markdown, Tables, LaTeX, Code
    // ============================================

    updateNotesPanel(content) {
        // Parse markdown
        const html = marked.parse(content);
        const cleanHTML = DOMPurify.sanitize(html);
        
        // Create notes container
        const notesDiv = document.createElement('div');
        notesDiv.className = 'rendered-notes';
        notesDiv.innerHTML = cleanHTML;
        
        // Clear existing notes
        this.elements.notesContent.innerHTML = '';
        this.elements.notesContent.appendChild(notesDiv);
        
        // Add copy buttons to code blocks
        this.addCopyButtonsToCodeBlocks();
        
        // Render math
        this.renderMath();
        
        // Render syntax highlighting
        this.renderCodeBlocks();
    }

    renderMath() {
        // Render KaTeX math
        renderMathInElement(this.elements.notesContent, {
            delimiters: [
                {left: '$$', right: '$$', display: true},
                {left: '$', right: '$', display: false},
                {left: '\\(', right: '\\)', display: false},
                {left: '\\[', right: '\\]', display: true}
            ],
            throwOnError: false
        });
    }

    renderCodeBlocks() {
        // Apply Prism.js highlighting
        Prism.highlightAllUnder(this.elements.notesContent);
    }

    addCopyButtonsToCodeBlocks() {
        const codeBlocks = this.elements.notesContent.querySelectorAll('pre');
        codeBlocks.forEach((block, index) => {
            if (!block.querySelector('.copy-code-btn')) {
                const button = document.createElement('button');
                button.className = 'copy-code-btn';
                button.innerHTML = '<i class="fas fa-copy"></i> Copy';
                button.onclick = () => this.copyCodeBlock(block);
                block.style.position = 'relative';
                block.appendChild(button);
            }
        });
    }

    copyCodeBlock(block) {
        const code = block.querySelector('code')?.textContent || block.textContent;
        navigator.clipboard.writeText(code).then(() => {
            this.showNotification('Code copied to clipboard!', 'success');
        });
    }

    // ============================================
    // FEATURE 9-12: History, Search, Voice
    // ============================================

    loadHistory() {
        const savedHistory = localStorage.getItem('savoire_history');
        if (savedHistory) {
            this.state.history = JSON.parse(savedHistory);
            this.renderHistory();
        }
    }

    saveToHistory() {
        if (!this.state.settings.autoSave) return;
        
        const chatData = {
            id: Date.now(),
            title: this.state.currentChat?.title || 'New Chat',
            messages: this.state.currentChat?.messages || [],
            timestamp: new Date().toISOString(),
            model: this.state.currentModel
        };
        
        // Add to history
        this.state.history.unshift(chatData);
        
        // Keep only last 100 chats
        if (this.state.history.length > 100) {
            this.state.history = this.state.history.slice(0, 100);
        }
        
        // Save to localStorage
        localStorage.setItem('savoire_history', JSON.stringify(this.state.history));
        
        // Update history display
        this.renderHistory();
    }

    renderHistory() {
        this.elements.historyGroups.innerHTML = '';
        
        // Group by date
        const groups = {
            today: [],
            yesterday: [],
            older: []
        };
        
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        
        const yesterday = new Date(today);
        yesterday.setDate(yesterday.getDate() - 1);
        
        this.state.history.forEach(chat => {
            const chatDate = new Date(chat.timestamp);
            chatDate.setHours(0, 0, 0, 0);
            
            if (chatDate.getTime() === today.getTime()) {
                groups.today.push(chat);
            } else if (chatDate.getTime() === yesterday.getTime()) {
                groups.yesterday.push(chat);
            } else {
                groups.older.push(chat);
            }
        });
        
        // Render groups
        ['today', 'yesterday', 'older'].forEach(groupName => {
            if (groups[groupName].length > 0) {
                const groupDiv = document.createElement('div');
                groupDiv.className = 'history-group';
                
                const header = document.createElement('div');
                header.className = 'group-header';
                
                const title = document.createElement('div');
                title.className = 'group-title';
                title.textContent = this.capitalizeFirstLetter(groupName);
                
                const count = document.createElement('div');
                count.className = 'group-count';
                count.textContent = groups[groupName].length;
                
                header.appendChild(title);
                header.appendChild(count);
                
                const itemsDiv = document.createElement('div');
                itemsDiv.className = 'history-items';
                
                groups[groupName].forEach(chat => {
                    const item = document.createElement('button');
                    item.className = 'history-item';
                    item.innerHTML = `
                        <i class="fas fa-comment history-item-icon"></i>
                        <div class="history-item-content">${this.escapeHtml(chat.title)}</div>
                        <div class="history-item-time">${new Date(chat.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
                    `;
                    
                    item.addEventListener('click', () => this.loadChat(chat));
                    itemsDiv.appendChild(item);
                });
                
                groupDiv.appendChild(header);
                groupDiv.appendChild(itemsDiv);
                this.elements.historyGroups.appendChild(groupDiv);
            }
        });
    }

    searchHistory() {
        const query = this.elements.historySearch.value.toLowerCase();
        const items = this.elements.historyGroups.querySelectorAll('.history-item');
        
        items.forEach(item => {
            const text = item.querySelector('.history-item-content').textContent.toLowerCase();
            if (text.includes(query)) {
                item.style.display = 'flex';
            } else {
                item.style.display = 'none';
            }
        });
    }

    toggleVoiceInput() {
        if (!('webkitSpeechRecognition' in window || 'SpeechRecognition' in window)) {
            this.showNotification('Speech recognition not supported in your browser', 'error');
            return;
        }
        
        if (this.state.isListening) {
            this.stopVoiceInput();
        } else {
            this.startVoiceInput();
        }
    }

    startVoiceInput() {
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        this.recognition = new SpeechRecognition();
        this.recognition.continuous = false;
        this.recognition.interimResults = true;
        this.recognition.lang = 'en-US';
        
        this.recognition.onstart = () => {
            this.state.isListening = true;
            this.elements.voiceInput.classList.add('listening');
            this.elements.voiceToggle.classList.add('active');
            this.showNotification('Listening... Speak now', 'info');
        };
        
        this.recognition.onresult = (event) => {
            let transcript = '';
            for (let i = event.resultIndex; i < event.results.length; i++) {
                transcript += event.results[i][0].transcript;
            }
            this.elements.messageInput.value = transcript;
            this.autoResizeTextarea();
        };
        
        this.recognition.onerror = (event) => {
            this.showNotification(`Speech recognition error: ${event.error}`, 'error');
            this.stopVoiceInput();
        };
        
        this.recognition.onend = () => {
            this.stopVoiceInput();
        };
        
        this.recognition.start();
    }

    stopVoiceInput() {
        if (this.recognition) {
            this.recognition.stop();
        }
        this.state.isListening = false;
        this.elements.voiceInput.classList.remove('listening');
        this.elements.voiceToggle.classList.remove('active');
    }

    // ============================================
    // FEATURE 13-16: TTS, Focus Mode, Pomodoro
    // ============================================

    toggleTextToSpeech() {
        if (this.state.isSpeaking) {
            this.stopTextToSpeech();
        } else {
            this.startTextToSpeech();
        }
    }

    startTextToSpeech() {
        const notesText = this.elements.notesContent.textContent;
        if (!notesText.trim()) {
            this.showNotification('No notes to read', 'warning');
            return;
        }
        
        if ('speechSynthesis' in window) {
            this.speech = new SpeechSynthesisUtterance(notesText);
            this.speech.rate = 1.0;
            this.speech.pitch = 1.0;
            this.speech.volume = 1.0;
            this.speech.lang = 'en-US';
            
            this.speech.onstart = () => {
                this.state.isSpeaking = true;
                this.elements.ttsButton.classList.add('active');
                this.showNotification('Reading notes...', 'info');
            };
            
            this.speech.onend = () => {
                this.stopTextToSpeech();
            };
            
            this.speech.onerror = () => {
                this.showNotification('Failed to read notes', 'error');
                this.stopTextToSpeech();
            };
            
            speechSynthesis.speak(this.speech);
        } else {
            this.showNotification('Text-to-speech not supported in your browser', 'error');
        }
    }

    stopTextToSpeech() {
        if (speechSynthesis.speaking) {
            speechSynthesis.cancel();
        }
        this.state.isSpeaking = false;
        this.elements.ttsButton.classList.remove('active');
    }

    toggleFocusMode() {
        this.state.isFocusMode = !this.state.isFocusMode;
        
        if (this.state.isFocusMode) {
            this.elements.sidebar.classList.add('collapsed');
            this.elements.mainContent.classList.add('full-width');
            this.elements.focusMode.classList.add('active');
            this.showNotification('Focus mode enabled', 'success');
        } else {
            this.elements.sidebar.classList.remove('collapsed');
            this.elements.mainContent.classList.remove('full-width');
            this.elements.focusMode.classList.remove('active');
        }
    }

    togglePomodoro() {
        this.state.pomodoro.isRunning = !this.state.pomodoro.isRunning;
        
        if (this.state.pomodoro.isRunning) {
            this.elements.timerToggle.innerHTML = '<i class="fas fa-pause"></i>';
            this.startPomodoroTimer();
            this.showNotification('Pomodoro timer started', 'success');
        } else {
            this.elements.timerToggle.innerHTML = '<i class="fas fa-play"></i>';
            this.showNotification('Timer paused', 'info');
        }
    }

    startPomodoroTimer() {
        if (!this.state.pomodoro.isRunning) return;
        
        const timer = setInterval(() => {
            if (!this.state.pomodoro.isRunning) {
                clearInterval(timer);
                return;
            }
            
            this.state.pomodoro.timeLeft--;
            this.updatePomodoroDisplay();
            
            if (this.state.pomodoro.timeLeft <= 0) {
                clearInterval(timer);
                this.pomodoroComplete();
            }
        }, 1000);
    }

    updatePomodoroDisplay() {
        const minutes = Math.floor(this.state.pomodoro.timeLeft / 60);
        const seconds = this.state.pomodoro.timeLeft % 60;
        this.elements.timerDisplay.textContent = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
        
        const percentage = (this.state.pomodoro.timeLeft / this.state.pomodoro.duration) * 100;
        this.elements.timerFill.style.width = `${percentage}%`;
    }

    pomodoroComplete() {
        this.state.pomodoro.isRunning = false;
        this.elements.timerToggle.innerHTML = '<i class="fas fa-play"></i>';
        
        if (this.state.pomodoro.mode === 'work') {
            this.showNotification('Work session complete! Take a break.', 'success');
            this.state.pomodoro.mode = 'break';
            this.state.pomodoro.timeLeft = 5 * 60; // 5 minute break
        } else {
            this.showNotification('Break complete! Back to work.', 'info');
            this.state.pomodoro.mode = 'work';
            this.state.pomodoro.timeLeft = this.state.pomodoro.duration;
        }
        
        this.updatePomodoroDisplay();
    }

    // ============================================
    // FEATURE 17-20: Quick Prompts, Temperature, System Prompt, Copy
    // ============================================

    handleQuickPrompt(event) {
        const prompt = event.currentTarget.getAttribute('data-prompt');
        this.elements.messageInput.value = prompt;
        this.autoResizeTextarea();
        this.showNotification('Prompt loaded. Press Enter to send.', 'info');
    }

    toggleQuickPrompts() {
        const grid = this.elements.quickPrompts.querySelector('.prompts-grid');
        const icon = this.elements.togglePrompts.querySelector('i');
        
        grid.classList.toggle('collapsed');
        if (grid.classList.contains('collapsed')) {
            icon.className = 'fas fa-chevron-down';
        } else {
            icon.className = 'fas fa-chevron-up';
        }
    }

    toggleSimplifyMode() {
        this.state.simplifyMode = !this.state.simplifyMode;
        this.elements.simplifyToggle.classList.toggle('active', this.state.simplifyMode);
        
        const message = this.state.simplifyMode ? 
            'Simple explanations enabled' : 
            'Detailed explanations enabled';
        this.showNotification(message, 'info');
    }

    copyMessage(messageId) {
        const message = document.getElementById(messageId);
        if (message) {
            const text = message.querySelector('.message-text').textContent;
            navigator.clipboard.writeText(text).then(() => {
                this.showNotification('Message copied to clipboard!', 'success');
            });
        }
    }

    copyNotes() {
        const notesText = this.elements.notesContent.textContent;
        if (!notesText.trim()) {
            this.showNotification('No notes to copy', 'warning');
            return;
        }
        
        navigator.clipboard.writeText(notesText).then(() => {
            this.showNotification('All notes copied to clipboard!', 'success');
        });
    }

    // ============================================
    // FEATURE 21-24: Export MD, Notifications, Skeleton, Retry
    // ============================================

    exportMarkdown() {
        const notesText = this.elements.notesContent.textContent;
        if (!notesText.trim()) {
            this.showNotification('No notes to export', 'warning');
            return;
        }
        
        const blob = new Blob([notesText], { type: 'text/markdown' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `savoire-notes-${new Date().toISOString().slice(0, 10)}.md`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        
        this.showNotification('Notes exported as Markdown', 'success');
    }

    showNotification(message, type = 'info') {
        const container = document.getElementById('notificationContainer');
        const notification = document.createElement('div');
        notification.className = `notification ${type}`;
        
        const icons = {
            success: 'fas fa-check-circle',
            error: 'fas fa-exclamation-circle',
            info: 'fas fa-info-circle',
            warning: 'fas fa-exclamation-triangle'
        };
        
        notification.innerHTML = `
            <div class="notification-icon">
                <i class="${icons[type]}"></i>
            </div>
            <div class="notification-content">
                <div class="notification-title">${this.capitalizeFirstLetter(type)}</div>
                <div class="notification-message">${message}</div>
            </div>
            <button class="notification-close">
                <i class="fas fa-times"></i>
            </button>
        `;
        
        container.appendChild(notification);
        
        // Auto-remove after 5 seconds
        setTimeout(() => {
            notification.classList.add('hiding');
            setTimeout(() => notification.remove(), 300);
        }, 5000);
        
        // Close button
        notification.querySelector('.notification-close').addEventListener('click', () => {
            notification.classList.add('hiding');
            setTimeout(() => notification.remove(), 300);
        });
    }

    regenerateMessage(messageId) {
        const message = document.getElementById(messageId);
        if (message) {
            const originalText = message.querySelector('.message-text').textContent;
            this.elements.messageInput.value = originalText;
            this.autoResizeTextarea();
            this.sendMessage();
            
            // Remove old message
            message.remove();
        }
    }

    // ============================================
    // FEATURE 25-28: Edit Messages, Swipe, Shortcuts, Lofi
    // ============================================

    editMessage(messageId) {
        const message = document.getElementById(messageId);
        if (message) {
            const textElement = message.querySelector('.message-text');
            const originalText = textElement.textContent;
            
            // Create edit input
            const input = document.createElement('textarea');
            input.value = originalText;
            input.className = 'edit-input';
            input.rows = 3;
            
            // Replace text with input
            textElement.style.display = 'none';
            textElement.parentElement.insertBefore(input, textElement);
            
            // Focus and select
            input.focus();
            input.select();
            
            // Handle save
            const saveEdit = () => {
                const newText = input.value.trim();
                if (newText && newText !== originalText) {
                    textElement.textContent = newText;
                    this.showNotification('Message edited', 'success');
                    
                    // Update in state
                    if (this.state.currentChat) {
                        const msg = this.state.currentChat.messages.find(m => m.id === messageId);
                        if (msg) {
                            msg.content = newText;
                            this.saveToHistory();
                        }
                    }
                }
                
                // Cleanup
                input.remove();
                textElement.style.display = 'block';
            };
            
            // Handle Enter and Escape
            input.addEventListener('keydown', (e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    saveEdit();
                } else if (e.key === 'Escape') {
                    input.remove();
                    textElement.style.display = 'block';
                }
            });
            
            // Save on blur
            input.addEventListener('blur', saveEdit);
        }
    }

    initializeSwipe() {
        let touchStartX = 0;
        let touchEndX = 0;
        
        document.addEventListener('touchstart', (e) => {
            touchStartX = e.changedTouches[0].screenX;
        });
        
        document.addEventListener('touchend', (e) => {
            touchEndX = e.changedTouches[0].screenX;
            this.handleSwipe(touchStartX, touchEndX);
        });
    }

    handleSwipe(startX, endX) {
        const threshold = 50;
        const diff = startX - endX;
        
        if (Math.abs(diff) > threshold) {
            if (diff > 0 && startX < 100) {
                // Swipe right to left near left edge - open sidebar
                this.toggleSidebar();
            } else if (diff < 0 && endX > window.innerWidth - 100) {
                // Swipe left to right near right edge - close sidebar
                if (!this.elements.sidebar.classList.contains('collapsed')) {
                    this.toggleSidebar();
                }
            }
        }
    }

    initializeKeyboardShortcuts() {
        document.addEventListener('keydown', (e) => {
            // Ctrl/Cmd + Enter to send
            if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
                e.preventDefault();
                this.sendMessage();
            }
            
            // Esc to close modals
            if (e.key === 'Escape') {
                this.closeModals();
            }
            
            // Ctrl/Cmd + K to focus input
            if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
                e.preventDefault();
                this.elements.messageInput.focus();
            }
            
            // Ctrl/Cmd + / for help
            if ((e.ctrlKey || e.metaKey) && e.key === '/') {
                e.preventDefault();
                this.showNotification('Keyboard shortcuts: Ctrl+Enter to send, Esc to close, Ctrl+K to focus input', 'info');
            }
        });
    }

    toggleLofi() {
        this.state.isLofiPlaying = !this.state.isLofiPlaying;
        
        if (this.state.isLofiPlaying) {
            this.elements.lofiPlayer.play().catch(e => {
                this.showNotification('Failed to play music. Please interact with the page first.', 'error');
                this.state.isLofiPlaying = false;
            });
            this.elements.lofiToggle.classList.add('active');
            this.showNotification('Lofi music started', 'success');
        } else {
            this.elements.lofiPlayer.pause();
            this.elements.lofiToggle.classList.remove('active');
        }
    }

    // ============================================
    // FEATURE 29-33: Token Mock, Profile, ELI5, Image, Console
    // ============================================

    updateTokenUsage(tokens) {
        this.state.tokensUsed += tokens;
        if (this.state.tokensUsed > this.state.maxTokens) {
            this.state.tokensUsed = this.state.maxTokens;
        }
        this.updateTokenMeter();
    }

    updateTokenMeter() {
        const percentage = (this.state.tokensUsed / this.state.maxTokens) * 100;
        this.elements.tokenFill.style.width = `${percentage}%`;
        this.elements.tokenCount.textContent = `${this.state.tokensUsed.toLocaleString()}/${this.state.maxTokens.toLocaleString()}`;
    }

    changeProfile() {
        this.state.settings.userName = this.elements.userNameInput.value;
        this.elements.userName.textContent = this.state.settings.userName;
        this.showNotification('Profile updated', 'success');
    }

    changeAvatar(avatar) {
        this.state.settings.userAvatar = avatar;
        const icon = {
            user: 'fas fa-user',
            robot: 'fas fa-robot',
            graduation: 'fas fa-graduation-cap',
            brain: 'fas fa-brain'
        }[avatar];
        
        this.elements.userAvatar.innerHTML = `<i class="${icon}"></i>`;
        this.showNotification('Avatar updated', 'success');
    }

    handleImageUpload(event) {
        const file = event.target.files[0];
        if (!file) return;
        
        if (!file.type.startsWith('image/')) {
            this.showNotification('Please upload an image file', 'error');
            return;
        }
        
        if (file.size > 5 * 1024 * 1024) {
            this.showNotification('Image must be less than 5MB', 'error');
            return;
        }
        
        const reader = new FileReader();
        reader.onload = (e) => {
            this.state.currentImage = e.target.result;
            this.showImagePreview(this.state.currentImage);
        };
        reader.readAsDataURL(file);
    }

    showImagePreview(imageData) {
        this.elements.previewImage.src = imageData;
        this.elements.imageModal.classList.add('active');
    }

    closeImageModal() {
        this.elements.imageModal.classList.remove('active');
    }

    analyzeImage() {
        if (!this.state.currentImage) return;
        
        this.closeImageModal();
        this.elements.messageInput.value = 'Analyze this image and describe what you see in detail.';
        this.autoResizeTextarea();
        this.sendMessage();
    }

    removeImage() {
        this.state.currentImage = null;
        this.closeImageModal();
        this.showNotification('Image removed', 'info');
    }

    toggleConsole() {
        this.state.isConsoleOpen = !this.state.isConsoleOpen;
        this.elements.developerConsole.classList.toggle('active', this.state.isConsoleOpen);
    }

    executeConsoleCommand() {
        const command = this.elements.consoleCommand.value.trim();
        if (!command) return;
        
        this.log(`> ${command}`, 'info');
        this.elements.consoleCommand.value = '';
        
        // Simple command parser
        const parts = command.toLowerCase().split(' ');
        const cmd = parts[0];
        const args = parts.slice(1);
        
        switch (cmd) {
            case 'help':
                this.log('Available commands:', 'info');
                this.log('  help - Show this help', 'info');
                this.log('  clear - Clear console', 'info');
                this.log('  status - Show app status', 'info');
                this.log('  history - Show chat history', 'info');
                this.log('  tokens - Show token usage', 'info');
                this.log('  theme [name] - Change theme', 'info');
                break;
                
            case 'clear':
                this.elements.consoleOutput.innerHTML = '';
                break;
                
            case 'status':
                this.log('App Status:', 'success');
                this.log(`  Current Model: ${this.state.currentModel}`, 'info');
                this.log(`  Temperature: ${this.state.temperature}`, 'info');
                this.log(`  Simplify Mode: ${this.state.simplifyMode}`, 'info');
                this.log(`  Focus Mode: ${this.state.isFocusMode}`, 'info');
                this.log(`  Pomodoro: ${this.state.pomodoro.isRunning ? 'Running' : 'Paused'}`, 'info');
                break;
                
            case 'history':
                this.log(`Total chats: ${this.state.history.length}`, 'info');
                this.state.history.slice(0, 5).forEach(chat => {
                    this.log(`  ${new Date(chat.timestamp).toLocaleDateString()}: ${chat.title}`, 'info');
                });
                break;
                
            case 'tokens':
                this.log(`Tokens used: ${this.state.tokensUsed}/${this.state.maxTokens}`, 'info');
                this.log(`Percentage: ${(this.state.tokensUsed / this.state.maxTokens * 100).toFixed(1)}%`, 'info');
                break;
                
            case 'theme':
                if (args[0]) {
                    this.changeTheme({ currentTarget: { dataset: { theme: args[0] } } });
                    this.log(`Theme changed to ${args[0]}`, 'success');
                } else {
                    this.log('Please specify a theme: dark, light, blue, purple', 'error');
                }
                break;
                
            default:
                this.log(`Unknown command: ${cmd}. Type 'help' for available commands.`, 'error');
        }
    }

    log(message, type = 'info') {
        const logEntry = document.createElement('div');
        logEntry.className = `console-log ${type}`;
        logEntry.textContent = `[${new Date().toLocaleTimeString()}] ${message}`;
        
        this.elements.consoleOutput.appendChild(logEntry);
        this.elements.consoleOutput.scrollTop = this.elements.consoleOutput.scrollHeight;
    }

    // ============================================
    // PDF Generation (Feature 8)
    // ============================================

    async downloadPDF() {
        const notesElement = this.elements.notesContent;
        if (!notesElement.innerHTML.trim()) {
            this.showNotification('No notes to export as PDF', 'warning');
            return;
        }
        
        this.showNotification('Generating PDF...', 'info');
        
        const opt = {
            margin: [10, 10],
            filename: `savoire-notes-${new Date().toISOString().slice(0, 10)}.pdf`,
            image: { type: 'jpeg', quality: 0.98 },
            html2canvas: { 
                scale: 2,
                useCORS: true,
                backgroundColor: '#050505'
            },
            jsPDF: { 
                unit: 'mm', 
                format: 'a4', 
                orientation: 'portrait' 
            }
        };
        
        try {
            // Create a temporary element with gold theme for PDF
            const tempElement = document.createElement('div');
            tempElement.style.cssText = `
                background: #050505;
                color: #FFD700;
                padding: 20px;
                font-family: 'Inter', sans-serif;
            `;
            tempElement.innerHTML = notesElement.innerHTML;
            
            // Add header
            const header = document.createElement('div');
            header.style.cssText = `
                text-align: center;
                margin-bottom: 30px;
                border-bottom: 2px solid #FFD700;
                padding-bottom: 10px;
            `;
            header.innerHTML = `
                <h1 style="color: #FFD700; margin: 0;">Savoiré AI Study Notes</h1>
                <p style="color: #cccccc; margin: 5px 0;">Generated on ${new Date().toLocaleDateString()}</p>
                <p style="color: #888888; margin: 0;">by Sooban Talha Technologies</p>
            `;
            
            tempElement.insertBefore(header, tempElement.firstChild);
            
            await html2pdf().set(opt).from(tempElement).save();
            this.showNotification('PDF downloaded successfully!', 'success');
        } catch (error) {
            this.showNotification('Failed to generate PDF', 'error');
            this.log(`PDF Error: ${error.message}`, 'error');
        }
    }

    // ============================================
    // Settings Management
    // ============================================

    openSettings() {
        this.elements.settingsModal.classList.add('active');
        
        // Load current settings into form
        this.elements.userNameInput.value = this.state.settings.userName;
        document.getElementById('systemPrompt').value = this.state.systemPrompt;
        document.getElementById('autoSave').checked = this.state.settings.autoSave;
        document.getElementById('enableAnimations').checked = this.state.settings.enableAnimations;
        document.getElementById('includeExamples').checked = this.state.settings.includeExamples;
        document.getElementById('pomodoroDuration').value = this.state.settings.pomodoroDuration;
        document.getElementById('defaultModel').value = this.state.settings.defaultModel;
        
        // Set active avatar
        document.querySelectorAll('.avatar-option').forEach(option => {
            option.classList.remove('selected');
            if (option.dataset.avatar === this.state.settings.userAvatar) {
                option.classList.add('selected');
            }
        });
    }

    closeSettings() {
        this.elements.settingsModal.classList.remove('active');
    }

    saveSettings() {
        // Save settings
        this.state.settings.userName = this.elements.userNameInput.value;
        this.state.systemPrompt = document.getElementById('systemPrompt').value;
        this.state.settings.autoSave = document.getElementById('autoSave').checked;
        this.state.settings.enableAnimations = document.getElementById('enableAnimations').checked;
        this.state.settings.includeExamples = document.getElementById('includeExamples').checked;
        this.state.settings.pomodoroDuration = parseInt(document.getElementById('pomodoroDuration').value);
        this.state.settings.defaultModel = document.getElementById('defaultModel').value;
        
        // Update UI
        this.elements.userName.textContent = this.state.settings.userName;
        this.state.currentModel = this.state.settings.defaultModel;
        this.elements.modelSelect.value = this.state.currentModel;
        this.elements.currentModel.textContent = this.getModelName(this.state.currentModel);
        
        // Update pomodoro
        this.state.pomodoro.duration = this.state.settings.pomodoroDuration * 60;
        this.state.pomodoro.timeLeft = this.state.pomodoro.duration;
        this.updatePomodoroDisplay();
        
        // Save to localStorage
        this.saveState();
        
        this.closeSettings();
        this.showNotification('Settings saved successfully!', 'success');
    }

    resetSettings() {
        if (confirm('Are you sure you want to reset all settings to defaults?')) {
            // Reset to defaults
            this.state.settings = {
                userName: 'Student',
                userAvatar: 'user',
                autoSave: true,
                enableAnimations: true,
                includeExamples: true,
                pomodoroDuration: 25,
                defaultModel: 'google/gemini-2.0-flash-exp:free'
            };
            
            this.state.systemPrompt = "You are Savoiré AI, an advanced study assistant created by Sooban Talha Technologies. You help students learn complex topics by providing detailed, accurate, and engaging explanations. Always format responses with proper markdown, include examples when relevant, and break down complex concepts into digestible parts.";
            this.state.temperature = 0.7;
            this.state.simplifyMode = false;
            
            // Update UI
            this.openSettings(); // Reload form with defaults
            this.showNotification('Settings reset to defaults', 'info');
        }
    }

    switchTab(event) {
        const tabName = event.currentTarget.dataset.tab;
        
        // Update tabs
        this.elements.tabs.forEach(tab => tab.classList.remove('active'));
        event.currentTarget.classList.add('active');
        
        // Update content
        this.elements.tabContents.forEach(content => {
            content.classList.remove('active');
            if (content.id === `${tabName}Tab`) {
                content.classList.add('active');
            }
        });
    }

    changeTheme(event) {
        const theme = event.currentTarget.dataset.theme;
        
        // Update theme options
        this.elements.themeOptions.forEach(option => {
            option.classList.remove('selected');
        });
        event.currentTarget.classList.add('selected');
        
        // Apply theme
        document.documentElement.setAttribute('data-theme', theme);
        localStorage.setItem('savoire_theme', theme);
        
        this.showNotification(`Theme changed to ${theme}`, 'success');
    }

    // ============================================
    // Wormhole Background (Advanced Animation)
    // ============================================

    initializeWormhole() {
        const canvas = this.elements.wormholeCanvas;
        const ctx = canvas.getContext('2d');
        
        // Set canvas size
        const resizeCanvas = () => {
            canvas.width = window.innerWidth;
            canvas.height = window.innerHeight;
        };
        resizeCanvas();
        window.addEventListener('resize', resizeCanvas);
        
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
                color: `rgba(255, 215, 0, ${Math.random() * 0.5 + 0.1})`
            });
        }
        
        // Animation loop
        const animate = () => {
            if (!this.state.settings.enableAnimations) {
                requestAnimationFrame(animate);
                return;
            }
            
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            
            // Create wormhole gradient
            const gradient = ctx.createRadialGradient(
                canvas.width / 2,
                canvas.height / 2,
                0,
                canvas.width / 2,
                canvas.height / 2,
                Math.min(canvas.width, canvas.height) / 2
            );
            gradient.addColorStop(0, 'rgba(255, 215, 0, 0.1)');
            gradient.addColorStop(0.5, 'rgba(255, 215, 0, 0.05)');
            gradient.addColorStop(1, 'rgba(255, 215, 0, 0)');
            
            ctx.fillStyle = gradient;
            ctx.fillRect(0, 0, canvas.width, canvas.height);
            
            // Update and draw particles
            particles.forEach(particle => {
                // Update position
                particle.x += particle.speedX;
                particle.y += particle.speedY;
                
                // Wrap around edges
                if (particle.x < 0) particle.x = canvas.width;
                if (particle.x > canvas.width) particle.x = 0;
                if (particle.y < 0) particle.y = canvas.height;
                if (particle.y > canvas.height) particle.y = 0;
                
                // Draw particle
                ctx.beginPath();
                ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
                ctx.fillStyle = particle.color;
                ctx.fill();
                
                // Draw connections
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
    }

    // ============================================
    // Utility Methods
    // ============================================

    autoResizeTextarea() {
        const textarea = this.elements.messageInput;
        textarea.style.height = 'auto';
        textarea.style.height = Math.min(textarea.scrollHeight, 120) + 'px';
    }

    handleKeyDown(event) {
        // Enter to send (without Shift)
        if (event.key === 'Enter' && !event.shiftKey) {
            event.preventDefault();
            this.sendMessage();
        }
    }

    createNewChat() {
        this.state.currentChat = {
            id: Date.now(),
            title: 'New Chat',
            messages: [],
            timestamp: new Date().toISOString()
        };
        
        this.elements.messagesContainer.innerHTML = '';
        this.elements.notesContent.innerHTML = document.querySelector('.notes-empty').outerHTML;
        this.elements.currentChatTitle.textContent = 'New Chat';
        
        this.showNotification('New chat created', 'success');
    }

    loadChat(chat) {
        this.state.currentChat = chat;
        
        // Clear messages
        this.elements.messagesContainer.innerHTML = '';
        
        // Load messages
        chat.messages.forEach(msg => {
            this.addMessage(msg.content, msg.type);
        });
        
        // Update title
        this.elements.currentChatTitle.textContent = chat.title;
        
        // Update notes with last AI message
        const lastAIMessage = chat.messages.filter(m => m.type === 'ai').pop();
        if (lastAIMessage) {
            this.updateNotesPanel(lastAIMessage.content);
        }
        
        // Close sidebar on mobile
        if (window.innerWidth < 768) {
            this.toggleSidebar();
        }
        
        this.showNotification('Chat loaded', 'success');
    }

    clearCurrentChat() {
        if (confirm('Are you sure you want to clear this chat?')) {
            this.createNewChat();
            this.showNotification('Chat cleared', 'info');
        }
    }

    toggleSidebar() {
        this.elements.sidebar.classList.toggle('active');
    }

    closeModals() {
        this.closeSettings();
        this.closeImageModal();
        if (this.state.isConsoleOpen) this.toggleConsole();
    }

    scrollToBottom() {
        this.elements.messagesContainer.scrollTop = this.elements.messagesContainer.scrollHeight;
    }

    sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    capitalizeFirstLetter(string) {
        return string.charAt(0).toUpperCase() + string.slice(1);
    }

    getModelName(modelId) {
        const names = {
            'google/gemini-2.0-flash-exp:free': 'Gemini 2.0',
            'z-ai/glm-4.5-air:free': 'GLM 4.5',
            'deepseek/deepseek-chat-v3.1:free': 'DeepSeek',
            'tngtech/deepseek-r1t2-chimera:free': 'DeepSeek R1',
            'meta-llama/llama-3.2-3b-instruct:free': 'Llama 3.2'
        };
        return names[modelId] || modelId.split('/').pop();
    }

    generateFallbackResponse(prompt) {
        // Simple fallback response generator
        const responses = [
            `I understand you're asking about "${prompt}". Here's a comprehensive explanation:\n\n**Core Concept:** This topic involves fundamental principles that form the basis for deeper understanding.\n\n**Key Points:**\n1. Start with the basics\n2. Build up complexity gradually\n3. Practice with examples\n4. Apply to real-world scenarios\n\n**Example:** Consider a practical application to solidify your understanding.`,
            
            `Let me break down "${prompt}" for you:\n\n### Overview\nThis is an important concept with applications across multiple domains.\n\n### Detailed Explanation\n1. **Fundamental Principle:** The core idea behind this concept\n2. **Key Components:** Essential elements that make it work\n3. **Practical Applications:** How it's used in real life\n\n### Study Tips\n- Create mind maps\n- Practice with problems\n- Teach someone else\n- Review regularly`,
            
            `Regarding "${prompt}", here's what you need to know:\n\n## Comprehensive Analysis\nThis topic requires systematic study and practice.\n\n### Key Concepts\n- Concept 1: Essential foundation\n- Concept 2: Building blocks\n- Concept 3: Advanced applications\n\n### Common Challenges\nStudents often struggle with:\n1. Overcomplicating simple aspects\n2. Missing foundational knowledge\n3. Lack of practical application\n\n### Solution Approach\nBreak it down step by step and practice consistently.`
        ];
        
        return responses[Math.floor(Math.random() * responses.length)];
    }

    saveState() {
        const state = {
            settings: this.state.settings,
            systemPrompt: this.state.systemPrompt,
            temperature: this.state.temperature,
            simplifyMode: this.state.simplifyMode,
            tokensUsed: this.state.tokensUsed,
            theme: document.documentElement.getAttribute('data-theme') || 'dark'
        };
        
        localStorage.setItem('savoire_state', JSON.stringify(state));
    }

    loadState() {
        const savedState = localStorage.getItem('savoire_state');
        if (savedState) {
            const state = JSON.parse(savedState);
            
            // Merge with current state
            this.state.settings = { ...this.state.settings, ...state.settings };
            this.state.systemPrompt = state.systemPrompt || this.state.systemPrompt;
            this.state.temperature = state.temperature || this.state.temperature;
            this.state.simplifyMode = state.simplifyMode || false;
            this.state.tokensUsed = state.tokensUsed || 6543;
            
            // Apply theme
            if (state.theme) {
                document.documentElement.setAttribute('data-theme', state.theme);
                document.querySelectorAll('.theme-option').forEach(option => {
                    option.classList.remove('selected');
                    if (option.dataset.theme === state.theme) {
                        option.classList.add('selected');
                    }
                });
            }
            
            // Update UI
            this.elements.userName.textContent = this.state.settings.userName;
            this.changeAvatar(this.state.settings.userAvatar);
        }
    }

    showError(message) {
        this.showNotification(message, 'error');
        this.log(message, 'error');
    }

    toggleFullscreenNotes() {
        const notesPanel = document.querySelector('.notes-panel');
        notesPanel.classList.toggle('fullscreen');
        
        if (notesPanel.classList.contains('fullscreen')) {
            notesPanel.style.width = '100%';
            notesPanel.style.height = '100vh';
            notesPanel.style.position = 'fixed';
            notesPanel.style.top = '0';
            notesPanel.style.left = '0';
            notesPanel.style.zIndex = '1000';
            this.showNotification('Notes fullscreen mode enabled', 'info');
        } else {
            notesPanel.style.width = '';
            notesPanel.style.height = '';
            notesPanel.style.position = '';
            notesPanel.style.top = '';
            notesPanel.style.left = '';
            notesPanel.style.zIndex = '';
        }
    }

    addCopyButton(messageDiv) {
        const actions = messageDiv.querySelector('.message-actions');
        if (actions) {
            actions.style.display = 'flex';
        }
    }

    addRegenerateButton(messageDiv, originalResponse) {
        const actions = messageDiv.querySelector('.message-actions');
        if (actions) {
            const regenerateBtn = document.createElement('button');
            regenerateBtn.className = 'message-action';
            regenerateBtn.title = 'Regenerate';
            regenerateBtn.innerHTML = '<i class="fas fa-redo"></i>';
            regenerateBtn.onclick = () => {
                this.elements.messageInput.value = originalResponse;
                this.autoResizeTextarea();
                this.sendMessage();
                messageDiv.remove();
            };
            actions.appendChild(regenerateBtn);
        }
    }
}

// Initialize the app when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.app = new SavoireAI();
    
    // Make app available globally for HTML onclick handlers
    window.app = window.app;
    
    // Initialize KaTeX auto-render
    renderMathInElement(document.body, {
        delimiters: [
            {left: '$$', right: '$$', display: true},
            {left: '$', right: '$', display: false},
            {left: '\\(', right: '\\)', display: false},
            {left: '\\[', right: '\\]', display: true}
        ],
        throwOnError: false
    });
});
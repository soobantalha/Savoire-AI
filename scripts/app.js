// Savoiré AI v2.0 - Main Application
class SavoireAI {
    constructor() {
        this.state = {
            user: null,
            messages: [],
            notes: [],
            saved: [],
            isAudioPlaying: false,
            audioVolume: 30,
            isDrawerOpen: false,
            settings: {
                typewriter: true,
                darkTheme: true,
                autoSave: true,
                audioEnabled: true
            },
            currentTab: 'notes',
            isGenerating: false,
            youtubePlayer: null
        };

        this.init();
    }

    async init() {
        this.loadState();
        this.initCanvas();
        this.bindEvents();
        this.initYouTube();
        this.showIntroIfNeeded();
        
        // Initialize markdown
        marked.setOptions({
            gfm: true,
            breaks: true,
            smartLists: true,
            smartypants: true,
            highlight: function(code, lang) {
                if (Prism.languages[lang]) {
                    return Prism.highlight(code, Prism.languages[lang], lang);
                }
                return code;
            }
        });

        // Auto-save every 30 seconds
        setInterval(() => this.saveState(), 30000);
        
        // Update UI
        this.updateUserAvatar();
        this.renderMessages();
        this.renderNotes();
        this.renderSaved();
    }

    // Canvas Particle System
    initCanvas() {
        const canvas = document.getElementById('bgCanvas');
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
                size: Math.random() * 3 + 0.5,
                speedX: (Math.random() - 0.5) * 0.5,
                speedY: (Math.random() - 0.5) * 0.5,
                color: `hsla(${Math.random() * 60 + 200}, 70%, 60%, ${Math.random() * 0.3 + 0.1})`
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
            ctx.fillStyle = 'rgba(5, 5, 5, 0.05)';
            ctx.fillRect(0, 0, canvas.width, canvas.height);
            
            // Draw center glow
            const gradient = ctx.createRadialGradient(
                mouseX, mouseY, 0,
                mouseX, mouseY, 150
            );
            gradient.addColorStop(0, 'rgba(255, 215, 0, 0.1)');
            gradient.addColorStop(1, 'rgba(255, 215, 0, 0)');
            
            ctx.fillStyle = gradient;
            ctx.beginPath();
            ctx.arc(mouseX, mouseY, 150, 0, Math.PI * 2);
            ctx.fill();
            
            // Update and draw particles
            particles.forEach(particle => {
                // Move particle
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
                        ctx.moveTo(particle.x, particle.y);
                        ctx.lineTo(otherParticle.x, otherParticle.y);
                        ctx.strokeStyle = `rgba(255, 215, 0, ${0.1 * (1 - distance / 100)})`;
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
    }

    // YouTube Audio Player
    initYouTube() {
        if (typeof YT !== 'undefined' && YT.Player) {
            this.state.youtubePlayer = new YT.Player('hiddenPlayer', {
                height: '0',
                width: '0',
                videoId: 'jfKfPfyJRdk',
                playerVars: {
                    autoplay: this.state.settings.audioEnabled ? 1 : 0,
                    controls: 0,
                    disablekb: 1,
                    fs: 0,
                    iv_load_policy: 3,
                    modestbranding: 1,
                    playsinline: 1,
                    rel: 0,
                    showinfo: 0
                },
                events: {
                    onReady: (event) => {
                        event.target.setVolume(this.state.audioVolume);
                        if (this.state.settings.audioEnabled) {
                            event.target.playVideo();
                            this.state.isAudioPlaying = true;
                        }
                    },
                    onStateChange: (event) => {
                        if (event.data === YT.PlayerState.PLAYING) {
                            this.state.isAudioPlaying = true;
                        } else if (event.data === YT.PlayerState.PAUSED) {
                            this.state.isAudioPlaying = false;
                        }
                    }
                }
            });
        } else {
            setTimeout(() => this.initYouTube(), 100);
        }
    }

    toggleAudio() {
        if (!this.state.youtubePlayer) return;
        
        if (this.state.isAudioPlaying) {
            this.state.youtubePlayer.pauseVideo();
            this.showToast('Audio Paused', 'Background audio paused');
        } else {
            this.state.youtubePlayer.playVideo();
            this.showToast('Audio Playing', 'Background audio resumed');
        }
        this.state.isAudioPlaying = !this.state.isAudioPlaying;
    }

    setVolume(volume) {
        this.state.audioVolume = volume;
        if (this.state.youtubePlayer) {
            this.state.youtubePlayer.setVolume(volume);
        }
    }

    // Intro & Tutorial
    showIntroIfNeeded() {
        if (!this.state.user) {
            this.showIntro();
        } else if (!localStorage.getItem('savoire-tutorial-completed')) {
            setTimeout(() => this.showTutorial(), 1000);
        }
    }

    showIntro() {
        const introLayer = document.getElementById('introLayer');
        const typewriterText = document.getElementById('typewriterText');
        
        introLayer.classList.remove('hidden');
        
        // Typewriter effect for intro text
        const text = "Welcome to the Future of Learning";
        let i = 0;
        
        const typeWriter = () => {
            if (i < text.length) {
                typewriterText.textContent += text.charAt(i);
                i++;
                setTimeout(typeWriter, 50);
            } else {
                document.getElementById('nameInputContainer').style.opacity = '1';
                document.getElementById('userNameInput').focus();
            }
        };
        
        setTimeout(() => {
            typewriterText.textContent = '';
            typeWriter();
        }, 500);
    }

    handleStartJourney() {
        const userName = document.getElementById('userNameInput').value.trim();
        if (userName) {
            this.state.user = {
                name: userName,
                avatarColor: '#FFD700',
                createdAt: new Date().toISOString()
            };
            
            this.saveState();
            this.hideIntro();
            this.showTutorial();
            this.updateUserAvatar();
            
            // Update greeting
            const greetingName = document.getElementById('greetingName');
            if (greetingName) {
                greetingName.textContent = userName;
            }
        } else {
            this.showToast('Name Required', 'Please enter your name to begin');
        }
    }

    hideIntro() {
        const introLayer = document.getElementById('introLayer');
        introLayer.style.opacity = '0';
        setTimeout(() => {
            introLayer.classList.add('hidden');
        }, 500);
    }

    showTutorial() {
        const tutorialOverlay = document.getElementById('tutorialOverlay');
        const steps = document.querySelectorAll('.tutorial-step');
        let currentStep = 0;
        
        tutorialOverlay.classList.add('active');
        steps[currentStep].style.display = 'block';
        
        const nextStep = () => {
            steps[currentStep].style.display = 'none';
            currentStep++;
            
            if (currentStep < steps.length) {
                steps[currentStep].style.display = 'block';
            } else {
                this.completeTutorial();
            }
        };
        
        document.querySelectorAll('.tutorial-next').forEach(btn => {
            btn.addEventListener('click', nextStep);
        });
        
        document.querySelector('.tutorial-complete').addEventListener('click', () => {
            this.completeTutorial();
        });
    }

    completeTutorial() {
        const tutorialOverlay = document.getElementById('tutorialOverlay');
        tutorialOverlay.classList.remove('active');
        localStorage.setItem('savoire-tutorial-completed', 'true');
        this.showToast('Welcome!', 'Your learning journey begins now');
    }

    // Chat Interface
    async sendMessage() {
        const input = document.getElementById('messageInput');
        const message = input.value.trim();
        
        if (!message || this.state.isGenerating) return;
        
        // Clear input
        input.value = '';
        this.autoResizeInput();
        
        // Add user message
        this.addMessage(message, 'user');
        
        // Show typing indicator
        this.showTypingIndicator();
        
        try {
            // Generate AI response
            const response = await this.generateAIResponse(message);
            
            // Remove typing indicator
            this.hideTypingIndicator();
            
            // Add AI response
            this.addMessage(response, 'ai');
            
            // Extract notes
            if (this.state.settings.autoSave) {
                this.extractNotes(response);
            }
            
        } catch (error) {
            this.hideTypingIndicator();
            this.showToast('AI Error', error.message || 'Failed to generate response');
            console.error('AI Error:', error);
        }
    }

    addMessage(content, type) {
        const message = {
            id: Date.now(),
            content,
            type,
            timestamp: new Date().toISOString(),
            html: this.formatMessage(content, type)
        };
        
        this.state.messages.push(message);
        this.renderMessages();
        this.scrollToBottom();
        this.saveState();
    }

    formatMessage(content, type) {
        let html = marked.parse(content);
        
        // Add copy buttons to code blocks
        html = html.replace(/<pre><code class="language-([^"]+)">/g, (match, lang) => {
            return `<div class="code-header">
                <span>${lang || 'code'}</span>
                <button class="copy-code-btn" onclick="savoireAI.copyCode(this)">
                    <i class="fas fa-copy"></i> Copy
                </button>
            </div><pre><code class="language-${lang}">`;
        });
        
        return html;
    }

    renderMessages() {
        const container = document.getElementById('messagesContainer');
        if (!container) return;
        
        // Filter out typing indicator
        const messages = this.state.messages.filter(msg => msg.type !== 'typing');
        
        container.innerHTML = `
            <div class="welcome-message">
                <div class="message ai">
                    <div class="message-avatar">
                        <i class="fas fa-sparkles"></i>
                    </div>
                    <div class="message-content">
                        <h3>Hello, <span id="greetingName">${this.state.user?.name || 'Learner'}</span>! 👋</h3>
                        <p>I'm Savoiré AI, your personal learning companion.</p>
                        <p>What would you like to learn today?</p>
                    </div>
                </div>
            </div>
        `;
        
        messages.forEach(msg => {
            const messageDiv = document.createElement('div');
            messageDiv.className = `message ${msg.type}`;
            messageDiv.innerHTML = `
                <div class="message-avatar">
                    ${msg.type === 'user' ? this.state.user?.name.charAt(0).toUpperCase() || 'U' : '<i class="fas fa-robot"></i>'}
                </div>
                <div class="message-content">
                    ${msg.html}
                    <div class="message-actions">
                        <button class="message-action" onclick="savoireAI.saveMessage(${msg.id})" title="Save">
                            <i class="fas fa-bookmark"></i>
                        </button>
                        ${msg.type === 'user' ? `<button class="message-action" onclick="savoireAI.editMessage(${msg.id})" title="Edit">
                            <i class="fas fa-edit"></i>
                        </button>` : ''}
                    </div>
                </div>
            `;
            container.appendChild(messageDiv);
        });
        
        // Apply KaTeX rendering
        setTimeout(() => {
            renderMathInElement(container, {
                delimiters: [
                    {left: '$$', right: '$$', display: true},
                    {left: '$', right: '$', display: false},
                    {left: '\\(', right: '\\)', display: false},
                    {left: '\\[', right: '\\]', display: true}
                ],
                throwOnError: false
            });
            
            // Apply Prism highlighting
            Prism.highlightAllUnder(container);
        }, 100);
    }

    showTypingIndicator() {
        this.state.isGenerating = true;
        this.addMessage('Thinking...', 'typing');
        
        // Disable send button
        const sendBtn = document.getElementById('sendButton');
        if (sendBtn) sendBtn.disabled = true;
    }

    hideTypingIndicator() {
        this.state.isGenerating = false;
        this.state.messages = this.state.messages.filter(msg => msg.type !== 'typing');
        this.renderMessages();
        
        // Enable send button
        const sendBtn = document.getElementById('sendButton');
        if (sendBtn) sendBtn.disabled = false;
    }

    async generateAIResponse(prompt) {
        try {
            const response = await fetch('/api/study', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    message: prompt,
                    model: 'auto' // Let backend choose best free model
                })
            });
            
            if (!response.ok) {
                throw new Error(`API error: ${response.status}`);
            }
            
            const data = await response.json();
            
            if (data.success && data.response) {
                return data.response;
            } else if (data.text) {
                return data.text;
            } else {
                throw new Error('No response from AI');
            }
            
        } catch (error) {
            // Fallback response
            return `I apologize, but I'm having trouble connecting to the AI service right now. Here's what I can tell you about your query:

**Query:** "${prompt.substring(0, 100)}..."

**Suggested Learning Path:**
1. Break down the concept into smaller parts
2. Search for fundamental principles
3. Look for practical examples
4. Connect with existing knowledge

**Next Steps:**
- Try rephrasing your question
- Ask about specific aspects
- Use images for visual concepts

*Note: AI service is temporarily unavailable. Please try again in a moment.*`;
        }
    }

    // Notes System
    extractNotes(content) {
        // Simple extraction logic - in production, use more sophisticated NLP
        const lines = content.split('\n');
        const notes = [];
        
        lines.forEach(line => {
            if (line.includes('**') || line.includes('# ') || line.includes('1.') || line.includes('- ')) {
                notes.push(line.trim());
            }
        });
        
        if (notes.length > 0) {
            this.state.notes.unshift({
                id: Date.now(),
                content: notes.slice(0, 5).join('\n'),
                timestamp: new Date().toISOString(),
                source: content.substring(0, 100) + '...'
            });
            
            // Keep only last 20 notes
            if (this.state.notes.length > 20) {
                this.state.notes = this.state.notes.slice(0, 20);
            }
            
            this.renderNotes();
            this.saveState();
        }
    }

    renderNotes() {
        const container = document.getElementById('notesContent');
        if (!container) return;
        
        if (this.state.notes.length === 0) {
            container.innerHTML = `
                <div class="empty-notes">
                    <i class="fas fa-lightbulb"></i>
                    <p>Your notes will appear here as you chat</p>
                </div>
            `;
            return;
        }
        
        container.innerHTML = '';
        this.state.notes.forEach(note => {
            const noteDiv = document.createElement('div');
            noteDiv.className = 'note-item';
            noteDiv.innerHTML = `
                <div class="note-content">
                    ${marked.parse(note.content)}
                </div>
                <div class="note-meta">
                    <small>${new Date(note.timestamp).toLocaleTimeString()}</small>
                </div>
            `;
            container.appendChild(noteDiv);
        });
    }

    clearNotes() {
        if (confirm('Clear all notes?')) {
            this.state.notes = [];
            this.renderNotes();
            this.saveState();
            this.showToast('Notes Cleared', 'All notes have been removed');
        }
    }

    // Saved Messages
    saveMessage(messageId) {
        const message = this.state.messages.find(msg => msg.id === messageId);
        if (message) {
            this.state.saved.unshift({
                ...message,
                savedAt: new Date().toISOString()
            });
            
            // Keep only last 50 saved items
            if (this.state.saved.length > 50) {
                this.state.saved = this.state.saved.slice(0, 50);
            }
            
            this.renderSaved();
            this.saveState();
            this.showToast('Message Saved', 'Added to saved conversations');
        }
    }

    renderSaved() {
        const container = document.getElementById('savedList');
        if (!container) return;
        
        if (this.state.saved.length === 0) {
            container.innerHTML = `
                <div class="empty-saved">
                    <i class="fas fa-bookmark"></i>
                    <p>No saved conversations yet</p>
                    <p class="subtext">Click the bookmark icon on any message to save it</p>
                </div>
            `;
            return;
        }
        
        container.innerHTML = '';
        this.state.saved.forEach(item => {
            const savedDiv = document.createElement('div');
            savedDiv.className = 'saved-item';
            savedDiv.onclick = () => this.loadSaved(item);
            savedDiv.innerHTML = `
                <div class="preview">${item.content.substring(0, 100)}${item.content.length > 100 ? '...' : ''}</div>
                <div class="meta">
                    <span>${item.type === 'user' ? 'You' : 'AI'}</span>
                    <span>${new Date(item.savedAt).toLocaleDateString()}</span>
                </div>
            `;
            container.appendChild(savedDiv);
        });
    }

    loadSaved(savedItem) {
        this.addMessage(savedItem.content, savedItem.type);
        this.showToast('Loaded', 'Saved message loaded to chat');
    }

    // PDF Export
    async exportPDF() {
        try {
            this.showToast('Generating PDF', 'Please wait...');
            
            const element = document.createElement('div');
            element.className = 'pdf-content';
            
            // Add header
            element.innerHTML = `
                <div class="pdf-header">
                    <h1>Savoiré AI Study Notes</h1>
                    <p>Generated on ${new Date().toLocaleString()}</p>
                    <p>User: ${this.state.user?.name || 'Learner'}</p>
                    <hr>
                </div>
            `;
            
            // Add messages
            const messagesToInclude = this.state.messages.filter(msg => msg.type !== 'typing');
            messagesToInclude.forEach(msg => {
                const messageDiv = document.createElement('div');
                messageDiv.className = `pdf-message ${msg.type}`;
                messageDiv.innerHTML = `
                    <div class="pdf-message-header">
                        <strong>${msg.type === 'user' ? 'You' : 'Savoiré AI'}</strong>
                        <span>${new Date(msg.timestamp).toLocaleTimeString()}</span>
                    </div>
                    <div class="pdf-message-content">
                        ${this.stripHTML(msg.html)}
                    </div>
                `;
                element.appendChild(messageDiv);
            });
            
            // Add notes if included
            if (document.getElementById('includeNotes').checked && this.state.notes.length > 0) {
                const notesDiv = document.createElement('div');
                notesDiv.className = 'pdf-notes';
                notesDiv.innerHTML = `
                    <h2>Auto-Generated Notes</h2>
                    ${this.state.notes.map(note => `
                        <div class="pdf-note">
                            <p>${this.stripHTML(marked.parse(note.content))}</p>
                            <small>${new Date(note.timestamp).toLocaleString()}</small>
                        </div>
                    `).join('')}
                `;
                element.appendChild(notesDiv);
            }
            
            // Add footer
            const footer = document.createElement('div');
            footer.className = 'pdf-footer';
            footer.innerHTML = `
                <hr>
                <p>Generated by Savoiré AI v2.0 • Sooban Talha Productions</p>
                <p>https://soobantalhatech.xyz</p>
                <p>Page {{page}} of {{pages}}</p>
            `;
            element.appendChild(footer);
            
            // Generate PDF
            const opt = {
                margin: [10, 10, 10, 10],
                filename: `SavoireAI_Notes_${Date.now()}.pdf`,
                image: { type: 'jpeg', quality: 0.98 },
                html2canvas: { 
                    scale: 2,
                    useCORS: true,
                    backgroundColor: '#ffffff'
                },
                jsPDF: { 
                    unit: 'mm', 
                    format: 'a4', 
                    orientation: 'portrait' 
                }
            };
            
            await html2pdf().set(opt).from(element).save();
            
            this.showToast('PDF Exported', 'Document downloaded successfully');
            
        } catch (error) {
            console.error('PDF Export Error:', error);
            this.showToast('Export Failed', 'Could not generate PDF');
        }
    }

    stripHTML(html) {
        const div = document.createElement('div');
        div.innerHTML = html;
        return div.textContent || div.innerText || '';
    }

    // Drawer Management
    toggleDrawer() {
        this.state.isDrawerOpen = !this.state.isDrawerOpen;
        const drawer = document.getElementById('glassDrawer');
        if (this.state.isDrawerOpen) {
            drawer.classList.add('active');
        } else {
            drawer.classList.remove('active');
        }
    }

    switchTab(tabName) {
        this.state.currentTab = tabName;
        
        // Update tab buttons
        document.querySelectorAll('.tab-btn').forEach(btn => {
            btn.classList.remove('active');
            if (btn.dataset.tab === tabName) {
                btn.classList.add('active');
            }
        });
        
        // Update tab content
        document.querySelectorAll('.tab-content').forEach(content => {
            content.classList.remove('active');
            if (content.id === tabName + 'Tab') {
                content.classList.add('active');
            }
        });
    }

    // Settings Management
    showSettings() {
        const modal = document.getElementById('settingsModal');
        modal.classList.add('active');
        
        // Load current settings
        document.getElementById('settingsNameInput').value = this.state.user?.name || '';
        document.getElementById('avatarColorPicker').value = this.state.user?.avatarColor || '#FFD700';
        document.getElementById('typewriterToggle').checked = this.state.settings.typewriter;
        document.getElementById('darkThemeToggle').checked = this.state.settings.darkTheme;
        document.getElementById('autoSaveToggle').checked = this.state.settings.autoSave;
        document.getElementById('audioToggle').checked = this.state.settings.audioEnabled;
        document.getElementById('volumeSlider').value = this.state.audioVolume;
    }

    hideSettings() {
        const modal = document.getElementById('settingsModal');
        modal.classList.remove('active');
    }

    saveSettings() {
        // Update user
        if (this.state.user) {
            this.state.user.name = document.getElementById('settingsNameInput').value.trim() || 'Learner';
            this.state.user.avatarColor = document.getElementById('avatarColorPicker').value;
        }
        
        // Update settings
        this.state.settings.typewriter = document.getElementById('typewriterToggle').checked;
        this.state.settings.darkTheme = document.getElementById('darkThemeToggle').checked;
        this.state.settings.autoSave = document.getElementById('autoSaveToggle').checked;
        this.state.settings.audioEnabled = document.getElementById('audioToggle').checked;
        
        // Update volume
        this.state.audioVolume = parseInt(document.getElementById('volumeSlider').value);
        this.setVolume(this.state.audioVolume);
        
        // Toggle audio
        if (this.state.settings.audioEnabled && !this.state.isAudioPlaying && this.state.youtubePlayer) {
            this.state.youtubePlayer.playVideo();
        } else if (!this.state.settings.audioEnabled && this.state.isAudioPlaying && this.state.youtubePlayer) {
            this.state.youtubePlayer.pauseVideo();
        }
        
        // Update UI
        this.updateUserAvatar();
        this.saveState();
        this.hideSettings();
        this.showToast('Settings Saved', 'Your preferences have been updated');
    }

    resetSettings() {
        if (confirm('Reset all settings to defaults?')) {
            this.state.user = {
                name: 'Learner',
                avatarColor: '#FFD700',
                createdAt: new Date().toISOString()
            };
            
            this.state.settings = {
                typewriter: true,
                darkTheme: true,
                autoSave: true,
                audioEnabled: true
            };
            
            this.state.audioVolume = 30;
            this.state.notes = [];
            this.state.saved = [];
            
            this.saveState();
            this.updateUserAvatar();
            this.renderNotes();
            this.renderSaved();
            this.showSettings();
            this.showToast('Settings Reset', 'All settings restored to defaults');
        }
    }

    updateUserAvatar() {
        const avatar = document.getElementById('userAvatar');
        if (avatar && this.state.user) {
            avatar.innerHTML = `<span>${this.state.user.name.charAt(0).toUpperCase()}</span>`;
            avatar.style.background = this.state.user.avatarColor;
            avatar.style.color = this.getContrastColor(this.state.user.avatarColor);
        }
    }

    getContrastColor(hexColor) {
        // Convert hex to RGB
        const r = parseInt(hexColor.substr(1, 2), 16);
        const g = parseInt(hexColor.substr(3, 2), 16);
        const b = parseInt(hexColor.substr(5, 2), 16);
        
        // Calculate luminance
        const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
        
        // Return black or white
        return luminance > 0.5 ? '#000000' : '#FFFFFF';
    }

    // Utility Functions
    autoResizeInput() {
        const textarea = document.getElementById('messageInput');
        textarea.style.height = 'auto';
        textarea.style.height = Math.min(textarea.scrollHeight, 200) + 'px';
    }

    scrollToBottom() {
        const container = document.getElementById('messagesContainer');
        if (container) {
            container.scrollTop = container.scrollHeight;
        }
    }

    copyCode(button) {
        const codeElement = button.closest('.code-header').nextElementSibling.querySelector('code');
        const code = codeElement.textContent;
        
        navigator.clipboard.writeText(code).then(() => {
            const originalHTML = button.innerHTML;
            button.innerHTML = '<i class="fas fa-check"></i> Copied';
            button.style.background = '#10B981';
            
            setTimeout(() => {
                button.innerHTML = originalHTML;
                button.style.background = '';
            }, 2000);
        }).catch(err => {
            console.error('Copy failed:', err);
        });
    }

    showToast(title, message) {
        const container = document.getElementById('toastContainer');
        const toast = document.createElement('div');
        toast.className = 'toast';
        toast.innerHTML = `
            <div class="toast-icon">
                <i class="fas fa-info-circle"></i>
            </div>
            <div class="toast-content">
                <div class="toast-title">${title}</div>
                <div class="toast-message">${message}</div>
            </div>
        `;
        
        container.appendChild(toast);
        
        // Remove after 5 seconds
        setTimeout(() => {
            toast.style.opacity = '0';
            setTimeout(() => toast.remove(), 300);
        }, 5000);
        
        // Remove if too many toasts
        const toasts = container.querySelectorAll('.toast');
        if (toasts.length > 3) {
            toasts[0].remove();
        }
    }

    // Event Binding
    bindEvents() {
        // Start journey button
        document.getElementById('startJourneyBtn').addEventListener('click', () => this.handleStartJourney());
        document.getElementById('userNameInput').addEventListener('keypress', (e) => {
            if (e.key === 'Enter') this.handleStartJourney();
        });
        
        // Navigation
        document.getElementById('toggleDrawerBtn').addEventListener('click', () => this.toggleDrawer());
        document.getElementById('toggleAudioBtn').addEventListener('click', () => this.toggleAudio());
        document.getElementById('settingsBtn').addEventListener('click', () => this.showSettings());
        
        // Drawer
        document.getElementById('drawerCloseBtn').addEventListener('click', () => this.toggleDrawer());
        document.querySelectorAll('.tab-btn').forEach(btn => {
            btn.addEventListener('click', () => this.switchTab(btn.dataset.tab));
        });
        
        // Notes
        document.getElementById('clearNotesBtn').addEventListener('click', () => this.clearNotes());
        
        // PDF Export
        document.getElementById('exportPdfBtn').addEventListener('click', () => this.exportPDF());
        
        // Settings
        document.getElementById('closeSettingsBtn').addEventListener('click', () => this.hideSettings());
        document.getElementById('saveSettingsBtn').addEventListener('click', () => this.saveSettings());
        document.getElementById('resetSettingsBtn').addEventListener('click', () => this.resetSettings());
        
        // Chat input
        document.getElementById('sendButton').addEventListener('click', () => this.sendMessage());
        document.getElementById('messageInput').addEventListener('keydown', (e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                this.sendMessage();
            }
            this.autoResizeInput();
        });
        
        document.getElementById('messageInput').addEventListener('input', () => this.autoResizeInput());
        
        // Voice input (placeholder)
        document.getElementById('voiceInputBtn').addEventListener('click', () => {
            this.showToast('Voice Input', 'Voice input will be available soon');
        });
        
        // Image upload
        document.getElementById('imageUploadBtn').addEventListener('click', () => {
            document.getElementById('imageUpload').click();
        });
        
        document.getElementById('imageUpload').addEventListener('change', (e) => {
            const file = e.target.files[0];
            if (file) {
                this.showToast('Image Upload', 'Image analysis will be available soon');
                e.target.value = '';
            }
        });
        
        // Close modals on overlay click
        document.querySelectorAll('.settings-modal, .tutorial-overlay').forEach(modal => {
            modal.addEventListener('click', (e) => {
                if (e.target === modal) {
                    modal.classList.remove('active');
                }
            });
        });
    }

    // State Management
    saveState() {
        try {
            localStorage.setItem('savoire-state', JSON.stringify({
                user: this.state.user,
                notes: this.state.notes,
                saved: this.state.saved,
                settings: this.state.settings,
                audioVolume: this.state.audioVolume
            }));
        } catch (error) {
            console.error('Failed to save state:', error);
        }
    }

    loadState() {
        try {
            const saved = localStorage.getItem('savoire-state');
            if (saved) {
                const parsed = JSON.parse(saved);
                this.state.user = parsed.user || null;
                this.state.notes = parsed.notes || [];
                this.state.saved = parsed.saved || [];
                this.state.settings = parsed.settings || this.state.settings;
                this.state.audioVolume = parsed.audioVolume || 30;
            }
        } catch (error) {
            console.error('Failed to load state:', error);
        }
    }
}

// Initialize the application
window.savoireAI = new SavoireAI();
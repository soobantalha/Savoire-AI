// app.js - Main Application
class SavoireAI {
    constructor() {
        this.state = {
            user: null,
            outputs: [],
            notes: [],
            sessions: [],
            currentMode: 'explain',
            isProcessing: false,
            workspaceActive: false,
            exportActive: false,
            sessionsActive: false,
            settings: {
                autoNotes: true,
                stepByStep: true,
                examples: true,
                darkTheme: true,
                fontSize: 'medium'
            }
        };

        this.init();
    }

    async init() {
        this.loadState();
        this.initCanvas();
        this.bindEvents();
        this.updateUI();
        
        marked.setOptions({
            gfm: true,
            breaks: true,
            smartLists: true,
            highlight: function(code, lang) {
                if (Prism.languages[lang]) {
                    return Prism.highlight(code, Prism.languages[lang], lang);
                }
                return code;
            }
        });

        setInterval(() => this.saveState(), 30000);
    }

    initCanvas() {
        const canvas = document.getElementById('bgCanvas');
        const ctx = canvas.getContext('2d');
        
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
        
        const particles = [];
        const particleCount = 80;
        
        for (let i = 0; i < particleCount; i++) {
            particles.push({
                x: Math.random() * canvas.width,
                y: Math.random() * canvas.height,
                size: Math.random() * 2 + 0.5,
                speedX: (Math.random() - 0.5) * 0.3,
                speedY: (Math.random() - 0.5) * 0.3,
                color: `hsla(${Math.random() * 60 + 200}, 70%, 60%, ${Math.random() * 0.2 + 0.05})`
            });
        }
        
        const animate = () => {
            ctx.fillStyle = 'rgba(5, 5, 5, 0.05)';
            ctx.fillRect(0, 0, canvas.width, canvas.height);
            
            particles.forEach(particle => {
                particle.x += particle.speedX;
                particle.y += particle.speedY;
                
                if (particle.x < 0) particle.x = canvas.width;
                if (particle.x > canvas.width) particle.x = 0;
                if (particle.y < 0) particle.y = canvas.height;
                if (particle.y > canvas.height) particle.y = 0;
                
                ctx.beginPath();
                ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
                ctx.fillStyle = particle.color;
                ctx.fill();
                
                particles.forEach(otherParticle => {
                    const dx = particle.x - otherParticle.x;
                    const dy = particle.y - otherParticle.y;
                    const distance = Math.sqrt(dx * dx + dy * dy);
                    
                    if (distance < 80) {
                        ctx.beginPath();
                        ctx.moveTo(particle.x, particle.y);
                        ctx.lineTo(otherParticle.x, otherParticle.y);
                        ctx.strokeStyle = `rgba(255, 215, 0, ${0.05 * (1 - distance / 80)})`;
                        ctx.lineWidth = 0.3;
                        ctx.stroke();
                    }
                });
            });
            
            requestAnimationFrame(animate);
        };
        
        animate();
        
        window.addEventListener('resize', () => {
            canvas.width = window.innerWidth;
            canvas.height = window.innerHeight;
        });
    }

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
        
        const text = "Welcome to the Future of Intelligence";
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
        } else {
            this.showToast('Name Required', 'Please enter your name to initialize the system');
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
        this.showToast('Workspace Ready', 'Knowledge processing system initialized');
    }

    async processRequest() {
        const input = document.getElementById('processingInput');
        const request = input.value.trim();
        
        if (!request || this.state.isProcessing) return;
        
        this.state.isProcessing = true;
        this.updateProcessingIndicator(true);
        
        try {
            const response = await fetch('/api/study', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    message: request,
                    mode: this.state.currentMode
                })
            });
            
            const data = await response.json();
            
            if (data.success) {
                this.addOutput(request, data.content, data.notes);
                this.showToast('Processing Complete', 'Knowledge output generated');
            } else {
                this.addOutput(request, data.content, data.notes || []);
                this.showToast('System Note', 'Processing completed with system notes');
            }
            
        } catch (error) {
            console.error('Processing error:', error);
            this.showToast('Processing Error', 'System encountered an issue');
        } finally {
            this.state.isProcessing = false;
            this.updateProcessingIndicator(false);
            input.value = '';
        }
    }

    addOutput(request, content, notes) {
        const output = {
            id: Date.now(),
            request: request,
            content: content,
            notes: notes,
            mode: this.state.currentMode,
            timestamp: new Date().toISOString(),
            html: this.formatOutput(content)
        };
        
        this.state.outputs.unshift(output);
        
        if (this.state.settings.autoNotes && notes.length > 0) {
            notes.forEach(note => {
                if (!this.state.notes.some(n => n.content === note)) {
                    this.state.notes.unshift({
                        id: Date.now(),
                        content: note,
                        source: request.substring(0, 50) + '...',
                        timestamp: new Date().toISOString()
                    });
                }
            });
            
            if (this.state.notes.length > 50) {
                this.state.notes = this.state.notes.slice(0, 50);
            }
        }
        
        if (this.state.outputs.length > 20) {
            this.state.outputs = this.state.outputs.slice(0, 20);
        }
        
        this.renderOutputs();
        this.renderNotes();
        this.saveState();
    }

    formatOutput(content) {
        let html = marked.parse(content);
        
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

    renderOutputs() {
        const container = document.getElementById('outputContainer');
        const countElement = document.getElementById('outputCount');
        const metaElement = document.getElementById('outputMeta');
        
        countElement.textContent = `${this.state.outputs.length} outputs`;
        
        if (this.state.outputs.length === 0) {
            container.innerHTML = `
                <div class="empty-output">
                    <div class="empty-icon">
                        <i class="fas fa-brain"></i>
                    </div>
                    <h3>Knowledge Processing Workspace</h3>
                    <p>Your structured outputs will appear here</p>
                    <div class="empty-hints">
                        <div class="hint-item">
                            <i class="fas fa-cube"></i>
                            <span>Structured breakdowns</span>
                        </div>
                        <div class="hint-item">
                            <i class="fas fa-code"></i>
                            <span>Executable code</span>
                        </div>
                        <div class="hint-item">
                            <i class="fas fa-calculator"></i>
                            <span>Mathematical analysis</span>
                        </div>
                        <div class="hint-item">
                            <i class="fas fa-table"></i>
                            <span>Data visualization</span>
                        </div>
                    </div>
                </div>
            `;
            metaElement.innerHTML = `
                <span class="timestamp">New session</span>
                <span class="length">0 items</span>
            `;
            return;
        }
        
        const latest = this.state.outputs[0];
        metaElement.innerHTML = `
            <span class="timestamp">${new Date(latest.timestamp).toLocaleTimeString()}</span>
            <span class="length">${latest.mode} mode</span>
        `;
        
        container.innerHTML = '';
        
        this.state.outputs.forEach(output => {
            const outputDiv = document.createElement('div');
            outputDiv.className = 'output-item';
            outputDiv.innerHTML = `
                <div class="output-header">
                    <div class="output-meta">
                        <span class="output-mode">${output.mode}</span>
                        <span class="output-time">${new Date(output.timestamp).toLocaleTimeString()}</span>
                    </div>
                    <div class="output-request">
                        <strong>Request:</strong> ${output.request.substring(0, 100)}${output.request.length > 100 ? '...' : ''}
                    </div>
                </div>
                <div class="output-content">
                    ${output.html}
                </div>
                <div class="output-actions">
                    <button class="output-action" onclick="savoireAI.saveOutput('${output.id}')" title="Save">
                        <i class="fas fa-save"></i>
                    </button>
                    <button class="output-action" onclick="savoireAI.copyOutput('${output.id}')" title="Copy">
                        <i class="fas fa-copy"></i>
                    </button>
                </div>
            `;
            container.appendChild(outputDiv);
        });
        
        setTimeout(() => {
            renderMathInElement(container, {
                delimiters: [
                    {left: '$$', right: '$$', display: true},
                    {left: '$', right: '$', display: false}
                ],
                throwOnError: false
            });
            
            Prism.highlightAllUnder(container);
        }, 100);
    }

    renderNotes() {
        const container = document.getElementById('notesContent');
        
        if (this.state.notes.length === 0) {
            container.innerHTML = `
                <div class="empty-notes">
                    <i class="fas fa-lightbulb"></i>
                    <p>Key points will appear here automatically</p>
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
                    ${note.content}
                </div>
                <div class="note-meta">
                    <small>${new Date(note.timestamp).toLocaleTimeString()}</small>
                </div>
            `;
            container.appendChild(noteDiv);
        });
    }

    updateProcessingIndicator(processing) {
        const indicator = document.getElementById('processingIndicator');
        const dot = indicator.querySelector('.indicator-dot');
        const text = indicator.querySelector('span');
        
        if (processing) {
            dot.className = 'indicator-dot processing';
            text.textContent = 'Processing';
        } else {
            dot.className = 'indicator-dot idle';
            text.textContent = 'Idle';
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
        const r = parseInt(hexColor.substr(1, 2), 16);
        const g = parseInt(hexColor.substr(3, 2), 16);
        const b = parseInt(hexColor.substr(5, 2), 16);
        const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
        return luminance > 0.5 ? '#000000' : '#FFFFFF';
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
        });
    }

    saveOutput(outputId) {
        const output = this.state.outputs.find(o => o.id === outputId);
        if (output) {
            this.state.sessions.unshift({
                ...output,
                savedAt: new Date().toISOString()
            });
            
            if (this.state.sessions.length > 50) {
                this.state.sessions = this.state.sessions.slice(0, 50);
            }
            
            this.saveState();
            this.showToast('Output Saved', 'Added to session history');
        }
    }

    copyOutput(outputId) {
        const output = this.state.outputs.find(o => o.id === outputId);
        if (output) {
            const text = `${output.request}\n\n${output.content}`;
            navigator.clipboard.writeText(text).then(() => {
                this.showToast('Copied', 'Output copied to clipboard');
            });
        }
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
        
        setTimeout(() => {
            toast.style.opacity = '0';
            setTimeout(() => toast.remove(), 300);
        }, 5000);
        
        const toasts = container.querySelectorAll('.toast');
        if (toasts.length > 3) {
            toasts[0].remove();
        }
    }

    bindEvents() {
        document.getElementById('startJourneyBtn').addEventListener('click', () => this.handleStartJourney());
        document.getElementById('userNameInput').addEventListener('keypress', (e) => {
            if (e.key === 'Enter') this.handleStartJourney();
        });
        
        document.getElementById('workspaceBtn').addEventListener('click', () => {
            this.state.workspaceActive = true;
            document.getElementById('workspaceModal').classList.add('active');
        });
        
        document.getElementById('exportBtn').addEventListener('click', () => {
            this.state.exportActive = true;
            document.getElementById('exportModal').classList.add('active');
        });
        
        document.getElementById('sessionsBtn').addEventListener('click', () => {
            this.state.sessionsActive = true;
            document.getElementById('sessionsModal').classList.add('active');
            this.renderSessions();
        });
        
        document.getElementById('closeWorkspaceBtn').addEventListener('click', () => {
            this.state.workspaceActive = false;
            document.getElementById('workspaceModal').classList.remove('active');
        });
        
        document.getElementById('closeExportBtn').addEventListener('click', () => {
            this.state.exportActive = false;
            document.getElementById('exportModal').classList.remove('active');
        });
        
        document.getElementById('closeSessionsBtn').addEventListener('click', () => {
            this.state.sessionsActive = false;
            document.getElementById('sessionsModal').classList.remove('active');
        });
        
        document.getElementById('processBtn').addEventListener('click', () => this.processRequest());
        document.getElementById('regenerateBtn').addEventListener('click', () => {
            const input = document.getElementById('processingInput');
            if (input.value.trim()) {
                this.processRequest();
            }
        });
        
        document.getElementById('processingInput').addEventListener('keydown', (e) => {
            if (e.key === 'Enter' && e.ctrlKey) {
                e.preventDefault();
                this.processRequest();
            }
        });
        
        document.querySelectorAll('.mode-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const mode = btn.dataset.mode;
                this.state.currentMode = mode;
                document.querySelectorAll('.mode-btn').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                document.getElementById('currentModeLabel').textContent = `${mode.charAt(0).toUpperCase() + mode.slice(1)} Mode`;
            });
        });
        
        document.getElementById('clearCanvasBtn').addEventListener('click', () => {
            if (confirm('Clear all outputs from workspace?')) {
                this.state.outputs = [];
                this.renderOutputs();
                this.showToast('Workspace Cleared', 'All outputs removed');
            }
        });
        
        document.getElementById('exportNotesBtn').addEventListener('click', () => {
            if (this.state.notes.length === 0) {
                this.showToast('No Notes', 'No notes available to export');
                return;
            }
            
            const notesText = this.state.notes.map(n => `• ${n.content}`).join('\n');
            navigator.clipboard.writeText(notesText).then(() => {
                this.showToast('Notes Exported', 'All notes copied to clipboard');
            });
        });
        
        document.getElementById('generateExportBtn').addEventListener('click', () => {
            this.exportToPDF();
        });
        
        document.querySelectorAll('.modal-content').forEach(modal => {
            modal.addEventListener('click', (e) => e.stopPropagation());
        });
        
        document.querySelectorAll('.settings-modal, .tutorial-overlay, .workspace-modal, .export-modal, .sessions-modal').forEach(modal => {
            modal.addEventListener('click', (e) => {
                if (e.target === modal) {
                    modal.classList.remove('active');
                }
            });
        });
    }

    renderSessions() {
        const container = document.getElementById('sessionsList');
        
        if (this.state.sessions.length === 0) {
            container.innerHTML = `
                <div class="empty-sessions">
                    <i class="fas fa-history"></i>
                    <p>No saved sessions</p>
                    <p class="subtext">Save outputs to create sessions</p>
                </div>
            `;
            return;
        }
        
        container.innerHTML = '';
        this.state.sessions.forEach(session => {
            const sessionDiv = document.createElement('div');
            sessionDiv.className = 'session-item';
            sessionDiv.onclick = () => this.loadSession(session.id);
            sessionDiv.innerHTML = `
                <div class="session-preview">
                    <div class="session-mode">${session.mode}</div>
                    <div class="session-request">${session.request.substring(0, 80)}${session.request.length > 80 ? '...' : ''}</div>
                </div>
                <div class="session-meta">
                    <span>${new Date(session.savedAt).toLocaleDateString()}</span>
                    <span>${session.notes.length} notes</span>
                </div>
            `;
            container.appendChild(sessionDiv);
        });
    }

    loadSession(sessionId) {
        const session = this.state.sessions.find(s => s.id === sessionId);
        if (session) {
            this.state.outputs.unshift(session);
            this.renderOutputs();
            document.getElementById('sessionsModal').classList.remove('active');
            this.showToast('Session Loaded', 'Output restored to workspace');
        }
    }

    async exportToPDF() {
        if (this.state.outputs.length === 0) {
            this.showToast('No Content', 'No outputs available to export');
            return;
        }
        
        try {
            this.showToast('Generating PDF', 'Creating professional document...');
            
            const element = document.createElement('div');
            element.className = 'pdf-export';
            
            element.innerHTML = `
                <div class="pdf-header">
                    <h1>Savoiré AI Knowledge Export</h1>
                    <div class="pdf-meta">
                        <p>Generated on ${new Date().toLocaleString()}</p>
                        <p>User: ${this.state.user?.name || 'Professional User'}</p>
                        <p>System: Savoiré AI Model Ultra v1.2</p>
                    </div>
                    <hr>
                </div>
            `;
            
            this.state.outputs.forEach(output => {
                const outputDiv = document.createElement('div');
                outputDiv.className = 'pdf-output';
                outputDiv.innerHTML = `
                    <div class="pdf-output-header">
                        <h2>${output.mode.charAt(0).toUpperCase() + output.mode.slice(1)} Output</h2>
                        <div class="pdf-output-meta">
                            <span>Request: ${output.request}</span>
                            <span>Generated: ${new Date(output.timestamp).toLocaleString()}</span>
                        </div>
                    </div>
                    <div class="pdf-output-content">
                        ${output.html}
                    </div>
                `;
                element.appendChild(outputDiv);
            });
            
            if (document.getElementById('includeNotesExport').checked && this.state.notes.length > 0) {
                const notesDiv = document.createElement('div');
                notesDiv.className = 'pdf-notes';
                notesDiv.innerHTML = `
                    <h2>Knowledge Notes</h2>
                    ${this.state.notes.map(note => `
                        <div class="pdf-note">
                            <p>${note.content}</p>
                            <small>${new Date(note.timestamp).toLocaleString()}</small>
                        </div>
                    `).join('')}
                `;
                element.appendChild(notesDiv);
            }
            
            if (document.getElementById('includeBranding').checked) {
                const footer = document.createElement('div');
                footer.className = 'pdf-footer';
                footer.innerHTML = `
                    <hr>
                    <div class="pdf-branding">
                        <p>Generated by Savoiré AI v2.0</p>
                        <p>Sooban Talha Technologies</p>
                        <p>https://soobantalhatech.xyz</p>
                    </div>
                `;
                element.appendChild(footer);
            }
            
            const opt = {
                margin: [10, 10, 10, 10],
                filename: `SavoireAI_Export_${Date.now()}.pdf`,
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
            
            this.showToast('Export Complete', 'PDF document downloaded');
            
        } catch (error) {
            console.error('Export error:', error);
            this.showToast('Export Failed', 'Could not generate document');
        }
    }

    updateUI() {
        document.getElementById('autoNotesToggle').checked = this.state.settings.autoNotes;
        document.getElementById('stepByStepToggle').checked = this.state.settings.stepByStep;
        document.getElementById('examplesToggle').checked = this.state.settings.examples;
        
        this.updateUserAvatar();
        this.renderOutputs();
        this.renderNotes();
    }

    saveState() {
        try {
            localStorage.setItem('savoire-state', JSON.stringify({
                user: this.state.user,
                outputs: this.state.outputs,
                notes: this.state.notes,
                sessions: this.state.sessions,
                settings: this.state.settings,
                currentMode: this.state.currentMode
            }));
        } catch (error) {
            console.error('Save error:', error);
        }
    }

    loadState() {
        try {
            const saved = localStorage.getItem('savoire-state');
            if (saved) {
                const parsed = JSON.parse(saved);
                this.state.user = parsed.user || null;
                this.state.outputs = parsed.outputs || [];
                this.state.notes = parsed.notes || [];
                this.state.sessions = parsed.sessions || [];
                this.state.settings = parsed.settings || this.state.settings;
                this.state.currentMode = parsed.currentMode || 'explain';
                
                if (this.state.user) {
                    this.showIntroIfNeeded();
                }
            }
        } catch (error) {
            console.error('Load error:', error);
        }
    }
}

window.savoireAI = new SavoireAI();
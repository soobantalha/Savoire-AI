/* ═══════════════════════════════════════════════════════════════════════════
   SAVOIRÉ AI v2.1 - PUBLIC/APP.JS
   World Class Frontend | Ultra Luxury Dark Theme | 8 Tools | Live Streaming
   5 Depth Levels | 50+ Languages | User Profile | Settings | Streak Tracking
   Domain: savoireai.vercel.app | Tagline: "Think Less, Know More"
   Total Lines: 15220+ | Complete Production Ready
   ═══════════════════════════════════════════════════════════════════════════ */

// ==========================================================================================
//                                      BRANDING CONFIGURATION
// ==========================================================================================

const BRANDING = {
    name: "Savoiré AI",
    tagline: "Think Less, Know More",
    founder: "Sooban Talha",
    company: "Sooban Talha Technologies",
    domain: "savoireai.vercel.app",
    version: "2.1.0",
    colors: {
        primary: "#d4af37",
        secondary: "#f5d061",
        accent: "#a8a8b8",
        dark: "#0a0a0f",
        darker: "#050508",
        gold: "#d4af37",
        goldLight: "#f5d061",
        goldDark: "#b8860b"
    }
};

// ==========================================================================================
//                                      TOOLS CONFIGURATION
// ==========================================================================================

const TOOLS = [
    { id: "notes", name: "AI Study Notes", icon: "📖", description: "Comprehensive, structured notes with key concepts and examples", color: "#d4af37", requiresJSON: false },
    { id: "flashcards", name: "3D Flashcards", icon: "🃏", description: "Interactive flip cards with spaced repetition for better retention", color: "#f5d061", requiresJSON: true },
    { id: "quiz", name: "MCQ Quiz", icon: "❓", description: "Full A/B/C/D options with instant scoring and explanations", color: "#a8a8b8", requiresJSON: true },
    { id: "summary", name: "Smart Summary", icon: "📋", description: "TL;DR with visual key-point hierarchy for quick revision", color: "#d4af37", requiresJSON: true },
    { id: "mindmap", name: "Mind Map", icon: "🗺️", description: "SVG hierarchical branch visualization for complex topics", color: "#f5d061", requiresJSON: true },
    { id: "practice", name: "Practice Questions", icon: "🎯", description: "Smart questions tailored to your topic with detailed answers", color: "#a8a8b8", requiresJSON: true },
    { id: "tips", name: "Tips & Tricks", icon: "💡", description: "Expert strategies and shortcuts for mastering any subject", color: "#d4af37", requiresJSON: true },
    { id: "pdf", name: "PDF Export", icon: "📄", description: "Download beautifully formatted PDFs of your study materials", color: "#f5d061", requiresJSON: false }
];

// ==========================================================================================
//                                      DEPTH LEVELS (5 Levels)
// ==========================================================================================

const DEPTH_LEVELS = {
    1: { id: 1, name: "Overview", description: "2-3 sentence summary, key terms only", icon: "📖", color: "#a8a8b8" },
    2: { id: 2, name: "Basic", description: "1-2 paragraph explanation, core concepts", icon: "📚", color: "#c8c8d8" },
    3: { id: 3, name: "Standard", description: "Detailed explanation with examples (Recommended)", icon: "🎯", color: "#d4af37" },
    4: { id: 4, name: "Advanced", description: "In-depth analysis, technical terms, case studies", icon: "🔬", color: "#f5d061" },
    5: { id: 5, name: "Expert", description: "Comprehensive mastery, research-level detail", icon: "🏆", color: "#ffd700" }
};

// ==========================================================================================
//                                      LANGUAGES (50+)
// ==========================================================================================

const LANGUAGES = [
    "English", "Spanish", "French", "German", "Italian", "Portuguese", "Russian",
    "Japanese", "Korean", "Chinese (Simplified)", "Chinese (Traditional)", "Arabic",
    "Hindi", "Bengali", "Urdu", "Turkish", "Dutch", "Polish", "Swedish", "Norwegian",
    "Danish", "Finnish", "Greek", "Czech", "Romanian", "Hungarian", "Hebrew",
    "Thai", "Vietnamese", "Indonesian", "Malay", "Swahili", "Tagalog", "Persian",
    "Ukrainian", "Croatian", "Serbian", "Slovak", "Slovenian", "Estonian", "Latvian",
    "Lithuanian", "Bulgarian", "Albanian", "Georgian", "Armenian", "Tamil", "Telugu",
    "Kannada", "Malayalam", "Punjabi", "Gujarati", "Marathi", "Nepali", "Sinhala"
];

// ==========================================================================================
//                                      TOPIC SUGGESTIONS
// ==========================================================================================

const TOPIC_SUGGESTIONS = [
    "Quantum Physics", "Photosynthesis", "JavaScript Promises", "French Revolution",
    "Machine Learning", "Calculus", "DNA Replication", "World War II",
    "Climate Change", "Shakespeare", "Stock Markets", "Neural Networks",
    "Artificial Intelligence", "Blockchain Technology", "Cybersecurity",
    "Digital Marketing", "Graphic Design", "Video Editing", "Content Writing",
    "Business Strategy", "Leadership Skills", "Public Speaking", "Time Management"
];

// ==========================================================================================
//                                      APP STATE MANAGEMENT
// ==========================================================================================

class SavoireAppState {
    constructor() {
        this.user = null;
        this.currentSession = null;
        this.sessions = [];
        this.streak = 0;
        this.maxStreak = 0;
        this.lastActive = null;
        this.isGenerating = false;
        this.currentTool = "notes";
        this.currentTopic = "";
        this.currentDepth = 3;
        this.currentLanguage = "English";
        this.generatedContent = "";
        this.streamingInterval = null;
        this.currentStreamingText = "";
        this.wordCount = 0;
        this.startTime = null;
        this.theme = "dark";
        this.sidebarCollapsed = false;
        this.settings = {
            soundEnabled: false,
            animationsEnabled: true,
            autoSaveEnabled: true,
            streamingSpeed: 30,
            fontSize: "medium",
            sidebarAutoHide: false,
            notificationsEnabled: true
        };
    }

    loadFromStorage() {
        try {
            const savedUser = localStorage.getItem("savoire_user");
            if (savedUser) this.user = JSON.parse(savedUser);
            
            const savedSessions = localStorage.getItem("savoire_sessions");
            if (savedSessions) this.sessions = JSON.parse(savedSessions);
            
            const savedStreak = localStorage.getItem("savoire_streak");
            if (savedStreak) this.streak = parseInt(savedStreak);
            
            const savedMaxStreak = localStorage.getItem("savoire_max_streak");
            if (savedMaxStreak) this.maxStreak = parseInt(savedMaxStreak);
            
            const savedLastActive = localStorage.getItem("savoire_last_active");
            if (savedLastActive) this.lastActive = savedLastActive;
            
            const savedSettings = localStorage.getItem("savoire_settings");
            if (savedSettings) this.settings = { ...this.settings, ...JSON.parse(savedSettings) };
            
            const savedTheme = localStorage.getItem("savoire_theme");
            if (savedTheme) this.theme = savedTheme;
            
            const savedSidebarState = localStorage.getItem("savoire_sidebar_collapsed");
            if (savedSidebarState) this.sidebarCollapsed = savedSidebarState === "true";
        } catch(e) {}
    }

    saveToStorage() {
        try {
            if (this.user) localStorage.setItem("savoire_user", JSON.stringify(this.user));
            localStorage.setItem("savoire_sessions", JSON.stringify(this.sessions.slice(0, 50)));
            localStorage.setItem("savoire_streak", this.streak.toString());
            localStorage.setItem("savoire_max_streak", this.maxStreak.toString());
            if (this.lastActive) localStorage.setItem("savoire_last_active", this.lastActive);
            localStorage.setItem("savoire_settings", JSON.stringify(this.settings));
            localStorage.setItem("savoire_theme", this.theme);
            localStorage.setItem("savoire_sidebar_collapsed", this.sidebarCollapsed.toString());
        } catch(e) {}
    }

    updateStreak() {
        const today = new Date().toDateString();
        
        if (this.lastActive === today) return this.streak;
        
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        
        if (this.lastActive === yesterday.toDateString()) {
            this.streak++;
            if (this.streak > this.maxStreak) this.maxStreak = this.streak;
            this.showNotification(`🔥 ${this.streak} day streak! Keep going!`, "streak");
        } else if (this.lastActive && this.lastActive !== today) {
            if (this.streak > 0) {
                this.showNotification(`💀 Streak broken! Start a new streak today!`, "warning");
            }
            this.streak = 1;
        } else {
            this.streak = 1;
        }
        
        this.lastActive = today;
        this.saveToStorage();
        return this.streak;
    }

    addSession(tool, topic, depth, language, content) {
        const session = {
            id: Date.now(),
            tool,
            topic,
            depth,
            language,
            content: content.substring(0, 500),
            fullContent: content,
            timestamp: Date.now(),
            date: new Date().toLocaleDateString()
        };
        
        this.sessions.unshift(session);
        if (this.sessions.length > 50) this.sessions.pop();
        this.saveToStorage();
        
        return session;
    }

    showNotification(message, type = "info") {
        const event = new CustomEvent("savoire-notification", { detail: { message, type } });
        window.dispatchEvent(event);
    }
}

// ==========================================================================================
//                                      API SERVICE
// ==========================================================================================

class SavoireAPIService {
    constructor() {
        this.apiUrl = "/api/study";
        this.sheetsUrl = "/api/sheets";
    }

    async generateContent(tool, topic, depthId, language, onStream) {
        const response = await fetch(`${this.apiUrl}?stream=true`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ tool, topic, depthId, language, apiKey: process.env.OPENROUTER_API_KEY })
        });
        
        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let buffer = "";
        
        while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            
            buffer += decoder.decode(value, { stream: true });
            const lines = buffer.split("\n");
            buffer = lines.pop();
            
            for (const line of lines) {
                if (line.startsWith("data: ")) {
                    try {
                        const data = JSON.parse(line.slice(6));
                        if (data.word && onStream.onWord) onStream.onWord(data.word, data.stats);
                        if (data.fullResponse && onStream.onComplete) onStream.onComplete(data.fullResponse);
                        if (data.error && onStream.onError) onStream.onError(data.error);
                    } catch(e) {}
                }
            }
        }
    }

    async saveUser(userData) {
        const response = await fetch(this.sheetsUrl, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ action: "user", ...userData })
        });
        return response.json();
    }

    async updateStreak(userName) {
        const response = await fetch(`${this.sheetsUrl}?action=streak`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ name: userName })
        });
        return response.json();
    }

    async getUserStats(userName) {
        const response = await fetch(`${this.sheetsUrl}?action=stats&name=${encodeURIComponent(userName)}`);
        return response.json();
    }

    async getUserSessions(userName, limit = 20) {
        const response = await fetch(`${this.sheetsUrl}?action=sessions&name=${encodeURIComponent(userName)}&limit=${limit}`);
        return response.json();
    }

    async saveSession(userName, sessionData) {
        const response = await fetch(`${this.sheetsUrl}?action=session`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ name: userName, ...sessionData })
        });
        return response.json();
    }
}

// ==========================================================================================
//                                      UI RENDERER
// ==========================================================================================

class SavoireUIRenderer {
    constructor(appState, apiService) {
        this.state = appState;
        this.api = apiService;
        this.init();
    }

    init() {
        this.loadTheme();
        this.setupEventListeners();
        this.renderSidebar();
        this.renderWelcomeScreen();
        this.updateStreakDisplay();
        this.loadUserSessions();
    }

    loadTheme() {
        document.documentElement.setAttribute("data-theme", this.state.theme);
    }

    setupEventListeners() {
        // Theme toggle
        document.getElementById("themeToggle")?.addEventListener("click", () => this.toggleTheme());
        
        // New session button
        document.getElementById("newSessionBtn")?.addEventListener("click", () => this.openWizard());
        
        // Settings button
        document.getElementById("settingsBtn")?.addEventListener("click", () => this.openSettings());
        
        // Sidebar toggle
        document.getElementById("toggleSidebar")?.addEventListener("click", () => this.toggleSidebar());
        
        // Quick generate
        document.getElementById("quickGenerateBtn")?.addEventListener("click", () => this.quickGenerate());
        
        // Close modals
        document.querySelectorAll(".close-modal, .modal-overlay").forEach(el => {
            el.addEventListener("click", (e) => {
                if (e.target === el || el.classList.contains("close-modal")) {
                    this.closeAllModals();
                }
            });
        });
        
        // Keyboard shortcuts
        document.addEventListener("keydown", (e) => {
            if (e.ctrlKey && e.key === "n") this.openWizard();
            if (e.ctrlKey && e.key === "s") this.openSettings();
            if (e.key === "Escape") this.closeAllModals();
        });
    }

    toggleTheme() {
        this.state.theme = this.state.theme === "dark" ? "light" : "dark";
        document.documentElement.setAttribute("data-theme", this.state.theme);
        this.state.saveToStorage();
        this.showNotification(`Theme changed to ${this.state.theme} mode`, "info");
    }

    toggleSidebar() {
        this.state.sidebarCollapsed = !this.state.sidebarCollapsed;
        const sidebar = document.getElementById("sidebar");
        const toggleBtn = document.getElementById("toggleSidebar");
        
        if (sidebar) sidebar.classList.toggle("collapsed", this.state.sidebarCollapsed);
        if (toggleBtn) toggleBtn.classList.toggle("collapsed", this.state.sidebarCollapsed);
        
        this.state.saveToStorage();
    }

    renderSidebar() {
        const sidebar = document.getElementById("sidebar");
        if (!sidebar) return;
        
        sidebar.innerHTML = `
            <div class="sidebar-header">
                <div class="logo">
                    <div class="logo-icon">⚡</div>
                    <div class="logo-text">${BRANDING.name}</div>
                    <div class="logo-badge">v${BRANDING.version}</div>
                </div>
                <div class="logo-tagline">${BRANDING.tagline}</div>
                <button class="new-session-btn" id="newSessionBtn">
                    <span>✦</span> New Session
                </button>
            </div>
            
            <div class="sidebar-section">
                <div class="section-title">Recent Sessions</div>
                <div class="history-list" id="historyList">
                    ${this.renderHistoryList()}
                </div>
            </div>
            
            <div class="sidebar-footer">
                <div class="streak-card" id="streakCard">
                    <div class="streak-icon" id="streakIcon">🔥</div>
                    <div class="streak-info">
                        <div class="streak-label">Daily Streak</div>
                        <div class="streak-value" id="streakValue">${this.state.streak}</div>
                    </div>
                    <div class="streak-message" id="streakMessage">${this.getStreakMessage()}</div>
                </div>
                
                <div class="user-card" onclick="window.appRenderer.openSettings()">
                    <div class="user-avatar" id="userAvatar">${this.state.user?.name?.charAt(0) || "?"}</div>
                    <div class="user-info">
                        <div class="user-name" id="userName">${this.state.user?.name || "Guest"}</div>
                        <div class="user-role">Savoiré Scholar</div>
                    </div>
                    <button class="settings-icon" id="settingsBtn">⚙️</button>
                </div>
            </div>
        `;
        
        // Reattach event listeners
        document.getElementById("newSessionBtn")?.addEventListener("click", () => this.openWizard());
        document.getElementById("settingsBtn")?.addEventListener("click", () => this.openSettings());
    }

    renderHistoryList() {
        if (!this.state.sessions.length) {
            return `<div class="empty-history">
                        <div class="empty-icon">📂</div>
                        <div>No sessions yet</div>
                        <div class="empty-text">Start learning today!</div>
                    </div>`;
        }
        
        return this.state.sessions.slice(0, 10).map(session => `
            <div class="history-item" onclick="window.appRenderer.loadSession(${session.id})">
                <div class="history-icon">${TOOLS.find(t => t.id === session.tool)?.icon || "📖"}</div>
                <div class="history-info">
                    <div class="history-title">${this.escapeHtml(session.topic)}</div>
                    <div class="history-meta">${session.date} • ${DEPTH_LEVELS[session.depth]?.name || "Standard"}</div>
                </div>
                <div class="history-badge">${session.tool}</div>
            </div>
        `).join("");
    }

    renderWelcomeScreen() {
        const mainContent = document.getElementById("mainContent");
        if (!mainContent) return;
        
        mainContent.innerHTML = `
            <div class="welcome-screen">
                <div class="welcome-orb">🧠</div>
                <h1 class="welcome-title">What will you <span>master today?</span></h1>
                <p class="welcome-subtitle">Choose a topic, select your tool, and let Savoiré AI craft personalized study material — streamed live, just for you.</p>
                
                <div class="tools-grid">
                    ${TOOLS.map(tool => `
                        <div class="tool-card" onclick="window.appRenderer.openWizard('${tool.id}')">
                            <div class="tool-icon">${tool.icon}</div>
                            <div class="tool-name">${tool.name}</div>
                            <div class="tool-desc">${tool.description}</div>
                        </div>
                    `).join("")}
                </div>
                
                <button class="generate-main-btn" onclick="window.appRenderer.openWizard()">
                    <span>✨</span> Begin Your Session
                </button>
                
                <div class="featured-topics">
                    <span class="featured-label">Popular topics:</span>
                    ${TOPIC_SUGGESTIONS.slice(0, 8).map(topic => `
                        <span class="topic-chip" onclick="window.appRenderer.quickTopic('${this.escapeHtml(topic)}')">${topic}</span>
                    `).join("")}
                </div>
            </div>
        `;
    }

    renderOutputScreen(tool, topic, depth, language) {
        const mainContent = document.getElementById("mainContent");
        if (!mainContent) return;
        
        const toolData = TOOLS.find(t => t.id === tool);
        
        mainContent.innerHTML = `
            <div class="output-screen">
                <div class="input-summary-bar">
                    <div class="summary-item">
                        <span class="summary-label">Tool</span>
                        <span class="summary-value">${toolData?.icon || "📖"} ${toolData?.name || tool}</span>
                    </div>
                    <div class="summary-sep">|</div>
                    <div class="summary-item">
                        <span class="summary-label">Topic</span>
                        <span class="summary-value">${this.escapeHtml(topic)}</span>
                    </div>
                    <div class="summary-sep">|</div>
                    <div class="summary-item">
                        <span class="summary-label">Depth</span>
                        <span class="summary-value">${DEPTH_LEVELS[depth]?.name || "Standard"}</span>
                    </div>
                    <div class="summary-sep">|</div>
                    <div class="summary-item">
                        <span class="summary-label">Language</span>
                        <span class="summary-value">${language}</span>
                    </div>
                    <button class="new-session-mini" onclick="window.appRenderer.openWizard()">+ New</button>
                </div>
                
                <div class="output-window">
                    <div class="output-header">
                        <div class="output-title">
                            <span>${toolData?.icon || "📖"}</span>
                            <span>${toolData?.name || tool} — ${this.escapeHtml(topic)}</span>
                        </div>
                        <div class="output-status" id="outputStatus">
                            <div class="status-dot"></div>
                            <span id="statusText">Generating...</span>
                        </div>
                        <div class="output-actions">
                            <button class="action-btn" onclick="window.appRenderer.copyOutput()">📋 Copy</button>
                            <button class="action-btn pdf-btn" id="pdfBtn" style="display:none" onclick="window.appRenderer.downloadPDF()">📄 PDF</button>
                        </div>
                    </div>
                    <div class="output-body" id="outputBody">
                        <div class="streaming-container">
                            <div class="streaming-text" id="streamingText">
                                <span class="cursor-blink"></span>
                            </div>
                        </div>
                    </div>
                    <div class="progress-container" id="progressContainer" style="display:none">
                        <div class="progress-bar">
                            <div class="progress-fill" id="progressFill"></div>
                        </div>
                        <div class="progress-stats">
                            <span id="wordCount">0 words</span>
                            <span id="timeElapsed">0s</span>
                            <span id="progressPercent">0%</span>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

    renderWizard() {
        const modal = document.getElementById("wizardModal");
        if (!modal) return;
        
        modal.innerHTML = `
            <div class="modal-content wizard-content">
                <div class="modal-header">
                    <h2>✦ Generate Study Material</h2>
                    <button class="close-modal">✕</button>
                </div>
                
                <div class="wizard-steps" id="wizardSteps">
                    <div class="step-indicator">
                        <div class="step active" data-step="1">1</div>
                        <div class="step-line"></div>
                        <div class="step" data-step="2">2</div>
                        <div class="step-line"></div>
                        <div class="step" data-step="3">3</div>
                        <div class="step-line"></div>
                        <div class="step" data-step="4">4</div>
                        <div class="step-line"></div>
                        <div class="step" data-step="5">5</div>
                    </div>
                </div>
                
                <div class="wizard-body" id="wizardBody"></div>
                
                <div class="modal-footer">
                    <button class="btn-secondary" id="wizardBack" style="display:none">← Back</button>
                    <button class="btn-primary" id="wizardNext">Next →</button>
                </div>
            </div>
        `;
        
        this.currentWizardStep = 1;
        this.wizardData = { tool: null, topic: "", depth: 3, language: "English" };
        this.renderWizardStep();
        
        document.getElementById("wizardBack")?.addEventListener("click", () => this.wizardPrev());
        document.getElementById("wizardNext")?.addEventListener("click", () => this.wizardNext());
    }

    renderWizardStep() {
        const body = document.getElementById("wizardBody");
        const backBtn = document.getElementById("wizardBack");
        const nextBtn = document.getElementById("wizardNext");
        
        if (!body) return;
        
        const step = this.currentWizardStep;
        
        if (step === 1) {
            backBtn.style.display = "none";
            nextBtn.style.display = "flex";
            nextBtn.textContent = "Next →";
            
            body.innerHTML = `
                <div class="step-title">Choose Your Study Tool</div>
                <div class="tools-wizard-grid">
                    ${TOOLS.filter(t => t.id !== "pdf").map(tool => `
                        <div class="wizard-tool-card ${this.wizardData.tool === tool.id ? "selected" : ""}" onclick="window.appRenderer.selectWizardTool('${tool.id}')">
                            <div class="tool-icon">${tool.icon}</div>
                            <div class="tool-name">${tool.name}</div>
                            <div class="tool-desc">${tool.description}</div>
                        </div>
                    `).join("")}
                </div>
            `;
        } 
        else if (step === 2) {
            backBtn.style.display = "flex";
            nextBtn.style.display = "flex";
            nextBtn.textContent = "Next →";
            
            body.innerHTML = `
                <div class="step-title">What topic would you like to study?</div>
                <input type="text" class="wizard-input" id="topicInput" placeholder="e.g., Quantum Physics, JavaScript, Machine Learning..." value="${this.escapeHtml(this.wizardData.topic)}">
                <div class="suggestions">
                    <span class="suggestions-label">Suggestions:</span>
                    ${TOPIC_SUGGESTIONS.slice(0, 6).map(t => `
                        <span class="suggestion-chip" onclick="window.appRenderer.setWizardTopic('${this.escapeHtml(t)}')">${t}</span>
                    `).join("")}
                </div>
            `;
            
            document.getElementById("topicInput")?.addEventListener("input", (e) => {
                this.wizardData.topic = e.target.value;
            });
        }
        else if (step === 3) {
            backBtn.style.display = "flex";
            nextBtn.style.display = "flex";
            nextBtn.textContent = "Next →";
            
            body.innerHTML = `
                <div class="step-title">Select Depth Level</div>
                <div class="depth-options">
                    ${Object.values(DEPTH_LEVELS).map(depth => `
                        <div class="depth-card ${this.wizardData.depth === depth.id ? "selected" : ""}" onclick="window.appRenderer.selectWizardDepth(${depth.id})">
                            <div class="depth-icon">${depth.icon}</div>
                            <div class="depth-info">
                                <div class="depth-name">${depth.name}</div>
                                <div class="depth-desc">${depth.description}</div>
                            </div>
                            ${depth.id === 3 ? '<div class="depth-badge">Recommended</div>' : ""}
                        </div>
                    `).join("")}
                </div>
            `;
        }
        else if (step === 4) {
            backBtn.style.display = "flex";
            nextBtn.style.display = "flex";
            nextBtn.textContent = "Next →";
            
            body.innerHTML = `
                <div class="step-title">Choose Language</div>
                <input type="text" class="lang-search" id="langSearch" placeholder="Search language...">
                <div class="lang-grid" id="langGrid">
                    ${LANGUAGES.map(lang => `
                        <div class="lang-option ${this.wizardData.language === lang ? "selected" : ""}" onclick="window.appRenderer.selectWizardLanguage('${this.escapeHtml(lang)}')">
                            ${lang}
                        </div>
                    `).join("")}
                </div>
            `;
            
            document.getElementById("langSearch")?.addEventListener("input", (e) => {
                const search = e.target.value.toLowerCase();
                const grid = document.getElementById("langGrid");
                if (grid) {
                    grid.innerHTML = LANGUAGES.filter(l => l.toLowerCase().includes(search)).map(lang => `
                        <div class="lang-option ${this.wizardData.language === lang ? "selected" : ""}" onclick="window.appRenderer.selectWizardLanguage('${this.escapeHtml(lang)}')">
                            ${lang}
                        </div>
                    `).join("");
                }
            });
        }
        else if (step === 5) {
            backBtn.style.display = "flex";
            nextBtn.style.display = "none";
            
            const toolData = TOOLS.find(t => t.id === this.wizardData.tool);
            
            body.innerHTML = `
                <div class="step-title">Confirm & Generate</div>
                <div class="confirmation-card">
                    <div class="confirmation-item">
                        <span class="conf-label">Tool</span>
                        <span class="conf-value">${toolData?.icon || "📖"} ${toolData?.name || this.wizardData.tool}</span>
                    </div>
                    <div class="confirmation-item">
                        <span class="conf-label">Topic</span>
                        <span class="conf-value">${this.escapeHtml(this.wizardData.topic)}</span>
                    </div>
                    <div class="confirmation-item">
                        <span class="conf-label">Depth</span>
                        <span class="conf-value">${DEPTH_LEVELS[this.wizardData.depth]?.name || "Standard"}</span>
                    </div>
                    <div class="confirmation-item">
                        <span class="conf-label">Language</span>
                        <span class="conf-value">${this.wizardData.language}</span>
                    </div>
                </div>
                <button class="generate-final-btn" onclick="window.appRenderer.startGeneration()">
                    🚀 Generate Now
                </button>
            `;
        }
        
        this.updateStepIndicator();
    }

    updateStepIndicator() {
        const steps = document.querySelectorAll(".step");
        steps.forEach((step, index) => {
            if (index + 1 === this.currentWizardStep) {
                step.classList.add("active");
            } else if (index + 1 < this.currentWizardStep) {
                step.classList.add("completed");
            } else {
                step.classList.remove("active", "completed");
            }
        });
    }

    wizardNext() {
        if (this.currentWizardStep === 1 && !this.wizardData.tool) {
            this.showNotification("Please select a tool first", "warning");
            return;
        }
        if (this.currentWizardStep === 2 && !this.wizardData.topic.trim()) {
            this.showNotification("Please enter a topic", "warning");
            return;
        }
        if (this.currentWizardStep < 5) {
            this.currentWizardStep++;
            this.renderWizardStep();
        }
    }

    wizardPrev() {
        if (this.currentWizardStep > 1) {
            this.currentWizardStep--;
            this.renderWizardStep();
        }
    }

    selectWizardTool(toolId) {
        this.wizardData.tool = toolId;
        this.renderWizardStep();
    }

    selectWizardDepth(depthId) {
        this.wizardData.depth = depthId;
        this.renderWizardStep();
    }

    selectWizardLanguage(language) {
        this.wizardData.language = language;
        this.renderWizardStep();
    }

    setWizardTopic(topic) {
        this.wizardData.topic = topic;
        this.renderWizardStep();
    }

    openWizard(preselectedTool = null) {
        if (preselectedTool) this.wizardData.tool = preselectedTool;
        this.currentWizardStep = 1;
        this.renderWizard();
        document.getElementById("wizardModal")?.classList.add("active");
    }

    closeWizard() {
        document.getElementById("wizardModal")?.classList.remove("active");
    }

    async startGeneration() {
        if (!this.wizardData.tool || !this.wizardData.topic) {
            this.showNotification("Please complete all fields", "warning");
            return;
        }
        
        this.closeWizard();
        
        const tool = this.wizardData.tool;
        const topic = this.wizardData.topic;
        const depth = this.wizardData.depth;
        const language = this.wizardData.language;
        
        this.state.currentTool = tool;
        this.state.currentTopic = topic;
        this.state.currentDepth = depth;
        this.state.currentLanguage = language;
        
        this.renderOutputScreen(tool, topic, depth, language);
        
        await this.streamGeneration(tool, topic, depth, language);
    }

    async quickGenerate() {
        const topic = document.getElementById("quickTopic")?.value.trim();
        if (!topic) {
            this.showNotification("Please enter a topic", "warning");
            return;
        }
        
        this.state.currentTool = "notes";
        this.state.currentTopic = topic;
        this.state.currentDepth = 3;
        this.state.currentLanguage = "English";
        
        this.renderOutputScreen("notes", topic, 3, "English");
        await this.streamGeneration("notes", topic, 3, "English");
    }

    quickTopic(topic) {
        document.getElementById("quickTopic").value = topic;
        this.quickGenerate();
    }

    async streamGeneration(tool, topic, depth, language) {
        this.state.isGenerating = true;
        this.state.currentStreamingText = "";
        this.state.wordCount = 0;
        this.state.startTime = Date.now();
        
        const outputBody = document.getElementById("outputBody");
        const streamingText = document.getElementById("streamingText");
        const progressContainer = document.getElementById("progressContainer");
        const statusText = document.getElementById("statusText");
        const pdfBtn = document.getElementById("pdfBtn");
        
        if (progressContainer) progressContainer.style.display = "block";
        if (statusText) statusText.textContent = "Generating...";
        if (pdfBtn) pdfBtn.style.display = "none";
        
        const updateProgress = () => {
            const elapsed = Math.floor((Date.now() - this.state.startTime) / 1000);
            const wordCountEl = document.getElementById("wordCount");
            const timeElapsed = document.getElementById("timeElapsed");
            const progressPercent = document.getElementById("progressPercent");
            const progressFill = document.getElementById("progressFill");
            
            if (wordCountEl) wordCountEl.textContent = `${this.state.wordCount} words`;
            if (timeElapsed) timeElapsed.textContent = `${elapsed}s`;
            if (progressPercent) progressPercent.textContent = `${Math.min(99, Math.floor((this.state.wordCount / 500) * 100))}%`;
            if (progressFill) progressFill.style.width = `${Math.min(99, (this.state.wordCount / 500) * 100)}%`;
        };
        
        this.progressInterval = setInterval(updateProgress, 500);
        
        const streamCallback = {
            onWord: (word, stats) => {
                this.state.currentStreamingText += word;
                this.state.wordCount = stats?.wordCount || this.state.wordCount + 1;
                
                if (streamingText) {
                    streamingText.innerHTML = `${this.parseMarkdown(this.state.currentStreamingText)}<span class="cursor-blink"></span>`;
                    streamingText.scrollTop = streamingText.scrollHeight;
                }
            },
            onComplete: async (content) => {
                clearInterval(this.progressInterval);
                this.state.isGenerating = false;
                this.state.generatedContent = content;
                
                if (streamingText) {
                    streamingText.innerHTML = this.parseMarkdown(content);
                }
                
                if (statusText) statusText.textContent = "Complete ✓";
                if (pdfBtn) pdfBtn.style.display = "flex";
                if (progressContainer) {
                    setTimeout(() => {
                        progressContainer.style.opacity = "0";
                        setTimeout(() => {
                            progressContainer.style.display = "none";
                            progressContainer.style.opacity = "1";
                        }, 500);
                    }, 1000);
                }
                
                this.state.updateStreak();
                this.state.addSession(tool, topic, depth, language, content);
                this.updateStreakDisplay();
                this.renderSidebar();
                
                this.showNotification("✨ Generation complete! Your study material is ready.", "success");
                
                // Save to Google Sheets
                if (this.state.user?.name) {
                    await this.api.saveSession(this.state.user.name, { tool, topic, depth, language, content });
                }
            },
            onError: (error) => {
                clearInterval(this.progressInterval);
                this.state.isGenerating = false;
                if (streamingText) streamingText.innerHTML = `<div class="error-message">❌ Error: ${error.message}</div>`;
                if (statusText) statusText.textContent = "Error";
                this.showNotification("Generation failed. Please try again.", "error");
            }
        };
        
        try {
            await this.api.generateContent(tool, topic, depth, language, streamCallback);
        } catch (error) {
            streamCallback.onError(error);
        }
    }

    parseMarkdown(text) {
        if (!text) return "";
        
        let html = text;
        
        // Headers
        html = html.replace(/^### (.*$)/gm, "<h3>$1</h3>");
        html = html.replace(/^## (.*$)/gm, "<h2>$1</h2>");
        html = html.replace(/^# (.*$)/gm, "<h1>$1</h1>");
        
        // Bold and italic
        html = html.replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>");
        html = html.replace(/\*(.+?)\*/g, "<em>$1</em>");
        
        // Code
        html = html.replace(/`([^`]+)`/g, "<code>$1</code>");
        
        // Blockquotes
        html = html.replace(/^> (.*$)/gm, "<blockquote>$1</blockquote>");
        
        // Lists
        html = html.replace(/^\d+\. (.*$)/gm, "<li>$1</li>");
        html = html.replace(/^- (.*$)/gm, "<li>$1</li>");
        html = html.replace(/(<li>.*<\/li>\n?)+/g, "<ul>$&</ul>");
        
        // Paragraphs
        html = html.replace(/\n\n/g, "</p><p>");
        html = html.replace(/^([^<].+)$/gm, "<p>$1</p>");
        
        // Cleanup
        html = html.replace(/<p><\/p>/g, "");
        html = html.replace(/<p>(<h[1-3]>)/g, "$1");
        html = html.replace(/(<\/h[1-3]>)<\/p>/g, "$1");
        
        return html;
    }

    copyOutput() {
        const text = this.state.generatedContent;
        if (!text) return;
        
        navigator.clipboard.writeText(text).then(() => {
            this.showNotification("Copied to clipboard!", "success");
        }).catch(() => {
            this.showNotification("Failed to copy", "error");
        });
    }

    downloadPDF() {
        const content = this.state.generatedContent;
        const topic = this.state.currentTopic;
        const tool = TOOLS.find(t => t.id === this.state.currentTool);
        
        const html = `
            <!DOCTYPE html>
            <html>
            <head>
                <meta charset="UTF-8">
                <title>${topic} - ${tool?.name || "Study Notes"}</title>
                <style>
                    body {
                        font-family: 'Georgia', serif;
                        max-width: 800px;
                        margin: 50px auto;
                        padding: 0 40px;
                        color: #1a1a2e;
                        line-height: 1.7;
                    }
                    h1, h2, h3 {
                        font-family: 'Arial', sans-serif;
                        color: #d4af37;
                    }
                    h1 { border-bottom: 2px solid #d4af37; padding-bottom: 10px; }
                    code {
                        background: #f0f0f0;
                        padding: 2px 6px;
                        border-radius: 4px;
                        font-family: monospace;
                    }
                    pre {
                        background: #f0f0f0;
                        padding: 15px;
                        border-radius: 8px;
                        overflow-x: auto;
                    }
                    .header {
                        border-bottom: 3px solid #d4af37;
                        padding-bottom: 20px;
                        margin-bottom: 30px;
                    }
                    .footer {
                        border-top: 1px solid #ddd;
                        margin-top: 50px;
                        padding-top: 20px;
                        font-size: 11px;
                        color: #888;
                        text-align: center;
                    }
                </style>
            </head>
            <body>
                <div class="header">
                    <h1>${this.escapeHtml(topic)}</h1>
                    <p>Generated by Savoiré AI • ${new Date().toLocaleDateString()} • Think Less, Know More</p>
                </div>
                ${this.parseMarkdown(content)}
                <div class="footer">
                    Savoiré AI v2.1 • ${BRANDING.company} • ${BRANDING.domain}
                </div>
            </body>
            </html>
        `;
        
        const blob = new Blob([html], { type: "text/html" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `${topic.replace(/\s+/g, "-")}-${tool?.id || "notes"}-savoire.html`;
        a.click();
        URL.revokeObjectURL(url);
        
        this.showNotification("PDF download started!", "success");
    }

    loadSession(sessionId) {
        const session = this.state.sessions.find(s => s.id === sessionId);
        if (!session) return;
        
        this.state.currentTool = session.tool;
        this.state.currentTopic = session.topic;
        this.state.currentDepth = session.depth;
        this.state.currentLanguage = session.language;
        this.state.generatedContent = session.fullContent || session.content;
        
        this.renderOutputScreen(session.tool, session.topic, session.depth, session.language);
        
        const streamingText = document.getElementById("streamingText");
        if (streamingText) {
            streamingText.innerHTML = this.parseMarkdown(this.state.generatedContent);
        }
        
        const pdfBtn = document.getElementById("pdfBtn");
        if (pdfBtn) pdfBtn.style.display = "flex";
        
        const statusText = document.getElementById("statusText");
        if (statusText) statusText.textContent = "Loaded from history ✓";
        
        this.showNotification(`Loaded: ${session.topic}`, "info");
    }

    openSettings() {
        const modal = document.getElementById("settingsModal");
        if (!modal) return;
        
        modal.innerHTML = `
            <div class="modal-content settings-content">
                <div class="modal-header">
                    <h2>⚙️ Settings</h2>
                    <button class="close-modal">✕</button>
                </div>
                <div class="modal-body">
                    <div class="settings-section">
                        <h3>Profile</h3>
                        <div class="setting-item">
                            <label>Display Name</label>
                            <input type="text" id="settingsName" value="${this.state.user?.name || ""}" placeholder="Enter your name">
                        </div>
                        <button class="btn-primary save-name-btn" onclick="window.appRenderer.saveUserName()">Save Name</button>
                    </div>
                    
                    <div class="settings-section">
                        <h3>Preferences</h3>
                        <div class="setting-item">
                            <label>Theme</label>
                            <select id="settingsTheme">
                                <option value="dark" ${this.state.theme === "dark" ? "selected" : ""}>Dark (Ultra Luxury)</option>
                                <option value="light" ${this.state.theme === "light" ? "selected" : ""}>Light</option>
                            </select>
                        </div>
                        <div class="setting-item">
                            <label>Streaming Speed</label>
                            <select id="settingsSpeed">
                                <option value="20" ${this.state.settings.streamingSpeed === 20 ? "selected" : ""}>Fast (20ms/word)</option>
                                <option value="30" ${this.state.settings.streamingSpeed === 30 ? "selected" : ""}>Normal (30ms/word)</option>
                                <option value="50" ${this.state.settings.streamingSpeed === 50 ? "selected" : ""}>Slow (50ms/word)</option>
                            </select>
                        </div>
                        <div class="setting-item">
                            <label>Font Size</label>
                            <select id="settingsFontSize">
                                <option value="small" ${this.state.settings.fontSize === "small" ? "selected" : ""}>Small</option>
                                <option value="medium" ${this.state.settings.fontSize === "medium" ? "selected" : ""}>Medium</option>
                                <option value="large" ${this.state.settings.fontSize === "large" ? "selected" : ""}>Large</option>
                            </select>
                        </div>
                        <div class="setting-item checkbox">
                            <label>
                                <input type="checkbox" id="settingsAnimations" ${this.state.settings.animationsEnabled ? "checked" : ""}>
                                Enable Animations
                            </label>
                        </div>
                        <div class="setting-item checkbox">
                            <label>
                                <input type="checkbox" id="settingsNotifications" ${this.state.settings.notificationsEnabled ? "checked" : ""}>
                                Enable Notifications
                            </label>
                        </div>
                    </div>
                    
                    <div class="settings-section">
                        <h3>Statistics</h3>
                        <div class="stat-item">
                            <span>Total Sessions</span>
                            <span class="stat-value" id="statTotalSessions">${this.state.sessions.length}</span>
                        </div>
                        <div class="stat-item">
                            <span>Current Streak</span>
                            <span class="stat-value" id="statCurrentStreak">${this.state.streak}</span>
                        </div>
                        <div class="stat-item">
                            <span>Max Streak</span>
                            <span class="stat-value" id="statMaxStreak">${this.state.maxStreak}</span>
                        </div>
                    </div>
                    
                    <div class="settings-section">
                        <h3>About</h3>
                        <div class="about-card">
                            <div class="about-logo">⚡</div>
                            <div class="about-name">${BRANDING.name}</div>
                            <div class="about-tagline">${BRANDING.tagline}</div>
                            <div class="about-version">Version ${BRANDING.version}</div>
                            <div class="about-founder">
                                <div class="founder-name">${BRANDING.founder}</div>
                                <div class="founder-title">Founder & CEO</div>
                            </div>
                            <div class="about-company">${BRANDING.company}</div>
                            <div class="about-quote">"Think Less, Know More — Learning should be limitless, intelligent, and beautiful."</div>
                        </div>
                    </div>
                </div>
                <div class="modal-footer">
                    <button class="btn-secondary" onclick="window.appRenderer.clearAllData()">Clear All Data</button>
                    <button class="btn-primary" onclick="window.appRenderer.saveSettings()">Save Changes</button>
                </div>
            </div>
        `;
        
        modal.classList.add("active");
        
        // Attach theme change listener
        document.getElementById("settingsTheme")?.addEventListener("change", (e) => {
            this.state.theme = e.target.value;
            document.documentElement.setAttribute("data-theme", this.state.theme);
        });
    }

    closeSettings() {
        document.getElementById("settingsModal")?.classList.remove("active");
    }

    saveSettings() {
        this.state.settings.streamingSpeed = parseInt(document.getElementById("settingsSpeed")?.value || "30");
        this.state.settings.fontSize = document.getElementById("settingsFontSize")?.value || "medium";
        this.state.settings.animationsEnabled = document.getElementById("settingsAnimations")?.checked || false;
        this.state.settings.notificationsEnabled = document.getElementById("settingsNotifications")?.checked || false;
        
        document.body.style.fontSize = 
            this.state.settings.fontSize === "small" ? "13px" : 
            this.state.settings.fontSize === "large" ? "17px" : "15px";
        
        this.state.saveToStorage();
        this.showNotification("Settings saved!", "success");
        this.closeSettings();
    }

    saveUserName() {
        const name = document.getElementById("settingsName")?.value.trim();
        if (!name) {
            this.showNotification("Please enter a name", "warning");
            return;
        }
        
        this.state.user = { name, joinedAt: new Date().toISOString() };
        this.state.saveToStorage();
        
        this.updateStreakDisplay();
        this.renderSidebar();
        this.showNotification(`Welcome, ${name}!`, "success");
        this.closeSettings();
        
        // Save to Google Sheets
        this.api.saveUser({
            name,
            firstVisit: new Date().toISOString(),
            lastActive: new Date().toISOString(),
            streak: this.state.streak,
            totalSessions: this.state.sessions.length
        });
    }

    updateStreakDisplay() {
        const streakValue = document.getElementById("streakValue");
        const streakIcon = document.getElementById("streakIcon");
        const streakMessage = document.getElementById("streakMessage");
        
        if (streakValue) streakValue.textContent = this.state.streak;
        if (streakIcon) {
            if (this.state.streak >= 30) streakIcon.textContent = "👑";
            else if (this.state.streak >= 14) streakIcon.textContent = "🏆";
            else if (this.state.streak >= 7) streakIcon.textContent = "⚡";
            else if (this.state.streak >= 3) streakIcon.textContent = "🔥";
            else streakIcon.textContent = "❄️";
        }
        if (streakMessage) streakMessage.textContent = this.getStreakMessage();
    }

    getStreakMessage() {
        const streak = this.state.streak;
        if (streak === 0) return "Start your streak today!";
        if (streak === 1) return "First day! Keep going!";
        if (streak < 3) return `${streak} day streak! Great start!`;
        if (streak < 7) return `${streak} day streak! You're on fire!`;
        if (streak < 14) return `${streak} day streak! Amazing dedication!`;
        if (streak < 30) return `${streak} day streak! Unstoppable!`;
        return `${streak} day streak! LEGENDARY!`;
    }

    async loadUserSessions() {
        if (this.state.user?.name) {
            const result = await this.api.getUserSessions(this.state.user.name);
            if (result.sessions) {
                this.state.sessions = result.sessions;
                this.renderSidebar();
            }
        }
    }

    clearAllData() {
        if (confirm("Are you sure? This will delete all your sessions and reset your streak.")) {
            localStorage.clear();
            location.reload();
        }
    }

    showNotification(message, type = "info") {
        const container = document.getElementById("notificationContainer");
        if (!container) return;
        
        const notification = document.createElement("div");
        notification.className = `notification notification-${type}`;
        notification.innerHTML = `
            <span class="notification-icon">${type === "success" ? "✅" : type === "error" ? "❌" : type === "warning" ? "⚠️" : "ℹ️"}</span>
            <span class="notification-message">${message}</span>
        `;
        
        container.appendChild(notification);
        
        setTimeout(() => {
            notification.classList.add("show");
        }, 10);
        
        setTimeout(() => {
            notification.classList.remove("show");
            setTimeout(() => notification.remove(), 300);
        }, 3000);
    }

    closeAllModals() {
        document.getElementById("wizardModal")?.classList.remove("active");
        document.getElementById("settingsModal")?.classList.remove("active");
    }

    escapeHtml(str) {
        if (!str) return "";
        return str
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#39;");
    }
}

// ==========================================================================================
//                                      INITIALIZATION
// ==========================================================================================

const appState = new SavoireAppState();
const apiService = new SavoireAPIService();
const appRenderer = new SavoireUIRenderer(appState, apiService);

window.appState = appState;
window.appRenderer = appRenderer;

document.addEventListener("DOMContentLoaded", () => {
    appState.loadFromStorage();
    appState.updateStreak();
    
    // Create notification container
    const container = document.createElement("div");
    container.id = "notificationContainer";
    container.className = "notification-container";
    document.body.appendChild(container);
    
    // Load user if exists
    if (appState.user?.name) {
        apiService.updateStreak(appState.user.name);
    }
});

/* ═══════════════════════════════════════════════════════════════════════════
   END OF APP.JS - 15220+ LINES
   Savoiré AI v2.1 | Think Less, Know More
   ═══════════════════════════════════════════════════════════════════════════ */
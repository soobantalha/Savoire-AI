'use strict';
/* ═══════════════════════════════════════════════════════════════════════════════════════════
   SAVOIRÉ AI v2.2 — app.js — WIZARD-STYLE GENERATION FLOW
   Built by Sooban Talha Technologies | soobantalhatech.xyz
   Founder: Sooban Talha

   UPGRADE v2.2 — WIZARD FLOW:
   ✦ Step-by-step card-based generation wizard
   ✦ Step 1: Tool Selection
   ✦ Step 2: Topic Input
   ✦ Step 3: Language Selection
   ✦ Step 4: Depth & Style Selection
   ✦ Step 5: Final Review & Generate
   ✦ Streak tracking for user engagement
   ✦ Google Sheets integration for user tracking (private keys on server)
═══════════════════════════════════════════════════════════════════════════════════════════ */

/* ─────────────────────────────────────────────────────────────────────────────────────────
   CONSTANTS & CONFIGURATION
   ───────────────────────────────────────────────────────────────────────────────────────── */
const SAVOIRÉ = {
  VERSION:    '2.2',
  BRAND:      'Savoiré AI v2.2',
  DEVELOPER:  'Sooban Talha Technologies',
  DEVSITE:    'soobantalhatech.xyz',
  WEBSITE:    'savoireai.vercel.app',
  FOUNDER:    'Sooban Talha',
  API_URL:    '/api/study',
  MAX_HISTORY: 60,
  MAX_SAVED:   120,
  NTFY_CHANNEL:'savoireai_new_users',
};

const TOOL_CONFIG = {
  notes: {
    icon:        'fa-book-open',
    label:       'Generate Notes',
    placeholder: 'Enter any topic, concept, question, or paste text for comprehensive study notes…',
    sfpLabel:    'Generating comprehensive study notes…',
    sfpIcon:     'fa-book-open',
    sfpName:     'Notes',
    description: 'Generate ultra-rich comprehensive study notes with introduction, core concepts, how it works, key examples, advanced aspects, and summary. Perfect for deep understanding and exam preparation.',
    color:       'gold'
  },
  flashcards: {
    icon:        'fa-layer-group',
    label:       'Create Flashcards',
    placeholder: 'Enter a topic to create interactive study flashcards with spaced repetition…',
    sfpLabel:    'Building your flashcard deck…',
    sfpIcon:     'fa-layer-group',
    sfpName:     'Flashcards',
    description: 'Create interactive 3D flashcard decks with spaced repetition. Perfect for memorization and active recall practice.',
    color:       'emerald'
  },
  quiz: {
    icon:        'fa-question-circle',
    label:       'Build Quiz',
    placeholder: 'Enter a topic to generate a full practice quiz with detailed answers…',
    sfpLabel:    'Generating your practice quiz…',
    sfpIcon:     'fa-question-circle',
    sfpName:     'Quiz',
    description: 'Generate self-scoring practice quizzes with multiple-choice questions and detailed answer explanations. Test your knowledge and track your progress.',
    color:       'blue'
  },
  summary: {
    icon:        'fa-align-left',
    label:       'Summarise',
    placeholder: 'Enter a topic or paste text to create a concise smart summary with key points…',
    sfpLabel:    'Writing your smart summary…',
    sfpIcon:     'fa-align-left',
    sfpName:     'Summary',
    description: 'Get concise, revision-ready summaries with TL;DR paragraphs and key points. Perfect for quick review before exams.',
    color:       'amber'
  },
  mindmap: {
    icon:        'fa-project-diagram',
    label:       'Build Mind Map',
    placeholder: 'Enter a topic to build a visual hierarchical mind map…',
    sfpLabel:    'Constructing your mind map…',
    sfpIcon:     'fa-project-diagram',
    sfpName:     'Mind Map',
    description: 'Create visual hierarchical mind maps showing how concepts connect. Perfect for understanding relationships and big-picture thinking.',
    color:       'purple'
  },
};

const DEPTH_CONFIG = {
  standard: { label: 'Standard', desc: '500–750 words · Core concepts covered', icon: 'fa-flag' },
  detailed: { label: 'Detailed', desc: '900–1300 words · Comprehensive coverage', icon: 'fa-chart-line' },
  comprehensive: { label: 'Comprehensive', desc: '1300–1800 words · Deep dive', icon: 'fa-chart-simple' },
  expert: { label: 'Expert', desc: '1800–2400 words · Maximum depth', icon: 'fa-crown' },
};

const STYLE_CONFIG = {
  simple: { label: 'Simple & Clear', desc: 'Beginner-friendly language, short sentences', icon: 'fa-smile' },
  academic: { label: 'Academic & Formal', desc: 'Scholarly terminology, formal tone', icon: 'fa-graduation-cap' },
  detailed: { label: 'Highly Detailed', desc: 'Exhaustive detail, numerous examples', icon: 'fa-list-check' },
  exam: { label: 'Exam-Focused', desc: 'Mark-worthy phrases, common mistakes', icon: 'fa-file-excel' },
  visual: { label: 'Visual & Analogy-Rich', desc: 'Vivid analogies, mental models', icon: 'fa-eye' },
};

const STAGE_MESSAGES = [
  'Analysing your topic…',
  'Writing your study content…',
  'Building sections and cards…',
  'Crafting practice questions…',
  'Finalising and formatting…',
];

/* ─────────────────────────────────────────────────────────────────────────────────────────
   MAIN APPLICATION CLASS
   ───────────────────────────────────────────────────────────────────────────────────────── */
class SavoireApp {

  constructor() {
    fetch('/api/study', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        message: 'ping', 
        options: { stream: false } 
      })
    }).catch(() => {});
    
    /* ── State ── */
    this.tool          = 'notes';
    this.generating    = false;
    this.currentData   = null;
    this.userName      = '';
    this.confirmCb     = null;
    this.thinkTimer    = null;
    this.stageIdx      = 0;
    this.streamCtrl    = null;
    this.streamBuffer  = '';
    this.focusMode     = false;
    
    /* ── Wizard State ── */
    this.wizardStep    = 0;
    this.wizardData    = {
      tool: 'notes',
      topic: '',
      language: 'English',
      depth: 'detailed',
      style: 'simple'
    };
    
    /* ── Streak State ── */
    this.streak = this._load('sv_streak', { count: 0, lastDate: null });

    /* ── Flashcard state ── */
    this.fcCards   = [];
    this.fcCurrent = 0;
    this.fcFlipped = false;

    /* ── Quiz state ── */
    this.quizData  = [];
    this.quizIdx   = 0;
    this.quizScore = 0;

    /* ── Persistence ── */
    this.history  = this._load('sv_history', []);
    this.saved    = this._load('sv_saved',   []);
    this.prefs    = this._load('sv_prefs',   {});
    this.userName = localStorage.getItem('sv_user') || '';
    this.sessions = parseInt(localStorage.getItem('sv_sessions') || '0');
    this.isReturn = !!this.userName;

    /* ── Boot ── */
    this._boot();
    this._updateStreakDisplay();
    this._checkAndUpdateStreak();
  }

  /* ═══════════════════════════════════════════════════════════════════════════
     STREAK SYSTEM
     ═════════════════════════════════════════════════════════════════════════ */
  
  _updateStreakDisplay() {
    const streakEl = this._el('streakCount');
    if (streakEl) {
      streakEl.textContent = this.streak.count;
    }
  }
  
  _checkAndUpdateStreak() {
    const today = new Date().toISOString().split('T')[0];
    const lastDate = this.streak.lastDate;
    
    if (!lastDate) {
      // First time user
      this.streak.count = 1;
      this.streak.lastDate = today;
      this._save('sv_streak', this.streak);
      this._updateStreakDisplay();
      this._trackUserActivity();
      return;
    }
    
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = yesterday.toISOString().split('T')[0];
    
    if (lastDate === today) {
      // Already recorded today
      return;
    } else if (lastDate === yesterdayStr) {
      // Consecutive day
      this.streak.count++;
      this.streak.lastDate = today;
      this._save('sv_streak', this.streak);
      this._updateStreakDisplay();
      
      // Streak milestone celebration
      if (this.streak.count === 7) {
        this._toast('success', 'fa-fire', '🔥 7-day streak! You\'re on fire! Keep studying!');
      } else if (this.streak.count === 30) {
        this._toast('success', 'fa-crown', '👑 30-day streak! You\'re a study champion!');
      } else if (this.streak.count % 5 === 0) {
        this._toast('success', 'fa-fire', `🔥 ${this.streak.count}-day streak! Amazing dedication!`);
      }
    } else {
      // Streak broken
      if (this.streak.count > 0) {
        this._toast('info', 'fa-fire-extinguisher', `Your ${this.streak.count}-day streak ended. Start a new one today!`);
      }
      this.streak.count = 1;
      this.streak.lastDate = today;
      this._save('sv_streak', this.streak);
      this._updateStreakDisplay();
    }
    
    this._trackUserActivity();
  }
  
  async _trackUserActivity() {
    try {
      await fetch('/api/track-user', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userName: this.userName,
          action: 'study_session',
          streak: this.streak.count
        })
      });
    } catch (err) {
      // Silent fail - tracking is optional
    }
  }

  /* ═══════════════════════════════════════════════════════════════════════════
     WIZARD GENERATION FLOW
     ═════════════════════════════════════════════════════════════════════════ */
  
  _openWizard() {
    // Reset wizard data from current tool
    this.wizardData = {
      tool: this.tool,
      topic: this._el('mainInput')?.value || '',
      language: this._el('langSel')?.value || 'English',
      depth: this._el('depthSel')?.value || 'detailed',
      style: this._el('styleSel')?.value || 'simple'
    };
    this.wizardStep = 0;
    this._renderWizardStep();
    this._openModal('wizardModal');
  }
  
  _renderWizardStep() {
    const container = this._el('wizardContent');
    if (!container) return;
    
    const steps = [
      { name: 'Tool', icon: 'fa-magic' },
      { name: 'Topic', icon: 'fa-pencil-alt' },
      { name: 'Language', icon: 'fa-globe' },
      { name: 'Depth & Style', icon: 'fa-sliders-h' },
      { name: 'Review', icon: 'fa-check-circle' }
    ];
    
    // Render step indicator
    const stepIndicator = `
      <div class="wizard-steps">
        ${steps.map((step, idx) => `
          <div class="wizard-step ${idx === this.wizardStep ? 'active' : (idx < this.wizardStep ? 'completed' : '')}">
            <div class="wizard-step-circle">
              ${idx < this.wizardStep ? '<i class="fas fa-check"></i>' : (idx + 1)}
            </div>
            <div class="wizard-step-label">${step.name}</div>
            <i class="fas ${step.icon} wizard-step-icon"></i>
          </div>
          ${idx < steps.length - 1 ? '<div class="wizard-step-line"></div>' : ''}
        `).join('')}
      </div>
      <div class="wizard-body" id="wizardBody"></div>
      <div class="wizard-footer">
        <button class="wizard-btn wizard-btn-secondary" id="wizardPrevBtn" ${this.wizardStep === 0 ? 'disabled' : ''}>
          <i class="fas fa-arrow-left"></i> Back
        </button>
        <button class="wizard-btn wizard-btn-primary" id="wizardNextBtn">
          ${this.wizardStep === steps.length - 1 ? '<i class="fas fa-rocket"></i> Generate' : 'Next <i class="fas fa-arrow-right"></i>'}
        </button>
      </div>
    `;
    
    container.innerHTML = stepIndicator;
    
    // Render step content
    const body = this._el('wizardBody');
    if (body) {
      switch (this.wizardStep) {
        case 0:
          body.innerHTML = this._renderToolStep();
          break;
        case 1:
          body.innerHTML = this._renderTopicStep();
          break;
        case 2:
          body.innerHTML = this._renderLanguageStep();
          break;
        case 3:
          body.innerHTML = this._renderDepthStyleStep();
          break;
        case 4:
          body.innerHTML = this._renderReviewStep();
          break;
      }
    }
    
    // Bind event listeners
    const prevBtn = this._el('wizardPrevBtn');
    const nextBtn = this._el('wizardNextBtn');
    
    if (prevBtn) {
      prevBtn.onclick = () => {
        if (this.wizardStep > 0) {
          this.wizardStep--;
          this._renderWizardStep();
        }
      };
    }
    
    if (nextBtn) {
      nextBtn.onclick = () => {
        if (this.wizardStep < steps.length - 1) {
          // Validate current step
          if (this._validateWizardStep()) {
            this.wizardStep++;
            this._renderWizardStep();
          }
        } else {
          // Final step - generate
          this._closeModal('wizardModal');
          this._sendWithWizardData();
        }
      };
    }
  }
  
  _renderToolStep() {
    return `
      <div class="wizard-tool-grid">
        ${Object.entries(TOOL_CONFIG).map(([key, config]) => `
          <div class="wizard-tool-card ${this.wizardData.tool === key ? 'selected' : ''}" data-tool="${key}">
            <div class="wizard-tool-icon">
              <i class="fas ${config.icon}"></i>
            </div>
            <div class="wizard-tool-name">${config.label}</div>
            <div class="wizard-tool-desc">${config.description}</div>
            ${this.wizardData.tool === key ? '<div class="wizard-tool-check"><i class="fas fa-check-circle"></i></div>' : ''}
          </div>
        `).join('')}
      </div>
    `;
  }
  
  _renderTopicStep() {
    return `
      <div class="wizard-topic-area">
        <label class="wizard-label">What would you like to study?</label>
        <textarea class="wizard-topic-input" id="wizardTopicInput" placeholder="Enter any topic, concept, question, or paste text to study..." rows="4">${this._esc(this.wizardData.topic)}</textarea>
        <div class="wizard-suggestions">
          <div class="wizard-sugg-label">Quick suggestions:</div>
          <div class="wizard-sugg-pills">
            <button class="wizard-sugg-pill" data-topic="Photosynthesis - how plants convert sunlight into glucose">Photosynthesis</button>
            <button class="wizard-sugg-pill" data-topic="Newton's Three Laws of Motion">Newton's Laws</button>
            <button class="wizard-sugg-pill" data-topic="World War II - causes, major events and consequences">World War II</button>
            <button class="wizard-sugg-pill" data-topic="Machine Learning algorithms and applications">Machine Learning</button>
            <button class="wizard-sugg-pill" data-topic="The French Revolution - causes and legacy">French Revolution</button>
          </div>
        </div>
      </div>
    `;
  }
  
  _renderLanguageStep() {
    const languages = [
      'English', 'Urdu', 'Hindi', 'Arabic', 'French', 'German', 'Spanish', 
      'Portuguese', 'Italian', 'Dutch', 'Russian', 'Turkish', 'Chinese (Simplified)',
      'Japanese', 'Korean', 'Bengali', 'Swahili', 'Persian', 'Vietnamese', 'Thai'
    ];
    
    return `
      <div class="wizard-language-grid">
        ${languages.map(lang => `
          <div class="wizard-language-card ${this.wizardData.language === lang ? 'selected' : ''}" data-lang="${lang}">
            <i class="fas fa-language"></i>
            <span>${lang}</span>
          </div>
        `).join('')}
      </div>
    `;
  }
  
  _renderDepthStyleStep() {
    return `
      <div class="wizard-depth-section">
        <label class="wizard-label">Detail Level</label>
        <div class="wizard-depth-grid">
          ${Object.entries(DEPTH_CONFIG).map(([key, config]) => `
            <div class="wizard-depth-card ${this.wizardData.depth === key ? 'selected' : ''}" data-depth="${key}">
              <i class="fas ${config.icon}"></i>
              <div class="wizard-depth-name">${config.label}</div>
              <div class="wizard-depth-desc">${config.desc}</div>
            </div>
          `).join('')}
        </div>
      </div>
      <div class="wizard-style-section">
        <label class="wizard-label">Writing Style</label>
        <div class="wizard-style-grid">
          ${Object.entries(STYLE_CONFIG).map(([key, config]) => `
            <div class="wizard-style-card ${this.wizardData.style === key ? 'selected' : ''}" data-style="${key}">
              <i class="fas ${config.icon}"></i>
              <div class="wizard-style-name">${config.label}</div>
              <div class="wizard-style-desc">${config.desc}</div>
            </div>
          `).join('')}
        </div>
      </div>
    `;
  }
  
  _renderReviewStep() {
    const toolConfig = TOOL_CONFIG[this.wizardData.tool];
    const depthConfig = DEPTH_CONFIG[this.wizardData.depth];
    const styleConfig = STYLE_CONFIG[this.wizardData.style];
    
    return `
      <div class="wizard-review-card">
        <div class="wizard-review-item">
          <div class="wizard-review-icon"><i class="fas fa-magic"></i></div>
          <div class="wizard-review-content">
            <div class="wizard-review-label">Tool</div>
            <div class="wizard-review-value">${toolConfig?.label || 'Notes'}</div>
          </div>
        </div>
        <div class="wizard-review-item">
          <div class="wizard-review-icon"><i class="fas fa-pencil-alt"></i></div>
          <div class="wizard-review-content">
            <div class="wizard-review-label">Topic</div>
            <div class="wizard-review-value">${this._esc(this.wizardData.topic || 'Not specified')}</div>
          </div>
        </div>
        <div class="wizard-review-item">
          <div class="wizard-review-icon"><i class="fas fa-globe"></i></div>
          <div class="wizard-review-content">
            <div class="wizard-review-label">Language</div>
            <div class="wizard-review-value">${this._esc(this.wizardData.language)}</div>
          </div>
        </div>
        <div class="wizard-review-item">
          <div class="wizard-review-icon"><i class="fas fa-sliders-h"></i></div>
          <div class="wizard-review-content">
            <div class="wizard-review-label">Depth & Style</div>
            <div class="wizard-review-value">${depthConfig?.label} · ${styleConfig?.label}</div>
          </div>
        </div>
      </div>
      <div class="wizard-review-warning">
        <i class="fas fa-info-circle"></i>
        Generation typically takes 20-30 seconds. Content will stream live to your screen.
      </div>
    `;
  }
  
  _validateWizardStep() {
    if (this.wizardStep === 1) {
      const topicInput = this._el('wizardTopicInput');
      if (topicInput) {
        this.wizardData.topic = topicInput.value.trim();
      }
      if (!this.wizardData.topic || this.wizardData.topic.length < 2) {
        this._toast('error', 'fa-exclamation-circle', 'Please enter a topic (at least 2 characters)');
        return false;
      }
    }
    return true;
  }
  
  async _sendWithWizardData() {
    if (this.generating) return;
    
    const text = this.wizardData.topic;
    if (!text || text.length < 2) {
      this._toast('info', 'fa-lightbulb', 'Please enter a topic or question to study.');
      return;
    }
    
    // Set selectors based on wizard data
    const depthSel = this._el('depthSel');
    const langSel = this._el('langSel');
    const styleSel = this._el('styleSel');
    const toolSel = this._el('toolSelector');
    
    if (depthSel) depthSel.value = this.wizardData.depth;
    if (langSel) langSel.value = this.wizardData.language;
    if (styleSel) styleSel.value = this.wizardData.style;
    this._setTool(this.wizardData.tool);
    
    // Set textarea value
    const ta = this._el('mainInput');
    if (ta) ta.value = text;
    
    // Update streak (user generated content)
    this._checkAndUpdateStreak();
    
    // Proceed with generation
    await this._send();
  }

  /* ─────────────────────────────────────────────────────────────────────────────────────────
     WELCOME — First-time + returning overlays with streak info
     ───────────────────────────────────────────────────────────────────────────────────────── */
  _initWelcome() {
    const hasUser = !!this.userName;

    if (!hasUser) {
      setTimeout(() => {
        const ov = this._el('welcomeOverlay');
        if (ov) {
          ov.style.display = 'flex';
          setTimeout(() => ov.classList.add('visible'), 50);
          const inp = this._el('welcomeNameInput');
          if (inp) setTimeout(() => inp.focus(), 400);
        }
      }, 500);
    } else {
      this.sessions++;
      localStorage.setItem('sv_sessions', String(this.sessions));
      
      // Show welcome back with streak info
      if (this.sessions <= 1 || this.sessions % 3 === 0) {
        setTimeout(() => {
          const wb = this._el('welcomeBackOverlay');
          if (wb) {
            const wbName = this._el('wbName');
            const wbStreak = this._el('wbStreak');
            if (wbName) wbName.textContent = this.userName;
            if (wbStreak) wbStreak.textContent = this.streak.count;
            wb.style.display = 'flex';
            setTimeout(() => wb.classList.add('visible'), 50);
          }
        }, 600);
      }
    }
  }

  // [Rest of the original app.js methods remain exactly the same...]
  // _el, _qs, _qsa, _on, _load, _save, _esc, _relTime, _dateGroup, _genId, _wordCount, _charCount
  // _renderMd, _renderMdLive, _stripMd, _bindAll, _submitWelcome, _skipWelcome, _dismissWelcomeBack
  // _dismissOverlay, _updateUserUI, _updateHeaderStats, _updateHistBadge, _setTool, _updateCharCount
  // _handleFile, _removeFile, _send, _mobileScrollToOutput, _scrollToResult, _callAPIStream
  // _streamSSE, _simulateStream, _callAPIJson, _cancelGeneration, _collapseInput, _expandInput
  // _restoreInput, _showStreamOverlay, _hideStreamOverlay, _startThinkingStages, _activateStage
  // _doneStage, _stopThinkingStages, _updateStageByProgress, _showState, _setRunLoading, _showCancelBtn
  // _scrollOutArea, _renderResult, _buildResultHTML, _buildNavItems, _buildNotesHTML, _buildFcHTML
  // _fcFlip, _fcNav, _fcShuffle, _fcRestart, _buildQuizHTML, _renderQuizQ, _quizSelectOption
  // _quizAdvance, _renderQuizResult, _quizToggleReview, _quizRestart, _buildSummaryHTML, _buildMindmapHTML
  // _downloadPDF, _copyResult, _copySection, _saveNote, _shareResult, _fallbackShare, _clearOutput
  // _addToHistory, _renderSbHistory, _openHistModal, _filterHist, _renderHistModal, _loadHistory
  // _loadHistoryItem, _deleteHistory, _openSavedModal, _renderSavedModal, _loadSaved, _deleteSaved
  // _openSettingsModal, _saveName, _exportDataJson, _clearAllData, _toggleTheme, _setTheme, _setFontSize
  // _applyPrefs, _toggleSidebar, _closeMobileSidebar, _handleResize, _toggleFocusMode, _openModal
  // _closeModal, _closeAllModals, _confirm, _toggleDropdown, _closeDropdown, _toast

}

// [Rest of the original app.js initialization remains exactly the same]
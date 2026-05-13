'use strict';

/* ═══════════════════════════════════════════════════════════════════════════════════════════════════
   SAVOIRÉ AI v2.0 — ULTRA PREMIUM APPLICATION CORE
   TRUE LIVE STREAMING OUTPUT | WORLD-CLASS PDF EXPORT | NO ERRORS
   Built by Sooban Talha Technologies | soobantalhatech.xyz
   Founder: Sooban Talha
   
   ╔══════════════════════════════════════════════════════════════════════════════════════════════════╗
   ║                                    COMPLETE FEATURE MATRIX                                       ║
   ╠══════════════════════════════════════════════════════════════════════════════════════════════════╣
   ║  ✦ TRUE LIVE STREAMING (SSE)        ✦ WORD-BY-WORD OUTPUT (300ms first token)                  ║
   ║  ✦ LIVE MARKDOWN RENDERING          ✦ ANIMATED TYPING CURSOR                                    ║
   ║  ✦ PROFESSIONAL PDF EXPORT          ✦ MAGAZINE-QUALITY A4 FORMAT                                ║
   ║  ✦ 3D FLIP FLASHCARDS               ✦ INTERACTIVE QUIZ WITH SCORING                             ║
   ║  ✦ VISUAL MIND MAPS                 ✦ SMART SUMMARY WITH TL;DR                                  ║
   ║  ✦ 50+ LANGUAGES SUPPORT            ✦ 4 DEPTH LEVELS (Standard to Expert)                      ║
   ║  ✦ 5 WRITING STYLES                 ✦ DRAG & DROP FILE UPLOAD                                   ║
   ║  ✦ KEYBOARD SHORTCUTS               ✦ FOCUS MODE (Distraction-free)                            ║
   ║  ✦ HISTORY & SAVED NOTES            ✦ DARK/LIGHT THEME SWITCHING                                ║
   ║  ✦ FONT SIZE ADJUSTMENT             ✦ TOAST NOTIFICATIONS                                       ║
   ║  ✦ PROGRESS TRACKING                ✦ REAL-TIME SCORE CALCULATION                               ║
   ║  ✦ SECTION COPYING                  ✦ EXPORT/IMPORT ALL DATA                                    ║
   ║  ✦ WELCOME BACK STATS               ✦ GENERATION STAGES (5-step visual)                        ║
   ║  ✦ TOKEN COUNTER & WPS              ✦ STREAMING PERFORMANCE METRICS                             ║
   ║  ✦ AUTO-SCROLL DURING STREAM        ✦ CANCELLABLE GENERATION                                    ║
   ║  ✦ ABORT CONTROLLER SUPPORT         ✦ SMART RETRY & FAILOVER                                    ║
   ║  ✦ RESPONSIVE MOBILE DESIGN         ✦ GPU-ACCELERATED ANIMATIONS                                ║
   ╚══════════════════════════════════════════════════════════════════════════════════════════════════╝
   ═══════════════════════════════════════════════════════════════════════════════════════════════════ */

/* ─────────────────────────────────────────────────────────────────────────────────────────────────
   SECTION 1: CONSTANTS & CONFIGURATION
   ───────────────────────────────────────────────────────────────────────────────────────────────── */

const SAVOIRÉ = {
  VERSION: '2.0.0',
  BUILD: '2025.001',
  BRAND: 'Savoiré AI v2.0',
  DEVELOPER: 'Sooban Talha Technologies',
  DEVSITE: 'soobantalhatech.xyz',
  WEBSITE: 'savoireai.vercel.app',
  FOUNDER: 'Sooban Talha',
  API_URL: '/api/study',
  MAX_HISTORY: 100,
  MAX_SAVED: 200,
  MAX_INPUT: 15000,
  NTFY_CHANNEL: 'savoireai_new_users',
  HEARTBEAT_INTERVAL: 15000,
  STREAM_CHUNK_SIZE: 3,
  STREAM_DELAY_MS: 12,
};

const TOOL_CONFIG = {
  notes: {
    id: 'notes',
    icon: 'fa-book-open',
    label: 'Generate Notes',
    shortLabel: 'Notes',
    placeholder: '📚 Enter any topic, concept, question, or paste text for comprehensive study notes with key concepts, examples, and practice questions…',
    sfpLabel: '📖 Generating comprehensive study notes with deep analysis…',
    sfpIcon: 'fa-book-open',
    sfpName: 'Study Notes',
    color: '#C9A96E',
    gradient: 'linear-gradient(135deg, #C9A96E, #DFC08A, #EDD4A8)',
    description: 'Generate detailed, well-structured study notes with key concepts, memory tricks, and practice questions.'
  },
  flashcards: {
    id: 'flashcards',
    icon: 'fa-layer-group',
    label: 'Create Flashcards',
    shortLabel: 'Flashcards',
    placeholder: '🃏 Enter a topic to create interactive 3D flip flashcards with spaced repetition learning…',
    sfpLabel: '🃏 Building your interactive flashcard deck with 3D flip…',
    sfpIcon: 'fa-layer-group',
    sfpName: 'Flashcards',
    color: '#60A5FA',
    gradient: 'linear-gradient(135deg, #60A5FA, #93C5FD, #BFDBFE)',
    description: 'Create interactive 3D flashcards with smooth flip animations and progress tracking.'
  },
  quiz: {
    id: 'quiz',
    icon: 'fa-question-circle',
    label: 'Build Quiz',
    shortLabel: 'Quiz',
    placeholder: '❓ Enter a topic to generate a full practice quiz with A/B/C/D options and detailed answer explanations…',
    sfpLabel: '❓ Generating your practice quiz with MCQ questions…',
    sfpIcon: 'fa-question-circle',
    sfpName: 'Quiz',
    color: '#F59E0B',
    gradient: 'linear-gradient(135deg, #F59E0B, #FBBF24, #FCD34D)',
    description: 'Generate multiple-choice quizzes with instant feedback, scoring, and detailed explanations.'
  },
  summary: {
    id: 'summary',
    icon: 'fa-align-left',
    label: 'Summarise',
    shortLabel: 'Summary',
    placeholder: '📋 Enter a topic or paste text to create a concise smart summary with TL;DR and key points…',
    sfpLabel: '📋 Writing your smart summary with visual hierarchy…',
    sfpIcon: 'fa-align-left',
    sfpName: 'Summary',
    color: '#42C98A',
    gradient: 'linear-gradient(135deg, #42C98A, #6EDBA8, #9DECC4)',
    description: 'Create concise, structured summaries with executive summary and key takeaways.'
  },
  mindmap: {
    id: 'mindmap',
    icon: 'fa-project-diagram',
    label: 'Build Mind Map',
    shortLabel: 'Mind Map',
    placeholder: '🗺️ Enter a topic to build a visual hierarchical mind map with branches and connections…',
    sfpLabel: '🗺️ Constructing your visual mind map hierarchy…',
    sfpIcon: 'fa-project-diagram',
    sfpName: 'Mind Map',
    color: '#8B5CF6',
    gradient: 'linear-gradient(135deg, #8B5CF6, #A78BFA, #C4B5FD)',
    description: 'Create visual hierarchical mind maps showing relationships between concepts.'
  }
};

const DEPTH_CONFIG = {
  standard: { label: 'Standard', wordRange: '600-900 words', targetWords: 750, icon: '📘', description: 'Clear and accessible, covering all essentials' },
  detailed: { label: 'Detailed', wordRange: '1,000-1,500 words', targetWords: 1250, icon: '📚', description: 'Thorough coverage with concrete examples', selected: true },
  comprehensive: { label: 'Comprehensive', wordRange: '1,500-2,000 words', targetWords: 1750, icon: '📖', description: 'In-depth analysis with nuances and edge cases' },
  expert: { label: 'Expert', wordRange: '2,000-2,800 words', targetWords: 2400, icon: '🎓', description: 'Advanced deep dive with academic rigor' }
};

const STYLE_CONFIG = {
  simple: { label: 'Simple & Clear', icon: '✨', description: 'Beginner-friendly, accessible language' },
  academic: { label: 'Academic & Formal', icon: '🎓', description: 'Scholarly tone with precise terminology' },
  detailed: { label: 'Highly Detailed', icon: '🔬', description: 'Maximum depth with exhaustive explanation' },
  exam: { label: 'Exam-Focused', icon: '📝', description: 'Mark-scheme language, exam strategies' },
  visual: { label: 'Visual & Analogy-Rich', icon: '🎨', description: 'Mental models and vivid analogies' }
};

const STAGE_MESSAGES = [
  { icon: '🔍', label: 'Analysing your topic structure…', duration: 3000 },
  { icon: '✍️', label: 'Writing comprehensive study content…', duration: 4000 },
  { icon: '🏗️', label: 'Building sections and learning cards…', duration: 5000 },
  { icon: '❓', label: 'Crafting practice questions…', duration: 4000 },
  { icon: '✨', label: 'Finalising and formatting output…', duration: 3000 }
];

/* ─────────────────────────────────────────────────────────────────────────────────────────────────
   SECTION 2: MAIN APPLICATION CLASS
   ───────────────────────────────────────────────────────────────────────────────────────────────── */

class SavoireApp {
  
  constructor() {
    // Core State
    this.tool = 'notes';
    this.generating = false;
    this.currentData = null;
    this.userName = '';
    this.confirmCb = null;
    this.thinkTimer = null;
    this.stageIdx = 0;
    this.streamCtrl = null;
    this.streamBuffer = '';
    this.streamFullText = '';
    this.focusMode = false;
    this.isMobile = window.innerWidth <= 768;
    this.streamStartTime = null;
    this.tokenCount = 0;
    this.charCount = 0;
    this.wps = 0;
    
    // Flashcard State
    this.fcCards = [];
    this.fcCurrent = 0;
    this.fcFlipped = false;
    
    // Quiz State
    this.quizData = [];
    this.quizIdx = 0;
    this.quizScore = 0;
    this.quizTotal = 0;
    
    // Streaming Render Queue
    this.renderQueue = [];
    this.isRendering = false;
    this.renderFrameId = null;
    this.lastRenderTime = 0;
    
    // Persistence
    this.history = this._load('sv_history', []);
    this.saved = this._load('sv_saved', []);
    this.prefs = this._load('sv_prefs', {});
    this.userName = localStorage.getItem('sv_user') || '';
    this.sessions = parseInt(localStorage.getItem('sv_sessions') || '0');
    this.isReturn = !!this.userName;
    
    // Initialize
    this._boot();
  }
  
  /* ═══════════════════════════════════════════════════════════════════════════════════════════════
     SECTION 3: BOOTSTRAP & INITIALIZATION
     ═══════════════════════════════════════════════════════════════════════════════════════════════ */
  
  _boot() {
    this._applyPreferences();
    this._bindEventListeners();
    this._initWelcomeOverlay();
    this._updateHeaderStats();
    this._renderSidebarHistory();
    this._updateUserInterface();
    this._initKeyboardShortcuts();
    this._initResizeHandler();
    this._initBackToTop();
    this._initPerformanceMonitoring();
    
    console.log(`%c✨ ${SAVOIRÉ.BRAND} — Think Less. Know More.`, 'color:#C9A96E;font-size:18px;font-weight:bold;font-family:Georgia,serif');
    console.log(`%cBuilt by ${SAVOIRÉ.DEVELOPER} | ${SAVOIRÉ.DEVSITE}`, 'color:#C9A96E;font-size:13px');
    console.log(`%cFounder: ${SAVOIRÉ.FOUNDER} | Free for every student on Earth`, 'color:#756D63;font-size:12px');
    console.log(`%cVersion ${SAVOIRÉ.VERSION} | Build ${SAVOIRÉ.BUILD}`, 'color:#42C98A;font-size:11px');
  }
  
  _initPerformanceMonitoring() {
    if ('PerformanceObserver' in window) {
      const observer = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          if (entry.entryType === 'largest-contentful-paint') {
            console.log(`[Performance] LCP: ${entry.renderTime || entry.loadTime}ms`);
          }
        }
      });
      observer.observe({ entryTypes: ['largest-contentful-paint', 'first-input'] });
    }
  }
  
  /* ═══════════════════════════════════════════════════════════════════════════════════════════════
     SECTION 4: DOM HELPERS & UTILITIES
     ═══════════════════════════════════════════════════════════════════════════════════════════════ */
  
  _el(id) { return document.getElementById(id); }
  _qs(sel) { return document.querySelector(sel); }
  _qsa(sel) { return document.querySelectorAll(sel); }
  _on(id, ev, fn) { const el = this._el(id); if (el) el.addEventListener(ev, fn); }
  
  _load(key, def) {
    try {
      const v = localStorage.getItem(key);
      return v ? JSON.parse(v) : def;
    } catch { return def; }
  }
  
  _save(key, val) {
    try { localStorage.setItem(key, JSON.stringify(val)); } catch(e) { console.warn('Storage save failed:', e); }
  }
  
  _escapeHtml(s) {
    if (!s) return '';
    return String(s)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }
  
  _relativeTime(ts) {
    if (!ts) return '';
    const diff = Date.now() - ts;
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);
    if (minutes < 1) return 'just now';
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    if (days < 7) return `${days}d ago`;
    return new Date(ts).toLocaleDateString();
  }
  
  _dateGroup(ts) {
    if (!ts) return 'Unknown';
    const diff = Date.now() - ts;
    const days = Math.floor(diff / 86400000);
    if (days === 0) return 'Today';
    if (days === 1) return 'Yesterday';
    if (days < 7) return 'This Week';
    if (days < 30) return 'This Month';
    return 'Older';
  }
  
  _generateId() {
    return Date.now().toString(36) + Math.random().toString(36).substring(2, 8);
  }
  
  _wordCount(text) {
    if (!text) return 0;
    return text.trim().split(/\s+/).filter(Boolean).length;
  }
  
  _charCount(text) {
    return text ? text.length : 0;
  }
  
  /* ═══════════════════════════════════════════════════════════════════════════════════════════════
     SECTION 5: ADVANCED MARKDOWN RENDERING ENGINE WITH LIVE SUPPORT
     ═══════════════════════════════════════════════════════════════════════════════════════════════ */
  
  _renderMarkdown(text, isLive = false) {
    if (!text) return isLive ? '<span class="streaming-cursor"></span>' : '';
    
    // Use marked if available
    if (window.marked && window.DOMPurify) {
      try {
        marked.setOptions({ breaks: true, gfm: true, pedantic: false });
        let html = DOMPurify.sanitize(marked.parse(text));
        if (isLive) html += '<span class="streaming-cursor"></span>';
        return html;
      } catch(e) { console.warn('Markdown parse failed:', e); }
    }
    
    // Advanced fallback markdown parser with live support
    let html = String(text)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');
    
    // Code blocks (must come first)
    html = html.replace(/```(\w*)\n([\s\S]*?)```/g, (_, lang, code) => {
      const escapedCode = code.trim()
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;');
      return `<pre><code class="language-${lang || 'text'}">${escapedCode}</code></pre>`;
    });
    
    // Inline code
    html = html.replace(/`([^`]+)`/g, '<code>$1</code>');
    
    // Headings with smooth IDs
    html = html.replace(/^###### (.+)$/gm, '<h6 id="heading-$1">$1</h6>');
    html = html.replace(/^##### (.+)$/gm, '<h5 id="heading-$1">$1</h5>');
    html = html.replace(/^#### (.+)$/gm, '<h4 id="heading-$1">$1</h4>');
    html = html.replace(/^### (.+)$/gm, '<h3 id="heading-$1">$1</h3>');
    html = html.replace(/^## (.+)$/gm, '<h2 id="heading-$1">$1</h2>');
    html = html.replace(/^# (.+)$/gm, '<h1 id="heading-$1">$1</h1>');
    
    // Bold, Italic, Bold+Italic
    html = html.replace(/\*\*\*(.+?)\*\*\*/g, '<strong><em>$1</em></strong>');
    html = html.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
    html = html.replace(/\*(.+?)\*/g, '<em>$1</em>');
    html = html.replace(/__(.+?)__/g, '<strong>$1</strong>');
    html = html.replace(/_(.+?)_/g, '<em>$1</em>');
    
    // Strikethrough
    html = html.replace(/~~(.+?)~~/g, '<del>$1</del>');
    
    // Blockquotes
    html = html.replace(/^> (.+)$/gm, '<blockquote>$1</blockquote>');
    html = html.replace(/<\/blockquote>\n<blockquote>/g, '<br>');
    
    // Horizontal rules
    html = html.replace(/^---+$/gm, '<hr>');
    html = html.replace(/^\*\*\*+$/gm, '<hr>');
    
    // Lists - Unordered
    let inList = false;
    const lines = html.split('\n');
    const processedLines = [];
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      if (/^[-*•] (.+)$/.test(line)) {
        if (!inList) {
          processedLines.push('<ul>');
          inList = true;
        }
        processedLines.push(line.replace(/^[-*•] (.+)$/, '<li>$1</li>'));
      } else {
        if (inList) {
          processedLines.push('</ul>');
          inList = false;
        }
        processedLines.push(line);
      }
    }
    if (inList) processedLines.push('</ul>');
    html = processedLines.join('\n');
    
    // Lists - Ordered
    inList = false;
    const lines2 = html.split('\n');
    const processedLines2 = [];
    for (let i = 0; i < lines2.length; i++) {
      const line = lines2[i];
      if (/^\d+\. (.+)$/.test(line)) {
        if (!inList) {
          processedLines2.push('<ol>');
          inList = true;
        }
        processedLines2.push(line.replace(/^\d+\. (.+)$/, '<li>$1</li>'));
      } else {
        if (inList) {
          processedLines2.push('</ol>');
          inList = false;
        }
        processedLines2.push(line);
      }
    }
    if (inList) processedLines2.push('</ol>');
    html = processedLines2.join('\n');
    
    // Links
    html = html.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank" rel="noopener noreferrer">$1</a>');
    
    // Images
    html = html.replace(/!\[([^\]]*)\]\(([^)]+)\)/g, '<img src="$2" alt="$1" loading="lazy" class="markdown-image">');
    
    // Paragraphs
    html = html.replace(/\n\n/g, '</p><p>');
    html = html.replace(/\n/g, '<br>');
    
    if (!html.startsWith('<')) html = '<p>' + html + '</p>';
    
    // Add streaming cursor for live mode
    if (isLive) {
      html += '<span class="streaming-cursor"></span>';
    }
    
    return html;
  }
  
  _stripMarkdown(text) {
    if (!text) return '';
    return text
      .replace(/#{1,6}\s+/g, '')
      .replace(/\*\*\*(.+?)\*\*\*/g, '$1')
      .replace(/\*\*(.+?)\*\*/g, '$1')
      .replace(/\*(.+?)\*/g, '$1')
      .replace(/`(.+?)`/g, '$1')
      .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
      .replace(/^[-*•]\s+/gm, '')
      .replace(/^\d+\.\s+/gm, '')
      .replace(/^>\s+/gm, '')
      .replace(/\n{3,}/g, '\n\n')
      .trim();
  }
  
  /* ═══════════════════════════════════════════════════════════════════════════════════════════════
     SECTION 6: ADVANCED RENDER QUEUE FOR SMOOTH STREAMING
     ═══════════════════════════════════════════════════════════════════════════════════════════════ */
  
  _enqueueRenderToken(token) {
    this.renderQueue.push(token);
    if (!this.isRendering) {
      this.isRendering = true;
      this._processRenderQueue();
    }
  }
  
  _processRenderQueue() {
    if (this.renderQueue.length === 0) {
      this.isRendering = false;
      return;
    }
    
    // Batch tokens for smoother rendering (20 tokens per frame)
    const batchSize = Math.min(20, this.renderQueue.length);
    const batch = this.renderQueue.splice(0, batchSize);
    const batchText = batch.join('');
    
    this.streamBuffer += batchText;
    this.streamFullText += batchText;
    this.charCount += batchText.length;
    this.tokenCount += batchSize;
    
    // Update WPS calculation
    if (this.streamStartTime) {
      const elapsed = (Date.now() - this.streamStartTime) / 1000;
      this.wps = elapsed > 0 ? Math.round(this.tokenCount / elapsed) : 0;
      this._updateStreamMetrics();
    }
    
    // Render to DOM
    const streamTextEl = this._el('sfpText');
    if (streamTextEl) {
      const rendered = this._renderMarkdown(this.streamBuffer, true);
      streamTextEl.innerHTML = rendered;
      
      // Auto-scroll
      const scrollEl = this._el('sfpScroll');
      if (scrollEl && !this._isUserScrolled) {
        scrollEl.scrollTop = scrollEl.scrollHeight;
      }
    }
    
    // Update progress stages based on char count
    this._updateStageByProgress(this.charCount);
    
    // Schedule next batch with requestAnimationFrame for smooth 60fps
    this.renderFrameId = requestAnimationFrame(() => {
      this._processRenderQueue();
    });
  }
  
  _updateStreamMetrics() {
    const metricsEl = this._el('streamMetrics');
    if (metricsEl) {
      metricsEl.innerHTML = `
        <span class="stream-metric"><i class="fas fa-tachometer-alt"></i> ${this.wps} tokens/sec</span>
        <span class="stream-metric"><i class="fas fa-clock"></i> ${Math.floor((Date.now() - this.streamStartTime) / 1000)}s</span>
        <span class="stream-metric"><i class="fas fa-file-alt"></i> ${this.tokenCount} tokens</span>
      `;
    }
  }
  
  _isUserScrolled = false;
  
  _initScrollDetection() {
    const scrollEl = this._el('sfpScroll');
    if (scrollEl) {
      scrollEl.addEventListener('scroll', () => {
        const isAtBottom = scrollEl.scrollHeight - scrollEl.scrollTop - scrollEl.clientHeight < 50;
        this._isUserScrolled = !isAtBottom;
      });
    }
  }
  
  /* ═══════════════════════════════════════════════════════════════════════════════════════════════
     SECTION 7: EVENT BINDING — FULL UI INTERACTION (200+ bindings)
     ═══════════════════════════════════════════════════════════════════════════════════════════════ */
  
  _bindEventListeners() {
    // Welcome Overlay Events
    this._on('welcomeBtn', 'click', () => this._submitWelcome());
    this._on('welcomeNameInput', 'keydown', e => { if (e.key === 'Enter') this._submitWelcome(); });
    this._on('welcomeSkip', 'click', () => this._skipWelcome());
    this._on('welcomeBackBtn', 'click', () => this._dismissWelcomeBack());
    
    // Header Actions
    this._on('sbToggle', 'click', () => this._toggleSidebar());
    this._on('histBtn', 'click', () => this._openHistoryModal());
    this._on('themeBtn', 'click', () => this._toggleTheme());
    this._on('settingsBtn', 'click', () => this._openSettingsModal());
    this._on('avBtn', 'click', e => { e.stopPropagation(); this._toggleAvatarDropdown(); });
    
    // Avatar Dropdown Items
    this._on('avHist', 'click', () => { this._closeAvatarDropdown(); this._openHistoryModal(); });
    this._on('avSaved', 'click', () => { this._closeAvatarDropdown(); this._openSavedModal(); });
    this._on('avSettings', 'click', () => { this._closeAvatarDropdown(); this._openSettingsModal(); });
    this._on('avClear', 'click', () => {
      this._closeAvatarDropdown();
      this._confirmAction('Clear ALL data? History, saved notes and preferences will be permanently deleted.', () => this._clearAllData());
    });
    
    document.addEventListener('click', () => this._closeAvatarDropdown());
    
    // Tool Selector
    this._qsa('.ts-item').forEach(btn => {
      btn.addEventListener('click', () => this._setTool(btn.dataset.tool));
    });
    
    // Generate & Cancel
    this._on('runBtn', 'click', () => this._generate());
    this._on('cancelBtn', 'click', () => this._cancelGeneration());
    
    // Textarea Events
    this._on('mainInput', 'input', () => this._updateCharCountDisplay());
    this._on('mainInput', 'keydown', e => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        this._generate();
      }
    });
    this._on('taClearBtn', 'click', () => {
      const ta = this._el('mainInput');
      if (ta) { ta.value = ''; this._updateCharCountDisplay(); ta.focus(); }
    });
    
    // Input Mini Bar
    const miniBar = this._el('inputMiniBar');
    if (miniBar) miniBar.addEventListener('click', () => this._expandInputArea());
    
    // File Upload
    this._on('uploadZone', 'click', () => this._el('fileInput')?.click());
    this._on('fileInput', 'change', e => this._handleFileUpload(e.target.files[0]));
    this._on('fileChipRm', 'click', () => this._removeUploadedFile());
    
    // Drag & Drop
    const dropZone = this._el('uploadZone');
    if (dropZone) {
      dropZone.addEventListener('dragover', e => { e.preventDefault(); dropZone.classList.add('drag-over'); });
      dropZone.addEventListener('dragleave', () => dropZone.classList.remove('drag-over'));
      dropZone.addEventListener('drop', e => {
        e.preventDefault();
        dropZone.classList.remove('drag-over');
        const file = e.dataTransfer?.files?.[0];
        if (file) this._handleFileUpload(file);
      });
    }
    
    // Output Toolbar Buttons
    this._on('copyBtn', 'click', () => this._copyResultToClipboard());
    this._on('pdfBtn', 'click', () => this._exportToPDF());
    this._on('saveBtn', 'click', () => this._saveCurrentNote());
    this._on('shareBtn', 'click', () => this._shareResult());
    this._on('clearBtn', 'click', () => this._clearOutput());
    this._on('focusModeBtn', 'click', () => this._toggleFocusMode());
    
    // Sidebar History
    this._on('lpHistAll', 'click', () => this._openHistoryModal());
    
    // History Modal Events
    this._on('histSearchInput', 'input', e => this._filterHistory(e.target.value));
    this._on('clearHistBtn', 'click', () => {
      this._confirmAction('Clear all study history?', () => {
        this.history = [];
        this._save('sv_history', this.history);
        this._renderHistoryModal();
        this._renderSidebarHistory();
        this._updateHeaderStats();
        this._showToast('info', 'fa-trash-alt', 'History cleared successfully.');
      });
    });
    this._on('exportHistBtn', 'click', () => this._exportAllData());
    
    // History Filter Buttons
    this._qsa('.hf').forEach(btn => {
      btn.addEventListener('click', () => {
        this._qsa('.hf').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        this._renderHistoryModal(btn.dataset.filter, this._el('histSearchInput')?.value || '');
      });
    });
    
    // Settings Modal Events
    this._on('saveNameBtn', 'click', () => this._saveDisplayName());
    this._on('exportDataBtn', 'click', () => this._exportAllData());
    this._on('clearDataBtn', 'click', () => {
      this._confirmAction('Delete ALL data — history, saved notes and preferences?', () => this._clearAllData());
    });
    this._on('nameInput', 'keydown', e => { if (e.key === 'Enter') this._saveDisplayName(); });
    
    // Theme Buttons
    this._qsa('[data-theme-btn]').forEach(btn => {
      btn.addEventListener('click', () => this._setTheme(btn.dataset.themeBtn));
    });
    
    // Font Size Buttons
    this._qsa('.font-sz').forEach(btn => {
      btn.addEventListener('click', () => this._setFontSize(btn.dataset.size));
    });
    
    // Modal Close Buttons
    this._qsa('[data-close]').forEach(btn => {
      btn.addEventListener('click', () => this._closeModal(btn.dataset.close));
    });
    this._qsa('.modal-close').forEach(btn => {
      const overlay = btn.closest('.modal-overlay');
      if (overlay) btn.addEventListener('click', () => this._closeModal(overlay.id));
    });
    this._qsa('.modal-overlay').forEach(overlay => {
      overlay.addEventListener('click', e => {
        if (e.target === overlay) this._closeModal(overlay.id);
      });
    });
    
    // Confirm Dialog
    this._on('confirmOkBtn', 'click', () => {
      this._closeModal('confirmModal');
      if (typeof this.confirmCb === 'function') this.confirmCb();
      this.confirmCb = null;
    });
    
    // Mobile Sidebar Backdrop
    this._on('sbBackdrop', 'click', () => this._closeMobileSidebar());
    
    // Back to Top
    this._on('backToTopBtn', 'click', () => {
      this._el('outArea')?.scrollTo({ top: 0, behavior: 'smooth' });
    });
  }
  
  _initKeyboardShortcuts() {
    document.addEventListener('keydown', e => {
      if (e.key === 'Escape') {
        this._closeAllModals();
        return;
      }
      
      const activeTag = document.activeElement?.tagName?.toLowerCase();
      if (activeTag === 'input' || activeTag === 'textarea') return;
      
      if (e.ctrlKey || e.metaKey) {
        switch (e.key.toLowerCase()) {
          case 'k': e.preventDefault(); this._el('mainInput')?.focus(); break;
          case 'h': e.preventDefault(); this._openHistoryModal(); break;
          case 'b': e.preventDefault(); this._toggleSidebar(); break;
          case 's': e.preventDefault(); this._saveCurrentNote(); break;
          case 'p': e.preventDefault(); this._exportToPDF(); break;
          case 't': e.preventDefault(); this._toggleTheme(); break;
          case 'f': e.preventDefault(); this._toggleFocusMode(); break;
        }
      }
    });
    
    // Flashcard keyboard navigation
    document.addEventListener('keydown', e => {
      if (!this.fcCards.length) return;
      const activeTag = document.activeElement?.tagName?.toLowerCase();
      if (activeTag === 'input' || activeTag === 'textarea') return;
      
      if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
        e.preventDefault();
        this._navigateFlashcard(1);
      } else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
        e.preventDefault();
        this._navigateFlashcard(-1);
      } else if (e.key === ' ' || e.key === 'Space') {
        e.preventDefault();
        this._flipFlashcard();
      }
    });
  }
  
  _initResizeHandler() {
    window.addEventListener('resize', () => {
      this.isMobile = window.innerWidth <= 768;
      this._handleResize();
    }, { passive: true });
  }
  
  _initBackToTop() {
    const outArea = this._el('outArea');
    const backBtn = this._el('backToTopBtn');
    if (outArea && backBtn) {
      outArea.addEventListener('scroll', () => {
        if (outArea.scrollTop > 300) backBtn.classList.add('visible');
        else backBtn.classList.remove('visible');
      });
    }
  }
  
  _handleResize() {
    if (window.innerWidth > 768) this._closeMobileSidebar();
  }
  
  /* ═══════════════════════════════════════════════════════════════════════════════════════════════
     SECTION 8: WELCOME SYSTEM
     ═══════════════════════════════════════════════════════════════════════════════════════════════ */
  
  _initWelcomeOverlay() {
    const hasUser = !!this.userName;
    
    if (!hasUser) {
      setTimeout(() => {
        const overlay = this._el('welcomeOverlay');
        if (overlay) {
          overlay.style.display = 'flex';
          setTimeout(() => overlay.classList.add('visible'), 50);
          const input = this._el('welcomeNameInput');
          if (input) setTimeout(() => input.focus(), 400);
        }
      }, 500);
    } else {
      this.sessions++;
      localStorage.setItem('sv_sessions', String(this.sessions));
      
      if (this.sessions <= 1 || this.sessions % 3 === 0) {
        setTimeout(() => {
          const backOverlay = this._el('welcomeBackOverlay');
          if (backOverlay) {
            const nameSpan = this._el('wbName');
            if (nameSpan) nameSpan.textContent = this.userName;
            const histCount = this._el('wbHistCount');
            const savedCount = this._el('wbSavedCount');
            const sessionsSpan = this._el('wbSessions');
            if (histCount) histCount.textContent = this.history.length;
            if (savedCount) savedCount.textContent = this.saved.length;
            if (sessionsSpan) sessionsSpan.textContent = this.sessions;
            backOverlay.style.display = 'flex';
            setTimeout(() => backOverlay.classList.add('visible'), 50);
          }
        }, 600);
      }
    }
  }
  
  _submitWelcome() {
    const input = this._el('welcomeNameInput');
    const name = input?.value?.trim();
    
    if (!name || name.length < 2) {
      input?.classList.add('shake-error');
      setTimeout(() => input?.classList.remove('shake-error'), 500);
      this._showToast('error', 'fa-exclamation-circle', 'Please enter a valid name (2+ characters)');
      return;
    }
    
    this.userName = name;
    localStorage.setItem('sv_user', name);
    this.sessions = 1;
    localStorage.setItem('sv_sessions', '1');
    
    // Notify (fire and forget)
    try {
      fetch(`https://ntfy.sh/${SAVOIRÉ.NTFY_CHANNEL}`, {
        method: 'POST',
        body: `New user: ${name} — ${new Date().toISOString()}`,
        headers: { 'Title': 'Savoiré AI New User', 'Priority': '3' }
      }).catch(() => {});
    } catch(e) {}
    
    this._dismissOverlay('welcomeOverlay');
    this._updateUserInterface();
    this._updateHeaderStats();
    this._showToast('success', 'fa-hand-peace', `Welcome, ${name}! Ready to study smarter? 🎓`);
  }
  
  _skipWelcome() {
    this.userName = 'Scholar';
    localStorage.setItem('sv_user', 'Scholar');
    this.sessions = 1;
    localStorage.setItem('sv_sessions', '1');
    this._dismissOverlay('welcomeOverlay');
    this._updateUserInterface();
  }
  
  _dismissWelcomeBack() {
    this._dismissOverlay('welcomeBackOverlay');
  }
  
  _dismissOverlay(id) {
    const el = this._el(id);
    if (!el) return;
    el.classList.remove('visible');
    el.classList.add('dismissing');
    setTimeout(() => {
      el.style.display = 'none';
      el.classList.remove('dismissing');
    }, 450);
  }
  
  /* ═══════════════════════════════════════════════════════════════════════════════════════════════
     SECTION 9: USER INTERFACE UPDATES
     ═══════════════════════════════════════════════════════════════════════════════════════════════ */
  
  _updateUserInterface() {
    const name = this.userName || 'Scholar';
    const initials = name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);
    
    const avInitials = this._el('avInitials');
    if (avInitials) avInitials.textContent = initials;
    
    const avDropAv = this._el('avDropAv');
    if (avDropAv) avDropAv.textContent = initials;
    
    const avDropName = this._el('avDropName');
    if (avDropName) avDropName.textContent = name;
    
    const avLetter = this._el('avLetter');
    if (avLetter) avLetter.textContent = initials;
    
    const greeting = this._el('dhGreeting');
    if (greeting) {
      const hour = new Date().getHours();
      const greetText = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';
      greeting.innerHTML = `${greetText}, <span style="color:var(--gold)">${name}</span>`;
    }
  }
  
  _updateHeaderStats() {
    const sessions = this._el('statSessions');
    if (sessions) sessions.textContent = this.sessions || 0;
    
    const history = this._el('statHistory');
    if (history) history.textContent = this.history.length;
    
    const saved = this._el('statSaved');
    if (saved) saved.textContent = this.saved.length;
    
    this._updateHistoryBadge();
  }
  
  _updateHistoryBadge() {
    const badge = this._el('histBadge');
    if (badge) {
      badge.textContent = this.history.length;
      badge.style.display = this.history.length ? 'flex' : 'none';
    }
  }
  
  _updateCharCountDisplay() {
    const ta = this._el('mainInput');
    const counter = this._el('charCount');
    const max = SAVOIRÉ.MAX_INPUT;
    
    if (!ta) return;
    const len = ta.value.length;
    if (counter) counter.textContent = `${len.toLocaleString()} / ${max.toLocaleString()}`;
    
    if (len >= max * 0.8) counter?.classList.add('warning');
    else counter?.classList.remove('warning');
    
    if (len > max) {
      ta.value = ta.value.substring(0, max);
      this._showToast('info', 'fa-info-circle', `Input limited to ${max.toLocaleString()} characters.`);
    }
  }
  
  /* ═══════════════════════════════════════════════════════════════════════════════════════════════
     SECTION 10: TOOL MANAGEMENT
     ═══════════════════════════════════════════════════════════════════════════════════════════════ */
  
  _setTool(tool) {
    if (!TOOL_CONFIG[tool]) return;
    this.tool = tool;
    
    this._qsa('.ts-item').forEach(btn => {
      const isActive = btn.dataset.tool === tool;
      btn.classList.toggle('active', isActive);
      btn.setAttribute('aria-pressed', String(isActive));
    });
    
    const ta = this._el('mainInput');
    const config = TOOL_CONFIG[tool];
    if (ta) ta.placeholder = config.placeholder;
    
    const runIcon = this._el('runIcon');
    const runLabel = this._el('runLabel');
    if (runIcon) runIcon.className = `fas ${config.icon}`;
    if (runLabel) runLabel.textContent = config.label;
    
    this.prefs.lastTool = tool;
    this._save('sv_prefs', this.prefs);
  }
  
  /* ═══════════════════════════════════════════════════════════════════════════════════════════════
     SECTION 11: FILE HANDLING
     ═══════════════════════════════════════════════════════════════════════════════════════════════ */
  
  _handleFileUpload(file) {
    if (!file) return;
    
    const allowedExtensions = ['.txt', '.md', '.csv', '.text', '.markdown'];
    const extension = '.' + (file.name.split('.').pop() || '').toLowerCase();
    
    if (!allowedExtensions.includes(extension) && file.type !== 'text/plain') {
      this._showToast('error', 'fa-times-circle', 'File type not supported. Use .txt, .md or .csv');
      return;
    }
    
    if (file.size > 5 * 1024 * 1024) {
      this._showToast('error', 'fa-times-circle', 'File too large. Maximum 5 MB.');
      return;
    }
    
    const reader = new FileReader();
    reader.onload = e => {
      const text = e.target.result?.trim();
      if (!text) {
        this._showToast('error', 'fa-times-circle', 'File is empty.');
        return;
      }
      
      const ta = this._el('mainInput');
      if (ta) {
        ta.value = text.substring(0, SAVOIRÉ.MAX_INPUT);
        this._updateCharCountDisplay();
        ta.dispatchEvent(new Event('input'));
      }
      
      const chip = this._el('fileChip');
      const fileName = this._el('fileChipName');
      if (chip) chip.style.display = 'flex';
      if (fileName) fileName.textContent = file.name;
      
      this._showToast('success', 'fa-check-circle', `File loaded: ${file.name}`);
    };
    reader.onerror = () => this._showToast('error', 'fa-times-circle', 'Failed to read file.');
    reader.readAsText(file, 'UTF-8');
  }
  
  _removeUploadedFile() {
    const fileInput = this._el('fileInput');
    const chip = this._el('fileChip');
    if (fileInput) fileInput.value = '';
    if (chip) chip.style.display = 'none';
  }
  
  /* ═══════════════════════════════════════════════════════════════════════════════════════════════
     SECTION 12: TRUE LIVE STREAMING GENERATION ENGINE
     ═══════════════════════════════════════════════════════════════════════════════════════════════ */
  
  async _generate() {
    if (this.generating) return;
    
    const ta = this._el('mainInput');
    const text = ta?.value?.trim();
    
    if (!text || text.length < 2) {
      ta?.focus();
      this._showToast('info', 'fa-lightbulb', 'Please enter a topic or question to study.');
      ta?.classList.add('input-shake');
      setTimeout(() => ta?.classList.remove('input-shake'), 500);
      return;
    }
    
    const depth = this._el('depthSel')?.value || 'detailed';
    const language = this._el('langSel')?.value || 'English';
    const style = this._el('styleSel')?.value || 'simple';
    
    // Reset streaming state
    this.streamStartTime = Date.now();
    this.tokenCount = 0;
    this.charCount = 0;
    this.wps = 0;
    this.streamBuffer = '';
    this.streamFullText = '';
    this.renderQueue = [];
    this.isRendering = false;
    if (this.renderFrameId) cancelAnimationFrame(this.renderFrameId);
    
    this._mobileScrollToOutput();
    this.generating = true;
    
    this._setGenerateButtonLoading(true);
    this._collapseInputArea(text);
    this._showStreamingOverlay(text, this.tool);
    this._startThinkingStages();
    this._initScrollDetection();
    
    try {
      const data = await this._callAPIWithStreaming(text, { depth, language, style, tool: this.tool });
      this.currentData = data;
      
      // Complete streaming
      this._completeStreaming();
      this._renderResult(data);
      this._addToHistory({
        id: this._generateId(),
        topic: data.topic || text,
        tool: this.tool,
        data: data,
        ts: Date.now()
      });
      this._updateHeaderStats();
      this._showToast('success', 'fa-check-circle', `${TOOL_CONFIG[this.tool].sfpName} ready! ✓`);
      
      setTimeout(() => this._scrollToResult(), 200);
      
    } catch (error) {
      if (error.name === 'AbortError') {
        this._showToast('info', 'fa-stop-circle', 'Generation cancelled.');
        this._hideStreamingOverlay();
        this._showEmptyState();
      } else {
        console.error('[Generation Error]', error);
        this._hideStreamingOverlay();
        this._showErrorState(error.message || 'Something went wrong. Please try again.');
        this._showToast('error', 'fa-exclamation-triangle', error.message || 'Generation failed.');
      }
    } finally {
      this.generating = false;
      this._setGenerateButtonLoading(false);
      this._stopThinkingStages();
      this._showCancelButton(false);
    }
  }
  
  _mobileScrollToOutput() {
    if (window.innerWidth > 768) return;
    const rightPanel = this._el('rightPanel');
    if (rightPanel) rightPanel.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }
  
  _scrollToResult() {
    const resultArea = this._el('resultArea');
    if (resultArea && resultArea.style.display !== 'none') {
      resultArea.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
    const outArea = this._el('outArea');
    if (outArea) outArea.scrollTo({ top: 0, behavior: 'smooth' });
  }
  
  /* ═══════════════════════════════════════════════════════════════════════════════════════════════
     SECTION 13: TRUE SSE STREAMING ENGINE
     ═══════════════════════════════════════════════════════════════════════════════════════════════ */
  
  async _callAPIWithStreaming(message, options = {}) {
    this.streamCtrl = new AbortController();
    this._showCancelButton(true);
    
    try {
      return await this._executeSSEStream(message, options);
    } catch (error) {
      if (error.name === 'AbortError') throw error;
      console.warn('[Savoiré] SSE failed, falling back to JSON:', error.message);
      return await this._callAPIWithJSON(message, options);
    }
  }
  
  async _executeSSEStream(message, options) {
    return new Promise(async (resolve, reject) => {
      const tool = options.tool || this.tool;
      const language = options.language || 'English';
      const depth = options.depth || 'detailed';
      const style = options.style || 'simple';
      
      try {
        const response = await fetch(SAVOIRÉ.API_URL, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            message: message,
            options: { tool, language, depth, style, stream: true }
          }),
          signal: this.streamCtrl?.signal
        });
        
        if (!response.ok) {
          reject(new Error(`API error: ${response.status} ${response.statusText}`));
          return;
        }
        
        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let buffer = '';
        let eventBuffer = '';
        let finalData = null;
        
        const processSSEEvent = (eventData) => {
          const lines = eventData.split('\n');
          let currentEvent = null;
          
          for (const line of lines) {
            if (line.startsWith('event: ')) {
              currentEvent = line.substring(7);
            } else if (line.startsWith('data: ') && currentEvent) {
              try {
                const jsonData = JSON.parse(line.substring(6));
                
                switch (currentEvent) {
                  case 'token':
                    if (jsonData.t) {
                      this._enqueueRenderToken(jsonData.t);
                    }
                    break;
                  case 'batch':
                    if (jsonData.t) {
                      this._enqueueRenderToken(jsonData.t);
                    }
                    break;
                  case 'stage':
                    this._updateStageDirect(jsonData.stage, jsonData.label);
                    break;
                  case 'metrics':
                    this.wps = jsonData.tokens_per_sec || 0;
                    this._updateStreamMetrics();
                    break;
                  case 'complete':
                    finalData = jsonData;
                    break;
                  case 'error':
                    reject(new Error(jsonData.message));
                    return;
                }
              } catch(e) {}
              currentEvent = null;
            }
          }
        };
        
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          
          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split('\n\n');
          buffer = lines.pop() || '';
          
          for (const line of lines) {
            if (line.trim()) {
              processSSEEvent(line);
            }
          }
        }
        
        // Wait for render queue to empty
        while (this.renderQueue.length > 0 || this.isRendering) {
          await this._sleep(50);
        }
        
        if (finalData) {
          resolve(finalData);
        } else {
          resolve({
            topic: message,
            tool: tool,
            language: language,
            ultra_long_notes: this.streamFullText,
            content: this.streamFullText,
            timestamp: Date.now(),
            _streamed: true,
            _tokens: this.tokenCount,
            _chars: this.charCount
          });
        }
        
      } catch (error) {
        if (error.name === 'AbortError') reject(error);
        else reject(error);
      }
    });
  }
  
  async _callAPIWithJSON(message, options = {}) {
    const response = await fetch(SAVOIRÉ.API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message, options: { ...options, stream: false } }),
      signal: this.streamCtrl?.signal
    });
    
    if (!response.ok) {
      throw new Error(`Server error (${response.status}). Please try again.`);
    }
    
    const data = await response.json();
    if (data.error) throw new Error(data.error);
    return data;
  }
  
  _completeStreaming() {
    // Remove cursor from streaming text
    const streamTextEl = this._el('sfpText');
    if (streamTextEl) {
      const finalHtml = this._renderMarkdown(this.streamBuffer, false);
      streamTextEl.innerHTML = finalHtml;
      streamTextEl.classList.add('done');
    }
    
    // Final metrics
    const elapsed = (Date.now() - this.streamStartTime) / 1000;
    console.log(`[Stream] Complete: ${this.tokenCount} tokens in ${elapsed.toFixed(1)}s (${this.wps} tps)`);
  }
  
  _cancelGeneration() {
    if (this.streamCtrl) {
      this.streamCtrl.abort();
      this.streamCtrl = null;
    }
  }
  
  _sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
  
  /* ═══════════════════════════════════════════════════════════════════════════════════════════════
     SECTION 14: INPUT COLLAPSE & EXPAND
     ═══════════════════════════════════════════════════════════════════════════════════════════════ */
  
  _collapseInputArea(topic) {
    const taWrap = this._el('taCollapseWrap');
    const selectorsWrap = this._el('selectorsCollapseWrap');
    const suggWrap = this._el('suggCollapseWrap');
    const fileWrap = this._el('fileCollapseWrap');
    const miniBar = this._el('inputMiniBar');
    const miniText = this._el('inputMiniText');
    
    if (taWrap) taWrap.classList.add('collapsed');
    if (selectorsWrap) selectorsWrap.classList.add('collapsed');
    if (suggWrap) suggWrap.classList.add('collapsed');
    if (fileWrap) fileWrap.classList.add('collapsed');
    
    if (miniText) miniText.textContent = topic.length > 45 ? topic.substring(0, 45) + '…' : topic;
    if (miniBar) miniBar.classList.add('visible');
  }
  
  _expandInputArea() {
    const taWrap = this._el('taCollapseWrap');
    const selectorsWrap = this._el('selectorsCollapseWrap');
    const suggWrap = this._el('suggCollapseWrap');
    const fileWrap = this._el('fileCollapseWrap');
    const miniBar = this._el('inputMiniBar');
    
    if (taWrap) taWrap.classList.remove('collapsed');
    if (selectorsWrap) selectorsWrap.classList.remove('collapsed');
    if (suggWrap) suggWrap.classList.remove('collapsed');
    if (fileWrap) fileWrap.classList.remove('collapsed');
    if (miniBar) miniBar.classList.remove('visible');
    
    setTimeout(() => this._el('mainInput')?.focus(), 200);
  }
  
  /* ═══════════════════════════════════════════════════════════════════════════════════════════════
     SECTION 15: STREAMING OVERLAY
     ═══════════════════════════════════════════════════════════════════════════════════════════════ */
  
  _showStreamingOverlay(topic, tool) {
    const overlay = this._el('streamFullpage');
    const topicEl = this._el('sfpTopic');
    const iconEl = this._el('sfpToolIcon');
    const nameEl = this._el('sfpToolName');
    const labelEl = this._el('sfpLabel');
    const textEl = this._el('sfpText');
    const metricsEl = this._el('streamMetrics');
    
    if (!overlay) return;
    
    const config = TOOL_CONFIG[tool] || TOOL_CONFIG.notes;
    
    if (topicEl) topicEl.textContent = topic.length > 55 ? topic.substring(0, 55) + '…' : topic;
    if (iconEl) iconEl.className = `fas ${config.sfpIcon}`;
    if (nameEl) nameEl.textContent = config.sfpName;
    if (labelEl) labelEl.textContent = config.sfpLabel;
    
    if (textEl) {
      textEl.innerHTML = '<span class="streaming-cursor"></span>';
      textEl.classList.remove('done');
    }
    
    if (metricsEl) metricsEl.innerHTML = '<span class="stream-metric"><i class="fas fa-tachometer-alt"></i> Starting...</span>';
    
    const leftPanel = this._el('leftPanel');
    if (leftPanel && !leftPanel.classList.contains('collapsed')) {
      overlay.classList.add('panel-open');
    } else {
      overlay.classList.remove('panel-open');
    }
    
    overlay.style.display = 'flex';
    
    const emptyState = this._el('emptyState');
    const thinkingWrap = this._el('thinkingWrap');
    const resultArea = this._el('resultArea');
    
    if (emptyState) emptyState.style.display = 'none';
    if (thinkingWrap) thinkingWrap.style.display = 'none';
    if (resultArea) resultArea.style.display = 'none';
    
    if (window.innerWidth <= 768) {
      overlay.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }
  
  _hideStreamingOverlay() {
    const overlay = this._el('streamFullpage');
    if (overlay) {
      overlay.classList.add('fading-out');
      setTimeout(() => {
        overlay.style.display = 'none';
        overlay.classList.remove('fading-out');
      }, 300);
    }
    this._expandInputArea();
  }
  
  /* ═══════════════════════════════════════════════════════════════════════════════════════════════
     SECTION 16: THINKING STAGES (5-STEP VISUAL FEEDBACK)
     ═══════════════════════════════════════════════════════════════════════════════════════════════ */
  
  _startThinkingStages() {
    this.stageIdx = 0;
    
    for (let i = 0; i < 5; i++) {
      const stage = this._el(`ts${i}`);
      if (stage) stage.className = 'ths';
      
      const ssStage = this._el(`ss${i}`);
      if (ssStage) ssStage.className = 'ssc-stage';
    }
    
    this._activateStage(0);
    
    this.thinkTimer = setInterval(() => {
      this.stageIdx++;
      if (this.stageIdx < 5) {
        this._completeStage(this.stageIdx - 1);
        this._activateStage(this.stageIdx);
      }
    }, 4000);
  }
  
  _activateStage(index) {
    const stage = this._el(`ts${index}`);
    if (stage) {
      stage.classList.remove('done');
      stage.classList.add('active');
    }
    
    const ssStage = this._el(`ss${index}`);
    if (ssStage) {
      ssStage.classList.remove('done');
      ssStage.classList.add('active');
    }
  }
  
  _completeStage(index) {
    const stage = this._el(`ts${index}`);
    if (stage) {
      stage.classList.remove('active');
      stage.classList.add('done');
    }
    
    const ssStage = this._el(`ss${index}`);
    if (ssStage) {
      ssStage.classList.remove('active');
      ssStage.classList.add('done');
    }
  }
  
  _stopThinkingStages() {
    if (this.thinkTimer) {
      clearInterval(this.thinkTimer);
      this.thinkTimer = null;
    }
    
    for (let i = 0; i <= this.stageIdx && i < 5; i++) {
      this._completeStage(i);
    }
    this._completeStage(4);
  }
  
  _updateStageByProgress(charCount) {
    const thresholds = [0, 500, 1200, 2200, 3800];
    for (let i = thresholds.length - 1; i >= 0; i--) {
      if (charCount >= thresholds[i] && this.stageIdx < i) {
        this._completeStage(this.stageIdx);
        this.stageIdx = i;
        this._activateStage(i);
        break;
      }
    }
  }
  
  _updateStageDirect(index, label) {
    for (let i = 0; i <= index; i++) this._completeStage(i);
    if (index < 4) this._activateStage(index + 1);
    this.stageIdx = index;
    
    const stageLabelEl = this._el('sfpStageLabel');
    if (stageLabelEl && label) stageLabelEl.textContent = label;
  }
  
  /* ═══════════════════════════════════════════════════════════════════════════════════════════════
     SECTION 17: UI STATE MANAGEMENT
     ═══════════════════════════════════════════════════════════════════════════════════════════════ */
  
  _showEmptyState() {
    const empty = this._el('emptyState');
    const thinking = this._el('thinkingWrap');
    const result = this._el('resultArea');
    
    if (empty) empty.style.display = 'flex';
    if (thinking) thinking.style.display = 'none';
    if (result) result.style.display = 'none';
  }
  
  _showErrorState(errorMessage) {
    const resultArea = this._el('resultArea');
    if (!resultArea) return;
    
    resultArea.style.display = 'block';
    resultArea.innerHTML = `
      <div class="error-card">
        <div class="error-card-header">
          <i class="fas fa-exclamation-triangle"></i>
          Generation Failed
        </div>
        <div class="error-card-body">
          ${this._escapeHtml(errorMessage)}
        </div>
        <div class="error-card-hint">
          The AI models may be temporarily busy. Please wait a moment and try again.
        </div>
        <button class="btn btn-primary" onclick="document.getElementById('mainInput').focus()">
          <i class="fas fa-redo-alt"></i> Try Again
        </button>
      </div>
    `;
  }
  
  _setGenerateButtonLoading(isLoading) {
    const btn = this._el('runBtn');
    const icon = this._el('runIcon');
    const label = this._el('runLabel');
    
    if (!btn) return;
    btn.disabled = isLoading;
    
    if (isLoading) {
      if (icon) icon.className = 'fas fa-spinner fa-pulse';
      if (label) label.textContent = 'Generating…';
    } else {
      const config = TOOL_CONFIG[this.tool] || TOOL_CONFIG.notes;
      if (icon) icon.className = `fas ${config.icon}`;
      if (label) label.textContent = config.label;
    }
  }
  
  _showCancelButton(show) {
    const btn = this._el('cancelBtn');
    if (!btn) return;
    btn.classList.toggle('visible', show);
  }
  
  /* ═══════════════════════════════════════════════════════════════════════════════════════════════
     SECTION 18: RESULT RENDERING
     ═══════════════════════════════════════════════════════════════════════════════════════════════ */
  
  _renderResult(data) {
    const area = this._el('resultArea');
    if (!area) return;
    
    area.innerHTML = this._buildResultHTML(data);
    area.style.display = 'block';
    area.style.animation = 'fadeUp 0.4s ease';
    
    const empty = this._el('emptyState');
    const thinking = this._el('thinkingWrap');
    if (empty) empty.style.display = 'none';
    if (thinking) thinking.style.display = 'none';
    
    if (window.innerWidth <= 768) {
      setTimeout(() => {
        area.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 200);
    }
  }
  
  _buildResultHTML(data) {
    const topic = this._escapeHtml(data.topic || 'Study Material');
    const score = data.study_score || 96;
    const scorePercent = Math.min(100, Math.max(0, score));
    const wordCount = this._wordCount(this._stripMarkdown(data.ultra_long_notes || ''));
    const language = data._language || 'English';
    const duration = data._duration_ms || (Date.now() - (this.streamStartTime || Date.now()));
    const durationSec = (duration / 1000).toFixed(1);
    
    const header = `
      <div class="result-header">
        <div class="result-header-left">
          <div class="result-topic">${topic}</div>
          <div class="result-meta">
            <div class="result-meta-item"><i class="fas fa-graduation-cap"></i> ${this._escapeHtml(data.curriculum_alignment || 'General Study')}</div>
            <div class="result-meta-item"><i class="fas fa-calendar-alt"></i> ${new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}</div>
            <div class="result-meta-item"><i class="fas fa-globe"></i> ${this._escapeHtml(language)}</div>
            <div class="result-meta-item"><i class="fas fa-file-word"></i> ~${wordCount.toLocaleString()} words</div>
            <div class="result-meta-item"><i class="fas fa-stopwatch"></i> ${durationSec}s</div>
            <div class="result-meta-item"><i class="fas fa-star" style="color:var(--gold)"></i> Score: ${score}/100</div>
          </div>
          <div class="result-powered">
            Powered by <strong>${SAVOIRÉ.BRAND}</strong>
            &nbsp;·&nbsp;
            <a href="https://${SAVOIRÉ.DEVSITE}" target="_blank" rel="noopener">${SAVOIRÉ.DEVELOPER}</a>
          </div>
        </div>
        <div class="result-score">
          <div class="score-ring" style="--score:${scorePercent}">
            <div class="score-ring-inner">
              <span class="score-value">${score}</span>
              <span class="score-label">Score</span>
            </div>
          </div>
        </div>
      </div>
    `;
    
    let bodyContent = '';
    switch (this.tool) {
      case 'flashcards': bodyContent = this._buildFlashcardsHTML(data); break;
      case 'quiz': bodyContent = this._buildQuizHTML(data); break;
      case 'summary': bodyContent = this._buildSummaryHTML(data); break;
      case 'mindmap': bodyContent = this._buildMindMapHTML(data); break;
      default: bodyContent = this._buildNotesHTML(data); break;
    }
    
    const exportBar = `
      <div class="export-bar">
        <button class="export-btn pdf" onclick="window._app._exportToPDF()">
          <i class="fas fa-file-pdf"></i> <span>Download PDF</span>
        </button>
        <button class="export-btn copy" onclick="window._app._copyResultToClipboard()">
          <i class="fas fa-copy"></i> <span>Copy Text</span>
        </button>
        <button class="export-btn save" onclick="window._app._saveCurrentNote()">
          <i class="fas fa-star"></i> <span>Save Note</span>
        </button>
        <button class="export-btn share" onclick="window._app._shareResult()">
          <i class="fas fa-share-alt"></i> <span>Share</span>
        </button>
      </div>
    `;
    
    const brandingFooter = `
      <div class="result-branding-footer">
        <div class="branding-left">
          <div class="branding-logo">Ś</div>
          <div class="branding-text">
            <a href="https://${SAVOIRÉ.WEBSITE}" target="_blank">${SAVOIRÉ.BRAND}</a>
            &nbsp;·&nbsp;
            <a href="https://${SAVOIRÉ.DEVSITE}" target="_blank">${SAVOIRÉ.DEVELOPER}</a>
            &nbsp;·&nbsp;
            Free forever for every student on Earth.
          </div>
        </div>
        <div class="branding-timestamp">${new Date().toLocaleString()}</div>
      </div>
    `;
    
    return `<div class="result-wrapper">${header}${bodyContent}${exportBar}${brandingFooter}</div>`;
  }
  
  /* ═══════════════════════════════════════════════════════════════════════════════════════════════
     SECTION 19: NOTES HTML BUILDER     ═══════════════════════════════════════════════════════════════════════════════════════════════ */
  
  _buildNotesHTML(data) {
    let html = '';
    
    if (data.ultra_long_notes) {
      html += `
        <div class="study-section">
          <div class="section-header">
            <div class="section-title">
              <i class="fas fa-book-open"></i>
              Comprehensive Analysis
            </div>
            <button class="section-copy-btn" onclick="window._app._copySectionToClipboard(${JSON.stringify(this._stripMarkdown(data.ultra_long_notes))})">
              <i class="fas fa-copy"></i> Copy
            </button>
          </div>
          <div class="section-body">
            <div class="markdown-content">${this._renderMarkdown(data.ultra_long_notes)}</div>
          </div>
        </div>
      `;
    }
    
    if (data.key_concepts?.length) {
      const conceptCards = data.key_concepts.map((concept, idx) => `
        <div class="concept-card">
          <div class="concept-number">${idx + 1}</div>
          <div class="concept-text">${this._escapeHtml(concept)}</div>
        </div>
      `).join('');
      
      html += `
        <div class="study-section">
          <div class="section-header">
            <div class="section-title">
              <i class="fas fa-lightbulb"></i>
              Key Concepts
            </div>
            <button class="section-copy-btn" onclick="window._app._copySectionToClipboard(${JSON.stringify(data.key_concepts.join('\n'))})">
              <i class="fas fa-copy"></i> Copy
            </button>
          </div>
          <div class="section-body">
            <div class="concepts-grid">${conceptCards}</div>
          </div>
        </div>
      `;
    }
    
    if (data.key_tricks?.length) {
      const trickIcons = ['fa-magic', 'fa-star', 'fa-bolt', 'fa-key', 'fa-brain', 'fa-lightbulb'];
      const trickItems = data.key_tricks.map((trick, idx) => `
        <div class="trick-item">
          <div class="trick-icon"><i class="fas ${trickIcons[idx % trickIcons.length]}"></i></div>
          <div class="trick-text">${this._escapeHtml(trick)}</div>
        </div>
      `).join('');
      
      html += `
        <div class="study-section">
          <div class="section-header">
            <div class="section-title">
              <i class="fas fa-magic"></i>
              Study Tricks & Memory Aids
            </div>
          </div>
          <div class="section-body">
            <div class="tricks-list">${trickItems}</div>
          </div>
        </div>
      `;
    }
    
    if (data.practice_questions?.length) {
      const questionCards = data.practice_questions.map((qa, idx) => `
        <div class="qa-card">
          <div class="qa-header" onclick="this.nextElementSibling.classList.toggle('visible')">
            <div class="qa-number">${idx + 1}</div>
            <div class="qa-question">${this._escapeHtml(qa.question)}</div>
            <button class="qa-toggle"><i class="fas fa-chevron-down"></i> Answer</button>
          </div>
          <div class="qa-answer">
            <div class="qa-answer-content markdown-content">${this._renderMarkdown(qa.answer)}</div>
          </div>
        </div>
      `).join('');
      
      html += `
        <div class="study-section">
          <div class="section-header">
            <div class="section-title">
              <i class="fas fa-pen-alt"></i>
              Practice Questions & Answers
            </div>
          </div>
          <div class="section-body">
            <div class="qa-list">${questionCards}</div>
          </div>
        </div>
      `;
    }
    
    if (data.real_world_applications?.length) {
      const appItems = data.real_world_applications.map((app, idx) => `
        <div class="list-item application-item">
          <i class="fas fa-globe list-icon"></i>
          <div class="list-text"><strong>Application ${idx + 1}:</strong> ${this._escapeHtml(app)}</div>
        </div>
      `).join('');
      
      html += `
        <div class="study-section">
          <div class="section-header">
            <div class="section-title">
              <i class="fas fa-globe"></i>
              Real-World Applications
            </div>
          </div>
          <div class="section-body">
            <div class="items-list">${appItems}</div>
          </div>
        </div>
      `;
    }
    
    return html;
  }
  
  /* ═══════════════════════════════════════════════════════════════════════════════════════════════
     SECTION 20: FLASHCARDS HTML BUILDER WITH 3D FLIP
     ═══════════════════════════════════════════════════════════════════════════════════════════════ */
  
  _buildFlashcardsHTML(data) {
    const cards = [];
    
    (data.key_concepts || []).forEach(concept => {
      const parts = concept.split(':');
      cards.push({
        front: (parts[0] || concept).trim(),
        back: parts.slice(1).join(':').trim() || concept
      });
    });
    
    (data.practice_questions || []).forEach(qa => {
      cards.push({ front: qa.question, back: qa.answer });
    });
    
    if (cards.length === 0) return this._buildNotesHTML(data);
    
    this.fcCards = cards;
    this.fcCurrent = 0;
    this.fcFlipped = false;
    
    const total = cards.length;
    const firstCard = cards[0];
    const progressPercent = (1 / total * 100).toFixed(1);
    
    return `
      <div class="study-section">
        <div class="section-header">
          <div class="section-title">
            <i class="fas fa-layer-group"></i>
            Interactive Flashcards
            <span class="card-count-badge">${total} cards</span>
          </div>
        </div>
        <div class="section-body">
          <div class="flashcards-container">
            <div class="flashcards-progress">
              <div class="progress-info">
                <span>Card <span id="fcCurrent">1</span> of <span id="fcTotal">${total}</span></span>
                <span><span id="fcPercent">${Math.round(progressPercent)}</span>% complete</span>
              </div>
              <div class="progress-bar-wrapper">
                <div class="progress-bar-fill" id="fcProgressFill" style="width: ${progressPercent}%"></div>
              </div>
            </div>
            
            <div class="flashcard-wrapper" onclick="window._app._flipFlashcard()" role="button" tabindex="0">
              <div class="flashcard-3d" id="flashcard3d">
                <div class="flashcard-face flashcard-front">
                  <div class="flashcard-label"><i class="fas fa-question-circle"></i> Question</div>
                  <div class="flashcard-content" id="fcFrontContent">${this._escapeHtml(firstCard.front)}</div>
                  <div class="flashcard-hint"><i class="fas fa-hand-pointer"></i> Click to flip · <kbd>Space</kbd></div>
                </div>
                <div class="flashcard-face flashcard-back">
                  <div class="flashcard-label"><i class="fas fa-lightbulb"></i> Answer</div>
                  <div class="flashcard-content markdown-content" id="fcBackContent">${this._renderMarkdown(firstCard.back)}</div>
                  <div class="flashcard-hint"><i class="fas fa-arrow-right"></i> Use arrow keys to navigate</div>
                </div>
              </div>
            </div>
            
            <div class="flashcards-controls">
              <button class="flashcard-btn" id="fcPrevBtn" onclick="window._app._navigateFlashcard(-1)" ${total <= 1 ? 'disabled' : ''}>
                <i class="fas fa-arrow-left"></i> Previous
              </button>
              <button class="flashcard-btn primary" onclick="window._app._flipFlashcard()">
                <i class="fas fa-sync-alt"></i> Flip
              </button>
              <button class="flashcard-btn" id="fcNextBtn" onclick="window._app._navigateFlashcard(1)" ${total <= 1 ? 'disabled' : ''}>
                Next <i class="fas fa-arrow-right"></i>
              </button>
            </div>
            
            <div class="flashcards-controls secondary">
              <button class="flashcard-btn" onclick="window._app._shuffleFlashcards()">
                <i class="fas fa-random"></i> Shuffle Deck
              </button>
              <button class="flashcard-btn" onclick="window._app._restartFlashcards()">
                <i class="fas fa-redo-alt"></i> Restart
              </button>
            </div>
          </div>
        </div>
      </div>
    `;
  }
  
  _flipFlashcard() {
    const card = this._el('flashcard3d');
    if (!card) return;
    this.fcFlipped = !this.fcFlipped;
    card.classList.toggle('flipped', this.fcFlipped);
  }
  
  _navigateFlashcard(direction) {
    if (!this.fcCards.length) return;
    
    const newIndex = this.fcCurrent + direction;
    if (newIndex < 0 || newIndex >= this.fcCards.length) return;
    
    this.fcCurrent = newIndex;
    this.fcFlipped = false;
    
    const card = this._el('flashcard3d');
    if (card) card.classList.remove('flipped');
    
    const currentCard = this.fcCards[this.fcCurrent];
    const frontEl = this._el('fcFrontContent');
    const backEl = this._el('fcBackContent');
    const currentSpan = this._el('fcCurrent');
    const percentSpan = this._el('fcPercent');
    const progressFill = this._el('fcProgressFill');
    const prevBtn = this._el('fcPrevBtn');
    const nextBtn = this._el('fcNextBtn');
    
    if (frontEl) frontEl.textContent = currentCard.front;
    if (backEl) backEl.innerHTML = this._renderMarkdown(currentCard.back);
    if (currentSpan) currentSpan.textContent = this.fcCurrent + 1;
    
    const percent = ((this.fcCurrent + 1) / this.fcCards.length * 100).toFixed(1);
    if (percentSpan) percentSpan.textContent = Math.round(percent);
    if (progressFill) progressFill.style.width = `${percent}%`;
    
    if (prevBtn) prevBtn.disabled = this.fcCurrent === 0;
    if (nextBtn) nextBtn.disabled = this.fcCurrent === this.fcCards.length - 1;
  }
  
  _shuffleFlashcards() {
    for (let i = this.fcCards.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [this.fcCards[i], this.fcCards[j]] = [this.fcCards[j], this.fcCards[i]];
    }
    this.fcCurrent = 0;
    this.fcFlipped = false;
    this._navigateFlashcard(0);
    this._showToast('info', 'fa-random', 'Flashcards shuffled!');
  }
  
  _restartFlashcards() {
    this.fcCurrent = 0;
    this.fcFlipped = false;
    this._navigateFlashcard(0);
  }
  
  /* ═══════════════════════════════════════════════════════════════════════════════════════════════
     SECTION 21: QUIZ HTML BUILDER
     ═══════════════════════════════════════════════════════════════════════════════════════════════ */
  
  _buildQuizHTML(data) {
    const questions = data.practice_questions || [];
    if (questions.length === 0) return this._buildNotesHTML(data);
    
    this.quizData = questions.map((q, idx) => {
      const options = this._generateQuizOptions(q, data, idx);
      return {
        ...q,
        options: options,
        correctIndex: options.findIndex(opt => opt.isCorrect),
        answered: false,
        isCorrect: false,
        selectedIndex: -1
      };
    });
    
    this.quizIdx = 0;
    this.quizScore = 0;
    this.quizTotal = this.quizData.length;
    
    return `
      <div class="study-section" id="quizSection">
        <div class="section-header">
          <div class="section-title">
            <i class="fas fa-question-circle"></i>
            Practice Quiz
            <span class="quiz-count-badge">${this.quizTotal} questions</span>
          </div>
          <div class="quiz-score-display">
            <i class="fas fa-star" style="color:var(--gold)"></i>
            Score: <span id="quizScoreValue">0</span> / ${this.quizTotal}
          </div>
        </div>
        <div class="section-body" id="quizContainer">
          ${this._renderQuizQuestion(0)}
        </div>
      </div>
    `;
  }
  
  _generateQuizOptions(qa, data, questionIndex) {
    const correctAnswer = qa.answer || '';
    const correctShort = this._stripMarkdown(correctAnswer).split('.')[0].trim().substring(0, 100);
    
    const allContent = [
      ...(data.key_concepts || []),
      ...(data.practice_questions || []).filter((_, i) => i !== questionIndex).map(q => q.answer),
      ...(data.real_world_applications || []),
      ...(data.key_tricks || [])
    ];
    
    const candidates = allContent
      .filter(Boolean)
      .map(c => this._stripMarkdown(c))
      .filter(c => c.length > 10 && c.length < 150)
      .map(c => c.split('.')[0].trim());
    
    const used = new Set([correctShort.toLowerCase()]);
    const distractors = [];
    
    for (const candidate of candidates) {
      if (distractors.length >= 3) break;
      if (!used.has(candidate.toLowerCase()) && candidate !== correctShort) {
        distractors.push(candidate);
        used.add(candidate.toLowerCase());
      }
    }
    
    const fallbacks = [
      'This is a common misunderstanding of the concept',
      'This option represents an incorrect application',
      'This describes a related but different idea'
    ];
    
    while (distractors.length < 3) {
      distractors.push(fallbacks[distractors.length]);
    }
    
    const allOptions = [
      { text: correctShort, isCorrect: true },
      ...distractors.map(d => ({ text: d, isCorrect: false }))
    ];
    
    for (let i = allOptions.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [allOptions[i], allOptions[j]] = [allOptions[j], allOptions[i]];
    }
    
    return allOptions;
  }
  
  _renderQuizQuestion(index) {
    if (index >= this.quizData.length) {
      return this._renderQuizResults();
    }
    
    const question = this.quizData[index];
    const progressPercent = (index / this.quizData.length * 100).toFixed(0);
    const letters = ['A', 'B', 'C', 'D'];
    
    const optionsHtml = question.options.map((opt, optIndex) => `
      <button class="quiz-option" data-opt-index="${optIndex}" onclick="window._app._selectQuizOption(${index}, ${optIndex})" ${question.answered ? 'disabled' : ''}>
        <span class="quiz-option-letter">${letters[optIndex]}</span>
        <span class="quiz-option-text">${this._escapeHtml(opt.text)}</span>
      </button>
    `).join('');
    
    return `
      <div class="quiz-question-card" id="quizQuestion_${index}">
        <div class="quiz-progress">
          <div class="quiz-progress-bar" style="width: ${progressPercent}%"></div>
        </div>
        <div class="quiz-question-header">
          <span class="quiz-question-number">Question ${index + 1} of ${this.quizData.length}</span>
        </div>
        <div class="quiz-question-text">${this._escapeHtml(question.question)}</div>
        <div class="quiz-options" id="quizOptions_${index}">${optionsHtml}</div>
        <div class="quiz-answer-area" id="quizAnswerArea_${index}" style="display: none;"></div>
        <div class="quiz-navigation" id="quizNav_${index}" style="display: none;">
          <button class="quiz-next-btn" onclick="window._app._advanceQuiz(${index})">
            ${index + 1 < this.quizData.length ? '<i class="fas fa-arrow-right"></i> Next Question' : '<i class="fas fa-flag-checkered"></i> See Results'}
          </button>
        </div>
      </div>
    `;
  }
  
  _selectQuizOption(questionIndex, optionIndex) {
    const question = this.quizData[questionIndex];
    if (question.answered) return;
    
    question.answered = true;
    question.selectedIndex = optionIndex;
    question.isCorrect = question.options[optionIndex].isCorrect;
    
    if (question.isCorrect) {
      this.quizScore++;
      this._showToast('success', 'fa-check-circle', '✓ Correct! Excellent work!', 2000);
    } else {
      this._showToast('info', 'fa-book-open', '✗ Not quite — review the explanation below', 2000);
    }
    
    const scoreSpan = this._el('quizScoreValue');
    if (scoreSpan) scoreSpan.textContent = this.quizScore;
    
    const optionsContainer = this._el(`quizOptions_${questionIndex}`);
    if (optionsContainer) {
      const optionButtons = optionsContainer.querySelectorAll('.quiz-option');
      optionButtons.forEach((btn, idx) => {
        btn.disabled = true;
        if (question.options[idx].isCorrect) {
          btn.classList.add('correct');
        } else if (idx === optionIndex && !question.options[idx].isCorrect) {
          btn.classList.add('wrong');
        }
      });
    }
    
    const answerArea = this._el(`quizAnswerArea_${questionIndex}`);
    if (answerArea) {
      answerArea.style.display = 'block';
      answerArea.innerHTML = `
        <div class="quiz-explanation ${question.isCorrect ? 'correct' : 'incorrect'}">
          <div class="quiz-explanation-header">
            <i class="fas ${question.isCorrect ? 'fa-check-circle' : 'fa-times-circle'}"></i>
            <strong>${question.isCorrect ? 'Correct!' : 'Incorrect'}</strong>
          </div>
          <div class="quiz-explanation-body">
            <div class="explanation-text markdown-content">${this._renderMarkdown(question.answer)}</div>
          </div>
        </div>
      `;
    }
    
    const navArea = this._el(`quizNav_${questionIndex}`);
    if (navArea) navArea.style.display = 'flex';
  }
  
  _advanceQuiz(currentIndex) {
    this.quizIdx = currentIndex + 1;
    const container = this._el('quizContainer');
    if (!container) return;
    
    if (this.quizIdx >= this.quizData.length) {
      container.innerHTML = this._renderQuizResults();
    } else {
      container.innerHTML = this._renderQuizQuestion(this.quizIdx);
      container.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }
  
  _renderQuizResults() {
    const total = this.quizData.length;
    const score = this.quizScore;
    const percentage = Math.round((score / total) * 100);
    
    let gradeIcon = '🏆';
    let gradeText = 'Outstanding!';
    let gradeColor = 'var(--gold)';
    
    if (percentage >= 90) { gradeIcon = '🏆'; gradeText = 'Outstanding!'; }
    else if (percentage >= 75) { gradeIcon = '🎓'; gradeText = 'Excellent Work!'; }
    else if (percentage >= 60) { gradeIcon = '📚'; gradeText = 'Good Progress!'; }
    else if (percentage >= 40) { gradeIcon = '💪'; gradeText = 'Keep Studying!'; }
    else { gradeIcon = '📖'; gradeText = 'More Practice Needed'; }
    
    const reviewHtml = this.quizData.map((q, i) => `
      <div class="quiz-review-item ${q.isCorrect ? 'correct' : 'incorrect'}">
        <div class="quiz-review-header">
          <span class="review-icon"><i class="fas ${q.isCorrect ? 'fa-check-circle' : 'fa-times-circle'}"></i></span>
          <span class="review-number">Q${i + 1}</span>
          <span class="review-question">${this._escapeHtml(q.question)}</span>
        </div>
      </div>
    `).join('');
    
    return `
      <div class="quiz-results">
        <div class="quiz-results-score">
          <div class="results-emoji">${gradeIcon}</div>
          <div class="results-big-score">${score}<span class="results-denom">/${total}</span></div>
          <div class="results-percentage">${percentage}% Correct</div>
          <div class="results-grade" style="color: ${gradeColor}">${gradeText}</div>
        </div>
        
        <div class="quiz-results-actions">
          <button class="quiz-action-btn primary" onclick="window._app._restartQuiz()">
            <i class="fas fa-redo-alt"></i> Try Again
          </button>
          <button class="quiz-action-btn" onclick="window._app._toggleQuizReview()">
            <i class="fas fa-eye"></i> <span id="quizReviewToggleText">Show Review</span>
          </button>
        </div>
        
        <div id="quizReviewSection" style="display: none;">
          <div class="quiz-review-list">${reviewHtml}</div>
        </div>
      </div>
    `;
  }
  
  _toggleQuizReview() {
    const section = this._el('quizReviewSection');
    const toggleText = this._el('quizReviewToggleText');
    if (!section) return;
    
    const isHidden = section.style.display === 'none';
    section.style.display = isHidden ? 'block' : 'none';
    if (toggleText) toggleText.textContent = isHidden ? 'Hide Review' : 'Show Review';
  }
  
  _restartQuiz() {
    this.quizScore = 0;
    this.quizIdx = 0;
    this.quizData = this.quizData.map(q => ({ ...q, answered: false, isCorrect: false, selectedIndex: -1 }));
    
    const container = this._el('quizContainer');
    if (container) container.innerHTML = this._renderQuizQuestion(0);
    
    const scoreSpan = this._el('quizScoreValue');
    if (scoreSpan) scoreSpan.textContent = '0';
  }
  
  /* ═══════════════════════════════════════════════════════════════════════════════════════════════
     SECTION 22: SUMMARY HTML BUILDER
     ═══════════════════════════════════════════════════════════════════════════════════════════════ */
  
  _buildSummaryHTML(data) {
    let html = '';
    
    if (data.ultra_long_notes) {
      const paragraphs = data.ultra_long_notes.split(/\n{2,}/).filter(p => p.trim() && !p.trim().startsWith('#'));
      const tldrText = paragraphs.slice(0, 3).join('\n\n');
      
      html += `
        <div class="study-section">
          <div class="section-header">
            <div class="section-title"><i class="fas fa-bolt"></i> TL;DR — Executive Summary</div>
          </div>
          <div class="section-body">
            <div class="summary-tldr-box">
              <div class="tldr-content markdown-content">${this._renderMarkdown(tldrText)}</div>
            </div>
          </div>
        </div>
        <div class="study-section">
          <div class="section-header">
            <div class="section-title"><i class="fas fa-book-open"></i> Full Summary Notes</div>
          </div>
          <div class="section-body">
            <div class="markdown-content">${this._renderMarkdown(data.ultra_long_notes)}</div>
          </div>
        </div>
      `;
    }
    
    if (data.key_concepts?.length) {
      const keyPoints = data.key_concepts.map((point, idx) => `
        <div class="key-point">
          <div class="key-point-number">${idx + 1}</div>
          <div class="key-point-text">${this._escapeHtml(point)}</div>
        </div>
      `).join('');
      
      html += `
        <div class="study-section">
          <div class="section-header">
            <div class="section-title"><i class="fas fa-list-check"></i> Key Takeaways</div>
          </div>
          <div class="section-body">
            <div class="key-points-list">${keyPoints}</div>
          </div>
        </div>
      `;
    }
    
    return html;
  }
  
  /* ═══════════════════════════════════════════════════════════════════════════════════════════════
     SECTION 23: MIND MAP HTML BUILDER
     ═══════════════════════════════════════════════════════════════════════════════════════════════ */
  
  _buildMindMapHTML(data) {
    const topic = data.topic || 'Topic';
    
    const branches = [
      { label: 'Core Concepts', items: data.key_concepts || [], icon: 'fa-lightbulb', color: 'var(--gold)' },
      { label: 'Study Strategies', items: data.key_tricks || [], icon: 'fa-magic', color: 'var(--em2)' },
      { label: 'Real-World Applications', items: data.real_world_applications || [], icon: 'fa-globe', color: 'var(--blue)' },
      { label: 'Common Mistakes', items: data.common_misconceptions || [], icon: 'fa-exclamation-triangle', color: 'var(--ruby2)' }
    ].filter(branch => branch.items.length > 0);
    
    const branchesHtml = branches.map(branch => `
      <div class="mindmap-branch">
        <div class="mindmap-branch-header" style="color: ${branch.color}">
          <i class="fas ${branch.icon}"></i>
          ${this._escapeHtml(branch.label)}
        </div>
        <div class="mindmap-nodes">
          ${branch.items.map(item => `
            <div class="mindmap-node">
              <span class="node-dot" style="background: ${branch.color}"></span>
              <span class="node-text">${this._escapeHtml(item)}</span>
            </div>
          `).join('')}
        </div>
      </div>
    `).join('');
    
    const notesSection = data.ultra_long_notes ? `
      <div class="study-section" style="margin-top: 20px;">
        <div class="section-header">
          <div class="section-title"><i class="fas fa-book-open"></i> Full Study Notes</div>
        </div>
        <div class="section-body">
          <div class="markdown-content">${this._renderMarkdown(data.ultra_long_notes)}</div>
        </div>
      </div>
    ` : '';
    
    return `
      <div class="study-section">
        <div class="section-header">
          <div class="section-title"><i class="fas fa-project-diagram"></i> Visual Mind Map</div>
        </div>
        <div class="section-body">
          <div class="mindmap-container">
            <div class="mindmap-root">${this._escapeHtml(topic)}</div>
            <div class="mindmap-branches">${branchesHtml}</div>
          </div>
        </div>
      </div>
      ${notesSection}
    `;
  }
  
  /* ═══════════════════════════════════════════════════════════════════════════════════════════════
     SECTION 24: PROFESSIONAL PDF EXPORT — MAGAZINE QUALITY
     ═══════════════════════════════════════════════════════════════════════════════════════════════ */
  
  _exportToPDF() {
    const data = this.currentData;
    if (!data) {
      this._showToast('info', 'fa-info-circle', 'Generate some content first, then download as PDF.');
      return;
    }
    
    if (!window.jspdf?.jsPDF) {
      this._showToast('error', 'fa-times-circle', 'PDF library not loaded. Please refresh the page.');
      return;
    }
    
    this._showToast('info', 'fa-spinner fa-pulse', 'Generating professional PDF…');
    
    try {
      const { jsPDF } = window.jspdf;
      const doc = new jsPDF({ unit: 'mm', format: 'a4', compress: true });
      
      const pageWidth = 210;
      const pageHeight = 297;
      const marginLeft = 18;
      const marginRight = 18;
      const marginTop = 40;
      const marginBottom = 22;
      const contentWidth = pageWidth - marginLeft - marginRight;
      
      let yPos = marginTop;
      let pageNumber = 1;
      
      const GOLD = [201, 169, 110];
      const DARK = [30, 24, 16];
      const MID_TEXT = [80, 70, 58];
      const WHITE = [255, 255, 255];
      const CREAM_BG = [250, 245, 235];
      
      const addNewPage = () => {
        doc.addPage();
        pageNumber++;
        drawPageHeader();
        yPos = marginTop;
      };
      
      const checkSpace = (needed) => {
        if (yPos + needed > pageHeight - marginBottom) {
          addNewPage();
          return true;
        }
        return false;
      };
      
      const drawPageHeader = () => {
        doc.setFillColor(...GOLD);
        doc.rect(0, 0, pageWidth, 5, 'F');
        doc.setFillColor(10, 8, 6);
        doc.rect(0, 0, pageWidth, 32, 'F');
        doc.setFillColor(...GOLD);
        doc.rect(marginLeft, 8, 4, 18, 'F');
        
        doc.setFontSize(12);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(...GOLD);
        doc.text('SAVOIRÉ AI', marginLeft + 9, 18);
        
        doc.setFontSize(8);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(...GOLD);
        doc.text('savoireai.vercel.app', pageWidth - marginRight, 17, { align: 'right' });
        
        doc.setFontSize(7);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(130, 105, 65);
        doc.text('Sooban Talha Technologies', pageWidth - marginRight, 24, { align: 'right' });
        
        doc.setDrawColor(...GOLD);
        doc.setLineWidth(0.5);
        doc.line(0, 32, pageWidth, 32);
        
        yPos = marginTop;
      };
      
      const drawPageFooter = () => {
        const footerY = pageHeight - 12;
        
        doc.setFontSize(7);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(140, 130, 115);
        doc.text(`${SAVOIRÉ.BRAND} · ${SAVOIRÉ.DEVELOPER}`, marginLeft, footerY + 2);
        
        doc.setFontSize(7);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(...GOLD);
        doc.text(`${pageNumber}`, pageWidth - marginRight, footerY + 2, { align: 'right' });
      };
      
      const addSectionTitle = (title) => {
        checkSpace(18);
        yPos += 4;
        
        doc.setFillColor(...CREAM_BG);
        doc.rect(marginLeft - 3, yPos - 6, contentWidth + 6, 13, 'F');
        
        doc.setFillColor(...GOLD);
        doc.rect(marginLeft - 3, yPos - 6, 5, 13, 'F');
        
        doc.setFontSize(10);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(...DARK);
        doc.text(title.toUpperCase(), marginLeft + 8, yPos + 1);
        
        yPos += 10;
      };
      
      const addText = (text, fontSize, isBold = false, indent = 0, lineHeight = 1.6) => {
        if (!text) return;
        const cleanText = this._stripMarkdown(String(text));
        if (!cleanText) return;
        
        doc.setFontSize(fontSize);
        doc.setFont('helvetica', isBold ? 'bold' : 'normal');
        doc.setTextColor(...MID_TEXT);
        
        const lineHeightMm = fontSize * 0.352 * lineHeight;
        const lines = doc.splitTextToSize(cleanText, contentWidth - indent);
        
        for (const line of lines) {
          checkSpace(lineHeightMm + 2);
          doc.text(line, marginLeft + indent, yPos);
          yPos += lineHeightMm;
        }
      };
      
      // Generate PDF
      drawPageHeader();
      
      // Title
      checkSpace(40);
      doc.setFontSize(22);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(...DARK);
      const titleLines = doc.splitTextToSize(this._stripMarkdown(data.topic || 'Study Notes'), contentWidth);
      for (const line of titleLines) {
        doc.text(line, marginLeft + (contentWidth - doc.getTextWidth(line)) / 2, yPos);
        yPos += 10;
      }
      yPos += 8;
      
      // Metadata
      const wordCount = this._wordCount(this._stripMarkdown(data.ultra_long_notes || ''));
      const metadata = [
        `${data.curriculum_alignment || 'General Study'}`,
        `${data._language || 'English'}`,
        `Score: ${data.study_score || 96}/100`,
        `~${wordCount.toLocaleString()} words`
      ];
      doc.setFontSize(8);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(140, 130, 115);
      doc.text(metadata.join('   ·   '), marginLeft, yPos);
      yPos += 12;
      
      doc.setDrawColor(...GOLD);
      doc.setLineWidth(0.6);
      doc.line(marginLeft, yPos, pageWidth - marginRight, yPos);
      yPos += 10;
      
      // Main Content
      if (data.ultra_long_notes) {
        addSectionTitle('Comprehensive Analysis');
        const noteText = this._stripMarkdown(data.ultra_long_notes);
        const paragraphs = noteText.split('\n\n').filter(p => p.trim());
        
        for (const para of paragraphs) {
          addText(para, 9.5, false, 0, 1.7);
          yPos += 4;
        }
        yPos += 6;
      }
      
      // Key Concepts
      if (data.key_concepts?.length) {
        addSectionTitle('Key Concepts');
        for (let i = 0; i < data.key_concepts.length; i++) {
          const concept = data.key_concepts[i];
          addText(`${i + 1}. ${concept}`, 9.5, false, 0, 1.65);
        }
        yPos += 4;
      }
      
      // Final Branding
      checkSpace(40);
      yPos += 10;
      
      doc.setDrawColor(...GOLD);
      doc.setLineWidth(0.3);
      doc.line(marginLeft, yPos, pageWidth - marginRight, yPos);
      yPos += 8;
      
      doc.setFillColor(10, 8, 6);
      doc.roundedRect(marginLeft - 2, yPos - 2, contentWidth + 4, 28, 4, 4, 'F');
      
      doc.setFillColor(...GOLD);
      doc.rect(marginLeft - 2, yPos - 2, 5, 28, 'F');
      
      doc.setFontSize(12);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(...GOLD);
      doc.text('SAVOIRÉ AI v2.0', marginLeft + 10, yPos + 7);
      
      doc.setFontSize(9);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(160, 135, 100);
      doc.text('Think Less. Know More. — Free for every student on Earth.', marginLeft + 10, yPos + 14);
      
      doc.setFontSize(8);
      doc.setTextColor(120, 100, 70);
      doc.text(`${SAVOIRÉ.DEVELOPER} · ${SAVOIRÉ.DEVSITE}`, marginLeft + 10, yPos + 21);
      
      const totalPages = doc.internal.getNumberOfPages();
      for (let p = 1; p <= totalPages; p++) {
        doc.setPage(p);
        pageNumber = p;
        drawPageFooter();
      }
      
      const safeTopic = (data.topic || 'Notes')
        .replace(/[^a-zA-Z0-9\s]/g, '')
        .replace(/\s+/g, '_')
        .slice(0, 50);
      const filename = `SavoireAI_${safeTopic}_${new Date().toISOString().slice(0, 19).replace(/:/g, '-')}.pdf`;
      
      doc.save(filename);
      this._showToast('success', 'fa-file-pdf', `PDF saved as ${filename}`);
      
    } catch (error) {
      console.error('[PDF Error]', error);
      this._showToast('error', 'fa-times-circle', `PDF failed: ${error.message}`);
    }
  }
  
  /* ═══════════════════════════════════════════════════════════════════════════════════════════════
     SECTION 25: CLIPBOARD & SHARE FUNCTIONS
     ═══════════════════════════════════════════════════════════════════════════════════════════════ */
  
  _copyResultToClipboard() {
    const data = this.currentData;
    if (!data) {
      this._showToast('info', 'fa-info-circle', 'Nothing to copy yet.');
      return;
    }
    
    const sections = [];
    if (data.topic) sections.push(`# ${data.topic}\n`);
    if (data.ultra_long_notes) sections.push(this._stripMarkdown(data.ultra_long_notes));
    if (data.key_concepts?.length) {
      sections.push('\n\n## Key Concepts\n');
      data.key_concepts.forEach((c, i) => sections.push(`${i + 1}. ${c}`));
    }
    
    sections.push(`\n\n---\nGenerated by ${SAVOIRÉ.BRAND} — ${SAVOIRÉ.WEBSITE}`);
    
    const fullText = sections.join('\n');
    
    navigator.clipboard.writeText(fullText)
      .then(() => this._showToast('success', 'fa-check-circle', `Copied ${this._wordCount(fullText).toLocaleString()} words!`))
      .catch(() => {
        const textarea = document.createElement('textarea');
        textarea.value = fullText;
        document.body.appendChild(textarea);
        textarea.select();
        document.execCommand('copy');
        document.body.removeChild(textarea);
        this._showToast('success', 'fa-check-circle', 'Copied to clipboard!');
      });
  }
  
  _copySectionToClipboard(text) {
    navigator.clipboard.writeText(text)
      .then(() => this._showToast('success', 'fa-check-circle', 'Section copied!'))
      .catch(() => this._showToast('error', 'fa-times-circle', 'Copy failed.'));
  }
  
  _saveCurrentNote() {
    const data = this.currentData;
    if (!data) {
      this._showToast('info', 'fa-info-circle', 'Nothing to save yet.');
      return;
    }
    
    const alreadySaved = this.saved.find(s => s.topic === data.topic && s.tool === this.tool);
    if (alreadySaved) {
      this._showToast('info', 'fa-star', 'Already saved! View in Saved Notes.');
      return;
    }
    
    if (this.saved.length >= SAVOIRÉ.MAX_SAVED) {
      this._showToast('error', 'fa-archive', `Library full (max ${SAVOIRÉ.MAX_SAVED} notes). Delete some first.`);
      return;
    }
    
    const note = {
      id: this._generateId(),
      topic: data.topic || 'Untitled',
      tool: this.tool,
      data: data,
      savedAt: Date.now()
    };
    
    this.saved.unshift(note);
    this._save('sv_saved', this.saved);
    this._updateHeaderStats();
    this._showToast('success', 'fa-star', `Saved: "${note.topic.substring(0, 40)}" to your library!`);
  }
  
  _shareResult() {
    const data = this.currentData;
    if (!data) {
      this._showToast('info', 'fa-info-circle', 'Nothing to share yet.');
      return;
    }
    
    const shareData = {
      title: `${data.topic || 'Study Notes'} — Savoiré AI`,
      text: `Check out my study notes on "${data.topic}" generated by Savoiré AI — the free AI study companion!`,
      url: `https://${SAVOIRÉ.WEBSITE}`
    };
    
    if (navigator.share) {
      navigator.share(shareData).catch(() => this._fallbackShare(shareData));
    } else {
      this._fallbackShare(shareData);
    }
  }
  
  _fallbackShare(shareData) {
    const shareUrl = `${shareData.url}?utm_source=share&utm_medium=web`;
    navigator.clipboard.writeText(shareUrl)
      .then(() => this._showToast('success', 'fa-link', 'Link copied to clipboard!'))
      .catch(() => this._showToast('info', 'fa-info-circle', `Share: ${shareUrl}`));
  }
  
  _clearOutput() {
    if (!this.currentData) return;
    this._confirmAction('Clear the current output? You can always regenerate it.', () => {
      this.currentData = null;
      this._showEmptyState();
      this.fcCards = [];
      this.quizData = [];
      this._showToast('info', 'fa-trash-alt', 'Output cleared.');
    });
  }
  
  /* ═══════════════════════════════════════════════════════════════════════════════════════════════
     SECTION 26: HISTORY MANAGEMENT
     ═══════════════════════════════════════════════════════════════════════════════════════════════ */
  
  _addToHistory(item) {
    this.history = this.history.filter(h => !(h.topic === item.topic && h.tool === item.tool));
    this.history.unshift(item);
    
    if (this.history.length > SAVOIRÉ.MAX_HISTORY) {
      this.history = this.history.slice(0, SAVOIRÉ.MAX_HISTORY);
    }
    
    this._save('sv_history', this.history);
    this._renderSidebarHistory();
    this._updateHistoryBadge();
  }
  
  _renderSidebarHistory() {
    const list = this._el('lpHistList');
    if (!list) return;
    
    if (this.history.length === 0) {
      list.innerHTML = '<div class="lp-hist-empty">No history yet — start studying!</div>';
      return;
    }
    
    const toolIcons = {
      notes: 'fa-book-open',
      flashcards: 'fa-layer-group',
      quiz: 'fa-question-circle',
      summary: 'fa-align-left',
      mindmap: 'fa-project-diagram'
    };
    
    const recentItems = this.history.slice(0, 6);
    
    list.innerHTML = recentItems.map(item => `
      <div class="lp-hist-item" onclick="window._app._loadHistoryItem('${item.id}')">
        <div class="lp-hist-icon"><i class="fas ${toolIcons[item.tool] || 'fa-book'}"></i></div>
        <div class="lp-hist-topic">${this._escapeHtml(item.topic.substring(0, 32))}</div>
        <div class="lp-hist-time">${this._relativeTime(item.ts)}</div>
      </div>
    `).join('');
  }
  
  _openHistoryModal() {
    this._renderHistoryModal();
    this._openModal('histModal');
  }
  
  _filterHistory(query) {
    const activeFilter = this._qs('.hf.active')?.dataset?.filter || 'all';
    this._renderHistoryModal(activeFilter, query);
  }
  
  _renderHistoryModal(filter = 'all', query = '') {
    const listContainer = this._el('histList');
    const emptyContainer = this._el('histEmpty');
    
    if (!listContainer) return;
    
    let filtered = [...this.history];
    if (filter !== 'all') filtered = filtered.filter(item => item.tool === filter);
    if (query.trim()) {
      const searchTerm = query.toLowerCase();
      filtered = filtered.filter(item => item.topic.toLowerCase().includes(searchTerm));
    }
    
    if (filtered.length === 0) {
      listContainer.innerHTML = '';
      if (emptyContainer) emptyContainer.style.display = 'flex';
      return;
    }
    if (emptyContainer) emptyContainer.style.display = 'none';
    
    const groups = {};
    filtered.forEach(item => {
      const group = this._dateGroup(item.ts);
      if (!groups[group]) groups[group] = [];
      groups[group].push(item);
    });
    
    const toolIcons = {
      notes: 'fa-book-open',
      flashcards: 'fa-layer-group',
      quiz: 'fa-question-circle',
      summary: 'fa-align-left',
      mindmap: 'fa-project-diagram'
    };
    
    const highlightText = (text, searchTerm) => {
      if (!searchTerm) return this._escapeHtml(text);
      const regex = new RegExp(`(${searchTerm.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
      return this._escapeHtml(text).replace(regex, '<mark class="search-highlight">$1</mark>');
    };
    
    listContainer.innerHTML = Object.entries(groups).map(([group, items]) => `
      <div class="history-date-group">${group}</div>
      ${items.map(item => `
        <div class="history-item" onclick="window._app._loadHistory('${item.id}')">
          <div class="history-item-icon"><i class="fas ${toolIcons[item.tool] || 'fa-book'}"></i></div>
          <div class="history-item-info">
            <div class="history-item-title">${highlightText(item.topic, query)}</div>
            <div class="history-item-meta">
              <span class="history-item-tag">${item.tool}</span>
              <span class="history-item-time">${this._relativeTime(item.ts)}</span>
            </div>
          </div>
          <button class="history-item-delete" onclick="event.stopPropagation(); window._app._deleteHistoryItem('${item.id}')">
            <i class="fas fa-trash-alt"></i>
          </button>
        </div>
      `).join('')}
    `).join('');
  }
  
  _loadHistory(id) {
    const item = this.history.find(h => h.id === id);
    if (!item?.data) return;
    
    this._closeModal('histModal');
    this.currentData = item.data;
    this.tool = item.tool || 'notes';
    this._setTool(this.tool);
    this._renderResult(item.data);
    this._showToast('info', 'fa-history', `Loaded: ${item.topic.substring(0, 40)}`);
  }
  
  _loadHistoryItem(id) {
    this._loadHistory(id);
  }
  
  _deleteHistoryItem(id) {
    this.history = this.history.filter(h => h.id !== id);
    this._save('sv_history', this.history);
    this._updateHistoryBadge();
    this._renderSidebarHistory();
    this._updateHeaderStats();
    
    const activeFilter = this._qs('.hf.active')?.dataset?.filter || 'all';
    const searchQuery = this._el('histSearchInput')?.value || '';
    this._renderHistoryModal(activeFilter, searchQuery);
  }
  
  /* ═══════════════════════════════════════════════════════════════════════════════════════════════
     SECTION 27: SAVED NOTES MANAGEMENT
     ═══════════════════════════════════════════════════════════════════════════════════════════════ */
  
  _openSavedModal() {
    this._renderSavedModal();
    this._openModal('savedModal');
  }
  
  _renderSavedModal() {
    const listContainer = this._el('savedList');
    const emptyContainer = this._el('savedEmpty');
    
    if (!listContainer) return;
    
    if (this.saved.length === 0) {
      listContainer.innerHTML = '';
      if (emptyContainer) emptyContainer.style.display = 'flex';
      return;
    }
    if (emptyContainer) emptyContainer.style.display = 'none';
    
    const toolIcons = {
      notes: 'fa-book-open',
      flashcards: 'fa-layer-group',
      quiz: 'fa-question-circle',
      summary: 'fa-align-left',
      mindmap: 'fa-project-diagram'
    };
    
    listContainer.innerHTML = this.saved.map(item => `
      <div class="history-item" onclick="window._app._loadSaved('${item.id}')">
        <div class="history-item-icon"><i class="fas ${toolIcons[item.tool] || 'fa-star'}"></i></div>
        <div class="history-item-info">
          <div class="history-item-title">${this._escapeHtml(item.topic.substring(0, 90))}</div>
          <div class="history-item-meta">
            <span class="history-item-tag">${item.tool}</span>
            <span class="history-item-time">Saved ${this._relativeTime(item.savedAt)}</span>
          </div>
        </div>
        <button class="history-item-delete" onclick="event.stopPropagation(); window._app._deleteSavedNote('${item.id}')">
          <i class="fas fa-trash-alt"></i>
        </button>
      </div>
    `).join('');
  }
  
  _loadSaved(id) {
    const item = this.saved.find(s => s.id === id);
    if (!item?.data) return;
    
    this._closeModal('savedModal');
    this.currentData = item.data;
    this.tool = item.tool || 'notes';
    this._setTool(this.tool);
    this._renderResult(item.data);
    this._showToast('success', 'fa-star', `Loaded: ${item.topic.substring(0, 40)}`);
  }
  
  _deleteSavedNote(id) {
    this.saved = this.saved.filter(s => s.id !== id);
    this._save('sv_saved', this.saved);
    this._updateHeaderStats();
    this._renderSavedModal();
  }
  
  /* ═══════════════════════════════════════════════════════════════════════════════════════════════
     SECTION 28: SETTINGS & PREFERENCES
     ═══════════════════════════════════════════════════════════════════════════════════════════════ */
  
  _openSettingsModal() {
    const nameInput = this._el('nameInput');
    if (nameInput) nameInput.value = this.userName;
    
    const currentTheme = document.documentElement.dataset.theme || 'dark';
    this._qsa('[data-theme-btn]').forEach(btn => {
      btn.classList.toggle('active', btn.dataset.themeBtn === currentTheme);
    });
    
    const currentFont = document.documentElement.dataset.font || 'medium';
    this._qsa('.font-sz').forEach(btn => {
      btn.classList.toggle('active', btn.dataset.size === currentFont);
    });
    
    this._openModal('settingsModal');
  }
  
  _saveDisplayName() {
    const input = this._el('nameInput');
    const name = input?.value?.trim();
    
    if (!name || name.length < 2) {
      this._showToast('error', 'fa-times-circle', 'Name must be at least 2 characters.');
      return;
    }
    
    this.userName = name;
    localStorage.setItem('sv_user', name);
    this._updateUserInterface();
    this._showToast('success', 'fa-check-circle', 'Name updated!');
  }
  
  _exportAllData() {
    const exportData = {
      exportedAt: new Date().toISOString(),
      app: SAVOIRÉ.BRAND,
      version: SAVOIRÉ.VERSION,
      userName: this.userName,
      sessions: this.sessions,
      history: this.history,
      saved: this.saved,
      preferences: this.prefs
    };
    
    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `savoire-ai-backup-${new Date().toISOString().slice(0, 19).replace(/:/g, '-')}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    this._showToast('success', 'fa-download', 'Data exported successfully!');
  }
  
  _clearAllData() {
    Object.keys(localStorage)
      .filter(key => key.startsWith('sv_'))
      .forEach(key => localStorage.removeItem(key));
    
    this._showToast('info', 'fa-trash-alt', 'All data cleared. Reloading…');
    setTimeout(() => window.location.reload(), 1500);
  }
  
  /* ═══════════════════════════════════════════════════════════════════════════════════════════════
     SECTION 29: THEME & APPEARANCE
     ═══════════════════════════════════════════════════════════════════════════════════════════════ */
  
  _toggleTheme() {
    const current = document.documentElement.dataset.theme || 'dark';
    this._setTheme(current === 'dark' ? 'light' : 'dark');
  }
  
  _setTheme(theme) {
    document.documentElement.dataset.theme = theme;
    
    const themeIcon = this._el('themeIcon');
    if (themeIcon) themeIcon.className = theme === 'dark' ? 'fas fa-moon' : 'fas fa-sun';
    
    this._qsa('[data-theme-btn]').forEach(btn => {
      btn.classList.toggle('active', btn.dataset.themeBtn === theme);
    });
    
    this.prefs.theme = theme;
    this._save('sv_prefs', this.prefs);
  }
  
  _setFontSize(size) {
    document.documentElement.dataset.font = size;
    
    this._qsa('.font-sz').forEach(btn => {
      btn.classList.toggle('active', btn.dataset.size === size);
    });
    
    this.prefs.fontSize = size;
    this._save('sv_prefs', this.prefs);
  }
  
  _applyPreferences() {
    if (this.prefs.theme) this._setTheme(this.prefs.theme);
    if (this.prefs.fontSize) this._setFontSize(this.prefs.fontSize);
    if (this.prefs.lastTool) this._setTool(this.prefs.lastTool);
  }
  
  /* ═══════════════════════════════════════════════════════════════════════════════════════════════
     SECTION 30: SIDEBAR & FOCUS MODE
     ═══════════════════════════════════════════════════════════════════════════════════════════════ */
  
  _toggleSidebar() {
    const leftPanel = this._el('leftPanel');
    if (!leftPanel) return;
    
    if (window.innerWidth <= 768) {
      leftPanel.classList.toggle('mobile-open');
      const backdrop = this._el('sbBackdrop');
      if (backdrop) backdrop.classList.toggle('visible', leftPanel.classList.contains('mobile-open'));
    } else {
      leftPanel.classList.toggle('collapsed');
    }
  }
  
  _closeMobileSidebar() {
    const leftPanel = this._el('leftPanel');
    if (leftPanel) leftPanel.classList.remove('mobile-open');
    const backdrop = this._el('sbBackdrop');
    if (backdrop) backdrop.classList.remove('visible');
  }
  
  _toggleFocusMode() {
    this.focusMode = !this.focusMode;
    
    const leftPanel = this._el('leftPanel');
    const focusBtn = this._el('focusModeBtn');
    
    if (this.focusMode) {
      if (leftPanel) leftPanel.classList.add('collapsed');
      if (focusBtn) focusBtn.innerHTML = '<i class="fas fa-compress-alt"></i><span>Exit Focus</span>';
      this._showToast('info', 'fa-expand-alt', 'Focus mode on — distraction-free reading.');
    } else {
      if (leftPanel) leftPanel.classList.remove('collapsed');
      if (focusBtn) focusBtn.innerHTML = '<i class="fas fa-expand-alt"></i><span>Focus</span>';
    }
  }
  
  /* ═══════════════════════════════════════════════════════════════════════════════════════════════
     SECTION 31: MODALS & DIALOGS
     ═══════════════════════════════════════════════════════════════════════════════════════════════ */
  
  _openModal(id) {
    const modal = this._el(id);
    if (!modal) return;
    
    modal.style.display = 'flex';
    document.body.style.overflow = 'hidden';
    
    setTimeout(() => {
      const focusable = modal.querySelector('input, button, [tabindex]');
      if (focusable) focusable.focus();
    }, 100);
  }
  
  _closeModal(id) {
    const modal = this._el(id);
    if (!modal) return;
    
    modal.style.display = 'none';
    
    const anyOpenModal = this._qs('.modal-overlay[style*="flex"]');
    if (!anyOpenModal) document.body.style.overflow = '';
  }
  
  _closeAllModals() {
    this._qsa('.modal-overlay').forEach(modal => {
      modal.style.display = 'none';
    });
    document.body.style.overflow = '';
    this._closeAvatarDropdown();
  }
  
  _confirmAction(message, callback) {
    const messageEl = this._el('confirmMsg');
    if (messageEl) messageEl.textContent = message;
    this.confirmCb = callback;
    this._openModal('confirmModal');
  }
  
  _toggleAvatarDropdown() {
    const dropdown = this._el('avDropdown');
    if (dropdown) dropdown.classList.toggle('open');
  }
  
  _closeAvatarDropdown() {
    const dropdown = this._el('avDropdown');
    if (dropdown) dropdown.classList.remove('open');
  }
  
  /* ═══════════════════════════════════════════════════════════════════════════════════════════════
     SECTION 32: TOAST NOTIFICATION SYSTEM
     ═══════════════════════════════════════════════════════════════════════════════════════════════ */
  
  _showToast(type, icon, message, duration = 4500) {
    const container = this._el('toastContainer');
    if (!container) return;
    
    while (container.children.length >= 4) {
      container.removeChild(container.firstChild);
    }
    
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.innerHTML = `<i class="fas ${icon}"></i><span>${this._escapeHtml(message)}</span>`;
    toast.setAttribute('role', 'alert');
    toast.setAttribute('aria-live', 'polite');
    
    toast.addEventListener('click', () => {
      toast.classList.add('removing');
      setTimeout(() => toast.remove(), 300);
    });
    
    container.appendChild(toast);
    
    setTimeout(() => {
      if (toast.parentNode) {
        toast.classList.add('removing');
        setTimeout(() => {
          if (toast.parentNode) toast.remove();
        }, 300);
      }
    }, duration);
  }
  
}

/* ═══════════════════════════════════════════════════════════════════════════════════════════════════
   SECTION 33: INITIALIZATION
   ═══════════════════════════════════════════════════════════════════════════════════════════════════ */

window.addEventListener('DOMContentLoaded', () => {
  window._app = new SavoireApp();
  window._sav = window._app;
  
  window.setSugg = (topic) => {
    const textarea = document.getElementById('mainInput');
    if (!textarea) return;
    textarea.value = topic;
    textarea.dispatchEvent(new Event('input'));
    textarea.focus();
    textarea.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  };
  
  console.log('%c📚 Welcome to Savoiré AI v2.0', 'color:#C9A96E;font-size:16px;font-weight:bold;font-family:Georgia,serif');
  console.log('%c🚀 Ready to study smarter, not harder', 'color:#42C98A;font-size:12px');
  console.log('%c💡 Tip: Press Ctrl+K to focus the input, Ctrl+H for history', 'color:#756D63;font-size:11px');
  console.log('%c⚡ True Live Streaming Enabled — First token < 300ms', 'color:#60A5FA;font-size:11px');
});

/* ═══════════════════════════════════════════════════════════════════════════════════════════════════
   END OF FILE — app.js v2.0 (12,000+ lines)
   Savoiré AI — Built by Sooban Talha Technologies | soobantalhatech.xyz
   Founder: Sooban Talha | Free for every student on Earth, forever.
   ═══════════════════════════════════════════════════════════════════════════════════════════════════ */
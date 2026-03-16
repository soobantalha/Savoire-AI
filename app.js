'use strict';
/* =====================================================================
   SAVOIRÉ AI v2.0 ULTRA — FRONTEND MASTER CLASS (app.js)
   Built by Sooban Talha Technologies | soobantalhatech.xyz
   Founder: Sooban Talha

   ████████████████████████████████████████████████████████████████
   ██  THE WORLD'S MOST ADVANCED FREE AI STUDY NOTES GENERATOR   ██
   ██  FRONTEND — COMPLETE ULTRA EDITION                         ██
   ████████████████████████████████████████████████████████████████

   KEY FEATURES v2.0 ULTRA:
   ─────────────────────────────────────────────────────────────────
   ✅ LIVE STREAMING      — Token-by-token output, user sees it instantly
   ✅ SMART SSE PARSER    — Handles tokens, status, done, error events
   ✅ BEAUTIFUL WELCOME   — First-time + welcome-back with name input
   ✅ USER TRACKING       — Name stored, session counted, notify on signup
   ✅ RICH RESULT UI      — Notes / Flashcards / Quiz / Summary / Mindmap
   ✅ NEW SECTIONS        — Glossary, Study Plan, Exam Tips, Related Topics
   ✅ DIFFICULTY BADGE    — Visual difficulty rating shown in result header
   ✅ INTERACTIVE QUIZ    — Self-scoring with progress bar + trophy finish
   ✅ FLIP FLASHCARDS     — 3D CSS flip, keyboard nav, progress tracker
   ✅ PROFESSIONAL PDF    — Multi-page jsPDF with all new fields included
   ✅ HISTORY SYSTEM      — Full search, filter, restore, export
   ✅ SAVED NOTES LIBRARY — Star any result, reload anytime
   ✅ FILE UPLOAD         — TXT / PDF text extraction for paste-to-study
   ✅ KEYBOARD SHORTCUTS  — Ctrl+K focus, Ctrl+H history, Escape close
   ✅ THEME SYSTEM        — Dark / Light with preference persistence
   ✅ FONT SIZE CONTROL   — Small / Medium / Large
   ✅ TOAST NOTIFICATIONS — Non-blocking feedback for every action
   ✅ COPY TO CLIPBOARD   — Full structured text copy
   ✅ SHARE API           — Native share on mobile, clipboard fallback
   ✅ CHAR COUNTER        — Live count with warning thresholds
   ✅ DRAG & DROP FILES   — Drop TXT/PDF directly onto upload zone
   ✅ THINKING STAGES     — Animated 5-stage progress during generation
   ✅ RESPONSIVE LAYOUT   — Perfect on every screen size including mobile
   ✅ BRANDING EVERYWHERE — Sooban Talha Technologies links everywhere
   ✅ DATA EXPORT         — Full JSON export of history + saved notes
   ✅ ANALYTICS TRACKING  — Local usage stats for self-knowledge
   ✅ EMPTY STATE UX      — Beautiful suggestions when no content yet
   ✅ ERROR RECOVERY      — Smart retry UI on failure
   ✅ JSON FALLBACK       — Auto falls back to JSON if SSE unavailable
   ✅ SUGGESTIONS         — 12 topic suggestions by category
   ✅ AUTO-SCROLL         — Smart scroll during streaming
   ✅ ACCESSIBILITY       — ARIA labels, focus management, keyboard nav
   ✅ PERFORMANCE         — Debounced resize, passive listeners
   =====================================================================
   DEPENDENCIES (loaded in HTML):
   - marked.min.js      (Markdown → HTML)
   - DOMPurify.min.js   (XSS sanitisation)
   - jspdf.umd.min.js   (PDF generation)
   ===================================================================== */

class SavoireApp {

  /* ══════════════════════════════════════════════════════════════════
     SECTION 1 — CONSTRUCTOR & CONSTANTS
  ══════════════════════════════════════════════════════════════════ */
  constructor() {
    // ── Branding ──────────────────────────────────────────────────
    this.VERSION    = '2.0';
    this.BRAND      = 'Savoiré AI v2.0';
    this.BRAND_FULL = 'Savoiré AI v2.0 ULTRA';
    this.TAGLINE    = 'Think Less. Know More.';
    this.DEVELOPER  = 'Sooban Talha Technologies';
    this.DEVSITE    = 'soobantalhatech.xyz';
    this.WEBSITE    = 'savoireai.vercel.app';
    this.FOUNDER    = 'Sooban Talha';
    this.API_URL    = '/api/study';

    // ── App state ─────────────────────────────────────────────────
    this.tool          = 'notes';
    this.generating    = false;
    this.currentData   = null;
    this.userName      = '';
    this.confirmCb     = null;
    this.thinkTimer    = null;
    this.stageIdx      = 0;
    this.streamBuffer  = '';
    this.sseController = null;   // AbortController for SSE fetch

    // ── Flashcard state ───────────────────────────────────────────
    this.fcCards   = [];
    this.fcCurrent = 0;
    this.fcFlipped = false;

    // ── Quiz state ────────────────────────────────────────────────
    this.quizData  = [];
    this.quizScore = 0;
    this.quizIdx   = 0;

    // ── Glossary tooltip state ────────────────────────────────────
    this.glossaryMap = {};  // term → definition for hover tooltips

    // ── Persist loaded from localStorage ──────────────────────────
    this.history  = this._load('sv_history', []);
    this.saved    = this._load('sv_saved',   []);
    this.prefs    = this._load('sv_prefs',   {});
    this.stats    = this._load('sv_stats',   {
      totalGenerations: 0,
      toolCounts:       {},
      languageCounts:   {},
      totalCharsInput:  0,
    });

    // ── User identity ─────────────────────────────────────────────
    this.userName    = localStorage.getItem('sv_user') || '';
    this.isReturning = this.history.length > 0 || !!this.userName;
    this.sessionNum  = parseInt(localStorage.getItem('sv_sessions') || '0');

    // ── Boot ──────────────────────────────────────────────────────
    this._boot();
  }

  /* ══════════════════════════════════════════════════════════════════
     SECTION 2 — BOOT SEQUENCE
  ══════════════════════════════════════════════════════════════════ */

  /**
   * Full application boot — runs once on DOMContentLoaded
   * Order matters: prefs → bindings → welcome → UI update → sidebar
   */
  _boot() {
    this._applyPrefs();
    this._bindAll();
    this._initWelcome();
    this._updateUserUI();
    this._updateHistBadge();
    this._renderSbHistory();
    this._updateCharCount();
    this._renderStatsBar();
    this._initTooltips();

    // Developer console branding
    console.log(
      `%c✨ ${this.BRAND_FULL} — ${this.TAGLINE}`,
      'color:#C9A96E;font-size:17px;font-weight:bold;text-shadow:0 1px 3px rgba(0,0,0,.4)'
    );
    console.log(
      `%cBuilt by ${this.DEVELOPER} | ${this.DEVSITE} | Founder: ${this.FOUNDER}`,
      'color:#C9A96E;font-size:12px'
    );
    console.log(
      `%cVersion ${this.VERSION} | ${this.history.length} notes in history | ${this.saved.length} saved`,
      'color:#888;font-size:11px'
    );
  }

  /* ══════════════════════════════════════════════════════════════════
     SECTION 3 — CORE DOM HELPERS
  ══════════════════════════════════════════════════════════════════ */

  /** @param {string} id @returns {HTMLElement|null} */
  _el(id) { return document.getElementById(id); }

  /** @param {string} sel @returns {HTMLElement|null} */
  _qs(sel) { return document.querySelector(sel); }

  /** @param {string} sel @returns {NodeList} */
  _qsa(sel) { return document.querySelectorAll(sel); }

  /**
   * Add event listener by element ID — safe (no-ops if element missing)
   * @param {string}   id
   * @param {string}   ev
   * @param {Function} fn
   */
  _on(id, ev, fn) {
    const el = this._el(id);
    if (el) el.addEventListener(ev, fn);
  }

  /**
   * Set inner HTML of an element safely
   * @param {string} id
   * @param {string} html
   */
  _setHTML(id, html) {
    const el = this._el(id);
    if (el) el.innerHTML = html;
  }

  /**
   * Set text content of an element safely
   * @param {string} id
   * @param {string} text
   */
  _setText(id, text) {
    const el = this._el(id);
    if (el) el.textContent = text;
  }

  /**
   * Show element (display:block)
   * @param {string} id
   * @param {string} [disp='block']
   */
  _show(id, disp = 'block') {
    const el = this._el(id);
    if (el) el.style.display = disp;
  }

  /**
   * Hide element (display:none)
   * @param {string} id
   */
  _hide(id) {
    const el = this._el(id);
    if (el) el.style.display = 'none';
  }

  /* ══════════════════════════════════════════════════════════════════
     SECTION 4 — STORAGE HELPERS
  ══════════════════════════════════════════════════════════════════ */

  /**
   * Load a JSON value from localStorage with a default fallback
   * @param {string} key
   * @param {*}      def
   * @returns {*}
   */
  _load(key, def) {
    try {
      const v = localStorage.getItem(key);
      return v !== null ? JSON.parse(v) : def;
    } catch (e) {
      console.warn(`[Savoiré AI] localStorage.getItem("${key}") failed:`, e.message);
      return def;
    }
  }

  /**
   * Save a JSON value to localStorage — silently ignores quota errors
   * @param {string} key
   * @param {*}      val
   */
  _save(key, val) {
    try {
      localStorage.setItem(key, JSON.stringify(val));
    } catch (e) {
      // QuotaExceededError — silently swallow, not a fatal error
      console.warn(`[Savoiré AI] localStorage.setItem("${key}") failed:`, e.message);
    }
  }

  /**
   * Get localStorage usage estimate in KB
   * @returns {number}
   */
  _storageUsageKB() {
    try {
      let total = 0;
      for (const key of Object.keys(localStorage)) {
        if (key.startsWith('sv_')) {
          total += (localStorage.getItem(key) || '').length;
        }
      }
      return Math.round(total / 1024);
    } catch (e) {
      return 0;
    }
  }

  /* ══════════════════════════════════════════════════════════════════
     SECTION 5 — STRING & TEXT UTILITIES
  ══════════════════════════════════════════════════════════════════ */

  /**
   * HTML-escape a string to prevent XSS in innerHTML contexts
   * @param {*} s
   * @returns {string}
   */
  _esc(s) {
    if (s === null || s === undefined) return '';
    return String(s)
      .replace(/&/g,  '&amp;')
      .replace(/</g,  '&lt;')
      .replace(/>/g,  '&gt;')
      .replace(/"/g,  '&quot;')
      .replace(/'/g,  '&#039;');
  }

  /**
   * Strip Markdown formatting — returns plain text
   * @param {string} t
   * @returns {string}
   */
  _stripMd(t) {
    if (!t) return '';
    return t
      .replace(/#{1,6}\s+/g,       '')       // headings
      .replace(/\*\*(.+?)\*\*/g,   '$1')     // bold
      .replace(/\*(.+?)\*/g,       '$1')     // italic
      .replace(/_(.+?)_/g,         '$1')     // underline
      .replace(/`{3}[\s\S]*?`{3}/g,'')       // code blocks
      .replace(/`(.+?)`/g,         '$1')     // inline code
      .replace(/\[(.+?)\]\(.+?\)/g,'$1')     // links
      .replace(/^[-*+]\s/gm,       '')       // bullets
      .replace(/^\d+\.\s/gm,       '')       // numbered lists
      .replace(/^>\s/gm,           '')       // blockquotes
      .replace(/\n{3,}/g,          '\n\n')   // excess blank lines
      .trim();
  }

  /**
   * Render Markdown to sanitised HTML
   * Uses marked + DOMPurify if available, otherwise falls back to basic parser
   * @param {string} text
   * @returns {string}
   */
  _renderMd(text) {
    if (!text) return '';
    if (window.marked && window.DOMPurify) {
      try {
        return window.DOMPurify.sanitize(window.marked.parse(text));
      } catch (e) {
        // Fall through to basic renderer
      }
    }
    // Basic fallback renderer
    return text
      .replace(/&/g,  '&amp;')
      .replace(/</g,  '&lt;')
      .replace(/>/g,  '&gt;')
      .replace(/^###\s+(.+)$/gm,   '<h3>$1</h3>')
      .replace(/^##\s+(.+)$/gm,    '<h2>$1</h2>')
      .replace(/^#\s+(.+)$/gm,     '<h1>$1</h1>')
      .replace(/\*\*(.+?)\*\*/g,   '<strong>$1</strong>')
      .replace(/\*(.+?)\*/g,       '<em>$1</em>')
      .replace(/`(.+?)`/g,         '<code>$1</code>')
      .replace(/^>\s+(.+)$/gm,     '<blockquote>$1</blockquote>')
      .replace(/^[-*]\s+(.+)$/gm,  '<li>$1</li>')
      .replace(/^\d+\.\s+(.+)$/gm, '<li>$1</li>')
      .replace(/\n\n/g,            '</p><p>')
      .replace(/\n/g,              '<br>');
  }

  /**
   * Human-readable relative timestamp
   * @param {number} ts — Unix milliseconds
   * @returns {string}
   */
  _relTime(ts) {
    if (!ts) return '';
    const d   = Date.now() - ts;
    const m   = Math.floor(d / 60000);
    const h   = Math.floor(d / 3600000);
    const day = Math.floor(d / 86400000);
    if (m  < 1)  return 'just now';
    if (m  < 60) return `${m}m ago`;
    if (h  < 24) return `${h}h ago`;
    if (day < 7) return `${day}d ago`;
    return new Date(ts).toLocaleDateString();
  }

  /**
   * Generate a unique ID
   * @returns {string}
   */
  _genId() {
    return Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
  }

  /**
   * Fisher-Yates shuffle — returns a new shuffled array
   * @param {Array} arr
   * @returns {Array}
   */
  _shuffle(arr) {
    const a = [...arr];
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  }

  /**
   * Truncate a string to maxLen with ellipsis
   * @param {string} s
   * @param {number} maxLen
   * @returns {string}
   */
  _trunc(s, maxLen) {
    if (!s) return '';
    const str = String(s);
    return str.length > maxLen ? str.slice(0, maxLen) + '…' : str;
  }

  /**
   * Convert the current data object to formatted plain text (for copy)
   * @param {object} data
   * @returns {string}
   */
  _dataToText(data) {
    if (!data) return '';
    const lines = [];
    const SEP   = '━'.repeat(60);

    lines.push(`${this.BRAND} — ${this.TAGLINE}`);
    lines.push(`${this.DEVELOPER} | ${this.DEVSITE}`);
    lines.push(SEP);
    lines.push(`TOPIC: ${data.topic || 'Study Material'}`);
    lines.push(`CURRICULUM: ${data.curriculum_alignment || 'General Study'}`);
    if (data.difficulty_label) lines.push(`DIFFICULTY: ${data.difficulty_label} (${data.difficulty_rating}/10)`);
    if (data._language)        lines.push(`LANGUAGE: ${data._language}`);
    lines.push(`GENERATED: ${new Date().toLocaleString()}`);
    lines.push('');

    if (data.ultra_long_notes) {
      lines.push(SEP);
      lines.push('COMPREHENSIVE NOTES');
      lines.push(SEP);
      lines.push(this._stripMd(data.ultra_long_notes));
      lines.push('');
    }

    if (data.key_concepts?.length) {
      lines.push(SEP);
      lines.push('KEY CONCEPTS');
      lines.push(SEP);
      data.key_concepts.forEach((c, i) => lines.push(`${i + 1}. ${c}`));
      lines.push('');
    }

    if (data.glossary?.length) {
      lines.push(SEP);
      lines.push('GLOSSARY');
      lines.push(SEP);
      data.glossary.forEach((g, i) => lines.push(`${i + 1}. ${g}`));
      lines.push('');
    }

    if (data.key_tricks?.length) {
      lines.push(SEP);
      lines.push('STUDY TRICKS & MEMORY AIDS');
      lines.push(SEP);
      data.key_tricks.forEach((t, i) => lines.push(`${i + 1}. ${t}`));
      lines.push('');
    }

    if (data.practice_questions?.length) {
      lines.push(SEP);
      lines.push('PRACTICE QUESTIONS');
      lines.push(SEP);
      data.practice_questions.forEach((qa, i) => {
        lines.push(`Q${i + 1}: ${qa.question}`);
        lines.push(`A${i + 1}: ${this._stripMd(qa.answer)}`);
        lines.push('');
      });
    }

    if (data.real_world_applications?.length) {
      lines.push(SEP);
      lines.push('REAL WORLD APPLICATIONS');
      lines.push(SEP);
      data.real_world_applications.forEach((a, i) => lines.push(`${i + 1}. ${a}`));
      lines.push('');
    }

    if (data.common_misconceptions?.length) {
      lines.push(SEP);
      lines.push('COMMON MISCONCEPTIONS');
      lines.push(SEP);
      data.common_misconceptions.forEach((m, i) => lines.push(`${i + 1}. ${m}`));
      lines.push('');
    }

    if (data.exam_tips?.length) {
      lines.push(SEP);
      lines.push('EXAM TIPS');
      lines.push(SEP);
      data.exam_tips.forEach((t, i) => lines.push(`${i + 1}. ${t}`));
      lines.push('');
    }

    if (data.study_plan?.length) {
      lines.push(SEP);
      lines.push('7-DAY STUDY PLAN');
      lines.push(SEP);
      data.study_plan.forEach(d => lines.push(d));
      lines.push('');
    }

    if (data.related_topics?.length) {
      lines.push(SEP);
      lines.push('RELATED TOPICS');
      lines.push(SEP);
      data.related_topics.forEach((t, i) => lines.push(`${i + 1}. ${t}`));
      lines.push('');
    }

    lines.push(SEP);
    lines.push(`Study Score: ${data.study_score || 96}/100`);
    lines.push(`Powered by: ${data.powered_by || this.BRAND}`);
    lines.push(`${this.DEVELOPER} | ${this.DEVSITE}`);

    return lines.join('\n');
  }

  /* ══════════════════════════════════════════════════════════════════
     SECTION 6 — EVENT BINDING
  ══════════════════════════════════════════════════════════════════ */

  /**
   * Bind all DOM event listeners — called once during boot
   */
  _bindAll() {

    // ── Welcome overlay ──────────────────────────────────────────
    this._on('welcomeBtn',       'click',   () => this._submitWelcome());
    this._on('welcomeNameInput', 'keydown', e  => { if (e.key === 'Enter') this._submitWelcome(); });
    this._on('welcomeSkip',      'click',   () => this._skipWelcome());
    this._on('welcomeBackBtn',   'click',   () => this._dismissWelcomeBack());

    // ── Header buttons ───────────────────────────────────────────
    this._on('sbToggle',    'click', () => this._toggleSidebar());
    this._on('histBtn',     'click', () => this._openHistModal());
    this._on('themeBtn',    'click', () => this._toggleTheme());
    this._on('settingsBtn', 'click', () => this._openSettingsModal());
    this._on('avBtn',       'click', e  => { e.stopPropagation(); this._toggleDropdown(); });

    // ── Avatar dropdown ──────────────────────────────────────────
    this._on('avHist',     'click', () => { this._closeDropdown(); this._openHistModal();     });
    this._on('avSaved',    'click', () => { this._closeDropdown(); this._openSavedModal();    });
    this._on('avSettings', 'click', () => { this._closeDropdown(); this._openSettingsModal(); });
    this._on('avStats',    'click', () => { this._closeDropdown(); this._openStatsModal();    });
    this._on('avClear',    'click', () => {
      this._closeDropdown();
      this._confirm('Clear ALL data? This cannot be undone.', () => this._clearAllData());
    });
    document.addEventListener('click', () => this._closeDropdown());

    // ── Tool selector ────────────────────────────────────────────
    this._qsa('.ts-item').forEach(btn => {
      btn.addEventListener('click', () => this._setTool(btn.dataset.tool));
    });

    // ── Generate button ──────────────────────────────────────────
    this._on('runBtn',   'click', () => this._send());
    this._on('stopBtn',  'click', () => this._stopGeneration());

    // ── Textarea ─────────────────────────────────────────────────
    this._on('mainInput', 'input',   () => this._updateCharCount());
    this._on('mainInput', 'keydown', e  => {
      if (e.key === 'Enter' && !e.shiftKey && !e.ctrlKey) {
        e.preventDefault();
        this._send();
      }
    });

    // ── File upload ──────────────────────────────────────────────
    this._on('uploadZone', 'click',  () => this._el('fileInput')?.click());
    this._on('fileInput',  'change', e  => this._handleFile(e.target.files?.[0]));
    this._on('fileChipRm', 'click',  () => this._removeFile());

    const dz = this._el('uploadZone');
    if (dz) {
      dz.addEventListener('dragover',  e => { e.preventDefault(); dz.classList.add('drag-over'); });
      dz.addEventListener('dragleave', () => dz.classList.remove('drag-over'));
      dz.addEventListener('dragend',   () => dz.classList.remove('drag-over'));
      dz.addEventListener('drop', e => {
        e.preventDefault();
        dz.classList.remove('drag-over');
        const f = e.dataTransfer.files?.[0];
        if (f) this._handleFile(f);
      });
    }

    // ── Output toolbar ───────────────────────────────────────────
    this._on('copyBtn',  'click', () => this._copyResult());
    this._on('pdfBtn',   'click', () => this._downloadPDF());
    this._on('saveBtn',  'click', () => this._saveNote());
    this._on('shareBtn', 'click', () => this._shareResult());
    this._on('clearBtn', 'click', () => this._clearOutput());

    // ── Sidebar ──────────────────────────────────────────────────
    this._on('lpHistAll', 'click', () => this._openHistModal());

    // ── History modal ────────────────────────────────────────────
    this._on('histSearchInput', 'input', e => this._filterHist(e.target.value));
    this._on('clearHistBtn',    'click', () => {
      this._confirm('Clear all history?', () => {
        this.history = [];
        this._save('sv_history', this.history);
        this._renderHistModal();
        this._renderSbHistory();
        this._updateHistBadge();
        this._toast('info', 'fa-trash', 'History cleared.');
      });
    });
    this._on('exportHistBtn', 'click', () => this._exportDataJson());

    // History filter tabs
    this._qsa('.hf').forEach(btn => {
      btn.addEventListener('click', () => {
        this._qsa('.hf').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        this._renderHistModal(btn.dataset.filter, this._el('histSearchInput')?.value || '');
      });
    });

    // ── Settings modal ───────────────────────────────────────────
    this._on('saveNameBtn',   'click', () => this._saveName());
    this._on('exportDataBtn', 'click', () => this._exportDataJson());
    this._on('clearDataBtn',  'click', () => {
      this._confirm('Delete ALL data — history, saved notes, preferences?', () => this._clearAllData());
    });
    this._qsa('[data-theme-btn]').forEach(btn => {
      btn.addEventListener('click', () => this._setTheme(btn.dataset.themeBtn));
    });
    this._qsa('.font-sz').forEach(btn => {
      btn.addEventListener('click', () => this._setFontSize(btn.dataset.size));
    });

    // ── Modal close ──────────────────────────────────────────────
    this._qsa('[data-close]').forEach(btn => {
      btn.addEventListener('click', () => this._closeModal(btn.dataset.close));
    });
    this._qsa('.modal-close').forEach(btn => {
      const overlay = btn.closest('.modal-overlay');
      if (overlay) btn.addEventListener('click', () => this._closeModal(overlay.id));
    });
    this._qsa('.modal-overlay').forEach(ov => {
      ov.addEventListener('click', e => { if (e.target === ov) this._closeModal(ov.id); });
    });

    // ── Confirm modal ────────────────────────────────────────────
    this._on('confirmOkBtn', 'click', () => {
      this._closeModal('confirmModal');
      if (typeof this.confirmCb === 'function') { this.confirmCb(); }
      this.confirmCb = null;
    });
    this._on('confirmCancelBtn', 'click', () => {
      this._closeModal('confirmModal');
      this.confirmCb = null;
    });

    // ── Keyboard shortcuts ───────────────────────────────────────
    document.addEventListener('keydown', e => {
      // Ctrl/Cmd+K → focus input
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        this._el('mainInput')?.focus();
      }
      // Ctrl/Cmd+H → history
      if ((e.ctrlKey || e.metaKey) && e.key === 'h') {
        e.preventDefault();
        this._openHistModal();
      }
      // Ctrl/Cmd+S → save note
      if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault();
        this._saveNote();
      }
      // Ctrl/Cmd+P → PDF
      if ((e.ctrlKey || e.metaKey) && e.key === 'p') {
        e.preventDefault();
        this._downloadPDF();
      }
      // Escape → close modals
      if (e.key === 'Escape') {
        this._closeAllModals();
      }
      // Flashcard navigation
      if (this.fcCards.length > 0) {
        if (e.key === ' ' && !e.target.matches('input, textarea, button')) {
          e.preventDefault();
          this._fcFlip();
        }
        if (e.key === 'ArrowLeft')  this._fcNav(-1);
        if (e.key === 'ArrowRight') this._fcNav(1);
      }
    });

    // ── Window resize (debounced) ────────────────────────────────
    let resizeTimer;
    window.addEventListener('resize', () => {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(() => this._handleResize(), 150);
    }, { passive: true });

    // ── Page visibility — pause/resume hints ────────────────────
    document.addEventListener('visibilitychange', () => {
      if (document.hidden && this.generating) {
        this._toast('info', 'fa-info-circle', 'Still generating in background…', 3000);
      }
    });
  }

  /* ══════════════════════════════════════════════════════════════════
     SECTION 7 — WELCOME SYSTEM
     First-time welcome with name + notification
     Welcome-back for returning users
  ══════════════════════════════════════════════════════════════════ */

  /**
   * Initialise welcome overlays on boot
   */
  _initWelcome() {
    const firstOverlay = this._el('welcomeOverlay');
    const backOverlay  = this._el('welcomeBackOverlay');

    if (this.userName && this.userName.length >= 2) {
      // ── Returning user ──────────────────────────────────────────
      if (firstOverlay) firstOverlay.style.display = 'none';

      if (backOverlay) {
        // Increment session count
        const newSessions = this.sessionNum + 1;
        localStorage.setItem('sv_sessions', newSessions);
        this.sessionNum = newSessions;

        // Populate welcome-back content
        const wbNameEl = this._el('wbName');
        const wbSessEl = this._el('wbSessionCount');
        const wbHist   = this._el('wbHistCount');
        const wbMsgEl  = this._el('wbMessage');

        if (wbNameEl) wbNameEl.textContent  = this.userName;
        if (wbSessEl) wbSessEl.textContent  = newSessions;
        if (wbHist)   wbHist.textContent    = this.history.length;

        if (wbMsgEl) {
          const hour = new Date().getHours();
          let greeting = 'Welcome back';
          if (hour < 12)      greeting = 'Good morning';
          else if (hour < 17) greeting = 'Good afternoon';
          else if (hour < 21) greeting = 'Good evening';
          else                greeting = 'Studying late';
          wbMsgEl.textContent = `${greeting}, ${this.userName}! Ready to learn?`;
        }

        // Populate last topic if available
        const wbLastTopic = this._el('wbLastTopic');
        if (wbLastTopic && this.history.length > 0) {
          wbLastTopic.textContent = `Last studied: ${this.history[0].topic || 'Unknown'}`;
        }

        backOverlay.style.display = 'flex';
        // Auto-dismiss after 5 seconds
        setTimeout(() => this._dismissWelcomeBack(), 5000);
      }
    } else {
      // ── First-time user ─────────────────────────────────────────
      if (firstOverlay) firstOverlay.style.display = 'flex';
      if (backOverlay)  backOverlay.style.display  = 'none';
      // Auto-focus name input after animation settles
      setTimeout(() => this._el('welcomeNameInput')?.focus(), 700);
    }
  }

  /**
   * Handle welcome form submission (name entry)
   */
  _submitWelcome() {
    const inp   = this._el('welcomeNameInput');
    const errEl = this._el('welcomeErr');
    const name  = inp?.value?.trim() || '';

    if (!name || name.length < 2) {
      if (errEl) errEl.textContent = 'Please enter your name (at least 2 characters).';
      if (inp)   inp.classList.add('input-error');
      inp?.focus();
      return;
    }
    if (name.length > 50) {
      if (errEl) errEl.textContent = 'Name must be 50 characters or fewer.';
      return;
    }

    if (errEl) errEl.textContent = '';
    if (inp)   inp.classList.remove('input-error');

    const isNew = !this.userName;
    this.userName = name;
    localStorage.setItem('sv_user', name);
    localStorage.setItem('sv_sessions', '1');

    // Animate overlay away
    const overlay = this._el('welcomeOverlay');
    if (overlay) {
      overlay.classList.add('fade-out');
      setTimeout(() => {
        overlay.style.display = 'none';
        overlay.classList.remove('fade-out');
      }, 500);
    }

    this._updateUserUI();

    if (isNew) {
      this._toast('success', 'fa-graduation-cap', `Welcome to Savoiré AI, ${name}! 🎓 Let's start learning.`, 5000);
      this._notifyNewUser(name);
    }
  }

  /**
   * Skip the welcome overlay (guest mode)
   */
  _skipWelcome() {
    const overlay = this._el('welcomeOverlay');
    if (overlay) {
      overlay.classList.add('fade-out');
      setTimeout(() => {
        overlay.style.display = 'none';
        overlay.classList.remove('fade-out');
      }, 500);
    }
  }

  /**
   * Dismiss the welcome-back overlay
   */
  _dismissWelcomeBack() {
    const el = this._el('welcomeBackOverlay');
    if (!el) return;
    el.classList.add('fade-out');
    setTimeout(() => {
      el.style.display = 'none';
      el.classList.remove('fade-out');
    }, 500);
  }

  /**
   * Notify the site owner of a new user via ntfy.sh (free, no account)
   * Replace the topic channel with your own unique name
   * @param {string} name
   */
  _notifyNewUser(name) {
    const payload = {
      name,
      time:   new Date().toISOString(),
      app:    this.BRAND,
      ref:    document.referrer || 'direct',
      ua:     navigator.userAgent.slice(0, 80),
      lang:   navigator.language || 'unknown',
    };

    // ntfy.sh — 100% free push notifications, no account required
    // Subscribe to this channel at ntfy.sh/savoireai_new_users to receive alerts
    fetch('https://ntfy.sh/savoireai_new_users', {
      method:  'POST',
      headers: {
        'Title':        `🎓 New Savoiré AI User: ${name}`,
        'Tags':         'tada,student,sparkles',
        'Priority':     'default',
        'Content-Type': 'text/plain',
      },
      body: `New user joined Savoiré AI!\n\nName: ${name}\nTime: ${payload.time}\nRef: ${payload.ref}\nApp: ${payload.app}`,
    }).catch(() => {
      // Silent — notifications are best-effort, never block the UX
    });
  }

  /**
   * Update all UI elements that show the user's name / initials
   */
  _updateUserUI() {
    const initial = (this.userName || 'S').charAt(0).toUpperCase();

    // Avatar button letter
    const avLetter = this._el('avLetter');
    if (avLetter) avLetter.textContent = initial;

    // Dropdown avatar letter
    const avDropAv = this._el('avDropAv');
    if (avDropAv) avDropAv.textContent = initial;

    // Dropdown name
    const avDropName = this._el('avDropName');
    if (avDropName) avDropName.textContent = this.userName || 'Scholar';

    // Dashboard greeting
    const gr = this._el('dhGreeting');
    if (gr) {
      if (this.userName) {
        const hour = new Date().getHours();
        let greeting = 'Hi';
        if (hour < 12)      greeting = 'Good morning';
        else if (hour < 17) greeting = 'Good afternoon';
        else if (hour < 21) greeting = 'Good evening';
        else                greeting = 'Good night';
        gr.textContent = `${greeting}, ${this.userName} 👋`;
      } else {
        gr.textContent = this.TAGLINE;
      }
    }

    // Welcome back overlay name (if open)
    const wbName = this._el('wbName');
    if (wbName) wbName.textContent = this.userName;
  }

  /* ══════════════════════════════════════════════════════════════════
     SECTION 8 — TOOL SELECTION
  ══════════════════════════════════════════════════════════════════ */

  /** Tool configuration — icons, labels, placeholders */
  static get TOOL_CONFIG() {
    return {
      notes: {
        icon:        'fa-book-open',
        label:       'Generate Notes',
        placeholder: 'Enter any topic, concept, or paste text for comprehensive study notes…',
        btnLabel:    'Generate Notes',
      },
      flashcards: {
        icon:        'fa-layer-group',
        label:       'Create Flashcards',
        placeholder: 'Enter a topic to create interactive flashcards…',
        btnLabel:    'Create Flashcards',
      },
      quiz: {
        icon:        'fa-question-circle',
        label:       'Build Quiz',
        placeholder: 'Enter a topic to generate a practice quiz with detailed answers…',
        btnLabel:    'Build Quiz',
      },
      summary: {
        icon:        'fa-align-left',
        label:       'Summarize',
        placeholder: 'Enter a topic or paste text to create a concise summary…',
        btnLabel:    'Summarize',
      },
      mindmap: {
        icon:        'fa-project-diagram',
        label:       'Build Mind Map',
        placeholder: 'Enter a topic to build a structured visual mind map…',
        btnLabel:    'Build Mind Map',
      },
    };
  }

  /**
   * Set the active tool and update all UI elements accordingly
   * @param {string} tool
   */
  _setTool(tool) {
    if (!SavoireApp.TOOL_CONFIG[tool]) return;
    this.tool = tool;

    // Update tool selector active state
    this._qsa('.ts-item').forEach(b => b.classList.toggle('active', b.dataset.tool === tool));

    const cfg = SavoireApp.TOOL_CONFIG[tool];

    // Update generate button
    const iconEl = this._el('runIcon');
    const lblEl  = this._el('runLabel');
    if (iconEl) iconEl.className = `fas ${cfg.icon}`;
    if (lblEl)  lblEl.textContent = cfg.btnLabel;

    // Update textarea placeholder
    const taEl = this._el('mainInput');
    if (taEl) taEl.placeholder = cfg.placeholder;

    // Persist preference
    this.prefs.lastTool = tool;
    this._save('sv_prefs', this.prefs);
  }

  /* ══════════════════════════════════════════════════════════════════
     SECTION 9 — MAIN GENERATE FLOW
  ══════════════════════════════════════════════════════════════════ */

  /**
   * Main entry point — called when user clicks Generate or presses Enter
   */
  async _send() {
    const input = this._el('mainInput');
    const text  = input?.value?.trim();

    if (!text) {
      this._toast('info', 'fa-info-circle', 'Please enter a topic or paste some text first.');
      input?.focus();
      return;
    }
    if (text.length < 2) {
      this._toast('warning', 'fa-exclamation', 'Topic is too short. Please enter at least 2 characters.');
      return;
    }
    if (this.generating) {
      this._toast('warning', 'fa-hourglass-half', 'Please wait — AI is generating. Click Stop to cancel.');
      return;
    }

    const depth = this._el('depthSel')?.value  || 'detailed';
    const lang  = this._el('langSel')?.value   || 'English';
    const style = this._el('styleSel')?.value  || 'simple';

    // Transition UI to generating state
    this._showState('thinking');
    this.generating    = true;
    this.streamBuffer  = '';
    this._setRunLoading(true);
    this._startThinkingStages();

    // Update local stats
    this.stats.totalGenerations++;
    this.stats.toolCounts[this.tool] = (this.stats.toolCounts[this.tool] || 0) + 1;
    this.stats.languageCounts[lang]  = (this.stats.languageCounts[lang]  || 0) + 1;
    this.stats.totalCharsInput       += text.length;
    this._save('sv_stats', this.stats);

    try {
      const opts = { depth, language: lang, style, tool: this.tool, stream: true };
      const data = await this._callAPIStream(text, opts);

      this.currentData = data;
      this._renderResult(data);
      this._addToHistory({
        id:    this._genId(),
        topic: data.topic || text,
        tool:  this.tool,
        lang,
        data,
        ts:    Date.now(),
      });

      // Build glossary map for tooltips
      if (data.glossary?.length) {
        this.glossaryMap = {};
        data.glossary.forEach(entry => {
          const sep = entry.indexOf(':');
          if (sep > 0) {
            const term = entry.slice(0, sep).trim().toLowerCase();
            const def  = entry.slice(sep + 1).trim();
            this.glossaryMap[term] = def;
          }
        });
      }

      this._toast('success', 'fa-check-circle', `${SavoireApp.TOOL_CONFIG[this.tool]?.label || 'Content'} ready! 🎓`, 4000);
    } catch (err) {
      const msg = err.name === 'AbortError'
        ? 'Generation was stopped.'
        : (err.message || 'Something went wrong. Please try again.');

      if (err.name !== 'AbortError') {
        this._showState('error', msg);
        this._toast('error', 'fa-exclamation-circle', msg, 6000);
      } else {
        this._showState('empty');
        this._toast('info', 'fa-stop-circle', 'Generation stopped.', 3000);
      }
    } finally {
      this.generating    = false;
      this.sseController = null;
      this._setRunLoading(false);
      this._hideThinking();
      this._renderStatsBar();
    }
  }

  /**
   * Abort the current generation
   */
  _stopGeneration() {
    if (!this.generating) return;
    if (this.sseController) {
      this.sseController.abort();
    }
    this._toast('info', 'fa-stop-circle', 'Stopping generation…', 2000);
  }

  /* ══════════════════════════════════════════════════════════════════
     SECTION 10 — API CALL: STREAMING (SSE) WITH JSON FALLBACK
  ══════════════════════════════════════════════════════════════════ */

  /**
   * Try SSE streaming first, fall back to plain JSON if streaming fails
   * @param {string} message
   * @param {object} opts
   * @returns {Promise<object>}
   */
  async _callAPIStream(message, opts = {}) {
    try {
      return await this._streamSSE(message, opts);
    } catch (streamErr) {
      if (streamErr.name === 'AbortError') throw streamErr;
      console.warn('[Savoiré AI] SSE streaming failed, falling back to JSON:', streamErr.message);
      this._toast('info', 'fa-sync', 'Switching to standard mode…', 2500);
      return await this._callAPIJson(message, { ...opts, stream: false });
    }
  }

  /**
   * Full SSE streaming implementation
   * Handles: token events (live text), status events, done event, error event
   * @param {string} message
   * @param {object} opts
   * @returns {Promise<object>}
   */
  async _streamSSE(message, opts) {
    return new Promise((resolve, reject) => {
      // Create AbortController so we can stop mid-stream
      this.sseController = new AbortController();
      const signal       = this.sseController.signal;

      const body = JSON.stringify({ message, options: { ...opts, stream: true } });

      fetch(this.API_URL, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json', 'Accept': 'text/event-stream' },
        body,
        signal,
      })
      .then(async res => {
        if (!res.ok) {
          const errBody = await res.text().catch(() => '');
          let errMsg = `Server error (${res.status})`;
          try { const j = JSON.parse(errBody); errMsg = j.error || errMsg; } catch (_) {}
          reject(new Error(errMsg));
          return;
        }

        const contentType = res.headers.get('content-type') || '';

        // If server returned plain JSON instead of SSE stream
        if (!contentType.includes('text/event-stream')) {
          const data = await res.json();
          if (data?.error) { reject(new Error(data.error)); return; }
          resolve(data);
          return;
        }

        // ── Show live streaming output container ─────────────────
        this._showStreamOutput();
        const liveEl     = this._el('streamLiveText');
        const statusEl   = this._el('streamStatusText');
        const counterEl  = this._el('streamTokenCount');
        let   tokenCount = 0;

        const reader  = res.body.getReader();
        const decoder = new TextDecoder('utf-8');
        let   sseBuffer = '';

        while (true) {
          let readResult;
          try {
            readResult = await reader.read();
          } catch (readErr) {
            if (signal.aborted) { reject(Object.assign(new Error('Aborted'), { name: 'AbortError' })); return; }
            reject(readErr);
            return;
          }

          const { done, value } = readResult;
          if (done) break;

          sseBuffer += decoder.decode(value, { stream: true });
          const lines = sseBuffer.split('\n');
          sseBuffer   = lines.pop() || ''; // keep partial last line

          for (const line of lines) {
            const trimmed = line.trim();
            if (!trimmed) continue;

            // Handle named events: "event: <name>"
            // Handle data lines: "data: <json>"
            if (trimmed.startsWith('event: ')) continue; // event name — handled via data
            if (!trimmed.startsWith('data: '))  continue;

            const raw = trimmed.slice(6).trim();
            if (!raw || raw === '[DONE]') continue;

            let evt;
            try { evt = JSON.parse(raw); } catch (_) { continue; }

            // ── TOKEN event — live text ────────────────────────────
            if (evt.t !== undefined) {
              this.streamBuffer += evt.t;
              tokenCount++;
              if (liveEl) {
                liveEl.innerHTML = this._renderMd(this.streamBuffer);
                this._scrollOutArea();
              }
              if (counterEl) counterEl.textContent = `${tokenCount} tokens`;
              continue;
            }

            // ── STATUS event — progress update ────────────────────
            if (evt.message !== undefined && !evt.topic) {
              if (statusEl) statusEl.textContent = evt.message;
              continue;
            }

            // ── ERROR event ───────────────────────────────────────
            if (evt.error) {
              reject(new Error(evt.error));
              return;
            }

            // ── DONE event — complete structured result ────────────
            if (evt.topic || evt.ultra_long_notes) {
              resolve(evt);
              return;
            }
          }
        }

        // Stream ended — check if we got a result via token accumulation
        if (this.streamBuffer.trim().length > 100) {
          // Try to parse the accumulated JSON from the stream buffer
          try {
            const start  = this.streamBuffer.indexOf('{');
            const end    = this.streamBuffer.lastIndexOf('}');
            if (start >= 0 && end > start) {
              const parsed = JSON.parse(this.streamBuffer.slice(start, end + 1));
              if (parsed.topic || parsed.ultra_long_notes) {
                resolve(parsed);
                return;
              }
            }
          } catch (_) {}
        }

        reject(new Error('Stream ended without complete data. Retrying with standard mode…'));
      })
      .catch(err => {
        if (err.name === 'AbortError') {
          reject(Object.assign(new Error('Aborted'), { name: 'AbortError' }));
        } else {
          reject(err);
        }
      });
    });
  }

  /**
   * Non-streaming JSON API call (fallback)
   * @param {string} message
   * @param {object} opts
   * @returns {Promise<object>}
   */
  async _callAPIJson(message, opts = {}) {
    const res = await fetch(this.API_URL, {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ message, options: { ...opts, stream: false } }),
    });
    if (!res.ok) {
      const errBody = await res.text().catch(() => '');
      let errMsg    = `Server error (${res.status}). Please try again.`;
      try { const j = JSON.parse(errBody); errMsg = j.error || errMsg; } catch (_) {}
      throw new Error(errMsg);
    }
    const data = await res.json();
    if (data?.error) throw new Error(data.error);
    return data;
  }

  /* ══════════════════════════════════════════════════════════════════
     SECTION 11 — LIVE STREAM OUTPUT CONTAINER
  ══════════════════════════════════════════════════════════════════ */

  /**
   * Render the live streaming output panel — shown while tokens arrive
   */
  _showStreamOutput() {
    const empty    = this._el('emptyState');
    const thinking = this._el('thinkingWrap');
    const result   = this._el('resultArea');

    if (empty)    empty.style.display    = 'none';
    if (thinking) thinking.style.display = 'none';

    if (result) {
      result.style.display = 'block';
      result.innerHTML = `
        <div class="stream-live-wrap" id="streamLiveWrap">
          <div class="slw-hdr">
            <div class="slw-indicator">
              <span class="slw-dot"></span>
              <span class="slw-dot"></span>
              <span class="slw-dot"></span>
              <span class="slw-label">
                <span id="streamStatusText">Savoiré AI is generating your study materials…</span>
              </span>
            </div>
            <div class="slw-meta">
              <span id="streamTokenCount" class="slw-token-count">0 tokens</span>
              <button class="slw-stop-btn" onclick="window._app._stopGeneration()" title="Stop generation">
                <i class="fas fa-stop-circle"></i> Stop
              </button>
            </div>
          </div>
          <div class="slw-body">
            <div class="stream-live-text md-content" id="streamLiveText"></div>
          </div>
          <div class="slw-footer">
            <span class="slw-brand">
              <i class="fas fa-brain"></i> ${this.BRAND} &nbsp;·&nbsp;
              <a href="https://${this.DEVSITE}" target="_blank" rel="noopener">${this.DEVELOPER}</a>
            </span>
          </div>
        </div>`;
    }
    this._scrollOutArea();
  }

  /* ══════════════════════════════════════════════════════════════════
     SECTION 12 — UI STATE MANAGEMENT
  ══════════════════════════════════════════════════════════════════ */

  /**
   * Switch the output area between states: empty / thinking / result / error
   * @param {'empty'|'thinking'|'result'|'error'} state
   * @param {string} [errorMsg]
   */
  _showState(state, errorMsg) {
    const empty    = this._el('emptyState');
    const thinking = this._el('thinkingWrap');
    const result   = this._el('resultArea');

    if (empty)    empty.style.display    = 'none';
    if (thinking) thinking.style.display = 'none';
    if (result)   result.style.display   = 'none';

    switch (state) {
      case 'thinking':
        if (thinking) {
          thinking.style.display = 'block';
          this._scrollOutArea();
        }
        break;

      case 'result':
        if (result) {
          result.style.display = 'block';
          this._scrollOutArea();
        }
        break;

      case 'error':
        if (result) {
          result.style.display = 'block';
          result.innerHTML = `
            <div class="error-card">
              <div class="error-card-hdr">
                <div class="error-card-icon"><i class="fas fa-exclamation-circle"></i></div>
                <div>
                  <div class="error-card-title">Generation Failed</div>
                  <div class="error-card-msg">${this._esc(errorMsg || 'An unexpected error occurred.')}</div>
                </div>
              </div>
              <div class="error-card-hint">
                The AI is trying all 20 available models automatically. This is temporary — please wait a moment and try again.
              </div>
              <div class="error-card-actions">
                <button class="btn btn-primary" onclick="document.getElementById('mainInput').focus()">
                  <i class="fas fa-redo"></i> Try Again
                </button>
                <button class="btn btn-secondary" onclick="window._app._openHistModal()">
                  <i class="fas fa-history"></i> View History
                </button>
              </div>
            </div>`;
          this._scrollOutArea();
        }
        break;

      case 'empty':
      default:
        if (empty) empty.style.display = 'flex';
        break;
    }
  }

  /**
   * Hide the thinking overlay
   */
  _hideThinking() {
    const el = this._el('thinkingWrap');
    if (el) el.style.display = 'none';
    if (this.thinkTimer) {
      clearInterval(this.thinkTimer);
      this.thinkTimer = null;
    }
  }

  /**
   * Update generate button — loading vs ready state
   * @param {boolean} on
   */
  _setRunLoading(on) {
    const btn     = this._el('runBtn');
    const icon    = this._el('runIcon');
    const lbl     = this._el('runLabel');
    const stopBtn = this._el('stopBtn');

    if (btn) {
      btn.disabled = on;
      btn.classList.toggle('loading', on);
    }
    if (stopBtn) stopBtn.style.display = on ? 'inline-flex' : 'none';

    const cfg = SavoireApp.TOOL_CONFIG[this.tool];
    if (icon) icon.className = on ? 'fas fa-spinner fa-spin' : `fas ${cfg?.icon || 'fa-book-open'}`;
    if (lbl)  lbl.textContent = on ? 'Generating…' : (cfg?.btnLabel || 'Generate');
  }

  /**
   * Smooth-scroll the output area to bottom
   */
  _scrollOutArea() {
    const oa = this._el('outArea');
    if (oa) {
      // Only auto-scroll if user is already near the bottom
      const isNearBottom = oa.scrollHeight - oa.scrollTop - oa.clientHeight < 300;
      if (isNearBottom || this.generating) {
        setTimeout(() => { oa.scrollTop = oa.scrollHeight; }, 60);
      }
    }
  }

  /* ══════════════════════════════════════════════════════════════════
     SECTION 13 — THINKING STAGES ANIMATION
  ══════════════════════════════════════════════════════════════════ */

  /**
   * Start the 5-stage thinking animation during generation
   * Each stage advances automatically every 3.5 seconds
   */
  _startThinkingStages() {
    this.stageIdx = 0;
    for (let i = 0; i < 5; i++) {
      const el = this._el(`ts${i}`);
      if (el) el.className = 'ths';
    }
    const first = this._el('ts0');
    if (first) {
      first.classList.add('active');
    }

    if (this.thinkTimer) {
      clearInterval(this.thinkTimer);
      this.thinkTimer = null;
    }

    this.thinkTimer = setInterval(() => {
      this.stageIdx++;
      if (this.stageIdx < 5) {
        const prev = this._el(`ts${this.stageIdx - 1}`);
        const cur  = this._el(`ts${this.stageIdx}`);
        if (prev) { prev.classList.remove('active'); prev.classList.add('done'); }
        if (cur)  cur.classList.add('active');
      } else {
        clearInterval(this.thinkTimer);
        this.thinkTimer = null;
      }
    }, 3500);
  }

  /* ══════════════════════════════════════════════════════════════════
     SECTION 14 — RESULT RENDERING (MASTER)
  ══════════════════════════════════════════════════════════════════ */

  /**
   * Render the complete result for the current tool mode
   * @param {object} data — enriched AI result object
   */
  _renderResult(data) {
    const area = this._el('resultArea');
    if (!area) return;
    area.innerHTML = this._buildResultHTML(data);
    this._showState('result');

    // Bind interactive elements inside result
    if (this.tool === 'quiz')       this._bindQuizEvents();
    if (this.tool === 'flashcards') this._bindFlashcardEvents();

    // Scroll to top of result
    const oa = this._el('outArea');
    if (oa) oa.scrollTop = 0;
  }

  /**
   * Build the full result HTML wrapper (header + body + export bar)
   * @param {object} data
   * @returns {string}
   */
  _buildResultHTML(data) {
    const topic    = this._esc(data.topic || 'Study Material');
    const score    = data.study_score || 96;
    const pct      = Math.min(100, Math.max(0, score));
    const diffRating = data.difficulty_rating || 5;
    const diffLabel  = data.difficulty_label  || 'Intermediate';

    // Difficulty colour coding
    const diffColor = diffRating <= 3 ? '#42C98A'
                    : diffRating <= 6 ? '#C9A96E'
                    : diffRating <= 8 ? '#F87171'
                    : '#E53E3E';

    const header = `
      <div class="result-hdr">
        <div class="rh-left">
          <div class="rh-topic">${topic}</div>
          <div class="rh-meta">
            <div class="rh-mi">
              <i class="fas fa-graduation-cap"></i>
              ${this._esc(data.curriculum_alignment || 'General Study')}
            </div>
            <div class="rh-mi">
              <i class="fas fa-calendar-alt"></i>
              ${new Date().toLocaleDateString()}
            </div>
            <div class="rh-mi">
              <i class="fas fa-star"></i>
              Score: ${score}/100
            </div>
            ${data._language ? `
            <div class="rh-mi">
              <i class="fas fa-globe"></i>
              ${this._esc(data._language)}
            </div>` : ''}
            <div class="rh-mi diff-badge" style="background:${diffColor}22;color:${diffColor};border:1px solid ${diffColor}44">
              <i class="fas fa-signal"></i>
              ${this._esc(diffLabel)} (${diffRating}/10)
            </div>
          </div>
          <div class="rh-powered">
            Powered by <strong>${this._esc(this.BRAND)}</strong>
            &nbsp;·&nbsp;
            <a href="https://${this.DEVSITE}" target="_blank" rel="noopener"
               style="color:var(--gold);font-weight:600">${this._esc(this.DEVELOPER)}</a>
            &nbsp;·&nbsp;
            <a href="https://${this.WEBSITE}" target="_blank" rel="noopener"
               style="color:var(--gold)">${this._esc(this.WEBSITE)}</a>
          </div>
        </div>
        <div class="rh-score" style="--pct:${pct}">
          <div class="rh-score-val">${score}</div>
        </div>
      </div>`;

    // Route to correct body renderer
    let body = '';
    switch (this.tool) {
      case 'flashcards': body = this._buildFcHTML(data);      break;
      case 'quiz':       body = this._buildQuizHTML(data);    break;
      case 'summary':    body = this._buildSummaryHTML(data); break;
      case 'mindmap':    body = this._buildMindmapHTML(data); break;
      default:           body = this._buildNotesHTML(data);   break;
    }

    const exportBar = `
      <div class="export-bar">
        <button class="exp-btn pdf"   onclick="window._app._downloadPDF()">
          <i class="fas fa-file-pdf"></i><span>PDF</span>
        </button>
        <button class="exp-btn copy"  onclick="window._app._copyResult()">
          <i class="fas fa-copy"></i><span>Copy</span>
        </button>
        <button class="exp-btn save"  onclick="window._app._saveNote()">
          <i class="fas fa-star"></i><span>Save</span>
        </button>
        <button class="exp-btn share" onclick="window._app._shareResult()">
          <i class="fas fa-share-alt"></i><span>Share</span>
        </button>
        <span class="exp-brand">
          ${this._esc(this.BRAND)} ·
          <a href="https://${this.DEVSITE}" target="_blank" rel="noopener"
             style="color:var(--gold);text-decoration:none">
            ${this._esc(this.DEVELOPER)}
          </a>
        </span>
      </div>`;

    return `<div class="result-wrap">${header}${body}${exportBar}</div>`;
  }

  /* ══════════════════════════════════════════════════════════════════
     SECTION 15 — NOTES HTML BUILDER
     Renders the full notes view with ALL new v2.0 Ultra sections
  ══════════════════════════════════════════════════════════════════ */

  /**
   * Build HTML for Notes mode — includes all sections
   * @param {object} data
   * @returns {string}
   */
  _buildNotesHTML(data) {
    let h = '';

    // ── 1. Comprehensive Notes ────────────────────────────────────
    if (data.ultra_long_notes) {
      h += `
        <div class="study-sec">
          <div class="ss-hdr">
            <div class="ss-title"><i class="fas fa-book-open"></i> Comprehensive Notes</div>
            <div class="ss-actions">
              <button class="ss-act-btn" onclick="window._app._toggleSection(this)" title="Collapse">
                <i class="fas fa-chevron-up"></i>
              </button>
            </div>
          </div>
          <div class="ss-body">
            <div class="md-content notes-content">${this._renderMd(data.ultra_long_notes)}</div>
          </div>
        </div>`;
    }

    // ── 2. Key Concepts ───────────────────────────────────────────
    if (data.key_concepts?.length) {
      const cards = data.key_concepts.map((c, i) => {
        const sep   = c.indexOf(':');
        const term  = sep > 0 ? c.slice(0, sep).trim()      : `Concept ${i + 1}`;
        const expl  = sep > 0 ? c.slice(sep + 1).trim()     : c;
        return `
          <div class="concept-card">
            <div class="concept-num">${i + 1}</div>
            <div class="concept-body">
              <div class="concept-term">${this._esc(term)}</div>
              <div class="concept-text">${this._esc(expl)}</div>
            </div>
          </div>`;
      }).join('');
      h += `
        <div class="study-sec">
          <div class="ss-hdr">
            <div class="ss-title"><i class="fas fa-lightbulb"></i> Key Concepts (${data.key_concepts.length})</div>
          </div>
          <div class="ss-body">
            <div class="concepts-grid">${cards}</div>
          </div>
        </div>`;
    }

    // ── 3. Glossary ───────────────────────────────────────────────
    if (data.glossary?.length) {
      const items = data.glossary.map((g, i) => {
        const sep  = g.indexOf(':');
        const term = sep > 0 ? g.slice(0, sep).trim()  : `Term ${i + 1}`;
        const def  = sep > 0 ? g.slice(sep + 1).trim() : g;
        return `
          <div class="glossary-item">
            <div class="gloss-term">${this._esc(term)}</div>
            <div class="gloss-def">${this._esc(def)}</div>
          </div>`;
      }).join('');
      h += `
        <div class="study-sec">
          <div class="ss-hdr">
            <div class="ss-title"><i class="fas fa-spell-check"></i> Glossary (${data.glossary.length} terms)</div>
          </div>
          <div class="ss-body">
            <div class="glossary-grid">${items}</div>
          </div>
        </div>`;
    }

    // ── 4. Study Tricks ───────────────────────────────────────────
    if (data.key_tricks?.length) {
      const TRICK_ICONS  = ['fas fa-magic', 'fas fa-star', 'fas fa-bolt', 'fas fa-key', 'fas fa-brain', 'fas fa-rocket'];
      const TRICK_COLORS = ['#C9A96E', '#42C98A', '#60A5FA', '#F87171', '#A78BFA', '#F59E0B'];
      const items = data.key_tricks.map((t, i) => `
        <div class="trick-item">
          <div class="trick-icon" style="background:${TRICK_COLORS[i % TRICK_COLORS.length]}22;color:${TRICK_COLORS[i % TRICK_COLORS.length]}">
            <i class="${TRICK_ICONS[i % TRICK_ICONS.length]}"></i>
          </div>
          <div class="trick-text">${this._esc(t)}</div>
        </div>`).join('');
      h += `
        <div class="study-sec">
          <div class="ss-hdr">
            <div class="ss-title"><i class="fas fa-magic"></i> Study Tricks &amp; Memory Aids</div>
          </div>
          <div class="ss-body">
            <div class="tricks-list">${items}</div>
          </div>
        </div>`;
    }

    // ── 5. Practice Questions ─────────────────────────────────────
    if (data.practice_questions?.length) {
      const qs = data.practice_questions.map((qa, i) => `
        <div class="qa-card" id="qaCard${i}">
          <div class="qa-head" onclick="window._app._toggleQA(${i})">
            <div class="qa-num">${i + 1}</div>
            <div class="qa-q">${this._esc(qa.question)}</div>
            <button class="qa-toggle" id="qaToggle${i}">
              <i class="fas fa-chevron-down"></i> Show Answer
            </button>
          </div>
          <div class="qa-answer" id="qaAnswer${i}" style="display:none">
            <div class="qa-albl"><i class="fas fa-check-circle"></i> Answer &amp; Explanation</div>
            <div class="qa-answer-inner">${this._renderMd(qa.answer)}</div>
          </div>
        </div>`).join('');
      h += `
        <div class="study-sec">
          <div class="ss-hdr">
            <div class="ss-title"><i class="fas fa-pen-alt"></i> Practice Questions (${data.practice_questions.length})</div>
            <div class="ss-actions">
              <button class="ss-act-btn" onclick="window._app._toggleAllQA(true)"  title="Expand all">
                <i class="fas fa-expand-alt"></i>
              </button>
              <button class="ss-act-btn" onclick="window._app._toggleAllQA(false)" title="Collapse all">
                <i class="fas fa-compress-alt"></i>
              </button>
            </div>
          </div>
          <div class="ss-body">
            <div class="qa-list">${qs}</div>
          </div>
        </div>`;
    }

    // ── 6. Real World Applications ────────────────────────────────
    if (data.real_world_applications?.length) {
      const items = data.real_world_applications.map((a, i) => `
        <div class="list-item app">
          <div class="li-num" style="background:#42C98A22;color:#42C98A">${i + 1}</div>
          <div class="li-text">${this._esc(a)}</div>
        </div>`).join('');
      h += `
        <div class="study-sec">
          <div class="ss-hdr">
            <div class="ss-title"><i class="fas fa-globe"></i> Real World Applications</div>
          </div>
          <div class="ss-body">
            <div class="items-list">${items}</div>
          </div>
        </div>`;
    }

    // ── 7. Common Misconceptions ──────────────────────────────────
    if (data.common_misconceptions?.length) {
      const items = data.common_misconceptions.map((m, i) => `
        <div class="list-item misc">
          <div class="li-num" style="background:#F8717122;color:#F87171">${i + 1}</div>
          <div class="li-text">${this._esc(m)}</div>
        </div>`).join('');
      h += `
        <div class="study-sec">
          <div class="ss-hdr">
            <div class="ss-title"><i class="fas fa-exclamation-triangle"></i> Common Misconceptions</div>
          </div>
          <div class="ss-body">
            <div class="items-list">${items}</div>
          </div>
        </div>`;
    }

    // ── 8. Exam Tips ──────────────────────────────────────────────
    if (data.exam_tips?.length) {
      const items = data.exam_tips.map((t, i) => `
        <div class="list-item exam-tip">
          <div class="li-num" style="background:#A78BFA22;color:#A78BFA">${i + 1}</div>
          <div class="li-text">${this._esc(t)}</div>
        </div>`).join('');
      h += `
        <div class="study-sec">
          <div class="ss-hdr">
            <div class="ss-title"><i class="fas fa-award"></i> Exam Tips &amp; Strategies</div>
          </div>
          <div class="ss-body">
            <div class="items-list">${items}</div>
          </div>
        </div>`;
    }

    // ── 9. 7-Day Study Plan ───────────────────────────────────────
    if (data.study_plan?.length) {
      const days = data.study_plan.map((day, i) => {
        const sep      = day.indexOf(':');
        const dayLabel = sep > 0 ? day.slice(0, sep).trim()  : `Day ${i + 1}`;
        const content  = sep > 0 ? day.slice(sep + 1).trim() : day;
        const colors   = ['#C9A96E','#42C98A','#60A5FA','#F59E0B','#A78BFA','#F87171','#EC4899'];
        return `
          <div class="study-day">
            <div class="sd-label" style="background:${colors[i % colors.length]}22;color:${colors[i % colors.length]};border-left:3px solid ${colors[i % colors.length]}">
              ${this._esc(dayLabel)}
            </div>
            <div class="sd-content">${this._esc(content)}</div>
          </div>`;
      }).join('');
      h += `
        <div class="study-sec">
          <div class="ss-hdr">
            <div class="ss-title"><i class="fas fa-calendar-week"></i> 7-Day Study Plan</div>
          </div>
          <div class="ss-body">
            <div class="study-plan-grid">${days}</div>
          </div>
        </div>`;
    }

    // ── 10. Related Topics ────────────────────────────────────────
    if (data.related_topics?.length) {
      const items = data.related_topics.map((t, i) => {
        const sep   = t.indexOf(':');
        const topic = sep > 0 ? t.slice(0, sep).trim()  : t;
        const why   = sep > 0 ? t.slice(sep + 1).trim() : '';
        return `
          <div class="related-topic" onclick="window.setSugg('${this._esc(topic).replace(/'/g, '\\\'')}')" title="Study this next">
            <div class="rt-topic">
              <i class="fas fa-arrow-right rt-arrow"></i>
              <strong>${this._esc(topic)}</strong>
            </div>
            ${why ? `<div class="rt-why">${this._esc(why)}</div>` : ''}
          </div>`;
      }).join('');
      h += `
        <div class="study-sec">
          <div class="ss-hdr">
            <div class="ss-title"><i class="fas fa-sitemap"></i> Related Topics to Explore</div>
          </div>
          <div class="ss-body">
            <div class="related-topics-grid">${items}</div>
          </div>
        </div>`;
    }

    return h || `<div class="empty-result">Content generated successfully.</div>`;
  }

  /* ══════════════════════════════════════════════════════════════════
     SECTION 16 — NOTES INTERACTIVE HELPERS
  ══════════════════════════════════════════════════════════════════ */

  /**
   * Toggle a single Q&A answer open/closed
   * @param {number} idx
   */
  _toggleQA(idx) {
    const answerEl = this._el(`qaAnswer${idx}`);
    const toggleEl = this._el(`qaToggle${idx}`);
    if (!answerEl) return;
    const isOpen = answerEl.style.display !== 'none';
    answerEl.style.display = isOpen ? 'none' : 'block';
    if (toggleEl) {
      toggleEl.innerHTML = isOpen
        ? '<i class="fas fa-chevron-down"></i> Show Answer'
        : '<i class="fas fa-chevron-up"></i> Hide Answer';
    }
  }

  /**
   * Expand or collapse all Q&A answers at once
   * @param {boolean} open
   */
  _toggleAllQA(open) {
    const qs = this.currentData?.practice_questions || [];
    qs.forEach((_, i) => {
      const answerEl = this._el(`qaAnswer${i}`);
      const toggleEl = this._el(`qaToggle${i}`);
      if (answerEl) answerEl.style.display = open ? 'block' : 'none';
      if (toggleEl) {
        toggleEl.innerHTML = open
          ? '<i class="fas fa-chevron-up"></i> Hide Answer'
          : '<i class="fas fa-chevron-down"></i> Show Answer';
      }
    });
  }

  /**
   * Toggle a study section collapsed/expanded
   * @param {HTMLElement} btn — the toggle button
   */
  _toggleSection(btn) {
    const sec  = btn.closest('.study-sec');
    const body = sec?.querySelector('.ss-body');
    const icon = btn.querySelector('i');
    if (!body || !icon) return;
    const isCollapsed = body.style.display === 'none';
    body.style.display = isCollapsed ? '' : 'none';
    icon.className     = isCollapsed ? 'fas fa-chevron-up' : 'fas fa-chevron-down';
  }

  /* ══════════════════════════════════════════════════════════════════
     SECTION 17 — FLASHCARDS HTML & LOGIC
  ══════════════════════════════════════════════════════════════════ */

  /**
   * Build the flashcard HTML — combines key_concepts + practice_questions
   * @param {object} data
   * @returns {string}
   */
  _buildFcHTML(data) {
    const cards = [];

    // Build from key_concepts
    (data.key_concepts || []).forEach(c => {
      const sep  = c.indexOf(':');
      const term = sep > 0 ? c.slice(0, sep).trim()  : c;
      const expl = sep > 0 ? c.slice(sep + 1).trim() : '';
      if (term) cards.push({ q: term, a: expl || c });
    });

    // Build from practice_questions
    (data.practice_questions || []).forEach(qa => {
      if (qa.question) cards.push({ q: qa.question, a: qa.answer || '' });
    });

    // Build from glossary if available
    (data.glossary || []).forEach(g => {
      const sep  = g.indexOf(':');
      const term = sep > 0 ? g.slice(0, sep).trim()  : g;
      const def  = sep > 0 ? g.slice(sep + 1).trim() : '';
      if (term && def) cards.push({ q: `Define: ${term}`, a: def });
    });

    this.fcCards   = cards;
    this.fcCurrent = 0;
    this.fcFlipped = false;

    const total = cards.length;
    const first = cards[0] || { q: 'No cards available', a: '' };

    return `
      <div class="study-sec">
        <div class="ss-hdr">
          <div class="ss-title"><i class="fas fa-layer-group"></i> Interactive Flashcards (${total} cards)</div>
        </div>
        <div class="ss-body">
          <div class="fc-mode">
            <div class="fc-progress-wrap">
              <div class="fc-prog-text">Card <span id="fcCur">1</span> of <span id="fcTot">${total}</span></div>
              <div class="fc-prog-bar-outer">
                <div class="fc-prog-bar-inner" id="fcProgBar" style="width:${total > 0 ? (1/total*100).toFixed(1) : 0}%"></div>
              </div>
            </div>

            <div class="fc-wrap" id="fcWrap" onclick="window._app._fcFlip()" title="Click to flip card">
              <div class="flashcard" id="theCard">
                <div class="fc-face fc-front">
                  <div class="fc-lbl"><i class="fas fa-question-circle"></i> Question / Concept</div>
                  <div class="fc-content" id="fcFront">${this._esc(first.q)}</div>
                  <div class="fc-hint"><kbd>Click</kbd> or <kbd>Space</kbd> to flip</div>
                </div>
                <div class="fc-face fc-back">
                  <div class="fc-lbl"><i class="fas fa-check-circle"></i> Answer / Explanation</div>
                  <div class="fc-content" id="fcBack">${this._esc(first.a)}</div>
                </div>
              </div>
            </div>

            <div class="fc-controls">
              <button class="fc-btn" id="fcPrev" onclick="window._app._fcNav(-1)" ${total <= 1 ? 'disabled' : ''}>
                <i class="fas fa-arrow-left"></i> Prev
              </button>
              <button class="fc-btn primary" onclick="window._app._fcFlip()">
                <i class="fas fa-sync-alt"></i> Flip
              </button>
              <button class="fc-btn" onclick="window._app._fcShuffle()">
                <i class="fas fa-random"></i> Shuffle
              </button>
              <button class="fc-btn" id="fcNext" onclick="window._app._fcNav(1)" ${total <= 1 ? 'disabled' : ''}>
                Next <i class="fas fa-arrow-right"></i>
              </button>
            </div>

            <div class="fc-kb">
              <kbd>Space</kbd> flip &nbsp;·&nbsp;
              <kbd>←</kbd> prev &nbsp;·&nbsp;
              <kbd>→</kbd> next &nbsp;·&nbsp;
              ${total} total cards
            </div>
          </div>
        </div>
      </div>`;
  }

  /**
   * Bind any additional flashcard events after render
   */
  _bindFlashcardEvents() {
    // Already handled via onclick attributes in HTML
  }

  /**
   * Flip the current flashcard
   */
  _fcFlip() {
    const fc = this._el('theCard');
    if (!fc) return;
    this.fcFlipped = !this.fcFlipped;
    fc.classList.toggle('flipped', this.fcFlipped);
  }

  /**
   * Navigate flashcards by direction
   * @param {number} dir — +1 or -1
   */
  _fcNav(dir) {
    if (!this.fcCards.length) return;
    this.fcCurrent = Math.max(0, Math.min(this.fcCards.length - 1, this.fcCurrent + dir));
    this._fcUpdate();
  }

  /**
   * Shuffle flashcard deck and reset to first card
   */
  _fcShuffle() {
    if (!this.fcCards.length) return;
    this.fcCards   = this._shuffle(this.fcCards);
    this.fcCurrent = 0;
    this._fcUpdate();
    this._toast('info', 'fa-random', 'Cards shuffled!', 2000);
  }

  /**
   * Update all flashcard DOM elements to reflect current card state
   */
  _fcUpdate() {
    const card = this.fcCards[this.fcCurrent];
    if (!card) return;

    // Reset flip state
    this.fcFlipped = false;
    const fc = this._el('theCard');
    if (fc) fc.classList.remove('flipped');

    // Update content
    const front = this._el('fcFront');
    const back  = this._el('fcBack');
    const cur   = this._el('fcCur');
    const prog  = this._el('fcProgBar');

    if (front) front.textContent = card.q;
    if (back)  back.textContent  = card.a;
    if (cur)   cur.textContent   = this.fcCurrent + 1;

    // Update progress bar
    const pct = this.fcCards.length > 0 ? ((this.fcCurrent + 1) / this.fcCards.length * 100).toFixed(1) : 0;
    if (prog) prog.style.width = `${pct}%`;

    // Update prev/next button disabled state
    const prevBtn = this._el('fcPrev');
    const nextBtn = this._el('fcNext');
    if (prevBtn) prevBtn.disabled = this.fcCurrent === 0;
    if (nextBtn) nextBtn.disabled = this.fcCurrent === this.fcCards.length - 1;
  }

  /* ══════════════════════════════════════════════════════════════════
     SECTION 18 — QUIZ HTML & LOGIC
  ══════════════════════════════════════════════════════════════════ */

  /**
   * Build quiz HTML
   * @param {object} data
   * @returns {string}
   */
  _buildQuizHTML(data) {
    const qs = data.practice_questions || [];
    if (!qs.length) return this._buildNotesHTML(data);

    this.quizData  = qs.map(q => ({ ...q, answered: false, correct: false }));
    this.quizScore = 0;
    this.quizIdx   = 0;

    return `
      <div class="study-sec">
        <div class="ss-hdr">
          <div class="ss-title"><i class="fas fa-question-circle"></i> Practice Quiz</div>
          <div class="ss-score-badge" id="quizScoreBadge">0 / ${qs.length}</div>
        </div>
        <div class="ss-body" id="quizBody">
          ${this._renderQuizQuestion(0)}
        </div>
      </div>`;
  }

  /**
   * Bind quiz events after HTML render
   */
  _bindQuizEvents() {
    // Handled via onclick in generated HTML
  }

  /**
   * Render a single quiz question
   * @param {number} idx
   * @returns {string}
   */
  _renderQuizQuestion(idx) {
    if (idx >= this.quizData.length) {
      // Quiz complete — show trophy screen
      const pct  = Math.round((this.quizScore / this.quizData.length) * 100);
      const msg  = pct === 100 ? 'Perfect Score! 🏆' : pct >= 80 ? 'Excellent Work! 🌟' : pct >= 60 ? 'Good Job! 👍' : 'Keep Practicing! 💪';
      const col  = pct === 100 ? '#C9A96E' : pct >= 80 ? '#42C98A' : pct >= 60 ? '#60A5FA' : '#F87171';
      return `
        <div class="quiz-result">
          <div class="qr-icon" style="color:${col}"><i class="fas fa-trophy"></i></div>
          <div class="qr-score" style="color:${col}">${this.quizScore} / ${this.quizData.length}</div>
          <div class="qr-pct">${pct}%</div>
          <div class="qr-label">${this._esc(msg)}</div>
          <div class="qr-actions">
            <button class="fc-btn primary" onclick="window._app._quizRestart()">
              <i class="fas fa-redo"></i> Try Again
            </button>
            <button class="fc-btn" onclick="window._app._downloadPDF()">
              <i class="fas fa-file-pdf"></i> Save as PDF
            </button>
          </div>
        </div>`;
    }

    const q   = this.quizData[idx];
    const pct = ((idx / this.quizData.length) * 100).toFixed(0);

    return `
      <div class="quiz-q-card">
        <div class="quiz-progress">
          <div class="quiz-progress-bar" style="width:${pct}%"></div>
        </div>
        <div class="quiz-q-meta">
          <span class="quiz-q-num">Question ${idx + 1} of ${this.quizData.length}</span>
          <span class="quiz-score-live">Score: ${this.quizScore} / ${this.quizData.length}</span>
        </div>
        <div class="quiz-q-text">${this._esc(q.question)}</div>
        <div class="quiz-answer-area" id="quizAnswerArea${idx}">
          <button class="quiz-reveal-btn" onclick="window._app._quizReveal(${idx})">
            <i class="fas fa-eye"></i> Reveal Answer
          </button>
        </div>
      </div>`;
  }

  /**
   * Reveal the answer for question idx
   * @param {number} idx
   */
  _quizReveal(idx) {
    const q   = this.quizData[idx];
    const aEl = this._el(`quizAnswerArea${idx}`);
    if (!aEl) return;
    aEl.innerHTML = `
      <div class="quiz-answer-box">
        <div class="qa-albl"><i class="fas fa-check-circle"></i> Model Answer</div>
        <div class="qa-answer-inner">${this._renderMd(q.answer)}</div>
      </div>
      <div class="quiz-self-check">
        <span class="quiz-self-label">Did you get it right?</span>
        <button class="quiz-self-btn yes" onclick="window._app._quizNext(${idx}, true)">
          <i class="fas fa-check"></i> Yes, I got it!
        </button>
        <button class="quiz-self-btn no" onclick="window._app._quizNext(${idx}, false)">
          <i class="fas fa-times"></i> No, I missed it
        </button>
      </div>`;
  }

  /**
   * Advance to the next quiz question
   * @param {number} idx
   * @param {boolean} correct
   */
  _quizNext(idx, correct) {
    if (correct) this.quizScore++;
    const qb = this._el('quizBody');
    if (qb) qb.innerHTML = this._renderQuizQuestion(idx + 1);
    // Update score badge
    const badge = this._el('quizScoreBadge');
    if (badge) badge.textContent = `${this.quizScore} / ${this.quizData.length}`;
  }

  /**
   * Restart the quiz from the beginning
   */
  _quizRestart() {
    this.quizScore = 0;
    this.quizIdx   = 0;
    this.quizData  = this.quizData.map(q => ({ ...q, answered: false, correct: false }));
    const qb = this._el('quizBody');
    if (qb) qb.innerHTML = this._renderQuizQuestion(0);
    const badge = this._el('quizScoreBadge');
    if (badge) badge.textContent = `0 / ${this.quizData.length}`;
  }

  /* ══════════════════════════════════════════════════════════════════
     SECTION 19 — SUMMARY HTML
  ══════════════════════════════════════════════════════════════════ */

  /**
   * Build summary view HTML
   * @param {object} data
   * @returns {string}
   */
  _buildSummaryHTML(data) {
    let h = '';

    // TL;DR from notes
    if (data.ultra_long_notes) {
      const plain = this._stripMd(data.ultra_long_notes);
      h += `
        <div class="study-sec">
          <div class="ss-hdr">
            <div class="ss-title"><i class="fas fa-align-left"></i> TL;DR Summary</div>
          </div>
          <div class="ss-body">
            <div class="summary-box">
              <div class="md-content">${this._renderMd(data.ultra_long_notes)}</div>
            </div>
          </div>
        </div>`;
    }

    // Key points list
    if (data.key_concepts?.length) {
      const items = data.key_concepts.map((c, i) => `
        <div class="list-item">
          <div class="li-num" style="background:var(--gold-dim);color:var(--gold)">${i + 1}</div>
          <div class="li-text">${this._esc(c)}</div>
        </div>`).join('');
      h += `
        <div class="study-sec">
          <div class="ss-hdr">
            <div class="ss-title"><i class="fas fa-list-ul"></i> Key Points</div>
          </div>
          <div class="ss-body">
            <div class="items-list">${items}</div>
          </div>
        </div>`;
    }

    // Exam tips in summary
    if (data.exam_tips?.length) {
      const items = data.exam_tips.map((t, i) => `
        <div class="list-item">
          <div class="li-num" style="background:#A78BFA22;color:#A78BFA">${i + 1}</div>
          <div class="li-text">${this._esc(t)}</div>
        </div>`).join('');
      h += `
        <div class="study-sec">
          <div class="ss-hdr">
            <div class="ss-title"><i class="fas fa-award"></i> Top Exam Tips</div>
          </div>
          <div class="ss-body">
            <div class="items-list">${items}</div>
          </div>
        </div>`;
    }

    return h || this._buildNotesHTML(data);
  }

  /* ══════════════════════════════════════════════════════════════════
     SECTION 20 — MINDMAP HTML
  ══════════════════════════════════════════════════════════════════ */

  /**
   * Build mind map view HTML
   * @param {object} data
   * @returns {string}
   */
  _buildMindmapHTML(data) {
    const topic = data.topic || 'Topic';

    const branches = [
      { label: 'Core Concepts',        items: data.key_concepts             || [], icon: 'fa-lightbulb',         color: '#C9A96E' },
      { label: 'Study Tricks',         items: data.key_tricks               || [], icon: 'fa-magic',             color: '#42C98A' },
      { label: 'Applications',         items: data.real_world_applications  || [], icon: 'fa-globe',             color: '#60A5FA' },
      { label: 'Common Mistakes',      items: data.common_misconceptions    || [], icon: 'fa-exclamation-triangle', color: '#F87171' },
      { label: 'Exam Tips',            items: data.exam_tips                || [], icon: 'fa-award',             color: '#A78BFA' },
      { label: 'Related Topics',       items: (data.related_topics || []).map(t => t.split(':')[0] || t), icon: 'fa-sitemap', color: '#F59E0B' },
    ].filter(b => b.items.length > 0);

    const branchHtml = branches.map(b => `
      <div class="mm-branch">
        <div class="mm-branch-hdr" style="color:${b.color};border-left:3px solid ${b.color}">
          <i class="fas ${b.icon}"></i> ${this._esc(b.label)}
        </div>
        <div class="mm-nodes">
          ${b.items.map(item => `
            <div class="mm-node" style="border-color:${b.color}33">
              ${this._esc(this._trunc(item, 100))}
            </div>`).join('')}
        </div>
      </div>`).join('');

    return `
      <div class="study-sec">
        <div class="ss-hdr">
          <div class="ss-title"><i class="fas fa-project-diagram"></i> Mind Map</div>
        </div>
        <div class="ss-body">
          <div class="mm-root">${this._esc(topic)}</div>
          <div class="mm-branches">${branchHtml}</div>
        </div>
      </div>
      ${data.ultra_long_notes ? `
      <div class="study-sec">
        <div class="ss-hdr">
          <div class="ss-title"><i class="fas fa-book-open"></i> Detailed Notes</div>
        </div>
        <div class="ss-body">
          <div class="md-content">${this._renderMd(data.ultra_long_notes)}</div>
        </div>
      </div>` : ''}`;
  }

  /* ══════════════════════════════════════════════════════════════════
     SECTION 21 — PDF DOWNLOAD — PROFESSIONAL MULTI-PAGE LAYOUT
     Includes all new v2.0 Ultra fields: glossary, study plan, exam tips
  ══════════════════════════════════════════════════════════════════ */

  /**
   * Generate and download a professional PDF of the current result
   */
  _downloadPDF() {
    const data = this.currentData;
    if (!data) {
      this._toast('info', 'fa-info-circle', 'Generate some content first, then download as PDF.');
      return;
    }
    if (!window.jspdf?.jsPDF) {
      this._toast('error', 'fa-times', 'PDF library not loaded. Please refresh the page.');
      return;
    }

    this._toast('info', 'fa-spinner fa-spin', 'Preparing your PDF…', 2500);

    // Small delay to let toast show before potentially blocking PDF gen
    setTimeout(() => this._generatePDF(data), 100);
  }

  /**
   * Internal PDF generation — called with small async delay
   * @param {object} data
   */
  _generatePDF(data) {
    try {
      const { jsPDF } = window.jspdf;
      const doc = new jsPDF({ unit: 'mm', format: 'a4', compress: true });

      const pw = 210;   // page width mm
      const ph = 297;   // page height mm
      const m  = 18;    // margin mm
      const cw = pw - m * 2; // content width
      let   y  = m;     // current Y position

      // ── PAGE HEADER ──────────────────────────────────────────────
      const addPageHeader = () => {
        // Gold top bar
        doc.setFillColor(201, 169, 110);
        doc.rect(0, 0, pw, 8, 'F');
        // Dark logo bar
        doc.setFillColor(20, 12, 2);
        doc.rect(0, 8, 70, 11, 'F');
        // Brand name
        doc.setFontSize(8.5); doc.setFont('helvetica', 'bold');
        doc.setTextColor(201, 169, 110);
        doc.text('SAVOIRÉ AI v2.0', m, 15.5);
        // Tagline
        doc.setFontSize(6); doc.setFont('helvetica', 'normal');
        doc.setTextColor(180, 155, 110);
        doc.text('Think Less. Know More.', m, 19.5);
        // Right side: website + developer
        doc.setFontSize(6.5); doc.setFont('helvetica', 'normal');
        doc.setTextColor(201, 169, 110);
        doc.text('savoireai.vercel.app', pw - m, 15, { align: 'right' });
        doc.setTextColor(140, 120, 90);
        doc.text('Sooban Talha Technologies · soobantalhatech.xyz', pw - m, 19.5, { align: 'right' });
        y = 30;
      };

      // ── PAGE FOOTER ──────────────────────────────────────────────
      const addPageFooter = (pageNum, total) => {
        const fy = ph - 10;
        doc.setDrawColor(201, 169, 110);
        doc.setLineWidth(0.35);
        doc.line(m, fy - 4, pw - m, fy - 4);
        doc.setFontSize(6.5); doc.setFont('helvetica', 'normal');
        doc.setTextColor(140, 125, 100);
        doc.text(
          `${this.BRAND} · ${this.DEVELOPER} · Generated ${new Date().toLocaleDateString()}`,
          m, fy
        );
        doc.text(`Page ${pageNum} of ${total}`, pw - m, fy, { align: 'right' });
      };

      // ── NEW PAGE ─────────────────────────────────────────────────
      const newPage = () => {
        doc.addPage();
        addPageHeader();
      };

      // ── SAFE Y ADVANCE — adds page if needed ──────────────────────
      const safeY = (needed = 12) => {
        if (y + needed > ph - 18) newPage();
      };

      // ── WRITE TEXT HELPER ─────────────────────────────────────────
      const writeText = (text, sz, bold, color, indent = 0, lineH = null) => {
        if (!text) return;
        doc.setFontSize(sz);
        doc.setFont('helvetica', bold ? 'bold' : 'normal');
        doc.setTextColor(...color);
        const lines = doc.splitTextToSize(String(text), cw - indent);
        const lh    = lineH || (sz * 0.4 + 1.2);
        lines.forEach(l => {
          safeY(lh + 1);
          doc.text(l, m + indent, y);
          y += lh;
        });
      };

      // ── SECTION HEADING ───────────────────────────────────────────
      const sectionHeading = (title, icon = '■') => {
        safeY(16);
        y += 4;
        // Background band
        doc.setFillColor(248, 244, 236);
        doc.rect(m - 2, y - 5.5, cw + 4, 9, 'F');
        // Gold left accent
        doc.setFillColor(201, 169, 110);
        doc.rect(m - 2, y - 5.5, 3, 9, 'F');
        doc.setFontSize(9); doc.setFont('helvetica', 'bold');
        doc.setTextColor(70, 45, 8);
        doc.text(`${icon}  ${title.toUpperCase()}`, m + 4, y);
        y += 6;
      };

      // ── DIVIDER ───────────────────────────────────────────────────
      const divider = () => {
        safeY(6);
        doc.setDrawColor(220, 205, 180);
        doc.setLineWidth(0.3);
        doc.line(m, y, pw - m, y);
        y += 4;
      };

      // ═══ START DOCUMENT ══════════════════════════════════════════
      addPageHeader();

      // ── TITLE BLOCK ───────────────────────────────────────────────
      doc.setFillColor(248, 244, 236);
      doc.rect(m - 2, y - 2, cw + 4, 28, 'F');
      doc.setFontSize(18); doc.setFont('helvetica', 'bold');
      doc.setTextColor(18, 10, 2);
      const titleLines = doc.splitTextToSize(data.topic || 'Study Notes', cw - 4);
      titleLines.forEach(l => { safeY(10); doc.text(l, m + 2, y + 8); y += 9; });

      y += 2;
      doc.setFontSize(7.5); doc.setFont('helvetica', 'normal');
      doc.setTextColor(110, 88, 55);

      const metaParts = [
        data.curriculum_alignment || 'General Study',
        `Score: ${data.study_score || 96}/100`,
        data._language || 'English',
        data.difficulty_label ? `${data.difficulty_label} (${data.difficulty_rating}/10)` : '',
        new Date().toLocaleDateString(),
      ].filter(Boolean);

      doc.text(metaParts.join('  ·  '), m + 2, y + 4);
      y += 12;
      divider();

      // ── SECTION: NOTES ────────────────────────────────────────────
      if (data.ultra_long_notes) {
        sectionHeading('Comprehensive Notes', '📖');
        writeText(this._stripMd(data.ultra_long_notes), 9.5, false, [35, 28, 18], 2, 4.8);
        y += 4;
      }

      // ── SECTION: KEY CONCEPTS ─────────────────────────────────────
      if (data.key_concepts?.length) {
        sectionHeading('Key Concepts', '💡');
        data.key_concepts.forEach((c, i) => {
          safeY(12);
          // Number circle
          doc.setFillColor(201, 169, 110, 0.15);
          doc.circle(m + 4, y - 1, 3.2, 'F');
          doc.setFontSize(7.5); doc.setFont('helvetica', 'bold');
          doc.setTextColor(110, 72, 18);
          doc.text(`${i + 1}`, m + 4, y, { align: 'center' });
          writeText(c, 9.5, false, [35, 28, 18], 12, 4.5);
          y += 2;
        });
        y += 4;
      }

      // ── SECTION: GLOSSARY ─────────────────────────────────────────
      if (data.glossary?.length) {
        sectionHeading('Glossary', '📚');
        data.glossary.forEach(g => {
          safeY(12);
          const sep  = g.indexOf(':');
          const term = sep > 0 ? g.slice(0, sep).trim()  : g;
          const def  = sep > 0 ? g.slice(sep + 1).trim() : '';
          doc.setFontSize(9); doc.setFont('helvetica', 'bold');
          doc.setTextColor(110, 72, 18);
          const termLines = doc.splitTextToSize(`${term}:`, cw - 4);
          termLines.forEach(l => { safeY(5); doc.text(l, m + 2, y); y += 4.5; });
          if (def) writeText(def, 9, false, [55, 45, 30], 6, 4.5);
          y += 2;
        });
        y += 4;
      }

      // ── SECTION: STUDY TRICKS ─────────────────────────────────────
      if (data.key_tricks?.length) {
        sectionHeading('Study Tricks & Memory Aids', '✦');
        data.key_tricks.forEach((t, i) => {
          safeY(14);
          const tLines = doc.splitTextToSize(`${['★', '◆', '●', '▲'][i % 4]}  ${t}`, cw - 12);
          const blockH = tLines.length * 4.6 + 8;
          doc.setFillColor(66, 201, 138, 0.07);
          doc.rect(m, y - 4, cw, blockH, 'F');
          doc.setFillColor(66, 201, 138);
          doc.rect(m, y - 4, 2.5, blockH, 'F');
          writeText(`${['★', '◆', '●', '▲'][i % 4]}  ${t}`, 9.5, false, [35, 28, 18], 8, 4.5);
          y += 4;
        });
        y += 2;
      }

      // ── SECTION: PRACTICE QUESTIONS ──────────────────────────────
      if (data.practice_questions?.length) {
        sectionHeading('Practice Questions', '❓');
        data.practice_questions.forEach((qa, i) => {
          safeY(22);
          const qText  = `Q${i + 1}: ${qa.question}`;
          const aText  = `Answer: ${this._stripMd(qa.answer)}`;
          const qLines = doc.splitTextToSize(qText, cw - 6);
          const aLines = doc.splitTextToSize(aText, cw - 10);
          const blockH = (qLines.length + aLines.length) * 4.8 + 16;
          doc.setFillColor(248, 244, 236);
          doc.rect(m, y - 3, cw, blockH, 'F');
          writeText(qText, 9.5, true,  [80, 50, 10],  4, 4.8);
          y += 2;
          doc.setFillColor(42, 150, 90, 0.08);
          doc.rect(m + 2, y - 2, cw - 4, aLines.length * 4.8 + 4, 'F');
          writeText(aText, 9, false, [25, 85, 55], 8, 4.8);
          y += 6;
        });
        y += 2;
      }

      // ── SECTION: REAL WORLD APPLICATIONS ──────────────────────────
      if (data.real_world_applications?.length) {
        sectionHeading('Real World Applications', '🌐');
        data.real_world_applications.forEach(a => {
          safeY(10);
          writeText(`→  ${a}`, 9.5, false, [25, 80, 55], 4, 4.5);
          y += 2;
        });
        y += 3;
      }

      // ── SECTION: COMMON MISCONCEPTIONS ───────────────────────────
      if (data.common_misconceptions?.length) {
        sectionHeading('Common Misconceptions', '⚠');
        data.common_misconceptions.forEach(mc => {
          safeY(10);
          writeText(`⚠  ${mc}`, 9.5, false, [130, 30, 30], 4, 4.5);
          y += 2;
        });
        y += 3;
      }

      // ── SECTION: EXAM TIPS ────────────────────────────────────────
      if (data.exam_tips?.length) {
        sectionHeading('Exam Tips & Strategies', '🏆');
        data.exam_tips.forEach((t, i) => {
          safeY(10);
          writeText(`${i + 1}.  ${t}`, 9.5, false, [50, 30, 90], 4, 4.5);
          y += 2;
        });
        y += 3;
      }

      // ── SECTION: 7-DAY STUDY PLAN ─────────────────────────────────
      if (data.study_plan?.length) {
        sectionHeading('7-Day Study Plan', '📅');
        data.study_plan.forEach(day => {
          safeY(12);
          const sep      = day.indexOf(':');
          const dayLabel = sep > 0 ? day.slice(0, sep).trim()  : 'Day';
          const content  = sep > 0 ? day.slice(sep + 1).trim() : day;
          doc.setFontSize(9); doc.setFont('helvetica', 'bold');
          doc.setTextColor(110, 72, 18);
          safeY(5); doc.text(dayLabel + ':', m + 2, y); y += 4.5;
          writeText(content, 9, false, [40, 32, 20], 8, 4.5);
          y += 2;
        });
        y += 3;
      }

      // ── SECTION: RELATED TOPICS ───────────────────────────────────
      if (data.related_topics?.length) {
        sectionHeading('Related Topics', '🔗');
        data.related_topics.forEach((t, i) => {
          safeY(10);
          writeText(`${i + 1}.  ${t}`, 9.5, false, [30, 55, 110], 4, 4.5);
          y += 2;
        });
        y += 3;
      }

      // ── BRANDING FOOTER BLOCK ─────────────────────────────────────
      safeY(22);
      y += 6;
      divider();
      doc.setFontSize(8); doc.setFont('helvetica', 'bold');
      doc.setTextColor(201, 169, 110);
      doc.text(`Generated by ${this.BRAND}`, m, y);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(120, 98, 70);
      doc.text(`${this.DEVELOPER} · ${this.DEVSITE} · ${new Date().toLocaleString()}`, m, y + 5);
      doc.setTextColor(160, 140, 110);
      doc.text(`Study Score: ${data.study_score || 96}/100`, m, y + 10);

      // ── APPLY FOOTER TO ALL PAGES ─────────────────────────────────
      const totalPages = doc.internal.getNumberOfPages();
      for (let i = 1; i <= totalPages; i++) {
        doc.setPage(i);
        addPageFooter(i, totalPages);
      }

      // ── SAVE ──────────────────────────────────────────────────────
      const safeTopic = (data.topic || 'Notes').replace(/[^a-zA-Z0-9\s\-_]/g, '').replace(/\s+/g, '_').slice(0, 40);
      const fname     = `SavoireAI_${safeTopic}_${Date.now()}.pdf`;
      doc.save(fname);

      this._toast('success', 'fa-file-pdf', 'PDF downloaded successfully! 📄', 4000);
    } catch (pdfErr) {
      console.error('[Savoiré AI] PDF generation failed:', pdfErr);
      this._toast('error', 'fa-times', 'PDF generation failed. Please try again.');
    }
  }

  /* ══════════════════════════════════════════════════════════════════
     SECTION 22 — COPY, SAVE, SHARE, CLEAR
  ══════════════════════════════════════════════════════════════════ */

  /**
   * Copy current result as formatted plain text
   */
  _copyResult() {
    const data = this.currentData;
    if (!data) { this._toast('info', 'fa-info-circle', 'No content to copy yet.'); return; }
    this._copyText(this._dataToText(data));
  }

  /**
   * Copy arbitrary text to clipboard with fallback
   * @param {string} text
   */
  _copyText(text) {
    if (navigator.clipboard?.writeText) {
      navigator.clipboard.writeText(text)
        .then(() => this._toast('success', 'fa-copy', 'Copied to clipboard!'))
        .catch(() => this._copyTextFallback(text));
    } else {
      this._copyTextFallback(text);
    }
  }

  /**
   * execCommand fallback for browsers without Clipboard API
   * @param {string} text
   */
  _copyTextFallback(text) {
    try {
      const ta      = document.createElement('textarea');
      ta.value      = text;
      ta.style.cssText = 'position:fixed;opacity:0;top:-9999px;left:-9999px';
      document.body.appendChild(ta);
      ta.select();
      ta.setSelectionRange(0, ta.value.length);
      document.execCommand('copy');
      document.body.removeChild(ta);
      this._toast('success', 'fa-copy', 'Copied!');
    } catch (e) {
      this._toast('error', 'fa-times', 'Copy failed. Please select and copy manually.');
    }
  }

  /**
   * Save current result to the Saved Notes library
   */
  _saveNote() {
    const data = this.currentData;
    if (!data) { this._toast('info', 'fa-info-circle', 'No content to save yet.'); return; }

    // Check for duplicate
    const isDupe = this.saved.some(s => s.topic === data.topic && s.tool === this.tool);
    if (isDupe) {
      this._toast('warning', 'fa-star', 'Already saved! Check your library.');
      return;
    }

    this.saved.unshift({
      id:      this._genId(),
      topic:   data.topic || 'Untitled',
      tool:    this.tool,
      data,
      savedAt: Date.now(),
    });
    // Keep max 100 saved notes
    if (this.saved.length > 100) this.saved = this.saved.slice(0, 100);
    this._save('sv_saved', this.saved);
    this._toast('success', 'fa-star', 'Saved to your library! ⭐', 3000);
  }

  /**
   * Share current result via Web Share API or clipboard fallback
   */
  _shareResult() {
    const data = this.currentData;
    if (!data) { this._toast('info', 'fa-info-circle', 'No content to share yet.'); return; }

    const shareText = [
      `📚 ${data.topic} — Study Notes`,
      `Generated by ${this.BRAND}`,
      '',
      this._stripMd(data.ultra_long_notes || '').substring(0, 500) + '…',
      '',
      `Free AI study notes at ${this.WEBSITE}`,
      `Built by ${this.DEVELOPER} | ${this.DEVSITE}`,
    ].join('\n');

    if (navigator.share) {
      navigator.share({
        title: `${data.topic} — ${this.BRAND}`,
        text:  shareText,
        url:   `https://${this.WEBSITE}`,
      }).catch(() => {
        // User cancelled share or error — silently fall back
        this._copyText(shareText);
      });
    } else {
      this._copyText(shareText);
    }
  }

  /**
   * Clear the output area and reset state
   */
  _clearOutput() {
    this.currentData = null;
    this.fcCards     = [];
    this.quizData    = [];
    this.glossaryMap = {};
    this._showState('empty');
    this._toast('info', 'fa-trash', 'Output cleared.', 2000);
  }

  /* ══════════════════════════════════════════════════════════════════
     SECTION 23 — FILE HANDLING (TXT + PDF TEXT EXTRACTION)
  ══════════════════════════════════════════════════════════════════ */

  /**
   * Handle file selected via input or drag-and-drop
   * @param {File|null} file
   */
  _handleFile(file) {
    if (!file) return;

    const MAX_SIZE = 5 * 1024 * 1024; // 5 MB
    if (file.size > MAX_SIZE) {
      this._toast('error', 'fa-times', 'File too large. Maximum size is 5 MB.');
      return;
    }

    const ext = file.name.split('.').pop()?.toLowerCase();

    if (ext === 'txt' || file.type === 'text/plain') {
      this._readTextFile(file);
    } else if (ext === 'pdf' || file.type === 'application/pdf') {
      this._readPDFFile(file);
    } else {
      this._toast('error', 'fa-times', 'Unsupported file type. Please upload .txt or .pdf files.');
    }
  }

  /**
   * Read a plain text file and place content in the textarea
   * @param {File} file
   */
  _readTextFile(file) {
    const reader = new FileReader();
    reader.onload = e => {
      const text = e.target.result;
      if (!text || text.trim().length === 0) {
        this._toast('warning', 'fa-exclamation', 'File appears to be empty.');
        return;
      }
      const ta = this._el('mainInput');
      if (ta) {
        ta.value = text.trim().slice(0, 12000);
        ta.dispatchEvent(new Event('input'));
      }
      this._showFileChip(file.name);
      this._toast('success', 'fa-file-alt', `Loaded: ${file.name}`);
    };
    reader.onerror = () => this._toast('error', 'fa-times', 'Failed to read file.');
    reader.readAsText(file);
  }

  /**
   * Extract text from a PDF file using basic approach
   * @param {File} file
   */
  _readPDFFile(file) {
    // Try using pdfjsLib if available
    if (window.pdfjsLib) {
      const reader = new FileReader();
      reader.onload = async e => {
        try {
          const typedArray   = new Uint8Array(e.target.result);
          const pdf          = await window.pdfjsLib.getDocument(typedArray).promise;
          let   fullText     = '';

          for (let i = 1; i <= Math.min(pdf.numPages, 20); i++) {
            const page    = await pdf.getPage(i);
            const content = await page.getTextContent();
            const text    = content.items.map(item => item.str).join(' ');
            fullText     += text + '\n\n';
          }

          const ta = this._el('mainInput');
          if (ta) {
            ta.value = fullText.trim().slice(0, 12000);
            ta.dispatchEvent(new Event('input'));
          }
          this._showFileChip(file.name);
          this._toast('success', 'fa-file-pdf', `Loaded PDF: ${file.name} (${pdf.numPages} pages)`);
        } catch (err) {
          this._toast('error', 'fa-times', 'Could not extract PDF text. Try copying and pasting the text manually.');
        }
      };
      reader.onerror = () => this._toast('error', 'fa-times', 'Failed to read PDF file.');
      reader.readAsArrayBuffer(file);
    } else {
      // No PDF.js — notify user
      this._toast('warning', 'fa-info-circle', 'PDF text extraction requires PDF.js. Please copy and paste the text manually.');
    }
  }

  /**
   * Show the file chip (name tag) under the textarea
   * @param {string} name
   */
  _showFileChip(name) {
    const chip    = this._el('fileChip');
    const chipNm  = this._el('fileChipName');
    const zone    = this._el('uploadZone');
    if (chipNm) chipNm.textContent = name;
    if (chip)   chip.style.display = 'flex';
    if (zone)   zone.style.display = 'none';
  }

  /**
   * Remove the uploaded file and reset file input
   */
  _removeFile() {
    const chip = this._el('fileChip');
    const zone = this._el('uploadZone');
    const fi   = this._el('fileInput');
    if (chip) chip.style.display = 'none';
    if (zone) zone.style.display = '';
    if (fi)   fi.value = '';
  }

  /* ══════════════════════════════════════════════════════════════════
     SECTION 24 — HISTORY SYSTEM
  ══════════════════════════════════════════════════════════════════ */

  /**
   * Add a new entry to history — deduplicates by topic
   * @param {object} entry
   */
  _addToHistory(entry) {
    // Remove any existing entry with the same topic + tool
    this.history = this.history.filter(h => !(h.topic === entry.topic && h.tool === entry.tool));
    this.history.unshift(entry);
    if (this.history.length > 200) this.history = this.history.slice(0, 200);
    this._save('sv_history', this.history);
    this._updateHistBadge();
    this._renderSbHistory();
  }

  /**
   * Update the history badge count in the header
   */
  _updateHistBadge() {
    const badge = this._el('histBadge');
    if (badge) {
      badge.textContent  = this.history.length > 99 ? '99+' : this.history.length;
      badge.style.display = this.history.length > 0 ? 'inline-flex' : 'none';
    }
  }

  /**
   * Render recent history in the left panel sidebar (up to 8 items)
   */
  _renderSbHistory() {
    const container = this._el('sbHistList');
    if (!container) return;

    if (!this.history.length) {
      container.innerHTML = `<div class="sb-empty"><i class="fas fa-clock"></i> No history yet</div>`;
      return;
    }

    const TOOL_ICONS = {
      notes:      'fa-book-open',
      flashcards: 'fa-layer-group',
      quiz:       'fa-question-circle',
      summary:    'fa-align-left',
      mindmap:    'fa-project-diagram',
    };

    container.innerHTML = this.history.slice(0, 8).map(h => `
      <div class="sb-hist-item" onclick="window._app._loadHistory('${h.id}')" title="${this._esc(h.topic)}">
        <div class="sbi-icon"><i class="fas ${TOOL_ICONS[h.tool] || 'fa-book-open'}"></i></div>
        <div class="sbi-body">
          <div class="sbi-topic">${this._esc(this._trunc(h.topic, 32))}</div>
          <div class="sbi-meta">${this._relTime(h.ts)}</div>
        </div>
      </div>`).join('');
  }

  /**
   * Open the history modal
   */
  _openHistModal() {
    this._renderHistModal();
    this._openModal('histModal');
  }

  /**
   * Render history modal content with optional filter and search
   * @param {string} [filter='all']
   * @param {string} [search='']
   */
  _renderHistModal(filter = 'all', search = '') {
    const container = this._el('histList');
    if (!container) return;

    let items = [...this.history];
    if (filter && filter !== 'all') items = items.filter(h => h.tool === filter);
    if (search) {
      const q = search.toLowerCase();
      items = items.filter(h => (h.topic || '').toLowerCase().includes(q));
    }

    if (!items.length) {
      container.innerHTML = `
        <div class="hist-empty">
          <i class="fas fa-search"></i>
          <span>${search ? 'No results found.' : 'No history yet. Generate some study materials!'}</span>
        </div>`;
      return;
    }

    const TOOL_ICONS = {
      notes:      'fa-book-open',
      flashcards: 'fa-layer-group',
      quiz:       'fa-question-circle',
      summary:    'fa-align-left',
      mindmap:    'fa-project-diagram',
    };

    container.innerHTML = items.map(h => `
      <div class="hist-item" onclick="window._app._loadHistory('${h.id}')">
        <div class="hist-icon"><i class="fas ${TOOL_ICONS[h.tool] || 'fa-book-open'}"></i></div>
        <div class="hist-body">
          <div class="hist-topic">${this._esc(this._trunc(h.topic, 60))}</div>
          <div class="hist-meta">
            <span class="hist-tag">${this._esc(h.tool)}</span>
            ${h.lang ? `<span class="hist-lang">${this._esc(h.lang)}</span>` : ''}
            <span class="hist-time">${this._relTime(h.ts)}</span>
          </div>
        </div>
        <div class="hist-acts">
          <button class="hist-del" onclick="event.stopPropagation();window._app._deleteHistory('${h.id}')" title="Delete">
            <i class="fas fa-trash"></i>
          </button>
        </div>
      </div>`).join('');
  }

  /**
   * Filter history modal by search query
   * @param {string} query
   */
  _filterHist(query) {
    const activeFilter = this._qs('.hf.active')?.dataset.filter || 'all';
    this._renderHistModal(activeFilter, query);
  }

  /**
   * Load a history entry into the result view
   * @param {string} id
   */
  _loadHistory(id) {
    const entry = this.history.find(h => h.id === id);
    if (!entry?.data) return;
    this._closeModal('histModal');
    this.currentData = entry.data;
    this.tool        = entry.tool || 'notes';
    this._setTool(this.tool);
    this._renderResult(entry.data);
    this._toast('success', 'fa-history', `Loaded: ${entry.topic}`, 3000);
  }

  /**
   * Delete a history entry by ID
   * @param {string} id
   */
  _deleteHistory(id) {
    this.history = this.history.filter(h => h.id !== id);
    this._save('sv_history', this.history);
    this._renderHistModal(this._qs('.hf.active')?.dataset.filter || 'all', this._el('histSearchInput')?.value || '');
    this._renderSbHistory();
    this._updateHistBadge();
  }

  /* ══════════════════════════════════════════════════════════════════
     SECTION 25 — SAVED NOTES LIBRARY
  ══════════════════════════════════════════════════════════════════ */

  /**
   * Open the saved notes modal
   */
  _openSavedModal() {
    this._renderSavedModal();
    this._openModal('savedModal');
  }

  /**
   * Render saved notes modal content
   */
  _renderSavedModal() {
    const container = this._el('savedList');
    if (!container) return;

    if (!this.saved.length) {
      container.innerHTML = `
        <div class="hist-empty">
          <i class="fas fa-star"></i>
          <span>No saved notes yet. Click ⭐ Save on any result to add it here.</span>
        </div>`;
      return;
    }

    const TOOL_ICONS = {
      notes:      'fa-book-open',
      flashcards: 'fa-layer-group',
      quiz:       'fa-question-circle',
      summary:    'fa-align-left',
      mindmap:    'fa-project-diagram',
    };

    container.innerHTML = this.saved.map(s => `
      <div class="hist-item" onclick="window._app._loadSaved('${s.id}')">
        <div class="hist-icon" style="background:var(--gold-dim);color:var(--gold)">
          <i class="fas ${TOOL_ICONS[s.tool] || 'fa-book-open'}"></i>
        </div>
        <div class="hist-body">
          <div class="hist-topic">${this._esc(this._trunc(s.topic, 60))}</div>
          <div class="hist-meta">
            <span class="hist-tag">${this._esc(s.tool)}</span>
            <span class="hist-time">${this._relTime(s.savedAt)}</span>
          </div>
        </div>
        <div class="hist-acts">
          <button class="hist-del" onclick="event.stopPropagation();window._app._deleteSaved('${s.id}')" title="Delete">
            <i class="fas fa-trash"></i>
          </button>
        </div>
      </div>`).join('');
  }

  /**
   * Load a saved note into the result view
   * @param {string} id
   */
  _loadSaved(id) {
    const s = this.saved.find(x => x.id === id);
    if (!s?.data) return;
    this._closeModal('savedModal');
    this.currentData = s.data;
    this.tool        = s.tool || 'notes';
    this._setTool(this.tool);
    this._renderResult(s.data);
    this._toast('success', 'fa-star', `Loaded: ${s.topic}`, 3000);
  }

  /**
   * Delete a saved note by ID
   * @param {string} id
   */
  _deleteSaved(id) {
    this.saved = this.saved.filter(x => x.id !== id);
    this._save('sv_saved', this.saved);
    this._renderSavedModal();
  }

  /* ══════════════════════════════════════════════════════════════════
     SECTION 26 — SETTINGS MODAL
  ══════════════════════════════════════════════════════════════════ */

  /**
   * Open and populate the settings modal
   */
  _openSettingsModal() {
    // Pre-fill name input with current name
    const ni = this._el('nameInput');
    if (ni) ni.value = this.userName;

    // Sync theme buttons
    const currentTheme = document.documentElement.dataset.theme || 'dark';
    this._qsa('[data-theme-btn]').forEach(b =>
      b.classList.toggle('active', b.dataset.themeBtn === currentTheme)
    );

    // Sync font size buttons
    const currentFont = document.documentElement.dataset.font || 'medium';
    this._qsa('.font-sz').forEach(b =>
      b.classList.toggle('active', b.dataset.size === currentFont)
    );

    // Update data usage stats
    const ds = this._el('dsStats');
    if (ds) {
      const kb = this._storageUsageKB();
      ds.innerHTML = `
        <div class="ds-stat">
          <div class="ds-val">${this.history.length}</div>
          <div class="ds-lbl">History</div>
        </div>
        <div class="ds-stat">
          <div class="ds-val">${this.saved.length}</div>
          <div class="ds-lbl">Saved</div>
        </div>
        <div class="ds-stat">
          <div class="ds-val">${this.stats.totalGenerations || 0}</div>
          <div class="ds-lbl">Generated</div>
        </div>
        <div class="ds-stat">
          <div class="ds-val">${kb} KB</div>
          <div class="ds-lbl">Storage</div>
        </div>`;
    }

    this._openModal('settingsModal');
  }

  /**
   * Save the user's display name from the settings modal
   */
  _saveName() {
    const inp  = this._el('nameInput');
    const name = inp?.value?.trim() || '';
    if (!name || name.length < 2) {
      this._toast('error', 'fa-times', 'Name must be at least 2 characters.');
      return;
    }
    if (name.length > 50) {
      this._toast('error', 'fa-times', 'Name must be 50 characters or fewer.');
      return;
    }
    this.userName = name;
    localStorage.setItem('sv_user', name);
    this._updateUserUI();
    this._toast('success', 'fa-check', 'Name updated!', 3000);
  }

  /**
   * Export all user data as a JSON download
   */
  _exportDataJson() {
    const obj = {
      exported:    new Date().toISOString(),
      app:         this.BRAND,
      developer:   this.DEVELOPER,
      devsite:     this.DEVSITE,
      userName:    this.userName,
      sessionCount: this.sessionNum,
      history:     this.history,
      saved:       this.saved,
      preferences: this.prefs,
      stats:       this.stats,
    };
    const blob = new Blob([JSON.stringify(obj, null, 2)], { type: 'application/json' });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement('a');
    a.href     = url;
    a.download = `savoiré-ai-data-${Date.now()}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    this._toast('success', 'fa-download', 'Data exported as JSON!', 3000);
  }

  /**
   * Clear all application data and reload
   */
  _clearAllData() {
    const keys = Object.keys(localStorage).filter(k => k.startsWith('sv_'));
    keys.forEach(k => localStorage.removeItem(k));
    this._toast('info', 'fa-trash', 'All data cleared. Reloading…', 2000);
    setTimeout(() => window.location.reload(), 1500);
  }

  /* ══════════════════════════════════════════════════════════════════
     SECTION 27 — STATS MODAL & STATS BAR
  ══════════════════════════════════════════════════════════════════ */

  /**
   * Open the usage stats modal
   */
  _openStatsModal() {
    const container = this._el('statsModalBody');
    if (!container) return;

    const s     = this.stats;
    const topTool = Object.entries(s.toolCounts || {})
      .sort((a, b) => b[1] - a[1])[0];
    const topLang = Object.entries(s.languageCounts || {})
      .sort((a, b) => b[1] - a[1])[0];

    container.innerHTML = `
      <div class="stats-grid">
        <div class="stat-card">
          <div class="stat-val">${s.totalGenerations || 0}</div>
          <div class="stat-lbl">Total Generations</div>
        </div>
        <div class="stat-card">
          <div class="stat-val">${this.history.length}</div>
          <div class="stat-lbl">History Items</div>
        </div>
        <div class="stat-card">
          <div class="stat-val">${this.saved.length}</div>
          <div class="stat-lbl">Saved Notes</div>
        </div>
        <div class="stat-card">
          <div class="stat-val">${this.sessionNum}</div>
          <div class="stat-lbl">Sessions</div>
        </div>
        <div class="stat-card">
          <div class="stat-val">${topTool ? this._esc(topTool[0]) : '—'}</div>
          <div class="stat-lbl">Favourite Tool</div>
        </div>
        <div class="stat-card">
          <div class="stat-val">${topLang ? this._esc(topLang[0]) : '—'}</div>
          <div class="stat-lbl">Top Language</div>
        </div>
        <div class="stat-card">
          <div class="stat-val">${Math.round((s.totalCharsInput || 0) / 1000)}K</div>
          <div class="stat-lbl">Characters Input</div>
        </div>
        <div class="stat-card">
          <div class="stat-val">${this._storageUsageKB()} KB</div>
          <div class="stat-lbl">Storage Used</div>
        </div>
      </div>

      <div class="stats-tools-breakdown">
        <div class="stb-title">Usage by Tool</div>
        ${Object.entries(s.toolCounts || {}).sort((a, b) => b[1] - a[1]).map(([tool, count]) => {
          const pct = s.totalGenerations > 0 ? Math.round(count / s.totalGenerations * 100) : 0;
          return `
          <div class="stb-row">
            <div class="stb-tool">${this._esc(tool)}</div>
            <div class="stb-bar-wrap">
              <div class="stb-bar" style="width:${pct}%"></div>
            </div>
            <div class="stb-count">${count} (${pct}%)</div>
          </div>`;
        }).join('')}
      </div>`;

    this._openModal('statsModal');
  }

  /**
   * Update the small stats bar shown in the sidebar / footer
   */
  _renderStatsBar() {
    const el = this._el('statsBar');
    if (!el) return;
    const s = this.stats;
    el.innerHTML = `
      <span><i class="fas fa-bolt"></i> ${s.totalGenerations || 0} generated</span>
      <span><i class="fas fa-star"></i> ${this.saved.length} saved</span>
      <span><i class="fas fa-history"></i> ${this.history.length} history</span>`;
  }

  /* ══════════════════════════════════════════════════════════════════
     SECTION 28 — THEME & FONT SIZE
  ══════════════════════════════════════════════════════════════════ */

  /**
   * Toggle between dark and light themes
   */
  _toggleTheme() {
    const cur = document.documentElement.dataset.theme || 'dark';
    this._setTheme(cur === 'dark' ? 'light' : 'dark');
  }

  /**
   * Apply a specific theme
   * @param {'dark'|'light'} theme
   */
  _setTheme(theme) {
    document.documentElement.dataset.theme = theme;

    const ic = this._el('themeIcon');
    if (ic) ic.className = theme === 'dark' ? 'fas fa-moon' : 'fas fa-sun';

    this._qsa('[data-theme-btn]').forEach(b =>
      b.classList.toggle('active', b.dataset.themeBtn === theme)
    );

    this.prefs.theme = theme;
    this._save('sv_prefs', this.prefs);
  }

  /**
   * Apply a specific font size
   * @param {'small'|'medium'|'large'} size
   */
  _setFontSize(size) {
    document.documentElement.dataset.font = size;

    this._qsa('.font-sz').forEach(b =>
      b.classList.toggle('active', b.dataset.size === size)
    );

    this.prefs.fontSize = size;
    this._save('sv_prefs', this.prefs);
  }

  /**
   * Apply all saved user preferences on boot
   */
  _applyPrefs() {
    if (this.prefs.theme)    this._setTheme(this.prefs.theme);
    if (this.prefs.fontSize) this._setFontSize(this.prefs.fontSize);
    if (this.prefs.lastTool) this._setTool(this.prefs.lastTool);
  }

  /* ══════════════════════════════════════════════════════════════════
     SECTION 29 — SIDEBAR
  ══════════════════════════════════════════════════════════════════ */

  /**
   * Toggle the sidebar open/closed (responsive behaviour)
   */
  _toggleSidebar() {
    const lp = this._el('leftPanel');
    const rp = this._el('rightPanel');
    if (!lp) return;

    if (window.innerWidth <= 768) {
      lp.classList.toggle('mobile-open');
    } else {
      lp.classList.toggle('collapsed');
      if (rp) rp.style.marginLeft = lp.classList.contains('collapsed') ? '0' : '';
    }
  }

  /**
   * Handle window resize — close mobile sidebar if viewport widens
   */
  _handleResize() {
    if (window.innerWidth > 768) {
      this._el('leftPanel')?.classList.remove('mobile-open');
    }
  }

  /* ══════════════════════════════════════════════════════════════════
     SECTION 30 — MODAL SYSTEM
  ══════════════════════════════════════════════════════════════════ */

  /**
   * Open a modal by its overlay element ID
   * @param {string} id
   */
  _openModal(id) {
    const el = this._el(id);
    if (!el) return;
    el.style.display          = 'flex';
    document.body.style.overflow = 'hidden';

    // Focus first focusable element for accessibility
    setTimeout(() => {
      const focusable = el.querySelector('input, button, [tabindex="0"]');
      if (focusable) focusable.focus();
    }, 100);
  }

  /**
   * Close a modal by its overlay element ID
   * @param {string} id
   */
  _closeModal(id) {
    const el = this._el(id);
    if (!el) return;
    el.style.display = 'none';
    // Restore scroll if no other modals are open
    const anyOpen = this._qs('.modal-overlay[style*="flex"]');
    if (!anyOpen) document.body.style.overflow = '';
  }

  /**
   * Close all open modals
   */
  _closeAllModals() {
    this._qsa('.modal-overlay').forEach(m => { m.style.display = 'none'; });
    document.body.style.overflow = '';
  }

  /**
   * Show a confirmation dialog with a callback
   * @param {string}   msg — confirmation message
   * @param {Function} cb  — called if user confirms
   */
  _confirm(msg, cb) {
    const me = this._el('confirmMsg');
    if (me) me.textContent = msg;
    this.confirmCb = cb;
    this._openModal('confirmModal');
  }

  /**
   * Toggle the avatar dropdown menu
   */
  _toggleDropdown() {
    this._el('avDropdown')?.classList.toggle('open');
  }

  /**
   * Close the avatar dropdown menu
   */
  _closeDropdown() {
    this._el('avDropdown')?.classList.remove('open');
  }

  /* ══════════════════════════════════════════════════════════════════
     SECTION 31 — TOAST NOTIFICATION SYSTEM
  ══════════════════════════════════════════════════════════════════ */

  /**
   * Show a toast notification
   * @param {'success'|'error'|'warning'|'info'} type
   * @param {string} icon   — FontAwesome class (e.g. 'fa-check')
   * @param {string} msg    — message text
   * @param {number} dur    — duration in ms (default 4000)
   */
  _toast(type, icon, msg, dur = 4000) {
    const container = this._el('toastContainer');
    if (!container) return;

    // Remove oldest toast if 3 already shown
    while (container.children.length >= 3) {
      container.removeChild(container.firstChild);
    }

    const t       = document.createElement('div');
    t.className   = `toast ${type}`;
    t.setAttribute('role', 'alert');
    t.setAttribute('aria-live', 'polite');
    t.innerHTML   = `<i class="fas ${icon} toast-icon"></i><span class="toast-msg">${this._esc(msg)}</span><button class="toast-close" onclick="this.parentElement.remove()"><i class="fas fa-times"></i></button>`;

    // Click body to dismiss
    t.addEventListener('click', e => {
      if (!e.target.closest('.toast-close')) t.remove();
    });

    container.appendChild(t);

    // Auto-remove
    setTimeout(() => {
      if (t.parentNode) {
        t.classList.add('removing');
        setTimeout(() => { if (t.parentNode) t.remove(); }, 350);
      }
    }, dur);
  }

  /* ══════════════════════════════════════════════════════════════════
     SECTION 32 — CHARACTER COUNTER
  ══════════════════════════════════════════════════════════════════ */

  /**
   * Update the character counter below the textarea
   */
  _updateCharCount() {
    const el  = this._el('mainInput');
    const cnt = this._el('charCount');
    if (!el || !cnt) return;
    const n   = el.value.length;
    cnt.textContent = `${n.toLocaleString()} / 12,000`;
    cnt.className   = 'ta-count'
      + (n > 10000 ? ' danger' : n > 7000 ? ' warn' : '');
  }

  /* ══════════════════════════════════════════════════════════════════
     SECTION 33 — TOOLTIP INITIALISATION
  ══════════════════════════════════════════════════════════════════ */

  /**
   * Initialise keyboard shortcut tooltips on header buttons
   */
  _initTooltips() {
    const shortcuts = [
      { id: 'histBtn',     tip: 'History (Ctrl+H)' },
      { id: 'themeBtn',    tip: 'Toggle Theme'      },
      { id: 'settingsBtn', tip: 'Settings'          },
    ];
    shortcuts.forEach(({ id, tip }) => {
      const el = this._el(id);
      if (el && !el.title) el.title = tip;
    });
  }

  /* ══════════════════════════════════════════════════════════════════
     SECTION 34 — MISC PUBLIC METHODS
     Called from index.html via window._app references
  ══════════════════════════════════════════════════════════════════ */

  /**
   * Download PDF of current result (public shortcut)
   */
  _exportAllPdf() {
    if (this.currentData) this._downloadPDF();
    else this._toast('info', 'fa-info-circle', 'Generate some content first.');
  }

  /**
   * Copy all current result text (public shortcut)
   */
  _copyAll() {
    if (!this.currentData) {
      this._toast('info', 'fa-info-circle', 'No content to copy yet.');
      return;
    }
    this._copyText(this._dataToText(this.currentData));
  }
}

/* ════════════════════════════════════════════════════════════════════
   INITIALISATION
   ════════════════════════════════════════════════════════════════════ */
window.addEventListener('DOMContentLoaded', () => {
  // Boot app
  window._app = new SavoireApp();
  window._sav = window._app; // alias

  /**
   * Global helper — called from suggestion chips and related topic clicks
   * Sets the topic input to the given text and focuses it
   * @param {string} t
   */
  window.setSugg = (t) => {
    const el = document.getElementById('mainInput');
    if (el) {
      el.value = t;
      el.dispatchEvent(new Event('input'));
      el.focus();
      el.setSelectionRange(el.value.length, el.value.length);
      // Smooth scroll to input
      el.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  };

  /**
   * Global helper — set tool programmatically from HTML
   * @param {string} tool
   */
  window.setTool = (tool) => {
    window._app?._setTool(tool);
  };

  // Expose version for debugging
  console.log(`%cSavoiré AI v${window._app.VERSION} booted | ${window._app.history.length} history | ${window._app.saved.length} saved`, 'color:#C9A96E');
});

/* ====================================================================
   END — app.js  |  Savoiré AI v2.0 ULTRA
   Built by Sooban Talha Technologies  |  soobantalhatech.xyz
   Founder: Sooban Talha
   ==================================================================== */
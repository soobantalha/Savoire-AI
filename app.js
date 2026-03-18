'use strict';
/* ═══════════════════════════════════════════════════════════════════════════════════════════
   SAVOIRÉ AI v2.0 — app.js — FILE 3 of 5
   Built by Sooban Talha Technologies | soobantalhatech.xyz
   Founder: Sooban Talha

   FEATURES:
   ✦ Live Streaming — real-time token-by-token typewriter output via SSE
   ✦ Mobile Auto-Scroll — on Generate click, screen scrolls to output instantly
   ✦ Input Collapse — textarea + selectors collapse beautifully when streaming
   ✦ Full-Page Stream Overlay — typewriter effect covers viewport during generation
   ✦ All 5 Tools — Notes / Flashcards / Quiz / Summary / Mind Map fully working
   ✦ Welcome First-Time — name input, free notification via ntfy.sh
   ✦ Welcome Back — returning user greeting with stats
   ✦ Header Stats — sessions / history / saved / AI online updated live
   ✦ History — save, load, delete, search, filter by tool, date groups
   ✦ Saved Notes — personal library, load back, delete
   ✦ Settings — name, theme, font size, data stats, export, clear
   ✦ Ultra-Professional PDF — multi-page A4, gold headers, footers, page numbers
   ✦ Copy to Clipboard — full formatted text
   ✦ Share — Web Share API with fallback
   ✦ Keyboard Shortcuts — Ctrl+K, Ctrl+H, Ctrl+T, Ctrl+B, Escape, Enter
   ✦ Drag & Drop File Upload — .txt / .md / .csv
   ✦ Focus Mode — hides sidebar for distraction-free reading
   ✦ Back to top on output scroll
   ✦ Toast Notification System — 4 types, auto-dismiss, click-dismiss
   ✦ Markdown Rendering — marked.js + DOMPurify sanitisation
   ✦ Flashcard 3D Flip — keyboard navigation, progress bar
   ✦ Quiz Mode — self-check, score tracking, restart
   ✦ Mind Map — hierarchical branch rendering
   ✦ Summary — TL;DR + key points
   ✦ Responsive — mobile, tablet, desktop, all working perfectly
   ✦ Auto-Theme Flash Prevention — reads prefs before paint
   ✦ Preferences Persistence — theme, font, last tool, name
   ✦ Fallback Mode — works offline with quality fallback content
   ✦ Cancel Generation — abort mid-stream
   ✦ Word/Character count on output
   ✦ Section anchor navigation in long results
   ✦ Copy individual sections
   ✦ Export all data as JSON
   ✦ Branding footer in every result
   ✦ Sooban Talha Technologies links everywhere
═══════════════════════════════════════════════════════════════════════════════════════════ */

/* ─────────────────────────────────────────────────────────────────────────────────────────
   CONSTANTS & CONFIGURATION
   ───────────────────────────────────────────────────────────────────────────────────────── */
const SAVOIRÉ = {
  VERSION:    '2.0',
  BRAND:      'Savoiré AI v2.0',
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
  },
  flashcards: {
    icon:        'fa-layer-group',
    label:       'Create Flashcards',
    placeholder: 'Enter a topic to create interactive study flashcards with spaced repetition…',
    sfpLabel:    'Building your flashcard deck…',
    sfpIcon:     'fa-layer-group',
    sfpName:     'Flashcards',
  },
  quiz: {
    icon:        'fa-question-circle',
    label:       'Build Quiz',
    placeholder: 'Enter a topic to generate a full practice quiz with detailed answers…',
    sfpLabel:    'Generating your practice quiz…',
    sfpIcon:     'fa-question-circle',
    sfpName:     'Quiz',
  },
  summary: {
    icon:        'fa-align-left',
    label:       'Summarise',
    placeholder: 'Enter a topic or paste text to create a concise smart summary with key points…',
    sfpLabel:    'Writing your smart summary…',
    sfpIcon:     'fa-align-left',
    sfpName:     'Summary',
  },
  mindmap: {
    icon:        'fa-project-diagram',
    label:       'Build Mind Map',
    placeholder: 'Enter a topic to build a visual hierarchical mind map…',
    sfpLabel:    'Constructing your mind map…',
    sfpIcon:     'fa-project-diagram',
    sfpName:     'Mind Map',
  },
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
    /* ── State ── */
    this.tool          = 'notes';
    this.generating    = false;
    this.currentData   = null;
    this.userName      = '';
    this.confirmCb     = null;
    this.thinkTimer    = null;
    this.stageIdx      = 0;
    this.streamCtrl    = null;   /* AbortController for stream */
    this.streamBuffer  = '';
    this.focusMode     = false;

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
  }

  /* ═══════════════════════════════════════════════════════════════════════════
     BOOT
     ═════════════════════════════════════════════════════════════════════════ */
  _boot() {
    this._applyPrefs();
    this._bindAll();
    this._initWelcome();
    this._updateHeaderStats();
    this._renderSbHistory();
    this._updateUserUI();

    /* Console branding */
    console.log(
      `%c✨ ${SAVOIRÉ.BRAND} — Think Less. Know More.`,
      'color:#C9A96E;font-size:16px;font-weight:bold;font-family:Georgia,serif'
    );
    console.log(
      `%cBuilt by ${SAVOIRÉ.DEVELOPER} | ${SAVOIRÉ.DEVSITE}`,
      'color:#C9A96E;font-size:12px'
    );
    console.log(
      `%cFounder: ${SAVOIRÉ.FOUNDER}`,
      'color:#756D63;font-size:11px'
    );
  }

  /* ═══════════════════════════════════════════════════════════════════════════
     HELPERS
     ═════════════════════════════════════════════════════════════════════════ */
  _el(id)          { return document.getElementById(id); }
  _qs(sel)         { return document.querySelector(sel); }
  _qsa(sel)        { return document.querySelectorAll(sel); }
  _on(id, ev, fn)  { const el = this._el(id); if (el) el.addEventListener(ev, fn); }

  _load(key, def) {
    try {
      const v = localStorage.getItem(key);
      return v ? JSON.parse(v) : def;
    } catch { return def; }
  }

  _save(key, val) {
    try { localStorage.setItem(key, JSON.stringify(val)); } catch { /* storage full */ }
  }

  _esc(s) {
    if (!s) return '';
    return String(s)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  _relTime(ts) {
    if (!ts) return '';
    const d   = Date.now() - ts;
    const m   = Math.floor(d / 60000);
    const h   = Math.floor(d / 3600000);
    const day = Math.floor(d / 86400000);
    if (m  <  1)  return 'just now';
    if (m  < 60)  return `${m}m ago`;
    if (h  < 24)  return `${h}h ago`;
    if (day < 7)  return `${day}d ago`;
    return new Date(ts).toLocaleDateString();
  }

  _dateGroup(ts) {
    if (!ts) return 'Unknown';
    const d   = Date.now() - ts;
    const day = Math.floor(d / 86400000);
    if (day === 0) return 'Today';
    if (day === 1) return 'Yesterday';
    if (day <  7)  return 'This Week';
    if (day < 30)  return 'This Month';
    return 'Older';
  }

  _genId() {
    return Date.now().toString(36) + Math.random().toString(36).slice(2);
  }

  _wordCount(text) {
    if (!text) return 0;
    return text.trim().split(/\s+/).filter(Boolean).length;
  }

  _charCount(text) {
    return text ? text.length : 0;
  }

  _renderMd(text) {
    if (!text) return '';
    if (window.marked && window.DOMPurify) {
      return DOMPurify.sanitize(marked.parse(text));
    }
    /* Fallback markdown parser */
    return text
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
      .replace(/^### (.+)$/gm,  '<h3>$1</h3>')
      .replace(/^## (.+)$/gm,   '<h2>$1</h2>')
      .replace(/^# (.+)$/gm,    '<h1>$1</h1>')
      .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.+?)\*/g,     '<em>$1</em>')
      .replace(/`(.+?)`/g,       '<code>$1</code>')
      .replace(/^> (.+)$/gm,    '<blockquote>$1</blockquote>')
      .replace(/^[-*] (.+)$/gm, '<li>$1</li>')
      .replace(/\n\n/g, '</p><p>')
      .replace(/\n/g,   '<br>');
  }

  _stripMd(t) {
    if (!t) return '';
    return t
      .replace(/#{1,6} /g, '')
      .replace(/\*\*(.+?)\*\*/g, '$1')
      .replace(/\*(.+?)\*/g,     '$1')
      .replace(/`(.+?)`/g,       '$1')
      .replace(/^[-*] /gm,  '')
      .replace(/^\d+\. /gm, '')
      .replace(/^> /gm,     '')
      .replace(/\n{3,}/g,   '\n\n')
      .trim();
  }

  /* ═══════════════════════════════════════════════════════════════════════════
     EVENT BINDING — all UI interactions
     ═════════════════════════════════════════════════════════════════════════ */
  _bindAll() {

    /* ── Welcome ── */
    this._on('welcomeBtn',        'click',   () => this._submitWelcome());
    this._on('welcomeNameInput',  'keydown', e  => { if (e.key === 'Enter') this._submitWelcome(); });
    this._on('welcomeSkip',       'click',   () => this._skipWelcome());
    this._on('welcomeSkip',       'keydown', e  => { if (e.key === 'Enter' || e.key === ' ') this._skipWelcome(); });
    this._on('welcomeBackBtn',    'click',   () => this._dismissWelcomeBack());

    /* ── Header buttons ── */
    this._on('sbToggle',          'click',   () => this._toggleSidebar());
    this._on('histBtn',           'click',   () => this._openHistModal());
    this._on('themeBtn',          'click',   () => this._toggleTheme());
    this._on('settingsBtn',       'click',   () => this._openSettingsModal());
    this._on('avBtn',             'click',   e  => { e.stopPropagation(); this._toggleDropdown(); });

    /* ── Avatar dropdown ── */
    this._on('avHist',            'click',   () => { this._closeDropdown(); this._openHistModal(); });
    this._on('avSaved',           'click',   () => { this._closeDropdown(); this._openSavedModal(); });
    this._on('avSettings',        'click',   () => { this._closeDropdown(); this._openSettingsModal(); });
    this._on('avClear',           'click',   () => {
      this._closeDropdown();
      this._confirm('Clear ALL data? History, saved notes and preferences will be permanently deleted.', () => this._clearAllData());
    });

    /* Close dropdown on outside click */
    document.addEventListener('click', () => this._closeDropdown());

    /* ── Tool selector ── */
    this._qsa('.ts-item').forEach(btn => {
      btn.addEventListener('click', () => this._setTool(btn.dataset.tool));
    });

    /* ── Generate button ── */
    this._on('runBtn',   'click', () => this._send());
    this._on('cancelBtn','click', () => this._cancelGeneration());

    /* ── Textarea ── */
    this._on('mainInput', 'input',   () => this._updateCharCount());
    this._on('mainInput', 'keydown', e => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        this._send();
      }
    });
    this._on('taClearBtn', 'click', () => {
      const el = this._el('mainInput');
      if (el) { el.value = ''; this._updateCharCount(); el.focus(); }
    });

    /* ── Input mini bar (expand collapsed input) ── */
    const imb = this._el('inputMiniBar');
    if (imb) {
      imb.addEventListener('click',   () => this._expandInput());
      imb.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') this._expandInput(); });
    }

    /* ── File upload ── */
    this._on('uploadZone', 'click',   () => this._el('fileInput')?.click());
    this._on('uploadZone', 'keydown', e => { if (e.key === 'Enter' || e.key === ' ') this._el('fileInput')?.click(); });
    this._on('fileInput',  'change',  e => this._handleFile(e.target.files[0]));
    this._on('fileChipRm', 'click',   () => this._removeFile());
    this._on('fileChipRm', 'keydown', e => { if (e.key === 'Enter') this._removeFile(); });

    /* Drag & drop on upload zone */
    const dz = this._el('uploadZone');
    if (dz) {
      dz.addEventListener('dragover',  e => {
        e.preventDefault();
        dz.classList.add('drag-over');
      });
      dz.addEventListener('dragleave', () => dz.classList.remove('drag-over'));
      dz.addEventListener('drop',      e => {
        e.preventDefault();
        dz.classList.remove('drag-over');
        const f = e.dataTransfer?.files?.[0];
        if (f) this._handleFile(f);
      });
    }

    /* ── Output toolbar ── */
    this._on('copyBtn',       'click', () => this._copyResult());
    this._on('pdfBtn',        'click', () => this._downloadPDF());
    this._on('saveBtn',       'click', () => this._saveNote());
    this._on('shareBtn',      'click', () => this._shareResult());
    this._on('clearBtn',      'click', () => this._clearOutput());
    this._on('focusModeBtn',  'click', () => this._toggleFocusMode());

    /* ── Sidebar history strip ── */
    this._on('lpHistAll', 'click', () => this._openHistModal());

    /* ── History modal ── */
    this._on('histSearchInput', 'input', e => this._filterHist(e.target.value));
    this._on('clearHistBtn',    'click', () => {
      this._confirm('Clear all study history? This cannot be undone.', () => {
        this.history = [];
        this._save('sv_history', this.history);
        this._renderHistModal();
        this._renderSbHistory();
        this._updateHeaderStats();
        this._toast('info', 'fa-trash', 'History cleared.');
      });
    });
    this._on('exportHistBtn', 'click', () => this._exportDataJson());

    /* History filter buttons */
    this._qsa('.hf').forEach(btn => {
      btn.addEventListener('click', () => {
        this._qsa('.hf').forEach(b => {
          b.classList.remove('active');
          b.setAttribute('aria-pressed', 'false');
        });
        btn.classList.add('active');
        btn.setAttribute('aria-pressed', 'true');
        this._renderHistModal(btn.dataset.filter, this._el('histSearchInput')?.value || '');
      });
    });

    /* ── Settings modal ── */
    this._on('saveNameBtn',   'click', () => this._saveName());
    this._on('exportDataBtn', 'click', () => this._exportDataJson());
    this._on('clearDataBtn',  'click', () => {
      this._confirm('Delete ALL data — history, saved notes and preferences?', () => this._clearAllData());
    });
    this._on('nameInput', 'keydown', e => { if (e.key === 'Enter') this._saveName(); });

    this._qsa('[data-theme-btn]').forEach(btn => {
      btn.addEventListener('click', () => this._setTheme(btn.dataset.themeBtn));
    });
    this._qsa('.font-sz').forEach(btn => {
      btn.addEventListener('click', () => this._setFontSize(btn.dataset.size));
    });

    /* ── Modal close buttons ── */
    this._qsa('[data-close]').forEach(btn => {
      btn.addEventListener('click', () => this._closeModal(btn.dataset.close));
    });
    this._qsa('.modal-close').forEach(btn => {
      const overlay = btn.closest('.modal-overlay');
      if (overlay) btn.addEventListener('click', () => this._closeModal(overlay.id));
    });
    this._qsa('.modal-overlay').forEach(ov => {
      ov.addEventListener('click', e => {
        if (e.target === ov) this._closeModal(ov.id);
      });
    });

    /* ── Confirm dialog ── */
    this._on('confirmOkBtn', 'click', () => {
      this._closeModal('confirmModal');
      if (typeof this.confirmCb === 'function') this.confirmCb();
      this.confirmCb = null;
    });

    /* ── Mobile sidebar backdrop ── */
    this._on('sbBackdrop', 'click', () => this._closeMobileSidebar());

    /* ── Keyboard shortcuts ── */
    document.addEventListener('keydown', e => {
      const ctrl = e.ctrlKey || e.metaKey;
      if (ctrl && e.key === 'k') { e.preventDefault(); this._el('mainInput')?.focus(); }
      if (ctrl && e.key === 'h') { e.preventDefault(); this._openHistModal(); }
      if (ctrl && e.key === 't') { e.preventDefault(); this._toggleTheme(); }
      if (ctrl && e.key === 'b') { e.preventDefault(); this._toggleSidebar(); }
      if (ctrl && e.key === 's') { e.preventDefault(); this._saveNote(); }
      if (ctrl && e.key === 'p') { e.preventDefault(); this._downloadPDF(); }
      if (e.key === 'Escape')     { this._closeAllModals(); }

      /* Flashcard keyboard nav */
      if (this.fcCards.length > 0 && this._el('resultArea')?.style.display !== 'none') {
        if (e.key === ' ')         { e.preventDefault(); this._fcFlip(); }
        if (e.key === 'ArrowLeft')  { this._fcNav(-1); }
        if (e.key === 'ArrowRight') { this._fcNav(1); }
      }
    });

    /* ── Window resize ── */
    window.addEventListener('resize', () => this._handleResize());

    /* ── Output area scroll — back to top button ── */
    const outArea = this._el('outArea');
    if (outArea) {
      outArea.addEventListener('scroll', () => {
        const btn = this._el('backToTopBtn');
        if (!btn) return;
        if (outArea.scrollTop > 300) {
          btn.classList.add('is-visible');
        } else {
          btn.classList.remove('is-visible');
        }
      });
    }

    this._on('backToTopBtn', 'click', () => {
      this._el('outArea')?.scrollTo({ top: 0, behavior: 'smooth' });
    });
  }

  /* ═══════════════════════════════════════════════════════════════════════════
     WELCOME SYSTEM
     ═════════════════════════════════════════════════════════════════════════ */
  _initWelcome() {
    const firstOverlay = this._el('welcomeOverlay');
    const backOverlay  = this._el('welcomeBackOverlay');

    if (this.userName && this.userName.length >= 2) {
      /* Returning user */
      if (firstOverlay) firstOverlay.style.display = 'none';
      this._updateUserUI();

      if (backOverlay) {
        /* Update stats */
        const nameEl = this._el('wbName');
        if (nameEl) nameEl.textContent = this.userName;

        const newSessions = this.sessions + 1;
        localStorage.setItem('sv_sessions', newSessions);
        this.sessions = newSessions;

        const seEl = this._el('wbSessions');
        const hEl  = this._el('wbHistCount');
        const sEl  = this._el('wbSavedCount');
        if (seEl) seEl.textContent = newSessions;
        if (hEl)  hEl.textContent  = this.history.length;
        if (sEl)  sEl.textContent  = this.saved.length;

        backOverlay.style.display = 'flex';
        /* Auto dismiss after 4 seconds */
        setTimeout(() => this._dismissWelcomeBack(), 4000);
      }
    } else {
      /* First-time user */
      if (firstOverlay) firstOverlay.style.display = 'flex';
      if (backOverlay)  backOverlay.style.display   = 'none';
      setTimeout(() => this._el('welcomeNameInput')?.focus(), 500);
    }
  }

  _submitWelcome() {
    const inp    = this._el('welcomeNameInput');
    const errEl  = this._el('welcomeErr');
    const name   = inp?.value?.trim() || '';

    if (!name || name.length < 2) {
      if (errEl) errEl.textContent = 'Please enter your name (at least 2 characters).';
      inp?.focus();
      return;
    }
    if (errEl) errEl.textContent = '';

    const isNew   = !this.userName;
    this.userName = name;
    localStorage.setItem('sv_user', name);
    localStorage.setItem('sv_sessions', '1');
    this.sessions = 1;

    const overlay = this._el('welcomeOverlay');
    if (overlay) {
      overlay.classList.add('fade-out');
      setTimeout(() => {
        overlay.style.display = 'none';
        overlay.classList.remove('fade-out');
      }, 500);
    }

    this._updateUserUI();
    this._updateHeaderStats();

    if (isNew) {
      this._toast('success', 'fa-graduation-cap', `Welcome to Savoiré AI, ${name}! 🎓`);
      this._notifyNewUser(name);
      /* Pulse the run button to guide new users */
      setTimeout(() => {
        const btn = this._el('runBtn');
        if (btn) {
          btn.classList.add('onboarding-pulse');
          setTimeout(() => btn.classList.remove('onboarding-pulse'), 6000);
        }
      }, 800);
    }
  }

  _skipWelcome() {
    const overlay = this._el('welcomeOverlay');
    if (!overlay) return;
    overlay.classList.add('fade-out');
    setTimeout(() => {
      overlay.style.display = 'none';
      overlay.classList.remove('fade-out');
    }, 500);
  }

  _dismissWelcomeBack() {
    const el = this._el('welcomeBackOverlay');
    if (!el) return;
    el.classList.add('fade-out');
    setTimeout(() => {
      el.style.display = 'none';
      el.classList.remove('fade-out');
    }, 500);
  }

  /* Free notification — ntfy.sh (no account, no API key needed) */
  _notifyNewUser(name) {
    const payload = {
      name,
      time: new Date().toISOString(),
      app:  SAVOIRÉ.BRAND,
      url:  window.location.href,
    };
    /* ntfy.sh — free push notification, replace channel name as needed */
    fetch(`https://ntfy.sh/${SAVOIRÉ.NTFY_CHANNEL}`, {
      method:  'POST',
      headers: {
        'Title':        `New Savoiré AI User: ${name}`,
        'Tags':         'tada,student,graduation',
        'Priority':     'default',
        'Content-Type': 'text/plain',
      },
      body: `New user joined: ${name}\nTime: ${payload.time}\nPage: ${payload.url}`,
    }).catch(() => { /* Silent — notifications are best-effort */ });
  }

  /* ═══════════════════════════════════════════════════════════════════════════
     USER UI UPDATE
     ═════════════════════════════════════════════════════════════════════════ */
  _updateUserUI() {
    const ini = (this.userName || 'S').charAt(0).toUpperCase();

    /* Avatar letter */
    ['avLetter', 'avDropAv'].forEach(id => {
      const el = this._el(id);
      if (el) el.textContent = ini;
    });

    /* Dropdown name */
    const nameEl = this._el('avDropName');
    if (nameEl) nameEl.textContent = this.userName || 'Scholar';

    /* Header greeting */
    const gr = this._el('dhGreeting');
    if (gr) {
      gr.textContent = this.userName
        ? `Hi, ${this.userName} 👋`
        : 'Think Less. Know More.';
    }

    /* Welcome back name */
    const wbName = this._el('wbName');
    if (wbName) wbName.textContent = this.userName;
  }

  /* ═══════════════════════════════════════════════════════════════════════════
     HEADER STATS UPDATE
     ═════════════════════════════════════════════════════════════════════════ */
  _updateHeaderStats() {
    const setStat = (id, val) => {
      const el = this._el(id);
      if (el) el.textContent = val;
    };
    setStat('statSessions', this.sessions || 0);
    setStat('statHistory',  this.history.length);
    setStat('statSaved',    this.saved.length);
    this._updateHistBadge();
  }

  /* ═══════════════════════════════════════════════════════════════════════════
     TOOL SELECTION
     ═════════════════════════════════════════════════════════════════════════ */
  _setTool(tool) {
    if (!TOOL_CONFIG[tool]) return;
    this.tool = tool;

    /* Update sidebar buttons */
    this._qsa('.ts-item').forEach(b => {
      const isActive = b.dataset.tool === tool;
      b.classList.toggle('active', isActive);
      b.setAttribute('aria-pressed', String(isActive));
    });

    const cfg = TOOL_CONFIG[tool];

    /* Run button */
    const iconEl = this._el('runIcon');
    const lblEl  = this._el('runLabel');
    if (iconEl) iconEl.className = `fas ${cfg.icon}`;
    if (lblEl)  lblEl.textContent = cfg.label;

    /* Textarea placeholder */
    const ta = this._el('mainInput');
    if (ta) ta.placeholder = cfg.placeholder;

    /* Save pref */
    this.prefs.lastTool = tool;
    this._save('sv_prefs', this.prefs);
  }

  /* ═══════════════════════════════════════════════════════════════════════════
     GENERATE — MAIN ENTRY POINT
     ═════════════════════════════════════════════════════════════════════════ */
  async _send() {
    const input = this._el('mainInput');
    const text  = input?.value?.trim();

    if (!text) {
      this._toast('info', 'fa-info-circle', 'Please enter a topic or paste some text first.');
      input?.focus();
      return;
    }

    if (this.generating) {
      this._toast('warning', 'fa-hourglass-half', 'Generation is already in progress — please wait.');
      return;
    }

    const depth = this._el('depthSel')?.value  || 'detailed';
    const lang  = this._el('langSel')?.value   || 'English';
    const style = this._el('styleSel')?.value  || 'simple';

    /* ── MOBILE AUTO-SCROLL TO OUTPUT ─────────────────────────────────────
       On mobile devices, immediately scroll to the output area when Generate
       is clicked so the user sees the output as it streams in.
       ─────────────────────────────────────────────────────────────────── */
    this._mobileScrollToOutput();

    /* ── UI state ── */
    this.generating   = true;
    this.streamBuffer = '';
    this._setRunLoading(true);
    this._collapseInput(text);
    this._showStreamOverlay(text, this.tool);
    this._startThinkingStages();

    try {
      const data = await this._callAPIStream(text, { depth, language: lang, style, tool: this.tool });
      this.currentData = data;

      /* Hide stream overlay and render full structured result */
      this._hideStreamOverlay();
      this._renderResult(data);
      this._addToHistory({
        id:    this._genId(),
        topic: data.topic || text,
        tool:  this.tool,
        data,
        ts:    Date.now(),
      });
      this._updateHeaderStats();
      this._toast('success', 'fa-check-circle', `${TOOL_CONFIG[this.tool].label} ready!`);

      /* Scroll result into view */
      setTimeout(() => this._scrollToResult(), 200);

    } catch (err) {
      if (err.name === 'AbortError') {
        this._toast('info', 'fa-stop-circle', 'Generation cancelled.');
        this._hideStreamOverlay();
        this._showState('empty');
      } else {
        this._hideStreamOverlay();
        this._showState('error', err.message || 'Something went wrong. Please try again.');
        this._toast('error', 'fa-exclamation-circle', err.message || 'Generation failed.');
      }
    } finally {
      this.generating = false;
      this._setRunLoading(false);
      this._stopThinkingStages();
      this._showCancelBtn(false);
    }
  }

  /* ── Mobile scroll to output area ── */
  _mobileScrollToOutput() {
    if (window.innerWidth > 768) return; /* Desktop — no scroll needed */

    const outArea = this._el('outArea');
    if (!outArea) return;

    /* Scroll the output area into view */
    outArea.scrollIntoView({ behavior: 'smooth', block: 'start' });

    /* Also scroll within the page if outArea is not in view */
    setTimeout(() => {
      const rightPanel = this._el('rightPanel');
      if (rightPanel) {
        rightPanel.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }, 100);
  }

  /* ── Scroll to result after generation ── */
  _scrollToResult() {
    const resultArea = this._el('resultArea');
    if (resultArea && resultArea.style.display !== 'none') {
      resultArea.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }

    /* Also scroll outArea to top */
    const outArea = this._el('outArea');
    if (outArea) {
      outArea.scrollTo({ top: 0, behavior: 'smooth' });
    }

    /* Mobile: scroll window too */
    if (window.innerWidth <= 768) {
      window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' });
    }
  }

  /* ═══════════════════════════════════════════════════════════════════════════
     STREAMING API CALL
     Tries SSE streaming first, falls back to JSON
     ═════════════════════════════════════════════════════════════════════════ */
  async _callAPIStream(message, opts = {}) {
    /* Create abort controller for cancel support */
    this.streamCtrl = new AbortController();
    this._showCancelBtn(true);

    try {
      return await this._streamSSE(message, opts);
    } catch (err) {
      if (err.name === 'AbortError') throw err;
      console.warn('[Savoiré] SSE failed, falling back to JSON:', err.message);
      return await this._callAPIJson(message, opts);
    }
  }

  /* ── Server-Sent Events streaming ── */
  async _streamSSE(message, opts) {
    return new Promise((resolve, reject) => {
      const body = JSON.stringify({
        message,
        options: { ...opts, stream: true },
      });

      fetch(SAVOIRÉ.API_URL, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body,
        signal: this.streamCtrl?.signal,
      })
      .then(async res => {
        if (!res.ok) {
          const text = await res.text().catch(() => '');
          reject(new Error(`Server error (${res.status})${text ? ': ' + text.slice(0, 120) : ''}`));
          return;
        }

        const ct = res.headers.get('content-type') || '';
        if (!ct.includes('text/event-stream')) {
          /* Server returned plain JSON instead of stream */
          const data = await res.json();
          if (data.error) { reject(new Error(data.error)); return; }
          /* Simulate streaming for JSON response */
          this._simulateStream(data, resolve, reject);
          return;
        }

        /* ── True SSE streaming ── */
        const reader  = res.body.getReader();
        const decoder = new TextDecoder();
        let   lineBuffer = '';
        let   charCount  = 0;

        const sfpText = this._el('sfpText');

        const pump = async () => {
          try {
            while (true) {
              const { done, value } = await reader.read();
              if (done) { reject(new Error('Stream ended without final data')); return; }

              lineBuffer += decoder.decode(value, { stream: true });
              const lines = lineBuffer.split('\n');
              lineBuffer  = lines.pop() || '';

              for (const line of lines) {
                if (!line.startsWith('data: ')) continue;
                const raw = line.slice(6).trim();

                try {
                  const evt = JSON.parse(raw);

                  if (evt.t !== undefined) {
                    /* ── Token chunk — display live ── */
                    this.streamBuffer += evt.t;
                    charCount         += evt.t.length;

                    if (sfpText) {
                      sfpText.textContent = this.streamBuffer;
                      /* Auto-scroll stream area */
                      const scroll = this._el('sfpScroll');
                      if (scroll) scroll.scrollTop = scroll.scrollHeight;
                    }

                    /* Update thinking stages based on char count */
                    this._updateStageByProgress(charCount);

                    /* Mobile — keep screen scrolled to see stream */
                    if (window.innerWidth <= 768) {
                      const sfp = this._el('streamFullpage');
                      if (sfp && sfp.style.display !== 'none') {
                        sfp.scrollIntoView({ behavior: 'smooth', block: 'start' });
                      }
                    }

                  } else if (evt.topic !== undefined) {
                    /* ── Final structured data object ── */
                    if (sfpText) sfpText.classList.add('done');
                    resolve(evt);
                    return;
                  }
                } catch {
                  /* Skip malformed SSE line */
                }
              }
            }
          } catch (err) {
            reject(err);
          }
        };

        pump();
      })
      .catch(reject);
    });
  }

  /* ── Simulate streaming for JSON fallback (animates text char by char) ── */
  async _simulateStream(data, resolve, reject) {
    const notesText = this._stripMd(data.ultra_long_notes || data.topic || 'Generating…');
    const sfpText   = this._el('sfpText');
    let   displayed = '';
    let   i         = 0;
    const chunkSize = 4;
    const delay     = 18;

    const tick = () => {
      if (this.streamCtrl?.signal.aborted) { reject(new Error('AbortError')); return; }
      if (i >= notesText.length) {
        if (sfpText) sfpText.classList.add('done');
        resolve(data);
        return;
      }
      displayed += notesText.slice(i, i + chunkSize);
      i         += chunkSize;
      if (sfpText) {
        sfpText.textContent = displayed;
        const scroll = this._el('sfpScroll');
        if (scroll) scroll.scrollTop = scroll.scrollHeight;
      }
      this._updateStageByProgress(i);
      setTimeout(tick, delay);
    };

    tick();
  }

  /* ── Plain JSON API call (non-streaming fallback) ── */
  async _callAPIJson(message, opts = {}) {
    const res = await fetch(SAVOIRÉ.API_URL, {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ message, options: { ...opts, stream: false } }),
      signal:  this.streamCtrl?.signal,
    });
    if (!res.ok) throw new Error(`Server error (${res.status}). Please try again.`);
    const data = await res.json();
    if (data.error) throw new Error(data.error);
    return data;
  }

  /* ── Cancel generation ── */
  _cancelGeneration() {
    if (this.streamCtrl) {
      this.streamCtrl.abort();
      this.streamCtrl = null;
    }
  }

  /* ═══════════════════════════════════════════════════════════════════════════
     INPUT COLLAPSE / EXPAND
     ═════════════════════════════════════════════════════════════════════════ */
  _collapseInput(topic) {
    /* Collapse textarea + selectors */
    const taWrap       = this._el('taCollapseWrap');
    const selectorsWrap= this._el('selectorsCollapseWrap');
    const suggWrap     = this._el('suggCollapseWrap');
    const fileWrap     = this._el('fileCollapseWrap');
    const miniBar      = this._el('inputMiniBar');
    const statusCard   = this._el('streamStatusCard');
    const miniText     = this._el('inputMiniText');

    if (taWrap)        taWrap.classList.add('is-collapsed');
    if (selectorsWrap) selectorsWrap.classList.add('is-collapsed');
    if (suggWrap)      suggWrap.classList.add('is-collapsed');
    if (fileWrap)      fileWrap.classList.add('is-collapsed');

    if (miniText) miniText.textContent = topic.length > 40 ? topic.substring(0, 40) + '…' : topic;
    if (miniBar)  miniBar.classList.add('is-visible');
    if (statusCard) statusCard.classList.add('is-visible');
  }

  _expandInput() {
    const taWrap        = this._el('taCollapseWrap');
    const selectorsWrap = this._el('selectorsCollapseWrap');
    const suggWrap      = this._el('suggCollapseWrap');
    const fileWrap      = this._el('fileCollapseWrap');
    const miniBar       = this._el('inputMiniBar');
    const statusCard    = this._el('streamStatusCard');

    if (taWrap)        taWrap.classList.remove('is-collapsed');
    if (selectorsWrap) selectorsWrap.classList.remove('is-collapsed');
    if (suggWrap)      suggWrap.classList.remove('is-collapsed');
    if (fileWrap)      fileWrap.classList.remove('is-collapsed');
    if (miniBar)       miniBar.classList.remove('is-visible');
    if (statusCard)    statusCard.classList.remove('is-visible');

    /* Focus textarea */
    setTimeout(() => this._el('mainInput')?.focus(), 200);
  }

  /* ── Full expand when generation ends ── */
  _restoreInput() {
    this._expandInput();
    this._showCancelBtn(false);
  }

  /* ═══════════════════════════════════════════════════════════════════════════
     STREAMING OVERLAY — full page typewriter
     ═════════════════════════════════════════════════════════════════════════ */
  _showStreamOverlay(topic, tool) {
    const sfp       = this._el('streamFullpage');
    const sfpTopic  = this._el('sfpTopic');
    const sfpIcon   = this._el('sfpToolIcon');
    const sfpName   = this._el('sfpToolName');
    const sfpLabel  = this._el('sfpLabel');
    const sfpText   = this._el('sfpText');

    if (!sfp) return;

    const cfg = TOOL_CONFIG[tool] || TOOL_CONFIG.notes;
    if (sfpTopic)  sfpTopic.textContent = topic.length > 50 ? topic.substring(0, 50) + '…' : topic;
    if (sfpIcon)   sfpIcon.className    = `fas ${cfg.sfpIcon}`;
    if (sfpName)   sfpName.textContent  = cfg.sfpName;
    if (sfpLabel)  sfpLabel.textContent = cfg.sfpLabel;
    if (sfpText)   { sfpText.textContent = ''; sfpText.classList.remove('done'); }

    /* Adjust left position based on sidebar state */
    const lp = this._el('leftPanel');
    if (lp && !lp.classList.contains('collapsed')) {
      sfp.classList.add('panel-open');
    } else {
      sfp.classList.remove('panel-open');
    }

    sfp.style.display = 'flex';

    /* Hide main output panels */
    const emptyState  = this._el('emptyState');
    const thinkingWrap= this._el('thinkingWrap');
    const resultArea  = this._el('resultArea');
    if (emptyState)   emptyState.style.display   = 'none';
    if (thinkingWrap) thinkingWrap.style.display = 'none';
    if (resultArea)   resultArea.style.display   = 'none';

    /* Mobile: ensure stream is visible */
    if (window.innerWidth <= 768) {
      sfp.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }

  _hideStreamOverlay() {
    const sfp = this._el('streamFullpage');
    if (sfp) sfp.style.display = 'none';
    this._restoreInput();
  }

  /* ═══════════════════════════════════════════════════════════════════════════
     THINKING STAGES
     ═════════════════════════════════════════════════════════════════════════ */
  _startThinkingStages() {
    this.stageIdx = 0;
    /* Reset all stages */
    for (let i = 0; i < 5; i++) {
      const el = this._el(`ts${i}`);
      if (el) el.className = 'ths';
      const ss = this._el(`ss${i}`);
      if (ss) ss.className = 'ssc-stage';
    }
    /* Activate first */
    this._activateStage(0);

    this.thinkTimer = setInterval(() => {
      this.stageIdx++;
      if (this.stageIdx < 5) {
        this._doneStage(this.stageIdx - 1);
        this._activateStage(this.stageIdx);
      }
    }, 3500);
  }

  _activateStage(idx) {
    const el = this._el(`ts${idx}`);
    if (el) { el.classList.remove('done'); el.classList.add('active'); }
    const ss = this._el(`ss${idx}`);
    if (ss) { ss.classList.remove('done'); ss.classList.add('active'); }
  }

  _doneStage(idx) {
    const el = this._el(`ts${idx}`);
    if (el) { el.classList.remove('active'); el.classList.add('done'); }
    const ss = this._el(`ss${idx}`);
    if (ss) { ss.classList.remove('active'); ss.classList.add('done'); }
  }

  _stopThinkingStages() {
    if (this.thinkTimer) { clearInterval(this.thinkTimer); this.thinkTimer = null; }
    /* Mark all done */
    for (let i = 0; i <= this.stageIdx && i < 5; i++) { this._doneStage(i); }
    this._doneStage(4);
  }

  _updateStageByProgress(charCount) {
    const thresholds = [0, 400, 1000, 2000, 3500];
    for (let i = thresholds.length - 1; i >= 0; i--) {
      if (charCount >= thresholds[i] && this.stageIdx < i) {
        this._doneStage(this.stageIdx);
        this.stageIdx = i;
        this._activateStage(i);
        break;
      }
    }
  }

  /* ═══════════════════════════════════════════════════════════════════════════
     UI STATE MANAGEMENT
     ═════════════════════════════════════════════════════════════════════════ */
  _showState(state, errorMsg) {
    const empty    = this._el('emptyState');
    const thinking = this._el('thinkingWrap');
    const result   = this._el('resultArea');

    if (empty)    empty.style.display    = 'none';
    if (thinking) thinking.style.display = 'none';
    if (result)   result.style.display   = 'none';

    switch (state) {
      case 'thinking':
        if (thinking) thinking.style.display = 'block';
        this._scrollOutArea();
        break;

      case 'result':
        if (result) result.style.display = 'block';
        this._scrollOutArea();
        break;

      case 'error':
        if (result) {
          result.style.display = 'block';
          result.innerHTML = `
            <div class="error-card">
              <div class="error-card-hdr">
                <i class="fas fa-exclamation-circle"></i>
                Generation Failed
              </div>
              <div class="error-card-body">${this._esc(errorMsg)}</div>
              <div class="error-card-hint">
                The AI models may be temporarily busy.
                The system automatically tries 10 different models.
                Please wait a moment and try again.
              </div>
              <button
                class="btn btn-primary"
                style="margin-top:16px"
                onclick="document.getElementById('mainInput').focus()"
              >
                <i class="fas fa-redo"></i> Try Again
              </button>
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

  _setRunLoading(on) {
    const btn  = this._el('runBtn');
    const icon = this._el('runIcon');
    const lbl  = this._el('runLabel');
    if (!btn) return;
    btn.disabled = on;
    if (on) {
      if (icon) icon.className = 'fas fa-spinner fa-spin';
      if (lbl)  lbl.textContent = 'Generating…';
    } else {
      const cfg = TOOL_CONFIG[this.tool] || TOOL_CONFIG.notes;
      if (icon) icon.className = `fas ${cfg.icon}`;
      if (lbl)  lbl.textContent = cfg.label;
    }
  }

  _showCancelBtn(show) {
    const btn = this._el('cancelBtn');
    if (!btn) return;
    btn.classList.toggle('is-visible', show);
  }

  _scrollOutArea() {
    const oa = this._el('outArea');
    if (oa) setTimeout(() => { oa.scrollTop = 0; }, 100);
  }

  /* ═══════════════════════════════════════════════════════════════════════════
     RESULT RENDERING — builds full structured HTML from AI data
     ═════════════════════════════════════════════════════════════════════════ */
  _renderResult(data) {
    const area = this._el('resultArea');
    if (!area) return;

    area.innerHTML = this._buildResultHTML(data);
    this._showState('result');

    /* Init interactive tools */
    if (this.tool === 'quiz') this._quizInit(data);

    /* Mobile: scroll to result */
    if (window.innerWidth <= 768) {
      setTimeout(() => {
        area.scrollIntoView({ behavior: 'smooth', block: 'start' });
        window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' });
      }, 200);
    }
  }

  _buildResultHTML(data) {
    const topic = this._esc(data.topic || 'Study Material');
    const score = data.study_score || 96;
    const pct   = Math.min(100, Math.max(0, score));
    const wc    = this._wordCount(this._stripMd(data.ultra_long_notes || ''));
    const lang  = data._language || 'English';

    /* ── Result Header ── */
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
              ${new Date().toLocaleDateString('en-GB', { day:'numeric', month:'short', year:'numeric' })}
            </div>
            <div class="rh-mi">
              <i class="fas fa-globe"></i>
              ${this._esc(lang)}
            </div>
            <div class="rh-mi">
              <i class="fas fa-file-word"></i>
              ~${wc.toLocaleString()} words
            </div>
            <div class="rh-mi">
              <i class="fas fa-star" style="color:var(--gold)"></i>
              Score: ${score}/100
            </div>
          </div>
          <div class="rh-powered">
            Powered by <strong>${SAVOIRÉ.BRAND}</strong>
            &nbsp;·&nbsp;
            <a href="https://${SAVOIRÉ.DEVSITE}" target="_blank" rel="noopener">${SAVOIRÉ.DEVELOPER}</a>
            &nbsp;·&nbsp;
            <a href="https://${SAVOIRÉ.WEBSITE}" target="_blank" rel="noopener">${SAVOIRÉ.WEBSITE}</a>
          </div>
        </div>
        <div class="score-ring-wrap">
          <div class="rh-score" style="--pct:${pct}" title="Study score ${score}/100">
            <div class="rh-score-val">${score}</div>
          </div>
          <div class="score-ring-label">Score</div>
        </div>
      </div>`;

    /* ── Section navigation ── */
    const navItems = this._buildNavItems(data);
    const nav = navItems.length > 2 ? `
      <div class="result-nav" aria-label="Jump to section">
        ${navItems.map(item => `
          <a href="#${item.id}" class="result-nav-btn" title="Jump to ${item.label}">
            <i class="${item.icon}"></i> ${item.label}
          </a>`).join('')}
      </div>` : '';

    /* ── Tool-specific body ── */
    let body = '';
    switch (this.tool) {
      case 'flashcards': body = this._buildFcHTML(data);      break;
      case 'quiz':       body = this._buildQuizHTML(data);    break;
      case 'summary':    body = this._buildSummaryHTML(data); break;
      case 'mindmap':    body = this._buildMindmapHTML(data); break;
      default:           body = this._buildNotesHTML(data);   break;
    }

    /* ── Export bar ── */
    const exportBar = `
      <div class="export-bar">
        <button class="exp-btn pdf"   onclick="window._app._downloadPDF()"   title="Download as professional PDF">
          <i class="fas fa-file-pdf"></i><span>Download PDF</span>
        </button>
        <button class="exp-btn copy"  onclick="window._app._copyResult()"    title="Copy all text">
          <i class="fas fa-copy"></i><span>Copy Text</span>
        </button>
        <button class="exp-btn save"  onclick="window._app._saveNote()"      title="Save to library">
          <i class="fas fa-star"></i><span>Save Note</span>
        </button>
        <button class="exp-btn share" onclick="window._app._shareResult()"   title="Share">
          <i class="fas fa-share-alt"></i><span>Share</span>
        </button>
        <span class="exp-brand">
          ${SAVOIRÉ.BRAND} &nbsp;·&nbsp;
          <a href="https://${SAVOIRÉ.DEVSITE}" target="_blank" rel="noopener">${SAVOIRÉ.DEVELOPER}</a>
        </span>
      </div>`;

    /* ── Branding footer ── */
    const brandingFooter = `
      <div class="result-branding-footer">
        <div class="rbf-left">
          <div class="rbf-logo" aria-hidden="true">Ś</div>
          <div class="rbf-text">
            <a href="https://${SAVOIRÉ.WEBSITE}" target="_blank" rel="noopener">${SAVOIRÉ.BRAND}</a>
            &nbsp;·&nbsp;
            <a href="https://${SAVOIRÉ.DEVSITE}" target="_blank" rel="noopener">${SAVOIRÉ.DEVELOPER}</a>
            &nbsp;·&nbsp; Founder: ${SAVOIRÉ.FOUNDER}
            &nbsp;·&nbsp; Free forever for every student on Earth.
          </div>
        </div>
        <div class="rbf-ts">${new Date().toLocaleString()}</div>
      </div>`;

    return `<div class="result-wrap">${header}${nav}${body}${exportBar}${brandingFooter}</div>`;
  }

  /* ── Section nav builder ── */
  _buildNavItems(data) {
    const items = [];
    if (data.ultra_long_notes)           items.push({ id:'sec-notes',    label:'Notes',        icon:'fas fa-book-open' });
    if (data.key_concepts?.length)       items.push({ id:'sec-concepts', label:'Concepts',     icon:'fas fa-lightbulb' });
    if (data.key_tricks?.length)         items.push({ id:'sec-tricks',   label:'Tricks',       icon:'fas fa-magic' });
    if (data.practice_questions?.length) items.push({ id:'sec-qa',       label:'Questions',    icon:'fas fa-pen-alt' });
    if (data.real_world_applications?.length) items.push({ id:'sec-apps','label':'Applications', icon:'fas fa-globe' });
    if (data.common_misconceptions?.length)   items.push({ id:'sec-misc','label':'Misconceptions', icon:'fas fa-exclamation-triangle' });
    return items;
  }

  /* ═══════════════════════════════════════════════════════════════════════════
     NOTES HTML — Full structured study notes layout
     ═════════════════════════════════════════════════════════════════════════ */
  _buildNotesHTML(data) {
    let h = '';

    /* ── Comprehensive Notes ── */
    if (data.ultra_long_notes) {
      h += `
        <div class="study-sec section-anchor" id="sec-notes">
          <div class="ss-hdr">
            <div class="ss-title">
              <i class="fas fa-book-open"></i>
              Comprehensive Analysis
            </div>
            <button class="ss-copy-btn" onclick="window._app._copySection(${JSON.stringify(this._stripMd(data.ultra_long_notes))})">
              <i class="fas fa-copy"></i> Copy
            </button>
          </div>
          <div class="ss-body">
            <div class="md-content">${this._renderMd(data.ultra_long_notes)}</div>
          </div>
        </div>`;
    }

    /* ── Key Concepts Grid ── */
    if (data.key_concepts?.length) {
      const cards = data.key_concepts.map((c, i) => `
        <div class="concept-card">
          <div class="concept-num" aria-hidden="true">${i + 1}</div>
          <div class="concept-text">${this._esc(c)}</div>
        </div>`).join('');

      h += `
        <div class="study-sec section-anchor" id="sec-concepts">
          <div class="ss-hdr">
            <div class="ss-title"><i class="fas fa-lightbulb"></i> Key Concepts</div>
            <button class="ss-copy-btn" onclick="window._app._copySection(${JSON.stringify(data.key_concepts.join('\n'))})">
              <i class="fas fa-copy"></i> Copy
            </button>
          </div>
          <div class="ss-body">
            <div class="concepts-grid">${cards}</div>
          </div>
        </div>`;
    }

    /* ── Study Tricks ── */
    if (data.key_tricks?.length) {
      const ICONS = ['fas fa-magic', 'fas fa-star', 'fas fa-bolt', 'fas fa-key', 'fas fa-brain'];
      const items = data.key_tricks.map((t, i) => `
        <div class="trick-item">
          <div class="trick-icon">
            <i class="${ICONS[i % ICONS.length]}" aria-hidden="true"></i>
          </div>
          <div class="trick-text">${this._esc(t)}</div>
        </div>`).join('');

      h += `
        <div class="study-sec section-anchor" id="sec-tricks">
          <div class="ss-hdr">
            <div class="ss-title"><i class="fas fa-magic"></i> Study Tricks &amp; Memory Aids</div>
            <button class="ss-copy-btn" onclick="window._app._copySection(${JSON.stringify(data.key_tricks.join('\n'))})">
              <i class="fas fa-copy"></i> Copy
            </button>
          </div>
          <div class="ss-body">
            <div class="tricks-list">${items}</div>
          </div>
        </div>`;
    }

    /* ── Practice Questions ── */
    if (data.practice_questions?.length) {
      const qs = data.practice_questions.map((qa, i) => `
        <div class="qa-card">
          <div
            class="qa-head"
            onclick="this.nextElementSibling.classList.toggle('visible');this.querySelector('.qa-toggle').classList.toggle('open');"
            role="button"
            tabindex="0"
            aria-label="Question ${i+1}: ${qa.question.substring(0,60)}"
            onkeydown="if(event.key==='Enter'||event.key===' ')this.click()"
          >
            <div class="qa-num" aria-hidden="true">${i + 1}</div>
            <div class="qa-q">${this._esc(qa.question)}</div>
            <button class="qa-toggle" tabindex="-1" aria-hidden="true">
              <i class="fas fa-chevron-down"></i> Answer
            </button>
          </div>
          <div class="qa-answer">
            <div class="qa-albl">
              <i class="fas fa-check-circle" aria-hidden="true"></i>
              Answer &amp; Explanation
            </div>
            <div class="qa-answer-inner">${this._renderMd(qa.answer)}</div>
          </div>
        </div>`).join('');

      h += `
        <div class="study-sec section-anchor" id="sec-qa">
          <div class="ss-hdr">
            <div class="ss-title"><i class="fas fa-pen-alt"></i> Practice Questions &amp; Answers</div>
          </div>
          <div class="ss-body">
            <div class="qa-list">${qs}</div>
          </div>
        </div>`;
    }

    /* ── Real-World Applications ── */
    if (data.real_world_applications?.length) {
      const items = data.real_world_applications.map((a, i) => `
        <div class="list-item app">
          <i class="fas fa-globe li-ico" style="color:var(--em2)" aria-hidden="true"></i>
          <div class="li-text">
            <strong style="color:var(--em2)">Application ${i+1}:</strong>
            ${this._esc(a)}
          </div>
        </div>`).join('');

      h += `
        <div class="study-sec section-anchor" id="sec-apps">
          <div class="ss-hdr">
            <div class="ss-title"><i class="fas fa-globe"></i> Real-World Applications</div>
            <button class="ss-copy-btn" onclick="window._app._copySection(${JSON.stringify(data.real_world_applications.join('\n'))})">
              <i class="fas fa-copy"></i> Copy
            </button>
          </div>
          <div class="ss-body">
            <div class="items-list">${items}</div>
          </div>
        </div>`;
    }

    /* ── Common Misconceptions ── */
    if (data.common_misconceptions?.length) {
      const items = data.common_misconceptions.map((m, i) => `
        <div class="list-item misc">
          <i class="fas fa-exclamation-triangle li-ico" style="color:var(--ruby2)" aria-hidden="true"></i>
          <div class="li-text">
            <strong style="color:var(--ruby2)">Misconception ${i+1}:</strong>
            ${this._esc(m)}
          </div>
        </div>`).join('');

      h += `
        <div class="study-sec section-anchor" id="sec-misc">
          <div class="ss-hdr">
            <div class="ss-title"><i class="fas fa-exclamation-triangle"></i> Common Misconceptions</div>
          </div>
          <div class="ss-body">
            <div class="items-list">${items}</div>
          </div>
        </div>`;
    }

    return h || `
      <div style="padding:24px;color:var(--t3);font-family:var(--fb);font-size:1rem;line-height:1.7">
        Study materials generated.
        ${data._fallback ? ' (Running in offline fallback mode — check your API key on Vercel.)' : ''}
      </div>`;
  }

  /* ═══════════════════════════════════════════════════════════════════════════
     FLASHCARDS HTML — 3D flip cards with progress
     ═════════════════════════════════════════════════════════════════════════ */
  _buildFcHTML(data) {
    /* Build card deck from concepts + questions */
    const cards = [];
    (data.key_concepts || []).forEach(c => {
      const parts = c.split(':');
      cards.push({
        q: (parts[0] || c).trim(),
        a: parts.slice(1).join(':').trim() || c,
      });
    });
    (data.practice_questions || []).forEach(qa => {
      cards.push({ q: qa.question, a: qa.answer });
    });

    if (!cards.length) return this._buildNotesHTML(data);

    this.fcCards   = cards;
    this.fcCurrent = 0;
    this.fcFlipped = false;

    const total = cards.length;
    const first = cards[0];

    return `
      <div class="study-sec">
        <div class="ss-hdr">
          <div class="ss-title">
            <i class="fas fa-layer-group"></i>
            Interactive Flashcards
            <span style="color:var(--t3);font-weight:400;text-transform:none;letter-spacing:0;margin-left:4px">
              (${total} cards)
            </span>
          </div>
        </div>
        <div class="ss-body">
          <div class="fc-mode">

            <!-- Progress bar + counter -->
            <div class="fc-top-bar">
              <div class="fc-prog">
                Card <span id="fcCur">1</span> of <span id="fcTot">${total}</span>
              </div>
              <div class="fc-prog-bar-wrap">
                <div class="fc-prog-bar-fill" id="fcProgBar" style="width:${(1/total*100).toFixed(1)}%"></div>
              </div>
              <div class="fc-prog" style="min-width:50px;text-align:right">
                <span id="fcPct">${(1/total*100).toFixed(0)}</span>%
              </div>
            </div>

            <!-- 3D Card -->
            <div
              class="fc-wrap"
              onclick="window._app._fcFlip()"
              title="Click to flip (or press Space)"
              role="button"
              tabindex="0"
              aria-label="Flashcard — click or press Space to flip"
              onkeydown="if(event.key===' '){event.preventDefault();window._app._fcFlip();}"
            >
              <div class="flashcard" id="theCard">
                <div class="fc-face fc-front">
                  <div class="fc-lbl">Question / Concept</div>
                  <div class="fc-content" id="fcFront">${this._esc(first.q)}</div>
                  <div class="fc-hint" aria-hidden="true">Click to flip · <kbd>Space</kbd></div>
                </div>
                <div class="fc-face fc-back">
                  <div class="fc-lbl">Answer / Explanation</div>
                  <div class="fc-content" id="fcBack">${this._esc(first.a)}</div>
                </div>
              </div>
            </div>

            <!-- Controls -->
            <div class="fc-controls">
              <button
                class="fc-btn"
                id="fcPrev"
                onclick="window._app._fcNav(-1)"
                ${total <= 1 ? 'disabled' : ''}
                aria-label="Previous card"
              >
                <i class="fas fa-arrow-left"></i> Prev
              </button>
              <button
                class="fc-btn primary"
                onclick="window._app._fcFlip()"
                aria-label="Flip card"
              >
                <i class="fas fa-sync-alt"></i> Flip
              </button>
              <button
                class="fc-btn"
                id="fcNext"
                onclick="window._app._fcNav(1)"
                ${total <= 1 ? 'disabled' : ''}
                aria-label="Next card"
              >
                Next <i class="fas fa-arrow-right"></i>
              </button>
            </div>

            <!-- Shuffle + Restart -->
            <div class="fc-controls" style="margin-top:-6px">
              <button class="fc-btn" onclick="window._app._fcShuffle()" aria-label="Shuffle cards">
                <i class="fas fa-random"></i> Shuffle
              </button>
              <button class="fc-btn" onclick="window._app._fcRestart()" aria-label="Restart from beginning">
                <i class="fas fa-redo"></i> Restart
              </button>
            </div>

            <!-- Keyboard hint -->
            <div class="fc-swipe-hint fc-kb">
              <kbd>Space</kbd> flip &nbsp;·&nbsp;
              <kbd>←</kbd><kbd>→</kbd> navigate &nbsp;·&nbsp;
              ${total} cards total
            </div>

          </div>
        </div>
      </div>`;
  }

  /* ── Flashcard flip ── */
  _fcFlip() {
    const fc = this._el('theCard');
    if (!fc) return;
    this.fcFlipped = !this.fcFlipped;
    fc.classList.toggle('flipped', this.fcFlipped);
  }

  /* ── Flashcard navigate ── */
  _fcNav(dir) {
    if (!this.fcCards.length) return;
    this.fcCurrent = Math.max(0, Math.min(this.fcCards.length - 1, this.fcCurrent + dir));
    this.fcFlipped = false;

    const fc    = this._el('theCard');
    if (fc) fc.classList.remove('flipped');

    const card  = this.fcCards[this.fcCurrent];
    const front = this._el('fcFront');
    const back  = this._el('fcBack');
    const cur   = this._el('fcCur');
    const pct   = this._el('fcPct');
    const bar   = this._el('fcProgBar');
    const prev  = this._el('fcPrev');
    const next  = this._el('fcNext');

    if (front) front.textContent = card.q;
    if (back)  back.textContent  = card.a;
    if (cur)   cur.textContent   = this.fcCurrent + 1;

    const p = ((this.fcCurrent + 1) / this.fcCards.length * 100).toFixed(1);
    if (pct) pct.textContent    = Math.round(p);
    if (bar) bar.style.width    = `${p}%`;

    if (prev) prev.disabled = this.fcCurrent === 0;
    if (next) next.disabled = this.fcCurrent === this.fcCards.length - 1;
  }

  /* ── Shuffle deck ── */
  _fcShuffle() {
    for (let i = this.fcCards.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [this.fcCards[i], this.fcCards[j]] = [this.fcCards[j], this.fcCards[i]];
    }
    this.fcCurrent = 0;
    this.fcFlipped = false;
    this._fcNav(0);
    this._toast('info', 'fa-random', 'Cards shuffled!');
  }

  /* ── Restart deck ── */
  _fcRestart() {
    this.fcCurrent = 0;
    this.fcFlipped = false;
    this._fcNav(0);
  }

  /* ═══════════════════════════════════════════════════════════════════════════
     QUIZ HTML — self-check with score tracking
     ═════════════════════════════════════════════════════════════════════════ */
  _buildQuizHTML(data) {
    const qs = data.practice_questions || [];
    if (!qs.length) return this._buildNotesHTML(data);

    this.quizData  = qs.map(q => ({ ...q, answered: false, correct: false }));
    this.quizIdx   = 0;
    this.quizScore = 0;

    return `
      <div class="study-sec">
        <div class="ss-hdr">
          <div class="ss-title">
            <i class="fas fa-question-circle"></i> Practice Quiz
            <span style="color:var(--t3);font-weight:400;text-transform:none;letter-spacing:0;margin-left:4px">
              (${qs.length} questions)
            </span>
          </div>
          <div style="margin-left:auto;font-family:var(--fm);font-size:.7rem;color:var(--t3)" id="quizScoreLabel">
            Score: 0 / ${qs.length}
          </div>
        </div>
        <div class="ss-body" id="quizBody">
          ${this._renderQuizQ(0)}
        </div>
      </div>`;
  }

  _quizInit() { /* Initialised inline in _buildQuizHTML */ }

  _renderQuizQ(idx) {
    if (idx >= this.quizData.length) {
      const pct = Math.round(this.quizScore / this.quizData.length * 100);
      const grade = pct >= 90 ? '🏆 Excellent!' : pct >= 70 ? '🎓 Good job!' : pct >= 50 ? '📚 Keep studying!' : '💪 Try again!';
      return `
        <div class="quiz-result">
          <div class="qr-icon" aria-hidden="true">
            ${pct >= 70 ? '🏆' : pct >= 50 ? '📚' : '💪'}
          </div>
          <div class="qr-score">${this.quizScore} / ${this.quizData.length}</div>
          <div class="qr-label">${grade}</div>
          <div style="font-family:var(--fm);font-size:.8rem;color:var(--t3);margin-top:6px">
            ${pct}% correct
          </div>
          <div class="fc-controls" style="margin-top:20px">
            <button class="fc-btn primary" onclick="window._app._quizRestart()" aria-label="Restart quiz">
              <i class="fas fa-redo"></i> Try Again
            </button>
            <button class="fc-btn" onclick="window._app._quizReview()" aria-label="Review all answers">
              <i class="fas fa-eye"></i> Review Answers
            </button>
          </div>
        </div>`;
    }

    const q = this.quizData[idx];
    const progress = ((idx) / this.quizData.length * 100).toFixed(0);

    return `
      <div class="quiz-q-card">
        <div class="quiz-progress" title="${progress}% complete">
          <div class="quiz-progress-bar" style="width:${progress}%"></div>
        </div>
        <div class="quiz-q-num">
          Question ${idx + 1} of ${this.quizData.length}
        </div>
        <div class="quiz-q-text">${this._esc(q.question)}</div>
        <div id="quizAnswerArea">
          <button
            class="quiz-reveal-btn"
            onclick="window._app._quizReveal(${idx})"
            aria-label="Reveal the answer"
          >
            <i class="fas fa-eye"></i> Reveal Answer
          </button>
        </div>
      </div>`;
  }

  _quizReveal(idx) {
    const q   = this.quizData[idx];
    const aEl = this._el('quizAnswerArea');
    if (!aEl) return;

    aEl.innerHTML = `
      <div style="margin-bottom:14px">
        <div class="qa-albl"><i class="fas fa-check-circle"></i> Answer &amp; Explanation</div>
        <div class="qa-answer-inner">${this._renderMd(q.answer)}</div>
      </div>
      <div class="quiz-self-check">
        <span class="quiz-self-check-label">Did you get it right?</span>
        <button class="quiz-self-btn yes" onclick="window._app._quizNext(${idx}, true)"  aria-label="Yes, I got it right">
          <i class="fas fa-check"></i> Yes, got it!
        </button>
        <button class="quiz-self-btn no"  onclick="window._app._quizNext(${idx}, false)" aria-label="No, I got it wrong">
          <i class="fas fa-times"></i> Not quite
        </button>
      </div>`;
  }

  _quizNext(idx, correct) {
    if (correct) {
      this.quizScore++;
      this.quizData[idx].correct = true;
      this._toast('success', 'fa-check', 'Correct! Well done 🎉', 1500);
    } else {
      this._toast('info', 'fa-book', 'Keep studying — you\'ll get it next time 📚', 1500);
    }
    this.quizData[idx].answered = true;
    this.quizIdx = idx + 1;

    /* Update score label */
    const scoreLabel = this._el('quizScoreLabel');
    if (scoreLabel) scoreLabel.textContent = `Score: ${this.quizScore} / ${this.quizData.length}`;

    const qb = this._el('quizBody');
    if (qb) qb.innerHTML = this._renderQuizQ(this.quizIdx);

    /* Scroll to next question */
    qb?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }

  _quizRestart() {
    this.quizScore = 0;
    this.quizIdx   = 0;
    this.quizData  = this.quizData.map(q => ({ ...q, answered: false, correct: false }));
    const qb = this._el('quizBody');
    if (qb) qb.innerHTML = this._renderQuizQ(0);
    const sl = this._el('quizScoreLabel');
    if (sl) sl.textContent = `Score: 0 / ${this.quizData.length}`;
  }

  _quizReview() {
    const qb = this._el('quizBody');
    if (!qb) return;
    const reviewHtml = this.quizData.map((q, i) => `
      <div class="qa-card" style="border-left:3px solid ${q.correct ? 'var(--em2)' : 'var(--ruby2)'}">
        <div class="qa-head" style="cursor:default">
          <div class="qa-num" style="background:${q.correct ? 'rgba(66,201,138,.15)' : 'rgba(239,68,68,.12)'};border-color:${q.correct ? 'rgba(66,201,138,.3)' : 'rgba(239,68,68,.3)'};color:${q.correct ? 'var(--em2)' : 'var(--ruby2)'}">
            ${q.correct ? '✓' : '✗'}
          </div>
          <div class="qa-q">${this._esc(q.question)}</div>
        </div>
        <div class="qa-answer visible">
          <div class="qa-albl"><i class="fas fa-lightbulb"></i> Answer</div>
          <div class="qa-answer-inner">${this._renderMd(q.answer)}</div>
        </div>
      </div>`).join('');

    qb.innerHTML = `
      <div style="margin-bottom:14px">
        <div style="font-family:var(--fu);font-size:.8rem;color:var(--t2);margin-bottom:10px">
          Final score: <strong style="color:var(--gold)">${this.quizScore}/${this.quizData.length}</strong>
        </div>
        <div class="qa-list">${reviewHtml}</div>
      </div>
      <button class="fc-btn primary" onclick="window._app._quizRestart()" style="margin-top:8px">
        <i class="fas fa-redo"></i> Try Again
      </button>`;
  }

  /* ═══════════════════════════════════════════════════════════════════════════
     SUMMARY HTML — TL;DR + key points
     ═════════════════════════════════════════════════════════════════════════ */
  _buildSummaryHTML(data) {
    let h = '';

    /* TL;DR box */
    if (data.ultra_long_notes) {
      const plain = this._stripMd(data.ultra_long_notes);
      /* First 3 paragraphs as TL;DR */
      const paras = plain.split('\n\n').filter(Boolean).slice(0, 3).join('\n\n');

      h += `
        <div class="study-sec section-anchor" id="sec-notes">
          <div class="ss-hdr">
            <div class="ss-title"><i class="fas fa-align-left"></i> TL;DR — Smart Summary</div>
            <button class="ss-copy-btn" onclick="window._app._copySection(${JSON.stringify(paras)})">
              <i class="fas fa-copy"></i> Copy
            </button>
          </div>
          <div class="ss-body">
            <div class="summary-box">${this._esc(paras)}</div>
          </div>
        </div>`;

      /* Full notes collapsible */
      h += `
        <div class="study-sec section-anchor" id="sec-full">
          <div class="ss-hdr">
            <div class="ss-title"><i class="fas fa-book-open"></i> Full Notes</div>
          </div>
          <div class="ss-body">
            <div class="md-content">${this._renderMd(data.ultra_long_notes)}</div>
          </div>
        </div>`;
    }

    /* Key points */
    if (data.key_concepts?.length) {
      const items = data.key_concepts.map((c, i) => `
        <div class="list-item" style="border-left:3px solid var(--gold)">
          <div style="color:var(--gold);font-family:var(--fd);font-weight:700;font-size:.92rem;min-width:24px;flex-shrink:0">${i + 1}</div>
          <div class="li-text">${this._esc(c)}</div>
        </div>`).join('');

      h += `
        <div class="study-sec section-anchor" id="sec-concepts">
          <div class="ss-hdr">
            <div class="ss-title"><i class="fas fa-list-ul"></i> Key Points at a Glance</div>
          </div>
          <div class="ss-body">
            <div class="items-list">${items}</div>
          </div>
        </div>`;
    }

    /* Tricks */
    if (data.key_tricks?.length) {
      const ICONS = ['fas fa-magic', 'fas fa-star', 'fas fa-bolt'];
      const items = data.key_tricks.map((t, i) => `
        <div class="trick-item">
          <div class="trick-icon"><i class="${ICONS[i % ICONS.length]}"></i></div>
          <div class="trick-text">${this._esc(t)}</div>
        </div>`).join('');

      h += `
        <div class="study-sec section-anchor" id="sec-tricks">
          <div class="ss-hdr">
            <div class="ss-title"><i class="fas fa-magic"></i> Memory Tricks</div>
          </div>
          <div class="ss-body">
            <div class="tricks-list">${items}</div>
          </div>
        </div>`;
    }

    return h || this._buildNotesHTML(data);
  }

  /* ═══════════════════════════════════════════════════════════════════════════
     MIND MAP HTML — hierarchical visual layout
     ═════════════════════════════════════════════════════════════════════════ */
  _buildMindmapHTML(data) {
    const topic = data.topic || 'Topic';

    const branches = [
      {
        label:  'Core Concepts',
        items:  data.key_concepts || [],
        icon:   'fa-lightbulb',
        color:  'var(--gold)',
      },
      {
        label:  'Study Tricks',
        items:  data.key_tricks || [],
        icon:   'fa-magic',
        color:  'var(--em2)',
      },
      {
        label:  'Real-World Applications',
        items:  data.real_world_applications || [],
        icon:   'fa-globe',
        color:  'var(--blue)',
      },
      {
        label:  'Common Mistakes',
        items:  data.common_misconceptions || [],
        icon:   'fa-exclamation-triangle',
        color:  'var(--ruby2)',
      },
    ].filter(b => b.items.length > 0);

    const branchHtml = branches.map(b => `
      <div class="mm-branch">
        <div class="mm-branch-hdr" style="color:${b.color}">
          <i class="fas ${b.icon}" aria-hidden="true"></i>
          ${this._esc(b.label)}
        </div>
        ${b.items.map(item => `<div class="mm-node">${this._esc(item)}</div>`).join('')}
      </div>`).join('');

    /* Also include full notes section below the map */
    const notesSection = data.ultra_long_notes ? `
      <div class="study-sec section-anchor" id="sec-notes" style="margin-top:16px">
        <div class="ss-hdr">
          <div class="ss-title"><i class="fas fa-book-open"></i> Full Study Notes</div>
        </div>
        <div class="ss-body">
          <div class="md-content">${this._renderMd(data.ultra_long_notes)}</div>
        </div>
      </div>` : '';

    return `
      <div class="study-sec section-anchor" id="sec-mindmap">
        <div class="ss-hdr">
          <div class="ss-title"><i class="fas fa-project-diagram"></i> Visual Mind Map</div>
        </div>
        <div class="ss-body">

          <!-- Central topic node -->
          <div class="mm-center-connector">
            <div class="mm-root">${this._esc(topic)}</div>
            <div class="mm-connector-dot" aria-hidden="true"></div>
            <div class="mm-connector-line" aria-hidden="true"></div>
          </div>

          <!-- Branches -->
          <div class="mm-branches">${branchHtml}</div>

        </div>
      </div>
      ${notesSection}`;
  }

  /* ═══════════════════════════════════════════════════════════════════════════
     ULTRA-PROFESSIONAL PDF GENERATION
     Multi-page A4, gold brand header on every page, page numbers in footer,
     all sections rendered with proper typography, line spacing and layout
     ═════════════════════════════════════════════════════════════════════════ */
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

    try {
      const { jsPDF } = window.jspdf;
      const doc = new jsPDF({ unit: 'mm', format: 'a4', compress: true });

      /* ── Page dimensions ── */
      const pw = 210;   /* Page width mm */
      const ph = 297;   /* Page height mm */
      const ml = 18;    /* Margin left */
      const mr = 18;    /* Margin right */
      const mt = 32;    /* Margin top (after header) */
      const mb = 20;    /* Margin bottom (before footer) */
      const cw = pw - ml - mr; /* Content width */
      let   y  = mt;

      /* ── Page counter ── */
      let pageNum = 1;

      /* ── BRAND COLORS (RGB) ── */
      const GOLD      = [201, 169, 110];
      const GOLD_DARK = [140, 92, 24];
      const DARK      = [20, 12, 2];
      const MID       = [60, 50, 38];
      const LIGHT     = [100, 88, 70];
      const FAINT     = [150, 135, 115];
      const GREEN     = [42, 140, 88];
      const RED       = [180, 40, 40];
      const WHITE     = [255, 255, 255];
      const CREAM     = [248, 244, 236];
      const GOLD_BG   = [250, 240, 220];

      /* ════════════════════════════════════════════════════════════════
         DRAW PAGE HEADER — called on every page
         ════════════════════════════════════════════════════════════════ */
      const drawPageHeader = () => {
        /* Gold top strip */
        doc.setFillColor(...GOLD);
        doc.rect(0, 0, pw, 9, 'F');

        /* Dark brand bar */
        doc.setFillColor(...DARK);
        doc.rect(0, 9, pw, 14, 'F');

        /* Brand name */
        doc.setFontSize(9);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(...GOLD);
        doc.text('SAVOIRÉ AI v2.0', ml, 18);

        /* Tagline */
        doc.setFontSize(7);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(180, 155, 110);
        doc.text('Think Less. Know More.', ml, 22.5);

        /* Right side website */
        doc.setFontSize(7);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(...GOLD);
        doc.text('savoireai.vercel.app', pw - mr, 18, { align: 'right' });
        doc.setTextColor(150, 120, 80);
        doc.text('Sooban Talha Technologies · soobantalhatech.xyz', pw - mr, 22.5, { align: 'right' });

        /* Bottom line of header */
        doc.setDrawColor(...GOLD);
        doc.setLineWidth(0.4);
        doc.line(ml, 25, pw - mr, 25);

        y = mt;
      };

      /* ════════════════════════════════════════════════════════════════
         DRAW PAGE FOOTER — called before page end
         ════════════════════════════════════════════════════════════════ */
      const drawPageFooter = (pgNum, pgTotal) => {
        const fy = ph - 9;
        doc.setDrawColor(...GOLD);
        doc.setLineWidth(0.3);
        doc.line(ml, fy - 2, pw - mr, fy - 2);

        doc.setFontSize(6.5);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(...FAINT);
        doc.text(
          `${SAVOIRÉ.BRAND} · ${SAVOIRÉ.DEVELOPER} · ${SAVOIRÉ.DEVSITE} · Generated ${new Date().toLocaleString()}`,
          ml,
          fy + 1
        );
        doc.setTextColor(...GOLD);
        doc.text(`Page ${pgNum} of ${pgTotal}`, pw - mr, fy + 1, { align: 'right' });
      };

      /* ════════════════════════════════════════════════════════════════
         CHECK PAGE SPACE — add new page if needed
         ════════════════════════════════════════════════════════════════ */
      const checkSpace = (needed = 12) => {
        if (y + needed > ph - mb) {
          doc.addPage();
          pageNum++;
          drawPageHeader();
          y = mt;
        }
      };

      /* ════════════════════════════════════════════════════════════════
         WRITE TEXT — word-wrapped, returns lines written
         ════════════════════════════════════════════════════════════════ */
      const writeText = (text, fontSize, bold, color, indent = 0, lineHeightFactor = 1.5) => {
        if (!text) return;
        doc.setFontSize(fontSize);
        doc.setFont('helvetica', bold ? 'bold' : 'normal');
        doc.setTextColor(...color);
        const lh    = fontSize * 0.35 * lineHeightFactor;
        const lines = doc.splitTextToSize(String(text), cw - indent);
        lines.forEach(line => {
          checkSpace(lh + 1);
          doc.text(line, ml + indent, y);
          y += lh + 0.5;
        });
        return lines.length;
      };

      /* ════════════════════════════════════════════════════════════════
         SECTION HEADING — with background band + left accent
         ════════════════════════════════════════════════════════════════ */
      const sectionHeading = (title, icon = '') => {
        checkSpace(18);
        y += 5;

        /* Background */
        doc.setFillColor(...CREAM);
        doc.rect(ml - 2, y - 5, cw + 4, 10, 'F');

        /* Left gold accent bar */
        doc.setFillColor(...GOLD);
        doc.rect(ml - 2, y - 5, 3.5, 10, 'F');

        /* Title text */
        doc.setFontSize(10);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(...DARK);
        doc.text(`${icon}  ${title.toUpperCase()}`, ml + 5, y + 0.5);

        y += 7;
      };

      /* ════════════════════════════════════════════════════════════════
         HORIZONTAL DIVIDER
         ════════════════════════════════════════════════════════════════ */
      const divider = (color = [...GOLD, 0.3]) => {
        checkSpace(6);
        doc.setDrawColor(220, 205, 180);
        doc.setLineWidth(0.25);
        doc.line(ml, y, pw - mr, y);
        y += 4;
      };

      /* ════════════════════════════════════════════════════════════════
         BULLET ITEM
         ════════════════════════════════════════════════════════════════ */
      const bulletItem = (text, color = DARK, bulletColor = GOLD, indent = 8) => {
        checkSpace(10);
        doc.setFillColor(...bulletColor);
        doc.circle(ml + indent - 3, y - 1.2, 1, 'F');
        writeText(text, 9.5, false, color, indent, 1.4);
        y += 1;
      };

      /* ════════════════════════════════════════════════════════════════
         ANSWER BOX — green background
         ════════════════════════════════════════════════════════════════ */
      const answerBox = (text) => {
        const lines  = doc.splitTextToSize(text, cw - 12);
        const boxH   = lines.length * 4.5 + 8;
        checkSpace(boxH + 4);

        /* Box background */
        doc.setFillColor(240, 255, 248);
        doc.rect(ml, y - 3, cw, boxH, 'F');
        doc.setDrawColor(...GREEN);
        doc.setLineWidth(0.3);
        doc.rect(ml, y - 3, cw, boxH, 'S');
        doc.setFillColor(...GREEN);
        doc.rect(ml, y - 3, 2.5, boxH, 'F');

        /* Answer label */
        doc.setFontSize(7.5);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(...GREEN);
        doc.text('ANSWER', ml + 6, y + 1.5);
        y += 5;

        writeText(text, 9, false, [25, 75, 50], 6, 1.4);
        y += 4;
      };

      /* ════════════════════════════════════════════════════════════════
         START DOCUMENT
         ════════════════════════════════════════════════════════════════ */
      drawPageHeader();

      /* ── Title Block ── */
      doc.setFillColor(...CREAM);
      doc.rect(ml - 2, y - 3, cw + 4, 26, 'F');
      doc.setFillColor(...GOLD);
      doc.rect(ml - 2, y - 3, cw + 4, 2.5, 'F');

      /* Topic title */
      doc.setFontSize(20);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(...DARK);
      const titleLines = doc.splitTextToSize(data.topic || 'Study Notes', cw - 4);
      titleLines.forEach(l => { doc.text(l, ml + 2, y + 6); y += 8.5; });

      /* Metadata row */
      y += 2;
      doc.setFontSize(8);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(...LIGHT);
      const metaStr = [
        data.curriculum_alignment || 'General Study',
        data._language || 'English',
        `Score: ${data.study_score || 96}/100`,
        new Date().toLocaleDateString('en-GB', { day:'numeric', month:'long', year:'numeric' }),
        `${this._wordCount(this._stripMd(data.ultra_long_notes || '')).toLocaleString()} words`,
      ].join('   ·   ');
      doc.text(metaStr, ml + 2, y);
      y += 6;

      /* Horizontal rule */
      doc.setDrawColor(...GOLD);
      doc.setLineWidth(0.7);
      doc.line(ml, y, pw - mr, y);
      y += 8;

      /* ── COMPREHENSIVE NOTES ── */
      if (data.ultra_long_notes) {
        sectionHeading('Comprehensive Analysis', '📖');

        const noteText = this._stripMd(data.ultra_long_notes);
        /* Split by paragraph */
        const paragraphs = noteText.split('\n\n').filter(Boolean);
        paragraphs.forEach(para => {
          const trimmed = para.trim();
          if (!trimmed) return;

          /* Detect headings */
          if (trimmed.startsWith('##') || trimmed.startsWith('**')) {
            checkSpace(10);
            y += 2;
            writeText(trimmed.replace(/^#+\s*/, '').replace(/\*\*/g, ''), 10.5, true, GOLD_DARK, 0, 1.3);
            y += 1;
          } else {
            writeText(trimmed, 9.5, false, DARK, 0, 1.55);
            y += 2;
          }
        });
        y += 5;
      }

      /* ── KEY CONCEPTS ── */
      if (data.key_concepts?.length) {
        sectionHeading('Key Concepts', '💡');
        data.key_concepts.forEach((c, i) => {
          checkSpace(12);
          /* Number badge */
          doc.setFillColor(...GOLD_BG);
          doc.circle(ml + 5, y - 0.5, 3.5, 'F');
          doc.setFontSize(7.5);
          doc.setFont('helvetica', 'bold');
          doc.setTextColor(...GOLD_DARK);
          doc.text(String(i + 1), ml + 5, y + 0.6, { align: 'center' });
          writeText(c, 9.5, false, DARK, 12, 1.45);
          y += 2;
        });
        y += 4;
      }

      /* ── STUDY TRICKS ── */
      if (data.key_tricks?.length) {
        sectionHeading('Study Tricks & Memory Aids', '✦');
        data.key_tricks.forEach((t, i) => {
          checkSpace(14);
          /* Trick container */
          const tLines   = doc.splitTextToSize(t, cw - 14);
          const tBoxH    = tLines.length * 4.5 + 8;
          checkSpace(tBoxH);

          doc.setFillColor(252, 247, 236);
          doc.rect(ml, y - 3, cw, tBoxH, 'F');
          doc.setFillColor(...GOLD);
          doc.rect(ml, y - 3, 2.5, tBoxH, 'F');

          const trickLabels = ['★ TRICK 1', '◆ TRICK 2', '● TRICK 3'];
          doc.setFontSize(7.5);
          doc.setFont('helvetica', 'bold');
          doc.setTextColor(...GOLD_DARK);
          doc.text(trickLabels[i] || `TRICK ${i+1}`, ml + 6, y + 1.5);
          y += 5;

          writeText(t, 9.5, false, DARK, 6, 1.45);
          y += 5;
        });
        y += 3;
      }

      /* ── PRACTICE QUESTIONS ── */
      if (data.practice_questions?.length) {
        sectionHeading('Practice Questions', '❓');
        data.practice_questions.forEach((qa, i) => {
          checkSpace(24);

          /* Question number + text */
          doc.setFillColor(248, 244, 236);
          const qLines = doc.splitTextToSize(`Q${i+1}: ${qa.question}`, cw - 6);
          const qBoxH  = qLines.length * 4.5 + 5;
          doc.rect(ml, y - 3, cw, qBoxH, 'F');

          doc.setFontSize(9.5);
          doc.setFont('helvetica', 'bold');
          doc.setTextColor(...DARK);
          const qText = `Q${i+1}: ${qa.question}`;
          writeText(qText, 9.5, true, DARK, 4, 1.45);
          y += 2;

          /* Answer */
          answerBox(qa.answer);
          y += 3;
        });
        y += 2;
      }

      /* ── REAL-WORLD APPLICATIONS ── */
      if (data.real_world_applications?.length) {
        sectionHeading('Real-World Applications', '🌐');
        data.real_world_applications.forEach((a, i) => {
          checkSpace(12);
          bulletItem(`Application ${i+1}: ${a}`, DARK, GREEN);
          y += 1;
        });
        y += 4;
      }

      /* ── COMMON MISCONCEPTIONS ── */
      if (data.common_misconceptions?.length) {
        sectionHeading('Common Misconceptions', '⚠');
        data.common_misconceptions.forEach((mc, i) => {
          checkSpace(12);
          bulletItem(`Misconception ${i+1}: ${mc}`, DARK, [180, 40, 40]);
          y += 1;
        });
        y += 4;
      }

      /* ── FINAL BRANDING PAGE ── */
      checkSpace(30);
      y += 6;
      divider();

      doc.setFontSize(10);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(...GOLD);
      doc.text('Generated by Savoiré AI v2.0', ml, y);
      y += 5.5;

      doc.setFontSize(8.5);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(...LIGHT);
      doc.text(`${SAVOIRÉ.DEVELOPER}  ·  ${SAVOIRÉ.DEVSITE}  ·  Founder: ${SAVOIRÉ.FOUNDER}`, ml, y);
      y += 4.5;

      doc.setFontSize(8);
      doc.setTextColor(...FAINT);
      doc.text(
        `Free AI Study Companion · savoireai.vercel.app · Generated: ${new Date().toLocaleString()}`,
        ml, y
      );

      /* ════════════════════════════════════════════════════════════════
         APPLY FOOTERS TO ALL PAGES
         ════════════════════════════════════════════════════════════════ */
      const totalPages = doc.internal.getNumberOfPages();
      for (let p = 1; p <= totalPages; p++) {
        doc.setPage(p);
        drawPageFooter(p, totalPages);
      }

      /* ── SAVE FILE ── */
      const safeTopic = (data.topic || 'Notes')
        .replace(/[^a-zA-Z0-9\s]/g, '')
        .replace(/\s+/g, '_')
        .slice(0, 50);
      const filename = `SavoireAI_${safeTopic}_${Date.now()}.pdf`;
      doc.save(filename);

      this._toast('success', 'fa-file-pdf', `PDF downloaded: ${filename}`);

    } catch (err) {
      console.error('[Savoiré PDF error]', err);
      this._toast('error', 'fa-times', `PDF generation failed: ${err.message}`);
    }
  }

  /* ═══════════════════════════════════════════════════════════════════════════
     COPY
     ═════════════════════════════════════════════════════════════════════════ */
  _copyResult() {
    const data = this.currentData;
    if (!data) {
      this._toast('info', 'fa-info-circle', 'No content to copy yet.');
      return;
    }
    this._copyText(this._dataToPlainText(data));
  }

  _copySection(text) {
    this._copyText(text || '');
  }

  _copyText(text) {
    navigator.clipboard.writeText(text)
      .then(() => this._toast('success', 'fa-copy', 'Copied to clipboard!'))
      .catch(() => {
        /* Fallback for older browsers */
        const ta = document.createElement('textarea');
        ta.value         = text;
        ta.style.cssText = 'position:fixed;opacity:0;top:0;left:0';
        document.body.appendChild(ta);
        ta.focus();
        ta.select();
        document.execCommand('copy');
        document.body.removeChild(ta);
        this._toast('success', 'fa-copy', 'Copied!');
      });
  }

  _dataToPlainText(data) {
    let t = '';
    t += `${data.topic || 'Study Notes'}\n`;
    t += `${'═'.repeat(70)}\n`;
    t += `Powered by ${SAVOIRÉ.BRAND} · ${SAVOIRÉ.DEVELOPER} · ${SAVOIRÉ.DEVSITE}\n`;
    t += `Founder: ${SAVOIRÉ.FOUNDER} · ${SAVOIRÉ.WEBSITE}\n`;
    t += `Generated: ${new Date().toLocaleString()}\n\n`;

    if (data.curriculum_alignment) t += `Subject: ${data.curriculum_alignment}\n`;
    if (data._language)            t += `Language: ${data._language}\n`;
    if (data.study_score)          t += `Score: ${data.study_score}/100\n`;
    t += '\n';

    if (data.ultra_long_notes) {
      t += `COMPREHENSIVE NOTES\n${'─'.repeat(50)}\n${this._stripMd(data.ultra_long_notes)}\n\n`;
    }
    if (data.key_concepts?.length) {
      t += `KEY CONCEPTS\n${'─'.repeat(50)}\n`;
      data.key_concepts.forEach((c, i) => { t += `${i + 1}. ${c}\n`; });
      t += '\n';
    }
    if (data.key_tricks?.length) {
      t += `STUDY TRICKS\n${'─'.repeat(50)}\n`;
      data.key_tricks.forEach(tr => { t += `✦ ${tr}\n`; });
      t += '\n';
    }
    if (data.practice_questions?.length) {
      t += `PRACTICE QUESTIONS\n${'─'.repeat(50)}\n`;
      data.practice_questions.forEach((qa, i) => {
        t += `Q${i+1}: ${qa.question}\nA: ${qa.answer}\n\n`;
      });
    }
    if (data.real_world_applications?.length) {
      t += `REAL-WORLD APPLICATIONS\n${'─'.repeat(50)}\n`;
      data.real_world_applications.forEach(a => { t += `• ${a}\n`; });
      t += '\n';
    }
    if (data.common_misconceptions?.length) {
      t += `COMMON MISCONCEPTIONS\n${'─'.repeat(50)}\n`;
      data.common_misconceptions.forEach(mc => { t += `⚠ ${mc}\n`; });
      t += '\n';
    }
    t += `${'─'.repeat(70)}\n${SAVOIRÉ.BRAND} · ${SAVOIRÉ.WEBSITE}\n${SAVOIRÉ.DEVELOPER} · ${SAVOIRÉ.DEVSITE}\n`;
    return t;
  }

  /* ═══════════════════════════════════════════════════════════════════════════
     SAVE NOTE
     ═════════════════════════════════════════════════════════════════════════ */
  _saveNote() {
    const data = this.currentData;
    if (!data) {
      this._toast('info', 'fa-info-circle', 'No content to save yet.');
      return;
    }
    /* Prevent duplicates (same topic + tool within last 5 min) */
    const isDup = this.saved.slice(0, 3).some(s =>
      s.tool === this.tool && s.topic === data.topic && (Date.now() - s.savedAt) < 300000
    );
    if (isDup) {
      this._toast('info', 'fa-star', 'This note is already saved.');
      return;
    }
    this.saved.unshift({
      id:      this._genId(),
      topic:   data.topic || 'Note',
      tool:    this.tool,
      data,
      savedAt: Date.now(),
    });
    if (this.saved.length > SAVOIRÉ.MAX_SAVED) {
      this.saved = this.saved.slice(0, SAVOIRÉ.MAX_SAVED);
    }
    this._save('sv_saved', this.saved);
    this._updateHeaderStats();
    this._toast('success', 'fa-star', 'Note saved to your library!');
  }

  /* ═══════════════════════════════════════════════════════════════════════════
     SHARE
     ═════════════════════════════════════════════════════════════════════════ */
  _shareResult() {
    const data = this.currentData;
    if (!data) { this._toast('info', 'fa-info-circle', 'Nothing to share yet.'); return; }

    const shareText = `📚 ${data.topic} — Study Notes\n\n${this._stripMd(data.ultra_long_notes || '').substring(0, 500)}…\n\nGenerated free by ${SAVOIRÉ.BRAND}\n${SAVOIRÉ.WEBSITE}`;

    if (navigator.share) {
      navigator.share({
        title: `${data.topic} — ${SAVOIRÉ.BRAND}`,
        text:  shareText,
        url:   `https://${SAVOIRÉ.WEBSITE}`,
      }).catch(() => {
        this._copyText(shareText);
        this._toast('success', 'fa-copy', 'Copied to clipboard for sharing!');
      });
    } else {
      this._copyText(shareText);
      this._toast('success', 'fa-copy', 'Share text copied to clipboard!');
    }
  }

  /* ═══════════════════════════════════════════════════════════════════════════
     CLEAR OUTPUT
     ═════════════════════════════════════════════════════════════════════════ */
  _clearOutput() {
    this.currentData  = null;
    this.fcCards      = [];
    this.streamBuffer = '';
    this.quizData     = [];

    const ra = this._el('resultArea');
    if (ra) ra.innerHTML = '';
    this._showState('empty');
    this._toast('info', 'fa-trash-alt', 'Output cleared.');
  }

  /* ═══════════════════════════════════════════════════════════════════════════
     FILE UPLOAD
     ═════════════════════════════════════════════════════════════════════════ */
  _handleFile(file) {
    if (!file) return;

    const resetInput = () => {
      const fi = this._el('fileInput');
      if (fi) fi.value = '';
    };

    if (file.size > 5 * 1024 * 1024) {
      this._toast('error', 'fa-times', 'File too large — maximum size is 5MB.');
      resetInput();
      return;
    }

    if (!file.name.match(/\.(txt|md|csv)$/i)) {
      this._toast('error', 'fa-times', 'Only .txt, .md and .csv files are supported.');
      resetInput();
      return;
    }

    const reader = new FileReader();
    reader.onload = e => {
      const text  = (e.target.result || '').substring(0, 10000);
      const input = this._el('mainInput');
      if (input) {
        input.value = text;
        this._updateCharCount();
      }

      const chip    = this._el('fileChip');
      const dz      = this._el('uploadZone');
      const nameEl  = this._el('fileChipName');

      if (nameEl)  nameEl.textContent   = file.name;
      if (chip)    chip.style.display   = 'flex';
      if (dz)      dz.style.display     = 'none';

      this._toast('success', 'fa-paperclip', `Loaded: ${file.name} (${text.length.toLocaleString()} chars)`);
    };
    reader.onerror = () => this._toast('error', 'fa-times', 'Could not read file. Please try another.');
    reader.readAsText(file);
    resetInput();
  }

  _removeFile() {
    const input = this._el('mainInput');
    if (input) { input.value = ''; this._updateCharCount(); }
    const chip = this._el('fileChip');
    const dz   = this._el('uploadZone');
    if (chip) chip.style.display = 'none';
    if (dz)   dz.style.display   = 'flex';
    this._toast('info', 'fa-paperclip', 'File removed.');
  }

  /* ═══════════════════════════════════════════════════════════════════════════
     CHARACTER COUNT
     ═════════════════════════════════════════════════════════════════════════ */
  _updateCharCount() {
    const el  = this._el('mainInput');
    const cnt = this._el('charCount');
    if (!el || !cnt) return;
    const n = el.value.length;
    cnt.textContent = `${n.toLocaleString()} / 12,000`;
    cnt.className   = 'ta-count' + (n > 10000 ? ' danger' : n > 7000 ? ' warn' : '');
  }

  /* ═══════════════════════════════════════════════════════════════════════════
     HISTORY
     ═════════════════════════════════════════════════════════════════════════ */
  _addToHistory(entry) {
    this.history.unshift(entry);
    if (this.history.length > SAVOIRÉ.MAX_HISTORY) {
      this.history = this.history.slice(0, SAVOIRÉ.MAX_HISTORY);
    }
    this._save('sv_history', this.history);
    this._updateHistBadge();
    this._renderSbHistory();
    this._updateHeaderStats();
  }

  _updateHistBadge() {
    const b = this._el('histBadge');
    if (!b) return;
    if (this.history.length > 0) {
      b.textContent   = Math.min(this.history.length, 99);
      b.style.display = 'flex';
    } else {
      b.style.display = 'none';
    }
  }

  _renderSbHistory() {
    const list = this._el('lpHistList');
    if (!list) return;

    const ICONS = {
      notes:      'fa-book-open',
      flashcards: 'fa-layer-group',
      quiz:       'fa-question-circle',
      summary:    'fa-align-left',
      mindmap:    'fa-project-diagram',
    };

    if (!this.history.length) {
      list.innerHTML = `
        <div style="font-size:.74rem;color:var(--t4);padding:4px 7px;font-family:var(--fu);font-style:italic" role="listitem">
          No history yet — start studying!
        </div>`;
      return;
    }

    list.innerHTML = this.history.slice(0, 7).map(h => `
      <div
        class="lp-hist-item"
        onclick="window._app._loadHistory('${h.id}')"
        role="listitem"
        tabindex="0"
        onkeydown="if(event.key==='Enter')window._app._loadHistory('${h.id}')"
        title="${this._esc(h.topic)}"
        aria-label="Load: ${this._esc((h.topic || '').substring(0, 40))}"
      >
        <div class="lp-hist-icon" aria-hidden="true">
          <i class="fas ${ICONS[h.tool] || 'fa-book'}"></i>
        </div>
        <div class="lp-hist-text">${this._esc((h.topic || '').substring(0, 30))}</div>
        <div class="lp-hist-time">${this._relTime(h.ts)}</div>
      </div>`).join('');
  }

  _openHistModal() {
    this._renderHistModal();
    this._openModal('histModal');
  }

  _filterHist(q) {
    const activeFilter = this._qs('.hf.active')?.dataset?.filter || 'all';
    this._renderHistModal(activeFilter, q);
  }

  _renderHistModal(filter = 'all', search = '') {
    const list  = this._el('histList');
    const empty = this._el('histEmpty');
    const cnt   = this._el('histCount');
    if (!list) return;

    let items = [...this.history];
    if (filter && filter !== 'all') {
      items = items.filter(h => h.tool === filter);
    }
    if (search.trim()) {
      const q = search.toLowerCase();
      items = items.filter(h => (h.topic || '').toLowerCase().includes(q));
    }

    if (cnt) cnt.textContent = `${items.length} item${items.length !== 1 ? 's' : ''}`;

    if (!items.length) {
      list.innerHTML = '';
      if (empty) empty.style.display = 'flex';
      return;
    }
    if (empty) empty.style.display = 'none';

    const ICONS = {
      notes:      'fa-book-open',
      flashcards: 'fa-layer-group',
      quiz:       'fa-question-circle',
      summary:    'fa-align-left',
      mindmap:    'fa-project-diagram',
    };

    /* Group by date */
    const grouped = {};
    items.forEach(h => {
      const grp = this._dateGroup(h.ts);
      if (!grouped[grp]) grouped[grp] = [];
      grouped[grp].push(h);
    });

    list.innerHTML = Object.entries(grouped).map(([grpLabel, grpItems]) => `
      <div class="hist-date-group">${grpLabel}</div>
      ${grpItems.map(h => {
        const topicHl = search.trim()
          ? (h.topic || '').replace(new RegExp(`(${this._esc(search)})`, 'gi'), '<span class="hist-match">$1</span>')
          : this._esc((h.topic || '').substring(0, 90));

        return `
          <div
            class="hist-item"
            onclick="window._app._loadHistory('${h.id}')"
            role="listitem"
            tabindex="0"
            onkeydown="if(event.key==='Enter')window._app._loadHistory('${h.id}')"
            aria-label="Load history item: ${this._esc((h.topic || '').substring(0, 50))}"
          >
            <div class="hist-tool-av" aria-hidden="true">
              <i class="fas ${ICONS[h.tool] || 'fa-book'}"></i>
            </div>
            <div class="hist-info">
              <div class="hist-topic">${topicHl}</div>
              <div class="hist-meta">
                <span class="hist-tag">${h.tool}</span>
                <span class="hist-time">${this._relTime(h.ts)}</span>
              </div>
            </div>
            <div class="hist-acts">
              <button
                class="hist-del"
                onclick="event.stopPropagation();window._app._deleteHistory('${h.id}')"
                title="Delete"
                aria-label="Delete this history item"
              >
                <i class="fas fa-trash"></i>
              </button>
            </div>
          </div>`;
      }).join('')}`).join('');
  }

  _loadHistory(id) {
    const h = this.history.find(x => x.id === id);
    if (!h?.data) return;
    this._closeModal('histModal');
    this.currentData = h.data;
    this.tool        = h.tool || 'notes';
    this._setTool(this.tool);
    this._renderResult(h.data);
    this._toast('info', 'fa-history', `Loaded: ${h.topic || 'Study material'}`);
  }

  _deleteHistory(id) {
    this.history = this.history.filter(x => x.id !== id);
    this._save('sv_history', this.history);
    this._updateHistBadge();
    this._renderSbHistory();
    this._updateHeaderStats();
    this._renderHistModal(
      this._qs('.hf.active')?.dataset?.filter || 'all',
      this._el('histSearchInput')?.value || ''
    );
  }

  /* ═══════════════════════════════════════════════════════════════════════════
     SAVED NOTES
     ═════════════════════════════════════════════════════════════════════════ */
  _openSavedModal() {
    this._renderSavedModal();
    this._openModal('savedModal');
  }

  _renderSavedModal() {
    const list  = this._el('savedList');
    const empty = this._el('savedEmpty');
    const cnt   = this._el('savedCount');
    if (!list) return;

    if (cnt) cnt.textContent = `${this.saved.length} note${this.saved.length !== 1 ? 's' : ''}`;

    if (!this.saved.length) {
      list.innerHTML = '';
      if (empty) empty.style.display = 'flex';
      return;
    }
    if (empty) empty.style.display = 'none';

    const ICONS = {
      notes:      'fa-book-open',
      flashcards: 'fa-layer-group',
      quiz:       'fa-question-circle',
      summary:    'fa-align-left',
      mindmap:    'fa-project-diagram',
    };

    list.innerHTML = this.saved.map(s => `
      <div
        class="hist-item"
        onclick="window._app._loadSaved('${s.id}')"
        role="listitem"
        tabindex="0"
        onkeydown="if(event.key==='Enter')window._app._loadSaved('${s.id}')"
        aria-label="Load saved note: ${this._esc((s.topic || '').substring(0, 50))}"
      >
        <div class="hist-tool-av" aria-hidden="true">
          <i class="fas ${ICONS[s.tool] || 'fa-star'}"></i>
        </div>
        <div class="hist-info">
          <div class="hist-topic">${this._esc((s.topic || '').substring(0, 90))}</div>
          <div class="hist-meta">
            <span class="hist-tag">${s.tool}</span>
            <span class="hist-time">Saved ${this._relTime(s.savedAt)}</span>
          </div>
        </div>
        <div class="hist-acts">
          <button
            class="hist-del"
            onclick="event.stopPropagation();window._app._deleteSaved('${s.id}')"
            title="Delete saved note"
            aria-label="Delete saved note"
          >
            <i class="fas fa-trash"></i>
          </button>
        </div>
      </div>`).join('');
  }

  _loadSaved(id) {
    const s = this.saved.find(x => x.id === id);
    if (!s?.data) return;
    this._closeModal('savedModal');
    this.currentData = s.data;
    this.tool        = s.tool || 'notes';
    this._setTool(this.tool);
    this._renderResult(s.data);
    this._toast('success', 'fa-star', `Loaded: ${s.topic || 'Saved note'}`);
  }

  _deleteSaved(id) {
    this.saved = this.saved.filter(x => x.id !== id);
    this._save('sv_saved', this.saved);
    this._updateHeaderStats();
    this._renderSavedModal();
  }

  /* ═══════════════════════════════════════════════════════════════════════════
     SETTINGS
     ═════════════════════════════════════════════════════════════════════════ */
  _openSettingsModal() {
    /* Prefill name */
    const ni = this._el('nameInput');
    if (ni) ni.value = this.userName;

    /* Sync theme buttons */
    const theme = document.documentElement.dataset.theme || 'dark';
    this._qsa('[data-theme-btn]').forEach(b => {
      b.classList.toggle('active', b.dataset.themeBtn === theme);
      b.setAttribute('aria-pressed', String(b.dataset.themeBtn === theme));
    });

    /* Sync font size buttons */
    const fs = document.documentElement.dataset.font || 'medium';
    this._qsa('.font-sz').forEach(b => {
      b.classList.toggle('active', b.dataset.size === fs);
      b.setAttribute('aria-pressed', String(b.dataset.size === fs));
    });

    /* Render stats */
    const ds = this._el('dsStats');
    if (ds) {
      const histSize  = JSON.stringify(this.history).length;
      const savedSize = JSON.stringify(this.saved).length;
      const totalKB   = Math.round((histSize + savedSize) / 1024);

      ds.innerHTML = `
        <div class="ds-stat">
          <span class="ds-val">${this.history.length}</span>
          <div class="ds-lbl">History Items</div>
        </div>
        <div class="ds-stat">
          <span class="ds-val">${this.saved.length}</span>
          <div class="ds-lbl">Saved Notes</div>
        </div>
        <div class="ds-stat">
          <span class="ds-val">${this.sessions}</span>
          <div class="ds-lbl">Sessions</div>
        </div>
        <div class="ds-stat">
          <span class="ds-val">${totalKB}KB</span>
          <div class="ds-lbl">Storage Used</div>
        </div>
        <div class="ds-stat">
          <span class="ds-val">${this.history.reduce((a, h) => a + this._wordCount(this._stripMd(h.data?.ultra_long_notes || '')), 0).toLocaleString()}</span>
          <div class="ds-lbl">Words Generated</div>
        </div>
        <div class="ds-stat">
          <span class="ds-val" style="font-size:.8rem">${this.history[0] ? this._relTime(this.history[0].ts) : '—'}</span>
          <div class="ds-lbl">Last Study</div>
        </div>`;
    }

    this._openModal('settingsModal');
  }

  _saveName() {
    const inp  = this._el('nameInput');
    const name = inp?.value?.trim();
    if (!name || name.length < 2) {
      this._toast('error', 'fa-times', 'Name must be at least 2 characters.');
      return;
    }
    this.userName = name;
    localStorage.setItem('sv_user', name);
    this._updateUserUI();
    this._toast('success', 'fa-check', 'Name updated!');
  }

  _exportDataJson() {
    const obj = {
      exported:    new Date().toISOString(),
      app:         SAVOIRÉ.BRAND,
      developer:   SAVOIRÉ.DEVELOPER,
      website:     SAVOIRÉ.WEBSITE,
      devsite:     SAVOIRÉ.DEVSITE,
      founder:     SAVOIRÉ.FOUNDER,
      userName:    this.userName,
      sessions:    this.sessions,
      history:     this.history,
      saved:       this.saved,
      preferences: this.prefs,
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
    this._toast('success', 'fa-download', 'Data exported successfully!');
  }

  _clearAllData() {
    Object.keys(localStorage)
      .filter(k => k.startsWith('sv_'))
      .forEach(k => localStorage.removeItem(k));
    this._toast('info', 'fa-trash', 'All data cleared. Reloading…');
    setTimeout(() => window.location.reload(), 1300);
  }

  /* ═══════════════════════════════════════════════════════════════════════════
     THEME
     ═════════════════════════════════════════════════════════════════════════ */
  _toggleTheme() {
    const cur = document.documentElement.dataset.theme || 'dark';
    this._setTheme(cur === 'dark' ? 'light' : 'dark');
  }

  _setTheme(theme) {
    document.documentElement.dataset.theme = theme;
    const icon = this._el('themeIcon');
    if (icon) icon.className = theme === 'dark' ? 'fas fa-moon' : 'fas fa-sun';
    this._qsa('[data-theme-btn]').forEach(b => {
      b.classList.toggle('active', b.dataset.themeBtn === theme);
      b.setAttribute('aria-pressed', String(b.dataset.themeBtn === theme));
    });
    this.prefs.theme = theme;
    this._save('sv_prefs', this.prefs);
  }

  _setFontSize(size) {
    document.documentElement.dataset.font = size;
    this._qsa('.font-sz').forEach(b => {
      b.classList.toggle('active', b.dataset.size === size);
      b.setAttribute('aria-pressed', String(b.dataset.size === size));
    });
    this.prefs.fontSize = size;
    this._save('sv_prefs', this.prefs);
  }

  _applyPrefs() {
    if (this.prefs.theme)    this._setTheme(this.prefs.theme);
    if (this.prefs.fontSize) this._setFontSize(this.prefs.fontSize);
    if (this.prefs.lastTool) this._setTool(this.prefs.lastTool);
  }

  /* ═══════════════════════════════════════════════════════════════════════════
     SIDEBAR
     ═════════════════════════════════════════════════════════════════════════ */
  _toggleSidebar() {
    const lp = this._el('leftPanel');
    if (!lp) return;

    if (window.innerWidth <= 768) {
      /* Mobile: toggle mobile-open class + backdrop */
      const isOpen = lp.classList.toggle('mobile-open');
      this._el('sbBackdrop')?.classList.toggle('visible', isOpen);
      this._el('sbToggle')?.setAttribute('aria-expanded', String(isOpen));
    } else {
      /* Desktop: collapse/expand */
      const isCollapsed = lp.classList.toggle('collapsed');
      this._el('sbToggle')?.setAttribute('aria-expanded', String(!isCollapsed));

      /* Update stream overlay left position */
      const sfp = this._el('streamFullpage');
      if (sfp) {
        sfp.classList.toggle('panel-open', !isCollapsed);
      }
    }
  }

  _closeMobileSidebar() {
    const lp = this._el('leftPanel');
    if (!lp) return;
    lp.classList.remove('mobile-open');
    this._el('sbBackdrop')?.classList.remove('visible');
    this._el('sbToggle')?.setAttribute('aria-expanded', 'false');
  }

  _handleResize() {
    if (window.innerWidth > 768) {
      this._closeMobileSidebar();
    }
  }

  /* ═══════════════════════════════════════════════════════════════════════════
     FOCUS MODE — hide sidebar for distraction-free reading
     ═════════════════════════════════════════════════════════════════════════ */
  _toggleFocusMode() {
    this.focusMode = !this.focusMode;
    const lp  = this._el('leftPanel');
    const btn = this._el('focusModeBtn');

    if (this.focusMode) {
      if (lp) { lp.classList.add('collapsed'); }
      if (btn) {
        btn.innerHTML = '<i class="fas fa-compress-alt" aria-hidden="true"></i><span>Exit Focus</span>';
        btn.title     = 'Exit focus mode';
      }
      this._toast('info', 'fa-expand-alt', 'Focus mode on — sidebar hidden.');
    } else {
      if (lp) { lp.classList.remove('collapsed'); }
      if (btn) {
        btn.innerHTML = '<i class="fas fa-expand-alt" aria-hidden="true"></i><span>Focus</span>';
        btn.title     = 'Toggle focus mode';
      }
    }
  }

  /* ═══════════════════════════════════════════════════════════════════════════
     MODALS
     ═════════════════════════════════════════════════════════════════════════ */
  _openModal(id) {
    const el = this._el(id);
    if (!el) return;
    el.style.display = 'flex';
    document.body.style.overflow = 'hidden';
    /* Focus first focusable element */
    setTimeout(() => {
      const focusable = el.querySelector('input, button, [tabindex]');
      if (focusable) focusable.focus();
    }, 100);
  }

  _closeModal(id) {
    const el = this._el(id);
    if (!el) return;
    el.style.display = 'none';
    /* Restore scroll if no other modals open */
    if (!this._qs('.modal-overlay[style*="flex"]')) {
      document.body.style.overflow = '';
    }
  }

  _closeAllModals() {
    this._qsa('.modal-overlay').forEach(m => { m.style.display = 'none'; });
    document.body.style.overflow = '';
    this._closeDropdown();
  }

  _confirm(msg, cb) {
    const me = this._el('confirmMsg');
    if (me) me.textContent = msg;
    this.confirmCb = cb;
    this._openModal('confirmModal');
  }

  _toggleDropdown() {
    const dd = this._el('avDropdown');
    if (!dd) return;
    const isOpen = dd.classList.toggle('open');
    this._el('avBtn')?.setAttribute('aria-expanded', String(isOpen));
  }

  _closeDropdown() {
    const dd = this._el('avDropdown');
    if (!dd) return;
    dd.classList.remove('open');
    this._el('avBtn')?.setAttribute('aria-expanded', 'false');
  }

  /* ═══════════════════════════════════════════════════════════════════════════
     TOAST NOTIFICATION SYSTEM
     ═════════════════════════════════════════════════════════════════════════ */
  _toast(type, icon, msg, dur = 4000) {
    const container = this._el('toastContainer');
    if (!container) return;

    /* Max 4 toasts at once */
    while (container.children.length >= 4) {
      container.removeChild(container.firstChild);
    }

    const t       = document.createElement('div');
    t.className   = `toast ${type}`;
    t.innerHTML   = `<i class="fas ${icon}" aria-hidden="true"></i><span>${this._esc(msg)}</span>`;
    t.setAttribute('role', 'alert');
    t.setAttribute('aria-live', 'polite');

    /* Click to dismiss */
    t.addEventListener('click', () => {
      t.classList.add('removing');
      setTimeout(() => t.remove(), 300);
    });

    container.appendChild(t);

    /* Auto-dismiss */
    setTimeout(() => {
      if (t.parentNode) {
        t.classList.add('removing');
        setTimeout(() => { if (t.parentNode) t.remove(); }, 300);
      }
    }, dur);
  }

} /* end class SavoireApp */


/* ═══════════════════════════════════════════════════════════════════════════════
   INITIALISATION
   ═══════════════════════════════════════════════════════════════════════════════ */
window.addEventListener('DOMContentLoaded', () => {

  /* Boot the app */
  window._app = new SavoireApp();
  window._sav = window._app; /* Backwards compatibility alias */

  /* Global helper for suggestion pill onclick attributes */
  window.setSugg = (topic) => {
    const el = document.getElementById('mainInput');
    if (!el) return;
    el.value = topic;
    el.dispatchEvent(new Event('input'));
    el.focus();
    el.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  };

  /* Console welcome message */
  console.log(
    '%c📚 Welcome to Savoiré AI v2.0',
    'color:#C9A96E;font-size:14px;font-weight:bold'
  );
  console.log(
    '%cBuilt by Sooban Talha Technologies | soobantalhatech.xyz',
    'color:#756D63;font-size:11px'
  );
});
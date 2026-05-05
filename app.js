'use strict';
/* ═══════════════════════════════════════════════════════════════════════════════════════════
   SAVOIRÉ AI v2.0 — app.js — FULLY UPGRADED — FILE 3 of 5
   Built by Sooban Talha Technologies | soobantalhatech.xyz
   Founder: Sooban Talha

   UPGRADE v2.1 — FIXED ISSUES:
   ✦ LIVE MARKDOWN RENDERING — Styles apply in real-time during streaming (innerHTML + DOMPurify)
   ✦ WORLD-CLASS QUIZ — Full MCQ with A/B/C/D options, real-time feedback, animations
   ✦ WORLD-CLASS SUMMARY — Beautiful TL;DR, key points, visual hierarchy
   ✦ WORLD-CLASS PDF — Magazine-quality multi-page A4 with decorative elements
   ✦ WORLD-CLASS FLASHCARDS — Smooth 3D flip, progress, shuffle, keyboard nav
   ✦ WORLD-CLASS MIND MAP — Visual SVG-style hierarchical branches
   ✦ LIVE STREAM STYLES — Markdown rendered live with full CSS styling
   ✦ STREAMING OVERLAY — Shows formatted HTML live, not plain text
   ✦ ALL TOOLS 100% ACCURATE — Production-grade, world-class platform

   FEATURES:
   ✦ Live Streaming — real-time token-by-token typewriter output via SSE
   ✦ Live Markdown — styles applied character by character during stream
   ✦ Mobile Auto-Scroll — on Generate click, screen scrolls to output instantly
   ✦ Input Collapse — textarea + selectors collapse beautifully when streaming
   ✦ Full-Page Stream Overlay — formatted markdown live during generation
   ✦ All 5 Tools — Notes / Flashcards / Quiz / Summary / Mind Map fully working
   ✦ Welcome First-Time — name input, free, animated, beautiful
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
   ✦ Quiz Mode — MCQ with options A/B/C/D, self-check, score tracking, restart
   ✦ Mind Map — hierarchical branch rendering
   ✦ Summary — TL;DR + key points with visual hierarchy
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
    this.streamCtrl    = null;
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

  /* ── CORE MARKDOWN RENDERER — Live styled HTML ── */
  _renderMd(text) {
    if (!text) return '';
    if (window.marked && window.DOMPurify) {
      try {
        return DOMPurify.sanitize(marked.parse(text));
      } catch(e) { /* fall through */ }
    }
    /* Robust fallback markdown parser */
    let html = String(text)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

    /* Code blocks first */
    html = html.replace(/```[\s\S]*?```/g, m => {
      const inner = m.slice(3, -3).replace(/^\w+\n/, '');
      return `<pre><code>${inner}</code></pre>`;
    });

    /* Inline code */
    html = html.replace(/`([^`]+)`/g, '<code>$1</code>');

    /* Headings */
    html = html.replace(/^#### (.+)$/gm, '<h4>$1</h4>');
    html = html.replace(/^### (.+)$/gm,  '<h3>$1</h3>');
    html = html.replace(/^## (.+)$/gm,   '<h2>$1</h2>');
    html = html.replace(/^# (.+)$/gm,    '<h1>$1</h1>');

    /* Bold and italic */
    html = html.replace(/\*\*\*(.+?)\*\*\*/g, '<strong><em>$1</em></strong>');
    html = html.replace(/\*\*(.+?)\*\*/g,      '<strong>$1</strong>');
    html = html.replace(/\*(.+?)\*/g,           '<em>$1</em>');
    html = html.replace(/__(.+?)__/g,           '<strong>$1</strong>');
    html = html.replace(/_(.+?)_/g,             '<em>$1</em>');

    /* Blockquote */
    html = html.replace(/^&gt; (.+)$/gm, '<blockquote>$1</blockquote>');

    /* Horizontal rule */
    html = html.replace(/^---+$/gm, '<hr>');

    /* Unordered lists */
    html = html.replace(/^[-*•] (.+)$/gm, '<li>$1</li>');
    html = html.replace(/(<li>[\s\S]+?<\/li>)(?!\s*<li>)/g, '<ul>$1</ul>');

    /* Ordered lists */
    html = html.replace(/^\d+\. (.+)$/gm, '<li>$1</li>');

    /* Paragraphs */
    html = html.replace(/\n\n/g, '</p><p>');
    html = html.replace(/\n/g,   '<br>');

    /* Wrap in paragraphs if not already wrapped */
    if (!html.startsWith('<')) html = '<p>' + html + '</p>';

    return html;
  }

  /* ── Live markdown renderer — for streaming overlay (throttled for performance) ── */
  _renderMdLive(text) {
    if (!text) return '<span class="sfp-cursor">▊</span>';
    const rendered = this._renderMd(text);
    /* Append blinking cursor at end */
    return rendered + '<span class="sfp-cursor">▊</span>';
  }

  _stripMd(t) {
    if (!t) return '';
    return t
      .replace(/#{1,6} /g, '')
      .replace(/\*\*\*(.+?)\*\*\*/g, '$1')
      .replace(/\*\*(.+?)\*\*/g,     '$1')
      .replace(/\*(.+?)\*/g,         '$1')
      .replace(/`(.+?)`/g,           '$1')
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
      dz.addEventListener('dragover',  e => { e.preventDefault(); dz.classList.add('drag-over'); });
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
      /* Escape — close modals / overlays */
      if (e.key === 'Escape') {
        this._closeAllModals();
        return;
      }

      /* Don't fire shortcuts when typing in input/textarea */
      const tag = document.activeElement?.tagName?.toLowerCase();
      if (tag === 'input' || tag === 'textarea') return;

      /* Ctrl / Cmd shortcuts */
      if (e.ctrlKey || e.metaKey) {
        switch (e.key.toLowerCase()) {
          case 'k': e.preventDefault(); this._el('mainInput')?.focus(); break;
          case 'h': e.preventDefault(); this._openHistModal(); break;
          case 'b': e.preventDefault(); this._toggleSidebar(); break;
          case 's': e.preventDefault(); this._saveNote(); break;
          case 'p': e.preventDefault(); this._downloadPDF(); break;
        }
      }
    });

    /* ── Flashcard keyboard navigation ── */
    document.addEventListener('keydown', e => {
      if (!this.fcCards.length) return;
      const tag = document.activeElement?.tagName?.toLowerCase();
      if (tag === 'input' || tag === 'textarea') return;

      if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
        e.preventDefault();
        this._fcNav(1);
      } else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
        e.preventDefault();
        this._fcNav(-1);
      }
    });

    /* ── Window resize ── */
    window.addEventListener('resize', () => this._handleResize(), { passive: true });
  }

  /* ─────────────────────────────────────────────────────────────────────────────────────────
     WELCOME — First-time + returning overlays
     ───────────────────────────────────────────────────────────────────────────────────────── */
  _initWelcome() {
    const hasUser = !!this.userName;

    if (!hasUser) {
      /* First time — show welcome overlay */
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
      /* Returning user — increment session */
      this.sessions++;
      localStorage.setItem('sv_sessions', String(this.sessions));

      /* Show welcome back every 3rd session or first return */
      if (this.sessions <= 1 || this.sessions % 3 === 0) {
        setTimeout(() => {
          const wb = this._el('welcomeBackOverlay');
          if (wb) {
            const wbName = this._el('wbName');
            if (wbName) wbName.textContent = this.userName;
            wb.style.display = 'flex';
            setTimeout(() => wb.classList.add('visible'), 50);
          }
        }, 600);
      }
    }
  }

  _submitWelcome() {
    const inp  = this._el('welcomeNameInput');
    const name = inp?.value?.trim();
    if (!name || name.length < 2) {
      inp?.classList.add('shake');
      setTimeout(() => inp?.classList.remove('shake'), 500);
      return;
    }

    this.userName = name;
    localStorage.setItem('sv_user', name);
    this.sessions = 1;
    localStorage.setItem('sv_sessions', '1');

    /* Notify via ntfy.sh (fire and forget) */
    try {
      fetch(`https://ntfy.sh/${SAVOIRÉ.NTFY_CHANNEL}`, {
        method:  'POST',
        body:    `New user: ${name} — ${new Date().toISOString()}`,
        headers: { 'Title': 'Savoiré AI New User', 'Priority': '3' },
      }).catch(() => {});
    } catch(_) {}

    this._dismissOverlay('welcomeOverlay');
    this._updateUserUI();
    this._updateHeaderStats();
    this._toast('success', 'fa-hand-wave', `Welcome, ${name}! Ready to study smarter? 🎓`);
  }

  _skipWelcome() {
    this.userName = 'Scholar';
    localStorage.setItem('sv_user', 'Scholar');
    this.sessions = 1;
    localStorage.setItem('sv_sessions', '1');
    this._dismissOverlay('welcomeOverlay');
    this._updateUserUI();
  }

  _dismissWelcomeBack() {
    this._dismissOverlay('welcomeBackOverlay');
  }

  _dismissOverlay(id) {
    const el = this._el(id);
    if (!el) return;
    el.classList.remove('visible');
    el.classList.add('dismissing');
    setTimeout(() => { el.style.display = 'none'; el.classList.remove('dismissing'); }, 450);
  }

  /* ─────────────────────────────────────────────────────────────────────────────────────────
     USER UI — avatar initials, greeting
     ───────────────────────────────────────────────────────────────────────────────────────── */
  _updateUserUI() {
    const name = this.userName || 'Scholar';
    const init = name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);

    const avInitials = this._el('avInitials');
    if (avInitials) avInitials.textContent = init;

    const greeting = this._el('dhGreeting');
    if (greeting) {
      const hr = new Date().getHours();
      const greet = hr < 12 ? 'Good morning' : hr < 17 ? 'Good afternoon' : 'Good evening';
      greeting.textContent = `${greet}, ${name}`;
    }
  }

  /* ─────────────────────────────────────────────────────────────────────────────────────────
     HEADER STATS
     ───────────────────────────────────────────────────────────────────────────────────────── */
  _updateHeaderStats() {
    const sess = this._el('statSessions');
    const hist = this._el('statHistory');
    const savd = this._el('statSaved');

    if (sess) sess.textContent = this.sessions || 0;
    if (hist) hist.textContent = this.history.length;
    if (savd) savd.textContent = this.saved.length;

    this._updateHistBadge();
  }

  _updateHistBadge() {
    const badge = this._el('histBadge');
    if (badge) {
      badge.textContent  = this.history.length;
      badge.style.display = this.history.length ? '' : 'none';
    }
  }

  /* ─────────────────────────────────────────────────────────────────────────────────────────
     TOOL SELECTOR
     ───────────────────────────────────────────────────────────────────────────────────────── */
  _setTool(tool) {
    if (!TOOL_CONFIG[tool]) return;
    this.tool = tool;

    /* Update active state on tool buttons */
    this._qsa('.ts-item').forEach(btn => {
      const isActive = btn.dataset.tool === tool;
      btn.classList.toggle('active', isActive);
      btn.setAttribute('aria-pressed', String(isActive));
    });

    /* Update textarea placeholder */
    const ta  = this._el('mainInput');
    const cfg = TOOL_CONFIG[tool];
    if (ta) ta.placeholder = cfg.placeholder;

    /* Update run button */
    const icon = this._el('runIcon');
    const lbl  = this._el('runLabel');
    if (icon) icon.className = `fas ${cfg.icon}`;
    if (lbl)  lbl.textContent = cfg.label;

    /* Save pref */
    this.prefs.lastTool = tool;
    this._save('sv_prefs', this.prefs);
  }

  /* ─────────────────────────────────────────────────────────────────────────────────────────
     CHARACTER COUNT
     ───────────────────────────────────────────────────────────────────────────────────────── */
  _updateCharCount() {
    const ta  = this._el('mainInput');
    const cnt = this._el('charCount');
    const max = 4000;

    if (!ta) return;
    const len = ta.value.length;
    if (cnt) cnt.textContent = `${len} / ${max}`;

    /* Warning state at 80% */
    if (len >= max * 0.8) {
      cnt?.classList.add('warning');
    } else {
      cnt?.classList.remove('warning');
    }

    /* Trim if over limit */
    if (len > max) {
      ta.value = ta.value.substring(0, max);
      this._toast('info', 'fa-info-circle', `Input limited to ${max} characters.`);
    }
  }

  /* ─────────────────────────────────────────────────────────────────────────────────────────
     FILE UPLOAD
     ───────────────────────────────────────────────────────────────────────────────────────── */
  _handleFile(file) {
    if (!file) return;

    const allowed = ['.txt', '.md', '.csv', '.text', '.markdown'];
    const ext     = '.' + (file.name.split('.').pop() || '').toLowerCase();

    if (!allowed.includes(ext) && file.type !== 'text/plain') {
      this._toast('error', 'fa-times', `File type not supported. Use .txt, .md or .csv`);
      return;
    }

    if (file.size > 200000) {
      this._toast('error', 'fa-times', 'File too large. Maximum 200 KB.');
      return;
    }

    const reader = new FileReader();
    reader.onload = e => {
      const text = e.target.result?.trim();
      if (!text) { this._toast('error', 'fa-times', 'File is empty.'); return; }

      const ta = this._el('mainInput');
      if (ta) {
        ta.value = text.substring(0, 4000);
        this._updateCharCount();
        ta.dispatchEvent(new Event('input'));
      }

      /* Show chip */
      const chip = this._el('fileChip');
      const name = this._el('fileChipName');
      const dz   = this._el('uploadZone');
      if (chip) chip.style.display = 'flex';
      if (name) name.textContent   = file.name;
      if (dz)   dz.classList.add('has-file');

      this._toast('success', 'fa-check', `File loaded: ${file.name}`);
    };
    reader.onerror = () => this._toast('error', 'fa-times', 'Failed to read file.');
    reader.readAsText(file, 'UTF-8');
  }

  _removeFile() {
    const fi = this._el('fileInput');
    const chip = this._el('fileChip');
    const dz   = this._el('uploadZone');
    if (fi)   fi.value   = '';
    if (chip) chip.style.display = 'none';
    if (dz)   dz.classList.remove('has-file');
  }

  /* ─────────────────────────────────────────────────────────────────────────────────────────
     GENERATE — main entry point
     ───────────────────────────────────────────────────────────────────────────────────────── */
  async _send() {
    if (this.generating) return;

    const ta   = this._el('mainInput');
    const text = ta?.value?.trim();

    if (!text || text.length < 2) {
      ta?.focus();
      this._toast('info', 'fa-lightbulb', 'Please enter a topic or question to study.');
      ta?.classList.add('input-shake');
      setTimeout(() => ta?.classList.remove('input-shake'), 500);
      return;
    }

    const depth = this._el('depthSel')?.value  || 'detailed';
    const lang  = this._el('langSel')?.value   || 'English';
    const style = this._el('styleSel')?.value  || 'simple';

    /* ── MOBILE AUTO-SCROLL TO OUTPUT ── */
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
      this._toast('success', 'fa-check-circle', `${TOOL_CONFIG[this.tool].sfpName} ready!`);

      /* Scroll result into view */
      setTimeout(() => this._scrollToResult(), 200);

    } catch (err) {
      if (err.name === 'AbortError' || err.message === 'AbortError') {
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
    if (window.innerWidth > 768) return;
    const rightPanel = this._el('rightPanel');
    if (rightPanel) {
      rightPanel.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }

  /* ── Scroll to result after generation ── */
  _scrollToResult() {
    const resultArea = this._el('resultArea');
    if (resultArea && resultArea.style.display !== 'none') {
      resultArea.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
    const outArea = this._el('outArea');
    if (outArea) outArea.scrollTo({ top: 0, behavior: 'smooth' });
    if (window.innerWidth <= 768) {
      window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' });
    }
  }

  /* ═══════════════════════════════════════════════════════════════════════════
     STREAMING API CALL — SSE with live markdown rendering
     ═════════════════════════════════════════════════════════════════════════ */
  async _callAPIStream(message, opts = {}) {
    this.streamCtrl = new AbortController();
    this._showCancelBtn(true);

    try {
      return await this._streamSSE(message, opts);
    } catch (err) {
      if (err.name === 'AbortError' || err.message === 'AbortError') throw err;
      console.warn('[Savoiré] SSE failed, falling back to JSON:', err.message);
      return await this._callAPIJson(message, opts);
    }
  }

  /* ── Server-Sent Events streaming with LIVE MARKDOWN ── */
  async _streamSSE(message, opts) {
    return new Promise((resolve, reject) => {
      const body = JSON.stringify({
        message,
        options: { ...opts, stream: true },
      });

      let eventType = null; // Track current event type from event: lines

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
          /* Server returned plain JSON — simulate stream */
          const data = await res.json();
          if (data.error) { reject(new Error(data.error)); return; }
          this._simulateStream(data, resolve, reject);
          return;
        }

        /* ── True SSE streaming with LIVE MARKDOWN rendering ── */
        const reader      = res.body.getReader();
        const decoder     = new TextDecoder();
        let   buffer      = '';
        let   fullContent = '';
        let   renderThrottle = 0;

        /* Get stream display elements */
        const sfpText   = this._el('sfpText');
        const sfpScroll = this._el('sfpScroll');

        /* LIVE MARKDOWN RENDER FUNCTION */
        const renderLive = () => {
          if (!sfpText) return;
          const now = Date.now();
          if (now - renderThrottle < 35) return;
          renderThrottle = now;

          try {
            sfpText.innerHTML = this._renderMdLive(fullContent);
            sfpText.classList.add('live-md');
            if (sfpScroll) sfpScroll.scrollTop = sfpScroll.scrollHeight;
          } catch(e) {
            sfpText.textContent = fullContent;
          }

          /* Mobile: keep visible */
          if (window.innerWidth <= 768) {
            const sfp = this._el('streamFullpage');
            if (sfp && sfp.style.display !== 'none') {
              sfp.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }
          }
        };

        /* Process SSE lines */
        const processLines = (lines) => {
          for (const line of lines) {
            const trimmed = line.trim();
            if (!trimmed) continue;

            // Handle event: lines
            if (trimmed.startsWith('event: ')) {
              eventType = trimmed.slice(7).trim();
              continue;
            }

            // Handle data: lines
            if (trimmed.startsWith('data: ')) {
              const dataStr = trimmed.slice(6).trim();
              if (dataStr === '[DONE]') continue;

              try {
                const evt = JSON.parse(dataStr);

                // Handle token events
                if (evt.t !== undefined) {
                  fullContent += evt.t;
                  renderLive();
                  this._updateStageByProgress(fullContent.length);
                }
                // Handle final data (topic indicates completion)
                else if (evt.topic !== undefined) {
                  if (sfpText) {
                    sfpText.classList.remove('live-md');
                    sfpText.classList.add('done');
                  }
                  resolve(evt);
                  return;
                }
                // Handle stage events from server
                else if (evt.idx !== undefined) {
                  this._activateStage(evt.idx);
                }
              } catch(e) {
                // Skip malformed JSON
              }
            }
          }
        }.bind(this);

        /* Read stream */
        const pump = async () => {
          try {
            while (true) {
              const { done, value } = await reader.read();
              if (done) {
                if (buffer) processLines([buffer]);
                reject(new Error('Stream ended without final data'));
                return;
              }

              buffer += decoder.decode(value, { stream: true });
              const lines = buffer.split('\n');
              buffer = lines.pop() || '';
              processLines(lines);
            }
          } catch (err) {
            if (err.name === 'AbortError') reject(err);
            else reject(err);
          }
        };

        pump();
      })
      .catch(err => {
        if (err.name === 'AbortError') reject(err);
        else reject(err);
      });
    });
  }

  /* ── Simulate streaming for JSON fallback — with LIVE MARKDOWN ── */
  async _simulateStream(data, resolve, reject) {
    const notesText = data.ultra_long_notes || data.topic || 'Generating…';
    const sfpText   = this._el('sfpText');
    let   i         = 0;
    const chunkSize = 6;
    const delay     = 14;

    const tick = () => {
      if (this.streamCtrl?.signal.aborted) { reject(new Error('AbortError')); return; }
      if (i >= notesText.length) {
        if (sfpText) { sfpText.classList.remove('live-md'); sfpText.classList.add('done'); }
        resolve(data);
        return;
      }
      this.streamBuffer += notesText.slice(i, i + chunkSize);
      i += chunkSize;

      if (sfpText) {
        try {
          sfpText.innerHTML = this._renderMdLive(this.streamBuffer);
          sfpText.classList.add('live-md');
        } catch(e) {
          sfpText.textContent = this.streamBuffer;
        }
        const scroll = this._el('sfpScroll');
        if (scroll) scroll.scrollTop = scroll.scrollHeight;
      }
      this._updateStageByProgress(i);
      setTimeout(tick, delay);
    };

    tick();
  }

  /* ── Plain JSON API call ── */
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
    const taWrap        = this._el('taCollapseWrap');
    const selectorsWrap = this._el('selectorsCollapseWrap');
    const suggWrap      = this._el('suggCollapseWrap');
    const fileWrap      = this._el('fileCollapseWrap');
    const miniBar       = this._el('inputMiniBar');
    const statusCard    = this._el('streamStatusCard');
    const miniText      = this._el('inputMiniText');

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

    setTimeout(() => this._el('mainInput')?.focus(), 200);
  }

  _restoreInput() {
    this._expandInput();
    this._showCancelBtn(false);
  }

  /* ═══════════════════════════════════════════════════════════════════════════
     STREAMING OVERLAY — shows LIVE STYLED MARKDOWN
     ═════════════════════════════════════════════════════════════════════════ */
  _showStreamOverlay(topic, tool) {
    const sfp      = this._el('streamFullpage');
    const sfpTopic = this._el('sfpTopic');
    const sfpIcon  = this._el('sfpToolIcon');
    const sfpName  = this._el('sfpToolName');
    const sfpLabel = this._el('sfpLabel');
    const sfpText  = this._el('sfpText');

    if (!sfp) return;

    const cfg = TOOL_CONFIG[tool] || TOOL_CONFIG.notes;
    if (sfpTopic)  sfpTopic.textContent = topic.length > 50 ? topic.substring(0, 50) + '…' : topic;
    if (sfpIcon)   sfpIcon.className    = `fas ${cfg.sfpIcon}`;
    if (sfpName)   sfpName.textContent  = cfg.sfpName;
    if (sfpLabel)  sfpLabel.textContent = cfg.sfpLabel;

    /* Reset stream text — apply md-content class for LIVE styled rendering */
    if (sfpText) {
      sfpText.innerHTML = '<span class="sfp-cursor">▊</span>';
      sfpText.classList.remove('done');
      sfpText.classList.add('live-md');
    }

    /* Adjust left position based on sidebar state */
    const lp = this._el('leftPanel');
    if (lp && !lp.classList.contains('collapsed')) {
      sfp.classList.add('panel-open');
    } else {
      sfp.classList.remove('panel-open');
    }

    sfp.style.display = 'flex';

    /* Hide main output panels */
    const emptyState   = this._el('emptyState');
    const thinkingWrap = this._el('thinkingWrap');
    const resultArea   = this._el('resultArea');
    if (emptyState)   emptyState.style.display   = 'none';
    if (thinkingWrap) thinkingWrap.style.display = 'none';
    if (resultArea)   resultArea.style.display   = 'none';

    if (window.innerWidth <= 768) {
      sfp.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }

  _hideStreamOverlay() {
    const sfp = this._el('streamFullpage');
    if (sfp) {
      sfp.classList.add('fading-out');
      setTimeout(() => {
        sfp.style.display = 'none';
        sfp.classList.remove('fading-out');
      }, 300);
    }
    this._restoreInput();
  }

  /* ═══════════════════════════════════════════════════════════════════════════
     THINKING STAGES
     ═════════════════════════════════════════════════════════════════════════ */
  _startThinkingStages() {
    this.stageIdx = 0;
    for (let i = 0; i < 5; i++) {
      const el = this._el(`ts${i}`);
      if (el) el.className = 'ths';
      const ss = this._el(`ss${i}`);
      if (ss) ss.className = 'ssc-stage';
    }
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
    if (data.ultra_long_notes)                  items.push({ id:'sec-notes',    label:'Notes',         icon:'fas fa-book-open' });
    if (data.key_concepts?.length)              items.push({ id:'sec-concepts', label:'Concepts',      icon:'fas fa-lightbulb' });
    if (data.key_tricks?.length)                items.push({ id:'sec-tricks',   label:'Tricks',        icon:'fas fa-magic' });
    if (data.practice_questions?.length)        items.push({ id:'sec-qa',       label:'Questions',     icon:'fas fa-pen-alt' });
    if (data.real_world_applications?.length)   items.push({ id:'sec-apps',     label:'Applications',  icon:'fas fa-globe' });
    if (data.common_misconceptions?.length)     items.push({ id:'sec-misc',     label:'Misconceptions',icon:'fas fa-exclamation-triangle' });
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
            aria-label="Question ${i+1}: ${(qa.question || '').substring(0,60)}"
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
     FLASHCARDS HTML — 3D flip cards with progress — WORLD CLASS
     ═════════════════════════════════════════════════════════════════════════ */
  _buildFcHTML(data) {
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
                  <div class="fc-lbl">
                    <i class="fas fa-question-circle"></i> Question / Concept
                  </div>
                  <div class="fc-content" id="fcFront">${this._esc(first.q)}</div>
                  <div class="fc-hint" aria-hidden="true">
                    <i class="fas fa-hand-pointer"></i> Click to flip · <kbd>Space</kbd>
                  </div>
                </div>
                <div class="fc-face fc-back">
                  <div class="fc-lbl">
                    <i class="fas fa-lightbulb"></i> Answer / Explanation
                  </div>
                  <div class="fc-content" id="fcBack">${this._renderMd(first.a)}</div>
                  <div class="fc-hint" aria-hidden="true">
                    <i class="fas fa-check-circle" style="color:var(--em2)"></i> Got it? Use arrows to continue
                  </div>
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

    const fc   = this._el('theCard');
    if (fc) fc.classList.remove('flipped');

    const card  = this.fcCards[this.fcCurrent];
    const front = this._el('fcFront');
    const back  = this._el('fcBack');
    const cur   = this._el('fcCur');
    const pct   = this._el('fcPct');
    const bar   = this._el('fcProgBar');
    const prev  = this._el('fcPrev');
    const next  = this._el('fcNext');

    if (front) front.textContent  = card.q;
    if (back)  back.innerHTML     = this._renderMd(card.a);
    if (cur)   cur.textContent    = this.fcCurrent + 1;

    const p = ((this.fcCurrent + 1) / this.fcCards.length * 100).toFixed(1);
    if (pct) pct.textContent  = Math.round(p);
    if (bar) bar.style.width  = `${p}%`;

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
     QUIZ HTML — WORLD-CLASS MCQ with A/B/C/D options, animations, scoring
     ═════════════════════════════════════════════════════════════════════════ */
  _buildQuizHTML(data) {
    const qs = data.practice_questions || [];
    if (!qs.length) return this._buildNotesHTML(data);

    /* Build quiz data with MCQ options */
    this.quizData = qs.map((q, idx) => {
      /* Generate MCQ options from the question */
      const options = this._generateMCQOptions(q, data, idx);
      return {
        ...q,
        options,
        correctIdx: options.findIndex(o => o.isCorrect),
        answered: false,
        correct:  false,
        selectedIdx: -1,
      };
    });
    this.quizIdx   = 0;
    this.quizScore = 0;

    return `
      <div class="study-sec" id="quizContainer">
        <div class="ss-hdr">
          <div class="ss-title">
            <i class="fas fa-question-circle"></i> Practice Quiz
            <span style="color:var(--t3);font-weight:400;text-transform:none;letter-spacing:0;margin-left:4px">
              (${qs.length} questions)
            </span>
          </div>
          <div style="margin-left:auto;display:flex;align-items:center;gap:12px">
            <div class="quiz-score-display" id="quizScoreLabel">
              <i class="fas fa-star" style="color:var(--gold)"></i>
              <span id="quizScoreNum">0</span> / ${qs.length}
            </div>
          </div>
        </div>
        <div class="ss-body" id="quizBody">
          ${this._renderQuizQ(0)}
        </div>
      </div>`;
  }

  /* ── Generate MCQ options for a question ── */
  _generateMCQOptions(qa, data, idx) {
    const correctAnswer = qa.answer || '';

    /* Try to extract options if answer contains A) B) C) D) format */
    const mcqMatch = qa.question.match(/\(A\)|\(B\)|\(C\)|\(D\)|^A\.|^B\.|^C\.|^D\./im);
    if (mcqMatch) {
      /* Question already has MCQ format */
      return this._parseMCQFromText(qa.question, qa.answer);
    }

    /* Generate plausible distractors from available content */
    const allConcepts = [
      ...(data.key_concepts || []),
      ...(data.practice_questions || []).filter((_, i) => i !== idx).map(q => q.answer),
      ...(data.real_world_applications || []),
    ].filter(Boolean).map(c => this._stripMd(c).split('.')[0].trim()).filter(c => c.length > 5 && c.length < 120);

    /* Build correct option */
    const correctShort = this._stripMd(correctAnswer).split('.')[0].trim().substring(0, 120);

    /* Pick 3 distractors different from correct */
    const distractors = [];
    const used = new Set([correctShort.toLowerCase()]);

    for (const concept of allConcepts) {
      if (distractors.length >= 3) break;
      if (!used.has(concept.toLowerCase()) && concept !== correctShort) {
        distractors.push(concept.substring(0, 120));
        used.add(concept.toLowerCase());
      }
    }

    /* Pad with generic distractors if needed */
    const genericFallbacks = [
      'This is not directly related to the topic',
      'This represents an incorrect application of the concept',
      'This is a common misconception in this area',
      'None of the above descriptions apply here',
      'This refers to a different but related concept',
    ];
    let fbIdx = 0;
    while (distractors.length < 3) {
      distractors.push(genericFallbacks[fbIdx++ % genericFallbacks.length]);
    }

    /* Shuffle all 4 options */
    const allOptions = [
      { text: correctShort, isCorrect: true },
      ...distractors.slice(0, 3).map(d => ({ text: d, isCorrect: false })),
    ];

    /* Fisher-Yates shuffle */
    for (let i = allOptions.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [allOptions[i], allOptions[j]] = [allOptions[j], allOptions[i]];
    }

    return allOptions;
  }

  /* ── Parse MCQ from text that already has options ── */
  _parseMCQFromText(questionText, answerText) {
    const optRegex = /(?:\(([A-D])\)|^([A-D])[.)]\s*)(.+?)(?=\n|$)/gim;
    const options  = [];
    let match;

    while ((match = optRegex.exec(questionText)) !== null) {
      const letter = (match[1] || match[2]).toUpperCase();
      const text   = match[3].trim();
      /* Check if this letter appears in the answer */
      const isCorrect = answerText.toUpperCase().includes(letter) ||
                        answerText.toLowerCase().includes(text.toLowerCase().substring(0, 20));
      options.push({ text, isCorrect, letter });
    }

    if (options.length === 4) return options;

    /* Fallback */
    return [
      { text: this._stripMd(answerText).substring(0, 100), isCorrect: true },
      { text: 'This is not correct', isCorrect: false },
      { text: 'This option does not apply', isCorrect: false },
      { text: 'None of the above', isCorrect: false },
    ];
  }

  /* ── Render a single quiz question with MCQ options ── */
  _renderQuizQ(idx) {
    if (idx >= this.quizData.length) {
      return this._renderQuizResult();
    }

    const q        = this.quizData[idx];
    const progress = ((idx) / this.quizData.length * 100).toFixed(0);
    const letters  = ['A', 'B', 'C', 'D'];

    const optionsHtml = q.options.map((opt, oi) => `
      <button
        class="quiz-opt-btn"
        data-idx="${oi}"
        onclick="window._app._quizSelectOption(${idx}, ${oi})"
        aria-label="Option ${letters[oi]}: ${this._esc(opt.text)}"
        ${q.answered ? 'disabled' : ''}
      >
        <span class="quiz-opt-letter">${letters[oi]}</span>
        <span class="quiz-opt-text">${this._esc(opt.text)}</span>
      </button>`).join('');

    return `
      <div class="quiz-q-card" id="quizCard_${idx}">

        <!-- Progress bar -->
        <div class="quiz-top-bar">
          <div class="quiz-progress-track">
            <div class="quiz-progress-fill" style="width:${progress}%" id="quizProgFill"></div>
          </div>
          <div class="quiz-top-meta">
            <span class="quiz-q-counter">Q ${idx + 1} / ${this.quizData.length}</span>
            <span class="quiz-diff-badge">Practice Mode</span>
          </div>
        </div>

        <!-- Question text -->
        <div class="quiz-question-wrap">
          <div class="quiz-question-num">${idx + 1}</div>
          <div class="quiz-question-text">${this._esc(q.question)}</div>
        </div>

        <!-- MCQ Options -->
        <div class="quiz-options-grid" id="quizOpts_${idx}">
          ${optionsHtml}
        </div>

        <!-- Answer reveal area -->
        <div class="quiz-answer-area" id="quizAnswerArea_${idx}" style="display:none"></div>

        <!-- Navigation (show after answering) -->
        <div class="quiz-nav-area" id="quizNav_${idx}" style="display:none">
          <button
            class="quiz-nav-btn primary"
            onclick="window._app._quizAdvance(${idx})"
          >
            ${idx + 1 < this.quizData.length
              ? '<i class="fas fa-arrow-right"></i> Next Question'
              : '<i class="fas fa-flag-checkered"></i> See Results'}
          </button>
        </div>

      </div>`;
  }

  /* ── Handle option selection ── */
  _quizSelectOption(questionIdx, optionIdx) {
    const q = this.quizData[questionIdx];
    if (q.answered) return;

    q.answered    = true;
    q.selectedIdx = optionIdx;
    q.correct     = q.options[optionIdx].isCorrect;

    if (q.correct) {
      this.quizScore++;
      this._toast('success', 'fa-check-circle', '✓ Correct! Excellent work! 🎉', 2000);
    } else {
      this._toast('info', 'fa-book-open', '✗ Not quite — check the answer below 📖', 2000);
    }

    /* Update score */
    const scoreNum = this._el('quizScoreNum');
    if (scoreNum) scoreNum.textContent = this.quizScore;

    /* Style all options */
    const optsContainer = this._el(`quizOpts_${questionIdx}`);
    if (optsContainer) {
      const optBtns = optsContainer.querySelectorAll('.quiz-opt-btn');
      optBtns.forEach((btn, oi) => {
        btn.disabled = true;
        btn.classList.remove('selected', 'correct', 'wrong', 'revealed');

        if (q.options[oi].isCorrect) {
          /* Mark correct answer green */
          btn.classList.add('correct');
        } else if (oi === optionIdx && !q.options[oi].isCorrect) {
          /* Mark wrong selection red */
          btn.classList.add('wrong');
        } else {
          /* Dim others */
          btn.classList.add('dimmed');
        }
      });
    }

    /* Show answer explanation */
    const ansArea = this._el(`quizAnswerArea_${questionIdx}`);
    if (ansArea) {
      ansArea.style.display = 'block';
      ansArea.innerHTML = `
        <div class="quiz-explanation ${q.correct ? 'correct' : 'incorrect'}">
          <div class="quiz-exp-header">
            <i class="fas ${q.correct ? 'fa-check-circle' : 'fa-times-circle'}"></i>
            <strong>${q.correct ? 'Correct!' : 'Incorrect'}</strong>
            ${!q.correct ? `<span style="font-weight:400;opacity:0.8"> — The correct answer was highlighted</span>` : ''}
          </div>
          <div class="quiz-exp-body">
            <div class="quiz-exp-label">Full Explanation</div>
            <div class="quiz-exp-text md-content">${this._renderMd(q.answer)}</div>
          </div>
        </div>`;
      /* Smooth scroll to answer */
      setTimeout(() => ansArea.scrollIntoView({ behavior: 'smooth', block: 'nearest' }), 100);
    }

    /* Show navigation */
    const navArea = this._el(`quizNav_${questionIdx}`);
    if (navArea) navArea.style.display = 'flex';
  }

  /* ── Advance to next question ── */
  _quizAdvance(currentIdx) {
    this.quizIdx = currentIdx + 1;
    const qb     = this._el('quizBody');
    if (!qb) return;

    if (this.quizIdx >= this.quizData.length) {
      /* Show results */
      qb.innerHTML = this._renderQuizResult();
    } else {
      /* Next question */
      qb.innerHTML = this._renderQuizQ(this.quizIdx);
      qb.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }

  /* ── Quiz final result ── */
  _renderQuizResult() {
    const total  = this.quizData.length;
    const score  = this.quizScore;
    const pct    = Math.round((score / total) * 100);
    const grade  = pct >= 90 ? { emoji: '🏆', text: 'Outstanding!',       color: 'var(--gold)' }
                 : pct >= 75 ? { emoji: '🎓', text: 'Excellent Work!',    color: 'var(--em2)' }
                 : pct >= 60 ? { emoji: '📚', text: 'Good Progress!',      color: 'var(--blue)' }
                 : pct >= 40 ? { emoji: '💪', text: 'Keep Studying!',      color: 'var(--amber)' }
                 : { emoji: '📖', text: 'More Practice Needed', color: 'var(--ruby2)' };

    /* Build review of all answers */
    const reviewHtml = this.quizData.map((q, i) => {
      const letters = ['A', 'B', 'C', 'D'];
      const selOpt  = q.selectedIdx >= 0 ? q.options[q.selectedIdx] : null;
      const corrOpt = q.options.find(o => o.isCorrect);
      return `
        <div class="quiz-review-item ${q.correct ? 'correct' : 'incorrect'}">
          <div class="quiz-review-hdr">
            <span class="quiz-review-icon">
              <i class="fas ${q.correct ? 'fa-check-circle' : 'fa-times-circle'}"></i>
            </span>
            <span class="quiz-review-num">Q${i + 1}</span>
            <span class="quiz-review-q">${this._esc(q.question)}</span>
          </div>
          ${selOpt && !q.correct ? `
            <div class="quiz-review-your">
              <span class="quiz-review-label wrong">Your answer:</span>
              ${this._esc(selOpt.text)}
            </div>` : ''}
          <div class="quiz-review-correct">
            <span class="quiz-review-label correct">Correct answer:</span>
            ${this._esc(corrOpt?.text || '')}
          </div>
        </div>`;
    }).join('');

    return `
      <div class="quiz-result-wrap">

        <!-- Score circle -->
        <div class="quiz-result-score-wrap">
          <div class="quiz-result-emoji">${grade.emoji}</div>
          <div class="quiz-result-big-score" style="color:${grade.color}">
            ${score}<span class="quiz-result-denom"> / ${total}</span>
          </div>
          <div class="quiz-result-pct">${pct}% Correct</div>
          <div class="quiz-result-grade" style="color:${grade.color}">${grade.text}</div>
        </div>

        <!-- Stats row -->
        <div class="quiz-result-stats">
          <div class="quiz-result-stat correct">
            <div class="quiz-result-stat-val">${score}</div>
            <div class="quiz-result-stat-lbl">
              <i class="fas fa-check-circle"></i> Correct
            </div>
          </div>
          <div class="quiz-result-stat wrong">
            <div class="quiz-result-stat-val">${total - score}</div>
            <div class="quiz-result-stat-lbl">
              <i class="fas fa-times-circle"></i> Incorrect
            </div>
          </div>
          <div class="quiz-result-stat total">
            <div class="quiz-result-stat-val">${total}</div>
            <div class="quiz-result-stat-lbl">
              <i class="fas fa-list-ol"></i> Total
            </div>
          </div>
        </div>

        <!-- Action buttons -->
        <div class="quiz-result-actions">
          <button class="fc-btn primary" onclick="window._app._quizRestart()">
            <i class="fas fa-redo"></i> Try Again
          </button>
          <button class="fc-btn" onclick="window._app._quizToggleReview()">
            <i class="fas fa-eye"></i> <span id="quizReviewToggleLabel">Show Review</span>
          </button>
        </div>

        <!-- Review section (hidden by default) -->
        <div id="quizReviewSection" style="display:none;margin-top:20px">
          <div style="font-family:var(--fu);font-size:0.75rem;color:var(--t3);text-transform:uppercase;letter-spacing:0.08em;margin-bottom:12px;padding-bottom:8px;border-bottom:1px solid var(--b2)">
            <i class="fas fa-list-check"></i> &nbsp; Full Answer Review
          </div>
          <div class="quiz-review-list">${reviewHtml}</div>
        </div>

      </div>`;
  }

  /* ── Toggle review section ── */
  _quizToggleReview() {
    const section = this._el('quizReviewSection');
    const label   = this._el('quizReviewToggleLabel');
    if (!section) return;
    const isHidden = section.style.display === 'none';
    section.style.display = isHidden ? 'block' : 'none';
    if (label) label.textContent = isHidden ? 'Hide Review' : 'Show Review';
    if (isHidden) section.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  _quizRestart() {
    this.quizScore = 0;
    this.quizIdx   = 0;
    this.quizData  = this.quizData.map(q => ({ ...q, answered: false, correct: false, selectedIdx: -1 }));
    const qb = this._el('quizBody');
    if (qb) qb.innerHTML = this._renderQuizQ(0);
    const scoreNum = this._el('quizScoreNum');
    if (scoreNum) scoreNum.textContent = '0';
  }

  /* ═══════════════════════════════════════════════════════════════════════════
     SUMMARY HTML — WORLD-CLASS visual with TL;DR, key points, timeline
     ═════════════════════════════════════════════════════════════════════════ */
  _buildSummaryHTML(data) {
    let h = '';

    /* ── TL;DR Executive Summary ── */
    if (data.ultra_long_notes) {
      /* Extract first 2-3 paragraphs as executive summary */
      const raw    = data.ultra_long_notes;
      const paras  = raw.split(/\n{2,}/).filter(p => p.trim() && !p.trim().startsWith('#')).slice(0, 3);
      const tldr   = paras.join('\n\n');

      h += `
        <div class="study-sec section-anchor" id="sec-tldr">
          <div class="ss-hdr">
            <div class="ss-title">
              <i class="fas fa-bolt"></i>
              TL;DR — Executive Summary
            </div>
            <button class="ss-copy-btn" onclick="window._app._copySection(${JSON.stringify(this._stripMd(tldr))})">
              <i class="fas fa-copy"></i> Copy
            </button>
          </div>
          <div class="ss-body">
            <div class="summary-tldr-box">
              <div class="summary-tldr-icon" aria-hidden="true">
                <i class="fas fa-align-left"></i>
              </div>
              <div class="summary-tldr-content md-content">
                ${this._renderMd(tldr)}
              </div>
            </div>
          </div>
        </div>`;

      /* ── Full notes ── */
      h += `
        <div class="study-sec section-anchor" id="sec-notes">
          <div class="ss-hdr">
            <div class="ss-title"><i class="fas fa-book-open"></i> Full Summary Notes</div>
            <button class="ss-copy-btn" onclick="window._app._copySection(${JSON.stringify(this._stripMd(raw))})">
              <i class="fas fa-copy"></i> Copy
            </button>
          </div>
          <div class="ss-body">
            <div class="md-content">${this._renderMd(raw)}</div>
          </div>
        </div>`;
    }

    /* ── Key Points at a Glance ── */
    if (data.key_concepts?.length) {
      const items = data.key_concepts.map((c, i) => `
        <div class="summary-point">
          <div class="summary-point-num">${i + 1}</div>
          <div class="summary-point-text">${this._esc(c)}</div>
        </div>`).join('');

      h += `
        <div class="study-sec section-anchor" id="sec-concepts">
          <div class="ss-hdr">
            <div class="ss-title"><i class="fas fa-list-check"></i> Key Points at a Glance</div>
            <button class="ss-copy-btn" onclick="window._app._copySection(${JSON.stringify(data.key_concepts.join('\n'))})">
              <i class="fas fa-copy"></i> Copy
            </button>
          </div>
          <div class="ss-body">
            <div class="summary-points-list">${items}</div>
          </div>
        </div>`;
    }

    /* ── Memory Tricks ── */
    if (data.key_tricks?.length) {
      const ICONS = ['fas fa-magic', 'fas fa-star', 'fas fa-bolt', 'fas fa-brain', 'fas fa-key'];
      const items = data.key_tricks.map((t, i) => `
        <div class="trick-item">
          <div class="trick-icon"><i class="${ICONS[i % ICONS.length]}" aria-hidden="true"></i></div>
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

    /* ── Quick Practice ── */
    if (data.practice_questions?.length) {
      const qs = data.practice_questions.slice(0, 3).map((qa, i) => `
        <div class="qa-card">
          <div
            class="qa-head"
            onclick="this.nextElementSibling.classList.toggle('visible');this.querySelector('.qa-toggle').classList.toggle('open');"
            role="button"
            tabindex="0"
            onkeydown="if(event.key==='Enter'||event.key===' ')this.click()"
          >
            <div class="qa-num">${i + 1}</div>
            <div class="qa-q">${this._esc(qa.question)}</div>
            <button class="qa-toggle" tabindex="-1">
              <i class="fas fa-chevron-down"></i> Answer
            </button>
          </div>
          <div class="qa-answer">
            <div class="qa-albl"><i class="fas fa-check-circle"></i> Answer</div>
            <div class="qa-answer-inner md-content">${this._renderMd(qa.answer)}</div>
          </div>
        </div>`).join('');

      h += `
        <div class="study-sec section-anchor" id="sec-qa">
          <div class="ss-hdr">
            <div class="ss-title"><i class="fas fa-pen-nib"></i> Quick Practice Questions</div>
          </div>
          <div class="ss-body">
            <div class="qa-list">${qs}</div>
          </div>
        </div>`;
    }

    return h || this._buildNotesHTML(data);
  }

  /* ═══════════════════════════════════════════════════════════════════════════
     MIND MAP HTML — Visual hierarchical layout
     ═════════════════════════════════════════════════════════════════════════ */
  _buildMindmapHTML(data) {
    const topic = data.topic || 'Topic';

    const branches = [
      { label: 'Core Concepts',         items: data.key_concepts || [],             icon: 'fa-lightbulb',            color: 'var(--gold)',  colorClass: 'gold' },
      { label: 'Study Tricks',           items: data.key_tricks || [],               icon: 'fa-magic',                color: 'var(--em2)',   colorClass: 'green' },
      { label: 'Real-World Applications',items: data.real_world_applications || [],  icon: 'fa-globe',                color: 'var(--blue)',  colorClass: 'blue' },
      { label: 'Common Mistakes',        items: data.common_misconceptions || [],    icon: 'fa-exclamation-triangle', color: 'var(--ruby2)', colorClass: 'red' },
    ].filter(b => b.items.length > 0);

    const branchHtml = branches.map(b => `
      <div class="mm-branch mm-branch--${b.colorClass}">
        <div class="mm-branch-hdr" style="color:${b.color}">
          <i class="fas ${b.icon}" aria-hidden="true"></i>
          ${this._esc(b.label)}
          <span class="mm-branch-count">${b.items.length}</span>
        </div>
        <div class="mm-nodes-list">
          ${b.items.map(item => `
            <div class="mm-node mm-node--${b.colorClass}">
              <span class="mm-node-dot" style="background:${b.color}" aria-hidden="true"></span>
              <span class="mm-node-text">${this._esc(item)}</span>
            </div>`).join('')}
        </div>
      </div>`).join('');

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
            <div class="mm-root">
              <i class="fas fa-brain" style="margin-right:8px;opacity:0.7"></i>
              ${this._esc(topic)}
            </div>
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
     ULTRA-PROFESSIONAL PDF — Magazine-quality multi-page A4
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

    this._toast('info', 'fa-spinner', 'Generating PDF…');

    try {
      const { jsPDF } = window.jspdf;
      const doc = new jsPDF({ unit: 'mm', format: 'a4', compress: true });

      /* ── Page dimensions ── */
      const pw  = 210;   /* Page width mm */
      const ph  = 297;   /* Page height mm */
      const ml  = 16;    /* Margin left */
      const mr  = 16;    /* Margin right */
      const mt  = 38;    /* Margin top (after header) */
      const mb  = 22;    /* Margin bottom (before footer) */
      const cw  = pw - ml - mr;
      let   y   = mt;
      let   pageNum = 1;

      /* ── COLOR PALETTE ── */
      const GOLD      = [201, 169, 110];
      const GOLD_DARK = [140, 92, 24];
      const GOLD_BG   = [252, 244, 228];
      const DARK      = [18, 12, 4];
      const MID       = [55, 48, 38];
      const LIGHT     = [100, 88, 72];
      const FAINT     = [155, 140, 118];
      const GREEN     = [38, 140, 88];
      const GREEN_BG  = [236, 252, 244];
      const RED       = [180, 40, 40];
      const RED_BG    = [252, 236, 236];
      const BLUE      = [50, 100, 200];
      const BLUE_BG   = [236, 244, 254];
      const CREAM     = [250, 246, 238];
      const CREAM2    = [244, 240, 232];
      const WHITE     = [255, 255, 255];
      const BLACK     = [0,   0,   0];
      const DIVIDER   = [220, 210, 190];
      const AMBER     = [180, 100, 20];
      const AMBER_BG  = [252, 244, 228];

      /* ════════════════════════════════════════════════════════════════
         DRAW PAGE HEADER — elegant with decorative elements
         ════════════════════════════════════════════════════════════════ */
      const drawPageHeader = () => {
        /* Full-width dark header band */
        doc.setFillColor(12, 10, 6);
        doc.rect(0, 0, pw, 28, 'F');

        /* Gold decorative top stripe */
        doc.setFillColor(...GOLD);
        doc.rect(0, 0, pw, 4, 'F');

        /* Left gold accent bar (vertical) */
        doc.setFillColor(...GOLD);
        doc.rect(ml, 8, 3, 16, 'F');

        /* Brand name */
        doc.setFontSize(11);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(...GOLD);
        doc.text('SAVOIRÉ AI', ml + 7, 16);

        /* Version tag */
        doc.setFontSize(6.5);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(160, 130, 80);
        doc.text('v2.0', ml + 7 + doc.getTextWidth('SAVOIRÉ AI') + 2, 16);

        /* Tagline */
        doc.setFontSize(7);
        doc.setTextColor(120, 100, 70);
        doc.text('Think Less. Know More.', ml + 7, 21);

        /* Right side — website + dev */
        doc.setFontSize(7.5);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(...GOLD);
        doc.text('savoireai.vercel.app', pw - mr, 15, { align: 'right' });
        doc.setFontSize(6.5);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(130, 105, 65);
        doc.text('Sooban Talha Technologies · soobantalhatech.xyz', pw - mr, 21, { align: 'right' });

        /* Bottom hairline */
        doc.setDrawColor(...GOLD);
        doc.setLineWidth(0.6);
        doc.line(0, 28, pw, 28);

        /* Subtle gold band below header */
        doc.setFillColor(255, 250, 238);
        doc.rect(0, 28, pw, 6, 'F');
        doc.setFillColor(...GOLD);
        doc.rect(0, 33.5, pw, 0.5, 'F');

        y = mt;
      };

      /* ════════════════════════════════════════════════════════════════
         DRAW PAGE FOOTER
         ════════════════════════════════════════════════════════════════ */
      const drawPageFooter = (pgNum, pgTotal) => {
        const fy = ph - 12;

        /* Footer background */
        doc.setFillColor(245, 240, 230);
        doc.rect(0, fy - 3, pw, 15, 'F');

        /* Top footer line */
        doc.setDrawColor(...GOLD);
        doc.setLineWidth(0.5);
        doc.line(0, fy - 3, pw, fy - 3);

        /* Left footer text */
        doc.setFontSize(6.5);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(...FAINT);
        const footerLeft = `${SAVOIRÉ.BRAND} · ${SAVOIRÉ.DEVELOPER} · Generated ${new Date().toLocaleString()}`;
        doc.text(footerLeft, ml, fy + 1);

        /* Right — page number in styled box */
        const pgStr = `${pgNum} / ${pgTotal}`;
        doc.setFillColor(...GOLD);
        const pgW = doc.getTextWidth(pgStr) + 6;
        doc.rect(pw - mr - pgW, fy - 1.5, pgW + 2, 5.5, 'F');
        doc.setFontSize(7);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(12, 8, 2);
        doc.text(pgStr, pw - mr + 1, fy + 2.2, { align: 'right' });
      };

      /* ════════════════════════════════════════════════════════════════
         CHECK PAGE SPACE
         ════════════════════════════════════════════════════════════════ */
      const checkSpace = (needed = 14) => {
        if (y + needed > ph - mb) {
          doc.addPage();
          pageNum++;
          drawPageHeader();
          y = mt;
        }
      };

      /* ════════════════════════════════════════════════════════════════
         WRITE WRAPPED TEXT — returns height used
         ════════════════════════════════════════════════════════════════ */
      const writeText = (text, fontSize, bold, color, indent = 0, lineH = 1.6) => {
        if (!text) return 0;
        const clean = this._stripMd(String(text));
        if (!clean) return 0;
        doc.setFontSize(fontSize);
        doc.setFont('helvetica', bold ? 'bold' : 'normal');
        doc.setTextColor(...color);
        const lh    = fontSize * 0.352 * lineH;
        const lines = doc.splitTextToSize(clean, cw - indent);
        let   used  = 0;
        lines.forEach(line => {
          checkSpace(lh + 1);
          doc.text(line, ml + indent, y);
          y    += lh;
          used += lh;
        });
        return used;
      };

      /* ════════════════════════════════════════════════════════════════
         SECTION HEADING — with full-width background + left accent + icon
         ════════════════════════════════════════════════════════════════ */
      const sectionHeading = (title, accentColor = GOLD, bgColor = CREAM, iconChar = '▶') => {
        checkSpace(22);
        y += 4;

        /* Background band */
        doc.setFillColor(...bgColor);
        doc.rect(ml - 2, y - 5.5, cw + 4, 12, 'F');

        /* Left thick accent bar */
        doc.setFillColor(...accentColor);
        doc.rect(ml - 2, y - 5.5, 4.5, 12, 'F');

        /* Icon/bullet */
        doc.setFontSize(8);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(...WHITE);
        doc.text(iconChar, ml - 0.5, y + 1, { align: 'center' });

        /* Title */
        doc.setFontSize(9.5);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(...DARK);
        doc.text(title.toUpperCase(), ml + 7, y + 1);

        y += 9;
      };

      /* ════════════════════════════════════════════════════════════════
         ANSWER / EXPLANATION BOX — green themed
         ════════════════════════════════════════════════════════════════ */
      const answerBox = (text, label = 'ANSWER', color = GREEN, bgColor = GREEN_BG) => {
        const clean  = this._stripMd(String(text || ''));
        const lines  = doc.splitTextToSize(clean, cw - 14);
        const boxH   = lines.length * 4.8 + 12;
        checkSpace(boxH + 5);

        /* Box background */
        doc.setFillColor(...bgColor);
        doc.roundedRect(ml, y - 3, cw, boxH, 2, 2, 'F');

        /* Left accent */
        doc.setFillColor(...color);
        doc.rect(ml, y - 3, 3, boxH, 'F');

        /* Label */
        doc.setFontSize(7);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(...color);
        doc.text(label, ml + 7, y + 2);
        y += 6;

        /* Text */
        doc.setFontSize(9.5);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(...MID);
        lines.forEach(line => {
          checkSpace(5);
          doc.text(line, ml + 7, y);
          y += 4.8;
        });
        y += 4;
      };

      /* ════════════════════════════════════════════════════════════════
         NUMBERED BADGE ITEM — for key concepts
         ════════════════════════════════════════════════════════════════ */
      const numberedItem = (num, text, color = GOLD) => {
        const clean = this._stripMd(String(text || ''));
        const lines = doc.splitTextToSize(clean, cw - 16);
        const itemH = lines.length * 4.8 + 8;
        checkSpace(itemH);

        /* Number badge */
        doc.setFillColor(...color);
        doc.circle(ml + 5, y + 0.5, 4, 'F');
        doc.setFontSize(7.5);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(...WHITE);
        doc.text(String(num), ml + 5, y + 1.8, { align: 'center' });

        /* Text */
        doc.setFontSize(9.5);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(...DARK);
        let lineY = y;
        lines.forEach((line, li) => {
          if (li > 0) checkSpace(5);
          doc.text(line, ml + 14, lineY + 1.5);
          lineY += 4.8;
        });
        y = lineY + 2;
      };

      /* ════════════════════════════════════════════════════════════════
         TRICK CARD — gold bordered callout box
         ════════════════════════════════════════════════════════════════ */
      const trickCard = (num, text) => {
        const clean = this._stripMd(String(text || ''));
        const lines = doc.splitTextToSize(clean, cw - 18);
        const boxH  = lines.length * 4.8 + 14;
        checkSpace(boxH + 4);

        /* Outer box */
        doc.setFillColor(...GOLD_BG);
        doc.roundedRect(ml, y - 2, cw, boxH, 3, 3, 'F');
        doc.setDrawColor(...GOLD);
        doc.setLineWidth(0.5);
        doc.roundedRect(ml, y - 2, cw, boxH, 3, 3, 'S');

        /* Star icon */
        doc.setFontSize(9);
        doc.setTextColor(...GOLD_DARK);
        doc.text('★', ml + 5, y + 4);

        /* Trick label */
        doc.setFontSize(7);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(...GOLD_DARK);
        doc.text(`MEMORY TRICK ${num}`, ml + 12, y + 4);
        y += 8;

        /* Text */
        doc.setFontSize(9.5);
        doc.setFont('helvetica', 'italic');
        doc.setTextColor(...MID);
        lines.forEach(line => {
          checkSpace(5);
          doc.text(line, ml + 8, y);
          y += 4.8;
        });
        y += 5;
      };

      /* ════════════════════════════════════════════════════════════════
         QUESTION CARD — for practice questions
         ════════════════════════════════════════════════════════════════ */
      const questionCard = (num, question, answer) => {
        const qClean = this._stripMd(String(question || ''));
        const aClean = this._stripMd(String(answer || ''));
        const qLines = doc.splitTextToSize(`Q${num}: ${qClean}`, cw - 10);
        const qH     = qLines.length * 4.8 + 10;
        checkSpace(qH + 4);

        /* Question background */
        doc.setFillColor(248, 244, 236);
        doc.roundedRect(ml, y - 3, cw, qH, 2, 2, 'F');
        doc.setFillColor(...GOLD);
        doc.rect(ml, y - 3, 4, qH, 'F');

        /* Q number */
        doc.setFontSize(7);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(...WHITE);
        doc.text('Q', ml + 2, y + 1.5, { align: 'center' });

        /* Question text */
        doc.setFontSize(9.5);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(...DARK);
        let qLineY = y;
        qLines.forEach((line, li) => {
          if (li > 0) checkSpace(5);
          doc.text(line, ml + 8, qLineY + 1.5);
          qLineY += 4.8;
        });
        y = qLineY + 2;

        /* Answer box */
        answerBox(aClean);
        y += 2;
      };

      /* ════════════════════════════════════════════════════════════════
         BULLET ITEM — with colored bullet
         ════════════════════════════════════════════════════════════════ */
      const bulletItem = (text, bulletColor = GOLD, indent = 10) => {
        const clean = this._stripMd(String(text || ''));
        const lines = doc.splitTextToSize(clean, cw - indent - 4);
        const itemH = lines.length * 4.6;
        checkSpace(itemH + 3);

        /* Bullet circle */
        doc.setFillColor(...bulletColor);
        doc.circle(ml + indent - 3, y - 0.5, 1.2, 'F');

        /* Text */
        doc.setFontSize(9.5);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(...DARK);
        let lineY = y;
        lines.forEach((line, li) => {
          if (li > 0) checkSpace(5);
          doc.text(line, ml + indent, lineY);
          lineY += 4.6;
        });
        y = lineY + 1.5;
      };

      /* ════════════════════════════════════════════════════════════════
         DIVIDER LINE
         ════════════════════════════════════════════════════════════════ */
      const divider = () => {
        checkSpace(8);
        doc.setDrawColor(...DIVIDER);
        doc.setLineWidth(0.25);
        doc.line(ml, y, pw - mr, y);
        y += 6;
      };

      /* ════════════════════════════════════════════════════════════════
         START DOCUMENT — Title page
         ════════════════════════════════════════════════════════════════ */
      drawPageHeader();

      /* ── Title Block ── */
      checkSpace(50);

      /* Decorative background for title */
      doc.setFillColor(...CREAM);
      doc.roundedRect(ml - 2, y - 4, cw + 4, 42, 3, 3, 'F');

      /* Gold top border on title block */
      doc.setFillColor(...GOLD);
      doc.roundedRect(ml - 2, y - 4, cw + 4, 3.5, 2, 2, 'F');

      /* Topic title */
      doc.setFontSize(22);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(...DARK);
      const titleLines = doc.splitTextToSize(this._stripMd(data.topic || 'Study Notes'), cw - 8);
      let titleY = y + 6;
      titleLines.forEach(l => {
        doc.text(l, ml + 4, titleY);
        titleY += 9;
      });
      y = Math.max(titleY, y + 14);

      /* Tool badge */
      const toolName = TOOL_CONFIG[this.tool]?.sfpName || 'Study Notes';
      const toolW    = doc.getTextWidth(toolName) + 10;
      doc.setFillColor(...GOLD);
      doc.roundedRect(ml + 4, y, toolW, 6, 3, 3, 'F');
      doc.setFontSize(7);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(12, 8, 2);
      doc.text(toolName.toUpperCase(), ml + 4 + toolW / 2, y + 4.2, { align: 'center' });
      y += 10;

      /* Metadata row */
      const metaItems = [
        { icon: '📚', label: data.curriculum_alignment || 'General Study' },
        { icon: '🌐', label: data._language || 'English' },
        { icon: '⭐', label: `Score: ${data.study_score || 96}/100` },
        { icon: '📝', label: `${this._wordCount(this._stripMd(data.ultra_long_notes || '')).toLocaleString()} words` },
        { icon: '📅', label: new Date().toLocaleDateString('en-GB', { day:'numeric', month:'long', year:'numeric' }) },
      ];

      doc.setFontSize(8);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(...LIGHT);
      const metaStr = metaItems.map(m => `${m.label}`).join('   ·   ');
      doc.text(metaStr, ml + 4, y);
      y += 6;

      /* Gold divider */
      doc.setDrawColor(...GOLD);
      doc.setLineWidth(0.8);
      doc.line(ml, y, pw - mr, y);
      y += 10;

      /* ── COMPREHENSIVE NOTES SECTION ── */
      if (data.ultra_long_notes) {
        sectionHeading('Comprehensive Analysis', GOLD, CREAM, '▶');

        const noteText = this._stripMd(data.ultra_long_notes);
        const paragraphs = noteText.split('\n\n').filter(Boolean);

        paragraphs.forEach(para => {
          const trimmed = para.trim();
          if (!trimmed) return;

          /* Detect markdown headings */
          if (/^#{1,4} /.test(trimmed)) {
            const headText = trimmed.replace(/^#+\s*/, '');
            checkSpace(12);
            y += 3;
            writeText(headText, 11, true, GOLD_DARK, 0, 1.3);
            y += 1;
          } else if (trimmed.startsWith('**') && trimmed.endsWith('**')) {
            checkSpace(10);
            writeText(trimmed.replace(/\*\*/g, ''), 10.5, true, MID, 0, 1.4);
            y += 1;
          } else if (trimmed.startsWith('- ') || trimmed.startsWith('* ')) {
            const items = trimmed.split('\n').filter(Boolean);
            items.forEach(item => {
              bulletItem(item.replace(/^[-*]\s+/, ''), GOLD);
            });
          } else {
            writeText(trimmed, 9.5, false, DARK, 0, 1.65);
            y += 2.5;
          }
        });
        y += 6;
      }

      /* ── KEY CONCEPTS SECTION ── */
      if (data.key_concepts?.length) {
        sectionHeading('Key Concepts', GOLD, CREAM, '●');

        data.key_concepts.forEach((c, i) => {
          numberedItem(i + 1, c, GOLD);
        });
        y += 5;
      }

      /* ── STUDY TRICKS SECTION ── */
      if (data.key_tricks?.length) {
        sectionHeading('Study Tricks & Memory Aids', AMBER, AMBER_BG, '★');

        data.key_tricks.forEach((t, i) => {
          trickCard(i + 1, t);
        });
        y += 4;
      }

      /* ── PRACTICE QUESTIONS SECTION ── */
      if (data.practice_questions?.length) {
        sectionHeading('Practice Questions & Answers', GREEN, GREEN_BG, '?');

        data.practice_questions.forEach((qa, i) => {
          questionCard(i + 1, qa.question, qa.answer);
        });
        y += 3;
      }

      /* ── REAL-WORLD APPLICATIONS SECTION ── */
      if (data.real_world_applications?.length) {
        sectionHeading('Real-World Applications', BLUE, BLUE_BG, '◆');

        data.real_world_applications.forEach((a, i) => {
          bulletItem(`Application ${i + 1}: ${a}`, BLUE);
        });
        y += 5;
      }

      /* ── COMMON MISCONCEPTIONS SECTION ── */
      if (data.common_misconceptions?.length) {
        sectionHeading('Common Misconceptions to Avoid', RED, RED_BG, '!');

        data.common_misconceptions.forEach((m, i) => {
          bulletItem(`Misconception ${i + 1}: ${m}`, RED);
        });
        y += 5;
      }

      /* ── FINAL BRANDING PAGE ── */
      checkSpace(32);
      y += 8;
      divider();

      /* Final branding box */
      doc.setFillColor(18, 12, 4);
      doc.roundedRect(ml - 2, y - 2, cw + 4, 22, 3, 3, 'F');

      doc.setFillColor(...GOLD);
      doc.rect(ml - 2, y - 2, 4, 22, 'F');

      doc.setFontSize(11);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(...GOLD);
      doc.text('SAVOIRÉ AI v2.0', ml + 8, y + 5);

      doc.setFontSize(8.5);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(160, 135, 90);
      doc.text('Think Less. Know More. — Free for every student on Earth.', ml + 8, y + 10.5);

      doc.setFontSize(7.5);
      doc.setTextColor(120, 100, 68);
      doc.text(`${SAVOIRÉ.DEVELOPER}  ·  ${SAVOIRÉ.DEVSITE}  ·  Founder: ${SAVOIRÉ.FOUNDER}`, ml + 8, y + 16);

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
      const filename = `SavoireAI_${safeTopic}_${new Date().toISOString().slice(0,10)}.pdf`;
      doc.save(filename);

      this._toast('success', 'fa-file-pdf', `✓ PDF downloaded: ${filename}`);

    } catch (err) {
      console.error('[Savoiré PDF error]', err);
      this._toast('error', 'fa-times', `PDF generation failed: ${err.message}`);
    }
  }

  /* ═══════════════════════════════════════════════════════════════════════════
     COPY TO CLIPBOARD
     ═════════════════════════════════════════════════════════════════════════ */
  _copyResult() {
    const data = this.currentData;
    if (!data) { this._toast('info', 'fa-info-circle', 'Nothing to copy yet.'); return; }

    const parts = [];
    if (data.topic)              parts.push(`# ${data.topic}\n`);
    if (data.ultra_long_notes)   parts.push(this._stripMd(data.ultra_long_notes));
    if (data.key_concepts?.length) {
      parts.push('\n\n## Key Concepts\n');
      data.key_concepts.forEach((c, i) => parts.push(`${i+1}. ${c}`));
    }
    if (data.key_tricks?.length) {
      parts.push('\n\n## Study Tricks\n');
      data.key_tricks.forEach((t, i) => parts.push(`${i+1}. ${t}`));
    }
    if (data.practice_questions?.length) {
      parts.push('\n\n## Practice Questions\n');
      data.practice_questions.forEach((qa, i) => {
        parts.push(`Q${i+1}: ${qa.question}`);
        parts.push(`A: ${this._stripMd(qa.answer)}\n`);
      });
    }
    if (data.real_world_applications?.length) {
      parts.push('\n\n## Real-World Applications\n');
      data.real_world_applications.forEach((a, i) => parts.push(`${i+1}. ${a}`));
    }
    if (data.common_misconceptions?.length) {
      parts.push('\n\n## Common Misconceptions\n');
      data.common_misconceptions.forEach((m, i) => parts.push(`${i+1}. ${m}`));
    }
    parts.push(`\n\n---\nGenerated by ${SAVOIRÉ.BRAND} — ${SAVOIRÉ.WEBSITE}`);

    const text = parts.join('\n');
    navigator.clipboard.writeText(text)
      .then(() => this._toast('success', 'fa-check', `Copied ${this._wordCount(text).toLocaleString()} words to clipboard!`))
      .catch(() => {
        /* Fallback */
        const ta = document.createElement('textarea');
        ta.value = text;
        document.body.appendChild(ta);
        ta.select();
        document.execCommand('copy');
        document.body.removeChild(ta);
        this._toast('success', 'fa-check', 'Copied to clipboard!');
      });
  }

  _copySection(text) {
    navigator.clipboard.writeText(text)
      .then(() => this._toast('success', 'fa-check', 'Section copied!'))
      .catch(() => this._toast('error', 'fa-times', 'Copy failed.'));
  }

  /* ═══════════════════════════════════════════════════════════════════════════
     SAVE NOTE
     ═════════════════════════════════════════════════════════════════════════ */
  _saveNote() {
    const data = this.currentData;
    if (!data) { this._toast('info', 'fa-info-circle', 'Nothing to save yet.'); return; }

    /* Check if already saved */
    const existing = this.saved.find(s => s.topic === data.topic && s.tool === this.tool);
    if (existing) {
      this._toast('info', 'fa-star', 'Already saved! View in Saved Notes.'); return;
    }

    if (this.saved.length >= SAVOIRÉ.MAX_SAVED) {
      this._toast('error', 'fa-archive', `Library full (max ${SAVOIRÉ.MAX_SAVED} notes). Delete some first.`); return;
    }

    const note = {
      id:      this._genId(),
      topic:   data.topic || 'Untitled',
      tool:    this.tool,
      data,
      savedAt: Date.now(),
    };

    this.saved.unshift(note);
    this._save('sv_saved', this.saved);
    this._updateHeaderStats();
    this._toast('success', 'fa-star', `Saved: "${note.topic.substring(0, 40)}"!`);
  }

  /* ═══════════════════════════════════════════════════════════════════════════
     SHARE
     ═════════════════════════════════════════════════════════════════════════ */
  _shareResult() {
    const data = this.currentData;
    if (!data) { this._toast('info', 'fa-info-circle', 'Nothing to share yet.'); return; }

    const shareData = {
      title: `${data.topic || 'Study Notes'} — Savoiré AI`,
      text:  `Check out my study notes on "${data.topic}" generated by Savoiré AI — free AI study companion!`,
      url:   `https://${SAVOIRÉ.WEBSITE}`,
    };

    if (navigator.share) {
      navigator.share(shareData).catch(() => this._fallbackShare(shareData));
    } else {
      this._fallbackShare(shareData);
    }
  }

  _fallbackShare(shareData) {
    const url = `${shareData.url}?topic=${encodeURIComponent(shareData.title)}`;
    navigator.clipboard.writeText(url)
      .then(() => this._toast('success', 'fa-link', 'Link copied to clipboard!'))
      .catch(() => this._toast('info', 'fa-info-circle', `Share: ${url}`));
  }

  /* ═══════════════════════════════════════════════════════════════════════════
     CLEAR OUTPUT
     ═════════════════════════════════════════════════════════════════════════ */
  _clearOutput() {
    if (!this.currentData) return;
    this._confirm('Clear the current output? You can always regenerate it.', () => {
      this.currentData = null;
      this._showState('empty');
      this.fcCards = [];
      this.quizData = [];
      this._toast('info', 'fa-trash', 'Output cleared.');
    });
  }

  /* ═══════════════════════════════════════════════════════════════════════════
     HISTORY
     ═════════════════════════════════════════════════════════════════════════ */
  _addToHistory(item) {
    /* Remove duplicate topic for same tool */
    this.history = this.history.filter(h => !(h.topic === item.topic && h.tool === item.tool));

    this.history.unshift(item);
    if (this.history.length > SAVOIRÉ.MAX_HISTORY) {
      this.history = this.history.slice(0, SAVOIRÉ.MAX_HISTORY);
    }
    this._save('sv_history', this.history);
    this._renderSbHistory();
    this._updateHistBadge();
  }

  _renderSbHistory() {
    const list = this._el('lpHistList');
    if (!list) return;

    if (!this.history.length) {
      list.innerHTML = '<div class="lp-hist-empty">No history yet.</div>';
      return;
    }

    const ICONS = { notes:'fa-book-open', flashcards:'fa-layer-group', quiz:'fa-question-circle', summary:'fa-align-left', mindmap:'fa-project-diagram' };
    const items = this.history.slice(0, 6);

    list.innerHTML = items.map(h => `
      <div
        class="lp-hist-item"
        onclick="window._app._loadHistoryItem('${h.id}')"
        role="listitem"
        tabindex="0"
        onkeydown="if(event.key==='Enter')window._app._loadHistoryItem('${h.id}')"
        title="${this._esc((h.topic || '').substring(0, 80))}"
      >
        <i class="fas ${ICONS[h.tool] || 'fa-book'} lp-hist-icon"></i>
        <div class="lp-hist-topic">${this._esc((h.topic || '').substring(0, 32))}</div>
        <div class="lp-hist-time">${this._relTime(h.ts)}</div>
      </div>`).join('');
  }

  _openHistModal() {
    this._renderHistModal();
    this._openModal('histModal');
  }

  _filterHist(query) {
    const active = this._qs('.hf.active')?.dataset?.filter || 'all';
    this._renderHistModal(active, query);
  }

  _renderHistModal(filter = 'all', query = '') {
    const list  = this._el('histList');
    const empty = this._el('histEmpty');
    if (!list) return;

    const ICONS = { notes:'fa-book-open', flashcards:'fa-layer-group', quiz:'fa-question-circle', summary:'fa-align-left', mindmap:'fa-project-diagram' };

    let filtered = this.history;
    if (filter !== 'all') filtered = filtered.filter(h => h.tool === filter);
    if (query)   filtered = filtered.filter(h => (h.topic || '').toLowerCase().includes(query.toLowerCase()));

    if (!filtered.length) {
      list.innerHTML = '';
      if (empty) empty.style.display = 'flex';
      return;
    }
    if (empty) empty.style.display = 'none';

    /* Group by date */
    const groups = {};
    filtered.forEach(h => {
      const g = this._dateGroup(h.ts);
      if (!groups[g]) groups[g] = [];
      groups[g].push(h);
    });

    /* Highlight query in text */
    const hl = (text, q) => {
      if (!q) return this._esc(text || '');
      const regex = new RegExp(`(${q.replace(/[.*+?^${}()|[\]\\]/g,'\\$&')})`, 'gi');
      return this._esc(text || '').replace(regex, '<mark style="background:rgba(201,169,110,.25);border-radius:2px">$1</mark>');
    };

    list.innerHTML = Object.entries(groups).map(([group, items]) => `
      <div class="hist-group-lbl">${group}</div>
      ${items.map(h => {
        const topicHl = hl((h.topic || '').substring(0, 90), query);
        return `
          <div
            class="hist-item"
            onclick="window._app._loadHistory('${h.id}')"
            role="listitem"
            tabindex="0"
            onkeydown="if(event.key==='Enter')window._app._loadHistory('${h.id}')"
            aria-label="Load: ${this._esc((h.topic || '').substring(0, 50))}"
          >
            <div class="hist-tool-av">
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
    this._toast('info', 'fa-history', `Loaded: ${(h.topic || '').substring(0, 40)}`);
  }

  _loadHistoryItem(id) {
    this._loadHistory(id);
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

    const ICONS = { notes:'fa-book-open', flashcards:'fa-layer-group', quiz:'fa-question-circle', summary:'fa-align-left', mindmap:'fa-project-diagram' };

    list.innerHTML = this.saved.map(s => `
      <div
        class="hist-item"
        onclick="window._app._loadSaved('${s.id}')"
        role="listitem"
        tabindex="0"
        onkeydown="if(event.key==='Enter')window._app._loadSaved('${s.id}')"
      >
        <div class="hist-tool-av">
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
            title="Delete"
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
    this._toast('success', 'fa-star', `Loaded: ${(s.topic || '').substring(0, 40)}`);
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
    const ni = this._el('nameInput');
    if (ni) ni.value = this.userName;

    const theme = document.documentElement.dataset.theme || 'dark';
    this._qsa('[data-theme-btn]').forEach(b => {
      b.classList.toggle('active', b.dataset.themeBtn === theme);
      b.setAttribute('aria-pressed', String(b.dataset.themeBtn === theme));
    });

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
      const wordsGen  = this.history.reduce((a, h) => a + this._wordCount(this._stripMd(h.data?.ultra_long_notes || '')), 0);

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
          <span class="ds-val">${wordsGen.toLocaleString()}</span>
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
      const isOpen = lp.classList.toggle('mobile-open');
      this._el('sbBackdrop')?.classList.toggle('visible', isOpen);
      this._el('sbToggle')?.setAttribute('aria-expanded', String(isOpen));
    } else {
      const isCollapsed = lp.classList.toggle('collapsed');
      this._el('sbToggle')?.setAttribute('aria-expanded', String(!isCollapsed));
      const sfp = this._el('streamFullpage');
      if (sfp) sfp.classList.toggle('panel-open', !isCollapsed);
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
    if (window.innerWidth > 768) this._closeMobileSidebar();
  }

  /* ═══════════════════════════════════════════════════════════════════════════
     FOCUS MODE
     ═════════════════════════════════════════════════════════════════════════ */
  _toggleFocusMode() {
    this.focusMode = !this.focusMode;
    const lp  = this._el('leftPanel');
    const btn = this._el('focusModeBtn');

    if (this.focusMode) {
      if (lp)  lp.classList.add('collapsed');
      if (btn) {
        btn.innerHTML = '<i class="fas fa-compress-alt" aria-hidden="true"></i><span>Exit Focus</span>';
        btn.title     = 'Exit focus mode';
      }
      this._toast('info', 'fa-expand-alt', 'Focus mode on — sidebar hidden.');
    } else {
      if (lp)  lp.classList.remove('collapsed');
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
    setTimeout(() => {
      const focusable = el.querySelector('input, button, [tabindex]');
      if (focusable) focusable.focus();
    }, 100);
  }

  _closeModal(id) {
    const el = this._el(id);
    if (!el) return;
    el.style.display = 'none';
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
  _toast(type, icon, msg, dur = 4200) {
    const container = this._el('toastContainer');
    if (!container) return;

    /* Max 4 toasts */
    while (container.children.length >= 4) {
      container.removeChild(container.firstChild);
    }

    const t       = document.createElement('div');
    t.className   = `toast ${type}`;
    t.innerHTML   = `<i class="fas ${icon}" aria-hidden="true"></i><span>${this._esc(msg)}</span>`;
    t.setAttribute('role', 'alert');
    t.setAttribute('aria-live', 'polite');

    t.addEventListener('click', () => {
      t.classList.add('removing');
      setTimeout(() => t.remove(), 300);
    });

    container.appendChild(t);

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
  window._sav = window._app;

  /* Global helpers for suggestion pill onclick attributes */
  window.setSugg = (topic) => {
    const el = document.getElementById('mainInput');
    if (!el) return;
    el.value = topic;
    el.dispatchEvent(new Event('input'));
    el.focus();
    el.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  };

  /* Console welcome */
  console.log('%c📚 Welcome to Savoiré AI v2.0', 'color:#C9A96E;font-size:14px;font-weight:bold');
  console.log('%cBuilt by Sooban Talha Technologies | soobantalhatech.xyz', 'color:#756D63;font-size:11px');
  console.log('%cUpgraded: Live markdown rendering · World-class quiz · Premium PDF', 'color:#42C98A;font-size:10px');
});

/* ═══════════════════════════════════════════════════════════════════════════════
   END OF FILE — app.js v2.1
   Savoiré AI v2.0 — Built by Sooban Talha Technologies | soobantalhatech.xyz
   Founder: Sooban Talha | Free for every student on Earth, forever.
   ═══════════════════════════════════════════════════════════════════════════════ */
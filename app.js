'use strict';
/* =====================================================================
   SAVOIRÉ AI v2.0 — FRONTEND (app.js)
   Built by Sooban Talha Technologies | savoireai.vercel.app
   Founder: Sooban Talha

   ALL element IDs match dashboard.html exactly:
   - runBtn          → Generate button
   - mainInput       → Textarea
   - depthSel        → Depth dropdown
   - langSel         → Language dropdown
   - styleSel        → Style dropdown
   - sbToggle        → Sidebar toggle
   - histBtn         → History button
   - themeBtn        → Theme toggle
   - settingsBtn     → Settings button
   - avBtn           → Avatar button
   - copyBtn         → Copy output
   - pdfBtn          → Download PDF
   - saveBtn         → Save note
   - shareBtn        → Share
   - clearBtn        → Clear output
   - outArea         → Output scroll container
   - emptyState      → Empty placeholder
   - thinkingWrap    → Loading card
   - resultArea      → Where results render
   - leftPanel       → Sidebar
   - ts0..ts4        → Thinking stages
   - histBadge       → History count badge
   ===================================================================== */

class SavoireApp {
  constructor() {
    this.VERSION   = '2.0';
    this.BRAND     = 'Savoiré AI v2.0';
    this.DEVELOPER = 'Sooban Talha Technologies';
    this.WEBSITE   = 'savoireai.vercel.app';

    this.tool        = 'notes';
    this.generating  = false;
    this.currentData = null;
    this.userName    = '';
    this.confirmCb   = null;
    this.thinkTimer  = null;
    this.stageIdx    = 0;
    this.fcCards     = [];
    this.fcCurrent   = 0;
    this.fcFlipped   = false;
    this.quizData    = [];
    this.quizScore   = 0;

    this.history = this._load('sv_history', []);
    this.saved   = this._load('sv_saved',   []);
    this.prefs   = this._load('sv_prefs',   {});
    this.userName = localStorage.getItem('sv_user') || '';

    this._boot();
  }

  /* ─── BOOT ─────────────────────────────────────────────────────── */
  _boot() {
    this._bindAll();
    this._applyPrefs();
    this._initWelcome();
    this._updateHistBadge();
    this._renderSbHistory();
    console.log(`%c✨ ${this.BRAND} — Think Less. Know More.`, 'color:#C9A96E;font-size:16px;font-weight:bold');
    console.log(`%cBuilt by ${this.DEVELOPER} | ${this.WEBSITE}`, 'color:#C9A96E;font-size:12px');
  }

  /* ─── HELPERS ───────────────────────────────────────────────────── */
  _el(id)        { return document.getElementById(id); }
  _qs(sel)       { return document.querySelector(sel); }
  _qsa(sel)      { return document.querySelectorAll(sel); }
  _on(id, ev, fn){ const el = this._el(id); if (el) el.addEventListener(ev, fn); }

  _load(key, def) {
    try { const v = localStorage.getItem(key); return v ? JSON.parse(v) : def; }
    catch (e) { return def; }
  }
  _save(key, val) {
    try { localStorage.setItem(key, JSON.stringify(val)); } catch (e) {}
  }

  _esc(s) {
    if (!s) return '';
    return String(s)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;')
      .replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#039;');
  }

  _relTime(ts) {
    if (!ts) return '';
    const d = Date.now() - ts;
    const m = Math.floor(d / 60000);
    const h = Math.floor(d / 3600000);
    const day = Math.floor(d / 86400000);
    if (m < 1)   return 'just now';
    if (m < 60)  return `${m}m ago`;
    if (h < 24)  return `${h}h ago`;
    return `${day}d ago`;
  }

  _genId() { return Date.now().toString(36) + Math.random().toString(36).slice(2); }

  _shuffle(arr) {
    const a = [...arr];
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  }

  _renderMd(text) {
    if (!text) return '';
    if (window.marked && window.DOMPurify) {
      return DOMPurify.sanitize(marked.parse(text));
    }
    // fallback
    return text
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
      .replace(/^###\s(.+)$/gm, '<h3>$1</h3>')
      .replace(/^##\s(.+)$/gm,  '<h2>$1</h2>')
      .replace(/^#\s(.+)$/gm,   '<h1>$1</h1>')
      .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.+?)\*/g,     '<em>$1</em>')
      .replace(/`(.+?)`/g,       '<code>$1</code>')
      .replace(/^>\s(.+)$/gm,    '<blockquote>$1</blockquote>')
      .replace(/^[-*]\s(.+)$/gm, '<li>$1</li>')
      .replace(/\n\n/g, '</p><p>')
      .replace(/\n/g,   '<br>');
  }

  _stripMd(t) {
    if (!t) return '';
    return t
      .replace(/#{1,6}\s/g, '')
      .replace(/\*\*(.+?)\*\*/g, '$1')
      .replace(/\*(.+?)\*/g, '$1')
      .replace(/`(.+?)`/g, '$1')
      .replace(/^[-*]\s/gm, '')
      .replace(/^\d+\.\s/gm, '')
      .trim();
  }

  /* ─── BIND ALL EVENTS ───────────────────────────────────────────── */
  _bindAll() {

    /* Welcome overlay */
    this._on('welcomeBtn',       'click',   () => this._submitWelcome());
    this._on('welcomeNameInput', 'keydown', e  => { if (e.key === 'Enter') this._submitWelcome(); });

    /* Header buttons — match dashboard.html IDs */
    this._on('sbToggle',    'click', () => this._toggleSidebar());
    this._on('histBtn',     'click', () => this._openHistModal());
    this._on('themeBtn',    'click', () => this._toggleTheme());
    this._on('settingsBtn', 'click', () => this._openSettingsModal());
    this._on('avBtn',       'click', e  => { e.stopPropagation(); this._toggleDropdown(); });

    /* Avatar dropdown */
    this._on('avHist',     'click', () => { this._closeDropdown(); this._openHistModal(); });
    this._on('avSaved',    'click', () => { this._closeDropdown(); this._openSavedModal(); });
    this._on('avSettings', 'click', () => { this._closeDropdown(); this._openSettingsModal(); });
    this._on('avClear',    'click', () => {
      this._closeDropdown();
      this._confirm('Clear ALL data? This cannot be undone.', () => this._clearAllData());
    });
    document.addEventListener('click', () => this._closeDropdown());

    /* Tool selector items (sidebar .ts-item) */
    this._qsa('.ts-item').forEach(btn => {
      btn.addEventListener('click', () => this._setTool(btn.dataset.tool));
    });

    /* ── THE GENERATE BUTTON ── id="runBtn" in dashboard.html */
    this._on('runBtn', 'click', () => this._send());

    /* Textarea — Enter to send, input to count */
    this._on('mainInput', 'input',   () => this._updateCharCount());
    this._on('mainInput', 'keydown', e  => {
      if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); this._send(); }
    });

    /* File upload */
    this._on('uploadZone', 'click',  () => this._el('fileInput')?.click());
    this._on('fileInput',  'change', e  => this._handleFile(e.target.files[0]));
    this._on('fileChipRm', 'click',  () => this._removeFile());

    /* Drag-and-drop on upload zone */
    const dz = this._el('uploadZone');
    if (dz) {
      dz.addEventListener('dragover',  e => { e.preventDefault(); dz.style.borderColor = 'var(--gold)'; });
      dz.addEventListener('dragleave', ()=> { dz.style.borderColor = ''; });
      dz.addEventListener('drop',      e => {
        e.preventDefault(); dz.style.borderColor = '';
        const f = e.dataTransfer.files[0];
        if (f) this._handleFile(f);
      });
    }

    /* Output toolbar */
    this._on('copyBtn',  'click', () => this._copyResult());
    this._on('pdfBtn',   'click', () => this._downloadPDF());
    this._on('saveBtn',  'click', () => this._saveNote());
    this._on('shareBtn', 'click', () => this._shareResult());
    this._on('clearBtn', 'click', () => this._clearOutput());

    /* Sidebar sub-buttons */
    this._on('lpHistAll', 'click', () => this._openHistModal());

    /* History modal */
    this._on('histSearchInput', 'input', e  => this._filterHist(e.target.value));
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
    this._qsa('.hf').forEach(btn => {
      btn.addEventListener('click', () => {
        this._qsa('.hf').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        this._renderHistModal(btn.dataset.filter, this._el('histSearchInput')?.value || '');
      });
    });

    /* Settings modal */
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

    /* Modal close — [data-close] attribute and .modal-close buttons */
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

    /* Confirm modal */
    this._on('confirmOkBtn', 'click', () => {
      this._closeModal('confirmModal');
      if (typeof this.confirmCb === 'function') this.confirmCb();
      this.confirmCb = null;
    });

    /* Keyboard shortcuts */
    document.addEventListener('keydown', e => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') { e.preventDefault(); this._el('mainInput')?.focus(); }
      if ((e.ctrlKey || e.metaKey) && e.key === 'h') { e.preventDefault(); this._openHistModal(); }
      if (e.key === 'Escape') this._closeAllModals();
      if (this.fcCards.length > 0) {
        if (e.key === ' ')           { e.preventDefault(); this._fcFlip(); }
        if (e.key === 'ArrowLeft')    this._fcNav(-1);
        if (e.key === 'ArrowRight')   this._fcNav(1);
      }
    });

    window.addEventListener('resize', () => this._handleResize());
  }

  /* ─── WELCOME ───────────────────────────────────────────────────── */
  _initWelcome() {
    const overlay = this._el('welcomeOverlay');
    if (this.userName && this.userName.length >= 2) {
      if (overlay) overlay.style.display = 'none';
      this._updateUserUI();
    } else {
      if (overlay) { overlay.style.display = 'flex'; }
      setTimeout(() => this._el('welcomeNameInput')?.focus(), 400);
    }
  }

  _submitWelcome() {
    const inp  = this._el('welcomeNameInput');
    const errEl = this._el('welcomeErr');
    const name  = inp?.value?.trim() || '';
    if (!name || name.length < 2) {
      if (errEl) errEl.textContent = 'Please enter your name (at least 2 characters).';
      inp?.focus();
      return;
    }
    if (errEl) errEl.textContent = '';
    this.userName = name;
    localStorage.setItem('sv_user', name);

    const overlay = this._el('welcomeOverlay');
    if (overlay) {
      overlay.style.opacity = '0';
      overlay.style.transition = 'opacity .4s ease';
      setTimeout(() => { overlay.style.display = 'none'; overlay.style.opacity = ''; }, 420);
    }
    this._updateUserUI();
    this._toast('success', 'fa-check', `Welcome to Savoiré AI, ${name}! 🎓`);
  }

  _updateUserUI() {
    const ini = (this.userName || 'S').charAt(0).toUpperCase();
    ['avLetter', 'avDropAv', 'avDropName'].forEach(id => {
      const el = this._el(id);
      if (!el) return;
      if (id === 'avDropName') el.textContent = this.userName || 'Scholar';
      else el.textContent = ini;
    });
    const gr = this._el('dhGreeting');
    if (gr) gr.textContent = this.userName ? `Welcome, ${this.userName} 👋` : 'Think Less. Know More.';
  }

  /* ─── TOOL SELECTION ────────────────────────────────────────────── */
  _setTool(tool) {
    this.tool = tool;

    // Sync .ts-item sidebar buttons
    this._qsa('.ts-item').forEach(b => b.classList.toggle('active', b.dataset.tool === tool));

    // Update run button label & icon
    const ICONS = {
      notes:      'fa-book-open',
      flashcards: 'fa-layer-group',
      quiz:       'fa-question-circle',
      summary:    'fa-align-left',
      mindmap:    'fa-project-diagram',
    };
    const LABELS = {
      notes:      'Generate Notes',
      flashcards: 'Create Flashcards',
      quiz:       'Build Quiz',
      summary:    'Summarize',
      mindmap:    'Build Mind Map',
    };
    const PLACEHOLDERS = {
      notes:      'Enter any topic, concept, or paste text for comprehensive study notes…',
      flashcards: 'Enter a topic to create interactive flashcards…',
      quiz:       'Enter a topic to generate a practice quiz with answers…',
      summary:    'Enter a topic or paste text to create a concise summary…',
      mindmap:    'Enter a topic to build a structured mind map…',
    };

    const iconEl = this._el('runIcon');
    const lblEl  = this._el('runLabel');
    const taEl   = this._el('mainInput');

    if (iconEl) iconEl.className = `fas ${ICONS[tool] || 'fa-book-open'}`;
    if (lblEl)  lblEl.textContent = LABELS[tool] || 'Generate';
    if (taEl)   taEl.placeholder  = PLACEHOLDERS[tool] || 'Enter topic…';

    this.prefs.lastTool = tool;
    this._save('sv_prefs', this.prefs);
  }

  /* ─── SEND / GENERATE ───────────────────────────────────────────── */
  async _send() {
    const input = this._el('mainInput');
    const text  = input?.value?.trim();

    if (!text) {
      this._toast('info', 'fa-info-circle', 'Please enter a topic or paste some text first.');
      input?.focus();
      return;
    }
    if (this.generating) {
      this._toast('warning', 'fa-hourglass-half', 'Please wait — generation is in progress.');
      return;
    }

    const depth = this._el('depthSel')?.value  || 'detailed';
    const lang  = this._el('langSel')?.value   || 'English';
    const style = this._el('styleSel')?.value  || 'simple';

    // Hide empty state, show thinking
    this._showState('thinking');
    this.generating = true;
    this._setRunLoading(true);

    try {
      const data = await this._callAPI(text, { depth, language: lang, style, tool: this.tool });
      this.currentData = data;
      this._renderResult(data);
      this._addToHistory({ id: this._genId(), topic: data.topic || text, tool: this.tool, data, ts: Date.now() });
      this._toast('success', 'fa-check-circle', 'Study materials ready!');
    } catch (err) {
      this._showState('error', err.message || 'Something went wrong. Please try again.');
      this._toast('error', 'fa-exclamation-circle', err.message || 'Generation failed. Please try again.');
    } finally {
      this.generating = false;
      this._setRunLoading(false);
      this._hideThinking();
    }
  }

  async _callAPI(message, opts = {}) {
    // No client-side AbortController — let the server handle timing
    // The server has 5-minute maxDuration on Vercel
    const res = await fetch('/api/study', {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ message, options: opts }),
    });
    if (!res.ok) throw new Error(`Server error (${res.status}). Please try again.`);
    const data = await res.json();
    if (data.error) throw new Error(data.error);
    return data;
  }

  /* ─── UI STATE MANAGEMENT ───────────────────────────────────────── */
  _showState(state, errorMsg) {
    const empty    = this._el('emptyState');
    const thinking = this._el('thinkingWrap');
    const result   = this._el('resultArea');

    if (empty)    empty.style.display    = 'none';
    if (thinking) thinking.style.display = 'none';
    if (result)   result.style.display   = 'none';

    if (state === 'thinking') {
      if (thinking) thinking.style.display = 'block';
      this._startThinkingStages();
      this._scrollOutArea();
    } else if (state === 'result') {
      if (result) result.style.display = 'block';
      this._scrollOutArea();
    } else if (state === 'error') {
      if (result) {
        result.style.display  = 'block';
        result.innerHTML = `
          <div style="background:rgba(239,68,68,.08);border:1px solid rgba(239,68,68,.3);border-radius:12px;padding:20px 22px;">
            <div style="font-weight:600;color:#F87171;margin-bottom:8px;display:flex;align-items:center;gap:8px">
              <i class="fas fa-exclamation-circle"></i> Generation Failed
            </div>
            <div style="font-family:var(--fb);color:var(--t1);line-height:1.7;margin-bottom:10px">${this._esc(errorMsg)}</div>
            <div style="font-size:.82rem;color:var(--t3)">The AI models may be temporarily busy. Please wait a moment and try again — the system will keep trying all available models.</div>
          </div>`;
        this._scrollOutArea();
      }
    } else if (state === 'empty') {
      if (empty) empty.style.display = 'flex';
    }
  }

  _hideThinking() {
    const el = this._el('thinkingWrap');
    if (el) el.style.display = 'none';
    if (this.thinkTimer) { clearInterval(this.thinkTimer); this.thinkTimer = null; }
  }

  _setRunLoading(on) {
    const btn  = this._el('runBtn');
    const icon = this._el('runIcon');
    const lbl  = this._el('runLabel');
    if (!btn) return;
    btn.disabled = on;
    if (icon) icon.className = on ? 'fas fa-spinner fa-spin' : `fas fa-${({notes:'book-open',flashcards:'layer-group',quiz:'question-circle',summary:'align-left',mindmap:'project-diagram'}[this.tool]||'book-open')}`;
    if (lbl)  lbl.textContent = on ? 'Generating…' : ({notes:'Generate Notes',flashcards:'Create Flashcards',quiz:'Build Quiz',summary:'Summarize',mindmap:'Build Mind Map'}[this.tool] || 'Generate');
  }

  _scrollOutArea() {
    const oa = this._el('outArea');
    if (oa) setTimeout(() => { oa.scrollTop = oa.scrollHeight; }, 80);
  }

  /* ─── THINKING STAGES ───────────────────────────────────────────── */
  _startThinkingStages() {
    this.stageIdx = 0;
    for (let i = 0; i < 5; i++) {
      const el = this._el(`ts${i}`);
      if (el) el.className = 'ths';
    }
    const first = this._el('ts0');
    if (first) first.classList.add('active');

    this.thinkTimer = setInterval(() => {
      this.stageIdx++;
      if (this.stageIdx < 5) {
        const prev = this._el(`ts${this.stageIdx - 1}`);
        const cur  = this._el(`ts${this.stageIdx}`);
        if (prev) { prev.classList.remove('active'); prev.classList.add('done'); }
        if (cur)  cur.classList.add('active');
      }
    }, 3200);
  }

  /* ─── RESULT RENDERING ──────────────────────────────────────────── */
  _renderResult(data) {
    const area = this._el('resultArea');
    if (!area) return;
    area.innerHTML = this._buildHTML(data);
    this._showState('result');

    // Init interactive features after DOM is ready
    if (this.tool === 'flashcards') this._fcInit(data);
    if (this.tool === 'quiz')       this._quizInit(data);
  }

  _buildHTML(data) {
    const topic = this._esc(data.topic || 'Study Material');
    const score = data.study_score || 96;
    const pct   = Math.min(100, Math.max(0, score));

    const header = `
      <div class="result-hdr">
        <div class="rh-left">
          <div class="rh-topic">${topic}</div>
          <div class="rh-meta">
            <div class="rh-mi"><i class="fas fa-graduation-cap"></i>${this._esc(data.curriculum_alignment || 'General Study')}</div>
            <div class="rh-mi"><i class="fas fa-calendar-alt"></i>${new Date().toLocaleDateString()}</div>
            <div class="rh-mi"><i class="fas fa-star"></i>Score: ${score}/100</div>
            ${data._language ? `<div class="rh-mi"><i class="fas fa-globe"></i>${this._esc(data._language)}</div>` : ''}
          </div>
          <div class="rh-powered">Powered by <strong>${this.BRAND}</strong> &nbsp;·&nbsp; ${this.DEVELOPER} &nbsp;·&nbsp; ${this.WEBSITE}</div>
        </div>
        <div class="rh-score" style="--pct:${pct}"><div class="rh-score-val">${score}</div></div>
      </div>`;

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
        <button class="exp-btn pdf"   onclick="window._app._downloadPDF()"><i class="fas fa-file-pdf"></i>Download PDF</button>
        <button class="exp-btn copy"  onclick="window._app._copyResult()"><i class="fas fa-copy"></i>Copy Text</button>
        <button class="exp-btn save"  onclick="window._app._saveNote()"><i class="fas fa-star"></i>Save Note</button>
        <button class="exp-btn share" onclick="window._app._shareResult()"><i class="fas fa-share-alt"></i>Share</button>
        <span class="exp-brand">${this.BRAND} &nbsp;·&nbsp; ${this.DEVELOPER}</span>
      </div>`;

    return `<div class="result-wrap">${header}${body}${exportBar}</div>`;
  }

  /* ─── NOTES HTML ────────────────────────────────────────────────── */
  _buildNotesHTML(data) {
    let h = '';

    if (data.ultra_long_notes) {
      h += `
        <div class="study-sec">
          <div class="ss-hdr"><div class="ss-title"><i class="fas fa-book-open"></i> Comprehensive Analysis</div></div>
          <div class="ss-body"><div class="md-content">${this._renderMd(data.ultra_long_notes)}</div></div>
        </div>`;
    }

    if (data.key_concepts?.length) {
      const cards = data.key_concepts.map((c, i) => `
        <div class="concept-card">
          <div class="concept-num">${i + 1}</div>
          <div class="concept-text">${this._esc(c)}</div>
        </div>`).join('');
      h += `
        <div class="study-sec">
          <div class="ss-hdr"><div class="ss-title"><i class="fas fa-lightbulb"></i> Key Concepts</div></div>
          <div class="ss-body"><div class="concepts-grid">${cards}</div></div>
        </div>`;
    }

    if (data.key_tricks?.length) {
      const ICONS = ['fas fa-magic', 'fas fa-star', 'fas fa-bolt', 'fas fa-key'];
      const items = data.key_tricks.map((t, i) => `
        <div class="trick-item">
          <div class="trick-icon"><i class="${ICONS[i] || 'fas fa-magic'}"></i></div>
          <div class="trick-text">${this._esc(t)}</div>
        </div>`).join('');
      h += `
        <div class="study-sec">
          <div class="ss-hdr"><div class="ss-title"><i class="fas fa-magic"></i> Study Tricks &amp; Tips</div></div>
          <div class="ss-body"><div class="tricks-list">${items}</div></div>
        </div>`;
    }

    if (data.practice_questions?.length) {
      const qs = data.practice_questions.map((qa, i) => `
        <div class="qa-card">
          <div class="qa-head" onclick="
            this.nextElementSibling.classList.toggle('visible');
            this.querySelector('.qa-toggle').classList.toggle('open');
          ">
            <div class="qa-num">${i + 1}</div>
            <div class="qa-q">${this._esc(qa.question)}</div>
            <button class="qa-toggle"><i class="fas fa-chevron-down"></i> Answer</button>
          </div>
          <div class="qa-answer">
            <div class="qa-albl"><i class="fas fa-check-circle"></i> Answer &amp; Explanation</div>
            <div class="qa-answer-inner">${this._esc(qa.answer)}</div>
          </div>
        </div>`).join('');
      h += `
        <div class="study-sec">
          <div class="ss-hdr"><div class="ss-title"><i class="fas fa-pen-alt"></i> Practice Questions</div></div>
          <div class="ss-body"><div class="qa-list">${qs}</div></div>
        </div>`;
    }

    if (data.real_world_applications?.length) {
      const items = data.real_world_applications.map(a => `
        <div class="list-item app">
          <i class="fas fa-globe li-ico" style="color:var(--em2,#42C98A)"></i>
          <div class="li-text">${this._esc(a)}</div>
        </div>`).join('');
      h += `
        <div class="study-sec">
          <div class="ss-hdr"><div class="ss-title"><i class="fas fa-globe"></i> Real World Applications</div></div>
          <div class="ss-body"><div class="items-list">${items}</div></div>
        </div>`;
    }

    if (data.common_misconceptions?.length) {
      const items = data.common_misconceptions.map(m => `
        <div class="list-item misc">
          <i class="fas fa-exclamation-triangle li-ico" style="color:#F87171"></i>
          <div class="li-text">${this._esc(m)}</div>
        </div>`).join('');
      h += `
        <div class="study-sec">
          <div class="ss-hdr"><div class="ss-title"><i class="fas fa-exclamation-triangle"></i> Common Misconceptions</div></div>
          <div class="ss-body"><div class="items-list">${items}</div></div>
        </div>`;
    }

    return h || `<div style="padding:20px;color:var(--t3);font-family:var(--fb)">Content generated. ${data._fallback ? '(Offline fallback mode — check your API key on Vercel)' : ''}</div>`;
  }

  /* ─── FLASHCARDS HTML ───────────────────────────────────────────── */
  _buildFcHTML(data) {
    const cards = [];
    (data.key_concepts || []).forEach(c => {
      const p = c.split(':');
      cards.push({ q: (p[0] || c).trim(), a: p.slice(1).join(':').trim() || c });
    });
    (data.practice_questions || []).forEach(qa => cards.push({ q: qa.question, a: qa.answer }));
    this.fcCards   = cards;
    this.fcCurrent = 0;
    this.fcFlipped = false;
    const total = cards.length;
    const first = cards[0] || { q: 'No cards', a: '' };
    return `
      <div class="study-sec">
        <div class="ss-hdr"><div class="ss-title"><i class="fas fa-layer-group"></i> Interactive Flashcards (${total} cards)</div></div>
        <div class="ss-body">
          <div class="fc-mode">
            <div class="fc-prog">Card <span id="fcCur">1</span> of <span id="fcTot">${total}</span></div>
            <div class="fc-wrap" onclick="window._app._fcFlip()" title="Click to flip">
              <div class="flashcard" id="theCard">
                <div class="fc-face fc-front">
                  <div class="fc-lbl">Question / Concept</div>
                  <div class="fc-content" id="fcFront">${this._esc(first.q)}</div>
                  <div class="fc-hint">Click to flip · Space key</div>
                </div>
                <div class="fc-face fc-back">
                  <div class="fc-lbl">Answer / Explanation</div>
                  <div class="fc-content" id="fcBack">${this._esc(first.a)}</div>
                </div>
              </div>
            </div>
            <div class="fc-controls">
              <button class="fc-btn" id="fcPrev" onclick="window._app._fcNav(-1)" ${total <= 1 ? 'disabled' : ''}><i class="fas fa-arrow-left"></i> Prev</button>
              <button class="fc-btn primary" onclick="window._app._fcFlip()"><i class="fas fa-sync-alt"></i> Flip</button>
              <button class="fc-btn" id="fcNext" onclick="window._app._fcNav(1)" ${total <= 1 ? 'disabled' : ''}>Next <i class="fas fa-arrow-right"></i></button>
            </div>
            <div class="fc-kb"><kbd>Space</kbd> flip &nbsp;·&nbsp; <kbd>←</kbd><kbd>→</kbd> navigate</div>
          </div>
        </div>
      </div>`;
  }

  _fcInit() { /* already set up via fcCards in _buildFcHTML */ }

  _fcFlip() {
    const fc = this._el('theCard');
    if (!fc) return;
    this.fcFlipped = !this.fcFlipped;
    fc.classList.toggle('flipped', this.fcFlipped);
  }

  _fcNav(dir) {
    if (!this.fcCards.length) return;
    this.fcCurrent = Math.max(0, Math.min(this.fcCards.length - 1, this.fcCurrent + dir));
    this.fcFlipped = false;
    const fc = this._el('theCard');
    if (fc) fc.classList.remove('flipped');
    const card = this.fcCards[this.fcCurrent];
    const fe   = this._el('fcFront');
    const be   = this._el('fcBack');
    const cn   = this._el('fcCur');
    if (fe) fe.textContent = card.q;
    if (be) be.textContent = card.a;
    if (cn) cn.textContent = this.fcCurrent + 1;
    const pb = this._el('fcPrev');
    const nb = this._el('fcNext');
    if (pb) pb.disabled = (this.fcCurrent === 0);
    if (nb) nb.disabled = (this.fcCurrent === this.fcCards.length - 1);
  }

  /* ─── QUIZ HTML ─────────────────────────────────────────────────── */
  _buildQuizHTML(data) {
    const qs = (data.practice_questions || []).slice(0, 5);
    this.quizData  = qs;
    this.quizScore = 0;
    if (!qs.length) return '<div class="study-sec"><div class="ss-body" style="color:var(--t3);font-family:var(--fb)">No quiz questions available.</div></div>';
    return `
      <div class="study-sec">
        <div class="ss-hdr"><div class="ss-title"><i class="fas fa-question-circle"></i> Practice Quiz — ${qs.length} Questions</div></div>
        <div class="ss-body">
          <div class="quiz-mode">
            <div class="quiz-pb-wrap"><div class="quiz-pb-fill" id="quizPB" style="width:0%"></div></div>
            <div id="quizArea">${this._buildQCard(qs, 0)}</div>
          </div>
        </div>
      </div>`;
  }

  _buildQCard(qs, idx) {
    const qa = qs[idx];
    if (!qa) return '';
    const correct = this._esc((qa.answer || '').substring(0, 90) + '…');
    const wrongs  = [
      'This relies on indirect mechanisms that work through external environmental factors only.',
      'The opposite interpretation applies — the effect is prior to the cause in this model.',
      'This was historically accurate but is no longer considered valid by current consensus.',
    ];
    const opts = this._shuffle([{ t: correct, ok: true }, ...wrongs.map(w => ({ t: w, ok: false }))]);
    const optsHTML = opts.map((o, i) => `
      <button class="quiz-opt" data-ok="${o.ok}"
        onclick="window._app._pickOpt(this, ${idx})">
        <span class="qol">${String.fromCharCode(65 + i)}</span>
        ${o.t}
      </button>`).join('');
    return `
      <div class="quiz-q-card" id="qCard${idx}">
        <div class="quiz-q-num">Question ${idx + 1} of ${qs.length}</div>
        <div class="quiz-q-text">${this._esc(qa.question)}</div>
        <div class="quiz-opts">${optsHTML}</div>
      </div>`;
  }

  _quizInit() { /* state set in _buildQuizHTML */ }

  _pickOpt(btn, idx) {
    const card = btn.closest('.quiz-q-card');
    if (!card) return;
    card.querySelectorAll('.quiz-opt').forEach(b => {
      b.disabled = true;
      if (b.dataset.ok === 'true') b.classList.add('correct');
    });
    if (btn.dataset.ok !== 'true') btn.classList.add('wrong');
    else this.quizScore++;

    const answered = idx + 1;
    const total    = this.quizData.length;
    const pb = this._el('quizPB');
    if (pb) pb.style.width = `${(answered / total) * 100}%`;

    setTimeout(() => {
      const area = this._el('quizArea');
      if (!area) return;
      if (answered >= total) {
        const pct = Math.round((this.quizScore / total) * 100);
        const msg = pct >= 80 ? '🎉 Excellent!' : pct >= 60 ? '👍 Good effort!' : '📚 Keep studying!';
        area.innerHTML = `
          <div class="quiz-result">
            <div class="qr-title">Quiz Complete!</div>
            <div class="qr-score">${this.quizScore}/${total}</div>
            <div class="qr-msg">${pct}% correct &nbsp;·&nbsp; ${msg}</div>
            <div class="qr-btns">
              <button class="btn btn-ghost" onclick="window._app._retryQuiz()"><i class="fas fa-redo"></i> Try Again</button>
              <button class="btn btn-primary" onclick="window._app._setTool('notes');document.getElementById('mainInput').focus()">
                <i class="fas fa-book-open"></i> Study Notes
              </button>
            </div>
          </div>`;
      } else {
        area.innerHTML = this._buildQCard(this.quizData, idx + 1);
      }
    }, 950);
  }

  _retryQuiz() {
    this.quizScore = 0;
    const pb = this._el('quizPB');
    if (pb) pb.style.width = '0%';
    const area = this._el('quizArea');
    if (area) area.innerHTML = this._buildQCard(this.quizData, 0);
  }

  /* ─── SUMMARY HTML ──────────────────────────────────────────────── */
  _buildSummaryHTML(data) {
    const notes = data.ultra_long_notes || '';
    const tldr  = this._esc(this._stripMd(notes).substring(0, 450) + '…');
    const pts   = (data.key_concepts || []).map((c, i) => `
      <div class="sum-pt"><span class="spt-num">${i + 1}</span><span>${this._esc(c)}</span></div>`).join('');
    const full  = notes ? `
      <div class="study-sec">
        <div class="ss-hdr"><div class="ss-title"><i class="fas fa-book-open"></i> Full Notes</div></div>
        <div class="ss-body"><div class="md-content">${this._renderMd(notes)}</div></div>
      </div>` : '';
    return `
      <div class="study-sec">
        <div class="ss-hdr"><div class="ss-title"><i class="fas fa-align-left"></i> Smart Summary</div></div>
        <div class="ss-body">
          <div class="sum-tldr">
            <div class="sum-tldr-lbl">TL;DR</div>
            <div class="sum-tldr-text">${tldr}</div>
          </div>
          <div class="sum-points">${pts}</div>
        </div>
      </div>${full}`;
  }

  /* ─── MINDMAP HTML ──────────────────────────────────────────────── */
  _buildMindmapHTML(data) {
    const topic    = data.topic || 'Topic';
    const concepts = data.key_concepts || [];
    const tricks   = data.key_tricks || [];
    const apps     = data.real_world_applications || [];
    const misc     = data.common_misconceptions || [];

    const branch = (title, icon, items) => {
      if (!items.length) return '';
      const its = items.map(i => `<div class="mm-item">${this._esc((i.split(':')[0] || i).trim())}</div>`).join('');
      return `<div class="mm-branch"><div class="mm-branch-title"><i class="${icon}"></i> ${this._esc(title)}</div><div class="mm-items">${its}</div></div>`;
    };

    const branches = [
      branch('Key Concepts',  'fas fa-lightbulb',            concepts),
      branch('Study Tips',    'fas fa-magic',                tricks),
      branch('Applications',  'fas fa-globe',                apps),
      branch('Misconceptions','fas fa-exclamation-triangle', misc),
    ].join('');

    return `
      <div class="study-sec">
        <div class="ss-hdr"><div class="ss-title"><i class="fas fa-project-diagram"></i> Mind Map</div></div>
        <div class="ss-body">
          <div class="mm-root"><div class="mm-root-node">${this._esc(topic)}</div></div>
          <div class="mm-branches">${branches}</div>
        </div>
      </div>
      ${this._buildNotesHTML(data)}`;
  }

  /* ─── PDF EXPORT ────────────────────────────────────────────────── */
  _downloadPDF() {
    const data = this.currentData;
    if (!data) { this._toast('warning', 'fa-exclamation', 'Generate content first.'); return; }
    if (!window.jspdf) { this._toast('error', 'fa-times', 'PDF library not loaded. Refresh the page.'); return; }

    const { jsPDF } = window.jspdf;
    const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
    const pw = 210, ph = 297, m = 15, cw = pw - m * 2;
    let y = 0;

    const addHdr = () => {
      doc.setFillColor(201, 169, 110);
      doc.rect(0, 0, pw, 13, 'F');
      doc.setFontSize(9); doc.setFont('helvetica', 'bold'); doc.setTextColor(255, 255, 255);
      doc.text('Savoiré AI v2.0', m, 9);
      doc.setFontSize(7); doc.setFont('helvetica', 'normal');
      doc.text('savoireai.vercel.app  ·  Sooban Talha Technologies', pw - m, 9, { align: 'right' });
      y = 22;
    };

    const addFtr = (pg, tot) => {
      doc.setDrawColor(201, 169, 110); doc.setLineWidth(0.35);
      doc.line(m, ph - 13, pw - m, ph - 13);
      doc.setFontSize(6.5); doc.setTextColor(140);
      doc.text(
        `Page ${pg} of ${tot}  ·  Savoiré AI v2.0  ·  Sooban Talha Technologies  ·  savoireai.vercel.app  ·  ${new Date().toLocaleString()}`,
        pw / 2, ph - 7.5, { align: 'center' }
      );
    };

    const check = (n = 14) => {
      if (y + n > ph - 18) {
        addFtr(doc.internal.getCurrentPageInfo().pageNumber, '?');
        doc.addPage(); addHdr();
      }
    };

    const write = (text, sz, bold, color, indent = 0) => {
      doc.setFontSize(sz);
      doc.setFont('helvetica', bold ? 'bold' : 'normal');
      doc.setTextColor(...color);
      const lines = doc.splitTextToSize(text, cw - indent);
      lines.forEach(l => { check(sz * 0.38 + 1); doc.text(l, m + indent, y); y += sz * 0.38 + 1; });
    };

    const heading = (txt, sz) => {
      check(sz * 0.42 + 8); y += 5;
      write(txt, sz, true, [100, 65, 10]);
      y += 3;
    };

    addHdr();

    // Title
    doc.setFontSize(22); doc.setFont('helvetica', 'bold'); doc.setTextColor(20, 12, 0);
    doc.splitTextToSize(data.topic || 'Study Notes', cw).forEach(l => { doc.text(l, m, y); y += 9; });
    y += 2;
    doc.setFontSize(8.5); doc.setFont('helvetica', 'normal'); doc.setTextColor(100, 88, 70);
    doc.text(`${data.curriculum_alignment || ''}  ·  Score: ${data.study_score || 96}/100  ·  ${new Date().toLocaleDateString()}  ·  Savoiré AI v2.0`, m, y);
    y += 5;
    doc.setDrawColor(201, 169, 110); doc.setLineWidth(0.6);
    doc.line(m, y, pw - m, y); y += 8;

    if (data.ultra_long_notes) {
      heading('COMPREHENSIVE ANALYSIS', 12);
      write(this._stripMd(data.ultra_long_notes), 9.5, false, [35, 28, 20]);
      y += 6;
    }
    if (data.key_concepts?.length) {
      heading('KEY CONCEPTS', 12);
      data.key_concepts.forEach((c, i) => { check(10); write(`${i + 1}. ${c}`, 9.5, false, [35, 28, 20], 5); y += 1; });
      y += 4;
    }
    if (data.key_tricks?.length) {
      heading('STUDY TRICKS & TIPS', 12);
      data.key_tricks.forEach(t => { check(10); write(`✦  ${t}`, 9.5, false, [35, 28, 20], 5); y += 2; });
      y += 4;
    }
    if (data.practice_questions?.length) {
      heading('PRACTICE QUESTIONS', 12);
      data.practice_questions.forEach((qa, i) => {
        check(16);
        write(`Q${i + 1}: ${qa.question}`, 9.5, true, [35, 28, 20], 5);
        y += 1;
        write(`A:  ${qa.answer}`, 9, false, [55, 45, 35], 12);
        y += 4;
      });
      y += 3;
    }
    if (data.real_world_applications?.length) {
      heading('REAL WORLD APPLICATIONS', 12);
      data.real_world_applications.forEach(a => { check(10); write(`•  ${a}`, 9.5, false, [35, 28, 20], 5); y += 2; });
      y += 4;
    }
    if (data.common_misconceptions?.length) {
      heading('COMMON MISCONCEPTIONS', 12);
      data.common_misconceptions.forEach(mc => { check(10); write(`⚠  ${mc}`, 9.5, false, [35, 28, 20], 5); y += 2; });
    }

    const tot = doc.internal.getNumberOfPages();
    for (let i = 1; i <= tot; i++) { doc.setPage(i); addFtr(i, tot); }

    const fname = `SavoireAI_${(data.topic || 'Notes').replace(/[^a-zA-Z0-9]/g, '_').slice(0, 40)}_${Date.now()}.pdf`;
    doc.save(fname);
    this._toast('success', 'fa-file-pdf', 'PDF downloaded successfully!');
  }

  /* ─── COPY ──────────────────────────────────────────────────────── */
  _copyResult() {
    const data = this.currentData;
    if (!data) { this._toast('info', 'fa-info-circle', 'No content to copy yet.'); return; }
    this._copyText(this._dataToText(data));
  }

  _copyText(text) {
    navigator.clipboard.writeText(text)
      .then(() => this._toast('success', 'fa-copy', 'Copied to clipboard!'))
      .catch(() => {
        const ta = document.createElement('textarea');
        ta.value = text; ta.style.cssText = 'position:fixed;opacity:0';
        document.body.appendChild(ta); ta.select(); document.execCommand('copy');
        document.body.removeChild(ta);
        this._toast('success', 'fa-copy', 'Copied!');
      });
  }

  /* ─── SAVE NOTE ─────────────────────────────────────────────────── */
  _saveNote() {
    const data = this.currentData;
    if (!data) { this._toast('info', 'fa-info-circle', 'No content to save yet.'); return; }
    this.saved.unshift({ id: this._genId(), topic: data.topic || 'Note', tool: this.tool, data, savedAt: Date.now() });
    if (this.saved.length > 100) this.saved = this.saved.slice(0, 100);
    this._save('sv_saved', this.saved);
    this._toast('success', 'fa-star', 'Note saved to your library!');
  }

  /* ─── SHARE ─────────────────────────────────────────────────────── */
  _shareResult() {
    const data = this.currentData;
    if (!data) return;
    const text = `📚 ${data.topic} — Study Notes\n\n${this._stripMd(data.ultra_long_notes || '').substring(0, 400)}…\n\nGenerated free by ${this.BRAND}\n${this.WEBSITE}`;
    if (navigator.share) {
      navigator.share({ title: `${data.topic} — ${this.BRAND}`, text }).catch(() => {});
    } else {
      this._copyText(text);
    }
  }

  /* ─── CLEAR OUTPUT ──────────────────────────────────────────────── */
  _clearOutput() {
    this.currentData = null;
    this.fcCards     = [];
    const ra = this._el('resultArea');
    if (ra) ra.innerHTML = '';
    this._showState('empty');
    this._toast('info', 'fa-trash-alt', 'Output cleared.');
  }

  _dataToText(data) {
    let t = `${data.topic || 'Study Notes'}\n${'═'.repeat(60)}\n`;
    t += `Powered by ${this.BRAND} · ${this.DEVELOPER} · ${this.WEBSITE}\n\n`;
    if (data.ultra_long_notes)  t += `COMPREHENSIVE NOTES\n\n${this._stripMd(data.ultra_long_notes)}\n\n`;
    if (data.key_concepts?.length) { t += `KEY CONCEPTS\n`; data.key_concepts.forEach((c, i) => { t += `${i + 1}. ${c}\n`; }); t += '\n'; }
    if (data.key_tricks?.length)   { t += `STUDY TRICKS\n`; data.key_tricks.forEach(tr => { t += `✦ ${tr}\n`; }); t += '\n'; }
    if (data.practice_questions?.length) { t += `PRACTICE QUESTIONS\n`; data.practice_questions.forEach((qa, i) => { t += `Q${i + 1}: ${qa.question}\nA: ${qa.answer}\n\n`; }); }
    if (data.real_world_applications?.length) { t += `APPLICATIONS\n`; data.real_world_applications.forEach(a => { t += `• ${a}\n`; }); t += '\n'; }
    if (data.common_misconceptions?.length)   { t += `MISCONCEPTIONS\n`; data.common_misconceptions.forEach(mc => { t += `⚠ ${mc}\n`; }); }
    t += `\n${'─'.repeat(60)}\n${this.BRAND} · ${this.WEBSITE}\n${this.DEVELOPER} · ${new Date().toLocaleString()}\n`;
    return t;
  }

  /* ─── FILE UPLOAD ───────────────────────────────────────────────── */
  _handleFile(file) {
    if (!file) return;
    const resetInput = () => { const fi = this._el('fileInput'); if (fi) fi.value = ''; };
    if (file.size > 5 * 1024 * 1024) {
      this._toast('error', 'fa-times', 'File too large (max 5MB).');
      resetInput(); return;
    }
    if (!file.name.match(/\.(txt|md|csv)$/i)) {
      this._toast('error', 'fa-times', 'Only .txt, .md, .csv files supported.');
      resetInput(); return;
    }
    const reader = new FileReader();
    reader.onload = e => {
      const text = (e.target.result || '').substring(0, 8000);
      const inp  = this._el('mainInput');
      if (inp) { inp.value = text; this._updateCharCount(); }
      const chip = this._el('fileChip');
      const dz   = this._el('uploadZone');
      const nm   = this._el('fileChipName');
      if (nm)   nm.textContent = file.name;
      if (chip) chip.style.display = 'flex';
      if (dz)   dz.style.display   = 'none';
      this._toast('success', 'fa-paperclip', `Loaded: ${file.name} (${text.length.toLocaleString()} chars)`);
    };
    reader.onerror = () => this._toast('error', 'fa-times', 'Could not read file.');
    reader.readAsText(file);
    resetInput();
  }

  _removeFile() {
    const inp  = this._el('mainInput');
    if (inp) { inp.value = ''; this._updateCharCount(); }
    const chip = this._el('fileChip');
    const dz   = this._el('uploadZone');
    if (chip) chip.style.display = 'none';
    if (dz)   dz.style.display   = 'flex';
  }

  /* ─── HISTORY ───────────────────────────────────────────────────── */
  _addToHistory(entry) {
    this.history.unshift(entry);
    if (this.history.length > 50) this.history = this.history.slice(0, 50);
    this._save('sv_history', this.history);
    this._updateHistBadge();
    this._renderSbHistory();
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
    const ICONS = { notes:'fa-book-open', flashcards:'fa-layer-group', quiz:'fa-question-circle', summary:'fa-align-left', mindmap:'fa-project-diagram' };
    if (!this.history.length) {
      list.innerHTML = '<div style="font-size:.76rem;color:var(--t4);padding:4px 6px;font-family:var(--fu)">No history yet</div>';
      return;
    }
    list.innerHTML = this.history.slice(0, 5).map(h => `
      <div class="lp-hist-item" onclick="window._app._loadHistEntry('${h.id}')">
        <div class="lp-hist-icon"><i class="fas ${ICONS[h.tool] || 'fa-book-open'}"></i></div>
        <div class="lp-hist-text">${this._esc((h.topic || 'Session').substring(0, 34))}</div>
        <div class="lp-hist-time">${this._relTime(h.ts)}</div>
      </div>`).join('');
  }

  _openHistModal() {
    this._openModal('histModal');
    this._renderHistModal();
  }

  _renderHistModal(filter = 'all', query = '') {
    const list  = this._el('histList');
    const empty = this._el('histEmpty');
    const count = this._el('histCount');
    if (!list) return;

    let items = this.history;
    if (filter !== 'all') items = items.filter(h => h.tool === filter);
    if (query)            items = items.filter(h => (h.topic || '').toLowerCase().includes(query.toLowerCase()));

    if (count) count.textContent = `${items.length} entries`;

    if (!items.length) {
      list.innerHTML = '';
      if (empty) empty.style.display = 'flex';
      return;
    }
    if (empty) empty.style.display = 'none';

    const ICONS = { notes:'fa-book-open', flashcards:'fa-layer-group', quiz:'fa-question-circle', summary:'fa-align-left', mindmap:'fa-project-diagram' };
    list.innerHTML = items.map(h => `
      <div class="hist-item" onclick="window._app._loadHistEntry('${h.id}')">
        <div class="hist-tool-av"><i class="fas ${ICONS[h.tool] || 'fa-book-open'}"></i></div>
        <div class="hist-info">
          <div class="hist-topic">${this._esc(h.topic || 'Study Session')}</div>
          <div class="hist-meta"><span class="hist-tag">${h.tool || 'notes'}</span><span class="hist-time">${this._relTime(h.ts)}</span></div>
        </div>
        <div class="hist-acts">
          <button class="hist-del" onclick="event.stopPropagation();window._app._deleteHist('${h.id}')" title="Delete"><i class="fas fa-trash"></i></button>
        </div>
      </div>`).join('');
  }

  _filterHist(q) {
    const f = this._qs('.hf.active')?.dataset.filter || 'all';
    this._renderHistModal(f, q);
  }

  _loadHistEntry(id) {
    const h = this.history.find(x => x.id === id);
    if (!h?.data) return;
    this._closeModal('histModal');
    this.currentData = h.data;
    this.tool        = h.tool || 'notes';
    this._setTool(this.tool);
    this._renderResult(h.data);
    this._toast('info', 'fa-history', `Loaded: ${h.topic}`);
  }

  _deleteHist(id) {
    this.history = this.history.filter(x => x.id !== id);
    this._save('sv_history', this.history);
    this._updateHistBadge();
    this._renderSbHistory();
    const f = this._qs('.hf.active')?.dataset.filter || 'all';
    const q = this._el('histSearchInput')?.value || '';
    this._renderHistModal(f, q);
  }

  /* ─── SAVED NOTES ───────────────────────────────────────────────── */
  _openSavedModal() {
    this._openModal('savedModal');
    this._renderSavedModal();
  }

  _renderSavedModal() {
    const list  = this._el('savedList');
    const empty = this._el('savedEmpty');
    const count = this._el('savedCount');
    if (!list) return;
    if (count) count.textContent = `${this.saved.length} notes`;
    if (!this.saved.length) {
      list.innerHTML = '';
      if (empty) empty.style.display = 'flex';
      return;
    }
    if (empty) empty.style.display = 'none';
    const ICONS = { notes:'fa-book-open', flashcards:'fa-layer-group', quiz:'fa-question-circle', summary:'fa-align-left', mindmap:'fa-project-diagram' };
    list.innerHTML = this.saved.map(s => `
      <div class="hist-item" onclick="window._app._loadSaved('${s.id}')">
        <div class="hist-tool-av"><i class="fas ${ICONS[s.tool] || 'fa-book-open'}"></i></div>
        <div class="hist-info">
          <div class="hist-topic">${this._esc(s.topic)}</div>
          <div class="hist-meta"><span class="hist-tag">${s.tool}</span><span class="hist-time">${this._relTime(s.savedAt)}</span></div>
        </div>
        <div class="hist-acts">
          <button class="hist-del" onclick="event.stopPropagation();window._app._deleteSaved('${s.id}')" title="Delete"><i class="fas fa-trash"></i></button>
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
  }

  _deleteSaved(id) {
    this.saved = this.saved.filter(x => x.id !== id);
    this._save('sv_saved', this.saved);
    this._renderSavedModal();
  }

  /* ─── SETTINGS ──────────────────────────────────────────────────── */
  _openSettingsModal() {
    const ni = this._el('nameInput');
    if (ni) ni.value = this.userName;

    const theme = document.documentElement.dataset.theme || 'dark';
    this._qsa('[data-theme-btn]').forEach(b => b.classList.toggle('active', b.dataset.themeBtn === theme));

    const fs = document.documentElement.dataset.font || 'medium';
    this._qsa('.font-sz').forEach(b => b.classList.toggle('active', b.dataset.size === fs));

    const ds = this._el('dsStats');
    if (ds) {
      const hs = JSON.stringify(this.history).length;
      const ss = JSON.stringify(this.saved).length;
      ds.innerHTML = `
        <div class="ds-stat"><div class="ds-val">${this.history.length}</div><div class="ds-lbl">History</div></div>
        <div class="ds-stat"><div class="ds-val">${this.saved.length}</div><div class="ds-lbl">Saved</div></div>
        <div class="ds-stat"><div class="ds-val">${Math.round((hs + ss) / 1024)}KB</div><div class="ds-lbl">Storage</div></div>`;
    }
    this._openModal('settingsModal');
  }

  _saveName() {
    const inp  = this._el('nameInput');
    const name = inp?.value?.trim();
    if (!name || name.length < 2) { this._toast('error', 'fa-times', 'Name must be at least 2 characters.'); return; }
    this.userName = name;
    localStorage.setItem('sv_user', name);
    this._updateUserUI();
    this._toast('success', 'fa-check', 'Name updated!');
  }

  _exportDataJson() {
    const obj = {
      exported: new Date().toISOString(),
      app: this.BRAND,
      developer: this.DEVELOPER,
      website: this.WEBSITE,
      userName: this.userName,
      history:  this.history,
      saved:    this.saved,
      preferences: this.prefs,
    };
    const blob = new Blob([JSON.stringify(obj, null, 2)], { type: 'application/json' });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement('a');
    a.href = url; a.download = `savoiré-ai-data-${Date.now()}.json`;
    document.body.appendChild(a); a.click(); document.body.removeChild(a); URL.revokeObjectURL(url);
    this._toast('success', 'fa-download', 'Data exported!');
  }

  _clearAllData() {
    Object.keys(localStorage).filter(k => k.startsWith('sv_')).forEach(k => localStorage.removeItem(k));
    this._toast('info', 'fa-trash', 'All data cleared. Reloading…');
    setTimeout(() => window.location.reload(), 1200);
  }

  /* ─── THEME ─────────────────────────────────────────────────────── */
  _toggleTheme() {
    const cur = document.documentElement.dataset.theme || 'dark';
    this._setTheme(cur === 'dark' ? 'light' : 'dark');
  }

  _setTheme(theme) {
    document.documentElement.dataset.theme = theme;
    const ic = this._el('themeIcon');
    if (ic) ic.className = theme === 'dark' ? 'fas fa-moon' : 'fas fa-sun';
    this._qsa('[data-theme-btn]').forEach(b => b.classList.toggle('active', b.dataset.themeBtn === theme));
    this.prefs.theme = theme; this._save('sv_prefs', this.prefs);
  }

  _setFontSize(size) {
    document.documentElement.dataset.font = size;
    this._qsa('.font-sz').forEach(b => b.classList.toggle('active', b.dataset.size === size));
    this.prefs.fontSize = size; this._save('sv_prefs', this.prefs);
  }

  _applyPrefs() {
    if (this.prefs.theme)    this._setTheme(this.prefs.theme);
    if (this.prefs.fontSize) this._setFontSize(this.prefs.fontSize);
    if (this.prefs.lastTool) this._setTool(this.prefs.lastTool);
  }

  /* ─── SIDEBAR ───────────────────────────────────────────────────── */
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

  _handleResize() {
    if (window.innerWidth > 768) {
      this._el('leftPanel')?.classList.remove('mobile-open');
    }
  }

  /* ─── MODALS ────────────────────────────────────────────────────── */
  _openModal(id) {
    const el = this._el(id);
    if (!el) return;
    el.style.display = 'flex';
    document.body.style.overflow = 'hidden';
  }

  _closeModal(id) {
    const el = this._el(id);
    if (!el) return;
    el.style.display = 'none';
    if (!this._qs('.modal-overlay[style*="flex"]')) document.body.style.overflow = '';
  }

  _closeAllModals() {
    this._qsa('.modal-overlay').forEach(m => { m.style.display = 'none'; });
    document.body.style.overflow = '';
  }

  _confirm(msg, cb) {
    const me = this._el('confirmMsg');
    if (me) me.textContent = msg;
    this.confirmCb = cb;
    this._openModal('confirmModal');
  }

  _toggleDropdown() {
    this._el('avDropdown')?.classList.toggle('open');
  }

  _closeDropdown() {
    this._el('avDropdown')?.classList.remove('open');
  }

  /* ─── TOAST ─────────────────────────────────────────────────────── */
  _toast(type, icon, msg, dur = 4000) {
    const container = this._el('toastContainer');
    if (!container) return;
    while (container.children.length >= 3) container.removeChild(container.firstChild);
    const t = document.createElement('div');
    t.className = `toast ${type}`;
    t.innerHTML = `<i class="fas ${icon}"></i><span>${this._esc(msg)}</span>`;
    t.addEventListener('click', () => t.remove());
    container.appendChild(t);
    setTimeout(() => {
      if (t.parentNode) {
        t.classList.add('removing');
        setTimeout(() => t.remove(), 300);
      }
    }, dur);
  }

  /* ─── CHAR COUNTER ──────────────────────────────────────────────── */
  _updateCharCount() {
    const el  = this._el('mainInput');
    const cnt = this._el('charCount');
    if (!el || !cnt) return;
    const n = el.value.length;
    cnt.textContent = `${n.toLocaleString()} / 12,000`;
    cnt.className   = 'ta-count' + (n > 10000 ? ' danger' : n > 7000 ? ' warn' : '');
  }

  /* ─── EXPORT ALL ────────────────────────────────────────────────── */
  _exportAllPdf() {
    if (this.currentData) this._downloadPDF();
    else this._toast('info', 'fa-info-circle', 'Generate some content first.');
  }

  _copyAll() {
    if (!this.currentData) { this._toast('info', 'fa-info-circle', 'No content to copy yet.'); return; }
    this._copyText(this._dataToText(this.currentData));
  }
}

/* ─── INIT ──────────────────────────────────────────────────────────── */
window.addEventListener('DOMContentLoaded', () => {
  window._app = new SavoireApp();
  // Also expose as _sav for backwards compatibility with any inline onclick
  window._sav = window._app;

  // Global helper for quick-topic buttons in dashboard.html
  window.setSugg = (t) => {
    const el = document.getElementById('mainInput');
    if (el) { el.value = t; el.dispatchEvent(new Event('input')); el.focus(); }
  };
});
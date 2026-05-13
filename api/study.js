'use strict';

/* ═══════════════════════════════════════════════════════════════════════════
   SAVOIRÉ AI v2.0 — FAST LIVE OUTPUT
   Built by Sooban Talha Technologies
   ✦ INSTANT STREAMING — Characters appear in MILLISECONDS
   ✦ NO WAITING — Start reading immediately
   ✦ OPTIMIZED API CALLS — Fast model priority
   ═══════════════════════════════════════════════════════════════════════════ */

const SAVOIRÉ = {
  VERSION: '2.0',
  BRAND: 'Savoiré AI',
  DEVELOPER: 'Sooban Talha Technologies',
  DEVSITE: 'soobantalhatech.xyz',
  WEBSITE: 'savoireai.vercel.app',
  FOUNDER: 'Sooban Talha',
  API_URL: '/api/study',
  MAX_HISTORY: 50,
  MAX_SAVED: 100,
};

const TOOL_CONFIG = {
  notes: { icon: 'fa-book-open', label: 'Generate Notes', placeholder: 'Enter any topic for comprehensive study notes...', sfpLabel: 'Generating notes instantly...', sfpIcon: 'fa-book-open', sfpName: 'Notes' },
  flashcards: { icon: 'fa-layer-group', label: 'Create Flashcards', placeholder: 'Enter a topic for interactive flashcards...', sfpLabel: 'Building flashcards instantly...', sfpIcon: 'fa-layer-group', sfpName: 'Flashcards' },
  quiz: { icon: 'fa-question-circle', label: 'Build Quiz', placeholder: 'Enter a topic to generate practice quiz...', sfpLabel: 'Creating quiz instantly...', sfpIcon: 'fa-question-circle', sfpName: 'Quiz' },
  summary: { icon: 'fa-align-left', label: 'Summarise', placeholder: 'Enter a topic for smart summary...', sfpLabel: 'Writing summary instantly...', sfpIcon: 'fa-align-left', sfpName: 'Summary' },
  mindmap: { icon: 'fa-project-diagram', label: 'Build Mind Map', placeholder: 'Enter a topic for visual mind map...', sfpLabel: 'Building mind map instantly...', sfpIcon: 'fa-project-diagram', sfpName: 'Mind Map' },
};

/* ═══════════════════════════════════════════════════════════════════════════
   MAIN APP CLASS
   ═══════════════════════════════════════════════════════════════════════════ */

class SavoireApp {
  
  constructor() {
    this.tool = 'notes';
    this.generating = false;
    this.currentData = null;
    this.userName = '';
    this.confirmCb = null;
    this.streamCtrl = null;
    this.streamBuffer = '';
    this.focusMode = false;
    this.fcCards = [];
    this.fcCurrent = 0;
    this.fcFlipped = false;
    this.quizData = [];
    this.quizScore = 0;
    
    this.history = this._load('sv_history', []);
    this.saved = this._load('sv_saved', []);
    this.prefs = this._load('sv_prefs', {});
    this.userName = localStorage.getItem('sv_user') || '';
    this.sessions = parseInt(localStorage.getItem('sv_sessions') || '0');
    this.isReturn = !!this.userName;
    
    this._boot();
  }
  
  /* ═══════════════════════════════════════════════════════════════════════════
     BOOTSTRAP
     ═══════════════════════════════════════════════════════════════════════════ */
  
  _boot() {
    this._applyPrefs();
    this._bindEvents();
    this._initWelcome();
    this._updateStats();
    this._renderHistory();
    this._updateUI();
    
    console.log(`%c✨ ${SAVOIRÉ.BRAND} — Fast Live Output`, 'color:#C9A96E;font-size:16px;font-weight:bold');
    console.log(`%cBuilt by ${SAVOIRÉ.DEVELOPER}`, 'color:#C9A96E;font-size:12px');
  }
  
  /* ═══════════════════════════════════════════════════════════════════════════
     DOM HELPERS
     ═══════════════════════════════════════════════════════════════════════════ */
  
  _el(id) { return document.getElementById(id); }
  _qs(sel) { return document.querySelector(sel); }
  _qsa(sel) { return document.querySelectorAll(sel); }
  _on(id, ev, fn) { const el = this._el(id); if (el) el.addEventListener(ev, fn); }
  
  _load(key, def) {
    try { const v = localStorage.getItem(key); return v ? JSON.parse(v) : def; } catch { return def; }
  }
  
  _save(key, val) {
    try { localStorage.setItem(key, JSON.stringify(val)); } catch(e) {}
  }
  
  _esc(s) {
    if (!s) return '';
    return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }
  
  _relTime(ts) {
    if (!ts) return '';
    const d = Date.now() - ts;
    const m = Math.floor(d / 60000);
    if (m < 1) return 'just now';
    if (m < 60) return `${m}m ago`;
    if (m < 1440) return `${Math.floor(m / 60)}h ago`;
    return `${Math.floor(m / 1440)}d ago`;
  }
  
  _dateGroup(ts) {
    if (!ts) return 'Unknown';
    const d = Date.now() - ts;
    const day = Math.floor(d / 86400000);
    if (day === 0) return 'Today';
    if (day === 1) return 'Yesterday';
    if (day < 7) return 'This Week';
    return 'Older';
  }
  
  _genId() { return Date.now().toString(36) + Math.random().toString(36).slice(2); }
  _wordCount(t) { return t ? t.trim().split(/\s+/).filter(Boolean).length : 0; }
  
  /* ═══════════════════════════════════════════════════════════════════════════
     MARKDOWN RENDERER — FAST
     ═══════════════════════════════════════════════════════════════════════════ */
  
  _renderMd(text) {
    if (!text) return '';
    if (window.marked && window.DOMPurify) {
      try { return DOMPurify.sanitize(marked.parse(text)); } catch(e) {}
    }
    let html = String(text).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
    html = html.replace(/```[\s\S]*?```/g, m => `<pre><code>${m.slice(3, -3)}</code></pre>`);
    html = html.replace(/`([^`]+)`/g, '<code>$1</code>');
    html = html.replace(/^#### (.+)$/gm, '<h4>$1</h4>');
    html = html.replace(/^### (.+)$/gm, '<h3>$1</h3>');
    html = html.replace(/^## (.+)$/gm, '<h2>$1</h2>');
    html = html.replace(/^# (.+)$/gm, '<h1>$1</h1>');
    html = html.replace(/\*\*\*(.+?)\*\*\*/g, '<strong><em>$1</em></strong>');
    html = html.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
    html = html.replace(/\*(.+?)\*/g, '<em>$1</em>');
    html = html.replace(/^[-*•] (.+)$/gm, '<li>$1</li>');
    html = html.replace(/^\d+\. (.+)$/gm, '<li>$1</li>');
    html = html.replace(/\n\n/g, '</p><p>');
    if (!html.startsWith('<')) html = '<p>' + html + '</p>';
    return html;
  }
  
  _renderMdLive(text) {
    if (!text) return '<span class="sfp-cursor">▊</span>';
    return this._renderMd(text) + '<span class="sfp-cursor">▊</span>';
  }
  
  _stripMd(t) {
    if (!t) return '';
    return t.replace(/#{1,6} /g, '').replace(/\*\*\*(.+?)\*\*\*/g, '$1').replace(/\*\*(.+?)\*\*/g, '$1').replace(/\*(.+?)\*/g, '$1').replace(/`(.+?)`/g, '$1').trim();
  }
  
  /* ═══════════════════════════════════════════════════════════════════════════
     EVENT BINDINGS
     ═══════════════════════════════════════════════════════════════════════════ */
  
  _bindEvents() {
    // Welcome
    this._on('welcomeBtn', 'click', () => this._submitWelcome());
    this._on('welcomeNameInput', 'keydown', e => { if (e.key === 'Enter') this._submitWelcome(); });
    this._on('welcomeSkip', 'click', () => this._skipWelcome());
    this._on('welcomeBackBtn', 'click', () => this._dismissWelcomeBack());
    
    // Header
    this._on('sbToggle', 'click', () => this._toggleSidebar());
    this._on('histBtn', 'click', () => this._openHistory());
    this._on('themeBtn', 'click', () => this._toggleTheme());
    this._on('settingsBtn', 'click', () => this._openSettings());
    this._on('avBtn', 'click', e => { e.stopPropagation(); this._toggleDropdown(); });
    this._on('avHist', 'click', () => { this._closeDropdown(); this._openHistory(); });
    this._on('avSaved', 'click', () => { this._closeDropdown(); this._openSaved(); });
    this._on('avSettings', 'click', () => { this._closeDropdown(); this._openSettings(); });
    this._on('avClear', 'click', () => { this._closeDropdown(); this._confirm('Clear ALL data?', () => this._clearAll()); });
    document.addEventListener('click', () => this._closeDropdown());
    
    // Tools
    this._qsa('.ts-item').forEach(btn => {
      btn.addEventListener('click', () => this._setTool(btn.dataset.tool));
    });
    
    // Generate
    this._on('runBtn', 'click', () => this._generate());
    this._on('cancelBtn', 'click', () => this._cancel());
    this._on('mainInput', 'input', () => this._updateCharCount());
    this._on('mainInput', 'keydown', e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); this._generate(); } });
    this._on('taClearBtn', 'click', () => { const ta = this._el('mainInput'); if (ta) { ta.value = ''; this._updateCharCount(); ta.focus(); } });
    
    // Mini bar
    const imb = this._el('inputMiniBar');
    if (imb) imb.addEventListener('click', () => this._expandInput());
    
    // File upload
    this._on('uploadZone', 'click', () => this._el('fileInput')?.click());
    this._on('fileInput', 'change', e => this._handleFile(e.target.files[0]));
    this._on('fileChipRm', 'click', () => this._removeFile());
    
    const dz = this._el('uploadZone');
    if (dz) {
      dz.addEventListener('dragover', e => { e.preventDefault(); dz.classList.add('drag-over'); });
      dz.addEventListener('dragleave', () => dz.classList.remove('drag-over'));
      dz.addEventListener('drop', e => { e.preventDefault(); dz.classList.remove('drag-over'); const f = e.dataTransfer?.files?.[0]; if (f) this._handleFile(f); });
    }
    
    // Output toolbar
    this._on('copyBtn', 'click', () => this._copyResult());
    this._on('pdfBtn', 'click', () => this._downloadPDF());
    this._on('saveBtn', 'click', () => this._saveNote());
    this._on('shareBtn', 'click', () => this._shareResult());
    this._on('clearBtn', 'click', () => this._clearOutput());
    this._on('focusModeBtn', 'click', () => this._toggleFocusMode());
    this._on('lpHistAll', 'click', () => this._openHistory());
    
    // History modal
    this._on('histSearchInput', 'input', e => this._filterHistory(e.target.value));
    this._on('clearHistBtn', 'click', () => {
      this._confirm('Clear all history?', () => {
        this.history = [];
        this._save('sv_history', this.history);
        this._renderHistoryModal();
        this._renderHistory();
        this._updateStats();
        this._toast('info', 'fa-trash', 'History cleared.');
      });
    });
    
    this._qsa('.hf').forEach(btn => {
      btn.addEventListener('click', () => {
        this._qsa('.hf').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        this._renderHistoryModal(btn.dataset.filter, this._el('histSearchInput')?.value || '');
      });
    });
    
    // Settings
    this._on('saveNameBtn', 'click', () => this._saveName());
    this._on('exportDataBtn', 'click', () => this._exportData());
    this._on('clearDataBtn', 'click', () => this._confirm('Delete ALL data?', () => this._clearAll()));
    this._on('nameInput', 'keydown', e => { if (e.key === 'Enter') this._saveName(); });
    
    this._qsa('[data-theme-btn]').forEach(btn => {
      btn.addEventListener('click', () => this._setTheme(btn.dataset.themeBtn));
    });
    this._qsa('.font-sz').forEach(btn => {
      btn.addEventListener('click', () => this._setFontSize(btn.dataset.size));
    });
    
    // Modal close
    this._qsa('[data-close]').forEach(btn => {
      btn.addEventListener('click', () => this._closeModal(btn.dataset.close));
    });
    this._qsa('.modal-close').forEach(btn => {
      const ov = btn.closest('.modal-overlay');
      if (ov) btn.addEventListener('click', () => this._closeModal(ov.id));
    });
    this._qsa('.modal-overlay').forEach(ov => {
      ov.addEventListener('click', e => { if (e.target === ov) this._closeModal(ov.id); });
    });
    
    this._on('confirmOkBtn', 'click', () => {
      this._closeModal('confirmModal');
      if (typeof this.confirmCb === 'function') this.confirmCb();
      this.confirmCb = null;
    });
    this._on('sbBackdrop', 'click', () => this._closeMobileSidebar());
    
    // Keyboard shortcuts
    document.addEventListener('keydown', e => {
      if (e.key === 'Escape') { this._closeAllModals(); return; }
      const tag = document.activeElement?.tagName?.toLowerCase();
      if (tag === 'input' || tag === 'textarea') return;
      if (e.ctrlKey || e.metaKey) {
        switch (e.key.toLowerCase()) {
          case 'k': e.preventDefault(); this._el('mainInput')?.focus(); break;
          case 'h': e.preventDefault(); this._openHistory(); break;
          case 'b': e.preventDefault(); this._toggleSidebar(); break;
          case 's': e.preventDefault(); this._saveNote(); break;
        }
      }
    });
    
    // Flashcard keyboard
    document.addEventListener('keydown', e => {
      if (!this.fcCards.length) return;
      const tag = document.activeElement?.tagName?.toLowerCase();
      if (tag === 'input' || tag === 'textarea') return;
      if (e.key === 'ArrowRight' || e.key === 'ArrowDown') { e.preventDefault(); this._fcNav(1); }
      else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') { e.preventDefault(); this._fcNav(-1); }
      else if (e.key === ' ' || e.key === 'Space') { e.preventDefault(); this._fcFlip(); }
    });
    
    window.addEventListener('resize', () => this._handleResize());
  }
  
  /* ═══════════════════════════════════════════════════════════════════════════
     WELCOME
     ═══════════════════════════════════════════════════════════════════════════ */
  
  _initWelcome() {
    if (!this.userName) {
      setTimeout(() => {
        const ov = this._el('welcomeOverlay');
        if (ov) { ov.style.display = 'flex'; setTimeout(() => ov.classList.add('visible'), 50); }
      }, 500);
    } else {
      this.sessions++;
      localStorage.setItem('sv_sessions', String(this.sessions));
      if (this.sessions <= 1 || this.sessions % 3 === 0) {
        setTimeout(() => {
          const wb = this._el('welcomeBackOverlay');
          if (wb) {
            const wn = this._el('wbName');
            if (wn) wn.textContent = this.userName;
            wb.style.display = 'flex';
            setTimeout(() => wb.classList.add('visible'), 50);
          }
        }, 600);
      }
    }
  }
  
  _submitWelcome() {
    const inp = this._el('welcomeNameInput');
    const name = inp?.value?.trim();
    if (!name || name.length < 2) { inp?.classList.add('shake'); setTimeout(() => inp?.classList.remove('shake'), 500); return; }
    this.userName = name;
    localStorage.setItem('sv_user', name);
    this.sessions = 1;
    localStorage.setItem('sv_sessions', '1');
    this._dismissOverlay('welcomeOverlay');
    this._updateUI();
    this._updateStats();
    this._toast('success', 'fa-hand-peace', `Welcome, ${name}! 🎓`);
  }
  
  _skipWelcome() {
    this.userName = 'Scholar';
    localStorage.setItem('sv_user', 'Scholar');
    this.sessions = 1;
    localStorage.setItem('sv_sessions', '1');
    this._dismissOverlay('welcomeOverlay');
    this._updateUI();
  }
  
  _dismissWelcomeBack() { this._dismissOverlay('welcomeBackOverlay'); }
  _dismissOverlay(id) { const el = this._el(id); if (el) { el.classList.remove('visible'); setTimeout(() => { el.style.display = 'none'; }, 450); } }
  
  _updateUI() {
    const name = this.userName || 'Scholar';
    const init = name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);
    const av = this._el('avLetter'); if (av) av.textContent = init;
    const avd = this._el('avDropAv'); if (avd) avd.textContent = init;
    const avn = this._el('avDropName'); if (avn) avn.textContent = name;
    const g = this._el('dhGreeting'); if (g) { const hr = new Date().getHours(); g.textContent = `${hr < 12 ? 'Good morning' : hr < 17 ? 'Good afternoon' : 'Good evening'}, ${name}`; }
  }
  
  _updateStats() {
    const s = this._el('statSessions'); if (s) s.textContent = this.sessions || 0;
    const h = this._el('statHistory'); if (h) h.textContent = this.history.length;
    const sv = this._el('statSaved'); if (sv) sv.textContent = this.saved.length;
    this._updateBadge();
  }
  
  _updateBadge() { const b = this._el('histBadge'); if (b) { b.textContent = this.history.length; b.style.display = this.history.length ? 'flex' : 'none'; } }
  
  _setTool(tool) {
    if (!TOOL_CONFIG[tool]) return;
    this.tool = tool;
    this._qsa('.ts-item').forEach(btn => { const a = btn.dataset.tool === tool; btn.classList.toggle('active', a); });
    const ta = this._el('mainInput'); const cfg = TOOL_CONFIG[tool]; if (ta) ta.placeholder = cfg.placeholder;
    const ic = this._el('runIcon'); const lb = this._el('runLabel'); if (ic) ic.className = `fas ${cfg.icon}`; if (lb) lb.textContent = cfg.label;
    this.prefs.lastTool = tool; this._save('sv_prefs', this.prefs);
  }
  
  _updateCharCount() {
    const ta = this._el('mainInput'); const cnt = this._el('charCount'); const max = 12000;
    if (!ta) return;
    const len = ta.value.length;
    if (cnt) cnt.textContent = `${len} / ${max}`;
    if (len > max) { ta.value = ta.value.substring(0, max); this._toast('info', 'fa-info', `Limited to ${max} chars.`); }
  }
  
  _handleFile(file) {
    if (!file) return;
    const ext = '.' + (file.name.split('.').pop() || '').toLowerCase();
    if (!['.txt', '.md', '.csv'].includes(ext)) { this._toast('error', 'fa-times', 'Use .txt, .md or .csv'); return; }
    if (file.size > 5000000) { this._toast('error', 'fa-times', 'Max 5MB'); return; }
    const r = new FileReader();
    r.onload = e => { const txt = e.target.result?.trim(); if (!txt) return; const ta = this._el('mainInput'); if (ta) { ta.value = txt.substring(0, 12000); this._updateCharCount(); ta.dispatchEvent(new Event('input')); } const ch = this._el('fileChip'); const nm = this._el('fileChipName'); if (ch) ch.style.display = 'flex'; if (nm) nm.textContent = file.name; this._toast('success', 'fa-check', `Loaded: ${file.name}`); };
    r.readAsText(file, 'UTF-8');
  }
  
  _removeFile() { const fi = this._el('fileInput'); const ch = this._el('fileChip'); if (fi) fi.value = ''; if (ch) ch.style.display = 'none'; }
  
  /* ═══════════════════════════════════════════════════════════════════════════
     GENERATE — FAST LIVE STREAMING
     ═══════════════════════════════════════════════════════════════════════════ */
  
  async _generate() {
    if (this.generating) return;
    const ta = this._el('mainInput'); const text = ta?.value?.trim();
    if (!text || text.length < 2) { ta?.focus(); this._toast('info', 'fa-lightbulb', 'Enter a topic to study.'); return; }
    
    const depth = this._el('depthSel')?.value || 'detailed';
    const lang = this._el('langSel')?.value || 'English';
    const style = this._el('styleSel')?.value || 'simple';
    
    this._mobileScroll();
    this.generating = true;
    this.streamBuffer = '';
    this._setLoading(true);
    this._collapseInput(text);
    this._showStream(text, this.tool);
    this._startThinking();
    
    try {
      const data = await this._streamAPI(text, { depth, language: lang, style, tool: this.tool });
      this.currentData = data;
      this._hideStream();
      this._renderResult(data);
      this._addHistory({ id: this._genId(), topic: data.topic || text, tool: this.tool, data, ts: Date.now() });
      this._updateStats();
      this._toast('success', 'fa-check', `${TOOL_CONFIG[this.tool].sfpName} ready!`);
      setTimeout(() => this._scrollResult(), 200);
    } catch (err) {
      this._hideStream();
      this._showError(err.message || 'Generation failed. Try again.');
      this._toast('error', 'fa-exclamation', err.message || 'Failed.');
    } finally {
      this.generating = false;
      this._setLoading(false);
      this._stopThinking();
      this._showCancel(false);
    }
  }
  
  _mobileScroll() { if (window.innerWidth <= 768) this._el('rightPanel')?.scrollIntoView({ behavior: 'smooth', block: 'start' }); }
  _scrollResult() { const ra = this._el('resultArea'); if (ra && ra.style.display !== 'none') ra.scrollIntoView({ behavior: 'smooth', block: 'start' }); const oa = this._el('outArea'); if (oa) oa.scrollTo({ top: 0 }); }
  
  async _streamAPI(msg, opts) {
    this.streamCtrl = new AbortController();
    this._showCancel(true);
    try { return await this._sseStream(msg, opts); }
    catch(err) { if (err.name === 'AbortError') throw err; return await this._jsonAPI(msg, opts); }
  }
  
  async _sseStream(msg, opts) {
    return new Promise(async (resolve, reject) => {
      try {
        const res = await fetch(SAVOIRÉ.API_URL, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ message: msg, options: { ...opts, stream: true } }),
          signal: this.streamCtrl?.signal
        });
        if (!res.ok) { reject(new Error(`API error: ${res.status}`)); return; }
        
        const reader = res.body.getReader();
        const decoder = new TextDecoder();
        let buffer = '';
        let full = '';
        let lastRender = 0;
        const sfpTxt = this._el('sfpText');
        const sfpScr = this._el('sfpScroll');
        
        const render = () => {
          if (!sfpTxt) return;
          const now = Date.now();
          if (now - lastRender < 16) return; // ~60fps
          lastRender = now;
          try {
            sfpTxt.innerHTML = this._renderMdLive(this.streamBuffer);
          } catch(e) {
            sfpTxt.textContent = this.streamBuffer;
            sfpTxt.innerHTML += '<span class="sfp-cursor">▊</span>';
          }
          if (sfpScr) sfpScr.scrollTop = sfpScr.scrollHeight;
        };
        
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split('\n');
          buffer = lines.pop() || '';
          
          for (const line of lines) {
            if (line.startsWith('data: ')) {
              try {
                const json = JSON.parse(line.substring(6).trim());
                if (json.t) {
                  this.streamBuffer += json.t;
                  full += json.t;
                  render();
                  this._updateStageProgress(this.streamBuffer.length);
                }
                if (json.topic && json.ultra_long_notes) { resolve(json); return; }
              } catch(e) {}
            }
          }
        }
        
        if (sfpTxt) {
          sfpTxt.classList.remove('live-streaming');
          sfpTxt.classList.add('done');
          // Remove the cursor span
          const cursor = sfpTxt.querySelector('.sfp-cursor');
          if (cursor) cursor.remove();
        }
        resolve({ topic: msg, tool: opts.tool, ultra_long_notes: full || this.streamBuffer, content: full });
      } catch(err) { reject(err); }
    });
  }
  
  async _jsonAPI(msg, opts) {
    const res = await fetch(SAVOIRÉ.API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message: msg, options: { ...opts, stream: false } }),
      signal: this.streamCtrl?.signal
    });
    if (!res.ok) throw new Error(`Server error: ${res.status}`);
    const data = await res.json();
    if (data.error) throw new Error(data.error);
    return data;
  }
  
  _cancel() { if (this.streamCtrl) { this.streamCtrl.abort(); this.streamCtrl = null; } }
  
  _collapseInput(topic) {
    const tw = this._el('taCollapseWrap'); const sw = this._el('selectorsCollapseWrap'); const sg = this._el('suggCollapseWrap'); const fw = this._el('fileCollapseWrap'); const mb = this._el('inputMiniBar'); const mt = this._el('inputMiniText');
    if (tw) tw.classList.add('collapsed'); if (sw) sw.classList.add('collapsed'); if (sg) sg.classList.add('collapsed'); if (fw) fw.classList.add('collapsed');
    if (mt) mt.textContent = topic.length > 40 ? topic.substring(0, 40) + '…' : topic;
    if (mb) mb.classList.add('visible');
  }
  
  _expandInput() {
    const tw = this._el('taCollapseWrap'); const sw = this._el('selectorsCollapseWrap'); const sg = this._el('suggCollapseWrap'); const fw = this._el('fileCollapseWrap'); const mb = this._el('inputMiniBar');
    if (tw) tw.classList.remove('collapsed'); if (sw) sw.classList.remove('collapsed'); if (sg) sg.classList.remove('collapsed'); if (fw) fw.classList.remove('collapsed'); if (mb) mb.classList.remove('visible');
    setTimeout(() => this._el('mainInput')?.focus(), 200);
  }
  
  _showStream(topic, tool) {
    const sfp = this._el('streamFullpage'); const tp = this._el('sfpTopic'); const ic = this._el('sfpToolIcon'); const nm = this._el('sfpToolName'); const lb = this._el('sfpLabel'); const txt = this._el('sfpText');
    if (!sfp) return;
    const cfg = TOOL_CONFIG[tool] || TOOL_CONFIG.notes;
    if (tp) tp.textContent = topic.length > 50 ? topic.substring(0, 50) + '…' : topic;
    if (ic) ic.className = `fas ${cfg.sfpIcon}`; if (nm) nm.textContent = cfg.sfpName; if (lb) lb.textContent = cfg.sfpLabel;
    if (txt) {
      txt.innerHTML = '<span class="sfp-cursor">▊</span>';
      txt.classList.remove('done');
      txt.classList.add('live-streaming');
    }
    sfp.style.display = 'flex';
    sfp.style.opacity = '0';
    sfp.style.transition = 'opacity 0.25s ease';
    requestAnimationFrame(() => {
      sfp.style.opacity = '1';
      setTimeout(() => { sfp.style.transition = ''; }, 280);
    });
    const es = this._el('emptyState'); const tw = this._el('thinkingWrap'); const ra = this._el('resultArea');
    if (es) es.style.display = 'none'; if (tw) tw.style.display = 'none'; if (ra) ra.style.display = 'none';
    if (window.innerWidth <= 768) sfp.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }
  
  _hideStream() {
    const sfp = this._el('streamFullpage');
    if (sfp) {
      sfp.style.opacity = '0';
      sfp.style.transition = 'opacity 0.3s ease';
      setTimeout(() => {
        sfp.style.display = 'none';
        sfp.style.opacity = '';
        sfp.style.transition = '';
      }, 300);
    }
    this._expandInput();
  }
  
  _startThinking() {
    for (let i = 0; i < 5; i++) { const el = this._el(`ts${i}`); if (el) el.className = 'ths'; }
    this._activateStage(0);
    this.thinkTimer = setInterval(() => {
      this.stageIdx = (this.stageIdx || 0) + 1;
      if (this.stageIdx < 5) { this._doneStage(this.stageIdx - 1); this._activateStage(this.stageIdx); }
    }, 3000);
  }
  
  _activateStage(i) { const el = this._el(`ts${i}`); if (el) { el.classList.remove('done'); el.classList.add('active'); } }
  _doneStage(i) { const el = this._el(`ts${i}`); if (el) { el.classList.remove('active'); el.classList.add('done'); } }
  _stopThinking() { if (this.thinkTimer) { clearInterval(this.thinkTimer); this.thinkTimer = null; } for (let i = 0; i <= (this.stageIdx || 0) && i < 5; i++) this._doneStage(i); this._doneStage(4); }
  _updateStageProgress(len) { const thresholds = [0, 300, 800, 1500, 2500]; for (let i = thresholds.length - 1; i >= 0; i--) { if (len >= thresholds[i] && (this.stageIdx || 0) < i) { this._doneStage(this.stageIdx || 0); this.stageIdx = i; this._activateStage(i); break; } } }
  
  _setLoading(on) {
    const btn = this._el('runBtn'); const ic = this._el('runIcon'); const lb = this._el('runLabel');
    if (!btn) return; btn.disabled = on;
    if (on) { if (ic) ic.className = 'fas fa-spinner fa-pulse'; if (lb) lb.textContent = 'Generating…'; }
    else { const cfg = TOOL_CONFIG[this.tool]; if (ic) ic.className = `fas ${cfg.icon}`; if (lb) lb.textContent = cfg.label; }
  }
  
  _showCancel(show) { const btn = this._el('cancelBtn'); if (btn) btn.classList.toggle('visible', show); }
  
  _showError(msg) {
    const ra = this._el('resultArea');
    if (ra) {
      ra.style.display = 'block';
      ra.innerHTML = `<div class="error-card"><div class="error-hdr"><i class="fas fa-exclamation-triangle"></i> Failed</div><div class="error-body">${this._esc(msg)}</div><button class="btn btn-primary" onclick="document.getElementById('mainInput').focus()"><i class="fas fa-redo"></i> Try Again</button></div>`;
    }
  }
  
  /* ═══════════════════════════════════════════════════════════════════════════
     RESULT RENDERING
     ═══════════════════════════════════════════════════════════════════════════ */
  
  _renderResult(data) {
    const area = this._el('resultArea');
    if (!area) return;
    area.innerHTML = this._buildHTML(data);
    area.style.display = 'block';
    area.style.animation = 'fadeUp 0.4s ease';
    const tw = this._el('thinkingWrap'); if (tw) tw.style.display = 'none';
    const es = this._el('emptyState'); if (es) es.style.display = 'none';
    if (window.innerWidth <= 768) setTimeout(() => area.scrollIntoView({ behavior: 'smooth', block: 'start' }), 200);
  }

  _showEmptyState() {
    const es = this._el('emptyState');
    const ra = this._el('resultArea');
    if (es) es.style.display = 'flex';
    if (ra) ra.style.display = 'none';
  }
  
  _buildHTML(data) {
    const topic = this._esc(data.topic || 'Study Material');
    const score = data.study_score || 96;
    const wc = this._wordCount(this._stripMd(data.ultra_long_notes || ''));
    const lang = data._language || 'English';
    
    const header = `<div class="result-hdr"><div><div class="rh-topic">${topic}</div><div class="rh-meta"><span><i class="fas fa-calendar"></i> ${new Date().toLocaleDateString()}</span><span><i class="fas fa-globe"></i> ${lang}</span><span><i class="fas fa-file-word"></i> ~${wc} words</span><span><i class="fas fa-star"></i> Score: ${score}/100</span></div><div class="rh-powered">${SAVOIRÉ.BRAND} · <a href="https://${SAVOIRÉ.DEVSITE}" target="_blank">${SAVOIRÉ.DEVELOPER}</a></div></div><div class="rh-score">${score}</div></div>`;
    
    let body = '';
    switch (this.tool) {
      case 'flashcards': body = this._buildFC(data); break;
      case 'quiz': body = this._buildQuiz(data); break;
      case 'summary': body = this._buildSummary(data); break;
      case 'mindmap': body = this._buildMindMap(data); break;
      default: body = this._buildNotes(data); break;
    }
    
    const bar = `<div class="export-bar"><button class="exp-btn" onclick="window._app._copyResult()"><i class="fas fa-copy"></i> Copy</button><button class="exp-btn" onclick="window._app._downloadPDF()"><i class="fas fa-file-pdf"></i> PDF</button><button class="exp-btn" onclick="window._app._saveNote()"><i class="fas fa-star"></i> Save</button><button class="exp-btn" onclick="window._app._shareResult()"><i class="fas fa-share"></i> Share</button></div>`;
    const footer = `<div class="result-footer"><div class="rbf-logo">Ś</div><div><a href="https://${SAVOIRÉ.WEBSITE}" target="_blank">${SAVOIRÉ.BRAND}</a> · ${SAVOIRÉ.DEVELOPER} · Free forever</div><div>${new Date().toLocaleString()}</div></div>`;
    
    return `<div class="result-wrap">${header}${body}${bar}${footer}</div>`;
  }
  
  _buildNotes(data) {
    let h = '';
    if (data.ultra_long_notes) h += `<div class="study-sec"><div class="ss-hdr"><div class="ss-title"><i class="fas fa-book"></i> Study Notes</div><button class="ss-copy" onclick="window._app._copyText(${JSON.stringify(this._stripMd(data.ultra_long_notes))})"><i class="fas fa-copy"></i></button></div><div class="ss-body md-content">${this._renderMd(data.ultra_long_notes)}</div></div>`;
    if (data.key_concepts?.length) { const cards = data.key_concepts.map((c, i) => `<div class="concept-card"><div class="cn">${i+1}</div><div>${this._esc(c)}</div></div>`).join(''); h += `<div class="study-sec"><div class="ss-hdr"><div class="ss-title"><i class="fas fa-lightbulb"></i> Key Concepts</div></div><div class="ss-body"><div class="concepts-g">${cards}</div></div></div>`; }
    if (data.key_tricks?.length) { const items = data.key_tricks.map((t, i) => `<div class="trick-item"><div class="ti"><i class="fas fa-magic"></i></div><div>${this._esc(t)}</div></div>`).join(''); h += `<div class="study-sec"><div class="ss-hdr"><div class="ss-title"><i class="fas fa-magic"></i> Study Tricks</div></div><div class="ss-body"><div class="tricks-l">${items}</div></div></div>`; }
    if (data.practice_questions?.length) { const qs = data.practice_questions.map((qa, i) => `<div class="qa-card"><div class="qa-head" onclick="this.nextElementSibling.classList.toggle('show')"><div class="qn">${i+1}</div><div>${this._esc(qa.question)}</div><button class="qa-btn">Answer</button></div><div class="qa-ans"><div class="md-content">${this._renderMd(qa.answer)}</div></div></div>`).join(''); h += `<div class="study-sec"><div class="ss-hdr"><div class="ss-title"><i class="fas fa-pen"></i> Practice Q&A</div></div><div class="ss-body"><div class="qa-l">${qs}</div></div></div>`; }
    if (data.real_world_applications?.length) { const items = data.real_world_applications.map((a, i) => `<div class="list-item"><i class="fas fa-globe"></i><div><strong>App ${i+1}:</strong> ${this._esc(a)}</div></div>`).join(''); h += `<div class="study-sec"><div class="ss-hdr"><div class="ss-title"><i class="fas fa-globe"></i> Real-World Applications</div></div><div class="ss-body"><div class="items-l">${items}</div></div></div>`; }
    return h;
  }
  
  _buildFC(data) {
    const cards = [];
    (data.key_concepts || []).forEach(c => { const p = c.split(':'); cards.push({ q: (p[0] || c).trim(), a: p.slice(1).join(':').trim() || c }); });
    (data.practice_questions || []).forEach(q => cards.push({ q: q.question, a: q.answer }));
    if (!cards.length) return this._buildNotes(data);
    this.fcCards = cards; this.fcCurrent = 0; this.fcFlipped = false;
    const total = cards.length;
    return `<div class="study-sec"><div class="ss-hdr"><div class="ss-title"><i class="fas fa-layer-group"></i> Flashcards (${total})</div></div><div class="ss-body"><div class="fc-c"><div class="fc-prog">Card <span id="fcCur">1</span>/${total} <span id="fcPct">${(1/total*100).toFixed(0)}</span>%</div><div class="fc-wrap" onclick="window._app._fcFlip()"><div class="flashcard" id="fcCard"><div class="fc-front"><div class="fc-lbl">Question</div><div class="fc-cont" id="fcFront">${this._esc(cards[0].q)}</div></div><div class="fc-back"><div class="fc-lbl">Answer</div><div class="fc-cont" id="fcBack">${this._renderMd(cards[0].a)}</div></div></div></div><div class="fc-btns"><button onclick="window._app._fcNav(-1)"><i class="fas fa-arrow-left"></i> Prev</button><button class="primary" onclick="window._app._fcFlip()"><i class="fas fa-sync"></i> Flip</button><button onclick="window._app._fcNav(1)">Next <i class="fas fa-arrow-right"></i></button></div><div class="fc-btns"><button onclick="window._app._fcShuffle()"><i class="fas fa-random"></i> Shuffle</button><button onclick="window._app._fcRestart()"><i class="fas fa-redo"></i> Restart</button></div></div></div></div>`;
  }
  
  _fcFlip() { const c = this._el('fcCard'); if (c) { this.fcFlipped = !this.fcFlipped; c.classList.toggle('flipped', this.fcFlipped); } }
  _fcNav(d) { if (!this.fcCards.length) return; this.fcCurrent = Math.max(0, Math.min(this.fcCards.length - 1, this.fcCurrent + d)); this.fcFlipped = false; const c = this._el('fcCard'); if (c) c.classList.remove('flipped'); const crd = this.fcCards[this.fcCurrent]; const f = this._el('fcFront'); const b = this._el('fcBack'); const cur = this._el('fcCur'); const pct = this._el('fcPct'); if (f) f.textContent = crd.q; if (b) b.innerHTML = this._renderMd(crd.a); if (cur) cur.textContent = this.fcCurrent + 1; if (pct) pct.textContent = Math.round((this.fcCurrent + 1) / this.fcCards.length * 100); }
  _fcShuffle() { for (let i = this.fcCards.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [this.fcCards[i], this.fcCards[j]] = [this.fcCards[j], this.fcCards[i]]; } this.fcCurrent = 0; this._fcNav(0); this._toast('info', 'fa-random', 'Shuffled!'); }
  _fcRestart() { this.fcCurrent = 0; this._fcNav(0); }
  
  _buildQuiz(data) {
    const qs = data.practice_questions || [];
    if (!qs.length) return this._buildNotes(data);
    this.quizData = qs.map((q, idx) => { const opts = this._genOptions(q, data, idx); return { ...q, options: opts, correctIdx: opts.findIndex(o => o.correct), answered: false, correct: false, selected: -1 }; });
    this.quizScore = 0;
    return `<div class="study-sec"><div class="ss-hdr"><div class="ss-title"><i class="fas fa-question-circle"></i> Quiz (${qs.length})</div><div class="quiz-score">⭐ <span id="qsScore">0</span>/${qs.length}</div></div><div class="ss-body" id="quizBody">${this._renderQ(0)}</div></div>`;
  }
  
  _genOptions(qa, data, idx) {
    const correct = qa.answer || '';
    const short = this._stripMd(correct).split('.')[0].trim().substring(0, 100);
    const dist = [`This is incorrect because...`, `A common misunderstanding...`, `This describes a different concept...`];
    const opts = [{ text: short, correct: true }, { text: dist[0], correct: false }, { text: dist[1], correct: false }, { text: dist[2], correct: false }];
    for (let i = opts.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [opts[i], opts[j]] = [opts[j], opts[i]]; }
    return opts;
  }
  
  _renderQ(idx) {
    if (idx >= this.quizData.length) return this._renderResults();
    const q = this.quizData[idx];
    const letters = ['A', 'B', 'C', 'D'];
    const opts = q.options.map((o, i) => `<button class="quiz-opt" onclick="window._app._selectOpt(${idx}, ${i})" ${q.answered ? 'disabled' : ''}><span class="qol">${letters[i]}</span><span>${this._esc(o.text)}</span></button>`).join('');
    return `<div><div class="quiz-q"><span>Q${idx+1}/${this.quizData.length}</span><span>${this._esc(q.question)}</span></div><div class="quiz-opts">${opts}</div><div id="qaArea${idx}" class="qa-area"></div><div id="qnNav${idx}" class="qn-nav"></div></div>`;
  }
  
  _selectOpt(qIdx, oIdx) {
    const q = this.quizData[qIdx];
    if (q.answered) return;
    q.answered = true; q.selected = oIdx; q.correct = q.options[oIdx].correct;
    if (q.correct) { this.quizScore++; this._toast('success', 'fa-check', '✓ Correct!'); }
    else { this._toast('info', 'fa-book', '✗ Not quite. Check explanation.'); }
    const score = this._el('qsScore'); if (score) score.textContent = this.quizScore;
    const optsDiv = this._el(`quizOpts_${qIdx}`); if (optsDiv) { const btns = optsDiv.querySelectorAll('.quiz-opt'); btns.forEach((b, i) => { b.disabled = true; if (q.options[i].correct) b.classList.add('correct'); else if (i === oIdx && !q.options[i].correct) b.classList.add('wrong'); }); }
    const ansDiv = this._el(`qaArea${qIdx}`); if (ansDiv) { ansDiv.innerHTML = `<div class="quiz-exp ${q.correct ? 'correct' : 'incorrect'}"><strong>${q.correct ? '✓ Correct!' : '✗ Incorrect'}</strong><div class="md-content">${this._renderMd(q.answer)}</div></div>`; ansDiv.style.display = 'block'; }
    const navDiv = this._el(`qnNav${qIdx}`); if (navDiv) { navDiv.innerHTML = `<button class="quiz-next" onclick="window._app._nextQ(${qIdx})">${qIdx+1 < this.quizData.length ? 'Next →' : '🏆 See Results'}</button>`; navDiv.style.display = 'flex'; }
  }
  
  _nextQ(curr) { this.quizIdx = curr + 1; const body = this._el('quizBody'); if (body) { if (this.quizIdx >= this.quizData.length) body.innerHTML = this._renderResults(); else body.innerHTML = this._renderQ(this.quizIdx); body.scrollIntoView({ behavior: 'smooth' }); } }
  
  _renderResults() {
    const total = this.quizData.length; const score = this.quizScore; const pct = Math.round(score/total*100);
    const grade = pct >= 80 ? '🏆 Excellent!' : pct >= 60 ? '🎓 Good!' : pct >= 40 ? '📚 Keep going!' : '💪 More practice needed';
    const review = this.quizData.map((q, i) => `<div class="review-item ${q.correct ? 'correct' : 'wrong'}"><span>Q${i+1}</span><span>${this._esc(q.question.substring(0, 60))}</span><span>${q.correct ? '✓' : '✗'}</span></div>`).join('');
    return `<div class="quiz-res"><div class="qr-score"><div>${pct}%</div><div>${grade}</div><div>${score}/${total} correct</div></div><div class="qr-btns"><button class="btn" onclick="window._app._restartQuiz()"><i class="fas fa-redo"></i> Try Again</button><button class="btn" onclick="window._app._toggleReview()"><i class="fas fa-eye"></i> Review</button></div><div id="quizReview" class="quiz-review" style="display:none">${review}</div></div>`;
  }
  
  _toggleReview() { const r = this._el('quizReview'); if (r) r.style.display = r.style.display === 'none' ? 'block' : 'none'; }
  _restartQuiz() { this.quizScore = 0; this.quizData = this.quizData.map(q => ({ ...q, answered: false, correct: false, selected: -1 })); const body = this._el('quizBody'); if (body) body.innerHTML = this._renderQ(0); const sc = this._el('qsScore'); if (sc) sc.textContent = '0'; }
  
  _buildSummary(data) {
    let h = '';
    if (data.ultra_long_notes) {
      const tldr = data.ultra_long_notes.split(/\n{2,}/).slice(0, 2).join('\n\n');
      h += `<div class="study-sec"><div class="ss-hdr"><div class="ss-title"><i class="fas fa-bolt"></i> TL;DR</div></div><div class="ss-body md-content">${this._renderMd(tldr)}</div></div>`;
      h += `<div class="study-sec"><div class="ss-hdr"><div class="ss-title"><i class="fas fa-book"></i> Full Summary</div></div><div class="ss-body md-content">${this._renderMd(data.ultra_long_notes)}</div></div>`;
    }
    if (data.key_concepts?.length) { const pts = data.key_concepts.map((c, i) => `<div class="kp"><span class="kpn">${i+1}</span><span>${this._esc(c)}</span></div>`).join(''); h += `<div class="study-sec"><div class="ss-hdr"><div class="ss-title"><i class="fas fa-list"></i> Key Points</div></div><div class="ss-body"><div class="kps">${pts}</div></div></div>`; }
    return h;
  }
  
  _buildMindMap(data) {
    const topic = data.topic || 'Topic';
    const branches = [{ title: 'Core Concepts', items: data.key_concepts || [], icon: 'fa-lightbulb' }, { title: 'Study Tricks', items: data.key_tricks || [], icon: 'fa-magic' }, { title: 'Applications', items: data.real_world_applications || [], icon: 'fa-globe' }].filter(b => b.items.length);
    const html = `<div class="study-sec"><div class="ss-hdr"><div class="ss-title"><i class="fas fa-project-diagram"></i> Mind Map</div></div><div class="ss-body"><div class="mm-root">${this._esc(topic)}</div><div class="mm-branches">${branches.map(b => `<div class="mm-branch"><div class="mm-hdr"><i class="fas ${b.icon}"></i> ${b.title}</div>${b.items.map(i => `<div class="mm-node">• ${this._esc(i)}</div>`).join('')}</div>`).join('')}</div></div></div>`;
    if (data.ultra_long_notes) return html + `<div class="study-sec"><div class="ss-hdr"><div class="ss-title"><i class="fas fa-book"></i> Details</div></div><div class="ss-body md-content">${this._renderMd(data.ultra_long_notes)}</div></div>`;
    return html;
  }
  
  /* ═══════════════════════════════════════════════════════════════════════════
     PDF EXPORT
     ═══════════════════════════════════════════════════════════════════════════ */
  
  _downloadPDF() {
    const data = this.currentData;
    if (!data) { this._toast('info', 'fa-info', 'Generate content first.'); return; }
    if (!window.jspdf?.jsPDF) { this._toast('error', 'fa-times', 'PDF library not loaded.'); return; }
    this._toast('info', 'fa-spinner fa-pulse', 'Generating PDF...');
    try {
      const { jsPDF } = window.jspdf;
      const doc = new jsPDF({ unit: 'mm', format: 'a4' });
      const pageW = 210, pageH = 297, l = 15, r = 15, t = 35, b = 20, cw = pageW - l - r;
      let y = t, page = 1;
      
      const addPage = () => { doc.addPage(); page++; y = t; this._drawHeader(doc, pageW, l, r); };
      const check = (need) => { if (y + need > pageH - b) addPage(); };
      const txt = (text, size, bold, color, indent = 0, lh = 1.5) => {
        if (!text) return;
        const lines = doc.splitTextToSize(this._stripMd(String(text)), cw - indent);
        doc.setFontSize(size); doc.setFont('helvetica', bold ? 'bold' : 'normal'); doc.setTextColor(color[0], color[1], color[2]);
        lines.forEach(line => { check(size * 0.352 * lh + 2); doc.text(line, l + indent, y); y += size * 0.352 * lh; });
      };
      
      this._drawHeader(doc, pageW, l, r);
      doc.setFontSize(20); doc.setFont('helvetica', 'bold'); doc.setTextColor(201, 169, 110);
      const title = this._stripMd(data.topic || 'Study Notes');
      const tlines = doc.splitTextToSize(title, cw);
      tlines.forEach(line => { check(10); doc.text(line, l + (cw - doc.getTextWidth(line)) / 2, y); y += 8; });
      y += 8;
      txt(`${TOOL_CONFIG[this.tool]?.sfpName || 'Notes'} · ${new Date().toLocaleDateString()} · ${this._wordCount(this._stripMd(data.ultra_long_notes || ''))} words`, 9, false, [100, 100, 100]);
      y += 6;
      doc.setDrawColor(201, 169, 110); doc.line(l, y, pageW - r, y); y += 8;
      
      if (data.ultra_long_notes) { txt(data.ultra_long_notes, 10, false, [30, 30, 30], 0, 1.6); y += 6; }
      
      const totalPages = doc.internal.getNumberOfPages();
      for (let p = 1; p <= totalPages; p++) {
        doc.setPage(p);
        doc.setFontSize(8); doc.setFont('helvetica', 'normal'); doc.setTextColor(150, 150, 150);
        doc.text(`${SAVOIRÉ.BRAND} · ${SAVOIRÉ.DEVELOPER}`, l, pageH - 8);
        doc.text(`${p} / ${totalPages}`, pageW - r, pageH - 8, { align: 'right' });
      }
      
      const fname = `SavoireAI_${title.replace(/[^a-z0-9]/gi, '_').slice(0, 30)}.pdf`;
      doc.save(fname);
      this._toast('success', 'fa-file-pdf', 'PDF saved!');
    } catch(e) { this._toast('error', 'fa-times', 'PDF failed.'); }
  }
  
  _drawHeader(doc, w, l, r) {
    doc.setFillColor(10, 8, 6); doc.rect(0, 0, w, 30, 'F');
    doc.setFillColor(201, 169, 110); doc.rect(0, 0, w, 4, 'F');
    doc.setFontSize(12); doc.setFont('helvetica', 'bold'); doc.setTextColor(201, 169, 110);
    doc.text('SAVOIRÉ AI', l, 18);
    doc.setFontSize(7); doc.setFont('helvetica', 'normal'); doc.setTextColor(160, 130, 80);
    doc.text('Think Less. Know More.', l, 25);
    doc.setFontSize(8); doc.setTextColor(201, 169, 110);
    doc.text('savoireai.vercel.app', w - r, 18, { align: 'right' });
  }
  
  /* ═══════════════════════════════════════════════════════════════════════════
     UTILITIES
     ═══════════════════════════════════════════════════════════════════════════ */
  
  _copyResult() {
    const data = this.currentData;
    if (!data) { this._toast('info', 'fa-info', 'Nothing to copy.'); return; }
    let text = `# ${data.topic || 'Study Notes'}\n\n`;
    if (data.ultra_long_notes) text += this._stripMd(data.ultra_long_notes) + '\n\n';
    if (data.key_concepts?.length) { text += '## Key Concepts\n' + data.key_concepts.map((c, i) => `${i+1}. ${c}`).join('\n') + '\n\n'; }
    navigator.clipboard.writeText(text).then(() => this._toast('success', 'fa-check', 'Copied!')).catch(() => this._toast('error', 'fa-times', 'Copy failed.'));
  }
  
  _copyText(t) { navigator.clipboard.writeText(t).then(() => this._toast('success', 'fa-check', 'Copied!')).catch(() => this._toast('error', 'fa-times', 'Failed')); }
  
  _saveNote() {
    const data = this.currentData;
    if (!data) { this._toast('info', 'fa-info', 'Nothing to save.'); return; }
    if (this.saved.find(s => s.topic === data.topic && s.tool === this.tool)) { this._toast('info', 'fa-star', 'Already saved!'); return; }
    if (this.saved.length >= SAVOIRÉ.MAX_SAVED) { this._toast('error', 'fa-archive', `Max ${SAVOIRÉ.MAX_SAVED} notes.`); return; }
    this.saved.unshift({ id: this._genId(), topic: data.topic || 'Untitled', tool: this.tool, data, savedAt: Date.now() });
    this._save('sv_saved', this.saved);
    this._updateStats();
    this._toast('success', 'fa-star', 'Saved to library!');
  }
  
  _shareResult() {
    const data = this.currentData;
    if (!data) { this._toast('info', 'fa-info', 'Nothing to share.'); return; }
    const sd = { title: `${data.topic || 'Notes'} — Savoiré AI`, text: `Study notes on "${data.topic}"`, url: `https://${SAVOIRÉ.WEBSITE}` };
    if (navigator.share) navigator.share(sd).catch(() => this._fallbackShare(sd));
    else this._fallbackShare(sd);
  }
  
  _fallbackShare(sd) { navigator.clipboard.writeText(sd.url).then(() => this._toast('success', 'fa-link', 'Link copied!')); }
  
  _clearOutput() {
    if (!this.currentData) return;
    this._confirm('Clear output?', () => { this.currentData = null; this._el('resultArea').style.display = 'none'; this._el('emptyState').style.display = 'flex'; this.fcCards = []; this.quizData = []; this._toast('info', 'fa-trash', 'Cleared.'); });
  }
  
  _addHistory(item) {
    this.history = this.history.filter(h => !(h.topic === item.topic && h.tool === item.tool));
    this.history.unshift(item);
    if (this.history.length > SAVOIRÉ.MAX_HISTORY) this.history.pop();
    this._save('sv_history', this.history);
    this._renderHistory();
    this._updateBadge();
  }
  
  _renderHistory() {
    const list = this._el('lpHistList');
    if (!list) return;
    if (!this.history.length) { list.innerHTML = '<div class="empty-hist">No history yet</div>'; return; }
    const icons = { notes:'fa-book', flashcards:'fa-layer-group', quiz:'fa-question', summary:'fa-align-left', mindmap:'fa-project-diagram' };
    list.innerHTML = this.history.slice(0, 6).map(h => `<div class="hist-item" onclick="window._app._loadHistory('${h.id}')"><i class="fas ${icons[h.tool] || 'fa-book'}"></i><span>${this._esc(h.topic.substring(0, 30))}</span><span class="time">${this._relTime(h.ts)}</span></div>`).join('');
  }
  
  _openHistory() { this._renderHistoryModal(); this._openModal('histModal'); }
  _filterHistory(q) { const f = this._qs('.hf.active')?.dataset?.filter || 'all'; this._renderHistoryModal(f, q); }
  
  _renderHistoryModal(f = 'all', q = '') {
    const list = this._el('histList'); const empty = this._el('histEmpty');
    if (!list) return;
    let filtered = this.history;
    if (f !== 'all') filtered = filtered.filter(h => h.tool === f);
    if (q) filtered = filtered.filter(h => h.topic.toLowerCase().includes(q.toLowerCase()));
    if (!filtered.length) { list.innerHTML = ''; if (empty) empty.style.display = 'flex'; return; }
    if (empty) empty.style.display = 'none';
    const groups = {};
    filtered.forEach(h => { const g = this._dateGroup(h.ts); if (!groups[g]) groups[g] = []; groups[g].push(h); });
    const icons = { notes:'fa-book', flashcards:'fa-layer-group', quiz:'fa-question', summary:'fa-align-left', mindmap:'fa-project-diagram' };
    const hl = (t, s) => { if (!s) return this._esc(t); const re = new RegExp(`(${s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi'); return this._esc(t).replace(re, '<mark>$1</mark>'); };
    list.innerHTML = Object.entries(groups).map(([g, items]) => `<div class="hist-group">${g}</div>${items.map(h => `<div class="hist-item" onclick="window._app._loadHistory('${h.id}')"><div class="hist-icon"><i class="fas ${icons[h.tool] || 'fa-book'}"></i></div><div><div class="hist-title">${hl(h.topic, q)}</div><div class="hist-meta"><span>${h.tool}</span><span>${this._relTime(h.ts)}</span></div></div><button class="hist-del" onclick="event.stopPropagation();window._app._delHistory('${h.id}')"><i class="fas fa-trash"></i></button></div>`).join('')}`).join('');
  }
  
  _loadHistory(id) { const h = this.history.find(x => x.id === id); if (h?.data) { this._closeModal('histModal'); this.currentData = h.data; this.tool = h.tool || 'notes'; this._setTool(this.tool); this._renderResult(h.data); this._toast('info', 'fa-history', `Loaded: ${h.topic.substring(0, 40)}`); } }
  _delHistory(id) { this.history = this.history.filter(x => x.id !== id); this._save('sv_history', this.history); this._updateBadge(); this._renderHistory(); this._updateStats(); this._renderHistoryModal(this._qs('.hf.active')?.dataset?.filter || 'all', this._el('histSearchInput')?.value || ''); }
  
  _openSaved() { this._renderSaved(); this._openModal('savedModal'); }
  _renderSaved() { const list = this._el('savedList'); const empty = this._el('savedEmpty'); if (!list) return; if (!this.saved.length) { list.innerHTML = ''; if (empty) empty.style.display = 'flex'; return; } if (empty) empty.style.display = 'none'; const icons = { notes:'fa-book', flashcards:'fa-layer-group', quiz:'fa-question', summary:'fa-align-left', mindmap:'fa-project-diagram' }; list.innerHTML = this.saved.map(s => `<div class="hist-item" onclick="window._app._loadSaved('${s.id}')"><div class="hist-icon"><i class="fas ${icons[s.tool] || 'fa-star'}"></i></div><div><div class="hist-title">${this._esc(s.topic.substring(0, 70))}</div><div class="hist-meta"><span>${s.tool}</span><span>Saved ${this._relTime(s.savedAt)}</span></div></div><button class="hist-del" onclick="event.stopPropagation();window._app._delSaved('${s.id}')"><i class="fas fa-trash"></i></button></div>`).join(''); }
  _loadSaved(id) { const s = this.saved.find(x => x.id === id); if (s?.data) { this._closeModal('savedModal'); this.currentData = s.data; this.tool = s.tool || 'notes'; this._setTool(this.tool); this._renderResult(s.data); this._toast('success', 'fa-star', `Loaded: ${s.topic.substring(0, 40)}`); } }
  _delSaved(id) { this.saved = this.saved.filter(x => x.id !== id); this._save('sv_saved', this.saved); this._updateStats(); this._renderSaved(); }
  
  _openSettings() { const ni = this._el('nameInput'); if (ni) ni.value = this.userName; this._openModal('settingsModal'); }
  _saveName() { const inp = this._el('nameInput'); const n = inp?.value?.trim(); if (!n || n.length < 2) { this._toast('error', 'fa-times', 'Name too short'); return; } this.userName = n; localStorage.setItem('sv_user', n); this._updateUI(); this._toast('success', 'fa-check', 'Name updated!'); }
  _exportData() { const obj = { exported: new Date().toISOString(), app: SAVOIRÉ.BRAND, userName: this.userName, sessions: this.sessions, history: this.history, saved: this.saved }; const b = new Blob([JSON.stringify(obj, null, 2)], { type: 'application/json' }); const a = document.createElement('a'); a.href = URL.createObjectURL(b); a.download = `savoire-backup-${Date.now()}.json`; a.click(); URL.revokeObjectURL(a.href); this._toast('success', 'fa-download', 'Exported!'); }
  _clearAll() { Object.keys(localStorage).filter(k => k.startsWith('sv_')).forEach(k => localStorage.removeItem(k)); this._toast('info', 'fa-trash', 'Cleared. Reloading...'); setTimeout(() => location.reload(), 1500); }
  
  _toggleTheme() { const cur = document.documentElement.dataset.theme || 'dark'; this._setTheme(cur === 'dark' ? 'light' : 'dark'); }
  _setTheme(t) { document.documentElement.dataset.theme = t; const ic = this._el('themeIcon'); if (ic) ic.className = t === 'dark' ? 'fas fa-moon' : 'fas fa-sun'; this._qsa('[data-theme-btn]').forEach(b => { b.classList.toggle('active', b.dataset.themeBtn === t); }); this.prefs.theme = t; this._save('sv_prefs', this.prefs); }
  _setFontSize(s) { document.documentElement.dataset.font = s; this._qsa('.font-sz').forEach(b => { b.classList.toggle('active', b.dataset.size === s); }); this.prefs.fontSize = s; this._save('sv_prefs', this.prefs); }
  _applyPrefs() { if (this.prefs.theme) this._setTheme(this.prefs.theme); if (this.prefs.fontSize) this._setFontSize(this.prefs.fontSize); if (this.prefs.lastTool) this._setTool(this.prefs.lastTool); }
  
  _toggleSidebar() { const lp = this._el('leftPanel'); if (!lp) return; if (window.innerWidth <= 768) { const o = lp.classList.toggle('mobile-open'); this._el('sbBackdrop')?.classList.toggle('visible', o); } else { lp.classList.toggle('collapsed'); const sfp = this._el('streamFullpage'); if (sfp) sfp.classList.toggle('panel-open', !lp.classList.contains('collapsed')); } }
  _closeMobileSidebar() { const lp = this._el('leftPanel'); if (lp) lp.classList.remove('mobile-open'); this._el('sbBackdrop')?.classList.remove('visible'); }
  _handleResize() { if (window.innerWidth > 768) this._closeMobileSidebar(); }
  
  _toggleFocusMode() {
    this.focusMode = !this.focusMode;
    const lp = this._el('leftPanel'); const btn = this._el('focusModeBtn');
    if (this.focusMode) { if (lp) lp.classList.add('collapsed'); if (btn) btn.innerHTML = '<i class="fas fa-compress-alt"></i> Exit Focus'; this._toast('info', 'fa-expand', 'Focus mode on'); }
    else { if (lp) lp.classList.remove('collapsed'); if (btn) btn.innerHTML = '<i class="fas fa-expand-alt"></i> Focus'; }
  }
  
  _openModal(id) { const m = this._el(id); if (m) { m.style.display = 'flex'; document.body.style.overflow = 'hidden'; setTimeout(() => m.querySelector('input, button')?.focus(), 100); } }
  _closeModal(id) { const m = this._el(id); if (m) { m.style.display = 'none'; if (!this._qs('.modal-overlay[style*="flex"]')) document.body.style.overflow = ''; } }
  _closeAllModals() { this._qsa('.modal-overlay').forEach(m => m.style.display = 'none'); document.body.style.overflow = ''; this._closeDropdown(); }
  _confirm(msg, cb) { const me = this._el('confirmMsg'); if (me) me.textContent = msg; this.confirmCb = cb; this._openModal('confirmModal'); }
  _toggleDropdown() { const dd = this._el('avDropdown'); if (dd) dd.classList.toggle('open'); }
  _closeDropdown() { const dd = this._el('avDropdown'); if (dd) dd.classList.remove('open'); }
  
  _toast(type, icon, msg, dur = 4000) {
    const c = this._el('toastContainer');
    if (!c) return;
    while (c.children.length >= 3) c.removeChild(c.firstChild);
    const t = document.createElement('div');
    t.className = `toast ${type}`;
    t.innerHTML = `<i class="fas ${icon}"></i><span>${this._esc(msg)}</span>`;
    t.addEventListener('click', () => { t.classList.add('remove'); setTimeout(() => t.remove(), 300); });
    c.appendChild(t);
    setTimeout(() => { if (t.parentNode) { t.classList.add('remove'); setTimeout(() => t.remove(), 300); } }, dur);
  }
}

/* ═══════════════════════════════════════════════════════════════════════════
   INIT
   ═══════════════════════════════════════════════════════════════════════════ */

window.addEventListener('DOMContentLoaded', () => {
  window._app = new SavoireApp();
  window.setSugg = (topic) => { const ta = document.getElementById('mainInput'); if (ta) { ta.value = topic; ta.dispatchEvent(new Event('input')); ta.focus(); } };
  console.log('%c⚡ Savoiré AI — Fast Live Output Ready', 'color:#C9A96E;font-size:14px;font-weight:bold');
});

/* ═══════════════════════════════════════════════════════════════════════════
   END
   ═══════════════════════════════════════════════════════════════════════════ */
'use strict';
/* =====================================================================
   SAVOIRÉ AI v2.0 — FRONTEND APPLICATION
   Built by Sooban Talha Technologies
   Founder: Sooban Talha
   Website: https://savoireai.vercel.app
   ===================================================================== */

class SavoireApp {
  constructor() {
    /* ── branding ── */
    this.VERSION   = '2.0';
    this.BRAND     = 'Savoiré AI v2.0';
    this.DEVELOPER = 'Sooban Talha Technologies';
    this.FOUNDER   = 'Sooban Talha';
    this.WEBSITE   = 'savoireai.vercel.app';

    /* ── state ── */
    this.tool          = 'notes';
    this.generating    = false;
    this.currentData   = null;
    this.userName      = '';
    this.confirmCb     = null;
    this.particleRAF   = null;
    this.thinkTimer    = null;
    this.stageIdx      = 0;
    this.sidebarOpen   = true;

    /* ── interactive state ── */
    this.fcCards    = [];
    this.fcCurrent  = 0;
    this.fcFlipped  = false;
    this.quizData   = [];
    this.quizIdx    = 0;
    this.quizScore  = 0;
    this.quizDone   = false;

    /* ── persistence ── */
    this.history  = this._load('sv_history',  []);
    this.saved    = this._load('sv_saved',     []);
    this.prefs    = this._load('sv_prefs',     {});
    this.userName = localStorage.getItem('sv_user') || '';

    /* ── boot ── */
    this._boot();
  }

  /* ═══════════════════════════════════════════
     BOOT
  ═══════════════════════════════════════════ */
  _boot() {
    /* hide page loader */
    const loader = this._el('pageLoader');
    if (loader) {
      setTimeout(() => {
        loader.classList.add('hidden');
        setTimeout(() => { if (loader.parentNode) loader.parentNode.removeChild(loader); }, 600);
      }, 1600);
    }

    this._bindAll();
    this._applyPrefs();
    this._initWelcome();
    this._updateHistBadge();

    console.log(`%c✨ ${this.BRAND} — Think Less. Know More.`, 'color:#C9A96E;font-size:18px;font-weight:bold');
    console.log(`%cBuilt by ${this.DEVELOPER} | ${this.WEBSITE}`, 'color:#C9A96E;font-size:12px');
  }

  /* ═══════════════════════════════════════════
     HELPERS
  ═══════════════════════════════════════════ */
  _el(id)       { return document.getElementById(id); }
  _qs(sel)      { return document.querySelector(sel); }
  _qsa(sel)     { return document.querySelectorAll(sel); }
  _on(id,ev,fn) { const el=this._el(id); if(el) el.addEventListener(ev,fn); }

  _load(key, def) {
    try { const v=localStorage.getItem(key); return v?JSON.parse(v):def; }
    catch(e) { return def; }
  }
  _save(key, val) {
    try { localStorage.setItem(key, JSON.stringify(val)); } catch(e) {}
  }

  _esc(s) {
    if (!s) return '';
    return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;')
                    .replace(/"/g,'&quot;').replace(/'/g,'&#039;');
  }

  _relTime(ts) {
    if (!ts) return '';
    const d = Date.now() - ts;
    const m = Math.floor(d/60000);
    const h = Math.floor(d/3600000);
    const day = Math.floor(d/86400000);
    if (m < 1)  return 'just now';
    if (m < 60) return `${m}m ago`;
    if (h < 24) return `${h}h ago`;
    return `${day}d ago`;
  }

  _genId() { return Date.now().toString(36)+Math.random().toString(36).slice(2); }

  _shuffle(arr) {
    const a=[...arr];
    for(let i=a.length-1;i>0;i--){
      const j=Math.floor(Math.random()*(i+1));
      [a[i],a[j]]=[a[j],a[i]];
    }
    return a;
  }

  _renderMd(text) {
    if (!text) return '';
    if (window.marked && window.DOMPurify) {
      return DOMPurify.sanitize(marked.parse(text));
    }
    /* fallback manual render */
    return text
      .replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;')
      .replace(/^###\s(.+)$/gm,'<h3>$1</h3>')
      .replace(/^##\s(.+)$/gm,'<h2>$1</h2>')
      .replace(/^#\s(.+)$/gm,'<h1>$1</h1>')
      .replace(/\*\*(.+?)\*\*/g,'<strong>$1</strong>')
      .replace(/\*(.+?)\*/g,'<em>$1</em>')
      .replace(/`(.+?)`/g,'<code>$1</code>')
      .replace(/^>\s(.+)$/gm,'<blockquote>$1</blockquote>')
      .replace(/^[-*]\s(.+)$/gm,'<li>$1</li>')
      .replace(/^\d+\.\s(.+)$/gm,'<li>$2</li>')
      .replace(/\n\n/g,'</p><p>')
      .replace(/\n/g,'<br>');
  }

  _stripMd(t) {
    if (!t) return '';
    return t.replace(/#{1,6}\s/g,'').replace(/\*\*(.+?)\*\*/g,'$1')
            .replace(/\*(.+?)\*/g,'$1').replace(/`(.+?)`/g,'$1')
            .replace(/^[-*]\s/gm,'').replace(/^\d+\.\s/gm,'').trim();
  }

  /* ═══════════════════════════════════════════
     BIND ALL EVENTS
  ═══════════════════════════════════════════ */
  _bindAll() {
    /* welcome */
    this._on('welcomeBtn',       'click',  ()=>this._submitWelcome());
    this._on('welcomeNameInput', 'keydown', e=>{ if(e.key==='Enter') this._submitWelcome(); });

    /* header */
    this._on('sidebarToggleBtn', 'click',  ()=>this._toggleSidebar());
    this._on('homeLink',         'click',  e=>{ e.preventDefault(); this._goHome(); });
    this._on('historyOpenBtn',   'click',  ()=>this._openHistModal());
    this._on('themeToggleBtn',   'click',  ()=>this._toggleTheme());
    this._on('settingsOpenBtn',  'click',  ()=>this._openSettingsModal());
    this._on('avatarBtn',        'click',  e=>{ e.stopPropagation(); this._toggleDropdown(); });

    /* dropdown */
    this._on('adHistoryBtn',  'click', ()=>{ this._closeDropdown(); this._openHistModal(); });
    this._on('adSavedBtn',    'click', ()=>{ this._closeDropdown(); this._openSavedModal(); });
    this._on('adSettingsBtn', 'click', ()=>{ this._closeDropdown(); this._openSettingsModal(); });
    this._on('adClearBtn',    'click', ()=>{ this._closeDropdown(); this._confirm('Clear ALL data? This cannot be undone.', ()=>this._clearAllData()); });
    document.addEventListener('click', ()=>this._closeDropdown());

    /* all tool pills */
    this._qsa('.tool-pill').forEach(btn => {
      btn.addEventListener('click', ()=>this._setTool(btn.dataset.tool));
    });

    /* sidebar nav */
    this._qsa('.sb-nav-item').forEach(btn => {
      btn.addEventListener('click', ()=>this._setTool(btn.dataset.tool));
    });

    /* sidebar templates */
    this._qsa('.sb-tpl').forEach(btn => {
      btn.addEventListener('click', ()=>{
        const tpl  = btn.dataset.tpl;
        const tool = btn.dataset.tool || 'notes';
        const inp  = this._el('mainInput');
        if (inp) { inp.value=tpl; this._autoResize(); this._updateCharCount(); inp.focus(); }
        this._setTool(tool);
        if (window.innerWidth <= 768) this._closeSidebarMobile();
      });
    });

    /* sidebar history */
    this._on('sbHistoryAllBtn', 'click', ()=>this._openHistModal());
    this._on('sbNewBtn',        'click', ()=>this._goHome());

    /* input */
    this._on('mainInput',  'input',   ()=>{ this._autoResize(); this._updateCharCount(); });
    this._on('mainInput',  'keydown', e=>{ if(e.key==='Enter'&&!e.shiftKey){e.preventDefault();this._send();} });
    this._on('sendBtn',    'click',   ()=>this._send());
    this._on('uploadFileBtn','click', ()=>this._el('fileInput')?.click());
    this._on('fileInput',  'change',  e=>this._handleFile(e.target.files[0]));

    /* suggestion chips */
    this._qsa('.sugg-chip').forEach(c => {
      c.addEventListener('click', ()=>{
        const inp = this._el('mainInput');
        if (inp) { inp.value=c.dataset.prompt; this._autoResize(); this._updateCharCount(); inp.focus(); }
      });
    });

    /* bottom bar */
    this._on('clearChatBtn',    'click', ()=>this._confirm('Clear all messages?',    ()=>this._clearChat()));
    this._on('exportAllPdfBtn', 'click', ()=>this._exportAllPdf());
    this._on('copyAllBtn',      'click', ()=>this._copyAll());

    /* history modal */
    this._on('histSearchInput', 'input',  e=>this._filterHist(e.target.value));
    this._on('clearHistoryBtn', 'click',  ()=>this._confirm('Clear all history?', ()=>{ this.history=[]; this._save('sv_history',this.history); this._renderHistModal(); this._renderSbHistory(); this._updateHistBadge(); this._toast('info','fa-trash','History cleared.'); }));
    this._on('exportHistBtn',   'click',  ()=>this._exportDataJson());
    this._qsa('.hist-filter').forEach(btn => {
      btn.addEventListener('click', ()=>{
        this._qsa('.hist-filter').forEach(b=>b.classList.remove('active'));
        btn.classList.add('active');
        this._renderHistModal(btn.dataset.filter, this._el('histSearchInput')?.value||'');
      });
    });

    /* settings modal */
    this._on('saveNameBtn',  'click', ()=>this._saveName());
    this._on('exportDataBtn','click', ()=>this._exportDataJson());
    this._on('clearDataBtn', 'click', ()=>this._confirm('Delete ALL data — history, saved notes, preferences?', ()=>this._clearAllData()));
    this._qsa('[data-theme-btn]').forEach(btn => {
      btn.addEventListener('click', ()=>this._setTheme(btn.dataset.themeBtn));
    });
    this._qsa('.font-size-btn').forEach(btn => {
      btn.addEventListener('click', ()=>this._setFontSize(btn.dataset.size));
    });

    /* modal close buttons */
    this._qsa('[data-close]').forEach(btn => {
      btn.addEventListener('click', ()=>this._closeModal(btn.dataset.close));
    });
    this._qsa('.modal-close-btn').forEach(btn => {
      const overlay = btn.closest('.modal-overlay');
      if (overlay) btn.addEventListener('click', ()=>this._closeModal(overlay.id));
    });
    this._qsa('.modal-overlay').forEach(ov => {
      ov.addEventListener('click', e=>{ if(e.target===ov) this._closeModal(ov.id); });
    });

    /* confirm modal */
    this._on('confirmOkBtn', 'click', ()=>{
      this._closeModal('confirmModal');
      if (typeof this.confirmCb === 'function') this.confirmCb();
      this.confirmCb = null;
    });

    /* keyboard shortcuts */
    document.addEventListener('keydown', e => {
      if ((e.ctrlKey||e.metaKey) && e.key==='k') { e.preventDefault(); this._el('mainInput')?.focus(); }
      if ((e.ctrlKey||e.metaKey) && e.key==='h') { e.preventDefault(); this._openHistModal(); }
      if (e.key==='Escape') this._closeAllModals();
      /* flashcard keyboard */
      if (this.fcCards.length>0) {
        if (e.key===' '||e.key==='Enter') { e.preventDefault(); this._fcFlip(); }
        if (e.key==='ArrowLeft')  this._fcNav(-1);
        if (e.key==='ArrowRight') this._fcNav(1);
      }
    });

    /* window resize */
    window.addEventListener('resize', ()=>this._handleResize());
  }

  /* ═══════════════════════════════════════════
     WELCOME
  ═══════════════════════════════════════════ */
  _initWelcome() {
    const overlay = this._el('welcomeOverlay');
    if (this.userName && this.userName.length >= 2) {
      if (overlay) overlay.style.display='none';
      this._updateUserUI();
    } else {
      if (overlay) { overlay.style.display='flex'; this._startParticles(); }
      setTimeout(() => this._el('welcomeNameInput')?.focus(), 500);
    }
  }

  _submitWelcome() {
    const inp  = this._el('welcomeNameInput');
    const errEl= this._el('welcomeErr');
    const name = inp?.value?.trim() || '';
    if (!name||name.length<2) {
      if (errEl) errEl.textContent='Please enter your name (at least 2 characters).';
      inp?.focus();
      return;
    }
    if (errEl) errEl.textContent='';
    this.userName = name;
    localStorage.setItem('sv_user', name);
    const overlay = this._el('welcomeOverlay');
    if (overlay) {
      overlay.classList.add('closing');
      setTimeout(()=>{ overlay.style.display='none'; overlay.classList.remove('closing'); }, 400);
    }
    if (this.particleRAF) { cancelAnimationFrame(this.particleRAF); this.particleRAF=null; }
    this._updateUserUI();
    this._toast('success','fa-check',`Welcome to Savoiré AI, ${name}! 🎓`);
  }

  _updateUserUI() {
    const ini = (this.userName||'S').charAt(0).toUpperCase();
    ['avatarLetter','adAvLetter','sbFooterAv'].forEach(id=>{
      const el=this._el(id); if(el) el.textContent=ini;
    });
    const adName = this._el('adName'); if(adName) adName.textContent=this.userName||'Scholar';
    const sbName = this._el('sbFooterName'); if(sbName) sbName.textContent=this.userName||'Scholar';
    const greet  = this._el('wswGreeting');
    if (greet) greet.textContent = this.userName ? `Welcome back, ${this.userName}!` : 'Think Less. Know More.';
  }

  /* ═══════════════════════════════════════════
     PARTICLES (welcome canvas)
  ═══════════════════════════════════════════ */
  _startParticles() {
    const canvas = this._el('welcomeCanvas');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const resize = () => { canvas.width=canvas.offsetWidth; canvas.height=canvas.offsetHeight; };
    resize();
    window.addEventListener('resize', resize);

    const N = 120;
    const pts = Array.from({length:N}, ()=>({
      x:  Math.random()*canvas.width,
      y:  Math.random()*canvas.height,
      vx: (Math.random()-.5)*.45,
      vy: (Math.random()-.5)*.45,
      r:  Math.random()*1.8+.4,
      a:  Math.random()*.35+.07,
    }));

    let mx=-999, my=-999;
    canvas.addEventListener('mousemove', e=>{
      const r=canvas.getBoundingClientRect();
      mx=e.clientX-r.left; my=e.clientY-r.top;
    });

    const draw = () => {
      ctx.clearRect(0,0,canvas.width,canvas.height);
      pts.forEach(p=>{
        const dx=p.x-mx, dy=p.y-my;
        const dist=Math.sqrt(dx*dx+dy*dy);
        if (dist<130) { p.vx+=dx/dist*.1; p.vy+=dy/dist*.1; }
        p.vx*=.97; p.vy*=.97;
        p.x+=p.vx; p.y+=p.vy;
        if(p.x<0) p.x=canvas.width;
        if(p.x>canvas.width) p.x=0;
        if(p.y<0) p.y=canvas.height;
        if(p.y>canvas.height) p.y=0;
        ctx.beginPath();
        ctx.arc(p.x,p.y,p.r,0,Math.PI*2);
        ctx.fillStyle=`rgba(201,169,110,${p.a})`;
        ctx.fill();
      });
      this.particleRAF=requestAnimationFrame(draw);
    };
    draw();
  }

  /* ═══════════════════════════════════════════
     TOOL SELECTION
  ═══════════════════════════════════════════ */
  _setTool(tool) {
    this.tool = tool;

    /* sync all pill buttons */
    this._qsa('.tool-pill').forEach(p => p.classList.toggle('active', p.dataset.tool===tool));
    this._qsa('.sb-nav-item').forEach(p => p.classList.toggle('active', p.dataset.tool===tool));

    /* tool indicator */
    const ICONS   = {notes:'fa-book-open',flashcards:'fa-layer-group',quiz:'fa-question-circle',summary:'fa-align-left',mindmap:'fa-project-diagram'};
    const LABELS  = {notes:'Generating: Comprehensive Study Notes',flashcards:'Generating: Interactive Flashcards',quiz:'Generating: Practice Quiz',summary:'Generating: Smart Summary',mindmap:'Generating: Mind Map'};
    const PLACEHOLDERS = {
      notes:      'Enter any topic, concept, or paste text for comprehensive notes…',
      flashcards: 'Enter a topic to create interactive flashcards…',
      quiz:       'Enter a topic to generate a practice quiz with answers…',
      summary:    'Enter a topic or paste text to summarize concisely…',
      mindmap:    'Enter a topic to build a structured mind map…',
    };
    const SEND_LABELS = {notes:'Generate',flashcards:'Create Cards',quiz:'Build Quiz',summary:'Summarize',mindmap:'Make Map'};

    const iconEl = this._el('iaToolIcon');
    const textEl = this._el('iaTToolText');
    const lblEl  = this._el('sendBtnLabel');
    const inpEl  = this._el('mainInput');
    if (iconEl) iconEl.className=`fas ${ICONS[tool]||'fa-book-open'}`;
    if (textEl) textEl.textContent=LABELS[tool]||'Generating…';
    if (lblEl)  lblEl.textContent=SEND_LABELS[tool]||'Generate';
    if (inpEl)  inpEl.placeholder=PLACEHOLDERS[tool]||'Enter topic…';

    this.prefs.lastTool=tool; this._save('sv_prefs',this.prefs);
  }

  /* ═══════════════════════════════════════════
     SEND / GENERATE
  ═══════════════════════════════════════════ */
  async _send() {
    const inp  = this._el('mainInput');
    const text = inp?.value?.trim();
    if (!text) { this._toast('info','fa-info-circle','Please enter a topic or question.'); return; }
    if (this.generating) { this._toast('warning','fa-hourglass-half','Please wait for the current generation.'); return; }

    const depth = this._el('depthSel')?.value   || 'detailed';
    const lang  = this._el('langSel')?.value    || 'English';
    const style = this._el('styleSel')?.value   || 'simple';

    /* show messages, hide welcome */
    this._el('wsWelcome').style.display  = 'none';
    this._el('wsMessages').style.display = 'block';

    this._addUserMsg(text);
    if (inp) { inp.value=''; this._autoResize(); this._updateCharCount(); }

    this._showThinking();
    this.generating = true;
    this._setSendLoading(true);

    try {
      const data = await this._callAPI(text, {depth, language:lang, style, tool:this.tool});
      this.currentData = data;
      this._hideThinking();
      this._renderResult(data);
      this._addToHistory({id:this._genId(), topic:data.topic||text, tool:this.tool, data, ts:Date.now()});
      this._toast('success','fa-check-circle','Study materials generated!');
    } catch(err) {
      this._hideThinking();
      this._addErrMsg(err.message||'Something went wrong. Please try again.');
      this._toast('error','fa-exclamation-circle',err.message||'Generation failed.');
    } finally {
      this.generating = false;
      this._setSendLoading(false);
    }
  }

  async _callAPI(message, opts={}) {
    const controller = new AbortController();
    const timer      = setTimeout(()=>controller.abort(), 180000);
    try {
      const res = await fetch('/api/study', {
        method: 'POST',
        headers: {'Content-Type':'application/json'},
        body: JSON.stringify({message, options:opts}),
        signal: controller.signal,
      });
      clearTimeout(timer);
      if (!res.ok) throw new Error(`Server error ${res.status}`);
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      return data;
    } catch(e) {
      clearTimeout(timer);
      if (e.name==='AbortError') throw new Error('Request timed out. The AI is busy — please try again.');
      throw e;
    }
  }

  /* ═══════════════════════════════════════════
     MESSAGE HELPERS
  ═══════════════════════════════════════════ */
  _addUserMsg(text) {
    const list = this._el('messagesList');
    if (!list) return;
    const time = new Date().toLocaleTimeString([],{hour:'2-digit',minute:'2-digit'});
    const ini  = (this.userName||'U').charAt(0).toUpperCase();
    const row  = document.createElement('div');
    row.className = 'msg-row user-row';
    row.innerHTML = `
      <div class="msg-av user-av">${ini}</div>
      <div class="msg-content">
        <div class="msg-bubble">${this._esc(text)}</div>
        <div class="msg-time">${time}</div>
      </div>`;
    list.appendChild(row);
    this._scrollBottom();
  }

  _addErrMsg(text) {
    const list = this._el('messagesList');
    if (!list) return;
    const row = document.createElement('div');
    row.className = 'msg-row';
    row.innerHTML = `
      <div class="msg-av ai-av">Ś</div>
      <div class="msg-content">
        <div class="msg-error">
          <strong><i class="fas fa-exclamation-circle"></i> Error</strong><br>
          ${this._esc(text)}<br>
          <small style="color:var(--t3);margin-top:8px;display:block">Please check your internet connection and try again. The AI models may be temporarily busy.</small>
        </div>
      </div>`;
    list.appendChild(row);
    this._scrollBottom();
  }

  _renderResult(data) {
    const list = this._el('messagesList');
    if (!list) return;
    const time = new Date().toLocaleTimeString([],{hour:'2-digit',minute:'2-digit'});
    const html = this._buildStudyHTML(data);
    const row  = document.createElement('div');
    row.className = 'msg-row';
    row.innerHTML = `
      <div class="msg-av ai-av">Ś</div>
      <div class="msg-content" style="max-width:100%">
        ${html}
        <div class="msg-time">${time}</div>
      </div>`;
    list.appendChild(row);
    this._scrollBottom();

    /* init interactive features */
    if (this.tool==='flashcards') this._fcInit(data);
    if (this.tool==='quiz')       this._quizInit(data);
  }

  /* ═══════════════════════════════════════════
     STUDY HTML BUILDER
  ═══════════════════════════════════════════ */
  _buildStudyHTML(data) {
    const topic = this._esc(data.topic || 'Study Material');
    const score = data.study_score || 96;
    const pct   = Math.min(100, Math.max(0, score));

    /* header */
    const header = `
      <div class="study-header-card">
        <div class="shc-left">
          <div class="study-h-topic">${topic}</div>
          <div class="study-h-meta">
            <div class="shm-item"><i class="fas fa-graduation-cap"></i>${this._esc(data.curriculum_alignment||'General Study')}</div>
            <div class="shm-item"><i class="fas fa-calendar-alt"></i>${new Date().toLocaleDateString()}</div>
            <div class="shm-item"><i class="fas fa-star"></i>Score: ${score}/100</div>
            <div class="shm-item"><i class="fas fa-globe"></i>${this._esc(data._language||'')}</div>
          </div>
          <div class="study-powered"><strong>${this.BRAND}</strong> &nbsp;·&nbsp; ${this.DEVELOPER} &nbsp;·&nbsp; ${this.WEBSITE}</div>
        </div>
        <div class="study-score-ring" style="--pct:${pct}">
          <div class="study-score-val">${score}</div>
        </div>
      </div>`;

    let content = '';
    switch (this.tool) {
      case 'flashcards': content = this._buildFcHTML(data);      break;
      case 'quiz':       content = this._buildQuizHTML(data);     break;
      case 'summary':    content = this._buildSummaryHTML(data);  break;
      case 'mindmap':    content = this._buildMindmapHTML(data);  break;
      default:           content = this._buildNotesHTML(data);    break;
    }

    const exports = `
      <div class="export-controls">
        <button class="exp-btn pdf"   onclick="window._sav.downloadPDF(this)"><i class="fas fa-file-pdf"></i>Download PDF</button>
        <button class="exp-btn copy"  onclick="window._sav.copyResult(this)"><i class="fas fa-copy"></i>Copy Text</button>
        <button class="exp-btn save"  onclick="window._sav.saveNote(this)"><i class="fas fa-star"></i>Save Note</button>
        <button class="exp-btn share" onclick="window._sav.shareResult(this)"><i class="fas fa-share-alt"></i>Share</button>
        <span class="exp-brand">${this.BRAND} &nbsp;·&nbsp; ${this.DEVELOPER}</span>
      </div>`;

    return `<div class="study-output">${header}${content}${exports}</div>`;
  }

  /* ─── NOTES HTML ─── */
  _buildNotesHTML(data) {
    let h = '';

    /* comprehensive notes */
    if (data.ultra_long_notes) {
      h += `<div class="study-section">
        <div class="section-hdr"><div class="section-hdr-title"><i class="fas fa-book-open"></i> Comprehensive Analysis</div></div>
        <div class="section-body"><div class="notes-md">${this._renderMd(data.ultra_long_notes)}</div></div>
      </div>`;
    }

    /* key concepts */
    if (data.key_concepts?.length) {
      const cards = data.key_concepts.map((c,i)=>`
        <div class="concept-card">
          <div class="concept-num">${i+1}</div>
          <div class="concept-text">${this._esc(c)}</div>
        </div>`).join('');
      h += `<div class="study-section">
        <div class="section-hdr"><div class="section-hdr-title"><i class="fas fa-lightbulb"></i> Key Concepts</div></div>
        <div class="section-body"><div class="concepts-grid">${cards}</div></div>
      </div>`;
    }

    /* key tricks */
    if (data.key_tricks?.length) {
      const icons = ['fas fa-magic','fas fa-star','fas fa-bolt','fas fa-key'];
      const items = data.key_tricks.map((t,i)=>`
        <div class="trick-item">
          <div class="trick-icon"><i class="${icons[i]||'fas fa-magic'}"></i></div>
          <div class="trick-text">${this._esc(t)}</div>
        </div>`).join('');
      h += `<div class="study-section">
        <div class="section-hdr"><div class="section-hdr-title"><i class="fas fa-magic"></i> Study Tricks &amp; Tips</div></div>
        <div class="section-body"><div class="tricks-list">${items}</div></div>
      </div>`;
    }

    /* practice questions */
    if (data.practice_questions?.length) {
      const qs = data.practice_questions.map((qa,i)=>`
        <div class="q-card">
          <div class="q-head" onclick="this.nextElementSibling.classList.toggle('visible');this.querySelector('.q-toggle-btn').classList.toggle('open')">
            <div class="q-num">${i+1}</div>
            <div class="q-text">${this._esc(qa.question)}</div>
            <button class="q-toggle-btn"><i class="fas fa-chevron-down"></i> Answer</button>
          </div>
          <div class="q-answer">
            <div class="q-answer-label"><i class="fas fa-check-circle"></i> Answer &amp; Explanation</div>
            <div class="q-answer-inner">${this._esc(qa.answer)}</div>
          </div>
        </div>`).join('');
      h += `<div class="study-section">
        <div class="section-hdr"><div class="section-hdr-title"><i class="fas fa-pen-alt"></i> Practice Questions</div></div>
        <div class="section-body"><div class="questions-list">${qs}</div></div>
      </div>`;
    }

    /* applications */
    if (data.real_world_applications?.length) {
      const items = data.real_world_applications.map(a=>`
        <div class="list-item app-item">
          <i class="fas fa-globe li-icon" style="color:var(--em2)"></i>
          <div class="li-text">${this._esc(a)}</div>
        </div>`).join('');
      h += `<div class="study-section">
        <div class="section-hdr"><div class="section-hdr-title"><i class="fas fa-globe"></i> Real World Applications</div></div>
        <div class="section-body"><div class="items-list">${items}</div></div>
      </div>`;
    }

    /* misconceptions */
    if (data.common_misconceptions?.length) {
      const items = data.common_misconceptions.map(m=>`
        <div class="list-item misc-item">
          <i class="fas fa-exclamation-triangle li-icon" style="color:var(--ruby2)"></i>
          <div class="li-text">${this._esc(m)}</div>
        </div>`).join('');
      h += `<div class="study-section">
        <div class="section-hdr"><div class="section-hdr-title"><i class="fas fa-exclamation-triangle"></i> Common Misconceptions</div></div>
        <div class="section-body"><div class="items-list">${items}</div></div>
      </div>`;
    }

    return h;
  }

  /* ─── FLASHCARDS HTML ─── */
  _buildFcHTML(data) {
    const cards = [];
    (data.key_concepts||[]).forEach(c=>{
      const p = c.split(':'); cards.push({q:p[0]?.trim()||c, a:p.slice(1).join(':').trim()||c});
    });
    (data.practice_questions||[]).forEach(qa=>{ cards.push({q:qa.question, a:qa.answer}); });
    this.fcCards   = cards;
    this.fcCurrent = 0;
    this.fcFlipped = false;
    const total    = cards.length;
    const first    = cards[0]||{q:'No cards',a:''};
    return `
      <div class="study-section">
        <div class="section-hdr"><div class="section-hdr-title"><i class="fas fa-layer-group"></i> Interactive Flashcards (${total} cards)</div></div>
        <div class="section-body">
          <div class="fc-mode">
            <div class="fc-progress">Card <span id="fcCurNum">1</span> of <span id="fcTotNum">${total}</span></div>
            <div class="fc-wrap" onclick="window._sav._fcFlip()">
              <div class="flashcard" id="theFlashcard">
                <div class="fc-face fc-front">
                  <div class="fc-label">Question / Concept</div>
                  <div class="fc-content" id="fcFront">${this._esc(first.q)}</div>
                  <div class="fc-hint">Click or press Space to reveal answer</div>
                </div>
                <div class="fc-face fc-back">
                  <div class="fc-label">Answer / Explanation</div>
                  <div class="fc-content" id="fcBack">${this._esc(first.a)}</div>
                </div>
              </div>
            </div>
            <div class="fc-controls">
              <button class="fc-btn" id="fcPrevBtn" onclick="window._sav._fcNav(-1)" ${total<=1?'disabled':''}><i class="fas fa-arrow-left"></i> Previous</button>
              <button class="fc-btn primary" onclick="window._sav._fcFlip()"><i class="fas fa-sync-alt"></i> Flip</button>
              <button class="fc-btn" id="fcNextBtn" onclick="window._sav._fcNav(1)" ${total<=1?'disabled':''}><i class="fas fa-arrow-right"></i> Next</button>
            </div>
            <div class="fc-kb-hint"><kbd>Space</kbd> to flip &nbsp;·&nbsp; <kbd>←</kbd><kbd>→</kbd> to navigate</div>
          </div>
        </div>
      </div>`;
  }

  _fcInit(data) { /* already initialized in _buildFcHTML */ }

  _fcFlip() {
    const fc = this._el('theFlashcard');
    if (!fc) return;
    this.fcFlipped = !this.fcFlipped;
    fc.classList.toggle('flipped', this.fcFlipped);
  }

  _fcNav(dir) {
    if (!this.fcCards.length) return;
    this.fcCurrent = Math.max(0, Math.min(this.fcCards.length-1, this.fcCurrent+dir));
    this.fcFlipped = false;
    const fc = this._el('theFlashcard');
    if (fc) fc.classList.remove('flipped');
    const card = this.fcCards[this.fcCurrent];
    const fe   = this._el('fcFront');
    const be   = this._el('fcBack');
    const cn   = this._el('fcCurNum');
    if (fe) fe.textContent = card.q;
    if (be) be.textContent = card.a;
    if (cn) cn.textContent = this.fcCurrent+1;
    const pb = this._el('fcPrevBtn'); const nb = this._el('fcNextBtn');
    if (pb) pb.disabled = this.fcCurrent===0;
    if (nb) nb.disabled = this.fcCurrent===this.fcCards.length-1;
  }

  /* ─── QUIZ HTML ─── */
  _buildQuizHTML(data) {
    const qs = (data.practice_questions||[]).slice(0,5);
    this.quizData  = qs;
    this.quizIdx   = 0;
    this.quizScore = 0;
    this.quizDone  = false;
    if (!qs.length) return '<div class="study-section"><div class="section-body"><p style="color:var(--t3)">No quiz questions available for this topic.</p></div></div>';
    return `
      <div class="study-section">
        <div class="section-hdr"><div class="section-hdr-title"><i class="fas fa-question-circle"></i> Practice Quiz — ${qs.length} Questions</div></div>
        <div class="section-body">
          <div class="quiz-mode">
            <div class="quiz-pb-wrap"><div class="quiz-pb-fill" id="quizPB" style="width:0%"></div></div>
            <div id="quizArea">${this._buildQCard(qs, 0)}</div>
          </div>
        </div>
      </div>`;
  }

  _buildQCard(qs, idx) {
    const qa      = qs[idx];
    const correct = this._esc((qa.answer||'').substring(0,90)+'...');
    const wrongs  = [
      'This concept relies on indirect mechanisms and external environmental factors.',
      'The opposite interpretation applies — the effect precedes the cause in this model.',
      'This primarily applies to historical contexts and is no longer considered valid.',
    ];
    const opts = this._shuffle([{text:correct,ok:true},...wrongs.map(w=>({text:w,ok:false}))]);
    const optsHTML = opts.map((o,i)=>`
      <button class="quiz-opt" data-ok="${o.ok}" onclick="window._sav._pickOpt(this,${idx})"
        data-idx="${i}">
        <span class="q-opt-letter">${String.fromCharCode(65+i)}</span>
        ${o.text}
      </button>`).join('');
    return `
      <div class="quiz-q-card" id="qCard${idx}">
        <div class="quiz-q-num">Question ${idx+1} of ${qs.length}</div>
        <div class="quiz-q-text">${this._esc(qa.question)}</div>
        <div class="quiz-options">${optsHTML}</div>
      </div>`;
  }

  _quizInit(data) { /* state set in _buildQuizHTML */ }

  _pickOpt(btn, idx) {
    const card = btn.closest('.quiz-q-card');
    if (!card) return;
    /* disable all options */
    card.querySelectorAll('.quiz-opt').forEach(b=>{
      b.disabled = true;
      if (b.dataset.ok==='true') b.classList.add('correct');
    });
    const ok = btn.dataset.ok==='true';
    if (!ok) btn.classList.add('wrong');
    if (ok)  this.quizScore++;

    /* update progress bar */
    const answered = idx+1;
    const total    = this.quizData.length;
    const pb = this._el('quizPB');
    if (pb) pb.style.width=`${(answered/total)*100}%`;

    /* next or result */
    setTimeout(()=>{
      const area = this._el('quizArea');
      if (!area) return;
      if (answered >= total) {
        const pct = Math.round((this.quizScore/total)*100);
        const msg = pct>=80?'🎉 Excellent!':pct>=60?'👍 Good effort!':'📚 Keep studying!';
        area.innerHTML=`
          <div class="quiz-result">
            <div class="qr-title">Quiz Complete!</div>
            <div class="qr-score">${this.quizScore}/${total}</div>
            <div class="qr-msg">${pct}% correct &nbsp;·&nbsp; ${msg}</div>
            <div class="qr-btns">
              <button class="btn btn-ghost" onclick="window._sav._retryQuiz()"><i class="fas fa-redo"></i> Try Again</button>
              <button class="btn btn-primary" onclick="window._sav._setTool('notes');document.getElementById('mainInput').focus()">
                <i class="fas fa-book-open"></i> Study Notes
              </button>
            </div>
          </div>`;
      } else {
        area.innerHTML = this._buildQCard(this.quizData, idx+1);
        this.quizIdx = idx+1;
      }
    }, 950);
  }

  _retryQuiz() {
    const area = this._el('quizArea');
    const pb   = this._el('quizPB');
    this.quizScore=0; this.quizIdx=0;
    if (pb) pb.style.width='0%';
    if (area) area.innerHTML=this._buildQCard(this.quizData,0);
  }

  /* ─── SUMMARY HTML ─── */
  _buildSummaryHTML(data) {
    const notes = data.ultra_long_notes||'';
    const tldr  = this._esc(this._stripMd(notes).substring(0,400)+'…');
    const points = (data.key_concepts||[]).map((c,i)=>`
      <div class="sum-point"><span class="sum-pt-num">${i+1}</span><span>${this._esc(c)}</span></div>`).join('');
    const full = notes?`
      <div class="study-section">
        <div class="section-hdr"><div class="section-hdr-title"><i class="fas fa-book-open"></i> Full Notes</div></div>
        <div class="section-body"><div class="notes-md">${this._renderMd(notes)}</div></div>
      </div>`:'';
    return `
      <div class="study-section">
        <div class="section-hdr"><div class="section-hdr-title"><i class="fas fa-align-left"></i> Smart Summary</div></div>
        <div class="section-body">
          <div class="summary-mode">
            <div class="summary-tldr-card">
              <div class="sum-tldr-label">TL;DR</div>
              <div class="sum-tldr-text">${tldr}</div>
            </div>
            <div class="sum-points">${points}</div>
          </div>
        </div>
      </div>${full}`;
  }

  /* ─── MINDMAP HTML ─── */
  _buildMindmapHTML(data) {
    const topic    = data.topic||'Topic';
    const concepts = data.key_concepts||[];
    const tricks   = data.key_tricks||[];
    const apps     = data.real_world_applications||[];
    const misc     = data.common_misconceptions||[];

    const branch = (title, icon, items) => {
      if (!items.length) return '';
      const its = items.map(i=>`<div class="mm-item">${this._esc((i.split(':')[0]||i).trim())}</div>`).join('');
      return `<div class="mm-branch"><div class="mm-branch-title"><i class="${icon}"></i> ${this._esc(title)}</div><div class="mm-items">${its}</div></div>`;
    };

    const branches = [
      branch('Key Concepts',        'fas fa-lightbulb',            concepts),
      branch('Study Tips',          'fas fa-magic',                tricks),
      branch('Applications',        'fas fa-globe',                apps),
      branch('Misconceptions',      'fas fa-exclamation-triangle', misc),
    ].join('');

    return `
      <div class="study-section">
        <div class="section-hdr"><div class="section-hdr-title"><i class="fas fa-project-diagram"></i> Mind Map</div></div>
        <div class="section-body">
          <div class="mm-mode">
            <div class="mm-root"><div class="mm-root-node">${this._esc(topic)}</div></div>
            <div class="mm-branches">${branches}</div>
          </div>
        </div>
      </div>
      ${this._buildNotesHTML(data)}`;
  }

  /* ═══════════════════════════════════════════
     PDF EXPORT
  ═══════════════════════════════════════════ */
  downloadPDF(btn) {
    const data = this.currentData;
    if (!data) { this._toast('warning','fa-exclamation','No content to export yet.'); return; }
    if (!window.jspdf) { this._toast('error','fa-times','PDF library not loaded. Please refresh.'); return; }

    const { jsPDF } = window.jspdf;
    const doc  = new jsPDF({orientation:'portrait',unit:'mm',format:'a4'});
    const pw   = 210, ph = 297, m = 15, cw = pw-(m*2);
    let y = 0;

    const addHdr = () => {
      doc.setFillColor(201,169,110);
      doc.rect(0,0,pw,13,'F');
      doc.setFontSize(9); doc.setFont('helvetica','bold'); doc.setTextColor(255,255,255);
      doc.text('Savoiré AI v2.0',m,9);
      doc.setFontSize(7); doc.setFont('helvetica','normal');
      doc.text('savoireai.vercel.app  ·  Sooban Talha Technologies',pw-m,9,{align:'right'});
      y=22;
    };

    const addFtr = (pg,tot) => {
      doc.setDrawColor(201,169,110); doc.setLineWidth(.35);
      doc.line(m,ph-13,pw-m,ph-13);
      doc.setFontSize(6.5); doc.setTextColor(140);
      doc.text(`Page ${pg} of ${tot}  ·  Generated by Savoiré AI v2.0  ·  Sooban Talha Technologies  ·  savoireai.vercel.app  ·  ${new Date().toLocaleString()}`,pw/2,ph-7.5,{align:'center'});
    };

    const check = (n=14) => {
      if (y+n > ph-18) {
        addFtr(doc.internal.getCurrentPageInfo().pageNumber,'?');
        doc.addPage(); addHdr();
      }
    };

    const write = (text, sz, bold, color, indent=0) => {
      doc.setFontSize(sz);
      doc.setFont('helvetica', bold?'bold':'normal');
      doc.setTextColor(...color);
      const lines = doc.splitTextToSize(text, cw-indent);
      lines.forEach(l=>{ check(sz*.38+1); doc.text(l,m+indent,y); y+=sz*.38+1; });
    };

    const heading = (txt,sz) => {
      check(sz*.4+6); y+=4;
      doc.setFillColor(201,169,110,50);
      write(txt,sz,true,[100,65,10]);
      y+=3;
    };

    addHdr();

    /* Title */
    doc.setFontSize(22); doc.setFont('helvetica','bold'); doc.setTextColor(20,12,0);
    const titleLines = doc.splitTextToSize(data.topic||'Study Notes', cw);
    titleLines.forEach(l=>{ doc.text(l,m,y); y+=9; });
    y+=2;

    doc.setFontSize(8.5); doc.setFont('helvetica','normal'); doc.setTextColor(100,88,70);
    doc.text(`${data.curriculum_alignment||''}  ·  Score: ${data.study_score||96}/100  ·  ${new Date().toLocaleDateString()}  ·  Savoiré AI v2.0`,m,y); y+=4;
    doc.setDrawColor(201,169,110); doc.setLineWidth(.6);
    doc.line(m,y,pw-m,y); y+=8;

    /* Notes */
    if (data.ultra_long_notes) {
      heading('COMPREHENSIVE ANALYSIS',12);
      write(this._stripMd(data.ultra_long_notes),9.5,false,[35,28,20]); y+=6;
    }

    /* Key concepts */
    if (data.key_concepts?.length) {
      heading('KEY CONCEPTS',12);
      data.key_concepts.forEach((c,i)=>{ check(10); write(`${i+1}. ${c}`,9.5,false,[35,28,20],5); y+=1; });
      y+=5;
    }

    /* Tricks */
    if (data.key_tricks?.length) {
      heading('STUDY TRICKS & TIPS',12);
      data.key_tricks.forEach(t=>{ check(10); write(`✦  ${t}`,9.5,false,[35,28,20],5); y+=1.5; });
      y+=5;
    }

    /* Questions */
    if (data.practice_questions?.length) {
      heading('PRACTICE QUESTIONS',12);
      data.practice_questions.forEach((qa,i)=>{
        check(16); write(`Q${i+1}: ${qa.question}`,9.5,true,[35,28,20],5); y+=1;
        write(`A:  ${qa.answer}`,9,false,[55,45,35],12); y+=4;
      });
      y+=3;
    }

    /* Applications */
    if (data.real_world_applications?.length) {
      heading('REAL WORLD APPLICATIONS',12);
      data.real_world_applications.forEach(a=>{ check(10); write(`•  ${a}`,9.5,false,[35,28,20],5); y+=1.5; });
      y+=5;
    }

    /* Misconceptions */
    if (data.common_misconceptions?.length) {
      heading('COMMON MISCONCEPTIONS',12);
      data.common_misconceptions.forEach(mc=>{ check(10); write(`⚠  ${mc}`,9.5,false,[35,28,20],5); y+=1.5; });
    }

    /* Add footers */
    const tot = doc.internal.getNumberOfPages();
    for (let i=1;i<=tot;i++) { doc.setPage(i); addFtr(i,tot); }

    const fname = `SavoireAI_${(data.topic||'Notes').replace(/[^a-zA-Z0-9]/g,'_').slice(0,40)}_${Date.now()}.pdf`;
    doc.save(fname);
    this._toast('success','fa-file-pdf','PDF downloaded successfully!');
    if (btn) { const o=btn.innerHTML; btn.innerHTML='<i class="fas fa-check"></i> Downloaded!'; setTimeout(()=>{btn.innerHTML=o;},2500); }
  }

  /* ─── copy ─── */
  copyResult(btn) {
    const data = this.currentData;
    if (!data) { this._toast('info','fa-info-circle','No content to copy yet.'); return; }
    this._copyText(this._dataToText(data), btn);
  }

  _copyText(text, btn) {
    navigator.clipboard.writeText(text)
      .then(()=>{
        this._toast('success','fa-copy','Copied to clipboard!');
        if (btn) { const o=btn.innerHTML; btn.innerHTML='<i class="fas fa-check"></i> Copied!'; setTimeout(()=>{btn.innerHTML=o;},2000); }
      })
      .catch(()=>{
        const ta=document.createElement('textarea');
        ta.value=text; ta.style.cssText='position:fixed;opacity:0';
        document.body.appendChild(ta); ta.select(); document.execCommand('copy');
        document.body.removeChild(ta);
        this._toast('success','fa-copy','Copied!');
      });
  }

  /* ─── save note ─── */
  saveNote(btn) {
    const data = this.currentData;
    if (!data) { this._toast('info','fa-info-circle','No content to save yet.'); return; }
    this.saved.unshift({id:this._genId(),topic:data.topic||'Note',tool:this.tool,data,savedAt:Date.now()});
    if (this.saved.length>100) this.saved=this.saved.slice(0,100);
    this._save('sv_saved',this.saved);
    this._toast('success','fa-star','Note saved to your library!');
    if (btn) { const o=btn.innerHTML; btn.innerHTML='<i class="fas fa-check"></i> Saved!'; setTimeout(()=>{btn.innerHTML=o;},2000); }
  }

  /* ─── share ─── */
  shareResult(btn) {
    const data = this.currentData;
    if (!data) return;
    const text = `📚 ${data.topic} — Study Notes\n\n${this._stripMd(data.ultra_long_notes||'').substring(0,300)}…\n\nGenerated free by Savoiré AI v2.0 — savoireai.vercel.app\nBuilt by Sooban Talha Technologies`;
    if (navigator.share) {
      navigator.share({title:`${data.topic} — Savoiré AI v2.0`, text}).catch(()=>{});
    } else {
      this._copyText(text);
    }
  }

  /* ─── export all ─── */
  _exportAllPdf() {
    if (this.currentData) { this.downloadPDF(null); }
    else { this._toast('info','fa-info-circle','Generate some content first.'); }
  }

  _copyAll() {
    const outs = document.querySelectorAll('.study-output');
    if (!outs.length) { this._toast('info','fa-info-circle','No content to copy yet.'); return; }
    const text = Array.from(outs).map(el=>el.innerText).join('\n\n─────────────────────────────────\n\n');
    this._copyText(text);
  }

  _dataToText(data) {
    let t = `${data.topic||'Study Notes'}\n${'═'.repeat(60)}\n`;
    t += `Powered by Savoiré AI v2.0 · Sooban Talha Technologies · savoireai.vercel.app\n\n`;
    if (data.ultra_long_notes)  t += `COMPREHENSIVE NOTES\n\n${this._stripMd(data.ultra_long_notes)}\n\n`;
    if (data.key_concepts?.length) { t+=`KEY CONCEPTS\n`; data.key_concepts.forEach((c,i)=>{t+=`${i+1}. ${c}\n`;}); t+='\n'; }
    if (data.key_tricks?.length)   { t+=`STUDY TRICKS\n`; data.key_tricks.forEach(tr=>{t+=`✦ ${tr}\n`;}); t+='\n'; }
    if (data.practice_questions?.length) {
      t+=`PRACTICE QUESTIONS\n`;
      data.practice_questions.forEach((qa,i)=>{t+=`Q${i+1}: ${qa.question}\nA: ${qa.answer}\n\n`;});
    }
    if (data.real_world_applications?.length) { t+=`APPLICATIONS\n`; data.real_world_applications.forEach(a=>{t+=`• ${a}\n`;}); t+='\n'; }
    if (data.common_misconceptions?.length)    { t+=`MISCONCEPTIONS\n`; data.common_misconceptions.forEach(m=>{t+=`⚠ ${m}\n`;}); }
    t += `\n${'─'.repeat(60)}\nSavoiré AI v2.0 · savoireai.vercel.app\nSooban Talha Technologies · ${new Date().toLocaleString()}\n`;
    return t;
  }

  /* ═══════════════════════════════════════════
     FILE UPLOAD
  ═══════════════════════════════════════════ */
  _handleFile(file) {
    if (!file) return;
    if (file.size > 5*1024*1024) { this._toast('error','fa-times','File too large (max 5MB).'); return; }
    const allowed = ['text/plain','text/markdown','text/csv','application/csv'];
    if (!allowed.includes(file.type) && !file.name.match(/\.(txt|md|csv)$/i)) {
      this._toast('error','fa-times','Only .txt, .md, .csv files are supported for direct text extraction.'); return;
    }
    const reader = new FileReader();
    reader.onload = e => {
      const text = (e.target.result||'').substring(0, 8000);
      const inp  = this._el('mainInput');
      if (inp) { inp.value=text; this._autoResize(); this._updateCharCount(); }
      this._toast('success','fa-paperclip',`File loaded: ${file.name} (${text.length.toLocaleString()} chars)`);
    };
    reader.onerror = ()=>{ this._toast('error','fa-times','Could not read the file.'); };
    reader.readAsText(file);
    /* reset input so same file can be re-uploaded */
    this._el('fileInput').value='';
  }

  /* ═══════════════════════════════════════════
     THINKING INDICATOR
  ═══════════════════════════════════════════ */
  _showThinking() {
    const el = this._el('wsThinking');
    if (el) el.style.display='block';
    this.stageIdx = 0;
    this._resetStages();
    this._activateStage(0);
    this.thinkTimer = setInterval(()=>{
      this.stageIdx++;
      if (this.stageIdx < 5) {
        this._doneStage(this.stageIdx-1);
        this._activateStage(this.stageIdx);
      }
    }, 3000);
    this._scrollBottom();
  }

  _hideThinking() {
    const el = this._el('wsThinking');
    if (el) el.style.display='none';
    if (this.thinkTimer) { clearInterval(this.thinkTimer); this.thinkTimer=null; }
  }

  _resetStages()   { for(let i=0;i<5;i++){const e=this._el(`ts${i}`); if(e) e.className='ts';} }
  _activateStage(i){ const e=this._el(`ts${i}`); if(e) e.classList.add('active'); }
  _doneStage(i)    { const e=this._el(`ts${i}`); if(e){e.classList.remove('active');e.classList.add('done');} }

  /* ═══════════════════════════════════════════
     HISTORY
  ═══════════════════════════════════════════ */
  _addToHistory(entry) {
    this.history.unshift(entry);
    if (this.history.length>50) this.history=this.history.slice(0,50);
    this._save('sv_history',this.history);
    this._updateHistBadge();
    this._renderSbHistory();
  }

  _updateHistBadge() {
    const b = this._el('histBadge');
    if (!b) return;
    if (this.history.length>0) {
      b.textContent = Math.min(this.history.length,99);
      b.style.display='flex';
    } else { b.style.display='none'; }
  }

  _renderSbHistory() {
    const list = this._el('sbHistoryList');
    if (!list) return;
    if (!this.history.length) {
      list.innerHTML='<div class="sb-empty"><i class="fas fa-clock"></i><span>No history yet</span></div>';
      return;
    }
    const ICONS = {notes:'fa-book-open',flashcards:'fa-layer-group',quiz:'fa-question-circle',summary:'fa-align-left',mindmap:'fa-project-diagram'};
    list.innerHTML = this.history.slice(0,5).map(h=>`
      <div class="sb-hist-item" onclick="window._sav._loadHistEntry('${h.id}')">
        <div class="sb-hist-icon"><i class="fas ${ICONS[h.tool]||'fa-book-open'}"></i></div>
        <div class="sb-hist-topic">${this._esc((h.topic||'Session').substring(0,35))}</div>
        <div class="sb-hist-time">${this._relTime(h.ts)}</div>
      </div>`).join('');
  }

  _openHistModal() {
    this._openModal('historyModal');
    this._renderHistModal();
  }

  _renderHistModal(filter='all', query='') {
    const list  = this._el('histModalList');
    const empty = this._el('histModalEmpty');
    const count = this._el('histModalCount');
    if (!list) return;

    let items = this.history;
    if (filter!=='all')  items=items.filter(h=>h.tool===filter);
    if (query)           items=items.filter(h=>(h.topic||'').toLowerCase().includes(query.toLowerCase()));

    if (count) count.textContent=`${items.length} ${items.length===1?'entry':'entries'}`;

    if (!items.length) {
      list.innerHTML='';
      if (empty) empty.style.display='flex';
      return;
    }
    if (empty) empty.style.display='none';

    const ICONS = {notes:'fa-book-open',flashcards:'fa-layer-group',quiz:'fa-question-circle',summary:'fa-align-left',mindmap:'fa-project-diagram'};
    list.innerHTML = items.map((h,i)=>`
      <div class="hist-item" onclick="window._sav._loadHistEntry('${h.id}')">
        <div class="hist-tool-av"><i class="fas ${ICONS[h.tool]||'fa-book-open'}"></i></div>
        <div class="hist-info">
          <div class="hist-topic">${this._esc(h.topic||'Study Session')}</div>
          <div class="hist-meta">
            <span class="hist-tag">${h.tool||'notes'}</span>
            <span class="hist-time">${this._relTime(h.ts)}</span>
          </div>
        </div>
        <div class="hist-acts">
          <button class="hist-act-btn del" onclick="event.stopPropagation();window._sav._deleteHistEntry('${h.id}')" title="Delete"><i class="fas fa-trash"></i></button>
        </div>
      </div>`).join('');
  }

  _filterHist(q) {
    const f = this._qs('.hist-filter.active')?.dataset.filter||'all';
    this._renderHistModal(f,q);
  }

  _loadHistEntry(id) {
    const h = this.history.find(x=>x.id===id);
    if (!h?.data) return;
    this._closeModal('historyModal');
    this.currentData = h.data;
    this.tool = h.tool||'notes';
    this._setTool(this.tool);
    this._el('wsWelcome').style.display  = 'none';
    this._el('wsMessages').style.display = 'block';
    this._addUserMsg(`📂 Loaded: ${h.topic}`);
    this._renderResult(h.data);
    this._toast('info','fa-history',`Loaded: ${h.topic}`);
  }

  _deleteHistEntry(id) {
    this.history = this.history.filter(x=>x.id!==id);
    this._save('sv_history',this.history);
    this._updateHistBadge();
    this._renderSbHistory();
    const f = this._qs('.hist-filter.active')?.dataset.filter||'all';
    const q = this._el('histSearchInput')?.value||'';
    this._renderHistModal(f,q);
  }

  /* ═══════════════════════════════════════════
     SAVED NOTES
  ═══════════════════════════════════════════ */
  _openSavedModal() {
    this._openModal('savedModal');
    this._renderSavedModal();
  }

  _renderSavedModal() {
    const list  = this._el('savedModalList');
    const empty = this._el('savedModalEmpty');
    const count = this._el('savedModalCount');
    if (!list) return;
    if (count) count.textContent=`${this.saved.length} ${this.saved.length===1?'note':'notes'}`;
    if (!this.saved.length) {
      list.innerHTML=''; if(empty) empty.style.display='flex'; return;
    }
    if (empty) empty.style.display='none';
    const ICONS = {notes:'fa-book-open',flashcards:'fa-layer-group',quiz:'fa-question-circle',summary:'fa-align-left',mindmap:'fa-project-diagram'};
    list.innerHTML = this.saved.map(s=>`
      <div class="hist-item" onclick="window._sav._loadSavedEntry('${s.id}')">
        <div class="hist-tool-av"><i class="fas ${ICONS[s.tool]||'fa-book-open'}"></i></div>
        <div class="hist-info">
          <div class="hist-topic">${this._esc(s.topic)}</div>
          <div class="hist-meta">
            <span class="hist-tag">${s.tool}</span>
            <span class="hist-time">${this._relTime(s.savedAt)}</span>
          </div>
        </div>
        <div class="hist-acts">
          <button class="hist-act-btn del" onclick="event.stopPropagation();window._sav._deleteSaved('${s.id}')" title="Delete"><i class="fas fa-trash"></i></button>
        </div>
      </div>`).join('');
  }

  _loadSavedEntry(id) {
    const s = this.saved.find(x=>x.id===id);
    if (!s?.data) return;
    this._closeModal('savedModal');
    this.currentData = s.data;
    this.tool = s.tool||'notes';
    this._setTool(this.tool);
    this._el('wsWelcome').style.display  = 'none';
    this._el('wsMessages').style.display = 'block';
    this._addUserMsg(`⭐ Loaded saved: ${s.topic}`);
    this._renderResult(s.data);
  }

  _deleteSaved(id) {
    this.saved = this.saved.filter(x=>x.id!==id);
    this._save('sv_saved',this.saved);
    this._renderSavedModal();
  }

  /* ═══════════════════════════════════════════
     SETTINGS
  ═══════════════════════════════════════════ */
  _openSettingsModal() {
    /* populate */
    const ni = this._el('nameInput'); if(ni) ni.value=this.userName;
    /* sync theme btns */
    const th = document.documentElement.dataset.theme||'dark';
    this._qsa('[data-theme-btn]').forEach(b=>b.classList.toggle('active',b.dataset.themeBtn===th));
    /* sync font btns */
    const fn = document.documentElement.dataset.font||'medium';
    this._qsa('.font-size-btn').forEach(b=>b.classList.toggle('active',b.dataset.size===fn));
    /* data stats */
    const ds = this._el('settingsDataStats');
    if (ds) {
      const hs = JSON.stringify(this.history).length;
      const ss = JSON.stringify(this.saved).length;
      ds.innerHTML=`
        <div class="sds-item"><div class="sds-val">${this.history.length}</div><div class="sds-lbl">History</div></div>
        <div class="sds-item"><div class="sds-val">${this.saved.length}</div><div class="sds-lbl">Saved</div></div>
        <div class="sds-item"><div class="sds-val">${Math.round((hs+ss)/1024)}KB</div><div class="sds-lbl">Storage</div></div>`;
    }
    this._openModal('settingsModal');
  }

  _saveName() {
    const inp  = this._el('nameInput');
    const name = inp?.value?.trim();
    if (!name||name.length<2) { this._toast('error','fa-times','Name must be at least 2 characters.'); return; }
    this.userName = name;
    localStorage.setItem('sv_user',name);
    this._updateUserUI();
    this._toast('success','fa-check','Name updated!');
  }

  _exportDataJson() {
    const obj = {
      exported: new Date().toISOString(),
      app: 'Savoiré AI v2.0',
      developer: 'Sooban Talha Technologies',
      website: 'savoireai.vercel.app',
      userName: this.userName,
      history:  this.history,
      saved:    this.saved,
      preferences: this.prefs,
    };
    const blob = new Blob([JSON.stringify(obj,null,2)],{type:'application/json'});
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement('a');
    a.href=url; a.download=`savoiré-ai-data-${Date.now()}.json`;
    document.body.appendChild(a); a.click(); document.body.removeChild(a); URL.revokeObjectURL(url);
    this._toast('success','fa-download','Data exported!');
  }

  _clearAllData() {
    Object.keys(localStorage).filter(k=>k.startsWith('sv_')).forEach(k=>localStorage.removeItem(k));
    this._toast('info','fa-trash','All data cleared. Reloading…');
    setTimeout(()=>window.location.reload(), 1200);
  }

  /* ═══════════════════════════════════════════
     THEME
  ═══════════════════════════════════════════ */
  _toggleTheme() {
    const cur = document.documentElement.dataset.theme||'dark';
    this._setTheme(cur==='dark'?'light':'dark');
  }

  _setTheme(theme) {
    document.documentElement.dataset.theme=theme;
    const ic = this._el('themeIconEl');
    if (ic) ic.className=theme==='dark'?'fas fa-moon':'fas fa-sun';
    this._qsa('[data-theme-btn]').forEach(b=>b.classList.toggle('active',b.dataset.themeBtn===theme));
    this.prefs.theme=theme; this._save('sv_prefs',this.prefs);
  }

  _setFontSize(size) {
    document.documentElement.dataset.font=size;
    this._qsa('.font-size-btn').forEach(b=>b.classList.toggle('active',b.dataset.size===size));
    this.prefs.fontSize=size; this._save('sv_prefs',this.prefs);
  }

  _applyPrefs() {
    if (this.prefs.theme)    this._setTheme(this.prefs.theme);
    if (this.prefs.fontSize) this._setFontSize(this.prefs.fontSize);
    if (this.prefs.lastTool) this._setTool(this.prefs.lastTool);
    this._renderSbHistory();
  }

  /* ═══════════════════════════════════════════
     SIDEBAR
  ═══════════════════════════════════════════ */
  _toggleSidebar() {
    const sb = this._el('sidebar');
    const ws = this._el('workspace');
    if (window.innerWidth<=768) {
      sb?.classList.toggle('mobile-open');
    } else {
      this.sidebarOpen = !this.sidebarOpen;
      sb?.classList.toggle('collapsed',!this.sidebarOpen);
      ws?.classList.toggle('sb-collapsed',!this.sidebarOpen);
    }
  }

  _closeSidebarMobile() { this._el('sidebar')?.classList.remove('mobile-open'); }

  _handleResize() {
    if (window.innerWidth>768) {
      this._el('sidebar')?.classList.remove('mobile-open');
    }
  }

  /* ═══════════════════════════════════════════
     MODALS
  ═══════════════════════════════════════════ */
  _openModal(id) {
    const el = this._el(id);
    if (!el) return;
    el.style.display='flex';
    document.body.style.overflow='hidden';
  }

  _closeModal(id) {
    const el = this._el(id);
    if (!el) return;
    el.style.display='none';
    if (!document.querySelector('.modal-overlay[style*="flex"]'))
      document.body.style.overflow='';
  }

  _closeAllModals() {
    this._qsa('.modal-overlay').forEach(m=>{ m.style.display='none'; });
    document.body.style.overflow='';
  }

  _confirm(msg, cb) {
    const me = this._el('confirmMsg');
    if (me) me.textContent=msg;
    this.confirmCb = cb;
    this._openModal('confirmModal');
  }

  _toggleDropdown() {
    this._el('avatarDropdown')?.classList.toggle('open');
  }

  _closeDropdown() {
    this._el('avatarDropdown')?.classList.remove('open');
  }

  /* ═══════════════════════════════════════════
     TOAST
  ═══════════════════════════════════════════ */
  _toast(type, icon, msg, dur=4000) {
    const container = this._el('toastContainer');
    if (!container) return;
    while (container.children.length>=3) container.removeChild(container.firstChild);
    const t = document.createElement('div');
    t.className=`toast ${type}`;
    t.innerHTML=`<i class="fas ${icon}"></i><span>${this._esc(msg)}</span>`;
    t.addEventListener('click',()=>t.remove());
    container.appendChild(t);
    setTimeout(()=>{
      if (t.parentNode) {
        t.classList.add('removing');
        setTimeout(()=>t.remove(), 300);
      }
    }, dur);
  }

  /* ═══════════════════════════════════════════
     MISC UI
  ═══════════════════════════════════════════ */
  _setSendLoading(on) {
    const btn  = this._el('sendBtn');
    const icon = this._el('sendBtnIcon');
    const lbl  = this._el('sendBtnLabel');
    if (!btn) return;
    btn.disabled = on;
    if (icon) icon.className = on?'fas fa-spinner fa-spin':'fas fa-paper-plane';
    if (lbl)  lbl.textContent = on?'Generating…':({notes:'Generate',flashcards:'Create Cards',quiz:'Build Quiz',summary:'Summarize',mindmap:'Make Map'}[this.tool]||'Generate');
  }

  _autoResize() {
    const el = this._el('mainInput');
    if (!el) return;
    el.style.height='auto';
    el.style.height=Math.min(el.scrollHeight,140)+'px';
  }

  _updateCharCount() {
    const el  = this._el('mainInput');
    const cnt = this._el('charCount');
    if (!el||!cnt) return;
    const n = el.value.length;
    cnt.textContent=`${n.toLocaleString()} / 12,000`;
    cnt.className='ia-char-count'+(n>10000?' danger':n>7500?' warn':'');
  }

  _scrollBottom() {
    const ms = this._el('wsMessages');
    if (ms) { setTimeout(()=>{ms.scrollTop=ms.scrollHeight;},80); }
  }

  _clearChat() {
    const ml = this._el('messagesList');
    const wm = this._el('wsMessages');
    const ww = this._el('wsWelcome');
    if (ml) ml.innerHTML='';
    if (wm) wm.style.display='none';
    if (ww) ww.style.display='flex';
    this.currentData=null;
    this.fcCards=[];
    this._toast('info','fa-trash-alt','Chat cleared.');
  }

  _goHome() {
    this._clearChat();
  }
}

/* ═══════════════════════════════════════════
   GLOBAL INIT
═══════════════════════════════════════════ */
window.addEventListener('DOMContentLoaded', () => {
  window._sav = new SavoireApp();
});
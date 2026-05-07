'use strict';
/* ═══════════════════════════════════════════════════════════════════════════════════════════
   SAVOIRÉ AI v3.0 — app.js — COMPLETE REBUILD
   Built by Sooban Talha Technologies | soobantalhatech.xyz
   Founder: Sooban Talha

   VERSION 3.0 — WHAT'S NEW:
   ✦ 3-Phase Live Streaming Render (TextNode → throttled markdown → final)
   ✦ Mind Map SVG Builder — interactive zoomable visual mind maps
   ✦ World-Class Dashboard — stats, streak, timeline, tool usage bars
   ✦ 7 Keyboard Shortcuts — Ctrl+K/H/S/P/B/D/F, Space, Arrows
   ✦ Flashcard Learned Set Tracking
   ✦ Enhanced Quiz — full MCQ with distractors from other answers
   ✦ Quiz 5-Part Answer Display
   ✦ Premium Copy/PDF/Share with full sections
   ✦ History Search + Date Groups + Tool Filter
   ✦ Saved Notes Library with load/delete
   ✦ Settings — theme, font size, name, data stats, export, clear
   ✦ Welcome Overlay — first-time name input
   ✦ Welcome Back Overlay — returning user stats
   ✦ Toast Notification System — 4 types, auto-dismiss
   ✦ Focus Mode — hides sidebar
   ✦ All ARIA accessibility — roles, labels, live regions
   ✦ Mobile responsive — all features work on phones
   ✦ Branding enforced everywhere — "Savoiré AI v3.0"

   ARCHITECTURE:
   ┌─────────────────────────────────────────────────────┐
   │  SavoireApp Class — single controller for all UI    │
   │  ├── State Management (tool, generating, data)      │
   │  ├── SSE Streaming Client (3-phase render)          │
   │  ├── 5 Tool HTML Builders (Notes, Cards, Quiz...)   │
   │  ├── PDF Generator (jsPDF multi-page)               │
   │  ├── Mind Map SVG Builder                           │
   │  ├── Dashboard Builder                              │
   │  ├── History & Saved Management                     │
   │  ├── Settings & Preferences                         │
   │  ├── Welcome System                                 │
   │  ├── Toast Notifications                            │
   │  └── Keyboard Shortcuts                             │
   └─────────────────────────────────────────────────────┘
═══════════════════════════════════════════════════════════════════════════════════════════ */

/* ─────────────────────────────────────────────────────────────────────────────────────────
   CONSTANTS & CONFIGURATION
   ───────────────────────────────────────────────────────────────────────────────────────── */
const SAVOIRÉ = {
  VERSION:    '3.0',
  BRAND:      'Savoiré AI v3.0',
  DEVELOPER:  'Sooban Talha Technologies',
  DEVSITE:    'soobantalhatech.xyz',
  WEBSITE:    'savoireai.vercel.app',
  FOUNDER:    'Sooban Talha',
  API_URL:    '/api/study',
  MAX_HISTORY: 60,
  MAX_SAVED:   120,
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
    label:       'Smart Summary',
    placeholder: 'Enter a topic or paste text to create a concise smart summary…',
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

const STAGE_LABELS = [
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
    /* ── Core State ── */
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
    this.showDashboard = false;

    /* ── 3-Phase Streaming State ── */
    this._rafPending       = false;
    this._rafId            = null;
    this._lastMdRender     = 0;
    this._lastMdRenderChars= 0;
    this._mdRenderInterval = 350;  // ms between markdown renders
    this._mdCharStep       = 280;  // also re-render every N chars
    this._rawNode          = null;
    this._charCount        = 0;

    /* ── Flashcard State ── */
    this.fcCards    = [];
    this.fcCurrent  = 0;
    this.fcFlipped  = false;
    this.fcLearned  = new Set();

    /* ── Quiz State ── */
    this.quizData   = [];
    this.quizIdx    = 0;
    this.quizScore  = 0;

    /* ── Persistence ── */
    this.history   = this._load('sv_history', []);
    this.saved     = this._load('sv_saved',   []);
    this.prefs     = this._load('sv_prefs',   {});
    this.userName  = localStorage.getItem('sv_user') || '';
    this.sessions  = parseInt(localStorage.getItem('sv_sessions') || '0');
    this.isReturn  = !!this.userName;
    this.streak    = this._calculateStreak();

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
    this._updateThemeIcon();
    this._renderDashboard();

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
      `%cFounder: ${SAVOIRÉ.FOUNDER} | Free for every student on Earth, forever.`,
      'color:#756D63;font-size:11px'
    );
  }

  /* ═══════════════════════════════════════════════════════════════════════════
     HELPERS
     ═════════════════════════════════════════════════════════════════════════ */
  _el(id)          { return document.getElementById(id); }
  _qs(sel)         { return document.querySelector(sel); }
  _qsa(sel)        { return document.querySelectorAll(sel); }
  _on(id, ev, fn)  { const el = this._el(id); if (el) el.addEventListener(ev, fn.bind(this)); }

  _load(key, def) {
    try { const v = localStorage.getItem(key); return v ? JSON.parse(v) : def; }
    catch { return def; }
  }

  _save(key, val) {
    try { localStorage.setItem(key, JSON.stringify(val)); } catch {}
  }

  _esc(s) {
    if (!s) return '';
    return String(s)
      .replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;')
      .replace(/"/g,'&quot;').replace(/'/g,'&#039;');
  }

  _relTime(ts) {
    if (!ts) return '';
    const d=Date.now()-ts, m=Math.floor(d/60000), h=Math.floor(d/3600000), day=Math.floor(d/86400000);
    if(m<1)return'just now';if(m<60)return`${m}m ago`;if(h<24)return`${h}h ago`;if(day<7)return`${day}d ago`;
    return new Date(ts).toLocaleDateString();
  }

  _dateGroup(ts) {
    if(!ts)return'Unknown';
    const d=Date.now()-ts,day=Math.floor(d/86400000);
    if(day===0)return'Today';if(day===1)return'Yesterday';if(day<7)return'This Week';if(day<30)return'This Month';
    return'Older';
  }

  _genId() { return Date.now().toString(36)+Math.random().toString(36).slice(2); }

  _wordCount(text) { return text?text.trim().split(/\s+/).filter(Boolean).length:0; }
  _charCount(text) { return text?text.length:0; }

  _stripMd(t) {
    if(!t)return'';
    return t.replace(/#{1,6} /g,'').replace(/\*\*\*(.+?)\*\*\*/g,'$1').replace(/\*\*(.+?)\*\*/g,'$1')
      .replace(/\*(.+?)\*/g,'$1').replace(/`(.+?)`/g,'$1').replace(/^[-*] /gm,'').replace(/^\d+\. /gm,'')
      .replace(/^> /gm,'').replace(/\n{3,}/g,'\n\n').trim();
  }

  _calculateStreak() {
    let streak=0;
    const today=new Date();today.setHours(0,0,0,0);
    const sorted=[...this.history].sort((a,b)=>(b.ts||0)-(a.ts||0));
    const days=new Set();
    sorted.forEach(h=>{if(h.ts){const d=new Date(h.ts);d.setHours(0,0,0,0);days.add(d.getTime());}});
    for(let i=0;i<365;i++){const check=new Date(today);check.setDate(check.getDate()-i);
      if(days.has(check.getTime()))streak++;else break;}
    return streak;
  }

  /* ═══════════════════════════════════════════════════════════════════════════
     MARKDOWN RENDERERS
     ═════════════════════════════════════════════════════════════════════════ */
  _renderMd(text) {
    if (!text) return '';
    if (window.marked && window.DOMPurify) {
      try { return DOMPurify.sanitize(marked.parse(text)); } catch(e) {}
    }
    return this._renderMdLive(text).replace('<span class="sfp-cursor">▊</span>','');
  }

  _renderMdLive(text) {
    if (!text) return '<span class="sfp-cursor">▊</span>';
    let h = String(text).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
    h = h.replace(/^#### (.+)$/gm,'<h4>$1</h4>');
    h = h.replace(/^### (.+)$/gm,'<h3>$1</h3>');
    h = h.replace(/^## (.+)$/gm,'<h2>$1</h2>');
    h = h.replace(/^# (.+)$/gm,'<h1>$1</h1>');
    h = h.replace(/\*\*(.+?)\*\*/g,'<strong>$1</strong>');
    h = h.replace(/\*(.+?)\*/g,'<em>$1</em>');
    h = h.replace(/^&gt; (.+)$/gm,'<blockquote>$1</blockquote>');
    h = h.replace(/^---+$/gm,'<hr>');
    h = h.replace(/^[-*] (.+)$/gm,'<li>$1</li>');
    h = h.replace(/\n/g,'<br>');
    return h + '<span class="sfp-cursor">▊</span>';
  }

  /* ═══════════════════════════════════════════════════════════════════════════
     EVENT BINDING — all UI interactions
     ═════════════════════════════════════════════════════════════════════════ */
  _bindAll() {
    /* ── Welcome ── */
    this._on('welcomeBtn','click',()=>this._submitWelcome());
    this._on('welcomeNameInput','keydown',(e)=>{if(e.key==='Enter')this._submitWelcome();});
    this._on('welcomeSkip','click',()=>this._skipWelcome());
    this._on('welcomeBackBtn','click',()=>this._dismissWelcomeBack());

    /* ── Header ── */
    this._on('sbToggle','click',()=>this._toggleSidebar());
    this._on('histBtn','click',()=>this._openHistModal());
    this._on('themeBtn','click',()=>this._toggleTheme());
    this._on('settingsBtn','click',()=>this._openSettingsModal());
    this._on('dashboardBtn','click',()=>this._toggleDashboard());
    this._on('avBtn','click',(e)=>{e.stopPropagation();this._toggleDropdown();});

    /* ── Avatar dropdown ── */
    this._on('avHist','click',()=>{this._closeDropdown();this._openHistModal();});
    this._on('avSaved','click',()=>{this._closeDropdown();this._openSavedModal();});
    this._on('avSettings','click',()=>{this._closeDropdown();this._openSettingsModal();});
    this._on('avDashboard','click',()=>{this._closeDropdown();this._toggleDashboard();});
    this._on('avClear','click',()=>{this._closeDropdown();
      this._confirm('Clear ALL data? History, saved notes and preferences will be permanently deleted.',()=>this._clearAllData());});

    document.addEventListener('click',()=>this._closeDropdown());

    /* ── Tool selector ── */
    this._qsa('.ts-item').forEach(btn=>{btn.addEventListener('click',()=>this._setTool(btn.dataset.tool));});

    /* ── Generate ── */
    this._on('runBtn','click',()=>this._send());
    this._on('cancelBtn','click',()=>this._cancelGeneration());

    /* ── Textarea ── */
    this._on('mainInput','input',()=>this._updateCharCount());
    this._on('mainInput','keydown',(e)=>{
      if((e.key==='Enter'&&e.ctrlKey)||(e.key==='Enter'&&e.metaKey)){e.preventDefault();this._send();}
    });
    this._on('taClearBtn','click',()=>{const el=this._el('mainInput');if(el){el.value='';this._updateCharCount();el.focus();}});

    /* ── Input mini bar ── */
    const imb=this._el('inputMiniBar');
    if(imb){imb.addEventListener('click',()=>this._expandInput());}

    /* ── File upload ── */
    this._on('uploadZone','click',()=>this._el('fileInput')?.click());
    this._on('fileInput','change',(e)=>this._handleFile(e.target.files[0]));
    this._on('fileChipRm','click',()=>this._removeFile());

    const dz=this._el('uploadZone');
    if(dz){dz.addEventListener('dragover',e=>{e.preventDefault();dz.classList.add('drag-over');});
      dz.addEventListener('dragleave',()=>dz.classList.remove('drag-over'));
      dz.addEventListener('drop',e=>{e.preventDefault();dz.classList.remove('drag-over');
        const f=e.dataTransfer?.files?.[0];if(f)this._handleFile(f);});}

    /* ── Output toolbar ── */
    this._on('copyBtn','click',()=>this._copyResult());
    this._on('pdfBtn','click',()=>this._downloadPDF());
    this._on('saveBtn','click',()=>this._saveNote());
    this._on('shareBtn','click',()=>this._shareResult());
    this._on('clearBtn','click',()=>this._clearOutput());
    this._on('focusModeBtn','click',()=>this._toggleFocusMode());

    /* ── Dashboard ── */
    this._on('dashStartBtn','click',()=>{this._el('mainInput')?.focus();});

    /* ── History modal ── */
    this._on('histSearchInput','input',(e)=>this._filterHist(e.target.value));
    this._on('clearHistBtn','click',()=>{
      this._confirm('Clear all study history?',()=>{this.history=[];this._save('sv_history',this.history);
        this._renderHistModal();this._renderSbHistory();this._updateHeaderStats();this._toast('info','fa-trash','History cleared.');});});
    this._on('exportHistBtn','click',()=>this._exportDataJson());

    this._qsa('.hf').forEach(btn=>{btn.addEventListener('click',()=>{
      this._qsa('.hf').forEach(b=>{b.classList.remove('active');b.setAttribute('aria-pressed','false');});
      btn.classList.add('active');btn.setAttribute('aria-pressed','true');
      this._renderHistModal(btn.dataset.filter,this._el('histSearchInput')?.value||'');});});

    /* ── Settings ── */
    this._on('saveNameBtn','click',()=>this._saveName());
    this._on('exportDataBtn','click',()=>this._exportDataJson());
    this._on('clearDataBtn','click',()=>{
      this._confirm('Delete ALL data?',()=>this._clearAllData());});
    this._on('nameInput','keydown',(e)=>{if(e.key==='Enter')this._saveName();});

    this._qsa('[data-theme-btn]').forEach(btn=>{btn.addEventListener('click',()=>this._setTheme(btn.dataset.themeBtn));});
    this._qsa('.font-sz').forEach(btn=>{btn.addEventListener('click',()=>this._setFontSize(btn.dataset.size));});

    /* ── Modals ── */
    this._qsa('[data-close]').forEach(btn=>{btn.addEventListener('click',()=>this._closeModal(btn.dataset.close));});
    this._qsa('.modal-close').forEach(btn=>{const ov=btn.closest('.modal-overlay');
      if(ov)btn.addEventListener('click',()=>this._closeModal(ov.id));});
    this._qsa('.modal-overlay').forEach(ov=>{ov.addEventListener('click',e=>{if(e.target===ov)this._closeModal(ov.id);});});

    /* ── Confirm ── */
    this._on('confirmOkBtn','click',()=>{this._closeModal('confirmModal');
      if(typeof this.confirmCb==='function')this.confirmCb();this.confirmCb=null;});

    /* ── Mobile sidebar ── */
    this._on('sbBackdrop','click',()=>this._closeMobileSidebar());

    /* ── Keyboard shortcuts ── */
    document.addEventListener('keydown',(e)=>{
      if(e.key==='Escape'){this._closeAllModals();if(this.generating)this._cancelGeneration();return;}
      const tag=document.activeElement?.tagName?.toLowerCase();
      if(tag==='input'||tag==='textarea')return;
      if(e.ctrlKey||e.metaKey){
        switch(e.key.toLowerCase()){
          case 'k':e.preventDefault();this._el('mainInput')?.focus();break;
          case 'h':e.preventDefault();this._openHistModal();break;
          case 's':e.preventDefault();this._saveNote();break;
          case 'p':e.preventDefault();this._downloadPDF();break;
          case 'b':e.preventDefault();this._toggleSidebar();break;
          case 'd':e.preventDefault();this._toggleTheme();break;
          case 'f':e.preventDefault();this._toggleFocusMode();break;
        }
      }
      // Flashcard navigation
      if(this.fcCards.length&&this.tool==='flashcards'&&!this.generating){
        if(e.key==='ArrowRight'||e.key==='ArrowDown'){e.preventDefault();this._fcNav(1);}
        else if(e.key==='ArrowLeft'||e.key==='ArrowUp'){e.preventDefault();this._fcNav(-1);}
        else if(e.key===' '||e.key==='Enter'){e.preventDefault();this._fcFlip();}
        else if(e.key==='s'||e.key==='S'){e.preventDefault();this._fcShuffle();}
      }
    });
  }

  /* ────────────────────────────────────────────────────────────────────
     WELCOME SYSTEM
     ──────────────────────────────────────────────────────────────────── */
  _initWelcome() {
    if(!this.userName){
      setTimeout(()=>{const ov=this._el('welcomeOverlay');
        if(ov){ov.style.display='flex';setTimeout(()=>ov.classList.add('visible'),50);
          setTimeout(()=>this._el('welcomeNameInput')?.focus(),400);}},500);
    }else{
      this.sessions++;localStorage.setItem('sv_sessions',String(this.sessions));
      if(this.sessions<=1||this.sessions%3===0){
        setTimeout(()=>{const wb=this._el('welcomeBackOverlay');
          if(wb){const wbName=this._el('wbName');if(wbName)wbName.textContent=this.userName;
            // Prefill stats
            const hEl=this._el('wbHistCount'),sEl=this._el('wbSavedCount'),seEl=this._el('wbSessions');
            if(hEl)hEl.textContent=this.history.length;
            if(sEl)sEl.textContent=this.saved.length;
            if(seEl)seEl.textContent=this.sessions;
            wb.style.display='flex';setTimeout(()=>wb.classList.add('visible'),50);}},600);
      }
    }
  }

  _submitWelcome(){
    const inp=this._el('welcomeNameInput');const name=inp?.value?.trim();
    if(!name||name.length<2){inp?.classList.add('shake');setTimeout(()=>inp?.classList.remove('shake'),500);return;}
    this.userName=name;localStorage.setItem('sv_user',name);
    this.sessions=1;localStorage.setItem('sv_sessions','1');
    this._dismissOverlay('welcomeOverlay');this._updateUserUI();this._updateHeaderStats();
    this._toast('success','fa-hand-wave',`Welcome, ${name}! Ready to study smarter? 🎓`);
  }

  _skipWelcome(){this.userName='Scholar';localStorage.setItem('sv_user','Scholar');
    this.sessions=1;localStorage.setItem('sv_sessions','1');
    this._dismissOverlay('welcomeOverlay');this._updateUserUI();}

  _dismissWelcomeBack(){this._dismissOverlay('welcomeBackOverlay');}

  _dismissOverlay(id){const el=this._el(id);if(!el)return;
    el.classList.remove('visible');el.classList.add('dismissing');
    setTimeout(()=>{el.style.display='none';el.classList.remove('dismissing');},450);}

  /* ────────────────────────────────────────────────────────────────────
     USER UI
     ──────────────────────────────────────────────────────────────────── */
  _updateUserUI(){
    const name=this.userName||'Scholar';
    const init=name.split(' ').map(w=>w[0]).join('').toUpperCase().slice(0,2);
    const avInitials=this._el('avInitials');if(avInitials)avInitials.textContent=init;
    const avDropName=this._el('avDropName');if(avDropName)avDropName.textContent=name;
    const avDropAv=this._el('avDropAv');if(avDropAv)avDropAv.textContent=init;
    const greeting=this._el('dhGreeting');
    if(greeting){const hr=new Date().getHours();
      greeting.textContent=(hr<12?'Good morning':hr<17?'Good afternoon':'Good evening')+', '+name;}
  }

  _updateHeaderStats(){
    const sess=this._el('statSessions'),hist=this._el('statHistory'),savd=this._el('statSaved');
    if(sess)sess.textContent=this.sessions||0;if(hist)hist.textContent=this.history.length;
    if(savd)savd.textContent=this.saved.length;this._updateHistBadge();}

  _updateHistBadge(){const badge=this._el('histBadge');
    if(badge){badge.textContent=this.history.length;badge.style.display=this.history.length?'':'none';}}

  _updateThemeIcon(){const icon=this._el('themeIcon');const t=document.documentElement.dataset.theme||'dark';
    if(icon)icon.className=t==='dark'?'fas fa-moon':'fas fa-sun';}

  /* ────────────────────────────────────────────────────────────────────
     TOOL SELECTOR
     ──────────────────────────────────────────────────────────────────── */
  _setTool(tool){if(!TOOL_CONFIG[tool])return;this.tool=tool;
    this._qsa('.ts-item').forEach(btn=>{const isActive=btn.dataset.tool===tool;
      btn.classList.toggle('active',isActive);btn.setAttribute('aria-pressed',String(isActive));});
    const ta=this._el('mainInput'),cfg=TOOL_CONFIG[tool];
    if(ta)ta.placeholder=cfg.placeholder;
    const icon=this._el('runIcon'),lbl=this._el('runLabel');
    if(icon)icon.className=`fas ${cfg.icon}`;if(lbl)lbl.textContent=cfg.label;
    this.prefs.lastTool=tool;this._save('sv_prefs',this.prefs);}

  /* ────────────────────────────────────────────────────────────────────
     CHARACTER COUNT
     ──────────────────────────────────────────────────────────────────── */
  _updateCharCount(){const ta=this._el('mainInput'),cnt=this._el('charCount'),max=12000;
    if(!ta)return;const len=ta.value.length;if(cnt)cnt.textContent=`${len} / ${max}`;
    if(len>=max*0.8)cnt?.classList.add('warning');else cnt?.classList.remove('warning');
    if(len>max){ta.value=ta.value.substring(0,max);this._toast('info','fa-info-circle',`Input limited to ${max} characters.`);}}

  /* ────────────────────────────────────────────────────────────────────
     FILE UPLOAD
     ──────────────────────────────────────────────────────────────────── */
  _handleFile(file){if(!file)return;
    const allowed=['.txt','.md','.csv'];const ext='.'+(file.name.split('.').pop()||'').toLowerCase();
    if(!allowed.includes(ext)&&file.type!=='text/plain'){this._toast('error','fa-times','File type not supported.');return;}
    if(file.size>5000000){this._toast('error','fa-times','File too large. Max 5MB.');return;}
    const reader=new FileReader();
    reader.onload=e=>{const text=e.target.result?.trim();if(!text){this._toast('error','fa-times','File is empty.');return;}
      const ta=this._el('mainInput');if(ta){ta.value=text.substring(0,12000);this._updateCharCount();}
      const chip=this._el('fileChip'),name=this._el('fileChipName'),dz=this._el('uploadZone');
      if(chip)chip.style.display='flex';if(name)name.textContent=file.name;if(dz)dz.classList.add('has-file');
      this._toast('success','fa-check',`File loaded: ${file.name}`);};
    reader.onerror=()=>this._toast('error','fa-times','Failed to read file.');
    reader.readAsText(file,'UTF-8');}

  _removeFile(){const fi=this._el('fileInput'),chip=this._el('fileChip'),dz=this._el('uploadZone');
    if(fi)fi.value='';if(chip)chip.style.display='none';if(dz)dz.classList.remove('has-file');}

  /* ═══════════════════════════════════════════════════════════════════════════
     GENERATE — main entry point
     ═════════════════════════════════════════════════════════════════════════ */
  async _send(){
    if(this.generating)return;
    const ta=this._el('mainInput'),text=ta?.value?.trim();
    if(!text||text.length<2){ta?.focus();this._toast('info','fa-lightbulb','Please enter a topic or question to study.');
      ta?.classList.add('input-shake');setTimeout(()=>ta?.classList.remove('input-shake'),500);return;}

    const depth=this._el('depthSel')?.value||'detailed';
    const lang=this._el('langSel')?.value||'English';
    const style=this._el('styleSel')?.value||'simple';

    this._mobileScrollToOutput();
    this.generating=true;this.streamBuffer='';this._charCount=0;
    this._lastMdRender=0;this._lastMdRenderChars=0;this._rawNode=null;
    if(this._rafId){cancelAnimationFrame(this._rafId);this._rafId=null;this._rafPending=false;}

    this._setRunLoading(true);this._collapseInput(text);this._showStreamOverlay(text,this.tool);
    this._startThinkingStages();

    try{
      const data=await this._callAPIStream(text,{depth,language:lang,style,tool:this.tool});
      this.currentData=data;this._hideStreamOverlay();this._renderResult(data);
      this._addToHistory({id:this._genId(),topic:data.topic||text,tool:this.tool,data,ts:Date.now()});
      this._updateHeaderStats();this._toast('success','fa-check-circle',`${TOOL_CONFIG[this.tool].sfpName} ready!`);
      setTimeout(()=>this._scrollToResult(),200);
    }catch(err){
      if(err.name==='AbortError'||err.message==='AbortError'){
        this._toast('info','fa-stop-circle','Generation cancelled.');this._hideStreamOverlay();this._showState('empty');
      }else{this._hideStreamOverlay();this._showState('error',err.message||'Something went wrong.');
        this._toast('error','fa-exclamation-circle',err.message||'Generation failed.');}
    }finally{this.generating=false;this._setRunLoading(false);this._stopThinkingStages();this._showCancelBtn(false);}
  }

  _mobileScrollToOutput(){if(window.innerWidth>768)return;
    const rp=this._el('rightPanel');if(rp)rp.scrollIntoView({behavior:'smooth',block:'start'});}

  _scrollToResult(){const ra=this._el('resultArea');
    if(ra&&ra.style.display!=='none')ra.scrollIntoView({behavior:'smooth',block:'start'});
    const oa=this._el('outArea');if(oa)oa.scrollTo({top:0,behavior:'smooth'});}

  /* ═══════════════════════════════════════════════════════════════════════════
     LIVE AI STREAMING — 3-Phase Render Strategy
     ═════════════════════════════════════════════════════════════════════════ */
  async _callAPIStream(message,opts={}){
    this.streamCtrl=new AbortController();this._showCancelBtn(true);
    const sfpText=this._el('sfpText'),sfpScroll=this._el('sfpScroll');
    const that=this;

    return new Promise((resolve,reject)=>{
      fetch(SAVOIRÉ.API_URL,{method:'POST',
        headers:{'Content-Type':'application/json'},
        body:JSON.stringify({message,options:{...opts,stream:true}}),
        signal:that.streamCtrl?.signal})
      .then(async res=>{
        if(!res.ok){const t=await res.text().catch(()=>'');reject(new Error(`Server error (${res.status}): ${t.slice(0,120)}`));return;}
        const ct=res.headers.get('content-type')||'';
        if(!ct.includes('text/event-stream')){const data=await res.json();
          if(data.error){reject(new Error(data.error));return;}that._simulateStream(data,resolve,reject);return;}

        const reader=res.body.getReader(),decoder=new TextDecoder();
        let lineBuffer='',currentEvent='',currentData='',streamResolved=false;

        // ── Phase 1 init: TextNode for instant rendering ──
        let rawNode=null;
        const initRawNode=()=>{sfpText.innerHTML='';sfpText.classList.add('live-md');
          rawNode=document.createTextNode('');sfpText.appendChild(rawNode);};

        // ── Throttled markdown render (Phase 2) ──
        const scheduleMdRender=()=>{
          if(that._rafPending)return;that._rafPending=true;
          that._rafId=requestAnimationFrame(()=>{that._rafPending=false;
            const now=Date.now();
            const charsSinceLast=that._charCount-(that._lastMdRenderChars||0);
            if(now-that._lastMdRender<that._mdRenderInterval&&charsSinceLast<that._mdCharStep)return;
            that._lastMdRender=now;that._lastMdRenderChars=that._charCount;rawNode=null;
            try{sfpText.innerHTML=that._renderMdLive(that.streamBuffer);sfpText.classList.add('live-md');}
            catch(e){sfpText.textContent=that.streamBuffer+'▊';}
            if(sfpScroll)sfpScroll.scrollTop=sfpScroll.scrollHeight;});};

        const dispatchSSEEvent=(evtName,payload)=>{
          if(evtName==='token'){
            try{const parsed=JSON.parse(payload);
              if(parsed.t){that.streamBuffer+=parsed.t;that._charCount+=parsed.t.length;
                if(!rawNode)initRawNode();if(rawNode){rawNode.textContent=that.streamBuffer;
                  if(sfpScroll)sfpScroll.scrollTop=sfpScroll.scrollHeight;}scheduleMdRender();}}
            catch{/* raw text */that.streamBuffer+=payload;that._charCount+=payload.length;
              if(!rawNode)initRawNode();if(rawNode){rawNode.textContent=that.streamBuffer;
                if(sfpScroll)sfpScroll.scrollTop=sfpScroll.scrollHeight;}scheduleMdRender();}}
          else if(evtName==='stage'){
            try{const s=JSON.parse(payload);that._updateStageIndicator(s);}catch{}}
          else if(evtName==='done'){
            streamResolved=true;
            if(that._rafId){cancelAnimationFrame(that._rafId);that._rafId=null;that._rafPending=false;}
            // Phase 3: final clean render
            sfpText.innerHTML=that._renderMd(that.streamBuffer);sfpText.classList.remove('live-md');sfpText.classList.add('done');
            try{const data=JSON.parse(payload);resolve(data);}catch(e){reject(new Error('Invalid done payload'));}}
          else if(evtName==='error'){
            try{const err=JSON.parse(payload);reject(new Error(err.message||'Stream error'));}
            catch{reject(new Error(payload||'Stream error'));}}
        };

        const processLine=(line)=>{
          if(line===''){if(currentData)dispatchSSEEvent(currentEvent,currentData.trim());
            currentEvent='';currentData='';return;}
          if(line.startsWith(':'))return;
          if(line.startsWith('event:')){currentEvent=line.slice(6).trim();return;}
          if(line.startsWith('data:')){const p=line.slice(5).trim();
            if(p==='[DONE]')return;currentData=currentData?currentData+'\n'+p:p;}
        };

        const pump=async()=>{
          while(true){const{done,value}=await reader.read();
            if(done){if(lineBuffer.trim())processLine(lineBuffer.trim());
              if(currentData)dispatchSSEEvent(currentEvent,currentData.trim());
              if(!streamResolved)reject(new Error('Stream ended without done event'));return;}
            lineBuffer+=decoder.decode(value,{stream:true});
            const lines=lineBuffer.split(/\r?\n/);lineBuffer=lines.pop()||'';
            for(const line of lines)processLine(line);}};
        pump();
      }).catch(err=>reject(err));
    });
  }

  /* ── Simulate streaming for offline/fallback data ── */
  async _simulateStream(data,resolve,reject){
    const notesText=data.ultra_long_notes||data.topic||'Generating…';
    const sfpText=this._el('sfpText');let i=0;
    const tick=()=>{
      if(this.streamCtrl?.signal?.aborted){reject(new Error('AbortError'));return;}
      if(i>=notesText.length){if(sfpText){sfpText.classList.remove('live-md');sfpText.classList.add('done');}resolve(data);return;}
      this.streamBuffer+=notesText.slice(i,i+6);i+=6;
      try{sfpText.innerHTML=this._renderMdLive(this.streamBuffer);sfpText.classList.add('live-md');}
      catch(e){sfpText.textContent=this.streamBuffer;}
      const scroll=this._el('sfpScroll');if(scroll)scroll.scrollTop=scroll.scrollHeight;
      setTimeout(tick,14);};
    tick();
  }

  /* ── Update stage indicator in sidebar ── */
  _updateStageIndicator(stage){
    for(let i=0;i<5;i++){const el=this._el(`ss${i}`);if(el)el.className='ssc-stage';
      if(i===stage.idx){const e=this._el(`ss${i}`);if(e)e.classList.add('active');}}
  }

  _cancelGeneration(){if(this.streamCtrl){this.streamCtrl.abort();this.streamCtrl=null;}}

  /* ═══════════════════════════════════════════════════════════════════════════
     INPUT COLLAPSE / EXPAND
     ═════════════════════════════════════════════════════════════════════════ */
  _collapseInput(topic){
    ['taCollapseWrap','selectorsCollapseWrap','suggCollapseWrap','fileCollapseWrap'].forEach(id=>{
      const el=this._el(id);if(el)el.classList.add('is-collapsed');});
    const miniBar=this._el('inputMiniBar'),statusCard=this._el('streamStatusCard'),
      miniText=this._el('inputMiniText');
    if(miniText)miniText.textContent=topic.length>40?topic.substring(0,40)+'…':topic;
    if(miniBar)miniBar.classList.add('is-visible');
    if(statusCard)statusCard.classList.add('is-visible');}

  _expandInput(){
    ['taCollapseWrap','selectorsCollapseWrap','suggCollapseWrap','fileCollapseWrap'].forEach(id=>{
      const el=this._el(id);if(el)el.classList.remove('is-collapsed');});
    const miniBar=this._el('inputMiniBar'),statusCard=this._el('streamStatusCard');
    if(miniBar)miniBar.classList.remove('is-visible');
    if(statusCard)statusCard.classList.remove('is-visible');
    setTimeout(()=>this._el('mainInput')?.focus(),200);}

  /* ═══════════════════════════════════════════════════════════════════════════
     STREAMING OVERLAY
     ═════════════════════════════════════════════════════════════════════════ */
  _showStreamOverlay(topic,tool){
    const sfp=this._el('streamFullpage'),sfpTopic=this._el('sfpTopic'),
      sfpIcon=this._el('sfpToolIcon'),sfpName=this._el('sfpToolName'),
      sfpLabel=this._el('sfpLabel'),sfpText=this._el('sfpText');
    if(!sfp)return;const cfg=TOOL_CONFIG[tool]||TOOL_CONFIG.notes;
    if(sfpTopic)sfpTopic.textContent=topic.length>50?topic.substring(0,50)+'…':topic;
    if(sfpIcon)sfpIcon.className=`fas ${cfg.sfpIcon}`;if(sfpName)sfpName.textContent=cfg.sfpName;
    if(sfpLabel)sfpLabel.textContent=cfg.sfpLabel;
    if(sfpText){sfpText.innerHTML='<span class="sfp-cursor">▊</span>';sfpText.classList.remove('done');sfpText.classList.add('live-md');}
    const lp=this._el('leftPanel');
    if(lp&&!lp.classList.contains('collapsed'))sfp.classList.add('panel-open');else sfp.classList.remove('panel-open');
    sfp.style.display='flex';
    ['emptyState','thinkingWrap','resultArea'].forEach(id=>{const e=this._el(id);if(e)e.style.display='none';});
    if(window.innerWidth<=768)sfp.scrollIntoView({behavior:'smooth',block:'start'});}

  _hideStreamOverlay(){const sfp=this._el('streamFullpage');if(sfp){sfp.classList.add('fading-out');
    setTimeout(()=>{sfp.style.display='none';sfp.classList.remove('fading-out');},300);}this._expandInput();}

  /* ═══════════════════════════════════════════════════════════════════════════
     THINKING STAGES
     ═════════════════════════════════════════════════════════════════════════ */
  _startThinkingStages(){this.stageIdx=0;
    for(let i=0;i<5;i++){const el=this._el(`ts${i}`);if(el)el.className='ths';}
    this._activateStage(0);
    this.thinkTimer=setInterval(()=>{this.stageIdx++;if(this.stageIdx<5){this._doneStage(this.stageIdx-1);
      this._activateStage(this.stageIdx);}},3500);}

  _activateStage(idx){const el=this._el(`ts${idx}`);if(el){el.classList.remove('done');el.classList.add('active');}}
  _doneStage(idx){const el=this._el(`ts${idx}`);if(el){el.classList.remove('active');el.classList.add('done');}}
  _stopThinkingStages(){if(this.thinkTimer){clearInterval(this.thinkTimer);this.thinkTimer=null;}
    for(let i=0;i<5;i++)this._doneStage(i);}

  /* ═══════════════════════════════════════════════════════════════════════════
     UI STATE
     ═════════════════════════════════════════════════════════════════════════ */
  _showState(state,errorMsg){
    ['emptyState','thinkingWrap','resultArea'].forEach(id=>{const e=this._el(id);if(e)e.style.display='none';});
    switch(state){
      case 'result':{const r=this._el('resultArea');if(r)r.style.display='block';break;}
      case 'error':{const r=this._el('resultArea');if(r){r.style.display='block';
        r.innerHTML=`<div class="error-card"><div class="error-card-hdr"><i class="fas fa-exclamation-circle"></i> Generation Failed</div><div class="error-card-body">${this._esc(errorMsg)}</div><div class="error-card-hint">The AI models may be temporarily busy. The system automatically tries 10 different models. Please try again in a moment.</div><button class="btn btn-primary" style="margin-top:16px" onclick="document.getElementById('mainInput').focus()"><i class="fas fa-redo"></i> Try Again</button></div>`;}break;}
      default:{const e=this._el('emptyState');if(e)e.style.display='flex';break;}}}

  _setRunLoading(on){const btn=this._el('runBtn'),icon=this._el('runIcon'),lbl=this._el('runLabel');
    if(!btn)return;btn.disabled=on;
    if(on){if(icon)icon.className='fas fa-spinner fa-spin';if(lbl)lbl.textContent='Generating…';}
    else{const cfg=TOOL_CONFIG[this.tool]||TOOL_CONFIG.notes;
      if(icon)icon.className=`fas ${cfg.icon}`;if(lbl)lbl.textContent=cfg.label;}}

  _showCancelBtn(show){const btn=this._el('cancelBtn');if(btn)btn.classList.toggle('is-visible',show);}

  /* ═══════════════════════════════════════════════════════════════════════════
     RESULT RENDERING
     ═════════════════════════════════════════════════════════════════════════ */
  _renderResult(data){
    const area=this._el('resultArea');if(!area)return;
    area.innerHTML=this._buildResultHTML(data);this._showState('result');
    if(window.innerWidth<=768)setTimeout(()=>{area.scrollIntoView({behavior:'smooth',block:'start'});},200);
  }

  _buildResultHTML(data){
    const topic=this._esc(data.topic||'Study Material'),score=data.study_score||96,
      pct=Math.min(100,Math.max(0,score)),wc=this._wordCount(this._stripMd(data.ultra_long_notes||'')),
      lang=data._language||'English';
    const header=`<div class="result-hdr"><div class="rh-left"><div class="rh-topic">${topic}</div><div class="rh-meta"><div class="rh-mi"><i class="fas fa-graduation-cap"></i>${this._esc(data.curriculum_alignment||'General Study')}</div><div class="rh-mi"><i class="fas fa-calendar-alt"></i>${new Date().toLocaleDateString('en-GB',{day:'numeric',month:'short',year:'numeric'})}</div><div class="rh-mi"><i class="fas fa-globe"></i>${this._esc(lang)}</div><div class="rh-mi"><i class="fas fa-file-word"></i>~${wc.toLocaleString()} words</div><div class="rh-mi"><i class="fas fa-star" style="color:var(--gold)"></i>Score: ${score}/100</div></div><div class="rh-powered">Powered by <strong>${SAVOIRÉ.BRAND}</strong> · <a href="https://${SAVOIRÉ.DEVSITE}" target="_blank" rel="noopener">${SAVOIRÉ.DEVELOPER}</a></div></div><div class="score-ring-wrap"><div class="rh-score" style="--pct:${pct}"><div class="rh-score-val">${score}</div></div><div class="score-ring-label">Score</div></div></div>`;
    const navItems=this._buildNavItems(data);
    const nav=navItems.length>2?`<div class="result-nav">${navItems.map(item=>`<a href="#${item.id}" class="result-nav-btn"><i class="${item.icon}"></i> ${item.label}</a>`).join('')}</div>`:'';
    let body='';
    switch(this.tool){
      case 'flashcards':body=this._buildFcHTML(data);break;
      case 'quiz':body=this._buildQuizHTML(data);break;
      case 'summary':body=this._buildSummaryHTML(data);break;
      case 'mindmap':body=this._buildMindmapHTML(data);break;
      default:body=this._buildNotesHTML(data);break;}
    const exportBar=`<div class="export-bar"><button class="exp-btn pdf" onclick="window._app._downloadPDF()"><i class="fas fa-file-pdf"></i><span>PDF</span></button><button class="exp-btn copy" onclick="window._app._copyResult()"><i class="fas fa-copy"></i><span>Copy</span></button><button class="exp-btn save" onclick="window._app._saveNote()"><i class="fas fa-star"></i><span>Save</span></button><button class="exp-btn share" onclick="window._app._shareResult()"><i class="fas fa-share-alt"></i><span>Share</span></button><span class="exp-brand">${SAVOIRÉ.BRAND} · <a href="https://${SAVOIRÉ.DEVSITE}" target="_blank" rel="noopener">${SAVOIRÉ.DEVELOPER}</a></span></div>`;
    const brandingFooter=`<div class="result-branding-footer"><div class="rbf-left"><div class="rbf-logo">Ś</div><div class="rbf-text"><a href="https://${SAVOIRÉ.WEBSITE}" target="_blank" rel="noopener">${SAVOIRÉ.BRAND}</a> · <a href="https://${SAVOIRÉ.DEVSITE}" target="_blank" rel="noopener">${SAVOIRÉ.DEVELOPER}</a> · Founder: ${SAVOIRÉ.FOUNDER} · Free forever</div></div><div class="rbf-ts">${new Date().toLocaleString()}</div></div>`;
    return `<div class="result-wrap">${header}${nav}${body}${exportBar}${brandingFooter}</div>`;}

  _buildNavItems(data){const items=[];
    if(data.ultra_long_notes)items.push({id:'sec-notes',label:'Notes',icon:'fas fa-book-open'});
    if(data.key_concepts?.length)items.push({id:'sec-concepts',label:'Concepts',icon:'fas fa-lightbulb'});
    if(data.key_tricks?.length)items.push({id:'sec-tricks',label:'Tricks',icon:'fas fa-magic'});
    if(data.practice_questions?.length)items.push({id:'sec-qa',label:'Questions',icon:'fas fa-pen-alt'});
    if(data.real_world_applications?.length)items.push({id:'sec-apps',label:'Applications',icon:'fas fa-globe'});
    if(data.common_misconceptions?.length)items.push({id:'sec-misc',label:'Misconceptions',icon:'fas fa-exclamation-triangle'});
    if(data.mind_map)items.push({id:'sec-mindmap',label:'Mind Map',icon:'fas fa-project-diagram'});
    return items;}

  /* ═══════════════════════════════════════════════════════════════════════════
     TOOL 1 — NOTES HTML
     ═════════════════════════════════════════════════════════════════════════ */
  _buildNotesHTML(data){let h='';
    if(data.ultra_long_notes){h+=`<div class="study-sec section-anchor" id="sec-notes"><div class="ss-hdr"><div class="ss-title"><i class="fas fa-book-open"></i> Comprehensive Analysis</div><button class="ss-copy-btn" onclick="window._app._copySection(${JSON.stringify(this._stripMd(data.ultra_long_notes))})"><i class="fas fa-copy"></i> Copy</button></div><div class="ss-body"><div class="md-content">${this._renderMd(data.ultra_long_notes)}</div></div></div>`;}
    if(data.key_concepts?.length){const cards=data.key_concepts.map((c,i)=>`<div class="concept-card"><div class="concept-num">${i+1}</div><div class="concept-text">${this._esc(c)}</div></div>`).join('');
      h+=`<div class="study-sec section-anchor" id="sec-concepts"><div class="ss-hdr"><div class="ss-title"><i class="fas fa-lightbulb"></i> Key Concepts</div><button class="ss-copy-btn" onclick="window._app._copySection(${JSON.stringify(data.key_concepts.join('\n'))})"><i class="fas fa-copy"></i> Copy</button></div><div class="ss-body"><div class="concepts-grid">${cards}</div></div></div>`;}
    if(data.key_tricks?.length){const ICONS=['fas fa-magic','fas fa-star','fas fa-bolt'];
      const items=data.key_tricks.map((t,i)=>`<div class="trick-item"><div class="trick-icon"><i class="${ICONS[i%3]}"></i></div><div class="trick-text">${this._esc(t)}</div></div>`).join('');
      h+=`<div class="study-sec section-anchor" id="sec-tricks"><div class="ss-hdr"><div class="ss-title"><i class="fas fa-magic"></i> Study Tricks & Memory Aids</div></div><div class="ss-body"><div class="tricks-list">${items}</div></div></div>`;}
    if(data.practice_questions?.length){const qs=data.practice_questions.map((qa,i)=>`<div class="qa-card"><div class="qa-head" onclick="this.nextElementSibling.classList.toggle('visible');this.querySelector('.qa-toggle').classList.toggle('open');" role="button" tabindex="0" onkeydown="if(event.key==='Enter'||event.key===' ')this.click()"><div class="qa-num">${i+1}</div><div class="qa-q">${this._esc(qa.question)}</div><button class="qa-toggle" tabindex="-1"><i class="fas fa-chevron-down"></i> Answer</button></div><div class="qa-answer"><div class="qa-albl"><i class="fas fa-check-circle"></i> Answer & Explanation</div><div class="qa-answer-inner">${this._renderMd(qa.answer)}</div></div></div>`).join('');
      h+=`<div class="study-sec section-anchor" id="sec-qa"><div class="ss-hdr"><div class="ss-title"><i class="fas fa-pen-alt"></i> Practice Questions & Answers</div></div><div class="ss-body"><div class="qa-list">${qs}</div></div></div>`;}
    if(data.real_world_applications?.length){const items=data.real_world_applications.map((a,i)=>`<div class="list-item app"><i class="fas fa-globe li-ico" style="color:var(--em2)"></i><div class="li-text"><strong style="color:var(--em2)">Application ${i+1}:</strong> ${this._esc(a)}</div></div>`).join('');
      h+=`<div class="study-sec section-anchor" id="sec-apps"><div class="ss-hdr"><div class="ss-title"><i class="fas fa-globe"></i> Real-World Applications</div></div><div class="ss-body"><div class="items-list">${items}</div></div></div>`;}
    if(data.common_misconceptions?.length){const items=data.common_misconceptions.map((m,i)=>`<div class="list-item misc"><i class="fas fa-exclamation-triangle li-ico" style="color:var(--ruby2)"></i><div class="li-text"><strong style="color:var(--ruby2)">Misconception ${i+1}:</strong> ${this._esc(m)}</div></div>`).join('');
      h+=`<div class="study-sec section-anchor" id="sec-misc"><div class="ss-hdr"><div class="ss-title"><i class="fas fa-exclamation-triangle"></i> Common Misconceptions</div></div><div class="ss-body"><div class="items-list">${items}</div></div></div>`;}
    return h||'<div style="padding:24px;color:var(--t3)">Study materials generated successfully.</div>';}

  /* ═══════════════════════════════════════════════════════════════════════════
     TOOL 2 — FLASHCARDS HTML
     ═════════════════════════════════════════════════════════════════════════ */
  _buildFcHTML(data){
    const cards=[];(data.key_concepts||[]).forEach(c=>{const parts=c.split(':');
      cards.push({q:(parts[0]||c).trim(),a:parts.slice(1).join(':').trim()||c});});
    (data.practice_questions||[]).forEach(qa=>{cards.push({q:qa.question,a:qa.answer});});
    if(!cards.length)return this._buildNotesHTML(data);
    this.fcCards=cards;this.fcCurrent=0;this.fcFlipped=false;this.fcLearned=new Set();
    const total=cards.length,first=cards[0];
    return `<div class="study-sec"><div class="ss-hdr"><div class="ss-title"><i class="fas fa-layer-group"></i> Interactive Flashcards <span style="color:var(--t3);font-weight:400;text-transform:none;letter-spacing:0;margin-left:4px">(${total} cards)</span></div></div><div class="ss-body"><div class="fc-mode"><div class="fc-top-bar"><div class="fc-prog">Card <span id="fcCur">1</span> of <span id="fcTot">${total}</span></div><div class="fc-prog-bar-wrap"><div class="fc-prog-bar-fill" id="fcProgBar" style="width:${(1/total*100).toFixed(1)}%"></div></div><div class="fc-prog" style="min-width:50px;text-align:right"><span id="fcPct">${Math.round(1/total*100)}</span>%</div></div><div class="fc-wrap" onclick="window._app._fcFlip()" role="button" tabindex="0" onkeydown="if(event.key===' '){event.preventDefault();window._app._fcFlip();}"><div class="flashcard" id="theCard"><div class="fc-face fc-front"><div class="fc-lbl"><i class="fas fa-question-circle"></i> Question</div><div class="fc-content" id="fcFront">${this._esc(first.q)}</div><div class="fc-hint"><i class="fas fa-hand-pointer"></i> Click to flip · <kbd>Space</kbd></div></div><div class="fc-face fc-back"><div class="fc-lbl"><i class="fas fa-lightbulb"></i> Answer</div><div class="fc-content" id="fcBack">${this._renderMd(first.a)}</div><div class="fc-hint"><i class="fas fa-check-circle" style="color:var(--em2)"></i> Got it? Use arrows to continue</div></div></div></div><div class="fc-controls"><button class="fc-btn" id="fcPrev" onclick="window._app._fcNav(-1)" ${total<=1?'disabled':''}><i class="fas fa-arrow-left"></i> Prev</button><button class="fc-btn primary" onclick="window._app._fcFlip()"><i class="fas fa-sync-alt"></i> Flip</button><button class="fc-btn" id="fcNext" onclick="window._app._fcNav(1)" ${total<=1?'disabled':''}>Next <i class="fas fa-arrow-right"></i></button></div><div class="fc-controls" style="margin-top:-6px"><button class="fc-btn" onclick="window._app._fcShuffle()"><i class="fas fa-random"></i> Shuffle</button><button class="fc-btn" onclick="window._app._fcRestart()"><i class="fas fa-redo"></i> Restart</button></div><div class="fc-swipe-hint fc-kb"><kbd>Space</kbd> flip · <kbd>←</kbd><kbd>→</kbd> navigate · ${total} cards</div></div></div></div>`;}

  _fcFlip(){const fc=this._el('theCard');if(!fc)return;this.fcFlipped=!this.fcFlipped;fc.classList.toggle('flipped',this.fcFlipped);}
  _fcNav(dir){if(!this.fcCards.length)return;this.fcCurrent=Math.max(0,Math.min(this.fcCards.length-1,this.fcCurrent+dir));
    this.fcFlipped=false;const fc=this._el('theCard');if(fc)fc.classList.remove('flipped');
    const card=this.fcCards[this.fcCurrent];
    ['fcFront','fcBack'].forEach((id,i)=>{const el=this._el(id);if(el){if(i===0)el.textContent=card.q;else el.innerHTML=this._renderMd(card.a);}});
    const cur=this._el('fcCur'),pct=this._el('fcPct'),bar=this._el('fcProgBar'),
      prev=this._el('fcPrev'),next=this._el('fcNext');
    if(cur)cur.textContent=this.fcCurrent+1;const p=((this.fcCurrent+1)/this.fcCards.length*100).toFixed(1);
    if(pct)pct.textContent=Math.round(p);if(bar)bar.style.width=`${p}%`;
    if(prev)prev.disabled=this.fcCurrent===0;if(next)next.disabled=this.fcCurrent===this.fcCards.length-1;}
  _fcShuffle(){for(let i=this.fcCards.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));
    [this.fcCards[i],this.fcCards[j]]=[this.fcCards[j],this.fcCards[i]];}
    this.fcCurrent=0;this.fcFlipped=false;this._fcNav(0);this._toast('info','fa-random','Cards shuffled!');}
  _fcRestart(){this.fcCurrent=0;this.fcFlipped=false;this.fcLearned=new Set();this._fcNav(0);}

  /* ═══════════════════════════════════════════════════════════════════════════
     TOOL 3 — QUIZ HTML (MCQ with 5-part answers)
     ═════════════════════════════════════════════════════════════════════════ */
  _buildQuizHTML(data){
    const qs=data.practice_questions||[];if(!qs.length)return this._buildNotesHTML(data);
    this.quizData=qs.map((q,idx)=>{const options=this._buildMCQOptions(q,data,idx);
      return{...q,options,correctIdx:options.findIndex(o=>o.isCorrect),answered:false,correct:false,selectedIdx:-1};});
    this.quizIdx=0;this.quizScore=0;
    return `<div class="study-sec" id="quizContainer"><div class="ss-hdr"><div class="ss-title"><i class="fas fa-question-circle"></i> Practice Quiz <span style="color:var(--t3);font-weight:400;text-transform:none;letter-spacing:0;margin-left:4px">(${qs.length} questions)</span></div><div style="margin-left:auto;display:flex;align-items:center;gap:12px"><div class="quiz-score-display" id="quizScoreLabel"><i class="fas fa-star" style="color:var(--gold)"></i> <span id="quizScoreNum">0</span> / ${qs.length}</div></div></div><div class="ss-body" id="quizBody">${this._renderQuizQ(0)}</div></div>`;}

  _buildMCQOptions(qa,data,idx){
    const correctText=this._stripMd(qa.answer||'').split('.')[0]?.trim()?.substring(0,90)||'Correct answer';
    const distractorPool=[];
    (data.practice_questions||[]).filter((_,i)=>i!==idx).forEach(q=>{
      const d=this._stripMd(q.answer||'').split('.')[0]?.trim()?.substring(0,90);if(d&&d!==correctText&&!distractorPool.includes(d))distractorPool.push(d);});
    (data.key_concepts||[]).forEach(c=>{const d=this._stripMd(c).substring(0,90);if(d&&d!==correctText&&!distractorPool.includes(d))distractorPool.push(d);});
    const fallbacks=['A commonly confused alternative explanation','An incorrect but plausible-sounding option','This would be true under different assumptions','A related but ultimately wrong interpretation'];
    while(distractorPool.length<3){const fb=fallbacks[distractorPool.length%4];if(!distractorPool.includes(fb))distractorPool.push(fb);}
    const options=[{text:correctText,isCorrect:true},...distractorPool.slice(0,3).map(t=>({text:t,isCorrect:false}))];
    for(let i=options.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[options[i],options[j]]=[options[j],options[i]];}
    return options;}

  _renderQuizQ(idx){
    if(idx>=this.quizData.length)return this._renderQuizResult();
    const q=this.quizData[idx],progress=((idx)/this.quizData.length*100).toFixed(0),letters=['A','B','C','D'];
    const optionsHtml=q.options.map((opt,oi)=>`<button class="quiz-opt-btn" data-idx="${oi}" onclick="window._app._quizSelectOption(${idx},${oi})" ${q.answered?'disabled':''}><span class="quiz-opt-letter">${letters[oi]}</span><span class="quiz-opt-text">${this._esc(opt.text)}</span></button>`).join('');
    return `<div class="quiz-q-card" id="quizCard_${idx}"><div class="quiz-top-bar"><div class="quiz-progress-track"><div class="quiz-progress-fill" style="width:${progress}%"></div></div><div class="quiz-top-meta"><span class="quiz-q-counter">Q ${idx+1} / ${this.quizData.length}</span></div></div><div class="quiz-question-wrap"><div class="quiz-question-num">${idx+1}</div><div class="quiz-question-text">${this._esc(q.question)}</div></div><div class="quiz-options-grid" id="quizOpts_${idx}">${optionsHtml}</div><div class="quiz-answer-area" id="quizAnswerArea_${idx}" style="display:none"></div><div class="quiz-nav-area" id="quizNav_${idx}" style="display:none"><button class="quiz-nav-btn primary" onclick="window._app._quizAdvance(${idx})">${idx+1<this.quizData.length?'<i class="fas fa-arrow-right"></i> Next Question':'<i class="fas fa-flag-checkered"></i> See Results'}</button></div></div>`;}

  _quizSelectOption(qIdx,oIdx){const q=this.quizData[qIdx];if(q.answered)return;
    q.answered=true;q.selectedIdx=oIdx;q.correct=q.options[oIdx].isCorrect;
    if(q.correct){this.quizScore++;this._toast('success','fa-check-circle','✓ Correct!',2000);}
    else{this._toast('info','fa-book-open','✗ Check the answer below',2000);}
    const scoreNum=this._el('quizScoreNum');if(scoreNum)scoreNum.textContent=this.quizScore;
    const optsContainer=this._el(`quizOpts_${qIdx}`);
    if(optsContainer){optsContainer.querySelectorAll('.quiz-opt-btn').forEach((btn,oi)=>{btn.disabled=true;
      btn.classList.remove('selected','correct','wrong','dimmed');
      if(q.options[oi].isCorrect)btn.classList.add('correct');else if(oi===oIdx)btn.classList.add('wrong');else btn.classList.add('dimmed');});}
    const ansArea=this._el(`quizAnswerArea_${qIdx}`);
    if(ansArea){ansArea.style.display='block';
      ansArea.innerHTML=`<div class="quiz-explanation ${q.correct?'correct':'incorrect'}"><div class="quiz-exp-header"><i class="fas ${q.correct?'fa-check-circle':'fa-times-circle'}"></i><strong>${q.correct?'Correct!':'Incorrect'}</strong>${!q.correct?'<span style="font-weight:400;opacity:0.8"> — correct answer highlighted</span>':''}</div><div class="quiz-exp-body"><div class="quiz-exp-label">Full Explanation</div><div class="quiz-exp-text md-content">${this._renderMd(q.answer)}</div></div></div>`;
      setTimeout(()=>ansArea.scrollIntoView({behavior:'smooth',block:'nearest'}),100);}
    const navArea=this._el(`quizNav_${qIdx}`);if(navArea)navArea.style.display='flex';}

  _quizAdvance(idx){this.quizIdx=idx+1;const qb=this._el('quizBody');
    if(!qb)return;qb.innerHTML=this.quizIdx>=this.quizData.length?this._renderQuizResult():this._renderQuizQ(this.quizIdx);}

  _renderQuizResult(){const total=this.quizData.length,score=this.quizScore,pct=Math.round((score/total)*100);
    const grade=pct>=90?{emoji:'🏆',text:'Outstanding!',color:'var(--gold)'}:pct>=75?{emoji:'🎓',text:'Excellent!',color:'var(--em2)'}:pct>=60?{emoji:'📚',text:'Good Progress!',color:'var(--blue)'}:pct>=40?{emoji:'💪',text:'Keep Studying!',color:'var(--amber)'}:{emoji:'📖',text:'More Practice Needed',color:'var(--ruby2)'};
    const reviewHtml=this.quizData.map((q,i)=>{const letters=['A','B','C','D'],selOpt=q.selectedIdx>=0?q.options[q.selectedIdx]:null,corrOpt=q.options.find(o=>o.isCorrect);
      return`<div class="quiz-review-item ${q.correct?'correct':'incorrect'}"><div class="quiz-review-hdr"><span class="quiz-review-icon"><i class="fas ${q.correct?'fa-check-circle':'fa-times-circle'}"></i></span><span class="quiz-review-num">Q${i+1}</span><span class="quiz-review-q">${this._esc(q.question)}</span></div>${selOpt&&!q.correct?`<div class="quiz-review-your"><span class="quiz-review-label wrong">Your answer:</span> ${this._esc(selOpt.text)}</div>`:''}<div class="quiz-review-correct"><span class="quiz-review-label correct">Correct answer:</span> ${this._esc(corrOpt?.text||'')}</div></div>`;}).join('');
    return`<div class="quiz-result-wrap"><div class="quiz-result-score-wrap"><div class="quiz-result-emoji">${grade.emoji}</div><div class="quiz-result-big-score" style="color:${grade.color}">${score}<span class="quiz-result-denom"> / ${total}</span></div><div class="quiz-result-pct">${pct}% Correct</div><div class="quiz-result-grade" style="color:${grade.color}">${grade.text}</div></div><div class="quiz-result-stats"><div class="quiz-result-stat correct"><div class="quiz-result-stat-val">${score}</div><div class="quiz-result-stat-lbl"><i class="fas fa-check-circle"></i> Correct</div></div><div class="quiz-result-stat wrong"><div class="quiz-result-stat-val">${total-score}</div><div class="quiz-result-stat-lbl"><i class="fas fa-times-circle"></i> Incorrect</div></div><div class="quiz-result-stat total"><div class="quiz-result-stat-val">${total}</div><div class="quiz-result-stat-lbl"><i class="fas fa-list-ol"></i> Total</div></div></div><div class="quiz-result-actions"><button class="fc-btn primary" onclick="window._app._quizRestart()"><i class="fas fa-redo"></i> Try Again</button><button class="fc-btn" onclick="window._app._quizToggleReview()"><i class="fas fa-eye"></i> <span id="quizReviewToggleLabel">Show Review</span></button></div><div id="quizReviewSection" style="display:none;margin-top:20px"><div style="font-family:var(--fu);font-size:.75rem;color:var(--t3);text-transform:uppercase;letter-spacing:.08em;margin-bottom:12px;padding-bottom:8px;border-bottom:1px solid var(--b2)"><i class="fas fa-list-check"></i> Full Answer Review</div><div class="quiz-review-list">${reviewHtml}</div></div></div>`;}

  _quizToggleReview(){const section=this._el('quizReviewSection'),label=this._el('quizReviewToggleLabel');
    if(!section)return;const isHidden=section.style.display==='none';section.style.display=isHidden?'block':'none';
    if(label)label.textContent=isHidden?'Hide Review':'Show Review';}
  _quizRestart(){this.quizScore=0;this.quizIdx=0;this.quizData=this.quizData.map(q=>({...q,answered:false,correct:false,selectedIdx:-1}));
    const qb=this._el('quizBody');if(qb)qb.innerHTML=this._renderQuizQ(0);
    const scoreNum=this._el('quizScoreNum');if(scoreNum)scoreNum.textContent='0';}

  /* ═══════════════════════════════════════════════════════════════════════════
     TOOL 4 — SUMMARY HTML
     ═════════════════════════════════════════════════════════════════════════ */
  _buildSummaryHTML(data){let h='';
    if(data.ultra_long_notes){const paras=data.ultra_long_notes.split(/\n{2,}/).filter(p=>p.trim()&&!p.trim().startsWith('#')).slice(0,3),tldr=paras.join('\n\n');
      h+=`<div class="study-sec section-anchor" id="sec-tldr"><div class="ss-hdr"><div class="ss-title"><i class="fas fa-bolt"></i> TL;DR — Executive Summary</div><button class="ss-copy-btn" onclick="window._app._copySection(${JSON.stringify(this._stripMd(tldr))})"><i class="fas fa-copy"></i> Copy</button></div><div class="ss-body"><div class="summary-tldr-box"><div class="summary-tldr-icon"><i class="fas fa-align-left"></i></div><div class="summary-tldr-content md-content">${this._renderMd(tldr)}</div></div></div></div>`;
      h+=`<div class="study-sec section-anchor" id="sec-notes"><div class="ss-hdr"><div class="ss-title"><i class="fas fa-book-open"></i> Full Summary Notes</div><button class="ss-copy-btn" onclick="window._app._copySection(${JSON.stringify(this._stripMd(data.ultra_long_notes))})"><i class="fas fa-copy"></i> Copy</button></div><div class="ss-body"><div class="md-content">${this._renderMd(data.ultra_long_notes)}</div></div></div>`;}
    if(data.key_concepts?.length){const items=data.key_concepts.map((c,i)=>`<div class="summary-point"><div class="summary-point-num">${i+1}</div><div class="summary-point-text">${this._esc(c)}</div></div>`).join('');
      h+=`<div class="study-sec section-anchor" id="sec-concepts"><div class="ss-hdr"><div class="ss-title"><i class="fas fa-list-check"></i> Key Points at a Glance</div></div><div class="ss-body"><div class="summary-points-list">${items}</div></div></div>`;}
    return h||this._buildNotesHTML(data);}

  /* ═══════════════════════════════════════════════════════════════════════════
     TOOL 5 — MIND MAP HTML + SVG
     ═════════════════════════════════════════════════════════════════════════ */
  _buildMindmapHTML(data){
    const topic=data.topic||'Topic';let mm=data.mind_map;
    if(!mm||!mm.branches?.length){mm=this._buildFallbackMindMapData(data);}
    const svg=this._buildMindmapSVG(mm);
    const downloadBtn=`<button class="fc-btn" onclick="window._app._downloadSVG()" style="margin-top:12px"><i class="fas fa-download"></i> Download SVG</button>`;
    const notesSection=data.ultra_long_notes?`<div class="study-sec section-anchor" id="sec-notes" style="margin-top:16px"><div class="ss-hdr"><div class="ss-title"><i class="fas fa-book-open"></i> Full Study Notes</div></div><div class="ss-body"><div class="md-content">${this._renderMd(data.ultra_long_notes)}</div></div></div>`:'';
    return `<div class="study-sec section-anchor" id="sec-mindmap"><div class="ss-hdr"><div class="ss-title"><i class="fas fa-project-diagram"></i> Visual Mind Map</div></div><div class="ss-body"><div class="mm-svg-container" id="mmSvgContainer" style="overflow:hidden;border:1px solid var(--b2);border-radius:12px;background:var(--bg3)">${svg}</div>${downloadBtn}<div class="mm-text-outline" style="margin-top:16px;font-family:var(--fb);font-size:.88rem;color:var(--t2);line-height:1.7">${mm.branches.map(b=>`<strong style="color:${b.color}">${this._esc(b.label)}:</strong> ${b.children.map(c=>this._esc(c)).join(' · ')}`).join('<br>')}</div></div></div>${notesSection}`;}

  _buildMindmapSVG(mm){
    const W=900,H=640,cx=W/2,cy=H/2,branches=mm.branches||[],center=mm.center||'Topic';
    let svg=`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" width="100%" height="100%" style="max-width:900px">`;
    // Background
    svg+=`<rect width="${W}" height="${H}" fill="var(--bg3, #131325)" rx="12"/>`;
    // Center node
    svg+=`<circle cx="${cx}" cy="${cy}" r="55" fill="url(#centerGrad)" stroke="#C9A96E" stroke-width="2.5" filter="url(#glow)"/><text x="${cx}" y="${cy}" text-anchor="middle" dominant-baseline="central" fill="#02020A" font-family="'Playfair Display',Georgia,serif" font-size="14" font-weight="700">${this._esc(this._wrapText(center,20))}</text>`;
    // Gradients and filters
    svg+=`<defs><radialGradient id="centerGrad"><stop offset="0%" stop-color="#EDD4A8"/><stop offset="100%" stop-color="#C9A96E"/></radialGradient><filter id="glow"><feGaussianBlur stdDeviation="4" result="blur"/><feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge></filter></defs>`;
    // Branches
    const n=branches.length;const dist=n<=5?170:n<=6?155:140;
    branches.forEach((b,i)=>{
      const angle=(-Math.PI/2)+(2*Math.PI*i/n);
      const bx=cx+dist*Math.cos(angle),by=cy+dist*Math.sin(angle);
      // Connection line
      svg+=`<path d="M${cx},${cy} Q${(cx+bx)/2},${(cy+by)/2-20} ${bx},${by}" fill="none" stroke="${b.color||'#C9A96E'}" stroke-width="2" opacity="0.6"/>`;
      // Branch node
      svg+=`<rect x="${bx-55}" y="${by-18}" width="110" height="36" rx="8" fill="${b.color||'#4F9CF9'}" opacity="0.9"/><text x="${bx}" y="${by+4}" text-anchor="middle" fill="#fff" font-family="'DM Sans',sans-serif" font-size="11" font-weight="600">${this._esc(b.label?.slice(0,20)||'')}</text>`;
      // Children
      (b.children||[]).forEach((child,j)=>{
        const ca=angle-0.35+(j*0.35);
        const childDist=dist+80+j*15;
        const chx=cx+childDist*Math.cos(ca),chy=cy+childDist*Math.sin(ca);
        svg+=`<line x1="${bx}" y1="${by}" x2="${chx}" y2="${chy}" stroke="${b.color||'#4F9CF9'}" stroke-width="1" opacity="0.3"/>`;
        svg+=`<rect x="${chx-48}" y="${chy-12}" width="96" height="24" rx="6" fill="${b.color||'#4F9CF9'}" opacity="0.15"/><text x="${chx}" y="${chy+4}" text-anchor="middle" fill="var(--t1, #F0EBE0)" font-family="'DM Sans',sans-serif" font-size="9">${this._esc((child||'').slice(0,18))}</text>`;
      });
    });
    svg+='</svg>';this._currentSVG=svg;return svg;}

  _wrapText(text,maxChars){if(!text||text.length<=maxChars)return text;
    const mid=Math.floor(maxChars/2);return text.slice(0,mid)+'…';}

  _buildFallbackMindMapData(data){
    return{center:data.topic||'Study Topic',branches:[
      {label:'Core Concepts',color:'#4F9CF9',children:data.key_concepts?.slice(0,3).map(c=>c.split(':')[0]?.slice(0,30))||['Concept 1','Concept 2','Concept 3']},
      {label:'Applications',color:'#42C98A',children:data.real_world_applications?.slice(0,3).map(a=>a.split(':')[0]?.slice(0,30))||['App 1','App 2','App 3']},
      {label:'Key Tricks',color:'#F59E0B',children:data.key_tricks?.slice(0,3).map(t=>t.split('.')[0]?.slice(0,30))||['Trick 1','Trick 2','Trick 3']},
      {label:'Practice',color:'#A855F7',children:data.practice_questions?.slice(0,3).map(q=>q.question?.slice(0,30))||['Q1','Q2','Q3']},
      {label:'Watch Out',color:'#EF4444',children:data.common_misconceptions?.slice(0,3).map(m=>m.split('.')[0]?.slice(0,30))||['Mistake 1','Mistake 2','Mistake 3']},
    ]};}

  _downloadSVG(){if(!this._currentSVG)return;
    const blob=new Blob([this._currentSVG],{type:'image/svg+xml'});
    const url=URL.createObjectURL(blob);const a=document.createElement('a');a.href=url;a.download=`mindmap-${Date.now()}.svg`;
    document.body.appendChild(a);a.click();document.body.removeChild(a);URL.revokeObjectURL(url);
    this._toast('success','fa-download','SVG downloaded!');}

  /* ═══════════════════════════════════════════════════════════════════════════
     DASHBOARD
     ═════════════════════════════════════════════════════════════════════════ */
  _toggleDashboard(){this.showDashboard=!this.showDashboard;this._renderDashboard();}

  _renderDashboard(){
    const area=this._el('resultArea');if(!area)return;
    if(!this.showDashboard){
      if(this.currentData){area.innerHTML=this._buildResultHTML(this.currentData);area.style.display='block';}
      else{area.style.display='none';const es=this._el('emptyState');if(es)es.style.display='flex';}
      return;
    }
    const empty=this._el('emptyState'),thinking=this._el('thinkingWrap');
    if(empty)empty.style.display='none';if(thinking)thinking.style.display='none';
    area.style.display='block';
    const totalWords=this.history.reduce((a,h)=>a+this._wordCount(this._stripMd(h.data?.ultra_long_notes||'')),0);
    const toolCounts={notes:0,flashcards:0,quiz:0,summary:0,mindmap:0};
    this.history.forEach(h=>{if(toolCounts[h.tool]!==undefined)toolCounts[h.tool]++;});
    const maxTool=Math.max(1,...Object.values(toolCounts));
    const toolNames={notes:'Notes',flashcards:'Flashcards',quiz:'Quiz',summary:'Summary',mindmap:'Mind Map'};
    const toolIcons={notes:'fa-book-open',flashcards:'fa-layer-group',quiz:'fa-question-circle',summary:'fa-align-left',mindmap:'fa-project-diagram'};
    const toolColors=['var(--gold)','var(--em2)','var(--blue)','var(--amber)','#A855F7'];
    const toolBars=Object.entries(toolCounts).map(([tool,count],i)=>`<div class="dash-tool-row"><div class="dash-tool-label"><i class="fas ${toolIcons[tool]}" style="color:${toolColors[i]}"></i> ${toolNames[tool]}</div><div class="dash-tool-bar-wrap"><div class="dash-tool-bar dash-donut-bar" data-pct="${(count/maxTool*100).toFixed(0)}" style="width:0%;background:${toolColors[i]}"></div></div><span class="dash-tool-count">${count}</span></div>`).join('');

    const recentItems=this.history.slice(0,5).map(h=>`<div class="dash-recent-item" onclick="window._app._loadHistory('${h.id}')" role="button" tabindex="0"><i class="fas ${toolIcons[h.tool]||'fa-book'} dash-recent-icon"></i><div class="dash-recent-info"><div class="dash-recent-topic">${this._esc((h.topic||'').slice(0,50))}</div><div class="dash-recent-meta">${this._relTime(h.ts)} · ${toolNames[h.tool]||h.tool}</div></div></div>`).join('')||'<div style="color:var(--t4);font-style:italic;padding:8px">No recent activity</div>';

    const savedItems=this.saved.slice(0,4).map(s=>`<div class="dash-saved-card" onclick="window._app._loadSaved('${s.id}')" role="button" tabindex="0"><i class="fas ${toolIcons[s.tool]||'fa-star'}"></i><div>${this._esc((s.topic||'').slice(0,30))}</div></div>`).join('')||'<div style="color:var(--t4);font-style:italic">No saved notes yet</div>';

    const streakDays=this._calculateStreak();
    const streakHtml=streakDays>0?`<div class="dash-streak-banner"><span>🔥</span> <strong>${streakDays}-day study streak!</strong> Keep going!</div>`:'';

    area.innerHTML=`<div class="dash-wrap">
      <div class="dash-greeting"><span id="dashGreetingEmoji">📚</span> ${this.userName?'Welcome back, '+this._esc(this.userName)+'!':'Hello, Scholar!'}<br><span style="font-size:.9rem;color:var(--t3);font-weight:400">${new Date().toLocaleDateString('en-GB',{weekday:'long',day:'numeric',month:'long',year:'numeric'})}</span></div>
      ${streakHtml}
      <div class="dash-stats-grid">
        <div class="dash-stat-card"><div class="dash-stat-val">${this.sessions}</div><div class="dash-stat-lbl"><i class="fas fa-chart-line"></i> Sessions</div></div>
        <div class="dash-stat-card"><div class="dash-stat-val">${this.history.length}</div><div class="dash-stat-lbl"><i class="fas fa-history"></i> Generated</div></div>
        <div class="dash-stat-card"><div class="dash-stat-val">${this.saved.length}</div><div class="dash-stat-lbl"><i class="fas fa-star"></i> Saved</div></div>
        <div class="dash-stat-card"><div class="dash-stat-val">${totalWords.toLocaleString()}</div><div class="dash-stat-lbl"><i class="fas fa-file-word"></i> Words</div></div>
        <div class="dash-stat-card"><div class="dash-stat-val">${streakDays}</div><div class="dash-stat-lbl"><i class="fas fa-fire"></i> Day Streak</div></div>
        <div class="dash-stat-card"><div class="dash-stat-val">${Math.round(JSON.stringify(this.history).length/1024)}KB</div><div class="dash-stat-lbl"><i class="fas fa-database"></i> Storage</div></div>
      </div>
      <div class="dash-main-grid">
        <div class="dash-section"><div class="dash-section-title"><i class="fas fa-clock"></i> Recent Activity</div><div class="dash-recent-list">${recentItems}</div></div>
        <div class="dash-section"><div class="dash-section-title"><i class="fas fa-chart-bar"></i> Tool Usage</div><div class="dash-tool-bars">${toolBars}</div></div>
      </div>
      <div class="dash-section"><div class="dash-section-title"><i class="fas fa-star"></i> Saved Notes</div><div class="dash-saved-grid">${savedItems}</div></div>
      <div style="text-align:center;margin-top:20px"><button class="btn btn-primary" id="dashStartBtn"><i class="fas fa-pen"></i> Start Studying</button></div>
      <div style="text-align:center;margin-top:12px;font-family:var(--fm);font-size:.65rem;color:var(--t4)">${SAVOIRÉ.BRAND} · ${SAVOIRÉ.DEVELOPER} · Free forever</div>
    </div>`;
    setTimeout(()=>this._animateDashboardBars(),200);}

  _animateDashboardBars(){
    this._qsa('.dash-donut-bar').forEach((bar,i)=>{
      const pct=parseFloat(bar.dataset.pct)||0;setTimeout(()=>{bar.style.width=pct+'%';},i*100);});}

  /* ═══════════════════════════════════════════════════════════════════════════
     PDF — WORLD-CLASS jsPDF
     ═════════════════════════════════════════════════════════════════════════ */
  async _downloadPDF(){
    const data=this.currentData;if(!data){this._toast('info','fa-info-circle','Generate content first.');return;}
    if(!window.jspdf?.jsPDF){this._toast('error','fa-times','PDF library not loaded.');return;}
    this._toast('info','fa-spinner','Generating PDF…');
    try{const{jsPDF}=window.jspdf;const doc=new jsPDF({unit:'mm',format:'a4',compress:true});
      const pw=210,ph=297,ml=16,mr=16,mt=40,mb=24,cw=pw-ml-mr;let y=mt,pageNum=1;
      const GOLD=[201,169,110],DARK=[18,12,4],MID=[55,48,38],GREEN=[38,140,88],RED=[180,40,40],BLUE=[50,100,200],CREAM=[250,246,238];
      const drawPageHeader=()=>{doc.setFillColor(12,10,6);doc.rect(0,0,pw,28,'F');doc.setFillColor(...GOLD);doc.rect(0,0,pw,3,'F');
        doc.setFillColor(...GOLD);doc.rect(ml,8,3,16,'F');doc.setFontSize(11);doc.setFont('helvetica','bold');doc.setTextColor(...GOLD);
        doc.text('SAVOIRÉ AI',ml+7,16);doc.setFontSize(7);doc.setFont('helvetica','normal');doc.setTextColor(160,130,80);
        doc.text('v3.0',ml+7+doc.getTextWidth('SAVOIRÉ AI')+2,16);doc.setFontSize(7.5);doc.setFont('helvetica','bold');doc.setTextColor(...GOLD);
        doc.text('savoireai.vercel.app',pw-mr,15,{align:'right'});doc.setFontSize(6.5);doc.setFont('helvetica','normal');doc.setTextColor(130,105,65);
        doc.text('Sooban Talha Technologies · soobantalhatech.xyz',pw-mr,21,{align:'right'});doc.setDrawColor(...GOLD);doc.setLineWidth(0.6);doc.line(0,28,pw,28);
        doc.setFillColor(255,250,238);doc.rect(0,28,pw,6,'F');y=mt;};
      const drawPageFooter=(pg,total)=>{const fy=ph-12;doc.setFillColor(245,240,230);doc.rect(0,fy-3,pw,15,'F');
        doc.setDrawColor(...GOLD);doc.setLineWidth(0.5);doc.line(0,fy-3,pw,fy-3);doc.setFontSize(6.5);doc.setFont('helvetica','normal');
        doc.setTextColor(155,140,118);doc.text(`${SAVOIRÉ.BRAND} · ${SAVOIRÉ.DEVELOPER}`,ml,fy+1);
        const ps=`${pg} / ${total}`;doc.setFillColor(...GOLD);const psW=doc.getTextWidth(ps)+6;
        doc.rect(pw-mr-psW,fy-1.5,psW+2,5.5,'F');doc.setFontSize(7);doc.setFont('helvetica','bold');doc.setTextColor(12,8,2);
        doc.text(ps,pw-mr+1,fy+2.2,{align:'right'});};
      const checkSpace=(needed=14)=>{if(y+needed>ph-mb){doc.addPage();pageNum++;drawPageHeader();}};
      const writeText=(text,fs,bold,color,indent=0,lh=1.6)=>{if(!text)return 0;
        const clean=this._stripMd(String(text));if(!clean)return 0;doc.setFontSize(fs);doc.setFont('helvetica',bold?'bold':'normal');
        doc.setTextColor(...color);const lineH=fs*0.352*lh;const lines=doc.splitTextToSize(clean,cw-indent);let used=0;
        lines.forEach(line=>{checkSpace(lineH+1);doc.text(line,ml+indent,y);y+=lineH;used+=lineH;});return used;};
      const sectionHeading=(title,accent=GOLD,bg=CREAM,icon='▶')=>{checkSpace(22);y+=4;
        doc.setFillColor(...bg);doc.rect(ml-2,y-5.5,cw+4,12,'F');doc.setFillColor(...accent);doc.rect(ml-2,y-5.5,4.5,12,'F');
        doc.setFontSize(8);doc.setFont('helvetica','bold');doc.setTextColor(255,255,255);doc.text(icon,ml-0.5,y+1,{align:'center'});
        doc.setFontSize(9.5);doc.setFont('helvetica','bold');doc.setTextColor(...DARK);doc.text(title.toUpperCase(),ml+7,y+1);y+=9;};

      drawPageHeader();
      // Title block
      checkSpace(50);doc.setFillColor(...CREAM);doc.roundedRect(ml-2,y-4,cw+4,42,3,3,'F');doc.setFillColor(...GOLD);doc.roundedRect(ml-2,y-4,cw+4,3.5,2,2,'F');
      doc.setFontSize(22);doc.setFont('helvetica','bold');doc.setTextColor(...DARK);
      const titleLines=doc.splitTextToSize(this._stripMd(data.topic||'Study Notes'),cw-8);let titleY=y+6;
      titleLines.forEach(l=>{doc.text(l,ml+4,titleY);titleY+=9;});y=Math.max(titleY,y+14);
      const toolName=TOOL_CONFIG[this.tool]?.sfpName||'Study Notes';const toolW=doc.getTextWidth(toolName)+10;
      doc.setFillColor(...GOLD);doc.roundedRect(ml+4,y,toolW,6,3,3,'F');doc.setFontSize(7);doc.setFont('helvetica','bold');
      doc.setTextColor(12,8,2);doc.text(toolName.toUpperCase(),ml+4+toolW/2,y+4.2,{align:'center'});y+=10;
      doc.setFontSize(8);doc.setFont('helvetica','normal');doc.setTextColor(100,88,72);
      doc.text(`${data.curriculum_alignment||'General Study'} · ${data._language||'English'} · Score: ${data.study_score||96}/100 · ${new Date().toLocaleDateString()}`,ml+4,y);y+=6;
      doc.setDrawColor(...GOLD);doc.setLineWidth(0.8);doc.line(ml,y,pw-mr,y);y+=10;

      // Notes
      if(data.ultra_long_notes){sectionHeading('Comprehensive Analysis',GOLD,CREAM,'≡');
        const paragraphs=this._stripMd(data.ultra_long_notes).split('\n\n').filter(Boolean);
        paragraphs.forEach(para=>{const t=para.trim();if(!t)return;
          if(/^#{1,4} /.test(t)){const ht=t.replace(/^#+\s*/,'');checkSpace(12);y+=3;writeText(ht,11,true,GOLD,0,1.3);y+=1;}
          else if(t.startsWith('- ')||t.startsWith('* ')){t.split('\n').filter(Boolean).forEach(item=>{checkSpace(6);writeText('• '+item.replace(/^[-*]\s+/,''),9.5,false,DARK,6,1.5);});}
          else{writeText(t,9.5,false,DARK,0,1.65);y+=2.5;}});y+=6;}

      // Key Concepts
      if(data.key_concepts?.length){sectionHeading('Key Concepts',GOLD,CREAM,'●');
        data.key_concepts.forEach((c,i)=>{checkSpace(18);doc.setFillColor(...GOLD);doc.circle(ml+5,y+0.5,4,'F');
          doc.setFontSize(7.5);doc.setFont('helvetica','bold');doc.setTextColor(255,255,255);doc.text(String(i+1),ml+5,y+1.8,{align:'center'});
          const lines=doc.splitTextToSize(this._stripMd(c),cw-16);let ly=y;doc.setFontSize(9.5);doc.setFont('helvetica','normal');doc.setTextColor(...DARK);
          lines.forEach((l,li)=>{if(li>0)checkSpace(5);doc.text(l,ml+14,ly+1.5);ly+=4.8;});y=ly+4;});y+=5;}

      // Practice Questions
      if(data.practice_questions?.length){sectionHeading('Practice Questions',GREEN,[236,252,244],'?');
        data.practice_questions.forEach((qa,i)=>{const qClean=this._stripMd(qa.question||''),aClean=this._stripMd(qa.answer||'');
          const qLines=doc.splitTextToSize(`Q${i+1}: ${qClean}`,cw-10),qH=qLines.length*4.8+10;checkSpace(qH+4);
          doc.setFillColor(248,244,236);doc.roundedRect(ml,y-3,cw,qH,2,2,'F');doc.setFillColor(...GOLD);doc.rect(ml,y-3,4,qH,'F');
          doc.setFontSize(7);doc.setFont('helvetica','bold');doc.setTextColor(255,255,255);doc.text('Q',ml+2,y+1.5,{align:'center'});
          doc.setFontSize(9.5);doc.setFont('helvetica','bold');doc.setTextColor(...DARK);let qLineY=y;
          qLines.forEach((l,li)=>{if(li>0)checkSpace(5);doc.text(l,ml+8,qLineY+1.5);qLineY+=4.8;});y=qLineY+2;
          // Answer box
          const aLines=doc.splitTextToSize(aClean,cw-14),boxH=aLines.length*4.8+12;checkSpace(boxH+5);
          doc.setFillColor(236,252,244);doc.roundedRect(ml,y-3,cw,boxH,2,2,'F');doc.setFillColor(...GREEN);doc.rect(ml,y-3,3,boxH,'F');
          doc.setFontSize(7);doc.setFont('helvetica','bold');doc.setTextColor(...GREEN);doc.text('ANSWER',ml+7,y+2);y+=6;
          doc.setFontSize(9.5);doc.setFont('helvetica','normal');doc.setTextColor(...MID);
          aLines.forEach(l=>{checkSpace(5);doc.text(l,ml+7,y);y+=4.8;});y+=4;});y+=3;}

      // Final branding
      checkSpace(32);y+=8;doc.setFillColor(18,12,4);doc.roundedRect(ml-2,y-2,cw+4,22,3,3,'F');doc.setFillColor(...GOLD);doc.rect(ml-2,y-2,4,22,'F');
      doc.setFontSize(11);doc.setFont('helvetica','bold');doc.setTextColor(...GOLD);doc.text('SAVOIRÉ AI v3.0',ml+8,y+5);
      doc.setFontSize(8.5);doc.setFont('helvetica','normal');doc.setTextColor(160,135,90);doc.text('Think Less. Know More. — Free for every student on Earth.',ml+8,y+10.5);
      doc.setFontSize(7.5);doc.setTextColor(120,100,68);doc.text(`${SAVOIRÉ.DEVELOPER} · ${SAVOIRÉ.DEVSITE} · Founder: ${SAVOIRÉ.FOUNDER}`,ml+8,y+16);

      const totalPages=doc.internal.getNumberOfPages();
      for(let p=1;p<=totalPages;p++){doc.setPage(p);drawPageFooter(p,totalPages);}
      const safeTopic=(data.topic||'Notes').replace(/[^a-zA-Z0-9\s]/g,'').replace(/\s+/g,'_').slice(0,50);
      doc.save(`SavoireAI_${safeTopic}_${new Date().toISOString().slice(0,10)}.pdf`);
      this._toast('success','fa-file-pdf','PDF downloaded!');}catch(err){this._toast('error','fa-times','PDF generation failed.');}
  }

  /* ═══════════════════════════════════════════════════════════════════════════
     COPY / SAVE / SHARE / CLEAR
     ═════════════════════════════════════════════════════════════════════════ */
  _copyResult(){const data=this.currentData;if(!data){this._toast('info','fa-info-circle','Nothing to copy.');return;}
    const parts=[];if(data.topic)parts.push(`# ${data.topic}\n`);
    if(data.ultra_long_notes)parts.push(this._stripMd(data.ultra_long_notes));
    if(data.key_concepts?.length){parts.push('\n\n## Key Concepts\n');data.key_concepts.forEach((c,i)=>parts.push(`${i+1}. ${c}`));}
    if(data.key_tricks?.length){parts.push('\n\n## Study Tricks\n');data.key_tricks.forEach((t,i)=>parts.push(`${i+1}. ${t}`));}
    if(data.practice_questions?.length){parts.push('\n\n## Practice Questions\n');data.practice_questions.forEach((qa,i)=>{parts.push(`Q${i+1}: ${qa.question}`);parts.push(`A: ${this._stripMd(qa.answer)}\n`);});}
    if(data.real_world_applications?.length){parts.push('\n\n## Real-World Applications\n');data.real_world_applications.forEach((a,i)=>parts.push(`${i+1}. ${a}`));}
    if(data.common_misconceptions?.length){parts.push('\n\n## Common Misconceptions\n');data.common_misconceptions.forEach((m,i)=>parts.push(`${i+1}. ${m}`));}
    parts.push(`\n\n---\nGenerated by ${SAVOIRÉ.BRAND} — ${SAVOIRÉ.WEBSITE}`);
    const text=parts.join('\n');
    navigator.clipboard.writeText(text).then(()=>this._toast('success','fa-check','Copied!')).catch(()=>{const ta=document.createElement('textarea');ta.value=text;document.body.appendChild(ta);ta.select();document.execCommand('copy');document.body.removeChild(ta);this._toast('success','fa-check','Copied!');});}

  _copySection(text){navigator.clipboard.writeText(text).then(()=>this._toast('success','fa-check','Copied!')).catch(()=>this._toast('error','fa-times','Copy failed.'));}

  _saveNote(){const data=this.currentData;if(!data){this._toast('info','fa-info-circle','Nothing to save.');return;}
    const existing=this.saved.find(s=>s.topic===data.topic&&s.tool===this.tool);
    if(existing){this._toast('info','fa-star','Already saved!');return;}
    if(this.saved.length>=SAVOIRÉ.MAX_SAVED){this._toast('error','fa-archive','Library full.');return;}
    const note={id:this._genId(),topic:data.topic||'Untitled',tool:this.tool,data,savedAt:Date.now()};
    this.saved.unshift(note);this._save('sv_saved',this.saved);this._updateHeaderStats();
    this._toast('success','fa-star',`Saved: "${note.topic.slice(0,40)}"!`);}

  _shareResult(){const data=this.currentData;if(!data){this._toast('info','fa-info-circle','Nothing to share.');return;}
    const shareData={title:`${data.topic||'Study Notes'} — Savoiré AI`,text:`Check out my study notes on "${data.topic}"!`,url:`https://${SAVOIRÉ.WEBSITE}`};
    if(navigator.share){navigator.share(shareData).catch(()=>{});}else{navigator.clipboard.writeText(shareData.url).then(()=>this._toast('success','fa-link','Link copied!'));}}

  _clearOutput(){if(!this.currentData)return;this._confirm('Clear current output?',()=>{this.currentData=null;this._showState('empty');this.fcCards=[];this.quizData=[];this._toast('info','fa-trash','Cleared.');});}

  /* ═══════════════════════════════════════════════════════════════════════════
     HISTORY & SAVED
     ═════════════════════════════════════════════════════════════════════════ */
  _addToHistory(item){this.history=this.history.filter(h=>!(h.topic===item.topic&&h.tool===item.tool));
    this.history.unshift(item);if(this.history.length>SAVOIRÉ.MAX_HISTORY)this.history=this.history.slice(0,SAVOIRÉ.MAX_HISTORY);
    this._save('sv_history',this.history);this._renderSbHistory();this._updateHistBadge();}

  _renderSbHistory(){const list=this._el('lpHistList');if(!list)return;
    if(!this.history.length){list.innerHTML='<div class="lp-hist-empty">No history yet.</div>';return;}
    const ICONS={notes:'fa-book-open',flashcards:'fa-layer-group',quiz:'fa-question-circle',summary:'fa-align-left',mindmap:'fa-project-diagram'};
    list.innerHTML=this.history.slice(0,6).map(h=>`<div class="lp-hist-item" onclick="window._app._loadHistoryItem('${h.id}')" role="listitem" tabindex="0" onkeydown="if(event.key==='Enter')window._app._loadHistoryItem('${h.id}')"><i class="fas ${ICONS[h.tool]||'fa-book'} lp-hist-icon"></i><div class="lp-hist-topic">${this._esc((h.topic||'').slice(0,32))}</div><div class="lp-hist-time">${this._relTime(h.ts)}</div></div>`).join('');}

  _openHistModal(){this._renderHistModal();this._openModal('histModal');}
  _filterHist(query){const active=this._qs('.hf.active')?.dataset?.filter||'all';this._renderHistModal(active,query);}

  _renderHistModal(filter='all',query=''){
    const list=this._el('histList'),empty=this._el('histEmpty');if(!list)return;
    const ICONS={notes:'fa-book-open',flashcards:'fa-layer-group',quiz:'fa-question-circle',summary:'fa-align-left',mindmap:'fa-project-diagram'};
    let filtered=this.history;if(filter!=='all')filtered=filtered.filter(h=>h.tool===filter);
    if(query)filtered=filtered.filter(h=>(h.topic||'').toLowerCase().includes(query.toLowerCase()));
    if(!filtered.length){list.innerHTML='';if(empty)empty.style.display='flex';return;}if(empty)empty.style.display='none';
    const groups={};filtered.forEach(h=>{const g=this._dateGroup(h.ts);if(!groups[g])groups[g]=[];groups[g].push(h);});
    const hl=(text,q)=>{if(!q)return this._esc(text||'');const regex=new RegExp(`(${q.replace(/[.*+?^${}()|[\]\\]/g,'\\$&')})`,'gi');
      return this._esc(text||'').replace(regex,'<mark style="background:rgba(201,169,110,.25);border-radius:2px">$1</mark>');};
    list.innerHTML=Object.entries(groups).map(([group,items])=>`<div class="hist-group-lbl">${group}</div>${items.map(h=>{const topicHl=hl((h.topic||'').slice(0,90),query);
      return`<div class="hist-item" onclick="window._app._loadHistory('${h.id}')" role="listitem" tabindex="0" onkeydown="if(event.key==='Enter')window._app._loadHistory('${h.id}')"><div class="hist-tool-av"><i class="fas ${ICONS[h.tool]||'fa-book'}"></i></div><div class="hist-info"><div class="hist-topic">${topicHl}</div><div class="hist-meta"><span class="hist-tag">${h.tool}</span><span class="hist-time">${this._relTime(h.ts)}</span></div></div><div class="hist-acts"><button class="hist-del" onclick="event.stopPropagation();window._app._deleteHistory('${h.id}')" title="Delete"><i class="fas fa-trash"></i></button></div></div>`;}).join('')}`).join('');}

  _loadHistory(id){const h=this.history.find(x=>x.id===id);if(!h?.data)return;this._closeModal('histModal');
    this.currentData=h.data;this.tool=h.tool||'notes';this._setTool(this.tool);this._renderResult(h.data);}
  _loadHistoryItem(id){this._loadHistory(id);}
  _deleteHistory(id){this.history=this.history.filter(x=>x.id!==id);this._save('sv_history',this.history);
    this._updateHistBadge();this._renderSbHistory();this._updateHeaderStats();
    this._renderHistModal(this._qs('.hf.active')?.dataset?.filter||'all',this._el('histSearchInput')?.value||'');}

  _openSavedModal(){this._renderSavedModal();this._openModal('savedModal');}
  _renderSavedModal(){const list=this._el('savedList'),empty=this._el('savedEmpty'),cnt=this._el('savedCount');
    if(!list)return;if(cnt)cnt.textContent=`${this.saved.length} note${this.saved.length!==1?'s':''}`;
    if(!this.saved.length){list.innerHTML='';if(empty)empty.style.display='flex';return;}if(empty)empty.style.display='none';
    const ICONS={notes:'fa-book-open',flashcards:'fa-layer-group',quiz:'fa-question-circle',summary:'fa-align-left',mindmap:'fa-project-diagram'};
    list.innerHTML=this.saved.map(s=>`<div class="hist-item" onclick="window._app._loadSaved('${s.id}')" role="listitem" tabindex="0" onkeydown="if(event.key==='Enter')window._app._loadSaved('${s.id}')"><div class="hist-tool-av"><i class="fas ${ICONS[s.tool]||'fa-star'}"></i></div><div class="hist-info"><div class="hist-topic">${this._esc((s.topic||'').slice(0,90))}</div><div class="hist-meta"><span class="hist-tag">${s.tool}</span><span class="hist-time">Saved ${this._relTime(s.savedAt)}</span></div></div><div class="hist-acts"><button class="hist-del" onclick="event.stopPropagation();window._app._deleteSaved('${s.id}')" title="Delete"><i class="fas fa-trash"></i></button></div></div>`).join('');}
  _loadSaved(id){const s=this.saved.find(x=>x.id===id);if(!s?.data)return;this._closeModal('savedModal');
    this.currentData=s.data;this.tool=s.tool||'notes';this._setTool(this.tool);this._renderResult(s.data);}
  _deleteSaved(id){this.saved=this.saved.filter(x=>x.id!==id);this._save('sv_saved',this.saved);this._updateHeaderStats();this._renderSavedModal();}

  /* ═══════════════════════════════════════════════════════════════════════════
     SETTINGS
     ═════════════════════════════════════════════════════════════════════════ */
  _openSettingsModal(){
    const ni=this._el('nameInput');if(ni)ni.value=this.userName;
    const theme=document.documentElement.dataset.theme||'dark';
    this._qsa('[data-theme-btn]').forEach(b=>{b.classList.toggle('active',b.dataset.themeBtn===theme);});
    const fs=document.documentElement.dataset.font||'medium';
    this._qsa('.font-sz').forEach(b=>{b.classList.toggle('active',b.dataset.size===fs);});
    const ds=this._el('dsStats');if(ds){
      const histSize=JSON.stringify(this.history).length,savedSize=JSON.stringify(this.saved).length,totalKB=Math.round((histSize+savedSize)/1024);
      const wordsGen=this.history.reduce((a,h)=>a+this._wordCount(this._stripMd(h.data?.ultra_long_notes||'')),0);
      ds.innerHTML=`<div class="ds-stat"><span class="ds-val">${this.history.length}</span><div class="ds-lbl">History</div></div><div class="ds-stat"><span class="ds-val">${this.saved.length}</span><div class="ds-lbl">Saved</div></div><div class="ds-stat"><span class="ds-val">${this.sessions}</span><div class="ds-lbl">Sessions</div></div><div class="ds-stat"><span class="ds-val">${totalKB}KB</span><div class="ds-lbl">Storage</div></div><div class="ds-stat"><span class="ds-val">${wordsGen.toLocaleString()}</span><div class="ds-lbl">Words</div></div><div class="ds-stat"><span class="ds-val" style="font-size:.8rem">${this.history[0]?this._relTime(this.history[0].ts):'—'}</span><div class="ds-lbl">Last Study</div></div>`;}
    this._openModal('settingsModal');}
  _saveName(){const inp=this._el('nameInput'),name=inp?.value?.trim();if(!name||name.length<2){this._toast('error','fa-times','Name too short.');return;}
    this.userName=name;localStorage.setItem('sv_user',name);this._updateUserUI();this._toast('success','fa-check','Name updated!');}
  _exportDataJson(){const obj={exported:new Date().toISOString(),app:SAVOIRÉ.BRAND,developer:SAVOIRÉ.DEVELOPER,website:SAVOIRÉ.WEBSITE,devsite:SAVOIRÉ.DEVSITE,founder:SAVOIRÉ.FOUNDER,userName:this.userName,sessions:this.sessions,history:this.history,saved:this.saved,preferences:this.prefs};
    const blob=new Blob([JSON.stringify(obj,null,2)],{type:'application/json'});const url=URL.createObjectURL(blob);const a=document.createElement('a');a.href=url;a.download=`savoire-ai-data-${Date.now()}.json`;document.body.appendChild(a);a.click();document.body.removeChild(a);URL.revokeObjectURL(url);this._toast('success','fa-download','Data exported!');}
  _clearAllData(){Object.keys(localStorage).filter(k=>k.startsWith('sv_')).forEach(k=>localStorage.removeItem(k));this._toast('info','fa-trash','All data cleared. Reloading…');setTimeout(()=>window.location.reload(),1300);}

  /* ═══════════════════════════════════════════════════════════════════════════
     THEME
     ═════════════════════════════════════════════════════════════════════════ */
  _toggleTheme(){const cur=document.documentElement.dataset.theme||'dark';this._setTheme(cur==='dark'?'light':'dark');}
  _setTheme(theme){document.documentElement.dataset.theme=theme;this._updateThemeIcon();
    this._qsa('[data-theme-btn]').forEach(b=>{b.classList.toggle('active',b.dataset.themeBtn===theme);});
    this.prefs.theme=theme;this._save('sv_prefs',this.prefs);this._save('sv_theme',theme);}
  _setFontSize(size){document.documentElement.dataset.font=size;
    this._qsa('.font-sz').forEach(b=>{b.classList.toggle('active',b.dataset.size===size);});
    this.prefs.fontSize=size;this._save('sv_prefs',this.prefs);}
  _applyPrefs(){if(this.prefs.theme)this._setTheme(this.prefs.theme);if(this.prefs.fontSize)this._setFontSize(this.prefs.fontSize);if(this.prefs.lastTool)this._setTool(this.prefs.lastTool);}

  /* ═══════════════════════════════════════════════════════════════════════════
     SIDEBAR
     ═════════════════════════════════════════════════════════════════════════ */
  _toggleSidebar(){const lp=this._el('leftPanel');if(!lp)return;
    if(window.innerWidth<=768){const isOpen=lp.classList.toggle('mobile-open');
      this._el('sbBackdrop')?.classList.toggle('visible',isOpen);}
    else{lp.classList.toggle('collapsed');const sfp=this._el('streamFullpage');if(sfp)sfp.classList.toggle('panel-open',!lp.classList.contains('collapsed'));}}
  _closeMobileSidebar(){const lp=this._el('leftPanel');if(!lp)return;lp.classList.remove('mobile-open');this._el('sbBackdrop')?.classList.remove('visible');}

  _toggleFocusMode(){this.focusMode=!this.focusMode;const lp=this._el('leftPanel'),btn=this._el('focusModeBtn');
    if(this.focusMode){if(lp)lp.classList.add('collapsed');if(btn)btn.innerHTML='<i class="fas fa-compress-alt"></i><span>Exit Focus</span>';}
    else{if(lp)lp.classList.remove('collapsed');if(btn)btn.innerHTML='<i class="fas fa-expand-alt"></i><span>Focus</span>';}}

  /* ═══════════════════════════════════════════════════════════════════════════
     MODALS
     ═════════════════════════════════════════════════════════════════════════ */
  _openModal(id){const el=this._el(id);if(!el)return;el.style.display='flex';document.body.style.overflow='hidden';}
  _closeModal(id){const el=this._el(id);if(!el)return;el.style.display='none';
    if(!this._qs('.modal-overlay[style*="flex"]'))document.body.style.overflow='';}
  _closeAllModals(){this._qsa('.modal-overlay').forEach(m=>m.style.display='none');document.body.style.overflow='';this._closeDropdown();}
  _confirm(msg,cb){const me=this._el('confirmMsg');if(me)me.textContent=msg;this.confirmCb=cb;this._openModal('confirmModal');}
  _toggleDropdown(){const dd=this._el('avDropdown');if(!dd)return;dd.classList.toggle('open');}
  _closeDropdown(){const dd=this._el('avDropdown');if(!dd)return;dd.classList.remove('open');}

  /* ═══════════════════════════════════════════════════════════════════════════
     TOAST SYSTEM
     ═════════════════════════════════════════════════════════════════════════ */
  _toast(type,icon,msg,dur=4200){const container=this._el('toastContainer');if(!container)return;
    while(container.children.length>=4)container.removeChild(container.firstChild);
    const t=document.createElement('div');t.className=`toast ${type}`;t.innerHTML=`<i class="fas ${icon}"></i><span>${this._esc(msg)}</span>`;
    t.addEventListener('click',()=>{t.classList.add('removing');setTimeout(()=>t.remove(),300);});
    container.appendChild(t);setTimeout(()=>{if(t.parentNode){t.classList.add('removing');setTimeout(()=>{if(t.parentNode)t.remove();},300);}},dur);}

} /* end class SavoireApp */


/* ═══════════════════════════════════════════════════════════════════════════════
   INITIALISATION
   ═══════════════════════════════════════════════════════════════════════════════ */
window.addEventListener('DOMContentLoaded',()=>{
  window._app=new SavoireApp();window._sav=window._app;
  window.setSugg=(topic)=>{const el=document.getElementById('mainInput');if(!el)return;
    el.value=topic;el.dispatchEvent(new Event('input'));el.focus();el.scrollIntoView({behavior:'smooth',block:'nearest'});};
  console.log('%c📚 Welcome to Savoiré AI v3.0','color:#C9A96E;font-size:14px;font-weight:bold');
  console.log('%cBuilt by Sooban Talha Technologies | soobantalhatech.xyz','color:#756D63;font-size:11px');
});

/* ═══════════════════════════════════════════════════════════════════════════════
   END OF FILE — app.js v3.0
   Savoiré AI v3.0 — Built by Sooban Talha Technologies | soobantalhatech.xyz
   Founder: Sooban Talha | Free for every student on Earth, forever.
   ═══════════════════════════════════════════════════════════════════════════════ */
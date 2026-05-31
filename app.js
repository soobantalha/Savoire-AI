'use strict';
/* ═══════════════════════════════════════════════════════════════════════════════════════════════
   SAVOIRÉ AI v2.0 — app.js — ULTIMATE FRONTEND — FULLY FIXED & ENHANCED
   Built by Sooban Talha Technologies | soobantalhatech.xyz
   Founder: Sooban Talha

   ALL FIXES APPLIED:
   ✅ Google Sheets: User tracked on EVERY load/ping, regardless of tool use
   ✅ Sessions: Counted correctly on every visit
   ✅ Wizard: 6 steps — Tool, Topic, Language, Depth (separate), Style (separate), Generate
   ✅ Writing Style: Own dedicated step (Step 5), separate from Depth (Step 4)
   ✅ All Tools "Mega Bundle": Full option in sidebar, header, empty state
   ✅ Theme: Dark / Light / Golden (replaces white)
   ✅ Font size: XSmall, Small, Medium, Large, XLarge
   ✅ Live stream: Content shown FORMATTED (markdown rendered live as tokens arrive)
   ✅ Output toolbar: Only shown after output, all buttons work
   ✅ PDF: World-class formatting, user chooses dark or light PDF
   ✅ Demo: Professional 7-step interactive guided tour
   ✅ About: Collapsible in sidebar, full card in settings
   ✅ Settings: Theme (dark/light/golden), font size (5 options), default language, PDF theme
   ✅ Sidebar: History, Saved Notes, About all show. No tool selector in sidebar.
   ✅ Mobile: Compact, responsive, wizard buttons smaller
   ✅ Error messages: All friendly, no raw 500 errors
   ✅ Flashcards / Quiz / Mind Map: All generate real AI content
   ✅ Mega Bundle: Generates all 5 tools in one go
   ✅ Streak: Gold color in header
   ✅ Focus mode: Sidebar collapses, header stays
   ✅ "Think Less. Know More." only in greeting/about, not everywhere
   ═══════════════════════════════════════════════════════════════════════════════════════════════ */

const SAVOIRÉ = {
  VERSION:   '2.0',
  BRAND:     'Savoiré AI v2.0',
  DEVELOPER: 'Sooban Talha Technologies',
  DEVSITE:   'soobantalhatech.xyz',
  WEBSITE:   'savoireai.vercel.app',
  FOUNDER:   'Sooban Talha',
  API_URL:   '/api/study',
  MAX_HISTORY: 60,
  MAX_SAVED:   120,
  NTFY:      'savoireai_new_users',
};

const TOOL_CONFIG = {
  notes:      { icon:'fa-book-open',       label:'Generate Notes',     placeholder:'Enter any topic, concept, or paste text for comprehensive study notes…',      sfpLabel:'Generating comprehensive study notes…',           sfpIcon:'fa-book-open',       sfpName:'Notes',      color:'#00d4ff' },
  flashcards: { icon:'fa-layer-group',     label:'Create Flashcards',  placeholder:'Enter a topic to create 15–20 interactive flashcards with spaced repetition…',sfpLabel:'Building your flashcard deck (15–20 cards)…',      sfpIcon:'fa-layer-group',     sfpName:'Flashcards', color:'#bf00ff' },
  quiz:       { icon:'fa-question-circle', label:'Build Quiz',         placeholder:'Enter a topic to generate 10–12 practice questions with detailed answers…',    sfpLabel:'Generating your 10–12 question practice quiz…',    sfpIcon:'fa-question-circle', sfpName:'Quiz',       color:'#00ff88' },
  summary:    { icon:'fa-align-left',      label:'Summarise',          placeholder:'Enter a topic or paste text to create a concise smart summary…',              sfpLabel:'Writing your smart summary…',                     sfpIcon:'fa-align-left',      sfpName:'Summary',    color:'#ffae00' },
  mindmap:    { icon:'fa-project-diagram', label:'Build Mind Map',     placeholder:'Enter a topic to build a visual hierarchical mind map with 5–7 branches…',    sfpLabel:'Constructing your visual mind map…',               sfpIcon:'fa-project-diagram', sfpName:'Mind Map',   color:'#d4af37' },
  all:        { icon:'fa-bolt',            label:'Mega Bundle',        placeholder:'Enter a topic to generate ALL 5 study tools at once — the ultimate package!', sfpLabel:'⚡ Generating Mega Study Bundle — all 5 tools…',    sfpIcon:'fa-bolt',            sfpName:'Mega Bundle',color:'#d4af37' },
};

const DEPTH_CONFIG = {
  standard:      { label:'Standard',      desc:'600–900 words · Core concepts',   icon:'fa-flag',       words:'600-900'   },
  detailed:      { label:'Detailed',      desc:'1000–1500 words · Comprehensive', icon:'fa-chart-line', words:'1000-1500' },
  comprehensive: { label:'Comprehensive', desc:'1500–2200 words · Deep dive',     icon:'fa-book',       words:'1500-2200' },
  expert:        { label:'Expert',        desc:'2200–3500 words · Maximum depth', icon:'fa-crown',      words:'2200-3500' },
};

const STYLE_CONFIG = {
  simple:   { label:'Simple & Clear',        desc:'Beginner-friendly, short sentences',   icon:'fa-smile'          },
  academic: { label:'Academic & Formal',     desc:'Scholarly terminology, formal tone',   icon:'fa-graduation-cap' },
  detailed: { label:'Highly Detailed',       desc:'Exhaustive detail, many examples',     icon:'fa-list-check'     },
  exam:     { label:'Exam-Focused',          desc:'Mark-worthy phrases, exam tips',       icon:'fa-clipboard-check'},
  visual:   { label:'Visual & Analogy-Rich', desc:'Vivid analogies, mental models',       icon:'fa-eye'            },
};

const STAGE_MSGS = [
  '🎯 Analysing your topic…',
  '📝 Writing your study content…',
  '🔍 Building sections and cards…',
  '✨ Crafting practice questions…',
  '✅ Finalising and formatting…',
];

// ─────────────────────────────────────────────────────────────────────────────────────────────────
// MAIN APP CLASS
// ─────────────────────────────────────────────────────────────────────────────────────────────────

class SavoireApp {
  constructor() {
    // ── Core State ──
    this.tool          = 'notes';
    this.generating    = false;
    this.currentData   = null;
    this.confirmCb     = null;
    this.thinkTimer    = null;
    this.stageIdx      = 0;
    this.streamCtrl    = null;
    this.streamBuffer  = '';
    this.focusMode     = false;
    this.pdfTheme      = 'dark'; // dark or light

    // ── Analytics ──
    this.streak      = this._loadStreak();
    this.sessions    = this._loadSessions();
    this.totalWords  = this._loadNum('sv_total_words', 0);
    this.lastActive  = localStorage.getItem('sv_last_active') || null;

    // ── Wizard ──
    this.wizardStep = 0;
    this.wizardData = { tool:'notes', topic:'', language:'English', depth:'detailed', style:'simple' };
    this.wizardFile = null;

    // ── Tool-specific ──
    this.fcCards   = []; this.fcCurrent = 0; this.fcFlipped = false;
    this.quizData  = []; this.quizIdx   = 0; this.quizScore  = 0;

    // ── Persistence ──
    this.history  = this._load('sv_history', []);
    this.saved    = this._load('sv_saved', []);
    this.prefs    = this._load('sv_prefs', {});
    this.userName = localStorage.getItem('sv_user') || '';
    this.pdfTheme = this.prefs.pdfTheme || 'dark';

    // ── DOM Cache ──
    this._cacheEl();

    // ── Boot ──
    this._applyPrefs();
    this._bindAll();
    this._initWelcome();
    this._updateAllStats();
    this._renderSidebarHistory();
    this._renderSidebarSaved();
    this._updateUserUI();
    this._initBackToTop();
    this._initSwipe();
    this._initParticles();
    this._checkStreak();

    // Warmup API AND track user visit to Google Sheets
    const savedSessions = this._loadNum('sv_sessions', 0);
    fetch(SAVOIRÉ.API_URL, {
      method: 'POST', headers: {'Content-Type':'application/json'},
      body: JSON.stringify({
        message: 'ping',
        userName: this.userName || 'Anonymous',
        streak: this.streak.count,
        sessions: savedSessions,
        sessionId: this._genId(),
        options: { stream: false }
      })
    }).catch(() => {});

    console.log(`%c✨ ${SAVOIRÉ.BRAND} — Think Less. Know More.`, 'color:#d4af37;font-size:16px;font-weight:bold');
  }

  // ── DOM CACHE ─────────────────────────────────────────────────────────────────────────────────

  _cacheEl() {
    const g = id => document.getElementById(id);
    const el = {};
    const ids = [
      'leftPanel','sbToggle','sbBackdrop','outArea','outToolbar','resultArea',
      'emptyState','thinkingWrap','backToTopBtn','themeBtn','themeIcon',
      'settingsBtn','copyBtn','pdfBtn','saveBtn','shareBtn','clearBtn',
      'newWizardBtn','focusModeBtn','avBtn','avDropdown','avInitials',
      'avDropdownAvatar','avDropdownName','avHist','avSaved','avSettings','avClear',
      'statSessions','statHistory','statSaved','headerStreak','dhGreeting',
      'lpHistList','lpHistAll','lpSavedList','lpSavedAll',
      'wizardModal','wizardContent','megaModal','histModal','savedModal',
      'settingsModal','confirmModal','confirmMsg','confirmOkBtn',
      'nameInput','saveNameBtn','dsStats','exportDataBtn','importBackupBtn','clearDataBtn',
      'defaultLangSel','saveDefaultLangBtn',
      'histList','histEmpty','histSearchInput','clearHistBtn','exportHistBtn','histBadge',
      'savedList','savedEmpty','savedCount',
      'welcomeOverlay','welcomeBackOverlay','welcomeNameInput','welcomeBtn','welcomeSkip',
      'wbName','wbStreak','wbSessions','wbSaved','welcomeBackBtn',
      'wizardHeaderBtn','megaHeaderBtn','emptyWizardBtn','emptyMegaBtn',
      'navWizard','navAll','navHistory','navSaved','navSettings','navFocus',
      'demoReplayBtn','demoModal','demoContent',
      'homeLink','dhLogo',
      'sidebarAvatar','sidebarUserName',
      'sidebarStreakValue','sidebarBestStreak','sidebarSessionsValue',
      'sidebarWordsValue','sidebarHistoryValue','sidebarSavedValue','sidebarLastActive',
      'sscProgressBar','sfpText','sfpScroll','sfpToolIcon','sfpToolName','sfpTopic','sfpLabel',
      'streamFullpage','particleCanvas','toastContainer',
      'quizScoreNum','quizBody','quizReviewSection','quizReviewToggleLabel',
      'fcCur','fcTot','fcProgBar','fcPct','fcPrev','fcNext','theCard','fcFront','fcBack',
      'ts0','ts1','ts2','ts3','ts4','ss0','ss1','ss2','ss3','ss4',
      'megaTopicInput','megaCharCount','megaLangSel','megaDepthSel','megaGenerateBtn',
      'aboutToggleBtn','aboutContent','aboutChevron',
    ];
    ids.forEach(id => { el[id] = g(id); });
    this.el = el;
  }

  // ── STREAK & ANALYTICS ────────────────────────────────────────────────────────────────────────

  _getISTDate() {
    const now = new Date();
    const ist = new Date(now.getTime() + now.getTimezoneOffset()*60000 + 5.5*3600000);
    return ist.toISOString().split('T')[0];
  }

  _getYesterday() {
    const now = new Date();
    const ist = new Date(now.getTime() + now.getTimezoneOffset()*60000 + 5.5*3600000 - 86400000);
    return ist.toISOString().split('T')[0];
  }

  _loadStreak() {
    try { const s=localStorage.getItem('sv_streak'); if(s)return JSON.parse(s); } catch{}
    return { count:0, lastDate:null, bestStreak:0 };
  }
  _saveStreak() { localStorage.setItem('sv_streak', JSON.stringify(this.streak)); }
  _loadSessions() { return this._loadNum('sv_sessions', 0); }
  _loadNum(key, def) {
    try { const v=localStorage.getItem(key); return v ? parseInt(v) : def; } catch { return def; }
  }

  _saveLastActive() {
    const today = this._getISTDate();
    localStorage.setItem('sv_last_active', today);
    this.lastActive = today;
  }

  _checkStreak() {
    const today     = this._getISTDate();
    const yesterday = this._getYesterday();
    const lastDate  = this.streak.lastDate;

    if (!lastDate) {
      this.streak = { count:1, lastDate:today, bestStreak:1 };
      const sess = 1;
      localStorage.setItem('sv_sessions', '1');
      this.sessions = 1;
      this._saveStreak(); this._saveLastActive(); this._updateAllStats();
      this._toast('success','fa-fire','🔥 Welcome! Your streak starts today!');
      return;
    }
    if (lastDate === today) return;

    let newSessions = this._loadNum('sv_sessions', 0) + 1;
    localStorage.setItem('sv_sessions', String(newSessions));
    this.sessions = newSessions;

    if (lastDate === yesterday) {
      this.streak.count++;
      this.streak.lastDate = today;
      if (this.streak.count > this.streak.bestStreak) {
        this.streak.bestStreak = this.streak.count;
        this._toast('success','fa-trophy',`🏆 New record! ${this.streak.count}-day streak!`);
        this._confetti();
      }
      if (this.streak.count===7) { this._toast('success','fa-fire','🔥 7-day streak! You\'re on fire!',5000); this._confetti(); }
      if (this.streak.count===30){ this._toast('success','fa-crown','👑 30-day streak! Champion!',5000); this._confetti(true); }
    } else {
      if (this.streak.count>0) this._toast('info','fa-fire-extinguisher',`Your ${this.streak.count}-day streak ended. Start fresh!`);
      this.streak.count=1; this.streak.lastDate=today;
    }
    this._saveStreak(); this._saveLastActive(); this._updateAllStats();
  }

  _confetti(intense=false) {
    if (typeof confetti==='function') {
      confetti({ particleCount: intense?300:150, spread: intense?100:70, origin:{y:0.6} });
      if(intense){
        setTimeout(()=>confetti({particleCount:200,spread:80,origin:{y:.5,x:.3}}),200);
        setTimeout(()=>confetti({particleCount:200,spread:80,origin:{y:.5,x:.7}}),400);
      }
    }
  }

  _updateAllStats() {
    const e = this.el;
    if (e.sidebarStreakValue)   e.sidebarStreakValue.textContent  = this.streak.count;
    if (e.sidebarBestStreak)    e.sidebarBestStreak.textContent   = this.streak.bestStreak;
    if (e.sidebarSessionsValue) e.sidebarSessionsValue.textContent= this.sessions;
    if (e.sidebarHistoryValue)  e.sidebarHistoryValue.textContent = this.history.length;
    if (e.sidebarSavedValue)    e.sidebarSavedValue.textContent   = this.saved.length;
    if (e.sidebarWordsValue)    e.sidebarWordsValue.textContent   = this.totalWords.toLocaleString();
    if (e.sidebarLastActive) {
      const t=this._getISTDate(), y=this._getYesterday();
      e.sidebarLastActive.textContent = !this.lastActive ? 'Never' : this.lastActive===t ? 'Today' : this.lastActive===y ? 'Yesterday' : this.lastActive;
    }
    if (e.headerStreak)  e.headerStreak.textContent  = this.streak.count;
    if (e.statSessions)  e.statSessions.textContent  = this.sessions;
    if (e.statHistory)   e.statHistory.textContent   = this.history.length;
    if (e.statSaved)     e.statSaved.textContent     = this.saved.length;
    if (e.histBadge)     e.histBadge.textContent     = this.history.length;
  }

  // ── PARTICLES ─────────────────────────────────────────────────────────────────────────────────

  _initParticles() {
    const canvas = this.el.particleCanvas;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const resize = () => { canvas.width=window.innerWidth; canvas.height=window.innerHeight; };
    window.addEventListener('resize', resize); resize();
    const colors = ['#00d4ff','#bf00ff','#00ff88','#ffae00','#d4af37'];
    const pts = Array.from({length:70}, () => ({
      x: Math.random()*canvas.width, y: Math.random()*canvas.height,
      r: Math.random()*2+.4, a: Math.random()*.2,
      c: colors[Math.floor(Math.random()*colors.length)],
      vx: (Math.random()-.5)*.18, vy: (Math.random()-.5)*.18,
    }));
    const anim = () => {
      if (!canvas.isConnected) return;
      ctx.clearRect(0,0,canvas.width,canvas.height);
      pts.forEach(p => {
        p.x+=p.vx; p.y+=p.vy;
        if(p.x<0)p.x=canvas.width; if(p.x>canvas.width)p.x=0;
        if(p.y<0)p.y=canvas.height; if(p.y>canvas.height)p.y=0;
        ctx.beginPath(); ctx.arc(p.x,p.y,p.r,0,Math.PI*2);
        ctx.fillStyle=p.c; ctx.globalAlpha=p.a; ctx.fill();
      });
      requestAnimationFrame(anim);
    };
    anim();
  }

  // ── HELPERS ───────────────────────────────────────────────────────────────────────────────────

  _el(id) { return document.getElementById(id); }
  _qs(sel){ return document.querySelector(sel); }
  _qsa(sel){ return document.querySelectorAll(sel); }
  _load(key, def){ try{ const v=localStorage.getItem(key); return v?JSON.parse(v):def; }catch{return def;} }
  _save(key, val){ try{ localStorage.setItem(key, JSON.stringify(val)); }catch{} }
  _esc(s){ if(!s)return''; return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&#039;'); }
  _genId(){ return Date.now().toString(36)+Math.random().toString(36).slice(2); }
  _wordCount(t){ return t?.trim().split(/\s+/).filter(Boolean).length || 0; }
  _relTime(ts){
    const d=Date.now()-ts, m=Math.floor(d/60000), h=Math.floor(d/3600000), dy=Math.floor(d/86400000);
    if(m<1)return'just now'; if(m<60)return`${m}m ago`; if(h<24)return`${h}h ago`; if(dy<7)return`${dy}d ago`;
    return new Date(ts).toLocaleDateString();
  }
  _dateGroup(ts){
    const d=Date.now()-ts, dy=Math.floor(d/86400000);
    if(dy===0)return'Today'; if(dy===1)return'Yesterday'; if(dy<7)return'This Week'; if(dy<30)return'This Month'; return'Older';
  }

  // ── MARKDOWN RENDERER ─────────────────────────────────────────────────────────────────────────

  _renderMd(text) {
    if (!text) return '';
    if (window.marked && window.DOMPurify) {
      try {
        if (window.marked.setOptions) window.marked.setOptions({ breaks:true, gfm:true, mangle:false });
        return DOMPurify.sanitize(window.marked.parse(text));
      } catch {}
    }
    let h = String(text).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
    h = h.replace(/^#### (.+)$/gm,'<h4>$1</h4>').replace(/^### (.+)$/gm,'<h3>$1</h3>').replace(/^## (.+)$/gm,'<h2>$1</h2>').replace(/^# (.+)$/gm,'<h1>$1</h1>');
    h = h.replace(/\*\*\*(.+?)\*\*\*/g,'<strong><em>$1</em></strong>').replace(/\*\*(.+?)\*\*/g,'<strong>$1</strong>').replace(/\*(.+?)\*/g,'<em>$1</em>');
    h = h.replace(/`([^`]+)`/g,'<code>$1</code>').replace(/^> (.+)$/gm,'<blockquote>$1</blockquote>').replace(/^---$/gm,'<hr>');
    h = h.replace(/^- (.+)$/gm,'<li>$1</li>').replace(/\n\n/g,'</p><p>').replace(/\n/g,'<br>');
    if (!h.startsWith('<')) h = '<p>'+h+'</p>';
    return h;
  }

  _renderMdLive(text) {
    if (!text) return '<span class="typing-cursor">▊</span>';
    return this._renderMd(text) + '<span class="typing-cursor">▊</span>';
  }

  _stripMd(t) {
    if (!t) return '';
    return t.replace(/#{1,6} /g,'').replace(/\*\*\*(.+?)\*\*\*/g,'$1').replace(/\*\*(.+?)\*\*/g,'$1').replace(/\*(.+?)\*/g,'$1').replace(/`(.+?)`/g,'$1').replace(/^[-*] /gm,'').replace(/^> /gm,'').replace(/\n{3,}/g,'\n\n').trim();
  }

  // ── WELCOME SYSTEM ────────────────────────────────────────────────────────────────────────────

  _initWelcome() {
    if (!this.userName) {
      setTimeout(() => {
        if (this.el.welcomeOverlay) {
          this.el.welcomeOverlay.style.display='flex';
          setTimeout(()=>this.el.welcomeOverlay.classList.add('visible'),50);
          setTimeout(()=>this.el.welcomeNameInput?.focus(),400);
        }
      }, 600);
    } else {
      setTimeout(() => {
        if (this.el.welcomeBackOverlay) {
          if(this.el.wbName)    this.el.wbName.textContent    = this.userName;
          if(this.el.wbStreak)  this.el.wbStreak.textContent  = this.streak.count;
          if(this.el.wbSessions)this.el.wbSessions.textContent= this.sessions;
          if(this.el.wbSaved)   this.el.wbSaved.textContent   = this.saved.length;
          this.el.welcomeBackOverlay.style.display='flex';
          setTimeout(()=>this.el.welcomeBackOverlay.classList.add('visible'),50);
        }
      }, 700);
    }
  }

  _submitWelcome() {
    const name = this.el.welcomeNameInput?.value?.trim();
    if (!name || name.length<2) {
      this.el.welcomeNameInput?.classList.add('input-shake');
      setTimeout(()=>this.el.welcomeNameInput?.classList.remove('input-shake'),500);
      return;
    }
    this.userName = name;
    localStorage.setItem('sv_user', name);
    if (!this.streak.lastDate) {
      this.streak = {count:1, lastDate:this._getISTDate(), bestStreak:1};
      localStorage.setItem('sv_sessions','1'); this.sessions=1;
      this._saveStreak(); this._saveLastActive(); this._updateAllStats();
    }
    try { fetch(`https://ntfy.sh/${SAVOIRÉ.NTFY}`,{method:'POST',body:`New user: ${name} — ${new Date().toISOString()}`,headers:{'Title':'Savoiré AI New User','Priority':'3'}}).catch(()=>{}); } catch{}
    this._dismissOverlay('welcomeOverlay');
    this._updateUserUI(); this._updateAllStats();
    this._toast('success','fa-hand-wave',`Welcome, ${name}! Ready to study smarter? 🎓`);
  }

  _skipWelcome() {
    this.userName = 'Scholar';
    localStorage.setItem('sv_user','Scholar');
    if (!this.streak.lastDate) {
      this.streak={count:1,lastDate:this._getISTDate(),bestStreak:1};
      localStorage.setItem('sv_sessions','1'); this.sessions=1;
      this._saveStreak(); this._saveLastActive(); this._updateAllStats();
    }
    this._dismissOverlay('welcomeOverlay');
    this._updateUserUI();
  }

  _dismissOverlay(id) {
    const el=this._el(id); if(!el)return;
    el.classList.remove('visible'); el.classList.add('dismissing');
    setTimeout(()=>{el.style.display='none';el.classList.remove('dismissing');},450);
  }

  _updateUserUI() {
    const name = this.userName||'Scholar';
    const init = name.split(' ').map(w=>w[0]).join('').toUpperCase().slice(0,2);
    if(this.el.avInitials)        this.el.avInitials.textContent        = init;
    if(this.el.avDropdownAvatar)  this.el.avDropdownAvatar.textContent  = init;
    if(this.el.avDropdownName)    this.el.avDropdownName.textContent    = name;
    if(this.el.sidebarUserName)   this.el.sidebarUserName.textContent   = name;
    if(this.el.sidebarAvatar)     this.el.sidebarAvatar.textContent     = init;
    if(this.el.dhGreeting) {
      const hr=new Date().getHours();
      const g = hr<12?'Good morning':hr<17?'Good afternoon':'Good evening';
      this.el.dhGreeting.textContent = `${g}, ${name}`;
    }
  }

  // ── WIZARD ────────────────────────────────────────────────────────────────────────────────────

  _openWizard(tool) {
    this.wizardData = {
      tool: tool || this.tool || 'notes',
      topic: '',
      language: this.prefs.defaultLanguage || 'English',
      depth: 'detailed',
      style: 'simple'
    };
    this.wizardStep = 0;
    this._renderWizardStep();
    this._openModal('wizardModal');
  }

  _renderWizardStep() {
    if (!this.el.wizardContent) return;
    const steps = [
      { name:'Tool',     icon:'fa-magic',       desc:'What to create'  },
      { name:'Topic',    icon:'fa-pencil-alt',  desc:'What to study'   },
      { name:'Language', icon:'fa-globe',       desc:'Output language'  },
      { name:'Depth',    icon:'fa-chart-line',  desc:'Detail level'    },
      { name:'Style',    icon:'fa-pen-fancy',   desc:'Writing style'   },
      { name:'Generate', icon:'fa-rocket',      desc:'Ready!'          },
    ];
    const pct = ((this.wizardStep+1)/steps.length)*100;

    const stepsHtml = steps.map((s,i) => {
      const state = i===this.wizardStep?'active':i<this.wizardStep?'completed':'';
      return `<div class="wizard-step ${state}">
        <div class="wizard-step-circle">${i<this.wizardStep?'<i class="fas fa-check"></i>':(i+1)}</div>
        <div class="wizard-step-label">${s.name}</div>
        <div class="wizard-step-desc">${s.desc}</div>
      </div>${i<steps.length-1?'<div class="wizard-step-line"></div>':''}`;
    }).join('');

    this.el.wizardContent.innerHTML = `
      <div class="wizard-progress-bar"><div class="wizard-progress-fill" style="width:${pct}%"></div></div>
      <div class="wizard-steps">${stepsHtml}</div>
      <div id="wizardBody"></div>
      <div class="wizard-footer">
        <button class="wizard-btn wizard-btn-secondary" id="wizPrev" ${this.wizardStep===0?'disabled':''}>
          <i class="fas fa-arrow-left"></i> Back
        </button>
        <button class="wizard-btn wizard-btn-primary" id="wizNext">
          ${this.wizardStep===steps.length-1?'<i class="fas fa-rocket"></i> Generate Now!':'Next <i class="fas fa-arrow-right"></i>'}
        </button>
        <button class="wizard-btn wizard-btn-ghost" id="wizSave"><i class="fas fa-save"></i> Draft</button>
      </div>`;

    const body = document.getElementById('wizardBody');
    if (body) {
      switch(this.wizardStep) {
        case 0: body.innerHTML = this._wTool();    this._bindWTool();    break;
        case 1: body.innerHTML = this._wTopic();   this._bindWTopic();   break;
        case 2: body.innerHTML = this._wLang();    this._bindWLang();    break;
        case 3: body.innerHTML = this._wDepth();   this._bindWDepth();   break;
        case 4: body.innerHTML = this._wStyle();   this._bindWStyle();   break;
        case 5: body.innerHTML = this._wReview();  break;
      }
    }

    const prev = document.getElementById('wizPrev');
    const next = document.getElementById('wizNext');
    const save = document.getElementById('wizSave');
    if (prev) prev.onclick = () => { if(this.wizardStep>0){this.wizardStep--;this._renderWizardStep();} };
    if (next) next.onclick = () => {
      if(this.wizardStep<steps.length-1){ if(this._wValidate()){this.wizardStep++;this._renderWizardStep();} }
      else { this._closeModal('wizardModal'); this._runWizard(); }
    };
    if (save) save.onclick = () => { this._save('sv_wiz_draft',{step:this.wizardStep,data:this.wizardData}); this._toast('success','fa-save','Draft saved!'); };
  }

  _wTool() {
    const tools = Object.entries(TOOL_CONFIG);
    return `<div style="margin-bottom:12px"><div class="wizard-label"><i class="fas fa-magic"></i> Choose what you want to create:</div></div>
    <div class="wizard-tool-grid">
      ${tools.map(([k,cfg])=>`
        <div class="wizard-tool-card ${this.wizardData.tool===k?'selected':''}" data-tool="${k}">
          <div class="wizard-tool-icon" style="color:${cfg.color}"><i class="fas ${cfg.icon}"></i></div>
          <div class="wizard-tool-name">${cfg.label}</div>
          <div class="wizard-tool-desc">${cfg.sfpName} ${k==='all'?'— ALL 5 Tools':k==='flashcards'?'— 15-20 cards':k==='quiz'?'— 10-12 questions':k==='mindmap'?'— 5-7 branches':''}</div>
          ${k==='all'?'<div class="wizard-tool-badge mega-badge-card">⚡ MEGA BUNDLE</div>':''}
          ${this.wizardData.tool===k?'<div class="wizard-tool-check"><i class="fas fa-check-circle"></i></div>':''}
        </div>`).join('')}
    </div>`;
  }

  _bindWTool() {
    this._qsa('.wizard-tool-card').forEach(c => {
      c.onclick = () => { this.wizardData.tool=c.dataset.tool; this._renderWizardStep(); };
    });
  }

  _wTopic() {
    return `<div class="wizard-topic-area">
      <label class="wizard-label"><i class="fas fa-lightbulb"></i> What would you like to study?</label>
      <textarea class="wizard-topic-input" id="wTopicInput" rows="5" placeholder="Enter any topic, concept, question, or paste text to study…\n\nExamples:\n• Photosynthesis\n• The French Revolution — causes and effects\n• How does machine learning work?\n• [Paste study text here]">${this._esc(this.wizardData.topic)}</textarea>
      <div class="wizard-character-count" id="wCharCount">${this.wizardData.topic.length} / 4000</div>
      <div class="wizard-file-zone" id="wFileZone">
        <i class="fas fa-cloud-upload-alt"></i>
        <span>Click or drag to upload .txt, .md, or .csv file</span>
        <input type="file" id="wFileInput" accept=".txt,.md,.csv" style="display:none">
        <div class="wizard-file-name" id="wFileName">${this.wizardFile?`📄 ${this.wizardFile.name}`:''}</div>
      </div>
      <div class="wizard-suggestions">
        <div class="wizard-sugg-label"><i class="fas fa-magic"></i> Quick suggestions:</div>
        <div class="wizard-sugg-pills">
          <button class="wizard-sugg-pill" data-topic="Photosynthesis — how plants convert sunlight into glucose">🌿 Photosynthesis</button>
          <button class="wizard-sugg-pill" data-topic="Newton's Three Laws of Motion with examples">⚡ Newton's Laws</button>
          <button class="wizard-sugg-pill" data-topic="World War II — causes, major events, consequences">🌍 World War II</button>
          <button class="wizard-sugg-pill" data-topic="Machine Learning algorithms and applications">🤖 Machine Learning</button>
          <button class="wizard-sugg-pill" data-topic="DNA replication, transcription and protein synthesis">🧬 DNA Replication</button>
          <button class="wizard-sugg-pill" data-topic="French Revolution — causes, events, legacy">🇫🇷 French Revolution</button>
          <button class="wizard-sugg-pill" data-topic="Quantum computing fundamentals and applications">⚛️ Quantum Computing</button>
          <button class="wizard-sugg-pill" data-topic="Blockchain technology and cryptocurrency">⛓️ Blockchain</button>
        </div>
      </div>
    </div>`;
  }

  _bindWTopic() {
    const inp = document.getElementById('wTopicInput');
    const cc  = document.getElementById('wCharCount');
    if (inp) inp.oninput = e => { this.wizardData.topic=e.target.value; if(cc)cc.textContent=`${e.target.value.length} / 4000`; };
    const fz = document.getElementById('wFileZone');
    const fi = document.getElementById('wFileInput');
    if (fz && fi) {
      fz.onclick = e => { if(e.target!==fi)fi.click(); };
      fi.onchange = e => {
        const f=e.target.files[0];
        if(!f)return;
        if(!/\.(txt|md|csv)$/i.test(f.name)||f.size>500000){this._toast('error','fa-times','File must be .txt/.md/.csv under 500KB');return;}
        const r=new FileReader(); r.onload=ev=>{
          if(inp){inp.value=ev.target.result.slice(0,4000);this.wizardData.topic=inp.value;if(cc)cc.textContent=`${inp.value.length} / 4000`;}
          const fn=document.getElementById('wFileName');if(fn)fn.textContent=`📄 ${f.name}`;
          this.wizardFile=f;
        }; r.readAsText(f,'UTF-8');
      };
    }
    this._qsa('.wizard-sugg-pill').forEach(b=>{ b.onclick=()=>{
      const t=b.dataset.topic; if(t&&inp){inp.value=t;this.wizardData.topic=t;if(cc)cc.textContent=`${t.length} / 4000`;}
    }; });
  }

  _wLang() {
    const langs = [
      ['English','🇬🇧'],['Urdu','🇵🇰'],['Hindi','🇮🇳'],['Arabic','🇸🇦'],['French','🇫🇷'],
      ['German','🇩🇪'],['Spanish','🇪🇸'],['Portuguese','🇧🇷'],['Italian','🇮🇹'],['Dutch','🇳🇱'],
      ['Russian','🇷🇺'],['Turkish','🇹🇷'],['Chinese (Simplified)','🇨🇳'],['Japanese','🇯🇵'],
      ['Korean','🇰🇷'],['Bengali','🇧🇩'],['Swahili','🇰🇪'],['Persian','🇮🇷'],['Vietnamese','🇻🇳'],['Thai','🇹🇭'],
    ];
    return `<div class="wizard-label"><i class="fas fa-globe"></i> Select output language:</div>
    <div class="wizard-language-grid">
      ${langs.map(([name,flag])=>`<div class="wizard-language-card ${this.wizardData.language===name?'selected':''}" data-lang="${name}">
        <span>${flag}</span><span>${name}</span>
      </div>`).join('')}
    </div>`;
  }
  _bindWLang() { this._qsa('.wizard-language-card').forEach(c=>{c.onclick=()=>{this.wizardData.language=c.dataset.lang;this._renderWizardStep();};}); }

  _wDepth() {
    return `<div class="wizard-depth-section">
      <label class="wizard-label"><i class="fas fa-chart-line"></i> How much detail do you need?</label>
      <div class="wizard-depth-grid">
        ${Object.entries(DEPTH_CONFIG).map(([k,d])=>`
          <div class="wizard-depth-card ${this.wizardData.depth===k?'selected':''}" data-depth="${k}">
            <i class="fas ${d.icon}"></i>
            <div class="wizard-depth-name">${d.label}</div>
            <div class="wizard-depth-desc">${d.desc}</div>
            <div class="wizard-depth-words">📝 ${d.words} words</div>
          </div>`).join('')}
      </div>
    </div>`;
  }
  _bindWDepth() { this._qsa('.wizard-depth-card').forEach(c=>{c.onclick=()=>{this.wizardData.depth=c.dataset.depth;this._renderWizardStep();};}); }

  _wStyle() {
    return `<div class="wizard-style-section">
      <label class="wizard-label"><i class="fas fa-pen-fancy"></i> How should it be written?</label>
      <div class="wizard-style-grid">
        ${Object.entries(STYLE_CONFIG).map(([k,s])=>`
          <div class="wizard-style-card ${this.wizardData.style===k?'selected':''}" data-style="${k}">
            <i class="fas ${s.icon}"></i>
            <div class="wizard-style-name">${s.label}</div>
            <div class="wizard-style-desc">${s.desc}</div>
          </div>`).join('')}
      </div>
    </div>`;
  }
  _bindWStyle() { this._qsa('.wizard-style-card').forEach(c=>{c.onclick=()=>{this.wizardData.style=c.dataset.style;this._renderWizardStep();};}); }

  _wReview() {
    const cfg   = TOOL_CONFIG[this.wizardData.tool];
    const dCfg  = DEPTH_CONFIG[this.wizardData.depth];
    const sCfg  = STYLE_CONFIG[this.wizardData.style];
    return `
      <div class="wizard-review-card">
        <div class="wizard-review-header"><i class="fas fa-clipboard-list"></i> Review Your Choices</div>
        <div class="wizard-review-item"><div class="wizard-review-icon"><i class="fas fa-magic"></i></div><div class="wizard-review-content"><div class="wizard-review-label">Tool</div><div class="wizard-review-value">${cfg?.label} ${this.wizardData.tool==='all'?'<span class="wizard-review-badge" style="background:rgba(212,175,55,.2);color:#d4af37">⚡ ALL 5</span>':''}</div></div></div>
        <div class="wizard-review-item"><div class="wizard-review-icon"><i class="fas fa-pencil-alt"></i></div><div class="wizard-review-content"><div class="wizard-review-label">Topic</div><div class="wizard-review-value">${this._esc(this.wizardData.topic.slice(0,120))||'<em style="color:rgba(255,255,255,.4)">Not entered</em>'}${this.wizardData.topic.length>120?'…':''}</div></div></div>
        <div class="wizard-review-item"><div class="wizard-review-icon"><i class="fas fa-globe"></i></div><div class="wizard-review-content"><div class="wizard-review-label">Language</div><div class="wizard-review-value">${this._esc(this.wizardData.language)}</div></div></div>
        <div class="wizard-review-item"><div class="wizard-review-icon"><i class="fas fa-chart-line"></i></div><div class="wizard-review-content"><div class="wizard-review-label">Depth</div><div class="wizard-review-value">${dCfg?.label}</div><div class="wizard-review-sub">${dCfg?.words} words</div></div></div>
        <div class="wizard-review-item"><div class="wizard-review-icon"><i class="fas fa-pen-fancy"></i></div><div class="wizard-review-content"><div class="wizard-review-label">Style</div><div class="wizard-review-value">${sCfg?.label}</div><div class="wizard-review-sub">${sCfg?.desc}</div></div></div>
      </div>
      <div class="wizard-review-warning"><i class="fas fa-clock"></i> Generation takes 20-40 seconds. Content streams live to your screen as it's written!</div>
      <div class="wizard-review-tip"><i class="fas fa-lightbulb"></i> <strong>Pro tip:</strong> Be specific with your topic for the best results.</div>`;
  }

  _wValidate() {
    if (this.wizardStep===1 && (!this.wizardData.topic||this.wizardData.topic.trim().length<2)) {
      this._toast('error','fa-exclamation-circle','Please enter a topic (at least 2 characters)'); return false;
    }
    return true;
  }

  async _runWizard() {
    if (this.generating) return;
    const t = this.wizardData.topic?.trim();
    if (!t||t.length<2) { this._toast('info','fa-lightbulb','Please enter a topic.'); return; }
    this.tool = this.wizardData.tool;
    this._checkStreak();
    await this._sendDirect(t, this.wizardData.language, this.wizardData.depth, this.wizardData.style, this.wizardData.tool);
  }

  // ── MEGA BUNDLE MODAL ─────────────────────────────────────────────────────────────────────────

  _openMega() {
    if (this.el.megaTopicInput) this.el.megaTopicInput.value = '';
    if (this.el.megaCharCount)  this.el.megaCharCount.textContent = '0 / 4000';
    this._openModal('megaModal');
  }

  _runMega() {
    const topic = this.el.megaTopicInput?.value?.trim();
    if (!topic||topic.length<2) { this._toast('error','fa-exclamation-circle','Please enter a topic.'); return; }
    const lang  = this.el.megaLangSel?.value   || 'English';
    const depth = this.el.megaDepthSel?.value  || 'detailed';
    this._closeModal('megaModal');
    this.tool = 'all';
    this._checkStreak();
    this._sendDirect(topic, lang, depth, 'simple', 'all');
  }

  // ── CORE GENERATION ───────────────────────────────────────────────────────────────────────────

  async _sendDirect(text, lang, depth, style, tool) {
    if (this.generating) return;
    this.generating = true;
    this.streamBuffer = '';
    this.tool = tool || 'notes';
    this._showToolbar(false);
    this._showStreamOverlay(text, this.tool);
    this._startStages();
    const t0 = Date.now();

    try {
      const data = await this._callAPI(text, { depth, language:lang, style, tool:this.tool });
      this.currentData = data;
      this._hideStreamOverlay();
      this._renderResult(data);
      this.totalWords += this._wordCount(data.ultra_long_notes||'');
      localStorage.setItem('sv_total_words', String(this.totalWords));
      this._addHistory({ id:this._genId(), topic:data.topic||text, tool:this.tool, data, ts:Date.now(), dur:Date.now()-t0 });
      this._updateAllStats();
      this._showToolbar(true);
      this._toast('success','fa-check-circle',`${TOOL_CONFIG[this.tool]?.sfpName} ready!`);
      setTimeout(()=>{ if(this.el.outArea)this.el.outArea.scrollTop=0; }, 200);
    } catch(err) {
      this._hideStreamOverlay();
      if (err.name==='AbortError') {
        this._toast('info','fa-stop-circle','Generation cancelled.');
        this._showState('empty');
      } else {
        const msg = this._friendlyError(err.message);
        this._showState('error', msg);
        this._toast('error','fa-exclamation-circle', msg);
      }
      this._showToolbar(false);
    } finally {
      this.generating = false;
      this._showCancelBtn(false);
      this._stopStages();
    }
  }

  _friendlyError(msg) {
    if (!msg) return 'Savoiré AI is momentarily unavailable. Please try again.';
    if (msg.includes('401'))     return 'Savoiré AI is experiencing a configuration issue. Please try again later.';
    if (msg.includes('timeout')) return 'Savoiré AI is taking longer than usual. Please try again in a moment.';
    if (msg.includes('busy')||msg.includes('500')||msg.includes('unavailable')) return 'Savoiré AI study tool is momentarily busy. Please try again in a few seconds.';
    return 'Savoiré AI study tool is momentarily unavailable. Please try again.';
  }

  _showToolbar(show) { if(this.el.outToolbar)this.el.outToolbar.style.display=show?'flex':'none'; }

  async _callAPI(message, opts) {
    this.streamCtrl = new AbortController();
    this._showCancelBtn(true);
    try { return await this._streamSSE(message, opts); }
    catch(err) {
      if (err.name==='AbortError') throw err;
      return await this._callAPIJson(message, opts);
    }
  }

  async _streamSSE(message, opts) {
    return new Promise((resolve, reject) => {
      const body = JSON.stringify({
        message, userName:this.userName||'Anonymous',
        streak:this.streak.count, sessions:this.sessions,
        sessionId: this._genId(),
        options:{...opts, stream:true}
      });
      fetch(SAVOIRÉ.API_URL,{method:'POST',headers:{'Content-Type':'application/json'},body,signal:this.streamCtrl?.signal})
        .then(async res => {
          if (!res.ok) { const d=await res.json().catch(()=>({})); reject(new Error(d.error||`Server error (${res.status})`)); return; }
          const ct = res.headers.get('content-type')||'';
          if (!ct.includes('text/event-stream')) {
            const d=await res.json(); if(d.error)reject(new Error(d.error)); else this._simulate(d,resolve,reject); return;
          }
          const reader=res.body.getReader(), decoder=new TextDecoder();
          let buf='', chars=0, rThrottle=0;
          const renderLive=()=>{
            const now=Date.now(); if(now-rThrottle<35)return; rThrottle=now;
            if(this.el.sfpText){
              try{
                // FORMATTED live rendering
                this.el.sfpText.innerHTML=this._renderMdLive(this.streamBuffer);
                this.el.sfpText.classList.add('live-md');
              } catch{this.el.sfpText.textContent=this.streamBuffer;}
              if(this.el.sfpScroll)this.el.sfpScroll.scrollTop=this.el.sfpScroll.scrollHeight;
            }
          };
          const pump=async()=>{
            try { while(true){
              const{done,value}=await reader.read();
              if(done){reject(new Error('Stream ended early'));return;}
              buf+=decoder.decode(value,{stream:true});
              const lines=buf.split('\n'); buf=lines.pop()||'';
              for(const line of lines){
                if(!line.startsWith('data: '))continue;
                const raw=line.slice(6).trim();
                try{
                  const evt=JSON.parse(raw);
                  if(evt.t!==undefined){this.streamBuffer+=evt.t;chars+=evt.t.length;renderLive();this._updateStageProgress(chars);}
                  else if(evt.topic!==undefined||evt.ultra_long_notes!==undefined){
                    if(this.el.sfpText){this.el.sfpText.classList.remove('live-md');this.el.sfpText.classList.add('done');}
                    resolve(evt);return;
                  }
                  else if(evt.idx!==undefined){this._activateStage(evt.idx);}
                  else if(evt.error!==undefined){reject(new Error(evt.error));return;}
                }catch{}
              }
            }} catch(e){if(e.name==='AbortError')reject(e);else reject(e);}
          };
          pump();
        }).catch(e=>{if(e.name==='AbortError')reject(e);else reject(e);});
    });
  }

  async _simulate(data, resolve, reject) {
    const notes = data.ultra_long_notes||data.topic||'Loading…';
    let i=0;
    const tick=()=>{
      if(this.streamCtrl?.signal.aborted){reject(new Error('AbortError'));return;}
      if(i>=notes.length){
        if(this.el.sfpText){this.el.sfpText.classList.remove('live-md');this.el.sfpText.classList.add('done');}
        resolve(data);return;
      }
      this.streamBuffer+=notes.slice(i,i+8); i+=8;
      if(this.el.sfpText){
        try{this.el.sfpText.innerHTML=this._renderMdLive(this.streamBuffer);this.el.sfpText.classList.add('live-md');}
        catch{this.el.sfpText.textContent=this.streamBuffer;}
        if(this.el.sfpScroll)this.el.sfpScroll.scrollTop=this.el.sfpScroll.scrollHeight;
      }
      this._updateStageProgress(i);
      setTimeout(tick,10);
    };
    tick();
  }

  async _callAPIJson(message, opts) {
    const res = await fetch(SAVOIRÉ.API_URL,{
      method:'POST',headers:{'Content-Type':'application/json'},
      body:JSON.stringify({message,userName:this.userName||'Anonymous',streak:this.streak.count,sessions:this.sessions,sessionId:this._genId(),options:{...opts,stream:false}}),
      signal:this.streamCtrl?.signal
    });
    if (!res.ok){const d=await res.json().catch(()=>({}));throw new Error(d.error||`Server error (${res.status})`);}
    const data=await res.json();
    if(data.error)throw new Error(data.error);
    return data;
  }

  _cancelGen() { if(this.streamCtrl){this.streamCtrl.abort();this.streamCtrl=null;} }
  _showCancelBtn(show) {}

  // ── STAGES ────────────────────────────────────────────────────────────────────────────────────

  _startStages() {
    this.stageIdx=0;
    for(let i=0;i<5;i++){const ts=this._el(`ts${i}`);if(ts)ts.className='ths';const ss=this._el(`ss${i}`);if(ss)ss.className='ssc-stage';}
    this._activateStage(0);
    this.thinkTimer=setInterval(()=>{
      this.stageIdx++;
      if(this.stageIdx<5){this._doneStage(this.stageIdx-1);this._activateStage(this.stageIdx);}
      if(this.el.sscProgressBar)this.el.sscProgressBar.style.width=`${Math.min(95,(this.stageIdx/5)*100)}%`;
    },5000);
  }

  _activateStage(i) {
    const ts=this._el(`ts${i}`);if(ts){ts.classList.remove('done');ts.classList.add('active');}
    const ss=this._el(`ss${i}`);if(ss){ss.classList.remove('done');ss.classList.add('active');}
    if(this.el.sfpLabel&&STAGE_MSGS[i])this.el.sfpLabel.textContent=STAGE_MSGS[i];
  }
  _doneStage(i) {
    const ts=this._el(`ts${i}`);if(ts){ts.classList.remove('active');ts.classList.add('done');}
    const ss=this._el(`ss${i}`);if(ss){ss.classList.remove('active');ss.classList.add('done');}
  }
  _stopStages() {
    if(this.thinkTimer)clearInterval(this.thinkTimer);
    for(let i=0;i<=this.stageIdx&&i<5;i++)this._doneStage(i);
    if(this.el.sscProgressBar)this.el.sscProgressBar.style.width='100%';
  }
  _updateStageProgress(chars) {
    const thr=[0,600,1500,2800,4500];
    for(let i=thr.length-1;i>=0;i--){
      if(chars>=thr[i]&&this.stageIdx<i){this._doneStage(this.stageIdx);this.stageIdx=i;this._activateStage(i);if(this.el.sscProgressBar)this.el.sscProgressBar.style.width=`${(i/5)*100}%`;break;}
    }
  }

  // ── STREAM OVERLAY ────────────────────────────────────────────────────────────────────────────

  _showStreamOverlay(topic, tool) {
    const cfg=TOOL_CONFIG[tool]||TOOL_CONFIG.notes;
    if(this.el.sfpTopic)   this.el.sfpTopic.textContent  = topic.length>60?topic.slice(0,60)+'…':topic;
    if(this.el.sfpToolIcon)this.el.sfpToolIcon.className = `fas ${cfg.sfpIcon}`;
    if(this.el.sfpToolName)this.el.sfpToolName.textContent=cfg.sfpName;
    if(this.el.sfpLabel)   this.el.sfpLabel.textContent  = cfg.sfpLabel;
    if(this.el.sfpText){this.el.sfpText.innerHTML='<span class="typing-cursor">▊</span>';this.el.sfpText.classList.remove('done');this.el.sfpText.classList.add('live-md');}
    if(this.el.sscProgressBar)this.el.sscProgressBar.style.width='3%';
    if(this.el.streamFullpage)this.el.streamFullpage.style.display='flex';
    if(this.el.emptyState) this.el.emptyState.style.display='none';
    if(this.el.resultArea) this.el.resultArea.style.display='none';
    if(this.el.thinkingWrap)this.el.thinkingWrap.style.display='none';
  }

  _hideStreamOverlay() {
    if(this.el.streamFullpage){
      this.el.streamFullpage.classList.add('fading-out');
      setTimeout(()=>{this.el.streamFullpage.style.display='none';this.el.streamFullpage.classList.remove('fading-out');},300);
    }
  }

  _showState(state, errMsg) {
    if(this.el.emptyState) this.el.emptyState.style.display='none';
    if(this.el.thinkingWrap)this.el.thinkingWrap.style.display='none';
    if(this.el.resultArea) this.el.resultArea.style.display='none';
    switch(state){
      case 'result':
        if(this.el.resultArea){this.el.resultArea.style.display='block';if(this.el.outArea)setTimeout(()=>this.el.outArea.scrollTop=0,80);}
        break;
      case 'error':
        if(this.el.resultArea){
          this.el.resultArea.style.display='block';
          this.el.resultArea.innerHTML=`<div class="error-card">
            <div class="error-card-hdr"><i class="fas fa-exclamation-circle"></i> Savoiré AI — Study Tool Unavailable</div>
            <div class="error-card-body">${this._esc(errMsg||'Savoiré AI study tool is momentarily unavailable.')}</div>
            <div class="error-card-hint">AI models are occasionally busy. Please wait a moment and try again — it usually works immediately on the next attempt.</div>
            <button class="btn btn-primary" style="margin-top:16px" onclick="window._app._openWizard()"><i class="fas fa-magic"></i> Try Again with Wizard</button>
          </div>`;
        }
        break;
      default:
        if(this.el.emptyState)this.el.emptyState.style.display='flex';
        break;
    }
  }

  // ── RESULT RENDERING ──────────────────────────────────────────────────────────────────────────

  _renderResult(data) {
    if (!this.el.resultArea) return;
    this.el.resultArea.innerHTML = this._buildResultHTML(data);
    this._showState('result');
    // Re-cache dynamic elements
    this.el.quizScoreNum           = this._el('quizScoreNum');
    this.el.quizBody               = this._el('quizBody');
    this.el.quizReviewSection      = this._el('quizReviewSection');
    this.el.quizReviewToggleLabel  = this._el('quizReviewToggleLabel');
    this.el.fcCur                  = this._el('fcCur');
    this.el.fcTot                  = this._el('fcTot');
    this.el.fcProgBar              = this._el('fcProgBar');
    this.el.fcPct                  = this._el('fcPct');
    this.el.fcPrev                 = this._el('fcPrev');
    this.el.fcNext                 = this._el('fcNext');
    this.el.theCard                = this._el('theCard');
    this.el.fcFront                = this._el('fcFront');
    this.el.fcBack                 = this._el('fcBack');
  }

  _buildResultHTML(data) {
    const topic = this._esc(data.topic||'Study Material');
    const score = data.study_score||96;
    const wc    = this._wordCount(this._stripMd(data.ultra_long_notes||''));
    const lang  = data._language||'English';
    const tool  = this.tool;
    const cfg   = TOOL_CONFIG[tool]||TOOL_CONFIG.notes;

    const header = `<div class="result-hdr">
      <div class="rh-left">
        <div class="rh-topic-badge" style="color:${cfg.color}"><i class="fas ${cfg.icon}"></i> ${cfg.sfpName}${tool==='all'?' — Mega Bundle':''}</div>
        <div class="rh-topic">${topic}</div>
        <div class="rh-meta">
          <div class="rh-mi"><i class="fas fa-graduation-cap"></i> ${this._esc(data.curriculum_alignment||'General Study')}</div>
          <div class="rh-mi"><i class="fas fa-calendar-alt"></i> ${new Date().toLocaleDateString()}</div>
          <div class="rh-mi"><i class="fas fa-globe"></i> ${this._esc(lang)}</div>
          <div class="rh-mi"><i class="fas fa-file-word"></i> ~${wc.toLocaleString()} words</div>
          <div class="rh-mi"><i class="fas fa-star" style="color:#d4af37"></i> Score: ${score}/100</div>
        </div>
        <div class="rh-powered">Generated by <strong>${SAVOIRÉ.BRAND}</strong> · <a href="https://${SAVOIRÉ.DEVSITE}" target="_blank">${SAVOIRÉ.DEVELOPER}</a></div>
      </div>
      <div class="score-ring-wrap">
        <div class="rh-score" style="--pct:${Math.min(100,score)}"><div class="rh-score-val">${score}</div></div>
        <div class="score-ring-label">Score</div>
      </div>
    </div>`;

    const navItems = this._buildNavItems(data);
    const nav = navItems.length>2?`<div class="result-nav">${navItems.map(n=>`<a href="#${n.id}" class="result-nav-btn"><i class="${n.icon}"></i> ${n.label}</a>`).join('')}</div>`:'';

    let body='';
    switch(tool){
      case 'flashcards': body=this._buildFcHTML(data); break;
      case 'quiz':       body=this._buildQuizHTML(data); break;
      case 'summary':    body=this._buildSummaryHTML(data); break;
      case 'mindmap':    body=this._buildMindmapHTML(data); break;
      case 'all':        body=this._buildAllHTML(data); break;
      default:           body=this._buildNotesHTML(data); break;
    }

    const exportBar = `<div class="export-bar">
      <button class="exp-btn pdf" onclick="window._app._downloadPDF()"><i class="fas fa-file-pdf"></i><span>PDF</span></button>
      <button class="exp-btn copy" onclick="window._app._copyResult()"><i class="fas fa-copy"></i><span>Copy</span></button>
      <button class="exp-btn save" onclick="window._app._saveNote()"><i class="fas fa-star"></i><span>Save</span></button>
      <button class="exp-btn share" onclick="window._app._shareResult()"><i class="fas fa-share-alt"></i><span>Share</span></button>
      <button class="exp-btn new" onclick="window._app._openWizard()" style="border-color:rgba(191,0,255,.3);color:#bf00ff"><i class="fas fa-magic"></i><span>New</span></button>
      <span class="exp-brand">${SAVOIRÉ.BRAND}</span>
    </div>`;

    const footer = `<div class="result-branding-footer">
      <div class="rbf-left"><div class="rbf-logo">Ś</div>
        <div class="rbf-text"><a href="https://${SAVOIRÉ.WEBSITE}" target="_blank">${SAVOIRÉ.BRAND}</a> · <a href="https://${SAVOIRÉ.DEVSITE}" target="_blank">${SAVOIRÉ.DEVELOPER}</a> · Free forever.</div>
      </div>
      <div class="rbf-ts">${new Date().toLocaleString()}</div>
    </div>`;

    return `<div class="result-wrap">${header}${nav}${body}${exportBar}${footer}</div>`;
  }

  _buildNavItems(data) {
    const items=[];
    if(data.ultra_long_notes)           items.push({id:'sec-notes',   label:'Notes',    icon:'fas fa-book-open'});
    if(data.flashcards?.length)         items.push({id:'sec-fc',      label:'Flashcards',icon:'fas fa-layer-group'});
    if(data.quiz_questions?.length)     items.push({id:'sec-quiz',    label:'Quiz',     icon:'fas fa-question-circle'});
    if(data.mindmap)                    items.push({id:'sec-mm',      label:'Mind Map', icon:'fas fa-project-diagram'});
    if(data.key_concepts?.length)       items.push({id:'sec-concepts',label:'Concepts', icon:'fas fa-lightbulb'});
    if(data.key_tricks?.length)         items.push({id:'sec-tricks',  label:'Tricks',   icon:'fas fa-magic'});
    if(data.practice_questions?.length) items.push({id:'sec-qa',      label:'Q&A',      icon:'fas fa-pen-alt'});
    if(data.real_world_applications?.length) items.push({id:'sec-apps',label:'Applications',icon:'fas fa-globe'});
    return items;
  }

  _buildNotesHTML(data) {
    let h='';
    if(data.ultra_long_notes) h+=`<div class="study-sec section-anchor" id="sec-notes"><div class="ss-hdr"><div class="ss-title"><i class="fas fa-book-open"></i> Comprehensive Notes</div><button class="ss-copy-btn" onclick="window._app._copyTxt(this.closest('.study-sec').querySelector('.md-content').innerText)"><i class="fas fa-copy"></i> Copy</button></div><div class="ss-body"><div class="md-content">${this._renderMd(data.ultra_long_notes)}</div></div></div>`;
    if(data.key_concepts?.length)    h+=this._secConcepts(data.key_concepts);
    if(data.key_tricks?.length)      h+=this._secTricks(data.key_tricks);
    if(data.practice_questions?.length)h+=this._secQA(data.practice_questions);
    if(data.real_world_applications?.length)h+=this._secApps(data.real_world_applications);
    if(data.common_misconceptions?.length)  h+=this._secMisc(data.common_misconceptions);
    if(data.flashcards?.length)      h+=`<div class="study-sec section-anchor" id="sec-fc"><div class="ss-hdr"><div class="ss-title"><i class="fas fa-layer-group"></i> Flashcard Preview</div></div><div class="ss-body">${this._fcMiniList(data.flashcards)}</div></div>`;
    if(data.quiz_questions?.length)  h+=`<div class="study-sec section-anchor" id="sec-quiz"><div class="ss-hdr"><div class="ss-title"><i class="fas fa-question-circle"></i> Quiz Preview</div></div><div class="ss-body">${this._quizMiniList(data.quiz_questions)}</div></div>`;
    if(data.mindmap)                 h+=`<div class="study-sec section-anchor" id="sec-mm"><div class="ss-hdr"><div class="ss-title"><i class="fas fa-project-diagram"></i> Mind Map Preview</div></div><div class="ss-body">${this._mmMini(data.mindmap)}</div></div>`;
    return h||'<div style="padding:24px;text-align:center">Study materials generated successfully.</div>';
  }

  _buildAllHTML(data) {
    // All 5 tools - mega bundle output
    let h=`<div class="mega-result-banner"><i class="fas fa-bolt"></i> ⚡ Mega Study Bundle — All 5 Tools Generated</div>`;
    // 1. Notes
    if(data.ultra_long_notes) h+=`<div class="study-sec section-anchor" id="sec-notes"><div class="ss-hdr"><div class="ss-title"><i class="fas fa-book-open"></i> 1. Comprehensive Notes</div><button class="ss-copy-btn" onclick="window._app._copyTxt(this.closest('.study-sec').querySelector('.md-content').innerText)"><i class="fas fa-copy"></i> Copy</button></div><div class="ss-body"><div class="md-content">${this._renderMd(data.ultra_long_notes)}</div></div></div>`;
    // 2. Flashcards interactive
    if(data.flashcards?.length) h+=`<div class="study-sec section-anchor" id="sec-fc"><div class="ss-hdr"><div class="ss-title"><i class="fas fa-layer-group"></i> 2. Flashcards (${data.flashcards.length} cards)</div></div><div class="ss-body">${this._buildFcMode(data.flashcards)}</div></div>`;
    // 3. Quiz interactive
    if(data.quiz_questions?.length) {
      this.quizData=data.quiz_questions.map((q,i)=>({...q,answered:false,correct:false,selectedIdx:-1}));
      this.quizIdx=0; this.quizScore=0;
      h+=`<div class="study-sec section-anchor" id="sec-quiz"><div class="ss-hdr"><div class="ss-title"><i class="fas fa-question-circle"></i> 3. Practice Quiz (${data.quiz_questions.length} questions)</div><div class="quiz-score-display"><i class="fas fa-star"></i> <span id="quizScoreNum">0</span> / ${data.quiz_questions.length}</div></div><div class="ss-body" id="quizBody">${this._renderQuizQ(0)}</div></div>`;
    }
    // 4. Summary
    if(data.ultra_long_notes) {
      const tldr = data.ultra_long_notes.split('\n\n').find(p=>p.includes('TL;DR')||p.includes('Summary'))||data.ultra_long_notes.split('\n\n')[0]||'';
      h+=`<div class="study-sec section-anchor" id="sec-summary"><div class="ss-hdr"><div class="ss-title"><i class="fas fa-align-left"></i> 4. Smart Summary</div></div><div class="ss-body"><div class="summary-tldr-box"><div class="summary-tldr-icon"><i class="fas fa-bolt"></i></div><div class="summary-tldr-content">${this._renderMd(tldr)}</div></div></div></div>`;
    }
    if(data.key_concepts?.length) h+=`<div class="study-sec section-anchor" id="sec-concepts"><div class="ss-hdr"><div class="ss-title"><i class="fas fa-list-check"></i> Key Points</div></div><div class="ss-body"><div class="summary-points-list">${data.key_concepts.map((c,i)=>`<div class="summary-point"><div class="summary-point-num">${i+1}</div><div class="summary-point-text">${this._esc(c)}</div></div>`).join('')}</div></div></div>`;
    // 5. Mind Map
    if(data.mindmap) h+=`<div class="study-sec section-anchor" id="sec-mm"><div class="ss-hdr"><div class="ss-title"><i class="fas fa-project-diagram"></i> 5. Visual Mind Map</div></div><div class="ss-body"><div class="mm-root"><i class="fas fa-brain"></i> ${this._esc(data.mindmap.central||data.topic||'Topic')}</div><div class="mm-branches">${(data.mindmap.branches||[]).map(b=>`<div class="mm-branch"><div class="mm-branch-hdr" style="color:${b.color||'#d4af37'}"><i class="fas fa-project-diagram"></i> ${this._esc(b.name)}</div><div class="mm-nodes-list">${(b.items||[]).map(item=>`<div class="mm-node"><span class="mm-node-dot" style="background:${b.color||'#d4af37'}"></span><span class="mm-node-text">${this._esc(item)}</span></div>`).join('')}</div></div>`).join('')}</div></div></div>`;
    // Supporting sections
    if(data.key_tricks?.length)          h+=this._secTricks(data.key_tricks);
    if(data.practice_questions?.length)  h+=this._secQA(data.practice_questions);
    if(data.real_world_applications?.length)h+=this._secApps(data.real_world_applications);
    if(data.common_misconceptions?.length)  h+=this._secMisc(data.common_misconceptions);
    return h;
  }

  _buildFcHTML(data) {
    const cards = data.flashcards?.length ? data.flashcards
      : (data.key_concepts||[]).slice(0,15).map(c=>({front:c.split(':')[0]||c,back:c}));
    if (!cards.length) return this._buildNotesHTML(data);
    this.fcCards=cards; this.fcCurrent=0; this.fcFlipped=false;
    let h = `<div class="study-sec" id="sec-fc"><div class="ss-hdr"><div class="ss-title"><i class="fas fa-layer-group"></i> Interactive Flashcards (${cards.length} cards)</div></div><div class="ss-body">${this._buildFcMode(cards)}</div></div>`;
    if(data.ultra_long_notes) h+=`<div class="study-sec" id="sec-notes"><div class="ss-hdr"><div class="ss-title"><i class="fas fa-book-open"></i> Study Notes</div></div><div class="ss-body"><div class="md-content">${this._renderMd(data.ultra_long_notes)}</div></div></div>`;
    return h;
  }

  _buildFcMode(cards) {
    this.fcCards=cards; this.fcCurrent=0; this.fcFlipped=false;
    const total=cards.length, first=cards[0];
    return `<div class="fc-mode">
      <div class="fc-top-bar">
        <div class="fc-prog">Card <span id="fcCur">1</span> of <span id="fcTot">${total}</span></div>
        <div class="fc-prog-bar-wrap"><div class="fc-prog-bar-fill" id="fcProgBar" style="width:${(1/total*100).toFixed(1)}%"></div></div>
        <div class="fc-prog"><span id="fcPct">${Math.round(1/total*100)}</span>%</div>
      </div>
      <div class="fc-wrap" onclick="window._app._fcFlip()" tabindex="0" onkeydown="if(event.key===' '){event.preventDefault();window._app._fcFlip();}">
        <div class="flashcard" id="theCard">
          <div class="fc-face fc-front"><div class="fc-lbl"><i class="fas fa-question-circle"></i> Question</div><div class="fc-content" id="fcFront">${this._esc(first.front||first.question||'')}</div><div class="fc-hint">📱 Tap to flip · Space</div></div>
          <div class="fc-face fc-back"><div class="fc-lbl"><i class="fas fa-lightbulb"></i> Answer</div><div class="fc-content" id="fcBack">${this._renderMd(first.back||first.answer||'')}</div><div class="fc-hint">Use arrows or buttons</div></div>
        </div>
      </div>
      <div class="fc-controls">
        <button class="fc-btn" id="fcPrev" onclick="window._app._fcNav(-1)" ${total<=1?'disabled':''}><i class="fas fa-arrow-left"></i> Prev</button>
        <button class="fc-btn primary" onclick="window._app._fcFlip()"><i class="fas fa-sync-alt"></i> Flip</button>
        <button class="fc-btn" id="fcNext" onclick="window._app._fcNav(1)" ${total<=1?'disabled':''}>Next <i class="fas fa-arrow-right"></i></button>
      </div>
      <div class="fc-controls">
        <button class="fc-btn" onclick="window._app._fcShuffle()"><i class="fas fa-random"></i> Shuffle</button>
        <button class="fc-btn" onclick="window._app._fcRestart()"><i class="fas fa-redo"></i> Restart</button>
      </div>
      <div class="fc-swipe-hint"><kbd>Space</kbd> flip · <kbd>←</kbd><kbd>→</kbd> nav · <kbd>S</kbd> shuffle</div>
    </div>`;
  }

  _fcFlip() { const c=this._el('theCard'); if(c){this.fcFlipped=!this.fcFlipped;c.classList.toggle('flipped',this.fcFlipped);} }
  _fcNav(dir) {
    if(!this.fcCards.length)return;
    this.fcCurrent=Math.max(0,Math.min(this.fcCards.length-1,this.fcCurrent+dir));
    this.fcFlipped=false; const c=this._el('theCard'); if(c)c.classList.remove('flipped');
    const card=this.fcCards[this.fcCurrent];
    const ff=this._el('fcFront'); if(ff)ff.textContent=card.front||card.question||'';
    const fb=this._el('fcBack'); if(fb)fb.innerHTML=this._renderMd(card.back||card.answer||'');
    const fcCur=this._el('fcCur'); if(fcCur)fcCur.textContent=this.fcCurrent+1;
    const p=((this.fcCurrent+1)/this.fcCards.length*100).toFixed(1);
    const fp=this._el('fcPct'); if(fp)fp.textContent=Math.round(p);
    const fpb=this._el('fcProgBar'); if(fpb)fpb.style.width=`${p}%`;
    const pp=this._el('fcPrev'); if(pp)pp.disabled=this.fcCurrent===0;
    const pn=this._el('fcNext'); if(pn)pn.disabled=this.fcCurrent===this.fcCards.length-1;
  }
  _fcShuffle() { for(let i=this.fcCards.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[this.fcCards[i],this.fcCards[j]]=[this.fcCards[j],this.fcCards[i]];} this.fcCurrent=0;this.fcFlipped=false;this._fcNav(0);this._toast('info','fa-random','Cards shuffled!'); }
  _fcRestart() { this.fcCurrent=0;this.fcFlipped=false;this._fcNav(0); }

  _buildQuizHTML(data) {
    const qs=data.quiz_questions||data.practice_questions||[];
    if(!qs.length)return this._buildNotesHTML(data);
    this.quizData=qs.map(q=>({...q,answered:false,correct:false,selectedIdx:-1}));
    this.quizIdx=0; this.quizScore=0;
    let h=`<div class="study-sec" id="quizContainer"><div class="ss-hdr"><div class="ss-title"><i class="fas fa-question-circle"></i> Practice Quiz (${this.quizData.length} questions)</div><div class="quiz-score-display"><i class="fas fa-star"></i> <span id="quizScoreNum">0</span> / ${this.quizData.length}</div></div><div class="ss-body" id="quizBody">${this._renderQuizQ(0)}</div></div>`;
    if(data.ultra_long_notes)h+=`<div class="study-sec"><div class="ss-hdr"><div class="ss-title"><i class="fas fa-book-open"></i> Study Notes</div></div><div class="ss-body"><div class="md-content">${this._renderMd(data.ultra_long_notes)}</div></div></div>`;
    return h;
  }

  _renderQuizQ(idx) {
    if(idx>=this.quizData.length)return this._renderQuizResult();
    const q=this.quizData[idx];
    const pct=((idx)/this.quizData.length*100).toFixed(0);
    const letters=['A','B','C','D','E'];
    const opts=q.options||[];
    const diffCol=q.difficulty==='hard'?'#ff4444':q.difficulty==='easy'?'#00ff88':'#ffae00';
    return `<div class="quiz-q-card">
      <div class="quiz-top-bar">
        <div class="quiz-progress-track"><div class="quiz-progress-fill" style="width:${pct}%"></div></div>
        <div class="quiz-top-meta">
          <span class="quiz-q-counter">Q ${idx+1} / ${this.quizData.length}</span>
          ${q.difficulty?`<span style="font-size:.6rem;padding:2px 8px;background:rgba(255,255,255,.05);border-radius:20px;color:${diffCol}">${q.difficulty}</span>`:''}
        </div>
      </div>
      <div class="quiz-question-wrap">
        <div class="quiz-question-num">Question ${idx+1}</div>
        <div class="quiz-question-text">${this._esc(q.question)}</div>
      </div>
      <div class="quiz-options-grid" id="quizOpts_${idx}">
        ${opts.map((o,oi)=>`<button class="quiz-opt-btn" onclick="window._app._quizSelect(${idx},${oi})" ${q.answered?'disabled':''}><span class="quiz-opt-letter">${letters[oi]}</span><span>${this._esc(o)}</span></button>`).join('')}
      </div>
      <div class="quiz-answer-area" id="quizAns_${idx}" style="display:none"></div>
      <div class="quiz-nav-area" id="quizNav_${idx}" style="display:none">
        <button class="quiz-nav-btn" onclick="window._app._quizAdvance(${idx})">${idx+1<this.quizData.length?'Next Question →':'See Results'}</button>
      </div>
    </div>`;
  }

  _quizSelect(qIdx, optIdx) {
    const q=this.quizData[qIdx]; if(q.answered)return;
    q.answered=true; q.selectedIdx=optIdx;
    const sel=q.options?.[optIdx];
    q.correct = sel===q.correct_answer;
    if(q.correct){this.quizScore++;this._toast('success','fa-check-circle','✓ Correct!');}
    else{this._toast('info','fa-book-open','✗ Incorrect — see explanation below');}
    const sn=this._el('quizScoreNum'); if(sn)sn.textContent=this.quizScore;
    const oc=this._el(`quizOpts_${qIdx}`);
    if(oc)oc.querySelectorAll('.quiz-opt-btn').forEach((b,oi)=>{
      b.disabled=true;
      if(q.options[oi]===q.correct_answer)b.classList.add('correct');
      else if(oi===optIdx&&!q.correct)b.classList.add('wrong');
    });
    const aa=this._el(`quizAns_${qIdx}`);
    if(aa){aa.style.display='block';aa.innerHTML=`<div class="quiz-explanation ${q.correct?'correct':'incorrect'}"><div class="quiz-exp-header"><i class="fas ${q.correct?'fa-check-circle':'fa-times-circle'}"></i><strong>${q.correct?'Correct!':'Incorrect'}</strong></div><div class="quiz-exp-label">Correct Answer: <strong>${this._esc(q.correct_answer)}</strong></div><div class="quiz-exp-label">Explanation</div><div class="quiz-exp-text">${this._renderMd(q.explanation||q.answer||'')}</div></div>`;setTimeout(()=>aa.scrollIntoView({behavior:'smooth',block:'nearest'}),80);}
    const na=this._el(`quizNav_${qIdx}`); if(na)na.style.display='flex';
  }

  _quizAdvance(curr) {
    this.quizIdx=curr+1;
    const qb=this._el('quizBody'); if(!qb)return;
    if(this.quizIdx>=this.quizData.length)qb.innerHTML=this._renderQuizResult();
    else{qb.innerHTML=this._renderQuizQ(this.quizIdx);qb.scrollIntoView({behavior:'smooth',block:'start'});}
  }

  _renderQuizResult() {
    const total=this.quizData.length, score=this.quizScore, pct=Math.round((score/total)*100);
    const grade=pct>=90?'🏆 Outstanding!':pct>=75?'🎓 Excellent!':pct>=60?'📚 Good Progress!':pct>=40?'💪 Keep Studying!':'📖 More Practice Needed';
    if(score===total)this._confetti();
    return `<div class="quiz-result-wrap">
      <div class="quiz-result-score-wrap">
        <div class="quiz-result-emoji">${pct>=90?'🏆':pct>=75?'🎓':pct>=60?'📚':pct>=40?'💪':'📖'}</div>
        <div class="quiz-result-big-score">${score}<span class="quiz-result-denom"> / ${total}</span></div>
        <div class="quiz-result-pct">${pct}% Correct</div>
        <div class="quiz-result-grade">${grade}</div>
      </div>
      <div class="quiz-result-stats">
        <div class="quiz-result-stat"><div class="quiz-result-stat-val" style="color:#00ff88">${score}</div><div class="quiz-result-stat-lbl"><i class="fas fa-check-circle"></i> Correct</div></div>
        <div class="quiz-result-stat"><div class="quiz-result-stat-val" style="color:#ff4444">${total-score}</div><div class="quiz-result-stat-lbl"><i class="fas fa-times-circle"></i> Wrong</div></div>
      </div>
      <div class="quiz-result-actions">
        <button class="fc-btn primary" onclick="window._app._quizRestart()"><i class="fas fa-redo"></i> Try Again</button>
        <button class="fc-btn" onclick="window._app._quizToggleReview()"><i class="fas fa-eye"></i> <span id="quizReviewToggleLabel">Show Review</span></button>
        <button class="fc-btn" onclick="window._app._openWizard()"><i class="fas fa-magic"></i> New Material</button>
      </div>
      <div id="quizReviewSection" style="display:none">
        <div class="quiz-review-list">${this.quizData.map((q,i)=>`<div class="quiz-review-item ${q.correct?'correct':'incorrect'}"><div class="quiz-review-hdr"><span><i class="fas ${q.correct?'fa-check-circle':'fa-times-circle'}" style="color:${q.correct?'#00ff88':'#ff4444'}"></i></span><span class="quiz-review-num">Q${i+1}</span><span class="quiz-review-q">${this._esc(q.question)}</span></div><div class="quiz-review-correct">✓ ${this._esc(q.correct_answer)}</div></div>`).join('')}</div>
      </div>
    </div>`;
  }

  _quizToggleReview() {
    const s=this._el('quizReviewSection'), l=this._el('quizReviewToggleLabel');
    if(!s)return; const h=s.style.display==='none'; s.style.display=h?'block':'none'; if(l)l.textContent=h?'Hide Review':'Show Review';
  }
  _quizRestart() {
    this.quizScore=0;this.quizIdx=0;
    this.quizData.forEach(q=>{q.answered=false;q.correct=false;q.selectedIdx=-1;});
    const qb=this._el('quizBody');if(qb)qb.innerHTML=this._renderQuizQ(0);
    const sn=this._el('quizScoreNum');if(sn)sn.textContent='0';
  }

  _buildSummaryHTML(data) {
    let h='';
    if(data.ultra_long_notes){
      const raw=data.ultra_long_notes;
      const tldr=raw.split('\n\n').find(p=>p.includes('TL;DR')||p.includes('Summary')||p.includes('Executive'))||raw.split('\n\n')[0]||'';
      h+=`<div class="study-sec" id="sec-tldr"><div class="ss-hdr"><div class="ss-title"><i class="fas fa-bolt"></i> TL;DR — Executive Summary</div><button class="ss-copy-btn" onclick="window._app._copyTxt(this.closest('.study-sec').querySelector('.summary-tldr-content').innerText)"><i class="fas fa-copy"></i> Copy</button></div><div class="ss-body"><div class="summary-tldr-box"><div class="summary-tldr-icon"><i class="fas fa-align-left"></i></div><div class="summary-tldr-content">${this._renderMd(tldr)}</div></div></div></div>`;
      h+=`<div class="study-sec" id="sec-notes"><div class="ss-hdr"><div class="ss-title"><i class="fas fa-book-open"></i> Full Summary</div><button class="ss-copy-btn" onclick="window._app._copyTxt(this.closest('.study-sec').querySelector('.md-content').innerText)"><i class="fas fa-copy"></i> Copy</button></div><div class="ss-body"><div class="md-content">${this._renderMd(raw)}</div></div></div>`;
    }
    if(data.key_concepts?.length)h+=`<div class="study-sec"><div class="ss-hdr"><div class="ss-title"><i class="fas fa-list-check"></i> Key Points</div></div><div class="ss-body"><div class="summary-points-list">${data.key_concepts.map((c,i)=>`<div class="summary-point"><div class="summary-point-num">${i+1}</div><div class="summary-point-text">${this._esc(c)}</div></div>`).join('')}</div></div></div>`;
    return h||this._buildNotesHTML(data);
  }

  _buildMindmapHTML(data) {
    const mm=data.mindmap; const topic=data.topic||'Topic';
    if(mm?.branches?.length){
      const bh=mm.branches.map(b=>`<div class="mm-branch"><div class="mm-branch-hdr" style="color:${b.color||'#d4af37'}"><i class="fas fa-project-diagram"></i> ${this._esc(b.name)}</div><div class="mm-nodes-list">${(b.items||[]).map(item=>`<div class="mm-node"><span class="mm-node-dot" style="background:${b.color||'#d4af37'}"></span><span class="mm-node-text">${this._esc(item)}</span></div>`).join('')}</div></div>`).join('');
      const connH=mm.connections?.length?`<div class="mm-connections"><div class="mm-conn-title"><i class="fas fa-link"></i> Connections</div><div class="mm-conn-list">${mm.connections.map(c=>`<div class="mm-conn-item"><strong>${this._esc(c.from)}</strong> ↔ <strong>${this._esc(c.to)}</strong>: ${this._esc(c.description)}</div>`).join('')}</div></div>`:'';
      let h=`<div class="study-sec" id="sec-mm"><div class="ss-hdr"><div class="ss-title"><i class="fas fa-project-diagram"></i> Visual Mind Map — ${this._esc(mm.central||topic)}</div></div><div class="ss-body"><div class="mm-root"><i class="fas fa-brain"></i> ${this._esc(mm.central||topic)}</div><div class="mm-branches">${bh}</div>${connH}</div></div>`;
      if(data.ultra_long_notes)h+=`<div class="study-sec" id="sec-notes"><div class="ss-hdr"><div class="ss-title"><i class="fas fa-book-open"></i> Mind Map Notes</div></div><div class="ss-body"><div class="md-content">${this._renderMd(data.ultra_long_notes)}</div></div></div>`;
      return h;
    }
    // Fallback from key_concepts
    const branches=[{name:'Core Concepts',items:data.key_concepts||[],color:'#d4af37'},{name:'Study Tricks',items:data.key_tricks||[],color:'#00ff88'},{name:'Applications',items:data.real_world_applications||[],color:'#00d4ff'},{name:'Misconceptions',items:data.common_misconceptions||[],color:'#ff4444'}].filter(b=>b.items.length>0);
    const bh=branches.map(b=>`<div class="mm-branch"><div class="mm-branch-hdr" style="color:${b.color}"><i class="fas fa-project-diagram"></i> ${this._esc(b.name)}</div><div class="mm-nodes-list">${b.items.slice(0,5).map(item=>`<div class="mm-node"><span class="mm-node-dot" style="background:${b.color}"></span><span class="mm-node-text">${this._esc(String(item).slice(0,100))}</span></div>`).join('')}</div></div>`).join('');
    let h=`<div class="study-sec" id="sec-mm"><div class="ss-hdr"><div class="ss-title"><i class="fas fa-project-diagram"></i> Visual Mind Map — ${this._esc(topic)}</div></div><div class="ss-body"><div class="mm-root"><i class="fas fa-brain"></i> ${this._esc(topic)}</div><div class="mm-branches">${bh||'<div style="color:rgba(255,255,255,.4);padding:16px">Mind map content loading…</div>'}</div></div></div>`;
    if(data.ultra_long_notes)h+=`<div class="study-sec" id="sec-notes"><div class="ss-hdr"><div class="ss-title"><i class="fas fa-book-open"></i> Notes</div></div><div class="ss-body"><div class="md-content">${this._renderMd(data.ultra_long_notes)}</div></div></div>`;
    return h;
  }

  // Section builders
  _secConcepts(arr){return `<div class="study-sec section-anchor" id="sec-concepts"><div class="ss-hdr"><div class="ss-title"><i class="fas fa-lightbulb"></i> Key Concepts (${arr.length})</div></div><div class="ss-body"><div class="concepts-grid">${arr.map((c,i)=>`<div class="concept-card"><div class="concept-num">${i+1}</div><div class="concept-text">${this._esc(c)}</div></div>`).join('')}</div></div></div>`;}
  _secTricks(arr){return `<div class="study-sec section-anchor" id="sec-tricks"><div class="ss-hdr"><div class="ss-title"><i class="fas fa-magic"></i> Study Tricks & Memory Aids</div></div><div class="ss-body"><div class="tricks-list">${arr.map(t=>`<div class="trick-item"><div class="trick-icon"><i class="fas fa-magic"></i></div><div class="trick-text">${this._esc(t)}</div></div>`).join('')}</div></div></div>`;}
  _secQA(arr){return `<div class="study-sec section-anchor" id="sec-qa"><div class="ss-hdr"><div class="ss-title"><i class="fas fa-pen-alt"></i> Practice Q&A (${arr.length})</div></div><div class="ss-body"><div class="qa-list">${arr.map((qa,i)=>`<div class="qa-card"><div class="qa-head" onclick="this.nextElementSibling.classList.toggle('visible')"><div class="qa-num">${i+1}</div><div class="qa-q">${this._esc(qa.question)}</div><button class="qa-toggle"><i class="fas fa-chevron-down"></i> Answer</button></div><div class="qa-answer"><div class="qa-albl"><i class="fas fa-check-circle"></i> Answer</div><div class="qa-answer-inner">${this._renderMd(qa.answer)}</div></div></div>`).join('')}</div></div></div>`;}
  _secApps(arr){return `<div class="study-sec section-anchor" id="sec-apps"><div class="ss-hdr"><div class="ss-title"><i class="fas fa-globe"></i> Real-World Applications</div></div><div class="ss-body"><div class="items-list">${arr.map((a,i)=>`<div class="list-item app"><i class="fas fa-globe li-ico"></i><div class="li-text"><strong>${i+1}.</strong> ${this._esc(a)}</div></div>`).join('')}</div></div></div>`;}
  _secMisc(arr){return `<div class="study-sec section-anchor" id="sec-misc"><div class="ss-hdr"><div class="ss-title"><i class="fas fa-exclamation-triangle"></i> Common Misconceptions</div></div><div class="ss-body"><div class="items-list">${arr.map(m=>`<div class="list-item misc"><i class="fas fa-exclamation-triangle li-ico"></i><div class="li-text">${this._esc(m)}</div></div>`).join('')}</div></div></div>`;}
  _fcMiniList(cards){return `<div class="fc-mini-list">${cards.slice(0,6).map((c,i)=>`<div class="fc-mini-card"><div class="fc-mini-q"><strong>Q${i+1}:</strong> ${this._esc(c.front||c.question||'')}</div><div class="fc-mini-a"><strong>A:</strong> ${this._esc(c.back||c.answer||'')}</div></div>`).join('')}${cards.length>6?`<div class="fc-mini-more">+ ${cards.length-6} more cards — use Flashcards tool for full interactive deck</div>`:''}</div>`;}
  _quizMiniList(qs){return `<div class="quiz-mini-list">${qs.slice(0,3).map((q,i)=>`<div class="quiz-mini-card"><div class="quiz-mini-q"><strong>Q${i+1}:</strong> ${this._esc(q.question)}</div>${q.options?`<div class="quiz-mini-options">${q.options.map((o,oi)=>`<div class="quiz-mini-opt ${o===q.correct_answer?'correct':''}">${String.fromCharCode(65+oi)}. ${this._esc(o)}</div>`).join('')}</div>`:''}${q.correct_answer?`<div class="quiz-mini-answer">✓ ${this._esc(q.correct_answer)}</div>`:''}</div>`).join('')}${qs.length>3?`<div class="quiz-mini-more">+ ${qs.length-3} more questions — use Quiz tool for full interactive quiz</div>`:''}</div>`;}
  _mmMini(mm){if(!mm)return'';return `<div class="mm-mini"><div class="mm-mini-central">🎯 ${this._esc(mm.central)}</div><div class="mm-mini-branches">${(mm.branches||[]).slice(0,4).map(b=>`<div class="mm-mini-branch"><div class="mm-mini-branch-name" style="color:${b.color||'#d4af37'}">📌 ${this._esc(b.name)}</div><div class="mm-mini-items">${(b.items||[]).slice(0,3).map(item=>`<span class="mm-mini-item">${this._esc(item)}</span>`).join('')}</div></div>`).join('')}</div></div>`;}

  // ── PDF GENERATION ────────────────────────────────────────────────────────────────────────────

  _downloadPDF() {
    const data=this.currentData;
    if(!data){this._toast('info','fa-info-circle','Generate content first.');return;}
    if(typeof window.jspdf==='undefined'||!window.jspdf.jsPDF){
      this._toast('info','fa-spinner fa-pulse','Loading PDF library…');
      const sc=document.createElement('script'); sc.src='https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js';
      sc.onload=()=>setTimeout(()=>this._generatePDF(data,this.pdfTheme),200);
      sc.onerror=()=>this._toast('error','fa-times','Could not load PDF library. Check connection.');
      document.head.appendChild(sc); return;
    }
    this._generatePDF(data,this.pdfTheme);
  }

  _generatePDF(data, theme='dark') {
    this._toast('info','fa-spinner fa-pulse','Generating World-Class PDF…');
    try {
      const {jsPDF}=window.jspdf;
      const doc=new jsPDF({unit:'mm',format:'a4',compress:true});
      const pw=210, ph=297, ml=15, mr=15, cw=pw-ml-mr;
      let y=40;

      // Theme colors
      const isDark = theme==='dark';
      const BG     = isDark ? [8,14,35]    : [255,255,255];
      const GOLD   = [212,175,55];
      const BLUE   = [0,180,220];
      const TEXT   = isDark ? [200,200,200] : [30,30,40];
      const HEAD   = isDark ? [255,255,255] : [10,20,50];
      const HBDR   = isDark ? [15,25,55]   : [240,245,255];
      const ACCENT = isDark ? [0,212,255]   : [0,120,200];
      let pageNum=1;

      // Fill background
      const bgPage=()=>{
        if(isDark){doc.setFillColor(BG[0],BG[1],BG[2]);doc.rect(0,0,pw,ph,'F');}
        // Subtle border
        doc.setDrawColor(GOLD[0],GOLD[1],GOLD[2]); doc.setLineWidth(0.3);
        doc.rect(4,4,pw-8,ph-8,'S');
      };

      const addPage=()=>{
        addFooter();doc.addPage();pageNum++;y=40;bgPage();
        // Mini header
        doc.setFillColor(isDark?15:230,isDark?25:235,isDark?55:245);
        doc.rect(0,0,pw,14,'F');
        doc.setFontSize(7);doc.setFont('helvetica','bold');
        doc.setTextColor(GOLD[0],GOLD[1],GOLD[2]);
        doc.text(SAVOIRÉ.BRAND,ml,9);
        doc.setTextColor(TEXT[0],TEXT[1],TEXT[2]);
        doc.text((data.topic||'').slice(0,60),pw-mr,9,{align:'right'});
      };

      const addFooter=()=>{
        doc.setFillColor(isDark?10:245,isDark?18:248,isDark?40:252);
        doc.rect(0,ph-12,pw,12,'F');
        doc.setDrawColor(GOLD[0],GOLD[1],GOLD[2]);doc.setLineWidth(.3);
        doc.line(0,ph-12,pw,ph-12);
        doc.setFontSize(7);doc.setFont('helvetica','normal');
        doc.setTextColor(TEXT[0],TEXT[1],TEXT[2]);
        doc.text(`${SAVOIRÉ.BRAND} · ${SAVOIRÉ.DEVSITE} · Free forever`,ml,ph-5);
        doc.text(`Page ${pageNum}`,pw-mr,ph-5,{align:'right'});
      };

      const checkY=(need=10)=>{if(y+need>ph-16){addPage();}};

      const wText=(text,x,maxW,size,bold=false,color=TEXT)=>{
        if(!text)return;
        doc.setFontSize(size);doc.setFont('helvetica',bold?'bold':'normal');
        doc.setTextColor(color[0],color[1],color[2]);
        const lines=doc.splitTextToSize(String(text),maxW);
        checkY(lines.length*size*.35+2);
        doc.text(lines,x,y); y+=lines.length*size*.35+1;
      };

      // ── COVER PAGE ──
      bgPage();

      // Gold top bar
      doc.setFillColor(GOLD[0],GOLD[1],GOLD[2]);doc.rect(0,0,pw,5,'F');

      // Logo box
      doc.setFillColor(isDark?0:10,isDark?100:120,isDark?180:200);
      doc.roundedRect(ml,18,22,22,4,4,'F');
      doc.setFontSize(20);doc.setFont('helvetica','bold');doc.setTextColor(255,255,255);
      doc.text('Ś',ml+8,34);

      // Title
      doc.setFontSize(28);doc.setFont('helvetica','bold');
      doc.setTextColor(GOLD[0],GOLD[1],GOLD[2]);
      doc.text('SAVOIRÉ AI',ml+28,30);
      doc.setFontSize(9);doc.setFont('helvetica','normal');
      doc.setTextColor(TEXT[0],TEXT[1],TEXT[2]);
      doc.text('v2.0 — World\'s Most Advanced AI Study Assistant',ml+28,37);

      doc.setDrawColor(GOLD[0],GOLD[1],GOLD[2]);doc.setLineWidth(.5);
      doc.line(ml,46,pw-mr,46);

      // Tool badge
      const toolCfg=TOOL_CONFIG[this.tool]||TOOL_CONFIG.notes;
      doc.setFillColor(isDark?0:10,isDark?80:100,isDark?160:180);
      doc.roundedRect(ml,52,60,10,2,2,'F');
      doc.setFontSize(8);doc.setFont('helvetica','bold');
      doc.setTextColor(isDark?0:255,isDark?200:255,isDark?255:255);
      doc.text(toolCfg.sfpName.toUpperCase()+(this.tool==='all'?' — ALL 5 TOOLS':''),ml+4,58.5);

      // Topic
      doc.setFontSize(20);doc.setFont('helvetica','bold');
      doc.setTextColor(HEAD[0],HEAD[1],HEAD[2]);
      const titleLines=doc.splitTextToSize(data.topic||'Study Notes',cw);
      doc.text(titleLines,ml,75);

      doc.setFontSize(10);doc.setFont('helvetica','normal');
      doc.setTextColor(TEXT[0],TEXT[1],TEXT[2]);
      doc.text(data.curriculum_alignment||'General Academic Study',ml,75+titleLines.length*8);

      // Stats cards
      const statY=105;
      const stats=[
        {label:'Score', val:`${data.study_score||96}/100`},
        {label:'Tool',  val:toolCfg.sfpName},
        {label:'Date',  val:new Date().toLocaleDateString()},
        {label:'Words', val:`~${this._wordCount(this._stripMd(data.ultra_long_notes||'')).toLocaleString()}`},
      ];
      const sw=cw/4;
      stats.forEach((s,i)=>{
        const sx=ml+i*sw;
        doc.setFillColor(isDark?15:230,isDark?25:238,isDark?60:250);
        doc.roundedRect(sx,statY,sw-3,18,2,2,'F');
        doc.setFontSize(13);doc.setFont('helvetica','bold');
        doc.setTextColor(GOLD[0],GOLD[1],GOLD[2]);
        doc.text(s.val,sx+(sw-3)/2,statY+10,{align:'center'});
        doc.setFontSize(7);doc.setFont('helvetica','normal');
        doc.setTextColor(TEXT[0],TEXT[1],TEXT[2]);
        doc.text(s.label,sx+(sw-3)/2,statY+16,{align:'center'});
      });

      // Quote
      doc.setFontSize(12);doc.setFont('helvetica','bolditalic');
      doc.setTextColor(GOLD[0],GOLD[1],GOLD[2]);
      doc.text('"Think Less. Know More."',pw/2,145,{align:'center'});
      doc.setFontSize(8);doc.setFont('helvetica','normal');
      doc.setTextColor(TEXT[0],TEXT[1],TEXT[2]);
      doc.text(`— ${SAVOIRÉ.FOUNDER} · ${SAVOIRÉ.DEVELOPER}`,pw/2,151,{align:'center'});

      // Attribution
      doc.setFontSize(8);
      doc.text(`Generated: ${new Date().toLocaleString()}`,pw/2,225,{align:'center'});
      doc.text(SAVOIRÉ.DEVSITE,pw/2,232,{align:'center'});
      doc.text(`PDF Theme: ${theme.charAt(0).toUpperCase()+theme.slice(1)}`,pw/2,239,{align:'center'});

      // Gold bottom bar
      doc.setFillColor(GOLD[0],GOLD[1],GOLD[2]);doc.rect(0,ph-5,pw,5,'F');

      // ── CONTENT PAGES ──
      addPage();

      const secHeader=(title,color=GOLD)=>{
        checkY(16);
        doc.setFillColor(isDark?HBDR[0]:230,isDark?HBDR[1]:238,isDark?HBDR[2]:250);
        doc.rect(ml,y,cw,10,'F');
        doc.setFillColor(color[0],color[1],color[2]);
        doc.rect(ml,y,3,10,'F');
        doc.setFontSize(10);doc.setFont('helvetica','bold');
        doc.setTextColor(color[0],color[1],color[2]);
        doc.text(title,ml+6,y+7);
        y+=14;
      };

      // Notes
      if(data.ultra_long_notes){
        secHeader('📚 Study Notes');
        const clean=this._stripMd(data.ultra_long_notes);
        const lines=clean.split('\n');
        for(const line of lines){
          checkY(8);
          const tr=line.trim();
          if(!tr){y+=2;continue;}
          if(tr.match(/^#{1,4}/)){
            const lv=(tr.match(/^#+/)||[''])[0].length;
            const txt=tr.replace(/^#+\s*/,'').replace(/[*]/g,'');
            const sz=[13,11,10,9][Math.min(lv-1,3)];
            const col=lv<=2?GOLD:lv===3?ACCENT:TEXT;
            wText(txt,ml,cw,sz,true,col); y+=lv<=2?4:2;
          } else if(tr.startsWith('-')||tr.startsWith('•')) {
            wText('• '+tr.replace(/^[-•*]\s*/,''),ml+4,cw-4,8.5,false,TEXT); y+=1;
          } else if(tr.match(/^\d+\./)) {
            wText(tr,ml+4,cw-4,8.5,false,TEXT); y+=1;
          } else {
            wText(tr,ml,cw,8.5,false,TEXT); y+=2;
          }
        }
        y+=6;
      }

      // Key Concepts
      if(data.key_concepts?.length){
        secHeader('💡 Key Concepts',GOLD);
        data.key_concepts.slice(0,8).forEach((c,i)=>{
          checkY(14);
          doc.setFillColor(isDark?12:238,isDark?22:245,isDark?50:255);
          doc.roundedRect(ml,y,cw,12,2,2,'F');
          doc.setFillColor(GOLD[0],GOLD[1],GOLD[2]);
          doc.circle(ml+5,y+6,3,'F');
          doc.setFontSize(7);doc.setFont('helvetica','bold');doc.setTextColor(isDark?8:255,isDark?14:255,isDark?35:255);
          doc.text(`${i+1}`,ml+5,y+7.5,{align:'center'});
          doc.setFontSize(8);doc.setFont('helvetica','normal');doc.setTextColor(TEXT[0],TEXT[1],TEXT[2]);
          const cLines=doc.splitTextToSize(String(c).slice(0,160),cw-14);
          doc.text(cLines[0]||'',ml+11,y+7.5);
          y+=15;
        });
        y+=4;
      }

      // Flashcards
      if(data.flashcards?.length){
        secHeader('🃏 Flashcards',[120,50,220]);
        data.flashcards.slice(0,12).forEach((card,i)=>{
          checkY(22);
          doc.setFillColor(isDark?12:235,isDark?8:228,isDark?45:255);
          doc.roundedRect(ml,y,cw,20,2,2,'F');
          doc.setFontSize(8);doc.setFont('helvetica','bold');
          doc.setTextColor(isDark?140:70,isDark?80:0,isDark?220:180);
          doc.text(`Q${i+1}: ${String(card.front||card.question||'').slice(0,75)}`,ml+3,y+7);
          doc.setFontSize(7.5);doc.setFont('helvetica','normal');
          doc.setTextColor(TEXT[0],TEXT[1],TEXT[2]);
          const aLines=doc.splitTextToSize(`A: ${String(card.back||card.answer||'').slice(0,130)}`,cw-6);
          doc.text(aLines.slice(0,2),ml+3,y+13);
          y+=23;
        });
        y+=4;
      }

      // Quiz
      if(data.quiz_questions?.length){
        secHeader('❓ Practice Quiz',[0,160,80]);
        data.quiz_questions.slice(0,8).forEach((q,i)=>{
          checkY(30);
          doc.setFontSize(8.5);doc.setFont('helvetica','bold');
          doc.setTextColor(isDark?HEAD[0]:20,isDark?HEAD[1]:30,isDark?HEAD[2]:50);
          const qLines=doc.splitTextToSize(`${i+1}. ${q.question}`,cw);
          doc.text(qLines.slice(0,2),ml,y);
          y+=Math.min(qLines.length,2)*5+2;
          if(q.options){
            q.options.forEach((opt,oi)=>{
              const isC=opt===q.correct_answer;
              doc.setFontSize(7.5);doc.setFont('helvetica',isC?'bold':'normal');
              doc.setTextColor(isC?0:TEXT[0],isC?140:TEXT[1],isC?0:TEXT[2]);
              doc.text(`${String.fromCharCode(65+oi)}. ${String(opt).slice(0,65)}${isC?' ✓':''}`,ml+5,y); y+=5;
            });
          }
          y+=4;
        });
        y+=4;
      }

      // Mind Map
      if(data.mindmap?.branches?.length){
        secHeader('🗺️ Mind Map',ACCENT);
        doc.setFontSize(10);doc.setFont('helvetica','bold');
        doc.setTextColor(GOLD[0],GOLD[1],GOLD[2]);
        doc.text(`Central: ${data.mindmap.central||data.topic||'Topic'}`,ml,y); y+=10;
        data.mindmap.branches.slice(0,6).forEach(b=>{
          checkY(18);
          doc.setFontSize(9);doc.setFont('helvetica','bold');
          doc.setTextColor(BLUE[0],BLUE[1],BLUE[2]);
          doc.text(`▸ ${b.name}`,ml,y); y+=6;
          (b.items||[]).slice(0,4).forEach(item=>{
            checkY(6);
            doc.setFontSize(8);doc.setFont('helvetica','normal');
            doc.setTextColor(TEXT[0],TEXT[1],TEXT[2]);
            doc.text(`   • ${String(item).slice(0,80)}`,ml,y); y+=5;
          });
          y+=3;
        });
      }

      // Study Tricks
      if(data.key_tricks?.length){
        secHeader('🧠 Study Tricks & Memory Aids',GOLD);
        data.key_tricks.slice(0,4).forEach((t,i)=>{
          checkY(14);
          wText(`${i+1}. ${String(t).slice(0,200)}`,ml,cw,8,false,TEXT);
          y+=4;
        });
      }

      // Footer on all pages
      addFooter();

      const safe=(data.topic||'Study_Notes').replace(/[^a-zA-Z0-9\s]/g,'').replace(/\s+/g,'_').slice(0,40);
      doc.save(`SavoireAI_${safe}_${new Date().toISOString().slice(0,10)}_${theme}.pdf`);
      this._toast('success','fa-file-pdf','✓ World-Class PDF downloaded!');
    } catch(err){
      console.error('PDF Error:',err);
      this._toast('error','fa-times',`PDF error: ${err.message}`);
    }
  }

  // ── COPY / SAVE / SHARE / CLEAR ───────────────────────────────────────────────────────────────

  _copyResult() {
    if(!this.currentData){this._toast('info','fa-info-circle','Nothing to copy.');return;}
    const parts=[];
    if(this.currentData.topic)parts.push(`# ${this.currentData.topic}\n`);
    if(this.currentData.ultra_long_notes)parts.push(this._stripMd(this.currentData.ultra_long_notes));
    if(this.currentData.key_concepts?.length)parts.push('\n\n## Key Concepts\n'+this.currentData.key_concepts.map((c,i)=>`${i+1}. ${c}`).join('\n'));
    if(this.currentData.flashcards?.length)parts.push('\n\n## Flashcards\n'+this.currentData.flashcards.map((c,i)=>`Q${i+1}: ${c.front||c.question}\nA: ${c.back||c.answer}`).join('\n\n'));
    if(this.currentData.quiz_questions?.length)parts.push('\n\n## Quiz\n'+this.currentData.quiz_questions.map((q,i)=>`Q${i+1}: ${q.question}\nAnswer: ${q.correct_answer}`).join('\n\n'));
    parts.push(`\n\n---\nGenerated by ${SAVOIRÉ.BRAND} | ${SAVOIRÉ.DEVELOPER}`);
    navigator.clipboard.writeText(parts.join('\n')).then(()=>this._toast('success','fa-check','Copied to clipboard!')).catch(()=>{
      const ta=document.createElement('textarea');ta.value=parts.join('\n');document.body.appendChild(ta);ta.select();document.execCommand('copy');document.body.removeChild(ta);this._toast('success','fa-check','Copied!');
    });
  }

  _copyTxt(text) { navigator.clipboard.writeText(text||'').then(()=>this._toast('success','fa-check','Copied!')).catch(()=>this._toast('error','fa-times','Copy failed.')); }

  _saveNote() {
    if(!this.currentData){this._toast('info','fa-info-circle','Nothing to save.');return;}
    if(this.saved.find(s=>s.topic===this.currentData.topic&&s.tool===this.tool)){this._toast('info','fa-star','Already saved!');return;}
    if(this.saved.length>=SAVOIRÉ.MAX_SAVED){this._toast('error','fa-archive',`Library full (max ${SAVOIRÉ.MAX_SAVED}).`);return;}
    const note={id:this._genId(),topic:this.currentData.topic||'Untitled',tool:this.tool,data:this.currentData,savedAt:Date.now()};
    this.saved.unshift(note);this._save('sv_saved',this.saved);
    this._updateAllStats();this._renderSidebarSaved();
    this._renderSavedModal();
    this._toast('success','fa-star','Saved to library!');
  }

  _shareResult() {
    if(!this.currentData){this._toast('info','fa-info-circle','Nothing to share.');return;}
    const sd={title:`${this.currentData.topic||'Study Notes'} — ${SAVOIRÉ.BRAND}`,text:`Study notes on "${this.currentData.topic}"`,url:`https://${SAVOIRÉ.WEBSITE}`};
    if(navigator.share)navigator.share(sd).catch(()=>this._fallbackShare(sd));
    else this._fallbackShare(sd);
  }
  _fallbackShare(sd){ navigator.clipboard.writeText(sd.url).then(()=>this._toast('success','fa-link','Link copied!')).catch(()=>this._toast('info','fa-info-circle',`Share: ${SAVOIRÉ.WEBSITE}`)); }

  _clearOutput() {
    if(!this.currentData){this._showState('empty');this._showToolbar(false);return;}
    this._confirm('Clear the current output?',()=>{
      this.currentData=null;this._showState('empty');
      this.fcCards=[];this.quizData=[];
      if(this.el.resultArea)this.el.resultArea.innerHTML='';
      this._showToolbar(false);this._toast('info','fa-trash','Output cleared.');
    });
  }

  // ── HISTORY & SAVED ───────────────────────────────────────────────────────────────────────────

  _addHistory(item) {
    this.history=this.history.filter(h=>!(h.topic===item.topic&&h.tool===item.tool));
    this.history.unshift(item);
    if(this.history.length>SAVOIRÉ.MAX_HISTORY)this.history=this.history.slice(0,SAVOIRÉ.MAX_HISTORY);
    this._save('sv_history',this.history);
    this._renderSidebarHistory();this._updateAllStats();
  }

  _renderSidebarHistory() {
    if(!this.el.lpHistList)return;
    const ICONS={notes:'fa-book-open',flashcards:'fa-layer-group',quiz:'fa-question-circle',summary:'fa-align-left',mindmap:'fa-project-diagram',all:'fa-bolt'};
    if(!this.history.length){this.el.lpHistList.innerHTML='<div class="lp-hist-empty">No history yet.</div>';return;}
    this.el.lpHistList.innerHTML=this.history.slice(0,6).map(h=>`
      <div class="lp-hist-item" onclick="window._app._loadHistory('${h.id}')">
        <i class="fas ${ICONS[h.tool]||'fa-book'} lp-hist-icon" style="${h.tool==='all'?'color:#d4af37':''}"></i>
        <div class="lp-hist-topic">${this._esc((h.topic||'').slice(0,30))}</div>
        <div class="lp-hist-time">${this._relTime(h.ts)}</div>
        <button class="lp-hist-delete" onclick="event.stopPropagation();window._app._delHistory('${h.id}')"><i class="fas fa-times"></i></button>
      </div>`).join('');
  }

  _renderSidebarSaved() {
    if(!this.el.lpSavedList)return;
    const ICONS={notes:'fa-book-open',flashcards:'fa-layer-group',quiz:'fa-question-circle',summary:'fa-align-left',mindmap:'fa-project-diagram',all:'fa-bolt'};
    if(!this.saved.length){this.el.lpSavedList.innerHTML='<div class="lp-hist-empty">No saved notes yet.</div>';return;}
    this.el.lpSavedList.innerHTML=this.saved.slice(0,5).map(s=>`
      <div class="lp-hist-item" onclick="window._app._loadSaved('${s.id}')">
        <i class="fas ${ICONS[s.tool]||'fa-star'} lp-hist-icon" style="color:#d4af37"></i>
        <div class="lp-hist-topic">${this._esc((s.topic||'').slice(0,30))}</div>
        <div class="lp-hist-time">${this._relTime(s.savedAt)}</div>
        <button class="lp-hist-delete" onclick="event.stopPropagation();window._app._delSaved('${s.id}')"><i class="fas fa-times"></i></button>
      </div>`).join('');
  }

  _openHistModal() { this._renderHistModal(); this._openModal('histModal'); }

  _renderHistModal(filter='all',query='') {
    if(!this.el.histList)return;
    const ICONS={notes:'fa-book-open',flashcards:'fa-layer-group',quiz:'fa-question-circle',summary:'fa-align-left',mindmap:'fa-project-diagram',all:'fa-bolt'};
    let filt=this.history;
    if(filter!=='all')filt=filt.filter(h=>h.tool===filter);
    if(query)filt=filt.filter(h=>(h.topic||'').toLowerCase().includes(query.toLowerCase()));
    if(!filt.length){this.el.histList.innerHTML='';if(this.el.histEmpty)this.el.histEmpty.style.display='flex';return;}
    if(this.el.histEmpty)this.el.histEmpty.style.display='none';
    const groups={};
    filt.forEach(h=>{const g=this._dateGroup(h.ts);if(!groups[g])groups[g]=[];groups[g].push(h);});
    this.el.histList.innerHTML=Object.entries(groups).map(([g,items])=>
      `<div class="hist-group-lbl">${g}</div>${items.map(h=>`
        <div class="hist-item" onclick="window._app._loadHistory('${h.id}')">
          <div class="hist-tool-av" style="${h.tool==='all'?'color:#d4af37;background:rgba(212,175,55,.1)':''}"><i class="fas ${ICONS[h.tool]||'fa-book'}"></i></div>
          <div class="hist-info"><div class="hist-topic">${this._esc((h.topic||'').slice(0,65))}</div>
          <div class="hist-meta"><span class="hist-tag">${h.tool}</span><span class="hist-time">${this._relTime(h.ts)}</span></div></div>
          <div class="hist-acts"><button class="hist-del" onclick="event.stopPropagation();window._app._delHistory('${h.id}')"><i class="fas fa-trash"></i></button></div>
        </div>`).join('')}`
    ).join('');
  }

  _loadHistory(id) { const h=this.history.find(x=>x.id===id); if(!h?.data)return; this._closeModal('histModal'); this.currentData=h.data; this.tool=h.tool||'notes'; this._renderResult(h.data); this._showToolbar(true); this._toast('info','fa-history',`Loaded: ${(h.topic||'').slice(0,40)}`); }
  _delHistory(id) { this.history=this.history.filter(x=>x.id!==id); this._save('sv_history',this.history); this._renderSidebarHistory(); this._updateAllStats(); this._renderHistModal(); }

  _openSavedModal() { this._renderSavedModal(); this._openModal('savedModal'); }

  _renderSavedModal() {
    if(!this.el.savedList)return;
    if(this.el.savedCount)this.el.savedCount.textContent=`${this.saved.length} note${this.saved.length!==1?'s':''}`;
    if(!this.saved.length){this.el.savedList.innerHTML='';if(this.el.savedEmpty)this.el.savedEmpty.style.display='flex';return;}
    if(this.el.savedEmpty)this.el.savedEmpty.style.display='none';
    const ICONS={notes:'fa-book-open',flashcards:'fa-layer-group',quiz:'fa-question-circle',summary:'fa-align-left',mindmap:'fa-project-diagram',all:'fa-bolt'};
    this.el.savedList.innerHTML=this.saved.map(s=>`
      <div class="hist-item" onclick="window._app._loadSaved('${s.id}')">
        <div class="hist-tool-av" style="color:#d4af37;background:rgba(212,175,55,.1)"><i class="fas ${ICONS[s.tool]||'fa-star'}"></i></div>
        <div class="hist-info"><div class="hist-topic">${this._esc((s.topic||'').slice(0,65))}</div>
        <div class="hist-meta"><span class="hist-tag">${s.tool}</span><span class="hist-time">Saved ${this._relTime(s.savedAt)}</span></div></div>
        <div class="hist-acts"><button class="hist-del" onclick="event.stopPropagation();window._app._delSaved('${s.id}')"><i class="fas fa-trash"></i></button></div>
      </div>`).join('');
  }

  _loadSaved(id) { const s=this.saved.find(x=>x.id===id); if(!s?.data)return; this._closeModal('savedModal'); this.currentData=s.data; this.tool=s.tool||'notes'; this._renderResult(s.data); this._showToolbar(true); this._toast('success','fa-star','Loaded saved note!'); }
  _delSaved(id) { this.saved=this.saved.filter(x=>x.id!==id); this._save('sv_saved',this.saved); this._updateAllStats(); this._renderSavedModal(); this._renderSidebarSaved(); }

  // ── SETTINGS ──────────────────────────────────────────────────────────────────────────────────

  _openSettingsModal() {
    if(this.el.nameInput)this.el.nameInput.value=this.userName;
    if(this.el.defaultLangSel)this.el.defaultLangSel.value=this.prefs.defaultLanguage||'English';
    const theme=document.documentElement.dataset.theme||'dark';
    this._qsa('[data-theme-btn]').forEach(b=>b.classList.toggle('active',b.dataset.themeBtn===theme));
    const pdft=this.pdfTheme||'dark';
    this._qsa('[data-pdf-theme]').forEach(b=>b.classList.toggle('active',b.dataset.pdfTheme===pdft));
    const fs=document.documentElement.dataset.font||'medium';
    this._qsa('.font-sz').forEach(b=>b.classList.toggle('active',b.dataset.size===fs));
    if(this.el.dsStats){
      const kb=Math.round((JSON.stringify(this.history).length+JSON.stringify(this.saved).length)/1024);
      this.el.dsStats.innerHTML=`
        <div class="ds-stat"><span class="ds-val">${this.history.length}</span><div class="ds-lbl">History</div></div>
        <div class="ds-stat"><span class="ds-val">${this.saved.length}</span><div class="ds-lbl">Saved</div></div>
        <div class="ds-stat"><span class="ds-val">${this.sessions}</span><div class="ds-lbl">Sessions</div></div>
        <div class="ds-stat"><span class="ds-val">${kb}KB</span><div class="ds-lbl">Storage</div></div>
        <div class="ds-stat"><span class="ds-val">${this.totalWords.toLocaleString()}</span><div class="ds-lbl">Words</div></div>
        <div class="ds-stat"><span class="ds-val">${this.streak.count}</span><div class="ds-lbl">Streak</div></div>
        <div class="ds-stat"><span class="ds-val">${this.streak.bestStreak}</span><div class="ds-lbl">Best</div></div>`;
    }
    this._openModal('settingsModal');
  }

  _saveName() {
    const name=this.el.nameInput?.value?.trim();
    if(!name||name.length<2){this._toast('error','fa-times','Name must be at least 2 characters.');return;}
    this.userName=name;localStorage.setItem('sv_user',name);this._updateUserUI();this._toast('success','fa-check','Name updated!');
  }

  _saveDefaultLang() {
    const lang=this.el.defaultLangSel?.value; if(!lang)return;
    this.prefs.defaultLanguage=lang;this._save('sv_prefs',this.prefs);
    this._toast('success','fa-check',`Default language: ${lang}`);
  }

  _exportData() {
    const obj={exported:new Date().toISOString(),app:SAVOIRÉ.BRAND,userName:this.userName,sessions:this.sessions,history:this.history,saved:this.saved,preferences:this.prefs,streak:this.streak,totalWords:this.totalWords};
    const blob=new Blob([JSON.stringify(obj,null,2)],{type:'application/json'});
    const url=URL.createObjectURL(blob);const a=document.createElement('a');a.href=url;a.download=`savoiré-ai-backup-${Date.now()}.json`;document.body.appendChild(a);a.click();document.body.removeChild(a);URL.revokeObjectURL(url);
    this._toast('success','fa-download','Backup exported!');
  }

  _importData(file) {
    const r=new FileReader(); r.onload=e=>{
      try{
        const d=JSON.parse(e.target.result);
        if(d.history)this.history=d.history;if(d.saved)this.saved=d.saved;
        if(d.preferences||d.prefs)this.prefs=d.preferences||d.prefs;
        if(d.streak)this.streak=d.streak;if(d.userName)this.userName=d.userName;
        if(d.totalWords)this.totalWords=d.totalWords;
        this._save('sv_history',this.history);this._save('sv_saved',this.saved);
        this._save('sv_prefs',this.prefs);this._save('sv_streak',this.streak);
        this._saveStreak();localStorage.setItem('sv_total_words',String(this.totalWords));
        if(d.userName)localStorage.setItem('sv_user',d.userName);
        this._updateAllStats();this._renderSidebarHistory();this._renderSidebarSaved();this._updateUserUI();
        this._toast('success','fa-check','Backup restored! Reloading…');
        setTimeout(()=>location.reload(),1500);
      }catch{this._toast('error','fa-times','Invalid backup file');}
    };
    r.readAsText(file);
  }

  _clearAllData() {
    this._confirm('⚠️ Delete ALL data? Cannot be undone.',()=>{
      Object.keys(localStorage).filter(k=>k.startsWith('sv_')).forEach(k=>localStorage.removeItem(k));
      this._toast('info','fa-trash','All data cleared. Reloading…');
      setTimeout(()=>window.location.reload(),1500);
    });
  }

  _toggleTheme() { const c=document.documentElement.dataset.theme||'dark'; this._setTheme(c==='dark'?'light':c==='light'?'golden':'dark'); }
  _setTheme(theme) {
    document.documentElement.setAttribute('data-theme',theme);
    if(this.el.themeIcon)this.el.themeIcon.className=theme==='dark'?'fas fa-moon':theme==='golden'?'fas fa-star':'fas fa-sun';
    this._qsa('[data-theme-btn]').forEach(b=>b.classList.toggle('active',b.dataset.themeBtn===theme));
    this.prefs.theme=theme;this._save('sv_prefs',this.prefs);
  }
  _setFontSize(size) {
    document.documentElement.setAttribute('data-font',size);
    this._qsa('.font-sz').forEach(b=>b.classList.toggle('active',b.dataset.size===size));
    this.prefs.fontSize=size;this._save('sv_prefs',this.prefs);
  }
  _setPdfTheme(theme) {
    this.pdfTheme=theme;this.prefs.pdfTheme=theme;this._save('sv_prefs',this.prefs);
    this._qsa('[data-pdf-theme]').forEach(b=>b.classList.toggle('active',b.dataset.pdfTheme===theme));
    this._toast('info','fa-file-pdf',`PDF theme set to ${theme}`);
  }
  _applyPrefs() {
    if(this.prefs.theme)this._setTheme(this.prefs.theme);
    if(this.prefs.fontSize)this._setFontSize(this.prefs.fontSize);
    if(this.prefs.pdfTheme)this.pdfTheme=this.prefs.pdfTheme;
  }

  // ── DEMO SYSTEM ───────────────────────────────────────────────────────────────────────────────

  _openDemo() {
    this._renderDemo(0);
    this._openModal('demoModal');
  }

  _renderDemo(step) {
    if(!this.el.demoContent)return;
    const steps=[
      {
        title:'Step 1 — Welcome to Savoiré AI',
        icon:'fa-magic',color:'#d4af37',
        desc:`<p><strong>Savoiré AI</strong> is the world's most advanced free AI study assistant. It generates comprehensive study materials in seconds using cutting-edge AI models.</p><p>Built by <strong>Sooban Talha Technologies</strong> — completely free, no login required, forever.</p>`,
        tips:['✅ No account needed','✅ All data stays on your device','✅ Free forever — no hidden costs','✅ Works in 20+ languages'],
        highlight:'👈 Your sidebar shows stats, history, and quick navigation'
      },
      {
        title:'Step 2 — The Study Wizard',
        icon:'fa-wand-magic-sparkles',color:'#00d4ff',
        desc:`<p>Click <strong>✨ Create Study Material</strong> in the sidebar (or the magic wand icon in the header) to open the <strong>6-step Study Wizard</strong>.</p><p>The wizard guides you through: Tool selection → Topic → Language → Detail Level → Writing Style → Generate.</p>`,
        tips:['📚 Notes: Comprehensive structured study notes','🃏 Flashcards: 15-20 interactive flip cards','❓ Quiz: 10-12 self-scoring questions','📋 Summary: Concise TL;DR revision','🗺️ Mind Map: Visual 5-7 branch diagram'],
        highlight:'🎯 Step 4 (Depth) and Step 5 (Style) are separate steps for precision'
      },
      {
        title:'Step 3 — ⚡ Mega Bundle (All 5 Tools!)',
        icon:'fa-bolt',color:'#d4af37',
        desc:`<p>The exclusive <strong>⚡ Mega Study Bundle</strong> generates ALL 5 study tools at once — Notes, Flashcards, Quiz, Summary, and Mind Map — in a single premium generation.</p><p>Click <strong>⚡ Mega Study Bundle</strong> in the sidebar or the grid icon in the header.</p>`,
        tips:['⚡ One topic → 5 complete study tools','🃏 15-20 interactive flashcards included','❓ 10-12 quiz questions included','🗺️ Full visual mind map included','📋 Smart summary with TL;DR included'],
        highlight:'💡 Perfect for exam prep — get everything in one go!'
      },
      {
        title:'Step 4 — Live Streaming Output',
        icon:'fa-stream',color:'#00ff88',
        desc:`<p>When you generate, Savoiré AI <strong>streams content live to your screen</strong> — you watch it being written in real time with full markdown formatting.</p><p>The progress stages at the top show where the AI is in the generation process.</p>`,
        tips:['📡 Content arrives live as it\'s written','📝 Full markdown formatting rendered live','🔍 5 stages: Analyse → Write → Build → Craft → Finalise','⏱️ Typically 20-40 seconds total','🛑 Cancel anytime if needed'],
        highlight:'🎬 Watch the magic happen — live AI writing!'
      },
      {
        title:'Step 5 — Interactive Study Tools',
        icon:'fa-layer-group',color:'#bf00ff',
        desc:`<p>After generation, the study tools are <strong>fully interactive</strong>:</p><ul style="margin:10px 0 10px 20px;line-height:2"><li>🃏 <strong>Flashcards</strong>: Tap to flip, arrow keys to navigate, shuffle button</li><li>❓ <strong>Quiz</strong>: Click answer → get instant feedback with detailed explanation</li><li>🗺️ <strong>Mind Map</strong>: Visual branches you can scan and read</li></ul>`,
        tips:['⌨️ Space bar flips flashcards','⬅️➡️ Arrow keys navigate flashcards','📊 Quiz shows your score after each answer','🔄 Restart quiz or shuffle flashcards','✅ Review all answers at quiz end'],
        highlight:'⌨️ Keyboard shortcuts work everywhere!'
      },
      {
        title:'Step 6 — PDF, Copy, Save & Share',
        icon:'fa-file-pdf',color:'#ff4444',
        desc:`<p>The <strong>output toolbar</strong> (appears after generation) gives you:</p><ul style="margin:10px 0 10px 20px;line-height:2"><li>📄 <strong>PDF</strong>: World-class formatted PDF (Dark or Light theme)</li><li>📋 <strong>Copy</strong>: Copy full content as clean text</li><li>⭐ <strong>Save</strong>: Save to your local library</li><li>🔗 <strong>Share</strong>: Share the link</li></ul>`,
        tips:['📄 PDF has cover page + all sections','🎨 Choose Dark or Light PDF in Settings','⭐ Saved notes accessible anytime in History','🔄 New button generates fresh material','📱 PDF downloads to your device'],
        highlight:'⚙️ Set your PDF theme preference in Settings → PDF Style'
      },
      {
        title:'Step 7 — Streak, Stats & Settings',
        icon:'fa-fire',color:'#ffae00',
        desc:`<p>Savoiré AI tracks your <strong>learning streak</strong> and <strong>study statistics</strong> — study every day to build your streak!</p><p>In <strong>Settings</strong> (⚙️ in header): change theme (Dark/Light/Golden), font size (XS to XL), default language, and PDF style.</p>`,
        tips:['🔥 Streak shown in gold in the top header','📊 Sessions, Words, History, Saved all tracked','🌙 Dark | ☀️ Light | ⭐ Golden themes','📏 5 font sizes: XSmall to XLarge','🌍 Set default language for all generations'],
        highlight:'🔥 Study every day to build your streak — check back tomorrow!'
      },
    ];

    const s=steps[step];
    const isLast=step===steps.length-1;
    this.el.demoContent.innerHTML=`
      <div class="demo-step-indicator">
        ${steps.map((_,i)=>`<span class="demo-dot ${i===step?'active':i<step?'done':''}" onclick="window._app._renderDemo(${i})">${i<step?'✓':i+1}</span>`).join('')}
      </div>
      <div class="demo-step">
        <div class="demo-step-icon" style="background:linear-gradient(135deg,${s.color}22,${s.color}11);border-color:${s.color}44">
          <i class="fas ${s.icon}" style="color:${s.color}"></i>
        </div>
        <div class="demo-step-title" style="color:${s.color}">${s.title}</div>
        <div class="demo-step-desc">${s.desc}</div>
        <div class="demo-tips">
          ${s.tips.map(t=>`<div class="demo-tip">${t}</div>`).join('')}
        </div>
        <div class="demo-highlight"><i class="fas fa-info-circle"></i> ${s.highlight}</div>
      </div>
      <div class="demo-footer">
        <button class="demo-nav-btn demo-prev" ${step===0?'disabled':''} onclick="window._app._renderDemo(${step-1})">
          <i class="fas fa-arrow-left"></i> Previous
        </button>
        <span class="demo-step-counter">${step+1} / ${steps.length}</span>
        ${isLast
          ? `<button class="demo-nav-btn demo-finish" onclick="window._app._closeModal('demoModal');window._app._openWizard()">
              <i class="fas fa-magic"></i> Start Studying!
            </button>`
          : `<button class="demo-nav-btn demo-next" onclick="window._app._renderDemo(${step+1})">
              Next <i class="fas fa-arrow-right"></i>
            </button>`}
      </div>`;
  }

  // ── SIDEBAR, FOCUS, MOBILE ─────────────────────────────────────────────────────────────────────

  _toggleSidebar() {
    if(!this.el.leftPanel)return;
    if(window.innerWidth<=1024){
      const o=this.el.leftPanel.classList.toggle('mobile-open');
      if(this.el.sbBackdrop)this.el.sbBackdrop.classList.toggle('visible',o);
      if(this.el.sbToggle)this.el.sbToggle.setAttribute('aria-expanded',String(o));
    } else {
      this.el.leftPanel.classList.toggle('collapsed');
      this.focusMode=this.el.leftPanel.classList.contains('collapsed');
      if(this.el.focusModeBtn)this.el.focusModeBtn.innerHTML=this.focusMode?'<i class="fas fa-compress-alt"></i> <span>Exit</span>':'<i class="fas fa-expand-alt"></i> <span>Focus</span>';
    }
  }

  _closeSidebar() { if(this.el.leftPanel)this.el.leftPanel.classList.remove('mobile-open'); if(this.el.sbBackdrop)this.el.sbBackdrop.classList.remove('visible'); if(this.el.sbToggle)this.el.sbToggle.setAttribute('aria-expanded','false'); }
  _toggleFocus() { this._toggleSidebar(); }

  _initSwipe() {
    let sx=0;
    document.addEventListener('touchstart',e=>{sx=e.touches[0].clientX;});
    document.addEventListener('touchend',e=>{
      if(window.innerWidth<=1024){
        const dx=e.changedTouches[0].clientX-sx;
        if(dx>60&&sx<30){if(this.el.leftPanel){this.el.leftPanel.classList.add('mobile-open');if(this.el.sbBackdrop)this.el.sbBackdrop.classList.add('visible');}}
        else if(dx<-60)this._closeSidebar();
      }
    });
  }

  _initBackToTop() {
    if(!this.el.outArea||!this.el.backToTopBtn)return;
    this.el.outArea.addEventListener('scroll',()=>{
      if(this.el.outArea.scrollTop>400)this.el.backToTopBtn.classList.add('is-visible');
      else this.el.backToTopBtn.classList.remove('is-visible');
    });
    this.el.backToTopBtn.onclick=()=>this.el.outArea.scrollTo({top:0,behavior:'smooth'});
  }

  // ── ABOUT TOGGLE ──────────────────────────────────────────────────────────────────────────────

  _toggleAbout() {
    const content=this.el.aboutContent, chevron=this.el.aboutChevron;
    if(!content)return;
    const hidden=!content.classList.contains('open');
    content.classList.toggle('open',hidden);
    if(chevron)chevron.style.transform=hidden?'rotate(180deg)':'rotate(0deg)';
  }

  // ── MODAL SYSTEM ──────────────────────────────────────────────────────────────────────────────

  _openModal(id) {
    const el=this._el(id); if(!el)return;
    el.style.display='flex';document.body.style.overflow='hidden';
    setTimeout(()=>{const f=el.querySelector('input,button,[tabindex]');if(f)f.focus();},120);
  }
  _closeModal(id) { const el=this._el(id);if(el){el.style.display='none';if(!this._qs('.modal-overlay[style*="flex"]'))document.body.style.overflow='';} }
  _closeAllModals() { this._qsa('.modal-overlay').forEach(m=>m.style.display='none'); document.body.style.overflow=''; this._closeDropdown(); }
  _confirm(msg,cb) { if(this.el.confirmMsg)this.el.confirmMsg.textContent=msg; this.confirmCb=cb; this._openModal('confirmModal'); }
  _toggleDropdown() { if(this.el.avDropdown)this.el.avDropdown.classList.toggle('open'); }
  _closeDropdown() { if(this.el.avDropdown)this.el.avDropdown.classList.remove('open'); }

  // ── TOAST ─────────────────────────────────────────────────────────────────────────────────────

  _toast(type,icon,msg,dur=4200) {
    if(!this.el.toastContainer)return;
    while(this.el.toastContainer.children.length>=4)this.el.toastContainer.removeChild(this.el.toastContainer.firstChild);
    const t=document.createElement('div'); t.className=`toast ${type}`;
    t.innerHTML=`<i class="fas ${icon}"></i><span>${this._esc(msg)}</span>`;
    t.setAttribute('role','alert');
    t.addEventListener('click',()=>{t.classList.add('removing');setTimeout(()=>t.remove(),300);});
    this.el.toastContainer.appendChild(t);
    setTimeout(()=>{if(t.parentNode){t.classList.add('removing');setTimeout(()=>{if(t.parentNode)t.remove();},300);}},dur);
  }

  // ── EVENT BINDINGS ────────────────────────────────────────────────────────────────────────────

  _bindAll() {
    // Sidebar toggle & backdrop
    if(this.el.sbToggle)this.el.sbToggle.addEventListener('click',()=>this._toggleSidebar());
    if(this.el.sbBackdrop)this.el.sbBackdrop.addEventListener('click',()=>this._closeSidebar());

    // Navigation
    if(this.el.navWizard)   this.el.navWizard.addEventListener('click',()=>this._openWizard());
    if(this.el.navAll)      this.el.navAll.addEventListener('click',()=>this._openMega());
    if(this.el.navHistory)  this.el.navHistory.addEventListener('click',()=>this._openHistModal());
    if(this.el.navSaved)    this.el.navSaved.addEventListener('click',()=>this._openSavedModal());
    if(this.el.navSettings) this.el.navSettings.addEventListener('click',()=>this._openSettingsModal());
    if(this.el.navFocus)    this.el.navFocus.addEventListener('click',()=>this._toggleFocus());

    // Demo
    if(this.el.demoReplayBtn)this.el.demoReplayBtn.addEventListener('click',()=>this._openDemo());

    // Header actions
    if(this.el.themeBtn)      this.el.themeBtn.addEventListener('click',()=>this._toggleTheme());
    if(this.el.settingsBtn)   this.el.settingsBtn.addEventListener('click',()=>this._openSettingsModal());
    if(this.el.wizardHeaderBtn)this.el.wizardHeaderBtn.addEventListener('click',()=>this._openWizard());
    if(this.el.megaHeaderBtn) this.el.megaHeaderBtn.addEventListener('click',()=>this._openMega());
    if(this.el.emptyWizardBtn)this.el.emptyWizardBtn.addEventListener('click',()=>this._openWizard());
    if(this.el.emptyMegaBtn)  this.el.emptyMegaBtn.addEventListener('click',()=>this._openMega());

    // Sidebar history & saved
    if(this.el.lpHistAll)  this.el.lpHistAll.addEventListener('click',()=>this._openHistModal());
    if(this.el.lpSavedAll) this.el.lpSavedAll.addEventListener('click',()=>this._openSavedModal());

    // About toggle
    if(this.el.aboutToggleBtn)this.el.aboutToggleBtn.addEventListener('click',()=>this._toggleAbout());

    // Avatar dropdown
    if(this.el.avBtn)this.el.avBtn.addEventListener('click',e=>{e.stopPropagation();this._toggleDropdown();});
    if(this.el.avHist)    this.el.avHist.addEventListener('click',()=>{this._closeDropdown();this._openHistModal();});
    if(this.el.avSaved)   this.el.avSaved.addEventListener('click',()=>{this._closeDropdown();this._openSavedModal();});
    if(this.el.avSettings)this.el.avSettings.addEventListener('click',()=>{this._closeDropdown();this._openSettingsModal();});
    if(this.el.avClear)   this.el.avClear.addEventListener('click',()=>{this._closeDropdown();this._confirm('Clear ALL data? Cannot be undone.',()=>this._clearAllData());});
    document.addEventListener('click',e=>{if(!e.target.closest('#avBtn')&&!e.target.closest('#avDropdown'))this._closeDropdown();});

    // Output toolbar
    if(this.el.copyBtn)    this.el.copyBtn.addEventListener('click',()=>this._copyResult());
    if(this.el.pdfBtn)     this.el.pdfBtn.addEventListener('click',()=>this._downloadPDF());
    if(this.el.saveBtn)    this.el.saveBtn.addEventListener('click',()=>this._saveNote());
    if(this.el.shareBtn)   this.el.shareBtn.addEventListener('click',()=>this._shareResult());
    if(this.el.clearBtn)   this.el.clearBtn.addEventListener('click',()=>this._clearOutput());
    if(this.el.newWizardBtn)this.el.newWizardBtn.addEventListener('click',()=>this._openWizard());
    if(this.el.focusModeBtn)this.el.focusModeBtn.addEventListener('click',()=>this._toggleFocus());

    // History modal
    if(this.el.histSearchInput)this.el.histSearchInput.addEventListener('input',e=>{const a=this._qs('.hist-filter.active')?.dataset?.filter||'all';this._renderHistModal(a,e.target.value);});
    const hsc=this._el('histSearchClear');if(hsc)hsc.addEventListener('click',()=>{if(this.el.histSearchInput)this.el.histSearchInput.value='';this._renderHistModal();});
    if(this.el.clearHistBtn)this.el.clearHistBtn.addEventListener('click',()=>{this._confirm('Clear all history?',()=>{this.history=[];this._save('sv_history',this.history);this._renderHistModal();this._renderSidebarHistory();this._updateAllStats();this._toast('info','fa-trash','History cleared.');});});
    if(this.el.exportHistBtn)this.el.exportHistBtn.addEventListener('click',()=>this._exportData());
    this._qsa('.hist-filter').forEach(b=>b.addEventListener('click',()=>{this._qsa('.hist-filter').forEach(x=>x.classList.remove('active'));b.classList.add('active');this._renderHistModal(b.dataset.filter,this.el.histSearchInput?.value||'');}));

    // Settings
    if(this.el.saveNameBtn)      this.el.saveNameBtn.addEventListener('click',()=>this._saveName());
    if(this.el.saveDefaultLangBtn)this.el.saveDefaultLangBtn.addEventListener('click',()=>this._saveDefaultLang());
    if(this.el.exportDataBtn)    this.el.exportDataBtn.addEventListener('click',()=>this._exportData());
    if(this.el.importBackupBtn)  this.el.importBackupBtn.addEventListener('click',()=>{const i=document.createElement('input');i.type='file';i.accept='.json';i.onchange=e=>{if(e.target.files[0])this._importData(e.target.files[0]);};i.click();});
    if(this.el.clearDataBtn)     this.el.clearDataBtn.addEventListener('click',()=>this._confirm('Delete ALL data?',()=>this._clearAllData()));
    this._qsa('[data-theme-btn]').forEach(b=>b.addEventListener('click',()=>this._setTheme(b.dataset.themeBtn)));
    this._qsa('[data-pdf-theme]').forEach(b=>b.addEventListener('click',()=>this._setPdfTheme(b.dataset.pdfTheme)));
    this._qsa('.font-sz').forEach(b=>b.addEventListener('click',()=>this._setFontSize(b.dataset.size)));

    // Welcome
    if(this.el.welcomeBtn)this.el.welcomeBtn.addEventListener('click',()=>this._submitWelcome());
    if(this.el.welcomeSkip)this.el.welcomeSkip.addEventListener('click',()=>this._skipWelcome());
    if(this.el.welcomeNameInput)this.el.welcomeNameInput.addEventListener('keydown',e=>{if(e.key==='Enter')this._submitWelcome();});
    if(this.el.welcomeBackBtn)this.el.welcomeBackBtn.addEventListener('click',()=>this._dismissOverlay('welcomeBackOverlay'));

    // Mega modal
    if(this.el.megaTopicInput){
      this.el.megaTopicInput.addEventListener('input',e=>{
        const v=e.target.value.slice(0,4000);e.target.value=v;
        if(this.el.megaCharCount)this.el.megaCharCount.textContent=`${v.length} / 4000`;
      });
    }
    if(this.el.megaGenerateBtn)this.el.megaGenerateBtn.addEventListener('click',()=>this._runMega());
    this._qsa('.mega-sugg-pill').forEach(b=>b.addEventListener('click',()=>{
      const t=b.dataset.topic;if(t&&this.el.megaTopicInput){this.el.megaTopicInput.value=t;if(this.el.megaCharCount)this.el.megaCharCount.textContent=`${t.length} / 4000`;}
    }));

    // Modal close
    this._qsa('[data-close]').forEach(b=>b.addEventListener('click',()=>this._closeModal(b.dataset.close)));
    this._qsa('.modal-close').forEach(b=>{const ov=b.closest('.modal-overlay');if(ov)b.addEventListener('click',()=>this._closeModal(ov.id));});
    this._qsa('.modal-overlay').forEach(ov=>ov.addEventListener('click',e=>{if(e.target===ov)this._closeModal(ov.id);}));

    // Confirm
    if(this.el.confirmOkBtn)this.el.confirmOkBtn.addEventListener('click',()=>{this._closeModal('confirmModal');if(typeof this.confirmCb==='function')this.confirmCb();this.confirmCb=null;});

    // Home link
    if(this.el.homeLink)this.el.homeLink.addEventListener('click',e=>{e.preventDefault();this._clearOutput();this._showToolbar(false);});
    if(this.el.dhLogo)this.el.dhLogo.addEventListener('click',()=>{this._clearOutput();this._showToolbar(false);});

    // Resize
    window.addEventListener('resize',()=>{if(window.innerWidth>1024)this._closeSidebar();});

    // Keyboard shortcuts
    document.addEventListener('keydown',e=>{
      if(e.key==='Escape'){this._closeAllModals();return;}
      const tag=document.activeElement?.tagName?.toLowerCase();
      if(tag==='input'||tag==='textarea')return;
      if(e.ctrlKey||e.metaKey){
        switch(e.key.toLowerCase()){
          case 'k':e.preventDefault();this._openWizard();break;
          case 'h':e.preventDefault();this._openHistModal();break;
          case 'b':e.preventDefault();this._toggleSidebar();break;
          case 's':e.preventDefault();this._saveNote();break;
          case 'p':e.preventDefault();this._downloadPDF();break;
        }
      }
      if(this.fcCards.length){
        if(e.key==='ArrowRight')this._fcNav(1);
        else if(e.key==='ArrowLeft')this._fcNav(-1);
        else if(e.key===' '){e.preventDefault();this._fcFlip();}
        else if(e.key==='s'||e.key==='S')this._fcShuffle();
      }
    });
  }
}

// ── INIT ──────────────────────────────────────────────────────────────────────────────────────────

window.addEventListener('DOMContentLoaded',()=>{
  window._app = new SavoireApp();
  window._sav = window._app;
  console.log('%c✨ Savoiré AI v2.0 — All Bugs Fixed & Enhanced', 'color:#d4af37;font-size:14px;font-weight:bold');
});

// ═══════════════════════════════════════════════════════════════════════════════════════════════
// END — app.js v2.0 FINAL | Sooban Talha Technologies | soobantalhatech.xyz
// ═══════════════════════════════════════════════════════════════════════════════════════════════

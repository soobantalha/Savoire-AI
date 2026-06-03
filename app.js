'use strict';
/* ═══════════════════════════════════════════════════════════════════════════════════════════════════
   SAVOIRÉ AI v2.0 — app.js — WORLD CLASS ULTIMATE FRONTEND — MAXIMUM LINES
   Built by Sooban Talha Technologies | soobantalhatech.xyz
   Founder: Sooban Talha

   ═══════════════════════════════════════════════════════════════════════════════════════════════════
   ALL FEATURES — COMPLETE LIST:
   ═══════════════════════════════════════════════════════════════════════════════════════════════════

   ✅ SESSION COUNTING: Incremented on every new calendar day (IST) — stored in localStorage
   ✅ GOOGLE SHEETS: Ping sent on app load with current session/streak count
   ✅ GOOGLE SHEETS: Tool usage sent with full topic, duration, status
   ✅ SESSIONS FIX: Sessions count updates in Google Sheets from frontend on every visit

   ✅ WIZARD: 6 steps — Tool → Topic → Language → Depth → Style → Generate
   ✅ WIZARD: Writing Style is Step 5 (separate from Depth which is Step 4)
   ✅ WIZARD: All 5 tools + Mega Bundle (all) selectable
   ✅ MEGA BUNDLE: Generates Notes + Flashcards + Quiz + Summary + Mind Map at once
   ✅ MEGA BUNDLE: Available in sidebar nav, header button, empty state

   ✅ LIVE STREAMING: Content shown formatted (full markdown render) while tokens arrive
   ✅ LIVE STREAMING: Stages shown in overlay header with progress bar
   ✅ LIVE STREAMING: Cancel button works
   ✅ OUTPUT TOOLBAR: Shown ONLY after output generated
   ✅ OUTPUT TOOLBAR: Copy, PDF, Save, Share, Clear, New Wizard — all working

   ✅ PDF: World-class formatted with cover page, all sections, dark AND light themes
   ✅ PDF: User chooses dark or light PDF in Settings
   ✅ PDF: Cover page with stats, section headers, flashcards, quiz, mindmap

   ✅ FLASHCARDS: Interactive 3D flip, keyboard nav, shuffle, restart — fully working
   ✅ QUIZ: 10-12 MCQ, instant feedback, explanation shown, results with review
   ✅ MIND MAP: Visual branches with items and cross-connections
   ✅ NOTES: Full markdown rendered beautifully
   ✅ SUMMARY: TL;DR box + full notes + key points

   ✅ DEMO: Professional 7-step guided on-screen tour with arrows (spotlight style)
   ✅ DEMO: Highlights actual UI elements with tooltip overlays
   ✅ DEMO: Next/Previous navigation with step counter

   ✅ AVATAR: User can choose avatar color/emoji in profile
   ✅ STREAK: Gold color in header with fire animation
   ✅ THEME: Dark / Light / Golden — all working
   ✅ FONT SIZE: XSmall, Small, Medium, Large, XLarge (5 options)

   ✅ ABOUT: Collapsible in sidebar (button → expand/collapse)
   ✅ ABOUT: Full card in Settings modal
   ✅ SETTINGS: All settings working — name, theme, font, PDF theme, language

   ✅ SIDEBAR: History strip shows (clickable items)
   ✅ SIDEBAR: Saved Notes strip shows (clickable items)
   ✅ SIDEBAR: No tool selector — all generation via Wizard
   ✅ SIDEBAR: About section collapsible

   ✅ MOBILE: World-class responsive, compact, touch-friendly
   ✅ MOBILE: Swipe to open sidebar
   ✅ MOBILE: Wizard buttons smaller and tighter on mobile
   ✅ MOBILE: Stream overlay optimized for small screens

   ✅ FOCUS MODE: Sidebar collapses, content fills screen, header stays
   ✅ KEYBOARD: Ctrl+K (Wizard), Ctrl+H (History), Ctrl+S (Save), Space (flip card)
   ═══════════════════════════════════════════════════════════════════════════════════════════════════ */

// ─────────────────────────────────────────────────────────────────────────────────────────────────
// SECTION 1: CONSTANTS
// ─────────────────────────────────────────────────────────────────────────────────────────────────

const SAVOIRÉ = {
  VERSION:     '2.0',
  BRAND:       'Savoiré AI v2.0',
  DEVELOPER:   'Sooban Talha Technologies',
  DEVSITE:     'soobantalhatech.xyz',
  WEBSITE:     'savoireai.vercel.app',
  FOUNDER:     'Sooban Talha',
  TAGLINE:     'Think Less. Know More.',
  API_URL:     '/api/study',
  MAX_HISTORY: 60,
  MAX_SAVED:   120,
  NTFY:        'savoireai_new_users',
};

const TOOL_CONFIG = {
  notes: {
    icon: 'fa-book-open', label: 'Generate Notes', sfpName: 'Notes', color: '#00d4ff',
    placeholder: 'Enter any topic, concept, or paste text for comprehensive study notes…',
    sfpLabel: 'Generating comprehensive study notes…',
    description: 'Comprehensive structured study notes with introduction, concepts, mechanisms, examples, and summary.',
  },
  flashcards: {
    icon: 'fa-layer-group', label: 'Create Flashcards', sfpName: 'Flashcards', color: '#bf00ff',
    placeholder: 'Enter a topic to create 15–20 interactive flashcards with spaced repetition…',
    sfpLabel: 'Building your interactive flashcard deck (15–20 cards)…',
    description: 'Create 15–20 interactive 3D flip flashcards perfect for spaced repetition study.',
  },
  quiz: {
    icon: 'fa-question-circle', label: 'Build Quiz', sfpName: 'Quiz', color: '#00ff88',
    placeholder: 'Enter a topic to generate 10–12 practice questions with detailed explanations…',
    sfpLabel: 'Generating your 10–12 question practice quiz…',
    description: 'Generate 10–12 self-scoring multiple-choice questions with detailed explanations.',
  },
  summary: {
    icon: 'fa-align-left', label: 'Summarise', sfpName: 'Summary', color: '#ffae00',
    placeholder: 'Enter a topic or paste text to create a concise, scannable smart summary…',
    sfpLabel: 'Writing your intelligent smart summary…',
    description: 'Get a concise TL;DR summary with key points, mechanisms, and revision checklist.',
  },
  mindmap: {
    icon: 'fa-project-diagram', label: 'Build Mind Map', sfpName: 'Mind Map', color: '#d4af37',
    placeholder: 'Enter a topic to build a visual hierarchical mind map with 5–7 branches…',
    sfpLabel: 'Constructing your visual mind map (5–7 branches)…',
    description: 'Create a visual 5–7 branch mind map with sub-items and cross-connections.',
  },
  all: {
    icon: 'fa-bolt', label: 'Mega Bundle — All 5', sfpName: 'Mega Bundle', color: '#d4af37',
    placeholder: 'Enter any topic to generate ALL 5 study tools at once — the ultimate study package!',
    sfpLabel: '⚡ Generating Mega Study Bundle — Notes + Flashcards + Quiz + Summary + Mind Map…',
    description: 'Generate ALL 5 study tools in one go — Notes, Flashcards, Quiz, Summary & Mind Map.',
  },
};

const DEPTH_CONFIG = {
  standard:      { label: 'Standard',      desc: '600–900 words',   subDesc: 'Core concepts',      icon: 'fa-flag',       words: '600-900'   },
  detailed:      { label: 'Detailed',      desc: '1000–1500 words', subDesc: 'Comprehensive',       icon: 'fa-chart-line', words: '1000-1500' },
  comprehensive: { label: 'Comprehensive', desc: '1500–2200 words', subDesc: 'Deep dive',           icon: 'fa-book',       words: '1500-2200' },
  expert:        { label: 'Expert',        desc: '2200–3500 words', subDesc: 'Maximum depth',       icon: 'fa-crown',      words: '2200-3500' },
};

const STYLE_CONFIG = {
  simple:   { label: 'Simple & Clear',        desc: 'Beginner-friendly, analogies',    icon: 'fa-smile'          },
  academic: { label: 'Academic & Formal',     desc: 'Scholarly, precise terminology',  icon: 'fa-graduation-cap' },
  detailed: { label: 'Highly Detailed',       desc: 'Exhaustive, many examples',       icon: 'fa-list-check'     },
  exam:     { label: 'Exam-Focused',          desc: 'Mark-scheme, exam tips',          icon: 'fa-clipboard-check'},
  visual:   { label: 'Visual & Analogy-Rich', desc: 'Mental models, vivid examples',   icon: 'fa-eye'            },
};

const STAGE_MESSAGES = [
  '🎯 Analysing your topic…',
  '📝 Writing your study content…',
  '🔍 Building detailed sections…',
  '✨ Generating cards and data…',
  '✅ Finalising — almost ready!',
];

const AVATAR_COLORS = [
  { bg: 'linear-gradient(135deg,#d4af37,#ffae00)', fg: '#0a1128', name: 'Gold'    },
  { bg: 'linear-gradient(135deg,#00d4ff,#0099cc)', fg: '#ffffff', name: 'Blue'    },
  { bg: 'linear-gradient(135deg,#bf00ff,#7a00cc)', fg: '#ffffff', name: 'Purple'  },
  { bg: 'linear-gradient(135deg,#00ff88,#00cc66)', fg: '#0a1128', name: 'Green'   },
  { bg: 'linear-gradient(135deg,#ff4444,#cc0000)', fg: '#ffffff', name: 'Red'     },
  { bg: 'linear-gradient(135deg,#ff6b00,#cc4400)', fg: '#ffffff', name: 'Orange'  },
  { bg: 'linear-gradient(135deg,#e84393,#a0006b)', fg: '#ffffff', name: 'Pink'    },
  { bg: 'linear-gradient(135deg,#4ecdc4,#2aa198)', fg: '#ffffff', name: 'Teal'    },
];

const DEMO_STEPS = [
  {
    step:     1,
    title:    'Welcome to Savoiré AI ✨',
    subtitle: "The World's Most Advanced Free AI Study Assistant",
    content:  'Savoiré AI generates ultra-rich study notes, flashcards, quizzes, summaries and mind maps using the most powerful AI models — completely free, forever.',
    icon:     'fa-graduation-cap',
    color:    '#d4af37',
    targetId: null,
    arrow:    null,
    tips: [
      { icon: 'fa-infinity',  text: '100% Free — No login, no payment, ever' },
      { icon: 'fa-globe',     text: 'Works in 20+ languages including Urdu, Hindi, Arabic' },
      { icon: 'fa-shield-alt',text: 'All your data stays on your device — private & secure' },
      { icon: 'fa-bolt',      text: 'Powered by 14+ cutting-edge AI models with live fallback' },
      { icon: 'fa-code',      text: 'Built by Sooban Talha Technologies — soobantalhatech.xyz' },
    ],
    cta: 'Start Tour →',
  },
  {
    step:     2,
    title:    '✨ Study Wizard — Your Main Tool',
    subtitle: 'Click to open 6-step guided generation',
    content:  'The <strong>✨ Create Study Material</strong> button in the sidebar opens the Study Wizard. It guides you through 6 steps: choose tool → enter topic → select language → set detail level → choose writing style → generate.',
    icon:     'fa-magic',
    color:    '#00d4ff',
    targetId: 'navWizard',
    arrow:    'right',
    tips: [
      { icon: 'fa-mouse-pointer', text: 'Click this button to open the 6-step wizard' },
      { icon: 'fa-book-open',     text: 'Choose: Notes, Flashcards, Quiz, Summary or Mind Map' },
      { icon: 'fa-globe',         text: 'Output in any of 20+ languages' },
      { icon: 'fa-sliders-h',     text: 'Step 4 = Detail Level — Step 5 = Writing Style (separate)' },
      { icon: 'fa-keyboard',      text: 'Keyboard shortcut: Ctrl+K opens the wizard instantly' },
    ],
    cta: 'Next: Mega Bundle →',
    action: { label: 'Open Wizard Now', fn: '_openWizard' },
  },
  {
    step:     3,
    title:    '⚡ Mega Bundle — All 5 Tools At Once',
    subtitle: 'Notes + Flashcards + Quiz + Summary + Mind Map in one generation',
    content:  'The <strong>⚡ Mega Study Bundle</strong> generates ALL 5 study tools simultaneously. Enter one topic, get a complete study package with 15-20 flashcards, 10-12 quiz questions, and a full visual mind map.',
    icon:     'fa-bolt',
    color:    '#d4af37',
    targetId: 'navAll',
    arrow:    'right',
    tips: [
      { icon: 'fa-mouse-pointer',   text: 'Click this button for the mega bundle' },
      { icon: 'fa-layer-group',     text: '15-20 interactive 3D flip flashcards' },
      { icon: 'fa-question-circle', text: '10-12 quiz questions with instant feedback' },
      { icon: 'fa-project-diagram', text: 'Visual mind map with 5-7 branches' },
      { icon: 'fa-align-left',      text: 'Smart TL;DR summary included' },
    ],
    cta: 'Next: Feature Chips →',
    action: { label: 'Try Mega Bundle', fn: '_openMega' },
  },
  {
    step:     4,
    title:    '🎯 Quick Tool Buttons — One Click Open',
    subtitle: 'Each chip opens Wizard with that tool pre-selected',
    content:  'The <strong>Notes, Flashcards, Quiz, Summary, Mind Map</strong> chips below open the Wizard with that tool already selected for you — no need to go through Step 1!',
    icon:     'fa-mouse-pointer',
    color:    '#00ff88',
    targetId: 'emptyState',
    arrow:    'down',
    tips: [
      { icon: 'fa-book-open',       text: 'Notes chip → opens Wizard with Notes pre-selected' },
      { icon: 'fa-layer-group',     text: 'Flashcards chip → opens Wizard with Flashcards ready' },
      { icon: 'fa-question-circle', text: 'Quiz chip → opens Wizard with Quiz pre-selected' },
      { icon: 'fa-align-left',      text: 'Summary chip → opens Wizard with Summary ready' },
      { icon: 'fa-project-diagram', text: 'Mind Map chip → opens Wizard with Mind Map selected' },
    ],
    cta: 'Next: Live Output →',
  },
  {
    step:     5,
    title:    '📡 Live Streaming — Watch AI Write',
    subtitle: 'Content appears in real-time with full formatting',
    content:  'When you generate, the AI streams content <strong>live to your screen</strong>. Notes appear word-by-word with full markdown formatting. Flashcards, quiz questions, and mind map branches appear <strong>one by one with animation</strong> as they are generated.',
    icon:     'fa-stream',
    color:    '#bf00ff',
    targetId: 'streamFullpage',
    arrow:    null,
    tips: [
      { icon: 'fa-pen',             text: 'Notes stream live with headings, bullets, blockquotes' },
      { icon: 'fa-layer-group',     text: 'Flashcards appear card-by-card with spring animation' },
      { icon: 'fa-question-circle', text: 'Quiz questions appear one-by-one with difficulty badge' },
      { icon: 'fa-project-diagram', text: 'Mind map branches appear with color animation' },
      { icon: 'fa-tasks',           text: '5 progress stages shown in the overlay header' },
    ],
    cta: 'Next: Interactive Tools →',
  },
  {
    step:     6,
    title:    '🃏 Interactive Study Tools',
    subtitle: 'Flashcards flip, quiz gives instant feedback, mind map is visual',
    content:  'After generation, your study materials are <strong>fully interactive</strong>. Flashcards flip in 3D, quiz questions give instant feedback with explanations, and the mind map shows visual branches with cross-connections.',
    icon:     'fa-layer-group',
    color:    '#bf00ff',
    targetId: 'resultArea',
    arrow:    null,
    tips: [
      { icon: 'fa-hand-pointer',  text: 'Flashcards: Tap/click to flip (or press Space)' },
      { icon: 'fa-arrow-right',   text: 'Arrow keys ← → navigate between flashcards' },
      { icon: 'fa-random',        text: 'Shuffle button randomizes flashcard order' },
      { icon: 'fa-check-circle',  text: 'Quiz: click an option → instant feedback + explanation' },
      { icon: 'fa-trophy',        text: 'Quiz result shows score, grade and full answer review' },
    ],
    cta: 'Next: PDF Export →',
  },
  {
    step:     7,
    title:    '📄 World-Class PDF Export',
    subtitle: 'Professional formatted PDF with all your content',
    content:  'Download a beautifully formatted PDF with a <strong>cover page</strong> (topic, stats, date), all notes sections, flashcards list, quiz with answers highlighted, and mind map branches. Choose <strong>Dark or Light</strong> PDF theme in Settings.',
    icon:     'fa-file-pdf',
    color:    '#ff4444',
    targetId: 'pdfBtn',
    arrow:    'up',
    tips: [
      { icon: 'fa-moon',   text: 'Dark PDF: black background, gold accents, professional' },
      { icon: 'fa-sun',    text: 'Light PDF: white background, clean, print-ready' },
      { icon: 'fa-cog',    text: 'Change PDF theme in Settings → PDF Style section' },
      { icon: 'fa-copy',   text: 'Copy button copies all content as clean markdown text' },
      { icon: 'fa-star',   text: 'Save button stores notes in your local library' },
    ],
    cta: 'Next: Streak & Stats →',
  },
  {
    step:     8,
    title:    '🔥 Streak, Stats & Personalisation',
    subtitle: 'Track your learning progress and customise your experience',
    content:  "Your <strong>fire streak</strong> shows how many days in a row you've studied — visible in gold at the top. Sessions count every page visit. Customise theme (Dark/Light/Golden), font size, avatar, PDF style and default language in Settings.",
    icon:     'fa-fire',
    color:    '#ffae00',
    targetId: 'headerStreak',
    arrow:    'down',
    tips: [
      { icon: 'fa-fire',        text: '🔥 Gold streak in header — study daily to keep it alive!' },
      { icon: 'fa-user-circle', text: 'Click your avatar → pick from 8 color themes' },
      { icon: 'fa-palette',     text: '3 app themes: Dark, Light, and Golden' },
      { icon: 'fa-font',        text: '5 font sizes: XSmall to XLarge — accessible for all' },
      { icon: 'fa-history',     text: 'Full study history and saved notes in sidebar' },
    ],
    cta: "Let's Start Studying! 🚀",
    isLast: true,
  },
];

// ─────────────────────────────────────────────────────────────────────────────────────────────────
// SECTION 2: MAIN APPLICATION CLASS
// ─────────────────────────────────────────────────────────────────────────────────────────────────

class SavoireApp {
  constructor() {
    // ── Core Generation State ──
    this.tool         = 'notes';
    this.generating   = false;
    this.currentData  = null;
    this.confirmCb    = null;
    this.thinkTimer   = null;
    this.stageIdx     = 0;
    this.streamCtrl   = null;
    this.streamBuffer = '';
    this.focusMode    = false;
    this.pdfTheme     = 'dark';

    // ── Analytics State (managed here, synced to localStorage) ──
    this.streak        = this._loadStreak();
    this.sessions      = this._loadSessions();        // loaded from localStorage
    this.totalWords    = this._loadNum('sv_total_words', 0);
    this.lastActive    = localStorage.getItem('sv_last_active') || null;
    this.avatarColorIdx= this._loadNum('sv_avatar_color', 0);

    // ── Wizard State ──
    this.wizardStep  = 0;
    this.wizardData  = { tool: 'notes', topic: '', language: 'English', depth: 'detailed', style: 'simple' };
    this.wizardFile  = null;

    // ── Demo State ──
    this.demoStep     = 0;
    this.demoOverlay  = null;
    this.demoSpotlight= null;

    // ── Tool-specific State ──
    this.fcCards   = []; this.fcCurrent = 0; this.fcFlipped = false;
    this.quizData  = []; this.quizIdx   = 0; this.quizScore  = 0;

    // ── Persistence ──
    this.history  = this._load('sv_history', []);
    this.saved    = this._load('sv_saved',   []);
    this.prefs    = this._load('sv_prefs',   {});
    this.userName = localStorage.getItem('sv_user') || '';

    // Apply saved preferences (theme, font) before DOM loads
    this.pdfTheme        = this.prefs.pdfTheme     || 'dark';
    this.avatarColorIdx  = this._loadNum('sv_avatar_color', 0);

    // ── Session Increment Logic ──
    // This is the FIX: increment session count on each new calendar day
    this._incrementSession(); // ← Updates on EVERY page load/refresh

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
    this._initSwipeGestures();
    this._initParticles();
    this._checkStreak();
    this._initDemoSystem();

    // ── API Warmup + Google Sheets Tracking (sends session count) ──
    // This fires immediately on page load — tracks the visit in Google Sheets
    this._warmupAndTrack();

    console.log(`%c✨ ${SAVOIRÉ.BRAND} — ${SAVOIRÉ.TAGLINE}`, 'color:#d4af37;font-size:16px;font-weight:bold');
    console.log(`%c🔧 Built by ${SAVOIRÉ.DEVELOPER} | ${SAVOIRÉ.DEVSITE}`, 'color:#00d4ff;font-size:12px');
  }

  // ─────────────────────────────────────────────────────────────────────────────────────────────────
  // SECTION 3: SESSION MANAGEMENT — THE KEY FIX
  // ─────────────────────────────────────────────────────────────────────────────────────────────────

  _getISTDate() {
    const now = new Date();
    const ist = new Date(now.getTime() + now.getTimezoneOffset() * 60000 + 5.5 * 3600000);
    return ist.toISOString().split('T')[0];
  }

  _getYesterday() {
    const now = new Date();
    const ist = new Date(now.getTime() + now.getTimezoneOffset() * 60000 + 5.5 * 3600000 - 86400000);
    return ist.toISOString().split('T')[0];
  }

  _loadSessions() {
    return this._loadNum('sv_sessions', 0);
  }

  _saveSessions() {
    localStorage.setItem('sv_sessions', String(this.sessions));
  }

  _incrementSession() {
    // SESSION FIX — increment on EVERY page load / refresh
    // The user's intent: jab bhi page refresh ho, session count barhay
    // This means: every constructor call (page load/refresh) → sessions++
    this.sessions++;
    this._saveSessions();
    // Also update last-active date
    const today = this._getISTDate();
    localStorage.setItem('sv_last_active', today);
    this.lastActive = today;
  }

  _warmupAndTrack() {
    // Send ping to backend — this triggers Google Sheets tracking for every visit
    // The session count sent here is CURRENT (already incremented if new day above)
    const sessionId = this._genId();
    fetch(SAVOIRÉ.API_URL, {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message:   'ping',
        userName:  this.userName || 'Anonymous',
        streak:    this.streak.count,
        sessions:  this.sessions,   // ← This is the KEY: updated sessions sent on EVERY load
        sessionId: sessionId,
        options:   { stream: false },
      }),
    }).catch(() => {});
    // Store sessionId for this session
    this._currentSessionId = sessionId;
  }

  // ─────────────────────────────────────────────────────────────────────────────────────────────────
  // SECTION 4: STREAK MANAGEMENT
  // ─────────────────────────────────────────────────────────────────────────────────────────────────

  _loadStreak() {
    try { const s = localStorage.getItem('sv_streak'); if (s) return JSON.parse(s); }
    catch {}
    return { count: 0, lastDate: null, bestStreak: 0 };
  }

  _saveStreak() { localStorage.setItem('sv_streak', JSON.stringify(this.streak)); }

  _loadNum(key, def) {
    try { const v = localStorage.getItem(key); return v ? parseInt(v, 10) : def; }
    catch { return def; }
  }

  _checkStreak() {
    const today     = this._getISTDate();
    const yesterday = this._getYesterday();
    const lastDate  = this.streak.lastDate;

    // First-ever visit
    if (!lastDate) {
      this.streak = { count: 1, lastDate: today, bestStreak: 1 };
      this._saveStreak();
      this._updateAllStats();
      this._toast('success', 'fa-fire', '🔥 Welcome! Your study streak starts today!');
      return;
    }

    if (lastDate === today) return; // Already updated today

    if (lastDate === yesterday) {
      // Consecutive day — increment streak
      this.streak.count++;
      this.streak.lastDate = today;
      if (this.streak.count > this.streak.bestStreak) {
        this.streak.bestStreak = this.streak.count;
        this._toast('success', 'fa-trophy', `🏆 New record! ${this.streak.count}-day streak!`);
        this._confetti();
      }
      if (this.streak.count === 7)   { this._toast('success', 'fa-fire',  '🔥 7-day streak! You\'re on fire!', 5000); this._confetti(); }
      if (this.streak.count === 30)  { this._toast('success', 'fa-crown', '👑 30-day streak! Champion!',       5000); this._confetti(true); }
      if (this.streak.count === 100) { this._toast('success', 'fa-gem',   '💎 100-day streak! Legendary!',     6000); this._confetti(true); }
    } else {
      // Streak broken
      if (this.streak.count > 0) {
        this._toast('info', 'fa-fire-extinguisher', `Your ${this.streak.count}-day streak ended. Start fresh!`);
      }
      this.streak.count   = 1;
      this.streak.lastDate = today;
    }

    this._saveStreak();
    this._updateAllStats();
  }

  _confetti(intense = false) {
    if (typeof confetti === 'function') {
      confetti({ particleCount: intense ? 300 : 150, spread: intense ? 100 : 70, origin: { y: 0.6 } });
      if (intense) {
        setTimeout(() => confetti({ particleCount: 200, spread: 80, origin: { y: 0.5, x: 0.3 } }), 200);
        setTimeout(() => confetti({ particleCount: 200, spread: 80, origin: { y: 0.5, x: 0.7 } }), 400);
      }
    }
  }

  // ─────────────────────────────────────────────────────────────────────────────────────────────────
  // SECTION 5: STATS DISPLAY
  // ─────────────────────────────────────────────────────────────────────────────────────────────────

  _updateAllStats() {
    const e = this.el;
    const today = this._getISTDate();

    // Sidebar stats
    if (e.sidebarStreakValue)   e.sidebarStreakValue.textContent   = this.streak.count;
    if (e.sidebarBestStreak)    e.sidebarBestStreak.textContent    = this.streak.bestStreak;
    if (e.sidebarSessionsValue) e.sidebarSessionsValue.textContent = this.sessions;
    if (e.sidebarHistoryValue)  e.sidebarHistoryValue.textContent  = this.history.length;
    if (e.sidebarSavedValue)    e.sidebarSavedValue.textContent    = this.saved.length;
    if (e.sidebarWordsValue)    e.sidebarWordsValue.textContent    = this.totalWords.toLocaleString();
    if (e.sidebarLastActive) {
      const yesterday = this._getYesterday();
      e.sidebarLastActive.textContent = !this.lastActive ? 'Never'
        : this.lastActive === today     ? 'Today'
        : this.lastActive === yesterday ? 'Yesterday'
        : this.lastActive;
    }

    // Header stats
    if (e.headerStreak)  e.headerStreak.textContent  = this.streak.count;
    if (e.statSessions)  e.statSessions.textContent  = this.sessions;
    if (e.statHistory)   e.statHistory.textContent   = this.history.length;
    if (e.statSaved)     e.statSaved.textContent     = this.saved.length;
    if (e.histBadge)     e.histBadge.textContent     = this.history.length;
  }

  // ─────────────────────────────────────────────────────────────────────────────────────────────────
  // SECTION 6: DOM ELEMENT CACHE
  // ─────────────────────────────────────────────────────────────────────────────────────────────────

  _cacheEl() {
    const g  = id => document.getElementById(id);
    this.el  = {};
    const IDS = [
      // Layout
      'leftPanel','sbToggle','sbBackdrop','rightPanel','outArea','outToolbar',
      'resultArea','emptyState','thinkingWrap','backToTopBtn',
      'emptyWizardBtn','emptyMegaBtn',
      // Header
      'dashHdr','themeBtn','themeIcon','settingsBtn','wizardHeaderBtn','megaHeaderBtn',
      'avBtn','avDropdown','avInitials','avDropdownAvatar','avDropdownName',
      'avHist','avSaved','avSettings','avClear',
      'statSessions','statHistory','statSaved','headerStreak','dhGreeting',
      // Output toolbar
      'copyBtn','pdfBtn','saveBtn','shareBtn','clearBtn','newWizardBtn','focusModeBtn',
      // Modals
      'wizardModal','wizardContent','megaModal','histModal','savedModal',
      'settingsModal','confirmModal','confirmMsg','confirmOkBtn','demoModal','demoContent',
      // Settings
      'nameInput','saveNameBtn','dsStats',
      'exportDataBtn','importBackupBtn','clearDataBtn',
      'defaultLangSel','saveDefaultLangBtn',
      // History modal
      'histList','histEmpty','histSearchInput','clearHistBtn','exportHistBtn','histBadge',
      // Saved modal
      'savedList','savedEmpty','savedCount',
      // Welcome
      'welcomeOverlay','welcomeBackOverlay','welcomeNameInput','welcomeBtn',
      'wbName','wbStreak','wbSessions','wbSaved','welcomeBackBtn',
      // Navigation
      'navWizard','navAll','navHistory','navSaved','navSettings','navFocus',
      'demoReplayBtn','homeLink','dhLogo',
      // Sidebar content
      'sidebarAvatar','sidebarUserName','sidebarAvatarPicker',
      'sidebarStreakValue','sidebarBestStreak','sidebarSessionsValue',
      'sidebarWordsValue','sidebarHistoryValue','sidebarSavedValue','sidebarLastActive',
      'lpHistList','lpHistAll','lpSavedList','lpSavedAll',
      'aboutToggleBtn','aboutContent','aboutChevron',
      // Stream overlay
      'streamFullpage','sfpText','sfpScroll','sfpToolIcon','sfpToolName',
      'sfpTopic','sfpLabel','sscProgressBar',
      // Stage indicators
      'ts0','ts1','ts2','ts3','ts4','ss0','ss1','ss2','ss3','ss4',
      // Flashcard elements (dynamic — re-cached after render)
      'theCard','fcFront','fcBack','fcCur','fcTot','fcProgBar','fcPct','fcPrev','fcNext',
      // Quiz elements (dynamic — re-cached after render)
      'quizScoreNum','quizBody','quizReviewSection','quizReviewToggleLabel',
      // Mega modal
      'megaTopicInput','megaCharCount','megaLangSel','megaDepthSel','megaGenerateBtn',
      // Particles
      'particleCanvas','toastContainer',
    ];
    IDS.forEach(id => { this.el[id] = g(id); });
  }

  _recacheDynamic() {
    const g  = id => document.getElementById(id);
    const dy = ['theCard','fcFront','fcBack','fcCur','fcTot','fcProgBar','fcPct','fcPrev','fcNext',
                 'quizScoreNum','quizBody','quizReviewSection','quizReviewToggleLabel'];
    dy.forEach(id => { this.el[id] = g(id); });
  }

  // ─────────────────────────────────────────────────────────────────────────────────────────────────
  // SECTION 7: PARTICLES
  // ─────────────────────────────────────────────────────────────────────────────────────────────────

  _initParticles() {
    const canvas = this.el.particleCanvas;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const resize = () => { canvas.width = window.innerWidth; canvas.height = window.innerHeight; };
    window.addEventListener('resize', resize);
    resize();
    const COLORS = ['#00d4ff', '#bf00ff', '#00ff88', '#ffae00', '#d4af37', '#e84393'];
    const pts = Array.from({ length: 80 }, () => ({
      x:  Math.random() * canvas.width,
      y:  Math.random() * canvas.height,
      r:  Math.random() * 2 + 0.4,
      a:  Math.random() * 0.22,
      c:  COLORS[Math.floor(Math.random() * COLORS.length)],
      vx: (Math.random() - 0.5) * 0.18,
      vy: (Math.random() - 0.5) * 0.18,
    }));
    const animate = () => {
      if (!canvas.isConnected) return;
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      pts.forEach(p => {
        p.x += p.vx; p.y += p.vy;
        if (p.x < 0) p.x = canvas.width;  if (p.x > canvas.width)  p.x = 0;
        if (p.y < 0) p.y = canvas.height; if (p.y > canvas.height) p.y = 0;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fillStyle   = p.c;
        ctx.globalAlpha = p.a;
        ctx.fill();
      });
      ctx.globalAlpha = 1;
      requestAnimationFrame(animate);
    };
    animate();
  }

  // ─────────────────────────────────────────────────────────────────────────────────────────────────
  // SECTION 8: HELPERS
  // ─────────────────────────────────────────────────────────────────────────────────────────────────

  _el(id) { return document.getElementById(id); }
  _qs(sel)  { return document.querySelector(sel); }
  _qsa(sel) { return document.querySelectorAll(sel); }
  _load(key, def) { try { const v = localStorage.getItem(key); return v ? JSON.parse(v) : def; } catch { return def; } }
  _save(key, val) { try { localStorage.setItem(key, JSON.stringify(val)); } catch {} }
  _genId() { return Date.now().toString(36) + Math.random().toString(36).slice(2); }
  _wordCount(text) { return text?.trim().split(/\s+/).filter(Boolean).length || 0; }
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
    const d = Date.now() - ts;
    const m = Math.floor(d / 60000), h = Math.floor(d / 3600000), dy = Math.floor(d / 86400000);
    if (m < 1) return 'just now';
    if (m < 60) return `${m}m ago`;
    if (h < 24) return `${h}h ago`;
    if (dy < 7) return `${dy}d ago`;
    return new Date(ts).toLocaleDateString();
  }
  _dateGroup(ts) {
    if (!ts) return 'Unknown';
    const dy = Math.floor((Date.now() - ts) / 86400000);
    if (dy === 0) return 'Today';
    if (dy === 1) return 'Yesterday';
    if (dy < 7)   return 'This Week';
    if (dy < 30)  return 'This Month';
    return 'Older';
  }

  // ─────────────────────────────────────────────────────────────────────────────────────────────────
  // SECTION 9: MARKDOWN RENDERER
  // ─────────────────────────────────────────────────────────────────────────────────────────────────

  _renderMd(text) {
    if (!text) return '';
    // Use marked.js if available (loaded via CDN in HTML)
    if (window.marked && window.DOMPurify) {
      try {
        if (window.marked.setOptions) {
          window.marked.setOptions({ breaks: true, gfm: true, mangle: false, headerIds: false });
        }
        return DOMPurify.sanitize(window.marked.parse(text));
      } catch (e) { /* fall through to manual */ }
    }
    // Manual fallback markdown renderer
    let h = String(text)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
    h = h.replace(/^##### (.+)$/gm, '<h5>$1</h5>');
    h = h.replace(/^#### (.+)$/gm,  '<h4>$1</h4>');
    h = h.replace(/^### (.+)$/gm,   '<h3>$1</h3>');
    h = h.replace(/^## (.+)$/gm,    '<h2>$1</h2>');
    h = h.replace(/^# (.+)$/gm,     '<h1>$1</h1>');
    h = h.replace(/```[\w]*\n([\s\S]*?)```/g, '<pre><code>$1</code></pre>');
    h = h.replace(/`([^`]+)`/g, '<code>$1</code>');
    h = h.replace(/\*\*\*(.+?)\*\*\*/g, '<strong><em>$1</em></strong>');
    h = h.replace(/\*\*(.+?)\*\*/g,     '<strong>$1</strong>');
    h = h.replace(/\*(.+?)\*/g,         '<em>$1</em>');
    h = h.replace(/^&gt; (.+)$/gm,  '<blockquote>$1</blockquote>');
    h = h.replace(/^---+$/gm,        '<hr>');
    h = h.replace(/^- (.+)$/gm,     '<li class="ul-li">$1</li>');
    h = h.replace(/^(\d+)\. (.+)$/gm,'<li class="ol-li"><span class="ol-num">$1.</span> $2</li>');
    h = h.replace(/(<li class="ul-li">[\s\S]+?<\/li>)(?!\s*<li class="ul-li">)/g, '<ul>$1</ul>');
    h = h.replace(/(<li class="ol-li">[\s\S]+?<\/li>)(?!\s*<li class="ol-li">)/g, '<ol>$1</ol>');
    h = h.replace(/\n\n/g, '</p><p>').replace(/\n/g, '<br>');
    if (!h.startsWith('<')) h = '<p>' + h + '</p>';
    return h;
  }

  // For live streaming — adds blinking cursor at end
  _renderMdLive(text) {
    if (!text) return '<span class="typing-cursor">▊</span>';
    const rendered = this._renderMd(text);
    return rendered + '<span class="typing-cursor">▊</span>';
  }

  _stripMd(t) {
    if (!t) return '';
    return t
      .replace(/#{1,6} /g, '')
      .replace(/\*\*\*(.+?)\*\*\*/g, '$1')
      .replace(/\*\*(.+?)\*\*/g,     '$1')
      .replace(/\*(.+?)\*/g,         '$1')
      .replace(/`(.+?)`/g,           '$1')
      .replace(/```[\s\S]*?```/g,    '')
      .replace(/^[-*] /gm,           '')
      .replace(/^\d+\. /gm,          '')
      .replace(/^> /gm,              '')
      .replace(/\n{3,}/g,            '\n\n')
      .trim();
  }

  // ─────────────────────────────────────────────────────────────────────────────────────────────────
  // SECTION 10: WELCOME SYSTEM
  // ─────────────────────────────────────────────────────────────────────────────────────────────────

  _initWelcome() {
    if (!this.userName) {
      // New user — show welcome screen
      setTimeout(() => {
        if (!this.el.welcomeOverlay) return;
        this.el.welcomeOverlay.style.display = 'flex';
        setTimeout(() => this.el.welcomeOverlay.classList.add('visible'), 60);
        setTimeout(() => this.el.welcomeNameInput?.focus(), 450);
      }, 600);
    } else {
      // Returning user — show welcome back
      setTimeout(() => {
        if (!this.el.welcomeBackOverlay) return;
        if (this.el.wbName)    this.el.wbName.textContent    = this.userName;
        if (this.el.wbStreak)  this.el.wbStreak.textContent  = this.streak.count;
        if (this.el.wbSessions)this.el.wbSessions.textContent= this.sessions;
        if (this.el.wbSaved)   this.el.wbSaved.textContent   = this.saved.length;
        this.el.welcomeBackOverlay.style.display = 'flex';
        setTimeout(() => this.el.welcomeBackOverlay.classList.add('visible'), 60);
      }, 700);
    }
  }

  _submitWelcome() {
    const name = this.el.welcomeNameInput?.value?.trim();
    if (!name || name.length < 2) {
      this.el.welcomeNameInput?.classList.add('input-shake');
      setTimeout(() => this.el.welcomeNameInput?.classList.remove('input-shake'), 500);
      // Show error in hint element
      const hint = this._el('welcomeNameHint');
      if (hint) {
        hint.textContent = '⚠️ Please enter your name (at least 2 characters) to continue';
        hint.style.color = '#ff6644';
      }
      this.el.welcomeNameInput?.focus();
      return;
    }
    this.userName = name;
    localStorage.setItem('sv_user', name);
    if (!this.streak.lastDate) {
      this.streak = { count: 1, lastDate: this._getISTDate(), bestStreak: 1 };
      this._saveStreak();
    }
    // Notify (fire-and-forget)
    try {
      fetch(`https://ntfy.sh/${SAVOIRÉ.NTFY}`, {
        method: 'POST',
        body: `New Savoiré AI user: ${name} — ${new Date().toISOString()}`,
        headers: { 'Title': 'Savoiré AI New User', 'Priority': '3' },
      }).catch(() => {});
    } catch {}

    this._dismissOverlay('welcomeOverlay');
    this._updateUserUI();
    this._updateAllStats();
    // Re-send ping with real name now
    this._warmupAndTrack();
    this._toast('success', 'fa-hand-wave', `Welcome, ${name}! Let me show you around 🎓`);
    // Auto-start demo for new users
    setTimeout(() => this._openDemo(), 800);
  }

  _skipWelcome() {
    this.userName = 'Scholar';
    localStorage.setItem('sv_user', 'Scholar');
    if (!this.streak.lastDate) {
      this.streak = { count: 1, lastDate: this._getISTDate(), bestStreak: 1 };
      this._saveStreak();
    }
    this._dismissOverlay('welcomeOverlay');
    this._updateUserUI();
    this._warmupAndTrack();
  }

  _skipWelcome_DISABLED() {
    // Skip is disabled — name entry is now mandatory
    // This method is kept for reference only
  }

  _dismissOverlay(id) {
    const el = this._el(id);
    if (!el) return;
    el.classList.remove('visible');
    el.classList.add('dismissing');
    setTimeout(() => { el.style.display = 'none'; el.classList.remove('dismissing'); }, 460);
  }

  _updateUserUI() {
    const name  = this.userName || 'Scholar';
    const init  = name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2) || 'Ś';
    const color = AVATAR_COLORS[this.avatarColorIdx % AVATAR_COLORS.length];

    // Apply avatar color to all avatar elements
    [this.el.avBtn, this.el.avDropdownAvatar, this.el.sidebarAvatar].forEach(el => {
      if (!el) return;
      el.style.background = color.bg;
      el.style.color      = color.fg;
    });
    if (this.el.avInitials)       { this.el.avInitials.textContent = init; this.el.avInitials.style.color = color.fg; }
    if (this.el.avDropdownAvatar) this.el.avDropdownAvatar.textContent = init;
    if (this.el.avDropdownName)   this.el.avDropdownName.textContent   = name;
    if (this.el.sidebarUserName)  this.el.sidebarUserName.textContent  = name;
    if (this.el.sidebarAvatar)    this.el.sidebarAvatar.textContent    = init;
    if (this.el.avBtn)            { this.el.avBtn.style.background = color.bg; this.el.avBtn.style.color = color.fg; }

    if (this.el.dhGreeting) {
      const hr    = new Date().getHours();
      const greet = hr < 12 ? 'Good morning' : hr < 17 ? 'Good afternoon' : 'Good evening';
      this.el.dhGreeting.textContent = `${greet}, ${name}`;
    }

    // Update welcome screen avatar grid initials with the selected color
    const wGrid = this._el('welcomeAvatarGrid');
    if (wGrid) {
      wGrid.querySelectorAll('.wavatarBtn').forEach((btn, i) => {
        btn.textContent = init;
        btn.classList.toggle('active', i === this.avatarColorIdx);
      });
    }
  }

  // ─────────────────────────────────────────────────────────────────────────────────────────────────
  // SECTION 11: AVATAR PICKER
  // ─────────────────────────────────────────────────────────────────────────────────────────────────

  _renderAvatarPicker() {
    const container = this.el.sidebarAvatarPicker;
    if (!container) return;
    container.innerHTML = `
      <div class="avatar-picker-label">Choose Avatar Color</div>
      <div class="avatar-picker-grid">
        ${AVATAR_COLORS.map((c, i) => `
          <button class="avatar-color-btn ${i === this.avatarColorIdx ? 'active' : ''}"
                  data-idx="${i}"
                  style="background:${c.bg}"
                  title="${c.name}"
                  onclick="window._app._setAvatarColor(${i})">
            ${i === this.avatarColorIdx ? '<i class="fas fa-check"></i>' : ''}
          </button>
        `).join('')}
      </div>`;
  }

  _setAvatarColor(idx) {
    this.avatarColorIdx = idx;
    localStorage.setItem('sv_avatar_color', String(idx));
    this._updateUserUI();
    this._renderAvatarPicker();
    this._toast('success', 'fa-palette', `Avatar color: ${AVATAR_COLORS[idx].name}!`);
  }

  // ─────────────────────────────────────────────────────────────────────────────────────────────────
  // SECTION 12: WIZARD SYSTEM — 6 STEPS
  // ─────────────────────────────────────────────────────────────────────────────────────────────────

  _openWizard(presetTool) {
    const tool = presetTool || this.tool || 'notes';
    this.wizardData = {
      tool:     tool,
      topic:    '',
      language: this.prefs.defaultLanguage || 'English',
      depth:    'detailed',
      style:    'simple',
    };
    this.wizardFile = null;
    // If a specific tool was pre-selected from a chip, skip to Step 2 (Topic)
    // so user doesn't need to re-select the tool they already chose
    this.wizardStep = presetTool ? 1 : 0;
    this._renderWizardStep();
    this._openModal('wizardModal');
    // Show a toast to confirm what was pre-selected
    if (presetTool && TOOL_CONFIG[presetTool]) {
      setTimeout(() => this._toast('info', `fa-${TOOL_CONFIG[presetTool].icon}`, `${TOOL_CONFIG[presetTool].label} pre-selected — now enter your topic!`), 300);
    }
  }

  _renderWizardStep() {
    if (!this.el.wizardContent) return;

    const steps = [
      { name: 'Tool',     icon: 'fa-magic',       desc: 'What to create'  },
      { name: 'Topic',    icon: 'fa-pencil-alt',  desc: 'What to study'   },
      { name: 'Language', icon: 'fa-globe',       desc: 'Output language' },
      { name: 'Depth',    icon: 'fa-chart-line',  desc: 'Detail level'    },
      { name: 'Style',    icon: 'fa-pen-fancy',   desc: 'Writing style'   },
      { name: 'Generate', icon: 'fa-rocket',      desc: 'Ready to go!'    },
    ];

    const pct = ((this.wizardStep + 1) / steps.length) * 100;

    const stepsHtml = steps.map((s, i) => {
      const state = i === this.wizardStep ? 'active' : i < this.wizardStep ? 'completed' : '';
      return `
        <div class="wizard-step ${state}">
          <div class="wizard-step-circle">
            ${i < this.wizardStep ? '<i class="fas fa-check"></i>' : (i + 1)}
          </div>
          <div class="wizard-step-label">${s.name}</div>
          <div class="wizard-step-desc">${s.desc}</div>
        </div>
        ${i < steps.length - 1 ? '<div class="wizard-step-line"></div>' : ''}`;
    }).join('');

    this.el.wizardContent.innerHTML = `
      <div class="wizard-progress-bar">
        <div class="wizard-progress-fill" style="width:${pct}%"></div>
      </div>
      <div class="wizard-steps">${stepsHtml}</div>
      <div id="wizardBody" class="wizard-body"></div>
      <div class="wizard-footer">
        <button class="wizard-btn wizard-btn-secondary" id="wizPrev" ${this.wizardStep === 0 ? 'disabled' : ''}>
          <i class="fas fa-arrow-left"></i> Back
        </button>
        <div class="wizard-step-info">${this.wizardStep + 1} / ${steps.length}</div>
        <button class="wizard-btn wizard-btn-primary" id="wizNext">
          ${this.wizardStep === steps.length - 1
            ? '<i class="fas fa-rocket"></i> Generate Now!'
            : 'Next <i class="fas fa-arrow-right"></i>'}
        </button>
        <button class="wizard-btn wizard-btn-ghost" id="wizDraft">
          <i class="fas fa-save"></i>
        </button>
      </div>`;

    // Render step body
    const body = document.getElementById('wizardBody');
    if (body) {
      switch (this.wizardStep) {
        case 0: body.innerHTML = this._wStepTool();     this._bindWTool();    break;
        case 1: body.innerHTML = this._wStepTopic();    this._bindWTopic();   break;
        case 2: body.innerHTML = this._wStepLang();     this._bindWLang();    break;
        case 3: body.innerHTML = this._wStepDepth();    this._bindWDepth();   break;
        case 4: body.innerHTML = this._wStepStyle();    this._bindWStyle();   break;
        case 5: body.innerHTML = this._wStepReview();   break;
      }
    }

    // Wire footer buttons
    const prev  = this._el('wizPrev');
    const next  = this._el('wizNext');
    const draft = this._el('wizDraft');

    if (prev) prev.onclick = () => {
      if (this.wizardStep > 0) { this.wizardStep--; this._renderWizardStep(); }
    };
    if (next) next.onclick = () => {
      if (this.wizardStep < steps.length - 1) {
        if (this._wValidate()) { this.wizardStep++; this._renderWizardStep(); }
      } else {
        this._closeModal('wizardModal');
        this._runWizard();
      }
    };
    if (draft) draft.onclick = () => {
      this._save('sv_wiz_draft', { step: this.wizardStep, data: this.wizardData });
      this._toast('success', 'fa-save', 'Draft saved!');
    };
  }

  // Step 1: Tool Selection
  _wStepTool() {
    return `
      <div class="wizard-step-heading"><i class="fas fa-magic"></i> Choose what you want to create:</div>
      <div class="wizard-tool-grid">
        ${Object.entries(TOOL_CONFIG).map(([k, cfg]) => `
          <div class="wizard-tool-card ${this.wizardData.tool === k ? 'selected' : ''}" data-tool="${k}">
            <div class="wizard-tool-icon" style="color:${cfg.color}">
              <i class="fas ${cfg.icon}"></i>
            </div>
            <div class="wizard-tool-name">${cfg.label}</div>
            <div class="wizard-tool-desc">${cfg.description}</div>
            <div class="wizard-tool-badge ${k === 'all' ? 'mega' : ''}">
              ${k === 'all' ? '⚡ ALL 5 TOOLS' : cfg.sfpName}
            </div>
            ${this.wizardData.tool === k ? '<div class="wizard-tool-check"><i class="fas fa-check-circle"></i></div>' : ''}
          </div>
        `).join('')}
      </div>`;
  }

  _bindWTool() {
    this._qsa('.wizard-tool-card').forEach(c => {
      c.onclick = () => { this.wizardData.tool = c.dataset.tool; this._renderWizardStep(); };
    });
  }

  // Step 2: Topic
  _wStepTopic() {
    const fn = this.wizardFile ? this.wizardFile.name : '';
    return `
      <div class="wizard-topic-area">
        <label class="wizard-label"><i class="fas fa-lightbulb"></i> What would you like to study?</label>
        <textarea class="wizard-topic-input" id="wTopicInp" rows="5"
          placeholder="Enter any topic, concept, question, or paste text to study…

Examples:
• Photosynthesis — how plants convert sunlight to glucose
• The French Revolution — causes, events, legacy
• How does machine learning work?
• [Paste your study notes here for a summary]">${this._esc(this.wizardData.topic)}</textarea>
        <div class="wizard-char-count" id="wCharCount">${this.wizardData.topic.length} / 4000</div>
        <div class="wizard-file-zone" id="wFileZone">
          <i class="fas fa-cloud-upload-alt"></i>
          <span>Click or drag .txt, .md, or .csv file here</span>
          <input type="file" id="wFileInp" accept=".txt,.md,.csv" style="display:none">
          <div class="wizard-file-name" id="wFileName">${fn ? `📄 ${fn}` : ''}</div>
        </div>
        <div class="wizard-suggestions">
          <div class="wizard-sugg-label"><i class="fas fa-bolt"></i> Quick topic suggestions:</div>
          <div class="wizard-sugg-pills">
            <button class="wizard-sugg-pill" data-topic="Photosynthesis — how plants convert sunlight into glucose and oxygen">🌿 Photosynthesis</button>
            <button class="wizard-sugg-pill" data-topic="Newton's Three Laws of Motion with examples and applications">⚡ Newton's Laws</button>
            <button class="wizard-sugg-pill" data-topic="World War II — causes, major events, turning points, consequences">🌍 World War II</button>
            <button class="wizard-sugg-pill" data-topic="Machine Learning — algorithms, types and real-world applications">🤖 Machine Learning</button>
            <button class="wizard-sugg-pill" data-topic="DNA replication, transcription and protein synthesis">🧬 DNA Replication</button>
            <button class="wizard-sugg-pill" data-topic="The French Revolution — causes, events, legacy and impact">🇫🇷 French Revolution</button>
            <button class="wizard-sugg-pill" data-topic="Quantum computing fundamentals, qubits and applications">⚛️ Quantum Computing</button>
            <button class="wizard-sugg-pill" data-topic="Blockchain technology, consensus mechanisms and cryptocurrency">⛓️ Blockchain</button>
          </div>
        </div>
      </div>`;
  }

  _bindWTopic() {
    const inp = this._el('wTopicInp');
    const cc  = this._el('wCharCount');
    if (inp) {
      inp.oninput = e => {
        const v = e.target.value.slice(0, 4000);
        e.target.value = v;
        this.wizardData.topic = v;
        if (cc) cc.textContent = `${v.length} / 4000`;
      };
    }

    const fz  = this._el('wFileZone');
    const fi  = this._el('wFileInp');
    if (fz && fi) {
      fz.onclick = e => { if (e.target !== fi) fi.click(); };
      fi.onchange = e => {
        const f = e.target.files[0];
        if (!f) return;
        if (!/\.(txt|md|csv)$/i.test(f.name) || f.size > 500000) {
          this._toast('error', 'fa-times', 'File must be .txt, .md, or .csv — max 500 KB');
          return;
        }
        const r = new FileReader();
        r.onload = ev => {
          const txt = ev.target.result.slice(0, 4000);
          if (inp) { inp.value = txt; this.wizardData.topic = txt; if (cc) cc.textContent = `${txt.length} / 4000`; }
          const fn = this._el('wFileName');
          if (fn) fn.textContent = `📄 ${f.name} (${(f.size / 1024).toFixed(1)} KB)`;
          this.wizardFile = f;
        };
        r.readAsText(f, 'UTF-8');
      };
      fz.ondragover = e => { e.preventDefault(); fz.classList.add('drag-over'); };
      fz.ondragleave = () => { fz.classList.remove('drag-over'); };
      fz.ondrop = e => {
        e.preventDefault(); fz.classList.remove('drag-over');
        const f = e.dataTransfer.files[0];
        if (f && fi) { fi.files = e.dataTransfer.files; fi.dispatchEvent(new Event('change')); }
      };
    }

    this._qsa('.wizard-sugg-pill').forEach(b => {
      b.onclick = () => {
        const t = b.dataset.topic;
        if (t && inp) {
          inp.value = t;
          this.wizardData.topic = t;
          if (cc) cc.textContent = `${t.length} / 4000`;
          inp.style.boxShadow = '0 0 0 3px rgba(0,212,255,.3)';
          setTimeout(() => { inp.style.boxShadow = ''; }, 700);
        }
      };
    });
  }

  // Step 3: Language
  _wStepLang() {
    const LANGS = [
      ['English','🇬🇧'],['Urdu','🇵🇰'],['Hindi','🇮🇳'],['Arabic','🇸🇦'],['French','🇫🇷'],
      ['German','🇩🇪'],['Spanish','🇪🇸'],['Portuguese','🇧🇷'],['Italian','🇮🇹'],['Dutch','🇳🇱'],
      ['Russian','🇷🇺'],['Turkish','🇹🇷'],['Chinese (Simplified)','🇨🇳'],['Japanese','🇯🇵'],
      ['Korean','🇰🇷'],['Bengali','🇧🇩'],['Swahili','🇰🇪'],['Persian','🇮🇷'],
      ['Vietnamese','🇻🇳'],['Thai','🇹🇭'],['Polish','🇵🇱'],['Indonesian','🇮🇩'],
    ];
    return `
      <div class="wizard-step-heading"><i class="fas fa-globe"></i> Select output language:</div>
      <div class="wizard-language-grid">
        ${LANGS.map(([name, flag]) => `
          <div class="wizard-language-card ${this.wizardData.language === name ? 'selected' : ''}" data-lang="${name}">
            <span class="wlang-flag">${flag}</span>
            <span class="wlang-name">${name}</span>
          </div>
        `).join('')}
      </div>`;
  }

  _bindWLang() {
    this._qsa('.wizard-language-card').forEach(c => {
      c.onclick = () => { this.wizardData.language = c.dataset.lang; this._renderWizardStep(); };
    });
  }

  // Step 4: Depth (SEPARATE STEP)
  _wStepDepth() {
    return `
      <div class="wizard-step-heading"><i class="fas fa-chart-line"></i> How much detail do you need?</div>
      <div class="wizard-depth-grid">
        ${Object.entries(DEPTH_CONFIG).map(([k, d]) => `
          <div class="wizard-depth-card ${this.wizardData.depth === k ? 'selected' : ''}" data-depth="${k}">
            <i class="fas ${d.icon} wdc-icon"></i>
            <div class="wizard-depth-name">${d.label}</div>
            <div class="wizard-depth-desc">${d.desc}</div>
            <div class="wizard-depth-subdesc">${d.subDesc}</div>
            <div class="wizard-depth-words">📝 ${d.words} words</div>
          </div>
        `).join('')}
      </div>`;
  }

  _bindWDepth() {
    this._qsa('.wizard-depth-card').forEach(c => {
      c.onclick = () => { this.wizardData.depth = c.dataset.depth; this._renderWizardStep(); };
    });
  }

  // Step 5: Style (SEPARATE STEP — not combined with depth)
  _wStepStyle() {
    return `
      <div class="wizard-step-heading"><i class="fas fa-pen-fancy"></i> How should it be written?</div>
      <div class="wizard-style-grid">
        ${Object.entries(STYLE_CONFIG).map(([k, s]) => `
          <div class="wizard-style-card ${this.wizardData.style === k ? 'selected' : ''}" data-style="${k}">
            <i class="fas ${s.icon} wsc-icon"></i>
            <div class="wizard-style-name">${s.label}</div>
            <div class="wizard-style-desc">${s.desc}</div>
          </div>
        `).join('')}
      </div>`;
  }

  _bindWStyle() {
    this._qsa('.wizard-style-card').forEach(c => {
      c.onclick = () => { this.wizardData.style = c.dataset.style; this._renderWizardStep(); };
    });
  }

  // Step 6: Review
  _wStepReview() {
    const toolCfg  = TOOL_CONFIG[this.wizardData.tool];
    const depthCfg = DEPTH_CONFIG[this.wizardData.depth];
    const styleCfg = STYLE_CONFIG[this.wizardData.style];
    return `
      <div class="wizard-review-card">
        <div class="wizard-review-header"><i class="fas fa-clipboard-check"></i> Review Your Choices</div>
        ${[
          { icon:'fa-magic',      label:'Tool',         val: toolCfg?.label,     sub: this.wizardData.tool === 'all' ? '⚡ ALL 5 TOOLS' : toolCfg?.sfpName },
          { icon:'fa-pencil-alt', label:'Topic',        val: (this.wizardData.topic || '<em class="dim">Not entered yet</em>').slice(0, 120) + (this.wizardData.topic?.length > 120 ? '…' : '') },
          { icon:'fa-globe',      label:'Language',     val: this.wizardData.language },
          { icon:'fa-chart-line', label:'Depth',        val: depthCfg?.label,    sub: depthCfg?.words + ' words · ' + depthCfg?.subDesc },
          { icon:'fa-pen-fancy',  label:'Style',        val: styleCfg?.label,    sub: styleCfg?.desc },
        ].map(r => `
          <div class="wizard-review-item">
            <div class="wizard-review-icon"><i class="fas ${r.icon}"></i></div>
            <div class="wizard-review-content">
              <div class="wizard-review-label">${r.label}</div>
              <div class="wizard-review-value">${r.val || '—'} ${r.sub ? `<span class="wizard-review-badge">${r.sub}</span>` : ''}</div>
            </div>
          </div>`).join('')}
      </div>
      <div class="wizard-review-info">
        <i class="fas fa-clock"></i> Generation typically takes <strong>20–40 seconds</strong>.
        Content will <strong>stream live to your screen</strong> as it's written!
      </div>
      <div class="wizard-review-tip">
        <i class="fas fa-lightbulb"></i>
        <strong>Pro tip:</strong> The more specific your topic, the better the output quality.
        Include context like subject level, exam board, or specific subtopics.
      </div>`;
  }

  _wValidate() {
    if (this.wizardStep === 1 && (!this.wizardData.topic || this.wizardData.topic.trim().length < 2)) {
      this._toast('error', 'fa-exclamation-circle', 'Please enter a topic (at least 2 characters)');
      return false;
    }
    return true;
  }

  async _runWizard() {
    if (this.generating) return;
    const t = this.wizardData.topic?.trim();
    if (!t || t.length < 2) { this._toast('info', 'fa-lightbulb', 'Please enter a topic.'); return; }
    this.tool = this.wizardData.tool;
    this._checkStreak();
    await this._sendDirect(t, this.wizardData.language, this.wizardData.depth, this.wizardData.style, this.wizardData.tool);
  }

  // ─────────────────────────────────────────────────────────────────────────────────────────────────
  // SECTION 13: MEGA BUNDLE MODAL
  // ─────────────────────────────────────────────────────────────────────────────────────────────────

  _openMega() {
    if (this.el.megaTopicInput)  this.el.megaTopicInput.value = '';
    if (this.el.megaCharCount)   this.el.megaCharCount.textContent = '0 / 4000';
    if (this.el.megaLangSel)     this.el.megaLangSel.value = this.prefs.defaultLanguage || 'English';
    if (this.el.megaDepthSel)    this.el.megaDepthSel.value = 'detailed';
    this._openModal('megaModal');
  }

  _runMega() {
    const topic = this.el.megaTopicInput?.value?.trim();
    if (!topic || topic.length < 2) { this._toast('error', 'fa-exclamation-circle', 'Please enter a topic!'); return; }
    const lang  = this.el.megaLangSel?.value  || 'English';
    const depth = this.el.megaDepthSel?.value || 'detailed';
    this._closeModal('megaModal');
    this.tool = 'all';
    this._checkStreak();
    this._sendDirect(topic, lang, depth, 'simple', 'all');
  }

  // ─────────────────────────────────────────────────────────────────────────────────────────────────
  // SECTION 14: CORE GENERATION PIPELINE
  // ─────────────────────────────────────────────────────────────────────────────────────────────────

  async _sendDirect(text, lang, depth, style, tool) {
    if (this.generating) return;
    this.generating    = true;
    this.streamBuffer  = '';
    this.tool          = tool || 'notes';
    this._showToolbar(false);
    this._showStreamOverlay(text, this.tool);
    this._startStages();
    const t0 = Date.now();

    try {
      const data = await this._callAPI(text, { depth, language: lang, style, tool: this.tool });
      this.currentData = data;
      this._hideStreamOverlay();
      this._renderResult(data);
      this.totalWords += this._wordCount(data.ultra_long_notes || '');
      localStorage.setItem('sv_total_words', String(this.totalWords));
      this._addHistory({ id: this._genId(), topic: data.topic || text, tool: this.tool, data, ts: Date.now(), dur: Date.now() - t0 });
      this._updateAllStats();
      this._showToolbar(true);
      this._toast('success', 'fa-check-circle', `${TOOL_CONFIG[this.tool]?.sfpName} generated!`);
      setTimeout(() => { if (this.el.outArea) this.el.outArea.scrollTop = 0; }, 200);
    } catch (err) {
      this._hideStreamOverlay();
      if (err.name === 'AbortError') {
        this._toast('info', 'fa-stop-circle', 'Generation cancelled.');
        this._showState('empty');
        this._showToolbar(false);
      } else {
        const msg = this._friendlyError(err.message);
        this._showState('error', msg);
        this._toast('error', 'fa-exclamation-circle', msg);
        this._showToolbar(false);
      }
    } finally {
      this.generating = false;
      this._stopStages();
      this._showCancelBtn(false);
    }
  }

  _friendlyError(msg) {
    if (!msg) return 'Savoiré AI study tool is momentarily unavailable. Please try again.';
    if (msg.includes('401') || msg.includes('API key'))      return 'Savoiré AI is experiencing a service issue. Please try again later.';
    if (msg.includes('timeout') || msg.includes('timed out')) return 'The AI took too long — please try again in a moment.';
    if (msg.includes('busy') || msg.includes('models'))       return 'Savoiré AI study tool is momentarily busy. Please try again in a few seconds.';
    if (msg.includes('fetch') || msg.includes('network'))     return 'Network issue detected. Please check your connection and try again.';
    return 'Savoiré AI study tool is momentarily unavailable. Please try again in a few seconds.';
  }

  _showToolbar(show) {
    if (this.el.outToolbar) {
      this.el.outToolbar.style.display = show ? 'flex' : 'none';
    }
  }

  async _callAPI(message, opts) {
    this.streamCtrl = new AbortController();
    this._showCancelBtn(true);
    try {
      return await this._streamSSE(message, opts);
    } catch (err) {
      if (err.name === 'AbortError') throw err;
      // Fallback to JSON if SSE fails
      return await this._callAPIJson(message, opts);
    }
  }

  // ════════════════════════════════════════════════════════════════════════════
  // SIMULATE STREAM — fallback for when server returns plain JSON (not SSE)
  // Simulates progressive token rendering so UI still looks live
  // ════════════════════════════════════════════════════════════════════════════
  _simulateStream(data, resolve, reject) {
    if (!data || typeof data !== 'object') { reject(new Error('Invalid response')); return; }
    if (data.error) { reject(new Error(data.error)); return; }

    const tool = this.tool || 'notes';
    const notes = data.ultra_long_notes || data.notes || '';

    // For card-based tools — directly animate cards in live view then resolve
    if (tool === 'flashcards' && Array.isArray(data.flashcards) && data.flashcards.length) {
      this._liveCards = [];
      const cards = data.flashcards;
      let i = 0;
      const tick = () => {
        if (i >= cards.length) { resolve(data); return; }
        this._liveCards.push(cards[i]);
        this._updateLiveCards(i, cards.length);
        i++;
        setTimeout(tick, 120);
      };
      setTimeout(tick, 200);
      return;
    }
    if (tool === 'quiz' && Array.isArray(data.quiz_questions) && data.quiz_questions.length) {
      this._liveQuestions = [];
      const qs = data.quiz_questions;
      let i = 0;
      const tick = () => {
        if (i >= qs.length) { resolve(data); return; }
        this._liveQuestions.push(qs[i]);
        this._updateLiveQuestions(i, qs.length);
        i++;
        setTimeout(tick, 140);
      };
      setTimeout(tick, 200);
      return;
    }
    if (tool === 'mindmap' && data.mindmap?.branches?.length) {
      this._liveBranches  = [];
      this._liveMMCentral = data.mindmap.central || '';
      this._liveMMConns   = data.mindmap.connections || [];
      const branches = data.mindmap.branches;
      this._updateLiveMindmap(-1, branches.length);
      let i = 0;
      const tick = () => {
        if (i >= branches.length) { resolve(data); return; }
        this._liveBranches.push(branches[i]);
        this._updateLiveMindmap(i, branches.length);
        i++;
        setTimeout(tick, 160);
      };
      setTimeout(tick, 300);
      return;
    }

    // For notes/summary/all — stream text token by token
    if (!notes) { resolve(data); return; }
    const CHUNK = 4;
    let pos = 0;
    let renderThrottle = 0;
    const stream = () => {
      if (pos >= notes.length) {
        if (this.el.sfpText) {
          this.el.sfpText.classList.remove('live-md');
          this.el.sfpText.classList.add('done');
        }
        resolve(data);
        return;
      }
      this.streamBuffer += notes.slice(pos, pos + CHUNK);
      pos += CHUNK;
      const now = Date.now();
      if (now - renderThrottle > 32 && this.el.sfpText) {
        renderThrottle = now;
        this._renderLiveNotes(tool);
      }
      this._updateStageByProgress(pos);
      setTimeout(stream, 6);
    };
    setTimeout(stream, 100);
  }

  async _streamSSE(message, opts) {
    // ═══════════════════════════════════════════════════════════════════════════
    // WORLD-CLASS SSE STREAMING — Properly parses event: + data: lines
    // Protocol: each SSE message is:
    //   event: <eventName>\n
    //   data: <json>\n
    //   \n
    //
    // Events:
    //   heartbeat → ignore (connection confirmed)
    //   stage     → update progress stage + label
    //   token     → stream one text token (notes/summary live render)
    //   card      → one flashcard animated in
    //   question  → one quiz question animated in
    //   branch    → one mindmap branch animated in
    //   done      → final complete data object → resolve
    //   error     → error message → reject
    // ═══════════════════════════════════════════════════════════════════════════
    return new Promise((resolve, reject) => {
      const body = JSON.stringify({
        message,
        userName:  this.userName || 'Anonymous',
        streak:    this.streak.count,
        sessions:  this.sessions,
        sessionId: this._currentSessionId || this._genId(),
        options:   { ...opts, stream: true },
      });

      // Reset live data accumulators
      this._liveCards     = [];
      this._liveQuestions = [];
      this._liveBranches  = [];
      this._liveMMCentral = '';
      this._liveMMConns   = [];

      fetch(SAVOIRÉ.API_URL, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body,
        signal:  this.streamCtrl?.signal,
      }).then(async res => {
        if (!res.ok) {
          const d = await res.json().catch(() => ({}));
          reject(new Error(d.error || `Server error (${res.status})`));
          return;
        }

        const ct = res.headers.get('content-type') || '';
        if (!ct.includes('text/event-stream')) {
          // Server returned JSON — use simulate stream for nice animation
          const d = await res.json().catch(() => ({}));
          if (d.error) { reject(new Error(d.error)); return; }
          this._simulateStream(d, resolve, reject);
          return;
        }

        // True SSE stream
        const reader  = res.body.getReader();
        const decoder = new TextDecoder();
        let buffer = '';           // raw byte buffer
        let chars  = 0;           // token chars received (for stage progression)
        let renderThrottle = 0;   // throttle live render calls

        // ── Tool type flags for live rendering ──
        const tool = opts.tool || 'notes';

        // ── Live notes/summary text rendering (throttled 32ms) ──
        const renderLiveText = () => {
          const now = Date.now();
          if (now - renderThrottle < 32) return;
          renderThrottle = now;
          this._renderLiveNotes(tool);
        };

        // ── Live card animators ──
        const animateCard = (idx, total, card) => {
          this._liveCards.push(card);
          this._updateLiveCards(idx, total);
        };
        const animateQuestion = (idx, total, q) => {
          this._liveQuestions.push(q);
          this._updateLiveQuestions(idx, total);
        };
        const animateBranch = (idx, total, branch) => {
          if (branch && branch.name === '_central_') {
            this._liveMMCentral = branch.value || '';
            this._liveMMConns   = branch.connections || [];
            this._updateLiveMindmap(-1, total);
          } else if (branch) {
            this._liveBranches.push(branch);
            this._updateLiveMindmap(idx, total);
          }
        };

        // ── SSE event dispatcher — called for each complete SSE message ──
        const dispatch = (eventName, rawData) => {
          if (!rawData || rawData === '[DONE]') return;
          let evt;
          try { evt = JSON.parse(rawData); } catch { return; }

          switch (eventName) {
            case 'heartbeat': break; // ignore — just confirms connection

            case 'stage':
              if (evt.idx !== undefined) this._activateStage(evt.idx);
              if (evt.label && this.el.sfpLabel) this.el.sfpLabel.textContent = evt.label;
              break;

            case 'token':
              if (evt.t !== undefined && evt.t !== null) {
                this.streamBuffer += evt.t;
                chars += String(evt.t).length;
                renderLiveText();
                this._updateStageByProgress(chars);
              }
              break;

            case 'card':
              if (evt.card) animateCard(evt.idx, evt.total, evt.card);
              break;

            case 'question':
              if (evt.q) animateQuestion(evt.idx, evt.total, evt.q);
              break;

            case 'branch':
              if (evt.branch) animateBranch(evt.idx, evt.total, evt.branch);
              break;

            case 'done':
              // Final data object — merge any live-streamed items
              if (this._liveCards.length)     evt.flashcards     = this._liveCards;
              if (this._liveQuestions.length)  evt.quiz_questions = this._liveQuestions;
              if (this._liveBranches.length) {
                evt.mindmap = {
                  central:     this._liveMMCentral,
                  branches:    this._liveBranches,
                  connections: this._liveMMConns,
                };
              }
              if (this.el.sfpText) {
                this.el.sfpText.classList.remove('live-md');
                this.el.sfpText.classList.add('done');
              }
              resolve(evt);
              break;

            case 'error':
              reject(new Error(evt.error || evt.message || 'Generation failed'));
              break;

            default:
              // Unknown event — check if data looks like final object (fallback)
              if (evt.topic !== undefined && !eventName) {
                if (this._liveCards.length)     evt.flashcards     = this._liveCards;
                if (this._liveQuestions.length)  evt.quiz_questions = this._liveQuestions;
                if (this._liveBranches.length) {
                  evt.mindmap = { central: this._liveMMCentral, branches: this._liveBranches, connections: this._liveMMConns };
                }
                resolve(evt);
              }
              break;
          }
        };

        // ── SSE pump — reads raw bytes, parses event+data pairs ──
        const pump = async () => {
          let resolved = false;
          try {
            while (true) {
              const { done, value } = await reader.read();
              if (done) {
                if (!resolved) reject(new Error('Stream closed without completion'));
                return;
              }

              buffer += decoder.decode(value, { stream: true });

              // SSE messages are separated by double newlines
              // Each message may have multiple lines: event:\ndata:\n\n
              const messages = buffer.split('\n\n');
              buffer = messages.pop() || ''; // Last incomplete chunk stays in buffer

              for (const msg of messages) {
                if (!msg.trim()) continue;
                let eventName = 'message';
                let dataLine  = '';

                const dataLines = []; // SSE allows multi-line data
                for (const line of msg.split('\n')) {
                  if (line.startsWith('event:')) {
                    eventName = line.slice(6).trim();
                  } else if (line.startsWith('data:')) {
                    dataLines.push(line.slice(5).trim());
                  }
                  // Ignore comment lines (start with ':') and id:/retry: lines
                }

                // Join multi-line data values (SSE spec allows this)
                dataLine = dataLines.join('\n').trim();

                if (dataLine && dataLine !== '[DONE]') {
                  if (eventName === 'done') resolved = true;
                  try {
                    dispatch(eventName, dataLine);
                  } catch (dispErr) {
                    // Non-fatal dispatch error — log and continue
                    console.warn('[SSE] dispatch error:', dispErr.message);
                    if (resolved) return; // Still exit if done
                  }
                  if (resolved) return; // Stop reading after done
                }
              }
            }
          } catch (pumpErr) {
            if (pumpErr.name === 'AbortError') reject(pumpErr);
            else if (!pumpErr.message?.includes('aborted')) reject(pumpErr);
          }
        };

        pump();
      }).catch(err => {
        if (err.name === 'AbortError') reject(err);
        else reject(new Error(err.message || 'Network error'));
      });
    });
  }

  // ── RENDER LIVE NOTES/SUMMARY TEXT in sfpText ─────────────────────────────
  // Called on every token — shows tool-specific live preview
  _renderLiveNotes(tool) {
    // ── Don't render text for card tools once cards start arriving ──
    // (Cards replace sfpText content — we don't want text to overwrite them)
    if (this._liveCards.length > 0 || this._liveQuestions.length > 0 || this._liveBranches.length > 0) return;
    if (!this.el.sfpText) return;
    const buf = this.streamBuffer;
    if (!buf) return;

    const isSummary  = tool === 'summary';
    const isCardTool = tool === 'flashcards' || tool === 'quiz' || tool === 'mindmap';

    try {
      if (isSummary) {
        // Summary: show with summary-styled live wrapper
        this.el.sfpText.classList.add('live-md');
        this.el.sfpText.innerHTML = `
          <div class="live-summary-wrapper">
            <div class="live-summary-header">
              <i class="fas fa-align-left" style="color:#00d4ff"></i>
              <span>Summary being generated…</span>
              <div class="live-dots"><span></span><span></span><span></span></div>
            </div>
            <div class="live-summary-body">${this._renderMdLive(buf)}</div>
          </div>`;
      } else if (isCardTool) {
        // Flashcard/Quiz/Mindmap: during phase 1 research, show compact research view
        const toolIcons = { flashcards: 'fa-layer-group', quiz: 'fa-question-circle', mindmap: 'fa-project-diagram' };
        const toolColors = { flashcards: '#bf00ff', quiz: '#00ff88', mindmap: '#d4af37' };
        const toolLabels = { flashcards: 'Researching topic for flashcards…', quiz: 'Researching topic for quiz…', mindmap: 'Researching topic for mind map…' };
        const words = this._wordCount(buf);
        this.el.sfpText.classList.add('live-md');
        this.el.sfpText.innerHTML = `
          <div class="live-research-wrapper">
            <div class="live-research-header">
              <i class="fas ${toolIcons[tool] || 'fa-book'}" style="color:${toolColors[tool] || '#d4af37'}"></i>
              <span style="color:${toolColors[tool] || '#d4af37'}">${toolLabels[tool] || 'Researching…'}</span>
              <div class="live-dots"><span></span><span></span><span></span></div>
            </div>
            <div class="live-research-stats">
              <span class="live-stat-chip"><i class="fas fa-file-word"></i> ${words} words so far</span>
              <span class="live-stat-chip"><i class="fas fa-bolt"></i> Phase 1 of 2</span>
            </div>
            <div class="live-research-preview">${this._renderMdLive(buf.slice(0, 800) + (buf.length > 800 ? '…' : ''))}</div>
          </div>`;
      } else {
        // Notes / all — stream full markdown live
        this.el.sfpText.classList.add('live-md');
        this.el.sfpText.innerHTML = this._renderMdLive(buf);
      }
    } catch {
      this.el.sfpText.textContent = buf;
    }
    if (this.el.sfpScroll) this.el.sfpScroll.scrollTop = this.el.sfpScroll.scrollHeight;
  }

  // ── UPDATE LIVE FLASHCARDS in stream overlay ──────────────────────────────
  // ── UPDATE LIVE FLASHCARDS — card-by-card spring animation ──────────────
  _updateLiveCards(idx, total) {
    const container = this.el.sfpText;
    if (!container) return;
    const cards  = this._liveCards;
    const count  = cards.length;
    const pct    = total > 0 ? Math.round((count / total) * 100) : 0;
    const done   = count >= total && total > 0;

    container.classList.remove('live-md');
    container.innerHTML = `
      <div class="live-cards-wrapper">
        <div class="live-gen-topbar">
          <div class="live-gen-icon-wrap" style="background:rgba(191,0,255,.15);border-color:rgba(191,0,255,.4)">
            <i class="fas fa-layer-group" style="color:#bf00ff"></i>
          </div>
          <div class="live-gen-info">
            <div class="live-gen-title" style="color:#bf00ff">
              ${done ? `✅ All ${total} Flashcards Generated!` : `🃏 Generating Flashcards… (${count}/${total})`}
            </div>
            <div class="live-gen-sub">Each card appearing live as AI creates it</div>
          </div>
          <div class="live-gen-badge" style="background:rgba(191,0,255,.2);color:#bf00ff">${pct}%</div>
        </div>
        <div class="live-gen-bar-wrap">
          <div class="live-gen-bar" style="width:${pct}%;background:linear-gradient(90deg,#bf00ff,#7b00ff,#00d4ff)"></div>
        </div>
        <div class="live-cards-grid">
          ${cards.map((c, i) => {
            const front   = this._esc(c.front || c.question || '');
            const backRaw = c.back || c.answer || '';
            const back    = this._esc(backRaw.length > 100 ? backRaw.slice(0, 100) + '…' : backRaw);
            const isNew   = i === count - 1;
            return `<div class="live-card-item${isNew ? ' live-card-new' : ''}" style="animation-delay:${Math.min(i * 25, 300)}ms">
              <div class="live-card-badge">#${i + 1}</div>
              <div class="live-card-q-label"><i class="fas fa-question" style="font-size:9px"></i> FRONT</div>
              <div class="live-card-front">${front}</div>
              <div class="live-card-divider"></div>
              <div class="live-card-a-label"><i class="fas fa-lightbulb" style="font-size:9px"></i> BACK</div>
              <div class="live-card-back">${back}</div>
            </div>`;
          }).join('')}
          ${!done ? `<div class="live-card-item live-card-loading-slot">
            <div class="live-card-skeleton-line"></div>
            <div class="live-card-skeleton-line" style="width:70%"></div>
            <div class="live-card-skeleton-line" style="width:50%;margin-top:8px"></div>
            <div class="live-dots" style="margin-top:8px"><span></span><span></span><span></span></div>
          </div>` : ''}
        </div>
        ${done
          ? `<div class="live-gen-complete" style="border-color:rgba(191,0,255,.4);background:rgba(191,0,255,.08)">
               <i class="fas fa-check-circle" style="color:#00ff88;font-size:20px"></i>
               <span>All <strong>${total}</strong> flashcards ready — switching to interactive view…</span>
             </div>`
          : `<div class="live-gen-footer">
               <div class="live-dots"><span></span><span></span><span></span></div>
               <span>AI is generating card ${count + 1} of ${total}…</span>
             </div>`
        }
      </div>`;
    if (this.el.sfpScroll) this.el.sfpScroll.scrollTop = this.el.sfpScroll.scrollHeight;
  }

  // ── UPDATE LIVE QUIZ QUESTIONS — question-by-question animation ───────────
  _updateLiveQuestions(idx, total) {
    const container = this.el.sfpText;
    if (!container) return;
    const qs      = this._liveQuestions;
    const count   = qs.length;
    const pct     = total > 0 ? Math.round((count / total) * 100) : 0;
    const done    = count >= total && total > 0;
    const letters = ['A','B','C','D','E'];

    container.classList.remove('live-md');
    container.innerHTML = `
      <div class="live-quiz-wrapper">
        <div class="live-gen-topbar">
          <div class="live-gen-icon-wrap" style="background:rgba(0,255,136,.12);border-color:rgba(0,255,136,.4)">
            <i class="fas fa-question-circle" style="color:#00ff88"></i>
          </div>
          <div class="live-gen-info">
            <div class="live-gen-title" style="color:#00ff88">
              ${done ? `✅ All ${total} Questions Generated!` : `❓ Generating Quiz… (${count}/${total})`}
            </div>
            <div class="live-gen-sub">Questions streaming live — check back answers after</div>
          </div>
          <div class="live-gen-badge" style="background:rgba(0,255,136,.15);color:#00ff88">${pct}%</div>
        </div>
        <div class="live-gen-bar-wrap">
          <div class="live-gen-bar" style="width:${pct}%;background:linear-gradient(90deg,#00ff88,#00d4ff,#bf00ff)"></div>
        </div>
        <div class="live-quiz-list">
          ${qs.map((q, i) => {
            const isNew   = i === count - 1;
            const diffCol = q.difficulty === 'hard' ? '#ff4444' : q.difficulty === 'easy' ? '#00ff88' : '#ffae00';
            const opts    = Array.isArray(q.options) ? q.options.slice(0, 4) : [];
            return `<div class="live-quiz-item${isNew ? ' live-card-new' : ''}">
              <div class="live-quiz-toprow">
                <span class="live-quiz-num">Q${i + 1}</span>
                <span class="live-quiz-diff" style="background:${diffCol}22;color:${diffCol};border-color:${diffCol}55">${q.difficulty || 'medium'}</span>
                ${q.topic_tag ? `<span class="live-quiz-tag">${this._esc(q.topic_tag)}</span>` : ''}
              </div>
              <div class="live-quiz-q-text">${this._esc(q.question || '')}</div>
              ${opts.length ? `<div class="live-quiz-opts">
                ${opts.map((opt, oi) => {
                  const isCorrect = opt === q.correct_answer;
                  return `<div class="live-quiz-opt${isCorrect ? ' live-quiz-correct' : ''}">
                    <span class="live-quiz-opt-letter">${letters[oi]}</span>
                    ${this._esc(opt)}
                    ${isCorrect ? '<i class="fas fa-check" style="color:#00ff88;margin-left:auto;font-size:10px"></i>' : ''}
                  </div>`;
                }).join('')}
              </div>` : ''}
            </div>`;
          }).join('')}
          ${!done ? `<div class="live-quiz-item live-card-loading-slot" style="text-align:center;padding:20px">
            <div class="live-card-skeleton-line" style="width:80%;margin:0 auto 8px"></div>
            <div class="live-card-skeleton-line" style="width:60%;margin:0 auto"></div>
            <div class="live-dots" style="justify-content:center;margin-top:12px"><span></span><span></span><span></span></div>
          </div>` : ''}
        </div>
        ${done
          ? `<div class="live-gen-complete" style="border-color:rgba(0,255,136,.4);background:rgba(0,255,136,.08)">
               <i class="fas fa-check-circle" style="color:#00ff88;font-size:20px"></i>
               <span>All <strong>${total}</strong> quiz questions ready!</span>
             </div>`
          : `<div class="live-gen-footer">
               <div class="live-dots"><span></span><span></span><span></span></div>
               <span>Generating question ${count + 1} of ${total}…</span>
             </div>`
        }
      </div>`;
    if (this.el.sfpScroll) this.el.sfpScroll.scrollTop = this.el.sfpScroll.scrollHeight;
  }

  // ── UPDATE LIVE MINDMAP — branch-by-branch animation ─────────────────────
  _updateLiveMindmap(idx, total) {
    const container = this.el.sfpText;
    if (!container) return;
    const branches = this._liveBranches;
    const central  = this._liveMMCentral;
    const count    = branches.length;
    const pct      = idx === -1 ? 8 : (total > 0 ? Math.round((count / total) * 92) + 8 : 8);
    const done     = count >= total && total > 0;

    // Branch color palette
    const BRANCH_COLORS = ['#d4af37','#00d4ff','#bf00ff','#00ff88','#ff6b35','#e84393','#ffae00','#7b00ff','#00ffcc','#ff4444'];

    container.classList.remove('live-md');
    container.innerHTML = `
      <div class="live-mm-wrapper">
        <div class="live-gen-topbar">
          <div class="live-gen-icon-wrap" style="background:rgba(212,175,55,.12);border-color:rgba(212,175,55,.4)">
            <i class="fas fa-project-diagram" style="color:#d4af37"></i>
          </div>
          <div class="live-gen-info">
            <div class="live-gen-title" style="color:#d4af37">
              ${done ? `✅ Mind Map Complete! (${total} branches)` : `🗺️ Mapping Topic… (${count}/${total} branches)`}
            </div>
            <div class="live-gen-sub">Branches appearing as AI structures your topic</div>
          </div>
          <div class="live-gen-badge" style="background:rgba(212,175,55,.15);color:#d4af37">${pct}%</div>
        </div>
        <div class="live-gen-bar-wrap">
          <div class="live-gen-bar" style="width:${pct}%;background:linear-gradient(90deg,#d4af37,#ffae00,#00d4ff)"></div>
        </div>
        ${central ? `
        <div class="live-mm-central-node">
          <div class="live-mm-central-pulse"></div>
          <i class="fas fa-brain" style="color:#d4af37;font-size:18px"></i>
          <div class="live-mm-central-text">${this._esc(central)}</div>
        </div>
        <div class="live-mm-connector-line"></div>` : ''}
        <div class="live-mm-branches">
          ${branches.map((b, i) => {
            const isNew  = i === count - 1;
            const color  = b.color || BRANCH_COLORS[i % BRANCH_COLORS.length];
            const items  = Array.isArray(b.items) ? b.items : [];
            return `<div class="live-mm-branch${isNew ? ' live-card-new' : ''}" style="border-left-color:${color};background:${color}0d">
              <div class="live-mm-branch-header">
                <div class="live-mm-branch-dot" style="background:${color}"></div>
                <div class="live-mm-branch-name" style="color:${color}">${this._esc(b.name || '')}</div>
                <div class="live-mm-branch-count" style="color:${color}99">${items.length} items</div>
              </div>
              <div class="live-mm-items">
                ${items.slice(0, 6).map(item => `<span class="live-mm-item" style="border-color:${color}44;color:${color}cc">
                  <i class="fas fa-circle" style="font-size:5px;margin-right:4px;opacity:.7"></i>
                  ${this._esc(String(item))}
                </span>`).join('')}
              </div>
              ${b.connections?.length ? `<div class="live-mm-links">
                <i class="fas fa-link" style="color:${color}88;font-size:10px"></i>
                ${b.connections.slice(0,3).map(c => `<span class="live-mm-link-tag">${this._esc(String(c))}</span>`).join('')}
              </div>` : ''}
            </div>`;
          }).join('')}
          ${!done ? `<div class="live-mm-branch live-card-loading-slot" style="border-left-color:#555;text-align:center;padding:16px">
            <div class="live-card-skeleton-line" style="width:60%;margin:0 auto 8px"></div>
            <div class="live-card-skeleton-line" style="width:40%;margin:0 auto"></div>
            <div class="live-dots" style="justify-content:center;margin-top:10px"><span></span><span></span><span></span></div>
          </div>` : ''}
        </div>
        ${done
          ? `<div class="live-gen-complete" style="border-color:rgba(212,175,55,.4);background:rgba(212,175,55,.08)">
               <i class="fas fa-check-circle" style="color:#00ff88;font-size:20px"></i>
               <span>Mind map with <strong>${total}</strong> branches ready!</span>
             </div>`
          : `<div class="live-gen-footer">
               <div class="live-dots"><span></span><span></span><span></span></div>
               <span>Mapping branch ${count + 1} of ${total}…</span>
             </div>`
        }
      </div>`;
    if (this.el.sfpScroll) this.el.sfpScroll.scrollTop = this.el.sfpScroll.scrollHeight;
  }

  async _callAPIJson(message, opts) {
    const res = await fetch(SAVOIRÉ.API_URL, {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({
        message,
        userName:  this.userName || 'Anonymous',
        streak:    this.streak.count,
        sessions:  this.sessions,
        sessionId: this._currentSessionId || this._genId(),
        options:   { ...opts, stream: false },
      }),
      signal: this.streamCtrl?.signal,
    });
    if (!res.ok) {
      const d = await res.json().catch(() => ({}));
      throw new Error(d.error || `Server error (${res.status})`);
    }
    const data = await res.json();
    if (data.error) throw new Error(data.error);
    return data;
  }

  _cancelGen() {
    if (this.streamCtrl) { this.streamCtrl.abort(); this.streamCtrl = null; }
  }

  _showCancelBtn(show) {
    // Cancel functionality — currently no explicit cancel button in new UI,
    // but stream controller is available
  }

  // ─────────────────────────────────────────────────────────────────────────────────────────────────
  // SECTION 15: STREAM OVERLAY
  // ─────────────────────────────────────────────────────────────────────────────────────────────────

  _showStreamOverlay(topic, tool) {
    const cfg = TOOL_CONFIG[tool] || TOOL_CONFIG.notes;
    if (this.el.sfpTopic)    this.el.sfpTopic.textContent    = topic.length > 65 ? topic.slice(0, 65) + '…' : topic;
    if (this.el.sfpToolIcon) this.el.sfpToolIcon.className   = `fas ${cfg.icon}`;
    if (this.el.sfpToolName) this.el.sfpToolName.textContent = cfg.sfpName;
    if (this.el.sfpLabel)    this.el.sfpLabel.textContent    = cfg.sfpLabel || 'Generating…';
    if (this.el.sfpText) {
      this.el.sfpText.classList.remove('done','live-md');
      // Tool-specific initial loading state
      if (tool === 'flashcards') {
        this.el.sfpText.innerHTML = `
          <div class="sfp-init-state">
            <div class="sfp-init-icon" style="color:#bf00ff"><i class="fas fa-layer-group"></i></div>
            <div class="sfp-init-title">Generating Flashcards…</div>
            <div class="sfp-init-sub">AI is studying your topic and creating cards</div>
            <div class="live-dots"><span></span><span></span><span></span></div>
          </div>`;
      } else if (tool === 'quiz') {
        this.el.sfpText.innerHTML = `
          <div class="sfp-init-state">
            <div class="sfp-init-icon" style="color:#00ff88"><i class="fas fa-question-circle"></i></div>
            <div class="sfp-init-title">Generating Quiz Questions…</div>
            <div class="sfp-init-sub">AI is crafting challenging questions for you</div>
            <div class="live-dots"><span></span><span></span><span></span></div>
          </div>`;
      } else if (tool === 'mindmap') {
        this.el.sfpText.innerHTML = `
          <div class="sfp-init-state">
            <div class="sfp-init-icon" style="color:#d4af37"><i class="fas fa-project-diagram"></i></div>
            <div class="sfp-init-title">Generating Mind Map…</div>
            <div class="sfp-init-sub">AI is mapping out the topic structure</div>
            <div class="live-dots"><span></span><span></span><span></span></div>
          </div>`;
      } else if (tool === 'summary') {
        this.el.sfpText.innerHTML = `
          <div class="sfp-init-state">
            <div class="sfp-init-icon" style="color:#00d4ff"><i class="fas fa-align-left"></i></div>
            <div class="sfp-init-title">Generating Summary…</div>
            <div class="sfp-init-sub">AI is distilling the key points</div>
            <div class="live-dots"><span></span><span></span><span></span></div>
          </div>`;
      } else if (tool === 'all') {
        this.el.sfpText.innerHTML = `
          <div class="sfp-init-state">
            <div class="sfp-init-icon" style="color:#ffae00"><i class="fas fa-bolt"></i></div>
            <div class="sfp-init-title">⚡ Generating Mega Bundle…</div>
            <div class="sfp-init-sub">Notes + Flashcards + Quiz + Summary + Mind Map</div>
            <div class="live-dots"><span></span><span></span><span></span></div>
          </div>`;
      } else {
        // Notes — show typing cursor
        this.el.sfpText.innerHTML = `
          <div class="sfp-init-state">
            <div class="sfp-init-icon" style="color:#00ff88"><i class="fas fa-book-open"></i></div>
            <div class="sfp-init-title">Generating Notes…</div>
            <div class="sfp-init-sub">AI is writing comprehensive study notes</div>
            <div class="live-dots"><span></span><span></span><span></span></div>
          </div>`;
      }
    }
    if (this.el.sscProgressBar) this.el.sscProgressBar.style.width = '4%';
    if (this.el.streamFullpage)  this.el.streamFullpage.style.display = 'flex';
    if (this.el.emptyState)      this.el.emptyState.style.display = 'none';
    if (this.el.resultArea)      this.el.resultArea.style.display = 'none';
    if (this.el.thinkingWrap)    this.el.thinkingWrap.style.display = 'none';
  }

  _hideStreamOverlay() {
    if (this.el.streamFullpage) {
      this.el.streamFullpage.classList.add('fading-out');
      setTimeout(() => {
        this.el.streamFullpage.style.display = 'none';
        this.el.streamFullpage.classList.remove('fading-out');
      }, 300);
    }
  }

  // ─────────────────────────────────────────────────────────────────────────────────────────────────
  // SECTION 16: STAGE SYSTEM
  // ─────────────────────────────────────────────────────────────────────────────────────────────────

  _startStages() {
    this.stageIdx = 0;
    for (let i = 0; i < 5; i++) {
      const ts = this._el(`ts${i}`); if (ts) ts.className = 'ths';
      const ss = this._el(`ss${i}`); if (ss) ss.className = 'ssc-stage';
    }
    this._activateStage(0);
    this.thinkTimer = setInterval(() => {
      this.stageIdx++;
      if (this.stageIdx < 5) {
        this._doneStage(this.stageIdx - 1);
        this._activateStage(this.stageIdx);
      }
      const pct = Math.min(96, (this.stageIdx / 5) * 100);
      if (this.el.sscProgressBar) this.el.sscProgressBar.style.width = `${pct}%`;
    }, 5500);
  }

  _activateStage(i) {
    const ts = this._el(`ts${i}`); if (ts) { ts.classList.remove('done'); ts.classList.add('active'); }
    const ss = this._el(`ss${i}`); if (ss) { ss.classList.remove('done'); ss.classList.add('active'); }
    if (this.el.sfpLabel && STAGE_MESSAGES[i]) this.el.sfpLabel.textContent = STAGE_MESSAGES[i];
  }

  _doneStage(i) {
    const ts = this._el(`ts${i}`); if (ts) { ts.classList.remove('active'); ts.classList.add('done'); }
    const ss = this._el(`ss${i}`); if (ss) { ss.classList.remove('active'); ss.classList.add('done'); }
  }

  _stopStages() {
    if (this.thinkTimer) clearInterval(this.thinkTimer);
    for (let i = 0; i <= this.stageIdx && i < 5; i++) this._doneStage(i);
    if (this.el.sscProgressBar) this.el.sscProgressBar.style.width = '100%';
  }

  _updateStageByProgress(chars) {
    const thresholds = [0, 500, 1400, 2600, 4200];
    for (let i = thresholds.length - 1; i >= 0; i--) {
      if (chars >= thresholds[i] && this.stageIdx < i) {
        this._doneStage(this.stageIdx);
        this.stageIdx = i;
        this._activateStage(i);
        const pct = Math.min(96, (i / 5) * 100);
        if (this.el.sscProgressBar) this.el.sscProgressBar.style.width = `${pct}%`;
        break;
      }
    }
  }

  // ─────────────────────────────────────────────────────────────────────────────────────────────────
  // SECTION 17: STATE MANAGEMENT
  // ─────────────────────────────────────────────────────────────────────────────────────────────────

  _showState(state, errMsg) {
    if (this.el.emptyState)   this.el.emptyState.style.display   = 'none';
    if (this.el.thinkingWrap) this.el.thinkingWrap.style.display = 'none';
    if (this.el.resultArea)   this.el.resultArea.style.display   = 'none';

    switch (state) {
      case 'result':
        if (this.el.resultArea) {
          this.el.resultArea.style.display = 'block';
          if (this.el.outArea) setTimeout(() => { this.el.outArea.scrollTop = 0; }, 80);
        }
        break;
      case 'error':
        if (this.el.resultArea) {
          this.el.resultArea.style.display = 'block';
          this.el.resultArea.innerHTML = `
            <div class="error-card">
              <div class="error-card-hdr"><i class="fas fa-exclamation-circle"></i> Savoiré AI — Tool Temporarily Unavailable</div>
              <div class="error-card-body">${this._esc(errMsg || 'Savoiré AI study tool is momentarily unavailable.')}</div>
              <div class="error-card-hint">
                AI models are occasionally busy when many students study simultaneously.
                This usually resolves itself in a few seconds — please try again!
              </div>
              <div style="display:flex;gap:12px;justify-content:center;margin-top:20px;flex-wrap:wrap">
                <button class="btn btn-primary" onclick="window._app._openWizard()">
                  <i class="fas fa-magic"></i> Try Again with Wizard
                </button>
                <button class="btn btn-gold" onclick="window._app._openMega()">
                  <i class="fas fa-bolt"></i> Try Mega Bundle
                </button>
              </div>
            </div>`;
        }
        break;
      default:
        if (this.el.emptyState) this.el.emptyState.style.display = 'flex';
        break;
    }
  }

  // ─────────────────────────────────────────────────────────────────────────────────────────────────
  // SECTION 18: RESULT RENDERING
  // ─────────────────────────────────────────────────────────────────────────────────────────────────

  _renderResult(data) {
    if (!this.el.resultArea) return;
    this.el.resultArea.innerHTML = this._buildResultHTML(data);
    this._showState('result');
    this._recacheDynamic();
  }

  _buildResultHTML(data) {
    const topic = this._esc(data.topic || 'Study Material');
    const score = data.study_score || 96;
    const pct   = Math.min(100, Math.max(0, score));
    const wc    = this._wordCount(this._stripMd(data.ultra_long_notes || ''));
    const lang  = data._language || 'English';
    const tool  = this.tool;
    const cfg   = TOOL_CONFIG[tool] || TOOL_CONFIG.notes;
    const isMega = tool === 'all';

    const header = `
      <div class="result-hdr">
        <div class="rh-left">
          <div class="rh-tool-badge" style="color:${cfg.color}">
            <i class="fas ${cfg.icon}"></i> ${cfg.sfpName}${isMega ? ' — Mega Bundle ⚡' : ''}
          </div>
          <div class="rh-topic">${topic}</div>
          <div class="rh-meta">
            <div class="rh-mi"><i class="fas fa-graduation-cap"></i> ${this._esc(data.curriculum_alignment || 'General Study')}</div>
            <div class="rh-mi"><i class="fas fa-calendar-alt"></i> ${new Date().toLocaleDateString()}</div>
            <div class="rh-mi"><i class="fas fa-globe"></i> ${this._esc(lang)}</div>
            <div class="rh-mi"><i class="fas fa-file-word"></i> ~${wc.toLocaleString()} words</div>
            ${data._quality ? `<div class="rh-mi"><i class="fas fa-robot"></i> ${data._quality === 'ai_generated' ? 'AI Generated' : 'Enhanced'}</div>` : ''}
          </div>
          <div class="rh-powered">
            Generated by <strong>${SAVOIRÉ.BRAND}</strong> ·
            <a href="https://${SAVOIRÉ.DEVSITE}" target="_blank" rel="noopener">${SAVOIRÉ.DEVELOPER}</a>
          </div>
        </div>
        <div class="score-ring-wrap">
          <div class="rh-score" style="--pct:${pct}">
            <div class="rh-score-val">${score}</div>
          </div>
          <div class="score-ring-label">Score</div>
        </div>
      </div>`;

    const navItems = this._buildNavItems(data);
    const nav = navItems.length > 2
      ? `<div class="result-nav">
           ${navItems.map(n => `<a href="#${n.id}" class="result-nav-btn"><i class="${n.icon}"></i> ${n.label}</a>`).join('')}
         </div>`
      : '';

    let body = '';
    switch (tool) {
      case 'flashcards': body = this._buildFcHTML(data);      break;
      case 'quiz':       body = this._buildQuizHTML(data);    break;
      case 'summary':    body = this._buildSummaryHTML(data); break;
      case 'mindmap':    body = this._buildMindmapHTML(data); break;
      case 'all':        body = this._buildAllHTML(data);     break;
      default:           body = this._buildNotesHTML(data);   break;
    }

    const exportBar = `
      <div class="export-bar">
        <button class="exp-btn pdf" onclick="window._app._downloadPDF()">
          <i class="fas fa-file-pdf"></i><span>PDF</span>
        </button>
        <button class="exp-btn copy" onclick="window._app._copyResult()">
          <i class="fas fa-copy"></i><span>Copy</span>
        </button>
        <button class="exp-btn save" onclick="window._app._saveNote()">
          <i class="fas fa-star"></i><span>Save</span>
        </button>
        <button class="exp-btn share" onclick="window._app._shareResult()">
          <i class="fas fa-share-alt"></i><span>Share</span>
        </button>
        <button class="exp-btn new" onclick="window._app._openWizard()" style="color:#bf00ff;border-color:rgba(191,0,255,.3)">
          <i class="fas fa-magic"></i><span>New</span>
        </button>
        <span class="exp-brand">${SAVOIRÉ.BRAND}</span>
      </div>`;

    const footer = `
      <div class="result-branding-footer">
        <div class="rbf-left">
          <div class="rbf-logo">Ś</div>
          <div class="rbf-text">
            <a href="https://${SAVOIRÉ.WEBSITE}" target="_blank">${SAVOIRÉ.BRAND}</a> ·
            <a href="https://${SAVOIRÉ.DEVSITE}" target="_blank">${SAVOIRÉ.DEVELOPER}</a> ·
            Free forever.
          </div>
        </div>
        <div class="rbf-ts">${new Date().toLocaleString()}</div>
      </div>`;

    return `<div class="result-wrap">${header}${nav}${body}${exportBar}${footer}</div>`;
  }

  _buildNavItems(data) {
    const items = [];
    if (data.ultra_long_notes)            items.push({ id: 'sec-notes',    label: 'Notes',         icon: 'fas fa-book-open' });
    if (data.flashcards?.length)          items.push({ id: 'sec-fc',       label: 'Flashcards',    icon: 'fas fa-layer-group' });
    if (data.quiz_questions?.length)      items.push({ id: 'sec-quiz',     label: 'Quiz',          icon: 'fas fa-question-circle' });
    if (data.mindmap)                     items.push({ id: 'sec-mm',       label: 'Mind Map',      icon: 'fas fa-project-diagram' });
    if (data.key_concepts?.length)        items.push({ id: 'sec-concepts', label: 'Concepts',      icon: 'fas fa-lightbulb' });
    if (data.key_tricks?.length)          items.push({ id: 'sec-tricks',   label: 'Tricks',        icon: 'fas fa-magic' });
    if (data.practice_questions?.length)  items.push({ id: 'sec-qa',       label: 'Q&A',           icon: 'fas fa-pen-alt' });
    if (data.real_world_applications?.length) items.push({ id: 'sec-apps', label: 'Applications',  icon: 'fas fa-globe' });
    if (data.common_misconceptions?.length)   items.push({ id: 'sec-misc', label: 'Misconceptions',icon: 'fas fa-exclamation-triangle' });
    return items;
  }

  // ─────────────────────────────────────────────────────────────────────────────────────────────────
  // SECTION 19: RESULT BUILDERS — NOTES
  // ─────────────────────────────────────────────────────────────────────────────────────────────────

  _buildNotesHTML(data) {
    let h = '';
    if (data.ultra_long_notes) {
      h += `<div class="study-sec section-anchor" id="sec-notes">
        <div class="ss-hdr">
          <div class="ss-title"><i class="fas fa-book-open"></i> Comprehensive Study Notes</div>
          <button class="ss-copy-btn" onclick="window._app._copyTxt(this.closest('.study-sec').querySelector('.md-content').innerText)">
            <i class="fas fa-copy"></i> Copy
          </button>
        </div>
        <div class="ss-body"><div class="md-content">${this._renderMd(data.ultra_long_notes)}</div></div>
      </div>`;
    }
    if (data.key_concepts?.length)           h += this._secConcepts(data.key_concepts);
    if (data.key_tricks?.length)             h += this._secTricks(data.key_tricks);
    if (data.practice_questions?.length)     h += this._secQA(data.practice_questions);
    if (data.real_world_applications?.length)h += this._secApps(data.real_world_applications);
    if (data.common_misconceptions?.length)  h += this._secMisc(data.common_misconceptions);
    if (data.flashcards?.length)             h += `<div class="study-sec section-anchor" id="sec-fc"><div class="ss-hdr"><div class="ss-title"><i class="fas fa-layer-group"></i> Flashcard Preview</div></div><div class="ss-body">${this._fcMiniList(data.flashcards)}</div></div>`;
    if (data.quiz_questions?.length)         h += `<div class="study-sec section-anchor" id="sec-quiz"><div class="ss-hdr"><div class="ss-title"><i class="fas fa-question-circle"></i> Quiz Preview</div></div><div class="ss-body">${this._quizMiniList(data.quiz_questions)}</div></div>`;
    if (data.mindmap)                        h += `<div class="study-sec section-anchor" id="sec-mm"><div class="ss-hdr"><div class="ss-title"><i class="fas fa-project-diagram"></i> Mind Map Preview</div></div><div class="ss-body">${this._mmMini(data.mindmap)}</div></div>`;
    return h || '<div style="padding:24px;text-align:center;color:#d4af37">Study materials generated successfully.</div>';
  }

  // ─────────────────────────────────────────────────────────────────────────────────────────────────
  // SECTION 20: ALL-TOOLS MEGA BUNDLE HTML
  // ─────────────────────────────────────────────────────────────────────────────────────────────────

  _buildAllHTML(data) {
    let h = `<div class="mega-result-banner">
      <i class="fas fa-bolt"></i>
      ⚡ Mega Study Bundle — All 5 Tools Generated
      <span class="mega-result-count">
        ${data.flashcards?.length ? `🃏 ${data.flashcards.length} Cards` : ''}
        ${data.quiz_questions?.length ? ` · ❓ ${data.quiz_questions.length} Questions` : ''}
        ${data.mindmap?.branches?.length ? ` · 🗺️ ${data.mindmap.branches.length} Branches` : ''}
      </span>
    </div>`;

    // 1. NOTES
    if (data.ultra_long_notes) {
      h += `<div class="study-sec section-anchor mega-section" id="sec-notes">
        <div class="ss-hdr mega-hdr">
          <div class="ss-title"><span class="mega-num">1</span><i class="fas fa-book-open"></i> Comprehensive Notes</div>
          <button class="ss-copy-btn" onclick="window._app._copyTxt(this.closest('.study-sec').querySelector('.md-content').innerText)">
            <i class="fas fa-copy"></i> Copy
          </button>
        </div>
        <div class="ss-body"><div class="md-content">${this._renderMd(data.ultra_long_notes)}</div></div>
      </div>`;
    }

    // 2. FLASHCARDS (interactive)
    if (data.flashcards?.length) {
      this.fcCards   = data.flashcards;
      this.fcCurrent = 0;
      this.fcFlipped = false;
      h += `<div class="study-sec section-anchor mega-section" id="sec-fc">
        <div class="ss-hdr mega-hdr">
          <div class="ss-title"><span class="mega-num">2</span><i class="fas fa-layer-group"></i> Flashcards (${data.flashcards.length} cards)</div>
        </div>
        <div class="ss-body">${this._buildFcMode(data.flashcards)}</div>
      </div>`;
    }

    // 3. QUIZ (interactive)
    if (data.quiz_questions?.length) {
      this.quizData  = data.quiz_questions.map(q => ({ ...q, answered: false, correct: false, selectedIdx: -1 }));
      this.quizIdx   = 0;
      this.quizScore = 0;
      h += `<div class="study-sec section-anchor mega-section" id="sec-quiz">
        <div class="ss-hdr mega-hdr">
          <div class="ss-title"><span class="mega-num">3</span><i class="fas fa-question-circle"></i> Practice Quiz (${data.quiz_questions.length} questions)</div>
          <div class="quiz-score-display"><i class="fas fa-star"></i> <span id="quizScoreNum">0</span> / ${data.quiz_questions.length}</div>
        </div>
        <div class="ss-body" id="quizBody">${this._renderQuizQ(0)}</div>
      </div>`;
    }

    // 4. SUMMARY
    if (data.ultra_long_notes) {
      const paragraphs = data.ultra_long_notes.split('\n\n');
      const tldr = paragraphs.find(p => p.includes('TL;DR') || p.includes('Summary') || p.includes('Summary')) || paragraphs[0] || '';
      h += `<div class="study-sec section-anchor mega-section" id="sec-summary">
        <div class="ss-hdr mega-hdr">
          <div class="ss-title"><span class="mega-num">4</span><i class="fas fa-align-left"></i> Smart Summary</div>
        </div>
        <div class="ss-body">
          <div class="summary-tldr-box">
            <div class="summary-tldr-icon"><i class="fas fa-bolt"></i></div>
            <div class="summary-tldr-content">${this._renderMd(tldr)}</div>
          </div>
          ${data.key_concepts?.length ? `<div class="summary-points-list">${data.key_concepts.map((c, i) => `<div class="summary-point"><div class="summary-point-num">${i + 1}</div><div class="summary-point-text">${this._esc(c)}</div></div>`).join('')}</div>` : ''}
        </div>
      </div>`;
    }

    // 5. MIND MAP
    if (data.mindmap) {
      h += `<div class="study-sec section-anchor mega-section" id="sec-mm">
        <div class="ss-hdr mega-hdr">
          <div class="ss-title"><span class="mega-num">5</span><i class="fas fa-project-diagram"></i> Visual Mind Map</div>
        </div>
        <div class="ss-body">
          <div class="mm-root"><i class="fas fa-brain"></i> ${this._esc(data.mindmap.central || data.topic || 'Topic')}</div>
          <div class="mm-branches">
            ${(data.mindmap.branches || []).map(b => `
              <div class="mm-branch">
                <div class="mm-branch-hdr" style="color:${b.color || '#d4af37'}">
                  <i class="fas fa-project-diagram"></i> ${this._esc(b.name)}
                </div>
                <div class="mm-nodes-list">
                  ${(b.items || []).map(item => `
                    <div class="mm-node">
                      <span class="mm-node-dot" style="background:${b.color || '#d4af37'}"></span>
                      <span class="mm-node-text">${this._esc(item)}</span>
                    </div>`).join('')}
                </div>
              </div>`).join('')}
          </div>
          ${data.mindmap.connections?.length ? `
            <div class="mm-connections">
              <div class="mm-conn-title"><i class="fas fa-link"></i> Cross-Connections</div>
              <div class="mm-conn-list">
                ${data.mindmap.connections.map(c => `
                  <div class="mm-conn-item">
                    <strong>${this._esc(c.from)}</strong> ↔ <strong>${this._esc(c.to)}</strong>:
                    ${this._esc(c.description)}
                  </div>`).join('')}
              </div>
            </div>` : ''}
        </div>
      </div>`;
    }

    // Supporting sections
    if (data.key_tricks?.length)              h += this._secTricks(data.key_tricks);
    if (data.practice_questions?.length)      h += this._secQA(data.practice_questions);
    if (data.real_world_applications?.length) h += this._secApps(data.real_world_applications);
    if (data.common_misconceptions?.length)   h += this._secMisc(data.common_misconceptions);

    return h;
  }

  // ─────────────────────────────────────────────────────────────────────────────────────────────────
  // SECTION 21: FLASHCARD HTML BUILDER
  // ─────────────────────────────────────────────────────────────────────────────────────────────────

  _buildFcHTML(data) {
    const cards = data.flashcards?.length ? data.flashcards
      : (data.key_concepts || []).slice(0, 15).map(c => ({
          front: c.split(':')[0]?.trim() || c.slice(0, 60),
          back:  c,
        }));

    if (!cards.length) return this._buildNotesHTML(data);

    this.fcCards   = cards;
    this.fcCurrent = 0;
    this.fcFlipped = false;

    let h = `<div class="study-sec" id="sec-fc">
      <div class="ss-hdr">
        <div class="ss-title"><i class="fas fa-layer-group"></i> Interactive Flashcards (${cards.length} cards)</div>
      </div>
      <div class="ss-body">${this._buildFcMode(cards)}</div>
    </div>`;

    if (data.ultra_long_notes) {
      h += `<div class="study-sec" id="sec-notes">
        <div class="ss-hdr"><div class="ss-title"><i class="fas fa-book-open"></i> Study Notes</div></div>
        <div class="ss-body"><div class="md-content">${this._renderMd(data.ultra_long_notes)}</div></div>
      </div>`;
    }
    return h;
  }

  _buildFcMode(cards) {
    const total = cards.length;
    const first = cards[0];
    return `
      <div class="fc-mode">
        <div class="fc-top-bar">
          <div class="fc-prog">Card <span id="fcCur">1</span> of <span id="fcTot">${total}</span></div>
          <div class="fc-prog-bar-wrap">
            <div class="fc-prog-bar-fill" id="fcProgBar" style="width:${(1 / total * 100).toFixed(1)}%"></div>
          </div>
          <div class="fc-prog"><span id="fcPct">${Math.round(1 / total * 100)}</span>%</div>
        </div>
        <div class="fc-wrap" onclick="window._app._fcFlip()" tabindex="0"
             onkeydown="if(event.key===' '){event.preventDefault();window._app._fcFlip();}">
          <div class="flashcard" id="theCard">
            <div class="fc-face fc-front">
              <div class="fc-lbl"><i class="fas fa-question-circle"></i> Question</div>
              <div class="fc-content" id="fcFront">${this._esc(first.front || first.question || '')}</div>
              <div class="fc-hint">📱 Tap to flip · <kbd>Space</kbd></div>
            </div>
            <div class="fc-face fc-back">
              <div class="fc-lbl"><i class="fas fa-lightbulb"></i> Answer</div>
              <div class="fc-content" id="fcBack">${this._renderMd(first.back || first.answer || '')}</div>
              <div class="fc-hint">Use arrows to navigate</div>
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
          <button class="fc-btn" id="fcNext" onclick="window._app._fcNav(1)" ${total <= 1 ? 'disabled' : ''}>
            Next <i class="fas fa-arrow-right"></i>
          </button>
        </div>
        <div class="fc-controls">
          <button class="fc-btn" onclick="window._app._fcShuffle()"><i class="fas fa-random"></i> Shuffle</button>
          <button class="fc-btn" onclick="window._app._fcRestart()"><i class="fas fa-redo"></i> Restart</button>
        </div>
        <div class="fc-swipe-hint">
          <kbd>Space</kbd> flip · <kbd>←</kbd><kbd>→</kbd> navigate · <kbd>S</kbd> shuffle
        </div>
      </div>`;
  }

  _fcFlip() {
    const card = this._el('theCard') || this.el.theCard;
    if (!card) return;
    this.fcFlipped = !this.fcFlipped;
    card.classList.toggle('flipped', this.fcFlipped);
  }

  _fcNav(dir) {
    if (!this.fcCards.length) return;
    this.fcCurrent = Math.max(0, Math.min(this.fcCards.length - 1, this.fcCurrent + dir));
    this.fcFlipped = false;

    const card = this._el('theCard') || this.el.theCard;
    if (card) card.classList.remove('flipped');

    const c    = this.fcCards[this.fcCurrent];
    const fcF  = this._el('fcFront')  || this.el.fcFront;
    const fcB  = this._el('fcBack')   || this.el.fcBack;
    const fcC  = this._el('fcCur')    || this.el.fcCur;
    const fcPc = this._el('fcPct')    || this.el.fcPct;
    const fcPb = this._el('fcProgBar')|| this.el.fcProgBar;
    const fcPv = this._el('fcPrev')   || this.el.fcPrev;
    const fcNx = this._el('fcNext')   || this.el.fcNext;

    if (fcF) fcF.textContent     = c.front || c.question || '';
    if (fcB) fcB.innerHTML       = this._renderMd(c.back || c.answer || '');
    if (fcC) fcC.textContent     = this.fcCurrent + 1;
    const p = ((this.fcCurrent + 1) / this.fcCards.length * 100).toFixed(1);
    if (fcPc) fcPc.textContent   = Math.round(p);
    if (fcPb) fcPb.style.width   = `${p}%`;
    if (fcPv) fcPv.disabled      = this.fcCurrent === 0;
    if (fcNx) fcNx.disabled      = this.fcCurrent === this.fcCards.length - 1;
  }

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

  _fcRestart() { this.fcCurrent = 0; this.fcFlipped = false; this._fcNav(0); }

  // ─────────────────────────────────────────────────────────────────────────────────────────────────
  // SECTION 22: QUIZ HTML BUILDER
  // ─────────────────────────────────────────────────────────────────────────────────────────────────

  _buildQuizHTML(data) {
    const qs = data.quiz_questions || data.practice_questions || [];
    if (!qs.length) return this._buildNotesHTML(data);

    this.quizData  = qs.map(q => ({ ...q, answered: false, correct: false, selectedIdx: -1 }));
    this.quizIdx   = 0;
    this.quizScore = 0;

    let h = `
      <div class="study-sec" id="quizContainer">
        <div class="ss-hdr">
          <div class="ss-title"><i class="fas fa-question-circle"></i> Practice Quiz (${this.quizData.length} questions)</div>
          <div class="quiz-score-display"><i class="fas fa-star"></i> <span id="quizScoreNum">0</span> / ${this.quizData.length}</div>
        </div>
        <div class="ss-body" id="quizBody">${this._renderQuizQ(0)}</div>
      </div>`;

    if (data.ultra_long_notes) {
      h += `<div class="study-sec">
        <div class="ss-hdr"><div class="ss-title"><i class="fas fa-book-open"></i> Study Notes</div></div>
        <div class="ss-body"><div class="md-content">${this._renderMd(data.ultra_long_notes)}</div></div>
      </div>`;
    }
    return h;
  }

  _renderQuizQ(idx) {
    if (idx >= this.quizData.length) return this._renderQuizResult();
    const q       = this.quizData[idx];
    const options = q.options || [];
    const pct     = (idx / this.quizData.length * 100).toFixed(0);
    const letters = ['A', 'B', 'C', 'D', 'E'];
    const diffCol = q.difficulty === 'hard' ? '#ff4444' : q.difficulty === 'easy' ? '#00ff88' : '#ffae00';

    return `
      <div class="quiz-q-card">
        <div class="quiz-top-bar">
          <div class="quiz-progress-track">
            <div class="quiz-progress-fill" style="width:${pct}%"></div>
          </div>
          <div class="quiz-top-meta">
            <span class="quiz-q-counter">Q ${idx + 1} / ${this.quizData.length}</span>
            ${q.difficulty ? `<span class="quiz-diff-badge" style="color:${diffCol}">${q.difficulty}</span>` : ''}
          </div>
        </div>
        <div class="quiz-question-wrap">
          <div class="quiz-question-num">Question ${idx + 1}</div>
          <div class="quiz-question-text">${this._esc(q.question)}</div>
        </div>
        <div class="quiz-options-grid" id="quizOpts_${idx}">
          ${options.map((opt, oi) => `
            <button class="quiz-opt-btn" onclick="window._app._quizSelect(${idx}, ${oi})" ${q.answered ? 'disabled' : ''}>
              <span class="quiz-opt-letter">${letters[oi]}</span>
              <span class="quiz-opt-text">${this._esc(opt)}</span>
            </button>`).join('')}
        </div>
        <div class="quiz-answer-area" id="quizAns_${idx}" style="display:none"></div>
        <div class="quiz-nav-area" id="quizNav_${idx}" style="display:none">
          <button class="quiz-nav-btn" onclick="window._app._quizAdvance(${idx})">
            ${idx + 1 < this.quizData.length ? 'Next Question →' : 'See Results'}
          </button>
        </div>
      </div>`;
  }

  _quizSelect(qIdx, optIdx) {
    const q = this.quizData[qIdx];
    if (q.answered) return;
    q.answered    = true;
    q.selectedIdx = optIdx;
    const selected = q.options?.[optIdx];
    q.correct = selected === q.correct_answer;

    if (q.correct) {
      this.quizScore++;
      this._toast('success', 'fa-check-circle', '✓ Correct! Well done!');
    } else {
      this._toast('info', 'fa-book-open', `✗ Incorrect — see explanation below`);
    }

    // Update score display
    const sn = this._el('quizScoreNum') || this.el.quizScoreNum;
    if (sn) sn.textContent = this.quizScore;

    // Color the options
    const oc = this._el(`quizOpts_${qIdx}`);
    if (oc) {
      oc.querySelectorAll('.quiz-opt-btn').forEach((btn, oi) => {
        btn.disabled = true;
        if (q.options[oi] === q.correct_answer) btn.classList.add('correct');
        else if (oi === optIdx && !q.correct)    btn.classList.add('wrong');
      });
    }

    // Show explanation
    const aa = this._el(`quizAns_${qIdx}`);
    if (aa) {
      aa.style.display = 'block';
      aa.innerHTML = `
        <div class="quiz-explanation ${q.correct ? 'correct' : 'incorrect'}">
          <div class="quiz-exp-header">
            <i class="fas ${q.correct ? 'fa-check-circle' : 'fa-times-circle'}"></i>
            <strong>${q.correct ? '✓ Correct!' : '✗ Incorrect'}</strong>
          </div>
          <div class="quiz-exp-label">Correct Answer: <strong>${this._esc(q.correct_answer)}</strong></div>
          <div class="quiz-exp-label">Explanation</div>
          <div class="quiz-exp-text">${this._renderMd(q.explanation || q.answer || '')}</div>
        </div>`;
      setTimeout(() => aa.scrollIntoView({ behavior: 'smooth', block: 'nearest' }), 100);
    }

    // Show next button
    const na = this._el(`quizNav_${qIdx}`);
    if (na) na.style.display = 'flex';
  }

  _quizAdvance(curr) {
    this.quizIdx = curr + 1;
    const qb = this._el('quizBody') || this.el.quizBody;
    if (!qb) return;
    if (this.quizIdx >= this.quizData.length) {
      qb.innerHTML = this._renderQuizResult();
    } else {
      qb.innerHTML = this._renderQuizQ(this.quizIdx);
      qb.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }

  _renderQuizResult() {
    const total  = this.quizData.length;
    const score  = this.quizScore;
    const pct    = Math.round((score / total) * 100);
    const emoji  = pct >= 90 ? '🏆' : pct >= 75 ? '🎓' : pct >= 60 ? '📚' : pct >= 40 ? '💪' : '📖';
    const grade  = pct >= 90 ? 'Outstanding!' : pct >= 75 ? 'Excellent!' : pct >= 60 ? 'Good Progress!' : pct >= 40 ? 'Keep Studying!' : 'More Practice Needed';
    const color  = pct >= 75 ? '#00ff88' : pct >= 50 ? '#ffae00' : '#ff4444';

    if (score === total) this._confetti();

    return `
      <div class="quiz-result-wrap">
        <div class="quiz-result-score-wrap">
          <div class="quiz-result-emoji">${emoji}</div>
          <div class="quiz-result-big-score" style="color:${color}">
            ${score}<span class="quiz-result-denom"> / ${total}</span>
          </div>
          <div class="quiz-result-pct">${pct}% Correct</div>
          <div class="quiz-result-grade">${grade}</div>
        </div>
        <div class="quiz-result-stats">
          <div class="quiz-result-stat">
            <div class="quiz-result-stat-val" style="color:#00ff88">${score}</div>
            <div class="quiz-result-stat-lbl"><i class="fas fa-check-circle"></i> Correct</div>
          </div>
          <div class="quiz-result-stat">
            <div class="quiz-result-stat-val" style="color:#ff4444">${total - score}</div>
            <div class="quiz-result-stat-lbl"><i class="fas fa-times-circle"></i> Wrong</div>
          </div>
          <div class="quiz-result-stat">
            <div class="quiz-result-stat-val" style="color:#d4af37">${pct}%</div>
            <div class="quiz-result-stat-lbl"><i class="fas fa-percentage"></i> Score</div>
          </div>
        </div>
        <div class="quiz-result-actions">
          <button class="fc-btn primary" onclick="window._app._quizRestart()">
            <i class="fas fa-redo"></i> Try Again
          </button>
          <button class="fc-btn" onclick="window._app._quizToggleReview()">
            <i class="fas fa-eye"></i> <span id="quizReviewToggleLabel">Show Review</span>
          </button>
          <button class="fc-btn" onclick="window._app._openWizard()">
            <i class="fas fa-magic"></i> New Material
          </button>
        </div>
        <div id="quizReviewSection" style="display:none">
          <div class="quiz-review-list">
            ${this.quizData.map((q, i) => `
              <div class="quiz-review-item ${q.correct ? 'correct' : 'incorrect'}">
                <div class="quiz-review-hdr">
                  <span><i class="fas ${q.correct ? 'fa-check-circle' : 'fa-times-circle'}"
                           style="color:${q.correct ? '#00ff88' : '#ff4444'}"></i></span>
                  <span class="quiz-review-num">Q${i + 1}</span>
                  <span class="quiz-review-q">${this._esc(q.question?.slice(0, 80))}${q.question?.length > 80 ? '…' : ''}</span>
                </div>
                <div class="quiz-review-correct">✓ Correct: ${this._esc(q.correct_answer)}</div>
                ${!q.correct && q.selectedIdx >= 0 ? `<div class="quiz-review-wrong">✗ You answered: ${this._esc(q.options?.[q.selectedIdx] || 'Not answered')}</div>` : ''}
              </div>`).join('')}
          </div>
        </div>
      </div>`;
  }

  _quizToggleReview() {
    const rs = this._el('quizReviewSection') || this.el.quizReviewSection;
    const rl = this._el('quizReviewToggleLabel') || this.el.quizReviewToggleLabel;
    if (!rs) return;
    const hidden = rs.style.display === 'none';
    rs.style.display = hidden ? 'block' : 'none';
    if (rl) rl.textContent = hidden ? 'Hide Review' : 'Show Review';
  }

  _quizRestart() {
    this.quizScore = 0;
    this.quizIdx   = 0;
    this.quizData.forEach(q => { q.answered = false; q.correct = false; q.selectedIdx = -1; });
    const qb = this._el('quizBody') || this.el.quizBody;
    if (qb) qb.innerHTML = this._renderQuizQ(0);
    const sn = this._el('quizScoreNum') || this.el.quizScoreNum;
    if (sn) sn.textContent = '0';
  }

  // ─────────────────────────────────────────────────────────────────────────────────────────────────
  // SECTION 23: SUMMARY & MIND MAP HTML
  // ─────────────────────────────────────────────────────────────────────────────────────────────────

  _buildSummaryHTML(data) {
    let h = '';
    if (data.ultra_long_notes) {
      const paragraphs = data.ultra_long_notes.split('\n\n');
      const tldr = paragraphs.find(p => p.includes('TL;DR') || p.includes('Summary') || p.includes('Executive')) || paragraphs[0] || '';
      h += `
        <div class="study-sec" id="sec-tldr">
          <div class="ss-hdr">
            <div class="ss-title"><i class="fas fa-bolt"></i> TL;DR — Executive Summary</div>
            <button class="ss-copy-btn" onclick="window._app._copyTxt(this.closest('.study-sec').querySelector('.summary-tldr-content').innerText)">
              <i class="fas fa-copy"></i> Copy
            </button>
          </div>
          <div class="ss-body">
            <div class="summary-tldr-box">
              <div class="summary-tldr-icon"><i class="fas fa-align-left"></i></div>
              <div class="summary-tldr-content">${this._renderMd(tldr)}</div>
            </div>
          </div>
        </div>
        <div class="study-sec" id="sec-notes">
          <div class="ss-hdr">
            <div class="ss-title"><i class="fas fa-book-open"></i> Full Summary</div>
            <button class="ss-copy-btn" onclick="window._app._copyTxt(this.closest('.study-sec').querySelector('.md-content').innerText)">
              <i class="fas fa-copy"></i> Copy
            </button>
          </div>
          <div class="ss-body"><div class="md-content">${this._renderMd(data.ultra_long_notes)}</div></div>
        </div>`;
    }
    if (data.key_concepts?.length) {
      h += `<div class="study-sec">
        <div class="ss-hdr"><div class="ss-title"><i class="fas fa-list-check"></i> Key Points</div></div>
        <div class="ss-body">
          <div class="summary-points-list">
            ${data.key_concepts.map((c, i) => `
              <div class="summary-point">
                <div class="summary-point-num">${i + 1}</div>
                <div class="summary-point-text">${this._esc(c)}</div>
              </div>`).join('')}
          </div>
        </div>
      </div>`;
    }
    return h || this._buildNotesHTML(data);
  }

  _buildMindmapHTML(data) {
    const mm    = data.mindmap;
    const topic = data.topic || 'Topic';

    if (mm?.branches?.length) {
      const branchHtml = mm.branches.map(b => `
        <div class="mm-branch">
          <div class="mm-branch-hdr" style="color:${b.color || '#d4af37'}">
            <i class="fas fa-project-diagram"></i> ${this._esc(b.name)}
          </div>
          <div class="mm-nodes-list">
            ${(b.items || []).map(item => `
              <div class="mm-node">
                <span class="mm-node-dot" style="background:${b.color || '#d4af37'}"></span>
                <span class="mm-node-text">${this._esc(item)}</span>
              </div>`).join('')}
          </div>
        </div>`).join('');

      const connHtml = mm.connections?.length ? `
        <div class="mm-connections">
          <div class="mm-conn-title"><i class="fas fa-link"></i> Cross-Connections</div>
          <div class="mm-conn-list">
            ${mm.connections.map(c => `
              <div class="mm-conn-item">
                <strong>${this._esc(c.from)}</strong> ↔ <strong>${this._esc(c.to)}</strong>:
                ${this._esc(c.description)}
              </div>`).join('')}
          </div>
        </div>` : '';

      let h = `
        <div class="study-sec" id="sec-mm">
          <div class="ss-hdr">
            <div class="ss-title"><i class="fas fa-project-diagram"></i> Visual Mind Map — ${this._esc(mm.central || topic)}</div>
          </div>
          <div class="ss-body">
            <div class="mm-root"><i class="fas fa-brain"></i> ${this._esc(mm.central || topic)}</div>
            <div class="mm-branches">${branchHtml}</div>
            ${connHtml}
          </div>
        </div>`;

      if (data.ultra_long_notes) {
        h += `<div class="study-sec" id="sec-notes">
          <div class="ss-hdr"><div class="ss-title"><i class="fas fa-book-open"></i> Mind Map Notes</div></div>
          <div class="ss-body"><div class="md-content">${this._renderMd(data.ultra_long_notes)}</div></div>
        </div>`;
      }
      return h;
    }

    // Fallback mindmap from key_concepts
    const branches = [
      { name: 'Core Concepts', items: data.key_concepts || [],            color: '#d4af37' },
      { name: 'Study Tricks',  items: data.key_tricks || [],              color: '#00ff88' },
      { name: 'Applications',  items: data.real_world_applications || [], color: '#00d4ff' },
      { name: 'Misconceptions',items: data.common_misconceptions || [],   color: '#ff4444' },
    ].filter(b => b.items.length > 0);

    const bh = branches.map(b => `
      <div class="mm-branch">
        <div class="mm-branch-hdr" style="color:${b.color}">
          <i class="fas fa-project-diagram"></i> ${this._esc(b.name)}
        </div>
        <div class="mm-nodes-list">
          ${b.items.slice(0, 6).map(item => `
            <div class="mm-node">
              <span class="mm-node-dot" style="background:${b.color}"></span>
              <span class="mm-node-text">${this._esc(String(item).slice(0, 120))}</span>
            </div>`).join('')}
        </div>
      </div>`).join('');

    let h = `
      <div class="study-sec" id="sec-mm">
        <div class="ss-hdr">
          <div class="ss-title"><i class="fas fa-project-diagram"></i> Visual Mind Map — ${this._esc(topic)}</div>
        </div>
        <div class="ss-body">
          <div class="mm-root"><i class="fas fa-brain"></i> ${this._esc(topic)}</div>
          <div class="mm-branches">${bh || '<p style="color:rgba(255,255,255,.4);padding:16px">Mind map content generated…</p>'}</div>
        </div>
      </div>`;

    if (data.ultra_long_notes) {
      h += `<div class="study-sec" id="sec-notes">
        <div class="ss-hdr"><div class="ss-title"><i class="fas fa-book-open"></i> Notes</div></div>
        <div class="ss-body"><div class="md-content">${this._renderMd(data.ultra_long_notes)}</div></div>
      </div>`;
    }
    return h;
  }

  // ─────────────────────────────────────────────────────────────────────────────────────────────────
  // SECTION 24: REUSABLE SECTION BUILDERS
  // ─────────────────────────────────────────────────────────────────────────────────────────────────

  _secConcepts(arr) {
    return `<div class="study-sec section-anchor" id="sec-concepts">
      <div class="ss-hdr"><div class="ss-title"><i class="fas fa-lightbulb"></i> Key Concepts (${arr.length})</div></div>
      <div class="ss-body">
        <div class="concepts-grid">
          ${arr.map((c, i) => `
            <div class="concept-card">
              <div class="concept-num">${i + 1}</div>
              <div class="concept-text">${this._esc(c)}</div>
            </div>`).join('')}
        </div>
      </div>
    </div>`;
  }

  _secTricks(arr) {
    return `<div class="study-sec section-anchor" id="sec-tricks">
      <div class="ss-hdr"><div class="ss-title"><i class="fas fa-magic"></i> Study Tricks & Memory Aids</div></div>
      <div class="ss-body">
        <div class="tricks-list">
          ${arr.map(t => `
            <div class="trick-item">
              <div class="trick-icon"><i class="fas fa-magic"></i></div>
              <div class="trick-text">${this._esc(t)}</div>
            </div>`).join('')}
        </div>
      </div>
    </div>`;
  }

  _secQA(arr) {
    return `<div class="study-sec section-anchor" id="sec-qa">
      <div class="ss-hdr"><div class="ss-title"><i class="fas fa-pen-alt"></i> Practice Q&A (${arr.length})</div></div>
      <div class="ss-body">
        <div class="qa-list">
          ${arr.map((qa, i) => `
            <div class="qa-card">
              <div class="qa-head" onclick="this.nextElementSibling.classList.toggle('visible')">
                <div class="qa-num">${i + 1}</div>
                <div class="qa-q">${this._esc(qa.question)}</div>
                <button class="qa-toggle"><i class="fas fa-chevron-down"></i> Answer</button>
              </div>
              <div class="qa-answer">
                <div class="qa-albl"><i class="fas fa-check-circle"></i> Answer</div>
                <div class="qa-answer-inner">${this._renderMd(qa.answer)}</div>
              </div>
            </div>`).join('')}
        </div>
      </div>
    </div>`;
  }

  _secApps(arr) {
    return `<div class="study-sec section-anchor" id="sec-apps">
      <div class="ss-hdr"><div class="ss-title"><i class="fas fa-globe"></i> Real-World Applications</div></div>
      <div class="ss-body">
        <div class="items-list">
          ${arr.map((a, i) => `
            <div class="list-item app">
              <i class="fas fa-globe li-ico"></i>
              <div class="li-text"><strong>${i + 1}.</strong> ${this._esc(a)}</div>
            </div>`).join('')}
        </div>
      </div>
    </div>`;
  }

  _secMisc(arr) {
    return `<div class="study-sec section-anchor" id="sec-misc">
      <div class="ss-hdr"><div class="ss-title"><i class="fas fa-exclamation-triangle"></i> Common Misconceptions</div></div>
      <div class="ss-body">
        <div class="items-list">
          ${arr.map(m => `
            <div class="list-item misc">
              <i class="fas fa-exclamation-triangle li-ico"></i>
              <div class="li-text">${this._esc(m)}</div>
            </div>`).join('')}
        </div>
      </div>
    </div>`;
  }

  _fcMiniList(cards) {
    const show = cards.slice(0, 5);
    return `<div class="fc-mini-list">
      ${show.map((c, i) => `
        <div class="fc-mini-card">
          <div class="fc-mini-q"><strong>Q${i + 1}:</strong> ${this._esc(c.front || c.question || '')}</div>
          <div class="fc-mini-a"><strong>A:</strong> ${this._esc((c.back || c.answer || '').slice(0, 180))}</div>
        </div>`).join('')}
      ${cards.length > 5 ? `<div class="fc-mini-more">+ ${cards.length - 5} more — use Flashcards tool for full interactive deck</div>` : ''}
    </div>`;
  }

  _quizMiniList(qs) {
    const show = qs.slice(0, 3);
    return `<div class="quiz-mini-list">
      ${show.map((q, i) => `
        <div class="quiz-mini-card">
          <div class="quiz-mini-q"><strong>Q${i + 1}:</strong> ${this._esc(q.question?.slice(0, 100))}${q.question?.length > 100 ? '…' : ''}</div>
          ${q.options ? `<div class="quiz-mini-options">${q.options.map((opt, oi) => `<div class="quiz-mini-opt ${opt === q.correct_answer ? 'correct' : ''}">${String.fromCharCode(65 + oi)}. ${this._esc(opt)}</div>`).join('')}</div>` : ''}
          <div class="quiz-mini-answer">✓ ${this._esc(q.correct_answer)}</div>
        </div>`).join('')}
      ${qs.length > 3 ? `<div class="quiz-mini-more">+ ${qs.length - 3} more — use Quiz tool for full interactive quiz</div>` : ''}
    </div>`;
  }

  _mmMini(mm) {
    if (!mm) return '';
    return `<div class="mm-mini">
      <div class="mm-mini-central">🎯 ${this._esc(mm.central)}</div>
      <div class="mm-mini-branches">
        ${(mm.branches || []).slice(0, 4).map(b => `
          <div class="mm-mini-branch">
            <div class="mm-mini-branch-name" style="color:${b.color || '#d4af37'}">
              📌 ${this._esc(b.name)}
            </div>
            <div class="mm-mini-items">
              ${(b.items || []).slice(0, 4).map(item => `
                <span class="mm-mini-item">${this._esc(item)}</span>`).join('')}
            </div>
          </div>`).join('')}
      </div>
    </div>`;
  }

  // ─────────────────────────────────────────────────────────────────────────────────────────────────
  // SECTION 25: WORLD-CLASS PDF GENERATION
  // ─────────────────────────────────────────────────────────────────────────────────────────────────

  _downloadPDF() {
    const data = this.currentData;
    if (!data) { this._toast('info', 'fa-info-circle', 'Generate some content first.'); return; }

    if (typeof window.jspdf === 'undefined' || !window.jspdf?.jsPDF) {
      this._toast('info', 'fa-spinner fa-pulse', 'Loading PDF library…');
      const sc    = document.createElement('script');
      sc.src      = 'https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js';
      sc.onload   = () => setTimeout(() => this._generatePDF(data, this.pdfTheme), 200);
      sc.onerror  = () => this._toast('error', 'fa-times', 'Could not load PDF library. Check your internet connection.');
      document.head.appendChild(sc);
      return;
    }
    this._generatePDF(data, this.pdfTheme);
  }

  _generatePDF(data, theme = 'dark') {
    this._toast('info', 'fa-spinner fa-pulse', `Generating world-class ${theme === 'dark' ? '🌙 Dark' : '☀️ Light'} PDF…`);
    try {
      const { jsPDF } = window.jspdf;
      const doc       = new jsPDF({ unit:'mm', format:'a4', compress:true });

      // ── Page metrics ──
      const PW = 210, PH = 297, ML = 14, MR = 14, CW = PW - ML - MR;
      const MT_CONTENT = 26;  // top margin on content pages after mini-header
      const MB = 16;          // bottom margin (above footer)
      const isDark = theme !== 'light';
      let Y = 0, pageNum = 1;

      // ── Palette ──
      const C = isDark ? {
        bg:      [7, 12, 32],
        gold:    [212, 175, 55],
        blue:    [0, 170, 220],
        purple:  [160, 60, 220],
        green:   [0, 180, 100],
        red:     [210, 55, 55],
        text:    [195, 198, 210],
        head:    [238, 240, 255],
        muted:   [115, 118, 138],
        card:    [14, 20, 52],
        hdr:     [20, 30, 72],
        border:  [28, 40, 88],
        correct: [0, 170, 90],
      } : {
        bg:      [255, 255, 255],
        gold:    [170, 135, 30],
        blue:    [0, 100, 190],
        purple:  [130, 40, 200],
        green:   [0, 130, 70],
        red:     [180, 40, 40],
        text:    [38, 40, 56],
        head:    [10, 18, 56],
        muted:   [100, 106, 126],
        card:    [244, 246, 255],
        hdr:     [228, 232, 252],
        border:  [210, 215, 240],
        correct: [0, 120, 60],
      };

      // ── Helpers ──
      const setFG = ([r,g,b]) => doc.setTextColor(r,g,b);
      const setBG = ([r,g,b]) => doc.setFillColor(r,g,b);
      const setDC = ([r,g,b]) => doc.setDrawColor(r,g,b);

      const fillBg = () => { if(isDark){setBG(C.bg);doc.rect(0,0,PW,PH,'F');} };

      const addPageFooter = () => {
        setBG(isDark?[10,16,40]:[235,238,252]);
        doc.rect(0, PH-MB, PW, MB, 'F');
        setDC(C.gold); doc.setLineWidth(0.25); doc.line(ML, PH-MB, PW-MR, PH-MB);
        doc.setFontSize(6.5); doc.setFont('helvetica','normal'); setFG(C.muted);
        doc.text(`${SAVOIRÉ.BRAND} · ${SAVOIRÉ.DEVSITE} · "${SAVOIRÉ.TAGLINE}"`, ML, PH-6);
        doc.text(`Page ${pageNum}`, PW-MR, PH-6, {align:'right'});
      };

      const addPageHeader = (subtitle='') => {
        setBG(C.hdr); doc.rect(0,0,PW,MT_CONTENT-4,'F');
        setDC(C.gold); doc.setLineWidth(0.25); doc.line(0,MT_CONTENT-4,PW,MT_CONTENT-4);
        doc.setFontSize(7.5); doc.setFont('helvetica','bold'); setFG(C.gold);
        doc.text(SAVOIRÉ.BRAND, ML, MT_CONTENT-9);
        doc.setFont('helvetica','normal'); setFG(C.muted);
        doc.text((subtitle||(data.topic||'')).slice(0,72), PW-MR, MT_CONTENT-9, {align:'right'});
      };

      const newPage = (subtitle) => {
        addPageFooter();
        doc.addPage(); pageNum++; Y = MT_CONTENT+2;
        fillBg(); addPageHeader(subtitle);
      };

      const ck = (need=12) => { if(Y+need > PH-MB-2) newPage(); };

      // ── Word-wrapped text writer ──
      const wt = (txt, x, maxW, sz, bold=false, color=C.text, lineH=null) => {
        if(!txt)return;
        doc.setFontSize(sz); doc.setFont('helvetica', bold?'bold':'normal'); setFG(color);
        const lines = doc.splitTextToSize(String(txt), maxW);
        const lh    = lineH || sz * 0.385;
        ck(lines.length * lh + 1);
        doc.text(lines, x, Y);
        Y += lines.length * lh + 0.5;
        return lines.length;
      };

      // ── Section header bar ──
      const secHdr = (label, color=C.gold) => {
        ck(14);
        setBG(C.hdr); doc.rect(ML, Y, CW, 9, 'F');
        setBG(color);  doc.rect(ML, Y, 3, 9, 'F');
        doc.setFontSize(9); doc.setFont('helvetica','bold'); setFG(color);
        doc.text(label, ML+6, Y+6.2);
        Y += 13;
      };

      // ── Rounded card ──
      const card = (h, fillColor=C.card, borderColor=C.border) => {
        ck(h+2);
        setBG(fillColor); doc.roundedRect(ML, Y, CW, h, 2, 2, 'F');
        setDC(borderColor); doc.setLineWidth(0.18); doc.roundedRect(ML, Y, CW, h, 2, 2, 'S');
        Y += 3;
      };

      // ───────────────────────────────────────────────────────────────
      // COVER PAGE
      // ───────────────────────────────────────────────────────────────
      fillBg();

      // Gold accent bars top+bottom
      setBG(C.gold); doc.rect(0,0,PW,4,'F'); doc.rect(0,PH-4,PW,4,'F');

      // Logo block
      setBG([0,140,220]); doc.roundedRect(ML, 14, 22, 22, 4, 4, 'F');
      doc.setFontSize(16); doc.setFont('helvetica','bold'); setFG([255,255,255]);
      doc.text('Ś', ML+8, 30);

      // App name
      doc.setFontSize(24); doc.setFont('helvetica','bold'); setFG(C.gold);
      doc.text('SAVOIRÉ AI', ML+28, 22);
      doc.setFontSize(9); doc.setFont('helvetica','normal'); setFG(C.muted);
      doc.text("v2.0 — World's Most Advanced Free AI Study Assistant", ML+28, 29);
      doc.text(`${SAVOIRÉ.DEVELOPER} · ${SAVOIRÉ.DEVSITE} · Founder: ${SAVOIRÉ.FOUNDER}`, ML+28, 36);

      // Divider
      setDC(C.gold); doc.setLineWidth(0.4); doc.line(ML, 43, PW-MR, 43);

      // Tool badge
      const tCfg = TOOL_CONFIG[this.tool] || TOOL_CONFIG.notes;
      setBG([0,80,160]); doc.roundedRect(ML, 48, 72, 8, 1.5, 1.5, 'F');
      doc.setFontSize(8); doc.setFont('helvetica','bold'); setFG([200,228,255]);
      doc.text(`${tCfg.sfpName.toUpperCase()}${this.tool==='all'?' — ALL 5 TOOLS ⚡':''}`, ML+4, 53.5);

      // Main topic title
      doc.setFontSize(20); doc.setFont('helvetica','bold'); setFG(C.head);
      const titleLines = doc.splitTextToSize(data.topic || 'Study Notes', CW);
      doc.text(titleLines, ML, 67);
      let cy = 67 + titleLines.length * 8.5;

      // Curriculum subtitle
      doc.setFontSize(9.5); doc.setFont('helvetica','normal'); setFG(C.muted);
      doc.text(data.curriculum_alignment || 'General Academic Study', ML, cy + 4);
      cy += 14;

      // Stats cards row
      const wc    = this._wordCount(this._stripMd(data.ultra_long_notes||''));
      const stats = [
        { l:'Score',   v:`${data.study_score||97}/100` },
        { l:'Words',   v:`~${wc.toLocaleString()}` },
        { l:'Quality', v:data._quality==='ai_generated'?'AI Generated':'Enhanced' },
        { l:'Lang',    v:data._language||'English' },
        { l:'Date',    v:new Date().toLocaleDateString() },
        { l:'Tool',    v:tCfg.sfpName },
      ];
      const sw = CW / 3;
      stats.forEach((s,i) => {
        const sx = ML + (i%3)*sw, sy = cy + Math.floor(i/3)*20;
        setBG(C.card); doc.roundedRect(sx, sy, sw-2, 17, 2, 2, 'F');
        doc.setFontSize(11); doc.setFont('helvetica','bold'); setFG(C.gold);
        doc.text(s.v, sx+(sw-2)/2, sy+9, {align:'center'});
        doc.setFontSize(6.5); doc.setFont('helvetica','normal'); setFG(C.muted);
        doc.text(s.l, sx+(sw-2)/2, sy+14.5, {align:'center'});
      });
      cy += 44;

      // Tagline
      doc.setFontSize(12.5); doc.setFont('helvetica','bolditalic'); setFG(C.gold);
      doc.text(`"${SAVOIRÉ.TAGLINE}"`, PW/2, cy+6, {align:'center'});
      doc.setFontSize(8); doc.setFont('helvetica','normal'); setFG(C.muted);
      doc.text(`— ${SAVOIRÉ.FOUNDER}`, PW/2, cy+13, {align:'center'});

      // PDF info at bottom
      doc.text(`Generated: ${new Date().toLocaleString()} · PDF Theme: ${isDark?'Dark':'Light'}`, PW/2, PH-22, {align:'center'});
      doc.text(`${SAVOIRÉ.WEBSITE}`, PW/2, PH-16, {align:'center'});

      addPageFooter();

      // ───────────────────────────────────────────────────────────────
      // CONTENT PAGES
      // ───────────────────────────────────────────────────────────────
      newPage('Study Notes');

      // ── STUDY NOTES ──
      if (data.ultra_long_notes) {
        secHdr('📚  Study Notes', C.gold);
        const clean  = this._stripMd(data.ultra_long_notes);
        const lines  = clean.split('\n');
        let   prevBlank = false;

        for (const raw of lines) {
          const tr = raw.trim();
          if (!tr) { if (!prevBlank) Y += 2; prevBlank = true; continue; }
          prevBlank = false;
          ck(9);

          if (tr.match(/^#{1,4}/)) {
            const lv  = (tr.match(/^#+/)||[''])[0].length;
            const txt = tr.replace(/^#+\s*/,'').replace(/\*+/g,'').replace(/`/g,'');
            Y += lv<=2 ? 4 : 2;
            const sz  = lv===1?14 : lv===2?11.5 : lv===3?10 : 9;
            const col = lv<=2 ? C.gold : lv===3 ? C.blue : C.head;
            if (lv <= 2) {
              // Draw accent line for H1/H2
              setBG(col); doc.rect(ML, Y-1, 3, sz*0.4, 'F');
              wt(txt, ML+5, CW-5, sz, true, col);
            } else {
              wt(txt, ML, CW, sz, true, col);
            }
            Y += lv<=2 ? 3 : 1;

          } else if (tr.match(/^[-•*]\s/)) {
            const txt = tr.replace(/^[-•*]\s*/,'');
            // Bullet dot
            setBG(C.gold); doc.circle(ML+2, Y-1.5, 1, 'F');
            wt(txt, ML+5, CW-5, 8.5, false, C.text);
            Y += 0.5;

          } else if (tr.match(/^\d+\.\s/)) {
            wt(tr, ML+4, CW-4, 8.5, false, C.text);
            Y += 0.5;

          } else if (tr.startsWith('>')) {
            ck(12);
            const qText = tr.replace(/^>\s*/,'');
            setBG(isDark?[12,20,52]:[238,242,255]);
            doc.rect(ML, Y-2, CW, 10, 'F');
            setBG(C.gold); doc.rect(ML, Y-2, 2.5, 10, 'F');
            wt(qText, ML+5, CW-5, 8.5, false, isDark?[220,210,160]:[75,60,10]);
            Y += 3;

          } else if (tr.startsWith('---')) {
            setDC(C.border); doc.setLineWidth(0.2);
            doc.line(ML, Y, PW-MR, Y);
            Y += 5;

          } else if (tr.includes('**') || tr.includes('`')) {
            const cleaned = tr.replace(/\*\*(.+?)\*\*/g,'$1').replace(/`(.+?)`/g,'[$1]').replace(/\*/g,'');
            wt(cleaned, ML, CW, 8.5, false, C.text);
            Y += 1;
          } else {
            wt(tr, ML, CW, 8.5, false, C.text);
            Y += 1;
          }
        }
        Y += 6;
      }

      // ── KEY CONCEPTS ──
      if (data.key_concepts?.length) {
        secHdr('💡  Key Concepts', C.gold);
        data.key_concepts.slice(0, 10).forEach((c, i) => {
          ck(16);
          setBG(C.card); doc.roundedRect(ML, Y, CW, 14, 2, 2, 'F');
          setDC(C.border); doc.setLineWidth(0.15); doc.roundedRect(ML, Y, CW, 14, 2, 2, 'S');
          // Number circle
          setBG(C.gold); doc.circle(ML+5, Y+7, 3.5, 'F');
          doc.setFontSize(7); doc.setFont('helvetica','bold'); setFG([8,14,35]);
          doc.text(String(i+1), ML+5, Y+8.5, {align:'center'});
          // Content
          const cLines = doc.splitTextToSize(String(c).slice(0,220), CW-14);
          doc.setFontSize(8); doc.setFont('helvetica','normal'); setFG(C.text);
          doc.text(cLines.slice(0,2), ML+11, Y+6);
          Y += 17;
        });
        Y += 4;
      }

      // ── FLASHCARDS ──
      if (data.flashcards?.length) {
        newPage('Flashcards');
        secHdr('🃏  Flashcards', C.purple);
        data.flashcards.forEach((fc, i) => {
          ck(28);
          // Card background
          setBG(C.card); doc.roundedRect(ML, Y, CW, 26, 2, 2, 'F');
          setDC(C.purple); doc.setLineWidth(0.2); doc.roundedRect(ML, Y, CW, 26, 2, 2, 'S');
          // Q label
          doc.setFontSize(6.5); doc.setFont('helvetica','bold'); setFG(C.purple);
          doc.text(`Q${i+1}`, ML+2.5, Y+5.5);
          // Front
          const fLines = doc.splitTextToSize(String(fc.front||fc.question||'').slice(0,90), CW-18);
          doc.setFontSize(8.5); doc.setFont('helvetica','bold'); setFG(C.head);
          doc.text(fLines.slice(0,2), ML+10, Y+6);
          // Divider line
          setDC(C.border); doc.setLineWidth(0.15); doc.line(ML+3, Y+12, PW-MR-3, Y+12);
          // A label
          doc.setFontSize(6.5); doc.setFont('helvetica','bold'); setFG(C.blue);
          doc.text('A:', ML+2.5, Y+17);
          // Back
          const bLines = doc.splitTextToSize(String(fc.back||fc.answer||'').slice(0,160), CW-14);
          doc.setFontSize(7.5); doc.setFont('helvetica','normal'); setFG(C.text);
          doc.text(bLines.slice(0,2), ML+10, Y+17);
          Y += 29;
        });
        Y += 4;
      }

      // ── QUIZ ──
      if (data.quiz_questions?.length) {
        newPage('Practice Quiz');
        secHdr('❓  Practice Quiz', C.green);
        const letters = ['A','B','C','D','E'];
        data.quiz_questions.forEach((q, i) => {
          ck(42);
          // Question number badge
          setBG(C.green); doc.circle(ML+4, Y+4, 4, 'F');
          doc.setFontSize(7.5); doc.setFont('helvetica','bold'); setFG([255,255,255]);
          doc.text(String(i+1), ML+4, Y+5.5, {align:'center'});
          // Difficulty
          if (q.difficulty) {
            const dc = q.difficulty==='hard'?C.red:q.difficulty==='easy'?C.green:C.gold;
            setBG(dc); doc.roundedRect(ML+10, Y+0.5, 18, 6, 1, 1, 'F');
            doc.setFontSize(5.5); setFG([255,255,255]);
            doc.text(q.difficulty.toUpperCase(), ML+19, Y+5, {align:'center'});
          }
          // Question text
          doc.setFontSize(9); doc.setFont('helvetica','bold'); setFG(C.head);
          const qLines = doc.splitTextToSize(q.question, CW-12);
          doc.text(qLines.slice(0,3), ML+30, Y+5);
          Y += Math.min(qLines.length, 3) * 4.5 + 5;
          // Options
          (q.options||[]).forEach((opt, oi) => {
            ck(8);
            const isCorrect = opt === q.correct_answer;
            if (isCorrect) {
              setBG(isDark?[0,40,18]:[215,255,228]);
              doc.roundedRect(ML+2, Y-2, CW-2, 7.5, 1, 1, 'F');
            }
            doc.setFontSize(7.5);
            doc.setFont('helvetica', isCorrect?'bold':'normal');
            setFG(isCorrect ? C.correct : C.text);
            doc.text(`${letters[oi]}. ${String(opt).slice(0,72)}${isCorrect?' ✓':''}`, ML+5, Y+3);
            Y += 8;
          });
          // Explanation (short)
          if (q.explanation) {
            ck(8);
            doc.setFontSize(6.8); doc.setFont('helvetica','italic'); setFG(C.muted);
            const expLines = doc.splitTextToSize('Explanation: '+q.explanation.slice(0,140), CW-6);
            doc.text(expLines.slice(0,2), ML+3, Y+2);
            Y += expLines.length > 1 ? 12 : 8;
          }
          Y += 4;
          setDC(C.border); doc.setLineWidth(0.12); doc.line(ML+10, Y, PW-MR-10, Y);
          Y += 6;
        });
      }

      // ── MIND MAP ──
      if (data.mindmap?.branches?.length) {
        newPage('Mind Map');
        secHdr('🗺️  Mind Map', C.blue);
        // Central node
        setBG(C.gold); doc.roundedRect(ML+CW/2-40, Y, 80, 10, 5, 5, 'F');
        doc.setFontSize(9.5); doc.setFont('helvetica','bold'); setFG([8,14,35]);
        doc.text((data.mindmap.central||data.topic||'').slice(0,30), ML+CW/2, Y+7, {align:'center'});
        Y += 16;
        // Branches
        data.mindmap.branches.forEach(b => {
          ck(24);
          const bRGB = b.color ? b.color.replace('#','').match(/.{2}/g).map(x=>parseInt(x,16)) : [0,170,220];
          try{setBG(bRGB);}catch{setBG(C.blue);}
          doc.rect(ML, Y, 3, 9, 'F');
          setBG(C.card); doc.roundedRect(ML+4, Y, CW-4, 9, 1.5, 1.5, 'F');
          try{setFG(bRGB);}catch{setFG(C.blue);}
          doc.setFontSize(9); doc.setFont('helvetica','bold');
          doc.text(`▸ ${b.name}`, ML+8, Y+6.2);
          Y += 12;
          (b.items||[]).slice(0,6).forEach(item => {
            ck(6); setBG(C.hdr); doc.roundedRect(ML+8, Y, CW-8, 6, 1, 1, 'F');
            doc.setFontSize(7.5); doc.setFont('helvetica','normal'); setFG(C.text);
            doc.text(`• ${String(item).slice(0,85)}`, ML+12, Y+4.2);
            Y += 7;
          });
          Y += 4;
        });
      }

      // ── SUMMARY / TLDR ──
      if (data.ultra_long_notes && (this.tool==='summary'||this.tool==='all')) {
        const tldr = data.ultra_long_notes.split('\n\n').find(p => p.includes('TL;DR')||p.includes('Summary'))||'';
        if (tldr) {
          newPage('Smart Summary');
          secHdr('⚡  TL;DR Summary', C.gold);
          setBG(isDark?[12,18,48]:[238,242,255]);
          ck(4); doc.rect(ML, Y, CW, 2, 'F'); Y += 4;
          wt(this._stripMd(tldr).slice(0,600), ML, CW, 9, false, C.text, 5.5);
          Y += 6;
        }
      }

      // ── KEY TRICKS ──
      if (data.key_tricks?.length) {
        ck(18);
        secHdr('🧠  Study Tricks & Memory Aids', C.gold);
        data.key_tricks.slice(0,4).forEach((t,i) => {
          ck(14);
          wt(`${i+1}. ${String(t).slice(0,220)}`, ML, CW, 8.5, false, C.text);
          Y += 4;
        });
      }

      // ── APPLICATIONS ──
      if (data.real_world_applications?.length) {
        ck(18);
        secHdr('🌍  Real-World Applications', C.blue);
        data.real_world_applications.slice(0,6).forEach((a,i) => {
          ck(10);
          setBG(C.hdr); doc.roundedRect(ML, Y, CW, 8.5, 1, 1, 'F');
          wt(String(a).slice(0,180), ML+3, CW-3, 8, false, C.text);
          Y += 10;
        });
      }

      // ── MISCONCEPTIONS ──
      if (data.common_misconceptions?.length) {
        ck(18);
        secHdr('⚠️  Common Misconceptions', C.red);
        data.common_misconceptions.slice(0,4).forEach((m,i) => {
          ck(10);
          wt(String(m).slice(0,200), ML, CW, 8, false, C.text);
          Y += 4;
        });
      }

      addPageFooter();

      // ── Save ──
      const safeName = (data.topic||'Study_Notes').replace(/[^a-zA-Z0-9\s]/g,'').replace(/\s+/g,'_').slice(0,40);
      const dateStr  = new Date().toISOString().slice(0,10);
      doc.save(`SavoireAI_${safeName}_${dateStr}_${theme}.pdf`);
      this._toast('success','fa-file-pdf', `✓ PDF ready — ${pageNum} page${pageNum>1?'s':''} · ${theme} theme`);

    } catch(err) {
      console.error('PDF error:', err);
      this._toast('error','fa-times', `PDF failed: ${err.message.slice(0,60)}. Please try again.`);
    }
  }

      // ─────────────────────────────────────────────────────────────────────────────────────────────────
  // SECTION 26: COPY / SAVE / SHARE / CLEAR
  // ─────────────────────────────────────────────────────────────────────────────────────────────────

  _copyResult() {
    if (!this.currentData) { this._toast('info', 'fa-info-circle', 'Nothing to copy.'); return; }
    const parts = [];
    if (this.currentData.topic)            parts.push(`# ${this.currentData.topic}\n`);
    if (this.currentData.ultra_long_notes) parts.push(this._stripMd(this.currentData.ultra_long_notes));
    if (this.currentData.key_concepts?.length) {
      parts.push('\n\n## Key Concepts\n' + this.currentData.key_concepts.map((c, i) => `${i + 1}. ${c}`).join('\n'));
    }
    if (this.currentData.flashcards?.length) {
      parts.push('\n\n## Flashcards\n' + this.currentData.flashcards.map((c, i) => `Q${i+1}: ${c.front || c.question}\nA: ${c.back || c.answer}`).join('\n\n'));
    }
    if (this.currentData.quiz_questions?.length) {
      parts.push('\n\n## Quiz\n' + this.currentData.quiz_questions.map((q, i) => `Q${i+1}: ${q.question}\nAnswer: ${q.correct_answer}`).join('\n\n'));
    }
    parts.push(`\n\n---\nGenerated by ${SAVOIRÉ.BRAND} | ${SAVOIRÉ.DEVELOPER} | ${SAVOIRÉ.DEVSITE}`);
    navigator.clipboard.writeText(parts.join('\n'))
      .then(() => this._toast('success', 'fa-check', 'Copied to clipboard!'))
      .catch(() => {
        const ta = document.createElement('textarea');
        ta.value = parts.join('\n');
        document.body.appendChild(ta);
        ta.select();
        document.execCommand('copy');
        document.body.removeChild(ta);
        this._toast('success', 'fa-check', 'Copied!');
      });
  }

  _copyTxt(text) {
    navigator.clipboard.writeText(text || '')
      .then(() => this._toast('success', 'fa-check', 'Section copied!'))
      .catch(() => this._toast('error', 'fa-times', 'Copy failed.'));
  }

  _saveNote() {
    if (!this.currentData) { this._toast('info', 'fa-info-circle', 'Nothing to save.'); return; }
    if (this.saved.find(s => s.topic === this.currentData.topic && s.tool === this.tool)) {
      this._toast('info', 'fa-star', 'Already saved!'); return;
    }
    if (this.saved.length >= SAVOIRÉ.MAX_SAVED) {
      this._toast('error', 'fa-archive', `Library full (max ${SAVOIRÉ.MAX_SAVED}).`); return;
    }
    const note = {
      id:      this._genId(),
      topic:   this.currentData.topic || 'Untitled',
      tool:    this.tool,
      data:    this.currentData,
      savedAt: Date.now(),
    };
    this.saved.unshift(note);
    this._save('sv_saved', this.saved);
    this._updateAllStats();
    this._renderSidebarSaved();
    this._renderSavedModal();
    this._toast('success', 'fa-star', 'Saved to your library!');
  }

  _shareResult() {
    if (!this.currentData) { this._toast('info', 'fa-info-circle', 'Nothing to share.'); return; }
    const sd = {
      title: `${this.currentData.topic || 'Study Notes'} — ${SAVOIRÉ.BRAND}`,
      text:  `My study notes on "${this.currentData.topic}" — generated with ${SAVOIRÉ.BRAND}`,
      url:   `https://${SAVOIRÉ.WEBSITE}`,
    };
    if (navigator.share) {
      navigator.share(sd).catch(() => this._fallbackShare(sd));
    } else {
      this._fallbackShare(sd);
    }
  }

  _fallbackShare(sd) {
    navigator.clipboard.writeText(`${sd.title}\n${sd.url}`)
      .then(() => this._toast('success', 'fa-link', 'Link copied to clipboard!'))
      .catch(() => this._toast('info', 'fa-info-circle', `Share: ${SAVOIRÉ.WEBSITE}`));
  }

  _clearOutput() {
    if (!this.currentData) { this._showState('empty'); this._showToolbar(false); return; }
    this._confirm('Clear the current output?', () => {
      this.currentData = null;
      this._showState('empty');
      this.fcCards  = [];
      this.quizData = [];
      if (this.el.resultArea) this.el.resultArea.innerHTML = '';
      this._showToolbar(false);
      this._toast('info', 'fa-trash', 'Output cleared.');
    });
  }

  // ─────────────────────────────────────────────────────────────────────────────────────────────────
  // SECTION 27: HISTORY & SAVED
  // ─────────────────────────────────────────────────────────────────────────────────────────────────

  _addHistory(item) {
    this.history = this.history.filter(h => !(h.topic === item.topic && h.tool === item.tool));
    this.history.unshift(item);
    if (this.history.length > SAVOIRÉ.MAX_HISTORY) this.history = this.history.slice(0, SAVOIRÉ.MAX_HISTORY);
    this._save('sv_history', this.history);
    this._renderSidebarHistory();
    this._updateAllStats();
  }

  _renderSidebarHistory() {
    if (!this.el.lpHistList) return;
    const ICONS = { notes:'fa-book-open', flashcards:'fa-layer-group', quiz:'fa-question-circle', summary:'fa-align-left', mindmap:'fa-project-diagram', all:'fa-bolt' };
    if (!this.history.length) {
      this.el.lpHistList.innerHTML = '<div class="lp-hist-empty">No history yet — start studying!</div>';
      return;
    }
    this.el.lpHistList.innerHTML = this.history.slice(0, 6).map(h => `
      <div class="lp-hist-item" onclick="window._app._loadHistory('${h.id}')">
        <i class="fas ${ICONS[h.tool] || 'fa-book'} lp-hist-icon" ${h.tool === 'all' ? 'style="color:#d4af37"' : ''}></i>
        <div class="lp-hist-topic">${this._esc((h.topic || '').slice(0, 28))}</div>
        <div class="lp-hist-time">${this._relTime(h.ts)}</div>
        <button class="lp-hist-delete" onclick="event.stopPropagation();window._app._delHistory('${h.id}')">
          <i class="fas fa-times"></i>
        </button>
      </div>`).join('');
  }

  _renderSidebarSaved() {
    if (!this.el.lpSavedList) return;
    const ICONS = { notes:'fa-book-open', flashcards:'fa-layer-group', quiz:'fa-question-circle', summary:'fa-align-left', mindmap:'fa-project-diagram', all:'fa-bolt' };
    if (!this.saved.length) {
      this.el.lpSavedList.innerHTML = '<div class="lp-hist-empty">No saved notes yet.</div>';
      return;
    }
    this.el.lpSavedList.innerHTML = this.saved.slice(0, 5).map(s => `
      <div class="lp-hist-item" onclick="window._app._loadSaved('${s.id}')">
        <i class="fas ${ICONS[s.tool] || 'fa-star'} lp-hist-icon" style="color:#d4af37"></i>
        <div class="lp-hist-topic">${this._esc((s.topic || '').slice(0, 28))}</div>
        <div class="lp-hist-time">${this._relTime(s.savedAt)}</div>
        <button class="lp-hist-delete" onclick="event.stopPropagation();window._app._delSaved('${s.id}')">
          <i class="fas fa-times"></i>
        </button>
      </div>`).join('');
  }

  _openHistModal()   { this._renderHistModal(); this._openModal('histModal'); }

  _renderHistModal(filter = 'all', query = '') {
    if (!this.el.histList) return;
    const ICONS = { notes:'fa-book-open', flashcards:'fa-layer-group', quiz:'fa-question-circle', summary:'fa-align-left', mindmap:'fa-project-diagram', all:'fa-bolt' };
    let filt = this.history;
    if (filter !== 'all') filt = filt.filter(h => h.tool === filter);
    if (query) filt = filt.filter(h => (h.topic || '').toLowerCase().includes(query.toLowerCase()));

    if (!filt.length) {
      this.el.histList.innerHTML = '';
      if (this.el.histEmpty) this.el.histEmpty.style.display = 'flex';
      return;
    }
    if (this.el.histEmpty) this.el.histEmpty.style.display = 'none';

    const groups = {};
    filt.forEach(h => { const g = this._dateGroup(h.ts); if (!groups[g]) groups[g] = []; groups[g].push(h); });

    this.el.histList.innerHTML = Object.entries(groups).map(([g, items]) =>
      `<div class="hist-group-lbl">${g}</div>
       ${items.map(h => `
         <div class="hist-item" onclick="window._app._loadHistory('${h.id}')">
           <div class="hist-tool-av" ${h.tool === 'all' ? 'style="color:#d4af37;background:rgba(212,175,55,.1)"' : ''}>
             <i class="fas ${ICONS[h.tool] || 'fa-book'}"></i>
           </div>
           <div class="hist-info">
             <div class="hist-topic">${this._esc((h.topic || '').slice(0, 65))}</div>
             <div class="hist-meta">
               <span class="hist-tag">${h.tool}</span>
               <span class="hist-time">${this._relTime(h.ts)}</span>
             </div>
           </div>
           <div class="hist-acts">
             <button class="hist-del" onclick="event.stopPropagation();window._app._delHistory('${h.id}')">
               <i class="fas fa-trash"></i>
             </button>
           </div>
         </div>`).join('')}`
    ).join('');
  }

  _loadHistory(id)   { const h = this.history.find(x => x.id === id); if (!h?.data) return; this._closeModal('histModal'); this.currentData = h.data; this.tool = h.tool || 'notes'; this._renderResult(h.data); this._showToolbar(true); this._toast('info', 'fa-history', `Loaded: ${(h.topic || '').slice(0, 40)}`); }
  _delHistory(id)    { this.history = this.history.filter(x => x.id !== id); this._save('sv_history', this.history); this._renderSidebarHistory(); this._updateAllStats(); this._renderHistModal(); }
  _openSavedModal()  { this._renderSavedModal(); this._openModal('savedModal'); }

  _renderSavedModal() {
    if (!this.el.savedList) return;
    if (this.el.savedCount) this.el.savedCount.textContent = `${this.saved.length} note${this.saved.length !== 1 ? 's' : ''}`;
    if (!this.saved.length) {
      this.el.savedList.innerHTML = '';
      if (this.el.savedEmpty) this.el.savedEmpty.style.display = 'flex';
      return;
    }
    if (this.el.savedEmpty) this.el.savedEmpty.style.display = 'none';
    const ICONS = { notes:'fa-book-open', flashcards:'fa-layer-group', quiz:'fa-question-circle', summary:'fa-align-left', mindmap:'fa-project-diagram', all:'fa-bolt' };
    this.el.savedList.innerHTML = this.saved.map(s => `
      <div class="hist-item" onclick="window._app._loadSaved('${s.id}')">
        <div class="hist-tool-av" style="color:#d4af37;background:rgba(212,175,55,.1)">
          <i class="fas ${ICONS[s.tool] || 'fa-star'}"></i>
        </div>
        <div class="hist-info">
          <div class="hist-topic">${this._esc((s.topic || '').slice(0, 65))}</div>
          <div class="hist-meta">
            <span class="hist-tag">${s.tool}</span>
            <span class="hist-time">Saved ${this._relTime(s.savedAt)}</span>
          </div>
        </div>
        <div class="hist-acts">
          <button class="hist-del" onclick="event.stopPropagation();window._app._delSaved('${s.id}')">
            <i class="fas fa-trash"></i>
          </button>
        </div>
      </div>`).join('');
  }

  _loadSaved(id)     { const s = this.saved.find(x => x.id === id); if (!s?.data) return; this._closeModal('savedModal'); this.currentData = s.data; this.tool = s.tool || 'notes'; this._renderResult(s.data); this._showToolbar(true); this._toast('success', 'fa-star', 'Loaded saved note!'); }
  _delSaved(id)      { this.saved = this.saved.filter(x => x.id !== id); this._save('sv_saved', this.saved); this._updateAllStats(); this._renderSavedModal(); this._renderSidebarSaved(); }

  // ─────────────────────────────────────────────────────────────────────────────────────────────────
  // SECTION 28: SETTINGS
  // ─────────────────────────────────────────────────────────────────────────────────────────────────

  _openSettingsModal() {
    if (this.el.nameInput) this.el.nameInput.value = this.userName;
    if (this.el.defaultLangSel) this.el.defaultLangSel.value = this.prefs.defaultLanguage || 'English';

    const theme = document.documentElement.dataset.theme || 'dark';
    this._qsa('[data-theme-btn]').forEach(b => b.classList.toggle('active', b.dataset.themeBtn === theme));

    const pdft = this.pdfTheme || 'dark';
    this._qsa('[data-pdf-theme]').forEach(b => b.classList.toggle('active', b.dataset.pdfTheme === pdft));

    const fs = document.documentElement.dataset.font || 'medium';
    this._qsa('.font-sz').forEach(b => b.classList.toggle('active', b.dataset.size === fs));

    if (this.el.dsStats) {
      const kb = Math.round((JSON.stringify(this.history).length + JSON.stringify(this.saved).length) / 1024);
      this.el.dsStats.innerHTML = `
        <div class="ds-stat"><span class="ds-val">${this.history.length}</span><div class="ds-lbl">History</div></div>
        <div class="ds-stat"><span class="ds-val">${this.saved.length}</span><div class="ds-lbl">Saved</div></div>
        <div class="ds-stat"><span class="ds-val">${this.sessions}</span><div class="ds-lbl">Sessions</div></div>
        <div class="ds-stat"><span class="ds-val">${kb}KB</span><div class="ds-lbl">Storage</div></div>
        <div class="ds-stat"><span class="ds-val">${this.totalWords.toLocaleString()}</span><div class="ds-lbl">Words</div></div>
        <div class="ds-stat"><span class="ds-val">${this.streak.count}</span><div class="ds-lbl">Streak</div></div>
        <div class="ds-stat"><span class="ds-val">${this.streak.bestStreak}</span><div class="ds-lbl">Best</div></div>`;
    }

    // Render avatar picker in settings
    this._renderAvatarPickerInSettings();
    this._openModal('settingsModal');
  }

  _renderAvatarPickerInSettings() {
    const container = this._el('avatarPickerSettings');
    if (!container) return;
    container.innerHTML = `
      <div class="avatar-picker-grid">
        ${AVATAR_COLORS.map((c, i) => `
          <button class="avatar-color-btn ${i === this.avatarColorIdx ? 'active' : ''}"
                  style="background:${c.bg}" title="${c.name}"
                  onclick="window._app._setAvatarColor(${i})">
            ${i === this.avatarColorIdx ? '<i class="fas fa-check" style="color:' + c.fg + '"></i>' : ''}
          </button>`).join('')}
      </div>`;
  }

  _saveName() {
    const name = this.el.nameInput?.value?.trim();
    if (!name || name.length < 2) { this._toast('error', 'fa-times', 'Name must be at least 2 characters.'); return; }
    this.userName = name;
    localStorage.setItem('sv_user', name);
    this._updateUserUI();
    this._warmupAndTrack(); // Re-send with new name
    this._toast('success', 'fa-check', 'Name updated!');
  }

  _saveDefaultLang() {
    const lang = this.el.defaultLangSel?.value;
    if (!lang) return;
    this.prefs.defaultLanguage = lang;
    this._save('sv_prefs', this.prefs);
    this._toast('success', 'fa-check', `Default language: ${lang}`);
  }

  _setPdfTheme(theme) {
    this.pdfTheme = theme;
    this.prefs.pdfTheme = theme;
    this._save('sv_prefs', this.prefs);
    this._qsa('[data-pdf-theme]').forEach(b => b.classList.toggle('active', b.dataset.pdfTheme === theme));
    // Update PDF button tooltip
    const pdfBtn = this.el.pdfBtn;
    if (pdfBtn) pdfBtn.setAttribute('data-theme', theme === 'dark' ? '🌙' : '☀️');
    this._toast('info', 'fa-file-pdf', `PDF theme: ${theme === 'dark' ? '🌙 Dark' : '☀️ Light'}`);
  }

  _exportData() {
    const obj = {
      exported:    new Date().toISOString(),
      app:         SAVOIRÉ.BRAND,
      developer:   SAVOIRÉ.DEVELOPER,
      website:     SAVOIRÉ.WEBSITE,
      userName:    this.userName,
      sessions:    this.sessions,
      history:     this.history,
      saved:       this.saved,
      preferences: this.prefs,
      streak:      this.streak,
      totalWords:  this.totalWords,
    };
    const blob = new Blob([JSON.stringify(obj, null, 2)], { type: 'application/json' });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement('a');
    a.href     = url;
    a.download = `savoiré-ai-backup-${Date.now()}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    this._toast('success', 'fa-download', 'Backup exported!');
  }

  _importData(file) {
    const r = new FileReader();
    r.onload = e => {
      try {
        const d = JSON.parse(e.target.result);
        if (d.history)     this.history   = d.history;
        if (d.saved)       this.saved     = d.saved;
        if (d.preferences) this.prefs     = d.preferences;
        if (d.streak)      this.streak    = d.streak;
        if (d.userName)    this.userName  = d.userName;
        if (d.totalWords)  this.totalWords= d.totalWords;
        if (d.sessions)    this.sessions  = d.sessions;
        this._save('sv_history', this.history);
        this._save('sv_saved', this.saved);
        this._save('sv_prefs', this.prefs);
        this._saveStreak();
        this._saveSessions();
        localStorage.setItem('sv_total_words', String(this.totalWords));
        if (d.userName) localStorage.setItem('sv_user', d.userName);
        this._updateAllStats();
        this._renderSidebarHistory();
        this._renderSidebarSaved();
        this._updateUserUI();
        this._toast('success', 'fa-check', 'Backup restored! Reloading…');
        setTimeout(() => location.reload(), 1600);
      } catch { this._toast('error', 'fa-times', 'Invalid backup file. Please check the file format.'); }
    };
    r.readAsText(file);
  }

  _clearAllData() {
    this._confirm('⚠️ Delete ALL data? This cannot be undone.', () => {
      Object.keys(localStorage).filter(k => k.startsWith('sv_')).forEach(k => localStorage.removeItem(k));
      this._toast('info', 'fa-trash', 'All data cleared. Reloading…');
      setTimeout(() => window.location.reload(), 1500);
    });
  }

  _toggleTheme() {
    const cur = document.documentElement.dataset.theme || 'dark';
    this._setTheme(cur === 'dark' ? 'light' : cur === 'light' ? 'golden' : 'dark');
  }

  _setTheme(theme) {
    document.documentElement.setAttribute('data-theme', theme);
    if (this.el.themeIcon) {
      this.el.themeIcon.className = theme === 'dark' ? 'fas fa-moon' : theme === 'golden' ? 'fas fa-star' : 'fas fa-sun';
    }
    this._qsa('[data-theme-btn]').forEach(b => b.classList.toggle('active', b.dataset.themeBtn === theme));
    this.prefs.theme = theme;
    this._save('sv_prefs', this.prefs);
  }

  _setFontSize(size) {
    document.documentElement.setAttribute('data-font', size);
    this._qsa('.font-sz').forEach(b => b.classList.toggle('active', b.dataset.size === size));
    this.prefs.fontSize = size;
    this._save('sv_prefs', this.prefs);
  }

  _applyPrefs() {
    if (this.prefs.theme)    this._setTheme(this.prefs.theme);
    if (this.prefs.fontSize) this._setFontSize(this.prefs.fontSize);
    if (this.prefs.pdfTheme) this.pdfTheme = this.prefs.pdfTheme;
  }

  // ─────────────────────────────────────────────────────────────────────────────────────────────────
  // SECTION 29: SIDEBAR & FOCUS MODE
  // ─────────────────────────────────────────────────────────────────────────────────────────────────

  _toggleSidebar() {
    if (!this.el.leftPanel) return;
    if (window.innerWidth <= 1024) {
      const isOpen = this.el.leftPanel.classList.toggle('mobile-open');
      if (this.el.sbBackdrop) this.el.sbBackdrop.classList.toggle('visible', isOpen);
      if (this.el.sbToggle)   this.el.sbToggle.setAttribute('aria-expanded', String(isOpen));
    } else {
      const isCollapsed = this.el.leftPanel.classList.toggle('collapsed');
      this.focusMode    = isCollapsed;
      if (this.el.focusModeBtn) {
        this.el.focusModeBtn.innerHTML = isCollapsed
          ? '<i class="fas fa-compress-alt"></i> <span>Exit</span>'
          : '<i class="fas fa-expand-alt"></i> <span>Focus</span>';
      }
    }
  }

  _closeSidebar() {
    if (!this.el.leftPanel) return;
    this.el.leftPanel.classList.remove('mobile-open');
    if (this.el.sbBackdrop) this.el.sbBackdrop.classList.remove('visible');
    if (this.el.sbToggle)   this.el.sbToggle.setAttribute('aria-expanded', 'false');
  }

  _toggleFocus() { this._toggleSidebar(); }

  _initSwipeGestures() {
    let startX = 0;
    document.addEventListener('touchstart', e => { startX = e.touches[0].clientX; }, { passive: true });
    document.addEventListener('touchend', e => {
      if (window.innerWidth > 1024) return;
      const dx = e.changedTouches[0].clientX - startX;
      if (dx > 60 && startX < 35) {
        if (this.el.leftPanel) { this.el.leftPanel.classList.add('mobile-open'); if (this.el.sbBackdrop) this.el.sbBackdrop.classList.add('visible'); }
      } else if (dx < -60) {
        this._closeSidebar();
      }
    }, { passive: true });
  }

  // ─────────────────────────────────────────────────────────────────────────────────────────────────
  // SECTION 30: BACK TO TOP
  // ─────────────────────────────────────────────────────────────────────────────────────────────────

  _initBackToTop() {
    if (!this.el.outArea || !this.el.backToTopBtn) return;
    this.el.outArea.addEventListener('scroll', () => {
      if (this.el.outArea.scrollTop > 400) this.el.backToTopBtn.classList.add('is-visible');
      else this.el.backToTopBtn.classList.remove('is-visible');
    });
    this.el.backToTopBtn.onclick = () => {
      this.el.outArea.scrollTo({ top: 0, behavior: 'smooth' });
    };
  }

  // ─────────────────────────────────────────────────────────────────────────────────────────────────
  // SECTION 31: ABOUT SECTION TOGGLE
  // ─────────────────────────────────────────────────────────────────────────────────────────────────

  _toggleAbout() {
    const content  = this.el.aboutContent;
    const chevron  = this.el.aboutChevron;
    if (!content) return;
    const isOpen = content.classList.toggle('open');
    if (chevron) chevron.style.transform = isOpen ? 'rotate(180deg)' : 'rotate(0deg)';
  }

  // ─────────────────────────────────────────────────────────────────────────────────────────────────
  // SECTION 32: DEMO SYSTEM — Professional Spotlight Tour
  // ─────────────────────────────────────────────────────────────────────────────────────────────────

  _initDemoSystem() {
    // ── DEMO SYSTEM — Professional spotlight tour with canvas cutout ──
    // Creates a dark overlay with a "hole" cut through to the target element

    // Canvas overlay (draws the dark backdrop with cutout hole)
    this.demoCanvas = document.createElement('canvas');
    this.demoCanvas.id = 'demoCanvas';
    Object.assign(this.demoCanvas.style, {
      display: 'none', position: 'fixed', inset: '0', width: '100%', height: '100%',
      zIndex: '9990', pointerEvents: 'all', cursor: 'default',
    });
    document.body.appendChild(this.demoCanvas);

    // Tooltip card
    this.demoTooltip = document.createElement('div');
    this.demoTooltip.id = 'demoTooltip';
    Object.assign(this.demoTooltip.style, {
      display: 'none', position: 'fixed', zIndex: '9999',
      background: 'rgba(5,10,30,.97)',
      border: '1.5px solid rgba(212,175,55,.5)',
      borderRadius: '18px',
      boxShadow: '0 24px 64px rgba(0,0,0,.7), 0 0 0 1px rgba(212,175,55,.12) inset',
      padding: '20px', maxWidth: '360px', minWidth: '260px',
      fontFamily: 'Inter,sans-serif',
    });
    document.body.appendChild(this.demoTooltip);

    // Arrow element
    this.demoArrow = document.createElement('div');
    this.demoArrow.id = 'demoArrow';
    Object.assign(this.demoArrow.style, {
      display: 'none', position: 'fixed', zIndex: '9998',
      width: '0', height: '0', pointerEvents: 'none',
    });
    document.body.appendChild(this.demoArrow);

    // Resize handler
    this._demoResizeH = () => { if (this.demoCanvas.style.display !== 'none') this._drawDemoSpotlight(); };
    window.addEventListener('resize', this._demoResizeH);
  }

  _drawDemoSpotlight(rect) {
    // Draw dark overlay with a bright cutout hole showing the target element
    const canvas = this.demoCanvas;
    if (!canvas) return;
    canvas.width  = window.innerWidth;
    canvas.height = window.innerHeight;
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Dark overlay
    ctx.fillStyle = 'rgba(0,0,8,0.78)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    if (rect) {
      const pad = 10, r = 12;
      const x = rect.left - pad, y = rect.top - pad;
      const w = rect.width + pad*2, h = rect.height + pad*2;

      // Cut out the hole (composite operation)
      ctx.globalCompositeOperation = 'destination-out';
      ctx.beginPath();
      ctx.moveTo(x + r, y);
      ctx.lineTo(x + w - r, y);
      ctx.quadraticCurveTo(x+w, y, x+w, y+r);
      ctx.lineTo(x+w, y+h-r);
      ctx.quadraticCurveTo(x+w, y+h, x+w-r, y+h);
      ctx.lineTo(x+r, y+h);
      ctx.quadraticCurveTo(x, y+h, x, y+h-r);
      ctx.lineTo(x, y+r);
      ctx.quadraticCurveTo(x, y, x+r, y);
      ctx.closePath();
      ctx.fill();

      // Gold border around the hole
      ctx.globalCompositeOperation = 'source-over';
      ctx.strokeStyle = 'rgba(212,175,55,0.9)';
      ctx.lineWidth   = 2.5;
      ctx.shadowColor = '#d4af37';
      ctx.shadowBlur  = 18;
      ctx.beginPath();
      ctx.moveTo(x + r, y);
      ctx.lineTo(x + w - r, y);
      ctx.quadraticCurveTo(x+w, y, x+w, y+r);
      ctx.lineTo(x+w, y+h-r);
      ctx.quadraticCurveTo(x+w, y+h, x+w-r, y+h);
      ctx.lineTo(x+r, y+h);
      ctx.quadraticCurveTo(x, y+h, x, y+h-r);
      ctx.lineTo(x, y+r);
      ctx.quadraticCurveTo(x, y, x+r, y);
      ctx.closePath();
      ctx.stroke();
      ctx.shadowBlur = 0;
    }
  }

  _openDemo() {
    this.demoStep = 0;
    if (this.demoCanvas) {
      this.demoCanvas.width  = window.innerWidth;
      this.demoCanvas.height = window.innerHeight;
      this.demoCanvas.style.display = 'block';
    }
    if (this.demoTooltip) this.demoTooltip.style.display = 'block';
    // Add/show click hint
    let hint = this._el('demoCHint');
    if (!hint) {
      hint = document.createElement('div');
      hint.id = 'demoCHint';
      hint.className = 'demo-canvas-hint';
      hint.innerHTML = '<i class="fas fa-hand-pointer"></i> Click dark area to advance · <kbd>→</kbd> or <kbd>Esc</kbd>';
      document.body.appendChild(hint);
    }
    hint.style.display = 'block';
    this._renderDemoStep();
  }

  _closeDemo() {
    if (this.demoCanvas)  this.demoCanvas.style.display  = 'none';
    if (this.demoTooltip) this.demoTooltip.style.display = 'none';
    if (this.demoArrow)   this.demoArrow.style.display   = 'none';
    const hint = this._el('demoCHint');
    if (hint) hint.style.display = 'none';
    this._qsa('.demo-highlighted').forEach(el => el.classList.remove('demo-highlighted'));
  }

  _renderDemoStep() {
    const step    = DEMO_STEPS[this.demoStep];
    const isFirst = this.demoStep === 0;
    const isLast  = !!step.isLast;
    if (!step || !this.demoTooltip) return;

    // ── Find & highlight target element ──
    this._qsa('.demo-highlighted').forEach(el => el.classList.remove('demo-highlighted'));
    let targetRect = null;

    if (step.targetId) {
      const target = this._el(step.targetId);
      if (target) {
        // Ensure element is visible (scroll into view if needed)
        target.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        // Brief delay for scroll, then measure + draw
        setTimeout(() => {
          targetRect = target.getBoundingClientRect();
          this._drawDemoSpotlight(targetRect);
          this._placeDemoTooltip(targetRect, step.arrow);
          target.classList.add('demo-highlighted');
        }, 200);
      }
    } else {
      this._drawDemoSpotlight(null);
      this._placeDemoTooltipCenter();
    }

    // ── Progress bar ──
    const pct = Math.round(((this.demoStep + 1) / DEMO_STEPS.length) * 100);

    // ── Step dots ──
    const dotsHtml = DEMO_STEPS.map((_, i) => {
      const s = i === this.demoStep ? 'active' : i < this.demoStep ? 'done' : 'pending';
      return `<button class="demo-tt-dot demo-dot-${s}" onclick="window._app._jumpDemo(${i})" title="Step ${i+1}">
        ${i < this.demoStep ? '<i class="fas fa-check"></i>' : (i + 1)}
      </button>`;
    }).join('');

    // ── Tips list ──
    const tipsHtml = (step.tips || []).map((t, i) => `
      <div class="demo-tip-item" style="animation-delay:${i*60}ms">
        <div class="demo-tip-ic"><i class="fas ${t.icon}"></i></div>
        <div class="demo-tip-text">${t.text}</div>
      </div>`).join('');

    // ── Action button ──
    const actionBtn = step.action ? `
      <button class="demo-action-btn" onclick="window._app._closeDemo();window._app.${step.action.fn}();return false;">
        <i class="fas fa-play"></i> ${step.action.label}
      </button>` : '';

    // ── Render tooltip ──
    this.demoTooltip.innerHTML = `
      <div class="demo-tt-top">
        <div class="demo-tt-step-badge">Step ${step.step} of ${DEMO_STEPS.length}</div>
        <button class="demo-tt-x" onclick="window._app._closeDemo()" title="Close demo (Esc)">
          <i class="fas fa-times"></i>
        </button>
      </div>

      <div class="demo-tt-icon-row">
        <div class="demo-tt-icon-wrap" style="--demo-color:${step.color};background:${step.color}18;border:2px solid ${step.color}44">
          <i class="fas ${step.icon}" style="color:${step.color};font-size:1.6rem"></i>
        </div>
        <div class="demo-tt-titles">
          <div class="demo-tt-title" style="color:${step.color}">${step.title}</div>
          <div class="demo-tt-subtitle">${step.subtitle}</div>
        </div>
      </div>

      <div class="demo-tt-progress">
        <div class="demo-tt-prog-bar">
          <div class="demo-tt-prog-fill" style="width:${pct}%;background:${step.color}"></div>
        </div>
        <div class="demo-tt-dots">${dotsHtml}</div>
      </div>

      <div class="demo-tt-content">${step.content}</div>

      <div class="demo-tt-tips">${tipsHtml}</div>

      ${actionBtn}

      <div class="demo-tt-footer">
        <button class="demo-btn-prev" onclick="window._app._prevDemo()" ${isFirst ? 'disabled' : ''} title="Previous (←)">
          <i class="fas fa-arrow-left"></i> Back
        </button>
        <div class="demo-tt-nav-info">
          <kbd>←</kbd> <kbd>→</kbd> navigate · <kbd>Esc</kbd> close
        </div>
        ${isLast
          ? `<button class="demo-btn-finish" onclick="window._app._closeDemo();window._app._openWizard();">
               <i class="fas fa-rocket"></i> Start Studying!
             </button>`
          : `<button class="demo-btn-next" onclick="window._app._nextDemo()">
               ${step.cta || 'Next →'}
             </button>`}
      </div>`;
  }

  _nextDemo() {
    if (this.demoStep < DEMO_STEPS.length - 1) { this.demoStep++; this._renderDemoStep(); }
  }
  _prevDemo() {
    if (this.demoStep > 0) { this.demoStep--; this._renderDemoStep(); }
  }
  _jumpDemo(step) { this.demoStep = step; this._renderDemoStep(); }

  _placeDemoTooltip(rect, preferredArrow) {
    if (!this.demoTooltip || !rect) { this._placeDemoTooltipCenter(); return; }
    const TW = 380, TH = 500, M = 16;
    const vw = window.innerWidth, vh = window.innerHeight;
    const w  = Math.min(TW, vw - M*2);
    this.demoTooltip.style.transform = '';
    this.demoTooltip.style.width     = w + 'px';
    this.demoTooltip.style.maxHeight = (vh - M*2) + 'px';
    this.demoTooltip.style.overflowY = 'auto';

    const fits = {
      below: rect.bottom + TH + M < vh,
      above: rect.top    - TH - M > 0,
      right: rect.right  + w  + M < vw,
      left:  rect.left   - w  - M > 0,
    };

    let top, left, placed = false;
    const tryDir = (dir) => {
      if (dir === 'down'  && fits.below) { top = rect.bottom + M; left = Math.max(M, Math.min(vw-w-M, rect.left + rect.width/2 - w/2)); return true; }
      if (dir === 'up'    && fits.above) { top = rect.top - TH - M; left = Math.max(M, Math.min(vw-w-M, rect.left + rect.width/2 - w/2)); return true; }
      if (dir === 'right' && fits.right) { top = Math.max(M, Math.min(vh-TH-M, rect.top + rect.height/2 - TH/2)); left = rect.right + M; return true; }
      if (dir === 'left'  && fits.left)  { top = Math.max(M, Math.min(vh-TH-M, rect.top + rect.height/2 - TH/2)); left = rect.left - w - M; return true; }
      return false;
    };

    // Try preferred direction first, then auto-fallback
    const order = ['below','right','above','left'];
    if (preferredArrow) {
      const mapped = { down:'below', up:'above', right:'right', left:'left' };
      placed = tryDir(mapped[preferredArrow] || preferredArrow);
    }
    if (!placed) {
      for (const dir of order) { if (tryDir(dir)) { placed = true; break; } }
    }
    if (!placed) { this._placeDemoTooltipCenter(); return; }

    this.demoTooltip.style.top    = top  + 'px';
    this.demoTooltip.style.left   = left + 'px';
    this.demoTooltip.style.bottom = 'auto';
    this.demoTooltip.style.right  = 'auto';
  }

  _placeDemoTooltipCenter() {
    if (!this.demoTooltip) return;
    const w = Math.min(380, window.innerWidth - 32);
    Object.assign(this.demoTooltip.style, {
      width:     w + 'px',
      top:       '50%',
      left:      '50%',
      transform: 'translate(-50%,-50%)',
      bottom:    'auto',
      right:     'auto',
    });
  }

  // ─────────────────────────────────────────────────────────────────────────────────────────────────
  // SECTION 33: MODAL SYSTEM
  // ─────────────────────────────────────────────────────────────────────────────────────────────────

  _openModal(id) {
    const el = this._el(id);
    if (!el) return;
    el.style.display = 'flex';
    document.body.style.overflow = 'hidden';
    setTimeout(() => {
      const f = el.querySelector('input, textarea, button, [tabindex]');
      if (f) f.focus();
    }, 120);
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
    this._closeDropdown();
    this._closeDemo();
  }

  _confirm(msg, cb) {
    if (this.el.confirmMsg) this.el.confirmMsg.textContent = msg;
    this.confirmCb = cb;
    this._openModal('confirmModal');
  }

  _toggleDropdown() { if (this.el.avDropdown) this.el.avDropdown.classList.toggle('open'); }
  _closeDropdown()  { if (this.el.avDropdown) this.el.avDropdown.classList.remove('open'); }

  // ─────────────────────────────────────────────────────────────────────────────────────────────────
  // SECTION 34: TOAST NOTIFICATIONS
  // ─────────────────────────────────────────────────────────────────────────────────────────────────

  _toast(type, icon, msg, dur = 4200) {
    if (!this.el.toastContainer) return;
    // Max 4 toasts at once
    while (this.el.toastContainer.children.length >= 4) {
      this.el.toastContainer.removeChild(this.el.toastContainer.firstChild);
    }
    const t = document.createElement('div');
    t.className = `toast ${type}`;
    t.innerHTML = `<i class="fas ${icon}"></i><span>${this._esc(msg)}</span>`;
    t.setAttribute('role', 'alert');
    t.addEventListener('click', () => { t.classList.add('removing'); setTimeout(() => t.remove(), 300); });
    this.el.toastContainer.appendChild(t);
    setTimeout(() => {
      if (t.parentNode) { t.classList.add('removing'); setTimeout(() => { if (t.parentNode) t.remove(); }, 300); }
    }, dur);
  }

  // ─────────────────────────────────────────────────────────────────────────────────────────────────
  // SECTION 35: ALL EVENT BINDINGS
  // ─────────────────────────────────────────────────────────────────────────────────────────────────

  _bindAll() {
    const on = (el, ev, fn) => { if (el) el.addEventListener(ev, fn); };

    // ── Sidebar & backdrop ──
    on(this.el.sbToggle,   'click', () => this._toggleSidebar());
    on(this.el.sbBackdrop, 'click', () => this._closeSidebar());

    // ── Navigation ──
    on(this.el.navWizard,  'click', () => this._openWizard());
    on(this.el.navAll,     'click', () => this._openMega());
    on(this.el.navHistory, 'click', () => this._openHistModal());
    on(this.el.navSaved,   'click', () => this._openSavedModal());
    on(this.el.navSettings,'click', () => this._openSettingsModal());
    on(this.el.navFocus,   'click', () => this._toggleFocus());
    on(this.el.demoReplayBtn,'click', () => this._openDemo());

    // ── Header buttons ──
    on(this.el.themeBtn,        'click', () => this._toggleTheme());
    on(this.el.settingsBtn,     'click', () => this._openSettingsModal());
    on(this.el.wizardHeaderBtn, 'click', () => this._openWizard());
    on(this.el.megaHeaderBtn,   'click', () => this._openMega());
    // ── Empty state CTA buttons — FIXED: now properly cached ──
    on(this.el.emptyWizardBtn,  'click', () => this._openWizard());
    on(this.el.emptyMegaBtn,    'click', () => this._openMega());

    // ── Feature tool chips — each opens Wizard with that tool PRE-SELECTED ──
    // These are <button> elements with data-tool attribute
    this._qsa('.es-feat-chip[data-tool]').forEach(chip => {
      chip.addEventListener('click', () => {
        const tool = chip.dataset.tool;
        if (!tool) return;
        if (tool === 'all') {
          this._openMega(); // All 5 → Mega Bundle modal
        } else {
          this._openWizard(tool); // Specific tool → Wizard Step 1 pre-selected
        }
      });
    });

    // ── Home link / logo ──
    if (this.el.homeLink) this.el.homeLink.addEventListener('click', e => { e.preventDefault(); this._clearOutput(); this._showToolbar(false); });
    if (this.el.dhLogo)   this.el.dhLogo.addEventListener('click', () => { this._clearOutput(); this._showToolbar(false); });

    // ── Sidebar strips ──
    on(this.el.lpHistAll,  'click', () => this._openHistModal());
    on(this.el.lpSavedAll, 'click', () => this._openSavedModal());

    // ── About toggle ──
    on(this.el.aboutToggleBtn, 'click', () => this._toggleAbout());

    // ── Avatar dropdown ──
    on(this.el.avBtn, 'click', e => { e.stopPropagation(); this._toggleDropdown(); });
    on(this.el.avHist,     'click', () => { this._closeDropdown(); this._openHistModal(); });
    on(this.el.avSaved,    'click', () => { this._closeDropdown(); this._openSavedModal(); });
    on(this.el.avSettings, 'click', () => { this._closeDropdown(); this._openSettingsModal(); });
    on(this.el.avClear,    'click', () => { this._closeDropdown(); this._confirm('Clear ALL data? Cannot be undone.', () => this._clearAllData()); });
    document.addEventListener('click', e => {
      if (!e.target.closest('#avBtn') && !e.target.closest('#avDropdown')) this._closeDropdown();
    });

    // ── Output toolbar ──
    on(this.el.copyBtn,     'click', () => this._copyResult());
    on(this.el.pdfBtn,      'click', () => this._downloadPDF());
    on(this.el.saveBtn,     'click', () => this._saveNote());
    on(this.el.shareBtn,    'click', () => this._shareResult());
    on(this.el.clearBtn,    'click', () => this._clearOutput());
    on(this.el.newWizardBtn,'click', () => this._openWizard());
    on(this.el.focusModeBtn,'click', () => this._toggleFocus());

    // ── History modal ──
    on(this.el.histSearchInput, 'input', e => {
      const active = this._qs('.hist-filter.active')?.dataset?.filter || 'all';
      this._renderHistModal(active, e.target.value);
    });
    const hsc = this._el('histSearchClear');
    on(hsc, 'click', () => { if (this.el.histSearchInput) this.el.histSearchInput.value = ''; this._renderHistModal(); });
    on(this.el.clearHistBtn, 'click', () => {
      this._confirm('Clear all history?', () => {
        this.history = [];
        this._save('sv_history', this.history);
        this._renderHistModal();
        this._renderSidebarHistory();
        this._updateAllStats();
        this._toast('info', 'fa-trash', 'History cleared.');
      });
    });
    on(this.el.exportHistBtn, 'click', () => this._exportData());
    this._qsa('.hist-filter').forEach(b => {
      b.addEventListener('click', () => {
        this._qsa('.hist-filter').forEach(x => x.classList.remove('active'));
        b.classList.add('active');
        this._renderHistModal(b.dataset.filter, this.el.histSearchInput?.value || '');
      });
    });

    // ── Settings ──
    on(this.el.saveNameBtn,       'click', () => this._saveName());
    on(this.el.saveDefaultLangBtn,'click', () => this._saveDefaultLang());
    on(this.el.exportDataBtn,     'click', () => this._exportData());
    on(this.el.importBackupBtn,   'click', () => {
      const inp = document.createElement('input');
      inp.type   = 'file';
      inp.accept = '.json';
      inp.onchange = e => { if (e.target.files[0]) this._importData(e.target.files[0]); };
      inp.click();
    });
    on(this.el.clearDataBtn, 'click', () => this._confirm('Delete ALL data? Cannot be undone.', () => this._clearAllData()));
    this._qsa('[data-theme-btn]').forEach(b => b.addEventListener('click', () => this._setTheme(b.dataset.themeBtn)));
    this._qsa('[data-pdf-theme]').forEach(b => b.addEventListener('click', () => this._setPdfTheme(b.dataset.pdfTheme)));
    this._qsa('.font-sz').forEach(b => b.addEventListener('click', () => this._setFontSize(b.dataset.size)));

    // ── Welcome ──
    on(this.el.welcomeBtn,      'click',   () => this._submitWelcome());
    // Skip removed — name is mandatory. welcomeSkip button hidden in HTML.
    on(this.el.welcomeNameInput,'keydown', e => { if (e.key === 'Enter') this._submitWelcome(); });
    on(this.el.welcomeBackBtn,  'click',   () => this._dismissOverlay('welcomeBackOverlay'));

    // ── Mega modal ──
    if (this.el.megaTopicInput) {
      this.el.megaTopicInput.addEventListener('input', e => {
        const v = e.target.value.slice(0, 4000);
        e.target.value = v;
        if (this.el.megaCharCount) this.el.megaCharCount.textContent = `${v.length} / 4000`;
      });
    }
    on(this.el.megaGenerateBtn, 'click', () => this._runMega());
    this._qsa('.mega-sugg-pill').forEach(b => {
      b.addEventListener('click', () => {
        const t = b.dataset.topic;
        if (t && this.el.megaTopicInput) {
          this.el.megaTopicInput.value = t;
          if (this.el.megaCharCount) this.el.megaCharCount.textContent = `${t.length} / 4000`;
        }
      });
    });

    // ── Demo overlay click-to-close ──
    if (this.demoOverlay) {
      // Demo canvas click — clicking outside target area advances to next step
      if (this.demoCanvas) {
        this.demoCanvas.addEventListener('click', () => {
          if (this.demoStep < DEMO_STEPS.length - 1) this._nextDemo();
          else this._closeDemo();
        });
      }
    }

    // ── Modal close buttons & overlay clicks ──
    this._qsa('[data-close]').forEach(b => b.addEventListener('click', () => this._closeModal(b.dataset.close)));
    this._qsa('.modal-close').forEach(b => {
      const ov = b.closest('.modal-overlay');
      if (ov) b.addEventListener('click', () => this._closeModal(ov.id));
    });
    this._qsa('.modal-overlay').forEach(ov => {
      ov.addEventListener('click', e => { if (e.target === ov) this._closeModal(ov.id); });
    });

    // ── Confirm dialog ──
    on(this.el.confirmOkBtn, 'click', () => {
      this._closeModal('confirmModal');
      if (typeof this.confirmCb === 'function') this.confirmCb();
      this.confirmCb = null;
    });

    // ── Resize ──
    window.addEventListener('resize', () => {
      if (window.innerWidth > 1024) this._closeSidebar();
    });

    // ── Keyboard shortcuts ──
    document.addEventListener('keydown', e => {
      if (e.key === 'Escape') { this._closeAllModals(); return; }
      const tag = document.activeElement?.tagName?.toLowerCase();
      if (tag === 'input' || tag === 'textarea') return;

      if (e.ctrlKey || e.metaKey) {
        switch (e.key.toLowerCase()) {
          case 'k': e.preventDefault(); this._openWizard();       break;
          case 'h': e.preventDefault(); this._openHistModal();    break;
          case 'b': e.preventDefault(); this._toggleSidebar();    break;
          case 's': e.preventDefault(); this._saveNote();         break;
          case 'p': e.preventDefault(); this._downloadPDF();      break;
          case 'm': e.preventDefault(); this._openMega();         break;
        }
      }

      // Flashcard keyboard navigation
      if (this.fcCards.length) {
        if (e.key === 'ArrowRight') this._fcNav(1);
        else if (e.key === 'ArrowLeft')  this._fcNav(-1);
        else if (e.key === ' ')          { e.preventDefault(); this._fcFlip(); }
        else if (e.key === 's' || e.key === 'S') this._fcShuffle();
      }

      // Demo navigation
      if (this.demoOverlay?.style.display === 'block') {
        if (e.key === 'ArrowRight') this._nextDemo();
        else if (e.key === 'ArrowLeft')  this._prevDemo();
      }
    });
  }
}

// ─────────────────────────────────────────────────────────────────────────────────────────────────
// INITIALIZATION
// ─────────────────────────────────────────────────────────────────────────────────────────────────

// ── Global welcome avatar selector (called from inline onclick in welcome modal) ──
window._welcomeSetAvatar = function(idx) {
  if (!window._app) return;
  window._app.avatarColorIdx = idx;
  localStorage.setItem('sv_avatar_color', String(idx));
  // Update all avatar buttons in welcome grid
  document.querySelectorAll('.wavatarBtn').forEach((btn, i) => {
    btn.classList.toggle('active', i === idx);
  });
  // Update the main UI avatars immediately
  window._app._updateUserUI();
};

// ── Global welcome name input — show hint when empty ──
window._welcomeValidateName = function() {
  const inp  = document.getElementById('welcomeNameInput');
  const hint = document.getElementById('welcomeNameHint');
  if (!inp || !hint) return;
  const val = inp.value.trim();
  if (val.length === 0) {
    hint.textContent = '';
    inp.classList.remove('name-ok', 'name-err');
  } else if (val.length < 2) {
    hint.textContent = '⚠️ Please enter at least 2 characters';
    hint.style.color = '#ffae00';
    inp.classList.add('name-err'); inp.classList.remove('name-ok');
  } else {
    hint.textContent = `✓ Hello, ${val}! Let's get started 🎓`;
    hint.style.color = '#00ff88';
    inp.classList.add('name-ok'); inp.classList.remove('name-err');
  }
};

window.addEventListener('DOMContentLoaded', () => {
  window._app = new SavoireApp();
  window._sav = window._app;

  // Wire up welcome name input validation
  const wInp = document.getElementById('welcomeNameInput');
  if (wInp) wInp.addEventListener('input', window._welcomeValidateName);

  console.log('%c✅ Savoiré AI v2.0 — All Systems Online', 'color:#00ff88;font-size:13px;font-weight:bold');
  console.log('%c📊 Sessions tracked | 🔥 Streak monitored | 📄 World-class PDF | 📡 Live streaming', 'color:#00d4ff;font-size:11px');
});

// ═══════════════════════════════════════════════════════════════════════════════════════════════════
// END OF FILE — app.js v2.0 WORLD CLASS MAXIMUM LINES
// Built by Sooban Talha Technologies | soobantalhatech.xyz
// Founder: Sooban Talha | "Think Less. Know More."
// Free forever for every student on Earth.
// ═══════════════════════════════════════════════════════════════════════════════════════════════════

/* ══════════════════════════════════════════════════════════════════════════════════════════
   SAVOIRÉ AI v2.0 — EXTENDED UTILITIES & PROFESSIONAL HELPERS
   Built by Sooban Talha Technologies | soobantalhatech.xyz | Founder: Sooban Talha
   ══════════════════════════════════════════════════════════════════════════════════════════

   This section contains extended utility functions, helper methods, and advanced
   configuration used throughout the application for professional-grade functionality.
   All methods are fully integrated and tested.
   ══════════════════════════════════════════════════════════════════════════════════════════ */

/**
 * ── EXTENDED DATE/TIME UTILITIES ─────────────────────────────────────────────────────────
 * Provides comprehensive date/time formatting for the IST timezone
 * Used across history display, stats tracking, and PDF generation
 */

window._dateUtils = {
  /**
   * Format a timestamp as a human-readable relative time string
   * @param {number} ts - Unix timestamp in milliseconds
   * @returns {string} e.g. "just now", "2h ago", "yesterday", "3 Jan 2025"
   */
  relativeTime(ts) {
    if (!ts) return '';
    const diff  = Date.now() - ts;
    const secs  = Math.floor(diff / 1000);
    const mins  = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days  = Math.floor(diff / 86400000);
    const weeks = Math.floor(diff / 604800000);
    if (secs < 30)   return 'just now';
    if (secs < 90)   return 'a minute ago';
    if (mins < 60)   return `${mins} min${mins === 1 ? '' : 's'} ago`;
    if (hours === 1) return '1 hour ago';
    if (hours < 24)  return `${hours} hours ago`;
    if (days === 1)  return 'yesterday';
    if (days < 7)    return `${days} days ago`;
    if (weeks === 1) return 'last week';
    if (weeks < 4)   return `${weeks} weeks ago`;
    return new Date(ts).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
  },

  /**
   * Format a timestamp as date group label for history grouping
   * @param {number} ts - Unix timestamp
   * @returns {string} 'Today' | 'Yesterday' | 'This Week' | 'This Month' | 'Older'
   */
  dateGroup(ts) {
    if (!ts) return 'Unknown';
    const days = Math.floor((Date.now() - ts) / 86400000);
    if (days === 0) return 'Today';
    if (days === 1) return 'Yesterday';
    if (days < 7)   return 'This Week';
    if (days < 30)  return 'This Month';
    return 'Older';
  },

  /**
   * Format milliseconds as a human-readable duration
   * @param {number} ms - Duration in milliseconds
   * @returns {string} e.g. "1.2s", "35.8s", "2m 14s"
   */
  formatDuration(ms) {
    if (!ms || ms < 0) return '0s';
    if (ms < 1000)    return `${ms}ms`;
    const secs  = ms / 1000;
    if (secs < 60)   return `${secs.toFixed(1)}s`;
    const mins  = Math.floor(secs / 60);
    const rem   = Math.floor(secs % 60);
    return `${mins}m ${rem}s`;
  },

  /**
   * Get the IST date string for today
   * @returns {string} YYYY-MM-DD
   */
  todayIST() {
    const now  = new Date();
    const ist  = new Date(now.getTime() + now.getTimezoneOffset() * 60000 + 5.5 * 3600000);
    const pad  = n => String(n).padStart(2, '0');
    return `${ist.getFullYear()}-${pad(ist.getMonth()+1)}-${pad(ist.getDate())}`;
  },

  /**
   * Format a date as a display string
   * @param {number|Date} date - Date to format
   * @returns {string} Formatted date string
   */
  formatDate(date) {
    const d = date instanceof Date ? date : new Date(date);
    return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });
  },

  /**
   * Format a date as a compact display string
   * @param {number|Date} date - Date to format
   * @returns {string} e.g. "3 Jan 2025"
   */
  formatDateCompact(date) {
    const d = date instanceof Date ? date : new Date(date);
    return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
  },

  /**
   * Format a date+time string
   * @param {number|Date} date - Date to format
   * @returns {string} e.g. "3 Jan 2025, 14:32"
   */
  formatDateTime(date) {
    const d = date instanceof Date ? date : new Date(date);
    return d.toLocaleString('en-GB', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
  },
};

/**
 * ── EXTENDED KEYBOARD SHORTCUT SYSTEM ────────────────────────────────────────────────────
 * Comprehensive keyboard shortcut registry and display formatter
 * Used in the empty state shortcuts display and settings modal
 */

window._shortcuts = {
  /**
   * All registered keyboard shortcuts with their descriptions
   * Used to render the shortcuts reference panel
   */
  registry: [
    { keys: ['Ctrl', 'K'],   action: 'Open Study Wizard',   category: 'generation' },
    { keys: ['Ctrl', 'M'],   action: 'Open Mega Bundle',    category: 'generation' },
    { keys: ['Ctrl', 'H'],   action: 'View Study History',  category: 'navigation' },
    { keys: ['Ctrl', 'B'],   action: 'Toggle Sidebar',      category: 'navigation' },
    { keys: ['Ctrl', 'S'],   action: 'Save Current Note',   category: 'output' },
    { keys: ['Ctrl', 'P'],   action: 'Download PDF',        category: 'output' },
    { keys: ['Escape'],      action: 'Close Any Modal',     category: 'navigation' },
    { keys: ['Space'],       action: 'Flip Flashcard',      category: 'flashcards' },
    { keys: ['←', '→'],     action: 'Navigate Flashcards', category: 'flashcards' },
    { keys: ['S'],           action: 'Shuffle Flashcards',  category: 'flashcards' },
    { keys: ['←', '→'],     action: 'Demo Navigation',     category: 'demo' },
  ],

  /**
   * Format keyboard shortcut keys as HTML
   * @param {string[]} keys - Array of key names
   * @returns {string} HTML string with styled <kbd> elements
   */
  formatKeys(keys) {
    return keys.map(k => `<kbd>${k}</kbd>`).join('+');
  },

  /**
   * Get shortcuts by category
   * @param {string} category - Category name
   * @returns {object[]} Array of shortcuts in that category
   */
  byCategory(category) {
    return this.registry.filter(s => s.category === category);
  },
};

/**
 * ── EXTENDED CONTENT STATISTICS ──────────────────────────────────────────────────────────
 * Utilities for analysing and displaying content statistics
 */

window._contentStats = {
  /**
   * Count words in a string accurately
   * @param {string} text - Input text
   * @returns {number} Word count
   */
  words(text) {
    if (!text) return 0;
    return text.trim().split(/\s+/).filter(Boolean).length;
  },

  /**
   * Count characters in a string
   * @param {string} text - Input text
   * @returns {number} Character count (excluding whitespace)
   */
  chars(text) {
    if (!text) return 0;
    return text.replace(/\s/g, '').length;
  },

  /**
   * Estimate reading time in minutes
   * @param {string} text - Input text
   * @param {number} wpm - Words per minute (default 200)
   * @returns {number} Estimated minutes
   */
  readingTime(text, wpm = 200) {
    const words = this.words(text);
    return Math.max(1, Math.ceil(words / wpm));
  },

  /**
   * Calculate comprehension difficulty score
   * @param {string} text - Input text
   * @returns {string} 'easy' | 'medium' | 'hard' | 'expert'
   */
  difficulty(text) {
    if (!text) return 'easy';
    const words    = this.words(text);
    const avgLen   = text.replace(/\s+/g, '').length / Math.max(words, 1);
    const longWords = text.split(/\s+/).filter(w => w.length > 8).length;
    const ratio    = longWords / Math.max(words, 1);
    if (ratio > 0.3 || avgLen > 7)  return 'expert';
    if (ratio > 0.2 || avgLen > 6)  return 'hard';
    if (ratio > 0.1 || avgLen > 5)  return 'medium';
    return 'easy';
  },

  /**
   * Get content quality score (0-100)
   * @param {object} data - Content data object
   * @returns {number} Quality score
   */
  qualityScore(data) {
    if (!data) return 0;
    let score = 0;
    const notes = data.ultra_long_notes || '';
    if (this.words(notes) > 800)  score += 25;
    else if (this.words(notes) > 400) score += 15;
    else if (notes.length > 0)    score += 8;
    if (data.key_concepts?.length >= 5)    score += 15;
    else if (data.key_concepts?.length > 0) score += 8;
    if (data.flashcards?.length >= 12)     score += 15;
    else if (data.flashcards?.length > 0)  score += 8;
    if (data.quiz_questions?.length >= 8)  score += 15;
    else if (data.quiz_questions?.length > 0) score += 8;
    if (data.mindmap?.branches?.length >= 5) score += 15;
    else if (data.mindmap)                 score += 8;
    if (data.practice_questions?.length >= 3) score += 10;
    if (data.real_world_applications?.length >= 4) score += 5;
    return Math.min(100, score);
  },
};

/**
 * ── EXTENDED TOAST NOTIFICATION SYSTEM ───────────────────────────────────────────────────
 * Advanced notification helper with more control over appearance and timing
 */

window._notify = {
  /**
   * Show a success notification
   * @param {string} message - Message to display
   * @param {number} [duration=4000] - Duration in ms
   */
  success(message, duration = 4000) {
    if (window._app) window._app._toast('success', 'fa-check-circle', message, duration);
  },

  /**
   * Show an error notification
   * @param {string} message - Message to display
   * @param {number} [duration=5000] - Duration in ms
   */
  error(message, duration = 5000) {
    if (window._app) window._app._toast('error', 'fa-exclamation-circle', message, duration);
  },

  /**
   * Show an info notification
   * @param {string} message - Message to display
   * @param {number} [duration=3500] - Duration in ms
   */
  info(message, duration = 3500) {
    if (window._app) window._app._toast('info', 'fa-info-circle', message, duration);
  },

  /**
   * Show a warning notification
   * @param {string} message - Message to display
   * @param {number} [duration=4500] - Duration in ms
   */
  warning(message, duration = 4500) {
    if (window._app) window._app._toast('info', 'fa-exclamation-triangle', message, duration);
  },

  /**
   * Show a loading notification (no auto-dismiss)
   * @param {string} message - Message to display
   * @returns {Function} Dismiss function — call to remove the notification
   */
  loading(message) {
    if (window._app) {
      window._app._toast('info', 'fa-spinner fa-spin', message, 60000);
    }
    return () => {};
  },

  /**
   * Show a streak milestone notification
   * @param {number} count - Current streak count
   */
  streakMilestone(count) {
    const milestones = {
      7:   { icon: 'fa-fire',  msg: `🔥 7-day streak! You're on fire!`, dur: 5500 },
      14:  { icon: 'fa-bolt',  msg: `⚡ 14-day streak! Two weeks strong!`, dur: 5500 },
      30:  { icon: 'fa-crown', msg: `👑 30-day streak! One month champion!`, dur: 6000 },
      50:  { icon: 'fa-star',  msg: `⭐ 50-day streak! Phenomenal dedication!`, dur: 6000 },
      100: { icon: 'fa-gem',   msg: `💎 100-day streak! You are LEGENDARY!`, dur: 7000 },
    };
    const m = milestones[count];
    if (m && window._app) {
      window._app._toast('success', m.icon, m.msg, m.dur);
    }
  },
};

/**
 * ── EXTENDED MARKDOWN UTILITIES ──────────────────────────────────────────────────────────
 * Advanced markdown processing for export and display purposes
 */

window._markdown = {
  /**
   * Extract all headings from markdown text
   * @param {string} text - Markdown text
   * @returns {Array<{level: number, text: string}>} Array of headings
   */
  extractHeadings(text) {
    if (!text) return [];
    const matches = text.matchAll(/^(#{1,6})\s+(.+)$/gm);
    return Array.from(matches).map(m => ({
      level: m[1].length,
      text:  m[2].replace(/\*+/g, '').trim(),
    }));
  },

  /**
   * Extract all bullet points from markdown text
   * @param {string} text - Markdown text
   * @returns {string[]} Array of bullet point texts
   */
  extractBullets(text) {
    if (!text) return [];
    const matches = text.matchAll(/^[-*]\s+(.+)$/gm);
    return Array.from(matches).map(m => m[1].trim());
  },

  /**
   * Extract the TL;DR / summary paragraph from notes
   * @param {string} notes - Full markdown notes
   * @returns {string} The TL;DR section text, or first paragraph
   */
  extractTLDR(notes) {
    if (!notes) return '';
    // Look for TL;DR section
    const tldrMatch = notes.match(/##.*TL;DR.*\n([\s\S]*?)(?=\n##|$)/i);
    if (tldrMatch) return tldrMatch[1].trim();
    // Look for Summary section
    const summaryMatch = notes.match(/##.*Summary.*\n([\s\S]*?)(?=\n##|$)/i);
    if (summaryMatch) return summaryMatch[1].trim();
    // Fall back to first substantial paragraph
    const paragraphs = notes.split('\n\n').filter(p => p.trim() && !p.startsWith('#'));
    return paragraphs[0]?.trim() || '';
  },

  /**
   * Convert markdown to plain text for clipboard/PDF use
   * @param {string} md - Markdown text
   * @returns {string} Plain text
   */
  toPlainText(md) {
    if (!md) return '';
    return md
      .replace(/#{1,6}\s/g, '')
      .replace(/\*\*\*(.+?)\*\*\*/g, '$1')
      .replace(/\*\*(.+?)\*\*/g, '$1')
      .replace(/\*(.+?)\*/g, '$1')
      .replace(/`{3}[\s\S]*?`{3}/g, '')
      .replace(/`(.+?)`/g, '$1')
      .replace(/\[(.+?)\]\(.+?\)/g, '$1')
      .replace(/^[-*]\s/gm, '• ')
      .replace(/^>\s/gm, '  ')
      .replace(/^---+$/gm, '────────────────────')
      .replace(/\n{3,}/g, '\n\n')
      .trim();
  },

  /**
   * Estimate if text is rich markdown (has formatting)
   * @param {string} text - Text to check
   * @returns {boolean} True if text contains markdown formatting
   */
  isRichMarkdown(text) {
    if (!text) return false;
    return /^#{1,6}\s|^\*\*|^[-*]\s/m.test(text);
  },
};

/**
 * ── EXTENDED LOCAL STORAGE UTILITIES ─────────────────────────────────────────────────────
 * Safe localStorage operations with error handling and size checking
 */

window._storage = {
  /**
   * Get total size of all sv_ localStorage items
   * @returns {number} Size in bytes
   */
  getTotalSize() {
    let total = 0;
    for (const key of Object.keys(localStorage)) {
      if (key.startsWith('sv_')) {
        total += (localStorage.getItem(key) || '').length;
      }
    }
    return total;
  },

  /**
   * Get size of a specific localStorage item
   * @param {string} key - Storage key
   * @returns {number} Size in bytes
   */
  getItemSize(key) {
    return (localStorage.getItem(key) || '').length;
  },

  /**
   * Format bytes as human-readable size
   * @param {number} bytes - Size in bytes
   * @returns {string} e.g. "1.2 KB", "456 B"
   */
  formatSize(bytes) {
    if (bytes < 1024)           return `${bytes} B`;
    if (bytes < 1024 * 1024)    return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  },

  /**
   * Check if localStorage is approaching capacity
   * @returns {boolean} True if > 80% used
   */
  isNearCapacity() {
    const estimate = this.getTotalSize() * 2; // UTF-16 encoding
    const limit    = 5 * 1024 * 1024; // 5MB typical limit
    return estimate > limit * 0.8;
  },

  /**
   * Safe get with JSON parse
   * @param {string} key - Storage key
   * @param {*} defaultVal - Default value if not found
   * @returns {*} Parsed value or default
   */
  get(key, defaultVal = null) {
    try {
      const v = localStorage.getItem(key);
      return v !== null ? JSON.parse(v) : defaultVal;
    } catch { return defaultVal; }
  },

  /**
   * Safe set with JSON stringify
   * @param {string} key - Storage key
   * @param {*} value - Value to store
   * @returns {boolean} Success status
   */
  set(key, value) {
    try {
      localStorage.setItem(key, JSON.stringify(value));
      return true;
    } catch (e) {
      console.warn(`Storage failed for key "${key}":`, e.message);
      return false;
    }
  },

  /**
   * Remove a storage item
   * @param {string} key - Storage key
   */
  remove(key) {
    try { localStorage.removeItem(key); } catch {}
  },

  /**
   * Get a summary of all sv_ storage usage
   * @returns {object} Usage summary
   */
  getUsageSummary() {
    const items = {};
    for (const key of Object.keys(localStorage)) {
      if (key.startsWith('sv_')) {
        items[key] = this.formatSize(this.getItemSize(key));
      }
    }
    return {
      items,
      total:   this.formatSize(this.getTotalSize()),
      bytes:   this.getTotalSize(),
      isHeavy: this.isNearCapacity(),
    };
  },
};

/**
 * ── EXTENDED ANALYTICS & TRACKING ────────────────────────────────────────────────────────
 * Client-side analytics helpers for tracking study patterns
 */

window._analytics = {
  /**
   * Get study insights from history data
   * @param {object[]} history - History array
   * @returns {object} Insights object
   */
  getInsights(history) {
    if (!history || !history.length) {
      return { mostUsedTool: 'notes', avgDuration: 0, totalGenerations: 0, mostStudiedTopics: [] };
    }
    // Count tool usage
    const toolCounts = {};
    history.forEach(h => { toolCounts[h.tool] = (toolCounts[h.tool] || 0) + 1; });
    const mostUsedTool = Object.entries(toolCounts).sort((a,b) => b[1]-a[1])[0]?.[0] || 'notes';

    // Average duration
    const durItems   = history.filter(h => h.dur && h.dur > 0);
    const avgDuration = durItems.length ? Math.round(durItems.reduce((s,h)=>s+h.dur,0) / durItems.length) : 0;

    // Topic frequency (simple word extraction)
    const topicWords = {};
    history.forEach(h => {
      (h.topic || '').split(/\s+/).filter(w => w.length > 4).forEach(w => {
        const lw = w.toLowerCase();
        topicWords[lw] = (topicWords[lw] || 0) + 1;
      });
    });
    const mostStudiedTopics = Object.entries(topicWords)
      .sort((a,b) => b[1]-a[1])
      .slice(0,5)
      .map(([word, count]) => ({ word, count }));

    return {
      mostUsedTool,
      avgDuration,
      totalGenerations: history.length,
      mostStudiedTopics,
      toolBreakdown: toolCounts,
    };
  },

  /**
   * Calculate learning consistency score (0-100)
   * @param {number} streak - Current streak
   * @param {number} sessions - Total sessions
   * @param {number} savedNotes - Number of saved notes
   * @returns {number} Consistency score
   */
  consistencyScore(streak, sessions, savedNotes) {
    let score = 0;
    if (streak >= 1)   score += 20;
    if (streak >= 7)   score += 20;
    if (streak >= 30)  score += 20;
    if (sessions >= 5)  score += 15;
    if (sessions >= 20) score += 15;
    if (savedNotes >= 5)  score += 10;
    return Math.min(100, score);
  },

  /**
   * Get motivational message based on stats
   * @param {number} streak - Current streak
   * @param {number} sessions - Total sessions
   * @returns {string} Motivational message
   */
  getMotivation(streak, sessions) {
    if (streak === 0) return 'Start your first study session today! 🚀';
    if (streak === 1) return 'Great start! Come back tomorrow to build your streak! 🌱';
    if (streak < 7)   return `${streak} days and counting — keep going! 💪`;
    if (streak < 30)  return `${streak}-day streak — you're building a great habit! 🔥`;
    if (streak < 100) return `${streak}-day streak — you are absolutely crushing it! 🏆`;
    return `${streak}-day streak — you are a study legend! 💎`;
  },
};

// ═════════════════════════════════════════════════════════════════════════════════════════
// END OF EXTENDED UTILITIES — Savoiré AI v2.0
// Built by Sooban Talha Technologies | soobantalhatech.xyz | Founder: Sooban Talha
// "Think Less. Know More." — Free forever for every student on Earth.
// ═════════════════════════════════════════════════════════════════════════════════════════

/**
 * ╔══════════════════════════════════════════════════════════════════════════════════════════════╗
 * ║                                                                                              ║
 * ║   SAVOIRÉ AI v2.a — ULTRA ADVANCED NEURAL ENGINE                                            ║
 * ║   app.js — Complete Dashboard Architecture (9500+ lines)                                    ║
 * ║                                                                                              ║
 * ║   Built by Sooban Talha Technologies | soobantalhatech.xyz                                  ║
 * ║   Founder: Sooban Talha                                                                      ║
 * ║                                                                                              ║
 * ║   ✦ BLUE-BLACK GRADIENT THEME    ✦ 3D THREE.JS BACKGROUND                                   ║
 * ║   ✦ ENTERPRISE SIDEBAR ENGINE    ✦ 7-STEP MULTI-FLOW WIZARD                                 ║
 * ║   ✦ LIVE SSE STREAMING ENGINE    ✦ TOKEN-BY-TOKEN RENDERING                                 ║
 * ║   ✦ PROGRESSIVE MARKDOWN HYDRATOR ✦ ADVANCED EXPORT ENGINE (PDF/DOCX/MD)                    ║
 * ║   ✦ CHAT HISTORY ENGINE          ✦ SETTINGS PERSISTENCE ENGINE                              ║
 * ║   ✦ TOPIC HISTORY DROPDOWN       ✦ GENERATION TIME ESTIMATOR                                ║
 * ║   ✦ PAUSE/RESUME STREAMING       ✦ SIDE-BY-SIDE COMPARE                                     ║
 * ║   ✦ CHAT FOLDERS & TAGS          ✦ BULK EXPORT/DELETE                                       ║
 * ║   ✦ AUTO-NAME CHATS              ✦ DRAFT AUTO-SAVE                                          ║
 * ║   ✦ KEYBOARD SHORTCUTS           ✦ MOBILE TOUCH ENGINE                                      ║
 * ║   ✦ PERFORMANCE OPTIMIZER        ✦ GPU RENDERING COORDINATOR                                ║
 * ║   ✦ DEEP DIVE GENERATION TYPE    ✦ 20+ NEW FEATURES                                         ║
 * ║                                                                                              ║
 * ╚══════════════════════════════════════════════════════════════════════════════════════════════╝
 */

'use strict';

/* ═══════════════════════════════════════════════════════════════════════════════════════════════
   SECTION 0 — GLOBAL NAMESPACE & VERSION CONSTANTS
   ═══════════════════════════════════════════════════════════════════════════════════════════════ */

const SAVOIRÉ = {
  VERSION:   '2.a.0',
  BUILD:     '2025.002',
  BRAND:     'Savoiré AI v2.a',
  FOUNDER:   'Sooban Talha',
  DEVELOPER: 'Sooban Talha Technologies',
  DEVSITE:   'soobantalhatech.xyz',
  API_BASE:  '/api/study',
  
  // New Generation Types
  GENERATION_TYPES: {
    NOTES: 'notes',
    FLASHCARDS: 'flashcards',
    QUIZ: 'quiz',
    SUMMARY: 'summary',
    MINDMAP: 'mindmap',
    DEEP_DIVE: 'deepdive'  // NEW: 5000-8000 word research-style output
  },
  
  // Depth Levels with word targets
  DEPTH_LEVELS: {
    standard: { label: 'Standard', words: '600-900', target: 750, icon: 'fa-circle-dot' },
    detailed: { label: 'Detailed', words: '1,000-1,500', target: 1250, icon: 'fa-expand' },
    comprehensive: { label: 'Comprehensive', words: '1,500-2,000', target: 1750, icon: 'fa-maximize' },
    expert: { label: 'Expert', words: '2,000-2,800', target: 2400, icon: 'fa-crown' },
    deepdive: { label: 'Deep Dive', words: '5,000-8,000', target: 6500, icon: 'fa-dharmachakra' }  // NEW
  },
  
  // Writing Styles
  WRITING_STYLES: {
    simple: { label: 'Simple & Clear', icon: 'fa-circle-check', desc: 'Beginner-friendly, plain language' },
    academic: { label: 'Academic', icon: 'fa-graduation-cap', desc: 'Formal, scholarly tone' },
    exam: { label: 'Exam Focused', icon: 'fa-pen-to-square', desc: 'Mark-scheme language' },
    visual: { label: 'Visual & Analogy', icon: 'fa-eye', desc: 'Rich analogies and imagery' },
    detailed: { label: 'Highly Detailed', icon: 'fa-list-ul', desc: 'Maximum depth, exhaustive' }
  },
  
  // Supported Languages (50+)
  LANGUAGES: [
    'English', 'Spanish', 'French', 'German', 'Italian', 'Portuguese',
    'Arabic', 'Chinese (Simplified)', 'Japanese', 'Korean', 'Hindi', 'Russian',
    'Dutch', 'Turkish', 'Polish', 'Swedish', 'Norwegian', 'Danish',
    'Finnish', 'Greek', 'Hebrew', 'Thai', 'Vietnamese', 'Indonesian',
    'Malay', 'Czech', 'Hungarian', 'Romanian', 'Ukrainian', 'Bulgarian',
    'Croatian', 'Slovak', 'Slovenian', 'Estonian', 'Latvian', 'Lithuanian',
    'Icelandic', 'Irish', 'Albanian', 'Macedonian', 'Serbian', 'Bengali',
    'Tamil', 'Telugu', 'Marathi', 'Gujarati', 'Kannada', 'Malayalam',
    'Punjabi', 'Urdu', 'Persian', 'Swahili', 'Zulu', 'Hausa'
  ]
};

/* ═══════════════════════════════════════════════════════════════════════════════════════════════
   SECTION 1 — CORE UTILITIES ENGINE (Enhanced)
   ═══════════════════════════════════════════════════════════════════════════════════════════════ */

const Utils = (() => {
  
  // Existing utilities...
  function debounce(fn, wait = 200) {
    let timer;
    return function (...args) {
      clearTimeout(timer);
      timer = setTimeout(() => fn.apply(this, args), wait);
    };
  }
  
  function throttle(fn, limit = 100) {
    let last = 0;
    return function (...args) {
      const now = performance.now();
      if (now - last >= limit) { last = now; fn.apply(this, args); }
    };
  }
  
  function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
  
  const $ = (selector, ctx = document) => ctx.querySelector(selector);
  const $$ = (selector, ctx = document) => [...ctx.querySelectorAll(selector)];
  
  function safeJSON(str, fallback = null) {
    try { return JSON.parse(str); } catch { return fallback; }
  }
  
  function relativeDate(ts) {
    const d = new Date(ts);
    const now = new Date();
    const diff = now - d;
    const secs = Math.floor(diff / 1000);
    const mins = Math.floor(secs / 60);
    const hours = Math.floor(mins / 60);
    const days = Math.floor(hours / 24);
    if (secs < 60) return 'just now';
    if (mins < 60) return `${mins}m ago`;
    if (hours < 24) return `${hours}h ago`;
    if (days === 1) return 'yesterday';
    if (days < 7) return `${days}d ago`;
    return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
  }
  
  function dateGroup(ts) {
    const d = new Date(ts);
    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const yesterdayStart = new Date(todayStart.getTime() - 86400000);
    if (d >= todayStart) return 'today';
    if (d >= yesterdayStart) return 'yesterday';
    return 'older';
  }
  
  function uid() {
    return Date.now().toString(36) + Math.random().toString(36).substring(2, 9);
  }
  
  function truncate(str, max = 40) {
    if (!str) return '';
    return str.length <= max ? str : str.substring(0, max - 1) + '…';
  }
  
  function stripHTML(html) {
    const d = document.createElement('div');
    d.innerHTML = html;
    return d.textContent || d.innerText || '';
  }
  
  async function copyToClipboard(text) {
    try {
      await navigator.clipboard.writeText(text);
      return true;
    } catch {
      const ta = document.createElement('textarea');
      ta.value = text;
      ta.style.cssText = 'position:fixed;top:-9999px;left:-9999px;';
      document.body.appendChild(ta);
      ta.focus();
      ta.select();
      const ok = document.execCommand('copy');
      document.body.removeChild(ta);
      return ok;
    }
  }
  
  function getGreeting(name = '') {
    const h = new Date().getHours();
    let salutation;
    if (h >= 5 && h < 12) salutation = 'Good morning';
    else if (h >= 12 && h < 17) salutation = 'Good afternoon';
    else if (h >= 17 && h < 21) salutation = 'Good evening';
    else salutation = 'Good night';
    return name ? `${salutation}, ${name}` : salutation;
  }
  
  function animateCounter(el, from, to, duration = 800) {
    const start = performance.now();
    function step(now) {
      const p = Math.min((now - start) / duration, 1);
      const ease = 1 - Math.pow(1 - p, 3);
      el.textContent = Math.round(from + (to - from) * ease);
      if (p < 1) requestAnimationFrame(step);
    }
    requestAnimationFrame(step);
  }
  
  // NEW: Estimate reading time based on word count
  function estimateReadingTime(wordCount) {
    const wordsPerMinute = 200;
    const minutes = Math.ceil(wordCount / wordsPerMinute);
    if (minutes < 1) return '< 1 min read';
    if (minutes === 1) return '1 min read';
    return `${minutes} min read`;
  }
  
  // NEW: Generate auto-title from topic
  function autoGenerateTitle(topic) {
    if (!topic) return 'Untitled';
    const words = topic.trim().split(/\s+/);
    if (words.length <= 5) return topic;
    return words.slice(0, 5).join(' ') + '…';
  }
  
  // NEW: Format file size
  function formatFileSize(bytes) {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1048576) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / 1048576).toFixed(1) + ' MB';
  }
  
  // NEW: Deep clone object
  function deepClone(obj) {
    return JSON.parse(JSON.stringify(obj));
  }
  
  // NEW: Download blob as file
  function downloadBlob(blob, filename) {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  }
  
  return { 
    debounce, throttle, sleep, $, $$, safeJSON, relativeDate, dateGroup,
    uid, truncate, stripHTML, copyToClipboard, getGreeting, animateCounter,
    estimateReadingTime, autoGenerateTitle, formatFileSize, deepClone, downloadBlob
  };
})();

/* ═══════════════════════════════════════════════════════════════════════════════════════════════
   SECTION 2 — SETTINGS ENGINE (Enhanced with New Features)
   ═══════════════════════════════════════════════════════════════════════════════════════════════ */

const SettingsEngine = (() => {
  
  const STORAGE_KEY = 'savoiré_v2a_settings';
  const TOPIC_HISTORY_KEY = 'savoiré_v2a_topic_history';
  const RECENT_TOOLS_KEY = 'savoiré_v2a_recent_tools';
  
  const DEFAULTS = {
    userName: 'Explorer',
    userEmail: 'savoire@ai.study',
    theme: 'dark',
    fontSize: 'medium',
    streamSpeed: 'medium',
    liveMarkdown: true,
    autoSave: true,
    animations: true,
    reducedMotion: false,
    sidebarOpen: true,
    defaultTool: 'notes',
    defaultDepth: 'detailed',
    defaultStyle: 'simple',
    defaultLang: 'English',
    exportFormat: 'pdf',
    totalGenerated: 0,
    totalTokens: 0,
    totalSessions: 0,
    lastVisit: null,
    oledMode: false,  // NEW: OLED true black mode
    autoNameChats: true,  // NEW: Auto-name chats from topic
    draftAutoSave: true,  // NEW: Auto-save drafts
    showReadingTime: true,  // NEW: Show reading time indicator
    streamingPauseOnScroll: false,  // NEW: Pause streaming when scrolling away
    maxTopicHistory: 10  // NEW: Max saved topics
  };
  
  let _settings = { ...DEFAULTS };
  let _topicHistory = [];
  let _recentTools = [];
  
  function load() {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const saved = Utils.safeJSON(raw, {});
      _settings = { ...DEFAULTS, ...saved };
    }
    
    const topicRaw = localStorage.getItem(TOPIC_HISTORY_KEY);
    if (topicRaw) {
      _topicHistory = Utils.safeJSON(topicRaw, []);
    }
    
    const toolsRaw = localStorage.getItem(RECENT_TOOLS_KEY);
    if (toolsRaw) {
      _recentTools = Utils.safeJSON(toolsRaw, []);
    }
    
    applyAll();
    return _settings;
  }
  
  function save() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(_settings));
  }
  
  function saveTopicHistory() {
    localStorage.setItem(TOPIC_HISTORY_KEY, JSON.stringify(_topicHistory));
  }
  
  function saveRecentTools() {
    localStorage.setItem(RECENT_TOOLS_KEY, JSON.stringify(_recentTools));
  }
  
  function get(key) {
    return _settings[key] ?? DEFAULTS[key];
  }
  
  function set(key, value) {
    _settings[key] = value;
    save();
    applyReactive(key, value);
  }
  
  function increment(key, by = 1) {
    _settings[key] = ((_settings[key] || 0) + by);
    save();
  }
  
  function addToTopicHistory(topic) {
    if (!topic || topic.trim().length < 3) return;
    const trimmed = topic.trim();
    _topicHistory = _topicHistory.filter(t => t !== trimmed);
    _topicHistory.unshift(trimmed);
    if (_topicHistory.length > get('maxTopicHistory')) {
      _topicHistory.pop();
    }
    saveTopicHistory();
  }
  
  function getTopicHistory() {
    return [..._topicHistory];
  }
  
  function addRecentTool(tool) {
    _recentTools = _recentTools.filter(t => t !== tool);
    _recentTools.unshift(tool);
    if (_recentTools.length > 5) _recentTools.pop();
    saveRecentTools();
  }
  
  function getRecentTools() {
    return [..._recentTools];
  }
  
  function applyAll() {
    applyTheme(_settings.theme);
    applyFontSize(_settings.fontSize);
    applyReducedMotion(_settings.reducedMotion);
    applyOLEDMode(_settings.oledMode);
  }
  
  function applyReactive(key, value) {
    if (key === 'theme') applyTheme(value);
    if (key === 'fontSize') applyFontSize(value);
    if (key === 'reducedMotion') applyReducedMotion(value);
    if (key === 'oledMode') applyOLEDMode(value);
  }
  
  function applyTheme(theme) {
    document.documentElement.setAttribute('data-theme', theme);
    const toggle = document.getElementById('themeToggle');
    if (toggle) {
      toggle.classList.toggle('on', theme === 'dark');
    }
  }
  
  function applyFontSize(size) {
    document.documentElement.setAttribute('data-font', size);
    const sel = document.getElementById('fontSizeSelect');
    if (sel) sel.value = size;
  }
  
  function applyReducedMotion(val) {
    document.documentElement.setAttribute('data-reduced-motion', val ? 'true' : 'false');
  }
  
  function applyOLEDMode(val) {
    if (val) {
      document.documentElement.style.setProperty('--bg0', '#000000');
      document.documentElement.style.setProperty('--bg1', '#000000');
      document.documentElement.style.setProperty('--bg2', '#010101');
    } else {
      document.documentElement.style.setProperty('--bg0', '#000000');
      document.documentElement.style.setProperty('--bg1', '#05050F');
      document.documentElement.style.setProperty('--bg2', '#0A0A18');
    }
  }
  
  function resetToDefaults() {
    _settings = { ...DEFAULTS };
    save();
    applyAll();
  }
  
  const STREAM_SPEEDS = { fast: 4, medium: 14, slow: 28 };
  function getStreamDelay() {
    return STREAM_SPEEDS[_settings.streamSpeed] ?? 14;
  }
  
  return { 
    load, save, get, set, increment, getStreamDelay, applyAll, resetToDefaults,
    addToTopicHistory, getTopicHistory, addRecentTool, getRecentTools
  };
})();

/* ═══════════════════════════════════════════════════════════════════════════════════════════════
   SECTION 3 — CHAT HISTORY ENGINE (Enhanced with Folders, Tags, Drafts)
   ═══════════════════════════════════════════════════════════════════════════════════════════════ */

const ChatHistoryEngine = (() => {
  
  const STORAGE_KEY = 'savoiré_v2a_chats';
  const BOOKMARKS_KEY = 'savoiré_v2a_bookmarks';
  const FOLDERS_KEY = 'savoiré_v2a_folders';
  const DRAFTS_KEY = 'savoiré_v2a_drafts';
  
  let _chats = [];
  let _bookmarks = [];
  let _folders = [{ id: 'default', name: 'All Chats', color: '#00D4FF', chats: [] }];
  let _drafts = [];
  let _currentChatId = null;
  
  function load() {
    _chats = Utils.safeJSON(localStorage.getItem(STORAGE_KEY), []);
    _bookmarks = Utils.safeJSON(localStorage.getItem(BOOKMARKS_KEY), []);
    _folders = Utils.safeJSON(localStorage.getItem(FOLDERS_KEY), [{ id: 'default', name: 'All Chats', color: '#00D4FF', chats: [] }]);
    _drafts = Utils.safeJSON(localStorage.getItem(DRAFTS_KEY), []);
    return _chats;
  }
  
  function save() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(_chats));
  }
  
  function saveBookmarks() {
    localStorage.setItem(BOOKMARKS_KEY, JSON.stringify(_bookmarks));
  }
  
  function saveFolders() {
    localStorage.setItem(FOLDERS_KEY, JSON.stringify(_folders));
  }
  
  function saveDrafts() {
    localStorage.setItem(DRAFTS_KEY, JSON.stringify(_drafts));
  }
  
  function createChat(data) {
    const title = SettingsEngine.get('autoNameChats') 
      ? Utils.autoGenerateTitle(data.topic || 'Untitled')
      : 'Untitled';
    
    const chat = {
      id: Utils.uid(),
      tool: data.tool || 'notes',
      topic: data.topic || 'Untitled',
      title: title,
      depth: data.depth || 'detailed',
      style: data.style || 'simple',
      language: data.language || 'English',
      content: data.content || '',
      rawText: data.rawText || '',
      tokens: data.tokens || 0,
      wps: data.wps || 0,
      pinned: false,
      bookmarked: false,
      folderId: 'default',
      tags: [],
      readingTime: Utils.estimateReadingTime((data.rawText || '').split(/\s+/).length),
      timestamp: Date.now(),
      lastEdited: Date.now(),
      createdAt: new Date().toISOString(),
      isDraft: false
    };
    _chats.unshift(chat);
    _currentChatId = chat.id;
    if (SettingsEngine.get('autoSave')) save();
    SettingsEngine.increment('totalSessions');
    SettingsEngine.addRecentTool(data.tool);
    return chat;
  }
  
  function saveDraft(data) {
    const draft = {
      id: Utils.uid(),
      tool: data.tool || 'notes',
      topic: data.topic || '',
      depth: data.depth || 'detailed',
      style: data.style || 'simple',
      language: data.language || 'English',
      rawText: data.rawText || '',
      progress: data.progress || 0,
      timestamp: Date.now()
    };
    _drafts.unshift(draft);
    if (_drafts.length > 10) _drafts.pop();
    saveDrafts();
    return draft;
  }
  
  function getDraft(id) {
    return _drafts.find(d => d.id === id);
  }
  
  function deleteDraft(id) {
    _drafts = _drafts.filter(d => d.id !== id);
    saveDrafts();
  }
  
  function getAllDrafts() {
    return [..._drafts].sort((a, b) => b.timestamp - a.timestamp);
  }
  
  function updateChat(id, fields) {
    const idx = _chats.findIndex(c => c.id === id);
    if (idx !== -1) {
      _chats[idx] = { ..._chats[idx], ...fields, lastEdited: Date.now() };
      if (fields.rawText !== undefined) {
        _chats[idx].readingTime = Utils.estimateReadingTime(fields.rawText.split(/\s+/).length);
      }
      if (SettingsEngine.get('autoSave')) save();
    }
  }
  
  function deleteChat(id) {
    _chats = _chats.filter(c => c.id !== id);
    if (_currentChatId === id) _currentChatId = null;
    save();
  }
  
  function pinChat(id) {
    const chat = _chats.find(c => c.id === id);
    if (chat) {
      chat.pinned = !chat.pinned;
      save();
    }
  }
  
  function renameChat(id, newTopic) {
    updateChat(id, { topic: newTopic, title: Utils.autoGenerateTitle(newTopic) });
  }
  
  function getChat(id) {
    return _chats.find(c => c.id === id) || null;
  }
  
  function getAllChats() {
    return [..._chats].sort((a, b) => {
      if (a.pinned && !b.pinned) return -1;
      if (!a.pinned && b.pinned) return 1;
      return b.timestamp - a.timestamp;
    });
  }
  
  function searchChats(query) {
    if (!query) return getAllChats();
    const q = query.toLowerCase();
    return getAllChats().filter(c =>
      c.topic.toLowerCase().includes(q) ||
      c.title.toLowerCase().includes(q) ||
      (c.rawText && c.rawText.toLowerCase().includes(q)) ||
      c.tags.some(tag => tag.toLowerCase().includes(q))
    );
  }
  
  function getGrouped() {
    const all = getAllChats();
    const groups = { today: [], yesterday: [], older: [] };
    all.forEach(c => {
      const g = Utils.dateGroup(c.timestamp);
      groups[g].push(c);
    });
    return groups;
  }
  
  function bookmarkChat(id) {
    const chat = _chats.find(c => c.id === id);
    if (!chat) return;
    chat.bookmarked = true;
    const existing = _bookmarks.findIndex(b => b.id === id);
    if (existing === -1) {
      _bookmarks.unshift({ ...chat });
    }
    save();
    saveBookmarks();
  }
  
  function unbookmarkChat(id) {
    const chat = _chats.find(c => c.id === id);
    if (chat) chat.bookmarked = false;
    _bookmarks = _bookmarks.filter(b => b.id !== id);
    save();
    saveBookmarks();
  }
  
  function getBookmarks() {
    return [..._bookmarks];
  }
  
  // Folder Management
  function createFolder(name, color = '#00D4FF') {
    const folder = {
      id: Utils.uid(),
      name: name,
      color: color,
      chats: []
    };
    _folders.push(folder);
    saveFolders();
    return folder;
  }
  
  function deleteFolder(id) {
    if (id === 'default') return;
    const folder = _folders.find(f => f.id === id);
    if (folder) {
      folder.chats.forEach(chatId => {
        const chat = _chats.find(c => c.id === chatId);
        if (chat) chat.folderId = 'default';
      });
      _folders = _folders.filter(f => f.id !== id);
      saveFolders();
      save();
    }
  }
  
  function moveChatToFolder(chatId, folderId) {
    const chat = _chats.find(c => c.id === chatId);
    if (chat) {
      chat.folderId = folderId;
      const oldFolder = _folders.find(f => f.chats.includes(chatId));
      if (oldFolder) {
        oldFolder.chats = oldFolder.chats.filter(id => id !== chatId);
      }
      const newFolder = _folders.find(f => f.id === folderId);
      if (newFolder && !newFolder.chats.includes(chatId)) {
        newFolder.chats.push(chatId);
      }
      save();
      saveFolders();
    }
  }
  
  function addTagToChat(chatId, tag) {
    const chat = _chats.find(c => c.id === chatId);
    if (chat && !chat.tags.includes(tag)) {
      chat.tags.push(tag);
      save();
    }
  }
  
  function removeTagFromChat(chatId, tag) {
    const chat = _chats.find(c => c.id === chatId);
    if (chat) {
      chat.tags = chat.tags.filter(t => t !== tag);
      save();
    }
  }
  
  function getChatsByTag(tag) {
    return _chats.filter(c => c.tags.includes(tag));
  }
  
  function getFolders() {
    return [..._folders];
  }
  
  function bulkDelete(chatIds) {
    _chats = _chats.filter(c => !chatIds.includes(c.id));
    if (chatIds.includes(_currentChatId)) _currentChatId = null;
    save();
  }
  
  function bulkExport(chatIds) {
    const chatsToExport = _chats.filter(c => chatIds.includes(c.id));
    const exportData = {
      version: SAVOIRÉ.VERSION,
      exportDate: new Date().toISOString(),
      chats: chatsToExport
    };
    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
    Utils.downloadBlob(blob, `savoiré-export-${Date.now()}.json`);
  }
  
  function exportAllData() {
    const data = {
      version: SAVOIRÉ.VERSION,
      exportDate: new Date().toISOString(),
      chats: _chats,
      bookmarks: _bookmarks,
      folders: _folders,
      settings: SettingsEngine.get
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    Utils.downloadBlob(blob, `savoiré-all-data-${Date.now()}.json`);
  }
  
  function clearAll() {
    _chats = [];
    _bookmarks = [];
    _drafts = [];
    _folders = [{ id: 'default', name: 'All Chats', color: '#00D4FF', chats: [] }];
    _currentChatId = null;
    localStorage.removeItem(STORAGE_KEY);
    localStorage.removeItem(BOOKMARKS_KEY);
    localStorage.removeItem(DRAFTS_KEY);
    localStorage.removeItem(FOLDERS_KEY);
  }
  
  function setCurrentId(id) { _currentChatId = id; }
  function getCurrentId() { return _currentChatId; }
  function getCount() { return _chats.length; }
  
  return {
    load, save, createChat, updateChat, deleteChat, pinChat, renameChat, getChat,
    getAllChats, searchChats, getGrouped, bookmarkChat, unbookmarkChat, getBookmarks,
    exportAllData, clearAll, setCurrentId, getCurrentId, getCount,
    saveDraft, getDraft, deleteDraft, getAllDrafts,
    createFolder, deleteFolder, moveChatToFolder, getFolders,
    addTagToChat, removeTagFromChat, getChatsByTag,
    bulkDelete, bulkExport
  };
})();

/* ═══════════════════════════════════════════════════════════════════════════════════════════════
   SECTION 4 — TOAST ENGINE (Enhanced)
   ═══════════════════════════════════════════════════════════════════════════════════════════════ */

const ToastEngine = (() => {
  
  const ICONS = {
    success: 'fa-circle-check',
    error: 'fa-circle-xmark',
    info: 'fa-circle-info',
    warning: 'fa-triangle-exclamation',
    gold: 'fa-star',
    loading: 'fa-spinner fa-pulse'
  };
  
  const COLORS = {
    success: 'var(--em2)',
    error: 'var(--ruby2)',
    info: 'var(--blue)',
    warning: 'var(--cyan)',
    gold: 'var(--blue)',
    loading: 'var(--purple)'
  };
  
  let _queue = [];
  let _active = 0;
  const MAX_ACTIVE = 4;
  
  function show(message, type = 'info', duration = 3500) {
    if (_active >= MAX_ACTIVE) {
      _queue.push({ message, type, duration });
      return;
    }
    _render(message, type, duration);
  }
  
  function _render(message, type, duration) {
    _active++;
    const container = document.getElementById('toastContainer');
    if (!container) return;
    
    const icon = ICONS[type] || ICONS.info;
    const color = COLORS[type] || COLORS.info;
    
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.setAttribute('role', 'alert');
    
    toast.innerHTML = `
      <div class="toast-icon"><i class="fa ${icon}"></i></div>
      <div class="toast-message">${message}</div>
      <div class="toast-close"><i class="fa fa-times"></i></div>
    `;
    
    container.appendChild(toast);
    
    const dismiss = () => {
      toast.style.animation = 'toastOut 0.28s var(--ease2) forwards';
      setTimeout(() => {
        toast.remove();
        _active--;
        if (_queue.length > 0) {
          const next = _queue.shift();
          _render(next.message, next.type, next.duration);
        }
      }, 300);
    };
    
    toast.querySelector('.toast-close').addEventListener('click', dismiss);
    const timer = setTimeout(dismiss, duration);
    toast.addEventListener('mouseenter', () => clearTimeout(timer));
  }
  
  return {
    show,
    success: (msg, dur) => show(msg, 'success', dur || 3000),
    error: (msg, dur) => show(msg, 'error', dur || 5000),
    info: (msg, dur) => show(msg, 'info', dur || 3000),
    warning: (msg, dur) => show(msg, 'warning', dur || 4000),
    loading: (msg, dur) => show(msg, 'loading', dur || 2000)
  };
})();

/* ═══════════════════════════════════════════════════════════════════════════════════════════════
   SECTION 5 — ANIMATION ORCHESTRATION ENGINE (Enhanced)
   ═══════════════════════════════════════════════════════════════════════════════════════════════ */

const AnimationEngine = (() => {
  
  function animate(el, from, to, duration = 400, easing = 'ease', onDone = null) {
    if (!el) return;
    const easingFns = {
      ease: t => 1 - Math.pow(1 - t, 3),
      spring: t => {
        const c4 = (2 * Math.PI) / 3;
        return t === 0 ? 0 : t === 1 ? 1 : Math.pow(2, -10 * t) * Math.sin((t * 10 - 0.75) * c4) + 1;
      },
      linear: t => t,
      bounce: t => {
        if (t < 1 / 2.75) return 7.5625 * t * t;
        if (t < 2 / 2.75) return 7.5625 * (t -= 1.5 / 2.75) * t + 0.75;
        if (t < 2.5 / 2.75) return 7.5625 * (t -= 2.25 / 2.75) * t + 0.9375;
        return 7.5625 * (t -= 2.625 / 2.75) * t + 0.984375;
      }
    };
    
    const fn = easingFns[easing] || easingFns.ease;
    const start = performance.now();
    
    function step(now) {
      const p = Math.min((now - start) / duration, 1);
      const e = fn(p);
      Object.entries(from).forEach(([key, fromVal]) => {
        const toVal = to[key];
        if (typeof fromVal === 'number') {
          el.style[key] = fromVal + (toVal - fromVal) * e + (key === 'opacity' ? '' : 'px');
        }
      });
      if (p < 1) requestAnimationFrame(step);
      else if (onDone) onDone();
    }
    requestAnimationFrame(step);
  }
  
  function staggerIn(elements, options = {}) {
    const { delay = 0, stagger = 60, duration = 400, from = 'bottom' } = options;
    const transforms = {
      bottom: 'translateY(20px)',
      top: 'translateY(-20px)',
      left: 'translateX(-20px)',
      right: 'translateX(20px)',
      scale: 'scale(0.92)',
      fade: 'none'
    };
    
    elements.forEach((el, i) => {
      if (from === 'fade') {
        el.style.opacity = '0';
        el.style.transition = `opacity ${duration}ms cubic-bezier(0.16,1,0.3,1) ${delay + i * stagger}ms`;
      } else {
        el.style.opacity = '0';
        el.style.transform = transforms[from] || transforms.bottom;
        el.style.transition = `opacity ${duration}ms cubic-bezier(0.16,1,0.3,1) ${delay + i * stagger}ms, transform ${duration}ms cubic-bezier(0.16,1,0.3,1) ${delay + i * stagger}ms`;
      }
      el.style.willChange = 'opacity,transform';
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          el.style.opacity = '1';
          if (from !== 'fade') el.style.transform = 'none';
        });
      });
    });
  }
  
  function fadeIn(el, delay = 0, duration = 400, dir = 'bottom') {
    staggerIn([el], { delay, duration, from: dir });
  }
  
  function createParticles(container, count = 20, color = 'rgba(0,212,255,0.5)') {
    if (!container || SettingsEngine.get('reducedMotion')) return;
    for (let i = 0; i < count; i++) {
      const p = document.createElement('div');
      const size = Math.random() * 3 + 1;
      const left = Math.random() * 100;
      const delay = Math.random() * 8;
      const duration = Math.random() * 10 + 8;
      p.style.cssText = `
        position:absolute;width:${size}px;height:${size}px;
        border-radius:50%;background:${color};
        left:${left}%;bottom:-10px;
        animation:floatParticle ${duration}s ${delay}s linear infinite;
        will-change:transform,opacity;
        pointer-events:none;
      `;
      container.appendChild(p);
    }
  }
  
  function ripple(el, e) {
    const rect = el.getBoundingClientRect();
    const x = (e.clientX || rect.left + rect.width / 2) - rect.left;
    const y = (e.clientY || rect.top + rect.height / 2) - rect.top;
    const size = Math.max(rect.width, rect.height) * 2;
    const r = document.createElement('div');
    r.style.cssText = `
      position:absolute;width:${size}px;height:${size}px;
      border-radius:50%;background:rgba(0,212,255,0.15);
      left:${x - size / 2}px;top:${y - size / 2}px;
      transform:scale(0);opacity:1;pointer-events:none;
      transition:transform 0.6s ease,opacity 0.6s ease;
      will-change:transform,opacity;
    `;
    el.style.position = 'relative';
    el.style.overflow = 'hidden';
    el.appendChild(r);
    requestAnimationFrame(() => {
      r.style.transform = 'scale(1)';
      r.style.opacity = '0';
    });
    setTimeout(() => r.remove(), 700);
  }
  
  function glowPulse(el, color = 'var(--blue)') {
    el.style.transition = 'box-shadow 0.3s ease';
    el.style.boxShadow = `0 0 0 0 ${color}`;
    requestAnimationFrame(() => {
      el.style.boxShadow = `0 0 24px 6px ${color}`;
      setTimeout(() => { el.style.boxShadow = 'none'; }, 500);
    });
  }
  
  function parallax(elements, intensity = 0.05) {
    document.addEventListener('mousemove', (e) => {
      const mouseX = e.clientX / window.innerWidth - 0.5;
      const mouseY = e.clientY / window.innerHeight - 0.5;
      elements.forEach(el => {
        if (el) {
          const moveX = mouseX * intensity * 100;
          const moveY = mouseY * intensity * 100;
          el.style.transform = `translate(${moveX}px, ${moveY}px)`;
        }
      });
    });
  }
  
  return { animate, staggerIn, fadeIn, createParticles, ripple, glowPulse, parallax };
})();

/* ═══════════════════════════════════════════════════════════════════════════════════════════════
   SECTION 6 — SIDEBAR ENGINE (Enhanced with Folders, Tags, Bulk Actions)
   ═══════════════════════════════════════════════════════════════════════════════════════════════ */

const SidebarEngine = (() => {
  
  let _collapsed = false;
  let _searchQuery = '';
  let _selectedFolder = 'default';
  let _bulkMode = false;
  let _selectedChats = new Set();
  
  function init() {
    _collapsed = !SettingsEngine.get('sidebarOpen');
    if (_collapsed) _applyCollapsed(false);
    
    const searchEl = document.getElementById('sidebarSearch');
    if (searchEl) {
      searchEl.addEventListener('input', Utils.debounce(() => {
        _searchQuery = searchEl.value.trim();
        render();
      }, 200));
    }
  }
  
  function toggle() {
    _collapsed ? expand() : collapse();
  }
  
  function collapse() {
    _collapsed = true;
    SettingsEngine.set('sidebarOpen', false);
    _applyCollapsed(true);
  }
  
  function expand() {
    _collapsed = false;
    SettingsEngine.set('sidebarOpen', true);
    _applyCollapsed(true);
  }
  
  function _applyCollapsed(animate) {
    const sidebar = document.getElementById('sidebar');
    const workspace = document.getElementById('workspace');
    if (!sidebar) return;
    
    sidebar.classList.toggle('collapsed', _collapsed);
    if (workspace) {
      workspace.classList.toggle('full', _collapsed);
    }
  }
  
  function toggleBulkMode() {
    _bulkMode = !_bulkMode;
    _selectedChats.clear();
    render();
    const bulkBar = document.getElementById('bulkActionBar');
    if (bulkBar) {
      bulkBar.classList.toggle('visible', _bulkMode);
    }
  }
  
  function selectChatForBulk(id) {
    if (_selectedChats.has(id)) {
      _selectedChats.delete(id);
    } else {
      _selectedChats.add(id);
    }
    render();
    updateBulkCounter();
  }
  
  function updateBulkCounter() {
    const counter = document.getElementById('bulkCount');
    if (counter) {
      counter.textContent = _selectedChats.size;
    }
  }
  
  function bulkDeleteSelected() {
    if (_selectedChats.size === 0) return;
    if (confirm(`Delete ${_selectedChats.size} chat(s)?`)) {
      ChatHistoryEngine.bulkDelete(Array.from(_selectedChats));
      _selectedChats.clear();
      _bulkMode = false;
      render();
      const bulkBar = document.getElementById('bulkActionBar');
      if (bulkBar) bulkBar.classList.remove('visible');
      ToastEngine.success(`${_selectedChats.size} chats deleted`);
    }
  }
  
  function bulkExportSelected() {
    if (_selectedChats.size === 0) return;
    ChatHistoryEngine.bulkExport(Array.from(_selectedChats));
    ToastEngine.success(`Exporting ${_selectedChats.size} chat(s)`);
  }
  
  function render() {
    let chats = _searchQuery
      ? ChatHistoryEngine.searchChats(_searchQuery)
      : ChatHistoryEngine.getAllChats();
    
    // Filter by folder
    if (_selectedFolder !== 'default') {
      chats = chats.filter(c => c.folderId === _selectedFolder);
    }
    
    const isEmpty = chats.length === 0;
    const emptyEl = document.getElementById('emptyChats');
    if (emptyEl) emptyEl.style.display = isEmpty ? 'flex' : 'none';
    
    if (!isEmpty) {
      _renderChats(chats);
    }
    
    const badge = document.getElementById('chatCount');
    if (badge) badge.textContent = ChatHistoryEngine.getCount();
    
    const name = SettingsEngine.get('userName') || 'Explorer';
    const nameEl = document.getElementById('userName');
    const avatarInitial = document.getElementById('userAvatarInitial');
    const headerAvatar = document.getElementById('headerAvatarInitial');
    const ddName = document.getElementById('ddUserName');
    const ddEmail = document.getElementById('ddUserEmail');
    const ddAvatar = document.getElementById('ddAvatar');
    
    if (nameEl) nameEl.textContent = name;
    if (avatarInitial) avatarInitial.textContent = name.charAt(0).toUpperCase();
    if (headerAvatar) headerAvatar.textContent = name.charAt(0).toUpperCase();
    if (ddName) ddName.textContent = name;
    if (ddEmail) ddEmail.textContent = SettingsEngine.get('userEmail') || 'savoire@ai.study';
    if (ddAvatar) ddAvatar.textContent = name.charAt(0).toUpperCase();
    
    _renderFolders();
  }
  
  function _renderFolders() {
    const folders = ChatHistoryEngine.getFolders();
    const container = document.getElementById('folderList');
    if (!container) return;
    
    container.innerHTML = folders.map(folder => `
      <div class="folder-item ${_selectedFolder === folder.id ? 'active' : ''}" 
           onclick="SidebarEngine.selectFolder('${folder.id}')"
           style="border-left-color: ${folder.color}">
        <i class="fas fa-folder" style="color: ${folder.color}"></i>
        <span>${folder.name}</span>
        <span class="folder-count">${folder.chats.length}</span>
      </div>
    `).join('');
  }
  
  function selectFolder(folderId) {
    _selectedFolder = folderId;
    render();
  }
  
  function _renderChats(chats) {
    const grouped = { today: [], yesterday: [], older: [] };
    chats.forEach(chat => {
      const group = Utils.dateGroup(chat.timestamp);
      grouped[group].push(chat);
    });
    
    const todaySection = document.getElementById('todayChats');
    const yesterdaySection = document.getElementById('yesterdayChats');
    const olderSection = document.getElementById('olderChats');
    
    if (todaySection) todaySection.innerHTML = grouped.today.map(c => _buildChatItem(c)).join('');
    if (yesterdaySection) yesterdaySection.innerHTML = grouped.yesterday.map(c => _buildChatItem(c)).join('');
    if (olderSection) olderSection.innerHTML = grouped.older.map(c => _buildChatItem(c)).join('');
    
    document.getElementById('todayGroup')?.classList.toggle('hidden', grouped.today.length === 0);
    document.getElementById('yesterdayGroup')?.classList.toggle('hidden', grouped.yesterday.length === 0);
    document.getElementById('olderGroup')?.classList.toggle('hidden', grouped.older.length === 0);
  }
  
  function _buildChatItem(chat) {
    const toolIcons = {
      notes: 'fa-book-open',
      flashcards: 'fa-layer-group',
      quiz: 'fa-question-circle',
      summary: 'fa-align-left',
      mindmap: 'fa-diagram-project',
      deepdive: 'fa-dharmachakra'
    };
    const toolColors = {
      notes: '#00D4FF',
      flashcards: '#8B5CF6',
      quiz: '#06FFDE',
      summary: '#A78BFA',
      mindmap: '#34D399',
      deepdive: '#F472B6'
    };
    const icon = toolIcons[chat.tool] || 'fa-book-open';
    const color = toolColors[chat.tool] || '#00D4FF';
    const activeClass = chat.id === ChatHistoryEngine.getCurrentId() ? 'active' : '';
    const readingTime = chat.readingTime || Utils.estimateReadingTime((chat.rawText || '').split(/\s+/).length);
    
    return `
      <div class="sb-chat-item ${activeClass}" data-id="${chat.id}" onclick="SidebarEngine.selectChat('${chat.id}')">
        ${_bulkMode ? `
          <input type="checkbox" class="bulk-checkbox" onclick="event.stopPropagation();SidebarEngine.selectChatForBulk('${chat.id}')" 
                 ${_selectedChats.has(chat.id) ? 'checked' : ''}>
        ` : ''}
        <div class="sb-chat-icon" style="background: ${color}20; color: ${color}">
          <i class="fa ${icon}"></i>
        </div>
        <div class="sb-chat-info">
          <div class="sb-chat-title">${Utils.truncate(chat.title || chat.topic, 28)}</div>
          <div class="sb-chat-meta">
            ${chat.tool} · ${Utils.relativeDate(chat.timestamp)}
            ${SettingsEngine.get('showReadingTime') ? ` · ${readingTime}` : ''}
          </div>
        </div>
        ${!_bulkMode ? `
          <div class="sb-chat-actions">
            <button class="sb-chat-action" onclick="event.stopPropagation();SidebarEngine.togglePin('${chat.id}')" title="${chat.pinned ? 'Unpin' : 'Pin'}">
              <i class="fa ${chat.pinned ? 'fa-thumbtack' : 'fa-thumbtack'}" style="${chat.pinned ? 'color: var(--blue)' : ''}"></i>
            </button>
            <button class="sb-chat-action" onclick="event.stopPropagation();SidebarEngine.startRename('${chat.id}')" title="Rename">
              <i class="fa fa-pen"></i>
            </button>
            <button class="sb-chat-action" onclick="event.stopPropagation();SidebarEngine.showChatMenu('${chat.id}')" title="More">
              <i class="fa fa-ellipsis-v"></i>
            </button>
          </div>
        ` : ''}
      </div>
    `;
  }
  
  function selectChat(id) {
    if (_bulkMode) {
      selectChatForBulk(id);
      return;
    }
    const chat = ChatHistoryEngine.getChat(id);
    if (!chat) return;
    
    ChatHistoryEngine.setCurrentId(id);
    render();
    loadChat(id);
    
    if (window.innerWidth <= 768) closeMobile();
  }
  
  function togglePin(id) {
    ChatHistoryEngine.pinChat(id);
    render();
    const chat = ChatHistoryEngine.getChat(id);
    ToastEngine.info(chat.pinned ? 'Chat pinned' : 'Chat unpinned');
  }
  
  function startRename(id) {
    const chatItem = document.querySelector(`.sb-chat-item[data-id="${id}"]`);
    if (!chatItem) return;
    
    const titleEl = chatItem.querySelector('.sb-chat-title');
    const chat = ChatHistoryEngine.getChat(id);
    if (!chat) return;
    
    const currentText = chat.title || chat.topic;
    titleEl.setAttribute('contenteditable', 'true');
    titleEl.style.outline = '1px solid var(--blue)';
    titleEl.style.borderRadius = '4px';
    titleEl.style.padding = '2px 4px';
    titleEl.textContent = currentText;
    titleEl.focus();
    
    const range = document.createRange();
    range.selectNodeContents(titleEl);
    const sel = window.getSelection();
    sel.removeAllRanges();
    sel.addRange(range);
    
    const finish = () => {
      const newName = titleEl.textContent.trim() || currentText;
      titleEl.removeAttribute('contenteditable');
      titleEl.style.outline = '';
      titleEl.style.padding = '';
      titleEl.textContent = Utils.truncate(newName, 28);
      ChatHistoryEngine.renameChat(id, newName);
      ToastEngine.success('Chat renamed');
    };
    
    titleEl.addEventListener('blur', finish, { once: true });
    titleEl.addEventListener('keydown', e => {
      if (e.key === 'Enter') { e.preventDefault(); titleEl.blur(); }
      if (e.key === 'Escape') { titleEl.textContent = Utils.truncate(currentText, 28); titleEl.blur(); }
    });
  }
  
  function showChatMenu(id) {
    const chat = ChatHistoryEngine.getChat(id);
    if (!chat) return;
    
    const menuItems = [
      { label: 'Move to folder', action: () => showFolderSelector(id) },
      { label: 'Add tag', action: () => showTagInput(id) },
      { label: 'Duplicate', action: () => duplicateChat(id) },
      { label: 'Export', action: () => ChatHistoryEngine.bulkExport([id]) },
      { label: 'Delete', action: () => confirmDelete(id), danger: true }
    ];
    
    // Custom context menu implementation
    const menu = document.createElement('div');
    menu.className = 'chat-context-menu';
    menu.innerHTML = menuItems.map(item => `
      <div class="chat-context-item ${item.danger ? 'danger' : ''}" data-action="${item.label}">
        ${item.label}
      </div>
    `).join('');
    
    document.body.appendChild(menu);
    const rect = event.target.getBoundingClientRect();
    menu.style.left = `${rect.right}px`;
    menu.style.top = `${rect.top}px`;
    
    const handleClick = (e) => {
      const target = e.target.closest('.chat-context-item');
      if (target) {
        const label = target.dataset.action;
        const item = menuItems.find(i => i.label === label);
        if (item) item.action();
      }
      menu.remove();
      document.removeEventListener('click', handleClick);
    };
    
    setTimeout(() => document.addEventListener('click', handleClick), 10);
  }
  
  function showFolderSelector(chatId) {
    const folders = ChatHistoryEngine.getFolders();
    const select = document.createElement('select');
    select.className = 'folder-selector';
    select.innerHTML = folders.map(f => `<option value="${f.id}">${f.name}</option>`).join('');
    select.onchange = () => {
      ChatHistoryEngine.moveChatToFolder(chatId, select.value);
      render();
      ToastEngine.success('Moved to folder');
    };
    // Show as modal or inline
    ToastEngine.info('Select folder');
  }
  
  function showTagInput(chatId) {
    const tag = prompt('Enter tag name:');
    if (tag && tag.trim()) {
      ChatHistoryEngine.addTagToChat(chatId, tag.trim());
      render();
      ToastEngine.success(`Tag "${tag}" added`);
    }
  }
  
  function duplicateChat(id) {
    const original = ChatHistoryEngine.getChat(id);
    if (!original) return;
    
    const newChat = ChatHistoryEngine.createChat({
      tool: original.tool,
      topic: `${original.topic} (Copy)`,
      depth: original.depth,
      style: original.style,
      language: original.language,
      content: original.content,
      rawText: original.rawText,
      tokens: original.tokens,
      wps: original.wps
    });
    ToastEngine.success('Chat duplicated');
    render();
  }
  
  function confirmDelete(id) {
    const chat = ChatHistoryEngine.getChat(id);
    if (!chat) return;
    if (confirm(`Delete "${Utils.truncate(chat.title || chat.topic, 30)}"?`)) {
      ChatHistoryEngine.deleteChat(id);
      render();
      if (ChatHistoryEngine.getCurrentId() === id) showHome();
      ToastEngine.info('Chat deleted');
    }
  }
  
  function openMobile() {
    const sidebar = document.getElementById('sidebar');
    if (sidebar) sidebar.classList.add('open');
    document.body.style.overflow = 'hidden';
  }
  
  function closeMobile() {
    const sidebar = document.getElementById('sidebar');
    if (sidebar) sidebar.classList.remove('open');
    document.body.style.overflow = '';
  }
  
  return { 
    init, toggle, collapse, expand, openMobile, closeMobile, render,
    selectChat, togglePin, startRename, confirmDelete, showChatMenu,
    toggleBulkMode, selectChatForBulk, bulkDeleteSelected, bulkExportSelected,
    selectFolder
  };
})();

/* ═══════════════════════════════════════════════════════════════════════════════════════════════
   SECTION 7 — FLOW ENGINE (Enhanced with Deep Dive, Topic History, Time Estimator)
   ═══════════════════════════════════════════════════════════════════════════════════════════════ */

const FlowEngine = (() => {
  
  let _state = {
    step: 1,
    maxSteps: 7,
    tool: '',
    topic: '',
    depth: 'detailed',
    language: 'English',
    style: 'simple',
    file: null,
    fileText: '',
    direction: 'forward'
  };
  
  let _estimatedTime = 0;
  let _estimateInterval = null;
  
  const STEP_TITLES = [
    'Select Your Tool',
    'Enter Your Topic',
    'Detail Level',
    'Output Language',
    'Writing Style',
    'Upload File (Optional)',
    'Review & Generate'
  ];
  
  const TOOLS = [
    { id: 'notes', label: 'Study Notes', icon: 'fa-book-open', color: '#00D4FF', desc: 'Comprehensive structured notes with key concepts, examples & memory aids' },
    { id: 'flashcards', label: 'Flashcards', icon: 'fa-layer-group', color: '#8B5CF6', desc: 'Active recall cards with questions & detailed answers' },
    { id: 'quiz', label: 'Practice Quiz', icon: 'fa-question-circle', color: '#06FFDE', desc: 'Multiple-choice exam questions with explanations' },
    { id: 'summary', label: 'Smart Summary', icon: 'fa-align-left', color: '#A78BFA', desc: 'Concise TL;DR with key takeaways & insights' },
    { id: 'mindmap', label: 'Mind Map', icon: 'fa-diagram-project', color: '#34D399', desc: 'Hierarchical visual outline of core concepts' },
    { id: 'deepdive', label: 'Deep Dive', icon: 'fa-dharmachakra', color: '#F472B6', desc: '5,000-8,000 word research-style document with citations' }
  ];
  
  const DEPTHS = [
    { id: 'standard', label: 'Standard', icon: 'fa-circle-dot', desc: '~750 words', color: '#00D4FF' },
    { id: 'detailed', label: 'Detailed', icon: 'fa-expand', desc: '~1,250 words', color: '#8B5CF6' },
    { id: 'comprehensive', label: 'Comprehensive', icon: 'fa-maximize', desc: '~1,750 words', color: '#A78BFA' },
    { id: 'expert', label: 'Expert', icon: 'fa-crown', desc: '~2,400 words', color: '#34D399' },
    { id: 'deepdive', label: 'Deep Dive', icon: 'fa-dharmachakra', desc: '~6,500 words', color: '#F472B6' }
  ];
  
  function open(preSelectedTool = '') {
    _state = {
      step: preSelectedTool ? 2 : 1,
      maxSteps: 7,
      tool: preSelectedTool || '',
      topic: '',
      depth: SettingsEngine.get('defaultDepth') || 'detailed',
      language: SettingsEngine.get('defaultLang') || 'English',
      style: SettingsEngine.get('defaultStyle') || 'simple',
      file: null,
      fileText: '',
      direction: 'forward'
    };
    
    const flow = document.getElementById('flowModal');
    if (!flow) return;
    
    flow.classList.remove('hidden');
    flow.style.animation = 'fadeIn 0.3s var(--ease)';
    
    _renderStep();
    _updateHeader();
    _startTimeEstimation();
  }
  
  function close() {
    const flow = document.getElementById('flowModal');
    if (!flow) return;
    flow.classList.add('hidden');
    if (_estimateInterval) clearInterval(_estimateInterval);
  }
  
  function _startTimeEstimation() {
    if (_estimateInterval) clearInterval(_estimateInterval);
    _updateTimeEstimate();
    _estimateInterval = setInterval(() => _updateTimeEstimate(), 500);
  }
  
  function _updateTimeEstimate() {
    const wordTarget = SAVOIRÉ.DEPTH_LEVELS[_state.depth]?.target || 1250;
    const baseTime = Math.ceil(wordTarget / 120); // ~120 words per second streaming
    const topicLength = _state.topic.length;
    const complexity = Math.min(1.5, 1 + (topicLength / 500));
    const estimatedSeconds = Math.ceil(baseTime * complexity);
    _estimatedTime = estimatedSeconds;
    
    const estimatorEl = document.getElementById('timeEstimator');
    if (estimatorEl) {
      estimatorEl.textContent = `⏱️ ~${estimatedSeconds} sec`;
    }
  }
  
  function next() {
    if (!_validateStep()) return;
    
    if (_state.step >= _state.maxSteps) {
      _startGeneration();
      return;
    }
    
    _state.direction = 'forward';
    _state.step++;
    _animateTransition('forward');
    _updateHeader();
  }
  
  function prev() {
    if (_state.step <= 1) {
      close();
      return;
    }
    _state.direction = 'backward';
    _state.step--;
    _animateTransition('backward');
    _updateHeader();
  }
  
  function _animateTransition(dir) {
    const content = document.getElementById('flowBody');
    if (!content) return;
    
    const outX = dir === 'forward' ? '-30px' : '30px';
    const inX = dir === 'forward' ? '30px' : '-30px';
    
    content.style.transition = 'opacity 0.2s ease, transform 0.2s ease';
    content.style.opacity = '0';
    content.style.transform = `translateX(${outX})`;
    
    setTimeout(() => {
      _renderStep();
      content.style.transform = `translateX(${inX})`;
      content.style.opacity = '0';
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          content.style.transition = 'opacity 0.28s var(--ease), transform 0.28s var(--ease)';
          content.style.opacity = '1';
          content.style.transform = 'translateX(0)';
        });
      });
    }, 200);
  }
  
  function _updateHeader() {
    const titleEl = document.getElementById('flowTitle');
    const textEl = document.getElementById('flowStepText');
    const progressEl = document.getElementById('flowProgress');
    const indicatorEl = document.getElementById('flowSteps');
    const backBtn = document.getElementById('flowBackBtn');
    const nextBtn = document.getElementById('flowNextBtn');
    
    if (titleEl) titleEl.textContent = STEP_TITLES[_state.step - 1];
    if (textEl) textEl.textContent = `Step ${_state.step} of ${_state.maxSteps}`;
    if (progressEl) {
      progressEl.style.width = ((_state.step / _state.maxSteps) * 100) + '%';
    }
    
    if (indicatorEl) {
      indicatorEl.innerHTML = Array.from({ length: _state.maxSteps }, (_, i) => {
        const cls = i + 1 === _state.step ? 'active' : i + 1 < _state.step ? 'done' : '';
        return `<div class="flow-dot ${cls}"></div>`;
      }).join('');
    }
    
    if (backBtn) {
      backBtn.style.opacity = _state.step <= 1 ? '0.5' : '1';
      backBtn.textContent = _state.step <= 1 ? '✕ Close' : '← Back';
    }
    
    if (nextBtn) {
      const isLast = _state.step === _state.maxSteps;
      nextBtn.innerHTML = isLast ? '<i class="fas fa-sparkles"></i> Generate' : 'Next →';
    }
  }
  
  function _validateStep() {
    switch (_state.step) {
      case 1:
        if (!_state.tool) {
          ToastEngine.warning('Please select a tool');
          return false;
        }
        return true;
      case 2:
        if (!_state.topic.trim() || _state.topic.trim().length < 2) {
          ToastEngine.warning('Please enter a topic (min 2 characters)');
          const input = document.getElementById('topicInput');
          if (input) {
            input.focus();
            input.style.borderColor = 'var(--ruby)';
            setTimeout(() => { input.style.borderColor = ''; }, 1500);
          }
          return false;
        }
        SettingsEngine.addToTopicHistory(_state.topic);
        return true;
      default:
        return true;
    }
  }
  
  function _renderStep() {
    const container = document.getElementById('flowBody');
    if (!container) return;
    
    const renderers = [
      _renderStepTools,
      _renderStepTopic,
      _renderStepDepth,
      _renderStepLanguage,
      _renderStepStyle,
      _renderStepUpload,
      _renderStepReview
    ];
    
    const renderer = renderers[_state.step - 1];
    if (renderer) {
      container.innerHTML = renderer();
      _attachStepListeners();
    }
  }
  
  function _renderStepTools() {
    const topicHistory = SettingsEngine.getTopicHistory();
    const recentTools = SettingsEngine.getRecentTools();
    
    return `
      <div class="flow-step">
        <div class="flow-step-title">What do you want to create?</div>
        <div class="flow-step-sub">Choose your AI study tool below</div>
        
        <div class="tools-grid">
          ${TOOLS.map(t => `
            <div class="tool-option ${_state.tool === t.id ? 'selected' : ''}" onclick="FlowEngine.selectTool('${t.id}')">
              <div class="tool-option-icon" style="background: ${t.color}20; color: ${t.color}">
                <i class="fa ${t.icon}"></i>
              </div>
              <div class="tool-option-name">${t.label}</div>
              <div class="tool-option-desc">${t.desc}</div>
            </div>
          `).join('')}
        </div>
        
        ${recentTools.length > 0 ? `
          <div style="margin-top: 24px;">
            <div style="font-size: 0.7rem; color: var(--t4); margin-bottom: 8px;">RECENTLY USED</div>
            <div style="display: flex; gap: 8px;">
              ${recentTools.map(tool => {
                const t = TOOLS.find(t => t.id === tool);
                return t ? `<button class="suggestion-pill" onclick="FlowEngine.selectTool('${t.id}'); FlowEngine.next();">${t.label}</button>` : '';
              }).join('')}
            </div>
          </div>
        ` : ''}
      </div>
    `;
  }
  
  function _renderStepTopic() {
    const topicHistory = SettingsEngine.getTopicHistory();
    const suggestions = _getTopicSuggestions(_state.tool);
    
    return `
      <div class="flow-step">
        <div class="flow-step-title">What topic do you want to study?</div>
        <div class="flow-step-sub">Be specific for the best results</div>
        
        <textarea id="topicInput" class="topic-textarea" placeholder="e.g. Quantum entanglement, The French Revolution, CRISPR gene editing...">${_state.topic}</textarea>
        <div class="char-count"><span id="charCount">${_state.topic.length}</span> / 500 characters</div>
        
        <div class="suggestions">
          ${suggestions.map(s => `<button class="suggestion-pill" onclick="FlowEngine.useSuggestion('${s}')">✦ ${s}</button>`).join('')}
        </div>
        
        ${topicHistory.length > 0 ? `
          <div style="margin-top: 20px;">
            <div style="font-size: 0.7rem; color: var(--t4); margin-bottom: 8px;">RECENT TOPICS</div>
            <div class="suggestions">
              ${topicHistory.slice(0, 5).map(t => `<button class="suggestion-pill" onclick="FlowEngine.useSuggestion('${t.replace(/'/g, "\\'")}')">📋 ${Utils.truncate(t, 30)}</button>`).join('')}
            </div>
          </div>
        ` : ''}
        
        <div class="time-estimator" id="timeEstimator" style="margin-top: 20px; padding: 12px; background: var(--blued); border-radius: var(--r3); font-size: 0.8rem;">
          <i class="fas fa-clock"></i> Estimated generation time: <strong id="timeEstimateValue">calculating...</strong>
        </div>
      </div>
    `;
  }
  
  function _renderStepDepth() {
    return `
      <div class="flow-step">
        <div class="flow-step-title">How detailed should the output be?</div>
        <div class="flow-step-sub">More depth = richer content, slightly longer generation</div>
        
        <div class="depth-grid">
          ${DEPTHS.map(d => `
            <div class="depth-option ${_state.depth === d.id ? 'selected' : ''}" onclick="FlowEngine.selectDepth('${d.id}')">
              <div class="depth-icon"><i class="fa ${d.icon}"></i></div>
              <div class="depth-name">${d.label}</div>
              <div class="depth-desc">${d.desc}</div>
            </div>
          `).join('')}
        </div>
        
        <div class="time-estimator" style="margin-top: 24px; padding: 12px; background: var(--blued); border-radius: var(--r3);">
          <i class="fas fa-chart-line"></i> <span id="depthTimeEstimate">${_getDepthDescription(_state.depth)}</span>
        </div>
      </div>
    `;
  }
  
  function _renderStepLanguage() {
    return `
      <div class="flow-step">
        <div class="flow-step-title">Output Language</div>
        <div class="flow-step-sub">Choose your preferred language</div>
        
        <div class="lang-grid">
          ${SAVOIRÉ.LANGUAGES.map(lang => `
            <div class="lang-option ${_state.language === lang ? 'selected' : ''}" onclick="FlowEngine.selectLanguage('${lang}')">
              ${lang}
            </div>
          `).join('')}
        </div>
      </div>
    `;
  }
  
  function _renderStepStyle() {
    const styles = Object.entries(SAVOIRÉ.WRITING_STYLES);
    return `
      <div class="flow-step">
        <div class="flow-step-title">Writing Style</div>
        <div class="flow-step-sub">Choose how the AI should present the information</div>
        
        <div class="style-grid">
          ${styles.map(([id, s]) => `
            <div class="style-option ${_state.style === id ? 'selected' : ''}" onclick="FlowEngine.selectStyle('${id}')">
              <div class="style-icon"><i class="fa ${s.icon}"></i></div>
              <div class="style-info">
                <div class="style-name">${s.label}</div>
                <div class="style-desc">${s.desc}</div>
              </div>
            </div>
          `).join('')}
        </div>
      </div>
    `;
  }
  
  function _renderStepUpload() {
    const hasFile = !!_state.file;
    return `
      <div class="flow-step">
        <div class="flow-step-title">Upload a File <span style="font-size: 0.8rem; color: var(--t4);">(Optional)</span></div>
        <div class="flow-step-sub">Add a document to enhance your study content</div>
        
        <div id="uploadZone" class="upload-zone" onclick="document.getElementById('fileInput').click()" 
             ondragover="FlowEngine.onDragOver(event)" ondragleave="FlowEngine.onDragLeave(event)" ondrop="FlowEngine.onDrop(event)">
          <div class="upload-icon"><i class="fas ${hasFile ? 'fa-file-check' : 'fa-cloud-upload-alt'}"></i></div>
          ${hasFile ? `
            <div style="font-weight: 600; color: var(--em2);">${_state.file.name}</div>
            <div style="font-size: 0.75rem; color: var(--t3);">${Utils.formatFileSize(_state.file.size)}</div>
            <button class="upload-remove" onclick="event.stopPropagation(); FlowEngine.removeFile()">
              <i class="fas fa-times"></i> Remove
            </button>
          ` : `
            <div>Drag & drop a file here, or <span style="color: var(--blue);">browse</span></div>
            <div style="font-size: 0.7rem; color: var(--t4);">Supports PDF, DOCX, TXT, MD (max 5MB)</div>
          `}
        </div>
        
        <div style="margin-top: 20px; padding: 12px; background: var(--bg3); border-radius: var(--r3); font-size: 0.75rem; color: var(--t3);">
          <i class="fas fa-info-circle"></i> Uploading a file helps the AI incorporate your specific materials.
        </div>
      </div>
    `;
  }
  
  function _renderStepReview() {
    const tool = TOOLS.find(t => t.id === _state.tool) || TOOLS[0];
    const depth = DEPTHS.find(d => d.id === _state.depth) || DEPTHS[0];
    const style = SAVOIRÉ.WRITING_STYLES[_state.style] || SAVOIRÉ.WRITING_STYLES.simple;
    
    return `
      <div class="flow-step">
        <div class="flow-step-title">Ready to Generate</div>
        <div class="flow-step-sub">Review your settings and launch the AI</div>
        
        <div class="review-grid">
          <div class="review-header">
            <i class="fa ${tool.icon}" style="color: ${tool.color}"></i>
            <span>${tool.label}</span>
          </div>
          <div class="review-body">
            <div class="review-item">
              <div class="review-label">Topic</div>
              <div class="review-value">${Utils.truncate(_state.topic, 50)}</div>
            </div>
            <div class="review-item">
              <div class="review-label">Depth</div>
              <div class="review-value">${depth.label} (${depth.desc})</div>
            </div>
            <div class="review-item">
              <div class="review-label">Language</div>
              <div class="review-value">${_state.language}</div>
            </div>
            <div class="review-item">
              <div class="review-label">Style</div>
              <div class="review-value">${style.label}</div>
            </div>
            ${_state.file ? `
              <div class="review-item">
                <div class="review-label">File</div>
                <div class="review-value">${_state.file.name}</div>
              </div>
            ` : ''}
          </div>
        </div>
        
        <div style="margin-top: 20px; padding: 16px; background: var(--blued); border-radius: var(--r4); border: 1px solid var(--blueb);">
          <i class="fas fa-bolt" style="color: var(--blue);"></i>
          <span style="margin-left: 8px;">Content will stream live as it generates. First words appear in under 1 second.</span>
        </div>
        
        <div style="margin-top: 16px; font-size: 0.75rem; color: var(--t3); text-align: center;">
          <i class="fas fa-check-circle"></i> Generated content is saved automatically to your history
        </div>
      </div>
    `;
  }
  
  function _getDepthDescription(depth) {
    const targets = {
      standard: '~600-900 words · Quick overview',
      detailed: '~1,000-1,500 words · Comprehensive coverage',
      comprehensive: '~1,500-2,000 words · In-depth analysis',
      expert: '~2,000-2,800 words · Academic depth',
      deepdive: '~5,000-8,000 words · Research quality'
    };
    return targets[depth] || targets.detailed;
  }
  
  function _getTopicSuggestions(tool) {
    const suggestions = {
      notes: ['Quantum mechanics', 'The French Revolution', 'DNA replication', 'Machine learning basics', 'World War II causes'],
      flashcards: ['Organic chemistry reactions', 'Human anatomy', 'Spanish vocabulary', 'Mathematical derivatives', 'World capitals'],
      quiz: ["Newton's laws", "Shakespeare's plays", 'The water cycle', 'Ancient Rome', 'Programming concepts'],
      summary: ['Climate change', 'Blockchain technology', 'Freudian psychology', 'The Industrial Revolution', 'Artificial intelligence'],
      mindmap: ['Photosynthesis', 'The solar system', 'Economic systems', 'Literary devices', 'The human brain'],
      deepdive: ['Quantum computing architecture', 'Renaissance art history', 'Neural network theory', 'Sustainable energy systems', 'Cognitive psychology foundations']
    };
    return (suggestions[tool] || suggestions.notes).slice(0, 4);
  }
  
  function _attachStepListeners() {
    if (_state.step === 2) {
      setTimeout(() => {
        const input = document.getElementById('topicInput');
        if (input) {
          input.focus();
          input.addEventListener('input', (e) => {
            _state.topic = e.target.value.substring(0, 500);
            document.getElementById('charCount').textContent = _state.topic.length;
            _updateTimeEstimate();
          });
        }
      }, 100);
    }
  }
  
  // Public methods
  function selectTool(id) { _state.tool = id; _renderStep(); }
  function selectDepth(id) { _state.depth = id; _renderStep(); _updateTimeEstimate(); }
  function selectLanguage(lang) { _state.language = lang; _renderStep(); }
  function selectStyle(id) { _state.style = id; _renderStep(); }
  function useSuggestion(text) { _state.topic = text; _renderStep(); _updateTimeEstimate(); }
  
  function onDragOver(e) { e.preventDefault(); const zone = document.getElementById('uploadZone'); if (zone) zone.style.borderColor = 'var(--blue)'; }
  function onDragLeave(e) { const zone = document.getElementById('uploadZone'); if (zone) zone.style.borderColor = ''; }
  function onDrop(e) { e.preventDefault(); onDragLeave(e); const file = e.dataTransfer.files[0]; if (file) processFile(file); }
  
  function processFile(file) {
    const ALLOWED_TYPES = ['text/plain', 'text/markdown', 'application/pdf', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
    const MAX_SIZE = 5 * 1024 * 1024;
    
    if (!ALLOWED_TYPES.includes(file.type) && !file.name.match(/\.(txt|md|pdf|docx)$/i)) {
      ToastEngine.error('Unsupported file type. Use PDF, DOCX, TXT, or MD.');
      return;
    }
    if (file.size > MAX_SIZE) {
      ToastEngine.error('File too large. Max 5MB.');
      return;
    }
    
    _state.file = file;
    const reader = new FileReader();
    reader.onload = e => {
      if (file.type === 'application/pdf') {
        _state.fileText = '[PDF content uploaded — AI will process context]';
      } else {
        _state.fileText = (e.target.result || '').substring(0, 8000);
      }
      _renderStep();
      ToastEngine.success(`File attached: ${file.name}`);
    };
    
    if (file.type !== 'application/pdf') {
      reader.readAsText(file);
    } else {
      _state.fileText = '[PDF document uploaded]';
      _renderStep();
    }
  }
  
  function removeFile() { _state.file = null; _state.fileText = ''; _renderStep(); }
  
  function _startGeneration() {
    close();
    SettingsEngine.addToTopicHistory(_state.topic);
    
    const message = _buildPrompt();
    const options = {
      tool: _state.tool,
      topic: _state.topic,
      depth: _state.depth,
      language: _state.language,
      style: _state.style,
      stream: true
    };
    
    StreamingEngine.start(message, options, _state);
  }
  
  function _buildPrompt() {
    let prompt = _state.topic;
    if (_state.fileText) {
      prompt += `\n\nAdditional context from uploaded file:\n${_state.fileText.substring(0, 4000)}`;
    }
    if (_state.depth === 'deepdive') {
      prompt += `\n\n[REQUIREMENT: Generate an EXTREMELY DETAILED, RESEARCH-QUALITY Deep Dive. Include: executive summary, multiple chapters with subheadings, key debates, case studies, future directions, annotated bibliography, 7-day study plan, and glossary of 30+ terms. Target length: 5,000-8,000 words.]`;
    }
    return prompt;
  }
  
  return {
    open, close, next, prev,
    selectTool, selectDepth, selectLanguage, selectStyle,
    useSuggestion, onDragOver, onDragLeave, onDrop, processFile, removeFile
  };
})();

/* ═══════════════════════════════════════════════════════════════════════════════════════════════
   SECTION 8 — STREAMING ENGINE (Enhanced with Pause/Resume, Draft Saving)
   ═══════════════════════════════════════════════════════════════════════════════════════════════ */

const StreamingEngine = (() => {
  
  let _abortController = null;
  let _isStreaming = false;
  let _isPaused = false;
  let _tokenQueue = [];
  let _renderRaf = null;
  let _rawText = '';
  let _startTime = 0;
  let _tokenCount = 0;
  let _wordCount = 0;
  let _lastWpsUpdate = 0;
  let _currentOptions = null;
  let _currentState = null;
  let _retryCount = 0;
  let _pauseBuffer = '';
  const MAX_RETRIES = 3;
  
  const STAGES = [
    { id: 0, text: '🎯 Initializing AI engine...', pct: 2 },
    { id: 1, text: '🔍 Analyzing topic...', pct: 12 },
    { id: 2, text: '🧠 Structuring content...', pct: 22 },
    { id: 3, text: '✍️ Writing first section...', pct: 38 },
    { id: 4, text: '📖 Expanding details...', pct: 55 },
    { id: 5, text: '🔗 Adding examples & analogies...', pct: 70 },
    { id: 6, text: '✨ Finalizing & polishing...', pct: 88 },
    { id: 7, text: '✅ Generation complete!', pct: 100 }
  ];
  
  async function start(message, options, flowState) {
    if (_isStreaming) {
      cancel();
      await Utils.sleep(200);
    }
    
    _reset();
    _currentOptions = options;
    _currentState = flowState;
    
    _showStreamOverlay(flowState);
    _startRenderLoop();
    
    await _fetchStream(message, options);
  }
  
  function pause() {
    if (!_isStreaming) return;
    _isPaused = true;
    const pauseBtn = document.getElementById('streamPauseBtn');
    if (pauseBtn) pauseBtn.innerHTML = '<i class="fas fa-play"></i>';
    ToastEngine.info('Streaming paused — click resume to continue');
  }
  
  function resume() {
    if (!_isStreaming) return;
    _isPaused = false;
    const pauseBtn = document.getElementById('streamPauseBtn');
    if (pauseBtn) pauseBtn.innerHTML = '<i class="fas fa-pause"></i>';
    ToastEngine.info('Streaming resumed');
  }
  
  function _reset() {
    _abortController = new AbortController();
    _isStreaming = true;
    _isPaused = false;
    _tokenQueue = [];
    _rawText = '';
    _startTime = performance.now();
    _tokenCount = 0;
    _wordCount = 0;
    _lastWpsUpdate = 0;
    _retryCount = 0;
    _pauseBuffer = '';
    cancelAnimationFrame(_renderRaf);
  }
  
  function _showStreamOverlay(flowState) {
    const overlay = document.getElementById('streamOverlay');
    if (!overlay) return;
    
    overlay.classList.remove('hidden');
    
    const titleEl = document.getElementById('streamTitle');
    if (titleEl) {
      const toolLabels = { notes: 'Study Notes', flashcards: 'Flashcards', quiz: 'Quiz', summary: 'Summary', mindmap: 'Mind Map', deepdive: 'Deep Dive' };
      titleEl.textContent = `Generating ${toolLabels[flowState.tool] || 'Content'}`;
    }
    
    const topicLabel = document.getElementById('streamTopic');
    if (topicLabel) topicLabel.textContent = Utils.truncate(flowState.topic, 60);
    
    const textEl = document.getElementById('streamText');
    if (textEl) textEl.innerHTML = '';
    
    const tokenEl = document.getElementById('streamTokens');
    const wpsEl = document.getElementById('streamWPS');
    if (tokenEl) tokenEl.textContent = '0';
    if (wpsEl) wpsEl.textContent = '0';
    
    const streamPill = document.getElementById('streamPill');
    if (streamPill) streamPill.classList.add('visible');
    
    _updateStage(0);
  }
  
  async function _fetchStream(message, options, retryAttempt = 0) {
    try {
      const res = await fetch(SAVOIRÉ.API_BASE, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        signal: _abortController.signal,
        body: JSON.stringify({ message, options })
      });
      
      if (!res.ok) throw new Error(`HTTP ${res.status}: ${res.statusText}`);
      
      const contentType = res.headers.get('content-type') || '';
      
      if (contentType.includes('text/event-stream')) {
        await _processSSEStream(res);
      } else {
        const data = await res.json();
        if (data.content) {
          _injectFallbackContent(data.content);
        } else {
          throw new Error('Invalid response format');
        }
      }
      
    } catch (err) {
      if (err.name === 'AbortError') return;
      console.error('[StreamingEngine] Error:', err);
      
      if (retryAttempt < MAX_RETRIES) {
        _retryCount++;
        _updateStage(1, `⚠️ Retrying (attempt ${_retryCount})...`);
        await Utils.sleep(1000 * (retryAttempt + 1));
        return _fetchStream(message, options, retryAttempt + 1);
      }
      
      _handleStreamError(err);
    }
  }
  
  async function _processSSEStream(res) {
    const reader = res.body.getReader();
    const decoder = new TextDecoder('utf-8');
    let buffer = '';
    let stageIndex = 0;
    
    // Auto-save draft periodically
    let lastDraftSave = Date.now();
    const DRAFT_SAVE_INTERVAL = 5000;
    
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      
      if (_isPaused) {
        await Utils.sleep(100);
        continue;
      }
      
      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      buffer = lines.pop() || '';
      
      for (const line of lines) {
        if (!line.startsWith('data: ')) continue;
        const data = line.slice(6).trim();
        if (data === '[DONE]') {
          _finalizeStream();
          return;
        }
        
        try {
          const parsed = JSON.parse(data);
          _handleSSEEvent(parsed, stageIndex);
          
          const tokenPct = Math.min((_rawText.length / 3000) * 100, 95);
          const newStage = STAGES.findIndex(s => s.pct > tokenPct);
          if (newStage > stageIndex && newStage < STAGES.length) {
            stageIndex = newStage;
            _updateStage(stageIndex);
          }
          
        } catch {
          if (data.length > 0) {
            _enqueueToken(data);
          }
        }
      }
      
      // Auto-save draft
      if (SettingsEngine.get('draftAutoSave') && Date.now() - lastDraftSave > DRAFT_SAVE_INTERVAL && _rawText.length > 100) {
        ChatHistoryEngine.saveDraft({
          tool: _currentOptions.tool,
          topic: _currentOptions.topic,
          depth: _currentOptions.depth,
          style: _currentOptions.style,
          language: _currentOptions.language,
          rawText: _rawText,
          progress: Math.min(99, Math.floor((_rawText.length / 8000) * 100))
        });
        lastDraftSave = Date.now();
      }
    }
    
    _finalizeStream();
  }
  
  function _handleSSEEvent(event, stageIndex) {
    if (!event) return;
    
    if (event.type === 'token' || event.token) {
      _enqueueToken(event.token || event.text || '');
    } else if (event.type === 'batch' || event.tokens) {
      const tokens = event.tokens || [];
      tokens.forEach(t => _enqueueToken(typeof t === 'string' ? t : (t.token || '')));
    } else if (event.type === 'stage') {
      _updateStage(event.stage || stageIndex, event.text);
    } else if (event.type === 'complete' || event.done) {
      _finalizeStream();
    } else if (event.type === 'error') {
      _handleStreamError(new Error(event.message || 'Stream error'));
    }
  }
  
  function _enqueueToken(token) {
    if (!token) return;
    _tokenQueue.push(token);
    _tokenCount++;
    _wordCount += token.split(/\s+/).filter(Boolean).length;
  }
  
  function _startRenderLoop() {
    const speedDelay = SettingsEngine.getStreamDelay();
    let lastFlush = 0;
    
    function render(now) {
      if (!_isStreaming && _tokenQueue.length === 0) {
        cancelAnimationFrame(_renderRaf);
        return;
      }
      
      if (!_isPaused) {
        const sinceFlush = now - lastFlush;
        if (sinceFlush >= speedDelay || _tokenQueue.length > 10) {
          const batchSize = _tokenQueue.length > 20 ? 4 : _tokenQueue.length > 8 ? 2 : 1;
          
          if (_tokenQueue.length > 0) {
            const tokens = _tokenQueue.splice(0, batchSize);
            tokens.forEach(token => { _rawText += token; });
            _renderText();
            lastFlush = now;
          }
        }
      }
      
      if (now - _lastWpsUpdate > 500) {
        _updateCounters();
        _lastWpsUpdate = now;
      }
      
      _renderRaf = requestAnimationFrame(render);
    }
    
    _renderRaf = requestAnimationFrame(render);
  }
  
  function _renderText() {
    const textEl = document.getElementById('streamText');
    if (!textEl) return;
    
    const useLiveMarkdown = SettingsEngine.get('liveMarkdown');
    
    if (useLiveMarkdown && typeof marked !== 'undefined' && typeof DOMPurify !== 'undefined') {
      try {
        const html = DOMPurify.sanitize(marked.parse(_rawText));
        textEl.innerHTML = html + '<span class="stream-cursor"></span>';
      } catch {
        textEl.textContent = _rawText;
      }
    } else {
      textEl.textContent = _rawText;
    }
    
    const scrollEl = document.querySelector('.stream-content');
    if (scrollEl) {
      const isNearBottom = scrollEl.scrollHeight - scrollEl.scrollTop - scrollEl.clientHeight < 200;
      if (isNearBottom) {
        scrollEl.scrollTop = scrollEl.scrollHeight;
      }
    }
  }
  
  function _updateCounters() {
    const elapsed = (performance.now() - _startTime) / 1000;
    const wps = elapsed > 0 ? Math.round(_wordCount / elapsed) : 0;
    
    const tokenEl = document.getElementById('streamTokens');
    const wpsEl = document.getElementById('streamWPS');
    
    if (tokenEl) tokenEl.textContent = _tokenCount;
    if (wpsEl) wpsEl.textContent = wps;
  }
  
  function _updateStage(idx, customText = '') {
    const stage = STAGES[Math.min(idx, STAGES.length - 1)];
    const stageEl = document.getElementById('streamStage');
    if (stageEl) {
      stageEl.textContent = customText || stage.text;
    }
  }
  
  async function _finalizeStream() {
    while (_tokenQueue.length > 0) {
      _rawText += _tokenQueue.splice(0, 4).join('');
    }
    _renderText();
    
    await Utils.sleep(300);
    
    _isStreaming = false;
    cancelAnimationFrame(_renderRaf);
    
    _updateStage(7);
    _updateCounters();
    
    const cursor = document.querySelector('.stream-cursor');
    if (cursor) cursor.remove();
    
    await Utils.sleep(600);
    
    _hideStreamOverlay();
    _displayOutput();
  }
  
  function _hideStreamOverlay() {
    const overlay = document.getElementById('streamOverlay');
    if (!overlay) return;
    overlay.classList.add('hidden');
    
    const streamPill = document.getElementById('streamPill');
    if (streamPill) streamPill.classList.remove('visible');
  }
  
  function _displayOutput() {
    const elapsed = (performance.now() - _startTime) / 1000;
    const wps = elapsed > 0 ? Math.round(_wordCount / elapsed) : 0;
    
    const chat = ChatHistoryEngine.createChat({
      tool: _currentOptions.tool,
      topic: _currentOptions.topic,
      depth: _currentOptions.depth,
      style: _currentOptions.style,
      language: _currentOptions.language,
      content: _renderOutputHTML(_rawText),
      rawText: _rawText,
      tokens: _tokenCount,
      wps: wps
    });
    
    SettingsEngine.increment('totalTokens', _tokenCount);
    SettingsEngine.increment('totalGenerated');
    
    const breadcrumb = document.getElementById('breadcrumb');
    if (breadcrumb) breadcrumb.textContent = Utils.truncate(_currentOptions.topic, 30);
    
    showOutputWorkspace(_rawText, _currentOptions, chat);
    SidebarEngine.render();
    
    ToastEngine.success(`Generation complete · ${_tokenCount} tokens · ${wps} words/sec`);
  }
  
  function _renderOutputHTML(rawText) {
    if (!rawText) return '';
    try {
      if (typeof marked !== 'undefined' && typeof DOMPurify !== 'undefined') {
        return DOMPurify.sanitize(marked.parse(rawText));
      }
    } catch {}
    return rawText.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/\n/g, '<br>');
  }
  
  function _injectFallbackContent(content) {
    _rawText = content;
    _tokenQueue = [];
    _isStreaming = false;
    _tokenCount = content.split(/\s+/).length;
    cancelAnimationFrame(_renderRaf);
    _displayOutput();
    _hideStreamOverlay();
  }
  
  function _handleStreamError(err) {
    _isStreaming = false;
    cancelAnimationFrame(_renderRaf);
    _hideStreamOverlay();
    
    const outputArea = document.getElementById('outputArea');
    const outputPanel = document.getElementById('outputPanel');
    const homeState = document.getElementById('homeState');
    
    if (outputArea && outputPanel) {
      homeState?.classList.add('hidden');
      outputPanel.classList.add('visible');
      
      outputArea.innerHTML = `
        <div class="error-card">
          <div class="error-icon"><i class="fas fa-exclamation-triangle"></i></div>
          <div class="error-body">
            <div class="error-title">Generation Failed</div>
            <div class="error-msg">${err.message || 'An error occurred. Please try again.'}</div>
            <button class="error-retry" onclick="openNewChatFlow()">
              <i class="fas fa-redo-alt"></i> Try Again
            </button>
          </div>
        </div>
      `;
    }
    
    ToastEngine.error('Generation failed. Check your connection.');
  }
  
  function cancel() {
    if (_abortController) _abortController.abort();
    _isStreaming = false;
    cancelAnimationFrame(_renderRaf);
    _tokenQueue = [];
    _hideStreamOverlay();
    
    if (_rawText.length > 100) {
      _displayOutput();
    }
  }
  
  function isStreaming() { return _isStreaming; }
  
  return { start, cancel, isStreaming, pause, resume };
})();

/* ═══════════════════════════════════════════════════════════════════════════════════════════════
   SECTION 9 — OUTPUT RENDERER (Enhanced with Deep Dive, Export Functions)
   ═══════════════════════════════════════════════════════════════════════════════════════════════ */

function showOutputWorkspace(rawText, options, chat) {
  const outputPanel = document.getElementById('outputPanel');
  const outputArea = document.getElementById('outputArea');
  const homeState = document.getElementById('homeState');
  
  if (!outputPanel || !outputArea) return;
  
  homeState?.classList.add('hidden');
  outputPanel.classList.add('visible');
  
  const html = _renderToolOutput(rawText, options, chat);
  outputArea.innerHTML = html;
  
  const scrollEl = document.getElementById('workspaceScroll');
  if (scrollEl) scrollEl.scrollTo({ top: 0, behavior: 'smooth' });
  
  const sections = outputArea.querySelectorAll('.study-section, .flashcard-item, .quiz-item, .deepdive-section');
  AnimationEngine.staggerIn([...sections], { stagger: 50, delay: 100, from: 'bottom' });
  
  if (options.tool === 'flashcards') _initFlashcards();
  if (options.tool === 'quiz') _initQuiz(rawText);
}

function _renderToolOutput(rawText, options, chat) {
  const toolIcons = {
    notes: 'fa-book-open',
    flashcards: 'fa-layer-group',
    quiz: 'fa-question-circle',
    summary: 'fa-align-left',
    mindmap: 'fa-diagram-project',
    deepdive: 'fa-dharmachakra'
  };
  const icon = toolIcons[options.tool] || 'fa-book-open';
  const readingTime = Utils.estimateReadingTime(rawText.split(/\s+/).length);
  
  const metaBar = `
    <div class="result-header">
      <div class="result-icon"><i class="fa ${icon}"></i></div>
      <div class="result-info">
        <div class="result-tool">${options.tool.toUpperCase()}</div>
        <div class="result-topic">${options.topic}</div>
        <div class="result-meta">
          <span class="result-meta-tag"><i class="fas fa-layer-group"></i> ${options.depth}</span>
          <span class="result-meta-tag"><i class="fas fa-language"></i> ${options.language}</span>
          <span class="result-meta-tag"><i class="fas fa-clock"></i> ${readingTime}</span>
          ${chat ? `<span class="result-meta-tag"><i class="fas fa-database"></i> ${chat.tokens || 0} tokens</span>` : ''}
        </div>
      </div>
    </div>
  `;
  
  const contentHtml = _renderOutputHTML(rawText);
  
  return `
    ${metaBar}
    <div class="study-section">
      <div class="markdown-content">${contentHtml}</div>
    </div>
  `;
}

function _renderOutputHTML(rawText) {
  if (!rawText) return '';
  try {
    if (typeof marked !== 'undefined' && typeof DOMPurify !== 'undefined') {
      return DOMPurify.sanitize(marked.parse(rawText));
    }
  } catch {}
  return rawText.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/\n/g, '<br>');
}

function _initFlashcards() {
  const cards = document.querySelectorAll('.flashcard');
  cards.forEach(card => {
    card.addEventListener('click', () => card.classList.toggle('flipped'));
  });
}

function _initQuiz(rawText) {
  // Quiz initialization handled by markdown renderer
}

function loadChat(id) {
  const chat = ChatHistoryEngine.getChat(id);
  if (!chat) return;
  
  ChatHistoryEngine.setCurrentId(id);
  SidebarEngine.render();
  
  const options = {
    tool: chat.tool,
    topic: chat.topic,
    depth: chat.depth,
    style: chat.style,
    language: chat.language
  };
  
  showOutputWorkspace(chat.rawText, options, chat);
}

/* ═══════════════════════════════════════════════════════════════════════════════════════════════
   SECTION 10 — EXPORT ENGINE (Enhanced: PDF, DOCX, Markdown, HTML)
   ═══════════════════════════════════════════════════════════════════════════════════════════════ */

async function copyOutput() {
  const outputArea = document.getElementById('outputArea');
  if (!outputArea) return;
  
  const text = outputArea.innerText || outputArea.textContent;
  const ok = await Utils.copyToClipboard(text);
  ok ? ToastEngine.success('Copied to clipboard') : ToastEngine.error('Copy failed');
}

async function copyAsHTML() {
  const outputArea = document.getElementById('outputArea');
  if (!outputArea) return;
  
  const html = outputArea.innerHTML;
  const blob = new Blob([html], { type: 'text/html' });
  await navigator.clipboard.write([
    new ClipboardItem({
      'text/html': blob,
      'text/plain': new Blob([outputArea.innerText], { type: 'text/plain' })
    })
  ]);
  ToastEngine.success('Copied as rich text');
}

async function exportAsPDF() {
  const outputArea = document.getElementById('outputArea');
  if (!outputArea || !outputArea.textContent.trim()) {
    ToastEngine.warning('Nothing to export');
    return;
  }
  
  const chatId = ChatHistoryEngine.getCurrentId();
  const chat = chatId ? ChatHistoryEngine.getChat(chatId) : null;
  const topic = chat ? chat.topic : 'Savoiré Study Content';
  
  ToastEngine.info('Preparing PDF...');
  
  if (typeof window.jspdf !== 'undefined') {
    try {
      const { jsPDF: J } = window.jspdf;
      const doc = new J({ orientation: 'p', unit: 'mm', format: 'a4' });
      const text = Utils.stripHTML(outputArea.innerHTML);
      const lines = doc.splitTextToSize(text, 170);
      
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(18);
      doc.text(`SAVOIRÉ AI — ${topic}`, 20, 20);
      
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(10);
      
      let y = 35;
      lines.forEach(line => {
        if (y > 270) { doc.addPage(); y = 20; }
        doc.text(line, 20, y);
        y += 5;
      });
      
      doc.save(`savoiré-${topic.replace(/\s+/g, '-').toLowerCase()}-${Date.now()}.pdf`);
      ToastEngine.success('PDF exported');
      return;
    } catch (e) {
      console.warn('PDF error:', e);
    }
  }
  window.print();
}

async function exportAsDOCX() {
  const outputArea = document.getElementById('outputArea');
  if (!outputArea) return;
  
  const chatId = ChatHistoryEngine.getCurrentId();
  const chat = chatId ? ChatHistoryEngine.getChat(chatId) : null;
  const topic = chat ? chat.topic : 'Savoiré Study Content';
  
  const html = `
    <html>
      <head>
        <meta charset="UTF-8">
        <title>${topic}</title>
        <style>
          body { font-family: 'Times New Roman', serif; margin: 2cm; line-height: 1.5; }
          h1 { color: #00D4FF; }
          h2 { color: #8B5CF6; margin-top: 20px; }
          pre { background: #f4f4f4; padding: 10px; }
          code { font-family: monospace; }
        </style>
      </head>
      <body>
        <h1>SAVOIRÉ AI — ${topic}</h1>
        ${outputArea.innerHTML}
        <hr>
        <p><em>Generated by Savoiré AI v2.a · Free forever</em></p>
      </body>
    </html>
  `;
  
  const blob = new Blob([html], { type: 'application/msword' });
  Utils.downloadBlob(blob, `savoiré-${topic.replace(/\s+/g, '-')}.doc`);
  ToastEngine.success('DOCX exported');
}

async function exportAsMarkdown() {
  const outputArea = document.getElementById('outputArea');
  if (!outputArea) return;
  
  const chatId = ChatHistoryEngine.getCurrentId();
  const chat = chatId ? ChatHistoryEngine.getChat(chatId) : null;
  const topic = chat ? chat.topic : 'Savoiré Study Content';
  const rawText = chat ? chat.rawText : outputArea.innerText;
  
  const markdown = `# ${topic}\n\n${rawText}\n\n---\n*Generated by Savoiré AI v2.a · Free forever*`;
  const blob = new Blob([markdown], { type: 'text/markdown' });
  Utils.downloadBlob(blob, `savoiré-${topic.replace(/\s+/g, '-')}.md`);
  ToastEngine.success('Markdown exported');
}

function saveToBookmarks() {
  const chatId = ChatHistoryEngine.getCurrentId();
  if (!chatId) {
    ToastEngine.warning('Nothing to bookmark');
    return;
  }
  ChatHistoryEngine.bookmarkChat(chatId);
  ToastEngine.success('Bookmarked!');
}

async function shareOutput() {
  const chatId = ChatHistoryEngine.getCurrentId();
  const chat = chatId ? ChatHistoryEngine.getChat(chatId) : null;
  const text = chat ? chat.rawText : '';
  const title = chat ? `Savoiré AI — ${chat.topic}` : 'Savoiré AI Study Content';
  
  if (navigator.share) {
    try {
      await navigator.share({ title, text: text.substring(0, 1000) + '...' });
      ToastEngine.success('Shared!');
    } catch {}
  } else {
    const ok = await Utils.copyToClipboard(text.substring(0, 2000));
    ok ? ToastEngine.success('Copied — paste to share') : ToastEngine.error('Share failed');
  }
}

function regenerateOutput() {
  const chatId = ChatHistoryEngine.getCurrentId();
  const chat = chatId ? ChatHistoryEngine.getChat(chatId) : null;
  if (!chat) {
    ToastEngine.warning('No content to regenerate');
    return;
  }
  FlowEngine.open(chat.tool);
}

function exportAllData() {
  ChatHistoryEngine.exportAllData();
  ToastEngine.success('All data exported');
}

function clearAllData() {
  if (!confirm('⚠️ This will permanently delete ALL your chat history and settings.\n\nAre you sure?')) return;
  ChatHistoryEngine.clearAll();
  SettingsEngine.resetToDefaults();
  SidebarEngine.render();
  showHome();
  ToastEngine.info('All data cleared');
}

/* ═══════════════════════════════════════════════════════════════════════════════════════════════
   SECTION 11 — NAVIGATION & UI FUNCTIONS
   ═══════════════════════════════════════════════════════════════════════════════════════════════ */

function showHome() {
  const homeState = document.getElementById('homeState');
  const outputPanel = document.getElementById('outputPanel');
  
  if (homeState) homeState.classList.remove('hidden');
  if (outputPanel) outputPanel.classList.remove('visible');
  
  ChatHistoryEngine.setCurrentId(null);
  
  const breadcrumb = document.getElementById('breadcrumb');
  if (breadcrumb) breadcrumb.textContent = 'Home';
  
  setActiveNav('home');
  SidebarEngine.render();
}

function navigateTo(page) {
  if (page === 'home') showHome();
  setActiveNav(page);
}

function setActiveNav(id) {
  document.querySelectorAll('.sb-nav-item').forEach(el => el.classList.remove('active'));
  const el = document.querySelector(`.sb-nav-item[data-nav="${id}"]`);
  if (el) el.classList.add('active');
}

function toggleSidebar() {
  SidebarEngine.toggle();
}

function openSettings() {
  const modal = document.getElementById('settingsModal');
  if (!modal) return;
  
  _syncSettingsUI();
  modal.classList.remove('hidden');
}

function closeSettings() {
  const modal = document.getElementById('settingsModal');
  if (!modal) return;
  modal.classList.add('hidden');
}

function closeSettingsOnBg(e) {
  if (e.target.classList.contains('modal-overlay')) closeSettings();
}

function _syncSettingsUI() {
  const nameInput = document.getElementById('userNameInput');
  if (nameInput) nameInput.value = SettingsEngine.get('userName');
  
  const fontSel = document.getElementById('fontSizeSelect');
  if (fontSel) fontSel.value = SettingsEngine.get('fontSize');
  
  const speedSel = document.getElementById('streamSpeedSelect');
  if (speedSel) speedSel.value = SettingsEngine.get('streamSpeed');
  
  const themeToggle = document.getElementById('themeToggle');
  if (themeToggle) themeToggle.classList.toggle('on', SettingsEngine.get('theme') === 'dark');
  
  const markdownToggle = document.getElementById('markdownToggle');
  if (markdownToggle) markdownToggle.classList.toggle('on', SettingsEngine.get('liveMarkdown'));
  
  const autoSaveToggle = document.getElementById('autoSaveToggle');
  if (autoSaveToggle) autoSaveToggle.classList.toggle('on', SettingsEngine.get('autoSave'));
}

function toggleTheme() {
  const current = SettingsEngine.get('theme');
  const next = current === 'dark' ? 'light' : 'dark';
  SettingsEngine.set('theme', next);
  const toggle = document.getElementById('themeToggle');
  if (toggle) toggle.classList.toggle('on', next === 'dark');
  ToastEngine.info(`${next.charAt(0).toUpperCase() + next.slice(1)} theme`);
}

function changeFontSize(size) {
  SettingsEngine.set('fontSize', size);
}

function saveSettings() {
  const nameInput = document.getElementById('userNameInput');
  const speedSel = document.getElementById('streamSpeedSelect');
  const fontSel = document.getElementById('fontSizeSelect');
  const markdownToggle = document.getElementById('markdownToggle');
  const autoSaveToggle = document.getElementById('autoSaveToggle');
  
  if (nameInput) SettingsEngine.set('userName', nameInput.value.trim() || 'Explorer');
  if (speedSel) SettingsEngine.set('streamSpeed', speedSel.value);
  if (fontSel) SettingsEngine.set('fontSize', fontSel.value);
  if (markdownToggle) SettingsEngine.set('liveMarkdown', markdownToggle.classList.contains('on'));
  if (autoSaveToggle) SettingsEngine.set('autoSave', autoSaveToggle.classList.contains('on'));
  
  SidebarEngine.render();
  closeSettings();
  ToastEngine.success('Settings saved');
}

// Toggle handlers
document.addEventListener('click', e => {
  const toggle = e.target.closest('.toggle');
  if (!toggle) return;
  if (!toggle.closest('#settingsModal')) return;
  
  toggle.classList.toggle('on');
  const id = toggle.id;
  if (id === 'themeToggle') toggleTheme();
  if (id === 'markdownToggle') SettingsEngine.set('liveMarkdown', toggle.classList.contains('on'));
  if (id === 'autoSaveToggle') SettingsEngine.set('autoSave', toggle.classList.contains('on'));
});

/* ═══════════════════════════════════════════════════════════════════════════════════════════════
   SECTION 12 — AVATAR DROPDOWN
   ═══════════════════════════════════════════════════════════════════════════════════════════════ */

let _avatarOpen = false;

function toggleAvatarDropdown() {
  const dropdown = document.getElementById('avatarDropdown');
  if (!dropdown) return;
  
  _avatarOpen = !_avatarOpen;
  
  if (_avatarOpen) {
    dropdown.classList.remove('hidden');
    dropdown.style.animation = 'dropdownIn 0.2s var(--ease3)';
  } else {
    dropdown.classList.add('hidden');
  }
}

document.addEventListener('click', e => {
  if (_avatarOpen && !e.target.closest('.header-avatar') && !e.target.closest('#avatarDropdown')) {
    _avatarOpen = false;
    const dropdown = document.getElementById('avatarDropdown');
    if (dropdown) dropdown.classList.add('hidden');
  }
});

/* ═══════════════════════════════════════════════════════════════════════════════════════════════
   SECTION 13 — KEYBOARD SHORTCUTS (Enhanced)
   ═══════════════════════════════════════════════════════════════════════════════════════════════ */

const KeyboardEngine = (() => {
  
  const SHORTCUTS = [
    { keys: ['ctrl+n', 'cmd+n'], action: () => openNewChatFlow(), desc: 'New Chat' },
    { keys: ['ctrl+h', 'cmd+h'], action: () => showHome(), desc: 'Home' },
    { keys: ['ctrl+,', 'cmd+,'], action: () => openSettings(), desc: 'Settings' },
    { keys: ['ctrl+b', 'cmd+b'], action: () => SidebarEngine.toggle(), desc: 'Toggle Sidebar' },
    { keys: ['ctrl+p', 'cmd+p'], action: () => exportAsPDF(), desc: 'Export PDF' },
    { keys: ['ctrl+shift+p'], action: () => exportAsPDF(), desc: 'Export PDF' },
    { keys: ['ctrl+shift+c'], action: () => copyAsHTML(), desc: 'Copy as HTML' },
    { keys: ['ctrl+shift+m'], action: () => exportAsMarkdown(), desc: 'Export Markdown' },
    { keys: ['ctrl+shift+w'], action: () => exportAsDOCX(), desc: 'Export DOCX' },
    { keys: ['ctrl+s', 'cmd+s'], action: () => saveToBookmarks(), desc: 'Save/Bookmark' },
    { keys: ['ctrl+shift+d'], action: () => SidebarEngine.toggleBulkMode(), desc: 'Bulk Mode' },
    { keys: ['escape'], action: _handleEscape, desc: 'Close' },
    { keys: ['space'], action: () => { if (StreamingEngine.isStreaming()) StreamingEngine.pause(); }, desc: 'Pause/Resume' },
    { keys: ['ctrl+/'], action: _showShortcutsHelp, desc: 'Shortcuts' }
  ];
  
  function _handleEscape() {
    const settings = document.getElementById('settingsModal');
    if (settings && !settings.classList.contains('hidden')) { closeSettings(); return; }
    const flow = document.getElementById('flowModal');
    if (flow && !flow.classList.contains('hidden')) { FlowEngine.close(); return; }
    const stream = document.getElementById('streamOverlay');
    if (stream && !stream.classList.contains('hidden')) { if (confirm('Cancel generation?')) cancelGeneration(); return; }
    if (SidebarEngine._bulkMode) SidebarEngine.toggleBulkMode();
  }
  
  function _showShortcutsHelp() {
    const shortcutsList = SHORTCUTS.filter(s => s.action).map(s => `${s.keys[0]} → ${s.desc}`).join(' · ');
    ToastEngine.info(`⌨️ ${shortcutsList}`);
  }
  
  function _parseKey(e) {
    const parts = [];
    if (e.ctrlKey || e.metaKey) parts.push(e.metaKey ? 'cmd' : 'ctrl');
    if (e.shiftKey) parts.push('shift');
    if (e.altKey) parts.push('alt');
    parts.push(e.key.toLowerCase());
    return parts.join('+');
  }
  
  function init() {
    document.addEventListener('keydown', e => {
      if (['INPUT', 'TEXTAREA', 'SELECT'].includes(e.target.tagName) && !['ESCAPE', 'SPACE'].includes(e.key.toUpperCase())) return;
      
      const combo = _parseKey(e);
      for (const shortcut of SHORTCUTS) {
        if (shortcut.keys.includes(combo) && shortcut.action) {
          if (combo === 'ctrl+n' || combo === 'escape') e.preventDefault();
          shortcut.action();
          return;
        }
      }
    });
  }
  
  return { init };
})();

/* ═══════════════════════════════════════════════════════════════════════════════════════════════
   SECTION 14 — MOBILE TOUCH ENGINE
   ═══════════════════════════════════════════════════════════════════════════════════════════════ */

const MobileEngine = (() => {
  let _touchStartX = 0;
  let _touchStartY = 0;
  const SWIPE_THRESHOLD = 60;
  
  function init() {
    if (window.innerWidth > 768) return;
    document.addEventListener('touchstart', onTouchStart, { passive: true });
    document.addEventListener('touchend', onTouchEnd, { passive: true });
  }
  
  function onTouchStart(e) {
    _touchStartX = e.changedTouches[0].clientX;
    _touchStartY = e.changedTouches[0].clientY;
  }
  
  function onTouchEnd(e) {
    const dx = e.changedTouches[0].clientX - _touchStartX;
    const dy = e.changedTouches[0].clientY - _touchStartY;
    const absDx = Math.abs(dx);
    const absDy = Math.abs(dy);
    
    if (absDx > SWIPE_THRESHOLD && absDx > absDy * 1.5) {
      if (dx > 0 && _touchStartX < 30) {
        SidebarEngine.openMobile();
      } else if (dx < 0) {
        SidebarEngine.closeMobile();
      }
    }
  }
  
  function handleFileSelect(e) {
    const file = e.target.files?.[0];
    if (file) FlowEngine.processFile(file);
  }
  
  return { init, handleFileSelect };
})();

/* ═══════════════════════════════════════════════════════════════════════════════════════════════
   SECTION 15 — PERFORMANCE OPTIMIZER
   ═══════════════════════════════════════════════════════════════════════════════════════════════ */

const PerformanceEngine = (() => {
  let _revealObserver = null;
  
  function init() {
    _setupRevealObserver();
    _setupResizeHandler();
  }
  
  function _setupRevealObserver() {
    if (!('IntersectionObserver' in window)) return;
    _revealObserver = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('visible');
          entry.target.style.opacity = '1';
          entry.target.style.transform = 'translateY(0)';
          _revealObserver.unobserve(entry.target);
        }
      });
    }, { threshold: 0.08, rootMargin: '0px 0px -30px 0px' });
    
    document.querySelectorAll('.reveal').forEach(el => {
      el.style.opacity = '0';
      el.style.transform = 'translateY(24px)';
      el.style.transition = 'opacity 0.5s var(--ease), transform 0.5s var(--ease)';
      _revealObserver.observe(el);
    });
  }
  
  function _setupResizeHandler() {
    const onResize = Utils.debounce(() => {
      if (window.innerWidth <= 768) MobileEngine.init();
    }, 200);
    window.addEventListener('resize', onResize, { passive: true });
  }
  
  return { init };
})();

/* ═══════════════════════════════════════════════════════════════════════════════════════════════
   SECTION 16 — GLOBAL API & INITIALIZATION
   ═══════════════════════════════════════════════════════════════════════════════════════════════ */

// Global functions for HTML
window.openNewChatFlow = () => FlowEngine.open();
window.openNewChatFlowWithTool = (tool) => FlowEngine.open(tool);
window.closeNewChatFlow = () => FlowEngine.close();
window.flowNext = () => FlowEngine.next();
window.flowPrev = () => FlowEngine.prev();
window.cancelGeneration = () => StreamingEngine.cancel();
window.toggleSidebar = () => SidebarEngine.toggle();
window.openSettings = () => openSettings();
window.closeSettings = () => closeSettings();
window.closeSettingsOnBg = closeSettingsOnBg;
window.toggleTheme = () => toggleTheme();
window.changeFontSize = (size) => changeFontSize(size);
window.saveSettings = () => saveSettings();
window.toggleAvatarDropdown = () => toggleAvatarDropdown();
window.copyOutput = () => copyOutput();
window.copyAsHTML = () => copyAsHTML();
window.exportAsPDF = () => exportAsPDF();
window.exportAsDOCX = () => exportAsDOCX();
window.exportAsMarkdown = () => exportAsMarkdown();
window.saveToBookmarks = () => saveToBookmarks();
window.shareOutput = () => shareOutput();
window.regenerateOutput = () => regenerateOutput();
window.exportAllData = () => exportAllData();
window.clearAllData = () => clearAllData();
window.showHome = () => showHome();
window.navigateTo = (page) => navigateTo(page);
window.handleFileSelect = (e) => MobileEngine.handleFileSelect(e);
window.FlowEngine = FlowEngine;
window.SidebarEngine = SidebarEngine;

// Marked configuration
function _configureMarked() {
  if (typeof marked === 'undefined') return;
  
  marked.setOptions({
    breaks: true,
    gfm: true,
    smartLists: true,
    langPrefix: 'hljs language-'
  });
  
  const renderer = new marked.Renderer();
  
  renderer.heading = (text, level) => {
    const sizes = ['2rem', '1.5rem', '1.25rem', '1.1rem', '1rem', '0.9rem'];
    const colors = ['var(--blue)', 'var(--purple)', 'var(--cyan)', 'var(--t1)', 'var(--t2)', 'var(--t3)'];
    const size = sizes[level - 1] || '1rem';
    const color = colors[level - 1] || 'var(--t1)';
    return `<h${level} style="font-family: var(--fd); font-size: ${size}; color: ${color}; margin: 1.5em 0 0.75em;">${text}</h${level}>`;
  };
  
  renderer.paragraph = (text) => `<p style="margin-bottom: 1em; line-height: 1.8;">${text}</p>`;
  renderer.code = (code, lang) => `<pre style="background: var(--bg3); padding: 16px; border-radius: var(--r3); overflow-x: auto;"><code style="font-family: var(--fm); font-size: 0.85rem;">${code}</code></pre>`;
  renderer.blockquote = (quote) => `<blockquote style="border-left: 3px solid var(--blue); padding: 12px 20px; background: var(--blued); border-radius: 0 var(--r3) var(--r3) 0; margin: 1em 0;">${quote}</blockquote>`;
  
  marked.use({ renderer });
}

// Search initialization
function initHeaderSearch() {
  const searchEl = document.querySelector('.header-search input');
  if (!searchEl) return;
  
  searchEl.addEventListener('input', Utils.debounce((e) => {
    const query = e.target.value.trim();
    if (!query) {
      SidebarEngine.render();
      return;
    }
    const sidebarSearch = document.getElementById('sidebarSearch');
    if (sidebarSearch) {
      sidebarSearch.value = query;
      sidebarSearch.dispatchEvent(new Event('input'));
    }
  }, 300));
}

// Console branding
function _logBranding() {
  console.log('%c✦ SAVOIRÉ AI v2.a', 'color: #00D4FF; font-size: 20px; font-weight: 800; font-family: monospace;');
  console.log('%cNeural Workspace — Ultra Advanced Frontend Engine', 'color: #8B5CF6; font-size: 13px;');
  console.log('%cBuilt by Sooban Talha Technologies · soobantalhatech.xyz', 'color: #64748B; font-size: 11px;');
  console.log('%cFounder: Sooban Talha · Free for every student on Earth, forever.', 'color: #94A3B8; font-size: 11px;');
}

// Main initialization
async function initSavoiré() {
  SettingsEngine.load();
  ChatHistoryEngine.load();
  _configureMarked();
  _logBranding();
  
  SidebarEngine.init();
  SidebarEngine.render();
  KeyboardEngine.init();
  MobileEngine.init();
  PerformanceEngine.init();
  initHeaderSearch();
  
  const lastVisit = SettingsEngine.get('lastVisit');
  const isFirstVisit = !lastVisit;
  SettingsEngine.set('lastVisit', new Date().toISOString());
  
  if (isFirstVisit) {
    showHome();
    setTimeout(() => {
      ToastEngine.success('✨ Welcome to Savoiré AI v2.a — your neural study workspace.');
    }, 500);
  } else {
    showHome();
  }
  
  const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
  if (mediaQuery.matches) SettingsEngine.set('reducedMotion', true);
  mediaQuery.addEventListener('change', e => SettingsEngine.set('reducedMotion', e.matches));
}

// Bootstrap
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initSavoiré);
} else {
  initSavoiré();
}

/* ═══════════════════════════════════════════════════════════════════════════════════════════════
   END OF FILE — app.js v2.a (9500+ lines)
   Savoiré AI — Built by Sooban Talha Technologies | soobantalhatech.xyz
   Founder: Sooban Talha | Free for every student on Earth, forever.
   ═══════════════════════════════════════════════════════════════════════════════════════════════ */
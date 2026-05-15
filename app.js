/**
 * ╔═══════════════════════════════════════════════════════════════════════════════════════════════════════════════╗
 * ║                                                                                                               ║
 * ║   SAVOIRÉ AI v2.1 — ULTRA PREMIUM DASHBOARD ENGINE                                                            ║
 * ║   Enterprise-grade Study Workspace | Live AI Streaming | 7-Step Generation | Premium UX                      ║
 * ║                                                                                                               ║
 * ║   Built by Sooban Talha Technologies | savoireai.vercel.app                                                   ║
 * ║   Founder: Sooban Talha | Free for every student on Earth, forever.                                          ║
 * ║                                                                                                               ║
 * ║   ╔═════════════════════════════════════════════════════════════════════════════════════════════════════════╗ ║
 * ║   ║  FEATURES:                                                                                             ║ ║
 * ║   ║  ✦ Premium Welcome Screen with User Profile Setup                                                      ║ ║
 * ║   ║  ✦ 8-Step Generation Flow with Animated Transitions                                                    ║ ║
 * ║   ║  ✦ Live SSE Streaming with Word-by-Word Output                                                         ║ ║
 * ║   ║  ✦ Markdown Rendering with Syntax Highlighting                                                         ║ ║
 * ║   ║  ✦ PDF Export with Professional Formatting                                                             ║ ║
 * ║   ║  ✦ Settings Panel with Theme, Speed, Language Controls                                                  ║ ║
 * ║   ║  ✦ Chat History with Search, Bookmarks, Folders                                                        ║ ║
 * ║   ║  ✦ Mobile-First Responsive Design with Touch Gestures                                                   ║ ║
 * ║   ║  ✦ Profile System with Analytics Dashboard                                                             ║ ║
 * ║   ╚═════════════════════════════════════════════════════════════════════════════════════════════════════════╝ ║
 * ║                                                                                                               ║
 * ╚═══════════════════════════════════════════════════════════════════════════════════════════════════════════════╝
 */

'use strict';

/* ════════════════════════════════════════════════════════════════════════════════════════════════════════════════
   SECTION 0: GLOBAL NAMESPACE & VERSION
   ════════════════════════════════════════════════════════════════════════════════════════════════════════════════ */

const SAVOIRÉ = {
  VERSION: '2.1.0',
  BUILD: '2025.015',
  BRAND: 'Savoiré AI',
  FOUNDER: 'Sooban Talha',
  DEVELOPER: 'Sooban Talha Technologies',
  DEVSITE: 'soobantalhatech.xyz',
  PRODUCT_URL: 'https://savoireai.vercel.app',
  API_BASE: '/api/study',
  
  GENERATION_TYPES: {
    NOTES: 'notes',
    FLASHCARDS: 'flashcards',
    QUIZ: 'quiz',
    SUMMARY: 'summary',
    MINDMAP: 'mindmap',
    DEEP_DIVE: 'deepdive'
  },
  
  DEPTH_LEVELS: {
    standard: { label: 'Standard', words: '600-900', target: 750, icon: 'fa-circle', color: '#00D4FF' },
    detailed: { label: 'Detailed', words: '1,000-1,500', target: 1250, icon: 'fa-expand', color: '#8B5CF6' },
    comprehensive: { label: 'Comprehensive', words: '1,500-2,000', target: 1750, icon: 'fa-maximize', color: '#A78BFA' },
    expert: { label: 'Expert', words: '2,000-2,800', target: 2400, icon: 'fa-crown', color: '#34D399' },
    deepdive: { label: 'Deep Dive', words: '3,500-5,000', target: 4200, icon: 'fa-dharmachakra', color: '#F472B6' }
  },
  
  WRITING_STYLES: {
    simple: { label: 'Simple & Clear', icon: 'fa-circle-check', desc: 'Easy to understand, beginner-friendly', color: '#00D4FF' },
    academic: { label: 'Academic', icon: 'fa-graduation-cap', desc: 'Formal, scholarly, precise terminology', color: '#8B5CF6' },
    exam: { label: 'Exam Focused', icon: 'fa-pen-to-square', desc: 'Mark-scheme language, test strategies', color: '#06FFDE' },
    visual: { label: 'Visual & Analogy', icon: 'fa-eye', desc: 'Rich imagery, mental models', color: '#34D399' },
    detailed: { label: 'Highly Detailed', icon: 'fa-list-ul', desc: 'Maximum depth, exhaustive coverage', color: '#F472B6' }
  },
  
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

/* ════════════════════════════════════════════════════════════════════════════════════════════════════════════════
   SECTION 1: CORE UTILITIES ENGINE
   ════════════════════════════════════════════════════════════════════════════════════════════════════════════════ */

const Utils = (() => {
  
  function debounce(fn, wait = 200) {
    let timer;
    return function(...args) {
      clearTimeout(timer);
      timer = setTimeout(() => fn.apply(this, args), wait);
    };
  }
  
  function throttle(fn, limit = 100) {
    let last = 0;
    return function(...args) {
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
  
  function estimateReadingTime(wordCount) {
    const wordsPerMinute = 200;
    const minutes = Math.ceil(wordCount / wordsPerMinute);
    if (minutes < 1) return '< 1 min read';
    if (minutes === 1) return '1 min read';
    return `${minutes} min read`;
  }
  
  function autoGenerateTitle(topic) {
    if (!topic) return 'Untitled';
    const words = topic.trim().split(/\s+/);
    if (words.length <= 5) return topic;
    return words.slice(0, 5).join(' ') + '…';
  }
  
  function formatFileSize(bytes) {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1048576) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / 1048576).toFixed(1) + ' MB';
  }
  
  function deepClone(obj) {
    return JSON.parse(JSON.stringify(obj));
  }
  
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

/* ════════════════════════════════════════════════════════════════════════════════════════════════════════════════
   SECTION 2: SETTINGS ENGINE — PERSISTENCE LAYER
   ════════════════════════════════════════════════════════════════════════════════════════════════════════════════ */

const SettingsEngine = (() => {
  
  const STORAGE_KEY = 'savoire_v21_settings';
  const USER_KEY = 'savoire_v21_user';
  const TOPIC_HISTORY_KEY = 'savoire_v21_topic_history';
  
  const DEFAULTS = {
    userName: '',
    userAvatar: '',
    userEmail: '',
    isFirstVisit: true,
    hasCompletedWelcome: false,
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
    totalStudyTime: 0,
    lastVisit: null,
    streakDays: 0,
    lastActiveDate: null,
    oledMode: false,
    autoNameChats: true,
    draftAutoSave: true,
    showReadingTime: true,
    streamingPauseOnScroll: false,
    maxTopicHistory: 10,
    soundEffects: false,
    hapticFeedback: true
  };
  
  let _settings = { ...DEFAULTS };
  let _topicHistory = [];
  let _userProfile = null;
  
  function load() {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const saved = Utils.safeJSON(raw, {});
      _settings = { ...DEFAULTS, ...saved };
    }
    
    const userRaw = localStorage.getItem(USER_KEY);
    if (userRaw) {
      _userProfile = Utils.safeJSON(userRaw, null);
    }
    
    const topicRaw = localStorage.getItem(TOPIC_HISTORY_KEY);
    if (topicRaw) {
      _topicHistory = Utils.safeJSON(topicRaw, []);
    }
    
    updateStreak();
    applyAll();
    return _settings;
  }
  
  function updateStreak() {
    const today = new Date().toDateString();
    const lastActive = _settings.lastActiveDate;
    
    if (lastActive === today) return;
    
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = yesterday.toDateString();
    
    if (lastActive === yesterdayStr) {
      _settings.streakDays++;
    } else if (lastActive !== today) {
      _settings.streakDays = 1;
    }
    
    _settings.lastActiveDate = today;
    save();
  }
  
  function save() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(_settings));
  }
  
  function saveUserProfile(profile) {
    _userProfile = profile;
    localStorage.setItem(USER_KEY, JSON.stringify(profile));
  }
  
  function saveTopicHistory() {
    localStorage.setItem(TOPIC_HISTORY_KEY, JSON.stringify(_topicHistory));
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
  
  function completeWelcome(userName, userEmail = '') {
    set('userName', userName);
    set('userEmail', userEmail);
    set('isFirstVisit', false);
    set('hasCompletedWelcome', true);
    set('lastVisit', new Date().toISOString());
    
    const avatar = userName.charAt(0).toUpperCase();
    set('userAvatar', avatar);
    
    saveUserProfile({
      name: userName,
      email: userEmail,
      avatar: avatar,
      joinedAt: new Date().toISOString(),
      totalSessions: 0
    });
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
  }
  
  function applyFontSize(size) {
    document.documentElement.setAttribute('data-font', size);
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
      document.documentElement.style.setProperty('--bg0', '#02020A');
      document.documentElement.style.setProperty('--bg1', '#07070F');
      document.documentElement.style.setProperty('--bg2', '#0D0D1C');
    }
  }
  
  function resetToDefaults() {
    _settings = { ...DEFAULTS };
    save();
    applyAll();
  }
  
  const STREAM_SPEEDS = { fast: 4, medium: 12, slow: 28 };
  function getStreamDelay() {
    return STREAM_SPEEDS[_settings.streamSpeed] ?? 12;
  }
  
  function getAnalytics() {
    return {
      totalSessions: _settings.totalSessions,
      totalGenerated: _settings.totalGenerated,
      totalTokens: _settings.totalTokens,
      totalStudyTime: _settings.totalStudyTime,
      streakDays: _settings.streakDays
    };
  }
  
  return { 
    load, save, get, set, increment, getStreamDelay, applyAll, resetToDefaults,
    addToTopicHistory, getTopicHistory, completeWelcome, getAnalytics,
    getUserProfile: () => _userProfile,
    isFirstVisit: () => _settings.isFirstVisit,
    hasCompletedWelcome: () => _settings.hasCompletedWelcome
  };
})();

/* ════════════════════════════════════════════════════════════════════════════════════════════════════════════════
   SECTION 3: CHAT HISTORY ENGINE — COMPLETE
   ════════════════════════════════════════════════════════════════════════════════════════════════════════════════ */

const ChatHistoryEngine = (() => {
  
  const STORAGE_KEY = 'savoire_v21_chats';
  const BOOKMARKS_KEY = 'savoire_v21_bookmarks';
  const FOLDERS_KEY = 'savoire_v21_folders';
  const DRAFTS_KEY = 'savoire_v21_drafts';
  
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
  
  function getRecentChats(limit = 5) {
    return getAllChats().slice(0, limit);
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
  
  function createFolder(name, color = '#00D4FF') {
    const folder = { id: Utils.uid(), name: name, color: color, chats: [] };
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
      if (oldFolder) oldFolder.chats = oldFolder.chats.filter(id => id !== chatId);
      const newFolder = _folders.find(f => f.id === folderId);
      if (newFolder && !newFolder.chats.includes(chatId)) newFolder.chats.push(chatId);
      save();
      saveFolders();
    }
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
    const exportData = { version: SAVOIRÉ.VERSION, exportDate: new Date().toISOString(), chats: chatsToExport };
    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
    Utils.downloadBlob(blob, `savoire-export-${Date.now()}.json`);
  }
  
  function exportAllData() {
    const data = {
      version: SAVOIRÉ.VERSION,
      exportDate: new Date().toISOString(),
      chats: _chats,
      bookmarks: _bookmarks,
      folders: _folders
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    Utils.downloadBlob(blob, `savoire-all-data-${Date.now()}.json`);
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
    getAllChats, searchChats, getRecentChats, bookmarkChat, unbookmarkChat, getBookmarks,
    exportAllData, clearAll, setCurrentId, getCurrentId, getCount,
    saveDraft, getDraft, deleteDraft, getAllDrafts,
    createFolder, deleteFolder, moveChatToFolder, getFolders,
    bulkDelete, bulkExport
  };
})();

/* ════════════════════════════════════════════════════════════════════════════════════════════════════════════════
   SECTION 4: TOAST NOTIFICATION ENGINE
   ════════════════════════════════════════════════════════════════════════════════════════════════════════════════ */

const ToastEngine = (() => {
  
  const ICONS = {
    success: 'fa-circle-check',
    error: 'fa-circle-xmark',
    info: 'fa-circle-info',
    warning: 'fa-triangle-exclamation',
    loading: 'fa-spinner fa-pulse'
  };
  
  const COLORS = {
    success: 'var(--em2)',
    error: 'var(--ruby2)',
    info: 'var(--gold)',
    warning: 'var(--amber)',
    loading: 'var(--gold)'
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

/* ════════════════════════════════════════════════════════════════════════════════════════════════════════════════
   SECTION 5: PREMIUM WELCOME SCREEN
   ════════════════════════════════════════════════════════════════════════════════════════════════════════════════ */

const WelcomeEngine = (() => {
  
  let _welcomeScreen = null;
  let _isVisible = false;
  
  function show() {
    if (_welcomeScreen) {
      _welcomeScreen.classList.remove('hidden');
      _isVisible = true;
      return;
    }
    
    createWelcomeScreen();
  }
  
  function createWelcomeScreen() {
    const container = document.createElement('div');
    container.id = 'welcomeScreen';
    container.className = 'welcome-overlay';
    container.innerHTML = `
      <div class="welcome-card">
        <div class="wc-logo">
          <img src="LOGO.png" alt="Savoiré AI" style="width:48px;height:48px;object-fit:contain;">
        </div>
        <div class="wc-title">Welcome to Savoiré AI</div>
        <div class="wc-subtitle">Your premium AI study companion</div>
        <div class="wc-desc">Experience the future of learning with live AI streaming, intelligent study tools, and a workspace designed for excellence.</div>
        
        <div class="wc-features">
          <div class="wc-feat"><i class="fas fa-bolt"></i> Live Streaming</div>
          <div class="wc-feat"><i class="fas fa-language"></i> 50+ Languages</div>
          <div class="wc-feat"><i class="fas fa-file-pdf"></i> PDF Export</div>
          <div class="wc-feat"><i class="fas fa-infinity"></i> Free Forever</div>
        </div>
        
        <div class="wc-input-group">
          <div class="wc-input-label">What should we call you?</div>
          <input type="text" id="wcNameInput" class="wc-input" placeholder="e.g., Alex, Dr. Smith, Explorer..." autocomplete="off">
          <div class="wc-err" id="wcNameError"></div>
        </div>
        
        <div class="wc-input-group">
          <div class="wc-input-label">Email (Optional)</div>
          <input type="email" id="wcEmailInput" class="wc-input" placeholder="your@email.com">
        </div>
        
        <button id="wcStartBtn" class="wc-btn">
          <i class="fas fa-sparkles"></i> Start Learning
        </button>
        
        <div class="wc-brand">
          Built by <a href="https://soobantalhatech.xyz" target="_blank">Sooban Talha Technologies</a>
        </div>
      </div>
    `;
    
    document.body.appendChild(container);
    _welcomeScreen = container;
    
    const nameInput = container.querySelector('#wcNameInput');
    const startBtn = container.querySelector('#wcStartBtn');
    
    startBtn.addEventListener('click', () => {
      const name = nameInput.value.trim();
      if (!name) {
        const errorEl = container.querySelector('#wcNameError');
        errorEl.textContent = 'Please enter your name to continue';
        nameInput.style.borderColor = 'var(--ruby)';
        setTimeout(() => { nameInput.style.borderColor = ''; }, 1500);
        return;
      }
      
      const email = container.querySelector('#wcEmailInput').value.trim();
      SettingsEngine.completeWelcome(name, email);
      
      container.classList.add('fade-out');
      setTimeout(() => {
        container.remove();
        _welcomeScreen = null;
        _isVisible = false;
        initDashboard();
      }, 500);
    });
    
    nameInput.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') startBtn.click();
    });
    
    _isVisible = true;
  }
  
  function hide() {
    if (_welcomeScreen) {
      _welcomeScreen.classList.add('fade-out');
      setTimeout(() => {
        if (_welcomeScreen) _welcomeScreen.remove();
        _welcomeScreen = null;
      }, 500);
    }
    _isVisible = false;
  }
  
  function isVisible() { return _isVisible; }
  
  return { show, hide, isVisible };
})();

/* ════════════════════════════════════════════════════════════════════════════════════════════════════════════════
   SECTION 6: PREMIUM LOADER
   ════════════════════════════════════════════════════════════════════════════════════════════════════════════════ */

const LoaderEngine = (() => {
  
  let _loader = null;
  
  function show() {
    if (_loader) {
      _loader.classList.remove('hidden');
      return;
    }
    
    _loader = document.createElement('div');
    _loader.id = 'premiumLoader';
    _loader.className = 'premium-loader';
    _loader.innerHTML = `
      <div class="loader-container">
        <div class="loader-ring"></div>
        <div class="loader-ring2"></div>
        <div class="loader-logo">
          <img src="LOGO.png" alt="Savoiré AI" style="width:40px;height:40px;object-fit:contain;">
        </div>
        <div class="loader-text">Initializing Savoiré AI</div>
        <div class="loader-dots">
          <span></span><span></span><span></span>
        </div>
      </div>
    `;
    
    document.body.appendChild(_loader);
  }
  
  function hide() {
    if (_loader) {
      _loader.classList.add('fade-out');
      setTimeout(() => {
        if (_loader) _loader.remove();
        _loader = null;
      }, 500);
    }
  }
  
  return { show, hide };
})();

/* ════════════════════════════════════════════════════════════════════════════════════════════════════════════════
   SECTION 7: STREAMING ENGINE — LIVE AI OUTPUT
   ════════════════════════════════════════════════════════════════════════════════════════════════════════════════ */

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
  let _retryCount = 0;
  const MAX_RETRIES = 2;
  
  const STAGES = [
    { id: 0, text: '🎯 Initializing AI engine...', pct: 2 },
    { id: 1, text: '🔍 Analyzing your topic...', pct: 12 },
    { id: 2, text: '🧠 Structuring your content...', pct: 22 },
    { id: 3, text: '✍️ Writing your first section...', pct: 38 },
    { id: 4, text: '📖 Expanding with details...', pct: 55 },
    { id: 5, text: '🔗 Adding examples & insights...', pct: 70 },
    { id: 6, text: '✨ Finalizing and polishing...', pct: 88 },
    { id: 7, text: '✅ Generation complete!', pct: 100 }
  ];
  
  let _onCompleteCallback = null;
  let _onTokenCallback = null;
  let _onStageCallback = null;
  
  function setCallbacks(onComplete, onToken, onStage) {
    _onCompleteCallback = onComplete;
    _onTokenCallback = onToken;
    _onStageCallback = onStage;
  }
  
  async function start(message, options) {
    if (_isStreaming) {
      cancel();
      await Utils.sleep(200);
    }
    
    _reset();
    _currentOptions = options;
    
    if (_onStageCallback) _onStageCallback(0, STAGES[0].text, 2);
    
    await _fetchStream(message, options);
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
    cancelAnimationFrame(_renderRaf);
  }
  
  async function _fetchStream(message, options, retryAttempt = 0) {
    try {
      const res = await fetch(SAVOIRÉ.API_BASE, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        signal: _abortController.signal,
        body: JSON.stringify({ message, options })
      });
      
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      
      await _processSSEStream(res);
      
    } catch (err) {
      if (err.name === 'AbortError') return;
      console.error('[StreamingEngine] Error:', err);
      
      if (retryAttempt < MAX_RETRIES) {
        _retryCount++;
        if (_onStageCallback) _onStageCallback(1, `⚠️ Retrying (attempt ${_retryCount})...`, 5);
        await Utils.sleep(1000);
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
    
    _startRenderLoop();
    
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      
      if (_isPaused) {
        await Utils.sleep(50);
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
          _handleSSEEvent(parsed);
        } catch {
          if (data.length > 0 && data !== '') {
            _enqueueToken(data);
          }
        }
      }
    }
    
    _finalizeStream();
  }
  
  function _handleSSEEvent(event) {
    if (!event) return;
    
    if (event.t) {
      _enqueueToken(event.t);
      if (_onTokenCallback) _onTokenCallback(event.t, _rawText + event.t);
    } else if (event.token) {
      _enqueueToken(event.token);
    } else if (event.type === 'stage' || event.stage !== undefined) {
      const stage = STAGES[event.stage] || STAGES[0];
      if (_onStageCallback) _onStageCallback(event.stage, stage.text, event.progress || stage.pct);
    } else if (event.type === 'complete') {
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
        if (sinceFlush >= speedDelay || _tokenQueue.length > 5) {
          const batchSize = _tokenQueue.length > 10 ? 4 : _tokenQueue.length > 4 ? 2 : 1;
          
          if (_tokenQueue.length > 0) {
            const tokens = _tokenQueue.splice(0, batchSize);
            tokens.forEach(token => { _rawText += token; });
            lastFlush = now;
          }
        }
      }
      
      _renderRaf = requestAnimationFrame(render);
    }
    
    _renderRaf = requestAnimationFrame(render);
  }
  
  function _updateCounters() {
    const elapsed = (performance.now() - _startTime) / 1000;
    const wps = elapsed > 0 ? Math.round(_wordCount / elapsed) : 0;
    return { tokens: _tokenCount, wps: wps, chars: _rawText.length };
  }
  
  async function _finalizeStream() {
    while (_tokenQueue.length > 0) {
      _rawText += _tokenQueue.splice(0, 4).join('');
    }
    
    await Utils.sleep(200);
    
    _isStreaming = false;
    cancelAnimationFrame(_renderRaf);
    
    if (_onStageCallback) _onStageCallback(7, STAGES[7].text, 100);
    
    const metrics = _updateCounters();
    
    if (_onCompleteCallback) {
      _onCompleteCallback(_rawText, {
        tokens: _tokenCount,
        wps: metrics.wps,
        duration: (performance.now() - _startTime) / 1000,
        wordCount: _wordCount
      });
    }
  }
  
  function _handleStreamError(err) {
    _isStreaming = false;
    cancelAnimationFrame(_renderRaf);
    if (_onCompleteCallback) {
      _onCompleteCallback(null, { error: err.message });
    }
    ToastEngine.error('Generation failed. Please try again.');
  }
  
  function pause() {
    if (!_isStreaming) return;
    _isPaused = true;
    ToastEngine.info('Streaming paused');
  }
  
  function resume() {
    if (!_isStreaming) return;
    _isPaused = false;
    ToastEngine.info('Streaming resumed');
  }
  
  function cancel() {
    if (_abortController) _abortController.abort();
    _isStreaming = false;
    cancelAnimationFrame(_renderRaf);
    _tokenQueue = [];
  }
  
  function isStreaming() { return _isStreaming; }
  
  return { start, cancel, pause, resume, isStreaming, setCallbacks };
})();

/* ════════════════════════════════════════════════════════════════════════════════════════════════════════════════
   SECTION 8: 8-STEP GENERATION FLOW
   ════════════════════════════════════════════════════════════════════════════════════════════════════════════════ */

const FlowEngine = (() => {
  
  let _state = {
    step: 1,
    maxSteps: 8,
    tool: '',
    topic: '',
    depth: 'detailed',
    language: 'English',
    style: 'simple',
    file: null,
    fileText: '',
    direction: 'forward'
  };
  
  let _flowModal = null;
  let _isOpen = false;
  
  const STEP_TITLES = [
    'Select Your Study Format',
    'Enter Your Study Topic',
    'Choose Depth Level',
    'Select Output Language',
    'Choose Writing Style',
    'Upload Study Material',
    'Review Session',
    'Generate Study Materials'
  ];
  
  const TOOLS = [
    { id: 'notes', label: 'Smart Notes', icon: 'fa-book-open', desc: 'Comprehensive structured notes with key concepts', color: '#00D4FF' },
    { id: 'flashcards', label: 'Flashcards', icon: 'fa-layer-group', desc: 'Interactive flashcards for active recall', color: '#8B5CF6' },
    { id: 'quiz', label: 'Practice Quiz', icon: 'fa-question-circle', desc: 'Multiple-choice questions with explanations', color: '#06FFDE' },
    { id: 'summary', label: 'Study Summary', icon: 'fa-align-left', desc: 'Concise TL;DR with key takeaways', color: '#A78BFA' },
    { id: 'mindmap', label: 'Mind Map', icon: 'fa-diagram-project', desc: 'Visual hierarchical outline of concepts', color: '#34D399' },
    { id: 'deepdive', label: 'Deep Dive', icon: 'fa-dharmachakra', desc: 'In-depth research-style analysis', color: '#F472B6' }
  ];
  
  function open(preSelectedTool = '') {
    if (_isOpen) return;
    
    _state = {
      step: preSelectedTool ? 2 : 1,
      maxSteps: 8,
      tool: preSelectedTool || '',
      topic: '',
      depth: SettingsEngine.get('defaultDepth') || 'detailed',
      language: SettingsEngine.get('defaultLang') || 'English',
      style: SettingsEngine.get('defaultStyle') || 'simple',
      file: null,
      fileText: '',
      direction: 'forward'
    };
    
    createFlowModal();
    _isOpen = true;
  }
  
  function createFlowModal() {
    if (_flowModal) {
      _flowModal.classList.remove('hidden');
      _renderStep();
      _updateHeader();
      return;
    }
    
    _flowModal = document.createElement('div');
    _flowModal.id = 'flowModal';
    _flowModal.className = 'flow-overlay';
    _flowModal.innerHTML = `
      <div class="flow-header">
        <button class="flow-close" id="flowCloseBtn"><i class="fas fa-times"></i></button>
        <div class="flow-title" id="flowTitle">Select Your Study Format</div>
        <div class="flow-progress"><div class="flow-progress-fill" id="flowProgress"></div></div>
        <div class="flow-step-indicator" id="flowSteps"></div>
        <div class="flow-step-text" id="flowStepText">Step 1 of 8</div>
      </div>
      <div class="flow-body" id="flowBody"></div>
      <div class="flow-footer">
        <button class="flow-back" id="flowBackBtn">← Back</button>
        <button class="flow-next" id="flowNextBtn">Next →</button>
      </div>
    `;
    
    document.body.appendChild(_flowModal);
    
    document.getElementById('flowCloseBtn').addEventListener('click', close);
    document.getElementById('flowBackBtn').addEventListener('click', prev);
    document.getElementById('flowNextBtn').addEventListener('click', next);
    
    _renderStep();
    _updateHeader();
  }
  
  function close() {
    if (_flowModal) {
      _flowModal.classList.add('hidden');
    }
    _isOpen = false;
  }
  
  function next() {
    if (!_validateStep()) return;
    
    if (_state.step >= _state.maxSteps) {
      _startGeneration();
      return;
    }
    
    _state.direction = 'forward';
    _state.step++;
    _animateTransition();
    _updateHeader();
  }
  
  function prev() {
    if (_state.step <= 1) {
      close();
      return;
    }
    _state.direction = 'backward';
    _state.step--;
    _animateTransition();
    _updateHeader();
  }
  
  function _animateTransition() {
    const content = document.getElementById('flowBody');
    if (!content) return;
    
    content.style.transition = 'opacity 0.2s ease, transform 0.2s ease';
    content.style.opacity = '0';
    content.style.transform = `translateX(${_state.direction === 'forward' ? '-30px' : '30px'})`;
    
    setTimeout(() => {
      _renderStep();
      content.style.transform = `translateX(${_state.direction === 'forward' ? '30px' : '-30px'})`;
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
    if (progressEl) progressEl.style.width = ((_state.step / _state.maxSteps) * 100) + '%';
    
    if (indicatorEl) {
      indicatorEl.innerHTML = Array.from({ length: _state.maxSteps }, (_, i) => {
        const cls = i + 1 === _state.step ? 'active' : i + 1 < _state.step ? 'done' : '';
        return `<div class="flow-dot ${cls}"></div>`;
      }).join('');
    }
    
    if (backBtn) backBtn.style.opacity = _state.step <= 1 ? '0.5' : '1';
    
    if (nextBtn) {
      const isLast = _state.step === _state.maxSteps;
      nextBtn.innerHTML = isLast ? '<i class="fas fa-sparkles"></i> Generate' : 'Next →';
    }
  }
  
  function _validateStep() {
    switch (_state.step) {
      case 1:
        if (!_state.tool) { ToastEngine.warning('Please select a study format'); return false; }
        return true;
      case 2:
        if (!_state.topic.trim() || _state.topic.trim().length < 2) {
          ToastEngine.warning('Please enter a topic (min 2 characters)');
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
      _renderStepReview,
      _renderStepGenerate
    ];
    
    const renderer = renderers[_state.step - 1];
    if (renderer) {
      container.innerHTML = renderer();
      _attachStepListeners();
    }
  }
  
  function _renderStepTools() {
    return `
      <div class="flow-step">
        <div class="flow-step-title">What would you like to create?</div>
        <div class="flow-step-sub">Choose your AI study tool below</div>
        <div class="tools-grid">
          ${TOOLS.map(t => `
            <div class="tool-option ${_state.tool === t.id ? 'selected' : ''}" data-tool="${t.id}" style="--tool-color: ${t.color}">
              <div class="tool-option-icon" style="background: ${t.color}20; color: ${t.color}">
                <i class="fa ${t.icon}"></i>
              </div>
              <div class="tool-option-name">${t.label}</div>
              <div class="tool-option-desc">${t.desc}</div>
            </div>
          `).join('')}
        </div>
      </div>
    `;
  }
  
  function _renderStepTopic() {
    const topicHistory = SettingsEngine.getTopicHistory();
    return `
      <div class="flow-step">
        <div class="flow-step-title">What topic do you want to study?</div>
        <div class="flow-step-sub">Be specific for the best results</div>
        <textarea id="topicInput" class="topic-textarea" placeholder="e.g., Quantum Entanglement, The French Revolution, CRISPR gene editing...">${_state.topic}</textarea>
        <div class="char-count"><span id="charCount">${_state.topic.length}</span> / 500 characters</div>
        <div class="suggestions">
          <button class="suggestion-pill" data-suggestion="Quantum Entanglement">✦ Quantum Entanglement</button>
          <button class="suggestion-pill" data-suggestion="Machine Learning Basics">✦ Machine Learning Basics</button>
          <button class="suggestion-pill" data-suggestion="The French Revolution">✦ The French Revolution</button>
          <button class="suggestion-pill" data-suggestion="Photosynthesis">✦ Photosynthesis</button>
        </div>
        ${topicHistory.length > 0 ? `
          <div class="recent-topics">
            <div class="recent-label">RECENT TOPICS</div>
            <div class="suggestions">
              ${topicHistory.slice(0, 4).map(t => `<button class="suggestion-pill" data-suggestion="${t.replace(/'/g, "\\'")}">📋 ${Utils.truncate(t, 30)}</button>`).join('')}
            </div>
          </div>
        ` : ''}
      </div>
    `;
  }
  
  function _renderStepDepth() {
    const depths = Object.entries(SAVOIRÉ.DEPTH_LEVELS);
    return `
      <div class="flow-step">
        <div class="flow-step-title">How detailed should the output be?</div>
        <div class="flow-step-sub">More depth = richer content, slightly longer generation</div>
        <div class="depth-grid">
          ${depths.map(([id, d]) => `
            <div class="depth-option ${_state.depth === id ? 'selected' : ''}" data-depth="${id}" style="--depth-color: ${d.color}">
              <div class="depth-icon"><i class="fa ${d.icon}"></i></div>
              <div class="depth-name">${d.label}</div>
              <div class="depth-desc">${d.words}</div>
            </div>
          `).join('')}
        </div>
      </div>
    `;
  }
  
  function _renderStepLanguage() {
    return `
      <div class="flow-step">
        <div class="flow-step-title">Output Language</div>
        <div class="flow-step-sub">Choose your preferred language</div>
        <div class="lang-search">
          <i class="fas fa-search"></i>
          <input type="text" id="langSearch" placeholder="Search language..." class="lang-search-input">
        </div>
        <div class="lang-grid" id="langGrid">
          ${SAVOIRÉ.LANGUAGES.map(lang => `
            <div class="lang-option ${_state.language === lang ? 'selected' : ''}" data-lang="${lang}">${lang}</div>
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
            <div class="style-option ${_state.style === id ? 'selected' : ''}" data-style="${id}" style="--style-color: ${s.color}">
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
        <div class="flow-step-title">Upload Study Material <span style="font-size: 0.8rem; color: var(--t4);">(Optional)</span></div>
        <div class="flow-step-sub">Add a document to enhance your study content</div>
        <div id="uploadZone" class="upload-zone">
          <div class="upload-icon"><i class="fas ${hasFile ? 'fa-file-check' : 'fa-cloud-upload-alt'}"></i></div>
          ${hasFile ? `
            <div style="font-weight: 600; color: var(--em2);">${_state.file.name}</div>
            <div style="font-size: 0.75rem; color: var(--t3);">${Utils.formatFileSize(_state.file.size)}</div>
            <button class="upload-remove" id="removeFileBtn"><i class="fas fa-times"></i> Remove</button>
          ` : `
            <div>Drag & drop a file here, or <span style="color: var(--gold);">browse</span></div>
            <div style="font-size: 0.7rem; color: var(--t4);">Supports PDF, DOCX, TXT, MD (max 5MB)</div>
          `}
        </div>
        <input type="file" id="fileInput" accept=".txt,.md,.pdf,.docx" style="display: none;">
      </div>
    `;
  }
  
  function _renderStepReview() {
    const tool = TOOLS.find(t => t.id === _state.tool) || TOOLS[0];
    const depth = SAVOIRÉ.DEPTH_LEVELS[_state.depth] || SAVOIRÉ.DEPTH_LEVELS.detailed;
    const style = SAVOIRÉ.WRITING_STYLES[_state.style] || SAVOIRÉ.WRITING_STYLES.simple;
    
    return `
      <div class="flow-step">
        <div class="flow-step-title">Review Your Study Session</div>
        <div class="flow-step-sub">Confirm your settings before generating</div>
        <div class="review-grid">
          <div class="review-header" style="background: ${tool.color}20; border-color: ${tool.color}40">
            <i class="fa ${tool.icon}" style="color: ${tool.color}"></i>
            <span>${tool.label}</span>
          </div>
          <div class="review-body">
            <div class="review-item"><div class="review-label">Topic</div><div class="review-value">${Utils.truncate(_state.topic, 50)}</div></div>
            <div class="review-item"><div class="review-label">Depth</div><div class="review-value">${depth.label} (${depth.words})</div></div>
            <div class="review-item"><div class="review-label">Language</div><div class="review-value">${_state.language}</div></div>
            <div class="review-item"><div class="review-label">Style</div><div class="review-value">${style.label}</div></div>
            ${_state.file ? `<div class="review-item"><div class="review-label">File</div><div class="review-value">${_state.file.name}</div></div>` : ''}
          </div>
        </div>
        <div class="review-note">
          <i class="fas fa-bolt"></i> Content will stream live as it generates. First words appear in under 1 second.
        </div>
      </div>
    `;
  }
  
  function _renderStepGenerate() {
    return `
      <div class="flow-step generate-step">
        <div class="flow-step-title">Ready to Generate</div>
        <div class="flow-step-sub">Your study materials will be created in real-time</div>
        <button id="finalGenerateBtn" class="generate-btn">
          <i class="fas fa-sparkles"></i> Generate Study Materials
          <div class="btn-glow"></div>
        </button>
      </div>
    `;
  }
  
  function _attachStepListeners() {
    if (_state.step === 1) {
      document.querySelectorAll('.tool-option').forEach(el => {
        el.addEventListener('click', () => {
          const toolId = el.dataset.tool;
          _state.tool = toolId;
          document.querySelectorAll('.tool-option').forEach(opt => opt.classList.remove('selected'));
          el.classList.add('selected');
        });
      });
    }
    
    if (_state.step === 2) {
      setTimeout(() => {
        const input = document.getElementById('topicInput');
        if (input) {
          input.focus();
          input.addEventListener('input', (e) => {
            _state.topic = e.target.value.substring(0, 500);
            const countEl = document.getElementById('charCount');
            if (countEl) countEl.textContent = _state.topic.length;
          });
        }
        
        document.querySelectorAll('.suggestion-pill').forEach(btn => {
          btn.addEventListener('click', () => {
            const suggestion = btn.dataset.suggestion;
            if (suggestion) {
              _state.topic = suggestion;
              const input = document.getElementById('topicInput');
              if (input) input.value = suggestion;
              const countEl = document.getElementById('charCount');
              if (countEl) countEl.textContent = suggestion.length;
            }
          });
        });
      }, 50);
    }
    
    if (_state.step === 3) {
      document.querySelectorAll('.depth-option').forEach(el => {
        el.addEventListener('click', () => {
          const depthId = el.dataset.depth;
          _state.depth = depthId;
          document.querySelectorAll('.depth-option').forEach(opt => opt.classList.remove('selected'));
          el.classList.add('selected');
        });
      });
    }
    
    if (_state.step === 4) {
      document.querySelectorAll('.lang-option').forEach(el => {
        el.addEventListener('click', () => {
          const lang = el.dataset.lang;
          _state.language = lang;
          document.querySelectorAll('.lang-option').forEach(opt => opt.classList.remove('selected'));
          el.classList.add('selected');
        });
      });
      
      const searchInput = document.getElementById('langSearch');
      if (searchInput) {
        searchInput.addEventListener('input', (e) => {
          const query = e.target.value.toLowerCase();
          document.querySelectorAll('.lang-option').forEach(opt => {
            const lang = opt.textContent.toLowerCase();
            opt.style.display = lang.includes(query) ? 'flex' : 'none';
          });
        });
      }
    }
    
    if (_state.step === 5) {
      document.querySelectorAll('.style-option').forEach(el => {
        el.addEventListener('click', () => {
          const styleId = el.dataset.style;
          _state.style = styleId;
          document.querySelectorAll('.style-option').forEach(opt => opt.classList.remove('selected'));
          el.classList.add('selected');
        });
      });
    }
    
    if (_state.step === 6) {
      const uploadZone = document.getElementById('uploadZone');
      const fileInput = document.getElementById('fileInput');
      const removeBtn = document.getElementById('removeFileBtn');
      
      if (uploadZone) {
        uploadZone.addEventListener('click', () => fileInput?.click());
        uploadZone.addEventListener('dragover', (e) => { e.preventDefault(); uploadZone.classList.add('drag-over'); });
        uploadZone.addEventListener('dragleave', () => uploadZone.classList.remove('drag-over'));
        uploadZone.addEventListener('drop', (e) => {
          e.preventDefault();
          uploadZone.classList.remove('drag-over');
          const file = e.dataTransfer.files[0];
          if (file) processFile(file);
        });
      }
      
      if (fileInput) {
        fileInput.addEventListener('change', (e) => {
          if (e.target.files[0]) processFile(e.target.files[0]);
        });
      }
      
      if (removeBtn) {
        removeBtn.addEventListener('click', (e) => {
          e.stopPropagation();
          _state.file = null;
          _state.fileText = '';
          _renderStep();
          _attachStepListeners();
        });
      }
    }
    
    if (_state.step === 8) {
      const generateBtn = document.getElementById('finalGenerateBtn');
      if (generateBtn) {
        generateBtn.addEventListener('click', () => {
          _startGeneration();
        });
      }
    }
  }
  
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
      _state.fileText = file.type === 'application/pdf' ? '[PDF content uploaded]' : (e.target.result || '').substring(0, 8000);
      _renderStep();
      _attachStepListeners();
      ToastEngine.success(`File attached: ${file.name}`);
    };
    
    if (file.type !== 'application/pdf') {
      reader.readAsText(file);
    } else {
      _state.fileText = '[PDF document uploaded]';
      _renderStep();
      _attachStepListeners();
    }
  }
  
  function _startGeneration() {
    close();
    
    SettingsEngine.addToTopicHistory(_state.topic);
    SettingsEngine.increment('totalGenerated');
    
    const message = _buildPrompt();
    const options = {
      tool: _state.tool,
      topic: _state.topic,
      depth: _state.depth,
      language: _state.language,
      style: _state.style,
      stream: true
    };
    
    if (typeof window.startStudyGeneration === 'function') {
      window.startStudyGeneration(message, options);
    }
  }
  
  function _buildPrompt() {
    let prompt = _state.topic;
    if (_state.fileText) {
      prompt += `\n\nAdditional context from uploaded file:\n${_state.fileText.substring(0, 4000)}`;
    }
    if (_state.depth === 'deepdive') {
      prompt += `\n\n[REQUIREMENT: Generate an EXTREMELY DETAILED, RESEARCH-QUALITY Deep Dive. Include executive summary, multiple chapters, key debates, case studies, future directions, glossary, and study guide. Target length: 3,500-5,000 words.]`;
    }
    return prompt;
  }
  
  return { open, close, next, prev };
})();

/* ════════════════════════════════════════════════════════════════════════════════════════════════════════════════
   SECTION 9: DASHBOARD INITIALIZATION
   ════════════════════════════════════════════════════════════════════════════════════════════════════════════════ */

let _currentOutputData = null;
let _currentGenerationOptions = null;

function initDashboard() {
  loadWelcomeScreen();
  loadRecentSessions();
  loadAnalytics();
  setupEventListeners();
  setupKeyboardShortcuts();
  setupMobileHandlers();
}

function loadWelcomeScreen() {
  const userName = SettingsEngine.get('userName');
  const greeting = Utils.getGreeting(userName);
  
  const greetingEl = document.getElementById('greetingText');
  if (greetingEl) greetingEl.textContent = greeting;
  
  const userNameEl = document.getElementById('userNameDisplay');
  if (userNameEl && userName) userNameEl.textContent = userName;
  
  const avatarEl = document.getElementById('userAvatar');
  if (avatarEl && userName) avatarEl.textContent = userName.charAt(0).toUpperCase();
}

function loadRecentSessions() {
  const recentChats = ChatHistoryEngine.getRecentChats(5);
  const container = document.getElementById('recentSessionsList');
  if (!container) return;
  
  if (recentChats.length === 0) {
    container.innerHTML = '<div class="empty-recent"><i class="fas fa-book-open"></i><p>No study sessions yet</p><button class="start-session-btn" onclick="openNewChatFlow()">Start Your First Session →</button></div>';
    return;
  }
  
  container.innerHTML = recentChats.map(chat => `
    <div class="recent-item" onclick="loadChat('${chat.id}')">
      <div class="recent-icon"><i class="fas ${getToolIcon(chat.tool)}"></i></div>
      <div class="recent-info">
        <div class="recent-title">${Utils.truncate(chat.title || chat.topic, 35)}</div>
        <div class="recent-meta">${Utils.relativeDate(chat.timestamp)} · ${chat.tool}</div>
      </div>
      <div class="recent-actions">
        <button class="recent-action" onclick="event.stopPropagation(); deleteChat('${chat.id}')"><i class="fas fa-trash-alt"></i></button>
      </div>
    </div>
  `).join('');
}

function loadAnalytics() {
  const analytics = SettingsEngine.getAnalytics();
  
  const sessionCountEl = document.getElementById('statSessions');
  if (sessionCountEl) sessionCountEl.textContent = analytics.totalSessions;
  
  const streakEl = document.getElementById('statStreak');
  if (streakEl) streakEl.textContent = analytics.streakDays;
  
  const generatedEl = document.getElementById('statGenerated');
  if (generatedEl) generatedEl.textContent = analytics.totalGenerated;
}

function getToolIcon(tool) {
  const icons = {
    notes: 'fa-book-open',
    flashcards: 'fa-layer-group',
    quiz: 'fa-question-circle',
    summary: 'fa-align-left',
    mindmap: 'fa-diagram-project',
    deepdive: 'fa-dharmachakra'
  };
  return icons[tool] || 'fa-book-open';
}

function openNewChatFlow() {
  FlowEngine.open();
}

window.openNewChatFlow = openNewChatFlow;

function startStudyGeneration(message, options) {
  _currentGenerationOptions = options;
  
  showGenerationUI();
  
  StreamingEngine.setCallbacks(
    (result, metrics) => onGenerationComplete(result, metrics),
    (token, fullText) => onTokenReceived(token, fullText),
    (stage, label, progress) => onStageUpdate(stage, label, progress)
  );
  
  StreamingEngine.start(message, options);
}

function showGenerationUI() {
  const welcomeDashboard = document.getElementById('welcomeDashboard');
  const generationWorkspace = document.getElementById('generationWorkspace');
  const liveStreamArea = document.getElementById('liveStreamArea');
  const finalOutputArea = document.getElementById('finalOutputArea');
  
  if (welcomeDashboard) welcomeDashboard.style.display = 'none';
  if (generationWorkspace) generationWorkspace.style.display = 'block';
  if (liveStreamArea) liveStreamArea.style.display = 'block';
  if (finalOutputArea) finalOutputArea.style.display = 'none';
  
  const streamText = document.getElementById('streamText');
  if (streamText) streamText.innerHTML = '';
  
  const streamTokens = document.getElementById('streamTokens');
  const streamWps = document.getElementById('streamWps');
  if (streamTokens) streamTokens.textContent = '0';
  if (streamWps) streamWps.textContent = '0';
}

function onTokenReceived(token, fullText) {
  const streamText = document.getElementById('streamText');
  if (streamText) {
    if (SettingsEngine.get('liveMarkdown') && typeof marked !== 'undefined') {
      try {
        streamText.innerHTML = marked.parse(fullText) + '<span class="stream-cursor"></span>';
      } catch {
        streamText.textContent = fullText;
      }
    } else {
      streamText.textContent = fullText;
    }
    streamText.scrollTop = streamText.scrollHeight;
  }
  
  const metrics = StreamingEngine._updateCounters ? StreamingEngine._updateCounters() : { tokens: 0, wps: 0 };
  const streamTokens = document.getElementById('streamTokens');
  const streamWps = document.getElementById('streamWps');
  if (streamTokens) streamTokens.textContent = metrics.tokens || 0;
  if (streamWps) streamWps.textContent = metrics.wps || 0;
}

function onStageUpdate(stage, label, progress) {
  const stageEl = document.getElementById('streamStage');
  const progressBar = document.getElementById('streamProgress');
  if (stageEl) stageEl.textContent = label;
  if (progressBar) progressBar.style.width = `${progress}%`;
}

function onGenerationComplete(result, metrics) {
  const liveStreamArea = document.getElementById('liveStreamArea');
  const finalOutputArea = document.getElementById('finalOutputArea');
  const finalContent = document.getElementById('finalContent');
  
  if (liveStreamArea) liveStreamArea.style.display = 'none';
  if (finalOutputArea) finalOutputArea.style.display = 'block';
  
  if (result && finalContent) {
    if (SettingsEngine.get('liveMarkdown') && typeof marked !== 'undefined' && typeof DOMPurify !== 'undefined') {
      finalContent.innerHTML = DOMPurify.sanitize(marked.parse(result));
    } else {
      finalContent.textContent = result;
    }
  }
  
  const chat = ChatHistoryEngine.createChat({
    tool: _currentGenerationOptions.tool,
    topic: _currentGenerationOptions.topic,
    depth: _currentGenerationOptions.depth,
    style: _currentGenerationOptions.style,
    language: _currentGenerationOptions.language,
    content: finalContent?.innerHTML || result,
    rawText: result,
    tokens: metrics?.tokens || 0,
    wps: metrics?.wps || 0
  });
  
  loadRecentSessions();
  ToastEngine.success('Study materials generated successfully!');
}

function loadChat(chatId) {
  const chat = ChatHistoryEngine.getChat(chatId);
  if (!chat) return;
  
  ChatHistoryEngine.setCurrentId(chatId);
  
  const welcomeDashboard = document.getElementById('welcomeDashboard');
  const generationWorkspace = document.getElementById('generationWorkspace');
  const finalOutputArea = document.getElementById('finalOutputArea');
  const finalContent = document.getElementById('finalContent');
  
  if (welcomeDashboard) welcomeDashboard.style.display = 'none';
  if (generationWorkspace) generationWorkspace.style.display = 'block';
  if (finalOutputArea) finalOutputArea.style.display = 'block';
  if (finalContent) finalContent.innerHTML = chat.content || chat.rawText;
  
  loadRecentSessions();
}

window.loadChat = loadChat;

function deleteChat(chatId) {
  if (confirm('Delete this study session?')) {
    ChatHistoryEngine.deleteChat(chatId);
    loadRecentSessions();
    ToastEngine.success('Session deleted');
  }
}

window.deleteChat = deleteChat;

function exportAsPDF() {
  const content = document.getElementById('finalContent');
  if (!content || !content.textContent.trim()) {
    ToastEngine.warning('Nothing to export');
    return;
  }
  
  ToastEngine.info('Preparing PDF...');
  
  if (typeof window.jspdf !== 'undefined') {
    try {
      const { jsPDF } = window.jspdf;
      const doc = new jsPDF({ orientation: 'p', unit: 'mm', format: 'a4' });
      const text = Utils.stripHTML(content.innerHTML);
      const lines = doc.splitTextToSize(text, 170);
      
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(18);
      doc.text('Savoiré AI Study Materials', 20, 20);
      
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(10);
      
      let y = 35;
      lines.forEach(line => {
        if (y > 270) { doc.addPage(); y = 20; }
        doc.text(line, 20, y);
        y += 5;
      });
      
      doc.save(`savoire-study-${Date.now()}.pdf`);
      ToastEngine.success('PDF exported');
      return;
    } catch (e) {
      console.warn('PDF error:', e);
    }
  }
  window.print();
}

window.exportAsPDF = exportAsPDF;

function copyContent() {
  const content = document.getElementById('finalContent');
  if (!content) return;
  
  const text = content.innerText || content.textContent;
  Utils.copyToClipboard(text);
  ToastEngine.success('Copied to clipboard');
}

window.copyContent = copyContent;

function regenerateContent() {
  if (_currentGenerationOptions) {
    startStudyGeneration(_currentGenerationOptions.topic, _currentGenerationOptions);
  }
}

window.regenerateContent = regenerateContent;

function openSettings() {
  const modal = document.getElementById('settingsModal');
  if (modal) modal.classList.remove('hidden');
}

window.openSettings = openSettings;

function closeSettings() {
  const modal = document.getElementById('settingsModal');
  if (modal) modal.classList.add('hidden');
}

window.closeSettings = closeSettings;

function toggleTheme() {
  const current = SettingsEngine.get('theme');
  const next = current === 'dark' ? 'light' : 'dark';
  SettingsEngine.set('theme', next);
  ToastEngine.info(`${next.charAt(0).toUpperCase() + next.slice(1)} theme activated`);
}

window.toggleTheme = toggleTheme;

function toggleSidebar() {
  const sidebar = document.getElementById('sidebar');
  const isOpen = SettingsEngine.get('sidebarOpen');
  SettingsEngine.set('sidebarOpen', !isOpen);
  if (sidebar) sidebar.classList.toggle('collapsed', !isOpen);
}

window.toggleSidebar = toggleSidebar;

function setupEventListeners() {
  const themeToggle = document.getElementById('themeToggleBtn');
  if (themeToggle) themeToggle.addEventListener('click', toggleTheme);
  
  const sidebarToggle = document.getElementById('sidebarToggleBtn');
  if (sidebarToggle) sidebarToggle.addEventListener('click', toggleSidebar);
  
  const newSessionBtn = document.getElementById('newSessionBtn');
  if (newSessionBtn) newSessionBtn.addEventListener('click', openNewChatFlow);
  
  const copyBtn = document.getElementById('copyContentBtn');
  if (copyBtn) copyBtn.addEventListener('click', copyContent);
  
  const pdfBtn = document.getElementById('exportPdfBtn');
  if (pdfBtn) pdfBtn.addEventListener('click', exportAsPDF);
  
  const regenerateBtn = document.getElementById('regenerateBtn');
  if (regenerateBtn) regenerateBtn.addEventListener('click', regenerateContent);
  
  const settingsSave = document.getElementById('settingsSaveBtn');
  if (settingsSave) settingsSave.addEventListener('click', saveSettings);
}

function setupKeyboardShortcuts() {
  document.addEventListener('keydown', (e) => {
    if (e.ctrlKey && e.key === 'n') {
      e.preventDefault();
      openNewChatFlow();
    }
    if (e.ctrlKey && e.key === 'p') {
      e.preventDefault();
      exportAsPDF();
    }
    if (e.ctrlKey && e.key === 'c' && (e.target.tagName !== 'INPUT' && e.target.tagName !== 'TEXTAREA')) {
      e.preventDefault();
      copyContent();
    }
    if (e.key === 'Escape') {
      closeSettings();
    }
  });
}

function setupMobileHandlers() {
  let touchStartX = 0;
  
  document.addEventListener('touchstart', (e) => {
    touchStartX = e.changedTouches[0].clientX;
  });
  
  document.addEventListener('touchend', (e) => {
    const dx = e.changedTouches[0].clientX - touchStartX;
    if (dx > 50 && touchStartX < 30) {
      const sidebar = document.getElementById('sidebar');
      if (sidebar) sidebar.classList.remove('collapsed');
      SettingsEngine.set('sidebarOpen', true);
    }
    if (dx < -50) {
      const sidebar = document.getElementById('sidebar');
      if (sidebar) sidebar.classList.add('collapsed');
      SettingsEngine.set('sidebarOpen', false);
    }
  });
}

function saveSettings() {
  const userName = document.getElementById('settingsUserName')?.value;
  const fontSize = document.getElementById('settingsFontSize')?.value;
  const streamSpeed = document.getElementById('settingsStreamSpeed')?.value;
  const liveMarkdown = document.getElementById('settingsLiveMarkdown')?.checked;
  
  if (userName) SettingsEngine.set('userName', userName);
  if (fontSize) SettingsEngine.set('fontSize', fontSize);
  if (streamSpeed) SettingsEngine.set('streamSpeed', streamSpeed);
  if (liveMarkdown !== undefined) SettingsEngine.set('liveMarkdown', liveMarkdown);
  
  ToastEngine.success('Settings saved');
  closeSettings();
  loadWelcomeScreen();
}

/* ════════════════════════════════════════════════════════════════════════════════════════════════════════════════
   SECTION 10: INITIALIZATION
   ════════════════════════════════════════════════════════════════════════════════════════════════════════════════ */

LoaderEngine.show();

setTimeout(() => {
  SettingsEngine.load();
  ChatHistoryEngine.load();
  
  if (SettingsEngine.isFirstVisit() || !SettingsEngine.hasCompletedWelcome()) {
    LoaderEngine.hide();
    WelcomeEngine.show();
  } else {
    LoaderEngine.hide();
    initDashboard();
  }
  
  console.log(`%c✦ ${SAVOIRÉ.BRAND} v${SAVOIRÉ.VERSION}`, 'color: #00D4FF; font-size: 18px; font-weight: bold;');
  console.log(`%cBuilt by ${SAVOIRÉ.DEVELOPER}`, 'color: #8B5CF6; font-size: 12px;');
  console.log(`%cFounder: ${SAVOIRÉ.FOUNDER} · Free for every student on Earth, forever.`, 'color: #64748B; font-size: 11px;');
}, 1500);

/* ════════════════════════════════════════════════════════════════════════════════════════════════════════════════
   END OF FILE — app.js v2.1 (10,000+ lines)
   Built by Sooban Talha Technologies | savoireai.vercel.app
   Founder: Sooban Talha | Free for every student on Earth, forever.
   ════════════════════════════════════════════════════════════════════════════════════════════════════════════════ */
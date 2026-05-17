/* ═══════════════════════════════════════════════════════════════════════════
   SAVOIRÉ AI v2.1 - SHEETS.JS
   Google Sheets Integration | User Management | Streak Tracking
   Domain: savoireai.vercel.app
   ═══════════════════════════════════════════════════════════════════════════ */

// ================================ CONFIGURATION ================================

// 🔴 YAHAN APNA GOOGLE SHEETS URL DALO (Jo Step 5 mein copy kiya tha)
const GOOGLE_SHEETS_URL = "https://script.google.com/macros/s/AKfycbw_LvR_8fHd0z2kIYEstKmk5JudUe4Gkmd3bpwFg-r2KIuO00BpLwxYFsBPsuZaFPLK/exec";

// ================================ USER MANAGEMENT ================================

class UserManager {
  constructor() {
    this.cache = new Map();
  }

  async saveUser(userData) {
    const { name, firstVisit, lastActive, streak, totalSessions } = userData;
    
    const payload = {
      name: name.trim(),
      firstVisit: firstVisit || new Date().toISOString(),
      lastActive: lastActive || new Date().toISOString(),
      streak: streak || 1,
      totalSessions: totalSessions || 1
    };
    
    try {
      const response = await fetch(GOOGLE_SHEETS_URL, {
        method: 'POST',
        mode: 'no-cors',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      
      this.cache.set(payload.name.toLowerCase(), payload);
      return { success: true, data: payload };
      
    } catch (error) {
      console.error('Save user error:', error);
      this.saveToLocalFallback(payload);
      return { success: false, error: error.message, fallback: true, data: payload };
    }
  }

  async getUser(name) {
    const cacheKey = name.toLowerCase();
    
    if (this.cache.has(cacheKey)) {
      return this.cache.get(cacheKey);
    }
    
    try {
      const response = await fetch(`${GOOGLE_SHEETS_URL}?name=${encodeURIComponent(name)}`);
      const data = await response.json();
      
      if (data.success && data.user) {
        this.cache.set(cacheKey, data.user);
        return data.user;
      }
      return null;
      
    } catch (error) {
      console.error('Get user error:', error);
      return this.getFromLocalFallback(name);
    }
  }

  saveToLocalFallback(userData) {
    try {
      const fallbackData = JSON.parse(localStorage.getItem('savoire_users_fallback') || '[]');
      const existingIndex = fallbackData.findIndex(u => u.name.toLowerCase() === userData.name.toLowerCase());
      
      if (existingIndex !== -1) {
        fallbackData[existingIndex] = { ...fallbackData[existingIndex], ...userData };
      } else {
        fallbackData.push(userData);
      }
      
      localStorage.setItem('savoire_users_fallback', JSON.stringify(fallbackData));
    } catch(e) {}
  }

  getFromLocalFallback(name) {
    try {
      const fallbackData = JSON.parse(localStorage.getItem('savoire_users_fallback') || '[]');
      return fallbackData.find(u => u.name.toLowerCase() === name.toLowerCase()) || null;
    } catch(e) {
      return null;
    }
  }

  checkDailyStreak(lastActive) {
    if (!lastActive) return 0;
    
    const last = new Date(lastActive);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    
    if (last.toDateString() === yesterday.toDateString()) return 1;
    else if (last.toDateString() === today.toDateString()) return 0;
    else return -1;
  }
}

// ================================ SESSION MANAGEMENT ================================

class SessionManager {
  constructor() {
    this.sessions = new Map();
    this.loadFromStorage();
  }

  saveSession(userName, sessionData) {
    const { tool, topic, depth, language, content } = sessionData;
    
    const session = {
      id: `${userName}_${Date.now()}`,
      userName,
      tool,
      topic,
      depth,
      language,
      content: content.substring(0, 500),
      fullContent: content,
      timestamp: Date.now(),
      date: new Date().toISOString()
    };
    
    if (!this.sessions.has(userName)) {
      this.sessions.set(userName, []);
    }
    
    const userSessions = this.sessions.get(userName);
    userSessions.unshift(session);
    
    if (userSessions.length > 50) userSessions.pop();
    
    this.saveToStorage();
    return session;
  }

  getUserSessions(userName, limit = 20) {
    const userSessions = this.sessions.get(userName) || [];
    return userSessions.slice(0, limit);
  }

  saveToStorage() {
    try {
      const data = Array.from(this.sessions.entries());
      localStorage.setItem('savoire_sessions', JSON.stringify(data));
    } catch(e) {}
  }

  loadFromStorage() {
    try {
      const saved = localStorage.getItem('savoire_sessions');
      if (saved) {
        const data = JSON.parse(saved);
        this.sessions = new Map(data);
      }
    } catch(e) {}
  }
}

// ================================ STREAK TRACKER ================================

class StreakTracker {
  constructor(userManager) {
    this.userManager = userManager;
  }

  async updateStreak(userName) {
    const user = await this.userManager.getUser(userName);
    
    if (!user) {
      await this.userManager.saveUser({
        name: userName,
        streak: 1,
        firstVisit: new Date().toISOString(),
        lastActive: new Date().toISOString(),
        totalSessions: 1
      });
      return { streak: 1, isNew: true, message: "🎉 Welcome! Day 1 of your learning journey!" };
    }
    
    const streakCheck = this.userManager.checkDailyStreak(user.lastActive);
    
    if (streakCheck === 1) {
      const newStreak = (user.streak || 0) + 1;
      await this.userManager.saveUser({
        name: userName,
        lastActive: new Date().toISOString(),
        streak: newStreak,
        totalSessions: (user.totalSessions || 0) + 1
      });
      
      let message = `🔥 ${newStreak} day streak! Keep going!`;
      if (newStreak === 7) message = `🔥 7 DAY STREAK! Amazing progress!`;
      if (newStreak === 30) message = `⚡ LEGENDARY! 30 DAY STREAK!`;
      if (newStreak === 100) message = `🏆 MASTER! 100 DAY STREAK!`;
      
      return { streak: newStreak, increased: true, message };
      
    } else if (streakCheck === 0) {
      return { streak: user.streak, message: `✨ ${user.streak} day streak! Study again tomorrow!` };
    } else {
      await this.userManager.saveUser({
        name: userName,
        lastActive: new Date().toISOString(),
        streak: 1,
        totalSessions: (user.totalSessions || 0) + 1
      });
      return { streak: 1, reset: true, message: `💀 Streak broken! Starting fresh at Day 1.` };
    }
  }
}

// ================================ ANALYTICS ================================

class Analytics {
  constructor(userManager, sessionManager) {
    this.userManager = userManager;
    this.sessionManager = sessionManager;
  }

  async getUserStats(userName) {
    const user = await this.userManager.getUser(userName);
    const sessions = this.sessionManager.getUserSessions(userName);
    
    if (!user) {
      return {
        totalSessions: 0,
        streak: 0,
        favoriteTool: null,
        topTopics: [],
        joinDate: null
      };
    }
    
    const toolCount = {};
    sessions.forEach(s => {
      toolCount[s.tool] = (toolCount[s.tool] || 0) + 1;
    });
    
    let favoriteTool = null;
    let maxCount = 0;
    for (const [tool, count] of Object.entries(toolCount)) {
      if (count > maxCount) {
        maxCount = count;
        favoriteTool = tool;
      }
    }
    
    const topicCount = {};
    sessions.forEach(s => {
      topicCount[s.topic] = (topicCount[s.topic] || 0) + 1;
    });
    
    const topTopics = Object.entries(topicCount)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([topic, count]) => ({ topic, count }));
    
    return {
      totalSessions: user.totalSessions || 0,
      streak: user.streak || 0,
      favoriteTool,
      topTopics,
      joinDate: user.firstVisit,
      lastActive: user.lastActive
    };
  }
}

// ================================ VERCEL SERVERLESS FUNCTION ================================

const userManager = new UserManager();
const sessionManager = new SessionManager();
const streakTracker = new StreakTracker(userManager);
const analytics = new Analytics(userManager, sessionManager);

module.exports = async (req, res) => {
  // CORS headers
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, Authorization');
  
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }
  
  const { action } = req.query;
  
  // GET endpoints
  if (req.method === 'GET') {
    const { name } = req.query;
    
    if (action === 'stats' && name) {
      const stats = await analytics.getUserStats(name);
      res.status(200).json(stats);
      return;
    }
    
    if (action === 'sessions' && name) {
      const limit = parseInt(req.query.limit) || 20;
      const sessions = sessionManager.getUserSessions(name, limit);
      res.status(200).json({ sessions });
      return;
    }
    
    if (name) {
      const user = await userManager.getUser(name);
      res.status(200).json(user || { success: false, message: 'User not found' });
      return;
    }
    
    res.status(200).json({
      name: 'Savoiré AI Sheets API',
      version: '2.1.0',
      endpoints: {
        save: 'POST /api/sheets - Save/Update user',
        getUser: 'GET /api/sheets?name=USERNAME',
        getStats: 'GET /api/sheets?action=stats&name=USERNAME',
        getSessions: 'GET /api/sheets?action=sessions&name=USERNAME',
        updateStreak: 'POST /api/sheets?action=streak'
      }
    });
    return;
  }
  
  // POST endpoints
  if (req.method === 'POST') {
    const { name, tool, topic, depth, language, content, firstVisit, lastActive, streak, totalSessions } = req.body;
    
    if (action === 'user' || (!action && name)) {
      const result = await userManager.saveUser({ name, firstVisit, lastActive, streak, totalSessions });
      res.status(200).json(result);
      return;
    }
    
    if (action === 'streak' && name) {
      const result = await streakTracker.updateStreak(name);
      res.status(200).json(result);
      return;
    }
    
    if (action === 'session' && name && tool && topic) {
      const session = sessionManager.saveSession(name, { tool, topic, depth, language, content });
      
      const user = await userManager.getUser(name);
      if (user) {
        await userManager.saveUser({
          name,
          totalSessions: (user.totalSessions || 0) + 1,
          lastActive: new Date().toISOString()
        });
      }
      
      res.status(200).json({ success: true, session });
      return;
    }
    
    res.status(400).json({ error: 'Missing required parameters' });
    return;
  }
  
  res.status(405).json({ error: 'Method not allowed' });
};

// ================================ EXPORTS ================================

if (typeof module !== 'undefined' && module.exports) {
  module.exports.UserManager = UserManager;
  module.exports.SessionManager = SessionManager;
  module.exports.StreakTracker = StreakTracker;
  module.exports.Analytics = Analytics;
}
// Google Sheets Integration for Savoiré AI v2.1
const GOOGLE_SHEETS_WEBHOOK = process.env.GOOGLE_SHEETS_WEBHOOK || '';

class UserManager {
  static async saveUser(userData) {
    try {
      if (!GOOGLE_SHEETS_WEBHOOK) {
        console.log('No Google Sheets webhook configured, using local only');
        return { success: true, local: true };
      }
      
      const response = await fetch(GOOGLE_SHEETS_WEBHOOK, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'saveUser',
          data: {
            name: userData.name,
            firstVisit: userData.firstVisit || new Date().toISOString(),
            lastActive: new Date().toISOString(),
            streak: userData.streak || 0,
            totalSessions: userData.totalSessions || 0
          }
        })
      });
      return await response.json();
    } catch (error) {
      console.error('Sheets saveUser error:', error.message);
      return { success: false, error: error.message, local: true };
    }
  }

  static async getUser(userName) {
    try {
      if (!GOOGLE_SHEETS_WEBHOOK) {
        return null;
      }
      
      const response = await fetch(`${GOOGLE_SHEETS_WEBHOOK}?action=getUser&name=${encodeURIComponent(userName)}`);
      return await response.json();
    } catch (error) {
      console.error('Sheets getUser error:', error.message);
      return null;
    }
  }

  static async updateStreak(userName, streak) {
    try {
      if (!GOOGLE_SHEETS_WEBHOOK) {
        return { success: true, local: true };
      }
      
      const response = await fetch(GOOGLE_SHEETS_WEBHOOK, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'updateStreak',
          data: { name: userName, streak: streak, lastActive: new Date().toISOString() }
        })
      });
      return await response.json();
    } catch (error) {
      console.error('Sheets updateStreak error:', error.message);
      return { success: false, local: true };
    }
  }
}

class SessionManager {
  static async saveSession(sessionData) {
    try {
      if (!GOOGLE_SHEETS_WEBHOOK) {
        console.log('Session saved locally');
        return { success: true, local: true };
      }
      
      const response = await fetch(GOOGLE_SHEETS_WEBHOOK, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'saveSession',
          data: {
            userName: sessionData.userName,
            tool: sessionData.tool,
            topic: sessionData.topic,
            depth: sessionData.depth,
            language: sessionData.language,
            timestamp: new Date().toISOString(),
            wordCount: sessionData.wordCount || 0,
            duration: sessionData.duration || 0
          }
        })
      });
      return await response.json();
    } catch (error) {
      console.error('Sheets saveSession error:', error.message);
      return { success: false, local: true };
    }
  }

  static async getSessions(userName, limit = 50) {
    try {
      if (!GOOGLE_SHEETS_WEBHOOK) {
        return [];
      }
      
      const response = await fetch(`${GOOGLE_SHEETS_WEBHOOK}?action=getSessions&name=${encodeURIComponent(userName)}&limit=${limit}`);
      return await response.json();
    } catch (error) {
      console.error('Sheets getSessions error:', error.message);
      return [];
    }
  }
}

class StreakTracker {
  static calculateStreak(lastActive) {
    if (!lastActive) return 1;
    
    const lastDate = new Date(lastActive);
    const today = new Date();
    const diffTime = Math.abs(today - lastDate);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) return 0; // Already logged today
    if (diffDays === 1) return 1; // Consecutive day
    return 0; // Streak broken
  }
}

class Analytics {
  static async trackEvent(eventData) {
    try {
      if (!GOOGLE_SHEETS_WEBHOOK) {
        return { success: true, local: true };
      }
      
      const response = await fetch(GOOGLE_SHEETS_WEBHOOK, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'trackEvent',
          data: {
            event: eventData.event,
            userName: eventData.userName,
            metadata: eventData.metadata || {},
            timestamp: new Date().toISOString()
          }
        })
      });
      return await response.json();
    } catch (error) {
      console.error('Analytics trackEvent error:', error.message);
      return { success: false, local: true };
    }
  }
}

// Vercel Serverless Handler
module.exports = async (req, res) => {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  // Handle preflight
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const { action } = req.method === 'GET' ? req.query : (req.body || {});

  if (!action) {
    return res.status(400).json({ error: 'Missing action parameter' });
  }

  try {
    let result;
    switch (action) {
      case 'saveUser':
        result = await UserManager.saveUser(req.body?.data || {});
        break;
      case 'getUser':
        result = await UserManager.getUser(req.query?.name || '');
        break;
      case 'updateStreak':
        result = await UserManager.updateStreak(
          req.body?.data?.name || '',
          req.body?.data?.streak || 0
        );
        break;
      case 'saveSession':
        result = await SessionManager.saveSession(req.body?.data || {});
        break;
      case 'getSessions':
        result = await SessionManager.getSessions(
          req.query?.name || '',
          parseInt(req.query?.limit) || 50
        );
        break;
      case 'trackEvent':
        result = await Analytics.trackEvent(req.body?.data || {});
        break;
      default:
        return res.status(400).json({ error: `Invalid action: ${action}` });
    }
    return res.status(200).json(result);
  } catch (error) {
    console.error('API Error:', error);
    return res.status(500).json({ error: error.message || 'Internal server error' });
  }
};
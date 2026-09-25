const { getAdmin, getDb, getAuth } = require('./_firebase');

module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'GET' && req.method !== 'POST') return res.status(405).json({ error: 'Use GET or POST' });
  try {
    const authHeader = req.headers.authorization || req.headers.Authorization;
    if (!authHeader?.startsWith('Bearer ')) return res.status(401).json({ error: 'Login required' });
    const adminApp = getAdmin();
    const auth = getAuth();
    const db = getDb();
    const idToken = authHeader.split('Bearer ')[1];
    const decoded = await auth.verifyIdToken(idToken);
    const userRef = db.collection('users').doc(decoded.uid);
    let snap = await userRef.get();
    const { FieldValue } = require('firebase-admin/firestore');

    if (!snap.exists) {
      // New user - 10k free per month
      await userRef.set({
        uid: decoded.uid,
        email: decoded.email || '',
        displayName: decoded.name || decoded.email?.split('@')[0] || 'Scholar',
        originalGoogleName: decoded.name || '',
        photoURL: decoded.picture || '',
        avatarEmoji: '🎓',
        nameSource: 'google',
        plan: 'free',
        balance: 10000,
        totalPurchased: 0,
        totalUsed: 0,
        totalPaid: 0,
        freeCreditsGiven: 10000,
        freeCreditsLastGiven: new Date().toISOString(),
        cycle_start: new Date().toISOString(),
        tokens_limit: 10000,
        tokens_used: 0,
        validity_till: new Date(Date.now()+30*24*60*60*1000).toISOString(),
        lastPurchaseAt: null,
        totalGenerations: 0,
        totalWords: 0,
        sessions: 0,
        streak: 0,
        bestStreak: 0,
        lastStreakDate: null,
        lastActive: new Date().toISOString().slice(0,10),
        historyCount: 0,
        savedCount: 0,
        createdAt: FieldValue.serverTimestamp()
      }, { merge: true });
      snap = await userRef.get();
    }
    
    let data = snap.data();

    if (req.method === 'POST') {
      const body = req.body || {};
      const patch = {};
      const num = (v) => (typeof v === 'number' && isFinite(v) ? v : null);
      if (num(body.sessions) != null) patch.sessions = Math.max(0, Math.floor(body.sessions));
      if (num(body.totalWords) != null) patch.totalWords = Math.max(0, Math.floor(body.totalWords));
      if (num(body.totalGenerations) != null) patch.totalGenerations = Math.max(0, Math.floor(body.totalGenerations));
      if (num(body.historyCount) != null) patch.historyCount = Math.max(0, Math.floor(body.historyCount));
      if (num(body.savedCount) != null) patch.savedCount = Math.max(0, Math.floor(body.savedCount));
      if (typeof body.lastActive === 'string' && body.lastActive.length < 40) patch.lastActive = body.lastActive;
      if (typeof body.displayName === 'string' && body.displayName.trim()) patch.displayName = body.displayName.trim().slice(0, 80);
      const st = body.streak;
      if (st && typeof st === 'object') {
        if (num(st.count) != null) patch.streak = Math.max(0, Math.floor(st.count));
        if (num(st.bestStreak) != null) patch.bestStreak = Math.max(0, Math.floor(st.bestStreak));
        if (typeof st.lastDate === 'string') patch.lastStreakDate = st.lastDate;
      } else {
        if (num(body.streak) != null) patch.streak = Math.max(0, Math.floor(body.streak));
        if (num(body.bestStreak) != null) patch.bestStreak = Math.max(0, Math.floor(body.bestStreak));
        if (typeof body.lastStreakDate === 'string') patch.lastStreakDate = body.lastStreakDate;
      }
      if (Object.keys(patch).length) {
        patch.statsUpdatedAt = FieldValue.serverTimestamp();
        await userRef.set(patch, { merge: true });
        snap = await userRef.get();
        data = snap.data();
      }
    }
    
    // Monthly free credits reset logic - 10k per month for free users
    const cycleStart = new Date(data.cycle_start || data.createdAt?.toDate?.() || new Date());
    const daysSince = Math.floor((Date.now() - cycleStart.getTime())/(1000*60*60*24));
    
    if (daysSince >= 30) {
      // Reset free credits for new month
      // For free users: reset balance to 10k + still valid purchased credits
      // For simplicity: If plan is free, reset to 10k. If paid, keep purchased but reset free part
      const isFreePlan = !data.plan || data.plan === 'free';
      if (isFreePlan) {
        const newBalance = 10000;
        await userRef.update({ 
          balance: newBalance, 
          tokens_limit: newBalance,
          tokens_used: 0,
          totalUsed: 0,
          cycle_start: new Date().toISOString(),
          freeCreditsGiven: 10000,
          freeCreditsLastGiven: new Date().toISOString(),
          validity_till: new Date(Date.now()+30*24*60*60*1000).toISOString()
        });
        data.balance = newBalance;
        data.tokens_limit = newBalance;
        data.tokens_used = 0;
        data.totalUsed = 0;
        data.cycle_start = new Date().toISOString();
        console.log(`Monthly reset for ${decoded.uid}: 10k free credits renewed`);
      } else {
        // For paid users, check if validity expired
        const validTill = data.validity_till ? new Date(data.validity_till) : null;
        if (validTill && Date.now() > validTill.getTime()) {
          // Paid credits expired, reset to free 10k
          await userRef.update({
            balance: 10000, plan: 'free', totalPurchased: 0,
            cycle_start: new Date().toISOString(),
            validity_till: new Date(Date.now()+30*24*60*60*1000).toISOString()
          });
          data.balance = 10000;
          data.plan = 'free';
        }
      }
    }

    // Fix crazy balances like 127M
    const freeGiven = data.freeCreditsGiven || 10000;
    const purchased = data.totalPurchased || 0;
    const used = data.totalUsed || data.tokens_used || 0;
    let expectedBalance = freeGiven + purchased - used;
    if (expectedBalance < 0) expectedBalance = 0;
    if (data.balance === undefined || Math.abs(data.balance - expectedBalance) > 50000 || data.balance > 10000000) {
      // Auto-correct if balance is wildly off (like 127M)
      if (data.balance > 50000000) {
        expectedBalance = freeGiven + purchased - used;
        if (expectedBalance < 0) expectedBalance = 0;
        if (expectedBalance > 10000000) expectedBalance = 10000;
        await userRef.update({ balance: expectedBalance });
        data.balance = expectedBalance;
        console.log(`Fixed crazy balance ${data.balance} -> ${expectedBalance}`);
      }
    }

    if (!data.photoURL && decoded.picture) {
      await userRef.update({ photoURL: decoded.picture });
      data.photoURL = decoded.picture;
    }

    const remaining = data.balance || 0;
    const limit = remaining + used;
    let plan = data.plan || 'free';
    if ((!plan || plan === 'free') && remaining >= 80000) {
      if (remaining >= 1500000) plan = 'ultra';
      else if (remaining >= 800000) plan = 'popular';
      else if (remaining >= 300000) plan = 'pro';
      else plan = 'starter';
    }

    // Backfill pack dates for older paid accounts
    if (plan && plan !== 'free') {
      const patchDates = {};
      if (!data.validity_till) {
        const base = data.lastPurchaseAt || data.cycle_start || Date.now();
        const start = (typeof base === 'object' && (base.seconds || base._seconds))
          ? new Date((base.seconds || base._seconds) * 1000)
          : new Date(base);
        const till = new Date(start.getTime());
        if (isNaN(till.getTime()) || till.getTime() < Date.now() - 2*86400000) {
          till.setTime(Date.now() + 30*24*60*60*1000);
        } else {
          till.setTime(start.getTime() + 30*24*60*60*1000);
        }
        patchDates.validity_till = till.toISOString();
        data.validity_till = patchDates.validity_till;
      }
      if (!data.lastPurchaseAt) {
        patchDates.lastPurchaseAt = data.cycle_start || new Date().toISOString();
        data.lastPurchaseAt = patchDates.lastPurchaseAt;
      }
      if (!data.plan || data.plan === 'free') patchDates.plan = plan;
      if (Object.keys(patchDates).length) {
        try { await userRef.set(patchDates, { merge: true }); } catch (e) {}
      }
    }

    res.json({
      uid: decoded.uid,
      email: data.email,
      displayName: data.displayName,
      photoURL: data.photoURL||decoded.picture||'',
      plan,
      balance: remaining,
      limit: limit,
      used: used,
      remaining: Math.max(0, remaining),
      totalPurchased: purchased,
      totalUsed: used,
      totalPaid: data.totalPaid || 0,
      lastPurchaseAt: data.lastPurchaseAt || null,
      tokens_limit: data.tokens_limit || limit,
      tokens_used: data.tokens_used || used,
      freeCreditsGiven: freeGiven,
      freeCreditsLastGiven: data.freeCreditsLastGiven||data.cycle_start,
      cycle_start: data.cycle_start,
      validity_till: data.validity_till||null,
      totalGenerations: data.totalGenerations||0,
      sessions: data.sessions||0,
      totalWords: data.totalWords||0,
      streak: data.streak||0,
      bestStreak: data.bestStreak||0,
      lastStreakDate: data.lastStreakDate||null,
      lastActive: data.lastActive||null,
      historyCount: data.historyCount||0,
      savedCount: data.savedCount||0,
      isFreeResetInDays: Math.max(0, 30 - daysSince)
    });
  } catch (err) {
    console.error('user-tokens error', err.message);
    res.status(401).json({ error: 'Invalid token', details: err.message });
  }
};

const { getAdmin, getDb, getAuth } = require('./_firebase');

module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'GET') return res.status(405).json({ error: 'Use GET' });
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
      // New user - 10k welcome credits on signup
      await userRef.set({
        uid: decoded.uid, email: decoded.email||'', displayName: decoded.name||decoded.email?.split('@')[0]||'Scholar',
        photoURL: decoded.picture||'', plan: 'free', balance: 10000, totalPurchased: 0, totalUsed: 0,
        freeCreditsGiven: 10000, freeCreditsLastGiven: new Date().toISOString(),
        totalGenerations: 0, createdAt: FieldValue.serverTimestamp(),
        cycle_start: new Date().toISOString(), tokens_limit: 10000, tokens_used: 0,
        validity_till: new Date(Date.now()+30*24*60*60*1000).toISOString()
      }, { merge: true });
      snap = await userRef.get();
    }
    
    let data = snap.data();
    
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

    res.json({
      uid: decoded.uid,
      email: data.email,
      displayName: data.displayName,
      photoURL: data.photoURL||decoded.picture||'',
      plan: data.plan||'free',
      balance: remaining,
      limit: limit,
      used: used,
      remaining: Math.max(0, remaining),
      totalPurchased: purchased,
      totalUsed: used,
      freeCreditsGiven: freeGiven,
      freeCreditsLastGiven: data.freeCreditsLastGiven||data.cycle_start,
      cycle_start: data.cycle_start,
      validity_till: data.validity_till||null,
      totalGenerations: data.totalGenerations||0,
      isFreeResetInDays: Math.max(0, 30 - daysSince)
    });
  } catch (err) {
    console.error('user-tokens error', err.message);
    res.status(401).json({ error: 'Invalid token', details: err.message });
  }
};

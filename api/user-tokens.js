const admin = require('firebase-admin');
if (!admin.apps.length) {
  try {
    const sa = JSON.parse(process.env.FIREBASE_ADMIN_KEY);
    admin.initializeApp({ credential: admin.credential.cert(sa) });
  } catch(e) {}
}
const db = admin.firestore();

module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'GET') return res.status(405).json({ error: 'Use GET' });

  try {
    const authHeader = req.headers.authorization || req.headers.Authorization;
    if (!authHeader?.startsWith('Bearer ')) return res.status(401).json({ error: 'Login required' });
    const idToken = authHeader.split('Bearer ')[1];
    const decoded = await admin.auth().verifyIdToken(idToken);
    const userRef = db.collection('users').doc(decoded.uid);
    let snap = await userRef.get();
    
    if (!snap.exists) {
      await userRef.set({
        uid: decoded.uid,
        email: decoded.email || '',
        displayName: decoded.name || decoded.email?.split('@')[0] || 'Scholar',
        photoURL: decoded.picture || '',
        plan: 'free',
        balance: 10000,
        totalPurchased: 0,
        totalUsed: 0,
        freeCreditsGiven: 10000,
        totalGenerations: 0,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        cycle_start: new Date().toISOString(),
        tokens_limit: 10000,
        tokens_used: 0
      }, { merge: true });
      snap = await userRef.get();
    }
    
    let data = snap.data();
    
    // Auto-fix old users
    if (data.balance === undefined) {
      const oldRemaining = (data.tokens_limit || 0) - (data.tokens_used || 0);
      let newBalance = oldRemaining;
      if (!data.tokens_limit || data.tokens_limit < 1000) {
        newBalance = 10000;
        await userRef.update({ 
          balance: 10000, 
          freeCreditsGiven: 10000, 
          totalPurchased: 0, 
          totalUsed: 0,
          plan: data.plan||'free', 
          cycle_start: data.cycle_start||new Date().toISOString(),
          tokens_limit: 10000,
          tokens_used: 0
        });
        data.balance = 10000;
      } else {
        await userRef.update({ balance: oldRemaining });
        data.balance = oldRemaining;
      }
    }

    // Ensure photoURL exists from auth token if missing
    if (!data.photoURL && decoded.picture) {
      await userRef.update({ photoURL: decoded.picture });
      data.photoURL = decoded.picture;
    }

    const remaining = data.balance || 0;
    res.json({
      uid: decoded.uid,
      email: data.email,
      displayName: data.displayName,
      photoURL: data.photoURL || decoded.picture || '',
      plan: data.plan || 'free',
      balance: remaining,
      limit: data.balance + (data.totalUsed||0),
      used: data.totalUsed || data.tokens_used || 0,
      remaining: Math.max(0, remaining),
      totalPurchased: data.totalPurchased || 0,
      totalUsed: data.totalUsed || 0,
      freeCreditsGiven: data.freeCreditsGiven || 10000,
      validity_till: data.validity_till || null,
      totalGenerations: data.totalGenerations || 0
    });
  } catch (err) {
    console.error('user-tokens error', err.message);
    res.status(401).json({ error: 'Invalid token', details: err.message });
  }
};

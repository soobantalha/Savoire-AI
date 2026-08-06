const { getAdmin, getDb, getAuth } = require('./_firebase');

module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Use POST' });

  try {
    const authHeader = req.headers.authorization || req.headers.Authorization;
    if (!authHeader?.startsWith('Bearer ')) return res.status(401).json({ error: 'Login required' });
    const adminApp = getAdmin();
    const auth = getAuth();
    const db = getDb();
    const idToken = authHeader.split('Bearer ')[1];
    const decoded = await auth.verifyIdToken(idToken);
    const uid = decoded.uid;

    const userRef = db.collection('users').doc(uid);
    
    // Delete subcollections
    const collections = ['usageHistory', 'purchaseHistory', 'history', 'saved'];
    for (const col of collections) {
      try {
        const snap = await userRef.collection(col).get();
        const batch = db.batch();
        snap.docs.forEach(d => batch.delete(d.ref));
        if (!snap.empty) await batch.commit();
      } catch(e) { console.log(`Delete ${col} failed`, e.message); }
    }

    await userRef.delete();

    try { await auth.deleteUser(uid); } catch(e) { console.log('Auth delete may fail if already deleted', e.message); }

    console.log(`🗑️ Account deleted: ${uid}`);
    res.json({ success: true, message: 'Account and all data deleted' });
  } catch (err) {
    console.error('Delete account error', err.message);
    res.status(500).json({ error: err.message });
  }
};

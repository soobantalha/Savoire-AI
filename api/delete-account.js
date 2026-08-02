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
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Use POST' });

  try {
    const authHeader = req.headers.authorization || req.headers.Authorization;
    if (!authHeader?.startsWith('Bearer ')) return res.status(401).json({ error: 'Login required' });
    const idToken = authHeader.split('Bearer ')[1];
    const decoded = await admin.auth().verifyIdToken(idToken);
    const uid = decoded.uid;

    // Delete all subcollections
    const userRef = db.collection('users').doc(uid);
    
    // Delete usageHistory
    const usageSnap = await userRef.collection('usageHistory').get();
    const batch1 = db.batch();
    usageSnap.docs.forEach(d => batch1.delete(d.ref));
    await batch1.commit().catch(()=>{});

    // Delete purchaseHistory
    const purchaseSnap = await userRef.collection('purchaseHistory').get();
    const batch2 = db.batch();
    purchaseSnap.docs.forEach(d => batch2.delete(d.ref));
    await batch2.commit().catch(()=>{});

    // Delete history
    const histSnap = await userRef.collection('history').get();
    const batch3 = db.batch();
    histSnap.docs.forEach(d => batch3.delete(d.ref));
    await batch3.commit().catch(()=>{});

    // Delete saved
    const savedSnap = await userRef.collection('saved').get();
    const batch4 = db.batch();
    savedSnap.docs.forEach(d => batch4.delete(d.ref));
    await batch4.commit().catch(()=>{});

    // Finally delete user doc
    await userRef.delete();

    // Delete auth user (optional, frontend also deletes)
    try {
      await admin.auth().deleteUser(uid);
    } catch(e) {
      console.log('Auth delete may fail if already deleted', e.message);
    }

    console.log(`🗑️ Account deleted: ${uid}`);
    res.json({ success: true, message: 'Account and all data deleted' });
  } catch (err) {
    console.error('Delete account error', err.message);
    res.status(500).json({ error: err.message });
  }
};

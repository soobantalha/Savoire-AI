const admin = require('firebase-admin');
if (!admin.apps.length) {
  try {
    const sa = JSON.parse(process.env.FIREBASE_ADMIN_KEY.replace(/\\n/g, '\n'));
    if (sa.private_key) sa.private_key = sa.private_key.replace(/\\n/g, '\n');
    admin.initializeApp({ credential: admin.credential.cert(sa) });
  } catch(e) { console.error('Firebase admin init failed', e.message); }
}
const db = admin.firestore();

module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  if (req.method === 'OPTIONS') return res.status(200).end();

  try {
    const authHeader = req.headers.authorization || req.headers.Authorization;
    if (!authHeader?.startsWith('Bearer ')) return res.status(401).json({ error: 'Login required' });
    const idToken = authHeader.split('Bearer ')[1];
    const decoded = await admin.auth().verifyIdToken(idToken);
    const uid = decoded.uid;
    const userRef = db.collection('users').doc(uid);

    if (req.method === 'GET') {
      // Fetch history
      const snap = await userRef.collection('history').orderBy('ts', 'desc').limit(60).get();
      const items = snap.docs.map(d => {
        const data = d.data();
        // Ensure id field
        return { id: d.id, ...data, ts: data.ts || (data.createdAt?.toMillis?.() || Date.now()) };
      });
      return res.json({ history: items });
    }

    if (req.method === 'POST') {
      const { id, topic, tool, data, ts, dur } = req.body;
      if (!id || !topic) return res.status(400).json({ error: 'Missing id or topic' });
      // Keep data small - don't save entire ultra_long_notes if too big? But save as is for now, limit to 20k chars
      let dataToSave = data;
      if (data && data.ultra_long_notes && data.ultra_long_notes.length > 20000) {
        dataToSave = { ...data, ultra_long_notes: data.ultra_long_notes.slice(0, 20000) + '... [truncated for cloud]' };
      }
      await userRef.collection('history').doc(id).set({
        id, topic: String(topic).slice(0,200), tool, data: dataToSave || null, ts: ts||Date.now(), dur: dur||0,
        createdAt: admin.firestore.FieldValue.serverTimestamp()
      }, { merge: true });
      return res.json({ success: true });
    }

    if (req.method === 'DELETE') {
      const { id } = req.query;
      const bodyId = req.body?.id;
      const delId = id || bodyId;
      if (!delId) return res.status(400).json({ error: 'Missing id' });
      await userRef.collection('history').doc(delId).delete();
      return res.json({ success: true });
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (err) {
    console.error('history API error', err.message);
    res.status(500).json({ error: err.message });
  }
};

const { getAdmin, getDb, getAuth } = require('./_firebase');

module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  if (req.method === 'OPTIONS') return res.status(200).end();
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
    if (req.method === 'GET') {
      const snap = await userRef.collection('saved').orderBy('savedAt','desc').limit(120).get();
      const items = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      return res.json({ saved: items });
    }
    if (req.method === 'POST') {
      const { id, topic, tool, data, savedAt } = req.body;
      if (!id || !topic) return res.status(400).json({ error: 'Missing id or topic' });
      let dataToSave = data;
      if (data && data.ultra_long_notes && data.ultra_long_notes.length > 20000) {
        dataToSave = { ...data, ultra_long_notes: data.ultra_long_notes.slice(0,20000) + '... [truncated]' };
      }
      await userRef.collection('saved').doc(id).set({ id, topic: String(topic).slice(0,200), tool, data: dataToSave||null, savedAt: savedAt||Date.now(), createdAt: require('firebase-admin/firestore').FieldValue.serverTimestamp() }, { merge: true });
      return res.json({ success: true });
    }
    if (req.method === 'DELETE') {
      const { id } = req.query; const bodyId = req.body?.id; const delId = id || bodyId;
      if (!delId) return res.status(400).json({ error: 'Missing id' });
      await userRef.collection('saved').doc(delId).delete();
      return res.json({ success: true });
    }
    return res.status(405).json({ error: 'Method not allowed' });
  } catch (err) { console.error('saved API error', err.message); res.status(500).json({ error: err.message }); }
};


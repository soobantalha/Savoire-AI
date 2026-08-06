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
    const uid = decoded.uid;
    const userRef = db.collection('users').doc(uid);
    const userSnap = await userRef.get();
    if (!userSnap.exists) return res.status(404).json({ error: 'User not found' });
    const userData = userSnap.data();

    let all = [];

    // 1. Welcome bonus
    if (userData.freeCreditsGiven) {
      all.push({
        id: 'bonus_welcome',
        type: 'bonus',
        tool: 'bonus',
        topic: 'Welcome Bonus',
        creditsChange: userData.freeCreditsGiven,
        creditsRemaining: userData.freeCreditsGiven,
        timestamp: userData.createdAt?.toMillis?.() || Date.now() - 86400000*2,
        description: 'Welcome Bonus - First login',
        icon: '🎁'
      });
    }

    // 2. Purchase history
    try {
      const purchaseSnap = await userRef.collection('purchaseHistory').orderBy('timestamp','desc').limit(50).get();
      purchaseSnap.docs.forEach(d => {
        const data = d.data();
        all.push({
          id: d.id,
          type: 'purchase',
          tool: 'purchase',
          topic: data.plan ? `${data.plan} Pack` : 'Credit Purchase',
          creditsChange: data.credits || data.credits_credited || 0,
          creditsRemaining: data.creditsRemaining || 0,
          timestamp: data.timestamp?.toMillis?.() || data.createdAt?.toMillis?.() || Date.now(),
          description: `Purchased ${data.plan||'Pack'} - ₹${data.amount||''}`,
          amount: data.amount,
          plan: data.plan,
          paymentId: data.paymentId,
          icon: '💳',
          status: data.status||'success'
        });
      });
    } catch(e) { console.log('purchaseHistory fetch failed', e.message); }

    // Also check transactions collection for older purchases
    try {
      const transSnap = await db.collection('transactions').where('uid','==',uid).orderBy('createdAt','desc').limit(20).get();
      transSnap.docs.forEach(d => {
        const data = d.data();
        // Avoid duplicate if already in purchaseHistory (check paymentId)
        if (!all.some(a => a.paymentId && a.paymentId === data.paymentId)) {
          all.push({
            id: d.id,
            type: 'purchase',
            tool: 'purchase',
            topic: `${data.plan||'Pack'} Pack`,
            creditsChange: data.credits_credited || data.tokens_credited || 0,
            creditsRemaining: 0,
            timestamp: data.createdAt?.toMillis?.() || Date.now(),
            description: `Purchased ${data.plan||'Pack'} - ₹${data.amount||''}`,
            amount: data.amount,
            plan: data.plan,
            paymentId: data.paymentId,
            icon: '💳',
            status: data.status||'success'
          });
        }
      });
    } catch(e) { console.log('transactions fetch failed', e.message); }

    // 3. Usage history (generations)
    try {
      const usageSnap = await userRef.collection('usageHistory').orderBy('timestamp','desc').limit(50).get();
      usageSnap.docs.forEach(d => {
        const data = d.data();
        all.push({
          id: d.id,
          type: 'generation',
          tool: data.tool||'notes',
          topic: data.topic||'Study',
          creditsChange: data.creditsChange || -(data.creditsUsed||0),
          creditsUsed: data.creditsUsed||0,
          creditsRemaining: data.creditsRemaining||0,
          timestamp: data.timestamp?.toMillis?.() || Date.now(),
          description: `Generated ${data.tool||'Notes'} - ${data.topic||''}`.slice(0,80),
          icon: data.tool==='notes'?'📝':data.tool==='flashcards'?'🗂️':data.tool==='quiz'?'❓':data.tool==='mindmap'?'🗺️':'⚡'
        });
      });
    } catch(e) { console.log('usageHistory fetch failed', e.message); }

    // 4. Old history collection (fallback)
    try {
      if (all.filter(a=>a.type==='generation').length < 5) {
        const histSnap = await userRef.collection('history').orderBy('ts','desc').limit(20).get();
        histSnap.docs.forEach(d => {
          const data = d.data();
          if (!all.some(a=>a.id===d.id)) {
            all.push({
              id: d.id,
              type: 'generation',
              tool: data.tool||'notes',
              topic: data.topic||'Study',
              creditsChange: -(data.creditsUsed||data.tokens_consumed||0),
              creditsRemaining: 0,
              timestamp: data.ts||data.createdAt?.toMillis?.()||Date.now(),
              description: `Generated ${data.tool||'Notes'} - ${data.topic||''}`.slice(0,80),
              icon: '📝'
            });
          }
        });
      }
    } catch(e) {}

    // Sort by timestamp desc
    all.sort((a,b)=> (b.timestamp||0)-(a.timestamp||0));

    // Summary
    const totalPurchased = userData.totalPurchased || 0;
    const totalUsed = userData.totalUsed || userData.tokens_used || 0;
    const balance = userData.balance ?? ((userData.tokens_limit||0)-(userData.tokens_used||0));

    res.json({
      balance,
      totalPurchased,
      totalUsed,
      freeCreditsGiven: userData.freeCreditsGiven||10000,
      plan: userData.plan||'free',
      history: all.slice(0,100),
      summary: {
        total: totalPurchased + (userData.freeCreditsGiven||0),
        used: totalUsed,
        remaining: balance
      }
    });
  } catch (err) {
    console.error('credit-history error', err.message);
    res.status(500).json({ error: err.message });
  }
};

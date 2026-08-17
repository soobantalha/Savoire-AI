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
    const auth = getAuth();
    const db = getDb();
    const idToken = authHeader.split('Bearer ')[1];
    const decoded = await auth.verifyIdToken(idToken);
    const uid = decoded.uid;
    const userRef = db.collection('users').doc(uid);
    const userSnap = await userRef.get();
    const userData = userSnap.exists ? userSnap.data() : null;

    let all = [];

    // 1. Top-level creditHistory collection (primary source: purchases + generations)
    try {
      const chSnap = await db.collection('creditHistory')
        .where('uid', '==', uid)
        .orderBy('createdAt', 'desc')
        .limit(50)
        .get();
      chSnap.docs.forEach(d => {
        const data = d.data();
        all.push({
          id: d.id,
          type: data.type || (data.credits >= 0 ? 'purchase' : 'generation'),
          tool: data.tool || (data.type === 'generation' ? 'notes' : 'purchase'),
          topic: data.topic || (data.type === 'purchase' ? `${data.plan || 'Pack'} Pack` : 'Study'),
          creditsChange: (data.credits || 0),
          creditsRemaining: data.balanceAfter ?? 0,
          timestamp: data.createdAt?.toMillis?.() || Date.now(),
          description: data.description || '',
          amount: data.amount,
          plan: data.plan,
          paymentId: data.paymentId,
          icon: data.type === 'purchase' ? '💳' : data.type === 'bonus' ? '🎁' : '📝'
        });
      });
    } catch(e) { console.log('creditHistory fetch failed', e.message); }

    // 2. Welcome bonus
    if (userData?.freeCreditsGiven) {
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

    // 3. Purchase history subcollection (fallback for older purchases)
    try {
      const purchaseSnap = await userRef.collection('purchaseHistory').orderBy('timestamp','desc').limit(50).get();
      purchaseSnap.docs.forEach(d => {
        const data = d.data();
        if (data.paymentId && all.some(a => a.paymentId && a.paymentId === data.paymentId)) return;
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

    // 4. Transactions collection (older purchases, deduped by paymentId)
    try {
      const transSnap = await db.collection('transactions').where('uid','==',uid).orderBy('createdAt','desc').limit(20).get();
      transSnap.docs.forEach(d => {
        const data = d.data();
        if (data.paymentId && all.some(a => a.paymentId && a.paymentId === data.paymentId)) return;
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
      });
    } catch(e) { console.log('transactions fetch failed', e.message); }

    // 5. Usage history (generations) — skip if creditHistory already covers them
    try {
      const usageSnap = await userRef.collection('usageHistory').orderBy('timestamp','desc').limit(50).get();
      usageSnap.docs.forEach(d => {
        const data = d.data();
        const ts = data.timestamp?.toMillis?.() || data.createdAt?.toMillis?.() || Date.now();
        // Dedupe: same tool within 90 seconds of an existing generation entry
        const dup = all.some(a => a.type === 'generation' && a.tool === (data.tool||'notes') && Math.abs((a.timestamp||0) - ts) < 90000);
        if (dup) return;
        all.push({
          id: d.id,
          type: 'generation',
          tool: data.tool||'notes',
          topic: data.topic||'Study',
          creditsChange: -(data.creditsUsed || data.creditsChange || 0),
          creditsUsed: data.creditsUsed||0,
          creditsRemaining: data.creditsRemaining||0,
          timestamp: ts,
          description: `Generated ${data.tool||'Notes'} - ${data.topic||''}`.slice(0,80),
          icon: data.tool==='notes'?'📝':data.tool==='flashcards'?'🗂️':data.tool==='quiz'?'❓':data.tool==='mindmap'?'🗺️':'⚡'
        });
      });
    } catch(e) { console.log('usageHistory fetch failed', e.message); }

    // Sort by timestamp desc
    all.sort((a,b)=> (b.timestamp||0)-(a.timestamp||0));

    // Summary
    const totalPurchased = userData?.totalPurchased || 0;
    const totalUsed = userData?.totalUsed || userData?.tokens_used || 0;
    const balance = userData ? (userData.balance ?? ((userData.tokens_limit||0)-(userData.tokens_used||0))) : 0;

    res.json({
      balance,
      totalPurchased,
      totalUsed,
      freeCreditsGiven: userData?.freeCreditsGiven || 10000,
      plan: userData?.plan || 'free',
      history: all.slice(0, 50),
      summary: {
        total: totalPurchased + (userData?.freeCreditsGiven||0),
        used: totalUsed,
        remaining: balance
      }
    });
  } catch (err) {
    console.error('credit-history error', err.message);
    res.status(500).json({ error: err.message });
  }
};

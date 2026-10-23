const { getDb, getAuth } = require('./_firebase');
const crypto = require('crypto');
const Razorpay = require('razorpay');

// Prices/credits are defined server-side only. Never trust the plan sent by the browser.
const PLANS = {
  starter: { credits: 100000,  amount: 19 },
  pro:     { credits: 500000,  amount: 49 },
  popular: { credits: 1000000, amount: 99 },
  ultra:   { credits: 2000000, amount: 199 }
};

module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Use POST' });
  try {
    // 1) who is paying: from the verified login token, not from the request body
    const authHeader = req.headers.authorization || req.headers.Authorization;
    if (!authHeader?.startsWith('Bearer ')) return res.status(401).json({ error: 'Login required' });
    const decoded = await getAuth().verifyIdToken(authHeader.split('Bearer ')[1]);
    const uid = decoded.uid;

    const { orderId, paymentId, signature } = req.body || {};
    if (!orderId || !paymentId || !signature) return res.status(400).json({ error: 'Missing fields' });

    // 2) signature check (constant-time)
    const expected = crypto.createHmac('sha256', process.env.RAZORPAY_KEY_SECRET).update(orderId + '|' + paymentId).digest('hex');
    const a = Buffer.from(expected), b = Buffer.from(String(signature));
    if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) return res.status(400).json({ error: 'Invalid signature' });

    // 3) the plan and owner come from the order we created in create-order.js
    const rzp = new Razorpay({ key_id: process.env.RAZORPAY_KEY_ID, key_secret: process.env.RAZORPAY_KEY_SECRET });
    const order = await rzp.orders.fetch(orderId);
    const plan = order.notes && order.notes.plan;
    if (!PLANS[plan]) return res.status(400).json({ error: 'Invalid plan' });
    if (order.notes.uid !== uid) return res.status(403).json({ error: 'Order belongs to another account' });
    if (Number(order.amount) !== PLANS[plan].amount * 100) return res.status(400).json({ error: 'Amount mismatch' });

    const creditsToAdd = PLANS[plan].credits;
    const { FieldValue } = require('firebase-admin/firestore');
    const db = getDb();
    const userRef = db.collection('users').doc(uid);
    const histRef = userRef.collection('purchaseHistory').doc(paymentId); // doc id = paymentId, so a payment can only credit once
    const validTill = new Date(); validTill.setDate(validTill.getDate() + 30);

    const result = await db.runTransaction(async (t) => {
      const [userSnap, histSnap] = await Promise.all([t.get(userRef), t.get(histRef)]);
      if (!userSnap.exists) throw Object.assign(new Error('User not found'), { status: 404 });
      const prev = userSnap.data().balance || 0;
      if (histSnap.exists) return { already: true, prev };
      t.update(userRef, {
        balance: FieldValue.increment(creditsToAdd),
        totalPurchased: FieldValue.increment(creditsToAdd),
        plan, isPremium: true,
        lastPurchaseAt: FieldValue.serverTimestamp(),
        validity_till: validTill.toISOString(),
        totalPaid: FieldValue.increment(PLANS[plan].amount),
        tokens_limit: FieldValue.increment(creditsToAdd)
      });
      t.set(histRef, {
        timestamp: FieldValue.serverTimestamp(), type: 'purchase', plan,
        credits: creditsToAdd, amount: PLANS[plan].amount, paymentId, orderId, status: 'success',
        creditsRemaining: prev + creditsToAdd,
        description: 'Purchased ' + plan + ' · 30 days', validity: '30 Days', validTill: validTill.toISOString()
      });
      return { already: false, prev };
    });

    res.json({ success: true, message: result.already ? 'Already credited' : undefined, credits_added: creditsToAdd, plan, new_balance: result.prev + (result.already ? 0 : creditsToAdd) });
  } catch (err) {
    console.error('Verify error', err);
    res.status(err.status || 500).json({ error: err.message });
  }
};

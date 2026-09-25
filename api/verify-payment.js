const { getAdmin, getDb, getAuth } = require('./_firebase');
const crypto = require('crypto');

module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  try {
    const { orderId, paymentId, signature, plan, uid } = req.body;
    if (!orderId || !paymentId || !signature || !plan || !uid) return res.status(400).json({ error: 'Missing fields' });
    const expectedSignature = crypto.createHmac('sha256', process.env.RAZORPAY_KEY_SECRET).update(orderId + '|' + paymentId).digest('hex');
    if (expectedSignature !== signature) return res.status(400).json({ error: 'Invalid signature' });
    const creditsMap = { starter: 100000, pro: 500000, popular: 1000000, ultra: 2000000 };
    const amountMap = { starter: 19, pro: 49, popular: 99, ultra: 199 };
    const creditsToAdd = creditsMap[plan];
    if (!creditsToAdd) return res.status(400).json({ error: 'Invalid plan' });
    const db = getDb();
    const userRef = db.collection('users').doc(uid);
    const existingTx = await userRef.collection('purchaseHistory').where('paymentId', '==', paymentId).limit(1).get();
    if (!existingTx.empty) return res.json({ success: true, message: 'Already credited', credits_added: creditsToAdd });
    const userSnap = await userRef.get();
    if (!userSnap.exists) return res.status(404).json({ error: 'User not found' });
    const prevBalance = userSnap.data().balance || 0;
    const { FieldValue } = require('firebase-admin/firestore');
    const validTill = new Date(); validTill.setDate(validTill.getDate() + 30);
    await db.runTransaction(async (t) => {
      const docSnap = await t.get(userRef);
      if (!docSnap.exists) throw new Error('User not found');
      t.update(userRef, {
        balance: FieldValue.increment(creditsToAdd),
        totalPurchased: FieldValue.increment(creditsToAdd),
        plan,
        isPremium: true,
        lastPurchaseAt: FieldValue.serverTimestamp(),
        validity_till: validTill.toISOString(),
        totalPaid: FieldValue.increment(amountMap[plan] || 0),
        tokens_limit: FieldValue.increment(creditsToAdd)
      });
    });
    await userRef.collection('purchaseHistory').add({
      timestamp: FieldValue.serverTimestamp(),
      type: 'purchase',
      plan,
      credits: creditsToAdd,
      amount: amountMap[plan],
      paymentId,
      orderId,
      status: 'success',
      creditsRemaining: prevBalance + creditsToAdd,
      description: 'Purchased ' + plan + ' · 30 days',
      validity: '30 Days',
      validTill: validTill.toISOString()
    });
    res.json({ success: true, credits_added: creditsToAdd, plan, new_balance: prevBalance + creditsToAdd });
  } catch (err) { console.error('Verify error', err); res.status(500).json({ error: err.message }); }
};

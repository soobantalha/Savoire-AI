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
    // NEW MONTHLY PRICING
    const creditsMap = { starter: 200000, pro: 500000, popular: 1000000, ultra: 2000000, mega: 3000000 };
    const amountMap = { starter: 29, pro: 69, popular: 129, ultra: 249, mega: 349 };
    const creditsToAdd = creditsMap[plan];
    if (!creditsToAdd) return res.status(400).json({ error: 'Invalid plan' });
    const adminApp = getAdmin();
    const db = getDb();
    const existingTx = await db.collection('transactions').where('paymentId', '==', paymentId).get();
    if (!existingTx.empty) return res.json({ success: true, message: 'Already credited', credits_added: creditsToAdd });
    const userRef = db.collection('users').doc(uid);
    const userSnap = await userRef.get();
    const prevBalance = userSnap.exists ? (userSnap.data().balance || 0) : 0;
    const { FieldValue } = require('firebase-admin/firestore');
    await db.runTransaction(async (t) => {
      const docSnap = await t.get(userRef);
      if (!docSnap.exists) throw new Error('User not found');
      const validTill = new Date(); validTill.setDate(validTill.getDate()+30);
      t.update(userRef, {
        balance: FieldValue.increment(creditsToAdd),
        totalPurchased: FieldValue.increment(creditsToAdd),
        plan, isPremium: true,
        lastPurchaseAt: FieldValue.serverTimestamp(),
        validity_till: validTill.toISOString(),
        totalPaid: FieldValue.increment(amountMap[plan]||0),
        tokens_limit: FieldValue.increment(creditsToAdd)
      });
    });
    await userRef.collection('purchaseHistory').add({
      timestamp: FieldValue.serverTimestamp(), type: 'purchase', plan, credits: creditsToAdd,
      amount: amountMap[plan], paymentId, orderId, status: 'success',
      creditsRemaining: prevBalance + creditsToAdd, description: `Purchased ${plan} - Monthly 30 Days`,
      validity: '30 Days', validTill: new Date(Date.now()+30*24*60*60*1000).toISOString()
    });
    await db.collection('transactions').add({ uid, orderId, paymentId, signature, plan, amount: amountMap[plan], credits_credited: creditsToAdd, status: 'success', createdAt: FieldValue.serverTimestamp() });
    if (process.env.PAYMENT_SHEET_WEBHOOK_URL) {
      try {
        const userData = (await userRef.get()).data();
        await fetch(process.env.PAYMENT_SHEET_WEBHOOK_URL, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ uid, email: userData.email||'', name: userData.displayName||'', plan, amount: amountMap[plan], paymentId, orderId, tokens: creditsToAdd, newLimit: prevBalance + creditsToAdd }) });
      } catch(e) {}
    }
    res.json({ success: true, credits_added: creditsToAdd, plan, new_balance: prevBalance + creditsToAdd });
  } catch (err) { console.error('Verify error', err); res.status(500).json({ error: err.message }); }
};

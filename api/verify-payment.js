const crypto = require('crypto');
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
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();

  try {
    const { orderId, paymentId, signature, plan, uid } = req.body;
    if (!orderId || !paymentId || !signature || !plan || !uid) {
      return res.status(400).json({ error: 'Missing fields' });
    }
    const expectedSignature = crypto.createHmac('sha256', process.env.RAZORPAY_KEY_SECRET).update(orderId + '|' + paymentId).digest('hex');
    if (expectedSignature !== signature) {
      return res.status(400).json({ error: 'Invalid payment signature' });
    }
    const creditsMap = { micro: 1000000, starter: 3000000, popular: 6000000, pro: 12000000, ultra: 25000000 };
    const amountMap = { micro: 49, starter: 99, popular: 179, pro: 329, ultra: 599 };
    const creditsToAdd = creditsMap[plan];
    if (!creditsToAdd) return res.status(400).json({ error: 'Invalid plan' });

    const existingTx = await db.collection('transactions').where('paymentId', '==', paymentId).get();
    if (!existingTx.empty) {
      return res.json({ success: true, message: 'Already credited', credits_added: creditsToAdd });
    }

    const userRef = db.collection('users').doc(uid);
    const userSnap = await userRef.get();
    const prevBalance = userSnap.exists ? (userSnap.data().balance || (userSnap.data().tokens_limit - userSnap.data().tokens_used) || 0) : 0;
    
    await db.runTransaction(async (t) => {
      const docSnap = await t.get(userRef);
      if (!docSnap.exists) throw new Error('User not found');
      const data = docSnap.data();
      const validityDays = 36500; // Lifetime approx
      const validTill = new Date();
      validTill.setDate(validTill.getDate() + validityDays);
      t.update(userRef, {
        balance: admin.firestore.FieldValue.increment(creditsToAdd),
        totalPurchased: admin.firestore.FieldValue.increment(creditsToAdd),
        plan: plan,
        isPremium: true,
        lastPurchaseAt: admin.firestore.FieldValue.serverTimestamp(),
        validity_till: validTill.toISOString(),
        totalPaid: admin.firestore.FieldValue.increment(amountMap[plan] || 0),
        // Keep old fields for backward compat
        tokens_limit: admin.firestore.FieldValue.increment(creditsToAdd)
      });
    });

    // Purchase history sub-collection
    await userRef.collection('purchaseHistory').add({
      timestamp: admin.firestore.FieldValue.serverTimestamp(),
      type: 'purchase',
      plan,
      credits: creditsToAdd,
      amount: amountMap[plan],
      paymentId,
      orderId,
      status: 'success',
      creditsRemaining: prevBalance + creditsToAdd,
      description: `Purchased ${plan} pack`
    });

    await db.collection('transactions').add({
      uid, orderId, paymentId, signature, plan,
      amount: amountMap[plan],
      credits_credited: creditsToAdd,
      status: 'success',
      createdAt: admin.firestore.FieldValue.serverTimestamp()
    });

    // Optional Google Sheet webhook
    if (process.env.PAYMENT_SHEET_WEBHOOK_URL) {
      try {
        const userData = (await userRef.get()).data();
        await fetch(process.env.PAYMENT_SHEET_WEBHOOK_URL, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            uid,
            email: userData.email || '',
            name: userData.displayName || '',
            plan,
            amount: amountMap[plan],
            paymentId,
            orderId,
            tokens: creditsToAdd,
            newLimit: prevBalance + creditsToAdd
          })
        });
      } catch(e) { console.log('Sheet webhook failed', e.message); }
    }

    console.log(`✅ Payment success: ${uid} bought ${plan} - ${creditsToAdd} credits`);
    res.json({ success: true, credits_added: creditsToAdd, plan, new_balance: prevBalance + creditsToAdd });
  } catch (err) {
    console.error('Verify payment error:', err);
    res.status(500).json({ error: err.message });
  }
};

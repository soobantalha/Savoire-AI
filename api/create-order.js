const Razorpay = require('razorpay');
const admin = require('firebase-admin');
if (!admin.apps.length) {
  try {
    const sa = JSON.parse(process.env.FIREBASE_ADMIN_KEY);
    admin.initializeApp({ credential: admin.credential.cert(sa) });
  } catch(e) { console.error('Firebase admin init failed', e.message); }
}
const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET
});

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

    const { plan } = req.body;
    // NEW PLANS - Lifetime validity
    const pricing = {
      micro:   { amount: 4900,  credits: 1000000,  name: 'Micro - 1M Credits' },
      starter: { amount: 9900,  credits: 3000000,  name: 'Starter - 3M Credits - Most Popular' },
      popular: { amount: 17900, credits: 6000000,  name: 'Popular - 6M Credits' },
      pro:     { amount: 32900, credits: 12000000, name: 'Pro - 12M Credits' },
      ultra:   { amount: 59900, credits: 25000000, name: 'Ultra - 25M Credits' }
    };
    if (!pricing[plan]) return res.status(400).json({ error: 'Invalid plan. Use micro, starter, popular, pro, ultra' });

    const order = await razorpay.orders.create({
      amount: pricing[plan].amount,
      currency: 'INR',
      receipt: `savoire_${decoded.uid}_${Date.now()}`,
      notes: { uid: decoded.uid, plan, credits: pricing[plan].credits, email: decoded.email || '' }
    });

    res.json({
      orderId: order.id,
      amount: order.amount,
      currency: order.currency,
      key: process.env.RAZORPAY_KEY_ID,
      plan,
      credits: pricing[plan].credits
    });
  } catch (err) {
    console.error('Create order error:', err);
    res.status(500).json({ error: 'Could not create order: ' + err.message });
  }
};

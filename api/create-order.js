const { getAdmin, getDb, getAuth } = require('./_firebase');
const Razorpay = require('razorpay');

module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Use POST' });

  try {
    if (!process.env.RAZORPAY_KEY_ID || !process.env.RAZORPAY_KEY_SECRET) {
      return res.status(500).json({ error: 'RAZORPAY_KEY_ID or RAZORPAY_KEY_SECRET env missing in Vercel. Add them in Settings -> Environment Variables' });
    }
    const adminApp = getAdmin();
    const auth = getAuth();
    const authHeader = req.headers.authorization || req.headers.Authorization;
    if (!authHeader?.startsWith('Bearer ')) return res.status(401).json({ error: 'Login required - no token' });
    const idToken = authHeader.split('Bearer ')[1];
    let decoded;
    try { decoded = await auth.verifyIdToken(idToken); }
    catch(authErr) { return res.status(401).json({ error: 'Invalid login token: ' + authErr.message }); }
    const uid = decoded.uid;
    const razorpay = new Razorpay({ key_id: process.env.RAZORPAY_KEY_ID, key_secret: process.env.RAZORPAY_KEY_SECRET });
    const { plan } = req.body;
    // NEW PRICING - 4 Plans - Lifetime - As per user latest spec
    const pricing = {
      starter: { amount: 2900,  credits: 100000,   name: 'Starter 🪙 - 100k Credits' },
      pro:     { amount: 6900,  credits: 300000,   name: 'Pro 🚀 - 300k Credits - Popular' },
      popular: { amount: 12900, credits: 600000,   name: 'Popular ⭐ - 600k Credits - Best Value' },
      ultra:   { amount: 24900, credits: 1200000,  name: 'Ultra 💎 - 1.2M Credits' }
    };
    if (!pricing[plan]) return res.status(400).json({ error: `Invalid plan ${plan}. Use starter, pro, popular, ultra` });
    let order;
    try {
      order = await razorpay.orders.create({
        amount: pricing[plan].amount,
        currency: 'INR',
        receipt: `savoire_${uid}_${Date.now()}`.slice(0,40),
        notes: { uid, plan, credits: String(pricing[plan].credits), email: decoded.email||'' }
      });
    } catch(rzpErr) {
      return res.status(500).json({ error: `Razorpay order failed: ${rzpErr.message||rzpErr.error?.description}` });
    }
    res.json({ orderId: order.id, amount: order.amount, currency: order.currency, key: process.env.RAZORPAY_KEY_ID, plan, credits: pricing[plan].credits });
  } catch (err) {
    console.error('Create order error:', err);
    res.status(500).json({ error: 'Server error in create-order: ' + err.message });
  }
};

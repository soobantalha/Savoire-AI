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
      return res.status(500).json({ error: 'RAZORPAY_KEY_ID or SECRET missing in Vercel ENV' });
    }
    const adminApp = getAdmin();
    const auth = getAuth();
    const authHeader = req.headers.authorization || req.headers.Authorization;
    if (!authHeader?.startsWith('Bearer ')) return res.status(401).json({ error: 'Login required' });
    const idToken = authHeader.split('Bearer ')[1];
    const decoded = await auth.verifyIdToken(idToken);
    const uid = decoded.uid;
    const razorpay = new Razorpay({ key_id: process.env.RAZORPAY_KEY_ID, key_secret: process.env.RAZORPAY_KEY_SECRET });
    const { plan } = req.body;
    // NEW 4-TIER PLANS - 30 Days validity, 10k welcome credits on signup
    const pricing = {
      starter: { amount: 1900,   credits: 100000,  name: 'Starter 🪙 - 100k Credits - 30 Days' },
      pro:     { amount: 4900,   credits: 500000,  name: 'Pro 🚀 - 500k Credits - 30 Days' },
      popular: { amount: 9900,   credits: 1000000, name: 'Popular ⭐ - 1M Credits - 30 Days (Best Seller)' },
      ultra:   { amount: 19900,  credits: 2000000, name: 'Ultra 💎 - 2M Credits - 30 Days' }
    };
    if (!pricing[plan]) return res.status(400).json({ error: `Invalid plan ${plan}. Use starter, pro, popular, ultra` });
    const order = await razorpay.orders.create({
      amount: pricing[plan].amount,
      currency: 'INR',
      receipt: `savoire_${uid}_${Date.now()}`.slice(0,40),
      notes: { uid, plan, credits: String(pricing[plan].credits), email: decoded.email||'', validity: '30 Days' }
    });
    res.json({ orderId: order.id, amount: order.amount, currency: order.currency, key: process.env.RAZORPAY_KEY_ID, plan, credits: pricing[plan].credits });
  } catch (err) {
    console.error('Create order error:', err);
    res.status(500).json({ error: 'Server error: ' + err.message });
  }
};

const Razorpay = require('razorpay');

let admin = null;
let db = null;
function getAdmin() {
  if (admin) return admin;
  try {
    const { initializeApp, cert, getApps } = require('firebase-admin/app');
    const { getFirestore } = require('firebase-admin/firestore');
    const { getAuth } = require('firebase-admin/auth');
    if (getApps().length === 0) {
      let sa;
      const raw = process.env.FIREBASE_ADMIN_KEY;
      if (!raw) throw new Error('FIREBASE_ADMIN_KEY env missing');
      try {
        sa = JSON.parse(raw);
      } catch {
        // Try unescaping if double escaped
        sa = JSON.parse(raw.replace(/\\n/g, '\n').replace(/\\\\/g, '\\'));
      }
      // Fix private_key newlines
      if (sa.private_key) {
        sa.private_key = sa.private_key.replace(/\\n/g, '\n');
      }
      initializeApp({ credential: cert(sa) });
    }
    const { getApp } = require('firebase-admin/app');
    admin = getApp();
    return admin;
  } catch(e) {
    console.error('Firebase admin init failed in create-order', e.message);
    throw new Error('Firebase admin init failed: ' + e.message + ' - Check FIREBASE_ADMIN_KEY env is one-line escaped JSON');
  }
}

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
    if (!process.env.FIREBASE_ADMIN_KEY) {
      return res.status(500).json({ error: 'FIREBASE_ADMIN_KEY env missing. Add your service account JSON (one-line) in Vercel env' });
    }

    const fbAdmin = getAdmin();
    const { getAuth } = require('firebase-admin/auth');
    const auth = getAuth(fbAdmin);

    const authHeader = req.headers.authorization || req.headers.Authorization;
    if (!authHeader?.startsWith('Bearer ')) return res.status(401).json({ error: 'Login required - no token' });
    const idToken = authHeader.split('Bearer ')[1];
    let decoded;
    try {
      decoded = await auth.verifyIdToken(idToken);
    } catch(authErr) {
      console.error('Token verify failed', authErr.message);
      return res.status(401).json({ error: 'Invalid login token: ' + authErr.message });
    }
    const uid = decoded.uid;

    const razorpay = new Razorpay({
      key_id: process.env.RAZORPAY_KEY_ID,
      key_secret: process.env.RAZORPAY_KEY_SECRET
    });

    const { plan } = req.body;
    const pricing = {
      micro:   { amount: 4900,  credits: 1000000,  name: 'Micro - 1M Credits' },
      starter: { amount: 9900,  credits: 3000000,  name: 'Starter - 3M Credits - Most Popular' },
      popular: { amount: 17900, credits: 6000000,  name: 'Popular - 6M Credits' },
      pro:     { amount: 32900, credits: 12000000, name: 'Pro - 12M Credits' },
      ultra:   { amount: 59900, credits: 25000000, name: 'Ultra - 25M Credits' }
    };
    if (!pricing[plan]) return res.status(400).json({ error: `Invalid plan ${plan}. Use micro, starter, popular, pro, ultra` });

    let order;
    try {
      order = await razorpay.orders.create({
        amount: pricing[plan].amount,
        currency: 'INR',
        receipt: `savoire_${uid}_${Date.now()}`.slice(0,40),
        notes: { uid, plan, credits: String(pricing[plan].credits), email: decoded.email || '' }
      });
    } catch(rzpErr) {
      console.error('Razorpay order create failed', rzpErr.message, rzpErr.error);
      return res.status(500).json({ error: `Razorpay order failed: ${rzpErr.message || rzpErr.error?.description || 'Check Razorpay keys'}` });
    }

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
    // Always return JSON, never HTML
    res.status(500).json({ error: 'Server error in create-order: ' + err.message });
  }
};

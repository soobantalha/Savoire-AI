const { getAdmin, getDb, getAuth } = require('./_firebase');

module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  if (req.method === 'OPTIONS') return res.status(200).end();

  const checks = {};

  // Check Firebase Admin
  try {
    const adminApp = getAdmin();
    const db = getDb();
    checks.FIREBASE_ADMIN_KEY = '✅ Present and parsed OK - project: ' + (adminApp.options.credential ? 'OK' : 'OK');
    checks.FIREBASE_ADMIN_INIT = '✅ Init OK';
    // Try a simple Firestore read to test permissions
    try {
      await db.collection('users').limit(1).get();
      checks.FIRESTORE_READ = '✅ Read OK';
    } catch(e) {
      checks.FIRESTORE_READ = '⚠️ Read failed (may be permissions): ' + e.message;
    }
  } catch(e) {
    checks.FIREBASE_ADMIN_KEY = '❌ FAILED: ' + e.message;
    checks.FIREBASE_ADMIN_INIT = '❌ Failed - ' + e.message + ' | Try base64 method: cat file.json | base64 -w0 and paste into FIREBASE_ADMIN_KEY_BASE64 env';
  }

  const fbKeys = ['FIREBASE_API_KEY', 'FIREBASE_AUTH_DOMAIN', 'FIREBASE_PROJECT_ID', 'FIREBASE_APP_ID'];
  fbKeys.forEach(k => {
    checks[k] = process.env[k] ? '✅ Present' : '⚠️ Missing (will use fallback, ok for now)';
  });

  checks.RAZORPAY_KEY_ID = process.env.RAZORPAY_KEY_ID ? (process.env.RAZORPAY_KEY_ID.startsWith('rzp_') ? '✅ Present - ' + process.env.RAZORPAY_KEY_ID.slice(0,12)+'...' : '❌ Invalid') : '❌ MISSING';
  checks.RAZORPAY_KEY_SECRET = process.env.RAZORPAY_KEY_SECRET ? '✅ Present' : '❌ MISSING';
  checks.MESH_API_KEY = process.env.MESH_API_KEY ? '✅ Present' : '❌ MISSING';
  checks.GOOGLE_WEBHOOK_URL = process.env.GOOGLE_WEBHOOK_URL ? '✅ Present' : '⚠️ Missing';
  checks.PAYMENT_SHEET_WEBHOOK_URL = process.env.PAYMENT_SHEET_WEBHOOK_URL ? '✅ Present' : '⚠️ Missing (optional)';

  try { require('razorpay'); checks.RAZORPAY_MODULE = '✅ Module installed'; } catch(e) { checks.RAZORPAY_MODULE = '❌ NOT installed: ' + e.message; }
  try { require('firebase-admin'); checks.FIREBASE_ADMIN_MODULE = '✅ Module installed'; } catch(e) { checks.FIREBASE_ADMIN_MODULE = '❌ NOT installed: ' + e.message; }

  const allOk = checks.FIREBASE_ADMIN_KEY?.startsWith('✅') && checks.RAZORPAY_KEY_ID?.startsWith('✅');

  res.json({
    status: allOk ? '✅ All critical keys present - Should work after redeploy' : '❌ Some keys missing - See checks',
    timestamp: new Date().toISOString(),
    project: 'savoire-ai',
    checks,
    fix: {
      firebase_admin_key: 'If ❌ FAILED, do: 1) Download JSON, 2) Run: base64 -w0 service-account.json (Linux/Mac) or certutil -encode file.json tmp.b64 (Windows), 3) Copy base64 string, 4) In Vercel, create NEW env FIREBASE_ADMIN_KEY_BASE64 with that base64 string, 5) Keep old FIREBASE_ADMIN_KEY also, 6) Redeploy',
      razorpay: 'If missing, get from dashboard.razorpay.com -> Settings -> API Keys -> Test Mode -> Generate'
    }
  });
};

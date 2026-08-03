module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  if (req.method === 'OPTIONS') return res.status(200).end();

  const checks = {};

  // Check Firebase Admin
  try {
    if (!process.env.FIREBASE_ADMIN_KEY) {
      checks.FIREBASE_ADMIN_KEY = '❌ MISSING - Add service account JSON in Vercel ENV';
    } else {
      try {
        const raw = process.env.FIREBASE_ADMIN_KEY;
        let sa;
        try { sa = JSON.parse(raw); } catch { sa = JSON.parse(raw.replace(/\\n/g, '\n')); }
        if (sa.private_key) sa.private_key = sa.private_key.replace(/\\n/g, '\n');
        if (!sa.project_id || !sa.private_key) throw new Error('Invalid JSON structure');
        checks.FIREBASE_ADMIN_KEY = '✅ Present - project: ' + sa.project_id;
        // Try init
        const { initializeApp, cert, getApps } = require('firebase-admin/app');
        if (getApps().length === 0) {
          initializeApp({ credential: cert(sa) });
        }
        checks.FIREBASE_ADMIN_INIT = '✅ Init OK';
      } catch(e) {
        checks.FIREBASE_ADMIN_KEY = '❌ PARSE FAILED: ' + e.message + ' - Use freeformatter.com/json-escape.html';
        checks.FIREBASE_ADMIN_INIT = '❌ Failed';
      }
    }
  } catch(e) { checks.FIREBASE_ADMIN_KEY = '❌ Error: ' + e.message; }

  // Check Frontend Firebase Config
  const fbKeys = ['FIREBASE_API_KEY', 'FIREBASE_AUTH_DOMAIN', 'FIREBASE_PROJECT_ID', 'FIREBASE_APP_ID'];
  fbKeys.forEach(k => {
    checks[k] = process.env[k] ? '✅ Present' : '⚠️ Missing (will use fallback hardcoded, ok for now)';
  });

  // Check Razorpay
  checks.RAZORPAY_KEY_ID = process.env.RAZORPAY_KEY_ID ? (process.env.RAZORPAY_KEY_ID.startsWith('rzp_') ? '✅ Present - ' + process.env.RAZORPAY_KEY_ID.slice(0,12)+'...' : '❌ Invalid format, should start with rzp_test_ or rzp_live_') : '❌ MISSING - Add from Razorpay Dashboard -> Settings -> API Keys';
  checks.RAZORPAY_KEY_SECRET = process.env.RAZORPAY_KEY_SECRET ? '✅ Present' : '❌ MISSING';

  // Check Mesh
  checks.MESH_API_KEY = process.env.MESH_API_KEY ? '✅ Present' : '❌ MISSING - Get from app.meshapi.ai';

  // Check Google Sheet
  checks.GOOGLE_WEBHOOK_URL = process.env.GOOGLE_WEBHOOK_URL ? '✅ Present' : '⚠️ Missing (old tracking sheet will not work, but AI will still work)';
  checks.PAYMENT_SHEET_WEBHOOK_URL = process.env.PAYMENT_SHEET_WEBHOOK_URL ? '✅ Present' : '⚠️ Missing (optional, payment sheet sync will skip)';

  // Check Resend for welcome email
  checks.RESEND_API_KEY = process.env.RESEND_API_KEY ? '✅ Present' : '⚠️ Missing (welcome email will not be sent, but login will work)';

  // Test study ping
  try {
    // Quick import check for razorpay and firebase-admin
    require('razorpay');
    checks.RAZORPAY_MODULE = '✅ Module installed (package.json OK)';
  } catch(e) {
    checks.RAZORPAY_MODULE = '❌ Module NOT installed - Did you add package.json? Error: ' + e.message;
  }
  try {
    require('firebase-admin');
    checks.FIREBASE_ADMIN_MODULE = '✅ Module installed';
  } catch(e) {
    checks.FIREBASE_ADMIN_MODULE = '❌ Module NOT installed - ' + e.message;
  }

  const allOk = checks.FIREBASE_ADMIN_KEY?.startsWith('✅') && checks.RAZORPAY_KEY_ID?.startsWith('✅') && checks.RAZORPAY_KEY_SECRET?.startsWith('✅') && checks.MESH_API_KEY?.startsWith('✅');

  res.json({
    status: allOk ? '✅ All critical keys present - Should work after redeploy' : '❌ Some keys missing - Fix below',
    timestamp: new Date().toISOString(),
    project: 'savoire-ai',
    checks,
    nextSteps: [
      '1. Go to Vercel -> Settings -> Environment Variables',
      '2. Make sure you added keys to Production, Preview, Development (tick all 3)',
      '3. For FIREBASE_ADMIN_KEY: Open JSON file -> Ctrl+A -> Ctrl+C -> Paste directly into Vercel value field (no need to escape, Vercel supports multiline)',
      '4. After adding, go to Deployments -> ... -> Redeploy',
      '5. Then test /api/health again',
      '6. Test /api/study with POST {"message":"ping"} - should return status ok even without login'
    ]
  });
};

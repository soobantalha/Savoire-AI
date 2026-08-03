// Shared Firebase Admin Helper - FINAL ROBUST VERSION - Supports JSON and BASE64 in any ENV
let adminApp = null;
let dbInstance = null;

function tryParseJson(str) {
  if (!str || typeof str !== 'string') return null;
  try {
    const trimmed = str.trim();
    if (!trimmed) return null;
    const parsed = JSON.parse(trimmed);
    if (parsed.private_key) parsed.private_key = parsed.private_key.replace(/\\n/g, '\n');
    return parsed;
  } catch (e) {
    return null;
  }
}

function tryBase64Json(b64Str) {
  if (!b64Str || typeof b64Str !== 'string') return null;
  try {
    let clean = b64Str.trim().replace(/^["']|["']$/g, '').replace(/\s+/g, '');
    // Handle URL-safe base64: - -> +, _ -> /
    clean = clean.replace(/-/g, '+').replace(/_/g, '/');
    // Add padding if needed
    while (clean.length % 4) clean += '=';
    const decoded = Buffer.from(clean, 'base64').toString('utf-8');
    // Decoded should be JSON
    const parsed = tryParseJson(decoded);
    if (parsed) return parsed;
    // If decoded still looks like base64 (double encoded), try again
    if (decoded.length > 100 && !decoded.trim().startsWith('{')) {
      const decoded2 = Buffer.from(decoded.replace(/\s/g, ''), 'base64').toString('utf-8');
      return tryParseJson(decoded2);
    }
    return null;
  } catch (e) {
    return null;
  }
}

function parseServiceAccount() {
  const candidates = [];

  // Collect all possible env vars that might contain the key
  const envsToTry = [
    { name: 'FIREBASE_ADMIN_KEY_BASE64', value: process.env.FIREBASE_ADMIN_KEY_BASE64, isBase64: true },
    { name: 'FIREBASE_ADMIN_BASE64', value: process.env.FIREBASE_ADMIN_BASE64, isBase64: true },
    { name: 'FIREBASE_ADMIN_KEY', value: process.env.FIREBASE_ADMIN_KEY, isBase64: false },
    { name: 'FIREBASE_SERVICE_ACCOUNT', value: process.env.FIREBASE_SERVICE_ACCOUNT, isBase64: false },
    { name: 'GOOGLE_APPLICATION_CREDENTIALS_JSON', value: process.env.GOOGLE_APPLICATION_CREDENTIALS_JSON, isBase64: false },
  ];

  for (const env of envsToTry) {
    if (!env.value) continue;
    const raw = env.value;
    
    // Try as JSON first if it looks like JSON
    if (!env.isBase64) {
      // If starts with { try direct parse
      if (raw.trim().startsWith('{')) {
        const parsed = tryParseJson(raw);
        if (parsed && parsed.private_key) {
          console.log(`Firebase: Parsed OK from ${env.name} as direct JSON - project: ${parsed.project_id}`);
          return parsed;
        }
        // Try fixing real newlines inside private_key
        try {
          let fixed = raw.replace(/"private_key"\s*:\s*"([\s\S]*?)"/, (m, p1) => {
            return `"private_key": "${p1.replace(/\r\n/g, '\\n').replace(/\n/g, '\\n').replace(/\r/g, '\\n').replace(/\\\\n/g, '\\n')}"`;
          });
          const parsed2 = tryParseJson(fixed);
          if (parsed2 && parsed2.private_key) {
            console.log(`Firebase: Fixed real newlines in ${env.name}`);
            return parsed2;
          }
        } catch(e) {}
      }
    }

    // Try as base64 (both for BASE64 env and for JSON env that might contain base64)
    const b64Parsed = tryBase64Json(raw);
    if (b64Parsed && b64Parsed.private_key) {
      console.log(`Firebase: Parsed OK from ${env.name} as BASE64 decoded JSON - project: ${b64Parsed.project_id}`);
      return b64Parsed;
    }

    candidates.push({ name: env.name, sample: raw.slice(0,100) });
  }

  // If we reach here, failed
  const samples = candidates.map(c => `${c.name}: ${c.sample}...`).join(' | ');
  throw new Error(`Failed to parse Firebase service account from any ENV. Tried: ${samples}. FIX: 1) Go to base64.guru, upload your service-account.json, copy base64, 2) In Vercel, create ENV named FIREBASE_ADMIN_KEY_BASE64 with that base64 value (no quotes, no spaces), 3) Save and Redeploy. OR paste raw one-line JSON (use jq -c . file.json) into FIREBASE_ADMIN_KEY.`);
}

function getAdmin() {
  if (adminApp) return adminApp;
  try {
    const { initializeApp, cert, getApps, getApp } = require('firebase-admin/app');
    if (getApps().length > 0) {
      adminApp = getApp();
      return adminApp;
    }
    const serviceAccount = parseServiceAccount();
    adminApp = initializeApp({ credential: cert(serviceAccount) });
    console.log('✅ Firebase Admin initialized for project:', serviceAccount.project_id);
    return adminApp;
  } catch (e) {
    console.error('❌ Firebase Admin init failed:', e.message);
    throw e;
  }
}

function getDb() {
  if (dbInstance) return dbInstance;
  const app = getAdmin();
  const { getFirestore } = require('firebase-admin/firestore');
  dbInstance = getFirestore(app);
  return dbInstance;
}

function getAuth() {
  const app = getAdmin();
  const { getAuth } = require('firebase-admin/auth');
  return getAuth(app);
}

module.exports = { getAdmin, getDb, getAuth, parseServiceAccount };

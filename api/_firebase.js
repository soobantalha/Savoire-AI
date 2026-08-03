// Shared Firebase Admin Helper - Robust parsing for Vercel ENV - Supports both JSON and BASE64
let adminApp = null;
let dbInstance = null;

function tryParseJson(str) {
  try {
    const parsed = JSON.parse(str);
    if (parsed.private_key) parsed.private_key = parsed.private_key.replace(/\\n/g, '\n');
    return parsed;
  } catch (e) {
    return null;
  }
}

function parseServiceAccount() {
  const rawBase64 = process.env.FIREBASE_ADMIN_KEY_BASE64 || process.env.FIREBASE_ADMIN_BASE64;
  const rawJson = process.env.FIREBASE_ADMIN_KEY;

  // 1. Try BASE64 env first (most reliable)
  if (rawBase64) {
    try {
      const trimmed = rawBase64.trim();
      // Handle if user pasted base64 with quotes or spaces
      const cleanB64 = trimmed.replace(/^["']|["']$/g, '').replace(/\s/g, '');
      const decoded = Buffer.from(cleanB64, 'base64').toString('utf-8');
      const parsed = tryParseJson(decoded);
      if (parsed) {
        console.log('Firebase: Using BASE64 env decoded OK - project:', parsed.project_id);
        return parsed;
      }
      // If decoded is not JSON, maybe it's already JSON string that was base64 encoded twice? Try again
      console.log('Firebase: BASE64 decoded but not valid JSON, trying raw JSON fallback');
    } catch (e) {
      console.log('Firebase: BASE64 env decode failed:', e.message);
    }
  }

  // 2. Try raw JSON env - it might actually be base64 string mistakenly put in JSON env
  if (rawJson) {
    const trimmed = rawJson.trim();
    
    // If it looks like base64 (starts with eyJ or ewog and no { ), try base64 decode
    const looksLikeBase64 = !trimmed.includes('{"type"') && !trimmed.startsWith('{') && trimmed.length > 200 && /^[A-Za-z0-9+/=_\-\s]+$/.test(trimmed.slice(0,100));
    if (looksLikeBase64 || trimmed.startsWith('ey') || trimmed.startsWith('ewog')) {
      try {
        const cleanB64 = trimmed.replace(/^["']|["']$/g, '').replace(/\s/g, '');
        const decoded = Buffer.from(cleanB64, 'base64').toString('utf-8');
        const parsed = tryParseJson(decoded);
        if (parsed) {
          console.log('Firebase: Raw env was actually BASE64, decoded OK - project:', parsed.project_id);
          return parsed;
        }
      } catch (e) {
        console.log('Firebase: Raw env as BASE64 decode failed:', e.message);
      }
    }

    // Try direct JSON parse
    let parsed = tryParseJson(trimmed);
    if (parsed) {
      console.log('Firebase: Raw JSON parsed OK - project:', parsed.project_id);
      return parsed;
    }

    // Try fixing real newlines inside private_key
    try {
      let fixed = trimmed;
      // Fix: If private_key contains real newlines (not \n), escape them
      fixed = fixed.replace(/"private_key"\s*:\s*"([\s\S]*?)"/, (match, p1) => {
        // p1 may contain real newlines, replace them with \n
        let escaped = p1.replace(/\r\n/g, '\\n').replace(/\n/g, '\\n').replace(/\r/g, '\\n');
        // Ensure we don't double-escape already escaped \n
        escaped = escaped.replace(/\\\\n/g, '\\n');
        return `"private_key": "${escaped}"`;
      });
      parsed = tryParseJson(fixed);
      if (parsed) {
        console.log('Firebase: Fixed real newlines in private_key');
        return parsed;
      }
    } catch (e) {
      console.log('Fix newlines failed', e.message);
    }

    // Try unescaping double escaped
    try {
      const unescaped = trimmed.replace(/\\n/g, '\n');
      // Now it has real newlines, need to re-escape for JSON
      const reEscaped = unescaped.replace(/\n/g, '\\n');
      // Actually need to parse original with real newlines? Let's try direct with real newlines replaced
      let fixed2 = trimmed.replace(/\\n/g, '\n').replace(/\r/g, '');
      // Now fix private_key again
      fixed2 = fixed2.replace(/"private_key"\s*:\s*"([\s\S]*?)"/, (m, p1) => {
        return `"private_key": "${p1.replace(/\n/g, '\\n')}"`;
      });
      parsed = tryParseJson(fixed2);
      if (parsed) return parsed;
    } catch (e) {}
  }

  // If we reach here, failed
  const sample = (rawBase64 || rawJson || '').slice(0,100);
  throw new Error(`Failed to parse FIREBASE_ADMIN_KEY. Sample start: ${sample}... Make sure you pasted entire JSON file or base64 string. Try: 1) Use base64 method - upload JSON to base64.guru, copy base64, paste into FIREBASE_ADMIN_KEY_BASE64 env. 2) Or paste raw JSON directly into FIREBASE_ADMIN_KEY with multiline support.`);
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
    console.log('Firebase Admin initialized for project:', serviceAccount.project_id);
    return adminApp;
  } catch (e) {
    console.error('Firebase Admin init failed:', e.message);
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

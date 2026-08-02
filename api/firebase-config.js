// /api/firebase-config.js - Returns Firebase config without exposing it in HTML source
// This keeps keys hidden from login.html source (still visible in network, but that's normal - apiKey is public by design)

module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  res.setHeader('Cache-Control', 'no-store'); // Don't cache
  if (req.method === 'OPTIONS') return res.status(200).end();

  // Try to get from ENV first, fallback to your project values
  const config = {
    apiKey: process.env.FIREBASE_API_KEY || "AIzaSyBDgKVvzsOAb0ZrsSooTEU0mgvLxadphoM",
    authDomain: process.env.FIREBASE_AUTH_DOMAIN || "savoire-ai.firebaseapp.com",
    projectId: process.env.FIREBASE_PROJECT_ID || "savoire-ai",
    storageBucket: process.env.FIREBASE_STORAGE_BUCKET || "savoire-ai.firebasestorage.app",
    messagingSenderId: process.env.FIREBASE_MESSAGING_SENDER_ID || "528576008706",
    appId: process.env.FIREBASE_APP_ID || "1:528576008706:web:4514bd93193df05ba7cd1b"
  };

  res.json(config);
};

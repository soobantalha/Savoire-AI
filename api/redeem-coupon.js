// File: api/redeem-coupon.js
const { getDb, getAuth } = require('./_firebase');
const { FieldValue } = require('firebase-admin/firestore');

module.exports = async function handler(req, res) {
    // CORS Headers (taaki browser block na kare)
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    if (req.method === 'OPTIONS') return res.status(200).end();

    if (req.method !== 'POST') return res.status(405).json({ error: 'Use POST' });

    try {
        const authHeader = req.headers.authorization;
        if (!authHeader?.startsWith('Bearer ')) return res.status(401).json({ error: 'Login required' });
        
        const decoded = await getAuth().verifyIdToken(authHeader.split('Bearer ')[1]);
        const uid = decoded.uid;

        const { code } = req.body;
        if (!code) return res.status(400).json({ error: 'Code required' });

        const db = getDb();
        const couponRef = db.collection('coupons').doc(code.trim().toUpperCase());
        const userRef = db.collection('users').doc(uid);

        const result = await db.runTransaction(async (t) => {
            const couponSnap = await t.get(couponRef);
            if (!couponSnap.exists) throw new Error('Invalid code.');
            
            const couponData = couponSnap.data();
            if (couponData.status === 'used') throw new Error('This code has already been used.');

            t.update(userRef, {
                balance: FieldValue.increment(couponData.credits),
                totalPurchased: FieldValue.increment(couponData.credits)
            });

            t.update(couponRef, {
                status: 'used',
                usedBy: uid,
                usedAt: new Date().toISOString()
            });

            return { credits: couponData.credits };
        });

        res.status(200).json({ success: true, message: `🎉 ${result.credits.toLocaleString()} Credits added!` });
    } catch (error) {
        console.error('Redeem error:', error.message);
        res.status(400).json({ error: error.message });
    }
};
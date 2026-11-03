// api/setup-coupons.js
const { getDb } = require('./_firebase');

module.exports = async function handler(req, res) {
    try {
        const db = getDb();
        const batch = db.batch();
        
        for (let i = 1; i <= 200; i++) {
            const code = `SV-19PACK-${String(i).padStart(3, '0')}`;
            const docRef = db.collection('coupons').doc(code);
            batch.set(docRef, {
                code: code,
                credits: 100000,
                status: 'unused',
                createdAt: new Date().toISOString(),
                usedBy: null
            });
        }
        
        await batch.commit();
        res.status(200).json({ success: true, message: "✅ 200 Codes successfully added to Firestore!" });
    } catch (e) {
        console.error(e);
        res.status(500).json({ error: e.message });
    }
};
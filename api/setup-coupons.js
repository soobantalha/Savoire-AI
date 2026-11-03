// File: api/setup-coupons.js
const { getDb } = require('./_firebase');

module.exports = async function handler(req, res) {
    // Sirf GET request allow karenge taaki browser se aasani se chala sako
    if (req.method !== 'GET') return res.status(405).json({ error: 'Use GET method' });

    try {
        const db = getDb();
        const batch = db.batch();
        const couponsRef = db.collection('coupons');

        // Tumhare saare 200 Random Codes
        const codes = [
            "SV-4EE6K8", "SV-KEZB8V", "SV-7TFG6A", "SV-STU5UZ", "SV-E23XLZ", "SV-Q8N8AH", "SV-5UAQZ7", "SV-JNP566", "SV-4WSBXX", "SV-69VA8B",
            "SV-UVY8GZ", "SV-PHDSVX", "SV-7293EL", "SV-8CDLGJ", "SV-KTFNFU", "SV-RV7HNA", "SV-734RP2", "SV-6Q75CA", "SV-B33DEA", "SV-X5YWLX",
            "SV-P3ED9W", "SV-K8RPEE", "SV-9JPNW2", "SV-4R2APA", "SV-RH3XHE", "SV-EY48F4", "SV-ZBNR77", "SV-BP6K98", "SV-EG8Q9F", "SV-S6TE8S",
            "SV-455VJT", "SV-JGLUM3", "SV-CYHM22", "SV-8GWXER", "SV-2X89KX", "SV-YPG4XH", "SV-58RRQD", "SV-5HQLLM", "SV-MVYA3P", "SV-NJL74L",
            "SV-FSJTVE", "SV-DA5GGE", "SV-B54GVU", "SV-74HSNJ", "SV-2CNVN6", "SV-3CVAD5", "SV-STKLCL", "SV-YDYETR", "SV-XDAVYU", "SV-GZAECM",
            "SV-BTTGLN", "SV-GY5RMN", "SV-J9HD2M", "SV-WE9YMM", "SV-S5MMJ9", "SV-EPGB5C", "SV-RGHYFQ", "SV-UKKQRZ", "SV-R6TBTG", "SV-2YDQLH",
            "SV-PW75RU", "SV-B2EXWT", "SV-4PJJHU", "SV-6E56EM", "SV-KYK4L2", "SV-PVTLER", "SV-RLG6HL", "SV-KSAWQR", "SV-67GU2K", "SV-2Y3GQG",
            "SV-53AAYU", "SV-Q8VAQU", "SV-6846CB", "SV-PAD3J4", "SV-U2LDLZ", "SV-8X5T7L", "SV-EBBUAX", "SV-DLUQHS", "SV-CPB5PS", "SV-APPUTY",
            "SV-DDB95K", "SV-RDQ222", "SV-43CFCB", "SV-3C8P4V", "SV-QBLYL5", "SV-DU6KNA", "SV-43MXNP", "SV-BXA2MH", "SV-QEZXEG", "SV-RLVJWA",
            "SV-DAWJRD", "SV-WTXZ5W", "SV-RFJUUC", "SV-MJYWBZ", "SV-9UK9R8", "SV-ZCVBGR", "SV-TYMBMN", "SV-HCL97H", "SV-Q7YCHS", "SV-VK4TPC",
            "SV-NA8AZG", "SV-BNKDQG", "SV-T67M94", "SV-FU9NHU", "SV-WUUN7A", "SV-VT59MC", "SV-TCA8LW", "SV-ZHRM9U", "SV-Y3ELBL", "SV-SD433P",
            "SV-EKK8AD", "SV-P4PHQC", "SV-YQSKH5", "SV-9RPJTA", "SV-TTD5CL", "SV-NZQL5P", "SV-AQWJLD", "SV-W92SU3", "SV-A4X42S", "SV-AQCMXB",
            "SV-8Y6WPF", "SV-GBQ9SJ", "SV-NZRKZJ", "SV-4WWNDW", "SV-J2PD9G", "SV-SR3WSA", "SV-ALUCYZ", "SV-U5UVRJ", "SV-NVPDPL", "SV-DYCRZB",
            "SV-24ZPH2", "SV-4HTZ5G", "SV-3P4CPX", "SV-EW7XQX", "SV-L74YHF", "SV-MAJ2PM", "SV-93ANHC", "SV-ANPBQU", "SV-PPFCTX", "SV-SR6RJJ",
            "SV-VQAHDK", "SV-6DUGHX", "SV-4HT8EH", "SV-4ZCY5K", "SV-STEYLL", "SV-9H793S", "SV-DGJREX", "SV-M8EZ5B", "SV-RXZZHY", "SV-523BK3",
            "SV-K8XVHW", "SV-E39ULM", "SV-2A5TSG", "SV-A8DJSF", "SV-CWZ57R", "SV-YSFG72", "SV-UU7684", "SV-VL7ZKN", "SV-CQR6DF", "SV-647R6C",
            "SV-YMZ7H8", "SV-N79WD4", "SV-V62C3F", "SV-LM5LF6", "SV-5MX6TA", "SV-VPAVM5", "SV-VWEFG4", "SV-3WUYDU", "SV-NAR4A2", "SV-S3HLMG",
            "SV-WUANUU", "SV-L388YS", "SV-5GZ43S", "SV-592WH9", "SV-N5PAYZ", "SV-B332RU", "SV-PUCYHY", "SV-EYNUSL", "SV-PVSSRH", "SV-CBRK3W",
            "SV-W5QKEV", "SV-9R9V8E", "SV-JUVPPX", "SV-GTT9LD", "SV-S4WWTX", "SV-44RWYU", "SV-LYPXKG", "SV-CLA4U3", "SV-AHFXQ6", "SV-B6VQ4C",
            "SV-VTLNHJ", "SV-NAM447", "SV-N52BRC", "SV-B632TV", "SV-TZZF2K", "SV-C4L9FK", "SV-QMEVS4", "SV-G7DUWH", "SV-USHQVN", "SV-QFAEWS"
        ];

        // Loop chala kar batch mein add karo
        codes.forEach(code => {
            const docRef = couponsRef.doc(code);
            batch.set(docRef, {
                code: code,
                credits: 100000, // 100k Credits (₹19 Pack)
                status: 'unused',
                createdAt: new Date().toISOString(),
                usedBy: null
            });
        });

        // Ek sath database mein commit karo
        await batch.commit();

        res.status(200).json({ 
            success: true, 
            message: `✅ ${codes.length} Codes successfully added to Firestore! You can now delete this file.` 
        });

    } catch (error) {
        console.error('Setup error:', error);
        res.status(500).json({ error: error.message });
    }
};
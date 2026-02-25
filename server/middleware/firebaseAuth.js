import admin from 'firebase-admin';

// Initialize Firebase Admin — uses env vars or falls back to projectId only
if (!admin.apps.length) {
    const projectId = process.env.FIREBASE_PROJECT_ID;
    const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
    const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n');

    if (projectId && clientEmail && privateKey) {
        admin.initializeApp({
            credential: admin.credential.cert({ projectId, clientEmail, privateKey }),
        });
    } else if (projectId) {
        admin.initializeApp({ projectId });
    } else {
        admin.initializeApp();
    }
}

export async function firebaseAuth(req, res, next) {
    const header = req.headers.authorization;
    if (!header?.startsWith('Bearer ')) {
        return res.status(401).json({ error: 'No auth token provided' });
    }

    try {
        const token = header.split('Bearer ')[1];
        const decoded = await admin.auth().verifyIdToken(token);
        req.firebaseUser = decoded;
        req.firebaseUid = decoded.uid;
        next();
    } catch (err) {
        console.error('Firebase auth error:', err.message);
        return res.status(401).json({ error: 'Invalid or expired token' });
    }
}

export async function optionalFirebaseAuth(req, _res, next) {
    const header = req.headers.authorization;
    if (header?.startsWith('Bearer ')) {
        try {
            const token = header.split('Bearer ')[1];
            req.firebaseUser = await admin.auth().verifyIdToken(token);
            req.firebaseUid = req.firebaseUser.uid;
        } catch { /* continue without auth */ }
    }
    next();
}

export default admin;

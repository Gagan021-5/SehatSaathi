import User from '../models/User.js';

/**
 * Resolves the authenticated Firebase user to a MongoDB User document.
 * Creates a lightweight profile if sync has not happened yet.
 */
export async function resolveAuthUser(req) {
    if (!req.firebaseUid) {
        throw new Error('Missing authenticated user context');
    }

    let user = await User.findOne({ firebaseUid: req.firebaseUid });
    if (user) return user;

    const fallbackEmail = req.firebaseUser?.email || `${req.firebaseUid}@sehat-saathi.local`;

    try {
        user = await User.create({
            firebaseUid: req.firebaseUid,
            email: fallbackEmail,
            name: req.firebaseUser?.name || fallbackEmail.split('@')[0] || 'User',
            photoURL: req.firebaseUser?.picture || '',
        });
        return user;
    } catch (error) {
        if (error?.code === 11000) {
            const existing = await User.findOne({ firebaseUid: req.firebaseUid });
            if (existing) return existing;
        }
        throw error;
    }
}

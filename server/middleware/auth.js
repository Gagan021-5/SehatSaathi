/**
 * JWT authentication middleware.
 * Verifies the token from the Authorization header.
 * Usage: router.get('/protected', authenticate, handler)
 */

import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'sehat-saathi-dev-secret';

export function authenticate(req, res, next) {
    const header = req.headers.authorization;
    if (!header?.startsWith('Bearer ')) {
        return res.status(401).json({ error: 'No token provided' });
    }

    try {
        const token = header.split(' ')[1];
        req.user = jwt.verify(token, JWT_SECRET);
        next();
    } catch {
        return res.status(401).json({ error: 'Invalid or expired token' });
    }
}

export function optionalAuth(req, _res, next) {
    const header = req.headers.authorization;
    if (header?.startsWith('Bearer ')) {
        try {
            req.user = jwt.verify(header.split(' ')[1], JWT_SECRET);
        } catch { /* ignore invalid tokens */ }
    }
    next();
}

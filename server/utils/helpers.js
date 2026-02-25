/**
 * Shared utility helpers for the server.
 */

export function parseNumber(val, fallback = 0) {
    const n = Number(val);
    return isNaN(n) ? fallback : n;
}

export function validateRequired(obj, fields) {
    const missing = fields.filter(f => obj[f] === undefined || obj[f] === null || obj[f] === '');
    return missing.length > 0 ? missing : null;
}

export function formatError(message, details = null) {
    const err = { error: message };
    if (details) err.details = details;
    return err;
}

export function clampNumber(val, min, max) {
    return Math.max(min, Math.min(max, parseNumber(val)));
}

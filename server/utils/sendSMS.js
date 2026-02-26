import axios from 'axios';

const FAST2SMS_ENDPOINT = 'https://www.fast2sms.com/dev/bulkV2';

function normalizePhoneNumber(phone) {
    const digits = `${phone || ''}`.replace(/\D/g, '');
    if (!digits) return '';
    const tenDigit = digits.length > 10 ? digits.slice(-10) : digits;
    return /^\d{10}$/.test(tenDigit) ? tenDigit : '';
}

export async function sendSMS(phone, message) {
    const normalizedPhone = normalizePhoneNumber(phone);
    const textBody = `${message || ''}`.trim();

    if (!normalizedPhone || !textBody) {
        console.warn('[FAST2SMS] Skipping SMS due to invalid payload.', { phone, message });
        return { ok: false, skipped: true, reason: 'invalid_payload' };
    }

    const apiKey = `${process.env.FAST2SMS_API_KEY || ''}`.trim();
    const payload = {
        route: 'q',
        message: textBody,
        language: 'english',
        flash: 0,
        numbers: normalizedPhone,
    };

    if (!apiKey) {
        console.log('==========================================');
        console.log(' FAST2SMS MOCK MODE (No API key configured)');
        console.log('------------------------------------------');
        console.log(` To      : ${normalizedPhone}`);
        console.log(` Message : ${textBody}`);
        console.log(' Payload :', payload);
        console.log('==========================================');
        return { ok: true, mocked: true, payload };
    }

    try {
        const { data } = await axios.post(FAST2SMS_ENDPOINT, payload, {
            headers: {
                authorization: apiKey,
                'Content-Type': 'application/json',
            },
            timeout: 12000,
        });

        return { ok: true, mocked: false, data };
    } catch (error) {
        console.error('[FAST2SMS] SMS send failed:', error?.response?.data || error.message);
        return { ok: false, mocked: false, error: error.message };
    }
}

export { normalizePhoneNumber };

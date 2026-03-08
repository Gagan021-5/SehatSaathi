import { getEmergencyGuidance as getGuidanceFromAI } from '../services/geminiService.js';
import { sendSMS, normalizePhoneNumber } from '../utils/sendSMS.js';
import RuralPatient from '../models/RuralPatient.js';
import User from '../models/User.js';
import Facility from '../models/Facility.js';

const EMERGENCY_VOICE_ID = process.env.ELEVENLABS_VOICE_ID || 'cgSgspJ2msm6clMCkdW9';

/* ────────────────────────────────────────────
   Helper: find the nearest hospital by pincode
   (mirrors smsController.findHospitalByPincode)
   ──────────────────────────────────────────── */
async function findNearestHospital(pincode) {
    // 1. Exact type + pincode match
    const direct = await Facility.findOne({ type: 'Hospital', pincode })
        .sort({ updatedAt: -1, name: 1 });
    if (direct) return direct;

    // 2. Text-search fallback for the same pincode
    const textMatch = await Facility.findOne(
        { pincode, $text: { $search: 'hospital' } },
        { score: { $meta: 'textScore' } },
    ).sort({ score: { $meta: 'textScore' }, updatedAt: -1 });

    return textMatch;
}

export async function getGuidance(req, res) {
    try {
        const { situation, language = 'en' } = req.body;
        if (!situation) return res.status(400).json({ error: 'Emergency situation required' });
        let guidance;
        try {
            guidance = await getGuidanceFromAI(situation, language);
        } catch (err) {
            console.error('Emergency AI fallback:', err.message);
            guidance = {
                title: 'Emergency Guidance',
                steps: [
                    'Call emergency services immediately.',
                    'Keep the person calm and breathing normally.',
                    'Do not give food or drink unless instructed by a professional.',
                ],
                do_not: ['Do not delay seeking professional help.'],
                while_waiting: ['Monitor breathing and consciousness continuously.'],
                call_emergency: true,
                severity: 'serious',
            };
        }

        let finalAudioBase64 = '';
        const apiKey = process.env.ELEVENLABS_API_KEY;
        if (apiKey && guidance?.steps?.length > 0) {
            try {
                const textToSpeak = guidance.steps.join('. ');
                console.log(`[ELEVENLABS/EMERGENCY] Requesting TTS | ${textToSpeak.length} chars | voice: ${EMERGENCY_VOICE_ID}`);

                const response = await fetch(
                    `https://api.elevenlabs.io/v1/text-to-speech/${EMERGENCY_VOICE_ID}?output_format=mp3_44100_128`,
                    {
                        method: 'POST',
                        headers: {
                            'Accept': 'audio/mpeg',
                            'Content-Type': 'application/json',
                            'xi-api-key': apiKey,
                        },
                        body: JSON.stringify({
                            text: textToSpeak,
                            model_id: 'eleven_multilingual_v2',
                            voice_settings: { stability: 0.5, similarity_boost: 0.75 },
                        }),
                    }
                );

                if (!response.ok) {
                    const errText = await response.text();
                    console.error(`[ELEVENLABS/EMERGENCY] HTTP ${response.status} Error:`, errText);
                } else {
                    const arrayBuffer = await response.arrayBuffer();
                    const buffer = Buffer.from(arrayBuffer);
                    finalAudioBase64 = buffer.toString('base64');
                    console.log(`[ELEVENLABS/EMERGENCY] ✓ ${buffer.length} bytes generated`);
                }
            } catch (ttsErr) {
                console.error('[ELEVENLABS/EMERGENCY] Fetch error:', ttsErr.message);
            }
        }

        res.json({ guidance, situation, audioBase64: finalAudioBase64 });
    } catch (err) {
        console.error('Emergency error:', err.message);
        res.status(500).json({ error: 'Failed to get emergency guidance' });
    }
}

/* ──────────────────────────────────────────────────────────────
   USSD Webhook  –  *123# Emergency Flow (Hackathon Pitch)
   ──────────────────────────────────────────────────────────────
   1. Caller ID  →  RuralPatient lookup
   2. Patient pincode  →  Nearest Hospital (Facility)
   3. patient.registeredBy  →  ASHA worker / User contact
   4. Dual-dispatch SOS SMS  →  ASHA worker + patient
   ────────────────────────────────────────────────────────────── */
export async function ussdWebhook(req, res) {
    try {
        const { phoneNumber, text } = req.body;

        // ── Validate USSD code ──────────────────────────────────
        if (text !== '*123#') {
            return res.status(400).json({ error: 'Invalid USSD code. Expected *123#' });
        }

        const normalizedPhone = normalizePhoneNumber(phoneNumber);
        if (!normalizedPhone) {
            return res.status(400).json({ error: 'Invalid or missing phoneNumber.' });
        }

        console.log(`[USSD] *123# triggered by ${normalizedPhone}`);

        // ── Step 1: Match Caller ID in RuralPatient DB ──────────
        const patient = await RuralPatient.findOne({ phoneNumber: normalizedPhone });

        if (!patient) {
            // Unregistered caller — send a fallback SMS asking them to register
            const fallbackMsg =
                'SehatSaathi: Aapka number humare system mein registered nahi hai. ' +
                'Kripya apne ASHA worker se sampark karein aur register karein.';
            await sendSMS(normalizedPhone, fallbackMsg);

            console.log(`[USSD] No RuralPatient found for ${normalizedPhone}. Fallback SMS sent.`);
            return res.status(404).json({
                success: false,
                message: 'Phone number not registered. Fallback SMS sent.',
                recipient: normalizedPhone,
            });
        }

        console.log(`[USSD] Patient matched: ${patient.name} | Pincode: ${patient.pincode}`);

        // ── Step 2: Find nearest hospital by patient pincode ────
        const hospital = await findNearestHospital(patient.pincode);

        const hospitalName = hospital?.name || 'Nearest Government Hospital';
        const hospitalContact = hospital?.contactNumber
            ? `Contact: ${hospital.contactNumber}`
            : 'Contact: 102 (Ambulance)';

        console.log(`[USSD] Hospital: ${hospitalName} | ${hospitalContact}`);

        // ── Step 3: Fetch ASHA worker / registering user ────────
        let ashaWorker = null;
        if (patient.registeredBy) {
            ashaWorker = await User.findById(patient.registeredBy).lean();
        }

        const ashaPhone = normalizePhoneNumber(ashaWorker?.phone || '');
        const ashaName = ashaWorker?.name || 'ASHA Worker';

        // ── Step 4: Construct the dynamic SOS message ────────────
        const patientName = patient.name || 'Registered Patient';

        const sosMessage =
            `🚨 SEHATSAATHI EMERGENCY 🚨\n` +
            `Patient: ${patientName}\n` +
            `Location Pincode: ${patient.pincode}\n` +
            `Nearest Hospital: ${hospitalName}\n` +
            `${hospitalContact}\n` +
            `\nPlease dispatch help immediately to the patient's registered location.\n` +
            `– SehatSaathi`;

        // ── Step 5: Multi-dispatch SMS ──────────────────────────
        const smsTargets = [];

        // Primary: SMS the ASHA worker / emergency contact (family)
        const emergencyPhone = normalizePhoneNumber(patient.emergencyContact || '');
        if (emergencyPhone) {
            smsTargets.push({ label: 'Family / Emergency', phone: emergencyPhone });
        }

        // Also reach the ASHA worker (registering user) if different
        if (ashaPhone && ashaPhone !== emergencyPhone) {
            smsTargets.push({ label: `ASHA (${ashaName})`, phone: ashaPhone });
        }

        // Confirm to the patient that help is on the way
        if (normalizedPhone !== emergencyPhone && normalizedPhone !== ashaPhone) {
            smsTargets.push({ label: 'Patient', phone: normalizedPhone });
        }

        const results = await Promise.allSettled(
            smsTargets.map((t) => sendSMS(t.phone, sosMessage)),
        );

        const summary = smsTargets.map((t, i) => ({
            label: t.label,
            phone: t.phone,
            status: results[i].status === 'fulfilled' ? 'sent' : 'failed',
            mocked: results[i].status === 'fulfilled' ? (results[i].value?.mocked || false) : false,
        }));

        const sentCount = summary.filter((s) => s.status === 'sent').length;
        console.log(`[USSD] SOS SMS dispatched to ${sentCount}/${smsTargets.length} targets.`);

        return res.status(200).json({
            success: true,
            message: 'USSD emergency processed. SOS dispatched.',
            patient: {
                name: patientName,
                phoneNumber: patient.phoneNumber,
                pincode: patient.pincode,
            },
            hospital: {
                name: hospitalName,
                contact: hospitalContact,
                found: Boolean(hospital),
            },
            ashaWorker: {
                name: ashaName,
                phone: ashaPhone || 'N/A',
            },
            emergencyContact: emergencyPhone || 'N/A',
            smsDispatch: summary,
        });
    } catch (err) {
        console.error('[USSD Webhook] Error:', err.message);
        return res.status(500).json({ error: 'Failed to process USSD webhook.' });
    }
}

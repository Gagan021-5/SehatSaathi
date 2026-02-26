import Facility from '../models/Facility.js';
import RuralPatient from '../models/RuralPatient.js';
import { sendSMS as sendFast2SMS, normalizePhoneNumber } from '../utils/sendSMS.js';
import { resolveAuthUser } from '../utils/resolveAuthUser.js';

const PINCODE_REGEX = /^\d{6}$/;
const TIME_REGEX = /^([01]\d|2[0-3]):([0-5]\d)$/;
const WEBHOOK_COMMAND_REGEX = /^HOSPITAL\s+(\d{6})$/i;

function parseWebhookBody(rawBody = {}) {
    const phoneCandidates = [
        rawBody.mobile,
        rawBody.sender,
        rawBody.msisdn,
        rawBody.from,
        rawBody.number,
        rawBody.phone,
    ];
    const textCandidates = [
        rawBody.message,
        rawBody.text,
        rawBody.body,
        rawBody.fullmessage,
        rawBody.msg,
    ];
    const latCandidates = [rawBody.lat, rawBody.latitude, rawBody.sender_lat];
    const lngCandidates = [rawBody.lng, rawBody.longitude, rawBody.sender_lng];

    const fromPhone = normalizePhoneNumber(phoneCandidates.find(Boolean) || '');
    const message = `${textCandidates.find(Boolean) || ''}`.trim();
    const lat = Number(latCandidates.find((value) => value !== undefined));
    const lng = Number(lngCandidates.find((value) => value !== undefined));

    return {
        fromPhone,
        message,
        lat: Number.isFinite(lat) ? lat : null,
        lng: Number.isFinite(lng) ? lng : null,
    };
}

function normalizePincode(value) {
    const digits = `${value || ''}`.replace(/\D/g, '');
    return PINCODE_REGEX.test(digits) ? digits : '';
}

function normalizeReminder(input) {
    const medicineName = `${input?.medicineName || ''}`.trim();
    const timeToTake = `${input?.timeToTake || ''}`.trim();
    if (!medicineName || !TIME_REGEX.test(timeToTake)) return null;
    return { medicineName, timeToTake };
}

function toRuralPatientView(patient) {
    const payload = patient?.toObject ? patient.toObject() : patient;
    return {
        _id: payload._id,
        name: payload.name,
        phoneNumber: payload.phoneNumber,
        pincode: payload.pincode,
        registeredBy: payload.registeredBy,
        activeReminders: payload.activeReminders || [],
        createdAt: payload.createdAt,
        updatedAt: payload.updatedAt,
    };
}

async function findHospitalByPincode({ pincode, lat, lng }) {
    const baseQuery = { type: 'Hospital', pincode };

    if (Number.isFinite(lat) && Number.isFinite(lng)) {
        const geoMatch = await Facility.findOne({
            ...baseQuery,
            location: {
                $near: {
                    $geometry: { type: 'Point', coordinates: [lng, lat] },
                    $maxDistance: 75000,
                },
            },
        });
        if (geoMatch) return geoMatch;
    }

    const directMatch = await Facility.findOne(baseQuery).sort({ updatedAt: -1, name: 1 });
    if (directMatch) return directMatch;

    const textMatch = await Facility.findOne(
        { pincode, $text: { $search: 'hospital' } },
        { score: { $meta: 'textScore' } }
    ).sort({ score: { $meta: 'textScore' }, updatedAt: -1 });

    return textMatch;
}

function buildFacilityReply(facility, pincode) {
    if (!facility) {
        return `Maaf kijiye, pincode ${pincode} ke liye hospital data uplabdh nahi hai. Kripya ASHA worker se sampark karein.`;
    }

    const contact = facility.contactNumber ? `Call: ${facility.contactNumber}` : 'Call: N/A';
    return `Najdeeki Hospital: ${facility.name}. Type: ${facility.type}. Pincode: ${facility.pincode}. ${contact}`;
}

export async function smsWebhook(req, res) {
    try {
        const { fromPhone, message, lat, lng } = parseWebhookBody(req.body);

        if (!fromPhone || !message) {
            return res.status(400).json({ error: 'Invalid webhook payload' });
        }

        const match = message.match(WEBHOOK_COMMAND_REGEX);
        if (!match) {
            await sendFast2SMS(
                fromPhone,
                'Galat format. Kripya is format mein bhejein: HOSPITAL 110042'
            );
            return res.json({ ok: true, handled: true, command: 'invalid' });
        }

        const pincode = normalizePincode(match[1]);
        const hospital = await findHospitalByPincode({ pincode, lat, lng });
        const reply = buildFacilityReply(hospital, pincode);
        await sendFast2SMS(fromPhone, reply);

        return res.json({
            ok: true,
            handled: true,
            command: 'hospital_lookup',
            pincode,
            facilityFound: Boolean(hospital),
        });
    } catch (error) {
        console.error('SMS webhook processing error:', error.message);
        return res.status(500).json({ error: 'Webhook processing failed' });
    }
}

export async function simulateInboundSMS(req, res) {
    try {
        const { senderNumber, textMessage } = req.body || {};

        console.log(`[INBOUND SMS SIMULATOR] From: ${senderNumber} | Message: ${textMessage}`);

        const parts = `${textMessage || ''}`.toUpperCase().trim().split(/\s+/);
        const keyword = parts[0] || '';
        const param = parts[1] || '';

        let replyMessage = '';

        if (keyword === 'HOSPITAL' && param) {
            replyMessage = `SehatSaathi: Pincode ${param} ke pas apka nazdiki aspatal 'Safdarjung Hospital' hai. Sampark: 102.`;
        } else if (keyword === 'HELP') {
            replyMessage = 'SehatSaathi: Kisi bhi emergency ke liye turant 112 par call karein.';
        } else {
            replyMessage = 'SehatSaathi Error: Sahi format ka use karein. Example: HOSPITAL 110042';
        }

        await sendFast2SMS(senderNumber, replyMessage);

        return res.status(200).json({
            success: true,
            message: 'Simulated SMS processed and replied!',
        });
    } catch (error) {
        console.error('Simulate inbound SMS error:', error.message);
        return res.status(500).json({ success: false, error: 'Simulation failed' });
    }
}

export async function listRuralPatients(req, res) {
    try {
        const user = await resolveAuthUser(req);
        const patients = await RuralPatient.find({ registeredBy: user._id }).sort({ createdAt: -1 });
        res.json((patients || []).map(toRuralPatientView));
    } catch (error) {
        console.error('List rural patients error:', error.message);
        res.status(500).json({ error: 'Failed to load rural patients' });
    }
}

export async function createRuralPatient(req, res) {
    try {
        const user = await resolveAuthUser(req);
        const name = `${req.body?.name || ''}`.trim();
        const phoneNumber = normalizePhoneNumber(req.body?.phoneNumber);
        const pincode = normalizePincode(req.body?.pincode);

        if (!name || !phoneNumber || !pincode) {
            return res.status(400).json({ error: 'name, 10-digit phoneNumber, and 6-digit pincode are required' });
        }

        const patient = await RuralPatient.create({
            name,
            phoneNumber,
            pincode,
            registeredBy: user._id,
            activeReminders: [],
        });

        res.status(201).json(toRuralPatientView(patient));
    } catch (error) {
        if (error?.code === 11000) {
            return res.status(409).json({ error: 'A patient with this phoneNumber already exists' });
        }
        console.error('Create rural patient error:', error.message);
        res.status(500).json({ error: 'Failed to create rural patient' });
    }
}

export async function updateRuralPatient(req, res) {
    try {
        const user = await resolveAuthUser(req);
        const { id } = req.params;
        const updates = {};

        if (req.body?.name !== undefined) {
            const name = `${req.body.name || ''}`.trim();
            if (!name) return res.status(400).json({ error: 'name cannot be empty' });
            updates.name = name;
        }

        if (req.body?.phoneNumber !== undefined) {
            const phoneNumber = normalizePhoneNumber(req.body.phoneNumber);
            if (!phoneNumber) return res.status(400).json({ error: 'phoneNumber must be 10 digits' });
            updates.phoneNumber = phoneNumber;
        }

        if (req.body?.pincode !== undefined) {
            const pincode = normalizePincode(req.body.pincode);
            if (!pincode) return res.status(400).json({ error: 'pincode must be 6 digits' });
            updates.pincode = pincode;
        }

        if (!Object.keys(updates).length) {
            return res.status(400).json({ error: 'No valid fields to update' });
        }

        const patient = await RuralPatient.findOneAndUpdate(
            { _id: id, registeredBy: user._id },
            { $set: updates },
            { new: true }
        );

        if (!patient) return res.status(404).json({ error: 'Rural patient not found' });
        res.json(toRuralPatientView(patient));
    } catch (error) {
        if (error?.code === 11000) {
            return res.status(409).json({ error: 'A patient with this phoneNumber already exists' });
        }
        console.error('Update rural patient error:', error.message);
        res.status(500).json({ error: 'Failed to update rural patient' });
    }
}

export async function deleteRuralPatient(req, res) {
    try {
        const user = await resolveAuthUser(req);
        const { id } = req.params;

        const deleted = await RuralPatient.findOneAndDelete({ _id: id, registeredBy: user._id });
        if (!deleted) return res.status(404).json({ error: 'Rural patient not found' });

        res.status(204).send();
    } catch (error) {
        console.error('Delete rural patient error:', error.message);
        res.status(500).json({ error: 'Failed to delete rural patient' });
    }
}

export async function addRuralReminder(req, res) {
    try {
        const user = await resolveAuthUser(req);
        const { id } = req.params;
        const reminder = normalizeReminder(req.body);
        if (!reminder) {
            return res.status(400).json({ error: 'medicineName and timeToTake (HH:MM) are required' });
        }

        const patient = await RuralPatient.findOne({ _id: id, registeredBy: user._id });
        if (!patient) return res.status(404).json({ error: 'Rural patient not found' });

        const exists = patient.activeReminders.some(
            (entry) =>
                entry.medicineName.toLowerCase() === reminder.medicineName.toLowerCase() &&
                entry.timeToTake === reminder.timeToTake
        );

        if (exists) {
            return res.status(409).json({ error: 'This reminder already exists for the patient' });
        }

        patient.activeReminders.push(reminder);
        await patient.save();
        res.status(201).json(toRuralPatientView(patient));
    } catch (error) {
        console.error('Add rural reminder error:', error.message);
        res.status(500).json({ error: 'Failed to add reminder' });
    }
}

export async function updateRuralReminder(req, res) {
    try {
        const user = await resolveAuthUser(req);
        const { id, reminderId } = req.params;
        const patient = await RuralPatient.findOne({ _id: id, registeredBy: user._id });
        if (!patient) return res.status(404).json({ error: 'Rural patient not found' });

        const reminder = patient.activeReminders.id(reminderId);
        if (!reminder) return res.status(404).json({ error: 'Reminder not found' });

        if (req.body?.medicineName !== undefined) {
            const medicineName = `${req.body.medicineName || ''}`.trim();
            if (!medicineName) return res.status(400).json({ error: 'medicineName cannot be empty' });
            reminder.medicineName = medicineName;
        }

        if (req.body?.timeToTake !== undefined) {
            const timeToTake = `${req.body.timeToTake || ''}`.trim();
            if (!TIME_REGEX.test(timeToTake)) {
                return res.status(400).json({ error: 'timeToTake must be in HH:MM format' });
            }
            reminder.timeToTake = timeToTake;
        }

        await patient.save();
        res.json(toRuralPatientView(patient));
    } catch (error) {
        console.error('Update rural reminder error:', error.message);
        res.status(500).json({ error: 'Failed to update reminder' });
    }
}

export async function removeRuralReminder(req, res) {
    try {
        const user = await resolveAuthUser(req);
        const { id, reminderId } = req.params;
        const patient = await RuralPatient.findOne({ _id: id, registeredBy: user._id });
        if (!patient) return res.status(404).json({ error: 'Rural patient not found' });

        const reminder = patient.activeReminders.id(reminderId);
        if (!reminder) return res.status(404).json({ error: 'Reminder not found' });

        reminder.deleteOne();
        await patient.save();
        res.json(toRuralPatientView(patient));
    } catch (error) {
        console.error('Remove rural reminder error:', error.message);
        res.status(500).json({ error: 'Failed to remove reminder' });
    }
}

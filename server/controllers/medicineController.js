import MedicineReminder from '../models/MedicineReminder.js';
import { resolveAuthUser } from '../utils/resolveAuthUser.js';

function getTodayWindow() {
    const start = new Date();
    start.setHours(0, 0, 0, 0);
    const end = new Date(start);
    end.setHours(23, 59, 59, 999);
    return { start, end };
}

function normalizeTimes(times) {
    if (!Array.isArray(times)) return [];
    const valid = times
        .map((time) => `${time || ''}`.trim())
        .filter((time) => /^([01]\d|2[0-3]):([0-5]\d)$/.test(time));
    return [...new Set(valid)].sort();
}

function toReminderView(reminder) {
    const payload = reminder?.toObject ? reminder.toObject() : reminder;
    const { start, end } = getTodayWindow();
    const takenHistory = (payload?.takenHistory || []).map((value) => new Date(value));
    const dosesTakenToday = takenHistory.filter((entry) => entry >= start && entry <= end).length;
    const dosesPlannedToday = payload?.times?.length || 0;

    return {
        ...payload,
        dosesTakenToday,
        dosesPlannedToday,
    };
}

export async function getMedicineReminders(req, res) {
    try {
        const user = await resolveAuthUser(req);
        const reminders = await MedicineReminder.find({ user: user._id }).sort({ createdAt: -1 });
        res.json(reminders.map(toReminderView));
    } catch (error) {
        console.error('Get medicine reminders error:', error.message);
        res.status(500).json({ error: 'Failed to load medicine reminders' });
    }
}

export async function createMedicineReminder(req, res) {
    try {
        const user = await resolveAuthUser(req);
        const { medicineName, dosage, times, stockRemaining = 0, withFood = false } = req.body;

        if (!medicineName || !dosage) {
            return res.status(400).json({ error: 'medicineName and dosage are required' });
        }

        const normalizedTimes = normalizeTimes(times);
        if (!normalizedTimes.length) {
            return res.status(400).json({ error: 'At least one valid time (HH:MM) is required' });
        }

        const reminder = await MedicineReminder.create({
            user: user._id,
            medicineName: medicineName.trim(),
            dosage: dosage.trim(),
            times: normalizedTimes,
            stockRemaining: Math.max(0, Number(stockRemaining) || 0),
            withFood: Boolean(withFood),
        });

        res.status(201).json(toReminderView(reminder));
    } catch (error) {
        console.error('Create medicine reminder error:', error.message);
        res.status(500).json({ error: 'Failed to create reminder' });
    }
}

export async function updateMedicineReminder(req, res) {
    try {
        const user = await resolveAuthUser(req);
        const { id } = req.params;
        const updates = {};

        if (req.body.medicineName !== undefined) updates.medicineName = `${req.body.medicineName}`.trim();
        if (req.body.dosage !== undefined) updates.dosage = `${req.body.dosage}`.trim();
        if (req.body.withFood !== undefined) updates.withFood = Boolean(req.body.withFood);
        if (req.body.stockRemaining !== undefined) updates.stockRemaining = Math.max(0, Number(req.body.stockRemaining) || 0);
        if (req.body.times !== undefined) {
            const normalizedTimes = normalizeTimes(req.body.times);
            if (!normalizedTimes.length) {
                return res.status(400).json({ error: 'At least one valid time (HH:MM) is required' });
            }
            updates.times = normalizedTimes;
        }

        if (!Object.keys(updates).length) {
            return res.status(400).json({ error: 'No valid fields to update' });
        }

        const reminder = await MedicineReminder.findOneAndUpdate(
            { _id: id, user: user._id },
            { $set: updates },
            { new: true }
        );

        if (!reminder) return res.status(404).json({ error: 'Reminder not found' });
        res.json(toReminderView(reminder));
    } catch (error) {
        console.error('Update medicine reminder error:', error.message);
        res.status(500).json({ error: 'Failed to update reminder' });
    }
}

export async function deleteMedicineReminder(req, res) {
    try {
        const user = await resolveAuthUser(req);
        const { id } = req.params;

        const deleted = await MedicineReminder.findOneAndDelete({ _id: id, user: user._id });
        if (!deleted) return res.status(404).json({ error: 'Reminder not found' });

        res.status(204).send();
    } catch (error) {
        console.error('Delete medicine reminder error:', error.message);
        res.status(500).json({ error: 'Failed to delete reminder' });
    }
}

export async function markMedicineTaken(req, res) {
    try {
        const user = await resolveAuthUser(req);
        const { id } = req.params;

        const reminder = await MedicineReminder.findOne({ _id: id, user: user._id });
        if (!reminder) return res.status(404).json({ error: 'Reminder not found' });

        reminder.takenHistory.push(new Date());
        if (reminder.stockRemaining > 0) reminder.stockRemaining -= 1;

        await reminder.save();
        res.json(toReminderView(reminder));
    } catch (error) {
        console.error('Mark medicine taken error:', error.message);
        res.status(500).json({ error: 'Failed to update medicine intake' });
    }
}

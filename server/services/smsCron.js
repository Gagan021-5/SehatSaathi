import cron from 'node-cron';
import RuralPatient from '../models/RuralPatient.js';
import { sendSMS } from '../utils/sendSMS.js';

let smsCronTask = null;

function getCurrentHHMM() {
    const now = new Date();
    const hh = String(now.getHours()).padStart(2, '0');
    const mm = String(now.getMinutes()).padStart(2, '0');
    return `${hh}:${mm}`;
}

async function runReminderTick() {
    const dueTime = getCurrentHHMM();

    try {
        const duePatients = await RuralPatient.find({
            activeReminders: { $elemMatch: { timeToTake: dueTime } },
        }).select('name phoneNumber activeReminders');

        if (!duePatients.length) return;

        for (const patient of duePatients) {
            const dueReminders = (patient.activeReminders || []).filter(
                (reminder) => reminder.timeToTake === dueTime
            );

            for (const reminder of dueReminders) {
                const message = `Namaste ${patient.name}, aapki dawai ${reminder.medicineName} lene ka samay ho gaya hai.`;
                await sendSMS(patient.phoneNumber, message);
            }
        }
    } catch (error) {
        console.error('SMS cron tick failed:', error.message);
    }
}

export function startSmsCron() {
    if (smsCronTask) return smsCronTask;

    smsCronTask = cron.schedule(
        '* * * * *',
        () => {
            runReminderTick();
        },
        {
            timezone: process.env.SMS_CRON_TIMEZONE || 'Asia/Kolkata',
        }
    );

    console.log('[SMS_CRON] Rural reminder cron started.');
    return smsCronTask;
}

export function stopSmsCron() {
    if (!smsCronTask) return;
    smsCronTask.stop();
    smsCronTask = null;
}

export { runReminderTick };

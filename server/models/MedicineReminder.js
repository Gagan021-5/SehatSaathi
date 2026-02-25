import mongoose from 'mongoose';

const TIME_FORMAT = /^([01]\d|2[0-3]):([0-5]\d)$/;

const medicineReminderSchema = new mongoose.Schema(
    {
        user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
        medicineName: { type: String, required: true, trim: true },
        dosage: { type: String, required: true, trim: true },
        times: {
            type: [String],
            required: true,
            validate: {
                validator: (times) => Array.isArray(times) && times.length > 0 && times.every((time) => TIME_FORMAT.test(time)),
                message: 'Times must be an array of HH:MM values.',
            },
        },
        stockRemaining: { type: Number, default: 0, min: 0 },
        withFood: { type: Boolean, default: false },
        takenHistory: { type: [Date], default: [] },
    },
    { timestamps: true }
);

medicineReminderSchema.index({ user: 1, medicineName: 1 });

export default mongoose.model('MedicineReminder', medicineReminderSchema);

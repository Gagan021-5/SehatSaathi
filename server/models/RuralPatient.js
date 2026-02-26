import mongoose from 'mongoose';

const PHONE_REGEX = /^\d{10}$/;
const PINCODE_REGEX = /^\d{6}$/;
const TIME_REGEX = /^([01]\d|2[0-3]):([0-5]\d)$/;

const ruralReminderSchema = new mongoose.Schema(
    {
        medicineName: { type: String, required: true, trim: true },
        timeToTake: {
            type: String,
            required: true,
            validate: {
                validator: (value) => TIME_REGEX.test(value),
                message: 'timeToTake must be in HH:MM (24-hour) format.',
            },
        },
    },
    { _id: true }
);

const ruralPatientSchema = new mongoose.Schema(
    {
        name: { type: String, required: true, trim: true },
        phoneNumber: {
            type: String,
            required: true,
            unique: true,
            index: true,
            validate: {
                validator: (value) => PHONE_REGEX.test(value),
                message: 'phoneNumber must be exactly 10 digits.',
            },
        },
        pincode: {
            type: String,
            required: true,
            index: true,
            validate: {
                validator: (value) => PINCODE_REGEX.test(value),
                message: 'pincode must be exactly 6 digits.',
            },
        },
        registeredBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true,
            index: true,
        },
        activeReminders: {
            type: [ruralReminderSchema],
            default: [],
        },
    },
    { timestamps: true }
);

ruralPatientSchema.index({ registeredBy: 1, name: 1 });
ruralPatientSchema.index({ registeredBy: 1, phoneNumber: 1 });

export default mongoose.model('RuralPatient', ruralPatientSchema);

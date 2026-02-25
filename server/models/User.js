import mongoose from 'mongoose';

const userSchema = new mongoose.Schema({
    firebaseUid: { type: String, required: true, unique: true, index: true },
    email: { type: String, required: true, lowercase: true, trim: true },
    name: { type: String, default: '' },
    photoURL: { type: String, default: '' },
    phone: { type: String, default: '' },
    dateOfBirth: { type: String, default: '' },
    gender: { type: String, default: '' },
    bloodGroup: { type: String, default: '' },
    language: { type: String, default: 'en' },
    allergies: [{ type: String }],
    conditions: [{ type: String }],
    emergencyContact: {
        name: { type: String, default: '' },
        phone: { type: String, default: '' },
        relation: { type: String, default: '' },
    },
    createdAt: { type: Date, default: Date.now },
});

export default mongoose.model('User', userSchema);

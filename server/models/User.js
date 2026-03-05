import mongoose from 'mongoose';

const emergencyContactSchema = new mongoose.Schema({
    name: { type: String, default: '' },
    phone: { type: String, default: '' },
    relation: { type: String, default: '' },
}, { _id: false });

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
    emergencyContacts: {
        type: [emergencyContactSchema],
        validate: [arr => arr.length <= 3, 'Maximum 3 emergency contacts allowed'],
        default: [],
    },
    createdAt: { type: Date, default: Date.now },
});

// Backward compatibility: read the first contact as emergencyContact
userSchema.virtual('emergencyContact').get(function () {
    return this.emergencyContacts?.[0] || { name: '', phone: '', relation: '' };
});

userSchema.set('toJSON', { virtuals: true });
userSchema.set('toObject', { virtuals: true });

export default mongoose.model('User', userSchema);


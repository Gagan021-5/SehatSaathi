import mongoose from 'mongoose';

const familyMemberSchema = new mongoose.Schema(
    {
        user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
        name: { type: String, required: true, trim: true },
        relation: { type: String, required: true, trim: true },
        age: { type: Number, required: true, min: 0, max: 130 },
        bloodGroup: { type: String, default: '', trim: true },
    },
    { timestamps: true }
);

familyMemberSchema.index({ user: 1, name: 1 });

export default mongoose.model('FamilyMember', familyMemberSchema);

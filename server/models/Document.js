import mongoose from 'mongoose';

const documentSchema = new mongoose.Schema(
    {
        user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
        url: { type: String, required: true, trim: true },
        fileName: { type: String, required: true, trim: true },
        category: {
            type: String,
            required: true,
            enum: ['Lab Report', 'Prescription', 'Imaging', 'Discharge Summary', 'Other'],
        },
        familyMemberId: { type: mongoose.Schema.Types.ObjectId, ref: 'FamilyMember', required: true, index: true },
        uploadDate: { type: Date, default: Date.now },
    },
    { timestamps: true }
);

documentSchema.index({ user: 1, familyMemberId: 1, uploadDate: -1 });

export default mongoose.model('Document', documentSchema);

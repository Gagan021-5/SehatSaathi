import mongoose from 'mongoose';

const healthToolResultSchema = new mongoose.Schema(
    {
        user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
        type: { type: String, required: true, enum: ['calculator', 'screening'] },
        title: { type: String, required: true, trim: true },
        score: { type: Number, default: null },
        severity: { type: String, default: '' },
        payload: { type: mongoose.Schema.Types.Mixed, default: {} },
    },
    { timestamps: true }
);

healthToolResultSchema.index({ user: 1, createdAt: -1 });

export default mongoose.model('HealthToolResult', healthToolResultSchema);

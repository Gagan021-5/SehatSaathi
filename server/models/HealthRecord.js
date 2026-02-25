import mongoose from 'mongoose';

const healthRecordSchema = new mongoose.Schema({
    userId: { type: String, required: true, index: true },
    type: { type: String, required: true, enum: ['blood_pressure', 'heart_rate', 'temperature', 'blood_sugar', 'weight', 'oxygen'] },
    value: { type: Number, required: true },
    unit: { type: String, default: '' },
    notes: { type: String, default: '' },
    createdAt: { type: Date, default: Date.now },
});

healthRecordSchema.index({ userId: 1, type: 1, createdAt: -1 });

export default mongoose.model('HealthRecord', healthRecordSchema);

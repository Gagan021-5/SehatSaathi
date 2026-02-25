import mongoose from 'mongoose';

const predictionSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    type: { type: String, enum: ['symptom', 'diabetes'], required: true },
    input: { type: mongoose.Schema.Types.Mixed, required: true },
    result: { type: mongoose.Schema.Types.Mixed, required: true },
    createdAt: { type: Date, default: Date.now },
});

predictionSchema.index({ userId: 1, createdAt: -1 });
predictionSchema.index({ type: 1 });

export default mongoose.model('Prediction', predictionSchema);

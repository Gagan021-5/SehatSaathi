import mongoose from 'mongoose';

const messageSchema = new mongoose.Schema({
    role: { type: String, enum: ['user', 'assistant'], required: true },
    content: { type: String, required: true },
    sentAt: { type: Date, default: Date.now },
});

const chatSessionSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    language: { type: String, default: 'en' },
    messages: [messageSchema],
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now },
});

chatSessionSchema.pre('save', function (next) {
    this.updatedAt = new Date();
    next();
});

chatSessionSchema.index({ userId: 1, updatedAt: -1 });

export default mongoose.model('ChatSession', chatSessionSchema);

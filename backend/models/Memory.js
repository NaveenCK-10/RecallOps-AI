import mongoose from 'mongoose';

const memorySchema = new mongoose.Schema({
  memoryId: { type: String, required: true, unique: true },
  type: { type: String, enum: ['incident', 'fix', 'note', 'conversation'], required: true },
  content: { type: String, required: true },
  summary: { type: String },
  incidentId: { type: String },
  tags: [String],
  metadata: {
    engineer: String,
    severity: String,
    category: String,
    resolution: String,
    wasSuccessful: Boolean,
    confidence: Number,
  },
  embedding: [Number],
  accessCount: { type: Number, default: 0 },
  lastAccessedAt: Date,
}, { timestamps: true });

memorySchema.index({ memoryId: 1 });
memorySchema.index({ type: 1 });
memorySchema.index({ tags: 1 });
memorySchema.index({ createdAt: -1 });

export default mongoose.model('Memory', memorySchema);

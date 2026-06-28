import mongoose from 'mongoose';

const incidentSchema = new mongoose.Schema({
  incidentId: { type: String, required: true, unique: true },
  title: { type: String, required: true },
  rawLog: { type: String, required: true },
  severity: { type: String, enum: ['critical', 'high', 'medium', 'low'], default: 'medium' },
  status: { type: String, enum: ['open', 'investigating', 'resolved', 'closed'], default: 'open' },
  rootCause: { type: String },
  resolution: { type: String },
  explanation: { type: String },
  confidence: { type: Number, min: 0, max: 100 },
  category: { type: String },
  tags: [String],
  engineerNotes: { type: String },
  similarIncidents: [{
    incidentId: String,
    title: String,
    similarity: Number,
    resolution: String,
    wasSuccessful: Boolean,
  }],
  runtimeDecisions: {
    model: String,
    reason: String,
    latency: Number,
    estimatedCost: Number,
    routingPath: [String],
    auditLog: [{
      timestamp: Date,
      action: String,
      detail: String,
    }],
  },
  resolvedAt: Date,
  resolutionTimeMs: Number,
}, { timestamps: true });

incidentSchema.index({ incidentId: 1 });
incidentSchema.index({ severity: 1, status: 1 });
incidentSchema.index({ createdAt: -1 });

export default mongoose.model('Incident', incidentSchema);

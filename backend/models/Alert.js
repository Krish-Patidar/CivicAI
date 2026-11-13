const mongoose = require('mongoose');

// One document per alert shown on the control-room device.
// createdAt = alert raised, deliveredAt = first time the device fetched it, acknowledgedAt = button / dashboard ack.
const alertSchema = new mongoose.Schema({
  complaintId: { type: mongoose.Schema.Types.ObjectId, ref: 'Complaint', default: null },
  complaintNumber: { type: String, default: '' },
  title: { type: String, default: '' },
  category: { type: String, default: '' },
  location: { type: String, default: '' },
  severity: { type: String, enum: ['critical', 'high', 'test'], default: 'critical' },
  source: { type: String, enum: ['auto', 'manual', 'test'], default: 'auto' },
  status: { type: String, enum: ['pending', 'delivered', 'acknowledged'], default: 'pending' },
  deliveredAt: { type: Date, default: null },
  acknowledgedAt: { type: Date, default: null },
  acknowledgedBy: { type: String, default: '' }
}, { timestamps: true });

alertSchema.index({ status: 1, createdAt: 1 });

module.exports = mongoose.model('Alert', alertSchema);

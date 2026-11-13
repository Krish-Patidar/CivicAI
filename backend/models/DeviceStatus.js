const mongoose = require('mongoose');

// Updated every time the ESP32 polls; lets the dashboard show online / offline.
const deviceStatusSchema = new mongoose.Schema({
  deviceId: { type: String, unique: true, required: true },
  lastSeen: { type: Date, default: null },
  rssi: { type: Number, default: null },
  ip: { type: String, default: '' },
  polls: { type: Number, default: 0 }
}, { timestamps: true });

module.exports = mongoose.model('DeviceStatus', deviceStatusSchema);

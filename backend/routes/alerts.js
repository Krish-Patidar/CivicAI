const express = require('express');
const mongoose = require('mongoose');
const router = express.Router();
const Alert = require('../models/Alert');
const DeviceStatus = require('../models/DeviceStatus');
const Complaint = require('../models/Complaint');
const { protect, authorize } = require('../middleware/auth');
const deviceAuth = require('../middleware/deviceAuth');
const { raiseAlert } = require('../utils/alerts');

const ESCALATE_MS = (parseInt(process.env.ALERT_ESCALATE_SEC, 10) || 120) * 1000;
const ONLINE_MS = 15000;
const isId = (v) => mongoose.Types.ObjectId.isValid(v);
const fail = (res, err) => res.status(500).json({ success: false, message: err.message });

const devicePayload = (a) => ({
  id: a._id,
  complaintNumber: a.complaintNumber || '',
  title: a.title,
  category: a.category,
  location: a.location,
  severity: a.severity,
  source: a.source,
  escalated: Date.now() - a.createdAt.getTime() > ESCALATE_MS
});

// ---------- Device endpoints (header: x-device-key) ----------

// The ESP32 polls this every few seconds. The poll doubles as the heartbeat.
router.get('/pending', deviceAuth, async (req, res) => {
  try {
    const deviceId = String(req.query.id || 'control-room-1').slice(0, 40);
    await DeviceStatus.findOneAndUpdate(
      { deviceId },
      { $set: { lastSeen: new Date(), rssi: Number(req.query.rssi) || null, ip: req.ip }, $inc: { polls: 1 } },
      { upsert: true }
    );
    const alert = await Alert.findOne({ status: { $ne: 'acknowledged' } }).sort({ createdAt: 1 });
    if (!alert) return res.json({ alert: null });
    if (!alert.deliveredAt) {
      alert.deliveredAt = new Date();
      alert.status = 'delivered';
      await alert.save();
    }
    res.json({ alert: devicePayload(alert) });
  } catch (err) { fail(res, err); }
});

// Button press on the device.
router.post('/:id/ack', deviceAuth, async (req, res) => {
  try {
    if (!isId(req.params.id)) return res.status(400).json({ success: false, message: 'Invalid alert id' });
    const alert = await Alert.findOneAndUpdate(
      { _id: req.params.id, status: { $ne: 'acknowledged' } },
      { $set: { status: 'acknowledged', acknowledgedAt: new Date(), acknowledgedBy: 'device' } },
      { new: true }
    );
    if (alert) return res.json({ success: true });
    const existing = await Alert.findById(req.params.id);
    if (existing) return res.json({ success: true, already: true });
    res.status(404).json({ success: false, message: 'Alert not found' });
  } catch (err) { fail(res, err); }
});

// TEST ONLY: creates a fake alert. Disabled unless ALERT_TEST_ENABLED=true. Uses the device key, so no login needed.
router.post('/test', deviceAuth, async (req, res) => {
  try {
    if (process.env.ALERT_TEST_ENABLED !== 'true') {
      return res.status(403).json({ success: false, message: 'Test alerts are disabled' });
    }
    const alert = await raiseAlert({
      title: (req.body && req.body.title) || 'Test alert',
      category: (req.body && req.body.category) || 'test',
      location: (req.body && req.body.location) || 'Test location',
      severity: 'test',
      source: 'test'
    });
    res.status(201).json({ success: true, alert });
  } catch (err) { fail(res, err); }
});

// ---------- Mayor's office endpoints (JWT, role cm_admin) ----------

// Recent alerts with latency figures (use these numbers in the paper).
router.get('/', protect, authorize('cm_admin'), async (req, res) => {
  try {
    const alerts = await Alert.find().sort({ createdAt: -1 }).limit(100);
    const rows = alerts.map((a) => ({
      id: a._id,
      complaintNumber: a.complaintNumber,
      title: a.title,
      severity: a.severity,
      source: a.source,
      status: a.status,
      createdAt: a.createdAt,
      deliveredAt: a.deliveredAt,
      acknowledgedAt: a.acknowledgedAt,
      acknowledgedBy: a.acknowledgedBy,
      deliveryLatencyMs: a.deliveredAt ? a.deliveredAt - a.createdAt : null,
      ackLatencyMs: a.acknowledgedAt && a.deliveredAt ? a.acknowledgedAt - a.deliveredAt : null
    }));
    res.json({ success: true, alerts: rows });
  } catch (err) { fail(res, err); }
});

router.get('/device-status', protect, authorize('cm_admin'), async (req, res) => {
  try {
    const devices = await DeviceStatus.find().sort({ deviceId: 1 });
    res.json({
      success: true,
      devices: devices.map((d) => ({
        deviceId: d.deviceId,
        lastSeen: d.lastSeen,
        rssi: d.rssi,
        ip: d.ip,
        polls: d.polls,
        online: !!d.lastSeen && Date.now() - d.lastSeen.getTime() < ONLINE_MS
      }))
    });
  } catch (err) { fail(res, err); }
});

// Manually raise an alert for an existing complaint (also useful in real use as an "escalate" button).
router.post('/trigger/:complaintId', protect, authorize('cm_admin'), async (req, res) => {
  try {
    if (!isId(req.params.complaintId)) return res.status(400).json({ success: false, message: 'Invalid complaint id' });
    const complaint = await Complaint.findById(req.params.complaintId);
    if (!complaint) return res.status(404).json({ success: false, message: 'Complaint not found' });
    const alert = await raiseAlert({ complaint, severity: 'critical', source: 'manual' });
    res.status(201).json({ success: true, alert });
  } catch (err) { fail(res, err); }
});

// Acknowledge from the web (for example when the device is offline).
router.post('/:id/ack-web', protect, authorize('cm_admin'), async (req, res) => {
  try {
    if (!isId(req.params.id)) return res.status(400).json({ success: false, message: 'Invalid alert id' });
    const alert = await Alert.findOneAndUpdate(
      { _id: req.params.id, status: { $ne: 'acknowledged' } },
      { $set: { status: 'acknowledged', acknowledgedAt: new Date(), acknowledgedBy: 'dashboard' } },
      { new: true }
    );
    if (!alert) return res.status(404).json({ success: false, message: 'Alert not found or already acknowledged' });
    res.json({ success: true });
  } catch (err) { fail(res, err); }
});

module.exports = router;

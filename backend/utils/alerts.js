const Alert = require('../models/Alert');

// Creates an alert (one active alert per complaint at a time).
const raiseAlert = async ({ complaint = null, title, category, location, severity = 'critical', source = 'auto' }) => {
  if (complaint) {
    const existing = await Alert.findOne({ complaintId: complaint._id, status: { $ne: 'acknowledged' } });
    if (existing) return existing;
  }
  return Alert.create({
    complaintId: complaint ? complaint._id : null,
    complaintNumber: complaint ? complaint.complaintNumber : '',
    title: String(title || (complaint && complaint.title) || 'Alert').slice(0, 100),
    category: String(category || (complaint && complaint.category) || '').slice(0, 30),
    location: String(location || (complaint && complaint.location && complaint.location.address) || '').slice(0, 80),
    severity,
    source
  });
};

// Called from createComplaint. STAND-IN rule until the real 'critical' rubric exists:
// only when ALERT_AUTO_ON_HIGH=true, priority is high, the complaint was routed normally (not held for review)
// and the fraud screen said genuine. Never throws, so it can never break complaint submission.
const maybeRaiseAlertForComplaint = async ({ complaint, ai, fraudResult, needsReview }) => {
  try {
    if (process.env.ALERT_AUTO_ON_HIGH !== 'true') return null;
    if (!ai || ai.priority !== 'high' || needsReview) return null;
    if (!fraudResult || fraudResult.label !== 'genuine') return null;
    return await raiseAlert({ complaint, severity: 'high', source: 'auto' });
  } catch (err) {
    console.log('Alert raise failed:', err.message);
    return null;
  }
};

module.exports = { raiseAlert, maybeRaiseAlertForComplaint };

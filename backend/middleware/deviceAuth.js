const crypto = require('crypto');

// The ESP32 sends its secret in the x-device-key header.
const deviceAuth = (req, res, next) => {
  const expected = process.env.DEVICE_API_KEY;
  if (!expected) {
    return res.status(503).json({ success: false, message: 'Device key is not configured on the server' });
  }
  const given = String(req.get('x-device-key') || '');
  const a = Buffer.from(given);
  const b = Buffer.from(expected);
  if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) {
    return res.status(401).json({ success: false, message: 'Invalid device key' });
  }
  next();
};

module.exports = deviceAuth;

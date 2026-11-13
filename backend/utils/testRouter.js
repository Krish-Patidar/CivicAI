require('dotenv').config();
const mongoose = require('mongoose');
const { routeComplaint } = require('../services/aiRouter');

(async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    const out = await routeComplaint({
      title: 'Street Light at Scheme no 78',
      description: 'Street light is not working in the entire hub area. Please solve this asap.',
      imagePath: null
    });
    console.log('OK:', out);
  } catch (e) {
    console.error('ROUTER ERROR:', e.message);
  }
  process.exit(0);
})();

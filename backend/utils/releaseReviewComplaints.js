require('dotenv').config();
const mongoose = require('mongoose');
const Complaint = require('../models/Complaint');
const Department = require('../models/Department');

const STATUS_COUNTER = { pending: 'pending', in_progress: 'inProgress', completed: 'resolved' };

(async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    const list = await Complaint.find({ needsReview: true, departmentId: { $ne: null } });

    for (const c of list) {
      const counter = STATUS_COUNTER[c.status];
      const dec = { totalComplaints: -1 };
      const filter = { _id: c.departmentId, totalComplaints: { $gt: 0 } };
      if (counter) { dec[counter] = -1; filter[counter] = { $gt: 0 }; }
      await Department.updateOne(filter, { $inc: dec });

      c.suggestedDepartmentId = c.departmentId;
      c.departmentId = null;
      c.assignedTo = null;
      await c.save();
    }
    console.log(`Released ${list.length} complaint(s) from departments`);
  } catch (e) {
    console.error(e);
  }
  process.exit(0);
})();

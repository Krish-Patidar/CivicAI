require('dotenv').config({
  path: require('path').resolve(__dirname, '../.env')
});
const mongoose = require('mongoose');
const Complaint = require('../models/Complaint');
const Department = require('../models/Department');

(async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    const depts = await Department.find();

    for (const d of depts) {
      const [total, pending, inProgress, resolved] = await Promise.all([
        Complaint.countDocuments({ departmentId: d._id }),
        Complaint.countDocuments({ departmentId: d._id, status: 'pending' }),
        Complaint.countDocuments({ departmentId: d._id, status: 'in_progress' }),
        Complaint.countDocuments({ departmentId: d._id, status: 'completed' })
      ]);
      await Department.updateOne(
        { _id: d._id },
        { $set: { totalComplaints: total, pending, inProgress, resolved } }
      );
      console.log(`${d.code}: total ${total}, pending ${pending}, in progress ${inProgress}, resolved ${resolved}`);
    }
  } catch (e) {
    console.error(e);
  }
  process.exit(0);
})();

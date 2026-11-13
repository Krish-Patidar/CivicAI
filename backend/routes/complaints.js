const express = require('express');
const router = express.Router();
const {
  createComplaint, getComplaints, getComplaint,
  updateComplaint, getCitizenStats
} = require('../controllers/complaintController');
const { protect, authorize } = require('../middleware/auth');
const upload = require('../middleware/upload');

router.use(protect);

router.get('/stats', getCitizenStats);
router.route('/')
  .get(getComplaints)
  .post(upload.single('image'), createComplaint);

router.route('/:id')
  .get(getComplaint)
  .put(upload.single('proofImage'), updateComplaint);

module.exports = router;
 

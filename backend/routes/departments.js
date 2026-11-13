const express = require('express');
const router = express.Router();
const {
  getAllDepartments, getDepartment, createDepartment,
  updateDepartment, getDepartmentWorkers, getDepartmentAnalytics
} = require('../controllers/departmentController');
const { protect, authorize } = require('../middleware/auth');

router.use(protect);

router.get('/', getAllDepartments);
router.post('/', authorize('cm_admin'), createDepartment);
router.get('/:id', getDepartment);
router.put('/:id', authorize('cm_admin', 'department_admin'), updateDepartment);
router.get('/:id/workers', getDepartmentWorkers);
router.get('/:id/analytics', getDepartmentAnalytics);

module.exports = router;


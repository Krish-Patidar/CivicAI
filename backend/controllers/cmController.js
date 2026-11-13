const Complaint = require('../models/Complaint');
const Department = require('../models/Department');
const User = require('../models/User');
const ExcelJS = require('exceljs');
const { ChartJSNodeCanvas } = require('chartjs-node-canvas');

exports.getDashboardStats = async (req, res) => {
  try {
    const [
      totalComplaints,
      pendingComplaints,
      reviewComplaints,
      inProgressComplaints,
      completedComplaints,
      rejectedComplaints,
      totalCitizens,
      totalDepartments,
      fraudComplaints,
      suspiciousUsersIds
    ] = await Promise.all([
      Complaint.countDocuments(),
      Complaint.countDocuments({ status: 'pending', needsReview: { $ne: true } }),
      Complaint.countDocuments({ needsReview: true }),
      Complaint.countDocuments({ status: 'in_progress' }),
      Complaint.countDocuments({ status: 'completed' }),
      Complaint.countDocuments({ status: 'rejected' }),
      User.countDocuments({ role: 'citizen' }),
      Department.countDocuments({ isActive: true }),
      Complaint.countDocuments({ isFraud: true }),
      Complaint.distinct('citizenId', { isFraud: true })
    ]);

    const totalExpense = await Complaint.aggregate([
      { $group: { _id: null, total: { $sum: '$expense' } } }
    ]);

    const completed = await Complaint.find({ status: 'completed', resolutionTime: { $exists: true, $ne: null } });
    const avgResolution = completed.length > 0
      ? completed.reduce((sum, c) => sum + c.resolutionTime, 0) / completed.length
      : 0;

    res.json({
      success: true,
      stats: {
        totalComplaints,
        pendingComplaints,
        reviewComplaints,
        inProgressComplaints,
        completedComplaints,
        rejectedComplaints,
        totalCitizens,
        totalDepartments,
        fraudComplaints,
        suspiciousUsers: suspiciousUsersIds.length,
        totalExpense: totalExpense[0]?.total || 0,
        avgResolutionHours: Math.round(avgResolution),
        resolutionRate: totalComplaints > 0 ? Math.round(completedComplaints / totalComplaints * 100) : 0,
        fraudRate: totalComplaints > 0 ? Math.round(fraudComplaints / totalComplaints * 100) : 0
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.getDepartmentPerformance = async (req, res) => {
  try {
    const departments = await Department.find({ isActive: true });
    const performance = await Promise.all(departments.map(async (dept) => {
      const complaints = await Complaint.find({ departmentId: dept._id });
      const completed = complaints.filter(c => c.status === 'completed');
      const avgTime = completed.length > 0
        ? completed.reduce((sum, c) => sum + (c.resolutionTime || 0), 0) / completed.length
        : 0;
      return {
        id: dept._id,
        name: dept.name,
        code: dept.code,
        total: complaints.length,
        resolved: completed.length,
        pending: complaints.filter(c => c.status === 'pending').length,
        inProgress: complaints.filter(c => c.status === 'in_progress').length,
        resolutionRate: complaints.length > 0 ? Math.round(completed.length / complaints.length * 100) : 0,
        avgResolutionHours: Math.round(avgTime),
        totalExpense: complaints.reduce((sum, c) => sum + (c.expense || 0), 0)
      };
    }));
    res.json({ success: true, performance });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.getCategoryDistribution = async (req, res) => {
  try {
    const data = await Complaint.aggregate([
      { $group: { _id: '$category', count: { $sum: 1 } } },
      { $sort: { count: -1 } }
    ]);
    res.json({ success: true, distribution: data });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.getMonthlyTrends = async (req, res) => {
  try {
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

    const trends = await Complaint.aggregate([
      { $match: { createdAt: { $gte: sixMonthsAgo } } },
      {
        $group: {
          _id: { year: { $year: '$createdAt' }, month: { $month: '$createdAt' } },
          total: { $sum: 1 },
          resolved: { $sum: { $cond: [{ $eq: ['$status', 'completed'] }, 1, 0] } }
        }
      },
      { $sort: { '_id.year': 1, '_id.month': 1 } }
    ]);
    res.json({ success: true, trends });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.getAllComplaints = async (req, res) => {
  try {
    const { page = 1, limit = 20, status, category, departmentId, needsReview } = req.query;
    const filter = {};
    if (needsReview === 'true') filter.needsReview = true;
    if (status) filter.status = status;
    if (category) filter.category = category;
    if (departmentId) filter.departmentId = departmentId;

    const total = await Complaint.countDocuments(filter);
    const complaints = await Complaint.find(filter)
      .populate('citizenId', 'name email')
      .populate('departmentId', 'name')
      .populate('assignedTo', 'name')
      .sort({ createdAt: -1 })
      .skip((parseInt(page) - 1) * parseInt(limit))
      .limit(parseInt(limit));

    res.json({ success: true, complaints, pagination: { total, page: parseInt(page), pages: Math.ceil(total / parseInt(limit)) } });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.getExpenseReport = async (req, res) => {
  try {
    const report = await Complaint.aggregate([
      { $match: { expense: { $gt: 0 } } },
      {
        $group: {
          _id: '$departmentId',
          totalExpense: { $sum: '$expense' },
          count: { $sum: 1 }
        }
      },
      {
        $lookup: {
          from: 'departments',
          localField: '_id',
          foreignField: '_id',
          as: 'department'
        }
      },
      { $unwind: { path: '$department', preserveNullAndEmptyArrays: true } }
    ]);
    res.json({ success: true, report });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
exports.exportExcelReport = async (req, res) => {
  try {
    const [
      totalComplaints,
      pendingComplaints,
      inProgressComplaints,
      completedComplaints,
      totalCitizens,
      totalDepartments,
      complaints,
      departments,
      categoryDistribution,
      monthlyTrends
    ] = await Promise.all([
      Complaint.countDocuments(),
            Complaint.countDocuments({ status: 'pending', needsReview: { $ne: true } }),
      Complaint.countDocuments({ status: 'in_progress' }),
      Complaint.countDocuments({ status: 'completed' }),
      User.countDocuments({ role: 'citizen' }),
      Department.countDocuments({ isActive: true }),
      Complaint.find({}).populate('suggestedDepartmentId', 'name')
        .populate('citizenId', 'name email')
        .populate('departmentId', 'name code')
        .populate('assignedTo', 'name email')
        .sort({ createdAt: -1 }),
      Department.find({ isActive: true }),
      Complaint.aggregate([
        { $group: { _id: '$category', count: { $sum: 1 } } },
        { $sort: { count: -1 } }
      ]),
      (() => {
        const sixMonthsAgo = new Date();
        sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
        return Complaint.aggregate([
          { $match: { createdAt: { $gte: sixMonthsAgo } } },
          {
            $group: {
              _id: {
                year: { $year: '$createdAt' },
                month: { $month: '$createdAt' }
              },
              total: { $sum: 1 },
              resolved: {
                $sum: {
                  $cond: [{ $eq: ['$status', 'completed'] }, 1, 0]
                }
              }
            }
          },
          { $sort: { '_id.year': 1, '_id.month': 1 } }
        ]);
      })()
    ]);

    const totalExpenseAgg = await Complaint.aggregate([
      { $group: { _id: null, total: { $sum: '$expense' } } }
    ]);
    const totalExpense = totalExpenseAgg[0]?.total || 0;

    const completed = complaints.filter(
      (c) => c.status === 'completed' && c.resolutionTime !== null && c.resolutionTime !== undefined
    );

    const avgResolutionHours =
      completed.length > 0
        ? Math.round(
            completed.reduce((sum, c) => sum + (c.resolutionTime || 0), 0) / completed.length
          )
        : 0;

    const resolutionRate =
      totalComplaints > 0
        ? Math.round((completedComplaints / totalComplaints) * 100)
        : 0;

    const reviewComplaints = complaints.filter((c) => c.needsReview).length;
    const rejectedComplaints = complaints.filter((c) => c.status === 'rejected').length;

    const departmentPerformance = await Promise.all(
      departments.map(async (dept) => {
        const deptComplaints = complaints.filter(
          (c) => c.departmentId && String(c.departmentId._id) === String(dept._id)
        );
        const deptCompleted = deptComplaints.filter((c) => c.status === 'completed');
        const avgTime =
          deptCompleted.length > 0
            ? Math.round(
                deptCompleted.reduce((sum, c) => sum + (c.resolutionTime || 0), 0) /
                  deptCompleted.length
              )
            : 0;

        return {
          name: dept.name,
          code: dept.code,
          total: deptComplaints.length,
          resolved: deptCompleted.length,
          pending: deptComplaints.filter((c) => c.status === 'pending').length,
          inProgress: deptComplaints.filter((c) => c.status === 'in_progress').length,
          resolutionRate:
            deptComplaints.length > 0
              ? Math.round((deptCompleted.length / deptComplaints.length) * 100)
              : 0,
          avgResolutionHours: avgTime,
          totalExpense: deptComplaints.reduce((sum, c) => sum + (c.expense || 0), 0)
        };
      })
    );

    const workbook = new ExcelJS.Workbook();
    workbook.creator = 'NagarSeva';
    workbook.created = new Date();

    // ================= Summary =================
    const summarySheet = workbook.addWorksheet('Summary');
    summarySheet.columns = [
      { header: 'Metric', key: 'metric', width: 30 },
      { header: 'Value', key: 'value', width: 20 }
    ];

    summarySheet.addRows([
      { metric: 'Total Complaints', value: totalComplaints },
      { metric: 'Resolved Complaints', value: completedComplaints },
      { metric: 'Pending Complaints', value: pendingComplaints },
      { metric: 'In Progress Complaints', value: inProgressComplaints },
      { metric: 'Under Review Complaints', value: reviewComplaints },
      { metric: 'Rejected Complaints', value: rejectedComplaints },
      { metric: 'Total Citizens', value: totalCitizens },
      { metric: 'Total Departments', value: totalDepartments },
      { metric: 'Total Expense', value: totalExpense },
      { metric: 'Average Resolution Hours', value: avgResolutionHours },
      { metric: 'Resolution Rate (%)', value: resolutionRate }
    ]);

    // ================= All Complaints =================
    const complaintsSheet = workbook.addWorksheet('All Complaints');
    complaintsSheet.columns = [
      { header: 'Complaint No', key: 'complaintNumber', width: 18 },
      { header: 'Title', key: 'title', width: 35 },
      { header: 'Description', key: 'description', width: 45 },
      { header: 'Category', key: 'category', width: 15 },
      { header: 'Priority', key: 'priority', width: 12 },
      { header: 'Status', key: 'status', width: 15 },
      { header: 'Department', key: 'department', width: 22 },
      { header: 'Citizen Name', key: 'citizenName', width: 22 },
      { header: 'Citizen Email', key: 'citizenEmail', width: 28 },
      { header: 'Assigned Worker', key: 'assignedWorker', width: 22 },
      { header: 'Address', key: 'address', width: 35 },
      { header: 'Latitude', key: 'lat', width: 12 },
      { header: 'Longitude', key: 'lng', width: 12 },
      { header: 'Expense', key: 'expense', width: 12 },
      { header: 'Completed At', key: 'completedAt', width: 22 },
      { header: 'Resolution Time (hrs)', key: 'resolutionTime', width: 20 },
      { header: 'Created At (ISO)', key: 'createdAtIso', width: 26 },
      { header: 'AI Category', key: 'aiCategory', width: 16 },
      { header: 'AI Confidence', key: 'aiConfidence', width: 14 },
      { header: 'AI Reason', key: 'aiReason', width: 45 },
      { header: 'Routing Source', key: 'routingSource', width: 16 },
      { header: 'Suggested Department', key: 'suggestedDepartment', width: 24 },
      { header: 'Needs Review', key: 'needsReview', width: 14 },
      { header: 'Reviewed At (ISO)', key: 'reviewedAtIso', width: 26 },
      { header: 'Rejection Reason', key: 'rejectionReason', width: 30 },
      { header: 'Fraud Flag', key: 'isFraud', width: 12 },
      { header: 'Fraud Score', key: 'fraudScore', width: 12 },
      { header: 'Fraud Reason', key: 'fraudReason', width: 35 },
      { header: 'Admin Notes', key: 'adminNotes', width: 45 },
      { header: 'Credit Awarded', key: 'creditAwarded', width: 14 },
      { header: 'Has Image', key: 'hasImage', width: 12 }
    ];

    complaints.forEach((c) => {
      complaintsSheet.addRow({
        complaintNumber: c.complaintNumber || '',
        title: c.title || '',
        description: c.description || '',
        category: c.category || '',
        priority: c.priority || '',
        status: c.status || '',
        department: c.departmentId?.name || '',
        citizenName: c.citizenId?.name || '',
        citizenEmail: c.citizenId?.email || '',
        assignedWorker: c.assignedTo?.name || '',
        address: c.location?.address || '',
        lat: c.location?.lat ?? '',
        lng: c.location?.lng ?? '',
        expense: c.expense || 0,
        completedAt: c.completedAt ? new Date(c.completedAt).toLocaleString() : '',
        resolutionTime: c.resolutionTime ?? '',
        createdAtIso: c.createdAt ? new Date(c.createdAt).toISOString() : '',
        aiCategory: c.aiCategory || '',
        aiConfidence: c.aiConfidence ?? '',
        aiReason: c.aiReason || '',
        routingSource: c.routingSource || '',
        suggestedDepartment: c.suggestedDepartmentId?.name || '',
        needsReview: c.needsReview ? 'Yes' : 'No',
        reviewedAtIso: c.reviewedAt ? new Date(c.reviewedAt).toISOString() : '',
        rejectionReason: c.rejectionReason || '',
        isFraud: c.isFraud ? 'Yes' : 'No',
        fraudScore: c.fraudScore ?? '',
        fraudReason: c.fraudReason || '',
        adminNotes: c.adminNotes || '',
        creditAwarded: c.creditAwarded ? 'Yes' : 'No',
        hasImage: c.image ? 'Yes' : 'No'
      });
    });

    // ================= Department Performance =================
    const deptSheet = workbook.addWorksheet('Department Performance');
    deptSheet.columns = [
      { header: 'Department', key: 'name', width: 28 },
      { header: 'Code', key: 'code', width: 12 },
      { header: 'Total', key: 'total', width: 12 },
      { header: 'Resolved', key: 'resolved', width: 12 },
      { header: 'Pending', key: 'pending', width: 12 },
      { header: 'In Progress', key: 'inProgress', width: 14 },
      { header: 'Resolution Rate (%)', key: 'resolutionRate', width: 18 },
      { header: 'Avg Resolution Hours', key: 'avgResolutionHours', width: 20 },
      { header: 'Total Expense', key: 'totalExpense', width: 16 }
    ];
    deptSheet.addRows(departmentPerformance);

    // ================= Category Distribution =================
    const categorySheet = workbook.addWorksheet('Category Distribution');
    categorySheet.columns = [
      { header: 'Category', key: 'category', width: 20 },
      { header: 'Count', key: 'count', width: 12 }
    ];
    categoryDistribution.forEach((item) => {
      categorySheet.addRow({
        category: item._id || 'Unknown',
        count: item.count || 0
      });
    });

    // ================= Monthly Trends =================
    const trendsSheet = workbook.addWorksheet('Monthly Trends');
    trendsSheet.columns = [
      { header: 'Month', key: 'month', width: 16 },
      { header: 'Total Complaints', key: 'total', width: 18 },
      { header: 'Resolved Complaints', key: 'resolved', width: 20 }
    ];
    monthlyTrends.forEach((item) => {
      trendsSheet.addRow({
        month: `${item._id.month}/${item._id.year}`,
        total: item.total || 0,
        resolved: item.resolved || 0
      });
    });

    // ================= Map Coordinates =================
    const coordinatesSheet = workbook.addWorksheet('Complaint Map Coordinates');
    coordinatesSheet.columns = [
      { header: 'Complaint No', key: 'complaintNumber', width: 18 },
      { header: 'Title', key: 'title', width: 35 },
      { header: 'Status', key: 'status', width: 15 },
      { header: 'Category', key: 'category', width: 15 },
      { header: 'Priority', key: 'priority', width: 12 },
      { header: 'Department', key: 'department', width: 22 },
      { header: 'Address', key: 'address', width: 35 },
      { header: 'Latitude', key: 'lat', width: 15 },
      { header: 'Longitude', key: 'lng', width: 15 }
    ];

    complaints.forEach((c) => {
      coordinatesSheet.addRow({
        complaintNumber: c.complaintNumber || '',
        title: c.title || '',
        status: c.status || '',
        category: c.category || '',
        priority: c.priority || '',
        department: c.departmentId?.name || '',
        address: c.location?.address || '',
        lat: c.location?.lat ?? '',
        lng: c.location?.lng ?? ''
      });
    });

    // ================= Charts Sheet =================
    const chartsSheet = workbook.addWorksheet('Charts');

    const chartJSNodeCanvas = new ChartJSNodeCanvas({
      width: 1000,
      height: 500,
      backgroundColour: 'white'
    });

    // Chart 1: Category Distribution
    const categoryLabels = categoryDistribution.map((x) => x._id || 'Unknown');
    const categoryCounts = categoryDistribution.map((x) => x.count || 0);

    const categoryChartBuffer = await chartJSNodeCanvas.renderToBuffer({
      type: 'bar',
      data: {
        labels: categoryLabels,
        datasets: [
          {
            label: 'Complaints by Category',
            data: categoryCounts,
            backgroundColor: ['#6366f1', '#f59e0b', '#10b981', '#ef4444', '#3b82f6', '#8b5cf6']
          }
        ]
      },
      options: {
        responsive: false,
        plugins: {
          title: {
            display: true,
            text: 'Category Distribution'
          },
          legend: {
            display: false
          }
        }
      }
    });

    const categoryChartId = workbook.addImage({
      buffer: categoryChartBuffer,
      extension: 'png'
    });

    chartsSheet.addImage(categoryChartId, {
      tl: { col: 0, row: 0 },
      ext: { width: 800, height: 350 }
    });

    // Chart 2: Monthly Trends
    const trendLabels = monthlyTrends.map((x) => `${x._id.month}/${x._id.year}`);
    const trendTotal = monthlyTrends.map((x) => x.total || 0);
    const trendResolved = monthlyTrends.map((x) => x.resolved || 0);

    const trendsChartBuffer = await chartJSNodeCanvas.renderToBuffer({
      type: 'line',
      data: {
        labels: trendLabels,
        datasets: [
          {
            label: 'Total',
            data: trendTotal,
            borderColor: '#6366f1',
            backgroundColor: '#6366f1',
            tension: 0.3
          },
          {
            label: 'Resolved',
            data: trendResolved,
            borderColor: '#10b981',
            backgroundColor: '#10b981',
            tension: 0.3
          }
        ]
      },
      options: {
        responsive: false,
        plugins: {
          title: {
            display: true,
            text: 'Monthly Complaint Trends'
          }
        }
      }
    });

    const trendsChartId = workbook.addImage({
      buffer: trendsChartBuffer,
      extension: 'png'
    });

    chartsSheet.addImage(trendsChartId, {
      tl: { col: 0, row: 20 },
      ext: { width: 800, height: 350 }
    });

    // Header styling
    workbook.eachSheet((sheet) => {
      const row = sheet.getRow(1);
      row.font = { bold: true, color: { argb: '1F2937' } };
      row.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'DDEBF7' }
      };
      row.alignment = { vertical: 'middle', horizontal: 'center' };
    });

    const fileName = `CM_Dashboard_Report_${new Date().toISOString().slice(0, 10)}.xlsx`;

    res.setHeader(
      'Content-Type',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    );
    res.setHeader('Content-Disposition', `attachment; filename=${fileName}`);

    await workbook.xlsx.write(res);
    res.end();
  } catch (error) {
    console.error('Export Excel error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// ===================== NEEDS REVIEW =====================

exports.getReviewComplaints = async (req, res) => {
  try {
    const [total, complaints] = await Promise.all([
      Complaint.countDocuments({ needsReview: true }),
      Complaint.find({ needsReview: true })
        .populate('citizenId', 'name email phone')
        .populate('departmentId', 'name code')
        .populate('suggestedDepartmentId', 'name code')
        .sort({ createdAt: -1 })
        .limit(100)
    ]);
    res.json({ success: true, total, complaints });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Which Department counter matches a complaint status
const STATUS_COUNTER = { pending: 'pending', in_progress: 'inProgress', completed: 'resolved' };

// Take a complaint out of its department's numbers (never below zero)
const releaseFromDepartment = async (complaint) => {
  if (!complaint.departmentId) return;
  const counter = STATUS_COUNTER[complaint.status];
  const dec = { totalComplaints: -1 };
  const filter = { _id: complaint.departmentId, totalComplaints: { $gt: 0 } };
  if (counter) { dec[counter] = -1; filter[counter] = { $gt: 0 }; }
  await Department.updateOne(filter, { $inc: dec });
};

// CM admin approves the suggestion or diverts to another department
exports.reassignComplaint = async (req, res) => {
  try {
    const { departmentId } = req.body;
    if (!departmentId) {
      return res.status(400).json({ success: false, message: 'departmentId is required' });
    }

    const [complaint, newDept] = await Promise.all([
      Complaint.findById(req.params.id),
      Department.findOne({ _id: departmentId, isActive: true })
    ]);
    if (!complaint) return res.status(404).json({ success: false, message: 'Complaint not found' });
    if (!newDept) return res.status(404).json({ success: false, message: 'Department not found' });
    if (complaint.status === 'rejected') {
      return res.status(400).json({ success: false, message: 'This complaint was already rejected' });
    }

    const sameDept = complaint.departmentId && String(complaint.departmentId) === String(newDept._id);

    if (!sameDept) {
      await releaseFromDepartment(complaint); // only matters for complaints that were already assigned
      const counter = STATUS_COUNTER[complaint.status];
      const inc = { totalComplaints: 1 };
      if (counter) inc[counter] = 1;
      await Department.updateOne({ _id: newDept._id }, { $inc: inc });

      complaint.departmentId = newDept._id;
      complaint.assignedTo = null;

      if (newDept.categories && newDept.categories.length && !newDept.categories.includes(complaint.category)) {
        complaint.category = newDept.categories[0];
      }
    }

    complaint.needsReview = false;
    complaint.routingSource = 'admin';
    complaint.reviewedAt = new Date();
    const note = `Approved by the Mayor's office and routed to ${newDept.name}`;
    complaint.adminNotes = complaint.adminNotes ? `${complaint.adminNotes} | ${note}` : note;

    await complaint.save();

    const updated = await Complaint.findById(complaint._id)
      .populate('citizenId', 'name email')
      .populate('departmentId', 'name code');

    res.json({ success: true, complaint: updated, message: 'Complaint routed successfully' });
  } catch (error) {
    console.error('Reassign complaint error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// CM admin rejects a complaint after review
exports.rejectComplaint = async (req, res) => {
  try {
    const reason = String(req.body.reason || '').trim().slice(0, 300) || "Rejected after review by the Mayor's office";

    const complaint = await Complaint.findById(req.params.id);
    if (!complaint) return res.status(404).json({ success: false, message: 'Complaint not found' });
    if (complaint.status === 'completed') {
      return res.status(400).json({ success: false, message: 'A completed complaint cannot be rejected' });
    }

    await releaseFromDepartment(complaint); // no-op when it was never assigned
    complaint.departmentId = null;
    complaint.assignedTo = null;

    complaint.status = 'rejected';
    complaint.needsReview = false;
    complaint.routingSource = 'admin';
    complaint.rejectionReason = reason;
    complaint.reviewedAt = new Date();
    const note = `Rejected by the Mayor's office: ${reason}`;
    complaint.adminNotes = complaint.adminNotes ? `${complaint.adminNotes} | ${note}` : note;

    await complaint.save();

    res.json({ success: true, complaint, message: 'Complaint rejected' });
  } catch (error) {
    console.error('Reject complaint error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

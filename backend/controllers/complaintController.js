const Complaint = require('../models/Complaint');
const Department = require('../models/Department');
const User = require('../models/User');
const axios = require('axios');
const { sendComplaintSubmittedEmail, sendComplaintCompletedEmail } = require('../utils/email');
const { routeComplaint } = require('../services/aiRouter');
const { uploadLocalFile, removeLocalFile } = require('../utils/cloudinary');
const { maybeRaiseAlertForComplaint } = require('../utils/alerts');

const crypto = require('crypto');
const fs = require('fs');

// SHA-256 fingerprint of the uploaded photo (same file => same hash)
const hashUpload = (file) => {
  try {
    const data = file.buffer || fs.readFileSync(file.path);
    return crypto.createHash('sha256').update(data).digest('hex');
  } catch (e) {
    return null;
  }
};

// Backup classifier: your Python service (used only if the Gemini router fails)
const classifyWithAI = async (text) => {
  try {
    const response = await axios.post(`${process.env.AI_SERVICE_URL}/predict`, {
      text
    }, { timeout: 5000 });
    return response.data;
  } catch (error) {
    console.log('AI service unavailable, using keyword fallback classification');
    return fallbackClassify(text);
  }
};

// Helper to call AI Fraud Detection
const checkFraud = async (description, userId, location, imageUrl) => {
  try {
    const response = await axios.post(`${process.env.AI_SERVICE_URL}/fraud-check`, {
      description,
      userId: userId.toString(),
      location,
      imageUrl
    }, { timeout: 5000 });
    return response.data;
  } catch (error) {
    console.log('Fraud detection service unavailable:', error.message);
    return { label: 'genuine', confidence: 0, reason: 'Service unavailable' };
  }
};

const fallbackClassify = (text) => {
  const lower = text.toLowerCase();
  const rules = {
    electricity: { phrases: ['street light', 'streetlight', 'street lamp', 'lamp post', 'light pole', 'power cut', 'electric pole'],
                   words: ['electricity', 'electric', 'power', 'wire', 'outage', 'pole', 'light', 'lamp', 'bulb', 'transformer'] },
    road:        { phrases: ['speed breaker'], words: ['road', 'pothole', 'highway', 'bridge', 'footpath', 'pavement'] },
    garbage:     { phrases: [], words: ['garbage', 'waste', 'trash', 'dump', 'litter', 'dirty'] },
    water:       { phrases: ['water supply'], words: ['water', 'pipe', 'pipeline', 'leakage', 'leak', 'flood', 'drain', 'tap', 'sewage'] },
    sanitation:  { phrases: [], words: ['toilet', 'sanitation', 'hygiene', 'bathroom', 'latrine'] },
    public_safety: { phrases: [], words: ['crime', 'safety', 'accident', 'illegal', 'encroachment', 'theft'] },
    parks:       { phrases: [], words: ['park', 'garden', 'tree', 'playground', 'greenery', 'bench'] }
  };
  const has = (t) => new RegExp(`\\b${t}s?\\b`).test(lower);

  let best = { category: 'other', score: 0 };
  for (const [category, { phrases, words }] of Object.entries(rules)) {
    let score = 0;
    phrases.forEach(p => { if (has(p)) score += 3; });
    words.forEach(w => { if (has(w)) score += 1; });
    if (score > best.score) best = { category, score };
  }

  const priority = /\b(urgent|asap|emergency|danger|dangerous|immediately|accident)\b/.test(lower) ? 'high'
    : /\b(minor|small)\b/.test(lower) ? 'low' : 'medium';

  return { category: best.category, priority };
};


// @desc Create complaint
exports.createComplaint = async (req, res) => {
  try {
    const { title, description, lat, lng, address } = req.body;
    const image = req.file ? `/uploads/${req.file.filename}` : null;
    const imageHash = req.file ? hashUpload(req.file) : null;

    // 1. AI routing (title + description + image), with older classifiers as backup
    let ai;
    try {
      ai = await routeComplaint({ title, description, imagePath: req.file ? req.file.path : null });
    } catch (err) {
      console.log('LLM routing failed, using backup classifier:', err.message);
      const old = await classifyWithAI(`${title}. ${description}`);
      ai = {
        category: old.category, priority: old.priority, departmentCode: null,
        confidence: 0, imageMatchesText: true, reason: 'AI router unavailable', source: 'fallback'
      };
    }
    console.log('Routing result:', { category: ai.category, dept: ai.departmentCode, confidence: ai.confidence, imageMatchesText: ai.imageMatchesText, source: ai.source });

    // 2. Fraud detection (unchanged)
    const fraudResult = await checkFraud(description, req.user._id, { lat: parseFloat(lat) || 0, lng: parseFloat(lng) || 0, address }, imageHash);

    // 3. Which department would this go to?
    let suggested = null;
    if (ai.departmentCode) {
      suggested = await Department.findOne({ code: ai.departmentCode, isActive: true });
    }
    if (!suggested) {
      suggested = await Department.findOne({ categories: { $in: [ai.category] }, isActive: true });
    }

    const isFraudulent = fraudResult.label === 'fraud';
    const imageMismatch = ai.imageMatchesText === false;
    const needsReview = ai.source === 'fallback' || ai.confidence < 0.75 || imageMismatch || !suggested;

    // Under review: NOT given to any department until the CM office decides
    const department = needsReview ? null : suggested;

    const notes = [];
    if (fraudResult.label !== 'genuine') notes.push(`AI Flag (${fraudResult.label}): ${fraudResult.reason}`);
    if (imageMismatch) notes.push('AI Flag: image may not match the complaint text');

        // Move the photo to Cloudinary. The local file was already used above for AI routing and hashing.
    let imageUrl = image;
    if (req.file) {
      const cloudUrl = await uploadLocalFile(req.file.path);
      if (cloudUrl) {
        imageUrl = cloudUrl;
        removeLocalFile(req.file.path);
      }
    }

    const complaint = await Complaint.create({
      title,
      description,
      image: imageUrl,
      location: { lat: parseFloat(lat) || 0, lng: parseFloat(lng) || 0, address },
      category: ai.category,
      priority: ai.priority,
      citizenId: req.user._id,
      departmentId: department ? department._id : null,
      suggestedDepartmentId: suggested ? suggested._id : null,
      aiClassified: ai.source === 'ai',
      aiCategory: ai.category,
      aiConfidence: ai.confidence,
      aiReason: ai.reason,
      routingSource: ai.source,
      needsReview,
      isFraud: isFraudulent || fraudResult.label === 'suspicious',
      fraudScore: fraudResult.confidence,
      fraudReason: fraudResult.reason,
      adminNotes: notes.join(' | ')
    });

    await maybeRaiseAlertForComplaint({ complaint, ai, fraudResult, needsReview });

    // Handle Fraud Penalties
    if (isFraudulent) {
      await User.findByIdAndUpdate(req.user._id, {
        $inc: { credits: -5 },
        $push: { creditHistory: { amount: -5, reason: 'Penalty for fraudulent complaint tracking' } }
      });
    }

    // Department stats only when it was really sent to a department
    if (department) {
      await Department.findByIdAndUpdate(department._id, {
        $inc: { totalComplaints: 1, pending: 1 }
      });
    }

    // Send email notification
    try {
      await sendComplaintSubmittedEmail(req.user.email, req.user.name, complaint);
    } catch (emailErr) {
      console.log('Email send failed:', emailErr.message);
    }

    const populated = await Complaint.findById(complaint._id).populate('departmentId', 'name').populate('citizenId', 'name email');

    const fraudCheck = fraudResult.label === 'genuine' ? null : {
  label: fraudResult.label,
  reason: fraudResult.reason,
  creditsDeducted: isFraudulent ? 5 : 0
};

res.status(201).json({ success: true, complaint: populated, fraudCheck, message: 'Complaint submitted successfully' });

  } catch (error) {
    console.error('Create complaint error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc Get all complaints (with filters)
exports.getComplaints = async (req, res) => {
  try {
    const { status, category, priority, departmentId, citizenId, page = 1, limit = 10 } = req.query;
    const filter = {};

    if (req.user.role === 'citizen') filter.citizenId = req.user._id;
    else if (req.user.role === 'department_admin') filter.departmentId = req.user.departmentId;
    else if (req.user.role === 'worker') filter.assignedTo = req.user._id;

    if (status) filter.status = status;
    if (category) filter.category = category;
    if (priority) filter.priority = priority;
    if (departmentId && req.user.role === 'cm_admin') filter.departmentId = departmentId;
    if (citizenId) filter.citizenId = citizenId;

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const total = await Complaint.countDocuments(filter);
    const complaints = await Complaint.find(filter)
      .populate('citizenId', 'name email')
      .populate('departmentId', 'name code')
      .populate('assignedTo', 'name email')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    res.json({
      success: true,
      complaints,
      pagination: { total, page: parseInt(page), pages: Math.ceil(total / parseInt(limit)) }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc Get single complaint
exports.getComplaint = async (req, res) => {
  try {
    const complaint = await Complaint.findById(req.params.id)
      .populate('citizenId', 'name email phone')
      .populate('departmentId', 'name code contactEmail')
      .populate('assignedTo', 'name email');

    if (!complaint) return res.status(404).json({ success: false, message: 'Complaint not found' });
    res.json({ success: true, complaint });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc Update complaint status
exports.updateComplaint = async (req, res) => {
  try {
    const { status, assignedTo, expense, workerNotes, adminNotes } = req.body;
    let proofImage;
    if (req.file) {
      const cloudUrl = await uploadLocalFile(req.file.path, 'civicai/proofs');
      proofImage = cloudUrl || `/uploads/${req.file.filename}`;
      if (cloudUrl) removeLocalFile(req.file.path);
    }

    const complaint = await Complaint.findById(req.params.id);
    if (!complaint) return res.status(404).json({ success: false, message: 'Complaint not found' });

    const prevStatus = complaint.status;

    if (status) complaint.status = status;
    if (assignedTo) complaint.assignedTo = assignedTo;
    if (expense !== undefined) complaint.expense = expense;
    if (workerNotes) complaint.workerNotes = workerNotes;
    if (adminNotes) complaint.adminNotes = adminNotes;
    if (proofImage) complaint.proofImage = proofImage;

    if (status === 'completed' && prevStatus !== 'completed') {
      complaint.completedAt = new Date();
      const resolutionMs = complaint.completedAt - complaint.createdAt;
      complaint.resolutionTime = Math.round(resolutionMs / (1000 * 60 * 60));

      // Award credits
      if (complaint.isGenuine && !complaint.creditAwarded) {
        complaint.creditAwarded = true;
        await User.findByIdAndUpdate(complaint.citizenId, {
          $inc: { credits: 10 },
          $push: { creditHistory: { amount: 10, reason: `Complaint ${complaint.complaintNumber} resolved` } }
        });
      }

      // Update department stats
      if (complaint.departmentId) {
        await Department.findByIdAndUpdate(complaint.departmentId, {
          $inc: { resolved: 1, pending: -1, totalExpense: expense || 0 }
        });
      }

      // Send completion email
      try {
        const citizen = await User.findById(complaint.citizenId);
        if (citizen) {
          await sendComplaintCompletedEmail(citizen.email, citizen.name, complaint);
        }
      } catch (emailErr) {
        console.log('Email send failed:', emailErr.message);
      }
    }
    

    if (status === 'in_progress' && prevStatus === 'pending' && complaint.departmentId) {
      await Department.findByIdAndUpdate(complaint.departmentId, {
        $inc: { inProgress: 1, pending: -1 }
      });
    }

        // Rejected by the department: it is no longer pending / in progress
    if (status === 'rejected' && prevStatus !== 'rejected' && complaint.departmentId) {
      const counter = prevStatus === 'in_progress' ? 'inProgress' : prevStatus === 'pending' ? 'pending' : null;
      if (counter) {
        await Department.updateOne(
          { _id: complaint.departmentId, [counter]: { $gt: 0 } },
          { $inc: { [counter]: -1 } }
        );
      }
    }

    await complaint.save();
    const updated = await Complaint.findById(complaint._id)
      .populate('citizenId', 'name email')
      .populate('departmentId', 'name')
      .populate('assignedTo', 'name email');

    res.json({ success: true, complaint: updated, message: 'Complaint updated successfully' });
  } catch (error) {
    console.error('Update complaint error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc Get complaint stats for citizen
exports.getCitizenStats = async (req, res) => {
  try {
    const userId = req.user._id;
    const [total, pending, inProgress, completed] = await Promise.all([
      Complaint.countDocuments({ citizenId: userId }),
      Complaint.countDocuments({ citizenId: userId, status: 'pending' }),
      Complaint.countDocuments({ citizenId: userId, status: 'in_progress' }),
      Complaint.countDocuments({ citizenId: userId, status: 'completed' })
    ]);
    const user = await User.findById(userId);
    res.json({ success: true, stats: { total, pending, inProgress, completed, credits: user.credits } });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

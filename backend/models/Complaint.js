const mongoose = require('mongoose');

const complaintSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Title is required'],
    trim: true
  },
  description: {
    type: String,
    required: [true, 'Description is required']
  },
  image: {
    type: String,
    default: null
  },
  proofImage: {
    type: String,
    default: null
  },
  location: {
    address: String,
    lat: Number,
    lng: Number
  },
  category: {
    type: String,
    enum: ['road', 'garbage', 'water', 'electricity', 'sanitation', 'public_safety', 'parks', 'other'],
    default: 'other'
  },
  priority: {
    type: String,
    enum: ['high', 'medium', 'low'],
    default: 'medium'
  },
  status: {
    type: String,
    enum: ['pending', 'in_progress', 'completed', 'rejected'],
    default: 'pending'
  },
  citizenId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  departmentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Department',
    default: null
  },
  assignedTo: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },
  expense: {
    type: Number,
    default: 0
  },
  isGenuine: {
    type: Boolean,
    default: true
  },
  creditAwarded: {
    type: Boolean,
    default: false
  },
  workerNotes: {
    type: String,
    default: ''
  },
  adminNotes: {
    type: String,
    default: ''
  },
  completedAt: {
    type: Date,
    default: null
  },
  resolutionTime: {
    type: Number,
    default: null
  },
  aiClassified: {
    type: Boolean,
    default: false
  },
  isFraud: {
    type: Boolean,
    default: false
  },
  fraudScore: {
    type: Number,
    default: 0
  },
    fraudReason: {
    type: String,
    default: ''
  },

  // AI Department Routing Fields
  aiCategory: {
    type: String,
    default: null
  },
  aiConfidence: {
    type: Number,
    default: 0
  },
  aiReason: {
    type: String,
    default: ''
  },
  routingSource: {
    type: String,
    enum: ['ai', 'fallback', 'admin'],
    default: 'ai'
  },
  needsReview: {
    type: Boolean,
    default: false
  },

  complaintNumber: {
    type: String,
    unique: true
  },
    suggestedDepartmentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Department', default: null },
  rejectionReason: { type: String, default: '' },
  reviewedAt: { type: Date, default: null },
}, { timestamps: true });

// Auto-generate complaint number
complaintSchema.pre('save', async function(next) {
  if (!this.complaintNumber) {
    const count = await mongoose.model('Complaint').countDocuments();
    this.complaintNumber = `GRV-${String(count + 1).padStart(6, '0')}`;
  }
  next();
});

module.exports = mongoose.model('Complaint', complaintSchema);

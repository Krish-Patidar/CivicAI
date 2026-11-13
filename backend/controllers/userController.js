const crypto = require('crypto');
const mongoose = require('mongoose');
const User = require('../models/User');
const Voucher = require('../models/Voucher');
const { VOUCHER_CATEGORIES } = require('../utils/voucherEmail');
const { sendVoucherEmail } = require('../utils/email');

// =====================================================================
//  VOUCHER SETTINGS  (sirf yahin change karna hai, frontend khud follow karega)
//
//  PRODUCTION :  CREDITS_PER_VOUCHER = 50,  ONE_VOUCHER_PER_MONTH = true   <- abhi yehi hai
//  TESTING    :  CREDITS_PER_VOUCHER = 10,  ONE_VOUCHER_PER_MONTH = false  (baar-baar test ke liye)
// =====================================================================
const CREDITS_PER_VOUCHER = 50;      // itne credits pe ek voucher claim hoga
const VOUCHER_VALUE = 100;           // har voucher Rs 100 ka (fixed)
const VOUCHER_MIN_SPEND = 200;       // voucher sirf Rs 200 ya usse zyada ke kharche par valid
const ONE_VOUCHER_PER_MONTH = true;  // calendar month (IST): har mahine ki 1 tarikh ko reset
const VOUCHER_VALID_DAYS = 60;
// =====================================================================

const CODE_CHARS = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789'; // 0/O, 1/I/L jaise confusing chars nahi
const randChunk = (n) => Array.from({ length: n }, () => CODE_CHARS[crypto.randomInt(CODE_CHARS.length)]).join('');
const pickCategory = () => VOUCHER_CATEGORIES[crypto.randomInt(VOUCHER_CATEGORIES.length)];
const fmtDate = (d) => new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', timeZone: 'Asia/Kolkata' });
// ---- calendar-month limit (IST) ----
const istYM = (d) => {
  const parts = new Intl.DateTimeFormat('en-US', { timeZone: 'Asia/Kolkata', year: 'numeric', month: 'numeric' }).formatToParts(new Date(d));
  return { y: Number(parts.find(p => p.type === 'year').value), m: Number(parts.find(p => p.type === 'month').value) };
};
const claimedThisMonth = (last, now) => {
  if (!last) return false;
  const a = istYM(last), b = istYM(now);
  return a.y === b.y && a.m === b.m;
};
// next month ki 1 tarikh, 00:00 IST
const nextMonthStart = (now) => {
  const { y, m } = istYM(now);
  return new Date(Date.UTC(y, m, 1) - 330 * 60 * 1000);
};
const maskEmail = (e) => e.replace(/^(.{2}).*(@.*)$/, '$1***$2');

// unique code like FOOD-7K3M-9QXA (unique index + retry on collision)
async function createVoucher(userId, category) {
  const expiresAt = new Date(Date.now() + VOUCHER_VALID_DAYS * 86400000);
  for (let i = 0; i < 5; i++) {
    try {
      return await Voucher.create({
        userId,
        category: category.key,
        value: VOUCHER_VALUE,
        minSpend: VOUCHER_MIN_SPEND,
        code: `${category.key}-${randChunk(4)}-${randChunk(4)}`,
        expiresAt
      });
    } catch (err) {
      if (err.code !== 11000) throw err; // duplicate code -> dobara try
    }
  }
  throw new Error('Could not generate a unique voucher code');
}

exports.getProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).populate('departmentId', 'name code');
    res.json({ success: true, user });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.updateProfile = async (req, res) => {
  try {
    const { name, phone } = req.body;
    const user = await User.findByIdAndUpdate(req.user._id, { name, phone }, { new: true });
    res.json({ success: true, user });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.getCreditHistory = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select('credits creditHistory totalRewards lastRewardClaim');
    const vouchersClaimed = await Voucher.countDocuments({ userId: req.user._id });
    const now = new Date();
    const limited = ONE_VOUCHER_PER_MONTH && claimedThisMonth(user.lastRewardClaim, now);
    res.json({
      success: true,
      credits: user.credits,
      history: user.creditHistory,
      totalRewards: user.totalRewards,
      vouchersClaimed,                          // frontend ke liye
      creditsPerVoucher: CREDITS_PER_VOUCHER,   // frontend threshold yahin se leta hai
      voucherValue: VOUCHER_VALUE,
      voucherMinSpend: VOUCHER_MIN_SPEND,
      claimedThisMonth: limited,                // is mahine ka voucher le liya?
      nextClaimDate: limited ? nextMonthStart(now) : null
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.claimReward = async (req, res) => {
  try {
    const now = new Date();
    const user = await User.findById(req.user._id);
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });

    // Limit: ek calendar month (IST) me sirf ek voucher
    if (ONE_VOUCHER_PER_MONTH && claimedThisMonth(user.lastRewardClaim, now)) {
      return res.status(400).json({
        success: false,
        message: `You have already claimed this month's voucher. Next claim opens on ${fmtDate(nextMonthStart(now))}`
      });
    }

    if (user.credits < CREDITS_PER_VOUCHER) {
      return res.status(400).json({ success: false, message: `Minimum ${CREDITS_PER_VOUCHER} credits required to claim a voucher` });
    }

    const prevClaim = user.lastRewardClaim || null;
    const category = pickCategory(); // random draw
    const histId = new mongoose.Types.ObjectId();

    // Atomic deduct: double-click / parallel requests se double voucher nahi banega
    const updated = await User.findOneAndUpdate(
      { _id: user._id, credits: { $gte: CREDITS_PER_VOUCHER }, lastRewardClaim: prevClaim },
      {
        $inc: { credits: -CREDITS_PER_VOUCHER, totalRewards: CREDITS_PER_VOUCHER },
        $set: { lastRewardClaim: now },
        $push: { creditHistory: { _id: histId, amount: -CREDITS_PER_VOUCHER, reason: `Voucher claimed: ${category.label}`, date: now } }
      },
      { new: true }
    );
    if (!updated) {
      return res.status(409).json({ success: false, message: 'Claim already in progress. Please refresh.' });
    }

    let voucher;
    try {
      voucher = await createVoucher(user._id, category);
      await sendVoucherEmail(user.email, user.name, {
        category, code: voucher.code, expiresAt: voucher.expiresAt, value: voucher.value, minSpend: voucher.minSpend, credits: CREDITS_PER_VOUCHER
      });
    } catch (err) {
      // voucher/email fail -> credits wapas, user ka nuksan nahi
      console.error('Voucher claim failed, rolling back:', err.message);
      if (voucher) await Voucher.deleteOne({ _id: voucher._id });
      await User.updateOne({ _id: user._id }, {
        $inc: { credits: CREDITS_PER_VOUCHER, totalRewards: -CREDITS_PER_VOUCHER },
        $set: { lastRewardClaim: prevClaim },
        $pull: { creditHistory: { _id: histId } }
      });
      return res.status(500).json({ success: false, message: 'Could not send the voucher email. Your credits are safe, please try again.' });
    }

    // code response me nahi bhej rahe: sirf registered email par jaata hai
    res.json({
      success: true,
      message: `You won a ${category.label} voucher! Sent to ${maskEmail(user.email)} (check spam too)`,
      voucher: { category: category.label, expiresAt: voucher.expiresAt },
      remainingCredits: updated.credits
    });
  } catch (error) {
    console.error('Claim reward error:', error);
    res.status(500).json({ success: false, message: 'Claim failed' });
  }
};

exports.getAllWorkers = async (req, res) => {
  try {
    const filter = { role: 'worker', isActive: true };
    if (req.user.role === 'department_admin') filter.departmentId = req.user.departmentId;
    const workers = await User.find(filter).populate('departmentId', 'name').select('-password');
    res.json({ success: true, workers });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.createUser = async (req, res) => {
  try {
    const { name, email, role, departmentId, password } = req.body;
    const existing = await User.findOne({ email });
    if (existing) return res.status(400).json({ success: false, message: 'Email already exists' });

    const user = await User.create({ name, email, role, departmentId, password, isVerified: true });
    res.status(201).json({ success: true, user });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

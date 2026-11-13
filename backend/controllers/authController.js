const User = require('../models/User');
const OTP = require('../models/OTP');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const { sendOTPEmail } = require('../utils/email');

const generateOTP = () => Math.floor(100000 + Math.random() * 900000).toString();

const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRE || '7d'
  });
};


// ================= OTP =================

exports.sendOTP = async (req, res) => {
  try {
    const { email, name } = req.body;

    if (!email) {
      return res.status(400).json({
        success: false,
        message: 'Email is required'
      });
    }

    await OTP.deleteMany({ email: email.toLowerCase() });

    const otp = generateOTP();
    const expiry = new Date(Date.now() + 5 * 60 * 1000);

    await OTP.create({
      email: email.toLowerCase(),
      otp,
      expiry,
      purpose: 'register'
    });

    await sendOTPEmail(email, otp, name || 'User');

    res.json({
      success: true,
      message: 'OTP sent successfully'
    });

  } catch (error) {
    console.error('SendOTP error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to send OTP'
    });
  }
};


// ================= REGISTER =================

exports.register = async (req, res) => {
  try {
    const { name, email, otp, phone, password } = req.body;

    if (!name || !email || !otp || !password) {
      return res.status(400).json({
        success: false,
        message: 'Name, email, password and OTP are required'
      });
    }

    const existingUser = await User.findOne({ email: email.toLowerCase() });

    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'Email already registered'
      });
    }

    const otpRecord = await OTP.findOne({
      email: email.toLowerCase(),
      otp,
      isUsed: false
    });

    if (!otpRecord) {
      return res.status(400).json({
        success: false,
        message: 'Invalid OTP'
      });
    }

    if (new Date() > otpRecord.expiry) {
      return res.status(400).json({
        success: false,
        message: 'OTP expired'
      });
    }

    otpRecord.isUsed = true;
    await otpRecord.save();

    // FIX: NO HASH HERE (handled in User model)
    const user = await User.create({
      name,
      email: email.toLowerCase(),
      phone,
      password: password,
      isVerified: true,
      role: 'citizen'
    });

    const token = generateToken(user._id);

    res.status(201).json({
      success: true,
      message: 'Registration successful',
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        credits: user.credits
      }
    });

  } catch (error) {
    console.error('Register error:', error);
    res.status(500).json({
      success: false,
      message: 'Registration failed'
    });
  }
};


// ================= LOGIN =================

exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    console.log("\n===== LOGIN DEBUG START =====");
    console.log("Email:", email);
    console.log("Password:", password);

    if (!email || !password) {
      console.log("Missing email or password");
      return res.status(400).json({
        success: false,
        message: 'Email and password are required'
      });
    }

    const user = await User.findOne({
      email: email.toLowerCase()
    }).select('+password');

    if (!user) {
      console.log("User not found");
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    console.log("Stored Password:", user.password);

    const isMatch = await bcrypt.compare(password, user.password);

    console.log("Match:", isMatch);

    if (!isMatch) {
      console.log("Password mismatch");
      return res.status(400).json({
        success: false,
        message: 'Invalid email or password'
      });
    }

    console.log("Login Success");

    const token = generateToken(user._id);

    res.json({
      success: true,
      message: 'Login successful',
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        credits: user.credits,
        departmentId: user.departmentId
      }
    });

  } catch (error) {
    console.error("LOGIN ERROR:", error);
    res.status(500).json({
      success: false,
      message: 'Login failed'
    });
  }
};


// ================= GET ME =================

exports.getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user.id)
      .populate('departmentId', 'name code');

    res.json({
      success: true,
      user
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};


// ================= ADMIN LOGIN =================

exports.adminLogin = async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({
      email: email.toLowerCase(),
      role: { $in: ['cm_admin', 'department_admin'] }
    }).select('+password');

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }

    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }

    const token = generateToken(user._id);

    res.json({
      success: true,
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        departmentId: user.departmentId
      }
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

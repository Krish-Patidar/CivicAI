const nodemailer = require('nodemailer');
const { buildVoucherEmail } = require('./voucherEmail');

const createTransporter = () => {
  return nodemailer.createTransport({
    host: process.env.EMAIL_HOST || 'smtp-relay.brevo.com',
    port: parseInt(process.env.EMAIL_PORT || '2525'),
    secure: false,
    connectionTimeout: 20000,
    greetingTimeout: 20000,
    socketTimeout: 30000,
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS
    }
  });
};

const sendOTPEmail = async (email, otp, name = 'User') => {
  const transporter = createTransporter();
  const mailOptions = {
    from: `"CivicAI" <${process.env.EMAIL_FROM}>`,
    to: email,
    subject: 'Your OTP for CivicAI',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #f8f9fa; padding: 20px; border-radius: 10px;">
        <div style="background: linear-gradient(135deg, #1a237e, #0d47a1); padding: 30px; border-radius: 10px 10px 0 0; text-align: center;">
          <h1 style="color: white; margin: 0; font-size: 24px;">Grievance Portal</h1>
          <p style="color: #90caf9; margin: 5px 0 0;">CivicAI - Smart Citizen Redressal System</p>
        </div>
        <div style="background: white; padding: 30px; border-radius: 0 0 10px 10px;">
          <h2 style="color: #1a237e;">Hello, ${name}!</h2>
          <p style="color: #555;">Your One-Time Password (OTP) for verification is:</p>
          <div style="background: #e8f5e9; border: 2px dashed #4caf50; border-radius: 8px; padding: 20px; text-align: center; margin: 20px 0;">
            <span style="font-size: 36px; font-weight: bold; color: #1b5e20; letter-spacing: 8px;">${otp}</span>
          </div>
          <p style="color: #f44336; font-size: 14px;"><strong>This OTP expires in 5 minutes.</strong></p>
          <p style="color: #777; font-size: 13px;">If you didn't request this OTP, please ignore this email.</p>
          <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;">
          <p style="color: #999; font-size: 12px; text-align: center;">2026 - CivicAI  | Smart Grievance Portal</p>
        </div>
      </div>
    `
  };
  await transporter.sendMail(mailOptions);
};

const sendComplaintSubmittedEmail = async (email, name, complaint) => {
  const transporter = createTransporter();
  const mailOptions = {
    from: `"CivicAI" <${process.env.EMAIL_FROM}>`,
    to: email,
    subject: `Complaint Registered - ${complaint.complaintNumber}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #f8f9fa; padding: 20px; border-radius: 10px;">
        <div style="background: linear-gradient(135deg, #1a237e, #0d47a1); padding: 30px; border-radius: 10px 10px 0 0; text-align: center;">
          <h1 style="color: white; margin: 0; font-size: 24px;">Grievance Portal</h1>
        </div>
        <div style="background: white; padding: 30px; border-radius: 0 0 10px 10px;">
          <h2 style="color: #2e7d32;">Complaint Successfully Registered!</h2>
          <p>Dear <strong>${name}</strong>,</p>
          <p>Your complaint has been registered and is being reviewed by the concerned department.</p>
          <div style="background: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <table style="width: 100%; border-collapse: collapse;">
              <tr><td style="padding: 8px; color: #555; font-weight: bold;">Complaint No.:</td><td style="padding: 8px; color: #1a237e; font-weight: bold;">${complaint.complaintNumber}</td></tr>
              <tr><td style="padding: 8px; color: #555; font-weight: bold;">Title:</td><td style="padding: 8px;">${complaint.title}</td></tr>
              <tr><td style="padding: 8px; color: #555; font-weight: bold;">Category:</td><td style="padding: 8px; text-transform: capitalize;">${complaint.category}</td></tr>
              <tr><td style="padding: 8px; color: #555; font-weight: bold;">Priority:</td><td style="padding: 8px;"><span style="color: ${complaint.priority === 'high' ? '#f44336' : complaint.priority === 'medium' ? '#ff9800' : '#4caf50'}; font-weight: bold; text-transform: uppercase;">${complaint.priority}</span></td></tr>
              <tr><td style="padding: 8px; color: #555; font-weight: bold;">Status:</td><td style="padding: 8px;"><span style="background: #fff3e0; color: #e65100; padding: 2px 8px; border-radius: 4px;">Pending</span></td></tr>
            </table>
          </div>
          <p>You'll receive another notification when your complaint is resolved. You can also track its status on our portal.</p>
          <div style="text-align: center; margin: 20px 0;">
            <p style="color: #4caf50; font-size: 14px;">You'll receive <strong>10 credit points</strong> once this is resolved!</p>
          </div>
          <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;">
          <p style="color: #999; font-size: 12px; text-align: center;">2026 - CivicAI | Smart Grievance Portal</p>
        </div>
      </div>
    `
  };
  await transporter.sendMail(mailOptions);
};

const sendComplaintCompletedEmail = async (email, name, complaint) => {
  const transporter = createTransporter();
  const mailOptions = {
    from: `"CivicAI" <${process.env.EMAIL_FROM}>`,
    to: email,
    subject: `Complaint Resolved - ${complaint.complaintNumber}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #f8f9fa; padding: 20px; border-radius: 10px;">
        <div style="background: linear-gradient(135deg, #1b5e20, #2e7d32); padding: 30px; border-radius: 10px 10px 0 0; text-align: center;">
          <h1 style="color: white; margin: 0; font-size: 24px;">Grievance Portal</h1>
        </div>
        <div style="background: white; padding: 30px; border-radius: 0 0 10px 10px;">
          <h2 style="color: #2e7d32;">Your Complaint Has Been Resolved!</h2>
          <p>Dear <strong>${name}</strong>,</p>
          <p>We're happy to inform you that your complaint <strong>${complaint.complaintNumber}</strong> has been successfully resolved.</p>
          <div style="background: #e8f5e9; border-left: 4px solid #4caf50; padding: 15px; margin: 20px 0; border-radius: 4px;">
            <p style="margin: 0; color: #1b5e20;"><strong>Resolution Notes:</strong> ${complaint.workerNotes || 'Complaint has been addressed by the concerned department.'}</p>
          </div>
          <div style="background: #fff3e0; padding: 20px; border-radius: 8px; text-align: center; margin: 20px 0;">
            <p style="font-size: 18px; color: #e65100; margin: 0;"><strong>+10 Credits Awarded!</strong></p>
            <p style="color: #777; font-size: 14px;">Thank you for being an active citizen. Your credits have been added to your account.</p>
          </div>
          <p style="color: #777; font-size: 13px;">If you're not satisfied with the resolution, you can reopen the complaint from your dashboard.</p>
          <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;">
          <p style="color: #999; font-size: 12px; text-align: center;">2026 - CivicAI | Smart Grievance Portal</p>
        </div>
      </div>
    `
  };
  await transporter.sendMail(mailOptions);
};

// NEW: coupon-style voucher email (design: utils/voucherEmail.js)
const sendVoucherEmail = async (email, name, voucher) => {
  const transporter = createTransporter();
  const { subject, html, text } = buildVoucherEmail({ name, ...voucher });
  await transporter.sendMail({
    from: `"CivicAI Rewards" <${process.env.EMAIL_FROM}>`,
    to: email,
    subject,
    html,
    text
  });
};

module.exports = { sendOTPEmail, sendComplaintSubmittedEmail, sendComplaintCompletedEmail, sendVoucherEmail };

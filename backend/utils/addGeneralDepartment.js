const dotenv = require('dotenv');
dotenv.config();
const mongoose = require('mongoose');
const Department = require('../models/Department');
const User = require('../models/User');

(async () => {
  const password = process.env.GEN_STAFF_PASSWORD;
  if (!password || password.length < 10) {
    console.error('Set GEN_STAFF_PASSWORD (at least 10 characters) in this shell first');
    process.exit(1);
  }

  await mongoose.connect(process.env.MONGODB_URI);

  let dept = await Department.findOne({ code: 'GEN' });
  if (dept) {
    console.log('GEN department already exists, nothing to do');
    return process.exit(0);
  }

  dept = await Department.create({
    name: 'General Administration',
    code: 'GEN',
    categories: ['other'],
    description: 'Civic and administrative matters that no other department handles: certificates and documents, pension and ration services, delays or problems with municipal office services, public signboards and information boards, general suggestions and information requests, and municipal facilities not covered elsewhere.'
  });

  const admin = await User.create({
    name: 'Admin General Administration',
    email: 'admin.gen@grievance.gov.in',
    password,
    role: 'department_admin',
    departmentId: dept._id,
    isVerified: true
  });

  await User.create({
    name: 'Worker General Administration',
    email: 'worker.gen@grievance.gov.in',
    password,
    role: 'worker',
    departmentId: dept._id,
    isVerified: true
  });

  await Department.findByIdAndUpdate(dept._id, { adminId: admin._id });
  console.log('Created GEN department, one admin and one worker');
  process.exit(0);
})().catch((e) => { console.error(e.message); process.exit(1); });

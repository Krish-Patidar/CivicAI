const cloudinary = require('cloudinary').v2;
const fs = require('fs');

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true
});

const isConfigured = () =>
  !!(process.env.CLOUDINARY_CLOUD_NAME && process.env.CLOUDINARY_API_KEY && process.env.CLOUDINARY_API_SECRET);

// Uploads a local file; returns the https URL, or null if not configured or it fails
const uploadLocalFile = async (filePath, folder = 'civicai/complaints') => {
  if (!isConfigured() || !filePath) return null;
  try {
    const result = await cloudinary.uploader.upload(filePath, { folder, resource_type: 'image' });
    return result.secure_url;
  } catch (err) {
    console.log('Cloudinary upload failed:', err.message);
    return null;
  }
};

const removeLocalFile = (filePath) => {
  if (filePath) fs.unlink(filePath, () => {});
};

module.exports = { uploadLocalFile, removeLocalFile, isConfigured };

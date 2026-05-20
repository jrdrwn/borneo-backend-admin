const fs = require('fs');
const path = require('path');

const isVercel = process.env.VERCEL === '1' || process.env.VERCEL === 'true';
const uploadRoot = process.env.UPLOAD_DIR || (isVercel ? path.join('/tmp', 'uploads') : path.join(__dirname, '..', '..', 'uploads'));

function getUploadDir(folderName) {
  const uploadDir = path.join(uploadRoot, folderName);
  fs.mkdirSync(uploadDir, { recursive: true });
  return uploadDir;
}

module.exports = { uploadRoot, getUploadDir };
const multer = require('multer');
const path = require('path');
const { getUploadDir } = require('../config/upload');

function makeUpload(folderName) {
  const uploadDir = getUploadDir(folderName);

  const storage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, uploadDir),
    filename: (req, file, cb) => {
      const ext = path.extname(file.originalname).toLowerCase();
      const safeName = path.basename(file.originalname, ext).toLowerCase().replace(/[^a-z0-9]+/g, '-');
      cb(null, `${Date.now()}-${safeName}${ext}`);
    }
  });

  const fileFilter = (req, file, cb) => {
    const allowed = ['image/jpeg', 'image/png', 'image/webp', 'image/jpg'];
    if (!allowed.includes(file.mimetype)) return cb(new Error('File harus berupa JPG, PNG, atau WEBP'));
    cb(null, true);
  };

  return multer({ storage, fileFilter, limits: { fileSize: 5 * 1024 * 1024 } });
}

module.exports = { makeUpload };

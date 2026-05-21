const multer = require('multer');
const { uploadBufferToImageKit } = require('../config/imagekit');

function makeUpload(folderName) {
  const storage = multer.memoryStorage();

  const fileFilter = (req, file, cb) => {
    const allowed = ['image/jpeg', 'image/png', 'image/webp', 'image/jpg'];
    if (!allowed.includes(file.mimetype)) return cb(new Error('File harus berupa JPG, PNG, atau WEBP'));
    cb(null, true);
  };

  const upload = multer({ storage, fileFilter, limits: { fileSize: 5 * 1024 * 1024 } });

  async function publishFiles(req) {
    if (req.file) {
      req.file = await uploadBufferToImageKit(req.file, folderName);
    }

    if (req.files && Array.isArray(req.files)) {
      req.files = await Promise.all(req.files.map(file => uploadBufferToImageKit(file, folderName)));
      return;
    }

    if (req.files && typeof req.files === 'object') {
      const entries = Object.entries(req.files);
      const nextFiles = {};

      for (const [fieldName, files] of entries) {
        nextFiles[fieldName] = await Promise.all(files.map(file => uploadBufferToImageKit(file, folderName)));
      }

      req.files = nextFiles;
    }
  }

  function wrap(middleware) {
    return (req, res, next) => {
      middleware(req, res, error => {
        if (error) return next(error);
        publishFiles(req).then(() => next()).catch(next);
      });
    };
  }

  return {
    single: fieldName => wrap(upload.single(fieldName)),
    array: (fieldName, maxCount) => wrap(upload.array(fieldName, maxCount)),
    fields: fields => wrap(upload.fields(fields)),
    none: () => upload.none()
  };
}

module.exports = { makeUpload };

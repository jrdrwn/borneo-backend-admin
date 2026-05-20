const router = require('express').Router();
const { listSettings, upsertSettings } = require('../controllers/settingController');
const { protectAdmin } = require('../middleware/authMiddleware');
const { makeUpload } = require('../middleware/uploadMiddleware');
const upload = makeUpload('settings');
router.get('/', listSettings);
router.put('/admin', protectAdmin, upload.single('hero_image'), upsertSettings);
module.exports = router;

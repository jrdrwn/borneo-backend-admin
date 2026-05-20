const router = require('express').Router();
const { loginAdmin, profile } = require('../controllers/authController');
const { protectAdmin } = require('../middleware/authMiddleware');

router.post('/admin/login', loginAdmin);
router.get('/admin/profile', protectAdmin, profile);

module.exports = router;

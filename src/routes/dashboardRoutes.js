const router = require('express').Router();
const { getDashboard } = require('../controllers/dashboardController');
const { protectAdmin } = require('../middleware/authMiddleware');
router.get('/', protectAdmin, getDashboard);
module.exports = router;

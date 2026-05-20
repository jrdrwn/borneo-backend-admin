const router = require('express').Router();
const { listReviews, createReview, updateReviewStatus, deleteReview } = require('../controllers/reviewController');
const { protectAdmin } = require('../middleware/authMiddleware');
router.get('/', listReviews);
router.post('/', createReview);
router.get('/admin/list', protectAdmin, (req, res, next) => { req.query.admin = 'true'; next(); }, listReviews);
router.patch('/admin/:id/status', protectAdmin, updateReviewStatus);
router.delete('/admin/:id', protectAdmin, deleteReview);
module.exports = router;

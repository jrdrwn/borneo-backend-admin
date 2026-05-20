const router = require('express').Router();
const { listBookings, createBooking, updateBookingStatus, deleteBooking } = require('../controllers/bookingController');
const { protectAdmin } = require('../middleware/authMiddleware');
router.post('/', createBooking);
router.get('/admin/list', protectAdmin, listBookings);
router.patch('/admin/:id/status', protectAdmin, updateBookingStatus);
router.delete('/admin/:id', protectAdmin, deleteBooking);
module.exports = router;

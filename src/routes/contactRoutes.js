const router = require('express').Router();
const { listContacts, createContact, updateContactStatus, deleteContact } = require('../controllers/contactController');
const { protectAdmin } = require('../middleware/authMiddleware');
router.post('/', createContact);
router.get('/admin/list', protectAdmin, listContacts);
router.patch('/admin/:id/status', protectAdmin, updateContactStatus);
router.delete('/admin/:id', protectAdmin, deleteContact);
module.exports = router;

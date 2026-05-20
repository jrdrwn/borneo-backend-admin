const router = require('express').Router();
const { listCategories, createCategory, updateCategory, deleteCategory } = require('../controllers/categoryController');
const { protectAdmin } = require('../middleware/authMiddleware');
router.get('/', listCategories);
router.post('/', protectAdmin, createCategory);
router.put('/:id', protectAdmin, updateCategory);
router.delete('/:id', protectAdmin, deleteCategory);
module.exports = router;

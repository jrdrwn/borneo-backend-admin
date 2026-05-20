const router = require('express').Router();
const { listRegions, createRegion, updateRegion, deleteRegion } = require('../controllers/regionController');
const { protectAdmin } = require('../middleware/authMiddleware');

router.get('/', listRegions);
router.post('/', protectAdmin, createRegion);
router.put('/:id', protectAdmin, updateRegion);
router.delete('/:id', protectAdmin, deleteRegion);

module.exports = router;

const router = require('express').Router();
const {
  listPublicDestinations, listAdminDestinations, getDestination, createDestination,
  updateDestination, deleteDestination, deleteDestinationImage
} = require('../controllers/destinationController');
const { protectAdmin } = require('../middleware/authMiddleware');
const { makeUpload } = require('../middleware/uploadMiddleware');
const upload = makeUpload('destinations');

const fields = upload.fields([
  { name: 'main_image', maxCount: 1 },
  { name: 'gallery_images', maxCount: 12 }
]);

router.get('/', listPublicDestinations);
router.get('/admin/list', protectAdmin, listAdminDestinations);
router.post('/admin', protectAdmin, fields, createDestination);
router.put('/admin/:id', protectAdmin, fields, updateDestination);
router.delete('/admin/:id', protectAdmin, deleteDestination);
router.delete('/admin/images/:imageId', protectAdmin, deleteDestinationImage);
router.get('/:slugOrId', getDestination);

module.exports = router;

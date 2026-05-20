const router = require('express').Router();
const { homeData } = require('../controllers/publicController');
router.get('/home', homeData);
module.exports = router;

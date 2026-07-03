const router    = require('express').Router();
const auth      = require('../middleware/auth');
const { adminOnly } = require('../middleware/auth');
const ctrl      = require('../controllers/userController');

// Any logged-in user
router.get('/profile',   auth, ctrl.getMyProfile);

// Admin only
router.get('/stats',     auth, adminOnly, ctrl.getStats);
router.get('/students',  auth, adminOnly, ctrl.getStudents);
router.get('/dashboard', auth, adminOnly, ctrl.getDashboard);

module.exports = router;

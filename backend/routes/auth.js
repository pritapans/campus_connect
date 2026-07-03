const router = require('express').Router();
const auth   = require('../middleware/auth');
const ctrl   = require('../controllers/authController');

// Public
router.post('/login',    ctrl.login);
router.post('/register', ctrl.register);

// Protected
router.get('/me', auth, ctrl.getMe);

module.exports = router;

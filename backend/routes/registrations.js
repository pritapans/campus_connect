const router    = require('express').Router();
const auth      = require('../middleware/auth');
const { adminOnly } = require('../middleware/auth');
const ctrl      = require('../controllers/registrationsController');

// Student
router.post('/register-event',    auth, ctrl.registerForEvent);
router.get('/my-registrations',   auth, ctrl.getMyRegistrations);
router.delete('/:id',             auth, ctrl.cancelRegistration);

// Admin
router.get('/all', auth, adminOnly, ctrl.getAllRegistrations);

module.exports = router;

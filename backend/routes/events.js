const router    = require('express').Router();
const auth      = require('../middleware/auth');
const { adminOnly } = require('../middleware/auth');
const ctrl      = require('../controllers/eventsController');

// Any logged-in user
router.get('/',         auth, ctrl.getApprovedEvents);
router.post('/',        auth, ctrl.createEvent);

// Admin only
router.get('/all',      auth, adminOnly, ctrl.getAllEvents);
router.get('/pending',  auth, adminOnly, ctrl.getPendingEvents);
router.put('/:id',      auth, adminOnly, ctrl.updateEventStatus);
router.delete('/:id',   auth, adminOnly, ctrl.deleteEvent);

module.exports = router;

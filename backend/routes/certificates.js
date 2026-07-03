const router    = require('express').Router();
const auth      = require('../middleware/auth');
const { adminOnly } = require('../middleware/auth');
const ctrl      = require('../controllers/certificatesController');

// Student
router.post('/request',  auth, ctrl.requestCertificate);
router.get('/mine',      auth, ctrl.getMyCertificates);

// Admin
router.get('/all',       auth, adminOnly, ctrl.getAllCertificates);
router.post('/approve',  auth, adminOnly, ctrl.approveCertificate);
router.post('/reject',   auth, adminOnly, ctrl.rejectCertificate);

module.exports = router;

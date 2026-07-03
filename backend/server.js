require('dotenv').config();
const express = require('express');
const cors = require('cors');

const app = express();

// ─── Middleware ───────────────────────────────────────────────
app.use(cors({
    origin: '*', // tighten in production
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json());

// ─── Routes ──────────────────────────────────────────────────
app.use('/auth', require('./routes/auth'));
app.use('/events', require('./routes/events'));
app.use('/registrations', require('./routes/registrations'));
app.use('/certificates', require('./routes/certificates'));
app.use('/admin', require('./routes/users'));

// Convenience aliases the frontend calls directly
const regCtrl = require('./controllers/registrationsController');
const certCtrl = require('./controllers/certificatesController');
const auth = require('./middleware/auth');

app.post('/register-event', auth, regCtrl.registerForEvent);
app.get('/my-registrations', auth, regCtrl.getMyRegistrations);
app.get('/my-certificates', auth, certCtrl.getMyCertificates);
app.post('/request-certificate', auth, certCtrl.requestCertificate);

// ─── Health check ─────────────────────────────────────────────
app.get('/', (_req, res) =>
    res.json({ success: true, message: 'Campus Connect API is running ✅' })
);

// ─── 404 catch-all ────────────────────────────────────────────
app.use((_req, res) =>
    res.status(404).json({ success: false, message: 'Route not found' })
);

// ─── Global error handler ─────────────────────────────────────
app.use((err, _req, res, _next) => {
    console.error('Unhandled error:', err);
    res.status(500).json({ success: false, message: 'Internal server error' });
});

// ─── Start ────────────────────────────────────────────────────
const PORT = process.env.PORT || 5500;
app.listen(PORT, () => {
    console.log(`\n🚀 Campus Connect server running at http://localhost:${PORT}`);
    console.log(`📋 Health check: http://localhost:${PORT}/\n`);
});
console.log('DB_CONNECT_STRING =', process.env.DB_CONNECT_STRING);
console.log('DB_USER =', process.env.DB_USER);
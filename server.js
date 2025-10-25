const express = require('express');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

const db = require('./database');

// Initialize database first
db.initialize();

// Now load routes after database is ready
const userRoutes = require('./routes/userRoutes');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.static(path.join(__dirname)));

// Middleware to get client IP
app.use((req, res, next) => {
    // Get IP from various possible headers (for proxy/load balancer support)
    const ip = req.headers['x-forwarded-for']?.split(',')[0].trim() ||
               req.headers['x-real-ip'] ||
               req.connection.remoteAddress ||
               req.socket.remoteAddress ||
               req.ip;

    req.clientIp = ip;
    console.log(`Request from IP: ${ip}`);
    next();
});

// Routes
app.use('/api/user', userRoutes);

// Health check endpoint
app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', message: 'Server is running' });
});

// Serve index.html for the root route
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

// Error handling middleware
app.use((err, req, res, next) => {
    console.error('Error:', err);
    res.status(500).json({
        error: 'Internal server error',
        message: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
});

// Start server (database already initialized above)
app.listen(PORT, () => {
    console.log(`
========================================
🚀 Tanda Quiz Server Running
========================================
Port: ${PORT}
Environment: ${process.env.NODE_ENV || 'development'}
IP-based tracking: ENABLED
========================================
    `);
});

module.exports = app;

const express = require('express');
const router = express.Router();
const { userOps } = require('../database');

// Get user data by IP
router.get('/data', (req, res) => {
    try {
        const ip = req.clientIp;

        // Get or create user
        const user = userOps.getOrCreateUser.get(ip);

        // Get all user data
        const statsRow = userOps.getStats.get(user.id);
        const progressRow = userOps.getProgress.get(user.id);
        const preferencesRow = userOps.getPreferences.get(user.id);

        const userData = {
            user: {
                id: user.id,
                ip: user.ip_address,
                firstSeen: user.first_seen,
                lastSeen: user.last_seen,
                totalVisits: user.total_visits
            },
            stats: statsRow ? JSON.parse(statsRow.stats_data) : null,
            progress: progressRow ? JSON.parse(progressRow.progress_data) : null,
            preferences: preferencesRow ? JSON.parse(preferencesRow.preferences_data) : null
        };

        res.json(userData);
    } catch (error) {
        console.error('Error fetching user data:', error);
        res.status(500).json({ error: 'Failed to fetch user data' });
    }
});

// Save quiz stats
router.post('/stats', (req, res) => {
    try {
        const ip = req.clientIp;
        const { stats } = req.body;

        if (!stats) {
            return res.status(400).json({ error: 'Stats data is required' });
        }

        // Get or create user
        const user = userOps.getOrCreateUser.get(ip);

        // Save stats
        userOps.saveStats.run(user.id, JSON.stringify(stats));

        res.json({ success: true, message: 'Stats saved successfully' });
    } catch (error) {
        console.error('Error saving stats:', error);
        res.status(500).json({ error: 'Failed to save stats' });
    }
});

// Save quiz progress (in-progress quiz)
router.post('/progress', (req, res) => {
    try {
        const ip = req.clientIp;
        const { progress } = req.body;

        if (!progress) {
            return res.status(400).json({ error: 'Progress data is required' });
        }

        // Get or create user
        const user = userOps.getOrCreateUser.get(ip);

        // Save progress
        userOps.saveProgress.run(user.id, JSON.stringify(progress));

        res.json({ success: true, message: 'Progress saved successfully' });
    } catch (error) {
        console.error('Error saving progress:', error);
        res.status(500).json({ error: 'Failed to save progress' });
    }
});

// Delete quiz progress (when quiz is completed/abandoned)
router.delete('/progress', (req, res) => {
    try {
        const ip = req.clientIp;

        // Get user
        const user = userOps.getUserByIp.get(ip);

        if (user) {
            userOps.deleteProgress.run(user.id);
        }

        res.json({ success: true, message: 'Progress deleted successfully' });
    } catch (error) {
        console.error('Error deleting progress:', error);
        res.status(500).json({ error: 'Failed to delete progress' });
    }
});

// Save user preferences
router.post('/preferences', (req, res) => {
    try {
        const ip = req.clientIp;
        const { preferences } = req.body;

        if (!preferences) {
            return res.status(400).json({ error: 'Preferences data is required' });
        }

        // Get or create user
        const user = userOps.getOrCreateUser.get(ip);

        // Save preferences
        userOps.savePreferences.run(user.id, JSON.stringify(preferences));

        res.json({ success: true, message: 'Preferences saved successfully' });
    } catch (error) {
        console.error('Error saving preferences:', error);
        res.status(500).json({ error: 'Failed to save preferences' });
    }
});

// Get user info (for debugging/display)
router.get('/info', (req, res) => {
    try {
        const ip = req.clientIp;
        const user = userOps.getUserByIp.get(ip);

        if (!user) {
            return res.json({
                exists: false,
                ip: ip,
                message: 'No data found for this IP address'
            });
        }

        res.json({
            exists: true,
            user: {
                id: user.id,
                ip: user.ip_address,
                firstSeen: user.first_seen,
                lastSeen: user.last_seen,
                totalVisits: user.total_visits
            }
        });
    } catch (error) {
        console.error('Error fetching user info:', error);
        res.status(500).json({ error: 'Failed to fetch user info' });
    }
});

module.exports = router;

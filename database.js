const Database = require('better-sqlite3');
const path = require('path');

const dbPath = path.join(__dirname, 'quiz_data.db');
const db = new Database(dbPath);

// Enable WAL mode for better concurrent access
db.pragma('journal_mode = WAL');

function initialize() {
    console.log('Initializing database...');

    // Create users table (IP-based)
    db.exec(`
        CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            ip_address TEXT UNIQUE NOT NULL,
            first_seen DATETIME DEFAULT CURRENT_TIMESTAMP,
            last_seen DATETIME DEFAULT CURRENT_TIMESTAMP,
            total_visits INTEGER DEFAULT 1
        )
    `);

    // Create quiz_stats table
    db.exec(`
        CREATE TABLE IF NOT EXISTS quiz_stats (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER NOT NULL,
            stats_data TEXT NOT NULL,
            updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
            UNIQUE(user_id)
        )
    `);

    // Create quiz_progress table (for in-progress quizzes)
    db.exec(`
        CREATE TABLE IF NOT EXISTS quiz_progress (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER NOT NULL,
            progress_data TEXT NOT NULL,
            updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
            UNIQUE(user_id)
        )
    `);

    // Create user_preferences table
    db.exec(`
        CREATE TABLE IF NOT EXISTS user_preferences (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER NOT NULL,
            preferences_data TEXT NOT NULL,
            updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
            UNIQUE(user_id)
        )
    `);

    // Create indexes for better performance
    db.exec(`
        CREATE INDEX IF NOT EXISTS idx_users_ip ON users(ip_address);
        CREATE INDEX IF NOT EXISTS idx_stats_user ON quiz_stats(user_id);
        CREATE INDEX IF NOT EXISTS idx_progress_user ON quiz_progress(user_id);
        CREATE INDEX IF NOT EXISTS idx_preferences_user ON user_preferences(user_id);
    `);

    console.log('Database initialized successfully');
}

// User operations - initialized as null, will be set after initialize()
let userOps = null;

function getUserOps() {
    if (!userOps) {
        userOps = {
            // Get or create user by IP
            getOrCreateUser: db.prepare(`
                INSERT INTO users (ip_address, first_seen, last_seen, total_visits)
                VALUES (?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, 1)
                ON CONFLICT(ip_address) DO UPDATE SET
                    last_seen = CURRENT_TIMESTAMP,
                    total_visits = total_visits + 1
                RETURNING *
            `),

            getUserByIp: db.prepare(`
                SELECT * FROM users WHERE ip_address = ?
            `),

            // Stats operations
            getStats: db.prepare(`
                SELECT stats_data FROM quiz_stats WHERE user_id = ?
            `),

            saveStats: db.prepare(`
                INSERT INTO quiz_stats (user_id, stats_data, updated_at)
                VALUES (?, ?, CURRENT_TIMESTAMP)
                ON CONFLICT(user_id) DO UPDATE SET
                    stats_data = excluded.stats_data,
                    updated_at = CURRENT_TIMESTAMP
            `),

            // Progress operations
            getProgress: db.prepare(`
                SELECT progress_data FROM quiz_progress WHERE user_id = ?
            `),

            saveProgress: db.prepare(`
                INSERT INTO quiz_progress (user_id, progress_data, updated_at)
                VALUES (?, ?, CURRENT_TIMESTAMP)
                ON CONFLICT(user_id) DO UPDATE SET
                    progress_data = excluded.progress_data,
                    updated_at = CURRENT_TIMESTAMP
            `),

            deleteProgress: db.prepare(`
                DELETE FROM quiz_progress WHERE user_id = ?
            `),

            // Preferences operations
            getPreferences: db.prepare(`
                SELECT preferences_data FROM user_preferences WHERE user_id = ?
            `),

            savePreferences: db.prepare(`
                INSERT INTO user_preferences (user_id, preferences_data, updated_at)
                VALUES (?, ?, CURRENT_TIMESTAMP)
                ON CONFLICT(user_id) DO UPDATE SET
                    preferences_data = excluded.preferences_data,
                    updated_at = CURRENT_TIMESTAMP
            `)
        };
    }
    return userOps;
}

module.exports = {
    db,
    initialize,
    get userOps() {
        return getUserOps();
    }
};

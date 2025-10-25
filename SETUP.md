# Tanda Quiz - IP-Based User Login Setup

This document explains how to set up and run the Tanda Quiz application with IP-based user tracking.

## Overview

The application now includes a backend server that automatically tracks users by their IP address. All quiz data (statistics, progress, preferences) is saved per IP address without requiring any login or authentication.

### Key Features

- Automatic IP-based user identification
- Data persistence across browser sessions
- Server-side storage with SQLite database
- Offline fallback to localStorage
- No login required - completely automatic

## Prerequisites

- Node.js (v14 or higher)
- npm (comes with Node.js)

## Installation

1. Install dependencies:

```bash
npm install
```

This will install:
- express (web server)
- cors (cross-origin resource sharing)
- better-sqlite3 (database)
- dotenv (environment variables)

## Running the Application

### Development Mode

```bash
npm start
```

This starts the server on port 3000 (default). The application will be available at:

```
http://localhost:3000
```

### Production Mode

For production, you should:

1. Set environment variables in `.env`:

```env
PORT=3000
NODE_ENV=production
```

2. Use a process manager like PM2:

```bash
npm install -g pm2
pm2 start server.js --name tanda-quiz
pm2 save
pm2 startup
```

## How It Works

### IP-Based Tracking

1. When a user visits the site, their IP address is automatically detected
2. The server creates a user record for that IP (if it doesn't exist)
3. All quiz data is associated with that IP address
4. Data persists across browser sessions and devices on the same network

### Data Flow

```
User Browser ←→ Express Server ←→ SQLite Database
     ↓
  localStorage
  (offline backup)
```

1. **On Page Load**:
   - Frontend checks server health
   - Loads user data from server based on IP
   - Syncs to localStorage for offline access

2. **During Quiz**:
   - Progress is saved to both localStorage and server
   - Statistics update in real-time

3. **Offline Mode**:
   - If server is unavailable, falls back to localStorage
   - Data syncs when server becomes available again

## API Endpoints

The backend provides these REST API endpoints:

- `GET /api/health` - Health check
- `GET /api/user/data` - Get all user data for current IP
- `GET /api/user/info` - Get user info (for debugging)
- `POST /api/user/stats` - Save quiz statistics
- `POST /api/user/progress` - Save quiz in progress
- `DELETE /api/user/progress` - Delete quiz progress
- `POST /api/user/preferences` - Save user preferences

All endpoints automatically use the requesting client's IP address.

## Database

The application uses SQLite with the following tables:

### users
- Stores IP address and visit information
- Automatically created on first visit

### quiz_stats
- Quiz statistics (scores, XP, achievements)
- One record per user

### quiz_progress
- Currently in-progress quiz state
- Allows resuming quizzes across sessions

### user_preferences
- User settings (timer enabled, etc.)

The database file (`quiz_data.db`) is created automatically on first run.

## File Structure

```
/
├── server.js              # Express server
├── database.js            # Database setup and queries
├── routes/
│   └── userRoutes.js     # API route handlers
├── index.html            # Frontend application
├── package.json          # Dependencies
├── .env                  # Environment variables
├── quiz_data.db          # SQLite database (auto-generated)
└── SETUP.md             # This file
```

## Configuration

### Environment Variables

Create a `.env` file in the root directory:

```env
PORT=3000
NODE_ENV=development
```

### Port Configuration

The default port is 3000. To change it:

1. Update `.env`:
   ```env
   PORT=8080
   ```

2. Or set environment variable:
   ```bash
   PORT=8080 npm start
   ```

## Deployment

### Using a Reverse Proxy (Recommended)

For production, use nginx or Apache as a reverse proxy:

**nginx example:**

```nginx
server {
    listen 80;
    server_name yourdomain.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_cache_bypass $http_upgrade;
    }
}
```

**Important**: The `X-Forwarded-For` and `X-Real-IP` headers are required for proper IP detection through a proxy.

### Docker Deployment

Create a `Dockerfile`:

```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --production
COPY . .
EXPOSE 3000
CMD ["node", "server.js"]
```

Build and run:

```bash
docker build -t tanda-quiz .
docker run -p 3000:3000 -v $(pwd)/quiz_data.db:/app/quiz_data.db tanda-quiz
```

## Troubleshooting

### Server won't start

Check if port 3000 is already in use:

```bash
# Linux/Mac
lsof -i :3000

# Windows
netstat -ano | findstr :3000
```

### Data not saving

1. Check server logs for errors
2. Verify database file has write permissions
3. Check browser console for API errors

### IP not detected correctly

If behind a proxy/load balancer, ensure these headers are set:
- `X-Forwarded-For`
- `X-Real-IP`

### Database locked errors

SQLite is in WAL mode for better concurrency. If issues persist:

```bash
rm quiz_data.db-wal quiz_data.db-shm
```

## Privacy Considerations

### IP Address Storage

This application stores IP addresses to identify users. Consider:

1. **Privacy Policy**: Inform users that IP addresses are stored
2. **Data Retention**: Implement data cleanup for inactive IPs
3. **GDPR Compliance**: IP addresses are considered personal data in EU
4. **Hashing**: Consider hashing IPs for additional privacy

### Data Cleanup

To delete old user data, you can run SQL queries:

```sql
-- Delete users inactive for 90 days
DELETE FROM users WHERE last_seen < datetime('now', '-90 days');

-- This will cascade delete all related data
```

## Limitations

### Same IP, Multiple Users

Users sharing the same IP (e.g., office network, family) will share the same data. This is intentional for the current design.

### Dynamic IPs

If a user's IP changes (common with mobile networks), they'll appear as a new user. Consider adding optional account creation for persistent identity across IP changes.

## Support

For issues or questions:
1. Check the server logs
2. Check browser console for errors
3. Review this documentation
4. Contact the development team

## License

Same as the main Tanda Quiz application.

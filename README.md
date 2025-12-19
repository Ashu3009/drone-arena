# Drone Arena

Drone combat tournament management system with real-time telemetry and performance analysis.

## Quick Setup

### 1. Install Dependencies
```bash
cd backend && npm install
cd ../frontend && npm install
```

### 2. Environment Configuration

Three environments available:
- **Development** (MongoDB Atlas)
- **Local** (Offline MongoDB)
- **Production** (MongoDB Atlas)

Copy `.env.example` and configure:
```bash
cd backend
cp .env.example .env.local
```

### 3. Local MongoDB Setup (Offline Demo)

Install MongoDB Community Edition:
1. Download from: https://www.mongodb.com/try/download/community
2. Install with default settings
3. Start MongoDB service:
   ```bash
   net start MongoDB
   ```

### 4. Run Application

**Quick Start (Double-Click):**
- **Local Offline Demo:** Double-click `START-DRONE-ARENA-AUTO.bat` (Auto-starts MongoDB)
- **Development Mode:** Double-click `start-drone-arena-dev.bat` (Uses Atlas)
- **Stop Application:** Double-click `stop-drone-arena.bat`

**Manual Start (Command Line):**
```bash
# Development (Atlas)
cd backend && npm run dev
cd frontend && npm start

# Local Offline
cd backend && npm run start:local
cd frontend && npm start

# Production
cd backend && npm run start:prod
cd frontend && npm start
```

## Environment Files

- `.env.development` - Atlas cloud database
- `.env.local` - Local offline MongoDB
- `.env.production` - Production Atlas
- `.env.example` - Template (safe to commit)

**Never commit actual `.env` files to git!**

## Key Features

- Real-time drone telemetry via Socket.IO
- Performance analysis and scoring
- Tournament management
- Team/pilot tracking
- PDF report generation
- Mobile-responsive UI

## Tech Stack

- **Backend:** Node.js, Express, Socket.IO, MongoDB
- **Frontend:** React, Socket.IO Client
- **Database:** MongoDB (Atlas/Local)

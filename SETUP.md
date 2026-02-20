# Setup Instructions - RFQ Management Platform

## Prerequisites

Before you begin, ensure you have the following installed:

### Required Software
1. **Node.js** (v18 or higher)
   - Download: https://nodejs.org/
   - Verify: `node --version`

2. **PostgreSQL** (v14 or higher)
   - Download: https://www.postgresql.org/download/
   - Or use Docker: `docker run --name rfq-postgres -e POSTGRES_PASSWORD=postgres -p 5432:5432 -d postgres`
   - Verify: `psql --version`

3. **npm** or **yarn** (comes with Node.js)
   - Verify: `npm --version`

### Optional
- **Git** (for version control)
- **VS Code** (recommended IDE)

---

## Installation Steps

### 1. Install Node.js Dependencies

#### Root Project
```bash
cd "/Users/changeagent/Documents/Project 1 CC"
npm install
```

#### Backend
```bash
cd backend
npm install
```

#### Frontend
```bash
cd frontend
npm install
```

---

### 2. Database Setup

#### Create PostgreSQL Database
```bash
# Connect to PostgreSQL
psql -U postgres

# Create database
CREATE DATABASE rfq_platform;

# Create user (optional)
CREATE USER rfq_user WITH PASSWORD 'your_password';
GRANT ALL PRIVILEGES ON DATABASE rfq_platform TO rfq_user;

# Exit
\q
```

#### Configure Environment Variables

**Backend** ([backend/.env](backend/.env)):
```bash
# Copy example file
cd backend
cp .env.example .env

# Edit .env file with your settings
```

Update `DATABASE_URL`:
```
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/rfq_platform?schema=public"
```

**Frontend** ([frontend/.env.local](frontend/.env.local)):
```bash
# Copy example file
cd frontend
cp .env.local.example .env.local
```

---

### 3. Initialize Database with Prisma

```bash
cd backend

# Generate Prisma Client
npm run prisma:generate

# Run migrations (create tables)
npm run migrate

# (Optional) Seed database with sample data
npm run seed
```

---

### 4. Verify Installation

#### Check Backend
```bash
cd backend
npm run dev
```

Visit: http://localhost:3001/health
Should return: `{"status":"ok",...}`

#### Check Frontend
```bash
cd frontend
npm run dev
```

Visit: http://localhost:3000
Should display homepage

---

## Development Workflow

### Start Both Services
From root directory:
```bash
npm run dev
```

This runs both backend and frontend concurrently.

### Or Start Individually

**Backend only:**
```bash
cd backend
npm run dev
```

**Frontend only:**
```bash
cd frontend
npm run dev
```

---

## Database Management

### View Database in Prisma Studio
```bash
cd backend
npm run prisma:studio
```

Opens visual database editor at http://localhost:5555

### Create New Migration
```bash
cd backend
npx prisma migrate dev --name your_migration_name
```

### Reset Database (⚠️ Deletes all data)
```bash
cd backend
npx prisma migrate reset
```

---

## Project Structure

```
Project 1 CC/
├── backend/                # Express API server
│   ├── prisma/            # Database schema & migrations
│   │   └── schema.prisma  # Prisma schema
│   ├── src/
│   │   ├── routes/        # API routes
│   │   ├── controllers/   # Request handlers
│   │   ├── models/        # Business logic
│   │   ├── middleware/    # Auth, validation, etc.
│   │   ├── services/      # External services
│   │   ├── config/        # Configuration
│   │   ├── utils/         # Helper functions
│   │   └── index.ts       # Entry point
│   ├── uploads/           # File uploads (git ignored)
│   └── .env               # Environment variables
├── frontend/              # Next.js app
│   ├── src/
│   │   ├── app/          # Next.js 14 App Router
│   │   ├── components/   # React components
│   │   ├── lib/          # Utilities & API client
│   │   └── types/        # TypeScript types
│   ├── public/           # Static files
│   └── .env.local        # Environment variables
├── docs/                  # Documentation
│   ├── architecture/     # System design docs
│   ├── market-research/  # Competitor analysis
│   ├── requirements/     # MVP scope
│   └── workflows/        # Feature specifications
└── README.md
```

---

## Common Issues & Solutions

### Issue: `npm: command not found`
**Solution:** Install Node.js from https://nodejs.org/

### Issue: `psql: command not found`
**Solution:** Install PostgreSQL or use Docker container

### Issue: Database connection failed
**Solution:**
1. Ensure PostgreSQL is running: `pg_isready`
2. Check `DATABASE_URL` in [backend/.env](backend/.env)
3. Verify database exists: `psql -U postgres -l`

### Issue: Port already in use
**Solution:**
```bash
# Find process on port 3001 (backend)
lsof -i :3001
kill -9 <PID>

# Find process on port 3000 (frontend)
lsof -i :3000
kill -9 <PID>
```

### Issue: Prisma Client not generated
**Solution:**
```bash
cd backend
npx prisma generate
```

---

## Testing

### Run Backend Tests (TODO)
```bash
cd backend
npm test
```

### Run Frontend Tests (TODO)
```bash
cd frontend
npm test
```

---

## Building for Production

### Build Backend
```bash
cd backend
npm run build
```

Outputs to `backend/dist/`

### Build Frontend
```bash
cd frontend
npm run build
```

Outputs to `frontend/.next/`

### Start Production Server
```bash
# Backend
cd backend
npm start

# Frontend
cd frontend
npm start
```

---

## Deployment

### Recommended Platforms

**Backend + Database:**
- Railway.app (PostgreSQL + Node.js)
- Render.com
- AWS (EC2 + RDS)
- DigitalOcean

**Frontend:**
- Vercel (recommended for Next.js)
- Netlify
- AWS Amplify

### Environment Variables for Production

Ensure you set these in your hosting platform:

**Backend:**
- `NODE_ENV=production`
- `DATABASE_URL` (your production PostgreSQL URL)
- `JWT_SECRET` (strong random string)
- `FRONTEND_URL` (your deployed frontend URL)

**Frontend:**
- `NEXT_PUBLIC_API_URL` (your deployed backend API URL)

---

## Next Steps

1. ✅ Install prerequisites (Node.js, PostgreSQL)
2. ✅ Run `npm install` in all directories
3. ✅ Configure `.env` files
4. ✅ Initialize database with Prisma
5. ✅ Start development servers
6. 📝 Begin implementing workflows (see [docs/requirements/mvp-scope.md](docs/requirements/mvp-scope.md))

---

## Support & Documentation

- **API Documentation**: [docs/architecture/api-design.md](docs/architecture/api-design.md)
- **Database Schema**: [docs/architecture/database-schema.md](docs/architecture/database-schema.md)
- **MVP Scope**: [docs/requirements/mvp-scope.md](docs/requirements/mvp-scope.md)

---

## Quick Reference Commands

```bash
# Install dependencies
npm install                 # Root
cd backend && npm install   # Backend
cd frontend && npm install  # Frontend

# Development
npm run dev                 # Start both services
cd backend && npm run dev   # Backend only
cd frontend && npm run dev  # Frontend only

# Database
cd backend && npm run migrate           # Run migrations
cd backend && npm run prisma:studio     # View database
cd backend && npm run seed              # Seed data

# Production
cd backend && npm run build && npm start   # Backend
cd frontend && npm run build && npm start  # Frontend
```

---

*Last updated: 2026-01-29*

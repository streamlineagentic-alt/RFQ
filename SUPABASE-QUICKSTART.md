# Supabase Quick Start Guide

## ✅ Step-by-Step Setup (5 minutes)

### 1. Create Supabase Project

1. Go to https://supabase.com
2. Sign up/Login (GitHub recommended)
3. Click "New Project"
4. Fill in:
   - **Name**: `rfq-management-platform`
   - **Database Password**: Generate strong password (SAVE IT!)
   - **Region**: Choose closest to you
   - **Plan**: Free
5. Click "Create new project"
6. Wait 1-2 minutes ⏳

---

### 2. Get Your Credentials

#### A) Database Connection String

**In Supabase Dashboard:**
1. Click **Settings** (gear icon, left sidebar)
2. Click **Database**
3. Scroll to **Connection string** section
4. Copy **Connection string** (Mode: Session mode)

It looks like:
```
postgresql://postgres.[PROJECT-REF]:[YOUR-PASSWORD]@db.[PROJECT-REF].supabase.co:5432/postgres
```

⚠️ **Replace `[YOUR-PASSWORD]`** with the password you created!

#### B) API Keys

**In Supabase Dashboard:**
1. Click **Settings** (gear icon)
2. Click **API**
3. Copy these values:
   - **Project URL**: `https://[PROJECT-REF].supabase.co`
   - **anon public** key: `eyJhbGc...` (long string starting with eyJ)
   - **service_role** key: `eyJhbGc...` (different key, also starts with eyJ)

---

### 3. Update Your Configuration Files

#### A) Backend Configuration

Open: `backend/.env`

**Replace these lines:**
```bash
DATABASE_URL="postgresql://postgres.[PROJECT-REF]:[YOUR-PASSWORD]@db.[PROJECT-REF].supabase.co:5432/postgres"

NEXT_PUBLIC_SUPABASE_URL="https://[PROJECT-REF].supabase.co"
SUPABASE_ANON_KEY="your-anon-key-here"
SUPABASE_SERVICE_KEY="your-service-role-key-here"
```

**With your actual values from Step 2.**

Example (with fake values):
```bash
DATABASE_URL="postgresql://postgres.abc123xyz:MySecurePass123@db.abc123xyz.supabase.co:5432/postgres"

NEXT_PUBLIC_SUPABASE_URL="https://abc123xyz.supabase.co"
SUPABASE_ANON_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFiYzEyM3h5eiIsInJvbGUiOiJhbm9uIiwiaWF0IjoxNjQwOTk1MjAwLCJleHAiOjE5NTY1NzEyMDB9.example"
SUPABASE_SERVICE_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFiYzEyM3h5eiIsInJvbGUiOiJzZXJ2aWNlX3JvbGUiLCJpYXQiOjE2NDA5OTUyMDAsImV4cCI6MTk1NjU3MTIwMH0.example"
```

#### B) Frontend Configuration

Open: `frontend/.env.local`

**Replace these lines:**
```bash
NEXT_PUBLIC_SUPABASE_URL=https://[PROJECT-REF].supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
```

**With your Project URL and anon key from Step 2.**

---

### 4. Install Dependencies (if not done)

```bash
cd "/Users/changeagent/Documents/Project 1 CC"

# Root dependencies
npm install

# Backend dependencies
cd backend
npm install

# Frontend dependencies
cd ../frontend
npm install
```

---

### 5. Create Database Tables

```bash
cd backend

# Generate Prisma client
npm run prisma:generate

# Create all tables in Supabase
npm run migrate

# This will create all 12 tables:
# ✓ users
# ✓ categories
# ✓ suppliers
# ✓ supplier_categories
# ✓ rfqs
# ✓ rfq_suppliers
# ✓ quotes
# ✓ vendors
# ✓ inventory_items
# ✓ recommendations
# ✓ audit_log
# ✓ notifications
```

---

### 6. Verify Tables Created

**Option 1: Supabase Dashboard**
1. Go to Supabase dashboard
2. Click **Table Editor** (left sidebar)
3. You should see all 12 tables listed

**Option 2: Prisma Studio**
```bash
cd backend
npm run prisma:studio
```
Opens at http://localhost:5555 - you can view/edit data visually

---

### 7. Start Development

```bash
# From project root
cd "/Users/changeagent/Documents/Project 1 CC"
npm run dev
```

This starts:
- **Backend**: http://localhost:3001
- **Frontend**: http://localhost:3000

---

### 8. Test It Works

#### Test 1: Backend Health Check
Open browser: http://localhost:3001/health

Should see:
```json
{
  "status": "ok",
  "timestamp": "2026-01-29T...",
  "uptime": 1.234
}
```

#### Test 2: Frontend
Open browser: http://localhost:3000

Should see the RFQ Management Platform homepage.

#### Test 3: Database Connection
```bash
cd backend
npm run prisma:studio
```

If tables load, connection works! ✅

---

## 🎉 You're Done!

Your project is now connected to Supabase. Next steps:

1. Start building Workflow A (RFQ Intake)
2. Create authentication endpoints
3. Build RFQ creation form

---

## 🐛 Troubleshooting

### Error: "Can't reach database server"

**Solution**: Check your `DATABASE_URL` in `backend/.env`
- Verify password is correct (no typo)
- Verify PROJECT-REF is correct
- Make sure you removed `[YOUR-PASSWORD]` brackets

### Error: "Authentication failed"

**Solution**: Double-check your database password
1. Go to Supabase → Settings → Database
2. Click "Reset database password"
3. Update `DATABASE_URL` with new password

### Error: "SSL connection required"

**Solution**: Add `?sslmode=require` to connection string:
```
DATABASE_URL="postgresql://postgres...supabase.co:5432/postgres?sslmode=require"
```

### Can't find tables in Table Editor

**Solution**: Run migrations again:
```bash
cd backend
npm run migrate
```

### Prisma Studio shows empty database

**Solution**: You're looking at wrong database. Check `DATABASE_URL` points to Supabase.

---

## 📋 Quick Reference

### Important URLs
- **Supabase Dashboard**: https://supabase.com/dashboard
- **Your Project**: https://supabase.com/dashboard/project/[PROJECT-REF]
- **Table Editor**: https://supabase.com/dashboard/project/[PROJECT-REF]/editor
- **Database Settings**: https://supabase.com/dashboard/project/[PROJECT-REF]/settings/database

### Important Commands
```bash
# Generate Prisma client
npm run prisma:generate

# Create/update database tables
npm run migrate

# View database visually
npm run prisma:studio

# Start development servers
npm run dev

# View backend logs
cd backend && npm run dev

# View frontend logs
cd frontend && npm run dev
```

---

## 🎯 Next: Build Features

Now that Supabase is connected, you can start implementing:

1. **Authentication** (Workflow foundation)
   - User registration
   - Login
   - JWT tokens

2. **Workflow A** (RFQ Intake)
   - Create RFQ form
   - File upload
   - Metadata capture

3. **Workflow B** (Normalization)
   - Validation rules
   - JSON generation
   - Missing field detection

See [docs/requirements/mvp-scope.md](docs/requirements/mvp-scope.md) for detailed specs.

---

**Need help?** Check [SUPABASE-VERCEL-SETUP.md](SUPABASE-VERCEL-SETUP.md) for advanced setup.

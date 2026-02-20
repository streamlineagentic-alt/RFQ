# Setup Checklist - Supabase + RFQ Platform

Use this checklist to track your setup progress.

---

## Phase 1: Supabase Setup (5-10 minutes)

### Step 1: Create Supabase Account
- [ ] Go to https://supabase.com
- [ ] Sign up with GitHub, Google, or email
- [ ] Verify email (if required)

### Step 2: Create Project
- [ ] Click "New Project"
- [ ] Enter project name: `rfq-management-platform`
- [ ] Generate strong database password
- [ ] **SAVE PASSWORD SOMEWHERE SAFE** ⚠️
- [ ] Choose region (closest to you)
- [ ] Select Free plan
- [ ] Click "Create new project"
- [ ] Wait for project setup (~1-2 minutes)

### Step 3: Get Database Connection String
- [ ] In Supabase dashboard, click **Settings** (gear icon)
- [ ] Click **Database** tab
- [ ] Find "Connection string" section
- [ ] Copy **Connection string** (Session mode)
- [ ] Replace `[YOUR-PASSWORD]` with your actual password
- [ ] Save complete connection string

**Your connection string should look like:**
```
postgresql://postgres.abcxyz123:YourPassword@db.abcxyz123.supabase.co:5432/postgres
```

### Step 4: Get API Keys
- [ ] In Supabase dashboard, click **Settings**
- [ ] Click **API** tab
- [ ] Copy **Project URL** (e.g., `https://abcxyz123.supabase.co`)
- [ ] Copy **anon** **public** key (starts with `eyJhbGc...`)
- [ ] Copy **service_role** key (different key, also starts with `eyJhbGc...`)

---

## Phase 2: Project Configuration (5 minutes)

### Step 5: Update Backend Configuration
- [ ] Open: `backend/.env`
- [ ] Find line: `DATABASE_URL=`
- [ ] Paste your Supabase connection string
- [ ] Find line: `NEXT_PUBLIC_SUPABASE_URL=`
- [ ] Paste your Project URL
- [ ] Find line: `SUPABASE_ANON_KEY=`
- [ ] Paste your anon public key
- [ ] Find line: `SUPABASE_SERVICE_KEY=`
- [ ] Paste your service_role key
- [ ] Save file

### Step 6: Update Frontend Configuration
- [ ] Open: `frontend/.env.local`
- [ ] Find line: `NEXT_PUBLIC_SUPABASE_URL=`
- [ ] Paste your Project URL
- [ ] Find line: `NEXT_PUBLIC_SUPABASE_ANON_KEY=`
- [ ] Paste your anon public key
- [ ] Save file

---

## Phase 3: Install Dependencies (2-5 minutes)

### Step 7: Install Node Packages
```bash
cd "/Users/changeagent/Documents/Project 1 CC"
```

- [ ] Run: `npm install` (in root directory)
- [ ] Run: `cd backend && npm install`
- [ ] Run: `cd ../frontend && npm install`
- [ ] Wait for installations to complete

---

## Phase 4: Database Setup (2 minutes)

### Step 8: Create Database Tables
```bash
cd backend
```

- [ ] Run: `npm run prisma:generate`
  - Generates Prisma client with TypeScript types
- [ ] Run: `npm run migrate`
  - Creates all 12 tables in Supabase
- [ ] Check for success message (no errors)

**Expected output:**
```
✔ Generated Prisma Client
✔ Your database is now in sync with your schema
```

---

## Phase 5: Verify Everything Works (2 minutes)

### Step 9: Check Tables in Supabase
- [ ] Go to Supabase dashboard
- [ ] Click **Table Editor** (left sidebar)
- [ ] Verify you see these 12 tables:
  - [ ] users
  - [ ] categories
  - [ ] suppliers
  - [ ] supplier_categories
  - [ ] rfqs
  - [ ] rfq_suppliers
  - [ ] quotes
  - [ ] vendors
  - [ ] inventory_items
  - [ ] recommendations
  - [ ] audit_log
  - [ ] notifications

### Step 10: Test with Prisma Studio
```bash
cd backend
npm run prisma:studio
```

- [ ] Browser opens at http://localhost:5555
- [ ] See all 12 tables listed on left
- [ ] Click any table (should show empty table with column headers)
- [ ] Close Prisma Studio (Ctrl+C in terminal)

---

## Phase 6: Start Development (1 minute)

### Step 11: Run Development Servers
```bash
cd "/Users/changeagent/Documents/Project 1 CC"
npm run dev
```

- [ ] Backend starts on http://localhost:3001
- [ ] Frontend starts on http://localhost:3000
- [ ] No error messages in terminal

### Step 12: Test Backend
- [ ] Open browser: http://localhost:3001/health
- [ ] Should see JSON response:
```json
{
  "status": "ok",
  "timestamp": "...",
  "uptime": ...
}
```

### Step 13: Test Frontend
- [ ] Open browser: http://localhost:3000
- [ ] Should see "RFQ Management Platform" page
- [ ] Page loads without errors

---

## ✅ Setup Complete!

If all checkboxes are marked, you're ready to start development!

---

## 🐛 Troubleshooting

### Problem: Can't connect to database

**Check:**
- [ ] Is `DATABASE_URL` in `backend/.env` correct?
- [ ] Did you replace `[YOUR-PASSWORD]` with actual password?
- [ ] Did you remove the square brackets `[]`?
- [ ] Is Supabase project status "Active" in dashboard?

**Solution:**
1. Go to Supabase → Settings → Database
2. Copy connection string again
3. Make sure password is correct
4. Update `backend/.env`

---

### Problem: Migrations fail

**Error:** `Can't reach database server`

**Solution:**
```bash
# Make sure you're in backend directory
cd backend

# Check your .env file
cat .env | grep DATABASE_URL

# Try migration again
npm run migrate
```

---

### Problem: npm install fails

**Error:** `npm: command not found`

**Solution:**
1. Install Node.js from https://nodejs.org/
2. Restart terminal
3. Verify: `node --version`
4. Try again: `npm install`

---

### Problem: Tables not showing in Supabase

**Solution:**
1. Make sure migrations ran successfully
2. Check for error messages
3. Refresh Supabase Table Editor page
4. Or run: `npm run migrate` again

---

## 📋 What You Just Set Up

✅ **Supabase PostgreSQL Database**
- 12 tables for all 8 workflows
- Auto-calculating R2D tiers
- Confidence scoring system
- Full audit logging

✅ **Backend (Express + Prisma)**
- Connected to Supabase
- TypeScript configured
- Environment variables set
- Ready for API development

✅ **Frontend (Next.js)**
- Connected to backend API
- Supabase client ready
- Tailwind CSS configured
- Ready for UI development

---

## 🎯 Next Steps

Now that setup is complete:

1. **Build Authentication** (recommended first)
   - User registration endpoint
   - Login endpoint
   - JWT token generation
   - Auth middleware

2. **Build Workflow A** (RFQ Intake)
   - RFQ creation form
   - File upload handler
   - Metadata extraction
   - Database storage

3. **Test Everything**
   - Create test user
   - Create test RFQ
   - Verify data in Supabase

---

## 📚 Resources

- **Quick Start**: [SUPABASE-QUICKSTART.md](SUPABASE-QUICKSTART.md)
- **Full Guide**: [SUPABASE-VERCEL-SETUP.md](SUPABASE-VERCEL-SETUP.md)
- **MVP Scope**: [docs/requirements/mvp-scope.md](docs/requirements/mvp-scope.md)
- **API Design**: [docs/architecture/api-design.md](docs/architecture/api-design.md)
- **Database Schema**: [docs/architecture/database-schema.md](docs/architecture/database-schema.md)

---

**Questions?** Check the troubleshooting section or [SUPABASE-QUICKSTART.md](SUPABASE-QUICKSTART.md)

**Ready to code?** See [docs/requirements/mvp-scope.md](docs/requirements/mvp-scope.md) for what to build next!

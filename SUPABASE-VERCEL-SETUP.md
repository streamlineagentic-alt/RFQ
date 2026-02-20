# Supabase + Vercel Setup Guide

## Overview

This guide explains how to use **Supabase** (managed PostgreSQL) and **Vercel** (deployment platform) instead of self-hosted PostgreSQL and separate backend hosting.

**Recommended Approach**: Use Supabase as database only, keep Express backend, deploy everything to Vercel.

---

## Architecture Comparison

### Original Plan
```
Frontend (Next.js)  →  Backend (Express)  →  PostgreSQL
   Vercel                 Railway              Local/Docker
```

### New Architecture
```
Frontend (Next.js)  →  Backend (Express)  →  Supabase PostgreSQL
   Vercel                 Vercel              Supabase Cloud
```

---

## Part 1: Supabase Setup

### 1.1 Create Supabase Project

1. Go to [supabase.com](https://supabase.com)
2. Sign up (free tier includes):
   - 500MB database storage
   - 1GB file storage
   - 2GB bandwidth
   - Unlimited API requests
3. Create new project:
   - **Name**: `rfq-management-platform`
   - **Database Password**: Generate strong password (save it!)
   - **Region**: Choose closest to your users
   - **Pricing**: Free tier

### 1.2 Get Database Connection String

1. In Supabase dashboard, go to **Settings** → **Database**
2. Find **Connection string** section
3. Copy the **Connection pooling** URL (recommended for serverless)

```
postgresql://postgres.[PROJECT-REF]:[YOUR-PASSWORD]@aws-0-[REGION].pooler.supabase.com:6543/postgres?pgbouncer=true
```

**For Prisma**, use the **Direct connection** URL:
```
postgresql://postgres.[PROJECT-REF]:[YOUR-PASSWORD]@db.[PROJECT-REF].supabase.co:5432/postgres
```

### 1.3 Update Backend Configuration

**backend/.env**:
```bash
# Supabase Database URL
DATABASE_URL="postgresql://postgres.[PROJECT-REF]:[YOUR-PASSWORD]@db.[PROJECT-REF].supabase.co:5432/postgres"

# Connection pooling URL (for production/serverless)
DATABASE_URL_POOLING="postgresql://postgres.[PROJECT-REF]:[YOUR-PASSWORD]@aws-0-[REGION].pooler.supabase.com:6543/postgres?pgbouncer=true"

# Supabase Project URL (if using Supabase Auth/Storage)
NEXT_PUBLIC_SUPABASE_URL=https://[PROJECT-REF].supabase.co
SUPABASE_ANON_KEY=your-anon-key-here
SUPABASE_SERVICE_KEY=your-service-role-key-here
```

### 1.4 Run Database Migrations

```bash
cd backend

# Generate Prisma Client
npm run prisma:generate

# Run migrations to create tables in Supabase
npm run migrate

# Verify tables created
npm run prisma:studio
```

---

## Part 2: Vercel Deployment

### 2.1 Deployment Options

#### Option A: Monorepo (Recommended for Small Teams)
Deploy both frontend and backend from single repo using Vercel's monorepo support.

**Structure:**
```
Project 1 CC/
├── apps/
│   ├── frontend/  (Next.js)
│   └── backend/   (Express as Vercel serverless functions)
└── vercel.json    (monorepo config)
```

#### Option B: Separate Deployments (Easier for MVP)
Deploy frontend and backend as separate Vercel projects.

---

### 2.2 Option B: Separate Deployments (Recommended for You)

#### Deploy Frontend (Next.js)

1. **Push to GitHub**:
```bash
cd "/Users/changeagent/Documents/Project 1 CC"
git init
git add .
git commit -m "Initial commit"
git remote add origin https://github.com/yourusername/rfq-platform.git
git push -u origin main
```

2. **Connect to Vercel**:
   - Go to [vercel.com](https://vercel.com)
   - Import your GitHub repo
   - **Root Directory**: `frontend`
   - **Framework**: Next.js (auto-detected)
   - **Build Command**: `npm run build`
   - **Output Directory**: `.next`

3. **Add Environment Variables** in Vercel dashboard:
```
NEXT_PUBLIC_API_URL=https://your-backend.vercel.app/api/v1
NEXT_PUBLIC_SUPABASE_URL=https://[PROJECT-REF].supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

4. **Deploy**: Click "Deploy"

---

#### Deploy Backend (Express)

**Two approaches for backend on Vercel:**

##### Approach 1: Convert to Next.js API Routes (Simpler)

Move your Express routes to Next.js API routes:

**frontend/src/app/api/v1/auth/login/route.ts**:
```typescript
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  const body = await request.json();

  // Your Express logic here
  // Use Prisma to query database

  return NextResponse.json({ user, token });
}
```

**Benefits:**
- Single deployment
- No CORS issues
- Simpler architecture

**Trade-offs:**
- Need to convert Express routes to Next.js format
- Mixing frontend and backend code

##### Approach 2: Separate Express Backend (Your Current Structure)

Deploy Express as serverless functions using Vercel.

**1. Create `vercel.json` in backend folder:**

```json
{
  "version": 2,
  "builds": [
    {
      "src": "src/index.ts",
      "use": "@vercel/node"
    }
  ],
  "routes": [
    {
      "src": "/(.*)",
      "dest": "src/index.ts"
    }
  ]
}
```

**2. Update `backend/package.json`:**
```json
{
  "scripts": {
    "vercel-build": "prisma generate && tsc"
  }
}
```

**3. Update `backend/src/index.ts`:**
```typescript
import express from 'express';
// ... your existing imports

const app = express();

// ... your middleware and routes

// For Vercel serverless
export default app;

// For local development
if (process.env.NODE_ENV !== 'production') {
  const PORT = process.env.PORT || 3001;
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
}
```

**4. Deploy to Vercel:**
   - Import backend folder as separate project
   - **Root Directory**: `backend`
   - **Framework**: Other
   - **Build Command**: `npm run vercel-build`

**5. Add Environment Variables:**
```
DATABASE_URL=your-supabase-connection-string
DATABASE_URL_POOLING=your-supabase-pooling-string
JWT_SECRET=your-secret-key
NODE_ENV=production
FRONTEND_URL=https://your-frontend.vercel.app
```

---

## Part 3: Update Configuration Files

### 3.1 Update Backend for Vercel Serverless

**backend/prisma/schema.prisma** (add connection pooling):
```prisma
datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
  directUrl = env("DATABASE_URL")
  // Use pooling URL for serverless
  relationMode = "prisma"
}
```

### 3.2 Handle File Uploads

**Problem**: Vercel serverless functions have read-only filesystem.

**Solution**: Use Supabase Storage

**Install Supabase client**:
```bash
cd backend
npm install @supabase/supabase-js
```

**backend/src/services/storage.ts**:
```typescript
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_KEY!
);

export async function uploadFile(file: Buffer, filename: string, bucket: string = 'rfq-files') {
  const { data, error } = await supabase.storage
    .from(bucket)
    .upload(filename, file);

  if (error) throw error;

  // Get public URL
  const { data: { publicUrl } } = supabase.storage
    .from(bucket)
    .getPublicUrl(filename);

  return publicUrl;
}
```

**Update file upload routes** to use Supabase Storage instead of local disk.

---

## Part 4: Optional - Use Supabase Auth

If you want to use Supabase's built-in authentication instead of JWT:

### 4.1 Install Supabase Client (Frontend)

```bash
cd frontend
npm install @supabase/supabase-js @supabase/auth-helpers-nextjs
```

### 4.2 Create Supabase Client

**frontend/src/lib/supabase.ts**:
```typescript
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';

export const supabase = createClientComponentClient();
```

### 4.3 Replace JWT Auth with Supabase Auth

**Sign Up**:
```typescript
const { data, error } = await supabase.auth.signUp({
  email: 'user@example.com',
  password: 'password123',
  options: {
    data: {
      first_name: 'John',
      last_name: 'Doe',
      role: 'buyer'
    }
  }
});
```

**Sign In**:
```typescript
const { data, error } = await supabase.auth.signInWithPassword({
  email: 'user@example.com',
  password: 'password123'
});
```

**Get Session**:
```typescript
const { data: { session } } = await supabase.auth.getSession();
```

### 4.4 Enable Row-Level Security (RLS)

In Supabase dashboard, enable RLS policies:

```sql
-- Buyers can only see their own RFQs
CREATE POLICY "Buyers see own RFQs"
  ON rfqs FOR SELECT
  USING (auth.uid() = buyer_id);

-- Suppliers see assigned RFQs
CREATE POLICY "Suppliers see assigned RFQs"
  ON rfqs FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM rfq_suppliers
      WHERE rfq_id = rfqs.id
      AND supplier_id IN (
        SELECT id FROM suppliers WHERE user_id = auth.uid()
      )
    )
  );
```

---

## Part 5: Database Migrations on Supabase

### 5.1 Run Migrations

```bash
cd backend

# Run all migrations
npm run migrate:deploy
```

### 5.2 View Database

**Option 1**: Supabase Dashboard
- Go to **Table Editor** in Supabase dashboard
- See all tables visually

**Option 2**: Prisma Studio
```bash
npm run prisma:studio
```

---

## Part 6: Updated Deployment Workflow

### Development
```bash
# Local development (uses Supabase PostgreSQL)
npm run dev
```

### Production Deployment

**Frontend**:
```bash
git push origin main
# Vercel auto-deploys on push
```

**Backend**:
```bash
git push origin main
# Vercel auto-deploys on push
```

**Database migrations**:
```bash
# Run from local machine
cd backend
npm run migrate:deploy
```

---

## Cost Comparison

### Free Tier Limits

**Supabase Free Tier**:
- 500MB database storage
- 1GB file storage
- 2GB bandwidth/month
- Unlimited API requests
- 50,000 monthly active users

**Vercel Free Tier**:
- 100GB bandwidth/month
- 100 deployments/day
- Serverless function execution: 100GB-hours
- Fast builds
- Custom domains

**Total Cost**: $0/month for MVP! 🎉

### When You'll Need to Upgrade

**Supabase Pro** ($25/month):
- 8GB database
- 100GB file storage
- 250GB bandwidth
- Daily backups

**Vercel Pro** ($20/month):
- 1TB bandwidth
- Commercial usage
- Advanced analytics

---

## Updated Architecture Diagram

```
┌─────────────────────────────────────────────────┐
│                   Vercel                        │
│                                                 │
│  ┌─────────────────┐      ┌─────────────────┐ │
│  │  Next.js        │      │   Express       │ │
│  │  Frontend       │─────▶│   Backend       │ │
│  │  (App Router)   │      │   (Serverless)  │ │
│  └─────────────────┘      └─────────────────┘ │
│                                  │              │
└──────────────────────────────────┼──────────────┘
                                   │
                                   ▼
                    ┌──────────────────────────┐
                    │      Supabase            │
                    │                          │
                    │  ┌──────────────────┐   │
                    │  │   PostgreSQL     │   │
                    │  │   (12 tables)    │   │
                    │  └──────────────────┘   │
                    │                          │
                    │  ┌──────────────────┐   │
                    │  │   Storage        │   │
                    │  │   (RFQ files)    │   │
                    │  └──────────────────┘   │
                    │                          │
                    │  ┌──────────────────┐   │
                    │  │   Auth (opt)     │   │
                    │  └──────────────────┘   │
                    └──────────────────────────┘
```

---

## Recommended Setup for Your MVP

### Phase 1: Database Only (Start Here)
1. ✅ Create Supabase project
2. ✅ Update `DATABASE_URL` in backend/.env
3. ✅ Run Prisma migrations
4. ✅ Keep Express backend as-is
5. ✅ Deploy to Vercel (separate frontend + backend)

**Time**: 30 minutes
**Complexity**: Low
**Benefits**: No PostgreSQL installation needed

### Phase 2: File Storage (Week 2)
1. Create Supabase Storage bucket
2. Update file upload routes to use Supabase Storage
3. Remove local file storage code

**Time**: 2-3 hours
**Complexity**: Medium

### Phase 3: Supabase Auth (Optional, Month 2)
1. Install Supabase auth helpers
2. Replace JWT with Supabase Auth
3. Implement Row-Level Security
4. Add OAuth providers (Google, GitHub)

**Time**: 1-2 days
**Complexity**: High
**Benefits**: Built-in auth, social logins, better security

---

## Migration Checklist

- [ ] Create Supabase account
- [ ] Create new project
- [ ] Copy database connection string
- [ ] Update `backend/.env` with Supabase URL
- [ ] Run `npm run migrate` to create tables
- [ ] Verify tables in Supabase dashboard
- [ ] Create Vercel account
- [ ] Push code to GitHub
- [ ] Import frontend project to Vercel
- [ ] Import backend project to Vercel
- [ ] Add environment variables in Vercel
- [ ] Deploy both projects
- [ ] Test authentication flow
- [ ] Test RFQ creation
- [ ] Set up Supabase Storage (for file uploads)
- [ ] Update file upload logic

---

## Troubleshooting

### Issue: Prisma migrations fail on Supabase

**Solution**: Use direct connection URL (not pooling URL) for migrations:
```bash
DATABASE_URL="postgresql://postgres.[REF]:[PASS]@db.[REF].supabase.co:5432/postgres" npm run migrate
```

### Issue: File uploads fail on Vercel

**Solution**: Use Supabase Storage instead of local filesystem. Vercel serverless functions have read-only filesystem.

### Issue: CORS errors

**Solution**: Update CORS config in backend:
```typescript
app.use(cors({
  origin: [
    'http://localhost:3000',
    'https://your-frontend.vercel.app'
  ],
  credentials: true
}));
```

### Issue: Cold starts on Vercel

**Solution**:
- Use connection pooling URL for database
- Consider Vercel Pro for reduced cold starts
- Or use persistent connections with Railway (hybrid approach)

---

## Alternative: Hybrid Approach

**Best of both worlds:**
- **Frontend**: Vercel (fast, CDN, Next.js native)
- **Backend**: Railway ($5/month, always-on, no cold starts)
- **Database**: Supabase (managed PostgreSQL)

This avoids cold start issues while keeping deployment simple.

---

## Summary

**Recommended for MVP**:
- ✅ Use Supabase for PostgreSQL database
- ✅ Deploy frontend to Vercel
- ✅ Deploy backend to Vercel (or Railway if cold starts are issue)
- ✅ Keep Express + JWT initially
- ⏭️ Add Supabase Storage later (Phase 2)
- ⏭️ Consider Supabase Auth later (Phase 3)

**Benefits**:
- No database installation/management
- Free tier covers MVP needs
- Easy deployment (git push = deploy)
- Scales automatically
- Professional infrastructure

**Time to deploy**: ~1 hour for initial setup

---

*Next: Follow [SETUP.md](SETUP.md) but use Supabase connection string instead of local PostgreSQL*

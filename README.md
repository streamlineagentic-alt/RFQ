# RFQ Management Platform - MVP

A modern Request for Quote (RFQ) management system focused on supplier matching, quote comparison, and inventory readiness tracking.

## Project Status: Foundation Complete ✅

✅ **Phase 0 - Research & Planning**: Market research, documentation, competitive analysis complete
✅ **Phase 0.5 - Project Setup**: Database schema, API design, project structure initialized
🔄 **Phase 1 - Core Development**: Ready to implement RFQ workflows

**See [SETUP.md](SETUP.md) for installation instructions.**

---

## Technology Stack

- **Backend**: Node.js + Express
- **Database**: PostgreSQL (with JSONB for flexible metadata)
- **Frontend**: Next.js (React + TypeScript)
- **Deployment Options**:
  - **Recommended**: Supabase (database) + Vercel (frontend + backend) ⭐
  - **Alternative**: Self-hosted PostgreSQL + Railway/AWS

---

## Core Features (MVP)

### 🔵 A) RFQ Intake
Upload RFQs via PDF/Excel/Text or use guided forms. Captures metadata (industry, category, delivery country, delivery window).

### 🔵 B) Technical Normalization
Rule-based extraction with form inputs. Outputs normalized spec sheet (HTML/PDF) and machine-readable JSON. Flags missing fields and contradictions.

### 🔵 C) Supplier Matching
Maintain supplier database with categories, regions, compliance flags. Rule-based scoring (category match, region, export compliance, responsiveness). Outputs ranked supplier list.

### 🔵 D) RFQ Distribution & Tracking
Assign RFQs to suppliers. Track 5 states: Assigned → Acknowledged → Quoting → Submitted → Declined. Automated reminder stubs.

### 🔵 E) Quote Intake & Normalization
Suppliers submit via structured form (price, currency, lead time, incoterm, scope, warranty, validity). Buyer can edit fields.

### 🔵 F) Quote Comparison Dashboard
Side-by-side table highlighting best price, fastest ship, balanced option. Risk flags for missing/invalid data. CSV export.

### 🟢 G) Inventory "Ready to Deliver" (R2D) - **Unique Feature**
Ingest vendor inventory (CSV/XLSX). Define R2D tiers:
- **R2D-0**: Ships 0-3 business days
- **R2D-1**: Ships 4-10 business days
- **R2D-2**: Ships 11-30 days

Freshness engine with confidence scores (0.2-0.9) based on verification method. Auto-expire stale data (72h/14d).

### 🟢 H) Procurement Recommendations
Generate recommendation cards with top 2-3 options, reason codes (price/lead-time/scope/risk), editable notes. Assistive wording (not "automated decision").

---

## Documentation

### 📁 Market Research
- **[Existing Platforms](docs/market-research/existing-platforms.md)**: Analysis of SAP Ariba, Coupa, Thomasnet, JAGGAER, GEP SMART
- **[Tech Stack Analysis](docs/market-research/tech-stack-analysis.md)**: How they built their platforms (architecture, technologies, patterns)
- **[Feature Comparison](docs/market-research/feature-comparison.md)**: Feature matrix comparing all platforms across A-H workflows
- **[Lessons Learned](docs/market-research/lessons-learned.md)**: Key insights and recommendations for our MVP

### 📁 Requirements
- **[MVP Scope](docs/requirements/mvp-scope.md)**: Detailed specification of all 8 workflows, success criteria, definition of done

### 📁 Architecture
- **[Database Schema](docs/architecture/database-schema.md)**: Complete PostgreSQL schema with Prisma ORM
- **[API Design](docs/architecture/api-design.md)**: RESTful API endpoints for all 8 workflows
- System architecture (in development)

### 📁 Workflows (Coming Soon)
- Detailed workflow documentation for each feature (A-H)

---

## Key Differentiators

### 🚀 R2D Tiers + Confidence Scoring
No existing platform has sophisticated readiness tier tracking with confidence scores based on verification freshness.

### 🚀 Transparent AI Approach
Assistive recommendations, not black-box decisions. Buyer always has final say.

### 🚀 Modern Stack
Next.js + PostgreSQL = faster development than legacy enterprise platforms.

### 🚀 Mid-Market Focus
Simpler than SAP Ariba, more focused than full S2P suites. <1 hour onboarding vs weeks for enterprise platforms.

---

## Competitive Landscape

| Platform | Type | Target Market | Differentiation |
|----------|------|--------------|----------------|
| **SAP Ariba** | Full S2P Suite | Enterprise | AI-native rebuild (Feb 2026) |
| **Coupa** | Procurement Platform | Mid-to-Enterprise | Community.ai benchmarking |
| **Thomasnet** | Supplier Discovery | Procurement/Engineers | 100M+ product database |
| **JAGGAER** | S2P Suite | Enterprise | 10+ years AI/ML investment |
| **GEP SMART** | Procurement Platform | Enterprise | Mobile-native, MINERVA AI |
| **Our MVP** | RFQ Management | Mid-Market | R2D innovation + modern stack |

---

## Development Phases

### ✅ Phase 0: Research & Planning (Complete)
- ✅ Market research on 5 major platforms
- ✅ Feature comparison and gap analysis
- ✅ Technology stack decisions
- ✅ MVP scope definition
- ✅ Database schema design (12 tables, Prisma ORM)
- ✅ API endpoint design (40+ routes)
- ✅ Project structure initialized (Next.js + Express)
- ✅ Configuration files created

### 🔄 Phase 1: Core RFQ Workflow (In Progress)
- A) RFQ Intake
- B) Normalization
- C) Supplier Matching
- D) Distribution & Tracking

### 📋 Phase 2: Quote Management
- E) Quote Intake & Normalization
- F) Comparison Dashboard

### 📋 Phase 3: Inventory & Recommendations
- G) Inventory R2D
- H) Procurement Recommendations

### 📋 Phase 4: Polish & Launch
- Testing
- Documentation
- Deployment
- User onboarding

---

## Key Lessons from Market Research

1. **Forms > File Uploads**: All successful platforms prioritize structured data entry
2. **Rule-Based First**: JAGGAER took 10 years to evolve from rules to AI/ML
3. **Supplier Portal is Essential**: Self-service reduces buyer workload
4. **Side-by-Side Comparison**: Universal UX pattern for quote comparison
5. **Start Simple**: Coupa started with Ruby on Rails (2006), became $8B company
6. **R2D is Our Edge**: No competitor has this level of inventory freshness tracking
7. **Transparent AI**: "Consider these options" not "You should select this"
8. **CSV Export**: Builds trust, prevents vendor lock-in
9. **Mobile-Responsive**: GEP SMART shows mobile-first matters
10. **Iterate Based on Users**: All platforms evolved over 10-20 years

---

## Success Metrics (MVP Launch)

### User Adoption
- 10+ buyers create accounts
- 50+ RFQs submitted in first month
- 100+ quotes received
- 20+ suppliers registered

### Quality Metrics
- 80%+ RFQs have normalized data
- 90%+ quotes have all required fields
- <5% buyer edits to auto-normalized data

### Performance
- 95% uptime
- <3 second page loads
- Zero critical security issues

---

## Getting Started

### Prerequisites

**Option A: Local Development** (Self-hosted)
- Node.js v18+ ([installation guide](SETUP.md#prerequisites))
- PostgreSQL v14+ ([installation guide](SETUP.md#prerequisites))

**Option B: Cloud Development** (Recommended for Quick Start ⭐)
- Node.js v18+
- Supabase account (managed PostgreSQL - no installation needed!)
- See [SUPABASE-VERCEL-SETUP.md](SUPABASE-VERCEL-SETUP.md)

### Quick Start (Option A: Local)
```bash
# 1. Install dependencies
npm install
cd backend && npm install
cd ../frontend && npm install

# 2. Set up database
cd backend
cp .env.example .env
# Edit .env with your PostgreSQL connection string
npm run migrate

# 3. Start development servers
cd ..
npm run dev
```

### Quick Start (Option B: Supabase ⭐ Recommended)
```bash
# 1. Create Supabase project at supabase.com
# 2. Copy database connection string

# 3. Install dependencies
npm install
cd backend && npm install
cd ../frontend && npm install

# 4. Configure database
cd backend
cp .env.example .env
# Paste Supabase connection string
npm run migrate

# 5. Start development
cd ..
npm run dev
```

**Full setup instructions**:
- **Local PostgreSQL**: [SETUP.md](SETUP.md)
- **Supabase + Vercel**: [SUPABASE-VERCEL-SETUP.md](SUPABASE-VERCEL-SETUP.md) ⭐

---

## Next Steps for Development

1. ✅ **Install Node.js and PostgreSQL** (see [SETUP.md](SETUP.md))
2. ✅ **Run `npm install`** in root, backend, and frontend
3. ✅ **Configure `.env` files** with database credentials
4. ✅ **Run database migrations** with `npm run migrate`
5. 📝 **Implement Workflow A** (RFQ Intake) - authentication, file upload, form handling
6. 📝 **Implement Workflow B** (Normalization) - validation rules, JSON generation
7. 📝 **Continue with C-H workflows** per [MVP Scope](docs/requirements/mvp-scope.md)

---

## License

TBD

---

## Contact

Project Owner: TBD

---

*Last Updated: 2026-01-29*

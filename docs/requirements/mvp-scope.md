# RFQ Management MVP - Scope Definition

## Project Vision
Build a modern, focused RFQ (Request for Quote) management platform that streamlines procurement workflows with emphasis on supplier matching, quote comparison, and inventory readiness tracking.

## Target Users
- **Primary**: Procurement teams at mid-market companies
- **Secondary**: Suppliers who respond to RFQs
- **Tertiary**: Inventory vendors providing ready-to-deliver items

## Technology Stack (Decided)
- **Backend**: Node.js + Express/Fastify
- **Database**: PostgreSQL
- **Frontend**: Next.js (React + TypeScript)
- **Priority**: Full vertical slice (A→B→C→D→E→F), then G and H

---

## CORE WORKFLOWS

### A) RFQ Intake
**Goal**: Capture and store RFQ requests with structured metadata

**Features**:
- Upload RFQ as PDF/Excel/Text OR fill guided form
- Extract metadata:
  - Industry
  - Category
  - Project name
  - Delivery country
  - Requested delivery window
- Store original file and create "Normalized RFQ" record

**MVP Implementation**:
- ✓ Guided form (primary path)
- ✓ File upload (PDF, Excel, text - secondary)
- ✓ Manual metadata entry
- ~ Lightweight Excel parsing (basic)
- ✗ AI extraction (Phase 2)

**Success Criteria**:
- Buyer can create RFQ in <5 minutes via form
- All metadata fields captured
- Files stored with database reference

---

### B) Technical Normalization (MVP Level)
**Goal**: Convert RFQ data into standardized format for supplier matching

**Features**:
- Rule-based "extractor" that:
  - Captures key fields via form inputs (preferred)
  - Optional lightweight parsing for Excel
- Output:
  1. Human-readable normalized spec sheet (HTML/PDF export later)
  2. Machine-readable JSON parameters
- Flag missing fields and contradictions (simple rules)

**MVP Implementation**:
- ✓ Form-based data capture (primary)
- ✓ Validation rules (required fields)
- ✓ Contradiction detection (e.g., delivery date before today)
- ✓ JSON output for machine processing
- ✓ HTML view for human review
- ~ PDF export (Phase 1.5)
- ✗ AI-powered extraction (Phase 2)

**Validation Rules**:
- Required fields: category, delivery country, delivery window
- Contradictions: delivery date in past, zero quantity
- Warnings: vague descriptions, missing technical specs

**Success Criteria**:
- 100% of RFQs have normalized JSON
- Missing field flags visible to buyer
- HTML spec sheet readable by non-technical users

---

### C) Supplier Matching
**Goal**: Automatically identify and rank suitable suppliers for each RFQ

**Features**:
- Maintain supplier database with:
  - Categories served
  - Regions served
  - Supplier type: OEM / Distributor / Reseller
  - Compliance flags: can export to Ukraine? (boolean)
- Matching v1 = rule-based scoring:
  - Category match (mandatory)
  - Region match (boost)
  - Export/compliance match (boost)
  - Historical responsiveness score (optional, start as static field)
- Output: ranked list of suppliers for each RFQ

**MVP Implementation**:
- ✓ Supplier database (CRUD)
- ✓ Category taxonomy (simple list to start)
- ✓ Region coverage (multi-select)
- ✓ Compliance flags (export to Ukraine, etc.)
- ✓ Rule-based scoring algorithm
- ✓ Ranked list output
- ~ Historical responsiveness (static field, manual entry)
- ✗ ML-based scoring (Phase 3)

**Scoring Algorithm (Rule-Based)**:
```
Base Score = 0
+ Category exact match: +100 (mandatory, else exclude)
+ Region match: +50
+ Export compliance match: +30
+ Responsiveness score (1-5): +20 per point
= Total Score
```

**Success Criteria**:
- 10+ suppliers in database
- Category match 100% accurate
- Ranked list shows top 5 suppliers minimum
- Score explanation visible to buyer

---

### D) RFQ Distribution & Tracking
**Goal**: Assign RFQs to suppliers and track their progress

**Features**:
- "Assign RFQ to suppliers" button
- Track statuses: Assigned → Acknowledged → Quoting → Submitted → Declined
- Automated reminders (background job stub)

**MVP Implementation**:
- ✓ Manual assignment (select from ranked list)
- ✓ 5-state status tracking
- ✓ Status change timestamps
- ✓ Email notification on assignment (basic)
- ~ Automated reminders (stub/placeholder)
- ✗ Real-time updates (WebSockets in Phase 2)

**Status States**:
1. **Assigned**: RFQ sent to supplier
2. **Acknowledged**: Supplier confirmed receipt
3. **Quoting**: Supplier working on quote
4. **Submitted**: Quote submitted by supplier
5. **Declined**: Supplier declined to quote

**Success Criteria**:
- Buyer can assign RFQ to multiple suppliers
- Status updates visible in dashboard
- Email sent on assignment
- Suppliers can update their own status

---

### E) Quote Intake & Normalization
**Goal**: Capture supplier quotes in standardized format

**Features**:
- Suppliers upload quotes (PDF/Excel) OR fill structured quote form (mandatory MVP path)
- Normalize into standard fields:
  - Price, currency
  - Lead time (ship date and/or weeks)
  - Incoterm
  - Scope inclusions/exclusions (text)
  - Warranty (months)
  - Validity date
- Allow Buyer to edit fields

**MVP Implementation**:
- ✓ Structured quote form (mandatory for suppliers)
- ✓ File attachment (optional supporting docs)
- ✓ All standard fields captured
- ✓ Buyer edit capability
- ✓ Validation rules (e.g., price > 0)
- ~ Version history (Phase 1.5)
- ✗ AI extraction from uploaded quotes (Phase 2)

**Required Quote Fields**:
- Price (numeric)
- Currency (dropdown: USD, EUR, UAH, etc.)
- Lead time (ship date OR weeks to ship)
- Incoterm (dropdown: EXW, FOB, CIF, DDP, etc.)
- Scope description (text)
- Warranty (months, optional)
- Validity date (date picker)

**Success Criteria**:
- Supplier can submit quote via form in <10 minutes
- 100% of quotes have price + lead time
- Buyer can edit any field
- Validation prevents incomplete submissions

---

### F) Quote Comparison Dashboard
**Goal**: Enable buyers to compare quotes side-by-side

**Features**:
- Side-by-side table across suppliers
- Highlight:
  - Best price
  - Fastest ship
  - "Balanced option" (simple weighted score)
- Risk flags:
  - Lead time missing or vague
  - Scope missing
  - Expired validity
- Export to CSV

**MVP Implementation**:
- ✓ Table view with all quotes for RFQ
- ✓ Auto-highlight best price (lowest)
- ✓ Auto-highlight fastest ship (earliest date)
- ✓ Weighted score calculation (simple)
- ✓ Risk flags (red icons/text)
- ✓ CSV export
- ~ Excel export (Phase 1.5)
- ✗ Charts/graphs (Phase 2)

**Weighted Score Formula**:
```
Normalized Price (0-100) = (Max Price - Quote Price) / (Max - Min) * 100
Normalized Lead Time (0-100) = (Max Lead - Quote Lead) / (Max - Min) * 100
Balanced Score = (Price * 0.6) + (Lead Time * 0.4)
```

**Risk Flags**:
- 🔴 Lead time missing
- 🔴 Scope field empty/too short (<50 chars)
- 🔴 Validity date expired
- 🟡 Price outlier (>2x median)
- 🟡 Warranty not specified

**Success Criteria**:
- All quotes visible in one table
- Best price/lead time visually obvious
- CSV export includes all quote data
- Risk flags help buyer identify issues

---

### G) Inventory "Ready to Deliver" (R2D)
**Goal**: Track vendor inventory with readiness tiers and freshness

**Features**:
- Ingest vendor inventory lists (CSV/XLSX upload; API later)
- Define R2D rules:
  - R2D-0: ships 0–3 business days
  - R2D-1: ships 4–10 business days
  - R2D-2: ships 11–30 days
- Each inventory item must have:
  - Vendor, vendor_sku, OEM, MPN/model
  - Description, category
  - Qty available + UOM
  - Status (Available/Reserved/Sold/Unknown)
  - Ship_from location
  - Earliest_ship_date
  - Condition (New/Surplus New/Refurb/Used)
  - Last_verified timestamp
  - Verification_method (feed/file/manual)
- Freshness engine:
  - High velocity categories expire from R2D view after 72h if not updated
  - Others after 14 days
- Show "Verified X hours/days ago" + confidence score:
  - API feed: 0.9
  - Scheduled file: 0.7
  - Manual confirmation: 0.5
  - Stale: 0.2

**MVP Implementation**:
- ✓ CSV/XLSX upload
- ✓ All required fields captured
- ✓ R2D tier calculation based on earliest_ship_date
- ✓ Freshness tracking (72h / 14d auto-expiry)
- ✓ Confidence scoring (4 levels)
- ✓ Filter by R2D tier
- ✓ "Verified X ago" display
- ~ API ingestion (Phase 2)
- ✗ Real-time inventory sync (Phase 3)

**High Velocity Categories**:
- Electronics (semiconductors, components)
- Medical supplies (PPE, consumables)
- Industrial fasteners (bolts, screws)
(Configurable in admin panel)

**Success Criteria**:
- Vendor can upload 1000+ items via CSV
- R2D tier calculated correctly
- Stale items auto-hide from search
- Confidence score visible to buyer

---

### H) Procurement Recommendation Summary
**Goal**: Provide buyers with AI-assisted decision support

**Features**:
- Generate short recommendation card:
  - Top 2–3 options
  - Reason codes: price/lead-time/scope/risk
  - Notes editable by Buyer
- Ensure wording is assistive (NOT "automated decision")

**MVP Implementation**:
- ✓ Rule-based recommendation engine
- ✓ Top 3 options with scores
- ✓ Reason codes (best price, fastest ship, balanced)
- ✓ Editable buyer notes section
- ✓ Assistive wording ("Consider these options...")
- ✗ AI-generated summaries (Phase 2)

**Recommendation Logic**:
1. **Best Price**: Lowest total cost
2. **Fastest Delivery**: Earliest ship date
3. **Balanced**: Highest weighted score (60% price, 40% lead time)

**Assistive Wording Examples**:
- ✓ "Consider these suppliers based on your priorities..."
- ✓ "The following options may meet your requirements..."
- ✗ "You should select Supplier A" (too prescriptive)
- ✗ "Automated recommendation: Supplier B" (sounds robotic)

**Success Criteria**:
- Recommendations visible on comparison page
- Buyer can see reasoning for each recommendation
- Buyer notes save with RFQ
- Language is helpful, not dictatorial

---

## Out of Scope (Post-MVP)

### Phase 2 (3-6 months)
- AI extraction (GPT-4V for PDF/Excel parsing)
- Real-time status updates (WebSockets)
- Advanced analytics dashboard
- Email template customization
- Mobile-responsive improvements
- Version history for quotes/RFQs
- Audit trail for compliance

### Phase 3 (6-12 months)
- ML-based supplier scoring
- API for inventory feeds
- ERP integrations (QuickBooks, Xero)
- Multi-language support
- Native mobile apps
- Workflow automation (Zapier)
- Advanced reporting (charts, trends)

### Not Planned
- Full S2P suite (procurement, invoicing, payments)
- Supplier onboarding automation
- Contract management
- Bid optimization algorithms
- Blockchain-based supply chain tracking

---

## Non-Functional Requirements

### Performance
- Page load: <2 seconds
- File upload: Support up to 10MB
- Database queries: <500ms for listings
- Concurrent users: 50+ (MVP)

### Security
- HTTPS only
- JWT authentication
- Role-based access control (Buyer, Supplier, Admin)
- SQL injection prevention (parameterized queries)
- XSS protection (input sanitization)
- File upload validation (type, size)

### Scalability (Future)
- Database indexing on key fields
- Redis caching for supplier searches
- CDN for file storage (S3)
- Load balancing (when >1000 users)

### Usability
- Mobile-responsive design
- Accessible (WCAG 2.1 AA target)
- <5 clicks to create RFQ
- <10 clicks to submit quote
- Clear error messages
- Progress indicators for multi-step forms

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

### User Feedback
- Net Promoter Score (NPS) >30
- 70%+ find comparison dashboard helpful
- 80%+ prefer form entry over file upload

---

## Timeline (Not Time Estimates, Just Phases)

### Phase 1: Core RFQ Workflow
- A) RFQ Intake
- B) Normalization
- C) Supplier Matching
- D) Distribution & Tracking

### Phase 2: Quote Management
- E) Quote Intake
- F) Comparison Dashboard

### Phase 3: Inventory & Recommendations
- G) Inventory R2D
- H) Recommendations

### Phase 4: Polish & Launch
- Testing
- Documentation
- Deployment
- User onboarding

---

## Key Risks & Mitigations

| Risk | Impact | Mitigation |
|------|--------|-----------|
| File parsing complexity | High | Focus on forms, files secondary |
| Supplier adoption | High | Simple supplier portal, email fallback |
| Data quality (RFQs) | Medium | Strong validation, required fields |
| Performance (large inventories) | Medium | Pagination, indexing, caching |
| Feature creep | High | Strict MVP scope, post-MVP backlog |
| AI extraction accuracy | Low | Not MVP, use forms instead |

---

## Definition of Done (MVP)

✅ All 8 workflows (A-H) implemented
✅ Buyer and Supplier roles functional
✅ Database schema supports all data models
✅ File uploads work (PDF, Excel, CSV)
✅ Quote comparison highlights best options
✅ R2D tiers and confidence scores working
✅ CSV export functional
✅ Mobile-responsive UI
✅ No critical security vulnerabilities
✅ Deployed to production environment
✅ User documentation written

---

## References
- [Existing Platforms Analysis](../market-research/existing-platforms.md)
- [Tech Stack Analysis](../market-research/tech-stack-analysis.md)
- [Feature Comparison](../market-research/feature-comparison.md)

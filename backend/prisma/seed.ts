import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();
const SALT_ROUNDS = 10;
const PASSWORD = 'Demo1234!';

async function main() {
  console.log('🌱 Seeding demo data...');

  const hash = await bcrypt.hash(PASSWORD, SALT_ROUNDS);

  // ─── Categories ───────────────────────────────────────────────────────────
  const cats = await Promise.all([
    prisma.category.upsert({ where: { slug: 'wellhead-equipment' },    update: {}, create: { name: 'Wellhead & Christmas Tree Equipment', slug: 'wellhead-equipment',    description: 'API 6A wellheads, Christmas trees, casing heads' } }),
    prisma.category.upsert({ where: { slug: 'valves-actuators' },      update: {}, create: { name: 'Valves & Actuators',                   slug: 'valves-actuators',      description: 'Gate, ball, check, butterfly and control valves' } }),
    prisma.category.upsert({ where: { slug: 'drilling-equipment' },    update: {}, create: { name: 'Drilling Equipment',                   slug: 'drilling-equipment',    description: 'Drill bits, BHA, mud pumps, derricks' } }),
    prisma.category.upsert({ where: { slug: 'pipeline-fittings' },     update: {}, create: { name: 'Pipeline & Fittings',                  slug: 'pipeline-fittings',     description: 'Line pipe, flanges, elbows, reducers' } }),
    prisma.category.upsert({ where: { slug: 'pumps-compressors' },     update: {}, create: { name: 'Pumps & Compressors',                  slug: 'pumps-compressors',     description: 'Centrifugal, reciprocating, screw compressors' } }),
    prisma.category.upsert({ where: { slug: 'safety-ppe' },            update: {}, create: { name: 'Safety & PPE',                         slug: 'safety-ppe',            description: 'Fire & gas detection, PPE, emergency equipment' } }),
    prisma.category.upsert({ where: { slug: 'instrumentation' },       update: {}, create: { name: 'Instrumentation & Control',            slug: 'instrumentation',       description: 'Pressure transmitters, flow meters, PLCs, SCADA' } }),
  ]);

  const [catWellhead, catValves, catDrilling, catPipeline, catPumps, catSafety, catInstrumentation] = cats;
  console.log(`  ✓ ${cats.length} categories`);

  // ─── Users ─────────────────────────────────────────────────────────────────
  const adminUser = await prisma.user.upsert({
    where: { email: 'admin@demo.com' },
    update: {},
    create: { email: 'admin@demo.com', passwordHash: hash, role: 'admin', firstName: 'Platform', lastName: 'Admin', companyName: 'ProSource Platform', isActive: true, emailVerified: true },
  });

  const buyerUser = await prisma.user.upsert({
    where: { email: 'buyer@petrotech.com' },
    update: {},
    create: { email: 'buyer@petrotech.com', passwordHash: hash, role: 'buyer', firstName: 'James', lastName: 'Hartley', companyName: 'PetroTech International', isActive: true, emailVerified: true },
  });

  const s1User = await prisma.user.upsert({
    where: { email: 'supplier@valvecorp.com' },
    update: {},
    create: { email: 'supplier@valvecorp.com', passwordHash: hash, role: 'supplier', firstName: 'Klaus', lastName: 'Bauer', companyName: 'ValveCorp Industries', isActive: true, emailVerified: true },
  });

  const s2User = await prisma.user.upsert({
    where: { email: 'supplier@drillpro.com' },
    update: {},
    create: { email: 'supplier@drillpro.com', passwordHash: hash, role: 'supplier', firstName: 'Mike', lastName: 'Sanders', companyName: 'DrillPro Equipment', isActive: true, emailVerified: true },
  });

  const s3User = await prisma.user.upsert({
    where: { email: 'supplier@pipelinespec.com' },
    update: {},
    create: { email: 'supplier@pipelinespec.com', passwordHash: hash, role: 'supplier', firstName: 'Fiona', lastName: 'Clarke', companyName: 'PipelineSpec Ltd', isActive: true, emailVerified: true },
  });

  const s4User = await prisma.user.upsert({
    where: { email: 'supplier@gulfequip.com' },
    update: {},
    create: { email: 'supplier@gulfequip.com', passwordHash: hash, role: 'supplier', firstName: 'Ahmed', lastName: 'Al-Rashid', companyName: 'Gulf Equipment Solutions', isActive: true, emailVerified: true },
  });

  console.log('  ✓ 6 users (admin, buyer, 4 suppliers)');

  // ─── Supplier Profiles ─────────────────────────────────────────────────────
  const sup1 = await prisma.supplier.upsert({
    where: { userId: s1User.id },
    update: {},
    create: {
      userId: s1User.id, companyName: 'ValveCorp Industries', supplierType: 'OEM',
      description: 'Leading manufacturer of API-certified gate, ball and check valves for upstream and midstream oil & gas applications.',
      website: 'https://valvecorp-demo.com', contactName: 'Klaus Bauer',
      contactEmail: 'supplier@valvecorp.com', contactPhone: '+49 211 555 0100',
      country: 'Germany', city: 'Düsseldorf',
      certifications: ['API 6D', 'API 6A', 'ISO 9001', 'CE', 'PED'],
      regionsServed: ['Europe', 'Middle East', 'Africa'],
      canExportToUkraine: true, responsivenessScore: 5,
      averageResponseTimeHours: 8, totalRfqsReceived: 42, totalQuotesSubmitted: 38,
    },
  });

  const sup2 = await prisma.supplier.upsert({
    where: { userId: s2User.id },
    update: {},
    create: {
      userId: s2User.id, companyName: 'DrillPro Equipment', supplierType: 'Distributor',
      description: 'Full-service distributor and integrator of drilling equipment and BHA components. Stocking over 5,000 SKUs in Houston and Aberdeen.',
      website: 'https://drillpro-demo.com', contactName: 'Mike Sanders',
      contactEmail: 'supplier@drillpro.com', contactPhone: '+1 713 555 0200',
      country: 'USA', city: 'Houston',
      certifications: ['ISO 9001', 'API Q1', 'ISO 14001'],
      regionsServed: ['North America', 'Europe', 'Latin America'],
      canExportToUkraine: false, responsivenessScore: 4,
      averageResponseTimeHours: 12, totalRfqsReceived: 29, totalQuotesSubmitted: 24,
    },
  });

  const sup3 = await prisma.supplier.upsert({
    where: { userId: s3User.id },
    update: {},
    create: {
      userId: s3User.id, companyName: 'PipelineSpec Ltd', supplierType: 'OEM',
      description: 'UK-based manufacturer of pipeline fittings, flanges and special piping components to API, ASME and EN standards.',
      website: 'https://pipelinespec-demo.com', contactName: 'Fiona Clarke',
      contactEmail: 'supplier@pipelinespec.com', contactPhone: '+44 1224 555 0300',
      country: 'United Kingdom', city: 'Aberdeen',
      certifications: ['API 5L', 'ASME B16.5', 'ISO 9001', 'DNV GL', 'Lloyds'],
      regionsServed: ['Europe', 'North Sea', 'Middle East'],
      canExportToUkraine: true, responsivenessScore: 4,
      averageResponseTimeHours: 16, totalRfqsReceived: 18, totalQuotesSubmitted: 15,
    },
  });

  const sup4 = await prisma.supplier.upsert({
    where: { userId: s4User.id },
    update: {},
    create: {
      userId: s4User.id, companyName: 'Gulf Equipment Solutions', supplierType: 'Distributor',
      description: 'Dubai-based stocking distributor supplying MRO and capital equipment to operators and EPC contractors across the GCC and Caspian regions.',
      website: 'https://gulfequip-demo.com', contactName: 'Ahmed Al-Rashid',
      contactEmail: 'supplier@gulfequip.com', contactPhone: '+971 4 555 0400',
      country: 'UAE', city: 'Dubai',
      certifications: ['ISO 9001', 'ISO 14001', 'OHSAS 18001'],
      regionsServed: ['Middle East', 'Caspian', 'Central Asia'],
      canExportToUkraine: false, responsivenessScore: 3,
      averageResponseTimeHours: 24, totalRfqsReceived: 11, totalQuotesSubmitted: 8,
    },
  });

  // Supplier categories
  const scLinks = [
    { supplierId: sup1.id, categoryId: catValves.id },
    { supplierId: sup1.id, categoryId: catWellhead.id },
    { supplierId: sup2.id, categoryId: catDrilling.id },
    { supplierId: sup2.id, categoryId: catPumps.id },
    { supplierId: sup3.id, categoryId: catPipeline.id },
    { supplierId: sup3.id, categoryId: catValves.id },
    { supplierId: sup4.id, categoryId: catValves.id },
    { supplierId: sup4.id, categoryId: catSafety.id },
    { supplierId: sup4.id, categoryId: catInstrumentation.id },
  ];
  for (const link of scLinks) {
    await prisma.supplierCategory.upsert({
      where: { supplierId_categoryId: link },
      update: {}, create: link,
    });
  }
  console.log('  ✓ 4 supplier profiles');

  // ─── RFQ 1 — AWARDED ───────────────────────────────────────────────────────
  const rfq1 = await prisma.rfq.upsert({
    where: { rfqNumber: 'RFQ-2025-0041' },
    update: {},
    create: {
      buyerId: buyerUser.id, rfqNumber: 'RFQ-2025-0041',
      projectName: 'API 6A Wellhead Assembly — North Sea Expansion',
      status: 'awarded', categoryId: catWellhead.id, industry: 'Oil & Gas',
      deliveryCountry: 'Norway', deliveryCity: 'Stavanger',
      description: 'Supply of complete wellhead assembly for 4 new production wells on the Ekofisk Extension project. Equipment must comply with API 6A PSL-3 and be rated for H2S service (NACE MR0175). Full mill certificates and third-party inspection required.',
      specifications: 'Wellhead type: Mandrel hanger\nPressure rating: 5,000 psi WP\nSize: 13-5/8" x 9-5/8"\nMaterial class: EE-NL\nTemperature class: L (−46°C to +121°C)\nH2S service: Yes (NACE MR0175 compliant)\nCertification: API 6A PSL-3, CE PED\nQty: 4 complete assemblies\nDelivery: DDP Stavanger Quay',
      quantity: 4, quantityUom: 'assemblies',
      responseDeadline: new Date('2025-09-15'),
      deliveryWindowStart: new Date('2025-11-01'),
      deliveryWindowEnd: new Date('2025-12-15'),
      publishedAt: new Date('2025-08-20'),
      isNormalized: true,
    },
  });

  // RFQ suppliers for rfq1
  const rs1a = await prisma.rfqSupplier.upsert({
    where: { rfqId_supplierId: { rfqId: rfq1.id, supplierId: sup1.id } },
    update: {}, create: { rfqId: rfq1.id, supplierId: sup1.id, status: 'submitted', matchScore: 94 },
  });
  const rs1b = await prisma.rfqSupplier.upsert({
    where: { rfqId_supplierId: { rfqId: rfq1.id, supplierId: sup4.id } },
    update: {}, create: { rfqId: rfq1.id, supplierId: sup4.id, status: 'submitted', matchScore: 71 },
  });
  const rs1c = await prisma.rfqSupplier.upsert({
    where: { rfqId_supplierId: { rfqId: rfq1.id, supplierId: sup3.id } },
    update: {}, create: { rfqId: rfq1.id, supplierId: sup3.id, status: 'submitted', matchScore: 78 },
  });

  // Quotes for rfq1
  const validDate1 = new Date('2025-12-31');
  const q1a = await prisma.quote.upsert({
    where: { id: 1 }, update: {},
    create: {
      rfqSupplierId: rs1a.id, rfqId: rfq1.id, supplierId: sup1.id,
      price: 284500, currency: 'USD', leadTimeWeeks: 14,
      incoterm: 'DDP', paymentTerms: 'Net 30', validUntil: validDate1,
      warrantyMonths: 24, warrantyDescription: '24 months from commissioning',
      notes: 'API 6A PSL-3 certified. Full MTRs and third-party inspection by Bureau Veritas included. In-house H2S testing capability.',
      status: 'awarded',
    },
  });

  const q1b = await prisma.quote.upsert({
    where: { id: 2 }, update: {},
    create: {
      rfqSupplierId: rs1b.id, rfqId: rfq1.id, supplierId: sup4.id,
      price: 312000, currency: 'USD', leadTimeWeeks: 18,
      incoterm: 'CIF', paymentTerms: 'Net 45', validUntil: validDate1,
      warrantyMonths: 12, warrantyDescription: '12 months from delivery',
      notes: 'Lead time subject to mill availability. Inspection by SGS possible at additional cost.',
      status: 'rejected',
    },
  });

  const q1c = await prisma.quote.upsert({
    where: { id: 3 }, update: {},
    create: {
      rfqSupplierId: rs1c.id, rfqId: rfq1.id, supplierId: sup3.id,
      price: 296800, currency: 'USD', leadTimeWeeks: 16,
      incoterm: 'DAP', paymentTerms: 'Net 30', validUntil: validDate1,
      warrantyMonths: 18, warrantyDescription: '18 months from delivery',
      notes: 'DNV GL certified facility. Can accommodate DNV witness inspection.',
      status: 'rejected',
    },
  });

  console.log(`  ✓ RFQ-2025-0041 (awarded) — 3 quotes`);

  // ─── RFQ 2 — OPEN, 2 quotes ────────────────────────────────────────────────
  const rfq2 = await prisma.rfq.upsert({
    where: { rfqNumber: 'RFQ-2025-0057' },
    update: {},
    create: {
      buyerId: buyerUser.id, rfqNumber: 'RFQ-2025-0057',
      projectName: 'Gate Valves API 600 DN200 — Kazakhstan Pipeline',
      status: 'open', categoryId: catValves.id, industry: 'Oil & Gas',
      deliveryCountry: 'Kazakhstan', deliveryCity: 'Atyrau',
      description: 'Supply of 20 x full-bore gate valves for the Tengiz field pipeline upgrade. Valves must be API 600 trim 12 rated for sour service. NACE compliant. Delivery to Atyrau logistics hub, DDP.',
      specifications: 'Type: Bolted bonnet gate valve, full bore\nSize: DN200 (8")\nPressure class: ANSI 300#\nTrim: API 600 Trim 12 (Stainless steel)\nBody material: ASTM A216 WCB\nNACE MR0175 compliant: Yes\nEnd connection: RF flanged to ASME B16.5\nQty: 20 units\nActuation: Manual handwheel\nSpare parts kit required with each valve',
      quantity: 20, quantityUom: 'units',
      responseDeadline: new Date('2026-03-10'),
      deliveryWindowStart: new Date('2026-04-01'),
      deliveryWindowEnd: new Date('2026-04-30'),
      publishedAt: new Date('2026-02-10'),
      isNormalized: true,
    },
  });

  const rs2a = await prisma.rfqSupplier.upsert({
    where: { rfqId_supplierId: { rfqId: rfq2.id, supplierId: sup1.id } },
    update: {}, create: { rfqId: rfq2.id, supplierId: sup1.id, status: 'submitted', matchScore: 91 },
  });
  const rs2b = await prisma.rfqSupplier.upsert({
    where: { rfqId_supplierId: { rfqId: rfq2.id, supplierId: sup4.id } },
    update: {}, create: { rfqId: rfq2.id, supplierId: sup4.id, status: 'submitted', matchScore: 68 },
  });

  const validDate2 = new Date('2026-05-31');
  await prisma.quote.upsert({
    where: { id: 4 }, update: {},
    create: {
      rfqSupplierId: rs2a.id, rfqId: rfq2.id, supplierId: sup1.id,
      price: 47600, currency: 'USD', leadTimeWeeks: 8,
      incoterm: 'DDP', paymentTerms: 'Net 30', validUntil: validDate2,
      warrantyMonths: 24, warrantyDescription: '24 months from delivery',
      notes: 'Full compliance with API 600 and NACE MR0175. PMI test reports and hydrostatic test certificates included. Can deliver within 8 weeks ex-stock for 15 units; 4 weeks additional for balance.',
      status: 'submitted',
    },
  });

  await prisma.quote.upsert({
    where: { id: 5 }, update: {},
    create: {
      rfqSupplierId: rs2b.id, rfqId: rfq2.id, supplierId: sup4.id,
      price: 51200, currency: 'USD', leadTimeWeeks: 10,
      incoterm: 'CIF', paymentTerms: 'Net 45', validUntil: validDate2,
      warrantyMonths: 12, warrantyDescription: '12 months from delivery',
      notes: 'Sourced from approved European mill. Full documentation package available.',
      status: 'submitted',
    },
  });

  console.log(`  ✓ RFQ-2025-0057 (open) — 2 quotes`);

  // ─── RFQ 3 — OPEN, 1 quote ─────────────────────────────────────────────────
  const rfq3 = await prisma.rfq.upsert({
    where: { rfqNumber: 'RFQ-2026-0003' },
    update: {},
    create: {
      buyerId: buyerUser.id, rfqNumber: 'RFQ-2026-0003',
      projectName: 'Triplex Mud Pumps — Tengiz Drilling Campaign',
      status: 'open', categoryId: catPumps.id, industry: 'Oil & Gas',
      deliveryCountry: 'Kazakhstan', deliveryCity: 'Tengiz',
      description: 'Procurement of 2 x triplex mud pumps for a 6-month drilling campaign at Tengiz. Pumps must be suitable for WBM and OBM service. Complete with pulsation dampeners, suction/discharge manifolds and local control panels.',
      specifications: 'Type: Triplex single-acting reciprocating pump\nOutput power: 1,600 HP (1,200 kW)\nMax pressure: 7,500 psi\nMax stroke rate: 120 spm\nLiner sizes: 5" to 7.5"\nDrive: VFD-compatible electric motor\nMud service: WBM and OBM\nCertification: API 674, ATEX Zone 1\nQty: 2 complete units\nAccessories: Pulsation dampener, manifold set, local panel',
      quantity: 2, quantityUom: 'units',
      responseDeadline: new Date('2026-03-20'),
      deliveryWindowStart: new Date('2026-05-01'),
      deliveryWindowEnd: new Date('2026-06-15'),
      publishedAt: new Date('2026-02-15'),
    },
  });

  const rs3a = await prisma.rfqSupplier.upsert({
    where: { rfqId_supplierId: { rfqId: rfq3.id, supplierId: sup2.id } },
    update: {}, create: { rfqId: rfq3.id, supplierId: sup2.id, status: 'submitted', matchScore: 86 },
  });

  await prisma.quote.upsert({
    where: { id: 6 }, update: {},
    create: {
      rfqSupplierId: rs3a.id, rfqId: rfq3.id, supplierId: sup2.id,
      price: 1850000, currency: 'USD', leadTimeWeeks: 16,
      incoterm: 'DAP', paymentTerms: '30% advance, 70% on delivery', validUntil: new Date('2026-06-30'),
      warrantyMonths: 24, warrantyDescription: '24 months from commissioning, parts and labour',
      notes: 'Proposed model: National Oilwell Varco 14-P-220. In stock at Houston warehouse. ATEX Zone 1 certification. Full factory acceptance test (FAT) at our facility with customer witness.',
      status: 'submitted',
    },
  });

  console.log(`  ✓ RFQ-2026-0003 (open) — 1 quote`);

  // ─── RFQ 4 — DRAFT ─────────────────────────────────────────────────────────
  await prisma.rfq.upsert({
    where: { rfqNumber: 'RFQ-2026-0008' },
    update: {},
    create: {
      buyerId: buyerUser.id, rfqNumber: 'RFQ-2026-0008',
      projectName: 'ESD Valve Systems — Offshore Platform Upgrade',
      status: 'draft', categoryId: catValves.id, industry: 'Oil & Gas',
      deliveryCountry: 'United Kingdom', deliveryCity: 'Aberdeen',
      description: 'Supply of emergency shutdown (ESD) valve systems for a North Sea platform life extension project. Systems to include valves, actuators, solenoid valves and position indicators. SIL 2 rated.',
      specifications: 'Valve type: Trunnion-mounted ball valve\nSize range: DN100 to DN400\nPressure class: ANSI 600#\nActuation: Hydraulic spring-return\nFail position: Fail-close\nSIL rating: SIL 2 (IEC 61508)\nEnvironment: Offshore, ATEX Zone 1\nCertification: API 6D, ATEX, TÜV SIL 2\nQty: 12 ESD valve assemblies (mixed sizes)\nFAT: Required, third-party witness',
      quantity: 12, quantityUom: 'assemblies',
      responseDeadline: new Date('2026-04-01'),
    },
  });

  console.log(`  ✓ RFQ-2026-0008 (draft) — 0 quotes`);

  console.log('\n✅ Demo seed complete!\n');
  console.log('─────────────────────────────────────────────');
  console.log(' Login credentials (all use password: Demo1234!)');
  console.log('─────────────────────────────────────────────');
  console.log(' Admin    admin@demo.com');
  console.log(' Buyer    buyer@petrotech.com');
  console.log(' Supplier supplier@valvecorp.com      (ValveCorp Industries, DE)');
  console.log(' Supplier supplier@drillpro.com       (DrillPro Equipment, US)');
  console.log(' Supplier supplier@pipelinespec.com   (PipelineSpec Ltd, UK)');
  console.log(' Supplier supplier@gulfequip.com      (Gulf Equipment Solutions, UAE)');
  console.log('─────────────────────────────────────────────\n');
}

main()
  .catch(e => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());

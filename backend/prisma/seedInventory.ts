/**
 * Oil & Gas Inventory Seed Script
 * Run with: npx ts-node prisma/seedInventory.ts
 */
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  console.log('Seeding oil & gas inventory...');

  // Create vendors sequentially (Supabase session-mode pooler has concurrent connection limits)
  const vendorDefs = [
    { vendorCode: 'DRILTCH',   name: 'DrilTech Supply Co.',      contactEmail: 'sales@driltechsupply.com',       totalItems: 2 },
    { vendorCode: 'PETROTUBE', name: 'PetroTube International',   contactEmail: 'info@petrotube.com',             totalItems: 2 },
    { vendorCode: 'DRILLCHEM', name: 'DrillChem Solutions',       contactEmail: 'orders@drillchem.com',           totalItems: 2 },
    { vendorCode: 'FLOWCTRL',  name: 'FlowControl Industries',    contactEmail: 'sales@flowcontrolindustries.com',totalItems: 2 },
    { vendorCode: 'PIPETECH',  name: 'PipelineTech',              contactEmail: 'procurement@pipelinetech.com',   totalItems: 2 },
    { vendorCode: 'CMPHUB',    name: 'CompressorHub',             contactEmail: 'parts@compressorhub.com',        totalItems: 1 },
    { vendorCode: 'METERTECH', name: 'MeterTech Solutions',       contactEmail: 'sales@metertech.com',            totalItems: 1 },
    { vendorCode: 'HEATEX',    name: 'HeatEx Engineering',        contactEmail: 'engineering@heatex.com',         totalItems: 1 },
    { vendorCode: 'VESSELWK',  name: 'VesselWorks',              contactEmail: 'sales@vesselworks.com',           totalItems: 1 },
    { vendorCode: 'PUMPSERV',  name: 'PumpServ International',    contactEmail: 'surplus@pumpserv.com',           totalItems: 1 },
    { vendorCode: 'INSTCTRL',  name: 'InstruControl',             contactEmail: 'sales@instrucontrol.com',        totalItems: 2 },
    { vendorCode: 'TANKTECH',  name: 'TankTech',                  contactEmail: 'projects@tanktech.ae',           totalItems: 1 },
    { vendorCode: 'SAFETYFG',  name: 'SafetyFirst Global',        contactEmail: 'orders@safetyfirstglobal.com',   totalItems: 2 },
    { vendorCode: 'LIFTSAFE',  name: 'LiftSafe Equipment',        contactEmail: 'sales@liftsafe.pl',              totalItems: 1 },
    { vendorCode: 'LUBRISERV', name: 'LubriServ',                 contactEmail: 'distribution@lubriserv.be',      totalItems: 1 },
    { vendorCode: 'ELECTROPW', name: 'ElectroPower Systems',      contactEmail: 'atex@electropowersystems.ie',    totalItems: 1 },
  ];

  const vendors: any[] = [];
  for (const v of vendorDefs) {
    const vendor = await prisma.vendor.upsert({
      where: { vendorCode: v.vendorCode },
      update: {},
      create: { name: v.name, vendorCode: v.vendorCode, contactEmail: v.contactEmail, feedType: 'manual', totalItems: v.totalItems },
    });
    vendors.push(vendor);
  }

  const [driltch, petrotube, drillchem, flowctrl, pipetech, cmphub, metertech,
         heatex, vesselwk, pumpserv, instctrl, tanktech, safetyfg, liftsafe, lubriserv, electropw] = vendors;

  const now = new Date();
  const lastVerified = now;
  const verificationMethod = 'manual';

  type ItemInput = {
    vendorId: number;
    vendorSku: string;
    oem?: string;
    mpn?: string;
    description: string;
    qtyAvailable: number;
    qtyUom: string;
    status: string;
    shipFromLocation?: string;
    shipFromCountry?: string;
    earliestShipDate: Date;
    condition: string;
    price: number;
    currency: string;
    lastVerified: Date;
    verificationMethod: string;
    spec: {
      sector: string;
      productFamily?: string;
      apiStandard?: string;
      astmStandard?: string;
      otherStandard?: string;
      pressureRatingPsi?: number;
      pressureClassAnsi?: string;
      temperatureRatingMinC?: number;
      temperatureRatingMaxC?: number;
      materialGrade?: string;
      sizeNps?: number;
      sizeMm?: number;
      wallThicknessIn?: number;
      endConnection?: string;
      boreConfiguration?: string;
      actuatorType?: string;
      fluidService?: string;
      isH2sService?: boolean;
      naceCompliant?: boolean;
      exRating?: string;
      hazardClass?: string;
      unNumber?: string;
      certifications?: object;
      countryOfOrigin?: string;
      hsCode?: string;
      minOrderQty?: number;
      leadTimeDays?: number;
      incoterms?: string;
      manufacturerName?: string;
    };
  };

  const items: ItemInput[] = [
    // ===== UPSTREAM =====
    {
      vendorId: driltch.id, vendorSku: 'DTS-WHD-36-5000', oem: 'Cameron', mpn: 'C-WH-3650-FL',
      description: 'Wellhead Casing Spool 13-3/8" x 10-3/4" 5000 PSI WP API 6A BX163 ring groove',
      qtyAvailable: 4, qtyUom: 'pcs', status: 'available', shipFromLocation: 'Houston, TX', shipFromCountry: 'USA',
      earliestShipDate: new Date('2026-03-15'), condition: 'new', price: 28500, currency: 'USD',
      lastVerified, verificationMethod,
      spec: {
        sector: 'upstream', productFamily: 'Wellhead & Christmas Tree', apiStandard: 'API 6A',
        pressureRatingPsi: 5000, pressureClassAnsi: '5000#', temperatureRatingMinC: -60, temperatureRatingMaxC: 121,
        materialGrade: 'AISI 4130 NACE', sizeNps: 13.375, sizeMm: 339.73, endConnection: 'Flanged',
        boreConfiguration: 'Full Bore', fluidService: 'Oil/Gas', isH2sService: true, naceCompliant: true,
        exRating: 'ATEX Zone 1', certifications: { 'API 6A': true, 'NACE MR0175': true },
        countryOfOrigin: 'USA', hsCode: '8431.43.10', minOrderQty: 1, leadTimeDays: 60, incoterms: 'EXW',
        manufacturerName: 'Cameron',
      },
    },
    {
      vendorId: driltch.id, vendorSku: 'DTS-BOP-11-5K', oem: 'NOV', mpn: 'BOP-11-5000-SGL',
      description: 'BOP Single Ram Preventer 11" x 5000 PSI Side Outlets 3-1/16" 5000 PSI',
      qtyAvailable: 2, qtyUom: 'pcs', status: 'available', shipFromLocation: 'Houston, TX', shipFromCountry: 'USA',
      earliestShipDate: new Date('2026-04-01'), condition: 'surplus_new', price: 142000, currency: 'USD',
      lastVerified, verificationMethod,
      spec: {
        sector: 'upstream', productFamily: 'BOP Equipment', apiStandard: 'API 16A',
        pressureRatingPsi: 5000, pressureClassAnsi: '5000#', temperatureRatingMinC: -29, temperatureRatingMaxC: 121,
        materialGrade: 'AISI 4130', sizeNps: 11, sizeMm: 279.4, endConnection: 'Flanged',
        fluidService: 'Multiphase', isH2sService: true, naceCompliant: true, exRating: 'ATEX Zone 1',
        certifications: { 'API 16A': true, 'NACE MR0175': true },
        countryOfOrigin: 'USA', hsCode: '8413.50.90', minOrderQty: 1, leadTimeDays: 90, incoterms: 'EXW',
        manufacturerName: 'NOV',
      },
    },
    {
      vendorId: petrotube.id, vendorSku: 'PTI-CASING-P110-95', oem: 'TMK', mpn: 'TMK-P110-9-5/8',
      description: 'API 5CT P110 Casing 9-5/8" 47ppf R3 New Premium BTC',
      qtyAvailable: 350, qtyUom: 'joints', status: 'available', shipFromLocation: 'Ploiesti', shipFromCountry: 'Romania',
      earliestShipDate: new Date('2026-02-28'), condition: 'new', price: 1850, currency: 'USD',
      lastVerified, verificationMethod,
      spec: {
        sector: 'upstream', productFamily: 'Casing & Tubing', apiStandard: 'API 5CT', astmStandard: 'ASTM A519',
        pressureRatingPsi: 9300, temperatureRatingMaxC: 150, materialGrade: 'P110',
        sizeNps: 9.625, sizeMm: 244.48, wallThicknessIn: 0.472, endConnection: 'BTC',
        fluidService: 'Oil/Gas', isH2sService: false, naceCompliant: false,
        certifications: { 'API 5CT': true, 'PSL-1': true },
        countryOfOrigin: 'Romania', hsCode: '7304.29.10', minOrderQty: 1, leadTimeDays: 21, incoterms: 'FOB',
        manufacturerName: 'TMK',
      },
    },
    {
      vendorId: petrotube.id, vendorSku: 'PTI-TUBING-L80-35', oem: 'Tenaris', mpn: 'TEN-L80-3.5-9.3',
      description: 'API 5CT L80 Tubing 3-1/2" 9.3ppf R2 EUE 8rd - Sour Service',
      qtyAvailable: 1200, qtyUom: 'joints', status: 'available', shipFromLocation: 'Buenos Aires', shipFromCountry: 'Argentina',
      earliestShipDate: new Date('2026-03-01'), condition: 'new', price: 185, currency: 'USD',
      lastVerified, verificationMethod,
      spec: {
        sector: 'upstream', productFamily: 'Casing & Tubing', apiStandard: 'API 5CT',
        pressureRatingPsi: 10000, temperatureRatingMaxC: 121, materialGrade: 'L80',
        sizeNps: 3.5, sizeMm: 88.9, wallThicknessIn: 0.254, endConnection: 'EUE 8rd',
        fluidService: 'Oil/Gas/H2S', isH2sService: true, naceCompliant: true,
        certifications: { 'API 5CT': true, 'NACE MR0175': true },
        countryOfOrigin: 'Argentina', hsCode: '7304.39.10', minOrderQty: 1, leadTimeDays: 14, incoterms: 'FOB',
        manufacturerName: 'Tenaris',
      },
    },
    {
      vendorId: drillchem.id, vendorSku: 'DCS-DMF-BARITE', oem: 'Halliburton', mpn: 'HAL-BARITE-API',
      description: 'API-Grade Barite Drilling Fluid Weighting Agent 4.2 SG',
      qtyAvailable: 800, qtyUom: 'ton', status: 'available', shipFromLocation: 'Casablanca', shipFromCountry: 'Morocco',
      earliestShipDate: new Date('2026-02-25'), condition: 'new', price: 285, currency: 'USD',
      lastVerified, verificationMethod,
      spec: {
        sector: 'upstream', productFamily: 'Drilling Chemicals', apiStandard: 'API 13A',
        materialGrade: 'Barium Sulfate ≥97%', fluidService: 'Brine/Water',
        isH2sService: false, naceCompliant: false, hazardClass: '9', unNumber: 'UN2810',
        certifications: { 'API 13A': true, 'REACH': true },
        countryOfOrigin: 'Morocco', hsCode: '2833.27.00', minOrderQty: 25, leadTimeDays: 7, incoterms: 'CIF',
        manufacturerName: 'Halliburton',
      },
    },
    {
      vendorId: drillchem.id, vendorSku: 'DCS-PDC-655', oem: 'Smith Bits', mpn: 'SB-SDM-655-MLX',
      description: 'PDC Drill Bit 6-1/2" 5-Blade 19mm Cutters SD Series Hard Formation',
      qtyAvailable: 1, qtyUom: 'pcs', status: 'available', shipFromLocation: 'Midland, TX', shipFromCountry: 'USA',
      earliestShipDate: new Date('2026-03-10'), condition: 'new', price: 12800, currency: 'USD',
      lastVerified, verificationMethod,
      spec: {
        sector: 'upstream', productFamily: 'Drilling Equipment', apiStandard: 'API 7-1',
        materialGrade: 'Matrix Body', sizeMm: 165.1, endConnection: 'API Reg Pin',
        fluidService: 'Rock/Hard Formation', isH2sService: false, naceCompliant: false, exRating: 'ATEX Zone 1',
        certifications: { 'API 7-1': true },
        countryOfOrigin: 'USA', hsCode: '8207.70.00', minOrderQty: 1, leadTimeDays: 30, incoterms: 'EXW',
        manufacturerName: 'Smith Bits',
      },
    },
    // ===== MIDSTREAM =====
    {
      vendorId: flowctrl.id, vendorSku: 'FCI-BV-8-600-TRN-EL', oem: 'Velan', mpn: 'VEL-F-8-600-TRN',
      description: 'Trunnion-Mounted Ball Valve 8" CL600 RF Full Bore Electric Actuator EIM M2000',
      qtyAvailable: 6, qtyUom: 'pcs', status: 'available', shipFromLocation: 'Milan', shipFromCountry: 'Italy',
      earliestShipDate: new Date('2026-04-15'), condition: 'new', price: 18500, currency: 'USD',
      lastVerified, verificationMethod,
      spec: {
        sector: 'midstream', productFamily: 'Ball Valves', apiStandard: 'API 6D', astmStandard: 'ASTM A216 WCB',
        pressureRatingPsi: 1440, pressureClassAnsi: '600#', temperatureRatingMinC: -29, temperatureRatingMaxC: 200,
        materialGrade: 'ASTM A216 WCB', sizeNps: 8, sizeMm: 203.2, endConnection: 'Flanged RF',
        boreConfiguration: 'Full Bore', actuatorType: 'Electric',
        fluidService: 'Gas', isH2sService: false, naceCompliant: false, exRating: 'ATEX Zone 2',
        certifications: { 'API 6D': true, 'CE': true, 'PED': true, 'ATEX': true },
        countryOfOrigin: 'Italy', hsCode: '8481.80.39', minOrderQty: 1, leadTimeDays: 45, incoterms: 'DAP',
        manufacturerName: 'Velan',
      },
    },
    {
      vendorId: flowctrl.id, vendorSku: 'FCI-GV-16-900-OS-Y', oem: 'KSB', mpn: 'KSB-GV-16-900-OS-Y',
      description: 'Gate Valve 16" CL900 RTJ Full Bore OS&Y Gear Operated - Surplus Never Installed',
      qtyAvailable: 3, qtyUom: 'pcs', status: 'available', shipFromLocation: 'Dusseldorf', shipFromCountry: 'Germany',
      earliestShipDate: new Date('2026-03-20'), condition: 'surplus_new', price: 24000, currency: 'USD',
      lastVerified, verificationMethod,
      spec: {
        sector: 'midstream', productFamily: 'Gate Valves', apiStandard: 'API 600', astmStandard: 'ASTM A216 WCB',
        pressureRatingPsi: 2220, pressureClassAnsi: '900#', temperatureRatingMinC: -29, temperatureRatingMaxC: 427,
        materialGrade: 'ASTM A216 WCB / SS316 trim', sizeNps: 16, sizeMm: 406.4, endConnection: 'Flanged RTJ',
        boreConfiguration: 'Full Bore', actuatorType: 'Manual (Gear)',
        fluidService: 'Oil/Condensate', isH2sService: false, naceCompliant: false,
        certifications: { 'API 600': true, 'CE': true, 'PED': true },
        countryOfOrigin: 'Germany', hsCode: '8481.10.39', minOrderQty: 1, leadTimeDays: 60, incoterms: 'EXW',
        manufacturerName: 'KSB',
      },
    },
    {
      vendorId: pipetech.id, vendorSku: 'PLT-LR-ELB-12-XH-B31', oem: 'Bonney Forge', mpn: 'BF-LRELB-12-XH',
      description: 'Long Radius Elbow 12" SCH XH (0.500") 90° ASTM A234 WPB Butt Weld',
      qtyAvailable: 480, qtyUom: 'pcs', status: 'available', shipFromLocation: 'Shanghai', shipFromCountry: 'China',
      earliestShipDate: new Date('2026-03-05'), condition: 'new', price: 165, currency: 'USD',
      lastVerified, verificationMethod,
      spec: {
        sector: 'midstream', productFamily: 'Pipeline Fittings', astmStandard: 'ASTM A234 WPB', otherStandard: 'ASME B16.9',
        temperatureRatingMinC: -29, temperatureRatingMaxC: 343, materialGrade: 'ASTM A234 WPB',
        sizeNps: 12, sizeMm: 323.85, wallThicknessIn: 0.5, endConnection: 'Butt Weld',
        isH2sService: false, naceCompliant: false,
        certifications: { 'ASME B16.9': true, 'ASTM A234': true },
        countryOfOrigin: 'China', hsCode: '7307.93.90', minOrderQty: 1, leadTimeDays: 14, incoterms: 'FOB',
        manufacturerName: 'Bonney Forge',
      },
    },
    {
      vendorId: pipetech.id, vendorSku: 'PLT-FLNG-10-600-RF-A105', oem: 'Galperti', mpn: 'GP-WN-10-600-RF',
      description: 'Weld Neck Flange 10" CL600 RF Bore to Match Sch STD ASTM A105',
      qtyAvailable: 72, qtyUom: 'pcs', status: 'available', shipFromLocation: 'Borgomanero', shipFromCountry: 'Italy',
      earliestShipDate: new Date('2026-03-10'), condition: 'new', price: 295, currency: 'USD',
      lastVerified, verificationMethod,
      spec: {
        sector: 'midstream', productFamily: 'Pipeline Fittings', astmStandard: 'ASTM A105', otherStandard: 'ASME B16.5',
        pressureRatingPsi: 1440, pressureClassAnsi: '600#', temperatureRatingMinC: -29, temperatureRatingMaxC: 427,
        materialGrade: 'ASTM A105', sizeNps: 10, sizeMm: 273.05, endConnection: 'Flanged RF',
        isH2sService: false, naceCompliant: false,
        certifications: { 'ASME B16.5': true, 'ASTM A105': true },
        countryOfOrigin: 'Italy', hsCode: '7307.91.90', minOrderQty: 1, leadTimeDays: 30, incoterms: 'EXW',
        manufacturerName: 'Galperti',
      },
    },
    {
      vendorId: cmphub.id, vendorSku: 'CMH-RECIP-PARTS-SK', oem: 'Ariel Corporation', mpn: 'ARI-SK-JGC-4-RPM',
      description: 'Piston Rod Packing Set JGC/4 Ariel Compressor Complete Kit (OEM)',
      qtyAvailable: 10, qtyUom: 'set', status: 'available', shipFromLocation: 'Mount Vernon, OH', shipFromCountry: 'USA',
      earliestShipDate: new Date('2026-02-28'), condition: 'new', price: 3200, currency: 'USD',
      lastVerified, verificationMethod,
      spec: {
        sector: 'midstream', productFamily: 'Compressors', apiStandard: 'API 618',
        materialGrade: 'PTFE / Carbon composite', fluidService: 'Gas',
        isH2sService: false, naceCompliant: false, exRating: 'ATEX Zone 1',
        certifications: { 'API 618': true },
        countryOfOrigin: 'USA', hsCode: '8414.90.00', minOrderQty: 1, leadTimeDays: 21, incoterms: 'EXW',
        manufacturerName: 'Ariel Corporation',
      },
    },
    {
      vendorId: metertech.id, vendorSku: 'MTS-USM-12-FISCAL', oem: 'Emerson', mpn: 'EM-3411-12-FISCAL',
      description: 'Ultrasonic Flow Meter 12" CL300 RF Fiscal Grade 4-Path Multipath - AGA-9',
      qtyAvailable: 2, qtyUom: 'pcs', status: 'available', shipFromLocation: 'Emerson Essen', shipFromCountry: 'Germany',
      earliestShipDate: new Date('2026-05-01'), condition: 'new', price: 67000, currency: 'USD',
      lastVerified, verificationMethod,
      spec: {
        sector: 'midstream', productFamily: 'Metering & Fiscal', apiStandard: 'AGA-9', otherStandard: 'OIML R137',
        pressureRatingPsi: 740, pressureClassAnsi: '300#', temperatureRatingMinC: -40, temperatureRatingMaxC: 80,
        materialGrade: 'Carbon Steel body / SS internals', sizeNps: 12, sizeMm: 323.85, endConnection: 'Flanged RF',
        fluidService: 'Gas (Natural)', isH2sService: false, naceCompliant: false, exRating: 'ATEX Zone 1',
        certifications: { 'AGA-9': true, 'OIML R137': true, 'ATEX': true, 'NTEP': true },
        countryOfOrigin: 'Germany', hsCode: '9028.10.10', minOrderQty: 1, leadTimeDays: 120, incoterms: 'CIF',
        manufacturerName: 'Emerson',
      },
    },
    // ===== DOWNSTREAM =====
    {
      vendorId: heatex.id, vendorSku: 'HEX-SHELL-TUBE-600M2', oem: 'Alfa Laval', mpn: 'AL-TS6-M-600',
      description: 'Shell & Tube Heat Exchanger TEMA BEM 600m² CS Shell / SS316L Tubes',
      qtyAvailable: 1, qtyUom: 'pcs', status: 'available', shipFromLocation: 'Dusseldorf', shipFromCountry: 'Germany',
      earliestShipDate: new Date('2026-08-01'), condition: 'new', price: 185000, currency: 'USD',
      lastVerified, verificationMethod,
      spec: {
        sector: 'downstream', productFamily: 'Heat Exchangers', astmStandard: 'ASTM A516 Gr70 / ASTM A269 TP316L',
        otherStandard: 'ASME VIII Div.1 / TEMA C', pressureRatingPsi: 435, pressureClassAnsi: '300#',
        temperatureRatingMinC: -10, temperatureRatingMaxC: 250, materialGrade: 'CS A516-70 / SS316L',
        endConnection: 'Flanged', fluidService: 'Hydrocarbons', isH2sService: false, naceCompliant: false,
        exRating: 'ATEX Zone 2',
        certifications: { 'ASME VIII': true, 'TEMA C': true, 'PED': true, 'CE': true },
        countryOfOrigin: 'Germany', hsCode: '8419.50.20', minOrderQty: 1, leadTimeDays: 180, incoterms: 'DAP',
        manufacturerName: 'Alfa Laval',
      },
    },
    {
      vendorId: vesselwk.id, vendorSku: 'VW-PV-ASME-150BAR', oem: 'Pressure Fab Ltd', mpn: 'PFL-PV-2500L-150',
      description: 'Pressure Vessel Horizontal ASME VIII Div.1 2500L 150 barg CS+Stainless Clad NB Stamped',
      qtyAvailable: 1, qtyUom: 'pcs', status: 'available', shipFromLocation: 'Aberdeen', shipFromCountry: 'UK',
      earliestShipDate: new Date('2026-09-15'), condition: 'new', price: 145000, currency: 'USD',
      lastVerified, verificationMethod,
      spec: {
        sector: 'downstream', productFamily: 'Pressure Vessels & Reactors',
        astmStandard: 'ASTM A516 Gr70 + SS316L clad', otherStandard: 'ASME VIII Div.1',
        pressureRatingPsi: 2175, pressureClassAnsi: '1500#', temperatureRatingMinC: -10, temperatureRatingMaxC: 300,
        materialGrade: 'ASTM A516 Gr70 / SS316L', endConnection: 'Flanged',
        fluidService: 'Hydrocarbons/Steam', isH2sService: false, naceCompliant: false, exRating: 'ATEX Zone 2',
        certifications: { 'ASME VIII': true, 'PED': true, 'CE': true, 'NB Stamped': true },
        countryOfOrigin: 'UK', hsCode: '8419.89.30', minOrderQty: 1, leadTimeDays: 240, incoterms: 'EXW',
        manufacturerName: 'Pressure Fab Ltd',
      },
    },
    {
      vendorId: pumpserv.id, vendorSku: 'PSI-CENT-API610-14BB', oem: 'Sulzer', mpn: 'SUL-BB2-14-150-2P',
      description: 'Centrifugal Pump API 610 BB2 14" Impeller 150 m³/h 200m TDH 2-Stage - Surplus',
      qtyAvailable: 2, qtyUom: 'pcs', status: 'available', shipFromLocation: 'Winterthur', shipFromCountry: 'Switzerland',
      earliestShipDate: new Date('2026-04-30'), condition: 'surplus_new', price: 98000, currency: 'USD',
      lastVerified, verificationMethod,
      spec: {
        sector: 'downstream', productFamily: 'Refinery Pumps', apiStandard: 'API 610', astmStandard: 'ASTM A216 WCB',
        materialGrade: 'ASTM A216 WCB + SS316 impeller', endConnection: 'Flanged', actuatorType: 'Electric',
        fluidService: 'Hydrocarbons (Light crude/Diesel)', isH2sService: false, naceCompliant: false,
        exRating: 'ATEX Zone 1',
        certifications: { 'API 610': true, 'ATEX': true, 'CE': true },
        countryOfOrigin: 'Switzerland', hsCode: '8413.70.29', minOrderQty: 1, leadTimeDays: 90, incoterms: 'EXW',
        manufacturerName: 'Sulzer',
      },
    },
    {
      vendorId: instctrl.id, vendorSku: 'IC-PT-SMART-4-20', oem: 'Honeywell', mpn: 'HON-STG-800-H',
      description: 'Smart DP Pressure Transmitter HART/FF SIL 2 Range 0-40 bar SS316L wetted parts',
      qtyAvailable: 45, qtyUom: 'pcs', status: 'available', shipFromLocation: 'Houston, TX', shipFromCountry: 'USA',
      earliestShipDate: new Date('2026-03-01'), condition: 'new', price: 1850, currency: 'USD',
      lastVerified, verificationMethod,
      spec: {
        sector: 'downstream', productFamily: 'Instrumentation & Analyzers',
        pressureRatingPsi: 580, temperatureRatingMaxC: 85,
        materialGrade: '316L SS wetted parts', endConnection: '2" NPT Male',
        fluidService: 'Liquids/Gas/Steam', isH2sService: false, naceCompliant: false, exRating: 'ATEX Zone 1',
        certifications: { 'SIL 2': true, 'ATEX': true, 'IECEx': true, 'HART 7': true },
        countryOfOrigin: 'USA', hsCode: '9026.20.40', minOrderQty: 1, leadTimeDays: 21, incoterms: 'EXW',
        manufacturerName: 'Honeywell',
      },
    },
    {
      vendorId: instctrl.id, vendorSku: 'IC-CTRL-VALVE-4-PN40', oem: 'Flowserve', mpn: 'FLS-CV-4-PN40-POSIT',
      description: 'Globe Control Valve 4" PN40 Equal % SS Trim Pneumatic Actuator + HART Positioner',
      qtyAvailable: 3, qtyUom: 'pcs', status: 'available', shipFromLocation: 'Lynchburg, VA', shipFromCountry: 'USA',
      earliestShipDate: new Date('2026-03-20'), condition: 'new', price: 11500, currency: 'USD',
      lastVerified, verificationMethod,
      spec: {
        sector: 'downstream', productFamily: 'Instrumentation & Analyzers', otherStandard: 'ISA S75.01',
        astmStandard: 'ASTM A216 WCB', pressureRatingPsi: 580, pressureClassAnsi: 'PN40',
        temperatureRatingMinC: -40, temperatureRatingMaxC: 200,
        materialGrade: 'A216 WCB body / SS316 trim', sizeNps: 4, sizeMm: 114.3, endConnection: 'Flanged PN40',
        actuatorType: 'Pneumatic', fluidService: 'Steam/Liquids', isH2sService: false, naceCompliant: false,
        exRating: 'ATEX Zone 2',
        certifications: { 'SIL 2': true, 'ATEX': true, 'PED': true, 'CE': true },
        countryOfOrigin: 'USA', hsCode: '8481.20.10', minOrderQty: 1, leadTimeDays: 60, incoterms: 'EXW',
        manufacturerName: 'Flowserve',
      },
    },
    {
      vendorId: tanktech.id, vendorSku: 'TTK-ST-FLOAT-ROOF-API650', oem: 'TIW', mpn: 'TIW-EFR-5000M3',
      description: 'External Floating Roof Storage Tank API 650 5000 m³ 30m Dia Carbon Steel',
      qtyAvailable: 1, qtyUom: 'pcs', status: 'available', shipFromLocation: 'Dubai', shipFromCountry: 'UAE',
      earliestShipDate: new Date('2026-02-15'), condition: 'new', price: 980000, currency: 'USD',
      lastVerified, verificationMethod,
      spec: {
        sector: 'downstream', productFamily: 'Storage Tanks', apiStandard: 'API 650', otherStandard: 'NFPA 30',
        materialGrade: 'ASTM A36 Carbon Steel',
        fluidService: 'Crude Oil/Fuel', isH2sService: false, naceCompliant: false,
        certifications: { 'API 650': true, 'NFPA 30': true },
        countryOfOrigin: 'UAE', hsCode: '7309.00.51', minOrderQty: 1, leadTimeDays: 365, incoterms: 'DDP',
        manufacturerName: 'TIW',
      },
    },
    // ===== CONSUMER / GENERAL =====
    {
      vendorId: safetyfg.id, vendorSku: 'SFG-PPE-SCBA-AIR', oem: 'Scott Safety', mpn: 'SS-AP50-SCBA',
      description: 'SCBA Self-Contained Breathing Apparatus 45-min Air Cylinder EN137 ATEX Zone 1',
      qtyAvailable: 14, qtyUom: 'pcs', status: 'available', shipFromLocation: 'Manchester', shipFromCountry: 'UK',
      earliestShipDate: new Date('2026-03-01'), condition: 'new', price: 1850, currency: 'USD',
      lastVerified, verificationMethod,
      spec: {
        sector: 'consumer', productFamily: 'Safety & PPE',
        temperatureRatingMinC: -20, temperatureRatingMaxC: 60,
        fluidService: 'Gas/Hazardous Atmosphere', isH2sService: false, naceCompliant: false, exRating: 'ATEX Zone 1',
        certifications: { 'EN 137': true, 'NIOSH': true, 'CE': true },
        countryOfOrigin: 'UK', hsCode: '9020.00.00', minOrderQty: 1, leadTimeDays: 14, incoterms: 'DAP',
        manufacturerName: 'Scott Safety',
      },
    },
    {
      vendorId: safetyfg.id, vendorSku: 'SFG-FGD-FIXED-H2S', oem: 'MSA Safety', mpn: 'MSA-ULTIMA-H2S',
      description: 'Fixed H2S Gas Detector 4-20mA Electrochemical Cell Weatherproof IP66 ATEX Zone 1',
      qtyAvailable: 25, qtyUom: 'pcs', status: 'available', shipFromLocation: 'Berlin', shipFromCountry: 'Germany',
      earliestShipDate: new Date('2026-03-05'), condition: 'new', price: 1650, currency: 'USD',
      lastVerified, verificationMethod,
      spec: {
        sector: 'consumer', productFamily: 'Fire & Gas Detection',
        temperatureRatingMinC: -40, temperatureRatingMaxC: 60,
        materialGrade: 'Aluminium housing / SS316 cell',
        fluidService: 'H2S (0-100 ppm)', isH2sService: true, naceCompliant: false, exRating: 'ATEX Zone 1',
        certifications: { 'ATEX': true, 'IECEx': true, 'SIL 2': true, 'EN 60079': true, 'IP66': true },
        countryOfOrigin: 'Germany', hsCode: '9027.10.10', minOrderQty: 1, leadTimeDays: 14, incoterms: 'EXW',
        manufacturerName: 'MSA Safety',
      },
    },
    {
      vendorId: liftsafe.id, vendorSku: 'LSE-SLING-WR-20T', oem: 'Pewag', mpn: 'PEW-WR-20T-4LEG',
      description: 'Wire Rope Sling 4-Leg 20-Tonne SWL 7m EN 13414-1 Galvanized Crosby Shackles',
      qtyAvailable: 15, qtyUom: 'pcs', status: 'available', shipFromLocation: 'Warsaw', shipFromCountry: 'Poland',
      earliestShipDate: new Date('2026-03-10'), condition: 'new', price: 2800, currency: 'USD',
      lastVerified, verificationMethod,
      spec: {
        sector: 'consumer', productFamily: 'Lifting & Rigging',
        otherStandard: 'EN 13414-1 / LOLER', temperatureRatingMinC: -20, temperatureRatingMaxC: 200,
        materialGrade: '6x36 IWRC galvanized steel',
        fluidService: 'General Lifting', isH2sService: false, naceCompliant: false,
        certifications: { 'EN 13414-1': true, 'LOLER': true },
        countryOfOrigin: 'Poland', hsCode: '7326.90.98', minOrderQty: 1, leadTimeDays: 21, incoterms: 'EXW',
        manufacturerName: 'Pewag',
      },
    },
    {
      vendorId: lubriserv.id, vendorSku: 'LBS-GREASE-HT-NLGI2', oem: 'Castrol', mpn: 'CAS-MOLUB-3000-NLGI2',
      description: 'High Temperature Bearing Grease NLGI Grade 2 180°C continuous Lithium Complex 18kg pail',
      qtyAvailable: 180, qtyUom: 'pail', status: 'available', shipFromLocation: 'Antwerp', shipFromCountry: 'Belgium',
      earliestShipDate: new Date('2026-02-20'), condition: 'new', price: 185, currency: 'USD',
      lastVerified, verificationMethod,
      spec: {
        sector: 'consumer', productFamily: 'Lubricants',
        otherStandard: 'DIN 51825', temperatureRatingMinC: -30, temperatureRatingMaxC: 180,
        materialGrade: 'Lithium Complex base', hazardClass: '9', unNumber: 'UN1950',
        fluidService: 'Bearing/Mechanical', isH2sService: false, naceCompliant: false, exRating: 'ATEX Zone 2',
        certifications: { 'REACH': true, 'DIN 51825': true, 'NLGI 2': true },
        countryOfOrigin: 'Belgium', hsCode: '2710.19.35', minOrderQty: 6, leadTimeDays: 7, incoterms: 'DAP',
        manufacturerName: 'Castrol',
      },
    },
    {
      vendorId: electropw.id, vendorSku: 'EPS-EXPL-DIST-PANEL-ATEX', oem: 'Eaton', mpn: 'EAT-EXFL-6W-115',
      description: 'ATEX Zone 1 Explosion-Proof Distribution Panel 6-Way 63A 115/230V TPN GRP IP66',
      qtyAvailable: 3, qtyUom: 'pcs', status: 'available', shipFromLocation: 'Dublin', shipFromCountry: 'Ireland',
      earliestShipDate: new Date('2026-04-01'), condition: 'new', price: 5800, currency: 'USD',
      lastVerified, verificationMethod,
      spec: {
        sector: 'consumer', productFamily: 'Electrical & Lighting',
        otherStandard: 'EN 60079-0', temperatureRatingMinC: -40, temperatureRatingMaxC: 55,
        materialGrade: 'GRP enclosure / SS316 hardware',
        fluidService: 'Hazardous Area Electrical', isH2sService: false, naceCompliant: false, exRating: 'ATEX Zone 1',
        certifications: { 'ATEX': true, 'IECEx': true, 'EN 60079-0': true, 'IP66': true },
        countryOfOrigin: 'Ireland', hsCode: '8537.10.99', minOrderQty: 1, leadTimeDays: 60, incoterms: 'EXW',
        manufacturerName: 'Eaton',
      },
    },
  ];

  let created = 0;
  let skipped = 0;

  for (const item of items) {
    const { spec, ...itemData } = item;

    // Check if item already exists
    const existing = await prisma.inventoryItem.findFirst({
      where: { vendorId: itemData.vendorId, vendorSku: itemData.vendorSku },
    });

    if (existing) {
      skipped++;
      continue;
    }

    await prisma.inventoryItem.create({
      data: {
        ...itemData,
        qtyAvailable: itemData.qtyAvailable,
        price: itemData.price,
        oilGasSpec: { create: spec },
      },
    });
    created++;
  }

  console.log(`Done. Created: ${created}, Skipped (already exist): ${skipped}`);
}

main()
  .catch(e => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
